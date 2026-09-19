// @ts-check
/**
 * Synthesised audio. No files, no fetches, no dependencies.
 *
 * Every cue is generated from an oscillator and a gain envelope at play time,
 * which is why this ships as a few kilobytes of maths rather than megabytes of
 * samples. That matters for where this runs: a locked-down network that blocks
 * asset hosts still loads the whole game, because there is nothing to load.
 *
 * The cue LIST is taken from the arcade build's own Wwise event names — the
 * bank manifest is plain text, so the vocabulary of what makes a sound and when
 * is recoverable even though the audio itself is not. Shot per weapon, reload,
 * hit, headshot, armour hit, shield break, player damage, countdown, the last
 * ten seconds, weapon change, area clear.
 *
 * Specs are pure data so they can be asserted without an AudioContext.
 */

/**
 * @typedef {{
 *   type: OscillatorType,
 *   from: number, to: number,
 *   gain: number, dur: number,
 *   sweep?: 'exp'|'lin',
 *   noise?: boolean,
 * }} Layer
 */

/** Each cue is one or more layers played together. */
export const SOUNDS = {
  /* --- player weapons --- */
  'shot.handgun':    [{ type: 'square',   from: 320, to: 60,  gain: 0.16, dur: 0.09 }],
  'shot.machinegun': [{ type: 'square',   from: 260, to: 70,  gain: 0.12, dur: 0.06 }],
  'shot.shotgun':    [{ type: 'sawtooth', from: 200, to: 40,  gain: 0.20, dur: 0.16 },
                      { type: 'square',   from: 900, to: 120, gain: 0.08, dur: 0.09 }],
  'shot.grenade':    [{ type: 'triangle', from: 160, to: 50,  gain: 0.18, dur: 0.20 }],
  'shot.rocket':     [{ type: 'sawtooth', from: 140, to: 44,  gain: 0.20, dur: 0.26 }],
  'shot.mounted':    [{ type: 'square',   from: 220, to: 64,  gain: 0.13, dur: 0.05 }],
  'shot.sniper':     [{ type: 'square',   from: 480, to: 70,  gain: 0.22, dur: 0.22 }],
  'shot.empty':      [{ type: 'square',   from: 90,  to: 90,  gain: 0.07, dur: 0.05 }],
  reload:            [{ type: 'square',   from: 520, to: 620, gain: 0.08, dur: 0.08 }],
  'weapon.change':   [{ type: 'triangle', from: 400, to: 780, gain: 0.10, dur: 0.12 }],

  /* --- hits --- */
  'hit.body':        [{ type: 'sawtooth', from: 180, to: 40,  gain: 0.14, dur: 0.18 }],
  'hit.head':        [{ type: 'triangle', from: 880, to: 220, gain: 0.18, dur: 0.16 }],
  'hit.armor':       [{ type: 'square',   from: 300, to: 240, gain: 0.10, dur: 0.07 }],
  'hit.bullseye':    [{ type: 'triangle', from: 1200, to: 600, gain: 0.16, dur: 0.20 }],
  'shield.break':    [{ type: 'sawtooth', from: 620, to: 120, gain: 0.16, dur: 0.26 }],
  'enemy.down':      [{ type: 'sawtooth', from: 150, to: 45,  gain: 0.12, dur: 0.24 }],

  /* --- the player getting hit --- */
  'player.damage':   [{ type: 'sawtooth', from: 140, to: 50,  gain: 0.22, dur: 0.40 }],
  'player.redHit':   [{ type: 'square',   from: 200, to: 60,  gain: 0.24, dur: 0.44 }],

  /* --- system --- */
  countdown:         [{ type: 'square',   from: 1200, to: 1200, gain: 0.09, dur: 0.10 }],
  'countdown.last10':[{ type: 'square',   from: 1500, to: 1500, gain: 0.11, dur: 0.09 }],
  'danger.signal':   [{ type: 'square',   from: 900, to: 640, gain: 0.12, dur: 0.18 }],
  'area.clear':      [{ type: 'triangle', from: 440, to: 880, gain: 0.16, dur: 0.50 }],
  'stage.clear':     [{ type: 'triangle', from: 330, to: 990, gain: 0.18, dur: 0.80 }],
  success:           [{ type: 'triangle', from: 660, to: 1320, gain: 0.16, dur: 0.36 }],
  failed:            [{ type: 'sawtooth', from: 400, to: 110, gain: 0.16, dur: 0.44 }],
  select:            [{ type: 'square',   from: 700, to: 700, gain: 0.08, dur: 0.05 }],
  decide:            [{ type: 'triangle', from: 520, to: 1040, gain: 0.12, dur: 0.14 }],
  item:              [{ type: 'triangle', from: 700, to: 1400, gain: 0.13, dur: 0.18 }],
};

/** Which cue a weapon's shot uses. */
export function shotCue(weaponShort) {
  const map = {
    HG: 'shot.handgun', MG: 'shot.machinegun', SG: 'shot.shotgun',
    GL: 'shot.grenade', RL: 'shot.rocket', HMG: 'shot.mounted', SPR: 'shot.sniper',
    MSL: 'shot.rocket',
  };
  return map[weaponShort] || 'shot.handgun';
}

/** Which cue a hit uses, from the resolved zone. */
export function hitCue(zone, shielded, bullseye) {
  if (shielded) return 'hit.armor';
  if (bullseye) return 'hit.bullseye';
  if (zone === 'head') return 'hit.head';
  return 'hit.body';
}

/* ------------------------------------------------------------------ *
 * Playback. The only part that needs a browser.
 * ------------------------------------------------------------------ */

let ctx = null;
let muted = false;

export function initAudio(AudioCtor) {
  const Ctor = AudioCtor || globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
  return ctx;
}

export const setMuted = (v) => { muted = !!v; };
export const isMuted = () => muted;

/** Play a cue by name. Silently does nothing before init or while muted. */
export function play(name, volume = 1) {
  if (muted || !ctx) return false;
  const spec = SOUNDS[name];
  if (!spec) return false;

  const now = ctx.currentTime;
  for (const layer of spec) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = layer.type;
    osc.frequency.setValueAtTime(layer.from, now);
    if (layer.to !== layer.from) {
      // Exponential ramps cannot reach zero, so the floor is clamped.
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, layer.to), now + layer.dur);
    }
    gain.gain.setValueAtTime(layer.gain * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + layer.dur);
    osc.start(now);
    osc.stop(now + layer.dur + 0.02);
  }
  return true;
}

export function selfTest(ok) {
  const names = Object.keys(SOUNDS);
  ok('the recovered cue vocabulary is covered', names.length >= 28);
  ok('every cue has at least one layer',
    names.every((n) => Array.isArray(SOUNDS[n]) && SOUNDS[n].length > 0));
  ok('every layer names a real oscillator type',
    names.every((n) => SOUNDS[n].every((l) =>
      ['sine', 'square', 'sawtooth', 'triangle'].includes(l.type))));
  ok('every layer has a positive duration and gain',
    names.every((n) => SOUNDS[n].every((l) => l.dur > 0 && l.gain > 0)));
  ok('every frequency stays above zero, so an exponential ramp is legal',
    names.every((n) => SOUNDS[n].every((l) => l.from > 0 && l.to > 0)));
  ok('no cue is loud enough to clip on its own',
    names.every((n) => SOUNDS[n].reduce((s, l) => s + l.gain, 0) <= 0.4));
  ok('no cue outlasts a second, so nothing overlaps itself',
    names.every((n) => SOUNDS[n].every((l) => l.dur <= 1.0)));

  // Every weapon must map to a cue, or firing is silent.
  ok('every weapon short code maps to a cue',
    ['HG', 'MG', 'SG', 'GL', 'RL', 'HMG', 'SPR', 'MSL']
      .every((s) => !!SOUNDS[shotCue(s)]));
  ok('an unknown weapon still makes a sound', shotCue('???') === 'shot.handgun');

  // Hit cues discriminate, or every hit sounds the same.
  ok('a headshot sounds different from a body shot',
    hitCue('head') !== hitCue('body'));
  ok('a shielded hit sounds like armour', hitCue('body', true) === 'hit.armor');
  ok('a bullseye has its own cue', hitCue('head', false, true) === 'hit.bullseye');
  ok('shield takes priority over bullseye', hitCue('head', true, true) === 'hit.armor');
  ok('every hit cue exists', ['hit.body', 'hit.head', 'hit.armor', 'hit.bullseye']
    .every((c) => !!SOUNDS[c]));

  // The last-ten-seconds callout is a distinct cue in the arcade bank.
  ok('the countdown and its final ten seconds differ',
    SOUNDS.countdown[0].from !== SOUNDS['countdown.last10'][0].from);

  // Playback must be safe before init and while muted.
  ok('playing before init is a no-op, not a crash', play('reload') === false);
  ok('an unknown cue is refused', play('nope.nothing') === false);

  // A tiny stub context proves the graph is wired without a browser.
  const made = { osc: 0, gain: 0, started: 0 };
  const node = () => ({
    connect() {}, start() { made.started++; }, stop() {},
    frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
    gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
    type: '',
  });
  class StubCtx {
    constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; }
    createOscillator() { made.osc++; return node(); }
    createGain() { made.gain++; return node(); }
  }
  initAudio(StubCtx);
  ok('a cue builds an oscillator and a gain per layer',
    play('shot.shotgun') === true && made.osc === 2 && made.gain === 2);
  ok('every oscillator is started', made.started === 2);

  setMuted(true);
  const before = made.osc;
  ok('muting silences playback', play('reload') === false && made.osc === before);
  setMuted(false);
  ok('unmuting restores it', isMuted() === false && play('reload') === true);
}
