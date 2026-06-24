import type { APIRoute } from 'astro';
import { createAuth } from '../../../lib/auth';

export const ALL: APIRoute = async (ctx) => {
  const db = ctx.locals.runtime?.env?.DB;
  if (!db) return new Response('Database niet beschikbaar', { status: 500 });
  const secret = ctx.locals.runtime?.env?.BETTER_AUTH_SECRET ?? 'dev-secret-change-me';
  const auth = createAuth(db, secret);
  return auth.handler(ctx.request);
};
