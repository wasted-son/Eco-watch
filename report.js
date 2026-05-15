// ═══════════════════════════════════════════════════════
//  EcoAlert — Report Module
//  Handles: modal open/close, category selection,
//           photo upload, GPS tag, form submit
// ═══════════════════════════════════════════════════════

const ReportModule = (() => {
  let selectedCategory = null;
  let photoBase64 = null;
  let pinnedLat = null;
  let pinnedLng = null;

  // ── Build category grid ────────────────────────────
  function buildCategoryGrid() {
    const grid = document.getElementById('category-grid');
    grid.innerHTML = '';

    CONFIG.CATEGORIES.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'category-btn';
      btn.dataset.id = cat.id;
      btn.innerHTML = `
        <span class="category-emoji">${cat.emoji}</span>
        <span>${cat.label}</span>
      `;
      btn.addEventListener('click', () => selectCategory(cat));
      grid.appendChild(btn);
    });
  }

  function selectCategory(cat) {
    selectedCategory = cat;
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector(`.category-btn[data-id="${cat.id}"]`).classList.add('selected');
    checkSubmitReady();
  }

  // ── Photo handling ─────────────────────────────────
  function initPhotoUpload() {
    const area = document.getElementById('photo-area');
    const input = document.getElementById('photo-input');
    const placeholder = document.getElementById('photo-placeholder');
    const preview = document.getElementById('photo-preview');

    area.addEventListener('click', () => input.click());

    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;

      // Compress + convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 800;
          let w = img.width, h = img.height;
          if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
          if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          photoBase64 = canvas.toDataURL('image/jpeg', 0.7);
          preview.src = photoBase64;
          preview.classList.remove('hidden');
          placeholder.classList.add('hidden');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Location ───────────────────────────────────────
  function updateLocationDisplay(lat, lng) {
    const dot = document.querySelector('.loc-dot');
    const text = document.getElementById('location-text');
    dot.classList.remove('pulsing');
    text.textContent = `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`;
  }

  // ── Submit state ───────────────────────────────────
  function checkSubmitReady() {
    const btn = document.getElementById('btn-submit-report');
    btn.disabled = !selectedCategory;
  }

  // ── Open modal ─────────────────────────────────────
  function openModal() {
    const modal = document.getElementById('report-modal');
    const loc = MapModule.getUserLocation();
    pinnedLat = loc.lat;
    pinnedLng = loc.lng;
    updateLocationDisplay(pinnedLat, pinnedLng);

    // Reset form
    selectedCategory = null;
    photoBase64 = null;
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('photo-preview').classList.add('hidden');
    document.getElementById('photo-placeholder').classList.remove('hidden');
    document.getElementById('photo-input').value = '';
    document.getElementById('report-description').value = '';
    document.getElementById('char-remaining').textContent = '300';
    document.getElementById('submit-success').classList.add('hidden');
    document.getElementById('submit-error').classList.add('hidden');
    document.getElementById('submit-label').classList.remove('hidden');
    document.getElementById('submit-spinner').classList.add('hidden');
    checkSubmitReady();

    modal.classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('report-modal').classList.add('hidden');
  }

  // ── Submit ─────────────────────────────────────────
  async function submitReport() {
    if (!selectedCategory) return;

    const description = document.getElementById('report-description').value.trim();
    const loc = MapModule.getUserLocation();
    const lat = pinnedLat || loc.lat;
    const lng = pinnedLng || loc.lng;

    document.getElementById('submit-label').classList.add('hidden');
    document.getElementById('submit-spinner').classList.remove('hidden');
    document.getElementById('btn-submit-report').disabled = true;
    document.getElementById('submit-error').classList.add('hidden');

    const payload = {
      category: selectedCategory.id,
      severity: selectedCategory.severity,
      description: description || 'No description provided.',
      lat,
      lng,
      photo_base64: photoBase64 || null,
      weather_category: selectedCategory.weather || false,
    };

    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Submission failed');

      document.getElementById('submit-success').classList.remove('hidden');

      // Add pin immediately without waiting for poll
      if (data.report) MapModule.upsertPin(data.report);

      // Auto-close after 2.5s
      setTimeout(closeModal, 2500);

    } catch (err) {
      document.getElementById('submit-error').textContent = `Error: ${err.message}`;
      document.getElementById('submit-error').classList.remove('hidden');
    } finally {
      document.getElementById('submit-label').classList.remove('hidden');
      document.getElementById('submit-spinner').classList.add('hidden');
      document.getElementById('btn-submit-report').disabled = false;
    }
  }

  // ── Init ───────────────────────────────────────────
  function init() {
    buildCategoryGrid();
    initPhotoUpload();

    document.getElementById('fab-report').addEventListener('click', openModal);
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-backdrop').addEventListener('click', closeModal);
    document.getElementById('btn-submit-report').addEventListener('click', submitReport);

    // Character counter
    document.getElementById('report-description').addEventListener('input', (e) => {
      const left = 300 - e.target.value.length;
      document.getElementById('char-remaining').textContent = left;
    });

    // Allow map click to set pin location
    MapModule.onMapClick((lat, lng) => {
      pinnedLat = lat;
      pinnedLng = lng;
      updateLocationDisplay(lat, lng);
    });
  }

  return { init, openModal, closeModal };
})();
