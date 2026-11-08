// Ascesa — motore di gioco (nessun accesso al DOM: gira anche in node per i test)
import { RES, JOBS, BUILDINGS, TECHS, ERAS, ACHIEVEMENTS, DIFFICULTY } from './data.js';
import { runEvents } from './events.js';

export const SAVE_KEY = 'ascesa_save_v1';
export const LEGACY_KEY = 'ascesa_legacy_v1';
const FOOD_PER_POP = 0.25, IDLE_FOOD = 0.15, BASE_HOUSING = 5;

const keys = o => Object.keys(o);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function newState(difficulty = 'normal', legacy = 0) {
  return {
    v: 1, t: 0, difficulty, era: 1, eraStart: 0, legacy,
    res: { ...Object.fromEntries(keys(RES).map(r => [r, 0])), food: 40, wood: 10 },
    pop: 3, growthAcc: 0, starveAcc: 0,
    jobs: { ...Object.fromEntries(keys(JOBS).map(j => [j, 0])), forager: 2 },
    buildings: Object.fromEntries(keys(BUILDINGS).map(b => [b, 0])),
    techs: {}, stability: 60, pollution: 0, aiRisk: 0, zeroStabT: 0,
    temp: [], crises: [], crisesDone: {}, nextEvent: 150, choice: null,
    log: [], stats: { clicks: 0, raidsWon: 0, raidsLost: 0, events: 0, maxPop: 3, died: 0, crisesWon: 0, revoltSurvived: 0 }, hist: [],
    research: null, queue: [],
    ach: {}, clickTarget: 'food', over: null, won: null, eraUp: null,
    seen: { food: 1, wood: 1, knowledge: 1 }, created: Date.now(), last: Date.now(),
  };
}

export function log(s, msg, type = 'info') {
  s.log.unshift({ t: s.t, msg, type });
  if (s.log.length > 120) s.log.length = 120;
}

export const has = (s, req) => !req || !!s.techs[req];
export const groupTaken = (s, g) => keys(s.techs).find(id => TECHS[id].group === g);

// ---------- modificatori
export function mods(s) {
  const m = { jm: {}, rm: {}, stab: 0, housing: 1, cap: 1, def: 1, pol: 1, ai: 1, growth: 1, click: 1, clickPct: 0.01, loot: 1, foodCons: 1, energy: 1, shield: new Set() };
  const apply = fx => {
    for (const k in fx) {
      const v = fx[k];
      if (k === 'jm' || k === 'rm') for (const x in v) m[k][x] = (m[k][x] ?? 1) * v[x];
      else if (k === 'stab' || k === 'clickPct') m[k] += v;
      else if (k === 'shield') v.forEach(x => m.shield.add(x));
      else m[k] *= v;
    }
  };
  for (const id in s.techs) apply(TECHS[id].fx || {});
  for (const e of s.temp) apply(e.fx || {});
  m.rm.all = (m.rm.all ?? 1) * DIFFICULTY[s.difficulty].prod * (1 + 0.03 * s.legacy) * (1 + 0.02 * keys(s.ach).length);
  return m;
}

export const employed = s => keys(s.jobs).reduce((a, j) => a + s.jobs[j], 0);
export const stabMult = s => 0.6 + s.stability * 0.008;

// ---------- calcolo di tutte le rendite
// sup: frazione di rifornimento per le risorse esaurite (secondo passaggio, vedi in fondo)
export function calc(s, m = mods(s), sup = null) {
  const fuel = b => b.use && sup ? Math.min(1, ...Object.keys(b.use).map(k => sup[k] ?? 1)) : 1;
  const r = { m, prod: {}, cons: {}, net: {}, useBy: {}, short: sup || {}, caps: {}, slots: {}, housing: BASE_HOUSING, energyProd: 0, energyDem: 0, eff: 1, def: 0, pol: 0, ai: 0, stabParts: [] };
  for (const k in RES) { r.prod[k] = 0; r.cons[k] = 0; r.caps[k] = RES[k].cap; }
  let bStab = 0, bDef = 0;
  for (const id in s.buildings) {
    const n = s.buildings[id], b = BUILDINGS[id];
    if (!n) continue;
    if (b.housing) r.housing += b.housing * n;
    if (b.caps) for (const k in b.caps) r.caps[k] += b.caps[k] * n;
    if (b.slots) for (const j in b.slots) r.slots[j] = (r.slots[j] || 0) + b.slots[j] * n;
    if (b.energy > 0) r.energyProd += b.energy * n * fuel(b); else if (b.energy < 0) r.energyDem -= b.energy * n;
  }
  r.energyProd *= m.energy;
  r.eff = r.energyDem > 0 ? Math.min(1, r.energyProd / r.energyDem) : 1;
  r.housing = Math.floor(r.housing * m.housing);
  for (const k in r.caps) r.caps[k] *= m.cap;

  for (const id in s.buildings) {
    const n = s.buildings[id], b = BUILDINGS[id];
    if (!n) continue;
    const f = fuel(b), e = (b.energy < 0 ? r.eff : 1) * f;
    if (b.prod) for (const k in b.prod) r.prod[k] += b.prod[k] * n * e;
    if (b.use) for (const k in b.use) { const u = b.use[k] * n * e; r.cons[k] += u; (r.useBy[k] ||= []).push([`${b.icon} ${b.name} ×${n}`, u]); }
    if (b.pol) r.pol += b.pol * n * (b.pol > 0 ? m.pol * e : 1);
    if (b.ai) r.ai += b.ai * n * (b.ai > 0 ? m.ai * e : 1);
    if (b.stab) bStab += b.stab * n * (b.stab > 0 ? f : 1);
    if (b.def) bDef += b.def * n * f;
  }

  let sDef = 0, pStab = 0;
  for (const j in s.jobs) {
    const n = s.jobs[j], J = JOBS[j];
    if (!n) continue;
    const k = (m.jm[j] ?? 1) * (J.power ? r.eff : 1);
    for (const res in J.out) r.prod[res] += J.out[res] * n * k;
    if (J.def) sDef += J.def * n * k;
    if (J.stab) pStab += J.stab * n * k;
  }
  const idle = s.pop - employed(s);
  r.prod.food += idle * IDLE_FOOD;
  const sm = stabMult(s);
  for (const k in r.prod) r.prod[k] *= (m.rm[k] ?? 1) * (m.rm.all ?? 1) * sm;
  r.cons.food += s.pop * FOOD_PER_POP * m.foodCons;
  (r.useBy.food ||= []).unshift(['👥 Popolazione', s.pop * FOOD_PER_POP * m.foodCons]);
  for (const k in RES) r.net[k] = r.prod[k] - r.cons[k];
  // scorta esaurita e consumo > produzione: gli edifici che la usano lavorano solo in proporzione
  if (!sup) {
    const short = {};
    for (const k in RES) if (k !== 'food' && s.res[k] <= 0 && r.net[k] < 0) short[k] = r.prod[k] / r.cons[k];
    if (Object.keys(short).length) return calc(s, m, short);
  }
  r.def = sDef * m.def + bDef;
  r.idle = idle;

  // stabilità: somma di fattori
  const parts = r.stabParts;
  parts.push(['Base', 50]);
  if (bStab) parts.push(['Edifici', bStab > 0 ? 35 * (1 - Math.exp(-bStab / 35)) : bStab]); // rendimenti decrescenti
  if (pStab) parts.push(['Sacerdoti', Math.min(30, pStab)]);
  if (m.stab) parts.push(['Tecnologie ed eventi', m.stab]);
  if (s.pop > 10) parts.push(['Dimensione della civiltà', -Math.log10(s.pop / 10) * 6]);
  if (s.era > 1) parts.push(['Complessità sociale', -(s.era - 1) * 4]);
  if (idle > 0 && s.pop > 5) parts.push(['Disoccupazione', -Math.min(20, (idle / s.pop) * 40)]);
  if (s.res.food <= 0 && r.net.food < 0) parts.push(['Carestia', -30]);
  if (s.pop >= r.housing && s.pop > 5) parts.push(['Sovraffollamento', -3]);
  if (s.pollution > 5) parts.push(['Inquinamento', -s.pollution * 0.35]);
  if (s.aiRisk > 40) parts.push(['Paura delle IA', -(s.aiRisk - 40) * 0.3]);
  if (r.eff < 1) parts.push(['Blackout', -15 * (1 - r.eff)]);
  r.stabTarget = clamp(parts.reduce((a, p) => a + p[1], 0), 0, 100);
  return r;
}

// ---------- popolazione
export function killPop(s, n) {
  n = Math.min(s.pop, Math.max(0, Math.floor(n)));
  if (!n) return 0;
  s.pop -= n;
  s.stats.died += n;
  fixJobs(s);
  return n;
}

// ripristina lavori validi (popolazione o posti diminuiti)
export function fixJobs(s, r) {
  let over = employed(s) - s.pop;
  const js = keys(s.jobs).sort((a, b) => s.jobs[b] - s.jobs[a]);
  while (over > 0) {
    for (const j of js) {
      if (over <= 0) break;
      const d = Math.min(s.jobs[j], Math.ceil(over / 3));
      s.jobs[j] -= d; over -= d;
    }
  }
  if (r) for (const j in s.jobs) if (JOBS[j].slots) s.jobs[j] = Math.min(s.jobs[j], r.slots[j] || 0);
}

export const jobCap = (s, j, r) => JOBS[j].slots ? (r.slots[j] || 0) : Infinity;

export function assign(s, j, n, r = calc(s)) {
  if (!has(s, JOBS[j].req)) return 0;
  if (n > 0) n = Math.min(n, s.pop - employed(s), jobCap(s, j, r) - s.jobs[j]);
  else n = Math.max(n, -s.jobs[j]);
  s.jobs[j] += n;
  return n;
}

// ---------- click
export function clickTargets(s) {
  return ['food', 'wood', 'stone', 'metal', 'gold', 'knowledge'].filter(k =>
    k === 'stone' ? has(s, 'stone_tools') : k === 'metal' ? has(s, 'bronze') : k === 'gold' ? has(s, 'currency') : true);
}
export function clickValue(s, r = calc(s)) {
  const t = s.clickTarget, m = r.m;
  return m.click * (m.rm[t] ?? 1) * (m.rm.all ?? 1) + Math.max(0, r.prod[t]) * m.clickPct;
}
export function click(s) {
  if (s.over || s.won) return 0;
  const r = calc(s), v = clickValue(s, r), t = s.clickTarget;
  s.res[t] = Math.min(r.caps[t], s.res[t] + v);
  s.seen[t] = 1;
  s.stats.clicks++;
  return v;
}

// ---------- costi, edifici, tecnologie
export const scaleCost = (c, k) => Object.fromEntries(keys(c).map(r => [r, Math.ceil(c[r] * k)]));
export const canAfford = (s, c) => keys(c).every(k => s.res[k] >= c[k]);
export const pay = (s, c) => keys(c).forEach(k => { s.res[k] -= c[k]; });

export function bCost(s, id) {
  const b = BUILDINGS[id];
  return scaleCost(b.cost, Math.pow(b.mult ?? 1.15, s.buildings[id]));
}
export function bLocked(s, id) {
  const b = BUILDINGS[id];
  if (!has(s, b.req)) return 'bloccato';
  if (b.max && s.buildings[id] >= b.max) return 'completato';
  if (id === 'upload' && s.aiRisk >= 40) return 'Rischio IA troppo alto';
  return null;
}
export function buy(s, id, qty = 1) {
  let done = 0;
  while (done < qty && !bLocked(s, id)) {
    const c = bCost(s, id);
    if (!canAfford(s, c)) break;
    pay(s, c);
    s.buildings[id]++;
    done++;
    const b = BUILDINGS[id];
    if (b.mega) {
      log(s, `${b.icon} ${b.name}: fase ${s.buildings[id]}/${b.max} completata!`, 'good');
      if (s.buildings[id] >= b.max) s.won = { id, t: s.t };
    }
  }
  return done;
}

export function techAvailable(s, id) {
  const t = TECHS[id];
  if (s.techs[id] || t.era > s.era) return false;
  if (t.group && groupTaken(s, t.group)) return false;
  return (t.req || []).every(q => q.startsWith('group:') ? groupTaken(s, q.slice(6)) : s.techs[q]);
}
// ricerca: si paga subito (anche se va in coda) e richiede tempo; una alla volta
const RTIME = [0, 15, 30, 50, 75, 100, 140, 180, 240]; // secondi per era, ×3 per il passaggio d'era
export const techTime = id => RTIME[TECHS[id].era] * (TECHS[id].advance ? 3 : 1);
const planned = s => [s.research?.id, ...s.queue].filter(Boolean);
// come techAvailable, ma conta come già scoperte le tecnologie in corso o in coda
export function techQueueable(s, id) {
  const t = TECHS[id], P = planned(s);
  const got = q => s.techs[q] || P.includes(q), taken = g => groupTaken(s, g) || P.some(p => TECHS[p].group === g);
  if (got(id) || t.era > s.era || (t.group && taken(t.group))) return false;
  return (t.req || []).every(q => q.startsWith('group:') ? taken(q.slice(6)) : got(q));
}
export function research(s, id) {
  if (!techQueueable(s, id) || !canAfford(s, TECHS[id].cost)) return false;
  pay(s, TECHS[id].cost);
  s.queue.push(id);
  startNext(s);
  return true;
}
// toglie dalla coda la tecnologia e quelle che ne dipendono, rimborsandole
export function unqueue(s, id) {
  const q = s.queue;
  s.queue = [];
  for (const x of q) {
    if (x !== id && techQueueable(s, x)) s.queue.push(x);
    else for (const k in TECHS[x].cost) s.res[k] += TECHS[x].cost[k];
  }
}
function startNext(s) {
  if (s.research || !s.queue.length) return;
  const id = s.queue.shift();
  s.research = { id, left: techTime(id), total: techTime(id) };
}
function complete(s, id) {
  const t = TECHS[id];
  s.techs[id] = s.t;
  if (t.advance) {
    s.era = t.advance; s.eraStart = s.t; s.eraUp = t.advance;
    log(s, `🌅 Inizia l'era: ${ERAS[t.advance].name}!`, 'era');
  } else log(s, `🔬 Scoperta: ${t.name}`, 'tech');
}

export function year(s) {
  const ids = keys(TECHS).filter(id => TECHS[id].era === s.era);
  const f = ids.filter(id => s.techs[id]).length / ids.length;
  const [a, b] = ERAS[s.era].years;
  const y = Math.round(a + (b - a) * f);
  return y < 0 ? `${-y} a.C.` : `${y} d.C.`;
}

// ---------- tick
export function tick(s, dt, opts = {}) {
  if (s.over || s.won || s.choice) return;
  s.t += dt;
  if (s.research && (s.research.left -= dt) <= 0) { complete(s, s.research.id); s.research = null; }
  startNext(s);
  const r = calc(s);
  for (const k in RES) {
    s.res[k] = clamp(s.res[k] + r.net[k] * dt, 0, Math.max(r.caps[k], 0));
    if (s.res[k] > 0) s.seen[k] = 1;
  }
  // fame
  const starving = s.res.food <= 0 && r.net.food < 0;
  if (starving) {
    s.starveAcc += dt;
    if (s.starveAcc >= 3) {
      s.starveAcc = 0;
      const n = killPop(s, Math.max(1, Math.ceil(s.pop * 0.04)));
      if (opts.offline && s.pop < 1) s.pop = 1;
      log(s, `💀 Carestia: ${n} persone muoiono di fame!`, 'bad');
    }
  } else s.starveAcc = 0;
  // crescita
  if (!starving && s.res.food > 0 && s.pop < r.housing) {
    s.growthAcc += dt * (0.15 + s.pop * 0.015) * r.m.growth * clamp(s.stability / 50, 0.2, 1.5);
    const n = Math.min(Math.floor(s.growthAcc), r.housing - s.pop);
    if (n > 0) { s.pop += n; s.growthAcc -= n; }
  } else s.growthAcc = 0;
  if (s.pop > r.housing && !opts.offline) { // alloggi persi: la gente se ne va
    s.pop = Math.max(r.housing, s.pop - Math.ceil((s.pop - r.housing) * dt * 0.1));
  }
  s.stats.maxPop = Math.max(s.stats.maxPop, s.pop);
  fixJobs(s, r);
  s.stability = clamp(s.stability + (r.stabTarget - s.stability) * Math.min(1, dt * 0.05), 0, 100);
  s.pollution = clamp(s.pollution + (r.pol - 0.02) * dt, 0, 100);
  s.aiRisk = clamp(s.aiRisk + r.ai * dt, 0, 100);
  s.temp = s.temp.filter(e => e.until > s.t);
  runEvents(s, dt, r, opts);
  for (const id in ACHIEVEMENTS) if (!s.ach[id] && ACHIEVEMENTS[id].cond(s, r)) {
    s.ach[id] = s.t;
    log(s, `🏅 Traguardo: ${ACHIEVEMENTS[id].name} (+2% produzione)`, 'good');
  }
  if (s.t - (s.hist.at(-1)?.[0] ?? -99) >= 30) {
    s.hist.push([Math.round(s.t), s.pop, Math.round(r.prod.knowledge)]);
    if (s.hist.length > 400) s.hist = s.hist.filter((_, i) => i % 2);
  }
}

// progressi mentre il gioco era chiuso (max 4 ore, senza eventi)
export function offline(s) {
  const sec = Math.min(4 * 3600, (Date.now() - s.last) / 1000);
  if (sec < 60 || s.over || s.won || s.choice) return null;
  const before = { ...s.res }, pop = s.pop;
  for (let t = sec; t > 0; t -= 10) tick(s, Math.min(10, t), { offline: true });
  return { sec, gain: Object.fromEntries(keys(RES).map(k => [k, s.res[k] - before[k]])), pop: s.pop - pop };
}

// punti eredità a fine partita
export function endRun(s, L) {
  if (s.legacyAwarded) return s.legacyPts;
  s.legacyAwarded = true;
  const k = { easy: 0.5, normal: 1, hard: 1.5 }[s.difficulty];
  const pts = Math.max(1, Math.round(((s.era - 1) * 2 + (s.won ? 15 : 0) + Object.keys(s.ach).length * 0.25) * k));
  L.points += pts; L.runs++; L.best = Math.max(L.best, s.era);
  if (s.won) { L.wins++; L.endings[s.won.id] = 1; }
  return (s.legacyPts = pts);
}

// ---------- salvataggio
export function save(s, store = globalThis.localStorage) {
  s.last = Date.now();
  store.setItem(SAVE_KEY, JSON.stringify(s));
}
export function load(store = globalThis.localStorage) {
  try {
    const d = JSON.parse(store.getItem(SAVE_KEY));
    if (!d) return null;
    const base = newState(d.difficulty, d.legacy);
    for (const k of ['res', 'jobs', 'buildings', 'stats']) d[k] = { ...base[k], ...d[k] };
    return { ...base, ...d };
  } catch { return null; }
}
export function loadLegacy(store = globalThis.localStorage) {
  try { return { points: 0, runs: 0, wins: 0, best: 0, endings: {}, ...JSON.parse(store.getItem(LEGACY_KEY)) }; }
  catch { return { points: 0, runs: 0, wins: 0, best: 0, endings: {} }; }
}
export const saveLegacy = (L, store = globalThis.localStorage) => store.setItem(LEGACY_KEY, JSON.stringify(L));
