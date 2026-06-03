# Product Release Environment Plan

Status: candidate
Owner: AbarVa release owner
Audience: founder, engineering, client sponsor, client security reviewer

## Purpose

AbarVa needs a structured release path before the first client pilot and a
more formal promotion model before the second and third clients. This plan
defines what each environment means, what must be tested before promotion, and
how the meaning of `production` changes as the customer base grows.

Use with:

- `docs/runbooks/release-cadence.md`
- `docs/runbooks/rollback.md`
- `docs/deployment/migrations.md`
- `docs/architecture/adr/ADR-0007-vercel-control-plane-posture.md`
- `docs/architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md`
- `.github/workflows/release-control.yml`
- `.github/workflows/post-deploy-crawl.yml`
- `.github/workflows/sec-p0-post-deploy.yml`

## Environment Ladder

| Environment | What it is | Data allowed | Primary purpose | Promotion gate |
| --- | --- | --- | --- | --- |
| Local dev | Developer machine and local/private lab. | Synthetic or local-only test data. | Fast build, unit tests, local smoke, private dependency simulation. | Focused tests and no accidental secrets. |
| PR preview | Vercel preview for a pull request. | Synthetic/demo data only; no production client data. | Reviewer QA, visual checks, route smoke, CI validation. | Required CI checks and release record. |
| Pre-prod / staging | Stable preview or dedicated staging deployment tracking release candidates. | Synthetic pilot-scale data; approved non-production client fixtures only when contracted. | End-to-end rehearsal before production promotion. | Browser, auth, tenant isolation, release, and data-plane checks. |
| Pilot production | Live environment for the first paying pilot. | Approved data for one client within that client's boundary. | Operate the pilot under SOW, support, security, and release controls. | Planned release window or emergency release process. |
| Multi-client production | Live environment for two or more clients. | Approved data for each client, isolated by client boundary. | Operate shared control plane and multiple client data planes safely. | Per-client blast-radius review and stronger change windows. |

## What `Production` Means

### First client pilot

`Production` means one paying client uses the live AbarVa application and the
approved client-scoped data plane for contracted pilot workflows.

The operational standard is:

- one active client,
- one-client data boundary,
- approved pilot users and roles,
- support model in `docs/pilot/SUPPORT-MODEL.md`,
- release records for non-trivial changes,
- rollback path for app/runtime regressions,
- no unsupported cross-client claims,
- no broad availability/SLA claims beyond the pilot support model.

The first-client production environment can still be founder-operated, but it
must not be casual. It needs evidence, release control, client-safe incident
language, and a clear no-go path for data or isolation risk.

### Two or three clients

`Production` becomes a shared SaaS control plane with multiple client-scoped
data boundaries. The release process must become more conservative because a
global control-plane change can affect all clients even when data remains
client-scoped.

Additional requirements before the second live client:

- per-client release impact classification,
- tenant/client isolation probes after production deploy,
- client-by-client smoke matrix for primary surfaces,
- client notice rules for planned maintenance,
- stricter feature flags for risky modules,
- written rule for which client receives a change first,
- operational owner for release notes and incident updates.

Additional requirements before the third live client:

- standing pre-prod/staging environment with stable seeded data,
- scheduled release windows for non-emergency client-impacting changes,
- automated post-deploy crawl against all active client personas,
- regression dashboard for auth, tenant isolation, agent quality, Source,
  Moves, Tower, and Admin,
- documented canary strategy or one-client-first rollout path,
- quarterly release and access review evidence.

## Release Flow

| Step | Required action |
| --- | --- |
| 1. Branch | Create a focused branch from current `origin/main`. |
| 2. Classify | Choose release lane, affected layer, clients affected, rollout, rollback. |
| 3. Validate locally | Run focused tests plus broader checks proportional to blast radius. |
| 4. Open PR | Include release record for release-relevant changes. |
| 5. PR preview | Use Vercel preview for browser/visual/workflow verification. |
| 6. Pre-prod/staging | Promote or deploy the candidate for integrated smoke when the change can affect pilot workflows. |
| 7. Production promotion | Merge only after green checks and release-owner decision. |
| 8. Post-deploy evidence | Run post-deploy crawl, tenant-isolation checks, and focused smoke. |
| 9. Release note | Record what shipped, who was affected, validation, rollback, known gaps. |

## Required Gates by Change Type

| Change type | Minimum gate before production |
| --- | --- |
| Docs-only internal | `git diff --check`, release check if release-relevant. |
| Public/demo page | Lint/build or focused test, accessibility where applicable, Vercel preview visual check. |
| Auth/role/admin | Focused auth tests, browser smoke, tenant/client denial proof. |
| Client data-plane schema | Migration dry-run/apply in safe target, release record, rollback/repair plan. |
| Ingestion/parsing/retrieval | Synthetic data load, quarantine/sensitive-data check, retrieval smoke, audit evidence. |
| AI/agent behavior | Agent-quality corpus, no-auto-action boundary, AI surface catalog, citation/disclaimer checks. |
| Source/Moves/Tower workflow | Focused integration/E2E, export/download check if artifacts changed. |
| Cross-client or control-plane change | SEC-P0 tenant-isolation probes and all-client smoke matrix. |

## Pre-Prod / Staging Definition

Pre-prod should be a stable environment, not a random PR preview. Until a
dedicated staging project exists, AbarVa can designate a protected Vercel
preview deployment as the release-candidate environment, but the evidence must
say that explicitly.

Pre-prod should include:

- stable seeded clients and personas,
- synthetic pilot-scale data,
- SSO/role simulation,
- Source/Moves/Tower/Admin smoke paths,
- data-load and quarantine rehearsal,
- agent-quality golden/adversarial run,
- Azure connectivity smoke when private data-plane credentials are available,
- no real customer data unless the customer has approved non-production use.

## First-Client Release Policy

For the first pilot client:

- Ship small, reversible changes.
- Avoid more than one high-risk release per week unless it is a containment fix.
- Do not ship data-plane or auth changes late Friday unless emergency.
- Notify the client before planned downtime or workflow-impacting changes.
- Run post-deploy focused smoke on the pilot's active workflows.
- Keep release notes plain-English and buyer-readable.

## Multi-Client Release Policy

Before the second and third pilots:

- Default risky features to off unless enabled for a specific client.
- Use one-client-first rollout for workflow changes.
- Maintain a per-client impact table in the release record.
- Keep client data-plane changes physically or logically scoped.
- Separate global-control incidents from client-data incidents.
- Run tenant-isolation probes after any global-control release.
- Do not reuse one client's data to validate another client's release.

## Production Promotion Checklist

- [ ] Branch is current with `origin/main`.
- [ ] Release lane and affected clients are explicit.
- [ ] Release record exists when required.
- [ ] CI is green.
- [ ] Vercel preview is available for reviewer smoke when UI/runtime changed.
- [ ] Pre-prod/staging smoke is complete for pilot-impacting changes.
- [ ] Rollback path is known.
- [ ] Client notice is sent if required.
- [ ] Post-deploy smoke owner is named.

## No-Go Conditions

Do not promote when:

- tenant/client isolation is unproven after a relevant change,
- auth or role behavior is ambiguous,
- migration rollback/repair path is unknown,
- data-load quarantine path is bypassed,
- AI outputs lose human-decision, citation, or disclaimer controls,
- preview differs materially from production configuration and no staging smoke
  exists,
- release owner cannot explain blast radius in plain English.

## Open Decisions

| Decision | Needed before |
| --- | --- |
| Dedicated Vercel staging project vs. protected preview convention | First live client if pilot workflows change weekly. |
| Which seeded clients/personas form the staging smoke roster | First live client. |
| Client notification window for non-emergency downtime | First SOW. |
| Canary/one-client-first feature flag mechanism | Second live client. |
| Automated all-client production smoke matrix | Second or third live client. |
| External status page | Production tier after pilot or if contract requires it. |
