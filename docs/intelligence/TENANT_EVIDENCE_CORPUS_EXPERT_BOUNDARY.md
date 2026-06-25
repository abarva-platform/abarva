# Tenant Evidence, Corpus, And Expert Boundary

## Boundary Rules

- Tenant evidence is the only proof for tenant-specific claims.
- Corpus patterns are precedent and comparison, not tenant fact.
- Expert packs are interpretation lenses, not evidence.
- Benchmarks calibrate confidence and ranges; they do not create tenant actuals.
- Missing tenant evidence must be named instead of hidden.

## Required Answer Labels

Intelligence answers should make these boundaries visible in prose:

- what tenant evidence says
- what corpus patterns suggest
- which expert lenses pressure-test the answer
- what options/tradeoffs leadership should consider
- what evidence is still missing

## Failure Conditions

An answer fails if it:

- presents corpus as tenant fact
- presents expert interpretation as proof
- recommends scale/hold/kill without tenant evidence or an explicit caveat
- invents exact ROI, spend, dates, owners, or relationships
- omits missing evidence for a decision question
- leaks raw IDs or cross-tenant context

## Current Implementation

`buildIntelligenceDossier(...)` creates an `evidenceBoundary` with separate arrays for tenant facts, corpus patterns, expert interpretations, benchmark claims, missing tenant evidence, and cannot-conclude statements.
