# 13 EVENT LIFECYCLE AND ALERTS

## Dashboard Question

The dashboard should answer:

> What sourcing events are active, where are they stuck, what decision is needed, who owns the next action, and what value is at stake?

## Alert Types

- missing input aging
- vendor response overdue
- procurement review overdue
- executive approval pending
- scorecard not locked
- artifact needs review
- RFP package missing required inputs
- event approaching at-risk threshold
- value ledger missing measurement owner

## Alert Severity

### Critical

Blocks progress or creates material governance/value risk.

Examples:

- required client input overdue beyond threshold
- scorecard not locked while evaluation is about to begin
- executive approval blocks release

### Warning

Needs attention soon.

Examples:

- vendor response nearing due date
- artifact needs review
- event approaching at-risk threshold

### Info

Useful operating context.

Examples:

- reminder to confirm next meeting
- value owner assigned
- upcoming gate review

## Alert Fields

- id
- event id
- type
- severity
- title
- detail
- owner
- next action
- due date
- aging days
- status

## Alert Behavior

- critical alerts appear first
- each alert includes owner and next action
- alerts should link to the relevant event, stage, artifact, scorecard, or ledger
- resolved alerts should not dominate the active dashboard

## At-Risk Thresholds

Initial suggested thresholds:

- client input overdue by 5 business days
- vendor response overdue by 3 business days
- procurement review overdue by 5 business days
- executive decision overdue by 5 business days
- scorecard unlock remains unresolved when evaluation starts

## Anti-Patterns

- decorative alerts with no owner
- alerts with no action
- hiding aging
- merging all alert types into one generic warning
- using color without text
