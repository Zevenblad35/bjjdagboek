import type { APIRoute } from 'astro';
import { createAuth } from '../../../lib/auth';

export const ALL: APIRoute = async (ctx) => {
  const db = ctx.locals.runtime?.env?.DB;
  if (!db) return new Response('Database niet beschikbaar', { status: 500 });
  const auth = createAuth(db);
  return auth.handler(ctx.request);
};
