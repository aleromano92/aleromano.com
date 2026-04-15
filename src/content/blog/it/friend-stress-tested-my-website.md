---
title: "Il Mio Amico Ha Fatto uno Stress Test del Mio Sito Senza Dirmelo"
description: "La storia di come un collega mi ha insegnato l'importanza del load testing, e come puoi farlo anche tu in pochi minuti con Node.js."
pubDate: 2026-04-14
author: "Alessandro Romano"
tags: ["aleromano.com", "Best Practices", "DevOps", "Node.js", "Observability", "VPS"]
language: "it"
image:
  url: ../../../assets/blog/friend-stress-tested-my-website/featured.png
  alt: "Output del terminale con un load test in esecuzione su aleromano.com"
---

Stavo facendo il solito controllo della mia dashboard di Analytics quando ho notato qualcosa di strano.

La pagina più visitata della settimana era `/anatoli-was-here<3`, con **11.604 visualizzazioni** e un singolo visitatore unico. Un post che non avevo mai scritto. Un percorso che non esisteva nemmeno sul mio sito. E a quanto pare, ognuna di quelle 11.604 richieste proveniva dalla stessa fonte: `https://aleromano.com/posts/built-in-browser-ai`.

Ho fissato lo schermo per una buona trentina di secondi prima che il cervello collegasse i puntini.

![Dashboard di analytics con 11.604 visualizzazioni su /anatoli-was-here<3](../../../assets/blog/friend-stress-tested-my-website/analytics-screenshot.png)

Poi ho mandato un messaggio a [Anatoli Nicolae](https://anatolinicolae.com/). Uno di quei colleghi per cui vai in ufficio solo per incontrarlo, il tipo di persona che rende un martedì qualunque degno del pendolarismo. Brillante, divertente, curiosissimo, e a quanto pare capace di lanciare load test con `k6` contro il mio sito a pieno regime senza dirmi niente.

Mi ha confermato che non stava cercando di farmi un DDoS, stava solo sperimentando con `k6`. Mi ha poi mandato il suo script con l'aura di chi ti ha appena fatto un enorme favore. Il che, onestamente, è vero.

## Cosa Ha Fatto

Anatoli ha eseguito un load test con `k6`, salendo da 20 a 100 utenti virtuali nell'arco di circa tre minuti e mezzo, colpendo il mio endpoint di raccolta analytics con un percorso personalizzato. Il marker `/anatoli-was-here<3` era il suo modo di firmare il lavoro. Il sistema di analytics è qualcosa che ho costruito io stesso; se sei curioso di sapere come funziona, l'ho spiegato in dettaglio in [queste slides del mio talk "DIY in the AI era"](/posts/about-this-site/present#/25).

Il risultato? Duplice, in realtà. La buona notizia: il sito ha retto. Il VPS non si è saturato, i tempi di risposta sono rimasti entro limiti accettabili. Ma non l'avevo mai *verificato* davvero. Avevo messo online il sito, ottimizzato un po', aggiunto l'observability, e poi avevo semplicemente dato per scontato che avrebbe retto sotto pressione. Lo stress test non annunciato di Anatoli è stata la prima prova concreta che ce la faceva.

La cattiva notizia: l'endpoint di analytics accettava qualsiasi dato Anatoli volesse inviargli, senza fare domande. Qualsiasi percorso, qualsiasi payload. Ed è così che `/anatoli-was-here<3` è diventata la mia pagina più visitata della settimana. 

## Perché il Load Testing Conta Anche per un Sito Personale

È facile pensare che il load testing sia roba da aziende con milioni di utenti e team SRE dedicati. Ma anche per un sito personale su un VPS, ha senso per alcune ragioni concrete:

- **Non conosci i tuoi limiti finché non li raggiungi.** Un sito che sembra veloce con 1 utente potrebbe arrancare con 50 connessioni simultanee. Senza test, questa scoperta avviene in produzione, nel momento peggiore possibile.
- **Le risorse del VPS sono fisse.** A differenza dell'auto-scaling cloud, una singola macchina Hetzner ha un tetto. Se scrivi un post che finisce su Hacker News, vuoi sapere in anticipo se il server sopravviverà al picco di traffico.
- **Le regressioni arrivano in silenzio.** Una query al database che hai aggiunto, una chiamata a un servizio esterno che hai introdotto: ognuna di queste può degradare silenziosamente le prestazioni. I load test regolari le intercettano prima degli utenti.
- **Ti dà fiducia.** C'è qualcosa di genuinamente rassicurante nel sapere che il tuo sito ha retto a 100 connessioni simultanee e ne è uscito indenne.

## I Tipi di Test che Dovresti Conoscere

Prima di scegliere uno strumento e lanciarlo, vale la pena capire *cosa* vuoi effettivamente misurare.

**Smoke test**: il controllo minimo indispensabile. Una manciata di utenti virtuali per un breve burst, giusto per confermare che niente sia palesemente rotto. Eseguilo dopo ogni deploy.

**Load test**: una simulazione prolungata di traffico realistico. Definisci un numero target di utenti concorrenti e lo mantieni abbastanza a lungo da rivelare memory leak, esaurimento del connection pool o degrado dei tempi di risposta sotto pressione costante.

**Stress test**: spingi oltre il tuo tetto previsto per trovare il punto di rottura. L'obiettivo non è passare il test; è scoprire *dove* fallisci e *con quanta grazia*.

**Soak test** (detto anche endurance test): mantieni un carico moderato per molto tempo (ore, a volte giorni). È quello che intercetta i memory leak lenti e il connection drift che appaiono solo col tempo.

Per un sito personale, smoke e load test sono i due essenziali. Lo stress test è utile se stai per fare qualcosa che potrebbe generare un picco di traffico: un lancio di prodotto, un talk a una conferenza, essere postato su un aggregatore popolare.

## Come Configurarlo con `autocannon`

[autocannon](https://github.com/mcollina/autocannon) è uno strumento di benchmarking HTTP per Node.js creato da [Matteo Collina](https://github.com/mcollina), uno dei contributori più prolifici dell'ecosistema Node.js. È veloce, scriptabile e si installa come un normale pacchetto npm, il che significa niente binari separati da gestire.

```bash
npm install --save-dev autocannon
```

Il test più semplice possibile da riga di comando:

```bash
npx autocannon -c 50 -d 30 https://tuosito.com
```

`-c 50` significa 50 connessioni concorrenti. `-d 30` significa esegui per 30 secondi. È già più utile di niente.

Ma la vera potenza arriva dall'API JavaScript, che ti permette di scriptare gli stage, ruotare tra più endpoint e costruire un report riassuntivo:

```js
import autocannon from 'autocannon';
import { promisify } from 'util';

const run = promisify(autocannon);

async function runStage({ connections, duration, label }) {
  const result = await run({
    url: 'https://tuosito.com',
    connections,
    duration,
    requests: [
      { method: 'GET', path: '/' },
      { method: 'GET', path: '/about' },
      { method: 'GET', path: '/blog' },
    ],
    title: label,
  });

  autocannon.printResult(result);
  return result;
}

// Scala come un vero picco di traffico
await runStage({ connections: 20,  duration: 30, label: 'Ramp-up' });
await runStage({ connections: 50,  duration: 60, label: 'Sustained' });
await runStage({ connections: 100, duration: 30, label: 'Peak' });
await runStage({ connections: 20,  duration: 30, label: 'Cool-down' });
```

Ho aggiunto tre comandi al mio `package.json`:

```json
"load:smoke":  "node scripts/load-test.mjs smoke",
"load:test":   "node scripts/load-test.mjs load",
"load:stress": "node scripts/load-test.mjs stress",
```

![Output del terminale di npm run load:stress con tutti e cinque gli stage completati, req/s e latenza p97.5](../../../assets/blog/friend-stress-tested-my-website/stress-test-results.png)

Ogni modalità esegue un set diverso di stage. `smoke` dura quindici secondi con cinque connessioni, giusto abbastanza per confermare che il sito sia vivo. `load` replica più o meno quello che ha fatto Anatoli. `stress` va oltre, spingendo fino a 300 connessioni concorrenti per trovare il punto in cui le cose iniziano a degradare.

## Una Cosa a Cui Fare Attenzione

Se stai testando un endpoint POST che ha effetti collaterali come l'invio di email, scritture nel database o addebiti su carta di credito, assicurati che il payload del test sia progettato per fallire la validazione rapidamente. Per il mio endpoint `/api/contact`, passo un campo `reason` deliberatamente non valido in modo che il server restituisca un rapido `400` senza mai toccare il mail transport.

## Leggere i Risultati

`autocannon` stampa una tabella dopo ogni stage. Ecco come appare per un smoke run su questo stesso sito:

![Output di autocannon con le tabelle di latenza e throughput per uno smoke test su aleromano.com](../../../assets/blog/friend-stress-tested-my-website/autocannon-output.png)

I numeri su cui concentrarsi:

- **Req/s** (richieste al secondo): il throughput. Più alto è meglio.
- **Latency p95 / p97.5 / p99**: latenze percentili. Prendi tutte le tue richieste, ordinale dalla più veloce alla più lenta, poi leggi il valore in quella posizione. p95 = il tempo di risposta alla posizione 950 su 1000. p99 = posizione 990. La media nasconde gli outlier lenti; i percentili li espongono. Si chiama *tail latency* — la coda lunga e sottile della distribuzione, dove una piccola percentuale di utenti aspetta molto più a lungo di tutti gli altri.

  ![Istogramma di 1000 richieste colorate per banda percentile: blu per la massa sotto p95, arancione p95-p97.5, rosso-arancio p97.5-p99, rosso sopra p99](../../../assets/blog/friend-stress-tested-my-website/tail-latency.png)

  Un p99 sopra i 1000ms significa che 1 visitatore su 100 ha aspettato più di un secondo. Su un sito personale tranquillo può essere accettabile; durante un picco di traffico si amplifica velocemente.
- **Errors / Timeouts**: qualsiasi valore diverso da zero merita attenzione immediata. Significa che il server sta scartando o rifiutando connessioni.

Dal lato VPS, tieni d'occhio `htop` o `docker stats` durante il test. Stai cercando CPU al 100% che ci rimane (un collo di bottiglia), memoria che cresce senza rilasciarsi (un leak) e conteggio connessioni che si avvicina ai limiti configurati.

![Dashboard Grafana con la CPU che sale a ~40% e la memoria stabile durante lo stress test](../../../assets/blog/friend-stress-tested-my-website/cpu-ram.png)

Il trend della CPU racconta la storia chiaramente: baseline piatta, una salita visibile man mano che il carico aumenta, poi il recupero una volta terminato il test. La memoria è rimasta stabile per tutto il tempo. Nessun leak. Se quella linea della CPU avesse toccato il 100% e ci fosse rimasta, quello sarebbe stato il segnale per indagare.

## Cosa Mi Ha Lasciato Tutto Questo

Anatoli non ha solo fatto un load test. Ha dimostrato qualcosa che sapevo già intellettualmente ma che non avevo mai fatto concretamente: non puoi fidarti della resilienza del tuo sito senza prove. Le assunzioni non sono SLA.

L'automazione è semplice. Gli strumenti sono ottimi. Non c'è nessuna buona ragione per aspettare che un amico ti sorprenda con 11.604 richieste prima di iniziare a prestare attenzione a come si comporta il tuo sito sotto pressione.

Esegui lo smoke test dopo ogni deploy. Esegui il load test prima di qualsiasi cosa ti aspetti che generi traffico. E se la tua analytics dovesse mai mostrare un percorso chiamato `/your-friend-was-here`, consideralo un regalo.

> *Grazie, [Anatoli](https://anatolinicolae.com/). Non mi devi niente e mi hai dato un post. A presto in ufficio.*
