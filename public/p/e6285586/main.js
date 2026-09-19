// @ts-check
/**
 * Entry point. The ONLY file that touches DOM, rAF, AudioContext or input.
 *
 * Everything under core/, sim/ and content/ is deliberately free of globals so
 * it can be imported and asserted in Node. That separation is what lets 659
 * asserts and a 52-area content validator run headlessly — and it only holds
 * because this file is the single place the browser leaks in.
 */

import { TC, TUNING, settings } from './core/tune.js';
import { rng } from './core/rng.js';
import * as Run from './core/state.js';
import * as Rank from './core/ranking.js';

import { createCover, updateCover, visibleGroups } from './sim/cover.js';
import { createArea, updateArea, applyHit } from './sim/area.js';
import { pickTarget, depthOf, enemyBoxes } from './sim/combat.js';
import * as Score from './sim/score.js';
import * as Arms from './sim/weapons.js';
import * as Events from './sim/events.js';
import * as Boss from './sim/boss.js';
import { project } from './sim/camera.js';

import { ROUTES } from './content/routes.js';
import { STAGE0 } from './content/stage0.js';
import { STAGE1 } from './content/stage1.js';
import { STAGE2 } from './content/stage2.js';
import { STAGE3 } from './content/stage3.js';
import { STAGE4 } from './content/stage4.js';
import { STAGE5 } from './content/stage5.js';
import { STAGE6 } from './content/stage6.js';
import { BOSSES } from './content/bosses.js';
import { DIALOGUE, speakerHue } from './content/dialogue.js';
import { report as progressReport } from './content/progress.js';

import * as HUD from './render/hud.js';
import * as Screens from './render/screens.js';
import * as Actors from './render/actors.js';
import { loadPack, coverage } from './render/assets.js';
import * as Audio from './audio.js';

const W = TC.RES_X, H = TC.RES_Y;
const STAGES = [
  { stage: 0, areas: STAGE0 }, { stage: 1, areas: STAGE1 }, { stage: 2, areas: STAGE2 },
  { stage: 3, areas: STAGE3 }, { stage: 4, areas: STAGE4 }, { stage: 5, areas: STAGE5 },
  { stage: 6, areas: STAGE6 },
];

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('c'));
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');

/* ------------------------------- input -------------------------------- */

const input = { mx: W / 2, my: H / 2, pedalL: false, pedalR: false, fire: 0, held: false };

const toCanvas = (cx, cy) => {
  const r = canvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(W, (cx - r.left) / r.width * W)),
    y: Math.max(0, Math.min(H, (cy - r.top) / r.height * H)),
  };
};

canvas.addEventListener('mousemove', (e) => {
  const p = toCanvas(e.clientX, e.clientY);
  input.mx = p.x; input.my = p.y;
});
canvas.addEventListener('mousedown', (e) => {
  e.preventDefault();
  Audio.initAudio();
  const p = toCanvas(e.clientX, e.clientY);
  input.mx = p.x; input.my = p.y;
  if (e.button === 0) { input.fire++; input.held = true; }
  if (e.button === 2) input.pedalL = true;     // right mouse doubles as left pedal
});
window.addEventListener('mouseup', (e) => {
  if (e.button === 0) input.held = false;
  if (e.button === 2) input.pedalL = false;
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// T and Y are the cabinet's own USB foot-switch bindings, from DefaultInput.ini.
const PEDAL_L = ['t', 'shift', ' '];
const PEDAL_R = ['y', 'control'];
const key = (e) => e.key.toLowerCase();

window.addEventListener('keydown', (e) => {
  const k = key(e);
  if (PEDAL_L.includes(k)) { input.pedalL = true; e.preventDefault(); }
  if (PEDAL_R.includes(k)) { input.pedalR = true; e.preventDefault(); }
  if (k === 'enter' || k === ' ') Audio.initAudio();
  if (k === 'enter') game.confirm();
  if (k === 'p' && game.state === 'play') game.paused = !game.paused;
  if (k === 'm') Audio.setMuted(!Audio.isMuted());
  if (k === 'q') Arms.nextWeapon(game.arsenal);
});
window.addEventListener('keyup', (e) => {
  const k = key(e);
  if (PEDAL_L.includes(k)) input.pedalL = false;
  if (PEDAL_R.includes(k)) input.pedalR = false;
});
window.addEventListener('blur', () => { input.pedalL = input.pedalR = input.held = false; });

/* -------------------------------- game -------------------------------- */

const game = {
  state: 'title',   // title | play | areaClear | stageClear | allClear | gameOver
  paused: false,
  t: 0,
  run: null,
  area: null,
  arsenal: null,
  boss: null,
  event: null,
  info: null,
  infoT: 0,
  banner: null,
  bannerSub: null,
  bannerT: 0,
  shots: [],
  fx: [],
  holes: [],
  shake: 0,
  muzzle: 0,
  hurtFlash: 0,
  pack: null,
  result: null,
};

function say(k) {
  const line = DIALOGUE[k];
  if (!line) return;
  game.info = line;
  game.infoT = line.hold;
}

function banner(kind, sub, hold = 1.6) {
  game.banner = kind; game.bannerSub = sub || null; game.bannerT = hold;
}

function startArea() {
  const def = Run.currentArea(game.run);
  if (!def) return;
  const route = ROUTES[def.route];
  game.boss = null;
  game.event = null;
  game.shots.length = 0;
  game.fx.length = 0;
  game.holes.length = 0;
  game.arsenal = game.arsenal || Arms.createArsenal();

  game.area = createArea(def, route, {
    say,
    caution: (side) => banner('ACTION', `Threat on the ${side === 'L' ? 'left' : 'right'}`, 2.2),
    warp: () => {},
    onHurt: () => {
      game.hurtFlash = TUNING.HIT_FLASH;
      game.shake = TUNING.SHAKE_HIT;
      Audio.play('player.damage');
      Run.loseLife(game.run);
    },
    outOfLives: () => game.run.lives <= 0,
    onFire: (e, red) => Audio.play(red ? 'danger.signal' : 'shot.machinegun', 0.4),
    onKill: (e, how) => Audio.play(how === 'shield' ? 'shield.break' : 'enemy.down'),
    onCallout: (n) => Audio.play(n <= 10 ? 'countdown.last10' : 'countdown'),
    reload: () => Arms.reload(game.arsenal) && Audio.play('reload'),
    startEvent: (beat) => { game.event = Events.createEvent(beat); },
    startBoss: (id) => {
      game.boss = Boss.createBoss(BOSSES[id]);
      game.boss.actor = {
        wx: 0, z: 22, height: 0, dead: false, shield: 0, group: 'gb',
        def: { scale: 2.6 }, parts: game.boss.parts,
      };
    },
    areaClear: () => {},
  });

  banner('WAIT', `START FROM ${route.entry[0] === 'L' ? 'LEFT' : 'RIGHT'} COVER`, 2.4);
  say(def.script.find((b) => b.say)?.say);
  game.state = 'play';
}

game.confirm = () => {
  if (game.state === 'title') {
    rng.reseedAll(Date.now() & 0xffff);
    game.run = Run.createRun(STAGES);
    game.arsenal = Arms.createArsenal();
    startArea();
  } else if (game.state === 'areaClear' || game.state === 'stageClear') {
    Run.advance(game.run);
    startArea();
  } else if (game.state === 'allClear' || game.state === 'gameOver') {
    game.state = 'title';
  }
};

/* ------------------------------ firing -------------------------------- */

function tryFire() {
  const a = game.area;
  if (!a || game.state !== 'play') return;
  const w = Arms.activeWeapon(game.arsenal);
  const shot = Arms.fire(game.arsenal, a.cover.exposure);
  if (!shot.fired) {
    if (shot.reason === 'empty') Audio.play('shot.empty');
    return;
  }
  Audio.play(Audio.shotCue(w.short));
  game.muzzle = TUNING.FLASH_MUZZLE;

  const visible = visibleGroups(a.cover);
  for (const pellet of shot.pellets) {
    const ax = input.mx + pellet.spreadX;
    const ay = input.my + pellet.spreadY;
    Score.noteShot(a.score);

    // A crisis event's markers are shot instead of enemies.
    if (game.event && game.event.kind === 'crisis') {
      const m = game.event.markers.find((k) => k.alive &&
        Math.hypot(project(k.x, depthOf(k), a.cover).x - ax, 200) < 80);
      if (m && Events.hitMarker(game.event, m.id, Math.random() < 0.3)) {
        Score.noteHit(a.score);
        Audio.play('hit.bullseye');
        continue;
      }
    }

    const target = pickTarget(a.enemies, ax, ay, a.cover, visible, a.flanked);
    if (!target) {
      Score.noteMiss(a.score);
      game.holes.push({ x: ax, y: ay, t: 0 });
      if (game.holes.length > 40) game.holes.shift();
      continue;
    }

    Score.noteHit(a.score);
    Audio.play(Audio.hitCue(target.hit.zone, target.hit.shielded, target.hit.bullseye));
    const res = applyHit(a, target.enemy, target.hit, shot.dmg, w.id, target.flank);
    if (res && res.killed) {
      Score.noteKill(a.score, target.enemy.def.score, w.id, res.flags);
      const b = enemyBoxes(target.enemy, a.cover);
      game.fx.push({ type: 'blood', x: ax, y: ay, t: 0, life: 0.35, s: b.s });
    }
  }

  // Bosses take fire through their own damage path.
  if (game.boss && !game.boss.defeated) {
    const hit = pickTarget([game.boss.actor], input.mx, input.my, a.cover, new Set(['gb']));
    if (hit) {
      const out = Boss.damageBoss(game.boss, shot.dmg * (hit.hit.zone === 'head' ? TC.HEADSHOT_MULT : 1),
        hit.hit.part);
      if (out.killed) { Audio.play('area.clear'); banner('SUCCESS', null, 2.2); }
      else Audio.play(hit.hit.zone === 'head' ? 'hit.head' : 'hit.armor');
    }
  }
}

/* ------------------------------- update ------------------------------- */

function update(dt) {
  game.t += dt;
  game.shake = Math.max(0, game.shake - dt * 60);
  game.muzzle = Math.max(0, game.muzzle - dt);
  game.hurtFlash = Math.max(0, game.hurtFlash - dt);
  game.infoT = Math.max(0, game.infoT - dt);
  game.bannerT = Math.max(0, game.bannerT - dt);
  if (game.state !== 'play' || game.paused) { input.fire = 0; return; }

  Arms.updateArsenal(game.arsenal, dt);

  const w = Arms.activeWeapon(game.arsenal);
  if (w.auto && input.held) tryFire();
  while (input.fire > 0) { input.fire--; tryFire(); }
  input.fire = 0;

  if (game.event) {
    const r = Events.updateEvent(game.event, dt, input, game.area.cover);
    if (r !== 'running') {
      if (r === 'success') { banner('SUCCESS', null, 1.8); Audio.play('success'); }
      else { Audio.play('failed'); if (game.event.penalty === 'hit') game.area.hooks.onHurt(); }
      game.event = null;
    }
    return;
  }

  if (game.boss && !game.boss.defeated) {
    Boss.updateBoss(game.boss, dt, {
      fire: () => game.shots.push({ slot: game.area.cover.slot, red: true, life: 0, ttl: 0.6, done: false }),
      shake: (n) => { game.shake = Math.max(game.shake, n); },
    });
  }

  const state = updateArea(game.area, input, dt);
  if (state === 'cleared') finishArea();
  else if (state === 'failed') { game.state = 'gameOver'; Audio.play('failed'); }
}

function finishArea() {
  const a = game.area;
  const result = Score.finishArea(a.score, a.timeLeft, a.parTime);
  game.result = result;
  const next = Run.finishArea(game.run, a.score, result);
  Audio.play(next === 'areaClear' ? 'area.clear' : 'stage.clear');

  if (next === 'allClear') {
    const table = Rank.loadTable();
    if (Rank.madeTheBoard(table, game.run.totals.score)) {
      Rank.saveTable(Rank.insertScore(table, {
        name: 'AAA', score: game.run.totals.score, stage: 6,
        accuracy: Score.accuracy(a.score), time: game.run.playTime,
      }).table);
    }
    game.state = 'allClear';
  } else {
    game.state = next;
  }
}

/* ------------------------------- render ------------------------------- */

function render() {
  ctx.save();
  if (game.shake > 0) ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);

  ctx.fillStyle = '#05070d';
  ctx.fillRect(0, 0, W, H);

  if (game.state === 'title') { drawTitle(); ctx.restore(); return; }

  const a = game.area;
  if (a) {
    drawBackdrop(a);
    for (const e of [...a.enemies].sort((x, y) => depthOf(x) - depthOf(y))) {
      Actors.drawEnemy(ctx, e, a.cover, game.t);
    }
    if (game.boss && !game.boss.defeated) Actors.drawBoss(ctx, game.boss, game.boss.actor, a.cover, game.t);
    for (const h of game.holes) Actors.drawBulletHole(ctx, h);
    for (const f of game.fx) Actors.drawImpact(ctx, f);
    for (const s of game.shots) {
      if (!s.done) Actors.drawTracer(ctx, s, W / 2 + (Math.random() - 0.5) * 200, 200, W / 2, H * 0.62);
    }
    if (game.muzzle > 0) Actors.drawMuzzle(ctx, input.mx, input.my, 1, game.t * 40);

    drawCoverFrame(a);
    drawHUD(a);
  }

  if (game.hurtFlash > 0) HUD.drawDangerRing(ctx, game.hurtFlash / TUNING.HIT_FLASH);
  if (game.bannerT > 0 && game.banner) HUD.drawBanner(ctx, game.banner, game.bannerSub);
  if (game.event) drawEventOverlay();

  ctx.restore();
  drawScreens();
  if (game.state === 'play' && !game.paused) drawCrosshair();
  canvas.classList.toggle('showcursor', game.state !== 'play');
}

function drawBackdrop(a) {
  const stage = a.def.stage;
  const pal = [['#0a1424', '#132a3f'], ['#0a1424', '#173247'], ['#14161f', '#2a2033'],
               ['#101c14', '#1b3524'], ['#1a1206', '#2c1e0a'], ['#120a1c', '#241338'],
               ['#160c0c', '#2c1414']][stage] || ['#0a1424', '#132a3f'];
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, pal[0]); g.addColorStop(0.46, pal[1]); g.addColorStop(1, '#05070d');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(120,150,190,0.18)';
  ctx.lineWidth = 2;
  for (let i = -6; i <= 6; i++) {
    ctx.beginPath();
    ctx.moveTo(W / 2, H * 0.46);
    ctx.lineTo(W / 2 + i * 260, H);
    ctx.stroke();
  }
}

function drawCoverFrame(a) {
  const hide = 1 - a.cover.exposure;
  const wpx = W * 0.5 * hide;
  ctx.fillStyle = '#0a0d14';
  if (a.cover.side === 'L') ctx.fillRect(0, 0, wpx, H);
  else ctx.fillRect(W - wpx, 0, wpx, H);
}

function drawHUD(a) {
  HUD.drawTimer(ctx, a.timeLeft);
  if (game.infoT > 0 && game.info) HUD.drawInfo(ctx, speakerHue(game.info.who), game.info.text);
  HUD.drawLife(ctx, game.run.lives, game.run.maxLives);
  const w = Arms.activeWeapon(game.arsenal);
  HUD.drawAmmo(ctx, w.name, Arms.activeAmmo(game.arsenal), w.mag, Arms.isInfinite(game.arsenal),
    Arms.slotView(game.arsenal), game.arsenal.active);
  HUD.drawPedals(ctx, a.cover.side, a.cover.exposure);
  HUD.drawScore(ctx, a.score.total, a.score.popups.map((p) => ({ label: p.text, value: 0, kind: p.kind })));
  if (game.boss && !game.boss.defeated) {
    HUD.drawBossGauge(ctx, Boss.healthFraction(game.boss), Boss.phasesLeft(game.boss));
  }
}

function drawEventOverlay() {
  const n = Events.countdownNumeral(game.event);
  if (n != null && n > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 140px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(n), W / 2, H * 0.45);
  }
}

function drawScreens() {
  const r = game.result;
  if (game.state === 'areaClear' && r) {
    Screens.drawAreaResult(ctx, game.run.stages[game.run.stageIndex].stage,
      Run.currentArea(game.run)?.area ?? 1,
      { clearTime: r.clearTime, accuracy: r.accuracy, headshots: r.headshots, timeAward: r.timeBonus },
      r.areaScore);
  } else if (game.state === 'stageClear' && r) {
    Screens.drawStageClear(ctx, game.run.stages[game.run.stageIndex].stage,
      { clearTime: r.clearTime, accuracy: r.accuracy, headshots: r.headshots, timeAward: r.timeBonus },
      game.run.totals.score, false);
  } else if (game.state === 'allClear' && r) {
    const fn = game.run.round >= 2 ? Screens.drawSecondRoundClear : Screens.drawTotalResult;
    fn(ctx, { clearTime: game.run.playTime, accuracy: r.accuracy, headshots: game.run.totals.headshots, timeAward: r.timeBonus },
      game.run.totals.score);
  } else if (game.state === 'gameOver') {
    ctx.fillStyle = 'rgba(4,6,10,0.85)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff2f4a';
    ctx.font = '700 68px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W / 2, H * 0.45);
  }
  if (game.paused && game.state === 'play') {
    ctx.fillStyle = 'rgba(4,6,10,0.6)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '700 54px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, H / 2);
  }
}

function drawTitle() {
  ctx.fillStyle = '#35e0ff';
  ctx.font = '700 76px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CRISIS POINT', W / 2, 180);
  ctx.fillStyle = '#8fa6c4';
  ctx.font = '18px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('Twin-pedal cover rail shooter', W / 2, 218);

  const rows = [
    ['AIM / FIRE', 'Mouse'],
    ['PEDAL L', 'T  /  Shift  /  Right-click'],
    ['PEDAL R', 'Y  /  Ctrl'],
    ['RELOAD', 'Release both pedals'],
    ['SWITCH WEAPON', 'Q'],
    ['PAUSE / MUTE', 'P  /  M'],
  ];
  ctx.font = '17px "Segoe UI", system-ui, sans-serif';
  rows.forEach(([l, r], i) => {
    const y = 300 + i * 34;
    ctx.textAlign = 'right'; ctx.fillStyle = '#e6f1ff'; ctx.fillText(l, W / 2 - 24, y);
    ctx.textAlign = 'left'; ctx.fillStyle = '#ffb020'; ctx.fillText(r, W / 2 + 24, y);
  });
  ctx.textAlign = 'center';
  ctx.fillStyle = Math.sin(game.t * 4) > 0 ? '#35e0ff' : '#1d6d82';
  ctx.font = '700 26px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('PRESS ENTER TO START', W / 2, 600);
}

function drawCrosshair() {
  const { mx: x, my: y } = input;
  const hot = game.area && game.area.cover.exposure > TUNING.FIRE_EXPOSURE;
  ctx.strokeStyle = hot ? '#35e0ff' : 'rgba(140,160,190,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 26, y); ctx.lineTo(x - 8, y);
  ctx.moveTo(x + 8, y); ctx.lineTo(x + 26, y);
  ctx.moveTo(x, y - 26); ctx.lineTo(x, y - 8);
  ctx.moveTo(x, y + 8); ctx.lineTo(x, y + 26);
  ctx.stroke();
}

/* -------------------------------- loop -------------------------------- */

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

/* ------------------------------- debug -------------------------------- */

if (DEBUG) {
  // The pane does not composite when hidden, which freezes rAF. Pumping frames
  // by hand runs the same code path rather than a parallel rig.
  window.__tc = {
    step: (n = 1, dt = 1 / 60) => { for (let i = 0; i < n; i++) { update(dt); render(); } },
    input: (patch) => Object.assign(input, patch),
    goto: (stage, area = 0) => {
      if (!game.run) game.confirm();
      game.run.stageIndex = stage; game.run.areaIndex = area;
      startArea();
    },
    state: () => ({ state: game.state, stage: game.run?.stageIndex, area: game.run?.areaIndex,
                    lives: game.run?.lives, slot: game.area?.cover.slot,
                    exposure: game.area?.cover.exposure, enemies: game.area?.enemies.length }),
    progress: () => progressReport(),
    pack: () => coverage(game.pack),
  };
}

/* -------------------------------- boot -------------------------------- */

loadPack('./assets').then((pack) => { game.pack = pack; });
settings.difficulty = TC.DIFFICULTY_DEFAULT;
requestAnimationFrame(frame);
