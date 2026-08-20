import { useMemo, useState } from 'react';
import { categoriesIn, featuredGames, gamesIn, type Game, type Section } from '../data/games';
import { navigate } from '../lib/router';
import GameCard from './GameCard';

const open = (game: Game) =>
  game.newTab ? window.open(game.src, '_blank', 'noopener') : navigate(`/game/${game.slug}`);

export default function GameGrid({
  section,
  title,
  lede,
}: {
  section: Section;
  title: string;
  lede: string;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const all = useMemo(() => gamesIn(section), [section]);
  const categories = useMemo(() => ['All', ...categoriesIn(section)], [section]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return all.filter(
      (game) =>
        (category === 'All' || game.category === category) &&
        (!needle || game.title.toLowerCase().includes(needle)),
    );
  }, [all, category, query]);

  return (
    <section className="section">
      <header className="section-head">
        <div>
          <h2>{title}</h2>
          <p>{lede}</p>
        </div>
        <input
          type="search"
          className="field"
          placeholder={`Search ${all.length} titles`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </header>

      {section === 'arcade' && !query && category === 'All' && (
        <div className="featured">
          <h3>Start here</h3>
          <div className="featured-row">
            {featuredGames().map((game) => (
              <GameCard key={game.slug} game={game} onOpen={() => open(game)} />
            ))}
          </div>
        </div>
      )}

      <div className="toolbar glass">
        <div className="chips" role="tablist" aria-label="Categories">
          {categories.map((name) => (
            <button
              key={name}
              role="tab"
              aria-selected={category === name}
              className={`chip ${category === name ? 'is-active' : ''}`}
              onClick={() => setCategory(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="empty">Nothing matches “{query}”.</p>
      ) : (
        <div className="grid">
          {visible.map((game, index) => (
            <div
              key={game.slug}
              className="grid-item"
              // Stagger the first row only; browsers with scroll-driven timelines
              // replace this outright with a per-card reveal.
              style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
            >
              <GameCard game={game} onOpen={() => open(game)} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
