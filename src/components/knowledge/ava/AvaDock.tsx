/**
 * aVa companion dock. Per the reconciliation matrix's `askAva`/
 * `getModuleKnowledgePacket` rows: the real aVa flow builds its
 * AvaKnowledgePacket client-side, at the moment a question is asked, from
 * whatever refs the current page already has in view -- there is no
 * separate "fetch me a packet to display" round-trip in the real contract,
 * by design (aVa is a deliberately separate, ephemeral path). This build
 * composes the packet from the current Brief's evidence/gap refs (the
 * broadest real context available regardless of mode) and calls
 * `runtime.ava.ask()` directly -- the real `DeterministicAvaReasoningProvider`
 * answers when evidence is in scope and refuses honestly when it is not,
 * rather than a duplicate stub that refused unconditionally.
 */
"use client";

import { useState } from "react";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import { AvaAnswerCard } from "./AvaAnswerCard";
import { AvaSearch } from "./AvaSearch";
import type { AvaAnswer } from "@/lib/knowledge/consumption-contracts";

const DOCK_SIZE: Record<string, string> = {
  right: "w-[380px] border-l",
  left: "w-[380px] border-r",
  bottom: "h-[42vh] w-full border-t",
  float: "w-[380px] rounded-lg border shadow-2xl",
};

export function AvaDock() {
  const {
    assembler,
    runtime,
    tenantKey,
    lensId,
    mode,
    dockState,
    setDockState,
    dockPosition,
    setDockPosition,
    dockLocked,
    toggleDockLocked,
  } = useKnowledgeApp();

  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<AvaAnswer | undefined>(undefined);

  const briefEnvelope = useEnvelope(
    () => assembler.getEnterpriseBrief({ runtime, tenantKey, lens: lensId }),
    [assembler, runtime, tenantKey, lensId],
  );
  const avaContextEnvelope = useEnvelope(
    () => assembler.getAvaContext({ runtime, tenantKey, mode }),
    [assembler, runtime, tenantKey, mode],
  );

  async function ask(questionText: string) {
    setAsked(questionText);
    setAnswer(undefined);
    const result = await runtime.ava.ask({
      intent: "explain",
      question: questionText,
      packet: {
        tenantKey,
        knowledgeBaselineRef: runtime.baselineRef,
        domainPublicationVersions: runtime.domainPublicationVersions,
        consumptionProjectionVersions: {},
        cubeSemanticModelVersion: null,
        mode,
        lens: "none",
        depth: "executive",
        currentTargetScope: "current",
        focalEntityRefs: [],
        activeFilters: {},
        permissionBoundaryRef: `knowledge-ui:${tenantKey}`,
        executivePerspectiveRefs: [],
        acceptedFactRefs: [],
        relationshipEdgeRefs: [],
        metricQueryHashes: [],
        evidenceRefs: [...(briefEnvelope?.evidenceRefs ?? [])],
        knownGapRefs: [...(briefEnvelope?.knownGapRefs ?? [])],
        blockedSourceRefs: [],
      },
    });
    setAnswer(result);
  }

  if (dockState === "hidden") {
    return (
      <button
        type="button"
        onClick={() => setDockState("rail")}
        className="fixed bottom-5 right-5 z-30 rounded-full bg-[#0066CC] px-4 py-2.5 text-sm font-medium text-white shadow-lg"
      >
        Ask aVa
      </button>
    );
  }

  return (
    <aside
      className={`flex flex-col overflow-y-auto bg-white ${DOCK_SIZE[dockPosition]} border-[rgba(10,10,11,0.12)] ${
        dockPosition === "float"
          ? "fixed bottom-5 right-5 z-30 max-h-[70vh]"
          : "shrink-0"
      }`}
      aria-label="aVa companion"
    >
      <header className="flex items-center justify-between border-b border-[rgba(10,10,11,0.1)] px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[#0c1a3a]">aVa</p>
          <p className="text-xs text-[#888780]">
            Reads what you are looking at. Refuses rather than guesses.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <DockPosButton
            pos="left"
            active={dockPosition === "left"}
            onClick={setDockPosition}
          />
          <DockPosButton
            pos="right"
            active={dockPosition === "right"}
            onClick={setDockPosition}
          />
          <DockPosButton
            pos="bottom"
            active={dockPosition === "bottom"}
            onClick={setDockPosition}
          />
          <DockPosButton
            pos="float"
            active={dockPosition === "float"}
            onClick={setDockPosition}
          />
          <button
            type="button"
            onClick={toggleDockLocked}
            className={`ml-1 rounded-md border px-2 py-1 text-xs ${
              dockLocked
                ? "border-[rgba(0,102,204,0.45)] bg-[rgba(0,102,204,0.1)] text-[#0066CC]"
                : "border-[rgba(10,10,11,0.18)] text-[#888780]"
            }`}
          >
            {dockLocked ? "Locked" : "Lock"}
          </button>
          <button
            type="button"
            onClick={() => setDockState(dockLocked ? "open" : "rail")}
            className="rounded-md border border-[rgba(10,10,11,0.18)] px-2 py-1 text-xs text-[#888780]"
          >
            Hide
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-4 p-4">
        {!runtime.modelsEnabled ? (
          <p className="rounded-md border border-[rgba(10,10,11,0.14)] bg-[rgba(10,10,11,0.04)] p-3 text-sm text-[#5f5e5a]">
            All model providers are disabled -- aVa reasoning is unavailable.
            Everything else on this page still works.
          </p>
        ) : (
          <>
            <div>
              <label
                htmlFor="ava-question"
                className="mb-1 block text-xs font-medium text-[#888780]"
              >
                Ask a question
              </label>
              <div className="flex gap-2">
                <input
                  id="ava-question"
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && question.trim())
                      void ask(question.trim());
                  }}
                  placeholder="e.g. Why does recovery take a second operating day?"
                  className="flex-1 rounded-md border border-[rgba(10,10,11,0.18)] px-2.5 py-1.5 text-sm"
                />
                <button
                  type="button"
                  disabled={!question.trim()}
                  onClick={() => void ask(question.trim())}
                  className="rounded-md bg-[#0066CC] px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-[rgba(0,102,204,0.35)]"
                >
                  Ask
                </button>
              </div>
            </div>

            {asked ? (
              answer ? (
                <AvaAnswerCard
                  question={asked}
                  answer={answer}
                  onAskAnother={() => {
                    setAsked(null);
                    setAnswer(undefined);
                  }}
                />
              ) : (
                <p className="rounded-md border border-[rgba(10,10,11,0.14)] bg-[rgba(10,10,11,0.04)] p-3 text-sm text-[#5f5e5a]">
                  aVa is reasoning...
                </p>
              )
            ) : (
              <GatedSection
                envelope={avaContextEnvelope}
                label="Suggested questions"
                emptyTitle="No suggestions for this mode yet"
              >
                {(context) => (
                  <ul className="space-y-1.5">
                    {context.suggestedQuestions.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => void ask(s.question)}
                          className="w-full rounded-md border border-[rgba(10,10,11,0.12)] px-2.5 py-1.5 text-left text-sm text-[#2c2c2a] hover:border-[rgba(0,102,204,0.4)]"
                        >
                          {s.question}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </GatedSection>
            )}
          </>
        )}

        <AvaSearch />
      </div>
    </aside>
  );
}

function DockPosButton({
  pos,
  active,
  onClick,
}: {
  readonly pos: "left" | "right" | "bottom" | "float";
  readonly active: boolean;
  readonly onClick: (pos: "left" | "right" | "bottom" | "float") => void;
}) {
  return (
    <button
      type="button"
      title={`Dock ${pos}`}
      onClick={() => onClick(pos)}
      className={`h-6 w-6 rounded border text-[10px] ${
        active
          ? "border-[rgba(0,102,204,0.45)] bg-[rgba(0,102,204,0.1)] text-[#0066CC]"
          : "border-[rgba(10,10,11,0.18)] text-[#888780]"
      }`}
    >
      {pos[0]?.toUpperCase()}
    </button>
  );
}
