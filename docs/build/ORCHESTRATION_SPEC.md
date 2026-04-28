# AbarVa Tower Build · Orchestration Spec

**Version:** 1.0 · April 28 2026
**Scope:** Tower module autonomous build T0–T7
**Authority:** Supplements `BUILD_OPERATING_MODEL.md`; Tower-module-specific rules only.

---

## §1 · Wave meta-loop rules

Each wave follows this sequence:

```
Plan → Design (mockups) → Build → Test → PR → Auto-approve/merge → Update state → Next wave
```

Wave IDs: `T0` (Audit & spec) → `T7` (States + connector polish).
Branch naming: `tower/wave-T{N}/{slug}`.

---

## §2 · Auto-approval criteria (all must be true to merge without human review)

1. CI fully green (typecheck + lint + test)
2. `pnpm typecheck` passes with zero errors on changed files
3. `pnpm lint` zero warnings on changed files
4. Net change ≤ 1000 lines (`git diff --shortstat`)
5. No files from the escalation list touched
6. No `console.log` / `TODO` / `FIXME` / `XXX` in committed code
7. PR description follows §11 template

---

## §3 · Escalation list (require founder review before touching)

- `src/lib/architecture/*`
- `src/lib/shell/shell-tokens.ts`
- `package.json` (no new dependencies without approval)
- `src/lib/source/queries.ts` or `src/lib/source/types.ts` signatures
- Database migrations

---

## §4 · PR description template

```markdown
## [Tower Wave T{N}] {wave title}

### Scope
{one-sentence description of what this wave delivers}

### Pages shipped
- `{TWR-ID}` — {component} → `{route}`

### Auto-approval checklist
- [ ] CI green
- [ ] Typecheck zero errors
- [ ] Lint zero warnings on changed files
- [ ] Net diff ≤ 1000 lines
- [ ] No escalation-list files touched
- [ ] No console.log/TODO/FIXME in committed code

### Smoke test
{result of T-SMOKE-PORTFOLIO or N/A}

### Rollback
`git revert {commit}` — no DB changes in this wave.
```

---

## §5 · Journal protocol

Append to `docs/build/JOURNAL.md` after each wave:

```
{YYYY-MM-DD} | T{N} | {status} | {lines +/-} | {smoke result} | {note}
```

Status values: `shipped` · `held` · `skipped`.

---

## §6 · Wave plan template (`docs/build/WAVE-T{N}-PLAN.md`)

```markdown
# Wave T{N} Plan · {wave title}

## Scope
{wave scope from §13 of TOWER_DESIGN_SPEC.md}

## Files changed
| File | Action | Reason |
|---|---|---|

## Dependencies
{what must be true before this wave can run}

## Test plan
{what to test and how}

## Auto-approval claim
{all 7 criteria met: yes/no, with notes on any failing}
```

---

## §7 · Escalation triggers

Stop and post to JOURNAL.md with `[ESCALATION]` tag if:

- Two consecutive wave CI failures
- Any escalation-list file would need changing
- New package dependency required
- Database migration required
- Founder has left a `docs/build/PAUSE.md` file

---

## §8 · Smoke test definition

**T-SMOKE-PORTFOLIO**: The `/tower` route renders with:
- KPI band visible (5 cards)
- AI programs table visible (≥ 3 programs)
- Nexus voice quote visible
- At least one pressure item
- `pnpm typecheck` clean
- No JS console errors

This smoke test must pass before any wave merges from T1 onward.
