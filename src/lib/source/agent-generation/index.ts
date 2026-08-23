// Agent generation · client-safe public surface.
//
// This module is imported by both server (API route, server components)
// AND client (the Source event canvas needs the supported-codes set to know
// which artifacts surface a Generate button). Server-only dependencies
// (context-binder, supabase, RLS) live in `./server.ts`. Anything
// re-exported here must be safe to bundle into a client component.

export type {
  SourceArtifactBodyGenerationMetadata,
  SourceArtifactPromptTemplate,
  SourceGenerationContext,
  SourceGenerationError,
  SourceGenerationResult,
} from "./types";

export {
  assertSourceArtifactStoryContractCoverage,
  findMissingUpstreamCodes,
  getPromptTemplate,
  getSourceArtifactStoryContract,
  listSupportedGenerationCodes,
  SOURCE_ARTIFACT_STORY_CONTRACTS,
  SOURCE_ARTIFACT_STORY_PACKAGES,
  SOURCE_NARRATIVE_LEADER_EXECUTIVE_EDITOR_PASS,
} from "./prompt-registry";

export type {
  SourceArtifactStoryContract,
  SourceArtifactStoryPackageContract,
  SourceArtifactStoryPackageId,
  SourceArtifactStoryRole,
  SourceNarrativeLeaderExecutiveEditorPass,
} from "./prompt-registry";
