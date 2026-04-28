# Setup S0 Audit

## Baseline snapshot

Setup is smaller than Programs and Source, but it is more infrastructure-sensitive. The UI layer is largely present already. The real gap is typed connector health, live ingestion, and route discipline between `/admin/**` and `/platform/admin/**`.

Verified from the repo on April 28 2026:

| Metric | Value | Notes |
|---|---:|---|
| `src/components/setup/*.tsx` | 8 | compact shell-era component family |
| `src/lib/setup/*.ts` | 2 | fixture-heavy surface, thin data layer |
| `/admin/**` page routes | 15+ | canonical operator-facing family for connectors and governance |
| `/platform/admin/**` page routes | 14+ | parallel admin family still present and easily confusable |

## Route-family audit

### Canonical Setup routes

The intended control-plane family is `/admin/**`, including:

- `/admin`
- `/admin/connectors`
- `/admin/connectors/[connectorId]`
- `/admin/connectors/[connectorId]/reconnect`
- `/admin/users`
- `/admin/users-access`
- `/admin/invite`
- `/admin/audit`
- `/admin/policies`
- `/admin/tenant`
- `/admin/architecture`

### Parallel platform-admin routes

The repo also contains `/platform/admin/**` routes for connectors, audit, users, architecture, build-progress, production-readiness, quality, data, approvals, and other platform pages.

### S0 conclusion

Setup does not have a full-blown shell crisis, but it does have an ownership crisis. Future connector waves must explicitly center `/admin/**` for operator workflows and treat `/platform/admin/**` as founder/platform infrastructure unless a plan says otherwise.

## Current shipped state that future waves must treat as baseline

- connectors index exists today
- connector detail exists today
- reconnect flow exists today
- users, invite, audit, policies, and tenant pages exist today
- pages are already AppShell-era and generally Steward-led
- live connector backing is still thin; the current surface is mostly seeded

That means Setup waves should not spend time "inventing" pages that already exist. They should converge route ownership, refine connector semantics, and add real connector health and ingestion.

## Component surface grouping

| Group | Examples | S0 assessment |
|---|---|---|
| connectors | `SetupConnectorsPage`, `ConnectorDetailPage`, `ConnectorReconnectPage` | strongest starting point; good W1-W3 base |
| access and users | `SetupUsersPage`, `InviteCollaboratorPage` | ready for W5 formalization |
| governance | `SetupAuditPage`, `SetupPoliciesPage`, `SetupTenantPage` | real UI exists, but persistence/runtime semantics are still seeded |

## Connector-class delta

The founder taxonomy is now the authoritative target:

- `T-MS-GRAPH`
- `T-GITHUB`
- `T-ANTHROPIC`
- `T-SERVICENOW`
- `T-SAP`
- `T-RSS`
- `T-CUSTOM`

The current fixture set overlaps with this but is not the same registry. S0 should capture the gap so future waves converge intentionally rather than editing connector names ad hoc.

## Risks captured in S0

1. **Route ambiguity.** Connector and governance work can accidentally land in `/platform/admin/**` instead of `/admin/**`.
2. **Infrastructure drift.** UI work can overstate runtime reality because the current data layer is only two setup lib files deep.
3. **Dependency coupling.** Tower and Intelligence both depend on Setup W3. A sloppy connector wave blocks multiple modules at once.
4. **Secret ownership.** Real connector waves will need founder-owned auth, env vars, or platform settings; those must be called out early.

## Recommended execution order after S0

| Wave | Why next |
|---|---|
| W1 | locks route ownership and connectors index baseline |
| W2 | stabilizes connector detail and reconnect/auth posture |
| W3 | first live connector; highest cross-module leverage |
| W5 | users and audit are already present and can converge once connector ownership is clear |
| W6 | policies and governance close the module after connector reality is trustworthy |

## Exit criteria for S0

- `docs/build/SETUP_BUILD_SPEC.md` exists and is authoritative
- `docs/build/setup/` contains audit, roadmap, journal, and W1-W6 plan skeletons
- `/admin/**` is named as the canonical operator route family
- connector health is explicit as the core missing primitive, not just implied in notes
