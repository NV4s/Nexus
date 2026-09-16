import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion, readQualityPreference } from '../lib/quality';

type Source = 'full' | 'light' | 'still';

const SOURCES = { full: '/bg/background.mp4', light: '/bg/background-light.mp4' };
const FIRST_FRAME_GRACE = { full: 12000, light: 30000 };
const STALL_LIMIT = 6000;

type Hardware = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

const holdStill = () =>
  document.documentElement.dataset.motion === 'reduced' ||
  prefersReducedMotion() ||
  readQualityPreference() === 'low';

const pick = (): Source => {
  if (holdStill()) return 'still';
  const nav = navigator as Hardware;
  const slowLink = Boolean(nav.connection?.saveData) || /2g|3g/.test(nav.connection?.effectiveType ?? '');
  const modest =
    /CrOS/.test(nav.userAgent) || (nav.deviceMemory ?? 8) <= 4 || (nav.hardwareConcurrency ?? 8) <= 4;
  return slowLink || modest ? 'light' : 'full';
};

export default function BackgroundVideo() {
  const [source, setSource] = useState<Source>(pick);
  const video = useRef<HTMLVideoElement>(null);

  const downgrade = () => setSource((current) => (current === 'full' ? 'light' : 'still'));

  useEffect(() => {
    const update = () => setSource((current) => (holdStill() ? 'still' : current === 'still' ? pick() : current));
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener('change', update);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    const el = video.current;
    if (source === 'still' || !el) return;

    const started = performance.now();
    let lastTime = -1;
    let stuckSince = 0;

    const resume = () => {
      if (document.visibilityState === 'visible' && el.paused) el.play().catch(() => {});
    };

    const watchdog = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        stuckSince = 0;
        return;
      }
      resume();
      if (el.currentTime !== lastTime) {
        lastTime = el.currentTime;
        stuckSince = 0;
        return;
      }
      const now = performance.now();
      if (el.currentTime === 0 && now - started < FIRST_FRAME_GRACE[source]) return;
      if (!stuckSince) stuckSince = now;
      if (now - stuckSince > STALL_LIMIT) downgrade();
    }, 1000);

    document.addEventListener('visibilitychange', resume);
    return () => {
      window.clearInterval(watchdog);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [source]);

  return (
    <div className="bg-video" aria-hidden="true">
      {source === 'still' ? (
        <img src="/bg/background.jpg" alt="" />
      ) : (
        <video
          key={source}
          ref={(el) => {
            video.current = el;
            if (!el) return;
            el.muted = true;
            el.play().catch(() => {});
          }}
          src={SOURCES[source]}
          poster="/bg/background.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
          onError={downgrade}
          onEnded={(event) => {
            event.currentTarget.currentTime = 0;
            event.currentTarget.play().catch(() => {});
          }}
        />
      )}
    </div>
  );
}
