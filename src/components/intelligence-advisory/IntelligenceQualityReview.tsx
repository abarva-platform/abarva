"use client";

import { useEffect, useRef, useState } from "react";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import type {
  AvaChatSessionExport,
  AvaChatSessionExportTurn,
} from "@/lib/ava-answer/export/session-types";
import type { EnterpriseLandscapeViewModel } from "@/lib/home/enterprise-landscape-view-model";
import {
  EXECUTIVE_REVIEW_SUITE,
  executiveReviewQuestions,
} from "@/lib/intelligence/answer/quality-review";
import { measureExecutiveAnswer } from "@/lib/intelligence/answer/model-authored-answer";
import { AgentMarkdown } from "@/lib/agent/markdownRenderer";
import { ModelAuthoredExhibits } from "@/components/agent-answer/ModelAuthoredExhibits";

export function IntelligenceQualityReview({
  viewModel,
  surfaceContext,
  disabled,
  onRunningChange,
}: {
  viewModel: EnterpriseLandscapeViewModel;
  surfaceContext: Record<string, unknown>;
  disabled: boolean;
  onRunningChange: (running: boolean) => void;
}) {
  const [questions, setQuestions] = useState(() =>
    executiveReviewQuestions(viewModel),
  );
  const [session, setSession] = useState<AvaChatSessionExport | null>(null);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [includeOriginalResponses, setIncludeOriginalResponses] =
    useState(false);
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  async function run() {
    if (
      abort.current ||
      running ||
      disabled ||
      questions.some((q) => !q.trim())
    )
      return;
    const controller = new AbortController();
    abort.current = controller;
    const runId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    const turns: AvaChatSessionExportTurn[] = [];
    const base = {
      title: `${viewModel.tenantName} — Intelligence quality review`,
      surface: "intelligence",
      tenantKey: viewModel.clientKey,
    };
    const snapshot = (finished = false) => ({
      ...base,
      turns: [...turns],
      qualityReview: {
        suiteId: EXECUTIVE_REVIEW_SUITE,
        startedAt,
        finishedAt: finished ? new Date().toISOString() : undefined,
        plannedQuestions: questions.length,
        completedQuestions: turns.filter(
          (t) => t.role === "agent" && t.reviewStatus === "complete",
        ).length,
      },
    });
    setRunning(true);
    onRunningChange(true);
    setError("");
    setSession(snapshot());
    try {
      for (const [i, query] of questions.entries()) {
        if (controller.signal.aborted) break;
        setCurrent(i + 1);
        turns.push({
          id: `q-${i + 1}`,
          role: "user",
          body: query,
          at: new Date().toISOString(),
        });
        let packet: AvaAnswerPacket | null = null;
        let responseError = "";
        try {
          const response = await fetch("/api/intelligence/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              query,
              client: viewModel.clientKey,
              richText: true,
              answerOnlyStreaming: true,
              modelAuthoredOutput: true,
              traceEnabled: true,
              surfaceContext,
              tabId: `review-${runId}-${i + 1}`,
            }),
          });
          if (!response.ok || !response.body)
            throw new Error(`Question request failed (${response.status}).`);
          const reader = response.body.getReader(),
            decoder = new TextDecoder();
          let buffer = "";
          const consume = (line: string) => {
            if (!line.trim()) return;
            const event = JSON.parse(line) as {
              type: string;
              answer?: AvaAnswerPacket;
              error?: string;
            };
            if (event.type === "agent-answer" && event.answer)
              packet = event.answer;
            if (event.type === "error")
              responseError = event.error ?? "Answer failed.";
          };
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) consume(line);
          }
          buffer += decoder.decode();
          if (buffer.trim()) consume(buffer);
          if (responseError) throw new Error(responseError);
          if (!packet)
            throw new Error("No completed Claude response was received.");
          const answer = packet as AvaAnswerPacket;
          turns.push({
            id: `a-${i + 1}`,
            role: "agent",
            body: answer.prose ?? answer.directAnswer,
            answer,
            at: new Date().toISOString(),
            reviewStatus: "complete",
          });
        } catch (err) {
          if (packet && !responseError) {
            const answer = packet as AvaAnswerPacket;
            turns.push({
              id: `a-${i + 1}`,
              role: "agent",
              body: answer.prose ?? answer.directAnswer,
              answer,
              at: new Date().toISOString(),
              reviewStatus: "complete",
            });
          } else {
            turns.push({
              id: `a-${i + 1}`,
              role: "agent",
              body: controller.signal.aborted
                ? "Question cancelled before a completed answer was received."
                : err instanceof Error
                  ? err.message
                  : "Answer failed.",
              at: new Date().toISOString(),
              reviewStatus: controller.signal.aborted ? "cancelled" : "failed",
            });
          }
        }
        setSession(snapshot());
      }
    } finally {
      setSession(snapshot(true));
      setRunning(false);
      onRunningChange(false);
      abort.current = null;
    }
  }

  async function exportPdf() {
    if (!session || running || exporting) return;
    setExporting(true);
    setError("");
    try {
      const response = await fetch("/api/intelligence/ask/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: {
            ...session,
            qualityReview: session.qualityReview
              ? { ...session.qualityReview, includeOriginalResponses }
              : undefined,
          },
          format: "pdf",
        }),
      });
      if (!response.ok)
        throw new Error(`PDF export failed (${response.status}).`);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `intelligence-quality-review-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF export failed.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <details className="mx-4 mb-3 rounded-lg border border-stone-200 bg-white p-4">
      <summary className="cursor-pointer font-semibold">
        10-question quality review
      </summary>
      <p className="my-3 text-sm text-stone-600">
        Run ten executive questions against this company’s evidence, then export
        the answers, exhibits, sources and length checks to one PDF. You can
        edit the questions before running. Each question uses a fresh session.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded border px-3 py-2 text-sm disabled:opacity-50"
          disabled={
            disabled || running || exporting || questions.some((q) => !q.trim())
          }
          onClick={() => void run()}
        >
          Run 10 questions
        </button>
        {running && (
          <button
            className="rounded border px-3 py-2 text-sm"
            onClick={() => abort.current?.abort()}
          >
            Stop review
          </button>
        )}
        <button
          className="rounded border px-3 py-2 text-sm disabled:opacity-50"
          disabled={running || exporting || !session?.turns.length}
          onClick={() => void exportPdf()}
        >
          {exporting ? "Exporting…" : "Export review PDF"}
        </button>
        <span role="status" className="text-sm">
          {running
            ? `Running question ${current} of 10…`
            : session
              ? `${session.qualityReview?.completedQuestions} of 10 answers completed`
              : "Ready"}
        </span>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-stone-600">
        <input
          type="checkbox"
          checked={includeOriginalResponses}
          onChange={(event) =>
            setIncludeOriginalResponses(event.target.checked)
          }
          disabled={exporting}
        />
        Include original response appendix
      </label>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm">Review questions</summary>
        <ol className="mt-3 space-y-2">
          {questions.map((q, i) => (
            <li key={i}>
              <label className="text-sm">
                Question {i + 1}
                <textarea
                  aria-label={`Review question ${i + 1}`}
                  className="mt-1 w-full rounded border p-2"
                  value={q}
                  disabled={running}
                  onChange={(e) =>
                    setQuestions((c) =>
                      c.map((s, n) => (n === i ? e.target.value : s)),
                    )
                  }
                />
              </label>
            </li>
          ))}
        </ol>
      </details>
      {session?.turns
        .filter((t) => t.role === "agent")
        .map((turn, i) => {
          const stats = measureExecutiveAnswer(turn.body);
          return (
            <details key={turn.id} className="mt-3 border-t pt-3">
              <summary className="cursor-pointer text-sm">
                Question {i + 1} · {turn.reviewStatus} · {stats.openingWords}{" "}
                opening words · {stats.proseWords} prose words
              </summary>
              <p className="my-3 font-semibold">{session.turns[i * 2]?.body}</p>
              <AgentMarkdown text={turn.body} preserveOutput />
              {turn.answer && <ModelAuthoredExhibits answer={turn.answer} />}
            </details>
          );
        })}
    </details>
  );
}
