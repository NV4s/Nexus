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
    urlRewriteRules: DEAD_SPONSOR_APIS,
  };
}

/**
 * Sponsor SDKs whose back ends no longer exist, sent nowhere.
 *
 * A sponsored Flash game loads its portal's SDK at runtime and asks it about
 * the player. The SDK files are often still served — Armor Games still returns
 * AGI.swf and ABS.swf today — but the service behind them is gone, so the SDK
 * loads, calls home, waits out its own timeout and puts a portal-branded error
 * over the game. Achievement Unlocked 3 sat on "Armor Games Services are
 * temporarily unavailable (Error 1)" for about forty seconds before it would
 * start.
 *
 * Pointing the SDK at a path that is not a SWF makes the load fail at once, and
 * the games treat that the way they were always meant to: they skip the portal
 * features and start. Verified on Achievement Unlocked 3 — straight to its title
 * screen, no dialog, and nothing requested from armorgames.com at all.
 *
 * This is deliberately a list of hosts known to be dead rather than a blanket
 * block: a live SDK is still worth loading, and some sponsored builds check in
 * before they will run.
 */
const DEAD_SPONSOR_APIS: [RegExp, string][] = [
  [/^https?:\/\/agi\.armorgames\.com\/.*$/, '/sponsor-offline'],
];

export const FRAME_RATES = [0, 24, 30, 45, 60, 90, 120] as const;
export const QUALITIES: Quality[] = ['low', 'medium', 'high', 'best'];
