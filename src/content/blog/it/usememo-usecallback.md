---
title: 'Quando usare useMemo e useCallback'
description: 'Le ottimizzazioni di performance portano SEMPRE un costo, ma non necessariamente dei benefici. Parliamo di costi e benefici di useMemo e useCallback.'
pubDate: 2019-06-04
author: 'Alessandro Romano'
tags: ['React']
language: 'it'
originalLink: 'https://kentcdodds.com/blog/usememo-and-usecallback'
image:
  url: /src/assets/blog/usememo-usecallback/featured.webp
  alt: Dollars burning
---

Le ottimizzazioni di performance portano SEMPRE un costo, ma non necessariamente dei benefici. Parliamo di costi e benefici di useMemo e useCallback.

## Introduzione

React ci offre alcuni hook per l'ottimizzazione delle performance: `useMemo` e `useCallback`. Ma come ogni ottimizzazione, portano con sé un costo. Vediamo quando vale la pena utilizzarli.

## Il Costo delle Performance

Ogni ottimizzazione ha un costo. Nel caso di `useMemo` e `useCallback`, il costo è:

1. Occupazione di memoria per mantenere i valori memorizzati
2. Complessità del codice aggiuntiva
3. Possibili bug dovuti a dipendenze non correttamente specificate

```jsx
// Senza useCallback
function MyComponent() {
  const handleClick = () => {
    console.log('clicked');
  };
  return <button onClick={handleClick}>Click me</button>;
}

// Con useCallback
function MyComponent() {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);
  return <button onClick={handleClick}>Click me</button>;
}
```

## Quando Usarli

`useMemo` e `useCallback` sono utili quando:

1. Hai calcoli costosi che non vuoi ripetere ad ogni render
2. Passi callback a componenti ottimizzati che si basano su referential equality
3. Memorizzi valori utilizzati da altri hook nelle dipendenze

```jsx
// Calcolo costoso
const memoizedValue = useMemo(() => {
  return someExpensiveComputation(prop);
}, [prop]);

// Callback per componente ottimizzato
const MemoizedComponent = React.memo(({ onClick }) => {
  return <button onClick={onClick}>Click me</button>;
});
```

## Conclusione

Prima di aggiungere `useMemo` o `useCallback`, chiediti:

1. Il costo del calcolo/funzione è davvero significativo?
2. Il componente si sta effettivamente re-renderizzando inutilmente?
3. L'ottimizzazione porta un beneficio misurabile?

Se la risposta è no, probabilmente non ne hai bisogno. DAJE!

Per approfondire l'argomento in inglese, leggi l'articolo originale di Kent C. Dodds.

</ExternalLanguageRedirect>
