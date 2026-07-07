# Scaffold Scripts

Use these scripts when starting governance work that needs a standard release record or architecture decision record. They create the file shape only; the author still has to replace placeholders with verified facts before opening a PR.

## Commands

- `npm run scaffold:release -- --title "Short title" --lane internal-admin`
- `npm run scaffold:adr -- --title "Decision title"`
- `npm run scaffold:smoke`

## Release Records

`scaffold:release` writes `docs/releases/records/YYYY-MM-DD-slug.md` with every section required by the release control gate. Pass `--slug`, `--date`, `--status`, `--layer`, or `--clients` when the default placeholder text is not enough.

Run `npm run release:check -- --base origin/main --head HEAD` before pushing. The generated file is intentionally a draft; do not leave placeholder text in a PR that is ready for review.

## ADRs

`scaffold:adr` writes the next `ADR-NNNN-slug.md` under `docs/architecture/adr/`. Pass `--number` only when you are intentionally filling a known gap. After creating the file, add it to `docs/architecture/adr/README.md`.

ADRs must reference verified repo paths, docs, PRs, or external references. Do not record planned work as shipped implementation.

## Overwrites

Both generators refuse to overwrite existing files. Use `--force` only when replacing a file you just generated in the same branch.
