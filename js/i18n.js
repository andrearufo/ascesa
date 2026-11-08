// Ascesa — lingua. Il testo sorgente è in italiano; EN lo traduce frase per frase.
// t`Ciao ${x}` cerca la chiave "Ciao {0}"; le traduzioni possono riordinare i {n}.
import EN from './en.js';

const ls = (() => { try { return globalThis.localStorage; } catch { return null; } })();
export const LANG_KEY = 'ascesa-lang';
export const lang = ls?.getItem(LANG_KEY) || (globalThis.navigator?.language?.startsWith('it') ? 'it' : 'en');
export const missing = new Set(); // chiavi senza traduzione (debug)

export function t(s, ...v) {
  const k = typeof s === 'string' ? s : s.reduce((a, p, i) => a + '{' + (i - 1) + '}' + p);
  let tr = k;
  if (lang === 'en') { if (EN[k] !== undefined) tr = EN[k]; else missing.add(k); }
  return v.length ? tr.replace(/\{(\d+)\}/g, (_, i) => v[i]) : tr;
}

// traduce sul posto i campi di testo dei dati di gioco
const FIELDS = ['name', 'desc', 'title', 'text', 'label'];
export function localize(o) {
  if (lang === 'it' || !o || typeof o !== 'object') return;
  for (const k in o) {
    if (typeof o[k] === 'string' && FIELDS.includes(k)) o[k] = t(o[k]);
    else if (typeof o[k] === 'object') localize(o[k]);
  }
}
