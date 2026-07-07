import "server-only";

import type { AnalyzeOperationOutput } from "@azure-rest/ai-document-intelligence";

export const DOCUMENT_INTELLIGENCE_LAYOUT_PARSE_METHOD =
  "azure-document-intelligence-layout";
export const DOCUMENT_INTELLIGENCE_LAYOUT_MODEL_ID = "prebuilt-layout";

export interface DocumentIntelligenceConfig {
  endpoint: string;
  apiKey?: string;
  useAad: boolean;
  locale?: string;
}

export interface DocumentIntelligenceLayoutResult {
  text: string;
  warnings: string[];
  pageCount: number | null;
  tableCount: number | null;
  contentFormat: "markdown" | "text" | string | null;
}

export class DocumentIntelligenceNotConfiguredError extends Error {
  constructor() {
    super("Azure AI Document Intelligence is not configured.");
    this.name = "DocumentIntelligenceNotConfiguredError";
  }
}

export function getDocumentIntelligenceConfig(
  env: NodeJS.ProcessEnv = process.env,
): DocumentIntelligenceConfig | null {
  const endpoint = (
    env.DOCUMENT_INTELLIGENCE_ENDPOINT ||
    env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT ||
    ""
  ).trim();
  const apiKey = (
    env.DOCUMENT_INTELLIGENCE_API_KEY ||
    env.AZURE_DOCUMENT_INTELLIGENCE_API_KEY ||
    ""
  ).trim();
  const useAad =
    (env.DOCUMENT_INTELLIGENCE_USE_AAD || "").trim().toLowerCase() === "true";
  const locale = (env.DOCUMENT_INTELLIGENCE_LOCALE || "").trim() || undefined;

  if (!endpoint) return null;
  if (!apiKey && !useAad) return null;
  return {
    endpoint,
    apiKey: apiKey || undefined,
    useAad,
    locale,
  };
}

export function isDocumentIntelligenceConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return getDocumentIntelligenceConfig(env) !== null;
}

export async function parsePdfWithDocumentIntelligenceLayout(
  buffer: Buffer,
): Promise<DocumentIntelligenceLayoutResult> {
  const config = getDocumentIntelligenceConfig();
  if (!config) throw new DocumentIntelligenceNotConfiguredError();

  const [
    { default: DocumentIntelligence, isUnexpected, getLongRunningPoller },
  ] = await Promise.all([import("@azure-rest/ai-document-intelligence")]);

  const client = config.apiKey
    ? DocumentIntelligence(config.endpoint, { key: config.apiKey })
    : DocumentIntelligence(
        config.endpoint,
        new (await import("@azure/identity")).DefaultAzureCredential(),
      );

  const initialResponse = await client
    .path(
      "/documentModels/{modelId}:analyze",
      DOCUMENT_INTELLIGENCE_LAYOUT_MODEL_ID,
    )
    .post({
      contentType: "application/json",
      body: {
        base64Source: buffer.toString("base64"),
      },
      queryParameters: {
        ...(config.locale ? { locale: config.locale } : {}),
        outputContentFormat: "markdown",
      },
    });

  if (isUnexpected(initialResponse)) {
    throw new Error(describeDocumentIntelligenceError(initialResponse.body));
  }

  const poller = getLongRunningPoller(client, initialResponse);
  const result = await poller.pollUntilDone();
  const operation = result.body as AnalyzeOperationOutput;
  const analyzeResult = operation.analyzeResult;
  const text = String(analyzeResult?.content || "").trim();
  if (!text) {
    throw new Error(
      "Azure AI Document Intelligence returned no readable content.",
    );
  }

  return {
    text,
    warnings: [],
    pageCount: Array.isArray(analyzeResult?.pages)
      ? analyzeResult.pages.length
      : null,
    tableCount: Array.isArray(analyzeResult?.tables)
      ? analyzeResult.tables.length
      : null,
    contentFormat: analyzeResult?.contentFormat || null,
  };
}

function describeDocumentIntelligenceError(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "Azure AI Document Intelligence returned an unexpected response.";
  }
  const error = "error" in body ? (body as { error?: unknown }).error : body;
  if (!error || typeof error !== "object") {
    return "Azure AI Document Intelligence returned an unexpected response.";
  }
  const code =
    "code" in error ? String((error as { code?: unknown }).code || "") : "";
  const message =
    "message" in error
      ? String((error as { message?: unknown }).message || "")
      : "";
  return (
    [code, message].filter(Boolean).join(": ") ||
    "Azure AI Document Intelligence returned an unexpected response."
  );
}
