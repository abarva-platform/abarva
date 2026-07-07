# Agent Substrate Kernel

## Root Cause

The weak Meridian answer was not caused by one missing CSV row. It exposed a design boundary problem: the repo has strong substrate pieces, but the answer path can still be assembled from surface-local logic. Home v2 currently binds tenant packs server-side, then browser JavaScript ranks facts and builds the visible answer. That lets a page look data-bound while the real answer kernel is not yet fully database-owned, retrieval-owned, or eval-owned.

The database layer is not empty. The existing migrations already define tenant-scoped sources, source files, records, facts, relationships, evidence, chunks, AI Control Tower refresh runs, and corpus patterns. The problem is that those pieces are not yet enforced as one end-to-end contract for every client and every surface.

## Non-Negotiable Contract

The shared agent substrate has four authorities:

1. The source authority preserves original files or objects, hashes, locator metadata, and stewardship state.
2. The structured authority stores tenant-scoped records, facts, relationships, confidence, freshness, and lifecycle state.
3. The retrieval authority indexes chunks and structured facts into the approved search path, with tenant filters pinned server-side.
4. The answer authority composes from the substrate, cites evidence, names gaps, and is tested by evals before a client sees the behavior.

Browser JavaScript may render, collect input, and display citations. It must not be the authority for dataset registry, dimension schema, answer ranking, tenant fallback, or source truth.

## What Happens With A 20th Dimension

A new dimension must be a data-plane event, not a browser-code event.

Required path:

1. Add a dimension registry entry with `dimension_key`, display name, domain, applicable clients, source templates, and required evidence.
2. Add or update the dataset manifest so source files map to that `dimension_key`.
3. Load source files into `enterprise_context_source_files`.
4. Commit records and facts into `enterprise_context_records` and `enterprise_context_facts`.
5. Commit cross-dimension edges into `enterprise_context_relationships`.
6. Commit citations into `enterprise_context_evidence`.
7. Refresh search/index state for chunks and structured rows.
8. Add at least one eval question that proves the agent can use the new dimension.
9. Run signed-in proof that the answer cites the new source or clearly says what is missing.

If a new file appears but the registry, database rows, retrieval index, or eval proof are missing, the system should report the exact missing state. It should not silently fall back to a nearby dimension or synthesize from generic prose.

## Current Gaps

Home v2 has a server-side client pack map and a hardcoded 19-section schema in `src/lib/home-v2/data.ts`. That gives all clients a common view, but it means the 20th dimension still requires code unless this schema moves into a server/database-owned registry.

Home v2 also has browser-side answer logic in `public/home-v2/app.js`, including ask tokenization, cross-section fact ranking, computed weights, and answer assembly. That must move behind a server endpoint or shared server module before Home can be treated as a true agent substrate surface.

Eval coverage exists for some agent-quality cases, but it is not yet an all-client, all-dimension release gate. The substrate can contain rich data without being proven usable in signed-in answers.

## Target Shape

The target is a registry-first substrate:

- `dimension_key` is durable data, not an enum hidden in a page bundle.
- Facts and chunks share source lineage.
- Relationships connect systems, initiatives, vendors, risks, policies, people, and outcomes across dimensions.
- Agents retrieve a context bundle that includes facts, chunks, relationships, corpus patterns, confidence, freshness, and known gaps.
- UI surfaces display server-composed answers and citations instead of computing the business answer in the browser.

The repo-owned contract for this target is `docs/architecture/agent-substrate-contract.json`. The executable audit is `npm run audit:agent-substrate`.

## Truth Standard

Every dataset or dimension claim must be reported in these states:

- Local artifact exists.
- Parse or preflight passed.
- Product loader/API accepted it.
- Blob/object storage preserved the source.
- Queue/private worker handoff happened, if applicable.
- Parser extracted facts, tables, chunks, or evidence with locators.
- Review queue received low-confidence or document-derived evidence.
- Context rows/facts/chunks were committed to the client data plane.
- Search/index refresh completed.
- Signed-in answer QA proved the context is usable.

Anything less is a partial state, not a client-ready substrate claim.
