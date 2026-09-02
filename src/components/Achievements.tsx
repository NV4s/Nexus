import { useMemo, useState } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { GAMES } from '../data/games';
import { countsFor, readProgress, rescanAll } from '../lib/achievements';
import { navigate } from '../lib/router';

/** Rounded the way a person would say it, not to the second. */
const spell = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

export default function Achievements() {
  // Bumped by the re-check button to rebuild the rows below.
  const [pass, setPass] = useState(0);

  const rows = useMemo(
    () =>
      GAMES.filter((game) => game.section === 'arcade')
        .map((game) => ({ game, ...countsFor(game.slug), ...readProgress(game.slug) }))
        .filter((row) => row.unlocked > 0 || row.seconds > 0)
        .sort(
          (a, b) =>
            b.seconds - a.seconds ||
            b.unlocked / b.total - a.unlocked / a.total ||
            a.game.title.localeCompare(b.game.title),
        ),
    // A fresh evaluation before reading, so a score set in the last session is
    // already counted by the time the first row renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [(rescanAll(), pass)],
  );

  const unlocked = rows.reduce((sum, row) => sum + row.unlocked, 0);
  const totalSeconds = rows.reduce((sum, row) => sum + row.seconds, 0);
  const totalSessions = rows.reduce((sum, row) => sum + row.sessions, 0);
  const played = rows.filter((row) => row.seconds > 0);
  const longest = played[0];

  return (
    <section className="section">
      <header className="section-head">
        <div>
          <h2>Achievements</h2>
          <p>
            {rows.length
              ? `${unlocked} unlocked across ${rows.length} ${rows.length === 1 ? 'game' : 'games'}, kept on this device.`
              : 'Nothing yet. Open a game and its list appears under the player.'}
          </p>
        </div>
        <button
          className="button ghost"
          onClick={() => setPass((n) => n + 1)}
          title="Read every game's save again and tick anything it has earned"
        >
          <RefreshCw size={15} /> Re-check saves
        </button>
      </header>

      {rows.length > 0 && (
        <>
          <div className="stat-grid">
            <div className="panel stat-tile">
              <h3>Total playtime</h3>
              <p className="stat">{spell(totalSeconds)}</p>
            </div>
            <div className="panel stat-tile">
              <h3>Games played</h3>
              <p className="stat">{played.length}</p>
            </div>
            <div className="panel stat-tile">
              <h3>Sessions</h3>
              <p className="stat">{totalSessions}</p>
            </div>
            <div className="panel stat-tile">
              <h3>Achievements</h3>
              <p className="stat">{unlocked}</p>
            </div>
          </div>

          {longest && (
            <p className="empty">
              Most played: {longest.game.title}, {spell(longest.seconds)}. Only time with the tab in
              front is counted, so a game left open in the background does not add up.
            </p>
          )}

          <div className="panels">
            {rows.map(({ game, unlocked: done, total, seconds, sessions }) => (
              <button
                className="panel achievement-row"
                key={game.slug}
                onClick={() => navigate(`/game/${game.slug}`)}
              >
                <h3>{game.title}</h3>
                <p>
                  <Clock size={13} /> {seconds > 0 ? spell(seconds) : 'not played yet'}
                  {sessions > 0 && ` · ${sessions} ${sessions === 1 ? 'session' : 'sessions'}`}
                </p>
                <p>
                  {done} of {total} achievements
                </p>
                <div className="progress">
                  <div style={{ width: `${Math.round((done / total) * 100)}%` }} />
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
