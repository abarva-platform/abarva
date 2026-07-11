"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { AvaAskMark } from "@/components/agent-answer/AvaAskMark";
import { extractArtifacts } from "@/lib/agent/artifacts";
import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import { getPhaseCaptureSections } from "@/lib/programs/phase-capture-contract";
import type { PhaseTallyRow } from "@/lib/programs/phase-explorer-tallies";
import type { StrategicMove } from "@/lib/programs/types.ui";

interface AvaChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

let avaTurnCounter = 0;
function nextAvaTurnId(): string {
  avaTurnCounter += 1;
  return `ava-turn-${avaTurnCounter}`;
}

type SubstepKey =
  | "prepare"
  | "current"
  | "findings"
  | "options"
  | "decide"
  | "canvas"
  | "value"
  | "workstreams"
  | "approve";

interface Substep {
  key: SubstepKey;
  label: string;
}

interface PhaseContract {
  phase: number;
  code: string;
  navLabel: string;
  title: string;
  question: string;
  lede: string;
  substeps: Substep[];
  sessions: string[];
  templates: Array<{ name: string; type: string }>;
  avaRole: string;
  avaContext: string;
  avaQuestions: string[];
}

interface MovesPhaseStandaloneClientProps {
  move: StrategicMove;
  phaseNum: number;
  phaseTallies: PhaseTallyRow[];
  evidenceNeedPackets: MoveEvidenceNeedPacket[];
}

type WorkspaceView = "phase" | "files";

type GateWorkStatus = "idle" | "generating" | "approving" | "approved" | "blocked";
type UploadWorkStatus = "idle" | "uploading" | "uploaded" | "error";

interface GeneratedPhaseOutput {
  title: string;
  typeKey: string;
  status: "queued" | "generated" | "error";
  runId?: string | null;
  error?: string;
}

interface GateWorkState {
  status: GateWorkStatus;
  message?: string;
  outputs: GeneratedPhaseOutput[];
}

const PHASES: PhaseContract[] = [
  {
    phase: 0,
    code: "P0",
    navLabel: "Originate",
    title: "Originate",
    question: "What business bet should become a governed Move?",
    lede:
      "Capture the intent, sponsor, value hypothesis, and first evidence family before the work becomes a program.",
    substeps: [
      { key: "prepare", label: "Prepare" },
      { key: "decide", label: "Frame" },
      { key: "approve", label: "Gate approval" },
    ],
    sessions: ["Problem framing", "Sponsor alignment", "Evidence inventory"],
    templates: [
      { name: "Move Origination Brief", type: "DOCX" },
      { name: "Value Hypothesis Canvas", type: "XLSX" },
      { name: "Evidence Inventory", type: "XLSX" },
    ],
    avaRole: "Origination guide",
    avaContext:
      "I help frame the Move from sponsor intent, value hypotheses, and the evidence needed to prove it.",
    avaQuestions: [
      "What would make this worth funding?",
      "What evidence is missing before charter?",
      "Who should sponsor the decision?",
    ],
  },
  {
    phase: 1,
    code: "P1",
    navLabel: "Charter",
    title: "Charter",
    question: "What exactly are we committing to investigate?",
    lede:
      "Turn the idea into a bounded charter: scope, owner, success measures, assumptions, and the gate that protects the next phase.",
    substeps: [
      { key: "prepare", label: "Prepare" },
      { key: "decide", label: "Scope" },
      { key: "approve", label: "Gate approval" },
    ],
    sessions: ["Sponsor charter review", "Scope boundary workshop", "Success metric review"],
    templates: [
      { name: "Strategic Move Charter", type: "DOCX" },
      { name: "Scope Boundary Matrix", type: "XLSX" },
      { name: "Stakeholder Map", type: "PPTX" },
    ],
    avaRole: "Charter partner",
    avaContext:
      "I keep scope, success measures, and decision rights visible so the Move does not become a loose AI pilot.",
    avaQuestions: [
      "What is in and out of scope?",
      "Which success metric is weakest?",
      "What assumption should be challenged first?",
    ],
  },
  {
    phase: 2,
    code: "P2",
    navLabel: "Understand Current State",
    title: "Understand Current State",
    question: "What is true now, before we design the future state?",
    lede:
      "Use operational evidence, metrics, systems, workforce signals, and constraints to diagnose the current state before choosing a path.",
    substeps: [
      { key: "prepare", label: "Prepare" },
      { key: "current", label: "Current state" },
      { key: "findings", label: "Findings" },
      { key: "approve", label: "Gate approval" },
    ],
    sessions: ["Current-state walkthrough", "KPI and baseline review", "Systems and handoff review", "Root-cause review"],
    templates: [
      { name: "Current-State Process Map", type: "DOCX" },
      { name: "Operational Baseline", type: "XLSX" },
      { name: "Systems Landscape", type: "XLSX" },
      { name: "Root-Cause Findings Summary", type: "DOCX" },
    ],
    avaRole: "Current-state analyst",
    avaContext:
      "I map uploaded evidence to process, data, systems, controls, workforce, and value lanes before the design work starts.",
    avaQuestions: [
      "What does the evidence prove?",
      "Which blocker is structural?",
      "What cannot be claimed yet?",
    ],
  },
  {
    phase: 3,
    code: "P3",
    navLabel: "Choose the Approach",
    title: "Choose the Approach",
    question: "Which solution approach should we use?",
    lede:
      "Strategy-phase solutioning: we design each lane just enough to estimate effort, sequence the roadmap, and map the risks - not to build it here. aVa recommends; you decide with your SMEs and approve.",
    substeps: [
      { key: "prepare", label: "Prepare" },
      { key: "options", label: "Options" },
      { key: "decide", label: "Decide" },
      { key: "canvas", label: "Design canvas" },
      { key: "approve", label: "Gate approval" },
    ],
    sessions: [
      "Solution options workshop",
      "Architecture constraints review",
      "Human + AI work-split review",
      "Controls & guardrails review",
    ],
    templates: [
      { name: "Solution Options Canvas", type: "DOCX" },
      { name: "Pros / Cons & Tradeoff Matrix", type: "XLSX" },
      { name: "Human + AI Work Split", type: "DOCX" },
      { name: "Controls & Guardrails Review", type: "DOCX" },
      { name: "Solution Approach Decision Summary", type: "DOCX" },
      { name: "Design-Lane Risk Register", type: "XLSX" },
    ],
    avaRole: "Solution-design partner",
    avaContext:
      "I use the prior phase evidence to compare approaches, flag readiness risk, and keep the decision traceable.",
    avaQuestions: [
      "Which option best fits the evidence?",
      "Where are we over-designing?",
      "What must be true before P4?",
    ],
  },
  {
    phase: 4,
    code: "P4",
    navLabel: "Build the Plan",
    title: "Build the Plan",
    question: "What plan, value case, and sequencing should leadership approve?",
    lede:
      "Convert the chosen approach into workstreams, delivery scenarios, economics, dependencies, and the executive commit package.",
    substeps: [
      { key: "prepare", label: "Prepare" },
      { key: "value", label: "Value case" },
      { key: "workstreams", label: "Workstreams" },
      { key: "approve", label: "Gate approval" },
    ],
    sessions: ["Value case workshop", "Delivery scenario review", "Roadmap sequencing", "Executive commit review"],
    templates: [
      { name: "Roadmap & Business Case", type: "PPTX" },
      { name: "Delivery Scenario Model", type: "XLSX" },
      { name: "Workstream Plan", type: "XLSX" },
      { name: "Executive Commit Packet", type: "DOCX" },
    ],
    avaRole: "Business-case partner",
    avaContext:
      "I convert the approved approach into a value-backed plan with explicit dependencies and risk controls.",
    avaQuestions: [
      "Which value lever carries the case?",
      "What is the riskiest dependency?",
      "What should leadership approve?",
    ],
  },
  {
    phase: 5,
    code: "P5",
    navLabel: "Prepare to Execute",
    title: "Prepare to Execute",
    question: "Is the organization ready to execute and track outcomes?",
    lede:
      "Prepare ownership, controls, adoption, value tracking, and Tower handoff so approved value can be measured after launch.",
    substeps: [
      { key: "prepare", label: "Prepare" },
      { key: "workstreams", label: "Readiness" },
      { key: "approve", label: "Gate approval" },
    ],
    sessions: ["Mobilization readiness", "Controls and adoption review", "Tower metric handoff"],
    templates: [
      { name: "Mobilization Handoff", type: "DOCX" },
      { name: "Adoption & Controls Plan", type: "XLSX" },
      { name: "Tower Outcome Ledger", type: "XLSX" },
    ],
    avaRole: "Execution-readiness partner",
    avaContext:
      "I help make the handoff explicit: owners, controls, adoption evidence, and Tower metrics.",
    avaQuestions: [
      "What is not ready for execution?",
      "Which metric goes to Tower?",
      "Who owns value leakage?",
    ],
  },
];

export const MOVES_STANDALONE_SUGGESTED_QUESTIONS = PHASES.map((phase) => ({
  phase: phase.phase,
  suggestedPrompts: phase.avaQuestions,
}));

function phaseFor(phaseNum: number): PhaseContract {
  return PHASES.find((phase) => phase.phase === phaseNum) ?? PHASES[0];
}

function formatArchetype(value: string | null | undefined): string {
  if (!value) return "Strategic Move";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function moneyRange(move: StrategicMove): string {
  const projected = move.valueAtStake.projected;
  if (!projected) return "Value at stake to be quantified";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: projected.currency || "USD",
    maximumFractionDigits: 0,
    notation: "compact",
  });
  return `${formatter.format(projected.low)}-${formatter.format(projected.high)}`;
}

export function MovesPhaseStandaloneClient({
  move,
  phaseNum,
  phaseTallies,
  evidenceNeedPackets,
}: MovesPhaseStandaloneClientProps) {
  const phase = phaseFor(phaseNum);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("phase");
  const [substepIndex, setSubstepIndex] = useState(0);
  const [avaOpen, setAvaOpen] = useState(false);
  const [avaThread, setAvaThread] = useState<AvaChatMessage[]>([]);
  const [avaInput, setAvaInput] = useState("");
  const [avaStreaming, setAvaStreaming] = useState(false);
  const avaThreadRef = useRef<AvaChatMessage[]>([]);
  avaThreadRef.current = avaThread;
  const [selectedOption, setSelectedOption] = useState("B");
  const [gateApproved, setGateApproved] = useState(false);
  const [gateWork, setGateWork] = useState<GateWorkState>({
    status: "idle",
    outputs: [],
  });
  const [draftedBrief, setDraftedBrief] = useState<Record<number, string>>({});
  const substep = phase.substeps[substepIndex] ?? phase.substeps[0];
  const progressPct = Math.round(((substepIndex + 1) / phase.substeps.length) * 100);
  const isFinalSubstep = substepIndex === phase.substeps.length - 1;
  const gateActionRunning = gateWork.status === "generating" || gateWork.status === "approving";
  const supportLine = useMemo(() => {
    const industry = move.tenant.industryCode
      ? move.tenant.industryCode.toUpperCase()
      : "enterprise";
    return `${move.tenant.name} · ${formatArchetype(move.archetype)} · ${industry}`;
  }, [move.archetype, move.tenant.industryCode, move.tenant.name]);

  const evidenceCount = evidenceNeedPackets.length || move.linkedEvidence.length;

  // aVa chat send. Ported from the retired StrategicMovePhaseClient's `send`
  // — same endpoint, same surfaceContext shape. Critically keeps
  // `programId` at the top level AND inside surfaceContext: canonicalizeSurface
  // (src/lib/agent/surface.ts) reads surfaceContext.programId specifically,
  // not moveId — sending only moveId here previously made aVa answer "No
  // active Move session is visible" (confirmed live, fixed, do not regress).
  const sendAvaMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || avaStreaming) return;
      setAvaInput("");

      const assistantId = nextAvaTurnId();
      setAvaThread((prev) => [
        ...prev,
        { id: nextAvaTurnId(), role: "user", text: trimmed },
        { id: assistantId, role: "assistant", text: "" },
      ]);
      setAvaStreaming(true);

      const abort = new AbortController();
      const hangTimer = setTimeout(() => abort.abort(), 180_000);

      try {
        const conversationHistory = avaThreadRef.current
          .filter((m) => m.text.trim().length > 0)
          .map((m) => ({ role: m.role, content: m.text }));

        const res = await fetch("/api/chat/agent", {
          method: "POST",
          signal: abort.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            tenantName: move.tenant.name,
            agentName: "Nexus",
            surface: `/strategic-moves/${move.id}/phase/${phaseNum}`,
            programId: move.id,
            conversationHistory,
            surfaceContext: {
              programId: move.id,
              moveId: move.id,
              phase: phaseNum,
              moveDisplayCode: move.displayCode,
              moveName: move.name,
              phaseLabel: phase.title,
            },
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error(`Agent returned ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let pendingBuffer = "";
        let committedVisible = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pendingBuffer += decoder.decode(value, { stream: true });
          const { visibleText, remaining } = extractArtifacts(pendingBuffer);
          committedVisible += visibleText;
          pendingBuffer = remaining;
          const display = committedVisible.trimEnd();
          setAvaThread((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, text: display } : m)),
          );
        }

        if (pendingBuffer.length > 0) {
          const final = extractArtifacts(pendingBuffer);
          committedVisible += final.visibleText;
          setAvaThread((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, text: committedVisible.trimEnd() } : m,
            ),
          );
        }
      } catch (err) {
        const message =
          err instanceof Error && err.name === "AbortError"
            ? "This is taking longer than expected. Try again in a moment."
            : "Something went wrong reaching aVa. Try again in a moment.";
        setAvaThread((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, text: message } : m)),
        );
      } finally {
        clearTimeout(hangTimer);
        setAvaStreaming(false);
      }
    },
    [avaStreaming, move.displayCode, move.id, move.name, move.tenant.name, phase.title, phaseNum],
  );

  function continueStep() {
    if (workspaceView === "files") return;
    setSubstepIndex((idx) => Math.min(idx + 1, phase.substeps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function approveGateAndGenerate() {
    setGateApproved(false);
    setGateWork({
      status: "generating",
      message: "Finalizing capture and starting required phase outputs...",
      outputs: [],
    });
    try {
      const finalizeBody: Record<string, unknown> = {
        phase: phase.phase,
        complete: true,
        sections: buildPhaseCaptureItems({
          draftedBrief,
          move,
          phase,
          selectedOption,
        }),
      };
      const finalizeRes = await fetch(`/api/v1/programs/${move.id}/phase-capture`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalizeBody),
      });
      const finalize = (await finalizeRes.json().catch(() => ({}))) as {
        ok?: boolean;
        missing?: string[];
        error?: string;
        detail?: string;
      };
      if (!finalizeRes.ok || !finalize.ok) {
        throw new Error(
          finalize.missing?.length
            ? `Capture incomplete - still missing: ${finalize.missing.join(", ")}`
            : finalize.detail ||
                finalize.error ||
                `Finalize failed (HTTP ${finalizeRes.status})`,
        );
      }

      let outputs: GeneratedPhaseOutput[] = [];
      if (phase.phase >= 1 && phase.phase <= 5) {
        const genRes = await fetch("/api/v1/deliverables/generate-phase", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moveId: move.id,
            phase: phase.phase,
            useCaseArchetype: move.archetype,
            moveName: move.name,
            clientDisplayName: move.tenant.name,
          }),
        });
        const generated = (await genRes.json().catch(() => ({}))) as {
          deliverables?: Array<{
            deliverableTypeKey: string;
            documentTitle: string;
            runId: string | null;
            status: "queued" | "error";
            error?: string;
          }>;
          detail?: string;
          error?: string;
        };
        if (!genRes.ok || !Array.isArray(generated.deliverables)) {
          throw new Error(
            generated.detail ||
              generated.error ||
              `Generation enqueue failed (HTTP ${genRes.status})`,
          );
        }
        outputs = generated.deliverables.map((item) => ({
          title: item.documentTitle,
          typeKey: item.deliverableTypeKey,
          runId: item.runId,
          status: item.status === "queued" ? "queued" : "error",
          error: item.error,
        }));
        const queued = outputs.filter((item) => item.status === "queued").length;
        if (queued === 0) {
          throw new Error(
            outputs.find((item) => item.error)?.error ||
              "No required deliverables could be queued for this phase.",
          );
        }
        setGateWork({
          status: "approving",
          message: `${queued} required output${queued === 1 ? "" : "s"} queued. Submitting gate approval...`,
          outputs,
        });
      } else {
        outputs = [
          {
            title: "Origination brief and charter request",
            typeKey: "p0_origination",
            status: "queued",
            runId: null,
          },
        ];
        setGateWork({
          status: "approving",
          message: "P0 capture finalized. Submitting gate approval...",
          outputs,
        });
      }

      const approvalRes = await fetch(`/api/v1/programs/${move.id}/phase-gate-approval`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: phase.phase,
          rationale: `P${phase.phase} reviewed, required phase outputs started, and gate approval submitted through the standalone Moves workspace.`,
        }),
      });
      const approval = (await approvalRes.json().catch(() => ({}))) as {
        ok?: boolean;
        gate?: { failedChecks?: Array<{ severity: string; reason?: string; check: string }> };
        detail?: string;
        error?: string;
      };
      if (!approvalRes.ok || !approval.ok) {
        const hard = approval.gate?.failedChecks
          ?.filter((check) => check.severity === "hard")
          .map((check) => check.reason || check.check)
          .join("; ");
        throw new Error(
          hard ||
            approval.detail ||
            approval.error ||
            `Gate approval failed (HTTP ${approvalRes.status})`,
        );
      }

      setGateApproved(true);
      setGateWork({
        status: "approved",
        message:
          phase.phase >= 1
            ? "Gate approved. Required phase outputs are queued in the deliverable worker and will appear in Files & Evidence."
            : "Gate approved. The origination record is ready for Charter.",
        outputs,
      });
    } catch (err) {
      setGateApproved(false);
      setGateWork((current) => ({
        ...current,
        status: "blocked",
        message: err instanceof Error ? err.message : "Gate approval failed.",
      }));
    }
  }

  return (
    <main className="mxw" data-testid="moves-phase-standalone">
      <MovesStandaloneStyles />
      <div className="mxw-surface">
        <aside className="mxw-side" aria-label="Move phases">
          <div className="mxw-move">
            <Link className="mxw-back" href="/strategic-moves">
              ← All Moves
            </Link>
            <h2>{move.name}</h2>
            <p>{supportLine}</p>
          </div>
          <div className="mxw-side-label">Phases</div>
          <nav className="mxw-phase-list">
            {PHASES.map((item) => {
              const tally = phaseTallies.find((row) => row.phase === item.phase);
              const state =
                item.phase < move.currentPhase
                  ? "done"
                  : item.phase === move.currentPhase
                    ? "current"
                    : "up";
              const viewing = item.phase === phase.phase;
              const phaseBody = (
                <>
                  <span className="mxw-phase-dot">
                    {state === "done" ? "✓" : item.code}
                  </span>
                  <span className="mxw-phase-name">{item.navLabel}</span>
                  <span className="mxw-phase-state">
                    {state === "done"
                      ? "Complete"
                      : state === "current"
                        ? "In progress"
                        : "Upcoming"}
                  </span>
                </>
              );
              return (
                <div className="mxw-phase-row" key={item.code}>
                  {item.phase <= move.currentPhase ? (
                    <Link
                      className={`mxw-phase ${state} ${viewing ? "viewing" : ""}`}
                      href={`/strategic-moves/${move.id}/phase/${item.phase}`}
                      title={
                        tally
                          ? `${tally.met} of ${tally.total} gate criteria met`
                          : undefined
                      }
                    >
                      {phaseBody}
                    </Link>
                  ) : (
                    <button
                      className={`mxw-phase ${state} ${viewing ? "viewing" : ""}`}
                      disabled
                      title={
                        tally
                          ? `${tally.met} of ${tally.total} gate criteria met`
                          : undefined
                      }
                    >
                      {phaseBody}
                    </button>
                  )}
                  {item.phase < 5 ? <span className="mxw-connector" /> : null}
                </div>
              );
            })}
          </nav>
          <div className="mxw-side-label mxw-workspace-label">Workspace</div>
          <div className="mxw-rail-extra">
            <button
              className={`mxw-lib-link ${workspaceView === "files" ? "viewing" : ""}`}
              onClick={() => {
                setWorkspaceView("files");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              type="button"
            >
              <span>▣</span>
              Files & Evidence
            </button>
          </div>
          <p className="mxw-foot">
            <b>aVa</b> assembles each phase from your evidence · you review &
            attest · the approved final carries forward
          </p>
        </aside>

        <section className="mxw-shell" aria-label={`${phase.code} phase workspace`}>
          {workspaceView === "files" ? (
            <FilesEvidenceExplorer
              move={move}
              phaseTallies={phaseTallies}
              setWorkspaceView={setWorkspaceView}
            />
          ) : (
            <>
              <div className="mxw-crumb">
                <Link href={`/strategic-moves/${move.id}/phase/${move.currentPhase ?? 0}`}>
                  {move.name}
                </Link>
                <span>/</span>
                {phase.code} · {phase.title}
              </div>

              <div className="mxw-stage-head">
                <div className="mxw-agent-chip">
                  <span />
                  AVA · MOVES
                </div>
                <h1>{phase.title}</h1>
                <div className="mxw-question">{phase.question}</div>
                <p>{phase.lede}</p>
              </div>

              <div className="mxw-stage-bar">
                <div className="mxw-progress">
                  <span className="mxw-track">
                    <span style={{ width: `${progressPct}%` }} />
                  </span>
                  <span className="mxw-step-label">
                    <b>
                      Step {substepIndex + 1} of {phase.substeps.length}
                    </b>{" "}
                    · {substep.label}
                  </span>
                </div>
                <button
                  className="mxw-btn mxw-primary"
                  disabled={isFinalSubstep && gateActionRunning}
                  onClick={
                    isFinalSubstep
                      ? () => void approveGateAndGenerate()
                      : continueStep
                  }
                  type="button"
                >
                  {isFinalSubstep
                    ? gateActionRunning
                      ? "Approving & generating..."
                      : "Approve & generate →"
                    : "Continue →"}
                </button>
              </div>

              <div className="mxw-substeps" role="tablist" aria-label="Phase steps">
                {phase.substeps.map((item, index) => (
                  <button
                    aria-selected={index === substepIndex}
                    className={`mxw-substep ${
                      index < substepIndex
                        ? "done"
                        : index === substepIndex
                          ? "cur"
                          : "up"
                    }`}
                    key={item.key}
                    onClick={() => setSubstepIndex(index)}
                    role="tab"
                    type="button"
                  >
                    <span>{index < substepIndex ? "✓" : index + 1}</span>
                    <b>{item.label}</b>
                  </button>
                ))}
              </div>

              <PhaseBody
                draftedBrief={draftedBrief}
                evidenceCount={evidenceCount}
                gateApproved={gateApproved}
                gateWork={gateWork}
                move={move}
                onApproveGate={approveGateAndGenerate}
                onDraftBrief={setDraftedBrief}
                onSelectOption={setSelectedOption}
                phase={phase}
                selectedOption={selectedOption}
                substep={substep.key}
              />
            </>
          )}
        </section>
      </div>

      <button
        aria-expanded={avaOpen}
        className="mxw-ava-fab"
        onClick={() => setAvaOpen((open) => !open)}
        type="button"
      >
        <AvaAskMark
          variant="avatar-dark"
          style={{ maxWidth: 28, minWidth: 28, width: 28 }}
        />
        Ask aVa
      </button>
      <aside className={`mxw-ava-pop ${avaOpen ? "open" : ""}`} aria-label="Ask aVa">
        <div className="mxw-ava-head">
          <AvaAskMark
            variant="avatar-dark"
            style={{ maxWidth: 30, minWidth: 30, width: 30 }}
          />
          <div>
            <strong>aVa</strong>
            <small>{phase.avaRole}</small>
          </div>
          <button onClick={() => setAvaOpen(false)} type="button">
            ×
          </button>
        </div>
        <div className="mxw-ava-body">
          {avaThread.length === 0 ? (
            <>
              <p>{phase.avaContext}</p>
              <div className="mxw-suggested">
                {workspaceView === "files" ? "Ask about this workspace" : "Ask about this phase"}
              </div>
              {phase.avaQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void sendAvaMessage(question)}
                  disabled={avaStreaming}
                >
                  {question}
                </button>
              ))}
            </>
          ) : (
            <div className="mxw-ava-thread">
              {avaThread.map((turn) => (
                <div key={turn.id} className={`mxw-ava-turn mxw-ava-turn-${turn.role}`}>
                  <span className="mxw-ava-turn-who">
                    {turn.role === "user" ? "You" : "aVa"}
                  </span>
                  <p>
                    {turn.text ||
                      (turn.role === "assistant" && avaStreaming ? "…" : "")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <form
          className="mxw-ava-composer"
          onSubmit={(event) => {
            event.preventDefault();
            void sendAvaMessage(avaInput);
          }}
        >
          <textarea
            value={avaInput}
            onChange={(event) => setAvaInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendAvaMessage(avaInput);
              }
            }}
            placeholder={`Ask aVa about ${phase.title.toLowerCase()}…`}
            rows={2}
            disabled={avaStreaming}
          />
          <button type="submit" disabled={avaStreaming || !avaInput.trim()}>
            Send
          </button>
        </form>
      </aside>
    </main>
  );
}

function PhaseBody({
  draftedBrief,
  evidenceCount,
  gateApproved,
  gateWork,
  move,
  onApproveGate,
  onDraftBrief,
  onSelectOption,
  phase,
  selectedOption,
  substep,
}: {
  draftedBrief: Record<number, string>;
  evidenceCount: number;
  gateApproved: boolean;
  gateWork: GateWorkState;
  move: StrategicMove;
  onApproveGate: () => void | Promise<void>;
  onDraftBrief: Dispatch<SetStateAction<Record<number, string>>>;
  onSelectOption: (value: string) => void;
  phase: PhaseContract;
  selectedOption: string;
  substep: SubstepKey;
}) {
  if (phase.phase === 0 && substep === "prepare") {
    return (
      <OriginateConsole
        draftedBrief={draftedBrief}
        move={move}
        onDraftBrief={onDraftBrief}
      />
    );
  }

  if (substep === "current" || substep === "findings") {
    return (
      <>
        <section className="mxw-assembly">
          <div>
            <span>a</span>
            <strong>What we found this phase</strong>
            <em>{evidenceCount} evidence item{evidenceCount === 1 ? "" : "s"}</em>
          </div>
          <p>
            aVa groups current-state evidence into process, data, systems,
            controls, workforce, and value lanes. Claims that are not in the
            uploaded evidence stay marked as gaps.
          </p>
        </section>
        <section className="mxw-zone">
          <h2>Findings to review</h2>
          <p>Accept, challenge, or comment before approving the phase.</p>
          <div className="mxw-findings">
            {[
              ["Process", "Current handoffs, delays, rework, and decision points."],
              ["Systems", "Applications, data stores, integrations, and constraints."],
              ["Value", "Baseline metrics, run cost, leakage, and impact measures."],
            ].map(([lane, detail]) => (
              <article className="mxw-finding" key={lane}>
                <span>{lane}</span>
                <strong>{detail}</strong>
                <small>Evidence-backed when cited; otherwise held as a gap.</small>
              </article>
            ))}
          </div>
        </section>
      </>
    );
  }

  if (substep === "prepare") {
    return (
      <>
        <HowToCard />
        <section className="mxw-zone">
          <h2>Templates & sessions</h2>
          <p>
            Run the workshop with these templates; upload the completed output
            to record the choice and carry evidence forward.
          </p>
          <TemplatesAndSessions phase={phase} />
        </section>
      </>
    );
  }

  if (substep === "options") {
    return (
      <>
        <section className="mxw-approach">
          <div>Assembled from your evidence + readiness - not a blank prompt</div>
          <h2>Recommended strategy path</h2>
          <p>
            The options are scored against what prior phases proved, where
            readiness is still weak, and which design lane carries the value.
          </p>
        </section>
        <section className="mxw-zone">
          <h2>Options & recommendation</h2>
          <p>Three approaches - aVa recommends one; you decide next.</p>
          <OptionCards selectedOption={selectedOption} onSelectOption={onSelectOption} />
        </section>
      </>
    );
  }

  if (substep === "decide") {
    return (
      <>
        <section className="mxw-zone">
          <h2>Decide the approach</h2>
          <p>
            Use the SME session to confirm, deviate, or define a new option.
            Deviations are allowed; the rationale must be captured.
          </p>
          <OptionCards selectedOption={selectedOption} onSelectOption={onSelectOption} />
        </section>
        <section className="mxw-upload">
          <div>
            <strong>Upload Solution Approach Decision Summary</strong>
            <span>Session notes, SME sign-off, tradeoffs, and rationale.</span>
          </div>
          <EvidenceUploadControl
            buttonLabel="Upload"
            moveId={move.id}
            phase={phase.phase}
            title="Solution Approach Decision Summary"
          />
        </section>
      </>
    );
  }

  if (substep === "canvas" || substep === "workstreams") {
    return (
      <section className="mxw-zone">
        <h2>{substep === "canvas" ? "The Building-Blocks Canvas" : "Workstreams"}</h2>
        <p>
          Design fidelity is strategy-grade: each lane is defined just far enough
          to estimate effort, sequence the roadmap, and price the risk.
        </p>
        <div className="mxw-lanes">
          {[
            ["Process", "Workflow changes, decision rights, and handoff model."],
            ["Data", "Evidence, semantic layer, quality rules, and lineage."],
            ["Technology", "Integration, automation, platform, and control posture."],
            ["People", "Human + AI work split, adoption, and operating ownership."],
          ].map(([lane, detail], index) => (
            <article className="mxw-lane" key={lane}>
              <header>
                <span>{index + 1}</span>
                <strong>{lane}</strong>
              </header>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (substep === "value") {
    return (
      <section className="mxw-zone">
        <h2>The value case</h2>
        <p>Value stays explicit: projected impact, delivery cost, sensitivity, and assumptions.</p>
        <div className="mxw-value-grid">
          <div>
            <span>Projected</span>
            <strong>{moneyRange(move)}</strong>
          </div>
          <div>
            <span>Evidence posture</span>
            <strong>{evidenceCount} items</strong>
          </div>
          <div>
            <span>Decision state</span>
            <strong>{move.status.text}</strong>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="mxw-review">
        <h2>Gate approval</h2>
        <p>
          Approve only after the record is reviewed and decision evidence is on
          file. The approved version is what carries forward.
        </p>
        <div className="mxw-gate-attest">
          {[
            "Record reviewed with the accountable owner.",
            "Evidence and caveats are attached.",
            "Approved output becomes the next phase source of truth.",
          ].map((item, index) => (
            <span className={gateApproved || index < 2 ? "met" : "pending"} key={item}>
              {gateApproved || index < 2 ? "✓" : "○"} {item}
            </span>
          ))}
        </div>
        {gateWork.message ? (
          <div className={`mxw-gate-message ${gateWork.status}`}>
            {gateWork.message}
          </div>
        ) : null}
        <div className="mxw-deliverables">
          {(gateWork.outputs.length > 0
            ? gateWork.outputs
            : phase.templates.slice(0, 4).map((template) => ({
                title: template.name.replace("Template", "Deliverable"),
                typeKey: template.type,
                status: "queued" as const,
              }))
          ).map((output) => (
            <div
              className={output.status === "error" ? "error" : output.status}
              key={`${output.typeKey}-${output.title}`}
            >
              <span>{output.typeKey.slice(0, 4).toUpperCase()}</span>
              <strong>{output.title}</strong>
              {output.status === "generated" ? (
                <em>Available in Files & Evidence</em>
              ) : output.status === "error" ? (
                <em>{output.error ?? "Error"}</em>
              ) : gateWork.status === "approved" ? (
                <em>Queued in worker</em>
              ) : gateWork.status === "generating" || gateWork.status === "approving" ? (
                <em>Starting...</em>
              ) : (
                <em>Queued at approval</em>
              )}
            </div>
          ))}
        </div>
        {gateApproved ? (
          <div className="mxw-approved">
            <strong>✓ Approved and queued.</strong>
            <span>
              The feed-forward pack has been started. Open Files & Evidence to
              trace the queued documents and worker status.
            </span>
          </div>
        ) : (
          <button
            className="mxw-gate-button"
            disabled={gateWork.status === "generating" || gateWork.status === "approving"}
            onClick={() => void onApproveGate()}
            type="button"
          >
            {gateWork.status === "generating" || gateWork.status === "approving"
              ? "Approving & generating..."
              : "Approve & generate deliverables →"}
          </button>
        )}
      </section>
      <section className="mxw-gate">
        <h2>Gate criteria</h2>
        <div>
          {move.gateCriteria.length > 0 ? (
            move.gateCriteria.map((criterion) => (
              <span className={criterion.completed ? "met" : ""} key={criterion.id}>
                {criterion.completed ? "✓" : "○"} {criterion.label}
              </span>
            ))
          ) : (
            <span>No gate criteria are configured for this transition.</span>
          )}
        </div>
      </section>
    </>
  );
}

const ORIGINATE_FIELDS = [
  {
    title: "What's the bet / hypothesis",
    draft:
      "A focused AI/transformation bet that improves a measurable business workflow without bypassing human decision rights.",
  },
  {
    title: "Archetype classification",
    draft:
      "Assisted workflow automation with governed data, human approval, and explicit value tracking.",
  },
  {
    title: "Sponsor candidate",
    draft: "Business sponsor and technology owner to confirm at charter.",
  },
  {
    title: "Scope / boundary",
    draft:
      "In: the target workflow, evidence set, decision gates, and value metrics. Out: unrelated platform rebuilds.",
  },
  {
    title: "Evidence family selection",
    draft:
      "Operational logs, system exports, workflow samples, KPI baselines, and owner-reviewed session notes.",
  },
  {
    title: "Value hypothesis",
    draft:
      "Reduce cycle time, run cost, and leakage while improving reliability and adoption.",
  },
  {
    title: "Readiness checks",
    draft:
      "Confirm data quality, security posture, process ownership, and evaluation controls before automation expands.",
  },
];

function textOrDraft(draftedBrief: Record<number, string>, index: number): string {
  return draftedBrief[index]?.trim() || ORIGINATE_FIELDS[index]?.draft || "";
}

function buildPhaseCaptureItems({
  draftedBrief,
  move,
  phase,
  selectedOption,
}: {
  draftedBrief: Record<number, string>;
  move: StrategicMove;
  phase: PhaseContract;
  selectedOption: string;
}): Record<string, string> {
  if (phase.phase === 0) {
    return {
      business_trigger: textOrDraft(draftedBrief, 0),
      problem_statement: textOrDraft(draftedBrief, 0),
      affected_function_process: textOrDraft(draftedBrief, 3),
      initial_value_hypothesis: textOrDraft(draftedBrief, 5),
      stakeholder_owner_view: textOrDraft(draftedBrief, 2),
      known_evidence: textOrDraft(draftedBrief, 4),
      missing_evidence_open_questions: textOrDraft(draftedBrief, 6),
      recommendation_to_advance:
        "Advance to Charter after sponsor review; retain open evidence questions as explicit gate caveats.",
    };
  }

  const selectedOptionLabel =
    selectedOption === "A"
      ? "Optimize the current workflow"
      : selectedOption === "C"
        ? "Large transformation program"
        : "Phased platform + operating-model shift";
  const evidenceSummary =
    move.linkedEvidence.length > 0
      ? move.linkedEvidence.map((item) => item.summary).join("; ")
      : "Uploaded phase files, completed templates, workshop outputs, and owner attestations in Files & Evidence.";

  return Object.fromEntries(
    getPhaseCaptureSections(phase.phase).map((section) => [
      section.key,
      [
        `${section.label}: ${section.description}`,
        `Move: ${move.name}.`,
        `Phase: ${phase.code} ${phase.title}.`,
        `Selected approach: ${selectedOptionLabel}.`,
        `Evidence basis: ${evidenceSummary}`,
        "Approval note: accountable owner review and caveats must remain attached to the gate record.",
      ].join(" "),
    ]),
  );
}

function OriginateConsole({
  draftedBrief,
  move,
  onDraftBrief,
}: {
  draftedBrief: Record<number, string>;
  move: StrategicMove;
  onDraftBrief: Dispatch<SetStateAction<Record<number, string>>>;
}) {
  const done = ORIGINATE_FIELDS.filter((_, index) => draftedBrief[index]?.trim()).length;
  return (
    <section className="mxw-originate">
      <header>
        <div className="mxw-of-crumb">Strategic Moves › {move.name} › New</div>
        <div className="mxw-of-row">
          <h2>Originate a strategic move</h2>
          <span>{done === ORIGINATE_FIELDS.length ? "Ready" : "Untitled · Draft"}</span>
        </div>
        <p>Capture each section by talking to aVa or typing it directly.</p>
      </header>
      <div className="mxw-origin-timeline">
        {["P0", "P1", "P2", "P3", "P4", "P5", "→ Tower"].map((item, index) => (
          <span className={index === 0 ? "on" : ""} key={item}>
            <i />
            {item}
          </span>
        ))}
      </div>
      <div className="mxw-briefs">
        {ORIGINATE_FIELDS.map((field, index) => {
          const value = draftedBrief[index] ?? "";
          return (
            <label className={value ? "captured" : ""} key={field.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{field.title}</strong>
              <textarea
                onChange={(event) =>
                  onDraftBrief((current) => ({
                    ...current,
                    [index]: event.target.value,
                  }))
                }
                placeholder={`Type ${field.title.toLowerCase()}...`}
                value={value}
              />
              <button
                onClick={() =>
                  onDraftBrief((current) => ({
                    ...current,
                    [index]: field.draft,
                  }))
                }
                type="button"
              >
                <span>a</span>
                Let aVa draft this
              </button>
            </label>
          );
        })}
      </div>
      <div className="mxw-promote">
        <input defaultValue={move.name} aria-label="Move name" />
        <button disabled={done < ORIGINATE_FIELDS.length} type="button">
          Promote to P1 Charter →
        </button>
      </div>
      <p className="mxw-ob-foot">
        {done} of {ORIGINATE_FIELDS.length} required sections complete
        {done === ORIGINATE_FIELDS.length
          ? " · ready to promote"
          : ` · complete all ${ORIGINATE_FIELDS.length} to promote`}
      </p>
    </section>
  );
}

function FilesEvidenceExplorer({
  move,
  phaseTallies,
  setWorkspaceView,
}: {
  move: StrategicMove;
  phaseTallies: PhaseTallyRow[];
  setWorkspaceView: Dispatch<SetStateAction<WorkspaceView>>;
}) {
  const totalEvidence = move.linkedEvidence.length;
  const totalDeliverables = move.deliverables.length;
  const totalTemplates = PHASES.reduce((sum, phase) => sum + phase.templates.length, 0);
  return (
    <>
      <div className="mxw-crumb">
        <button onClick={() => setWorkspaceView("phase")} type="button">
          {move.name}
        </button>
        <span>/</span>
        Files & Evidence
      </div>
      <div className="mxw-stage-head">
        <div className="mxw-agent-chip">
          <span />
          AVA · MOVES
        </div>
        <h1>Files & Evidence</h1>
        <p>
          Every input template, client-loaded evidence file, and AbarVa-generated
          deliverable - organized by phase.
        </p>
      </div>
      <div className="mxw-files-legend">
        <span>
          <i className="tpl" />
          Input template <em>{totalTemplates}</em>
        </span>
        <span>
          <i className="evi" />
          Client evidence <em>{totalEvidence}</em>
        </span>
        <span>
          <i className="del" />
          Generated deliverable <em>{totalDeliverables}</em>
        </span>
      </div>
      <section className="mxw-inline-upload" aria-label="Upload move evidence">
        <div>
          <strong>Upload evidence to this phase</strong>
          <span>
            Session notes, completed templates, data exports, decision summaries,
            or owner attestations.
          </span>
        </div>
        <EvidenceUploadControl
          buttonLabel="Upload evidence"
          moveId={move.id}
          phase={move.currentPhase}
          title={`P${move.currentPhase} workspace evidence`}
        />
      </section>
      <div className="mxw-file-phases">
        {PHASES.map((phase) => {
          const tally = phaseTallies.find((row) => row.phase === phase.phase);
          const deliverables =
            move.deliverables.filter((deliverable) =>
              deliverable.title.toLowerCase().includes(phase.title.toLowerCase()),
            ) || [];
          return (
            <section className="mxw-file-phase" key={phase.code}>
              <header>
                <span className={tally?.state ?? "upcoming"}>
                  {tally?.state === "done" ? "✓" : phase.code}
                </span>
                <strong>
                  {phase.code} · {phase.navLabel}
                </strong>
                <em>
                  {tally?.state === "done"
                    ? "Complete"
                    : tally?.state === "current"
                      ? "In progress"
                      : "Upcoming"}
                </em>
              </header>
              <div className="mxw-file-cols">
                <FileColumn
                  items={phase.templates.map((template) => [
                    template.name,
                    template.type,
                    "Template",
                  ])}
                  kind="tpl"
                  title="Input templates"
                />
                <FileColumn
                  items={
                    phase.phase === move.currentPhase
                      ? move.linkedEvidence.map((evidence) => [
                          evidence.anchor,
                          "EVI",
                          evidence.summary,
                        ])
                      : []
                  }
                  kind="evi"
                  title="Client evidence"
                />
                <FileColumn
                  items={
                    deliverables.length > 0
                      ? deliverables.map((deliverable) => [
                          deliverable.title,
                          "DOC",
                          deliverable.status,
                        ])
                      : phase.templates.slice(0, 2).map((template) => [
                          template.name.replace("Template", "Deliverable"),
                          "DOC",
                          phase.phase <= move.currentPhase ? "Queued" : "Scheduled",
                        ])
                  }
                  kind="del"
                  title="Generated deliverables"
                />
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function FileColumn({
  items,
  kind,
  title,
}: {
  items: string[][];
  kind: "tpl" | "evi" | "del";
  title: string;
}) {
  return (
    <div className="mxw-file-col">
      <header>
        <i className={kind} />
        {title}
        <span>{items.length}</span>
      </header>
      {items.length === 0 ? (
        <p>None yet</p>
      ) : (
        items.map(([name, type, meta]) => (
          <div className="mxw-file-row" key={`${kind}-${name}`}>
            <b>{type}</b>
            <span>
              <strong>{name}</strong>
              <small>{meta}</small>
            </span>
            <em>{kind === "tpl" ? "Ready" : kind === "evi" ? "Filed" : "Tracked"}</em>
          </div>
        ))
      )}
    </div>
  );
}

function EvidenceUploadControl({
  buttonLabel,
  moveId,
  phase,
  title,
}: {
  buttonLabel: string;
  moveId: string;
  phase: number;
  title: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<UploadWorkStatus>("idle");
  const [message, setMessage] = useState("");

  async function upload(file: File | null | undefined) {
    if (!file) return;
    setStatus("uploading");
    setMessage(`Uploading ${file.name}...`);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("phase", String(phase));
      form.append("family", "uploaded_evidence");
      form.append("title", title || file.name);
      const res = await fetch(`/api/v1/programs/${moveId}/artifacts/upload`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        detail?: string;
        error?: string;
      };
      if (!res.ok || !payload.ok) {
        throw new Error(
          payload.detail || payload.error || `Upload failed (HTTP ${res.status})`,
        );
      }
      setStatus("uploaded");
      setMessage(`Uploaded ${file.name}`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mxw-upload-control">
      <input
        aria-label={`${buttonLabel} file`}
        className="mxw-hidden-file"
        onChange={(event) => void upload(event.currentTarget.files?.[0])}
        ref={inputRef}
        type="file"
      />
      <button
        disabled={status === "uploading"}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        {status === "uploading" ? "Uploading..." : buttonLabel}
      </button>
      {message ? (
        <span className={`mxw-upload-status ${status}`}>{message}</span>
      ) : null}
    </div>
  );
}

function HowToCard() {
  return (
    <section className="mxw-howto">
      <header>
        <span>a</span>
        <h2>How to complete this phase</h2>
      </header>
      <div className="mxw-howflow">
        {[
          ["Review", "Read what AbarVa found, then download the recommended templates."],
          ["Run", "Conduct the working session with your SMEs and upload the summary."],
          ["Approve", "Confirm what changed, then approve to unlock the next phase."],
        ].map(([title, detail], index) => (
          <div className="mxw-how-step" key={title}>
            <span>{index + 1}</span>
            <div>
              <strong>{title}</strong>
              <small>{detail}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TemplatesAndSessions({ phase }: { phase: PhaseContract }) {
  return (
    <div className="mxw-ts-grid">
      <div className="mxw-ts-col">
        <header>
          <span>Recommended sessions</span>
          <b>{phase.sessions.length}</b>
        </header>
        {phase.sessions.map((session) => (
          <div className="mxw-session" key={session}>
            <span />
            {session}
          </div>
        ))}
      </div>
      <div className="mxw-ts-col">
        <header>
          <span>Templates to use</span>
          <b>{phase.templates.length}</b>
        </header>
        {phase.templates.map((template) => (
          <div className="mxw-template" key={template.name}>
            <em>{template.type}</em>
            <span>{template.name}</span>
            <small>Use in workspace</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function OptionCards({
  selectedOption,
  onSelectOption,
}: {
  selectedOption: string;
  onSelectOption: (value: string) => void;
}) {
  const options = [
    ["A", "Optimize the current workflow", "Lowest disruption; limited step-change value."],
    ["B", "Phased platform + operating-model shift", "Balanced value, control, and adoption path.", true],
    ["C", "Large transformation program", "Highest ambition; highest readiness burden."],
  ] as const;

  return (
    <div className="mxw-options">
      {options.map(([code, title, detail, recommended]) => (
        <button
          className={`${selectedOption === code ? "selected" : ""} ${
            recommended ? "recommended" : ""
          }`}
          key={code}
          onClick={() => onSelectOption(code)}
          type="button"
        >
          <span>{code}</span>
          <strong>{title}</strong>
          {recommended ? <em>✓ aVa recommends</em> : null}
          <small>{detail}</small>
        </button>
      ))}
    </div>
  );
}

function MovesStandaloneStyles() {
  return (
    <style>{`
.mxw {
  --bg:#f7f5f1; --card:#ffffff; --soft:#faf9f6;
  --line:rgba(20,20,19,0.08); --line-2:rgba(20,20,19,0.14);
  --ink:#1a1a18; --ink-2:#3d3c39; --muted:#75736c; --faint:#a4a29a;
  --blue:#0057b8; --blue-tint:#eef4fb; --green:#1d8f68; --green-tint:#e8f5ef;
  --amber:#b0730f; --amber-tint:#fbf1df; --teal:#1f8578; --gold:#9c7b3f;
  --shadow:0 1px 2px rgba(20,20,19,.04),0 8px 24px rgba(20,20,19,.05);
  height:100%; min-height:0; overflow:auto; background:var(--bg); color:var(--ink);
  font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size:15px; line-height:1.55; -webkit-font-smoothing:antialiased;
}
.mxw *{box-sizing:border-box}
.mxw a{text-decoration:none}
.mxw button{font:inherit}
.mxw-surface{display:grid;grid-template-columns:270px minmax(0,1fr);min-height:100%}
.mxw-side{border-right:1px solid var(--line);background:var(--soft);padding:20px 16px;position:sticky;top:0;height:calc(100vh - 64px);overflow-y:auto;display:flex;flex-direction:column}
.mxw-move{padding:0 8px 15px;border-bottom:1px solid var(--line);margin-bottom:14px}
.mxw-back{font-size:12px;color:var(--muted);display:inline-flex;margin-bottom:12px}
.mxw-back:hover{color:var(--ink)}
.mxw-move h2{font-family:Georgia,serif;font-size:17px;font-weight:700;letter-spacing:-.3px;line-height:1.2;margin:0;color:var(--ink)}
.mxw-move p{font-size:11.5px;color:var(--muted);margin:4px 0 0;line-height:1.4}
.mxw-side-label{font-size:10.5px;letter-spacing:.6px;text-transform:uppercase;color:var(--faint);font-weight:600;padding:0 8px;margin-bottom:6px}
.mxw-phase-list{display:flex;flex-direction:column}
.mxw-phase-row{display:flex;flex-direction:column}
.mxw-phase{display:flex;align-items:center;gap:11px;padding:8px;border-radius:8px;text-align:left;background:none;border:0;width:100%;position:relative;color:inherit;cursor:pointer}
.mxw-phase:hover{background:rgba(20,20,19,.04)}
.mxw-phase.viewing{background:var(--card);box-shadow:0 1px 2px rgba(20,20,19,.05)}
.mxw-phase.viewing:before{content:"";position:absolute;left:-16px;top:8px;bottom:8px;width:3px;border-radius:0 3px 3px 0;background:var(--blue)}
.mxw-phase-dot{width:22px;height:22px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:ui-monospace, SFMono-Regular, Menlo, monospace;font-size:9.5px;font-weight:700}
.mxw-phase.done .mxw-phase-dot{background:var(--ink);color:#fff}
.mxw-phase.current .mxw-phase-dot{background:var(--blue);color:#fff}
.mxw-phase.up .mxw-phase-dot{background:var(--card);border:1.5px solid var(--line-2);color:var(--faint)}
.mxw-phase-name{font-size:13.5px;font-weight:500;color:var(--ink-2);flex:1;line-height:1.3}
.mxw-phase.current .mxw-phase-name{font-weight:600;color:var(--ink)}
.mxw-phase.up .mxw-phase-name{color:var(--muted)}
.mxw-phase-state{font-size:10.5px;color:var(--faint);font-weight:500}
.mxw-phase.current .mxw-phase-state{color:var(--blue);font-weight:600}
.mxw-phase.done .mxw-phase-state{color:var(--green)}
.mxw-connector{width:1.5px;height:7px;background:var(--line-2);margin-left:18px}
.mxw-rail-extra{margin-top:14px;padding-top:12px;border-top:1px solid var(--line)}
.mxw-workspace-label{margin-top:14px}
.mxw-lib-link{display:flex;align-items:center;gap:10px;padding:9px 8px;border-radius:8px;color:var(--ink-2);font-size:13.5px;font-weight:500;background:none;border:0;width:100%;text-align:left;cursor:pointer}
.mxw-lib-link:hover{background:rgba(20,20,19,.04)}
.mxw-lib-link.viewing{background:var(--card);box-shadow:0 1px 2px rgba(20,20,19,.05)}
.mxw-lib-link span{width:22px;height:22px;border-radius:6px;background:var(--card);border:1px solid var(--line-2);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--muted)}
.mxw-foot{margin-top:auto;padding:14px 8px 0;border-top:1px solid var(--line);font-size:11.5px;color:var(--faint);line-height:1.6}
.mxw-foot b{color:var(--muted);font-weight:600}
.mxw-shell{width:min(1120px,calc(100vw - 338px));max-width:calc(100vw - 338px);margin:0 auto;padding:38px 40px 96px}
.mxw-crumb{font-size:13px;color:var(--muted);margin-bottom:20px}
.mxw-crumb a,.mxw-crumb button{color:var(--muted);background:none;border:0;font:inherit;cursor:pointer}
.mxw-crumb a:hover,.mxw-crumb button:hover{color:var(--ink)}
.mxw-crumb span{margin:0 7px;color:var(--faint)}
.mxw-stage-head{margin-bottom:18px}
.mxw-agent-chip{display:inline-flex;align-items:center;gap:7px;font-size:11px;letter-spacing:.5px;text-transform:uppercase;font-weight:600;color:var(--muted);margin-bottom:12px}
.mxw-agent-chip span{width:7px;height:7px;border-radius:50%;background:var(--teal)}
.mxw-stage-head h1{font-family:Georgia,serif;font-size:32px;font-weight:700;letter-spacing:-.7px;line-height:1.08;margin:0 0 6px}
.mxw-question{font-size:15.5px;font-weight:600;color:var(--ink);margin-bottom:2px}
.mxw-stage-head p{font-size:15.5px;color:var(--muted);line-height:1.55;max-width:70ch;margin:0}
.mxw-stage-bar{position:sticky;top:52px;z-index:40;display:flex;align-items:center;gap:20px;padding:14px 0 15px;margin-bottom:8px;background:var(--bg);border-bottom:1px solid var(--line)}
.mxw-progress{display:flex;align-items:center;gap:14px;flex:1}
.mxw-track{flex:1;height:6px;border-radius:3px;background:rgba(20,20,19,.07);overflow:hidden;max-width:260px}
.mxw-track span{display:block;height:100%;background:var(--green);border-radius:3px;transition:width .35s ease}
.mxw-step-label{font-size:13px;color:var(--muted);font-weight:500;white-space:nowrap}
.mxw-step-label b{color:var(--ink);font-weight:600}
.mxw-btn{padding:10px 18px;border-radius:9px;font-size:14px;font-weight:600;border:1px solid transparent;cursor:pointer}
.mxw-primary{background:var(--ink);color:#fff}
.mxw-primary:hover{background:#000}
.mxw-substeps{display:flex;align-items:center;flex-wrap:nowrap;gap:1px;margin:22px 0 8px;padding-bottom:6px;overflow-x:auto}
.mxw-substep{display:flex;align-items:center;gap:9px;padding:7px 8px;background:none;border:0;cursor:pointer;border-radius:9px;flex-shrink:0;color:var(--muted)}
.mxw-substep:hover{background:rgba(20,20,19,.03)}
.mxw-substep span{width:25px;height:25px;border-radius:50%;font-size:10.5px;font-weight:700;display:flex;align-items:center;justify-content:center;background:var(--card);border:1.5px solid var(--line-2);color:var(--faint)}
.mxw-substep.done span{background:var(--ink);border-color:var(--ink);color:#fff}
.mxw-substep.cur span{background:var(--blue);border-color:var(--blue);color:#fff;box-shadow:0 0 0 3px var(--blue-tint)}
.mxw-substep b{font-size:13px;font-weight:500;white-space:nowrap}
.mxw-substep.cur b{color:var(--ink);font-weight:600}
.mxw-howto{border:1px solid var(--line-2);border-radius:13px;background:linear-gradient(180deg,#fbfaf7,var(--card) 60%);padding:18px 20px}
.mxw-howto header{display:flex;align-items:center;gap:10px;margin-bottom:15px}
.mxw-howto header span,.mxw-assembly span{width:26px;height:26px;border-radius:7px;background:#12332e;color:#5fd0c2;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-weight:800;font-size:14px}
.mxw-ava-head .avaAskMark,.mxw-ava-fab .avaAskMark{border-radius:9px;overflow:hidden}
.mxw-howto h2,.mxw-zone h2,.mxw-review h2,.mxw-gate h2{font-family:Georgia,serif;font-size:19px;font-weight:700;letter-spacing:-.4px;margin:0}
.mxw-howflow{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:stretch}
.mxw-how-step{position:relative;display:grid;grid-template-columns:30px minmax(0,1fr);gap:10px;align-items:start;border:1px solid rgba(20,20,19,.08);border-radius:11px;background:rgba(255,255,255,.62);padding:13px 14px;min-height:96px}
.mxw-how-step:not(:last-child)::after{content:"→";position:absolute;right:-13px;top:50%;transform:translateY(-50%);width:12px;text-align:center;color:var(--faint);font-size:14px;font-weight:700}
.mxw-how-step span{width:28px;height:28px;border-radius:50%;background:var(--ink);color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center}
.mxw-how-step strong{display:block;font-size:14px;color:var(--ink);margin:1px 0 5px}
.mxw-how-step small{display:block;font-size:12.5px;color:var(--muted);line-height:1.42;max-width:24ch}
.mxw-zone{margin-top:24px}
.mxw-zone>p{font-size:13px;color:var(--muted);margin:5px 0 15px;line-height:1.5;max-width:70ch}
.mxw-ts-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(360px,1fr);gap:16px}
.mxw-ts-col{border:1px solid var(--line);border-radius:12px;background:var(--card);overflow:hidden}
.mxw-ts-col header{padding:13px 16px;border-bottom:1px solid var(--line);background:var(--soft);display:flex;align-items:center;gap:9px}
.mxw-ts-col header span{font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:var(--faint);font-weight:700}
.mxw-ts-col header b{margin-left:auto;font-size:11px;color:var(--faint)}
.mxw-session{display:flex;align-items:center;gap:10px;padding:11px 16px;border-bottom:1px solid var(--line);font-size:13.5px;color:var(--ink-2)}
.mxw-session:last-child,.mxw-template:last-child{border-bottom:0}
.mxw-session span{width:7px;height:7px;border-radius:50%;background:var(--teal);flex-shrink:0}
.mxw-template{display:grid;grid-template-columns:34px 1fr auto;gap:12px;align-items:center;padding:10px 16px;border-bottom:1px solid var(--line)}
.mxw-template em{width:34px;height:34px;border-radius:8px;background:var(--blue-tint);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:8.5px;font-style:normal;font-weight:700}
.mxw-template span{font-size:13.5px;font-weight:500;color:var(--ink)}
.mxw-template small{font-size:12px;font-weight:700;color:var(--muted);white-space:nowrap}
.mxw-assembly,.mxw-approach,.mxw-review,.mxw-gate{border:1px solid var(--line);border-radius:14px;background:var(--card);box-shadow:var(--shadow);padding:18px 20px;margin-top:20px}
.mxw-assembly{background:linear-gradient(180deg,#f4fbf9,var(--card) 60%)}
.mxw-assembly div{display:flex;align-items:center;gap:11px}
.mxw-assembly strong{font-family:Georgia,serif;font-size:17px}
.mxw-assembly em{margin-left:auto;font-size:11px;font-style:normal;color:var(--green);font-weight:700;text-transform:uppercase}
.mxw-assembly p,.mxw-approach p,.mxw-review p{font-size:14px;color:var(--ink-2);line-height:1.55;margin:11px 0 0}
.mxw-findings{display:grid;gap:10px}
.mxw-finding{border:1px solid var(--line);border-radius:12px;background:var(--card);padding:14px 16px}
.mxw-finding span{display:inline-block;font-size:10px;letter-spacing:.6px;text-transform:uppercase;color:var(--teal);font-weight:700;margin-bottom:5px}
.mxw-finding strong{display:block;font-size:14px;color:var(--ink)}
.mxw-finding small{display:block;font-size:12px;color:var(--muted);margin-top:5px}
.mxw-approach{border-color:rgba(0,87,184,.25);background:linear-gradient(180deg,var(--blue-tint),var(--card) 60%)}
.mxw-approach div{font-size:9px;letter-spacing:1px;text-transform:uppercase;font-weight:700;color:var(--blue);margin-bottom:9px}
.mxw-approach h2{font-family:Georgia,serif;font-size:21px;margin:0}
.mxw-options{display:grid;gap:10px}
.mxw-options button{border:1px solid var(--line);border-radius:12px;background:var(--card);padding:14px 16px;display:grid;grid-template-columns:28px 1fr auto;gap:10px;text-align:left;cursor:pointer;align-items:center}
.mxw-options button.selected{border-color:var(--green);background:var(--green-tint)}
.mxw-options button>span{width:24px;height:24px;border-radius:7px;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700}
.mxw-options strong{font-size:14px;color:var(--ink)}
.mxw-options em{font-style:normal;font-size:11px;font-weight:700;color:var(--green)}
.mxw-options small{grid-column:2 / 4;font-size:12.5px;color:var(--muted)}
.mxw-upload{margin-top:20px;border:1px dashed var(--line-2);border-radius:13px;background:var(--soft);padding:18px;display:flex;align-items:center;justify-content:space-between;gap:14px}
.mxw-upload strong{display:block;font-size:14px}
.mxw-upload span{display:block;font-size:12.5px;color:var(--muted);margin-top:2px}
.mxw-review-actions a{padding:10px 16px;border-radius:9px;background:var(--ink);color:#fff;font-size:13px;font-weight:700;white-space:nowrap}
.mxw-inline-upload{margin:18px 0 22px;border:1px dashed var(--line-2);border-radius:13px;background:var(--soft);padding:16px 18px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.mxw-inline-upload strong{display:block;font-size:14px}
.mxw-inline-upload span{display:block;font-size:12.5px;color:var(--muted);margin-top:2px;max-width:64ch}
.mxw-upload-control{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.mxw-hidden-file{position:absolute;inline-size:1px;block-size:1px;opacity:0;pointer-events:none}
.mxw-upload-control button{padding:10px 16px;border-radius:9px;background:var(--ink);color:#fff;border:0;font-size:13px;font-weight:800;white-space:nowrap;cursor:pointer}
.mxw-upload-control button:disabled{opacity:.6;cursor:wait}
.mxw-upload-status{font-size:12px;font-weight:700;color:var(--muted)}
.mxw-upload-status.uploaded{color:var(--green)}
.mxw-upload-status.error{color:#b84a31}
.mxw-lanes{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.mxw-lane{border:1px solid var(--line);border-radius:13px;background:var(--card);overflow:hidden}
.mxw-lane header{display:flex;align-items:center;gap:10px;background:var(--soft);border-bottom:1px solid var(--line);padding:12px 14px}
.mxw-lane header span{width:24px;height:24px;border-radius:8px;background:var(--blue-tint);color:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px}
.mxw-lane header strong{font-size:14px}
.mxw-lane p{font-size:13px;color:var(--ink-2);line-height:1.45;margin:0;padding:14px}
.mxw-value-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.mxw-value-grid div{border:1px solid var(--line);border-radius:12px;background:var(--card);padding:14px 16px}
.mxw-value-grid span{display:block;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:var(--faint);font-weight:700}
.mxw-value-grid strong{display:block;font-size:18px;margin-top:4px}
.mxw-review-flow{display:flex;gap:6px;flex-wrap:wrap;margin:15px 0}
.mxw-review-flow span{padding:7px 12px;border:1px solid var(--line-2);border-radius:999px;font-size:12px;font-weight:600;color:var(--muted)}
.mxw-review-flow span.done{background:var(--green-tint);color:var(--green);border-color:var(--green)}
.mxw-review-flow span.cur{background:var(--blue-tint);color:var(--blue);border-color:var(--blue)}
.mxw-review-actions{display:flex;gap:10px;flex-wrap:wrap}
.mxw-gate div{display:grid;gap:8px;margin-top:12px}
.mxw-gate span{display:block;border:1px solid var(--line);border-radius:10px;background:var(--soft);padding:12px 14px;font-size:13px;color:var(--ink-2)}
.mxw-gate span.met{background:var(--green-tint);color:var(--green);border-color:rgba(29,143,104,.25)}
.mxw-gate-attest{display:flex;flex-direction:column;gap:10px;margin:15px 0}
.mxw-gate-attest span{display:block;border:1px solid var(--line);border-radius:11px;background:var(--card);padding:13px 15px;font-size:13.5px;color:var(--ink-2)}
.mxw-gate-attest span.met{border-color:rgba(29,143,104,.35);background:var(--green-tint);color:var(--green)}
.mxw-deliverables{display:grid;gap:8px;margin:15px 0}
.mxw-deliverables div{display:grid;grid-template-columns:40px 1fr auto;gap:12px;align-items:center;border:1px solid var(--line);border-radius:11px;background:var(--soft);padding:11px 13px}
.mxw-deliverables div.generated{background:var(--green-tint);border-color:rgba(29,143,104,.28)}
.mxw-deliverables span{width:36px;height:32px;border-radius:8px;background:var(--blue-tint);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800}
.mxw-deliverables strong{font-size:13.5px;color:var(--ink)}
.mxw-deliverables em{font-style:normal;font-size:12px;color:var(--muted);font-weight:700}
.mxw-deliverables a{font-size:12px;color:var(--green);font-weight:800}
.mxw-gate-button{margin-top:2px;background:var(--ink);color:#fff;border:0;border-radius:9px;padding:10px 16px;font-size:13px;font-weight:800;cursor:pointer}
.mxw-approved{display:flex;gap:10px;align-items:flex-start;border:1px solid rgba(29,143,104,.35);background:var(--green-tint);border-radius:11px;padding:13px 15px;color:var(--green);font-size:13px}
.mxw-approved span{color:var(--ink-2)}
.mxw-originate{border:1px solid var(--line);border-radius:16px;background:var(--card);box-shadow:var(--shadow);padding:22px}
.mxw-originate header{margin-bottom:18px}
.mxw-of-crumb{font-size:12px;color:var(--muted);margin-bottom:8px}
.mxw-of-row{display:flex;align-items:center;gap:12px;justify-content:space-between}
.mxw-of-row h2{font-family:Georgia,serif;font-size:24px;letter-spacing:-.5px;margin:0}
.mxw-of-row span{font-size:11px;border:1px solid var(--line-2);border-radius:999px;padding:5px 10px;color:var(--muted);font-weight:700}
.mxw-originate header p{font-size:13px;color:var(--muted);margin:4px 0 0}
.mxw-origin-timeline{display:flex;align-items:center;gap:10px;margin-bottom:18px;overflow-x:auto}
.mxw-origin-timeline span{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted);font-weight:700;white-space:nowrap}
.mxw-origin-timeline i{width:10px;height:10px;border-radius:50%;border:1.5px solid var(--line-2);background:var(--card)}
.mxw-origin-timeline span.on i{background:var(--green);border-color:var(--green)}
.mxw-briefs{display:grid;gap:10px}
.mxw-briefs label{display:grid;grid-template-columns:34px 1fr auto;gap:10px;border:1px solid var(--line);border-radius:12px;background:var(--soft);padding:12px}
.mxw-briefs label.captured{border-color:rgba(29,143,104,.28);background:linear-gradient(180deg,var(--green-tint),var(--card) 68%)}
.mxw-briefs label>span{width:28px;height:28px;border-radius:50%;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800}
.mxw-briefs strong{font-size:13.5px;color:var(--ink)}
.mxw-briefs textarea{grid-column:2 / 4;min-height:58px;border:1px solid var(--line);border-radius:9px;background:#fff;padding:10px;font:inherit;font-size:13px;color:var(--ink);resize:vertical}
.mxw-briefs button{grid-column:2 / 4;justify-self:start;display:flex;align-items:center;gap:7px;background:var(--card);border:1px solid var(--line-2);border-radius:9px;padding:7px 11px;font-size:12px;font-weight:800;color:var(--teal);cursor:pointer}
.mxw-briefs button span{width:18px;height:18px;border-radius:5px;background:#12332e;color:#5fd0c2;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif}
.mxw-promote{display:grid;grid-template-columns:1fr auto;gap:10px;margin-top:14px}
.mxw-promote input{border:1px solid var(--line-2);border-radius:10px;padding:11px 13px;font:inherit;font-size:13.5px}
.mxw-promote button{border:0;border-radius:10px;background:var(--ink);color:#fff;padding:11px 15px;font-weight:800}
.mxw-promote button:disabled{background:rgba(20,20,19,.16);color:var(--faint)}
.mxw-ob-foot{font-size:12px;color:var(--muted);margin:10px 0 0}
.mxw-files-legend{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0 22px}
.mxw-files-legend span{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:999px;background:var(--card);padding:7px 11px;font-size:12px;color:var(--ink-2);font-weight:700}
.mxw-files-legend i,.mxw-file-col header i{width:8px;height:8px;border-radius:50%}
.mxw-files-legend i.tpl,.mxw-file-col header i.tpl{background:var(--blue)}
.mxw-files-legend i.evi,.mxw-file-col header i.evi{background:var(--gold)}
.mxw-files-legend i.del,.mxw-file-col header i.del{background:var(--green)}
.mxw-files-legend em{font-style:normal;color:var(--muted)}
.mxw-file-phases{display:flex;flex-direction:column;gap:16px}
.mxw-file-phase{border:1px solid var(--line);border-radius:15px;background:var(--card);box-shadow:var(--shadow);overflow:hidden}
.mxw-file-phase>header{display:flex;align-items:center;gap:10px;padding:14px 16px;background:var(--soft);border-bottom:1px solid var(--line)}
.mxw-file-phase>header>span{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--card);border:1px solid var(--line-2);font-size:10px;font-weight:800;color:var(--faint)}
.mxw-file-phase>header>span.done{background:var(--ink);color:#fff;border-color:var(--ink)}
.mxw-file-phase>header>span.current{background:var(--blue);color:#fff;border-color:var(--blue)}
.mxw-file-phase header strong{font-size:14px;color:var(--ink)}
.mxw-file-phase header em{margin-left:auto;font-style:normal;font-size:11px;color:var(--muted);font-weight:800;text-transform:uppercase}
.mxw-file-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line)}
.mxw-file-col{background:var(--card);min-width:0}
.mxw-file-col header{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--line);font-size:11px;color:var(--faint);font-weight:800;text-transform:uppercase}
.mxw-file-col header span{margin-left:auto}
.mxw-file-col>p{padding:16px 14px;font-size:12px;color:var(--faint)}
.mxw-file-row{display:grid;grid-template-columns:38px 1fr auto;gap:10px;align-items:center;padding:11px 14px;border-bottom:1px solid var(--line)}
.mxw-file-row:last-child{border-bottom:0}
.mxw-file-row b{width:34px;height:30px;border-radius:8px;background:var(--blue-tint);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:8px}
.mxw-file-row span{min-width:0}
.mxw-file-row strong{display:block;font-size:12.8px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mxw-file-row small{display:block;font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mxw-file-row em{font-style:normal;color:var(--muted);font-size:11px;font-weight:800;text-align:right}
.mxw-ava-fab{position:fixed;right:24px;bottom:24px;z-index:70;display:flex;align-items:center;gap:9px;background:var(--ink);color:#fff;border:0;border-radius:999px;padding:11px 16px 11px 12px;box-shadow:0 6px 20px rgba(20,20,19,.22);cursor:pointer}
.mxw-ava-pop{position:fixed;right:24px;bottom:78px;z-index:71;width:348px;max-width:calc(100vw - 48px);background:var(--card);border:1px solid var(--line-2);border-radius:16px;box-shadow:0 16px 44px rgba(20,20,19,.2);overflow:hidden;display:none}
.mxw-ava-pop.open{display:block}
.mxw-ava-head{display:flex;align-items:center;gap:10px;padding:15px 17px;border-bottom:1px solid var(--line)}
.mxw-ava-head strong{display:block;font-size:14.5px}
.mxw-ava-head small{display:block;font-size:11px;color:var(--muted)}
.mxw-ava-head button{margin-left:auto;background:none;border:0;color:var(--faint);font-size:18px;cursor:pointer}
.mxw-ava-body{padding:15px 17px;max-height:320px;overflow-y:auto}
.mxw-ava-body p{font-size:12.5px;color:var(--ink-2);line-height:1.5;background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:11px 13px;margin:0}
.mxw-suggested{font-size:11px;letter-spacing:.4px;text-transform:uppercase;color:var(--faint);font-weight:600;margin:14px 0 8px}
.mxw-ava-body button{display:block;width:100%;text-align:left;border:1px solid var(--line);background:var(--card);border-radius:9px;padding:9px 12px;font-size:12.5px;color:var(--ink-2);cursor:pointer;margin-bottom:6px}
.mxw-ava-body button:disabled{opacity:.5;cursor:default}
.mxw-ava-thread{display:flex;flex-direction:column;gap:10px}
.mxw-ava-turn-who{display:block;font-size:10px;letter-spacing:.4px;text-transform:uppercase;color:var(--faint);font-weight:600;margin-bottom:3px}
.mxw-ava-turn p{font-size:12.5px;color:var(--ink-2);line-height:1.5;white-space:pre-wrap;margin:0;background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:9px 12px}
.mxw-ava-turn-user p{background:var(--card);border-color:var(--line-2)}
.mxw-ava-composer{display:flex;gap:8px;padding:12px 17px;border-top:1px solid var(--line);align-items:flex-end}
.mxw-ava-composer textarea{flex:1;resize:none;border:1px solid var(--line);border-radius:9px;padding:8px 10px;font:inherit;font-size:12.5px;color:var(--ink);background:#fff}
.mxw-ava-composer button{flex:none;border:0;background:var(--ink);color:#fff;border-radius:9px;padding:8px 14px;font-size:12.5px;font-weight:600;cursor:pointer}
.mxw-ava-composer button:disabled{opacity:.5;cursor:default}
@media (max-width:980px){.mxw-lanes,.mxw-value-grid{grid-template-columns:1fr}}
@media (max-width:900px){
  .mxw-surface{grid-template-columns:1fr}
  .mxw-side{display:none}
  .mxw-shell{width:100%;max-width:none}
  .mxw-shell{padding:30px 18px 80px}
  .mxw-howflow{grid-template-columns:1fr}
  .mxw-how-step{min-height:auto}
  .mxw-how-step:not(:last-child)::after{content:"↓";right:auto;left:20px;top:auto;bottom:-17px;transform:none;background:var(--card);width:16px}
}
@media (max-width:720px){
  .mxw-howflow,.mxw-ts-grid,.mxw-file-cols{grid-template-columns:1fr}
  .mxw-stage-bar{align-items:flex-start;flex-direction:column}
  .mxw-upload,.mxw-inline-upload{align-items:flex-start;flex-direction:column}
  .mxw-upload-control{justify-content:flex-start;width:100%}
  .mxw-options button{grid-template-columns:28px 1fr}
  .mxw-options em{grid-column:2}
  .mxw-options small{grid-column:2}
  .mxw-promote{grid-template-columns:1fr}
}
      `}</style>
  );
}
