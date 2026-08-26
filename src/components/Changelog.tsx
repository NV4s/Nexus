const RELEASES = [
  {
    version: 'v1.5.0',
    date: '2026-08-26',
    changes: [
      'Console emulators: NES, SNES, N64, Game Boy, GBA, DS, PlayStation, Genesis, Master System, Sega CD, Saturn, Atari and arcade. You open your own ROM and it stays on your device — nothing is uploaded and no games are hosted here. Save states are in the emulator’s own toolbar',
      'PS5, PS4, PS Vita and 3DS are not there. PS5 has no emulator at all, and the other three only run on a desktop, so a page for them would just fail',
      'Flash games have a toolbar now: restart, download the .swf, download your save, and live FPS, quality and volume. Raising FPS speeds a lot of Flash games up rather than smoothing them, which is worth knowing before you touch it',
      'Saves can be pulled out per game — either the real .sol file, which works in other Flash tools, or a backup this site can read back',
      'Achievements and playtime move between devices from Settings. Importing merges, so an old file can never undo newer progress',
      'The assistant picks models from a list instead of you typing an id, and can take images and documents',
      'Khan Academy opens in a tab — it says it can be embedded and then refuses. Every embedded tool now offers a way out to a tab if it stays blank',
      'Scratch and Quizlet are still blocked, so there are stand-ins that are not: TurboWarp runs Scratch projects and Quizizz covers flashcards. Snap!, Blockly Games, OpenStax and Excalidraw are new too',
      'The panic key can open your link in a fresh tab and leave this one blank. A page cannot close a tab it did not open, so that is as close as it gets',
    ],
  },
  {
    version: 'v1.4.1',
    date: '2026-08-25',
    changes: [
      'The API key box sometimes would not appear on the assistant. Once a key was saved the whole form disappeared, so there was no way to change or remove one, and switching engines showed nothing at all for a moment while it checked. It stays put now, and there is a button to clear a key',
      'The front page scrolls through the arcade instead of stopping at eight tiles — puzzles, the ones that take an afternoon, the stories with several endings, and the five-minute ones',
      'The starting games are a different handful every visit rather than the same eight forever',
      'Study has 17 tools instead of 4. Khan Academy, Wikipedia, the periodic table, a dictionary and more calculators. The ones that refuse to load in a frame open in a tab, which was checked per site rather than guessed',
    ],
  },
  {
    version: 'v1.4.0',
    date: '2026-08-25',
    changes: [
      'There is an assistant now. It can run entirely on your own device, so nothing you type leaves it, or use your own API key for Claude, Gemini, ChatGPT or anything OpenAI-shaped. There is no shared key and nothing goes through this site either way',
      'Running it on the device downloads a small model the first time, and browsers only allow that from a button press — so it tells you the size and waits for you',
      'Achievements can read a game’s own save file now. Flash games store their progress in your browser, and that turned out to be readable after all, so an objective can be unlocked by what you actually did in the game rather than by minutes played',
      'The Saves page will show you exactly what a game stored. Mostly useful for working out which games can have real objectives written for them',
      'Playing a game in the blank tab counts again. It had been recording nothing at all since that tab was added',
      'Visits are counted per browser rather than only per tab, so the site can tell a returning player from a new one. Still a random id and nothing else — no name, no account, no IP address',
    ],
  },
  {
    version: 'v1.3.0',
    date: '2026-08-25',
    changes: [
      'Madness: Project Nexus Mod v9.5 is on the site. It is 146 MB, larger than GitHub will hold in one file, so it ships in two pieces and gets stitched back together in your browser',
      'Flash saves were being wiped every time the game list was rebuilt. Nothing said so — your progress was simply gone next visit. Old saves are found and carried across now',
      'Saves page. See which games you have progress in, export all of it to a file, and load it back on another computer',
      'Every game has an achievement list. Opening a game, time played and how often you come back tick themselves. The rest you tick yourself, because a Flash game cannot tell the page what you did in it',
      'The objectives are researched per game, not filler. Bloxorz counts its 33 stages, every Henry Stickmin ending is listed by name, Duck Life wants all three leagues. Two games nobody has written anything about keep generic ones rather than invented ones',
      'Study tab said “Browser game” under every tool. It says Desmos, GeoGebra, Quizlet and Google now',
      'Linking straight to Quizlet or Keep used to land on a dead grey box. They open in a tab, the same as they do from the grid',
      'Opening a game in a blank tab used to drag the whole site along with it. It is the game alone now, and one click anywhere makes it fullscreen',
      'Esc skips that fullscreen prompt if you would rather play in the tab',
      'The site counts visits. It records which page is open and nothing else — no name, no account, no IP address, no fingerprinting',
    ],
  },
  {
    version: 'v1.2.1',
    date: '2026-08-20',
    changes: [
      'Text no longer highlights anywhere in the interface. Dragging across the home page or the arcade selects nothing, and double-clicking a card no longer smears blue across its title',
      'Typing fields are unaffected, so search and the settings inputs still select and edit normally',
      'The site hides what it renders. Everything draws inside a closed shadow root now, so an extension or a filter reading the page finds one empty div instead of the games',
      'Settings has a graphics toggle. Auto scales the background effects to your frame rate; low pins them and skips the measuring, which is the one to use if the intro stutters',
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
      'Panic key needs Ctrl now. Hitting backtick mid-game used to nuke your session',
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
    changes: ['Home, Study, Arcade', 'Tab disguise and the panic key'],
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
