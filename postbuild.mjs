import { existsSync, unlinkSync, writeFileSync, cpSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { build } from 'esbuild';

console.log('Postbuild: bundelen voor Cloudflare Pages...');

// 1. Verwijder wrangler bestanden in repo root
for (const f of ['wrangler.jsonc', 'wrangler.json']) {
  if (existsSync(f)) { unlinkSync(f); console.log(`${f} verwijderd`); }
}

// 2. Vervang dist/server/wrangler.json met schone versie VOOR de esbuild stap
//    Cloudflare leest dit bestand — het origineel van Astro bevat ongeldige velden
const cleanWrangler = {
  name: "bjj-dagboek",
  compatibility_date: "2024-12-01",
  compatibility_flags: ["nodejs_compat"],
  main: "entry.mjs",
  assets: { directory: "../client" },
  d1_databases: [{
    binding: "DB",
    database_name: "bjj-dagboek",
    database_id: "VERVANG_MET_JOUW_DATABASE_ID"
  }]
};
writeFileSync('./dist/server/wrangler.json', JSON.stringify(cleanWrangler, null, 2));
console.log('dist/server/wrangler.json vervangen door schone versie');

// 3. Static assets naar dist root
if (existsSync('./dist/client')) {
  for (const item of readdirSync('./dist/client')) {
    try { cpSync(join('./dist/client', item), join('./dist', item), { recursive: true, force: true }); } catch(e) {}
  }
  console.log('Static assets gekopieerd naar dist/');
}

// 4. Bundel worker met esbuild — alles in één _worker.js
console.log('Worker bundelen...');
await build({
  entryPoints: ['./dist/server/entry.mjs'],
  bundle: true,
  outfile: './dist/_worker.js',
  format: 'esm',
  platform: 'browser',
  conditions: ['workerd', 'worker', 'browser'],
  external: ['node:*', 'cloudflare:*', '__STATIC_CONTENT_MANIFEST'],
  define: { 'process.env.NODE_ENV': '"production"' },
  minify: false,
  logLevel: 'warning',
});
console.log('_worker.js gebundeld');

// 5. _routes.json
writeFileSync('./dist/_routes.json', JSON.stringify({
  version: 1,
  include: ['/*'],
  exclude: ['/_astro/*', '/icons/*', '/manifest.json', '/sw.js', '/favicon.ico', '/favicon.svg']
}, null, 2));
console.log('_routes.json aangemaakt');
console.log('Postbuild klaar!');
