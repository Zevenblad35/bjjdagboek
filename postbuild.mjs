import { existsSync, unlinkSync, writeFileSync, cpSync, readdirSync } from 'fs';
import { join } from 'path';
import { build } from 'esbuild';

console.log('Postbuild: bundelen voor Cloudflare Pages...');

// Verwijder wrangler bestanden die Astro aanmaakt in repo root
for (const f of ['wrangler.jsonc', 'wrangler.json']) {
  if (existsSync(f)) { unlinkSync(f); console.log(`${f} verwijderd`); }
}

// Kopieer static assets van dist/client naar dist root
const client = './dist/client';
const dist = './dist';
if (existsSync(client)) {
  for (const item of readdirSync(client)) {
    try { cpSync(join(client, item), join(dist, item), { recursive: true, force: true }); } catch(e) {}
  }
  console.log('Static assets gekopieerd naar dist/');
}

// Bundel de entry + alle chunks naar één _worker.js
console.log('Worker bundelen...');
await build({
  entryPoints: ['./dist/server/entry.mjs'],
  bundle: true,
  outfile: './dist/_worker.js',
  format: 'esm',
  platform: 'browser',
  conditions: ['workerd', 'worker', 'browser'],
  // Markeer node: en cloudflare: imports als external — die zijn beschikbaar in de runtime
  external: [
    'node:*',
    'cloudflare:*',
    '__STATIC_CONTENT_MANIFEST',
  ],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  minify: false,
  logLevel: 'warning',
});
console.log('_worker.js gebundeld');

// _routes.json
writeFileSync('./dist/_routes.json', JSON.stringify({
  version: 1,
  include: ['/*'],
  exclude: [
    '/_astro/*',
    '/icons/*',
    '/manifest.json',
    '/sw.js',
    '/favicon.ico',
    '/favicon.svg',
  ]
}, null, 2));
console.log('_routes.json aangemaakt');
console.log('Postbuild klaar!');
