import type { Game } from '../data/games';
import { navigate } from './router';
import { readLink } from './panic';


export const CLOAK_TITLE = 'New Tab';

export const openGame = (game: Game) =>
  game.newTab ? window.open(game.src, '_blank', 'noopener') : navigate(`/game/${game.slug}`);


/**
 * Opens `url` framed inside an about:blank tab. `fullscreenPrompt` covers it with a
 * "click to play fullscreen" sheet — right for a single game, wrong for the whole site.
 */
export function openCloaked(url: string, redirectThisTabTo?: string, fullscreenPrompt = true): boolean {
  const win = window.open('about:blank', '_blank');
  if (!win) return false;

  const doc = win.document;
  doc.title = CLOAK_TITLE;
  doc.body.style.cssText = 'margin:0;background:#000;overflow:hidden';

  const frame = doc.createElement('iframe');
  frame.src = url;
  frame.allow = 'fullscreen; autoplay; gamepad; clipboard-write';
  frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:none';
  doc.body.append(frame);

  // Keys go to the site straight away, so the panic key works before the first click.
  if (fullscreenPrompt) addFullscreenPrompt(doc, frame);
  else frame.focus();

  if (redirectThisTabTo) window.location.replace(redirectThisTabTo);
  return true;
}


function addFullscreenPrompt(doc: Document, frame: HTMLIFrameElement) {
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
    doc.documentElement.requestFullscreen?.().catch(() => {});
    dismiss();
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') dismiss();
  };
  doc.addEventListener('keydown', onKey);
  frame.addEventListener('load', () => {
    try {
      frame.contentDocument?.addEventListener('keydown', onKey);
    } catch {}
  });

  cover.addEventListener('click', enter, { once: true });
  doc.body.append(cover);

  cover.tabIndex = -1;
  cover.focus();
}


const BLOCKED_ALERT =
  'Pop-ups are blocked. Allow pop-ups for this site using the icon at the right of the address bar, then press OK.';

/**
 * Moves the whole site into an about:blank tab on load and sends this tab to the
 * panic link. Returns true when that happened, so the caller can skip rendering a
 * page that is already on its way out.
 *
 * A blocked popup gets an alert. It pauses the page while pop-ups are allowed from
 * the address bar, and pressing OK tries again — no reload needed.
 */
export function cloakOnLoad(): boolean {
  // Already the framed copy (or the bare game player inside a blank tab).
  if (window.top !== window.self) return false;
  // Off under `vite dev` so every reload doesn't spawn a tab; `vite preview` runs it.
  if (import.meta.env.DEV) return false;

  const cloak = () => openCloaked(window.location.href, readLink(), false);
  if (cloak()) return true;
  alert(BLOCKED_ALERT);
  return cloak();
}

/** The document the browser tab shows: the about:blank wrapper when cloaked. */
export function tabDocument(): Document {
  try {
    return window.top!.document;
  } catch {
    return document;
  }
}
