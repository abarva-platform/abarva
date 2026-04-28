// AZLAB3 - Private Data Plane Connector Stub.
//
// Pure deterministic stub that represents the boundary surface between
// AbarVa and a customer-owned (private) data plane endpoint. AZLAB3
// names the request / response contract types and exposes a factory
// function that NEVER opens a real network connection, uses real
// credentials, or calls any provider SDK.
//
// This is intentional. Live private data plane wiring is deferred to a
// future Azure Private Endpoint / VNET integration slice. AZLAB3
// establishes the typed stub surface that future slices must honor:
//
//   1. No real connection - config.isRealConnection is typed as the
//      literal false and cannot be overridden to true from outside.
//   2. No real credentials - config.noRealCredentials is typed as the
//      literal true; placeholder env-var names are documented but
//      never read, and the stub never reads process.env.
//   3. Raw data blocked at every operation - every response type
//      carries rawContentBlocked: true, rawDataBlocked: true, or
//      containsRawData: false to make the absence of real data
//      structurally visible to callers.
//   4. Deterministic only - all responses are fixture values; there
//      is no randomness, no Date.now, and no network I/O.
//   5. Audit boundary - every stub interaction returns simulatedOnly:
//      true so surfaces cannot present stub responses as live reads.
//
// AZLAB3 explicitly DOES NOT:
//   - import any provider SDK (no @azure/, no aws-sdk, no openai,
//     no anthropic, no @anthropic-ai/sdk).
//   - call fetch, Date.now, Math.random, or new Date.
//   - read from src/lib/source/, src/lib/nexus/, src/lib/sentinel/,
//     src/lib/atlas/, src/lib/agent/, src/lib/auth/, supabase.
//   - render any UI or invoke any agent runtime.
//   - read process.env or any runtime environment variable.
//   - add 'use client'.

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type ConnectorStatus =
  | 'unavailable'
  | 'dry_run'
  | 'simulated'
  | 'lab_mode';

export type StubMode = 'dry_run' | 'lab_simulation' | 'fixture';

export interface ConnectorConfig {
  mode: StubMode;
  /** Placeholder string documenting the future endpoint shape.
   *  Never a real hostname or URL; never read as a live value. */
  endpointPlaceholder: string;
  /** Structural guarantee: this stub never opens a real connection. */
  isRealConnection: false;
  /** Structural guarantee: this stub never reads real credentials. */
  noRealCredentials: true;
  /** Structural guarantee: all operations return deterministic
   *  fixture responses with no nondeterministic side effects. */
  deterministicOnly: true;
}

export interface DataPlaneStatusResponse {
  status: ConnectorStatus;
  planeId: string;
  isSimulated: true;
  note: string;
}

export interface EvidenceManifestResponse {
  requestId: string;
  manifestEntries: number;
  /** Structural guarantee: this stub never surfaces raw client data. */
  containsRawData: false;
  simulatedOnly: true;
  entries: {
    datasetId: string;
    summaryAvailable: boolean;
    approvalState: string;
  }[];
}

export interface ArtifactMetadataResponse {
  artifactId: string;
  name: string;
  artifactType: string;
  sizeEstimate: string;
  /** Structural guarantee: raw artifact bytes are never returned. */
  rawContentBlocked: true;
  simulatedOnly: true;
}

export interface DatasetSummaryResponse {
  datasetId: string;
  /** Row count expressed as a range string, never an exact count. */
  rowCountRange: string;
  columnCount: number;
  /** Structural guarantee: raw dataset rows are never returned. */
  rawDataBlocked: true;
  simulatedOnly: true;
  /** Deterministic trust score 0–1 from the fixture. */
  trustScore: number;
}

export interface ModelGatewayPolicyResponse {
  policy: {
    allowedModels: string[];
    rateLimitHint: string;
  };
  simulatedOnly: true;
}

export interface BoundaryAuditEventResponse {
  eventId: string;
  /** Structural guarantee: the stub records the audit surface event. */
  recorded: true;
  simulatedOnly: true;
}

// ---------------------------------------------------------------------
// Connector interface
// ---------------------------------------------------------------------

export interface PrivateDataPlaneConnectorStub {
  /** Read-only config snapshot describing this stub instance. */
  config: ConnectorConfig;

  /** Returns the simulated status of the private data plane endpoint.
   *  Always returns { status: 'lab_mode', isSimulated: true }; the live
   *  connector will poll the real endpoint health check instead. */
  getPrivateDataPlaneStatus(): DataPlaneStatusResponse;

  /** Returns a deterministic evidence manifest for the supplied dataset
   *  IDs. containsRawData is always false; the live connector will
   *  retrieve the actual manifest over a private endpoint. */
  requestEvidenceManifest(datasetIds: string[]): EvidenceManifestResponse;

  /** Returns deterministic artifact metadata for the supplied artifact
   *  ID. rawContentBlocked is always true; the live connector will
   *  retrieve the actual metadata header over a private endpoint. */
  requestArtifactMetadata(artifactId: string): ArtifactMetadataResponse;

  /** Returns a deterministic dataset summary for the supplied dataset
   *  ID. rawDataBlocked is always true; the live connector will compute
   *  a real aggregate summary over the private data plane. */
  requestDatasetSummary(datasetId: string): DatasetSummaryResponse;

  /** Returns a deterministic model gateway policy snapshot.
   *  simulatedOnly is always true; the live connector will query the
   *  real gateway policy registry. */
  requestModelGatewayPolicy(): ModelGatewayPolicyResponse;

  /** Records a boundary audit event of the supplied type.
   *  recorded is always true; the live connector will emit the event
   *  to the real audit stream over the private endpoint. */
  recordBoundaryAuditEvent(eventType: string): BoundaryAuditEventResponse;
}

// ---------------------------------------------------------------------
// Deterministic hash helper (no crypto, no Date, no random)
// ---------------------------------------------------------------------

function deterministicHashHex(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  }
  const unsigned = (h >>> 0).toString(16).padStart(8, '0');
  const lenComponent = (input.length & 0xffff).toString(16).padStart(4, '0');
  return (unsigned + lenComponent).slice(0, 12);
}

// ---------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------

const STUB_NOTE =
  'Private data plane connector stub: no real connection, no real credentials, ' +
  'raw data blocked at all operations. Lab / simulation mode only.';

const STUB_PLANE_ID = 'azlab3-private-data-plane-stub-v1';

const STUB_ALLOWED_MODELS = [
  'canonical_balanced_compose_v1',
  'canonical_economy_compose_v1',
];

export function createPrivateDataPlaneConnectorStub(
  mode: StubMode = 'dry_run',
): PrivateDataPlaneConnectorStub {
  const config: ConnectorConfig = {
    mode,
    endpointPlaceholder: 'https://<private-endpoint-placeholder>.privatelink.azurewebsites.net',
    isRealConnection: false,
    noRealCredentials: true,
    deterministicOnly: true,
  };

  return {
    config,

    getPrivateDataPlaneStatus(): DataPlaneStatusResponse {
      return {
        status: 'lab_mode',
        planeId: STUB_PLANE_ID,
        isSimulated: true,
        note: STUB_NOTE,
      };
    },

    requestEvidenceManifest(datasetIds: string[]): EvidenceManifestResponse {
      const safeIds = Array.isArray(datasetIds) ? datasetIds : [];
      const entries = safeIds.map((id) => ({
        datasetId: id,
        summaryAvailable: true,
        approvalState: 'approved_for_summary',
      }));
      return {
        requestId: 'azlab3-manifest-' + deterministicHashHex(safeIds.join('|')),
        manifestEntries: entries.length,
        containsRawData: false,
        simulatedOnly: true,
        entries,
      };
    },

    requestArtifactMetadata(artifactId: string): ArtifactMetadataResponse {
      const safeId = typeof artifactId === 'string' && artifactId.length > 0
        ? artifactId
        : 'unknown';
      return {
        artifactId: safeId,
        name: 'stub-artifact-' + deterministicHashHex(safeId),
        artifactType: 'dataset_export',
        sizeEstimate: '10MB–50MB (simulated)',
        rawContentBlocked: true,
        simulatedOnly: true,
      };
    },

    requestDatasetSummary(datasetId: string): DatasetSummaryResponse {
      const safeId = typeof datasetId === 'string' && datasetId.length > 0
        ? datasetId
        : 'unknown';
      // Deterministic column count derived from hash length component (0–15).
      const hashHex = deterministicHashHex(safeId);
      const columnCount = (parseInt(hashHex.slice(8, 12), 16) & 0x1f) + 4;
      return {
        datasetId: safeId,
        rowCountRange: '1,000–10,000 (simulated)',
        columnCount,
        rawDataBlocked: true,
        simulatedOnly: true,
        trustScore: 0.72,
      };
    },

    requestModelGatewayPolicy(): ModelGatewayPolicyResponse {
      return {
        policy: {
          allowedModels: STUB_ALLOWED_MODELS,
          rateLimitHint: '100 req/min (simulated)',
        },
        simulatedOnly: true,
      };
    },

    recordBoundaryAuditEvent(eventType: string): BoundaryAuditEventResponse {
      const safeType =
        typeof eventType === 'string' && eventType.length > 0
          ? eventType
          : 'unknown_event';
      return {
        eventId: 'azlab3-audit-' + deterministicHashHex(safeType),
        recorded: true,
        simulatedOnly: true,
      };
    },
  };
}
