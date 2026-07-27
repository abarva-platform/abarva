# Backend / Consumption API Gap Register — Home / Knowledge vNext

What the real (non-fixture) path needs before `HttpConsumptionApiProvider` can
replace `ContractFixtureConsumptionProvider`. The UI is already written against
these shapes; closing these gaps is backend work, not UI rework.

## 1. Published consumption API endpoints (do not exist yet)

The provider posts to `/api/knowledge/consumption/*`. These routes must be built
to read the `consumption.*` views (never Cube directly from the browser, never
raw/working/legacy tables), resolve the tenant server-side via `requireTenancy()`,
and return a `ConsumptionEnvelope<T>` per the shared contract:

| Endpoint | Returns | Projection |
| --- | --- | --- |
| `POST /enterprise-brief` | `EnterpriseBriefV1` | `consumption.enterprise_brief_v1` (+ identity, executive_perspective, strategic_interpretation, domain_summary) |
| `POST /explore` | `EntityExploreResultV1` | `application_inventory_v1`, `vendor_contract_inventory_v1`, `domain_summary_v1` |
| `POST /entity-detail` | `EntityDetailV1` | inventory projections |
| `POST /relationships` | `RelationshipProjectionV1` | `relationship_node/edge/evidence_v1` |
| `POST /evidence-gaps` | `EvidenceGapResultV1` | `evidence_gap_v1` |
| `POST /search` | `KnowledgeSearchResultV1` | `search_document_v1` |
| `POST /suggested-questions` | `SuggestedQuestionV1[]` | derived |
| `POST /module-handoff-preview` | `ModuleHandoffPreviewV1` | `module_knowledge_packet_v1` |

## 2. Evidence descriptor resolution
The evidence drawer resolves refs → `EvidenceDescriptor`. Fixtures resolve from
their pack; the HTTP runtime currently returns `[]`. Needed: a published
`/api/knowledge/consumption/evidence` endpoint (or inline descriptors on every
envelope) that returns the contract descriptor fields and **never leaks withheld
content**.

## 3. Cube-backed metrics via a semantic API
`GovernedMetricValue` is UI-ready (nullable value, availability state, semantic
model version, query hash). The backend semantic API over `consumption.*` +
Cube must populate `semanticModelVersion` / `metricQueryHash` and reconcile
Postgres = Cube = API = UI. Home must render if Cube is unavailable.

## 4. aVa reasoning wiring
`AvaReasoningProvider` has a deterministic fixture stand-in. Production must wire
the audited Anthropic egress path behind the same interface, building the packet
per `AVA_KNOWLEDGE_PACKET_MAPPING`, keeping output ephemeral and refusing when
evidence is absent. No component change required.

## 5. Baseline activation / rollback surface
The HTTP runtime reports baseline/publication versions per envelope. To surface
`newer_baseline_available` and last-known-good truthfully in production, expose
`consumption.baseline_activation` + `refresh_run` state to the API layer
(`LAST_KNOWN_GOOD_AND_ROLLBACK_CONTRACT`).

## 6. Reconciliation (canonical → screen parity)
`MODULE_CONSUMPTION_MAPPING` requires "canonical-to-screen parity" for Home. A
reconciliation job/report (`CONSUMPTION_RECONCILIATION_TEST_PLAN`) must pass
before any tenant flag flip.

## 7. Contract-version note
Envelope `freshnessState` follows the merged contract enum
(`fresh|stale|not_loaded|not_applicable`), not the brief's `current|aging|stale`
example. Backend responses must use the contract enum.

## Not started in this slice (UI acceptance items still open)
- Automated interaction tests in jsdom and a Playwright visual-regression suite
  (this slice verified interactively in a temporary dev harness + 47 unit tests).
- WCAG `axe` automated pass (manual a11y affordances implemented: focus trap,
  Escape, focus return, labelled controls, alt table, status-in-words,
  reduced-motion).
- Table virtualization for genuinely large (1,000+ row) inventories (paginated
  now; fixtures are small).
