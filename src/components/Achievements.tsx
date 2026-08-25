import { useMemo } from 'react';
import { GAMES } from '../data/games';
import { countsFor } from '../lib/achievements';
import { navigate } from '../lib/router';

export default function Achievements() {
  // Read once per visit: progress only changes while a game is open, not here.
  const rows = useMemo(
    () =>
      GAMES.filter((game) => game.section === 'arcade')
        .map((game) => ({ game, ...countsFor(game.slug) }))
        .filter((row) => row.unlocked > 0)
        .sort((a, b) => b.unlocked / b.total - a.unlocked / a.total || a.game.title.localeCompare(b.game.title)),
    [],
  );

  const unlocked = rows.reduce((sum, row) => sum + row.unlocked, 0);

  return (
    <section className="section">
      <header className="section-head">
        <div>
          <h2>Achievements</h2>
          <p>
            {rows.length
              ? `${unlocked} unlocked across ${rows.length} ${rows.length === 1 ? 'game' : 'games'}, saved on this device.`
              : 'Nothing yet. Open a game and its list appears under the player.'}
          </p>
        </div>
      </header>

      {rows.length > 0 && (
        <div className="panels">
          {rows.map(({ game, unlocked: done, total }) => (
            <button className="panel achievement-row" key={game.slug} onClick={() => navigate(`/game/${game.slug}`)}>
              <h3>{game.title}</h3>
              <p>
                {done} of {total}
              </p>
              <div className="progress">
                <div style={{ width: `${Math.round((done / total) * 100)}%` }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
