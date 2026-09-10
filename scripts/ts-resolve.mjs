


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
      } catch {}
    }
    return next(specifier, context);
  },
});
