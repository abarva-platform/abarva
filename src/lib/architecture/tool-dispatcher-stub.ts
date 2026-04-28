// tool-dispatcher-stub.ts — TOOL3
//
// Deterministic dispatch stub for validated ToolInvocationRequests.
// Takes a tool request that has passed TOOL2 validation and simulates
// what a live dispatch would produce — without executing any real tool.
//
// Intent: TOOL2 describes tools and validates requests; TOOL3 "dispatches"
// them in stub form. Together they form a complete stub pipeline:
// validate (TOOL2) → dispatch (TOOL3) → audit trail.
//
// The dispatcher re-validates every request before dispatch (defence
// in depth). Well-formed requests return `decision: 'dispatched_stub'`
// with a deterministic category-aware stub output and a full audit
// record. Malformed or unregistered requests return `decision: 'block'`
// with a typed reason.
//
// Deterministic: no runtime clocks, no random(), no model calls.
// Pattern: mirrors model-gateway-stub.ts / model-gateway-live-provider-stub.ts.
//
// This module explicitly DOES NOT:
//   - import openai, anthropic, or @anthropic-ai/sdk.
//   - call fetch, Date.now, Math.random, or new Date.
//   - read from src/lib/source/, src/lib/auth/, supabase, etc.
//   - execute any real tool. The live dispatcher is a future slice.

import {
  validateToolInvocationRequest,
  getAgentTool,
  type ToolInvocationRequest,
  type ToolCategory,
  type ToolReadWriteMode,
  type ToolProductionStatus,
} from './tool-registry-mvp';

// ─── Decision types ───────────────────────────────────────────────────────────

export type ToolDispatchDecision = 'dispatched_stub' | 'block';

export type ToolDispatchBlockedReason =
  | 'validation_failed'
  | 'tool_not_found'
  | 'tenant_scope_invalid'
  | 'governance_constraint_violation'
  | 'agent_not_authorised';

// ─── Request / Response types ─────────────────────────────────────────────────

/**
 * Thin wrapper around ToolInvocationRequest to make the dispatch layer
 * explicit in the call graph. Produced by buildToolDispatchRequest.
 */
export interface ToolDispatchRequest {
  invocationRequest: ToolInvocationRequest;
}

export interface ToolDispatchAuditRecord {
  /** Deterministic seed id: "tool3-dispatch-{tenantKey}-{toolId}-{hash}" */
  dispatchId: string;
  toolId: string;
  category: ToolCategory;
  agentKey: string;
  tenantKey: string;
  decision: ToolDispatchDecision;
  reason?: ToolDispatchBlockedReason;
  validationReasons: readonly string[];
  validationWarnings: readonly string[];
  productionStatus: ToolProductionStatus;
  /** Always false for this stub; set to true once the live dispatcher ships. */
  isLive: false;
  trace: {
    dispatcherVersion: string;
    inputHashSeed: string;
  };
}

export interface ToolDispatchStubResponse {
  decision: ToolDispatchDecision;
  reason?: ToolDispatchBlockedReason;
  toolId?: string;
  category?: ToolCategory;
  /** Deterministic fake output string — never a real tool result. */
  stubOutput?: string;
  audit: ToolDispatchAuditRecord;
  /** Always present. Explicitly documents the stub-only nature. */
  honestNote: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DISPATCHER_VERSION = 'tool3.dispatcher-stub.v1';

const HONEST_NOTE =
  'Live tool execution not implemented; this stub returns dispatched_stub ' +
  'decisions with deterministic category-aware outputs. No real tool was ' +
  'invoked. TOOL3 is the dispatcher-stub layer of the agent tool pipeline.';

// Deterministic stub output template per category.
// Intentionally labelled [TOOL3 stub] so surfaces cannot mistake these
// for real tool outputs.
const CATEGORY_STUB_OUTPUTS: Record<ToolCategory, string> = {
  search_vector:
    '[TOOL3 stub] Vector search returned 3 ranked semantic chunks for the tenant query.',
  traverse_graph:
    '[TOOL3 stub] Graph traversal returned 5 typed neighbor node ids from the start node.',
  read_artifact:
    '[TOOL3 stub] Artifact read complete: metadata + 2 body chunks with citation locators.',
  read_evidence:
    '[TOOL3 stub] Evidence ledger entry read complete: usable status, citation locator returned.',
  read_program_state:
    '[TOOL3 stub] Program state read: phases 0–3 complete, gate P3→P4 pending, owner assigned.',
  write_program_action:
    '[TOOL3 stub] Program action appended: structured note recorded with audit event correlation.',
  create_deliverable_draft:
    '[TOOL3 stub] Deliverable draft created: sections + cited evidence ids returned.',
  export_artifact:
    '[TOOL3 stub] Export acknowledged: bundle reference issued, bytes not returned inline.',
  update_gate_status:
    '[TOOL3 stub] Gate status updated: prior state → new state, steward identity recorded.',
  record_audit_event:
    '[TOOL3 stub] Audit event acknowledged: idempotency key recorded (no live persistence yet).',
  fetch_dataset_summary:
    '[TOOL3 stub] Dataset domain summary: steward, sensitivity tier, refresh cadence returned.',
  get_solution_archetype:
    '[TOOL3 stub] Solution archetype retrieved: eligibility criteria + deliverable hooks returned.',
  get_pattern_content:
    '[TOOL3 stub] Intelligence pattern retrieved: signals, anti-signals, remediation hooks returned.',
  build_context_pack:
    '[TOOL3 stub] Unified Context Pack built: 12-section pack with honest-empty deferred sections.',
  evaluate_readiness:
    '[TOOL3 stub] Readiness evaluation: gate key + status + blockers array returned.',
  create_agent_mission:
    '[TOOL3 stub] Agent mission created: goal, scope, stop conditions, audit event id returned.',
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Deterministic 32-bit string hash → lowercase hex (12 chars).
 */
function deterministicHashHex(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  }
  const unsigned = (h >>> 0).toString(16).padStart(8, '0');
  const lenComponent = (input.length & 0xffff).toString(16).padStart(4, '0');
  return (unsigned + lenComponent).slice(0, 12);
}

function buildDispatchId(
  tenantKey: string,
  toolId: string,
  agentKey: string,
): string {
  const hash = deterministicHashHex(tenantKey + '|' + toolId + '|' + agentKey);
  const safeTenant = tenantKey.length > 0 ? tenantKey : 'unscoped';
  const safeToolId = toolId.length > 0 ? toolId.replace(/\./g, '-') : 'unknown';
  return 'tool3-dispatch-' + safeTenant + '-' + safeToolId + '-' + hash;
}

function buildInputHashSeed(request: ToolInvocationRequest): string {
  const inputKeys = Object.keys(request.inputs ?? {}).sort().join(',');
  return deterministicHashHex(
    request.toolId + '|' + request.agentKey + '|' + request.tenantKey + '|' + inputKeys,
  );
}

function buildBlockAudit(args: {
  request: ToolInvocationRequest;
  toolId: string;
  category: ToolCategory;
  productionStatus: ToolProductionStatus;
  decision: ToolDispatchDecision;
  reason: ToolDispatchBlockedReason;
  validationReasons: readonly string[];
  validationWarnings: readonly string[];
}): ToolDispatchAuditRecord {
  return {
    dispatchId: buildDispatchId(args.request.tenantKey, args.toolId, args.request.agentKey),
    toolId: args.toolId,
    category: args.category,
    agentKey: args.request.agentKey,
    tenantKey: args.request.tenantKey,
    decision: args.decision,
    reason: args.reason,
    validationReasons: args.validationReasons,
    validationWarnings: args.validationWarnings,
    productionStatus: args.productionStatus,
    isLive: false,
    trace: {
      dispatcherVersion: DISPATCHER_VERSION,
      inputHashSeed: buildInputHashSeed(args.request),
    },
  };
}

function buildSuccessAudit(args: {
  request: ToolInvocationRequest;
  toolId: string;
  category: ToolCategory;
  productionStatus: ToolProductionStatus;
  validationWarnings: readonly string[];
}): ToolDispatchAuditRecord {
  return {
    dispatchId: buildDispatchId(args.request.tenantKey, args.toolId, args.request.agentKey),
    toolId: args.toolId,
    category: args.category,
    agentKey: args.request.agentKey,
    tenantKey: args.request.tenantKey,
    decision: 'dispatched_stub',
    validationReasons: [],
    validationWarnings: args.validationWarnings,
    productionStatus: args.productionStatus,
    isLive: false,
    trace: {
      dispatcherVersion: DISPATCHER_VERSION,
      inputHashSeed: buildInputHashSeed(args.request),
    },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Factory to wrap a ToolInvocationRequest in a dispatch request.
 * Explicit typing in the call graph so surfaces cannot accidentally
 * skip the validation → dispatch pipeline.
 */
export function buildToolDispatchRequest(
  invocationRequest: ToolInvocationRequest,
): ToolDispatchRequest {
  return { invocationRequest };
}

/**
 * Generate the deterministic stub output for a given tool category.
 * Exported so test surfaces can assert on the stub output without
 * going through the full dispatch pipeline.
 */
export function getStubOutputForCategory(category: ToolCategory): string {
  return CATEGORY_STUB_OUTPUTS[category];
}

/**
 * Derive a human-readable label for a dispatch result, including the
 * production status note when the tool is a stub itself.
 */
export function describeToolProductionStatus(
  status: ToolProductionStatus,
): string {
  switch (status) {
    case 'live':
      return 'live';
    case 'beta':
      return 'beta (not fully hardened)';
    case 'mvp':
      return 'mvp (functional, not load-tested)';
    case 'stub':
      return 'stub (output is deterministic placeholder only)';
    default:
      return 'unknown';
  }
}

/**
 * Dispatch a ToolInvocationRequest in stub form.
 *
 * Re-validates the request (defence in depth), then:
 * - If validation fails → decision: 'block', reason: 'validation_failed'
 * - If tool not found → decision: 'block', reason: 'tool_not_found'
 * - If tenantKey is empty → decision: 'block', reason: 'tenant_scope_invalid'
 * - If agent not authorised → decision: 'block', reason: 'agent_not_authorised'
 * - Otherwise → decision: 'dispatched_stub' with category-aware stub output
 *
 * All responses include a full ToolDispatchAuditRecord and honestNote.
 */
export function dispatchToolStub(
  dispatchRequest: ToolDispatchRequest,
): ToolDispatchStubResponse {
  const request = dispatchRequest.invocationRequest;

  // Defence in depth: re-validate (TOOL2 caller should have done this,
  // but the dispatcher never trusts the caller).
  const validation = validateToolInvocationRequest(request);

  // Look up tool metadata (needed for block audit records too).
  const tool = getAgentTool(request.toolId);
  const toolId = request.toolId ?? '';
  const category: ToolCategory = tool?.category ?? 'record_audit_event';
  const productionStatus: ToolProductionStatus = tool?.productionStatus ?? 'stub';

  // Guard: tool not found.
  if (!tool) {
    return {
      decision: 'block',
      reason: 'tool_not_found',
      audit: buildBlockAudit({
        request,
        toolId,
        category,
        productionStatus,
        decision: 'block',
        reason: 'tool_not_found',
        validationReasons: validation.reasons,
        validationWarnings: validation.warnings,
      }),
      honestNote: HONEST_NOTE,
    };
  }

  // Guard: empty tenantKey (tenant scope check first — same order as MG2).
  if (!request.tenantKey || request.tenantKey.trim().length === 0) {
    return {
      decision: 'block',
      reason: 'tenant_scope_invalid',
      audit: buildBlockAudit({
        request,
        toolId,
        category: tool.category,
        productionStatus: tool.productionStatus,
        decision: 'block',
        reason: 'tenant_scope_invalid',
        validationReasons: validation.reasons,
        validationWarnings: validation.warnings,
      }),
      honestNote: HONEST_NOTE,
    };
  }

  // Guard: agent not authorised to invoke this tool.
  if (!tool.allowedAgents.includes(request.agentKey)) {
    return {
      decision: 'block',
      reason: 'agent_not_authorised',
      audit: buildBlockAudit({
        request,
        toolId,
        category: tool.category,
        productionStatus: tool.productionStatus,
        decision: 'block',
        reason: 'agent_not_authorised',
        validationReasons: validation.reasons,
        validationWarnings: validation.warnings,
      }),
      honestNote: HONEST_NOTE,
    };
  }

  // Guard: validation failure (missing required inputs, etc.).
  if (!validation.isValid) {
    return {
      decision: 'block',
      reason: 'validation_failed',
      audit: buildBlockAudit({
        request,
        toolId,
        category: tool.category,
        productionStatus: tool.productionStatus,
        decision: 'block',
        reason: 'validation_failed',
        validationReasons: validation.reasons,
        validationWarnings: validation.warnings,
      }),
      honestNote: HONEST_NOTE,
    };
  }

  // Well-formed dispatch.
  const stubOutput = CATEGORY_STUB_OUTPUTS[tool.category];
  return {
    decision: 'dispatched_stub',
    toolId: tool.id,
    category: tool.category,
    stubOutput,
    audit: buildSuccessAudit({
      request,
      toolId: tool.id,
      category: tool.category,
      productionStatus: tool.productionStatus,
      validationWarnings: validation.warnings,
    }),
    honestNote: HONEST_NOTE,
  };
}

/**
 * Renders a deterministic single-line summary of a dispatch response.
 * e.g. "tool3:apexretail:nexus → dispatched_stub tool.search_vector.v1 [dispatch tool3-dispatch-...]"
 */
export function summarizeToolDispatchResponse(
  response: ToolDispatchStubResponse,
): string {
  const reasonSegment =
    response.reason !== undefined ? ' (' + response.reason + ')' : '';
  const toolSegment =
    response.toolId !== undefined ? ' ' + response.toolId : '';
  return (
    'tool3:' +
    response.audit.tenantKey +
    ':' +
    response.audit.agentKey +
    ' -> ' +
    response.decision +
    reasonSegment +
    toolSegment +
    ' [dispatch ' +
    response.audit.dispatchId +
    ']'
  );
}
