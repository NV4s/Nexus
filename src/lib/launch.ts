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
  doc.body.style.cssText = 'margin:0;background:#000';

  const frame = doc.createElement('iframe');
  frame.src = url;
  frame.allow = 'fullscreen; autoplay; gamepad; clipboard-write';
  frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:none';
  doc.body.append(frame);

  // Styles are inline because this document never sees the app's stylesheet.
  const button = doc.createElement('button');
  button.textContent = 'Fullscreen';
  button.style.cssText =
    'position:fixed;top:12px;right:12px;z-index:9;padding:8px 14px;border:0;' +
    'border-radius:8px;background:rgba(20,20,24,.75);color:#fff;font:500 13px/1 system-ui,sans-serif;' +
    'cursor:pointer;backdrop-filter:blur(8px)';
  button.onclick = () => {
    frame.requestFullscreen?.();
    button.remove();
  };
  doc.body.append(button);

  if (redirectThisTabTo) window.location.replace(redirectThisTabTo);
  return true;
}
