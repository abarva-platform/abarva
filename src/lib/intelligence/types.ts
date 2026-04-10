export type Severity = 'critical' | 'high' | 'medium'

export interface DataPoint {
  source: string
  label: string
  value: string
}

export interface RawContradiction {
  id: string
  title: string
  severity: Severity
  dataPointA: DataPoint
  dataPointB: DataPoint
  gap: string
  financialImpact: string
  confidence: number
}

export interface Contradiction extends RawContradiction {
  finding: string
  recommendation: string
}

export interface FailurePattern {
  code: string
  name: string
  description: string
  historicalFailureRate: number
}

export interface InitiativeRisk {
  initiativeId: string
  initiativeName: string
  annualValue: number
  successProbability: number
  activePatterns: FailurePattern[]
  criticalBlocker: string
  isBlocked: boolean
}

export interface FailureAnalysis {
  risks: InitiativeRisk[]
  narrative: string | null
}
