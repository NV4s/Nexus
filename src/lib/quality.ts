import { useEffect, useState } from 'react';

export type Tier = 'low' | 'medium' | 'high';

const lower: Record<Tier, Tier> = { high: 'medium', medium: 'low', low: 'low' };

export const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** First guess from what the device admits to. */
export function detectTier(): Tier {
  if (prefersReducedMotion()) return 'low';
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  if (memory <= 2 || cores <= 2) return 'low';
  if (memory <= 4 || cores <= 4) return 'medium';
  return 'high';
}

export const dprFor = (tier: Tier) =>
  tier === 'low' ? 1 : tier === 'medium' ? Math.min(1.5, devicePixelRatio) : Math.min(2, devicePixelRatio);

export const particlesFor = (tier: Tier) => ({ low: 1200, medium: 4000, high: 9000 })[tier];

/**
 * Device hints lie — a Chromebook reports 8 cores and still misses frame budget.
 * Sample real frame times for a second and drop a tier if we are over ~22ms.
 */
export function useAdaptiveTier(): Tier {
  const [tier, setTier] = useState<Tier>(detectTier);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frames = 0;
    let raf = 0;
    const start = performance.now();

    const sample = () => {
      frames += 1;
      const elapsed = performance.now() - start;
      if (elapsed < 1000) {
        raf = requestAnimationFrame(sample);
        return;
      }
      if (elapsed / frames > 22) setTier((current) => lower[current]);
    };

    raf = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(raf);
  }, []);

  return tier;
}
