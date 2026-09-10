import type { Game } from '../data/games';


function hue(slug: string) {
  let h = 0;
  for (const char of slug) h = (h * 31 + char.charCodeAt(0)) % 360;
  return h;
}


const fallbackSize = (title: string) =>
  title.length > 26 ? '0.95rem' : title.length > 16 ? '1.15rem' : '1.5rem';

export default function GameCard({ game, onOpen }: { game: Game; onOpen: () => void }) {
  const h = hue(game.slug);

  return (
    <button type="button" onClick={onOpen} className="card group" aria-label={`${game.section === 'study' ? 'Open' : 'Play'} ${game.title}`}>
      <div className="card-art">
        {game.thumb ? (
          <img
            src={game.thumb}
            alt=""
            loading="lazy"
            decoding="async"
            className={game.thumbFit === 'cover' ? 'is-cover' : game.thumbFit === 'contain' ? 'is-contain' : undefined}
          />
        ) : (
          <span
            className="card-fallback"
            style={{
              background: `linear-gradient(140deg, hsl(${h} 45% 22%), hsl(${(h + 40) % 360} 40% 11%))`,
              fontSize: fallbackSize(game.title),
            }}
          >
            {game.title}
          </span>
        )}
        <span className="card-chip">{game.category}</span>
      </div>

      <div className="card-meta">

        <h3 className={game.thumb ? '' : 'visually-hidden'}>{game.title}</h3>
        <p>
          {[game.developer, game.year].filter(Boolean).join(' · ') ||
            (game.runtime === 'flash' ? 'Flash' : 'Browser game')}
        </p>
      </div>

    </button>
  );
}
