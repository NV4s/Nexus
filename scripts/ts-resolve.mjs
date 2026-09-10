// Vercel's functions import each other with a .js specifier even though the
// files on disk are .ts. Node resolves that literally, so the tests need this
// one hook to point those back at the source.
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && specifier.endsWith('.js')) {
      try {
        const asTs = new URL(specifier.replace(/\.js$/, '.ts'), context.parentURL);
        if (existsSync(fileURLToPath(asTs))) {
          return next(specifier.replace(/\.js$/, '.ts'), context);
        }
      } catch {
        /* fall through to the ordinary resolution */
      }
    }
    return next(specifier, context);
  },
});
