import { useEffect, useState } from 'react';
import { K } from './keys.ts';

export const GRAPHICS = [
  { id: 'superlow', name: 'Super low' },
  { id: 'verylow', name: 'Very low' },
  { id: 'low', name: 'Low' },
  { id: 'normal', name: 'Normal' },
  { id: 'high', name: 'High' },
  { id: 'ultra', name: 'Ultra' },
] as const;

export type Graphics = (typeof GRAPHICS)[number]['id'];
export type QualityPreference = 'auto' | Graphics;

/** What each level changes. CSS reads the level from `data-gfx` on <html>. */
export type Profile = {
  background: 'video' | 'still' | 'none';
  /** The 3D intro and the home page particle field. */
  webgl: boolean;
  /** Highest device pixel ratio the 3D canvases render at. */
  dpr: number;
  particles: number;
  /** Bloom and chromatic aberration in the intro. */
  postfx: boolean;
  /** Intro detail depth; the shader adds nothing past 4. */
  layers: number;
  antialias: boolean;
  /** Cover art on game cards; without it a card is its title on a flat tile. */
  thumbs: boolean;
};

export const PROFILES: Record<Graphics, Profile> = {
  superlow: { background: 'none', webgl: false, dpr: 1, particles: 0, postfx: false, layers: 2, antialias: false, thumbs: false },
  verylow: { background: 'still', webgl: false, dpr: 1, particles: 0, postfx: false, layers: 2, antialias: false, thumbs: true },
  low: { background: 'still', webgl: true, dpr: 1, particles: 1200, postfx: false, layers: 2, antialias: false, thumbs: true },
  normal: { background: 'video', webgl: true, dpr: 1.5, particles: 4000, postfx: true, layers: 3, antialias: false, thumbs: true },
  high: { background: 'video', webgl: true, dpr: 2, particles: 9000, postfx: true, layers: 4, antialias: false, thumbs: true },
  ultra: { background: 'video', webgl: true, dpr: 3, particles: 16000, postfx: true, layers: 4, antialias: true, thumbs: true },
};

const LEVELS: readonly string[] = GRAPHICS.map((level) => level.id);

export const readQualityPreference = (): QualityPreference => {
  const raw = localStorage.getItem(K.quality) ?? '';
  return LEVELS.includes(raw) ? (raw as Graphics) : 'auto';
};

export const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Auto's starting point: a guess from memory and core count. */
function detectGraphics(): Graphics {
  if (prefersReducedMotion()) return 'low';
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  if (memory <= 2 || cores <= 2) return 'low';
  if (memory <= 4 || cores <= 4) return 'normal';
  return 'high';
}

export function resolveGraphics(): Graphics {
  const preference = readQualityPreference();
  return preference === 'auto' ? detectGraphics() : preference;
}

export const graphicsProfile = () => PROFILES[resolveGraphics()];

export function applyGraphics() {
  document.documentElement.dataset.gfx = resolveGraphics();
}

export function writeQualityPreference(value: QualityPreference) {
  localStorage.setItem(K.quality, value);
  applyGraphics();
}

export const dprFor = (profile: Profile) => Math.min(profile.dpr, devicePixelRatio);

const STEP_DOWN: Partial<Record<Graphics, Graphics>> = { ultra: 'high', high: 'normal', normal: 'low' };

/**
 * The profile a 3D canvas should use. On Auto it watches the first second of frames
 * and drops a level if they come slower than ~45 fps; a chosen level is left alone.
 */
export function useGraphicsProfile(): Profile {
  const [level, setLevel] = useState<Graphics>(resolveGraphics);

  useEffect(() => {
    if (prefersReducedMotion() || readQualityPreference() !== 'auto') return;
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
      if (elapsed / frames > 22) setLevel((current) => STEP_DOWN[current] ?? current);
    };

    raf = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(raf);
  }, []);

  return PROFILES[level];
}
