import { SWFDUMP_FILES, SWFDUMP_SHA } from '../data/swfdump.ts';


const JSDELIVR_MAX = 20_000_000;

const GITHUB_BLOB_MAX = 100_000_000;

const sizes = new Map(SWFDUMP_FILES);


const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');

const rawUrl = (path: string) =>
  `https://raw.githubusercontent.com/NV4s/swfdump/${SWFDUMP_SHA}/${encodePath(path)}`;

export const swfSize = (path: string) => sizes.get(path) ?? 0;


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
