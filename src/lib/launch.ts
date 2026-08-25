import type { Game } from '../data/games';
import { navigate } from './router';

/**
 * Sites that send X-Frame-Options have no working player page — they open in a
 * tab. Everything else plays in the app. Shared so the grid and a deep link to
 * /game/<slug> agree; when only the grid knew, deep links rendered a dead frame.
 */
export const openGame = (game: Game) =>
  game.newTab ? window.open(game.src, '_blank', 'noopener') : navigate(`/game/${game.slug}`);

/**
 * Opens `url` inside an about:blank tab, so the address bar shows nothing and
 * history records no destination.
 *
 * Fullscreen cannot be entered for the caller: it needs a user gesture inside
 * the new tab, so the tab carries its own button. Returns false when the popup
 * was blocked, which is the only failure the caller can do anything about.
 */
export function openCloaked(url: string, redirectThisTabTo?: string): boolean {
  const win = window.open('about:blank', '_blank');
  if (!win) return false;

  const doc = win.document;
  doc.title = 'New Tab';
  doc.body.style.cssText = 'margin:0;background:#000;overflow:hidden';

  const frame = doc.createElement('iframe');
  frame.src = url;
  frame.allow = 'fullscreen; autoplay; gamepad; clipboard-write';
  frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:none';
  doc.body.append(frame);

  // Styles are inline because this document never sees the app's stylesheet.
  //
  // Browsers only grant fullscreen from a gesture inside *this* tab, and opening
  // the tab happened in the other one — so it cannot be automatic. The next best
  // thing is making the whole page the button, so the one required click is
  // anywhere rather than on something the player has to find.
  const cover = doc.createElement('div');
  cover.style.cssText =
    'position:fixed;inset:0;z-index:9;display:grid;place-items:center;cursor:pointer;' +
    'background:rgba(0,0,0,.55);color:#fff;font:500 15px/1.5 system-ui,sans-serif;text-align:center';
  cover.innerHTML =
    '<div><div style="font-size:19px;margin-bottom:6px">Click anywhere to play fullscreen</div>' +
    '<div style="opacity:.65;font-size:13px">or press Esc to skip and play in the tab</div></div>';

  const dismiss = () => {
    cover.remove();
    doc.removeEventListener('keydown', onKey);
  };

  const enter = () => {
    // Fullscreen the whole document, not the frame: the frame already fills the
    // viewport, and the document is what Esc returns you from cleanly.
    doc.documentElement.requestFullscreen?.().catch(() => {});
    dismiss();
  };

  // Esc skips fullscreen rather than leaving the prompt sitting over the game.
  // Listening on the parent document only works until the frame takes focus, so
  // the frame gets the same handler where same-origin access allows it.
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') dismiss();
  };
  doc.addEventListener('keydown', onKey);
  frame.addEventListener('load', () => {
    try {
      frame.contentDocument?.addEventListener('keydown', onKey);
    } catch {
      /* cross-origin frame — the parent handler is all we get */
    }
  });

  cover.addEventListener('click', enter, { once: true });
  doc.body.append(cover);
  // The cover holds focus so Esc reaches the handler before the game claims it.
  cover.tabIndex = -1;
  cover.focus();

  if (redirectThisTabTo) window.location.replace(redirectThisTabTo);
  return true;
}
