/* ═══════════════════════════════════════
   WRITECLEAN — main.js
   Grammar tool logic + UI interactions
═══════════════════════════════════════ */

let voiceMode = true;
let currentMode = 'grammar';

// ── Tab switching ──
document.querySelectorAll('.tool-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tool-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
    tab.classList.add('active');
    tab.setAttribute('aria-selected','true');
    currentMode = tab.dataset.mode;
    const placeholders = {
      grammar: "Paste your text here — no account needed. Your text is never stored or shared.",
      style:   "Paste your text for style and clarity improvements — free, no login required.",
      humanize:"Paste AI-generated text here to humanize it — remove the robotic tone, free and unlimited."
    };
    document.getElementById('input-area').placeholder = placeholders[currentMode];
    document.getElementById('output-section').style.display = 'none';
  });
});

// ── Word count ──
document.getElementById('input-area').addEventListener('input', function () {
  const words = this.value.trim() === '' ? 0 : this.value.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('word-count').textContent = words + ' word' + (words !== 1 ? 's' : '');
});

// ── Voice mode toggle ──
function toggleVoice() {
  voiceMode = !voiceMode;
  const tog = document.getElementById('voice-toggle');
  const lbl = document.getElementById('mode-status');
  tog.classList.toggle('on', voiceMode);
  tog.setAttribute('aria-checked', voiceMode);
  lbl.textContent = voiceMode ? 'ON' : 'OFF';
  lbl.className = voiceMode ? 'mode-on' : 'mode-off';
}

// ── Grammar check ──
async function runCheck() {
  const text = document.getElementById('input-area').value.trim();
  if (!text) { alert('Please paste some text to check.'); return; }

  const btn = document.getElementById('check-btn');
  btn.disabled = true;
  btn.textContent = 'Checking…';
  document.getElementById('loading').style.display = 'block';
  document.getElementById('output-section').style.display = 'none';

  const systemPrompts = {
    grammar: `You are an expert grammar checker. ${voiceMode
      ? 'PRESERVE the writer\'s unique voice and style — only fix actual grammatical, spelling, and punctuation errors. Do NOT change word choices unless they are outright wrong.'
      : 'Fix all grammar, spelling, punctuation, and style errors comprehensively.'
    } Return ONLY valid JSON (no markdown fences): {"corrected":"<corrected HTML — wrap removed errors in <span class=\\"err\\">strikethrough text</span> and their fixes in <span class=\\"fix\\">fixed text</span>. Keep all other text exactly as-is.>","errors":<integer count of grammar/spelling errors>,"warnings":<integer count of style issues>,"improvements":<integer total>}`,

    style: `You are a style and clarity editor. Improve clarity, conciseness, and readability while keeping the writer's voice. Return ONLY valid JSON: {"corrected":"<improved HTML with <span class=\\"fix\\">style improvements</span> highlighted>","errors":0,"warnings":<integer>,"improvements":<integer>}`,

    humanize: `You are an expert text humanizer. Transform AI-generated text to sound naturally human: vary sentence lengths dramatically, add first-person perspective, use informal transitions like 'But here's the thing' or 'So why does this matter?', remove corporate jargon, add specificity. Return ONLY valid JSON: {"corrected":"<humanized HTML with <span class=\\"fix\\">key humanized changes</span> highlighted>","errors":0,"warnings":0,"improvements":<integer>}`
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompts[currentMode],
        messages: [{ role: 'user', content: `Process this text:\n\n${text}` }]
      })
    });

    const data = await response.json();
    const raw = (data.content?.[0]?.text || '{}').replace(/```json|```/g, '').trim();
    const result = JSON.parse(raw);

    document.getElementById('output-text').innerHTML = result.corrected || text;

    const chips = [];
    if (result.errors > 0) chips.push(`<span class="stat stat-err">${result.errors} error${result.errors !== 1 ? 's' : ''}</span>`);
    if (result.warnings > 0) chips.push(`<span class="stat stat-warn">${result.warnings} warning${result.warnings !== 1 ? 's' : ''}</span>`);
    chips.push(`<span class="stat stat-good">${result.improvements || 0} improvement${(result.improvements || 0) !== 1 ? 's' : ''}</span>`);
    document.getElementById('stats-row').innerHTML = chips.join('');
    document.getElementById('output-section').style.display = 'block';

  } catch (e) {
    document.getElementById('output-text').innerHTML =
      `<span style="color:var(--ink-muted)">Processing error — please try again.</span><br><br>${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}`;
    document.getElementById('stats-row').innerHTML = '';
    document.getElementById('output-section').style.display = 'block';
  }

  document.getElementById('loading').style.display = 'none';
  btn.disabled = false;
  btn.innerHTML = '✦ Check Grammar — Free';
}

// ── Copy output ──
function copyOutput() {
  const text = document.getElementById('output-text').innerText;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.btn-copy');
    const orig = btn.textContent;
    btn.textContent = '✓ Copied!';
    btn.style.background = 'var(--accent)';
    btn.style.color = 'white';
    btn.style.borderColor = 'var(--accent)';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2200);
  }).catch(() => {
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(document.getElementById('output-text'));
    sel.removeAllRanges();
    sel.addRange(range);
  });
}

// ── Recheck ──
function recheck() {
  const corrected = document.getElementById('output-text').innerText;
  document.getElementById('input-area').value = corrected;
  document.getElementById('output-section').style.display = 'none';
  document.getElementById('input-area').focus();
  const words = corrected.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('word-count').textContent = words + ' word' + (words !== 1 ? 's' : '');
}

// ── FAQ toggle ──
function toggleFaq(el) {
  const item = el.closest('.faq-item');
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

// ── Mobile nav ──
function toggleNav() {
  document.getElementById('nav').classList.toggle('nav-mobile-open');
}

// ── Keyboard accessibility for toggle ──
document.getElementById('voice-toggle')?.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleVoice(); }
});

// ── Scroll: nav shadow ──
window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav');
  if (!nav) return;
  nav.style.boxShadow = window.scrollY > 10 ? '0 2px 20px rgba(13,13,13,0.1)' : 'none';
}, { passive: true });
