---
title: "Upgrade di Azure Schema Registry Senza Alcun Downtime"
description: "Attento all'aggiornamento delle tue app che contengono breaking changes. Prendi spunto da ciò che ho fatto."
pubDate: 2022-08-31
author: "Alessandro Romano"
tags: ["Design Pattern", "Tech", "Cloud"]
language: "it"
image:
    url: ../../../assets/blog/azure-schema-registry-upgrade/featured.jpg
    alt: Azure cloud services
---

## CONTESTO 🗒️

Utilizziamo **Azure Schema Registry** per garantire che le nostre app che producono e consumano eventi correlati siano in accordo su uno schema AVRO. Questo assicura di non fallire a causa di un nome sbagliato o di un campo nullable che pensavamo fosse obbligatorio.

> Se il producer è in grado di emettere un evento in base a uno schema del registro, il consumer lo leggerà correttamente.

Abbiamo iniziato a utilizzare la versione `Standard` senza sapere che c'era un limite fisso sul numero di versioni degli schemi AVRO che si possono avere per un gruppo di schema: 25. E si può avere solo 1 gruppo di schema. `Standard` costa 25 euro/mese, `Premium` 900 euro/mese.

Ma il problema qui è che non abbiamo deciso di risparmiare qualche euro: non abbiamo letto attentamente il limite della versione `Standard` né abbiamo studiato quanto è difficile l'aggiornamento. _SPOILER_: non puoi fare un aggiornamento a caldo, devi creare un nuovo registro schema `Premium` e migrare le tue app.

Abbiamo creato un producer e 2 consumer prima di raggiungere il limite.

## TRY & FALLBACK 🦾

Abbiamo iniziato dai consumer così da poter aggiornare il producer autonomamente e in momenti diversi.

È cruciale non legare il deployment del producer e dei consumer: se dovessi fare il rollback del primo, sei costretto a fare il rollback anche di tutti i consumer 😐

Abbiamo modificato i consumer così da provare a deserializzare l'evento dal registro schema `Premium` prima. Se fallisce, ci si riprova con il registro schema `Standard`. Se anche il `Standard` fallisce, è un errore "corretto" ✅

Ecco la diff:

```diff
-import { ClientSecretCredential } from '@azure/identity';
+import { ClientSecretCredential, DefaultAzureCredential } from '@azure/identity';
import { SchemaRegistryClient } from '@azure/schema-registry';
import { SchemaRegistryAvroSerializer } from '@azure/schema-registry-avro';
import { Context } from "@azure/functions"

// -----------------------------------

+    const premiumClient = new SchemaRegistryClient(
+       process.env.AVRO_SCHEMA_REGISTRY_PREMIUM_FQDN,
+       new DefaultAzureCredential()
+    );
    const serializer = new SchemaRegistryAvroSerializer(client, { groupName: 'ALL_AVRO_SCHEMA' });
    context.log('Schema Registry Serializer obtained.');

+    const premiumSerializer = new SchemaRegistryAvroSerializer(premiumClient, { groupName: 'ALL_AVRO_SCHEMA' });
+    context.log('Schema Registry Premium Serializer obtained.');

+    let received = null;
-    const received = await serializer.deserialize(serviceBusMessage);
+    try {
+        received = await premiumSerializer.deserialize(serviceBusMessage);
+    } catch {
+        context.log('Cannot deserialize from Premium Schema Registry, fallbacking to Standard...');
+        received = await serializer.deserialize(serviceBusMessage);
+   }
    context.log('AVRO Message deserialized.');
```

> _NOTA:_ Usare `DefaultAzureCredential()` ci permette di usare una `Managed Identity` per gestire l'autorizzazione [**che è meglio rispetto ad client secret**](https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview).

Il test consisteva semplicemente nel fare il deploy in Test e osservare che l'esecuzuone entrava sempre nel ramo di fallback.

Siamo stati in grado di aggiornare il Producer dopo 2 settimane: non appena nessun altro messaggio veniva serializzato con il registro `Standard`, abbiamo rimosso il codice di try&fallback dai consumer ✂️

## SUCCESSO 🤘🏻

- cerca di limitare lo scope degli aggiornamenti e non avere troppi sistemi che dipendono l'uno dall'altro ⛓️
- sempre provare l'aggiornamento in un ambiente di test 🦺
- quando pianifichi di usare un nuovo servizio cloud, assicurati di conoscere i limiti del piano scelto e quanto è difficile l'aggiornamento 🤓
- discuti la tua strategia di migrazione con un collega o qualcuno che stimi 🧑‍🤝‍🧑
