import { createClerkClient } from "@clerk/backend";
import type { Page } from "@playwright/test";

export const CLERK_TESTING_TOKEN_QUERY_PARAM = "__clerk_testing_token";

export function clerkFrontendApiHostFromPublishableKey(
  publishableKey: string | undefined,
): string | null {
  if (!publishableKey?.startsWith("pk_")) return null;

  const encodedFrontendApi = publishableKey.split("_").slice(2).join("_");
  if (!encodedFrontendApi) return null;

  try {
    const decodedFrontendApi = Buffer.from(encodedFrontendApi, "base64")
      .toString("utf8")
      .replace(/\$$/, "")
      .toLowerCase();
    const parsed = new URL(`https://${decodedFrontendApi}`);
    if (
      parsed.hostname !== decodedFrontendApi ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }
    return parsed.hostname;
  } catch {
    return null;
  }
}

export function appendClerkTestingTokenToRequestUrl(
  requestUrl: string,
  baseUrl: string,
  frontendApiHost: string,
  token: string,
): string | null {
  let url: URL;
  let appOrigin: string;
  try {
    url = new URL(requestUrl);
    appOrigin = new URL(baseUrl).origin;
  } catch {
    return null;
  }

  const directFrontendApiRequest =
    url.protocol === "https:" &&
    url.hostname.toLowerCase() === frontendApiHost.toLowerCase() &&
    /^\/v\d+\//.test(url.pathname);
  const proxiedFrontendApiRequest =
    url.origin === appOrigin &&
    (url.protocol === "https:" ||
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) &&
    /^\/(?:__clerk|_clerk)\/v\d+\//.test(url.pathname);
  if (!directFrontendApiRequest && !proxiedFrontendApiRequest) return null;

  url.searchParams.set(CLERK_TESTING_TOKEN_QUERY_PARAM, token);
  return url.toString();
}

export function shouldUseClerkTestingToken(): boolean {
  return process.env.CLERK_TESTING_TOKEN_DISABLED !== "true";
}

export async function createClerkTestingTokenForCrawl(): Promise<
  string | null
> {
  if (!shouldUseClerkTestingToken()) return null;

  const secretKey =
    process.env.CLERK_TESTING_TOKEN_SECRET_KEY?.trim() ||
    process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) return null;

  const clerk = createClerkClient({ secretKey });
  const token = await withTimeout(
    clerk.testingTokens.createTestingToken(),
    20_000,
    "crawl_clerk_testing_token_create_timeout",
  );
  return token.token;
}

export async function installClerkTestingTokenInterceptor(
  page: Page,
  testingToken: string | null,
  baseUrl: string,
): Promise<void> {
  if (!testingToken) return;

  const frontendApiHost = clerkFrontendApiHostFromPublishableKey(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
  if (!frontendApiHost) {
    throw new Error("crawl_clerk_frontend_api_host_missing_or_invalid");
  }

  await page.route("**/*", async (route) => {
    const taggedUrl = appendClerkTestingTokenToRequestUrl(
      route.request().url(),
      baseUrl,
      frontendApiHost,
      testingToken,
    );
    if (taggedUrl) {
      await route.continue({ url: taggedUrl });
      return;
    }
    await route.continue();
  });
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
