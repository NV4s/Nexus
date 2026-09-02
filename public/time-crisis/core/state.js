// @ts-check
/**
 * Run state: lives, progression through areas and stages, and the tallies that
 * feed the result screens.
 *
 * The life count is an operator setting (PLAYER'S LIFE, range 1-9, default 3)
 * rather than a constant, so it reads from core/tune.js and is not hardcoded.
 *
 * Credits and the continue economy are deliberately out of scope — this runs in
 * a browser, not on a cabinet with a coin slot, and freeplay is the default.
 */

import { TC, settings } from './tune.js';
import { createRunTotals, accumulate } from '../sim/score.js';

export function createRun(stageOrder) {
  return {
    lives: Math.max(TC.LIFE_MIN, Math.min(TC.LIFE_MAX, settings.life)),
    maxLives: settings.life,
    stages: stageOrder,
    stageIndex: 0,
    areaIndex: 0,
    totals: createRunTotals(),
    /** per-stage tallies, reset at each stage boundary */
    stageTotals: createRunTotals(),
    state: 'playing',     // playing | areaClear | stageClear | gameOver | allClear
    playTime: 0,
    /** set once the whole run is finished, for the 2nd round condition */
    round: 1,
  };
}

export const currentStage = (run) => run.stages[run.stageIndex] || null;
export const currentArea = (run) => {
  const s = currentStage(run);
  return s ? s.areas[run.areaIndex] || null : null;
};

export const isFinalStage = (run) => run.stageIndex >= run.stages.length - 1;
export const isFinalArea = (run) => {
  const s = currentStage(run);
  return !!s && run.areaIndex >= s.areas.length - 1;
};

/** A life is lost. Returns true when that was the last one. */
export function loseLife(run) {
  run.lives = Math.max(0, run.lives - 1);
  if (run.lives === 0) {
    run.state = 'gameOver';
    return true;
  }
  return false;
}

/** Continue is out of scope, but restoring lives is how a run resumes. */
export function restoreLives(run) {
  run.lives = Math.max(TC.LIFE_MIN, Math.min(TC.LIFE_MAX, settings.life));
  run.state = 'playing';
  run.totals.continues++;
}

/**
 * Finish the current area, folding its score into both the stage and the run.
 * Returns what should happen next.
 */
export function finishArea(run, areaScore, result) {
  accumulate(run.totals, areaScore, result);
  accumulate(run.stageTotals, areaScore, result);
  run.playTime += result.clearTime || 0;

  if (!isFinalArea(run)) {
    run.state = 'areaClear';
    return 'areaClear';
  }
  run.state = isFinalStage(run) ? 'allClear' : 'stageClear';
  return run.state;
}

/** Advance past a cleared area or stage. */
export function advance(run) {
  if (run.state === 'areaClear') {
    run.areaIndex++;
    run.state = 'playing';
    return 'area';
  }
  if (run.state === 'stageClear') {
    run.stageIndex++;
    run.areaIndex = 0;
    run.stageTotals = createRunTotals();
    run.state = 'playing';
    return 'stage';
  }
  return null;
}

/**
 * Begin a second round. The symbol table carries Is2ndRound, GoToSecondRound
 * and SetAllClear, so the loop exists; its exact difficulty scaling was never
 * observed, so the harder settings here are invented and marked.
 */
export function startSecondRound(run) {
  if (run.state !== 'allClear') return false;
  run.round++;
  run.stageIndex = 0;
  run.areaIndex = 0;
  run.stageTotals = createRunTotals();
  run.state = 'playing';
  // INVENTED: never observed. A second loop that played identically would be
  // pointless, so difficulty steps up one notch and stops at the hardest.
  settings.difficulty = Math.min(4, settings.difficulty + 1);
  return true;
}

export const hasCompletedAllStages = (run) => run.state === 'allClear';

export function selfTest(ok) {
  const stages = [
    { stage: 1, areas: [{ id: '1-0' }, { id: '1-1' }] },
    { stage: 2, areas: [{ id: '2-0' }] },
  ];
  const res = { clearTime: 30, accuracy: 0.5, kills: 3 };

  settings.life = 3;
  const r = createRun(stages);
  ok('a run starts on the operator life setting', r.lives === 3);
  ok('a run starts at the first area of the first stage',
    r.stageIndex === 0 && r.areaIndex === 0);
  ok('current area resolves', currentArea(r).id === '1-0');
  ok('the first area is not the final one', isFinalArea(r) === false);

  // The life setting is an operator value, not a constant.
  settings.life = 5;
  ok('a different life setting is honoured', createRun(stages).lives === 5);
  settings.life = 99;
  ok('a life setting above the range is clamped', createRun(stages).lives === TC.LIFE_MAX);
  settings.life = 3;

  // Clearing areas walks the stage.
  const s = { total: 100, shots: 4, hits: 2, kills: 3, headshots: 0, bullseyes: 0,
              sideAttacks: 0, oneShotKills: 0, shurikens: 0, maxLink: 2, byWeapon: {} };
  ok('clearing a mid-stage area asks to advance',
    finishArea(r, s, res) === 'areaClear');
  ok('advancing moves to the next area', advance(r) === 'area' && r.areaIndex === 1);
  ok('the last area of a stage clears the stage',
    (isFinalArea(r) && finishArea(r, s, res) === 'stageClear'));
  ok('advancing a stage resets the area index',
    advance(r) === 'stage' && r.stageIndex === 1 && r.areaIndex === 0);

  // Finishing the last area of the last stage is All Clear, not a stage clear.
  ok('the final stage is recognised', isFinalStage(r) === true);
  ok('clearing the final area is an all clear', finishArea(r, s, res) === 'allClear');
  ok('all clear is reported', hasCompletedAllStages(r) === true);

  // Totals accumulate across the run, and reset per stage.
  const r2 = createRun(stages);
  finishArea(r2, s, res);
  ok('run totals accumulate', r2.totals.areas.length === 1);
  ok('stage totals accumulate too', r2.stageTotals.areas.length === 1);
  advance(r2);
  finishArea(r2, s, res);
  advance(r2);
  ok('run totals carry across a stage boundary', r2.totals.areas.length === 2);
  ok('stage totals reset at a stage boundary', r2.stageTotals.areas.length === 0);
  ok('play time accumulates', r2.playTime === 60);

  // Lives.
  const r3 = createRun(stages);
  ok('losing one life is not fatal', loseLife(r3) === false && r3.lives === 2);
  loseLife(r3);
  ok('losing the last life ends the run', loseLife(r3) === true && r3.state === 'gameOver');
  ok('lives never go negative', (loseLife(r3), r3.lives === 0));
  restoreLives(r3);
  ok('restoring lives resumes play', r3.state === 'playing' && r3.lives === 3);
  ok('a restore is counted', r3.totals.continues === 1);

  // Second round.
  const r4 = createRun(stages);
  ok('a second round cannot start mid-run', startSecondRound(r4) === false);
  r4.state = 'allClear';
  settings.difficulty = 2;
  ok('a second round starts from an all clear', startSecondRound(r4) === true);
  ok('it returns to the first stage', r4.stageIndex === 0 && r4.areaIndex === 0);
  ok('the round counter increments', r4.round === 2);
  ok('the second round is harder', settings.difficulty === 3);
  settings.difficulty = 4;
  r4.state = 'allClear';
  startSecondRound(r4);
  ok('difficulty stops at the hardest setting', settings.difficulty === 4);
  settings.difficulty = TC.DIFFICULTY_DEFAULT;
}
