# Ascesa — dalla pietra alle stelle

Clicker/idle game di civiltà in JavaScript puro (nessuna dipendenza, nessuna build).
Guida una tribù dalla preistoria fino a un futuro iper-tecnologico.

**Gioca:** https://andrearufo.github.io/ascesa/

In italiano e in inglese (*Italian and English*): la lingua segue quella del browser e si cambia con il pulsante 🌐 in alto.

## Come si gioca

- **Clicca** per raccogliere la risorsa selezionata; il click cresce con la tua produzione.
  Da tastiera: `Spazio` per la risorsa selezionata, oppure `C` cibo, `L` legno, `P` pietra, `M` metallo, `O` oro, `K` conoscenza (in inglese `F`, `W`, `S`, `M`, `G`, `K`). Conta una pressione alla volta: tenere premuto non raccoglie nulla.
- **Assegna i lavori**: raccoglitori, taglialegna, cavatori, saggi, soldati… e poi contadini, minatori, studiosi, operai, scienziati, tecnici IA, ingegneri quantistici.
- **Costruisci** alloggi, magazzini (le capacità limitano i costi raggiungibili!), centrali, laboratori.
- **Gestisci i consumi**: alcuni edifici consumano risorse (fucine e centrali a carbone il legno, teatri e centrali petrolifere l'oro, centrali nucleari il metallo, spazioporti pietra e legno…). Se una scorta finisce, quegli edifici rendono solo in proporzione. Il pannello Risorse mostra produzione, consumo e saldo.
- **Ricerca** oltre 100 tecnologie in 8 ere e compi **8 scelte esclusive** (tribù, governo, economia, questione sociale, energia, ideologia, IA, destino).
  Ogni ricerca richiede tempo (da 15 s nella Preistoria a 4 minuti nell'ultima era, il triplo per il passaggio d'era). Puoi metterne in coda altre, anche quelle che dipendono da ricerche ancora in corso: si pagano subito, quando le metti in coda, e se le togli riavrai le risorse.
- **Vinci** completando uno dei tre megaprogetti dell'ultima era: *Sfera di Dyson*, *Arca Stellare* o *Ascensione Digitale*.

## Le ere

Preistoria → Età Antica → Medioevo → Rinascimento → Era Industriale → Era Atomica → Era dell'Informazione → Era Iper-tecnologica

## Cosa può distruggere la civiltà

| Pericolo | Come evitarlo |
|---|---|
| Carestia → estinzione | saldo del cibo positivo |
| Stabilità a 0 per 30 s → rivolta | templi, teatri, parchi, scelte di governo, niente disoccupazione |
| Razzie e invasioni | soldati e fortificazioni (la minaccia cresce con il tempo) |
| Inquinamento al 100% → collasso climatico | parchi, depuratori, cattura del carbonio, energie pulite |
| Rischio IA al 100% → presa di potere | istituti di allineamento, governance prudente |
| Crisi a tempo (Peste Nera, Grande Guerra, Crisi dei missili, Pandemia, IA fuori controllo, Asteroide) | pagarle prima della scadenza; alcune sono letali |

Oltre 30 eventi casuali, alcuni con scelte (migranti, eresie, scioperi, svolte nelle IA, anomalie quantistiche…).

## Progressione a lungo termine

- **Salvataggio automatico** in `localStorage` ogni 15 s, con esportazione/importazione.
- **Progressi offline** fino a 4 ore (senza eventi).
- **Eredità**: a fine partita (vittoria o sconfitta) guadagni punti che danno +3% di produzione per punto nelle partite successive.
- **29 traguardi**, ognuno +2% di produzione.
- **3 difficoltà**: Facile, Normale, Difficile.

## Struttura

```
index.html, style.css
js/data.js     dati: risorse, lavori, edifici, tecnologie, traguardi
js/engine.js   motore (senza DOM): economia, popolazione, stabilità, salvataggio
js/events.js   eventi, razzie, crisi, sconfitte
js/scene.js    scena animata su canvas
js/ui.js       interfaccia
js/i18n.js     lingua: t`testo` traduce dall'italiano con il dizionario di js/en.js
test/i18n.js   controlla che ogni testo abbia la traduzione inglese
test/sim.js    controllo dei dati + bot che gioca partite intere per il bilanciamento
```

Bilanciamento: `node test/sim.js 4 normal` fa giocare 4 partite a un bot greedy e stampa
i tempi di arrivo a ogni era e l'esito. Su Normale il bot vince in circa 6–9 ore di gioco.
