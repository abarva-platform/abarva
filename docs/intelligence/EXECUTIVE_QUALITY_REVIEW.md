# Intelligence executive quality review

Open **Intelligence → 10-question quality review**. Review or edit the ten questions, choose **Run 10 questions**, then **Export review PDF**. The run uses the signed-in company's evidence and a fresh conversation session for each question. Requests run sequentially. **Stop review** cancels the active request and leaves completed answers available for export.

The suite covers the four starter questions plus economics, capabilities, confirmed dependencies, risks, build/buy/partner decisions, and a 90-day plan. The PDF contains a summary, each question and answer, authored tables/charts/graphs, cited source labels, follow-up questions, and an optional appendix with the complete original model responses. The default PDF focuses on answers and visuals; select **Include original response appendix** when the raw audit record is needed. Failed and cancelled requests are identified explicitly. A partial review never appears as ten successful answers.

## What to assess

The answer flow is a direct conclusion, relevant company context, and a decision hinge: the uncertainty, tradeoff or condition that would change the conclusion. Three specific follow-up questions come from that hinge and the likely next decision, rather than a fixed menu.

- Does the opening state the decision or consequential finding clearly?
- Are the reasons specific to the company's evidence and properly sourced?
- Is the recommended investment, validation, sequence or hold decision justified?
- Are missing economics and uncertain assumptions explicit?
- Do exhibits answer the question and use supported values or confirmed relationships?
- Is the next action clear, with an owner where known and a validation gate?

Opening and prose word counts are observations for human review, not quality scores. The prompt requires a 20–30 word opening (35 maximum) and at most 90 prose words, reduced to 65 when an exhibit, ranking, plan or comparison carries the detail. The default total visible answer, including table cells and exhibit notes, is limited to 160 words by the prompt. Numeric charts use Recharts in the product; strategic tradeoffs can use a categorical low/high matrix explicitly labeled as advisory judgment. Neither path invents numeric priority scores. The opening measurement skips leading Markdown headings without changing the response. A longer answer remains intact so it can be assessed. Explicit deep dives may be longer.

## Output ownership

Claude authors the prose, recommendations, numeric values, labels, exhibits and follow-up questions. The application decodes explicit transport blocks and renders their content. It does not shorten answers, rewrite prose, invent numeric priority scores, compute financial metrics, attach retrieved source tables, or produce charts from an unrelated table.

Malformed exhibit blocks remain visible in the original answer and PDF appendix, with a separate rendering observation. Export rejects oversized or structurally inconsistent payloads rather than silently truncating them. Source aliases are assigned before generation and decoded from explicit source metadata. New answers keep these aliases out of visible prose; the Sources section displays readable source names. Original model output is retained unchanged even when the optional appendix is omitted.

The executive path passes source and conversation context through `buildValidatedAgentContextBundle`; blocked objects do not reach Claude. Legacy adapters retain their conservative readiness floor, and the prompt requires provisional treatment until readiness and evidence are verified. Ungated supplemental dossiers and fact summaries do not enter this path.

Authentication, tenant isolation, validated context selection and whole-answer confidentiality/stale-fact rejection remain server responsibilities. These checks do not rewrite a successful answer. The review tool does not approve investments or certify claims.

## Verification boundary

Local tests establish transport preservation, sequential isolation, failure reporting and export behavior. A rendered PDF fixture establishes layout behavior. Neither proves live Claude answer quality. After the controlled release is deployed, run this suite in the signed-in product and review the resulting PDF before accepting the answer quality.
