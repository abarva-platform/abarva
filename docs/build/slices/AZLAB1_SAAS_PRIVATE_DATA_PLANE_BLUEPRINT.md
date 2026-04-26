# Slice Contract: AZLAB1

## Identity

| Field | Value |
|---|---|
| ID | AZLAB1 |
| Name | SaaS Control Plane + Private Data Plane Lab Blueprint |
| Category | architecture |
| Status | code_complete |
| Risk | low |
| Created | 2026-04-26 |

## Goal

Produce a comprehensive lab blueprint documenting the two-plane
architecture (AbarVa SaaS Control Plane simulated on Vercel/cloud;
Client Private Data Plane simulated on Azure subscription), the data
and evidence boundary rules, and a concrete May 4 path to a running
lab demonstration.

This slice is documentation-only. No application code, no runtime
modification, no migrations, no model calls.

## Files produced

| File | Purpose |
|---|---|
| `docs/architecture/AZLAB1_SAAS_CONTROL_PLANE_PRIVATE_DATA_PLANE_BLUEPRINT.md` | Comprehensive blueprint: overview, plane responsibilities, resource groups, boundary rules, Mermaid diagram, May 4 target path |
| `docs/build/slices/AZLAB1_SAAS_PRIVATE_DATA_PLANE_BLUEPRINT.md` | This slice contract |
| `docs/build/build-slices.json` | AZLAB1 entry appended |
| `docs/build/production-readiness.json` | AZLAB1 note appended to `production_deployment` component |
| `docs/build/build-waves.json` | wave-12 appended |

## Acceptance criteria

- [ ] Blueprint document exists at the path above.
- [ ] Blueprint covers: overview, control plane responsibilities, private
      data plane responsibilities, Azure resource groups, data boundary
      (what crosses vs. stays), evidence boundary, model gateway
      boundary, network boundary.
- [ ] Blueprint states clearly what the lab proves and does NOT prove.
- [ ] Mermaid diagram shows two planes, boundary API, data flow, and
      what crosses vs. stays.
- [ ] May 4 target path has six concrete steps with dates.
- [ ] `build-slices.json` contains AZLAB1 entry with `code_complete`.
- [ ] `production-readiness.json` `production_deployment` notes array
      contains AZLAB1 note; no status fields changed.
- [ ] `build-waves.json` contains wave-12 with AZLAB1 in
      `completedSlices`.
- [ ] TypeScript compilation is clean (docs-only slice introduces no
      new TS errors).

## Validation commands

```bash
# TypeScript clean check
node_modules/.bin/tsc --noEmit --pretty false 2>&1 | tail -5

# Confirm blueprint file exists
ls docs/architecture/AZLAB1_SAAS_CONTROL_PLANE_PRIVATE_DATA_PLANE_BLUEPRINT.md

# Confirm slice doc exists
ls docs/build/slices/AZLAB1_SAAS_PRIVATE_DATA_PLANE_BLUEPRINT.md

# Confirm AZLAB1 in build-slices.json
node -e "const s=require('./docs/build/build-slices.json'); const e=s.slices.find(x=>x.id==='AZLAB1'); console.log(e ? 'AZLAB1 found: ' + e.status : 'MISSING');"

# Confirm wave-12 in build-waves.json
node -e "const w=require('./docs/build/build-waves.json'); const e=w.waves.find(x=>x.waveId==='wave-12'); console.log(e ? 'wave-12 found: ' + e.status : 'MISSING');"
```

## Notes

- Deferred items (AZLAB2-5, Azure OpenAI in PDP, HSM CMK, zone-HA)
  are documented in the blueprint §11.
- Lab uses Basic/minimal SKUs throughout; production SKUs documented
  in ABARVA_AZURE_REFERENCE_TARGET.
- No false production-ready promotion: `production_deployment` status
  remains `blocked`; only the notes array is extended.
