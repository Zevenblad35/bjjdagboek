import { cpSync, mkdirSync, copyFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

console.log('Postbuild: Cloudflare Pages structuur opbouwen...');

const dist = './dist';
const client = './dist/client';
const server = './dist/server';

// Kopieer alle static assets van dist/client naar dist root
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

// Maak _worker.js die de entry importeert
// Dit is de correcte manier voor Cloudflare Pages SSR
import { readFileSync, writeFileSync } from 'fs';
const entry = readFileSync(join(server, 'entry.mjs'), 'utf-8');

// Pas de chunk imports aan (relatieve paden vanuit dist root)
const fixed = entry
  .replace(/from "\.\/chunks\//g, 'from "./chunks/')
  .replace(/from "\.\/virtual_astro_middleware\.mjs"/g, 'from "./virtual_astro_middleware.mjs"');

writeFileSync(join(dist, '_worker.js'), fixed);
console.log('_worker.js aangemaakt in dist/');

// Voeg _routes.json toe zodat alles via de worker gaat
const routes = {
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
};
writeFileSync(join(dist, '_routes.json'), JSON.stringify(routes, null, 2));
console.log('_routes.json aangemaakt');

console.log('Postbuild klaar!');
