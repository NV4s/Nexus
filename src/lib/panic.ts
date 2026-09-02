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

export type PanicMode = 'replace' | 'newtab';

export const readPanicMode = (): PanicMode =>
  localStorage.getItem('panicMode') === 'newtab' ? 'newtab' : 'replace';

export const writePanicMode = (mode: PanicMode) => localStorage.setItem('panicMode', mode);

/**
 * Closes the tab, if the browser will allow it.
 *
 * A script may only close a window a script opened — never the tab the site is
 * loaded into directly, but true of the about:blank tab `openCloaked` makes.
 * The app runs in an iframe inside it, and a script-created about:blank inherits
 * its opener's origin, so `parent.close()` is the call that works. Anywhere else
 * it throws or does nothing, hence the caller's fallback.
 */
function closeTab(): boolean {
  try {
    if (window.parent !== window) window.parent.close();
    else window.close();
  } catch {
    /* cross-origin parent — not ours to close */
  }
  return window.closed || window.parent.closed;
}

/**
 * Leaves the site.
 *
 * `replace` swaps this tab for the link; the back history survives it.
 * `newtab` opens the link elsewhere and gets rid of this tab — closing first,
 * blanking only if that fails, since blanking first leaves a stray tab even
 * when the close would have worked.
 */
export function panic(link = readLink(), mode = readPanicMode()) {
  if (mode === 'newtab') {
    window.open(link, '_blank', 'noopener');
    if (closeTab()) return;
    // Still here, so the tab cannot be closed. Blanking is second best: the
    // address bar keeps no trace of the site, and history is replaced rather
    // than pushed. Being left on the site is the worse failure.
    window.location.replace('about:blank');
    return;
  }
  window.location.replace(link);
}
