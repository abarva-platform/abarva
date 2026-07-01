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
import { buildDecisionBriefPayloadFromContext } from './decision-brief-payload';

export function buildNarrativeDocxPayloadFromContext(
  ctx: SourceGenerationContext,
  artifactCode: string,
  generatedAt: string,
): NarrativeDocxPayload {
  if (artifactCode === "d24_decision_brief") {
    return buildDecisionBriefPayloadFromContext(ctx, generatedAt);
  }

  const state = ctx.artifactStates.find((a) => a.artifactCode === artifactCode);
  const authoredBody = state?.body ?? null;
  assertNarrativeArtifactExportable(artifactCode, state);
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

export function assertNarrativeArtifactExportable(
  artifactCode: string,
  state: SourceGenerationContext["artifactStates"][number] | undefined,
): void {
  if (artifactCode !== "d09_rfp_pack") return;
  if (!state?.body?.trim()) {
    throw new Error(
      "d09_rfp_pack export blocked: author or generate the RFP body before exporting.",
    );
  }
  const qualityGate = state.bodyGenerationMetadata?.qualityGate;
  if (!isPassingQualityGate(qualityGate)) {
    throw new Error(
      "d09_rfp_pack export blocked: RFP package has not passed the partner-grade consulting quality gate.",
    );
  }
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

function isPassingQualityGate(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  return (value as { passed?: unknown }).passed === true;
}
