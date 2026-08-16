#!/usr/bin/env node

/**
 * Renders a procurement-grade contract packet from structured contract facts.
 *
 * The existing synthetic contract documents are 126-156 words each — one template with the
 * vendor name swapped. A procurement reader spots that immediately, and the uniformity is
 * itself the tell: a real amendment is short and a real master agreement is not.
 *
 * The fix is not longer prose. Longer synthetic prose is more convincing to a casual reader
 * and equally false to a procurement lead, and it is more dangerous because it invites
 * belief. What makes a packet read as real is that it is internally consistent and that its
 * numbers reconcile to something.
 *
 * So the documents are a RENDERING of the contract facts, never an independent narrative:
 *
 *   contract register + pricing + SLA + invoice evidence
 *        -> packet (MSA, order, SOW, pricing, SLA, BAA, amendment, invoice evidence)
 *        -> clause extraction
 *        -> reconciliation proof against the same facts
 *
 * If a figure appears in a document, it was read from a row. Nothing is authored here that
 * cannot be traced back, which is what makes the extraction demo honest rather than
 * circular.
 *
 * Every document carries a synthetic-demo header. Supplier legal entities are invented; no
 * negotiated term is attributed to a real company.
 *
 * Usage:
 *   node scripts/data/contract-packet/generate-contract-packet.mjs \
 *     --in datasets/source/contract-intelligence/_staging-fixture \
 *     --out /tmp/packets [--contract CTR-H-001]
 */

import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

const ROOT = process.cwd();
const args = { in: '', out: '', contract: '' };
for (let i = 2; i < process.argv.length; i += 1) {
  const k = process.argv[i];
  if (k === '--in') { args.in = process.argv[i + 1]; i += 1; }
  else if (k === '--out') { args.out = process.argv[i + 1]; i += 1; }
  else if (k === '--contract') { args.contract = process.argv[i + 1]; i += 1; }
}
if (!args.in || !args.out) {
  console.error('--in <fixture dir> and --out <dir> are required');
  process.exit(1);
}

const WATERMARK =
  '> **SYNTHETIC DEMO DOCUMENT — NOT A REAL AGREEMENT — NOT LEGAL ADVICE**\n' +
  '> Generated from structured contract facts for product demonstration. Supplier legal entities are\n' +
  '> invented. No term here reflects any actual company, negotiation, or executed contract.';

const read = (f) => {
  const p = path.resolve(ROOT, args.in, f);
  if (!fs.existsSync(p)) return [];
  return Papa.parse(fs.readFileSync(p, 'utf8').trim(), { header: true, skipEmptyLines: true }).data;
};

const register = read('contract_register.csv');
const pricing = read('contract_pricing_schedule.csv');
const slas = read('contract_sla_terms.csv');
const invoices = read('contract_invoice_lines.csv');
const rates = read('contract_rate_card.csv');

const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const plain = (n) => Number(n || 0).toLocaleString('en-US');
const addMonths = (iso, m) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + Number(m));
  return d.toISOString().slice(0, 10);
};
const minusDays = (iso, days) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - Number(days));
  return d.toISOString().slice(0, 10);
};

function docHeader(c, title, docId, refs) {
  return [
    `# ${title}`,
    '',
    WATERMARK,
    '',
    `| | |`,
    `| --- | --- |`,
    `| Document ID | \`${docId}\` |`,
    `| Contract ID | \`${c.contract_id}\` |`,
    `| Supplier | ${c.supplier_legal_entity} ("${c.supplier_short_name}") |`,
    `| Customer | ${c.buyer_legal_entity} ("${c.buyer_short_name}") |`,
    `| Effective Date | ${c.effective_date} |`,
    `| Governing Law | State of ${c.governing_law} |`,
    ...(refs?.length ? [`| Incorporates | ${refs.map((r) => `\`${r}\``).join(', ')} |`] : []),
    '',
  ].join('\n');
}

/** Execution block. Names are left as placeholders — a synthetic document should not carry
 *  anything that looks like a real person's signature. */
function signatureBlock(c) {
  return [
    '## Signatures',
    '',
    `| ${c.buyer_legal_entity} | ${c.supplier_legal_entity} |`,
    '| --- | --- |',
    '| Signature: ______________________ | Signature: ______________________ |',
    '| Name: [SYNTHETIC] | Name: [SYNTHETIC] |',
    `| Title: ${c.owner_role} | Title: Authorised Signatory |`,
    `| Date: ${c.effective_date} | Date: ${c.effective_date} |`,
    '',
  ].join('\n');
}

// ---------------------------------------------------------------- MSA
function msa(c) {
  const id = `${c.contract_id}-MSA`;
  const end = addMonths(c.effective_date, c.initial_term_months);
  const cap = Number(c.annual_value_usd) * Number(c.liability_cap_multiple);
  return [
    docHeader(c, `Master Services Agreement — ${c.contract_name}`, id),
    `This Master Services Agreement (this "**Agreement**") is entered into as of ${c.effective_date} (the "**Effective Date**")`,
    `by and between ${c.buyer_legal_entity} ("**${c.buyer_short_name}**") and ${c.supplier_legal_entity} ("**${c.supplier_short_name}**").`,
    `${c.buyer_short_name} maintains offices at ${c.notice_address}.`,
    '',
    '## Recitals',
    '',
    `A. ${c.buyer_short_name} operates an integrated delivery network and requires ${c.category.replace(/_/g, ' ')} capabilities.`,
    `B. ${c.supplier_short_name} provides such capabilities and wishes to supply them under the terms below.`,
    `C. The parties intend that individual purchases be made under Order Forms and Statements of Work that incorporate this Agreement.`,
    '',
    '## 1. Definitions',
    '',
    '1.1 "**Order Form**" means an ordering document executed by the parties that references this Agreement.',
    '1.2 "**SOW**" means a statement of work describing professional services.',
    '1.3 "**Services**" means the services identified in an Order Form or SOW.',
    '1.4 "**Fees**" means the amounts payable as set out in the Pricing Exhibit.',
    '1.5 "**Confidential Information**" means non-public information disclosed by either party.',
    c.handles_phi === 'yes'
      ? '1.6 "**PHI**" means protected health information as defined at 45 C.F.R. § 160.103.'
      : '1.6 "**Customer Data**" means data supplied by or on behalf of ' + c.buyer_short_name + '.',
    '',
    '## 2. Structure of the Agreement',
    '',
    '2.1 This Agreement states terms of general application. It does not itself commit either party to purchase or supply.',
    '2.2 Each Order Form and SOW incorporates this Agreement by reference and is governed by it.',
    '2.3 In the event of conflict, the order of precedence is: (a) this Agreement; (b) the applicable Order Form; (c) the applicable SOW; (d) any exhibit.',
    '',
    '## 3. Services',
    '',
    `3.1 ${c.supplier_short_name} shall provide the Services in accordance with the applicable Order Form, SOW and the Service Level Schedule.`,
    '3.2 Changes to scope are effected only through the change control procedure at Section 3.4.',
    `3.3 ${c.supplier_short_name} shall assign personnel with skills appropriate to the Services.`,
    '3.4 Neither party is obliged to accept a change; an unaccepted change leaves the existing scope in force.',
    `3.5 ${c.supplier_short_name} shall not subcontract any material part of the Services without ${c.buyer_short_name}'s prior written consent, shall impose on each subcontractor obligations no less protective than this Agreement, and remains fully liable for the acts and omissions of its subcontractors.`,
    '',
    '## 4. Fees and Payment',
    '',
    `4.1 Fees are set out in the Pricing Exhibit (\`${c.contract_id}-PRICING\`). Annual contract value at the Effective Date is **${money(c.annual_value_usd)}** (${c.currency}).`,
    `4.2 ${c.buyer_short_name} shall pay undisputed invoices within **${c.payment_terms_days} days** of receipt.`,
    '4.3 Disputed amounts may be withheld pending resolution, provided the dispute is raised before the due date.',
    `4.4 Fee increases at renewal shall not exceed the price cap stated in the Pricing Exhibit.`,
    '4.5 Fees are exclusive of applicable sales and use taxes.',
    '',
    '## 5. Term and Termination',
    '',
    `5.1 This Agreement commences on the Effective Date and continues for **${c.initial_term_months} months**, expiring on ${end} (the "**Initial Term**").`,
    `5.2 The Initial Term renews for successive twelve (12) month periods unless either party gives written notice of non-renewal at least **${c.renewal_notice_days} days** before expiry. The current notice deadline is **${minusDays(end, c.renewal_notice_days)}**.`,
    '5.3 Either party may terminate for material breach not cured within thirty (30) days of written notice.',
    `5.4 ${c.buyer_short_name} may terminate for convenience on ninety (90) days written notice, subject to payment for Services performed.`,
    '',
    '## 6. Confidentiality',
    '',
    '6.1 Each party shall protect the other\'s Confidential Information using no less than reasonable care.',
    '6.2 Obligations survive for five (5) years after expiry, and indefinitely for trade secrets.',
    '',
    '## 7. Intellectual Property',
    '',
    `7.1 ${c.supplier_short_name} retains all right, title and interest in its pre-existing materials.`,
    `7.2 ${c.buyer_short_name} retains all right, title and interest in Customer Data.`,
    `7.3 ${c.supplier_short_name} grants ${c.buyer_short_name} a non-exclusive licence to use deliverables for internal business purposes.`,
    '',
    '## 8. Data Protection and Security',
    '',
    `8.1 ${c.supplier_short_name} shall maintain an information security programme aligned to recognised industry standards.`,
    c.handles_phi === 'yes'
      ? `8.2 The parties shall execute the Business Associate Agreement at \`${c.contract_id}-BAA\`, which governs all PHI. In the event of conflict regarding PHI, the Business Associate Agreement controls.`
      : `8.2 The parties shall execute the Data Protection Exhibit at \`${c.contract_id}-BAA\`, which governs Customer Data.`,
    '8.3 Security incidents affecting Customer Data shall be notified without undue delay and in any event within seventy-two (72) hours of confirmation.',
    '',
    '## 9. Warranties',
    '',
    '9.1 Each party warrants it has authority to enter into this Agreement.',
    `9.2 ${c.supplier_short_name} warrants the Services will be performed in a professional and workmanlike manner.`,
    '9.3 Except as stated, all implied warranties are disclaimed to the extent permitted by law.',
    '',
    '## 10. Indemnification',
    '',
    `10.1 ${c.supplier_short_name} shall indemnify ${c.buyer_short_name} against third-party claims that the Services infringe intellectual property rights.`,
    '10.2 The indemnified party shall give prompt notice and reasonable cooperation.',
    '',
    '## 11. Limitation of Liability',
    '',
    `11.1 Except for the Excluded Claims at Section 11.3, each party's aggregate liability shall not exceed **${money(cap)}**, being ${c.liability_cap_multiple} times the annual contract value.`,
    '11.2 Neither party is liable for indirect or consequential loss.',
    '11.3 "**Excluded Claims**" means breach of confidentiality, indemnification obligations, and, where applicable, breach of the Business Associate Agreement. The liability cap at Section 11.1 shall not apply to Excluded Claims, to a party\'s fraud or wilful misconduct, or to amounts payable under an Order Form.',
    '',
    '## 12. Insurance',
    '',
    `12.1 ${c.supplier_short_name} shall maintain commercial general liability and cyber liability cover of not less than **${money(c.insurance_required_usd)}** per occurrence.`,
    '12.2 Certificates shall be provided on request and on renewal.',
    '',
    '## 13. Compliance and Audit',
    '',
    '13.1 Each party shall comply with laws applicable to its performance.',
    `13.2 ${c.buyer_short_name} may audit ${c.supplier_short_name}'s compliance not more than once per twelve (12) months on thirty (30) days notice.`,
    '13.3 Records shall be retained for the term plus three (3) years.',
    '',
    '## 14. Transition Assistance',
    '',
    `14.1 On expiry or termination, ${c.supplier_short_name} shall provide transition assistance for up to one hundred eighty (180) days at the rates in the Pricing Exhibit.`,
    '14.2 Customer Data shall be returned in a documented, machine-readable format and thereafter deleted.',
    '',
    '## 15. Notices',
    '',
    `15.1 Notices to ${c.buyer_short_name} shall be sent to ${c.notice_address}, attention ${c.owner_role}.`,
    '15.2 Notices are effective on receipt when delivered by hand or courier.',
    '',
    '## 16. General',
    '',
    '16.1 Neither party may assign without the other\'s consent, not to be unreasonably withheld.',
    '16.2 **Force majeure.** Neither party is liable for failure or delay caused by events beyond its reasonable control, provided it notifies the other promptly and resumes performance as soon as practicable.',
    `16.3 This Agreement is governed by the laws of the State of ${c.governing_law}, excluding its conflict of laws rules.`,
    '16.4 If a provision is held unenforceable, the remainder continues in force.',
    '16.5 This Agreement, together with its Order Forms, SOWs and exhibits, is the entire agreement between the parties.',
    '',
    signatureBlock(c),
  ].join('\n');
}

// ---------------------------------------------------------------- Order Form
function orderForm(c, lines) {
  const id = `${c.contract_id}-ORDER`;
  const end = addMonths(c.effective_date, c.initial_term_months);
  const total = lines.reduce((s, l) => s + Number(l.annual_line_total_usd || 0), 0);
  const cap = lines[0]?.price_cap_percent ?? '3';
  return [
    docHeader(c, `Order Form — ${c.contract_name}`, id, [`${c.contract_id}-MSA`, `${c.contract_id}-PRICING`]),
    `This Order Form is entered into under and incorporates the Master Services Agreement \`${c.contract_id}-MSA\``,
    `dated ${c.effective_date} (the "**Agreement**"). Capitalised terms have the meanings given in Section 1 of the Agreement.`,
    '',
    '## 1. Ordered Items',
    '',
    '| Line | SKU | Description | Unit | Quantity | Unit Price | Annual Total |',
    '| ---: | --- | --- | --- | ---: | ---: | ---: |',
    ...lines.map((l) =>
      `| ${l.line_no} | \`${l.sku}\` | ${l.description} | ${l.unit} | ${plain(l.quantity)} | ${money(l.unit_price_usd)} | ${money(l.annual_line_total_usd)} |`),
    `| | | | | | **Total Annual Value** | **${money(total)}** |`,
    '',
    '## 2. Subscription Term',
    '',
    `2.1 The subscription term begins ${c.effective_date} and ends ${end} (the "**Initial Term**").`,
    `2.2 The quantities and entitlements in Section 1 are licensed for the Initial Term.`,
    `2.3 Renewal is governed by Section 5.2 of the Agreement. Either party may decline renewal by written notice given at least **${c.renewal_notice_days} days** prior to expiry; the current deadline is **${minusDays(end, c.renewal_notice_days)}**.`,
    `2.4 Any increase in fees at renewal is capped at **${cap}%** over the preceding term, per Section 2.2 of the Pricing Exhibit.`,
    '',
    '## 3. Billing',
    '',
    `3.1 Billing frequency is annual in advance.`,
    `3.2 Payment terms are **net ${c.payment_terms_days} days**, per Section 4.2 of the Agreement.`,
    `3.3 Purchase orders referencing this Order Form shall be honoured as administrative instruments only and do not vary the Agreement.`,
    '',
    '## 4. Incorporated Documents',
    '',
    `4.1 Pricing Exhibit \`${c.contract_id}-PRICING\`.`,
    `4.2 Service Level Schedule \`${c.contract_id}-SLA\`.`,
    `4.3 ${c.handles_phi === 'yes' ? 'Business Associate Agreement' : 'Data Protection Exhibit'} \`${c.contract_id}-BAA\`.`,
    '4.4 In the event of conflict between this Order Form and the Agreement, the Agreement controls except as to commercial terms stated here.',
    '',
    signatureBlock(c),
  ].join('\n');
}

// ---------------------------------------------------------------- SOW
function sow(c, lines) {
  const id = `${c.contract_id}-SOW`;
  return [
    docHeader(c, `Statement of Work — ${c.contract_name}`, id, [`${c.contract_id}-MSA`, `${c.contract_id}-ORDER`]),
    `This Statement of Work is issued under the Master Services Agreement \`${c.contract_id}-MSA\` and relates to`,
    `Order Form \`${c.contract_id}-ORDER\`.`,
    '',
    '## 1. Objectives',
    '',
    `1.1 Implement and operationalise the ${c.category.replace(/_/g, ' ')} scope described in the Order Form.`,
    `1.2 Achieve production readiness with ${c.buyer_short_name} acceptance under Section 5.`,
    '',
    '## 2. Scope',
    '',
    `2.1 **In scope.** Configuration, integration, data migration, testing and cutover of the ${c.category.replace(/_/g, ' ')} scope ordered under \`${c.contract_id}-ORDER\`, together with knowledge transfer to ${c.buyer_short_name} operations staff.`,
    '2.2 **Out of scope.** The following are expressly excluded and, if required, shall be added by change order under Section 7: remediation of source systems not listed in the Order Form; custom development beyond configuration; end-user training beyond the train-the-trainer sessions in Section 3; historical data conversion beyond twenty-four (24) months; and any work at a site not named in this Statement of Work.',
    '2.3 Any activity not expressly stated as in scope is out of scope.',
    '',
    '## 3. Deliverables and Milestones',
    '',
    '| # | Deliverable | Format | Target | Acceptance Criteria |',
    '| ---: | --- | --- | --- | --- |',
    `| 1 | Solution design and integration plan | Written document, PDF | ${addMonths(c.effective_date, 2)} | Design addresses every interface listed in the Order Form; written approval by the Acceptance Authority |`,
    `| 2 | Non-production environment configured | Working environment plus written test report | ${addMonths(c.effective_date, 4)} | Functional test pass rate ≥ 95% with no open severity-1 defect |`,
    `| 3 | Production cutover | Working production service plus signed checklist | ${addMonths(c.effective_date, 8)} | Go-live checklist signed; no open Sev 1; rollback plan demonstrated |`,
    `| 4 | Post-go-live stabilisation and handover | Runbook and operations handover pack | ${addMonths(c.effective_date, 11)} | Two consecutive months meeting the Service Level Schedule; runbook accepted by operations |`,
    '',
    '## 4. Roles and Responsibilities',
    '',
    `4.1 ${c.supplier_short_name} is responsible for providing an engagement lead, a solution architect and implementation consultants, and for the delivery of each deliverable in Section 3.`,
    `4.2 ${c.buyer_short_name} is responsible for providing a business owner, a technical counterpart, testing resources, and timely decisions on escalated items.`,
    `4.3 The **Acceptance Authority** for this Statement of Work is the ${c.owner_role}, or a designee named in writing. No other person may accept a deliverable.`,
    '4.4 Each party shall name its responsible individuals in writing within ten (10) business days of the Effective Date.',
    '',
    '## 5. Acceptance',
    '',
    `5.1 ${c.buyer_short_name} shall accept or reject each deliverable within ten (10) business days of submission, acting through the Acceptance Authority named at Section 4.3.`,
    '5.2 Acceptance shall not be unreasonably withheld where the deliverable meets the acceptance criteria stated in Section 3.',
    '5.3 A rejection shall state the deficiency in writing by reference to the acceptance criteria. Non-conforming deliverables shall be corrected within ten (10) business days and re-enter the acceptance cycle.',
    '5.4 If a deliverable fails acceptance three (3) times, the parties shall escalate under Section 7.3, and the customer may cancel the affected deliverable and receive a refund of fees paid for it.',
    '5.5 Deliverables not rejected within the review period are deemed accepted.',
    '',
    '## 6. Assumptions, Dependencies and Constraints',
    '',
    `6.1 **Assumption.** ${c.buyer_short_name} shall provide timely access to environments, data and subject matter experts.`,
    '6.2 **Assumption.** Source system data is available in the formats documented during design.',
    '6.3 **Dependency.** Milestone dates depend on environment availability; delays attributable to the customer may adjust dates through change control.',
    '6.4 **Constraint.** Work shall be performed remotely except where on-site presence is required for cutover.',
    '',
    '## 7. Change Control',
    '',
    '7.1 Changes to deliverables, milestones or fees require a written change order signed by both parties, priced at the rates in the Pricing Exhibit.',
    '7.2 Work outside this Statement of Work shall not be performed, and shall not be invoiced, without an executed change order.',
    '7.3 Disputes regarding scope or acceptance escalate to the engagement lead and the Acceptance Authority within five (5) business days, and thereafter under Section 3.4 of the Agreement.',
    '',
    '## 8. Fees',
    '',
    '8.1 Charges for this Statement of Work are the professional services rates stated in the Pricing Exhibit.',
    '8.2 Fees are invoiced on acceptance of each deliverable, not on elapsed time.',
    '',
  ].join('\n');
}

// ---------------------------------------------------------------- Pricing Exhibit
function pricingExhibit(c, lines, rates) {
  const id = `${c.contract_id}-PRICING`;
  const total = lines.reduce((s, l) => s + Number(l.annual_line_total_usd || 0), 0);
  const cap = lines[0]?.price_cap_percent ?? '0';
  return [
    docHeader(c, `Pricing Exhibit — ${c.contract_name}`, id, [`${c.contract_id}-MSA`]),
    `This Pricing Exhibit is incorporated into the Master Services Agreement \`${c.contract_id}-MSA\` at Section 4.1 of the Agreement.`,
    '',
    '## 1. Rate Table',
    '',
    '| Line | SKU | Description | Unit | Quantity | Unit Price | Annual Line Total |',
    '| ---: | --- | --- | --- | ---: | ---: | ---: |',
    ...lines.map((l) =>
      `| ${l.line_no} | \`${l.sku}\` | ${l.description} | ${l.unit} | ${plain(l.quantity)} | ${money(l.unit_price_usd)} | ${money(l.annual_line_total_usd)} |`),
    `| | | | | | **Total Annual Value** | **${money(total)}** |`,
    '',
    '## 2. Price Protection',
    '',
    `2.1 Unit prices are firm and fixed for the Initial Term. No increase may be applied during the Initial Term for any reason.`,
    `2.2 At renewal, any increase in unit price is capped at, and shall not exceed, **${cap}%** over the preceding term.`,
    '2.3 The cap at Section 2.2 applies to each renewal separately and is not cumulative or compounding beyond the stated percentage.',
    '2.4 Volume reductions of up to ten percent (10%) at renewal shall not trigger a unit price increase.',
    '',
    '## 3. True-Up and True-Down',
    '',
    '3.1 Quantities are measured annually in arrears.',
    '3.2 **True-up.** Consumption above the ordered quantity is invoiced at the stated unit price, without uplift, on the next annual invoice.',
    '3.3 **True-down.** At each renewal the customer may reduce ordered quantities by up to ten percent (10%) without penalty and without unit price increase. Reductions beyond that threshold are subject to re-pricing by agreement.',
    '3.4 Consumption below the ordered quantity does not create a mid-term credit unless expressly stated in an Order Form.',
    '',
    '## 4. Taxes and Currency',
    '',
    `4.1 All amounts are stated in ${c.currency}.`,
    '4.2 Prices are exclusive of sales, use and similar taxes, which are the customer\'s responsibility where lawfully imposed.',
    '4.3 Each party bears its own income taxes.',
    '',
    '## 5. Invoicing',
    '',
    '5.1 Subscription fees are invoiced annually in advance.',
    '5.2 True-up amounts are invoiced in arrears following the annual measurement.',
    '',
    '## 6. Professional Services and Transition Rates',
    '',
    '| Role | Rate | Unit |',
    '| --- | ---: | --- |',
    ...rates.map((r) => `| ${r.role} | ${money(r.rate_usd)} | ${r.unit} |`),
    '',
    '6.1 Professional services under a Statement of Work are charged at the rates above.',
    `6.2 Rates are held for the ${rates[0]?.rate_hold_scope ?? 'initial term'}.`,
    '6.3 Transition assistance under Section 14.1 of the Agreement is charged at the same rates.',
    '',
  ].join('\n');
}

// ---------------------------------------------------------------- SLA
function slaSchedule(c, rows) {
  const id = `${c.contract_id}-SLA`;
  const avail = rows[0]?.monthly_availability_percent ?? '99.5';
  const capPct = rows[0]?.credit_cap_percent ?? '20';
  return [
    docHeader(c, `Service Level Schedule — ${c.contract_name}`, id, [`${c.contract_id}-MSA`]),
    `This Service Level Schedule is incorporated into the Master Services Agreement \`${c.contract_id}-MSA\` at Section 3.1 of the Agreement.`,
    '',
    '## 1. Scope',
    '',
    `1.1 This Schedule applies to the covered services ordered under \`${c.contract_id}-ORDER\`, in the production environment only.`,
    '1.2 Non-production environments are provided on a commercially reasonable basis and carry no service level.',
    '',
    '## 2. Availability',
    '',
    `2.1 ${c.supplier_short_name} shall maintain monthly availability of at least **${avail}%**.`,
    '2.2 "**Downtime**" means any full minute during which the covered service is unavailable to all authorised users, as measured by the supplier\'s monitoring at one-minute intervals from at least two independent external probes. Partial degradation that does not prevent use is not Downtime.',
    '2.3 Availability is calculated as (total minutes in the month less Downtime minutes, excluding minutes excused under Section 5) divided by total minutes in the month, expressed as a percentage to two decimal places.',
    '2.4 Scheduled maintenance notified at least five (5) business days in advance, up to eight (8) hours per month, is excluded from the calculation.',
    '',
    '## 3. Severity Levels and Targets',
    '',
    'Response is the time to acknowledge and assign the incident. Restore is the time to return the service to use, whether by fix or by workaround. The two are measured separately.',
    '',
    '| Severity | Description | Response Target | Restore Target | Service Credit |',
    '| --- | --- | --- | --- | ---: |',
    ...rows.map((r) =>
      `| **${r.severity}** | ${r.description} | ${r.response_target} | ${r.restore_target} | ${r.service_credit_percent}% |`),
    '',
    '## 4. Service Credits',
    '',
    '4.1 Credits are calculated against the monthly proportion of the annual fee for the affected service, by availability band:',
    '',
    '| Monthly availability achieved | Credit |',
    '| --- | ---: |',
    `| At or above ${avail}% | 0% |`,
    `| Below ${avail}% but at or above ${(Number(avail) - 0.5).toFixed(2)}% | 5% |`,
    `| Below ${(Number(avail) - 0.5).toFixed(2)}% but at or above ${(Number(avail) - 1.5).toFixed(2)}% | 10% |`,
    `| Below ${(Number(avail) - 1.5).toFixed(2)}% | 25% |`,
    '',
    `4.2 Aggregate credits in any contract year shall not exceed **${capPct}%** of annual fees.`,
    '4.3 To claim a credit the customer shall submit a written request within **thirty (30) days** of the end of the month in which the failure occurred, identifying the incident and the availability calculation relied on. Credits are applied against the next invoice.',
    `4.4 ${c.supplier_short_name} shall respond to a credit claim within fifteen (15) business days. An unanswered claim is deemed accepted.`,
    '4.5 Credits are the sole financial remedy for missed service levels, without prejudice to termination rights for material breach.',
    '',
    '## 5. Exclusions',
    '',
    '5.1 Service levels do not apply to failures caused by: customer environments, equipment or connectivity; third-party networks outside the supplier\'s control; scheduled maintenance under Section 2.4; customer misuse or unauthorised modification; or force majeure under Section 16.2 of the Agreement.',
    '5.2 The supplier bears the burden of demonstrating that an exclusion applies.',
    '',
    '## 6. Escalation',
    '',
    '| Elapsed time without restoration | Escalates to |',
    '| --- | --- |',
    '| 1 hour (Sev 1) | Supplier duty manager and customer service owner |',
    '| 4 hours (Sev 1) | Supplier director of operations |',
    `| 8 hours (Sev 1) | Supplier executive sponsor and ${c.owner_role} |`,
    '',
    '6.1 The customer may invoke escalation at any time by written notice to the supplier service manager.',
    '6.2 Escalation does not suspend the restoration obligation or the accrual of credits.',
    '',
    '## 7. Reporting and Review',
    '',
    `7.1 ${c.supplier_short_name} shall provide a monthly service report within ten (10) business days of month end.`,
    '7.2 Reports shall state availability achieved, the calculation under Section 2.3, incidents by severity, and credits due.',
    '7.3 The parties shall review service level performance quarterly.',
    '',
    '## 8. Chronic Failure',
    '',
    `8.1 Failure to meet the availability target in any three (3) consecutive months, or in any four (4) months in a rolling twelve (12) month period, is a material breach entitling ${c.buyer_short_name} to terminate the affected service without penalty on thirty (30) days written notice.`,
    '',
  ].join('\n');
}

// ---------------------------------------------------------------- BAA / DPA
function baa(c) {
  const id = `${c.contract_id}-BAA`;
  const phi = c.handles_phi === 'yes';
  return [
    docHeader(c, phi ? `Business Associate Agreement — ${c.contract_name}` : `Data Protection Exhibit — ${c.contract_name}`, id, [`${c.contract_id}-MSA`]),
    phi
      ? `This Business Associate Agreement is incorporated into the Master Services Agreement \`${c.contract_id}-MSA\` at Section 8.2 of the Agreement. ${c.buyer_short_name} is a Covered Entity and ${c.supplier_short_name} is a Business Associate as those terms are used in the HIPAA Rules.`
      : `This Data Protection Exhibit is incorporated into the Master Services Agreement \`${c.contract_id}-MSA\` at Section 8.2 of the Agreement.`,
    '',
    '## 1. Definitions',
    '',
    phi
      ? '1.1 Capitalised terms used but not defined in this Business Associate Agreement shall have the same meaning as those terms are given in the HIPAA Rules at 45 C.F.R. Parts 160 and 164, including "Breach", "Business Associate", "Covered Entity", "Protected Health Information", "Required By Law", "Secretary", "Security Incident", "Subcontractor" and "Unsecured Protected Health Information".'
      : '1.1 Capitalised terms used but not defined here have the meaning given in the Agreement.',
    phi
      ? '1.2 "**HIPAA Rules**" means the Privacy, Security, Breach Notification and Enforcement Rules at 45 C.F.R. Parts 160 and 164.'
      : '1.2 "**Customer Data**" has the meaning given in the Agreement.',
    '',
    '## 2. Permitted Uses and Disclosures',
    '',
    phi
      ? `2.1 The Business Associate may use or disclose PHI only as necessary to perform the Services described in the Agreement, as Required By Law, or as otherwise permitted by this Business Associate Agreement.`
      : `2.1 ${c.supplier_short_name} may process Customer Data only on documented instructions from ${c.buyer_short_name}.`,
    phi
      ? '2.2 The Business Associate may use PHI for its proper management and administration, and to carry out its legal responsibilities. Disclosure for those purposes is permitted only where Required By Law, or where the recipient agrees in writing to hold the information confidentially and to notify the Business Associate of any breach of confidentiality.'
      : '2.2 Processing for the supplier\'s own purposes is not permitted.',
    phi
      ? '2.3 The Business Associate shall not use or further disclose PHI other than as permitted or required by this Business Associate Agreement or as Required By Law.'
      : '2.3 The supplier shall not use or further disclose Customer Data other than as permitted by this Exhibit.',
    phi
      ? '2.4 The Business Associate shall request, use and disclose only the minimum necessary PHI to accomplish the purpose of the request, consistent with 45 C.F.R. § 164.502(b).'
      : '2.4 The supplier shall limit processing to what is necessary for the purpose.',
    '2.5 Use for the supplier\'s own commercial purposes, including model training, is not permitted without prior written authorisation.',
    '',
    '## 3. Safeguards',
    '',
    phi
      ? '3.1 The Business Associate shall use appropriate safeguards, and comply with Subpart C of 45 C.F.R. Part 164 with respect to electronic PHI, to prevent use or disclosure of PHI other than as provided for by this Business Associate Agreement.'
      : '3.1 The supplier shall implement appropriate technical and organisational safeguards to protect Customer Data.',
    '3.2 Access shall be limited to personnel with a need to know, subject to confidentiality obligations.',
    '3.3 Data shall be encrypted in transit and at rest using industry-standard algorithms.',
    '',
    '## 4. Subcontractors',
    '',
    phi
      ? '4.1 In accordance with 45 C.F.R. §§ 164.502(e)(1)(ii) and 164.308(b)(2), the Business Associate shall ensure that any Subcontractor that creates, receives, maintains or transmits PHI on its behalf agrees in writing to the same restrictions, conditions and requirements that apply to the Business Associate.'
      : `4.1 ${c.supplier_short_name} shall not engage a subcontractor with access to Customer Data without imposing obligations no less protective than these.`,
    `4.2 ${c.supplier_short_name} remains liable for the acts and omissions of its subcontractors.`,
    '',
    '## 5. Reporting of Improper Use, Security Incidents and Breaches',
    '',
    phi
      ? '5.1 The Business Associate shall report to the Covered Entity any use or disclosure of PHI not provided for by this Business Associate Agreement of which it becomes aware, including any Breach of Unsecured PHI as required at 45 C.F.R. § 164.410, and any Security Incident of which it becomes aware.'
      : '5.1 The supplier shall notify the customer of any personal data breach without undue delay.',
    phi
      ? '5.2 Reports of a Breach shall be made without unreasonable delay and in no case later than sixty (60) calendar days after discovery, and shall include the identification of each individual whose Unsecured PHI has been, or is reasonably believed to have been, accessed, acquired, used or disclosed.'
      : '5.2 Notification shall be made within seventy-two (72) hours of confirmation.',
    '5.3 Notification shall include the nature of the incident, the categories and approximate number of records affected, and the remediation taken or proposed.',
    '5.4 Unsuccessful attempts at unauthorised access that do not result in access — such as routine port scans and failed log-on attempts — are reported in aggregate in the periodic security report rather than individually.',
    '',
    '## 6. Individual Rights',
    '',
    phi
      ? '6.1 **Access.** The Business Associate shall make PHI in a Designated Record Set available to the Covered Entity, or as directed to an individual, as necessary to satisfy the Covered Entity\'s obligations under 45 C.F.R. § 164.524, within fifteen (15) business days of request.'
      : '6.1 The supplier shall assist the customer in responding to data subject access requests.',
    phi
      ? '6.2 **Amendment.** The Business Associate shall make PHI in a Designated Record Set available for amendment, and incorporate any amendment, as necessary to satisfy the Covered Entity\'s obligations under 45 C.F.R. § 164.526.'
      : '6.2 The supplier shall assist with correction requests.',
    phi
      ? '6.3 **Accounting of disclosures.** The Business Associate shall maintain and make available the information required to provide an accounting of disclosures as necessary to satisfy the Covered Entity\'s obligations under 45 C.F.R. § 164.528.'
      : '6.3 The supplier shall maintain records of processing.',
    '',
    '## 7. Obligations of the Covered Entity Carried Out by the Business Associate',
    '',
    phi
      ? '7.1 To the extent the Business Associate is to carry out one or more of the Covered Entity\'s obligations under Subpart E of 45 C.F.R. Part 164, the Business Associate shall comply with the requirements of Subpart E that apply to the Covered Entity in the performance of those obligations.'
      : '7.1 Where the supplier performs an obligation of the customer, it shall comply with the requirements applicable to the customer.',
    phi
      ? '7.2 The Covered Entity shall notify the Business Associate of any limitation in its notice of privacy practices, of any change in or revocation of an individual\'s permission to use or disclose PHI, and of any restriction agreed under 45 C.F.R. § 164.522, to the extent that any of these affects the Business Associate\'s permitted use or disclosure.'
      : '7.2 The customer shall notify the supplier of any restriction affecting permitted processing.',
    '',
    '## 8. Availability to the Secretary',
    '',
    phi
      ? '8.1 The Business Associate shall make its internal practices, books and records relating to the use and disclosure of PHI received from, or created or received on behalf of, the Covered Entity available to the Secretary of the U.S. Department of Health and Human Services for purposes of determining compliance with the HIPAA Rules.'
      : `8.1 ${c.supplier_short_name} shall make its policies, books and records available to ${c.buyer_short_name} and, where required, to regulators.`,
    '8.2 Audit rights under Section 13.2 of the Agreement apply to this Exhibit.',
    '',
    '## 9. Term and Termination',
    '',
    `9.1 This ${phi ? 'Business Associate Agreement' : 'Exhibit'} takes effect on ${c.effective_date} and continues until all ${phi ? 'PHI' : 'Customer Data'} is returned or destroyed under Section 10.`,
    phi
      ? `9.2 The Covered Entity may terminate this Business Associate Agreement and the Agreement if it determines that the Business Associate has violated a material term of this Business Associate Agreement and the Business Associate has not cured the breach within thirty (30) days of written notice, or immediately where cure is not possible.`
      : `9.2 ${c.buyer_short_name} may terminate for material breach of this Exhibit not cured within thirty (30) days of written notice.`,
    '',
    '## 10. Return or Destruction',
    '',
    `10.1 On termination, ${c.supplier_short_name} shall return or destroy all ${phi ? 'PHI' : 'Customer Data'} it still maintains in any form, and shall retain no copies, in accordance with Section 14.2 of the Agreement.`,
    '10.2 Where return or destruction is infeasible, the supplier shall extend the protections of this Exhibit to the retained data and limit further use and disclosure to the purposes that make return or destruction infeasible, for so long as the data is retained.',
    '',
    '## 11. Miscellaneous',
    '',
    phi
      ? '11.1 This Business Associate Agreement shall be interpreted so as to permit the parties to comply with the HIPAA Rules. Any ambiguity shall be resolved in favour of a meaning that permits compliance.'
      : '11.1 This Exhibit shall be interpreted to permit compliance with applicable data protection law.',
    '11.2 In the event of conflict between this Exhibit and the Agreement as to the data it governs, this Exhibit controls.',
    '',
    signatureBlock(c),
  ].join('\n');
}

// ---------------------------------------------------------------- Amendment / renewal notice
function amendment(c, lines) {
  const id = `${c.contract_id}-AMEND-001`;
  const end = addMonths(c.effective_date, c.initial_term_months);
  const cap = Number(lines[0]?.price_cap_percent ?? 3);
  const uplift = Number(c.annual_value_usd) * (1 + cap / 100);
  return [
    docHeader(c, `Amendment No. 1 and Renewal Notice — ${c.contract_name}`, id, [`${c.contract_id}-MSA`, `${c.contract_id}-ORDER`, `${c.contract_id}-PRICING`]),
    `This Amendment No. 1 (this "**Amendment**") is made effective as of ${minusDays(end, c.renewal_notice_days)} and amends the`,
    `Master Services Agreement \`${c.contract_id}-MSA\` dated ${c.effective_date} (the "**Agreement**").`,
    '',
    '## Recitals',
    '',
    'WHEREAS the parties entered into the Agreement on the date stated above;',
    'WHEREAS the Initial Term is approaching expiry and the parties wish to renew on amended commercial terms;',
    'NOW THEREFORE, in consideration of the mutual covenants below, the parties agree as follows.',
    '',
    '## 1. Renewal',
    '',
    `1.1 The parties confirm the Initial Term expires on ${end}.`,
    `1.2 Written notice of non-renewal is due by **${minusDays(end, c.renewal_notice_days)}**, being ${c.renewal_notice_days} days before expiry as required by Section 5.2 of the Agreement.`,
    `1.3 Absent such notice, the Agreement renews for a further twelve (12) months.`,
    '',
    '## 2. Amended Pricing',
    '',
    `2.1 The annual contract value stated at Section 4.1 of the Agreement is hereby deleted in its entirety and replaced with **${money(uplift)}** for the renewal term, being an increase of ${cap}% and the maximum permitted under Section 2.2 of the Pricing Exhibit.`,
    '2.2 For the avoidance of doubt, the price cap in the Pricing Exhibit continues to apply at each subsequent renewal and is not cumulative.',
    '',
    '## 3. Amended Terms',
    '',
    `3.1 In Section 4.2 of the Agreement, the words "net ${c.payment_terms_days} days" are deleted in its entirety and replaced with "net ${Number(c.payment_terms_days) + 15} days".`,
    '3.2 Section 13.2 of the Agreement is amended by adding the following sentence at the end: "Following any Sev 1 incident, the customer may conduct one additional audit in the same twelve (12) month period."',
    '',
    '## 4. Effect of this Amendment',
    '',
    '4.1 Except as expressly amended by this Amendment, all terms and conditions of the Agreement remain in full force and effect and are hereby ratified and confirmed.',
    '4.2 Where this Amendment conflicts or is inconsistent with the Agreement, this Amendment shall control.',
    '4.3 Where this Amendment conflicts with an Order Form executed before its effective date, this Amendment controls.',
    '4.4 This Amendment may be executed in counterparts, each of which is an original and all of which together form one instrument.',
    '',
    signatureBlock(c),
  ].join('\n');
}

// ---------------------------------------------------------------- Invoice / usage evidence
function invoiceEvidence(c, lines, invLines) {
  const id = `${c.contract_id}-INVOICE-EVIDENCE`;
  const invTotal = invLines.reduce((s, l) => s + Number(l.line_amount_usd || 0), 0);
  const contracted = lines.reduce((s, l) => s + Number(l.annual_line_total_usd || 0), 0);
  const variance = invTotal - contracted;
  const po = invLines[0]?.po_number ?? '';
  const invId = invLines[0]?.invoice_id ?? '';
  return [
    docHeader(c, `Invoice and Usage Evidence — ${c.contract_name}`, id, [`${c.contract_id}-ORDER`, `${c.contract_id}-PRICING`]),
    `This packet evidences amounts invoiced under Order Form \`${c.contract_id}-ORDER\` and their reconciliation`,
    `to the Pricing Exhibit \`${c.contract_id}-PRICING\`.`,
    '',
    '## 1. Invoice Detail',
    '',
    `| Field | Value |`,
    `| --- | --- |`,
    `| Invoice number | \`${invId}\` |`,
    `| Invoice date | ${invLines[0]?.invoice_date ?? ''} |`,
    `| Service period | ${c.effective_date} through ${addMonths(c.effective_date, 12)} |`,
    `| Purchase order | \`${po}\` |`,
    `| Supplier | ${c.supplier_legal_entity} |`,
    '',
    '| SKU | Quantity | Unit Price | Line Amount |',
    '| --- | ---: | ---: | ---: |',
    ...invLines.map((l) => `| \`${l.sku}\` | ${plain(l.quantity)} | ${money(l.unit_price_usd)} | ${money(l.line_amount_usd)} |`),
    `| | | **Invoice Total** | **${money(invTotal)}** |`,
    '',
    '## 2. Contract-to-Invoice Reconciliation',
    '',
    '| Measure | Amount |',
    '| --- | ---: |',
    `| Contracted annual value (Pricing Exhibit) | ${money(contracted)} |`,
    `| Invoiced to date | ${money(invTotal)} |`,
    `| Variance | ${money(variance)} |`,
    '',
    variance === 0
      ? '2.1 Invoiced amounts agree to the Pricing Exhibit line for line. No variance requires explanation.'
      : `2.1 A variance of ${money(variance)} exists and requires explanation before payment approval under Section 4.2 of the Agreement.`,
    '',
    '## 3. Entitlement and Usage',
    '',
    '| SKU | Entitled | Invoiced | Status |',
    '| --- | ---: | ---: | --- |',
    ...lines.map((l) => {
      const inv = invLines.find((i) => i.sku === l.sku);
      const q = Number(inv?.quantity ?? 0);
      const e = Number(l.quantity ?? 0);
      return `| \`${l.sku}\` | ${plain(e)} | ${plain(q)} | ${q === e ? 'within entitlement' : q > e ? 'overage — true-up applies' : 'under-consumed'} |`;
    }),
    '',
    '## 4. Approval Trail',
    '',
    `4.1 Purchase order \`${po}\` was raised against Order Form \`${c.contract_id}-ORDER\`.`,
    `4.2 Invoice approval is delegated to ${c.owner_role} under the customer's delegation of authority.`,
    `4.3 Payment is due and remittable within ${c.payment_terms_days} days of receipt per Section 4.2 of the Agreement.`,
    '4.4 Any dispute as to an invoiced amount shall be raised in writing before the due date, per Section 4.3 of the Agreement. Undisputed amounts remain payable.',
    '',
  ].join('\n');
}

// ---------------------------------------------------------------- main
const outDir = path.resolve(ROOT, args.out);
fs.mkdirSync(outDir, { recursive: true });
let written = 0;
const summary = [];

for (const c of register) {
  if (args.contract && c.contract_id !== args.contract) continue;
  const lines = pricing.filter((p) => p.contract_id === c.contract_id)
    .sort((a, b) => Number(a.line_no) - Number(b.line_no));
  const slaRows = slas.filter((s) => s.contract_id === c.contract_id);
  const invLines = invoices.filter((i) => i.contract_id === c.contract_id);
  const rateRows = rates.filter((r) => r.contract_id === c.contract_id);

  const dir = path.join(outDir, c.contract_id);
  fs.mkdirSync(dir, { recursive: true });

  const docs = {
    [`${c.contract_id}-MSA.md`]: msa(c),
    [`${c.contract_id}-ORDER.md`]: orderForm(c, lines),
    [`${c.contract_id}-SOW.md`]: sow(c, lines),
    [`${c.contract_id}-PRICING.md`]: pricingExhibit(c, lines, rateRows),
    [`${c.contract_id}-SLA.md`]: slaSchedule(c, slaRows),
    [`${c.contract_id}-BAA.md`]: baa(c),
    [`${c.contract_id}-AMEND-001.md`]: amendment(c, lines),
    [`${c.contract_id}-INVOICE-EVIDENCE.md`]: invoiceEvidence(c, lines, invLines),
  };
  for (const [name, body] of Object.entries(docs)) {
    fs.writeFileSync(path.join(dir, name), `${body}\n`);
    written += 1;
    summary.push({ contract: c.contract_id, doc: name, words: body.split(/\s+/).filter(Boolean).length });
  }
}

console.log(`packets written: ${new Set(summary.map((s) => s.contract)).size} contract(s), ${written} documents -> ${args.out}`);
const byDoc = {};
const docCounts = {};
for (const s of summary) {
  const docType = s.doc.replace(`${s.contract}-`, '');
  byDoc[docType] = (byDoc[docType] ?? 0) + s.words;
  docCounts[docType] = (docCounts[docType] ?? 0) + 1;
}
for (const [d, w] of Object.entries(byDoc)) console.log(`   ${d.padEnd(24)} ${Math.round(w / docCounts[d])} words avg`);
