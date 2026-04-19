import type {
  EvidenceSourceDraft,
  MetricSnapshotDraft,
  ValueContractDraft,
} from './types'

export type ValueOfficeDemoSeed = {
  id: string
  label: string
  idea: string
  sponsorName: string
  sponsorRole: string
  title: string
  businessProblem: string
  recommendationSummary: string
  valueContracts: ValueContractDraft[]
  evidenceSources: EvidenceSourceDraft[]
  metricSnapshots: MetricSnapshotDraft[]
}

export const VALUE_OFFICE_DEMO_SEEDS: ValueOfficeDemoSeed[] = [
  {
    id: 'it-service-desk-productivity',
    label: 'Load IT Service Desk Example',
    idea:
      'AI for IT service desk automation and ticket triage.\n\nWe want to reduce repetitive ticket handling, automate triage, and recover analyst capacity while proving value through ServiceNow, productivity, and finance evidence.',
    sponsorName: 'Lena Marsh',
    sponsorRole: 'CIO',
    title: 'IT Service Desk Productivity Intelligence',
    businessProblem:
      'IT teams are spending too much time on repetitive requests, manual triage, and low-value incident coordination without a clean way to prove capacity recovery or run-cost reduction.',
    recommendationSummary:
      'Strong pilot candidate if ServiceNow exports, ticket baselines, and named evidence owners are locked before launch.',
    valueContracts: [
      {
        category: 'IT run reduction',
        where_value_lost: 'Level 1 and Level 2 analysts spend too much time on password resets, access requests, and routine triage.',
        target_state: 'AI handles routine intake and triage, with analysts focusing on higher-complexity work and escalations.',
        baseline_metric: 'Human-resolved L1/L2 ticket volume',
        baseline_value: '78%',
        target_metric: 'Human-resolved L1/L2 ticket volume',
        target_value: '52%',
        unit: '% of tickets',
        evidence_source: 'ServiceNow ticket export',
        evidence_owner: 'Service Desk Operations Manager',
        review_cadence: 'Monthly',
        confidence_grade: 'Silver',
        notes: 'Need 90-day pre-pilot baseline locked before launch.',
      },
      {
        category: 'Capacity recovered',
        where_value_lost: 'Analysts spend significant weekly hours on repetitive tasks that do not require specialist judgment.',
        target_state: 'Recovered analyst hours are redirected to backlog reduction and higher-value transform work.',
        baseline_metric: 'Hours spent on repetitive service desk work',
        baseline_value: '1,240',
        target_metric: 'Hours spent on repetitive service desk work',
        target_value: '780',
        unit: 'hours / month',
        evidence_source: 'Time study and ServiceNow workflow logs',
        evidence_owner: 'IT Operations PMO',
        review_cadence: 'Monthly',
        confidence_grade: 'Bronze',
        notes: 'Proxy hours acceptable for pilot, but finance alignment needed for scaling.',
      },
    ],
    evidenceSources: [
      {
        source_name: 'ServiceNow ticket and workflow export',
        source_type: 'workflow telemetry',
        integration_mode: 'extract_upload',
        status: 'identified',
        system_name: 'ServiceNow',
        owner_name: 'Service Desk Operations Manager',
        details: {
          collection_status: 'expected',
          freshness: 'weekly',
          notes: 'Export ticket volume, assignment group, resolution code, and cycle-time fields.',
        },
      },
      {
        source_name: 'IT labor and run-cost baseline',
        source_type: 'finance baseline',
        integration_mode: 'manual_input',
        status: 'identified',
        system_name: 'ERP / Finance',
        owner_name: 'IT Finance Lead',
        details: {
          collection_status: 'expected',
          freshness: 'monthly',
          notes: 'Map labor assumptions and contractor mix to service desk cost pools.',
        },
      },
    ],
    metricSnapshots: [
      {
        category: 'IT run reduction',
        snapshot_type: 'baseline',
        metric_name: 'Human-resolved L1/L2 ticket volume',
        metric_value: '78',
        unit: '% of tickets',
        confidence_grade: 'Silver',
        notes: 'Pre-pilot 90-day average',
        captured_at: '2026-04-01T00:00:00.000Z',
      },
      {
        category: 'IT run reduction',
        snapshot_type: 'target',
        metric_name: 'Human-resolved L1/L2 ticket volume',
        metric_value: '52',
        unit: '% of tickets',
        confidence_grade: 'Silver',
        notes: 'Pilot target',
        captured_at: '2026-04-01T00:00:00.000Z',
      },
    ],
  },
  {
    id: 'developer-productivity-sdlc',
    label: 'Load Developer Productivity Example',
    idea:
      'Developer productivity using AI coding assistants.\n\nWe want to improve engineering throughput, shorten PR cycle time, and connect coding-assistant usage to measurable SDLC and release outcomes.',
    sponsorName: 'Ravi Anand',
    sponsorRole: 'CTO',
    title: 'Developer Productivity And SDLC Value Intelligence',
    businessProblem:
      'Engineering leadership is funding copilots and automation, but current reporting shows seats and activity, not measurable throughput, review efficiency, or release acceleration.',
    recommendationSummary:
      'Pilot first, but only if engineering telemetry, release metrics, and finance assumptions are tied together from day one.',
    valueContracts: [
      {
        category: 'Engineering throughput',
        where_value_lost: 'Developers lose time waiting on code reviews, context switches, and repetitive implementation work.',
        target_state: 'AI-supported engineering workflows reduce review delays and improve delivery throughput without sacrificing quality.',
        baseline_metric: 'Median PR cycle time',
        baseline_value: '4.8',
        target_metric: 'Median PR cycle time',
        target_value: '3.2',
        unit: 'days',
        evidence_source: 'GitHub and CI telemetry export',
        evidence_owner: 'Engineering Operations Lead',
        review_cadence: 'Bi-weekly',
        confidence_grade: 'Silver',
        notes: 'Need clean baseline by repo tier, not blended across all teams.',
      },
      {
        category: 'Release velocity',
        where_value_lost: 'Release coordination and regression triage delay delivery even when code is ready.',
        target_state: 'AI-assisted testing and release orchestration increase release frequency with lower manual coordination overhead.',
        baseline_metric: 'Production releases per month',
        baseline_value: '11',
        target_metric: 'Production releases per month',
        target_value: '16',
        unit: 'releases / month',
        evidence_source: 'Release pipeline and incident records',
        evidence_owner: 'Platform Engineering Manager',
        review_cadence: 'Monthly',
        confidence_grade: 'Bronze',
        notes: 'Quality guardrails required alongside release-speed targets.',
      },
    ],
    evidenceSources: [
      {
        source_name: 'GitHub pull request telemetry',
        source_type: 'developer workflow telemetry',
        integration_mode: 'scheduled_feed',
        status: 'identified',
        system_name: 'GitHub',
        owner_name: 'Engineering Operations Lead',
        details: {
          collection_status: 'expected',
          freshness: 'weekly',
          notes: 'Need PR open-to-merge time, review rounds, and merge frequency.',
        },
      },
      {
        source_name: 'CI/CD and release pipeline export',
        source_type: 'release telemetry',
        integration_mode: 'extract_upload',
        status: 'identified',
        system_name: 'CI/CD platform',
        owner_name: 'Platform Engineering Manager',
        details: {
          collection_status: 'expected',
          freshness: 'weekly',
          notes: 'Export deployment frequency, failed runs, and rollback events.',
        },
      },
    ],
    metricSnapshots: [
      {
        category: 'Engineering throughput',
        snapshot_type: 'baseline',
        metric_name: 'Median PR cycle time',
        metric_value: '4.8',
        unit: 'days',
        confidence_grade: 'Silver',
        notes: 'Trailing 90-day average across core repos.',
        captured_at: '2026-04-01T00:00:00.000Z',
      },
      {
        category: 'Engineering throughput',
        snapshot_type: 'target',
        metric_name: 'Median PR cycle time',
        metric_value: '3.2',
        unit: 'days',
        confidence_grade: 'Silver',
        notes: 'Pilot target for selected engineering squads.',
        captured_at: '2026-04-01T00:00:00.000Z',
      },
    ],
  },
]
