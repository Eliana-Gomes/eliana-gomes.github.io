// Teste do Worker em Node (sem Cloudflare e sem internet): Anthropic, Turnstile e o Durable Object são simulados.
// Correr: node server/test/worker.test.js
import worker, { Limiter, LIMITS, signSession } from '../src/index.js';

const ORIGIN = 'https://eliana-gomes.github.io';
class MemStorage {
  constructor() { this.m = new Map(); }
  async get(k) { return this.m.get(k); }
  async put(k, v) { if (typeof k === 'object') for (const [a, b] of Object.entries(k)) this.m.set(a, b); else this.m.set(k, v); }
  async delete(k) { (Array.isArray(k) ? k : [k]).forEach(x => this.m.delete(x)); }
  async list({ prefix }) { return new Map([...this.m].filter(([k]) => k.startsWith(prefix)).sort()); }
}
const storage = new MemStorage();
const limiterObj = new Limiter({ storage }, {});
const env = {
  ALLOWED_ORIGIN: ORIGIN, ANTHROPIC_API_KEY: 'chave-de-teste', TURNSTILE_SECRET: 'ts-teste', SESSION_SECRET: 'segredo-de-teste-123', STATS_KEY: 'leitura-teste',
  LIMITER: { idFromName: () => 'global', get: () => ({ fetch: (u, init) => limiterObj.fetch(new Request(u, init)) }) },
};
let upstream = [];
globalThis.fetch = async (url, init) => {
  if (String(url).includes('turnstile')) { const tok = init.body.get('response'); return Response.json({ success: tok === 'token-bom' }); }
  if (String(url).includes('api.anthropic.com')) {
    upstream.push({ key: init.headers['x-api-key'], body: JSON.parse(init.body) });
    return Response.json({ content: [{ type: 'text', text: 'Hallo!' }], stop_reason: 'end_turn', usage: { input_tokens: 1000, output_tokens: 100, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } });
  }
  throw new Error('rede inesperada: ' + url);
};
const call = (path, { method = 'POST', origin = ORIGIN, body, token, ip = '1.2.3.4' } = {}) => {
  const h = { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip };
  if (origin) h.Origin = origin;
  if (token) h.Authorization = 'Bearer ' + token;
  return worker.fetch(new Request('https://parlia.example' + path, { method, headers: h, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) }), env);
};
const DEV = 'aparelho-teste-0001';
const ok = { model: 'claude-haiku-5-5', max_tokens: 1024, thinking: { type: 'disabled' }, system: [{ type: 'text', text: 'You are Lia.', cache_control: { type: 'ephemeral' } }], messages: [{ role: 'user', content: 'Hallo' }] };
let fails = 0;
async function check(name, res, status, code) {
  const j = await res.json();
  const got = j.error ? j.error.code : 'ok';
  const pass = res.status === status && (code ? got === code : !j.error);
  if (!pass) fails++;
  console.log(`${pass ? '✔' : '✘'} ${name}: HTTP ${res.status} · ${j.error ? 'código ' + j.error.code : 'resposta: ' + (j.content ? j.content[0].text : JSON.stringify(j).slice(0, 80))}${res.headers.get('Access-Control-Allow-Origin') ? ' · CORS ok' : ''}`);
  return j;
}

// Sessão (Turnstile)
await check('sessão com Turnstile inválido', await call('/api/session', { body: { device: DEV, turnstile: 'token-mau' } }), 403, 'turnstile');
await check('sessão com aparelho inválido', await call('/api/session', { body: { device: 'x', turnstile: 'token-bom' } }), 400, 'fields');
const s = await check('sessão com Turnstile válido', await call('/api/session', { body: { device: DEV, turnstile: 'token-bom' } }), 200);
const T = s.session;
// Chat
upstream = [];
await check('pedido válido', await call('/api/chat', { body: ok, token: T }), 200);
console.log(`   → chave enviada à Anthropic: ${upstream[0] && upstream[0].key === 'chave-de-teste' ? 'a do segredo do Worker' : '??'}; campos: ${Object.keys(upstream[0].body).join(', ')}`);
await check('Sonnet com between_tools', await call('/api/chat', { body: { ...ok, model: 'claude-sonnet-5-5', max_tokens: 400, thinking: { type: 'between_tools' } }, token: T }), 200);
await check('modelo não permitido (Opus)', await call('/api/chat', { body: { ...ok, model: 'claude-opus-5-5' }, token: T }), 400, 'model');
await check('max_tokens alto (4096)', await call('/api/chat', { body: { ...ok, max_tokens: 4096 }, token: T }), 400, 'max_tokens');
await check('campo a mais (tools)', await call('/api/chat', { body: { ...ok, tools: [] }, token: T }), 400, 'fields');
await check('thinking ligado (adaptive)', await call('/api/chat', { body: { ...ok, thinking: { type: 'adaptive' } }, token: T }), 400, 'thinking');
await check('imagem na mensagem', await call('/api/chat', { body: { ...ok, messages: [{ role: 'user', content: [{ type: 'image', source: {} }] }] }, token: T }), 400, 'messages');
await check('pedido grande demais (30 KB)', await call('/api/chat', { body: { ...ok, messages: [{ role: 'user', content: 'a'.repeat(30 * 1024) }] }, token: T }), 413, 'too_large');
await check('origem errada', await call('/api/chat', { body: ok, token: T, origin: 'https://site-estranho.com' }), 403, 'origin');
await check('sem origem (curl)', await call('/api/chat', { body: ok, token: T, origin: '' }), 403, 'origin');
await check('sem token', await call('/api/chat', { body: ok }), 401, 'session');
await check('token falsificado', await call('/api/chat', { body: ok, token: T.slice(0, -3) + 'abc' }), 401, 'session');
await check('token expirado', await call('/api/chat', { body: ok, token: await signSession(env.SESSION_SECRET, DEV, Date.now() - 13 * 3600e3) }), 401, 'session');
await check('token assinado com outro segredo', await call('/api/chat', { body: ok, token: await signSession('outro-segredo', DEV) }), 401, 'session');
const pre = await (await call('/api/session', { method: 'OPTIONS' })).status;
console.log(`${pre === 204 ? '✔' : '✘'} pré-voo CORS (OPTIONS): HTTP ${pre}`); if (pre !== 204) fails++;
// Limite por aparelho: já houve 2 chamadas aceites; enche até 300.
const today = new Date().toISOString().slice(0, 10);
await storage.put('d:' + today + ':' + DEV, LIMITS.perDevice);
await check(`limite por aparelho (${LIMITS.perDevice}/dia)`, await call('/api/chat', { body: ok, token: T }), 429, 'device_limit');
// Outro aparelho no mesmo IP: passa; IP cheio: recusa.
const s2 = await (await call('/api/session', { body: { device: 'aparelho-teste-0002', turnstile: 'token-bom' } })).json();
await check('outro aparelho, mesmo IP', await call('/api/chat', { body: ok, token: s2.session }), 200);
const ipKey = [...storage.m.keys()].find(k => k.startsWith('i:'));
await storage.put(ipKey, LIMITS.perIp);
await check(`limite por IP (${LIMITS.perIp}/dia)`, await call('/api/chat', { body: ok, token: s2.session }), 429, 'ip_limit');
await check('outro IP', await call('/api/chat', { body: ok, token: s2.session, ip: '5.6.7.8' }), 200);
// Teto global: US$ 1,00 por dia.
const g = await storage.get('g:' + today); g.costUsd = 1.0; await storage.put('g:' + today, g);
await check('teto de gasto do dia (US$ 1,00)', await call('/api/chat', { body: ok, token: s2.session, ip: '9.9.9.9' }), 429, 'daily_budget');
// Registos
for (const [n, q, want] of [['sem chave', '', 404], ['chave errada', '?key=errada', 404], ['chave certa', '?key=leitura-teste', 200], ['chave certa com espaço no fim', '?key=leitura-teste%20', 200]]) { const r = await call('/api/stats' + q, { method: 'GET', origin: '' }); const pass = r.status === want; if (!pass) fails++; console.log(`${pass ? '✔' : '✘'} /api/stats ${n}: HTTP ${r.status}`); }
const st = await (await call('/api/stats?key=leitura-teste', { method: 'GET', origin: '' })).json();
console.log('registo do dia:', JSON.stringify(st.days[0]));
console.log('guardado no servidor (chaves):', [...storage.m.keys()].join(', '));
console.log(fails ? `\n${fails} TESTE(S) FALHARAM` : '\nTodos os testes passaram.');
process.exit(fails ? 1 : 0);
