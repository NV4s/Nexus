import { SWFDUMP_FILES, SWFDUMP_SHA } from '../data/swfdump';

/** jsDelivr refuses to serve GitHub files above ~20 MB; those fall back to raw. */
const JSDELIVR_MAX = 20_000_000;

const sizes = new Map(SWFDUMP_FILES);

/** Paths contain spaces, parentheses and apostrophes — encode per segment, not whole. */
const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');

const rawUrl = (path: string) =>
  `https://raw.githubusercontent.com/NV4s/swfdump/${SWFDUMP_SHA}/${encodePath(path)}`;

export const swfSize = (path: string) => sizes.get(path) ?? 0;

/**
 * Base URL for a game stored as numbered chunks. GitHub rejects any blob over
 * 100 MB and LFS is disabled on the dump, so such a game is committed as
 * `<path>.001`, `.002`, … and rejoined in the browser. Chunks are well past
 * jsDelivr's ceiling, so they always come from raw.
 */
export const swfChunkBase = rawUrl;

export function swfUrl(path: string): string {
  return swfSize(path) > JSDELIVR_MAX
    ? rawUrl(path)
    : `https://cdn.jsdelivr.net/gh/NV4s/swfdump@${SWFDUMP_SHA}/${encodePath(path)}`;
}
