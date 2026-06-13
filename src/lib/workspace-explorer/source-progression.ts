// Maps the Source stage progression engine into the Workspace Explorer's
// generic progression shape, attaching a one-click target to each need.
//
// Pure: the page loads the substrate (criteria/evidence/artifacts) and calls
// this to build the "what's needed to advance" panel. Upload/Generate resolve
// to the explorer's own intent query; Approve/Advance point back to the event
// canvas where those controls live; Prepare/Send stay blocked (slices C/D).

import { computeStageProgression } from "@/lib/source/stage-progression";
import type { SourceStageKey } from "@/lib/source/types";
import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from "@/lib/source/canvas-substrate";
import type { WorkspaceProgression, WorkspaceProgressionNeed } from "./types";

export function buildSourceWorkspaceProgression(args: {
  stage: SourceStageKey;
  criteria: SourceEventGateCriterion[];
  evidence: SourceEventEvidence[];
  artifacts: SourceEventArtifactState[];
  /** Where Approve / Advance live (the event canvas). */
  eventHref: string;
  generatableCodes?: ReadonlyArray<string>;
}): WorkspaceProgression {
  const view = computeStageProgression({
    stage: args.stage,
    criteria: args.criteria,
    evidence: args.evidence,
    artifacts: args.artifacts,
    generatableCodes: args.generatableCodes,
  });
  const stageQuery = encodeURIComponent(args.stage);

  const needs: WorkspaceProgressionNeed[] = view.needs.map((need) => {
    let href: string | undefined;
    if (!need.blocked) {
      if (need.kind === "upload") {
        href = `?intent=upload&stage=${stageQuery}`;
      } else if (need.kind === "generate") {
        href = `?intent=generate&stage=${stageQuery}`;
      } else if (need.kind === "approve" || need.kind === "advance") {
        href = args.eventHref;
      }
    }
    return {
      id: need.id,
      kind: need.kind,
      label: need.label,
      detail: need.detail,
      href,
      blocked: need.blocked,
      blockedReason: need.blockedReason,
      optional: need.optional,
    };
  });

  return {
    gateSummary: view.gateSummary,
    allClear: view.allClear,
    needs,
  };
}
