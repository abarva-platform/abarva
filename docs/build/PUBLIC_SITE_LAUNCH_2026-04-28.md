# AbarVa Public Site Launch — 2026-04-28

All 8 build waves shipped to `main`. The abarva.ai public site is ready for DNS cutover.

---

## Merge log

| Wave | PR | Commit | Files | Tests | What shipped |
|---|---|---|---|---|---|
| PUB-1 | #647 | `3eaaef7d` | +743 | — | Site shell: paper tokens, TopNav, Footer, PaperContainer, layout, seo-defaults |
| PUB-1-fixup | #658 | `4105caca` | +89 | 27 | `canonical-urls.ts` — single source for all `abarva.ai` URLs |
| PUB-2 | #655 | `0fb21534` | +620 | — | MaestroHero + MaestroFigure + phases.ts animated hero |
| PUB-3 | #668 | `b9116f50` | +580 | 17 | Contradictions scoreboard + `/contradictions/[id]/` detail pages |
| PUB-4 | #671 | `20bf90dc` | +1042 | 20 | Pattern index + `/patterns/[slug]/` detail + PatternCard + AskAtlasInline |
| PUB-5 | #653 | `4aea5f7e` | +652 | — | `/how-it-works` scroll-jack tour with IntersectionObserver |
| PUB-6 | #667 | `335fbd94` | +890 | 18 | 4 architecture diagrams + 6 `/architecture/*` sub-pages |
| PUB-7 | — | `edaf5c87` | +1435 | 24 | `/atlas/` landing + 3 editorial pieces + homepage Layer 5 |
| PUB-8 | #669 | `b9f4103a` | +740 | 17 | Digest + RSS/Atom/JSON feeds + sitemap.xml + robots.txt + `/contact/` |

**Total:** 6,791 net insertions · 106 unit tests passing · 0 hardcoded `abarva.ai` URLs outside `canonical-urls.ts`

---

## What's live at abarva.ai

### Routes
| Path | Component | Notes |
|---|---|---|
| `/` | HomePage | MaestroHero → ContradictionsScoreboard → HowItWorks → Architecture teaser → Patterns teaser → Atlas teaser → Editorial teaser |
| `/how-it-works/` | HowItWorks | 6-phase scroll-jack with animated MaestroFigure |
| `/patterns/` | PatternIndex | 60 patterns grouped by 6 categories |
| `/patterns/[slug]/` | PatternDetail | 60 static pages with generateStaticParams; per-pattern OG metadata |
| `/contradictions/` | ContradictionsScoreboard | 5 public contradictions |
| `/contradictions/[id]/` | ContradictionDetail | 5 static pages; Party A/B evidence + confidence delta |
| `/architecture/` | — | Redirect or index (see sub-pages) |
| `/architecture/eleven-planes/` | ElevenPlaneDiagram | Interactive nested SVG |
| `/architecture/knowledge-fabric/` | KnowledgeFabricDiagram | Pentagon 5-store animation |
| `/architecture/agents/` | FourAgentDiagram | Diamond 4-agent directed graph |
| `/architecture/data-plane/` | JwtDataPlaneDiagram | JWT control/data plane |
| `/architecture/corpus/` | ArchitecturePage | Text + diagram |
| `/architecture/signals/` | ArchitecturePage | Text + diagram |
| `/atlas/` | PublicAtlas | 3 sample insight cards + early-access CTA → /contact/ |
| `/editorial/` | EditorialIndex | 3 pieces in reverse-chron |
| `/editorial/[slug]/` | EditorialPiece | 3 static pages |
| `/digest/` | DigestPage | Weekly digest placeholder |
| `/contact/` | ContactPage | 5-field ContactForm with work-email validation |
| `/digest/feed.xml` | Route | RSS 2.0 |
| `/digest/feed.atom` | Route | Atom 1.0 |
| `/digest/feed.json` | Route | JSON Feed 1.1 |
| `/sitemap.xml` | Route | 14 static URLs |
| `/robots.txt` | Route | Points to sitemap |

### Content
- **60 patterns** from KF-1 corpus (foundation + advanced tiers)
- **5 public contradictions** (CON-001, CON-002, CON-004, CON-005, CON-008)
- **3 editorial pieces**: "10 Reasons AI Initiatives Fail", "Why We Publish Our Contradictions", "The Cost of AI Program Drift"
- **3 Atlas sample insights** with practitioner Q/A format

### Design compliance
- Brand tokens: paper `#faf7f1`, ink `#000000`, signal `#0066CC`, navy `#0c1a3a`
- Typography: Fraunces (serif), Inter (sans), JetBrains Mono (mono)
- CSS namespace: `pub-` prefix throughout
- All URLs from `CANONICAL_URLS` — no hardcoded strings

---

## Founder action items

1. **DNS cutover** — point `abarva.ai` (apex + www) at Vercel deployment. The `metadataBase` in `seo-defaults.ts` is already `https://abarva.ai`.

2. **OG image** — `/public/og-card-default.png` is referenced in `seo-defaults.ts` but must exist as a 1200×630 PNG. Add brand-consistent image before launch.

3. **Apple touch icon** — `/public/apple-touch-icon.png` is referenced in seo-defaults; confirm it exists.

4. **Favicon** — `/public/favicon.svg` is referenced; confirm it exists and matches brand.

5. **Feed content** — `src/lib/public-site/digest-source.ts` has a single placeholder digest entry ("Week of April 28, 2026"). Add real entries as the digest program matures.

6. **Contact form backend** — `src/app/api/contact/route.ts` logs submissions to console in dev. Wire to CRM / email in production (Resend, Postmark, or HubSpot form API).

7. **Atlas waitlist** — The `/atlas/` page CTAs link to `/contact/`. When Atlas private beta opens, update `CANONICAL_URLS.atlas` usage in `PublicAtlas.tsx` to route directly to the beta invite flow.

8. **Editorial cadence** — Add new pieces to `src/content/editorial/` and register their slugs in `editorial-loader.ts`. The `generateStaticParams` picks up new slugs automatically.

9. **Sitemap coverage** — `src/app/(public)/sitemap.xml/route.ts` lists 14 static URLs. When new patterns or contradictions are added, regenerate or extend the sitemap.

10. **Analytics** — No PostHog or analytics calls are wired in the public site shell yet. Add `posthog-js` initialization to `src/app/(public)/layout.tsx` before launch if public funnel tracking is needed.

---

*Generated 2026-04-28 by autonomous build loop.*
