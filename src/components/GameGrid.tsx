import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { categoriesIn, featuredGames, gamesIn, type Section } from '../data/games';
import { openGame as open } from '../lib/launch';
import { ROWS_BETWEEN_ADS } from '../lib/ads';
import GameCard from './GameCard';
import AdSlot from './AdSlot';

/**
 * How many cards the grid is currently fitting per row.
 *
 * The count is read back from the resolved `grid-template-columns` rather than
 * derived from the breakpoint, because the grid is `auto-fill` — the browser is
 * the only thing that knows how the tracks came out at this width.
 */
function useColumns(ref: React.RefObject<HTMLDivElement | null>) {
  const [columns, setColumns] = useState(0);

  useEffect(() => {
    const measure = () => {
      const grid = ref.current;
      if (!grid) return;
      setColumns(getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length);
    };

    // A resize listener rather than a ResizeObserver: the grid is full-width, so
    // the window is the only thing that changes it, and an observer's callbacks
    // are delivered at frame time — which never arrives in a tab that is not
    // painting, leaving the count stuck at whatever it was on mount.
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [ref]);

  return columns;
}

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
  const gridRef = useRef<HTMLDivElement>(null);
  const perBreak = useColumns(gridRef) * ROWS_BETWEEN_ADS;

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
        <div className="grid" ref={gridRef}>
          {visible.map((game, index) => (
            <Fragment key={game.slug}>
              <div
                className="grid-item"
                // Deliberate, Apple-paced stagger across the first couple of rows;
                // browsers with scroll-driven timelines replace this per-card.
                style={{ animationDelay: `${Math.min(index, 14) * 70}ms` }}
              >
                <GameCard game={game} onOpen={() => open(game)} />
              </div>

              {/* After every third full row, never after the last card — a slot
                  dangling under a half-empty row reads as a broken grid. */}
              {perBreak > 0 &&
                (index + 1) % perBreak === 0 &&
                index + 1 < visible.length && <AdSlot name="grid-inline" className="grid-ad" />}
            </Fragment>
          ))}
        </div>
      )}
    </section>
  );
}
