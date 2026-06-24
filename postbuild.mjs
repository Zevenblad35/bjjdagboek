import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('Postbuild: configuratie opschonen...');

// Verwijder wrangler.jsonc die Astro aanmaakt in repo root
for (const f of ['wrangler.jsonc', 'wrangler.json']) {
  if (existsSync(f)) { unlinkSync(f); console.log(`${f} verwijderd`); }
}

// Vervang dist/server/wrangler.json met schone versie
// Cloudflare leest dit bestand om de worker te configureren
const cleanWrangler = {
  name: "bjj-dagboek",
  compatibility_date: "2024-12-01",
  compatibility_flags: ["nodejs_compat"],
  main: "entry.mjs",
  assets: {
    binding: "STATIC",
    directory: "../client"
  },
  d1_databases: [
    {
      binding: "DB",
      database_name: "bjj-dagboek",
      database_id: "VERVANG_MET_JOUW_DATABASE_ID"
    }
  ]
};

writeFileSync(
  join('dist', 'server', 'wrangler.json'),
  JSON.stringify(cleanWrangler, null, 2)
);
console.log('dist/server/wrangler.json gepatcht');
console.log('Postbuild klaar!');
