const RELEASES = [
  {
    version: 'v1.2.0',
    date: '2026-08-17',
    changes: [
      'Every game in the swfdump library is now on the site — 111 Flash titles, up from 13',
      'Flash games run on a self-hosted Ruffle build instead of a CDN copy reloaded per game',
      'SWF files moved to a CDN, so the site itself is small and loads fast',
      'Games have their own URLs — links are shareable and the back button works',
      'Rebuilt the intro and the home background in WebGL',
      'Fixed Run 3, which had been failing to load',
      'Removed the Movies tab, which never worked',
      'Removed the empty Leaderboard tab',
      'Study links that refuse to be embedded now open in a new tab instead of a blank frame',
      'Panic key now needs a modifier, so it cannot fire while you are playing',
    ],
  },
  {
    version: 'v1.1.2',
    date: '2026-03-24',
    changes: ['Added Battle Pong, Battleships, Bloxorz and Bowman'],
  },
  {
    version: 'v1.1.1',
    date: '2026-03-23',
    changes: ['Sorted SWF files and thumbnails into their own folders', 'Fixed the Avalanche embed size'],
  },
  {
    version: 'v1.1.0',
    date: '2026-03-23',
    changes: ['Added Alien Hominid, Gun Mayhem 2, Asteroids, Astroflash and Avalanche'],
  },
  {
    version: 'v1.0.9',
    date: '2026-03-16',
    changes: ['Added a fullscreen button and descriptions to the player'],
  },
  {
    version: 'v1.0.8',
    date: '2026-03-09',
    changes: ['Moved the Instagram link to the footer', 'Added the intro audio'],
  },
  {
    version: 'v1.0.7',
    date: '2026-03-09',
    changes: ['Added the domain expansion intro'],
  },
  {
    version: 'v1.0.5',
    date: '2026-03-09',
    changes: ['Evened out card sizes across every section'],
  },
  {
    version: 'v1.0.3',
    date: '2026-03-09',
    changes: ['Added this changelog'],
  },
  {
    version: 'v1.0.1',
    date: '2026-03-08',
    changes: ['Added Home, Study, Arcade, tab disguise and the panic key'],
  },
  { version: 'v1.0.0', date: '2026-03-08', changes: ['First build'] },
];

export default function Changelog() {
  return (
    <section className="section">
      <header className="section-head">
        <div>
          <h2>Changelog</h2>
          <p>What changed, newest first.</p>
        </div>
      </header>

      <ol className="releases">
        {RELEASES.map((release) => (
          <li key={release.version} className="release">
            <div className="release-head">
              <h3>{release.version}</h3>
              <time dateTime={release.date}>{release.date}</time>
            </div>
            <ul>
              {release.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
