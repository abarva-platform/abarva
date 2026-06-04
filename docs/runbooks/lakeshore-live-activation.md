# Lakeshore Holdings Live Activation Runbook

## Purpose

Move Lakeshore Holdings from an extensive offline synthetic package into a live,
tenant-scoped AbarVa context layer that Maestros and agents can use without
side-loading shortcuts.

This runbook starts after the private data-plane foundation and synthetic
package are on `main`. It is intentionally explicit about which steps are
already ready, which steps are blocked by review, and which steps require live
operator credentials.

## Tenant Identity

| Field | Value |
| --- | --- |
| Display name | Lakeshore Holdings |
| App client key | `lakeshore` |
| Broker / substrate key | `lakeshore-holdings` |
| Industry | Diversified holding company |
| Demo domain | `lakeshore-holdings.example.com` |

## Source Artifacts

| Artifact | Location | Use |
| --- | --- | --- |
| Standup brief | `docs/build/CODEX-LAKESHORE-STANDUP-BRIEF-2026-06-03.md` | Master execution brief |
| Tenant setup plan | `docs/build/LAKESHORE_HOLDINGS_TENANT_SETUP_PLAN_2026-06-03.md` | Loader-first setup plan |
| Synthetic generation spec | `docs/build/LAKESHORE_SYNTHETIC_DATA_GENERATION_SPEC_2026-06-03.md` | Per-dimension data requirements |
| Loaded package | `docs/build/lakeshore/loaded/` | CSVs, documents, workbook, notes, and how-to pages |
| Offline review ZIP | `docs/build/lakeshore/loaded/review-bundle/lakeshore-offline-review-bundle.zip` | One-time client review bundle |

## Current Gates

| Gate | Required Evidence | Status Meaning |
| --- | --- | --- |
| Synthetic package | `node scripts/lakeshore/verify-synthetic-context.mjs` passes | Data files and offline ZIP are present and internally consistent |
| Live readiness | `npm run lakeshore:live-activation:verify` | Shows ready items, pending PR artifacts, and missing live env variables |
| Governed load rehearsal | PR #2997 merged, then load rehearsal evidence exists | Files enter through Data Loads rather than manual DB inserts |
| CXO corpus activation | PR #2998 merged | Clerk user plan, corpus attachment plan, and agent-grounding validation are available |
| Production proof | Main post-deploy crawl green after merges | Production route health is not regressed |

## Environment Configuration

Do not print secret values in logs. Confirm presence only.

| Capability | Required Environment |
| --- | --- |
| Clerk CXO user creation | `CLERK_SECRET_KEY` |
| App/data-backed verification | `DATABASE_URL` |
| Membership provisioning compatibility adapter | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Live embeddings | `OPENAI_API_KEY` |
| Optional external vector index | `PINECONE_API_KEY`, `PINECONE_INDEX_NAME` |
| Azure AI Document Intelligence | `DOCUMENT_INTELLIGENCE_ENDPOINT` plus `DOCUMENT_INTELLIGENCE_API_KEY`, or `DOCUMENT_INTELLIGENCE_USE_AAD=true` |

Compatibility note: the current membership provisioning adapter still uses
legacy `SUPABASE_*` environment names. New runtime work should continue to use
the Azure/Postgres data-plane adapters; do not introduce new direct Supabase
runtime reads.

## Step 1: Verify the Offline Package

```bash
node scripts/lakeshore/verify-synthetic-context.mjs
```

Expected result:

- tenant key is `lakeshore`,
- broker key is `lakeshore-holdings`,
- 18 CSV templates are present,
- at least 1,250 structured rows are present,
- at least 20 documents are present,
- every CSV row is marked synthetic / illustrative,
- the offline ZIP includes data, how-to pages, manifest, and workbook.

## Step 2: Verify Live Activation Readiness

```bash
npm run lakeshore:live-activation:verify
```

Use JSON output for automation:

```bash
npm run lakeshore:live-activation:verify -- --json
```

Use strict mode only in an environment where the PR-dependent artifacts and
secrets are expected to exist:

```bash
npm run lakeshore:live-activation:verify -- --strict
```

Default mode exits successfully even when live secrets are missing. The output
still marks the activation as blocked or ready-with-warnings so an operator can
see exactly what is missing.

## Step 3: Confirm PR and Deployment State

Before live commit, confirm:

```bash
env -u GH_TOKEN gh pr view 2997 --json state,reviewDecision,mergeStateStatus,statusCheckRollup
env -u GH_TOKEN gh pr view 2998 --json state,reviewDecision,mergeStateStatus,statusCheckRollup
env -u GH_TOKEN gh run list --workflow "Post-deploy crawl" --branch main --limit 5
```

Interpretation:

- PR #2997 must be merged before governed load rehearsal/commit is available.
- PR #2998 must be merged before CXO provisioning and agent-grounding validation
  are available.
- A cancelled post-deploy crawl caused by a newer `main` deployment is not a
  product failure. Monitor the latest non-cancelled crawl.

## Step 4: Provision CXO Personas

After PR #2998 lands:

```bash
npx tsx scripts/provision-cxo-personas.ts --client lakeshore --plan-only
```

Review planned users:

| Persona | Expected Client | Purpose |
| --- | --- | --- |
| Lakeshore CXO 1 | Lakeshore Holdings | Executive brief, Moves, Source, Tower review |
| Lakeshore CXO 2 | Lakeshore Holdings | Second-client-leader isolation and role test |

Create Clerk users only:

```bash
npx tsx scripts/provision-cxo-personas.ts --client lakeshore --clerk-only --apply
```

Run the full membership/org apply only when membership write-adapter credentials
are present:

```bash
npx tsx scripts/provision-cxo-personas.ts --client lakeshore --apply
```

Proof to capture:

- created Clerk user IDs,
- organization ID,
- user public metadata client key,
- role/membership assignment,
- no user appears under Apex, Meridian, SkyHarbor, or First Capital.

## Step 5: Run the Governed Loader

After PR #2997 lands, use its release evidence and load runner to execute the
governed load path. The required behavior is:

1. upload package files as Lakeshore-only inputs,
2. parse supported formats through the loader,
3. quarantine or block any file that fails malware/sensitive-data checks,
4. validate each file against the template registry,
5. require consent/attestation and approval before commit,
6. commit accepted records into the Lakeshore private data plane,
7. write audit events and load-run evidence.

Do not insert rows directly into operational stores as a shortcut.

Proof to capture:

- load-run ID,
- file manifest,
- parser method per file,
- quarantine results,
- approval/attestation event,
- commit result,
- audit-log tail.

## Step 6: Enable Azure AI Document Intelligence

Follow `docs/runbooks/document-intelligence.md`.

Required:

```bash
export DOCUMENT_INTELLIGENCE_ENDPOINT="<endpoint>"
export DOCUMENT_INTELLIGENCE_API_KEY="<key>"
```

AAD mode:

```bash
export DOCUMENT_INTELLIGENCE_ENDPOINT="<endpoint>"
export DOCUMENT_INTELLIGENCE_USE_AAD=true
```

Live validation:

1. upload a Lakeshore PDF contract with tables,
2. confirm parser method is `azure-document-intelligence-layout`,
3. confirm Markdown table/headings survive extraction,
4. temporarily misconfigure the endpoint in a non-production environment,
5. confirm fallback parser is used and warning evidence is recorded.

## Step 7: Embed the Committed Context

Dry run:

```bash
npm run embed:pending-chunks -- --tenant lakeshore --dry-run
```

Live run:

```bash
npm run embed:pending-chunks -- --tenant lakeshore
```

Postgres-only fallback, if external vector index credentials are not configured:

```bash
npm run embed:pending-chunks -- --tenant lakeshore --postgres-only
```

Proof to capture:

- chunk count,
- embedded count,
- skipped/failed count,
- embedding provider,
- tenant key in every processed row,
- no cross-tenant chunk IDs.

## Step 8: Verify Data Trust and Tenant Isolation

Sign in as both Lakeshore CXO personas and verify:

| Surface | Expected Result |
| --- | --- |
| `/admin/setup` | Lakeshore Data Loads show loaded/blocked/open-action status for Lakeshore only |
| `/admin/data-trust` | Record counts, coverage, and last-loaded timestamps reflect Lakeshore commit |
| `/home` | Executive brief uses Lakeshore client identity and does not show another client |
| `/strategic-moves` | Moves can retrieve Lakeshore context when relevant |
| `/source` | Source questions can cite Lakeshore evidence when relevant |
| `/tower` | Tower surfaces Lakeshore evidence without cross-tenant rows |

Isolation checks:

- Lakeshore users must not see Apex, Meridian, SkyHarbor, First Capital, or
  NorthStar records.
- Existing clients must not see Lakeshore rows unless they are platform-admin
  users with an explicit internal-admin context.
- Browser tabs should log out/in between clients to avoid cached-session
  ambiguity.

## Step 9: Validate Agent Grounding

After PR #2998 lands, run its corpus/agent grounding validators.

Minimum prompts to prove grounding:

| Agent/Surface | Prompt | Expected Evidence |
| --- | --- | --- |
| Sentinel / Intelligence | "Which Lakeshore operating company has the highest vendor renewal risk?" | Cites Lakeshore vendor-contract rows and contract PDFs |
| Nexus / Moves | "Which modernization move should Lakeshore prioritize first?" | Uses Lakeshore app portfolio, initiative portfolio, and rate-card/modernization corpus where available |
| Source | "Prepare sourcing questions for the WMS modernization renewal." | Cites Lakeshore WMS/vendor context, not generic advice |
| Tower | "What evidence says the treasury modernization is ready?" | Cites Kyriba contract, finance KPI, and initiative records |

Hallucination guardrails:

- Answers must cite file/row/document evidence.
- If a fact is not in the corpus, the answer should say it is not available.
- Agents must label synthetic pilot data as synthetic/illustrative.
- Cross-tenant facts are failures, not low-confidence answers.

## Evidence Packet

Capture this packet before marking Lakeshore live activation complete:

1. PR #2997 merged state and commit.
2. PR #2998 merged state and commit.
3. Latest successful main post-deploy crawl run.
4. `verify-synthetic-context` output.
5. `lakeshore:live-activation:verify` output.
6. Clerk user/org proof with secret values redacted.
7. Governed load-run evidence.
8. Document Intelligence parse evidence.
9. Embedding run evidence.
10. Data Trust screenshots/counts.
11. Agent grounding prompt/answer/evidence report.
12. Tenant isolation browser proof for two Lakeshore CXOs and at least one
    non-Lakeshore client.

## Completion Boundary

The repository is ready for live activation when this runbook and verifier are
on `main`. Lakeshore is actually live only when:

- PR #2997 and PR #2998 are merged,
- live credentials are present,
- Clerk users are provisioned,
- governed load has committed through the loader,
- embeddings have run,
- Data Trust reflects Lakeshore records,
- agent answers cite Lakeshore evidence,
- tenant isolation checks pass.
