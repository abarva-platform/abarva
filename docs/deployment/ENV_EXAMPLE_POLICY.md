# CLOUD8 — Env Example Gitignore Policy

> Status: documentation + gitignore policy only. No application code,
> no runtime, no secrets, no model calls. Lab and developer ergonomics
> only. production_deployment status is preserved (still blocked).

## A. Purpose

Allow safe `.env*.example` files to be committed without `git add -f`
while keeping every real env file ignored.

Before CLOUD8, the repo's `.gitignore` blocked **all** `.env*` files
(by design, to keep real secrets out of git). That blanket rule also
blocked legitimate placeholder templates such as `.env.private-lab.example`
(see CLOUD4), so an operator had to bypass the ignore rule with
`git add -f`. `git add -f` is a hammer: it can also force-stage real
env files. We don't want that hammer in the normal flow.

CLOUD8 adds **explicit allow rules** for env example files only,
keeping the blanket ignore for everything else.

## B. What is allowed in git

Allowed (committable, no force flag):

- `.env.example`
- `.env.<role>.example` (e.g., `.env.private-lab.example`,
  `.env.preview.example`, `.env.local.example`)
- More generally, any `.env.*.example` file at the repo root.

These files MUST contain placeholder content only (see §D).

## C. What is NEVER allowed in git

Never committed, ever:

- `.env`
- `.env.local`
- `.env.development`, `.env.development.local`
- `.env.production`, `.env.production.local`
- `.env.preview`, `.env.preview.local`
- Any other file ending in real values (`POSTGRES_PASSWORD=<real-secret>`,
  `ANTHROPIC_API_KEY=sk-ant-…`, `GITHUB_TOKEN=ghp_…`, etc.)

The blanket `.env*` ignore in `.gitignore` plus the standard
`.env*.local` rule continue to cover these. CLOUD8 does not weaken
either.

## D. Required content of `.env.*.example` files

Every committed env example file MUST satisfy:

1. **Header comment** marking it as an example, e.g.:

   ```
   # =====================================================================
   # CLOUD<N> - <Lab name> environment template
   # =====================================================================
   # EXAMPLE ONLY. Copy to .env.<role> and replace ALL values
   # before any non-lab use.
   # =====================================================================
   ```

   The literal substring `EXAMPLE` (uppercase) or `example` (lowercase)
   MUST appear in the file.

2. **Placeholder values only.** Acceptable forms:
   - `<replace-me>`
   - `lab_only_change_me`
   - `lab_only`
   - simple placeholder hostnames that resolve only inside a lab network
     (e.g., `postgres://abarva_lab:lab_only_change_me@postgres:5432/abarva_lab`,
     `http://minio:9000`, `http://model-gateway-stub:8080`).

3. **No real tokens, no real API keys, no real secrets.**

   Disallowed shapes (locked in by the test suite, regardless of how
   the secret got there):

   - GitHub PATs: `/ghp_[A-Za-z0-9]{36,}/`
   - Anthropic / OpenAI keys: `/sk-(ant-)?[A-Za-z0-9_-]{32,}/`
   - JWTs: `/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}/`
   - AWS access keys: `/AKIA[0-9A-Z]{16}/`

   This list is illustrative, not exhaustive. The bar is: *if a value
   looks like a real token or key, it MUST NOT be committed*. When in
   doubt, replace with `<replace-me>`.

4. **No real provider hostnames** that imply a live integration
   (`api.openai.com`, `api.anthropic.com`, `api.github.com`,
   `*.googleapis.com`, etc.). Provider URLs in env examples should
   point at lab stubs only.

## E. How to add a future env example

1. Create the file at the repo root with name `.env.<role>.example`
   (for example, `.env.preview.example`).

2. Open with the standard header comment (§D.1). Make sure either
   `EXAMPLE` or `example` appears in the file content.

3. Fill every key with a placeholder value (§D.2). Do NOT paste any
   value from a vault, Vercel project, GitHub Actions secret, or
   another developer's machine.

4. Run the CLOUD8 verification test:

   ```
   npx jest src/__tests__/integration/deployment/env-example-policy.test.ts
   ```

5. `git status` should show the new file as untracked (NOT ignored).
   `git add .env.<role>.example` should succeed without `-f`.

6. Reference the new file from the matching runbook
   (`docs/deployment/<RUNBOOK>.md`) and from the matching slice doc
   (`docs/build/slices/<SLICE>.md`).

## F. Verification

The Jest contract at
`src/__tests__/integration/deployment/env-example-policy.test.ts`
asserts:

- The repo's `.gitignore` still ignores real env files (the blanket
  `.env*` rule plus the `.env*.local` rule remain).
- The two CLOUD8 allow rules are present:
  - `!.env.example`
  - `!.env.*.example`
- Every `.env.*.example` file currently in the repo root contains the
  literal substring `EXAMPLE` or `example` (header marker).
- No committed `.env.*.example` file contains any of the four
  likely-secret patterns listed in §D.3.

The test is file-pure: no shell, no model call, no network.

## G. Cross-references

- CLOUD1 — Enterprise / Private Deployment Strategy (four-tier).
- CLOUD2 — Azure VNet reference lab blueprint (documentation).
- CLOUD3 — Docker runtime packaging.
- CLOUD4 — Local private deployment lab; introduced
  `.env.private-lab.example`, which is the first env example governed
  by this policy.
- CLOUD5 — Azure Container Apps + VNet IaC starter.

CLOUD8 does NOT deploy, does NOT call any provider, does NOT modify
auth, supabase, or migrations. production_deployment status is
preserved (still blocked).
