import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { featuredGames, gamesIn, type Section } from '../data/games';
import { openGame as open } from '../lib/launch';
import { ROWS_BETWEEN_ADS } from '../lib/ads';
import { SERIES, gamesInSeries } from '../data/series.ts';
import GameCard from './GameCard';
import Scroller from './Scroller';
import AdSlot from './AdSlot';


function useColumns(ref: React.RefObject<HTMLDivElement | null>) {
  const [columns, setColumns] = useState(0);

  useEffect(() => {
    const measure = () => {
      const grid = ref.current;
      if (!grid) return;
      setColumns(getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length);
    };





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
  track,
}: {
  section: Section;
  title: string;
  lede?: string;

  track?: 'school' | 'extra';
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const gridRef = useRef<HTMLDivElement>(null);
  const perBreak = useColumns(gridRef) * ROWS_BETWEEN_ADS;


  const starters = useMemo(featuredGames, []);

  const all = useMemo(
    () => gamesIn(section).filter((game) => !track || game.track === track),
    [section, track],
  );
  const categories = useMemo(
    () => ['All', ...[...new Set(all.map((game) => game.category))].sort()],
    [all],
  );

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
          {lede && <p>{lede}</p>}
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

          <Scroller loop speed={22} className="marquee" label="the starter row">
            {[0, 1].map((copy) => (
              <div className="marquee-run" key={copy} aria-hidden={copy === 1} inert={copy === 1}>
                {starters.map((game) => (
                  <GameCard key={game.slug} game={game} onOpen={() => open(game)} />
                ))}
              </div>
            ))}
          </Scroller>
        </div>
      )}

      {section === 'arcade' && !query && category === 'All' && (
        <div className="series">
          {SERIES.map((series) => {
            const games = gamesInSeries(series);
            if (!games.length) return null;
            return (
              <div className="series-row" key={series.id}>
                <div className="series-head">
                  <h4>{series.title}</h4>
                </div>
                <Scroller className="series-scroller" label={series.title}>
                  {games.map((game) => (
                    <GameCard key={game.slug} game={game} onOpen={() => open(game)} />
                  ))}
                </Scroller>
              </div>
            );
          })}
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


                style={{ animationDelay: `${Math.min(index, 14) * 70}ms` }}
              >
                <GameCard game={game} onOpen={() => open(game)} />
              </div>


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
