// api/grammar.js
// Vercel Serverless Function — secure proxy for OpenRouter API
// API key stays on server, never exposed to browser

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, mode, voiceMode } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'No text provided' });
  }

  const safeText = text.slice(0, 10000);

  const systemPrompts = {
    grammar: `You are an expert grammar checker. ${voiceMode
      ? "PRESERVE the writer's unique voice and style — only fix actual grammatical, spelling, and punctuation errors. Do NOT change word choices unless they are outright wrong."
      : "Fix all grammar, spelling, punctuation, and style errors comprehensively."
    } Return ONLY valid JSON with no markdown fences: {"corrected":"<corrected text as HTML — wrap removed errors in <span class=\\"err\\">wrong text</span> immediately followed by <span class=\\"fix\\">correction</span>. Keep all other text as plain text.>","errors":<integer count of grammar/spelling errors fixed>,"warnings":<integer count of style issues>,"improvements":<integer total changes made>}`,

    style: `You are a style and clarity editor. Improve clarity, flow, and conciseness while keeping the writer's unique voice intact. Return ONLY valid JSON with no markdown fences: {"corrected":"<improved text as HTML — wrap style improvements in <span class=\\"fix\\">improved text</span>. Keep unchanged text as plain text.>","errors":0,"warnings":<integer style issues found>,"improvements":<integer total improvements made>}`,

    humanize: `You are an expert at making AI-generated text sound genuinely human. Transform the text by: varying sentence lengths dramatically (mix very short punchy sentences with longer flowing ones), adding first-person perspective and opinions, using informal transitions like 'But here's the thing' or 'So why does this matter?', removing corporate jargon, adding specific details and personality. Return ONLY valid JSON with no markdown fences: {"corrected":"<humanized text as HTML — wrap key humanized phrases in <span class=\\"fix\\">humanized text</span>. Keep other text as plain text.>","errors":0,"warnings":0,"improvements":<integer count of humanization changes>}`
  };

  const systemPrompt = systemPrompts[mode] || systemPrompts.grammar;

  try {
    const apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://writeclean.vercel.app',
        'X-Title': 'WriteClean Grammar Checker'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-5',
        max_tokens: 2000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Process this text:\n\n${safeText}` }
        ]
      })
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      console.error('OpenRouter error:', apiResponse.status, errText);
      return res.status(502).json({ error: 'AI service error', status: apiResponse.status });
    }

    const data = await apiResponse.json();
    const raw = (data.choices?.[0]?.message?.content || '{}')
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let result;
    try {
      result = JSON.parse(raw);
    } catch (e) {
      result = { corrected: raw || safeText, errors: 0, warnings: 0, improvements: 0 };
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error('API route error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
