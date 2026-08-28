/**
 * Ruffle player preferences, persisted per device.
 *
 * Every option here is one the vendored Ruffle build actually accepts — they
 * appear in its own default config — rather than something invented and quietly
 * ignored. Defaults are the values Ruffle already uses, so leaving them alone
 * changes nothing.
 */

export type Quality = 'low' | 'medium' | 'high' | 'best';

export type PlayerPrefs = {
  /** Frames per second. 0 means "whatever the SWF asks for", which is the default. */
  frameRate: number;
  quality: Quality;
  volume: number;
  /** Seconds a script may run before Ruffle offers to stop it. Ruffle's default is 15. */
  maxExecution: number;
  /** Adds Ruffle's own "Download .swf" entry to its right-click menu. */
  swfDownload: boolean;
  letterbox: boolean;
  /**
   * Overrides a SWF that pins its own stage size.
   *
   * Some games set `Stage.scaleMode = "noScale"` in their own code — Commando
   * is one — which leaves them drawn at their authored size in the middle of
   * the frame however large the frame is. Ruffle's `forceScale` ignores that
   * instruction; `scale: showAll` then fits them without distorting anything.
   */
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
    // Spread over the defaults so a preference added later does not read as
    // undefined for anyone who saved settings before it existed.
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<PlayerPrefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function writePlayerPrefs(prefs: Partial<PlayerPrefs>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readPlayerPrefs(), ...prefs }));
  } catch {
    /* preferences are a convenience, not worth failing a game load over */
  }
}

/** The subset Ruffle takes at load time. */
export function ruffleOptions(prefs: PlayerPrefs) {
  return {
    autoplay: 'on',
    // Third-party SWFs get no reach into this page.
    allowScriptAccess: false,
    letterbox: prefs.letterbox ? 'on' : 'off',
    quality: prefs.quality,
    volume: prefs.volume,
    maxExecutionDuration: prefs.maxExecution,
    showSwfDownload: prefs.swfDownload,
    // showAll is Ruffle's own default and preserves the aspect ratio; forceScale
    // is what makes it apply to a SWF that sets its own scaleMode.
    scale: 'showAll',
    forceScale: prefs.stretch,
    // null is Ruffle's own "use the file's own rate"; a number overrides it.
    frameRate: prefs.frameRate > 0 ? prefs.frameRate : null,
  };
}

export const FRAME_RATES = [0, 24, 30, 45, 60, 90, 120] as const;
export const QUALITIES: Quality[] = ['low', 'medium', 'high', 'best'];
