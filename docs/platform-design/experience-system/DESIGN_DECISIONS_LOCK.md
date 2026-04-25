# AbarVa Design Decisions Lock

## Purpose

This file locks the current AbarVa product experience direction after the latest iPad design review. It is a design gate for future implementation across Home, Programs, Source, Intelligence, Control Tower, and Admin/Setup.

Do not treat this as a mood board. Treat it as the visual and interaction contract for product work until a later explicit design decision supersedes it.

## 1. Visual Language

AbarVa should feel elegant, calm, premium, enterprise-grade, Apple-like, and data-forward.

The default product canvas is warm off-white or ivory. Body text is near-black or charcoal. Dark navy is used for emphasis. Blue and dark blue are restrained accents. Teal is used sparingly. Muted brown may appear only as subtle warmth, not as a dominant palette.

Each page should use at most one major dark panel, and only when it supports a command read, executive brief, or high-impact insight. AbarVa is table-forward, structured, whitespace-rich, and built for scanability. Icons should be minimal and functional.

Avoid:

- Neon styling.
- Excessive green.
- Heavy gradients.
- Too many symbols.
- Busy dashboards.
- Generic AI sparkle.
- Sanskrit script or religious symbols.
- Decorative icon noise.
- Full dark-mode dashboards as the default product experience.

## 2. Logo And Wordmark Direction

Use the approved Option 1 direction from the latest logo exploration.

The AbarVa wordmark uses `Abar` in near-black or black and `Va` in dark blue or dark sky blue. The opening `A` may be slightly more expressive and bolder than the rest of the wordmark, but it must remain clearly legible as an `A`.

The symbol sits to the left of the wordmark. It should be smaller than earlier explorations, roughly 80 percent of the prior intelligence mark size. It is secondary to the wordmark and should feel refined, intelligence-inspired, orbital, focused, and precise.

Do not use:

- Sanskrit script.
- Religious symbols.
- Oversized decorative marks.
- Marks that overpower the wordmark.

The symbol must work in navigation, favicon or app icon contexts, and large brand lockups.

## 3. Source Visual Direction

Source uses a clean off-white workspace as the baseline, not a full dark-mode dashboard.

The Source workspace is table-forward. Journey and progress state sit near the top. The event portfolio table is the primary surface. A selected event detail panel or pressure panel can sit on the right. Pressure signals should be compact, specific, and useful.

Source should use minimal icons and should not look like a generic procurement portal.

## 4. Programs Direction

Programs Home is portfolio-first and must make the Nexus Brief visible.

The Create New Program path leads to Program Journey Phase 0. Program Journey supports Overview Mode and Nexus Workshop Mode. In Nexus Workshop Mode, the center canvas expands and surrounding clutter collapses.

The right context panel supports the work. It is not the primary dialogue surface when the user is actively interacting with Nexus.

## 5. Journey Progress

Journey progress must be visible wherever workflow state matters.

Journey progress must show:

- Current stage.
- Completed stages.
- Blocked, waiting, or approval state.
- What comes next.

Progress must reflect real workflow state. It must not be decorative progress.

## 6. Agent Response Pattern

AbarVa agents are context-first, not prompt-first.

Agent responses should be simple, intelligent, concise, and action-oriented. Use the three choices plus custom pattern when it helps move work forward. Do not use three choices mechanically everywhere.

Where appropriate, agents should show:

- Context used.
- Confidence.
- Missing context.
- Next useful action.

The agent should help the user decide and move, not merely answer.

## 7. Data Readiness States

Use these data readiness states consistently:

- Missing
- Requested
- Uploaded
- Connected
- Loaded
- Parsed
- Available
- Usable Evidence
- Low Confidence
- Stale
- Access Restricted
- Not Applicable
- Waived

## 8. Artifact States

Use these artifact states consistently:

- Not Started
- Draft
- Needs Inputs
- In Review
- Changes Requested
- Approved
- Locked
- Issued
- Superseded
- Archived

## 9. Source UI Sequence

Source UI work should proceed in this sequence:

1. Dashboard.
2. Event canvas.
3. Journey map.
4. Nexus panel.
5. Data readiness.
6. Artifacts.
7. Scorecard.
8. Value ledger.
9. Chat UI only after API and context foundation are ready.

Do not pull chat UI, event canvas, artifact drawer, scorecard UI, value ledger UI, vendor flow, upload/parsing implementation, workflow engine, approval engine, or model calls forward without explicit approval.

## Implementation Gate

Before implementing a page or component, cite this decision lock, the Experience System master anchor, and the relevant page, wireframe, component, journey, data, and agent response specs.

If a future design asks for something that conflicts with this lock, pause and update the lock explicitly before implementation.
