"use client";

import { useMemo, useState } from "react";
import { AgentMarkdown } from "@/lib/agent/markdownRenderer";
import { compactReadingView } from "@/lib/intelligence/answer/compact-reading-view";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import {
  ModelAuthoredExhibits,
  ModelAuthoredSources,
} from "./ModelAuthoredExhibits";

export function ExecutiveReadingView({
  text,
  answer,
  budget,
  streaming,
}: {
  text: string;
  answer?: AvaAnswerPacket;
  budget: number;
  streaming?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const compact = useMemo(
    () => compactReadingView(text, answer?.artifacts ?? [], budget),
    [text, answer, budget],
  );
  const body = expanded ? text : compact.prose;
  const artifacts = expanded ? (answer?.artifacts ?? []) : compact.artifacts;
  return (
    <div data-testid="executive-reading-view">
      <div data-testid="executive-reading-content">
        <AgentMarkdown text={body} preserveOutput showListMarkers />
        {answer && artifacts.length > 0 && (
          <div className="mt-3">
            <ModelAuthoredExhibits
              answer={{ ...answer, artifacts }}
              showSources={false}
            />
          </div>
        )}
      </div>
      {compact.hasMore && !streaming && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 rounded-md border border-stone-300 px-3 py-2 text-sm font-medium hover:bg-stone-50"
        >
          {expanded ? "Show concise view" : "Read full analysis"}
        </button>
      )}
      {answer && (
        <div className="mt-3">
          <ModelAuthoredSources answer={answer} />
        </div>
      )}
    </div>
  );
}
