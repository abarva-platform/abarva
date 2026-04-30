# PROD-WALK · Context Assembled Panel + 4-Mode Toggle

**Date:** 2026-04-30
**Subject of walk:** CB-6 (PR #1275) shipped end-to-end Context Assembled panel + 4-mode toggle on `/programs/<id>`. Plus the two-source broker (TD-5), Pinecone vector retrieval (CB-3, gated on `PINECONE_API_KEY`), and OpenAI embeddings (CB-2).
**Reviewer:** Code walk only (read-only, no browser, no dev server).
**Branch read:** `main` @ `f782a317` (CB-6 merge SHA).

---

## 1. Walk scope

Inspected:

- `src/app/programs/[id]/page.tsx` server entrypoint and `ProgramDetailPage` render tree.
- `AppShell` → `AtlasPageStateProvider` → `AtlasDrawer` (embedded mode) → `AgentCanvas` → `NexusReactivePanel` mount path.
- `AtlasChatOverlay` (the component that actually contains `ContextAssembledPanel` + `ModeToggle`).
- `/api/chat/agent` route: bundle assembly, mode resolution, artifact emission ordering.
- `src/lib/knowledge/context-broker/{broker,types,mode-inference,index}.ts`.
- Artifact parser `src/lib/agent/artifacts.ts` `context-bundle` branch.
- `src/lib/shell/context-mode-storage.ts` and `AtlasPageStateProvider.tsx` hydration.
- Two ContextAssembledPanel files: `src/components/context/` (legacy) vs `src/components/context-broker/` (canonical).
- TD-4 / TD-5 record kinds (`kpi_metric`, `cross_program_signal`) and how the panel renders them.

NOT inspected (out of scope for a code walk):

- Live browser render — no dev server was started.
- Real Pinecone path — `PINECONE_API_KEY` is not set in any env we can reach.
- PostHog event delivery — only static reachability of telemetry call sites.
- Database fixtures (`data_inventory_records`) directly via SQL.

---

## 2. Findings

### 2.1 — Working

- 🟢 **Server bundle assembly is correctly wired in `/api/chat/agent`.** `assembleContextBundleArtifact()` runs before `runToolUseLoop`, the bundle is the FIRST chunk written to the stream, and it is emitted as `[[artifact:context-bundle]]<JSON>[[/artifact]]` so the client-side parser catches it before any text deltas. (`src/app/api/chat/agent/route.ts:599-642`.)
- 🟢 **Artifact parser knows `context-bundle`.** Type union, parse case, and `isKnownArtifactType()` all include it. (`src/lib/agent/artifacts.ts:97, 549, 1111`.)
- 🟢 **`AtlasPageStateProvider` intercepts the `context-bundle` artifact** before fan-out and stores it on `latestContextBundle`, clears `isAssemblingContextBundle`, and does NOT forward it to `onArtifact` (so the reactive panel doesn't render it as Nexus content). (`AtlasPageStateProvider.tsx:267-271`.)
- 🟢 **Mode inference matches design §4.** `/programs/<id>` resolves to `'full'` when a tenantKey is present, `'generic'` when not. `isModeValidForAuth()` correctly forbids `tenant`/`full` without a tenantKey, so the route falls back to inferred mode if the client sends a stale toggle.
- 🟢 **Pinecone-off fallback is structurally correct.** `chunksByVector` throws `'Pinecone not configured. Set PINECONE_API_KEY.'`, the broker catches, falls through to `chunksByKeyword`, and pushes the `WARNING_VECTOR_PENDING` sentinel onto `bundle.warnings`. The panel renders `Warnings` in an amber strip below the header. (`broker.ts:308-314`, `ContextAssembledPanel.tsx:210, 330-365`.)
- 🟢 **localStorage key collapses URL-shaped surfaces** so a user's mode choice rolls up across program-detail pages instead of being keyed by program id. (`context-mode-storage.ts:42-47`.)
- 🟢 **Apex tenant-key dual-naming is mapped correctly** at the route boundary via `clientKeyToInventorySubstrateKey('apexretail') → 'apex-retail'`. (`/api/chat/agent` line 599-601, matches the documented `feedback_broker_boundary`.)

### 2.2 — Documented gaps

- 🟡 **Pinecone is OFF in prod** — the broker falls back to keyword retrieval. Documented in PR #1272 / #1275 and the broker file header.
- 🟡 **OpenAI embedding job (CB-2) has not been run.** Even when `PINECONE_API_KEY` lands, no chunk vectors exist yet. The broker still emits the vector-pending warning if vectors are absent because `chunksByVector` returns no rows (or `embedTexts` errors first). PR #1272 explicitly notes "manual run pending."
- 🟡 **Corpus retrieval is stubbed.** `corpus` mode returns an empty bundle with `WARNING_CORPUS_PENDING` ("Corpus retrieval pending CB-6."). Despite the warning name, CB-6 did NOT wire the corpus catalog; the message will continue to print in `corpus` and `full` mode bundles. Acceptable for this stack but the warning text is now stale.
- 🟡 **Telemetry not wired.** `broker.ts:29` documents "Telemetry: not wired in CB-1; CB-6 fires `context_bundle_assembled`," but a grep of the entire `src/lib/knowledge` and `src/components/context-broker` trees finds no PostHog or telemetry call. PR #1275 description claims telemetry; the implementation does not match.

### 2.3 — Defects

- 🔴 **DEFECT-A · `ContextAssembledPanel` and `ModeToggle` are not mounted on `/programs/<id>`. The panel is invisible to a real pilot user.** **Severity: P0 — blocks the entire CB pilot story.**

  The panel and toggle are imported and rendered ONLY by `src/components/shell/AtlasChatOverlay.tsx`. A `grep -rn 'AtlasChatOverlay' src/` outside its own file and tests returns **zero hits**. The component is never `<AtlasChatOverlay … />`-rendered anywhere in the app tree.

  The chat surface that actually renders on `/programs/<id>` is `<AgentCanvas>` (`ProgramDetailPage.tsx:4243`), which mounts `<AtlasDrawer embedded>` (chat) + `<NexusReactivePanel>` (right column). Neither references `ContextAssembledPanel`, `ModeToggle`, `latestContextBundle`, `isAssemblingContextBundle`, or the context-broker module.

  The PR #1275 description ("the user opens the chat drawer and sees a two-column layout: chat thread on the left, 'Context Assembled' rail on the right") describes `AtlasChatOverlay`'s internal layout, not what the user sees. CB-6's tests assert the overlay component renders the panel correctly when opened — they do NOT assert that any route renders the overlay.

  The bundle is being **assembled, dispatched, and stored on `pageState.latestContextBundle`** every turn. It just has no consumer in the visible tree.

  **Repro:** Open `/programs/APX-CDP-2026`, ask a question, watch the right rail (`NexusReactivePanel`). You'll see Nexus's reactive artifacts — but no Context Assembled panel and no 4-mode toggle. The toggle never renders, so per-surface localStorage never gets written either. Default mode `full` will continue to be inferred server-side because no client choice is ever persisted.

  **Proposed follow-on:** **CB-7 · Mount the Context Assembled rail on `/programs/<id>`.** Two options, in order of preference:
  1. Add a third column to `AgentCanvas` with `<ContextAssembledPanel bundle={pageState.latestContextBundle} isLoading={pageState.isAssemblingContextBundle} />` plus `<ModeToggle>` above it. The grid becomes `chat | reactive panel | context rail` (~50/25/25 split or a tabbed right column).
  2. Mount `<AtlasChatOverlay>` as a togglable overlay from a corner button, retaining the embedded chat in `AgentCanvas` for the dominant flow. Lower visual prominence.
  Either way, the existing `pageState` already carries the data — this is a render-tree wiring fix only.

- 🔴 **DEFECT-B · `availableModesFor` proxy in `AtlasChatOverlay` short-circuits the disabled-Tenant/Full state.** **Severity: P2 — masking a UX guardrail.**

  `AtlasChatOverlay.tsx:49` derives `hasTenantKey = Boolean(pageState.tenantName && pageState.tenantName.trim().length > 0)`. But `AppShell.tsx:48` defaults `tenantName` to `'Apex Retail Group'` for **every** caller, including unauthenticated demo opens. Therefore `hasTenantKey` is always `true` and `availableModesFor()` always returns all four modes. The "Tenant / Full disabled when no tenantKey" UX guardrail (CB-6 spec) cannot fire client-side. The route still rejects via `isModeValidForAuth`, so it's not a security issue, but the user can click `Tenant` and the request silently falls back to inferred mode without any visible signal.

  Note this is moot until DEFECT-A is fixed (the toggle isn't on screen). Worth addressing in the same slice — change `AtlasPageState` to also carry an explicit `tenantKey: string | null`, or thread `hasTenantKey` from a server signal (e.g. user resolution) rather than the display name.

- 🔴 **DEFECT-C · Vector-retrieval info-tag is rendered as a warning.** **Severity: P3 — confusing copy.**

  `vectorRetrievalInfoTag(maxChunks)` returns `"Vector retrieval via Pinecone (top-K=N)."` and the broker pushes it onto `bundle.warnings` (`broker.ts:316`). The panel renders `bundle.warnings` in the amber-strip "Warnings (N)" block. So when vector retrieval **succeeds**, the user still sees an amber "Warning" box that says the system worked. It should either be a separate `bundle.info[]` field or render in a different chip/style. The CB-5 design doc §5 explicitly calls the amber strip "warnings prominently displayed" — repurposing it for success metadata is a copy bug.

- 🔴 **DEFECT-D · No graceful fallback when broker assembly throws.** **Severity: P3 — degrades silently.**

  `assembleContextBundleArtifact()` returns `null` on any throw (`route.ts:736-744`). The route then skips the artifact emission entirely. The client never gets a bundle and never gets a "context unavailable" sentinel. `setIsAssemblingContextBundle(false)` only fires in the provider's `finally` block, so the panel does fall back to "No context assembled yet" / cold-start — but the user has no way to distinguish "no bundle was needed" from "bundle assembly errored." Recommend adding a `[[artifact:context-bundle-error]]` channel or a `mode='generic'+error` placeholder bundle so the panel can render an explicit "Retrieval unavailable" state. Low-pri until DEFECT-A unblocks visibility.

- 🔴 **DEFECT-E · No special render branches for new TD-4 record kinds (`kpi_metric`, `cross_program_signal`).** **Severity: P3 — fall-through but lossy.**

  The canonical `ContextAssembledPanel` renders facts with a generic `Chip label={fact.recordKind}`. There is no case branching that surfaces metric values, threshold breaches, or cross-program impact lines for these kinds. The data flows through, but the UI says nothing different than a `program_inventory` row would. TD-5 wired the broker to consume them; CB-6 did not extend the panel. Belongs in a CB-8 follow-on once visibility (CB-7) lands.

- 🔴 **DEFECT-F · Two `ContextAssembledPanel.tsx` files coexist.** **Severity: P2 — code-rot risk.**

  - `src/components/context/ContextAssembledPanel.tsx` (1058 lines, with a 168-line test alongside)
  - `src/components/context-broker/ContextAssembledPanel.tsx` (913 lines — canonical per CB-6)

  PR #1275 explicitly chose to make the v2 API canonical IN PLACE in `context-broker/`. The legacy `context/ContextAssembledPanel.tsx` was not deleted. It still imports a different shape (`bundle, now?`) and has its own (passing) test suite. No app code imports it (grep clean), but it is a tripwire for a future agent that picks the wrong path. Recommend deletion in CB-7 or a follow-up cleanup slice.

### 2.4 — Polish

- ⚪ **Generic mode panel ignores the toggle's `isLoading` UX.** When the user picks `Generic` and asks, the broker returns instantly (no retrieval). The skeleton flicker is briefly visible (typically <50ms, but observable on slow CPUs). Could short-circuit the skeleton when `mode === 'generic'`.
- ⚪ **`AtlasChatOverlay` close button label is `"x"` literal — a11y degraded.** Should be `aria-label="Close chat"` with a screen-reader-only label.
- ⚪ **`PR-K · origination handoff` effect runs on every `surfaceContext` identity change** in the provider, not just on first mount. ProgramDetailPage rebuilds `programSurfaceContext` on every render, so the effect re-runs frequently. Risk is low (consumer guards the handoff marker), but it's fragile — wrap in `useMemo` or pin to `programId` only.
- ⚪ **Provider `ask` `useCallback` excludes `surfaceContext` from deps** (eslint-disable inline, line 371). Means a stale closure carries the surfaceContext at the time `ask` was first created. If the program page mutates surfaceContext mid-session (e.g. updates `briefSnapshot`), `ask` sends the stale snapshot. Today the snapshot doesn't mutate post-mount on `/programs/<id>`, so this is latent.

---

## 3. Recommended follow-on slices

Ordered by priority for pilot readiness.

| Id | Scope | Priority |
|---|---|---|
| **CB-7** | Mount `ContextAssembledPanel` + `ModeToggle` on `/programs/<id>` (and `/home`, `/intelligence`, `/source`, `/tower`). Likely a third column or right-rail tab in `AgentCanvas`. Resolves DEFECT-A. | **P0** |
| CB-7-AUTH | Thread an explicit `tenantKey` (or `hasTenantKey: boolean`) through `AtlasPageState` so `availableModesFor` reflects real auth state, not the display-name proxy. Resolves DEFECT-B. | P2 |
| CB-7-INFO | Split `bundle.warnings` into `warnings` vs `info`. Move the vector-retrieval-succeeded line out of the amber strip into a footer info chip. Resolves DEFECT-C. | P2 |
| CB-7-ERR | Emit a `context-bundle-error` artifact (or a placeholder bundle) on broker throw so the panel can render an explicit "Retrieval unavailable" state. Resolves DEFECT-D. | P3 |
| CB-8-RECORDKINDS | Extend the panel with case branches for `kpi_metric` and `cross_program_signal` so TD-4/TD-5 data renders meaningfully. Resolves DEFECT-E. | P3 |
| CB-CLEANUP | Delete `src/components/context/ContextAssembledPanel.tsx` and its test. Resolves DEFECT-F. | P3 |
| CB-TELEMETRY | Wire `context_bundle_assembled` PostHog event from the broker (server-side) and `context_bundle_panel_viewed` from the panel mount (client-side). Updates the broker file header from "not wired" to actual wiring. | P3 |

---

## 4. Confidence

**Pilot-readiness for the visible Context Assembled stack: Not ready. Blocked on CB-7.** The entire server pipeline (CB-1 → CB-3 → CB-5 → CB-6 route wiring) is architected and tested correctly. A real pilot user on `/programs/<id>` today sees zero of it — the panel, the toggle, and the per-surface mode preference all live in `AtlasChatOverlay`, which is an unmounted component.

**Pilot-readiness for the broker contract + retrieval pipeline (server-only): Ready.** Once Pinecone is keyed and CB-2 has run, vector retrieval will succeed deterministically. The keyword fallback is correct for the current key-less state. The broker boundary is being respected by the agent route (no direct tenant-data adapter calls in app code).

**Top-3 things a pilot user will hit on day 1:**
1. The panel is invisible — they will not know the broker is doing anything.
2. The mode toggle is invisible — they cannot run the CB-1 design doc's "60-second value demonstration."
3. Even when DEFECT-A is fixed, the amber-strip "Warning: Vector retrieval via Pinecone (top-K=8)" reads like a problem when in fact it's a success.

CB-7 (a render-tree wiring slice) plus CB-7-INFO (one-line copy split) is the minimum viable path to pilot. Estimated <1 day of work for either if scoped tightly.
