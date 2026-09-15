import { GAMES } from './games.ts';

export type Series = {
  id: string;
  title: string;

  slugs: string[];
};

export const SERIES: Series[] = [
  {
    id: 'henry-stickmin',
    title: 'Henry Stickmin',
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
    slugs: ['duck-life', 'duck-life-2', 'duck-life-3', 'duck-life-4'],
  },
  {
    id: 'choose-your-weapon',
    title: 'Choose Your Weapon',
    slugs: [
      'choose-your-weapon',
      'choose-your-weapon-2',
      'choose-your-weapon-3',
      'choose-your-weapon-4',
      'choose-your-weapon-5',
      'choose-your-weapon-tower-defense',
    ],
  },
  {
    id: 'achievement-unlocked',
    title: 'Achievement Unlocked',
    slugs: ['achievement-unlocked', 'achievement-unlocked-2', 'achievement-unlocked-3'],
  },
  {
    id: 'commando',
    title: 'Commando',
    slugs: ['commando', 'commando-2', 'commando-3'],
  },
  {
    id: 'cactus-mccoy',
    title: 'Cactus McCoy',
    slugs: ['cactus-mccoy', 'cactus-mccoy-2'],
  },
  {
    id: 'raft-wars',
    title: 'Raft Wars',
    slugs: ['raft-wars', 'raft-wars-2'],
  },
  {
    id: 'steak-and-jake',
    title: 'Steak and Jake',
    slugs: ['steak-and-jake', 'steak-and-jake-midnight-march'],
  },
  {
    id: 'cursor',
    title: 'Cursor',
    slugs: ['cursor-10', 'cursor-invisible'],
  },
];


export const gamesInSeries = (series: Series) =>
  series.slugs.map((slug) => GAMES.find((game) => game.slug === slug)).filter((game) => !!game);

if (import.meta.env?.DEV) {


  const known = new Set(GAMES.map((game) => game.slug));
  for (const series of SERIES) {
    const missing = series.slugs.filter((slug) => !known.has(slug));
    if (missing.length) console.warn(`series: ${series.id} lists unknown ${missing.join(', ')}`);
  }
}
