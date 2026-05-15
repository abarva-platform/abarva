targetScope = 'resourceGroup'

param localVnetName string
param remoteVnetResourceId string
param peeringName string
param allowForwardedTraffic bool = false

resource localVnet 'Microsoft.Network/virtualNetworks@2023-11-01' existing = {
  name: localVnetName
}

resource vnetPeering 'Microsoft.Network/virtualNetworks/virtualNetworkPeerings@2023-11-01' = {
  parent: localVnet
  name: peeringName
  properties: {
    allowVirtualNetworkAccess: true
    allowForwardedTraffic: allowForwardedTraffic
    allowGatewayTransit: false
    useRemoteGateways: false
    remoteVirtualNetwork: {
      id: remoteVnetResourceId
    }
  }
}

output peeringResourceId string = vnetPeering.id
