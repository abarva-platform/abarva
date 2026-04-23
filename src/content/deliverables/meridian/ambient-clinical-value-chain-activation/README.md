# Meridian Ambient Rich Deliverables · Meridian Health System · MRD-01

**Program:** Ambient Clinical Value Chain Activation
**Pattern:** Ambient Clinical Value Chain (Transformation Genome)
**Tenant:** Meridian Health System (composite organization built from real-world data · not a real customer)
**Sponsor:** Sarah Chen · CIO
**Co-sponsor:** Dr. Larsson · CMO
**Revenue Cycle lead:** Priya Raman · VP Revenue Cycle
**CMIO:** Dr. Morales · CMIO

---

## Shared resources

- **`_timeline.json`** — canonical Meridian Ambient chronology. Every deliverable's decision log entries pull dates from this file. Sub-agents **append** new entries; never overwrite. See append-only protocol in `WAVE-2-AGENT-COORDINATION.md` at repo root.
- **`_evidence-base.json`** — citation resolution contract. Every inline `E1`, `E2`, ... chip in a Meridian Ambient deliverable must resolve to an entry here. Meridian Ambient owns the **E1-E19** range; the Morrison program maintains a separate registry. Append new entries additively; never rewrite existing entries.

## Deliverable files

Each `.md` file under this directory represents one deliverable rendered at Rich tier per the 12-component contract mirrored from `morrison-rich-authoring-work-order.md`.

### Phase 1 · Intake & Framing (C5 sub-agent)
- `D01-d01-program-charter.md`
- `D02-d02-stakeholder-map.md`
- `D03-d03-success-metric-tree.md`
- `D04-d04-intake-synthesis.md`

### Phase 2 · Diagnosis & Analysis (future sub-agent)
- `d06-documentation-time-baseline.*`
- `d08-pain-point-register.*`
- `d10-benchmark-comparison.*`
- `d11-hypothesis-backlog.*`

### Phase 3 · Design & Decision (future sub-agent)
- `d12-estimation-execution-roadmap.*`
- `d13-operating-model-design.*`
- `d15-intervention-portfolio.*`
- `d16-business-case.*`
- `d17-decision-memo.*`
- `d18-risk-register.*`

---

## Integrity rules

1. **Composite disclaimer + demo-rendering disclaimer** in every deliverable footer. Exact strings:
   - "Composite organization built from real-world data. Sponsor-validated before production use."
   - "This document is a demo rendering, not a deliverable for a real engagement."
2. **Vendor references** · Abridge, Microsoft DAX Copilot, and Suki are legitimate public market names and may be used with factual product descriptions. Epic is the EHR, named by name. No other vendors by real name without explicit authorization.
3. **Stakeholder names composite** · Sarah Chen (CIO), Dr. Larsson (CMO), Priya Raman (VP Revenue Cycle), Dr. Morales (CMIO). No invented executives beyond this roster.
4. **All numbers tenant-specific** · anchor facts live in `_timeline.json`. No generic placeholder rounds; numbers coherent across deliverables.
5. **Citations resolve** · every `E1`..`E19` chip references an entry in `_evidence-base.json`.
6. **Outcomes framed as projections** · "projected," "target," "at steady state" — never "attested" or "delivered" until Phase 5 attestation exists in the real product.

---

## Authoring workflow

See `docs/design-canon/morrison-rich-authoring-work-order.md` for the 14-step per-deliverable sequence (structural template mirrored for Meridian). Each deliverable should take 25-40 minutes.
