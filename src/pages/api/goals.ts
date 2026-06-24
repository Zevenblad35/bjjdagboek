import type { APIRoute } from 'astro';
import { requireUser } from '../../lib/auth';
import { randomUUID } from 'crypto';

export const POST: APIRoute = async (ctx) => {
  const db = ctx.locals.runtime?.env?.DB;
  const secret = ctx.locals.runtime?.env?.BETTER_AUTH_SECRET ?? 'dev-secret-change-me';
  if (!db) return new Response('DB niet beschikbaar', { status: 500 });
  const user = await requireUser(ctx.request.clone(), db, secret);
  if (!user) return new Response('Niet ingelogd', { status: 401 });

  const { title, category = 'techniek' } = await ctx.request.json();
  if (!title) return new Response('title verplicht', { status: 400 });

  const id = randomUUID();
  await db.prepare(
    'INSERT INTO goal (id, user_id, title, category) VALUES (?, ?, ?, ?)'
  ).bind(id, user.id, title, category).run();

  return new Response(JSON.stringify({ id }), { status: 201 });
};

export const PATCH: APIRoute = async (ctx) => {
  const db = ctx.locals.runtime?.env?.DB;
  const secret = ctx.locals.runtime?.env?.BETTER_AUTH_SECRET ?? 'dev-secret-change-me';
  if (!db) return new Response('DB niet beschikbaar', { status: 500 });
  const user = await requireUser(ctx.request.clone(), db, secret);
  if (!user) return new Response('Niet ingelogd', { status: 401 });

  const { id, status } = await ctx.request.json();
  const completedAt = status === 'klaar' ? Math.floor(Date.now()/1000) : null;
  await db.prepare(
    'UPDATE goal SET status=?, completed_at=? WHERE id=? AND user_id=?'
  ).bind(status, completedAt, id, user.id).run();

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
