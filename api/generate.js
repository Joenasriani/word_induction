export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { systemPrompt, userQuery } = req.body || {};
  if (!systemPrompt || !userQuery) {
    return res.status(400).json({ error: 'systemPrompt and userQuery are required.' });
  }

  const roundtableApi = process.env.ROUNDTABLE_API;
  const fallbackApiKey = process.env.WORD_INDUCTION_API;

  if (!roundtableApi && !fallbackApiKey) {
    return res.status(500).json({ error: 'Server configuration error: missing ROUNDTABLE_API.' });
  }

  try {
    let response;

    if (roundtableApi && /^https?:\/\//i.test(roundtableApi)) {
      response = await fetch(roundtableApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, userQuery })
      });
    } else {
      const apiKey = roundtableApi || fallbackApiKey;
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://word-induction.vercel.app',
          'X-Title': 'WORD INDUCTION'
        },
        body: JSON.stringify({
          model: 'openrouter/auto',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userQuery }
          ]
        })
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unknown server error' });
  }
}
