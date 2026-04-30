'use client'
import { useState } from 'react'

const S = {
  page: { minHeight: '100vh', background: '#F8F7F4', fontFamily: "'DM Sans', -apple-system, sans-serif" } as React.CSSProperties,
  card: { background: '#FFFFFF', border: '1px solid #E8E6E3', borderRadius: '8px', padding: '24px' } as React.CSSProperties,
  label: { fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' } as React.CSSProperties,
}

const LINKS = [
  { href: '/platform/admin', label: 'Engagement Hub' },
  { href: '/platform/admin/data', label: 'Data Loader', active: true },
  { href: '/platform/admin/data-guide', label: 'Data Guide' },
  { href: '/platform/admin/quality', label: 'Quality Ops' },
  { href: '/platform/admin/approvals', label: 'Approvals' },
  { href: '/platform/admin/outcomes', label: 'Outcome Tracker' },
  { href: '/platform/admin/brief', label: 'Pre-Meeting Brief' },
  { href: '/platform/admin/context', label: 'Business Context' },
]

type FileStatus = 'approved' | 'missing' | 'processing'
type FileSegment = 'Business' | 'IT & Technology' | 'Third Party'
type FileType = 'xlsx' | 'pdf' | 'csv' | 'pptx' | 'docx'

interface DataFile {
  name: string; owner: string; date: string
  type: FileType; segment: FileSegment; category: string
  status: FileStatus; confidence: number
}

const FILE_TYPE_COLOR: Record<FileType, string> = {
  xlsx: '#16A34A', pdf: '#DC2626', csv: '#2563EB', pptx: '#D97706', docx: '#7C3AED'
}

const CLIENT_FILES: Record<string, { label: string; confidence: number; files: DataFile[] }> = {
  meridian: {
    label: 'Meridian Health System',
    confidence: 94,
    files: [
      // Business — Financial
      { name: 'Annual_Financial_Statements_FY2025.xlsx', owner: 'CFO Office', date: 'Feb 28', type: 'xlsx', segment: 'Business', category: 'Financial', status: 'approved', confidence: 96 },
      { name: 'Annual_Financial_Statements_FY2024.xlsx', owner: 'CFO Office', date: 'Feb 10', type: 'xlsx', segment: 'Business', category: 'Financial', status: 'approved', confidence: 95 },
      { name: 'Annual_Financial_Statements_FY2023.xlsx', owner: 'CFO Office', date: 'Jan 15', type: 'xlsx', segment: 'Business', category: 'Financial', status: 'approved', confidence: 94 },
      { name: 'Meridian_IT_Financial_Model_FY2025.xlsx', owner: 'IT Finance', date: 'Apr 8', type: 'xlsx', segment: 'Business', category: 'Financial', status: 'approved', confidence: 92 },
      { name: 'Capital_Expenditure_Plan_FY2026.xlsx', owner: 'CFO Office', date: 'Mar 15', type: 'xlsx', segment: 'Business', category: 'Financial', status: 'approved', confidence: 89 },
      { name: 'RCM_Revenue_Cycle_Performance_Q4_FY2025.xlsx', owner: 'Revenue Cycle', date: 'Feb 20', type: 'xlsx', segment: 'Business', category: 'Financial', status: 'approved', confidence: 94 },
      { name: 'RCM_Revenue_Cycle_Performance_Q3_FY2025.xlsx', owner: 'Revenue Cycle', date: 'Nov 15', type: 'xlsx', segment: 'Business', category: 'Financial', status: 'approved', confidence: 93 },
      { name: 'Denial_Rate_Analysis_by_Payer_FY2025.xlsx', owner: 'Revenue Cycle', date: 'Mar 1', type: 'xlsx', segment: 'Business', category: 'Financial', status: 'approved', confidence: 95 },
      // Business — Vendors
      { name: 'Ensemble_Contract_and_SLA_Register.pdf', owner: 'Procurement', date: 'Mar 28', type: 'pdf', segment: 'Business', category: 'Vendors', status: 'approved', confidence: 91 },
      { name: 'RCM_Vendor_RFP_Responses_6_Vendors.pdf', owner: 'Procurement', date: 'Apr 5', type: 'pdf', segment: 'Business', category: 'Vendors', status: 'approved', confidence: 90 },
      { name: 'Meridian_Vendor_Performance_Scorecard_FY2025.xlsx', owner: 'Procurement', date: 'Mar 20', type: 'xlsx', segment: 'Business', category: 'Vendors', status: 'approved', confidence: 88 },
      { name: 'Payer_Contract_Analysis_Medicare.xlsx', owner: 'Contracts', date: 'Apr 2', type: 'xlsx', segment: 'Business', category: 'Vendors', status: 'approved', confidence: 87 },
      { name: 'Payer_Contract_Analysis_Commercial.xlsx', owner: 'Contracts', date: 'Apr 2', type: 'xlsx', segment: 'Business', category: 'Vendors', status: 'approved', confidence: 86 },
      { name: 'Prior_Auth_Denial_Breakdown_by_Payer.xlsx', owner: 'Revenue Cycle', date: 'Mar 10', type: 'xlsx', segment: 'Business', category: 'Vendors', status: 'approved', confidence: 92 },
      // Business — Leadership
      { name: 'Board_Strategic_Plan_2026_2028.pptx', owner: 'CEO Office', date: 'Feb 1', type: 'pptx', segment: 'Business', category: 'Leadership', status: 'approved', confidence: 88 },
      { name: 'CEO_Executive_Briefing_Q1_2026.pptx', owner: 'CEO Office', date: 'Apr 1', type: 'pptx', segment: 'Business', category: 'Leadership', status: 'approved', confidence: 86 },
      { name: 'Headcount_by_Function_and_Department.xlsx', owner: 'HR Dept', date: 'Mar 5', type: 'xlsx', segment: 'Business', category: 'Leadership', status: 'approved', confidence: 90 },
      { name: 'Baseline_Outcome_Metrics_Day0_Lock.xlsx', owner: 'Internal Audit', date: 'Apr 10', type: 'xlsx', segment: 'Business', category: 'Outcomes', status: 'approved', confidence: 97 },
      { name: 'CDO_Profile_and_Org_Chart.pdf', owner: '—', date: '—', type: 'pdf', segment: 'Business', category: 'Leadership', status: 'missing', confidence: 0 },
      // IT — Technology
      { name: 'Meridian_Application_Technology_Inventory_312_Systems.xlsx', owner: 'IT Dept', date: 'Mar 20', type: 'xlsx', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 92 },
      { name: 'Meridian_DataCenter_Infrastructure_Inventory.xlsx', owner: 'IT Dept', date: 'Mar 18', type: 'xlsx', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 91 },
      { name: 'IT_Architecture_and_Data_Flow_Diagrams.pdf', owner: 'CTO', date: 'Apr 1', type: 'pdf', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 86 },
      { name: 'System_Integration_Map.xlsx', owner: 'CTO', date: 'Mar 25', type: 'xlsx', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 84 },
      { name: 'Epic_EHR_Implementation_Plan.pptx', owner: 'CTO', date: 'Mar 10', type: 'pptx', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 90 },
      { name: 'Epic_GoLive_Readiness_Assessment.pdf', owner: 'CTO', date: 'Apr 8', type: 'pdf', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 88 },
      { name: 'Shadow_IT_Audit_Report.pdf', owner: 'IT Dept', date: 'Mar 12', type: 'pdf', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 85 },
      { name: 'IT_Spend_by_Category_FY2025.xlsx', owner: 'IT Finance', date: 'Mar 15', type: 'xlsx', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 93 },
      { name: 'IT_Project_Portfolio_Status_Q1_2026.xlsx', owner: 'IT Dept', date: 'Apr 5', type: 'xlsx', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 87 },
      { name: 'Cloud_Migration_Roadmap.pptx', owner: 'CTO', date: 'Feb 15', type: 'pptx', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 83 },
      { name: 'Network_and_Security_Risk_Assessment.pdf', owner: 'CISO', date: 'Feb 28', type: 'pdf', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 89 },
      { name: 'Data_Governance_Framework_v1.2.pdf', owner: 'CIO', date: 'Mar 8', type: 'pdf', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 82 },
      { name: 'Cybersecurity_Risk_Register.xlsx', owner: 'CISO', date: 'Mar 22', type: 'xlsx', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 88 },
      // IT — AI
      { name: 'Meridian_AI_Analytics_Initiative_Tracker_42M.xlsx', owner: 'CIO', date: 'Mar 22', type: 'xlsx', segment: 'IT & Technology', category: 'AI', status: 'approved', confidence: 87 },
      { name: 'Epic_AI_Module_Evaluation.pdf', owner: 'CIO', date: 'Apr 1', type: 'pdf', segment: 'IT & Technology', category: 'AI', status: 'approved', confidence: 86 },
      { name: 'Prior_Auth_Automation_Assessment.pdf', owner: 'CIO', date: 'Mar 30', type: 'pdf', segment: 'IT & Technology', category: 'AI', status: 'approved', confidence: 85 },
      { name: 'Data_Platform_Architecture_Design.pdf', owner: 'CTO', date: 'Mar 28', type: 'pdf', segment: 'IT & Technology', category: 'AI', status: 'approved', confidence: 84 },
      // Third Party — Benchmarks
      { name: 'HFMA_Industry_Benchmarks_2025.pdf', owner: 'AbarVa Research', date: 'Mar 10', type: 'pdf', segment: 'Third Party', category: 'Benchmarks', status: 'approved', confidence: 98 },
      { name: 'Healthcare_AI_Adoption_Survey_2025.pdf', owner: 'AbarVa Research', date: 'Mar 5', type: 'pdf', segment: 'Third Party', category: 'Benchmarks', status: 'approved', confidence: 96 },
      { name: 'Medicare_Advantage_Star_Ratings_Benchmark.pdf', owner: 'AbarVa Research', date: 'Feb 20', type: 'pdf', segment: 'Third Party', category: 'Benchmarks', status: 'approved', confidence: 97 },
      { name: 'Denial_Management_Peer_Comparison_47_Systems.xlsx', owner: 'AbarVa Research', date: 'Mar 15', type: 'xlsx', segment: 'Third Party', category: 'Benchmarks', status: 'approved', confidence: 95 },
      { name: 'RCM_Vendor_Market_Analysis_2025.pdf', owner: 'AbarVa Research', date: 'Mar 12', type: 'pdf', segment: 'Third Party', category: 'Benchmarks', status: 'approved', confidence: 94 },
      { name: 'CMS_RADV_Audit_Scope_Update_Q1_2026.pdf', owner: 'AbarVa Research', date: 'Apr 2', type: 'pdf', segment: 'Third Party', category: 'Regulatory', status: 'approved', confidence: 96 },
      { name: 'Genome_Pattern_F011_Epic_Failure_Analysis.pdf', owner: 'AbarVa', date: 'Mar 20', type: 'pdf', segment: 'Third Party', category: 'Benchmarks', status: 'approved', confidence: 97 },
      // Third Party — Intelligence
      { name: 'Executive_Interview_Sarah_Chen_CMO.pdf', owner: 'AbarVa', date: 'Apr 1', type: 'pdf', segment: 'Third Party', category: 'Intelligence', status: 'approved', confidence: 85 },
      { name: 'Executive_Interview_Mark_Rivera_CTO.pdf', owner: 'AbarVa', date: 'Apr 2', type: 'pdf', segment: 'Third Party', category: 'Intelligence', status: 'approved', confidence: 85 },
      { name: 'Executive_Interview_Diana_Torres_CFO.pdf', owner: 'AbarVa', date: 'Apr 3', type: 'pdf', segment: 'Third Party', category: 'Intelligence', status: 'approved', confidence: 84 },
      { name: 'Executive_Interview_James_Park_CIO.pdf', owner: 'AbarVa', date: 'Apr 4', type: 'pdf', segment: 'Third Party', category: 'Intelligence', status: 'approved', confidence: 84 },
      { name: 'Executive_Interview_Robert_Kim_COO.pdf', owner: 'AbarVa', date: 'Apr 5', type: 'pdf', segment: 'Third Party', category: 'Intelligence', status: 'approved', confidence: 83 },
      { name: 'Executive_Interview_Dr_Patel_Deputy_CMO.pdf', owner: 'AbarVa', date: 'Apr 6', type: 'pdf', segment: 'Third Party', category: 'Intelligence', status: 'approved', confidence: 83 },
      { name: 'Executive_Interview_Legal_Counsel.pdf', owner: 'AbarVa', date: 'Apr 7', type: 'pdf', segment: 'Third Party', category: 'Intelligence', status: 'approved', confidence: 82 },
      { name: 'Meridian_Healthcare_Quality_RCM_Data.xlsx', owner: 'CMO Office', date: 'Mar 1', type: 'xlsx', segment: 'Third Party', category: 'Clinical', status: 'approved', confidence: 89 },
      { name: 'Leadership_Profiles_and_Board_Composition.pdf', owner: 'HR Dept', date: 'Mar 25', type: 'pdf', segment: 'Third Party', category: 'Leadership', status: 'approved', confidence: 94 },
    ],
  },
  apexretail: {
    label: 'Apex Retail Group',
    confidence: 88,
    files: [
      // Business — Financial
      { name: 'PnL_Statement_by_Channel_FY2025.xlsx', owner: 'CFO', date: 'Mar 10', type: 'xlsx', segment: 'Business', category: 'Financial', status: 'approved', confidence: 95 },
      { name: 'PnL_Statement_by_Channel_FY2024.xlsx', owner: 'CFO', date: 'Feb 8', type: 'xlsx', segment: 'Business', category: 'Financial', status: 'approved', confidence: 94 },
      { name: 'PnL_Statement_by_Channel_FY2023.xlsx', owner: 'CFO', date: 'Jan 12', type: 'xlsx', segment: 'Business', category: 'Financial', status: 'approved', confidence: 93 },
      { name: 'Digital_PnL_Detail_FY2025.xlsx', owner: 'CFO', date: 'Mar 15', type: 'xlsx', segment: 'Business', category: 'Financial', status: 'approved', confidence: 92 },
      { name: 'Store_Performance_Data_by_Region.xlsx', owner: 'COO', date: 'Mar 20', type: 'xlsx', segment: 'Business', category: 'Financial', status: 'approved', confidence: 91 },
      { name: 'Apex_IT_Financial_Model_FY2025.xlsx', owner: 'Finance', date: 'Apr 5', type: 'xlsx', segment: 'Business', category: 'Financial', status: 'approved', confidence: 90 },
      { name: 'Capital_Allocation_Plan_FY2026.xlsx', owner: 'CFO', date: 'Mar 8', type: 'xlsx', segment: 'Business', category: 'Financial', status: 'approved', confidence: 88 },
      // Business — Operations / Vendors
      { name: 'Inventory_and_Supply_Chain_Data_Q4_FY2025.xlsx', owner: 'COO', date: 'Mar 20', type: 'xlsx', segment: 'Business', category: 'Operations', status: 'approved', confidence: 90 },
      { name: 'Inventory_and_Supply_Chain_Data_Q3_FY2025.xlsx', owner: 'COO', date: 'Nov 20', type: 'xlsx', segment: 'Business', category: 'Operations', status: 'approved', confidence: 89 },
      { name: 'Retail_Store_Footfall_Data_FY2025.xlsx', owner: 'COO', date: 'Mar 12', type: 'xlsx', segment: 'Business', category: 'Operations', status: 'approved', confidence: 88 },
      { name: 'Vendor_Contract_Register.xlsx', owner: 'Procurement', date: 'Mar 25', type: 'xlsx', segment: 'Business', category: 'Vendors', status: 'approved', confidence: 89 },
      { name: 'Salesforce_Einstein_License_and_SLA.pdf', owner: 'Procurement', date: 'Mar 15', type: 'pdf', segment: 'Business', category: 'Vendors', status: 'approved', confidence: 88 },
      { name: 'Technology_Vendor_Spend_Analysis.xlsx', owner: 'Finance', date: 'Mar 22', type: 'xlsx', segment: 'Business', category: 'Vendors', status: 'approved', confidence: 87 },
      // Business — Leadership
      { name: 'Board_Strategic_Plan_2026_2028.pptx', owner: 'CEO Office', date: 'Feb 1', type: 'pptx', segment: 'Business', category: 'Leadership', status: 'approved', confidence: 87 },
      { name: 'CEO_Briefing_Q1_2026.pptx', owner: 'CEO Office', date: 'Apr 1', type: 'pptx', segment: 'Business', category: 'Leadership', status: 'approved', confidence: 85 },
      { name: 'Headcount_by_Function_28000_Employees.xlsx', owner: 'HR', date: 'Mar 8', type: 'xlsx', segment: 'Business', category: 'Leadership', status: 'approved', confidence: 90 },
      { name: 'Leadership_Org_Chart_2026.pdf', owner: 'HR', date: 'Mar 15', type: 'pdf', segment: 'Business', category: 'Leadership', status: 'approved', confidence: 91 },
      { name: 'Baseline_Outcome_Metrics_Day0_Lock.xlsx', owner: 'Internal Audit', date: 'Apr 10', type: 'xlsx', segment: 'Business', category: 'Outcomes', status: 'approved', confidence: 96 },
      { name: 'CDO_Vacancy_Profile.pdf', owner: '—', date: '—', type: 'pdf', segment: 'Business', category: 'Leadership', status: 'missing', confidence: 0 },
      // IT — Technology
      { name: 'Apex_Retail_Store_Technology_Inventory_28000_Employees.xlsx', owner: 'IT Dept', date: 'Mar 22', type: 'xlsx', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 86 },
      { name: 'IT_Architecture_and_System_Map.pdf', owner: 'CTO', date: 'Mar 18', type: 'pdf', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 85 },
      { name: 'Ecommerce_Platform_Architecture.pdf', owner: 'CTO', date: 'Mar 20', type: 'pdf', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 87 },
      { name: 'Store_POS_System_Inventory.xlsx', owner: 'IT Dept', date: 'Mar 10', type: 'xlsx', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 88 },
      { name: 'Cloud_Infrastructure_Assessment.pdf', owner: 'CTO', date: 'Mar 5', type: 'pdf', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 84 },
      { name: 'Data_Platform_Architecture.pdf', owner: 'CTO', date: 'Mar 25', type: 'pdf', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 83 },
      { name: 'IT_Project_Portfolio_Status_Q1_2026.xlsx', owner: 'IT Dept', date: 'Apr 5', type: 'xlsx', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 85 },
      { name: 'Cybersecurity_Risk_Assessment_FY2025.pdf', owner: 'CISO', date: 'Mar 12', type: 'pdf', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 87 },
      { name: 'Integration_Architecture_Map.xlsx', owner: 'CTO', date: 'Mar 28', type: 'xlsx', segment: 'IT & Technology', category: 'Technology', status: 'approved', confidence: 83 },
      { name: 'Mobile_App_Analytics_FY2025.xlsx', owner: 'CMO / CTO', date: 'Mar 15', type: 'xlsx', segment: 'IT & Technology', category: 'Digital', status: 'approved', confidence: 88 },
      // IT — AI / Digital
      { name: 'Salesforce_Einstein_License_and_Usage_Audit.xlsx', owner: 'CMO', date: 'Mar 15', type: 'xlsx', segment: 'IT & Technology', category: 'AI', status: 'approved', confidence: 92 },
      { name: 'Ecommerce_Platform_Analytics_72pct_Abandonment.xlsx', owner: 'CMO / CTO', date: 'Mar 18', type: 'xlsx', segment: 'IT & Technology', category: 'Digital', status: 'approved', confidence: 88 },
      { name: 'AI_Initiative_Register_28M.xlsx', owner: 'CIO', date: 'Mar 22', type: 'xlsx', segment: 'IT & Technology', category: 'AI', status: 'approved', confidence: 86 },
      { name: 'Personalization_Engine_Evaluation.pdf', owner: 'CMO', date: 'Apr 1', type: 'pdf', segment: 'IT & Technology', category: 'AI', status: 'approved', confidence: 84 },
      { name: 'CDP_Implementation_Report.pdf', owner: 'CMO', date: 'Mar 28', type: 'pdf', segment: 'IT & Technology', category: 'Digital', status: 'approved', confidence: 85 },
      // Third Party — Benchmarks
      { name: 'Retail_Industry_Benchmarks_2025.pdf', owner: 'AbarVa Research', date: 'Mar 10', type: 'pdf', segment: 'Third Party', category: 'Benchmarks', status: 'approved', confidence: 98 },
      { name: 'Ecommerce_Conversion_Benchmark_Top_50_Retailers.xlsx', owner: 'AbarVa Research', date: 'Mar 15', type: 'xlsx', segment: 'Third Party', category: 'Benchmarks', status: 'approved', confidence: 97 },
      { name: 'Customer_Retention_Cost_Analysis_2025.pdf', owner: 'AbarVa Research', date: 'Mar 8', type: 'pdf', segment: 'Third Party', category: 'Benchmarks', status: 'approved', confidence: 95 },
      { name: 'Supply_Chain_AI_ROI_Benchmark.pdf', owner: 'AbarVa Research', date: 'Mar 12', type: 'pdf', segment: 'Third Party', category: 'Benchmarks', status: 'approved', confidence: 94 },
      { name: 'Retail_Digital_Transformation_Survey_2025.pdf', owner: 'AbarVa Research', date: 'Mar 5', type: 'pdf', segment: 'Third Party', category: 'Benchmarks', status: 'approved', confidence: 96 },
      { name: 'Peer_Retailer_Ecommerce_Comparison.xlsx', owner: 'AbarVa Research', date: 'Mar 20', type: 'xlsx', segment: 'Third Party', category: 'Benchmarks', status: 'approved', confidence: 95 },
      { name: 'Genome_Pattern_F005_Ecommerce_Leakage.pdf', owner: 'AbarVa', date: 'Mar 18', type: 'pdf', segment: 'Third Party', category: 'Benchmarks', status: 'approved', confidence: 96 },
      { name: 'Genome_Pattern_F009_Loyalty_Erosion.pdf', owner: 'AbarVa', date: 'Mar 18', type: 'pdf', segment: 'Third Party', category: 'Benchmarks', status: 'approved', confidence: 95 },
      // Third Party — Intelligence
      { name: 'Executive_Interview_Jennifer_Walsh_CEO.pdf', owner: 'AbarVa', date: 'Apr 1', type: 'pdf', segment: 'Third Party', category: 'Intelligence', status: 'approved', confidence: 85 },
      { name: 'Executive_Interview_Michael_Torres_CFO.pdf', owner: 'AbarVa', date: 'Apr 2', type: 'pdf', segment: 'Third Party', category: 'Intelligence', status: 'approved', confidence: 85 },
      { name: 'Executive_Interview_Lisa_Chen_CMO.pdf', owner: 'AbarVa', date: 'Apr 3', type: 'pdf', segment: 'Third Party', category: 'Intelligence', status: 'approved', confidence: 84 },
      { name: 'Executive_Interview_Robert_Park_CTO.pdf', owner: 'AbarVa', date: 'Apr 4', type: 'pdf', segment: 'Third Party', category: 'Intelligence', status: 'approved', confidence: 84 },
      { name: 'Executive_Interview_Angela_Davis_COO.pdf', owner: 'AbarVa', date: 'Apr 5', type: 'pdf', segment: 'Third Party', category: 'Intelligence', status: 'approved', confidence: 83 },
      { name: 'Customer_Loyalty_Transaction_Data_FY2025.csv', owner: 'CMO', date: 'Mar 10', type: 'csv', segment: 'Third Party', category: 'Customer', status: 'approved', confidence: 88 },
      { name: 'Customer_NPS_and_Satisfaction_Survey_FY2025.xlsx', owner: 'CMO', date: 'Mar 8', type: 'xlsx', segment: 'Third Party', category: 'Customer', status: 'approved', confidence: 87 },
      { name: 'Leadership_Profiles_and_Board_Composition.pdf', owner: 'HR', date: 'Mar 25', type: 'pdf', segment: 'Third Party', category: 'Leadership', status: 'approved', confidence: 92 },
    ],
  },
}

const Q_UPDATE_QUESTIONS = [
  { id: 'q1', label: 'Q1', question: 'Did any new systems go live in the past 90 days?', placeholder: 'e.g., New EHR module, cloud migration completed...' },
  { id: 'q2', label: 'Q2', question: 'Did any major projects complete, fail, or get cancelled?', placeholder: 'e.g., AI pilot concluded, ERP project deferred...' },
  { id: 'q3', label: 'Q3', question: 'Did leadership priorities or budget change?', placeholder: 'e.g., CFO target shifted, CDO role filled...' },
  { id: 'q4', label: 'Q4', question: 'Any new vendor contracts, renewals, or cancellations?', placeholder: 'e.g., Ensemble contract renewed, Mirth replaced...' },
  { id: 'q5', label: 'Q5', question: 'Any regulatory changes that affect your technology strategy?', placeholder: 'e.g., New CMS mandate, ONC rule update...' },
]

const SEGMENTS: FileSegment[] = ['Business', 'IT & Technology', 'Third Party']

export default function AdminData() {
  const [activeClient, setActiveClient] = useState<string>('meridian')
  const [activeSegment, setActiveSegment] = useState<FileSegment | 'All'>('All')
  const [showModal, setShowModal] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const client = CLIENT_FILES[activeClient]
  const files = client.files
  const approved = files.filter(f => f.status === 'approved')
  const missing = files.filter(f => f.status === 'missing')
  const confAvg = approved.length > 0 ? Math.round(approved.reduce((a, f) => a + f.confidence, 0) / approved.length) : 0

  const displayFiles = activeSegment === 'All' ? files : files.filter(f => f.segment === activeSegment)

  // Category breakdown for display
  const catCounts: Record<string, number> = {}
  approved.forEach(f => { catCounts[f.category] = (catCounts[f.category] ?? 0) + 1 })

  // File type breakdown
  const typeCounts: Partial<Record<FileType, number>> = {}
  approved.forEach(f => { typeCounts[f.type] = (typeCounts[f.type] ?? 0) + 1 })

  const handleSubmit = () => {
    setSubmitted(true)
    setTimeout(() => { setShowModal(false); setSubmitted(false) }, 2000)
  }

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', gap: '8px', padding: '12px 32px', background: '#FFFFFF', borderBottom: '1px solid #E8E6E3', overflowX: 'auto' as const }}>
        {LINKS.map(l => <a key={l.href} href={l.href} style={{ padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', background: (l as any).active ? '#0C0C0C' : 'transparent', color: (l as any).active ? '#FFFFFF' : '#6B7280', flexShrink: 0, whiteSpace: 'nowrap' as const }}>{l.label}</a>)}
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0C0C0C', marginBottom: '4px', fontFamily: "'DM Sans', sans-serif" }}>Data Repository</h1>
            <p style={{ fontSize: '14px', color: '#6B7280' }}>All client files ingested, categorised, and approved for intelligence.</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: '9px 18px', borderRadius: '6px', background: '#0C0C0C', color: '#FFFFFF', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            ↻ Quarterly Update
          </button>
        </div>

        {/* Client tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid #E8E6E3', paddingBottom: '0' }}>
          {Object.entries(CLIENT_FILES).map(([key, val]) => {
            const clientFiles = val.files
            const clientApproved = clientFiles.filter(f => f.status === 'approved').length
            return (
              <button key={key} onClick={() => { setActiveClient(key); setActiveSegment('All') }} style={{
                padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                borderBottom: activeClient === key ? '2px solid #0C0C0C' : '2px solid transparent',
                color: activeClient === key ? '#0C0C0C' : '#6B7280',
                background: 'transparent', marginBottom: '-1px',
              }}>
                {val.label} <span style={{ fontSize: '11px', color: activeClient === key ? '#0C0C0C' : '#9CA3AF', marginLeft: '4px' }}>({clientApproved})</span>
              </button>
            )
          })}
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { value: String(files.length), label: 'Total Files' },
            { value: String(approved.length), label: 'Approved' },
            { value: String(missing.length), label: 'Missing', warn: missing.length > 0 },
            { value: `${confAvg}%`, label: 'Avg Confidence' },
            { value: `${client.confidence}%`, label: 'Intel Score' },
          ].map((s, i) => (
            <div key={i} style={{ ...S.card, padding: '16px 20px' }}>
              <div style={{ fontSize: '26px', fontWeight: 700, color: s.warn ? '#DC2626' : '#0C0C0C', lineHeight: 1, marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* File type + category breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div style={S.card}>
            <div style={S.label}>File Types</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
              {(Object.entries(typeCounts) as [FileType, number][]).sort((a, b) => b[1] - a[1]).map(([ft, count]) => (
                <div key={ft} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', border: `1px solid ${FILE_TYPE_COLOR[ft]}30`, borderRadius: '20px', background: `${FILE_TYPE_COLOR[ft]}08` }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700, color: FILE_TYPE_COLOR[ft], textTransform: 'uppercase' as const }}>{ft}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0C0C0C' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={S.card}>
            <div style={S.label}>Categories</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
              {Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', border: '1px solid #E8E6E3', borderRadius: '20px', background: '#F8F7F4' }}>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>{cat}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0C0C0C' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Segment filter */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {(['All', ...SEGMENTS] as const).map(seg => (
            <button key={seg} onClick={() => setActiveSegment(seg)} style={{
              padding: '6px 14px', borderRadius: '20px', border: '1px solid #E8E6E3', cursor: 'pointer',
              fontSize: '12px', fontWeight: 600,
              background: activeSegment === seg ? '#0C0C0C' : '#FFFFFF',
              color: activeSegment === seg ? '#FFFFFF' : '#6B7280',
            }}>
              {seg} {seg !== 'All' && <span style={{ opacity: 0.7 }}>({files.filter(f => f.segment === seg && f.status === 'approved').length})</span>}
            </button>
          ))}
        </div>

        {/* File table */}
        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 52px 120px 100px 70px 80px 90px', gap: '8px', padding: '10px 20px', background: '#F8F7F4', borderBottom: '1px solid #E8E6E3' }}>
            {['File', 'Type', 'Segment', 'Category', 'Date', 'Conf.', 'Status'].map(h => (
              <div key={h} style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>{h}</div>
            ))}
          </div>
          {displayFiles.map((f, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2fr 52px 120px 100px 70px 80px 90px', gap: '8px',
              padding: '11px 20px', alignItems: 'center',
              borderBottom: i < displayFiles.length - 1 ? '1px solid #F3F2F0' : 'none',
              background: f.status === 'missing' ? '#FEF2F2' : i % 2 === 0 ? '#FFFFFF' : '#FAFAF9',
            }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: f.status === 'missing' ? '#DC2626' : '#0C0C0C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {f.status === 'missing' ? '○ ' : ''}{f.name}
              </div>
              <div>
                <span style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, color: FILE_TYPE_COLOR[f.type], background: `${FILE_TYPE_COLOR[f.type]}12`, padding: '2px 5px', borderRadius: '3px', textTransform: 'uppercase' as const }}>{f.type}</span>
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280' }}>{f.segment}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: '#6B7280' }}>{f.category}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#9CA3AF' }}>{f.date}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12px', fontWeight: 600, color: f.confidence >= 90 ? '#16A34A' : f.confidence >= 80 ? '#2563EB' : f.confidence > 0 ? '#D97706' : '#9CA3AF' }}>
                {f.confidence > 0 ? `${f.confidence}%` : '—'}
              </div>
              <div>
                <span style={{
                  fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, padding: '3px 7px', borderRadius: '3px',
                  textTransform: 'uppercase' as const, letterSpacing: '0.05em',
                  background: f.status === 'approved' ? '#ECFDF5' : f.status === 'missing' ? '#FEF2F2' : '#FFFBEB',
                  color: f.status === 'approved' ? '#16A34A' : f.status === 'missing' ? '#DC2626' : '#D97706',
                }}>{f.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Missing files callout */}
        {missing.length > 0 && (
          <div style={{ marginTop: '16px', padding: '16px 20px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626', marginBottom: '8px' }}>{missing.length} file{missing.length > 1 ? 's' : ''} still missing</div>
            {missing.map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i < missing.length - 1 ? '6px' : 0 }}>
                <span style={{ fontSize: '13px', color: '#7F1D1D' }}>{f.name}</span>
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{f.category}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quarterly Update Modal */}
      {showModal && (
        <div style={{ position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '32px', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto' as const }}>
            {submitted ? (
              <div style={{ textAlign: 'center' as const, padding: '24px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px', color: '#16A34A' }}>✓</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#0C0C0C', marginBottom: '8px' }}>Intelligence Updated</div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>AbarVa is processing your updates. Confidence scores will refresh within 2 hours.</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#0C0C0C', marginBottom: '4px' }}>Quarterly Update — {client.label}</div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>5 questions · 15 minutes · keeps intelligence current</div>
                  </div>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#9CA3AF', cursor: 'pointer', marginLeft: '16px' }}>×</button>
                </div>
                {Q_UPDATE_QUESTIONS.map((q, i) => (
                  <div key={q.id} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', flexShrink: 0 }}>{q.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0C0C0C', lineHeight: 1.4 }}>{q.question}</span>
                    </div>
                    <textarea rows={2} placeholder={q.placeholder} value={answers[q.id] || ''}
                      onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #E8E6E3', borderRadius: '6px', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", color: '#0C0C0C', resize: 'none' as const, boxSizing: 'border-box' as const }}
                    />
                    {i < Q_UPDATE_QUESTIONS.length - 1 && <div style={{ height: '1px', background: '#F3F2F0', marginTop: '16px' }} />}
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
                  <button onClick={handleSubmit} style={{ flex: 1, padding: '12px', borderRadius: '6px', background: '#0C0C0C', color: '#FFFFFF', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Submit Update</button>
                  <button onClick={() => setShowModal(false)} style={{ padding: '12px 20px', borderRadius: '6px', background: '#F8F7F4', color: '#6B7280', border: '1px solid #E8E6E3', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
