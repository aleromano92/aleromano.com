---
title: YAGNI per il Business
description: YAGNI significa "You Ain't Gonna Need It" (Non Ne Avrai Bisogno). È un principio dell'Extreme Programming (XP) che suggerisce di non implementare una funzionalità finché non è necessaria. È uno strumento essenziale per evitare sprechi di tempo e risorse che può essere applicato anche in ambiti diversi dallo Sviluppo Software.
pubDate: 2023-05-31
author: Alessandro Romano
tags: ["Productivity","Inspiration"]
language: it
image:
  url: ../../../assets/blog/yagni-for-business/featured.jpg
  alt: Immagine dello spazio profondo
---

## YAGNI è correlato a Waterfall e Agile? 🌊🏃🏻

> ⚠️ Non voglio sostenere quale approccio sia migliore, credo fermamente che ogni azienda debba applicare un processo che si adatti alla propria natura.

Quando si sviluppa un nuovo prodotto, è essenziale dare priorità alle funzionalità di cui i clienti hanno bisogno. Questo significa che le aziende dovrebbero sviluppare solo le funzionalità necessarie per soddisfare le esigenze dei loro clienti. In questo modo, le aziende possono risparmiare tempo e risorse nel processo di sviluppo.

Il principio **YAGNI** può essere applicato anche ai processi aziendali. Le aziende dovrebbero evitare di implementare processi non necessari. Questo significa che le aziende dovrebbero implementare solo i processi essenziali per le loro operazioni commerciali. In questo modo, le aziende possono risparmiare tempo e risorse e concentrarsi sui processi essenziali per le loro operazioni.

Un approccio **waterfall** di solito funziona all'opposto: prima, devi raccogliere TUTTI i requisiti, i casi d'uso e i casi limite e progettare (o definire) un processo prima che qualsiasi cosa venga implementata.

## Esempio

Immagina di voler costruire un form per raccogliere numeri di telefono per un sistema di allerta che abbia una fatturazione Pay-per-use dietro ogni notifica.

Ci sono cose che dovresti definire fin dall'inizio, come assicurarti di essere conforme al GDPR nei paesi UE e di avere un sistema di monitoraggio per giustificare le fatture. Ma invece di concentrarti su tutte queste cose all'inizio, puoi scegliere un MVP dove:

- il paese non è nell'UE quindi il GDPR non si applica (riduce le _attività di compliance_)
- il paese non è così grande, quindi non avrai miliardi di record dal primo giorno (riduce i _vincoli tecnologici_)
- il paese ha un sistema fiscale semplice per applicare l'IVA sulle fatture (riduce il _peso dei processi_)

Lanci il form nel paese scelto in un tempo relativamente breve e monitori come sta andando: potrebbe succedere che i ricavi che ottieni da questo MVP siano già allineati al tuo piano.

Questo è **Agile**, questo è **Lean**, non avrai bisogno della conformità GDPR né di aumentare il tuo Storage su Disco né di studiare sistemi fiscali complicati. Se li avessi pianificati fin dall'inizio, _il mercato sarebbe già cambiato_ e saresti ancora fermo a costruire la prima release.

## Il Lato Oscuro di YAGNI

Ci sono dei **rischi** nell'usare YAGNI senza farti domande. Prima di tutto, ci sono [2 tipi di decisioni che puoi prendere](https://www.businessinsider.com/jeff-bezos-on-type-1-and-type-2-decisions-2016-4?r=US&IR=T):

1. Decisioni di Tipo 1, quelle non reversibili
2. Decisioni di Tipo 2, da cui puoi sempre tornare indietro

Sui problemi di Tipo 1, non pensare al futuro e alle conseguenze potrebbe farti incorrere in costi nascosti più avanti. Quindi, mentre potresti ancora non definire e pianificare nulla in anticipo, devi mettere alla prova la tua decisione chiedendoti cose come:

- cosa farei se più tardi avessi bisogno di supportare paesi soggetti al GDPR?
- cosa succede se il volume cresce così tanto che il nostro storage crasha? o i nostri costi di storage aumentano esponenzialmente?
- come mi assicurerei che la funzionalità che costruisco supporti un paese dove la percentuale di IVA è più alta rispetto al paese in cui sto lanciando?

Mentre non stai **risolvendo** questi problemi ora, devi pensare a un modo per farlo più tardi ed essere **consapevole** dei rischi e delle scorciatoie che stai prendendo.

## Conclusione

> Preparati per il futuro, costruisci il presente.
