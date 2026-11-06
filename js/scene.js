// Ascesa — scena animata su canvas: la civiltà disegnata in tempo reale
import { ERAS, BUILDINGS, TECHS } from './data.js';

const H = 300, GROUND = 190;
const hash = (...a) => { let h = 2166136261; for (const c of a.join('|')) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 100000) / 100000; };
const mix = (a, b, f) => { const p = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * f).toString(16).padStart(2, '0')).join(''); };
const bEra = Object.fromEntries(Object.entries(BUILDINGS).map(([id, b]) => [id, b.req ? TECHS[b.req].era : 1]));
const MAX = { field: 6, fence: 4, wall: 5, castle: 2, aqueduct: 2, arcology: 3, skyscraper: 10, tower: 10, rail: 1, shield: 1, rocket: 2, airbase: 1, park: 4 };

let ctx, W = 1000, night = 0;

// ---------- primitive
function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
function tri(x1, y1, x2, y2, x3, y3, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.fill(); }
function circ(x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
function windows(x, y, w, h, seed, cols, rows, lit = '#ffd76a', off = '#2a3140') {
  const cw = w / cols, rh = h / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++)
    rect(x + i * cw + cw * 0.25, y + j * rh + rh * 0.25, cw * 0.5, rh * 0.5, night > 0.4 && hash(seed, i, j) > 0.35 ? lit : off);
}
function smoke(x, y, t, seed, dark) {
  for (let i = 0; i < 4; i++) {
    const p = (t * 0.25 + i / 4 + hash(seed)) % 1;
    ctx.globalAlpha = (1 - p) * 0.5;
    circ(x + p * 18 + Math.sin(t + i) * 2, y - p * 40, 3 + p * 8, dark ? '#3b3b3b' : '#d8d8d8');
  }
  ctx.globalAlpha = 1;
}

// ---------- sprite: origine = base centrale, y verso l'alto negativo
const SPRITES = {
  hut: (t, s) => { tri(-10, 0, 0, -18, 10, 0, '#8b5a2b'); tri(-6, 0, 0, -12, 6, 0, '#a0703c'); rect(-2, -6, 4, 6, '#3b2412'); },
  pile: () => { for (let i = 0; i < 3; i++) rect(-9 + i * 2, -3 - i * 3, 18 - i * 4, 3, i % 2 ? '#7a5230' : '#8d8d8d'); },
  fire: (t, s) => {
    rect(-7, -2, 14, 3, '#5a3a1a');
    const f = Math.sin(t * 12 + s * 9) * 2;
    tri(-6, -1, f, -16, 6, -1, '#ff7b00'); tri(-3, -1, f * 0.5, -10, 3, -1, '#ffd23f');
    if (night > 0.3) { ctx.globalAlpha = 0.25 * night; circ(0, -6, 16, '#ff9f1c'); ctx.globalAlpha = 1; }
  },
  rock: () => { ctx.fillStyle = '#7d7d7d'; ctx.beginPath(); ctx.ellipse(0, -8, 14, 9, 0, Math.PI, 0); ctx.fill(); rect(-5, -12, 3, 2, '#b23a48'); rect(1, -10, 4, 2, '#b23a48'); },
  fence: () => { for (let i = -15; i <= 15; i += 4) tri(i - 2, 0, i, -15, i + 2, 0, '#7a5230'); rect(-16, -9, 32, 2, '#5a3a1a'); },
  house: (t, s) => { rect(-10, -14, 20, 14, '#d9b38c'); tri(-12, -14, 0, -24, 12, -14, '#9c3d2e'); rect(-2, -7, 4, 7, '#5a3a1a'); windows(-9, -13, 6, 5, s, 1, 1); },
  field: (t, s) => { ctx.fillStyle = hash(s) > 0.5 ? '#c9b458' : '#6a9a3a'; ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-16, -8); ctx.lineTo(22, -8); ctx.lineTo(16, 0); ctx.fill(); for (let i = -14; i < 20; i += 6) rect(i, -7, 1, 6, '#00000033'); },
  granary: () => { rect(-7, -14, 14, 14, '#c99a5b'); tri(-9, -14, 0, -24, 9, -14, '#8b5a2b'); },
  shed: (t, s) => { rect(-15, -14, 30, 14, '#8a7f72'); rect(-17, -17, 34, 3, '#5d554c'); rect(-5, -9, 10, 9, '#4a423a'); },
  mine: () => { ctx.fillStyle = '#6b5d4f'; ctx.beginPath(); ctx.ellipse(0, 0, 20, 16, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#1b1612'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 9, 0, Math.PI, 0); ctx.fill(); },
  market: () => { rect(-12, -10, 24, 10, '#c9a57b'); for (let i = 0; i < 6; i++) rect(-14 + i * 4.7, -15, 4.7, 5, i % 2 ? '#e63946' : '#f1faee'); },
  library: (t, s) => { rect(-14, -16, 28, 16, '#e0d6c3'); rect(-16, -19, 32, 3, '#b8ab94'); for (let i = -11; i <= 11; i += 5.5) rect(i - 1, -16, 2, 16, '#c2b59d'); },
  temple: () => { rect(-16, -3, 32, 3, '#ddd'); for (let i = -13; i <= 13; i += 5.2) rect(i - 1.2, -17, 2.4, 14, '#f5f5f5'); tri(-17, -17, 0, -26, 17, -17, '#e8e8e8'); },
  barracks: (t, s) => { rect(-13, -12, 26, 12, '#8d6e63'); rect(10, -26, 1.5, 14, '#333'); tri(11.5, -26, 19 + Math.sin(t * 4 + s) * 1.5, -23, 11.5, -20, '#c1121f'); },
  wall: () => { rect(-20, -16, 40, 16, '#a39e93'); for (let i = -20; i < 20; i += 8) rect(i, -20, 4, 4, '#a39e93'); },
  forge: (t, s) => { rect(-10, -12, 20, 12, '#5d4037'); rect(4, -22, 4, 10, '#3e2723'); circ(-3, -5, 3, `rgba(255,${100 + Math.sin(t * 8 + s) * 50 | 0},0,.9)`); smoke(6, -22, t, s, true); },
  aqueduct: () => { rect(-30, -26, 60, 5, '#c8b89a'); for (let i = -30; i < 30; i += 12) { rect(i, -21, 3, 21, '#c8b89a'); } },
  windmill: (t, s) => {
    tri(-7, 0, -3, -26, 3, -26, '#e9dcc9'); tri(-7, 0, 7, 0, 3, -26, '#e9dcc9');
    ctx.save(); ctx.translate(0, -24); ctx.rotate(t * 1.5 + s * 6);
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); rect(-1, 0, 2, 16, '#6d4c41'); rect(1, 3, 4, 12, '#f5f5f5cc'); }
    ctx.restore();
  },
  church: (t, s) => { rect(-12, -14, 18, 14, '#cfc6b8'); tri(-14, -14, -3, -22, 8, -14, '#7b4b3a'); rect(6, -30, 8, 30, '#bfb6a8'); tri(5, -30, 10, -38, 15, -30, '#7b4b3a'); rect(9.5, -44, 1, 6, '#ddd'); rect(8, -42, 4, 1, '#ddd'); },
  castle: () => { const c = '#9e9a90'; rect(-24, -24, 48, 24, c); for (const x of [-26, 18]) { rect(x, -38, 8, 38, c); for (let i = 0; i < 2; i++) rect(x + i * 5, -41, 3, 3, c); } rect(-6, -40, 12, 16, c); tri(-7, -40, 0, -50, 7, -40, '#3d5a80'); rect(-4, -10, 8, 10, '#3b2f2f'); },
  hall: (t, s) => { rect(-14, -18, 28, 18, '#b08968'); tri(-16, -18, 0, -28, 16, -18, '#7f5539'); windows(-12, -16, 24, 10, s, 4, 1); },
  palazzo: (t, s) => { rect(-12, -34, 24, 34, '#e6ccb2'); rect(-13, -36, 26, 3, '#b08968'); windows(-11, -33, 22, 30, s, 3, 4); },
  bank: () => { rect(-16, -3, 32, 3, '#ccc'); for (let i = -13; i <= 13; i += 6.5) rect(i - 1.5, -19, 3, 16, '#e0e0e0'); tri(-17, -19, 0, -27, 17, -19, '#d4af37'); },
  university: (t, s) => { rect(-16, -18, 32, 18, '#d7ccc8'); ctx.fillStyle = '#90a4ae'; ctx.beginPath(); ctx.arc(0, -18, 8, Math.PI, 0); ctx.fill(); windows(-15, -16, 30, 12, s, 5, 2); },
  workshop: (t, s) => { rect(-11, -14, 22, 14, '#a1887f'); rect(-13, -16, 26, 3, '#6d4c41'); windows(-10, -12, 20, 8, s, 3, 1); },
  harbor: (t, s) => { rect(-25, -3, 50, 3, '#6d4c41'); const b = Math.sin(t * 2 + s * 5) * 1.5; rect(-8, -6 + b, 16, 4, '#5d4037'); rect(-0.5, -22 + b, 1, 16, '#3e2723'); tri(0, -21 + b, 0, -8 + b, 9, -8 + b, '#f5f5f5'); },
  theater: () => { ctx.fillStyle = '#d7b29d'; ctx.beginPath(); ctx.arc(0, 0, 18, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#8c5e58'; ctx.beginPath(); ctx.arc(0, 0, 10, Math.PI, 0); ctx.fill(); },
  block: (t, s) => { rect(-13, -42, 26, 42, '#8d5b4c'); windows(-12, -40, 24, 38, s, 3, 6); },
  factory: (t, s) => { rect(-18, -16, 36, 16, '#6d6875'); for (let i = 0; i < 3; i++) tri(-18 + i * 12, -16, -18 + i * 12, -24, -6 + i * 12, -16, '#5a5560'); rect(8, -36, 5, 20, '#4a4453'); smoke(10, -36, t, s, true); windows(-16, -12, 32, 6, s, 5, 1, '#ffb703'); },
  plant: (t, s) => { rect(-14, -14, 28, 14, '#5c5c5c'); rect(4, -44, 7, 30, '#454545'); rect(4, -40, 7, 2, '#c1121f'); smoke(7, -44, t, s, true); smoke(9, -44, t + 1.3, s + 1, true); },
  tank: () => { rect(-10, -16, 20, 16, '#9aa5ab'); ctx.fillStyle = '#b0bec5'; ctx.beginPath(); ctx.ellipse(0, -16, 10, 3, 0, 0, Math.PI * 2); ctx.fill(); },
  hospital: (t, s) => { rect(-14, -22, 28, 22, '#f1f1f1'); rect(-2, -20, 4, 10, '#e63946'); rect(-5, -17, 10, 4, '#e63946'); windows(-13, -9, 26, 8, s, 4, 1); },
  park: (t, s) => { for (let i = -1; i <= 1; i++) { rect(i * 9 - 1, -8, 2, 8, '#5d4037'); circ(i * 9, -12 - hash(s, i) * 4, 6, '#2d6a4f'); } },
  tower: (t, s) => { rect(-11, -60, 22, 60, '#b0a99f'); windows(-10, -58, 20, 56, s, 3, 9); },
  nuke: (t, s) => { ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(-6, -22, -10, -40); ctx.lineTo(10, -40); ctx.quadraticCurveTo(6, -22, 14, 0); ctx.fill(); smoke(0, -40, t, s, false); },
  solar: () => { for (let i = -2; i <= 2; i++) { ctx.fillStyle = '#1d3557'; ctx.beginPath(); ctx.moveTo(i * 9 - 4, -2); ctx.lineTo(i * 9 - 2, -9); ctx.lineTo(i * 9 + 4, -9); ctx.lineTo(i * 9 + 2, -2); ctx.fill(); } },
  lab: (t, s) => { rect(-14, -16, 28, 16, '#eceff1'); ctx.fillStyle = '#90caf9'; ctx.beginPath(); ctx.arc(6, -16, 7, Math.PI, 0); ctx.fill(); windows(-13, -13, 16, 10, s, 3, 1, '#80deea'); },
  airbase: (t, s) => { rect(-40, -3, 80, 3, '#424242'); for (let i = -36; i < 40; i += 10) rect(i, -2, 5, 1, '#fff'); rect(-38, -14, 16, 11, '#78909c'); },
  mall: (t, s) => { rect(-22, -18, 44, 18, '#cfd8dc'); rect(-22, -20, 44, 4, `hsl(${(t * 30 + s * 99) % 360},70%,55%)`); windows(-20, -14, 40, 12, s, 6, 1, '#fff59d'); },
  skyscraper: (t, s) => { const h = 70 + hash(s) * 40; rect(-10, -h, 20, h, '#5c7a99'); windows(-9, -h + 2, 18, h - 4, s, 3, Math.floor(h / 8), '#e0fbfc', '#34495e'); rect(-0.5, -h - 10, 1, 10, '#ccc'); if (Math.sin(t * 3 + s * 10) > 0.6) circ(0, -h - 10, 1.8, '#ff1744'); },
  datacenter: (t, s) => { rect(-18, -16, 36, 16, '#263238'); for (let i = 0; i < 8; i++) circ(-15 + i * 4.2, -10, 1, Math.sin(t * 9 + i * 1.7 + s * 5) > 0 ? '#00e676' : '#1b5e20'); },
  fusion: (t, s) => { rect(-16, -14, 32, 14, '#37474f'); ctx.strokeStyle = `rgba(255,${180 + Math.sin(t * 5) * 60 | 0},80,.95)`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -24, 14, 7, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 0.3; circ(0, -24, 16, '#ffd166'); ctx.globalAlpha = 1; },
  rocket: (t, s) => {
    rect(-14, -3, 28, 3, '#555'); rect(8, -40, 2, 37, '#777');
    const cyc = (t * 0.07 + hash(s)) % 1, up = cyc > 0.8 ? ((cyc - 0.8) / 0.2) ** 2 * 260 : 0;
    rect(-3, -36 - up, 6, 30, '#eceff1'); tri(-3, -36 - up, 0, -44 - up, 3, -36 - up, '#e63946');
    if (up) { tri(-3, -6 - up, 0, 8 - up + Math.random() * 6, 3, -6 - up, '#ff9f1c'); smoke(0, -4, t * 3, s, false); }
  },
  arcology: (t, s) => { tri(-60, 0, 0, -130, 60, 0, '#3a506b'); tri(-45, 0, 0, -100, 45, 0, '#5bc0be33'); for (let j = 1; j < 12; j++) for (let i = -j; i <= j; i += 2) if (hash(s, i, j) > 0.4) rect(i * 4.5 - 1, -130 + j * 10, 2, 2, night > 0.3 ? '#9bf6ff' : '#1c2541'); },
  quantum: (t, s) => { rect(-16, -18, 32, 18, '#240046'); const r = 6 + Math.sin(t * 4 + s) * 1.5; ctx.globalAlpha = 0.6; circ(0, -24, r + 4, '#c77dff'); ctx.globalAlpha = 1; circ(0, -24, r, '#e0aaff'); },
};

// ---------- cielo e paesaggio
let mountains = null;
function genMountains() {
  mountains = [0, 1].map(l => { const pts = []; for (let x = 0; x <= W + 40; x += 40) pts.push([x, GROUND - 30 - l * -15 - (hash(l, x) * 60 + Math.sin(x / 140 + l) * 25) * (l ? 0.6 : 1)]); return pts; });
}
function drawMountains(c, l) {
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, GROUND);
  for (const [x, y] of mountains[l]) ctx.lineTo(x, y);
  ctx.lineTo(W, GROUND); ctx.fill();
}

function drawSky(s, t) {
  const E = ERAS[s.era], pol = s.pollution / 100 * 0.75;
  const top = mix(mix(E.sky[1], '#060818', night * 0.9), '#5a4632', pol), bot = mix(mix(E.sky[0], '#1b1f3b', night * 0.85), '#8a6a4a', pol);
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, GROUND);
  if (night > 0.2) {
    ctx.globalAlpha = (night - 0.2) * (1 - pol);
    for (let i = 0; i < 120; i++) circ(hash('s', i) * W, hash('y', i) * GROUND * 0.8, hash('r', i) * 1.3 + 0.3, '#fff');
    ctx.globalAlpha = 1;
  }
  // sole e luna
  const ph = (t / 180) % 1, ang = ph * Math.PI * 2;
  const sx = W / 2 - Math.cos(ang) * W * 0.45, sy = GROUND - Math.sin(ang) * 160;
  if (sy < GROUND) {
    ctx.globalAlpha = 0.25; circ(sx, sy, 34, '#ffd166'); ctx.globalAlpha = 1; circ(sx, sy, 18, '#ffe8a3');
    if (s.buildings.dyson) {
      ctx.strokeStyle = '#ffb703'; ctx.lineWidth = 2;
      for (let i = 0; i < s.buildings.dyson; i++) { ctx.beginPath(); ctx.ellipse(sx, sy, 30 + i * 6, 10 + i * 3, t * 0.3 + i, 0, Math.PI * 2); ctx.stroke(); }
    }
  }
  const mx = W / 2 + Math.cos(ang) * W * 0.45, my = GROUND + Math.sin(ang) * 160;
  if (my < GROUND) { circ(mx, my, 12, '#f1f1e6'); circ(mx + 5, my - 3, 11, top); }
  // nuvole
  for (let i = 0; i < 7; i++) {
    const x = (hash('c', i) * (W + 300) + t * (6 + hash('v', i) * 8)) % (W + 300) - 150, y = 25 + hash('h', i) * 80;
    ctx.globalAlpha = 0.6 - night * 0.3;
    const c = mix('#ffffff', '#6d5d4b', pol);
    for (let k = 0; k < 4; k++) circ(x + k * 16, y + Math.sin(k * 2) * 4, 14 + hash(i, k) * 8, c);
  }
  ctx.globalAlpha = 1;
  // arca stellare in orbita
  if (s.buildings.ark) { const x = W * 0.75 + Math.sin(t * 0.1) * 30, y = 50, n = s.buildings.ark; rect(x - n * 12, y - 4, n * 24, 8, '#cfd8dc'); for (let i = 0; i < n; i++) circ(x - n * 12 + 12 + i * 24, y, 6, '#90a4ae'); circ(x + n * 12 + 4, y, 4, '#4cc9f0'); }
  // ascensione digitale: fasci di luce
  if (s.buildings.upload) for (let i = 0; i < s.buildings.upload * 2; i++) { const x = hash('u', i) * W; ctx.globalAlpha = 0.15 + Math.sin(t * 2 + i) * 0.1; rect(x, 0, 6, GROUND, '#c77dff'); }
  ctx.globalAlpha = 1;
  // asteroide in arrivo
  const ast = s.crises.find(c => c.id === 'asteroid');
  if (ast) { const p = 1 - ast.left / 900, x = W * 0.2 + p * W * 0.3, y = 30 + p * 60, r = 4 + p * 26; ctx.globalAlpha = 0.5; tri(x, y - r * 0.6, x - r * 5, y - r * 3, x, y + r * 0.6, '#ff9f1c'); ctx.globalAlpha = 1; circ(x, y, r, '#6d4c41'); }
}

// ---------- edifici, persone, meteo
function instances(s) {
  const out = [];
  for (const id in s.buildings) {
    const b = BUILDINGS[id], n = s.buildings[id];
    if (!n || b.mega || !SPRITES[b.sprite]) continue;
    if (bEra[id] < 5 && s.era - bEra[id] > 2) continue; // gli edifici antichi spariscono col progresso
    const m = Math.min(n, MAX[b.sprite] ?? 8);
    for (let i = 0; i < m; i++) {
      const y = GROUND + 8 + hash(id, i, 'y') * (H - GROUND - 14);
      out.push({ sp: b.sprite, x: 20 + hash(id, i) * (W - 40), y, sc: 0.85 + (y - GROUND) / (H - GROUND) * 0.6, seed: id + i });
    }
  }
  return out.sort((a, b) => a.y - b.y);
}

function drawPeople(s, t) {
  const n = Math.min(s.pop, 70), col = s.era >= 7 ? '#e0fbfc' : s.era >= 5 ? '#2b2d42' : '#4a2c17';
  for (let i = 0; i < n; i++) {
    const dir = hash('d', i) > 0.5 ? 1 : -1, sp = 6 + hash('sp', i) * 10;
    const x = ((hash('px', i) * W + dir * t * sp) % W + W) % W, y = GROUND + 12 + hash('py', i) * (H - GROUND - 16);
    const leg = Math.sin(t * sp * 0.8 + i) * 1.5;
    rect(x - 0.8, y - 7, 1.6, 4, col); circ(x, y - 8.5, 1.5, col);
    rect(x - 0.8 + leg * 0.3, y - 3, 0.8, 3, col); rect(x - leg * 0.3, y - 3, 0.8, 3, col);
  }
}

function drawWeather(s, t) {
  const has = id => s.temp.some(e => e.id === id);
  if (has('winter')) { ctx.fillStyle = '#ffffffcc'; for (let i = 0; i < 150; i++) { const x = (hash('sn', i) * W + Math.sin(t + i) * 10) % W, y = (hash('sy', i) * H + t * (20 + hash('ss', i) * 20)) % H; ctx.fillRect(x, y, 2, 2); } }
  if (has('climate') || has('silt')) { ctx.strokeStyle = '#a8dadc88'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 160; i++) { const x = hash('rx', i) * W, y = (hash('ry', i) * H + t * 300) % H; ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 10); } ctx.stroke(); }
  if (has('drought')) { ctx.fillStyle = '#ffb70322'; ctx.fillRect(0, 0, W, H); }
  if (has('smog') || s.pollution > 40) { ctx.fillStyle = `rgba(110,90,60,${Math.min(0.45, s.pollution / 200 + (has('smog') ? 0.15 : 0))})`; ctx.fillRect(0, 0, W, H); }
  if (has('defeat') || has('riots')) { ctx.fillStyle = `rgba(200,20,20,${0.12 + Math.sin(t * 6) * 0.06})`; ctx.fillRect(0, 0, W, H); for (let i = 0; i < 6; i++) { const x = hash('fx', i) * W, y = GROUND + 20 + hash('fy', i) * 80; ctx.save(); ctx.translate(x, y); ctx.scale(1.4, 1.4); SPRITES.fire(t, i); ctx.restore(); } }
  if (has('cyber') && Math.random() < 0.3) for (let i = 0; i < 5; i++) rect(0, Math.random() * H, W, 2 + Math.random() * 4, `hsla(${Math.random() * 360},100%,60%,.35)`);
  if (has('storm')) { ctx.globalAlpha = 0.25; for (let i = 0; i < 4; i++) { const g = ctx.createLinearGradient(0, 0, 0, 120); g.addColorStop(0, i % 2 ? '#80ffdb' : '#c77dff'); g.addColorStop(1, 'transparent'); ctx.fillStyle = g; ctx.fillRect(W * i / 4 + Math.sin(t + i) * 40, 0, W / 4, 120); } ctx.globalAlpha = 1; }
  if (s.zeroStabT > 0 || s.crises.length) { ctx.strokeStyle = `rgba(235,87,87,${0.4 + Math.sin(t * 5) * 0.3})`; ctx.lineWidth = 6; ctx.strokeRect(3, 3, W - 6, H - 6); }
}

function draw(s, t) {
  night = Math.max(0, Math.min(1, (Math.cos((t / 180) * Math.PI * 2) + 0.15) * 1.3));
  ctx.clearRect(0, 0, W, H);
  drawSky(s, t);
  const E = ERAS[s.era];
  drawMountains(mix(mix('#6c7a89', '#1a1d2e', night * 0.7), E.ground, 0.25), 0);
  drawMountains(mix(mix('#4f6d55', '#13161f', night * 0.7), E.ground, 0.5), 1);
  const g = ctx.createLinearGradient(0, GROUND, 0, H);
  g.addColorStop(0, mix(E.ground, '#0b0d14', night * 0.6)); g.addColorStop(1, mix(E.ground, '#000000', 0.35 + night * 0.4));
  ctx.fillStyle = g; ctx.fillRect(0, GROUND, W, H - GROUND);
  // alberi: diminuiscono con il progresso
  const trees = Math.max(4, 40 - s.era * 4 - Math.floor(Object.values(s.buildings).reduce((a, b) => a + b, 0) / 8));
  for (let i = 0; i < trees; i++) { const x = hash('t', i) * W, y = GROUND + 2 + hash('ty', i) * 8; rect(x - 1, y - 8, 2, 8, '#3e2723'); circ(x, y - 11, 5 + hash('ts', i) * 3, mix('#2d6a4f', '#0b1a12', night * 0.6)); }
  // ferrovia e treno
  if (s.buildings.railway && s.era < 8) { rect(0, H - 9, W, 2, '#5d4037'); const x = (t * 60) % (W + 120) - 120; rect(x, H - 20, 30, 11, '#263238'); for (let i = 1; i < 4; i++) rect(x - i * 30, H - 18, 27, 9, '#8d6e63'); smoke(x + 24, H - 22, t, 'tr', true); }
  for (const b of instances(s)) {
    ctx.save(); ctx.translate(b.x, b.y); ctx.scale(b.sc, b.sc);
    SPRITES[b.sp](t, b.seed.length + hash(b.seed) * 10);
    ctx.restore();
  }
  drawPeople(s, t);
  // veicoli volanti e aerei
  if (s.era >= 7) for (let i = 0; i < 6 + s.era; i++) { const d = i % 2 ? 1 : -1, x = ((hash('fv', i) * W + d * t * (40 + i * 7)) % W + W) % W, y = 110 + hash('fy', i) * 50; rect(x - 5, y, 10, 3, '#adb5bd'); circ(x + 5 * d, y + 1, 1.2, night > 0.3 ? '#ff4d6d' : '#adb5bd'); }
  else if (s.era === 6) { const x = (t * 90) % (W + 400) - 200; tri(x - 14, 60, x + 10, 63, x - 14, 66, '#e0e0e0'); rect(x - 6, 57, 6, 12, '#cfcfcf'); }
  if (s.buildings.planet_shield) { ctx.globalAlpha = 0.18 + Math.sin(t * 2) * 0.05; ctx.fillStyle = '#4cc9f0'; ctx.beginPath(); ctx.ellipse(W / 2, H, W * 0.7, H * 0.95, 0, Math.PI, 0); ctx.fill(); ctx.globalAlpha = 1; }
  if (night > 0.3) { ctx.fillStyle = `rgba(5,8,25,${(night - 0.3) * 0.35})`; ctx.fillRect(0, 0, W, H); }
  drawWeather(s, t);
}

export function initScene(canvas, getState) {
  ctx = canvas.getContext('2d');
  const fit = () => {
    const dpr = devicePixelRatio || 1;
    W = canvas.clientWidth;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    genMountains();
  };
  addEventListener('resize', fit); fit();
  const loop = now => { const s = getState(); if (s) draw(s, now / 1000); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
