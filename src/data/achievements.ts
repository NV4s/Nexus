import type { Achievement } from '../lib/achievements.ts';

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

/**
 * Endless War is one series with a hard split: 1–4 march a single soldier across
 * a map, 5–7 hand you tanks and self-propelled guns instead.
 */
/**
 * Endless War 4 is the only one of the infantry games whose save counts
 * missions, so `missionsDone` is passed in for it and left off the rest rather
 * than listing an objective the others can never unlock.
 */
const endlessWarInfantry = (missionsDone = false): Achievement[] => [
  opened('Deployed', 'Start your first mission.'),
  ...(missionsDone
    ? [
        { id: 'mission-done', name: 'One down', hint: 'Complete a mission.' },
        { id: 'missions-10', name: 'Ten missions', hint: 'Complete 10 missions.' },
      ]
    : []),
  { id: 'cross-map', name: 'Other side', hint: 'Get your soldier from one end of a map to the other.' },
  { id: 'swap-weapon', name: 'Field pickup', hint: 'Take a weapon from a fallen enemy and use it.' },
  { id: 'finish-campaign', name: 'Campaign done', hint: 'Finish an entire campaign.' },
  settled,
];

const endlessWarArmour = (): Achievement[] => [
  opened('Start her up', 'Take a vehicle into battle.'),
  { id: 'three-vehicles', name: 'Motor pool', hint: 'Fight in three different vehicles.' },
  { id: 'kill-tank', name: 'Armour piercing', hint: 'Destroy an enemy tank.' },
  { id: 'survive-mission', name: 'Brought it home', hint: 'Finish a mission without losing your vehicle.' },
  settled,
];

/** Pick a weapon, take it out on the stickman, buy the next one with the payout. */
const chooseWeapon = (): Achievement[] => [
  opened('Take your pick', 'Use your first weapon.'),
  { id: 'five-weapons', name: 'Variety', hint: 'Try five different weapons.' },
  { id: 'buy-weapon', name: 'Reinvested', hint: 'Earn enough to unlock a new weapon.' },
  { id: 'every-weapon', name: 'Whole arsenal', hint: 'Unlock every weapon in the game.' },
  settled,
];

/**
 * Customerpalooza ran a live bracket: submit a character, then vote through four
 * divisions. The voting closed years ago, so only the Create section still does
 * anything — objectives stay on the part that actually works.
 */
const customerpalooza = (): Achievement[] => [
  opened('Open the studio', 'Start the character creator.'),
  { id: 'make-one', name: 'First customer', hint: 'Create and name a character.' },
  { id: 'full-custom', name: 'Head to toe', hint: 'Change skin tone, hair, face, height, weight and clothing on one character.' },
  { id: 'three-entries', name: 'Full slate', hint: 'Fill all three entry slots.' },
];

/** Each Madness mod is a different build of the same arena and story modes. */
const madness = (): Achievement[] => [
  opened('Nexus online', 'Boot the mod.'),
  { id: 'arena-wave-10', name: 'Arena regular', hint: 'Reach wave 10 in Arena mode.' },
  { id: 'arena-kills-100', name: 'Hundred in the arena', hint: 'Reach 100 Arena kills.' },
  { id: 'rich', name: 'Funded', hint: 'Bank 100,000 in the Arena.' },
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
    { id: 'run-10', name: 'Sprinter', hint: 'Train running to level 10.' },
    { id: 'swim-10', name: 'Swimmer', hint: 'Train swimming to level 10.' },
    { id: 'fly-10', name: 'Flier', hint: 'Train flying to level 10.' },
    { id: 'coins-500', name: 'Well fed', hint: 'Save up 500 coins.' },
    { id: 'max-run', name: 'Max running', hint: 'Train running to its maximum.' },
    { id: 'win-race', name: 'First win', hint: 'Win a race.' },
    { id: 'champion', name: 'Champion', hint: 'Beat the final race.' },
    settled,
  ],
  'duck-life-2': [
    opened('Back in training', 'Start the sequel.'),
    { id: 'named', name: 'Named', hint: 'Give your duck a name.' },
    { id: 'run-10', name: 'Sprinter', hint: 'Train running to level 10.' },
    { id: 'climb-10', name: 'Climber', hint: 'Train climbing to level 10.' },
    { id: 'coins-500', name: 'Well fed', hint: 'Save up 500 coins.' },
    { id: 'all-stats', name: 'Well rounded', hint: 'Train every stat past halfway.' },
    { id: 'win-league', name: 'League winner', hint: 'Win a league.' },
    { id: 'champion', name: 'Champion', hint: 'Beat the final race.' },
    settled,
  ],
  // Four stats — running, swimming, climbing, flying — then three leagues.
  'duck-life-3': [
    opened('Evolution', 'Pick a duck and start.'),
    { id: 'run-10', name: 'Sprinter', hint: 'Train running to level 10.' },
    { id: 'climb-10', name: 'Climber', hint: 'Train climbing to level 10.' },
    { id: 'coins-500', name: 'Well fed', hint: 'Save up 500 coins.' },
    // Duck Life 3 keeps its own award flags in the save, a1 through a10.
    { id: 'own-medal', name: 'First award', hint: "Earn the game's own first award." },
    { id: 'four-stats', name: 'All four', hint: 'Train running, swimming, climbing and flying.' },
    { id: 'amateur', name: 'Amateur league', hint: 'Win the Amateur league.' },
    { id: 'advanced', name: 'Advanced league', hint: 'Win the Advanced league.' },
    { id: 'professional', name: 'Professional league', hint: 'Win the Professional league.' },
    { id: 'beat-champion', name: 'Beat the Champion', hint: 'Defeat the Champion duck.' },
  ],
  'duck-life-4': [
    opened('Fourth time', 'Start Duck Life 4.'),
    { id: 'run-10', name: 'Sprinter', hint: "Train your first duck's running to level 10." },
    { id: 'race-won', name: 'Off the line', hint: 'Win the first race.' },
    { id: 'race-10', name: 'Ten down', hint: 'Win the tenth race.' },
    { id: 'tournament', name: 'Tournament', hint: 'Win your first tournament.' },
    { id: 'coins-500', name: 'Well fed', hint: 'Save up 500 coins.' },
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
    // Warfare 1917 keeps a full career record, so these read the real totals.
    { id: 'kills-100', name: 'Hundred fallen', hint: 'Kill 100 enemy soldiers across your career.' },
    { id: 'trenches-10', name: 'Trench raider', hint: 'Take 10 trenches across your career.' },
    { id: 'rank-5', name: 'Experienced', hint: 'Reach experience level 5.' },
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
  // Cubefield saves exactly one field, `TopScore`, and flushes it when a run
  // ends — so the three tiers below unlock from the number the game itself
  // wrote rather than from the player's word. See data/saveRules.ts.
  cubefield: [
    opened('Into the field', 'Start flying.'),
    { id: 'colour-change', name: 'Colour shift', hint: 'Survive long enough for the field to change colour.' },
    { id: 'score-5k', name: 'Five thousand', hint: 'Set a top score of 5,000.' },
    { id: 'score-20k', name: 'Twenty thousand', hint: 'Set a top score of 20,000.' },
    { id: 'score-50k', name: 'Fifty thousand', hint: 'Set a top score of 50,000.' },
    regular,
  ],
  curveball: [
    opened('Serve', 'Start a rally.'),
    { id: 'spin', name: 'Curve it', hint: 'Win a point using side spin.' },
    { id: 'beat-ai', name: 'Match won', hint: 'Beat the computer.' },
    regular,
  ],
  // Neave's Asteroids writes one thing to its save — the initials typed on the
  // score screen — so `named` is the only objective here the save can prove.
  // The scores themselves were POSTed to neave.com, which no longer answers.
  asteroids: [
    opened('Thrusters on', 'Start a game.'),
    { id: 'clear-wave', name: 'Field cleared', hint: 'Destroy every rock in a wave.' },
    { id: 'ufo', name: 'Saucer down', hint: 'Shoot down a flying saucer.' },
    { id: 'hyperspace', name: 'Hyperspace', hint: 'Jump to hyperspace to escape a collision.' },
    { id: 'extra-life', name: 'Spare ship', hint: 'Score enough to earn an extra life.' },
    { id: 'named', name: 'Signed the board', hint: 'Finish a run and enter your initials.' },
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

  /* ---------- Endless War ---------- */

  'endless-war': endlessWarInfantry(),
  'endless-war-2': endlessWarInfantry(),
  'endless-war-3': endlessWarInfantry(),
  'endless-war-4': endlessWarInfantry(true),
  'endless-war-5': endlessWarArmour(),
  'endless-war-6': endlessWarArmour(),
  'endless-war-7': endlessWarArmour(),
  'endless-war-defense': [
    opened('Dig in', 'Start a defence.'),
    { id: 'hold-wave', name: 'Line held', hint: 'Survive a wave without losing a position.' },
    { id: 'upgrade', name: 'Reinforced', hint: 'Buy an upgrade between waves.' },
    { id: 'wave-10', name: 'Ten deep', hint: 'Reach wave 10.' },
    settled,
  ],

  /* ---------- Choose Your Weapon ---------- */

  'choose-your-weapon': chooseWeapon(),
  'choose-your-weapon-2': chooseWeapon(),
  'choose-your-weapon-3': chooseWeapon(),
  'choose-your-weapon-4': chooseWeapon(),

  /* ---------- Kingsley's Customerpalooza ---------- */

  'kingsleys-customerpalooza-2013': customerpalooza(),
  'kingsleys-customerpalooza-2014': customerpalooza(),
  'kingsleys-customerpalooza-2015': customerpalooza(),
  'kingsleys-customerpalooza-2016': customerpalooza(),
  'kingsleys-customerpalooza-2017': customerpalooza(),
  'kingsleys-customerpalooza-2018': customerpalooza(),
  'kingsleys-customerpalooza-2019': customerpalooza(),
  'kingsleys-customerpalooza-2020': customerpalooza(),

  /* ---------- Flipline oddments ---------- */

  // Steak the cow hauls milk, Jake the bird changes colour; 30 worlds of it.
  'steak-and-jake': [
    opened('Milk run', 'Start the first delivery.'),
    { id: 'colour-change', name: 'Quick change', hint: "Use Jake's colour change to get past an obstacle." },
    { id: 'bandits', name: 'Milk bandits', hint: 'Protect Steak from a bandit ambush.' },
    { id: 'boss', name: 'Boss down', hint: 'Win a boss battle.' },
    { id: 'cocoa-cow', name: 'Beat the Cocoa Cow', hint: 'Out-race the Cocoa Cow to a customer.' },
    settled,
  ],
  'steak-and-jake-midnight-march': [
    opened('After dark', 'Start the night run.'),
    { id: 'colour-change', name: 'Quick change', hint: "Use Jake's colour change to clear an obstacle." },
    { id: 'ten-levels', name: 'Ten down', hint: 'Clear ten levels.' },
    { id: 'boss', name: 'Boss down', hint: 'Win a boss battle.' },
    settled,
  ],
  'guppy-guard-express': [
    opened('Into the caves', 'Start guiding the guppy.'),
    { id: 'no-hit', name: 'Untouched', hint: 'Clear a stage without hitting a rock.' },
    { id: 'ten-levels', name: 'Deep water', hint: 'Clear ten stages.' },
    settled,
  ],
  'papa-louie-2': [
    opened('When Burgers Attack', 'Start the platformer.'),
    { id: 'rescue', name: 'Rescued', hint: 'Free a captured customer.' },
    { id: 'unlock-character', name: 'New face', hint: 'Unlock a playable character.' },
    { id: 'finish', name: 'Finished', hint: 'Complete the final level.' },
    settled,
  ],
  'papa-louie-3': [
    opened('When Sundaes Attack', 'Start the platformer.'),
    { id: 'rescue', name: 'Rescued', hint: 'Free a captured customer.' },
    { id: 'unlock-character', name: 'New face', hint: 'Unlock a playable character.' },
    { id: 'finish', name: 'Finished', hint: 'Complete the final level.' },
    settled,
  ],

  /* ---------- one-offs with a documented goal ---------- */

  // Kill every stickman in the room, in an order where none of them sees it happen.
  causality: [
    opened('First accident', 'Start the first scene.'),
    { id: 'no-witness', name: 'No witnesses', hint: 'Clear a scene without a stickman seeing another one die.' },
    { id: 'chain', name: 'Chain reaction', hint: 'Set off one event that triggers the next by itself.' },
    { id: 'all-levels', name: 'Case closed', hint: 'Finish every scene.' },
  ],
  'adrenaline-challenge': [
    opened('Kickstart', 'Start the first track.'),
    { id: 'no-crash', name: 'Clean run', hint: 'Finish a track without crashing.' },
    { id: 'balance', name: 'Balancing act', hint: 'Ride the length of a see-saw without tipping.' },
    { id: 'ten-tracks', name: 'Ten tracks', hint: 'Finish ten tracks.' },
    settled,
  ],
  avalanche: [
    opened('First drop', 'Start falling.'),
    { id: 'thirty', name: 'Thirty seconds', hint: 'Stay alive for thirty seconds.' },
    { id: 'minute', name: 'One minute', hint: 'Stay alive for a full minute.' },
    regular,
  ],
  bowman: [
    opened('Nock an arrow', 'Take your first shot.'),
    { id: 'headshot', name: 'Headshot', hint: 'Hit your opponent in the head.' },
    { id: 'win-match', name: 'Match won', hint: 'Win a duel.' },
    { id: 'long-shot', name: 'Long shot', hint: 'Land a hit at maximum distance.' },
    regular,
  ],
  'champion-archer': [
    opened('Draw', 'Take your first shot.'),
    { id: 'bullseye', name: 'Bullseye', hint: 'Hit the centre of the target.' },
    { id: 'round-win', name: 'Round won', hint: 'Win a round.' },
    regular,
  ],
  'battle-pong': [
    opened('Serve', 'Start a match.'),
    { id: 'powerup', name: 'Power up', hint: 'Collect a power-up mid-rally.' },
    { id: 'win', name: 'Match won', hint: 'Beat your opponent.' },
    regular,
  ],
  battleships: [
    opened('Fleet ready', 'Place your ships.'),
    { id: 'first-hit', name: 'Hit', hint: 'Land a shot on an enemy ship.' },
    { id: 'sink', name: 'Sunk', hint: 'Sink a ship outright.' },
    { id: 'win', name: 'Fleet destroyed', hint: 'Sink every enemy ship.' },
  ],
  'connect-4': [
    opened('Drop one', 'Play your first disc.'),
    { id: 'win', name: 'Four in a row', hint: 'Win a game.' },
    { id: 'diagonal', name: 'On the diagonal', hint: 'Win with a diagonal line.' },
    regular,
  ],
  'castle-wars': [
    opened('First hand', 'Play your first card.'),
    { id: 'build-100', name: 'Fortified', hint: 'Build your castle to 100.' },
    { id: 'win-attack', name: 'Breached', hint: 'Win by destroying the enemy castle.' },
    settled,
  ],
  'conquer-antarctica': [
    opened('Landfall', 'Start the campaign.'),
    { id: 'take-territory', name: 'Territory taken', hint: 'Capture an enemy territory.' },
    { id: 'win', name: 'Continent held', hint: 'Win the campaign.' },
    settled,
  ],
  // Commando contains no SharedObject at all — no getLocal, no flush anywhere
  // in the SWF — so none of these can unlock from a save, and no rule for it
  // belongs in data/saveRules.ts. Its highscores went to the portal it shipped
  // on. What the objectives below name is what the game's own code tracks:
  // mission_start, mission_end, level_pass, kill_boss, kill_num, weapon_name.
  commando: [
    opened('Boots on', 'Start the first mission.'),
    { id: 'level-pass', name: 'Level passed', hint: 'Clear a level and reach the mission screen.' },
    { id: 'weapon-swap', name: 'New hardware', hint: 'Pick up a second weapon type and fight with it.' },
    { id: 'boss-killed', name: 'Boss down', hint: 'Kill a mission boss.' },
    { id: 'kill-100', name: 'Hundred down', hint: 'Reach 100 kills in a single run.' },
    { id: 'finish-mission', name: 'Mission complete', hint: 'Finish a mission end to end.' },
    veteran,
  ],
  'bush-shootout': [
    opened('Take cover', 'Start the shootout.'),
    { id: 'clear-wave', name: 'Wave cleared', hint: 'Clear a wave without being hit.' },
    { id: 'reload', name: 'Under pressure', hint: 'Reload and keep the streak going.' },
    settled,
  ],
  'gun-mayhem-2': [
    opened('Step up', 'Start a match.'),
    { id: 'named-fighter', name: 'Signed up', hint: 'Name your fighter.' },
    { id: 'campaign-5', name: 'Five deep', hint: 'Reach campaign level 5.' },
    { id: 'knock-off', name: 'Off the edge', hint: 'Knock an opponent off the platform.' },
    { id: 'unlock', name: 'New kit', hint: 'Unlock a weapon or perk.' },
    { id: 'win-match', name: 'Last hat standing', hint: 'Win a match.' },
    settled,
  ],
  'meteor-blastor': [
    opened('Guns hot', 'Start shooting.'),
    { id: 'clear-wave', name: 'Sky cleared', hint: 'Destroy every meteor in a wave.' },
    { id: 'survive', name: 'Still flying', hint: 'Beat your own best score.' },
    regular,
  ],
  'color-switch': [
    opened('First gate', 'Pass your first colour gate.'),
    { id: 'ten-gates', name: 'Ten gates', hint: 'Pass ten obstacles in one run.' },
    { id: 'switch', name: 'Switched', hint: 'Change colour and clear the next obstacle immediately.' },
    regular,
  ],
  'cursor-invisible': [
    opened('Where is it', 'Start without a cursor.'),
    { id: 'first-level', name: 'Found by feel', hint: 'Clear a level with the cursor hidden.' },
    { id: 'five-levels', name: 'Muscle memory', hint: 'Clear five levels.' },
    settled,
  ],
  'dr-carter-and-the-cave-of-despair': [
    opened('Into the cave', 'Start the adventure.'),
    { id: 'item', name: 'Useful thing', hint: 'Pick up an item and use it somewhere else.' },
    { id: 'puzzle', name: 'Solved', hint: 'Solve a puzzle blocking the way.' },
    { id: 'escape', name: 'Out of the cave', hint: 'Reach the ending.' },
  ],
  'unfinished-sarge-game-demo': [
    opened('Demo', 'Start what there is of it.'),
    { id: 'reach-end', name: 'End of the road', hint: 'Play until the demo stops.' },
  ],

  // Stones slide until they hit something; match five of a colour to flip them,
  // flip the whole garden to clear the level. 100+ levels plus an endless mode.
  'rock-garden-deluxe': [
    opened('First stone', 'Start a garden.'),
    { id: 'match-five', name: 'Five in a row', hint: 'Match five stones of one colour and flip them.' },
    { id: 'clear-level', name: 'Garden flipped', hint: 'Flip every stone to finish a level.' },
    { id: 'collect', name: 'Collector', hint: 'Earn a level’s collectible stone.' },
    { id: 'random-mode', name: 'Endless', hint: 'Play a round of Random Mode.' },
    settled,
  ],

  // Astroflash and Hamu are deliberately absent: neither has any documentation I
  // could verify, and inventing objectives for them would read as authoritative
  // and be wrong. They fall back to the generic play-based list.

  /* ---------- not Flash ---------- */

  'n-gon': [
    opened('Spawn in', 'Start a run.'),
    { id: 'tech', name: 'Teched up', hint: 'Take five tech upgrades in one run.' },
    { id: 'gun', name: 'New gun', hint: 'Pick up a second weapon.' },
    { id: 'boss', name: 'Boss down', hint: 'Kill a boss.' },
    { id: 'level-5', name: 'Deeper', hint: 'Reach the fifth level of a run.' },
    veteran,
  ],
  'gba-emulator': [
    opened('Booted', 'Open the emulator.'),
    { id: 'load-rom', name: 'ROM loaded', hint: 'Load a ROM file from your device.' },
    { id: 'save-state', name: 'Save state', hint: 'Save and reload a state.' },
    settled,
  ],
};

// A key that matches no game produces no achievements and no error, so say so in
// development. Imported dynamically: nothing here should depend on the catalog.
if (import.meta.env?.DEV) {
  import('./games').then(({ GAMES }) => {
    const slugs = new Set(GAMES.map((game) => game.slug));
    const unknown = Object.keys(ACHIEVEMENTS).filter((slug) => !slugs.has(slug));
    if (unknown.length) console.warn(`achievements: no game matches ${unknown.join(', ')}`);
  });
}
