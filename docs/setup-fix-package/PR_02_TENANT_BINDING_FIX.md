# PR 2 · Tenant binding defect fix

| | |
|---|---|
| **PR number** | 2 of 9 |
| **Type** | Bug fix — routing/scoping logic |
| **Branch** | `setup-fix/02-tenant-binding-defect` |
| **Depends on** | PR 1 merged |
| **Blocks** | PR 6, PR 7, PR 8, PR 9 |
| **Estimated effort** | 4-6 hours |
| **Gate?** | No — proceed when PR 1 merged |

---

## §1 · What this PR does

Fixes the cross-tenant data bleed defect in which 4 Setup panels display "Apex Retail" data to a First Capital Financial admin (and presumably the inverse — FCF data to Apex admins, etc.).

Affected panels (post PR 1):
1. **Data Trust** (`/admin/data-trust`)
2. **Connectors** (`/admin/connectors`)
3. **Agent Readiness** (`/admin/agent-readiness`)
4. **Production Readiness** (`/admin/production-readiness`)

Per inventory §3 — these panels resolve tenant context from a different source than Overview, AI Initiatives (now removed), and Users & Access. The fix standardizes tenant resolution.

## §2 · Diagnostic phase (do this first)

Before writing any fix, you must understand WHY each panel resolves tenant differently. Investigate:

### 2.1 How Overview correctly resolves tenant
Trace the code path that displays "First Capital Financial" on Overview (`/admin`). Identify:
- Where tenant context is read (middleware, hook, server component, client component)
- What value is read (display name, slug, ID)
- What source provides the value (session, cookie, URL param, config)

Document this path. It is the **canonical correct path**.

### 2.2 How each broken panel resolves tenant
For each of Data Trust, Connectors, Agent Readiness, Production Readiness — trace the same code path. Identify:
- What is the panel actually reading?
- What value does that read return?
- Why does it return "Apex Retail" instead of the session tenant?

Common possibilities:
- Hardcoded fallback when actual value is null
- Reading from a different cache layer
- Using a tenant-resolution helper that has stale state
- Using a fixture/seed that defaults to Apex Retail
- Component-level prop default that isn't being overridden

### 2.3 How Users & Access resolves tenant (partially correct case)
Users & Access shows `first-capital` (lowercase slug) instead of `First Capital Financial` (display name). This is closer to correct but uses a different resolution path. Document its path too — it may inform the fix direction.

### 2.4 Output of diagnostic phase

Before writing fixes, post a comment to the PR (or in the PR description if you've opened it as draft) summarizing:

```markdown
## Tenant resolution diagnostic

Canonical correct path (Overview): [trace]
Returns: "First Capital Financial" (display name) from [source]

Broken path A (Data Trust + Connectors): [trace]
Returns: "Apex Retail" because [root cause]

Broken path B (Agent Readiness + Production Readiness): [trace if same as A; or different]

Partial path (Users & Access): [trace]
Returns: "first-capital" (slug) because [reason]

Proposed fix: [strategy]
```

Then proceed with the fix.

## §3 · Fix strategy

The fix should be **convergent** — make all 4 broken panels use the same tenant resolution path Overview uses. Specific approaches depending on what the diagnostic finds:

### 3.1 If broken panels share a common helper that's wrong
Fix the helper. One change cascades to all 4 panels.

### 3.2 If broken panels each have their own resolution
Replace each panel's resolution with the canonical one (per Overview). Multiple smaller changes, but each panel gets the same canonical pattern.

### 3.3 If the issue is in middleware or layout
Fix the middleware/layout to ensure tenant context is correctly populated before page components render. Likely a single change with broad impact.

### 3.4 If the issue is in fixture data / seed defaults
This is the trickiest case. If panels are reading hardcoded "Apex Retail" from fixtures because actual tenant data isn't being passed in, the fix is to ensure tenant data is passed in. The fixtures themselves stay (they're for tests/demo).

**Default preference:** Whichever approach minimizes the diff while achieving correctness. If you can fix all 4 panels with one helper change, that's better than 4 panel-by-panel fixes.

## §4 · What about Users & Access (the slug vs. display-name issue)?

Users & Access shows `first-capital` instead of `First Capital Financial`. This is in scope for this PR — fix it to show the display name consistently with Overview.

The fix likely involves:
- Reading the same field other panels read (display name, not slug)
- OR: looking up display name from slug if your substrate has a tenant lookup

Either way: post-fix, all 6 Setup panels should show `First Capital Financial` as the tenant when an FCF user is signed in.

## §5 · Cross-tenant verification

The fix is not complete unless verified across multiple tenants. After implementing:

1. Sign in (or simulate session) as an Apex Retail admin → all 6 panels should show "Apex Retail"
2. Sign in as a Meridian Health admin → all 6 panels should show "Meridian Health"
3. Sign in as a First Capital Financial admin → all 6 panels should show "First Capital Financial"
4. Switch tenant mid-session (if the app supports it) → all 6 panels should update

If you cannot sign in as multiple tenants in the dev environment, document the verification approach you used (test fixtures, mocked sessions, dev tooling) in the PR description.

## §6 · Hard scope rules

You MUST NOT:
- Modify substrate / migrations
- Modify the global nav
- Modify panel content (content fixes are PRs 3-9)
- "Fix" Apex Retail or Meridian Health data while you're in the panels (just fix the routing)
- Touch surfaces outside Setup
- Add a tenant-switcher UI (out of scope; feature decision, not a bug fix)

You MAY:
- Refactor tenant-resolution helpers if needed for the fix
- Update / delete fixture data ONLY if it's the cause of the cross-tenant bleed AND the fix is to change the fixture pattern (rare; document carefully)
- Add tests for tenant resolution
- Update documentation in `docs/` describing the tenant context model

## §7 · Test additions

Add tests verifying:

1. For each of the 6 Setup panels, when the session tenant is `apex-retail`, the panel renders Apex data
2. For each of the 6 Setup panels, when the session tenant is `meridian-health`, the panel renders Meridian data
3. For each of the 6 Setup panels, when the session tenant is `first-capital`, the panel renders FCF data
4. Display name matches expected per tenant (not slug, not hardcoded fallback)

If the project doesn't have multi-tenant test infrastructure, building it for this PR is in scope — but keep it minimal. Mocked sessions / test fixtures, not full E2E.

## §8 · Verification commands

Same as PR 1 §8. All four (lint / type-check / tests / build) must pass.

## §9 · Vercel preview verification

After merge and deploy:

1. Sign in as an FCF admin (or whatever test admin you have access to)
2. Visit each of the 6 Setup panels
3. For each, verify the displayed tenant matches the session tenant
4. Capture screenshot of each panel showing correct tenant
5. Save screenshots to `docs/setup-fix-package/screenshots/pr-02-[panel-slug].png`

If you have access to multiple test tenants, repeat the verification for each. Document which tenants were verified.

## §10 · Branch + commit + PR mechanics

```bash
git checkout main
git pull origin main
git checkout -b setup-fix/02-tenant-binding-defect

# ... diagnostic phase, then fix ...

git add -A
git commit -m "[FIX] Setup — resolve cross-tenant data bleed defect

Per docs/setup-fix-package/SETUP_FIX_PACKAGE_2026-05-07.md PR 2 of 9.
Standardizes tenant resolution across Data Trust, Connectors,
Agent Readiness, Production Readiness, Users & Access.
"

git push origin setup-fix/02-tenant-binding-defect
gh pr create --base main --head setup-fix/02-tenant-binding-defect --title "[FIX] Setup — tenant binding defect (PR 2 of 9)" --body-file /tmp/pr-2-body.md
```

## §11 · Acceptance criteria

PR 2 is complete when ALL true:

- [ ] Data Trust shows correct tenant per session
- [ ] Connectors shows correct tenant per session
- [ ] Agent Readiness shows correct tenant per session
- [ ] Production Readiness shows correct tenant per session
- [ ] Users & Access shows display name (not slug)
- [ ] Overview continues to show correct tenant (regression check)
- [ ] Cross-tenant verification documented (which tenants tested, how)
- [ ] No substrate changes
- [ ] Lint passes / type-check passes / build passes
- [ ] Existing tests pass
- [ ] New tests added for tenant resolution per panel
- [ ] New tests pass
- [ ] Vercel preview verified for at least one tenant — screenshots saved
- [ ] PR description includes diagnostic phase output (§2.4 format)
- [ ] PR description references this spec
- [ ] Substrate gap register updated if any gaps surfaced
- [ ] Spec drift register updated if anything diverged from this spec

## §12 · Failure modes specific to PR 2

### 12.1 The "I'll just hardcode FCF" trap
When debugging, the fastest "fix" is to hardcode the right tenant. **Don't.** That replaces one bug with another. The fix must be that the panel reads the actual session tenant, not that it reads a different hardcoded value.

### 12.2 The "I'll fix the panel content too" trap
Panels are showing Apex content because tenant routing is wrong. After your fix, they'll show FCF content (or whatever the session tenant is). The FCF content may itself be thin, weird, or imperfect — that's normal post-fix because PRs 6-9 will redesign these panels. Do NOT improve panel content as part of this PR. Tenant routing only.

### 12.3 The "I should also fix the slug case" trap (counter-trap)
This isn't a trap — fixing the slug case in Users & Access IS in scope (per §4). The trap to avoid: fixing other display-vs-internal-name inconsistencies elsewhere (e.g., in URLs, in API responses, in logs). Out of scope.

### 12.4 The "build a tenant switcher" trap
While diagnosing tenant resolution, you'll see how tenant context is established. You might be tempted to add UI for switching tenants (useful for testing!). **Don't.** Feature work, separate decision.

### 12.5 The "rewrite the auth layer" trap
The fix may touch middleware or session handling. Constrain changes to the smallest surface area that fixes the bug. Refactoring auth is a bigger decision than this PR.

## §13 · After PR 2 merges and deploys

Per master prompt §1.9, post completion comment.

If Wave B parallel — verify PR 5 status and continue per its lifecycle.

After PR 2 merged:
- **Pause for Gate 1** before PR 3. Anand decision needed on Overview Client Data Landscape reconciliation direction. See PR 3 §2.
- PR 9 unblocks — can run in parallel with Gate 1 wait.

End of PR 2 spec.
