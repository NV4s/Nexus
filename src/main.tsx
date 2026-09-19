import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';


import css from './index.css?inline';
import { migrateSaveKeys } from './lib/saves';
import { rescanAll } from './lib/achievements';
import { readTheme } from './lib/theme';
import { applyAppearance, readAppearance } from './lib/appearance';
import { migrateKeys } from './lib/keys.ts';
import { applyHead } from './lib/head.ts';


// Storage names changed, so this has to run before anything reads a setting:
// on the first load after the rename the old names are all a visitor has.
migrateKeys(localStorage);
migrateKeys(sessionStorage);

applyHead();

document.documentElement.dataset.theme = readTheme();
applyAppearance(readAppearance());


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
