import { createClerkClient } from "@clerk/backend";
import type { Page } from "@playwright/test";

export const CLERK_TESTING_TOKEN_QUERY_PARAM = "__clerk_testing_token";

export function shouldUseClerkTestingToken(): boolean {
  return process.env.CLERK_TESTING_TOKEN_DISABLED !== "true";
}

export async function createClerkTestingTokenForCrawl(): Promise<string | null> {
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
): Promise<void> {
  if (!testingToken) return;

  await page.addInitScript(
    ({ param, token }) => {
      const shouldTag = (input: string): boolean => {
        try {
          const url = new URL(input, window.location.href);
          return (
            url.hostname.endsWith(".clerk.accounts.dev") ||
            url.hostname.endsWith(".clerk.com") ||
            url.pathname.startsWith("/__clerk")
          );
        } catch {
          return false;
        }
      };

      const appendTestingToken = (input: string): string => {
        if (!shouldTag(input)) return input;
        const url = new URL(input, window.location.href);
        if (!url.searchParams.has(param)) url.searchParams.set(param, token);
        return url.toString();
      };

      const originalFetch = window.fetch.bind(window);
      window.fetch = (input, init) => {
        if (typeof input === "string") {
          return originalFetch(appendTestingToken(input), init);
        }
        if (input instanceof Request) {
          return originalFetch(
            new Request(appendTestingToken(input.url), input),
            init,
          );
        }
        return originalFetch(input, init);
      };

      const OriginalXMLHttpRequest = window.XMLHttpRequest;
      window.XMLHttpRequest = class ClerkTestingTokenXMLHttpRequest extends OriginalXMLHttpRequest {
        open(
          method: string,
          url: string | URL,
          async = true,
          username?: string | null,
          password?: string | null,
        ) {
          return super.open(
            method,
            appendTestingToken(String(url)),
            async,
            username ?? undefined,
            password ?? undefined,
          );
        }
      };
    },
    { param: CLERK_TESTING_TOKEN_QUERY_PARAM, token: testingToken },
  );
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
