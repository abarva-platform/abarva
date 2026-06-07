# Provider & Payer metric catalog (role → KPIs) — the depth reference

This is the source-of-truth the KPI-register template draws from, so each role's tab has
real-world depth. Counts are realistic targets for a mid-to-large org. Use as a checklist;
load what's real for the tenant (current value, target, owner, period, source).

## HEALTHCARE PROVIDER (integrated delivery network)

### System CEO / Board scorecard (~15–20)
operating margin · total margin · EBITDA · days cash on hand · debt service coverage ·
bond rating / covenant headroom · net revenue growth · market share · HCAHPS top-box ·
serious safety events · mortality (O/E) · 30-day readmission index · employee engagement ·
RN turnover · physician engagement · access (third-next-available) · strategic growth
(new sites/service lines) · community benefit.

### CFO (~30)
operating margin · net patient revenue · payer mix (% govt/commercial) · net days in AR ·
denial rate · initial denial overturn rate · clean claim rate · cost per adjusted discharge ·
labor cost % of net revenue · FTEs per adjusted occupied bed · supply cost % · days cash on hand ·
debt service coverage · capital spend vs plan · cash collections vs net revenue ·
point-of-service collections · contractual allowance % · bad debt + charity % · cost to collect ·
case mix index · DRG downgrade rate · revenue per RVU · budget variance.

### COO (~30)
ED median LOS · ED left-without-being-seen · ED boarding hours · door-to-provider ·
inpatient LOS (O/E) · discharge before noon · bed occupancy / capacity · OR on-time first starts ·
OR turnover time · OR block utilization · case volume vs plan · contract/agency labor % ·
overtime % · productive vs worked hours · ambulatory access (TNA) · clinic no-show rate ·
supply stockouts · patient transfer turnaround · throughput index.

### Hospital CEO / Operations (per entity, ~20–25)
local operating margin · admissions / ED visits / surgical cases vs plan · HCAHPS · serious
safety events · LOS (O/E) · ED LOS · OR on-time starts · contract labor % · RN vacancy ·
physician relations index · capital projects on time/budget · local market share.

### CMO (clinical, ~20)
mortality (O/E) · 30-day readmissions (O/E) · CLABSI SIR · CAUTI SIR · SSI SIR · C. diff SIR ·
sepsis bundle compliance · VTE prophylaxis · hand hygiene · medication error rate ·
falls with injury · pressure injury rate · venous mortality · care-variation reduction ·
documentation/coding accuracy · clinical pathway adherence.

### CNO (nursing, ~15)
RN turnover · RN vacancy · nurse engagement · nurse-sensitive indicators (falls, pressure
injury, CLABSI/CAUTI) · skill mix · agency RN % · span of control · overtime · time-to-fill ·
new-grad retention.

### CIO / CDAO (~15)
EHR uptime · unplanned downtime events · IT spend % of revenue · capital vs opex split ·
project portfolio on time/budget · critical-vuln remediation SLA (CISO) · phishing failure rate ·
identity/MFA coverage · analytics adoption (weekly active) · data-quality score · report backlog ·
AI use-case pipeline.

---

## HEALTHCARE PAYER (health plan)

### CEO (~12–15)
membership growth · member retention / churn · medical loss ratio (MLR) · admin expense ratio ·
net income / margin · Star rating (Medicare Advantage) · HEDIS composite · risk-adjustment (RAF)
accuracy · NPS · regulatory findings · value-based-care % of spend · combined ratio.

### CFO (~25)
MLR (overall + by line) · admin loss ratio · premium PMPM · medical cost trend · pharmacy trend ·
IBNR reserve adequacy · risk-based capital (RBC) ratio · days claims payable · loss-adjustment
expense · reserve development · value-based contract settlement · reinsurance recoverables ·
membership-mix margin · premium deficiency.

### COO (~25)
claims auto-adjudication rate · claims turnaround time · claims financial/payment accuracy ·
call-center service level · average speed of answer · first-call resolution · appeals & grievances
volume/TAT · prior-authorization TAT · enrollment accuracy/timeliness · provider-data accuracy ·
network adequacy (time/distance) · ID-card timeliness.

### Chief Medical Officer (payer, ~20)
medical cost trend · admits/1000 · ED visits/1000 · readmits/1000 · bed days/1000 ·
care-management engagement rate · HEDIS gap closure · Star quality measures · pharmacy generic
dispensing rate · specialty drug trend · prior-auth approval rate · avoidable-ED rate ·
high-cost-claimant management.

---

## How many metrics, in practice
A full provider KPI register across roles ≈ **150–200 distinct metrics**; a payer ≈ **100–140**.
Start with each role's top ~10–15 (the board + the role's operating dashboard); deepen over time.
