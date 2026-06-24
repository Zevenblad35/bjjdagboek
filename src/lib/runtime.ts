// Astro 7 + @astrojs/cloudflare v14: env via cloudflare:workers
// Astro.locals.runtime.env is verwijderd — gebruik deze helper

// @ts-ignore — cloudflare:workers is beschikbaar in de Workers runtime
import { env as cfEnv } from 'cloudflare:workers';

export function getDB(): D1Database {
  const db = (cfEnv as any)?.DB;
  if (!db) throw new Error('DB binding niet gevonden. Controleer je Cloudflare Pages bindings.');
  return db;
}

export function getSecret(): string {
  return (cfEnv as any)?.BETTER_AUTH_SECRET ?? 'dev-secret-change-me';
}
