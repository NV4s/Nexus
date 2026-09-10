export type Directive =
  | { blocked: true }
  | { troll: { kind: string; text: string; at: number } };

const STYLE_ID = 'nexus-mod-style';

function styles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes nexus-shake {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      20% { transform: translate(-6px, 3px) rotate(-.6deg); }
      40% { transform: translate(5px, -4px) rotate(.5deg); }
      60% { transform: translate(-4px, -3px) rotate(-.4deg); }
      80% { transform: translate(6px, 2px) rotate(.6deg); }
    }
    html.nexus-shake { animation: nexus-shake .35s infinite; }
    html.nexus-flip { transform: rotate(180deg); transition: transform .8s ease; }
    html.nexus-invert { filter: invert(1) hue-rotate(180deg); transition: filter .6s ease; }
    .nexus-mod-veil {
      position: fixed; inset: 0; z-index: 2147483647;
      display: grid; place-items: center; padding: 24px;
      background: rgba(6, 8, 13, .92); backdrop-filter: blur(6px);
      color: #e9ecf5; text-align: center;
      font: 15px/1.6 ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif;
    }
    .nexus-mod-card { max-width: 30rem; }
    .nexus-mod-card h2 { margin: 0 0 .5rem; font-size: 1.35rem; }
    .nexus-mod-card p { margin: 0 0 1.25rem; color: #a4adc4; white-space: pre-wrap; }
    .nexus-mod-card button {
      background: #3b82f6; color: #fff; border: 0; border-radius: 8px;
      padding: 9px 20px; font: inherit; font-weight: 600; cursor: pointer;
    }
  `;
  document.head.append(style);
}

function veil(title: string, body: string, dismiss?: () => void) {
  styles();
  const wrap = document.createElement('div');
  wrap.className = 'nexus-mod-veil';
  wrap.setAttribute('role', 'alertdialog');
  wrap.setAttribute('aria-modal', 'true');

  const card = document.createElement('div');
  card.className = 'nexus-mod-card';

  const heading = document.createElement('h2');
  heading.textContent = title;
  const text = document.createElement('p');
  text.textContent = body;
  card.append(heading, text);

  if (dismiss) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'OK';
    button.addEventListener('click', () => {
      wrap.remove();
      dismiss();
    });
    card.append(button);
  }

  wrap.append(card);
  document.body.append(wrap);
  return wrap;
}

let blockedAlready = false;

function block() {
  if (blockedAlready) return;
  blockedAlready = true;
  document.documentElement.classList.remove('nexus-shake', 'nexus-flip', 'nexus-invert');
  veil(
    'Blocked',
    'The owner of this site has blocked this browser. If you think that is a mistake, ask them to lift it.',
  );
}

function flash(className: string, ms: number) {
  styles();
  const root = document.documentElement;
  root.classList.add(className);
  window.setTimeout(() => root.classList.remove(className), ms);
}

export function applyDirective(directive: Directive) {
  if ('blocked' in directive) return block();

  const { kind, text } = directive.troll;
  if (kind === 'message') veil('A message from the owner', text || '👀', () => {});
  else if (kind === 'shake') flash('nexus-shake', 4000);
  else if (kind === 'flip') flash('nexus-flip', 7000);
  else if (kind === 'invert') flash('nexus-invert', 5000);
}
