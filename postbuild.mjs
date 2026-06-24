import { cpSync, mkdirSync, copyFileSync, existsSync, readdirSync, unlinkSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('Postbuild: Cloudflare Pages structuur opbouwen...');

const dist     = './dist';
const client   = './dist/client';
const server   = './dist/server';

// ── 1. Verwijder wrangler.jsonc/json die Astro in de repo root aanmaakt ──
for (const f of ['wrangler.jsonc', 'wrangler.json']) {
  if (existsSync(f)) { unlinkSync(f); console.log(`${f} verwijderd uit repo root`); }
}

// ── 2. Vervang dist/server/wrangler.json met een schone versie ──
//    Astro genereert hier een bestand vol ongeldige velden.
//    Cloudflare Pages leest dit bestand en crasht daarop.
//    We schrijven een minimale geldige versie.
const cleanWrangler = {
  name: "bjj-dagboek",
  compatibility_date: "2024-12-01",
  compatibility_flags: ["nodejs_compat"],
  main: "entry.mjs",
  assets: { directory: "../client" },
  d1_databases: [
    {
      binding: "DB",
      database_name: "bjj-dagboek",
      database_id: "VERVANG_MET_JOUW_DATABASE_ID"
    }
  ]
};
writeFileSync(join(server, 'wrangler.json'), JSON.stringify(cleanWrangler, null, 2));
console.log('dist/server/wrangler.json vervangen door schone versie');

// ── 3. Static assets van dist/client naar dist root ──
if (existsSync(client)) {
  for (const item of readdirSync(client)) {
    try { cpSync(join(client, item), join(dist, item), { recursive: true, force: true }); } catch(e) {}
  }
  console.log('Static assets gekopieerd naar dist/');
}

// ── 4. Server chunks naar dist ──
if (existsSync(join(server, 'chunks'))) {
  mkdirSync(join(dist, 'chunks'), { recursive: true });
  cpSync(join(server, 'chunks'), join(dist, 'chunks'), { recursive: true, force: true });
  console.log('Chunks gekopieerd naar dist/chunks/');
}

// ── 5. Virtual middleware ──
const vmw = join(server, 'virtual_astro_middleware.mjs');
if (existsSync(vmw)) copyFileSync(vmw, join(dist, 'virtual_astro_middleware.mjs'));

// ── 6. _worker.js ──
const entry = readFileSync(join(server, 'entry.mjs'), 'utf-8');
writeFileSync(join(dist, '_worker.js'), entry);
console.log('_worker.js aangemaakt in dist/');

// ── 7. _routes.json ──
writeFileSync(join(dist, '_routes.json'), JSON.stringify({
  version: 1,
  include: ['/*'],
  exclude: ['/_astro/*', '/icons/*', '/manifest.json', '/sw.js', '/favicon.ico', '/favicon.svg']
}, null, 2));
console.log('_routes.json aangemaakt');

console.log('Postbuild klaar!');
