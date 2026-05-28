// POST /api/scrape-callback
// Called by n8n at the END of the scraper workflow with the final result (or error).
// Stores result in KV so the browser polling /api/scrape-status can pick it up.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('JSON inválido', { status: 400 });
  }

  const { jobId, result, error } = body;
  if (!jobId) {
    return new Response('jobId obrigatório', { status: 400 });
  }

  const payload = error
    ? { status: 'error', error, finishedAt: Date.now() }
    : { status: 'done', result, finishedAt: Date.now() };

  await env.JOBS.put(`scrape:${jobId}`, JSON.stringify(payload), {
    expirationTtl: 7200,
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
