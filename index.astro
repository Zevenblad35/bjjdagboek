import { betterAuth } from "better-auth";
import { kyselyAdapter } from "@better-auth/kysely-adapter";

export function createAuth(db: D1Database, secret: string) {
  return betterAuth({
    secret,
    database: kyselyAdapter(db as any, {
      type: "sqlite",
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    trustedOrigins: ["*"],
  });
}

export async function requireUser(request: Request, db: D1Database, secret: string) {
  const auth = createAuth(db, secret);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;
  return session.user;
}
