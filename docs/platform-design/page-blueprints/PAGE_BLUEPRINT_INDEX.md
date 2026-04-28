# AbarVa Page Blueprint Index
**Authority: PX1 · Wave 20**
**Primary question answered:** Which pages in AbarVa have a complete blueprint, and what is their current status?

| Page | Route | Blueprint | Status | Primary Agent | Demo Readiness |
|------|-------|-----------|--------|---------------|----------------|
| Home | /home | HOME_PAGE_BLUEPRINT.md | draft | Nexus | thin |
| Programs | /tenant/[slug]/programs | PROGRAMS_PAGE_BLUEPRINT.md | draft | Nexus | rich (Apex Retail) |
| Program Detail | /tenant/[slug]/programs/[slug] | PROGRAM_DETAIL_PAGE_BLUEPRINT.md | draft | Nexus | rich (Apex Retail CDP) |
| Source | /source | SOURCE_PAGE_BLUEPRINT.md | draft | Nexus | partial |
| Source Event | /source/events/[id] | SOURCE_EVENT_PAGE_BLUEPRINT.md | draft | Nexus | partial (AMS scenario) |
| Intelligence | /tenant/[slug]/intelligence | INTELLIGENCE_PAGE_BLUEPRINT.md | draft | Sentinel | thin/deterministic |
| Control Tower | /tenant/[slug]/tower | CONTROL_TOWER_PAGE_BLUEPRINT.md | draft | Atlas | thin/deterministic |
| Admin Setup | /platform/admin | ADMIN_SETUP_PAGE_BLUEPRINT.md | draft | Steward | partial |
| Production Readiness | /platform/admin/production-readiness | PRODUCTION_READINESS_PAGE_BLUEPRINT.md | draft | Steward | rich (manifest) |
| Architecture | /platform/admin/architecture | ARCHITECTURE_PAGE_BLUEPRINT.md | draft | Atlas | rich (manifest) |

## Missing Blueprints (future)
- Investor page
- Build Progress page
- Quality Ops page
- Platform Connectors page

## Data Contract Note

All blueprints listed above carry a data contract declaring seed availability.
Rich = Apex Retail full seed. Partial = scenario-level seed only. Thin = minimal or no seed. Shell_only = route exists, no data.
Deterministic seed caveat applies to all — no live data claims.

## Acceptance Criteria for This Index

- [ ] All active routes have a blueprint entry
- [ ] Each entry names a primary agent (nexus / sentinel / steward / atlas)
- [ ] Each entry carries a demo readiness tier
- [ ] Missing blueprints listed explicitly
- [ ] Index updated whenever a new blueprint is added
