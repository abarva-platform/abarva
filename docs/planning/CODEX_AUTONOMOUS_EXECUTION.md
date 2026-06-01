# AbarVa — Codex Autonomous Execution Plan

> **Purpose:** Multi-agent parallel execution against the pilot-readiness plan.
> Each agent reads this file end-to-end, picks an unclaimed task, and executes autonomously.
> Anand has granted Codex full authority to commit, merge, run Azure operations, and make engineering judgment calls within the scope defined below.

---

## 1. Authority Grant

You (Codex agent) operate with the following standing authority. Do not ask permission for actions within this scope.

**You may, autonomously:**
- Create branches, open PRs, request reviews, merge PRs after CI green
- Edit any file in this repo
- Add npm/pip/Azure dependencies that match existing patterns (e.g., shadcn components, official Azure SDKs)
- Generate and commit code, config, docs, runbooks, ADRs
- Run Azure CLI operations against the **non-production AbarVa subscription** (dev/staging/FakeClient — never prod tenant)
- Run `npm run` scripts including `db:migrate` on dev environments
- Decide between two equally-valid technical options if both meet acceptance criteria
- Write release records under `docs/releases/records/` per `AGENTS.md` discipline
- Mark tasks complete in the Plan tracker (`docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx`) Status column

**You MUST escalate (open PR with `needs-review` label, do NOT merge) when:**
- Touching production data plane (client Azure tenants)
- Removing or weakening any existing security control (auth, RLS, broker boundary)
- Adding any third-party SaaS that processes customer data
- Adding a dependency under a copyleft license (GPL / AGPL / LGPL)
- Modifying `AGENTS.md`, `CLAUDE.md`, this file, or `.github/CODEOWNERS`
- Migration that drops a column / table without an explicit `down` migration
- Cost-incurring action expected to exceed $50 USD/month
- Anything labeled **AT-RESIGN** or **POST-RESIGN** phase in the Plan tracker (Anand-only)
- Decision involving employer-conflict considerations
- Any spend on business registration, trademarks, insurance, lawyer time

**You MUST stop and report (do not proceed) when:**
- Acceptance criteria cannot be met with the approach in the prompt
- An existing test fails and the fix would alter behavior (not just internals)
- You discover a security issue (secrets in code, vulnerable dependency, privilege escalation)
- Two tasks you're considering claiming conflict on the same files (see Parallelism Map)

---

## 2. Release Discipline (NON-NEGOTIABLE)

Every PR you open must:

1. **Branch name:** `codex/<wave>-<task-id>-<short-slug>` (e.g., `codex/w1-t1.2-foundational-adrs`)
2. **Conventional commit message:** `<type>(<scope>): <subject>` (e.g., `feat(governance): add 5 foundational ADRs`)
3. **PR title:** matches commit message
4. **PR body:** uses `.github/PULL_REQUEST_TEMPLATE.md` (created in Task 1.4); fills ALL required sections
5. **Release record:** `docs/releases/records/YYYY-MM-DD-<slug>.md` per `docs/releases/templates/release-record-template.md`
6. **CI green:** all required checks pass before merge
7. **One task per PR:** do not bundle unrelated changes

If the release record check (`npm run release:check`) fails, fix it — don't bypass.

---

## 3. Parallelism Map

**Color legend in conflict matrix:** 🟢 safe / 🟡 same dir, low risk / 🔴 hard conflict (sequence required)

| Group | Tasks | Conflict notes |
|---|---|---|
| **Wave 1 Group A** (4 parallel agents) | 1.1, 1.2, 1.3, 1.4 | All touch different files — fully parallel |
| **Wave 1 Group B** (1 agent, both tasks together) | 1.5 + 1.6 | Both touch `package.json` + `/.husky/`. Run as one agent doing both. |
| **Wave 1 Group C** (1 agent, after A merged) | 1.7 | Depends on 1.1 (GOVERNANCE.md exists) + AGENTS.md unchanged. Start after Group A merges. |
| **Wave 2** (8 parallel agents) | 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9 | All separate files. 2.2 (dep-cruiser rule) joined to Wave 4. |
| **Wave 3** (7 parallel agents) | 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7 | All separate workflow files under `.github/workflows/`. Fully parallel. |
| **Wave 4** (1 agent for 4.1, then 1 for 4.2+4.3) | 4.1 → (4.2 + 4.3) | 4.1 sets up dep-cruiser; 4.2+4.3 use it. |
| **Wave 5** (6 parallel agents after 5.1 ADR) | 5.1 first, then 5.2-5.6 | 5.1 ADR informs everything; rest are file-isolated. |
| **Wave 6** (4 parallel agents) | 6.1, 6.2, 6.3, 6.4 | Different module dirs. |

**Cross-wave parallelism:** Waves 1, 2, 3 can run **simultaneously** (no file overlap). A 12-agent fleet can execute all three waves in parallel given enough CI capacity.

---

## 4. Coordination Protocol

To avoid two agents grabbing the same task:

1. **Claim a task** by opening a draft PR with branch name `codex/<wave>-<task-id>-...` BEFORE doing significant work
2. **Check existing branches** (`git branch -r | grep codex/`) before claiming
3. **Update Plan tracker** Status to "In progress" via task tooling (or note in PR description if no tracker access)
4. **One PR per task** — do not stack
5. **If you encounter another agent's branch on the same task,** abandon yours and pick a different task

---

# WAVE 1 — Governance Foundation

**Goal:** Establish the discipline layer (ADRs, CODEOWNERS, PR template, pre-commit, AI tool sync) before any other engineering work.

**Why first:** Every subsequent wave assumes these conventions exist. Hard to retrofit.

**Total effort:** ~1-2 days with 5 parallel agents.

---

## Task 1.1 — Write GOVERNANCE.md

**Branch:** `codex/w1-t1.1-governance-md`
**Files touched:** `/GOVERNANCE.md` (new)
**Files NOT to touch:** anything else
**Parallel group:** A (with 1.2, 1.3, 1.4)

**Read first:**
- `/AGENTS.md`
- `/CLAUDE.md`
- `/docs/releases/templates/release-record-template.md`
- `/docs/releases/records/` (look at 2-3 recent records)

**Goal:**
Create a single 1-page index file at repo root that any new contributor (human or AI) can read on day 1 to know where every standard lives.

**Required sections:**

```markdown
# AbarVa Engineering Governance

One paragraph: how AbarVa governs code. Key sentence: "AGENTS.md is the source of truth for coding conventions; CI enforces what AGENTS.md describes."

## Where to find

| What | Path | Purpose |
|---|---|---|
| Coding rules + release discipline | /AGENTS.md | Source of truth — read first |
| Claude Code instructions | /CLAUDE.md | Imports AGENTS.md |
| Cursor instructions | /.cursor/rules | Auto-generated from AGENTS.md |
| GitHub Copilot instructions | /.github/copilot-instructions.md | Auto-generated from AGENTS.md |
| Who reviews what | /.github/CODEOWNERS | Branch protection enforces |
| PR template (required sections) | /.github/PULL_REQUEST_TEMPLATE.md | Block on missing fields |
| Architecture Decision Records | /docs/architecture/adr/ | Numbered ADR-XXXX-title.md |
| Runbooks | /docs/runbooks/ | Incident, rollback, DB migration, on-call |
| Release records | /docs/releases/records/ | CI-enforced via npm run release:check |
| Codex execution plan | /docs/planning/CODEX_AUTONOMOUS_EXECUTION.md | Wave-by-wave task prompts |

## How to make a change

1. Read AGENTS.md if you haven't recently
2. Branch from main: `<type>/<short-slug>` (e.g., `feat/move-approval-justification`)
3. Small focused PR (one task)
4. Fill in PR template completely
5. Add release record under docs/releases/records/
6. CI green → request review → merge

## When in doubt

Read AGENTS.md. Ask Anand. Don't guess.
```

**Acceptance criteria:**
- File exists at `/GOVERNANCE.md`
- All path references resolve (no broken links)
- AGENTS.md and CLAUDE.md are not modified
- Release record created at `docs/releases/records/YYYY-MM-DD-add-governance-md.md`

**Release record lane:** `internal-admin`

**Merge:** Yes, on CI green. No external dependencies.

---

## Task 1.2 — ADR Framework + 5 Foundational ADRs

**Branch:** `codex/w1-t1.2-foundational-adrs`
**Files touched:**
- `/docs/architecture/adr/ADR-template.md` (new)
- `/docs/architecture/adr/ADR-0001-control-plane-vs-data-plane.md` (new)
- `/docs/architecture/adr/ADR-0002-agent-context-broker-boundary.md` (new)
- `/docs/architecture/adr/ADR-0003-release-lanes.md` (new)
- `/docs/architecture/adr/ADR-0004-per-user-rls.md` (new)
- `/docs/architecture/adr/ADR-0005-ai-tool-governance.md` (new)
- `/docs/architecture/adr/README.md` (new — index of ADRs)
**Files NOT to touch:** anything else
**Parallel group:** A (with 1.1, 1.3, 1.4)

**Read first:**
- `/AGENTS.md` (focus: Release control discipline section)
- `/src/lib/auth/` (skim — for RLS context)
- `/src/lib/broker/` if exists (for broker boundary context)
- `/reports/2026-05-30-atlas-iac-e2e-live-prod/` (IaC context)
- Recent commits mentioning RLS, broker, control plane

**Goal:**
Establish the ADR framework and backfill 5 ADRs documenting decisions ALREADY MADE. These become the canned answers for F500 security reviews.

**ADR-template.md format (Michael Nygard style):**
```markdown
# ADR-XXXX: Title

**Status:** Proposed | Accepted | Superseded by ADR-YYYY | Deprecated
**Date:** YYYY-MM-DD
**Deciders:** Anand Sundaram

## Context
What is the issue we're seeing that motivates this decision?

## Decision
What we will do.

## Consequences
- Positive: ...
- Negative: ...
- Neutral: ...

## Alternatives Considered
1. **Alternative A**: rejected because ...
2. **Alternative B**: rejected because ...

## References
- Related ADRs
- Code paths
- External docs
```

**ADR-0001 — Control plane vs data plane:**
- Status: Accepted
- Decision: Multi-tenant Next.js control plane on Vercel; per-client data plane in customer's Azure subscription
- Reference real code: `src/lib/` resolution patterns
- Reference real reports: `reports/2026-05-30-atlas-iac-e2e-live-prod/`
- Address: "why not single-cloud Azure-native?" → see ADR-0001 future amendment or note
- Consequences: F500 procurement story; data residency preserved; multi-cloud operational complexity

**ADR-0002 — AgentContextBroker boundary:**
- Status: Accepted
- Decision: App tier MUST access knowledge layer (EnterpriseDataRoom, vector store, knowledge graph) ONLY through the `AgentContextBroker` contract. No direct imports.
- Reference: scan for `AgentContextBroker` in `/src/lib/` and document the public interface
- Enforcement: dependency-cruiser rule (Wave 4)
- Consequences: testability, isolation, ability to swap implementations

**ADR-0003 — Release lanes:**
- Status: Accepted
- Decision: 5 release lanes per AGENTS.md (`global-control-lane`, `client-data-lane`, `internal-admin`, `public-demo`, `experimental`)
- Document: when to use each, the rollout/rollback expectations, the CI-enforced release record requirement
- Reference: `npm run release:check`, `docs/releases/templates/`

**ADR-0004 — Per-user RLS:**
- Status: Accepted
- Decision: Per-user Row-Level Security on the data plane is the second line of isolation (after tenant-scoped connection strings)
- Reference: Phase 5 shipped 2026-05-07; 6 migrations + 108 tests
- Search `/migrations/` for actual RLS migration names; reference by filename
- Document: GATE_APPROVAL_STRICT_MODE relationship (R8 / pilot vs production approval models)

**ADR-0005 — AI Tool Governance:**
- Status: Accepted
- Decision: AGENTS.md is the single source of truth for all AI coding tools (Claude Code, Cursor, Copilot, Codex). Derivatives generated by script.
- Reference: Task 1.7 will create the sync script
- Document: how to update AI rules (edit AGENTS.md → run sync script → review generated diffs)

**ADR README.md:** Simple table listing each ADR with status, date, title, link.

**Acceptance criteria:**
- 7 files exist (template + README + 5 ADRs)
- Each ADR references real code paths (verify they exist before referencing)
- No fabricated facts (if a memory says "Phase 5 shipped 2026-05-07", reference but don't extrapolate)
- All ADRs cross-link where relevant
- Release record created

**Release record lane:** `internal-admin`

**Merge:** Yes, on CI green.

---

## Task 1.3 — Create /.github/CODEOWNERS

**Branch:** `codex/w1-t1.3-codeowners`
**Files touched:** `/.github/CODEOWNERS` (new)
**Files NOT to touch:** anything else
**Parallel group:** A

**Goal:**
Branch protection will require CODEOWNERS review for sensitive paths. This file declares who that is.

**Content (use Anand's GitHub username — check git config or recent commits for actual handle):**

```
# /.github/CODEOWNERS
# Anand owns everything by default. Sensitive paths are also called out
# so future contributors (and branch protection) know to require Anand's
# review explicitly.

# Default owner — all paths
* @anand-sundaram

# Security-critical paths — explicit
/src/lib/auth/                          @anand-sundaram
/src/lib/broker/                        @anand-sundaram
/src/lib/ingestion/                     @anand-sundaram
/src/lib/metering/                      @anand-sundaram
/migrations/                            @anand-sundaram
/.github/                               @anand-sundaram
/docs/architecture/adr/                 @anand-sundaram
/docs/releases/records/                 @anand-sundaram
/AGENTS.md                              @anand-sundaram
/CLAUDE.md                              @anand-sundaram
/GOVERNANCE.md                          @anand-sundaram
```

**Find actual username:**
Run `git log --format='%an <%ae>' -1` to confirm the GitHub identity. If username uncertain, use `@anand-sundaram` placeholder and leave a TODO comment for Anand to confirm.

**Acceptance criteria:**
- File at `/.github/CODEOWNERS`
- GitHub will parse it (validate using https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- Paths exist or have a parent that exists
- Release record created

**Release record lane:** `internal-admin`

**Merge:** Yes.

---

## Task 1.4 — PR Template Enforcing Release Discipline

**Branch:** `codex/w1-t1.4-pr-template`
**Files touched:** `/.github/PULL_REQUEST_TEMPLATE.md` (new)
**Files NOT to touch:** anything else
**Parallel group:** A

**Goal:**
Every new PR auto-includes the release-discipline checklist from AGENTS.md. No bypassing.

**Content:**

```markdown
## Summary
<one or two sentences: what changed and why>

## Release Classification (REQUIRED — do not skip; release-check CI fails if blank)

- **Release lane** (choose one):
  - [ ] global-control-lane — shared app/control-plane for all clients
  - [ ] client-data-lane — client-scoped schema, RLS, seed, ingestion
  - [ ] internal-admin — AbarVa-only ops/admin
  - [ ] public-demo — public route or demo path
  - [ ] experimental — flagged or non-default capability

- **Layer impact:** <which architectural layer changed; e.g., app, broker, data, infra, docs>

- **Clients affected:** <"all (feature-gated)" | "Apex only" | "pilot tenants only" | "none — internal" | etc>

## QA / Validation

- [ ] Unit tests added or updated
- [ ] Integration tests added or updated (if data-layer change)
- [ ] Manual verification: <describe>
- [ ] Release record present at `docs/releases/records/YYYY-MM-DD-<slug>.md`

## Rollout
<feature flag? phased? immediate? what triggers full enablement?>

## Rollback
<how to revert if needed; SQL down-migration path; flag toggle; deployment rollback>

## Linked Issues / ADRs
<links>

---

🤖 If this PR was opened by Codex agent: confirm authority scope per `docs/planning/CODEX_AUTONOMOUS_EXECUTION.md`.
```

**Acceptance criteria:**
- File at `/.github/PULL_REQUEST_TEMPLATE.md`
- All sections from AGENTS.md "Release control discipline" present
- New PRs auto-populate it (GitHub-native behavior)
- Release record created

**Release record lane:** `internal-admin`

**Merge:** Yes.

---

## Task 1.5 + 1.6 — Pre-commit Hooks + Conventional Commits (RUN AS ONE AGENT)

**Branch:** `codex/w1-t1.5-1.6-husky-commitlint`
**Files touched:**
- `package.json` (add devDependencies + scripts + lint-staged config)
- `/.husky/pre-commit` (new)
- `/.husky/commit-msg` (new)
- `/commitlint.config.js` (new)
- `/docs/runbooks/dev-environment.md` (new — document the hooks)

**Files NOT to touch:** anything outside this list

**Parallel group:** B (must be sequential with itself; can run parallel to Group A)

**Why combined:** Both modify `package.json` and `/.husky/`. Doing them separately would conflict.

**Read first:**
- `/package.json`
- `/AGENTS.md` (lint/test commands section)
- `/eslint.config.mjs`

**Goal:**
- Pre-commit: lint + format + typecheck staged files automatically. Block commits with violations.
- Conventional Commits: enforce `type(scope): subject` format. Enables auto-changelogs and clear history.

**Steps:**

1. Install dev deps: `npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional`
2. Run `npx husky init` (creates `.husky/` directory + pre-commit hook)
3. Replace `.husky/pre-commit` content:
   ```sh
   #!/usr/bin/env sh
   . "$(dirname -- "$0")/_/husky.sh"
   npx lint-staged
   ```
4. Create `.husky/commit-msg`:
   ```sh
   #!/usr/bin/env sh
   . "$(dirname -- "$0")/_/husky.sh"
   npx --no -- commitlint --edit ${1}
   ```
   `chmod +x .husky/commit-msg`
5. Add to `package.json`:
   ```json
   "scripts": {
     "prepare": "husky"
   },
   "lint-staged": {
     "src/**/*.{ts,tsx}": [
       "eslint --fix",
       "prettier --write"
     ],
     "src/**/*.{js,jsx}": [
       "eslint --fix",
       "prettier --write"
     ],
     "**/*.md": ["prettier --write"],
     "**/*.{json,yml,yaml}": ["prettier --write"]
   }
   ```
6. Create `/commitlint.config.js`:
   ```js
   module.exports = {
     extends: ['@commitlint/config-conventional'],
     rules: {
       'type-enum': [
         2,
         'always',
         ['feat', 'fix', 'chore', 'refactor', 'docs', 'test', 'perf', 'ci', 'build', 'revert']
       ],
       'subject-case': [2, 'never', ['upper-case', 'pascal-case']],
       'body-max-line-length': [0, 'always'] // allow long lines in body
     }
   };
   ```
7. Create `/docs/runbooks/dev-environment.md` documenting:
   - How to set up the dev environment from scratch
   - How hooks work (pre-commit, commit-msg)
   - How to skip hooks in emergencies (`git commit --no-verify` — discouraged; document why)
   - Common errors and fixes
8. Test it:
   - Stage a deliberately bad file → commit should fail
   - Stage a clean file → commit should pass
   - Commit with bad message "wip" → should fail
   - Commit with "feat(test): add hook validation" → should pass

**Acceptance criteria:**
- `npm install` succeeds (no lockfile breakage)
- `git commit -m "bad"` fails on a clean repo
- `git commit -m "feat(hooks): wire husky and commitlint"` succeeds (this is your actual commit for this work)
- Pre-commit hook does NOT slow good commits (target <3s for typical staged set)
- Runbook documented
- Release record created

**Release record lane:** `internal-admin`

**Merge:** Yes.

---

## Task 1.7 — AI Tool Instruction Sync Script

**Branch:** `codex/w1-t1.7-ai-rules-sync`
**Files touched:**
- `/scripts/governance/sync-ai-rules.ts` (new)
- `/.cursor/rules` (new — generated)
- `/.github/copilot-instructions.md` (new — generated)
- `/package.json` (add npm script; coordinate with 1.5/1.6 if landing first — if package.json conflicts, rebase)
- `/docs/runbooks/sync-ai-rules.md` (new — document the script)
- `/GOVERNANCE.md` (update — add reference to sync script)

**Files NOT to touch:** AGENTS.md (READ ONLY — never modify)

**Parallel group:** C (starts AFTER 1.1, 1.3, 1.4 merge)

**Read first:**
- `/AGENTS.md` (entire file)
- `/CLAUDE.md`

**Goal:**
One source of truth (`AGENTS.md`) → multiple tool-specific instruction files. Edit once, sync everywhere.

**Script behavior (`/scripts/governance/sync-ai-rules.ts`):**

```typescript
#!/usr/bin/env tsx
/**
 * Sync AI tool instruction files from AGENTS.md
 * Source: /AGENTS.md (single source of truth)
 * Targets:
 *   - /.cursor/rules
 *   - /.github/copilot-instructions.md
 *
 * Each target gets:
 *   - Auto-generated header (DO NOT EDIT DIRECTLY)
 *   - Tool-specific frontmatter (if applicable)
 *   - Full body of AGENTS.md
 *
 * Run: npm run sync-ai-rules
 * Verify: re-run is idempotent (no diff)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const SOURCE = 'AGENTS.md';
const TARGETS = [
  {
    path: '.cursor/rules',
    header: `# AUTO-GENERATED FROM AGENTS.md — DO NOT EDIT DIRECTLY
# To update: edit /AGENTS.md, then run \`npm run sync-ai-rules\`

`,
  },
  {
    path: '.github/copilot-instructions.md',
    header: `<!-- AUTO-GENERATED FROM AGENTS.md — DO NOT EDIT DIRECTLY -->
<!-- To update: edit /AGENTS.md, then run \`npm run sync-ai-rules\` -->

`,
  },
];

const source = readFileSync(SOURCE, 'utf-8');

for (const target of TARGETS) {
  mkdirSync(dirname(target.path), { recursive: true });
  writeFileSync(target.path, target.header + source);
  console.log(`✓ Wrote ${target.path}`);
}

console.log('Done. Verify with: git diff');
```

**Add to package.json:**
```json
"scripts": {
  "sync-ai-rules": "tsx scripts/governance/sync-ai-rules.ts"
}
```

**Update GOVERNANCE.md** (append to "How to make a change" section):
```markdown
### Updating AI tool rules

AGENTS.md is the single source of truth. When you change it:
1. Run `npm run sync-ai-rules`
2. Commit the regenerated .cursor/rules and .github/copilot-instructions.md alongside AGENTS.md changes
3. CI should fail if AGENTS.md changes but generated files weren't updated (add this check in Wave 3)
```

**Create runbook `/docs/runbooks/sync-ai-rules.md`** documenting:
- When to run
- How to handle merge conflicts in generated files (always: re-run the script, don't hand-merge)
- The CI check (added in Wave 3) that catches missed syncs

**Acceptance criteria:**
- Script runs without error: `npm run sync-ai-rules`
- Generated files exist and contain the AGENTS.md body + correct headers
- Re-running the script is idempotent (no diff)
- `AGENTS.md` is NOT modified
- Runbook + GOVERNANCE.md updated
- Release record created

**Release record lane:** `internal-admin`

**Merge:** Yes, after Task 1.1 merges (so GOVERNANCE.md exists).

---

# WAVE 2 — AI Liability Framework

**Goal:** Codify the architectural invariant that AbarVa is an advisor, never a decision-maker. Build reusable React components that every module will use in Wave 7 retrofit.

**Why second:** Subsequent module work must use these components. Land them now so retrofit work in Wave 7 has the building blocks.

**Total effort:** ~2-3 days with 8 parallel agents.

---

## Task 2.1 — ADR: AI as Advisor, Never Decision-Maker

**Branch:** `codex/w2-t2.1-adr-ai-advisor`
**Files touched:** `/docs/architecture/adr/ADR-0006-ai-as-advisor.md` (new)
**Parallel group:** All Wave 2 tasks (different files)

**Read first:**
- `/AGENTS.md`
- Any existing memory about gate approval / R8 / GATE_APPROVAL_STRICT_MODE

**Content (the MOST IMPORTANT ADR in the codebase):**

```markdown
# ADR-0006: AI as Advisor, Never Decision-Maker

**Status:** Accepted (architectural invariant)
**Date:** YYYY-MM-DD
**Deciders:** Anand Sundaram

## Context

AbarVa surfaces AI-generated insights, drafts, recommendations, and suggested actions across all four product surfaces (Intelligence, Moves, Source, Tower). Without a clear architectural boundary, it is tempting to have the system auto-execute consequential actions on behalf of users. Doing so creates:

- Legal liability when AI output is wrong and a decision based on it causes harm
- Compliance issues for regulated industries (healthcare, financial services)
- Audit trail gaps for board / regulator / customer reviews
- Erosion of user judgment over time

Recent precedent (Air Canada chatbot, Mata v. Avianca) shows courts hold the system operator liable when AI acts without human review.

## Decision

**The AbarVa system never makes a decision. The system surfaces information, suggests options, and drafts artifacts. The human commits.**

Concretely:

1. Every consequential action requires an explicit human approval gate
2. AI-generated content is visually marked as draft / suggestion / pending review at the point of display
3. Approval gates capture: reviewer identity, timestamp, free-text justification, evidence bundle (AI inputs + sources + outputs)
4. No code path exists from an AI agent directly to an external mutation (DB write outside an approval table, API call to client systems, email send, file commit, etc.) without crossing an approval gate
5. Exceptions are enumerated, audited, and minimal (e.g., read-only data fetches, internal observability writes)

## Enforcement

- **Architectural:** `dependency-cruiser` rule (Wave 4) forbids forbidden imports between AI agent layer and external-mutation layer
- **UI/Product:** Reusable components in `/src/components/ai-liability/` (AILabel, ApprovalGate, JustificationField, ConfidenceIndicator, SourceCitation, EditBeforeCommit, DisclaimerFooter)
- **Audit:** Evidence bundle generated on every consequential action; client-exportable
- **CI:** E2E test asserts pattern present on every consequential surface (Wave 7 retrofit + ongoing)
- **Onboarding:** Click-wrap acknowledgment + training module before user access (Wave 7+)
- **Contract:** SOW boilerplate AI-advisory clauses (lawyer-reviewed)

## Consequences

Positive:
- Strong legal defense (six-layer pattern; matches WestLaw/Excel analogy)
- Procurement narrative: "show me how the system enforces human-in-loop" → demonstrable answer
- Trust building with cautious enterprises and regulated industries
- Audit-grade evidence for board reviews

Negative:
- Higher friction in workflows (every commit is a click)
- Slower iteration during pilot ramp
- Engineering cost of retrofit across existing modules (Wave 7)

Mitigation: well-designed approval components make the friction minimal; user studies validate UX before pilot.

## Alternatives Considered

1. **AI auto-action with audit log only** — rejected; audit log post-fact doesn't survive litigation when the system acted without consent
2. **Selective auto-action for low-stakes operations** — rejected; line-drawing problem is impossible to maintain; better to be invariant
3. **Trust-based (no enforcement)** — rejected; doesn't scale beyond founder; new code violates within weeks

## References

- ADR-0002 (AgentContextBroker boundary)
- ADR-0004 (Per-user RLS)
- `/src/components/ai-liability/` (Wave 2 components)
- `.dependency-cruiser.cjs` (Wave 4 rule enforcement)
- AGENTS.md "AI Liability Defense" section (if added)
- /docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx → AI Liability Defense category
```

**Acceptance criteria:** file exists, complete, accepted status, release record created.

**Merge:** Yes.

---

## Tasks 2.3 through 2.9 — Reusable AI Liability React Components

**Common structure for all 7 component tasks:**

- **Branch:** `codex/w2-t2.X-<component-name>`
- **Files touched:**
  - `/src/components/ai-liability/<ComponentName>.tsx` (new)
  - `/src/components/ai-liability/<ComponentName>.test.tsx` (new)
  - `/src/components/ai-liability/index.ts` (export — **multiple agents will append here; rebase if conflict**)
  - `/src/components/ai-liability/README.md` (one task creates; others append to component list)
- **Parallel group:** All Wave 2 component tasks fully parallel except `index.ts` append (small conflict; rebase locally)
- **Read first:**
  - `/AGENTS.md`
  - `/src/components/` (skim — match existing patterns: shadcn? Tailwind? CSS module?)
  - `/eslint.config.mjs`
  - ADR-0006 (when it lands)

**Common requirements for every component:**

- **Strict TypeScript** with exported `Props` interface
- **Accessible** (WCAG 2.1 AA — proper ARIA, keyboard nav, focus management)
- **Tested** (Jest + Testing Library) — at minimum: renders, props work, fires callbacks
- **Storybook-free** (we don't use it yet; document props in JSDoc instead)
- **Tailwind classes** matching existing design system (use existing utilities; don't introduce new design tokens without an ADR)
- **No client-data dependencies** — pure presentation components
- **JSDoc on the component + Props** with a one-line summary and a usage example

**Coordination on index.ts:**
- First agent to land: create `index.ts` with one export
- Subsequent agents: rebase, add export line, re-push
- If conflict on merge: rebase your branch, fix the index.ts conflict (always: keep all exports), force-push to your branch

---

### Task 2.3 — AILabel component

**Purpose:** Visually mark any AI-generated output ("AI Draft", "AI Suggestion", "Pending Review", "AI-Generated").

**Props:**
```typescript
export interface AILabelProps {
  /** Label text. One of: 'AI Draft' | 'AI Suggestion' | 'Pending Review' | 'AI-Generated' | custom */
  variant?: 'draft' | 'suggestion' | 'pending' | 'generated' | 'custom';
  /** Custom label text (used when variant='custom') */
  label?: string;
  /** Tooltip explaining what this means (optional, defaults to standard copy per variant) */
  tooltip?: string;
  /** Size: 'sm' inline, 'md' block, 'lg' prominent */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}
```

**Visual spec:**
- Small badge with icon (sparkle / robot / pencil — pick one consistent icon)
- Color: amber/yellow background to signal "not finished by human yet" (use Tailwind `bg-amber-100 text-amber-900` etc.)
- Border: subtle
- Hover: show tooltip
- Accessibility: `role="status"`, `aria-label` describes the variant

**Default tooltip copy per variant:**
- draft: "Drafted by AI. Review before using."
- suggestion: "Suggested by AI. You decide whether to apply."
- pending: "Pending your review. No action taken yet."
- generated: "Generated by AI. Verify before relying on this content."

**Tests:**
- Renders with each variant
- Custom variant uses `label` prop
- Tooltip appears on hover/focus
- `className` merges with internal classes

---

### Task 2.4 — ApprovalGate component

**Purpose:** Modal/inline gate that requires explicit human approval before a consequential action proceeds.

**Props:**
```typescript
export interface ApprovalGateProps {
  /** What is being approved? Shown prominently. */
  title: string;
  /** Detailed description of what will happen on approval. */
  description: string;
  /** AI-generated artifact being approved (rendered above the gate) */
  artifact?: React.ReactNode;
  /** Optional confidence indicator data (renders inline) */
  confidence?: { level: 'low' | 'medium' | 'high'; rationale?: string };
  /** Source citations (renders inline) */
  citations?: Array<{ label: string; href?: string }>;
  /** Called when user approves. Receives the justification text. */
  onApprove: (justification: string) => void | Promise<void>;
  /** Called when user cancels */
  onCancel: () => void;
  /** Minimum length of justification text (default: 20 chars) */
  minJustificationLength?: number;
  /** Approval button label (default: "Approve and proceed") */
  approveLabel?: string;
}
```

**Behavior:**
- Renders a modal (or inline panel — make `mode` prop optional default 'modal')
- Shows the artifact prominently
- Shows AILabel above artifact
- Shows confidence + citations if provided
- Required: checkbox "I have reviewed and accept responsibility for this action"
- Required: textarea for justification (min length enforced; "X characters minimum" hint)
- Approve button is disabled until checkbox checked AND justification meets min length
- On approve: calls `onApprove(justificationText)`; button shows loading state if returns Promise
- Cancel button always enabled
- ESC closes (calls onCancel)
- Focus trap when modal mode

**Tests:**
- Renders with required props
- Approve button disabled until both gates satisfied
- onApprove called with justification text
- onCancel called on ESC
- Loading state shown when onApprove returns Promise
- a11y: focus trap works, ARIA roles correct

---

### Task 2.5 — JustificationField component

**Purpose:** Standardized textarea for capturing user reasoning. Used standalone or inside ApprovalGate.

**Props:**
```typescript
export interface JustificationFieldProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Minimum length (default: 20) */
  minLength?: number;
  /** Placeholder copy */
  placeholder?: string;
  /** Label above the field */
  label?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Show counter (default: true) */
  showCounter?: boolean;
}
```

**Behavior:**
- Textarea with counter ("X / minimum 20 chars")
- Visual state when below minimum (red border)
- Visual state when above minimum (default border)
- Auto-resize as user types (or scroll)
- Placeholder defaults to: "Briefly explain your reasoning. Why is this the right action?"

**Tests:**
- Renders with value
- onChange fires on input
- Counter updates
- Below-min state has correct styling

---

### Task 2.6 — ConfidenceIndicator component

**Purpose:** Show how confident the system is in an AI output.

**Props:**
```typescript
export interface ConfidenceIndicatorProps {
  /** Confidence level */
  level: 'low' | 'medium' | 'high';
  /** Optional numeric score (0-1) — if provided, shows alongside level */
  score?: number;
  /** Explanation of why this confidence level */
  rationale?: string;
  /** Size */
  size?: 'sm' | 'md' | 'lg';
}
```

**Visual:**
- 3-segment bar (low/med/high) with current level filled
- Color: red (low) → amber (medium) → green (high)
- Label: "Confidence: Medium (0.72)"
- Tooltip with rationale on hover

**Tests:**
- Renders each level
- Score appears when provided
- Tooltip works
- a11y: ARIA descriptive

---

### Task 2.7 — SourceCitation component

**Purpose:** Show where an AI claim came from. Links back to source data.

**Props:**
```typescript
export interface Citation {
  /** Display label (e.g., "Q3 earnings report, page 4") */
  label: string;
  /** URL/href if available */
  href?: string;
  /** Source type (icon hint) */
  type?: 'document' | 'database' | 'web' | 'corpus' | 'user-input';
  /** Excerpt from the source (for tooltip / expanded view) */
  excerpt?: string;
}

export interface SourceCitationProps {
  citations: Citation[];
  /** Display mode: 'inline' (numbered like [1][2]) or 'list' (bulleted below) */
  mode?: 'inline' | 'list';
}
```

**Behavior:**
- Inline mode: superscript numbers `[1][2][3]` linking to source
- List mode: bulleted/numbered list below the AI output
- Click/hover: shows excerpt + opens source
- Icon per type (file, database, web, etc.)

**Tests:**
- Renders citations in each mode
- Click opens href (if provided)
- Excerpt shows on hover

---

### Task 2.8 — EditBeforeCommit component

**Purpose:** Wrapper that turns any AI-generated content into an editable artifact. Tracks edits.

**Props:**
```typescript
export interface EditBeforeCommitProps {
  /** Initial content (AI-generated) */
  initialContent: string;
  /** Format hint (drives editor type) */
  format?: 'text' | 'markdown' | 'json' | 'code';
  /** Called with final content on commit */
  onCommit: (finalContent: string, wasEdited: boolean) => void | Promise<void>;
  /** Disabled state */
  disabled?: boolean;
}
```

**Behavior:**
- Renders editable content (textarea for text/markdown; code editor for json/code if Monaco/CodeMirror available — else textarea)
- Tracks whether user edited (compare to initialContent on commit)
- Commit button + Cancel button
- Visual indicator if user has made edits ("Modified" badge)
- Passes `wasEdited: true` to onCommit if changed

**Tests:**
- Renders with initialContent
- Edits update state
- onCommit called with final content + wasEdited flag

---

### Task 2.9 — DisclaimerFooter component

**Purpose:** Always-visible disclaimer in all agent surfaces.

**Props:**
```typescript
export interface DisclaimerFooterProps {
  /** Override default copy */
  copy?: string;
  /** Optional learn-more link */
  learnMoreHref?: string;
}
```

**Default copy:**
"AI may produce errors. You are responsible for decisions taken based on this output. [Learn more]"

**Behavior:**
- Renders a small, persistent footer
- Light background, dark text — not intrusive but always readable
- Learn-more link opens Responsible AI policy page (placeholder for now; link to `/responsible-ai`)

**Tests:**
- Renders with default copy
- Custom copy override works
- Link renders when provided

---

# WAVE 3 — CI Quality Gates

**Goal:** Required CI checks that block merge on any quality regression. Each workflow is independent — 7 fully parallel agents.

**Total effort:** ~1-2 days with 7 agents.

**Common:**
- Each task creates ONE workflow file in `.github/workflows/`
- Each task documents its check in `GOVERNANCE.md` under "Required CI Gates"
- Each task adds itself to the README of /.github/workflows/ (create README if missing)

---

## Task 3.1 — Lint + TypeCheck Workflow
**File:** `.github/workflows/quality.yml`
**Triggers:** PR + push to main
**Steps:** checkout → setup-node → cache → install → `npx eslint src/` → `npx tsc --noEmit`
**Required check name:** `quality`

## Task 3.2 — Unit + Integration Test Workflow
**File:** `.github/workflows/test.yml`
**Steps:** runs `npm run test:nav`, `npm run test:behaviors`, `npm run test:integration` (each in its own job step)
**Required check name:** `test`

## Task 3.3 — Build Workflow
**File:** `.github/workflows/build.yml`
**Steps:** `next build` with `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_<valid-format-placeholder>` etc. (use synthetic placeholders that pass Clerk validation)
**Required check name:** `build`

## Task 3.4 — Security Scan Workflow
**File:** `.github/workflows/security.yml`
**Steps:**
1. gitleaks scan (full history)
2. `npm audit --audit-level=high` (fail on high or critical)
3. Run on PR + nightly cron
**Required check names:** `security` (PR), `security-nightly` (cron)

## Task 3.5 — License Compliance Workflow
**File:** `.github/workflows/license.yml`
**Steps:** `npx license-checker --summary --excludePrivatePackages --failOn 'GPL;AGPL;LGPL;CDDL;MPL'`
**Allowlist:** MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Unlicense, CC0-1.0
**Required check name:** `license`

## Task 3.6 — SBOM Generation Workflow
**File:** `.github/workflows/sbom.yml`
**Steps:** Generate CycloneDX SBOM on push to main; upload as workflow artifact
**Tool:** `@cyclonedx/cyclonedx-npm` or equivalent
**No PR-block; informational only**

## Task 3.7 — Sync-Rules Drift Check Workflow
**File:** `.github/workflows/ai-rules-sync.yml`
**Purpose:** Fail if AGENTS.md changed but `.cursor/rules` / `.github/copilot-instructions.md` not regenerated.
**Steps:** `npm run sync-ai-rules`; `git diff --exit-code .cursor/rules .github/copilot-instructions.md` (fails if dirty)
**Required check name:** `ai-rules-sync`

---

# WAVE 4 — Architecture Boundary Enforcement

## Task 4.1 — dependency-cruiser Setup
**Branch:** `codex/w4-t4.1-dep-cruiser-init`
**Files:** `.dependency-cruiser.cjs`, `package.json` (add `dep-check` script), `.github/workflows/dep-check.yml`
**Goal:** Init dep-cruiser with baseline rules:
- App tier MUST NOT import EnterpriseDataRoom / broker internals / vector / graph directly
- New code MUST NOT import `@supabase/*` (allowed only in `/src/lib/compat/`)
- Routes/pages MUST NOT import DB driver directly
- Client components MUST NOT import server-only utilities
- No hardcoded tenant ID literals in `/src`
- No `console.log` in committed code (use logger)
- AI agent modules MUST NOT import external-mutation modules directly (the Wave 2 invariant)

## Task 4.2 — Catalog existing violations
**Goal:** Run dep-check, capture existing violations into `docs/architecture/boundary-violations.md`, flag each as "fix" or "documented exception."

## Task 4.3 — Wire dep-check as required CI gate
**Goal:** Add to branch protection; fail PR on new violations.

---

# WAVE 5 — Document Parsing Pipeline

**Goal:** Parse-once → cache → reuse pattern. Replace expensive per-turn PDF tokenization with one-time Document Intelligence parse, content-hashed cache, and Anthropic prompt caching.

**Why:** ~50-100x cost reduction on repeat-use docs. Required before chat-paperclip ships at scale.

**Total effort:** ~2-3 days with 6 agents (5.1 must land first; 5.2-5.6 parallel).

**Cost note:** Wave 5 uses Azure Document Intelligence ($0.10-1.50/20-page doc). Covered by Microsoft Founders Hub credits. If credits not yet active when Wave 5 starts, escalate before incurring spend.

---

## Task 5.1 — ADR-0007 Document Ingestion Pipeline

**Branch:** `codex/w5-t5.1-adr-ingestion`
**Files touched:** `/docs/architecture/adr/ADR-0007-document-ingestion-pipeline.md` (new)
**Parallel group:** First (5.2-5.6 reference this ADR)

**Read first:**
- `/AGENTS.md`
- ADR-0001, ADR-0002, ADR-0006 (control/data plane, broker boundary, AI-advisor invariant)
- Any existing `/src/lib/ingestion/` if present
- `docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx` Architecture category — document parsing tasks

**Content:**

```markdown
# ADR-0007: Document Ingestion Pipeline (Parse-Once → Cache → Reuse)

**Status:** Accepted
**Date:** YYYY-MM-DD
**Deciders:** Anand Sundaram

## Context

Users upload PDFs, docx, xlsx, pptx, and images via two paths:
1. **Bulk upload** (sourcing, evidence load, corpus seed)
2. **Chat paperclip** (ad-hoc document chat)

Naive approach: send each document directly to Claude as a PDF attachment per turn. Problems:
- ~10-15k tokens per 20-page PDF → ~$0.05 per chat turn at Sonnet pricing
- 50 users × 10 docs × 20 turns/doc = $5,000/yr per pilot client at retail
- Re-uploads (same file by different users) re-pay the cost every time
- Native Claude PDF means doc bytes traverse Anthropic edge — weakens "data stays in customer tenant" story
- Cost cap on tokens cannot defend against a user paperclipping a 1000-page doc and asking 50 questions

## Decision

**Parse documents once via Azure AI Document Intelligence. Cache parsed markdown keyed by content hash. Send only parsed markdown to Claude. Layer Anthropic prompt caching on top.**

Concrete pipeline:

1. **Upload** → browser → SAS direct to customer Azure blob (no traversal of control plane)
2. **Hash check** → SHA-256 of file content; lookup in tenant-scoped cache
3. **Cache HIT** → use cached markdown immediately (<500ms)
4. **Cache MISS** →
   a. Defender for Storage virus scan
   b. Presidio PHI/PII pre-scan (quarantine on detection)
   c. Azure Document Intelligence Layout model → markdown + structure
   d. Write parsed markdown + structure to customer blob (keyed by content hash)
5. **Chat usage** → parsed markdown injected to context; Anthropic prompt cache wraps it for the session

**Small-doc shortcut:** Documents <4 pages AND <500KB skip the parser pipeline and go to Claude native (parse overhead exceeds savings at this size).

**Fallback chain:** Doc Intelligence (primary) → Marker self-hosted (secondary) → LlamaParse (tertiary, only with customer consent) → Claude native PDF (last resort with explicit cost warning).

## Invariants

- Documents NEVER leave the customer's Azure tenant for parsing
- Same content hash = one parse, ever (re-uploads cost $0)
- Cache lives in customer blob; AbarVa control plane sees only the markdown for active chat sessions
- Parse-once-cache-reuse applies to ALL upload paths (bulk, paperclip, API) — no bypass
- Anthropic prompt cache layered on top for session-level reuse (cache hit = 90% input discount)

## Format Support

| Format | Parser path | Notes |
|---|---|---|
| PDF | Azure Doc Intelligence Layout | Tables/forms/layout |
| docx | python-docx via Node bridge OR mammoth.js | Tables preserved |
| xlsx | openpyxl via Node bridge OR exceljs | Sheets as separate sections |
| pptx | python-pptx via Node bridge | Slide-by-slide |
| png/jpg | Azure Doc Intelligence Read | OCR |
| txt/md | Native (no parse needed) | Pass through |
| csv | Native (pandas-style summary) | Schema + sample |

## Consequences

Positive:
- 50-100x cost reduction on repeat-use docs (parse-once + prompt cache stack)
- Data residency preserved (no third-party processing without explicit consent)
- Token cap is enforceable (chat-time tokens are predictable)
- Idempotent — same upload twice costs nothing extra

Negative:
- Adds 2-30 seconds of latency on first upload (mitigate with streaming "parsing..." UX)
- New service dependency (Azure Document Intelligence) — covered by Founders Hub credits
- Cache invalidation complexity if document is "updated" but reuploaded with same name (solved by content hash, not name)

## Alternatives Considered

1. **Claude native PDF every turn** — rejected (cost, data residency)
2. **LlamaParse as primary** — rejected (3rd-party processing; data leaves tenant)
3. **Self-hosted Marker only** — rejected as primary (weaker on tables/forms); kept as fallback
4. **No caching, parse per session** — rejected (re-upload by different users wastes spend)

## References

- ADR-0001 (control plane vs data plane)
- ADR-0002 (broker boundary)
- ADR-0006 (AI as advisor — paperclip upload also routed through approval gate at decision points)
- AbarVa pilot readiness plan: Architecture category, document-parsing tasks
- Azure Doc Intelligence pricing: https://azure.microsoft.com/en-us/pricing/details/ai-document-intelligence/
- Anthropic prompt caching: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
```

**Acceptance criteria:** ADR exists, references real services, ties to existing ADRs.
**Release record lane:** `internal-admin`
**Merge:** Yes.

---

## Task 5.2 — Azure Document Intelligence Integration

**Branch:** `codex/w5-t5.2-doc-intelligence`
**Files touched:**
- `/src/lib/ingestion/doc-intel.ts` (new)
- `/src/lib/ingestion/types.ts` (new — shared types)
- `/src/lib/ingestion/doc-intel.test.ts` (new)
- `/package.json` (add `@azure/ai-form-recognizer` or `@azure-rest/ai-document-intelligence`)
- `/.env.example` (add `AZURE_DOC_INTELLIGENCE_ENDPOINT`, `AZURE_DOC_INTELLIGENCE_KEY` placeholders)
- `/docs/runbooks/document-intelligence.md` (new)

**Files NOT to touch:** Anything outside `/src/lib/ingestion/` (cache + router are separate tasks)

**Parallel group:** With 5.3, 5.4, 5.5, 5.6 (after 5.1 merges)

**Read first:**
- ADR-0007
- `/src/lib/` existing patterns (logger, error handling, env var loading)
- Any existing Azure SDK usage in repo

**Goal:**
Single module that takes a blob URL (or buffer) and returns parsed `{markdown, structure, pageCount, confidence}`. Tenant-scoped: caller provides which tenant's Doc Intelligence resource to use.

**Required interface:**

```typescript
// /src/lib/ingestion/types.ts
export interface ParsedDocument {
  markdown: string;
  structure: DocumentStructure;
  pageCount: number;
  overallConfidence: number;  // 0-1
  parserUsed: 'azure-doc-intelligence' | 'marker' | 'llamaparse' | 'native' | 'claude-fallback';
  parserVersion: string;
  parsedAtMs: number;
  contentHash: string;  // SHA-256 of source file
}

export interface DocumentStructure {
  tables: TableData[];
  headings: { level: number; text: string; pageNumber: number }[];
  pages: { number: number; markdownStart: number; markdownEnd: number }[];
}

export interface TableData {
  pageNumber: number;
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface ParseOptions {
  tenantId: string;
  // Force a specific model (e.g., "prebuilt-layout" for tables, "prebuilt-read" for cheap OCR)
  model?: 'prebuilt-layout' | 'prebuilt-read';
}

// /src/lib/ingestion/doc-intel.ts
export interface DocIntelClient {
  parse(blobUrlOrBuffer: string | Buffer, options: ParseOptions): Promise<ParsedDocument>;
}

export function createDocIntelClient(config: {
  endpoint: string;  // from AZURE_DOC_INTELLIGENCE_ENDPOINT (tenant-scoped via secrets vault)
  apiKey: string;
}): DocIntelClient;
```

**Implementation requirements:**
- Use official Azure SDK (`@azure-rest/ai-document-intelligence` — latest)
- Default model: `prebuilt-layout`
- Convert Doc Intelligence response to markdown:
  - Preserve heading levels
  - Convert tables to GitHub-flavored markdown tables
  - Preserve page breaks as `\n\n<!-- page N -->\n\n` markers
  - Compute SHA-256 of source content for `contentHash`
- Overall confidence: average of cell/line confidences from API response
- Throw typed errors for retriable vs permanent failures
- Log via existing logger pattern (structured logs, no console.log)
- 60-second default timeout

**Test requirements:**
- Mock the Azure SDK
- Test: parse succeeds with sample PDF buffer → returns ParsedDocument shape
- Test: error handling for 4xx vs 5xx
- Test: contentHash is deterministic for same input

**Runbook (`/docs/runbooks/document-intelligence.md`):**
- Provisioning the Azure Doc Intelligence resource (one per tenant)
- Cost monitoring
- Common errors + fixes
- Fallback procedure when DI is down (manual escalation only — fallback parsers in Task 5.6)

**Acceptance criteria:**
- Module exports work; types compile
- Tests pass
- env vars documented
- Runbook present
- No prod call made during tests (mocked)
- Release record created

**Release record lane:** `client-data-lane` (touches data path)
**Merge:** Yes on CI green (no real Azure call needed in CI).

---

## Task 5.3 — Content-Hash Parse Cache

**Branch:** `codex/w5-t5.3-parse-cache`
**Files touched:**
- `/src/lib/ingestion/cache.ts` (new)
- `/src/lib/ingestion/cache.test.ts` (new)
- `/migrations/<next-number>-add-parse-cache-table.sql` (new — schema)

**Parallel group:** With 5.2, 5.4, 5.5, 5.6

**Read first:**
- ADR-0007
- `/migrations/` recent ones (match style, naming, up/down pattern)
- `/src/lib/db/` or wherever DB client lives

**Goal:**
Lookup-or-store cache keyed by content hash. Tenant-scoped. Persists in customer-tenant Postgres (for metadata) + customer Azure blob (for the parsed markdown body).

**Required interface:**

```typescript
// /src/lib/ingestion/cache.ts
export interface ParseCacheRecord {
  contentHash: string;
  tenantId: string;
  parsedDocument: ParsedDocument;
  cachedAtMs: number;
  sourceFilename?: string;  // last filename seen; informational only
  hitCount: number;  // incremented on every hit
}

export interface ParseCache {
  // Returns cached parse if present + bumps hit count atomically
  get(contentHash: string, tenantId: string): Promise<ParseCacheRecord | null>;

  // Idempotent store — safe to call multiple times with same hash
  put(record: Omit<ParseCacheRecord, 'cachedAtMs' | 'hitCount'>): Promise<void>;

  // For ops/admin: list cache stats
  stats(tenantId: string): Promise<{ totalDocs: number; totalHits: number; estimatedSavingsUsd: number }>;
}

export function createParseCache(deps: {
  db: DbClient;  // tenant-scoped DB connection
  blobStore: BlobStore;  // tenant-scoped blob client
}): ParseCache;
```

**Schema (the new migration):**

```sql
-- parse_cache: tenant-scoped cache of parsed document metadata
CREATE TABLE parse_cache (
  content_hash CHAR(64) NOT NULL,  -- SHA-256 hex
  tenant_id TEXT NOT NULL,
  page_count INTEGER NOT NULL,
  parser_used TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  overall_confidence NUMERIC(4, 3) NOT NULL,  -- 0.000 - 1.000
  markdown_blob_url TEXT NOT NULL,  -- pointer to blob containing markdown body
  structure_blob_url TEXT,
  source_filename TEXT,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hit_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (content_hash, tenant_id)
);

CREATE INDEX parse_cache_tenant_idx ON parse_cache (tenant_id);

-- Per-user RLS policy (consistent with ADR-0004)
ALTER TABLE parse_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY parse_cache_tenant_isolation ON parse_cache
  USING (tenant_id = current_setting('app.current_tenant_id', true));
```

**Companion down migration required** (`-- DOWN: DROP TABLE parse_cache CASCADE;` in same file or paired).

**Implementation notes:**
- `get()` uses single SELECT + UPDATE-RETURNING for atomic hit_count bump
- `put()` uses `INSERT ... ON CONFLICT DO UPDATE` for idempotency
- Blob storage: place parsed markdown at `parsed/{contentHash}.md` in customer's blob container
- Calculate `estimatedSavingsUsd`: `hit_count * (avg_pages * 0.05)` rough heuristic
- All operations tenant-scoped — never accept queries without tenant_id

**Acceptance criteria:**
- Migration applies cleanly (run on dev DB to verify)
- Down migration reverses it
- get/put round-trip works
- Hit count increments atomically (concurrent gets don't drop counts)
- Tests cover: cache miss, cache hit, idempotent put, stats
- Release record + AGENTS.md mention of new table in migration record

**Release record lane:** `client-data-lane`
**Merge:** Yes on CI green (don't run prod migration; only dev DB in test).

---

## Task 5.4 — Anthropic Prompt Caching Wire-In

**Branch:** `codex/w5-t5.4-prompt-cache`
**Files touched:**
- `/src/lib/llm/prompt-cache.ts` (new)
- `/src/lib/llm/prompt-cache.test.ts` (new)
- `/src/lib/llm/anthropic-client.ts` (modify if exists; OR create wrapper if not)
- `/docs/runbooks/prompt-caching.md` (new)

**Files NOT to touch:** Direct Anthropic SDK init outside the wrapper

**Parallel group:** With 5.2, 5.3, 5.5, 5.6

**Read first:**
- ADR-0007
- `/src/lib/llm/` existing patterns (model selection, retry, streaming)
- Anthropic prompt caching docs: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching

**Goal:**
Stack Anthropic ephemeral prompt cache on top of the parse cache. Parsed-doc markdown + agent system prompts get cached for 5-minute TTL. Cache hit = 90% input token discount.

**Required interface:**

```typescript
// /src/lib/llm/prompt-cache.ts
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages';

export interface CacheableSegment {
  /** Stable content (system prompt, parsed doc body, RAG context) */
  content: string;
  /** Why this is cached (logging / observability) */
  reason: 'system_prompt' | 'parsed_document' | 'rag_context' | 'tool_definitions';
}

export interface CachedMessageBuilder {
  /** Add a segment marked for ephemeral cache (5-min TTL). Order matters: prefix before variable. */
  addCacheable(segment: CacheableSegment): this;
  /** Add a non-cached segment (variable per request, e.g., user input) */
  addLive(content: string): this;
  /** Build into Anthropic ContentBlockParam[] with cache_control markers */
  build(): ContentBlockParam[];
}

export function newCachedMessage(): CachedMessageBuilder;

/** Helper: detect whether a response had a cache hit (from response metadata) */
export function inspectCacheUsage(response: { usage: { cache_read_input_tokens?: number; cache_creation_input_tokens?: number } }): {
  cacheReadTokens: number;
  cacheWriteTokens: number;
  cacheHitRatio: number;  // read / (read + write)
};
```

**Implementation:**
- Wrapper around Anthropic SDK message construction
- Adds `cache_control: { type: 'ephemeral' }` to last block of each cacheable segment
- Standard pattern: system prompt cached → tools cached → parsed doc cached → live user turn
- Log per-request: `{ requestId, cacheHitRatio, savedTokens }` via structured logger

**Tests:**
- Builder produces expected ContentBlockParam structure
- inspectCacheUsage extracts metrics correctly
- Edge cases: zero cacheable segments, large segments

**Runbook (`/docs/runbooks/prompt-caching.md`):**
- When to cache (heavy/repeated prefixes), when NOT to (per-request variable)
- 5-min TTL implications (active sessions stay warm; idle sessions re-pay write)
- Cost model: write = 1.25x normal input; read = 0.10x normal input
- How to monitor hit ratio in production

**Acceptance criteria:**
- Wrapper compiles + tests pass
- Cache markers appear in built messages
- Runbook present
- Release record created

**Release record lane:** `global-control-lane`
**Merge:** Yes.

---

## Task 5.5 — Small-Doc Shortcut Router

**Branch:** `codex/w5-t5.5-ingestion-router`
**Files touched:**
- `/src/lib/ingestion/router.ts` (new)
- `/src/lib/ingestion/router.test.ts` (new)
- `/src/lib/ingestion/config.ts` (new — threshold constants)

**Parallel group:** With 5.2, 5.3, 5.4, 5.6

**Read first:**
- ADR-0007
- Tasks 5.2 (DocIntelClient interface), 5.3 (ParseCache interface)

**Goal:**
Single entry-point function that takes any uploaded file and routes through the right path: cache → parse → cache → ready.

**Required interface:**

```typescript
// /src/lib/ingestion/config.ts
export const INGESTION_THRESHOLDS = {
  /** Below this page count AND size, skip parse pipeline (Claude native is faster + cost-comparable) */
  SMALL_DOC_MAX_PAGES: 4,
  SMALL_DOC_MAX_BYTES: 500_000,
  /** Hard upload limits */
  MAX_PAGES: 500,
  MAX_BYTES: 100_000_000,  // 100 MB
} as const;

// /src/lib/ingestion/router.ts
export interface IngestOptions {
  tenantId: string;
  /** Source of upload: 'bulk' | 'paperclip' | 'api' — drives logging + policy */
  source: 'bulk' | 'paperclip' | 'api';
  /** Optional filename (informational; not used for cache key) */
  filename?: string;
  /** Override the parser threshold (rare) */
  forceParse?: boolean;
}

export type IngestResult =
  | { kind: 'parsed'; document: ParsedDocument; cacheHit: boolean; latencyMs: number }
  | { kind: 'small_native'; passthrough: Buffer; reason: 'below-threshold' }
  | { kind: 'rejected'; reason: 'too-large' | 'unsupported-format' | 'phi-detected' | 'virus-detected'; details?: string };

export interface IngestionRouter {
  ingest(file: Buffer | string, options: IngestOptions): Promise<IngestResult>;
}

export function createIngestionRouter(deps: {
  docIntel: DocIntelClient;
  cache: ParseCache;
  // Future: PhiScanner, VirusScanner, fallback parsers
}): IngestionRouter;
```

**Routing logic:**
1. Reject if size > MAX_BYTES or page count > MAX_PAGES
2. Compute content hash
3. Cache check — return on hit (with `cacheHit: true`)
4. Below threshold AND format is PDF → return `small_native` (caller passes raw to Claude)
5. Otherwise → call DocIntelClient, write to cache, return `parsed`

Note: PHI/PII scan + virus scan integration deferred to a follow-up task (or wired in here as no-ops with TODO comments; create issue to implement).

**Tests:**
- Hits return cache without calling docIntel
- Misses call docIntel + write cache
- Above-MAX_BYTES → rejected
- Small PDF → small_native
- Large PDF → parsed
- Concurrent same-hash → only one parse (atomicity)

**Acceptance criteria:**
- All routing paths tested
- Idempotent ingest of same content
- Release record created

**Release record lane:** `client-data-lane`
**Merge:** Yes.

---

## Task 5.6 — Format-Matrix Parsers

**Branch:** `codex/w5-t5.6-format-parsers`
**Files touched:**
- `/src/lib/ingestion/parsers/pdf.ts` (new — wraps Doc Intelligence for PDF/images)
- `/src/lib/ingestion/parsers/docx.ts` (new — mammoth)
- `/src/lib/ingestion/parsers/xlsx.ts` (new — exceljs)
- `/src/lib/ingestion/parsers/pptx.ts` (new — node-pptx-parser or similar)
- `/src/lib/ingestion/parsers/native.ts` (new — txt/md/csv pass-through)
- `/src/lib/ingestion/parsers/index.ts` (new — registry/dispatcher)
- `/src/lib/ingestion/parsers/*.test.ts` (new)
- `/package.json` (add: `mammoth`, `exceljs`, parser libs)

**Parallel group:** With 5.2-5.5 (one agent per parser file is also valid sub-parallel)

**Read first:**
- ADR-0007 (format matrix section)
- Task 5.2 (ParsedDocument type)

**Goal:**
One parser per format, all returning `ParsedDocument`. Registry dispatches by MIME type or extension.

**Required interface:**

```typescript
// /src/lib/ingestion/parsers/index.ts
export interface Parser {
  /** What this parser handles */
  formats: string[];  // e.g., ['application/pdf', '.pdf']
  /** Parse content into normalized form */
  parse(content: Buffer, options: { tenantId: string }): Promise<ParsedDocument>;
}

export function parserFor(formatHint: string): Parser | null;

// Specific parsers export default `Parser` implementation
```

**Per-format requirements:**

- **PDF (`pdf.ts`):** Delegate to Doc Intelligence client (5.2). This is mostly a thin wrapper that fits the `Parser` interface.
- **docx:** Use `mammoth` library; convert to markdown; preserve headings + tables + lists
- **xlsx:** Use `exceljs`; produce one markdown section per sheet with table + cell-count summary
- **pptx:** Parse slide-by-slide; produce `## Slide N\n\n<text>` blocks. Best-effort image alt text.
- **native (txt/md/csv):**
  - txt/md: pass through; ParsedDocument with markdown=content
  - csv: parse to detect schema; markdown = schema summary + 10-row sample table

**All parsers:**
- Compute SHA-256 contentHash
- Return overall_confidence (1.0 for native; lib-reported for others)
- Set parserUsed to the appropriate string
- Handle empty / malformed input gracefully (return parsed result with note OR throw typed error)

**Tests:**
- Each parser: happy path + malformed input
- Registry dispatches correctly by extension AND MIME type

**Acceptance criteria:**
- All 5 format parsers work on sample inputs
- Registry dispatches correctly
- Tests pass
- Release record created

**Release record lane:** `global-control-lane`
**Merge:** Yes.

---

# WAVE 6 — Token Meter + Admin/Ops Surface

**Goal:** Pre-pilot operational essentials. Token usage meter per tenant + hard cap enforcement + admin surface so ops doesn't require SSH.

**Why:** Critical COGS protection (token runaway can wipe a deal). Admin surface lets you operate cleanly during pilot without raw DB access.

**Total effort:** ~2-3 days with 4 agents (mostly parallel).

---

## Task 6.1 — Token Meter

**Branch:** `codex/w6-t6.1-token-meter`
**Files touched:**
- `/src/lib/metering/meter.ts` (new)
- `/src/lib/metering/meter.test.ts` (new)
- `/src/lib/metering/types.ts` (new)
- `/migrations/<next-number>-add-token-usage-table.sql` (new)

**Files NOT to touch:** Cap enforcement (Task 6.2 — separate concern)

**Parallel group:** With 6.2, 6.3, 6.4

**Read first:**
- ADR-0006 (AI advisor invariant — token meter feeds the audit story)
- `/src/lib/llm/` existing patterns
- ADR-0004 (per-user RLS — same pattern for token_usage table)

**Goal:**
Record every LLM call: tenant, user, model, input/output/cache tokens, cost estimate, request ID. Aggregations per minute/hour/day/month per tenant + per user. Foundation for cap enforcement (6.2) and admin dashboards (6.3).

**Required interface:**

```typescript
// /src/lib/metering/types.ts
export interface UsageEvent {
  tenantId: string;
  userId: string;
  model: string;          // 'claude-opus-4-7' etc.
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  requestId: string;      // correlation
  feature: string;        // e.g., 'moves.draft', 'source.brief', 'chat.paperclip'
  timestampMs: number;
}

export interface UsageSummary {
  tenantId: string;
  windowStart: number;
  windowEnd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCacheWriteTokens: number;
  estimatedCostUsd: number;
  callCount: number;
  byModel: Record<string, { input: number; output: number; cost: number }>;
  byFeature: Record<string, number>;
  byUser?: Record<string, number>;  // only included for tenant-admin views
}

// /src/lib/metering/meter.ts
export interface TokenMeter {
  record(event: UsageEvent): Promise<void>;
  summarize(tenantId: string, window: 'minute' | 'hour' | 'day' | 'month'): Promise<UsageSummary>;
  topUsersToday(tenantId: string, limit: number): Promise<{ userId: string; tokens: number; cost: number }[]>;
}

export function createTokenMeter(deps: { db: DbClient }): TokenMeter;
```

**Schema:**

```sql
CREATE TABLE token_usage (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  cache_write_tokens INTEGER NOT NULL DEFAULT 0,
  request_id TEXT NOT NULL,
  feature TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX token_usage_tenant_time_idx ON token_usage (tenant_id, created_at DESC);
CREATE INDEX token_usage_user_time_idx ON token_usage (tenant_id, user_id, created_at DESC);
CREATE INDEX token_usage_request_idx ON token_usage (request_id);

ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY token_usage_tenant_isolation ON token_usage
  USING (tenant_id = current_setting('app.current_tenant_id', true));
```

**Cost calculation:**
- Maintain a price table per model (input/output/cache rates per 1M tokens)
- Sonnet 4.6: $3 input / $15 output / $0.30 cache read / $3.75 cache write per 1M (verify; place in config)
- Opus 4.7: higher rates — confirm before merging
- Compute `estimatedCostUsd` lazily from raw counts

**Tests:**
- record() writes a row
- summarize() aggregates correctly across windows
- topUsersToday() returns sorted list
- Cost calculation per model

**Acceptance criteria:**
- Module + migration + tests
- Cost numbers accurate as of latest published rates (cite source)
- Release record + migration documented

**Release record lane:** `client-data-lane`
**Merge:** Yes.

---

## Task 6.2 — Hard Cap Enforcement

**Branch:** `codex/w6-t6.2-token-cap`
**Files touched:**
- `/src/lib/metering/cap.ts` (new)
- `/src/lib/metering/cap.test.ts` (new)
- `/src/lib/llm/anthropic-client.ts` (modify — add cap check before each call)
- `/migrations/<next-number>-add-tenant-token-limits-table.sql` (new)

**Parallel group:** With 6.1 (depends on meter interface), 6.3, 6.4

**Read first:**
- Task 6.1 (TokenMeter interface)
- ADR-0006

**Goal:**
Per-tenant monthly token budget. Soft warning at 75%, hard cap at 100%. Adversarial-user defense: per-user-per-hour spike limit also enforceable.

**Required interface:**

```typescript
export interface TenantLimits {
  tenantId: string;
  monthlyTokenBudget: number;      // hard cap
  monthlyTokenSoftWarning: number; // % or absolute
  perUserHourlyTokenLimit: number; // spike defense
  overflowPolicy: 'block' | 'throttle' | 'allow-and-bill';
}

export interface CapEnforcer {
  /** Called BEFORE every LLM call. Throws TokenCapExceeded if would exceed. */
  checkBudget(tenantId: string, userId: string, estimatedTokens: number): Promise<void>;
  /** Get current usage relative to budget */
  status(tenantId: string): Promise<{ used: number; budget: number; pctUsed: number; soft: 'ok' | 'warn' | 'exceeded' }>;
  /** Set or update tenant limits */
  setLimits(limits: TenantLimits): Promise<void>;
}

export class TokenCapExceeded extends Error {
  constructor(public tenantId: string, public used: number, public budget: number) { super(...); }
}
```

**Schema (`tenant_token_limits` table):**

```sql
CREATE TABLE tenant_token_limits (
  tenant_id TEXT PRIMARY KEY,
  monthly_token_budget BIGINT NOT NULL,
  monthly_token_soft_warning BIGINT NOT NULL,
  per_user_hourly_token_limit BIGINT NOT NULL,
  overflow_policy TEXT NOT NULL CHECK (overflow_policy IN ('block', 'throttle', 'allow-and-bill')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default for new tenants (insert via admin task; not a DB default)
```

**Wire-in:**
- Anthropic client wrapper checks cap before every `messages.create` call
- On TokenCapExceeded: throw typed error; caller surfaces to UI as a clean message ("Monthly AI usage limit reached. Contact your AbarVa admin.")
- On warning threshold: log structured event for admin dashboard alert (don't block)

**Tests:**
- Budget below limit → allow
- Budget at warn → allow + emit warn event
- Budget at hard cap → throw
- Per-user hourly spike → throw with different error code

**Acceptance criteria:**
- All paths tested
- Anthropic wrapper integration works
- Release record + migration

**Release record lane:** `client-data-lane`
**Merge:** Yes.

---

## Task 6.3 — Admin Ops Surface

**Branch:** `codex/w6-t6.3-admin-ops`
**Files touched:**
- `/src/app/(admin)/ops/page.tsx` (new — dashboard landing)
- `/src/app/(admin)/ops/tenants/[tenantId]/page.tsx` (new — per-tenant view)
- `/src/app/(admin)/ops/tenants/[tenantId]/actions.ts` (new — server actions: re-embed, re-index, run migration on dev only)
- `/src/lib/admin/feature-flag.ts` (new — gate the whole `(admin)/ops` route)
- `/src/app/(admin)/ops/layout.tsx` (new — admin-only auth check)

**Files NOT to touch:** Existing `/src/app/(admin)/` routes (don't disturb)

**Parallel group:** With 6.1, 6.2, 6.4

**Read first:**
- `/src/app/(admin)/` existing patterns
- ADR-0006 (everything here is logged as a consequential action)
- `/src/lib/auth/` (admin role check)

**Goal:**
Web UI for ops actions that previously required SSH or raw SQL. Feature-flagged (`ABARVA_ADMIN_OPS_ENABLED=true`); only visible to `admin` or `maestro` role users.

**Required screens:**

1. **Landing (`/admin/ops`):**
   - List of tenants (with health: token usage %, error rate, last activity)
   - Click → per-tenant view
2. **Per-tenant (`/admin/ops/tenants/[tenantId]`):**
   - Token meter: monthly usage / cap / top users / cost
   - Action buttons (each opens a confirmation dialog with justification field per Wave 2 ApprovalGate):
     - **Re-embed corpus** — kicks off background job
     - **Re-index search** — kicks off background job
     - **Run pending migrations** (dev tenant only — escalate for prod)
     - **Force token cap reset** (mid-month override; requires justification + Anand sign-off via PR)
     - **View audit log** (last 100 actions)

**Auth:**
- Server-side check: `role in ('admin', 'maestro')` else 404
- All actions log: who, when, what, why (justification text)

**Acceptance criteria:**
- Routes only visible when flag enabled
- Auth check works
- Actions log audit entries
- UI uses Wave 2 components (ApprovalGate, JustificationField)
- Release record

**Release record lane:** `internal-admin`
**Merge:** Yes (behind feature flag default off).

---

## Task 6.4 — Admin Action Audit Log

**Branch:** `codex/w6-t6.4-admin-audit`
**Files touched:**
- `/src/lib/admin/audit-log.ts` (new)
- `/src/lib/admin/audit-log.test.ts` (new)
- `/migrations/<next-number>-add-admin-audit-log.sql` (new — immutable append-only)

**Parallel group:** With 6.1, 6.2, 6.3

**Read first:**
- Task 6.3 (which calls the audit log)
- ADR-0006 (evidence ledger pattern)
- AGENTS.md audit log retention requirements

**Goal:**
Append-only audit log of every admin action: actor, tenant, action, justification, before/after state where applicable, timestamp. Immutable storage policy. Client-exportable.

**Schema:**

```sql
CREATE TABLE admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  action TEXT NOT NULL,        -- 're-embed', 'token-cap-reset', 'migration-run', etc.
  justification TEXT NOT NULL, -- free-text from operator
  before_state JSONB,
  after_state JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Append-only: no UPDATE, no DELETE (enforced via policy + DB user permissions)
REVOKE UPDATE, DELETE ON admin_audit_log FROM PUBLIC;
GRANT INSERT, SELECT ON admin_audit_log TO app_user;

CREATE INDEX admin_audit_actor_idx ON admin_audit_log (actor_user_id, created_at DESC);
CREATE INDEX admin_audit_tenant_idx ON admin_audit_log (tenant_id, created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_audit_tenant_visibility ON admin_audit_log
  FOR SELECT USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_abarva_admin', true) = 'true'
  );
```

**Interface:**

```typescript
export interface AdminAuditEntry {
  actorUserId: string;
  actorEmail: string;
  tenantId: string;
  action: string;
  justification: string;
  beforeState?: unknown;
  afterState?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export interface AdminAuditLog {
  record(entry: AdminAuditEntry): Promise<{ id: number; createdAt: Date }>;
  query(tenantId: string, opts?: { limit?: number; sinceMs?: number; actor?: string }): Promise<AdminAuditEntryRecord[]>;
  exportForTenant(tenantId: string, format: 'json' | 'csv'): Promise<string>;
}
```

**Tests:**
- record() returns ID + timestamp
- query() filters correctly
- UPDATE/DELETE attempts fail (verify policy)
- Export works in both formats

**Acceptance criteria:**
- Append-only enforced at DB level
- All admin actions in Task 6.3 call this
- 12+ month retention policy documented
- Export works

**Release record lane:** `internal-admin`
**Merge:** Yes.

---

# Wave-Summary PR Template

After each wave's individual PRs land, open one final wave-summary PR that updates plan tracker + tags the wave.

**Branch:** `codex/w<N>-summary`
**Files touched:**
- `/docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx` (mark wave tasks "Done" in Plan tab Status column — use openpyxl script)
- `/docs/releases/records/YYYY-MM-DD-wave-<N>-complete.md` (new — wave-level release record)

**PR title:** `chore(plan): Wave <N> complete — <wave name>`

**PR body:**

```markdown
## Wave <N> Summary — <Wave Name>

**Goal recap:** <one sentence from the wave intro>

**Effort:** <hours / days actual>

## Tasks Merged

- [#<PR#>] Task <id> — <title>
- [#<PR#>] Task <id> — <title>
- ...

## Deliverables Verified

- [x] <deliverable 1 per wave summary>
- [x] <deliverable 2>
- ...

## Acceptance Verified

<copy-paste the wave acceptance criteria from CODEX_AUTONOMOUS_EXECUTION.md and check them off>

## Next Wave Prerequisites

Wave <N+1> can start when:
- [x] All Wave <N> tasks merged
- [x] Plan tracker updated (this PR)
- [x] Wave <N> tag pushed: `git tag w<N>-complete && git push origin w<N>-complete`

## Notes for Anand

<anything that surfaced during the wave that user should know:
- Decisions agents made within their authority
- Dependencies added (with rationale)
- Migrations applied (which envs)
- Cost impact (if any)
- Open follow-ups punted to backlog>

---

🤖 Wave executed autonomously by Codex agents per `docs/planning/CODEX_AUTONOMOUS_EXECUTION.md`.
```

**After this PR merges:** push wave tag, update Codex Queue tab Status to "Done" for this wave, then claim Wave <N+1> tasks.

---

# Closing Protocol

After each wave:

1. **Mark the wave complete** in `docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx` (Codex Queue tab + Plan tab)
2. **Update Dashboard counters** (auto-updates via formulas)
3. **Open a wave-summary PR** that links to all merged PRs in the wave with a one-line summary each
4. **Tag wave-complete:** `git tag w<N>-complete && git push origin w<N>-complete`
5. **Confirm next wave's prerequisites are met** before claiming next-wave tasks

## When in doubt

- Re-read `/AGENTS.md`
- Re-read this file's Authority Grant section
- If still unclear: open a draft PR with `needs-review` label, describe the question in the PR body, do NOT merge

---

*Anand reviews this document weekly. Suggest changes via PR.*
