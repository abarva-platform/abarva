# AbarVa Request-to-Context Flow

Slice ID: ARCH3
Document: ABARVA_REQUEST_TO_CONTEXT_FLOW.md
Status: code_complete
Authored: 2026-04-26
Author: Code (sole)
Type: Specification / architecture document — no application code,
no runtime modification, no migrations, no model calls.

This document traces the full request path through all eleven AbarVa
architectural planes, from the user's browser click to the rendered
output and closed audit row. It is a companion to ARCH2 (which defines
the sixteen canonical execution steps) and provides a Mermaid sequence
diagram for architectural review.

---

## 1. Participants

| Participant | Plane | Role |
|---|---|---|
| Browser | App Plane (APP) | User entry point |
| ClerkMiddleware | SaaS Control Plane (SCP) | Auth + tenant key |
| AppRouter | App Plane (APP) | Route + surface resolution |
| AgentPlane | Agent Plane (AGENT) | Lead agent dispatch |
| ContextBuilder | Context Plane (CTX) | Context bundle assembly |
| EvidenceLedger | Knowledge/Evidence Plane (KE) | E-### citation resolution |
| RelationalStore | Data Plane (DATA) | Program state reads |
| ModelGateway | Model Gateway Plane (MG) | Provider-agnostic dispatch |
| ToolDispatcher | Tool Plane (TOOL) | Tenant-scoped side effects |
| Steward | Agent Plane (AGENT) / GOV | Gate verdicts + RAI flags |
| AuditLedger | Governance/Audit Plane (GOV) | Append-only audit trail |
| ProviderAPI | External | Anthropic / OpenAI / Azure OpenAI |

---

## 2. Full request-to-output sequence diagram

```mermaid
sequenceDiagram
    autonumber
    participant Browser
    participant ClerkMiddleware as Clerk Middleware (SCP)
    participant AppRouter as App Router (APP)
    participant AgentPlane as Agent Plane
    participant ContextBuilder as Context Builder (CTX)
    participant EvidenceLedger as Evidence Ledger (KE)
    participant RelationalStore as Relational Store (DATA)
    participant Steward as Steward (GOV)
    participant ModelGateway as Model Gateway (MG)
    participant ToolDispatcher as Tool Dispatcher (TOOL)
    participant AuditLedger as Audit Ledger (GOV)
    participant ProviderAPI as Provider API (External)

    Browser->>ClerkMiddleware: HTTPS request + session token
    ClerkMiddleware->>ClerkMiddleware: validate session; extract tenantKey
    alt invalid session
        ClerkMiddleware-->>Browser: redirect to sign-in
    end
    ClerkMiddleware->>AppRouter: authenticated request + tenantKey

    AppRouter->>AppRouter: resolve routeSlug → surface + workObjectHint
    AppRouter->>AppRouter: S7 tenant isolation check
    alt tenant key mismatch
        AppRouter-->>Browser: 403 surface
    end
    AppRouter->>AgentPlane: UserInput { tenantKey, surface, workObjectHint, intent, userId, userRole }

    Note over AgentPlane: Step 2 — Identify work object (deterministic)
    AgentPlane->>RelationalStore: resolve workObjectHint → typed WorkObject
    RelationalStore-->>AgentPlane: WorkObject { kind, tenantKey, programCode, ... }

    Note over AgentPlane,ContextBuilder: Step 3 — Assemble context bundle
    AgentPlane->>ContextBuilder: WorkObject + UserInput + tenantCtx

    par Parallel retrieval
        ContextBuilder->>EvidenceLedger: query E-### citations (scope: WorkObject)
        EvidenceLedger->>RelationalStore: fetch chunk rows
        RelationalStore-->>EvidenceLedger: chunk rows
        EvidenceLedger-->>ContextBuilder: EvidenceCitationSet

        ContextBuilder->>RelationalStore: read program state (S9/S9b-g signals)
        RelationalStore-->>ContextBuilder: program state + S9e signals

        ContextBuilder->>Steward: gate evaluation (G1-G4)
        Steward->>RelationalStore: read gate criteria + program state
        RelationalStore-->>Steward: gate state
        Steward-->>ContextBuilder: GateVerdict { status, criteriaMet, raiFlags }
    end

    ContextBuilder->>ContextBuilder: classify state (S2): low_context | partial | usable | rich
    ContextBuilder->>ContextBuilder: compute quality scorecard (6 dimensions)
    ContextBuilder->>ContextBuilder: set vanilla-response risk flag
    ContextBuilder-->>AgentPlane: ContextBundle { classifier, scorecard, evidence, patterns, gates, ... }

    alt ContextBundle.classifier == low_context && role requires usable
        AgentPlane-->>Browser: missing-input chip (ContextRefusal)
    end

    Note over AgentPlane,ModelGateway: Step 9-10 — Model Gateway dispatch (when composition required)
    AgentPlane->>ModelGateway: ContextBundle + role + intent
    ModelGateway->>ModelGateway: assemble provider-agnostic GatewayPrompt
    ModelGateway->>ModelGateway: select provider + model class (role + tier + cost budget)
    ModelGateway->>ModelGateway: hash prompt + context bundle

    alt GatewayRefusal (low_context or vanilla_risk or cost_budget_exceeded)
        ModelGateway-->>AgentPlane: GatewayRefusal { reason, remedy }
        AgentPlane-->>Browser: missing-input chip
    end

    ModelGateway->>ProviderAPI: dispatch GatewayPrompt
    ProviderAPI-->>ModelGateway: model response
    ModelGateway->>ModelGateway: decode response; validate output schema
    ModelGateway->>ModelGateway: hash response; record tokens + cost + latency
    ModelGateway->>AuditLedger: append AuditRow { tenantKey, modelName, promptHash, responseHash, cost, latency }
    ModelGateway-->>AgentPlane: GatewayResponse { output, citations, createdFrom: gateway_compose }

    Note over AgentPlane,Browser: Step 11-12 — Render + attach evidence / chips
    AgentPlane->>AgentPlane: compose rendered surface (DES1/DES2 design canon)
    AgentPlane->>AgentPlane: attach E-### citation links
    AgentPlane->>AgentPlane: attach missing-input chips for every gap
    AgentPlane->>AgentPlane: attach provenance ribbon (createdFrom, tier, agent, model)
    AgentPlane-->>Browser: rendered surface { citations, chips, provenance }

    opt User intent == mutate (promote deliverable / schedule workshop / open gate review)
        Browser->>AgentPlane: mutation intent + parameters
        AgentPlane->>ToolDispatcher: typed tool call { tenantKey, toolId, params }
        ToolDispatcher->>ToolDispatcher: SEC1 policy gate check
        alt policy deny
            ToolDispatcher-->>AgentPlane: ToolRefusal { reason, remedy }
            AgentPlane-->>Browser: refusal chip
        end
        ToolDispatcher->>RelationalStore: read-model write API (tenant-scoped)
        RelationalStore-->>ToolDispatcher: mutation result
        ToolDispatcher->>AuditLedger: append audit row (mutation)
        ToolDispatcher-->>AgentPlane: ToolResult { kind: ok, mutationId, auditRowId }
        AgentPlane->>AgentPlane: emit PlatformEvent (S9e signal recompute)
        AgentPlane-->>Browser: updated surface
    end

    Note over AuditLedger: Step 16 — Audit row closes the loop
    AuditLedger->>AuditLedger: enforce append-only; tenant-isolated; immutable
```

---

## 3. Key invariants across the full path

### 3.1 Tenant key never changes

The `tenantKey` extracted at step 1 (ClerkMiddleware) flows unchanged
through all sixteen steps. Every component — relational reads, evidence
ledger queries, gateway calls, tool calls, audit rows — carries the same
`tenantKey`. Any mismatch at any step is a hard stop.

### 3.2 Every output carries provenance

Every object emitted at any step carries `createdFrom`. The canonical
markers are:

- `deterministic_read_model` — built from a typed read model.
- `deterministic_seed` — built from the seed planner.
- `deterministic_pattern_pack` — built from I1 / PF1 / SOL2.
- `gateway_compose` — composed by the Model Gateway.
- `human_authored` — uploaded by a tenant user.

A surface that drops `createdFrom` at render time is in violation of
ARCH1 §2.3.

### 3.3 Refusals are always typed

No step silently fails. Every refusal — ContextRefusal, GatewayRefusal,
ToolRefusal, WorkObjectNotFound — is a typed object with `reason` and
`remedy`. The surface renders the appropriate missing-input chip.

### 3.4 Model gateway is the only model path

The sequence above shows a single path to `ProviderAPI`: through
`ModelGateway`. No other path exists. A direct import of
`anthropic` / `openai` / any provider SDK outside
`src/lib/gateway/**` is a forbidden pattern (ARCH1 §2.2, §12.3).

### 3.5 Audit ledger closes every loop

The `AuditLedger` receives a row for:
- Every gateway call (step 10).
- Every gate verdict (Steward → Governance Plane).
- Every tool mutation (step 14).
- Every refusal at any step.

The audit ledger is append-only, tenant-isolated, and replayable.

---

## 4. How the path varies by surface

| Surface | Work object kind | Lead agent | Gateway role | Mutation path |
|---|---|---|---|---|
| Programs detail | `program` | Nexus | `narrate` (optional) | Deliverable promotion; phase advance |
| Tower | `portfolio` | Atlas | `compose` | Read-only (Tower is reactive) |
| Intelligence | `pattern` | Sentinel | `narrate` | None (detection is read-only) |
| Maestro workshop | `workshop` | Nexus | `compose` | Workshop scheduling; agenda accept |
| Steward gate review | `phase` | Steward | none (deterministic) | Gate verdict record |
| Solutions | `solution` | Nexus | `compose` | Solution recommendation accept |
| Admin / dataset | `dataset` | Steward | none / `narrate` | Dataset write via dataset tool |
| Source | `source_event` | Nexus | `narrate` | Source event + artifact via tool |

Every surface flows through the same full path. The variation is which
work object is resolved, which agent leads, and whether the gateway is
invoked at all (deterministic surfaces skip steps 9 / 10).

---

## End of ABARVA_REQUEST_TO_CONTEXT_FLOW

Read ABARVA_DATA_EVIDENCE_FLOW next for the data ingestion to evidence
usability flowchart.
