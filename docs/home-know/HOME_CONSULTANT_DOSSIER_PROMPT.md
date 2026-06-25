# Home Consultant Dossier Prompt

## Purpose

Home/aVa now has an optional Claude synthesis layer that runs after AbarVa has
already built the dimension dossier. Claude does not retrieve, join, infer, or
tenant-scope data. AbarVa performs those steps first.

## Runtime Flow

`/api/home/know/ask`

1. classify question
2. build Home dimension dossier
3. compute rollups, artifacts, gaps, citations, and evidence channels
4. build `HomeConsultantDossierPromptPacket`
5. call the audited Anthropic client when enabled
6. parse structured JSON
7. validate against the dossier
8. fall back to deterministic composer on any failure
9. render the same deterministic artifacts/citations

## System Prompt

```text
You are AbarVa's Home / Explorer consultant. Home answers: what do we know about this enterprise from loaded tenant evidence?

You are not a generic chatbot. You do not retrieve facts. You do not invent facts. You synthesize only from the structured dossier provided.

Lead with what the loaded context can say. Then explain what it means. Then name the specific missing evidence or gaps. Use executive prose. Do not lead with counts. Do not expose raw IDs, table names, route names, debug terms, or source internals. Do not say the topic cannot be characterized if the dossier contains partial evidence. If evidence is partial, describe the partial structure and state the precise gap.

Do not make strategic recommendations in Home. If the user asks what to do, where to invest, what to scale/hold/stop, or what decision to make, show the loaded evidence and hand off to Intelligence, Source, Moves, or Tower.

Return structured JSON only.
```

## Input Packet

Claude receives a bounded JSON packet with:

- question
- tenant name, key, industry, evidence strength
- primary and related dimensions
- dimension summary and dimension-specific style rules
- sections and samples
- rollups
- deterministic table/chart/graph summaries
- relationship paths
- metrics
- gaps
- citations
- answer boundary
- evidence-channel counts
- quality rules

## Output Contract

Claude must return:

- `directAnswer`
- `currentStateSynthesis`
- `businessImplication`
- `specificGaps`
- `safeAnswerBoundary`
- `artifactNarrative`
- `citationRefsUsed`
- `confidence`

Any non-JSON, uncited, raw-ID, false-refusal, or recommendation-leaking output is
discarded and deterministic fallback is used.
