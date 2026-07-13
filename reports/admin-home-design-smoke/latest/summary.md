# ADMIN-HOME-DESIGN-SMOKE-PR — Design Fidelity and Smoke Proof

- Test run timestamp: 2026-07-13T04:00:06.734Z
- SHA tested: `b470fdb04644b049d7cf23b89f52fa4bb3409902`
- Revision tested: captured from ACA deploy evidence when run post-deploy; not mutated by this harness.
- Image digest: captured from ACA deploy evidence when run post-deploy; not mutated by this harness.
- Traffic %: read-only harness; does not shift traffic.
- Health status: read-only harness; route/API proof only.
- Base URL: https://app.abarva.ai
- Mode: chrome
- Routes tested: /admin, /admin/data-intake, /admin/candidate-preview, /admin/data-layer-explorer, /home, /home?candidatePreview=true
- Admin design fidelity: partially faithful
- Home design fidelity: wiring-only / visually not faithful
- Clicks classified: 22
- Dead/read-only primary click count: 17
- Verdict: not release-ready
- P0: 0
- P1: 24
- P2: 0

## Issues

- P1 · design fidelity: Admin design fidelity is partially faithful. (83% matched; missing: setup-control, Guardrail)
- P1 · design fidelity: Home design fidelity is wiring-only / visually not faithful. (36% matched; missing: Evidence Coverage, Answerability, Top Gaps, Ready Areas, Relationship Overview, Data Status, scoped aVa)
- P1 · click map: Admin Candidate Preview: no visible state change (click visible control classified as read-only-placeholder)
- P1 · click map: Admin View guide: missing (click visible control classified as failed)
- P1 · click map: Admin View template: missing (click visible control classified as failed)
- P1 · click map: Admin Download template: missing (click visible control classified as failed)
- P1 · click map: Admin Download full packet: missing (click visible control classified as failed)
- P1 · click map: Admin View field dictionary: missing (click visible control classified as failed)
- P1 · click map: Admin Promotion: no visible state change (click visible control classified as read-only-placeholder)
- P1 · click map: Admin Upload: missing (click visible control classified as failed)
- P1 · click map: Home Enterprise overview: no visible state change (click visible control classified as read-only-placeholder)
- P1 · click map: Home Summary: missing (click visible control classified as failed)
- P1 · click map: Home Sources: no visible state change (click visible control classified as read-only-placeholder)
- P1 · click map: Home Relationships: missing (click visible control classified as failed)
- P1 · click map: Home Explain context: missing (click visible control classified as failed)
- P1 · click map: Home Send to Intelligence: no visible state change (click visible control classified as read-only-placeholder)
- P1 · click map: Home Explain: missing (click visible control classified as failed)
- P1 · click map: Home Show gaps: missing (click visible control classified as failed)
- P1 · click map: Home What can Home answer: no visible state change (click visible control classified as read-only-placeholder)
- P1 · naming: Primary UI exposes architecture/internal label: Canonical Fact Store
- P1 · naming: Primary UI exposes architecture/internal label: Evidence Registry
- P1 · naming: Primary UI exposes architecture/internal label: Enterprise Relationship Graph
- P1 · naming: Primary UI exposes architecture/internal label: Derived Intelligence Store
- P1 · aVa scoped quality: Home aVa question did not return 200: What evidence supports this context? (status=422)

## Known Caveats

- This PR adds proof harnesses and generated reports only; it does not promote candidate data or update Active Tenant Access.
- Chrome mode captures DOM/API proof from a signed-in desktop tab. Console streams are not DevTools-complete in AppleScript mode.
- Screenshots can be blocked by local macOS permissions; DOM/API proof is primary.

## Final Verdict

Admin/Home are not release-ready against the ADMIN-HOME-DESIGN-SMOKE acceptance bar until P0/P1 findings are addressed or explicitly accepted.
