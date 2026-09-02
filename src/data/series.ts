import { GAMES } from './games.ts';

export type Series = {
  id: string;
  title: string;
  blurb: string;
  /** In release order, not alphabetical — a series is meant to be played through. */
  slugs: string[];
};

export const SERIES: Series[] = [
  {
    id: 'henry-stickmin',
    title: 'Henry Stickmin',
    blurb: 'Six heists, each with three to five endings. Most of them are failures, and those are the good ones.',
    slugs: [
      'breaking-the-bank',
      'escaping-the-prison',
      'stealing-the-diamond',
      'infiltrating-the-airship',
      'fleeing-the-complex',
      'crossing-the-pit',
    ],
  },
  {
    id: 'papas',
    title: "Papa Louie",
    blurb: 'Two platformers and fifteen shops. Take the order, cook it, build it, serve it, do it faster.',
    slugs: [
      'papa-louie',
      'papa-louie-2',
      'papa-louie-3',
      'papas-pizzeria',
      'papas-burgeria',
      'papas-taco-mia',
      'papas-freezeria',
      'papas-pancakeria',
      'papas-wingeria',
      'papas-hot-doggeria',
      'papas-cupcakeria',
      'papas-pastaria',
      'papas-donuteria',
      'papas-cheeseria',
      'papas-bakeria',
      'papas-sushiria',
      'papas-scooperia',
    ],
  },
  {
    id: 'madness',
    title: 'Madness: Project Nexus',
    blurb: 'The original, plus eleven community rebuilds of it. Arena mode, a squad you assemble yourself, and a great deal of ammunition.',
    slugs: [
      'madness-project-nexus-classic',
      'madness-project-nexus-classic-redux',
      'madness-project-nexus-recompiled',
      'madness-project-nexus-modded',
      'madness-project-nexus-mod-v6-1',
      'madness-project-nexus-mod-v7',
      'madness-project-nexus-mod-v9-5',
      'madness-project-nexus-nexus-mod',
      'madness-project-nexus-story-expansion-reborn',
      'madness-project-nexus-tou-reborn-v1',
      'madness-project-nexus-n-a-f-mod',
      'madness-project-nexus-goofy-ahh-mod',
    ],
  },
  {
    id: 'boxhead',
    title: 'Boxhead',
    blurb: 'The same siege eight times over: barrels, weapon crates, and a lesson about standing next to explosives.',
    slugs: [
      'boxhead',
      'boxhead-the-rooms',
      'boxhead-more-rooms',
      'boxhead-2play-rooms',
      'boxhead-the-zombie-wars',
      'boxhead-the-nightmare',
      'boxhead-the-nightmare-biever-and-baby',
      'boxhead-the-christmas-nightmare',
    ],
  },
  {
    id: 'endless-war',
    title: 'Endless War',
    blurb: 'One to four march a single soldier across the map. Five to seven hand you tanks instead. Defense is a different game entirely.',
    slugs: [
      'endless-war',
      'endless-war-2',
      'endless-war-3',
      'endless-war-4',
      'endless-war-5',
      'endless-war-6',
      'endless-war-7',
      'endless-war-defense',
    ],
  },
  {
    id: 'duck-life',
    title: 'Duck Life',
    blurb: 'Train a duck, race the duck, spend the winnings on training the duck. Each one adds a discipline.',
    slugs: ['duck-life', 'duck-life-2', 'duck-life-3', 'duck-life-4'],
  },
  {
    id: 'choose-your-weapon',
    title: 'Choose Your Weapon',
    blurb: 'Pick something off the rack, take it out on the stickman, buy the next thing with the payout.',
    slugs: ['choose-your-weapon', 'choose-your-weapon-2', 'choose-your-weapon-3', 'choose-your-weapon-4'],
  },
  {
    id: 'achievement-unlocked',
    title: 'Achievement Unlocked',
    blurb: 'A blue elephant and a hundred achievements, most of them for doing nothing in particular.',
    slugs: ['achievement-unlocked', 'achievement-unlocked-2', 'achievement-unlocked-3'],
  },
  {
    id: 'commando',
    title: 'Commando',
    blurb: 'Side-scrolling run-and-gun. Work the missions, spend what you earn on the next rifle.',
    slugs: ['commando', 'commando-3'],
  },
  {
    id: 'cactus-mccoy',
    title: 'Cactus McCoy',
    blurb: 'A cursed treasure hunter brawls through the desert with whatever he can pick up off the floor.',
    slugs: ['cactus-mccoy', 'cactus-mccoy-2'],
  },
  {
    id: 'raft-wars',
    title: 'Raft Wars',
    blurb: 'Artillery duels over buried treasure, fought with tennis balls from a rowing boat.',
    slugs: ['raft-wars', 'raft-wars-2'],
  },
  {
    id: 'steak-and-jake',
    title: 'Steak and Jake',
    blurb: 'A boy and his dog cross procedurally built trails. The sequel does it at night.',
    slugs: ['steak-and-jake', 'steak-and-jake-midnight-march'],
  },
  {
    id: 'cursor',
    title: 'Cursor',
    blurb: "Nekogames' two puzzles about the mouse pointer itself — one where you have ten of them, one where you cannot see it.",
    slugs: ['cursor-10', 'cursor-invisible'],
  },
];

/** Resolves a series to the games it actually has, in the order listed. */
export const gamesInSeries = (series: Series) =>
  series.slugs.map((slug) => GAMES.find((game) => game.slug === slug)).filter((game) => !!game);

if (import.meta.env?.DEV) {
  // A slug that no longer exists leaves a silent hole in the row rather than an
  // error, so it has to be said out loud somewhere.
  const known = new Set(GAMES.map((game) => game.slug));
  for (const series of SERIES) {
    const missing = series.slugs.filter((slug) => !known.has(slug));
    if (missing.length) console.warn(`series: ${series.id} lists unknown ${missing.join(', ')}`);
  }
}
