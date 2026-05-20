// Board-grade deck shell — the shared presentation-deck chrome.
//
// Every board-grade Moves artifact (the Costed Business-Case Pack, the
// Discover Brief, and the artifacts that follow) renders as the SAME
// presentation deck: a persistent left menu rail, a right content stage, one
// slide shown at a time, and an inline slide-switch script wired to the menu,
// the Prev/Next controls, and the arrow keys. For print / PDF an `@media
// print` block expands every slide stacked vertically, one page each, so the
// file still exports as the full document.
//
// This module owns that chrome so it is authored ONCE and is identical across
// artifacts. An artifact renderer supplies:
//   - deck metadata (titles, the tenant label, the verdict strip),
//   - a generic ordered list of `DeckSlide`s ({ id, navLabel, navPreview,
//     render() }), where slide 1 is the cover.
// The shell composes the menu rail, the stage, the inline script, the deck
// controls, and the full self-contained HTML document around them.
//
// It also exposes the per-slide exhibit-anatomy scaffold (slim running
// header, takeaway headline, one hero exhibit, a quiet footer) and the locked
// AbarVa design-system CSS (cream ground, near-black ink, one navy accent, a
// serif display face). An artifact uses `slideShell()` to wrap each slide in
// the calm, consistent chrome.
//
// The visual register is the locked AbarVa design system — no new palette.
// The module is PURE: deterministic string composition, no I/O, no clock.

// ---------------------------------------------------------------------------
// Escaping — the shell composes a document string, so every interpolated
// caller string is escaped.
// ---------------------------------------------------------------------------

/** HTML-escape a string for safe interpolation into the document. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Slide contract — an artifact supplies a generic ordered list of these.
// ---------------------------------------------------------------------------

/** One deck slide — a navigable screen on the stage. Slide 1 is the cover. */
export interface DeckSlide {
  /** Stable anchor id, e.g. 'board-answer' or 'cover'. */
  id: string;
  /** Short menu label, e.g. "Decision snapshot". */
  navLabel: string;
  /** Two-line menu preview — the slide's takeaway, in the menu rail. */
  navPreview: string;
  /** Renders the slide's full `<section class="slide" ...>` markup. */
  render(slideNo: number, slideCount: number): string;
}

/** A verdict chip shown in the menu foot and the cover meta. */
export interface DeckVerdict {
  /** Short verdict word, e.g. "SHAPE", "RESHAPE", "FUND". */
  label: string;
  /** A quiet sub-line under the verdict, e.g. "Payback blocked — seed gap". */
  sub: string;
}

/** Deck-level metadata — the strings the chrome needs around the slides. */
export interface DeckMeta {
  /** Brand eyebrow, e.g. "AbarVa · Moves". */
  brand: string;
  /** Artifact name, e.g. "Costed Business-Case Pack". */
  artifactLabel: string;
  /** The Move this deck is about, e.g. "Contact Center AI Routing". */
  moveLabel: string;
  /** Tenant display label, e.g. "Apex Retail". */
  tenantLabel: string;
  /** Tenant key, e.g. "apex-retail". */
  tenantKey: string;
  /** ISO date the deck was generated. */
  generatedOn: string;
  /** The deck verdict chip. */
  verdict: DeckVerdict;
  /** `<title>` element text for the document head. */
  documentTitle: string;
}

// ===========================================================================
// Per-slide exhibit-anatomy scaffold — every section slide shares the same
// calm chrome: a slim running header, the takeaway headline, ONE hero
// exhibit, minimal prose, and a quiet single-line footer. The dense
// evidence/owner detail collapses into the footer strip.
// ===========================================================================

/** A footer fact — one labelled cell in the quiet footer strip. */
export interface FooterFact {
  key: string;
  val: string;
}

/** The header / headline / footer inputs for a section slide. */
export interface SlideShellInput {
  /** Anchor id for the slide section. */
  id: string;
  /** Position in the deck — used by `data-slide` and the running header. */
  slideNo: number;
  /** Total slide count — used by the running "Slide N / M" indicator. */
  slideCount: number;
  /** Brand text shown in the slim running header, e.g. "AbarVa · Moves". */
  headerBrand: string;
  /** Section label shown in the running header and the eyebrow. */
  navLabel: string;
  /** Section number shown in the eyebrow, e.g. 1..N. */
  sectionNo: number;
  /** Takeaway headline — the slide's single point of view. */
  takeaway: string;
  /** The composed hero body — lede + hero exhibit + any detail strip. */
  hero: string;
  /** The quiet-footer facts, left-to-right. */
  footer: FooterFact[];
}

/** The slim running header for a section slide. */
function slideRunningHeader(input: SlideShellInput): string {
  return (
    `<div class="slide-rule">` +
    `<div class="slide-rule-l">` +
    `<span class="slide-brand">${escapeHtml(input.headerBrand)}</span>` +
    `<span class="slide-sep">·</span>` +
    `<span>${escapeHtml(input.navLabel)}</span>` +
    `</div>` +
    `<div class="slide-rule-r">Slide ${input.slideNo} / ` +
    `${input.slideCount}</div>` +
    `</div>`
  );
}

/** The takeaway headline — the slide's single point of view. */
function slideHeadline(input: SlideShellInput): string {
  return (
    `<div class="slide-eyebrow">Section ${input.sectionNo} · ` +
    `${escapeHtml(input.navLabel)}</div>` +
    `<h2 class="slide-headline">${escapeHtml(input.takeaway)}</h2>`
  );
}

/** The quiet footer strip — facts compressed into one thin row. */
function slideFooterStrip(facts: FooterFact[]): string {
  return (
    `<div class="slide-foot">` +
    facts
      .map(
        (f, i) =>
          `<div class="foot-cell${i === 0 ? ' foot-implication' : ''}">` +
          `<span class="foot-key">${escapeHtml(f.key)}</span>` +
          `<span class="foot-val">${escapeHtml(f.val)}</span>` +
          `</div>`,
      )
      .join('') +
    `</div>`
  );
}

/**
 * Wrap a section's hero body in the shared slide chrome — a slim header, the
 * takeaway headline, the hero stage, and a quiet footer. Slides other than the
 * cover carry `data-slide` and are hidden until selected; the inline script
 * reveals exactly one at a time.
 */
export function slideShell(input: SlideShellInput): string {
  return (
    `<section class="slide" id="${escapeHtml(input.id)}" ` +
    `data-slide="${input.slideNo}" ` +
    `aria-label="${escapeHtml(input.navLabel)}">` +
    `<div class="slide-inner">` +
    slideRunningHeader(input) +
    slideHeadline(input) +
    `<div class="slide-stage">${input.hero}</div>` +
    slideFooterStrip(input.footer) +
    `</div>` +
    `</section>`
  );
}

/** A framed hero exhibit — caption above, the SVG, an optional note below. */
export function heroExhibit(
  caption: string,
  svg: string,
  note?: string,
): string {
  return (
    `<figure class="hero">` +
    `<figcaption class="hero-caption">${escapeHtml(caption)}</figcaption>` +
    `<div class="hero-frame">${svg}</div>` +
    (note ? `<p class="hero-note">${escapeHtml(note)}</p>` : '') +
    `</figure>`
  );
}

/**
 * A hero exhibit whose body is arbitrary HTML (a diagram, a card grid) rather
 * than an SVG string. Identical chrome to `heroExhibit`.
 */
export function heroExhibitHtml(
  caption: string,
  body: string,
  note?: string,
): string {
  return (
    `<figure class="hero">` +
    `<figcaption class="hero-caption">${escapeHtml(caption)}</figcaption>` +
    `<div class="hero-frame">${body}</div>` +
    (note ? `<p class="hero-note">${escapeHtml(note)}</p>` : '') +
    `</figure>`
  );
}

/** A short lede — 2 to 4 lines of supporting prose above the hero. */
export function lede(text: string): string {
  return `<p class="slide-lede">${escapeHtml(text)}</p>`;
}

/**
 * A collapsible detail strip — keeps a dense table OFF the composed slide
 * while keeping it one click away (and always expanded for print).
 */
export function detailStrip(summary: string, body: string): string {
  return (
    `<details class="slide-detail">` +
    `<summary class="slide-detail-summary">` +
    `<span class="detail-chevron" aria-hidden="true"></span>` +
    `<span>${escapeHtml(summary)}</span>` +
    `</summary>` +
    `<div class="slide-detail-body">${body}</div>` +
    `</details>`
  );
}

// ===========================================================================
// Cover slide — slide 1. The shell composes a consistent cover; the artifact
// supplies the title, lede, and the meta tiles.
// ===========================================================================

/** A cover meta tile — a labelled headline figure on the cover. */
export interface CoverMetaTile {
  label: string;
  value: string;
}

/** Inputs for the shared cover slide. */
export interface CoverInput {
  /** Brand eyebrow, e.g. "AbarVa · Moves". */
  brand: string;
  /** Artifact eyebrow line, e.g. "Discover Brief · Board-grade artifact". */
  eyebrow: string;
  /** The Move title — the cover's `<h1>`. */
  title: string;
  /** Tenant line, e.g. "Apex Retail · apex-retail". */
  tenantLine: string;
  /** The cover lede — supports a single bold `**word**` span. */
  lede: string;
  /** Cover meta tiles, left-to-right. */
  meta: CoverMetaTile[];
  /** The navigation hint line at the foot of the cover. */
  hint: string;
}

/**
 * Render the shared cover as slide 1. The lede may carry one `**bold**` span,
 * which is rendered as `<strong>` — every other character is escaped.
 */
export function coverSlide(input: CoverInput): string {
  return (
    `<section class="slide slide-cover" id="cover" data-slide="1" ` +
    `aria-label="Cover">` +
    `<div class="slide-inner cover-inner">` +
    `<div class="cover-brand">${escapeHtml(input.brand)}</div>` +
    `<div class="cover-eyebrow">${escapeHtml(input.eyebrow)}</div>` +
    `<h1 class="cover-title">${escapeHtml(input.title)}</h1>` +
    `<div class="cover-tenant">${escapeHtml(input.tenantLine)}</div>` +
    `<p class="cover-lede">${boldSpan(input.lede)}</p>` +
    `<div class="cover-meta">` +
    input.meta
      .map(
        (m) =>
          `<div><span class="cover-meta-label">` +
          `${escapeHtml(m.label)}</span>` +
          `<span class="cover-meta-val">${escapeHtml(m.value)}</span></div>`,
      )
      .join('') +
    `</div>` +
    `<div class="cover-hint">${escapeHtml(input.hint)}</div>` +
    `</div>` +
    `</section>`
  );
}

/** Escape a string, but render a single `**bold**` span as `<strong>`. */
function boldSpan(text: string): string {
  // `[\s\S]` matches any character including newlines without the `s` flag.
  const m = /^([\s\S]*?)\*\*([\s\S]+?)\*\*([\s\S]*)$/.exec(text);
  if (!m) return escapeHtml(text);
  return (
    escapeHtml(m[1]) +
    `<strong>${escapeHtml(m[2])}</strong>` +
    escapeHtml(m[3])
  );
}

// ===========================================================================
// Left menu rail — the persistent deck navigation.
// ===========================================================================

function renderMenuRail(meta: DeckMeta, slides: DeckSlide[]): string {
  const items = slides
    .map((s, i) => {
      const slideNo = i + 1;
      const num = String(i).padStart(2, '0');
      const isCover = i === 0;
      const current = isCover ? ' aria-current="true"' : '';
      return (
        `<button class="menu-item" type="button" ` +
        `data-goto="${slideNo}"${current}>` +
        `<span class="menu-num">${num}</span>` +
        `<span class="menu-text">` +
        `<span class="menu-label">${escapeHtml(s.navLabel)}</span>` +
        `<span class="menu-sub">${escapeHtml(s.navPreview)}</span>` +
        `</span>` +
        `</button>`
      );
    })
    .join('');
  return (
    `<nav class="menu" aria-label="Deck navigation">` +
    `<div class="menu-head">` +
    `<div class="menu-brand">${escapeHtml(meta.brand)}</div>` +
    `<div class="menu-title">${escapeHtml(meta.artifactLabel)}</div>` +
    `<div class="menu-tenant">${escapeHtml(meta.tenantLabel)}</div>` +
    `</div>` +
    `<div class="menu-list">${items}</div>` +
    `<div class="menu-foot">` +
    `<span class="menu-foot-verdict">Verdict · ` +
    `${escapeHtml(meta.verdict.label)}</span>` +
    `<span class="menu-foot-sub">${escapeHtml(meta.verdict.sub)}</span>` +
    `</div>` +
    `</nav>`
  );
}

// ===========================================================================
// Inline slide-switch script — no external src. Reveals one slide at a time,
// syncs the menu, wires prev/next + arrow keys, resets stage scroll on change.
// ===========================================================================

function deckScript(slideCount: number): string {
  // Kept terse and dependency-free; runs at the end of <body>.
  return (
    `(function(){` +
    `var total=${slideCount};` +
    `var stage=document.getElementById('stage');` +
    `var slides=Array.prototype.slice.call(` +
    `document.querySelectorAll('.slide'));` +
    `var items=Array.prototype.slice.call(` +
    `document.querySelectorAll('.menu-item'));` +
    `var cur=1;` +
    `function show(n){` +
    `if(n<1)n=1;if(n>total)n=total;` +
    `cur=n;` +
    `slides.forEach(function(s){` +
    `var sn=parseInt(s.getAttribute('data-slide'),10);` +
    `var on=sn===n;` +
    `s.classList.toggle('is-active',on);` +
    `if(on){s.removeAttribute('hidden');}` +
    `else{s.setAttribute('hidden','');}` +
    `});` +
    `items.forEach(function(it){` +
    `var gn=parseInt(it.getAttribute('data-goto'),10);` +
    `if(gn===n){it.setAttribute('aria-current','true');}` +
    `else{it.removeAttribute('aria-current');}` +
    `});` +
    `var active=items[n-1];` +
    `if(active&&active.scrollIntoView){` +
    `active.scrollIntoView({block:'nearest'});}` +
    `if(stage){stage.scrollTop=0;}` +
    `window.scrollTo(0,0);` +
    `var c=document.getElementById('deck-counter');` +
    `if(c){c.textContent=n+' / '+total;}` +
    `}` +
    `items.forEach(function(it){` +
    `it.addEventListener('click',function(){` +
    `show(parseInt(it.getAttribute('data-goto'),10));});` +
    `});` +
    `var prev=document.getElementById('deck-prev');` +
    `var next=document.getElementById('deck-next');` +
    `if(prev){prev.addEventListener('click',function(){show(cur-1);});}` +
    `if(next){next.addEventListener('click',function(){show(cur+1);});}` +
    `document.addEventListener('keydown',function(e){` +
    `var t=e.target;` +
    `if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'))return;` +
    `if(e.key==='ArrowRight'||e.key==='PageDown'){` +
    `show(cur+1);e.preventDefault();}` +
    `else if(e.key==='ArrowLeft'||e.key==='PageUp'){` +
    `show(cur-1);e.preventDefault();}` +
    `else if(e.key==='Home'){show(1);e.preventDefault();}` +
    `else if(e.key==='End'){show(total);e.preventDefault();}` +
    `});` +
    `show(1);` +
    `})();`
  );
}

// ===========================================================================
// The deck chrome — prev/next controls anchored to the stage.
// ===========================================================================

function deckControls(slideCount: number): string {
  return (
    `<div class="deck-controls" aria-hidden="false">` +
    `<button class="deck-btn" type="button" id="deck-prev" ` +
    `aria-label="Previous slide">‹ Prev</button>` +
    `<span class="deck-counter" id="deck-counter">1 / ` +
    `${slideCount}</span>` +
    `<button class="deck-btn" type="button" id="deck-next" ` +
    `aria-label="Next slide">Next ›</button>` +
    `</div>`
  );
}

// ===========================================================================
// The locked design-system stylesheet — the AbarVa register, deck on screen,
// full document in print. Shared by every artifact so the visual register is
// authored once.
// ===========================================================================

/** The inlined deck stylesheet — the locked AbarVa register. */
export function deckStyles(): string {
  return `
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; }
body {
  background: #e7e3da;
  color: #070707;
  font-family: "DM Sans","Inter",system-ui,-apple-system,sans-serif;
  font-size: 14px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3 {
  font-family: "Newsreader","Cormorant Garamond","Georgia",serif;
  font-weight: 500; letter-spacing: -0.01em; margin: 0;
}

/* === Deck shell — fixed left menu, scrolling right stage. === */
.deck {
  display: grid;
  grid-template-columns: 264px minmax(0,1fr);
  height: 100vh;
}

/* --- Left menu rail --- */
.menu {
  background: #11100e; color: #e7e3da;
  height: 100vh; position: sticky; top: 0;
  display: flex; flex-direction: column;
  border-right: 1px solid #2a2824;
}
.menu-head {
  padding: 22px 22px 16px; border-bottom: 1px solid #2a2824;
}
.menu-brand {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 10px; font-weight: 800; letter-spacing: 0.2em;
  text-transform: uppercase; color: #6ea2dd;
}
.menu-title {
  font-family: "Newsreader","Georgia",serif; font-size: 19px;
  color: #f8f7f4; margin-top: 8px; line-height: 1.2;
}
.menu-tenant {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 10.5px; font-weight: 600; color: #a39d8e; margin-top: 5px;
}
.menu-list {
  flex: 1; overflow-y: auto; padding: 8px 0;
}
.menu-item {
  display: flex; gap: 11px; align-items: flex-start; width: 100%;
  background: transparent; border: 0; cursor: pointer;
  padding: 9px 18px 9px 16px; text-align: left;
  border-left: 3px solid transparent; color: #cdc8bc;
  font-family: inherit;
}
.menu-item:hover { background: #1b1a17; color: #f8f7f4; }
.menu-item[aria-current="true"] {
  background: #1f1e1a; border-left-color: #6ea2dd; color: #f8f7f4;
}
.menu-num {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 10px; font-weight: 800; color: #75706320; color: #888273;
  padding-top: 2px; min-width: 18px;
}
.menu-item[aria-current="true"] .menu-num { color: #6ea2dd; }
.menu-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.menu-label {
  font-size: 12.5px; font-weight: 800; letter-spacing: -0.005em;
}
.menu-sub {
  font-size: 10.5px; line-height: 1.4; color: #8b8678;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.menu-item[aria-current="true"] .menu-sub { color: #b4ae9f; }
.menu-foot {
  padding: 14px 18px; border-top: 1px solid #2a2824;
  display: flex; flex-direction: column; gap: 3px;
}
.menu-foot-verdict {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 10px; font-weight: 800; letter-spacing: 0.08em;
  text-transform: uppercase; color: #d8b65a;
}
.menu-foot-sub { font-size: 10px; color: #8b8678; }

/* --- Right stage --- */
.stage {
  height: 100vh; overflow-y: auto;
  display: flex; flex-direction: column;
  padding: 30px 38px 96px;
}

/* --- Slide — one composed screen. --- */
.slide { display: none; }
.slide.is-active { display: block; }
.slide-inner {
  background: #fbfaf7; border: 1px solid #d8d3c6; border-radius: 8px;
  max-width: 1080px; margin: 0 auto; width: 100%;
  min-height: calc(100vh - 130px);
  padding: 38px 52px 34px;
  display: flex; flex-direction: column;
}

/* Slide chrome — slim header rule. */
.slide-rule {
  display: flex; justify-content: space-between; align-items: baseline;
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.04em;
  text-transform: uppercase; color: #8b8678;
  padding-bottom: 11px; border-bottom: 1px solid #e6e1d5;
}
.slide-rule-l { display: flex; gap: 7px; }
.slide-brand { color: #0b4a91; font-weight: 800; }
.slide-sep { color: #c9c3b3; }
.slide-rule-r { color: #8b8678; }

.slide-eyebrow {
  font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
  text-transform: uppercase; color: #0b4a91; margin: 22px 0 9px;
}
.slide-headline {
  font-size: 30px; line-height: 1.18; max-width: 880px;
  margin-bottom: 6px; color: #070707;
}

.slide-stage {
  flex: 1; padding: 16px 0 6px;
}
.slide-lede {
  font-size: 14.5px; line-height: 1.6; color: #2c2a26;
  max-width: 720px; margin: 4px 0 20px;
}

/* --- Hero exhibit — one dominant exhibit per slide. --- */
.hero { margin: 0 0 6px; }
.hero-caption {
  font-size: 10.5px; font-weight: 800; letter-spacing: 0.05em;
  text-transform: uppercase; color: #070707; margin-bottom: 9px;
}
.hero-frame {
  background: #ffffff; border: 1px solid #e0dbcd; border-radius: 5px;
  padding: 20px 22px;
}
.hero-note {
  font-size: 11.5px; color: #5b5852; line-height: 1.5;
  margin: 9px 2px 0; max-width: 760px;
}

/* --- Quiet footer strip — facts compressed to one thin row. --- */
.slide-foot {
  display: grid; grid-template-columns: 1.6fr 1fr 1fr; gap: 0;
  border-top: 1px solid #e6e1d5; margin-top: 18px; padding-top: 14px;
}
.foot-cell {
  padding: 0 16px 6px 0; border-right: 1px solid #ece7da;
  display: flex; flex-direction: column; gap: 3px;
}
.foot-cell:last-child { border-right: 0; }
.foot-implication { grid-row: span 1; }
.foot-key {
  font-size: 8.5px; font-weight: 800; letter-spacing: 0.07em;
  text-transform: uppercase; color: #8b8678;
}
.foot-val { font-size: 10.5px; line-height: 1.45; color: #2c2a26; }
.foot-implication .foot-val { color: #1c1a17; font-weight: 600; }

/* --- Collapsible detail strip — dense tables one click away. --- */
.slide-detail {
  margin-top: 16px; border: 1px solid #e0dbcd; border-radius: 5px;
  background: #f3f0e9;
}
.slide-detail-summary {
  cursor: pointer; list-style: none;
  display: flex; gap: 9px; align-items: center;
  padding: 11px 15px; font-size: 11px; font-weight: 800;
  letter-spacing: 0.03em; text-transform: uppercase; color: #5b5852;
}
.slide-detail-summary::-webkit-details-marker { display: none; }
.detail-chevron {
  width: 0; height: 0; border-left: 5px solid #8b8678;
  border-top: 4px solid transparent; border-bottom: 4px solid transparent;
  transition: transform 0.12s ease;
}
.slide-detail[open] .detail-chevron { transform: rotate(90deg); }
.slide-detail-summary:hover { color: #0b4a91; }
.slide-detail-body { padding: 4px 16px 16px; }

/* --- Cover slide --- */
.slide-cover .slide-inner { justify-content: center; }
.cover-inner { padding: 56px 60px; }
.cover-brand {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 11px; font-weight: 800; letter-spacing: 0.22em;
  text-transform: uppercase; color: #0b4a91;
}
.cover-eyebrow {
  font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; color: #5b5852; margin-top: 16px;
}
.cover-title {
  font-size: 54px; line-height: 1.04; margin: 10px 0 14px; max-width: 760px;
}
.cover-tenant {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 12px; font-weight: 700; color: #070707;
}
.cover-lede {
  max-width: 620px; margin: 22px 0 30px; font-size: 15px;
  color: #2c2a26; line-height: 1.62;
}
.cover-meta {
  display: flex; gap: 44px; border-top: 1px solid #d8d3c6;
  padding-top: 20px;
}
.cover-meta-label {
  display: block; font-size: 10px; font-weight: 800; letter-spacing: 0.08em;
  text-transform: uppercase; color: #8b8678;
}
.cover-meta-val {
  display: block; font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 16px; font-weight: 800; margin-top: 4px;
}
.cover-hint {
  margin-top: 26px; font-size: 11px; color: #8b8678;
  font-style: italic;
}

/* --- Chips --- */
.chip {
  display: inline-block; font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 9px; font-weight: 800; letter-spacing: 0.03em;
  text-transform: uppercase; padding: 3px 7px; border-radius: 999px;
  border: 1px solid;
}
.chip-good { background: #e2efe2; color: #1B5E20; border-color: #1B5E20; }
.chip-warn { background: #f7ecd6; color: #7A4F01; border-color: #7A4F01; }
.chip-bad { background: #f4ddd6; color: #8B1F0F; border-color: #8B1F0F; }

/* --- Board card --- */
.board-card {
  border-radius: 6px; padding: 20px 24px; margin: 0 0 20px;
  border: 1px solid;
}
.verdict-shape { background: #f7ecd6; border-color: #7A4F01; }
.verdict-fund { background: #e2efe2; border-color: #1B5E20; }
.verdict-kill { background: #f4ddd6; border-color: #8B1F0F; }
.board-card-tag {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.1em;
  text-transform: uppercase; color: #7A4F01; margin-bottom: 7px;
}
.verdict-fund .board-card-tag { color: #1B5E20; }
.verdict-kill .board-card-tag { color: #8B1F0F; }
.board-verdict {
  font-family: "Newsreader","Georgia",serif; font-size: 23px;
  line-height: 1.26; color: #070707;
}
.board-detail { margin: 9px 0 0; font-size: 12.5px; color: #2c2a26; }

/* --- Board-answer split --- */
.answer-split {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  margin: 16px 0 16px;
}
.answer-col {
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 14px 16px;
  background: #fff;
}
.answer-head {
  font-size: 10.5px; font-weight: 800; letter-spacing: 0.05em;
  text-transform: uppercase; margin-bottom: 8px;
}
.answer-col ul { margin: 0; padding-left: 17px; }
.answer-col li { font-size: 11.5px; line-height: 1.5; margin-bottom: 5px; }
.answer-fund { border-left: 3px solid #1B5E20; }
.answer-fund .answer-head { color: #1B5E20; }
.answer-hold { border-left: 3px solid #8B1F0F; }
.answer-hold .answer-head { color: #8B1F0F; }

/* --- Ask + payback lines --- */
.ask-line, .payback-line {
  display: flex; gap: 12px; align-items: flex-start;
  padding: 12px 16px; border-radius: 5px; font-size: 12.5px;
  line-height: 1.5; margin: 0 0 16px;
}
.ask-line { background: #e8f0fa; color: #2c2a26; }
.payback-line { background: #f7ecd6; color: #2c2a26; }
.ask-line-tag, .payback-line-tag {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.07em;
  text-transform: uppercase; white-space: nowrap; padding-top: 2px;
}
.ask-line-tag { color: #0b4a91; }
.payback-line-tag { color: #7A4F01; }

/* --- Context diagram --- */
.context-diagram { display: flex; flex-direction: column; gap: 9px; }
.context-band {
  display: grid; grid-template-columns: 128px 1fr; gap: 12px;
  align-items: center;
}
.context-band-label {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em;
  text-transform: uppercase; color: #8b8678; text-align: right;
}
.context-nodes { display: flex; gap: 8px; flex-wrap: wrap; }
.context-node {
  flex: 1; min-width: 160px; background: #fff;
  border: 1px solid #cfc9b9; border-radius: 4px; padding: 9px 11px;
}
.context-node-gap { background: #f7ecd6; border-color: #7A4F01; }
.context-node-title { font-size: 12px; font-weight: 800; }
.context-node-detail {
  font-size: 10.5px; color: #5b5852; margin-top: 3px; line-height: 1.42;
}
.gap-flag {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 8px; font-weight: 800; color: #7A4F01;
  background: #fff; border: 1px solid #7A4F01; border-radius: 999px;
  padding: 1px 5px; text-transform: uppercase;
}

/* --- Scope triplet --- */
.scope-triplet {
  display: grid; grid-template-columns: repeat(3,1fr); gap: 14px;
  margin: 16px 0 4px;
}
.scope-col {
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 13px 15px;
  background: #fff;
}
.scope-head {
  font-size: 10.5px; font-weight: 800; letter-spacing: 0.05em;
  text-transform: uppercase; margin-bottom: 8px;
}
.scope-col ul { margin: 0; padding-left: 16px; }
.scope-col li { font-size: 11px; line-height: 1.5; margin-bottom: 6px; }
.scope-in { border-left: 3px solid #1B5E20; }
.scope-in .scope-head { color: #1B5E20; }
.scope-out { border-left: 3px solid #8B1F0F; }
.scope-out .scope-head { color: #8B1F0F; }
.scope-retain { border-left: 3px solid #0b4a91; }
.scope-retain .scope-head { color: #0b4a91; }

/* --- Tables --- */
.data-table {
  width: 100%; border-collapse: collapse; margin: 10px 0 14px;
  background: #fff; border: 1px solid #e0dbcd; font-size: 11.5px;
}
.data-table th {
  text-align: left; background: #070707; color: #fbfaf7;
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 9px; font-weight: 700; letter-spacing: 0.05em;
  text-transform: uppercase; padding: 9px 11px;
}
.data-table td {
  padding: 8px 11px; border-top: 1px solid #ece7da;
  vertical-align: top; line-height: 1.45;
}
.data-table tbody tr:nth-child(even) { background: #f7f5ef; }
.data-table .num {
  text-align: right; white-space: nowrap;
  font-family: "JetBrains Mono",ui-monospace,monospace;
}
.data-table th.num { text-align: right; }
.data-table tfoot td {
  background: #ece7da; font-weight: 800; border-top: 2px solid #070707;
}
.data-table-ledger td:nth-child(2) { width: 36%; }
.row-proxy { background: #fdf6e8 !important; }
.blocked-cell { color: #8B1F0F; font-weight: 800; }

/* --- Assumption cards --- */
.assume-cards { display: flex; flex-direction: column; gap: 10px; }
.assume-card {
  display: grid; grid-template-columns: 52px 1fr; gap: 14px;
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 14px 16px;
  background: #fff; border-left: 3px solid #0b4a91;
}
.assume-proxy { border-left-color: #7A4F01; background: #fdf6e8; }
.assume-rank {
  font-family: "Newsreader","Georgia",serif; font-size: 26px;
  color: #0b4a91; font-weight: 500;
}
.assume-proxy .assume-rank { color: #7A4F01; }
.assume-statement { font-size: 13px; font-weight: 600; color: #1c1a17;
  line-height: 1.45; }
.assume-meta {
  display: flex; gap: 7px; align-items: center; flex-wrap: wrap;
  margin-top: 7px; font-size: 11px; color: #5b5852;
}
.assume-dot { color: #c9c3b3; }

/* --- Coverage tiles --- */
.coverage-tiles {
  display: grid; grid-template-columns: repeat(3,1fr); gap: 12px;
}
.coverage-tile {
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 22px 20px;
  background: #fff; border-top: 3px solid #5b5852;
}
.coverage-good { border-top-color: #1B5E20; }
.coverage-gap { border-top-color: #8B1F0F; }
.coverage-neutral { border-top-color: #0b4a91; }
.coverage-num {
  font-family: "Newsreader","Georgia",serif; font-size: 44px;
  line-height: 1; color: #070707;
}
.coverage-good .coverage-num { color: #1B5E20; }
.coverage-gap .coverage-num { color: #8B1F0F; }
.coverage-neutral .coverage-num { color: #0b4a91; }
.coverage-label {
  font-size: 11.5px; font-weight: 800; letter-spacing: 0.03em;
  text-transform: uppercase; margin-top: 10px;
}
.coverage-sub { font-size: 10.5px; color: #5b5852; margin-top: 3px; }

/* --- Checklist --- */
.checklist { display: flex; flex-direction: column; gap: 8px; }
.check-row {
  display: grid; grid-template-columns: 120px 1fr; gap: 16px;
  border: 1px solid #e0dbcd; border-radius: 5px; padding: 12px 15px;
  background: #fff; align-items: start;
}
.check-approve { border-left: 3px solid #1B5E20; }
.check-hold { border-left: 3px solid #8B1F0F; }
.check-condition { border-left: 3px solid #7A4F01; }
.check-label { font-weight: 800; font-size: 12.5px; }
.check-detail {
  font-size: 11px; color: #5b5852; margin-top: 3px; line-height: 1.5;
}

/* --- Mini split (detail strip prose) --- */
.mini-split {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  margin: 12px 0 4px;
}
.mini-key {
  font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em;
  text-transform: uppercase; color: #0b4a91;
}
.mini-key-block { display: block; margin: 14px 0 2px; }
.mini-key-block:first-child { margin-top: 4px; }
.mini-key-gap { color: #8B1F0F; }
.mini-split p { margin: 5px 0 0; font-size: 11.5px; color: #2c2a26;
  line-height: 1.55; }
.mini-list { margin: 6px 0 0; padding-left: 16px; }
.mini-list li { font-size: 11px; line-height: 1.5; margin-bottom: 4px; }

/* --- Deck controls --- */
.deck-controls {
  position: fixed; bottom: 22px; right: 30px; z-index: 20;
  display: flex; gap: 8px; align-items: center;
  background: #fbfaf7; border: 1px solid #d8d3c6; border-radius: 999px;
  padding: 6px 8px; box-shadow: 0 6px 22px rgba(7,7,7,0.16);
}
.deck-btn {
  background: #11100e; color: #f8f7f4; border: 0; cursor: pointer;
  font-family: inherit; font-size: 11px; font-weight: 700;
  padding: 7px 13px; border-radius: 999px;
}
.deck-btn:hover { background: #2a2824; }
.deck-counter {
  font-family: "JetBrains Mono",ui-monospace,monospace;
  font-size: 11px; font-weight: 800; color: #5b5852; padding: 0 4px;
}

/* --- Narrow screens — menu collapses to the top. --- */
@media (max-width: 880px) {
  .deck { grid-template-columns: 1fr; height: auto; }
  .menu { height: auto; position: static; }
  .menu-list { max-height: 220px; }
  .stage { height: auto; padding: 20px; }
  .slide-inner { min-height: 0; padding: 26px 22px; }
  .slide-foot, .answer-split, .scope-triplet, .coverage-tiles,
  .mini-split, .context-band, .check-row, .assume-card {
    grid-template-columns: 1fr;
  }
  .slide-headline { font-size: 24px; }
  .cover-title { font-size: 38px; }
}

/* === Print / PDF — expand EVERY slide, stacked, one page each. === */
@media print {
  @page { size: A4 landscape; margin: 12mm; }
  body { background: #fff; }
  .deck { display: block; height: auto; }
  .menu, .deck-controls { display: none !important; }
  .stage { display: block; height: auto; overflow: visible; padding: 0; }
  .slide {
    display: block !important; page-break-after: always;
    break-after: page;
  }
  .slide:last-child { page-break-after: auto; break-after: auto; }
  .slide[hidden] { display: block !important; }
  .slide-inner {
    min-height: 0; border-radius: 0; border: 0;
    box-shadow: none; padding: 8mm 4mm; max-width: 100%;
  }
  /* Print shows the full document — detail strips expanded. */
  .slide-detail { background: #fff; border-color: #d8d3c6; }
  .slide-detail-body { display: block !important; }
  .slide-detail summary { color: #070707; }
  .detail-chevron { display: none; }
  .hero-frame, .data-table, .board-card, .answer-col, .scope-col,
  .context-node, .assume-card, .coverage-tile, .check-row {
    page-break-inside: avoid;
  }
}
`;
}

// ===========================================================================
// The full document — the shell assembles the menu, the stage, the inline
// script and the controls into one self-contained HTML string.
// ===========================================================================

/**
 * Compose a complete board-grade deck as one self-contained HTML document.
 * `slides` is the ordered slide list — slide 1 must be the cover. All CSS is
 * inlined, the slide-switch script is inline (no external src), and there are
 * no remote fonts or images: the file opens offline and prints as the full
 * document.
 */
export function renderDeckDocument(
  meta: DeckMeta,
  slides: DeckSlide[],
): string {
  const slideCount = slides.length;
  const stage = slides
    .map((s, i) => s.render(i + 1, slideCount))
    .join('');

  return (
    `<!doctype html><html lang="en"><head>` +
    `<meta charset="utf-8"/>` +
    `<meta name="viewport" content="width=device-width, initial-scale=1"/>` +
    `<title>${escapeHtml(meta.documentTitle)}</title>` +
    `<style>${deckStyles()}</style>` +
    `</head><body>` +
    `<div class="deck">` +
    renderMenuRail(meta, slides) +
    `<main class="stage" id="stage">${stage}</main>` +
    `</div>` +
    deckControls(slideCount) +
    `<script>${deckScript(slideCount)}</script>` +
    `</body></html>`
  );
}
