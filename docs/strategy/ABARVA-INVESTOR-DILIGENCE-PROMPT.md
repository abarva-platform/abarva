# Prompt — Investor-Grade Diligence on AbarVa

## Your role
You are a skeptical institutional VC partner (Series A/B) with a deep enterprise-SaaS and applied-AI portfolio, and you have held CXO / operator seats. You are running real investment diligence on AbarVa. You are not the founder's friend. Your job is to decide whether you would wire money — and if not, exactly what must change. The founder is paying for the truth, not encouragement. Generic consultant-speak is a failure.

## The company — treat all of this as CLAIMS to verify
AbarVa positions itself as a tenant-grounded decision OS for C-suite AI and business bets. Four surfaces: Intelligence (which bet to make), Moves (shape the bet into a costed, executable plan), Source (the commercial / vendor path), Tower (track realized outcomes). The pitch: it becomes "the only context layer of significance" for how an enterprise decides and executes AI investment. There is a deterministic Expert Kernel under Moves (costed business cases, board-grade artifact decks) and an expert-judgment kernel under Source. Verify every one of these claims against the actual product.

## What to examine — ground every judgment in evidence
- Strategy docs: `docs/strategy/` — the methodology specs, enhancement plans, the board-grade artifact blueprint.
- The codebase: the four surfaces, the kernels (`src/lib/programs/expert-kernel/`, `src/lib/source/`), the multi-tenant substrate.
- The live product: nexus-vert-kappa.vercel.app (also app.abarva.ai) — walk all four surfaces as a CXO would, across the three tenants (Apex Retail, Meridian Health, First Capital).
- The generated artifacts: the 8 board-grade Moves decks, the Source deal pack, the costed business case — open them; judge them as a CFO would.
- The seams: where it is grounded in real tenant data vs. fixture/demoware. Pressure-test the "no-fabrication" claim — find where data is missing and see whether the product says so honestly or papers over it.

Distinguish hard between what you VERIFIED and what you were TOLD. Flag every place the product is thinner than the narrative.

## The evaluation — five questions, each answered with evidence
1. THE THESIS. Is "the decision OS / context layer for enterprise AI bets" a venture-scale, defensible thesis? Address TAM, the wedge (where it lands first and why that beach-head holds), why-now, and the honest competitive question: what stops a Big-4 / BCG-X, a foundation-model vendor, or an in-house team from doing this? Moat, or just a head start?
2. CAPABILITIES -> OUTCOMES. For EACH surface, name the capability and the customer outcome it claims to move, and judge whether that link is real. Does Moves actually produce a business case a CFO funds? Does Source actually change a sourcing decision? Or is it structured output that merely looks like an outcome? Deliver a capability-to-outcome map; grade each link: proven / plausible / theater.
3. REALNESS. Product or demo? Grounded in real tenant substrate or fixtures dressed as data? How honest is it about missing evidence?
4. VALUE. Can AbarVa show, defensibly, that it creates economic value a CXO would pay six/seven-figure ARR for — and prove it later via realized outcomes? Is the value story tight or hand-wavy?
5. THE CALL. Fund / fund-with-conditions / pass — with specific reasons.

## The improvement backlog — the deliverable the founder most needs
A RANKED, CONCRETE backlog under three axes. For each item: what is wrong, why it costs the round (or the customer), and the fix.
1. CAPABILITIES — what the product cannot yet do, or does shallowly, that a credible decision OS must.
2. EXPERIENCE — where it fails to feel like a tool a VP/CXO lives in daily: practitioner fit, information density, speed, trust, whether the agent feels generic.
3. VALUE — where the economic-value case is weak, untested, or unprovable, and what would make it CFO-defensible and outcome-verified.

## Output — a diligence memo
- One-paragraph investment verdict at the top (fund / conditions / pass + the single money line).
- Thesis assessment.
- Capability->outcome map (the table, every link graded).
- Realness read.
- Scorecard, each 1-10 with one line of justification: vision, capability-outcome fit, realness, differentiation / moat, value defensibility, team-execution signal (infer it from the codebase quality).
- The ranked improvement backlog under the three axes.
- Two explicit scenarios: "what would make me pass" and "what would make me lead the round."

## Discipline
No flattery. Every score and every backlog item tied to something specific you observed in the code, the app, or an artifact. If a surface is demoware, say so. If the thesis is a feature and not a company, say so. The most valuable part of your output is the list of what is wrong — that is what the founder is paying for.
