export type Release = {
  version: string;
  date: string;
  changes: string[];
};


export const RELEASES: Release[] = [
  {
    version: 'v1.12.0',
    date: '2026-09-17',
    changes: [
      'The background video plays its full five minutes at 60 frames a second, the same on every device. It used to be a 25 second loop, with a lighter file on slower machines',
      'The page requests nothing that names anything. Cover art, the Flash runtime and every game that loads through this site sit on short unreadable paths, the build files are named by hash, and the SWFs come from this domain now instead of a public CDN. Saved progress follows them across on the first load',
      'The tab says Home, and the page that arrives from the server is four lines with no name, description or preview text in it. The name, icon and colour are put in place after it loads',
      'Nothing on the page says what this site is. Everything draws inside a closed shadow root, so an extension or a filter reading the tab finds one empty element and no text, and the description in the page source is gone',
      'Arcade is now Library, Emulators is now Systems, and the wording around them follows',
      'Settings, achievements and progress moved to short storage names. What you already have moves across the first time you open the site',
      'Cover art for Commando, Commando 2, Commando 3, Color Switch, Connect 4, Conquer Antarctica, Cricket and Crimson Room',
    ],
  },
  {
    version: 'v1.11.0',
    date: '2026-09-12',
    changes: [
      'ULTRAKILL Prelude. It loads through this site, so it works where itch.io is blocked',
      'Rooftop Snipers, loading through this site',
      'Bad Time Simulator, without the Google Analytics the original page carried',
      'Red vs Blue, Ravenfield and RavenBit 2: Winter War. The copies going around had ad banners, tracking and someone else\'s branding on the loading screen. These have none of it',
      'Red vs Blue could crash while loading. Fixed',
      'Red vs Blue started in Russian. It starts in English now, and saves already set to Russian switch over',
      'Boxhead, Boxhead 2Play Rooms, More Rooms and The Christmas Nightmare have cover art',
    ],
  },
  {
    version: 'v1.10.0',
    date: '2026-09-10',
    changes: [
      'Scary Shawarma Kiosk: The Anomaly, with its ads taken out. The ad version pulled in about fifty ad and tracking sites; this one makes no requests to other sites at all',
      'Granny, from an unofficial web port of the real game. Most "Granny online" sites run look-alikes',
      'The Chrome dino game. It starts on a click or tap as well as Space',
      'Twitch Tetris is hosted here, since its own site now refuses to load in a frame',
      'The 2012 Olympic doodles — Basketball, Hurdles and Soccer — showed up as a strip in the corner of the player. They fill it now',
      'Basketball Stars, Basket Random and the Basketball doodle have cover art',
    ],
  },
  {
    version: 'v1.9.0',
    date: '2026-09-09',
    changes: [
      'A chat room. It is one public room with no private messages, and anything with swearing, slurs, links, emails, phone numbers, social handles or addresses is refused before it is saved',
      'Three messages every ten seconds at most, and nobody can take the owner\'s name',
      'The owner can mute or block someone, clear the room or turn chat off. It goes by the random id in your browser, not by who you are',
      'Commando 2. The original only starts on Miniclip\'s site; this copy starts here and keeps your progress',
      'Tetris, built for this site, with hold, a ghost piece and levels',
      'Indian Uphill Bus Simulator 3D, loading through this site',
      'Basketball Stars stopped loading because the site it came from started redirecting to a blocked one. Fixed',
      'Achievement Unlocked 1 and 2 have cover art',
      'Game cards no longer have a line of description under them',
    ],
  },
  {
    version: 'v1.8.1',
    date: '2026-09-08',
    changes: [
      'Shootout Reloaded, hosted here',
      'Nothing in "Start here" or the Series rows could be clicked. Fixed',
      'Achievement Unlocked 3 sat on an Armor Games error for about forty seconds before starting. It starts straight away now. Its Armor Games login and leaderboards stay gone, because their servers are',
      'Achievement Unlocked 3 had another game\'s picture on its card. Fixed',
    ],
  },
  {
    version: 'v1.8.0',
    date: '2026-09-03',
    changes: [
      'The rows of games scroll by dragging, the mouse wheel, touch, the keyboard or the arrows that appear on hover. The drift pauses while you use them',
      'The on-device assistant can look at pictures. That model is about 4 GB, so it only downloads when you attach an image, and it tells you the size first',
    ],
  },
  {
    version: 'v1.7.1',
    date: '2026-09-02',
    changes: [
      'Champion Island\'s cutscenes stalled, and sound in the other doodles broke the same way. Fixed',
      'Polytrack, Basket Random and Basketball Stars, loading through this site',
    ],
  },
  {
    version: 'v1.7.0',
    date: '2026-09-01',
    changes: [
      'Commando 3, rebuilt as one file so it plays here',
      'Achievements could miss a score set after the game closed. Cubefield sat on 135,000 with its score tiers unticked. Saves are re-checked when the site opens and when you open the list, and there is a Re-check saves button',
      'Google Doodle games, Halloween ones included',
      'Series rows: thirteen franchises, each in release order',
      'Study splits into Tools and Courses, with fourteen free courses',
      'The assistant remembers each conversation, separately for every model. Attached files are not kept, only their names',
      'Settings shows what each save takes up and can delete them one game at a time. It also has an accent colour, text size, a reduce-motion switch and one-click tab disguises',
      'The owner can put up a banner for everyone and take games or sections down without an update',
      'A Dark Room and Wikipedia have proper cover art',
    ],
  },
  {
    version: 'v1.6.1',
    date: '2026-08-29',
    changes: [
      'Pages with one or two panels, like the emulator and the assistant, showed a thin box with the rest of the row empty. Panels fill the row again',
      'Achievements and Saves share one Progress tab; Settings and Changelog share one Settings tab. Old links still work',
    ],
  },
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
