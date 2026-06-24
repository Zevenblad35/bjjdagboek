import { betterAuth } from "better-auth";
import { kyselyAdapter } from "@better-auth/kysely-adapter";
import { Kysely, SqliteAdapter, SqliteQueryCompiler } from "kysely";

// Custom D1 dialect die statisch geïmporteerd is
// Dit werkt correct na esbuild bundeling (geen dynamic imports)
class D1Driver {
  #db: D1Database;
  #conn: D1Connection | null = null;

  constructor(db: D1Database) {
    this.#db = db;
  }

  async init() {
    this.#conn = new D1Connection(this.#db);
  }

  async acquireConnection() {
    return this.#conn!;
  }

  async releaseConnection() {}

  async beginTransaction() {
    throw new Error('D1 ondersteunt geen interactieve transacties');
  }

  async commitTransaction() {}
  async rollbackTransaction() {}
  async destroy() {}
}

class D1Connection {
  #db: D1Database;

  constructor(db: D1Database) {
    this.#db = db;
  }

  async executeQuery(query: { sql: string; parameters: readonly unknown[] }) {
    const result = await this.#db
      .prepare(query.sql)
      .bind(...query.parameters)
      .all();

    return {
      rows: result.results ?? [],
      numAffectedRows: BigInt(result.meta?.changes ?? 0),
      insertId: result.meta?.last_row_id !== undefined && result.meta.last_row_id !== null
        ? BigInt(result.meta.last_row_id)
        : undefined,
    };
  }

  async *streamQuery(): AsyncGenerator<never> {
    throw new Error('D1 ondersteunt geen streaming queries');
  }
}

class D1Dialect {
  #db: D1Database;

  constructor(db: D1Database) {
    this.#db = db;
  }

  createAdapter() {
    return new SqliteAdapter();
  }

  createDriver() {
    return new D1Driver(this.#db);
  }

  createIntrospector(db: Kysely<any>) {
    return {
      getSchemas: async () => [],
      getTables: async () => [],
      getMetadata: async () => ({ tables: [] }),
    };
  }

  createQueryCompiler() {
    return new SqliteQueryCompiler();
  }
}

export function createAuth(db: D1Database, secret: string) {
  const kysely = new Kysely({ dialect: new D1Dialect(db) as any });

  return betterAuth({
    secret,
    baseURL: 'https://bjjdagboek.nl',
    database: kyselyAdapter(kysely, {
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
