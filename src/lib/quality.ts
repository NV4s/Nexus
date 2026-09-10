import { useEffect, useState } from 'react';

export type Tier = 'low' | 'medium' | 'high';
export type QualityPreference = 'auto' | 'low';

export const readQualityPreference = (): QualityPreference =>
  localStorage.getItem('quality') === 'low' ? 'low' : 'auto';

export const writeQualityPreference = (value: QualityPreference) =>
  localStorage.setItem('quality', value);

const lower: Record<Tier, Tier> = { high: 'medium', medium: 'low', low: 'low' };

export const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;


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


export function useAdaptiveTier(): Tier {
  const [tier, setTier] = useState<Tier>(() =>
    readQualityPreference() === 'low' ? 'low' : detectTier(),
  );

  useEffect(() => {

    if (prefersReducedMotion() || readQualityPreference() === 'low') return;
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
