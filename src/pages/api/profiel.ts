import type { APIRoute } from 'astro';
import { requireUser } from '../../lib/auth';
import { randomUUID } from 'node:crypto';

export const POST: APIRoute = async (ctx) => {
  const db = ctx.locals.runtime?.env?.DB;
  const secret = ctx.locals.runtime?.env?.BETTER_AUTH_SECRET ?? 'dev-secret-change-me';
  if (!db) return new Response('DB niet beschikbaar', { status: 500 });
  const user = await requireUser(ctx.request.clone(), db, secret);
  if (!user) return new Response('Niet ingelogd', { status: 401 });

  const body = await ctx.request.json();
  const { belt = 'white', stripes = 0, gym = null } = body;

  await db.prepare(
    `INSERT INTO profile (user_id, belt, stripes, gym) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET belt=excluded.belt, stripes=excluded.stripes, gym=excluded.gym`
  ).bind(user.id, belt, stripes, gym).run();

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
