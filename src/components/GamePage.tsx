import { useEffect, useRef } from 'react';
import { ArrowLeft, ExternalLink, Maximize2 } from 'lucide-react';
import { bySlug, gameUrl } from '../data/games';
import { navigate } from '../lib/router';
import { openCloaked } from '../lib/launch';
import RufflePlayer from './RufflePlayer';
import EmbedPlayer from './EmbedPlayer';
import GameAchievements from './GameAchievements';

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

  const openBlank = () => {
    if (!openCloaked(`${window.location.origin}/#/game/${game.slug}`)) {
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

      <div ref={frameRef} className="game-frame">
        {game.runtime === 'flash' ? (
          <RufflePlayer url={url} parts={game.parts} title={game.title} />
        ) : (
          <EmbedPlayer url={url} title={game.title} />
        )}
      </div>

      {game.blurb && <p className="game-blurb">{game.blurb}</p>}

      <div className="panels">
        <GameAchievements slug={game.slug} />
      </div>
    </section>
  );
}
