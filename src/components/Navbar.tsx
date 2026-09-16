import { navigate } from '../lib/router';


const LINKS: { path: string; label: string; owns: string[] }[] = [
  { path: '/arcade', label: 'Arcade', owns: ['/arcade', '/game'] },
  { path: '/study', label: 'Study', owns: ['/study'] },
  { path: '/emulators', label: 'Emulators', owns: ['/emulators', '/emulator'] },
  { path: '/assistant', label: 'Assistant', owns: ['/assistant'] },
  { path: '/chat', label: 'Chat', owns: ['/chat'] },
  { path: '/achievements', label: 'Progress', owns: ['/achievements', '/saves'] },
  { path: '/settings', label: 'Settings', owns: ['/settings', '/changelog'] },
  { path: '/contact', label: 'Contact', owns: ['/contact'] },
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
