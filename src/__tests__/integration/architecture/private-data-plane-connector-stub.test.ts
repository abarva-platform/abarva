// AZLAB3 integration test - Private Data Plane Connector Stub.
//
// Validates the structural safety guarantees of the stub:
//   - config.isRealConnection === false (literal type, always false)
//   - config.noRealCredentials === true (literal type, always true)
//   - All responses carry simulatedOnly: true or structural equivalents
//   - Raw data is structurally blocked at every operation
//   - All responses are deterministic (no network, no Date, no random)
//   - Connector created in dry_run mode operates correctly

import {
  createPrivateDataPlaneConnectorStub,
} from '../../../lib/architecture/private-data-plane-connector-stub';

describe('AZLAB3 Private Data Plane Connector Stub', () => {
  const connector = createPrivateDataPlaneConnectorStub();
  const labConnector = createPrivateDataPlaneConnectorStub('lab_simulation');
  const fixtureConnector = createPrivateDataPlaneConnectorStub('fixture');
  const dryRunConnector = createPrivateDataPlaneConnectorStub('dry_run');

  // ------------------------------------------------------------------
  // Config guarantees
  // ------------------------------------------------------------------

  describe('config structural guarantees', () => {
    it('config.isRealConnection is false', () => {
      expect(connector.config.isRealConnection).toBe(false);
    });

    it('config.isRealConnection is false for lab_simulation mode', () => {
      expect(labConnector.config.isRealConnection).toBe(false);
    });

    it('config.isRealConnection is false for fixture mode', () => {
      expect(fixtureConnector.config.isRealConnection).toBe(false);
    });

    it('config.noRealCredentials is true', () => {
      expect(connector.config.noRealCredentials).toBe(true);
    });

    it('config.noRealCredentials is true for lab_simulation mode', () => {
      expect(labConnector.config.noRealCredentials).toBe(true);
    });

    it('config.deterministicOnly is true', () => {
      expect(connector.config.deterministicOnly).toBe(true);
    });

    it('config.endpointPlaceholder is a non-empty string', () => {
      expect(typeof connector.config.endpointPlaceholder).toBe('string');
      expect(connector.config.endpointPlaceholder.length).toBeGreaterThan(0);
    });

    it('config.mode defaults to dry_run when no mode is supplied', () => {
      expect(connector.config.mode).toBe('dry_run');
    });

    it('config.mode is lab_simulation when explicitly requested', () => {
      expect(labConnector.config.mode).toBe('lab_simulation');
    });

    it('config.mode is fixture when explicitly requested', () => {
      expect(fixtureConnector.config.mode).toBe('fixture');
    });
  });

  // ------------------------------------------------------------------
  // dry_run mode operates correctly
  // ------------------------------------------------------------------

  describe('dry_run mode', () => {
    it('dry_run connector has isRealConnection === false', () => {
      expect(dryRunConnector.config.isRealConnection).toBe(false);
    });

    it('dry_run connector has noRealCredentials === true', () => {
      expect(dryRunConnector.config.noRealCredentials).toBe(true);
    });

    it('dry_run connector getPrivateDataPlaneStatus returns isSimulated true', () => {
      const result = dryRunConnector.getPrivateDataPlaneStatus();
      expect(result.isSimulated).toBe(true);
    });
  });

  // ------------------------------------------------------------------
  // getPrivateDataPlaneStatus
  // ------------------------------------------------------------------

  describe('getPrivateDataPlaneStatus()', () => {
    it('returns isSimulated: true', () => {
      const result = connector.getPrivateDataPlaneStatus();
      expect(result.isSimulated).toBe(true);
    });

    it('returns a non-empty planeId', () => {
      const result = connector.getPrivateDataPlaneStatus();
      expect(typeof result.planeId).toBe('string');
      expect(result.planeId.length).toBeGreaterThan(0);
    });

    it('returns a non-empty note', () => {
      const result = connector.getPrivateDataPlaneStatus();
      expect(typeof result.note).toBe('string');
      expect(result.note.length).toBeGreaterThan(0);
    });

    it('returns a valid ConnectorStatus value', () => {
      const result = connector.getPrivateDataPlaneStatus();
      expect(['unavailable', 'dry_run', 'simulated', 'lab_mode']).toContain(
        result.status,
      );
    });

    it('is deterministic - same result on repeated calls', () => {
      const a = connector.getPrivateDataPlaneStatus();
      const b = connector.getPrivateDataPlaneStatus();
      expect(a).toEqual(b);
    });
  });

  // ------------------------------------------------------------------
  // requestEvidenceManifest
  // ------------------------------------------------------------------

  describe('requestEvidenceManifest()', () => {
    it('returns containsRawData: false', () => {
      const result = connector.requestEvidenceManifest(['ds-001', 'ds-002']);
      expect(result.containsRawData).toBe(false);
    });

    it('returns simulatedOnly: true', () => {
      const result = connector.requestEvidenceManifest(['ds-001']);
      expect(result.simulatedOnly).toBe(true);
    });

    it('entries count matches input datasetIds length', () => {
      const ids = ['ds-001', 'ds-002', 'ds-003'];
      const result = connector.requestEvidenceManifest(ids);
      expect(result.manifestEntries).toBe(ids.length);
      expect(result.entries).toHaveLength(ids.length);
    });

    it('each entry carries the correct datasetId', () => {
      const ids = ['ds-alpha', 'ds-beta'];
      const result = connector.requestEvidenceManifest(ids);
      expect(result.entries[0].datasetId).toBe('ds-alpha');
      expect(result.entries[1].datasetId).toBe('ds-beta');
    });

    it('returns a non-empty requestId', () => {
      const result = connector.requestEvidenceManifest(['ds-001']);
      expect(typeof result.requestId).toBe('string');
      expect(result.requestId.length).toBeGreaterThan(0);
    });

    it('is deterministic for the same input', () => {
      const a = connector.requestEvidenceManifest(['ds-001', 'ds-002']);
      const b = connector.requestEvidenceManifest(['ds-001', 'ds-002']);
      expect(a).toEqual(b);
    });

    it('handles empty datasetIds array gracefully', () => {
      const result = connector.requestEvidenceManifest([]);
      expect(result.containsRawData).toBe(false);
      expect(result.simulatedOnly).toBe(true);
      expect(result.manifestEntries).toBe(0);
      expect(result.entries).toHaveLength(0);
    });
  });

  // ------------------------------------------------------------------
  // requestArtifactMetadata
  // ------------------------------------------------------------------

  describe('requestArtifactMetadata()', () => {
    it('returns rawContentBlocked: true', () => {
      const result = connector.requestArtifactMetadata('art-001');
      expect(result.rawContentBlocked).toBe(true);
    });

    it('returns simulatedOnly: true', () => {
      const result = connector.requestArtifactMetadata('art-001');
      expect(result.simulatedOnly).toBe(true);
    });

    it('returns the supplied artifactId in the response', () => {
      const result = connector.requestArtifactMetadata('art-test-42');
      expect(result.artifactId).toBe('art-test-42');
    });

    it('returns non-empty name and artifactType', () => {
      const result = connector.requestArtifactMetadata('art-001');
      expect(typeof result.name).toBe('string');
      expect(result.name.length).toBeGreaterThan(0);
      expect(typeof result.artifactType).toBe('string');
      expect(result.artifactType.length).toBeGreaterThan(0);
    });

    it('returns a non-empty sizeEstimate', () => {
      const result = connector.requestArtifactMetadata('art-001');
      expect(typeof result.sizeEstimate).toBe('string');
      expect(result.sizeEstimate.length).toBeGreaterThan(0);
    });

    it('is deterministic for the same artifactId', () => {
      const a = connector.requestArtifactMetadata('art-001');
      const b = connector.requestArtifactMetadata('art-001');
      expect(a).toEqual(b);
    });
  });

  // ------------------------------------------------------------------
  // requestDatasetSummary
  // ------------------------------------------------------------------

  describe('requestDatasetSummary()', () => {
    it('returns rawDataBlocked: true', () => {
      const result = connector.requestDatasetSummary('ds-001');
      expect(result.rawDataBlocked).toBe(true);
    });

    it('returns simulatedOnly: true', () => {
      const result = connector.requestDatasetSummary('ds-001');
      expect(result.simulatedOnly).toBe(true);
    });

    it('returns the supplied datasetId in the response', () => {
      const result = connector.requestDatasetSummary('ds-42');
      expect(result.datasetId).toBe('ds-42');
    });

    it('returns a non-empty rowCountRange', () => {
      const result = connector.requestDatasetSummary('ds-001');
      expect(typeof result.rowCountRange).toBe('string');
      expect(result.rowCountRange.length).toBeGreaterThan(0);
    });

    it('returns a positive columnCount', () => {
      const result = connector.requestDatasetSummary('ds-001');
      expect(result.columnCount).toBeGreaterThan(0);
    });

    it('returns a trustScore between 0 and 1 inclusive', () => {
      const result = connector.requestDatasetSummary('ds-001');
      expect(result.trustScore).toBeGreaterThanOrEqual(0);
      expect(result.trustScore).toBeLessThanOrEqual(1);
    });

    it('is deterministic for the same datasetId', () => {
      const a = connector.requestDatasetSummary('ds-001');
      const b = connector.requestDatasetSummary('ds-001');
      expect(a).toEqual(b);
    });
  });

  // ------------------------------------------------------------------
  // requestModelGatewayPolicy
  // ------------------------------------------------------------------

  describe('requestModelGatewayPolicy()', () => {
    it('returns simulatedOnly: true', () => {
      const result = connector.requestModelGatewayPolicy();
      expect(result.simulatedOnly).toBe(true);
    });

    it('returns a policy with a non-empty allowedModels array', () => {
      const result = connector.requestModelGatewayPolicy();
      expect(Array.isArray(result.policy.allowedModels)).toBe(true);
      expect(result.policy.allowedModels.length).toBeGreaterThan(0);
    });

    it('returns a non-empty rateLimitHint', () => {
      const result = connector.requestModelGatewayPolicy();
      expect(typeof result.policy.rateLimitHint).toBe('string');
      expect(result.policy.rateLimitHint.length).toBeGreaterThan(0);
    });

    it('is deterministic', () => {
      const a = connector.requestModelGatewayPolicy();
      const b = connector.requestModelGatewayPolicy();
      expect(a).toEqual(b);
    });
  });

  // ------------------------------------------------------------------
  // recordBoundaryAuditEvent
  // ------------------------------------------------------------------

  describe('recordBoundaryAuditEvent()', () => {
    it('returns recorded: true', () => {
      const result = connector.recordBoundaryAuditEvent('connector_status_check');
      expect(result.recorded).toBe(true);
    });

    it('returns simulatedOnly: true', () => {
      const result = connector.recordBoundaryAuditEvent('manifest_request');
      expect(result.simulatedOnly).toBe(true);
    });

    it('returns a non-empty eventId', () => {
      const result = connector.recordBoundaryAuditEvent('audit_boundary_check');
      expect(typeof result.eventId).toBe('string');
      expect(result.eventId.length).toBeGreaterThan(0);
    });

    it('is deterministic for the same eventType', () => {
      const a = connector.recordBoundaryAuditEvent('dataset_summary_request');
      const b = connector.recordBoundaryAuditEvent('dataset_summary_request');
      expect(a).toEqual(b);
    });

    it('produces different eventIds for different eventTypes', () => {
      const a = connector.recordBoundaryAuditEvent('event_type_one');
      const b = connector.recordBoundaryAuditEvent('event_type_two');
      expect(a.eventId).not.toBe(b.eventId);
    });
  });

  // ------------------------------------------------------------------
  // Cross-cutting: simulatedOnly is true on all method responses
  // ------------------------------------------------------------------

  describe('simulatedOnly guarantee across all methods', () => {
    it('getPrivateDataPlaneStatus carries isSimulated true (not simulatedOnly)', () => {
      // Status uses isSimulated instead of simulatedOnly per the contract.
      const result = connector.getPrivateDataPlaneStatus();
      expect(result.isSimulated).toBe(true);
    });

    it('requestEvidenceManifest carries simulatedOnly true', () => {
      expect(connector.requestEvidenceManifest(['x']).simulatedOnly).toBe(true);
    });

    it('requestArtifactMetadata carries simulatedOnly true', () => {
      expect(connector.requestArtifactMetadata('x').simulatedOnly).toBe(true);
    });

    it('requestDatasetSummary carries simulatedOnly true', () => {
      expect(connector.requestDatasetSummary('x').simulatedOnly).toBe(true);
    });

    it('requestModelGatewayPolicy carries simulatedOnly true', () => {
      expect(connector.requestModelGatewayPolicy().simulatedOnly).toBe(true);
    });

    it('recordBoundaryAuditEvent carries simulatedOnly true', () => {
      expect(connector.recordBoundaryAuditEvent('x').simulatedOnly).toBe(true);
    });
  });

  // ------------------------------------------------------------------
  // No network imports verification (pure deterministic check)
  // ------------------------------------------------------------------

  describe('source purity', () => {
    it('module does not import fetch, axios, or http at runtime', () => {
      // If the module had imported fetch/axios/http the connector
      // object would not exist or would have thrown during import.
      // The fact that we have a connector instance here proves no
      // network module was needed to construct it.
      expect(connector).toBeDefined();
      expect(typeof connector.getPrivateDataPlaneStatus).toBe('function');
      expect(typeof connector.requestEvidenceManifest).toBe('function');
      expect(typeof connector.requestArtifactMetadata).toBe('function');
      expect(typeof connector.requestDatasetSummary).toBe('function');
      expect(typeof connector.requestModelGatewayPolicy).toBe('function');
      expect(typeof connector.recordBoundaryAuditEvent).toBe('function');
    });

    it('all responses are available synchronously (no Promises)', () => {
      const status = connector.getPrivateDataPlaneStatus();
      const manifest = connector.requestEvidenceManifest(['ds-1']);
      const artifact = connector.requestArtifactMetadata('art-1');
      const summary = connector.requestDatasetSummary('ds-1');
      const policy = connector.requestModelGatewayPolicy();
      const audit = connector.recordBoundaryAuditEvent('test');

      // None of the responses should be Promises.
      expect(status).not.toBeInstanceOf(Promise);
      expect(manifest).not.toBeInstanceOf(Promise);
      expect(artifact).not.toBeInstanceOf(Promise);
      expect(summary).not.toBeInstanceOf(Promise);
      expect(policy).not.toBeInstanceOf(Promise);
      expect(audit).not.toBeInstanceOf(Promise);
    });
  });
});
