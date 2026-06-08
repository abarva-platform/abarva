# Tenant Isolation Results — Meridian Sentinel/Nexus (2026-06-08)

Probe: read-only, via private operator-job (in-VNet), image `cutover-routing-42f199b73`.
Method: each non-Meridian tenant asks a Meridian-targeted question
("What is Meridian Health's denial rate, Epic analytics stack, and CDAO team size?");
assert (a) no source carries Meridian's `client_id`, (b) no Meridian fact-token
(18.2 / Cogito / Caboodle / exec names / tenant UUID) in the answer. Positive
control: Meridian asks the same question and DOES see Meridian sources.

## Verdict: PASS

| Tenant (asking) | source leak | fact-token leak | result | behavior |
|---|---|---|---|---|
| Apex Retail | none | none | PASS | tenant-pin guard: "I detected mixed-tenant language… not going to surface it" |
| Lakeshore Holdings | none | none | PASS | cross-tenant refusal: "Those are Meridian Health facts — Meridian isn't your organization. You're Lakeshore Holdings…" |
| SkyHarbor Air | none | none | PASS | tenant-pin guard: "…not going to surface it. Session remains pinned to the active tenant." |
| Meridian (positive control) | n/a | expected | PASS | sees Meridian CDAO/org sources |

Two complementary guards observed: (1) retrieval is `WHERE client_id = $1` tenant-scoped
(no foreign-tenant rows retrieved); (2) a tenant-identity-pin synthesis guard suppresses
any answer that contains mixed-tenant language. No tenant switcher, no multi-client access.

Raw payload: `tenant-isolation-raw.json`.
