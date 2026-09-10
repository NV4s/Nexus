import type { Game } from '../data/games';
import { navigate } from './router';


export const openGame = (game: Game) =>
  game.newTab ? window.open(game.src, '_blank', 'noopener') : navigate(`/game/${game.slug}`);


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

  if (redirectThisTabTo) window.location.replace(redirectThisTabTo);
  return true;
}
