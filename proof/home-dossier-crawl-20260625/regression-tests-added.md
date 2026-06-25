# Regression Tests Added

- `src/lib/semantic-dossiers/__tests__/universal-dimension-dossier.test.ts`
  - Exact SkyHarbor org question must use named leadership and cannot false-refuse.
  - Role-level org question must synthesize loaded role/domain accountability.
  - Application question must attach the full relevant binder and adjacent dimensions.

- `src/app/api/home/know/ask/__tests__/route.test.ts`
  - `/api/home/know/ask` returns the dossier-backed SkyHarbor answer.
  - Lakeshore AI investment question is handed off to Intelligence.

- `scripts/qa/home-dossier-crawl.ts`
  - Runs the 54-question SkyHarbor/Lakeshore crawl.
  - Scores correctness, synthesis, citations, gaps, artifact support, readability, and tenant safety.
  - Writes transcripts, endpoint audit, and tenant-fence proof.
