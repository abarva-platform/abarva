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
export { classifyUpload } from './classification';
export type { ClassifyUploadInput } from './classification';
export {
  buildPatternAssemblyPacket,
  validateAssembledResponse,
} from './pattern-assembly';
export type { AssembledPatternItem } from './pattern-assembly';
export { LAKESHORE_LEGAL_DEMO_FIXTURE } from './fixtures/lakeshore-legal';
