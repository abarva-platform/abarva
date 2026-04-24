# 03 Scope Workspace Wireframe

## 1. Purpose Of The Screen Or Component

The Scope Workspace is the active stage workspace for defining event boundaries, required inputs, assumptions, dependencies, risks, and readiness before sourcing strategy or RFP generation begins.

## 2. Primary User Question

"Is the scope complete enough to move forward, and what is still missing?"

## 3. Text-Based Wireframe

```text
+--------------------------------------------------------------------------------+
| Scope Stage                                                                     |
| Goal: lock event boundaries before sourcing strategy and RFP package generation |
| Readiness: 62% | Gate: Not ready | Missing required inputs: 2                  |
+--------------------------------------------------------------------------------+
| Required Inputs                                                                 |
| [MISSING] Application inventory                      Owner: Client PMO Lead     |
| [MISSING] Current analytics workload baseline        Owner: Client PMO Lead     |
| [READY]   Current vendor landscape                   Owner: Procurement Lead    |
| [READY]   Target platform constraints                Owner: CTO delegate        |
+--------------------------------------+-----------------------------------------+
| In Scope                              | Out Of Scope                            |
| - Data platform SI selection          | - ERP transformation                     |
| - Analytics migration factory         | - Managed infrastructure rebid           |
| - AI enablement roadmap               | - Product engineering vendor selection   |
+--------------------------------------+-----------------------------------------+
| Assumptions                           | Dependencies                             |
| - Event value depends on migration    | - Finance validates savings baseline     |
|   savings and report rationalization  | - Security confirms cloud constraints    |
+--------------------------------------------------------------------------------+
| Risks                                                                           |
| ! Scope may be too broad for one RFP if app inventory expands materially.       |
| ! Missing workload baseline weakens vendor sizing and commercial comparison.    |
+--------------------------------------------------------------------------------+
| Gate Status: Not ready | Nexus: Do not generate RFP until missing inputs clear. |
+--------------------------------------------------------------------------------+
```

## 4. Layout Zones

- Stage header: goal, readiness score, gate state, missing required inputs.
- Required inputs panel: input status, owner, due date later.
- Scope definition grid: in-scope and out-of-scope.
- Assumptions/dependencies grid.
- Risks panel.
- Gate status and Nexus recommendation footer.

## 5. Above-The-Fold Content

- Stage goal.
- Readiness and gate status.
- Missing required inputs.
- In-scope/out-of-scope boundary.

## 6. Interaction Notes

- Required input rows should later open upload/link drawers.
- In-scope/out-of-scope edit controls should not be built until the static UX is approved.
- Gate status should explain why the stage cannot advance.
- Nexus recommendation should change based on readiness and missing inputs.

## 7. Responsive Behavior

- Desktop: two-column scope grids.
- Tablet: required inputs full width; scope and assumptions stack into two rows.
- Mobile: single-column cards with status chips and concise row metadata.

## 8. What Should Not Appear

- No free-form long questionnaire as the first experience.
- No RFP generation button when gate is not ready.
- No vendor response detail.
- No fake evidence citations unless source objects exist.
- No decorative readiness score without reasons.

## 9. Acceptance Criteria

- The workspace names the exact missing inputs preventing progress.
- The scope boundary is explicit and easy to review.
- Readiness score is explained by missing inputs, assumptions, risks, and dependencies.
- Gate status prevents premature downstream artifact generation.
- Nexus gives a specific next action and explains what cannot be trusted yet.
