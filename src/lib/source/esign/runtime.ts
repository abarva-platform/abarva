import { resolveSourceNdaEsignConfig } from "./config";
import { createAzureDocuSignProvider } from "./docusign-provider";
import type { EsignProvider } from "./provider";

export function createSourceNdaEsignRuntime(tenantKey: string): {
  provider: EsignProvider | null;
  fallback: "upload";
} {
  const config = resolveSourceNdaEsignConfig(tenantKey);
  if (config.state !== "configured") return { provider: null, fallback: "upload" };
  return { provider: createAzureDocuSignProvider(config), fallback: "upload" };
}
