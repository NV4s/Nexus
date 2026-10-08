/**
 * The app renders inside a closed shadow root (src/main.tsx). Code that has to
 * reach into it — adopting a third-party stylesheet, handing an element to a
 * library that only takes a selector — gets it from here.
 */

let root: ShadowRoot | null = null;

export const setShadowRoot = (next: ShadowRoot) => {
  root = next;
};

export const shadowRoot = () => root;

/** Adds a stylesheet to the shadow tree. Document styles do not reach inside it. */
export function adoptStyles(css: string) {
  const target = root;
  if (!target) return;
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  target.adoptedStyleSheets = [...target.adoptedStyleSheets, sheet];
}
