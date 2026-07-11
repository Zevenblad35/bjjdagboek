import type { APIRoute } from 'astro';
import { createAuth } from '../../../lib/auth';
import { getDB, getSecret } from '../../../lib/runtime';
import { randomUUID } from 'node:crypto';

export const POST: APIRoute = async (ctx) => {
  try {
    const db = getDB();
    const auth = createAuth(db, getSecret());
    const session = await auth.api.getSession({ headers: ctx.request.headers });
    if (!session?.user) return new Response('Niet ingelogd', { status: 401 });

    const { endpoint, keys } = await ctx.request.json();
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return new Response('Ongeldige subscription', { status: 400 });
    }

    await db.prepare(`
      INSERT INTO push_subscription (id, user_id, endpoint, p256dh, auth)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id
    `).bind(randomUUID(), session.user.id, endpoint, keys.p256dh, keys.auth).run();

    await db.prepare(`
      INSERT INTO notification_settings (user_id, push_enabled)
      VALUES (?, 1)
      ON CONFLICT(user_id) DO UPDATE SET push_enabled=1, updated_at=unixepoch()
    `).bind(session.user.id).run();

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async (ctx) => {
  try {
    const db = getDB();
    const auth = createAuth(db, getSecret());
    const session = await auth.api.getSession({ headers: ctx.request.headers });
    if (!session?.user) return new Response('Niet ingelogd', { status: 401 });

    await db.prepare('DELETE FROM push_subscription WHERE user_id = ?').bind(session.user.id).run();
    await db.prepare(`UPDATE notification_settings SET push_enabled=0 WHERE user_id=?`).bind(session.user.id).run();

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
