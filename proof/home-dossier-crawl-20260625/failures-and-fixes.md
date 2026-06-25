# Failures And Fixes

## Fixed

- False-refusal class: added regression coverage so the SkyHarbor org question cannot answer with `cannot be characterized` or `cannot be identified`.
- Internal-language leak: removed user-visible `packet` wording from the composer and added a quality-gate check for it.
- Tenant label polish: mapped `skyharbor` to `SkyHarbor Air` and `lakeshore` to `Lakeshore Holdings`.
- Possessive polish: rendered `Lakeshore Holdings'` instead of `Lakeshore Holdings's`.

## Blocked / Pending

- Local signed-in browser crawl is blocked by Clerk session routing in this environment.
- Production browser crawl against the new path is pending merge/deploy.
