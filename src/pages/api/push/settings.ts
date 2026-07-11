import type { APIRoute } from 'astro';
import { createAuth } from '../../../lib/auth';
import { getDB, getSecret } from '../../../lib/runtime';

export const GET: APIRoute = async (ctx) => {
  try {
    const db = getDB();
    const auth = createAuth(db, getSecret());
    const session = await auth.api.getSession({ headers: ctx.request.headers });
    if (!session?.user) return new Response('Niet ingelogd', { status: 401 });

    const s = await db.prepare('SELECT * FROM notification_settings WHERE user_id = ?')
      .bind(session.user.id).first<{reminder_days:number;push_enabled:number}>();

    return new Response(JSON.stringify({
      reminder_days: s?.reminder_days ?? 3,
      push_enabled: s?.push_enabled ?? 0,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const POST: APIRoute = async (ctx) => {
  try {
    const db = getDB();
    const auth = createAuth(db, getSecret());
    const session = await auth.api.getSession({ headers: ctx.request.headers });
    if (!session?.user) return new Response('Niet ingelogd', { status: 401 });

    const { reminder_days } = await ctx.request.json();
    await db.prepare(`
      INSERT INTO notification_settings (user_id, reminder_days)
      VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET reminder_days=excluded.reminder_days, updated_at=unixepoch()
    `).bind(session.user.id, reminder_days ?? 3).run();

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
