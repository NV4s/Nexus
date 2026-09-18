import { K } from './keys.ts';

export type Theme = 'dark' | 'light' | 'midnight' | 'forest' | 'ember' | 'mono' | 'paper';

export const THEMES: { id: Theme; name: string; swatch: string }[] = [
  { id: 'dark', name: 'Dark', swatch: '#0c0f16' },
  { id: 'light', name: 'Light', swatch: '#f6f7fa' },
  { id: 'midnight', name: 'Midnight', swatch: '#0d1226' },
  { id: 'forest', name: 'Forest', swatch: '#0c1611' },
  { id: 'ember', name: 'Ember', swatch: '#170d0a' },
  { id: 'mono', name: 'Mono', swatch: '#131313' },
  { id: 'paper', name: 'Paper', swatch: '#fffdf8' },
];

const ids = new Set(THEMES.map((theme) => theme.id));


export function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(K.theme);
    return saved && ids.has(saved as Theme) ? (saved as Theme) : 'dark';
  } catch {
    return 'dark';
  }
}

export function writeTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(K.theme, theme);
  } catch {}
}
