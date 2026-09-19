// @ts-check
/**
 * Combat HUD.
 *
 * Every position, label and colour here comes from render/REFERENCE.md, which
 * was written from full-resolution frames of the arcade build running and of a
 * 1280x720/30fps recording. Nothing in this file is styled from imagination —
 * where a value was not observable it is marked.
 *
 * The single-file build had five of these wrong, and they are corrected here:
 *   score      top-left      -> bottom-right
 *   life       top-left      -> top-right, chevrons rather than crosshairs
 *   ammo       dot pips      -> magazine count + cartridge icons, bottom-left
 *   pedals     two boxes     -> one unified widget, bottom-centre, "POSITION"
 *   timer      whole seconds -> hundredths
 */

import { TC } from '../core/tune.js';

export const W = TC.RES_X;   // 1280
export const H = TC.RES_Y;   // 720

/** Observed palette. */
export const C = {
  amber: '#ffb020',      // labels: TIME, LIFE, WEAPON, SCORE
  pedalLit: '#f5871f',   // pressed pedal
  pedalDark: '#7a4a12',  // released pedal
  ink: '#ffffff',
  bar: '#2f7fd0',        // the blue bar under the weapon name
  cyan: '#7fe6ff',       // hit-chain award
  green: '#57d76a',      // side-attack award
  red: '#ff2f4a',
  plate: 'rgba(8,12,18,0.62)',
  brass: '#d8b061',
};

/** Layout boxes at 1280x720, measured off reference frames. */
export const LAYOUT = {
  timer:   { x: 28,  y: 18 },
  info:    { x: 268, y: 8,  w: 744, h: 62 },
  life:    { x: 1252, y: 30, gap: 44 },
  ammo:    { x: 24,  y: 566, w: 300, h: 130 },
  slots:   { x: 24,  y: 676, size: 34, gap: 6, count: 5 },
  pedal:   { cx: 640, y: 612, w: 300, h: 78 },
  score:   { x: 1256, y: 590 },
  banner:  { y: 330, h: 56 },
};

/* ----------------------------- formatters ----------------------------- */

/**
 * HUD clock: a large whole-second figure, a smaller hundredths figure, then
 * `Sec.` — the arcade shows the fraction, so a whole-second clock reads wrong.
 */
export function hudTime(seconds) {
  // Round rather than floor: 58.33 - 58 is 0.32999... in binary floating point,
  // so flooring the hundredths shows 32 for a clock that reads 58.33.
  const cs = Math.round(Math.max(0, seconds) * 100);
  const whole = Math.floor(cs / 100);
  return { whole: String(whole), frac: String(cs % 100).padStart(2, '0') };
}

/** Result-screen clear time: `01'25"27`. */
export function clearTime(seconds) {
  // Work entirely in centiseconds so the same rounding problem cannot bite,
  // and so 59.999 carries into the next minute instead of printing 00'59"100.
  const total = Math.round(Math.max(0, seconds) * 100);
  const cs = total % 100;
  const sec = Math.floor(total / 100) % 60;
  const m = Math.floor(total / 6000);
  return `${String(m).padStart(2, '0')}'${String(sec).padStart(2, '0')}"${String(cs).padStart(2, '0')}`;
}

/** Accuracy prints to one decimal, and its award is 1000 points per percent. */
export const accuracyText = (acc) => (acc * 100).toFixed(1);
export const accuracyAward = (acc) => Math.round(acc * 100000);

/**
 * Pedal widget geometry. One graphic, two halves; the held side lifts and
 * lights. Returns both halves so the drawing code stays declarative.
 */
export function pedalGeometry(side, exposure) {
  const { cx, y, w, h } = LAYOUT.pedal;
  const half = w / 2 - 10;
  const lift = 18 * Math.min(1, Math.max(0, exposure));
  return {
    L: { x: cx - w / 2, y: side === 'L' ? y - lift : y, w: half, h,
         lit: side === 'L', label: 'L' },
    R: { x: cx + 10,    y: side === 'R' ? y - lift : y, w: half, h,
         lit: side === 'R', label: 'R' },
  };
}

/* ------------------------------ drawing ------------------------------- */

function plate(ctx, x, y, w, h, r = 6) {
  ctx.fillStyle = C.plate;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

const label = (ctx, text, x, y, align = 'left', color = C.amber, size = 12) => {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
};

export function drawTimer(ctx, seconds) {
  const { x, y } = LAYOUT.timer;
  const t = hudTime(seconds);
  const urgent = seconds <= 10;
  ctx.textAlign = 'left';
  ctx.fillStyle = urgent ? C.red : C.ink;
  ctx.font = '700 54px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(t.whole, x, y + 46);
  const wide = ctx.measureText(t.whole).width;
  ctx.font = '700 24px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('.' + t.frac, x + wide + 2, y + 46);
  ctx.font = '600 13px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = C.ink;
  ctx.fillText('Sec.', x + wide + 44, y + 46);
  label(ctx, 'TIME', x + 22, y + 66);
  // the small orange arc that sits left of the TIME label
  ctx.strokeStyle = C.amber;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x + 8, y + 62, 7, Math.PI * 0.15, Math.PI * 1.5);
  ctx.stroke();
}

export function drawInfo(ctx, portraitHue, text) {
  if (!text) return;
  const { x, y, w, h } = LAYOUT.info;
  plate(ctx, x, y, w, h, 4);
  // portrait box — the radio operator's frame
  ctx.fillStyle = `hsl(${portraitHue},32%,42%)`;
  ctx.fillRect(x + 6, y + 6, 52, h - 12);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 6, y + 6, 52, h - 12);
  label(ctx, 'INFO.', x + 66, y + h - 8, 'left', C.amber, 11);
  ctx.fillStyle = C.ink;
  ctx.font = '600 21px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2 + 30, y + 34);
}

export function drawLife(ctx, lives, max = 3) {
  const { x, y, gap } = LAYOUT.life;
  for (let i = 0; i < max; i++) {
    const cx = x - i * gap;
    const spent = i >= lives;
    ctx.strokeStyle = spent ? 'rgba(120,40,50,0.75)' : C.red;
    ctx.fillStyle = spent ? 'rgba(40,14,18,0.6)' : 'rgba(120,20,32,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // chevron glyph
    ctx.strokeStyle = spent ? 'rgba(150,70,80,0.7)' : '#ffd9de';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 6, y - 3); ctx.lineTo(cx, y + 3); ctx.lineTo(cx + 6, y - 3);
    ctx.stroke();
  }
  label(ctx, 'LIFE', x + 6, y + 32, 'right');
}

export function drawAmmo(ctx, weaponName, count, magMax, infinite, slots, activeSlot) {
  const { x, y, w, h } = LAYOUT.ammo;
  plate(ctx, x, y, w, h, 6);
  label(ctx, 'Mag Count', x + 14, y + 20, 'left', 'rgba(255,255,255,0.55)', 10);

  ctx.fillStyle = C.ink;
  ctx.font = '700 40px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  // Unlimited weapons show the infinity glyph rather than a number.
  ctx.fillText(infinite ? '∞' : String(count), x + 14, y + 58);

  // cartridge icons, one per remaining round, capped so the row stays put
  const shown = infinite ? 6 : Math.min(count, 9);
  for (let i = 0; i < shown; i++) {
    const bx = x + 96 + i * 11;
    ctx.fillStyle = C.brass;
    ctx.fillRect(bx, y + 26, 7, 26);
    ctx.fillStyle = '#f0dca8';
    ctx.fillRect(bx, y + 26, 7, 7);
  }

  ctx.fillStyle = C.bar;
  ctx.fillRect(x + 96, y + 60, w - 120, 5);
  label(ctx, weaponName, x + 14, y + 78, 'left', C.ink, 13);
  label(ctx, 'WEAPON', x + w - 14, y + h - 10, 'right');

  drawSlots(ctx, slots, activeSlot);
}

/** The row of hexagonal weapon slots along the bottom left. */
export function drawSlots(ctx, slots, active) {
  const { x, y, size, gap } = LAYOUT.slots;
  slots.forEach((s, i) => {
    const cx = x + 16 + i * (size + gap);
    const cy = y;
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = Math.PI / 6 + k * Math.PI / 3;
      const px = cx + Math.cos(a) * size / 2;
      const py = cy + Math.sin(a) * size / 2;
      k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = i === active ? (s.color || C.bar) : 'rgba(20,26,34,0.85)';
    ctx.fill();
    ctx.strokeStyle = i === active ? C.ink : 'rgba(150,170,200,0.4)';
    ctx.lineWidth = i === active ? 2 : 1;
    ctx.stroke();
  });
}

export function drawPedals(ctx, side, exposure) {
  const g = pedalGeometry(side, exposure);
  for (const half of [g.L, g.R]) {
    ctx.fillStyle = half.lit ? C.pedalLit : C.pedalDark;
    ctx.beginPath();
    // a trapezoid, narrower at the top, so a lit pedal reads as tilting up
    ctx.moveTo(half.x + 14, half.y);
    ctx.lineTo(half.x + half.w, half.y + 6);
    ctx.lineTo(half.x + half.w, half.y + half.h);
    ctx.lineTo(half.x, half.y + half.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(half.x + 26, half.y + half.h - 30, half.w - 52, 20);
    label(ctx, half.label, half.x + half.w / 2, half.y + half.h - 15, 'center',
      half.lit ? '#ffe9c8' : '#c89a5c', 14);
  }
  label(ctx, 'POSITION', LAYOUT.pedal.cx, LAYOUT.pedal.y + LAYOUT.pedal.h + 14, 'center',
    'rgba(255,255,255,0.7)', 10);
}

export function drawScore(ctx, total, awards) {
  const { x, y } = LAYOUT.score;
  label(ctx, 'SCORE', x, y, 'right');
  ctx.fillStyle = C.ink;
  ctx.font = '700 38px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(String(total), x, y + 38);
  // Awards stack downward under the score as they are earned.
  awards.slice(-3).forEach((a, i) => {
    const ay = y + 62 + i * 22;
    ctx.font = '700 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = a.kind === 'side' ? C.green : C.cyan;
    ctx.textAlign = 'right';
    ctx.fillText(a.label, x - 92, ay);
    ctx.fillStyle = C.ink;
    ctx.fillText('+' + a.value, x, ay);
  });
}

/** WAIT / ACTION / RELOAD / SUCCESS! — wide centred plates. */
export const BANNERS = {
  WAIT:    { fill: 'rgba(96,104,180,0.72)', text: '#dfe6ff', tilt: 0 },
  ACTION:  { fill: 'rgba(196,52,28,0.82)',  text: '#ffe2b8', tilt: 0 },
  RELOAD:  { fill: 'rgba(190,132,20,0.85)', text: '#fff3d0', tilt: 0 },
  SUCCESS: { fill: 'rgba(210,150,24,0.9)',  text: '#fffbe8', tilt: -0.035 },
};

export function drawBanner(ctx, kind, sub) {
  const b = BANNERS[kind];
  if (!b) return;
  const { y, h } = LAYOUT.banner;
  ctx.save();
  if (b.tilt) { ctx.translate(W / 2, y + h / 2); ctx.rotate(b.tilt); ctx.translate(-W / 2, -(y + h / 2)); }
  ctx.fillStyle = b.fill;
  ctx.fillRect(0, y, W, h);
  ctx.fillStyle = b.text;
  ctx.font = '700 40px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(kind === 'SUCCESS' ? 'SUCCESS!' : kind, W / 2, y + 42);
  ctx.restore();
  if (sub) {
    ctx.fillStyle = 'rgba(190,30,45,0.85)';
    ctx.fillRect(0, y + h, W, 34);
    ctx.fillStyle = C.ink;
    ctx.font = '700 22px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(sub, W / 2, y + h + 24);
  }
}

/** Vertical boss gauge at the far left, with the phases-remaining numeral. */
export function drawBossGauge(ctx, fraction, phasesLeft) {
  const x = 30, y = 210, w = 22, h = 360;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - 3, y - 30, w + 6, h + 36);
  label(ctx, 'BOSS', x + w / 2, y - 14, 'center', C.ink, 11);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(x, y, w, h);
  const f = Math.max(0, Math.min(1, fraction));
  ctx.fillStyle = f > 0.35 ? '#e8d21e' : C.red;
  ctx.fillRect(x, y + h * (1 - f), w, h * f);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  if (phasesLeft != null) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x - 2, y + 4, w + 4, 26);
    label(ctx, String(phasesLeft), x + w / 2, y + 24, 'center', C.ink, 18);
  }
}

/** Hazard triangle pinned over a threat, and the danger ring. */
export function drawHazard(ctx, x, y, scale = 1) {
  const s = 26 * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f2c21a';
  ctx.beginPath();
  ctx.moveTo(0, -s); ctx.lineTo(s * 0.92, s * 0.72); ctx.lineTo(-s * 0.92, s * 0.72);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 3 * scale; ctx.stroke();
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(-2.5 * scale, -s * 0.42, 5 * scale, s * 0.78);
  ctx.beginPath(); ctx.arc(0, s * 0.52, 3 * scale, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawDangerRing(ctx, intensity) {
  const a = Math.max(0, Math.min(1, intensity));
  if (a <= 0) return;
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.78);
  g.addColorStop(0, 'rgba(255,20,40,0)');
  g.addColorStop(1, `rgba(255,20,40,${0.72 * a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/* ---------------------------------------------------------------- */

export function selfTest(ok) {
  // The clock shows hundredths; a whole-second clock was the old bug.
  ok('hud clock splits whole seconds from hundredths',
    hudTime(58.33).whole === '58' && hudTime(58.33).frac === '33');
  ok('hud clock pads the fraction to two digits', hudTime(9.05).frac === '05');
  ok('hud clock never goes negative', hudTime(-3).whole === '0');

  // Result screens use a different format again.
  ok('clear time formats as mm\'ss"cc', clearTime(85.27) === '01\'25"27');
  ok('clear time pads every field', clearTime(5.4) === '00\'05"40');
  ok('clear time handles over ten minutes', clearTime(1329.66).startsWith('22\'09'));

  // Four observed samples of the accuracy award.
  ok('accuracy prints to one decimal', accuracyText(0.614) === '61.4');
  ok('61.4% awards 61400', accuracyAward(0.614) === 61400);
  ok('57.8% awards 57800', accuracyAward(0.578) === 57800);
  ok('58.8% awards 58800', accuracyAward(0.588) === 58800);
  ok('49.5% awards 49500', accuracyAward(0.495) === 49500);

  // The pedal widget: one graphic, the held side lifted and lit.
  const gl = pedalGeometry('L', 1);
  ok('the held side lights', gl.L.lit === true && gl.R.lit === false);
  ok('the held side lifts above the other', gl.L.y < gl.R.y);
  const gr = pedalGeometry('R', 1);
  ok('the other pedal lifts when it is held', gr.R.y < gr.L.y);
  const flat = pedalGeometry('L', 0);
  ok('a pedal at rest does not lift', flat.L.y === flat.R.y);
  ok('the two halves do not overlap', gl.L.x + gl.L.w <= gl.R.x);
  ok('the widget is centred on screen',
    Math.abs((gl.L.x + gl.R.x + gl.R.w) / 2 - LAYOUT.pedal.cx) < 2);

  // The five corrected positions.
  ok('score sits bottom right', LAYOUT.score.x > W * 0.8 && LAYOUT.score.y > H * 0.7);
  ok('life sits top right', LAYOUT.life.x > W * 0.8 && LAYOUT.life.y < H * 0.2);
  ok('ammo sits bottom left', LAYOUT.ammo.x < W * 0.2 && LAYOUT.ammo.y > H * 0.7);
  ok('pedals sit bottom centre', Math.abs(LAYOUT.pedal.cx - W / 2) < 2);
  ok('info bar sits top centre', LAYOUT.info.x + LAYOUT.info.w / 2 > W * 0.45);
  ok('weapon slots sit under the ammo panel', LAYOUT.slots.y > LAYOUT.ammo.y);

  // Everything stays inside the frame.
  ok('no HUD element runs off screen',
    LAYOUT.ammo.x + LAYOUT.ammo.w < W && LAYOUT.info.x + LAYOUT.info.w <= W &&
    LAYOUT.pedal.cx + LAYOUT.pedal.w / 2 < W);

  ok('all four observed banners are defined',
    ['WAIT', 'ACTION', 'RELOAD', 'SUCCESS'].every((k) => !!BANNERS[k]));
  ok('only SUCCESS is tilted',
    BANNERS.SUCCESS.tilt !== 0 && BANNERS.WAIT.tilt === 0 && BANNERS.ACTION.tilt === 0);
}
