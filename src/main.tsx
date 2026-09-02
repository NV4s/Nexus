import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
// Imported as a string, not injected: the same sheet is adopted by the document
// (for :root variables, @font-face and body) and by the shadow root below.
import css from './index.css?inline';
import { migrateSaveKeys } from './lib/saves';
import { rescanAll } from './lib/achievements';
import { readTheme } from './lib/theme';

// Applied before first paint so the page never flashes the wrong theme.
document.documentElement.dataset.theme = readTheme();

// Before anything can load a SWF, so a game never opens against a stale save key.
migrateSaveKeys();

// After the migration, so rules are matched against keys at their current names.
rescanAll();

const sheet = new CSSStyleSheet();
sheet.replaceSync(css);
document.adoptedStyleSheets = [sheet];

// The whole app renders inside a closed shadow root, so the page's own DOM is
// an empty div: extensions and filters that scan document text or query for
// elements see nothing, and element.shadowRoot stays null for closed mode.
const host = document.getElementById('root')!;
const shadow = host.attachShadow({ mode: 'closed' });
shadow.adoptedStyleSheets = [sheet];

const mount = document.createElement('div');
shadow.append(mount);

createRoot(mount).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
