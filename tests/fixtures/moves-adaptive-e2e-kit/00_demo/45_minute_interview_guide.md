# 45-Minute Discovery Interview Guide

## Objective
Collect the minimum evidence needed to choose the right solution route and estimate its roadmap. This is discovery, not a complete process redesign, detailed solution design, or operating-model transformation.

## Interview flow

| Time | Focus | Core prompts and probes | Capture |
|---|---|---|---|
| 00-05 | Decision and boundary | What decision should this work enable, by when, and who owns it? What is the smallest useful outcome? Which decisions or communications must remain human-owned? What is explicitly out of scope? | Decision owner, decision date, use-case boundary, red lines, unresolved scope |
| 05-11 | Demand and value baseline | Which queues and intents drive demand? What period, denominator and exclusions are used? Separate talk, hold and after-call work. Which source is authoritative? What explains conflicting figures? | Source, period, definition, owner, unit, confidence, conflicts; no blended or averaged metrics |
| 11-19 | Current work | Walk through one recent routine contact and one exception, without identifiers. What did the agent open, search, repeat, wait for, rekey or escalate? Where does context disappear? How often does each step occur? | Ordered steps, actor, system, decision, wait/rework, exception trigger, evidence locator |
| 19-25 | Data and technology | For each needed fact, who owns the source? Is it available through a supported read interface? What are refresh lag, identity matching, access, audit, quality and failure behavior? Which claims are only assumptions? | Source-to-field map, owner, interface status, freshness, access dependency, data-quality gap |
| 25-30 | Knowledge and controls | Which source is authoritative for an answer? Who publishes and withdraws content? How is version and freshness shown? What should the assistant abstain from answering? What happens when sources conflict? | Content owner, citation need, review SLA, stale/conflict behavior, explicit negative controls |
| 30-35 | Change and adoption | Does this change a task, decision right, accountability, staffing model, or mainly the tool used? Who owns training, adoption and supervisor review? Which observations support that conclusion? | Change magnitude, evidence reference, business adoption owner, supervisor role |
| 35-40 | Route and options | Is the need primarily reporting/data/product work, a bounded workflow change, or a material operating-model shift? What is the minimum viable option? What simpler route would meet the need? What evidence would change the route? | Recommended route, alternatives, scope/exclusions, confidence, human validator and rationale |
| 40-43 | Estimate inputs | Which work packages, roles and skills are needed? Internal, vendor or hybrid? Which rates are sourced versus assumed? Where could Claude Code/Codex accelerate scaffolding, tests or documentation? What review, security and acceptance work remains human-owned? | Role mix, low/base/high effort basis, rate source, AI sensitivity, review overhead, estimate owner |
| 43-45 | Playback and next evidence | What is confirmed, assumed, contradicted or unknown? What did we get wrong? Which single minimum evidence item closes the next gate? Who will provide and review it? | Corrected decisions, evidence owner, reviewer, due date, next-step gate |

## Route-sensitive branches

- **Technical product or reporting only:** ask about source feeds, bronze/silver/gold transformations, data quality, semantic definitions, dashboard users and acceptance. Do not demand a future operating model or end-to-end process map. The business owns training/adoption unless evidence shows otherwise.
- **Bounded process change:** map only the affected workflow delta, exception handling, controls and accountable owner. Keep unaffected operations out of scope.
- **Material operating-model change:** identify the evidence and accountable sponsor that justify deeper organization, role, decision-right and transition work. Do not presume that depth from an AI or automation label.
- **Unresolved route:** record the competing interpretations and the exact evidence needed to resolve them. Keep the route provisional; do not build downstream artifacts as if it were settled.

## Evidence discipline
For every material statement, record whether it is a source-backed fact, a human decision, an assumption, or an open question. Capture file/session name plus page, row, timestamp or section where available; preserve conflicts as separate claims. Use no names, member identifiers, credentials or raw PHI in session records. The interviewer does not approve extracted evidence on behalf of the accountable reviewer.
