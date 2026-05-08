// Agent generation · server-only public surface.
//
// Anything that touches Supabase, Clerk session, or other server-only
// APIs lives here so it never gets pulled into a client bundle. The
// API route at /artifacts/[code]/generate-from-claude imports from
// this file; the canvas (`UniversalCanvasShell`) imports only from
// `./index.ts`.

import 'server-only';

export {
  buildSourceGenerationContext,
  collectUpstreamBodies,
} from './context-binder';

// Server callers usually want the registry too — re-export so they
// don't need a second import line.
export {
  findMissingUpstreamCodes,
  getPromptTemplate,
  listSupportedGenerationCodes,
} from './prompt-registry';

export type {
  SourceArtifactBodyGenerationMetadata,
  SourceArtifactPromptTemplate,
  SourceGenerationContext,
  SourceGenerationError,
  SourceGenerationResult,
} from './types';
