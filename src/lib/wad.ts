import type { WadSlot } from '../data/wads.ts';

/**
 * A GitHub link turned into a path on this domain, so a WAD arrives the same
 * way everything else does: no third-party host in the network log. /w and /wd
 * are proxied in vercel.json, and mirrored in vite.config.ts for dev.
 */

const RAW = /^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/i;
const BLOB = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/([^/]+)\/(.+)$/i;
const JSDELIVR = /^https?:\/\/cdn\.jsdelivr\.net\/gh\/([^/@]+)\/([^/@]+)@([^/]+)\/(.+)$/i;
const RELEASE = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/releases\/download\/([^/]+)\/(.+)$/i;
const REPO = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/?#]+)\/?$/i;

/** Paths carry spaces and brackets often enough: encode per segment. */
const encodePath = (path: string) =>
  path
    .split('?')[0]
    .split('#')[0]
    .split('/')
    .filter(Boolean)
    .map(encodeURIComponent)
    .join('/');

const repoName = (name: string) => name.replace(/\.git$/i, '');

export type WadSource = { url: string; error?: undefined } | { url?: undefined; error: string };

export function wadUrl({ link, file }: Pick<WadSlot, 'link' | 'file'>): WadSource {
  const value = (link ?? '').trim();
  if (!value) return { error: 'No file set yet.' };

  // Already a path on this site, or a plain relative file: use it as it is.
  if (value.startsWith('/')) return { url: value };

  const inRepo = RAW.exec(value) ?? BLOB.exec(value) ?? JSDELIVR.exec(value);
  if (inRepo) {
    const [, owner, repo, ref, path] = inRepo;
    return { url: `/w/${owner}/${repoName(repo)}/${ref}/${encodePath(path)}` };
  }

  const release = RELEASE.exec(value);
  if (release) {
    const [, owner, repo, tag, asset] = release;
    return { url: `/wd/${owner}/${repoName(repo)}/${tag}/${encodePath(asset)}` };
  }

  const repo = REPO.exec(value);
  if (repo) {
    const named = (file ?? '').trim();
    if (!named) {
      return {
        error:
          'That link points at the repository, not at a file in it. Either open the .wad on ' +
          'GitHub and copy that address, or fill in file: as well — see src/data/wads.ts.',
      };
    }
    return { url: `/w/${repo[1]}/${repoName(repo[2])}/HEAD/${encodePath(named)}` };
  }

  return { error: 'That does not look like a GitHub link. See src/data/wads.ts for the four that work.' };
}
