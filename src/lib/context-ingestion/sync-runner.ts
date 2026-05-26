import { approveValidFacts, stageFactsForApproval } from './approval-queue';
import { classifyUploadedFile } from './file-classifier';
import { commitApprovedFacts } from './context-commit';
import { extractContextFacts } from './extractors';
import { attachValidationFindings, validateExtractedFacts } from './validation-engine';
import type { CommittedContextLayer } from './context-commit';
import type { IngestionUploadRun, UploadedFileInput } from './types';

export interface ContextIngestionResult {
  run: IngestionUploadRun;
  committed: CommittedContextLayer;
}

function uploadIdFor(fileName: string): string {
  return `upload:northstar:${fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

export function runNorthstarContextIngestion(file: UploadedFileInput): ContextIngestionResult {
  const uploadId = uploadIdFor(file.fileName);
  const classification = classifyUploadedFile(file);
  const extractedFacts = extractContextFacts({
    tenantKey: 'northstar',
    uploadId,
    file,
    classification,
  });
  const validationFindings = validateExtractedFacts({ classification, facts: extractedFacts });
  const facts = attachValidationFindings(extractedFacts, validationFindings);
  const staged = stageFactsForApproval(facts);
  const reviewed = approveValidFacts(staged);
  const committed = commitApprovedFacts(reviewed);

  return {
    run: {
      uploadId,
      tenantKey: 'northstar',
      file,
      classification,
      facts,
      validationFindings,
      approvedFactIds: reviewed.filter((item) => item.state === 'approved').map((item) => item.fact.id),
      rejectedFactIds: reviewed.filter((item) => item.state === 'rejected').map((item) => item.fact.id),
      committedFactIds: committed.committedFacts.map((fact) => fact.id),
    },
    committed,
  };
}
