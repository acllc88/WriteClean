/* ═══════════════════════════════════════
   WRITECLEAN — Cookie Consent Banner
   GDPR + ePrivacy + CCPA compliant
   Drop-in: just add <script src="js/cookies.js"></script>
   before </body> on every page
═══════════════════════════════════════ */

(function () {
  'use strict';

  const STORAGE_KEY = 'wc_cookie_consent';
  const EXPIRY_DAYS = 365;

  // ── Check if already consented ──
  function getConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.expires && Date.now() > data.expires) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    } catch (e) { return null; }
  }

  function saveConsent(choice) {
    const expires = Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, expires, date: new Date().toISOString() }));
  }

  // ── Inject styles ──
  const style = document.createElement('style');
  style.textContent = `
    #wc-cookie-overlay {
      position: fixed; inset: 0; z-index: 9998;
      pointer-events: none;
    }
    #wc-cookie-banner {
      position: fixed; bottom: 0; left: 0; right: 0;
      z-index: 9999;
      background: #0d0d0c;
      border-top: 1px solid rgba(255,255,255,0.1);
      padding: 20px 5%;
      display: flex; align-items: center; justify-content: space-between;
      gap: 24px; flex-wrap: wrap;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      transform: translateY(100%);
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 -4px 40px rgba(0,0,0,0.5);
    }
    #wc-cookie-banner.wc-visible { transform: translateY(0); }
    #wc-cookie-banner .wc-text-col { flex: 1; min-width: 260px; }
    #wc-cookie-banner .wc-title {
      font-size: 0.9rem; font-weight: 700; color: #f0ede6;
      margin-bottom: 5px; display: flex; align-items: center; gap: 8px;
    }
    #wc-cookie-banner .wc-title span { font-size: 1rem; }
    #wc-cookie-banner .wc-desc {
      font-size: 0.78rem; color: rgba(240,237,230,0.45);
      line-height: 1.55; max-width: 560px;
    }
    #wc-cookie-banner .wc-desc a {
      color: #7ee8a2; text-decoration: underline; text-underline-offset: 2px;
    }
    #wc-cookie-banner .wc-btn-row {
      display: flex; gap: 10px; flex-shrink: 0; flex-wrap: wrap; align-items: center;
    }
    #wc-cookie-banner button {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      font-size: 0.82rem; font-weight: 600; cursor: pointer;
      padding: 9px 22px; border-radius: 50px; border: none;
      transition: all 0.2s; white-space: nowrap;
    }
    #wc-cookie-banner .wc-btn-accept {
      background: #1a6b3c; color: white;
    }
    #wc-cookie-banner .wc-btn-accept:hover { filter: brightness(1.15); transform: translateY(-1px); }
    #wc-cookie-banner .wc-btn-necessary {
      background: transparent; color: rgba(240,237,230,0.5);
      border: 1px solid rgba(240,237,230,0.15) !important;
    }
    #wc-cookie-banner .wc-btn-necessary:hover { color: #f0ede6; border-color: rgba(240,237,230,0.35) !important; }
    #wc-cookie-banner .wc-btn-settings {
      background: transparent; color: rgba(240,237,230,0.3);
      font-size: 0.75rem; padding: 6px 12px;
    }
    #wc-cookie-banner .wc-btn-settings:hover { color: rgba(240,237,230,0.6); }

    /* Settings modal */
    #wc-cookie-modal {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
      display: flex; align-items: flex-end; justify-content: center;
      padding: 0;
      opacity: 0; pointer-events: none; transition: opacity 0.3s;
    }
    #wc-cookie-modal.wc-modal-open { opacity: 1; pointer-events: auto; }
    #wc-cookie-modal .wc-modal-box {
      background: #111110; border-radius: 20px 20px 0 0;
      border: 1px solid rgba(255,255,255,0.1); border-bottom: none;
      padding: 32px 28px 36px; width: 100%; max-width: 560px;
      transform: translateY(40px); transition: transform 0.3s;
      max-height: 90vh; overflow-y: auto;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    }
    #wc-cookie-modal.wc-modal-open .wc-modal-box { transform: translateY(0); }
    #wc-cookie-modal h2 {
      font-size: 1.1rem; color: #f0ede6; margin-bottom: 6px; font-weight: 700;
    }
    #wc-cookie-modal .wc-modal-sub {
      font-size: 0.8rem; color: rgba(240,237,230,0.4); margin-bottom: 24px; line-height: 1.5;
    }
    #wc-cookie-modal .wc-cookie-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 16px; padding: 16px 0; border-top: 1px solid rgba(255,255,255,0.07);
    }
    #wc-cookie-modal .wc-cookie-row-info { flex: 1; }
    #wc-cookie-modal .wc-cookie-row-name {
      font-size: 0.88rem; color: #f0ede6; font-weight: 600; margin-bottom: 4px;
    }
    #wc-cookie-modal .wc-cookie-row-desc {
      font-size: 0.75rem; color: rgba(240,237,230,0.4); line-height: 1.5;
    }
    #wc-cookie-modal .wc-toggle-wrap { flex-shrink: 0; padding-top: 2px; }
    #wc-cookie-modal .wc-mini-toggle {
      width: 40px; height: 22px; border-radius: 11px;
      background: rgba(255,255,255,0.12); position: relative;
      cursor: pointer; transition: background 0.2s; border: none;
    }
    #wc-cookie-modal .wc-mini-toggle.on { background: #1a6b3c; }
    #wc-cookie-modal .wc-mini-toggle[disabled] { opacity: 0.4; cursor: not-allowed; }
    #wc-cookie-modal .wc-mini-toggle::after {
      content: ''; position: absolute; top: 3px; left: 3px;
      width: 16px; height: 16px; border-radius: 50%; background: white;
      transition: left 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    }
    #wc-cookie-modal .wc-mini-toggle.on::after { left: 21px; }
    #wc-cookie-modal .wc-modal-actions {
      display: flex; gap: 10px; margin-top: 24px; flex-wrap: wrap;
    }
    #wc-cookie-modal .wc-modal-actions button {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      font-size: 0.85rem; font-weight: 600; cursor: pointer;
      padding: 10px 24px; border-radius: 50px; border: none; transition: all 0.2s;
    }
    #wc-cookie-modal .wc-save-btn { background: #1a6b3c; color: white; }
    #wc-cookie-modal .wc-save-btn:hover { filter: brightness(1.12); }
    #wc-cookie-modal .wc-close-btn {
      background: transparent; color: rgba(240,237,230,0.4);
      border: 1px solid rgba(255,255,255,0.12) !important;
    }
    #wc-cookie-modal .wc-close-btn:hover { color: #f0ede6; }

    /* Floating re-open button (after consent) */
    #wc-cookie-float {
      position: fixed; bottom: 20px; left: 20px; z-index: 9990;
      background: #1a1a19; border: 1px solid rgba(255,255,255,0.12);
      border-radius: 50px; padding: 7px 14px 7px 10px;
      display: none; align-items: center; gap: 7px;
      cursor: pointer; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      font-size: 0.72rem; font-weight: 600; color: rgba(240,237,230,0.4);
      transition: all 0.2s; box-shadow: 0 2px 12px rgba(0,0,0,0.4);
    }
    #wc-cookie-float:hover { color: #f0ede6; border-color: rgba(255,255,255,0.25); }
    #wc-cookie-float .wc-float-icon { font-size: 0.9rem; }

    @media (max-width: 600px) {
      #wc-cookie-banner { flex-direction: column; align-items: flex-start; padding: 18px 5% 20px; }
      #wc-cookie-banner .wc-btn-row { width: 100%; }
      #wc-cookie-banner .wc-btn-accept, #wc-cookie-banner .wc-btn-necessary { flex: 1; text-align: center; }
    }
  `;
  document.head.appendChild(style);

  // ── Build banner HTML ──
  function buildBanner() {
    const privacyLink = document.querySelector('meta[name="wc-privacy-url"]')?.content || 'privacy.html';

    const banner = document.createElement('div');
    banner.id = 'wc-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML = `
      <div class="wc-text-col">
        <div class="wc-title"><span>🍪</span> We use cookies</div>
        <p class="wc-desc">
          We use essential cookies to make this tool work.
          With your consent, we also use anonymous analytics to improve it — no personal data, no advertising trackers.
          <a href="${privacyLink}">Read our Privacy Policy</a>
        </p>
      </div>
      <div class="wc-btn-row">
        <button class="wc-btn-settings" id="wc-open-settings" aria-label="Cookie settings">Manage</button>
        <button class="wc-btn-necessary" id="wc-btn-necessary" aria-label="Accept only necessary cookies">Necessary only</button>
        <button class="wc-btn-accept" id="wc-btn-accept" aria-label="Accept all cookies">Accept all</button>
      </div>
    `;
    document.body.appendChild(banner);

    // Trigger animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => banner.classList.add('wc-visible'));
    });

    // Buttons
    document.getElementById('wc-btn-accept').addEventListener('click', () => {
      saveConsent('all');
      hideBanner();
      showFloat();
    });
    document.getElementById('wc-btn-necessary').addEventListener('click', () => {
      saveConsent('necessary');
      hideBanner();
      showFloat();
    });
    document.getElementById('wc-open-settings').addEventListener('click', openModal);
  }

  function hideBanner() {
    const b = document.getElementById('wc-cookie-banner');
    if (b) { b.classList.remove('wc-visible'); setTimeout(() => b.remove(), 400); }
  }

  // ── Settings modal ──
  function buildModal() {
    const modal = document.createElement('div');
    modal.id = 'wc-cookie-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Cookie preferences');
    modal.innerHTML = `
      <div class="wc-modal-box">
        <h2>Cookie Preferences</h2>
        <p class="wc-modal-sub">Choose which cookies you allow. Changes take effect immediately.</p>

        <div class="wc-cookie-row">
          <div class="wc-cookie-row-info">
            <div class="wc-cookie-row-name">Essential Cookies</div>
            <div class="wc-cookie-row-desc">Required for the tool to function. Includes your cookie consent choice and session preferences. Cannot be disabled.</div>
          </div>
          <div class="wc-toggle-wrap">
            <button class="wc-mini-toggle on" disabled aria-label="Essential cookies always on" aria-checked="true"></button>
          </div>
        </div>

        <div class="wc-cookie-row">
          <div class="wc-cookie-row-info">
            <div class="wc-cookie-row-name">Analytics Cookies</div>
            <div class="wc-cookie-row-desc">Anonymous data on which features are used most. No personal data. No advertising. Helps us improve WriteClean.</div>
          </div>
          <div class="wc-toggle-wrap">
            <button class="wc-mini-toggle" id="wc-toggle-analytics" role="switch" aria-label="Toggle analytics cookies" aria-checked="false"></button>
          </div>
        </div>

        <div class="wc-cookie-row">
          <div class="wc-cookie-row-info">
            <div class="wc-cookie-row-name">Preference Cookies</div>
            <div class="wc-cookie-row-desc">Remembers your settings between visits (e.g. voice-preserving mode on/off). Makes the tool more convenient to return to.</div>
          </div>
          <div class="wc-toggle-wrap">
            <button class="wc-mini-toggle" id="wc-toggle-prefs" role="switch" aria-label="Toggle preference cookies" aria-checked="false"></button>
          </div>
        </div>

        <div class="wc-modal-actions">
          <button class="wc-save-btn" id="wc-modal-save">Save my choices</button>
          <button class="wc-close-btn" id="wc-modal-close">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Set toggle states from existing consent
    const existing = getConsent();
    const analytics = document.getElementById('wc-toggle-analytics');
    const prefs = document.getElementById('wc-toggle-prefs');
    if (existing?.choice === 'all' || existing?.analytics) {
      analytics.classList.add('on'); analytics.setAttribute('aria-checked','true');
    }
    if (existing?.choice === 'all' || existing?.prefs) {
      prefs.classList.add('on'); prefs.setAttribute('aria-checked','true');
    }

    // Toggle interactivity
    [analytics, prefs].forEach(t => {
      t.addEventListener('click', () => {
        t.classList.toggle('on');
        t.setAttribute('aria-checked', t.classList.contains('on'));
      });
    });

    document.getElementById('wc-modal-save').addEventListener('click', () => {
      const analyticsOn = analytics.classList.contains('on');
      const prefsOn = prefs.classList.contains('on');
      const choice = analyticsOn && prefsOn ? 'all' : analyticsOn ? 'analytics' : prefsOn ? 'prefs' : 'necessary';
      saveConsent(choice);
      closeModal();
      hideBanner();
      showFloat();
    });
    document.getElementById('wc-modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  }

  function openModal() {
    if (!document.getElementById('wc-cookie-modal')) buildModal();
    const m = document.getElementById('wc-cookie-modal');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => m.classList.add('wc-modal-open'));
    });
    m.querySelector('.wc-save-btn')?.focus();
  }

  function closeModal() {
    const m = document.getElementById('wc-cookie-modal');
    if (m) { m.classList.remove('wc-modal-open'); }
  }

  // ── Floating re-open ──
  function showFloat() {
    let btn = document.getElementById('wc-cookie-float');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'wc-cookie-float';
      btn.setAttribute('aria-label', 'Cookie preferences');
      btn.innerHTML = `<span class="wc-float-icon">🍪</span> Cookies`;
      btn.addEventListener('click', openModal);
      document.body.appendChild(btn);
    }
    btn.style.display = 'flex';
  }

  // ── Init ──
  function init() {
    const consent = getConsent();
    if (!consent) {
      // No consent recorded — show banner after slight delay
      setTimeout(buildBanner, 800);
    } else {
      // Already consented — just show the floating button
      showFloat();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Public API (optional programmatic access) ──
  window.WriteCleanCookies = {
    getConsent,
    openSettings: openModal,
    hasAnalytics: () => { const c = getConsent(); return c?.choice === 'all' || c?.choice === 'analytics'; },
    hasPrefs: () => { const c = getConsent(); return c?.choice === 'all' || c?.choice === 'prefs'; },
  };

})();
