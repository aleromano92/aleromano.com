---
title: YAGNI for Business
description: YAGNI stands for "You Ain't Gonna Need It". It's a principle of Extreme Programming (XP) that suggests not implementing a feature until it is necessary. It is an essential tool to avoid waste of time and resources that can be applied even in domains different than Software Development.
pubDate: 2023-05-31
author: Alessandro Romano
tags: ["Productivity","Inspiration"]
language: en
image:
  url: /src/assets/blog/yagni-for-business/featured.jpg
  alt: Deep space image
---

## Is YAGNI related to Waterfall and Agile? 🌊🏃🏻


> ⚠️ I won't advocate for which approach is better, I strongly believe every company should apply a process that suits its nature.

When developing a new product, it's essential to prioritize the features that customers need. This means that companies should develop only the features that are necessary to meet their customers' needs. By doing so, companies can save time and resources in the development process.

The **YAGNI** principle can also be applied to business processes. Companies should avoid implementing processes that are not necessary. This means that companies should only implement processes that are essential to their business operations. By doing so, companies can save time and resources and focus on the processes that are essential to their business operations.

A **waterfall** approach usually works on the opposite: first, you need to gather ALL the requirements, use cases and corner cases and design (or define) a process before anything is implemented.

## Example

Consider you want to build a form to collect phone numbers for an alerting system and there is a Pay-per-use billing behind every notification.

There are things you should define from the beginning, like making sure you are compliant with GDPR in EU countries and that you have a monitoring system to justify the invoices. But instead of focusing on all those things in the beginning, you can choose an MVP where:

-   the country is not in the EU so GDPR does not apply (reduce _compliance activities_)
-   the country is not so big, so you won't have billion of records from day one (reduce _technology constraints_)
-   the country has a simple fiscal system to apply VAT on invoices (reduce _processes burden_)

You launch the form in the chosen country in a relatively small time and monitor how it is going: it may happen that the revenues you obtain from this MVP are already aligned to your plan.

This is **Agile**, this is **Lean**, you ain't gonna need GDPR compliance nor increase your Disk Storage nor study complicated fiscal systems. If you have planned from them since the beginning, _the market had already changed_ and you would still be stuck building the first release.

## The Dark Side of YAGNI

There are **risks** to using YAGNI without asking yourself questions. First, there are [2 types of decisions you can take](https://www.businessinsider.com/jeff-bezos-on-type-1-and-type-2-decisions-2016-4?r=US&IR=T):

1.  Type 1 decisions, the not reversible one
2.  Type 2 decisions, from where you can always go back

On Type 1 problems, not thinking about the future and the consequences may make you incur sunk costs later on in refactoring costs. So, while you may still not define and plan anything in advance, you must stress your decision by asking yourself things like:

-   what would I do if I later need to support GDPR-relevant countries?
-   what if the volume hits so hard that our storage crashes? or our storage costs increase exponentially?
-   how would I make sure the feature I build supports a country where the percentage of VAT is higher than the country I'm launching in?

While you are not **************solving************** these problems right now, you need to think of a way of doing them later and be **********aware********** on the risks and the shortcuts you are taking.

## Conclusion

> Prepare for the future, build the present.🚀

DAJE!