# Context, Corpus & Reasoning — full-stack report

Open `index.html` in a browser (self-contained; Mermaid via CDN).

Explains, two-altitude (executive + engineer):
1. Executive summary + mental model
2. Live data by layer & dimension (counts from `abarva_control` 2026-06-07)
3. Ingestion pipeline: parse → chunk → registry → db → graph → index
4. Real-time "awareness": how `askIntelligence` binds context per request (the retrievers + prompt assembler hold the intelligence, not the model)
5. No-context fallback & the Claude reasoning layer (fail-closed, no fabrication)
6. Worked examples (Lakeshore grounded · Meridian NOT_LOADED · cross-namespace guard)
7. Full-stack picture + the RAG triangle
8. How to train/improve (data + retrieval + prompt, ranked — not base-model fine-tuning)
9. Glossary

Key live truths (read-only): corpus_patterns 9,026 · genome_patterns 43,436 · graph 93,743 ·
applications 232 (all `is_demo_data`) · **`enterprise_context_*` absent in Azure runtime** (Supabase-only).
Source prompt: `docs/build/codex-prompts/CONTEXT_ARCHITECTURE_HTML_REPORT_PROMPT.md`.
