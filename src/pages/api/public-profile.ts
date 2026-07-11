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

    const { is_public } = await ctx.request.json();

    // Maak slug aan van naam als die nog niet bestaat
    const existing = await db.prepare(
      'SELECT public_slug FROM public_profile WHERE user_id = ?'
    ).bind(session.user.id).first<{public_slug:string}>();

    if (existing) {
      await db.prepare(
        'UPDATE public_profile SET is_public = ? WHERE user_id = ?'
      ).bind(is_public ? 1 : 0, session.user.id).run();
      return new Response(JSON.stringify({ slug: existing.public_slug }), { status: 200 });
    }

    // Genereer unieke slug van naam
    const name = session.user.name ?? 'atleet';
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
    const slug = `${base}-${randomUUID().slice(0, 6)}`;

    await db.prepare(
      'INSERT INTO public_profile (user_id, public_slug, is_public) VALUES (?, ?, ?)'
    ).bind(session.user.id, slug, is_public ? 1 : 0).run();

    return new Response(JSON.stringify({ slug }), {
      status: 201, headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
