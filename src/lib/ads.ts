


export const PUBLISHER_ID = '';


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


export const ROWS_BETWEEN_ADS = 3;

export const adsEnabled = () => PUBLISHER_ID.startsWith('ca-pub-');

const flag = (name: string, value: string) =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get(name) === value;


export const adTest = () => flag('adtest', 'on');


export const adPreview = () => flag('adpreview', '1');


export const slotShows = (name: SlotName) => adPreview() || (adsEnabled() && Boolean(SLOTS[name].id));


export const railsClass = () => (slotShows('rail-left') ? 'with-rails' : '');

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let script: Promise<void> | null = null;


export function loadAdsense(): Promise<void> {
  if (!adsEnabled()) return Promise.reject(new Error('No publisher id set'));
  script ??= new Promise((resolve, reject) => {
    const tag = document.createElement('script');
    tag.async = true;
    tag.crossOrigin = 'anonymous';
    tag.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`;
    tag.onload = () => resolve();
    tag.onerror = () => {
      script = null;
      reject(new Error('Ad script blocked'));
    };
    document.head.append(tag);
  });
  return script;
}
