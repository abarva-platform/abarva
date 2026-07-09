import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { getActiveClientRow } from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { SHELL } from "@/lib/shell/shell-tokens";
import {
  loadApprovalsInbox,
  type ApprovalsInboxItem,
} from "@/lib/source/approvals-inbox";

export const dynamic = "force-dynamic";

const NAVY = SHELL.INK;

function money(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return "";
  return `$${(v / 1_000_000).toFixed(1)}M`;
}

const STATUS_STYLE: Record<
  ApprovalsInboxItem["status"],
  { label: string; bg: string; fg: string }
> = {
  ready: { label: "Ready to approve", bg: "#dff3e4", fg: "#1f7a3d" },
  ready_with_gaps: {
    label: "Approvable with gaps",
    bg: "#fdf2d6",
    fg: "#8a6d1a",
  },
  waiting: { label: "Waiting on items", bg: "#efece5", fg: "#6b6b6b" },
};

export default async function SourceApprovalsPage() {
  const activeClient = await getActiveClientRow().catch(() => null);
  const clientName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? "AbarVa Client";
  const inbox = activeClient?.key
    ? await loadApprovalsInbox(activeClient.key).catch(() => ({
        items: [],
        intakeCount: 0,
        gateReadyCount: 0,
      }))
    : { items: [], intakeCount: 0, gateReadyCount: 0 };

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: clientName,
        showLocked: true,
        context: "Source · Approvals",
      }}
      subNav={<SourceSubNav />}
    >
      <main style={{ padding: "28px 32px 80px" }}>
        <div style={{ maxWidth: 880 }}>
          <header style={{ marginBottom: 18 }}>
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: SHELL.INK_MUTED,
                marginBottom: 10,
              }}
            >
              Source · Approvals
            </div>
            <h1
              style={{
                fontFamily: SHELL.SERIF,
                fontWeight: 400,
                fontSize: 28,
                color: NAVY,
                margin: 0,
              }}
            >
              {inbox.items.length === 0
                ? "Nothing waiting on you"
                : `${inbox.items.length} waiting on you`}
            </h1>
            <p style={{ color: SHELL.INK_SOFT, fontSize: 14, marginTop: 6 }}>
              Every approval in one place. Each item has one button — it takes you
              exactly where you decide. Approving with gaps is allowed: gaps are
              recorded with your rationale and carried forward, never hidden.
            </p>
          </header>

        {inbox.items.length === 0 ? (
          <div
            style={{
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: 10,
              padding: 22,
              color: SHELL.INK_SOFT,
              fontSize: 14,
            }}
          >
            No intake approvals or stage gates are waiting for a decision. New
            items appear here automatically.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {inbox.items.map((item) => {
              const s = STATUS_STYLE[item.status];
              return (
                <div
                  key={`${item.kind}-${item.eventId}`}
                  style={{
                    background: SHELL.CARD_WHITE,
                    border: `1px solid ${SHELL.CARD_LINE}`,
                    borderRadius: 10,
                    padding: "16px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 9px",
                          borderRadius: 999,
                          background: s.bg,
                          color: s.fg,
                        }}
                      >
                        {s.label}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: SHELL.INK_MUTED,
                          fontFamily: SHELL.MONO,
                        }}
                      >
                        {item.eventCode}
                        {item.stageLabel
                          ? ` · ${item.stageLabel}`
                          : " · Intake"}
                        {item.estimatedValueUsd
                          ? ` · ${money(item.estimatedValueUsd)}`
                          : ""}
                      </span>
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 15,
                        color: NAVY,
                        marginTop: 6,
                      }}
                    >
                      {item.eventName}
                    </div>
                    <div style={{ fontSize: 13, color: SHELL.INK_MID, marginTop: 2 }}>
                      {item.ask}
                    </div>
                    <div
                      style={{ fontSize: 12, color: SHELL.INK_SOFT, marginTop: 2 }}
                    >
                      {item.readiness}
                    </div>
                  </div>
                  <Link
                    href={item.href}
                    style={{
                      flexShrink: 0,
                      background: NAVY,
                      color: SHELL.CARD_WHITE,
                      padding: "10px 18px",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.actionLabel} →
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        <section
          style={{
            marginTop: 28,
            background: SHELL.CARD_WHITE,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 10,
            padding: "14px 18px",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: NAVY,
              marginBottom: 6,
            }}
          >
            How approving works
          </div>
          <ol
            style={{
              fontSize: 13,
              color: SHELL.INK_MID,
              margin: 0,
              paddingLeft: 18,
              lineHeight: 1.7,
            }}
          >
            <li>
              <b>Intake approval</b> — review the five captured facts, write one
              rationale, check the accountability box, click Approve. The
              working canvas unlocks.
            </li>
            <li>
              <b>Stage gate</b> — the Gate tab shows what&apos;s met and
              what&apos;s open. All met → write the reason and Approve. Items
              open → you can still <b>Approve with gaps</b>: your rationale is
              required, the open items are deferred and carried forward visibly.
            </li>
          </ol>
        </section>
        </div>
      </main>
    </AppShell>
  );
}
