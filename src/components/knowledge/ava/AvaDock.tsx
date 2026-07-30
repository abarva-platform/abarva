/**
 * aVa companion dock. Per KNOWLEDGE_AVA_CONTEXT_CONTRACT.md Section 3, the
 * refusal contract is "the single most implementable aVa behavior in the
 * entire surface" -- it needs less from the data layer than answering does.
 * This build leans into that: every question asked today resolves to the
 * refusal shape (module_knowledge_packet_v1 is not populated for
 * airline-demo-new -- SD-15), and the dock says so plainly rather than
 * emitting a best-guess canned answer, which is explicitly the failure mode
 * the contract rules out (Section 4: "must not be mistaken for a grounding
 * pipeline").
 */
"use client";

import { useState } from "react";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import { StateBanner } from "../state/StateBanner";
import { AvaAnswerCard } from "./AvaAnswerCard";
import { AvaSearch } from "./AvaSearch";

const DOCK_SIZE: Record<string, string> = {
  right: "w-[380px] border-l",
  left: "w-[380px] border-r",
  bottom: "h-[42vh] w-full border-t",
  float: "w-[380px] rounded-lg border shadow-2xl",
};

export function AvaDock() {
  const {
    provider,
    providerCtx,
    lensId,
    dockState,
    setDockState,
    dockPosition,
    setDockPosition,
    dockLocked,
    toggleDockLocked,
  } = useKnowledgeApp();

  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string | null>(null);

  const packetEnvelope = useEnvelope(
    () => provider.getModuleKnowledgePacket(providerCtx, "knowledge"),
    [provider, providerCtx],
  );
  const suggestionsEnvelope = useEnvelope(
    () => provider.listAvaSuggestedQuestions({ ...providerCtx, lensId }),
    [provider, providerCtx, lensId],
  );
  const answerEnvelope = useEnvelope(
    () =>
      asked
        ? provider.askAva(providerCtx, asked)
        : Promise.resolve(undefined as never),
    [provider, providerCtx, asked],
  );

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
        <GatedSection
          envelope={packetEnvelope}
          label="Knowledge packet"
          emptyTitle="Knowledge packet not yet available for this tenant"
          emptyBody="aVa cannot answer, in any mode, until the module knowledge packet resolves for airline-demo-new. This is the gate, not a degraded fallback -- refusing here is correct behavior, not a bug."
        >
          {(packet) => (
            <div className="text-sm text-[#5f5e5a]">
              <p>Packet {packet.packetHash}</p>
            </div>
          )}
        </GatedSection>

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
                  setAsked(question.trim());
              }}
              placeholder="e.g. Why does recovery take a second operating day?"
              className="flex-1 rounded-md border border-[rgba(10,10,11,0.18)] px-2.5 py-1.5 text-sm"
            />
            <button
              type="button"
              disabled={!question.trim()}
              onClick={() => setAsked(question.trim())}
              className="rounded-md bg-[#0066CC] px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-[rgba(0,102,204,0.35)]"
            >
              Ask
            </button>
          </div>
        </div>

        {asked ? (
          answerEnvelope ? (
            <AvaAnswerCard
              envelope={answerEnvelope}
              onAskAnother={() => setAsked(null)}
            />
          ) : (
            <StateBanner
              decision={{
                tone: "neutral",
                title: "aVa is reasoning...",
                body: "",
              }}
              compact
            />
          )
        ) : (
          <GatedSection
            envelope={suggestionsEnvelope}
            label="Suggested questions"
            emptyTitle="No gate-passing suggestions for this lens yet"
            emptyBody="A suggested question is only offered once its underlying evidence would actually resolve -- none do yet for airline-demo-new."
          >
            {(suggestions) => (
              <ul className="space-y-1.5">
                {suggestions
                  .filter((s) => s.gatePasses)
                  .map((s) => (
                    <li key={s.questionId}>
                      <button
                        type="button"
                        onClick={() => setAsked(s.questionText)}
                        className="w-full rounded-md border border-[rgba(10,10,11,0.12)] px-2.5 py-1.5 text-left text-sm text-[#2c2c2a] hover:border-[rgba(0,102,204,0.4)]"
                      >
                        {s.questionText}
                      </button>
                    </li>
                  ))}
              </ul>
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
