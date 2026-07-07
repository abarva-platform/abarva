declare module "js-yaml" {
  export function load(input: string, options?: unknown): unknown;
  export function dump(input: unknown, options?: unknown): string;

  const yaml: {
    load: typeof load;
    dump: typeof dump;
  };

  export default yaml;
}

declare module "@azure-rest/ai-document-intelligence" {
  export interface AnalyzeOperationOutput {
    analyzeResult?: {
      content?: unknown;
      pages?: unknown;
      tables?: unknown;
      contentFormat?: string;
    };
  }

  interface DocumentIntelligenceClient {
    path(
      pathTemplate: string,
      ...pathParameters: string[]
    ): {
      post(input: unknown): Promise<{ body?: unknown }>;
    };
  }

  interface DocumentIntelligencePoller {
    pollUntilDone(): Promise<{ body?: AnalyzeOperationOutput }>;
  }

  const createDocumentIntelligenceClient: (
    ...args: unknown[]
  ) => DocumentIntelligenceClient;
  export default createDocumentIntelligenceClient;
  export const getLongRunningPoller: (
    client: DocumentIntelligenceClient,
    initialResponse: { body?: unknown },
  ) => DocumentIntelligencePoller;
  export const isUnexpected: (response: { body?: unknown }) => boolean;
}

declare module "@axe-core/playwright" {
  export default class AxeBuilder {
    constructor(input: { page: unknown });
    withTags(tags: string[]): this;
    analyze(): Promise<{ violations: unknown[] }>;
  }
}
