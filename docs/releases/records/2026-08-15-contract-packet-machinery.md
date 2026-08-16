# 2026-08-15-contract-packet-machinery — Contract packet generator, reconciler and clause benchmark

## Release ID

`2026-08-15-contract-packet-machinery`

## Status

`candidate`

## Plain-English Summary

Source needs realistic contract documents to demonstrate clause extraction against. The obvious way
to get them — write a pile of synthetic agreements — produces a corpus nobody can keep true: the
moment one figure moves, the documents quietly start disagreeing with the data they are supposed to
represent, and a demo built on them is showing extraction from something already wrong.

This ships the machinery instead. Structured contract facts are the source of record; documents are
a rendering of those facts; and two independent gates prove the rendering stayed faithful.

`contract facts → procurement-grade packet → clause extraction → reconciliation proof`

Eight documents per contract are generated: master agreement, order form, statement of work, pricing
exhibit, service level schedule, HIPAA business associate agreement (or a data protection exhibit
where no PHI is involved), amendment and renewal notice, and an invoice and usage evidence packet.

The **reconciler** reads the finished documents back out as text and compares every figure to its
source row. It shares no state with the generator, so it is a real check rather than a restatement.
The **benchmark** answers a different question — not whether the numbers are true, but whether the
document is complete — by scoring each document against the clause topics a procurement or legal
reviewer expects to find. The business associate agreement's clause list is regulatory rather than
stylistic, taken from 45 CFR 164.504(e)(2)(ii)(A)–(J) and (e)(2)(iii).

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only operator tooling plus a staging fixture. It
is not `client-data-lane` — no tenant schema, seed, ingestion, retrieval or private data-plane path
is touched, and the fixture is not registered as a tenant input. It is not `global-control-lane` —
no shared app or control-plane behaviour changes.

- **Layer 1 (client intake):** no change. The fixture under
  `datasets/source/contract-intelligence/_staging-fixture/` is a staging input contract, not tenant
  data, and is not registered in the tenant input registry.
- **Layer 2 (source adapters):** no change.
- **Layer 3 (canonical model):** no change. Nothing is loaded, indexed, or promoted.
- **Layer 4 (products):** no runtime change. Source does not read these scripts; they are operator
  tooling invoked from the command line.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — operator tooling and a staging fixture
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/data/contract-packet/generate-contract-packet.mjs` — renders eight documents per contract
  from the input CSVs.
- `scripts/data/contract-packet/reconcile-contract-packet.mjs` — extracts values back out of the
  rendered documents and reconciles them to the source rows.
- `scripts/data/contract-packet/benchmark-contract-packet.mjs` — scores documents against expected
  clause topics.
- `scripts/data/contract-packet/document-benchmark.json` — the clause benchmark, with citations.
- `scripts/data/contract-packet/README.md` — how the three stages fit together, and the
  delete-and-confirm rule for adding a clause.
- `datasets/source/contract-intelligence/_staging-fixture/` — register, pricing schedule, SLA terms,
  invoice lines, rate card.
- `package.json` — `packet:generate`, `packet:reconcile`, `packet:benchmark`, `packet:check`.
- `.gitignore` — generated packets are regenerable output and are not committed.

## QA / Validation

`npm run packet:check` — 3 contracts, 24 documents. Reconciler 281/281 assertions pass. Benchmark
100% of required clauses across all eight document types, and 100% of expected clauses.

**Both gates were fault-injected before being trusted.** A gate that has never failed is not
evidence of anything.

Reconciler, five injections, all caught with specific messages:

| Injection | Result |
| --- | --- |
| Register annual value changed, documents left unchanged | 3 failures: value, liability cap, pricing-to-register sum |
| Section 5.2 deleted from a master agreement | 2 failures: order form and amendment cite a section that no longer exists |
| A statement of work truncated to 58 words | Failed the length floor |
| A pricing exhibit deleted | 4 failures: every document that references it |
| Synthetic-demo header stripped from a business associate agreement | Failed |

Benchmark: **the first version failed this test, and that is why it is written as it is.** Its
patterns matched bare words, so deleting the entire HHS-access section from a business associate
agreement still scored 100% — "Secretary" survived in a list of defined terms elsewhere in the
document — and deleting an SLA's exclusions section still scored 100%, because "excluded" survived
in an availability formula. A benchmark that passes a document missing the clause it checks for is
worse than no benchmark. Every pattern is now anchored to language only the real obligation would
contain: a section heading, a bolded defined term, or the operative verb phrase. Re-running the same
three deletions against the tightened benchmark fails all three, with the correct clause named.

Closing the benchmark's gaps raised the documents from 63–91% of required clauses to 100%, and
surfaced two real defects in the process:

- Three exhibits carried section references phrased so they read as self-references rather than
  references into the master agreement. Now explicit, and the reconciler checks self-references,
  references into the agreement, and references into named exhibits separately.
- A professional services rate table had been typed into the pricing template rather than read from
  a row — an unsourced figure in a document, which is precisely what the reconciler exists to
  prevent. The rates now live in `contract_rate_card.csv` and reconcile like every other figure.

`node scripts/release-check.mjs --base origin/main --head HEAD` — run locally; this record was added
in response to it.

## Rollout Plan

Merge to main. No runtime rollout: no image build, no ACA deploy, no migration, no feature flag, no
data load. The scripts are invoked manually by an operator.

## Deployment Authority

Not applicable — this release cannot affect Azure Container Apps, runtime images, flags, environment
variables, worker jobs, traffic, or DNS.

- Repo-owned deploy workflow: not invoked
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: no — no product surface changes

## Rollback Plan

Revert the commit. Nothing persists outside the repository: generated packets are gitignored output
and are recreated by `npm run packet:check`. No migration, no loaded data, no runtime state.

## Audit Evidence

- The commit on `feat/contract-packet-generator` and its PR.
- `npm run packet:check` output: 281/281 reconciler assertions, 100% required clauses.
- Fault-injection results for both gates, as tabulated above.
- `scripts/data/contract-packet/document-benchmark.json` carries the reference citations for each
  clause list, with CFR citations on the regulatory ones.

## Known Gaps

- **The generator has not been run against a real tenant register.** It is built and proven against a
  staging fixture on purpose: the healthcare tenant merge is unsettled, and generating final packets
  against an unsettled active root would produce artifacts that have to be thrown away. Pointing
  `--in` at a settled register is a separate, gated step.
- The benchmark's non-regulatory clause lists represent common procurement practice drawn from
  published checklists, not a legal standard. They are a completeness bar for demonstration
  fixtures, and should not be read as advice on what any real agreement requires.
- Documents are Markdown. No PDF or DOCX rendering, and no signature imagery — deliberately, since
  the packets should not be mistakable for executed agreements.
- The clause extraction demonstrated here is regex-based and matches the generator's own phrasing.
  It proves the documents are internally consistent; it is not a general-purpose contract parser and
  should not be presented as one.
