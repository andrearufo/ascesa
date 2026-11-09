// Controllo dati + bot greedy che gioca una partita intera. Uso: node test/sim.js [partite] [difficoltà]
// SAVE=file.txt riparte da un salvataggio esportato dal gioco (📤 Esporta).
import assert from 'node:assert';
import fs from 'node:fs';
import { RES, JOBS, BUILDINGS, TECHS, ACHIEVEMENTS } from '../js/data.js';
import * as G from '../js/engine.js';
import { CRISES, EVENTS, choose, resolveCrisis, threat } from '../js/events.js';

// --- integrità dei dati
for (const [id, t] of Object.entries(TECHS)) for (const q of t.req || []) assert(q.startsWith('group:') || TECHS[q], `${id}: req ${q}`);
for (const [id, b] of Object.entries(BUILDINGS)) { assert(!b.req || TECHS[b.req], `${id}: req ${b.req}`); for (const k in b.cost) assert(RES[k], `${id}: cost ${k}`); }
for (const [id, j] of Object.entries(JOBS)) assert(!j.req || TECHS[j.req], `${id}: req`);
for (const e of Object.values(EVENTS)) assert(e.run || e.options);
console.log(`dati ok: ${Object.keys(TECHS).length} tecnologie, ${Object.keys(BUILDINGS).length} edifici, ${Object.keys(EVENTS).length} eventi, ${Object.keys(ACHIEVEMENTS).length} traguardi`);

const m = t => `${Math.round(t / 60)}m`;
const era = id => BUILDINGS[id].req ? TECHS[BUILDINGS[id].req].era : 1;
const sum = c => Object.values(c).reduce((a, b) => a + b, 0);

function setJobs(s) {
  for (const j in s.jobs) s.jobs[j] = 0;
  let r = G.calc(s);
  const put = (j, n) => G.assign(s, j, Math.floor(n), r);
  // cibo: contadini poi raccoglitori finché il saldo è positivo
  for (const j of ['farmer', 'forager']) {
    while (G.employed(s) < s.pop && (r = G.calc(s)).net.food - r.idle * 0.15 * (r.m.rm.food ?? 1) * r.m.rm.all * G.stabMult(s) < Math.max(1, r.cons.food * 0.15)) if (!put(j, Math.max(1, s.pop * 0.02))) break;
  }
  r = G.calc(s);
  if (G.has(s, 'spears')) {
    const per = (r.m.jm.soldier ?? 1) * r.m.def, need = Math.max(0, (threat(s) * 1.4 - (r.def - s.jobs.soldier * per)) / per);
    put('soldier', Math.min(need, s.pop * 0.25));
  }
  r = G.calc(s);
  if (s.era < 6) { put('woodcutter', s.pop * 0.1); put('quarrier', s.pop * 0.1); }
  for (const j of ['scholar', 'scientist', 'technician', 'engineer', 'worker', 'miner', 'merchant']) put(j, 1e15);
  if (s.stability < 70) put('priest', 1e15);
  const free = s.pop - G.employed(s);
  put('sage', free * 0.4); put('woodcutter', free * 0.3); put('quarrier', 1e15); put('woodcutter', 1e15);
}

function shop(s) {
  const r = G.calc(s), avail = Object.keys(BUILDINGS).filter(id => !G.bLocked(s, id));
    const reserve = {};
  for (const c of s.crises) if (CRISES[c.id].cost) Object.assign(reserve, CRISES[c.id].cost(s));
  if (s.crises.some(c => c.id === 'asteroid')) for (const id of ['quantum_fab', 'planet_shield']) if (!G.bLocked(s, id) && !(id === 'quantum_fab' && s.buildings.quantum_fab)) for (const [k, v] of Object.entries(G.bCost(s, id))) reserve[k] = Math.max(reserve[k] || 0, v);
  for (const id of Object.keys(TECHS).filter(id => G.techAvailable(s, id) && !G.canAfford(s, TECHS[id].cost)))
    for (const k in TECHS[id].cost) if (TECHS[id].cost[k] <= r.caps[k]) reserve[k] = Math.max(reserve[k] || 0, TECHS[id].cost[k]);
  const cost = id => G.bCost(s, id);
  const ok = (id, strict) => { const c = cost(id); return G.canAfford(s, c) && (!strict || Object.keys(c).every(k => s.res[k] - c[k] >= (reserve[k] || 0) * 0.8)); };
  const best = (f, score, strict) => avail.filter(f).filter(id => ok(id, strict)).sort((a, b) => score(a) - score(b))[0];
  if (s.crises.some(c => c.id === 'asteroid')) { for (const id of ['planet_shield', 'quantum_fab']) if (!G.bLocked(s, id) && !(id === 'quantum_fab' && s.buildings.quantum_fab) && G.canAfford(s, cost(id))) G.buy(s, id); return; }
  const picks = [
    best(id => BUILDINGS[id].mega, () => 0),
    s.pop >= r.housing * 0.9 && best(id => BUILDINGS[id].housing, id => sum(cost(id)) / BUILDINGS[id].housing, true),
    r.eff < 1.05 && r.energyDem && best(id => BUILDINGS[id].energy > 0, id => sum(cost(id)) / BUILDINGS[id].energy, r.eff > 0.9),
    s.pollution > 20 && best(id => BUILDINGS[id].pol < 0, id => sum(cost(id))),
    s.pollution > 20 && best(id => BUILDINGS[id].pol < 0, id => sum(cost(id))),
    s.aiRisk > 35 && best(id => BUILDINGS[id].ai < 0, id => sum(cost(id))),
    r.def < threat(s) * 1.2 && best(id => BUILDINGS[id].def, id => sum(cost(id)) / BUILDINGS[id].def),
    s.stability < 45 && best(id => BUILDINGS[id].stab > 0, id => sum(cost(id))),
  ];
  // magazzini se un costo supera la capacità
  const wanted = [...s.crises.filter(c => CRISES[c.id].cost).map(c => CRISES[c.id].cost(s)), ...Object.keys(TECHS).filter(id => G.techAvailable(s, id)).map(id => TECHS[id].cost), ...avail.map(cost)];
  for (const k in RES) if (r.caps[k] !== Infinity && wanted.some(c => c[k] > r.caps[k] * 0.9)) picks.push(best(id => BUILDINGS[id].caps?.[k], id => sum(cost(id)) / BUILDINGS[id].caps[k]));
  picks.push(best(id => !BUILDINGS[id].mega && (BUILDINGS[id].slots || BUILDINGS[id].prod) && !(BUILDINGS[id].pol > 0 && s.pollution > 30) && !(BUILDINGS[id].ai > 0 && s.aiRisk > 50), id => -era(id) * 1e30 + sum(cost(id)), true));
  for (const id of picks) if (id) G.buy(s, id);
}

function play(diff, seed) {
  const raw = process.env.SAVE && decodeURIComponent(escape(atob(fs.readFileSync(process.env.SAVE, 'utf8').trim())));
  const s = raw ? G.load({ getItem: () => raw }) : G.newState(diff), eras = {}, wait = {};
  let ch = 0; const short = {};
  for (let t = 0; t < 10 * 3600 && !s.over && !s.won; t++) {
    if (s.choice) { choose(s, (ch++ + seed) % EVENTS[s.choice.id].options.length, G.calc(s)); continue; }
    for (const c of s.crises) resolveCrisis(s, c.id, G.calc(s));
    const techs = Object.keys(TECHS).filter(id => G.techAvailable(s, id)).sort((a, b) => sum(TECHS[a].cost) - sum(TECHS[b].cost));
    const groups = {};
    for (const id of techs) { const g = TECHS[id].group; if (g) (groups[g] ||= []).push(id); }
    // una ricerca alla volta, avviata solo quando è pagabile (niente coda)
    if (!s.research && !s.crises.some(c => CRISES[c.id].cost)) for (const id of techs) if ((!TECHS[id].group || groups[TECHS[id].group][seed % groups[TECHS[id].group].length] === id) && G.canAfford(s, TECHS[id].cost) && G.research(s, id)) break;
    if (!eras[s.era] && s.era > 1) eras[s.era] = s.t;
    if (t % 5 === 0) setJobs(s);
    shop(s);
    if (s.res.knowledge < 20 || t % 2) G.click(s);
    G.tick(s, 1);
    for (const k in G.calc(s).short) short[`e${s.era}:${k}`] = (short[`e${s.era}:${k}`] || 0) + 1;
    if (process.env.A && t % 120 === 0 && s.era === 8) console.log(`  ${m(t)} ast ${s.crises.map(c => c.id + ':' + Math.round(c.left)).join(',')} qf ${s.buildings.quantum_fab} eng ${s.jobs.engineer} ex ${Math.round(s.res.exotic)} m ${s.res.metal.toExponential(1)} mrate ${G.calc(s).prod.metal.toExponential(1)} pd ${!!s.techs.planetary_defense} g ${s.res.gold.toExponential(1)} capM ${G.calc(s).caps.metal.toExponential(1)} capG ${G.calc(s).caps.gold.toExponential(1)} ps ${s.buildings.planet_shield} lock ${G.bLocked(s,"planet_shield")} sp ${s.buildings.spaceport} eff ${G.calc(s).eff.toFixed(2)}`);
    const adv = Object.keys(TECHS).find(id => TECHS[id].advance && G.techAvailable(s, id));
    if (adv) for (const k in TECHS[adv].cost) if (s.res[k] < TECHS[adv].cost[k]) { const key = `e${s.era}:${k}${TECHS[adv].cost[k] > G.calc(s).caps[k] ? '(cap)' : ''}`; wait[key] = (wait[key] || 0) + 1; }
    if (process.env.V && t % 300 === 0) { const r = G.calc(s); console.log(`  ${m(t)} e${s.era} pop ${s.pop}/${r.housing} prod ${Object.entries(r.prod).filter(([, v]) => v).map(([k, v]) => k[0] + v.toExponential(1)).join(' ')} capM ${r.caps.metal.toExponential(1)} hub ${s.buildings.hub} sp ${s.buildings.spaceport} fac ${s.buildings.factory} wk ${s.jobs.worker} dc ${s.buildings.datacenter} fus ${s.buildings.fusion_plant} eff ${G.calc(s).eff.toFixed(2)} def ${Math.round(r.def)}/${threat(s)} stab ${s.stability.toFixed(0)} pol ${s.pollution.toFixed(0)}/${(G.calc(s).pol*60).toFixed(2)} park ${s.buildings.park} filt ${s.buildings.filter} coal ${s.buildings.coal_plant} oil ${s.buildings.oil_plant} eff ${r.eff.toFixed(2)} res ${Object.entries(s.res).map(([k, v]) => k[0] + Math.round(v)).join(' ')} next ${Object.keys(TECHS).filter(id => G.techAvailable(s, id)).join(',')}`); }
  }
  return { s, eras, wait, short };
}

const runs = +(process.argv[2] || 3), diff = process.argv[3] || 'normal';
for (let i = +(process.argv[4] || 0); i < runs; i++) {
  const { s, eras, wait, short } = play(diff, i);
  const r = G.calc(s);
  console.log('   carenze (min):', Object.entries(short).map(([k, v]) => k + '=' + m(v)).join(' ') || 'nessuna');
  console.log('   attesa avanzamento era (min):', Object.entries(wait).filter(([, v]) => v > 120).map(([k, v]) => k + '=' + m(v)).join(' '));
  console.log(`#${i} ${s.won ? 'VITTORIA ' + s.won.id : s.over ? 'SCONFITTA ' + s.over.id : 'TEMPO SCADUTO'} a ${m(s.t)} · era ${s.era} · pop ${Math.round(s.pop)} · ere: ${Object.entries(eras).map(([e, t]) => e + '@' + m(t)).join(' ')}`);
  const base = ['forager', 'woodcutter', 'quarrier', 'sage'].reduce((a, j) => a + s.jobs[j], 0), sp = (s.buildings.spaceport || 0) * BUILDINGS.spaceport.prod.metal * (r.m.rm.metal ?? 1) * r.m.rm.all * G.stabMult(s);
  console.log(`   fine: lavori antichi ${Math.round(base / s.pop * 100)}% · spazioporti ${Math.round(sp / r.prod.metal * 100)}% del metallo · scorte ${['food', 'wood', 'stone', 'metal', 'gold'].map(k => k[0] + s.res[k].toExponential(1)).join(' ')} · difesa/minaccia ${(r.def / Math.max(1, threat(s))).toFixed(0)}×`);
  console.log(`   razzie ${s.stats.raidsWon}/${s.stats.raidsLost} · crisi ${s.stats.crisesWon} · stab ${s.stability.toFixed(0)} · inq ${s.pollution.toFixed(0)} · IA ${s.aiRisk.toFixed(0)} · k/s ${r.prod.knowledge.toExponential(1)} · tech ${Object.keys(s.techs).length} · ${s.log.filter(l => l.type === 'bad').slice(0, 2).map(l => l.msg).join(' | ')}`);
}
