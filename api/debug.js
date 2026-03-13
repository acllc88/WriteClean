// api/debug.js — DELETE THIS FILE after fixing the 502
// Visit: https://writeclean.vercel.app/api/debug to see what's wrong

module.exports = async function handler(req, res) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  
  // Test Gemini if key exists
  let geminiTest = 'not tested';
  if (geminiKey) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'Say OK' }] }] })
        }
      );
      const d = await r.json();
      geminiTest = r.ok ? 'SUCCESS: ' + d.candidates?.[0]?.content?.parts?.[0]?.text : 'FAIL ' + r.status + ': ' + JSON.stringify(d);
    } catch(e) { geminiTest = 'ERROR: ' + e.message; }
  }

  res.status(200).json({
    env_vars: {
      OPENROUTER_API_KEY: apiKey ? `set (starts: ${apiKey.slice(0,12)}...)` : 'NOT SET',
      GEMINI_API_KEY: geminiKey ? `set (starts: ${geminiKey.slice(0,12)}...)` : 'NOT SET',
    },
    gemini_test: geminiTest,
    node_version: process.version,
    timestamp: new Date().toISOString()
  });
};
