/**
 * Reader for Flash Local Shared Objects (`.sol`) — the files a Flash game writes
 * when it saves. Ruffle keeps each one in localStorage as base64 of the raw
 * binary, so decoding it yields the game's own saved variables.
 *
 * Pure and DOM-free by design: `DataView` + `TextDecoder` only, no storage and
 * no base64, so it can be run directly under `node --test`.
 *
 * The container is a short header, then name/value pairs encoded in either AMF0
 * (ActionScript 2 games) or AMF3 (ActionScript 3). AMF3 is the one that punishes
 * mistakes: its reference tables mean a single misplaced push does not throw, it
 * silently returns plausible data with every later key wrong. Each place that
 * can happen is commented where it happens.
 */

export type SolValue =
  | null
  | boolean
  | number
  | string
  | SolValue[]
  | { [key: string]: SolValue }
  | { $bytes: number }
  | { $date: number };

export type SolFile = {
  name: string;
  amf: 0 | 3;
  data: Record<string, SolValue>;
  /** Set when the walk stopped early. `data` still holds every pair read before it. */
  error?: string;
};

const decoder = new TextDecoder('utf-8');

/**
 * Never throws. A truncated file, an unknown marker or a desynced stream ends
 * the walk and is reported in `error`, with whatever was read up to that point.
 */
export function decodeSol(bytes: Uint8Array): SolFile {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const file: SolFile = { name: '', amf: 0, data: {} };
  let p = 0;

  // One bounds check per primitive rather than per call site.
  const need = (n: number) => {
    if (p + n > bytes.length) throw new RangeError('truncated');
  };
  const u8 = () => {
    need(1);
    return bytes[p++];
  };
  const u16 = () => {
    need(2);
    const v = view.getUint16(p);
    p += 2;
    return v;
  };
  const u32 = () => {
    need(4);
    const v = view.getUint32(p);
    p += 4;
    return v;
  };
  const i32 = () => {
    need(4);
    const v = view.getInt32(p);
    p += 4;
    return v;
  };
  const f64 = () => {
    need(8);
    const v = view.getFloat64(p);
    p += 8;
    return v;
  };
  const utf8 = (n: number) => {
    need(n);
    const s = decoder.decode(bytes.subarray(p, p + n));
    p += n;
    return s;
  };

  // These span the whole body, not one entry. Resetting them per pair desyncs on
  // the first repeated string, which is the most common shape in a real save.
  const strings: string[] = [];
  const objects: SolValue[] = [];
  const traits: { dynamic: boolean; names: string[] }[] = [];
  const amf0Refs: SolValue[] = [];

  function amf0Props(target: Record<string, SolValue>) {
    for (;;) {
      const key = utf8(u16());
      if (key === '') {
        if (u8() !== 0x09) throw new Error('bad object terminator');
        return target;
      }
      target[key] = amf0Value();
    }
  }

  function amf0Value(): SolValue {
    const marker = u8();
    switch (marker) {
      case 0x00:
        return f64();
      case 0x01:
        return u8() !== 0;
      case 0x02:
        return utf8(u16());
      case 0x03: {
        const object: Record<string, SolValue> = {};
        amf0Refs.push(object); // before contents, so a self-reference resolves
        return amf0Props(object);
      }
      case 0x05:
      case 0x06:
        return null; // JSON has no undefined
      case 0x07:
        return amf0Refs[u16()] ?? null;
      case 0x08: {
        // ECMA array: the count is advisory and often wrong, so it is discarded.
        // Decoded as an object — Flash writes sparse arrays with numeric-string
        // keys, and coercing that to a JS array invents holes and a false length.
        u32();
        const object: Record<string, SolValue> = {};
        amf0Refs.push(object);
        return amf0Props(object);
      }
      case 0x0a: {
        const count = u32();
        const array: SolValue[] = [];
        amf0Refs.push(array);
        for (let i = 0; i < count; i++) array.push(amf0Value());
        return array;
      }
      case 0x0b: {
        const ms = f64();
        need(2);
        p += 2; // timezone, always zero
        return { $date: ms };
      }
      case 0x0c:
      case 0x0f:
        return utf8(u32());
      case 0x0d:
        return null;
      case 0x10: {
        utf8(u16()); // class name, dropped — never the value a rule matches on
        const object: Record<string, SolValue> = {};
        amf0Refs.push(object);
        return amf0Props(object);
      }
      case 0x11:
        return amf3Value(); // AVM+ switch, sharing this body's AMF3 tables
      default:
        // MovieClip and RecordSet carry no length prefix, so there is nothing to
        // skip past — guessing would corrupt every byte after this point.
        throw new Error(`amf0 marker 0x${marker.toString(16)}`);
    }
  }

  function u29() {
    let b = u8();
    if (b < 0x80) return b;
    let v = (b & 0x7f) << 7;
    b = u8();
    if (b < 0x80) return v | b;
    v = (v | (b & 0x7f)) << 7;
    b = u8();
    if (b < 0x80) return v | b;
    v = (v | (b & 0x7f)) << 8;
    return (v | u8()) >>> 0; // the fourth byte contributes 8 bits, not 7
  }

  function amf3String(): string {
    const header = u29();
    if ((header & 1) === 0) return strings[header >> 1] ?? '';
    const length = header >> 1;
    // The empty string is never a reference and is never added to the table.
    // Adding it shifts every later index, and the file then decodes to wrong
    // keys with no error raised anywhere.
    if (length === 0) return '';
    const value = utf8(length);
    strings.push(value);
    return value;
  }

  /** True when this header is a back-reference rather than an inline value. */
  const isRef = (header: number) => (header & 1) === 0;

  function amf3Array(): SolValue {
    const header = u29();
    if (isRef(header)) return objects[header >> 1] ?? null;

    const dense = header >> 1;
    const array: SolValue[] = [];
    objects.push(array); // before contents: identity must be fixed first

    // Associative keys hang off the same array as non-index properties.
    for (;;) {
      const key = amf3String();
      if (key === '') break;
      (array as unknown as Record<string, SolValue>)[key] = amf3Value();
    }
    for (let i = 0; i < dense; i++) array.push(amf3Value());
    return array;
  }

  function amf3Object(): SolValue {
    const header = u29();
    if (isRef(header)) return objects[header >> 1] ?? null;

    let trait: { dynamic: boolean; names: string[] };
    if ((header & 2) === 0) {
      const existing = traits[header >> 2];
      if (!existing) throw new Error('bad traits reference');
      trait = existing;
    } else if ((header & 4) !== 0) {
      // Externalizable payloads have no length prefix — unskippable, so stop.
      throw new Error(`externalizable ${amf3String()}`);
    } else {
      trait = { dynamic: (header & 8) !== 0, names: [] };
      amf3String(); // class name, dropped
      const count = header >> 4;
      for (let i = 0; i < count; i++) trait.names.push(amf3String());
      traits.push(trait); // before any values are read
    }

    const object: Record<string, SolValue> = {};
    objects.push(object); // before members, so a cycle lands here
    for (const name of trait.names) object[name] = amf3Value();
    if (trait.dynamic) {
      for (;;) {
        const key = amf3String();
        if (key === '') break;
        object[key] = amf3Value();
      }
    }
    return object;
  }

  function amf3Value(): SolValue {
    const marker = u8();
    switch (marker) {
      case 0x00:
      case 0x01:
        return null;
      case 0x02:
        return false;
      case 0x03:
        return true;
      case 0x04: {
        const raw = u29();
        return raw >= 0x10000000 ? raw - 0x20000000 : raw; // signed 29-bit
      }
      case 0x05:
        return f64();
      case 0x06:
        return amf3String();
      case 0x07:
      case 0x0b: {
        // XML uses the OBJECT table, not the string table.
        const header = u29();
        if (isRef(header)) return objects[header >> 1] ?? null;
        const value = utf8(header >> 1);
        objects.push(value);
        return value;
      }
      case 0x08: {
        const header = u29();
        if (isRef(header)) return objects[header >> 1] ?? null;
        const date = { $date: f64() };
        objects.push(date);
        return date;
      }
      case 0x09:
        return amf3Array();
      case 0x0a:
        return amf3Object();
      case 0x0c: {
        // ByteArray, also the object table. Contents are never useful here.
        const header = u29();
        if (isRef(header)) return objects[header >> 1] ?? null;
        const length = header >> 1;
        need(length);
        p += length;
        const value = { $bytes: length };
        objects.push(value);
        return value;
      }
      case 0x0d:
      case 0x0e:
      case 0x0f: {
        const header = u29();
        if (isRef(header)) return objects[header >> 1] ?? null;
        const count = header >> 1;
        const array: SolValue[] = [];
        objects.push(array);
        u8(); // fixed-length flag
        for (let i = 0; i < count; i++) {
          array.push(marker === 0x0d ? i32() : marker === 0x0e ? u32() : f64());
        }
        return array;
      }
      case 0x10: {
        const header = u29();
        if (isRef(header)) return objects[header >> 1] ?? null;
        const count = header >> 1;
        const array: SolValue[] = [];
        objects.push(array);
        u8();
        amf3String(); // element class name
        for (let i = 0; i < count; i++) array.push(amf3Value());
        return array;
      }
      default:
        // Dictionary (0x11) can key on arbitrary objects and has no JSON form.
        throw new Error(`amf3 marker 0x${marker.toString(16)}`);
    }
  }

  try {
    if (u8() !== 0x00 || u8() !== 0xbf) throw new Error('not a .sol');
    const declared = u32();
    if (utf8(4) !== 'TCSO') throw new Error('not a .sol');
    p = 16; // past the six pad bytes

    file.name = utf8(u16());
    need(4);
    p += 3;
    file.amf = u8() === 3 ? 3 : 0;

    // Trusting `declared` walks off the end of a truncated file; trusting the
    // buffer reads trailing junk as a key. Take whichever ends sooner.
    const end = Math.min(bytes.length, 6 + declared);

    while (p < end) {
      const key = file.amf === 3 ? amf3String() : utf8(u16());
      const value = file.amf === 3 ? amf3Value() : amf0Value();
      if (u8() !== 0x00) throw new Error('desynced'); // do not try to resync
      file.data[key] = value;
    }
  } catch (cause) {
    file.error = cause instanceof Error ? cause.message : String(cause);
  }

  return file;
}

/**
 * Cycle- and depth-safe view for display and JSON.stringify.
 *
 * Cycles only actually manifest at the display boundary, so they are handled
 * here and nowhere else. An array carrying associative keys becomes an object,
 * because JSON.stringify silently drops non-index properties on an array.
 */
export function toDisplay(value: SolValue, maxDepth = 8): unknown {
  const open = new WeakSet<object>();

  const walk = (node: SolValue, depth: number): unknown => {
    if (node === null || typeof node !== 'object') return node;
    if (open.has(node)) return '[circular]';
    if (depth >= maxDepth) return '[…]';

    open.add(node);
    try {
      if (Array.isArray(node)) {
        const extra = Object.keys(node).filter((key) => !/^\d+$/.test(key));
        if (!extra.length) return node.map((item) => walk(item, depth + 1));
        const out: Record<string, unknown> = {};
        node.forEach((item, index) => (out[index] = walk(item, depth + 1)));
        for (const key of extra) {
          out[key] = walk((node as unknown as Record<string, SolValue>)[key], depth + 1);
        }
        return out;
      }
      const out: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(node)) out[key] = walk(item, depth + 1);
      return out;
    } finally {
      // Released on the way out, so a value referenced twice without a cycle
      // renders twice rather than being falsely reported as circular.
      open.delete(node);
    }
  };

  return walk(value, 0);
}
