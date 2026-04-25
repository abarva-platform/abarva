# AbarVa Data Table

## Purpose

Render table-forward portfolio and operating queues.

## When to Use

Use for programs, sourcing events, vendors, datasets, users, artifacts, and value ledger rows.

## When Not to Use

Do not replace important queues with card grids.

## Visual Rules

- Clear headers.
- Compact readable rows.
- Text-first status.
- Value/risk/action easy to scan.
- Row actions restrained.

## Conceptual Props

- `columns`
- `rows`
- `primaryKey`
- `status`
- `rowAction`
- `drawerTarget`

## Interaction Behavior

Rows open detail or drawer. Filters should preserve context.

## States

Empty, loading, active, filtered empty, error, low evidence.

## Accessibility

Use semantic table markup where possible. Preserve keyboard row actions.

## Examples

- Source event operating queue.
- Program portfolio table.
- Admin dataset explorer.
- Vendor comparison table.

## Anti-patterns

Decorative icon columns, badge walls, hidden owner/action, unreadable overflow.

## Acceptance Criteria

User can scan status, value, owner, and next action quickly.
