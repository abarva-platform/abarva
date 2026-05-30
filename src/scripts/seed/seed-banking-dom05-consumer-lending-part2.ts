// seed-banking-dom05-consumer-lending-part2.ts
// Banking genome patterns — Consumer Lending & Digital Origination
// Code range: B1360–B1419  (60 patterns)
// Loaded by: scripts/corpus/load-authored-genome-seeds.ts

type OfficeCategory = 'front_office' | 'middle_office' | 'back_office';

interface PatternSeed {
  code: string;
  name: string;
  officeCategory: OfficeCategory;
  failureRatePct: number;
  description: string;
  keywords: string[];
  demoRelevant?: boolean;
  subTopic?: string;
}

export const BANKING_CONSUMER_LENDING_PART2_PATTERNS: PatternSeed[] = [

  // ── Student Loans ──────────────────────────────────────────────────────────
  {
    code: 'B1360',
    name: 'FFELP Runoff Portfolio SCRA Rate Reduction Not Tracked in Legacy System',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's legacy FFELP (Federal Family Education Loan Program) runoff portfolio
      is serviced on a third-generation mainframe servicing platform that does not have an
      automated interface with the Department of Defense's SCRA eligibility database, requiring
      manual rate reduction processing when student loan borrowers notify the bank of active
      duty military service. The bank's periodic reconciliation audit reveals that 22% of
      FFELP borrowers who entered active duty service in the past 36 months were not receiving
      the 6% SCRA rate cap as required by 50 U.S.C. § 3937, because servicemember status
      changes were not communicated to the legacy servicer. DOJ and CFPB enforcement actions
      against student loan servicers for SCRA non-compliance have resulted in civil money
      penalties and mandatory remediation programs covering all affected loans.`,
    keywords: ['SCRA', 'FFELP', 'student loan servicing', 'CFPB', 'OCC examination'],
    demoRelevant: false,
    subTopic: 'student-loans',
  },
  {
    code: 'B1361',
    name: 'Income-Driven Repayment Recertification Counseling Gap Creates Preventable Default',
    officeCategory: 'front_office',
    failureRatePct: 71,
    description:
      `First Capital's private student loan refinance program services borrowers enrolled in
      income-driven repayment plans who refinanced their federal loans into private loans,
      permanently surrendering IDR eligibility; the bank's servicing platform does not trigger
      any proactive outreach when these borrowers approach the end of their refinance loan
      term without having built the income trajectory needed to support the final balloon
      payment structure. The CFPB's 2023 student loan servicing guidance requires that
      private servicers make reasonable disclosures about repayment options, including the
      permanent forfeiture of federal IDR access that refinancing entails; First Capital's
      disclosures at origination are not reinforced at any mid-servicing counseling touchpoint,
      leading to a 34% higher default rate in the 12 months approaching loan maturity for
      borrowers in this cohort.`,
    keywords: ['CFPB', 'income-driven repayment', 'student loan servicing', 'ability-to-repay', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'student-loans',
  },
  {
    code: 'B1362',
    name: 'CFPB Student Loan Servicing Guidance Triggers Gap in Borrower Billing Statement',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital's student loan servicing billing statement template was designed against
      the 2009 edition of the CFPB's model billing statement guidance and has not been updated
      to reflect the CFPB's 2022 update to its student loan servicing examination procedures,
      which requires that billing statements for private student loans include a plain-language
      description of all available repayment options, a total interest paid year-to-date figure,
      and a disclosure of remaining loan term changes when the borrower has made extra payments.
      The updated CFPB examination procedures for student loan servicers treat billing statement
      deficiencies as a Tier 2 compliance finding; First Capital's non-updated template affects
      all 42,000 active student loan servicing accounts and requires a platform update plus
      retroactive disclosure to borrowers whose billing statements were deficient for 24+ months.`,
    keywords: ['CFPB', 'student loan servicing', 'billing statement', 'consumer compliance', 'Regulation Z'],
    demoRelevant: false,
    subTopic: 'student-loans',
  },
  {
    code: 'B1363',
    name: 'SCRA Active Duty Start Date Incorrect Because Servicer Uses Deployment Orders Not SCRA Date',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital's consumer lending SCRA processing workflow uses the borrower's deployment
      orders effective date rather than the earlier date on which the borrower was ordered
      to report for duty — a distinction that matters under 50 U.S.C. § 3952 for purposes of
      the interest rate cap back-calculation. For the 18% of SCRA cases where the deployment
      orders predate the report-for-duty date by more than 30 days, the bank calculates the
      retroactive interest rate reduction using the later date, underpaying the SCRA interest
      credit by an average of $340 per affected account. The DOJ's 2024 enforcement settlements
      with depository institutions on SCRA calculation errors treat systematic start-date
      undercalculation as a per-borrower SCRA violation requiring individual remediation
      and a compliance program enhancement order.`,
    keywords: ['SCRA', 'consumer lending', 'OCC examination', 'CFPB', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'student-loans',
  },
  {
    code: 'B1364',
    name: 'Student Loan Co-Borrower Release Application Denied Without Adverse Action Notice',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's private student loan co-signer release program allows borrowers who
      have made 48 consecutive on-time payments to apply to release the co-signer from the
      obligation; when applications are denied because the primary borrower's income or credit
      does not meet the standalone qualification threshold, the bank's servicing platform
      does not generate a Regulation B-compliant adverse action notice identifying the
      specific principal reasons for denial. The CFPB's private student loan servicing
      examination manual explicitly identifies co-signer release adverse action notice
      requirements as a Tier 1 examination area; the bank's 2024 internal compliance
      review finds that 100% of co-signer release denial letters are non-compliant because
      they state only "did not meet program requirements" rather than the specific credit
      factors required by ECOA Regulation B.`,
    keywords: ['Reg B', 'ECOA', 'adverse action', 'student loan servicing', 'CFPB examination'],
    demoRelevant: false,
    subTopic: 'student-loans',
  },
  {
    code: 'B1365',
    name: 'Federal Student Loan Borrower Defense Claim Referral Process Not Documented',
    officeCategory: 'back_office',
    failureRatePct: 55,
    description:
      `First Capital's student loan servicing operation does not maintain a documented
      procedure for identifying borrowers who may have Borrower Defense to Repayment
      claims against the schools whose federal loans the bank holds in its FFELP portfolio,
      even though the Department of Education's 2022 Borrower Defense final rule creates
      an affirmative obligation on FFELP holders to cooperate with claim investigations.
      When a regional for-profit school in First Capital's FFELP portfolio is subject to
      a Department of Education Borrower Defense investigation, the bank's inability to
      identify affected borrowers within the required 60-day evidence response window
      triggers a referral to the Department's enforcement division and creates a potential
      FFELP assignment recourse liability for loans the Department declines to honor
      on the basis of borrower defense.`,
    keywords: ['FFELP', 'Borrower Defense', 'student loan servicing', 'CFPB', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'student-loans',
  },
  {
    code: 'B1366',
    name: 'AI Student Loan Repayment Counselor Provides IDR Comparisons Without CFPB Approval',
    officeCategory: 'front_office',
    failureRatePct: 73,
    description:
      `First Capital deploys an AI chatbot on its student loan refinance portal that provides
      personalized comparisons between the borrower's current federal IDR plan and the bank's
      private refinance offer — projecting total cost of each option over 10 and 20 years —
      without the CFPB's required safe harbor disclosures that must accompany personalized
      student loan counseling to prevent misleading cost projections. The CFPB's 2023 guidance
      on student loan refinancing advertising requires that comparisons to federal loan programs
      include specific safe harbor language about loss of income-driven repayment, Public Service
      Loan Forgiveness eligibility, and deferment rights; the AI chatbot's projection tool omits
      all three disclosures and generates comparisons that systematically understate the long-term
      value of federal IDR for borrowers with income volatility, driving refinance conversion
      rates that CFPB examiners could characterize as deceptive solicitation.`,
    keywords: ['AI student loan counselor', 'CFPB', 'income-driven repayment', 'Dodd-Frank Section 1031', 'student loan servicing'],
    demoRelevant: true,
    subTopic: 'student-loans',
  },
  {
    code: 'B1367',
    name: 'Student Loan Servicer Bankruptcy Discharge Misapplied to Non-Dischargeable Loans',
    officeCategory: 'middle_office',
    failureRatePct: 58,
    description:
      `First Capital's student loan collections platform does not distinguish between private
      student loans originated for qualifying educational expenses — which remain non-dischargeable
      in bankruptcy under 11 U.S.C. § 523(a)(8) unless the borrower demonstrates undue hardship —
      and private student loans originated for non-qualifying purposes (living expenses, non-Title IV
      schools) that are dischargeable in a standard Chapter 7 proceeding. When borrowers file
      Chapter 7 bankruptcy, the collections platform automatically attempts to collect on all
      student loan accounts, including dischargeable private student loans, a practice the CFPB
      has characterized as an attempt to collect on a discharged debt in violation of the
      bankruptcy discharge injunction and the FDCPA.`,
    keywords: ['FDCPA', 'CFPB', 'bankruptcy discharge', 'student loan servicing', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'student-loans',
  },
  {
    code: 'B1368',
    name: 'IDR Counseling Gap — Servicer Does Not Disclose Capitalized Interest on Forbearance Exit',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's student loan servicing forbearance exit workflow restores borrowers to
      active repayment status after forbearance without providing a disclosure of the total
      unpaid interest that has capitalized during the forbearance period, or the resulting
      increase in loan principal and total repayment cost. The CFPB's 2022 student loan
      servicing examination procedures require servicers to provide a capitalization disclosure
      at forbearance exit showing the pre-capitalization and post-capitalization principal
      balance, the total interest capitalized, and the estimated monthly payment change;
      the absence of this disclosure for 78% of forbearance exits affects borrowers'
      ability to make informed decisions about whether to enter an income-driven repayment
      plan or remain on the standard repayment schedule after forbearance.`,
    keywords: ['CFPB', 'student loan servicing', 'income-driven repayment', 'forbearance', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'student-loans',
  },
  {
    code: 'B1369',
    name: 'Student Loan FFELP Guaranty Agency Data Reconciliation Produces Overstated Balances',
    officeCategory: 'back_office',
    failureRatePct: 61,
    description:
      `First Capital's FFELP portfolio balance records do not reconcile monthly with the
      corresponding guaranty agency records maintained by the state-based FFELP guarantee agencies,
      because the bank's legacy student loan platform applies certain fee capitalizations —
      collection costs, late fees, default servicing fees — using a fee schedule that predates
      the 2010 FFELP program changes that capped collection cost recovery. The reconciliation
      gap causes the bank's FFELP balance statements to overstate account balances by an average
      of 2.8% for accounts that have been in and out of default, a systematic overstatement
      that constitutes a FDCPA violation when the overstated balance is communicated to the
      borrower in collection communications.`,
    keywords: ['FDCPA', 'FFELP', 'student loan servicing', 'CFPB', 'balance accuracy'],
    demoRelevant: false,
    subTopic: 'student-loans',
  },

  // ── Auto Lending ──────────────────────────────────────────────────────────
  {
    code: 'B1370',
    name: 'Indirect Auto Dealer Reserve Markup Disparate Impact Testing Has 18-Month Lag',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's indirect auto lending program allows dealer reserve markups up to
      200 basis points above the buy rate; while the bank conducts disparate impact testing
      on dealer markup distributions, the testing runs on an 18-month look-back cycle that
      was designed when the bank originated fewer than 8,000 indirect auto loans per year.
      Digital auto lending growth has increased originations to 24,000 per year, meaning
      significant markup disparities can accumulate across 36,000 loan-months before the
      next test cycle detects them. The CFPB's 2013 guidance on dealer markup and the
      DOJ's subsequent enforcement actions require that disparate impact testing be
      conducted frequently enough to detect and remediate emerging patterns — the CFPB's
      examination guidance cites quarterly testing as a reasonable minimum for portfolios
      above 10,000 originations per year.`,
    keywords: ['ECOA', 'dealer markup', 'auto lending', 'disparate impact', 'CFPB examination'],
    demoRelevant: true,
    subTopic: 'auto-lending',
  },
  {
    code: 'B1371',
    name: 'GAP Insurance Disclosure Not Provided at Time of Auto Loan Consummation',
    officeCategory: 'front_office',
    failureRatePct: 67,
    description:
      `First Capital's indirect auto lending program includes Guaranteed Asset Protection
      (GAP) waiver products that dealers add to financed vehicle purchases; the bank's
      dealer agreement requires dealers to provide the required GAP disclosure at the time
      of sale, but First Capital does not verify disclosure delivery before funding the
      dealer contract. The CFPB's examination of add-on products in auto lending requires
      that GAP insurance disclosures — including the cost of the product, how the GAP
      amount is calculated, the term of coverage, and cancellation rights — be provided
      in writing to the borrower before loan consummation. The bank's 2024 file review
      finds that 29% of GAP-enrolled accounts lack a signed GAP disclosure form in the
      funded loan file, a pattern that CFPB examiners characterize as a systematic
      dealer-level UDAP violation for which the bank bears indirect compliance responsibility.`,
    keywords: ['CFPB', 'GAP insurance', 'auto lending', 'UDAP', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'auto-lending',
  },
  {
    code: 'B1372',
    name: 'Repossession Notice Timing Fails UCC Article 9 Pre-Sale Notification Requirements',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's auto loan default and repossession process generates pre-sale
      notification letters to borrowers using a servicing platform batch job that calculates
      the notification date as 10 business days before the scheduled auction date; the
      required notification period under UCC Article 9 Section 9-614 is a minimum of 10
      days before the sale, but the batch job miscounts the minimum notification period
      by treating the auction date itself as day 10 rather than as the day after the 10-day
      period expires. The error causes approximately 8% of pre-sale notifications to be
      sent fewer than 10 days before the auction, a per-se UCC Article 9 violation that
      renders the subsequent sale commercially unreasonable and exposes the bank to
      deficiency judgment challenges from borrowers whose vehicles were sold after
      defective notice.`,
    keywords: ['UCC Article 9', 'repossession', 'auto lending', 'consumer compliance', 'CFPB'],
    demoRelevant: false,
    subTopic: 'auto-lending',
  },
  {
    code: 'B1373',
    name: 'Force-Placed Auto Insurance Disclosure Does Not Meet CFPB Examination Standards',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's auto loan servicing platform generates force-placed collateral protection
      insurance (CPI) when borrower-provided insurance lapses, but the CPI enrollment notice
      sent to borrowers does not include the required disclosure of the CPI premium cost,
      the name of the CPI insurer, the borrower's right to provide evidence of independent
      insurance within 30 days to avoid CPI charges, or the cancellation and refund procedures
      if the borrower subsequently provides proof of insurance. The CFPB's examination guidance
      on force-placed insurance for auto loans, established through its 2020 supervisory
      highlights, requires all four disclosures to appear in the initial CPI notice; the bank's
      notice template includes only the premium cost, creating a threefold disclosure deficiency
      across an estimated 2,100 CPI enrollments per year.`,
    keywords: ['CFPB', 'force-placed insurance', 'auto lending', 'consumer compliance', 'UDAP'],
    demoRelevant: false,
    subTopic: 'auto-lending',
  },
  {
    code: 'B1374',
    name: 'AI Auto Dealer Reserve Markup Model Generates Disparate Impact Without Fair Lending Testing',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital deploys an AI-based dealer pricing recommendation tool that suggests
      buy-rate adjustments and dealer reserve markup ceilings for individual auto loan applications
      based on predicted dealer performance, borrower loyalty score, and regional competitive
      pricing data; the tool's recommendations are followed by dealers in 71% of cases, making
      the AI the effective rate-setting mechanism for a large share of the indirect auto portfolio.
      The tool was deployed without disparate impact testing across protected class proxies,
      and post-deployment HMDA and CRA data analysis reveals that AI-recommended markups for
      Black and Hispanic borrowers are systematically 40–60 basis points higher than for
      similarly qualified white borrowers in the same dealer groups. ECOA and the CFPB's
      2024 AI fair lending guidance require that AI tools used in auto loan pricing be
      validated for disparate impact before deployment, regardless of whether a human
      intermediary (the dealer) executes the final rate.`,
    keywords: ['ECOA', 'AI pricing model', 'dealer markup', 'disparate impact', 'CFPB examination'],
    demoRelevant: true,
    subTopic: 'auto-lending',
  },
  {
    code: 'B1375',
    name: 'Auto Loan Deficiency Balance Collection Commences Before Redemption Period Expires',
    officeCategory: 'middle_office',
    failureRatePct: 62,
    description:
      `First Capital's auto loan default collections platform initiates deficiency balance
      collection calls and letters within 5 days of vehicle auction, while the borrower's
      statutory right of redemption under applicable state law — which ranges from 10 to
      21 days depending on the state — has not yet expired. The FDCPA prohibits collection
      of a debt that is not yet legally owed; attempting to collect an auto deficiency balance
      during the redemption period, when the borrower still has the right to redeem the
      collateral and extinguish the deficiency, constitutes an attempt to collect an amount
      the consumer does not owe in violation of 15 U.S.C. § 1692f(1). The CFPB's Regulation F
      examination guidance treats pre-redemption deficiency collection as a systemic FDCPA
      violation when it is caused by a servicing platform configuration error.`,
    keywords: ['FDCPA', 'CFPB', 'auto lending', 'Regulation F', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'auto-lending',
  },
  {
    code: 'B1376',
    name: 'Dealer Discretionary Pricing Exception Not Monitored Across Affiliated Dealer Groups',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's dealer relationship managers approve rate exception requests from
      individual dealer locations without aggregating exception data across dealer groups
      under common ownership; a dealer group that operates 12 franchises across three
      states receives individually small exceptions at each location, but the aggregate
      exception rate across the group is 38% — more than double the bank's stated 15%
      exception threshold for fair lending monitoring. The CFPB's and DOJ's fair lending
      examination frameworks require disparate impact analysis at the dealer group level
      as well as the individual dealer level, because dealer group ownership structures
      can mask systematic exception patterns that appear within-policy at the dealer
      location level but generate legally significant pricing disparities at the portfolio level.`,
    keywords: ['ECOA', 'dealer markup', 'auto lending', 'CFPB examination', 'fair lending'],
    demoRelevant: false,
    subTopic: 'auto-lending',
  },

  // ── Home Equity ───────────────────────────────────────────────────────────
  {
    code: 'B1377',
    name: 'HELOC Annual Account Review Disclosure Not Sent Within TILA Reg Z Window',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital is required under TILA Regulation Z to send each HELOC borrower an
      annual account review disclosure that includes the current annual percentage rate,
      any changes to the plan terms, the minimum payment required, and the outstanding
      balance at a specified date. The bank's HELOC servicing platform generates the
      annual disclosure batch in December of each year, but production delays caused by
      year-end staffing gaps result in 15% of the HELOC portfolio receiving disclosures
      in January of the following year — outside the 30-day window that Reg Z requires
      for annual statement delivery. CFPB mortgage servicing examination guidance treats
      HELOC annual disclosure timing failures as a Tier 2 compliance deficiency requiring
      remediation for all affected accounts and a workflow control enhancement.`,
    keywords: ['TILA', 'Reg Z', 'HELOC', 'CFPB examination', 'mortgage servicing'],
    demoRelevant: false,
    subTopic: 'home-equity',
  },
  {
    code: 'B1378',
    name: 'HELOC Variable Rate Cap Disclosure Misstates Periodic and Lifetime Cap',
    officeCategory: 'front_office',
    failureRatePct: 69,
    description:
      `First Capital's HELOC application disclosure documents state the periodic rate cap
      as "no more than 2% per adjustment period" and the lifetime rate cap as "no more
      than 18% APR," but the underlying HELOC agreement contains a compound clause that
      increases the periodic cap to 3% during periods when the index rate has declined
      by more than 1% in the prior period — a provision that the plain-language disclosure
      does not reflect. TILA Regulation Z Section 1026.40(d) requires that HELOC variable
      rate cap disclosures accurately describe the periodic and lifetime caps as they
      operate under all contract conditions; the disclosure deficiency creates a material
      discrepancy between what borrowers were told and what the contract provides,
      constituting a per-se Reg Z violation for the 8,400 HELOCs originated since
      the current agreement template was adopted in 2020.`,
    keywords: ['TILA', 'Reg Z', 'HELOC', 'CFPB', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'home-equity',
  },
  {
    code: 'B1379',
    name: 'HELOC Suspension Adverse Action Notice Does Not State Specific Reason for Freeze',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's HELOC servicing platform automatically suspends draw availability
      when property values in a zip code decline by more than 15% according to the bank's
      AVM monitoring model, but the adverse action notice generated by the platform states
      only "significant decline in your home's value" as the reason for suspension — without
      specifying the estimated current value, the LTV threshold triggering suspension, or
      the factual basis for the value determination. TILA Regulation Z Section 1026.40(f)(3)
      requires that HELOC suspension notices clearly describe the specific condition that
      gave rise to the suspension and the steps the borrower can take to have access restored;
      the platform's generic template fails this specificity requirement for 100% of
      AVM-triggered suspensions, and CFPB examination guidance characterizes non-specific
      HELOC adverse action notices as per-se Reg Z violations.`,
    keywords: ['TILA', 'Reg Z', 'HELOC', 'adverse action', 'CFPB examination'],
    demoRelevant: false,
    subTopic: 'home-equity',
  },
  {
    code: 'B1380',
    name: 'Shared Appreciation Mortgage SAM Disclosure Understates Future Appreciation Share',
    officeCategory: 'front_office',
    failureRatePct: 58,
    description:
      `First Capital offers a shared appreciation mortgage product that provides below-market
      interest rates in exchange for the bank sharing in a percentage of future property
      appreciation at sale or refinance; the product disclosure document computes the example
      appreciation share using a 3% annual appreciation assumption without disclosing that
      actual appreciation in the markets where the product is offered has historically
      run at 6–8% annually. TILA Regulation Z and the CFPB's UDAP authority require that
      example calculations in shared appreciation disclosures use reasonable, historically
      grounded assumptions that do not materially understate the borrower's total cost;
      using a below-historical appreciation rate systematically causes borrowers to
      underestimate the future appreciation share cost by 45–60% in present value terms,
      a material misrepresentation under Dodd-Frank Section 1031.`,
    keywords: ['TILA', 'Reg Z', 'CFPB', 'UDAP', 'home equity'],
    demoRelevant: false,
    subTopic: 'home-equity',
  },
  {
    code: 'B1381',
    name: 'HELOC Rate Adjustment Notification Sent Late When Prime Rate Changes Mid-Cycle',
    officeCategory: 'middle_office',
    failureRatePct: 61,
    description:
      `First Capital's HELOC servicing platform generates rate change notices on a monthly
      batch cycle triggered by the first business day of the month, but the bank's HELOC
      agreements specify that the rate adjusts immediately when the Prime Rate changes —
      which may occur mid-month. When the Federal Reserve changes the Federal Funds target
      rate at a mid-month FOMC meeting, the Prime Rate adjustment propagates to HELOC rates
      immediately under the contract terms, but borrowers do not receive notification until
      the next monthly batch cycle — potentially 28 days after the rate change. TILA
      Regulation Z Section 1026.40(d)(11) requires HELOC rate change notices to be sent
      within a reasonable time before the new rate takes effect; post-change notification
      does not satisfy the pre-change notice requirement.`,
    keywords: ['TILA', 'Reg Z', 'HELOC', 'CFPB', 'mortgage servicing'],
    demoRelevant: false,
    subTopic: 'home-equity',
  },
  {
    code: 'B1382',
    name: 'Home Equity Loan Payoff Instructions Do Not Clearly State Prepayment Penalty Terms',
    officeCategory: 'front_office',
    failureRatePct: 55,
    description:
      `First Capital's fixed-rate home equity loan payoff statement template displays the
      payoff amount without separately disclosing the prepayment penalty applicable to
      loans paid off within the first three years, as required by TILA Regulation Z's
      prepayment penalty disclosure rules for home equity loans. Borrowers who receive
      payoff statements and remit the stated balance are subsequently notified of an
      additional prepayment penalty balance due — a post-payoff surprise that generates
      CFPB consumer complaints and constitutes a Reg Z disclosure deficiency when the
      payoff statement is the sole communication provided before the payoff transaction.
      The CFPB's examination guidance requires that payoff statements for products with
      prepayment penalties include the full payoff amount including the applicable
      penalty for each closing date scenario.`,
    keywords: ['TILA', 'Reg Z', 'prepayment penalty', 'CFPB', 'home equity'],
    demoRelevant: false,
    subTopic: 'home-equity',
  },
  {
    code: 'B1383',
    name: 'AVM HELOC Suspension Triggers Fair Lending Disparity in Minority-Majority Census Tracts',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital's HELOC suspension protocol uses an automated valuation model that applies
      uniform value-decline thresholds across all census tracts in the bank's assessment area,
      but the AVM's accuracy for properties in minority-majority census tracts is 340 basis
      points worse than its accuracy in non-minority-majority tracts, causing the AVM to
      trigger suspension events in minority tracts at 2.1 times the rate of equivalent
      suspensions in non-minority tracts for properties with equivalent market conditions.
      The CFPB's ECOA Regulation B and HMDA analysis requirements mandate that HELOC
      suspension decisions based on AVM outputs be monitored for disparate impact across
      demographic groups; the bank has not conducted this analysis despite the OCC's
      2021 joint agency AVM guidance requiring demographic accuracy validation.`,
    keywords: ['ECOA', 'AVM', 'HELOC', 'disparate impact', 'CFPB examination'],
    demoRelevant: true,
    subTopic: 'home-equity',
  },

  // ── Loss Mitigation ───────────────────────────────────────────────────────
  {
    code: 'B1384',
    name: 'RESPA Reg X Loss Mitigation Acknowledgment Letter Not Sent Within 5-Day Requirement',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's mortgage servicing platform generates loss mitigation application
      acknowledgment letters when a servicer representative manually marks the application
      complete in the servicing system, rather than at the time of document receipt;
      the additional time between document receipt and the marking event causes 18% of
      acknowledgment letters to be sent after the 5-business-day window required by
      RESPA Regulation X Section 1024.41(b)(2). The CFPB's mortgage servicing examination
      manual treats loss mitigation acknowledgment timing as a Tier 1 compliance requirement
      because the 5-day window is critical to starting the 30-day evaluation clock that
      gives borrowers RESPA procedural protections against foreclosure; late acknowledgments
      break the statutory timeline and may expose the bank to dual-tracking liability
      if foreclosure activity proceeds while the acknowledgment is pending.`,
    keywords: ['RESPA', 'Regulation X', 'loss mitigation', 'CFPB examination', 'mortgage servicing'],
    demoRelevant: true,
    subTopic: 'loss-mitigation',
  },
  {
    code: 'B1385',
    name: 'Single Point of Contact Assignment Gap During Mortgage Delinquency Intake',
    officeCategory: 'front_office',
    failureRatePct: 76,
    description:
      `First Capital's mortgage servicing operation is required under RESPA Regulation X
      Section 1024.40 to provide a single point of contact (SPOC) to each delinquent borrower
      who contacts the servicer or is potentially eligible for loss mitigation; the bank's
      SPOC assignment workflow assigns a SPOC only after the borrower's account has been 60
      days delinquent, leaving a gap window of 30–59 days delinquency during which borrowers
      who contact the servicer about loss mitigation alternatives are handled by the general
      servicing queue without SPOC assignment. The CFPB's examination position is that SPOC
      assignment obligations are triggered by the borrower's inquiry about loss mitigation
      assistance — not solely by a delinquency milestone — making the bank's 60-day trigger
      non-compliant with the regulation's intent.`,
    keywords: ['RESPA', 'Regulation X', 'SPOC', 'CFPB examination', 'mortgage servicing'],
    demoRelevant: true,
    subTopic: 'loss-mitigation',
  },
  {
    code: 'B1386',
    name: 'Dual-Tracking Prohibition Violated When Foreclosure Referral Precedes LMA Evaluation',
    officeCategory: 'middle_office',
    failureRatePct: 78,
    description:
      `First Capital's mortgage servicing platform allows the loss mitigation and default
      management workflows to run in parallel tracks — the loss mitigation team evaluates
      the loss mitigation application while the default management team continues foreclosure
      preparation activities — and the foreclosure referral to outside counsel can be
      initiated while the loss mitigation evaluation is still pending. RESPA Regulation X
      Section 1024.41(f) prohibits a servicer from making a first notice or filing for
      foreclosure if a complete loss mitigation application is pending evaluation; the
      bank's 2024 internal audit identifies 34 cases in the prior 18 months where
      foreclosure referrals were made before the loss mitigation evaluation was completed,
      creating a pattern of dual-tracking violations that the CFPB treats as one of the
      most serious mortgage servicing compliance deficiencies.`,
    keywords: ['RESPA', 'Regulation X', 'dual-tracking', 'CFPB examination', 'mortgage servicing'],
    demoRelevant: true,
    subTopic: 'loss-mitigation',
  },
  {
    code: 'B1387',
    name: 'Loss Mitigation Waterfall Evaluation Skips Short Sale Before Foreclosure Referral',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's mortgage loss mitigation waterfall evaluation process sequences
      forbearance, repayment plan, and loan modification options but routes borrowers
      directly to foreclosure referral when a loan modification is denied without
      evaluating the short sale and deed-in-lieu alternatives that RESPA Regulation X
      requires to be considered before foreclosure is pursued. Post-audit review of
      completed foreclosure files finds that 41% of referred loans did not receive a
      documented short sale or deed-in-lieu evaluation before foreclosure referral,
      a waterfall sequencing gap that the CFPB's loss mitigation examination procedures
      characterize as a per-se Regulation X violation requiring individual remediation
      and a policy and training intervention.`,
    keywords: ['RESPA', 'Regulation X', 'loss mitigation', 'CFPB', 'foreclosure'],
    demoRelevant: false,
    subTopic: 'loss-mitigation',
  },
  {
    code: 'B1388',
    name: 'Foreclosure Referral Pre-Requisite Checklist Not Documented in Servicing System',
    officeCategory: 'middle_office',
    failureRatePct: 65,
    description:
      `First Capital's default management team maintains a verbal checklist of pre-referral
      conditions — loss mitigation application complete and denied, 120-day delinquency
      period elapsed, SPOC documented, borrower counseling offered, investor approval obtained
      — but the mortgage servicing platform does not require each condition to be electronically
      signed off before the foreclosure referral workflow is enabled. When high-volume delinquency
      periods stress the default management team, referrals are submitted with checklist items
      uncompleted, including CFPB pre-referral counseling notices that are required by
      RESPA Regulation X before a servicer may make the first notice of foreclosure.
      The CFPB's examination framework treats missing pre-referral condition documentation
      as evidence of systemic process failure, not isolated error.`,
    keywords: ['RESPA', 'Regulation X', 'foreclosure', 'CFPB examination', 'mortgage servicing'],
    demoRelevant: true,
    subTopic: 'loss-mitigation',
  },
  {
    code: 'B1389',
    name: 'Trial Modification Period Payment Application Credited to Fees Before Principal',
    officeCategory: 'middle_office',
    failureRatePct: 59,
    description:
      `First Capital's mortgage servicing platform applies trial modification period payments
      to outstanding fee balances before applying to accrued interest and then principal,
      inconsistent with the RESPA Regulation X payment crediting hierarchy that requires
      payments during trial modifications to be applied in the order specified by the trial
      modification agreement — typically interest, then principal, then escrow. The
      misapplication causes borrowers who make all three trial modification payments on
      time to show a smaller principal reduction than the trial agreement projected,
      undermining borrower confidence in the modification program and generating CFPB
      complaints about payment application errors that examiners subsequently confirm
      as a systemic Regulation X payment crediting deficiency.`,
    keywords: ['RESPA', 'Regulation X', 'loss mitigation', 'CFPB examination', 'mortgage servicing'],
    demoRelevant: false,
    subTopic: 'loss-mitigation',
  },
  {
    code: 'B1390',
    name: 'LLM Loss Mitigation Letter Generator Produces Waterfall Offers Without RESPA Compliance Review',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's mortgage servicing operation adopts a large language model tool to
      generate personalized loss mitigation offer letters that describe the specific
      forbearance, repayment, and modification terms available to each borrower based on
      investor guideline parameters; the LLM generates the letters dynamically without
      routing them through the bank's compliance-approved template library, which contains
      the exact language mandated by RESPA Regulation X Section 1024.41(c)(2) for
      describing the evaluation outcome, available options, response deadline, and
      appeal rights. When LLM-generated letters omit the required appeal rights disclosure
      in 12% of denial notices and misstate the 14-day response deadline as 21 days
      in 6% of offer letters, the bank has produced a pattern of RESPA Reg X violations
      at scale that the CFPB's AI supervision initiative is specifically designed to detect.`,
    keywords: ['LLM', 'RESPA', 'Regulation X', 'loss mitigation', 'CFPB examination'],
    demoRelevant: true,
    subTopic: 'loss-mitigation',
  },

  // ── Collections & Debt ────────────────────────────────────────────────────
  {
    code: 'B1391',
    name: 'FDCPA Validation Notice Not Sent Within 5-Day Window After First Contact',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's consumer collections operation uses a first-party collections model
      where the bank's internal collectors contact borrowers directly; the FDCPA requires
      that a validation notice stating the debt amount, the name of the current creditor,
      and the consumer's right to dispute be sent within 5 days of the collector's first
      communication with the borrower. The bank's collections platform initiates the
      validation notice as a batch job triggered by the first completed call dispositioned
      as "contacted borrower," but for calls that go to voicemail — which CFPB Regulation F
      treats as a communication for FDCPA purposes — the platform does not always code
      the voicemail contact as a first communication, delaying the 5-day clock by
      multiple contact attempts and causing 14% of validation notices to be sent outside
      the required window.`,
    keywords: ['FDCPA', 'CFPB', 'Regulation F', 'validation notice', 'consumer collections'],
    demoRelevant: true,
    subTopic: 'collections-debt',
  },
  {
    code: 'B1392',
    name: 'Reg F 7-in-7 Rule Violated for Consumer Loan Accounts in Phone-First Collections Queue',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's consumer loan collections dialing platform is configured to make up to
      10 contact attempts per 7-day period for accounts in the early-stage delinquency queue,
      a setting that predates the CFPB's Regulation F implementation in November 2021 and has
      not been updated to reflect the Regulation F "7-in-7 rule" limiting collectors to no
      more than 7 attempts per 7-consecutive-day period per debt. The platform's call
      frequency does not count voicemail attempts toward the 7-attempt limit, but CFPB's
      Regulation F official commentary clarifies that unanswered calls — including those that
      reach voicemail — count as attempts toward the limit; the bank's attempt counting
      methodology therefore systematically undercounts the actual number of attempts
      and allows contact frequency that violates Regulation F.`,
    keywords: ['FDCPA', 'CFPB', 'Regulation F', 'consumer collections', 'call frequency'],
    demoRelevant: true,
    subTopic: 'collections-debt',
  },
  {
    code: 'B1393',
    name: 'Text and Email Collection Messages Sent Without Opt-Out Mechanism Required by Reg F',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's collections text message and email outreach program sends payment
      reminder and account status messages to delinquent borrowers but does not include
      a clearly disclosed, functioning opt-out mechanism in each communication as required
      by CFPB Regulation F Section 1006.14(h). The bank's collections platform includes
      an opt-out link in the initial text message introduction but does not repeat it in
      subsequent text contacts, and the opt-out mechanism for email uses a two-step
      unsubscribe process that requires borrowers to confirm their email address — a
      barrier that the CFPB's Regulation F guidance indicates is inconsistent with
      the requirement that opt-outs be clear and easy to exercise.`,
    keywords: ['FDCPA', 'Regulation F', 'CFPB', 'opt-out', 'consumer collections'],
    demoRelevant: false,
    subTopic: 'collections-debt',
  },
  {
    code: 'B1394',
    name: 'FCRA Dispute Investigation Fails to Provide Substantive Response Within 30 Days',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's credit reporting dispute process receives consumer disputes from
      the three major credit bureaus via e-Oscar and is required by FCRA Section 623
      to investigate each dispute and report the results to the reporting agency within
      30 days. The bank's dispute investigation workflow routes all disputes to a single
      queue managed by a three-person team that handled 1,800 disputes in 2024; when
      dispute volume spikes after a data conversion error in the bank's loan servicing
      system generates erroneous 30-day late payment codes on 1,200 accounts simultaneously,
      the queue exceeds the team's capacity and 34% of disputes are resolved with a
      generic "verified as reported" response without substantive investigation —
      a per-se FCRA Section 623 violation that the CFPB's supervisory authority over
      furnishers treats as a systemic data accuracy failure.`,
    keywords: ['FCRA', 'CFPB', 'credit reporting', 'dispute investigation', 'consumer compliance'],
    demoRelevant: true,
    subTopic: 'collections-debt',
  },
  {
    code: 'B1395',
    name: 'Medical Debt Exclusion Not Implemented Following CFPB Rule Update',
    officeCategory: 'middle_office',
    failureRatePct: 60,
    description:
      `First Capital's consumer loan underwriting decision engine includes medical debt
      tradelines from credit bureau files in DTI calculations and credit score modeling
      without implementing the CFPB's 2024 final rule requiring the removal of medical
      debt from credit reports used in consumer lending decisions. The bank's LOS vendor
      was contractually required to deploy the medical debt exclusion filter before the
      rule's compliance date, but the filter was deployed only for new applications and
      was not retrofitted to in-process pipeline applications, leaving approximately 400
      pipeline applications evaluated against credit files that still included medical
      debt tradelines after the compliance deadline. The CFPB's rule and supporting
      examination guidance require all consumer lending decisions made on or after the
      effective date to exclude medical debt regardless of pipeline status.`,
    keywords: ['CFPB', 'FCRA', 'medical debt', 'consumer lending', 'credit reporting'],
    demoRelevant: true,
    subTopic: 'collections-debt',
  },
  {
    code: 'B1396',
    name: 'FCRA Maximum Reporting Period for Charged-Off Debt Calculated from Wrong Start Date',
    officeCategory: 'middle_office',
    failureRatePct: 63,
    description:
      `First Capital's credit reporting platform calculates the FCRA 7-year maximum reporting
      period for charged-off consumer loans from the charge-off date rather than from the date
      of first delinquency that preceded the charge-off — the correct start date under FCRA
      Section 605(c). For accounts that were delinquent for 18–24 months before charge-off,
      the bank continues reporting the charged-off status 1–2 years beyond the legally permitted
      reporting window, suppressing affected borrowers' credit scores after their statutory
      reporting period has expired. The CFPB's annual supervisory highlights have consistently
      cited incorrect FCRA reporting period calculations as one of the most common furnisher
      compliance deficiencies, and the bank's 2024 FCRA audit identifies 1,400 accounts
      currently reported beyond the legally permitted window.`,
    keywords: ['FCRA', 'CFPB', 'credit reporting', 'consumer compliance', 'charge-off'],
    demoRelevant: false,
    subTopic: 'collections-debt',
  },
  {
    code: 'B1397',
    name: 'Collections Settlement Offer Generates 1099-C Without Required Tax Disclosure to Borrower',
    officeCategory: 'middle_office',
    failureRatePct: 56,
    description:
      `First Capital's consumer loan settlement program cancels deficiency balances above
      $600 as part of negotiated settlements with charged-off borrowers and issues IRS
      Form 1099-C for the cancelled debt amount; the settlement confirmation letter sent
      to borrowers does not include a plain-language disclosure that the cancelled amount
      may be treated as taxable income, the tax year in which the 1099-C will be issued,
      or information about the insolvency exclusion under IRC Section 108 that may allow
      the borrower to exclude the cancelled debt from income. The CFPB's UDAP supervisory
      authority treats failure to disclose material tax consequences of debt settlement
      as a deceptive practice when the omission causes borrowers to enter settlements
      without understanding the full financial cost.`,
    keywords: ['CFPB', 'UDAP', 'debt settlement', 'FDCPA', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'collections-debt',
  },
  {
    code: 'B1398',
    name: 'FDCPA Time-Barred Debt Collection Continues After State Statute of Limitations Expires',
    officeCategory: 'middle_office',
    failureRatePct: 71,
    description:
      `First Capital's consumer collections platform does not track the applicable state
      statute of limitations for consumer loan deficiency collection, relying instead on
      the bank's internal charge-off policy as a proxy for the limitations period;
      in 11 states where the consumer loan collection limitations period is shorter
      than the bank's 7-year charge-off and collections retention window, the bank's
      collectors continue calling, texting, and sending letters after the statute of
      limitations has expired. CFPB Regulation F explicitly requires collectors to include
      clear disclosures when collecting time-barred debt — and in some states, collection
      of time-barred debt without proper disclosure is treated as a per-se FDCPA violation
      regardless of whether the debt is otherwise owed.`,
    keywords: ['FDCPA', 'CFPB', 'Regulation F', 'time-barred debt', 'consumer collections'],
    demoRelevant: false,
    subTopic: 'collections-debt',
  },

  // ── AI Lending Part 2 ─────────────────────────────────────────────────────
  {
    code: 'B1399',
    name: 'AI Collections Model Generates Contact Strategy Without FDCPA Adverse Action Notice Review',
    officeCategory: 'middle_office',
    failureRatePct: 74,
    description:
      `First Capital deploys an AI collections scoring model that segments delinquent
      consumer accounts into contact strategy tiers — phone-first, email-first, letter-only —
      based on predicted contact propensity and payment probability; the model's tiering
      logic has not been reviewed for FDCPA adverse action notice implications in cases
      where the model's output results in a borrower receiving a materially different
      collection experience than a similarly situated borrower in a different tier.
      CFPB Regulation F and FDCPA Section 809 require that adverse action notices be
      provided when a debt collector's AI model applies criteria that produce
      differentially restrictive collection experiences for protected class groups;
      the bank has not validated the AI model's tier assignments for disparate impact
      or documented the business necessity justification for the tiering variables that
      correlate with demographic characteristics.`,
    keywords: ['AI collection model', 'FDCPA', 'CFPB', 'Regulation F', 'adverse action'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1400',
    name: 'LLM Loss Mitigation Waterfall Letter Omits RESPA Reg X Required Appeal Rights',
    officeCategory: 'middle_office',
    failureRatePct: 69,
    description:
      `First Capital's generative AI tool for mortgage servicing generates loss mitigation
      denial letters using dynamic language that is tailored to the borrower's specific
      financial situation and the specific options evaluated, but the LLM's training data
      does not consistently encode the exact statutory language that RESPA Regulation X
      Section 1024.41(d) requires in all loss mitigation denial notices — specifically,
      the disclosure that the borrower has the right to appeal the denial within 14 days
      and the instructions for how to submit the appeal. Post-generation compliance spot
      checks find that the appeal rights disclosure is present in only 73% of LLM-generated
      denial letters, meaning that 27% of denial letters constitute per-se RESPA Reg X
      violations regardless of whether the substantive evaluation was conducted correctly.`,
    keywords: ['LLM', 'RESPA', 'Regulation X', 'loss mitigation', 'CFPB examination'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1401',
    name: 'ML Auto Dealer Reserve Markup Tool Deployed Without Disparate Impact Monitoring',
    officeCategory: 'middle_office',
    failureRatePct: 77,
    description:
      `First Capital deploys a machine learning tool that recommends dealer reserve markup
      ceilings for indirect auto loan applications by training on historical dealer
      performance, regional competition data, and applicant risk characteristics;
      the tool generates markup recommendations that are adopted without human override
      in 68% of applications. The bank's fair lending compliance team was not involved
      in the tool's development or deployment, and the tool has been live for 14 months
      without a single disparate impact test run against the ML-generated markup recommendations.
      ECOA and CFPB fair lending examination guidance require that ML pricing tools used
      in consumer credit be tested for disparate impact across protected class proxies
      before deployment and at least quarterly thereafter; the bank's OCC examination
      characterizes the absence of disparate impact testing as a fundamental SR 11-7
      model risk management gap for a consumer credit pricing model.`,
    keywords: ['ECOA', 'ML pricing model', 'dealer markup', 'disparate impact', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1402',
    name: 'AI Student Loan Repayment Counselor Deployed Without CFPB Guidance Compliance Review',
    officeCategory: 'front_office',
    failureRatePct: 72,
    description:
      `First Capital deploys an AI-powered student loan repayment counseling tool that uses
      borrower income, loan balance, and employment data to generate personalized repayment
      projections and recommendations — including recommendations to refinance federal loans
      into the bank's private student loan products — without a CFPB compliance review to
      confirm the tool's output satisfies the CFPB's 2023 guidance on personalized student
      loan counseling disclosure requirements. The AI tool's recommendations to refinance
      federal loans are presented as personalized advice without the required disclosure that
      the borrower will permanently lose federal loan benefits including IDR, PSLF eligibility,
      and federal deferment and forbearance rights; the CFPB's UDAP supervisory authority
      treats AI-generated financial product recommendations that omit material adverse
      disclosures as deceptive acts or practices at scale.`,
    keywords: ['AI student loan counselor', 'CFPB', 'UDAP', 'income-driven repayment', 'student loan servicing'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1403',
    name: 'GenAI HELOC Adverse Action Notice Does Not Satisfy Reg B Specificity Requirement',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital adopts a generative AI tool to produce HELOC adverse action notices
      for applications denied due to AVM-based property value concerns, collateral
      shortfalls, or income verification failures; the LLM generates readable denial
      explanations using general language such as "insufficient collateral value for
      the requested credit limit" without identifying the specific valuation model,
      the estimated property value, the LTV threshold, or the income figure that
      failed the qualifying test — all of which ECOA Regulation B Section 202.9
      requires as the specific principal reasons for the adverse action. The CFPB's
      Reg B examination procedures require that adverse action notices provide reasons
      with enough specificity to allow the applicant to understand what they need to
      improve; the GenAI tool's general language fails this specificity standard and
      constitutes a per-se Reg B violation for each affected HELOC denial.`,
    keywords: ['GenAI', 'Reg B', 'ECOA', 'adverse action', 'CFPB examination'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1404',
    name: 'AI Fraud Model Generates False Positive Flags Disproportionately for Foreign-Born Borrowers',
    officeCategory: 'middle_office',
    failureRatePct: 68,
    description:
      `First Capital's AI fraud pre-screening model for consumer loans uses features including
      the number of addresses reported in the last 24 months, the length of time at the
      current employer, and the number of phone numbers associated with the applicant's
      identity — features that are systematically different for recent immigrants who have
      moved frequently, changed employers, and switched phone numbers upon arrival in the
      United States. The model's fraud flag rate for applicants with foreign-associated
      name patterns is 2.7 times higher than for domestically associated name patterns
      at equivalent FICO and DTI levels, a disparity that the CFPB's 2024 AI fair lending
      examination guidance identifies as a potential ECOA national origin discrimination
      violation when the fraud model's false positive rate creates a materially different
      credit access experience for foreign-born applicants.`,
    keywords: ['AI fraud model', 'ECOA', 'CFPB examination', 'disparate impact', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1405',
    name: 'ML Income Estimation Model Produces Systematic Errors for Gig Economy Earners',
    officeCategory: 'middle_office',
    failureRatePct: 75,
    description:
      `First Capital's machine learning income estimation model, used to accelerate personal
      loan origination without requiring income documentation for applications below $25,000,
      was trained primarily on W-2 salaried employees and generates systematically understated
      income estimates for gig economy workers whose income is characterized by high monthly
      variability and deposit patterns inconsistent with regular payroll cycles. The model
      underestimates qualifying income for gig economy applicants by an average of 28%,
      causing approval rates for this demographic to be 40% lower than for W-2 employees
      with equivalent annual income — a pattern the CFPB's ability-to-repay examination
      framework and SR 11-7 model validation guidance require be detected through
      subpopulation performance testing before deployment.`,
    keywords: ['ML income model', 'SR 11-7', 'CFPB', 'ability-to-repay', 'consumer lending'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1406',
    name: 'AI Mortgage Pipeline Prioritization Model Deprioritizes Applications From Minority Borrowers',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital deploys an AI model to prioritize loan officer attention across the
      in-process mortgage pipeline by predicting which applications are most likely to
      close quickly and generate fee income; the model ranks applications by predicted
      close probability and routes high-ranked applications to senior loan officers with
      better approval authority. Post-implementation HMDA analysis reveals that applications
      from Black and Hispanic borrowers receive systematically lower prioritization scores —
      driven by geographic, credit tier, and loan product correlates — and are assigned
      to less experienced loan officers 43% more often than white applicants with equivalent
      financial profiles. The ECOA and CFPB's examination framework treat AI pipeline
      management tools that produce systematically different service quality outcomes
      across protected class groups as disparate treatment at the point of service delivery.`,
    keywords: ['ECOA', 'AI mortgage model', 'HMDA', 'disparate impact', 'CFPB examination'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1407',
    name: 'GenAI Collections Script Generator Produces State-Inconsistent FDCPA Disclosures',
    officeCategory: 'middle_office',
    failureRatePct: 67,
    description:
      `First Capital's generative AI tool for producing collections call scripts and letter
      templates generates FDCPA mini-Miranda disclosures and validation notice language based
      on federal FDCPA standards without implementing state-specific overlays for the 12 states
      where First Capital operates that have enacted state debt collection laws with requirements
      that exceed federal FDCPA minimums. California's Rosenthal Act, New York's DCPA, and
      Colorado's FDCPA extension each require additional disclosures, shorter response windows,
      or more restrictive contact hour limitations that the GenAI tool does not incorporate,
      creating collections scripts that are FDCPA-compliant at the federal level but
      non-compliant with state law in three of First Capital's highest-volume
      collections markets.`,
    keywords: ['FDCPA', 'CFPB', 'Regulation F', 'GenAI collections', 'consumer compliance'],
    demoRelevant: false,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1408',
    name: 'AI Credit Line Increase Model Extends Offers Without Reassessing Ability-to-Repay',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital's AI-driven credit line increase program for personal credit accounts
      uses a gradient-boost model that scores existing customers for automatic credit line
      increase eligibility based on payment history, bureau data, and behavioral banking
      data; the model generates unsolicited credit line increase offers without reassessing
      the customer's current income, employment status, or total existing debt obligations
      as required by the CFPB's ability-to-repay expectations for open-end credit line
      increases above a material threshold. When interest rates increased sharply in
      2022–2023 and customer debt service ratios worsened, the bank's AI model continued
      generating credit line increase offers for customers whose actual debt capacity had
      deteriorated significantly from the model's last full income assessment — a model
      drift pattern that SR 11-7 monitoring should have detected but did not because
      the model's income features were not refreshed.`,
    keywords: ['AI credit line model', 'SR 11-7', 'CFPB', 'ability-to-repay', 'consumer lending'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1409',
    name: 'AI Delinquency Prediction Model Not Validated for Reg B Adverse Action Trigger Risk',
    officeCategory: 'middle_office',
    failureRatePct: 64,
    description:
      `First Capital deploys an AI delinquency prediction model that assigns risk scores
      to consumer loan accounts monthly and triggers account management actions — credit
      line reduction, enhanced monitoring, early collections contact — when scores exceed
      a threshold; the model was validated under SR 11-7 for statistical performance but
      was not reviewed under ECOA Regulation B adverse action standards for the credit
      line reduction trigger, which constitutes an adverse action requiring notice under
      Reg B regardless of whether the reduction is framed as a proactive risk management
      decision. The bank's Reg B adverse action notice process is not connected to the
      AI model's credit line reduction output workflow, meaning that approximately 1,400
      borrowers per year receive credit line reductions without receiving a Reg B adverse
      action notice as required by ECOA.`,
    keywords: ['Reg B', 'ECOA', 'AI delinquency model', 'adverse action', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1410',
    name: 'LLM Servicing Bot Provides Debt Validation Information Without Required FDCPA Language',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      `First Capital's LLM-based digital servicing chatbot responds to borrower inquiries
      about account balances, payment history, and charge-off status on consumer loan
      accounts that have been transferred to the bank's internal collections department,
      generating AI responses that provide debt amount and creditor information but do
      not include the full FDCPA validation notice language required by 15 U.S.C. § 1692g
      — specifically, the 30-day dispute window, the verification right, and the consumer's
      right to request the name and address of the original creditor. The CFPB's Regulation F
      treats any communication from a debt collector that discloses debt information and
      fails to include required validation notice language as a per-se FDCPA violation,
      and the chatbot's AI responses constitute communications for FDCPA purposes.`,
    keywords: ['LLM', 'FDCPA', 'CFPB', 'Regulation F', 'validation notice'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1411',
    name: 'AI Underwriting Explainability Tool Uses Post-Hoc SHAP Without Reg B Adverse Factor Alignment',
    officeCategory: 'middle_office',
    failureRatePct: 76,
    description:
      `First Capital's consumer lending AI explainability framework generates Reg B adverse
      action reason codes using SHAP values computed on a surrogate linear model rather than
      the production XGBoost model, and the surrogate model's top feature importances diverge
      from the production model's feature importances for 30% of adverse actions — particularly
      for thin-file and near-prime applicants where the XGBoost model places higher weight
      on behavioral features that the surrogate model does not adequately capture. The CFPB's
      2022 circular on AI adverse action explanations and the FRB's SR 11-7 guidance both
      require that adverse action explanations produced by AI models reflect the actual
      reasons for the decision with sufficient specificity to satisfy Reg B's principal-reason
      requirement; using a systematically inaccurate surrogate explanation tool creates
      per-se Reg B violations at scale.`,
    keywords: ['Reg B', 'ECOA', 'AI underwriting model', 'adverse action', 'CFPB examination'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1412',
    name: 'AI Chatbot Provides HAMP-Era Modification Terms That No Longer Apply',
    officeCategory: 'front_office',
    failureRatePct: 61,
    description:
      `First Capital's LLM-powered mortgage servicing chatbot was trained on a corpus that
      includes pre-2021 mortgage servicing guidance and program documentation from the
      Home Affordable Modification Program (HAMP), which expired in December 2016;
      when borrowers ask about available mortgage modification programs, the chatbot
      sometimes describes HAMP eligibility criteria and modification terms that no longer
      exist, directing borrowers to apply for programs that cannot be offered. The CFPB's
      RESPA Regulation X requirements for loss mitigation counseling impose an affirmative
      obligation on servicers to provide accurate information about available programs;
      providing stale AI-generated guidance about expired programs as if they were current
      constitutes a material misrepresentation under Dodd-Frank Section 1031 UDAP
      standards when borrowers delay or forgo eligible current-program applications
      in reliance on the chatbot's inaccurate description.`,
    keywords: ['LLM', 'RESPA', 'Regulation X', 'CFPB', 'mortgage servicing'],
    demoRelevant: false,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1413',
    name: 'AI Pre-Approval Model Overrides Human Underwriter Judgment Without SR 11-7 Governance',
    officeCategory: 'middle_office',
    failureRatePct: 72,
    description:
      `First Capital's digital mortgage pre-approval workflow deploys an AI model that
      can automatically upgrade a human underwriter's conditional approval to a full
      pre-approval when the AI model's confidence score exceeds 90%, without requiring
      the underwriter to explicitly review and accept the override; the AI model's upgrade
      authority was approved by the digital product team without an SR 11-7 model risk
      management review or an assessment of the model's override accuracy at the tails of
      the confidence distribution. When the OCC examines First Capital's mortgage origination
      model governance, the AI override capability is identified as a material model risk
      management deficiency because it deploys a model in a consequential consumer credit
      decision role without the required independent validation, ongoing monitoring, or
      human review controls mandated by SR 11-7 for consumer credit models.`,
    keywords: ['SR 11-7', 'AI mortgage model', 'OCC examination', 'CFPB', 'model governance'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1414',
    name: 'GenAI HELOC Adverse Action Notice Cites AVM Decline Without Reg B Required Detail',
    officeCategory: 'middle_office',
    failureRatePct: 66,
    description:
      `First Capital's generative AI adverse action tool produces HELOC denial notices for
      applications declined on the basis of AVM-derived property value declines, citing
      "decrease in the value of your property" as the adverse action reason without
      providing the estimated current value, the previous value used at application,
      the LTV ratio threshold triggering denial, or the source of the valuation —
      all of which ECOA Regulation B requires for collateral-based adverse actions.
      The CFPB's fair lending examination guidance specifically identifies AVM-based
      adverse action notices as a high-risk area because the AVM's accuracy in
      minority-majority census tracts is lower than in other areas, meaning that
      non-specific adverse action notices for AVM-triggered HELOC denials may also
      be masking fair lending concerns that are only detectable when the specific
      valuation figures and methodology are disclosed.`,
    keywords: ['GenAI', 'Reg B', 'ECOA', 'HELOC', 'CFPB examination'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1415',
    name: 'AI Document Classification Model Misclassifies Foreign Income Documents at High Rate',
    officeCategory: 'middle_office',
    failureRatePct: 70,
    description:
      `First Capital deploys an AI document classification and data extraction model to
      automate income documentation review in the mortgage underwriting workflow; the
      model was trained on a corpus of domestic W-2 forms, pay stubs, and tax returns
      and achieves 97% accuracy on domestic income documents but classifies foreign
      income documents — including pay stubs from foreign employers, foreign tax
      authority income statements, and translated income verification letters — as
      unreadable or low-confidence with an accuracy rate below 50%. The systematic
      failure to process foreign income documentation causes mortgage applications
      from borrowers with foreign income sources to be routed to a manual review
      queue with 15-business-day average processing times, versus 2-day processing
      for domestic income documents — a service timing disparity that ECOA and
      HMDA fair lending analysis treats as potential national origin discrimination
      in the application processing experience.`,
    keywords: ['AI document model', 'ECOA', 'CFPB examination', 'mortgage underwriting', 'SR 11-7'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1416',
    name: 'AI Servicing Sentiment Model Routes Non-English Borrower Calls to Lower-Tier Service Queue',
    officeCategory: 'front_office',
    failureRatePct: 68,
    description:
      `First Capital's AI-powered call center routing model uses voice sentiment and language
      detection to prioritize high-distress borrower calls for routing to senior servicing
      specialists; the model's language detection component routes non-English calls to
      a general servicing queue rather than a language-specialized team because the model
      was not trained to distinguish high-distress non-English calls from standard-priority
      non-English calls. Non-English speaking borrowers experiencing severe financial distress
      — including those calling about imminent foreclosure — receive systematically longer
      wait times and less experienced servicers than English-speaking borrowers with equivalent
      distress indicators, a service quality disparity the CFPB's language access guidance
      and ECOA national origin standards treat as potentially discriminatory in the delivery
      of loss mitigation assistance.`,
    keywords: ['AI call routing', 'ECOA', 'CFPB', 'language access', 'mortgage servicing'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1417',
    name: 'AI Credit Policy Change Impact Model Not Validated Before Production Policy Deployment',
    officeCategory: 'middle_office',
    failureRatePct: 73,
    description:
      `First Capital's credit risk analytics team uses an AI simulation model to predict the
      volume, approval rate, and risk impact of proposed credit policy changes before the
      policies are deployed to the production underwriting system; the simulation model has
      not undergone SR 11-7 model validation, and its predictions of disparate impact across
      demographic groups have not been validated against actual outcomes from historical
      policy changes. When the simulation model underpredicts the disparate impact of a
      DTI tightening policy on Hispanic borrowers by 60%, the bank deploys the policy based
      on the simulation output, and the actual disparate impact is not detected until the
      next annual HMDA fair lending analysis six months later. The CFPB's examination
      framework requires that AI simulation models used for consequential credit policy
      decisions be validated under SR 11-7 standards, including demographic impact validation.`,
    keywords: ['SR 11-7', 'AI policy model', 'ECOA', 'CFPB examination', 'fair lending'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1418',
    name: 'GenAI Pre-Qualification Bot Stores Conversational PII Without GLB Safeguards Rule Compliance',
    officeCategory: 'front_office',
    failureRatePct: 65,
    description:
      `First Capital's generative AI pre-qualification chatbot collects income, employment,
      property address, and loan purpose information from prospective borrowers during
      pre-qualification conversations and stores the full conversation log — including
      PII fields — in the AI platform vendor's cloud environment under a data retention
      policy that was not reviewed against the Gramm-Leach-Bliley Act Safeguards Rule's
      requirements for access controls, encryption, and third-party service provider
      oversight. The GLB Safeguards Rule requires that customer financial information
      stored with third-party service providers be covered by a written agreement requiring
      the provider to implement appropriate safeguards; the AI platform's data processing
      agreement does not meet the specific GLB Safeguards Rule requirements for service
      provider oversight, creating a data governance gap that the OCC's information
      security examination framework and CFPB's supervisory authority over data security
      are jointly structured to detect.`,
    keywords: ['Gramm-Leach-Bliley Act', 'Safeguards Rule', 'GenAI pre-qualification', 'CFPB', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
  {
    code: 'B1419',
    name: 'CFPB AI Examination Readiness Gap — Consumer Lending AI Vendor Contracts Lack Model Audit Rights',
    officeCategory: 'back_office',
    failureRatePct: 78,
    description:
      `First Capital has deployed six AI and ML tools across its consumer lending and servicing
      operations — income verification, fraud pre-screening, credit decisioning, pricing,
      delinquency prediction, and collections scoring — but the vendor contracts for four of
      these tools do not grant the bank the right to audit the vendor's model training data,
      model cards, fairness testing results, or change notification procedures as required
      by the CFPB's AI supervision framework and the OCC's TPRM guidance for third-party AI
      models used in consumer credit decisions. When the CFPB initiates an AI-focused
      examination, First Capital cannot produce model cards, training data demographic
      composition analysis, or pre-deployment fairness test results for the four
      unauditable vendor models, and the absence of contractual audit rights prevents
      the bank from obtaining this information retroactively — a TPRM and SR 11-7
      governance failure that the OCC's consent order scope explicitly covers.`,
    keywords: ['CFPB examination', 'SR 11-7', 'TPRM', 'AI vendor contracts', 'OCC examination'],
    demoRelevant: true,
    subTopic: 'ai-lending-p2',
  },
];
