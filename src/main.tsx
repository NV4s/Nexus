import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Applied before first paint so the page never flashes the wrong theme.
document.documentElement.dataset.theme = localStorage.getItem('theme') ?? 'dark';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
