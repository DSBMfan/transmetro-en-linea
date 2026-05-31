const API_URL = 'http://localhost:3000/api';
const api = {
  getToken: () => localStorage.getItem('token'),
  headers() { return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.getToken() }; },
  async request(method, endpoint, body) {
    const options = { method, headers: this.headers() };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(API_URL + endpoint, options);
    if (res.status === 401 || res.status === 403) { localStorage.clear(); window.location.href = '/login.html'; return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');
    return data;
  },
  get(ep) { return this.request('GET', ep); },
  post(ep, b) { return this.request('POST', ep, b); },
  put(ep, b) { return this.request('PUT', ep, b); },
  patch(ep, b) { return this.request('PATCH', ep, b); },
  del(ep) { return this.request('DELETE', ep); },
  async download(endpoint, filename) {
    const res = await fetch(API_URL + endpoint, { headers: this.headers() });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }
};

function toast(msg, tipo) {
  tipo = tipo || 'info';
  let c = document.querySelector('.toast-container');
  if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = 'toast ' + tipo;
  const em = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  t.innerHTML = (em[tipo] || '') + ' ' + msg;
  c.appendChild(t);
  setTimeout(function() { t.style.cssText = 'opacity:0;transform:translateX(100%);transition:.3s'; setTimeout(function() { t.remove(); }, 300); }, 3500);
}

function requireAuth() {
  if (!localStorage.getItem('token')) { window.location.href = '/login.html'; return false; }
  return true;
}

function getUsuario() {
  try { return JSON.parse(localStorage.getItem('usuario') || '{}'); } catch(e) { return {}; }
}

function setupSidebar(activePage) {
  requireAuth();
  const u = getUsuario();
  ['sidebarAvatar','topbarAvatar'].forEach(function(id) { const el = document.getElementById(id); if (el) el.textContent = (u.nombre || 'U')[0].toUpperCase(); });
  const nm = document.getElementById('sidebarName'); if (nm) nm.textContent = (u.nombre||'') + ' ' + (u.apellido||'');
  const rl = document.getElementById('sidebarRol'); if (rl) rl.textContent = u.rol || '';
  document.querySelectorAll('.nav-item[data-page]').forEach(function(item) {
    if (item.dataset.page === activePage) item.classList.add('active');
    item.addEventListener('click', function() {
      const p = item.dataset.page;
      window.location.href = p === 'dashboard' ? '/dashboard.html' : '/' + p + '.html';
    });
  });
  const btn = document.getElementById('logoutBtn');
  if (btn) btn.addEventListener('click', function() { localStorage.clear(); window.location.href = '/login.html'; });
}

function badgeEstadoUnidad(e) {
  const map = { en_servicio: '<span class="badge badge-success">● En Servicio</span>', fuera_de_servicio: '<span class="badge badge-danger">● Fuera Servicio</span>', en_mantenimiento: '<span class="badge badge-warning">● Mantenimiento</span>' };
  return map[e] || '<span class="badge badge-secondary">' + e + '</span>';
}
function badgeEstadoConductor(e) { return e === 'activo' ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-danger">Inactivo</span>'; }
function badgeEstadoRuta(e) { return e === 'activa' ? '<span class="badge badge-success">Activa</span>' : '<span class="badge badge-secondary">Inactiva</span>'; }
