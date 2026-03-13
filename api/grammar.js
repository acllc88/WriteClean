// api/grammar.js
// Vercel Serverless Function — Groq API (free, ultra-fast)
// API key in Vercel Environment Variables → never exposed to browser

const SYSTEM_PROMPTS = {
  grammar: (voiceMode) => voiceMode
    ? `You are an expert grammar checker. PRESERVE the writer's unique voice and style. Only fix actual grammar, spelling, and punctuation errors. Do NOT rewrite or rephrase unless something is outright wrong.

Return ONLY a valid raw JSON object — no markdown, no backticks, no explanation before or after:
{"corrected":"full text here with errors marked like: <span class=\\"err\\">wrong</span><span class=\\"fix\\">correct</span> and all other text untouched","errors":2,"warnings":1,"improvements":3}`
    : `You are an expert grammar checker. Fix all grammar, spelling, punctuation, and clarity errors.

Return ONLY a valid raw JSON object — no markdown, no backticks, no explanation:
{"corrected":"full text here with errors marked like: <span class=\\"err\\">wrong</span><span class=\\"fix\\">correct</span>","errors":2,"warnings":1,"improvements":3}`,

  style: () =>
    `You are a style and clarity editor. Improve readability, sentence flow, and conciseness while keeping the writer's voice.

Return ONLY a valid raw JSON object — no markdown, no backticks:
{"corrected":"full improved text with style changes in <span class=\\"fix\\">improved phrase</span>","errors":0,"warnings":2,"improvements":4}`,

  humanize: () =>
    `You are an expert at making AI-generated text sound naturally human. Vary sentence lengths, add personality, use casual transitions like "But here's the thing" or "So why does this matter?", remove robotic corporate tone.

Return ONLY a valid raw JSON object — no markdown, no backticks:
{"corrected":"full humanized text with key changes in <span class=\\"fix\\">natural phrase</span>","errors":0,"warnings":0,"improvements":5}`
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('MISSING: GROQ_API_KEY not set in Vercel Environment Variables');
    return res.status(500).json({
      error: 'API key not configured — add GROQ_API_KEY in Vercel Dashboard → Settings → Environment Variables'
    });
  }

  const { text, mode = 'grammar', voiceMode = true } = req.body || {};

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No text provided' });
  }

  const safeText = text.slice(0, 8000);
  const systemPrompt = (SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.grammar)(voiceMode);

  try {
    console.log(`[grammar] mode=${mode} voiceMode=${voiceMode} chars=${safeText.length}`);

    const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 2048,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: safeText }
        ]
      })
    });

    if (!apiResponse.ok) {
      const errBody = await apiResponse.text();
      console.error(`Groq error ${apiResponse.status}:`, errBody);
      return res.status(502).json({
        error: `Groq API error (${apiResponse.status})`,
        detail: errBody
      });
    }

    const data = await apiResponse.json();
    let raw = data.choices?.[0]?.message?.content || '';

    // Strip any accidental markdown fences
    raw = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    let result;
    try {
      result = JSON.parse(raw);
    } catch (e) {
      console.warn('JSON parse failed:', e.message, '| raw:', raw.slice(0, 200));
      result = { corrected: safeText, errors: 0, warnings: 0, improvements: 0 };
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
