import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { SHELL } from "@/lib/shell/shell-tokens";

export default async function LearnPage() {
  const user = await currentUser().catch(() => null);
  if (!user) redirect("/sign-in");

  return (
    <AppShell
      surface="home"
      topBarProps={{ context: "Learn" }}
      agentName="Atlas coach"
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          background: SHELL.PAPER_SOFT,
          padding: "42px clamp(22px, 5vw, 72px)",
        }}
      >
        <section
          style={{
            maxWidth: 920,
            border: `1px solid ${SHELL.CARD_LINE}`,
            borderRadius: 16,
            background: SHELL.CARD_WHITE,
            padding: "34px clamp(22px, 4vw, 44px)",
            boxShadow: "0 18px 48px rgba(12, 26, 58, 0.07)",
          }}
        >
          <p
            style={{
              margin: "0 0 10px",
              color: SHELL.INK_MUTED,
              fontFamily: SHELL.SANS,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Atlas coach
          </p>
          <h1
            style={{
              margin: "0 0 14px",
              color: SHELL.INK,
              fontFamily: SHELL.SERIF,
              fontSize: "clamp(32px, 4.5vw, 56px)",
              lineHeight: 0.98,
              letterSpacing: "-0.04em",
            }}
          >
            Learn how to run the cockpit.
          </h1>
          <p
            style={{
              margin: 0,
              color: SHELL.INK_SOFT,
              fontFamily: SHELL.SANS,
              fontSize: 17,
              lineHeight: 1.55,
              maxWidth: 690,
            }}
          >
            Use this surface for guided operator coaching, product walkthroughs,
            and role-specific playbooks. Atlas keeps the learning path close to
            the same evidence, programs, sourcing events, and intelligence used
            in live execution.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
