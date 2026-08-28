/**
 * Decoder check:  node --test scripts/sol.test.ts
 *
 * Every fixture below is a real .sol written by Flash, taken from the test suite
 * of ruffle-rs/rust-flash-lso. That matters: a fixture built by an encoder I also
 * wrote would faithfully reproduce my own bugs, and AMF3's reference tables fail
 * silently — a misplaced push returns plausible data with every later key wrong
 * rather than raising anything.
 *
 * Node 26 strips the types, so this runs with no dependencies and no test
 * framework.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeSol, toDisplay, type SolValue } from '../src/lib/sol.ts';

const FIXTURES: Record<string, string> = {
  "AS2-Number-Demo.sol":
    "AL8AAAAyVENTTwAEAAAAAAAPQVMyLU51bWJlci1EZW1vAAAAAAAHbXlGbG9hdABACSH7VEQtGAA=",
  "AS2-ECMAArray-Demo.sol":
    "AL8AAAEFVENTTwAEAAAAAAASQVMyLUVDTUFBcnJheS1EZW1vAAAAAAAKaG9sZXlBcnJheQgAAAAPAAAJAAAKZW1wdHlBcnJheQgAAAAAAAAJAAALaG9sZXlBcnJheTIIAAAAAgABMQIAA29uZQAACQAACm1peGVkQXJyYXkIAAAAAgABMAIABWZpcnN0AAExAgAGc2Vjb25kAAlwcm9wZXJ0eUECAARhYWFhAAAJAAANbXlTdHJpbmdBcnJheQgAAAAAAANvbmUCAARlaW5zAAN0d28CAAR6d2VpAAAJAAAKZGVuc2VBcnJheQgAAAACAAEwAgAFZmlyc3QAATECAAZzZWNvbmQAAAkA",
  "AS2-TypedObject-Demo.sol":
    "AL8AAABdVENTTwAEAAAAAAAUQVMyLVR5cGVkT2JqZWN0LURlbW8AAAAAAA1teVR5cGVkT2JqZWN0EAAPQVMyU29sVGVzdENsYXNzAANmb28CAAxjaGFuZ2VkIHByb3AAAAkA",
  "AS2-Date-Demo.sol":
    "AL8AAAAxVENTTwAEAAAAAAANQVMyLURhdGUtRGVtbwAAAAAABm15RGF0ZQtCdINeOiXgAADwAA==",
  "AS3-Array-Demo.sol":
    "AL8AAAAzVENTTwAEAAAAAAAOQVMzLUFycmF5LURlbW8AAAADFW15SW50QXJyYXkJBwEEAQQCBAMA",
  "AS3-ByteArray-Demo.sol":
    "AL8AAAA/VENTTwAEAAAAAAASQVMzLUJ5dGVBcnJheS1EZW1vAAAAAxdteUJ5dGVBcnJheQwdAAxIZWxsbyBXb3JsZCEA",
  "AS3-Integer-Demo.sol":
    "AL8AAAApVENTTwAEAAAAAAAQQVMzLUludGVnZXItRGVtbwAAAAMLbXlJbnQEBwA=",
  "StringTest.sol":
    "AL8AAAEJVENTTwAEAAAAAAAKU3RyaW5nVGVzdAAAAAMNZXhpc3RzAwAhdGVzdEZvclRoaXJkSXRlbQYtVGhpcyBpcyB0aGUgdGhpcmQgaXRlbQARZGljdEl0ZW0RAwAGIXRlc3RGb3JGaXJzdEl0ZW0GLVRoaXMgaXMgdGhlIGZpcnN0IGl0ZW0AE2FycmF5SXRlbQk9AQYKBi9UaGlzIGlzIHRoZSBzZWNvbmQgaXRlbQYEBgoGDgYEBgoGDgYEBgoGDgYEBgoGDgYEBgoGDgYEBgoGDgYEBgoGDgYEBgoGDgYEBgoGDgYEABVvYmplY3RJdGVtCgsBI3Rlc3RGb3JTZWNvbmRJdGVtBg4BAA==",
};

const decode = (name: string) =>
  decodeSol(Uint8Array.from(atob(FIXTURES[name]), (c) => c.charCodeAt(0)));

test('AMF0: primitives', () => {
  const file = decode('AS2-Number-Demo.sol');
  assert.equal(file.error, undefined);
  assert.equal(file.amf, 0);
  assert.equal(file.name, 'AS2-Number-Demo');
  assert.equal(file.data.myFloat, Math.PI);
});

test('AMF0: a date keeps its epoch milliseconds', () => {
  const file = decode('AS2-Date-Demo.sol');
  assert.equal(file.error, undefined);
  assert.deepEqual(file.data.myDate, { $date: 1409653383774 });
});

test('AMF0: a typed object drops its class name and keeps its properties', () => {
  const file = decode('AS2-TypedObject-Demo.sol');
  assert.equal(file.error, undefined);
  assert.deepEqual(file.data.myTypedObject, { foo: 'changed prop' });
});

test('AMF0: an ECMA array decodes to an object, holes and all', () => {
  const file = decode('AS2-ECMAArray-Demo.sol');
  assert.equal(file.error, undefined);
  // Sparse: index 0 is genuinely absent. As a JS array this would gain a hole
  // and a length of 2, which is a value the game never stored.
  assert.deepEqual(file.data.holeyArray2, { 1: 'one' });
  // Mixed: index-like and named keys live side by side.
  assert.deepEqual(file.data.mixedArray, { 0: 'first', 1: 'second', propertyA: 'aaaa' });
  assert.deepEqual(file.data.emptyArray, {});
});

test('AMF3: integers and arrays', () => {
  const ints = decode('AS3-Integer-Demo.sol');
  assert.equal(ints.error, undefined);
  assert.equal(ints.amf, 3);
  assert.equal(ints.data.myInt, 7);

  const array = decode('AS3-Array-Demo.sol');
  assert.equal(array.error, undefined);
  assert.deepEqual(array.data.myIntArray, [1, 2, 3]);
});

test('AMF3: a byte array is reduced to its length', () => {
  const file = decode('AS3-ByteArray-Demo.sol');
  assert.equal(file.error, undefined);
  assert.deepEqual(file.data.myByteArray, { $bytes: 14 });
});

test('AMF3: the string table survives repeated strings', () => {
  // This file ends in a Dictionary, which is deliberately unsupported — but the
  // pairs before it must still decode, and their keys prove the table did not
  // drift. A shifted table would return different keys without erroring.
  const file = decode('StringTest.sol');
  assert.deepEqual(Object.keys(file.data), ['exists', 'testForThirdItem']);
  assert.match(file.error ?? '', /marker 0x11/);
});

test('an unsupported type stops the walk without throwing', () => {
  const file = decode('StringTest.sol');
  assert.ok(file.error, 'error is reported rather than raised');
  assert.ok(Object.keys(file.data).length > 0, 'pairs read before the stop are kept');
});

test('truncation never throws and never invents data', () => {
  const full = Uint8Array.from(atob(FIXTURES['AS2-ECMAArray-Demo.sol']), (c) => c.charCodeAt(0));
  const whole = decodeSol(full);
  assert.equal(whole.error, undefined);

  for (let cut = 1; cut < full.length; cut++) {
    const partial = decodeSol(full.subarray(0, cut));

    // The contract is that it returns rather than raises. Cutting exactly at the
    // header boundary is not an error — there is simply nothing after it — so
    // the invariant is about the data, not about always reporting a problem.
    assert.doesNotThrow(() => decodeSol(full.subarray(0, cut)));

    for (const [key, value] of Object.entries(partial.data)) {
      assert.ok(key in whole.data, `truncating to ${cut} invented the key ${key}`);
      // A pair that survived the cut must match the full decode exactly.
      assert.deepEqual(value, whole.data[key], `truncating to ${cut} changed ${key}`);
    }
  }
});

test('garbage is rejected rather than parsed', () => {
  assert.match(decodeSol(new Uint8Array(0)).error ?? '', /truncated|not a .sol/);
  assert.match(decodeSol(new Uint8Array(64)).error ?? '', /not a .sol/);
});

test('toDisplay survives a cycle and repeats a shared value', () => {
  const shared = { n: 1 };
  const cyclic: Record<string, unknown> = { shared, also: shared };
  cyclic.self = cyclic;
  const shown = toDisplay(cyclic as never) as Record<string, unknown>;
  assert.equal(shown.self, '[circular]');
  // Referenced twice without a cycle: both must render, not be flagged.
  assert.deepEqual(shown.shared, { n: 1 });
  assert.deepEqual(shown.also, { n: 1 });
});

/* ---------- save rules ---------- */

const { passes } = await import('../src/data/saveRules.ts');

test('rule operators are total and type-aware', () => {
  // Missing path never matches, whatever the test says.
  assert.equal(passes({ path: 'x', test: { atLeast: 1 } }, undefined), false);

  assert.equal(passes({ path: 'x', test: { atLeast: 12 } }, 12), true);
  assert.equal(passes({ path: 'x', test: { atLeast: 12 } }, 11), false);
  // A numeric threshold against a string must not coerce: '13' > 12 is a lie.
  assert.equal(passes({ path: 'x', test: { atLeast: 12 } }, '13'), false);

  assert.equal(passes({ path: 'x', test: { equals: true } }, true), true);
  assert.equal(passes({ path: 'x', test: { equals: 'gold' } }, 'gold'), true);
  assert.equal(passes({ path: 'x', test: { equals: 1 } }, true), false);

  assert.equal(passes({ path: 'x', test: { includes: 'gold' } }, ['silver', 'gold']), true);
  assert.equal(passes({ path: 'x', test: { includes: 'gold' } }, 'gold'), false);

  assert.equal(passes({ path: 'x', test: { countAtLeast: 2 } }, [1, 2]), true);
  assert.equal(passes({ path: 'x', test: { countAtLeast: 3 } }, [1, 2]), false);

  // No test means "exists and is truthy".
  assert.equal(passes({ path: 'x' }, 1), true);
  assert.equal(passes({ path: 'x' }, 0), false);
  assert.equal(passes({ path: 'x' }, null), false);
});


/* ---------- the one real per-game mapping ---------- */

// A genuine Madness: Project Nexus arena save. The rules in data/saveRules.ts were
// written from this exact file, so if its field names ever stop matching, that is
// the mapping breaking — which is the failure this guards, because a rule that
// matches nothing raises no error and simply never unlocks.
const MADNESS_SAVE =
  'AL8AAA7zVENTTwAEAAAAAAARYXJlbmFNYWRuZXNzR2FtZTIAAAAAAAloYXZlU2F2ZWQBAQAACmRhdGFUZXN0ZXICABVGSUxFIElOVEVHUklUWSBJTlRBQ1QAAAZteUNhc2gAQc3NZP+AAAAAAAp0ZWFtTGVhZGVyAwAPcGVya1Nob3RndW5ST0YyAQAADnBlcmtLbm9ja2Rvd24xAQAABW15SGF0CAAAAAEAATAGAAAJAA5wZXJrQmxvY2tCcmVhawEAAAx0cmFpdEJyYXZlcnkAP/AAAAAAAAAAB215TW91dGgIAAAAAQABMAYAAAkAE3BlcmtNZWxlZVBpc3RvbFdoaXABAAARcGVya1Nob3RndW5EYW1hZ2UBAAAGbXlNYXNrCAAAAAEAATAGAAAJAA9mYXN0RGV0ZXJpb3JhdGUBAAAJZmFzdERlYXRoAQAAD3BlcmtNZWxlZU1vdmVzMgEAABJ0cmFpdFRyaWdnZXJGaW5nZXIAP/AAAAAAAAAADHBlcmtTaWRlYXJtMQEAAAhteVNsb3dNbwAAAAAAAAAAAAAIc2xhbUdyYWIBAAAOcGVya0tub2NrZG93bjIBAAAPcGVya01lbGVlRGlzYXJtAQAADnRyYWl0QXdhcmVuZXNzAEAQAAAAAAAAAAdteVNoaXJ0CAAAAAEAATAGAAAJAA9wZXJrTWVsZWVNb3ZlczMBAAAGbXlEYXNoAD/0zMzMzMzNAA1wZXJrU3R1bkRhc2gxAQAACnBlcmtEb2RnZTEBAAALZ3JhYkJyZWFrZXIBAAAKd2Vha1RvRGFzaAEAABFwZXJrVW5hcm1lZE1vdmVzMQEAAA9wZXJrQnVsbGV0VGltZTIBAAARcGVya1JpZmxlQWNjdXJhY3kBAAAHbXlXaWR0aABASQAAAAAAAAAKc3Ryb25nR3JpcAEAAA9wZXJrTWVsZWVNb3ZlczQBAAAHbm9SYW5nZQEAAAdzdGF0RU5EAAAAAAAAAAAAAApwZXJrRG9kZ2UyAQAAD3BlcmtBcm1vclBpZXJjZQEAAAtwZXJrUmVsb2FkMQEAAApwZXJrQmxvY2syAQAAD3BlcmtNZWxlZU1vdmVzMQEAAAhteVJlbG9hZABAWAAAAAAAAAAQdHJhaXRDb21iYXRTa2lsbAA/8AAAAAAAAAAPcGVya1JpZmxlUmVsb2FkAQAADWhpdFN0b3BBdHRhY2sBAAAIYm9keVR5cGUCAANjaXYAEXBlcmtVbmFybWVkTW92ZXMzAQAAC3BlcmtUYWNCYXIxAQAAB3N0YXRTVFIAAAAAAAAAAAAAC3BlcmtMb3dBY2MxAQAACGFtWm9tYmllAQAAB3N0YXRERVgAAAAAAAAAAAAACW15VW5hcm1lZAMAB3R3b0hhbmQBAAAHbXlSYW5nZQBAV8AAAAAAAAAGbXlUeXBlAgAHdW5hcm1lZAAKbXlQaWVyY2luZwAAAAAAAAAAAAAFbWVsZWUBAQAIbXlEYW1hZ2UAQAAAAAAAAAAAB215U2hvdHMAP/AAAAAAAAAABW15Q2F0AgAFbWVsZWUADG15RGFtYWdlVHlwZQIABXB1bmNoAAZteU5hbWUCAAdVbmFybWVkAAVteVJPRgBAPgAAAAAAAAAGbXlBbW1vAD/wAAAAAAAAAAVteVRhZwIAB1VuYXJtZWQACG15Q2FzaW5nAgAGc3BhcmsxAAhteVNwcmVhZABACAAAAAAAAAAACQALcGVya0xvd0FjYzIBAAARcGVya1Nob3RndW5TaG90czEBAAALbm9IZWFkc2hvdHMBAAAQcGVya1Bpc3RvbFJlbG9hZAEAAApwZXJrQmxvY2sxAQAAEXBlcmtVbmFybWVkTW92ZXMyAQAADnBlcmtQaXN0b2xST0YxAQAADnBlcmtDb3ZlclNob290AQAAB25vRG9kZ2UBAAAPdHJhaXREaXN0cmFjdGVkAEAgAAAAAAAAAApwZXJrRG9kZ2UzAQAACGF1dG9EYXNoAQAACGhlYWRUeXBlAgADY2l2ABFwZXJrVW5hcm1lZFNwZWVkMQEAAAlhdXRvQXdhcmUBAAAKYm9keVdvdW5kcwgAAAAAAAAJAAhteUhlaWdodABAV4AAAAAAAAARcGVya1VuYXJtZWRTcGVlZDIBAAALbXlDaGFyYWN0ZXICAANjaXYACnBlcmtBcm1vcjIBAAAKc2tpbGxNZWxlZQAAAAAAAAAAAAALbm9XaWVsZEd1bnMBAAAGYW1BYm9tAQAAC3NraWxsUGlzdG9sAAAAAAAAAAAAAAhzdGF0TEVBRAAAAAAAAAAAAAATcGVya1Bpc3RvbEFjY3VyYWN5MgEAAA1za2lsbFJldm9sdmVyAAAAAAAAAAAAAAt3ZWFwb25BcnJheQgAAAADAAEwAgADcHBrAAExAgAHYmVyZXR0YQABMgIAB2dsb2NrMjAAAAkACnRyYWl0Q292ZXIAP/AAAAAAAAAAB3N0YXRBV1IAAAAAAAAAAAAADXBlcmtTdHVuRGFzaDIBAAAHc3RhdFRBQwAAAAAAAAAAAAAOcGVya1Bpc3RvbFJPRjIBAAARcGVya1VuYXJtZWRTcGVlZDMBAAAXcGVya1Bpc3RvbEVmZmVjdGl2ZW5lc3MBAAALcGVya1RhY0JhcjIBAAALcGVya1NNR0FpbTEBAAAKcGVya0FybW9yMQEAAAxhbUludmluY2libGUBAAAIc2tpbGxTTUcAAAAAAAAAAAAACG5vWm9tYmllAQAADHNraWxsU2hvdGd1bgAAAAAAAAAAAAAKaGVhZFdvdW5kcwgAAAAAAAAJAAdteURlcHRoAEAwAAAAAAAAAAxza2lsbFVuYXJtZWQAAAAAAAAAAAAACW15SWNvblBvcwA/8AAAAAAAAAANbXlTaG9vdEhlaWdodABASQAAAAAAAAAHbm9IYW5kcwEAAAhmcmVha091dAEAAAdteVNjYWxlAD/wAAAAAAAAABJteU5hdHVyYWxBcm1vckhlYWQAAAAAAAAAAAAACW5vQ29sbGlkZQEAABJteU5hdHVyYWxBcm1vckJvZHkAAAAAAAAAAAAAC21lbGVlSGVhbHRoAEAIAAAAAAAAAA5wZXJrU3R1blByb29mMQEAAAZteU5hbWUCAANBY2UABmFtU2xvdwEAAA5tb2RIdXJ0VGFjdGljcwA/8AAAAAAAAAAIYW1FdmFkZXIBAAALYnVsbGV0RWF0ZXIBAAAKcGVya0FybW9yMwEAAApza2lsbFJpZmxlAAAAAAAAAAAAAA1wZXJrU01HUmVsb2FkAQAADWltcHJvdmVkQ2h1bXABAAAEbXlYUAAAAAAAAAAAAAAKc2tpbGxIZWF2eQAAAAAAAAAAAAAKc3RhbmRTdGlsbAEAAAZteUJvc3MCAAAAEHBlcmtJbW11bmVMb3dEbWcBAAAPcGVya0ZlYXJNb25nZXIxAQAAEHBlcmtTTUdUYWNEYW1hZ2UBAAAOcGVya1N0dW5Qcm9vZjIBAAAOcGVya1RlYW1Cb251czIBAAAHbXlLaWxscwAAAAAAAAAAAAAMbXlIZWFkSGVpZ2h0AEBJAAAAAAAAAAtza2lsbFBvaW50cwAAAAAAAAAAAAAHbXlXYXZlcwAAAAAAAAAAAAAPcGVya0ZlYXJNb25nZXIzAQAAC21vZFJlY2hhcmdlAD/wAAAAAAAAAA9wZXJrRmVhck1vbmdlcjIBAAAIbW9kU3BlZWQAP/AAAAAAAAAADnBlcmtUZWFtQm9udXMzAQAADnBlcmtUZWFtQm9udXMxAQAAC3BlcmtTTUdBaW0yAQAACWFtU3BlY2lhbAEBAA1rbm9ja2Rvd25EYXNoAQAABm1vZERtZwA/8AAAAAAAAAAScGVya1JpZmxlVGFjRGFtYWdlAQAAC3Rocm93bkJsb2NrAQAACnN0YXRQb2ludHMAAAAAAAAAAAAADXdlYXBvblN0ZWFsZXIBAAAIbXlIZWFsdGgAQDEAAAAAAAAAEWhlYWRHZWFyUmVzdXJyZWN0AQAAD3BlcmtSaWZsZVJhbmdlMQEAABFwZXJrSGVhZHNob3RDcml0cwEAAAdteUFjY2VsAD/0AAAAAAAAAAxtb2RBbGx5U21hcnQAP/AAAAAAAAAAB215U3BlZWQAQBMzMzMzMzMACXNlbGZTaG9vdAEAAAdteUJsb29kAgADcmVkAAhtb2RBcm1vcgA/8AAAAAAAAAAPcGVya0J1bGxldFRpbWUxAQAADHBlcmtTTUdSYW5nZQEAAA9wZXJrUmlmbGVSYW5nZTIBAAAPcGVya0J1bGxldFRpbWUzAQAAC215SGVhbHRoTWF4AEAxAAAAAAAAAA9wZXJrQnVsbGV0VGltZTQBAAAHYXV0b0hpdAEAABNwZXJrUGlzdG9sQWNjdXJhY3kxAQAADG15VGFjdGljc01heAAAAAAAAAAAAAAIZm9vdFR5cGUCAANjaXYAC3BlcmtMb3dBY2MzAQAACGhhbmRUeXBlAgADY2l2AAtteVNsb3dNb01heABAeQAAAAAAAAAPcGVya1Nob3RndW5ST0YxAQAAB25vUGFpbnQBAAAKbm9BaW1TaG90cwEAABZwZXJrUmlmbGVFZmZlY3RpdmVuZXNzAQAACW15VGFjdGljcwAAAAAAAAAAAAARcGVya1Nob3RndW5SZWxvYWQBAAAIbW9kUmFuZ2UAAAAAAAAAAAAACW15V2VhcG9ucwgAAAACAAEwBgABMQYAAAkAEXBlcmtTaG90Z3VuU2hvdHMyAQAADmF0dGFja05ldXRyYWxzAQAACG1lbGVlU2h5AQAACmRpc2FybUhlbG0BAAAHbXlMZXZlbAA/8AAAAAAAAAAACQAAD215QWN0aXZlTWVtYmVycwgAAAAAAAAJAAALY3VycmVudFdhdmUAP/AAAAAAAAAAAA1teVdlYXBvbnNMaXN0CAAAAAAAAAkAABFteUluYWN0aXZlTWVtYmVycwgAAAAAAAAJAAAKYXJlbmFXYXZlcwAAAAAAAAAAAAAACmFyZW5hS2lsbHMAAAAAAAAAAAAAAAhuZXdBcmVuYQEBAAALbXlBcm1vckxpc3QIAAAAAAAACQA=';

test('Madness rules match a real arena save', async () => {
  const { SAVE_RULES, passes } = await import('../src/data/saveRules.ts');
  const save = decodeSol(Uint8Array.from(atob(MADNESS_SAVE), (c) => c.charCodeAt(0)));
  assert.equal(save.error, undefined);
  assert.equal(save.name, 'arenaMadnessGame2');

  const at = (path: string): SolValue | undefined =>
    path
      .split('.')
      .reduce<SolValue | undefined>(
        (node, key) =>
          node && typeof node === 'object' ? (node as Record<string, SolValue>)[key] : undefined,
        save.data as SolValue,
      );

  const rules = SAVE_RULES['madness-project-nexus-classic'];
  assert.ok(rules, 'MPN Classic has rules');

  // Every path describing arena state must exist in a real arena save. A typo
  // would never throw — it would quietly never unlock, which is the whole hazard.
  for (const id of ['arena-wave-10', 'custom-char', 'arena-kills-100', 'rich']) {
    assert.notEqual(at(rules[id].path), undefined, 'the save is missing ' + rules[id].path);
  }

  // A fresh run: a squad has been saved, but ten waves have not been survived.
  assert.equal(passes(rules['custom-char'], at('haveSaved')), true);
  assert.equal(passes(rules['arena-wave-10'], at('arenaWaves')), false);
  assert.equal(passes(rules['arena-wave-10'], 10), true);
  assert.equal(passes(rules['arena-wave-10'], 9), false);
  assert.equal(passes(rules['arena-kills-100'], at('arenaKills')), false);
  assert.equal(passes(rules['rich'], at('myCash')), true);

  // Story progress is deliberately absent here: this fixture is an arena-only
  // save, and `story-mission` unlocking off it would be a false positive — the
  // failure that matters, since a rule that never unlocks only disappoints.
  assert.equal(at('storyProgressWorld0'), undefined, 'fixture should have no story progress');
  assert.equal(passes(rules['story-mission'], at('storyProgressWorld0')), false);

  // The mods are rebuilds of the same engine, so they must share the mapping.
  const mods = Object.keys(SAVE_RULES).filter((slug) => slug.startsWith('madness-'));
  assert.ok(mods.length >= 12, 'expected every mod mapped, got ' + mods.length);
});

/*
 * The other two saves that drive achievements, both real files written by the
 * games themselves rather than by an encoder of mine.
 */
const CUBEFIELD_SAVE = 'AL8AAAAtVENTTwAEAAAAAAAJY3ViZWZpZWxkAAAAAAAIVG9wU2NvcmUAQNZZQAAAAAAA';
const ASTEROIDS_SAVE =
  'AL8AAAAxVENTTwAEAAAAAAAObmVhdmVBc3Rlcm9pZHMAAAAAAApwbGF5ZXJOYW1lAgADQUxFAA==';

test("Cubefield's score tiers read the game's own TopScore", async () => {
  const { SAVE_RULES, passes } = await import('../src/data/saveRules.ts');
  const save = decodeSol(Uint8Array.from(atob(CUBEFIELD_SAVE), (c) => c.charCodeAt(0)));

  assert.equal(save.error, undefined);
  assert.equal(save.name, 'cubefield');
  assert.equal(save.data.TopScore, 22885);

  const rules = SAVE_RULES.cubefield;
  const score = save.data.TopScore as SolValue;

  // 22885 clears the first two tiers and not the third. A rule that matched
  // nothing would pass an "unlocks" assertion by accident, so both directions
  // are checked.
  assert.equal(passes(rules['score-5k'], score), true);
  assert.equal(passes(rules['score-20k'], score), true);
  assert.equal(passes(rules['score-50k'], score), false);

  // Nothing unlocks from an absent field.
  assert.equal(passes(rules['score-5k'], undefined), false);
});

test('Asteroids unlocks from the initials it stores, and stores nothing else', async () => {
  const { SAVE_RULES, passes } = await import('../src/data/saveRules.ts');
  const save = decodeSol(Uint8Array.from(atob(ASTEROIDS_SAVE), (c) => c.charCodeAt(0)));

  assert.equal(save.error, undefined);
  assert.equal(save.name, 'neaveAsteroids');
  assert.deepEqual(Object.keys(save.data), ['playerName']);

  const rules = SAVE_RULES.asteroids;
  assert.equal(passes(rules.named, save.data.playerName as SolValue), true);
  // The game writes the field before the player types, so an empty string is
  // not a finished run.
  assert.equal(passes(rules.named, ''), false);
  assert.equal(passes(rules.named, undefined), false);
});

test('every save rule names an achievement that exists', async () => {
  const { SAVE_RULES } = await import('../src/data/saveRules.ts');
  const { ACHIEVEMENTS } = await import('../src/data/achievements.ts');

  // Same check the browser makes in development, run where it cannot be missed:
  // a rule pointing at an id nobody defined can never unlock anything, and says
  // nothing at all when it fails.
  for (const [slug, rules] of Object.entries(SAVE_RULES)) {
    const ids = new Set((ACHIEVEMENTS[slug] ?? []).map((a) => a.id));
    assert.ok(ACHIEVEMENTS[slug], slug + ' has no achievements');
    for (const id of Object.keys(rules)) {
      assert.ok(ids.has(id), slug + ' has no achievement called ' + id);
    }
  }
});

/**
 * Rules and evidence must not drift apart.
 *
 * scripts/save-scan.json is what `node scripts/scan-saves.mjs` read out of each
 * SWF's own bytecode: every name the game touches on `<sharedObject>.data`. A
 * rule naming anything else is a typo, and a typo here is invisible — the
 * achievement simply never unlocks and nothing anywhere says why.
 */
test('every save rule names a field the game actually writes', async () => {
  const { SAVE_RULES } = await import('../src/data/saveRules.ts');
  const { readFileSync } = await import('node:fs');

  const scan: { file: string; fields: string[] }[] = JSON.parse(
    readFileSync('scripts/save-scan.json', 'utf8'),
  );
  const byFile = new Map(scan.map((entry) => [entry.file, new Set(entry.fields)]));

  // Written out rather than derived from the catalog, because data/games.ts
  // pulls in the generated dump index and this file has no bundler.
  const SOURCE: Record<string, string> = {
    cubefield: 'Cubefield.swf',
    asteroids: 'Asteroids.swf',
    'duck-life': 'Duck_Life.swf',
    'duck-life-2': 'Duck_Life_2.swf',
    'duck-life-3': 'Duck_Life_3.swf',
    'duck-life-4': 'Duck_Life_4.swf',
    'endless-war-4': 'Endless_War_4.swf',
    'gun-mayhem-2': 'Gun_Mayhem_2.swf',
    'warfare-1917': 'Warfare_1917.swf',
    'madness-project-nexus-classic': 'Madness_Project_Nexus_Classic.swf',
  };

  for (const [slug, file] of Object.entries(SOURCE)) {
    const fields = byFile.get(file);
    assert.ok(fields, `${file} is missing from the scan — rerun scripts/scan-saves.mjs`);
    for (const [id, rule] of Object.entries(SAVE_RULES[slug])) {
      // Only the first segment: nested paths step into objects the scan cannot
      // see the shape of, but the field they start from is still named.
      const root = rule.path.split('.')[0];
      assert.ok(fields.has(root), `${slug}/${id}: ${file} never writes "${root}"`);
    }
  }

  // Every game with rules should be covered here, or a typo in a game left out
  // of SOURCE would go unnoticed. The Madness mods share one rule set that the
  // base game already proves, so they are counted rather than each listed.
  const unchecked = Object.keys(SAVE_RULES).filter(
    (slug) => !(slug in SOURCE) && !slug.startsWith('madness-'),
  );
  assert.deepEqual(unchecked, [], 'these games have rules but no scan check');
});
