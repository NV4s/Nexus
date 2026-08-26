// Fails the build output if a server-only secret reached the browser bundle.
//
// Only `VITE_*` variables are meant to be public, and that prefix is the entire
// secret boundary — `VITE_ADMIN_PASSWORD` would compile, deploy and publish the
// password on a public repo without a single warning. Nothing else catches that,
// so check the built output directly:  npm run build && npm run check:secrets
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = new URL('../dist', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

// A VITE_-prefixed secret name is itself the bug — that prefix is what puts a
// value in the bundle, so the name appearing at all is worth failing on.
const FORBIDDEN = [
  /VITE_ADMIN[A-Z_]*/,
  /VITE_UPSTASH[A-Z_]*/,
  /VITE_[A-Z_]*SECRET/,
  /VITE_[A-Z_]*TOKEN/,
  /VITE_[A-Z_]*PASSWORD/,
  /VITE_[A-Z_]*API_KEY/,
  /VITE_ANTHROPIC/,
  /VITE_OPENAI/,
  /VITE_GEMINI/,
  // Real credentials, recognised by their own shape.
  /sk-ant-api[0-9]{2}-/,
  /sk-proj-[A-Za-z0-9_-]{20}/,
  /AIzaSy[A-Za-z0-9_-]{30}/,
  // Server-only names matter only when something is assigned to them. The bare
  // name is legitimate in UI text — the admin panel names these variables when
  // telling the owner which one to fix — and a check that fails on documentation
  // is a check people learn to skip.
  /UPSTASH_REDIS_REST_TOKEN\s*[:=]\s*["'`]?[A-Za-z0-9_-]{16}/,
  /ADMIN_SESSION_SECRET\s*[:=]\s*["'`]?[A-Za-z0-9+/_-]{16}/,
  /ADMIN_PASSWORD\s*[:=]\s*["'`][^"'`]{3}/,
];

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (/\.(js|css|html|map)$/.test(entry.name)) yield path;
  }
}

let leaked = 0;
try {
  for await (const path of files(DIST)) {
    const text = await readFile(path, 'utf8');
    for (const pattern of FORBIDDEN) {
      const hit = text.match(pattern);
      if (hit) {
        console.error(`LEAK ${path}: ${hit[0]}`);
        leaked++;
      }
    }
  }
} catch (cause) {
  console.error(`Could not read dist/ — run "npm run build" first. (${cause.message})`);
  process.exit(2);
}

if (leaked) {
  console.error(`\n${leaked} secret reference(s) in the public bundle.`);
  process.exit(1);
}
console.log('No server-only secrets in the bundle.');
