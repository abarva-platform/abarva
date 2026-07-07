# Home KNOW Usable Dossier Evidence Standard

## Rule

Home/aVa must not decide whether an answer is grounded from `factsBound` alone.
A dossier has usable evidence when at least one supported evidence channel is
populated and the visible answer remains tenant-safe, cited or source-backed,
and non-fabricated.

## Supported Evidence Channels

| Channel | Counts as usable when |
|---|---|
| Facts | `facts.length > 0` |
| Tables | at least one table has rows |
| Charts | at least one chart has data |
| Graphs | at least one graph has nodes and edges |
| Citations | citation/source refs are present |
| Source coverage | loaded source families have positive counts |
| Sections | dossier sections have records, samples, or source keys |
| Rollups | deterministic rollup values are populated |
| Relationship paths | sourced relationship paths are populated |
| Metrics | metric rollups are populated |
| Gaps | specific sourced gaps are present |

## Shared Helper

`src/lib/home/know/has-usable-dossier-evidence.ts` is the single standard for
Home/aVa dossier evidence checks.

It returns:

```ts
{
  usable: boolean;
  evidenceChannels: {
    facts: number;
    tables: number;
    charts: number;
    graphs: number;
    citations: number;
    sourceCoverage: number;
    sections: number;
    rollups: number;
    relationshipPaths: number;
    metrics: number;
    gaps: number;
  };
  reason: string;
}
```

## Important Consequence

`factsBound = 0` does not mean no evidence. Vendor, application, gap, and graph
questions can be fully grounded by tables, charts, graphs, citations, source
coverage, rollups, and relationship paths.
