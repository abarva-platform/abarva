// Agent generation · public exports for the canvas.

export type {
  SourceArtifactBodyGenerationMetadata,
  SourceArtifactPromptTemplate,
  SourceGenerationContext,
  SourceGenerationError,
  SourceGenerationResult,
} from './types';

export {
  buildSourceGenerationContext,
  collectUpstreamBodies,
} from './context-binder';

export {
  findMissingUpstreamCodes,
  getPromptTemplate,
  listSupportedGenerationCodes,
} from './prompt-registry';
