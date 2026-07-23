import {
  buildSourceArtifactParseBacklogReport,
  parseReadinessForArtifact,
  searchReadinessForArtifact,
} from '../parse-backlog';
import type { SourceArtifactRegistryRecord } from '../types';

function artifact(
  overrides: Partial<SourceArtifactRegistryRecord>,
): SourceArtifactRegistryRecord {
  return {
    id: overrides.id ?? 'artifact-1',
    tenantKey: overrides.tenantKey ?? 'apex-retail',
    sourceEventId: overrides.sourceEventId ?? 'apex-event',
    sourceEventRowId: overrides.sourceEventRowId ?? null,
    stageKey: overrides.stageKey ?? 'strategy',
    artifactFamily: overrides.artifactFamily ?? 'meeting_notes',
    artifactKind: overrides.artifactKind ?? 'source_session_notes',
    sourceOrigin: overrides.sourceOrigin ?? 'uploaded',
    sourceFormat: overrides.sourceFormat ?? 'txt',
    originalName: overrides.originalName ?? 'notes.txt',
    blobUri: overrides.blobUri ?? 'azure://source-artifacts/notes.txt',
    uploaderUserId: overrides.uploaderUserId ?? 'operator',
    mimeType: overrides.mimeType ?? 'text/plain',
    sizeBytes: overrides.sizeBytes ?? 100,
    sha256: overrides.sha256 ?? 'sha',
    parseStatus: overrides.parseStatus ?? 'pending',
    embeddingStatus: overrides.embeddingStatus ?? 'pending',
    graphStatus: overrides.graphStatus ?? 'pending',
    classificationStatus: overrides.classificationStatus ?? 'classified',
    dataClassification: overrides.dataClassification ?? 'Confidential',
    evidenceState: overrides.evidenceState ?? 'unparsed',
    approvalState: overrides.approvalState ?? 'not_required',
    description: overrides.description ?? null,
    isClientFinal: overrides.isClientFinal ?? false,
    isCurrentAuthoritative: overrides.isCurrentAuthoritative ?? false,
    sourceGeneratedArtifactId: overrides.sourceGeneratedArtifactId ?? null,
    clientFinalUploadedBy: overrides.clientFinalUploadedBy ?? null,
    clientFinalUploadedAt: overrides.clientFinalUploadedAt ?? null,
    clientFinalAcceptedBy: overrides.clientFinalAcceptedBy ?? null,
    clientFinalAcceptedAt: overrides.clientFinalAcceptedAt ?? null,
    clientFinalNote: overrides.clientFinalNote ?? null,
    clientFinalReviewMeetingDate:
      overrides.clientFinalReviewMeetingDate ?? null,
    clientFinalStakeholderGroup:
      overrides.clientFinalStakeholderGroup ?? null,
    clientFinalChangeSummary: overrides.clientFinalChangeSummary ?? {},
    citedSourceArtifactIds: overrides.citedSourceArtifactIds ?? [],
    disclosureFlag: overrides.disclosureFlag,
    version: overrides.version ?? 1,
    supersedesArtifactVersionId:
      overrides.supersedesArtifactVersionId ?? null,
    createdBy: overrides.createdBy ?? 'operator',
    validatedBy: overrides.validatedBy ?? null,
    createdAt: overrides.createdAt ?? '2026-07-22T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-07-22T00:00:00.000Z',
    deletedAt: overrides.deletedAt ?? null,
  };
}

describe('Source artifact parse backlog report', () => {
  it('marks pending text-like uploads parser-ready without claiming they are parsed', () => {
    expect(
      parseReadinessForArtifact({
        parseStatus: 'pending',
        sourceFormat: 'pdf',
      }),
    ).toBe('parser_ready');
  });

  it('keeps image/audio/video pending until governed OCR or transcription exists', () => {
    expect(
      parseReadinessForArtifact({
        parseStatus: 'pending',
        sourceFormat: 'image',
      }),
    ).toBe('unsupported_without_ocr_or_transcription');
    expect(
      parseReadinessForArtifact({
        parseStatus: 'pending',
        sourceFormat: 'audio',
      }),
    ).toBe('unsupported_without_ocr_or_transcription');
    expect(
      parseReadinessForArtifact({
        parseStatus: 'pending',
        sourceFormat: 'video',
      }),
    ).toBe('unsupported_without_ocr_or_transcription');
  });

  it('separates parsed Source evidence from search indexing', () => {
    expect(
      searchReadinessForArtifact({
        parseStatus: 'parsed',
        embeddingStatus: 'pending',
      }),
    ).toBe('parsed_not_indexed');
    expect(
      searchReadinessForArtifact({
        parseStatus: 'parsed',
        embeddingStatus: 'embedded',
      }),
    ).toBe('search_ready');
  });

  it('summarizes parse, search, graph, and attention states without raw content', () => {
    const report = buildSourceArtifactParseBacklogReport({
      clientKey: 'apex-retail',
      inputEventId: 'apex-retail-ams-outsourcing-2026',
      resolvedEventId: 'event-row-id',
      resolvedEventCode: 'APEX-AMS-2026',
      generatedAt: '2026-07-23T00:00:00.000Z',
      artifacts: [
        artifact({
          id: 'parsed-search-ready',
          parseStatus: 'parsed',
          embeddingStatus: 'embedded',
          graphStatus: 'projected',
          sourceFormat: 'txt',
          updatedAt: '2026-07-22T23:00:00.000Z',
        }),
        artifact({
          id: 'pending-pdf',
          parseStatus: 'pending',
          sourceFormat: 'pdf',
          mimeType: 'application/pdf',
          originalName: 'workshop.pdf',
        }),
        artifact({
          id: 'image-needs-ocr',
          parseStatus: 'pending',
          sourceFormat: 'image',
          mimeType: 'image/png',
          originalName: 'whiteboard.png',
        }),
        artifact({
          id: 'failed-parser',
          parseStatus: 'failed',
          sourceFormat: 'docx',
          mimeType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          originalName: 'broken.docx',
        }),
        artifact({
          id: 'stale-parser',
          parseStatus: 'parsing',
          sourceFormat: 'xlsx',
          updatedAt: '2026-07-21T00:00:00.000Z',
        }),
      ],
      staleParsingAfterHours: 24,
    });

    expect(report.status).toBe('attention');
    expect(report.counts.totalArtifacts).toBe(5);
    expect(report.counts.parsedArtifacts).toBe(1);
    expect(report.counts.parserReadyArtifacts).toBe(1);
    expect(report.counts.searchReadyArtifacts).toBe(1);
    expect(report.counts.graphProjectedArtifacts).toBe(1);
    expect(report.counts.failedArtifacts).toBe(1);
    expect(
      report.counts.unsupportedWithoutOcrOrTranscriptionArtifacts,
    ).toBe(1);
    expect(report.counts.staleParsingArtifacts).toBe(1);
    expect(report.attentionItems.map((item) => item.artifactId)).toEqual([
      'image-needs-ocr',
      'failed-parser',
      'stale-parser',
    ]);
    expect(JSON.stringify(report)).not.toContain('raw content');
    expect(report.notes.join(' ')).toContain('no rows were written');
    expect(report.notes.join(' ')).toContain('agent-ready');
  });
});
