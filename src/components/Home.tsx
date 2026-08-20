import { Suspense, lazy } from 'react';
import { GAMES } from '../data/games';
import { navigate } from '../lib/router';

const HomeField = lazy(() => import('../webgl/HomeField'));

const flashCount = GAMES.filter((game) => game.runtime === 'flash').length;

export default function Home() {
  return (
    <section className="hero">
      <Suspense fallback={null}>
        <HomeField />
      </Suspense>

      <div className="hero-copy">
        <h1>Nexus</h1>
        <p>
          {flashCount} Flash games and a handful of browser games, running in the tab you already
          have open. Nothing to install.
        </p>
        <div className="hero-actions">
          <button className="button" onClick={() => navigate('/arcade')}>
            Open the arcade
          </button>
          <button className="button ghost" onClick={() => navigate('/study')}>
            Study tools
          </button>
        </div>
      </div>
    </section>
  );
}
