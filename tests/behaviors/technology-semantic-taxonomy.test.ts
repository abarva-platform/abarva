import {
  classifyTechnology,
  classifyMechanism,
  isMovementPlatform,
  isStore,
  MOVEMENT_PLATFORM_TYPES,
} from "../../src/lib/visual-system/semantics/technology-semantic-taxonomy";

/**
 * These tests exist because a shipped diagram called Epic Caboodle an integration component.
 * They are written as the domain assertion, not as a mapping check: the question each one asks is
 * "could a knowledgeable reviewer discredit the view on this point?"
 */

describe("product classification — the shipped defect", () => {
  it.each([
    ["Epic Caboodle", "enterprise_data_warehouse"],
    ["Epic Clarity (SQL Server)", "operational_reporting_database"],
    ["SQL Server (on-prem)", "database_platform"],
    ["Tableau extract (.hyper, on-prem)", "bi_extract"],
    ["Rhapsody Integration Engine", "integration_engine"],
    ["SSIS package (on-prem)", "etl_elt_platform"],
  ])("%s is %s", (raw, expected) => {
    expect(classifyTechnology(raw).semanticType).toBe(expected);
  });

  it.each(["Epic Caboodle", "Epic Clarity (SQL Server)", "SQL Server (on-prem)", "Tableau extract (.hyper, on-prem)"])(
    "%s can never be treated as a data-movement platform",
    (raw) => {
      const { semanticType } = classifyTechnology(raw);
      expect(isMovementPlatform(semanticType)).toBe(false);
      expect(MOVEMENT_PLATFORM_TYPES.has(semanticType)).toBe(false);
    },
  );
});

describe("product classification — the second tenant", () => {
  it.each([
    ["Informatica PowerCenter ETL", "etl_elt_platform"],
    ["Confluent Kafka Event Backbone", "event_streaming_platform"],
    ["API Gateway / iPaaS (MuleSoft)", "api_esb_platform"],
    ["EDI / B2B Trading Partner Gateway", "b2b_edi_gateway"],
  ])("%s is %s", (raw, expected) => {
    expect(classifyTechnology(raw).semanticType).toBe(expected);
  });

  it("keeps ETL, streaming and API/ESB distinct rather than collapsing them into middleware", () => {
    const etl = classifyTechnology("Informatica PowerCenter ETL").semanticType;
    const stream = classifyTechnology("Confluent Kafka Event Backbone").semanticType;
    const api = classifyTechnology("API Gateway / iPaaS (MuleSoft)").semanticType;
    expect(new Set([etl, stream, api]).size).toBe(3);
    // All three move data, but they are not the same kind of thing.
    expect([etl, stream, api].every(isMovementPlatform)).toBe(true);
  });

  it("does not classify MuleSoft as a store, or Kafka as ETL", () => {
    expect(isStore(classifyTechnology("API Gateway / iPaaS (MuleSoft)").semanticType)).toBe(false);
    expect(classifyTechnology("Confluent Kafka Event Backbone").semanticType).not.toBe("etl_elt_platform");
  });

  it("treats a recorded absence of an intermediary as exactly that", () => {
    // 52 rows in one tenant record "Direct point-to-point". It is not a platform; drawing it as a
    // node would invent a hop the record says does not exist.
    const c = classifyTechnology("Direct point-to-point");
    expect(c.semanticType).toBe("no_intermediary");
    expect(isMovementPlatform(c.semanticType)).toBe(false);
  });
});

describe("substring safety", () => {
  it("does not let a shorter alias swallow a longer recorded value", () => {
    // "SQL Server" is a substring of "Epic Clarity (SQL Server)". Substring matching would call a
    // reporting database a database platform.
    expect(classifyTechnology("Epic Clarity (SQL Server)").semanticType).toBe("operational_reporting_database");
    expect(classifyTechnology("SQL Server (on-prem)").semanticType).toBe("database_platform");
  });
});

describe("unknown stays unknown", () => {
  it("does not guess at an unreviewed product", () => {
    const c = classifyTechnology("Contoso DataBridge Ultra 9000");
    expect(c.semanticType).toBe("unknown");
    expect(c.classificationSource).toBe("unclassified");
    expect(c.rawValue).toBe("Contoso DataBridge Ultra 9000");
  });

  it("preserves the raw value on every classification, matched or not", () => {
    expect(classifyTechnology("Epic Caboodle").rawValue).toBe("Epic Caboodle");
    expect(classifyTechnology("").rawValue).toBe("");
    expect(classifyTechnology("").semanticType).toBe("unknown");
  });
});

describe("movement mechanisms stay separate from platforms", () => {
  it.each([
    ["HL7v2 interface", "hl7v2"],
    ["FHIR API", "fhir_api"],
    ["database replication", "database_replication"],
    ["Database Replication (CDC)", "cdc"],
    ["SQL Server linked-server pull", "database_pull"],
    ["SSIS ETL pipeline", "etl_pipeline"],
    ["Kafka Streaming", "event_stream"],
    ["Message Queue", "message_queue"],
  ])("%s is the mechanism %s", (raw, expected) => {
    expect(classifyMechanism(raw).semanticType).toBe(expected);
  });

  it("never resolves a mechanism to a platform type, or the reverse", () => {
    // The two taxonomies must not collapse. A linked-server pull is movement; SQL Server is a
    // platform. Conflating them is how "SQL Server is integration middleware" happens.
    expect(classifyTechnology("SQL Server linked-server pull").semanticType).toBe("unknown");
    expect(classifyMechanism("SQL Server (on-prem)").semanticType).toBe("unknown");
  });
});
