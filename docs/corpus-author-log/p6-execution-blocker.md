# P6 Corpus Authoring Execution Log

Date: 2026-05-23
Agent: @codex
Branch: `feat/p6-corpus-authoring`
Worktree: `/Users/anand/Projects/nexus/.claude/worktrees/p6-corpus-authoring`

## Current status

The initial P1-schema blocker below was resolved by the coordinator. P6 DB
content authoring then completed against the Azure Postgres runtime DB from
inside `ca-abarva-web-lab-eastus`.

Published corpus records:

- 39 total P6 records
- 34 `it-productivity`
- 5 `source-optimization`
- Status: `published`
- Depth score: min `10`, 39 passing at `>=8`
- Body word-count range: `996..1029`
- Evidence chunks per pattern: `4`
- Counterarguments per pattern: at least `2`
- Relationship graph edges from P6 records: `117`

Postgres retrieval smoke for `how do I improve IT productivity with AI` returned
these relevant top five:

1. `p-it-12-mainframe-sunset-as-pilot-wedge`
2. `p-it-04-mainframe-ai-comprehension-generation`
3. `p-src-04-si-concentration-risk`
4. `p-it-11-copilot-55-vs-metr-19-slower`
5. `p-it-03-productivity-to-value-theorem`

## Search indexing resolution

The Azure AI Search blocker was resolved after the initial P6 run. Local
API-key auth remains disabled on the Search service, which is the desired
security posture. The coordinator used the runtime user-assigned identity from
inside `ca-abarva-web-lab-eastus` instead:

- Confirmed `disableLocalAuth=true` on `srch-abarva-context-lab-eastus`.
- Confirmed the runtime identity
  `42f131d5-a0da-4d66-83f9-fe3769acc017` already had
  `Search Index Data Reader` and `Search Index Data Contributor`.
- Added `Search Service Contributor` for index management on the same Search
  service scope.
- Used the Container Apps managed identity endpoint
  `IDENTITY_ENDPOINT` / `IDENTITY_HEADER` to get a Search bearer token.
- Created `corpus-global`.
- Uploaded all 39 P6 documents with 1536-dimension embeddings.
- Updated `search_doc_id` on the 39 Postgres corpus rows.

Search smoke evidence:

- `corpus-global` document count: `39`
- `search='*'` returned `39` documents
- Search top five for `how do I improve IT productivity with AI`:
  1. `p-it-02-time-x-ai-fit`
  2. `p-it-03-productivity-to-value-theorem`
  3. `p-it-06-dora-anchored-measurement`
  4. `p-it-17-wave-0-6-rollout`
  5. `p-it-01-run-grow-transform`

There is no remaining P6 Search indexing escalation.

## Intended execution path

Packet 6 is content-only. The execution kit assigns P6 to published corpus DB
records through the Packet 1 corpus/admin tooling and audit notes under
`docs/corpus-author-log/**`. P6 must not modify schema or author Move templates.

The safe path was:

1. Use the P1 corpus data model and authoring workflow.
2. Create the 39 Packet 6 patterns as `published` records.
3. Let P1 publish behavior run Rubric P depth lint, embedding generation, and
   Azure AI Search upload.
4. Verify count, depth scores, relationship edges, and `searchCorpus(...)`.

## Live prerequisite check

The local worktree had no `.env.local`, no `DATABASE_URL`, and no Azure Search
write env. `node_modules` was also absent locally, so direct local P1 tooling was
not runnable against a target database.

Azure CLI was authenticated to `abarva-lab-sub`, but Key Vault secret reads from
`kv-abarva-lab-001` failed from this workstation because the vault is private:

```text
ForbiddenByConnection: Connection is not an approved private link and caller was ignored because bypass is not set to 'AzureServices' and PublicNetworkAccess is set to 'Disabled'.
```

I then used `az containerapp exec` into `ca-abarva-web-lab-eastus`, which has
`DATABASE_URL` projected and can reach Azure Postgres. The live DB probe was:

```sql
select
  to_regclass('public.corpus_patterns') as corpus,
  to_regclass('public.clients') as clients;
```

Result:

```json
{"corpus":null,"clients":"clients"}
```

## Resolved ESCALATION

P6 was initially blocked because the target Azure Postgres database reachable
from the app runtime did not have the P1 corpus schema installed. The missing
table was:

- `public.corpus_patterns`

Likely dependent missing tables include the rest of P1:

- `public.corpus_pattern_versions`
- `public.corpus_pattern_content`
- `public.corpus_pattern_relationships`
- `public.corpus_review_state`
- `public.corpus_telemetry`
- `public.corpus_overlays`
- `public.client_private_patterns`

P6 could not apply `supabase/migrations/20260523050000_corpus_data_layer.sql`
because Packet 6 has a no-schema-change constraint. The coordinator later
applied the already-merged P1 migration from inside the VNet runtime and verified
the corpus tables and schema migration record.

## Initial blocked P6 state

- Patterns authored in DB: 0 of 39
- Relationship edges created: 0
- Depth lint scorecard smoke: not runnable because corpus tables are absent
- Azure AI Search corpus indexing: not runnable because corpus tables are absent
- PR: none opened; no seed/status/script change is needed beyond this blocker log
