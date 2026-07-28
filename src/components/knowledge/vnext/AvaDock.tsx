"use client";

/**
 * aVa dock — the optional companion. It is a SEPARATE path from the
 * deterministic page: when models are disabled it shows an honest disabled
 * state and the page keeps working. Answers are ephemeral (kept in local state,
 * cleared on navigation/mode change) and never become accepted Knowledge here.
 */

import { useEffect, useState } from "react";
import type {
  AvaAnswer,
  AvaIntent,
  AvaKnowledgePacket,
} from "@/lib/knowledge/consumption-contracts";
import { useConsumption } from "@/lib/knowledge/consumption-client";
import { useShell } from "./state";

const INTENTS: { id: AvaIntent; label: string }[] = [
  { id: "explain", label: "Explain" },
  { id: "investigate", label: "Investigate" },
  { id: "compare", label: "Compare" },
  { id: "act", label: "Act" },
];

export function AvaDock() {
  const runtime = useConsumption();
  const { mode, lens, depth, scope, focalEntityRefs, filters, avaOpen, setAvaOpen, avaContext } = useShell();
  const [intent, setIntent] = useState<AvaIntent>("explain");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AvaAnswer | null>(null);
  const [busy, setBusy] = useState(false);

  // Ephemeral: clear any answer when the mode changes.
  useEffect(() => { setAnswer(null); }, [mode]);

  if (!avaOpen) return null;

  const available = runtime.ava.isAvailable();

  async function ask() {
    if (!available || !question.trim()) return;
    setBusy(true);
    const packet: AvaKnowledgePacket = {
      tenantKey: runtime.binding.tenantKey,
      knowledgeBaselineRef: runtime.baselineRef,
      domainPublicationVersions: runtime.domainPublicationVersions,
      consumptionProjectionVersions: { contract: "phase3c2d-consumption-contracts-v1.0.0" },
      cubeSemanticModelVersion: null,
      mode, lens, depth, currentTargetScope: scope,
      focalEntityRefs,
      activeFilters: filters,
      permissionBoundaryRef: `tenant:${runtime.binding.tenantKey}`,
      executivePerspectiveRefs: [],
      acceptedFactRefs: avaContext.acceptedFactRefs,
      relationshipEdgeRefs: [],
      metricQueryHashes: [],
      evidenceRefs: avaContext.evidenceRefs,
      knownGapRefs: avaContext.knownGapRefs,
      blockedSourceRefs: avaContext.blockedSourceRefs,
    };
    try {
      const a = await runtime.ava.ask({ intent, question: question.trim(), packet });
      setAnswer(a);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="kv-ava" data-open={avaOpen} aria-label="aVa companion">
      <div className="kv-ava-inner">
        <div className="kv-ava-head">
          <strong className="kv-serif" style={{ fontSize: 16 }}>aVa</strong>
          <button type="button" className="kv-btn kv-btn-ghost" onClick={() => setAvaOpen(false)} aria-label="Collapse aVa companion">
            Collapse
          </button>
        </div>

        {!available ? (
          <div className="kv-ava-disabled" role="status">
            aVa reasoning is turned off in this environment. Everything on this page —
            navigation, filters, relationships, evidence and gaps — still works. Only aVa
            answers are unavailable.
          </div>
        ) : (
          <>
            <div className="kv-ava-intents" role="group" aria-label="aVa intent">
              {INTENTS.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  className="kv-mode-btn"
                  aria-pressed={intent === it.id}
                  aria-label={`aVa intent: ${it.label}`}
                  onClick={() => setIntent(it.id)}
                  style={intent === it.id ? { background: "var(--kv-accent-bg)", color: "var(--kv-blue)" } : undefined}
                >
                  {it.label}
                </button>
              ))}
            </div>

            <div className="kv-ava-input">
              <label className="kv-visually-hidden" htmlFor="kv-ava-q">Ask aVa</label>
              <input
                id="kv-ava-q"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
                placeholder="Ask about what's in view…"
                spellCheck
              />
              <button type="button" className="kv-btn" onClick={ask} disabled={busy || !question.trim()} aria-label="Send question to aVa">
                {busy ? "…" : "Ask"}
              </button>
            </div>

            <div className="kv-ava-answer" aria-live="polite">
              {answer ? <AnswerView answer={answer} /> : (
                <p style={{ color: "var(--kv-muted)", fontSize: 13 }}>
                  aVa answers only from evidence in the current view. It refuses rather than
                  estimating, and its answers are not saved as Knowledge.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

function AnswerView({ answer }: { answer: AvaAnswer }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--kv-muted)", marginBottom: 6 }}>
        {answer.outcome === "refused" ? "Refused" : answer.outcome === "partial" ? "Partial answer" : "Answer"} · ephemeral
      </div>
      {answer.refusalReason ? (
        <p style={{ color: "var(--kv-alert)" }}>{answer.refusalReason}</p>
      ) : null}
      {answer.sections.map((s, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <strong>{s.heading}</strong>
          <p style={{ margin: "2px 0" }}>{s.body}</p>
        </div>
      ))}
      {answer.limitations.length > 0 ? (
        <div style={{ marginTop: 8 }}>
          <div className="kv-eyebrow">Limitations</div>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
            {answer.limitations.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </div>
      ) : null}
      {answer.whatWouldChangeIt.length > 0 ? (
        <div style={{ marginTop: 8 }}>
          <div className="kv-eyebrow">What would change it</div>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
            {answer.whatWouldChangeIt.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
