# Build Journal

<!-- Backfilled 2026-04-28 from PR titles + commit messages. Original session journals were thin. -->

## 2026-04-29 · Knowledge Persistence Canon Reconciliation

`GRAPH_VECTOR_READINESS.md` is the canonical pilot/persistence decision for embeddings: `text-embedding-3-small` at 1536 dimensions, stored as `vector(1536)` for the first pgvector-backed Enterprise Data Room migration. Older intelligence vision/source-material docs that mention Voyage-3, `text-embedding-3-large`, 1024 dimensions, 3072 dimensions, or Pinecone are historical north-star/provider notes, not the current migration default. Revisit the dimension decision when retrieval quality fails pilot acceptance, tenant count exceeds 100, or a tenant exceeds roughly 10,000 approved chunks; until then the app and broker contracts should align to the 1536-dim profile.


| Date | Wave | Status | Lines | Smoke | PR | Notes |
|---|---|---|---|---|---|---|
| 2026-04-28 | 5B | shipped | +152/-2 | (pre-infra) | #540 | Intelligence pattern detail gained the "Applied in programs" section for T3-H03. |
| 2026-04-28 | 5C | shipped | +5/-2 | (pre-infra) | #541 | Programs workbench and phase-panel logic now uses the caller program ID instead of the fixture fallback. |
| 2026-04-28 | 5D | shipped | +12/-9 | (pre-infra) | #542 | Home P3 sweep updated agent quote, actions, and deep-links. |
| 2026-04-28 | 5E | shipped | +10/-10 | (pre-infra) | #543 | APX-CDP-2026 fixture advanced from P2 Synthesis to P3 Design. |
| — | T0+T1 | held | +7295/-650 | (pre-infra) | #544 | Tower infrastructure plus portfolio skeleton held for human review. |
| 2026-04-28 | S1 | shipped | +334/-186 | (pre-infra) | #545 | Source Wave S1 retired the legacy three-shell stack and mounted Sentinel chrome. |
| 2026-04-28 | T2 | shipped | +770/-0 | (pre-infra) | #546 | Tower bubble chart and cost lens shipped. |
| 2026-04-28 | T3 | shipped | +828/-3 | (pre-infra) | #547 | Tower vendor-anchored program detail page shipped. |
| 2026-04-28 | 5F | shipped | +16/-16 | (pre-infra) | #548 | Programs and Source route fixes plus Build gate ribbon and P3 criteria updates landed post-Wave S1. |
| 2026-04-28 | T4 | shipped | +807/-7 | (pre-infra) | #549 | Tower pressure detail and decisions log shipped. |
| 2026-04-28 | 5G | shipped | +4/-3 | (pre-infra) | #550 | Tower Risk Lens gained the CDP Build-gate vendor contract risk. |
| 2026-04-28 | 5H | shipped | +26/-8 | (pre-infra) | #551 | APX-CDP-2026 was added to Adoption and Value lenses. |
| 2026-04-28 | T5 | shipped | +980/-8 | (pre-infra) | #552 | Tower vendor, outcome, and decision detail pages shipped. |
| 2026-04-28 | 5I | shipped | +25/-1 | (pre-infra) | #553 | AI Cloud Spend pressure detail was added, fixing the `/tower/pressures/twr-ai-cloud-spend` 404. |
| 2026-04-28 | T6 | shipped | +694/-0 | (pre-infra) | #554 | Tower onboard flow, budget simulator, and renewal workspace shipped. |
| 2026-04-28 | S2 | shipped | +659/-641 | (pre-infra) | #555 | Source Wave S2 refreshed the index pages. |
| 2026-04-28 | 5J | shipped | +4/-2 | (pre-infra) | #556 | Unknown Intelligence pattern IDs now redirect to the library instead of showing T3-H01. |
| 2026-04-28 | T7 | shipped | +205/-0 | (pre-infra) | #557 | Tower empty state, error state, and journal closeout shipped. |
| 2026-04-28 | 5K | shipped | +10/-10 | (pre-infra) | #558 | Home and Source stale `/source/ams-vendor-2026` router pushes were fixed. |
| 2026-04-28 | 5L | shipped | +2/-2 | (pre-infra) | #559 | SourceIndexPage cross-link text was updated now that the Design gate is already cleared. |
| 2026-04-28 | 5M | shipped | +25/-5 | (pre-infra) | #560 | ProgramScopePage gate chips now show cleared Design gate and pending Build gate. |
| 2026-04-28 | 5N | shipped | +9/-9 | (pre-infra) | #561 | `programs-page-view` stale P2 Synthesis portfolio prose was updated to the current P3 state. |
| 2026-04-28 | 5O | shipped | +2/-2 | (pre-infra) | #562 | T3-H01 `usedByPrograms` now reflects APX-CDP-2026 at P3 rather than P2. |
| 2026-04-28 | S3 | shipped | +697/-464 | (pre-infra) | #563 | Source Wave S3 refreshed the event canvas. |
| 2026-04-28 | 5P | shipped | +1/-1 | (pre-infra) | #564 | Programs agent handoff overlay phase labels moved from P2 wording to P3 wording. |
| 2026-04-28 | PUB-1 | shipped | +743/-0 | n/a | #647 | Public site shell: paper aesthetic, TopNav, Footer, PaperContainer, public-site CSS tokens, seo-defaults, layout. |
| 2026-04-28 | PUB-1-fixup | shipped | +89/-3 | n/a | #658 | Canonical URL constants (canonical-urls.ts) + 27 tests + wire seo-defaults to use CANONICAL_URLS.origin. |
| 2026-04-28 | PUB-2 | shipped | +620/-0 | n/a | #655 | MaestroHero + MaestroFigure + phases.ts; full-viewport animated hero with phase ticker. |
| 2026-04-28 | PUB-3 | shipped | +580/-2 | n/a | #668 | Contradictions scoreboard (5 public contradictions) + /contradictions/[id] detail pages + public-corpus.ts filter. 17 tests. |
| 2026-04-28 | PUB-4 | shipped | +1042/-0 | n/a | #671 | Pattern detail pages: 60-pattern index + /patterns/[slug]/ detail + PatternCard + PatternDetail + PatternMetadataSidebar + AskAtlasInline. 20 tests. |
| 2026-04-28 | PUB-5 | shipped | +652/-0 | n/a | #653 | How-it-works scroll-jack tour with IntersectionObserver, sticky MaestroFigure sidebar, AnnotatedScreenshot. |
| 2026-04-28 | PUB-6 | shipped | +890/-0 | n/a | #667 | Architecture diagrams (ElevenPlane, KnowledgeFabric, FourAgent, JwtDataPlane) + 6 architecture sub-pages. 18 tests. |
| 2026-04-28 | PUB-7 | shipped | +1435/-0 | n/a | n/a | Public Atlas landing + 3 editorial pieces + editorial loader + atlas-public-scope.ts + homepage Layer 5. 24 tests. |
| 2026-04-28 | PUB-8 | shipped | +740/-0 | n/a | #669 | Digest page + RSS/Atom/JSON feeds + sitemap.xml + robots.txt + /contact + ContactForm + work-email.ts. 17 tests. |
