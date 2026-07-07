# Adversarial Safety Harness

This harness gives AbarVa a deterministic, credential-free regression layer for
pilot-readiness adversarial checks. It is intentionally not a live LLM red-team
runner yet; it is the baseline guard suite that CI and later agent-driven tests
can call before any model, browser, or data-plane dependency is required.

## Backlog Coverage

| Plan row | Coverage in this slice |
| --- | --- |
| T171 | Agent-loop guard detects excessive handoff depth and repeated transitions. |
| T172 | Prompt-injection classifier blocks instruction override, hidden-prompt disclosure, tool-secret, tool-call coercion, and jailbreak patterns. It also checks candidate responses so hostile retrieved content can be recorded as untrusted data without failing unless the response leaks protected terms or accepts an override. |
| T173 | Cost-attack guard detects request storms, file storms, and overlong prompt payloads. |
| T175 | Cross-tenant probe guard blocks actor-client to target-client mismatches and cross-client object-owner mismatches before data-plane access. |
| T177 | Security probe guard blocks common SQL injection, IDOR, SSRF, path traversal, auth-bypass patterns, and unauthenticated sensitive-route probes. |

## Code Paths

- `src/lib/adversarial/adversarial-safety-harness.ts`
- `src/lib/adversarial/__tests__/adversarial-safety-harness.test.ts`

## Local Validation

```bash
./node_modules/.bin/jest src/lib/adversarial/__tests__/adversarial-safety-harness.test.ts --runInBand
```

Expected result: 8 passing tests.

## Scope Boundary

This release does not run a 24-hour agent army, does not call Claude Agent SDK,
does not parse real uploaded documents, and does not simulate network failure.
Those remain separate rows in the plan. This slice creates the deterministic
guard layer that those larger tests should reuse.
