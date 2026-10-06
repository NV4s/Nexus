import { useEffect, useRef, useState } from 'react';
import { graphicsProfile, prefersReducedMotion } from '../lib/quality';

/** One file for every device: the full clip at 60 fps. The still is only for
 *  visitors who asked for less motion, or if the video cannot play at all. */
const VIDEO = '/bg/background.mp4';
const STILL = '/bg/background.jpg';

type Mode = 'video' | 'still' | 'none';

const mode = (): Mode => {
  const { background } = graphicsProfile();
  if (background !== 'video') return background;
  const reduced = document.documentElement.dataset.motion === 'reduced' || prefersReducedMotion();
  return reduced ? 'still' : 'video';
};

export default function BackgroundVideo() {
  const [current, setCurrent] = useState(mode);
  const still = current !== 'video';
  const [failed, setFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const update = () => setCurrent(mode());
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion', 'data-gfx'] });
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

  if (current === 'none') return null;

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
