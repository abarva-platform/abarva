# PR B · Data Trust redesign

| | |
|---|---|
| **PR number** | B of 3 |
| **Type** | Structural redesign — absorb migrated content + new blocks |
| **Branch** | `setup-redesign/b-data-trust` |
| **Depends on** | PR A merged |
| **Blocks** | None (PR C can run in parallel) |
| **Estimated effort** | 14-18 hours |
| **Browser-Chrome QA required** | Yes |

---

## §1 · What this PR does

Redesigns Data Trust to absorb the substrate-related content that left Overview in PR A, plus add new blocks per the wireframe:
- State header (4 metrics)
- What's loaded (plain-language category buckets)
- Action queue (next loads ranked by impact)
- Trust ladder per segment (collapsible inventory)

Data Trust becomes the substantive home for "what data is loaded, what's missing, what to load next." Overview points here for the work; here is where the work happens.

**Reference:** `WIREFRAME_REFERENCE.html` Panel 2 (Data Trust). `DATA_BINDING_CATALOG.md` §2 for binding spec.

## §2 · The 4 blocks

Per wireframe Panel 2, top to bottom:

1. **Block 2.1** — State header (4 metrics in a row)
2. **Block 2.2** — What's loaded (plain-language buckets)
3. **Block 2.3** — Action queue ("Next loads, ranked by impact")
4. **Block 2.4** — Trust ladder per segment (collapsible inventory)

Right rail: Steward chat scoped to data questions.

## §3 · What gets absorbed from Overview's old content

PR A migrated these out of Overview but left them in the codebase. PR B imports them into Data Trust:

### 3.1 Act 1 fact cards → Block 2.2 reference data
The 6 fact cards (Enterprise / Likely Priorities / Regulatory Posture / Systems / KPI Baseline / Evidence Standard) inform the plain-language buckets in Block 2.2 but are NOT directly rendered as 6 separate cards. Their content rolls up into the bucket descriptions.

If you need the per-segment fact cards as a deeper-detail expansion, they can live as click-through detail from the trust ladder (Block 2.4) — clicking a segment row opens a detail panel showing the segment's facts.

### 3.2 Act 3 upload templates → Block 2.3 action queue items
The 4 templates (Enterprise Profile / Compliance / IT Systems / Programs) shipped in Setup Fix Package PR 4 continue to exist at `public/setup-templates/`. The action queue items use those templates directly. Each action queue item shows: severity dot · segment name · consequence copy · `Template ↓` CTA · `Upload →` CTA.

The "Today / After upload" Steward voice quotes from the original Act 3 are NOT preserved in PR B. The action queue is tighter — consequence copy in 1-2 sentences, not before/after editorial.

### 3.3 Client Data Landscape full table → Block 2.4 trust ladder
The 14-row segment table from Overview becomes the trust ladder in Block 2.4. Same data, redesigned with:
- Trust rung column (5 rungs: Loaded / Available / Usable evidence / Agent-usable / Decision-grade)
- "Unlocks" column showing primary capability per segment
- "Next action" column (Load / Promote / —)
- Collapsible: default shows top 7 rows, expand to see all 14 (or all 23 if Wave 4 segments are loaded for the tenant)

### 3.4 What does NOT get absorbed
- Capability Constellation matrix → goes to PR C (Agent Readiness), not Data Trust
- Four prose cards under matrix → goes to PR C
- Steward editorial → stays on Overview (Block 1.2), not duplicated here

## §4 · New components to create

In `src/components/admin/data-trust/`:

- `DataTrustStateHeader.tsx` — 4-metric state header
- `WhatsLoadedBuckets.tsx` — plain-language category buckets
- `DataTrustActionQueue.tsx` — ranked action queue (similar shape to Overview's ActionQueue but data-trust-specific)
- `TrustLadder.tsx` — collapsible segment table with trust rung, unlocks, next action

## §5 · Existing components to import or refactor

- `ClientDataLandscape` (or whatever it's called) — refactor into `TrustLadder` or use as starting point
- Act 1 fact card data — feeds bucket descriptions in Block 2.2 (data, not the components themselves)
- Setup template links from PR 4 of Setup Fix Package

## §6 · Hard scope rules

You MUST NOT:
- Modify Overview (PR A's scope)
- Modify Agent Readiness (PR C's scope)
- Modify other Setup panels (Connectors, Users & Access, Production Readiness)
- Modify substrate / migrations
- Add new substrate fields (log gaps, use catalog fallbacks)
- Skip browser-Chrome QA before merge
- Build the actual upload pipeline (Upload → CTA can be a stub or open an existing flow; building new upload functionality is out of scope)

You MAY:
- Create new components per §4
- Refactor existing landscape table into trust ladder
- Update tests
- Update Data Trust page composition
- Pull data from `tenant_expected_baselines`, `data_inventory_segments`, `data_inventory_records`, etc. per binding catalog
- Add server-side template-fill for bucket descriptions

## §7 · Test additions

Tests verifying:

1. Data Trust page renders exactly 4 blocks (StateHeader, WhatsLoaded, ActionQueue, TrustLadder)
2. State header displays correct counts (segments loaded, records, decision-grade, blocking)
3. WhatsLoaded buckets render with correct severity per bucket health
4. Bucket-to-segment mapping matches catalog §2.2
5. Action queue items render with template + upload CTAs
6. Action queue items linked to correct templates (Enterprise → enterprise-profile.yaml, etc.)
7. Trust ladder shows all 14 (or 23) segments with rung, unlocks, next action columns
8. Trust ladder default collapsed at 7 rows; expand button reveals all
9. Trust ladder rows clickable to expand into segment detail
10. Empty / partial / mature state variations render correctly
11. Right-rail Steward chat scope is "data questions"
12. Tenant data correct (regression check from Setup Fix Package PR 2)

## §8 · Browser-Chrome QA (required before merge)

1. Navigate to Vercel preview URL
2. Sign in as FCF admin
3. Load `/admin/data-trust`
4. Verify visually that page shows exactly the 4 blocks per wireframe Panel 2
5. Verify state header metrics correct
6. Verify "What's loaded" shows plain-language buckets, NOT segment numbers
7. Verify each bucket has a clear severity dot indicating its state
8. Verify action queue items show severity, segment name, consequence, Template ↓, Upload → CTAs
9. Click "Template ↓" on an action queue item — verify correct template file downloads
10. Click "Upload →" on an action queue item — verify it triggers the upload flow (or opens stub if upload not built)
11. Verify trust ladder shows 14 segments by default-collapsed (top 7 visible, "Show all" expand)
12. Click "Show all" — verify expansion reveals remaining segments
13. Click a segment row — verify detail expansion (or detail panel) opens
14. Verify "Unlocks" column shows consequence copy per catalog §7
15. Open browser dev tools, verify no console errors
16. Verify network tab clean
17. Capture screenshot at 1280px
18. Test on a second tenant (Apex Retail or Meridian Health) — verify tenant-specific data renders
19. Save screenshots to `docs/setup-redesign-package/screenshots/pr-b-data-trust-[timestamp].png`

## §9 · Branch + commit + PR mechanics

Standard. Branch: `setup-redesign/b-data-trust`. PR title: `[REDESIGN] Data Trust — absorb migrated content + new blocks (PR B of 3)`.

## §10 · Acceptance criteria

PR B complete when ALL true:

- [ ] Data Trust shows exactly 4 blocks per wireframe Panel 2
- [ ] State header metrics correct
- [ ] Plain-language buckets render with correct mapping per catalog
- [ ] Action queue ranked, linked to templates and upload flow
- [ ] Templates from PR 4 of Setup Fix Package still accessible
- [ ] Trust ladder shows all segments with rung / unlocks / next action
- [ ] Trust ladder collapsible and expandable
- [ ] Tenant data correct
- [ ] Right-rail chat scope updated to data questions
- [ ] Lint / type-check / build / tests pass
- [ ] New tests per §7 added and passing
- [ ] **Browser-Chrome QA all 19 checks passing**
- [ ] Multi-tenant verified (at least 2 tenants tested)
- [ ] No console errors
- [ ] Screenshots saved
- [ ] PR description references this spec
- [ ] Substrate gaps logged
- [ ] Spec drift logged

## §11 · Failure modes specific to PR B

### 11.1 The "show all 6 Act 1 cards as cards" trap
The Act 1 cards from Overview are gone visually. Their content rolls into the plain-language buckets (Block 2.2). Don't render 6 fact cards on Data Trust; render the 5-7 buckets per wireframe.

### 11.2 The "preserve the Today/After upload editorial" trap
The Act 3 editorial voice quotes are not on Data Trust. Action queue items are tighter — severity + consequence in 1-2 sentences. The voice was good for Overview's Three Acts; it's wrong tone for Data Trust's action queue.

### 11.3 The "expand the trust ladder default" trap
Default collapsed at 7 rows. Don't show all 14 (or 23) by default — that's the dense table problem returning. Most users only need to see top 7; power users expand.

### 11.4 The "build the upload pipeline" trap
Upload → CTA can be a stub or open existing upload functionality. Building new upload pipeline is out of scope. If "Upload →" doesn't have a destination, route to an "Upload coming soon" page or hide the CTA. Document the gap.

### 11.5 The "consequence copy is generic" trap
Per catalog §7, every segment has specific "Unlocks" copy. Use it. Don't write "Loading this would deepen agent capability" — name the specific capability, agent, and decision context.

## §12 · After PR B merges and deploys

Per master prompt §1.10, post completion comment, then:
- **Begin PR C** (`PR_C_AGENT_READINESS.md`) — Agent Readiness absorbs matrix and prose cards from Overview's old content

End of PR B spec.
