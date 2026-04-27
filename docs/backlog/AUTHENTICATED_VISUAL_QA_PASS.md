# AbarVa Authenticated Visual QA Pass

Date: 2026-04-26
Owner lens: Atlas
Execution mode: in-app browser review against the live `app.abarva.ai` routes

## Purpose

This document records the authenticated visual QA pass for the highest-value routes currently attached to the WAVE-21 brand and design-system backlog.

The intent is not to declare the product visually complete. The intent is to answer four practical questions:

1. Do the target routes resolve?
2. Do they render through the expected shell and brand posture?
3. Do they follow the approved warm off-white, restrained, workflow-first canon?
4. What must be fixed before more visual polish claims or screenshot-heavy founder review?

## Routes reviewed

- `/source`
- `/source/events/evt-source-data-ai-si-selection`
- `/platform/admin/experience-gallery`
- `/platform/admin/production-readiness`

## Session notes

### Browser/auth behavior observed

The live browser session showed mixed authentication signals:

- the app landing experience initially exposed an account-menu control for `demo+clerk_test`
- the target review routes rendered a signed-out top nav with `Login`
- both admin routes resolved, but the visible route body stopped at an `Admin access only` guard state instead of the richer route content expected from the underlying implementation work

Interpretation:
- route reachability is proven
- visual/auth continuity is not yet proven
- admin-route review is only partially complete because the live session did not stay in a stable administrator posture across the reviewed route set

This is a real finding, not a tooling artifact.

## Executive outcome

Overall result: `partial / blocked`

Why:
- the routes exist and load
- Source workflow pages show meaningful product content
- the visual system is inconsistent across the reviewed surfaces
- the admin routes do not expose the actual gallery/readiness internals in the reviewed session
- the Source surfaces still lean heavily on a dark shell, which conflicts with the approved warm off-white primary-canvas canon

## Route-by-route findings

### 1. `/source`

Status: `fail`

What passed:
- route resolves successfully
- Source-specific content is visible
- workflow framing is clear: dashboard, events, value ledger, event flow, mission load, exposed value
- deterministic disclosure is present

What failed:
- the top nav appears as a signed-out public shell instead of a product-authenticated operating shell
- the page uses a full dark hero/page treatment rather than the approved warm off-white primary canvas
- the route still feels closer to an older dark dashboard language than the intended restrained AbarVa operator surface

Design interpretation:
- workflow clarity: pass
- visual canon: fail
- route ownership confidence: partial

Required remediation:
- confirm the active authenticated shell for `/source`
- remove the dominant dark-shell treatment from the primary dashboard canvas
- re-run authenticated review after shell correction

### 2. `/source/events/evt-source-data-ai-si-selection`

Status: `partial fail`

What passed:
- route resolves successfully
- event-canvas content is rich and coherent
- journey tracker, stage gate readiness, and event context are visible
- Source workflow structure is clear and differentiated
- deterministic disclosure is present

What failed:
- the top nav again renders as a signed-out shell
- the page still opens with a dominant dark presentation that conflicts with the approved off-white default
- the route visually mixes strong workflow content with legacy dark-shell cues

Design interpretation:
- workflow clarity: strong pass
- agent/workflow posture: pass
- visual canon: fail on shell/background dominance

Required remediation:
- keep the event-canvas information architecture
- swap the surrounding shell and hero treatment to the approved lighter canon
- verify whether the active route is still passing through an older shell/nav path

### 3. `/platform/admin/experience-gallery`

Status: `deferred / partial`

What passed:
- route resolves successfully
- visible shell is warm off-white and closer to the approved canon
- page heading and platform-context framing are present

What failed or remained blocked:
- the route body stops at `Admin access only`
- the expected gallery sections are not visible in this session
- live verification of the actual gallery content is therefore incomplete
- the top nav still appears in a signed-out public posture

Design interpretation:
- base visual direction: pass
- actual gallery-surface verification: deferred
- authenticated admin continuity: fail / unresolved

Required remediation:
- confirm the intended admin auth posture for this route
- re-run the route review in a stable admin-authorized session
- only after that should screenshot polish or gallery-driven founder review claims proceed

### 4. `/platform/admin/production-readiness`

Status: `deferred / partial`

What passed:
- route resolves successfully
- visible shell is warm off-white and restrained
- page heading, question framing, and deterministic disclaimer are visible

What failed or remained blocked:
- the route body stops at `Admin access only`
- the actual readiness tracker internals are not visible in this review session
- the top nav remains in a signed-out public posture

Design interpretation:
- base visual direction: pass
- actual readiness-tracker verification: deferred
- authenticated admin continuity: fail / unresolved

Required remediation:
- verify admin-route auth behavior
- re-run the route under a stable authorized session before claiming the admin tracker is visually reviewed end to end

## Cross-route findings

### Finding A: shell/auth continuity is the biggest visible issue

The most important shared finding is not typography or spacing. It is route-shell continuity.

The reviewed routes do not present a clean, confidence-building authenticated operating shell. Instead:

- the source routes look like product content mounted inside a public/signed-out top shell
- the admin routes resolve but stop at an access guard

This is the clearest reason not to treat visual QA as complete yet.

### Finding B: Source content quality is ahead of Source shell quality

The Source workflow information architecture is better than the shell it is currently living in.

That is good news:
- the core product logic and read-model presentation are increasingly coherent

It is also a risk:
- the shell can make the product feel older and less premium than the workflow design actually is

### Finding C: Admin visual direction is closer to canon than Source shelling

The visible admin route surfaces use the warmer, calmer visual direction more successfully than the Source routes reviewed here.

However, because both admin routes stop at an access-guard state, the review cannot yet certify the underlying page interiors.

## Design-canon scorecard

| Check | `/source` | `/source/events/...` | `/platform/admin/experience-gallery` | `/platform/admin/production-readiness` |
|---|---|---|---|---|
| Route resolves | pass | pass | pass | pass |
| Authenticated shell continuity | fail | fail | fail / deferred | fail / deferred |
| Warm off-white primary canvas | fail | fail | pass | pass |
| Workflow clarity | pass | strong pass | partial | partial |
| Brand/wordmark trust | partial | partial | partial | partial |
| Ready for founder screenshot use | no | not yet | no | no |

## Screenshot/manual review status

- Route screenshots were reviewed live in the in-app browser session.
- No screenshot files were exported into the repo by this slice.
- The review is sufficient for route-level pass/fail findings.
- The review is not sufficient for final founder screenshot-pack approval because the authenticated admin state was not stable.

## What this pass proves

- the four target routes exist on the live app
- Source routes currently render meaningful workflow content
- admin routes currently resolve to a guard/access state in the reviewed session
- the approved light-canon visual direction is not yet consistently controlling Source route presentation

## What this pass does not prove

- that the user sees the same auth state in their normal browser
- that the underlying admin gallery/tracker internals are fully reviewed visually
- that the Source shell is fully migrated to the approved active-route canon
- that the product is ready for polished founder screenshots without further shell/auth verification

## Recommended next action

1. Verify the live authenticated shell and role posture for Source and Admin routes in the primary browser session used by the team.
2. Prioritize route-shell ownership cleanup where Source still renders through a dark or signed-out shell.
3. Re-run the admin route review once the session clearly holds platform-admin access.
4. Only after those steps should `DESIGN1` or other screenshot-polish slices move forward.

## Final judgment

VIS2 should be treated as a successful route-discovery and issue-isolation pass, not as a full visual signoff.

The key outcome is clarity:
- the routes are there,
- the Source workflow spine is real,
- the shell/auth layer is the visible weakness,
- and the admin visual proof remains incomplete until an authorized session exposes the actual interiors.
