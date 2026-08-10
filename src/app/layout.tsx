import type { Metadata } from "next";
import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { headers } from "next/headers";
import "./globals.css";
import PostHogProvider from "@/components/PostHogProvider";
import ProductUsageTelemetry from "@/components/ProductUsageTelemetry";
import MobileGuard from "@/components/MobileGuard";
import { ToastProvider } from "@/components/shell/Toast";

export const metadata: Metadata = {
  title: "AbarVa",
  description: "Intelligence. Now act on it.",
  openGraph: {
    title: "AbarVa — Intelligence. Now act on it.",
    description:
      "AbarVa gives you what consultants never could — intelligence from your own data, accountable to your actual outcomes.",
    type: "website",
    url: "https://app.abarva.ai",
  },
};

async function shouldDisableClerkForAxe() {
  if (process.env.ACCESSIBILITY_AXE_DISABLE_CLERK !== "1") return false;

  const requestHeaders = await headers();
  return requestHeaders.get("x-abarva-accessibility-axe") === "1";
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkDisabledForAxe = await shouldDisableClerkForAxe();
  const shell = (
    <html lang="en">
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#0066CC" />
        <meta name="theme-color" content="#0066CC" />
      </head>
      <body>
        <PostHogProvider>
          <Suspense fallback={null}>
            <ProductUsageTelemetry clerkEnabled={!clerkDisabledForAxe} />
          </Suspense>
          <MobileGuard>
            <ToastProvider>{children}</ToastProvider>
          </MobileGuard>
        </PostHogProvider>
      </body>
    </html>
  );

  if (clerkDisabledForAxe) {
    return shell;
  }

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      afterSignOutUrl="/signed-out"
      signInForceRedirectUrl="/auth-redirect"
      signUpForceRedirectUrl="/auth-redirect"
    >
      {shell}
    </ClerkProvider>
  );
}
