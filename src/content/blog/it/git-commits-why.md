---
title: "I messaggi di commit devono spiegare il perché"
description: "Se pensi che i commit message generati dall'AI siano una feature salva tempo, ti sbagli. Se i tuoi commit message riassumono quello che hai modificato, leggi questo post."
pubDate: 2024-01-22
author: "Alessandro Romano"
tags: ["Best Practices", "Git", "Productivity", "Software Engineering"]
language: "it"
image:
  url: ../../../assets/blog/git-commits-why/featured.jpg
  alt: "Git commit history visualization"
---

## Come sbagliare i commit message

I messaggi di commit sono più di una semplice formalità. Sono una forma di comunicazione asincrona con:

- Il tuo futuro io
- I tuoi colleghi
- Chiunque debba mantenere il codice in futuro

Uno degli errori più comuni è quello di scrivere un commit message che non spiega il perché della modifica, bensì ne faccia un riassunto dei cambiamenti.

Ma non mi serve il riassunto, quello posso leggerlo da solo guardando la `diff`!
Ho bisogno di capire perché quella modifica sia necessaria e il contesto dietro a questa.

## Alcuni esempi

```bash
git commit -m "fixed bug on auth" # all auth was broken?
git commit -m "added a new featured image" # who told us to use a featured image?
git commit -m "updated dependencies" # normal maintenance? Changed libraries? Security issue?
git commit -m "refactored blog post to use function component" # what was wrong with the previous implementation?
```

Ora, guarda come diventa immediatamente più semplice rispondere alle domande per ogni commit usando un messaggio diverso:

```bash
git commit -m "sign-in with google users have no password to be stored"
git commit -m "caputre users focus by mixing images and text"
git commit -m "fix a security vulnerability"
git commit -m "improves rendering performance by leveraging referential transparency"
```

E la `diff` di ogni commit mi dirà il _come_ è stato implementato quello che mi racconta il messaggio di commit.

In più, i lettori più attenti avranno notato un altro pattern...

## Non usare i verbi al passato

Usare i verbi al passato è un retaggio di sistemi di versioning centralizzati come Subversion e CVS. Il passato comunica un fatto che è stato già applicato nel repository centrale.

Ma in un sistema distribuito come Git, ogni commit è un punto nel tempo che può essere applicato o meno.

Scrivi i commit message al **presente** o, meglio ancora, usando l'**imperativo**.
Rende molto più semplice seguire la storia del codice e rende più naturale capire cosa faranno i `cherry-pick` e `revert`.

Anche qui, qualche esempio:

```bash
# Past tense commits
$ git log --oneline
abc1234 updated dependencies
def5678 added new featured image

$ git revert abc1234
# Creates new commit:
# "Revert 'updated dependencies'"
# (Confusing: are we downgrading dependencies?)

$ git cherry-pick def5678
# Creates new commit:
# "added new featured image"
# (Weird: we're adding something that was already added?)
```

Ora confrontalo con:

```bash
# Imperative/present tense commits
$ git log --oneline
abc1234 fix a security vulnerability
def5678 caputre users focus by mixing images and text

$ git revert abc1234
# Creates new commit:
# "Revert 'fix a security vulnerability'"
# (Clear: we're going back to the previous unsecure state)

$ git cherry-pick def5678
# Creates new commit:
# "caputre users focus by mixing images and text"
# (Clear: we're applying the technique of mixing images and text)  
```

## (Opzionale) Conventional Commits

Come recita [il loro sito](https://www.conventionalcommits.org/en/v1.0.0/):

> A specification for adding human and machine readable meaning to commit messages.

Alcuni esempi:

- `feat`: nuova funzionalità
- `fix`: correzione di un bug
- `docs`: modifiche alla documentazione
- `style`: modifiche che non influenzano il codice (spazi, formattazione, ecc.)
- `refactor`: modifiche al codice che non correggono bug né aggiungono funzionalità
- `test`: aggiunta o modifica di test
- `chore`: modifiche al build process o strumenti ausiliari

Si può poi impostare un hook per validare i commit message in base a queste convenzioni.
Hanno come ulteriore benefit quello di semplificare la generazione di `changelog` e release notes.

Dal mio punto di vista, sono un'ottima idea, soprattutto quando si **lavora in team**: è un modo per dare delle regole ed evitare che ognuno usi il proprio "stile".

E nel suo piccolo usare `feat` o `fix` comunicano già una parte del perché della modifica.

## Riferimenti

Io cerco di usare sempre questo stile, infatti puoi trovare un'infinità di esempi dando un occhio alla [completa storia dei commit di questo progetto!](https://github.com/aleromano92/aleromano.com/commits/main/)

Voglio comunque sottolineare un esempio specifico: il momento in cui ho a[ggiunto una Github Actions](https://github.com/aleromano92/aleromano.com/commit/0743094e24e40de33eb52561fa18c24fec28bf05) per rilasciare il sito sulla mia VPS Hetzner.

Avrei potuto usare un commit message tipo: `added CI/CD using Github Actions`, ma invece ho scelto di usare: `i want to deploy by just committing`.

Vedi? Solo leggendo la storia dei commit, capisci che da questo momento in poi ho automatizzato il rilascio. Il come è semplice da capire guardando la `diff`:

![image](../../../assets/blog/git-commits-why/actions.png)

## Conclusione

Credo che il modo giusto per chiudere questo post sia con una citazione, riadattata, di [Martin Fowler](https://www.martinfowler.com/):

> "Any fool can write commit messages that tell what changed. Good programmers write commit messages that explain why."  
