/**
 * Every name this site writes to localStorage or sessionStorage. They are short
 * and say nothing — no site name, no feature words — because anything with
 * access to the page can read the key list even when it cannot read the DOM.
 * Values are untouched; only the names changed. migrateKeys moves the old names
 * over on first load.
 */

const P = '_x:';

export const K = {
  theme: `${P}t`,
  quality: `${P}q`,
  intro: `${P}i`,
  session: `${P}s`,
  visitor: `${P}v`,
  appearance: `${P}ap`,
  player: `${P}pl`,
  siteConfig: `${P}sc`,
  chatName: `${P}cn`,
  combo: `${P}ec`,
  link: `${P}el`,
  mode: `${P}em`,
  recording: `${P}er`,
  unlocked: (slug: string) => `${UNLOCKED_PREFIX}${slug}`,
  progress: (slug: string) => `${PROGRESS_PREFIX}${slug}`,
  signature: (slug: string) => `${P}sg:${slug}`,
  apiKey: (id: string) => `${P}k:${id}`,
  chat: (engine: string, model: string) => `${CHAT_PREFIX}${engine}:${model || 'default'}`,
  adSeen: (slug: string) => `${P}ad:${slug}`,
};

export const UNLOCKED_PREFIX = `${P}a:`;
export const PROGRESS_PREFIX = `${P}p:`;
export const CHAT_PREFIX = `${P}c:`;

/** Old name -> new name. Checked before FAMILIES, so nexus:chat:name does not
 *  fall through to the nexus:chat: family. */
const FIXED: Record<string, string> = {
  theme: K.theme,
  quality: K.quality,
  introSeen: K.intro,
  sid: K.session,
  panicCombo: K.combo,
  panicLink: K.link,
  panicMode: K.mode,
  recordingPanicCombo: K.recording,
  'nexus:vid': K.visitor,
  'nexus:appearance': K.appearance,
  'nexus:player': K.player,
  'nexus:siteConfig': K.siteConfig,
  'nexus:chat:name': K.chatName,
};

/** Old prefix -> new prefix, for the names that carry a slug or a model id. */
const FAMILIES: [string, string][] = [
  ['nexus:ach:', UNLOCKED_PREFIX],
  ['nexus:play:', PROGRESS_PREFIX],
  ['nexus:savesig:', `${P}sg:`],
  ['nexus:ai:', `${P}k:`],
  ['nexus:chat:', CHAT_PREFIX],
  ['nexus:ad-seen:', `${P}ad:`],
];

/** Renames in place. An existing new name always wins, so running twice, or
 *  running against a half-migrated browser, never overwrites live data. */
export function migrateKeys(store: Storage) {
  try {
    for (const old of Object.keys(store)) {
      const family = old in FIXED ? null : FAMILIES.find(([from]) => old.startsWith(from));
      const next = FIXED[old] ?? (family ? family[1] + old.slice(family[0].length) : null);
      if (!next || next === old) continue;

      const value = store.getItem(old);
      if (value === null) continue;

      if (store.getItem(next) === null) store.setItem(next, value);
      store.removeItem(old);
    }
  } catch {}
}
