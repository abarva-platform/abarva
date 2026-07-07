# Secret Scanning

## Purpose

This repository runs gitleaks in CI and pre-commit so credentials do not enter review, merge history, or release artifacts.

## Local Hook

The Husky `pre-commit` hook runs:

```bash
npm run secrets:staged
```

That command scans staged changes with gitleaks before `lint-staged` formats files.

## Manual Checks

Scan the branch diff against `origin/main`:

```bash
npm run secrets:scan -- --log-opts="origin/main..HEAD"
```

Scan staged changes only:

```bash
npm run secrets:staged
```

## CI

The `Secret Scanning` workflow runs on pull requests and scans the PR diff with the same npm script.

## If A Secret Is Found

1. Remove the secret from the staged diff or branch.
2. Rotate the credential if it was real.
3. Re-run the scan.
4. Note the remediation in the PR if the secret ever left the local machine.

Do not add broad allowlists for real-looking credentials. Use placeholders such as `<replace-me>` or `lab_only_change_me` in docs and examples.
