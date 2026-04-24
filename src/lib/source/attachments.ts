import type { SourceArtifactKind, SourceStageKey } from './types';

export type SourceAttachmentType =
  | 'pdf'
  | 'docx'
  | 'xlsx'
  | 'csv'
  | 'pptx'
  | 'txt'
  | 'md'
  | 'image'
  | 'unknown';

export type SourceAttachmentPurpose =
  | 'applicationInventory'
  | 'ticketExtract'
  | 'vendorResponse'
  | 'pricingTemplate'
  | 'existingRfp'
  | 'contractExcerpt'
  | 'architectureDeck'
  | 'businessCase'
  | 'procurementNotes'
  | 'legalRedlines'
  | 'other';

export type SourceAttachmentParseStatus =
  | 'uploaded'
  | 'classified'
  | 'needsPurpose'
  | 'parsing'
  | 'parsed'
  | 'parseFailed'
  | 'lowConfidence'
  | 'quarantined';

export type SourceAttachmentConfidence = 'low' | 'medium' | 'high';

export type SourceAttachmentSecurityStatus =
  | 'notScanned'
  | 'passed'
  | 'blocked'
  | 'quarantined'
  | 'needsReview';

export interface SourceAttachmentAssociation {
  eventId?: string;
  stageKey?: SourceStageKey;
  artifactId?: string;
  artifactKind?: SourceArtifactKind;
}

export interface SourceAttachmentCitation {
  id: string;
  attachmentId: string;
  label: string;
  locator?: {
    page?: number;
    sheet?: string;
    row?: number;
    slide?: number;
    section?: string;
    paragraph?: number;
  };
  excerpt?: string;
  confidence: SourceAttachmentConfidence;
}

export interface SourceExtractedEntity {
  id: string;
  label: string;
  kind:
    | 'vendor'
    | 'system'
    | 'application'
    | 'service'
    | 'requirement'
    | 'pricing'
    | 'risk'
    | 'date'
    | 'person'
    | 'organization'
    | 'other';
  value: string;
  confidence: SourceAttachmentConfidence;
  citationIds: string[];
}

export interface SourceAttachmentParsingError {
  code:
    | 'unsupportedType'
    | 'encrypted'
    | 'tooLarge'
    | 'corrupt'
    | 'extractionFailed'
    | 'lowConfidence'
    | 'securityBlocked'
    | 'unknown';
  message: string;
  recoverable: boolean;
}

export interface SourceAttachmentSummary {
  attachmentId: string;
  purpose?: SourceAttachmentPurpose;
  summary: string;
  keyFields: Record<string, string | number | boolean | string[]>;
  missingSections: string[];
  extractionConfidence: SourceAttachmentConfidence;
  citations: SourceAttachmentCitation[];
}

export interface SourceAttachment {
  id: string;
  fileName: string;
  fileType: SourceAttachmentType;
  purpose?: SourceAttachmentPurpose;
  uploadedBy: string;
  uploadTime: string;
  association: SourceAttachmentAssociation;
  parsedStatus: SourceAttachmentParseStatus;
  summary?: SourceAttachmentSummary;
  extractedEntities: SourceExtractedEntity[];
  relatedArtifacts: string[];
  evidenceReferences: SourceAttachmentCitation[];
  confidence: SourceAttachmentConfidence;
  parsingErrors: SourceAttachmentParsingError[];
  securityStatus: SourceAttachmentSecurityStatus;
}
