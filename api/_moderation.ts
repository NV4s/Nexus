

export type Verdict = { ok: true; text: string } | { ok: false; reason: string };


function normalise(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[4@]/g, 'a')
    .replace(/[3€]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/[5$]/g, 's')
    .replace(/7/g, 't')
    .replace(/[(<{]/g, 'c')
    .replace(/(.)\1{2,}/g, '$1');
}


const squash = (value: string) => normalise(value).replace(/[^a-z]/g, '');


const SLURS = [
  'nigger', 'nigga', 'faggot', 'fagot', 'tranny', 'chink', 'spic', 'kike',
  'wetback', 'towelhead', 'raghead', 'gook', 'coon', 'beaner', 'retard',
  'niglet', 'shemale', 'heil hitler', 'heilhitler', 'kkk',
];


const PROFANITY = [
  'fuck', 'fucking', 'fucker', 'fucked', 'motherfucker', 'shit', 'shitty',
  'bullshit', 'bitch', 'bitches', 'cunt', 'whore', 'slut', 'dick', 'cock',
  'pussy', 'bastard', 'wanker', 'twat', 'prick', 'asshole', 'arsehole',
  'jackass', 'dumbass', 'piss', 'pissed', 'bollocks', 'douche', 'douchebag',
  'jizz', 'cum', 'blowjob', 'handjob', 'porn', 'porno', 'hentai', 'rape',
  'rapist', 'molest', 'pedo', 'pedophile', 'paedophile', 'nazi', 'suicide',
  'kys', 'nudes', 'boobs', 'tits', 'titties', 'penis', 'vagina', 'anal',
  'orgasm', 'masturbate', 'horny', 'sex', 'sexy',
];


const CONTACT: [RegExp, string][] = [


  [/\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/i, 'email addresses'],
  [/\bdiscord(?:\.gg|app)?\b/i, 'Discord invites'],
  [/https?:\/\//i, 'links'],
  [/www\./i, 'links'],
  [/\b[a-z0-9-]+\.(com|net|org|io|gg|co|uk|xyz|me|tv|app|dev|link|ru|to)\b/i, 'links'],
  [/\b(?:\+?\d[\s.-]?){9,}\b/, 'phone numbers'],
  [/\b(snap(chat)?|insta(gram)?|tiktok|telegram|whats ?app|kik)\b\s*[:@]?\s*\S/i, 'social handles'],
  [/\badd me\b/i, 'contact swapping'],
  [/\bmy (number|snap|insta|discord|email)\b/i, 'contact swapping'],
  [/\b\d{1,5}\s+[a-z]+\s+(street|st|road|rd|avenue|ave|lane|ln|drive|dr)\b/i, 'addresses'],
];


const RESERVED = /\b(admin|administrator|mod|moderator|owner|staff|nexus|system|official)\b/i;

export const MAX_TEXT = 200;
export const MAX_NAME = 16;

const BANNED_WORDS = new Set([...SLURS, ...PROFANITY]);


const SPACED_SLURS = SLURS.map((term) => term.replace(/[^a-z]/g, '')).filter(
  (term) => term.length >= 5,
);


const collapse = (value: string) => value.replace(/(.)\1+/g, '$1');

const COLLAPSED_SLURS = [...new Set(SPACED_SLURS.map(collapse))].filter(
  (term) => term.length >= 5,
);


const ALLOWED = /\b(niger|nigeria|nigerian|nigerien)\b/gi;

function containsBanned(text: string): string | null {
  const words = normalise(text).split(/[^a-z]+/).filter(Boolean);
  for (const word of words) {
    if (BANNED_WORDS.has(word)) return SLURS.includes(word) ? 'slurs' : 'swearing';
  }

  const flat = squash(text.replace(ALLOWED, ' '));
  if (SPACED_SLURS.some((term) => flat.includes(term))) return 'slurs';
  if (COLLAPSED_SLURS.some((term) => collapse(flat).includes(term))) return 'slurs';

  return null;
}

export function checkMessage(raw: unknown): Verdict {
  if (typeof raw !== 'string') return { ok: false, reason: 'Message missing.' };

  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return { ok: false, reason: 'Type something first.' };
  if (text.length > MAX_TEXT) return { ok: false, reason: `Keep it under ${MAX_TEXT} characters.` };

  const banned = containsBanned(text);
  if (banned) return { ok: false, reason: `No ${banned} in here.` };

  for (const [pattern, what] of CONTACT) {
    if (pattern.test(text)) return { ok: false, reason: `No ${what} — keep it in the room.` };
  }

  const letters = text.replace(/[^a-z]/gi, '');
  if (letters.length > 8 && letters === letters.toUpperCase()) {
    return { ok: false, reason: 'Not all caps.' };
  }

  return { ok: true, text };
}

export function checkName(raw: unknown): Verdict {
  if (typeof raw !== 'string') return { ok: false, reason: 'Pick a name.' };

  const text = raw.replace(/\s+/g, ' ').trim();
  if (text.length < 2) return { ok: false, reason: 'Names need two characters.' };
  if (text.length > MAX_NAME) return { ok: false, reason: `Names cap at ${MAX_NAME} characters.` };
  if (!/^[\w .-]+$/.test(text)) return { ok: false, reason: 'Letters, numbers, spaces and - . _ only.' };
  if (RESERVED.test(text)) return { ok: false, reason: 'That name is reserved.' };
  if (containsBanned(text)) return { ok: false, reason: 'Pick a different name.' };

  return { ok: true, text };
}
