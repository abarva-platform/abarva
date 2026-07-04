'use client';

// Source File Cabinet — durable artifact vault for a Source event. Lists every
// generated deliverable, uploaded evidence, template, session, and approval artifact
// (stored in Azure Blob), grouped, with version + status chips and durable
// download links. History (superseded versions) is opt-in.

import { useCallback, useEffect, useState } from 'react';

interface Artifact {
  id: string;
  artifactGroup: string;
  artifactType: string;
  title: string;
  fileName: string;
  fileFormat: string;
  version: number;
  status: string;
  lifecycleState: string;
  generatedAt: string;
  fileSize?: number | null;
  isClientFinal?: boolean;
  isCurrentAuthoritative?: boolean;
  citationReady: boolean;
  missingInputs: string[];
  sourcingStage: string | null;
}

interface StructuredEvidenceFamily {
  family: string;
  label: string;
  rowCount: number;
  acceptedRows: number;
  status: 'loaded' | 'partial' | 'missing';
}

interface StructuredEvidenceMetric {
  key: string;
  label: string;
  value: number;
  unit: string;
  family: string;
  confidence: number;
}

interface StructuredEvidenceSummary {
  manifests: Array<{
    evidencePackName: string;
    validationStatus: string;
    rowCount: number;
    coveredRequiredFamilyCount: number;
    requiredFamilyCount: number;
  }>;
  families: StructuredEvidenceFamily[];
  metrics: StructuredEvidenceMetric[];
  findings: Array<{ key: string; label: string; evidence: string; implication: string }>;
  userFacingSummary: string;
}

const NAVY = '#0C1A3A';
const GROUP_LABELS: Record<string, string> = {
  generated: 'Generated Deliverables',
  upload: 'Uploaded Evidence',
  template: 'Templates',
  session: 'Meeting / Session Artifacts',
  approval: 'Approval / Gate Artifacts',
};
const STATUS_COLOR: Record<string, string> = {
  issue_ready: '#1f7a3d', approved: '#1f7a3d', preliminary: '#8a6d1a', draft: '#6b6b6b',
  client_to_complete: '#1d5e87', legal_review_required: '#8a6d1a', procurement_review_required: '#8a6d1a',
  pricing_review_required: '#8a6d1a', blocked: '#b3261e', superseded: '#9a9a9a', retired: '#9a9a9a',
};
const EXPORT_READY_ARTIFACTS: Record<string, Array<'docx' | 'xlsx' | 'pdf'>> = {
  d09_rfp_pack: ['docx', 'pdf'],
  d11_response_checklist: ['xlsx', 'docx', 'pdf'],
  d16_scorecard: ['xlsx', 'docx', 'pdf'],
  d22_bafo_question_pack: ['docx', 'xlsx', 'pdf'],
  d24_decision_brief: ['pdf', 'docx'],
};

const EXPORT_READY_DISPLAY: Record<string, string> = {
  d09_rfp_pack: 'RFP Pack',
  d11_response_checklist: 'Response Control Pack',
  d16_scorecard: 'Evaluation Scorecard',
  d22_bafo_question_pack: 'BAFO Question Pack',
  d24_decision_brief: 'Executive Decision Brief',
};

function Chip({ text, color }: { text: string; color?: string }) {
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${color ?? '#6b6b6b'}1a`, color: color ?? '#6b6b6b' }}>{text}</span>;
}

export function FileCabinetPanel({ eventId, eventName }: { eventId: string; eventName?: string }) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Artifact[]>>({});
  const [structuredEvidence, setStructuredEvidence] = useState<StructuredEvidenceSummary | null>(null);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/source/events/${eventId}/artifacts${includeHistory ? '?includeHistory=1' : ''}`);
      const data = (await res.json()) as {
        artifacts?: Artifact[];
        grouped?: Record<string, Artifact[]>;
        structuredEvidence?: StructuredEvidenceSummary;
        detail?: string;
      };
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`);
      setArtifacts(data.artifacts ?? []);
      setGrouped(data.grouped ?? {});
      setStructuredEvidence(data.structuredEvidence ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load file cabinet');
    } finally {
      setLoading(false);
    }
  }, [eventId, includeHistory]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div style={{ maxWidth: 1000, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 24, color: NAVY, margin: 0 }}>File Cabinet</h1>
          <p style={{ color: '#706D66', fontSize: 13, marginTop: 4 }}>
            Every artifact for {eventName ? <strong>{eventName}</strong> : 'this sourcing event'} — durably stored in Azure Blob, versioned, and re-downloadable.
          </p>
        </div>
        <label style={{ fontSize: 12, color: '#706D66', display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={includeHistory} onChange={(e) => setIncludeHistory(e.target.checked)} />
          Show historical versions
        </label>
      </header>

      {loading && <div style={{ color: '#706D66', fontSize: 13 }}>Loading artifacts…</div>}
      {error && <div style={{ padding: '10px 12px', background: 'rgba(179,38,30,0.06)', border: '1px solid rgba(179,38,30,0.3)', borderRadius: 6, color: '#B3261E', fontSize: 13 }}>{error}</div>}
      {!loading && !error && artifacts.length === 0 && (
        <div style={{ color: '#706D66', fontSize: 13, padding: 16, background: '#fff', border: '1px solid #e4e1da', borderRadius: 8 }}>
          No artifacts yet. Generated deliverables, uploaded evidence, and approval records will appear here automatically.
        </div>
      )}

      {!loading && !error && structuredEvidence && structuredEvidence.manifests.length > 0 && (
        <section style={{ background: '#fff', border: '1px solid #d9e7dd', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: '#edf7f0', fontWeight: 600, fontSize: 13, color: NAVY }}>
            Structured evidence <span style={{ color: '#5f7f69', fontWeight: 400 }}>({structuredEvidence.families.length} areas)</span>
          </div>
          <div style={{ padding: '12px 14px', display: 'grid', gap: 12 }}>
            <p style={{ margin: 0, color: '#3f4b5f', fontSize: 13 }}>{structuredEvidence.userFacingSummary}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
              {structuredEvidence.families.map((family) => (
                <div key={family.family} style={{ border: '1px solid #e5e9e4', borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 12, color: '#6f7b8d' }}>{family.label}</div>
                  <div style={{ fontWeight: 700, color: NAVY }}>{family.acceptedRows}/{family.rowCount} records</div>
                  <div style={{ marginTop: 4 }}><Chip text={family.status} color={family.status === 'loaded' ? '#1f7a3d' : '#8a6d1a'} /></div>
                </div>
              ))}
            </div>
            {structuredEvidence.metrics.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {structuredEvidence.metrics.slice(0, 6).map((metric) => (
                  <div key={metric.key} style={{ border: '1px solid #e5e1d7', borderRadius: 8, padding: '8px 10px', minWidth: 170 }}>
                    <div style={{ fontSize: 11, color: '#7d756b' }}>{metric.label}</div>
                    <div style={{ color: NAVY, fontWeight: 700 }}>{formatStructuredEvidenceMetric(metric)}</div>
                  </div>
                ))}
              </div>
            )}
            {structuredEvidence.findings.length > 0 && (
              <div style={{ borderTop: '1px solid #edf0ea', paddingTop: 10, color: '#3f4b5f', fontSize: 13 }}>
                <strong style={{ color: NAVY }}>Supported finding:</strong> {structuredEvidence.findings[0]?.label} — {structuredEvidence.findings[0]?.implication}
              </div>
            )}
          </div>
        </section>
      )}

      {!loading && !error && ['generated', 'upload', 'template', 'session', 'approval'].map((group) => {
        const items = grouped[group] ?? [];
        if (items.length === 0) return null;
        return (
          <section key={group} style={{ background: '#fff', border: '1px solid #e4e1da', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: '#f1efe9', fontWeight: 600, fontSize: 13, color: NAVY }}>
              {GROUP_LABELS[group]} <span style={{ color: '#9a9a9a', fontWeight: 400 }}>({items.length})</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {items.map((a) => {
                  const exportReadyType = exportReadyArtifactType(a);
                  return (
                  <tr key={a.id} style={{ borderTop: '1px solid #efece5', opacity: a.lifecycleState === 'current' ? 1 : 0.6 }}>
                    <td style={{ padding: '9px 14px' }}>
                      <div style={{ fontWeight: 600 }}>{exportReadyType ? EXPORT_READY_DISPLAY[exportReadyType] : a.title}</div>
                      <div style={{ color: '#9a9a9a', fontSize: 11 }}>{fileCabinetMeta(a)}</div>
                      {a.missingInputs.length > 0 && <div style={{ color: '#8a6d1a', fontSize: 11, marginTop: 2 }}>Missing: {a.missingInputs.slice(0, 4).join(', ')}</div>}
                    </td>
                    <td style={{ padding: '9px 8px', whiteSpace: 'nowrap' }}><Chip text={`v${a.version}`} color="#1d5e87" /></td>
                    <td style={{ padding: '9px 8px', whiteSpace: 'nowrap' }}><Chip text={a.status.replace(/_/g, ' ')} color={STATUS_COLOR[a.status]} /></td>
                    <td style={{ padding: '9px 8px', whiteSpace: 'nowrap', color: '#9a9a9a', fontSize: 11 }}>{a.generatedAt?.slice(0, 10)}</td>
                    <td style={{ padding: '9px 14px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <a
                        href={`/api/v1/source/artifacts/${a.id}/download${a.fileFormat === 'html' ? '?format=html' : ''}`}
                        target={a.fileFormat === 'html' ? '_blank' : undefined}
                        rel={a.fileFormat === 'html' ? 'noopener noreferrer' : undefined}
                        style={{ color: '#fff', background: NAVY, padding: '5px 12px', borderRadius: 5, textDecoration: 'none', fontSize: 12, fontWeight: 600 }}
                      >
                        {a.fileFormat === 'html' ? 'Preview' : 'Download'}
                      </a>
                      {exportReadyType ? EXPORT_READY_ARTIFACTS[exportReadyType]?.map((format) => (
                        <a
                          key={format}
                          href={`/api/v1/source/${encodeURIComponent(eventId)}/artifacts/${encodeURIComponent(exportReadyType)}/render?format=${format}`}
                          download
                          style={{
                            marginLeft: 8,
                            color: NAVY,
                            background: '#fff',
                            border: '1px solid #d9d5cc',
                            padding: '5px 10px',
                            borderRadius: 5,
                            textDecoration: 'none',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {format.toUpperCase()}
                        </a>
                      )) : null}
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}

function formatStructuredEvidenceMetric(metric: StructuredEvidenceMetric): string {
  if (metric.unit === 'USD') return `$${Math.round(metric.value).toLocaleString('en-US')}`;
  if (metric.unit === 'FTE') return `${metric.value.toLocaleString('en-US')} FTE`;
  return `${metric.value.toLocaleString('en-US')} ${metric.unit}`;
}

function fileCabinetMeta(artifact: Artifact): string {
  const stage = artifact.sourcingStage ? ` · ${artifact.sourcingStage}` : '';
  const exportReadyType = exportReadyArtifactType(artifact);
  if (artifact.isClientFinal && artifact.isCurrentAuthoritative) {
    return `${artifact.fileName} · Client-approved final · authoritative${stage}`;
  }
  if (exportReadyType) {
    return `${artifact.fileName} · Export-ready deliverable${stage}`;
  }
  if (artifact.artifactGroup === 'upload') {
    return `${artifact.fileName} · Uploaded evidence${stage}`;
  }
  return `${artifact.fileName} · ${artifact.fileFormat.toUpperCase()}${stage}`;
}

function exportReadyArtifactType(artifact: Artifact): string | null {
  if (EXPORT_READY_ARTIFACTS[artifact.artifactType]) return artifact.artifactType;
  const haystack = `${artifact.artifactType} ${artifact.title} ${artifact.fileName}`.toLowerCase();
  if (/\bd09[_-]?rfp[_-]?(pack|package)\b|rfp[_-]?pack/.test(haystack)) return 'd09_rfp_pack';
  if (/\bd11[_-]?(response[_-]?(checklist|control[_-]?pack)|vendor[_-]?response[_-]?control[_-]?pack)\b|response[_-]?control[_-]?pack/.test(haystack)) return 'd11_response_checklist';
  if (/\bd16[_-]?scorecard\b|evaluation[_-]?scorecard/.test(haystack)) return 'd16_scorecard';
  if (/\bd22[_-]?bafo[_-]?question[_-]?pack\b|bafo[_-]?(instruction|question)[_-]?pack/.test(haystack)) return 'd22_bafo_question_pack';
  if (/\bd24[_-]?decision[_-]?brief\b|decision[_-]?brief/.test(haystack)) return 'd24_decision_brief';
  return null;
}
