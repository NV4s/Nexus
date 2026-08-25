import { navigate } from '../lib/router';

// /admin is deliberately absent: it is unlisted, not hidden, but there is no
// reason to advertise it to every visitor.
const LINKS = [
  ['/arcade', 'Arcade'],
  ['/study', 'Study'],
  ['/achievements', 'Achievements'],
  ['/saves', 'Saves'],
  ['/settings', 'Settings'],
  ['/changelog', 'Changelog'],
] as const;

export default function Navbar({ route }: { route: string }) {
  return (
    <nav className="nav">
      <button className="nav-logo" onClick={() => navigate('/')}>
        Nexus
      </button>

      <div className="nav-links">
        {LINKS.map(([path, label]) => (
          <button
            key={path}
            className={`nav-link ${route.startsWith(path) ? 'is-active' : ''}`}
            onClick={() => navigate(path)}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
