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

/* ---------- what the key actually does ---------- */

export type PanicMode = 'replace' | 'newtab';

export const readPanicMode = (): PanicMode =>
  localStorage.getItem('panicMode') === 'newtab' ? 'newtab' : 'replace';

export const writePanicMode = (mode: PanicMode) => localStorage.setItem('panicMode', mode);

/**
 * Leaves the site.
 *
 * `replace` swaps this tab for the panic link. It leaves no forward history
 * entry, but the tab keeps its back history — pressing Back returns here.
 *
 * `newtab` opens the link in a fresh tab and blanks this one. That is as close
 * to "delete the tab" as a page can get: a script may only close a window it
 * opened itself, so window.close() is attempted and silently ignored otherwise.
 * The blank tab that remains carries no trace of the site in its address bar,
 * and its history is replaced rather than pushed.
 */
export function panic(link = readLink(), mode = readPanicMode()) {
  if (mode === 'newtab') {
    const opened = window.open(link, '_blank', 'noopener');
    // Blanking first means that even if the popup is blocked, this tab no longer
    // shows the site — the worse failure is being left on it.
    window.location.replace('about:blank');
    // Only succeeds for a script-opened window; harmless everywhere else.
    if (opened) window.close();
    return;
  }
  window.location.replace(link);
}
