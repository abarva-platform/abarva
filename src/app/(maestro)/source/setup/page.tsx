import Link from "next/link";

import { AppShell } from "@/components/shell/AppShell";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { SHELL } from "@/lib/shell/shell-tokens";

export const metadata = {
  title: "Source Setup · AbarVa",
};

export const dynamic = "force-dynamic";

const SETUP_AREAS = [
  {
    label: "Event configuration",
    detail:
      "Choose the sourcing archetype, rigor level, value basis, vendor lane, and current stage before the event enters the working portfolio.",
    action: "Open new event intake",
    href: "/source/new",
  },
  {
    label: "Team and roles",
    detail:
      "Name the sponsor, decision owner, sourcing lead, finance reviewer, legal reviewer, and the Maestro accountable for stage movement.",
    action: "Start from intake",
    href: "/source/new",
  },
  {
    label: "Evidence sources",
    detail:
      "Attach the contract baseline, vendor responses, pricing workbooks, scorecards, and scope notes that Sentinel is allowed to use for this event.",
    action: "View portfolio",
    href: "/source/portfolio",
  },
  {
    label: "Stage gates",
    detail:
      "Confirm which gate criteria are mandatory, which require approval, and which evidence rows must be present before the event advances.",
    action: "Open events",
    href: "/source/events",
  },
  {
    label: "Notifications",
    detail:
      "Decide who is alerted when evidence is missing, a BAFO date approaches, an approval blocks, or value proof needs finance attestation.",
    action: "Review decisions",
    href: "/source/queue",
  },
] as const;

export default function SourceSetupPage() {
  return (
    <AppShell
      surface="source"
      topBarProps={{ showLocked: true, context: "Source · Setup" }}
      subNav={<SourceSubNav />}
    >
      <main
        style={{
          background: SHELL.PAPER,
          flex: 1,
          overflowY: "auto",
          padding: "32px clamp(20px, 4vw, 48px)",
          fontFamily: SHELL.SANS,
          color: SHELL.INK,
        }}
      >
        <section style={{ maxWidth: 1160, display: "grid", gap: 24 }}>
          <header
            style={{
              display: "grid",
              gap: 10,
              borderBottom: `1px solid ${SHELL.CARD_LINE}`,
              paddingBottom: 22,
            }}
          >
            <div
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                color: SHELL.INK_MUTED,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              Source setup
            </div>
            <h1
              style={{
                margin: 0,
                fontFamily: SHELL.SERIF_DISPLAY,
                fontSize: "clamp(30px, 4vw, 44px)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              Prepare a sourcing event before the working room opens.
            </h1>
            <p
              style={{
                margin: 0,
                color: SHELL.INK_SOFT,
                fontSize: 15,
                lineHeight: 1.6,
                maxWidth: 780,
              }}
            >
              This setup surface keeps the operator checklist in one place:
              event shape, people, evidence, gates, and notifications. Actions
              route into the live Source surfaces; unavailable automation stays
              out of the user path until it is wired.
            </p>
          </header>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            {SETUP_AREAS.map((area) => (
              <article
                key={area.label}
                style={{
                  background: SHELL.CARD_WHITE,
                  border: `1px solid ${SHELL.CARD_LINE}`,
                  borderRadius: 10,
                  padding: 18,
                  display: "grid",
                  gap: 12,
                  alignContent: "space-between",
                  minHeight: 210,
                }}
              >
                <div style={{ display: "grid", gap: 8 }}>
                  <div
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                      color: SHELL.INK_MUTED,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                    }}
                  >
                    Setup area
                  </div>
                  <h2
                    style={{
                      margin: 0,
                      fontFamily: SHELL.SERIF_DISPLAY,
                      fontSize: 21,
                      lineHeight: 1.18,
                    }}
                  >
                    {area.label}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      color: SHELL.INK_SOFT,
                      fontSize: 13,
                      lineHeight: 1.55,
                    }}
                  >
                    {area.detail}
                  </p>
                </div>
                <Link
                  href={area.href}
                  style={{
                    color: SHELL.INK,
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                  }}
                >
                  {area.action} →
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
