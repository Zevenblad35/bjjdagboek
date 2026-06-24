import type { APIRoute } from 'astro';
import { createAuth } from '../../../lib/auth';
import { getDB, getSecret } from '../../../lib/runtime';

export const ALL: APIRoute = async (ctx) => {
  try {
    const db = getDB();
    const secret = getSecret();
    const auth = createAuth(db, secret);
    return auth.handler(ctx.request);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
