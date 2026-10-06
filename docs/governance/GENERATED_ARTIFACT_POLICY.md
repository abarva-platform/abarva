# Generated artifact policy

Generated output belongs in git only when it is a deterministic control baseline
that reviewers need in order to evaluate the same change. Runtime proof is not a
source file and must remain outside git.

## Committed control baselines

A generated baseline may be committed when all of these are true:

- a named repository command deterministically produces it;
- a named owner refreshes it at a defined change moment;
- review of the diff is part of the control, rather than incidental churn; and
- an independent check can detect when the committed baseline is stale.

The six reports under `reports/data-standard/legacy-purge/` are committed control
baselines owned by `npm run release:check`. Their writers are write-if-changed,
and they refresh only when the underlying findings change.

`docs/architecture/test-ci-coverage-census.json` is a committed coverage-shape
baseline. The author of a change that moves a directory between uncovered,
partially covered, and fully covered owns its refresh:

```bash
npm run audit:test-ci-coverage:write
npm run audit:test-ci-coverage:check
```

The behavior suite gates that shape on pull requests. The direct `--check`
command is its operator mirror; it is not called directly by a workflow because
this self-scanning census would then alter its own reachable-command set. A test
added inside a directory whose coverage state does not change may move counts
without requiring a committed refresh. Regenerate locally before quoting counts.

## Ephemeral proof

Do not commit runtime browser captures, deployment readbacks, ACA data-build proof
bundles, local command transcripts, or timestamped acceptance output. Store those
in the governed proof location named by the relevant runbook and link the immutable
run or bundle from the release record.

## Source-authored fixtures

Fixtures and examples that define intended behavior are source, not generated
proof. Keep them small, deterministic, publicly safe, and reviewed with the code
that consumes them.
