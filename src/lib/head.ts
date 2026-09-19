/**
 * The served HTML carries nothing but a charset, a viewport and the script tag.
 * Everything else about the page — its name, its icon, its colour, the fonts it
 * preloads — is put here at runtime, so a filter reading the response body has
 * no text to match on.
 */

export const TITLE = 'Home';
export const ICON = '/favicon.svg';

const FONTS = ['/fonts/unbounded-latin.woff2', '/fonts/inter-latin.woff2'];

const link = (rel: string, href: string, extra: Partial<HTMLLinkElement> = {}) => {
  const tag = Object.assign(document.createElement('link'), { rel, href }, extra);
  document.head.append(tag);
  return tag;
};

export function applyHead() {
  document.title = TITLE;

  // Settings looks this up by id when the tab disguise is applied or reset.
  link('icon', ICON, { id: 'favicon', type: 'image/svg+xml' });

  const colour = document.createElement('meta');
  colour.name = 'theme-color';
  colour.content = '#05060a';
  document.head.append(colour);

  for (const href of FONTS) link('preload', href, { as: 'font', type: 'font/woff2', crossOrigin: '' });
}
