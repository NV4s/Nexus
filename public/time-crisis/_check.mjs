const mods = ['core/rng.js','core/tune.js','content/enemies.js','content/weapons.js',
              'content/progress.js','sim/cover.js','sim/camera.js','sim/brains.js',
              'sim/enemy.js','sim/score.js','sim/combat.js','sim/script.js'];
let pass=0, fail=0; const fails=[];
for (const m of mods) {
  const mod = await import('./' + m);
  if (!mod.selfTest) { console.log('NO SELFTEST ' + m); continue; }
  mod.selfTest((name, cond) => { if (cond) pass++; else { fail++; fails.push(m+': '+name); } });
}
console.log(`${pass} passed, ${fail} failed`);
fails.forEach(f => console.log('  FAIL ' + f));
