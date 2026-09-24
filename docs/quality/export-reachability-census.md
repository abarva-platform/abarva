# Export-reachability census — components that hold code nothing can reach

**Item U-504. Measured on `origin/main` `c9adfff40`, 2026-09-24, by execution.**

Reproduce:

```bash
node scripts/quality/export-reachability.mjs            # the census
node scripts/quality/export-reachability.mjs --check     # census vs. baseline
node scripts/quality/export-reachability.mjs --file <p>  # one file
```

## What was measured, and why the number was asked for

A component can lose its mount site and keep compiling, keep linting, and keep
reading as live product code to the next person who opens it. `no-unused-vars`
is satisfied the moment one dead declaration references another — which is
exactly why a **closure of ten declarations and 567 lines** survived a fortnight
in `WorkspaceExecutiveShell.tsx`, with thirteen assertions about it green, until
item U-503 removed it.

U-503 also replaced those assertions with a reachability walk: it reads a
module's own reference graph out from its exports and reports what the walk
never arrives at. **It read exactly one file.** U-504 asked the only question
that decides what to do about that: how often does this happen elsewhere? The
rate was unknown, and "the one file anybody has checked held roughly 600 lines
of it" is not a rate.

## The answer

| | |
|---|---|
| component files scanned (`src/app`, `src/components`) | **1611** |
| files with at least one unreachable top-level declaration | **6** |
| unreachable top-level declarations | **7** |
| of those that are renderers, closures, or anything a user could have seen | **0** |

Every one of the seven is a single unused colour or font constant:

| file | unreachable | what it is |
|---|---|---|
| `src/components/source/SourceCommercialSummarySurface.tsx` | `DARK`, `TEXT` | colour constants |
| `src/app/(maestro)/platform/page.tsx` | `PANEL_SOFT` | colour constant |
| `src/app/demo/explore/page.tsx` | `MUTED` | colour constant |
| `src/app/investors/page.tsx` | `PAGE_SKY` | colour constant |
| `src/components/ModuleHeader.tsx` | `SANS` | font-family constant |
| `src/components/source/SourcePricingComparisonPanel.tsx` | `DARK` | colour constant |

Each was verified by counting occurrences of the name in its own file: the
declaration is the **only** occurrence, so nothing in the module refers to it.

**Nothing is deleted by this census, and nothing here schedules a deletion.**
U-504 excludes that deliberately: a deletion justified only by a bulk report is
how a live surface gets removed, so each removal is its own bounded item with
its own unreachability proof.

## The first census was wrong, and that is the useful finding

Run with U-503's walk ported over unchanged, the census reported **22**
declarations. **Fifteen of the 22 were false positives from one mechanism**, and
every one of them named a declaration referenced a few lines below its own
declaration.

The mechanism is a comment-stripper with no model of JSX text:

```tsx
<Code>src/lib/reasoning/*</Code>
```

The `/*` in that glob opens a block comment. Everything to the next `*/` is
blanked — the whole remainder of the component body, and so every reference the
page makes to its own tables, rows and styles. `docs/reasoning/page.tsx` (8
reported) and `docs/reasoning/api/page.tsx` (7 reported) fail exactly that way,
and no other mechanism accounts for any of the remaining seven.

This is the outcome U-504 named in advance: *"a control that flags a live route
file is a control someone will disable."* On its first run over the corpus,
two thirds of what the control said would have been wrong, and the first
reviewer to check one finding would have stopped trusting the rest.

Three further errors came out of the same measurement, and two point the other
way — the line scan was **blind** as well as noisy:

- a top-level statement outside every declaration (a registration call, a side
  effect) was in no span, so what it referenced looked dead;
- an identifier inside a **string** was an edge, so `return "Orphan"` kept a
  dead component alive — under-reporting, silently;
- a declaration the line regex did not shape-match was absent from the graph
  entirely, and its references with it.

None of these is reachable by a better regex; each is a question about syntax.
The walk now asks the TypeScript parser, which is already a dependency. Cost of
asking, measured: **0.7s** for the full census against the line scan's 0.3s.

The true positive is unchanged. Run against the content of
`WorkspaceExecutiveShell.tsx` at `c26e0c219` — the parent of U-503's merge, so
real code and not a fixture — the walk returns **exactly the ten declarations
U-503 deleted, and no others**:

```
ContractGraphPage  GRAPH_SUBTABS  GraphMappingFlow  GraphSpineTable
GraphVolumeBars  GraphVolumeTable  graphSubtabTitle  plainAdapterLabel
plainCanonicalLabel  plainSubstrateLabel
```

## What the number decided

U-504 left the choice to the measurement: *"that number decides whether this is
a control worth a required job or a one-off cleanup."*

**Both, and in this order.** The census found no second dead renderer, so there
is no cleanup backlog worth a programme — seven unused constants is not the
defect U-503 repaired. But the defect U-503 repaired cost a fortnight and 567
lines, the walk that detects it costs 0.7s, and the corpus is 1611 files that
nobody is going to re-check by hand. A control this cheap against a defect this
quiet is worth wiring.

So:

1. **One repo-owned module**, `scripts/quality/export-reachability.mjs`. The
   walk was *moved* there, not copied — a rule applied by hand in the places
   someone happened to think of is the shape item T-723 was filed against.
   `WorkspaceExecutiveShell.performance.test.ts` now imports it, and its
   assertion is unchanged and still fires: adding a two-declaration dead closure
   to that component fails the suite naming exactly those two.
2. **A baseline, not a threshold.** `export-reachability-baseline.json` names
   the seven by file and declaration. A count-based gate ("no more than 7")
   would pass a brand-new dead renderer the moment somebody deleted an unused
   colour constant.
3. **The baseline fails in both directions.** A recorded finding that is no
   longer unreachable also fails, because an exemption nobody is forced to
   retire outlives its defect and then hides the next one. Cleaning something up
   means deleting its line in the same change.
4. **The job runs on the corpus, not on itself.** `export-reachability.yml`
   triggers on `src/app/**` and `src/components/**`. A path filter naming only
   the script would have produced a gate that could never see the defect it
   exists for.

Whether this job becomes a *required* check is a repository-ruleset setting and
is not changed by the PR that added it.

## What this control does not claim

It never asks who imports a file. That is what makes it safe to run over route
modules: a Next.js `page`/`layout`/`route` is reached by the router rather than
by any importer, and a component exported solely for a test has no production
importer. Under an inter-module walk both are false positives. Here an export is
a **root**, so neither is reportable, whatever reaches the file from outside. A
re-export barrel declares nothing of its own and reports nothing.

Where an answer is genuinely ambiguous — a local binding shadowing a
module-level name — the walk errs toward calling the module-level name
*reachable*. That hides dead code rather than inventing it, which is the correct
direction for a control someone can switch off.

Test and fixture directories are excluded by construction: a suite's top-level
helpers are reached by the runner calling `describe`/`it`, not by an export, so
every one of them would report as unreachable.
