// POST /api/report
// Dispara o workflow de relatório do n8n via webhook de produção.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const WEBHOOK_URL = 'https://minispectacledbear-n8n.cloudfy.live/webhook/instagram-report-v2';

// Planilha Mestre fixa — registra todos os projetos analisados
const REGISTRY_SHEET_ID = '1-HCFZnuITXMbLEmy02OuBWQO7_d8g-5UIkNoFYKK4oo';

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const jobId = crypto.randomUUID();
  const callbackUrl = 'https://instagram-scraper-painel.pages.dev/api/report-callback';

  await env.JOBS.put(
    `report:${jobId}`,
    JSON.stringify({ status: 'pending', startedAt: Date.now() }),
    { expirationTtl: 7200 }
  );

  try {
    const n8nResp = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, jobId, callbackUrl, registrySheetId: REGISTRY_SHEET_ID }),
      signal: AbortSignal.timeout(15000),
    });

    if (!n8nResp.ok) {
      const errText = await n8nResp.text().catch(() => String(n8nResp.status));
      await env.JOBS.put(
        `report:${jobId}`,
        JSON.stringify({ status: 'error', error: `n8n retornou ${n8nResp.status}: ${errText.slice(0, 300)}` }),
        { expirationTtl: 7200 }
      );
    }
  } catch (err) {
    await env.JOBS.put(
      `report:${jobId}`,
      JSON.stringify({ status: 'error', error: 'n8n inacessível: ' + err.message }),
      { expirationTtl: 7200 }
    );
  }

  return new Response(JSON.stringify({ jobId, status: 'pending' }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
