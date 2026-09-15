import { useEffect, useState } from 'react';
import { prefersReducedMotion, readQualityPreference } from '../lib/quality';

const holdStill = () =>
  document.documentElement.dataset.motion === 'reduced' ||
  prefersReducedMotion() ||
  readQualityPreference() === 'low';

export default function BackgroundVideo() {
  const [still, setStill] = useState(holdStill);

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

  return (
    <div className="bg-video" aria-hidden="true">
      {still ? (
        <img src="/bg/background.jpg" alt="" />
      ) : (
        <video
          ref={(video) => {
            if (!video) return;
            video.muted = true;
            video.play().catch(() => {});
          }}
          src="/bg/background.mp4"
          poster="/bg/background.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
        />
      )}
    </div>
  );
}
