# Current Answer-Path Callgraph (Part 1)

_Ordered call paths from request to rendered answer, per surface. file:line is ground truth._

## Intelligence (`/api/intelligence/ask`)
```
POST /api/intelligence/ask/route.ts  (handleAsk, L42)
├─ shouldUseEnterpriseSemanticLayer(query)            route.ts:140   ── gate ──
│   └─ [SEMANTIC/VOLUMETRIC PATH]
│       answerEnterpriseSemanticQuestionFromAzure()   semantic-answer-runtime.ts:329
│         ├─ query tenant_data_volumetrics            semantic-answer-runtime.ts:342
│         ├─ query tenant_dimension_coverage          semantic-answer-runtime.ts:348
│         ├─ query tenant_question_readiness          semantic-answer-runtime.ts:357
│         └─ buildDirectAnswer()  ← ROW-COUNT LEAD    semantic-answer-runtime.ts:235
└─ [SENTINEL SYNTHESIS PATH — default]
    askIntelligence() (async generator)               lib/intelligence/ask/index.ts:103
      ├─ retrieveTenantStructuredFacts()              lib/knowledge/tenant-enterprise-context.ts:381
      │     → public.applications / initiatives / vendors
      ├─ getDerivedEnterpriseReadForTenant()  ← SNAPSHOT  lib/enterprise-context/derived-enterprise-read.ts:137
      │     → datasets/{tenant}/derived-intelligence/enterprise-reads.json
      ├─ retrieveWorldview()  ← CHUNK RAG             lib/intelligence/ask/index.ts:136
      ├─ assertCoverage()                             lib/intelligence/ask/index.ts:158
      └─ synthesizeStream()  ← LLM lead               lib/intelligence/ask/synthesizer.ts:273
            └─ client.messages.create(...)            synthesizer.ts:344
```

## Home (no dedicated endpoint)
```
src/components/home/HomeIndexPage.tsx
├─ HOME_VIEW (static fixture)                         src/lib/home/shell-home-fixture.ts:1
└─ AgentCanvas (Atlas chat)                           HomeIndexPage.tsx:957
      → /api/v1/atlas/ask   (portfolio-scoped, not Home-specific)
[Live React Home ask path observed in product → /api/intelligence/ask shared engine]
```

## Source (`buildSourceAnswerEngine`)
```
src/lib/source/source-answer-engine.ts (L120)
├─ rankAnswerEvidence()                               L127
├─ answerHardSourceQuestion()                         L129
├─ toCurrentStateFindings() / selectByMode()          L411 / L422
└─ formatAnswerText()  ← semantic lead, recordId leak L458 (leak L470)
[newer] src/lib/semantic2/build-answer-packet.ts  ← "I found N rows" L46, schema leak L54
```

## Moves (expert kernel)
```
src/lib/programs/expert-kernel/living-move.ts          (kernel recompute)
└─ business-case-compiler.ts (L97)
     ├─ runCritic()                                    L28
     └─ recommendationRationale                        L82/L164
   → expert-kernel/exports/* (Word/PDF/HTML docgen)
```

## Tower (Atlas grounding + views)
```
src/lib/atlas/tower-grounding.ts
├─ formatTowerCurrentStateForPrompt()  ← "Substrate counts:" L291
├─ initiative displayId/stage/statusFlag  ← leak       L315
src/lib/tower/band-metrics-view.ts        (metric tiles, semantic value lead) L112
src/lib/tower/metric-explanation-view.ts  ← renewal COUNT lead                 L370
src/lib/tower/pressure-cards-view.ts      ← pressure COUNT lead                L352
src/lib/atlas/composition/compose.ts      ← view.code in user prose            L47/72
src/lib/atlas/llm.ts                       ← "Tower is grounded on N initiatives" L102
```

## Shared seams (today: none)
No shared composer, contract, or quality gate spans these paths. Each surface owns its prose, its gap language, and its citation labels — the divergence the rebuild removes.
