# Intelligence Surface Audit · 2026-05-06

| Field | Value |
|---|---|
| **Doc path** | `docs/build/INTELLIGENCE_AUDIT_2026-05-06.md` |
| **Date** | 2026-05-06 |
| **Author** | Architecture |
| **Status** | Complete — findings actionable |
| **Surface** | Intelligence (`/intelligence`) |
| **Front agent** | Sentinel |
| **Design principles applied** | 3-layer agent architecture · workflow-first nav · specialist catalog |

---

## Executive summary

Intelligence is a deliberately deterministic surface in Wave 1. All view models, pattern detection, canvas modes, and signal delivery are pure functions with no model invocation — labeled explicitly in every file. The J0–J5 query spine is implemented at the route level. Sentinel is correctly named as the front agent throughout.

Three issues require attention:

1. **No INTELLIGENCE_LEAD_AGENT constant** — same structural gap as `SOURCE_LEAD_AGENT` before the Source fix. Agent identity for Intelligence is embedded in the universal chat route's surface-detection logic, not in a dedicated constants file.
2. **Sentinel voice doctrine is behind a feature flag** — `SENTINEL_VOICE_DOCTRINE_DRAFT` is default-on in dev/staging and default-off in production. The richer voice specification (sample exchanges, banned phrases, structural requirement) never reaches production users. This is a founder sign-off gate, not a code bug.
3. **Sentinel specialists are all planned** — QueryIntentClassifier, EvidenceCitationBuilder, ContradictionDetector, and GapMapper are documented in the catalog but not wired. INT-7 (live vector retrieval) is gated on the Codex data layer. This is consistent with the Wave 1 / Wave 2 plan, but the gap is widening as J0–J5 content fills up without live Sentinel reasoning behind it.

No Codex collision found: `gh pr list --search "INT-* OR context-broker OR retrieval OR corpus"` returned no active PRs as of 2026-05-06.

---

## M1 · Current state inventory

### Front agent
**Sentinel** — correctly named in the universal agent route.

| File | Agent reference | Status |
|---|---|---|
| `src/app/api/chat/agent/route.ts` | `AGENT_VOICE['Sentinel']` — fires when `agentName === 'Sentinel'` | ✓ Correct |
| `src/lib/agent/voice-doctrine/sentinel.ts` | `composeSentinelSystemPrompt` | ✓ Correct |
| `src/lib/intelligence/sentinel-pattern-detections.ts` | 5 canonical Sentinel pattern keys | ✓ Correct |
| `src/lib/intelligence/seed-patterns-meta.ts` | Four-agent model as meta-pattern `PAT-META-M3` | ✓ Correct |

**No Intelligence-specific API route** — Intelligence routes through the universal `/api/chat/agent` endpoint with `agentName: 'Sentinel'` and `surface: '/intelligence'`.

### J-spine implementation

| Level | Route | Implementation | Model invocation |
|---|---|---|---|
| J0 | `/intelligence` | `J0_FAILURE_MODE_CARDS` (10 cards) | None — deterministic |
| J1 | `/intelligence/topics` | `J1_TOPICS` (10 thesis topics) | None — deterministic |
| J2 | `/intelligence/patterns/[patternKey]` | `IntelligencePatternDetailView` | None — deterministic |
| J3 | `/intelligence/signals/[signalId]` | `IntelligenceSignalDetailView` | None — deterministic |
| J4 | `/intelligence/solutions/[solutionId]` | `IntelligenceSolutionDetailView` | None — deterministic |
| J5 | `/intelligence/ask`, `/intelligence/synthesize` | Routes defined, agent wiring pending | Partial |

### Navigation
12-tab lens system defined in `intelligence-lens-tabs-view.ts`:

| Tab | Purpose | Wired |
|---|---|---|
| Summary | Sentinel summary, active patterns, decision framing | Fixture |
| Evidence | Evidence manifest (confirmed/missing/deferred) | Stub |
| Programs | Affected program map | Fixture |
| Actions | Priority-ordered Sentinel follow-through actions | Stub |
| Signals | Raw Sentinel signals | Active |
| Pattern Plan | Client-specific applied pattern plan | Fixture |
| Gap Queue | Evidence gap close-out queue | Planned |
| Contradictions | Per-pattern contradiction monitor | Stub |
| Programme Risk | Cross-program risk signals | Fixture |
| Gate Readiness | Per-programme gate checklist | Fixture |
| Scorecard | Engagement intelligence scorecard | Fixture |
| Milestones | Per-programme milestone schedule | Fixture |

### Specialist status

| Specialist | Status | Location |
|---|---|---|
| QueryIntentClassifier | planned | — |
| EvidenceCitationBuilder | planned | — |
| ContradictionDetector | planned | — |
| GapMapper | planned | — |

---

## M2 · Agent architecture findings

### F-INT-001 · No INTELLIGENCE_LEAD_AGENT constant (critical)

**Finding:** Intelligence has no `INTELLIGENCE_LEAD_AGENT` constant. Sentinel identity for the Intelligence surface is encoded in two places:
1. The `AgentCanvas` component passes `agentName: 'Sentinel'` for intelligence surfaces
2. The universal agent route detects `surface.startsWith('/intelligence')` to trigger Sentinel voice doctrine

There is no single source of truth. If someone adds a new Intelligence sub-surface and forgets to pass `agentName: 'Sentinel'`, the route defaults to `agentName: 'Atlas'` (the universal fallback at line 273 of `/api/chat/agent`).

**Fix:** Create `src/lib/intelligence/constants.ts` with `INTELLIGENCE_LEAD_AGENT = 'Sentinel'` and `INTELLIGENCE_PRODUCT_NAME = 'AbarVa Intelligence'`. Pass `INTELLIGENCE_LEAD_AGENT` as the `agentName` from Intelligence page components.

**Priority:** High

---

### F-INT-002 · Default agentName fallback is "Atlas" (medium)

**Finding:** `src/app/api/chat/agent/route.ts` line 273:
```typescript
const agentName = body.agentName ?? "Atlas";
```

If any Intelligence page forgets to send `agentName`, the user gets Atlas (portfolio synthesizer) responding to intelligence queries. The fallback should be `null` → `DEFAULT_VOICE` or should require an explicit `agentName` from the caller.

**Fix:** Change the default to `null` and resolve voice via `AGENT_VOICE[agentName ?? ''] ?? DEFAULT_VOICE`. This makes missing agentName a neutral fallback rather than incorrect Atlas persona.

**Priority:** Medium — unblocked, low risk

---

### F-INT-003 · Sentinel voice doctrine gated in production (medium)

**Finding:** The full Sentinel voice doctrine (sample exchanges, banned phrases, structural honesty modes) is gated behind `SENTINEL_VOICE_DOCTRINE_DRAFT`. It is default-on in dev/staging and default-off in production. Production Intelligence users receive only the single-line voice:

```
"You are Sentinel, AbarVa's intelligence librarian. You validate AI patterns, assess source events, and curate the knowledge library."
```

Rather than the multi-exchange, structurally-enforced doctrine spec.

**Fix:** Requires founder sign-off (`SENTINEL_VOICE_DOCTRINE_DRAFT` → `SENTINEL_VOICE_DOCTRINE_ENABLED` environment variable flip). This is not a code bug.

**Priority:** Product decision — pending founder review of doctrine spec

---

## M3 · Workflow-first nav findings

### F-INT-101 · J-spine routes are correctly workflow-first

**Finding:** The J0–J5 spine maps each intelligence journey to a dedicated URL. Users navigate by content type (failure modes, topics, patterns, signals, solutions), not by agent feature. This is the correct workflow-first pattern.

**Status:** No action needed.

---

### F-INT-102 · 12-tab lens is aspirational — most tabs are stubs

**Finding:** The 12-tab lens is defined in the view model but most tabs render fixture or stub content. Tabs like "Evidence," "Gap Queue," and "Contradictions" show empty states or pending-implementation banners.

**Risk:** The navigation communicates capability that doesn't exist yet. Users click "Contradictions" and find nothing actionable.

**Recommendation:** Reduce visible tabs to those with real content in the current wave. Tabs can be progressive-revealed as content fills in. For Wave 1, surface only: Summary, Signals, Programs, Pattern Plan, Gate Readiness.

**Priority:** Product decision.

---

## M4 · Specialist catalog gaps

### F-INT-201 · INT-7 vector retrieval gated on Codex (acknowledged)

**Finding:** Live vector retrieval for Intelligence is gated on the Codex data layer (INT-7). Until Codex delivers the vector index, Sentinel cannot do live knowledge retrieval — only keyword overlap against the static pattern manifest.

Tools registered: `search_patterns`, `pattern_neighborhood`, `evidence_lookup` (all with keyword-fallback, not vector retrieval).

**Status:** This is a known dependency. The fallback is correct behavior, not a bug. Do not refactor Codex-owned territory without explicit founder direction.

**Priority:** Codex dependency — not Claude's lane.

---

### F-INT-202 · Specialist wiring order for Wave 2

When the model gateway and vector index land, specialist wiring priority for Intelligence:

1. **QueryIntentClassifier** — routes J0–J5 queries to the right answer mode; enables Sentinel to respond differently to "what pattern applies here" vs "what evidence is missing" vs "what are the contradictions"
2. **EvidenceCitationBuilder** — assembles source citations and provenance chain; enables the Evidence tab to show real content instead of stubs
3. **ContradictionDetector** — flags when two patterns or sources disagree; enables the Contradictions tab
4. **GapMapper** — identifies missing evidence needed to increase answer confidence; enables the Gap Queue tab

---

## M5 · Evidence and citation hygiene

The current intelligence surface has no live dollar figures or claim-generation in Wave 1 (all deterministic). CitationGuard cannot fire on what isn't generated. This is safe.

When Sentinel starts generating live responses via `/api/chat/agent`, the CitationGuard constraint applies: every dollar figure and benchmark claim must carry an evidence label (`[UNVALIDATED_HYPOTHESIS]`, `[PRELIMINARY_ESTIMATE]`, `[MEASURED_RESULT]`). This is already enforced in the universal agent route via the `validateSynthesisOutput` and `recordViolations` pipeline.

**Status:** Acceptable for Wave 1. Verify when live responses land.

---

## M6 · Addendum · Architecture alignment

**Decision (2026-05-06):** Intelligence's front agent is **Sentinel**. This maps to the architecture:
- Source product → Sentinel
- Intelligence product → Sentinel
- Both surface as "Sentinel" to the user; the specialist layer behind Sentinel differs by surface

**What Sentinel does on Intelligence surfaces:**
- J0–J5 query routing
- Pattern knowledge validation and synthesis
- Evidence chain assembly
- Contradiction detection across sources
- Gap analysis for unresolved queries

**What Sentinel does NOT do on Intelligence:**
- Run program workflows (Nexus territory)
- Portfolio synthesis across programs (Atlas territory)
- Governance and admin (Steward territory)

**Sentinel on Source vs. Intelligence:**
- On Source: Sentinel advises on the 11-stage sourcing workflow, artifact quality, gate criteria
- On Intelligence: Sentinel operates as library curator, pattern validator, synthesis engine
- Same brand name, different specialist chains behind each surface — this is the correct 3-layer architecture

---

## Action items

| # | Finding | Fix | Priority | Status |
|---|---|---|---|---|
| INT-A1 | No INTELLIGENCE_LEAD_AGENT constant | Create `src/lib/intelligence/constants.ts` | High | **Open** |
| INT-A2 | Default agentName fallback is "Atlas" | Change default to null in universal agent route | Medium | **Open** |
| INT-A3 | Sentinel voice doctrine not in production | Founder sign-off on doctrine spec | Medium | Pending |
| INT-A4 | 12-tab lens mostly stubs | Reduce visible tabs in Wave 1 | Low | Product decision |
| INT-A5 | INT-7 vector retrieval | Codex dependency — do not touch | — | Codex |
| INT-A6 | Specialist wiring | Wire per priority order above in Wave 2 | Low | Wave 2 |

---

*End of Intelligence audit.*
