import {
  getSourceJourneyForEvent,
  sourceJourneyStageHref,
} from "./sourcing-motion-journeys";

export type SourceLifecycleRoutingState =
  | "active"
  | "waiting_on_client"
  | "waiting_on_co_approver"
  | "draft_revision"
  | "waiting_on_vendor"
  | "waiting_on_procurement"
  | "waiting_on_executive"
  | "paused"
  | "at_risk"
  | "completed"
  | "closed"
  | "closed_rejected"
  | "archived"
  | (string & {});

export interface SourceEventRouteMatch {
  eventId: string;
  section:
    | "canvas"
    | "approval"
    | "file_cabinet"
    | "value"
    | "summary"
    | "other";
}

export interface SourceLifecycleRouteInput {
  eventId: string;
  lifecycleState: SourceLifecycleRoutingState | null | undefined;
  currentStageKey?: string | null;
  sourcingMotion?: string | null;
  eventType?: string | null;
  eventName?: string | null;
  eventCode?: string | null;
  triggerDescription?: string | null;
  pathname: string;
  search?: string;
}

export type SourceLifecycleRouteAction =
  | { type: "allow" }
  | { type: "redirect"; destination: string; status?: 302 | 307 };

export interface LoadSourceLifecycleRouteInput {
  eventId: string;
  clientKey: string | null | undefined;
  pathname: string;
  search?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseSourceEventRoute(
  pathname: string,
): SourceEventRouteMatch | null {
  const match = pathname.match(/^\/source\/events\/([^/]+)(?:\/([^/?#]+))?/);
  if (!match?.[1]) return null;

  const rawSection = match[2] ?? "";
  const section =
    rawSection === "approval"
      ? "approval"
      : rawSection === "file-cabinet"
        ? "file_cabinet"
        : rawSection === "value"
          ? "value"
          : rawSection === "summary"
            ? "summary"
            : rawSection
              ? "other"
              : "canvas";

  return {
    eventId: decodeURIComponent(match[1]),
    section,
  };
}

export function resolveSourceLifecycleRoute(
  input: SourceLifecycleRouteInput,
): SourceLifecycleRouteAction {
  const match = parseSourceEventRoute(input.pathname);
  if (!match || match.eventId !== input.eventId) return { type: "allow" };

  const state = input.lifecycleState?.trim();
  if (!state) return { type: "allow" };

  const approvalPath = `/source/events/${encodeURIComponent(input.eventId)}/approval`;
  const summaryPath = `/source/events/${encodeURIComponent(input.eventId)}/summary`;

  if (
    state === "waiting_on_client" ||
    state === "waiting_on_co_approver" ||
    state === "draft_revision"
  ) {
    if (match.section === "approval" || match.section === "file_cabinet") {
      return { type: "allow" };
    }
    return { type: "redirect", destination: approvalPath, status: 302 };
  }

  if (state === "active") {
    if (match.section !== "approval") return { type: "allow" };
    const stage = input.currentStageKey?.trim() || "strategy";
    const journey = getSourceJourneyForEvent({
      sourcingMotion: input.sourcingMotion,
      eventType: input.eventType,
      eventName: input.eventName,
      eventCode: input.eventCode,
      triggerDescription: input.triggerDescription,
    });
    return {
      type: "redirect",
      destination: sourceJourneyStageHref({
        eventId: input.eventId,
        journey,
        stageKey: stage,
        fallbackStageKey: stage,
      }),
      status: 302,
    };
  }

  if (
    state === "closed" ||
    state === "closed_rejected" ||
    state === "completed"
  ) {
    if (match.section === "summary") return { type: "allow" };
    return { type: "redirect", destination: summaryPath, status: 302 };
  }

  if (state === "archived") {
    return { type: "redirect", destination: "/source/portfolio", status: 302 };
  }

  return { type: "allow" };
}

export async function loadSourceLifecycleRouteAction(
  input: LoadSourceLifecycleRouteInput,
): Promise<SourceLifecycleRouteAction> {
  const clientKey = input.clientKey?.trim();
  if (!clientKey) return { type: "allow" };

  try {
    const { selectSourceEventsReadAdapter } =
      await import("@/lib/data-plane/read-adapters/sourceEventsReadAdapter");
    const adapter = selectSourceEventsReadAdapter(undefined, clientKey);
    const event = UUID_RE.test(input.eventId)
      ? await adapter.getEventByIdForClient(input.eventId, clientKey)
      : await adapter.getEventByCodeForClient(input.eventId, clientKey);

    if (!event) return { type: "allow" };

    return resolveSourceLifecycleRoute({
      eventId: input.eventId,
      lifecycleState: event.lifecycle_state,
      currentStageKey: event.current_stage_key,
      sourcingMotion: event.sourcing_motion,
      eventType: event.event_type,
      eventName: event.event_name,
      eventCode: event.event_code,
      triggerDescription: event.trigger_description,
      pathname: input.pathname,
      search: input.search,
    });
  } catch (error) {
    console.warn(
      "[source-lifecycle-routing-guard] lookup failed; allowing route",
      {
        eventId: input.eventId,
        clientKey,
        message: error instanceof Error ? error.message : String(error),
      },
    );
    return { type: "allow" };
  }
}
