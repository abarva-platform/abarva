# License And SBOM Compliance

## Purpose

This runbook covers the local and CI checks for npm dependency license compliance and software bill of materials generation.

## Commands

```bash
npm run license:check
npm run sbom:check
npm run sbom:generate
npm run compliance:supply-chain
```

`license:check` reads `package-lock.json` and `docs/compliance/license-policy.json`. It fails when a package has a denied or unclassified license unless the package is listed in `packageExceptions`.

`sbom:check` proves the deterministic SBOM generator can parse the lockfile. `sbom:generate` writes `audit-artifacts/compliance/sbom.cdx.json` for auditor handoff or release evidence.

## Interpreting Results

- `allowed`: license is in the allowlist.
- `review`: license is not blocked, but engineering should not make the package a direct dependency or expand its use without legal review.
- `exception`: package has a named exception in `docs/compliance/license-policy.json`.
- `denied`: license is blocked and CI must fail.
- `unclassified`: license metadata is missing or not represented in policy; either remove the dependency, improve metadata, or add a dated exception with an owner.

## Updating Policy

Use the smallest policy change that explains the decision. For exceptions, include the package name, version, owner, review date, and plain-English reason. Do not add broad allowlist entries to make CI green.

## CI

The `License and SBOM Compliance` workflow runs on pull requests when dependency, workflow, compliance, or script files change. It uploads the generated license report and SBOM as build artifacts.
