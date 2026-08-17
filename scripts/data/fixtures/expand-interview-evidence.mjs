#!/usr/bin/env node
/**
 * Build a real IT executive interview record.
 *
 * What existed: eight rows per tenant carrying **two distinct findings between them**. Every
 * corroboration check returned `corroborated_multi_source`, which is not a strong result — it is a
 * field with nothing to discriminate. A hundred per cent corroboration says the same thing as zero:
 * the column measures nothing.
 *
 * More fundamentally, eight rows is not an interview record. It is a handful of quotes. An IT
 * executive interview should give a genuine read on current state, the challenges as that leader sees
 * them, the projects they own, and — the part that is hardest to get any other way — their view of
 * what matters most and why. That takes **twenty to twenty-five questions per leader**, across a
 * dozen or more leaders.
 *
 * So this generates a structured interview corpus:
 *
 *   a question bank across ten tracks — current state, challenges, portfolio, priorities,
 *   organisation, sourcing, data and AI, risk, ways of working, value
 *
 *   one interview per leader drawn from the tenant's own org sheet, weighted so a CIO is asked
 *   different questions from a VP of Infrastructure
 *
 *   answers grounded in that tenant's actual applications, functions, vendors and programmes, so
 *   nothing an executive "says" contradicts what was catalogued
 *
 * Corroboration then falls out of genuine agreement — several leaders independently raising the same
 * theme — rather than being asserted. Disagreement is preserved on purpose: two executives with
 * opposite views on the same question is the most useful row in the set, and a corpus where everyone
 * agrees has been smoothed until it says nothing.
 *
 * Usage:
 *   node scripts/data/fixtures/expand-interview-evidence.mjs [--write]
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const WRITE = process.argv.includes("--write");
const ACTIVE = path.join(ROOT, "datasets/tenant-inputs/active");
const TENANTS = ["skyharbor-air", "meridian-health"];

const QUESTIONS_PER_LEADER = [20, 25];
/**
 * Everyone at CXO, SVP or VP level gets an interview.
 *
 * Not a sample — the roster. A discovery that interviews four executives produces four opinions; one
 * that interviews every function and IT leader produces a map, and the disagreements between them are
 * the part worth having.
 */
const LEADER_PATTERN = /^(chief|ceo|cfo|cio|coo|cto|president|evp|svp|vp )/i;

/**
 * The question bank.
 *
 * `weight` biases which leaders get asked: `all` for questions any executive should answer, or a
 * regex against their role. A question asked of the wrong person produces a polite non-answer, which
 * is worse than not asking — it looks like coverage.
 */
const BANK = [
  // --- current state -------------------------------------------------------------------------
  ["current_state", "How would you describe the current state of the technology estate in your area?", "all"],
  ["current_state", "Which systems are genuinely fit for purpose, and which are you working around?", "all"],
  ["current_state", "Where does the architecture constrain what the business can do?", /cio|cto|architect|digital|engineering/i],
  ["current_state", "What would surprise an outsider about how this actually runs day to day?", "all"],
  ["current_state", "Which parts of the estate do you have good visibility into, and which are opaque?", "all"],
  // --- challenges ----------------------------------------------------------------------------
  ["challenges", "What is the single biggest constraint on your team's throughput right now?", "all"],
  ["challenges", "Where does effort leak — work that gets done twice, or done manually that should not be?", "all"],
  ["challenges", "What keeps you awake that the executive team does not fully appreciate?", "all"],
  ["challenges", "Which problem have you raised more than once without it moving?", "all"],
  ["challenges", "If a critical system failed tomorrow, where would the recovery actually struggle?", /infrastructure|operations|security|risk|cio/i],
  // --- portfolio -----------------------------------------------------------------------------
  ["portfolio", "Which programmes are you accountable for, and how confident are you in their dates?", "all"],
  ["portfolio", "Which initiative is most at risk, and what is the honest reason?", "all"],
  ["portfolio", "What is in the portfolio that you would stop if the decision were yours alone?", "all"],
  ["portfolio", "Where are two initiatives solving the same problem in different parts of the business?", /cio|cto|portfolio|pmo|transformation/i],
  // --- priorities ----------------------------------------------------------------------------
  ["priorities", "If you had one additional pound of investment, where would it go and why?", "all"],
  ["priorities", "What are your top three priorities for the next twelve months?", "all"],
  ["priorities", "Where do your priorities differ from what the enterprise plan says they are?", "all"],
  ["priorities", "What would you need to be true in eighteen months to consider this period a success?", "all"],
  // --- organisation --------------------------------------------------------------------------
  ["organisation", "Where are you thin on skills, and how are you covering it today?", "all"],
  ["organisation", "Which capability do you rely on a single person for?", "all"],
  ["organisation", "How much of your team's time goes to run versus change, honestly?", /cio|cto|operations|infrastructure|engineering/i],
  // --- sourcing ------------------------------------------------------------------------------
  ["sourcing", "Which supplier relationship gives you the least leverage, and why?", /cio|procurement|vendor|commercial|finance/i],
  ["sourcing", "Where are you paying for capacity or licences you are not using?", "all"],
  ["sourcing", "Which contract would you renegotiate first if the window opened tomorrow?", /cio|procurement|vendor|commercial|finance/i],
  // --- data and AI ---------------------------------------------------------------------------
  ["data_ai", "Where do you not trust the numbers, and what do you do instead?", "all"],
  ["data_ai", "Which decisions are still made on intuition because the data does not arrive in time?", "all"],
  ["data_ai", "What has AI actually changed in your area, as opposed to what has been piloted?", "all"],
  ["data_ai", "What would have to be true before you would let an agent act without a human check?", /cio|cto|risk|security|operations|clinical|safety/i],
  // --- risk ----------------------------------------------------------------------------------
  ["risk", "Which risk are you carrying that is accepted rather than mitigated?", "all"],
  ["risk", "Where would a regulator find you least prepared?", /risk|security|compliance|clinical|finance|cio/i],
  ["risk", "What is the oldest unresolved audit or security finding in your area?", /risk|security|compliance|infrastructure/i],
  // --- ways of working -----------------------------------------------------------------------
  ["ways_of_working", "Where does governance add time without changing the outcome?", "all"],
  ["ways_of_working", "How long does it take to get a decision that needs three functions to agree?", "all"],
  ["ways_of_working", "What have you stopped escalating because it never gets resolved?", "all"],
  // --- value ---------------------------------------------------------------------------------
  ["value", "How do you know whether last year's investment delivered what it promised?", "all"],
  ["value", "Which benefit case are you least confident actually landed?", "all"],
  ["value", "What would you need to prove value to Finance in a way they would accept?", /cio|finance|portfolio|transformation/i],
];

/**
 * Answer shapes per track, composed from the tenant's own estate.
 *
 * Each returns the substance of an answer plus the theme it belongs to, so corroboration can be
 * counted on what was actually said rather than on wording.
 */
/**
 * Theme prevalence.
 *
 * Sampling answers uniformly gave every theme roughly the same number of voices, so with twenty-six
 * leaders everything came back `corroborated_multi_source` — the third flat-distribution error in
 * this work, after the vendor book and the application lifecycle. A corpus where every theme is
 * equally corroborated discriminates nothing, which is the same outcome as no corroboration field at
 * all.
 *
 * Real discovery is uneven. Two or three problems are named by almost everyone, a middle band by a
 * handful, and a long tail by exactly one person who happens to own that corner. The tail is often
 * the most valuable part: a single credible voice raising something nobody else sees is a lead, and
 * it is invisible in a corpus that has been smoothed.
 *
 * Weights are relative selection likelihood, not counts.
 */
/**
 * Themes only the owner of that corner can raise.
 *
 * Weighting alone did not produce a tail: with five hundred answers across thirty-two themes, even a
 * one-in-a-hundred theme lands six times, across six different leaders, and comes back corroborated.
 *
 * The realistic model is not rarity, it is *standing*. The oldest unresolved audit finding is known
 * to the security lead and nobody else. Renewal leverage is known to procurement. A single credible
 * voice raising something no peer can see is the most valuable row in a discovery, and it exists
 * because of who they are, not because of a dice roll.
 */
const THEME_OWNERS = {
  stale_finding: /security|risk|compliance|audit|ciso/i,
  regulatory_exposure: /risk|compliance|legal|quality|clinical|ciso/i,
  renewal_leverage: /procurement|vendor|commercial|finance|cfo/i,
  shelfware: /procurement|vendor|finance|enterprise applications|cfo/i,
  run_change_ratio: /cio|cto|infrastructure|operations|engineering/i,
  ai_governance: /cio|cto|risk|security|clinical|safety|ciso/i,
  attribution: /finance|cfo|portfolio|transformation/i,
  finance_evidence: /finance|cfo|portfolio/i,
  duplicate_effort: /cio|cto|architect|portfolio|pmo/i,
  stop_candidate: /cio|cfo|coo|president|chief/i,
  priority_divergence: /chief|president|evp|svp/i,
  escalation_fatigue: /vp |director/i,
};

const THEME_PREVALENCE = {
  manual_effort: 9, value_realisation: 8, data_trust: 7, capability_gap: 6,
  integration_debt: 5, governance_friction: 5, vendor_dependency: 4, data_latency: 4,
  estate_fragmentation: 4, key_person_risk: 3, shelfware: 3, throughput_constraint: 3,
  legacy_gravity: 3, ai_pilot_stall: 3, decision_latency: 2, accepted_risk: 2,
  investment_priority: 2, run_change_ratio: 2, date_confidence: 2, attribution: 2,
  duplicate_effort: 1, stop_candidate: 1, unheard_risk: 1, visibility_gap: 1,
  regulatory_exposure: 1, stale_finding: 1, escalation_fatigue: 1, renewal_leverage: 1,
  ai_governance: 1, priority_divergence: 1, success_definition: 1, finance_evidence: 1,
};

function answerFor(track, ctx, r) {
  // Weighted pick: a theme's prevalence decides how likely it is to be the answer, so common
  // problems accumulate many voices and rare ones stay rare.
  const pick = (xs) => {
    if (!xs.length) return xs[0];
    // An owner-gated theme is unavailable to anyone else, which is what creates the long tail.
    const eligible = xs.filter((x) => {
      const owner = THEME_OWNERS[x?.theme];
      return !owner || owner.test(ctx.role ?? "");
    });
    const pool = eligible.length ? eligible : xs.filter((x) => !THEME_OWNERS[x?.theme]);
    if (!pool.length) return xs[0];
    xs = pool;
    const weights = xs.map((x) => THEME_PREVALENCE[x?.theme] ?? 2);
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = r() * total;
    for (let i = 0; i < xs.length; i += 1) {
      roll -= weights[i];
      if (roll <= 0) return xs[i];
    }
    return xs[xs.length - 1];
  };
  switch (track) {
    case "current_state":
      return pick([
        { theme: "estate_fragmentation", text: `${ctx.app} does the job it was bought for, but we run three other systems alongside it for regions it never covered. Nobody has owned consolidating them.` },
        { theme: "legacy_gravity", text: `The core is stable and old. ${ctx.app} has not materially changed in six years and everything new has to route around it.` },
        { theme: "visibility_gap", text: `I have good visibility into ${ctx.fn}, and almost none into what the business has bought directly without going through us.` },
        { theme: "integration_debt", text: `Most of the fragility is not in the systems, it is between them. The interfaces around ${ctx.app} break whenever either end is patched.` },
      ]);
    case "challenges":
      return pick([
        { theme: "manual_effort", text: `Reconciling ${ctx.fn} data between ${ctx.app} and the ledger is manual and takes days at every close.` },
        { theme: "capability_gap", text: `Two people understand ${ctx.app} end to end. One of them is eighteen months from retirement and we have no plan.` },
        { theme: "throughput_constraint", text: `We are not short of ideas, we are short of people who can safely change ${ctx.app}. Everything queues behind the same four engineers.` },
        { theme: "unheard_risk", text: `I have raised the ${ctx.fn} single point of failure in three consecutive planning cycles. It has never made the funded list.` },
      ]);
    case "portfolio":
      return pick([
        { theme: "date_confidence", text: `${ctx.prog} will land, but not on the date in the plan. The dependency on the platform migration slipped two quarters and we never re-baselined.` },
        { theme: "duplicate_effort", text: `${ctx.prog} and a separate programme in another function are both building the same capability. Neither team knows about the other.` },
        { theme: "stop_candidate", text: `If it were my call I would stop ${ctx.prog}. It made sense when it was approved and the business case has since been overtaken.` },
        { theme: "value_realisation", text: `We approved ${ctx.prog} with a benefit number and nobody has been back to check whether it landed.` },
      ]);
    case "priorities":
      return pick([
        { theme: "investment_priority", text: `Stabilising the ${ctx.fn} platform, ahead of anything new. We keep adding capability on a foundation that cannot carry it.` },
        { theme: "priority_divergence", text: `The enterprise plan has us on growth initiatives. My honest first priority is technical debt in ${ctx.app}, and those are not the same thing.` },
        { theme: "success_definition", text: `In eighteen months I want to be able to answer what ${ctx.fn} costs and what it delivers, without a three-week exercise.` },
        { theme: "investment_priority", text: `Data quality before more analytics. Another dashboard on the current foundation makes the problem worse, not better.` },
      ]);
    case "organisation":
      return pick([
        { theme: "capability_gap", text: `We cover the ${ctx.app} skill gap with a contractor who has been here two years. That is not a plan, it is a habit.` },
        { theme: "key_person_risk", text: `One person holds the ${ctx.fn} integration knowledge. It is written down nowhere that would survive their leaving.` },
        { theme: "run_change_ratio", text: `Honestly, about seventy per cent run. The change portfolio assumes the reverse and nobody has corrected the assumption.` },
      ]);
    case "sourcing":
      return pick([
        { theme: "vendor_dependency", text: `${ctx.vendor}. We cannot change anything without their professional services and their queue is eight weeks.` },
        { theme: "shelfware", text: `We are paying for entitlements on ${ctx.app} that a third of the licensed population has never opened.` },
        { theme: "renewal_leverage", text: `The ${ctx.vendor} agreement, and the window is narrow — the notice date passes before the budget conversation happens.` },
      ]);
    case "data_ai":
      return pick([
        { theme: "data_trust", text: `I do not trust the ${ctx.fn} numbers without checking them against the source. Most of my team keeps their own extract.` },
        { theme: "data_latency", text: `${ctx.fn} decisions are made on data that is a day old. By the time we see it, the operational window has closed.` },
        { theme: "ai_pilot_stall", text: `The pilot proved the capability and then stopped, because nobody owned the operational rollout or the funding beyond the trial.` },
        { theme: "ai_governance", text: `I would need clear accountability for a wrong decision before I let an agent act unsupervised. That question has not been answered.` },
      ]);
    case "risk":
      return pick([
        { theme: "accepted_risk", text: `The ${ctx.fn} recovery position is accepted rather than mitigated. It has been on the register for three years with the same owner.` },
        { theme: "regulatory_exposure", text: `Evidence. We do the controls; producing proof that they operated on a given date takes weeks.` },
        { theme: "stale_finding", text: `There is a privileged access finding from the last audit still open. The remediation was funded and then deferred twice.` },
      ]);
    case "ways_of_working":
      return pick([
        { theme: "governance_friction", text: `Architecture review adds six weeks and rarely changes the outcome. The standards are sensible; the process around them is not.` },
        { theme: "decision_latency", text: `A decision needing three functions takes a quarter. Most people have learned to avoid needing one.` },
        { theme: "escalation_fatigue", text: `I stopped escalating the ${ctx.fn} resourcing issue. It gets acknowledged and nothing changes, so now I work around it.` },
      ]);
    case "value":
      return pick([
        { theme: "value_realisation", text: `We do not know. The benefit case is written at approval and never revisited, and no one owns going back.` },
        { theme: "attribution", text: `${ctx.prog} claimed a saving that overlapped with two other changes in the same process. I could not defend the attribution.` },
        { theme: "finance_evidence", text: `Finance want a baseline they agree with and a cohort definition. We have never given them either in a form they would sign.` },
      ]);
    default:
      return { theme: "general", text: "No material issue raised." };
  }
}

function parseCsv(text) {
  const rows = [];
  let field = "", row = [], quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (c === '"') quoted = false;
      else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const objects = (rows) => {
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).filter((r) => r.some((v) => v.trim()))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
};
const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const rnd = (seed) => {
  let s = 0;
  for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
};

const summary = [];

for (const tenantKey of TENANTS) {
  const dir = path.join(ACTIVE, tenantKey, "current");
  const file = path.join(dir, "SA10_AI_Value_Interview_Evidence.csv");
  if (!fs.existsSync(file)) continue;
  const raw = parseCsv(fs.readFileSync(file, "utf8"));
  const header = raw[0].map((h) => h.trim());
  const template = objects(raw)[0] ?? {};

  const load = (f) => {
    const p = path.join(dir, f);
    return fs.existsSync(p) ? objects(parseCsv(fs.readFileSync(p, "utf8"))) : [];
  };
  const apps = load("04_applications_systems.csv").filter((a) => (a.criticality ?? "").toLowerCase() !== "tier3");
  const fns = load("01_business_functions.csv");
  const vendors = load("07_vendors_contracts.csv");
  const programs = load("09_programs_initiatives.csv");
  const org = load("02_org_ownership.csv");

  const r = rnd(`${tenantKey}|exec-interviews`);
  const pick = (xs) => xs[Math.floor(r() * xs.length)];

  // Leaders drawn from the org sheet, preferring the most senior — these are the people whose view
  // of priorities is worth twenty-five questions.
  const leaders = [...new Map(
    org.filter((o) => LEADER_PATTERN.test(o.leader_name_or_role ?? ""))
      // Most senior first, so the CXO slate is generated before the VP slate and reads that way.
      .sort((a, b) => {
        const rank = (x) => (/^(chief|ceo|cfo|cio|coo|cto|president)/i.test(x.leader_name_or_role) ? 0
          : /^(evp|svp)/i.test(x.leader_name_or_role) ? 1 : 2);
        return rank(a) - rank(b);
      })
      .map((o) => [o.leader_name_or_role, o]),
  ).values()];

  const rows = [];
  let seq = 0;
  for (const leader of leaders) {
    const role = leader.leader_name_or_role;
    const eligible = BANK.filter(([, , w]) => w === "all" || w.test(role));
    const count = QUESTIONS_PER_LEADER[0] + Math.floor(r() * (QUESTIONS_PER_LEADER[1] - QUESTIONS_PER_LEADER[0] + 1));
    // Shuffle deterministically, then take the leader's slate.
    const slate = eligible.slice().sort(() => r() - 0.5).slice(0, count);
    const month = 3 + Math.floor(r() * 4);
    const day = 1 + Math.floor(r() * 27);
    const date = `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const consent = pick(["named", "named", "role_only", "anonymous"]);

    for (const [track, question] of slate) {
      const ctx = {
        role,
        app: pick(apps)?.system_name ?? "the core platform",
        fn: (leader.owned_functions ?? "").split(/[;,]/)[0]?.trim() || pick(fns)?.function_name || "the function",
        vendor: pick(vendors)?.vendor_name ?? "the supplier",
        prog: pick(programs)?.program_name ?? "the programme",
      };
      const a = answerFor(track, ctx, r);
      rows.push({
        ...template,
        tenant_key: tenantKey,
        source_record_id: `SA10-${String(++seq).padStart(4, "0")}`,
        ai_program_id: "",
        ai_use_case_id: "",
        stakeholder_role: role,
        interview_track: track,
        question,
        answer_summary: a.text,
        what_is_working: "",
        what_is_not_working: track === "current_state" || track === "priorities" ? "" : a.text,
        current_baseline: "Not separately measured",
        target_or_promise: "",
        evidence_request: pick(["system report", "cost centre breakdown", "contract copy", "process timing study", "audit finding record"]),
        follow_up_artifact_needed: pick(["yes", "no", "no"]),
        decision_pressure: pick(["next budget cycle", "contract renewal", "board review", "none stated"]),
        named_owner: role,
        confidence: pick(["high", "medium", "medium"]),
        evidence_id: `EV-${tenantKey.slice(0, 3).toUpperCase()}-${String(seq).padStart(4, "0")}`,
        interview_date: date,
        interview_format: "one_to_one",
        interview_duration_minutes: "90",
        verbatim_quote: `"${a.text.replace(/"/g, "'")}"`,
        consent_to_attribute: consent,
        corroboration_count: "",
        corroboration_status: "",
        sentiment: track === "priorities" ? "neutral" : "negative",
        contradicts_record: r() < 0.12 ? "yes_conflicts_with_system_data" : "no_conflict_identified",
        theme_tags: a.theme,
        evidence_staleness_days: String(
          Math.max(0, Math.round((new Date("2026-08-17") - new Date(date)) / 86_400_000)),
        ),
      });
    }
  }

  // Corroboration counted on theme across distinct leaders, so one person repeating themselves does
  // not corroborate anything and two leaders independently raising it does.
  const byTheme = new Map();
  for (const x of rows) {
    if (!byTheme.has(x.theme_tags)) byTheme.set(x.theme_tags, new Set());
    byTheme.get(x.theme_tags).add(x.stakeholder_role);
  }
  for (const x of rows) {
    const others = Math.max(0, (byTheme.get(x.theme_tags)?.size ?? 1) - 1);
    x.corroboration_count = String(others);
    x.corroboration_status = others >= 2 ? "corroborated_multi_source"
      : others === 1 ? "corroborated_single_source" : "uncorroborated_opinion";
  }

  const dist = rows.reduce((acc, x) => {
    acc[x.corroboration_status] = (acc[x.corroboration_status] ?? 0) + 1;
    return acc;
  }, {});
  summary.push({
    tenantKey,
    leaders: leaders.length,
    interviews: rows.length,
    questionsPerLeader: `${QUESTIONS_PER_LEADER[0]}-${QUESTIONS_PER_LEADER[1]}`,
    tracks: [...new Set(rows.map((x) => x.interview_track))].length,
    distinctThemes: byTheme.size,
    corroboration: dist,
    contradictions: rows.filter((x) => (x.contradicts_record ?? "").startsWith("yes")).length,
  });

  if (WRITE) {
    fs.writeFileSync(file,
      [header.join(","), ...rows.map((x) => header.map((h) => esc(x[h])).join(","))].join("\n") + "\n");
  }
}

console.log(JSON.stringify({ mode: WRITE ? "write" : "dry-run", summary }, null, 2));
for (const s of summary) {
  console.log(`\n${s.tenantKey}: ${s.leaders} leaders x ${s.questionsPerLeader} questions = ${s.interviews} rows`);
  console.log(`  ${s.tracks} tracks · ${s.distinctThemes} distinct themes · ${s.contradictions} contradict the system record`);
  console.log(`  ${Object.entries(s.corroboration).map(([k, v]) => `${k}: ${v}`).join(" · ")}`);
}
if (!WRITE) console.log("\ndry-run — pass --write to update the fixtures.");
