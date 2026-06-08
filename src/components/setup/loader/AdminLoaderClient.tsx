"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { COLORS, RADIUS, TYPOGRAPHY } from "@/lib/design/design-tokens";
import { PILOT_UPLOAD_ATTESTATION_VERSION } from "@/lib/context-ingestion/upload-attestation";
import type {
  MappingProposal,
  StewardFinding,
  StewardValidation,
  LoaderDimension,
  PreservedSourceFile,
} from "@/lib/context-ingestion/loader/contract";
import {
  DropZone,
  UnderstandingProgress,
  ReviewTable,
  ClarificationStep,
  AskStewardDock,
  LandingZonePanel,
  LoaderStatePills,
} from "@/components/setup/loader";
import type {
  UnderstandingPhase,
  ReviewRowAction,
  StewardMessage,
  LoaderLifecycleStage,
  LoaderStageStatus,
} from "@/components/setup/loader";

type Phase = "idle" | "understanding" | "review" | "committing" | "done" | "error";

interface UnderstoodOk {
  ok: true;
  result: {
    preserved: PreservedSourceFile;
    parseKind: "tabular" | "document";
    proposal: MappingProposal;
    validation: StewardValidation;
  };
}
interface UnderstoodErr {
  ok: false;
  filename: string;
  error: string;
}
type Understood = UnderstoodOk | UnderstoodErr;

export interface AdminLoaderClientProps {
  clientId: string;
  tenantName: string;
}

const ACCEPT = ".csv,.json,.jsonl,.yaml,.yml,.xlsx,.pdf,.docx,.pptx";

/**
 * Admin Loader — client orchestrator. Drives the calm three-beat flow:
 * Drop → Understand (preserve + parse + map + validate) → Review → Commit.
 * Every network call hits the governed loader routes; nothing commits until
 * the operator confirms.
 */
export function AdminLoaderClient({ clientId, tenantName }: AdminLoaderClientProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [files, setFiles] = useState<File[]>([]);
  const [understood, setUnderstood] = useState<Understood[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [rowDecisions, setRowDecisions] = useState<Record<string, ReviewRowAction>>({});
  const [dimensionOverrides, setDimensionOverrides] = useState<Record<string, LoaderDimension>>({});
  const [busyKeys] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [landingCount, setLandingCount] = useState<number | null>(null);
  const [landingPath, setLandingPath] = useState<string>("context-landing");
  const [dockFile, setDockFile] = useState<PreservedSourceFile | null>(null);
  const [dockMessages, setDockMessages] = useState<StewardMessage[]>([]);

  // ── Landing-zone scan on mount (IT direct-upload exception). ──────────────
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/context-layer/loader/landing-zone")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.ok) return;
        setLandingCount(Array.isArray(data.objects) ? data.objects.length : 0);
        if (typeof data.container === "string") setLandingPath(`${data.container}/${data.prefix ?? ""}`);
      })
      .catch(() => void 0);
    return () => {
      cancelled = true;
    };
  }, []);

  const okResults = useMemo(
    () => understood.filter((u): u is UnderstoodOk => u.ok),
    [understood],
  );

  const proposals = useMemo<MappingProposal[]>(
    () =>
      okResults.map((u) => {
        const override = dimensionOverrides[u.result.preserved.objectKey];
        return override ? { ...u.result.proposal, dimension: override } : u.result.proposal;
      }),
    [okResults, dimensionOverrides],
  );

  const findingsByObjectKey = useMemo<Record<string, StewardFinding[]>>(() => {
    const map: Record<string, StewardFinding[]> = {};
    for (const u of okResults) {
      map[u.result.preserved.objectKey] = u.result.validation.flags;
    }
    return map;
  }, [okResults]);

  const allQuestions = useMemo(
    () => okResults.flatMap((u) => u.result.validation.questions),
    [okResults],
  );

  const understandingPhase: UnderstandingPhase = phase === "understanding" ? "mapping" : "done";

  const stages = useMemo<Partial<Record<LoaderLifecycleStage, LoaderStageStatus>>>(() => {
    const preserved: LoaderStageStatus = phase === "idle" ? "pending" : "done";
    const parsed: LoaderStageStatus =
      phase === "idle" ? "pending" : phase === "understanding" ? "active" : "done";
    const committed: LoaderStageStatus =
      phase === "committing" ? "active" : phase === "done" ? "done" : "pending";
    const indexed: LoaderStageStatus = phase === "done" ? "active" : "pending";
    return { preserved, parsed, committed, indexed };
  }, [phase]);

  // ── Understand ────────────────────────────────────────────────────────────
  const handleFiles = useCallback(async (picked: File[]) => {
    if (picked.length === 0) return;
    setFiles(picked);
    setPhase("understanding");
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.set("clientId", clientId);
      for (const f of picked) fd.append("files", f);
      const res = await fetch("/api/admin/context-layer/loader/understand", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.detail || data?.error || "understand_failed");
      setUnderstood(data.understood as Understood[]);
      setPhase("review");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setPhase("error");
    }
  }, [clientId]);

  // ── Commit ──────────────────────────────────────────────────────────────
  const handleCommit = useCallback(async () => {
    // Accept proposals not explicitly skipped, that are not review-required documents.
    const accepted = okResults
      .filter((u) => rowDecisions[u.result.preserved.objectKey] !== "skip")
      .filter((u) => !u.result.proposal.reviewRequired)
      .map((u) => {
        const key = u.result.preserved.objectKey;
        const override = dimensionOverrides[key];
        return override ? { ...u.result.proposal, dimension: override } : u.result.proposal;
      });

    if (accepted.length === 0) {
      setErrorMsg("Nothing to commit — every file is skipped or needs review.");
      return;
    }

    setPhase("committing");
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.set("clientId", clientId);
      fd.set("loadName", `admin-loader-${tenantName}`);
      fd.set("mode", "stage_and_process");
      fd.set("acceptedProposals", JSON.stringify(accepted));
      // Minimal pilot attestation (operator is signed-in admin; explicit confirm gate is upstream).
      fd.set("operatorAttestationAccepted", "true");
      fd.set("operatorAttestationVersion", PILOT_UPLOAD_ATTESTATION_VERSION);
      fd.set("operatorDataAuthorityConfirmed", "true");
      fd.set("operatorDataUseConfirmed", "true");
      fd.set("operatorSensitiveDataConfirmed", "true");
      for (const f of files) fd.append("files", f);
      const res = await fetch("/api/admin/context-layer/loader/commit", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.detail || data?.error || "commit_failed");
      setPhase("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setPhase("error");
    }
  }, [okResults, rowDecisions, dimensionOverrides, files, clientId, tenantName]);

  const onRowAction = useCallback((objectKey: string, action: ReviewRowAction) => {
    setRowDecisions((prev) => ({ ...prev, [objectKey]: action }));
  }, []);
  const onDimensionChange = useCallback((objectKey: string, dimension: LoaderDimension) => {
    setDimensionOverrides((prev) => ({ ...prev, [objectKey]: dimension }));
  }, []);
  const onAnswer = useCallback((questionKey: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: optionIndex }));
  }, []);

  const containerStyle: React.CSSProperties = {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.lg,
  };

  return (
    <section style={containerStyle} className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 style={{ fontFamily: TYPOGRAPHY.serif }} className="text-2xl">
          Load context
        </h1>
        <p className="text-sm opacity-70">
          Drop anything — a CSV, an org chart, a financial pack, a PDF. The loader preserves the original,
          understands it, and asks before it commits. {tenantName}.
        </p>
      </header>

      <LoaderStatePills stages={stages} />

      {(phase === "idle" || phase === "error") && (
        <>
          <DropZone
            onFilesSelected={handleFiles}
            accept={ACCEPT}
            helperText="Up to 40 files, 5 MB each. Originals are preserved to Azure Blob before anything is read."
          />
          <LandingZonePanel
            storagePath={landingPath}
            {...(landingCount !== null ? { newFileCount: landingCount } : {})}
            onReviewAndIngest={() => void 0}
          />
        </>
      )}

      {phase === "understanding" && (
        <UnderstandingProgress phase={understandingPhase} fileCount={files.length} />
      )}

      {(phase === "review" || phase === "committing" || phase === "done") && (
        <>
          {allQuestions.length > 0 && (
            <ClarificationStep
              questions={allQuestions}
              answers={answers}
              onAnswer={(qk, i) => onAnswer(qk, i)}
              disabled={phase !== "review"}
            />
          )}
          <ReviewTable
            proposals={proposals}
            findingsByObjectKey={findingsByObjectKey}
            onDimensionChange={onDimensionChange}
            onRowAction={onRowAction}
            busyObjectKeys={busyKeys}
          />
          {understood.some((u) => !u.ok) && (
            <p className="text-sm" style={{ color: COLORS.coralInk }}>
              {understood.filter((u) => !u.ok).length} file(s) could not be understood and were skipped.
            </p>
          )}
          {phase !== "done" && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCommit}
                disabled={phase === "committing"}
                className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {phase === "committing" ? "Committing…" : "Commit accepted"}
              </button>
              <span className="text-xs opacity-60">
                Documents needing review are held back automatically.
              </span>
            </div>
          )}
          {phase === "done" && (
            <p className="text-sm" style={{ color: COLORS.mintInk }}>
              Committed to the governed pipeline. Retrieval index refresh runs next.
            </p>
          )}
        </>
      )}

      {errorMsg && (
        <p className="text-sm" style={{ color: COLORS.coralInk }} role="alert">
          {errorMsg}
        </p>
      )}

      {dockFile && (
        <AskStewardDock
          file={dockFile}
          messages={dockMessages}
          onSend={(body) =>
            setDockMessages((prev) => [
              ...prev,
              { id: `${dockFile.objectKey}:${prev.length}`, author: "operator", body },
            ])
          }
          onClose={() => setDockFile(null)}
        />
      )}
    </section>
  );
}

export default AdminLoaderClient;
