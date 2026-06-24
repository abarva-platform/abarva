# Golden IROPS Before / After

## Before

The old Intelligence path handed Claude a broad role prompt plus retrieved sources. It told the model to be a senior advisor, but it did not give a task-specific case-team brief for an airline IROPS ROI question.

That produced weak answers because the model was not explicitly asked to:

- Treat IROPS as an airline disruption-recovery value problem.
- Use SkyHarbor facts first, then corpus/patterns, then expert planning ranges.
- Separate public/current sources from internal corpus and tenant evidence.
- Produce named examples, ROI levers, architecture prerequisites, and tables/charts.
- Avoid row-count-first or evidence-mechanics prose.

The server also capped most synthesized answers around 240 words after model generation. That cap made the required benchmark shape impossible even when the model had enough context.

## After

The new Intelligence Advisor Composer detects the golden IROPS question pattern and injects the `airline_irops_ai_roi` brief before Claude writes.

The composer tells Claude:

- What job it is doing: senior airline operations and enterprise-AI advisory.
- Which evidence order is binding: tenant facts, airline corpus, expert benchmarks, then public/current sources if supplied.
- Which experts to use: airline operations, ground/airport operations, network planning, enterprise architecture, AI governance, and value office.
- What artifacts are required: named examples table, ROI/value pool table, chart-ready numeric data, and SkyHarbor relevance panel.
- What not to do: no row counts, no raw IDs, no tenant ROI fabrication, no corpus-as-tenant confusion.

The route also receives a larger synthesis budget and word cap, scoped only to this advisor route, so ordinary Intelligence answers keep their existing shorter behavior.

## Expected Result

For the benchmark question, a strong answer should read like:

> Airlines are moving IROPS AI from delay prediction into recovery orchestration: reaccommodating passengers, rebalancing crew and aircraft, protecting gates and maintenance windows, and reducing contact-center load during disruption. The ROI does not come from "AI" broadly; it comes from fewer disruption minutes, faster recovery decisions, lower manual intervention, and protected loyalty during bad days. For SkyHarbor, the investment case depends on whether the real-time operations data, crew legality rules, PSS/DCS links, and value baseline are actually connected.

Then it should provide the required tables and caveats, with tenant-specific claims clearly separated from industry/corpus/public claims.
