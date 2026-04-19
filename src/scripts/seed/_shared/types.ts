export type Stage = 'idea' | 'qualify' | 'design' | 'evidence' | 'review' | 'execute' | 'realize' | 'stalled';

export interface UseCaseSeed {
  name: string;
  description: string;
  business_unit: string;
  domain: string;
  stage: Stage;
  systems: string[];
  ai_type: 'GenAI' | 'ML' | 'Agent' | 'CV' | 'Predictive';
  scope: 'enterprise' | 'department' | 'single_workflow';
  vendor: string;
  usage?: {
    dau?: number;
    wau?: number;
    penetration_pct?: number;
    drop_off_rate_pct?: number;
    interactions_total?: number;
  };
  value?: {
    metric: string;
    baseline: number;
    target: number;
    observed: number;
    unit: string;
    confidence: 'high' | 'medium' | 'proxy' | 'estimate';
    driver: string;
  };
  risk?: {
    data: string[];
    risk_level: 'high' | 'medium' | 'low';
    governance: 'approved' | 'conditional' | 'pending';
    hitl: boolean;
    vendor_posture: string;
    bias_incidents?: number;
  };
  cost?: {
    llm: number;
    compute: number;
    storage: number;
    license: number;
    integration: number;
    projected_6mo: number;
  };
  shadow?: boolean;
}

export interface ClientSeed {
  name: string;
  useCases: UseCaseSeed[];
}
