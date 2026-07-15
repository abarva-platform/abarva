# Universal Tenant Input Standard v3 2026-07

One flexible template set for every tenant and industry. Industry specificity belongs in rows, values, relationships, and evidence, not in separate template families.

Azure landing pattern: `tenant-inputs/{tenant_key}/{intake_id}/raw/`; validated files move to `tenant-inputs/{tenant_key}/{intake_id}/validated/`.

Files must pass `npm run audit:tenant-input-quality` before loading into the data layer.
