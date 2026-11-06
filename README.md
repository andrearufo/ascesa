# Ascesa — dalla pietra alle stelle

Clicker/idle game di civiltà in JavaScript puro (nessuna dipendenza, nessuna build).
Guida una tribù dalla preistoria fino a un futuro iper-tecnologico.

**Gioca:** https://andrearufo.github.io/ascesa/

## Come si gioca

- **Clicca** (o premi `Spazio`) per raccogliere la risorsa selezionata; il click cresce con la tua produzione.
- **Assegna i lavori**: raccoglitori, taglialegna, cavatori, saggi, soldati… e poi contadini, minatori, studiosi, operai, scienziati, tecnici IA, ingegneri quantistici.
- **Costruisci** alloggi, magazzini (le capacità limitano i costi raggiungibili!), centrali, laboratori.
- **Ricerca** oltre 100 tecnologie in 8 ere e compi **8 scelte esclusive** (tribù, governo, economia, questione sociale, energia, ideologia, IA, destino).
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
test/sim.js    controllo dei dati + bot che gioca partite intere per il bilanciamento
```

Bilanciamento: `node test/sim.js 4 normal` fa giocare 4 partite a un bot greedy e stampa
i tempi di arrivo a ogni era e l'esito. Su Normale il bot vince in circa 6–9 ore di gioco.
