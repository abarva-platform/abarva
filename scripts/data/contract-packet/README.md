# Contract packet machinery

`contract facts → procurement-grade packet → clause extraction → reconciliation proof`

This is deliberately a generator plus two gates, not a folder of hand-written documents. Eighty
standalone synthetic agreements would be eighty things to keep true by hand; the moment one figure
moved, the set would quietly start lying. Here every figure in every document is read from a row,
and two independent checks prove it stayed that way.

```bash
npm run packet:check
```

That runs all three stages against the staging fixture and fails if any of them does.

Once an active tenant has a settled vendor register, generate a client-showable packet set from
that tenant through the tenant fixture adapter:

```bash
npm run packet:check:meridian
```

The adapter reads `datasets/tenant-inputs/active/meridian-health/current/07_vendors_contracts.csv`,
selects the highest-value rows with dates and annual value, and writes a packet fixture under
`.artifacts/contract-packets/meridian-health-fixture/`. It deliberately substitutes invented
supplier legal entities before the legal documents are rendered. The generated packets keep the
tenant's commercial shape — annual value, term, renewal window, risk posture and service category —
but do **not** emit source vendor names into synthetic agreements.

## The three stages

**`generate-contract-packet.mjs`** renders eight documents per contract — master agreement, order
form, statement of work, pricing exhibit, service level schedule, BAA or data protection exhibit,
amendment and renewal notice, and an invoice/usage evidence packet — from the CSVs in the input
directory. Nothing is authored that cannot be traced to a row. Where a document needs a number the
fixture does not carry, the fix is to add it to the fixture, not to type it into the template: an
unsourced figure is exactly what the reconciler exists to catch, and the professional services rate
card was moved into `contract_rate_card.csv` for that reason.

**`reconcile-contract-packet.mjs`** reads the _rendered text_ back out and compares it to the source
rows. It deliberately shares no state with the generator — if it did, the proof would be circular.
It fails when a value disagrees with its row, when the pricing lines do not sum to the register's
annual value, when invoice lines do not match the invoice CSV, when a cross-referenced document does
not exist, when a cited section number is absent from the document it points at, or when a document
falls under its length floor.

**`benchmark-contract-packet.mjs`** scores each document against the clause topics a practitioner
expects to find, defined in `document-benchmark.json`. This answers a different question from the
reconciler: not _are the numbers true_ but _is the document complete_. The BAA clause list is
regulatory — 45 CFR 164.504(e)(2)(ii)(A)–(J) and (e)(2)(iii) — so a gap there is a defective
agreement, not a stylistic one. The rest come from published procurement checklists and represent
common practice. This benchmark covers the eight document types this generator renders. It is not
the Source product's full extraction taxonomy, which currently spans more concepts and document
types than this packet slice.

## Both gates were fault-injected

Neither check was trusted until it had been made to fail on purpose.

The reconciler was proven against five injections: a changed register value, a deleted master
agreement section that other documents cite, a truncated document, a deleted exhibit that four
documents reference, and a stripped synthetic-demo header. All five were caught with specific
messages.

The benchmark's first version **failed this test**, and the failure is the reason it is written the
way it is. Its patterns matched bare words, so deleting the entire HHS-access section from a BAA
still scored 100% — "Secretary" survived in a list of defined terms elsewhere in the document, and
"excluded" survived in an availability formula after the exclusions section was removed. A benchmark
that passes a document missing the clause it is checking for is worse than no benchmark. Every
pattern is now anchored to language only the real obligation would contain: a section heading, a
bolded defined term, or the operative verb phrase.

**When adding a clause to `document-benchmark.json`, delete that section from a generated document
and confirm the benchmark fails before trusting it to pass.**

## Scope and safety

Supplier legal entities in the fixture are invented. No negotiated term, price, or service level is
attributed to a real company, and every generated document carries a header marking it a synthetic
demonstration document and not legal advice. This matters beyond tidiness: executed-looking
agreements naming real vendors, in a public repository, would be a genuine problem regardless of
intent.

The fixture under `datasets/source/contract-intelligence/_staging-fixture/` is a staging input
contract, not tenant data. It exists so the machinery can be built and proven while the healthcare
tenant merge is still unsettled. Running the generator against a settled tenant register is a
separate, gated step — point `--in` at that register once the merge decision lands.

For tenant runs, do not point the document generator directly at a universal tenant CSV directory.
Run `prepare-tenant-contract-fixture.mjs` first. That keeps Layer 1 tenant input separate from the
packet-specific fixture, creates the pricing/SLA/invoice/rate-card rows the documents need, and
prevents recognizable vendor names from being rendered into executed-looking synthetic legal text.
