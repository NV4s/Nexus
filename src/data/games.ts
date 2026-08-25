import { SWFDUMP_FILES } from './swfdump';
import { swfChunkBase, swfUrl } from '../lib/cdn';

export type Runtime = 'flash' | 'html5';
export type Section = 'arcade' | 'study';

export type Game = {
  slug: string;
  title: string;
  section: Section;
  runtime: Runtime;
  /** Absolute URL, or a path inside the NV4s/swfdump repo. */
  src: string;
  category: string;
  thumb?: string;
  developer?: string;
  year?: string;
  blurb?: string;
  /** Sites that send X-Frame-Options open in a tab instead of a dead iframe. */
  newTab?: boolean;
  /**
   * Number of `.001`, `.002`, … chunks the SWF is split across in the dump.
   * Only for files past GitHub's 100 MB blob limit; the player rejoins them.
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
    blurb: 'A platformer with no goal except collecting all 100 achievements.',
  },
  'adrenaline-challenge': {
    thumb: '/thumbs/adrenaline-challenge.png',
    blurb: 'Physics-based motorbike trials over increasingly unfair terrain.',
  },
  'alien-hominid': {
    developer: 'The Behemoth',
    year: '2002',
    thumb: '/thumbs/alien-hominid.png',
    blurb: 'The original Flash run-and-gun that became a console game.',
  },
  asteroids: { thumb: '/thumbs/asteroids.jpg', blurb: 'Flash take on the 1979 vector shooter.' },
  astroflash: { thumb: '/thumbs/astroflash.png' },
  avalanche: { thumb: '/thumbs/avalanche.png', blurb: 'Stay on the falling blocks. That is the whole game.' },
  'battle-pong': { thumb: '/thumbs/battle-pong.png' },
  battleships: { thumb: '/thumbs/battleships.png' },
  bloxorz: {
    developer: 'Damien Clarke',
    year: '2007',
    thumb: '/thumbs/bloxorz.jpg',
    blurb: 'Roll a 1x1x2 block into a hole across 33 levels of tile puzzles.',
  },
  bowman: { thumb: '/thumbs/bowman.png', blurb: 'Angle, power, fire. Turn-based archery duels.' },
  boxhead: { developer: 'Sean Cooper', blurb: 'Top-down zombie survival with barrels and a lot of ammo.' },
  'bubble-tanks-2': { developer: 'Hero Interactive', year: '2008' },
  'cactus-mccoy': {
    developer: 'Flipline Studios',
    year: '2011',
    blurb: 'Cursed treasure hunter brawls through the desert with whatever he picks up.',
  },
  'cactus-mccoy-2': { developer: 'Flipline Studios', year: '2012' },
  'crimson-room': {
    developer: 'Toshimitsu Takagi',
    year: '2004',
    blurb: 'The escape-room game that started the genre.',
  },
  'cursor-10': {
    developer: 'Nekogames',
    year: '2008',
    blurb: 'Ten cursors, one tower. Each run cooperates with the ghosts of your previous ones.',
  },
  doom: { developer: 'id Software', blurb: 'Flash port of the 1993 shooter.' },
  'duck-life': { developer: 'Wix Games', blurb: 'Train a duck. Race the duck. Repeat.' },
  'duck-life-2': { developer: 'Wix Games' },
  'duck-life-3': { developer: 'Wix Games' },
  'duck-life-4': { developer: 'Wix Games' },
  'gun-mayhem-2': {
    thumb: '/thumbs/gun-mayhem-2.jpg',
    blurb: 'Knock the other hats off the platform. Local multiplayer up to four.',
  },
  jacksmith: { developer: 'Flipline Studios', year: '2012', blurb: 'Forge weapons to spec, then watch your army use them.' },
  'breaking-the-bank': { developer: 'PuffballsUnited', year: '2008', blurb: 'Chapter 1 of the Henry Stickmin series.' },
  'escaping-the-prison': { developer: 'PuffballsUnited', year: '2010', blurb: 'Chapter 2. Three endings, all of them stupid.' },
  'stealing-the-diamond': { developer: 'PuffballsUnited', year: '2011', blurb: 'Chapter 3.' },
  'infiltrating-the-airship': { developer: 'PuffballsUnited', year: '2013', blurb: 'Chapter 4.' },
  'fleeing-the-complex': { developer: 'PuffballsUnited', year: '2015', blurb: 'Chapter 5.' },
  'crossing-the-pit': { developer: 'PuffballsUnited', blurb: 'The short one that started it.' },
  'madness-project-nexus-classic': {
    developer: 'Krinkels & Swain',
    year: '2012',
    blurb: 'Arena and story mode built on the Madness Combat animations.',
  },
  'warfare-1917': { developer: 'Con Artist Games', year: '2008', blurb: 'WWI trench warfare as a lane-based strategy game.' },
  'color-switch': { developer: 'Fortafy Games', year: '2015' },
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
    ...META[slug],
  };
}

/** Games that are not in the SWF dump. */
const EXTRA: Game[] = [
  {
    slug: 'madness-project-nexus-mod-v9-5',
    title: 'Madness: Project Nexus — Mod v9.5',
    section: 'arcade',
    runtime: 'flash',
    // 152,891,223 bytes — past GitHub's 100 MB blob limit, and Git LFS is disabled
    // on the dump, so it is committed as MPNC_modv9_5.swf.001 and .002 instead.
    src: 'MPNC_modv9_5.swf',
    parts: 2,
    category: 'Arcade',
  },
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
    year: '2014',
    blurb: 'Endless runner through broken space tunnels. Falling off is a mechanic, not a failure.',
  },
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
    developer: 'Ross Landgreen',
    blurb: 'Physics-driven side-scrolling shooter. Hundreds of tech upgrades, no two runs alike.',
  },
  {
    slug: 'gba-emulator',
    title: 'GBA Emulator',
    section: 'arcade',
    runtime: 'html5',
    src: 'https://gba.ninja/',
    category: 'Emulator',
    blurb: 'Game Boy Advance emulator. Bring your own ROM file.',
  },
];

/** Study tools. Quizlet and Google Keep refuse to be framed, so they open in a tab. */
const STUDY: Game[] = [
  {
    slug: 'desmos',
    title: 'Desmos Graphing Calculator',
    section: 'study',
    runtime: 'html5',
    src: 'https://www.desmos.com/calculator',
    category: 'Math',
  },
  {
    slug: 'geogebra',
    title: 'GeoGebra Calculator',
    section: 'study',
    runtime: 'html5',
    src: 'https://www.geogebra.org/calculator',
    category: 'Math',
  },
  {
    slug: 'quizlet',
    title: 'Quizlet',
    section: 'study',
    runtime: 'html5',
    src: 'https://quizlet.com',
    category: 'Flashcards',
    newTab: true,
  },
  {
    slug: 'google-keep',
    title: 'Google Keep',
    section: 'study',
    runtime: 'html5',
    src: 'https://keep.google.com',
    category: 'Notes',
    newTab: true,
  },
];

export const GAMES: Game[] = [...SWFDUMP_FILES.map(([path]) => fromSwf(path)), ...EXTRA, ...STUDY].sort(
  (a, b) => a.title.localeCompare(b.title),
);

const duplicates = GAMES.map((g) => g.slug).filter((slug, i, all) => all.indexOf(slug) !== i);
if (duplicates.length) throw new Error(`duplicate game slugs: ${duplicates.join(', ')}`);

export const bySlug = (slug: string) => GAMES.find((game) => game.slug === slug);

/** A way in, so 113 tiles are not the first thing anyone has to parse. */
const FEATURED = [
  'bloxorz',
  'run-3',
  'alien-hominid',
  'escaping-the-prison',
  'duck-life-3',
  'cactus-mccoy',
  'papas-pizzeria',
  'warfare-1917',
];

export const featuredGames = () => FEATURED.map(bySlug).filter((game): game is Game => !!game);

export const gamesIn = (section: Section) => GAMES.filter((game) => game.section === section);

export const categoriesIn = (section: Section) => [
  ...new Set(gamesIn(section).map((game) => game.category)),
].sort();

/**
 * Resolved URL to load. Absolute and site-root sources pass through; the rest are
 * swfdump paths. A chunked game resolves to its base URL — the player appends the
 * `.001`, `.002`, … suffixes.
 */
export const gameUrl = (game: Game) =>
  game.parts
    ? swfChunkBase(game.src)
    : /^(https?:\/\/|\/)/.test(game.src)
      ? game.src
      : swfUrl(game.src);
