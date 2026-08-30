// @ts-check
/**
 * The progress ledger.
 *
 * ============================ THE RULE ============================
 * Weights are frozen at authoring time. They may never be revised DOWNWARD,
 * and no line may be deleted. Shrinking the denominator to make the percentage
 * rise is the one failure mode this file exists to prevent — if something turns
 * out to be unbuildable, it stays here scoring 0 and the number stays honest.
 *
 * `done` is 0, 0.5 or 1. Nothing else. 0.5 means "playable but not faithful".
 * ==================================================================
 *
 * Total is exactly 1000 points:
 *   Systems     400
 *   Content     450
 *   Presentation & meta  150
 */

/** @typedef {{ id: string, bucket: string, pts: number, done: 0|0.5|1, note?: string }} Item */

/** @type {Item[]} */
export const LEDGER = [
  /* ---------------- SYSTEMS — 400 ---------------- */
  { id: 'cover.graph', bucket: 'systems', pts: 60, done: 1, note: 'numbered node graph, L/R slots, edge traversal' },
  { id: 'camera', bucket: 'systems', pts: 20, done: 1, note: 'eye from slot, depth parallax' },
  { id: 'area.lifecycle', bucket: 'systems', pts: 20, done: 1, note: 'timer, callouts, wave gating, clear' },
  { id: 'script.interpreter', bucket: 'systems', pts: 30, done: 1, note: 'the Kismet replacement' },
  { id: 'weapons', bucket: 'systems', pts: 40, done: 1, note: '8 weapons, magazines, carrier drops' },
  { id: 'enemy.core', bucket: 'systems', pts: 50, done: 1, note: 'archetypes, armor, shields, flinch' },
  { id: 'brains', bucket: 'systems', pts: 40, done: 1, note: '7 weighted action tables' },
  { id: 'combat.scoring', bucket: 'systems', pts: 50, done: 1, note: 'headshot, bullseye, side attack, links' },
  { id: 'events', bucket: 'systems', pts: 40, done: 1, note: 'snipe, evade, move, crisis' },
  { id: 'boss.framework', bucket: 'systems', pts: 30, done: 1, note: 'phases, parts, repair, attack pools' },
  { id: 'results.economy', bucket: 'systems', pts: 20, done: 1, note: 'lives, credits, continue' },

  /* ---------------- CONTENT — 450 ---------------- */
  // 52 areas x 6 = 312. Ids match the area ids in content/stage*.js.
  ...areaItems(),
  // 8 bosses x 14 = 112.
  { id: 'boss.hacs', bucket: 'content', pts: 14, done: 1 },
  { id: 'boss.wilddog', bucket: 'content', pts: 14, done: 1 },
  { id: 'boss.mlt', bucket: 'content', pts: 14, done: 1 },
  { id: 'boss.keith', bucket: 'content', pts: 14, done: 1 },
  { id: 'boss.wildfang', bucket: 'content', pts: 14, done: 1 },
  { id: 'boss.robert', bucket: 'content', pts: 14, done: 1 },
  { id: 'boss.irongiant', bucket: 'content', pts: 14, done: 1 },
  { id: 'boss.uah', bucket: 'content', pts: 14, done: 1 },
  { id: 'dialogue.beats', bucket: 'content', pts: 26, done: 1, note: 'original text on the recovered beat timing' },

  /* ------- PRESENTATION & META — 150 ------- */
  { id: 'render', bucket: 'meta', pts: 50, done: 1, note: 'pre-rendered backdrops, actors, fx' },
  { id: 'audio', bucket: 'meta', pts: 20, done: 1, note: 'synthesised, no asset fetches' },
  { id: 'ranking', bucket: 'meta', pts: 20, done: 1, note: 'ranking table, name entry, achievements' },
  { id: 'difficulty', bucket: 'meta', pts: 15, done: 1, note: 'A-E plus operator settings' },
  { id: 'tutorial', bucket: 'meta', pts: 15, done: 1, note: 'stage 0' },
  { id: 'secondround', bucket: 'meta', pts: 10, done: 1, note: '2nd round / All Clear' },
  { id: 'tests', bucket: 'meta', pts: 20, done: 1, note: 'asserts, content validator, sim harness' },
];

/**
 * The 52 areas, at 6 points each.
 * Counts are recovered: stage 1 has areas 0-10, stage 2 has 10 and stage 3 has
 * 11 logical areas from their SEQ_* sequence names, stages 4/5/6 have 8/5/6 from
 * their map directories, plus the stage 0 tutorial.
 */
function areaItems() {
  const counts = [
    ['0', 1], ['1', 11], ['2', 10], ['3', 11], ['4', 8], ['5', 5], ['6', 6],
  ];
  const out = [];
  for (const [stage, n] of counts) {
    for (let i = 0; i < n; i++) {
      out.push({ id: `area.${stage}-${i}`, bucket: 'content', pts: 6, done: 1 });
    }
  }
  return out;
}

export const TOTAL_POINTS = 1000;

export function score() {
  const buckets = {};
  let earned = 0, possible = 0;
  for (const it of LEDGER) {
    const b = (buckets[it.bucket] ||= { earned: 0, possible: 0, items: 0, doneItems: 0 });
    b.possible += it.pts;
    b.earned += it.pts * it.done;
    b.items++;
    if (it.done === 1) b.doneItems++;
    possible += it.pts;
    earned += it.pts * it.done;
  }
  return {
    earned, possible,
    percent: Math.round((earned / possible) * 100),
    buckets,
    incomplete: LEDGER.filter((i) => i.done < 1),
  };
}

export function report() {
  const s = score();
  const lines = [
    `PROGRESS  ${s.earned} / ${s.possible}  =  ${s.percent}%`,
    '',
  ];
  for (const [name, b] of Object.entries(s.buckets)) {
    lines.push(`  ${name.padEnd(14)} ${String(b.earned).padStart(4)} / ${String(b.possible).padStart(4)}   ${b.doneItems}/${b.items} items`);
  }
  if (s.incomplete.length) {
    lines.push('', '  outstanding:');
    for (const i of s.incomplete) {
      lines.push(`    [${i.done === 0.5 ? 'partial' : 'todo   '}] ${i.id}  (${i.pts}pts)${i.note ? ' — ' + i.note : ''}`);
    }
  }
  return lines.join('\n');
}

export function selfTest(ok) {
  const s = score();
  ok('ledger totals exactly 1000 points', s.possible === TOTAL_POINTS);
  ok('every item scores 0, 0.5 or 1', LEDGER.every((i) => [0, 0.5, 1].includes(i.done)));
  ok('every item has a positive weight', LEDGER.every((i) => i.pts > 0));
  ok('item ids are unique', new Set(LEDGER.map((i) => i.id)).size === LEDGER.length);

  const areas = LEDGER.filter((i) => i.id.startsWith('area.') && i.bucket === 'content');
  ok('52 areas are tracked', areas.length === 52);
  ok('areas are weighted 6 points each', areas.every((i) => i.pts === 6));

  const bosses = LEDGER.filter((i) => i.id.startsWith('boss.') && i.bucket === 'content');
  ok('8 bosses are tracked', bosses.length === 8);

  const b = s.buckets;
  ok('systems bucket is worth 400', b.systems.possible === 400);
  ok('content bucket is worth 450', b.content.possible === 450);
  ok('presentation and meta bucket is worth 150', b.meta.possible === 150);
  ok('percentage is derived, not stored', typeof s.percent === 'number' && s.percent === Math.round(s.earned / 10));
}
