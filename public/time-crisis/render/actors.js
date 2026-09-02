// @ts-check
/**
 * Actors and effects — enemies, bosses, incoming fire, impacts.
 *
 * Drawn procedurally. Where the recording showed something specific it is
 * matched: enemy fire is an elongated orange tracer oriented along its travel
 * rather than a round dot, muzzle flashes are warm and brief, and a riot shield
 * is a translucent panel at chest height that plainly leaves the head clear.
 *
 * Boss silhouettes are dispatched by the `draw` handle in content/bosses.js.
 * That handle is the ONLY per-boss code the architecture permits — everything
 * else about a boss is data.
 */

import { enemyBoxes, partBox } from '../sim/combat.js';

const TRACER = '#ff9a2e';
const MUZZLE = '#ffd27a';

/* ------------------------------- enemies ------------------------------- */

export function drawEnemy(ctx, e, cover, t) {
  const b = enemyBoxes(e, cover);
  const def = e.def;
  ctx.save();

  if (e.dead) {
    const k = Math.min(1, e.deadT / 1.2);
    ctx.globalAlpha = 1 - k;
    ctx.translate(b.p.x, b.p.groundY);
    ctx.rotate(k * 1.25);
    ctx.translate(-b.p.x, -b.p.groundY);
  }

  const bob = def.static ? 0 : Math.sin(t * 2.4 + e.bob) * 3 * b.s;

  // shadow
  ctx.globalAlpha *= 0.42;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(b.p.x, b.p.groundY, b.bodyW * 0.72, b.bodyW * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = e.dead ? 1 - Math.min(1, e.deadT / 1.2) : 1;

  const aiming = e.state === 'aiming';
  const red = aiming && def.red;
  const pulse = 0.5 + 0.5 * Math.sin(t * (red ? 30 : 14));

  let body = def.color || '#7d8ba1';
  if (e.hitT > 0) body = '#ffffff';
  else if (aiming) {
    body = red
      ? `rgb(255,${(40 + pulse * 60) | 0},${(60 + pulse * 40) | 0})`
      : `rgb(${(200 + pulse * 55) | 0},${(150 + pulse * 60) | 0},60)`;
  }

  // torso
  ctx.fillStyle = body;
  ctx.fillRect(b.body.x, b.body.y + bob, b.bodyW, b.bodyH * 0.62);
  // legs
  ctx.fillRect(b.p.x - b.bodyW * 0.32, b.body.y + b.bodyH * 0.6 + bob, b.bodyW * 0.26, b.bodyH * 0.42);
  ctx.fillRect(b.p.x + b.bodyW * 0.06, b.body.y + b.bodyH * 0.6 + bob, b.bodyW * 0.26, b.bodyH * 0.42);
  // weapon arm, extended while aiming
  ctx.fillStyle = '#2a2f38';
  ctx.fillRect(b.p.x + b.bodyW * 0.2, b.body.y + b.bodyH * 0.22 + bob,
    b.bodyW * (aiming ? 1.15 : 0.8), 9 * b.s);

  // head — the high-value target
  ctx.fillStyle = e.hitT > 0 ? '#fff' : '#d9c3a6';
  ctx.beginPath();
  ctx.arc(b.p.x, b.head.y + b.headR + bob, b.headR, 0, Math.PI * 2);
  ctx.fill();

  // Riot shield: translucent, chest height, head clear above it.
  if (e.shield > 0 && b.shield) {
    const frac = e.shield / (e.shieldMax || 1);
    ctx.fillStyle = `rgba(150,200,225,${0.22 + 0.16 * frac})`;
    ctx.fillRect(b.shield.x, b.shield.y + bob, b.shield.w, b.shield.h);
    ctx.strokeStyle = `rgba(210,240,255,${0.45 + 0.35 * frac})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(b.shield.x, b.shield.y + bob, b.shield.w, b.shield.h);
  }

  // telegraph ring
  if (aiming) {
    const prog = Math.min(1, e.aimT / (e.aimDur || 1));
    ctx.strokeStyle = red ? '#ff2f4a' : '#ffb020';
    ctx.lineWidth = 3.5 * b.s;
    ctx.beginPath();
    ctx.arc(b.p.x, b.body.y + b.bodyH * 0.3 + bob, b.bodyW,
      -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
    ctx.stroke();
  }

  // Ammo carriers are marked, because the player is told to shoot them.
  if (e.carries) {
    ctx.strokeStyle = '#ffb020';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(b.body.x - 6, b.head.y - 6, b.bodyW + 12, b.bodyH + b.headR * 2 + 12);
    ctx.setLineDash([]);
  }

  ctx.restore();
}

/* -------------------------------- bosses -------------------------------- */

/**
 * Per-boss silhouettes. This dispatch table is the only place boss-specific
 * code is allowed to live.
 */
export const BOSS_DRAW = {
  hacs(ctx, x, y, w, h) {          // powered armour, thruster flare
    ctx.fillStyle = '#3f4652';
    ctx.fillRect(x - w / 2, y - h, w, h * 0.72);
    ctx.fillStyle = '#2a303a';
    ctx.fillRect(x - w * 0.62, y - h * 0.9, w * 0.22, h * 0.5);
    ctx.fillRect(x + w * 0.4, y - h * 0.9, w * 0.22, h * 0.5);
    ctx.fillStyle = '#8fa4c0';
    ctx.beginPath(); ctx.arc(x, y - h * 0.92, w * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8a2a';
    ctx.fillRect(x - w * 0.3, y - h * 0.06, w * 0.18, h * 0.14);
    ctx.fillRect(x + w * 0.12, y - h * 0.06, w * 0.18, h * 0.14);
  },
  mlt(ctx, x, y, w, h) {           // multi-legged walker
    ctx.fillStyle = '#55604e';
    ctx.fillRect(x - w / 2, y - h * 0.9, w, h * 0.5);
    ctx.strokeStyle = '#3d463a'; ctx.lineWidth = w * 0.07;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + s * w * 0.3, y - h * 0.42);
      ctx.lineTo(x + s * w * 0.62, y - h * 0.2);
      ctx.lineTo(x + s * w * 0.48, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#6f7a66';
    ctx.fillRect(x - w * 0.18, y - h * 1.02, w * 0.36, h * 0.16);
  },
  uah(ctx, x, y, w, h) {           // helicopter
    ctx.fillStyle = '#3a444f';
    ctx.beginPath(); ctx.ellipse(x, y - h * 0.5, w * 0.4, h * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - w * 0.06, y - h * 0.56, w * 0.7, h * 0.06);
    ctx.strokeStyle = '#20262d'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x - w * 0.66, y - h * 0.78); ctx.lineTo(x + w * 0.66, y - h * 0.78); ctx.stroke();
  },
  wilddog(ctx, x, y, w, h) {       // armoured figure with a weapon arm
    ctx.fillStyle = '#4a4a52';
    ctx.fillRect(x - w * 0.3, y - h * 0.82, w * 0.6, h * 0.62);
    ctx.fillStyle = '#8a2a2a';
    ctx.fillRect(x + w * 0.28, y - h * 0.7, w * 0.34, h * 0.2);
    ctx.fillStyle = '#d8c8a8';
    ctx.beginPath(); ctx.arc(x, y - h * 0.92, w * 0.13, 0, Math.PI * 2); ctx.fill();
  },
  keith(ctx, x, y, w, h) {         // bladed silhouette
    ctx.fillStyle = '#3a3f56';
    ctx.fillRect(x - w * 0.22, y - h * 0.8, w * 0.44, h * 0.6);
    ctx.strokeStyle = '#cfd8ea'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x + w * 0.2, y - h * 0.62); ctx.lineTo(x + w * 0.72, y - h * 0.9); ctx.stroke();
    ctx.fillStyle = '#e0cfae';
    ctx.beginPath(); ctx.arc(x, y - h * 0.9, w * 0.12, 0, Math.PI * 2); ctx.fill();
  },
  wildfang(ctx, x, y, w, h) {      // spiked crest
    ctx.fillStyle = '#7a2a86';
    ctx.fillRect(x - w * 0.26, y - h * 0.78, w * 0.52, h * 0.58);
    ctx.strokeStyle = '#e0642a'; ctx.lineWidth = 4;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y - h * 0.86);
      ctx.lineTo(x + i * w * 0.11, y - h * 1.12);
      ctx.stroke();
    }
    ctx.fillStyle = '#e8d0b0';
    ctx.beginPath(); ctx.arc(x, y - h * 0.9, w * 0.12, 0, Math.PI * 2); ctx.fill();
  },
  irongiant(ctx, x, y, w, h) {     // heavy multi-part mech
    ctx.fillStyle = '#454b5e';
    ctx.fillRect(x - w * 0.42, y - h * 0.86, w * 0.84, h * 0.56);
    ctx.fillStyle = '#2f3444';
    ctx.fillRect(x - w * 0.66, y - h * 0.8, w * 0.2, h * 0.46);
    ctx.fillRect(x + w * 0.46, y - h * 0.8, w * 0.2, h * 0.46);
    ctx.fillRect(x - w * 0.28, y - h * 0.3, w * 0.22, h * 0.3);
    ctx.fillRect(x + w * 0.06, y - h * 0.3, w * 0.22, h * 0.3);
    ctx.fillStyle = '#9f7ad6';
    ctx.beginPath(); ctx.arc(x, y - h * 0.58, w * 0.13, 0, Math.PI * 2); ctx.fill();
  },
  robert(ctx, x, y, w, h) {        // human, long coat
    ctx.fillStyle = '#5a5f70';
    ctx.fillRect(x - w * 0.2, y - h * 0.78, w * 0.4, h * 0.62);
    ctx.fillStyle = '#8a8f9e';
    ctx.fillRect(x - w * 0.3, y - h * 0.7, w * 0.12, h * 0.4);
    ctx.fillStyle = '#dcc6a8';
    ctx.beginPath(); ctx.arc(x, y - h * 0.88, w * 0.12, 0, Math.PI * 2); ctx.fill();
  },
};

export function drawBoss(ctx, boss, e, cover, t) {
  const b = enemyBoxes(e, cover);
  const w = b.bodyW * 2.4, h = b.bodyH * 1.6;
  const fn = BOSS_DRAW[boss.def.draw];
  ctx.save();
  if (boss.hitT > 0) { ctx.globalAlpha = 0.85; }
  if (fn) fn(ctx, b.p.x, b.p.groundY, w, h);
  else { ctx.fillStyle = '#4a5060'; ctx.fillRect(b.p.x - w / 2, b.p.groundY - h, w, h); }

  // Parts: exposed ones are outlined, weak ones highlighted, destroyed hidden.
  for (const p of boss.parts) {
    if (p.destroyed || !p.exposed) continue;
    const box = partBox(e, p, cover);
    ctx.strokeStyle = p.weak ? '#ffd23a' : 'rgba(200,215,235,0.55)';
    ctx.lineWidth = p.weak ? 3 : 1.5;
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    if (p.weak) {
      ctx.fillStyle = `rgba(255,210,58,${0.10 + 0.10 * Math.sin(t * 6)})`;
      ctx.fillRect(box.x, box.y, box.w, box.h);
    }
    // part health, as a thin bar under its box
    const frac = Math.max(0, p.hp / p.maxhp);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(box.x, box.y + box.h + 3, box.w, 4);
    ctx.fillStyle = p.weak ? '#ffd23a' : '#8fa4c0';
    ctx.fillRect(box.x, box.y + box.h + 3, box.w * frac, 4);
  }
  ctx.restore();
}

/* ------------------------------- effects -------------------------------- */

/** Incoming fire: an elongated tracer along its travel, not a dot. */
export function drawTracer(ctx, shot, fromX, fromY, toX, toY) {
  const p = Math.min(1, shot.life / shot.ttl);
  const x = fromX + (toX - fromX) * p;
  const y = fromY + (toY - fromY) * p;
  const dx = toX - fromX, dy = toY - fromY;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const tail = 26 + 30 * p;

  ctx.save();
  ctx.strokeStyle = shot.red ? '#ff2f4a' : TRACER;
  ctx.lineWidth = shot.red ? 6 : 4;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.moveTo(x - ux * tail, y - uy * tail);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = shot.red ? 14 : 10;
  ctx.beginPath();
  ctx.moveTo(x - ux * tail * 0.6, y - uy * tail * 0.6);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.restore();
}

export function drawMuzzle(ctx, x, y, scale, t) {
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = MUZZLE;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + t;
    const r = (i % 2 ? 8 : 20) * scale;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawImpact(ctx, fx) {
  const k = fx.t / fx.life;
  ctx.save();
  ctx.globalAlpha = 1 - k;
  if (fx.type === 'boom') {
    ctx.fillStyle = '#ffb020';
    ctx.beginPath(); ctx.arc(fx.x, fx.y, 20 + k * 170, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,200,0.6)';
    ctx.beginPath(); ctx.arc(fx.x, fx.y, 10 + k * 90, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#c0263c';
    ctx.beginPath(); ctx.arc(fx.x, fx.y, (6 + k * 20) * (fx.s || 1), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** bDisplayScreenBulletHoles=TRUE — misses mark the scenery. */
export function drawBulletHole(ctx, h) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - h.t / 8) * 0.85;
  ctx.fillStyle = '#05070d';
  ctx.beginPath(); ctx.arc(h.x, h.y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(220,235,255,0.35)';
  ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

export function selfTest(ok) {
  const names = Object.keys(BOSS_DRAW);
  ok('every boss has a draw handler', names.length === 8);
  ok('draw handlers are functions', names.every((n) => typeof BOSS_DRAW[n] === 'function'));

  // The handles must line up with the data, or a boss renders as a grey box.
  const ids = ['hacs', 'mlt', 'uah', 'wilddog', 'keith', 'wildfang', 'irongiant', 'robert'];
  ok('handlers cover every boss id', ids.every((id) => !!BOSS_DRAW[id]));

  // Draw into a stub context and confirm each handler actually emits calls —
  // an empty handler would silently render nothing.
  const calls = [];
  const stub = new Proxy({}, {
    get: (_, k) => {
      if (k === 'fillStyle' || k === 'strokeStyle' || k === 'lineWidth' || k === 'globalAlpha') return '';
      return (...a) => calls.push(String(k));
    },
    set: () => true,
  });
  for (const n of names) {
    calls.length = 0;
    BOSS_DRAW[n](stub, 100, 200, 80, 120);
    ok(`the ${n} handler draws something`, calls.length > 0);
  }

  // A tracer must be a line along travel, not a point.
  calls.length = 0;
  drawTracer(stub, { life: 0.5, ttl: 1, red: false }, 0, 0, 100, 100);
  ok('a tracer strokes a line', calls.includes('stroke') && calls.includes('lineTo'));
  ok('a tracer never divides by zero on a zero-length path', (() => {
    calls.length = 0;
    drawTracer(stub, { life: 0.5, ttl: 1, red: true }, 50, 50, 50, 50);
    return calls.length > 0;
  })());

  calls.length = 0;
  drawMuzzle(stub, 10, 10, 1, 0);
  ok('a muzzle flash fills a shape', calls.includes('fill'));

  calls.length = 0;
  drawImpact(stub, { type: 'boom', t: 0.2, life: 0.45, x: 0, y: 0 });
  ok('an explosion fills', calls.includes('fill'));
  calls.length = 0;
  drawBulletHole(stub, { x: 5, y: 5, t: 0 });
  ok('a bullet hole draws and outlines', calls.includes('fill') && calls.includes('stroke'));
}
