// Controlla che ogni testo abbia la traduzione inglese: node test/i18n.js
import fs from 'fs';
globalThis.localStorage = { getItem: k => (k === 'ascesa-lang' ? 'en' : null) };
const { missing } = await import('../js/i18n.js');
await import('../js/events.js'); // carica anche data.js ed engine.js e traduce i dati
const EN = (await import('../js/en.js')).default;
// chiavi statiche: t`...` e t('...') nei sorgenti
for (const f of ['engine', 'events', 'ui', 'data'].map(n => `js/${n}.js`)) {
  const src = fs.readFileSync(f, 'utf8');
  for (let i = 0; (i = src.indexOf('t`', i)) >= 0; i++) {
    if (/[\w$]/.test(src[i - 1])) continue;
    let k = '', n = 0, j = i + 2;
    while (src[j] !== '`') {
      if (src[j] === '$' && src[j + 1] === '{') { // salta l'espressione ${...}, anche annidata
        let d = 1; j += 2;
        while (d) { if (src[j] === '`') { j++; while (src[j] !== '`') j++; } else if (src[j] === '{') d++; else if (src[j] === '}') d--; j++; }
        k += `{${n++}}`;
      } else k += src[j] === '\\' ? src[++j] : src[j], j++;
    }
    if (EN[k] === undefined) missing.add(k);
  }
  for (const m of src.matchAll(/(?<![\w$])t\((['"])((?:\\.|(?!\1).)*)\1\)/g)) {
    const k = m[2].replace(/\\(.)/g, '$1');
    if (EN[k] === undefined) missing.add(k);
  }
}
for (const m of fs.readFileSync('index.html', 'utf8').matchAll(/data-t>(.*?)<\/(button|p|h3)>/g)) if (EN[m[1]] === undefined) missing.add(m[1]);
if (EN['Ascesa — dalla pietra alle stelle'] === undefined) missing.add('Ascesa — dalla pietra alle stelle');
// testi degli effetti temporanei (tradotti alla visualizzazione)
for (const m of fs.readFileSync('js/events.js', 'utf8').matchAll(/addTemp\(s, '[^']*', (['"])((?:\\.|(?!\1).)*)\1/g)) if (EN[m[2]] === undefined) missing.add(m[2]);
// etichette di stabilità e blocchi edificio (tradotte alla visualizzazione)
for (const m of fs.readFileSync('js/engine.js', 'utf8').matchAll(/parts\.push\(\['([^']+)'/g)) if (EN[m[1]] === undefined) missing.add(m[1]);
for (const m of fs.readFileSync('js/ui.js', 'utf8').match(/const L = \{.*/)[0].matchAll(/\w+: \['([^']+)'/g)) if (EN[m[1]] === undefined) missing.add(m[1]);
if (EN['Rischio IA troppo alto'] === undefined) missing.add('Rischio IA troppo alto');
const vals = new Set(Object.values(EN));
for (const k of missing) if (vals.has(k)) missing.delete(k); // già tradotte (es. testi calcolati)
console.log(missing.size ? [...missing].map(k => JSON.stringify(k)).join('\n') + `\n${missing.size} senza traduzione` : 'ok');
process.exit(missing.size ? 1 : 0);
