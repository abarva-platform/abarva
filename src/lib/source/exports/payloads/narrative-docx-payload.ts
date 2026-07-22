// Source · narrative docx payload binders
//
// One binder per narrative artifact code (d05 / d09 / d24 / d27). Each
// pulls the authored body from substrate, falls back to the canonical
// template scaffold via loadArtifactTemplate, and produces the generic
// NarrativeDocxPayload the renderer consumes.

import "server-only";

import type { SourceGenerationContext } from "@/lib/source/agent-generation/types";
import { sanitizeArtifactBodyForExport } from "@/lib/source/agent-generation/context-binder";
import { loadArtifactTemplate } from "@/lib/source/canvas-substrate/templates";
import type { NarrativeDocxPayload } from "../renderers/narrative-docx";
import { buildDecisionBriefPayloadFromContext } from "./decision-brief-payload";

export function buildNarrativeDocxPayloadFromContext(
  ctx: SourceGenerationContext,
  artifactCode: string,
  generatedAt: string,
): NarrativeDocxPayload {
  if (artifactCode === "d24_decision_brief") {
    return buildDecisionBriefPayloadFromContext(ctx, generatedAt);
  }

  const state = ctx.artifactStates.find((a) => a.artifactCode === artifactCode);
  const authoredBody = state?.body
    ? sanitizeArtifactBodyForExport(state.body)
    : null;
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
    sourceAuthority: sourceAuthorityFromState(state),
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
  if (isClientFinalAuthorityState(state)) return;
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
    "",
    "> Canonical scaffold could not be rendered. Author the body in the canvas before exporting.",
    "",
  ].join("\n");
}

function isPassingQualityGate(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  return (value as { passed?: unknown }).passed === true;
}

function sourceAuthorityFromState(
  state: SourceGenerationContext["artifactStates"][number] | undefined,
): NarrativeDocxPayload["sourceAuthority"] {
  const authority = state?.bodyGenerationMetadata?.dealPackAuthority;
  if (!authority || typeof authority !== "object") return undefined;
  const value = authority as {
    label?: unknown;
    artifactId?: unknown;
    requestedArtifactId?: unknown;
    fileName?: unknown;
    version?: unknown;
    history?: unknown;
  };
  if (typeof value.artifactId !== "string") return undefined;
  return {
    label:
      typeof value.label === "string" ? value.label : "Authoritative artifact",
    artifactId: value.artifactId,
    requestedArtifactId:
      typeof value.requestedArtifactId === "string"
        ? value.requestedArtifactId
        : null,
    fileName: typeof value.fileName === "string" ? value.fileName : null,
    version: typeof value.version === "number" ? value.version : null,
    history: sourceAuthorityHistory(value.history),
  };
}

function sourceAuthorityHistory(
  value: unknown,
): NonNullable<NarrativeDocxPayload["sourceAuthority"]>["history"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as {
        artifactId?: unknown;
        label?: unknown;
        fileName?: unknown;
        version?: unknown;
      };
      if (typeof item.artifactId !== "string") return null;
      return {
        artifactId: item.artifactId,
        label: typeof item.label === "string" ? item.label : "Audit history",
        fileName: typeof item.fileName === "string" ? item.fileName : null,
        version: typeof item.version === "number" ? item.version : null,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

function isClientFinalAuthorityState(
  state: SourceGenerationContext["artifactStates"][number],
): boolean {
  const authority = state.bodyGenerationMetadata?.dealPackAuthority;
  if (!authority || typeof authority !== "object") return false;
  return (authority as { isClientFinal?: unknown }).isClientFinal === true;
}
