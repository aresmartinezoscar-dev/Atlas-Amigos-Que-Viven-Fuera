import { STORAGE_MODE, MAP_TILE_URL, MAP_TILE_ATTRIBUTION, firebaseConfig } from './config.js';
import { KNOWN_CITIES, COUNTRY_CENTER, resolveLocation } from './cities.js';
import { initStore } from './store.js';

/* ---------------- Utilities ---------------- */
function initials(name) {
  const parts = name.trim().split(/\s+/);
  let s = parts[0] ? parts[0][0] : '';
  if (parts.length > 1) s += parts[parts.length - 1][0];
  return s.toUpperCase();
}
function telLink(phone) { return phone ? ('tel:' + phone.replace(/\s+/g, '')) : null; }
function waLink(phone) {
  const digits = (phone || '').replace(/[^\d]/g, '');
  return digits ? ('https://wa.me/' + digits) : null;
}
function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------------- Sheets ---------------- */
const scrim = document.getElementById('scrim');
function openSheet(id) {
  closeSheet();
  document.getElementById(id).classList.add('open');
  scrim.classList.add('open');
}
function closeSheet() {
  document.querySelectorAll('.sheet.open').forEach((s) => s.classList.remove('open'));
  scrim.classList.remove('open');
}
scrim.addEventListener('click', closeSheet);
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeSheet));

/* ---------------- Tabs ---------------- */
const tabMapBtn = document.getElementById('tabMapBtn');
const tabListBtn = document.getElementById('tabListBtn');
const viewMap = document.getElementById('viewMap');
const viewList = document.getElementById('viewList');
tabMapBtn.addEventListener('click', () => {
  tabMapBtn.classList.add('active'); tabListBtn.classList.remove('active');
  viewMap.classList.add('active'); viewList.classList.remove('active');
  setTimeout(() => leafletMap.invalidateSize(), 50);
});
tabListBtn.addEventListener('click', () => {
  tabListBtn.classList.add('active'); tabMapBtn.classList.remove('active');
  viewList.classList.add('active'); viewMap.classList.remove('active');
  renderList();
});

/* ---------------- Main Leaflet map ---------------- */
const leafletMap = L.map('leafletMap', { zoomControl: true, attributionControl: true });
L.tileLayer(MAP_TILE_URL, { attribution: MAP_TILE_ATTRIBUTION, maxZoom: 19 }).addTo(leafletMap);
leafletMap.setView([40.2, -3.7], 5);

const clusterGroup = L.markerClusterGroup({
  showCoverageOnHover: false,
  spiderfyOnMaxZoom: true,
  maxClusterRadius: 44,
  iconCreateFunction(cluster) {
    return L.divIcon({
      html: `<div class="marker-count-pin">${cluster.getChildCount()}</div>`,
      className: '', iconSize: [42, 42]
    });
  }
});
leafletMap.addLayer(clusterGroup);

function personIcon(p) {
  const inner = p.photo ? `<img src="${p.photo}" alt="">` : `<span>${initials(p.name)}</span>`;
  return L.divIcon({
    html: `<div class="marker-pin">${inner}</div>`,
    className: '', iconSize: [36, 36], iconAnchor: [18, 34], popupAnchor: [0, -32]
  });
}

let allMarkers = []; // {marker, person}

function renderMap(people) {
  clusterGroup.clearLayers();
  allMarkers = [];
  const q = (document.getElementById('searchInput').value || '').trim().toLowerCase();

  people.forEach((p) => {
    const matches = !q || p.name.toLowerCase().includes(q) || (p.city || '').toLowerCase().includes(q);
    if (!matches) return;
    const marker = L.marker([p.lat, p.lon], { icon: personIcon(p) });
    marker.on('click', () => openDetail(p));
    clusterGroup.addLayer(marker);
    allMarkers.push({ marker, person: p });
  });

  if (allMarkers.length) {
    const bounds = L.latLngBounds(allMarkers.map((m) => m.marker.getLatLng()));
    leafletMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
  }
}

/* ---------------- List view ---------------- */
function personCard(p) {
  const card = document.createElement('div');
  card.className = 'person-card';

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  if (p.photo) { const img = document.createElement('img'); img.src = p.photo; avatar.appendChild(img); }
  else { avatar.textContent = initials(p.name); }
  card.appendChild(avatar);

  const info = document.createElement('div');
  info.className = 'person-info';
  const nameEl = document.createElement('div'); nameEl.className = 'name'; nameEl.textContent = p.name;
  const noteEl = document.createElement('div'); noteEl.className = 'note';
  noteEl.textContent = [p.note, p.city].filter(Boolean).join(' · ') || p.city || '';
  info.appendChild(nameEl); info.appendChild(noteEl);
  card.appendChild(info);

  const qa = document.createElement('div'); qa.className = 'quick-actions';
  const tel = telLink(p.phone), wa = waLink(p.phone);
  if (tel) {
    const a1 = document.createElement('a'); a1.href = tel; a1.title = 'Llamar';
    a1.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>';
    a1.addEventListener('click', (ev) => ev.stopPropagation());
    qa.appendChild(a1);
  }
  if (wa) {
    const a2 = document.createElement('a'); a2.href = wa; a2.target = '_blank'; a2.rel = 'noopener'; a2.title = 'WhatsApp';
    a2.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>';
    a2.addEventListener('click', (ev) => ev.stopPropagation());
    qa.appendChild(a2);
  }
  card.appendChild(qa);
  card.addEventListener('click', () => openDetail(p));
  return card;
}

function renderList() {
  const people = currentPeople();
  const scroll = document.getElementById('listScroll');
  scroll.innerHTML = '';
  const q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
  const filtered = people.filter((p) => !q ||
    p.name.toLowerCase().includes(q) || (p.city || '').toLowerCase().includes(q) || (p.note || '').toLowerCase().includes(q));

  if (!filtered.length) {
    const e1 = document.createElement('div'); e1.className = 'empty-state';
    e1.innerHTML = '<div class="display">Nadie por aquí</div><div>Prueba a cambiar la búsqueda o añade a alguien nuevo con el botón +.</div>';
    scroll.appendChild(e1);
    return;
  }
  const byCity = {};
  filtered.forEach((p) => { const key = p.city || p.country || 'Otros'; (byCity[key] = byCity[key] || []).push(p); });
  Object.keys(byCity).sort((a, b) => a.localeCompare(b, 'es')).forEach((city) => {
    const group = document.createElement('div'); group.className = 'city-group';
    const heading = document.createElement('div'); heading.className = 'city-heading';
    heading.innerHTML = `<span class="dot">●</span><span>${escapeHtml(city)} · ${byCity[city].length}</span>`;
    group.appendChild(heading);
    byCity[city].sort((a, b) => a.name.localeCompare(b.name, 'es')).forEach((p) => group.appendChild(personCard(p)));
    scroll.appendChild(group);
  });
}

document.getElementById('searchInput').addEventListener('input', () => {
  renderMap(currentPeople());
  if (viewList.classList.contains('active')) renderList();
});

/* ---------------- Detail sheet ---------------- */
function openDetail(p) {
  const body = document.getElementById('detailBody');
  const avatarHtml = p.photo ? `<img src="${p.photo}" style="width:100%;height:100%;object-fit:cover;">` : initials(p.name);
  body.innerHTML = `
    <div class="photo-row"><div class="photo-preview" style="width:64px;height:64px;">${avatarHtml}</div>
      <div><div class="detail-name display">${escapeHtml(p.name)}</div>
      <div class="detail-loc">${escapeHtml([p.city, p.country].filter(Boolean).join(', '))}</div></div></div>
    ${p.note ? `<div class="detail-note">${escapeHtml(p.note)}</div>` : ''}
    <div class="detail-actions" id="detailActions"></div>
    <button class="btn-outline" id="detailEditBtn" style="width:100%;margin-bottom:8px;">✏️ Editar</button>
    <button class="btn-danger-text" id="detailDeleteBtn">Eliminar de mi atlas</button>`;

  const actions = document.getElementById('detailActions');
  const tel = telLink(p.phone), wa = waLink(p.phone);
  if (tel) { const a1 = document.createElement('a'); a1.href = tel; a1.innerHTML = '📞 Llamar'; actions.appendChild(a1); }
  if (wa) { const a2 = document.createElement('a'); a2.href = wa; a2.target = '_blank'; a2.rel = 'noopener'; a2.innerHTML = '💬 WhatsApp'; actions.appendChild(a2); }
  if (!tel && !wa) {
    const hint = document.createElement('div');
    hint.style.cssText = 'color:var(--ink-soft);font-size:13px;';
    hint.textContent = 'Sin teléfono guardado.';
    actions.appendChild(hint);
  }

  document.getElementById('detailEditBtn').addEventListener('click', () => openForm(p));
  document.getElementById('detailDeleteBtn').addEventListener('click', async () => {
    if (confirm('¿Eliminar a ' + p.name + ' de tu atlas?')) {
      await store.remove(p.id);
      closeSheet();
      showToast(p.name + ' eliminado.');
    }
  });
  openSheet('sheetDetail');
}

/* ---------------- Form map (pick location) ---------------- */
const formMap = L.map('formMap', { zoomControl: false, attributionControl: false, dragging: true, scrollWheelZoom: true });
L.tileLayer(MAP_TILE_URL, { attribution: MAP_TILE_ATTRIBUTION, maxZoom: 19 }).addTo(formMap);
let formMarker = L.marker([40.2, -3.7], { draggable: true }).addTo(formMap);
formMap.setView([40.2, -3.7], 5);

function setFormLocation(lat, lon, zoom) {
  formMarker.setLatLng([lat, lon]);
  formMap.setView([lat, lon], zoom || Math.max(formMap.getZoom(), 8));
}
formMap.on('click', (e) => setFormLocation(e.latlng.lat, e.latlng.lng, formMap.getZoom()));

/* ---------------- Add / edit form ---------------- */
let editingId = null;
let pendingPhoto = null;

const cityListEl = document.getElementById('cityList');
Object.keys(KNOWN_CITIES).forEach((k) => {
  const opt = document.createElement('option');
  opt.value = k.replace(/\b\w/g, (c) => c.toUpperCase());
  cityListEl.appendChild(opt);
});

function openForm(person) {
  editingId = person ? person.id : null;
  pendingPhoto = person ? person.photo : null;
  document.getElementById('formTitle').textContent = person ? 'Editar persona' : 'Añadir persona';
  document.getElementById('nameInput').value = person ? person.name : '';
  document.getElementById('countryInput').value = person ? person.country : 'España';
  document.getElementById('cityInput').value = person ? person.city : '';
  document.getElementById('phoneInput').value = person ? (person.phone || '') : '';
  document.getElementById('noteInput').value = person ? (person.note || '') : '';
  updatePhotoPreview();

  const start = person ? { lat: person.lat, lon: person.lon } : COUNTRY_CENTER['España'];
  openSheet('sheetForm');
  setTimeout(() => {
    formMap.invalidateSize();
    setFormLocation(start.lat, start.lon, person ? 9 : 5);
  }, 60);
}

document.getElementById('cityInput').addEventListener('change', function () {
  const val = this.value.trim().toLowerCase();
  if (KNOWN_CITIES[val]) {
    const k = KNOWN_CITIES[val];
    document.getElementById('countryInput').value = k.country;
    setFormLocation(k.lat, k.lon, 10);
  }
});
document.getElementById('countryInput').addEventListener('change', function () {
  const c = COUNTRY_CENTER[this.value] || COUNTRY_CENTER['España'];
  setFormLocation(c.lat, c.lon, 5);
});

function updatePhotoPreview() {
  const prev = document.getElementById('photoPreview');
  prev.innerHTML = pendingPhoto ? `<img src="${pendingPhoto}">` : 'Sin foto';
}
document.getElementById('photoInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const size = 160;
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      const s = Math.max(size / img.width, size / img.height);
      const w = img.width * s, h = img.height * s;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      pendingPhoto = canvas.toDataURL('image/jpeg', 0.85);
      updatePhotoPreview();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById('saveBtn').addEventListener('click', async () => {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) { showToast('Ponle un nombre a la persona.'); return; }
  const country = document.getElementById('countryInput').value;
  const cityRaw = document.getElementById('cityInput').value.trim();
  const phone = document.getElementById('phoneInput').value.trim();
  const note = document.getElementById('noteInput').value.trim();
  const pos = formMarker.getLatLng();

  const payload = { name, city: cityRaw, country, lat: pos.lat, lon: pos.lng, phone, note, photo: pendingPhoto };

  if (editingId) {
    await store.update(editingId, payload);
    showToast('Cambios guardados.');
  } else {
    await store.add(payload);
    showToast(name + ' añadido a tu atlas.');
  }
  closeSheet();
});

document.getElementById('fabAdd').addEventListener('click', () => openForm(null));

/* ---------------- Contact Picker (mejora progresiva) ---------------- */
if ('contacts' in navigator && 'ContactsManager' in window) {
  document.getElementById('importContactBtn').style.display = 'block';
}
document.getElementById('importContactBtn').addEventListener('click', () => {
  navigator.contacts.select(['name', 'tel', 'icon'], { multiple: false }).then((contacts) => {
    if (!contacts || !contacts.length) return;
    const c = contacts[0];
    if (c.name && c.name[0]) document.getElementById('nameInput').value = c.name[0];
    if (c.tel && c.tel[0]) document.getElementById('phoneInput').value = c.tel[0];
    if (c.icon && c.icon[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => { pendingPhoto = ev.target.result; updatePhotoPreview(); };
      reader.readAsDataURL(c.icon[0]);
    }
  }).catch(() => {});
});

/* ---------------- Settings: theme, export/import, storage mode ---------------- */
document.getElementById('settingsBtn').addEventListener('click', () => openSheet('sheetSettings'));

const themeSelect = document.getElementById('themeSelect');
const savedTheme = localStorage.getItem('atlas-theme') || 'system';
themeSelect.value = savedTheme;
applyTheme(savedTheme);
themeSelect.addEventListener('change', function () { applyTheme(this.value); localStorage.setItem('atlas-theme', this.value); });
function applyTheme(t) {
  if (t === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}

document.getElementById('storageModeDesc').textContent = STORAGE_MODE === 'firebase'
  ? `Firebase (proyecto: ${firebaseConfig.projectId}) — sincronizado entre dispositivos`
  : 'Local en este dispositivo (localStorage) — no se sincroniza entre dispositivos';

document.getElementById('exportBtn').addEventListener('click', () => {
  const json = JSON.stringify(currentPeople(), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'mi-atlas-contactos.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

document.getElementById('importInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!Array.isArray(data)) throw new Error('bad format');
      if (confirm(`¿Reemplazar tus ${currentPeople().length} contactos actuales por los ${data.length} del archivo?`)) {
        await store.replaceAll(data);
        showToast('Datos importados.');
      }
    } catch (err) {
      showToast('El archivo no tiene un formato válido.');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
});

/* ---------------- Boot ---------------- */
let store = null;
let latestPeople = [];
function currentPeople() { return latestPeople; }

(async function boot() {
  store = await initStore();
  store.subscribe((people) => {
    latestPeople = people;
    document.getElementById('countLabel').textContent = people.length + (people.length === 1 ? ' persona' : ' personas');
    renderMap(people);
    if (viewList.classList.contains('active')) renderList();
  });
})();

window.addEventListener('resize', () => leafletMap.invalidateSize());
