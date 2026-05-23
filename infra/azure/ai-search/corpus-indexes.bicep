@description('Azure AI Search service name that hosts corpus indexes.')
param searchServiceName string

@description('Location for the Azure AI Search service.')
param location string = resourceGroup().location

@description('Existing Search SKU. Basic is enough for lab; production should use Standard or above.')
param skuName string = 'standard'

@description('Client IDs that should receive dedicated private corpus indexes.')
param activeClientIds array = []

var vectorProfileName = 'corpus-hybrid-vector-profile'
var vectorAlgorithmName = 'corpus-hnsw'
var semanticConfigName = 'corpus-semantic'
var scoringProfileName = 'corpus-hybrid-rrf'
var embeddingDimensions = 1536

resource searchService 'Microsoft.Search/searchServices@2023-11-01' existing = {
  name: searchServiceName
}

var corpusFields = [
  {
    name: 'id'
    type: 'Edm.String'
    key: true
    filterable: true
    sortable: false
    facetable: false
    searchable: false
    retrievable: true
  }
  {
    name: 'slug'
    type: 'Edm.String'
    key: false
    filterable: true
    sortable: true
    facetable: false
    searchable: true
    retrievable: true
    analyzer: 'en.lucene'
  }
  {
    name: 'title'
    type: 'Edm.String'
    key: false
    filterable: false
    sortable: true
    facetable: false
    searchable: true
    retrievable: true
    analyzer: 'en.lucene'
  }
  {
    name: 'category'
    type: 'Edm.String'
    key: false
    filterable: true
    sortable: true
    facetable: true
    searchable: true
    retrievable: true
    analyzer: 'en.lucene'
  }
  {
    name: 'body'
    type: 'Edm.String'
    key: false
    filterable: false
    sortable: false
    facetable: false
    searchable: true
    retrievable: true
    analyzer: 'en.lucene'
  }
  {
    name: 'embedding'
    type: 'Collection(Edm.Single)'
    key: false
    filterable: false
    sortable: false
    facetable: false
    searchable: true
    retrievable: false
    dimensions: embeddingDimensions
    vectorSearchProfile: vectorProfileName
  }
  {
    name: 'confidence'
    type: 'Edm.Double'
    filterable: true
    sortable: true
    facetable: false
    searchable: false
    retrievable: true
  }
  {
    name: 'depth_score'
    type: 'Edm.Double'
    filterable: true
    sortable: true
    facetable: false
    searchable: false
    retrievable: true
  }
  {
    name: 'vertical_overlays'
    type: 'Collection(Edm.String)'
    filterable: true
    sortable: false
    facetable: true
    searchable: true
    retrievable: true
  }
  {
    name: 'region_overlays'
    type: 'Collection(Edm.String)'
    filterable: true
    sortable: false
    facetable: true
    searchable: true
    retrievable: true
  }
  {
    name: 'version'
    type: 'Edm.Int32'
    filterable: true
    sortable: true
    facetable: false
    searchable: false
    retrievable: true
  }
  {
    name: 'client_id'
    type: 'Edm.String'
    filterable: true
    sortable: true
    facetable: true
    searchable: false
    retrievable: true
  }
]

var corpusIndexTemplate = {
  fields: corpusFields
  semantic: {
    configurations: [
      {
        name: semanticConfigName
        prioritizedFields: {
          titleField: {
            fieldName: 'title'
          }
          prioritizedContentFields: [
            {
              fieldName: 'body'
            }
          ]
          prioritizedKeywordsFields: [
            {
              fieldName: 'category'
            }
            {
              fieldName: 'vertical_overlays'
            }
            {
              fieldName: 'region_overlays'
            }
          ]
        }
      }
    ]
  }
  vectorSearch: {
    algorithms: [
      {
        name: vectorAlgorithmName
        kind: 'hnsw'
        hnswParameters: {
          metric: 'cosine'
          m: 4
          efConstruction: 400
          efSearch: 500
        }
      }
    ]
    profiles: [
      {
        name: vectorProfileName
        algorithm: vectorAlgorithmName
      }
    ]
  }
  scoringProfiles: [
    {
      name: scoringProfileName
      text: {
        weights: {
          title: 4
          category: 2
          body: 1
        }
      }
      functions: [
        {
          type: 'magnitude'
          fieldName: 'confidence'
          boost: 1.5
          interpolation: 'linear'
          magnitude: {
            boostingRangeStart: 0.5
            boostingRangeEnd: 1
            constantBoostBeyondRange: true
          }
        }
        {
          type: 'magnitude'
          fieldName: 'depth_score'
          boost: 2
          interpolation: 'linear'
          magnitude: {
            boostingRangeStart: 7
            boostingRangeEnd: 10
            constantBoostBeyondRange: true
          }
        }
      ]
    }
  ]
}

resource globalCorpusIndex 'Microsoft.Search/searchServices/indexes@2023-11-01' = {
  parent: searchService
  name: 'corpus-global'
  properties: corpusIndexTemplate
}

resource clientCorpusIndexes 'Microsoft.Search/searchServices/indexes@2023-11-01' = [for clientId in activeClientIds: {
  parent: searchService
  name: 'corpus-client-${clientId}'
  properties: corpusIndexTemplate
}]

output globalIndexName string = globalCorpusIndex.name
output clientIndexNames array = [for (clientId, i) in activeClientIds: clientCorpusIndexes[i].name]
