---
title: "Rendere il Mio Codice Pronto per gli Agenti AI"
description: "Tempo fa ho reso il mio sito leggibile dagli agenti AI. Questo è il rovescio della medaglia: i gate deterministici che permettono a un agente AI di modificare il mio codice senza farmi perdere il sonno — CI, coverage, mutation testing, fitness function architetturali, performance budget e property-based testing. Ognuno ha trovato un bug reale."
pubDate: 2026-06-24
author: "Alessandro Romano"
tags: ["AI", "Testing", "Best Practices", "aleromano.com", "DevOps"]
language: "it"
---

Tempo fa ho scritto su come [rendere il mio sito pronto per gli agenti](/it/posts/agent-ready) — come far sì che gli agenti AI che *leggono* il web capiscano i miei contenuti: endpoint markdown, `llms.txt`, dati strutturati.

Questo post è il rovescio della medaglia. Non agenti che leggono il mio sito, ma agenti che lo **scrivono**. Ho iniziato a lasciare che Claude Code apportasse modifiche reali a questo codice, e la domanda che continuava a tormentarmi era semplice:

> Cosa impedisce a un collaboratore instancabile, veloce e dall'aria convincente, con zero responsabilità, di rompere silenziosamente le cose?

La risposta si è rivelata la stessa cosa che fa funzionare il [trunk-based development](https://trunkbaseddevelopment.com/) per gli umani: un'impalcatura di **gate deterministici**. Questa è la storia della costruzione di quell'impalcatura — e dei bug molto reali che ha scovato lungo il percorso.

## L'Incidente da Cui È Partito Tutto 🧨

È iniziato con il compito più noioso immaginabile: una PR di Dependabot che aggiornava `nodemailer` dalla versione 8 alla 9. Ho chiesto all'agente di fare il checkout, eseguire i test e verificare che il form di contatto inviasse ancora le email.

Lo ha fatto. Ma mentre ci frugava ha notato due cose.

Primo, un test stava **fallendo** — un'assertion sul TTL della cache che si aspettava un'ora mentre il codice diceva dieci minuti. Qualcuno (io) aveva cambiato il sorgente mesi prima senza mai aggiornare il test.

Secondo, e molto peggio: **quel test fallito non aveva mai fatto fallire la CI.** La mia pipeline si limitava a costruire un'immagine Docker e a fare il deploy. Non c'era alcuno step `npm test` da nessuna parte, e nessun trigger su `pull_request`. I test esistevano. Semplicemente non venivano mai eseguiti. Un'assertion rotta era rimasta verde-per-assenza per chissà quanto tempo.

È il momento in cui mi è caduto l'occhio. Avevo dei test, ma non avevo dei **gate**. E se non potevo fidarmi della mia stessa rete di sicurezza, di certo non potevo consegnare le chiavi a un agente autonomo.

Così mi sono imbarcato in un piccolo viaggio. Ecco la scala che ho salito.

## Gradino 0: Far Sì che i Test Vengano Davvero Eseguiti ✅

Le fondamenta poco affascinanti. Ho aggiunto un job `checks` al workflow che esegue il type checker e l'intera suite di test a ogni push **e a ogni pull request**, e ho reso build-and-deploy dipendente da esso.

Col senno di poi è banalmente ovvio, ed è esattamente questo il punto: la falla più pericolosa è quella che dai per scontata sia coperta. Una suite di test che non gira sulle PR è teatro. Ora un test rosso blocca il merge. Pavimento posato.

## Gradino 1: Coverage — Necessaria, Non Sufficiente 📏

Poi ho aggiunto un gate sulla coverage, impostato come **cricchetto** (ratchet): la soglia sta un paio di punti sotto il valore attuale, così qualsiasi modifica che *abbassa* la coverage fa fallire la build, e man mano che la coverage sale alzo il pavimento.

Ma ecco la cosa che a nessuno piace ammettere sulla coverage: **misura l'esecuzione, non la verifica.** Una riga può essere coperta al 100% e verificata allo 0%, se il test la esegue ma non fa alcuna assertion sul risultato. La coverage ti dice che il codice è stato *eseguito*. Non può dirti che il test stesse *guardando*.

La mia assertion obsoleta sul TTL lo dimostra. La riga era coperta. Il test girava. Era comunque sbagliato. La coverage è necessaria — non puoi verificare codice che non esegui mai — ma trattarla come obiettivo di qualità è il modo in cui ottieni la [legge di Goodhart](https://en.wikipedia.org/wiki/Goodhart%27s_law) e una codebase piena di test senza assertion che esistono solo per far salire un numero.

Quindi la coverage è il pavimento del pavimento. Mi serviva qualcosa che misurasse se i miei test hanno i **denti**.

## Gradino 2: Mutation Testing — Testare i Test 🧬

Questo è il gradino che manda in crisi il modello mentale delle persone, quindi seguimi.

Il [mutation testing](https://stryker-mutator.io/) attacca i tuoi **test** invece del tuo codice. Introduce piccoli difetti nel sorgente — trasforma un `>` in `>=`, un `if (x)` in `if (true)`, cancella una riga — e riesegue la tua suite contro ogni versione mutata (un *mutante*).

- Se un test **fallisce** sul mutante, il mutante è "ucciso" — i tuoi test avrebbero preso quel bug. Bene.
- Se ogni test **passa** comunque, il mutante è **sopravvissuto** — hai del codice la cui rottura nessun test noterebbe. Una falla, quantificata.

L'idea viene da un paper del 1978 di DeMillo, Lipton e Sayward, e risponde esattamente alla domanda a cui la coverage non può rispondere: *"se questo codice fosse sbagliato, qualcosa diventerebbe rosso?"*

Ho puntato [Stryker](https://stryker-mutator.io/) sulla mia cartella `utils`. Il dato in evidenza:

> Un file aveva il **75% di line coverage ma un mutation score del 46%.** Più della metà della sua logica poteva essere rotta silenziosamente senza che un solo test si lamentasse.

Ha persino individuato il tipo di bug che si nasconde dietro la coverage verde. Il mio test "gestisce gli errori dell'API con grazia" mutava `if (staleCached)` in `if (true)` ed è **sopravvissuto** — perché il test non verificava mai davvero che io *non* servissi dati stantii (stale) quando non ce ne sono. Ho rafforzato una sola assertion e ho ucciso il mutante **senza aggiungere una sola riga coperta.** Ecco l'intera lezione in un solo diff: la robustezza non è la coverage.

## Gradino 3: Fitness Function Architetturali — Regole che un Agente Non Può Infrangere 🏛️

Fin qui stavo testando il *comportamento*. Ma gran parte di ciò che mantiene sana una codebase è la **struttura**: il driver del database resta dietro il suo modulo, i componenti non importano le pagine, le route italiane riutilizzano gli shell condivisi. Quella conoscenza viveva nel mio `CLAUDE.md` come prosa — esattamente il tipo di regola tribale che un documento registra e che la realtà viola lentamente.

Prendendo in prestito da [*Building Evolutionary Architecture*](https://www.thoughtworks.com/en-us/insights/books/building-evolutionary-architectures), ho trasformato quelle regole in **fitness function**: semplici test che scansionano la codebase e fanno fallire la build in caso di violazione. Alcune:

- I componenti non devono importare da `pages/`.
- `better-sqlite3` può essere importato solo dentro `utils/database/`.
- Ogni pagina italiana deve delegare a uno shell `Base*`.
- Il middleware deve proteggere `/admin`.

La morale per lo sviluppo agentico: **un agente non può violare una regola imposta meccanicamente.** Una linea guida in un documento è un suggerimento che potrebbe ignorare. Una fitness function è una recinzione che non può attraversare. Non ho nemmeno cancellato la prosa — l'ho *retrocessa*: il documento ora spiega il *perché* (guida per chi scrive il codice), e il test possiede il *cosa* (il verdetto). Documenta l'intento; imponi la regola.

## Gradino 4: Performance Budget — Una Fitness Function per la Velocità ⚡

Stessa forma, obiettivo diverso. Il senso di avere questo sito in Astro è che spedisce quasi zero JavaScript. Niente impediva a un agente (o a me) di importare qualche libreria pesante in un componente e disfare silenziosamente tutto ciò.

Così ho aggiunto un [budget sulla dimensione del bundle](https://github.com/aleromano92/aleromano.com): uno script che gira dopo la build e fallisce se il JavaScript lato client cresce oltre il suo limite. La parte delicata era che il mio bundle di gran lunga più grande è il runtime delle presentazioni reveal.js (~1,1 MB), che viene caricato solo sulle route `/present`. Un budget ingenuo sul "JS totale" misurerebbe semplicemente reveal.js e lascerebbe allegramente passare una regressione nel codice che gira su ogni pagina. Così l'ho isolato su una propria riga di budget e ho messo un tetto separato e più stretto sul JavaScript a livello di applicazione.

Una **non-scelta** deliberata qui, che conta: *non* ho trasformato Lighthouse o i load test in gate. Sul perché, tra un attimo.

## Gradino 5: Property-Based Testing e Residualità — Stressare l'Intero Spazio 🎲

Ogni test fin qui controlla dei **punti**: per l'input X, aspettati l'output Y. Sei tu a scegliere X, quindi controlli sempre e solo i casi che hai immaginato. Il bug vive nel caso che non hai immaginato.

Il [property-based testing](https://github.com/dubzzz/fast-check) ribalta tutto questo. Invece di "per questo input, questo output", enunci un **invariante che deve valere per ogni input**, e lo strumento genera centinaia di input casuali cercando di romperlo, poi *riduce* (shrink) ogni fallimento al caso minimo:

- Per *qualsiasi* stringa, il reading-time restituisce un numero intero ≥ 1 e mai `NaN`.
- Per *qualsiasi* referer, normalizzarlo due volte equivale a normalizzarlo una volta.
- Per *qualsiasi* body JSON, l'endpoint di contatto restituisce uno status sensato e non va mai in crash.

Questo si collega alla [teoria della residualità](https://www.sciencedirect.com/science/article/pii/S1877050920305585) (Barry O'Reilly): un sistema si comprende meglio dai suoi **residui** — ciò che sopravvive dopo che lo colpisci con degli **stressor**. Progetti per la resilienza enumerando gli stressor e assicurandoti che per ognuno esista un residuo capace di reggere. Input casuali, fallimenti delle dipendenze, payload ostili: un agente autonomo è esso stesso un generatore di stressor, quindi la domanda giusta smette di essere "ho testato ciò che ho immaginato?" e diventa "qual è l'universo degli stressor, e per ognuno sopravvive un residuo?"

Ha dato i suoi frutti nel giro di minuti. Uno stressor generato ha prodotto:

```js
normalizeReferer("git:foo") // → "null"  (la stringa letterale!)
```

`URL.origin` restituisce la *stringa* `"null"` per gli schemi non `http(s)`, e la mia analytics stava allegramente salvando quel valore come referer. Nessun test a esempi avrebbe mai provato `git:foo`. La property di idempotenza l'ha trovato, l'ha ridotto a quattro caratteri, e l'ho corretto restringendo ai referer http(s) reali.

## Perché "Deterministico" È Tutto il Punto 🎯

Un filo conduttore attraversa tutto questo, ed è il motivo per cui continuo a dire *gate* e non *test*.

Un gate restituisce un verdetto binario e **riproducibile** ed è autorizzato a bloccare il merge. Quell'asticella è più alta di "un test che gira", e il determinismo è non negoziabile per tre ragioni:

1. **Un gate instabile (flaky) viene disabilitato.** La prima volta che un controllo diventa rosso per ragioni non legate alla tua modifica, gli umani imparano a rilanciarlo finché non diventa verde. Un gate non deterministico è *peggio* di nessun gate, perché addestra tutti a ignorare il rosso.
2. **Sostituisce il lento giudizio umano.** È il collegamento con il trunk-based development: la continuous integration è sicura solo perché un gate veloce e affidabile prende il posto della lunga coda di review.
3. **È il segnale di feedback dell'agente.** Un agente non ha gusto, né paura, né memoria dell'ultimo disastro. Devi esternalizzare il giudizio in recinzioni meccaniche — e una recinzione è utile solo se sta sempre nello stesso posto.

È esattamente per questo che ho rifiutato di mettere un gate su Lighthouse o sui load test. I loro punteggi oscillano sui runner condivisi della CI. Sono **monitor** fantastici — rumorosi, osservativi, utili a seguire i trend — ma un **gate** deve essere deterministico. Stessi dati, lavoro diverso. Confondere i due ti dà o pipeline instabili o regressioni non sorvegliate.

E i test randomizzati? Ho fissato il seed. Il property-based testing è casuale nel *metodo* ma deterministico nel *verdetto*: un fallimento è sempre riproducibile. L'esplorazione è una feature; l'instabilità no.

## Cosa Ho Ottenuto Davvero 🧩

Impila i gradini e ognuno chiude una falla che gli altri non vedono:

- I test a esempi controllano il **comportamento scelto**.
- La coverage controlla **se ho guardato**.
- Il mutation testing controlla **se il mio guardare ha i denti**.
- Le fitness function architetturali controllano **la forma del sistema**.
- I performance budget ne controllano **il costo**.
- Il property-based testing controlla **l'intero spazio degli input, sotto stress**.

È difesa in profondità, non ridondanza. E la prova che non è teatro sta nel conteggio dei caduti: lungo il percorso questi gate hanno fatto emergere un'assertion di test obsoleta, un mutante sopravvissuto, un header email `From` malformato e un referer che si serializzava nella stringa `"null"` — ognuno di essi un bug reale e preesistente, nessuno preso dai test che avevo già.

È questo il segnale rivelatore. Nel momento in cui costruisci gate con i denti, iniziano a trovare cose.

Rendere il mio sito leggibile dagli agenti mi ha preso un sabato sera. Rendere il mio codice *sicuro da modificare per gli agenti* è la metà più interessante — perché in fondo è semplicemente la disciplina che rende la codebase più sicura anche per **me**. L'agente è sempre stato solo la molla che ha fatto scattare tutto.
