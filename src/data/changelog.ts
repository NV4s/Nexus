export type Release = {
  version: string;
  date: string;
  changes: string[];
};


export const RELEASES: Release[] = [
  {
    version: 'v1.14.0',
    date: '2026-10-05',
    changes: [
      'Six graphics levels: Super low, Very low, Low, Normal, High, Ultra. Auto still picks one from your device and drops a level if the 3D stutters.',
      'Super low: no background, cover art, blur, shadows, animation or custom fonts. For the slowest machines.',
      'Very low: no 3D and no blur, still background image. Low: still background, reduced 3D. Normal and up add the background video and more 3D detail; Ultra renders the 3D at full resolution with antialiasing.',
      'Reworked the Midnight, Forest, Ember, Mono and Paper themes to each have a distinct accent, contrast and edge instead of the same palette recoloured. Mono and Paper use square corners.',
    ],
  },
  {
    version: 'v1.13.0',
    date: '2026-10-02',
    changes: [
      'Opening Nexus moves it into an about:blank tab on load and sends the first tab to your panic link. No fullscreen prompt.',
      'If pop-ups are blocked, an alert says to allow them; press OK to retry without reloading.',
      'Inside the about:blank tab the panic key leaves the tab itself, and the tab disguise sets the title and icon you see.',
      'Removed the Open cloaked button in Settings.',
    ],
  },
  {
    version: 'v1.12.0',
    date: '2026-09-17',
    changes: [
      'Background video is the full five minutes at 60 fps on every device. Was a 25-second loop.',
      'Cover art, Ruffle and every game load from short unreadable paths on this domain; build files are named by hash. Saves carry across on first load.',
      'Served HTML is four lines with no name, description or preview. Title, icon and colour are set after load.',
      'Whole site renders inside a closed shadow root; a filter reading the tab finds one empty element.',
      'Renamed Arcade to Library and Emulators to Systems.',
      'Settings, achievements and progress use short storage names; existing data migrates on first load.',
      'Cover art: Commando, Commando 2, Commando 3, Color Switch, Connect 4, Conquer Antarctica, Cricket, Crimson Room.',
    ],
  },
  {
    version: 'v1.11.0',
    date: '2026-09-12',
    changes: [
      'Added ULTRAKILL Prelude, loading through this site.',
      'Added Rooftop Snipers, loading through this site.',
      'Added Bad Time Simulator, without the original Google Analytics.',
      'Added Red vs Blue, Ravenfield and RavenBit 2: Winter War, with the ad banners, tracking and third-party branding removed.',
      'Fixed: Red vs Blue could crash while loading.',
      'Red vs Blue now starts in English; saves set to Russian switch over.',
      'Cover art: Boxhead, Boxhead 2Play Rooms, More Rooms, The Christmas Nightmare.',
    ],
  },
  {
    version: 'v1.10.0',
    date: '2026-09-10',
    changes: [
      'Added Scary Shawarma Kiosk: The Anomaly with ads removed. The ad version loaded about fifty ad and tracking hosts; this makes no third-party requests.',
      'Added Granny, from an unofficial web port.',
      'Added the Chrome dino game; starts on click or tap as well as Space.',
      'Added Twitch Tetris, hosted here because its own site refuses to load in a frame.',
      'Fixed: the 2012 Olympic doodles (Basketball, Hurdles, Soccer) now fill the player instead of a corner strip.',
      'Cover art: Basketball Stars, Basket Random, the Basketball doodle.',
    ],
  },
  {
    version: 'v1.9.0',
    date: '2026-09-09',
    changes: [
      'Added a chat room: one public room, no private messages. Swearing, slurs, links, emails, phone numbers, social handles and addresses are refused before saving.',
      'Chat limits: three messages per ten seconds; the owner name is reserved.',
      'Owner can mute, block, clear the room or turn chat off. Identity is the random browser id.',
      'Added Commando 2, rebuilt to start here and keep progress.',
      'Added Tetris, built for this site, with hold, ghost piece and levels.',
      'Added Indian Uphill Bus Simulator 3D, loading through this site.',
      'Fixed: Basketball Stars stopped loading after its source site began redirecting.',
      'Cover art: Achievement Unlocked 1 and 2.',
      'Removed the description line under game cards.',
    ],
  },
  {
    version: 'v1.8.1',
    date: '2026-09-08',
    changes: [
      'Added Shootout Reloaded, hosted here.',
      'Fixed: items in Start here and the Series rows were not clickable.',
      'Fixed: Achievement Unlocked 3 waited ~40s on an Armor Games error before starting. Its Armor Games login and leaderboards stay gone; the servers are down.',
      'Fixed: Achievement Unlocked 3 showed another game\'s cover.',
    ],
  },
  {
    version: 'v1.8.0',
    date: '2026-09-03',
    changes: [
      'Game rows scroll by drag, wheel, touch, keyboard or hover arrows. The drift pauses while you use them.',
      'The on-device assistant reads images. The model is ~4 GB and downloads only when you attach an image, after showing the size.',
    ],
  },
  {
    version: 'v1.7.1',
    date: '2026-09-02',
    changes: [
      'Fixed: Champion Island cutscenes stalled and audio broke in the other doodles.',
      'Added Polytrack, Basket Random and Basketball Stars, loading through this site.',
    ],
  },
  {
    version: 'v1.7.0',
    date: '2026-09-01',
    changes: [
      'Added Commando 3, rebuilt as one file.',
      'Fixed: achievements could miss a score set after the game closed (Cubefield stuck at 135,000). Saves are re-checked on open and from a new Re-check saves button.',
      'Added Google Doodle games, including Halloween ones.',
      'Added Series rows: thirteen franchises in release order.',
      'Study split into Tools and Courses, with fourteen free courses.',
      'The assistant keeps separate history per conversation and model. Attached files are not stored, only their names.',
      'Settings shows per-save size and deletes saves per game, plus accent colour, text size, reduce-motion and tab disguises.',
      'Owner can post a site banner and take games or sections down without a release.',
      'Cover art: A Dark Room, Wikipedia.',
    ],
  },
  {
    version: 'v1.6.1',
    date: '2026-08-29',
    changes: [
      'Fixed: one- and two-panel pages (emulator, assistant) left the rest of the row empty.',
      'Achievements and Saves merged into Progress; Settings and Changelog merged into Settings. Old links still work.',
    ],
  },
  {
    version: 'v1.6.0',
    date: '2026-08-28',
    changes: [
      'Achievements read the game\'s own save. Score tiers unlock from your top score in Cubefield, Duck Life 1-4, Warfare 1917, Gun Mayhem 2, Endless War 4 and the Madness mods.',
      'Achievements update during play, not only after leaving and returning.',
      'Fixed: Commando drew at 400x300 in the frame; it fills the frame now. A Stretch to fit switch in Settings covers the few games that set their own size.',
      'Game card descriptions show on hover.',
      'Fixed: Settings panels left a column of empty space next to a tall one.',
      'Seven themes: Dark, Light, Midnight, Forest, Ember, Mono, Paper.',
      'The assistant renders formatting (bold, lists, headings, code) instead of raw markdown.',
      'Each provider has steps for getting an API key, noting which need payment.',
      'Added a drifting game row at the top of the arcade; hover to stop it.',
      'The home page snaps to one section at a time.',
      'Added Level 13 and A Dark Room, proxied through this site.',
      'Pokemon Showdown opens in a tab; it allows embedding then refuses to run framed.',
      'Study tools show their own logos.',
    ],
  },
  {
    version: 'v1.5.1',
    date: '2026-08-26',
    changes: [
      'Madness: Project Nexus Mod v9.5 loads as one file again after GitHub re-enabled Git LFS for the repo.',
      'The two-piece copy is kept as a fallback for when LFS runs out of monthly traffic.',
    ],
  },
  {
    version: 'v1.5.0',
    date: '2026-08-26',
    changes: [
      'Added console emulators: NES, SNES, N64, Game Boy, GBA, DS, PlayStation, Genesis, Master System, Sega CD, Saturn, Atari, arcade. You open your own ROM; it stays on your device and nothing is hosted or uploaded.',
      'No PS5, PS4, Vita or 3DS: PS5 has no emulator, the others are desktop-only.',
      'Flash games got a toolbar: restart, download .swf, download save, FPS, quality, volume.',
      'Per-game save export: the real .sol, or a backup this site can read back.',
      'Achievements and playtime sync between devices from Settings. Import merges, so an old file cannot undo newer progress.',
      'The assistant selects models from a list and accepts images and documents.',
      'Khan Academy opens in a tab; it claims embedding then refuses.',
      'Added TurboWarp (Scratch projects) and Quizizz (flashcards) as stand-ins for the blocked Scratch and Quizlet, plus Snap!, Blockly Games, OpenStax and Excalidraw.',
      'Panic key can open your link in a new tab and leave this one blank.',
    ],
  },
  {
    version: 'v1.4.1',
    date: '2026-08-25',
    changes: [
      'Fixed: the API key box could fail to appear; saving a key hid the whole form.',
      'The front page scrolls through the arcade instead of stopping at eight tiles.',
      'Starter games differ each visit.',
      'Study has 17 tools. Those that refuse to load framed open in a tab, decided per site.',
    ],
  },
  {
    version: 'v1.4.0',
    date: '2026-08-25',
    changes: [
      'Added an assistant: runs on your device, or through your own Claude, Gemini or ChatGPT key. No shared key and nothing routes through this site.',
      'On-device mode downloads a small model on first use, after a button press and a size prompt.',
      'Achievements can read a game\'s own save file. Flash games store progress in the browser, readable here.',
      'The Saves page shows exactly what a game stored.',
      'Fixed: the blank tab recorded no playtime since it was added.',
      'Visits count per browser, not per tab. Still a random id only: no name, account or IP.',
    ],
  },
  {
    version: 'v1.3.0',
    date: '2026-08-25',
    changes: [
      'Added Madness: Project Nexus Mod v9.5. At 146 MB it exceeds GitHub\'s single-file limit, so it ships in two pieces and is rejoined in the browser.',
      'Fixed: Flash saves were wiped whenever the game list was rebuilt. Old saves are found and carried across.',
      'Saves page: list games with progress, export all, load it on another computer.',
      'Every game has an achievement list. Opening a game, playtime and return visits track automatically.',
      'Objectives researched per game: Bloxorz\'s 33 stages, every Henry Stickmin ending by name, Duck Life\'s three leagues.',
      'Study tools show their real name (Desmos, GeoGebra, Quizlet, Google) instead of "Browser game".',
      'Fixed: deep links to Quizlet or Keep hit a dead frame; they open in a tab.',
      'Fixed: opening a game in a blank tab dragged the whole site; it is the game alone, and one click goes fullscreen.',
      'Esc skips the fullscreen prompt.',
      'The site counts visits, recording only which page is open.',
    ],
  },
  {
    version: 'v1.2.1',
    date: '2026-08-20',
    changes: [
      'Interface text no longer highlights; typing fields still work.',
      'The whole site renders inside a closed shadow root; a filter reading the page finds one empty div.',
      'Settings has a graphics toggle for when the intro stutters.',
    ],
  },
  {
    version: 'v1.2.0',
    date: '2026-08-17',
    changes: [
      'All 111 games from the dump are on the site, up from 13.',
      'Games load from a CDN instead of the repo, keeping the site small.',
      'Ruffle is hosted here and no longer reloads per game.',
      'Every game has its own link; Back works and games are shareable.',
      'Added n-gon, running through this site.',
      'Fixed: Run 3.',
      'New WebGL intro and home background.',
      'Search and filters are faster and keep state across tabs.',
      'Removed the Movies tab (dead links) and the Leaderboard tab (empty placeholder).',
      'Quizlet and Keep open in a new tab; they refuse to load framed.',
      'Panic key requires Ctrl so backtick alone cannot fire mid-game.',
      'Fixed: fullscreen was caught by the popup blocker.',
    ],
  },
  {
    version: 'v1.1.2',
    date: '2026-03-24',
    changes: ['Added Battle Pong, Battleships, Bloxorz, Bowman.'],
  },
  {
    version: 'v1.1.1',
    date: '2026-03-23',
    changes: ['Reorganised where game and image files live.', 'Fixed: Avalanche was the wrong size.'],
  },
  {
    version: 'v1.1.0',
    date: '2026-03-23',
    changes: ['Added Alien Hominid, Gun Mayhem 2, Asteroids, Astroflash, Avalanche.'],
  },
  {
    version: 'v1.0.9',
    date: '2026-03-16',
    changes: ['Added a fullscreen button.', 'Descriptions on the player page.'],
  },
  {
    version: 'v1.0.8',
    date: '2026-03-09',
    changes: ['Moved the Instagram link to the bottom.', 'Intro has sound.'],
  },
  { version: 'v1.0.7', date: '2026-03-09', changes: ['Added the intro.'] },
  { version: 'v1.0.5', date: '2026-03-09', changes: ['Made all cards the same size.'] },
  { version: 'v1.0.3', date: '2026-03-09', changes: ['Added this page.'] },
  {
    version: 'v1.0.1',
    date: '2026-03-08',
    changes: ['Added Home, Study, Arcade.', 'Tab disguise and panic key.'],
  },
  { version: 'v1.0.0', date: '2026-03-08', changes: ['Started.'] },
];

export type OwnerNote = {
  date: string;
  title: string;

  kind: 'todo' | 'fyi';
  body: string[];
};


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
