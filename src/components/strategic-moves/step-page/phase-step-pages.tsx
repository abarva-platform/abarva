import type { ReactNode } from "react";
import type { StrategicMove } from "@/lib/programs/types.ui";
import type { StepPageView } from "@/lib/programs/step-page-views";
import type {
  StepPagePhase,
  StepPageStep,
} from "@/components/strategic-moves/step-page/MovesStepPage";
import type { GateReadinessStepProps } from "@/components/strategic-moves/step-page/GateReadinessStep";
import type {
  CharterBasisValue,
  CharterBasisApprovedSource,
} from "@/components/strategic-moves/CharterBasisField";
import { P0_STEP_PAGES } from "./p0-step-pages";
import { P1_STEP_PAGES } from "./p1-step-pages";
import { P4_STEP_PAGES } from "./p4-step-pages";
import { P5_STEP_PAGES } from "./p5-step-pages";

export interface StepPageChrome {
  stepIndex: number;
  phaseHref: (phase: number) => string;
  tabs: ReactNode;
  phases: readonly StepPagePhase[];
  steps: readonly StepPageStep[];
}

export interface StepPageDockOptions {
  briefing: string;
  actions: Array<{ id: string; label: string; onClick: () => void }>;
  notesPanel: ReactNode;
}

export interface StepPageHostProps {
  move: StrategicMove;
  phase: number;
  values: Readonly<Record<string, string>>;
  setValue: (key: string, value: string) => void;
  priorPhaseCapture: Readonly<Record<string, string>> | null;
  canApproveGates: boolean;
  currentUser: { email: string | null; role: string | null } | null;
  chrome: StepPageChrome;
  stepDone: Readonly<Record<string, boolean>>;
  captureSaved?: Readonly<Record<string, boolean>>;
  sectionReady?: Readonly<Record<string, boolean>>;
  p0SourceEvidenceReady?: boolean;
  dock: (page: ReactNode, options: StepPageDockOptions) => ReactNode;
  /** The shared governed build, sign-off and submit path for this phase. */
  gateProps: GateReadinessStepProps;
  charterBasis?: {
    active: boolean;
    values: Readonly<Record<string, CharterBasisValue>>;
    approvedSources: Readonly<
      Record<string, readonly CharterBasisApprovedSource[]>
    >;
    errors: Readonly<Record<string, string>>;
    setValue: (sectionKey: string, value: CharterBasisValue | null) => void;
  };
}

export type PhaseStepPage = (props: StepPageHostProps) => ReactNode;
export type PhaseStepPageMap = Partial<Record<StepPageView, PhaseStepPage>>;

// Phase-owned slots let the later page builds land without changing the host.
export const PHASE_STEP_PAGES: PhaseStepPageMap = {
  ...P0_STEP_PAGES,
  ...P1_STEP_PAGES,
  ...P4_STEP_PAGES,
  ...P5_STEP_PAGES,
};

export function renderPhaseStepPage(
  view: StepPageView,
  props: StepPageHostProps,
): ReactNode | null {
  return PHASE_STEP_PAGES[view]?.(props) ?? null;
}
