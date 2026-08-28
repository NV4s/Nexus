import { Fragment, Suspense, lazy, useMemo } from 'react';
import { GAMES, bySlug, featuredGames, type Game } from '../data/games';
import { navigate } from '../lib/router';
import GameCard from './GameCard';
import AdSlot from './AdSlot';

const HomeField = lazy(() => import('../webgl/HomeField'));

const flashCount = GAMES.filter((game) => game.runtime === 'flash').length;
const arcadeCount = GAMES.filter((game) => game.section === 'arcade').length;

/**
 * One idea per screen, in the order someone would actually meet them: what to
 * play first, what to sink an afternoon into, what fills five minutes, what the
 * archive is for. Each names real games rather than describing a genre.
 */
type Chapter = {
  eyebrow: string;
  title: string;
  body: string;
  slugs: string[];
};

const CHAPTERS: Chapter[] = [
  {
    eyebrow: 'Think',
    title: 'Puzzles that respect your time',
    body: 'No tutorials, no timers, no accounts. Roll a block into a hole for thirty-three stages, or spend ten cursors solving a tower that only cooperates with your own ghosts.',
    slugs: ['bloxorz', 'cursor-10', 'causality', 'crimson-room'],
  },
  {
    eyebrow: 'Commit',
    title: 'The ones that take an afternoon',
    body: 'Shops to run, ducks to train, a desert to fight through. These remember where you left off, and the site now backs that progress up for you.',
    slugs: ['papas-pizzeria', 'duck-life-3', 'cactus-mccoy', 'jacksmith'],
  },
  {
    eyebrow: 'Choose',
    title: 'Stories that end differently',
    body: 'Every wrong answer is the point. The Henry Stickmin chapters have three to five endings each, and failing is usually funnier than winning.',
    slugs: ['escaping-the-prison', 'stealing-the-diamond', 'fleeing-the-complex', 'infiltrating-the-airship'],
  },
  {
    eyebrow: 'Aim',
    title: 'For when you want noise',
    body: 'Trench warfare as a lane battle, a squad you build yourself, and a great many barrels that should not be shot indoors.',
    slugs: ['warfare-1917', 'madness-project-nexus-classic', 'boxhead-the-zombie-wars', 'gun-mayhem-2'],
  },
  {
    eyebrow: 'Five minutes',
    title: 'Between one thing and the next',
    body: 'Nothing to learn and nothing to lose. Start, fail, start again, and stop whenever the bell goes.',
    slugs: ['cubefield', 'curveball', 'snake', 'run-3'],
  },
];

function Row({ games }: { games: Game[] }) {
  return (
    <div className="chapter-row">
      {games.map((game) => (
        <div className="reveal" key={game.slug}>
          <GameCard game={game} onOpen={() => navigate(`/game/${game.slug}`)} />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  // The starters are already sampled once per page load; memo keeps the rest of
  // the page from rebuilding its lists on every render.
  const chapters = useMemo(
    () =>
      CHAPTERS.map((chapter) => ({
        ...chapter,
        games: chapter.slugs.map(bySlug).filter((game): game is Game => !!game),
      })).filter((chapter) => chapter.games.length > 0),
    [],
  );

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

      <AdSlot name="home-1" className="home-ad" />

      <section className="showcase">
        <div className="showcase-head reveal">
          <h2>Start with these</h2>
          <p>
            A different handful every visit, pulled from the ones worth your first ten minutes.
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

      {chapters.map((chapter, index) => (
        <Fragment key={chapter.title}>
          <section className={`chapter ${index % 2 ? 'is-flipped' : ''}`}>
            <div className="chapter-copy reveal">
              <span className="chapter-eyebrow">{chapter.eyebrow}</span>
              <h2>{chapter.title}</h2>
              <p>{chapter.body}</p>
            </div>
            <Row games={chapter.games} />
          </section>

          {/* Between chapters rather than inside one, so a chapter's copy and
              its row are never split by an advert. */}
          {index === 1 && <AdSlot name="home-2" className="home-ad" />}
        </Fragment>
      ))}

      <AdSlot name="home-3" className="home-ad" />

      <section className="chapter is-closing">
        <div className="chapter-copy reveal">
          <span className="chapter-eyebrow">Everything else</span>
          <h2>{arcadeCount} games, one tab</h2>
          <p>
            Saves stay on your device and can be exported. Achievements track what you actually did
            in the game, not just how long you sat there.
          </p>
          <div className="hero-actions">
            <button className="button" onClick={() => navigate('/arcade')}>
              Browse the arcade
            </button>
            <button className="button ghost" onClick={() => navigate('/achievements')}>
              Your progress
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
