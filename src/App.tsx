import { Suspense, lazy, useCallback, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import GameGrid from './components/GameGrid';
import GamePage from './components/GamePage';
import Settings from './components/Settings';
import Changelog from './components/Changelog';
import { segments, useRoute } from './lib/router';

// three.js is ~300 kB gzipped. Only the intro and the home page need it, so the
// arcade grid and the player never pay for it.
const VoidIntro = lazy(() => import('./webgl/VoidIntro'));

export default function App() {
  const route = useRoute();
  // Only on a cold visit to the front page — a shared link to a game should just play it.
  const [showIntro, setShowIntro] = useState(
    () => !sessionStorage.getItem('introSeen') && (window.location.hash.slice(1) || '/') === '/',
  );

  const dismissIntro = useCallback(() => {
    sessionStorage.setItem('introSeen', '1');
    setShowIntro(false);
  }, []);

  const [head, param] = segments(route);

  return (
    <>
      <Analytics />
      {showIntro && (
        <Suspense fallback={<div className="intro" />}>
          <VoidIntro onComplete={dismissIntro} />
        </Suspense>
      )}

      <Navbar route={route} />

      {/* Not mounted during the intro, so two WebGL contexts never render at once. */}
      <main className="content">
        {/* Keyed by route: React remounts, so the enter animation replays per page. */}
        <div className="page" key={showIntro ? 'intro' : `${head ?? 'home'}/${param ?? ''}`}>
        {showIntro ? null : head === 'game' && param ? (
          <GamePage slug={param} />
        ) : head === 'arcade' ? (
          <GameGrid section="arcade" title="Arcade" lede="Flash and browser games, playable here." />
        ) : head === 'study' ? (
          <GameGrid section="study" title="Study" lede="Calculators and note tools." />
        ) : head === 'settings' ? (
          <Settings />
        ) : head === 'changelog' ? (
          <Changelog />
        ) : (
          <Home />
        )}
        </div>
      </main>
    </>
  );
}
