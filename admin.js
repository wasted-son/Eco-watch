// ═══════════════════════════════════════════════════════
//  EcoAlert — Admin Module
//  Password-protected panel. Authorities / volunteers
//  can mark reports as resolved from here.
// ═══════════════════════════════════════════════════════

const AdminModule = (() => {
  let isLoggedIn = false;
  let adminToken = null; // returned by backend on successful login

  // ── Open / close admin modal ───────────────────────
  function openModal() {
    document.getElementById('admin-modal').classList.remove('hidden');
    document.getElementById('admin-panel').classList.add('hidden');
    document.getElementById('admin-error').classList.add('hidden');
    document.getElementById('admin-password').value = '';

    if (isLoggedIn) showPanel();
  }

  function closeModal() {
    document.getElementById('admin-modal').classList.add('hidden');
  }

  // ── Login ──────────────────────────────────────────
  async function login() {
    const pw = document.getElementById('admin-password').value;
    if (!pw) return;

    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Wrong password');

      isLoggedIn = true;
      adminToken = data.token;
      document.getElementById('admin-error').classList.add('hidden');
      showPanel();

    } catch (err) {
      document.getElementById('admin-error').textContent = err.message;
      document.getElementById('admin-error').classList.remove('hidden');
    }
  }

  // ── Show admin panel after login ───────────────────
  async function showPanel() {
    document.getElementById('admin-panel').classList.remove('hidden');
    loadAdminReports();
  }

  // ── Load non-resolved reports ──────────────────────
  async function loadAdminReports() {
    const listEl = document.getElementById('admin-reports-list');
    listEl.innerHTML = '<p class="no-reports">Loading…</p>';

    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/reports`);
      const reports = await res.json();
      const pending = reports.filter(r => r.severity !== 'resolved');

      if (pending.length === 0) {
        listEl.innerHTML = '<p class="no-reports">No active reports. All clear! ✅</p>';
        return;
      }

      listEl.innerHTML = '';
      pending.forEach(report => {
        const cat = CONFIG.CATEGORIES.find(c => c.id === report.category) || { emoji: '📌', label: report.category };
        const card = document.createElement('div');
        card.className = 'admin-report-card';
        card.innerHTML = `
          <h4>${cat.emoji} ${cat.label}</h4>
          <p>${report.description}</p>
          <p style="color:var(--text-muted);font-family:'Space Mono',monospace;font-size:10px;">
            ${MapModule.formatTimeAgo(report.created_at)} · ${report.severity?.toUpperCase()} · 
            ${report.lat?.toFixed(4)}, ${report.lng?.toFixed(4)}
          </p>
          <button class="btn-admin-resolve" data-id="${report.id}">✅ Mark Resolved</button>
        `;
        listEl.appendChild(card);
      });

      // Attach resolve handlers
      listEl.querySelectorAll('.btn-admin-resolve').forEach(btn => {
        btn.addEventListener('click', () => resolveReport(btn.dataset.id, btn));
      });

    } catch (err) {
      listEl.innerHTML = `<p class="no-reports" style="color:var(--red)">Error: ${err.message}</p>`;
    }
  }

  // ── Resolve a report ──────────────────────────────
  async function resolveReport(id, btn) {
    btn.textContent = 'Resolving…';
    btn.disabled = true;

    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/reports/${id}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!res.ok) throw new Error('Failed');

      btn.textContent = '✅ Resolved!';
      btn.style.opacity = '0.5';

      // Refresh map
      setTimeout(() => {
        RealtimeModule.refresh();
        loadAdminReports();
      }, 800);

    } catch (err) {
      btn.textContent = '❌ Error — retry';
      btn.disabled = false;
    }
  }

  // ── Logout ─────────────────────────────────────────
  function logout() {
    isLoggedIn = false;
    adminToken = null;
    document.getElementById('admin-panel').classList.add('hidden');
    document.getElementById('admin-password').value = '';
  }

  // ── Public resolve (called from pin detail panel) ──
  async function resolveFromPin(id) {
    if (!isLoggedIn) {
      alert('Please login as admin first.');
      openModal();
      return;
    }
    await resolveReport(id, {
      textContent: '', disabled: false,
      style: {},
    });
  }

  // ── Init ───────────────────────────────────────────
  function init() {
    document.getElementById('btn-admin-toggle').addEventListener('click', openModal);
    document.getElementById('admin-close').addEventListener('click', closeModal);
    document.getElementById('admin-backdrop').addEventListener('click', closeModal);
    document.getElementById('btn-admin-login').addEventListener('click', login);
    document.getElementById('btn-logout').addEventListener('click', logout);

    // Enter key on password field
    document.getElementById('admin-password').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') login();
    });
  }

  return { init, openModal, closeModal, resolveFromPin, isLoggedIn: () => isLoggedIn };
})();
