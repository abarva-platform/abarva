# Codex Work Queue · Prat-demo runway · April 20 2026

**Context:** Claude Code on main running Pack L v2 (topic retrieval injection into Nexus turns). Pack J scaffold merged tonight — vendor-whitelist.ts + Meridian/FirstCap/Apex enterprise files all landed. Codex is unblocked across every task below.

**Prat demo target:** next few days. These three tasks ship before he Googles AbarVa or opens the product.

**Dispatch order:** 1 → 2 → 3. Tasks 1 and 2 can run parallel if Codex has capacity.

---

## Task 1 · Marketing home surgical refresh

**Priority:** Highest. Prat will Google AbarVa the morning of his session. What he finds shapes demo expectations.

**Scope:** Refresh existing `abarva_homepage_design.html` to match current strategic positioning. Keep the design system (cream background / white cards / teal accent / Georgia wordmark). Refresh content. Add three new sections.

**Reference spec:** `/Users/anand/Projects/nexus/abarva-marketing-investor-spec.md` (drop it in the repo if not already there from `/mnt/user-data/outputs/abarva-marketing-investor-spec.md`). Sections 1-12 are content-locked in that doc.

**Concrete changes required:**

1. **Drop "Maestro" as primary public label.** The word was deprecated publicly. Replace with product-first framing: "AbarVa Engagements," "AbarVa Control Tower," "AbarVa Intelligence." Where roles must be named, use "senior operator" or "engagement lead" — never "Maestro."

2. **Update hero sub-headline** to include staff-aug augmentation angle. Exact text in spec §1 — opens Target-class customers who don't use consulting.

3. **Add third problem card** (spec §2) covering $400B internal labor + staff-aug spend. Target-style organizations matter.

4. **Reframe "What we are"** from consulting-replacement-only to three products. Spec §3 has exact copy.

5. **NEW SECTION 4: Four-layer intelligence architecture.** Use the SVG asset from Task 2. Per-layer callout table from spec §4. Position early — this is the moat made visible.

6. **NEW SECTION 8: Agent orchestration.** 10-row table of branded + worker agents with model tiers and latency budgets. Copy from spec §8.

7. **NEW SECTION 9: Deployment architecture.** Use the cloud deployment SVG from Task 2. Three proof points (data residency · audit retention · model flexibility) from spec §9.

8. **Remove the "340+ patterns" specific stat.** Genericize to "Genome patterns expanding with every engagement." The number is outdated — we're at ~14 canonical.

9. **Update founder bio section** to remove Prat's name unless/until he commits as design partner. For now, reference as "Fortune 40 CIO" anonymously. Revert to named once design-partner agreement signed.

10. **Three-CTA footer.** Replace single CTA with three boxes: Request demo · Become a design partner · Investor relations. Copy in spec §12.

**File paths:**
- Source: `/mnt/user-data/outputs/abarva_homepage_design.html` (existing 512-line file)
- Target: deploy to marketing site at `abarva.ai` (not `app.abarva.ai`)
- Spec reference: `abarva-marketing-investor-spec.md`

**Acceptance criteria:**
- [ ] All 12 sections render correctly on desktop and mobile (target: 1280px + 375px)
- [ ] No "Maestro" references anywhere in visible copy
- [ ] Hero sub mentions both consulting replacement AND staff-aug augmentation
- [ ] Four-layer architecture diagram renders with SVG (not ASCII)
- [ ] Agent orchestration table renders 10 rows with correct data
- [ ] Deployment section includes cloud architecture SVG + three proof points
- [ ] Three-CTA footer with distinct audiences (demo · design partner · investor)
- [ ] No forbidden-name references (McKinsey/BCG/Deloitte/Accenture/Bain/Huron/Navigant/Presbyterian/MD Anderson/CommonSpirit/HP Inc)

**Cut if time runs short:**
- Mobile responsive fine-tuning (ship desktop-good, queue mobile for later)
- Footer animations/hover states (ship static)
- Careers page link (can 404 temporarily)

**DO NOT cut:**
- Three-product framing (if this ships as consulting-only, Target account is dead)
- Staff-aug language in hero (same reason)
- Four-layer architecture section (this is the moat)

**Estimated effort:** 1 day (~8h).

---

## Task 2 · Architecture SVG assets

**Priority:** High. Used by Task 1 and Task 3. Build once, reuse.

**Scope:** Two clean SVG diagrams matching AbarVa design system. Teal accent (#2DD4C8), cream background option (#F8F7F4), dark background option (#060A12) — produce both variants so they embed cleanly in light and dark sections.

**Asset 1: Four-layer intelligence architecture**

Four horizontally-stacked layers with labels. Under the layer stack, three parallel columns showing Graph + Vector + Structured DB fanning out from each layer. Arrow from layers down to "Nexus System Prompt" final composite.

- **L4 USER PROFILE** (top): VIP profile · role · focus · preferences
- **L3 ENGAGEMENT CONTEXT**: turn history · active topic · phase · patterns
- **L2 CLIENT DATA**: tech stack · use cases · costs · contradictions
- **L1 PUBLIC KNOWLEDGE** (bottom): topics · patterns · vendors · research

Each layer rendered as a horizontal bar. L4 narrower/right-aligned to suggest "selectively populated for VIP users." Teal accent on each layer header. Connecting lines to Graph/Vector/DB columns on the right showing parallel retrieval.

Target dimensions: 960 × 540 for page embed. Scalable SVG (no rasterization). Text rendered as text (not paths) so it's searchable and accessible.

**Asset 2: Cloud deployment architecture**

Outer boundary labeled "Customer Cloud — e.g., Target AWS." Inside the boundary:
- Top row: three boxes — AbarVa Web (Next.js) · AbarVa API (Node/TS) · Agent Runtime (Nexus, Ask IQ)
- Middle row: data store row labeled "Customer VPC — data stores" containing three boxes — Postgres · Neo4j · Pinecone. Caption: "All client + engagement data stays in VPC."
- Bottom arrow: outbound arrow labeled "Foundation model APIs only" pointing out of the boundary to an external box "Anthropic · OpenAI · configurable."

Separate annotation box below the boundary: "AbarVa engineering access · controlled deploy pipeline · customer retains audit logs."

Target dimensions: 960 × 540. Light and dark variants.

**File paths:**
- Deliver: `public/assets/architecture/four-layer-intelligence-light.svg`, `public/assets/architecture/four-layer-intelligence-dark.svg`
- Deliver: `public/assets/architecture/cloud-deployment-light.svg`, `public/assets/architecture/cloud-deployment-dark.svg`

**Acceptance criteria:**
- [ ] Both diagrams render cleanly at 100% and 200% zoom
- [ ] Text is selectable (not rasterized)
- [ ] Teal accent matches #2DD4C8 exactly
- [ ] Labels readable at 480px width (mobile preview)
- [ ] Light + dark variants for each

**Estimated effort:** 3-4h total for both SVGs.

---

## Task 3 · Investor page net-new

**Priority:** High. Unlocks Anthology Fund follow-up conversations. Ships after homepage pattern is established.

**Scope:** Net-new page at `abarva.ai/investors`. Warm-intro-only access via tokenized URL (simple env-variable check, no real auth). Eight sections per spec §Investor Page. Same design system as homepage, denser typography, more data-forward.

**Reference spec:** Same file — `abarva-marketing-investor-spec.md` §Investor Page sections 1-8.

**Sections to build:**

1. **The anchor** — Harvey $11B → AbarVa $1.3T TAM framing (§1)
2. **Two-product compounding loop** — reuse the homepage's product section but add a loop diagram (Tower surfaces → Engagement solves → Outcome flows back → Tower enriched)
3. **Four-layer architecture as moat** — reuse Task 2's SVG; reframe accompanying copy as "four proprietary assets compounding" (Transformation Genome · cross-client intelligence graph · Outcome Interpretability Layer · vendor ecosystem data)
4. **Unit economics** — table with revenue/engagement, LLM cost, Maestro labor, infrastructure, gross margin. 25:1 revenue-to-cost ratio callout. Copy in spec §4.
5. **Traction signals** — placeholder section with the signals listed in spec §5. Fill with real data as it lands.
6. **The raise** — $8M at $25M pre-money SAFE. Use of proceeds table. Series A trigger ($5M ARR, 30 clients). Copy in spec §6.
7. **Why us, why now** — founder story + 18-24 month category window. Copy in spec §7.
8. **Contact** — email addresses, warm-intro preference.

**Access model:**
- Not indexed (add `<meta name="robots" content="noindex, nofollow">`)
- No public link from homepage except the "Investor relations" CTA in the three-CTA footer
- Simple token-based access: `abarva.ai/investors?access=<token>` — validate token against env variable. For v1 a single shared token is fine; rotate after round closes.

**File paths:**
- `app/investors/page.tsx` (if Next.js app on marketing site) or equivalent static file
- Use same design system as homepage

**Acceptance criteria:**
- [ ] All 8 sections render on desktop + mobile
- [ ] No-index meta tag present
- [ ] Token-based access gate works (non-token visitors redirected to `/` or shown 404)
- [ ] Four-layer architecture SVG embedded from Task 2
- [ ] Two-product compounding loop diagram renders (new asset, simple — Tower → Engagement → Outcome → Tower)
- [ ] Unit economics table renders with correct values
- [ ] Raise section states $8M at $25M pre-money cleanly
- [ ] No forbidden-name references

**Cut if time runs short:**
- Compounding loop diagram as SVG (ship as CSS flex layout with arrows instead)
- Mobile responsive polish

**DO NOT cut:**
- Moat framing as four proprietary assets
- Unit economics table with gross margin
- Token gate (never ship investor page indexable)

**Estimated effort:** 1 day (~8h).

---

## Notes for Codex

**What you can safely assume:**
- Pack J scaffold files merged (`_shared/vendor-whitelist.ts`, Meridian/FirstCap/Apex enterprise files exist)
- Claude Code is actively working in `src/` — do not edit files in `src/lib/agent/`, `src/app/(maestro)/engage/`, `src/app/(maestro)/engagements/[id]/topics/` to avoid merge conflicts
- Marketing site deploys separately from app. Codex work is on `abarva.ai`, NOT `app.abarva.ai`

**What you must verify before starting:**
- Download the spec from `/mnt/user-data/outputs/abarva-marketing-investor-spec.md` (Anand will drop it at `/Users/anand/Projects/nexus/abarva-marketing-investor-spec.md` if not already there)
- Existing homepage at `/mnt/user-data/outputs/abarva_homepage_design.html` as starting point for Task 1

**Coordination with Claude Code:**
- Pack L v2 is in Claude Code's lane tonight. If v2 finishes before your tasks, Claude Code will move to cognitive stages next — zero overlap with your work.
- After Task 1 ships, flag to Anand so he can share the marketing home URL for warm investor conversations.

**Commit message conventions:**
- `feat(marketing): refresh home — four-layer architecture + agent atlas + deployment section`
- `feat(marketing): architecture SVG assets · four-layer + cloud deployment`
- `feat(marketing): investors page · Harvey anchor + unit economics + raise`
