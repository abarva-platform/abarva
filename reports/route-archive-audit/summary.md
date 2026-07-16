# Route Archive Audit

Generated: 2026-07-16T02:27:41.371Z

Source HEAD: `11b354b64a4215e63dd2aba5983f3e079d36b9d5`

## Executive Summary

This report inventories Next.js App Router page routes and classifies them for a controlled route-retirement review. It does **not** move, delete, or redirect any route.

| Classification | Count | Meaning |
| --- | ---: | --- |
| keep | 173 | Active, public, nav-linked, access, or referenced routes. |
| redirect-candidate | 6 | Legacy alias routes that likely need redirects before retirement. |
| archive-candidate | 2 | Demo/dev/preview/docs routes with no detected references; suitable for owner review as archive candidates. |
| human-review | 27 | Product, admin, tenant, dynamic, or unclear routes that should not be archived automatically. |

Duplicate URL paths detected: 1

## Route Kinds

| Kind | Count |
| --- | ---: |
| access | 4 |
| admin-internal | 67 |
| demo-dev | 5 |
| docs | 8 |
| intelligence | 1 |
| knowledge-home | 6 |
| moves | 12 |
| other | 25 |
| preview | 5 |
| programs-legacy | 10 |
| public-marketing | 26 |
| public-root | 2 |
| source | 26 |
| sponsor | 2 |
| tenant-deep-link | 8 |
| tower | 1 |

## Duplicate URL Paths

These need owner review because multiple page files normalize to the same route after route-group removal.

| Route | Page files |
| --- | --- |
| `/` | `src/app/(public)/page.tsx`<br>`src/app/page.tsx` |

## Archive Candidates

These are the only routes this audit marks as potential archive candidates. They should still be reviewed by a human owner before moving out of `src/app`.

| Route | Confidence | Kind | Refs | Source | Reason |
| --- | --- | --- | ---: | --- | --- |
| `/_dev/agent-dock` | medium | demo-dev | 0 | `src/app/_dev/agent-dock/page.tsx` | demo/dev/preview route with no detected references |
| `/preview/nexus` | medium | preview | 0 | `src/app/(maestro)/preview/nexus/page.tsx` | demo/dev/preview route with no detected references |

## Redirect Candidates

These should be handled with redirects or compatibility decisions before any source route is retired.

| Route | Confidence | Kind | Refs | Source | Reason |
| --- | --- | --- | ---: | --- | --- |
| `/moves` | medium | moves | 33 | `src/app/(maestro)/moves/page.tsx` | legacy alias family; likely redirect to /strategic-moves |
| `/moves/:moveId` | medium | moves | 7 | `src/app/(maestro)/moves/[moveId]/page.tsx` | legacy alias family; likely redirect to /strategic-moves |
| `/programs/compare` | medium | programs-legacy | 5 | `src/app/programs/compare/page.tsx` | legacy alias family; likely redirect to /strategic-moves |
| `/programs/expert-kernel` | medium | programs-legacy | 0 | `src/app/programs/expert-kernel/page.tsx` | legacy alias family; likely redirect to /strategic-moves |
| `/programs/expert-kernel/expert-review` | medium | programs-legacy | 1 | `src/app/programs/expert-kernel/expert-review/page.tsx` | legacy alias family; likely redirect to /strategic-moves |
| `/programs/patterns` | medium | programs-legacy | 9 | `src/app/programs/patterns/page.tsx` | legacy alias family; likely redirect to /strategic-moves |

## Human Review

These are unlinked or ambiguous routes that are **not** safe to archive automatically because they may be role-gated, dynamic, tenant-scoped, or externally deep-linked.

| Route | Confidence | Kind | Refs | Source | Reason |
| --- | --- | --- | ---: | --- | --- |
| `/admin/connectors/:connectorId` | medium | admin-internal | 22 | `src/app/(maestro)/admin/connectors/[connectorId]/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/admin/connectors/:connectorId/reconnect` | medium | admin-internal | 21 | `src/app/(maestro)/admin/connectors/[connectorId]/reconnect/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/admin/onboarding/:session/confirm` | medium | admin-internal | 2 | `src/app/(maestro)/admin/onboarding/[session]/confirm/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/admin/programs/approvals/:requestId` | medium | admin-internal | 8 | `src/app/(maestro)/admin/programs/approvals/[requestId]/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/admin/segments/:segmentId` | medium | admin-internal | 32 | `src/app/(maestro)/admin/segments/[segmentId]/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/dossier/:threadId` | medium | other | 7 | `src/app/(maestro)/dossier/[threadId]/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/persons/:personId` | medium | other | 5 | `src/app/(maestro)/persons/[personId]/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/platform/admin/pilot/:tenantKey` | medium | admin-internal | 2 | `src/app/(maestro)/platform/admin/pilot/[tenantKey]/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/preview/deliverables/:deliverableCode` | medium | preview | 1 | `src/app/(maestro)/preview/deliverables/[deliverableCode]/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/preview/programs/:programSlug` | medium | preview | 10 | `src/app/(maestro)/preview/programs/[programSlug]/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/sign-in/*` | medium | other | 2 | `src/app/sign-in/[[...sign-in]]/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/source/events/:eventId` | medium | source | 643 | `src/app/(maestro)/source/events/[eventId]/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/source/events/:eventId/approval` | medium | source | 641 | `src/app/(maestro)/source/events/[eventId]/approval/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/source/events/:eventId/artifacts/:artifactId` | medium | source | 643 | `src/app/(maestro)/source/events/[eventId]/artifacts/[artifactId]/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/source/events/:eventId/file-cabinet` | medium | source | 643 | `src/app/(maestro)/source/events/[eventId]/file-cabinet/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/source/events/:eventId/gate` | medium | source | 643 | `src/app/(maestro)/source/events/[eventId]/gate/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/source/events/:eventId/report` | medium | source | 642 | `src/app/(maestro)/source/events/[eventId]/report/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/source/events/:eventId/scorecard` | medium | source | 643 | `src/app/(maestro)/source/events/[eventId]/scorecard/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/source/events/:eventId/value` | medium | source | 642 | `src/app/(maestro)/source/events/[eventId]/value/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/source/events/:eventId/vendors/:vendorId` | medium | source | 643 | `src/app/(maestro)/source/events/[eventId]/vendors/[vendorId]/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/source/events/:eventId/workspace` | medium | source | 642 | `src/app/(maestro)/source/events/[eventId]/workspace/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/source/learn/:slug` | medium | source | 12 | `src/app/(maestro)/source/learn/[slug]/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/source/patterns/:patternId` | medium | source | 35 | `src/app/(maestro)/source/patterns/[patternId]/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/source/renewal/:contractId` | medium | source | 15 | `src/app/(maestro)/source/renewal/[contractId]/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/source/renewal/:contractId/execution` | medium | source | 15 | `src/app/(maestro)/source/renewal/[contractId]/execution/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/sponsor/:engagementId` | medium | sponsor | 7 | `src/app/sponsor/[engagementId]/page.tsx` | dynamic or tenant-scoped route; may be deep-linked; has detected route-family references |
| `/strategic-moves/expert-kernel/dossier` | medium | moves | 0 | `src/app/(maestro)/strategic-moves/expert-kernel/dossier/page.tsx` | product/internal route with no literal refs; needs owner review |

## Keep Sample

The full keep list is in `routes.json` and `routes.csv`. The first 40 kept routes are shown here for quick review.

| Route | Confidence | Kind | Refs | Source | Reason |
| --- | --- | --- | ---: | --- | --- |
| `/` | high | public-root | 33 | `src/app/(public)/page.tsx` | primary app route |
| `/` | high | public-root | 33 | `src/app/page.tsx` | primary app route |
| `/access` | high | access | 8 | `src/app/access/page.tsx` | auth/access route |
| `/access-denied` | high | access | 5 | `src/app/access-denied/page.tsx` | auth/access route |
| `/admin` | high | admin-internal | 489 | `src/app/(maestro)/admin/page.tsx` | primary app route |
| `/admin/agent-readiness` | high | admin-internal | 41 | `src/app/(maestro)/admin/agent-readiness/page.tsx` | referenced by shell/navigation config |
| `/admin/audit` | medium | admin-internal | 44 | `src/app/(maestro)/admin/audit/page.tsx` | has detected code/docs/test references |
| `/admin/candidate-preview` | medium | admin-internal | 14 | `src/app/(maestro)/admin/candidate-preview/page.tsx` | has detected code/docs/test references |
| `/admin/cfo-attestation` | medium | admin-internal | 2 | `src/app/(maestro)/admin/cfo-attestation/page.tsx` | has detected code/docs/test references |
| `/admin/compliance` | high | admin-internal | 13 | `src/app/(maestro)/admin/compliance/page.tsx` | referenced by shell/navigation config |
| `/admin/connectors` | high | admin-internal | 87 | `src/app/(maestro)/admin/connectors/page.tsx` | referenced by shell/navigation config |
| `/admin/context-layer` | medium | admin-internal | 32 | `src/app/(maestro)/admin/context-layer/page.tsx` | has detected code/docs/test references |
| `/admin/context-layer/approval-queue` | medium | admin-internal | 10 | `src/app/(maestro)/admin/context-layer/approval-queue/page.tsx` | has detected code/docs/test references |
| `/admin/context-layer/evidence-map` | medium | admin-internal | 1 | `src/app/(maestro)/admin/context-layer/evidence-map/page.tsx` | has detected code/docs/test references |
| `/admin/context-layer/syncs` | medium | admin-internal | 3 | `src/app/(maestro)/admin/context-layer/syncs/page.tsx` | has detected code/docs/test references |
| `/admin/context-layer/templates` | medium | admin-internal | 11 | `src/app/(maestro)/admin/context-layer/templates/page.tsx` | has detected code/docs/test references |
| `/admin/context-layer/triage` | medium | admin-internal | 5 | `src/app/(maestro)/admin/context-layer/triage/page.tsx` | has detected code/docs/test references |
| `/admin/context-layer/uploads` | medium | admin-internal | 39 | `src/app/(maestro)/admin/context-layer/uploads/page.tsx` | has detected code/docs/test references |
| `/admin/corpus` | medium | admin-internal | 1 | `src/app/(maestro)/admin/corpus/page.tsx` | has detected code/docs/test references |
| `/admin/cross-program-signals` | medium | admin-internal | 15 | `src/app/(maestro)/admin/cross-program-signals/page.tsx` | has detected code/docs/test references |
| `/admin/customer` | high | admin-internal | 16 | `src/app/(maestro)/admin/customer/page.tsx` | referenced by shell/navigation config |
| `/admin/data-layer-explorer` | high | admin-internal | 41 | `src/app/(maestro)/admin/data-layer-explorer/page.tsx` | referenced by shell/navigation config |
| `/admin/data-trust` | high | admin-internal | 107 | `src/app/(maestro)/admin/data-trust/page.tsx` | referenced by shell/navigation config |
| `/admin/deploy-crawl` | medium | admin-internal | 3 | `src/app/(maestro)/admin/deploy-crawl/page.tsx` | has detected code/docs/test references |
| `/admin/depth-scorecard` | medium | admin-internal | 3 | `src/app/(maestro)/admin/depth-scorecard/page.tsx` | has detected code/docs/test references |
| `/admin/dossiers` | medium | admin-internal | 11 | `src/app/(maestro)/admin/dossiers/page.tsx` | has detected code/docs/test references |
| `/admin/inbox` | high | admin-internal | 14 | `src/app/(maestro)/admin/inbox/page.tsx` | referenced by shell/navigation config |
| `/admin/instruments` | medium | admin-internal | 1 | `src/app/(maestro)/admin/instruments/page.tsx` | has detected code/docs/test references |
| `/admin/knowledge-preview` | medium | admin-internal | 10 | `src/app/(maestro)/admin/knowledge-preview/page.tsx` | has detected code/docs/test references |
| `/admin/ops` | high | admin-internal | 11 | `src/app/(maestro)/admin/ops/page.tsx` | referenced by shell/navigation config |
| `/admin/outputs` | high | admin-internal | 5 | `src/app/(maestro)/admin/outputs/page.tsx` | referenced by shell/navigation config |
| `/admin/patternops` | high | admin-internal | 4 | `src/app/(maestro)/admin/patternops/page.tsx` | referenced by shell/navigation config |
| `/admin/pilot-package` | medium | admin-internal | 2 | `src/app/(maestro)/admin/pilot-package/page.tsx` | has detected code/docs/test references |
| `/admin/policies` | high | admin-internal | 17 | `src/app/(maestro)/admin/policies/page.tsx` | referenced by shell/navigation config |
| `/admin/production-readiness` | high | admin-internal | 67 | `src/app/(maestro)/admin/production-readiness/page.tsx` | referenced by shell/navigation config |
| `/admin/programs` | medium | admin-internal | 2 | `src/app/(maestro)/admin/programs/page.tsx` | has detected code/docs/test references |
| `/admin/programs/approvals` | medium | admin-internal | 42 | `src/app/(maestro)/admin/programs/approvals/page.tsx` | has detected code/docs/test references |
| `/admin/releases` | high | admin-internal | 36 | `src/app/(maestro)/admin/releases/page.tsx` | referenced by shell/navigation config |
| `/admin/segments` | medium | admin-internal | 2 | `src/app/(maestro)/admin/segments/page.tsx` | has detected code/docs/test references |
| `/admin/setup` | high | admin-internal | 114 | `src/app/(maestro)/admin/setup/page.tsx` | referenced by shell/navigation config |

## Method Notes

- Route paths are derived from `src/app/**/page.tsx`.
- Route groups such as `(maestro)` and `(public)` are removed from URL paths.
- Dynamic segments are normalized to `:param`; catch-all segments are normalized to `*`.
- References are literal-code scans across `src`, `docs`, `scripts`, `tests`, package metadata, middleware, and Next config.
- A route can be unreferenced and still active if it is externally deep-linked, role-gated, or reached through dynamic data. Those routes are intentionally marked `human-review`, not `archive-candidate`.
