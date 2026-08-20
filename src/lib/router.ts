import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};

const read = () => window.location.hash.slice(1) || '/';

/** Hash routing: deep links and the back button work, no router dependency. */
export const useRoute = () => useSyncExternalStore(subscribe, read, () => '/');

export function navigate(path: string) {
  if (read() === path) return;
  window.location.hash = path;
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/** '/game/bloxorz' -> ['game', 'bloxorz'] */
export const segments = (route: string) => route.split('/').filter(Boolean);
