import { navigate } from '../lib/router';

/**
 * The tabs, and every route each one owns.
 *
 * Progress covers achievements and saves; Settings covers the changelog. Both
 * pairs were separate tabs holding half a subject each, and the old URLs still
 * work — they just light up the tab their content now lives in rather than
 * leaving nothing selected.
 *
 * /admin is deliberately absent. It is unlisted rather than hidden, but there
 * is no reason to advertise it to every visitor.
 */
const LINKS: { path: string; label: string; owns: string[] }[] = [
  { path: '/arcade', label: 'Arcade', owns: ['/arcade', '/game'] },
  { path: '/study', label: 'Study', owns: ['/study'] },
  { path: '/emulators', label: 'Emulators', owns: ['/emulators', '/emulator'] },
  { path: '/assistant', label: 'Assistant', owns: ['/assistant'] },
  { path: '/achievements', label: 'Progress', owns: ['/achievements', '/saves'] },
  { path: '/settings', label: 'Settings', owns: ['/settings', '/changelog'] },
];

export default function Navbar({ route }: { route: string }) {
  return (
    <nav className="nav">
      <button className="nav-logo" onClick={() => navigate('/')}>
        Nexus
      </button>

      <div className="nav-links">
        {LINKS.map(({ path, label, owns }) => (
          <button
            key={path}
            className={`nav-link ${owns.some((own) => route.startsWith(own)) ? 'is-active' : ''}`}
            onClick={() => navigate(path)}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
