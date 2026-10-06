type SourceIntegrationClientKey = "apexretail" | "northstar";

const mockSourceIntegrationClients: Record<
  SourceIntegrationClientKey,
  {
    id: string;
    name: string;
    industry_code: string;
    key: SourceIntegrationClientKey;
  }
> = {
  apexretail: {
    id: "client-apex",
    name: "Retail Demo",
    industry_code: "RETAIL",
    key: "apexretail",
  },
  northstar: {
    id: "client-northstar",
    name: "Clinical Technology Demo",
    industry_code: "CLINICAL_TECHNOLOGY",
    key: "northstar",
  },
};

let mockSourceIntegrationClientKey: SourceIntegrationClientKey = "northstar";

const mockSourceIntegrationEventsAdapter = {
  getPendingEventsForClient: jest.fn(async () => []),
  getActiveEventsForClient: jest.fn(async () => []),
  getEventByIdForClient: jest.fn(async () => null),
  getEventByCodeForClient: jest.fn(async () => null),
};

export function useSourceIntegrationTenant(
  clientKey: SourceIntegrationClientKey,
) {
  mockSourceIntegrationClientKey = clientKey;
}

export function resetSourceIntegrationTenant() {
  mockSourceIntegrationClientKey = "northstar";
}

function currentClient() {
  return mockSourceIntegrationClients[mockSourceIntegrationClientKey];
}

function currentTenancy() {
  const client = currentClient();
  return {
    clientId: client.id,
    clientKey: client.key,
    userId: `integration:${client.key}`,
    personId: `person:${client.key}`,
    role: "client_admin",
    email: `source.integration+${client.key}@example.test`,
  };
}

jest.mock("@/lib/active-client", () => ({
  ACTIVE_CLIENT_COOKIE: "abarva_active_client",
  TenantLookupUnavailableError: class TenantLookupUnavailableError extends Error {
    constructor(cause?: unknown) {
      super("tenant_lookup_unavailable");
      this.name = "TenantLookupUnavailableError";
      this.cause = cause;
    }
  },
  getActiveClientKey: jest.fn(async () => currentClient().key),
  getActiveClientRow: jest.fn(async () => currentClient()),
  hasLockedTenantSession: jest.fn(async () => true),
}));

jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(async () => currentTenancy()),
}));

jest.mock("@/lib/auth/source-access-policy", () => ({
  allowedSourceEventIdsForUser: jest.fn(async () => null),
  canReadSourceEvent: jest.fn(async () => true),
  loadUserSourceAccessPolicy: jest.fn(async () => {
    const client = currentClient();
    return {
      userId: `integration:${client.key}`,
      clientId: client.id,
      activeClientKey: client.key,
      accessLevel: "client_admin",
      sourceScope: "all_client_source_events",
      sourceEventIdsAllowed: null,
      canAdminUsers: false,
      canCreateSourceEvents: true,
      canApproveSourceStages: true,
      canApproveAward: true,
      canUploadSourceArtifacts: true,
      canGenerateSourcingArtifacts: true,
      canPublishSourcingArtifacts: true,
      holdingGroupId: null,
      holdingGroupRole: "none",
      federatedScope: "none",
      canReadHoldingGroupAggregates: false,
      canReadSiblingTransactionGrain: false,
      canViewFinancialData: true,
      allowedDataClasses: [
        "public",
        "internal",
        "confidential",
        "restricted_financial",
      ],
      deniedDataClasses: ["restricted_phi_pii", "admin_only"],
      outputPolicy: {
        exactFinancialValues: true,
        financialSummaries: true,
        restrictedSourceIds: true,
        saveRestrictedContentToArtifacts: true,
      },
    };
  }),
}));

jest.mock("@/lib/data-plane/read-adapters/sourceEventsReadAdapter", () => ({
  selectSourceEventsReadAdapter: jest.fn(
    () => mockSourceIntegrationEventsAdapter,
  ),
}));
