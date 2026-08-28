/**
 * Reports which Flash games save anything, and what they call it.
 *
 *   node scripts/scan-saves.mjs            # every game in the dump
 *   node scripts/scan-saves.mjs bloxorz    # just the files whose name matches
 *
 * Why this exists: data/saveRules.ts refuses entries that were guessed, because
 * a rule pointing at a field the game never writes does not fail — it silently
 * never unlocks. This reads names out of the SWF's own ActionScript constant
 * pools, which is evidence rather than a guess.
 *
 * How it gets them: SWF tags are walked properly (including into sprites), each
 * DoAction block's AVM1 bytecode is scanned for ActionConstantPool, and a pool
 * is reported only when that same script also calls getLocal. A constant pool
 * belongs to one script, so its strings are that script's own identifiers —
 * which is what makes the output short enough to read, unlike grepping the file.
 *
 * What it cannot tell you is a field's type or range. The output is the
 * shortlist to check against a real .sol, not rules ready to paste.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { SWFDUMP_FILES, SWFDUMP_SHA } from '../src/data/swfdump.ts';

const CACHE = 'node_modules/.cache/swf-scan';

/** SWF bodies are usually zlib-compressed; LZMA ones are skipped, not guessed at. */
function body(buf) {
  const sig = buf.subarray(0, 3).toString('latin1');
  if (sig === 'FWS') return buf.subarray(8);
  if (sig === 'CWS') {
    try {
      return inflateSync(buf.subarray(8));
    } catch {
      return null;
    }
  }
  return null; // ZWS (LZMA), or not a SWF at all
}

/** The frame size is a bit-packed RECT, so the tag list does not start at a fixed offset. */
function tagsStart(buf) {
  const nbits = buf[0] >> 3;
  return Math.ceil((5 + 4 * nbits) / 8) + 4; // RECT, then frame rate and frame count
}

const DO_ACTION = 12;
const DO_INIT_ACTION = 59;
const DEFINE_SPRITE = 39;

/** Yields every DoAction/DoInitAction bytecode block, including inside sprites. */
function* actionBlocks(buf, start, end, depth = 0) {
  let at = start;
  while (at + 2 <= end) {
    const header = buf.readUInt16LE(at);
    at += 2;
    const code = header >> 6;
    let length = header & 0x3f;
    if (length === 0x3f) {
      if (at + 4 > end) return;
      length = buf.readUInt32LE(at);
      at += 4;
    }
    if (code === 0 || at + length > end) return; // End tag, or a length that overruns
    if (code === DO_ACTION) yield buf.subarray(at, at + length);
    else if (code === DO_INIT_ACTION) yield buf.subarray(at + 2, at + length);
    else if (code === DEFINE_SPRITE && depth < 4) {
      // A sprite's body is a nested tag list after its id and frame count.
      yield* actionBlocks(buf, at + 4, at + length, depth + 1);
    }
    at += length;
  }
}

const CONSTANT_POOL = 0x88;
const PUSH = 0x96;
const GET_MEMBER = 0x4e;
const SET_MEMBER = 0x4f;

/** Decodes one ActionPush payload into the values it puts on the stack. */
function pushValues(payload, pool) {
  const values = [];
  let at = 0;
  while (at < payload.length) {
    const type = payload[at++];
    if (type === 0) {
      const end = payload.indexOf(0, at);
      if (end < 0) break;
      values.push(payload.subarray(at, end).toString('latin1'));
      at = end + 1;
    } else if (type === 1) (values.push(payload.readFloatLE(at)), (at += 4));
    else if (type === 2 || type === 3) values.push(null);
    else if (type === 4 || type === 5) (values.push(payload[at]), at++);
    else if (type === 6) (values.push(payload.readDoubleLE(at)), (at += 8));
    else if (type === 7) (values.push(payload.readInt32LE(at)), (at += 4));
    else if (type === 8) (values.push(pool[payload[at]]), at++);
    else if (type === 9) (values.push(pool[payload.readUInt16LE(at)]), (at += 2));
    else break; // unknown type: the rest of this payload cannot be trusted
  }
  return values;
}

const IDENT = /^[A-Za-z_][A-Za-z0-9_]{1,31}$/;

/** Splits one AVM1 block into its constant pool and a flat token stream. */
function disassemble(actions) {
  let pool = [];
  const tokens = [];
  const names = new Set();
  let at = 0;

  while (at < actions.length) {
    const op = actions[at++];
    if (op === 0) break;
    if (op < 0x80) {
      tokens.push({ op });
      continue;
    }
    if (at + 2 > actions.length) break;
    const length = actions.readUInt16LE(at);
    at += 2;
    if (at + length > actions.length) break;
    const payload = actions.subarray(at, at + length);
    at += length;

    if (op === CONSTANT_POOL) {
      const strings = [];
      let from = 2;
      for (let i = 2; i < payload.length; i++) {
        if (payload[i] !== 0) continue;
        strings.push(payload.subarray(from, i).toString('latin1'));
        from = i + 1;
      }
      pool = strings;
      for (const word of strings) names.add(word);
      tokens.push({ op });
    } else if (op === PUSH) {
      const values = pushValues(payload, pool);
      for (const value of values) if (typeof value === 'string') names.add(value);
      tokens.push({ op, values });
    } else {
      tokens.push({ op });
    }
  }

  return { tokens, names };
}

/**
 * `SharedObject.getLocal("name")` assigned to a variable.
 *
 * It compiles to one push holding the variable, the argument, the argument
 * count and the class — `[game_so, neaveAsteroids, 1, SharedObject]` — then a
 * push of "getLocal" and a CallMethod. Both halves matter: the argument is the
 * .sol's filename, and the variable is how *other* scripts reach the save.
 */
function sharedObjects(tokens) {
  const vars = new Set();
  const names = new Set();

  for (let i = 0; i < tokens.length; i++) {
    const push = tokens[i];
    if (push.op !== PUSH || !push.values?.length) continue;

    // A GetVariable or two sits between the arguments and the method name, so
    // the "getLocal" push is nearby rather than immediately next.
    let call = null;
    for (let j = i + 1; j <= i + 3 && j < tokens.length; j++) {
      if (tokens[j].op !== PUSH) continue;
      call = tokens[j];
      break;
    }
    if (call?.values?.length !== 1 || call.values[0] !== 'getLocal') continue;

    const values = push.values;
    if (values[values.length - 1] !== 'SharedObject') continue;
    const count = values.findIndex((v) => typeof v === 'number');
    if (count > 0 && typeof values[count - 1] === 'string') names.add(values[count - 1]);
    if (typeof values[0] === 'string' && count !== 0 && IDENT.test(values[0])) vars.add(values[0]);
  }

  return { vars, names };
}

/**
 * Field names read or written on `<something>.data`.
 *
 * `so.data.field` is a push of "data", a GetMember, a push of the field, and a
 * GetMember or SetMember. Older code sets the whole path as one string instead,
 * so that form is matched too.
 */
function dataFields(tokens) {
  const fields = new Set();

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.op !== PUSH || !token.values?.length) continue;

    for (const value of token.values) {
      if (typeof value !== 'string') continue;
      const dotted = value.match(/(?:^|\.)data\.([A-Za-z_][A-Za-z0-9_]{1,31})$/);
      if (dotted) fields.add(dotted[1]);
    }

    if (token.values[token.values.length - 1] !== 'data') continue;
    if (tokens[i + 1]?.op !== GET_MEMBER) continue;

    const next = tokens[i + 2];
    const after = tokens[i + 3];
    if (next?.op !== PUSH || !next.values?.length) continue;
    if (after?.op !== GET_MEMBER && after?.op !== SET_MEMBER) continue;

    const field = next.values[0];
    if (typeof field === 'string' && IDENT.test(field)) fields.add(field);
  }

  return fields;
}

/**
 * Every SharedObject name and stored field in one file.
 *
 * Two passes, because the script that opens the save is usually not the script
 * that writes to it — Asteroids calls getLocal in one place and sets
 * `game_so.data.playerName` in two others. The first pass learns which variable
 * holds the save; the second reads fields from any script that mentions it.
 */
function scanFile(buf) {
  const scripts = [];
  for (const actions of actionBlocks(buf, tagsStart(buf), buf.length)) {
    try {
      scripts.push(disassemble(actions));
    } catch {
      /* a malformed block is not worth failing the whole file over */
    }
  }

  const vars = new Set();
  const names = new Set();
  for (const script of scripts) {
    const found = sharedObjects(script.tokens);
    for (const name of found.vars) vars.add(name);
    for (const name of found.names) names.add(name);
  }

  const saving = scripts.filter(
    (script) => script.names.has('getLocal') || [...vars].some((name) => script.names.has(name)),
  );
  if (!saving.length) return { scripts: 0, names: [], objects: [] };

  const fields = new Set();
  for (const script of saving) for (const field of dataFields(script.tokens)) fields.add(field);

  return { scripts: saving.length, names: [...fields], objects: [...names] };
}

/* ---------- run ---------- */

const files = SWFDUMP_FILES.map(([file, size]) => ({ file, size }));
const filter = process.argv[2]?.toLowerCase();
const wanted = files.filter((f) => !filter || f.file.toLowerCase().includes(filter));

// Past this a file is mostly artwork; the ones that big here are the Madness
// mods, whose save is already mapped.
const MAX_BYTES = 25 * 1024 * 1024;

mkdirSync(CACHE, { recursive: true });
console.log(`scanning ${wanted.length} of ${files.length} files\n`);

const found = [];
let skipped = 0;

for (const entry of wanted) {
  const cached = `${CACHE}/${entry.file.replace(/[\\/]/g, '_')}`;
  let buf;
  try {
    if (existsSync(cached)) buf = readFileSync(cached);
    else {
      if (entry.size > MAX_BYTES) {
        skipped++;
        continue;
      }
      const path = entry.file.split('/').map(encodeURIComponent).join('/');
      const response = await fetch(`https://cdn.jsdelivr.net/gh/NV4s/swfdump@${SWFDUMP_SHA}/${path}`);
      if (!response.ok) {
        console.log(`  ${entry.file}: HTTP ${response.status}`);
        skipped++;
        continue;
      }
      buf = Buffer.from(await response.arrayBuffer());
      writeFileSync(cached, buf);
    }
  } catch (cause) {
    console.log(`  ${entry.file}: ${cause.message}`);
    skipped++;
    continue;
  }

  const inner = body(buf);
  if (!inner) {
    skipped++;
    continue;
  }

  const { scripts, names, objects } = scanFile(inner);
  if (!scripts) continue;

  names.sort();
  objects.sort();
  found.push({ file: entry.file, scripts, objects, fields: names });
  console.log(`${entry.file}`);
  console.log(`  SharedObject: ${objects.join(', ') || '(not a literal)'}`);
  console.log(`  fields:       ${names.join(' ') || '(none matched)'}\n`);
}

console.log(`${found.length} of ${wanted.length - skipped} scanned files save (${skipped} skipped)`);
writeFileSync('scripts/save-scan.json', JSON.stringify(found, null, 2));
console.log('written: scripts/save-scan.json');
