// GET /api/scrape-status?jobId=xxx
// Browser polls this to check whether n8n finished the scraping job.
// Returns { status: 'pending' | 'done' | 'error', result?, error? }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const jobId = url.searchParams.get('jobId');

  if (!jobId) {
    return new Response(JSON.stringify({ error: 'jobId obrigatório' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const value = await env.JOBS.get(`scrape:${jobId}`);
  if (!value) {
    return new Response(JSON.stringify({ status: 'not_found' }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  return new Response(value, {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
