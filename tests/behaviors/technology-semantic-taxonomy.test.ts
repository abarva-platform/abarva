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

import { classifyApplication, zoneFor } from "../../src/lib/visual-system/semantics/technology-semantic-taxonomy";

describe("zone assignment — the durable output", () => {
  /** The zone is what any surface consumes: a lane diagram, a table, an aVa answer. Get the zone
   * wrong and all three are wrong the same way. */
  it.each([
    ["Workday Core HR", "HCM Platform", "source_systems"],
    ["SAP S/4HANA — Finance (FI)", "ERP Core", "source_systems"],
    ["PeopleSoft GL", "", "source_systems"],
    ["Epic Resolute Hospital Billing — Production", "", "source_systems"],
    ["API Gateway / iPaaS (MuleSoft)", "", "middleware"],
    ["Confluent Kafka Event Backbone", "", "middleware"],
    ["Rhapsody Integration Engine", "", "middleware"],
    ["Informatica PowerCenter ETL", "Data & Analytics Platform", "data_integration"],
    ["IBM DataStage", "", "data_integration"],
    ["SSIS package (on-prem)", "", "data_integration"],
    ["IBM Netezza Enterprise Data Warehouse", "Enterprise data warehouse (MPP appliance)", "data_warehouse"],
    ["Teradata Enterprise Warehouse — Crew & Ops Subject Area", "", "data_warehouse"],
    ["Oracle Exadata", "", "data_warehouse"],
    ["Epic Caboodle", "", "data_warehouse"],
    ["Revenue Cycle Mart (SQL Server On-Prem)", "SQL Server database/mart", "data_mart"],
    ["Epic Clarity (SQL Server)", "", "data_mart"],
    ["HR/Workforce Cube (SQL Server On-Prem)", "SSAS OLAP cube", "analytics_bi"],
    ["Tableau Server", "", "analytics_bi"],
  ])("%s sits in %s", (name, category, zone) => {
    expect(zoneFor(classifyApplication({ systemName: name, systemCategory: category }).semanticType)).toBe(zone);
  });

  it("keeps middleware and data integration in different zones", () => {
    const mule = zoneFor(classifyApplication({ systemName: "API Gateway / iPaaS (MuleSoft)" }).semanticType);
    const informatica = zoneFor(classifyApplication({ systemName: "Informatica PowerCenter ETL" }).semanticType);
    expect(mule).toBe("middleware");
    expect(informatica).toBe("data_integration");
    expect(mule).not.toBe(informatica);
  });

  it("keeps warehouses and marts in different zones", () => {
    const wh = zoneFor(classifyApplication({ systemName: "IBM Netezza Enterprise Data Warehouse" }).semanticType);
    const mart = zoneFor(classifyApplication({ systemName: "Revenue Cycle Mart (SQL Server On-Prem)", systemCategory: "SQL Server database/mart" }).semanticType);
    expect(wh).toBe("data_warehouse");
    expect(mart).toBe("data_mart");
  });

  it("does not let a prefix match cross a product boundary", () => {
    // "Epic Clarity (SQL Server)" must not resolve via the "SQL Server" alias -- its head is
    // Epic Clarity, and it is a reporting database, not a database platform.
    expect(classifyApplication({ systemName: "Epic Clarity (SQL Server)" }).semanticType).toBe("operational_reporting_database");
  });

  it("leaves an unreviewed product unzoned rather than guessing", () => {
    expect(zoneFor(classifyApplication({ systemName: "Contoso Mystery Box" }).semanticType)).toBe("unzoned");
  });
});
