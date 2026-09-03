// Minimal JsonFabrica API client for the examples in this repo.
// No dependencies — uses global fetch (Node 18+).
//
// Env:
//   JSONFABRICA_API_KEY   required
//   JSONFABRICA_API_URL   optional, default https://api.jsonfabrica.com

// Load .env if present (no dependency — Node's --env-file isn't on every version).
try {
  const { readFileSync } = await import('node:fs');
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* no .env — rely on real environment */ }

const BASE = (process.env.JSONFABRICA_API_URL || 'https://api.jsonfabrica.com').replace(/\/$/, '');
const KEY = process.env.JSONFABRICA_API_KEY;

if (!KEY) {
  console.error('JSONFABRICA_API_KEY is not set. Copy .env.example to .env and fill it in, or export it.');
  process.exit(1);
}

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${KEY}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    const msg = json?.message || json?.error?.message || res.statusText;
    throw new Error(`${method} ${path} -> ${res.status}: ${msg}`);
  }
  return json;
}

/** Create a template. `body` is the raw template string (JSON with <fn()> placeholders). */
export async function createTemplate(name, body) {
  const dto = await api('/v1/templates', { method: 'POST', body: { name, body } });
  // create-only response is a plain TemplateDto
  const id = dto.templateId || dto.template?.templateId;
  if (!id) throw new Error(`createTemplate('${name}'): no templateId in response`);
  return id;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Run a batch. Handles both the synchronous (small batch, 200 + results)
 * and asynchronous (larger batch, 202 + poll) responses.
 * Returns documents grouped by alias: { alias: [result, result, ...] }.
 */
export async function runBatch(spec, { pollMs = 1500, timeoutMs = 120000 } = {}) {
  const submit = await api('/v1/batches', { method: 'POST', body: spec });

  let docs;
  if (Array.isArray(submit.results)) {
    docs = submit.results; // synchronous
  } else {
    const batchId = submit.batchId;
    const deadline = Date.now() + timeoutMs;
    let batch;
    do {
      await sleep(pollMs);
      batch = await api(`/v1/batches/${encodeURIComponent(batchId)}`);
      if (batch.status === 'failed') {
        throw new Error(`batch ${batchId} failed: ${batch.error?.message || 'unknown'}`);
      }
    } while (batch.status !== 'completed' && Date.now() < deadline);
    if (batch.status !== 'completed') throw new Error(`batch ${batchId} timed out after ${timeoutMs}ms`);
    docs = batch.documents;
  }

  const byAlias = {};
  for (const d of docs) {
    (byAlias[d.alias] ??= []).push(d.result);
  }
  return byAlias;
}
