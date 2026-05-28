const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const KV_KEY = 'config:global';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ env }) {
  try {
    const raw = await env.JOBS.get(KV_KEY);
    const config = raw
      ? JSON.parse(raw)
      : { geminiKey: '', apifyKeys: [] };
    return new Response(JSON.stringify(config), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Lê config existente e faz merge (para não sobrescrever campos não enviados)
    const raw = await env.JOBS.get(KV_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    const merged = {
      geminiKey:
        body.geminiKey !== undefined ? body.geminiKey : (existing.geminiKey || ''),
      apifyKeys:
        body.apifyKeys !== undefined ? body.apifyKeys : (existing.apifyKeys || []),
    };
    await env.JOBS.put(KV_KEY, JSON.stringify(merged));
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
}
