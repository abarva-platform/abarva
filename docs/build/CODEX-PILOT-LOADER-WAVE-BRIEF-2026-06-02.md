# Codex Execution Brief — Pilot-Ready Data Loader (Wave PL)

**Status:** build-ready · **Date:** 2026-06-02 · **Mode:** Codex fully autonomous · multi-agent · self-merge · self-deploy
**Authority:** Anand, pre-approved for PR + merge + deploy of code-lane PRs.
**Goal in one sentence:** Turn the Setup data loader into a solid, governed, multi-format, bulk-capable, fully-instrumented capability so that next week we can **erase and reload ALL context data for ALL clients (Apex, Meridian, SkyHarbor) from scratch through the UI**, with per-upload consent attestation, automatic PHI/PII quarantine, and an in-app notification + email + immutable audit-log entry on every meaningful event — with all required Azure services wired in the background.

---

## 0 · Ground truth (read before writing code — this is what already exists on `main`)

Do NOT rebuild these. Extend them.

- **Setup landing:** `/admin/setup` → `src/components/admin/SetupDataLoadCenter.tsx` (calm Studio, shipped). "Start a governed load" → `/admin/context-layer/uploads`.
- **Upload surface:** `src/app/(maestro)/admin/context-layer/uploads/page.tsx` mounts `src/components/admin/context-layer/CsvUploadConnector.tsx` (real client component, **CSV-only**, has a checkbox that is NOT recorded).
- **Upload API:** `src/app/api/admin/context-layer/csv-upload/route.ts` — real `multipart/form-data` handler; enforces cross-tenant 403, requires `tenant_key`, requires `.csv`; calls `evaluateSensitiveUpload`; persists via `src/lib/context-ingestion/csv-upload-connector`.
- **Sensitive guard:** `src/lib/security/sensitive-upload-guard.ts` — REAL detection (SSN/MRN/email/phone), returns `decision: 'quarantine' | 'allow'`. **It is pure** — it does NOT notify, email, or log. `sensitiveUploadRejectedResponse` just returns an HTTP 4xx.
- **Durable ledger + quarantine audit (EXIST, NOT WIRED into the upload route):**
  - `supabase/migrations/20260601090000_pilot_ingestion_load_ledger.sql`
  - `src/lib/admin/pilot-ingestion-ledger.ts`
  - `src/lib/security/quarantine-audit-data-plane.ts`, `quarantine-audit-supabase.ts`
  - `src/lib/admin/pilot-data-plane-security-policy.ts`
- **Notification + email infrastructure (EXISTS from Wave 4, NOT called by ingestion):** `src/lib/notifications/registry.ts`, `module-producers.ts`, the Resend client, the dispatch cron, the TSX email templates, the bounce/complaint webhook.
- **Read model the Studio + Home already bind to:** `getSetupInventorySnapshot` (`src/lib/admin/setup-data-broker.ts`), `composeDataTrustBlocks`, `getCapabilityGrounding`. The loader must update the substrate these read so Home/Data-Trust/Studio reflect the load immediately.
- **SkyHarbor substrate scripts:** `scripts/skyharbor/generate-skyharbor-substrate.mjs`, `verify-skyharbor-substrate.mjs`. There is currently **no confirmed erase script**.
- **Templates:** registry + `/admin/context-layer/templates`; `/public/setup-templates`. The 18 dimensions + accepted formats are defined in `docs/build/PILOT_DATA_LOAD_STUDIO_DESIGN_SPEC_2026-06-01.md` §"Dimension And Format Matrix".

---

## 0.5 · Excel backlog traceability (T341–T352 — every P0 row must close)

This wave IS the execution of the 12 P0 rows `T341–T352` in the Excel Private Data Plane tracker (all currently "Not started"). Every PL agent below is tagged with the T-ID(s) it closes. No T-row may be left open at wave end; the QA evidence report (PL-QA) must show each T-ID green.

| Excel ID | Deliverable | Closed by | Notes |
|---|---|---|---|
| **T341** | Pilot private data-plane test env (SSO → Azure storage → Postgres isolation → queue → audit → admin access) | **PL-0 (cross-cutting track)** | Runs across the WHOLE wave as the real environment, NOT a standalone doc. Provisions/validates the live (or stub) path end to end. |
| **T342** | Setup Data Load Center (upload/templates/consent/quarantine/processing/clarification/history hub) | shipped (calm Studio) + extended by PL-1/3/4/5/6 | The hub already exists; this wave fills its real workflow. |
| **T343** | Template explorer (all onboarding templates by dimension, fields, owner, cadence, unlocked surfaces) | **PL-6** | Surface exists at `/admin/context-layer/templates`; make it the canonical dimension×fields×owner×cadence×unlocks explorer the spec describes. |
| **T344** | Upload by dimension → Azure Blob with metadata/hash/path | **PL-3** | Client/dimension-pinned landing-zone keys. |
| **T345** | PHI/PII/payment/MRN/DOB quarantine before indexing | **PL-4** | Extend `evaluateSensitiveUpload` detectors to payment-card + DOB; route to review. |
| **T346** | Permission/disclaimer gate (authority, classification, permitted use, restricted-data rules) | **PL-1** | Recorded attestation, server-enforced. |
| **T347** | Click-to-start processing via landing-zone message | **PL-3** | Azure Queue / Event Grid / Service Bus message kicks the parse/orchestration. |
| **T348** | Schema anomaly clarification (unknown cols / missing fields / invalid enums pause + ask admin to map) | **PL-6** | 🔴 New — clarification queue that pauses a run and requests operator mapping. |
| **T349** | Processing ledger (status, stages, timestamps, errors, retry/replay, email + in-app notifications) | **PL-4 + PL-5** | Ledger migration exists; wire stages + retry/replay + the notify/email fan-out. |
| **T350** | Approved data commit → client-scoped Postgres/context/search with provenance | **PL-5** | Batch commit incl. the **search index** target, not just Postgres. |
| **T351** | Outputs/deliverables explorer (one admin view across Moves + Source outputs, status/owner/evidence/approval) | **PL-7** | 🔴 New — cross-module outputs explorer. |
| **T352** | End-to-end smoke (SSO → upload → quarantine/parse → clarify → load → grounded output) | **PL-QA** | The full pilot gate, all 3 clients. |

**Excel execution order honored:** (1) T342/T343/T346 → PL-1 + PL-6 shell/explorer/attestation · (2) T344/T345/T349 → PL-3 + PL-4 + PL-5 upload/quarantine/ledger · (3) T347/T348/T350 → PL-3 + PL-6 + PL-5 processing/clarify/commit · (4) T351/T352 → PL-7 + PL-QA outputs + smoke. **T341 (PL-0) runs across the whole wave.**

---

## 0.6 · Open decisions to settle BEFORE full `live` execution (from the Excel "key gaps")

Codex must build to interfaces and ship fail-closed stubs where these are unresolved, and the release records must list each one with the exact env key / config needed to flip to `live`. Surface any blocker to the task list rather than guessing:

1. **Target Azure subscription / environment** — which sub + resource group for Blob, Queue/Event Grid/Service Bus, Defender. (PL-0/T341)
2. **SSO / Clerk org config** — which Clerk org + role mapping gates the pilot test env. (PL-0/T341)
3. **Exact data templates by dimension** — confirm the format each dimension's template emits per client (drives PL-3 parser scope). Codex detects from the template registry and flags in the PL-3 PR.
4. **Queue technology** — Azure Queue Storage vs Event Grid vs Service Bus vs Vercel Queues for the landing-zone message (T347). Pick one; document why.
5. **Commit targets** — which Postgres tables + which search index receive approved data (T350).
6. **Notification config** — Resend from-address, recipient resolution (dimension owner lookup), in-app channel defaults.
7. **Live-data policy / attestation copy + sign-off** — WHO signs off on the legal attestation text and the restricted-data policy wording (T346). This is a human approval, not a code task — Codex ships placeholder copy clearly marked `PENDING LEGAL SIGN-OFF` and blocks `live` on it.

---

## 1 · Authority + guardrails (apply to EVERY PR)

- **Self-merge** when the per-PR gate (below) is green. Admin-merge OK only for pre-existing failures (the 2 known `admin7-visual-lock` hex/font drifts; ESLint `@supabase/supabase-js` seed violations; static Routes & Disclaimers).
- **Self-deploy** to Vercel prod on merge.
- **Azure/Postgres vocabulary only** in new runtime code; `clients` / `client_id` (not `tenants` / `tenant_id`) except in legacy shims/migrations.
- **Broker boundary:** app surfaces never import `src/lib/admin/broker/**` internals directly; go through the contract functions.
- **Reversible-down migrations** for every schema change.
- **No competing consulting firms named** anywhere.
- **Design-system fidelity:** locked cream/serif/black-ghost palette; real empty/loading/error/permission states; no raw IDs or engineering labels in operator-facing text.
- **Secrets via env only** — never hardcode Azure keys, Resend keys, connection strings. Read from env; document required keys in the release record (names only).
- **Release record** per PR under `docs/releases/records/` (lane: `client-data-lane` for ingestion/data paths, `global-control-lane` for shared UI). `npm run release:check` must pass.
- **3-attempt rule:** if a fix loops 3× without converging, write the blocker to the task list and stop.
- **Tenant isolation is sacred:** every new read/write is `client_id`-scoped; no upload, parse, quarantine case, notification, email, audit row, or commit may ever cross a client boundary. This is the #1 acceptance criterion on every PR.

---

## 2 · Required Azure (and adjacent) services to wire

Wire these in the background; degrade gracefully + log structured warnings if a key is absent (never silently no-op a security control).

| Capability | Service | Env keys (names only) | Used by |
|---|---|---|---|
| Private landing-zone object storage | **Azure Blob Storage** (private container, per-client key prefix) | `AZURE_BLOB_CONNECTION_STRING`, `AZURE_BLOB_LANDING_CONTAINER` | PL-3 upload, PL-1 file manifest/hash |
| Malware / virus scan before parse | **Azure Defender for Storage** scan result (or a scan-on-upload hook); if unavailable, a documented scanner-contract stub that fails-closed | `AZURE_DEFENDER_SCAN_MODE` (`live`\|`stub`) | PL-2 scan gate |
| Async processing / decoupling | **Azure Queue Storage** or **Vercel Queues** for the bulk loader fan-out | `AZURE_QUEUE_CONNECTION_STRING` or Vercel Queue binding | PL-3 bulk runner |
| Relational substrate | **Azure Postgres** (existing data plane) | `DATABASE_URL` | all |
| Transactional email | **Resend** (existing client) | `RESEND_API_KEY`, `RESEND_FROM` | PL-2 email fan-out |
| In-app notifications | existing Wave-4 notifications tables + dispatch cron | (existing) | PL-2 notify fan-out |

If a real Azure subscription/keys are not yet provisioned, build to the **adapter interface** with a `live`/`stub` switch (env-gated), ship the stub fail-closed, and the release record must list exactly which env keys Anand must set to flip each to `live`. Never let a missing key turn a security gate into a pass.

---

## 3 · The wave — parallelize by phase, each agent owns one PR

Run phases A→D as a pipeline. Within a phase, agents run in parallel in **separate worktrees** (`isolation: worktree`). Each feature PR carries its tests; one dedicated **QA agent** runs across the whole wave. **Agent PL-0 runs across ALL phases** as the test-environment track.

### PHASE 0 (cross-cutting, runs the whole wave) — Pilot private data-plane test env · **T341**

**Agent PL-0 · Pilot test environment (does not block phases; provisions + continuously validates the real path)**
- Branch `feat/loader-pilot-test-env`.
- Stand up + validate the end-to-end path the Excel T341 names: **SSO (Clerk org/role) → Azure Blob storage → Postgres/data-plane isolation → queue → audit → admin access**. Build it as an env-gated `live`/`stub` harness so the rest of the wave can integrate against it immediately.
- Deliverables: a `scripts/pilot-env/verify-data-plane.mjs` that asserts each hop is reachable + isolated per client, emits a green/red matrix, and is safe to re-run; an `.env` key manifest (names only) for every Azure/SSO/queue/notification dependency; structured fail-closed behavior when a key is absent.
- This is the connective tissue for PL-3/4/5/QA — they wire INTO the adapters PL-0 defines, so there is one canonical Azure/queue/audit interface, not five.
- DoD: `verify-data-plane.mjs` runs green (live where keys exist, stub-fail-closed where they don't) for all 3 clients; the env manifest is complete; the release record lists exactly which keys flip each hop to `live`.

### PHASE A — Foundations (parallel)

**Agent PL-1 · Consent + attestation ledger**
- Branch `feat/loader-consent-ledger`.
- Migration: `consent_attestations` table (`id, client_id, actor_user_id, policy_version, file_hash, attested_at, attestation_text`), reversible-down, `client_id`-scoped RLS.
- `src/lib/admin/consent-ledger.ts` — `recordConsent()` + `hasValidConsentForBatch()`.
- Turn the `CsvUploadConnector` checkbox into a real attestation: text states "I confirm I am authorized to load this file and it follows the client data-use policy; I am not knowingly loading PHI/PII." Capture actor + timestamp + policy version + file hash. **Block the upload server-side if no valid attestation is present** (not just client-side).
- DoD: no file is processed without a recorded attestation row; attestation is queryable for audit.

**Agent PL-2 · Erase + reload tooling (all clients)**
- Branch `feat/loader-erase-reload`.
- `scripts/context-layer/erase-client-context.mjs <clientKey>` — idempotent wipe of context chunks + segments + ingestion ledger + quarantine cases for ONE client, with a `--dry-run` that prints exact row counts per table before deleting, and a typed confirmation guard. Tenant-scoped — cannot wipe more than the named client.
- `scripts/context-layer/reload-client-context.mjs <clientKey>` — regenerate synthetic from the real templates and load through the production upload pipeline (PL-3 API), not a backdoor insert, so the reload exercises the same gates a pilot operator would.
- Generalize the existing SkyHarbor generator pattern to all three clients (Apex, Meridian, SkyHarbor) reading each client's template/dimension manifest.
- DoD: `erase --dry-run` shows counts; `erase` zeroes the client; `reload` repopulates via the real API; verify script asserts row counts + tenant isolation. Runnable for all 3 clients.

### PHASE B — Governed pipeline (parallel, depends on A)

**Agent PL-3 · Multi-format upload + Azure landing zone + bulk runner**
- Branch `feat/loader-multiformat-bulk`.
- Generalize the CSV-only route into `/api/admin/context-layer/upload` accepting the formats the templates emit: **CSV, XLSX, JSON, JSONL, PDF, DOCX, PPTX, Markdown** (+ ZIP of these). Reuse existing format parsers where they exist (`src/lib/exports-shared`, artifact-registry parsers); add adapters where missing.
- Wire **Azure Blob** private landing zone: every file lands in a per-client-prefixed private container with a content hash + manifest BEFORE parsing.
- **Bulk runner:** a "Load all dimensions for this client" action on the Studio that enqueues each file (Azure Queue / Vercel Queue), shows per-file progress, and reports per-file outcome (committed / quarantined / failed). One click = full client load.
- Keep the existing cross-tenant 403 + tenant_key enforcement; extend to every format.
- DoD: all listed formats upload + parse + land in Blob; bulk runner loads a full client in one action with per-file status; CSV path stays green.

**Agent PL-6 · Template explorer + schema-anomaly clarification queue · T343 + T348**
- Branch `feat/loader-templates-clarify`.
- **T343 — Template explorer:** make `/admin/context-layer/templates` the canonical view of every onboarding template by **dimension · required fields · owner · cadence · surfaces unlocked**, bound to the template registry (not a static list), client-aware. Calm design-system layout.
- **T348 — Schema anomaly clarification:** during parse/validate, when a file has unknown columns, missing required fields, or invalid enum values, **pause the run** and create a clarification case that asks the operator to map/clarify (map unknown column → template field, supply a missing required value, accept/reject an enum). Resolution is recorded to the load ledger; the run resumes only after the operator resolves. Block commit while any clarification is open.
- DoD: the explorer renders all dimensions×fields×owner×cadence×unlocks for the active client; a file with a deliberately unknown column pauses the run, surfaces a clarification, and only proceeds after the operator maps it — captured in the ledger + audit.

**Agent PL-4 · Scan + quarantine → notify + email + audit fan-out · T345 + T347 + T349**
- Branch `feat/loader-quarantine-fanout`.
- Insert the **malware scan gate** (Azure Defender adapter, `live`/`stub`, fail-closed) between landing and parse.
- On `evaluateSensitiveUpload` → `quarantine` OR malware hit: (1) write a durable **quarantine case** (use `quarantine-audit-data-plane.ts` + the ledger migration), (2) emit the Wave-4 **in-app notification** (new `source`/`ingestion` event types in the registry), (3) send the **Resend email** to the dimension owner + uploader (new TSX template), (4) write an immutable **`admin_audit_log`** row (category `ingestion`, 2555-day retention). Same fan-out (minus the block) on successful commit and on rollback.
- DoD: uploading a file containing a synthetic SSN produces — visibly — a blocked upload + a quarantine case row + an in-app notification + an email (captured in test via Resend mock) + an audit row, all `client_id`-scoped. Nothing happens silently.

### PHASE C — Commit, rollback, observability (depends on B)

**Agent PL-5 · Batch commit + rollback + Studio/Home reflection · T350**
- Branch `feat/loader-commit-rollback`.
- Each load = a batch with id, template version, file manifest, validation result, consent id, commit id, idempotency key. Commit writes to the **client-scoped Postgres context + the search index** (T350 requires both, with provenance), and updates the substrate the read model (`getSetupInventorySnapshot`) reads, so Home / Data-Trust / Studio reflect the new load immediately.
- Batch-scoped **rollback/unload** path that removes the batch's context facts + evidence + search entries while retaining audit history.
- DoD: a committed batch shows up on Data-Trust within one refresh AND is retrievable by a grounded assistant query (provenance attached); rollback removes exactly that batch's data + search entries and leaves the audit trail intact.

**Agent PL-7 · Outputs / deliverables explorer · T351**
- Branch `feat/loader-outputs-explorer`.
- One admin view spanning **Moves + Source outputs**: each row = output title, source module, status, owner, evidence link, approval state. Client-scoped; reuses existing Moves/Source read models (do not duplicate them — import the contract functions).
- Route under the admin shell, calm design-system layout, real empty/loading/error/permission states.
- DoD: an admin sees every Moves + Source deliverable for the active client in one place with accurate status/owner/evidence/approval; zero cross-client rows; no raw IDs.

### PHASE D — Proof + gate (depends on C)

**Agent PL-QA · Dedicated QA + the all-client clean-load proof (writes NO feature code)**
- Branch `test/loader-pilot-qa`.
- Contract tests for every new boundary (consent, blob landing, scan, quarantine, commit, rollback APIs).
- **Tenant-isolation E2E for Apex, Meridian, SkyHarbor:** none can see, upload into, quarantine into, or commit into another's data.
- **The dress rehearsal (DL-12, all clients):** for each of the 3 clients — erase → regenerate synthetic from real templates → bulk-load through the real API → assert every expected dimension committed, every event produced a notification + email + audit row, every quarantine fired correctly on a planted PHI fixture, and zero cross-client leakage.
- Negative tests: planted SSN/MRN/email files MUST quarantine + fan out; missing-consent upload MUST block; cross-tenant upload MUST 403; missing Azure key MUST fail-closed (not pass).
- Produce `docs/build/PILOT-LOADER-QA-EVIDENCE-2026-06-XX.md`: coverage, the 3-client clean-load run log, the notify/email/audit evidence per event type, the isolation matrix, and a go/no-go memo.
- DoD: the evidence report proves all three clients can be erased and fully reloaded through the UI/API with the complete governance fan-out, isolation intact.

---

## 4 · Per-PR merge gate (every agent, every PR)

Green before self-merge:
- L1 unit ≥90% on new pure logic · L2 integration · L3 contract · L4 tenant-isolation E2E (Apex/Meridian/SkyHarbor) · L5 the relevant negative-path tests (planted PHI quarantines + fans out; missing consent blocks; cross-tenant 403; missing-key fail-closed).
- `npx tsc --noEmit` clean · `npx eslint src/` clean (allowing only the documented pre-existing failures).
- Wave 0 harnesses no-regression.
- Release record present (correct lane, env keys listed, rollback path).
- Reversible-down migration if schema changed.
- Post-deploy crawl completes (allow the known authenticated-crawl behavior).

## 5 · Wave-level definition of done (the thing Anand tests next week)

- From `/admin/setup`, an authenticated operator can, **for any of the 3 clients**: start a governed load, give a recorded consent attestation, upload any supported format (or bulk-load all dimensions in one click), watch real-time per-file status, see a planted PHI file auto-quarantine with an in-app message + email + audit row, commit the clean files, and roll back a bad batch.
- The erase + reload scripts let Anand wipe and fully repopulate **all three clients from scratch** through the real pipeline.
- Home / Data-Trust / Studio immediately reflect each client's real loaded substrate (no mock numbers).
- Every Azure service is wired with a `live`/`stub` switch; the release records list exactly which env keys to set for full `live` operation.
- The QA evidence report proves it end-to-end for Apex, Meridian, and SkyHarbor.

---

## 6 · Kickoff line for Codex (paste this)

> Read `docs/build/CODEX-PILOT-LOADER-WAVE-BRIEF-2026-06-02.md` and execute Wave PL autonomously. This wave closes the 12 Excel P0 rows T341–T352 (traceability in §0.5 — every T-ID must end green in the PL-QA evidence report). Run PL-0 (T341 test env) as a cross-cutting track across the whole wave, then phases A→D as a pipeline with agents in parallel using isolation: worktree, plus one dedicated QA agent. First read the §0 ground-truth files so you extend the existing CSV route / sensitive guard / ingestion ledger / Wave-4 notification + Resend brokers rather than rebuilding them. Wire the Azure services in §2 with a live/stub env switch (fail-closed on missing keys); for every unresolved §0.6 decision, build to the interface, ship the fail-closed stub, and list the exact env key/config to flip to live in the release record. Enforce the §1 guardrails and the §4 per-PR gate on every PR; self-merge + self-deploy when green. Agents: PL-0 (test env, T341) · PL-1 (consent, T346) · PL-2 (erase+reload all clients) · PL-3 (multi-format+Blob+bulk, T344/T347) · PL-4 (scan+quarantine+notify/email/audit fan-out, T345/T349) · PL-5 (commit+rollback to Postgres+search, T350) · PL-6 (template explorer + schema clarification, T343/T348) · PL-7 (outputs explorer, T351) · PL-QA (smoke + 3-client proof, T352). The wave is done when §5 holds, every T341–T352 row is green, and the QA evidence report proves all three clients can be erased and fully reloaded through the real UI/API with consent attestation, auto PHI/PII quarantine, schema clarification, approved commit, outputs explorer, and in-app + email + audit fan-out on every event, tenant isolation intact. Notify on completion of each phase.

---

## 7 · The one input Codex needs from Anand before/at kickoff

- **Format truth:** confirm which formats the regenerated synthetic templates actually emit per client. If all-CSV, PL-3's parser work shrinks to the bulk runner; if mixed, PL-3 builds the full parser set. (Codex should detect this from the template registry and proceed, but flag it in the PL-3 PR.)
- **Azure provisioning:** whether real Azure Blob / Defender / Queue keys exist yet. If not, Codex ships the stub-fail-closed adapters and the release record tells Anand which keys to set to go `live`. This is the only thing that gates true production operation vs. verified-stub operation.
