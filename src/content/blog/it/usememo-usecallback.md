---
title: 'Quando usare useMemo e useCallback'
description: 'Le ottimizzazioni di performance portano SEMPRE un costo, ma non necessariamente dei benefici. Parliamo di costi e benefici di useMemo e useCallback.'
pubDate: 2019-06-04
author: 'Alessandro Romano'
tags: ["React"]
language: 'it'
originalLink: 'https://kentcdodds.com/blog/usememo-and-usecallback'
image:
  url: ../../../assets/blog/usememo-usecallback/featured.webp
  alt: Dollars burning
---

> Questo articolo rappresenta la traduzione in italiano del post originale [When to useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback) di [Kent C. Dodds](https://kentcdodds.com/)

Ecco un dispenser di caramelle implementato in React:

```tsx
function CandyDispenser() {
  const initialCandies = ['snickers', 'skittles', 'twix', 'milky way'];
  const [candies, setCandies] = React.useState(initialCandies);
  const dispense = (candy) => {
    setCandies((allCandies) => allCandies.filter((c) => c !== candy));
  };
  return (
    <div>
      <h1>Candy Dispenser</h1>
      <div>
        <div>Available Candy</div>
        {candies.length === 0 ? (
          <button onClick={() => setCandies(initialCandies)}>refill</button>
        ) : (
          <ul>
            {candies.map((candy) => (
              <li key={candy}>
                <button onClick={() => dispense(candy)}>grab</button> {candy}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

Ora, voglio fare una domanda e vorrei che rifletteste bene sulla risposta prima di andare avanti.
Sto per apportare un piccolo cambiamento e voglio che proviate a capire quale codice sia più performante.

Il cambiamento è un wrap della funzione `dispense` all'interno di `React.useCallback`:

```js
const dispense = React.useCallback((candy) => {
  setCandies((allCandies) => allCandies.filter((c) => c !== candy));
}, []);
```

Ecco di nuovo l'originale:

```js
const dispense = (candy) => {
  setCandies((allCandies) => allCandies.filter((c) => c !== candy));
};
```

La domanda è: qual è più performante?

_Lascio un po' di spazio per non fare spoiler sulla risposta..._

<p>&nbsp;</p>
<p>&nbsp;</p>
<p>&nbsp;</p>

_Continua a scrollare... Hai ormai risposto, giusto?_

<p>&nbsp;</p>
<p>&nbsp;</p>
<p>&nbsp;</p>

_Ecco la risposta..._

## Perché `useCallback` ha performance peggiori?

Si legge spesso che l'uso di `React.useCallback` migliora le performance e che "le funzioni inline possono essere problematiche per le performance", quindi perché è meglio _non_ usare `useCallback`?

Facciamo un passo indietro dall'esempio proposto e da React in generale.

Consideriamo che: **Ogni linea di codice che viene eseguita ha un costo.**
Proviamo ad esplodere l'esempio che usa `useCallback` al fine di illustrare meglio le istruzioni che vengono eseguite (senza cambiare il comportamento):

```js
const dispense = (candy) => {
  setCandies((allCandies) => allCandies.filter((c) => c !== candy));
};
const dispenseCallback = React.useCallback(dispense, []);
```

Di nuovo l'originale:

```js
const dispense = (candy) => {
  setCandies((allCandies) => allCandies.filter((c) => c !== candy));
};
```

Notate qualcosa di strano? Guardiamo la diff:

```diff
const dispense = (candy) => {
  setCandies((allCandies) => allCandies.filter((c) => c !== candy));
};
+ const dispenseCallback = React.useCallback(dispense, []);
```

Sono _esattamente_ le stesse a part che la versione con `useCallback` esegue
_più_ istruzioni. Non solo la definizione della funzione, ma anche la definizione di un array (`[]`) _e_ la chiamata a `React.useCallback` che sta a sua volta settando properties ed eseguendo altre istruzioni etc.

In _entrambi_ i casi JavaScript deve allocare memoria per la definizione della funzione ad ogni _render_ e in base a come `useCallback` è implementata, si ottiene
_altra_ allocazione per le definizioni delle funzioni (non è questo il caso, ma il punto resta valido).

> Questo è stato anche oggetto di un sondaggio su [Twitter da parte di Kent](https://twitter.com/kentcdodds/status/1135943012410830848)

Altra menzione è il fatto che nel secondo render del componente, la funzione `dispense` originale viene garbage collected (liberando spazio in memoria) ed un'altra viene creata.
Invece, con utilizzo di `useCallback` la funzione `dispense` originale **non** viene garbage collected ed un'altra viene creata, quindi anche dal punto di vista dello spazio di memoria utilizzato le performance sono peggiori.

Come nota correlata, se avete delle dipendenze allora è molto probabile che React stia mantenendo un riferimento alle funzioni precedenti perché la memoizzazione tipicamente significa che manteniamo copie dei vecchi valori da ritornare nel caso in cui otteniamo le stesse dipendenze fornite precedentemente. I più attenti di voi noteranno che questo significa che React deve anche mantenere un riferimento alle dipendenze per questo controllo di uguaglianza (che tra l'altro sta probabilmente già accadendo grazie alla vostra closure, ma è comunque qualcosa che vale la pena menzionare).

## In che modo `useMemo` è differente, ma allo stesso tempo simile?

`useMemo` è simile `useCallback` tranne per il fatto che applica la memoization a qualsiasi tipo (non solo funzioni).
Lo permette accettando una funzione che ritorna il valore e in seguito la funzione viene richiamata _solo_ quando il valore deve essere recuperato: tipicamente succede una volta sola per ogni cambio degli elementi dell'array delle dipendenze tra un render e l'altro.

Quindi, se non volessi inizializzare `initialCandies` ad ogni render,
potrei fare così:

```diff
- const initialCandies = ['snickers', 'skittles', 'twix', 'milky way'];
+ const initialCandies = React.useMemo(
+   () => ['snickers', 'skittles', 'twix', 'milky way'],
+   []
+ );
```

E mi eviterei il problema, ma il risparmio sarebbe così minimo da non giustificare l'aggiunta di complessità al codice.
Di fatti, è probabilmente peggio usare `useMemo` perché nuovamente stiamo chiamando una funzione che a sua volta sta assegnando properties etc.

In questo caso particolare, la cosa migliore è probabilmente questa:

```diff
+ const initialCandies = ['snickers', 'skittles', 'twix', 'milky way']
function CandyDispenser() {
-  const initialCandies = ['snickers', 'skittles', 'twix', 'milky way']
  const [candies, setCandies] = React.useState(initialCandies)
```

Ma non sempre si ha questa fortuna perché il valore è derivato dalle `props` o da altre variabili inizializzate nel body della funzione.

Il punto resta comunque che i benefici di ottimizzare quel pezzo di codice sono talmente pochi che è meglio investire il tempo nel creare un prodotto migliore.

## Cosa mi porto a casa?

**Le ottimizzazioni di performance non sono mai gratuite. Hanno SEMPRE un costo, ma il beneficio apportato NON sempre lo ripaga.**

Perciò, _ottimizza responsabilmente_.

## Quindi quando _dovrei_ usare `useMemo` e `useCallback`?

Ci sono ragione specifiche per cui questi hooks sono built-in in React:

1. Uguaglianza referenziale
2. Calcoli computazionalmente pesanti

## Uguaglianza referenziale

Se siete nuovi alla programmazione/Javascript, imparerete velocemente che non tutti i tipi primitivi si comportano allo stesso modo quando si applica l'operatore di uguaglianza:

```js
// EXPECTED
true === true // true
false === false // true
1 === 1 // true
'a' === 'a' // true

// UNEXPECTED(?)
{} === {} // false
[] === [] // false
() => {} === () => {} // false

const z = {}
z === z // true

// NOTE: React in realtà usa Object.is, ma è molto simile a ===
```

Senza scendere troppo nei dettagli, basta ricordare che ogni volta che si definisce un oggetto dentro un Function Component React, questo _non_ sarà
referenzialmente uguale all'ultima volta in cui lo stesso oggetto è stato definito, anche se ha le stesse properties con gli stessi valori.

Ci sono due casi in cui l'uguaglianza referenziale ha impatti in React, vediamoli uno alla volta.

### Liste di dipendenze

Proviamo a partire da un esempio.

> Attenzione, non fate troppo caso al codice che è volutamente complesso. Concentratevi sui concetti.

```tsx
function Foo({ bar, baz }) {
  const options = { bar, baz };
  React.useEffect(() => {
    buzz(options);
  }, [options]); // dobbiamo eseguire nuovamente questo effetto se bar o baz cambiano
  return <div>foobar</div>;
}

function Blub() {
  return <Foo bar="bar value" baz={3} />;
}
```

Il problema sta nel fatto che `useEffect` applica un controllo di uguaglianza referenziale su `options` ad ogni render e, per come funziona Javascript, `options` risulterà sempre diverso tra i renders, invocando `useEffect` dopo ogni render invece che esclusivamente al cambio di `bar` o `baz`.

Due modi per sistemare questo comportamento:

```tsx
// opzione 1
function Foo({ bar, baz }) {
  React.useEffect(() => {
    const options = { bar, baz };
    buzz(options);
  }, [bar, baz]); // uso le singole props invece dell' oggetto combinato
  return <div>foobar</div>;
}
```

Questa è l'opzione migliore da applicare ai casi reali.

Ma esiste una situazione che rende questo approccio impraticabile: se `bar` o
`baz` sono tipi non primitivi come oggetti/array/funzioni/etc:

```tsx
function Blub() {
  const bar = () => {};
  const baz = [1, 2, 3];
  return <Foo bar={bar} baz={baz} />;
}
```

Questo è il motivo per cui esistono `useCallback` e `useMemo`.

Quindi ecco l'opzione 2 che li utilizza:

```tsx
// opzione 2
function Foo({ bar, baz }) {
  React.useEffect(() => {
    const options = { bar, baz };
    buzz(options);
  }, [bar, baz]);
  return <div>foobar</div>;
}

function Blub() {
  const bar = React.useCallback(() => {}, []);
  const baz = React.useMemo(() => [1, 2, 3], []);
  return <Foo bar={bar} baz={baz} />;
}
```

> NOTA: Lo stesso si applica per l'array di dipendenze passato a `useEffect`, `useLayoutEffect`, `useCallback` e `useMemo`.

### `React.memo` (e i suoi amici)

> Attenzione, non fate troppo caso al codice che è volutamente complesso. Concentratevi sui concetti.

Prendiamo questo:

```tsx
function CountButton({ onClick, count }) {
  return <button onClick={onClick}>{count}</button>;
}

function DualCounter() {
  const [count1, setCount1] = React.useState(0);
  const increment1 = () => setCount1((c) => c + 1);

  const [count2, setCount2] = React.useState(0);
  const increment2 = () => setCount2((c) => c + 1);

  return (
    <>
      <CountButton count={count1} onClick={increment1} />
      <CountButton count={count2} onClick={increment2} />
    </>
  );
}
```

Ogni volta che clicchi uno qualsiasi tra i due pulsanti, lo stato di `DualCounter` cambia e quindi viene eseguito un re-render che si applica ad entrambi i `CountButton`.
Però, l'unico che _davvero_ ha bisogno del re-render è quello cliccato, giusto?
Quindi se clicchi il primo, il secondo viene re-renderizzato, anche se nulla è cambiato.

Questo si chiama "re-rendering non necessario".

**LA MAGGIOR PARTE DELLE VOLTE NON DOVRESTI PREOCCUPARTI DI OTTIMIZZARE I RE-RENDER NON NECESSARI.**
React è SUPER veloce e perderesti solo tempo ad ottimizzare queste cose.
Anche Kent spiega come nei suoi 3 anni di lavoro in PayPal non ha _mai_ dovuto applicare ottimizzazioni simili.

Ma ci sono situazioni per cui un rendering può impiegare molto tempo (considera Grafici/Animazioni molto interattive).
Grazie alla natura di React esiste un escamotage:

```tsx
const CountButton = React.memo(function CountButton({ onClick, count }) {
  return <button onClick={onClick}>{count}</button>;
});
```

Ora `CountButton` verrà re-renderizzato solo se le sue props cambiano!
Ma non abbiamo finito.

Ricordate il discorso sull'uguaglianza referenziale?
Nel componente `DualCounter`, le funzioni `increment1` e `increment2`
sono definite all'interno del Function Component portando a crearle nuovamente ad ogni re-render di `DualCounter`.
Questo significa che React farà re-rendering dei `CountButton` in ogni caso.

Questo è l'altro caso in cui `useCallback` e `useMemo` sono d'aiuto:

```diff
const CountButton = React.memo(function CountButton({ onClick, count }) {
  return <button onClick={onClick}>{count}</button>;
});

function DualCounter() {
  const [count1, setCount1] = React.useState(0);
-  const increment1 = () => setCount1((c) => c + 1);
+  const increment1 = React.useCallback(() => setCount1((c) => c + 1), []);

  const [count2, setCount2] = React.useState(0);
- const increment2 = React.useCallback(() => setCount2((c) => c + 1), []);
+ const increment2 = React.useCallback(() => setCount1((c) => c + 1), []);

  return (
    <>
      <CountButton count={count1} onClick={increment1} />
      <CountButton count={count2} onClick={increment2} />
    </>
  );
}
```

In questo modo evitiamo il "re-rendering non necessario" di `CountButton`.

Voglio reiterare sul fatto che consiglio vivamente di non usare `React.memo` (o
i suoi amici `PureComponent` e `shouldComponentUpdate`) senza aver prima misurato un problema di performance.
Queste ottimizzazioni portano un costo, dovete quindi valutare opportunamente il beneficio conseguente.
Il rischio è di fare più **danni** che altro.

## Calcoli computazionalmente pesanti

Questa è un'altra ragione per cui `useMemo` è un hook built-in di React (questa cosa non si applica a `useCallback`). Il vantaggio di `useMemo` è evidente nel momento in cui hai una funzione sincrona che esegue dei calcoli computazionalmente costosi.

Un esempio, anche se ovviamente poco comune, è
[il calcolo dei numeri primi](https://developer.mozilla.org/en-US/docs/Tools/Performance/Scenarios/Intensive_JavaScript):

```tsx
function RenderPrimes({ iterations, multiplier }) {
  const primes = calculatePrimes(iterations, multiplier);
  return <div>Primes! {primes}</div>;
}
```

Passando grandi valori di `iterations` o `multiplier` si rischia di mandare l'utilizzo CPU alle stelle.
Ovviamente non possiamo agire sull'hardware che sta eseguendo la nostra funzione, ma _possiamo_ fare in modo che a parità di parametri, il calcolo effettivo verrà eseguito solo la prima volta, mentre le successive esecuzioni ritorneranno il valore "memoizzato".
No, non ho dimenticato una "r", memoizzare (in inglese _memoization_) è una tecnica che esiste da sempre in programmazione e fin dai tempi di **lodash** in Javascript.

```tsx
function RenderPrimes({ iterations, multiplier }) {
  const primes = React.useMemo(() => calculatePrimes(iterations, multiplier), [iterations, multiplier]);
  return <div>Primes! {primes}</div>;
}
```

In questo modo anche se stiamo calcolando i numeri primi ad ogni render, `useMemo` fa in modo di essere super veloci nel caso in cui i valori di `iterator` e `multiplier` sono già stati passati almeno una volta.

## Conclusioni

Ricorda sempre che ogni astrazione ed ottimizzazione di performance hanno un costo.
Non over-astrarre e non over-ottimizzare, non prematuramente almeno o non finchè non hai **misurato** essere necessario.

Per non parlare della complessità in lettura del codice aggiunta da `useMemo` e `useCallback`: i tuoi colleghi non gradiranno!

Letture collegate:

- React FAQ:
  ["Are Hooks slow because of creating functions in render?"](https://reactjs.org/docs/hooks-faq.html#are-hooks-slow-because-of-creating-functions-in-render)
- [Ryan Florence](https://twitter.com/ryanflorence):
  [React, Inline Functions, and Performance](https://reacttraining.com/blog/react-inline-functions-and-performance)
