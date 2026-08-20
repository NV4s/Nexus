import { Suspense, lazy } from 'react';
import { GAMES, featuredGames } from '../data/games';
import { navigate } from '../lib/router';
import GameCard from './GameCard';

const HomeField = lazy(() => import('../webgl/HomeField'));

const flashCount = GAMES.filter((game) => game.runtime === 'flash').length;

export default function Home() {
  return (
    <>
      <section className="hero">
        <Suspense fallback={null}>
          <HomeField />
        </Suspense>

        <div className="hero-copy parallax-slow">
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

        <div className="scroll-cue" aria-hidden="true">
          Scroll
          <span />
        </div>
      </section>

      <section className="showcase">
        <div className="showcase-head reveal">
          <h2>Start with these</h2>
          <p>
            The ones worth your first ten minutes. Everything else is one tap away in the arcade.
          </p>
        </div>

        <div className="showcase-grid">
          {featuredGames().map((game) => (
            <div className="reveal" key={game.slug}>
              <GameCard game={game} onOpen={() => navigate(`/game/${game.slug}`)} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
