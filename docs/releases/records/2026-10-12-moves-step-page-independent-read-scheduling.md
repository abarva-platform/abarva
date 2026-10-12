# 2026-10-12 — Moves independent source scheduling and blocked empty state

## Release ID

`2026-10-12-moves-step-page-independent-read-scheduling`

## Status

`candidate`

## Plain-English Summary

The deployed shared-read repair improved 18 of 20 reachable views to full speed. P2 Validate and P2 Gate still exceed 2.5 seconds. This follow-up shares the existing per-Move access policy between canonical source authorization and page permissions, reuses the already-read latest phase snapshot for the Move status, starts participant-name reads as soon as participant IDs arrive, and starts discovery evidence readiness alongside the Move projection. Approved evidence and the review backlog remain separate queries with their original tenant/Move predicates and limits; they now run together on the flagged path. A failed flagged read remains unavailable.

The blocked P2 work area now uses the template's existing empty-state presentation. Its refusal and saved-answer message stay visible and Continue remains disabled. This corrects an observed template regression; it does not turn the blocked state into a completed one.

The existing step pages also share their theme with the notes panel and switch interactive foreground/background palettes together. Explicitly labelled trigger and problem paragraphs remain separate. Historical P0 reads show the recorded phase approval separately from the origination request and Move lifecycle; role placeholders and automated reviewer attribution remain explicit. Charter basis writes wait for saved answers and the previous write, and client readback adopts the full authoritative basis map. Future unsigned briefs distinguish the canonical Move archetype from its declared discovery archetype; existing signed versions are retained.

The flagged capture path preserves existing stored answers, including deliberately blank answers. A narrowly scoped correction command on the existing capture route can restore four retained reviewed fields after the original approver reviews a before/retained preview. It requires current permission, actual P1, unchanged capture/source/snapshot/signature revisions, an accepted source record where available, and a signed version-one binding. A single serializable transaction changes only those P0 values, records a mandatory audit and reads back the result. Charter, approval, original request, signed version, all other modules, statuses and completion flags are preserved; an uncertain commit is reported as requiring readback before retry.

P1–P4 gate pages expose the existing transition workbook download, parse and accepted-review producer beside its required build evidence. Build and gate requirements remain enforced.

## Layer Impact

- Lane: `global-control-lane`, within existing tenant step-page flags.
- Layer 3: existing program, membership, participant, snapshot and evidence sources retain their authority. No schema, migration, dataset, seed or calculation change. The existing capture command gains a guarded retained-input correction.
- Layer 4: request scheduling and the standard blocked empty state change. Policy sharing remains inside one authenticated request with the exact tenancy context and Move fence; no result persists across requests.
- Intake owners and adapters retain their existing contracts. Approval records remain unchanged. Stored answers change only through the explicit scoped correction command.

## Client Applicability

- All clients: default and legacy readers retain their existing scheduling and error contracts.
- Specific clients: only workspaces already enrolled in the existing step-page flags receive these request options.
- Internal only: no.
- Public/demo only: no.
- Feature flags: existing `moves_capture_v2`, `moves_step_pages_v3`, `moves_step_pages_p0p1_v1`, `moves_step_pages_p4p5_v1`, and `moves_extended_intake_fields_v1`; enrollment is unchanged.

## Changes Included

- Share the canonical per-Move policy and its failure across source authorization and page permissions. Denial, financial restrictions, sponsor exclusions and tenant/Move fences remain canonical.
- Reuse the already-read latest snapshot for the status projection; preserve historical activity limits and terminal P5 completion.
- Start participant names after their required IDs arrive, while other projection reads are pending.
- Start discovery readiness before the Move projection completes. Preserve its declared blueprint; an unreadable Move cannot launch evidence reads.
- Run approved and pending/rejected evidence queries concurrently on this flagged path, keeping their independent limits and exact tenant/Move predicates. Either failure stays unavailable.
- Render the existing blocked P2 saved-answer message through the standard empty-state component; keep the refusal, disabled Continue and no-save behavior.
- Reconcile actual landed main without rebasing, and record the preceding release's actual deployment and failed acceptance.

## QA / Validation

- PASS: eight reproduced assertions failed before the repair and pass afterward.
- PASS: 1823 focused and affected tests in 66 unique suites on the prepared source, including the current predecessor; the route scheduling case executes the real server page with all data and authority dependencies mocked. No database was touched.
- HISTORICAL PASS: ten scheduling mutations detected individually: policy sharing, canonical reader wiring, early page readiness, parallel approved/backlog reads, each failed-read path, unreadable Move refusal, early participant names, shared latest snapshot and the blocked empty state. Every source was restored.
- PASS: final current-source typecheck and changed-code lint. 71 mutations were detected individually (68 source behaviors and three actual CSS behaviors); every source was restored.
- PASS: final regenerated manual/coverage/tenancy checks, library/route/export reachability and all six corpus validators after reconciling actual main `9c76c564`.
- PASS: 28 actual component/CSS variants covering text capture, notes, recorded approval, retained-input correction and the actual transition workbook controls pass at 390 and 1440 in both themes, with no contrast violations or horizontal overflow. Temporary render probes were removed. This is local component proof; the full signed-in shell remains to be validated.
- HISTORICAL PASS: the real blocked component/CSS at 390 and 1440 in both themes has no contrast violations or horizontal overflow. The temporary render probe was removed; three existing local CSS browser checks also pass.
- PASS: all 11 final local release gates on the reconciled source. Node 24.15.0 is the validation runtime.
- PENDING: exact new-head remote CI and the immediate fresh all-open fetched guard.
- PASS: an independent immutable `9c76c56420c65b4fd94aeeba7e6e99ab69881d7c` source export regenerates 2854 and matches every candidate count field. Zero new N test files and genuine delta zero; no count is edited by hand.
- FAIL: preceding deployed acceptance on `5afb6c4e`, as shown below. No follow-up deployed timing exists yet.

## Before / After Timing

Observed settled-head milliseconds from independently downloaded stable walks; every follow-up after value is pending.

| View | Serving 691a1b43 before N9442 | Serving 5afb6c4e before this repair | Follow-up after |
| --- | ---: | ---: | --- |
| p0-signal | 2133 ms | 1694 ms | Pending |
| p0-scope | 1433 ms | 861 ms | Pending |
| p0-value | 1351 ms | 1009 ms | Pending |
| p0-owner-evidence | 1413 ms | 982 ms | Pending |
| p0-approve | 1506 ms | 945 ms | Pending |
| p1-sponsor-scope | 2123 ms | 1411 ms | Pending |
| p1-stakeholders | 1970 ms | 860 ms | Pending |
| p1-success | 1331 ms | 1179 ms | Pending |
| p1-evidence-change | 1658 ms | 915 ms | Pending |
| p1-charter-gate | 1527 ms | 939 ms | Pending |
| p2-evidence-plan | 2847 ms | 1292 ms | Pending |
| p2-baseline | 1391 ms | 837 ms | Pending |
| root-causes | 1380 ms | 996 ms | Pending |
| p2-validate | 3565 ms | 2693 ms | Pending |
| p2-gate | 4342 ms | 3416 ms | Pending |
| root-cause-design | 2300 ms | 1545 ms | Pending |
| architecture-options | 1781 ms | 1030 ms | Pending |
| operating-adoption | 1478 ms | 960 ms | Pending |
| rom-estimate | 1502 ms | 1322 ms | Pending |
| gate | 1466 ms | 1107 ms | Pending |

The five largest measured server contributors, excluding the aggregate route timer, were P2 Gate's Move projection (1438 ms), P2 Validate's Move projection (1060 ms), P2 Gate tenancy (976 ms), P2 Gate criteria (798 ms), and P2 Validate tenancy (775 ms). These overlap and must not be added. Discovery readiness began only after the Move projection; it added 398 ms on Validate and 367 ms on Gate. The measurements motivate this scheduling repair; local tests cannot promise runtime latency.

The stable N9442 after walk reached 20/29, UX 99, with 18 full-speed views. Evidence Plan's template dimension fell 20→16 versus baseline 38171682273. Exact blocked sentence: “Wait for the P2 evidence and gate readbacks to be available; open Gate readiness →”. Nine unavailable views state “Move is at P3”. Journey readback errors were empty. The separate deck test failed and remains with its own repair owner.

## Rollout Plan

Squash merge only after complete exact-current-head CI and the fresh actual fetched guard for all open Moves PRs including drafts and current shared-census candidates. Equal applicable carried counts hold until a genuine landing and reconciliation. Only the automatically triggered repo-owned main workflow promotes shared traffic. Verify its actual serving SHA and approved digest invariant, then inspect its automatic signed-in read-only walk. Every reachable view must settle in at most 2500 ms with no lower non-speed dimension than baseline 38171682273. Cover all 29 when the sole fresh-Move writer reaches P5.

## Deployment Authority

- Repo-owned workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this repair.
- Approved digest: assigned by the successful main deploy and verified from its artifact.
- ACA invariant: web template and the sole 100% traffic revision match that approved digest.
- Worker invariant: all required worker job images match that digest.
- Feature/env update path: none.
- Live signed-in proof: required; missing chunks, rollout-transition samples and PR discovery runs do not establish acceptance.

## Rollback Plan

Revert through a squash PR and the repo-owned main deployment, preserving the approved digest's rollback window. No stored answers, memberships, evidence, approvals or gate state are rewritten.

## Audit Evidence

- Preceding PR: https://github.com/abarva-platform/abarva/pull/9442, squash `5afb6c4e5fbc6f95f604568ce0c8b8ceb0e7ef5d`.
- Its automatic deploy: https://github.com/abarva-platform/abarva/actions/runs/38233784887.
- Its stable after walk: https://github.com/abarva-platform/abarva/actions/runs/38235262135, embedded serving `5afb6c4e5fbc6f95f604568ce0c8b8ceb0e7ef5d`.
- Independent web/100%-traffic/required-worker invariant: 10:39:40 UTC, revision `ca-abarva-web-lab-eastus--m5afb6c4e`, digest `sha256:f6fb6f6aef1285080b79bf2ae53bfc68d9992b77759f1f173ced78b4fbae09e0`.
- Earlier stable before: https://github.com/abarva-platform/abarva/actions/runs/38230025967, serving `691a1b43`.
- Follow-up source PR, exact-head CI, deployment and after proof remain pending.

## Known Gaps

- The preceding speed/template acceptance failed; this candidate has no deployed after sample.
- Full 29-view proof depends on the separate authorized writer's fresh journey. This task does not mutate that Move, its intake or protected evidence.
- Native intake reload and independent deck/artifact acceptance remain separate.
- The current before sample has two slow views and one non-speed regression; averages do not clear either failure.


## Additional Before Evidence

Walk [38248657090](https://github.com/abarva-platform/abarva/actions/runs/38248657090) embeds serving `025fbcfe` and passes twenty reachable views: UX 99, eighteen full-speed views, Validate 2873 ms and Gate 3254 ms. Evidence Plan's template dimension is 16 against the baseline's 20. This is before data for this candidate. The overall workflow failed its independent deck check; it does not establish fresh journey, full-29 or deck acceptance. No current candidate after timing exists.

## Current Release Limits

- Final new-head CI, fresh all-open fetched guard and deployed acceptance remain pending.
- The original approver must review and execute any displayed correction through the product, followed by independent native audit and preserved-binding verification. Local transaction tests do not establish runtime correction or downstream gate clearance.
- Full 29-view acceptance depends on the authorized journey owner reaching P5; existing twenty-view samples cannot prove it.
- Independent workbook review, participant assignment, original request lifecycle and signed artifact binding remain distinct governed actions and evidence.


## CI Reader Reconciliation

Exact head `f9db933fef7879af8aad4b8071d9b34ec557f30f` failed the AI surface catalog in [run 38273719001](https://github.com/abarva-platform/abarva/actions/runs/38273719001): an existing contrast-test regex did not recognize the grouped dark token selector. The reader now uses the existing CSS parser's selector list. Every WCAG AA and real-render assertion remains enforced. Reverting grouped-selector handling fails the test; changing the palette to insufficient contrast also fails it. Both probes were restored. The affected existing step-page suites are included in the final 66-suite local run. This repair requires complete checks on a new exact head; no workflow was rerun and the earlier failure is retained.
