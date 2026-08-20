import { SWFDUMP_FILES, SWFDUMP_SHA } from '../data/swfdump';

/** jsDelivr refuses to serve GitHub files above ~20 MB; those fall back to raw. */
const JSDELIVR_MAX = 20_000_000;

const sizes = new Map(SWFDUMP_FILES);

/** Paths contain spaces, parentheses and apostrophes — encode per segment, not whole. */
const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');

export const swfSize = (path: string) => sizes.get(path) ?? 0;

export function swfUrl(path: string): string {
  const encoded = encodePath(path);
  return swfSize(path) > JSDELIVR_MAX
    ? `https://raw.githubusercontent.com/NV4s/swfdump/${SWFDUMP_SHA}/${encoded}`
    : `https://cdn.jsdelivr.net/gh/NV4s/swfdump@${SWFDUMP_SHA}/${encoded}`;
}
