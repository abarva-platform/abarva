# 04 VISUAL EXPERIENCE AND DESIGN SYSTEM

## Quality Bar

Source should feel:

- premium
- calm
- executive-grade
- high-trust
- structured
- boardroom-ready
- decision-oriented

It should not feel:

- generic
- noisy
- over-carded
- like a procurement portal
- like a chatbot attached to a dashboard

## Layout Rules

### Dashboard

- product header
- short description
- KPI strip
- Nexus alerts / decisions needed
- event portfolio table or structured list
- no unnecessary charts in the first slice

### Event Canvas

- top event header
- journey tracker
- left stage panel
- center workspace
- persistent right Nexus panel

## Spacing And Density

- Prefer dense but calm operational surfaces.
- Tables should be readable and scannable.
- Cards should be used for repeated items, alerts, and compact summary blocks.
- Avoid page sections styled as cards inside cards.

## Typography

Use existing application conventions and tokens from [src/lib/design-system.ts](/Users/anand/Projects/nexus/src/lib/design-system.ts).

Recommended use:

- serif for high-level titles and major value figures
- sans for table text, body copy, actions
- mono for labels, codes, state chips, metadata

## Color

Use existing dark product system:

- dark background
- restrained surfaces
- teal for primary action and active state
- amber for warning
- red for critical
- green for healthy/complete

Avoid:

- rainbow status systems
- too many badges
- new color palette just for Source

## Status Treatment

Status should be text-first, color-supported.

Every status should answer:

- what state is this in?
- who owns it?
- how long has it been there?
- what action is needed?

## Alert Severity

- Critical: blocks progress or creates material risk.
- Warning: needs attention soon.
- Info: useful operating context.

Alerts should show owner and action. They should not become decorative banners.

## Right Rail Behavior

The Nexus rail should:

- be persistent on event canvas
- summarize current stage state
- show missing inputs, risks, next action, and recommended action
- avoid freeform chatbot framing in the first slice

## Drawer Behavior

Drawers should:

- open from artifact or supporting detail actions
- preserve context behind them
- show metadata before content
- make stub reasons explicit

## Journey Tracker Behavior

The tracker must reflect real workflow state. It should not be decorative.

It must show:

- active stage
- complete stages
- blocked stages
- approval-needed stages
- future locked stages
- readiness where applicable

## Anti-Patterns

- decorative journey tracker with no state logic
- generic dashboard card grid
- hidden next action
- oversized hero panels in an operational workflow
- visual noise from too many colors and badges
- visible explanatory text about how the UI works
