export const AZURE_SEARCH_EMBEDDING_DIMENSIONS = 1536;
export const AZURE_SEARCH_VECTOR_PROFILE = "tenant-context-vector-profile";
export const AZURE_SEARCH_VECTOR_ALGORITHM = "tenant-context-hnsw";

type SearchField = {
  readonly name: string;
  readonly type: string;
  readonly key?: boolean;
  readonly searchable?: boolean;
  readonly filterable?: boolean;
  readonly sortable?: boolean;
  readonly facetable?: boolean;
  readonly retrievable?: boolean;
  readonly analyzer?: string;
  readonly dimensions?: number;
  readonly vectorSearchProfile?: string;
};

type SearchIndexContract = {
  readonly name: string;
  readonly fields: ReadonlyArray<SearchField>;
  readonly vectorSearch?: {
    readonly algorithms: ReadonlyArray<{
      readonly name: string;
      readonly kind: "hnsw";
      readonly hnswParameters: {
        readonly metric: "cosine";
        readonly m: number;
        readonly efConstruction: number;
        readonly efSearch: number;
      };
    }>;
    readonly profiles: ReadonlyArray<{
      readonly name: string;
      readonly algorithm: string;
    }>;
  };
};

function field(
  name: string,
  type: string,
  opts: Omit<SearchField, "name" | "type"> = {},
): SearchField {
  return { name, type, ...opts };
}

function vectorField(name = "embedding"): SearchField {
  return field(name, "Collection(Edm.Single)", {
    searchable: true,
    retrievable: false,
    dimensions: AZURE_SEARCH_EMBEDDING_DIMENSIONS,
    vectorSearchProfile: AZURE_SEARCH_VECTOR_PROFILE,
  });
}

function baseVectorSearch(): SearchIndexContract["vectorSearch"] {
  return {
    algorithms: [
      {
        name: AZURE_SEARCH_VECTOR_ALGORITHM,
        kind: "hnsw",
        hnswParameters: {
          metric: "cosine",
          m: 4,
          efConstruction: 400,
          efSearch: 500,
        },
      },
    ],
    profiles: [
      {
        name: AZURE_SEARCH_VECTOR_PROFILE,
        algorithm: AZURE_SEARCH_VECTOR_ALGORITHM,
      },
    ],
  };
}

export function azureSearchIndexContracts(): ReadonlyArray<SearchIndexContract> {
  return [
    {
      name: "tenant-context-v1",
      fields: [
        field("id", "Edm.String", {
          key: true,
          filterable: true,
          retrievable: true,
        }),
        field("tenant_key", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("client_id", "Edm.String", {
          filterable: true,
          sortable: true,
          facetable: true,
          retrievable: true,
        }),
        field("client_key", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("source_segment", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("record_id", "Edm.String", {
          filterable: true,
          retrievable: true,
        }),
        field("chunk_id", "Edm.String", {
          filterable: true,
          retrievable: true,
        }),
        field("title", "Edm.String", {
          searchable: true,
          retrievable: true,
          analyzer: "en.lucene",
        }),
        field("body", "Edm.String", {
          searchable: true,
          retrievable: true,
          analyzer: "en.lucene",
        }),
        field("source_uri", "Edm.String", {
          filterable: true,
          retrievable: true,
        }),
        field("source_basis", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("source_citation", "Edm.String", {
          filterable: true,
          retrievable: true,
        }),
        field("confidence", "Edm.Double", {
          filterable: true,
          sortable: true,
          retrievable: true,
        }),
        field("confidence_level", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("sensitivity", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("classification", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("lifecycle_state", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("agent_readiness_status", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("source_file_id", "Edm.String", {
          filterable: true,
          retrievable: true,
        }),
        field("source_row_number", "Edm.Int32", {
          filterable: true,
          sortable: true,
          retrievable: true,
        }),
        field("last_seen_at", "Edm.DateTimeOffset", {
          filterable: true,
          sortable: true,
          retrievable: true,
        }),
        vectorField(),
      ],
      vectorSearch: baseVectorSearch(),
    },
    {
      name: "evidence-ledger-v1",
      fields: [
        field("id", "Edm.String", {
          key: true,
          filterable: true,
          retrievable: true,
        }),
        field("tenant_key", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("evidence_id", "Edm.String", {
          filterable: true,
          retrievable: true,
        }),
        field("claim_id", "Edm.String", {
          filterable: true,
          retrievable: true,
        }),
        field("source_type", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("source_uri", "Edm.String", {
          filterable: true,
          retrievable: true,
        }),
        field("excerpt", "Edm.String", {
          searchable: true,
          retrievable: true,
          analyzer: "en.lucene",
        }),
        field("owner", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("as_of_date", "Edm.DateTimeOffset", {
          filterable: true,
          sortable: true,
          retrievable: true,
        }),
        field("confidence", "Edm.Double", {
          filterable: true,
          sortable: true,
          retrievable: true,
        }),
        vectorField(),
      ],
      vectorSearch: baseVectorSearch(),
    },
    {
      name: "source-vendor-v1",
      fields: [
        field("id", "Edm.String", {
          key: true,
          filterable: true,
          retrievable: true,
        }),
        field("tenant_key", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("vendor", "Edm.String", {
          searchable: true,
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("contract_id", "Edm.String", {
          filterable: true,
          retrievable: true,
        }),
        field("category", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("renewal_date", "Edm.DateTimeOffset", {
          filterable: true,
          sortable: true,
          retrievable: true,
        }),
        field("annual_spend", "Edm.Double", {
          filterable: true,
          sortable: true,
          retrievable: true,
        }),
        field("risk_flags", "Collection(Edm.String)", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("body", "Edm.String", {
          searchable: true,
          retrievable: true,
          analyzer: "en.lucene",
        }),
        vectorField(),
      ],
      vectorSearch: baseVectorSearch(),
    },
    {
      name: "industry-corpus-v1",
      fields: [
        field("id", "Edm.String", {
          key: true,
          filterable: true,
          retrievable: true,
        }),
        field("industry", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("domain", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("pattern_id", "Edm.String", {
          filterable: true,
          retrievable: true,
        }),
        field("source", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("title", "Edm.String", {
          searchable: true,
          retrievable: true,
          analyzer: "en.lucene",
        }),
        field("body", "Edm.String", {
          searchable: true,
          retrievable: true,
          analyzer: "en.lucene",
        }),
        field("as_of_date", "Edm.DateTimeOffset", {
          filterable: true,
          sortable: true,
          retrievable: true,
        }),
        field("confidence", "Edm.Double", {
          filterable: true,
          sortable: true,
          retrievable: true,
        }),
        vectorField(),
      ],
      vectorSearch: baseVectorSearch(),
    },
    {
      name: "signals-v1",
      fields: [
        field("id", "Edm.String", {
          key: true,
          filterable: true,
          retrievable: true,
        }),
        field("industry", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("signal_id", "Edm.String", {
          filterable: true,
          retrievable: true,
        }),
        field("source", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("signal_type", "Edm.String", {
          filterable: true,
          facetable: true,
          retrievable: true,
        }),
        field("summary", "Edm.String", {
          searchable: true,
          retrievable: true,
          analyzer: "en.lucene",
        }),
        field("observed_at", "Edm.DateTimeOffset", {
          filterable: true,
          sortable: true,
          retrievable: true,
        }),
        field("expires_at", "Edm.DateTimeOffset", {
          filterable: true,
          sortable: true,
          retrievable: true,
        }),
        vectorField(),
      ],
      vectorSearch: baseVectorSearch(),
    },
  ];
}
