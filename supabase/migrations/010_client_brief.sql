-- ─────────────────────────────────────────────────────────────────────────────
-- 010_client_brief.sql
--
-- Structured per-client situational brief.
-- One row per client. brief_json holds identity, financial_signals,
-- forcing_events, leadership_gaps, contradictions, genome_matches_confirmed,
-- and likely_tensions — all in a shape the advisor agents can read directly
-- without re-deriving context from narrative.
--
-- Preloaded for Meridian (healthcare), Arcturus (wealth mgmt), and Apex Retail
-- using the seeded client data already in the repo.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS client_brief (
  client_id   TEXT PRIMARY KEY,
  brief_json  JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_brief_updated_at ON client_brief(updated_at DESC);

-- Auto-touch updated_at on row change
CREATE OR REPLACE FUNCTION client_brief_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_brief_touch_updated_at ON client_brief;
CREATE TRIGGER trg_client_brief_touch_updated_at
BEFORE UPDATE ON client_brief
FOR EACH ROW EXECUTE FUNCTION client_brief_touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- MERIDIAN HEALTH SYSTEM
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO client_brief (client_id, brief_json) VALUES (
  'meridian',
  $meridian${
  "identity": {
    "name": "Meridian Health System",
    "type": "Integrated Delivery Network",
    "revenue": "$11.2B",
    "facilities": 47,
    "employees": 28000
  },
  "financial_signals": [
    {
      "metric": "RCM Denial Rate",
      "current": "18.2%",
      "benchmark": "11.4% (HFMA)",
      "gap_value": "$94M annual revenue at risk",
      "trend": "8 consecutive quarters above benchmark",
      "source": "Uploaded Q1 2026 RCM report"
    },
    {
      "metric": "Prior Auth Automation",
      "current": "23%",
      "benchmark": "62% peer average",
      "gap_value": "$38M operational drag",
      "trend": "Declining"
    },
    {
      "metric": "MA Star Rating",
      "current": "3.5",
      "benchmark": "4.0 for premium reimbursement tier",
      "gap_value": "$22M in foregone bonus payments"
    }
  ],
  "forcing_events": [
    {
      "event": "Epic EHR go-live",
      "date": "Q3 2026",
      "days_out": 90,
      "implication": "AI integration path not yet verified — retrofit post go-live costs 40% more and takes 18 months longer (F-pattern)"
    }
  ],
  "leadership_gaps": [
    {
      "role": "Chief Data Officer",
      "status": "Vacant 9 months",
      "genome_match": "F007 — 79% programme failure rate with CDO vacancy at critical phase"
    },
    {
      "role": "Named AI Executive Sponsor",
      "status": "Not identified",
      "genome_match": "F002 — 89% failure rate without named sponsor"
    }
  ],
  "contradictions": [
    {
      "leadership_claim": "Our AI strategy is well underway (board deck, Feb 2026)",
      "data_reality": "Zero AI initiatives in production. $94M AI spend tracked with no verified ROI.",
      "source": "Uploaded board presentation + financial reports"
    },
    {
      "leadership_claim": "Data platform is modernized (Q4 2025 earnings call)",
      "data_reality": "Collibra coverage at 23%. 312 apps, $38M shadow IT spend.",
      "source": "IT inventory + public filings"
    }
  ],
  "genome_matches_confirmed": [
    { "code": "F002", "name": "No named AI executive sponsor", "failure_rate": "89%" },
    { "code": "F007", "name": "CDO vacancy at critical phase", "failure_rate": "79%" },
    { "code": "F008", "name": "AI spend without verified ROI", "failure_rate": "91%" }
  ],
  "likely_tensions": [
    "RCM automation before Epic go-live — highest near-term $ impact, riskiest timing",
    "Prior auth automation — less Epic-exposed, faster wins",
    "AI governance scaffolding first — F002/F007 patterns say everything else fails without it"
  ]
}$meridian$::jsonb
)
ON CONFLICT (client_id) DO UPDATE SET brief_json = EXCLUDED.brief_json;

-- ─────────────────────────────────────────────────────────────────────────────
-- ARCTURUS FINANCIAL GROUP
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO client_brief (client_id, brief_json) VALUES (
  'arcturus',
  $arcturus${
  "identity": {
    "name": "Arcturus Financial Group",
    "type": "Wealth Management Firm",
    "aum": "$8.4B",
    "advisors": 180,
    "employees": 1200
  },
  "financial_signals": [
    {
      "metric": "Cost-to-Income Ratio",
      "current": "71%",
      "benchmark": "58% peer median (Cerulli 2025)",
      "gap_value": "$840M recoverable efficiency gap",
      "trend": "Flat — unchanged from prior year despite stated improvement narrative",
      "source": "Arcturus audited financial statements, Dec 2025"
    },
    {
      "metric": "AUM per Advisor",
      "current": "$46.7M",
      "benchmark": "$72M peer (FA Mag Broker-Dealer Survey 2025)",
      "gap_value": "$25.3M gap per advisor — $4.5B aggregate productivity shortfall",
      "trend": "Widening as top advisors approach retirement"
    },
    {
      "metric": "Client Retention Rate",
      "current": "87%",
      "benchmark": "94% peer (J.D. Power 2025)",
      "gap_value": "$588M annual AUM churn above benchmark"
    },
    {
      "metric": "New Client Acquisition Cost",
      "current": "$4,200",
      "benchmark": "$1,800 peer (Schwab RIA 2025)",
      "gap_value": "2.3× above benchmark — digital channel gap"
    }
  ],
  "forcing_events": [
    {
      "event": "SEC examination cycle",
      "date": "Q3 2026",
      "days_out": 150,
      "implication": "Current manual compliance surveillance covers only 12% of advisor communications — exam review volume cannot be cleared in time without real-time AI surveillance in place"
    },
    {
      "event": "Technology stack RFP decision pending",
      "date": "9 months open",
      "days_out": 0,
      "implication": "Six vendors competing on feature lists with no integration architecture defined — F044 pattern predicts 72% wrong-vendor selection and 2× integration cost overrun"
    }
  ],
  "leadership_gaps": [
    {
      "role": "Named AI Executive Sponsor",
      "status": "Not identified — CEO sets vision, no operational owner",
      "genome_match": "F002 — 84% failure rate without named sponsor"
    },
    {
      "role": "Integration architecture owner",
      "status": "No defined role; CTO focused on legacy stack run-the-business",
      "genome_match": "F044 — 72% failure rate on vendor RFPs without integration spec"
    }
  ],
  "contradictions": [
    {
      "leadership_claim": "C/I ratio on a path to improvement at 65% (CEO LP communication Q4 2025)",
      "data_reality": "Audited financials show 71% C/I — unchanged YoY, 13 points above peer benchmark",
      "source": "Arcturus audited financial statements + LP quarterly communication"
    },
    {
      "leadership_claim": "Existing technology can support AI deployment within 90 days (CTO board update Feb 2026)",
      "data_reality": "Three legacy systems (Advent, Salesforce Classic, Actimize) with no API layer; any AI deployment requires 18–24 months of integration first",
      "source": "AbarVa technology assessment, Mar 2026"
    },
    {
      "leadership_claim": "Strong organic growth of $800M new AUM in 2025 (CRO annual review)",
      "data_reality": "$800M new AUM offset by $588M churn = 2.5% net growth; headline obscures retention problem",
      "source": "AbarVa AUM flow analysis, Mar 2026"
    }
  ],
  "genome_matches_confirmed": [
    { "code": "F044", "name": "Vendor RFP without integration architecture", "failure_rate": "72%" },
    { "code": "F018", "name": "Advisor AI adoption without change management", "failure_rate": "66%" },
    { "code": "F029", "name": "Client portal without proactive push intelligence", "failure_rate": "58%" },
    { "code": "F052", "name": "Fee compression without cost structure response", "failure_rate": "51%" }
  ],
  "likely_tensions": [
    "Compliance AI surveillance before SEC exam cycle — regulatory forcing function, highest-certainty ROI, shortest path",
    "Advisor co-pilot rollout — biggest long-term AUM lift but blocked until F018 change management is in place; two competing pilots already failing adoption",
    "Tech stack RFP decision — cannot proceed responsibly without integration architecture; every month of delay compounds the $840M C/I gap"
  ]
}$arcturus$::jsonb
)
ON CONFLICT (client_id) DO UPDATE SET brief_json = EXCLUDED.brief_json;

-- ─────────────────────────────────────────────────────────────────────────────
-- APEX RETAIL GROUP
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO client_brief (client_id, brief_json) VALUES (
  'apexretail',
  $apex${
  "identity": {
    "name": "Apex Retail Group",
    "type": "Specialty Retail Chain",
    "revenue": "$2.8B",
    "stores": 380,
    "employees": 22000
  },
  "financial_signals": [
    {
      "metric": "eCommerce Revenue Share",
      "current": "18%",
      "benchmark": "32% peer median (NRF Digital Commerce 2025)",
      "gap_value": "$392M digital revenue below peer benchmark",
      "trend": "Growing in relative terms but absolute gap widening as peers accelerate",
      "source": "Apex investor materials + NRF peer data"
    },
    {
      "metric": "Inventory Turnover",
      "current": "3.8×",
      "benchmark": "5.2× peer (Retail Metrics 2025)",
      "gap_value": "$68M excess inventory carrying cost + $180M annual markdowns",
      "trend": "Flat — manual statistical forecasting at 61% SKU-level accuracy"
    },
    {
      "metric": "Gross Margin",
      "current": "31%",
      "benchmark": "38% specialty peer (Kantar Retail 2025)",
      "gap_value": "7-point gap = $196M — driven by markdowns from weak demand signal"
    },
    {
      "metric": "eCommerce Conversion Rate",
      "current": "2.1%",
      "benchmark": "3.4% peer (Salesforce Commerce Cloud 2025)",
      "gap_value": "$58M lost digital revenue at current traffic volume"
    },
    {
      "metric": "Labor Cost as % of Revenue",
      "current": "18%",
      "benchmark": "14% peer (McKinsey Retail Ops 2025)",
      "gap_value": "$112M excess labor cost; overtime 28% above benchmark"
    }
  ],
  "forcing_events": [
    {
      "event": "eCommerce replatform go-live",
      "date": "Q4 2026 (slipped)",
      "days_out": 180,
      "implication": "Project 4 months behind plan; window to reach 30% digital revenue by 2027 is closing as peers deploy AI personalization at scale. Every quarter of delay cedes permanent share."
    },
    {
      "event": "Holiday 2026 season",
      "date": "Nov 2026",
      "days_out": 210,
      "implication": "Current forecasting at 61% SKU accuracy will drive another $50M+ in markdowns absent demand forecasting AI. Inventory commitments already being placed against a known-bad signal."
    }
  ],
  "leadership_gaps": [
    {
      "role": "Chief Data Officer",
      "status": "Vacant — no accountable owner for data platform or AI strategy",
      "genome_match": "F005 — 82% failure rate without CDO/AI leadership (repo: failure-genome.ts marks apexretail cdoVacant: true)"
    },
    {
      "role": "Unified Commerce Architecture Owner",
      "status": "OMS and WMS on separate legacy systems; no named owner for omnichannel data layer",
      "genome_match": "F047 — 64% failure rate on digital transformation without unified commerce architecture"
    }
  ],
  "contradictions": [
    {
      "leadership_claim": "eCommerce is our fastest-growing channel, up 22% YoY (CMO investor day Q3 2025)",
      "data_reality": "22% growth on 18% base = 14.6% of new revenue from digital; absolute gap to 32% peer benchmark is widening, not closing",
      "source": "AbarVa digital channel analysis vs NRF peer data"
    },
    {
      "leadership_claim": "Inventory accuracy at 94%, at par with best-in-class retailers (COO ops review Nov 2025)",
      "data_reality": "Cycle count audit shows 78% actual accuracy; 16-point overstatement drives 34% of stockouts and $42M in lost sales",
      "source": "Apex cycle count data, DC audit, Feb 2026"
    },
    {
      "leadership_claim": "22M loyalty members, average CLV $1,240 (CMO annual marketing review)",
      "data_reality": "66% of members are single-purchase dormant; true active base is 7.5M (34% of stated), active CLV is $2,800 — loyalty program asset is inflated 3×",
      "source": "AbarVa loyalty cohort analysis, Mar 2026"
    },
    {
      "leadership_claim": "Demand forecasting accuracy of 82% at 8-week horizon (supply chain team)",
      "data_reality": "82% is category-level; SKU-level accuracy is 61% — the actual driver of $180M annual markdowns",
      "source": "AbarVa SKU-level forecast audit across top 2,000 SKUs"
    }
  ],
  "genome_matches_confirmed": [
    { "code": "F005", "name": "No CDO or AI leadership", "failure_rate": "82%" },
    { "code": "F061", "name": "Personalization at scale without real-time data platform", "failure_rate": "71%" },
    { "code": "F039", "name": "Demand forecasting AI without SKU-level ground truth", "failure_rate": "68%" },
    { "code": "F047", "name": "Digital transformation without unified commerce architecture", "failure_rate": "64%" },
    { "code": "F022", "name": "Loyalty program scale without engagement architecture", "failure_rate": "56%" }
  ],
  "likely_tensions": [
    "Demand forecasting AI before Holiday 2026 — biggest near-term $ impact ($62M annually) but blocked by F039 (no SKU-level ground truth); need data foundation before model",
    "Personalization re-architecture before replatform go-live — aligning the two programs doubles the probability of success for both; sequencing them sequentially wastes 9 months",
    "CDO hire is the unblocker — every other AI use case stalls on data platform ownership per F005; fill role before funding any more vendor pilots"
  ]
}$apex$::jsonb
)
ON CONFLICT (client_id) DO UPDATE SET brief_json = EXCLUDED.brief_json;
