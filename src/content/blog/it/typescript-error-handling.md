---
title: 'Come gestire gli errori in TypeScript'
description: 'Impara a gestire correttamente gli errori in TypeScript utilizzando i tipi unknown ed Error.'
pubDate: 2024-03-21
author: 'Alessandro Romano'
tags: ['Typescript']
language: 'it'
originalLink: 'https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript'
image:
  url: ../../../assets/blog/typescript-error-handling/featured.webp
  alt: 'Brown and white cat in shallow focus shot'
---

> Questo articolo rappresenta la traduzione in italiano del post originale [Get a catch block error message with TypeScript](https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript) di [Kent C. Dodds](https://kentcdodds.com/)

Parliamo di questo esempio:

```javascript
const reportError = ({ message }) => {
  // invia l'errore al nostro servizio di logging...
}

try {
  throw new Error('Oh no!')
} catch (error) {
  // procediamo, ma segnaliamo l'errore
  reportError({ message: error.message })
}
```

Fin qui tutto bene? Beh, questo è perché stiamo usando JavaScript. Vediamo cosa succede con TypeScript:

```typescript
const reportError = ({ message }: { message: string }) => {
  // invia l'errore al nostro servizio di logging...
}

try {
  throw new Error('Oh no!')
} catch (error) {
  // procediamo, ma segnaliamo l'errore
  reportError({ message: error.message }) // Errore di TypeScript!
}
```

La chiamata a `reportError` non compila. Il colpevole è `error.message`. Questo perché (da poco) TypeScript imposta di default il tipo di `error` su `unknown`. Ed è davvero così! Nel mondo degli errori, non ci sono molte garanzie sui tipi di errori che possono essere lanciati. Infatti, questo è lo stesso motivo per cui non puoi fornire il tipo per il `.catch(error => {})` di una Promise rejection con il generico della Promise (`Promise<ResolvedValue, NopeYouCantProvideARejectedValueType>`).

In effetti, potrebbe non essere nemmeno un errore quello che viene lanciato. Potrebbe essere praticamente qualsiasi cosa:

```typescript
throw 'Che succede!?'
throw 7
throw { cosa: 'è questo' }
throw null
throw new Promise(() => {})
throw undefined
```

Puoi lanciare qualsiasi cosa di qualsiasi tipo. Quindi è facile, giusto? Potremmo semplicemente aggiungere il tipo `Error` al catch per dire che questo codice lancerà solo un errore, giusto?

```typescript
try {
  throw new Error('Oh no!')
} catch (error: Error) { // <-- Aggiungto qui 
  // segnaliamo l'errore
  reportError({ message: error.message })
}
```

Non così in fretta! Con questo otterrai il seguente errore di compilazione TypeScript:

```console
Catch clause variable type annotation must be 'any' or 'unknown' if specified. ts(1196)
```

Il motivo è che anche se nel nostro codice sembra che non ci sia modo che venga lanciato qualcos'altro, JavaScript è un po' strano e quindi è perfettamente possibile per una libreria di terze parti fare qualcosa di strano come fare il monkey-patching del costruttore di Error per lanciare qualcosa di diverso:

```typescript
Error = function () {
  throw 'Fiori'
} as any
```

Quindi cosa deve fare uno sviluppatore? Il meglio che può! Che ne dici di questo:

```typescript
try {
  throw new Error('Oh no!')
} catch (error) {
  let message = 'Errore Sconosciuto'
  if (error instanceof Error) message = error.message
  // procediamo, ma segnaliamo l'errore
  reportError({ message })
}
```

Ecco fatto! Ora TypeScript non si lamenta più e, cosa più importante, stiamo gestendo i casi in cui potrebbe essere qualcosa di completamente inaspettato. Forse potremmo fare anche di meglio:

```typescript
try {
  throw new Error('Oh no!')
} catch (error) {
  let message
  if (error instanceof Error) message = error.message
  else message = String(error)
  // procediamo, ma segnaliamo l'errore
  reportError({ message })
}
```

Quindi qui se l'errore non è un vero oggetto `Error`, allora lo convertiamo semplicemente in stringa e speriamo che finisca per essere qualcosa di utile.

Possiamo trasformare questo in una utility da utilizzare in tutti i nostri blocchi catch:

```typescript
function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

const reportError = ({ message }: { message: string }) => {
  // invia l'errore al nostro servizio di logging...
}

try {
  throw new Error('Oh no!')
} catch (error) {
  // procediamo, ma segnaliamo l'errore
  reportError({ message: getErrorMessage(error) })
}
```

Questo mi è stato utile nei miei progetti. Spero che aiuti anche te.

## Aggiornamento

[Nicolas](https://github.com/npirotte) ha avuto un [ottimo suggerimento](https://github.com/kentcdodds/kentcdodds.com/issues/206) per gestire situazioni in cui l'oggetto errore con cui stai lavorando non è un vero errore. E poi [Jesse](https://discord.com/users/804795652252106762) ha suggerito di [stringificare l'oggetto](https://discord.com/channels/715220730605731931/715227739749089281/903649313228480532) errore se possibile. Quindi tutti insieme i suggerimenti combinati appaiono così:

```typescript
type ErrorWithMessage = {
  message: string
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}

function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) return maybeError

  try {
    return new Error(JSON.stringify(maybeError))
  } catch {
    // fallback nel caso ci sia un errore nel cast a string di maybeError
    // come dei riferimenti circolari per esempio.
    return new Error(String(maybeError))
  }
}

function getErrorMessage(error: unknown) {
  return toErrorWithMessage(error).message
}
```

Utile!

## Conclusione

Penso che la lezione chiave qui sia ricordare che mentre TypeScript ha i suoi aspetti particolari, non dovresti ignorare un errore o un avviso di compilazione da TypeScript solo perché pensi che sia impossibile che si verifichi. La maggior parte delle volte è assolutamente possibile che accada l'inaspettato e TypeScript fa un ottimo lavoro nel costringerti a gestire quei casi improbabili... E probabilmente scoprirai che non sono così improbabili come pensi.
