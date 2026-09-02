import { SWFDUMP_FILES, SWFDUMP_SHA } from '../data/swfdump.ts';

/** jsDelivr refuses to serve GitHub files above ~20 MB; those fall back to raw. */
const JSDELIVR_MAX = 20_000_000;
/**
 * Past 100 MB a file cannot be a plain blob, so it is stored in Git LFS. raw
 * returns the pointer text for those — the bytes come from the media endpoint,
 * which also sends `Access-Control-Allow-Origin: *`.
 */
const GITHUB_BLOB_MAX = 100_000_000;

const sizes = new Map(SWFDUMP_FILES);

/** Paths contain spaces, parentheses and apostrophes — encode per segment, not whole. */
const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');

const rawUrl = (path: string) =>
  `https://raw.githubusercontent.com/NV4s/swfdump/${SWFDUMP_SHA}/${encodePath(path)}`;

export const swfSize = (path: string) => sizes.get(path) ?? 0;

/**
 * Base URL for the numbered chunks a large game also ships as.
 *
 * These are the standby for a file served from LFS: LFS bandwidth is capped per
 * month, and the chunks are ordinary blobs on raw with no such meter, so the
 * game keeps loading after the quota runs out. Chunks are well past jsDelivr's
 * ceiling, so they always come from raw.
 */
export const swfChunkBase = rawUrl;

export function swfUrl(path: string): string {
  const size = swfSize(path);
  if (size > GITHUB_BLOB_MAX) {
    return `https://media.githubusercontent.com/media/NV4s/swfdump/${SWFDUMP_SHA}/${encodePath(path)}`;
  }
  return size > JSDELIVR_MAX
    ? rawUrl(path)
    : `https://cdn.jsdelivr.net/gh/NV4s/swfdump@${SWFDUMP_SHA}/${encodePath(path)}`;
}
