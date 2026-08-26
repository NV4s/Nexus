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
import { decodeSol, toDisplay } from '../src/lib/sol.ts';

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
