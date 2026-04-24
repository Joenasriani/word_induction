#!/usr/bin/env node

const baseUrl = process.env.WORD_INDUCTION_BASE_URL || 'https://word-induction.vercel.app';

const tests = [
  {
    id: 'root-page-available',
    area: 'E2E / Routing',
    description: 'Root page is reachable and returns HTML',
    run: async () => {
      const res = await fetch(`${baseUrl}/`);
      const body = await res.text();
      const contentType = res.headers.get('content-type') || '';

      const pass = res.ok && contentType.includes('text/html') && body.length > 0;
      return {
        pass,
        details: `status=${res.status}, content-type=${contentType || 'n/a'}, bytes=${body.length}`
      };
    }
  },
  {
    id: 'api-method-guard',
    area: 'API / Error handling',
    description: 'GET /api/generate is rejected with 405',
    run: async () => {
      const res = await fetch(`${baseUrl}/api/generate`);
      const json = await res.json().catch(() => ({}));
      const pass = res.status === 405 && /method not allowed/i.test(String(json.error || ''));
      return {
        pass,
        details: `status=${res.status}, error=${json.error || 'n/a'}`
      };
    }
  },
  {
    id: 'api-required-fields',
    area: 'API / Input validation',
    description: 'POST /api/generate enforces required systemPrompt and userQuery',
    run: async () => {
      const res = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt: '', userQuery: '' })
      });
      const json = await res.json().catch(() => ({}));
      const pass = res.status === 400 && /required/i.test(String(json.error || ''));
      return {
        pass,
        details: `status=${res.status}, error=${json.error || 'n/a'}`
      };
    }
  },
  {
    id: 'api-missing-key-path',
    area: 'Integration / Config',
    description: 'POST /api/generate returns explicit server config error if upstream key is missing',
    run: async () => {
      const res = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: 'Return one word',
          userQuery: 'test'
        })
      });
      const json = await res.json().catch(() => ({}));
      const message = String(json.error || '');
      const pass = (res.status === 200) || (res.status === 500 && /api key|configuration/i.test(message));
      return {
        pass,
        details: `status=${res.status}, error=${message || 'n/a'}`
      };
    }
  }
];

function icon(pass) {
  return pass ? 'PASS' : 'FAIL';
}

async function runAll() {
  const startedAt = new Date().toISOString();
  const results = [];

  for (const test of tests) {
    const t0 = Date.now();
    try {
      const outcome = await test.run();
      results.push({
        ...test,
        pass: !!outcome.pass,
        details: outcome.details,
        durationMs: Date.now() - t0
      });
    } catch (error) {
      results.push({
        ...test,
        pass: false,
        details: `threw: ${error.message}`,
        durationMs: Date.now() - t0
      });
    }
  }

  const passed = results.filter(r => r.pass).length;
  const failed = results.length - passed;

  const report = {
    baseUrl,
    startedAt,
    finishedAt: new Date().toISOString(),
    summary: {
      total: results.length,
      passed,
      failed
    },
    results
  };

  console.log(`Validation target: ${baseUrl}`);
  for (const result of results) {
    console.log(`[${icon(result.pass)}] ${result.id} (${result.area}) - ${result.details} [${result.durationMs}ms]`);
  }
  console.log(`Summary: ${passed}/${results.length} passed, ${failed} failed`);
  console.log(`JSON_REPORT ${JSON.stringify(report)}`);

  process.exitCode = failed > 0 ? 1 : 0;
}

runAll();
