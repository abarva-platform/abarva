# Morrison Rich Deliverables · Apex Retail Group · APX-01

**Program:** Owned Brand Margin Recovery
**Pattern:** Owned Brand Margin Recovery (Transformation Genome)
**Tenant:** Apex Retail Group (composite organization built from real-world data · not a real customer)
**Sponsor:** Marcus T. · CFO
**Co-sponsor:** Katherine P. · CMO

---

## Shared resources

- **`_timeline.json`** — canonical Morrison chronology. Every deliverable's decision log entries pull dates from this file. Sub-agents **append** new entries; never overwrite. See append-only protocol in `WAVE-2-AGENT-COORDINATION.md` at repo root.
- **`_evidence-base.json`** — citation resolution contract. Every inline `E1`, `E2`, ... chip in a deliverable must resolve to an entry here. Append new entries additively; never rewrite existing entries.

## Deliverable files

Each `.mdx` / `.tsx` file under this directory represents one deliverable rendered at Rich tier per the 12-component contract in `morrison-rich-authoring-work-order.md`.

### Phase 1 · Intake & Framing (C1 sub-agent)
- `d01-program-charter.*`
- `d02-stakeholder-map.*`
- `d03-success-metric-tree.*`
- `d04-intake-interview-synthesis.*`

### Phase 2 · Diagnosis & Analysis (C2 sub-agent)
- `d07-current-state-financial-baseline.*`
- `d08-pain-point-register.*`
- `d09-root-cause-analysis.*`
- `d10-benchmark-comparison.*`
- `d11-hypothesis-backlog.*`

### Phase 3 · Design & Decision (C3 sub-agent)
- `d12-estimation-execution-roadmap.*`
- `d15-intervention-portfolio.*`
- `d16-business-case.*`
- `d17-decision-memo.*` — already authored (exemplar)
- `d18-risk-register.*`

### Phase 4 · Build & Deliver (C4 sub-agent)
- `d19-delivery-plan-raci.*`
- `d20-sprint-milestone-artifacts.*`
- `d22-change-management-package.*`
- `d24-outcome-measurement-plan.*`

---

## Integrity rules

1. **Composite disclaimer + demo-rendering disclaimer** in every deliverable footer. Exact strings:
   - "Apex Retail Group is a composite organization built from real-world data."
   - "This document is a demo rendering, not a deliverable for a real engagement."
2. **No real company names** as suppliers, vendors, or partners. Use `Supplier A / B / C` conventions.
3. **Stakeholder names composite** · Marcus T. (CFO), Katherine P. (CMO), Diane R. (SVP Supply Chain), etc. Consistent first-name-last-initial format across all deliverables.
4. **All numbers tenant-specific** · no generic placeholder rounds; numbers coherent across deliverables (anchor facts live in `_timeline.json`).
5. **Citations resolve** · every `E1`, `E2`, ... chip references an entry in `_evidence-base.json`.
6. **Outcomes framed as projections** · "projected," "target," "at steady state" — never "attested" or "delivered" until Phase 5 attestation exists in the real product.

---

## Authoring workflow

See `morrison-rich-authoring-work-order.md` for the 14-step per-deliverable sequence. Each deliverable should take 25-40 minutes. Budget total: ~6-9 hours across the 16 remaining deliverables (D17 already complete).
