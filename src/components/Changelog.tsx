const RELEASES = [
  {
    version: 'v1.2.1',
    date: '2026-08-19',
    changes: [
      'Removed the tab disguise, the panic key and the about:blank option. This is a games site, not a way around anything',
      'Settings now has a graphics toggle instead — force low if the background effects stutter',
      'Text in the interface no longer selects when you click around quickly',
    ],
  },
  {
    version: 'v1.2.0',
    date: '2026-08-17',
    changes: [
      'All 111 games from the dump are on the site now. It was 13.',
      'Games load off a CDN instead of sitting in the repo, so the site itself is tiny',
      'Ruffle is hosted here now. It used to reload the whole emulator every time you opened a game',
      'Every game has its own link. Back button works, and you can send someone a game',
      'Added n-gon. It runs through this site, so it still works where github.io is blocked',
      'Run 3 was broken. Fixed',
      'New intro and a new home background, both WebGL',
      'Search and filters are faster and no longer wipe when you switch tabs',
      'Killed the Movies tab. None of those links went anywhere',
      'Killed the Leaderboard tab too. It was an empty page that said scores were coming',
      'Quizlet and Keep refuse to load in a frame, so they open in a new tab instead of a blank box',
      'Fullscreen no longer gets eaten by the popup blocker',
    ],
  },
  {
    version: 'v1.1.2',
    date: '2026-03-24',
    changes: ['Battle Pong, Battleships, Bloxorz and Bowman'],
  },
  {
    version: 'v1.1.1',
    date: '2026-03-23',
    changes: ['Tidied up where the game and image files live', 'Avalanche was the wrong size. Fixed'],
  },
  {
    version: 'v1.1.0',
    date: '2026-03-23',
    changes: ['Alien Hominid, Gun Mayhem 2, Asteroids, Astroflash, Avalanche'],
  },
  {
    version: 'v1.0.9',
    date: '2026-03-16',
    changes: ['Fullscreen button', 'Descriptions on the player page'],
  },
  {
    version: 'v1.0.8',
    date: '2026-03-09',
    changes: ['Instagram link moved to the bottom', 'Intro has sound now'],
  },
  { version: 'v1.0.7', date: '2026-03-09', changes: ['Added the domain expansion intro'] },
  { version: 'v1.0.5', date: '2026-03-09', changes: ['Made all the cards the same size'] },
  { version: 'v1.0.3', date: '2026-03-09', changes: ['This page'] },
  {
    version: 'v1.0.1',
    date: '2026-03-08',
    changes: ['Home, Study, Arcade'],
  },
  { version: 'v1.0.0', date: '2026-03-08', changes: ['Started'] },
];

export default function Changelog() {
  return (
    <section className="section">
      <header className="section-head">
        <div>
          <h2>Changelog</h2>
          <p>Newest first.</p>
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
