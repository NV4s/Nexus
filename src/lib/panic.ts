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
 * Closes the tab this page is running in, if the browser will allow it.
 *
 * A script may only close a window that a script opened. That is never true of
 * the tab the site is loaded into directly — but it is true of the one
 * `openCloaked` in lib/launch.ts makes: an about:blank tab opened with
 * window.open, with the app in an iframe inside it. That parent was
 * script-opened, so it can close, and because a script-created about:blank
 * inherits its opener's origin, this frame is allowed to reach it.
 *
 * So the call that matters is parent.close(), not close(). Anywhere else it
 * either throws (cross-origin) or does nothing (a tab the user opened), which
 * is why the caller still needs a fallback.
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
 * `replace` swaps this tab for the panic link. It leaves no forward history
 * entry, but the tab keeps its back history — pressing Back returns here.
 *
 * `newtab` opens the link in a fresh tab and gets rid of this one. Closing is
 * tried first and blanking is the fallback, in that order: the previous version
 * blanked before closing, which guaranteed a leftover blank tab even on the
 * path where the close would have worked. Launching through Settings → "Open
 * cloaked" is what makes the close succeed.
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
