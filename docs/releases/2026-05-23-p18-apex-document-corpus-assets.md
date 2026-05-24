# P18 Apex Document And Corpus Assets

## Summary

- Added the Packet 18 document fixture layer: 30 synthetic contract PDFs and 10 synthetic charter PDFs, all watermarked as Apex synthetic data.
- Added valid Excel workbook binaries for the CFO financial consolidation and initiative commitment views.
- Added 42 source-file registry rows plus 280 tenant-grounded corpus chunks for retrieval and onboarding simulation.
- Extended `npm run verify:apex-data-pack` to byte-check PDFs/XLSX files and validate corpus/source-file referential integrity.

## Validation

- `npm run verify:apex-data-pack`
- `npm run release:check -- --base origin/main --head HEAD`

## Impact

This is static synthetic substrate only. It does not run DB ingestion, upload/confirm UI, PDF extraction, embeddings, or live Sentinel canonical execution.
