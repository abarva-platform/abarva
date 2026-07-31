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
  right: "max-h-[42vh] w-full border-t xl:max-h-none xl:w-[380px] xl:border-l xl:border-t-0",
  left: "max-h-[42vh] w-full border-t xl:max-h-none xl:w-[380px] xl:border-r xl:border-t-0",
  bottom: "h-[42vh] w-full border-t",
  float: "max-h-[42vh] w-full border-t xl:w-[380px] xl:max-w-[380px] xl:rounded-lg xl:border xl:shadow-2xl",
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
      className={`min-w-0 flex flex-col overflow-y-auto bg-[#fbfcfd] ${DOCK_SIZE[dockPosition]} border-[rgba(12,26,58,0.12)] shadow-[0_18px_50px_rgba(12,26,58,0.08)] ${
        dockPosition === "float"
          ? "shrink-0 xl:fixed xl:bottom-5 xl:right-5 xl:z-30 xl:max-h-[70vh]"
          : "shrink-0"
      }`}
      aria-label="aVa companion"
    >
      <header className="border-b border-[rgba(12,26,58,0.1)] bg-white px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#10243d] text-[11px] font-semibold text-white">
                aV
              </span>
              <div>
                <p className="text-sm font-semibold text-[#0c1a3a]">aVa</p>
                <p className="text-xs font-medium text-[#607286]">
                  Knowledge companion
                </p>
              </div>
            </div>
            <p className="mt-2 max-w-[300px] text-xs leading-relaxed text-[#6d7782]">
              Reads the active governed view and refuses when evidence is not in scope.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
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
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleDockLocked}
            className={`rounded-md border px-2.5 py-1.5 text-xs font-medium ${
              dockLocked
                ? "border-[rgba(0,102,204,0.45)] bg-[rgba(0,102,204,0.1)] text-[#0066CC]"
                : "border-[rgba(12,26,58,0.14)] bg-white text-[#607286]"
            }`}
          >
            {dockLocked ? "Locked" : "Lock"}
          </button>
          <button
            type="button"
            onClick={() => setDockState(dockLocked ? "open" : "rail")}
            className="rounded-md border border-[rgba(12,26,58,0.14)] bg-white px-2.5 py-1.5 text-xs font-medium text-[#607286]"
          >
            Hide
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-4 p-4">
        {!runtime.modelsEnabled ? (
          <div
            role="status"
            className="rounded-md border border-[rgba(32,93,141,0.22)] bg-white p-4 shadow-[0_14px_32px_rgba(12,26,58,0.05)]"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[#607286]">
              Reasoning unavailable
            </p>
            <p className="mt-1 text-sm font-semibold text-[#10243d]">
              aVa is paused for this environment.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#4f5e6c]">
              Deterministic Knowledge views remain available. aVa will answer only
              when the governed reasoning provider is enabled.
            </p>
          </div>
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

          </>
        )}

        {runtime.modelsEnabled && asked ? (
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
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#607286]">
                  Suggested questions
                </p>
                <ul className="space-y-1.5">
                  {context.suggestedQuestions.map((s) => {
                    const disabled = !runtime.modelsEnabled && s.requiresModel;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          disabled={disabled}
                          title={
                            disabled
                              ? "aVa reasoning is off in this environment."
                              : undefined
                          }
                          onClick={() => void ask(s.question)}
                          className={`w-full rounded-md border px-2.5 py-1.5 text-left text-sm ${
                            disabled
                              ? "cursor-not-allowed border-[rgba(10,10,11,0.1)] bg-[rgba(10,10,11,0.03)] text-[#777]"
                              : "border-[rgba(10,10,11,0.12)] text-[#2c2c2a] hover:border-[rgba(0,102,204,0.4)]"
                          }`}
                        >
                          {s.question}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </GatedSection>
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
      aria-label={`Dock aVa ${pos}`}
      aria-pressed={active}
      title={`Dock ${pos}`}
      onClick={() => onClick(pos)}
      className={`h-7 w-7 rounded-md border text-[10px] font-semibold ${
        active
          ? "border-[rgba(0,102,204,0.45)] bg-[rgba(0,102,204,0.1)] text-[#0066CC]"
          : "border-[rgba(12,26,58,0.14)] bg-white text-[#607286]"
      }`}
    >
      {pos[0]?.toUpperCase()}
    </button>
  );
}
