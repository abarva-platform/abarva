# Data-Access Adapter — Write-Path Design (Slice 3)

Date: 2026-05-15
Lane: Claude Code (Azure data-access adapter)
Status: design — no code in this slice

## Why this document exists

Slice 1 (PR #2013, merged) introduced a **read-adapter seam**
(`src/lib/data-plane/read-adapters/`) and migrated one cutover-critical
read path. It deliberately stopped at reads.

The remaining Supabase coupling in the API tier is **writes** — uploads,
program advance, artifact generate/promote, gate-criteria state,
source-event approve, the Stripe webhook, admin provision/quarantine.
This document is the design that makes "finish the data-plane migration"
tractable: it answers where writes go during the parallel-run window,
sketches the write-adapter contract, and lays out a slice-by-slice
completion roadmap.

It is design only. No code, no migrations, no production data touched.

---

## 1. The core parallel-run write question

During the parallel-run window, production (Vercel + Supabase) and the
Azure lab (Container Apps + Azure Postgres) run side by side. Reads can
be diffed by the `parallel-run-diff` harness. **Writes need a policy.**
Three options:

| Option | What it means | Cost / risk |
|---|---|---|
| **Write-freeze** | Azure stays read-only; production is the sole writer; Azure is refreshed by copy jobs (`db:azure:copy-tenant-context` and peers). | Simplest. Azure writes are *never exercised* before cutover — the first real write Azure ever takes is in production. |
| **Dual-write** | Every write hits both backends. | Proves Azure writes pre-cutover, but introduces a distributed-commit problem: if Supabase succeeds and Azure fails (or vice versa) the two backends silently diverge. The failure-mode design — reconciliation, partial-failure handling, ordering — is real engineering, not a flag. |
| **Cutover-flip** | Hard switch. Production is canonical and the only writer until the flip; at the flip Azure becomes canonical. No concurrent writers. | No dual-write complexity. The flip is a discrete, scheduled, reversible event rather than a long ambiguous overlap. |

### Recommendation: **Cutover-flip**, with a scoped pre-flip write rehearsal on Azure

**Production stays the sole writer through the entire parallel-run
window. Azure is validated read-only via the diff harness. At a
scheduled flip, Azure becomes canonical in one move; production becomes
the warm rollback target.**

Rationale, against AbarVa's actual reality:

- **Write volume is tiny.** The pilot is ~50 CXOs. Writes are
  human-paced — a program advance, an artifact promotion, an upload.
  There is no throughput argument for dual-write; the thing dual-write
  buys you (proving Azure can absorb production write load) is not a
  risk AbarVa has.
- **Dual-write's failure mode is strictly worse than the problem it
  solves.** A half-applied write across two backends produces silent
  divergence in exactly the substrate the diff harness is meant to
  trust. You would be adding a *new* class of parity bug to a project
  whose entire premise is proving parity. Cutover-flip has one failure
  mode — "the flip went wrong" — and it is observable and reversible.
- **Append-only audit tables make the flip clean.** The SOC2 trail
  (`sensitive_upload_audit`, turn traces, gate-criteria history) is
  append-only — lifecycle is reconstructed by joining on `parent_id`,
  never by mutating prior rows. A consistent copy taken at a quiet
  moment is a faithful snapshot; there is no in-place-update race to
  reconcile. This is the property that makes a copy-then-flip safe.
- **The diff harness already gates the flip.** `parallel-run-diff`
  requires three consecutive green runs ≥60s apart before Azure may
  take traffic. That is the cutover gate. Cutover-flip slots directly
  into it; dual-write would require a *second*, harder harness to diff
  two live writers.
- **Reversibility is already designed in.** The diff protocol states
  cutover is reversible — fall back to the Vercel-prod lane if a
  post-cutover run regresses. Cutover-flip preserves that: production
  is untouched and warm. Dual-write muddies it — after a divergence you
  cannot cleanly say which backend is canonical.

**The one gap cutover-flip leaves** — Azure never takes a real write
before it is canonical — is closed cheaply by a **pre-flip write
rehearsal**: point `ABARVA_DATA_PLANE=azure-postgres` at a *non-pilot
rehearsal tenant* and exercise the migrated write routes end to end.
This proves the write adapters against real Azure Postgres without ever
dual-writing pilot data. It is a test activity, not a parallel-run
mode.

---

## 2. Write-adapter contract sketch

The write seam mirrors the read seam: a contract interface, concrete
adapters, `ABARVA_DATA_PLANE`-driven selection, Supabase as the
implicit default so production behavior is unchanged.

```
src/lib/data-plane/write-adapters/
  types.ts                     — DataPlaneWriteAdapter contract + result shapes
  supabaseWriteAdapter.ts      — DEFAULT; write logic lifted verbatim from routes
  azurePostgresWriteAdapter.ts — Azure lab path, direct `pg` with real transactions
  index.ts                     — selectWriteAdapter() off ABARVA_DATA_PLANE
```

Interface shape (illustrative — **not to be implemented in this slice**):

```ts
export type DataPlane = 'supabase' | 'azure-postgres'; // reused from read seam

/** Outcome of a write — never throws for an expected business rejection. */
export interface WriteResult<T> {
  ok: boolean;
  data?: T;
  /** Stable code: 'idempotent_replay' | 'rls_denied' | 'conflict' | ... */
  reason?: string;
}

/**
 * A unit of work that may span multiple statements. The adapter decides
 * how to honor atomicity: Supabase = an RPC / single-statement-or-RPC;
 * Azure = a real BEGIN/COMMIT transaction.
 */
export interface WriteUnit<T> {
  /** Caller-supplied key; the same key MUST yield the same result. */
  idempotencyKey: string;
  tenantKey: string;       // canonicalized by the adapter, as in the read seam
  actorUserId: string;     // for RLS + the append-only audit row
  run(tx: WriteTx): Promise<T>;
}

export interface DataPlaneWriteAdapter {
  readonly name: DataPlane;
  /** Execute a unit of work atomically with idempotency + audit guarantees. */
  commit<T>(unit: WriteUnit<T>): Promise<WriteResult<T>>;
  /** Append-only audit insert — the SOC2 path; never updates a prior row. */
  appendAudit(entry: AuditEntry): Promise<WriteResult<void>>;
}
```

### Where writes differ hard from reads

The read seam got away with a thin contract because reads are
stateless, retry-safe, and degrade to `0`/`[]`. Writes do not. Four
properties the write contract MUST carry that the read contract did not:

| Concern | Read seam | Write seam — what changes |
|---|---|---|
| **Transactions** | None — independent SELECTs. | Multi-statement writes (e.g. program advance: update phase + insert gate row + insert audit) must be atomic. Azure uses real `BEGIN/COMMIT`; Supabase has no client-side transaction — multi-statement writes must be pushed into a Postgres RPC or restructured to a single statement. **This asymmetry is the contract's hardest constraint** and dictates how routes are sliced. |
| **Append-only audit** | n/a | `quarantine-audit-supabase.ts` is the canonical pattern: release/hard-delete **insert a new row** with `parent_id`, never update the original. The write adapter exposes `appendAudit` as a first-class operation so this pattern survives the migration unchanged on either backend. |
| **RLS** | Reads use the service role and canonicalized tenant keys. | Writes must preserve per-user RLS (Phase 5 shipped 2026-05-07: 6 migrations, per-user policies). The adapter carries `actorUserId` so Azure can set the same session GUC / policy context Supabase RLS enforces — RLS parity is itself a cutover-gate item. |
| **Idempotency** | Inherent — re-reading is free. | A retried POST must not double-apply (double-advance a program, double-promote an artifact, double-charge via the Stripe webhook). Every `WriteUnit` carries an `idempotencyKey`; replay returns the prior result with `reason: 'idempotent_replay'`. The Stripe webhook already needs this — the seam makes it uniform. |

---

## 3. Completion roadmap

Every Supabase-coupled API route (`rg -l "getServerSupabase|createServerClient" src/app/api`,
test files excluded — 35 routes). Read routes finish the Slice-1/2 read
seam; write routes are the new Slice-3+ work.

### Read routes — finish the read seam (Slice 2)

| Route | Verb | Cutover-criticality |
|---|---|---|
| `api/health` | GET | High — diff-harness connectivity probe |
| `api/admin/programs/approvals` | GET | Med |
| `api/debug/tower-substrate` | GET | Low — debug |
| `api/debug/vip` | GET | Low — debug |
| `api/knowledge/chunk` | GET | Med |
| `api/programs/[id]/attachments/[attachmentId]` | GET | Med |
| `api/programs/[id]/deliverables/[deliverableId]/content-export` | GET | Med |
| `api/turn/[turnId]/trace` | GET | Med |

### Write routes — grouped into coherent slices

| Slice | Route(s) | Verb | Criticality |
|---|---|---|---|
| **3a — Programs** | `api/v1/programs` (POST), `api/v1/programs/[programId]/generate`, `api/programs/phase-gate` (POST), `api/v1/artifacts/[artifactId]/promote`, `api/engage/[engagementId]/turn` | POST | High — core Moves workflow; multi-statement (advance + gate + audit) |
| **3b — Source artifacts** | `api/v1/source/events` (POST), `api/v1/source/events/[eventId]/approve`, `api/v1/source/[eventId]/stage`, `api/v1/source/[eventId]/gate-criteria/[criterionId]/state`, `api/v1/source/[eventId]/artifacts/generate`, `.../artifacts/[artifactCode]/generate-from-claude`, `.../artifacts/[artifactCode]/body`, `.../artifacts/[artifactCode]/status`, `api/v1/source/[eventId]/nexus/ask` | POST/PATCH | High — core Source workflow; gate-criteria + approve carry append-only history |
| **3c — Uploads & attachments** | `api/programs/[id]/attachments/upload`, `api/programs/workspace/[moveId]/upload`, `api/tower/upload`, `api/v1/nexus/upload`, `api/v1/source/[eventId]/artifacts/upload`, `api/v1/agent/attachments` (POST), `api/v1/agent/attachments/[id]` (DELETE), `api/v1/threads/[threadId]/attach` | POST/DELETE | Med — DB row + storage blob; the blob client must be unified per the `quarantine-audit` TODO |
| **3d — Admin** | `api/admin/users/provision`, `api/admin/seed-clerk-metadata`, `api/admin/quarantine/[id]/release`, `api/admin/quarantine/[id]/hard-delete` | POST | Med — quarantine is the canonical append-only audit pattern; provision crosses Clerk + DB |
| **3e — Webhooks** | `api/webhooks/stripe` | POST | Low — billing; idempotency-critical (replay must not double-charge); not pilot-blocking |

### Effort estimate

| Slice | Scope | Estimate |
|---|---|---|
| Write seam foundation | `write-adapters/` contract + `selectWriteAdapter` + Supabase default + unit tests | 2–3 d |
| Slice 2 (reads) | 8 read routes onto the existing read seam | 2–3 d |
| Slice 3a (programs) | 5 routes; transaction-boundary design is the hard part | 4–6 d |
| Slice 3b (source) | 9 routes; append-only gate/approve history | 5–7 d |
| Slice 3c (uploads) | 8 routes; requires unified storage-blob client | 4–6 d |
| Slice 3d (admin) | 4 routes; Clerk-crossing + quarantine audit | 3–4 d |
| Slice 3e (webhook) | 1 route; idempotency hardening | 1–2 d |
| Pre-flip write rehearsal | Exercise migrated writes against Azure on a rehearsal tenant | 2–3 d |

Total: roughly **23–34 engineering days** across **8 slices** (write
seam + reads + 3a–3e + rehearsal). This is a program of work, not a
sprint.

---

## 4. The `src/lib` helper question

`rg` reports ~122–126 `src/lib` modules touching Supabase. These are
**not 122 independent migrations.** They are query/repository helpers
(`*/queries.ts`, `*/repository.ts`, server-component data loaders) that
sit *behind* the API routes and product surfaces above.

**Recommendation: migrate `src/lib` helpers transitively, with two
named exceptions.**

- **Default — transitive.** When a route or surface moves onto an
  adapter, its helper moves with it. The helper either receives the
  adapter as an argument or calls `selectReadAdapter` / `selectWriteAdapter`
  itself. No standalone seam, no separate slice — the helper is part of
  whichever route slice owns it. This matches what Slice 1 already
  asserted ("migrating a route typically pulls its helper with it").
- **Exception 1 — shared write helpers need the contract, not their own
  seam.** A helper used by *several* write routes (the program-advance
  state machine, the artifact-promotion helper) should be refactored to
  take a `DataPlaneWriteAdapter` as a parameter so it is plane-agnostic.
  That is the write-seam foundation slice, not a `src/lib` slice.
- **Exception 2 — the append-only audit helper is the pattern, migrate
  it first.** `quarantine-audit-supabase.ts` already implements a clean
  `QuarantineAuditDataSource` contract with a stub sibling. Promote that
  contract into the write seam (`appendAudit`) and add an Azure
  implementation early — it is the template every other audit write
  copies.

A dedicated `src/lib` seam would be over-engineering: most helpers have
exactly one caller-class and inherit that caller's plane for free.

---

## 5. Honest scope statement

**Completing the write-path data-plane migration is a multi-slice
program — eight slices, ~23–34 engineering days — not a one-shot
change.** Anyone reading this should not expect a single PR to "finish
Azure."

The reason is not volume. Mechanically swapping `getServerSupabase()`
for an adapter call across 27 write routes is a few days of edits. The
real work is the **correctness design under the write contract**:

- deciding, route by route, whether a multi-statement write becomes a
  Postgres RPC or is restructured to a single statement, because
  Supabase has no client-side transaction and Azure does;
- preserving per-user RLS parity across two backends whose policy
  enforcement differs;
- making every write idempotent so a retried POST cannot double-apply;
- keeping the append-only audit trail byte-faithful so the SOC2 story
  and the diff harness both still hold.

Cutover-flip (Section 1) is the choice that keeps this tractable: it
removes the dual-write distributed-commit problem entirely, so the
write seam only ever has *one* live writer to reason about. That single
decision is what turns an open-ended consistency-engineering project
into a finite, sliceable roadmap.

---

## Definition of done — this slice

- The parallel-run write question is answered with a recommendation and
  rationale (cutover-flip). ✅
- A `DataPlaneWriteAdapter` contract is sketched, with the four
  hard read/write differences called out. ✅
- Every Supabase-coupled API route is mapped to read/write,
  criticality, and a slice. ✅
- The `src/lib` helper strategy is recommended (transitive). ✅
- Scope is stated honestly as a multi-slice program. ✅
- No code, no migrations, no production data touched. ✅
