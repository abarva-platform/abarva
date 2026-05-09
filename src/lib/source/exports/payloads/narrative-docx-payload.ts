// Source · narrative docx payload binders
//
// One binder per narrative artifact code (d05 / d09 / d24 / d27). Each
// pulls the authored body from substrate, falls back to the canonical
// template scaffold via loadArtifactTemplate, and produces the generic
// NarrativeDocxPayload the renderer consumes.

import 'server-only';

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import { loadArtifactTemplate } from '@/lib/source/canvas-substrate/templates';
import type { NarrativeDocxPayload } from '../renderers/narrative-docx';

export function buildNarrativeDocxPayloadFromContext(
  ctx: SourceGenerationContext,
  artifactCode: string,
  generatedAt: string,
): NarrativeDocxPayload {
  const state = ctx.artifactStates.find((a) => a.artifactCode === artifactCode);
  const authoredBody = state?.body ?? null;
  const fallbackBody = loadCanonicalScaffold(artifactCode);

  return {
    tenantName: ctx.tenantName,
    eventCode: ctx.event.code,
    eventName: ctx.event.name,
    issuedBy: ctx.event.owner ?? undefined,
    generatedAt,
    body: authoredBody ?? fallbackBody,
    bodyIsAuthored: Boolean(authoredBody),
  };
}

function loadCanonicalScaffold(artifactCode: string): string {
  const template = loadArtifactTemplate(artifactCode);
  if (template?.body) return template.body;
  return [
    `# ${artifactCode}`,
    '',
    '> Canonical scaffold could not be rendered. Author the body in the canvas before exporting.',
    '',
  ].join('\n');
}
