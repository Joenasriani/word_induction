export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = typeof req.body === 'string' ? safeJsonParse(req.body) : (req.body || {});
  const { systemPrompt, userQuery } = body;

  if (!String(systemPrompt || '').trim() || !String(userQuery || '').trim()) {
    return res.status(400).json({ error: 'systemPrompt and userQuery are required.' });
  }

  const openRouterApiKey = getOpenRouterApiKey();
  const openRouterModel = 'openrouter/free';

  if (!openRouterApiKey) {
    return res.status(500).json({
      error:
        'Server configuration error: missing OpenRouter API key. Set WORD_INDUCTION_API or OPENROUTER_API_KEY in Vercel environment variables and redeploy.'
    });
  }

  try {
    const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openRouterApiKey}`,
        'HTTP-Referer': 'https://word-induction.vercel.app',
        'X-OpenRouter-Title': 'WORD INDUCTION'
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: [
          { role: 'system', content: String(systemPrompt).trim() },
          { role: 'user', content: String(userQuery).trim() }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiError = errorData.error?.message || errorData.error || `API error: ${response.status}`;

      const hint = /user not found|invalid api key|unauthorized/i.test(String(apiError))
        ? ' Check your OpenRouter key. Use the raw key only, without Bearer, URL, or model name.'
        : '';

      throw new Error(`${apiError}${hint}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unknown server error' });
  }
}

function getOpenRouterApiKey() {
  return normalizeApiKey(
    process.env.WORD_INDUCTION_API ||
      process.env.OPENROUTER_API_KEY ||
      process.env.OPEN_ROUTER_API_KEY ||
      ''
  );
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function normalizeApiKey(raw) {
  if (!raw) return '';
  return String(raw)
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/^Bearer\s+/i, '');
}

async function fetchWithRetry(url, options, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);

      if ((response.status === 429 || response.status >= 500) && attempt < retries) {
        await wait(350 * (attempt + 1));
        continue;
      }

      return response;
    } catch (error) {
      clearTimeout(timeout);
      if (attempt >= retries) throw error;
      await wait(350 * (attempt + 1));
    }
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}