// Ascesa — interfaccia
import { RES, JOBS, BUILDINGS, TECHS, ERAS, GROUPS, DIFFICULTY, ACHIEVEMENTS, VICTORIES } from './data.js';
import * as G from './engine.js';
import { initScene } from './scene.js';
import { EVENTS, CRISES, ENDINGS, choose, resolveCrisis } from './events.js';
import { t, lang, LANG_KEY } from './i18n.js';

const $ = id => document.getElementById(id);
let S = null, L = G.loadLegacy(), tab = 'jobs';

// ---------- formattazione
const U = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
export function fmt(n) {
  if (n === Infinity) return '∞';
  const a = Math.abs(n);
  if (a < 1000) return a < 10 ? (Math.round(n * 10) / 10).toLocaleString(lang) : Math.round(n).toLocaleString(lang);
  const e = Math.min(U.length - 1, Math.floor(Math.log10(a) / 3));
  return (n / 10 ** (3 * e)).toFixed(2).replace('.', lang === 'it' ? ',' : '.') + U[e];
}
const sign = n => (n > 0 ? '+' : '') + fmt(n);
const mul = v => '×' + (Math.round(v * 100) / 100).toLocaleString(lang);
const time = t => `${Math.floor(t / 3600) ? Math.floor(t / 3600) + 'h ' : ''}${String(Math.floor(t / 60) % 60).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const SHIELD = { plague: t('Peste'), epidemic: t('Epidemie'), strike: t('Scioperi'), nuclear: t('Crisi nucleari'), asteroid: t('Asteroidi') };
const CLICK = { food: t('🍖 Caccia'), wood: t('🪵 Taglia legna'), stone: t('🪨 Scava'), metal: t('⚙️ Estrai'), gold: t('💰 Commercia'), knowledge: t('📜 Rifletti') };

function costHTML(c, r) {
  return Object.entries(c).map(([k, v]) =>
    `<span class="${S.res[k] >= v ? '' : v > r.caps[k] ? 'over' : 'no'}" title="${v > r.caps[k] ? t('Supera la capacità massima: costruisci depositi!') : ''}">${RES[k].icon} ${fmt(v)}</span>`).join('');
}
function bFx(b) {
  const p = [];
  if (b.housing) p.push(t`🏠 +${fmt(b.housing)} alloggi`);
  if (b.slots) for (const j in b.slots) p.push(t`${JOBS[j].icon} +${b.slots[j]} posti ${JOBS[j].name}`);
  if (b.prod) for (const k in b.prod) p.push(`${RES[k].icon} +${fmt(b.prod[k])}/s`);
  if (b.use) for (const k in b.use) p.push(`<span class="neg">${RES[k].icon} −${fmt(b.use[k])}/s</span>`);
  if (b.caps) p.push('📦 ' + Object.entries(b.caps).map(([k, v]) => `${RES[k].icon}+${fmt(v)}`).join(' '));
  if (b.energy) p.push(`⚡ ${sign(b.energy)}`);
  if (b.stab) p.push(t`⚖️ ${sign(b.stab)} stabilità`);
  if (b.def) p.push(t`🛡️ +${fmt(b.def)} difesa`);
  if (b.pol) p.push(t`🏭 ${sign(b.pol * 60)}/min inquinamento`);
  if (b.ai) p.push(t`🤖 ${sign(b.ai * 60)}/min rischio IA`);
  return p.join(' · ');
}
function tFx(fx = {}) {
  const p = [];
  for (const j in fx.jm || {}) p.push(`${JOBS[j].icon} ${JOBS[j].name} ${mul(fx.jm[j])}`);
  for (const k in fx.rm || {}) p.push(`${k === 'all' ? t('🌐 Tutta la produzione') : RES[k].icon + ' ' + RES[k].name} ${mul(fx.rm[k])}`);
  const L = { stab: ['⚖️ Stabilità', sign], housing: ['🏠 Alloggi', mul], cap: ['📦 Capacità', mul], def: ['🛡️ Difesa', mul], pol: ['🏭 Inquinamento', mul], ai: ['🤖 Rischio IA', mul], growth: ['👶 Crescita', mul], click: ['👆 Click', mul], clickPct: ['👆 Click', v => t`+${v * 100}% della produzione/s`], loot: ['💰 Bottini', mul], foodCons: ['🍽️ Consumo cibo', mul], energy: ['⚡ Energia', mul] };
  for (const k in L) if (fx[k] !== undefined) p.push(`${t(L[k][0])} ${L[k][1](fx[k])}`);
  if (fx.shield) p.push(t('🛡️ Protegge da: ') + fx.shield.map(x => SHIELD[x]).join(', '));
  return p.join(' · ');
}

// lista con chiavi: ricostruisce solo se cambia la struttura (preserva hover/click)
function list(el, items) {
  const sig = items.map(i => i.k).join('|');
  if (el._sig !== sig) {
    el._sig = sig;
    el.innerHTML = items.map(i => `<div class="${i.cls || ''}" ${i.attr || ''}>${i.html}</div>`).join('');
    [...el.children].forEach((c, n) => { c._h = items[n].html; });
    return;
  }
  [...el.children].forEach((c, n) => {
    const it = items[n];
    if (c._h !== it.html) { c.innerHTML = it.html; c._h = it.html; }
    if (c.className !== (it.cls || '')) c.className = it.cls || '';
  });
}

// ---------- render
function render() {
  if (!S) return;
  const r = G.calc(S);
  document.documentElement.style.setProperty('--accent', ERAS[S.era].sky[0]);
  $('era-name').textContent = ERAS[S.era].name;
  $('year').textContent = `${G.year(S)} · ${DIFFICULTY[S.difficulty].name} · ⏱ ${time(S.t)}`;
  list($('timeline'), ERAS.slice(1).map((e, i) => ({ k: i, cls: i + 1 < S.era ? 'done' : i + 1 === S.era ? 'now' : '', html: '', attr: `title="${e.name}"` })));

  // click
  if (!G.clickTargets(S).includes(S.clickTarget)) S.clickTarget = 'food';
  $('click-label').textContent = CLICK[S.clickTarget];
  $('click-value').textContent = `+${fmt(G.clickValue(S, r))} ${RES[S.clickTarget].name.toLowerCase()}`;
  list($('targets'), G.clickTargets(S).map(k => ({ k, html: `<button data-act="target:${k}" class="${S.clickTarget === k ? 'on' : ''}">${RES[k].icon} ${RES[k].name} <kbd>${RES[k].key}</kbd></button>` })));

  // risorse
  list($('resources'), Object.keys(RES).filter(k => S.seen[k]).map(k => {
    const cap = r.caps[k], pct = cap === Infinity ? 0 : Math.min(100, S.res[k] / cap * 100), n = r.net[k];
    return { k, cls: 'res', html: `<span>${RES[k].icon}</span><span>${RES[k].name}</span><span class="amt">${fmt(S.res[k])}${cap === Infinity ? '' : ' / ' + fmt(cap)}</span>
      <span class="rate">${pct >= 99.9 && n > 0 ? `<span class="wasted" title="${t('Deposito pieno: questa produzione va persa. Sposta i lavoratori o costruisci depositi.')}">${t`pieno · ${sign(n)}/s persi`}</span>`
        : r.short[k] !== undefined ? `<span class="neg" title="${t`Scorta esaurita: chi consuma questa risorsa lavora solo al ${Math.round(r.short[k] * 100)}%.`}">${t`carenza · edifici al ${Math.round(r.short[k] * 100)}%`}</span>`
        : `<span class="${n > 0 ? 'pos' : n < 0 ? 'neg' : ''}">${r.useBy[k] ? '= ' : ''}${sign(n)}/s</span>`}
        ${r.useBy[k] ? `<span title="${[t('▲ produzione · ▼ consumo · = saldo'), ...r.useBy[k].map(([a, v]) => `${a}: −${fmt(v)}/s`)].join('\n')}">▲ ${fmt(r.prod[k])} ▼ ${fmt(r.cons[k])}</span>` : ''}</span>
      ${cap === Infinity ? '' : `<div class="bar"><i class="${pct >= 99.9 ? 'full' : ''}" style="width:${pct}%"></i></div>`}` };
  }));

  // indicatori
  const meters = [];
  const meter = (k, label, val, max, color, extra = '', title = '') => meters.push({ k, cls: 'meter', html: `<div class="top" title="${title}"><span>${label}</span><b>${val}</b></div>${max ? `<div class="track"><i style="width:${Math.min(100, max)}%;background:${color}"></i></div>` : ''}${extra ? `<small>${extra}</small>` : ''}` });
  meter('pop', t('👥 Popolazione'), `${fmt(S.pop)} / ${fmt(r.housing)}`, S.pop / r.housing * 100, 'var(--info)', t`${fmt(r.idle)} inattivi` + (S.pop >= r.housing ? ` · <b class="neg">${t('servono alloggi')}</b>` : ''));
  const st = S.stability, sc = st < 25 ? 'var(--bad)' : st < 50 ? 'var(--warn)' : 'var(--good)';
  meter('stab', t('⚖️ Stabilità'), `${Math.round(st)}% → ${Math.round(r.stabTarget)}%`, st, sc,
    t`produzione ${mul(G.stabMult(S))}` + (S.zeroStabT > 0 ? ` · <b class="neg blink">${t`RIVOLTA ${Math.ceil(30 - S.zeroStabT)}s`}</b>` : ''),
    r.stabParts.map(p => `${t(p[0])}: ${sign(p[1])}`).join('\n'));
  if (G.has(S, 'spears') || r.def > 0) meter('def', t('🛡️ Difesa'), fmt(r.def), 0, '', S.threat ? t`minaccia stimata: ~${fmt(S.threat)}` : '');
  if (r.energyDem || r.energyProd) meter('en', t('⚡ Energia'), `${fmt(r.energyProd)} / ${fmt(r.energyDem)}`, Math.min(100, r.eff * 100), r.eff < 1 ? 'var(--bad)' : 'var(--warn)', r.eff < 1 ? `<b class="neg blink">${t`Blackout: edifici al ${Math.round(r.eff * 100)}%`}</b>` : t('produzione / consumo'));
  if (S.era >= 5 || S.pollution > 0) meter('pol', t('🏭 Inquinamento'), `${S.pollution.toFixed(1)}%`, S.pollution, S.pollution > 75 ? 'var(--bad)' : '#a0826d', t`${sign((r.pol - 0.02) * 60)}/min · al 100% collasso climatico`);
  if (S.era >= 7 || S.aiRisk > 0) meter('ai', t('🤖 Rischio IA'), `${S.aiRisk.toFixed(1)}%`, S.aiRisk, S.aiRisk > 75 ? 'var(--bad)' : '#bb6bd9', t`${sign(r.ai * 60)}/min · al 100% le IA prendono il potere`);
  list($('meters'), meters);

  renderTabs(r);
  renderRight(r);
  checkModals();
}

function renderTabs(r) {
  const R = S.research, nTech = R ? 0 : Object.keys(TECHS).filter(id => G.techAvailable(S, id) && G.canAfford(S, TECHS[id].cost)).length;
  const tabs = [['jobs', t('👥 Lavori')], ['build', t('🏗️ Edifici')], ['tech', t('🔬 Ricerca') + (R ? ` ${Math.floor((1 - R.left / R.total) * 100)}%` : '') + (nTech ? `<span class="badge">${nTech}</span>` : '')], ['stats', t('📊 Cronologia')]];
  list($('tabs'), tabs.map(([k, l]) => ({ k, html: `<button data-act="tab:${k}" class="${tab === k ? 'on' : ''}">${l}</button>` })));
  const P = $('panel');
  if (P._tab !== tab) { P._tab = tab; P.innerHTML = ''; }
  P._i = 0;
  if (tab === 'jobs') renderJobs(P, r);
  if (tab === 'build') renderBuild(P, r);
  if (tab === 'tech') renderTech(P, r);
  if (tab === 'stats') renderStats(P, r);
}

function chart() {
  const h = S.hist, w = 600, ht = 120;
  if (h.length < 2) return `<p class="empty">${t('Il grafico apparirà tra qualche minuto.')}</p>`;
  const T = h.at(-1)[0] || 1, line = (i, c) => {
    const max = Math.log10(Math.max(...h.map(p => p[i])) + 1) || 1;
    return `<polyline fill="none" stroke="${c}" stroke-width="2" points="${h.map(p => `${p[0] / T * w},${ht - Math.log10(p[i] + 1) / max * (ht - 8) - 4}`).join(' ')}"/>`;
  };
  return `<svg viewBox="0 0 ${w} ${ht}" style="width:100%;height:140px;background:var(--panel2);border-radius:8px">${line(1, 'var(--info)')}${line(2, 'var(--accent)')}</svg>
    <small class="d"><span style="color:var(--info)">━ ${t('popolazione')}</span> · <span style="color:var(--accent)">━ ${t('conoscenza/s')}</span> ${t('(scala logaritmica)')}</small>`;
}

function renderStats(P, r) {
  section(P, 'chart', t('📈 Andamento della civiltà'), [{ k: 'c', cls: 'item', html: chart() }], '');
  section(P, 'st', t('📊 Statistiche'), [{ k: 's', cls: 'item', html: statsHTML() }], '');
  section(P, 'leg', t('🏺 Eredità'), [{ k: 'l', cls: 'item', html: `<div class="stats"><span>${t('Punti eredità')}</span><b>${t`${L.points} (+${L.points * 3}% produzione nelle nuove partite)`}</b>
    <span>${t('Partite giocate / vinte')}</span><b>${L.runs} / ${L.wins}</b><span>${t('Era migliore')}</span><b>${L.best ? ERAS[L.best].name : '—'}</b>
    <span>${t('Finali scoperti')}</span><b>${Object.entries(VICTORIES).map(([k, v]) => L.endings[k] ? v.icon + ' ' + v.title : '❔').join(' · ')}</b></div>
    <p class="d">${t("Alla fine di ogni partita (vittoria o sconfitta) guadagni punti eredità in base all'era raggiunta, ai traguardi e alla difficoltà.")}</p>` }], '');
  const n = Object.keys(S.ach).length;
  section(P, 'ach', t`🏅 Traguardi (${n}/${Object.keys(ACHIEVEMENTS).length}) · +${n * 2}% produzione`, Object.entries(ACHIEVEMENTS).map(([k, a]) => ({ k, cls: 'item ' + (S.ach[k] ? 'ok' : 'done'), html: `<div class="t"><span>${S.ach[k] ? '🏅' : '🔒'} ${a.name}</span></div><div class="d">${a.desc}</div>` })));
}

function section(P, key, title, items, gridCls = 'grid') {
  let wrap = P.querySelector(`[data-sec="${key}"]`);
  if (!items.length) { wrap?.remove(); return; }
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.dataset.sec = key;
    wrap.innerHTML = `<div class="section-title"></div><div class="${gridCls}"></div>`;
  }
  if (P.children[P._i] !== wrap) P.insertBefore(wrap, P.children[P._i] || null);
  P._i++;
  wrap.firstChild.innerHTML = title;
  list(wrap.lastChild, items);
}

function renderJobs(P, r) {
  const steps = [1, 10, ...(S.pop >= 1000 ? [100] : []), ...(S.pop >= 10000 ? [1000] : [])]; // passi più grandi con la popolazione
  const items = Object.keys(JOBS).filter(j => G.has(S, JOBS[j].req)).map(j => {
    const J = JOBS[j], cap = G.jobCap(S, j, r), k = (r.m.jm[j] ?? 1) * (J.power ? r.eff : 1) * G.stabMult(S);
    const out = Object.entries(J.out).map(([res, v]) => `${RES[res].icon} ${fmt(v * k * (r.m.rm[res] ?? 1) * (r.m.rm.all ?? 1))}/s`);
    if (J.def) out.push(`🛡️ ${fmt(J.def * (r.m.jm[j] ?? 1) * r.m.def)}`);
    if (J.stab) out.push(`⚖️ +${fmt(J.stab * (r.m.jm[j] ?? 1))}`);
    return { k: j, cls: 'item', html: `<div class="job"><span class="ic">${J.icon}</span>
      <div><b>${J.name}</b> <span class="cnt">${fmt(S.jobs[j])}</span>${cap !== Infinity ? ` <small class="d">${t`/ ${fmt(cap)} posti`}</small>` : ''}<div class="fx">${t`ognuno: ${out.join(' · ')}`}</div></div>
      <div class="ctl"><button data-act="job:${j}:-1e15">0</button>${steps.map(n => `<button data-act="job:${j}:-${n}">-${n < 1000 ? n : n / 1000 + "k"}</button>`).reverse().join('')}${steps.map(n => `<button data-act="job:${j}:${n}">+${n < 1000 ? n : n / 1000 + "k"}</button>`).join('')}<button data-act="job:${j}:1e15">Max</button></div></div>
      <div class="d">${J.desc}</div>` };
  });
  section(P, 'jobs', t`Lavori · ${fmt(r.idle)} persone inattive`, items, 'grid one');
}

function renderBuild(P, r) {
  const mk = id => {
    const b = BUILDINGS[id], c = G.bCost(S, id), lock = G.bLocked(S, id), ok = !lock && G.canAfford(S, c);
    return { k: id, cls: `item buyable ${ok ? 'ok' : ''} ${b.mega ? 'mega' : ''} ${lock === 'completato' ? 'done' : ''}`, attr: `data-act="buy:${id}"`,
      html: `<div class="t"><span>${b.icon} ${b.name}</span><small>${b.max ? `${S.buildings[id]}/${b.max}` : '×' + S.buildings[id]}</small></div>
      ${b.desc ? `<div class="d">${b.desc}</div>` : ''}<div class="fx">${bFx(b)}</div>
      <div class="cost">${lock === 'completato' ? t('✔ Completato') : lock && lock !== 'bloccato' ? `<span class="no">${t(lock)}</span>` : costHTML(c, r)}</div>` };
  };
  const ids = Object.keys(BUILDINGS).filter(id => G.has(S, BUILDINGS[id].req));
  section(P, 'mega', t('🌌 Megaprogetti — completane uno per vincere'), ids.filter(id => BUILDINGS[id].mega).map(mk));
  section(P, 'b', t('Edifici <small class="d">(Shift+click: compra 10)</small>'), ids.filter(id => !BUILDINGS[id].mega).reverse().map(mk));
}

function renderTech(P, r) {
  const avail = Object.keys(TECHS).filter(id => G.techQueueable(S, id));
  const R = S.research, busy = R || S.queue.length;
  const rq = [];
  if (R) rq.push({ k: 'now', cls: 'item research', html: `<div class="t"><span>🔬 ${TECHS[R.id].name}</span><small>${time(Math.ceil(R.left))}</small></div>
    <div class="progress"><i style="width:${(1 - R.left / R.total) * 100}%"></i></div>` });
  S.queue.forEach((id, i) => rq.push({ k: 'q' + id, cls: 'item buyable queued', attr: `data-act="unqueue:${id}" title="${t('Clic per togliere dalla coda')}"`,
    html: `<div class="t"><span>${i + 1}. ${TECHS[id].name}</span><small>⏱ ${time(G.techTime(id))} ✕</small></div>
    <div class="cost">${costHTML(TECHS[id].cost, r)}</div>` }));
  section(P, 'rq', t('In corso e in coda <small class="d">— si paga quando la metti in coda; clic su una voce per toglierla e riavere le risorse</small>'), rq, 'grid one');
  const mk = id => {
    const T = TECHS[id], ok = G.canAfford(S, T.cost);
    return { k: id, cls: `item buyable ${ok ? 'ok' : ''} ${T.advance ? 'advance' : ''}`, attr: `data-act="tech:${id}" title="${busy ? t('Metti in coda') : t('Avvia la ricerca')}"`,
      html: `<div class="t"><span>${T.advance ? '🌅 ' : ''}${T.name}</span><small>⏱ ${time(G.techTime(id))} · ${ERAS[T.era].name}</small></div><div class="d">${T.desc}</div>
      ${T.fx && Object.keys(T.fx).length ? `<div class="fx">${tFx(T.fx)}</div>` : ''}<div class="cost">${costHTML(T.cost, r)}</div>` };
  };
  const groups = [...new Set(avail.map(id => TECHS[id].group).filter(Boolean))];
  section(P, 'adv', t('Prossima era'), avail.filter(id => TECHS[id].advance).map(mk));
  for (const g of Object.keys(GROUPS)) section(P, 'g-' + g, t`⚖️ Scelta: ${GROUPS[g]} <small class="d">— puoi sceglierne solo una, le altre verranno escluse per sempre</small>`, groups.includes(g) ? avail.filter(id => TECHS[id].group === g).map(mk) : []);
  section(P, 'avail', t('Tecnologie disponibili'), avail.filter(id => !TECHS[id].group && !TECHS[id].advance).map(mk));
  const plan = [R?.id, ...S.queue];
  const next = Object.keys(TECHS).filter(id => !S.techs[id] && !plan.includes(id) && TECHS[id].era === S.era && !avail.includes(id) && !(TECHS[id].group && G.groupTaken(S, TECHS[id].group)));
  section(P, 'locked', t('Ancora da sbloccare in questa era'), next.map(id => ({ k: id, cls: 'item done', html: `<div class="t"><span>🔒 ${TECHS[id].name}</span></div><div class="d">${t('Richiede:')} ${(TECHS[id].req || []).map(q => q.startsWith('group:') ? GROUPS[q.slice(6)] : TECHS[q].name).join(', ')}</div>` })));
  const done = Object.keys(S.techs);
  section(P, 'done', t`Scoperte (${done.length}/${Object.keys(TECHS).length})`, done.length ? [{ k: done.length, cls: 'd', html: done.map(id => TECHS[id].name).join(' · ') }] : [], '');
}

function renderRight(r) {
  list($('crises'), S.crises.map(c => {
    const C = CRISES[c.id], cost = C.cost?.(S);
    return { k: c.id, cls: 'crisis', html: `<b>🚨 ${C.name}</b><span class="d">${C.text}</span><span class="timer ${c.left < 60 ? 'blink' : ''}">${time(Math.max(0, c.left))}</span>
      ${cost ? `<div class="cost">${costHTML(cost, r)}</div><button data-act="crisis:${c.id}" ${G.canAfford(S, cost) ? '' : 'disabled'}>${t('Affronta la crisi')}</button>` : ''}
      ${C.need ? `<span class="d">${t('Serve:')} ${BUILDINGS[C.need].icon} ${BUILDINGS[C.need].name} ${G.has(S, BUILDINGS[C.need].req) ? '' : t`(ricerca prima ${TECHS[BUILDINGS[C.need].req].name})`}</span><div class="cost">${costHTML(G.bCost(S, C.need), r)}</div>` : ''}` };
  }));
  list($('effects'), S.temp.length ? S.temp.map(e => ({ k: e.id + e.until, cls: 'e ' + (e.bad ? 'bad' : 'good'), html: `<span>${t(e.name)}</span><span>${Math.ceil(e.until - S.t)}s</span>` }))
    : [{ k: 'none', cls: 'empty', html: t('Nessun effetto temporaneo.') }]);
  list($('log'), S.log.slice(0, 80).map((l, i) => ({ k: S.log.length - i, cls: l.type, html: `<time>${time(l.t)}</time>${l.msg}` })));
}

// ---------- modali
function modal(html, k = '') { $('modal-box').innerHTML = html; $('modal').hidden = false; $('modal').dataset.k = k; }
function closeModal() { $('modal').hidden = true; $('modal').dataset.k = ''; }

function statsHTML() {
  const st = S.stats;
  const row = (l, v) => `<span>${t(l)}</span><b>${v}</b>`;
  return `<div class="stats">${row('Era raggiunta', ERAS[S.era].name)}${row('Tempo di gioco', time(S.t))}${row('Popolazione massima', fmt(st.maxPop))}
    ${row('Tecnologie scoperte', Object.keys(S.techs).length)}${row('Razzie respinte / subite', `${st.raidsWon} / ${st.raidsLost}`)}${row('Eventi vissuti', st.events)}
    ${row('Morti totali', fmt(st.died))}${row('Click', fmt(st.clicks))}</div>`;
}
function endModal(e, won) {
  const pts = G.endRun(S, L);
  G.saveLegacy(L); G.save(S);
  modal(`<h2>${e.icon} ${e.title}</h2><p>${e.text}</p>${won ? `<p><b>${t`🏆 Hai vinto in ${time(S.t)}!`}</b></p>` : ''}${statsHTML()}
    <p>${t`🏺 Guadagni <b>${pts}</b> punti eredità (totale ${L.points}): la prossima civiltà partirà con <b>+${L.points * 3}%</b> di produzione.`}</p>
    <div class="actions"><button data-act="newgame">${t('Nuova partita')}</button></div>`, 'over');
}

function checkModals() {
  if (!$('modal').hidden) return;
  if (S.over) return endModal(ENDINGS[S.over.id], false);
  if (S.won) return endModal(VICTORIES[S.won.id], true);
  if (S.choice) {
    const e = EVENTS[S.choice.id];
    modal(`<h2>${e.title}</h2><p>${e.text}</p><p class="d">${t('Il tempo è fermo finché non decidi.')}</p><div class="actions">${e.options.map((o, i) => `<button data-act="choose:${i}">${o.label}<small>${o.desc}</small></button>`).join('')}</div>`);
    return;
  }
  if (S.eraUp) {
    const e = S.eraUp; S.eraUp = null;
    modal(`<h2>🌅 ${ERAS[e].name}</h2><p>${TECHS['era' + e]?.desc || ''}</p><p>${t('Nuove tecnologie, edifici e pericoli ti attendono. Controlla la scheda Ricerca.')}</p><div class="actions"><button data-act="close">${t('Avanti')}</button></div>`);
  }
}

function newGameModal() {
  modal(`<h2>Ascesa</h2>
    <p>${t('Guida una piccola tribù dalla <b>preistoria</b> fino a un futuro <b>iper-tecnologico</b>. Raccogli risorse, assegna i lavori, costruisci, ricerca e compi scelte che cambieranno il destino della tua civiltà.')}</p>
    <p>${t('Carestie, razzie, epidemie, rivolte, inquinamento, guerre nucleari e intelligenze artificiali ribelli possono distruggere tutto. Completa uno dei <b>megaprogetti</b> finali per vincere.')}</p>
    ${L.points ? `<p>${t`🏺 Eredità delle civiltà passate: <b>${L.points}</b> punti → <b>+${L.points * 3}%</b> a tutta la produzione.`}</p>` : ''}
    <h3>${t('Scegli la difficoltà')}</h3>
    <div class="actions">${Object.entries(DIFFICULTY).map(([k, d]) => `<button data-act="start:${k}">${d.name}<small>${t`produzione ${mul(d.prod)} · eventi ${mul(d.events)} · gravità ${mul(d.severity)}`}</small></button>`).join('')}</div>
    ${S && !S.over && !S.won ? `<div class="actions"><button data-act="close">${t('Annulla')}</button></div>` : ''}`, 'new');
}

// ---------- azioni
function act(a, ev) {
  const [k, x, y] = a.split(':');
  if (k === 'click') {
    const v = G.click(S);
    const f = document.createElement('div');
    f.className = 'float';
    f.textContent = `+${fmt(v)} ${RES[S.clickTarget].icon}`;
    const b = $('clicker').getBoundingClientRect();
    f.style.left = (ev?.clientX || b.left + b.width / 2) - 20 + Math.random() * 40 + 'px';
    f.style.top = (ev?.clientY || b.top + b.height / 2) - 20 + 'px';
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1000);
  }
  if (k === 'target') S.clickTarget = x;
  if (k === 'tab') tab = x;
  if (k === 'job') G.assign(S, x, +y);
  if (k === 'buy') G.buy(S, x, ev?.shiftKey ? 10 : 1);
  if (k === 'tech') G.research(S, x);
  if (k === 'unqueue') G.unqueue(S, x);
  if (k === 'close') closeModal();
  if (k === 'choose') { choose(S, +x, G.calc(S)); closeModal(); }
  if (k === 'crisis') resolveCrisis(S, x, G.calc(S));
  if (k === 'save') { G.save(S); G.log(S, t('💾 Partita salvata.')); }
  if (k === 'lang') { G.save(S); localStorage.setItem(LANG_KEY, x); location.reload(); }
  if (k === 'newgame') newGameModal();
  if (k === 'start') { S = G.newState(x, L.points); G.log(S, t('🔥 Una piccola tribù si raduna attorno al fuoco. Assegna i lavori e sopravvivi!'), 'era'); G.save(S); closeModal(); }
  if (k === 'export') modal(`<h2>${t('Esporta')}</h2><p>${t('Copia questo codice per salvare la partita altrove.')}</p><textarea readonly>${btoa(unescape(encodeURIComponent(JSON.stringify(S))))}</textarea><div class="actions"><button data-act="close">${t('Chiudi')}</button></div>`);
  if (k === 'import') modal(`<h2>${t('Importa')}</h2><p>${t('Incolla un codice esportato. La partita attuale verrà sostituita.')}</p><textarea id="imp"></textarea><div class="actions"><button data-act="doimport">${t('Importa')}</button><button data-act="close">${t('Annulla')}</button></div>`);
  if (k === 'doimport') {
    try {
      localStorage.setItem(G.SAVE_KEY, decodeURIComponent(escape(atob($('imp').value.trim()))));
      S = G.load(); closeModal();
    } catch { alert(t('Codice non valido')); }
  }
  render();
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && !el.disabled) act(el.dataset.act, e);
});
// Spazio = risorsa selezionata, lettera = quella risorsa. Un click per pressione: tenere premuto non conta.
document.addEventListener('keydown', e => {
  if (!S || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA/.test(e.target.tagName) || !$('modal').hidden) return;
  const t = e.code === 'Space' ? S.clickTarget : G.clickTargets(S).find(k => 'Key' + RES[k].key === e.code);
  if (!t) return;
  e.preventDefault();
  if (e.repeat) return;
  S.clickTarget = t; $('clicker').classList.add('pressed'); act('click');
});
document.addEventListener('keyup', () => $('clicker').classList.remove('pressed'));

// ---------- ciclo principale
document.documentElement.lang = lang;
document.title = t(document.title);
for (const el of document.querySelectorAll('[data-t]')) el.innerHTML = t(el.innerHTML.trim());
$('lang').textContent = lang === 'it' ? '🌐 English' : '🌐 Italiano';
$('lang').dataset.act = 'lang:' + (lang === 'it' ? 'en' : 'it');
S = G.load();
if (!S) newGameModal();
else {
  const off = G.offline(S);
  if (off) modal(`<h2>${t('🌙 Bentornato')}</h2><p>${t`Sei stato via ${time(off.sec)}. Nel frattempo la tua civiltà ha prodotto:`}</p>
    <div class="stats">${Object.entries(off.gain).filter(([, v]) => Math.abs(v) >= 1).map(([k, v]) => `<span>${RES[k].icon} ${RES[k].name}</span><b>${sign(v)}</b>`).join('')}<span>${t('👥 Popolazione')}</span><b>${sign(off.pop)}</b></div>
    <p class="d">${t("Durante l'assenza non avvengono eventi e il tempo delle crisi è sospeso (massimo 4 ore).")}</p><div class="actions"><button data-act="close">${t('Continua')}</button></div>`);
}
initScene($('scene'), () => S);
globalThis.ascesa = { get state() { return S; } }; // accesso da console per debug
let last = performance.now();
setInterval(() => {
  const now = performance.now();
  let dt = Math.min(60, (now - last) / 1000);
  last = now;
  if (S) while (dt > 0) { G.tick(S, Math.min(dt, 1)); dt -= 1; }
  render();
}, 200);
setInterval(() => S && G.save(S), 15000);
addEventListener('beforeunload', () => S && G.save(S));
