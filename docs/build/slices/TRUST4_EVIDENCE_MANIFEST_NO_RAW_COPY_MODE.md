# TRUST4 · Evidence Manifest / No-Raw-Copy Mode

Slice ID: TRUST4
Slice name: Evidence Manifest / No-Raw-Copy Mode
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole, Wave3 Lane C in the parallel build pack)

Adds a deterministic evidence manifest read model that defines how a
client supplies evidence to AbarVa **by manifest only** — never by raw
data copy. Each manifest entry names a metric, a labelled string
value, the named source owner (role + system), the bounded date range
the value covers, the verification posture the client and AbarVa
agree on, and a free-form label pointing to where the underlying data
lives on the **client** side. **No DB writes, no migrations, no live
runtime, no audit ledger writes, no model invocation, no Steward
runtime.**

## What changed

- New module
  [src/lib/admin/evidence-manifest-model.ts](../../../src/lib/admin/evidence-manifest-model.ts):
  - Types: `EvidenceManifestEntry`, `EvidenceMetricKind`
    (`'count' | 'rate' | 'currency' | 'duration' | 'percentage' | 'category' | 'narrative'`),
    `EvidenceManifestSourceOwner`, `EvidenceManifestDateRange`,
    `EvidenceManifestSummary`, `EvidenceManifestVerification`
    (`'self_attested' | 'owner_signed' | 'co_signed' | 'audited'`),
    `EvidenceManifestValidation`.
  - Each entry carries: `metric`, `metricKind`, `value` (string only —
    never raw data), `unit?`, `sourceOwner` (named role + named
    system), `dateRange` (bounded ISO YYYY-MM-DD), `verification`,
    `rawDataLocation` (free-form label pointing to client-side
    storage), `rawRetainedByClient: true` (structurally enforced by
    the type).
  - Helpers: `buildEvidenceManifestSeed()`,
    `summarizeEvidenceManifests(entries)`,
    `validateEvidenceManifestEntry(entry)`,
    `getUnverifiedEvidence(entries)`.
  - Re-exports (canonical orderings): `EVIDENCE_METRIC_KINDS_IN_ORDER`,
    `EVIDENCE_VERIFICATION_STATES_IN_ORDER`.
  - createdFrom: `'deterministic_evidence_manifest_seed'`.

- New tests
  [src/__tests__/integration/admin/evidence-manifest-model.test.ts](../../../src/__tests__/integration/admin/evidence-manifest-model.test.ts):
  Deterministic coverage across describe blocks: byte-equal
  determinism (no `Date.now` / `Math.random` / `new Date` / `fetch`);
  every one of the 7 metric kinds and every one of the 4 verification
  states represented in the seed; **every entry has
  `rawRetainedByClient: true`** (test enforced); no actual raw data
  values (regex enforced — no long alphanumeric strings ≥ 32 chars,
  no `https://` / `http://` URLs in any value or rawDataLocation);
  validator accepts the seed and rejects entries with raw payloads,
  inverted ranges, missing source owner, non-canonical kinds /
  verifications, or wrong `createdFrom` markers; summary reconciles
  totals and exposes every canonical bucket;
  `getUnverifiedEvidence` returns only `self_attested` entries and
  preserves input order; module hygiene (no Source UI / Nexus /
  Sentinel / Atlas / Agent runtime imports; no auth / supabase /
  programs mocks; no Anthropic / OpenAI / Pinecone references; no
  embedded URLs anywhere in the source).

## Encoded rules

- **Raw data never crosses the boundary** — manifest entries carry a
  `value` that is a **string-only** label (e.g. `"12,400"`,
  `"USD 4,200,000"`, `"P95 240"`, `"tier_a"`, free narrative). A
  long alphanumeric blob (≥ 32 chars without spaces or punctuation)
  or any embedded `http://` / `https://` URL is rejected by
  `validateEvidenceManifestEntry`.
- **`rawRetainedByClient` is structurally `true`** — the type
  literal allows no other value, and the validator emits
  `raw_retained_by_client_must_be_true` when the field is forced to
  any other shape.
- **`rawDataLocation` is a label, not a connection** — it documents
  where the raw data sits on the client side (e.g.
  `"Client-side · Genesys reporting warehouse · Q1 slice"`). URLs
  are rejected.
- **Source owner is always named** — both `ownerRole` (e.g. "VP of
  Customer Care") and `sourceSystem` (e.g. "Genesys CCaaS reporting
  warehouse") are required and non-empty.
- **Date range is always bounded** — start and end are ISO
  `YYYY-MM-DD` strings, with `start <= end`. Open-ended ranges and
  inverted ranges are rejected.
- **Verification is one of four canonical postures** —
  `self_attested` (single named owner), `owner_signed` (signed by
  named owner), `co_signed` (owner plus a second named reviewer),
  `audited` (internal or external audit). `getUnverifiedEvidence`
  surfaces the `self_attested` subset for follow-up.
- **`createdFrom: 'deterministic_evidence_manifest_seed'`** appears
  on every seed entry and is verified by the validator.

## What is deterministic today

- `buildEvidenceManifestSeed()` is byte-equal across repeated calls
  (`JSON.stringify` equality enforced).
- `summarizeEvidenceManifests(entries)` reconciles `total` with the
  input length and exposes `byMetricKind` / `byVerification`
  buckets covering every canonical key.
- `validateEvidenceManifestEntry(entry)` returns the same decision
  for the same input every call.
- `getUnverifiedEvidence(entries)` is a pure filter that preserves
  input ordering.

## What is NOT yet live

- No live enforcement — the manifest is a read model that the future
  Steward UI, runtime tool dispatcher, and Model Gateway will
  consult before citing client evidence.
- No DB persistence — manifest entries, signatures, and verification
  state are not written anywhere.
- No audit ledger writes — TOOL3's audit shape is not invoked here.
- No model invocation, no live retrieval, no client-side connector,
  no upload / signature ceremony, no IdP federation.
- No UI surface — Steward Setup mounts will land in a follow-up
  TRUST slice once TRUST4 is reconciled.

## Honest fallbacks used

- The seed is anchored on the canonical Apex Retail contact-center
  AI use case (`anchorKey: 'apex-contact-center-ai'`) so the
  manifest concept can be demonstrated without inventing a new
  client; the entries are illustrative only and remain free of any
  raw payload.
- Module imports nothing from Source UI, Nexus / Sentinel / Atlas /
  Agent runtime, legacy `/programs`, mock.ts, auth, or Supabase
  (test enforced).
- Source contains zero embedded URLs (test enforced).

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/admin/evidence-manifest-model.test.ts`
- `npx eslint src/lib/admin/evidence-manifest-model.ts src/__tests__/integration/admin/evidence-manifest-model.test.ts --max-warnings=0`

## Status

Code complete. Pending founder review.
