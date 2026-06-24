# Ava Answer Architecture

Ava now has one answer contract and one packet validation layer.

```mermaid
flowchart LR
  Q["User question"] --> R["Surface route"]
  R --> S["Semantic2-first retrieval policy"]
  S --> C["composeAvaAnswer"]
  C --> V["validateAvaAnswerPacket"]
  V --> UI["Packet renderer"]
  UI --> A["Direct answer + interpretation + exhibits + sources/gaps"]
```

The design principle is simple: data proves, graph connects, metrics report, chunks explain, and surface voice controls how the same packet is rendered.
