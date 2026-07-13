# HOME-SMOKE-PR1 — End-to-End Home Smoke Proof

- Test run timestamp: 2026-07-13T03:43:13.861Z
- SHA tested: `673b565e816303f63bc079177def30cd8a03cac8`
- Revision tested: captured from ACA deploy evidence when run post-deploy; not mutated by this harness.
- Image digest: captured from ACA deploy evidence when run post-deploy; not mutated by this harness.
- Traffic %: read-only harness; does not shift traffic.
- Health status: read-only harness; route/API proof only.
- Base URL: https://app.abarva.ai
- Mode: chrome
- Routes tested: `/home`, `/home?candidatePreview=true`
- Clicks classified: 17
- Verdict: not release-ready
- P0: 0
- P1: 3
- P2: 0

## Issues

- P1 · click map: Explain context: no visible state change (click primary action classified as read-only-placeholder)
- P1 · click map: Send to Intelligence: no visible state change (click primary action classified as read-only-placeholder)
- P1 · aVa scoped Home quality: Home aVa question did not return 200: What evidence supports this context? (status=422)

## Known Caveats

- This PR adds proof harnesses and generated reports only; it does not promote candidate data or update Active Tenant Access.
- In `chrome` mode, screenshots may depend on macOS screen-capture permissions. DOM/API proof remains the primary machine-readable evidence.

## Final Verdict

Home is not release-ready against the HOME-SMOKE acceptance bar until P0/P1 findings are addressed or explicitly accepted.
