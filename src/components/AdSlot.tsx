import { useEffect, useRef, useState } from 'react';
import { SLOTS, adPreview, adTest, adsEnabled, loadAdsense, PUBLISHER_ID, type SlotName } from '../lib/ads';

/**
 * One ad position.
 *
 * Renders nothing at all until a publisher id and a slot id are configured, so
 * an unconfigured site is not carrying holes where ads will one day go. Adding
 * `?adpreview=1` to the URL draws the outline instead, at the exact size the
 * real unit will take — the layout can be checked without an AdSense account,
 * and without anyone else ever seeing it.
 *
 * An ad that fails to fill leaves an empty frame behind, so a slot that reports
 * nothing rendered removes itself rather than holding open a gap.
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
