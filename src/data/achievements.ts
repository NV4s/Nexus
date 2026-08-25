import type { Achievement } from '../lib/achievements';

/**
 * Researched objectives, keyed by game slug. Anything absent here falls back to
 * the generic play-based list in lib/achievements.ts — that is deliberate. An
 * honest "play for 30 minutes" beats a specific-sounding objective invented for
 * a game nobody could verify, which would read as authoritative and be wrong.
 *
 * Only `auto` entries unlock themselves; Ruffle cannot see inside a SWF, so the
 * rest are ticked by the player.
 */

const opened = (name = 'First run', hint = 'Open the game.'): Achievement => ({
  id: 'played',
  name,
  hint,
  auto: 'played',
});

const settled: Achievement = {
  id: 'time30',
  name: 'Settled in',
  hint: 'Play for 30 minutes in total.',
  auto: 'time30',
};

const veteran: Achievement = {
  id: 'time120',
  name: 'Veteran',
  hint: 'Play for two hours in total.',
  auto: 'time120',
};

const regular: Achievement = {
  id: 'sessions5',
  name: 'Regular',
  hint: 'Come back for five separate sessions.',
  auto: 'sessions5',
};

/**
 * Every Papa's game runs the same loop — take the order, cook it, build it, serve
 * it — so the objectives are shared and only the shop and signature dish change.
 */
const papas = (dish: string): Achievement[] => [
  opened('Day one', 'Clock in for your first shift.'),
  { id: 'first-perfect', name: 'Perfect order', hint: `Score 100% on a ${dish}.` },
  { id: 'gold-star', name: 'Gold star', hint: 'Earn a gold medal from any customer.' },
  { id: 'rank-10', name: 'Promoted', hint: 'Reach rank 10.' },
  { id: 'shop-upgrade', name: 'Renovation', hint: 'Buy an upgrade from the shop with your tips.' },
  settled,
];

/** The Boxhead games are all the same siege: barrels, weapon crates, endless dead. */
const boxhead = (): Achievement[] => [
  opened('Boxed in', 'Start your first round.'),
  { id: 'barrel-chain', name: 'Chain reaction', hint: 'Kill five or more zombies with one barrel explosion.' },
  { id: 'wave-10', name: 'Holding out', hint: 'Survive to wave 10.' },
  { id: 'upgrade-weapon', name: 'Armed up', hint: 'Pick up a weapon crate and clear a wave with it.' },
  settled,
];

/** Each Madness mod is a different build of the same arena and story modes. */
const madness = (): Achievement[] => [
  opened('Nexus online', 'Boot the mod.'),
  { id: 'arena-wave-10', name: 'Arena regular', hint: 'Reach wave 10 in Arena mode.' },
  { id: 'melee-only', name: 'Up close', hint: 'Clear a wave using only melee weapons.' },
  { id: 'story-mission', name: 'On mission', hint: 'Finish a Story mode mission.' },
  { id: 'custom-char', name: 'Made to order', hint: 'Build and save a custom character.' },
  veteran,
];

export const ACHIEVEMENTS: Record<string, Achievement[]> = {
  /* ---------- puzzle and classics ---------- */

  // 33 stages; orange tiles are fragile, X switches need the block upright,
  // circle switches take any weight, and split switches break the block in two.
  bloxorz: [
    opened('Block one', 'Start stage 1.'),
    { id: 'stage-5', name: 'Getting the hang of it', hint: 'Reach stage 5 without using a level code.' },
    { id: 'orange-fall', name: 'Told you so', hint: 'Fall through an orange fragile tile.' },
    { id: 'split', name: 'Two of me', hint: 'Use a split switch and control both halves of the block.' },
    { id: 'stage-15', name: 'Halfway', hint: 'Reach stage 15.' },
    { id: 'stage-33', name: 'Bloxorz master', hint: 'Finish stage 33, the last one.' },
  ],

  // Ten cursors, ten seconds each; past lives replay while you act.
  'cursor-10': [
    opened('One of ten', 'Spend your first cursor.'),
    { id: 'ghosts', name: 'Teamwork alone', hint: 'Let an earlier cursor hold a switch while a later one moves on.' },
    { id: 'floor-8', name: 'Halfway up', hint: 'Reach floor 8.' },
    { id: 'floor-16', name: 'Top floor', hint: 'Reach floor 16, the top of the tower.' },
    { id: 'spare', name: 'Efficient', hint: 'Reach the top with cursors to spare.' },
  ],

  // Takagi, 2004 — the game that codified the room-escape genre.
  'crimson-room': [
    opened('Wake up', 'Open your eyes in the red room.'),
    { id: 'search', name: 'Turn it over', hint: 'Find something hidden under or behind the furniture.' },
    { id: 'safe', name: 'Combination', hint: 'Work out the safe code and open it.' },
    { id: 'escape', name: 'Out', hint: 'Escape the crimson room.' },
  ],

  // A blue elephant collecting 100 achievements, most of them for nothing.
  'achievement-unlocked': [
    opened('Achievement unlocked', 'Start the game. That is one of them.'),
    { id: 'die', name: 'Learning by dying', hint: 'Die on purpose.' },
    { id: 'nothing', name: 'Do nothing', hint: 'Stand perfectly still until the game rewards you for it.' },
    { id: 'half', name: 'Fifty', hint: 'Unlock 50 of the 100 achievements.' },
    { id: 'all-100', name: 'All one hundred', hint: 'Unlock every achievement in the game.' },
  ],
  'achievement-unlocked-2': [
    opened('Back again', 'Start the sequel.'),
    { id: 'half', name: 'Halfway', hint: 'Unlock half the achievement list.' },
    { id: 'all', name: 'Completionist', hint: 'Unlock every achievement.' },
    settled,
  ],
  'achievement-unlocked-3': [
    opened('Third time', 'Start the third game.'),
    { id: 'half', name: 'Halfway', hint: 'Unlock half the achievement list.' },
    { id: 'all', name: 'Completionist', hint: 'Unlock every achievement.' },
    settled,
  ],

  /* ---------- Henry Stickmin: endings are the whole game ---------- */

  'breaking-the-bank': [
    opened('The job', 'Start the heist.'),
    { id: 'fails', name: 'Every wrong turn', hint: 'See five different failures.' },
    { id: 'success', name: 'Got the money', hint: 'Reach the successful ending.' },
  ],
  'escaping-the-prison': [
    opened('Locked up', 'Start the escape.'),
    { id: 'lawyered-up', name: 'Lawyered Up', hint: 'Reach the Lawyered Up ending.' },
    { id: 'sneaky-escapist', name: 'Sneaky Escapist', hint: 'Reach the Sneaky Escapist ending.' },
    { id: 'badass-bust-out', name: 'Badass Bust Out', hint: 'Reach the Badass Bust Out ending, the hardest of the three.' },
    { id: 'all-endings', name: 'All three', hint: 'See every ending.' },
  ],
  'stealing-the-diamond': [
    opened('The museum', 'Start the theft.'),
    { id: 'unseen-burglar', name: 'Unseen Burglar', hint: 'Take the diamond without being spotted.' },
    { id: 'intruder-scooter', name: 'Intruder on a Scooter', hint: 'Reach the Intruder on a Scooter ending.' },
    { id: 'just-plain-epic', name: 'Just Plain Epic', hint: 'Reach the Just Plain Epic ending.' },
    { id: 'all-endings', name: 'All three', hint: 'See every ending.' },
  ],
  'infiltrating-the-airship': [
    opened('Wake up call', 'Board the airship.'),
    { id: 'gspi', name: 'Government Supported Private Investigator', hint: 'Reach the GSPI ending.' },
    { id: 'pure-blooded-thief', name: 'Pure Blooded Thief', hint: 'Reach the Pure Blooded Thief ending.' },
    { id: 'bounty-hunter', name: 'Relentless Bounty Hunter', hint: 'Reach the Relentless Bounty Hunter ending.' },
    { id: 'executive', name: 'Rapidly Promoted Executive', hint: 'Reach the Rapidly Promoted Executive ending.' },
    { id: 'teddy', name: 'Lightning Quick Larcenist', hint: 'Steal the safe and find the teddy bear.' },
  ],
  'fleeing-the-complex': [
    opened('The Wall', 'Start the breakout.'),
    { id: 'ghost-inmate', name: 'Ghost Inmate', hint: 'Reach the Ghost Inmate ending.' },
    { id: 'convict-allies', name: 'Convict Allies', hint: 'Reach the Convict Allies ending.' },
    { id: 'presumed-dead', name: 'Presumed Dead', hint: 'Reach the Presumed Dead ending.' },
    { id: 'iro', name: 'International Rescue Operative', hint: 'Reach the International Rescue Operative ending.' },
    { id: 'the-betrayed', name: 'The Betrayed', hint: 'Reach The Betrayed ending.' },
  ],
  'crossing-the-pit': [
    opened('One jump', 'Start the short one.'),
    { id: 'fail', name: 'Not like that', hint: 'Fail the crossing.' },
    { id: 'cross', name: 'Across', hint: 'Get to the other side.' },
  ],

  /* ---------- Duck Life: train four stats, win three leagues ---------- */

  'duck-life': [
    opened('Hatched', 'Start training your duck.'),
    { id: 'max-run', name: 'Max running', hint: 'Train running to its maximum.' },
    { id: 'win-race', name: 'First win', hint: 'Win a race.' },
    { id: 'champion', name: 'Champion', hint: 'Beat the final race.' },
    settled,
  ],
  'duck-life-2': [
    opened('Back in training', 'Start the sequel.'),
    { id: 'all-stats', name: 'Well rounded', hint: 'Train every stat past halfway.' },
    { id: 'win-league', name: 'League winner', hint: 'Win a league.' },
    { id: 'champion', name: 'Champion', hint: 'Beat the final race.' },
    settled,
  ],
  // Four stats — running, swimming, climbing, flying — then three leagues.
  'duck-life-3': [
    opened('Evolution', 'Pick a duck and start.'),
    { id: 'four-stats', name: 'All four', hint: 'Train running, swimming, climbing and flying.' },
    { id: 'amateur', name: 'Amateur league', hint: 'Win the Amateur league.' },
    { id: 'advanced', name: 'Advanced league', hint: 'Win the Advanced league.' },
    { id: 'professional', name: 'Professional league', hint: 'Win the Professional league.' },
    { id: 'beat-champion', name: 'Beat the Champion', hint: 'Defeat the Champion duck.' },
  ],
  'duck-life-4': [
    opened('Fourth time', 'Start Duck Life 4.'),
    { id: 'all-stats', name: 'Well rounded', hint: 'Train every stat past halfway.' },
    { id: 'win-league', name: 'League winner', hint: 'Win a league.' },
    { id: 'champion', name: 'Champion', hint: 'Beat the final race.' },
    settled,
  ],

  /* ---------- platform and action ---------- */

  // 12 areas, each with 5 treasures and 5 challenges; 59 usable weapons.
  'cactus-mccoy': [
    opened('Cursed', 'Pick up the Thorned Emerald.'),
    { id: 'weapons-10', name: 'Whatever is to hand', hint: 'Use ten different weapons.' },
    { id: 'treasure-10', name: 'Treasure hunter', hint: 'Find ten of the hidden treasures.' },
    { id: 'area-6', name: 'Halfway home', hint: 'Reach area 6.' },
    { id: 'finish', name: 'Emerald returned', hint: 'Finish the last area.' },
    { id: 'challenges-30', name: 'Challenger', hint: 'Complete 30 challenges.' },
  ],
  'cactus-mccoy-2': [
    opened('Back in the desert', 'Start the sequel.'),
    { id: 'weapons-10', name: 'Whatever is to hand', hint: 'Use ten different weapons.' },
    { id: 'treasure-10', name: 'Treasure hunter', hint: 'Find ten hidden treasures.' },
    { id: 'finish', name: 'Finished', hint: 'Complete the final level.' },
    settled,
  ],

  'alien-hominid': [
    opened('Crash landing', 'Start the game.'),
    { id: 'eat-agent', name: 'Snack', hint: 'Burrow underground and eat an agent.' },
    { id: 'level-3', name: 'Still going', hint: 'Reach level 3.' },
    { id: 'boss', name: 'Boss down', hint: 'Beat a boss.' },
    veteran,
  ],

  'run-3': [
    opened('Into the tunnel', 'Start running.'),
    { id: 'explore-10', name: 'Mapping it', hint: 'Clear ten levels in Explore Mode.' },
    { id: 'new-character', name: 'New legs', hint: 'Unlock a second character.' },
    { id: 'infinite-1000', name: 'Long haul', hint: 'Travel 1,000 metres in Infinite Mode.' },
    { id: 'fall-off', name: 'Gravity works', hint: 'Fall out of the tunnel. It happens.' },
    veteran,
  ],

  'warfare-1917': [
    opened('Over the top', 'Start your first battle.'),
    { id: 'morale-win', name: 'Broken will', hint: 'Win by draining the enemy morale bar.' },
    { id: 'ground-win', name: 'Ground taken', hint: 'Win by capturing enough enemy trenches.' },
    { id: 'artillery', name: 'Fire support', hint: 'Call in artillery, mortar or gas.' },
    { id: 'tank', name: 'Armour', hint: 'Deploy a tank.' },
    { id: 'campaign', name: 'Campaign over', hint: 'Finish the British or German campaign.' },
  ],

  'madness-project-nexus-classic': madness(),

  jacksmith: [
    opened('The forge', 'Start smithing.'),
    { id: 'first-weapon', name: 'First blade', hint: 'Forge and deliver your first weapon.' },
    { id: 'perfect-forge', name: 'Perfect strike', hint: 'Forge a weapon with a perfect rating.' },
    { id: 'win-battle', name: 'Armed and dangerous', hint: 'Win a battle with weapons you made.' },
    settled,
  ],

  'raft-wars': [
    opened('Beach defence', 'Start the first fight.'),
    { id: 'headshot', name: 'Direct hit', hint: 'Knock out an enemy with a single shot.' },
    { id: 'finish', name: 'Treasure kept', hint: 'Finish the game.' },
    settled,
  ],
  'raft-wars-2': [
    opened('Back on the water', 'Start the sequel.'),
    { id: 'headshot', name: 'Direct hit', hint: 'Knock out an enemy with a single shot.' },
    { id: 'finish', name: 'Finished', hint: 'Complete the last level.' },
    settled,
  ],

  'bubble-tanks-2': [
    opened('Small fry', 'Start as the smallest tank.'),
    { id: 'evolve', name: 'Evolved', hint: 'Grow enough to change tank form.' },
    { id: 'boss', name: 'Big fish', hint: 'Destroy a boss tank.' },
    veteran,
  ],

  'papa-louie': [
    opened('Pizza rescue', 'Start the platformer.'),
    { id: 'rescue', name: 'Rescued', hint: 'Save a captured customer.' },
    { id: 'finish', name: 'Finished', hint: 'Complete the final level.' },
    settled,
  ],

  /* ---------- Papa's series ---------- */

  'papas-pizzeria': papas('pizza'),
  'papas-burgeria': papas('burger'),
  'papas-taco-mia': papas('taco'),
  'papas-freezeria': papas('sundae'),
  'papas-pancakeria': papas('stack of pancakes'),
  'papas-wingeria': papas('plate of wings'),
  'papas-hot-doggeria': papas('hot dog'),
  'papas-cupcakeria': papas('cupcake'),
  'papas-pastaria': papas('bowl of pasta'),
  'papas-donuteria': papas('donut'),
  'papas-cheeseria': papas('grilled cheese'),
  'papas-bakeria': papas('pie'),
  'papas-sushiria': papas('sushi platter'),
  'papas-scooperia': papas('sundae'),

  /* ---------- Boxhead series ---------- */

  boxhead: boxhead(),
  'boxhead-2play-rooms': boxhead(),
  'boxhead-more-rooms': boxhead(),
  'boxhead-the-rooms': boxhead(),
  'boxhead-the-nightmare': boxhead(),
  'boxhead-the-nightmare-biever-and-baby': boxhead(),
  'boxhead-the-zombie-wars': boxhead(),
  'boxhead-the-christmas-nightmare': boxhead(),

  /* ---------- Madness mods ---------- */

  'madness-project-nexus-classic-redux': madness(),
  'madness-project-nexus-mod-v9-5': madness(),
  'madness-project-nexus-mod-v7': madness(),
  'madness-project-nexus-mod-v6-1': madness(),
  'madness-project-nexus-modded': madness(),
  'madness-project-nexus-nexus-mod': madness(),
  'madness-project-nexus-recompiled': madness(),
  'madness-project-nexus-goofy-ahh-mod': madness(),
  'madness-project-nexus-n-a-f-mod': madness(),
  'madness-project-nexus-story-expansion-reborn': madness(),
  'madness-project-nexus-tou-reborn-v1': madness(),

  /* ---------- short arcade games with a clear goal ---------- */

  snake: [
    opened('Slither', 'Start a game.'),
    { id: 'length-10', name: 'Getting longer', hint: 'Grow to ten segments.' },
    { id: 'no-walls', name: 'Close call', hint: 'Survive a full lap around the edge.' },
    regular,
  ],
  cubefield: [
    opened('Into the field', 'Start flying.'),
    { id: 'colour-change', name: 'Colour shift', hint: 'Survive long enough for the field to change colour.' },
    { id: 'far', name: 'Deep run', hint: 'Beat your own best distance.' },
    regular,
  ],
  curveball: [
    opened('Serve', 'Start a rally.'),
    { id: 'spin', name: 'Curve it', hint: 'Win a point using side spin.' },
    { id: 'beat-ai', name: 'Match won', hint: 'Beat the computer.' },
    regular,
  ],
  asteroids: [
    opened('Thrusters on', 'Start a game.'),
    { id: 'clear-wave', name: 'Field cleared', hint: 'Destroy every rock in a wave.' },
    { id: 'ufo', name: 'Saucer down', hint: 'Shoot down a flying saucer.' },
    regular,
  ],
  'bubble-shooter': [
    opened('First shot', 'Start a board.'),
    { id: 'combo', name: 'Cascade', hint: 'Drop a cluster by breaking its only anchor.' },
    { id: 'clear-board', name: 'Board cleared', hint: 'Clear an entire board.' },
    settled,
  ],
  'bullet-bill': [
    opened('Launched', 'Start a level.'),
    { id: 'survive', name: 'Still flying', hint: 'Reach the end of a level without exploding.' },
    settled,
  ],
  doom: [
    opened('At Doom’s gate', 'Start the game.'),
    { id: 'secret', name: 'Secret found', hint: 'Find a hidden room.' },
    { id: 'finish-level', name: 'Level cleared', hint: 'Finish a level.' },
    veteran,
  ],
};

// A key that matches no game produces no achievements and no error, so say so in
// development. Imported dynamically: nothing here should depend on the catalog.
if (import.meta.env.DEV) {
  import('./games').then(({ GAMES }) => {
    const slugs = new Set(GAMES.map((game) => game.slug));
    const unknown = Object.keys(ACHIEVEMENTS).filter((slug) => !slugs.has(slug));
    if (unknown.length) console.warn(`achievements: no game matches ${unknown.join(', ')}`);
  });
}
