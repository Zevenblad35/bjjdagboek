import type { APIRoute } from 'astro';
import { createAuth } from '../../lib/auth';
import { getDB, getSecret } from '../../lib/runtime';
import { randomUUID } from 'node:crypto';

export const POST: APIRoute = async (ctx) => {
  try {
    const db = getDB();
    const auth = createAuth(db, getSecret());
    const session = await auth.api.getSession({ headers: ctx.request.headers });
    if (!session?.user) return new Response('Niet ingelogd', { status: 401 });

    const body = await ctx.request.json();
    const { type, date, duration_min, location, went_well, struggled_with, notes, tags = [] } = body;
    if (!type || !date) return new Response('type en date zijn verplicht', { status: 400 });

    const id = randomUUID();
    await db.prepare(
      `INSERT INTO entry (id, user_id, type, date, duration_min, location, went_well, struggled_with, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, session.user.id, type, date, duration_min ?? null, location ?? null, went_well ?? null, struggled_with ?? null, notes ?? null).run();

    for (const tag of tags) {
      await db.prepare('INSERT INTO entry_tag (id, entry_id, tag) VALUES (?, ?, ?)')
        .bind(randomUUID(), id, tag).run();
    }

    return new Response(JSON.stringify({ id }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const PATCH: APIRoute = async (ctx) => {
  try {
    const db = getDB();
    const auth = createAuth(db, getSecret());
    const session = await auth.api.getSession({ headers: ctx.request.headers });
    if (!session?.user) return new Response('Niet ingelogd', { status: 401 });

    const body = await ctx.request.json();
    const { id, type, date, duration_min, location, went_well, struggled_with, notes, tags = [] } = body;
    if (!id) return new Response('id verplicht', { status: 400 });

    // Controleer eigenaarschap
    const existing = await db.prepare('SELECT id FROM entry WHERE id = ? AND user_id = ?')
      .bind(id, session.user.id).first();
    if (!existing) return new Response('Niet gevonden', { status: 404 });

    await db.prepare(
      `UPDATE entry SET type=?, date=?, duration_min=?, location=?, went_well=?, struggled_with=?, notes=?
       WHERE id=? AND user_id=?`
    ).bind(type, date, duration_min ?? null, location ?? null, went_well ?? null, struggled_with ?? null, notes ?? null, id, session.user.id).run();

    // Tags vervangen
    await db.prepare('DELETE FROM entry_tag WHERE entry_id = ?').bind(id).run();
    for (const tag of tags) {
      await db.prepare('INSERT INTO entry_tag (id, entry_id, tag) VALUES (?, ?, ?)')
        .bind(randomUUID(), id, tag).run();
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const DELETE: APIRoute = async (ctx) => {
  try {
    const db = getDB();
    const auth = createAuth(db, getSecret());
    const session = await auth.api.getSession({ headers: ctx.request.headers });
    if (!session?.user) return new Response('Niet ingelogd', { status: 401 });

    const { id } = await ctx.request.json();
    await db.prepare('DELETE FROM entry WHERE id = ? AND user_id = ?')
      .bind(id, session.user.id).run();

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
