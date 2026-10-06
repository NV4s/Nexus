import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';


import css from './index.css?inline';
import { migrateSaveKeys } from './lib/saves';
import { rescanAll } from './lib/achievements';
import { readTheme } from './lib/theme';
import { applyGraphics } from './lib/quality';
import { applyAppearance, readAppearance } from './lib/appearance';
import { migrateKeys } from './lib/keys.ts';
import { applyHead } from './lib/head.ts';
import { cloakOnLoad } from './lib/launch.ts';


// Storage names changed, so this has to run before anything reads a setting:
// on the first load after the rename the old names are all a visitor has.
migrateKeys(localStorage);
migrateKeys(sessionStorage);

// The site moves into about:blank before anything draws. This tab is then leaving for
// the panic link, so stop the module here: render nothing, count no visit.
if (cloakOnLoad()) throw new Error('cloaked: continuing in the about:blank tab');

applyHead();

document.documentElement.dataset.theme = readTheme();
applyAppearance(readAppearance());
applyGraphics();


migrateSaveKeys();


rescanAll();

const sheet = new CSSStyleSheet();
sheet.replaceSync(css);
document.adoptedStyleSheets = [sheet];




// Built here rather than sitting in index.html: a fresh random tag name every
// load means the page holds no stable selector to match on.
const token = () => Math.random().toString(36).slice(2, 8);
const host = document.createElement(`${token()}-${token()}`.replace(/^\d/, 'a'));
host.style.display = 'block';
document.body.append(host);

const shadow = host.attachShadow({ mode: 'closed' });
shadow.adoptedStyleSheets = [sheet];

const mount = document.createElement('div');
shadow.append(mount);

// The graphics level lives on <html>, but the app renders inside this closed
// shadow root, where a :root selector cannot reach. Mirror the attribute onto the
// mount so the `[data-gfx]` rules match inside the shadow too, and keep it in sync
// when Settings changes it.
const mirrorGfx = () => {
  mount.dataset.gfx = document.documentElement.dataset.gfx ?? '';
};
mirrorGfx();
new MutationObserver(mirrorGfx).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-gfx'],
});

createRoot(mount).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Vercel's analytics script tags itself with data-sdkn/data-sdkv. Strip those:
// the script is the one node the app adds to the page, and it should say nothing
// about what the page is.
new MutationObserver(() => {
  for (const tag of document.head.querySelectorAll('script[data-sdkn], script[data-sdkv]')) {
    tag.removeAttribute('data-sdkn');
    tag.removeAttribute('data-sdkv');
  }
}).observe(document.head, { childList: true });
