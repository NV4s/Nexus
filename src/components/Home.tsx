import { Fragment, Suspense, lazy, useEffect, useMemo } from 'react';
import { GAMES, bySlug, featuredGames, type Game } from '../data/games';
import { navigate } from '../lib/router';
import GameCard from './GameCard';
import AdSlot from './AdSlot';

const HomeField = lazy(() => import('../webgl/HomeField'));

const flashCount = GAMES.filter((game) => game.runtime === 'flash').length;
const arcadeCount = GAMES.filter((game) => game.section === 'arcade').length;

/**
 * One idea per screen, each naming real games rather than describing a genre.
 * The page snaps between them, so a chapter is written to be read on its own
 * rather than skimmed on the way past.
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
    title: 'Thirty-three stages, one block',
    body: 'Bloxorz gives you a 1×2 block and a hole to fall into, and takes about four hours to finish. Cursor*10 is stranger: ten goes at the same tower, and every run has to cooperate with the ghosts of the last nine.',
    slugs: ['bloxorz', 'cursor-10', 'causality', 'crimson-room'],
  },
  {
    eyebrow: 'Commit',
    title: 'Games that expect you back',
    body: 'A pizza shop, a duck in training, a desert to punch through. They keep your progress in the browser, which the site now backs up and reads — a top score here unlocks something because the game wrote it down, not because you said so.',
    slugs: ['papas-pizzeria', 'duck-life-3', 'cactus-mccoy', 'jacksmith'],
  },
  {
    eyebrow: 'Choose',
    title: 'Wrong answers are the good ones',
    body: 'Every Henry Stickmin chapter has three to five endings, and most of them are failures. Picking the sensible option is usually the worst thing you can do to yourself.',
    slugs: ['escaping-the-prison', 'stealing-the-diamond', 'fleeing-the-complex', 'infiltrating-the-airship'],
  },
  {
    eyebrow: 'Aim',
    title: 'Loud ones',
    body: 'Warfare 1917 is the First World War as a lane battle. Madness hands you a squad you built yourself. Boxhead is mostly about learning which barrels not to shoot while standing next to them.',
    slugs: ['warfare-1917', 'madness-project-nexus-classic', 'boxhead-the-zombie-wars', 'gun-mayhem-2'],
  },
  {
    eyebrow: 'Five minutes',
    title: 'Something to do until the bell',
    body: 'One button, one life, no explanation needed. Cubefield keeps a top score; the rest do not care how you did.',
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
  useEffect(() => {
    document.documentElement.classList.add('is-snapping');
    return () => document.documentElement.classList.remove('is-snapping');
  }, []);

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
            {flashCount} Flash games, a pile of browser ones, and console emulators that read your
            own ROMs. It all runs in this tab.
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
          <p>A different handful every visit. Reload if none of them appeal.</p>
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
            Saves stay on this device and export to a file when you move. Achievements read the
            game's own save where it keeps one, so they record what you did rather than how long you
            sat there.
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
