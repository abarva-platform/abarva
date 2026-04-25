# Tool Layer

## Purpose

The Tool Layer defines approved deterministic actions that agents may request through governed boundaries.

## Tool Types

- Read tools: fetch work-object state, evidence, pattern context, and audit history.
- Analysis tools: deterministic scoring, validation, comparison, normalization, and report formatting.
- Write tools: create tasks, update workflow state, request data, record decisions, and submit approvals when explicitly allowed.
- External tools: connectors, provider APIs, and export services through approved adapters.

## Rules

Tools must be typed, auditable, permission-checked, and scoped to a work object. Agents cannot run arbitrary tools or bypass product API boundaries.

## Side Effects

Any tool with side effects must declare required permission, work object, idempotency behavior, audit record, rollback or correction path, and user-visible result.

## MVP / V1 / V2

MVP: deterministic read and validation tools. V1: governed write tools for tasks, approvals, and workflow state. V2: external orchestration and automation with stronger policy controls.
