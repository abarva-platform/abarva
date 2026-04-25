# Agent Activity UI Pattern

## Purpose

This document defines how AbarVa should show active agent work without making agents visually dominant. Nexus, Sentinel, Atlas, and Steward should feel present, useful, and context-aware, but the product should remain calm, premium, data-forward, and workflow-led.

This is a design specification only. It does not implement UI components or runtime mission queues.

## Design Principle

Agent activity should be visible when it adds decision value. It should not become a noisy feed, a decorative avatar system, or a generic chatbot rail.

Good agent activity answers:

- What needs attention?
- Which agent found it?
- What context was used?
- What should happen next?
- Who owns it or when is it due?
- Can the user safely proceed?

## UI Variants

### 1. Compact Agent Activity Strip

Use when a page needs a quick sense of active agent work.

Example:

| Agent | Compact signal |
|---|---|
| Nexus | 3 actions ready |
| Sentinel | 2 evidence gaps |
| Steward | 1 blocked gate |
| Atlas | Executive brief ready |

Visual rules:

- Keep it short and horizontal where space allows.
- Use text-first labels with restrained marks.
- Show counts and mission type, not a feed.
- Keep background light unless the strip is inside a dark command panel.
- Avoid large icons, avatars, or bright badges.

### 2. Right-Side Agent Mission Panel

Use when a page has several active missions that influence next action.

The panel should show:

- Primary mission.
- Agent owner.
- Context used.
- Confidence or evidence state when relevant.
- Owner and due date when relevant.
- Recommended next action.
- Three choices plus custom only when it helps the user move forward.

The panel should not show:

- Long chat history as the primary view.
- Generic prompts.
- Decorative agent biographies.
- More than a few active missions at once.

### 3. Inline Agent Recommendation

Use near the exact object the agent is advising on:

- Journey stage.
- Artifact row.
- Vendor response.
- Data readiness item.
- Scorecard criterion.
- Approval gate.

Inline recommendations should be concise:

- One finding.
- One reason.
- One next action.
- Optional context-used strip.

### 4. Executive Agent Brief

Use for Atlas or cross-agent executive synthesis.

The brief should show:

- Decision needed.
- Value at stake.
- Risk or blocker.
- Confidence caveat.
- Recommended executive action.
- Operational follow-up owner.

Keep the brief calm and direct. Avoid dashboard filler and generic AI language.

### 5. Hidden/Background Mission Drawer

Use for lower-priority missions, historical mission activity, or audit review.

The drawer can include:

- Completed missions.
- Dismissed missions.
- Deferred missions.
- Handoff history.
- Validation source.
- Evidence source.

The drawer should not become the primary work surface.

## Activity Content Rules

Show:

- Mission count.
- Next action.
- Agent owner.
- Work object.
- Context used.
- Owner and due date when relevant.
- Confidence or evidence state when needed.
- Blocker or defer reason when relevant.

Do not show:

- Noisy event streams.
- Agent spam.
- Large avatars.
- Excessive icons.
- Decorative symbols.
- Generic chatbot prompts.
- Unbounded chat transcript as the primary interaction.

## Agent-Specific Activity Signals

### Nexus

Use for:

- Next action ready.
- Scope or stage readiness.
- Workshop/session prep.
- Artifact guidance.
- Sourcing workflow guidance.

Example labels:

- "3 actions ready"
- "Scope readiness needs input"
- "Next action ready"

### Sentinel

Use for:

- Evidence gaps.
- Citation readiness.
- Unsupported claims.
- Pattern anti-signals.
- Low confidence.

Example labels:

- "2 evidence gaps"
- "Citation not ready"
- "Pattern fit uncertain"

### Atlas

Use for:

- Executive brief ready.
- Value at risk changed.
- Portfolio pressure.
- Decision tradeoff.

Example labels:

- "Executive brief ready"
- "$18.5M at risk"
- "Decision needed"

### Steward

Use for:

- Blocked gate.
- Approval overdue.
- Data readiness issue.
- Waiver required.
- Audit readiness.

Example labels:

- "1 blocked gate"
- "Approval overdue"
- "Waiver required"

## Visual Rules

- Default canvas remains warm off-white.
- Agent activity should use restrained marks and dark navy/charcoal text.
- Dark panels are allowed only for high-impact command reads, executive briefs, or agent pressure summaries.
- Use compact density with enough whitespace.
- Avoid badge overload.
- Use color as support, not the only status signal.
- Use minimal icons only where they improve scanning.
- Keep agents visible but secondary to the work.

## Responsive Behavior

Desktop:

- Activity strip can sit under the page command read or above the main table.
- Mission panel can sit on the right when it does not crowd the table.

Narrow widths:

- Activity strip wraps into short rows.
- Mission panel collapses into a drawer.
- Inline recommendations stay near the object they describe.
- Large command panels should not push all data below the fold.

## Accessibility

- Mission counts must have text labels.
- Status cannot rely on color alone.
- Agent marks need accessible names.
- Suggested actions must be keyboard reachable.
- Drawer and panel states must be announced to assistive technology when implemented.

## Acceptance Criteria

- Agents have concrete work.
- Missions are tied to context, workflow, evidence, validation, or patterns.
- Agent activity is visible but not dominant.
- UI shows next action rather than a noisy feed.
- Context used is available where it affects trust.
- Confidence and evidence state appear when needed.
- Mission count is visible without clutter.
- No passive chatbot behavior.
- No agent spam.
- UI remains calm, premium, and data-forward.
- Future runtime implementation can create deterministic mission queues from the pattern.
