// ═══════════════════════════════════════════════════════
//  Zero To Hero — Shared Data Layer (db.js)
//  يشتغل بدون سيرفر — كل البيانات في localStorage
// ═══════════════════════════════════════════════════════

const DB = {
  get(k, def = null) {
    try { return JSON.parse(localStorage.getItem('zth_' + k) ?? 'null') ?? def; }
    catch { return def; }
  },
  set(k, v) { localStorage.setItem('zth_' + k, JSON.stringify(v)); },
  push(k, item) {
    const arr = this.get(k, []);
    arr.push(item);
    this.set(k, arr);
    return arr;
  },
  log(txt, type = 'info') {
    const logs = this.get('logs', []);
    logs.unshift({ txt, type, time: new Date().toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) });
    if (logs.length > 300) logs.pop();
    this.set('logs', logs);
  },
};

// ── Auth ──────────────────────────────────────────────
const Auth = {
  KEY: 'zth_user_v2',
  get() { try { return JSON.parse(localStorage.getItem(this.KEY) || 'null'); } catch { return null; } },
  set(u) { localStorage.setItem(this.KEY, JSON.stringify(u)); },
  clear() { localStorage.removeItem(this.KEY); },
  isAdmin() { const u = this.get(); return u?.role === 'admin'; },
  isStudent() { const u = this.get(); return u?.role === 'student'; },
  requireAdmin() { if (!this.isAdmin()) { location.href = 'login.html'; return false; } return true; },
  requireStudent() {
    const u = this.get();
    if (!u) { location.href = 'login.html'; return false; }
    if (u.role === 'admin') { location.href = 'admin.html'; return false; }
    return true;
  },
};

// ── Discount Codes ────────────────────────────────────
// الكود مشفّر — مش ممكن حد يقرأه من هنا
function _hc(s) { return Array.from(s).map((c, i) => ((c.charCodeAt(0) ^ (i * 7)) % 16).toString(16)).join(''); }
const DISCOUNT_DB = [
  { h: 'ae4ae6', pct: 25, save: 625, final: 1875, label: 'خصم 25%' },
];
function applyDiscount(code) {
  const d = DISCOUNT_DB.find(x => x.h === _hc(code.trim().toUpperCase()));
  if (!d) return null;
  DB.set('active_discount', d);
  DB.set('discount_code', code.toUpperCase());
  return d;
}

// ── Course Config ─────────────────────────────────────
const COURSE = {
  name: 'Zero To Hero',
  instructor: 'محمد رضا | Zizo-VFX',
  price: 2500,
  phone: '01095822948',
  wa: 'https://wa.me/201095822948',
  startDate: new Date('2025-06-06T09:00:00'),
  totalSeats: 20,
  adminEmail: 'admin@zizovfx.com',
};

// ── Admin Password (hashed) ───────────────────────────
// كلمة سر الادمن: zizoVFX@2025#Admin
const ADMIN_HASH = (() => {
  const p = 'zizoVFX@2025#Admin';
  return Array.from(p).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(36);
})();
function checkAdminPass(p) {
  return Array.from(p).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(36) === ADMIN_HASH;
}

// ── Toast ──────────────────────────────────────────────
function showToast(msg, type = 'success', dur = 2800) {
  let t = document.getElementById('globalToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'globalToast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(14px);background:#0D1220;border:1px solid #222;border-radius:11px;padding:11px 20px;font-size:13px;font-weight:600;font-family:Cairo,sans-serif;color:#E8ECF8;z-index:3000;opacity:0;transition:all .32s;white-space:nowrap;display:flex;align-items:center;gap:8px;pointer-events:none;direction:rtl';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  const colors = { success: '#10B981', error: '#EF4444', info: '#4B7BF5', warning: '#F59E0B' };
  t.style.borderColor = (colors[type] || '#444') + '55';
  t.style.color = colors[type] || '#E8ECF8';
  t.style.transform = 'translateX(-50%) translateY(0)';
  t.style.opacity = '1';
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.style.transform = 'translateX(-50%) translateY(14px)'; t.style.opacity = '0'; }, dur);
}

// ── Cursor ────────────────────────────────────────────
function initCursor() {
  const c1 = document.getElementById('cur'), c2 = document.getElementById('cur2');
  if (!c1 || !c2) return;
  let mx = 0, my = 0, cx = 0, cy = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; c1.style.left = mx + 'px'; c1.style.top = my + 'px'; });
  (function r() { cx += (mx - cx) * .1; cy += (my - cy) * .1; c2.style.left = cx + 'px'; c2.style.top = cy + 'px'; requestAnimationFrame(r); })();
  document.addEventListener('mouseover', e => {
    const big = e.target.closest('button, a, input, select, textarea, [data-cur]');
    c1.style.width = big ? '18px' : '9px'; c1.style.height = big ? '18px' : '9px';
  });
}

// ── Countdown ─────────────────────────────────────────
function startCountdown(target, ids) {
  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '00'; }); return; }
    [Math.floor(diff / 86400000), Math.floor(diff % 86400000 / 3600000), Math.floor(diff % 3600000 / 60000), Math.floor(diff % 60000 / 1000)]
      .forEach((v, i) => { const el = document.getElementById(ids[i]); if (el) el.textContent = String(v).padStart(2, '0'); });
  }
  tick(); return setInterval(tick, 1000);
}

// ── Icon Burst ────────────────────────────────────────
const BURST = ['Pr', 'Ae', '★', '◆', '▲', 'Ps', '✦', 'Ai'];
const BCOLORS = ['#E8AB35', '#9B6DFF', '#4B7BF5', '#10B981', '#F59E0B'];
function iconBurst(x, y, n = 10) {
  if (!document.getElementById('_burstKf')) {
    const s = document.createElement('style'); s.id = '_burstKf';
    s.textContent = '@keyframes _bk{0%{font-size:16px;opacity:1;transform:translate(-50%,-50%) scale(1) rotate(0)}100%{font-size:20px;opacity:0;transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(.35) rotate(var(--rot))}}';
    document.head.appendChild(s);
  }
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    const a = (360 / n * i) * Math.PI / 180, d = 55 + Math.random() * 85;
    el.style.cssText = `position:fixed;left:${x}px;top:${y}px;pointer-events:none;z-index:9990;font-family:'Bebas Neue',sans-serif;font-size:0;font-weight:900;color:${BCOLORS[i % BCOLORS.length]};text-shadow:0 0 8px currentColor;--tx:${Math.cos(a) * d}px;--ty:${Math.sin(a) * d}px;--rot:${Math.random() * 360}deg;animation:_bk .9s cubic-bezier(.25,.46,.45,.94) ${i * .04}s forwards`;
    el.textContent = BURST[i % BURST.length];
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }
}

// ── 3D Scene (Three.js) ───────────────────────────────
function init3D(canvasId, opts = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof THREE === 'undefined') return;
  const { particles = 1200, rings = true, shapes = true, opacity = 0.5 } = opts;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(canvas.offsetWidth || innerWidth, canvas.offsetHeight || innerHeight);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(50, (canvas.offsetWidth || innerWidth) / (canvas.offsetHeight || innerHeight), .1, 100);
  cam.position.z = 7;

  // Particles
  const pos = new Float32Array(particles * 3), col = new Float32Array(particles * 3);
  for (let i = 0; i < particles; i++) {
    const r = 3 + Math.random() * 11, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i*3] = r*Math.sin(ph)*Math.cos(th); pos[i*3+1] = r*Math.sin(ph)*Math.sin(th)*.55; pos[i*3+2] = (Math.random()-.5)*7;
    const g = Math.random() > .42; col[i*3] = g?.91:.29; col[i*3+1] = g?.67:.48; col[i*3+2] = g?.21:.96;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const ptMat = new THREE.PointsMaterial({ size: .055, vertexColors: true, transparent: true, opacity });
  const pts = new THREE.Points(geo, ptMat);
  scene.add(pts);

  // Rings
  const ringsArr = [];
  if (rings) {
    [[1.6,.004,0xC8911A,.52,.45,.1,.0007],[2.5,.003,0x4B7BF5,.36,1.15,.65,-.0005],[3.6,.003,0xC8911A,.22,.28,1.05,.0003],[4.8,.002,0x9B6DFF,.13,.85,.38,-.0002]].forEach(d => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(d[0],d[1],12,160),new THREE.MeshBasicMaterial({color:d[2],transparent:true,opacity:d[3]}));
      m.rotation.x=d[4]; m.rotation.y=d[5]; m.userData.spd=d[6]; scene.add(m); ringsArr.push(m);
    });
  }

  // Shapes
  const shapesArr = [];
  if (shapes) {
    for (let i = 0; i < 8; i++) {
      const g = Math.random() > .5 ? new THREE.OctahedronGeometry(.1) : new THREE.TetrahedronGeometry(.09);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({color:Math.random()>.5?0xC8911A:0x4B7BF5,transparent:true,opacity:.15+Math.random()*.12,wireframe:true}));
      m.position.set((Math.random()-.5)*9,(Math.random()-.5)*5,(Math.random()-.5)*4);
      m.userData = {rx:(Math.random()-.5)*.004,ry:(Math.random()-.5)*.005,fy:Math.random()*Math.PI*2,fs:.002+Math.random()*.003,by:m.position.y};
      scene.add(m); shapesArr.push(m);
    }
  }

  // Grid
  const grid = new THREE.GridHelper(22, 32, 0xC8911A, 0xC8911A);
  grid.material.opacity = .025; grid.material.transparent = true; grid.position.y = -4.5; scene.add(grid);

  let tmx = 0, tmy = 0, cmx = 0, cmy = 0, t = 0;
  document.addEventListener('mousemove', e => { tmx = (e.clientX/innerWidth-.5)*1.3; tmy = -(e.clientY/innerHeight-.5)*.8; });
  window.addEventListener('resize', () => {
    const w = canvas.offsetWidth||innerWidth, h = canvas.offsetHeight||innerHeight;
    renderer.setSize(w,h); cam.aspect = w/h; cam.updateProjectionMatrix();
  });

  (function tick() {
    requestAnimationFrame(tick); t += .007;
    ptMat.opacity = opacity - .06 + Math.sin(t * .4) * .07;
    pts.rotation.y = t * .012; pts.rotation.x = t * .005;
    ringsArr.forEach(r => { r.rotation.y += r.userData.spd; r.rotation.x += r.userData.spd * .3; });
    shapesArr.forEach(s => { const d=s.userData; s.rotation.x+=d.rx; s.rotation.y+=d.ry; d.fy+=d.fs; s.position.y=d.by+Math.sin(d.fy)*.13; });
    grid.rotation.y = t * .015;
    cmx += (tmx*.45 - cmx) * .025; cmy += (tmy*.3 - cmy) * .025;
    cam.position.x = cmx; cam.position.y = cmy; cam.lookAt(0,0,0);
    renderer.render(scene, cam);
  })();
}
