# Ava Answer Contract

`AvaAnswerPacket` is the canonical user-facing answer contract. The retired `AgentAnswer` shape is no longer allowed as a public answer model.

The packet leads with `directAnswer`, then optional interpretation, implication, recommendation, typed artifacts, citations, gaps, caveats, and next steps. Surface rules are enforced by `validateAvaAnswerPacket`.

Home is factual and may not show recommendations, expert packs, corpus claims, debug labels, or row-count-first language.

Intelligence, Source, Moves, and Tower may use different voice adapters, but they use the same packet, quality gate, and artifact structure.
