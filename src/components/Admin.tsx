import { useCallback, useEffect, useState } from 'react';

type Stats = {
  total: number;
  daily: Record<string, number>;
  live: { page: string; seconds: number }[];
  offline?: boolean;
};

const POLL_MS = 5_000;

const dwell = (seconds: number) =>
  seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

export default function Admin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  /**
   * The session cookie is HttpOnly, so the panel cannot read it. Asking for the
   * data *is* the auth check — a 401 means logged out. One source of truth, so
   * the UI can never disagree with the actual session.
   */
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats');
      setStats(response.ok ? ((await response.json()) as Stats) : null);
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
      } else {
        setError(response.status === 429 ? 'Too many attempts. Wait 15 minutes.' : 'Wrong password.');
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
      <section className="section">
        <header className="section-head">
          <div>
            <h2>Admin</h2>
            <p>Sign in to see traffic.</p>
          </div>
        </header>
        <div className="panels">
          <form className="panel" onSubmit={signIn}>
            <h3>Password</h3>
            <input
              className="field"
              type="password"
              value={password}
              autoFocus
              onChange={(event) => setPassword(event.target.value)}
            />
            <div className="row">
              <button className="button" disabled={busy || !password}>
                {busy ? 'Checking…' : 'Sign in'}
              </button>
            </div>
            {error && <p>{error}</p>}
          </form>
        </div>
      </section>
    );
  }

  const days = Object.entries(stats.daily).sort(([a], [b]) => b.localeCompare(a)).slice(0, 14);
  const busiest = Math.max(1, ...days.map(([, count]) => count));
  const today = stats.daily[new Date().toISOString().slice(0, 10)] ?? 0;

  return (
    <section className="section">
      <header className="section-head">
        <div>
          <h2>Admin</h2>
          <p>Sessions, not people — a new tab counts again. Nothing identifies a visitor.</p>
        </div>
        <button className="button ghost" onClick={signOut}>
          Sign out
        </button>
      </header>

      {stats.offline && <p className="empty">Storage is not configured, so these numbers are empty.</p>}

      <div className="panels">
        <div className="panel">
          <h3>Total sessions</h3>
          <p className="stat">{stats.total.toLocaleString()}</p>
        </div>
        <div className="panel">
          <h3>Today</h3>
          <p className="stat">{today.toLocaleString()}</p>
        </div>
        <div className="panel">
          <h3>On the site now</h3>
          <p className="stat">{stats.live.length}</p>
        </div>
      </div>

      <div className="panels">
        <div className="panel">
          <h3>Live activity</h3>
          {stats.live.length === 0 ? (
            <p>Nobody is on the site right now.</p>
          ) : (
            <ul className="live-list">
              {stats.live.map((visitor, index) => (
                <li key={index}>
                  <span>{visitor.page === '/' ? 'Home' : visitor.page}</span>
                  <span>{dwell(visitor.seconds)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <h3>Last 14 days</h3>
          {days.length === 0 ? (
            <p>No visits recorded yet.</p>
          ) : (
            <ul className="live-list">
              {days.map(([day, count]) => (
                <li key={day}>
                  <span>{day.slice(5)}</span>
                  <span className="bar" style={{ width: `${(count / busiest) * 60}%` }} />
                  <span>{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
