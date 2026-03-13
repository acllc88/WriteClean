/* ═══════════════════════════════════════
   WRITECLEAN — main.js
   Calls /api/grammar (Vercel Serverless Function)
   API key lives in Vercel env vars — never in browser
═══════════════════════════════════════ */

let voiceMode = true;
let currentMode = 'grammar';

// ── Tab switching ──
document.querySelectorAll('.tool-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tool-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    currentMode = tab.dataset.mode;
    const placeholders = {
      grammar:  'Paste your text here — grammar & spelling check. Free, no account needed.',
      style:    'Paste your text for style and clarity improvements — free, no login required.',
      humanize: 'Paste AI-generated text here to make it sound human — free and unlimited.'
    };
    document.getElementById('input-area').placeholder = placeholders[currentMode];
    document.getElementById('output-section').style.display = 'none';
  });
});

// ── Word count ──
document.getElementById('input-area').addEventListener('input', function () {
  const words = this.value.trim() === ''
    ? 0
    : this.value.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('word-count').textContent =
    words + ' word' + (words !== 1 ? 's' : '');
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

// ── Main grammar check ──
async function runCheck() {
  const text = document.getElementById('input-area').value.trim();
  if (!text) {
    alert('Please paste some text to check.');
    return;
  }

  const btn = document.getElementById('check-btn');
  btn.disabled = true;
  btn.textContent = 'Checking…';
  document.getElementById('loading').style.display = 'block';
  document.getElementById('output-section').style.display = 'none';

  try {
    // Call our secure Netlify Edge proxy — no API key exposed in browser
    const response = await fetch('/api/grammar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        mode: currentMode,
        voiceMode: voiceMode
      })
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    // Render corrected text
    document.getElementById('output-text').innerHTML =
      result.corrected || escapeHtml(text);

    // Stats chips
    const chips = [];
    if ((result.errors || 0) > 0)
      chips.push(`<span class="stat stat-err">${result.errors} error${result.errors !== 1 ? 's' : ''} fixed</span>`);
    if ((result.warnings || 0) > 0)
      chips.push(`<span class="stat stat-warn">${result.warnings} style issue${result.warnings !== 1 ? 's' : ''}</span>`);
    chips.push(`<span class="stat stat-good">${result.improvements || 0} improvement${(result.improvements || 0) !== 1 ? 's' : ''}</span>`);
    document.getElementById('stats-row').innerHTML = chips.join('');
    document.getElementById('output-section').style.display = 'block';

    // Smooth scroll to result on mobile
    if (window.innerWidth < 768) {
      document.getElementById('output-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

  } catch (err) {
    console.error('Grammar check error:', err);
    document.getElementById('output-text').innerHTML =
      `<span style="color:var(--ink-muted)">
        Something went wrong — please try again in a moment.<br>
        <small style="font-size:0.78rem;opacity:0.6">${err.message}</small>
      </span>`;
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
    btn.style.cssText = 'background:var(--accent);color:white;border-color:var(--accent)';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.cssText = '';
    }, 2200);
  }).catch(() => {
    // Fallback for older browsers
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(document.getElementById('output-text'));
    sel.removeAllRanges();
    sel.addRange(range);
  });
}

// ── Recheck (put corrected text back into input) ──
function recheck() {
  const corrected = document.getElementById('output-text').innerText;
  document.getElementById('input-area').value = corrected;
  document.getElementById('output-section').style.display = 'none';
  document.getElementById('input-area').focus();
  const words = corrected.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('word-count').textContent =
    words + ' word' + (words !== 1 ? 's' : '');
}

// ── FAQ accordion ──
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

// ── Keyboard: voice toggle ──
document.getElementById('voice-toggle')?.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleVoice(); }
});

// ── Keyboard: Enter in textarea submits ──
document.getElementById('input-area')?.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    runCheck();
  }
});

// ── Nav shadow on scroll ──
window.addEventListener('scroll', () => {
  const nav = document.getElementById('nav');
  if (!nav) return;
  nav.style.boxShadow = window.scrollY > 10
    ? '0 2px 20px rgba(13,13,13,0.1)'
    : 'none';
}, { passive: true });

// ── Helper: escape HTML for error display ──
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
