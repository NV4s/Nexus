import { useRef } from 'react';
import { ArrowLeft, Maximize2 } from 'lucide-react';
import { bySlug, gameUrl } from '../data/games';
import { navigate } from '../lib/router';
import RufflePlayer from './RufflePlayer';
import EmbedPlayer from './EmbedPlayer';

export default function GamePage({ slug }: { slug: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const game = bySlug(slug);

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

  const back = () => navigate(game.section === 'study' ? '/study' : '/arcade');
  const url = gameUrl(game);

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
        <button className="button" onClick={() => frameRef.current?.requestFullscreen()}>
          <Maximize2 size={16} /> Fullscreen
        </button>
      </header>

      <div ref={frameRef} className="game-frame">
        {game.runtime === 'flash' ? (
          <RufflePlayer url={url} parts={game.parts} title={game.title} />
        ) : (
          <EmbedPlayer url={url} title={game.title} />
        )}
      </div>

      {game.blurb && <p className="game-blurb">{game.blurb}</p>}
    </section>
  );
}
