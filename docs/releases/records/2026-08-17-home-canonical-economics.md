# 2026-08-17-home-canonical-economics — Home economics, and a plausibility gate

## Release ID

`2026-08-17-home-canonical-economics`

## Status

`candidate`

## Plain-English Summary

Home's headline economics were string literals. The model file is 800 lines with zero data calls, and
two of its four anchors — a technology budget of **$2.35B** and a prior-year actual of **$2.18B** —
had no data path behind them.

The obvious fix was to sum `spend_value_fact` and quote that. **That fix is wrong, and building it
is what exposed the real defect.** The two tenants' spend sheets do not share a grain:

- One lists **technology spend by category** and totals **$663M** — against **$81.4B** revenue, which
  is **0.81%**. Airlines run 2–4%. The figure is implausible by roughly a factor of three.
- The other lists **enterprise spend by business function** — facilities, HR, behavioural health —
  and totals **$5.43B** on **$24B** revenue, of which the actual IT line is **$103M**. Quoting that
  total as a technology budget overstates it more than fiftyfold.

Both loaded cleanly. Every layer tied, every record carried evidence, the numbers reached a product.
Nothing asked whether they were *believable*, because correctness had been defined as "what we stored
equals what was supplied" — which was true in both cases.

So this release does two things, and the second matters more than the first:

1. **Home quotes canonical only where canonical can support the claim.** Annual contract value means
   the same thing on every intake, so it is quoted. The spend total is not labelled a technology
   budget by either tenant's data, so that anchor reads "Not established" with the reason.
2. **A plausibility and grain gate**, so this class of defect fails a build instead of rendering.

## Layer Impact

**Release lane: `client-data-lane`.**

- **Layer 3:** unchanged.
- **Layer 4:** the projection carries summed money and value per dimension, each with the count of
  contributing records. Spend and opportunity value are summed separately so they can never be added.
- **Runtime:** Home's contract anchors read canonical; the two unsupported anchors state their gap.

## Client Applicability

- Specific clients: both active tenants
- Feature flag: none

## Changes Included

- `scripts/data-build/refresh-home-landscape.ts` — `MONEY_ATTRIBUTES`, `VALUE_ATTRIBUTES`, `sumAttribute`.
- `src/lib/home/landscape-read-adapter.ts` — exposes `money`, `value`, `byKey`.
- `src/app/(maestro)/home/page.tsx` — `withCanonicalEconomics`.
- `scripts/audit/validate-spend-plausibility.mjs` — the gate.
- `package.json` — `validate:spend-plausibility`, `validate:spend-plausibility:strict`.

## QA / Validation

- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `eslint` — 0 errors.
- Pass: `npm run release:check`.
- Pass: the gate reports all three known defects and names each by kind:

  | Tenant | Kind | Finding |
  | --- | --- | --- |
  | Airline | SCALE | 0.81% of revenue against a 2–5% band |
  | Health system | GRAIN | 13 of 24 categories are business functions, not technology |
  | Retired tenant | SCALE | 12.33% against a 1–10% band |

**The gate is not strict by default.** Both active tenants fail it today, and a gate that fails every
build from the day it lands gets disabled rather than fixed. It reports loudly now and blocks under
`--strict` once the fixtures are corrected, at which point a regression cannot land quietly.

**The gate also found a retired tenant directory still under `datasets/tenant-inputs/active/`.** That
is sunset work, not this release, but it is recorded here because the gate found it.

## Rollout Plan

Merge, deploy, re-run the projector, confirm on the signed-in surface.

## Deployment Authority

Deploys through the repo-owned ACA main deploy workflow; the projection runs as an ACA Job.

## Rollback Plan

Revert. The anchors return to the authored literals and the gate stops running.

## Audit Evidence

- The commit and its PR.
- The gate's JSON report with per-tenant revenue, total, share, and band.
- The projector dry-run with per-dimension totals and contributing counts.

## Known Gaps

- **Both fixtures are still wrong.** The gate names them; correcting the intake is separate work,
  and it is the client's data model to fix rather than something to patch downstream.
- **The intake declares no scope for the spend sheet.** That is the root cause of the grain problem
  and is a template change: the sheet needs to state whether it covers technology spend or enterprise
  spend before any total from it can be labelled.
- **"Prior-year actual" reads "Not established".** Nothing canonical carries an observed prior-year
  figure — every fact is `declared`. It becomes real when telemetry collectors write `observed`.
- **The other ~790 lines of the authored model still render** — architecture exhibits, posture,
  coherence, trajectory, watchlist — labelled "synthetic current-state package".
- The industry bands are wide by design: they exist to catch an order-of-magnitude error, not to
  enforce a benchmark on a client whose spend is genuinely unusual.

## Addendum — fixture fitness gate

The spend gate answers "is this number plausible". It does not answer "is this substrate worth
loading at all", and that turned out to be the larger gap.

`scripts/audit/validate-fixture-fitness.mjs` checks whether a synthetic tenant is credible at its
stated scale: revenue against the locked standard, application/program/infrastructure counts against
their floors, vendor book depth against revenue, contract value distribution, vendor column fill, and
contract document coverage.

It is a **fixture** gate. None of these thresholds should ever be applied to a real client — a real
client's data is whatever their business actually is. Synthetic data has no such excuse: it is
authored, so if it is not credible, that is a choice someone made.

### What it found on the current fixtures

| Tenant | Finding |
| --- | --- |
| Airline | 28 programs (floor 35) · 33 infrastructure platforms for 503 applications · 65 vendor contracts where ~204 is credible for $81.4B · largest contract 8.0% of the book · 3% document coverage |
| Health system | $24B revenue against the $50B standard · 28 programs · 4 vendor columns under 50% filled · 3% document coverage |
| Three retired tenants | Still present under `datasets/tenant-inputs/active/`, with their own volume, column-fill and coverage failures |

The distribution check is the one worth keeping. A register whose largest contract is 8% of the book
has no concentration to find, so it cannot demonstrate renewal leverage, concentration risk, or a
savings case — the three things the product exists to show. That is invisible to every structural
check, because a flat portfolio is perfectly well-formed.

### Why neither gate is strict yet

Every tenant fails today. A gate that fails from the day it lands gets switched off rather than
satisfied. Both report loudly now and block under `--strict` once the fixtures are corrected.

## Correction — the document coverage check was wrong twice

The first version of the fitness gate reported **3% document coverage** and framed it as a major gap.
Both halves of that were wrong.

**The counter was broken.** It matched PDFs in a `documents/` directory only, so it missed the
markdown contract files under `layer_1_client_intake/documents/` and `synthetic/`. There are **41
synthetic contract documents**, not 8. One airline contract alone carries sixteen document types —
MSA, SOW core and transition, base and true-up orders, pricing exhibit, SLA schedule, security DPA,
side letter, two amendments, renewal quote, renewal notice, support policy, exit plan.

**The threshold encoded a premise that does not survive contact with an engagement.** No client hands
over executed agreements for every contract they hold. They hand over the ones in scope — the
largest, the ones renewing, the one being renegotiated. Chasing 25% coverage would have manufactured
around fifty document sets no client would ever produce, making the fixture *less* credible rather
than more.

The check now asks about **depth rather than breadth**: do the documented contracts carry a full file?

| Tenant | Documented contracts | Documents | Verdict |
| --- | --- | --- | --- |
| Airline | 2 | 32 (16 each) | passes |
| Health system | 2 | 6 (3 each) | shallow — agreement, pricing, SLA only |

The remaining work is roughly 26 documents to bring two existing health-system contracts up to the
airline's depth. Not fifty contract sets.

**This is worth recording as a gate-design lesson.** A threshold that measures the wrong quantity does
not fail safe: it generates confident, specific, wrong work. The counter bug made the number five
times too small, and the premise error would have turned that wrong number into fifty files of
fabrication. Neither would have been caught by testing the gate's code, only by asking whether the
thing it measures is the thing that matters.

## Addendum — real contract documents, and a third counting error

The document check was corrected once to measure depth rather than breadth. That correction was also
incomplete: it counted **documents per contract**, not words per document. Sixteen files of
thirty-four lines each passed it.

Those files are clause headings with a one-sentence summary under each. No rate, no notice period, no
obligation — nothing a reviewer could extract or dispute. They pass every structural check and
contain no contract.

The generator built earlier in this work produces real documents, and had only ever been run against
a staging fixture:

| Document | Words | Required clauses |
| --- | --- | --- |
| MSA | 1,246–1,253 | 216/216 |
| BAA | 752–947 | 80–107/107 |
| SOW | 810–813 | 136/136 |
| SLA | 808–809 | 136/136 |
| PRICING | 571–572 | 104/104 |
| ORDER | 482–484 | 104/104 |
| AMEND-001 | 507–508 | 80/80 |
| INVOICE-EVIDENCE | 415–416 | 112/112 |

Both tenants now carry **8 contracts × 8 documents**, median ~750 words, at **784/784 reconciliation
assertions** each — every figure in every document traces to a source row — and a passing clause
benchmark.

Two defects fixed on the way:

- **The contract id prefix was hardcoded** to the tenant the lane was first built for, so every
  tenant afterwards produced contracts labelled `CTR-MH-*`. It now derives from the tenant key.
- **The document walker required "synthetic" in the filename**, so it skipped an entire generated
  packet set that names files by contract and document type.

The short citation-span documents are **kept, not deleted**: they carry `<!-- page:N span:X-Y -->`
markers, feed `scripts/source/load-skyharbor-source-layer-cube-package.mjs`, and exist to test
citation extraction rather than to be read as contracts. The gate now recognises them instead of
demanding their removal — judging them by word count judges them against a purpose they never had.

**Three counting errors in one check, each caught only by asking what the number was for.** Coverage
instead of depth, documents instead of words, filename convention instead of content. None would have
failed a test of the gate's code.

## Correction — the segment model was not implemented

An adversarial review of this work found that the rescale's central claim was false in the code.

`rescale-spend-fixtures.mjs` computed each segment's budget and then **never used it**. It summed
every category weight and divided one pooled total across them. The result:

| Segment | Model declared | CSV actually contained | Delta |
| --- | --- | --- | --- |
| Provider | $750.0M | $451.6M | −39.8% |
| Plan | $210.0M | $151.9M | −27.7% |
| "Shared" — no declared segment, no rate | — | $356.1M | 37.1% of the budget |

The enterprise total was correct, which is exactly why it survived: **the number a reader checks was
right and the model beneath it was not implemented.** Worse, every row carried a `calculation_basis`
string asserting a derivation that did not reproduce its own figure — provenance that lies is worse
than provenance that is absent, because it invites the check it fails.

Three fixes:

- **Weights normalise inside each segment**, so a segment's categories sum to its budget by
  construction. Provider now lands at $750.7M and plan at $210.1M against declared $750M/$210M —
  0.09% and 0.05%, entirely rounding.
- **The "shared" pseudo-segment is gone.** Enterprise platforms are charged to the segment that
  predominantly consumes them, with plan-side infrastructure, data and security as their own lines.
  An unattributed pool is how 37% of the budget escaped the model.
- **`calculation_basis` states the arithmetic that produces the row**, and a category naming a
  segment the model does not define now throws rather than silently falling through.

Two further defects from the same review, also fixed:

- **Row provenance was forged.** The generator spread row 1's `original_row_id`, `original_row_number`
  and `source_fingerprint` across every generated row, so 23 distinct facts claimed one source row and
  one content hash. Ids are now per row and the inherited fingerprint is cleared rather than copied.
- **The savings rule contradicted its own comment.** It claimed to exclude clinical safety systems and
  applied a 6% floor to everything instead, asserting savings against Epic EHR, medical device
  integration, and safety/regulatory systems — while giving integration debt the *highest* rate
  because "legacy" matched, though remediating acquisition debt is internal cost nobody renegotiates.
  There is now a genuine zero-lever bucket: 6 categories for the health system, 2 for the airline.

**What this says about the first release note.** It reported "both now pass the spend plausibility
gate", which was true, and used that to imply the model was sound, which was not. A gate that checks
a total cannot detect a distribution that ignores the model producing it. The check and the claim
were measuring different things, and I did not notice because both came out green.
