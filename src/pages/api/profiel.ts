import type { APIRoute } from 'astro';
import { createAuth } from '../../lib/auth';
import { getDB, getSecret } from '../../lib/runtime';

export const POST: APIRoute = async (ctx) => {
  try {
    const db = getDB();
    const secret = getSecret();
    const auth = createAuth(db, secret);
    const session = await auth.api.getSession({ headers: ctx.request.headers });
    if (!session?.user) return new Response('Niet ingelogd', { status: 401 });

    const { belt = 'white', stripes = 0, gym = null } = await ctx.request.json();
    await db.prepare(
      `INSERT INTO profile (user_id, belt, stripes, gym) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET belt=excluded.belt, stripes=excluded.stripes, gym=excluded.gym`
    ).bind(session.user.id, belt, stripes, gym).run();

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
