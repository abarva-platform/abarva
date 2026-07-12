# Candidate Readiness Control - SkyHarbor

Tenant: `skyharbor-air`
Candidate: `skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run`
Generated: `2026-07-10T00:00:00.000Z`
Quality gate: `pass`
Readiness state: `candidate_preview_ready_not_active_ready`

This is the consolidated control panel for the inactive SkyHarbor candidate. It
proves candidate preview readiness and keeps active runtime readiness false.

## Executive Summary

- Candidate version exists: true
- Promotion gate exists: true
- Module preview packets exist: true
- Module readiness matrix exists: true
- Module derived plans exist: true
- Module graph plans exist: true
- Source shadow proof exists: true
- Moves shadow proof exists: true
- Runtime-ready: false
- Active access unchanged: true
- Promotion disabled: true
- Blockers remaining: 21

## Module Control

| Module       | Preview packet | Derived plan | Graph plan | Runtime-ready | Status                   |
| ------------ | -------------- | ------------ | ---------- | ------------- | ------------------------ |
| home         | true           | true         | false      | false         | preview_packet_available |
| intelligence | true           | true         | false      | false         | preview_packet_available |
| moves        | true           | true         | true       | false         | preview_packet_available |
| source       | true           | true         | true       | false         | preview_packet_available |
| tower        | true           | true         | true       | false         | preview_packet_available |

## Before Active Promotion

- Operator approval recorded for this candidate version.
- Promotion gate explicitly enabled in a future approved release.
- Rollback plan reviewed and accepted.
- Active access update command implemented, tested, and reversible.
- Signed-in Home, Intelligence, Moves, Source, and Tower preview proof passes against an explicitly selected candidate.
- Module Memory and Outcome Ledger write paths remain disabled until separately approved.

## Guardrails

- Production tenant data written: false
- Active Tenant Access Layer updated: false
- Candidate promoted: false
- Module runtime consumption changed: false
- Candidate read by default: false
- Runtime-ready: false
- Promotion enabled: false
- Realized value claimed: false
