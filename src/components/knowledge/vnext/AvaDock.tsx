"use client";

/**
 * aVa dock — the optional companion, brought into consistency with the app-wide
 * AgentDock experience (Intelligence/Source/Tower/Moves): window modes (side rail,
 * pinned strip, expanded overlay, collapsed chip), an auto-grow / Enter-to-send /
 * Shift+Enter composer, and RICH answers (markdown + tables + charts) via the same
 * shared renderer those modules use.
 *
 * It stays a SEPARATE path from the deterministic page: when models are disabled it
 * shows an honest disabled state and the page keeps working. Answers are ephemeral
 * (local state, cleared on mode change) and never become accepted Knowledge here.
 *
 * It deliberately does NOT import AgentDock (which couples to the broker/auth/tenant
 * stack); it replicates that dock's interaction contract locally so the vNext feature
 * keeps its data isolation, talking only to the consumption runtime.
 */

import { useEffect, useRef, useState } from "react";
import type {
  AvaAnswer,
  AvaIntent,
  AvaKnowledgePacket,
} from "@/lib/knowledge/consumption-contracts";
import { useConsumption } from "@/lib/knowledge/consumption-client";
import { AgentAnswerRenderer } from "@/components/agent-answer/AgentAnswerRenderer";
import { useShell } from "./state";
import { toAvaAnswerPacket } from "./ava-answer-adapter";

const INTENTS: { id: AvaIntent; label: string }[] = [
  { id: "explain", label: "Explain" },
  { id: "investigate", label: "Investigate" },
  { id: "compare", label: "Compare" },
  { id: "act", label: "Act" },
];

export function AvaDock() {
  const runtime = useConsumption();
  const {
    mode: kmode, lens, depth, scope, focalEntityRefs, filters,
    avaMode, setAvaMode, avaContext, avaPrefill, clearAvaPrefill,
  } = useShell();
  const [intent, setIntent] = useState<AvaIntent>("explain");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AvaAnswer | null>(null);
  const [asked, setAsked] = useState<{ question: string; intent: AvaIntent } | null>(null);
  const [busy, setBusy] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Ephemeral: clear any answer when the knowledge mode changes.
  useEffect(() => { setAnswer(null); setAsked(null); }, [kmode]);

  // A suggested question queued elsewhere pre-fills the composer; the user still
  // sends it and the answer still comes from aVa (never a canned/authored answer).
  useEffect(() => {
    if (avaPrefill) { setQuestion(avaPrefill); clearAvaPrefill(); taRef.current?.focus(); }
  }, [avaPrefill, clearAvaPrefill]);

  // Auto-grow the composer up to ~6 rows, matching the shared dock composer.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [question]);

  // Esc returns an expanded dock to the side rail (shared-dock behavior).
  useEffect(() => {
    if (avaMode !== "expand") return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAvaMode("side-rail"); };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [avaMode, setAvaMode]);

  if (avaMode === "collapsed") {
    return (
      <button
        type="button"
        className="kv-ava-chip"
        onClick={() => setAvaMode("side-rail")}
        aria-label="Open aVa companion"
        data-testid="kv-ava-collapsed-chip"
      >
        Ask aVa{runtime.modelsEnabled ? "" : " · off"}
      </button>
    );
  }

  const available = runtime.ava.isAvailable();

  async function ask() {
    if (!available || !question.trim()) return;
    setBusy(true);
    const q = question.trim();
    const packet: AvaKnowledgePacket = {
      tenantKey: runtime.binding.tenantKey,
      knowledgeBaselineRef: runtime.baselineRef,
      domainPublicationVersions: runtime.domainPublicationVersions,
      consumptionProjectionVersions: { contract: "phase3c2d-consumption-contracts-v1.0.0" },
      cubeSemanticModelVersion: null,
      mode: kmode, lens, depth, currentTargetScope: scope,
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
    setAsked({ question: q, intent });
    try {
      const a = await runtime.ava.ask({ intent, question: q, packet });
      setAnswer(a);
    } finally {
      setBusy(false);
    }
  }

  function onComposerKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); }
  }

  const inner = (
    <div className="kv-ava-inner">
      <div className="kv-ava-head">
        <strong className="kv-serif" style={{ fontSize: 16 }}>aVa</strong>
        <div className="kv-ava-modes" role="group" aria-label="aVa window controls">
          <button
            type="button" className="kv-ava-modebtn"
            aria-pressed={avaMode === "pin-bottom"}
            onClick={() => setAvaMode(avaMode === "pin-bottom" ? "side-rail" : "pin-bottom")}
            title={avaMode === "pin-bottom" ? "Dock to the right" : "Pin to the bottom"}
          >
            {avaMode === "pin-bottom" ? "Dock right" : "Pin bottom"}
          </button>
          <button
            type="button" className="kv-ava-modebtn"
            aria-pressed={avaMode === "expand"}
            onClick={() => setAvaMode(avaMode === "expand" ? "side-rail" : "expand")}
            title={avaMode === "expand" ? "Return to the side rail" : "Expand"}
          >
            {avaMode === "expand" ? "Return" : "Expand"}
          </button>
          <button
            type="button" className="kv-ava-modebtn"
            onClick={() => setAvaMode("collapsed")}
            aria-label="Collapse aVa companion"
            title="Collapse"
          >
            Collapse
          </button>
        </div>
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

          <div className="kv-ava-composer">
            <label className="kv-visually-hidden" htmlFor="kv-ava-q">Ask aVa</label>
            <textarea
              id="kv-ava-q"
              ref={taRef}
              rows={1}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={onComposerKey}
              placeholder="Ask about what's in view… (Enter to send, Shift+Enter for a new line)"
              spellCheck
            />
            <button type="button" className="kv-btn" onClick={ask} disabled={busy || !question.trim()} aria-label="Send question to aVa">
              {busy ? "…" : "Ask"}
            </button>
          </div>

          <div className="kv-ava-answer" aria-live="polite">
            {answer ? (
              <AnswerView
                answer={answer}
                tenantKey={runtime.binding.tenantKey}
                question={asked?.question ?? ""}
                intent={asked?.intent ?? intent}
              />
            ) : (
              <p style={{ color: "var(--kv-muted)", fontSize: 13 }}>
                aVa answers only from evidence in the current view. It refuses rather than
                estimating, and its answers are not saved as Knowledge.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (avaMode === "expand") {
    return (
      <>
        <div className="kv-ava-scrim" onClick={() => setAvaMode("side-rail")} aria-hidden />
        <div
          className="kv-ava-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="aVa expanded chat"
          data-mode="expand"
          data-testid="kv-ava-expand-overlay"
        >
          {inner}
        </div>
      </>
    );
  }

  return (
    <aside className="kv-ava" data-mode={avaMode} aria-label="aVa companion" data-testid="kv-ava-panel">
      {inner}
    </aside>
  );
}

function AnswerView({
  answer, tenantKey, question, intent,
}: {
  answer: AvaAnswer;
  tenantKey: string;
  question: string;
  intent: AvaIntent;
}) {
  if (answer.outcome === "refused") {
    return (
      <div>
        <div className="kv-eyebrow" style={{ marginBottom: 6 }}>Refused · ephemeral</div>
        {answer.refusalReason ? <p style={{ color: "var(--kv-alert)" }}>{answer.refusalReason}</p> : null}
        <MetaLists answer={answer} />
      </div>
    );
  }
  return (
    <div>
      <div className="kv-eyebrow" style={{ marginBottom: 6 }}>
        {answer.outcome === "partial" ? "Partial answer" : "Answer"} · ephemeral
      </div>
      {/* Same renderer the other modules use → identical markdown, tables and charts. */}
      <AgentAnswerRenderer
        answer={toAvaAnswerPacket(answer, tenantKey, question, intent)}
        showChrome={false}
        showExport={false}
        showProse
      />
      <MetaLists answer={answer} />
    </div>
  );
}

function MetaLists({ answer }: { answer: AvaAnswer }) {
  return (
    <>
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
    </>
  );
}
