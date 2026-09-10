export const DEFAULT_COMBO = 'ctrl+`';
export const DEFAULT_LINK = 'https://classroom.google.com';

const MODIFIER_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta']);


export function comboFrom(event: KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(event.key)) return null;
  const parts: string[] = [];
  if (event.ctrlKey) parts.push('ctrl');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  if (event.metaKey) parts.push('meta');


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

export type PanicMode = 'replace' | 'newtab';

export const readPanicMode = (): PanicMode =>
  localStorage.getItem('panicMode') === 'newtab' ? 'newtab' : 'replace';

export const writePanicMode = (mode: PanicMode) => localStorage.setItem('panicMode', mode);


function closeTab(): boolean {
  try {
    if (window.parent !== window) window.parent.close();
    else window.close();
  } catch {}
  return window.closed || window.parent.closed;
}


export function panic(link = readLink(), mode = readPanicMode()) {
  if (mode === 'newtab') {
    window.open(link, '_blank', 'noopener');
    if (closeTab()) return;



    window.location.replace('about:blank');
    return;
  }
  window.location.replace(link);
}
