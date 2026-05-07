// Entity schemas from 1_crawl.md. We extract per-entity when present;
// missing entities are logged in `entities_not_found[]` rather than
// silently skipped. The crawler is deliberately tolerant — if a field
// isn't surfaced by the platform, we leave it `null` rather than fail.

export type EntityType =
  | 'events'
  | 'suppliers'
  | 'categories'
  | 'templates'
  | 'question_library'
  | 'clause_library'
  | 'knowledge_artifacts'
  | 'contracts'
  | 'license_baseline'
  | 'poc_pilots'
  | 'arb_decisions'
  | 'analytics_widgets'
  | 'agent_touchpoint'
  | 'unclassified';

export interface SnapshotRow {
  url: string;
  captured_at: string;
  entity_type: EntityType;
  entity_payload: Record<string, unknown>;
  outbound_intra_links: string[];
}

export interface UrlInventoryRow {
  url: string;
  status: number | null;
  entity_type: EntityType;
  depth: number;
  parent: string | null;
  captured_at: string;
  bytes: number | null;
  notes: string;
}

export interface CrawlSummary {
  started_at: string;
  finished_at: string;
  stop_reason:
    | 'completed'
    | 'max_pages'
    | 'max_hours'
    | 'rate_limit'
    | 'auth_expired'
    | 'cross_tenant'
    | 'write_confirmation'
    | 'manual_stop'
    | 'error';
  total_pages: number;
  counts_per_entity_type: Record<EntityType, number>;
  depth_histogram: Record<string, number>;
  skipped_mutating_paths: Array<{ url: string; reason: string }>;
  errors: Array<{ url: string; message: string; at: string }>;
  rate_limit_hits: number;
  entities_not_found: EntityType[];
  dry_pass: boolean;
}

export interface AgentTouchpoint {
  id: string;
  url: string;
  control_label: string;
  agent_invocation_method: 'button' | 'inline' | 'chat' | 'unknown';
  prompt_visible_to_user: boolean;
  produces_artifact: boolean;
  screenshot_path: string | null;
}

export interface CanaryCandidate {
  kind:
    | 'rare_clause'
    | 'specific_poc_outcome'
    | 'unique_benchmark'
    | 'one_off_ea_exception'
    | 'unique_certification'
    | 'unclassified';
  source_url: string;
  redacted_excerpt: string;
  reason: string;
}
