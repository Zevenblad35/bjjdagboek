import type { APIRoute } from 'astro';
import { createAuth } from '../../../lib/auth';
import { getDB, getSecret } from '../../../lib/runtime';
import { randomUUID } from 'node:crypto';

// GET: zoek technieken
export const GET: APIRoute = async (ctx) => {
  try {
    const db = getDB();
    const auth = createAuth(db, getSecret());
    const session = await auth.api.getSession({ headers: ctx.request.headers });
    if (!session?.user) return new Response('Niet ingelogd', { status: 401 });

    const q = ctx.url.searchParams.get('q') || '';
    const cat = ctx.url.searchParams.get('cat') || '';

    let sql = `SELECT t.*, u.name as added_by_name,
               EXISTS(SELECT 1 FROM technique_favorite f WHERE f.technique_id = t.id AND f.user_id = ?) as is_favorite
               FROM technique t
               LEFT JOIN "user" u ON u.id = t.added_by
               WHERE t.merged_into IS NULL`;
    const params: any[] = [session.user.id];

    if (q) { sql += ' AND LOWER(t.name) LIKE ?'; params.push(`%${q.toLowerCase()}%`); }
    if (cat) { sql += ' AND LOWER(t.category) = ?'; params.push(cat.toLowerCase()); }

    sql += ' ORDER BY t.name ASC LIMIT 50';

    const { results } = await db.prepare(sql).bind(...params).all();
    return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

// POST: voeg techniek toe
export const POST: APIRoute = async (ctx) => {
  try {
    const db = getDB();
    const auth = createAuth(db, getSecret());
    const session = await auth.api.getSession({ headers: ctx.request.headers });
    if (!session?.user) return new Response('Niet ingelogd', { status: 401 });

    const { name, description, category, youtube_url } = await ctx.request.json();
    if (!name?.trim()) return new Response('naam verplicht', { status: 400 });

    // Check of techniek al bestaat (case-insensitive)
    const existing = await db.prepare(
      'SELECT id FROM technique WHERE LOWER(name) = ? AND merged_into IS NULL'
    ).bind(name.toLowerCase().trim()).first<{id:string}>();

    if (existing) {
      return new Response(JSON.stringify({ id: existing.id, existing: true }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    const id = randomUUID();
    await db.prepare(
      'INSERT INTO technique (id, name, description, category, youtube_url, added_by) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, name.trim(), description || null, category?.trim() || null, youtube_url || null, session.user.id).run();

    return new Response(JSON.stringify({ id, existing: false }), {
      status: 201, headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
