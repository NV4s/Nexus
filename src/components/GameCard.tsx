import type { Game } from '../data/games';
import { graphicsProfile } from '../lib/quality';


function hue(slug: string) {
  let h = 0;
  for (const char of slug) h = (h * 31 + char.charCodeAt(0)) % 360;
  return h;
}


const fallbackSize = (title: string) =>
  title.length > 26 ? '0.95rem' : title.length > 16 ? '1.15rem' : '1.5rem';

export default function GameCard({ game, onOpen }: { game: Game; onOpen: () => void }) {
  const h = hue(game.slug);
  const profile = graphicsProfile();
  const thumb = profile.thumbs ? game.thumb : undefined;
  // Super low is flat: no cover art and no per-card gradient, just a plain tile.
  const fallbackBg = profile.background === 'none'
    ? 'var(--surface-2)'
    : `linear-gradient(140deg, hsl(${h} 45% 22%), hsl(${(h + 40) % 360} 40% 11%))`;

  return (
    <button type="button" onClick={onOpen} className="card group" aria-label={`${'Open'} ${game.title}`}>
      <div className="card-art">
        {thumb ? (
          <img
            src={thumb}
            alt=""
            loading="lazy"
            decoding="async"
            className={game.thumbFit === 'cover' ? 'is-cover' : game.thumbFit === 'contain' ? 'is-contain' : undefined}
          />
        ) : (
          <span
            className="card-fallback"
            style={{ background: fallbackBg, fontSize: fallbackSize(game.title) }}
          >
            {game.title}
          </span>
        )}
        <span className="card-chip">{game.category}</span>
      </div>

      <div className="card-meta">

        <h3 className={thumb ? '' : 'visually-hidden'}>{game.title}</h3>
        <p>
          {[game.developer, game.year].filter(Boolean).join(' · ') ||
            (game.runtime === 'flash' ? 'Classic' : 'Browser')}
        </p>
      </div>

    </button>
  );
}
