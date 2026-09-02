/**
 * Appearance knobs that sit on top of the theme: an accent colour, a text size
 * and an explicit motion switch.
 *
 * Each is written as a CSS custom property on the root element, so it layers
 * over whichever theme is active rather than replacing it — pick Forest and a
 * pink accent and you get Forest with a pink accent.
 */
export type Appearance = {
  /** Empty means "whatever the theme says". */
  accent: string;
  /** Root font size in pixels. 16 is the browser default. */
  textSize: number;
  /** Honours the system setting when 'auto'. */
  motion: 'auto' | 'reduced';
};

export const DEFAULT_APPEARANCE: Appearance = { accent: '', textSize: 16, motion: 'auto' };

export const ACCENTS = [
  { id: '', name: 'Theme' },
  { id: '#7cc4ff', name: 'Blue' },
  { id: '#8b8bff', name: 'Violet' },
  { id: '#5fd08a', name: 'Green' },
  { id: '#ff8a5c', name: 'Orange' },
  { id: '#ff7ba8', name: 'Pink' },
  { id: '#ffd166', name: 'Amber' },
];

export const TEXT_SIZES = [14, 15, 16, 17, 18, 20];

const KEY = 'nexus:appearance';

export function readAppearance(): Appearance {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_APPEARANCE, ...(JSON.parse(raw) as Partial<Appearance>) } : DEFAULT_APPEARANCE;
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

/**
 * An accent needs a readable colour on top of it, and the themes disagree about
 * which. Relative luminance decides: light accents take dark ink, dark ones take
 * white. Otherwise a pale amber button gets white text on it and disappears.
 */
function inkFor(accent: string): string {
  const hex = accent.replace('#', '');
  if (hex.length !== 6) return '';
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  return luminance > 0.45 ? '#0a0d14' : '#ffffff';
}

export function applyAppearance(appearance: Appearance) {
  const root = document.documentElement;
  if (appearance.accent) {
    root.style.setProperty('--accent', appearance.accent);
    root.style.setProperty('--accent-ink', inkFor(appearance.accent));
  } else {
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-ink');
  }
  root.style.fontSize = `${appearance.textSize}px`;
  root.dataset.motion = appearance.motion;
}

export function writeAppearance(appearance: Appearance) {
  applyAppearance(appearance);
  try {
    localStorage.setItem(KEY, JSON.stringify(appearance));
  } catch {
    /* still applied for this visit */
  }
}
