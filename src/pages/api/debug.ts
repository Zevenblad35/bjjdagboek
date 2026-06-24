import type { APIRoute } from 'astro';

export const GET: APIRoute = async (ctx) => {
  const env = ctx.locals.runtime?.env;
  const info = {
    hasRuntime: !!ctx.locals.runtime,
    hasEnv: !!env,
    hasDB: !!env?.DB,
    hasSecret: !!env?.BETTER_AUTH_SECRET,
    dbType: env?.DB ? typeof env.DB : 'undefined',
    envKeys: env ? Object.keys(env) : [],
  };
  return new Response(JSON.stringify(info, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
};
