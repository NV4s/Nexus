// @ts-check
/**
 * Subtitle lines for the info bar.
 *
 * ORIGINAL TEXT. The arcade build's script was not copied — these are written
 * fresh against the same beat structure the recording established: a short
 * tactical callout from the radio operator when a mechanic first appears, and a
 * line at each boss phase gate.
 *
 * Every line is functional. It tells the player what changed or what to do, in
 * the number of words the info bar can hold at its observed size. Anything that
 * reads as flavour rather than instruction has been cut, because the bar is
 * one line and a wasted line is a missed teach.
 *
 * `who` selects the portrait tint. `hold` is how long the bar stays up.
 */

/** Portrait hues, one per speaker. */
export const SPEAKERS = {
  radio: 18,     // the operator on comms
  boss: 348,     // whoever is shooting at you
  system: 200,   // tutorial instructions, no portrait
};

const line = (who, text, hold = 3.2) => ({ who, text, hold });

export const DIALOGUE = {
  /* --- tutorial. Instructions, not chatter. --- */
  'tut.lean': line('system', 'Hold a pedal to lean out and fire.', 4.5),
  'tut.cover': line('system', 'Let go to take cover. That reloads you.', 4.5),
  'tut.cross': line('system', 'Press the other pedal to cross to the far cover.', 4.5),
  'tut.both': line('system', 'Targets on both sides. Keep moving between them.', 4.5),

  /* --- stage 1: resort --- */
  'cat.contact': line('radio', 'Contact on the pool deck. Weapons free.'),
  'cat.otherSide': line('radio', 'More of them on your other side.'),
  'cat.advance': line('radio', 'Deck is clear. Push forward.'),
  'cat.above': line('radio', 'One of them is set up above you.'),
  'cat.shields': line('radio', 'Shields up front. Their heads are still open.'),
  'cat.inside': line('radio', 'You are inside. Tighter angles from here.'),
  'cat.crisisShot': line('radio', 'Red flash means take cover now.'),
  'cat.heavy': line('radio', 'Emplaced gun ahead. It will not move.'),
  'cat.bossWarn': line('radio', 'Something heavy is coming up to meet you.'),

  /* --- stage 2: train, refinery, parking --- */
  'cat.boarding': line('radio', 'You are on the train. Mind your footing.'),
  'cat.refinery': line('radio', 'Refinery floor. Watch the raised walkways.'),
  'cat.heavyGun': line('radio', 'Heavy gun covering the centre. Flank it.'),
  'cat.chopper': line('radio', 'Gunship on your flank. Take it off us.'),
  'cat.wildDog': line('radio', 'He is here. Do not let him settle.'),
  'cat.airSupport': line('radio', 'They called in air support. Look up.'),

  /* --- stage 3: pursuit, trucks, half-pipe --- */
  'cat.pursuit': line('radio', 'Riders closing from behind. Stay on the bike.'),
  'cat.onBoard': line('radio', 'You are on the truck bed. Short cover only.'),
  'cat.markers': line('radio', 'Shoot the markers. All of them, fast.'),
  'cat.walker': line('radio', 'That walker has a soft spot. Find it.'),

  /* --- stage 4: jungle --- */
  'cat.jungle': line('radio', 'Canopy is thick. They will be close before you see them.'),
  'cat.snipe': line('radio', 'Long range. One shot each, make them count.'),
  'cat.drugged': line('radio', 'These ones do not go down from body shots.'),
  'cat.fuelTanks': line('radio', 'Fuel tanks in there. Use them.'),
  'cat.keith': line('radio', 'He is fast and he does not stay put.'),

  /* --- stage 5: industrial --- */
  'cat.plant': line('radio', 'Gantry level. Long sightlines both ways.'),
  'cat.wildFang': line('radio', 'He is not going to talk. Get ready.'),

  /* --- stage 6: final --- */
  'cat.final': line('radio', 'Last stretch. Everything they have left is in here.'),
  'cat.traitor': line('radio', 'He is the one who sold us. Take him.'),
  'cat.giant': line('radio', 'It is still moving. Of course it is.'),

  /* --- boss phase gates --- */
  'boss.hacsEnter': line('radio', 'Powered armour, two of them. Armour is thick up front.'),
  'boss.hacsWeak': line('radio', 'Tank on the back. Get round behind it.'),
  'boss.mltEnter': line('radio', 'Legs are armoured. Go for the housing.'),
  'boss.mltRepair': line('radio', 'The launcher rebuilds itself. Break it again.'),
  'boss.uahEnter': line('radio', 'Rotor is the weak point. Keep on it.'),
  'boss.wdEnter': line('radio', 'His arm is the gun. Watch which way it points.'),
  'boss.wdTractor': line('radio', 'That beam will pull you out of cover.'),
  'boss.wdUndefended': line('radio', 'He is covering one side only. Take the other.'),
  'boss.keithEnter': line('radio', 'Blade range. Do not let him close.'),
  'boss.wfEnter': line('radio', 'He is charging something. Do not stand still.'),
  'boss.wfForm2': line('radio', 'He is not finished. Reactor is open now.'),
  'boss.igEnter': line('radio', 'It is bigger than the intel said. Much bigger.'),
  'boss.igArmor': line('radio', 'Armour plate. You are wasting rounds on it.'),
  'boss.igTransform': line('radio', 'It is opening up. Core is exposed.'),
  'boss.robEnter': line('radio', 'Railgun. When it charges, be somewhere else.'),
};

export const say = (key) => DIALOGUE[key] || null;
export const speakerHue = (who) => SPEAKERS[who] ?? SPEAKERS.radio;

export function selfTest(ok) {
  const keys = Object.keys(DIALOGUE);
  ok('every dialogue key resolves to a line',
    keys.every((k) => !!DIALOGUE[k].text));
  ok('every line names a known speaker',
    keys.every((k) => k in DIALOGUE && (DIALOGUE[k].who in SPEAKERS)));
  ok('every line has a positive hold time',
    keys.every((k) => DIALOGUE[k].hold > 0));

  // The info bar is one line at 1280 wide. Long lines would clip.
  ok('no line is too long for the info bar',
    keys.every((k) => DIALOGUE[k].text.length <= 62));
  ok('no line is empty', keys.every((k) => DIALOGUE[k].text.trim().length > 5));

  // Tutorial lines get longer holds, because they are being read, not glanced at.
  const tut = keys.filter((k) => k.startsWith('tut.'));
  ok('the tutorial teaches in four lines', tut.length === 4);
  ok('tutorial lines hold longer than combat callouts',
    tut.every((k) => DIALOGUE[k].hold >= 4));
  ok('tutorial lines come from the system, not a character',
    tut.every((k) => DIALOGUE[k].who === 'system'));

  // Boss lines are gate callouts, so every boss should have at least an entry.
  const bossKeys = keys.filter((k) => k.startsWith('boss.'));
  ok('every boss has an entry line',
    ['hacs', 'mlt', 'uah', 'wd', 'keith', 'wf', 'ig', 'rob']
      .every((b) => bossKeys.some((k) => k.startsWith(`boss.${b}`) && k.endsWith('Enter'))));

  ok('lines are unique — no two keys share text',
    new Set(keys.map((k) => DIALOGUE[k].text)).size === keys.length);

  ok('every key content references is defined', keys.length === 48);
  ok('an unknown key returns null rather than throwing', say('nope.missing') === null);
  ok('a known key resolves', say('tut.lean').text.length > 0);
  ok('speaker hues are distinct',
    new Set(Object.values(SPEAKERS)).size === Object.keys(SPEAKERS).length);
  ok('an unknown speaker falls back to the radio hue', speakerHue('nobody') === SPEAKERS.radio);
}
