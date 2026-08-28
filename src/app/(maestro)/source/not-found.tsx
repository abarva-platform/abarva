import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ANALYTICS } from "@/components/source/canvas/analytics/analytics-tokens";
import { getActiveClientRow } from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";

export const dynamic = "force-dynamic";

export default async function SourceNotFound() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const tenantName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? "your current account";

  return (
    <AppShell
      surface="source"
      agentName="aVa"
      surfaceContext={{
        sourceUnavailable: true,
        reason: "not_found_or_not_available_for_account",
      }}
      topBarProps={{
        tenantName,
        showLocked: true,
        context: "Source item unavailable",
      }}
    >
      <main
        data-testid="source-unavailable-state"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          background: ANALYTICS.PAGE_BG,
          color: ANALYTICS.INK,
          fontFamily: ANALYTICS.SANS,
        }}
      >
        <section
          style={{
            minHeight: "calc(100vh - 80px)",
            display: "grid",
            placeItems: "center",
            padding: "72px 24px",
          }}
        >
          <div
            style={{
              width: "min(720px, 100%)",
              border: `1px solid ${ANALYTICS.LINE}`,
              borderRadius: 10,
              background: ANALYTICS.CARD,
              boxShadow: ANALYTICS.SHADOW_SM,
              padding: "34px 36px",
            }}
          >
            <div
              style={{
                color: ANALYTICS.FAINT,
                fontFamily: ANALYTICS.MONO,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Source · access guard
            </div>
            <h1
              style={{
                fontFamily: ANALYTICS.SERIF,
                fontSize: 34,
                lineHeight: 1.08,
                margin: 0,
                letterSpacing: "-0.4px",
              }}
            >
              This Source item is not available for {tenantName}.
            </h1>
            <p
              style={{
                color: ANALYTICS.INK_2,
                fontSize: 15,
                lineHeight: 1.6,
                margin: "14px 0 0",
                maxWidth: 560,
              }}
            >
              The link may point to a different account, or the item may have
              moved. Source does not reveal whether another account&apos;s event
              exists.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginTop: 28,
              }}
            >
              <SourceUnavailableLink href="/source/workspace" primary>
                Open Source workspace
              </SourceUnavailableLink>
              <SourceUnavailableLink href="/home">
                Go to Home
              </SourceUnavailableLink>
              <SourceUnavailableLink href="/sign-in">
                Switch account
              </SourceUnavailableLink>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function SourceUnavailableLink({
  href,
  primary = false,
  children,
}: {
  href: string;
  primary?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        border: `1px solid ${primary ? ANALYTICS.INK : ANALYTICS.LINE}`,
        borderRadius: 8,
        background: primary ? ANALYTICS.INK : ANALYTICS.CARD,
        color: primary ? "#fff" : ANALYTICS.INK,
        fontFamily: ANALYTICS.SANS,
        fontSize: 13,
        fontWeight: 800,
        padding: "10px 14px",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}
