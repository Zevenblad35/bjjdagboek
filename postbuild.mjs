import { cpSync, mkdirSync, copyFileSync, existsSync, readdirSync, unlinkSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('Postbuild: Cloudflare Pages structuur opbouwen...');

const dist = './dist';
const client = './dist/client';
const server = './dist/server';

// Verwijder wrangler.jsonc/json die Astro aanmaakt in repo root
for (const f of ['wrangler.jsonc', 'wrangler.json']) {
  if (existsSync(f)) {
    unlinkSync(f);
    console.log(`${f} verwijderd`);
  }
}

// Patch dist/server/wrangler.json: zorg dat nodejs_compat erin zit
const serverWrangler = join(server, 'wrangler.json');
if (existsSync(serverWrangler)) {
  const wCfg = JSON.parse(readFileSync(serverWrangler, 'utf-8'));
  wCfg.compatibility_flags = ['nodejs_compat'];
  wCfg.compatibility_date = '2024-12-01';
  // Zorg dat D1 binding er ook in zit (komt uit wrangler.toml)
  if (!wCfg.d1_databases?.find(d => d.binding === 'DB')) {
    wCfg.d1_databases = wCfg.d1_databases || [];
    // Database ID wordt gelezen uit Cloudflare Pages settings
  }
  writeFileSync(serverWrangler, JSON.stringify(wCfg, null, 2));
  console.log('dist/server/wrangler.json gepatcht met nodejs_compat');
}

// Kopieer static assets van dist/client naar dist root
if (existsSync(client)) {
  for (const item of readdirSync(client)) {
    const src = join(client, item);
    const dst = join(dist, item);
    try {
      cpSync(src, dst, { recursive: true, force: true });
    } catch(e) {}
  }
  console.log('Static assets gekopieerd naar dist/');
}

// Kopieer server chunks naar dist
if (existsSync(join(server, 'chunks'))) {
  mkdirSync(join(dist, 'chunks'), { recursive: true });
  cpSync(join(server, 'chunks'), join(dist, 'chunks'), { recursive: true, force: true });
  console.log('Server chunks gekopieerd naar dist/chunks/');
}

// Kopieer virtual middleware
const vmw = join(server, 'virtual_astro_middleware.mjs');
if (existsSync(vmw)) {
  copyFileSync(vmw, join(dist, 'virtual_astro_middleware.mjs'));
}

// Maak _worker.js
const entry = readFileSync(join(server, 'entry.mjs'), 'utf-8');
writeFileSync(join(dist, '_worker.js'), entry);
console.log('_worker.js aangemaakt in dist/');

// _routes.json
const routes = {
  version: 1,
  include: ['/*'],
  exclude: ['/_astro/*', '/icons/*', '/manifest.json', '/sw.js', '/favicon.ico', '/favicon.svg']
};
writeFileSync(join(dist, '_routes.json'), JSON.stringify(routes, null, 2));
console.log('_routes.json aangemaakt');
console.log('Postbuild klaar!');
