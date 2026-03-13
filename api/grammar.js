// api/grammar.js
// Vercel Serverless Function — CommonJS format (required for .js files)
// API key lives in Vercel Environment Variables → never in browser

const SYSTEM_PROMPTS = {
  grammar: (voiceMode) => voiceMode
    ? `You are an expert grammar checker. PRESERVE the writer's unique voice — only fix actual grammar, spelling, and punctuation errors. Do NOT rewrite sentences or change word choices unless outright wrong. Return ONLY a raw JSON object (no markdown, no backticks, no explanation): {"corrected":"the corrected text with errors wrapped like this: <span class=\\"err\\">wrong word</span><span class=\\"fix\\">correct word</span> and all other text kept exactly as-is","errors":2,"warnings":1,"improvements":3}`
    : `You are an expert grammar checker. Fix all grammar, spelling, punctuation, and style errors. Return ONLY a raw JSON object (no markdown, no backticks): {"corrected":"the corrected text with errors wrapped like this: <span class=\\"err\\">wrong word</span><span class=\\"fix\\">correct word</span>","errors":2,"warnings":1,"improvements":3}`,

  style: () =>
    `You are a style and clarity editor. Improve readability, flow, and conciseness while keeping the writer's voice. Return ONLY a raw JSON object (no markdown, no backticks): {"corrected":"improved text with changes wrapped in <span class=\\"fix\\">improved phrase</span>","errors":0,"warnings":2,"improvements":4}`,

  humanize: () =>
    `You are an expert at making AI-generated text sound naturally human. Vary sentence lengths dramatically, add personality and first-person perspective, remove corporate jargon, use informal transitions. Return ONLY a raw JSON object (no markdown, no backticks): {"corrected":"humanized text with key changes in <span class=\\"fix\\">natural phrase</span>","errors":0,"warnings":0,"improvements":5}`
};

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verify API key is configured
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('MISSING: OPENROUTER_API_KEY environment variable not set in Vercel');
    return res.status(500).json({
      error: 'API key not configured',
      fix: 'Go to Vercel Dashboard → Settings → Environment Variables → add OPENROUTER_API_KEY'
    });
  }

  const { text, mode = 'grammar', voiceMode = true } = req.body || {};

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No text provided' });
  }

  const safeText = text.slice(0, 10000);
  const systemPrompt = (SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.grammar)(voiceMode);

  try {
    console.log(`[grammar] mode=${mode} voiceMode=${voiceMode} length=${safeText.length}`);

    const apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://writeclean.vercel.app',
        'X-Title': 'WriteClean Grammar Checker'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        max_tokens: 2000,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: safeText }
        ]
      })
    });

    if (!apiResponse.ok) {
      const errBody = await apiResponse.text();
      console.error(`OpenRouter error ${apiResponse.status}:`, errBody);
      return res.status(502).json({
        error: `AI service error (${apiResponse.status})`,
        detail: errBody
      });
    }

    const data = await apiResponse.json();

    let raw = data.choices?.[0]?.message?.content || '';
    // Strip any markdown fences the model may have added
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    let result;
    try {
      result = JSON.parse(raw);
    } catch (e) {
      console.warn('JSON parse failed, using raw text as corrected output');
      result = { corrected: raw || safeText, errors: 0, warnings: 0, improvements: 0 };
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
