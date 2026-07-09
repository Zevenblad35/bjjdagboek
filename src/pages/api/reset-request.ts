import type { APIRoute } from 'astro';
import { createAuth } from '../../lib/auth';
import { getDB, getSecret } from '../../lib/runtime';
import { randomUUID } from 'node:crypto';

export const POST: APIRoute = async (ctx) => {
  try {
    const db = getDB();
    const { email } = await ctx.request.json();
    if (!email) return new Response('email verplicht', { status: 400 });

    // Zoek user
    const user = await db.prepare(
      'SELECT id, email FROM "user" WHERE email = ?'
    ).bind(email.toLowerCase().trim()).first<{id:string;email:string}>();

    // Altijd 200 teruggeven (security: niet onthullen of email bestaat)
    if (user) {
      // Verwijder oude verzoeken van deze user
      await db.prepare(
        'DELETE FROM password_reset_request WHERE user_id = ? AND handled = 0'
      ).bind(user.id).run();

      // Nieuw verzoek aanmaken
      await db.prepare(
        'INSERT INTO password_reset_request (id, user_id, email) VALUES (?, ?, ?)'
      ).bind(randomUUID(), user.id, user.email).run();
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
