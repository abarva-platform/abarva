# Codex Handoff — Source Decision Engine · Slice E

**Vendor response ingestion boundary**

> Read `SOURCE_DECISION_ENGINE_OVERVIEW.md` first. Independent of A–D (can run any time after A).

---

## 0 · Why this slice

The normalization, completeness, and commercial-risk engines exist
(`src/lib/source/proposal-normalization/`, `vendor-response-completeness.ts`,
`commercial-signals.ts`, `commercial-risk-detection.ts`, `pricing-submissions/`) but they are
**not triggered by ingestion** — vendor responses come in via manual upload and the engines must
be run by hand. This slice adds a **clean ingestion boundary**: when a vendor response is
ingested, normalization + completeness + risk detection fire automatically.

**Do NOT build a vendor portal.** Define the contract, wire the existing manual path to the
auto-trigger, and stub the future async/portal path cleanly.

---

## 1 · Build tasks

### 1.1 — Ingestion service contract
New `src/lib/source/vendor-intake/contract.ts`:
- Define `VendorResponseIntake` — the input contract for a vendor response (event id, vendor id,
  files/payload, submitted-at, source = `manual_upload | portal_future`). Validate against the
  **existing** vendor-response types (`vendor-response-types.ts`) and the artifact upload
  contract (`artifact-registry/upload-contract.ts`) — do not invent a parallel schema.
- `ingestVendorResponse(intake)`: persist the response via the existing path, then **trigger**
  the analysis chain.

### 1.2 — Auto-trigger the analysis chain
On successful ingestion, run (best-effort, each wrapped, failures recorded not thrown):
1. `proposal-normalization` → normalized pricing/structure,
2. `vendor-response-completeness` → missing-section flags,
3. `commercial-signals` + `commercial-risk-detection` → outliers / risk flags.
Persist the outputs where the Responses/Evaluation surfaces already read them. Reuse the existing
engines as-is; this slice is **wiring**, not new analysis logic.

### 1.3 — Wire the current manual upload path
Route the existing manual vendor-response upload through `ingestVendorResponse` so today's upload
gains the auto-analysis. Keep the upload UX unchanged; the analysis just now runs automatically and
its results surface on the Responses view.

### 1.4 — Stub the future portal path
Leave a clear, typed stub (`portal_future` source + a documented TODO) for an async vendor-portal
intake. Do not implement it. Document the contract a portal would call.

---

## 2 · Tests
`src/lib/source/__tests__/vendor-intake.test.ts` (mock engines + adapter):
1. `ingestVendorResponse` persists the response and calls all three analysis steps once.
2. A failing analysis step is recorded under failures and does not throw / does not block persistence.
3. The intake contract rejects malformed payloads (schema validation).
4. The `portal_future` stub is typed and documented but inert.

Plus standing validation (OVERVIEW).

---

## 3 · Browser verification (the hard gate)
SkyHarbor Air event in the Responses stage:
1. Upload a vendor response via the existing manual path.
2. Without any extra clicks, confirm **normalization / completeness / risk** results appear on the
   Responses (or Evaluation) view — e.g. a normalized pricing row, a missing-section flag, or a
   commercial-risk signal. Screenshot.
3. Upload a deliberately incomplete response → confirm a completeness gap is flagged.

Label `click-verified` or `code-complete` honestly.

---

## 4 · Out of scope / boundaries
- **No vendor portal.** Contract + stub only.
- Reuse the existing normalization/completeness/risk engines; do not rewrite analysis logic.
- Do not change vendor-facing upload UX beyond surfacing the auto-analysis results.
- Branch: `codex/source-decision-engine-slice-e` ·
  PR title: `Source Decision Engine · Slice E: vendor response ingestion boundary (auto-analysis on intake)`
