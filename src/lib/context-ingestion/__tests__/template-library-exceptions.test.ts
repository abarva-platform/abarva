import {
  NORTHSTAR_CONTEXT_TEMPLATES,
  SUPPORTED_CONTEXT_UPLOAD_FORMATS,
  getTemplateById,
  getTemplateFormatCoverage,
} from '../template-registry';
import { assessTemplateUploadAlignment } from '../template-alignment';

describe('context template library exception coverage', () => {
  it('covers every supported upload format for every template through canonical or exception intake', () => {
    const coverage = getTemplateFormatCoverage();

    for (const format of SUPPORTED_CONTEXT_UPLOAD_FORMATS) {
      expect(coverage[format]).toBe(NORTHSTAR_CONTEXT_TEMPLATES.length);
    }
  });

  it('requires document metadata for PDF annual and quarterly results parsing', () => {
    const template = getTemplateById('annual-quarterly-reports');

    expect(template?.acceptedFormats).toContain('pdf');
    expect(template?.exceptionMetadataRequirements.map((item) => item.key)).toEqual(
      expect.arrayContaining([
        'source_system',
        'data_owner',
        'sensitivity_declaration',
        'field_mapping',
        'parse_instructions',
        'document_purpose',
        'authoritative_sections',
        'metric_dictionary',
      ]),
    );
  });

  it('pauses non-aligned structured files until the client supplies a field mapping', () => {
    const assessment = assessTemplateUploadAlignment({
      templateId: 'vendor-contracts',
      format: 'csv',
      headers: ['vendor_id', 'vendor_name', 'renewal_date', 'spend_bucket'],
    });

    expect(assessment.status).toBe('needs_mapping');
    expect(assessment.missingRequiredFields).toEqual(['annual_value_usd']);
    expect(assessment.unknownColumns).toEqual(['spend_bucket']);
    expect(assessment.clarificationRequests.map((request) => request.field)).toEqual([
      'annual_value_usd',
      'spend_bucket',
    ]);
  });

  it('allows non-canonical PDFs only through the controlled metadata exception path', () => {
    const withoutMetadata = assessTemplateUploadAlignment({
      templateId: 'financial-kpi-workbook',
      format: 'pdf',
    });

    expect(withoutMetadata.canonicalFormat).toBe(false);
    expect(withoutMetadata.requiresExceptionApproval).toBe(true);
    expect(withoutMetadata.status).toBe('needs_metadata');
    expect(withoutMetadata.missingMetadataKeys).toEqual(
      expect.arrayContaining(['document_purpose', 'authoritative_sections', 'metric_dictionary']),
    );

    const withMetadata = assessTemplateUploadAlignment({
      templateId: 'financial-kpi-workbook',
      format: 'pdf',
      suppliedMetadataKeys: withoutMetadata.metadataRequirements.map((requirement) => requirement.key),
    });

    expect(withMetadata.status).toBe('ready');
    expect(withMetadata.requiresExceptionApproval).toBe(true);
  });

  it('treats org structure PDFs as metadata-driven exceptions rather than rejected uploads', () => {
    const assessment = assessTemplateUploadAlignment({
      templateId: 'org-roles',
      format: 'pdf',
      suppliedMetadataKeys: [
        'source_system',
        'data_owner',
        'sensitivity_declaration',
        'field_mapping',
        'parse_instructions',
        'document_purpose',
        'authoritative_sections',
        'metric_dictionary',
      ],
    });

    expect(assessment.status).toBe('ready');
    expect(assessment.parserLabel).toContain('Document facts');
    expect(assessment.requiresExceptionApproval).toBe(true);
  });
});
