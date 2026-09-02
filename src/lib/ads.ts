/**
 * Ad configuration. Every position is wired up, but nothing renders and no
 * request is made until PUBLISHER_ID is set — an unconfigured slot takes no
 * space. `?adpreview=1` outlines them. Setup is in docs/ads.md.
 */

/** From AdSense: Account → Settings → Account information. Looks like `ca-pub-1234567890123456`. */
export const PUBLISHER_ID = '';

/**
 * One entry per slot. `id` is the ad unit's slot id from AdSense — create the
 * unit there, paste its `data-ad-slot` number here.
 */
export type SlotName =
  | 'game-interstitial'
  | 'home-1'
  | 'home-2'
  | 'home-3'
  | 'grid-inline'
  | 'assistant'
  | 'rail-left'
  | 'rail-right';

export type SlotSpec = {
  id: string;
  /** Placeholder size, and the box the real unit is given. */
  width: number | 'fluid';
  height: number;
  label: string;
};

export const SLOTS: Record<SlotName, SlotSpec> = {
  'game-interstitial': { id: '', width: 336, height: 280, label: 'Before the game' },
  'home-1': { id: '', width: 'fluid', height: 120, label: 'Home, after the hero' },
  'home-2': { id: '', width: 'fluid', height: 120, label: 'Home, mid page' },
  'home-3': { id: '', width: 'fluid', height: 120, label: 'Home, before the footer' },
  'grid-inline': { id: '', width: 'fluid', height: 110, label: 'In the grid' },
  assistant: { id: '', width: 'fluid', height: 110, label: 'Below the assistant' },
  'rail-left': { id: '', width: 160, height: 600, label: 'Left rail' },
  'rail-right': { id: '', width: 160, height: 600, label: 'Right rail' },
};

/** Rows of cards between one in-grid slot and the next. */
export const ROWS_BETWEEN_ADS = 3;

export const adsEnabled = () => PUBLISHER_ID.startsWith('ca-pub-');

const flag = (name: string, value: string) =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get(name) === value;

/** AdSense's own test mode, so units can be checked without risking the account. */
export const adTest = () => flag('adtest', 'on');

/** Draws the slots as labelled outlines, for checking the layout before signing up. */
export const adPreview = () => flag('adpreview', '1');

/** True when a slot in this position will actually render something. */
export const slotShows = (name: SlotName) => adPreview() || (adsEnabled() && Boolean(SLOTS[name].id));

/**
 * The rails only get their own columns when there is something to put in them.
 * Without this the player would sit in a grid with two empty 160px gutters.
 */
export const railsClass = () => (slotShows('rail-left') ? 'with-rails' : '');

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let script: Promise<void> | null = null;

/**
 * Loads the AdSense tag once per session, on the first slot that mounts, rather
 * than in index.html — a site with no publisher id should make no request at
 * all, and most pages here have no slots on them.
 */
export function loadAdsense(): Promise<void> {
  if (!adsEnabled()) return Promise.reject(new Error('No publisher id set'));
  script ??= new Promise((resolve, reject) => {
    const tag = document.createElement('script');
    tag.async = true;
    tag.crossOrigin = 'anonymous';
    tag.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`;
    tag.onload = () => resolve();
    tag.onerror = () => {
      script = null; // a blocked request should not poison a later retry
      reject(new Error('Ad script blocked'));
    };
    document.head.append(tag);
  });
  return script;
}
