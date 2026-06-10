// Source File Cabinet proof: canonical blob paths, versioned persistence (blob upload +
// metadata + supersede), and tenant-scoped reads. Blob + DB are faked (no Azure/Postgres).
import {
  generatedArtifactPath,
  uploadArtifactPath,
  approvalArtifactPath,
  locationForGroup,
  SOURCE_ARTIFACT_BUCKET,
} from '../blob-store';
import { persistSourceArtifact } from '../service';
import type { SourceArtifactRecord } from '../types';

describe('canonical blob paths', () => {
  it('builds the versioned generated path under the source-events bucket', () => {
    const loc = generatedArtifactPath({ tenantKey: 'skyharbor-air', sourceEventId: 'evt-1', artifactType: 'rfp_package', version: 2, fileName: 'AMS RFP.docx' });
    expect(loc.bucket).toBe(SOURCE_ARTIFACT_BUCKET);
    expect(loc.path).toBe('skyharbor-air/evt-1/generated/rfp_package/v2/AMS_RFP.docx');
  });
  it('builds upload + approval paths with their segments', () => {
    expect(uploadArtifactPath({ tenantKey: 't', sourceEventId: 'e', evidenceFamily: 'sla_baseline', uploadBatchId: 'b1', fileName: 'sla.xlsx' }).path)
      .toBe('t/e/uploads/sla_baseline/b1/sla.xlsx');
    expect(approvalArtifactPath({ tenantKey: 't', sourceEventId: 'e', gateId: 'rfp_design', timestamp: 'v1', fileName: 'approval.html' }).path)
      .toBe('t/e/approvals/rfp_design/v1/approval.html');
  });
  it('routes group → location builder', () => {
    expect(locationForGroup({ group: 'generated', tenantKey: 't', sourceEventId: 'e', artifactType: 'rfp_package', version: 1, fileName: 'f.docx' }).path).toMatch(/\/generated\//);
    expect(locationForGroup({ group: 'approval', tenantKey: 't', sourceEventId: 'e', artifactType: 'rfp_design_gate', version: 1, fileName: 'a.html' }).path).toMatch(/\/approvals\//);
  });
});

describe('persistSourceArtifact — versioning + durable upload', () => {
  function rec(over: Partial<SourceArtifactRecord>): SourceArtifactRecord {
    return { id: 'a1', version: 1, lifecycleState: 'current', artifactType: 'rfp_package', artifactGroup: 'generated', ...over } as SourceArtifactRecord;
  }

  it('v1: uploads bytes to blob and inserts a current row (no supersede)', async () => {
    const uploads: unknown[] = []; let superseded = false; let inserted: Record<string, unknown> | null = null;
    const out = await persistSourceArtifact(
      { clientId: 'c1', tenantKey: 'skyharbor-air', sourceEventId: 'evt-1', artifactGroup: 'generated', artifactType: 'rfp_package', title: 'AMS RFP', fileName: 'AMS RFP.docx', fileFormat: 'docx', bytes: Buffer.from('hello'), status: 'preliminary' },
      {
        getCurrent: async () => [],
        upload: async (loc, bytes) => { uploads.push({ path: loc.path, size: bytes.length }); },
        insert: async (row) => { inserted = row as unknown as Record<string, unknown>; return rec({ id: 'a1', version: row.version, blobPath: row.blobPath }); },
        supersede: async () => { superseded = true; },
      },
    );
    expect(out.version).toBe(1);
    expect(uploads).toHaveLength(1);
    expect((uploads[0] as { path: string }).path).toBe('skyharbor-air/evt-1/generated/rfp_package/v1/AMS_RFP.docx');
    expect(inserted!.version).toBe(1);
    expect(inserted!.blobSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(inserted!.status).toBe('preliminary');
    expect(superseded).toBe(false); // first version → nothing to supersede
  });

  it('v2: computes next version and supersedes the prior current version', async () => {
    let supersedeArgs: unknown[] = [];
    const out = await persistSourceArtifact(
      { clientId: 'c1', tenantKey: 'skyharbor-air', sourceEventId: 'evt-1', artifactGroup: 'generated', artifactType: 'rfp_package', title: 'AMS RFP', fileName: 'AMS RFP.docx', fileFormat: 'docx', bytes: Buffer.from('v2 bytes') },
      {
        getCurrent: async () => [rec({ id: 'a1', version: 1 })],
        upload: async () => {},
        insert: async (row) => { expect(row.supersedesArtifactId).toBe('a1'); return rec({ id: 'a2', version: row.version }); },
        supersede: async (eventId, type, group, newId) => { supersedeArgs = [eventId, type, group, newId]; },
      },
    );
    expect(out.version).toBe(2);
    expect(supersedeArgs).toEqual(['evt-1', 'rfp_package', 'generated', 'a2']);
  });
});
