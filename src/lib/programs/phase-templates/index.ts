// Moves — phase-template + upload-mapping + pattern-assembly public API.
// See docs/build/moves-design/MOVES_BUILDING_BLOCK_SPINE.md and
// MOVES_DYNAMIC_PATTERN_ASSEMBLY.md.

export * from './building-blocks';
export * from './types';
export {
  PHASE_TEMPLATE_CATALOG,
  TEMPLATE_BY_ID,
  templatesForPhase,
} from './catalog';
export { buildTemplateOutline, templateOutlineFilename } from './template-outline';
export { classifyUpload } from './classification';
export type { ClassifyUploadInput } from './classification';
export {
  inferTemplateFromFilename,
  uploadCategoryForTemplate,
} from './upload-inference';
export { computeWhatChanged } from './what-changed';
export type { WhatChangedResult } from './what-changed';
export { buildFeedForwardPack } from './feed-forward';
export type { FeedForwardSignals, FeedForwardPack } from './feed-forward';
export {
  APPROVED_INPUTS_PACK_TYPE,
  buildApprovedInputsPack,
  isApprovedInputsPack,
} from './approved-inputs-pack';
export type {
  ApprovedInputsPack,
  BuildApprovedInputsPackInput,
} from './approved-inputs-pack';
export {
  enterprisePromotionStatus,
  isAutoPromotableToEnterprise,
  buildPromotionReviewRequest,
} from './enterprise-promotion';
export type {
  EnterprisePromotionStatus,
  EnterprisePromotionState,
  PromotionReviewRequest,
} from './enterprise-promotion';
export {
  buildPatternAssemblyPacket,
  validateAssembledResponse,
} from './pattern-assembly';
export type { AssembledPatternItem } from './pattern-assembly';
export { LAKESHORE_LEGAL_DEMO_FIXTURE } from './fixtures/lakeshore-legal';
