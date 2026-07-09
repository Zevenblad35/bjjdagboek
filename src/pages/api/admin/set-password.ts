import type { APIRoute } from 'astro';
import { createAuth } from '../../../lib/auth';
import { getDB, getSecret } from '../../../lib/runtime';
import { isAdmin } from '../../../lib/admin';
import { randomUUID } from 'node:crypto';

// Genereer een veilig tijdelijk wachtwoord
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 10; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}

export const POST: APIRoute = async (ctx) => {
  try {
    const db = getDB();
    const auth = createAuth(db, getSecret());
    const session = await auth.api.getSession({ headers: ctx.request.headers });

    if (!session?.user || !isAdmin(session.user.email)) {
      return new Response('Geen toegang', { status: 403 });
    }

    const body = await ctx.request.json();
    const { userId, requestId, customPassword } = body;
    if (!userId) return new Response('userId verplicht', { status: 400 });

    const newPassword = customPassword || generateTempPassword();

    // Update wachtwoord via Better Auth admin API
    await auth.api.setUserPassword({
      body: { userId, newPassword },
    } as any).catch(async () => {
      // Fallback: direct in account tabel updaten via Better Auth ctx
      // Better Auth slaat passwords op in de account tabel
      const { hashPassword } = await import('@better-auth/utils/password');
      const hashed = await hashPassword(newPassword);
      await db.prepare(
        `UPDATE account SET password = ? WHERE userId = ? AND providerId = 'credential'`
      ).bind(hashed, userId).run();
    });

    // Markeer verzoek als afgehandeld
    if (requestId) {
      await db.prepare(
        'UPDATE password_reset_request SET handled = 1, handled_at = unixepoch() WHERE id = ?'
      ).bind(requestId).run();
    }

    return new Response(JSON.stringify({ ok: true, newPassword }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
