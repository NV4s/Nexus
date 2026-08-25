import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import { GAMES } from '../data/games';

type Stats = {
  total: number;
  daily: Record<string, number>;
  live: { page: string; seconds: number }[];
  offline?: boolean;
};

const POLL_MS = 5_000;

const dwell = (seconds: number) =>
  seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;

/** Routes are stored, but a title is what the owner actually recognises. */
function useRouteLabels() {
  return useMemo(() => {
    const bySlug = new Map(GAMES.map((game) => [game.slug, game.title]));
    return (route: string) => {
      if (route === '/' || route === '') return 'Home';
      const slug = route.startsWith('/game/') ? route.slice(6) : null;
      if (slug) return bySlug.get(slug) ?? slug;
      return route.slice(1).replace(/^./, (c) => c.toUpperCase());
    };
  }, []);
}

/** Fills gaps so a quiet day is a visible zero rather than a missing column. */
function lastDays(daily: Record<string, number>, count: number) {
  const out: { day: string; count: number }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    out.push({ day: key, count: daily[key] ?? 0 });
  }
  return out;
}

function Chart({ days }: { days: { day: string; count: number }[] }) {
  const peak = Math.max(1, ...days.map((entry) => entry.count));
  const width = 100;
  const step = width / days.length;

  return (
    <svg className="chart" viewBox={`0 0 ${width} 34`} preserveAspectRatio="none" role="img" aria-label="Sessions per day">
      {days.map((entry, index) => {
        const height = (entry.count / peak) * 28;
        return (
          <g key={entry.day}>
            <title>{`${entry.day}: ${entry.count}`}</title>
            <rect
              x={index * step + step * 0.18}
              y={30 - height}
              width={step * 0.64}
              height={Math.max(entry.count > 0 ? 1 : 0.4, height)}
              rx={step * 0.2}
              className={entry.count ? 'chart-bar' : 'chart-bar is-empty'}
            />
          </g>
        );
      })}
    </svg>
  );
}

export default function Admin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(0);
  const label = useRouteLabels();
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * The session cookie is HttpOnly, so the panel cannot read it. Asking for the
   * data *is* the auth check — a 401 means signed out. One source of truth, so
   * the UI can never disagree with the real session.
   */
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        setStats((await response.json()) as Stats);
        setUpdatedAt(Date.now());
      } else {
        setStats(null);
      }
    } catch {
      setStats(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!stats) return;
    const timer = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(timer);
  }, [stats, load]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        setPassword('');
        await load();
      } else if (response.status === 503) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? 'This deployment is missing its admin settings.');
      } else {
        setError(response.status === 429 ? 'Too many attempts. Wait 15 minutes.' : 'Wrong password.');
        inputRef.current?.select();
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    setStats(null);
  };

  if (checking) {
    return (
      <section className="section">
        <p className="empty">Checking…</p>
      </section>
    );
  }

  if (!stats) {
    return (
      <section className="section admin-gate">
        <form className="panel admin-login" onSubmit={signIn}>
          <h2>Admin</h2>
          <p>This page is unlisted, not protected. The password is checked on the server.</p>
          <input
            ref={inputRef}
            className="field"
            type="password"
            placeholder="Password"
            value={password}
            autoFocus
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="button" disabled={busy || !password}>
            {busy ? 'Checking…' : 'Sign in'}
          </button>
          {error && <p className="admin-error">{error}</p>}
        </form>
      </section>
    );
  }

  const days = lastDays(stats.daily, 14);
  const today = days[days.length - 1].count;
  const peak = days.reduce((best, entry) => (entry.count > best.count ? entry : best), days[0]);
  const fortnight = days.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <section className="section">
      <header className="section-head">
        <div>
          <h2>Admin</h2>
          <p>
            Sessions, not people — a new tab counts again, and nothing identifies a visitor.
          </p>
        </div>
        <div className="row">
          <span className="admin-live" title={`Updated ${new Date(updatedAt).toLocaleTimeString()}`}>
            <RefreshCw size={13} /> live
          </span>
          <button className="button ghost" onClick={signOut}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </header>

      {stats.offline && (
        <p className="empty">
          Storage is not configured on this deployment, so every number below is empty.
        </p>
      )}

      <div className="stat-grid">
        <div className="panel stat-tile">
          <h3>Online now</h3>
          <p className="stat">{stats.live.length}</p>
        </div>
        <div className="panel stat-tile">
          <h3>Today</h3>
          <p className="stat">{today.toLocaleString()}</p>
        </div>
        <div className="panel stat-tile">
          <h3>Last 14 days</h3>
          <p className="stat">{fortnight.toLocaleString()}</p>
        </div>
        <div className="panel stat-tile">
          <h3>All time</h3>
          <p className="stat">{stats.total.toLocaleString()}</p>
        </div>
      </div>

      <div className="panels admin-panels">
        <div className="panel">
          <h3>On the site now</h3>
          {stats.live.length === 0 ? (
            <p>Nobody is here right now. Visitors appear within a minute of opening the site.</p>
          ) : (
            <ul className="live-list">
              {stats.live.map((visitor, index) => (
                <li key={index}>
                  <span className="live-page">{label(visitor.page)}</span>
                  <span className="live-time">{dwell(visitor.seconds)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <h3>Daily sessions</h3>
          {fortnight === 0 ? (
            <p>No visits recorded yet.</p>
          ) : (
            <>
              <Chart days={days} />
              <div className="chart-axis">
                <span>{days[0].day.slice(5)}</span>
                <span>
                  peak {peak.count} on {peak.day.slice(5)}
                </span>
                <span>today</span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
