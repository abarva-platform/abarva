# PR 3 · Overview Client Data Landscape reconciliation

| | |
|---|---|
| **PR number** | 3 of 9 |
| **Type** | Defect fix — display layer reconciliation |
| **Branch** | `setup-fix/03-overview-landscape-reconciliation` |
| **Depends on** | PR 1 merged + Anand decision (Gate 1) |
| **Blocks** | PR 4 |
| **Estimated effort** | 2-3 hours |
| **Gate?** | **YES — Gate 1** |

---

## §1 · What this PR does

Reconciles the contradiction on the Overview panel between:
- **Upper panel** (Act 1, Act 2, Act 3): Shows rich First Capital Financial substrate — fact cards citing segments 01/03/05/09/12 with "reviewed 0d ago", capability matrix with partial/thin ratings, before/after Steward consequence quotes
- **Lower panel** ("Client data landscape"): Shows 0/14 segments loaded, 0 records, 0 chunks, 0 graph nodes, 0 graph edges

These cannot both be true. The fix depends on which is correct.

## §2 · Gate 1 — Anand decision required before starting

The fix direction depends on Anand's answer to: **What does "Client Data Landscape" actually count?**

### Option A — Landscape should match Act 1 substrate

If the landscape is intended to reflect the same substrate Act 1 reads, the fix is to connect them. Landscape becomes a detailed view of segments cited in Act 1.

**Implications:** Landscape will show non-zero counts for segments 01, 03, 05, 09, 12. Other segments may still show empty if substrate is genuinely empty there. Display becomes consistent with the editorial.

### Option B — Landscape tracks "formal ingestion only" (different concept)

If the landscape is meant to track only files uploaded via a formal ingestion flow (which doesn't exist yet, hence 0/14), and Act 1 reads from pre-loaded segment metadata, the fix is to add copy explaining the distinction.

**Implications:** Landscape stays at 0/14 for now (correctly). Copy is added: "Landscape tracks files uploaded via the AbarVa ingestion flow. Act 1 reads from pre-loaded segment metadata. These will converge as ingestion comes online."

### How to gate

Pause work on PR 3 until Anand answers. Post the question to the package tracking issue:

```markdown
🚪 Gate 1 — PR 3 requires Anand decision

The Overview panel shows contradictory state: upper sections cite rich
substrate (segments 01, 03, 05, 09, 12 with "reviewed 0d ago"), lower
"Client Data Landscape" shows 0/14 segments loaded.

Two fix options:

A. Connect landscape to same substrate Act 1 uses. Landscape will show
   non-zero counts for cited segments. Both sections become consistent.

B. Keep landscape as a separate "formal ingestion" tracker (currently
   correct at 0/14). Add copy explaining the distinction from Act 1.

Anand's recommendation in the package: Option A.

Awaiting confirmation before proceeding.
```

When Anand responds, log the decision in `ESCALATION_REGISTER.md` and proceed.

**While paused on Gate 1, you may continue work on PR 9 (Production Readiness polish) which has no Gate 1 dependency.**

## §3 · Implementation — Option A (default per package recommendation)

If Anand confirms Option A:

### 3.1 Identify the data source for Act 1
Trace where Act 1 fact cards read their data. Likely a substrate query for segment metadata (e.g., `select segments where loaded = true`).

### 3.2 Identify the data source for Client Data Landscape
Trace where the landscape table reads its counts. Likely a different query against a different table or read model (the problem is they don't agree).

### 3.3 Standardize on one data source
The fix: have the landscape read from the same source Act 1 uses. Specifically:
- Segments loaded count: count of segments where Act 1 has data
- Records / Chunks / Graph nodes / Graph edges: real counts from substrate per segment
- Per-segment row: shows actual counts, not "—"

### 3.4 Empty state still matters
If a tenant has zero segments loaded, the landscape should show 0/14 honestly. The fix is for the case where substrate exists but the landscape isn't reading it.

### 3.5 Coverage and Health columns
The current landscape table has "Coverage" and "Health" columns showing no values. Define what these mean:
- **Coverage**: percentage of expected fields populated within the segment (e.g., a fully populated KPI dictionary scores 100%; a partially filled one scores 60%). If you cannot compute this from substrate, log a substrate gap and leave the column blank with "—" placeholder.
- **Health**: status indicator (Healthy / Stale / Loaded / Not loaded). "Not loaded" for segments with zero data; "Loaded" for segments with data but unverified; "Healthy" requires verification logic that may not exist yet.

If Coverage and Health cannot be computed from current substrate, document in substrate gap register and ship the fix without them (mark columns as "Coming with [substrate addition]").

## §4 · Implementation — Option B (alternate)

If Anand chooses Option B:

### 4.1 Add explanatory copy
Above the Client Data Landscape table, add a paragraph explaining:
- What this section tracks (files uploaded via ingestion flow)
- Why it differs from Act 1 (Act 1 reads pre-loaded segment metadata)
- When to expect them to converge (when ingestion flow comes online)

Copy should be 2-3 sentences, factual, no marketing voice.

### 4.2 Adjust the section eyebrow
Current: "Data landscape · all segments"
Proposed: "Ingested files · uploaded via AbarVa ingestion flow"

Or whatever phrasing makes the distinction clear without being clunky.

### 4.3 Leave counts at 0
Per Option B logic, the landscape correctly shows 0/14 for a tenant with no formally ingested files. Don't change the data; change the framing.

## §5 · Hard scope rules

You MUST NOT:
- Modify substrate / migrations
- Modify Act 1, Act 2, or Act 3 sections (those are correct or are PR 4's scope)
- Modify other Setup panels (PRs 5-9)
- Add new substrate fields (log as substrate gap if needed)
- Change the section's position or relationship to other Overview sections

You MAY:
- Modify the Client Data Landscape section's data source / query / read model
- Modify the section's copy / framing (Option B path)
- Add or change the section's column definitions if needed
- Update Steward chat block status indicators ("Records loaded: —" etc.) to match the new landscape behavior — verify consistency

## §6 · Cross-section consistency

The Overview page has multiple places that report data state:
- Steward chat block: "Records loaded: —" / "Segments tracked: —" / "Capabilities grounded: 0 of 4"
- Recent activity section
- Client data landscape section
- Act 2 capability matrix

Whatever fix you implement, these should be consistent. If landscape shows 12/14 segments loaded post-fix, the Steward chat block shouldn't still say "Records loaded: —". Update all reporting to align.

## §7 · Test additions

Add tests verifying:

1. For a tenant with substrate data (FCF post-enrichment), the landscape shows non-zero counts (Option A) or correct framing copy (Option B)
2. For a tenant with no substrate data, the landscape shows 0/14 honestly
3. Steward chat block stats match landscape stats
4. Per-segment rows show counts that match the segment's actual substrate state

## §8 · Verification commands

Same as PR 1 §8.

## §9 · Vercel preview verification

After merge and deploy:

1. Visit Overview panel as FCF admin
2. Verify Act 1 / Act 2 / Act 3 still render correctly (regression check from PR 2)
3. Verify Client Data Landscape reflects fix per Option A or B
4. Verify Steward chat block stats are consistent with landscape
5. Capture screenshot of full Overview page
6. Save to `docs/setup-fix-package/screenshots/pr-03-overview-after.png`

## §10 · Branch + commit + PR mechanics

Standard pattern. PR title: `[FIX] Setup — reconcile Overview Client Data Landscape (PR 3 of 9)`

## §11 · Acceptance criteria

PR 3 is complete when ALL true:

- [ ] Gate 1 resolved — Anand decision logged in escalation register
- [ ] Implementation matches chosen option (A or B)
- [ ] Client Data Landscape no longer contradicts Act 1
- [ ] Steward chat block stats consistent with landscape
- [ ] Per-segment row counts correct (Option A) or copy correct (Option B)
- [ ] No substrate changes
- [ ] Other Overview sections unchanged
- [ ] Lint / type-check / build / tests pass
- [ ] New tests added and passing
- [ ] Vercel preview verified — screenshot saved
- [ ] Substrate gaps logged for Coverage / Health if not implementable
- [ ] PR description references this spec and Anand's Gate 1 decision

## §12 · Failure modes specific to PR 3

### 12.1 The "I'll redesign Overview while I'm here" trap
The Overview page has multiple opportunities for improvement — Act 3 needs upload templates (PR 4), Steward chat could be better, Recent activity could be richer. **Stay in scope.** This PR is the landscape reconciliation only.

### 12.2 The "compute Coverage and Health from scratch" trap
If you can't read Coverage and Health from substrate, don't invent the calculation. Log a substrate gap, leave columns empty with placeholder. PR 6 (Data Trust redesign) will likely surface the right place for these computations.

### 12.3 The "make the landscape pretty" trap
The current landscape table is dense and unstyled. Tempting to redesign it. Out of scope — visual redesigns are separate decisions.

## §13 · After PR 3 merges and deploys

Per master prompt §1.9, post completion comment.

After PR 3 merged:
- PR 4 unblocks — proceed to it next
- Continue to monitor PRs 5, 9 if they're still in flight from earlier waves

End of PR 3 spec.
