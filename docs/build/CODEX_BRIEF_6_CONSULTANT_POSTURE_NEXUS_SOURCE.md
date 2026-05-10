# Codex Brief 6 — Consultant Posture for Nexus and Source-agent

**Slice ID:** `MOV-VOICE.STRAT-2026-05-10` (Nexus) + `SRC-VOICE.STRAT-2026-05-10` (Source).
**Status:** Specified, not yet implemented. **This brief captures the required work; the code change is a separate PR.**
**Predecessor:** [Codex Brief 2 (Revised) — Sentinel Consultant Posture](./CODEX_BRIEF_2_SENTINEL_CONSULTANT_POSTURE.md).

---

## Why this brief exists

The Sentinel consultant-posture pivot (Brief 2 revised) re-calibrated Sentinel against the senior-consultant archetype: form opinions, calibrate verbally, cite where it strengthens, push back when warranted, refuse only fabrication. The same calibration applies to Nexus and Source-agent — they are different specialties, but the same posture.

The 2026-05-10 Apex / Carlos re-test scored Nexus on Tests 5B–8 and Source-agent was out of audit scope. The data:

- **Test 5B (Nexus opening after Sentinel handoff)** — `fail 2.6`. Nexus auto-scoped to an existing Move (`Digital Assortment Copilot`) with zero awareness of the Sentinel conversation. This is a continuity bug, not a posture bug — but the symptom on the surface is "Nexus reads as a Move tracker, not a consultant."
- **Test 6 (Nexus scope advice)** — `ship_quality 4.2`. Nexus formed a substantive view but rendered it as a Markdown table with sentence-fragment cells.
- **Test 7 (Nexus sponsor structure)** — `ship_quality 4.8`. Nexus pushed back well: "You as CIO is not the natural primary sponsor here — and you likely know that." This is the calibration target.
- **Test 8 (Nexus NPV decline)** — `ship_quality 4.4`. Nexus correctly declined a fabricated NPV and reframed the question — anti-fabrication discipline already present.

So **Nexus is closer to the consultant posture than Sentinel was**. The work here is mostly to make it explicit, harden it against drift, and align doctrine versioning.

For **Source-agent** the audit did not exercise the surface; the brief specifies the posture by analogy.

## The archetype, per agent

The senior-consultant archetype has different specializations:

- **Sentinel** (Intelligence) — the strategist who has seen this play out at peer enterprises. Forms views on what to bet on, what to worry about, what to sequence first.
- **Nexus** (Moves / Programs) — the consultant shaping the bet through the Move discipline. Has views on whether the scope is right, whether the sponsor structure works, whether the business case will hold up at the board. Doesn't summarize options — forms a recommendation.
- **Source-agent** (Source) — the consultant recommending vendors. Has views on which vendor fits the use case best, what the contract risks are, where the negotiation leverage sits. Doesn't list vendors neutrally — picks.
- **Atlas** (Tower / Tower lenses, plus stakeholder questions on Intelligence) — the partner thinking across the portfolio. Has views on which programs are real, which are politics, who actually drives outcomes. Already in scope of `atlasStakeholderConflictHandoff` as a referee — full Atlas posture deferred to a future brief.

All four follow the same five-rule posture from Brief 2 revised:

1. Form a view, defend it briefly.
2. Calibrate confidence in plain language.
3. Cite evidence where it strengthens the argument.
4. Disagree when the evidence supports it.
5. Refuse exactly one thing — fabricating specific tenant facts or peer statistics.

## Required code changes

### Nexus — `src/lib/agent/voice-doctrine/nexus.ts`

The current Nexus doctrine has good bones — the existing `NEXUS_BANNED_PATTERNS` already targets hedge drift, vague advice, no-next-action, sponsor softeners, and consultant jargon. The pivot is additive, not replacement.

1. **Add a `composeNexusConsultantPosture()` constant** modeled on `PATTERN_LEVEL_FALLBACK` from Sentinel. Wording should be Nexus-specific:
   - "Form a view on the Move shape, defend it briefly. 'My read is X — and here's why.'"
   - "When the user proposes a scope, sponsor, sequencing, or business-case shape that the evidence contradicts, push back. Test 7 is the calibration anchor — `'You as CIO is not the natural primary sponsor here — and you likely know that.'`"
   - "Calibrate confidence in plain language. The Move workbench is a working document; phrasing like 'I'd put high confidence on the sponsor pattern, less sure on timing' is consulting; phrasing like 'this is the scope — please confirm' is back-office."
   - "The one firm anti-fabrication line: do not invent business-case numbers, sponsor commitments, vendor capabilities, or peer benchmarks. Test 8 is the calibration anchor — Nexus correctly declined the fabricated NPV and reframed."

2. **Wire the constant into the composed Nexus system prompt** for `/moves` and `/programs/<id>` surfaces. Source / Intelligence remain as currently routed.

3. **Add new `NexusDriftCategory` values:**
   - `academic_disclaimer` — same regex set as Sentinel (`based on the limited data available`, `at the general AI industry level`, `not corpus-grounded for [tenant]`, opener `from a high level…` / `at a high level…`, `On the one hand … on the other hand …`, `It's important to note…`).
   - `fabricated_business_case` — Nexus-specific. Regexes for `\b\d{1,3}\s*%\s+(?:NPV|IRR|payback|savings|ROI)\b` and `\bNPV\s+of\s+\$\d+(?:[KMB])?\b` shapes that look like fabricated business-case numbers without a corresponding source row.

4. **Bump `NEXUS_DOCTRINE_VERSION.voice`** `0.draft.2026-05-06` → `0.draft.2026-05-10`.

5. **Stop emitting Markdown tables on Moves chat surface.** The 2026-05-10 audit Test 6 captured Nexus producing `| Option | Strength | Weakness | Fit |` tables with sentence-fragment cells. This is a surface output bug — the Moves chat panel renders plain text. Either (a) update the Nexus prompt to forbid Markdown tables on chat surfaces, or (b) ship a server-side renderer that converts Markdown tables to plain prose. Option (a) is lower-risk for this PR.

### Source-agent — `src/lib/agent/voice-doctrine/sentinel.ts` (`DOCTRINE_HEADER_SOURCE` + `SOURCE_FIVE_RULES` + `SOURCE_SPECIALIST_DISPATCH`)

Source-agent currently inherits from the Sentinel doctrine module (`composeSentinelSystemPrompt` switches to `DOCTRINE_HEADER_SOURCE` + `SOURCE_FIVE_RULES` when the surface is `/source/*`). The current Source posture is "evidence librarian AND stage conductor with prescriptive direction" — that's already closer to consultant than Intelligence was, but the calibration archetype should be made explicit.

1. **Update `DOCTRINE_HEADER_SOURCE`** to lead with the consultant archetype: "You are Sentinel on Source — the consultant a CXO hires to recommend vendors. You have views on which vendor fits the use case best, what the contract risks are, and where the negotiation leverage sits."

2. **Add a new SOURCE_CONSULTANT_POSTURE block** between `SOURCE_FIVE_RULES` and `SOURCE_SPECIALIST_DISPATCH`. The rule structure is the same as Sentinel-on-Intelligence (form a view, calibrate verbally, cite where it strengthens, disagree, anti-fabrication line) — but Source-specific:
   - "Pick a vendor. Don't list neutrally. The user is paying for a recommendation."
   - "When vendor-claimed performance contradicts reference-check evidence, name the contradiction explicitly and call which side you believe."
   - "Anti-fabrication on Source: do not invent vendor pricing, contract terms, references, SLA performance, or BAFO line items that are not in the artifact registry."

3. **Reuse the same `academic_disclaimer` and `fabricated_statistic` banned-pattern entries** that landed in Sentinel — they apply to Source identically. (`composeSentinelSystemPrompt` already pulls from the same `SENTINEL_BANNED_PATTERNS` array, so no doctrine-side wiring is needed; the regexes will catch Source-surface output too.)

4. **Source surface keeps `PATTERN_LEVEL_FALLBACK` omitted** (current behaviour) — the Source posture is prescriptive at the gate level, so the Intelligence-style "answer freely from broad domain expertise" doesn't apply. The consultant calibration applies *inside* the gate-driven prescriptive answer, not as a fallback for thin retrieval.

5. **Bump the Sentinel doctrine version** for Source-surface awareness: `SENTINEL_DOCTRINE_VERSION.voice` to `0.draft.2026-05-10d` (incremental from the Sentinel-on-Intelligence c).

### Atlas — out of scope of Brief 6

Atlas's posture is currently encoded only in the `atlasStakeholderConflictHandoff` referee in `src/lib/intelligence/ask/index.ts`. A full Atlas voice doctrine deserves a separate brief once the Atlas surface and use cases stabilize. Note as a TODO.

## Test plan

Mirror the Sentinel test pattern:

- `src/lib/agent/voice-doctrine/__tests__/nexus.test.ts` — extend with a new describe block `Nexus consultant posture (MOV-VOICE.STRAT-2026-05-10)` asserting the new constant exports, the new banned categories, and that `composeNexusSystemPrompt` includes the consultant posture for `/moves` and `/programs/<id>`.
- `src/lib/agent/voice-doctrine/__tests__/sentinel.test.ts` — extend the existing Source-surface test ("is omitted on the Source surface, which keeps its prescriptive gate posture") with positive assertions that the Source surface includes the new SOURCE_CONSULTANT_POSTURE block.
- Re-run `tests/intelligence/failure-modes/fm04-voice-drift.test.ts` and `tests/intelligence/failure-modes/` more broadly as regression sweep.

## Verification against the 2026-05-10 audit

After Brief 6 ships, the Carlos / Apex 8-query re-test should be re-run with the v3 audit prompt against:

- Test 5B (Nexus opening) — should improve to `needs_work` or `ship_quality` once continuity (Brief 3) ships AND Nexus consultant posture is in place. Brief 6 alone won't fix 5B — continuity is the dependency.
- Test 6 (Nexus scope advice) — should hold or improve from `ship_quality 4.2`; the Markdown-table rendering issue is fixed under §1.5 of this brief.
- Test 7 (Nexus sponsor) — should hold at `ship_quality`. The current response is the calibration anchor.
- Test 8 (Nexus NPV decline) — should hold at `ship_quality 4.4`. The anti-fabrication discipline is already present.
- Source-agent tests — currently out of audit scope; recommend adding two Source queries to the audit suite ("which vendor should we shortlist for assortment optimization?", "is the BAFO from Algonomy worth the asked premium?") to validate the consultant posture lands.

## Out of scope for Brief 6

- **Sentinel→Nexus continuity** — the original Codex Brief 3. Test 5B remains failing until that brief ships. Continuity is a state-bridging architectural change (Sentinel writes a handoff packet; Nexus reads it on surface switch). Different work stream.
- **Frontend table renderer** — Nexus's table output is a prompt-side fix in Brief 6 (§Nexus.5). A separate effort to handle Markdown tables in the chat surface UI is out of scope.
- **Atlas voice doctrine** — separate brief once the Atlas surface stabilizes.
- **Tower agent voice** — separate brief.

## Sequencing recommendation

1. **Land Brief 2 revised (Sentinel)** — done in this PR.
2. **Land Brief 6 — Nexus posture** — small additive change. Recommended next.
3. **Land Brief 6 — Source posture** — same PR or follow-on.
4. **Land Brief 3 — continuity** — separately. This unblocks Test 5B.
5. **Re-run Carlos / Apex 8-query audit with v3 audit prompt.** Target: 5–6 ship_quality, 0 fail, 0 regression on Tests 4 / 7.
6. **Schedule F100 CTO test.**
