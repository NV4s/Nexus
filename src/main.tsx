import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';


import css from './index.css?inline';
import { migrateSaveKeys } from './lib/saves';
import { rescanAll } from './lib/achievements';
import { readTheme } from './lib/theme';
import { applyAppearance, readAppearance } from './lib/appearance';


document.documentElement.dataset.theme = readTheme();
applyAppearance(readAppearance());


migrateSaveKeys();


rescanAll();

const sheet = new CSSStyleSheet();
sheet.replaceSync(css);
document.adoptedStyleSheets = [sheet];




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
