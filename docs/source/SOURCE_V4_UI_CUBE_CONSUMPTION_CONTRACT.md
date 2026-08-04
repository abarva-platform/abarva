# Source v4 UI Cube Consumption Contract

**Status:** active contract for Source Workspace and aVa UI consumption.

This document defines how the richer Source v4 canary dataset changes the product layer. Cube is the governed semantic menu; the UI is the exploration and story surface. The UI should not create its own measures, infer tenant values, or promote usage into realized value.

## Runtime Boundary

```text
Source v4 raw and consumption views
  -> Cube v4 semantic views
  -> Source Workspace UI and aVa context
  -> evidence drill to source record, contract, vendor, invoice, service, SaaS, cloud, rate-card or sourcing event row
```

The active catalog is code-backed in:

```text
src/lib/source/data-model/source-v4-cube-ui-catalog.ts
```

The catalog is threaded into `/source/preview/workspace` through `SourceWorkspacePortfolioData.semanticLayer`, so the page and aVa receive the same semantic contract.

The workspace also receives a compact server-side aggregate snapshot from:

```text
src/lib/source/data-model/source-v4-workspace-snapshot.ts
```

That snapshot queries the same physical Source v4 tables behind the Cube views and exposes only portfolio counts, sums, availability states and top-N drill starters. It must not ship raw 195k-row extracts to the browser.

The same snapshot is summarized into the workspace aVa `surfaceContext`, including the explicit rule that AI usage, seats and cost do not prove realized value without baseline and finance validation.

## Recommended Source Workspace Story

| Tab             | Purpose                                                                   | Cube view                        |
| --------------- | ------------------------------------------------------------------------- | -------------------------------- |
| Portfolio       | Show scale, committed value, context coverage and renewal posture         | `source_v4_executive_portfolio`  |
| Concentration   | Show vendor/category/risk concentration without calling it savings        | `source_v4_vendor_concentration` |
| Renewals        | Turn term dates and notice windows into action                            | `source_v4_renewal_exposure`     |
| Scope           | Separate explicit application/platform scope from inferred relationships  | `source_v4_scope_confidence`     |
| Spend           | Bridge invoice lines, matching state, cost centers and off-contract spend | `source_v4_spend_consumption`    |
| Credits         | Show calculated, claimed and recovered SLA credits separately             | `source_v4_performance_credits`  |
| AI Value Proof  | Show AI tool usage, cost, baseline state and finance validation state     | `source_v4_ai_usage_value_proof` |
| Cloud           | Show service, region, commitment and overage posture                      | `source_v4_cloud_optimization`   |
| Rate Cards      | Show role/location/rate and approval divergence                           | `source_v4_workforce_rate_card`  |
| Sourcing Events | Show event stage, supplier response, BAFO and comparability               | `source_v4_sourcing_event_bafo`  |

## Qlik-Style Interaction Rules

- Every visible mark should be selectable and should filter the rest of the canvas.
- The page should expose clear-selection and selected-state chips.
- Drill paths should end at a real source record or evidence row, not a narrative-only panel.
- The left explorer should browse source domains and semantic views; the right rail should hold filters and current selection state.
- The center canvas should refresh in place on click. Navigation clicks should not create long vertical scroll as the primary interaction.

## Hard Honesty Rules

- AI adoption, active users, assigned seats or cost do not prove value.
- Developer productivity claims require before/after DORA or equivalent engineering-flow metrics.
- Workday, ServiceNow, Copilot, Claude Code or similar agent claims require baseline, observed outcome and finance validation.
- Unknown or unvalidated value must render as unknown, not `$0`.
- Off-contract spend, service credits and rate variance are findings for review unless entitlement, recovery path and approval evidence are present.
- Inferred application/vendor relationships remain visibly inferred until explicit source evidence is loaded.

## Proof Gate

Run the local catalog contract:

```bash
npx jest src/lib/source/data-model/__tests__/source-v4-cube-ui-catalog.test.ts src/lib/source/data-model/__tests__/source-v4-workspace-snapshot.test.ts src/app/'(maestro)'/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts --runInBand
```

The Cube runtime proof remains separate and is captured by the Cube lab deploy workflow. A signed-in UI proof is still required before claiming the Source Workspace visuals are live-proven.
