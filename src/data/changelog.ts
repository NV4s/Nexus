export type Release = {
  version: string;
  date: string;
  changes: string[];
};

/**
 * What changed, for whoever is playing. Newest first.
 *
 * Anything that only the owner can act on — keys to set, quotas to watch, work
 * that is blocked on them — belongs in OWNER_NOTES below instead, where it shows
 * on the Admin page and nowhere else.
 */
export const RELEASES: Release[] = [
  {
    version: 'v1.6.0',
    date: '2026-08-28',
    changes: [
      'Achievements read what the game itself saved. Beat your top score in Cubefield and the score tiers unlock on their own; the same works for Duck Life 1-4, Warfare 1917, Gun Mayhem 2, Endless War 4 and the Madness mods',
      'They now update while you are still playing, instead of waiting until you leave the game and come back',
      'Commando was drawing itself at 400x300 in the middle of the frame. It fills the frame now. There is a "Stretch to fit" switch in Settings for the few games that meant it',
      'A game card\'s description never appeared on hover. It does now, sliding up over the card',
      'Settings panels used to leave a column of empty space next to a tall one. They pack properly',
      'Seven themes instead of two: Dark, Light, Midnight, Forest, Ember, Mono and Paper',
      'The assistant formats its answers — bold, lists, headings, code — rather than printing the asterisks',
      'Each provider has step-by-step instructions for getting an API key, including which ones need money up front',
      'The arcade has a row of games drifting past at the top. Hover to stop it',
      'The home page settles on one section at a time rather than sliding past all of them',
      'Level 13 and A Dark Room, both proxied through this site so they work where github.io is blocked',
      'Pokemon Showdown opens in a tab. It allows embedding and then refuses to run inside one, so a frame was always going to show you an error',
      'Study tools have their own logos on the cards',
    ],
  },
  {
    version: 'v1.5.1',
    date: '2026-08-26',
    changes: [
      'Madness: Project Nexus Mod v9.5 loads as one file again — GitHub re-enabled Git LFS for the game repository',
      'The two-piece copy is kept as a spare. If LFS runs out of monthly traffic the game falls back to it instead of refusing to load',
    ],
  },
  {
    version: 'v1.5.0',
    date: '2026-08-26',
    changes: [
      'Console emulators: NES, SNES, N64, Game Boy, GBA, DS, PlayStation, Genesis, Master System, Sega CD, Saturn, Atari and arcade. You open your own ROM and it stays on your device — nothing is uploaded and no games are hosted here',
      'No PS5, PS4, Vita or 3DS. PS5 has no emulator at all and the other three only run on a desktop',
      'Flash games got a toolbar: restart, download the .swf, download your save, FPS, quality and volume',
      'Saves can be pulled out per game — the real .sol file, or a backup this site can read back',
      'Achievements and playtime move between devices from Settings. Importing merges, so an old file cannot undo newer progress',
      'The assistant picks models from a list instead of you typing an id, and takes images and documents',
      'Khan Academy opens in a tab. It says it can be embedded and then refuses',
      'Scratch and Quizlet are blocked, so there are stand-ins that are not: TurboWarp runs Scratch projects, Quizizz covers flashcards. Snap!, Blockly Games, OpenStax and Excalidraw are new too',
      'The panic key can open your link in a fresh tab and leave this one blank',
    ],
  },
  {
    version: 'v1.4.1',
    date: '2026-08-25',
    changes: [
      'The API key box sometimes would not appear. Saving a key hid the whole form, so there was no way to change or remove one',
      'The front page scrolls through the arcade instead of stopping at eight tiles',
      'The starting games are a different handful every visit',
      'Study has 17 tools instead of 4. The ones that refuse to load in a frame open in a tab, checked per site rather than guessed',
    ],
  },
  {
    version: 'v1.4.0',
    date: '2026-08-25',
    changes: [
      'There is an assistant. It runs on your device, or through your own API key for Claude, Gemini or ChatGPT. There is no shared key and nothing goes through this site either way',
      'Running it on the device downloads a small model the first time. Browsers only allow that from a button press, so it tells you the size and waits',
      'Achievements can read a game\'s own save file. Flash games store progress in your browser and it turned out to be readable',
      'The Saves page shows exactly what a game stored',
      'Playing in the blank tab counts again. It had recorded nothing since that tab was added',
      'Visits are counted per browser rather than per tab. Still a random id and nothing else — no name, no account, no IP address',
    ],
  },
  {
    version: 'v1.3.0',
    date: '2026-08-25',
    changes: [
      'Madness: Project Nexus Mod v9.5 is on the site. At 146 MB it is larger than GitHub will hold in one file, so it ships in two pieces and is stitched back together in your browser',
      'Flash saves were wiped every time the game list was rebuilt. Nothing said so — progress was simply gone next visit. Old saves are found and carried across now',
      'Saves page: see which games you have progress in, export all of it, load it back on another computer',
      'Every game has an achievement list. Opening a game, time played and how often you return tick themselves',
      'The objectives are researched per game. Bloxorz counts its 33 stages, every Henry Stickmin ending is listed by name, Duck Life wants all three leagues',
      'Study said "Browser game" under every tool. It says Desmos, GeoGebra, Quizlet and Google now',
      'Linking straight to Quizlet or Keep landed on a dead grey box. They open in a tab now',
      'Opening a game in a blank tab used to drag the whole site with it. It is the game alone, and one click anywhere makes it fullscreen',
      'Esc skips the fullscreen prompt',
      'The site counts visits. It records which page is open and nothing else',
    ],
  },
  {
    version: 'v1.2.1',
    date: '2026-08-20',
    changes: [
      'Text no longer highlights anywhere in the interface. Typing fields still work normally',
      'The site hides what it renders. Everything draws inside a closed shadow root, so an extension or filter reading the page finds one empty div',
      'Settings has a graphics toggle. Use low if the intro stutters',
    ],
  },
  {
    version: 'v1.2.0',
    date: '2026-08-17',
    changes: [
      'All 111 games from the dump are on the site. It was 13',
      'Games load off a CDN instead of sitting in the repo, so the site itself is tiny',
      'Ruffle is hosted here. It used to reload the whole emulator for every game',
      'Every game has its own link. Back works, and you can send someone a game',
      'Added n-gon. It runs through this site, so it works where github.io is blocked',
      'Run 3 was broken. Fixed',
      'New intro and a new home background, both WebGL',
      'Search and filters are faster and no longer wipe when you switch tabs',
      'Killed the Movies tab. None of those links went anywhere',
      'Killed the Leaderboard tab. It was an empty page that said scores were coming',
      'Quizlet and Keep refuse to load in a frame, so they open in a new tab',
      'Panic key needs Ctrl. Hitting backtick mid-game used to nuke your session',
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

export type OwnerNote = {
  date: string;
  title: string;
  /** `todo` needs the owner to do something; `fyi` is just worth knowing. */
  kind: 'todo' | 'fyi';
  body: string[];
};

/**
 * Notes written to the site's owner rather than to whoever is playing.
 *
 * These sit behind the admin password on the Admin page, because they name
 * settings, quotas and pending work that mean nothing to a visitor and would
 * only advertise the site's soft spots. Nothing secret goes in here either —
 * the admin page is password-gated, not encrypted.
 */
export const OWNER_NOTES: OwnerNote[] = [
  {
    date: '2026-08-28',
    kind: 'todo',
    title: 'Ads are wired up but switched off',
    body: [
      'Every ad position is built and placed: one before a game starts, three down the home page, one every three rows in the arcade and study grids, one under the assistant, and a rail either side of the player and the emulator.',
      'Nothing renders and no request is made until you set PUBLISHER_ID in src/lib/ads.ts. An unconfigured slot takes up no space, so the site looks exactly as it did before.',
      'Add ?adpreview=1 to any page to see where they will go. Full setup is in docs/ads.md.',
    ],
  },
  {
    date: '2026-08-28',
    kind: 'fyi',
    title: 'Adding achievements to more games',
    body: [
      'Run `node scripts/scan-saves.mjs` to see which games save anything and what they call the fields. It reads the names out of the SWF\'s own bytecode, so they are facts rather than guesses.',
      '28 of the 102 scanned games save something; ten have rules written so far. The rest of the output is the shortlist.',
      'Commando will never have save-driven achievements — it has no SharedObject anywhere in it, so there is nothing to read.',
    ],
  },
  {
    date: '2026-08-26',
    kind: 'fyi',
    title: 'Mod v9.5 and the LFS allowance',
    body: [
      'The 146 MB Madness mod is served from Git LFS, which allows 10 GB of transfer a month — roughly 68 plays.',
      'The same file is also committed in two ordinary pieces, and the player falls back to those when LFS refuses. So running out costs a slower load, not a broken game.',
      'If you see the game taking two goes to start, that is the quota, not a bug.',
    ],
  },
  {
    date: '2026-08-26',
    kind: 'todo',
    title: 'Eaglercraft still needs you',
    body: [
      'The relay scaffolding is committed at deploy/eaglercraft-relay/. The card only appears once VITE_EAGLERCRAFT_URL is set in Vercel, and it is baked at build time, so setting it needs a redeploy.',
      'Point that variable at a deployed EaglercraftX client, not at the relay. Multiplayer additionally needs SharedWorldRelay.jar exported from the client and dropped beside the Dockerfile.',
      'Worth knowing before you do: Eaglercraft is an unofficial Minecraft build that attracts takedown requests, and it would sit under your accounts.',
    ],
  },
  {
    date: '2026-08-26',
    kind: 'todo',
    title: 'The Google Drive game list is still blocked',
    body: [
      'The ~1,486 games in "Copy of Ummmmm.md" are all Drive share links. Drive serves a viewer page rather than the file and does not host sites, so those links cannot be embedded or fetched.',
      'They have to be downloaded and re-hosted somewhere static — the swfdump repo pattern works — before any of them can go on the site.',
      'The ROM sections of that list already work: the emulator pages take a local file.',
    ],
  },
  {
    date: '2026-08-25',
    kind: 'fyi',
    title: 'Environment variables this site needs',
    body: [
      'ADMIN_PASSWORD, ADMIN_SESSION_SECRET, UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, all set in Vercel.',
      'Never prefix any of them with VITE_. That prefix inlines a value into the public bundle, which would publish the admin password to anyone who opens the page source.',
      '`npm run check:secrets` fails the build if one of them ever reaches the bundle.',
    ],
  },
];
