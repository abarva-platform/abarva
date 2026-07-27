# Phase 3C-2D Consumption Contracts, Read Models and Semantic-Layer Certification

Status: plan and contract package only. No Azure apply, PostgreSQL migration, source landing, parser job, publication job, product wiring or runtime deployment is included.

This package makes consumption readiness a first-class output before Airline Demo New or Healthcare Demo New lands source files. It defines the shared path:

Raw sources -> Evidence -> Working candidates -> Accepted canonical Knowledge and metrics -> Immutable domain publication -> Active Knowledge Baseline -> Versioned consumption projections -> Home, Nexus APIs, Cube, aVa packets, Superset and Observable.

Home must not depend on Cube to render. Home and Cube consume the same governed PostgreSQL publication and consumption layer.

## Legacy isolation rule

The new client pilot data plane must not be built from or depend on old module-owned tables, V6/V7 demo packs, legacy Home packs, current Source operational tables, current Moves workflow tables, current Tower marts, old chat/session facts, hidden truth, evaluator artifacts, or any existing module runtime layer.

Those existing tables may be inspected only as migration/audit inputs. They may not become upstream sources for the new canonical Knowledge, publication, consumption, Cube, Home, aVa, Source, Moves or Tower read path. Any retained operational module table must link to the new canonical/publication layer through an explicit identity map and reconciliation proof before its facts are consumer-visible in the new pilot.
