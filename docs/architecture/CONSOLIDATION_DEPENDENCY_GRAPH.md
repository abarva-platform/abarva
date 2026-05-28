# Consolidation Dependency Graph

Date: 2026-05-28
Packet: Packet 30 Phase 0
Status: Audit-only

```mermaid
flowchart TD
  subgraph Presentation["Presentation"]
    Home["/home and maestro pages"]
    Admin["/admin and context-layer pages"]
    SourcePages["/source pages"]
    TowerPages["/tower pages"]
    MovesPages["/strategic-moves and /programs pages"]
  end

  subgraph Orchestration["Orchestration"]
    AskRoute["/api/intelligence/ask"]
    SourceRoutes["/api/v1/source and /api/source routes"]
    ProgramRoutes["/api/programs and /api/v1/programs routes"]
    AdminRoutes["/api/admin routes"]
    OnboardingRoutes["/api/onboarding routes"]
  end

  subgraph TenantResolution["Current Tenant Resolution"]
    ActiveClient["src/lib/active-client.ts"]
    ClientConfig["src/lib/client-config.ts"]
    TenantKeys["src/lib/tenant-keys.ts"]
    AskFallback["src/lib/intelligence/ask/tenant-key-resolution.ts"]
    FeatureAliases["src/lib/features/is-feature-enabled.ts"]
  end

  subgraph Retrieval["Current Retrieval and Reasoning"]
    AskCore["src/lib/intelligence/ask/index.ts"]
    EnterpriseContext["src/lib/knowledge/tenant-enterprise-context.ts"]
    TechContext["src/lib/knowledge/tenant-technology-context.ts"]
    AgentBroker["src/lib/knowledge/agent-context-broker.ts"]
    AzureRetriever["src/lib/azure-search/tenant-context-retriever.ts"]
    SentinelClassifier["src/lib/agents/sentinel-reasoning/intent-classifier.ts"]
    SentinelState["src/lib/agents/sentinel-reasoning/state-machine.ts"]
  end

  subgraph DataPlane["Current Data Plane"]
    AzureSession["src/lib/data-plane/read-adapters/azureSession.ts"]
    TenantDataAdapter["src/lib/knowledge/tenant-data/adapter.ts"]
    SupabaseCompat["src/lib/supabase-server.ts"]
    ReadAdapters["src/lib/data-plane/read-adapters/*"]
    WriteAdapters["src/lib/data-plane/write-adapters/*"]
  end

  subgraph Verifier["Current Verification"]
    VerifierWrapper["scripts/skyharbor/07_verify/ground_truth_runner.mjs"]
    VerifierImpl["scripts/skyharbor/stages/07_verify/ground_truth_runner.mjs"]
  end

  Home --> ActiveClient
  Admin --> ActiveClient
  SourcePages --> ActiveClient
  TowerPages --> ActiveClient
  MovesPages --> ActiveClient

  AskRoute --> ActiveClient
  AskRoute --> AskFallback
  AskRoute --> AskCore
  AskRoute --> SentinelClassifier
  AskRoute --> SentinelState

  SourceRoutes --> ActiveClient
  ProgramRoutes --> ActiveClient
  AdminRoutes --> ActiveClient
  OnboardingRoutes --> SupabaseCompat

  ActiveClient --> ClientConfig
  ActiveClient --> SupabaseCompat
  AskFallback --> ClientConfig
  FeatureAliases --> ClientConfig

  AskCore --> EnterpriseContext
  AskCore --> TechContext
  EnterpriseContext --> TenantDataAdapter
  EnterpriseContext --> AzureSession
  EnterpriseContext --> TenantKeys
  TechContext --> TenantDataAdapter
  AgentBroker --> EnterpriseContext
  AzureRetriever --> TenantKeys
  SentinelState --> AgentBroker

  TenantDataAdapter --> ReadAdapters
  ReadAdapters --> SupabaseCompat
  ReadAdapters --> AzureSession
  WriteAdapters --> SupabaseCompat
  WriteAdapters --> AzureSession

  VerifierWrapper --> VerifierImpl
  VerifierImpl --> AskRoute
```

## Target Graph After Packet 30

```mermaid
flowchart TD
  Presentation["Presentation"] --> Orchestration["Orchestration"]
  Orchestration --> Resolver["src/lib/tenant/resolveTenant.ts"]
  Resolver --> CanonicalTenant["CanonicalTenant"]
  Orchestration --> Domain["Domain services"]
  CanonicalTenant --> Domain
  Domain --> Coverage["src/lib/knowledge/coverage.ts"]
  Domain --> Retrieval["Retrievers returning sources + CoverageReport"]
  Retrieval --> AzureRead["src/lib/data-plane/azureRead.ts"]
  Domain --> ModelClients["src/lib/model-clients/*"]
  ModelClients --> Audit["src/lib/audit/*"]
  Verifier["Node-fetch verifier"] --> Orchestration
```

## Gaps Represented

- `CanonicalTenant` does not exist yet.
- `resolveTenant()` does not exist yet.
- `coverage.ts` does not exist yet.
- Runtime data plane still has Supabase compatibility paths.
- Verifier still calls the live route without the Packet 30 harness/product taxonomy.
