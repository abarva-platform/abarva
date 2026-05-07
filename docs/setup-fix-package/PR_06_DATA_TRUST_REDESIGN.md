# PR 6 · Data Trust structural redesign

| | |
|---|---|
| **PR number** | 6 of 9 |
| **Type** | Structural redesign — implements Claude Design output |
| **Branch** | `setup-fix/06-data-trust-redesign` |
| **Depends on** | PR 1 + PR 2 merged + Claude Design output (Gate 2) |
| **Blocks** | None |
| **Estimated effort** | 10-12 hours (implementation only; design pass separate) |
| **Gate?** | **YES — Gate 2** |

---

## §1 · What this PR does

Redesigns the Data Trust panel so it actually serves a tenant admin trying to understand and improve dataset trust state for their organization.

**Current state (per inventory §2.2):**
- Shows Apex Retail data even when session is FCF (defect — fixed by PR 2)
- 5-rung trust ladder (Loaded / Available / Usable evidence / Agent-usable / Decision-grade)
- 15 datasets across rungs
- No upload affordance
- No per-dataset consequence copy
- No path to promote a dataset between rungs

**Post-redesign state:**
- Shows tenant-correct data
- Trust ladder retained but reframed around admin actions
- Per-dataset: what unlocks at each rung, what's needed to promote
- Upload affordance with template (per the PR 4 pattern)
- Action queue: "Datasets needing your decision"

## §2 · Gate 2 — Claude Design output required

Before starting implementation, this PR requires a design HTML deliverable produced by Claude Design (separate session). The design HTML defines:
- The new Data Trust layout (3 states: empty / partial / mature)
- Visual treatment of each trust rung
- Action queue placement and treatment
- Upload affordance design
- Per-dataset detail expansion behavior

### Gate trigger

When you reach this PR with PRs 1 and 2 merged, post:

```markdown
🚪 Gate 2 — PR 6 requires Claude Design output

Data Trust structural redesign needs visual design before implementation.

Required deliverable: HTML mockup at docs/design/setup/data-trust-redesign.html
covering 3 states (empty / partial / mature) per the principles in this
PR spec.

Awaiting Claude Design output OR Anand decision to skip design pass and
proceed with spec-only implementation.
```

When Claude Design output arrives (or Anand opts to proceed without), log to escalation register and proceed.

**While paused on Gate 2, you may continue work on PRs 7, 8 if their gates are also pending — but realistically design passes for those need to land too. PRs 9 has no gate, can proceed.**

## §3 · Design intent for the Data Trust redesign

Whether the design HTML exists or not, these principles guide the redesign:

### 3.1 Trust ladder is preserved as the model
Five rungs: Loaded → Available → Usable evidence → Agent-usable → Decision-grade. Don't reinvent the model; the model is sound.

### 3.2 Per-rung consequence is specific
Not "approved for agent context" — specifically which agents, for which decisions. Example:
- **Decision-grade:** Approved for gate decisions on Programs and BAFO selection on Sourcing
- **Agent-usable:** Cited by Steward in editorial cards and Sentinel in pattern detection
- **Usable evidence:** Available for retrieval in agent prompts but not cited as authoritative

### 3.3 Per-dataset path forward
Each dataset shows:
- Current rung
- What needs to happen to reach next rung
- Who owns the next step (admin / data owner / AbarVa Steward)
- Estimated effort if known

### 3.4 Upload affordance lives at the top
Adding a new dataset is the most common admin action on this panel. Affordance: "+ Add dataset" button top-right, opens form with template download (matching PR 4 pattern).

### 3.5 Action queue visible at top
"Datasets needing your decision" — promotes datasets that are stuck at the admin's bar. Same pattern as Source portfolio attention banners.

## §4 · The 3 states

### 4.1 Empty state
Tenant has zero datasets across all rungs.
- Show explanation of trust ladder
- Show "+ Add your first dataset" CTA
- Show example datasets (illustrative, greyed-out preview)

### 4.2 Partial state
Tenant has 1-9 datasets across rungs.
- Show action queue at top (datasets needing decision)
- Show 5-rung ladder with datasets in each
- Show + Add dataset CTA top-right

### 4.3 Mature state
Tenant has 10+ datasets.
- Same as partial, plus:
- Filtering by rung
- Search by dataset name
- Sort by aging / value / decision pending

## §5 · Hard scope rules

You MUST NOT:
- Modify substrate beyond what's needed for new UI (additions only via substrate gap log; no destructive changes)
- Modify other Setup panels
- Build the actual dataset upload pipeline (just the affordance — upload may be deferred)
- Add functionality not in the design HTML or this spec

You MAY:
- Implement components per the design HTML
- Add new routes if the design HTML has expanded views
- Add new substrate read queries (read-only; log gaps for any writes needed)
- Update tests

## §6 · Test additions

Standard component testing per the new structure. State determination logic, action queue filtering, per-dataset detail rendering.

## §7 · Acceptance criteria

- [ ] Gate 2 resolved
- [ ] Implementation matches design HTML (or spec-only direction if no design)
- [ ] All 3 states render correctly
- [ ] Tenant data displays correctly post-PR 2 fix
- [ ] Upload affordance present with template download (PR 4 pattern)
- [ ] Action queue renders for partial / mature states
- [ ] Per-dataset consequence copy present
- [ ] Lint / type-check / build / tests pass
- [ ] New tests added
- [ ] Vercel preview verified for at least 2 tenants
- [ ] Substrate gaps logged
- [ ] Spec drift logged
- [ ] PR description references this spec and design HTML

## §8 · Failure modes

### 8.1 The "implement before design" trap
If Gate 2 is skipped (Anand opts to proceed without design), use spec principles only and produce a more conservative implementation. Don't invent visual designs from scratch.

### 8.2 The "build the upload pipeline" trap
The affordance exists; the pipeline is separate work. Affordance triggers either a "request upload" workflow or a stub upload that doesn't yet ingest. Document which.

### 8.3 The "consequence copy is generic" trap
Per-rung copy must name specific agents, specific decisions, specific surfaces. "Used by agents" is too generic. "Cited by Steward in editorial cards on the Source detail page" is the standard.

End of PR 6 spec.
