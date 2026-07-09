import type { APIRoute } from 'astro';
import { createAuth } from '../../../lib/auth';
import { getDB, getSecret } from '../../../lib/runtime';
import { isAdmin } from '../../../lib/admin';

export const POST: APIRoute = async (ctx) => {
  try {
    const db = getDB();
    const auth = createAuth(db, getSecret());
    const session = await auth.api.getSession({ headers: ctx.request.headers });

    if (!session?.user || !isAdmin(session.user.email)) {
      return new Response('Geen toegang', { status: 403 });
    }

    const { keepId, mergeId, newName } = await ctx.request.json();
    if (!keepId || !mergeId) return new Response('keepId en mergeId verplicht', { status: 400 });

    // Hernoem de te bewaren techniek
    if (newName) {
      await db.prepare('UPDATE technique SET name = ? WHERE id = ?').bind(newName, keepId).run();
    }

    // Verplaats favorieten van merge naar keep (als ze niet al favoriet zijn)
    await db.prepare(
      `INSERT OR IGNORE INTO technique_favorite (user_id, technique_id, notes, created_at)
       SELECT user_id, ?, notes, created_at FROM technique_favorite WHERE technique_id = ?`
    ).bind(keepId, mergeId).run();

    // Verwijder oude favorieten
    await db.prepare('DELETE FROM technique_favorite WHERE technique_id = ?').bind(mergeId).run();

    // Markeer de oude techniek als samengevoegd
    await db.prepare('UPDATE technique SET merged_into = ? WHERE id = ?').bind(keepId, mergeId).run();

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
