import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResponsibleAiTrainingForm } from "@/components/ai-liability/ResponsibleAiTrainingForm";
import { getActiveClientRow } from "@/lib/active-client";
import {
  RESPONSIBLE_AI_ACKNOWLEDGMENT_ROUTE,
  getResponsibleAiAcknowledgmentStatus,
  getResponsibleAiAcknowledgmentSubjectForRequest,
} from "@/lib/ai-liability/responsible-ai-acknowledgment";
import {
  AIRLINE_FOUNDATION_TRAINING_COMPLETION_STATEMENT,
  AIRLINE_FOUNDATION_TRAINING_MODULES,
  getResponsibleAiTrainingStatus,
} from "@/lib/ai-liability/responsible-ai-training";
import { canonicalClientDisplayName } from "@/lib/client-config";

export const metadata: Metadata = {
  title: "Responsible AI Training | AbarVa",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ResponsibleAiTrainingPage() {
  const [subjectResult, activeClient] = await Promise.all([
    getResponsibleAiAcknowledgmentSubjectForRequest()
      .then((subject) => ({ subject, failed: false }))
      .catch(() => ({ subject: null, failed: true })),
    getActiveClientRow().catch(() => null),
  ]);
  const subject = subjectResult.subject;

  if (!subject && !subjectResult.failed) redirect("/sign-in");

  const acknowledgmentStatus = subject
    ? await getResponsibleAiAcknowledgmentStatus(subject)
    : { required: true, storageAvailable: false };
  if (acknowledgmentStatus.required)
    redirect(RESPONSIBLE_AI_ACKNOWLEDGMENT_ROUTE);

  const trainingStatus = subject
    ? await getResponsibleAiTrainingStatus(subject)
    : {
        required: true,
        trainingVersion: "",
        completionStatement: "",
        estimatedMinutes: 10,
        storageAvailable: false,
        completedAt: null,
        reason: "storage_unavailable" as const,
      };
  if (!trainingStatus.required) redirect("/home");

  const clientName =
    foundationClientDisplayName(subject?.clientKey) ??
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ??
    activeClient?.name ??
    "your workspace";
  const isAirlineFoundation = subject?.clientKey === "airline-demo-new";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: isAirlineFoundation ? "#F7F8F6" : "#F6F1EA",
        color: "#27324A",
        display: "grid",
        placeItems: "center",
        padding: "32px 20px 48px",
        fontFamily: "var(--font-inter)",
      }}
    >
      <section
        style={{
          width: isAirlineFoundation ? "min(1120px, 100%)" : "min(760px, 100%)",
          display: "grid",
          gap: 18,
        }}
      >
        <div
          style={{
            display: "grid",
            gap: isAirlineFoundation ? 18 : 0,
            gridTemplateColumns: isAirlineFoundation
              ? "repeat(auto-fit, minmax(min(100%, 320px), 1fr))"
              : "1fr",
            alignItems: "end",
          }}
        >
          <div>
            <div
              style={{
                color: "#8B95A8",
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.1em",
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              {isAirlineFoundation
                ? "Airline foundation training"
                : "Responsible AI training"}
            </div>
            <h1
              style={{
                margin: 0,
                color: "#0C1A3A",
                fontFamily: "var(--font-fraunces)",
                fontSize: isAirlineFoundation ? 42 : 38,
                fontWeight: 500,
                letterSpacing: "0",
                lineHeight: 1.08,
              }}
            >
              {isAirlineFoundation
                ? "Use the Airline Knowledge Baseline like an operator, not a chatbot."
                : "Complete the human-accountability training before entering AbarVa."}
            </h1>
            <p
              style={{
                margin: "12px 0 0",
                color: "#69758A",
                fontSize: 15,
                lineHeight: 1.6,
              }}
            >
              {isAirlineFoundation
                ? "This training aligns proof users on the governed Airline Demo New workflow: what the baseline proves, what remains deferred, how modules consume it, and where human approval stays in control."
                : "This short module sets the operating standard for AI-assisted work: review evidence, validate assumptions, document reasoning, and keep human approval in control of consequential actions."}
            </p>
          </div>
          {isAirlineFoundation && (
            <aside
              aria-label="Airline foundation trust boundary"
              style={{
                border: "1px solid rgba(12, 26, 58, 0.12)",
                borderRadius: 8,
                background: "#fff",
                display: "grid",
                gap: 12,
                padding: 18,
                boxShadow: "0 16px 36px rgba(12, 26, 58, 0.06)",
              }}
            >
              <div
                style={{
                  color: "#0E7668",
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                What this unlocks
              </div>
              {[
                "Signed-in Knowledge preview proof",
                "Baseline-bound aVa validation",
                "Module data-authority certification",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    alignItems: "center",
                    color: "#27324A",
                    display: "grid",
                    fontSize: 14,
                    gap: 10,
                    gridTemplateColumns: "10px 1fr",
                    lineHeight: 1.35,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      background: "#2BA77C",
                      borderRadius: 999,
                      height: 8,
                      width: 8,
                    }}
                  />
                  <span>{item}</span>
                </div>
              ))}
            </aside>
          )}
        </div>

        {isAirlineFoundation && (
          <div
            style={{
              border: "1px solid rgba(12, 26, 58, 0.1)",
              borderRadius: 8,
              background: "#FFFFFF",
              display: "grid",
              gap: 0,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              overflow: "hidden",
            }}
          >
            {[
              [
                "01",
                "Evidence first",
                "Use accepted source-backed records before interpretation.",
              ],
              [
                "02",
                "Deferred is real",
                "Commercial, KPI, target-state, and high-impact claims stay visibly deferred.",
              ],
              [
                "03",
                "Modules are consumers",
                "Home, Intelligence, Source, Moves, Tower, Cube, Superset, and Observable must bind to the same baseline.",
              ],
              [
                "04",
                "Humans approve",
                "AbarVa prepares the decision artifact; accountable owners decide.",
              ],
            ].map(([step, title, body]) => (
              <article
                key={step}
                style={{
                  borderRight: "1px solid rgba(12, 26, 58, 0.08)",
                  display: "grid",
                  gap: 8,
                  minHeight: 132,
                  padding: 18,
                }}
              >
                <div
                  style={{
                    color: "#C27803",
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {step}
                </div>
                <h2 style={{ margin: 0, color: "#0C1A3A", fontSize: 16 }}>
                  {title}
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#687386",
                    fontSize: 13,
                    lineHeight: 1.45,
                  }}
                >
                  {body}
                </p>
              </article>
            ))}
          </div>
        )}

        <ResponsibleAiTrainingForm
          clientName={clientName}
          completionStatement={
            isAirlineFoundation
              ? AIRLINE_FOUNDATION_TRAINING_COMPLETION_STATEMENT
              : undefined
          }
          estimatedMinutes={isAirlineFoundation ? 6 : undefined}
          modules={
            isAirlineFoundation
              ? AIRLINE_FOUNDATION_TRAINING_MODULES
              : undefined
          }
          variant={isAirlineFoundation ? "foundation" : "standard"}
          storageAvailable={trainingStatus.storageAvailable}
        />
      </section>
    </main>
  );
}

function foundationClientDisplayName(clientKey: string | null | undefined) {
  if (clientKey === "airline-demo-new") return "Airline Demo New";
  if (clientKey === "healthcare-demo-new") return "Healthcare Demo New";
  return null;
}
