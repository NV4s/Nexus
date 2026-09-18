import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion, readQualityPreference } from '../lib/quality';

/** One file for every device: the full clip at 60 fps. The still is only for
 *  visitors who asked for less motion, or if the video cannot play at all. */
const VIDEO = '/bg/background.mp4';
const STILL = '/bg/background.jpg';

const holdStill = () =>
  document.documentElement.dataset.motion === 'reduced' ||
  prefersReducedMotion() ||
  readQualityPreference() === 'low';

export default function BackgroundVideo() {
  const [still, setStill] = useState(holdStill);
  const [failed, setFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const update = () => setStill(holdStill());
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
    if (still || failed || !el) return;

    const resume = () => {
      if (document.visibilityState === 'visible' && el.paused) el.play().catch(() => {});
    };

    const keepPlaying = window.setInterval(resume, 1000);
    document.addEventListener('visibilitychange', resume);
    return () => {
      window.clearInterval(keepPlaying);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [still, failed]);

  return (
    <div className="bg-video" aria-hidden="true">
      {still || failed ? (
        <img src={STILL} alt="" />
      ) : (
        <video
          ref={(el) => {
            video.current = el;
            if (!el) return;
            el.muted = true;
            el.play().catch(() => {});
          }}
          src={VIDEO}
          poster={STILL}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
          onError={() => setFailed(true)}
          onEnded={(event) => {
            event.currentTarget.currentTime = 0;
            event.currentTarget.play().catch(() => {});
          }}
        />
      )}
    </div>
  );
}
