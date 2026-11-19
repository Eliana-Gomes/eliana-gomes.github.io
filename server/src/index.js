// Parlia — servidor (Cloudflare Worker). Guarda a chave da Anthropic como segredo e controla o uso.
// Segredos (só pelo painel da Cloudflare, nunca no código): ANTHROPIC_API_KEY, TURNSTILE_SECRET, SESSION_SECRET.
// Rotas: POST /api/session (Turnstile → token de sessão de 12 h), POST /api/chat (repassa à Anthropic),
//        GET /api/stats (contagem e custo por dia, sem conteúdo), GET /api/health.

export const MODELS = { // US$ por milhão de tokens: [entrada, saída, leitura do cache, escrita no cache]
  'claude-haiku-5-5': [0.10, 0.50, 0.01, 0.125],
  'claude-sonnet-5-5': [2, 10, 0.10, 2.5],
};
export const LIMITS = { maxTokens: 1024, maxBody: 24 * 1024, maxMessages: 60, sessionHours: 12, perDevice: 300, perIp: 600, dailyBudgetUsd: 1.00 };
const THINKING_OK = ['disabled', 'between_tools'];
const DEVICE_RE = /^[A-Za-z0-9_-]{16,64}$/;

// ── utilidades ──
const enc = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
export const today = () => new Date().toISOString().slice(0, 10); // dia em UTC

function cors(env, origin) {
  const h = { 'Vary': 'Origin' };
  if (origin && origin === env.ALLOWED_ORIGIN) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS';
    h['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    h['Access-Control-Max-Age'] = '86400';
  }
  return h;
}
function json(body, status, env, origin) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(env, origin) } });
}
// Erro com um código claro para o app: { error: { type: 'parlia_…', code } }.
const fail = (type, code, status, env, origin) => json({ error: { type, code } }, status, env, origin);

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function signSession(secret, device, now = Date.now()) {
  const payload = b64u(enc.encode(JSON.stringify({ d: device, exp: now + LIMITS.sessionHours * 3600e3 })));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(payload));
  return payload + '.' + b64u(sig);
}
export async function verifySession(secret, token, now = Date.now()) {
  if (!token || typeof token !== 'string' || token.split('.').length !== 2) return null;
  const [payload, sig] = token.split('.');
  let ok = false;
  try { ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), unb64u(sig), enc.encode(payload)); } catch (e) { return null; }
  if (!ok) return null;
  let p; try { p = JSON.parse(new TextDecoder().decode(unb64u(payload))); } catch (e) { return null; }
  if (!p || !DEVICE_RE.test(p.d || '') || !(p.exp > now)) return null;
  return p;
}
// Compara dois segredos sem revelar pelo tempo onde diferem (resumos SHA-256 comparados byte a byte). Segredo vazio = nunca.
async function sameSecret(secret, given) {
  if (!secret || typeof given !== 'string' || !given) return false;
  const [a, b] = await Promise.all([secret, given].map(s => crypto.subtle.digest('SHA-256', enc.encode(s))));
  const x = new Uint8Array(a), y = new Uint8Array(b); let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}
// O IP nunca é guardado: só um resumo (SHA-256 com o segredo), que muda se o segredo mudar.
async function ipHash(secret, ip) {
  return b64u(await crypto.subtle.digest('SHA-256', enc.encode(secret + '|' + (ip || '?')))).slice(0, 22);
}
export function costUsd(model, u) {
  const p = MODELS[model]; if (!p || !u) return 0;
  return ((u.input_tokens || 0) * p[0] + (u.output_tokens || 0) * p[1] + (u.cache_read_input_tokens || 0) * p[2] + (u.cache_creation_input_tokens || 0) * p[3]) / 1e6;
}

// Só os campos que o app usa: model, max_tokens, thinking, system, messages (texto, com cache_control opcional).
function textBlocksOk(v) {
  if (typeof v === 'string') return true;
  return Array.isArray(v) && v.length > 0 && v.every(b => b && typeof b === 'object' && b.type === 'text' && typeof b.text === 'string'
    && Object.keys(b).every(k => k === 'type' || k === 'text' || k === 'cache_control')
    && (b.cache_control === undefined || (b.cache_control && b.cache_control.type === 'ephemeral' && Object.keys(b.cache_control).length === 1)));
}
export function checkBody(b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return 'fields';
  if (!Object.keys(b).every(k => ['model', 'max_tokens', 'thinking', 'system', 'messages'].includes(k))) return 'fields';
  if (!MODELS[b.model]) return 'model';
  if (!Number.isInteger(b.max_tokens) || b.max_tokens < 1 || b.max_tokens > LIMITS.maxTokens) return 'max_tokens';
  if (b.thinking !== undefined && !(b.thinking && THINKING_OK.includes(b.thinking.type) && Object.keys(b.thinking).length === 1)) return 'thinking';
  if (b.system !== undefined && !textBlocksOk(b.system)) return 'system';
  if (!Array.isArray(b.messages) || !b.messages.length || b.messages.length > LIMITS.maxMessages) return 'messages';
  if (!b.messages.every(m => m && (m.role === 'user' || m.role === 'assistant') && Object.keys(m).length === 2 && textBlocksOk(m.content))) return 'messages';
  return '';
}

async function limiter(env, path, data) {
  const stub = env.LIMITER.get(env.LIMITER.idFromName('global'));
  const r = await stub.fetch('https://limiter' + path, { method: 'POST', body: JSON.stringify(data || {}) });
  return r.json();
}

// ── rotas ──
async function session(req, env, origin) {
  let b; try { b = await req.json(); } catch (e) { return fail('parlia_bad_request', 'json', 400, env, origin); }
  if (!b || !DEVICE_RE.test(b.device || '') || typeof b.turnstile !== 'string' || !b.turnstile) return fail('parlia_bad_request', 'fields', 400, env, origin);
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET);
  form.append('response', b.turnstile);
  const ip = req.headers.get('CF-Connecting-IP'); if (ip) form.append('remoteip', ip);
  let ok = false;
  try { const v = await (await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })).json(); ok = v && v.success === true; } catch (e) { ok = false; }
  if (!ok) { await limiter(env, '/note', { what: 'turnstile_fail' }); return fail('parlia_forbidden', 'turnstile', 403, env, origin); }
  const token = await signSession(env.SESSION_SECRET, b.device);
  return json({ session: token, expiresInHours: LIMITS.sessionHours }, 200, env, origin);
}

async function chat(req, env, origin) {
  const auth = req.headers.get('Authorization') || '';
  const s = await verifySession(env.SESSION_SECRET, auth.replace(/^Bearer\s+/i, ''));
  if (!s) return fail('parlia_session', 'session', 401, env, origin);
  const len = +(req.headers.get('Content-Length') || 0);
  if (len > LIMITS.maxBody) return fail('parlia_bad_request', 'too_large', 413, env, origin);
  const raw = await req.text();
  if (enc.encode(raw).length > LIMITS.maxBody) return fail('parlia_bad_request', 'too_large', 413, env, origin);
  let b; try { b = JSON.parse(raw); } catch (e) { return fail('parlia_bad_request', 'json', 400, env, origin); }
  const bad = checkBody(b);
  if (bad) return fail('parlia_bad_request', bad, 400, env, origin);
  const lim = await limiter(env, '/check', { device: s.d, ip: await ipHash(env.SESSION_SECRET, req.headers.get('CF-Connecting-IP')) });
  if (!lim.ok) return fail('parlia_limit', lim.code, 429, env, origin);
  let res, data;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(b),
    });
    data = await res.json();
  } catch (e) { return fail('parlia_upstream', 'unavailable', 502, env, origin); }
  if (data && data.usage) await limiter(env, '/cost', { model: b.model, usd: costUsd(b.model, data.usage) });
  if (!res.ok) return json({ error: { type: 'parlia_upstream', code: 'status_' + res.status, upstream: data && data.error && data.error.type } }, res.status >= 500 ? 502 : res.status, env, origin);
  return json(data, 200, env, origin);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), origin = req.headers.get('Origin') || '';
    if (url.pathname === '/api/health') return json({ ok: true }, 200, env, origin);
    // Uso do dia: só com a chave de leitura (segredo STATS_KEY); sem ela, 404 (como se não existisse).
    if (url.pathname === '/api/stats' && req.method === 'GET') {
      if (!(await sameSecret(env.STATS_KEY, url.searchParams.get('key')))) return new Response('Not found', { status: 404 });
      return new Response(JSON.stringify(await limiter(env, '/stats'), null, 2), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    if (origin !== env.ALLOWED_ORIGIN) return fail('parlia_forbidden', 'origin', 403, env, origin);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env, origin) });
    if (req.method !== 'POST') return fail('parlia_bad_request', 'method', 405, env, origin);
    try {
      if (url.pathname === '/api/session') return await session(req, env, origin);
      if (url.pathname === '/api/chat') return await chat(req, env, origin);
    } catch (e) { return fail('parlia_server', 'internal', 500, env, origin); }
    return fail('parlia_bad_request', 'not_found', 404, env, origin);
  },
};

// ── Limites e registos (um só Durable Object, "global"): contagem por aparelho e por IP (resumo), custo do dia.
// Guarda só números por dia: nunca o conteúdo das conversas. Os contadores de dias anteriores são apagados.
export class Limiter {
  constructor(state, env) { this.st = state.storage; this.env = env; }
  async fetch(req) {
    const path = new URL(req.url).pathname, b = await req.json().catch(() => ({})), day = today();
    const gk = 'g:' + day;
    const g = (await this.st.get(gk)) || { calls: 0, costUsd: 0, refused: {}, byModel: {} };
    if (path === '/check') {
      await this.cleanup(day);
      const dk = 'd:' + day + ':' + b.device, ik = 'i:' + day + ':' + b.ip;
      const dc = (await this.st.get(dk)) || 0, ic = (await this.st.get(ik)) || 0;
      const code = g.costUsd >= LIMITS.dailyBudgetUsd ? 'daily_budget' : dc >= LIMITS.perDevice ? 'device_limit' : ic >= LIMITS.perIp ? 'ip_limit' : '';
      if (code) { g.refused[code] = (g.refused[code] || 0) + 1; await this.st.put(gk, g); return Response.json({ ok: false, code }); }
      g.calls++;
      await this.st.put({ [dk]: dc + 1, [ik]: ic + 1, [gk]: g });
      return Response.json({ ok: true });
    }
    if (path === '/cost') {
      const usd = Math.max(0, +b.usd || 0);
      g.costUsd = Math.round((g.costUsd + usd) * 1e6) / 1e6;
      if (b.model) g.byModel[b.model] = Math.round(((g.byModel[b.model] || 0) + usd) * 1e6) / 1e6;
      await this.st.put(gk, g);
      return Response.json({ ok: true });
    }
    if (path === '/note') { g.refused[b.what] = (g.refused[b.what] || 0) + 1; await this.st.put(gk, g); return Response.json({ ok: true }); }
    if (path === '/stats') {
      const days = [...(await this.st.list({ prefix: 'g:' })).entries()].map(([k, v]) => ({ day: k.slice(2), ...v })).sort((a, c) => c.day.localeCompare(a.day)).slice(0, 31);
      return Response.json({ limits: LIMITS, days });
    }
    return Response.json({ ok: false, code: 'not_found' }, { status: 404 });
  }
  // Uma vez por dia: apaga os contadores por aparelho e por IP dos dias anteriores, e os totais com mais de 62 dias.
  async cleanup(day) {
    if ((await this.st.get('cleaned')) === day) return;
    for (const p of ['d:', 'i:']) {
      const old = [...(await this.st.list({ prefix: p })).keys()].filter(k => !k.startsWith(p + day));
      for (let i = 0; i < old.length; i += 128) await this.st.delete(old.slice(i, i + 128));
    }
    const lim = new Date(Date.now() - 62 * 864e5).toISOString().slice(0, 10);
    const oldG = [...(await this.st.list({ prefix: 'g:' })).keys()].filter(k => k.slice(2) < lim);
    if (oldG.length) await this.st.delete(oldG);
    await this.st.put('cleaned', day);
  }
}
