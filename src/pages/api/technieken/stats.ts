import type { APIRoute } from 'astro';
import { createAuth } from '../../../lib/auth';
import { getDB, getSecret } from '../../../lib/runtime';

export const GET: APIRoute = async (ctx) => {
  try {
    const db = getDB();
    const auth = createAuth(db, getSecret());
    const session = await auth.api.getSession({ headers: ctx.request.headers });
    if (!session?.user) return new Response('Niet ingelogd', { status: 401 });

    const techniqueId = ctx.url.searchParams.get('id');
    if (!techniqueId) return new Response('id verplicht', { status: 400 });

    // Haal de techniek naam op
    const tech = await db.prepare(
      'SELECT name FROM technique WHERE id = ?'
    ).bind(techniqueId).first<{name:string}>();
    if (!tech) return new Response('Niet gevonden', { status: 404 });

    // Tel hoe vaak deze tag voorkomt in sessies van deze gebruiker
    const { results: tagMatches } = await db.prepare(`
      SELECT e.date, e.type FROM entry_tag t
      JOIN entry e ON e.id = t.entry_id
      WHERE e.user_id = ? AND LOWER(t.tag) = LOWER(?)
      ORDER BY e.date DESC
    `).bind(session.user.id, tech.name).all<{date:string;type:string}>();

    // Globaal: hoe vaak door alle gebruikers
    const globalCount = await db.prepare(`
      SELECT COUNT(*) as cnt FROM entry_tag t
      WHERE LOWER(t.tag) = LOWER(?)
    `).bind(tech.name).first<{cnt:number}>();

    return new Response(JSON.stringify({
      name: tech.name,
      your_sessions: tagMatches.length,
      last_practiced: tagMatches[0]?.date ?? null,
      global_uses: globalCount?.cnt ?? 0,
      recent: tagMatches.slice(0, 5),
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
