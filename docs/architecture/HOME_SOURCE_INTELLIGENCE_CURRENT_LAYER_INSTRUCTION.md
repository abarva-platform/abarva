# 2026-08-04 Home, Source, and Intelligence aVa Current-Layer Instruction

## Decision

Retired V6, V7, and CIO Tower layers must not be silent runtime fallbacks for Home, Source, Intelligence, Tower, or aVa. Product surfaces should read current governed Postgres context, the current Tower `tower.*` semantic read model, and the Source V4/Cube semantic layer. If current context is unavailable, the product must return a visible evidence gap or handoff, not fall back to retired packs.

## Home aVa

- Primary context: Semantic2 curated dossiers and current Home read-model views.
- Source bridge: include the Source V4 workspace snapshot as a governed evidence slice for contract, vendor, invoice, service-credit, AI usage, cloud, rate-card, sourcing-event and scope-confidence questions.
- Runtime rule: do not import or call `answerHomeKnowFromV7`, `answerHomeKnowFromV6`, `toHomeKnowResponseFromV7`, `toHomeKnowResponseFromV6`, or `applyHomeV6ExecutiveSynthesis` from `/api/home/know/ask`.
- Failure rule: if current Home context cannot answer, return a blocked/partial answer with a gap explaining the missing current context. Do not use V6/V7 as a rescue path.
- Narrative rule: Source V4 can support adoption, exposure, coverage and evidence gaps. It must not claim savings, realized value, productivity lift, recoverable credits or legal recoverability without explicit before/after metrics, finance validation, or reviewed contract/legal evidence.

## Source Pages and Source aVa

- Source UI should treat Cube as the semantic serving layer for analytical pages and use Source V4 lenses as default drill paths:
  - `source_v4_executive_portfolio`
  - `source_v4_vendor_concentration`
  - `source_v4_renewal_exposure`
  - `source_v4_scope_confidence`
  - `source_v4_spend_consumption`
  - `source_v4_performance_credits`
  - `source_v4_ai_usage_value_proof`
  - `source_v4_cloud_optimization`
  - `source_v4_workforce_rate_card`
  - `source_v4_sourcing_event_bafo`
- Source aVa should cite the same Source V4 snapshot/Cube catalog used by the page. It should expose the query lens, metric family, selected filters, and source drill path in trace/debug output.
- Source aVa should not answer from V6/V7 Intelligence packs. If a question needs cross-domain judgment, it should hand off to Intelligence with the Source V4 packet attached.
- Status (verified 2026-08-04): Source's chat backend (`isSourceSurface` branch of `/api/chat/agent`, and the Source data-model read-adapter it calls) has zero references to `intelligence_v6` or `intelligence_v7` today. No purge work is needed on Source's aVa path for this decision — it was never wired to the retired layers.

## Intelligence aVa

- Intelligence should accept a governed handoff packet from Source/Home containing Source V4 metrics, selected lens, filters, citations and caveats.
- Intelligence may reason across domains, but must preserve Source metric values exactly as supplied by Cube/Postgres. It must not recalculate Source financials from raw tables unless the question explicitly asks for audit/reconciliation.
- Intelligence must not retrieve from `intelligence_v6` or `intelligence_v7` for active current-state answers once the current semantic dossier and Source V4 packet are available.
- If the current semantic dossier or Source V4 packet is unavailable, Intelligence should say which evidence slice is missing and ask for refresh/load/signoff, rather than falling back to retired pack content.
- Status (as of `2026-08-04-intelligence-curated-dossier-bridge`): Intelligence's core retrieval pipeline (`askIntelligence` in `src/lib/intelligence/ask/index.ts`) originally had **no** current-context Postgres path at all — `retrieveV7DossierSources` was called unconditionally on every question and, when it returned data, suppressed every other tenant source. The intended plan was to add a replacement current-context source first, prove it live, and only then remove V7 — mirroring Home's safe order. That plan was overtaken by a separate, concurrent commit (`59757a9d8`, "Retire legacy Tower and Intelligence read paths") that removed V7 from `askIntelligence` unconditionally, with no replacement in place, and deployed while this work was still in progress — creating a real grounding gap for a window of time. `retrieveCuratedDossierSources` (reading `semantic2_dossiers` via `loadCuratedSemanticDossier`, the same pattern Home and Atlas use) closes that gap as of this release. **Before starting further Intelligence/Tower/Home current-layer work, coordinate on which agent/session owns which file** — this file (`index.ts`) had two concurrent, uncoordinated edits in the same session.

## Tower Pages and Tower aVa

- Tower UI and Tower aVa should treat `tower.*` as the current governed Tower semantic read model.
- Tower should use Source V4/Cube only for Source-owned commercial evidence: vendor contracts, renewals, invoices, service credits, SaaS/tool usage, cloud cost, rate cards and sourcing events.
- Tower must not read `cio_tower.*`, `intelligence_v6`, or `intelligence_v7` for active answers.
- If a Tower metric, observation, claim state or provenance record is missing from `tower.*`, Tower should report the missing measurement/evidence gate. It must not backfill from retired CIO Tower mart/fact tables.
- Developer-productivity, ServiceNow-agent and Workday-agent claims require before/after metric observations in `tower.metric_observation`, value claims in `tower.value_claim`, and provenance/attestation in `tower.metric_provenance`. Usage alone is not productivity improvement.

## Physical Purge Procedure

Do not drop old schemas or files directly from a product PR. Run a separate operator/data-plane purge with these gates:

1. Inventory all code imports and SQL references to `v6-home-*`, `v7-home-*`, `intelligence_v6`, `intelligence_v7`, and `cio_tower`.
2. Remove or gate product read paths first; deploy and prove no product route calls them.
3. Export counts and checksums for any old database objects that will be archived or dropped.
4. Capture signed-off dependency proof showing zero active product consumers.
5. Run an ACA operator job that archives then drops or revokes old-layer objects by exact schema/table list.
6. Publish a proof bundle with pre-counts, archive location, executed SQL, post-counts, and route/browser verification.

## Do Not Do

- Do not silently query V6/V7/CIO Tower because a current table is empty.
- Do not make Home own Source data.
- Do not let Intelligence recalculate governed Source metrics unless the task is an audit.
- Do not turn missing productivity, finance or legal validation into zero-dollar value.
- Do not physically delete broad schemas without exact-object approval, archive proof and dependency proof.
