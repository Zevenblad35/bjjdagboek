import { betterAuth } from "better-auth";

export function createAuth(db: D1Database) {
  return betterAuth({
    database: {
      type: "sqlite",
      // @ts-ignore
      db: db,
    },
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

export async function requireUser(request: Request, db: D1Database) {
  const auth = createAuth(db);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;
  return session.user;
}
