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
    // SSIS is Microsoft's ETL tool. The value recorded in the platform column names that tool.
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

import { classifyApplication, zoneFor, bandFor } from "../../src/lib/visual-system/semantics/technology-semantic-taxonomy";

describe("zone assignment — the durable output", () => {
  /** The zone is what any surface consumes: a lane diagram, a table, an aVa answer. Get the zone
   * wrong and all three are wrong the same way. */
  it.each([
    ["Workday Core HR", "HCM Platform", "source_systems"],
    ["SAP S/4HANA — Finance (FI)", "ERP Core", "source_systems"],
    ["PeopleSoft GL", "", "source_systems"],
    ["Epic Resolute Hospital Billing — Production", "", "source_systems"],
    // Each interoperability role keeps its own zone -- they are not interchangeable.
    ["API Gateway / iPaaS (MuleSoft)", "", "api_ipaas_esb"],
    ["Confluent Kafka Event Backbone", "", "event_streaming"],
    ["Rhapsody Integration Engine", "", "healthcare_interoperability"],
    ["EDI / B2B Trading Partner Gateway", "", "b2b_edi"],
    ["Informatica PowerCenter ETL", "Data & Analytics Platform", "etl_tooling"],
    ["IBM DataStage", "", "etl_tooling"],
    ["SSIS package (on-prem)", "", "etl_tooling"],
    ["Claims ETL (SQL Server On-Prem)", "SSIS ETL package", "pipeline_artifacts"],
    ["IBM Netezza Enterprise Data Warehouse", "Enterprise data warehouse (MPP appliance)", "enterprise_warehouse"],
    ["Teradata Enterprise Warehouse — Crew & Ops Subject Area", "", "enterprise_warehouse"],
    ["Epic Caboodle", "", "enterprise_warehouse"],
    // Exadata is a database platform. Warehouses are sometimes hosted on it; that does not make
    // the appliance a warehouse.
    ["Oracle Exadata", "", "database_platform"],
    ["SQL Server (on-prem)", "", "database_platform"],
    ["Revenue Cycle Mart (SQL Server On-Prem)", "SQL Server database/mart", "data_marts"],
    // Epic Clarity is an operational reporting database, NOT a mart. A mart is a downstream
    // product; Clarity is the reporting store products are built from.
    ["Epic Clarity (SQL Server)", "", "operational_reporting_db"],
    ["HR/Workforce Cube (SQL Server On-Prem)", "SSAS OLAP cube", "analytics_bi"],
    ["Tableau Server", "", "analytics_bi"],
  ])("%s sits in %s", (name, category, zone) => {
    expect(zoneFor(classifyApplication({ systemName: name, systemCategory: category }).semanticType)).toBe(zone);
  });

  it("keeps the four interoperability roles in four different zones", () => {
    const z = (n: string) => zoneFor(classifyApplication({ systemName: n }).semanticType);
    const roles = [
      z("Rhapsody Integration Engine"),
      z("API Gateway / iPaaS (MuleSoft)"),
      z("Confluent Kafka Event Backbone"),
      z("EDI / B2B Trading Partner Gateway"),
      z("Informatica PowerCenter ETL"),
    ];
    expect(new Set(roles).size).toBe(5);
  });

  it("groups those distinct zones into one executive band without losing them", () => {
    // An executive sees one movement band; an architect drills to the zone that distinguishes
    // Rhapsody from Kafka. Same model, two altitudes.
    const b = (n: string, c = "") => bandFor(zoneFor(classifyApplication({ systemName: n, systemCategory: c }).semanticType));
    expect(b("Rhapsody Integration Engine")).toBe("interoperability_movement");
    expect(b("Confluent Kafka Event Backbone")).toBe("interoperability_movement");
    expect(b("SSIS package (on-prem)")).toBe("interoperability_movement");
    expect(b("Epic Caboodle")).toBe("data_platforms_stores");
    // Passed with its recorded category, as the real record carries it. Without a category the
    // name alone does not classify it, and that is correct -- inferring "mart" from the string
    // would be exactly the substring guessing this taxonomy forbids.
    expect(b("Revenue Cycle Mart (SQL Server On-Prem)", "SQL Server database/mart")).toBe("data_products_marts");
  });

  it("keeps warehouses, reporting databases, database platforms and marts apart", () => {
    const z = (n: string, c = "") => zoneFor(classifyApplication({ systemName: n, systemCategory: c }).semanticType);
    expect(z("IBM Netezza Enterprise Data Warehouse")).toBe("enterprise_warehouse");
    expect(z("Epic Clarity (SQL Server)")).toBe("operational_reporting_db");
    expect(z("SQL Server (on-prem)")).toBe("database_platform");
    expect(z("Revenue Cycle Mart (SQL Server On-Prem)", "SQL Server database/mart")).toBe("data_marts");
    expect(new Set([z("IBM Netezza Enterprise Data Warehouse"), z("Epic Clarity (SQL Server)"), z("SQL Server (on-prem)"), z("Revenue Cycle Mart (SQL Server On-Prem)", "SQL Server database/mart")]).size).toBe(4);
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

import { resolveTechnologySemantics } from "../../src/lib/visual-system/semantics/technology-semantic-taxonomy";

describe("entity vs host — the two must not flatten into one", () => {
  it("keeps a SQL Server-hosted mart a MART, with SQL Server as its host", () => {
    // Flatten to "SQL Server" and it stops being a mart. Flatten to "integration" because a
    // linked-server pull touches it and it stops being a store at all. Both have happened.
    const r = resolveTechnologySemantics({
      systemName: "Radiology Utilization Mart (SQL Server On-Prem)",
      systemCategory: "SQL Server database/mart",
    });
    expect(r.entityType).toBe("data_mart");
    expect(r.hostingPlatform).toBe("SQL Server On-Prem");
    expect(r.platformType).toBe("database_platform");
    expect(r.classificationStatus).toBe("classified");
  });

  it("keeps Epic Clarity a reporting database even though SQL Server hosts it", () => {
    const r = resolveTechnologySemantics({ systemName: "Epic Clarity (SQL Server)" });
    expect(r.entityType).toBe("operational_reporting_database");
    expect(r.hostingPlatform).toBe("SQL Server");
    expect(r.platformType).toBe("database_platform");
  });

  it("lets a BROAD recorded category be refined by exact product identity", () => {
    const r = resolveTechnologySemantics({ systemName: "Epic Caboodle", systemCategory: "Application" });
    expect(r.entityType).toBe("enterprise_data_warehouse");
    expect(r.classificationSources).toContain("governed_reference_taxonomy");
  });

  it("reports a CONFLICT when a precise category contradicts product identity", () => {
    // The conflict is data-quality signal. Resolving it by precedence would hide the fact that the
    // record disagrees with itself.
    const r = resolveTechnologySemantics({
      systemName: "Epic Caboodle",
      systemCategory: "Integration engine",
    });
    expect(r.classificationStatus).toBe("conflict");
    expect(r.conflictReason).toMatch(/Enterprise data warehouse/);
    expect(r.conflictReason).toMatch(/Integration engine/);
  });

  it("marks an unreviewed product unknown, with its raw value kept", () => {
    const r = resolveTechnologySemantics({ systemName: "Contoso Mystery Box" });
    expect(r.classificationStatus).toBe("unknown");
    expect(r.entityType).toBe("unknown");
    expect(r.rawValue).toBe("Contoso Mystery Box");
  });

  it("separates the ETL TOOL from a job that runs on it", () => {
    // SSIS is Microsoft's ETL tool and belongs with Informatica and DataStage. A named job --
    // recorded as the category "SSIS ETL package" -- is the artifact that runs on that tool.
    expect(resolveTechnologySemantics({ systemName: "SSIS package (on-prem)" }).entityType).toBe("etl_elt_platform");
    expect(resolveTechnologySemantics({ systemName: "Informatica PowerCenter" }).entityType).toBe("etl_elt_platform");
    expect(resolveTechnologySemantics({ systemName: "IBM DataStage" }).entityType).toBe("etl_elt_platform");
    expect(
      resolveTechnologySemantics({ systemName: "Claims ETL (SQL Server On-Prem)", systemCategory: "SSIS ETL package" }).entityType,
    ).toBe("etl_pipeline_artifact");
  });

  it("reads the parenthetical as the product when the head is unrecognised", () => {
    // "API Gateway / iPaaS (MuleSoft)" names the product in the bracket. Treating the bracket
    // only ever as a host sent a reviewed product to unknown because of how the record phrased it.
    const r = resolveTechnologySemantics({ systemName: "API Gateway / iPaaS (MuleSoft)" });
    expect(r.entityType).toBe("api_esb_platform");
    expect(zoneFor(r.entityType)).toBe("api_ipaas_esb");
  });

  it("still treats the parenthetical as a HOST when the head is a known product", () => {
    // The two must not collapse: Epic Clarity hosted on SQL Server is a reporting database, and
    // SQL Server is its host -- not its identity.
    const r = resolveTechnologySemantics({ systemName: "Epic Clarity (SQL Server)" });
    expect(r.entityType).toBe("operational_reporting_database");
    expect(r.hostingPlatform).toBe("SQL Server");
  });

  it("keeps both the tool and its jobs in the data integration zone", () => {
    // A job is not a platform, but it must not disappear from the picture either.
    expect(zoneFor(resolveTechnologySemantics({ systemName: "SSIS package (on-prem)" }).entityType)).toBe("etl_tooling");
    expect(
      zoneFor(resolveTechnologySemantics({ systemName: "Claims ETL (SQL Server On-Prem)", systemCategory: "SSIS ETL package" }).entityType),
    ).toBe("pipeline_artifacts");
  });
});
