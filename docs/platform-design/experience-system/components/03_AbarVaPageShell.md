# AbarVa Page Shell

## Purpose

Provide the consistent page frame for AbarVa surfaces.

## When to Use

Use for Programs, Source, Intelligence, Control Tower, and Admin/Setup pages.

## When Not to Use

Do not use for isolated auth pages or exported documents unless adapted.

## Visual Rules

- Warm off-white primary canvas.
- Top nav stays calm and compact.
- Content width respects data density.
- Avoid nested cards.

## Conceptual Props

- `surface`
- `title`
- `activeNav`
- `contextStrip`
- `agentPanel`
- `children`

## Interaction Behavior

Supports drawers and collapsible agent panel.

## States

Loading, empty, active, blocked, error, insufficient permissions.

## Accessibility

Use landmark regions and skip-to-content support.

## Examples

- Source dashboard shell.
- Program workbench shell.
- Admin/Setup control plane shell.

## Anti-patterns

Full-screen dark shell as default, marketing hero layout, card-in-card page sections.

## Acceptance Criteria

Page feels like one AbarVa system regardless of surface.
