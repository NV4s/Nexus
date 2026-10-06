import { K } from './keys.ts';

export type Theme = 'dark' | 'light' | 'midnight' | 'forest' | 'ember' | 'mono' | 'paper';

export const THEMES: { id: Theme; name: string; swatch: string }[] = [
  { id: 'dark', name: 'Dark', swatch: '#7cc4ff' },
  { id: 'light', name: 'Light', swatch: '#1e6fd9' },
  { id: 'midnight', name: 'Midnight', swatch: '#6f7bff' },
  { id: 'forest', name: 'Forest', swatch: '#e4b35c' },
  { id: 'ember', name: 'Ember', swatch: '#ff6a3d' },
  { id: 'mono', name: 'Mono', swatch: '#fafafa' },
  { id: 'paper', name: 'Paper', swatch: '#b2502a' },
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
