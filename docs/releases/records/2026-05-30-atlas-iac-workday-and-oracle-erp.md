# 2026-05-30 · Atlas Initiative-Archetype Corpus (IAC) — Workday + Oracle ERP AI agents

## Release ID
`2026-05-30-atlas-iac-workday-and-oracle-erp`

## Status
candidate

## Plain-English Summary
Atlas (the Tower agent) gained an Initiative-Archetype Corpus (IAC) foundation on 2026-05-30 (release `2026-05-30-atlas-iac-foundation`). That foundation shipped two reference archetypes in the `ai-coding` category — GitHub Copilot and Claude Code — and a schema, registry, and retrieval contract designed to be append-only across Wave 2 sibling slices.

This release appends two more archetypes in the `ai-erp` category — **Workday AI Agents** (Workday Illuminate + the Agent System of Record + the Rising 2024 wave of role-specific agents across HCM, Finance, Recruiting, Expense, Procurement) and **Oracle AI Agents in Fusion Cloud Applications** (the 50+ agents announced at Oracle CloudWorld 2024 across ERP, HCM, SCM, and CX, with OCI Generative AI as the substrate).

Both archetypes follow the IAC honesty discipline: every numeric figure is a labelled planning range with explicit cohort, sample size, source, and `YYYY-MM` date; every claim cites a real, verifiable Workday or Oracle primary source; banned phrases ("industry standard", "everyone is doing", "best practice") do not appear; `lastReviewed: '2026-05-30'`.

Because the ERP AI-agent ecosystem is in early GA as of 2026-05, independent third-party adoption metrics are not yet published at a level we can cite. Rather than fabricate them, both archetypes ship "qualitative-rich, metrics-light" — strong on deployment patterns, pitfalls, and `whatNext`, with adoption metrics limited to figures Workday and Oracle have themselves disclosed (customer counts, announced agent counts, FY25 earnings disclosures). The trend direction on both is `early`.

## Layer Impact
- `runtime-app-lane`: none today. Atlas runtime composition will land in Wave 3 (`findArchetypeByLooseMatch` / `getArchetype` wired into Atlas prompt assembly). This slice is corpus-only.
- `architecture-lane`: appends two `InitiativeArchetype` entries to the `INITIATIVE_ARCHETYPES` registry. No schema changes; no new modules.
- `qa-validation-lane`: extends `__tests__/archetype-content.test.ts` with an ERP AI-agent content-floor block (2+ deployment patterns, 2+ pitfalls, 2+ whatNext, 3+ evidence anchors, category = `ai-erp`, trend direction in `{early, emerging}`). Honesty invariants over the registry pick up the two new archetypes automatically.
- `data-plane-lane`: none.

## Client Applicability
- All clients: yes — Workday and Oracle AI-agent context is relevant cross-industry. Tenant-specific Workday or Oracle facts still come from Tower ingest; the corpus is industry-context, not tenant data.
- Specific clients: customers with material Workday or Oracle Fusion footprints (e.g., financial services, retail, healthcare cohorts evaluating ERP AI rollouts).
- Internal only: no.
- Public/demo only: no.

## Changes Included
- `src/lib/atlas/iac/archetypes/workday-ai-agents.ts` — new. 2 adoption metrics, 5 deployment patterns, 4 pitfalls, 3 emerging patterns (whatNext), 5 evidence anchors. Sources: Workday newsroom (Rising 2024 announcements: Agent System of Record, Workday Illuminate, role-specific agents, partner ecosystem), Workday newsroom (Evisort acquisition close, 2024-12), Workday Q4 FY25 earnings call (2025-02).
- `src/lib/atlas/iac/archetypes/oracle-ai-agents.ts` — new. 2 adoption metrics, 4 deployment patterns, 4 pitfalls, 3 emerging patterns (whatNext), 4 evidence anchors. Sources: Oracle newsroom (CloudWorld 2024 announcement of 50+ Fusion AI agents, OCI Generative AI Service GA), Oracle CloudWorld 2024 keynote (Larry Ellison).
- `src/lib/atlas/iac/registry.ts` — appends `oracleAiAgentsArchetype` and `workdayAiAgentsArchetype` in alphabetical position by `archetypeKey`.
- `src/lib/atlas/iac/__tests__/archetype-content.test.ts` — extends with an ERP AI-agent content-floor describe block over the two new entries.
- `docs/releases/records/2026-05-30-atlas-iac-workday-and-oracle-erp.md` — this record.

## QA / Validation
- `npx tsc --noEmit` clean.
- `npx jest src/lib/atlas/iac` — all suites passing (honesty invariants, registry uniqueness + retrieval, content-floor for both `ai-coding` references and the two new `ai-erp` entries).
- Honesty invariants enforced on both new entries: planning-range tag on every figure, source + `YYYY-MM` (or `YYYY-MM-DD`) date on every figure and evidence anchor, banned-phrase guard, valid `lastReviewed`.

## Sources Dropped For Honesty Reasons
- Third-party adoption metrics for Workday and Oracle AI agents (e.g., Gartner, IDC, Forrester percentages on "% of Workday customers using Recruiter Agent in production") — no publication we could cite at a defensible date as of 2026-05. Omitted rather than fabricated. When real third-party metrics ship, they should be appended in a future review.
- Specific Workday customer references for agent production deployments — Workday Rising 2024 named partners and beta customers, but did not publish customer counts in production for Recruiter / Expenses / Succession Planning / Optimize / Talent Mobility / Contracts agents. Cohort-by-cohort production-adoption figures are deferred until Workday discloses them in a future earnings call or Rising keynote.
- Specific Oracle customer references for Fusion AI-agent production deployments — Oracle CloudWorld 2024 named beta-program customers, but did not publish customer counts in production for the 50+ Fusion AI agents. Per-agent maturity and adoption figures are deferred until Oracle discloses them in a future earnings call or CloudWorld keynote.
- The "Oracle AI agent acceptance rate" figure that appears in some secondary-market coverage — chain of provenance back to an Oracle primary source was not establishable at the time of authoring. Omitted.

## Rollout Plan
- Merge this PR to main.
- Vercel auto-deploys main. No runtime behavior changes — the IAC has no consumers until Wave 3 wires Atlas composition.
- Future ERP AI-agent disclosures from Workday and Oracle (next Workday Rising, next Oracle CloudWorld, intervening earnings calls) trigger a `lastReviewed` refresh and metric updates.

## Rollback Plan
- Revert this PR. Removes only the two new archetype files, the registry append, the new test block, and this release record. The IAC foundation (release `2026-05-30-atlas-iac-foundation`) is unaffected. No other code paths depend on these entries yet, so revert is safe and has no behavior impact.

## Audit Evidence
- Honesty discipline mirrors the Atlas P0 audit closure (PR #2562 — `docs/audits/ATLAS-CXO-QUALITY-AUDIT-2026-05-30.md`) and the IAC foundation slice (release `2026-05-30-atlas-iac-foundation`).
- All citations in both new archetypes resolve to Workday or Oracle primary sources: Workday Rising 2024 keynote and Workday newsroom announcements (Agent System of Record, Workday Illuminate, role-specific agents, partner ecosystem, Evisort acquisition close), Workday Q4 FY25 earnings call, Oracle CloudWorld 2024 keynote and Oracle newsroom announcements (50+ Fusion AI agents, OCI Generative AI Service GA).
- The metrics-light shape is a deliberate honesty trade. The brief explicitly authorizes empty adoption metrics for ERP AI-agent archetypes; rather than zero, both ship 2 figures, each anchored to a Workday or Oracle primary disclosure (announced agent count, customer denominator).

## Known Gaps
- Independent third-party adoption metrics — see "Sources Dropped For Honesty Reasons".
- Per-agent (Recruiter / Expenses / Succession Planning / etc.) production-adoption rates are not yet published — deferred to future Workday and Oracle disclosures.
- Atlas composition wiring (Wave 3) is deliberately out of scope; this slice is corpus-only.
- `Routes and disclaimers` integrity check may still report pre-existing main breakage unrelated to this PR. Same precedent as recent Atlas PRs — that gate is admin-mergeable when it is the only remaining failure. Vercel Preview check is pre-existing infra and is ignored per the IAC release playbook.
