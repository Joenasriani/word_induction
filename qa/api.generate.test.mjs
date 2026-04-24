import test from 'node:test';
import assert from 'node:assert/strict';

const originalFetch = global.fetch;
const originalEnv = { ...process.env };

function makeRes() {
  return {
    statusCode: null,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

async function loadHandler() {
  const mod = await import('../api/generate.js');
  return mod.default;
}

test.afterEach(() => {
  global.fetch = originalFetch;
  process.env = { ...originalEnv };
});

test('returns 405 for non-POST methods', async () => {
  const handler = await loadHandler();
  const req = { method: 'GET', body: null };
  const res = makeRes();

  await handler(req, res);

  assert.equal(res.statusCode, 405);
  assert.match(res.body.error, /method not allowed/i);
});

test('returns 400 when required fields are missing', async () => {
  const handler = await loadHandler();
  const req = { method: 'POST', body: { systemPrompt: '', userQuery: '' } };
  const res = makeRes();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /required/i);
});

test('returns 500 with configuration guidance when api key is not set', async () => {
  delete process.env.WORD_INDUCTION_API;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.OPEN_ROUTER_API_KEY;

  const handler = await loadHandler();
  const req = { method: 'POST', body: { systemPrompt: 'sys', userQuery: 'usr' } };
  const res = makeRes();

  await handler(req, res);

  assert.equal(res.statusCode, 500);
  assert.match(res.body.error, /missing OpenRouter API key/i);
});

test('sanitizes Bearer prefix and forwards successful upstream response', async () => {
  process.env.WORD_INDUCTION_API = 'Bearer my-real-key';

  let capturedAuth;
  global.fetch = async (_url, options) => {
    capturedAuth = options.headers.Authorization;
    return {
      ok: true,
      status: 200,
      json: async () => ({ id: 'chatcmpl-1', choices: [{ message: { content: 'ok' } }] })
    };
  };

  const handler = await loadHandler();
  const req = {
    method: 'POST',
    body: { systemPrompt: 'system test', userQuery: 'user test' }
  };
  const res = makeRes();

  await handler(req, res);

  assert.equal(capturedAuth, 'Bearer my-real-key');
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.id, 'chatcmpl-1');
});

test('adds troubleshooting hint for invalid key style upstream errors', async () => {
  process.env.OPENROUTER_API_KEY = 'bad-key';
  global.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: { message: 'Unauthorized' } })
  });

  const handler = await loadHandler();
  const req = {
    method: 'POST',
    body: { systemPrompt: 'system test', userQuery: 'user test' }
  };
  const res = makeRes();

  await handler(req, res);

  assert.equal(res.statusCode, 500);
  assert.match(res.body.error, /check your OpenRouter key/i);
});
