import type { APIRoute } from 'astro';
import { createAuth } from '../../../lib/auth';
import { getDB, getSecret } from '../../../lib/runtime';

export const POST: APIRoute = async (ctx) => {
  try {
    const db = getDB();
    const auth = createAuth(db, getSecret());
    const session = await auth.api.getSession({ headers: ctx.request.headers });
    if (!session?.user) return new Response('Niet ingelogd', { status: 401 });

    const { technique_id, notes } = await ctx.request.json();
    if (!technique_id) return new Response('technique_id verplicht', { status: 400 });

    // Toggle: als al favoriet, verwijder; anders voeg toe
    const existing = await db.prepare(
      'SELECT 1 FROM technique_favorite WHERE user_id = ? AND technique_id = ?'
    ).bind(session.user.id, technique_id).first();

    if (existing) {
      await db.prepare(
        'DELETE FROM technique_favorite WHERE user_id = ? AND technique_id = ?'
      ).bind(session.user.id, technique_id).run();
      return new Response(JSON.stringify({ favorited: false }), { status: 200 });
    } else {
      await db.prepare(
        'INSERT INTO technique_favorite (user_id, technique_id, notes) VALUES (?, ?, ?)'
      ).bind(session.user.id, technique_id, notes || null).run();
      return new Response(JSON.stringify({ favorited: true }), { status: 200 });
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
