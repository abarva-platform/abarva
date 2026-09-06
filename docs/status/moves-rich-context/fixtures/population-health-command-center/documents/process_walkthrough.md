# Population Health Workflow Walkthrough

## Operating Friction
The care-management time-and-motion evidence assigns 31 of every 53 minutes to search and reconciliation before clinical action. That makes the caseload argument arithmetic: reducing search time is the only way the same team can close more gaps without pretending staffing changed.

## Data Path
Structured extracts land through the current-state path as CSV or XLSX. Narrative context lands through Upload and Review as Markdown or DOCX. Both paths carry the same content so testers can compare parse coverage and prompt coverage honestly.

## Reconciliation Logic
Provider-sourced measure status is treated as workflow truth. Plan-sourced status is treated as payment and Stars truth. Conflicts do not fail the Move; they become named evidence requests and phase carry-forward items.

## Design Scope Boundary
The island legacy platform remains design-scope only because its feed is weekly and its quality-measure extract is incomplete. The Move may discuss sequencing, but it may not count that market as ready for wave 1 automation.
