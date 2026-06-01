# Sync AI Rules

`AGENTS.md` is the source of truth for AI tool instructions. Cursor and GitHub Copilot derivative files are generated from it.

## When To Run

Run the sync after any accepted change to `AGENTS.md`:

```bash
npm run sync-ai-rules
```

The command updates:

- `.cursor/rules`
- `.github/copilot-instructions.md`

## Merge Conflicts

Do not hand-merge generated AI-rule files. Resolve the `AGENTS.md` conflict first, then re-run:

```bash
npm run sync-ai-rules
```

Commit the regenerated outputs with the `AGENTS.md` change.

## Validation

Re-run the command before opening a PR. A clean second run should produce no Git diff.
