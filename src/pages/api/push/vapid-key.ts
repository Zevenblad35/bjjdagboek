import type { APIRoute } from 'astro';

const VAPID_PUBLIC_KEY = 'BPh37AhOhaD7xsvwlyyG47DGuh9gPsVqRHHupUCo8kSuY1EsnlGAE5jvsjcgH3Kl1_uifLl0-lsyyd5elwCWo_s';

export const GET: APIRoute = () => {
  return new Response(JSON.stringify({ key: VAPID_PUBLIC_KEY }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
