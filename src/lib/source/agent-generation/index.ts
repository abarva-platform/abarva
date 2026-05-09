// Agent generation · client-safe public surface.
//
// This module is imported by both server (API route, server components)
// AND client (UniversalCanvasShell needs the supported-codes set to know
// which artifacts surface a Generate button). Server-only dependencies
// (context-binder, supabase, RLS) live in `./server.ts`. Anything
// re-exported here must be safe to bundle into a client component.

export type {
  SourceArtifactBodyGenerationMetadata,
  SourceArtifactPromptTemplate,
  SourceGenerationContext,
  SourceGenerationError,
  SourceGenerationResult,
} from './types';

export {
  findMissingUpstreamCodes,
  getPromptTemplate,
  listSupportedGenerationCodes,
} from './prompt-registry';
