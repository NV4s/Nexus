export const DEFAULT_COMBO = 'ctrl+`';
export const DEFAULT_LINK = 'https://classroom.google.com';

const MODIFIER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta']);

/** 'ctrl+shift+q' — order is fixed so string comparison is enough. */
export function comboFrom(event: KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(event.key)) return null;
  const parts: string[] = [];
  if (event.ctrlKey) parts.push('ctrl');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  if (event.metaKey) parts.push('meta');
  // A bare letter is not allowed: the old build redirected on a lone backtick,
  // which fired while typing in games.
  if (parts.length === 0) return null;
  parts.push(event.key.toLowerCase());
  return parts.join('+');
}

export const readCombo = () => localStorage.getItem('panicCombo') ?? DEFAULT_COMBO;
export const readLink = () => localStorage.getItem('panicLink') ?? DEFAULT_LINK;

export const label = (combo: string) =>
  combo
    .split('+')
    .map((part) => (part.length === 1 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1)))
    .join(' + ');
