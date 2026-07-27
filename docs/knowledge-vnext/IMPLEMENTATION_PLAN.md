# Home / Knowledge vNext — Implementation Plan & Record

Status: **built, isolated, flag-off, not activated.** Admin-preview only. Serves
contract-valid fixtures. No production route or tenant is activated; no Azure,
PostgreSQL, loader, parser or publication was modified.

## Precedence (as instructed)

1. **Merged Phase 3C-2D contracts govern** data shape, authority, lineage,
   publication, availability states, projection names, baseline versioning, aVa
   context and reconciliation — `clients/shared/20-phase3c2d-consumption-contracts/`.
2. **The AbarVa Knowledge HTML governs** visual hierarchy, interaction, IA,
   content-class treatment, responsive behavior and intended UX.
3. **Existing Nexus design system governs** navigation, brand, primitives, type.
4. The HTML's embedded values are examples only — never copied as tenant facts.

### Reconciliation recorded
The front-end brief's example envelope used `freshnessState: current|aging|stale`.
The merged `CONSUMPTION_OBJECT_AND_FIELD_CONTRACT` enumerates `freshness_state`
as `fresh|stale|not_loaded|not_applicable`. **The merged contract governs**, so
the canonical enum is used everywhere. See the gap register.

## Chosen paths (adapted to repo conventions)

| Concern | Path |
| --- | --- |
| Generated consumption contracts (TS) | `src/lib/knowledge/consumption-contracts/` |
| Provider boundary + runtime | `src/lib/knowledge/consumption-client/` |
| Fixture packs (`fixture_only`) | `src/lib/knowledge/fixtures/` |
| UI (shell + 4 modes + aVa + drawer + graph) | `src/components/knowledge/vnext/` |
| Admin preview route | `src/app/(maestro)/knowledge-preview/page.tsx` |
| Tests | `…/consumption-contracts/__tests__`, `…/consumption-client/__tests__`, `src/lib/knowledge/__tests__/vnext-legacy-boundary.test.ts` |

## Architecture — the anti-rewiring core

```
React components  ──►  KnowledgeConsumptionProvider (8 methods)  ──►  ConsumptionEnvelope<T>
                            ▲                     ▲
        ContractFixtureConsumptionProvider   HttpConsumptionApiProvider
        (fixtures, synthetic tenants)        (published consumption API, LKG cache)
```

- Components import **only** the provider boundary / React context. They never
  import fixtures, raw sources, or legacy module tables. Enforced by the
  legacy-boundary test.
- Both providers implement the identical interface and are interchangeable
  without any component change (proved by `provider interchangeability` tests).
- Every response is a `ConsumptionEnvelope<T>` carrying tenant key, baseline ref,
  publication versions, projection name + contract version, as-of, content hash,
  authority/availability/freshness state, evidence refs, known-gap refs, warnings.
- aVa is a **separate reasoning path** (`AvaReasoningProvider`). The deterministic
  page renders fully with `NullAvaReasoningProvider` (models disabled).
- The graph consumes a **relational projection** (`relationship_node/edge/evidence_v1`);
  no AGE/Cypher/SQL reaches the browser. Rendering is an SVG abstraction behind a
  props contract so a heavier library could replace it later.

## Isolation, flag & tenancy

- **Flag** `home_knowledge_vnext` in `src/lib/features/registry.ts` —
  `policy: "tenant"`, `includeTenants: []` → default OFF for every tenant, no
  email allowlist. It governs future tenant activation, not admin preview.
- **Route gate**: `isPlatformAdminSession()` (role/claim based, no email
  allowlist). `notFound()` for everyone else, including any signed-in tenant user.
- **Tenancy**: `requireTenancy()` (server) is consulted; browser-supplied tenant
  keys are never trusted. The fixture/scenario selector is an explicitly-labeled
  **admin-development control** and is the only place a human picks a tenant, for
  `fixture_only` data under synthetic `fixture-*-demo-new` namespaces.
- **Chrome**: `/knowledge-preview` added to `SHELL_SURFACE_PREFIXES` in
  `MaestroChrome.tsx` so it mounts beneath the existing `NexusTopNav` — no second
  shell, no legacy Home toolbar. No tenant name in the primary toolbar.
- `/home` is untouched; old Home is not removed.

## What renders (verified live in a temporary dev harness, now removed)

- Brief · Explore · Relationships · Evidence & Gaps — all four modes.
- Global Executive / Analytical / Proof depth (consistent across the page).
- Business-problem lens control; current/target scope.
- Evidence one interaction away (drawer with full descriptor fields).
- Leadership perspectives visually distinct from accepted facts; content classes.
- Partial/missing never shown as zero ("No value · Not measured").
- Graph one-hop default / two-hop on request; accepted solid / candidate dashed;
  evidence per node & edge; accessible synchronized table; honest capped view.
- aVa optional companion; models-disabled state leaves the page fully working.
- Module handoff preview (references only; nothing created).
- Responsive: three panes → collapsible rail → aVa bottom-dock at 390px.
- Escape closes overlays; focus trap + focus return; labelled controls.

## Deferred / not in this slice
See `BACKEND_API_GAP_REGISTER.md` and the release record's Known Gaps.
