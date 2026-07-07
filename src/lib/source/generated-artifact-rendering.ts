import "server-only";

import { Packer } from "docx";

import {
  DOCX_CONTENT_TYPE,
  HTML_CONTENT_TYPE,
  isDocxGeneratable,
  isHtmlGeneratable,
  renderArtifactDocx,
  renderArtifactHtml,
} from "@/lib/source/exports";
import type { SourceGenerationContext } from "@/lib/source/agent-generation/types";
import { sourceArtifactClientLabel } from "@/lib/source/agent-generation/client-facing-hygiene";
import type { NarrativeDocxPayload } from "@/lib/source/exports/renderers/narrative-docx";

export const GENERATED_MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";

export type GeneratedArtifactFormat = "docx" | "html" | "md";

export interface RenderedGeneratedArtifact {
  format: GeneratedArtifactFormat;
  role: "primary" | "preview" | "source";
  filename: string;
  contentType: string;
  bytes: Buffer;
}

export interface RenderGeneratedArtifactResult {
  primary: RenderedGeneratedArtifact;
  preview: RenderedGeneratedArtifact | null;
  source: RenderedGeneratedArtifact | null;
  errors: string[];
}

function sanitizeStem(value: string): string {
  return (
    value
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 90) || "source-generated-artifact"
  );
}

function buildNarrativePayload(
  ctx: SourceGenerationContext,
  artifactCode: string,
  generatedAt: string,
  body: string,
): NarrativeDocxPayload {
  return {
    tenantName: ctx.tenantName,
    eventCode: ctx.event.code,
    eventName: ctx.event.name,
    issuedBy: ctx.event.owner ?? undefined,
    generatedAt,
    body,
    bodyIsAuthored: true,
  };
}

export async function renderGeneratedSourceArtifactFormats(args: {
  artifactCode: string;
  artifactId: string;
  body: string;
  ctx: SourceGenerationContext;
  generatedAt: string;
}): Promise<RenderGeneratedArtifactResult> {
  const stem = `${sanitizeStem(sourceArtifactClientLabel(args.artifactCode))}-${args.artifactId.slice(0, 8)}`;
  const source: RenderedGeneratedArtifact = {
    format: "md",
    role: "source",
    filename: `${stem}_source.md`,
    contentType: GENERATED_MARKDOWN_CONTENT_TYPE,
    bytes: Buffer.from(args.body, "utf8"),
  };
  const errors: string[] = [];
  const payload = buildNarrativePayload(
    args.ctx,
    args.artifactCode,
    args.generatedAt,
    args.body,
  );

  let primary: RenderedGeneratedArtifact | null = null;
  if (isDocxGeneratable(args.artifactCode)) {
    try {
      const document = await renderArtifactDocx({
        artifactCode: args.artifactCode,
        payload,
      });
      primary = {
        format: "docx",
        role: "primary",
        filename: `${stem}.docx`,
        contentType: DOCX_CONTENT_TYPE,
        bytes: Buffer.from(await Packer.toBuffer(document)),
      };
    } catch (error) {
      errors.push(
        `docx:${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } else {
    errors.push(`docx:unsupported:${args.artifactCode}`);
  }

  let preview: RenderedGeneratedArtifact | null = null;
  if (isHtmlGeneratable(args.artifactCode)) {
    try {
      preview = {
        format: "html",
        role: "preview",
        filename: `${stem}_preview.html`,
        contentType: HTML_CONTENT_TYPE,
        bytes: Buffer.from(
          renderArtifactHtml({ artifactCode: args.artifactCode, payload }),
          "utf8",
        ),
      };
    } catch (error) {
      errors.push(
        `html:${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return {
    primary:
      primary ?? {
        ...source,
        role: "primary",
        filename: `${stem}.md`,
      },
    preview,
    source: primary ? source : null,
    errors,
  };
}
