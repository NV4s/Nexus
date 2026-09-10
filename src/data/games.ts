import { SWFDUMP_FILES } from './swfdump.ts';
import { swfChunkBase, swfUrl } from '../lib/cdn.ts';
import { siteConfig } from '../lib/siteConfig.ts';

export type Runtime = 'flash' | 'html5';
export type Section = 'arcade' | 'study' | 'courses';

export type Game = {
  slug: string;
  title: string;
  section: Section;
  runtime: Runtime;
  /** Absolute URL, or a path inside the NV4s/swfdump repo. */
  src: string;
  category: string;
  thumb?: string;
  /**
   * How the thumbnail fills the card. Study tiles are fitted whole by default
   * and the few that are banners crop instead; arcade tiles are the other way
   * round. Either can say so explicitly — an image too small to crop without
   * blurring is better shown at its own size.
   */
  thumbFit?: 'cover' | 'contain';
  developer?: string;
  year?: string;  /** Sites that send X-Frame-Options open in a tab instead of a dead iframe. */
  newTab?: boolean;
  /** Which sub-tab a course belongs under. Only read for section 'courses'. */
  track?: 'school' | 'extra';
  /**
   * Number of `.001`, `.002`, … chunks the SWF also ships as.
   *
   * Not how the game is normally loaded — it comes from LFS — but LFS bandwidth
   * is capped monthly, and these are plain blobs with no meter. The player falls
   * back to them when the primary download fails.
   */
  parts?: number;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const titleFromPath = (path: string) =>
  path
    .split('/')
    .pop()!
    .replace(/\.swf$/i, '')
    .replace(/^\((?:\d+|Misc)\)/, '')
    .replace(/[_-]+/g, ' ')
    .trim();

/** Filenames that do not spell the real title. Keyed by swfdump path. */
const TITLES: Record<string, string> = {
  'Achivement_Unlocked/Achivement_Unlocked.swf': 'Achievement Unlocked',
  'Achivement_Unlocked/Achivement_Unlocked_3.swf': 'Achievement Unlocked 3',
  'Adrenaline.swf': 'Adrenaline Challenge',
  'Bush-Shootout.swf': 'Bush Shootout',
  "Papa_Games/Papa's_PanCakeria.swf": "Papa's Pancakeria",
  'Cursor_10.swf': 'Cursor*10',
  'Snake_(Slug_Worm_Python).swf': 'Snake',
  'Madness_Project_Nexus_Classic.swf': 'Madness: Project Nexus Classic',
  'MPN_Classic_Redux.swf': 'Madness: Project Nexus — Classic Redux',
  'MPNC_Goofy_ahh_mod.swf': 'Madness: Project Nexus — Goofy Ahh Mod',
  'MPNC_Mod_(N.A.F).swf': 'Madness: Project Nexus — N.A.F. Mod',
  'MPNC_Mod_(V6_1).swf': 'Madness: Project Nexus — Mod v6.1',
  'MPNC_Modded.swf': 'Madness: Project Nexus — Modded',
  'MPNC_modv7.swf': 'Madness: Project Nexus — Mod v7',
  'MPNC_modv9_5.swf': 'Madness: Project Nexus — Mod v9.5',
  'MPNC_Nexus_Mod.swf': 'Madness: Project Nexus — Nexus Mod',
  'MPNC_Recompiled.swf': 'Madness: Project Nexus — Recompiled',
  'MPNC_Story_Expantion_Reborn.swf': 'Madness: Project Nexus — Story Expansion Reborn',
  'MPNC_TOU_Reborn_V1.swf': 'Madness: Project Nexus — TOU Reborn v1',
  'Unfinished_Sarge_Game_Demo.swf': 'Unfinished Sarge Game (Demo)',
};

/** Genre per slug. Anything unlisted lands in Arcade. */
const CATEGORIES: Record<string, string> = {
  'achievement-unlocked': 'Platformer',
  'achievement-unlocked-2': 'Platformer',
  'achievement-unlocked-3': 'Platformer',
  'adrenaline-challenge': 'Racing',
  'alien-hominid': 'Action',
  asteroids: 'Retro',
  astroflash: 'Action',
  avalanche: 'Action',
  'battle-pong': 'Retro',
  battleships: 'Strategy',
  bloxorz: 'Puzzle',
  bowman: 'Action',
  boxhead: 'Shooter',
  'boxhead-2play-rooms': 'Shooter',
  'boxhead-more-rooms': 'Shooter',
  'boxhead-the-christmas-nightmare': 'Shooter',
  'boxhead-the-nightmare': 'Shooter',
  'boxhead-the-nightmare-biever-and-baby': 'Shooter',
  'boxhead-the-rooms': 'Shooter',
  'boxhead-the-zombie-wars': 'Shooter',
  'bubble-shooter': 'Puzzle',
  'bubble-tanks-2': 'Shooter',
  'bullet-bill': 'Action',
  'bush-shootout': 'Shooter',
  'cactus-mccoy': 'Platformer',
  'cactus-mccoy-2': 'Platformer',
  'castle-wars': 'Strategy',
  causality: 'Puzzle',
  'champion-archer': 'Action',
  'choose-your-weapon': 'Action',
  'choose-your-weapon-2': 'Action',
  'choose-your-weapon-3': 'Action',
  'choose-your-weapon-4': 'Action',
  'color-switch': 'Action',
  commando: 'Shooter',
  'commando-2': 'Shooter',
  'commando-3': 'Shooter',
  'connect-4': 'Puzzle',
  'conquer-antarctica': 'Strategy',
  'crimson-room': 'Adventure',
  cubefield: 'Action',
  'cursor-10': 'Puzzle',
  'cursor-invisible': 'Puzzle',
  curveball: 'Retro',
  doom: 'Shooter',
  'dr-carter-and-the-cave-of-despair': 'Adventure',
  'duck-life': 'Simulation',
  'duck-life-2': 'Simulation',
  'duck-life-3': 'Simulation',
  'duck-life-4': 'Simulation',
  'endless-war': 'Shooter',
  'endless-war-2': 'Shooter',
  'endless-war-3': 'Shooter',
  'endless-war-4': 'Shooter',
  'endless-war-5': 'Shooter',
  'endless-war-6': 'Shooter',
  'endless-war-7': 'Shooter',
  'endless-war-defense': 'Strategy',
  'gun-mayhem-2': 'Action',
  'guppy-guard-express': 'Puzzle',
  'breaking-the-bank': 'Adventure',
  'escaping-the-prison': 'Adventure',
  'stealing-the-diamond': 'Adventure',
  'infiltrating-the-airship': 'Adventure',
  'fleeing-the-complex': 'Adventure',
  'crossing-the-pit': 'Adventure',
  jacksmith: 'Simulation',
  'meteor-blastor': 'Shooter',
  'papa-louie': 'Platformer',
  'papa-louie-2': 'Platformer',
  'papa-louie-3': 'Platformer',
  'raft-wars': 'Strategy',
  'raft-wars-2': 'Strategy',
  snake: 'Retro',
  'steak-and-jake': 'Platformer',
  'steak-and-jake-midnight-march': 'Platformer',
  'warfare-1917': 'Strategy',
};

/**
 * Hand-checked metadata. Developer and year are only present where they are known —
 * an absent field is better than an invented one.
 */
const META: Record<string, Partial<Game>> = {
  'achievement-unlocked': {
    developer: 'John Cooney (jmtb02)',
    year: '2008',
    thumb: '/thumbs/achievement-unlocked.png',  },
  'achievement-unlocked-2': {
    developer: 'John Cooney (jmtb02)',
    year: '2010',
    thumb: '/thumbs/achievement-unlocked-2.png',  },
  'achievement-unlocked-3': {
    developer: 'John Cooney (jmtb02)',
    year: '2012',
    thumb: '/thumbs/achievement-unlocked-3.png',  },
  'adrenaline-challenge': {
    thumb: '/thumbs/adrenaline-challenge.png',  },
  'alien-hominid': {
    developer: 'The Behemoth',
    year: '2002',
    thumb: '/thumbs/alien-hominid.png',  },
  asteroids: { thumb: '/thumbs/asteroids.jpg',},
  astroflash: { thumb: '/thumbs/astroflash.png' },
  avalanche: { thumb: '/thumbs/avalanche.png',},
  'battle-pong': { thumb: '/thumbs/battle-pong.png' },
  battleships: { thumb: '/thumbs/battleships.png' },
  bloxorz: {
    developer: 'Damien Clarke',
    year: '2007',
    thumb: '/thumbs/bloxorz.jpg',  },
  bowman: { thumb: '/thumbs/bowman.png',},
  boxhead: { developer: 'Sean Cooper',},
  'bubble-tanks-2': { developer: 'Hero Interactive', year: '2008' },
  'cactus-mccoy': {
    developer: 'Flipline Studios',
    year: '2011',  },
  'cactus-mccoy-2': { developer: 'Flipline Studios', year: '2012' },
  'commando-2': {
    developer: 'Macrojoy',  },
  'commando-3': {
    developer: 'Macrojoy',  },
  'crimson-room': {
    developer: 'Toshimitsu Takagi',
    year: '2004',  },
  'cursor-10': {
    developer: 'Nekogames',
    year: '2008',  },
  doom: { developer: 'id Software',},
  'duck-life': { developer: 'Wix Games',},
  'duck-life-2': { developer: 'Wix Games' },
  'duck-life-3': { developer: 'Wix Games' },
  'duck-life-4': { developer: 'Wix Games' },
  'gun-mayhem-2': {
    thumb: '/thumbs/gun-mayhem-2.jpg',  },
  jacksmith: { developer: 'Flipline Studios', year: '2012',},
  'breaking-the-bank': { developer: 'PuffballsUnited', year: '2008',},
  'escaping-the-prison': { developer: 'PuffballsUnited', year: '2010',},
  'stealing-the-diamond': { developer: 'PuffballsUnited', year: '2011',},
  'infiltrating-the-airship': { developer: 'PuffballsUnited', year: '2013',},
  'fleeing-the-complex': { developer: 'PuffballsUnited', year: '2015',},
  'crossing-the-pit': { developer: 'PuffballsUnited',},
  'madness-project-nexus-classic': {
    developer: 'Krinkels & Swain',
    year: '2012',  },
  'warfare-1917': { developer: 'Con Artist Games', year: '2008',},
  'color-switch': { developer: 'Fortafy Games', year: '2015' },
};

/**
 * Games stored in LFS that also ship as chunks, and how many.
 *
 * LFS allows 10 GB of transfer a month, which at 146 MB is roughly 68 plays of
 * this file. The chunks cost nothing against that, so they stand by.
 */
const CHUNK_FALLBACK: Record<string, number> = {
  'madness-project-nexus-mod-v9-5': 2,
};

const PAPA_SIM = /^Papa_Games\/Papa's_/;

function fromSwf(path: string): Game {
  const title = TITLES[path] ?? titleFromPath(path);
  const slug = slugify(title);
  const category = CATEGORIES[slug] ?? (PAPA_SIM.test(path) ? 'Simulation' : 'Arcade');
  return {
    slug,
    title,
    section: 'arcade',
    runtime: 'flash',
    src: path,
    category,
    ...(CHUNK_FALLBACK[slug] ? { parts: CHUNK_FALLBACK[slug] } : {}),
    ...META[slug],
  };
}

/** Games that are not in the SWF dump. */
const EXTRA: Game[] = [
  {
    slug: 'run-3',
    title: 'Run 3',
    section: 'arcade',
    runtime: 'flash',
    // Still the developer's own copy, but proxied by vercel.json — player03.com sends
    // no Access-Control-Allow-Origin, so fetching it cross-origin fails outright.
    src: '/swf/run-3.swf',
    category: 'Platformer',
    thumb: '/thumbs/run-3.jpg',
    developer: 'Player 03',
    year: '2014',  },
  {
    slug: 'n-gon',
    title: 'n-gon',
    section: 'arcade',
    runtime: 'html5',
    // Proxied through this origin by vercel.json. github.io is filtered on school
    // networks, and proxying means the game is whatever landgreen shipped today
    // rather than a copy that goes stale.
    src: '/n-gon/',
    category: 'Action',
    developer: 'Ross Landgreen',  },
  {
    slug: 'gba-emulator',
    title: 'GBA Emulator',
    section: 'arcade',
    runtime: 'html5',
    src: 'https://gba.ninja/',
    category: 'Emulator',  },

  /*
   * Pokémon. Both of these send no X-Frame-Options and no frame-ancestors, so
   * they play in the page rather than opening a tab — checked, not assumed.
   *
   * Pokémon Infinite Fusion itself is not here because no browser build of it
   * exists: it is an RPG Maker XP game for Windows. Every "play it online" page
   * found so far — including pokerogue.io/pokemon-infinite-fusion and the site
   * it embeds — is the sprite-fusion calculator below under a misleading title.
   */
  {
    slug: 'pokerogue',
    title: 'PokéRogue',
    section: 'arcade',
    runtime: 'html5',
    src: 'https://pokerogue.net/',
    category: 'RPG',
    developer: 'pagefaultgames',  },
  {
    slug: 'pokemon-showdown',
    title: 'Pokémon Showdown',
    section: 'arcade',
    runtime: 'html5',
    src: 'https://play.pokemonshowdown.com/',
    category: 'RPG',
    developer: 'Smogon',
    // Its headers allow framing, but the client checks for itself and stops with
    // "Please visit Showdown directly" — so this is a tab, not an embed.
    newTab: true,  },
  /*
   * Both proxied through this origin by vercel.json, the same as n-gon: they are
   * served from github.io, which school filters block wholesale, and proxying
   * also means each game stays whatever its author last shipped.
   */
  /*
   * Three modern browser games. None of their official hosts allow framing, and
   * for Polytrack proxying cannot help either — kodub.com names its permitted
   * ancestors explicitly rather than allowing 'self', so serving it from here
   * would still be refused. These are self-hosted community builds, proxied the
   * same way n-gon is, which also gets them past filters that block github.io.
   */
  {
    slug: 'polytrack',
    title: 'PolyTrack',
    section: 'arcade',
    runtime: 'html5',
    src: '/polytrack/',
    category: 'Racing',
    developer: 'Kodub',  },
  {
    slug: 'basket-random',
    title: 'Basket Random',
    section: 'arcade',
    runtime: 'html5',
    src: '/basket-random/',
    category: 'Sports',
    developer: 'RHM Interactive',  },
  {
    slug: 'basketball-stars',
    title: 'Basketball Stars',
    section: 'arcade',
    runtime: 'html5',
    src: '/basketball-stars/',
    category: 'Sports',
    developer: 'Madpuffers',  },
  {
    slug: 'indian-uphill-bus-simulator',
    title: 'Indian Uphill Bus Simulator 3D',
    section: 'arcade',
    runtime: 'html5',
    src: '/bus-simulator/',
    category: 'Racing',
    thumb: '/thumbs/indian-uphill-bus-simulator.jpg',
    developer: 'Mageeks Apps & Games',
    year: '2019',  },
  {
    slug: 'tetris',
    title: 'Tetris',
    section: 'arcade',
    runtime: 'html5',
    src: '/tetris/index.html',
    category: 'Puzzle',
    thumb: '/thumbs/tetris.png',
    developer: 'Nexus',
    year: '2026',  },
  {
    slug: 'level-13',
    title: 'Level 13',
    section: 'arcade',
    runtime: 'html5',
    src: '/level13/',
    category: 'Strategy',
    developer: 'Nina Routasuo',  },
  {
    slug: 'a-dark-room',
    title: 'A Dark Room',
    section: 'arcade',
    runtime: 'html5',
    src: '/adarkroom/',
    category: 'Strategy',
    thumb: '/thumbs/a-dark-room.png',
    // The game's own 125px icon is all it publishes; cropping it to a 16:10
    // tile would mean upscaling it past twice its size.
    thumbFit: 'contain',
    developer: 'Doublespeak Games',  },
  {
    slug: 'pokemon-infinite-fusion-calculator',
    title: 'Infinite Fusion Calculator',
    section: 'arcade',
    runtime: 'html5',
    src: 'https://aegide.pokemoninfinitefusion.io/',
    category: 'RPG',  },
  /*
   * Written for this site, served from public/time-crisis/. A rail shooter built
   * around the twin-pedal cover system: each pedal leans you out of one side of
   * the field, dropping back into cover is what reloads you, and a wave always
   * spans both sides so neither pedal clears an area alone. The handling numbers
   * — headshot multiplier, post-hit invulnerability, the window a red "crisis"
   * shot gives you to reach cover, the magazine and ammo-drop counts — are the
   * arcade cabinet's own tuning values rather than guesses. Mechanics only: no
   * code or asset from that build is used or redistributed here.
   */
  {
    slug: 'crisis-point',
    title: 'Crisis Point',
    section: 'arcade',
    runtime: 'html5',
    // The file, not the directory: a bare /time-crisis/ is caught by the SPA
    // fallback and serves Nexus's own index.html, which loads the whole site
    // inside the game frame instead of the game.
    src: '/time-crisis/index.html',
    category: 'Action',
    thumb: '/thumbs/crisis-point.svg',
    thumbFit: 'cover',
    developer: 'Fan reimplementation',
    year: '2026',  },
  {
    slug: 'shootout-reloaded',
    title: 'Shootout Reloaded',
    section: 'arcade',
    runtime: 'html5',
    // The file, not the directory, for the same reason as above.
    src: '/shootout-reloaded/index.html',
    category: 'Shooter',
    // A frame captured from the running game; the export's own icon is the
    // stock Construct logo, which says nothing about the game.
    thumb: '/thumbs/shootout-reloaded.jpg',
    developer: 'Nexus',
    year: '2026',  },
];



/**
 * Free courses, split into the two sub-tabs the Courses page offers.
 *
 * `newTab` is set from each site's real headers, not guessed: most course
 * platforms send X-Frame-Options SAMEORIGIN, so most of these open in a tab.
 * The four that do embed are marked by their absence from that flag.
 */
const COURSES: Game[] = [
  {
    slug: 'comptia',
    title: 'CompTIA',
    section: 'courses',
    track: 'school',
    runtime: 'html5',
    src: 'https://www.comptia.org/en-us/',
    category: 'Certification',
    developer: 'CompTIA',
    newTab: true,  },
  {
    slug: 'professor-messer',
    title: 'Professor Messer',
    section: 'courses',
    track: 'school',
    runtime: 'html5',
    src: 'https://www.professormesser.com/',
    category: 'Certification',
    developer: 'Professor Messer',  },
  {
    slug: 'cs50',
    title: 'CS50',
    section: 'courses',
    track: 'school',
    runtime: 'html5',
    src: 'https://cs50.harvard.edu/x/',
    category: 'Computer science',
    developer: 'Harvard',
    newTab: true,  },
  {
    slug: 'mit-ocw',
    title: 'MIT OpenCourseWare',
    section: 'courses',
    track: 'school',
    runtime: 'html5',
    src: 'https://ocw.mit.edu/',
    category: 'University',
    developer: 'MIT',  },
  {
    slug: 'khan-test-prep',
    title: 'Khan Academy Test Prep',
    section: 'courses',
    track: 'school',
    runtime: 'html5',
    src: 'https://www.khanacademy.org/test-prep',
    category: 'Test prep',
    developer: 'Khan Academy',
    newTab: true,  },
  {
    slug: 'openstax-courses',
    title: 'OpenStax Textbooks',
    section: 'courses',
    track: 'school',
    runtime: 'html5',
    src: 'https://openstax.org/subjects',
    category: 'Textbooks',
    developer: 'Rice University',  },
  {
    slug: 'claude-courses',
    title: 'Claude Courses',
    section: 'courses',
    track: 'extra',
    runtime: 'html5',
    src: 'https://anthropic.skilljar.com/',
    category: 'AI',
    developer: 'Anthropic',
    newTab: true,  },
  {
    slug: 'freecodecamp',
    title: 'freeCodeCamp',
    section: 'courses',
    track: 'extra',
    runtime: 'html5',
    src: 'https://www.freecodecamp.org/learn/',
    category: 'Programming',
    developer: 'freeCodeCamp',
    newTab: true,  },
  {
    slug: 'codecademy',
    title: 'Codecademy',
    section: 'courses',
    track: 'extra',
    runtime: 'html5',
    src: 'https://www.codecademy.com/catalog',
    category: 'Programming',
    developer: 'Codecademy',  },
  {
    slug: 'w3schools',
    title: 'W3Schools',
    section: 'courses',
    track: 'extra',
    runtime: 'html5',
    src: 'https://www.w3schools.com/',
    category: 'Reference',
    developer: 'W3Schools',
    newTab: true,  },
  {
    slug: 'coursera',
    title: 'Coursera',
    section: 'courses',
    track: 'extra',
    runtime: 'html5',
    src: 'https://www.coursera.org/courses?query=free',
    category: 'University',
    developer: 'Coursera',
    newTab: true,  },
  {
    slug: 'duolingo',
    title: 'Duolingo',
    section: 'courses',
    track: 'extra',
    runtime: 'html5',
    src: 'https://www.duolingo.com/',
    category: 'Languages',
    developer: 'Duolingo',
    newTab: true,  },
  {
    slug: 'brilliant',
    title: 'Brilliant',
    section: 'courses',
    track: 'extra',
    runtime: 'html5',
    src: 'https://brilliant.org/courses/',
    category: 'Maths',
    developer: 'Brilliant',
    newTab: true,  },
  {
    slug: 'sololearn',
    title: 'SoloLearn',
    section: 'courses',
    track: 'extra',
    runtime: 'html5',
    src: 'https://www.sololearn.com/',
    category: 'Programming',
    developer: 'SoloLearn',
    newTab: true,  },
];

/**
 * Google Doodle games.
 *
 * They refuse to be framed by anyone but Google — every one sends
 * `frame-ancestors 'self' *.google.com …`, and this site is not on that list.
 * But `'self'` is judged against whoever serves the *document*, so proxying
 * /logos through this origin (see vercel.json) satisfies it. Their assets are
 * root-relative, so they come through the same proxy.
 *
 * Only the interactive ones are here. There are thousands of doodles and about
 * twenty that are games; each path below was loaded and checked rather than
 * guessed from a naming pattern, because the archive moved and the old JSON
 * index that used to list them returns a 404 now.
 */
const DOODLES: [slug: string, title: string, path: string, year: string][] = [
  ['doodle-pacman', 'Pac-Man', '/logos/2010/pacman10-hp.html', '2010'],
  ['doodle-magic-cat-academy', 'Magic Cat Academy', '/logos/2016/halloween16/halloween16.html', '2016'],
  ['doodle-great-ghoul-duel', 'The Great Ghoul Duel', '/logos/2021/halloween18_reboot/r1025/halloween18_reboot.html', '2018'],
  ['doodle-halloween-2019', 'Halloween 2019', '/logos/2019/halloween19/rc1/halloween19.html', '2019'],
  ['doodle-magic-cat-academy-2', 'Magic Cat Academy 2', '/logos/2020/halloween20/rc1/halloween20.html', '2020'],
  ['doodle-halloween-2021', 'Halloween 2021', '/logos/2021/halloween21/v81123/halloween21.html', '2021'],
  ['doodle-champion-island', 'Champion Island Games', '/logos/2020/kitsune/rc7/kitsune20.html', '2021'],
  ['doodle-garden-gnomes', 'Garden Gnomes', '/logos/2018/gnomes/gnomes18.html', '2018'],
  ['doodle-loteria', 'Lotería', '/logos/2019/loteria/r3/loteria19.html', '2019'],
  ['doodle-fischinger', 'Oskar Fischinger', '/logos/doodles/2017/fischinger/fischinger17.9.html', '2017'],
  ['doodle-scoville', 'Scoville', '/logos/2016/scoville/scoville16.html', '2016'],
  ['doodle-pony-express', 'Pony Express', '/logos/2015/ponyexpress/ponyexpress15.html', '2015'],
  ['doodle-pizza', 'Pizza', '/logos/2021/pizza/rc5/pizza.html', '2021'],
  ['doodle-bubble-tea', 'Bubble Tea', '/logos/2023/boba/rc3/boba.html', '2023'],
  ['doodle-pani-puri', 'Pani Puri', '/logos/2023/panipuri/r3/panipuri.html', '2023'],
  ['doodle-cricket', 'Cricket', '/logos/2017/cricket17/cricket17.html', '2017'],
  ['doodle-hip-hop', 'Hip Hop', '/logos/2017/hiphop/hiphop17.html', '2017'],
  ['doodle-basketball', 'Basketball', '/logos/2012/basketball-2012-hp.html', '2012'],
  ['doodle-hurdles', 'Hurdles', '/logos/2012/hurdles-2012-hp.html', '2012'],
  ['doodle-soccer', 'Soccer', '/logos/2012/football-2012-hp.html', '2012'],
];

const DOODLE_GAMES: Game[] = DOODLES.map(([slug, title, src, year]) => ({
  slug,
  title,
  section: 'arcade',
  runtime: 'html5',
  src,
  category: 'Doodle',
  developer: 'Google',
  year,}));

/**
 * The Eaglercraft client is deployed separately (see deploy/eaglercraft-relay/README.md)
 * and its URL is baked in at build time. Unset means no card at all, which beats a
 * card that opens a blank frame.
 */
const EAGLERCRAFT: Game[] = import.meta.env?.VITE_EAGLERCRAFT_URL
  ? [
      {
        slug: 'eaglercraft',
        title: 'Eaglercraft',
        section: 'arcade',
        runtime: 'html5',
        src: import.meta.env?.VITE_EAGLERCRAFT_URL,
        category: 'Sandbox',      },
    ]
  : [];

/**
 * Study tools. `newTab` is set from each site's actual headers rather than by
 * guessing: Wolfram Alpha, Symbolab, Translate, PhET, Scratch, Merriam-Webster,
 * Quizlet and Keep all send X-Frame-Options or a frame-ancestors policy that
 * refuses this origin, and an embedded one would be a dead grey box.
 * `developer` is the vendor: without it the card subtitle falls through to the
 * generic "Browser game" (GameCard), which says nothing about what the tool is.
 */
const STUDY: Game[] = [
  {
    slug: 'desmos',
    title: 'Desmos Graphing Calculator',
    section: 'study',
    runtime: 'html5',
    src: 'https://www.desmos.com/calculator',
    thumb: '/thumbs/study/desmos.png',
    category: 'Math',
    developer: 'Desmos',
  },
  {
    slug: 'geogebra',
    title: 'GeoGebra Calculator',
    section: 'study',
    runtime: 'html5',
    src: 'https://www.geogebra.org/calculator',
    category: 'Math',
    developer: 'GeoGebra',
  },
  {
    slug: 'desmos-scientific',
    title: 'Desmos Scientific Calculator',
    section: 'study',
    runtime: 'html5',
    src: 'https://www.desmos.com/scientific',
    thumb: '/thumbs/study/desmos-scientific.png',
    category: 'Math',
    developer: 'Desmos',
  },
  {
    slug: 'geogebra-geometry',
    title: 'GeoGebra Geometry',
    section: 'study',
    runtime: 'html5',
    src: 'https://www.geogebra.org/geometry',
    category: 'Math',
    developer: 'GeoGebra',
  },
  {
    slug: 'mathway',
    title: 'Mathway',
    section: 'study',
    runtime: 'html5',
    src: 'https://www.mathway.com/',
    thumb: '/thumbs/study/mathway.png',
    category: 'Math',
    developer: 'Mathway',
  },
  {
    slug: 'khan-academy',
    title: 'Khan Academy',
    section: 'study',
    runtime: 'html5',
    src: 'https://www.khanacademy.org/',
    thumb: '/thumbs/study/khan-academy.png',
    category: 'Courses',
    developer: 'Khan Academy',
    // Its headers look framable from a plain request but a real frame is refused,
    // so this is set from what actually happens rather than what the headers say.
    newTab: true,
  },
  {
    slug: 'wikipedia',
    title: 'Wikipedia',
    section: 'study',
    runtime: 'html5',
    src: 'https://en.wikipedia.org/wiki/Main_Page',
    thumb: '/thumbs/study/wikipedia.png',
    category: 'Reference',
    developer: 'Wikimedia',
  },
  {
    slug: 'periodic-table',
    title: 'Periodic Table',
    section: 'study',
    runtime: 'html5',
    src: 'https://ptable.com/',
    thumb: '/thumbs/study/periodic-table.png',
    category: 'Science',
    developer: 'Ptable',
  },
  {
    slug: 'onelook',
    title: 'OneLook Dictionary',
    section: 'study',
    runtime: 'html5',
    src: 'https://www.onelook.com/',
    thumb: '/thumbs/study/onelook.png',
    category: 'Reference',
    developer: 'OneLook',
  },
  {
    slug: 'turbowarp',
    title: 'TurboWarp',
    section: 'study',
    runtime: 'html5',
    src: 'https://turbowarp.org/',
    thumb: '/thumbs/study/turbowarp.png',
    category: 'Coding',
    developer: 'TurboWarp',  },
  {
    slug: 'snap',
    title: 'Snap!',
    section: 'study',
    runtime: 'html5',
    src: 'https://snap.berkeley.edu/snap/snap.html',
    thumb: '/thumbs/study/snap.png',
    category: 'Coding',
    developer: 'UC Berkeley',
  },
  {
    slug: 'blockly-games',
    title: 'Blockly Games',
    section: 'study',
    runtime: 'html5',
    src: 'https://blockly.games/',
    thumb: '/thumbs/study/blockly-games.png',
    category: 'Coding',
    developer: 'Google',
  },
  {
    slug: 'quizizz',
    title: 'Quizizz',
    section: 'study',
    runtime: 'html5',
    src: 'https://quizizz.com/',
    thumb: '/thumbs/study/quizizz.png',
    thumbFit: 'cover',
    category: 'Flashcards',
    developer: 'Quizizz',  },
  {
    slug: 'openstax',
    title: 'OpenStax Textbooks',
    section: 'study',
    runtime: 'html5',
    src: 'https://openstax.org/',
    thumb: '/thumbs/study/openstax.webp',
    thumbFit: 'cover',
    category: 'Courses',
    developer: 'Rice University',
  },
  {
    slug: 'excalidraw',
    title: 'Excalidraw',
    section: 'study',
    runtime: 'html5',
    src: 'https://excalidraw.com/',
    thumb: '/thumbs/study/excalidraw.png',
    thumbFit: 'cover',
    category: 'Notes',
    developer: 'Excalidraw',
  },
  {
    slug: 'web2calc',
    title: 'Scientific Calculator',
    section: 'study',
    runtime: 'html5',
    src: 'https://web2.0calc.com/',
    category: 'Math',
    developer: 'web2.0calc',
  },
  {
    slug: 'desmos-matrix',
    title: 'Desmos Matrix Calculator',
    section: 'study',
    runtime: 'html5',
    src: 'https://www.desmos.com/matrix',
    thumb: '/thumbs/study/desmos-matrix.png',
    category: 'Math',
    developer: 'Desmos',
  },
  {
    slug: 'wolfram-alpha',
    title: 'Wolfram Alpha',
    section: 'study',
    runtime: 'html5',
    src: 'https://www.wolframalpha.com/',
    thumb: '/thumbs/study/wolfram-alpha.png',
    category: 'Math',
    developer: 'Wolfram',
    newTab: true,
  },
  {
    slug: 'symbolab',
    title: 'Symbolab',
    section: 'study',
    runtime: 'html5',
    src: 'https://www.symbolab.com/',
    thumb: '/thumbs/study/symbolab.svg',
    category: 'Math',
    developer: 'Symbolab',
    newTab: true,
  },
  {
    slug: 'google-translate',
    title: 'Google Translate',
    section: 'study',
    runtime: 'html5',
    src: 'https://translate.google.com/',
    category: 'Language',
    developer: 'Google',
    newTab: true,
  },
  {
    slug: 'phet',
    title: 'PhET Simulations',
    section: 'study',
    runtime: 'html5',
    src: 'https://phet.colorado.edu/',
    category: 'Science',
    developer: 'University of Colorado',
    newTab: true,
  },
  {
    slug: 'scratch',
    title: 'Scratch',
    section: 'study',
    runtime: 'html5',
    src: 'https://scratch.mit.edu/',
    thumb: '/thumbs/study/scratch.png',
    thumbFit: 'cover',
    category: 'Coding',
    developer: 'MIT',
    newTab: true,
  },
  {
    slug: 'merriam-webster',
    title: 'Merriam-Webster',
    section: 'study',
    runtime: 'html5',
    src: 'https://www.merriam-webster.com/',
    thumb: '/thumbs/study/merriam-webster.png',
    category: 'Reference',
    developer: 'Merriam-Webster',
    newTab: true,
  },
  {
    slug: 'quizlet',
    title: 'Quizlet',
    section: 'study',
    runtime: 'html5',
    src: 'https://quizlet.com',
    thumb: '/thumbs/study/quizlet.png',
    category: 'Flashcards',
    developer: 'Quizlet',
    newTab: true,
  },
  {
    slug: 'google-keep',
    title: 'Google Keep',
    section: 'study',
    runtime: 'html5',
    src: 'https://keep.google.com',
    category: 'Notes',
    developer: 'Google',
    newTab: true,
  },
];

export const GAMES: Game[] = [
  ...DOODLE_GAMES,
  ...SWFDUMP_FILES.map(([path]) => fromSwf(path)),
  ...EXTRA,
  ...EAGLERCRAFT,
  ...STUDY,
  ...COURSES,
].sort(
  (a, b) => a.title.localeCompare(b.title),
);

const duplicates = GAMES.map((g) => g.slug).filter((slug, i, all) => all.indexOf(slug) !== i);
if (duplicates.length) throw new Error(`duplicate game slugs: ${duplicates.join(', ')}`);

export const bySlug = (slug: string) => GAMES.find((game) => game.slug === slug);

/** A way in, so 113 tiles are not the first thing anyone has to parse. */
/**
 * Games worth a first visit. Deliberately wider than the eight shown, because the
 * front page samples from it — a returning player should meet something different
 * rather than the same eight tiles every time.
 */
const STARTERS = [
  'bloxorz',
  'run-3',
  'alien-hominid',
  'escaping-the-prison',
  'stealing-the-diamond',
  'fleeing-the-complex',
  'duck-life-3',
  'duck-life-4',
  'cactus-mccoy',
  'cactus-mccoy-2',
  'papas-pizzeria',
  'papas-freezeria',
  'papas-burgeria',
  'warfare-1917',
  'boxhead-the-zombie-wars',
  'gun-mayhem-2',
  'raft-wars',
  'jacksmith',
  'bubble-tanks-2',
  'cursor-10',
  'crimson-room',
  'achievement-unlocked',
  'doom',
  'curveball',
  'cubefield',
  'causality',
  'steak-and-jake',
  'madness-project-nexus-classic',
  'n-gon',
  'adrenaline-challenge',
  'commando',
  'bloxorz',
];

const SHOWN = 8;

/**
 * Sampled once when the module loads: the same eight for as long as this tab is
 * open, a different eight next visit. Re-sampling per render would reshuffle the
 * grid under the cursor every time React re-rendered the page.
 */
const starters = (() => {
  const pool = [...new Set(STARTERS)].map(bySlug).filter((game): game is Game => !!game);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, SHOWN);
})();

export const featuredGames = () => starters;

// A starter naming a game that does not exist would silently shrink the row.
if (import.meta.env?.DEV) {
  const missing = [...new Set(STARTERS)].filter((slug) => !bySlug(slug));
  if (missing.length) console.warn(`starters: no game called ${missing.join(', ')}`);
}

/**
 * The games in a section, minus anything the owner has hidden from the Admin
 * page. Hiding is not security — the slug still resolves if someone types the
 * URL — it is a way to pull a broken or unwanted game off the shelves without
 * a redeploy.
 */
export const gamesIn = (section: Section) => {
  const { hidden, hiddenSections } = siteConfig();
  if (hiddenSections.includes(section)) return [];
  return GAMES.filter((game) => game.section === section && !hidden.includes(game.slug));
};

export const categoriesIn = (section: Section) => [
  ...new Set(gamesIn(section).map((game) => game.category)),
].sort();

/**
 * Resolved URL to load. Absolute and site-root sources pass through; the rest are
 * swfdump paths, which resolve to jsDelivr, raw, or the LFS media endpoint by size.
 */
export const gameUrl = (game: Game) =>
  /^(https?:\/\/|\/)/.test(game.src) ? game.src : swfUrl(game.src);

/**
 * Where to look if the primary download fails.
 *
 * Only for the LFS-hosted games, which also ship as chunks. Returning null means
 * a failure is simply a failure — there is nowhere else to try.
 */
export const gameFallback = (game: Game) =>
  game.parts ? { base: swfChunkBase(game.src), parts: game.parts } : null;
