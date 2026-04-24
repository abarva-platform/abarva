# 15 ACCEPTANCE CRITERIA

## Build Pack Completeness

- all required Build Pack files exist
- master anchor defines read order and approval boundary
- product vision is explicit
- IA is explicit
- visual design rules are explicit
- data model and ERD are explicit
- workflow and lifecycle model are explicit
- agent roles and handoffs are explicit
- pattern-pack architecture is explicit
- artifact and RFP generation model is explicit
- scorecard governance is explicit
- value ledger model is explicit
- alerts and lifecycle behavior are explicit
- implementation sequence is explicit
- component specs and wireframes exist

## Source Dashboard

- answers active, waiting, stuck, value, owner, and next action
- shows event list/table
- includes Nexus attention without becoming a chatbot
- no unnecessary charts
- no disconnected card sprawl

## Event Canvas

- shows event header, lifecycle, stage, owner, value, and readiness
- includes journey tracker, stage panel, workspace, Nexus panel, and artifact access
- preserves context

## Journey Tracker

- reflects real workflow state
- shows active, complete, blocked, approval-needed, reopened, and future stages
- click behavior is defined
- not decorative

## Nexus Panel

- shows stage summary, readiness, lifecycle status, missing inputs, risks, next action, owner, due date, evidence confidence, and recommended actions
- not a generic chatbot

## Scorecard Governance

- uses pattern defaults
- supports edits and rationale
- validates total weight = 100%
- flags material changes
- requires approval and lock before evaluation

## Artifact Drawer

- shows artifact metadata
- supports status, tier, confidence, owner, inputs, and citation placeholders
- uses dignified stubs
- no fake content

## Value Ledger

- shows projected value line items
- includes assumptions, confidence, timing, measurement method, owner, and milestones
- realized value is clearly deferred until measured

## Lifecycle Alerts

- shows severity, owner, action, due date, and aging
- links alerts to relevant event surfaces
- critical alerts are surfaced first

## Implementation Readiness

Implementation may start only when:

- relevant Build Pack files are reviewed
- relevant wireframe is reviewed
- relevant component spec is reviewed
- acceptance criteria are clear
- slice is explicitly approved
