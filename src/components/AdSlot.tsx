import { useEffect, useRef, useState } from 'react';
import { SLOTS, adPreview, adTest, adsEnabled, loadAdsense, PUBLISHER_ID, type SlotName } from '../lib/ads';

/**
 * One ad position. Renders nothing until both ids are configured; `?adpreview=1`
 * draws the outline at the real unit's size instead. A slot whose script is
 * blocked removes itself rather than holding open an empty frame.
 */
export default function AdSlot({ name, className = '' }: { name: SlotName; className?: string }) {
  const spec = SLOTS[name];
  const ref = useRef<HTMLModElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!adsEnabled() || !spec.id) return;
    let cancelled = false;

    loadAdsense()
      .then(() => {
        if (cancelled) return;
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
    };
  }, [name, spec.id]);

  if (failed) return null;

  const style = {
    // A fluid slot takes the width it is given; a fixed one reserves its own.
    width: spec.width === 'fluid' ? '100%' : spec.width,
    height: spec.height,
  };

  if (!adsEnabled() || !spec.id) {
    if (!adPreview()) return null;
    return (
      <div className={`ad-slot is-placeholder ${className}`} style={style} aria-hidden="true">
        <span>
          {spec.label}
          <em>{spec.width === 'fluid' ? 'responsive' : `${spec.width}×${spec.height}`}</em>
        </span>
      </div>
    );
  }

  return (
    <div className={`ad-slot ${className}`} style={style}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: spec.height }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={spec.id}
        data-ad-format={spec.width === 'fluid' ? 'auto' : undefined}
        data-full-width-responsive={spec.width === 'fluid' ? 'true' : undefined}
        data-adtest={adTest() ? 'on' : undefined}
      />
    </div>
  );
}
