

export type Quality = 'low' | 'medium' | 'high' | 'best';

export type PlayerPrefs = {

  frameRate: number;
  quality: Quality;
  volume: number;

  maxExecution: number;

  swfDownload: boolean;
  letterbox: boolean;

  stretch: boolean;
};

export const DEFAULT_PREFS: PlayerPrefs = {
  frameRate: 0,
  quality: 'high',
  volume: 1,
  maxExecution: 15,
  swfDownload: true,
  letterbox: true,
  stretch: true,
};

const KEY = 'nexus:player';

export function readPlayerPrefs(): PlayerPrefs {
  try {
    const raw = localStorage.getItem(KEY);


    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<PlayerPrefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writePlayerPrefs(prefs: Partial<PlayerPrefs>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readPlayerPrefs(), ...prefs }));
  } catch {}
}


export function ruffleOptions(prefs: PlayerPrefs) {
  return {
    autoplay: 'on',

    allowScriptAccess: false,
    letterbox: prefs.letterbox ? 'on' : 'off',
    quality: prefs.quality,
    volume: prefs.volume,
    maxExecutionDuration: prefs.maxExecution,
    showSwfDownload: prefs.swfDownload,


    scale: 'showAll',
    forceScale: prefs.stretch,

    frameRate: prefs.frameRate > 0 ? prefs.frameRate : null,
    urlRewriteRules: DEAD_SPONSOR_APIS,
  };
}


const DEAD_SPONSOR_APIS: [RegExp, string][] = [
  [/^https?:\/\/agi\.armorgames\.com\/.*$/, '/sponsor-offline'],
];

export const FRAME_RATES = [0, 24, 30, 45, 60, 90, 120] as const;
export const QUALITIES: Quality[] = ['low', 'medium', 'high', 'best'];
