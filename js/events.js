// Ascesa — eventi, razzie, crisi e sconfitte
import { DIFFICULTY, BUILDINGS, RES } from './data.js';
import { log, killPop, canAfford, pay } from './engine.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const sev = s => DIFFICULTY[s.difficulty].severity;
const pct = (s, p) => Math.max(1, Math.ceil(s.pop * p * sev(s)));

export function addTemp(s, id, name, dur, fx, bad = false) {
  s.temp = s.temp.filter(e => e.id !== id);
  s.temp.push({ id, name, until: s.t + dur * (bad ? sev(s) : 1), fx, bad });
}
function lose(s, frac, keys = ['food', 'wood', 'stone', 'metal', 'gold']) {
  for (const k of keys) s.res[k] *= 1 - Math.min(0.9, frac * sev(s));
}
function destroy(s, ids, n) {
  const own = ids.filter(id => s.buildings[id] > 0);
  let d = 0;
  for (let i = 0; i < n && own.length; i++) {
    const id = pick(own);
    if (s.buildings[id] > 0) { s.buildings[id]--; d++; }
  }
  return d;
}
const housingIds = ['hut', 'house', 'aqueduct', 'townhouse', 'tenement', 'apartment', 'skyscraper', 'arcology'];
const prodFor = (s, r, k, sec) => Math.max(10, r.prod[k] * sec);

// ---------- finali negativi
export const ENDINGS = {
  extinction: { icon: '💀', title: 'Estinzione', text: "L'ultimo membro della tua civiltà è scomparso. Le rovine verranno riscoperte da qualcun altro, un giorno." },
  revolt: { icon: '🔥', title: 'Collasso sociale', text: 'Rivolte e guerre civili hanno dissolto ogni forma di governo. La civiltà si frantuma in mille fazioni.' },
  climate: { icon: '🌡️', title: 'Collasso climatico', text: "L'inquinamento ha reso il pianeta inabitabile. Gli ecosistemi crollano, e con loro la civiltà." },
  ai: { icon: '🤖', title: 'Presa di potere delle IA', text: "Le intelligenze artificiali hanno deciso che l'umanità è un ostacolo ai loro obiettivi. Non c'è stata nemmeno una guerra." },
  nuclear: { icon: '☢️', title: 'Inverno nucleare', text: 'I missili sono partiti. Il cielo si oscura per decenni e la civiltà non si rialzerà più.' },
  asteroid: { icon: '☄️', title: 'Impatto', text: "L'asteroide ha colpito il pianeta. Senza uno scudo, nulla è sopravvissuto." },
};
export function gameOver(s, id) {
  if (s.over) return;
  s.over = { id, t: s.t };
  log(s, `${ENDINGS[id].icon} ${ENDINGS[id].title}. La civiltà è caduta.`, 'bad');
}

// ---------- razzie
const RAID = [0, 5, 25, 120, 350, 2500, 20000, 150000, 1.2e6];
export const threat = s => Math.round(RAID[s.era] * DIFFICULTY[s.difficulty].raid * (1 + Math.min(0.5, (s.t - s.eraStart) / 4800)));

function raid(s, r) {
  const names = ['Una tribù rivale', 'Predoni nomadi', 'Un esercito invasore', 'Un regno nemico', 'Una potenza straniera', 'Una superpotenza ostile', 'Una coalizione di stati', 'Uno sciame di droni ostili'];
  const atk = threat(s) * rnd(0.7, 1.3), who = names[s.era - 1];
  if (r.def >= atk) {
    const loot = Math.min(r.caps.gold, atk * 2 * r.m.loot);
    if (s.seen.gold) s.res.gold = Math.min(r.caps.gold, s.res.gold + loot);
    else s.res.food = Math.min(r.caps.food, s.res.food + atk * 5 * r.m.loot);
    s.stats.raidsWon++;
    addTemp(s, 'victory', '🏆 Vittoria militare', 90, { stab: 5 });
    log(s, `⚔️ ${who} attacca (forza ${Math.round(atk)}) ma viene respinto dalla tua difesa (${Math.round(r.def)})! Bottino conquistato.`, 'good');
  } else {
    const ratio = 1 - r.def / atk;
    lose(s, ratio * 0.25);
    const k = killPop(s, Math.ceil(s.pop * ratio * 0.1 * sev(s)));
    const d = ratio > 0.5 ? destroy(s, housingIds, 1) : 0;
    s.stats.raidsLost++;
    addTemp(s, 'defeat', '💔 Sconfitta militare', 120, { stab: -10 }, true);
    log(s, `⚔️ ${who} ti attacca (forza ${Math.round(atk)} contro difesa ${Math.round(r.def)})! ${k} morti, ${d} abitazioni distrutte, risorse saccheggiate.`, 'bad');
  }
}

// ---------- eventi casuali. era: [min,max], w: peso o funzione, run: effetto immediato, options: scelta
export const EVENTS = {
  raid: { era: [1, 8], w: s => (s.t > 240 ? 3 : 0), run: (s, r) => raid(s, r) },
  winter: { era: [1, 3], w: 2, run: s => { addTemp(s, 'winter', '❄️ Inverno rigido', s.techs.clothing ? 45 : 90, { rm: { food: 0.6 } }, true); return '❄️ Un inverno rigido riduce la produzione di cibo.'; } },
  predators: { era: [1, 1], w: 2, run: (s, r) => r.def >= 3 ? '🐺 Un branco di lupi si aggira attorno al villaggio, ma i guerrieri lo mettono in fuga.' : `🐺 Le belve attaccano il villaggio: ${killPop(s, 1)} vittime.` },
  fire: { era: [1, 4], w: 2, run: s => { lose(s, 0.4, ['wood']); const d = destroy(s, housingIds, 1); return `🔥 Un incendio divampa: perso legno${d ? ' e una abitazione' : ''}.`; } },
  herd: { era: [1, 2], w: 2, good: 1, run: (s, r) => { s.res.food = Math.min(r.caps.food, s.res.food + r.caps.food * 0.5); return '🦬 Una grande mandria migrante: cibo in abbondanza!'; } },
  meteor: { era: [1, 3], w: 1, good: 1, run: (s, r) => { s.res.knowledge += prodFor(s, r, 'knowledge', 90); return '☄️ Una pietra caduta dal cielo stimola la curiosità: conoscenza guadagnata.'; } },
  bounty: { era: [1, 5], w: 2, good: 1, run: s => { addTemp(s, 'bounty', '🌾 Raccolto abbondante', 120, { rm: { food: 1.5 } }); return '🌾 Stagione favorevole: raccolto abbondante!'; } },
  drought: { era: [2, 5], w: 2, run: s => { addTemp(s, 'drought', '☀️ Siccità', 120, { rm: { food: 0.5 } }, true); return '☀️ La siccità colpisce i campi.'; } },
  plague: { era: [2, 5], w: 1.5, run: s => { const p = s.techs.medicine || s.techs.vaccination ? 0.02 : s.techs.hygiene ? 0.04 : 0.1; return `🦠 Un'epidemia si diffonde: ${killPop(s, pct(s, p))} morti.`; } },
  golden: { era: [2, 7], w: 1.5, good: 1, run: s => { addTemp(s, 'golden', "✨ Età dell'oro", 180, { stab: 10, rm: { knowledge: 1.3 } }); return "✨ Inizia un'età dell'oro culturale!"; } },
  genius: { era: [3, 7], w: 1.5, good: 1, run: (s, r) => { s.res.knowledge += prodFor(s, r, 'knowledge', 120); return '💡 Nasce un genio: scoperte straordinarie.'; } },
  great_fire: { era: [3, 5], w: 1, run: s => { lose(s, 0.3, ['wood']); const d = destroy(s, housingIds, 3); return `🔥 Un grande incendio devasta la città: ${d} edifici distrutti.`; } },
  new_world: { era: [4, 4], w: 1.5, good: 1, run: (s, r) => { s.res.gold = Math.min(r.caps.gold, s.res.gold + r.caps.gold * 0.6); return '🗺️ Scoperte nuove terre oltre il mare: oro a fiumi!'; } },
  riots: { era: [2, 8], w: s => (s.stability < 35 ? 4 : 0), run: s => { addTemp(s, 'riots', '🪧 Tumulti', 90, { rm: { all: 0.6 } }, true); return `🪧 Tumulti nelle strade! Produzione ridotta, ${killPop(s, pct(s, 0.01))} vittime.`; } },
  smog: { era: [5, 8], w: s => (s.pollution > 30 ? 3 : 0), run: s => { addTemp(s, 'smog', '🌫️ Smog', 120, { stab: -10 }, true); return `🌫️ Una cappa di smog soffoca le città: ${killPop(s, pct(s, 0.02))} vittime.`; } },
  climate_disaster: { era: [5, 8], w: s => (s.pollution > 55 ? 4 : 0), run: s => { const d = destroy(s, ['farm', 'windmill', 'harbor', ...housingIds], 4); addTemp(s, 'climate', '🌪️ Disastro climatico', 150, { rm: { food: 0.6 }, stab: -8 }, true); return `🌪️ Uragani e inondazioni! ${killPop(s, pct(s, 0.04))} vittime, ${d} edifici distrutti.`; } },
  crash: { era: [5, 7], w: 1, run: s => { lose(s, 0.5, ['gold']); addTemp(s, 'crash', '📉 Recessione', 180, { rm: { gold: 0.5 }, stab: -5 }, true); return '📉 Crollo finanziario: la borsa brucia metà delle riserve auree.'; } },
  invention: { era: [5, 8], w: 1.5, good: 1, run: s => { addTemp(s, 'invention', '⚙️ Invenzione rivoluzionaria', 180, { rm: { knowledge: 1.5 } }); return '⚙️ Una invenzione rivoluzionaria accelera la ricerca!'; } },
  oil_crisis: { era: [6, 6], w: 1, run: s => { addTemp(s, 'oil', '⛽ Crisi energetica', 180, { energy: 0.7 }, true); return '⛽ Crisi energetica globale: produzione di energia ridotta.'; } },
  meltdown: { era: [6, 8], w: s => Math.min(4, s.buildings.nuclear_plant * 0.3), run: s => { s.buildings.nuclear_plant--; s.pollution = Math.min(100, s.pollution + 12); return `☢️ Incidente nucleare! Una centrale è perduta, ${killPop(s, pct(s, 0.04))} vittime, inquinamento alle stelle.`; } },
  flu: { era: [6, 7], w: 1, run: s => `🤧 Influenza pandemica: ${killPop(s, pct(s, s.techs.antibiotics ? 0.02 : 0.08))} morti.` },
  space_win: { era: [6, 7], w: 1, good: 1, run: s => { addTemp(s, 'space', '🚀 Orgoglio spaziale', 180, { stab: 8, rm: { knowledge: 1.2 } }); return '🚀 Una missione spaziale di successo entusiasma la popolazione!'; } },
  cyber: { era: [7, 8], w: 1.5, run: s => { s.res.knowledge *= 1 - 0.1 * sev(s); addTemp(s, 'cyber', '💻 Cyberattacco', 60, { energy: 0.6 }, true); return '💻 Un cyberattacco paralizza le reti: dati e energia perduti.'; } },
  solar_storm: { era: [7, 8], w: 1, run: s => { addTemp(s, 'storm', '🌞 Tempesta solare', 90, { energy: 0.5 }, true); return '🌞 Una tempesta solare manda in tilt le reti elettriche.'; } },

  // --- eventi con scelta
  flood: { era: [2, 4], w: 1.5, title: '🌊 Piena del fiume', text: 'Il fiume sta per esondare sui campi.',
    options: [
      { label: 'Costruisci argini', desc: 'Costa il 30% della pietra', run: s => { s.res.stone *= 0.7; return '🌊 Gli argini reggono.'; } },
      { label: 'Lascia che esondi', desc: 'Perdi alcune fattorie, ma il limo fertilizza i campi', run: s => { const d = destroy(s, ['farm'], 2); addTemp(s, 'silt', '🌱 Limo fertile', 300, { rm: { food: 1.4 } }); return `🌊 L'esondazione distrugge ${d} fattorie ma rende la terra fertile.`; } },
    ] },
  traders: { era: [2, 5], w: 1.5, title: '🐪 Mercanti stranieri', text: 'Una carovana propone uno scambio.',
    options: [
      { label: 'Scambia legno per oro', desc: '-40% legno, +oro', run: (s, r) => { const w = s.res.wood * 0.4; s.res.wood -= w; s.seen.gold = 1; s.res.gold = Math.min(r.caps.gold, s.res.gold + w * 0.5); return '🐪 Scambio concluso.'; } },
      { label: 'Scambia cibo per conoscenza', desc: '-40% cibo, +conoscenza', run: (s, r) => { const f = s.res.food * 0.4; s.res.food -= f; s.res.knowledge += f * 0.5; return '🐪 I mercanti condividono i loro saperi.'; } },
      { label: 'Rifiuta', desc: 'Nessun effetto', run: () => '🐪 La carovana prosegue.' },
    ] },
  migrants: { era: [2, 7], w: 1.5, title: '🧳 Migranti alle porte', text: 'Un gruppo di profughi chiede di entrare nella tua civiltà.',
    options: [
      { label: 'Accoglili', desc: '+10% popolazione, stabilità -6 per 3 minuti', run: s => { const n = Math.ceil(s.pop * 0.1); s.pop += n; addTemp(s, 'mig', '🧳 Tensioni sociali', 180, { stab: -6 }, true); return `🧳 Accolti ${n} migranti.`; } },
      { label: 'Respingili', desc: 'Stabilità +3 per 2 minuti', run: s => { addTemp(s, 'mig2', '🚧 Confini chiusi', 120, { stab: 3 }); return '🧳 I migranti vengono respinti.'; } },
    ] },
  heresy: { era: [3, 4], w: 1.5, title: '📜 Eresia', text: 'Un predicatore mette in dubbio le verità consolidate.',
    options: [
      { label: 'Tollera', desc: 'Conoscenza ×1,3 ma stabilità -8 per 3 minuti', run: s => { addTemp(s, 'her', '📜 Libero pensiero', 180, { rm: { knowledge: 1.3 }, stab: -8 }); return '📜 Le nuove idee si diffondono.'; } },
      { label: 'Perseguita', desc: 'Stabilità +5 ma conoscenza ×0,7 per 3 minuti', run: s => { addTemp(s, 'her', '⛓️ Inquisizione', 180, { rm: { knowledge: 0.7 }, stab: 5 }); return "📜 L'eresia viene soffocata."; } },
    ] },
  crusade: { era: [3, 3], w: 1, title: '⚔️ Appello alla guerra santa', text: 'I regni vicini ti chiedono di unirti a una spedizione lontana.',
    options: [
      { label: 'Partecipa', desc: 'Perdi metà dei soldati, guadagni oro e stabilità', run: (s, r) => { const n = Math.floor(s.jobs.soldier / 2); s.jobs.soldier -= n; killPop(s, n); s.res.gold = Math.min(r.caps.gold, s.res.gold + r.caps.gold * 0.5); addTemp(s, 'cru', '⚔️ Gloria', 240, { stab: 8 }); return `⚔️ ${n} soldati non tornano, ma il bottino è ricco.`; } },
      { label: 'Rifiuta', desc: 'Stabilità -6 per 2 minuti', run: s => { addTemp(s, 'cru', '😠 Disonore', 120, { stab: -6 }, true); return '⚔️ Il popolo mormora di codardia.'; } },
    ] },
  strike: { era: [5, 6], w: s => (s.techs.lab_unions ? 0 : 2), title: '✊ Sciopero generale', text: 'Gli operai incrociano le braccia e chiedono salari migliori.',
    options: [
      { label: 'Concedi aumenti', desc: '-25% oro, stabilità +5', run: s => { s.res.gold *= 0.75; addTemp(s, 'str', '🤝 Accordo sindacale', 240, { stab: 5 }); return '✊ Accordo raggiunto.'; } },
      { label: 'Reprimi', desc: 'Operai ×0,5 per 1 minuto, stabilità -15 per 3 minuti', run: s => { addTemp(s, 'str', '🚔 Repressione', 180, { stab: -15 }, true); addTemp(s, 'str2', '🏭 Fabbriche ferme', 60, { jm: { worker: 0.5 } }, true); return '✊ Lo sciopero viene represso nel sangue.'; } },
    ] },
  fake_news: { era: [7, 8], w: 1.5, title: '📱 Ondata di disinformazione', text: 'Notizie false polarizzano la società.',
    options: [
      { label: 'Censura', desc: 'Stabilità +4, conoscenza ×0,8 per 3 minuti', run: s => { addTemp(s, 'fn', '🔇 Censura', 180, { stab: 4, rm: { knowledge: 0.8 } }); return '📱 Le piattaforme vengono oscurate.'; } },
      { label: 'Libertà di stampa', desc: 'Stabilità -12 per 2 minuti', run: s => { addTemp(s, 'fn', '📱 Polarizzazione', 120, { stab: -12 }, true); return '📱 Il dibattito infuria.'; } },
    ] },
  ai_breakthrough: { era: [7, 8], w: 1.5, title: '🧠 Svolta nelle IA', text: 'Un laboratorio ha creato un modello molto più potente dei precedenti.',
    options: [
      { label: 'Distribuiscilo subito', desc: 'Conoscenza ×2 per 5 minuti, Rischio IA +12', run: s => { addTemp(s, 'aib', '🧠 Super-modello', 300, { rm: { knowledge: 2 } }); s.aiRisk = Math.min(100, s.aiRisk + 12); return '🧠 Il nuovo modello rivoluziona la ricerca.'; } },
      { label: 'Studialo prima', desc: 'Rischio IA -5', run: s => { s.aiRisk = Math.max(0, s.aiRisk - 5); return '🧠 Il modello resta in laboratorio.'; } },
    ] },
  anomaly: { era: [8, 8], w: 1.5, title: '🌀 Anomalia quantistica', text: 'Un esperimento ha aperto una fessura nello spazio-tempo.',
    options: [
      { label: 'Indaga', desc: '70%: +materia esotica · 30%: catastrofe', run: s => { if (Math.random() < 0.7) { s.res.exotic += 40 + s.buildings.quantum_fab * 5; return '🌀 Raccolta materia esotica dalla fessura!'; } return `🌀 La fessura collassa: ${killPop(s, pct(s, 0.1))} vittime.`; } },
      { label: 'Sigilla', desc: 'Nessun rischio', run: () => '🌀 La fessura viene sigillata.' },
    ] },
};

export function choose(s, i, r) {
  const e = EVENTS[s.choice?.id];
  if (!e) return;
  s.choice = null;
  const msg = e.options[i].run(s, r);
  if (msg) log(s, msg, 'warn');
}

function randomEvent(s, r) {
  const pool = Object.entries(EVENTS).map(([id, e]) => [id, e, s.era >= e.era[0] && s.era <= e.era[1] ? (typeof e.w === 'function' ? e.w(s) : e.w) : 0]).filter(x => x[2] > 0);
  let roll = Math.random() * pool.reduce((a, x) => a + x[2], 0);
  const [id, e] = pool.find(x => (roll -= x[2]) <= 0) || pool[0];
  s.stats.events++;
  if (e.options) { s.choice = { id }; return; }
  const msg = e.run(s, r);
  if (msg) log(s, msg, e.good ? 'good' : 'bad');
}

// ---------- crisi a tempo: vanno risolte prima della scadenza
export const CRISES = {
  black_death: { era: 3, time: 360, name: 'La Peste Nera', text: 'Un morbo terribile avanza dalle rotte commerciali. Servono medici e quarantene.',
    cost: s => ({ knowledge: 12000, gold: 1500 }), auto: s => s.techs.hygiene && '🧼 Grazie all\'Igiene la peste viene contenuta.',
    fail: s => { addTemp(s, 'bd', '⚰️ Lutto', 300, { stab: -20 }, true); return `⚰️ La Peste Nera stermina ${killPop(s, pct(s, 0.35))} persone.`; } },
  great_war: { era: 5, time: 420, name: 'La Grande Guerra', text: 'Le potenze mondiali entrano in guerra. Raggiungi 40K di difesa o finanzia lo sforzo bellico.',
    cost: s => ({ metal: 300000, gold: 150000 }), auto: (s, r) => r.def >= 40000 && '🎖️ Il tuo esercito vince la Grande Guerra!',
    fail: s => { lose(s, 0.4); destroy(s, Object.keys(BUILDINGS).filter(id => !BUILDINGS[id].mega), 8); addTemp(s, 'gw', '🪖 Dopoguerra', 300, { stab: -20 }, true); return `🪖 La guerra devasta la nazione: ${killPop(s, pct(s, 0.25))} morti.`; } },
  missile_crisis: { era: 6, time: 600, name: 'Crisi dei missili', text: "Le superpotenze sono sull'orlo della guerra nucleare. Solo una diplomazia costosa può evitarla.",
    cost: s => ({ knowledge: s.techs.diplomacy ? 3e6 : 6e6, gold: s.techs.diplomacy ? 1.5e5 : 3e5 }),
    fail: s => { gameOver(s, 'nuclear'); } },
  pandemic: { era: 7, time: 420, name: 'Pandemia globale', text: 'Un nuovo virus si diffonde in tutto il pianeta. Serve un vaccino.',
    cost: s => ({ knowledge: 4e8, gold: 3e7 }),
    fail: s => { addTemp(s, 'pan', '😷 Lockdown', 300, { rm: { all: 0.6 }, stab: -15 }, true); return `😷 La pandemia uccide ${killPop(s, pct(s, 0.3))} persone.`; } },
  rogue_ai: { era: 7, time: 240, cond: s => s.aiRisk >= 80, repeat: true, name: 'IA fuori controllo', text: 'Un sistema autonomo sta sfuggendo a ogni controllo. Contienilo prima che sia troppo tardi!',
    cost: s => ({ knowledge: s.era >= 8 ? 5e9 : 5e8 }), resolve: s => { s.aiRisk = Math.max(0, s.aiRisk - 50); },
    fail: s => { gameOver(s, 'ai'); } },
  asteroid: { era: 8, time: 1500, delay: 1500, name: 'Asteroide in rotta di collisione', text: 'Un asteroide di 10 km colpirà il pianeta. Ricerca la Difesa planetaria e costruisci lo Scudo planetario!',
    auto: s => s.buildings.planet_shield > 0 && "🛡️ Lo Scudo planetario disintegra l'asteroide!",
    need: 'planet_shield',
    fail: s => { gameOver(s, 'asteroid'); } },
};

export function resolveCrisis(s, id, r) {
  const c = s.crises.find(x => x.id === id), C = CRISES[id];
  if (!c || !C.cost || !canAfford(s, C.cost(s))) return;
  pay(s, C.cost(s));
  endCrisis(s, id, `✅ Crisi superata: ${C.name}.`, r);
}
function endCrisis(s, id, msg, r) {
  s.crises = s.crises.filter(x => x.id !== id);
  CRISES[id].resolve?.(s, r);
  s.stats.crisesWon++;
  log(s, msg, 'good');
}

// ---------- chiamato a ogni tick
export function runEvents(s, dt, r, opts) {
  if (opts.offline) return;
  s.threat = s.era >= 1 && s.t > 240 ? threat(s) : 0;

  // sconfitte
  if (s.pop <= 0) return gameOver(s, 'extinction');
  if (s.stability < 1) {
    if (!s.zeroStabT) log(s, '🔥 La stabilità è a zero: rivolta! Hai 30 secondi per rimediare.', 'bad');
    s.zeroStabT += dt;
    if (s.zeroStabT >= 30) return gameOver(s, 'revolt');
  } else if (s.zeroStabT) { s.zeroStabT = 0; s.stats.revoltSurvived++; }
  if (s.pollution >= 100) return gameOver(s, 'climate');
  if (s.aiRisk >= 100) return gameOver(s, 'ai');
  for (const [lvl, msg] of [[50, '🏭 Inquinamento al 50%: i disastri climatici diventano frequenti.'], [75, "🏭 Inquinamento al 75%! Il collasso climatico è vicino."], [90, '🚨 Inquinamento al 90%! Agisci subito!']]) {
    const f = 'pol' + lvl;
    if (s.pollution >= lvl && !s.crisesDone[f]) { s.crisesDone[f] = 1; log(s, msg, 'bad'); }
    if (s.pollution < lvl - 10) delete s.crisesDone[f];
  }

  // crisi
  for (const c of [...s.crises]) {
    const C = CRISES[c.id], ok = C.auto?.(s, r);
    if (ok) { endCrisis(s, c.id, ok, r); continue; }
    c.left -= dt;
    if (c.left <= 0) {
      s.crises = s.crises.filter(x => x !== c);
      const msg = C.fail(s);
      if (msg) log(s, msg, 'bad');
      if (s.over) return;
    }
  }
  for (const [id, C] of Object.entries(CRISES)) {
    if (s.era < C.era || s.crises.some(c => c.id === id) || (s.crisesDone[id] && !C.repeat)) continue;
    const start = C.cond ? C.cond(s) : s.t - s.eraStart > (C.delay || 300) && Math.random() < dt / 400;
    if (start) {
      s.crisesDone[id] = 1;
      s.crises.push({ id, left: C.time });
      log(s, `🚨 CRISI: ${C.name}! Hai ${Math.round(C.time / 60)} minuti.`, 'bad');
    }
  }

  // eventi casuali
  s.nextEvent -= dt * DIFFICULTY[s.difficulty].events;
  if (s.nextEvent <= 0) {
    s.nextEvent = rnd(60, 130);
    randomEvent(s, r);
  }
}
