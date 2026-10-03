import type { EsignEnvironment } from "./provider";

type Env = Record<string, string | undefined>;

type Configured = {
  state: "configured";
  provider: "docusign";
  environment: EsignEnvironment;
  accountId: string;
  integrationKey: string;
  userId: string;
  keyId: string;
  testInbox: string;
};

export type SourceNdaEsignConfig = Configured | {
  state: "not_configured";
  fallback: "upload";
} | {
  state: "blocked";
  reason: "invalid_configuration" | "tenant_environment_mismatch";
  fallback: "upload";
};

const SYNTHETIC_LAB_TENANT = "meridian-health";
const LAB_KEY_HOST = "kv-abarva-lab-001.vault.azure.net";
const LAB_KEY_PATH = "/keys/source-nda-docusign-lab-jwt/";
const required = (value: string | undefined): value is string =>
  typeof value === "string" && value.trim().length > 0;

export function resolveSourceNdaEsignConfig(
  tenantKey: string,
  env: Env = process.env,
): SourceNdaEsignConfig {
  if (!env.SOURCE_NDA_ESIGN_PROVIDER || env.SOURCE_NDA_ESIGN_PROVIDER === "disabled") {
    return { state: "not_configured", fallback: "upload" };
  }
  if (env.SOURCE_NDA_ESIGN_PROVIDER !== "docusign" ||
      !["demo", "production"].includes(env.SOURCE_NDA_ESIGN_ENVIRONMENT ?? "") ||
      ![
        env.SOURCE_NDA_ESIGN_ACCOUNT_ID,
        env.SOURCE_NDA_ESIGN_INTEGRATION_KEY,
        env.SOURCE_NDA_ESIGN_USER_ID,
        env.SOURCE_NDA_ESIGN_KEY_ID,
        env.SOURCE_NDA_ESIGN_TEST_INBOX,
      ].every(required)) {
    return { state: "blocked", reason: "invalid_configuration", fallback: "upload" };
  }
  if ((env.SOURCE_NDA_ESIGN_ENVIRONMENT === "demo") !==
      (tenantKey === SYNTHETIC_LAB_TENANT)) {
    return { state: "blocked", reason: "tenant_environment_mismatch", fallback: "upload" };
  }
  if (env.SOURCE_NDA_ESIGN_ENVIRONMENT !== "demo") {
    return { state: "blocked", reason: "tenant_environment_mismatch", fallback: "upload" };
  }
  const keyId = env.SOURCE_NDA_ESIGN_KEY_ID!;
  const testInbox = env.SOURCE_NDA_ESIGN_TEST_INBOX!;
  let keyUrl: URL;
  try {
    keyUrl = new URL(keyId);
  } catch {
    return { state: "blocked", reason: "invalid_configuration", fallback: "upload" };
  }
  if (keyUrl.protocol !== "https:" || keyUrl.hostname !== LAB_KEY_HOST ||
      !keyUrl.pathname.startsWith(LAB_KEY_PATH) ||
      keyUrl.pathname.length <= LAB_KEY_PATH.length ||
      keyUrl.username || keyUrl.password || keyUrl.search || keyUrl.hash ||
      !/^[^@\s]+@abarva\.ai$/i.test(testInbox)) {
    return { state: "blocked", reason: "invalid_configuration", fallback: "upload" };
  }
  return {
    state: "configured",
    provider: "docusign",
    environment: "demo",
    accountId: env.SOURCE_NDA_ESIGN_ACCOUNT_ID!,
    integrationKey: env.SOURCE_NDA_ESIGN_INTEGRATION_KEY!,
    userId: env.SOURCE_NDA_ESIGN_USER_ID!,
    keyId,
    testInbox,
  };
}
