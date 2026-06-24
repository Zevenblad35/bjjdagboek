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
  const { type, date, duration_min, location, went_well, struggled_with, notes, tags = [] } = body;

  if (!type || !date) return new Response('type en date zijn verplicht', { status: 400 });

  const id = randomUUID();

  await db.prepare(
    `INSERT INTO entry (id, user_id, type, date, duration_min, location, went_well, struggled_with, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, user.id, type, date, duration_min ?? null, location ?? null, went_well ?? null, struggled_with ?? null, notes ?? null).run();

  for (const tag of tags) {
    await db.prepare('INSERT INTO entry_tag (id, entry_id, tag) VALUES (?, ?, ?)')
      .bind(randomUUID(), id, tag).run();
  }

  return new Response(JSON.stringify({ id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
};
