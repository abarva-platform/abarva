// Source · d05 Scope Memo docx payload binder
//
// Pulls the d05 authored body (or canonical template scaffold as a
// fallback) plus event metadata, and produces the ScopeMemoDocxPayload
// the renderer consumes.

import 'server-only';

import type { SourceGenerationContext } from '@/lib/source/agent-generation/types';
import { loadArtifactTemplate } from '@/lib/source/canvas-substrate/templates';
import type { ScopeMemoDocxPayload } from '../renderers/scope-memo-docx';

export function buildScopeMemoDocxPayloadFromContext(
  ctx: SourceGenerationContext,
  generatedAt: string,
): ScopeMemoDocxPayload {
  const d05 = ctx.artifactStates.find((a) => a.artifactCode === 'd05_scope_memo');
  const authoredBody = d05?.body ?? null;
  const fallbackBody = loadCanonicalScaffold('d05_scope_memo');

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

/**
 * Best-effort canonical-scaffold fetch. Returns the canonical template
 * markdown if available, otherwise a minimal stub explaining the gap.
 */
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
