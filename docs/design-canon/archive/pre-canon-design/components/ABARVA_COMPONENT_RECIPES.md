# AbarVa Component Recipes

Status: Canonical (DES1 + DES2)
Authored: 2026-04-25

These recipes describe how each AbarVa primitive is meant to be
composed on real surfaces. They are **specs**, not implementations
— the implementations live in
[`src/components/abarva/`](../../../src/components/abarva/).

Every primitive imports tokens from
[`src/lib/design/abarva-theme.ts`](../../../src/lib/design/abarva-theme.ts).
No primitive imports from Sentinel / Atlas / Nexus / Agent runtime,
Source UI, mock.ts, auth, or supabase.

---

## AbarvaWordmark + AbarvaTopNav

`AbarvaWordmark`

- Inline-flex container, no gap, baseline-aligned.
- "Abar" near-black 700; "Va" navy 700, 1.05–1.10× larger.
- Sizes: `sm` (16), `md` (20), `lg` (28).
- No SVG, no glyph substitution.

`AbarvaTopNav`

- Height 54 (range 52–56).
- Background `surface`. Bottom border 1px hairline.
- Wordmark left → `ABARVA_TOP_NAV_SURFACES` rendered as plain links.
- Surfaces in canonical order: programs, tower, intelligence,
  source, admin.
- Active link = NAVY text + 2px NAVY underline.
- No client switcher, no avatar, no dropdown.

```tsx
<AbarvaTopNav active="programs" />
```

---

## AgentBadge

- Mono uppercase pill, `agent · status` glyph.
- Foreground = canonical agent accent (Nexus NAVY, Sentinel AMBER,
  Atlas NAVY, Steward MUTED).
- Background = `navySoft` for calm reading.
- 1px `borderSoft` outline, pill radius.

```tsx
<AgentBadge agent="sentinel" status="brief" />
```

---

## AgentBriefPanel

Shared shell across all four briefs (Programs / Intelligence /
Tower / Admin).

Variants:

- `light` — default. Card surface, hairline border, accent top
  border.
- `dark` — reserved for the Atlas Brief hero. `navyDark` panel,
  white-tinted text.

Slots:

- `eyebrow` (required, mono uppercase)
- `title` (required, sentence case)
- `chips` (optional, top row)
- `briefLines` (1–4 short paragraphs)
- `recommendedAction` (single executable verb in a callout)
- `followUps` (3 disabled chips with `deferred · live <agent>
  runtime` sub-label)
- `footerCaption` (optional, mono provenance line)

```tsx
<AgentBriefPanel
  agent="atlas"
  variant="dark"
  eyebrow="ATLAS BRIEF · Q2 2026"
  title="One pressure point dominates the portfolio this week."
  briefLines={[
    'PRG-02 G2 has been open 4 weeks.',
    'Steward review pending on contract evidence.',
  ]}
  recommendedAction="Drive G2 close on PRG-02 today."
  followUps={[
    'Why is PRG-02 stuck?',
    'What evidence is missing?',
    'Show similar past stalls.',
  ]}
  footerCaption="S9G deterministic seed · v0.4"
/>
```

---

## MetricStrip

- Calm row of stat chips. Hard cap **5** metrics.
- Each metric: `label` (mono eyebrow), `value` (large, weight 600),
  optional `caption` (small muted).
- Tones: `default` (ink), `navy`, `amber`, `red`. Tone applies only
  to the value color.
- 1px hairline-soft right border between metrics.

```tsx
<MetricStrip
  items={[
    { key: 'p',  label: 'programs',     value: 7, tone: 'navy' },
    { key: 'g',  label: 'gates open',   value: 3 },
    { key: 'b',  label: 'blocked',      value: 1, tone: 'red' },
  ]}
/>
```

---

## PressureCard

- Atlas pressure-card primitive.
- Severity tone applied to top border via `statusAccent`.
- Eyebrow: `<severity> pressure · <programCode>`.
- Body: title, summary, missing-inputs preview (top 3 + overflow),
  recommended action, "Open program →" NAVY link.

```tsx
<PressureCard
  programCode="PRG-02"
  severity="critical"
  title="G2 stalled · contract evidence missing"
  summary="Open 4 weeks. Steward review pending."
  missingInputs={['Vendor MSA', 'Architecture sign-off']}
  recommendedAction="Drive G2 close — see Steward."
  programHref="/tenant/apex/programs/prg-02"
/>
```

---

## PatternCard

- Sentinel pattern primitive.
- Two MiniChips at the top (severity + confidence).
- Title, summary, why-it-matters italic.
- 2-cell stat grid (e.g. `programs affected`, `evidence rows`).
- Affected programs: top 4 NAVY pill chips with hrefs + overflow.
- Optional collapsible `<details>` for missing inputs.
- Recommended action with mono `next` AMBER eyebrow.
- Optional handoff chips (`handoff · steward`).
- "Open pattern detail →" NAVY link.

```tsx
<PatternCard
  patternId="PT-12"
  title="Exec sponsor erosion"
  severity="critical"
  confidence={87}
  summary="Sponsor attendance dropped >50% in three programs."
  whyItMatters="Patterns of sponsor erosion correlate with G3 stalls."
  stats={[
    { label: 'programs', value: 3 },
    { label: 'evidence rows', value: 12 },
  ]}
  affectedPrograms={[
    { code: 'PRG-02', href: '/tenant/apex/programs/prg-02' },
    { code: 'PRG-04', href: '/tenant/apex/programs/prg-04' },
  ]}
  missingInputs={['Sponsor calendar feed']}
  recommendedAction="Re-open weekly sponsor sync on PRG-02."
  handoffs={['steward', 'nexus']}
  patternHref="/tenant/apex/intelligence/patterns/pt-12"
/>
```

---

## JourneyRail

- 6 phases (origination → verify) with G1–G4 caps between phases
  1↔2 / 2↔3 / 3↔4 / 4↔5.
- Phase states: `past` (NAVY soft), `active` (NAVY filled), `future`
  (muted surface).
- Gate states: `signed` (NAVY ✓), `missing_inputs` (AMBER !),
  `not_wired` (MUTED ·).
- Honest end — there is no fake G5 cap after Verify.

```tsx
<JourneyRail
  phases={[
    { key: 'origination', label: 'Origination', state: 'past' },
    { key: 'plan',        label: 'Plan',        state: 'past' },
    { key: 'build',       label: 'Build',       state: 'active' },
    { key: 'pilot',       label: 'Pilot',       state: 'future' },
    { key: 'execute',     label: 'Execute',     state: 'future' },
    { key: 'verify',      label: 'Verify',      state: 'future' },
  ]}
  gates={[
    { key: 'G1', state: 'signed' },
    { key: 'G2', state: 'signed' },
    { key: 'G3', state: 'missing_inputs' },
    { key: 'G4', state: 'not_wired' },
  ]}
/>
```

---

## FileTypeChip

- Text-only mono chip for `DOC | PDF | XLS | PPT | NOTE | HTML | DATA`.
- NAVY-tinted background, NAVY text, 4px radius.
- Optional caption (filename) rendered alongside.

```tsx
<FileTypeChip type="PDF" caption="vendor-msa.pdf" />
```

---

## EvidenceChip

- State chip for the AbarVa evidence lifecycle.
- NAVY for `cited` / `quality_checked` / `usable_as_evidence`.
- AMBER for `partial`.
- RED for `blocked`.
- MUTED for `not_seeded`.

```tsx
<EvidenceChip state="usable_as_evidence" />
```

---

## DetailDrawerShell

- Right-side overlay drawer.
- Width 360–480 (clamped).
- Header: eyebrow + title + plain-text "Close ✕".
- Body: caller-provided.
- Optional source-label footer (mono uppercase).

```tsx
<DetailDrawerShell
  eyebrow="ATLAS RESPONSE"
  title="Why is PRG-02 stuck?"
  closeHref="?atlas=closed"
  sourceCaption="S9G deterministic seed · v0.4"
>
  <p>...</p>
</DetailDrawerShell>
```

---

## EmptyInspector

- Dashed border placeholder.
- Caption (required) names *why* the inspector is empty.
- Optional `routeHint` renders a NAVY link to the seeding surface.
- Optional title rendered as a mono eyebrow.

```tsx
<EmptyInspector
  title="Object inspector"
  caption="Select a row to inspect. The inspector pulls deterministic ADM3 fields."
  routeHint={{ label: 'Open ADM3 inventory', href: '/platform/admin/datasets' }}
/>
```

---

## Composition contract

A canon-compliant page assembles primitives in this order:

1. `AbarvaTopNav` (sticky, 54px tall).
2. `AgentBriefPanel` for the surface's owning agent.
3. ≤ 5 metric / scorecard chips (`MetricStrip`).
4. The page-specific calm grid:
   - Programs → portfolio table → `JourneyRail` per program canvas.
   - Intelligence → `PatternCard` strip → DIC canvas.
   - Tower → ≤ 5 scorecards → ≤ 3 `PressureCard`.
   - Admin → 5 zones (A–E).
5. Drilldowns via `DetailDrawerShell`.
6. Empty regions render `EmptyInspector` honestly.
