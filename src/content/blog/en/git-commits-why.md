---
title: "Commit messages should explain why"
description: "If you think AI-generated commit messages are a time-saving feature, you're wrong. If your commit messages summarize what you changed, read this post."
pubDate: 2024-01-22
author: "Alessandro Romano"
tags: ["Git", "Best Practices", "Productivity"]
language: "en"
image:
  url: ../../../assets/blog/git-commits-why/featured.jpg
  alt: "Git commit history visualization"
---

## How to write bad commit messages

Commit messages are more than just a formality. They are a form of asynchronous communication with:

- Your future self
- Your colleagues
- Anyone who needs to maintain the code in the future

One of the most common mistakes is writing a commit message that doesn't explain why the change was made, but instead summarizes the changes.

But I don't need the summary, I can read that myself by looking at the `diff`!
I need to understand why that change was necessary and the context behind it.

## Some examples

```bash
git commit -m "fixed bug on auth" # all auth was broken?
git commit -m "added a new featured image" # who told us to use a featured image?
git commit -m "updated dependencies" # normal maintenance? Changed libraries? Security issue?
git commit -m "refactored blog post to use function component" # what was wrong with the previous implementation?
```

Now, see how it becomes immediately easier to answer the questions for each commit using a different message:

```bash
git commit -m "sign-in with google users have no password to be stored"
git commit -m "caputre users focus by mixing images and text"
git commit -m "fix a security vulnerability"
git commit -m "improves rendering performance by leveraging referential transparency"
```

And the `diff` of each commit will tell me _how_ it was implemented.

Plus, the more attentive readers will have noticed another pattern...

## Don't use past tense

Using past tense verbs is a legacy from centralized versioning systems like Subversion and CVS. The past tense communicates a fact that has already been applied to the central repository.

But in a distributed system like Git, each commit is a point in time that may or may not be applied.

Write commit messages in the **present** tense or, even better, using the **imperative**.
It makes it much easier to follow the code history and makes it more natural to understand what `cherry-pick` and `revert` will do.

Here's related examples:

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

Now compare it with:

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

## (Optional) Conventional Commits

As stated on [their website](https://www.conventionalcommits.org/en/v1.0.0/):

> A specification for adding human and machine readable meaning to commit messages.

Some examples:

- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation changes
- `style`: changes that don't affect code (spaces, formatting, etc.)
- `refactor`: code changes that neither fix bugs nor add features
- `test`: adding or modifying tests
- `chore`: build process or auxiliary tool changes

You can then set up a hook to validate commit messages based on these conventions.
They have the additional benefit of simplifying the generation of `changelog` and release notes.

From my point of view, they're a great idea, especially when **working in a team**: it's a way to give rules and prevent everyone from using their own "style".

And in its own small way, using `feat` or `fix` already communicates part of the _why_ behind the change.

## References

I always try to use this style, in fact you can find countless examples by looking at the [complete commit history of this project](https://github.com/aleromano92/aleromano.com/commits/main/)!

I want to highlight a specific example though: the moment when I [added a Github Actions](https://github.com/aleromano92/aleromano.com/commit/0743094e24e40de33eb52561fa18c24fec28bf05) to deploy the site to my Hetzner VPS.

I could have used a commit message like: `added CI/CD using Github Actions`, but instead I chose to use: `i want to deploy by just committing`.

See? Just by reading the commit history, you understand that from this point on I automated the deployment. The how is easy to understand by looking at the `diff`:

![image](../../../assets/blog/git-commits-why/actions.png)

## Conclusion

I think the right way to close this post is with an adapted quote from [Martin Fowler](https://www.martinfowler.com/):

> "Any fool can write commit messages that tell what changed. Good programmers write commit messages that explain why."  
