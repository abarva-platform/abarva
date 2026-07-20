// Source · d11 Response Checklist · pdf renderer
//
// PDF companion to response-checklist-docx.ts (Slice 5) and the xlsx
// (Slice 2b). Reuses the ResponseChecklistPayload from the xlsx
// pipeline. Mirrors the docx section structure as react-pdf table
// Views — a vendor-readable, print-ready rendering.
//
// Sections:
//   1. Cover (event metadata + submission deadline)
//   2. Mandatory items
//   3. Optional / recommended items
//   4. Format expectations
//   5. Submission sign-off + certification statements

import 'server-only';

import type { ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';

import {
  StructuredPdfHeading,
  StructuredPdfKeyValueTable,
  StructuredPdfNote,
  StructuredPdfTable,
  buildStructuredPdfDocument,
} from '@/lib/exports-shared/structured-pdf-base';
import { sourceArtifactGovernanceBanner } from '@/lib/source/artifact-governance';
import type { ResponseChecklistPayload } from './response-checklist';

export function buildResponseChecklistPdf(
  payload: ResponseChecklistPayload,
): ReactElement<DocumentProps> {
  return buildStructuredPdfDocument({
    documentTitle: `Response Checklist · ${payload.eventCode}`,
    subject: `d11 Response Checklist for sourcing event ${payload.eventCode}.`,
    eyebrow: `d11 · Response Checklist · ${payload.tenantName}`,
    title: payload.eventName,
    meta: [
      { label: 'Event code', value: payload.eventCode },
      ...(payload.issuedBy ? [{ label: 'Issued by', value: payload.issuedBy }] : []),
      { label: 'Generated', value: payload.generatedAt },
      ...(payload.submissionDeadline
        ? [{ label: 'Submission deadline', value: payload.submissionDeadline }]
        : []),
    ],
    governanceNotice: sourceArtifactGovernanceBanner('ai_draft', {
      artifactCode: 'd11',
    }),
    introNote:
      'Vendor-facing response checklist. Use the xlsx companion for ' +
      'in-place completion; this PDF is for review and circulation.',
    confidentialityNote:
      'Confidential vendor RFP response checklist — distribute only to invited bidders',
    headerLine: `${payload.tenantName}   ·   ${payload.eventCode}   ·   Response Checklist`,
    body: (
      <>
        <StructuredPdfHeading>Mandatory items</StructuredPdfHeading>
        <StructuredPdfNote>
          {`${payload.mandatoryItems.length} item${payload.mandatoryItems.length === 1 ? '' : 's'}. Every row is required for response completeness (d15).`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Item ID', flex: 1, extract: (r) => r.id },
            { header: 'Section', flex: 1.2, extract: (r) => r.section },
            { header: 'Requirement', flex: 3.8, extract: (r) => r.requirement },
            { header: 'Confirmed (Y/N)', flex: 1, extract: () => '' },
            { header: 'Evidence pointer', flex: 1.4, extract: () => '' },
          ]}
          rows={payload.mandatoryItems}
          emptyLabel="No mandatory items defined for this checklist."
        />
        <StructuredPdfHeading>Optional / recommended items</StructuredPdfHeading>
        <StructuredPdfNote>
          {`${payload.optionalItems.length} item${payload.optionalItems.length === 1 ? '' : 's'}. Affirmative answers strengthen scoring (d16) but do not gate response completeness.`}
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Item ID', flex: 1, extract: (r) => r.id },
            { header: 'Section', flex: 1.2, extract: (r) => r.section },
            { header: 'Requirement', flex: 3.8, extract: (r) => r.requirement },
            { header: 'Confirmed (Y/N/N/A)', flex: 1, extract: () => '' },
            { header: 'Evidence pointer', flex: 1.4, extract: () => '' },
          ]}
          rows={payload.optionalItems}
          emptyLabel="No optional items defined for this checklist."
        />
        <StructuredPdfHeading>Format expectations</StructuredPdfHeading>
        <StructuredPdfNote>
          Locked rubric. Submissions outside these conventions may be rejected.
        </StructuredPdfNote>
        <StructuredPdfTable
          columns={[
            { header: 'Topic', flex: 1.3, extract: (r) => r.topic },
            { header: 'Requirement', flex: 3.7, extract: (r) => r.requirement },
          ]}
          rows={payload.formatExpectations}
          emptyLabel="No format expectations defined for this checklist."
        />
        <StructuredPdfHeading>Submission sign-off</StructuredPdfHeading>
        <StructuredPdfNote>
          An authorized officer must complete this block before submission.
        </StructuredPdfNote>
        <StructuredPdfKeyValueTable
          editableValues
          rows={[
            { label: 'Vendor legal name', value: '' },
            { label: 'Authorized signing officer (name + title)', value: '' },
            { label: 'Officer email', value: '' },
            { label: 'Officer phone', value: '' },
            { label: 'Submission date', value: '' },
          ]}
        />
        <StructuredPdfHeading>Certification statements</StructuredPdfHeading>
        <StructuredPdfTable
          columns={[
            { header: 'Statement', flex: 4, extract: (r) => r },
            { header: 'Confirmed / Declined', flex: 1, extract: () => '' },
          ]}
          rows={payload.certifications}
          emptyLabel="No certification statements defined for this checklist."
        />
      </>
    ),
  });
}
