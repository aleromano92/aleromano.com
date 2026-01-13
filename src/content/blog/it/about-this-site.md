---
title: "Questo Sito e il mio Ritorno alle Basi"
description: "Perché ho deciso di utilizzare un VPS e adottare un flusso di lavoro assistito dall'AI."
pubDate: 2025-04-10
author: "Alessandro Romano"
tags: ["AI", "aleromano.com", "Docker", "VPS"]
language: "it"
image:
    url: ../../../assets/blog/about-this-site/featured.jpg
    alt: Concetto di sviluppo di siti web
---

Pochi al mondo sono costantemente alla ricerca della "prossima grande novità" quanto i Software Engineer :smile:
Che siano framework, SaaS, linguaggi o piattaforme poco importa: la FOMO (Fear Of Missing Out) ci porta a rimanere sempre aggiornati e provare cose nuove, pagando un non indifferente costo in termini di tempo. Mi sono accorto però che, nel tentativo di rimanere al passo con le ultime novità, stavo perdendo di vista le basi che rendono tutto ciò possibile.

Anche nella mia [biografia su questo sito](/it/about#biography), ho scritto che mi piace capire come funzionino le cose. Man mano però che utilizzavo strumenti di sempre più alto livello, mi sono "spaventato" dal ritrovarmi così lontano da come tutte queste tecnologie funzionano sotto il cofano. Ho iniziato a sentire il bisogno di tornare a un approccio più "manuale" e "primitivo" per capire meglio le fondamenta su cui si basa tutto ciò che facciamo.

## Ritorno alle Basi con un VPS 🏗️

Recentemente ho deciso di ospitare questo sito su un **VPS** anziché utilizzare servizi come Vercel o Netlify. Non fraintendetemi: queste piattaforme offrono esperienze di sviluppo incredibili che semplificano il deployment e l'hosting. Ma mi sono reso conto che stavo gradualmente disimparando le basi di come funziona effettivamente Internet.

Configurare un server, impostare nginx, gestire certificati SSL e occuparmi manualmente dei deployment è stato come tuffarsi nei miei 18 anni. Queste sono competenze fondamentali che spesso diamo per scontate nell'era dei deployment con un click.

Ho scelto di usare Hetzner in quanto sembrava il migliore per il rapporto qualità/prezzo: sto usando una istanza CX22 con 2 vCPUs (Intel), 4GB di RAM e 40GB di SSD per 4 euro al mese!

> Se vuoi provarlo, puoi [usare il mio link](https://hetzner.cloud/?ref=5R5wQFCPotUP) per ottenere 20 euro di crediti! 🚀

## Rimanere Operativo 🧑‍🏭

Come persona che è passata all'engineering management, è facile allontanarsi dai dettagli tecnici. Tuttavia, credo che rimanere operativo con la tecnologia sia cruciale; non solo per mantenere credibilità con i miei team, ma anche per la mia soddisfazione personale e crescita continua.

Questo sito è il mio playground: un luogo dove posso sperimentare, imparare e implementare senza preoccuparmi troppo di rompere tutto!

## Sviluppo Assistito dall'AI per Chi Ha Poco Tempo 🤖

Essere un Engineering Manager di tre team e padre di due figli non lascia molto spazio per lunghe sessioni di coding. Il tempo che riesco a dedicarci è in piccoli blocchi, spesso interrotti, senza ore di concentrazione continua.

È qui che lo sviluppo assistito dall'AI ha fatto la differenza. Ho utilizzato [Cursor](https://www.cursor.com/) per accelerare il mio flusso di lavoro ([ne parlo meglio qui](https://aleromano.com/posts/it/manage-parent-code-ai)), permettendomi di fare progressi significativi anche in blocchi di tempo brevi e frammentati. La capacità di esprimere un'intenzione e avere l'AI che in modalità *Agent* implementa per me ha ridotto il costo, in termini di energia, del context switch continuo.

## Stack Tecnologico: La Semplicità è Importante 💻

Per questo sito, ho scelto uno stack semplice ma potente. Sto utilizzando [Astro](https://astro.build/) come framework. È perfetto per siti incentrati sui contenuti grazie alle sue eccellenti capacità di generazione di siti statici. Poi, anche se overkill per un progetto solitario, ho utilizzato **TypeScript**.

I contenuti dei post, come questo che stai leggendo, sono scritti in **Markdown** e gestiti tramite le `Content Collections` di Astro, rendendo l'organizzazione e l'aggiornamento dei contenuti molto semplice. Per lo stile, ho optato per **CSS puro**, utilizzando variabili CSS per implementare funzionalità come il tema chiaro/scuro, mantenendo il controllo diretto sull'aspetto senza dipendenze aggiuntive.

Ho implementato anche il supporto **multilingua (i18n)** per raggiungere un pubblico più ampio e un **feed RSS** per permettere agli utenti di seguire gli aggiornamenti tramite i loro lettori preferiti.

Nonostante non fosse necessario, ho deciso di utilizzare [Docker](https://www.docker.com/) per il packaging e il deployment. Per un sito prettamente statico come questo, puzza abbastanza di over-engineering, ma:

- Docker è un industry standard con cui raramente ho avuto a che fare. In più, un utente [su X mi ha incuriosito coi suoi post](https://x.com/kkyrio/status/1861371736492572710) sull'argomento.
- Ho voluto usare anche [Nginx](https://nginx.org/) per servire efficacemente i contenuti statici e quindi Docker Compose sembrava la scelta giusta.

Il deploy avviene ad ogni commit su `main` tramite GitHub Actions, che eseguono i test e il build del sito, per poi inviare il tutto al server remoto.

## Il Fattore Costo 💰

Una motivazione, seppur secondaria, è stata anche economica. Non volevo spendere 16$ al mese per [Super.so](https://super.so/) quando sapevo di poter costruire e ospitare qualcosa da solo a una frazione del costo. Il mio VPS costa significativamente meno (4.62€ al mese), e ho il vantaggio aggiuntivo di poter ospitare più progetti sullo stesso server (la mia prossima SaaS è dietro l'angolo, peccato che la Terra sia sferica 😂).

## Dovresti farlo anche tu? 🤔

**TL;DR:** No. A meno che il tuo contesto e le tue passioni siano simili alle mie.

Questo approccio non è per tutti. Se sei concentrato sul rilascio rapido di prodotti o non hai interesse per il lato infrastrutturale dello sviluppo web, piattaforme come Vercel e Netlify sono assolutamente la scelta giusta.

Ma c'è un valore profondo e intrinseco nel tornare alle basi e capire davvero come funzionano le cose. Sì, anche gli LLM. Per quanto siamo bombardati di micro-informazioni e novità, è fondamentale non perdere di vista le fondamenta su cui si basa tutto ciò che facciamo.

A volte, per andare avanti, dobbiamo fare un passo indietro e rivisitare ciò che potremmo aver dimenticato lungo il percorso.
