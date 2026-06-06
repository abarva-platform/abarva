# Lakeshore Kyriba Treasury Corpus Wave 1

## Purpose

This pack is the first governed corpus-last slice for Lakeshore. It promotes the modeled Kyriba and treasury doctrine from the Lakeshore success brief into import-ready JSONL rows for the governed admin corpus loader.

## File

- `lakeshore-kyriba-treasury-wave1.jsonl`

## Coverage

- Daily cash pre-walk
- Bank connectivity matrix
- ERP/AP/AR/GL feed quality
- Entity hierarchy and account registry
- Historical cash reconstruction for forecasting
- Intercompany reconciliation controls
- Adoption and Excel elimination
- Covenant forecasting
- Payment approval and BEC controls
- CFO-attested value realization
- SI scope and acceptance governance
- Banking consolidation Source event trigger

## Validation

Run from the repository root:

```bash
node -e "const fs=require('fs'); const p='scripts/corpus/generated/lakeshore-kyriba-treasury-wave1/lakeshore-kyriba-treasury-wave1.jsonl'; const lines=fs.readFileSync(p,'utf8').trim().split(/\n/); for (const l of lines) JSON.parse(l); console.log(lines.length)"
```

Governed loader shape validation:

```bash
NODE_OPTIONS='--require ./src/scripts/_mock-server-only-preload.cjs' npx tsx -e "import fs from 'node:fs'; import { prepareCorpusJsonlImport } from './src/lib/context-ingestion/corpus-jsonl-import'; const path='scripts/corpus/generated/lakeshore-kyriba-treasury-wave1/lakeshore-kyriba-treasury-wave1.jsonl'; const result=prepareCorpusJsonlImport({clientId:'client-lakeshore',tenantKey:'lakeshore',uploadedBy:'codex',fileName:'lakeshore-kyriba-treasury-wave1.jsonl',jsonlText:fs.readFileSync(path,'utf8'),defaultVertical:'diversified_holdco',uploadedAt:'2026-06-06T11:30:00.000Z'}); console.log(JSON.stringify({rowsParsed:result.rowsParsed,patternsPrepared:result.patternsPrepared,edgesPrepared:result.edgesPrepared,verticals:result.verticals,warnings:result.warnings.length,errors:result.errors},null,2));"
```

Latest validation result:

```json
{
  "rowsParsed": 12,
  "patternsPrepared": 12,
  "edgesPrepared": 26,
  "verticals": ["diversified_holdco"],
  "warnings": 0,
  "errors": []
}
```

## Loading posture

This pack is import-ready but not claimed as live-loaded until it is committed through `/admin/context-layer/uploads` or `/api/admin/context-layer/corpus-import` with operator attestation. It is synthetic/illustrative and should be labeled as such in buyer-facing proof.
