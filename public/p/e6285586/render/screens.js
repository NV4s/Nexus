// @ts-check
/**
 * Full-screen states: results, continue, name entry, ranking, front end.
 *
 * Four result screens were observed directly (area result, stage clear, final
 * stage cleared, total result) and they share one structure: a heading, a stack
 * of label plates each carrying a value and its points award, then a full-width
 * total bar. That shared structure is implemented once in `drawResultScreen`
 * and the variants are data.
 *
 * SECOND_ROUND is the exception and is marked DERIVED wherever it appears: the
 * recording is a single playthrough, so the second-round clear was never seen.
 * It is extrapolated from the observed family rather than invented freely, and
 * it must not be cited as reference for anything else.
 */

import { clearTime, accuracyText, accuracyAward, W, H, C } from './hud.js';

/** Result plates carry the stage's own palette — stage 1 red, stage 4 green. */
export const STAGE_TINT = {
  0: '#b8202f',
  1: '#b8202f',
  2: '#a8203a',
  3: '#8a2440',
  4: '#2f8a3a',
  5: '#7a3aa8',
  6: '#b03020',
};

export const tintFor = (stage) => STAGE_TINT[stage] || STAGE_TINT[1];

/**
 * Build the row set for a result screen.
 * Pure, so the arithmetic behind every printed number is testable.
 */
export function resultRows(stats) {
  const rows = [
    { label: 'CLEAR TIME', value: clearTime(stats.clearTime), award: stats.timeAward },
    { label: 'ACCURACY', value: accuracyText(stats.accuracy) + ' %', award: accuracyAward(stats.accuracy) },
    // Headshots print as --- when none were scored, not as 0.
    { label: 'HEADSHOTS', value: stats.headshots > 0 ? `${stats.headshots} HIT` : '--- HIT', award: null },
  ];
  return rows;
}

/**
 * Crisis events are graded with a letter in a gold disc. An `A` was observed;
 * the thresholds behind the other letters were not, so this curve is invented.
 */
export function crisisRank(targets, hit, bullseyes) {
  if (!targets) return 'E';
  const acc = hit / targets;
  const eye = bullseyes / targets;
  const s = acc * 0.65 + eye * 0.35;
  if (s >= 0.98) return 'S';
  if (s >= 0.85) return 'A';
  if (s >= 0.70) return 'B';
  if (s >= 0.50) return 'C';
  if (s >= 0.30) return 'D';
  return 'E';
}

/** Stage chips, two rows: 1-3 above, 4/5/FINAL below. */
export function chipGrid(reached) {
  const names = ['STAGE 1', 'STAGE 2', 'STAGE 3', 'STAGE 4', 'STAGE 5', 'FINAL STAGE'];
  return names.map((name, i) => ({
    name, index: i, row: i < 3 ? 0 : 1, col: i % 3,
    lit: i <= reached,
  }));
}

/* ------------------------------- drawing ------------------------------- */

const font = (ctx, weight, size) => {
  ctx.font = `${weight} ${size}px "Segoe UI", system-ui, sans-serif`;
};

/** The diagonal hazard striping that edges every result screen. */
function hazardStripe(ctx, x, y, w, h, tint) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  for (let i = -h; i < w; i += 16) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + h, y);
    ctx.lineTo(x + i + h + 7, y); ctx.lineTo(x + i + 7, y + h);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

/**
 * The shared result screen.
 * `head` is the top-left heading block, `rows` the label/value/award stack,
 * `total` the full-width bar at the foot.
 */
export function drawResultScreen(ctx, opts) {
  const tint = opts.tint || tintFor(opts.stage);
  ctx.fillStyle = 'rgba(6,8,12,0.88)';
  ctx.fillRect(0, 0, W, H);

  hazardStripe(ctx, 0, 40, 120, 26, tint);
  hazardStripe(ctx, W - 200, H - 70, 200, 26, tint);

  // heading
  ctx.textAlign = 'left';
  if (opts.superTitle) {
    ctx.fillStyle = '#dfe6ef';
    font(ctx, 600, 22);
    ctx.fillText(opts.superTitle, 74, 118);
  }
  ctx.fillStyle = '#ffffff';
  font(ctx, 700, opts.titleSize || 82);
  ctx.fillText(opts.title, 70, 200);
  if (opts.bigNumber) {
    font(ctx, 700, 120);
    ctx.fillText(opts.bigNumber, 70, 320);
  }

  // rows
  const rx = opts.rowX || 470;
  const rw = W - rx - 90;
  (opts.rows || []).forEach((row, i) => {
    const y = 150 + i * 74;
    ctx.fillStyle = tint;
    ctx.fillRect(rx, y, 210, 30);
    ctx.fillStyle = '#ffffff';
    font(ctx, 700, 16);
    ctx.textAlign = 'left';
    ctx.fillText(row.label, rx + 14, y + 21);

    ctx.fillStyle = 'rgba(226,230,238,0.95)';
    ctx.fillRect(rx + 40, y + 30, rw - 40, 34);
    ctx.fillStyle = tint;
    font(ctx, 700, 30);
    ctx.textAlign = 'right';
    ctx.fillText(row.value, rx + rw - 16, y + 58);

    if (row.award != null) {
      ctx.fillStyle = '#ffffff';
      font(ctx, 700, 17);
      ctx.fillText('+' + row.award, rx + rw - 16, y + 22);
    }
  });

  // total bar
  const ty = 150 + (opts.rows || []).length * 74 + 16;
  ctx.fillStyle = tint;
  ctx.fillRect(rx, ty, 230, 28);
  ctx.fillStyle = '#ffffff';
  font(ctx, 700, 16);
  ctx.textAlign = 'left';
  ctx.fillText(opts.totalLabel, rx + 14, ty + 20);

  ctx.fillStyle = tint;
  ctx.fillRect(70, ty + 28, W - 160, 52);
  ctx.fillStyle = '#ffffff';
  font(ctx, 700, 40);
  ctx.textAlign = 'right';
  ctx.fillText(String(opts.total), W - 150, ty + 66);
  font(ctx, 600, 18);
  ctx.fillText('Pts.', W - 96, ty + 66);
}

export const drawAreaResult = (ctx, stage, area, stats, areaScore) =>
  drawResultScreen(ctx, {
    stage, superTitle: `STAGE ${stage}`, title: 'AREA',
    bigNumber: String(area).padStart(2, '0'),
    rows: resultRows(stats), totalLabel: 'AREA SCORE', total: areaScore,
  });

export const drawStageClear = (ctx, stage, stats, total, isFinal) =>
  drawResultScreen(ctx, {
    stage,
    title: isFinal ? 'FINAL STAGE  CLEARED' : `STAGE ${stage}  CLEARED`,
    titleSize: isFinal ? 54 : 60,
    rows: resultRows(stats), totalLabel: 'TOTAL SCORE', total,
  });

export const drawTotalResult = (ctx, stats, total) =>
  drawResultScreen(ctx, {
    stage: 1, tint: '#c01a28',
    title: 'CONGRATULATIONS!', titleSize: 56,
    superTitle: 'MISSION COMPLETE',
    rows: resultRows(stats), totalLabel: 'TOTAL SCORE', total,
  });

/**
 * DERIVED — never observed. The recording is a single playthrough, so the
 * second-round clear was not captured. Built from the observed family: same
 * row structure, same total bar, with an ALL CLEAR heading matching the
 * `SetAllClear` and `HasCompletedAllStages` states in the symbol table.
 */
export const drawSecondRoundClear = (ctx, stats, total) =>
  drawResultScreen(ctx, {
    stage: 6, tint: '#c8a01a',
    title: 'ALL CLEAR', titleSize: 78,
    superTitle: '2ND ROUND COMPLETE',
    rows: resultRows(stats), totalLabel: 'TOTAL SCORE', total,
  });

/** Crisis event result — the only screen carrying a letter grade. */
export function drawCrisisResult(ctx, seconds, targets, hit, bullseyes, bonus) {
  ctx.fillStyle = 'rgba(6,8,12,0.86)';
  ctx.fillRect(0, 0, W, H);
  const x = 300, y = 160, w = 680;
  ctx.fillStyle = 'rgba(240,242,246,0.96)';
  ctx.fillRect(x, y, w, 300);
  const rows = [
    ['CLEAR TIME', seconds.toFixed(1) + ' Sec.'],
    ['TARGET', String(hit)],
    ["BULL'S EYE", String(bullseyes)],
  ];
  rows.forEach(([l, v], i) => {
    const ry = y + 26 + i * 52;
    ctx.fillStyle = '#1a1e26';
    ctx.fillRect(x + 18, ry, 200, 34);
    ctx.fillStyle = i === 0 ? '#ffffff' : '#57d76a';
    font(ctx, 700, 15); ctx.textAlign = 'left';
    ctx.fillText(l, x + 30, ry + 23);
    ctx.fillStyle = '#12161d';
    font(ctx, 700, 30); ctx.textAlign = 'right';
    ctx.fillText(v, x + w - 30, ry + 27);
  });
  ctx.fillStyle = '#1a1e26';
  ctx.fillRect(x + 18, y + 190, 200, 46);
  ctx.fillStyle = '#ffffff';
  font(ctx, 700, 16); ctx.textAlign = 'left';
  ctx.fillText('BONUS', x + 30, y + 212);
  ctx.fillText('SCORE', x + 30, y + 230);
  ctx.fillStyle = '#12161d';
  font(ctx, 700, 40); ctx.textAlign = 'right';
  ctx.fillText('+' + bonus, x + w - 100, y + 228);
  font(ctx, 600, 18);
  ctx.fillText('Pts.', x + w - 34, y + 228);

  // rank disc
  const rank = crisisRank(targets, hit, bullseyes);
  ctx.fillStyle = '#1a1e26';
  font(ctx, 700, 18); ctx.textAlign = 'left';
  ctx.fillText('RANK', x + 30, y + 280);
  const g = ctx.createRadialGradient(x + w - 90, y + 262, 6, x + w - 90, y + 262, 52);
  g.addColorStop(0, '#ffd979'); g.addColorStop(1, '#d69a12');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x + w - 90, y + 262, 48, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a2a06';
  font(ctx, 700, 56); ctx.textAlign = 'center';
  ctx.fillText(rank, x + w - 90, y + 282);
}

/** CONTINUE? — YES and NO plates flanking a countdown dial. */
export function drawContinue(ctx, secondsLeft, reachedStage, credits) {
  ctx.fillStyle = 'rgba(4,6,10,0.9)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(20,24,32,0.95)';
  ctx.fillRect(360, 90, 560, 86);
  ctx.fillStyle = '#ffffff';
  font(ctx, 700, 40); ctx.textAlign = 'left';
  ctx.fillText('CONTINUE?', 384, 138);
  font(ctx, 600, 17);
  ctx.fillText('SHOOT TO SELECT', 384, 166);

  ctx.fillStyle = '#101318';
  ctx.fillRect(150, 230, 380, 96);
  ctx.fillStyle = '#e8ecf2';
  ctx.fillRect(750, 230, 380, 96);
  ctx.fillStyle = '#ffffff';
  font(ctx, 700, 62); ctx.textAlign = 'center';
  ctx.fillText('YES', 340, 300);
  ctx.fillStyle = '#12161d';
  ctx.fillText('NO', 940, 300);

  // countdown dial
  const cx = 640, cy = 278, r = 58;
  ctx.fillStyle = '#12161d';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ff2f4a'; ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, secondsLeft / 20)));
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  font(ctx, 700, 46); ctx.textAlign = 'center';
  ctx.fillText(String(Math.ceil(secondsLeft)), cx, cy + 16);

  ctx.fillStyle = '#ffffff';
  font(ctx, 700, 18);
  ctx.fillText(`INSERT  ${credits.needed}  CREDIT(S)`, W / 2, 396);

  chipGrid(reachedStage).forEach((c) => {
    const cw = 210, ch = 26;
    const x = 320 + c.col * (cw + 10);
    const y = 430 + c.row * (ch + 8);
    ctx.fillStyle = c.lit ? '#e07818' : '#2a3038';
    ctx.fillRect(x, y, cw, ch);
    ctx.fillStyle = c.lit ? '#ffffff' : '#8b95a3';
    font(ctx, 700, 13); ctx.textAlign = 'left';
    ctx.fillText(c.name, x + 10, y + 18);
  });

  ctx.fillStyle = '#8b95a3';
  font(ctx, 600, 14); ctx.textAlign = 'center';
  ctx.fillText(`CREDIT(S)   ${credits.have} / ${credits.needed}`, W / 2, 520);
}

/** NOW LOADING — red streak bands on black. */
export function drawLoading(ctx, t) {
  ctx.fillStyle = '#05070b';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 4; i++) {
    const y = 120 + i * 130 + Math.sin(t * 1.2 + i) * 8;
    const g = ctx.createLinearGradient(0, y, W, y);
    g.addColorStop(0, 'rgba(180,20,32,0)');
    g.addColorStop(0.5, 'rgba(220,30,44,0.75)');
    g.addColorStop(1, 'rgba(180,20,32,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, W, 34);
  }
  ctx.fillStyle = '#ff5568';
  font(ctx, 600, 26); ctx.textAlign = 'right';
  ctx.fillText('NOW LOADING', W - 60, H - 60);
}

export function selfTest(ok) {
  const stats = { clearTime: 85.27, accuracy: 0.614, headshots: 6, timeAward: 83320 };
  const rows = resultRows(stats);
  ok('result screens carry three rows', rows.length === 3);
  ok('clear time row uses the observed format', rows[0].value === '01\'25"27');
  ok('accuracy row prints one decimal and a percent', rows[1].value === '61.4 %');
  ok('accuracy award follows the recovered formula', rows[1].award === 61400);
  ok('headshots row appends HIT', rows[2].value === '6 HIT');

  // Observed: a stage with no headshots prints dashes, not a zero.
  const none = resultRows({ ...stats, headshots: 0 });
  ok('no headshots prints --- rather than 0', none[2].value === '--- HIT');

  // Stage tinting was observed on two stages.
  ok('stage 1 results are red', tintFor(1) === '#b8202f');
  ok('stage 4 results are green', tintFor(4) === '#2f8a3a');
  ok('an unknown stage still gets a tint', !!tintFor(99));

  // Crisis rank: an A was observed; the curve is invented but must be monotonic.
  ok('a perfect crisis run ranks S', crisisRank(10, 10, 10) === 'S');
  ok('a strong run ranks A', crisisRank(10, 10, 6) === 'A');
  ok('a poor run ranks low', ['D', 'E'].includes(crisisRank(10, 3, 0)));
  ok('crisis rank never divides by zero', crisisRank(0, 0, 0) === 'E');
  ok('crisis rank is monotonic in accuracy', (() => {
    const order = 'EDCBAS';
    let prev = -1;
    for (let h = 0; h <= 10; h++) {
      const idx = order.indexOf(crisisRank(10, h, 0));
      if (idx < prev) return false;
      prev = idx;
    }
    return true;
  })());

  // Chip grid: two rows of three, lit up to the stage reached.
  const chips = chipGrid(3);
  ok('six stage chips', chips.length === 6);
  ok('chips split three above, three below',
    chips.filter((c) => c.row === 0).length === 3 && chips.filter((c) => c.row === 1).length === 3);
  ok('the final chip is named FINAL STAGE', chips[5].name === 'FINAL STAGE');
  ok('chips light up to the stage reached',
    chips[3].lit === true && chips[4].lit === false);
  ok('reaching nothing lights only the first', chipGrid(0).filter((c) => c.lit).length === 1);
}
