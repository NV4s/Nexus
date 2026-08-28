import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ExternalLink, Maximize2 } from 'lucide-react';
import { bySlug, gameFallback, gameUrl } from '../data/games';
import { navigate } from '../lib/router';
import { openCloaked } from '../lib/launch';
import RufflePlayer from './RufflePlayer';
import EmbedPlayer from './EmbedPlayer';
import GameAchievements from './GameAchievements';
import AdSlot from './AdSlot';
import { railsClass, slotShows } from '../lib/ads';

/**
 * The pre-game ad. Shown over the player until it is dismissed, once per game
 * per tab — a second one on the way back from the achievements list would be
 * the kind of thing that makes people leave.
 */
function Interstitial({ slug }: { slug: string }) {
  const key = `nexus:ad-seen:${slug}`;
  const [done, setDone] = useState(() => {
    try {
      return sessionStorage.getItem(key) === '1';
    } catch {
      return false; // private mode: show it, do not crash the page
    }
  });

  // Nothing to show means no overlay: an interstitial holding only a "Play now"
  // button would be a door with no room behind it.
  if (done || !slotShows('game-interstitial')) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(key, '1');
    } catch {
      /* nothing to remember it with; it will show again */
    }
    setDone(true);
  };

  return (
    <div className="ad-interstitial">
      <AdSlot name="game-interstitial" />
      <button className="button" onClick={dismiss} autoFocus>
        Play now
      </button>
    </div>
  );
}

export default function GamePage({ slug }: { slug: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const game = bySlug(slug);

  // A framing-refusing tool has no player page: reaching this route by deep link
  // used to render the dead iframe the newTab flag exists to avoid.
  useEffect(() => {
    if (!game?.newTab) return;
    window.open(game.src, '_blank', 'noopener');
    navigate(game.section === 'study' ? '/study' : '/arcade');
  }, [game]);

  if (!game) {
    return (
      <section className="section">
        <h2>Not found</h2>
        <p className="lede">No game with the id “{slug}”.</p>
        <button className="button" onClick={() => navigate('/arcade')}>
          Back to the arcade
        </button>
      </section>
    );
  }

  if (game.newTab) return null; // the effect above is already navigating away

  const back = () => navigate(game.section === 'study' ? '/study' : '/arcade');
  const url = gameUrl(game);
  const fallback = gameFallback(game);

  const openBlank = () => {
    // /embed/ rather than /game/: the second tab should be the game, not the site.
    if (!openCloaked(`${window.location.origin}/#/embed/${game.slug}`)) {
      alert('Your browser blocked the popup. Allow popups for this site and try again.');
    }
  };

  return (
    <section className="section game-page">
      <header className="game-head">
        <button className="button ghost" onClick={back}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="game-title">
          <h2>{game.title}</h2>
          <p>{[game.category, game.developer, game.year].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="row">
          <button className="button ghost" onClick={openBlank} title="Opens in a blank tab">
            <ExternalLink size={16} /> Blank tab
          </button>
          <button className="button" onClick={() => frameRef.current?.requestFullscreen()}>
            <Maximize2 size={16} /> Fullscreen
          </button>
        </div>
      </header>

      {/* The rails sit outside the fullscreen element on purpose: fullscreen
          should be the game, not the game with advertising down both sides. */}
      <div className={railsClass()}>
        <AdSlot name="rail-left" className="rail" />

        <div ref={frameRef} className="game-frame">
          {game.runtime === 'flash' ? (
            <RufflePlayer url={url} fallback={fallback} title={game.title} slug={game.slug} />
          ) : (
            <EmbedPlayer url={url} title={game.title} />
          )}
          <Interstitial slug={game.slug} />
        </div>

        <AdSlot name="rail-right" className="rail" />
      </div>

      {game.blurb && <p className="game-blurb">{game.blurb}</p>}

      <div className="panels">
        <GameAchievements slug={game.slug} />
      </div>
    </section>
  );
}
