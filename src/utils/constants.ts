/**
 * @packageDocumentation
 * @module Utils-Constants
 */

import BN from "bn.js"

export const PrivateKeyPrefix: string = "PrivateKey-"
export const NodeIDPrefix: string = "NodeID-"
export const PrimaryAssetAlias: string = "AXC"
export const MainnetAPI: string = "api.avax.network"
export const TestnetAPI: string = "rpc-v2.canarytest.axiacoin.network"

export interface AX {
  blockchainID: string
  alias: string
  vm: string
  fee?: BN
  gasPrice: BN | number
  chainID?: number
  minGasPrice?: BN
  maxGasPrice?: BN
  txBytesGas?: number
  costPerSignature?: number
  txFee?: BN
  axcAssetID?: string
}
export interface Swap {
  blockchainID: string
  alias: string
  vm: string
  creationTxFee: BN | number
  mintTxFee: BN
  axcAssetID?: string
  txFee?: BN | number
  fee?: BN
}
export interface Core {
  blockchainID: string
  alias: string
  vm: string
  creationTxFee: BN | number
  createAllychainTx: BN | number
  createChainTx: BN | number
  minConsumption: number
  maxConsumption: number
  maxStakingDuration: BN
  maxSupply: BN
  minStake: BN
  minStakeDuration: number
  maxStakeDuration: number
  minDelegationStake: BN
  minDelegationFee: BN
  axcAssetID?: string
  txFee?: BN | number
  fee?: BN
}
export interface Network {
  AX: AX
  hrp: string
  Swap: Swap
  Core: Core
  [key: string]: AX | Swap | Core | string
}
export interface Networks {
  [key: number]: Network
}

export const NetworkIDToHRP: object = {
  0: "custom",
  1: "axc",
  2: "cascade",
  3: "denali",
  4: "everest",
  5: "fuji",
  1337: "custom",
  12345: "local"
}

export const HRPToNetworkID: object = {
  manhattan: 0,
  axc: 1,
  cascade: 2,
  denali: 3,
  everest: 4,
  fuji: 5,
  custom: 1337,
  local: 12345
}

export const NetworkIDToNetworkNames: object = {
  0: ["Manhattan"],
  1: ["Axia", "Mainnet"],
  2: ["Cascade"],
  3: ["Denali"],
  4: ["Everest"],
  5: ["Fuji", "Testnet"],
  1337: ["Custom Network"],
  12345: ["Local Network"]
}

export const NetworkNameToNetworkID: object = {
  Manhattan: 0,
  Axia: 1,
  Mainnet: 1,
  Cascade: 2,
  Denali: 3,
  Everest: 4,
  Fuji: 5,
  Custom: 1337,
  "Custom Network": 1337,
  Local: 12345,
  "Local Network": 12345
}

export const FallbackHRP: string = "custom"
export const FallbackNetworkName: string = "Custom Network"
export const FallbackEVMChainID: number = 43112

export const DefaultNetworkID: number = 1

export const PlatformChainID: string = "11111111111111111111111111111111LpoYY"
export const PrimaryNetworkID: string = "11111111111111111111111111111111LpoYY"
export const SwapChainAlias: string = "Swap"
export const AXChainAlias: string = "AX"
export const CoreChainAlias: string = "Core"
export const SwapChainVMName: string = "avm"
export const AXChainVMName: string = "evm"
export const CoreChainVMName: string = "platformvm"

// DO NOT use the following private keys and/or mnemonic on Fuji or Testnet
// This address/account is for testing on the local avash network
export const DefaultLocalGenesisPrivateKey: string =
  "ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
export const DefaultEVMLocalGenesisPrivateKey: string =
  "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
export const DefaultEVMLocalGenesisAddress: string =
  "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
export const mnemonic: string =
  "output tooth keep tooth bracket fox city sustain blood raise install pond stem reject long scene clap gloom purpose mean music piece unknown light"

export const ONEAXC: BN = new BN(1000000000)

export const DECIAXC: BN = ONEAXC.div(new BN(10))

export const CENTIAXC: BN = ONEAXC.div(new BN(100))

export const MILLIAXC: BN = ONEAXC.div(new BN(1000))

export const MICROAXC: BN = ONEAXC.div(new BN(1000000))

export const NANOAXC: BN = ONEAXC.div(new BN(1000000000))

export const WEI: BN = new BN(1)

export const GWEI: BN = WEI.mul(new BN(1000000000))

export const AXCGWEI: BN = NANOAXC.clone()

export const AXCSTAKECAP: BN = ONEAXC.mul(new BN(3000000))

// Start Manhattan
const n0X: Swap = {
  blockchainID: "2vrXWHgGxh5n3YsLHMV16YVVJTpT4z45Fmb4y3bL6si8kLCyg9",
  alias: SwapChainAlias,
  vm: SwapChainVMName,
  fee: MILLIAXC,
  creationTxFee: CENTIAXC,
  mintTxFee: MILLIAXC
}

const n0P: Core = {
  blockchainID: PlatformChainID,
  alias: CoreChainAlias,
  vm: CoreChainVMName,
  fee: MILLIAXC,
  creationTxFee: CENTIAXC,
  createAllychainTx: ONEAXC,
  createChainTx: ONEAXC,
  minConsumption: 0.1,
  maxConsumption: 0.12,
  maxStakingDuration: new BN(31536000),
  maxSupply: new BN(720000000).mul(ONEAXC),
  minStake: ONEAXC.mul(new BN(2000)),
  minStakeDuration: 2 * 7 * 24 * 60 * 60, //two weeks
  maxStakeDuration: 365 * 24 * 60 * 60, // one year
  minDelegationStake: ONEAXC.mul(new BN(25)),
  minDelegationFee: new BN(2)
}

const n0C: AX = {
  blockchainID: "2fFZQibQXcd6LTE4rpBPBAkLVXFE91Kit8pgxaBG1mRnh5xqbb",
  alias: AXChainAlias,
  vm: AXChainVMName,
  fee: MILLIAXC,
  gasPrice: GWEI.mul(new BN(470)), //equivalent to gas price
  chainID: 43111
}
// End Manhattan

// Start mainnet
let axcAssetID: string = "FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z"
const n1X: Swap = {
  blockchainID: "2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM",
  axcAssetID: axcAssetID,
  alias: SwapChainAlias,
  vm: SwapChainVMName,
  txFee: MILLIAXC,
  creationTxFee: CENTIAXC,
  mintTxFee: MILLIAXC
}

const n1P: Core = {
  blockchainID: PlatformChainID,
  axcAssetID: axcAssetID,
  alias: CoreChainAlias,
  vm: CoreChainVMName,
  txFee: MILLIAXC,
  createAllychainTx: ONEAXC,
  createChainTx: ONEAXC,
  creationTxFee: CENTIAXC,
  minConsumption: 0.1,
  maxConsumption: 0.12,
  maxStakingDuration: new BN(31536000),
  maxSupply: new BN(720000000).mul(ONEAXC),
  minStake: ONEAXC.mul(new BN(2000)),
  minStakeDuration: 2 * 7 * 24 * 60 * 60, //two weeks
  maxStakeDuration: 365 * 24 * 60 * 60, // one year
  minDelegationStake: ONEAXC.mul(new BN(25)),
  minDelegationFee: new BN(2)
}

const n1C: AX = {
  blockchainID: "2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5",
  alias: AXChainAlias,
  vm: AXChainVMName,
  txBytesGas: 1,
  costPerSignature: 1000,
  // DEPRECATED - txFee
  // WILL BE REMOVED IN NEXT MAJOR VERSION BUMP
  txFee: MILLIAXC,
  // DEPRECATED - gasPrice
  // WILL BE REMOVED IN NEXT MAJOR VERSION BUMP
  gasPrice: GWEI.mul(new BN(225)),
  minGasPrice: GWEI.mul(new BN(25)),
  maxGasPrice: GWEI.mul(new BN(1000)),
  chainID: 43114
}
// End Mainnet

// Start Cascade
const n2X: Swap = {
  blockchainID: "4ktRjsAKxgMr2aEzv9SWmrU7Xk5FniHUrVCX4P1TZSfTLZWFM",
  alias: SwapChainAlias,
  vm: SwapChainVMName,
  txFee: 0,
  creationTxFee: 0,
  mintTxFee: new BN(0)
}

const n2P: Core = {
  blockchainID: PlatformChainID,
  alias: CoreChainAlias,
  vm: CoreChainVMName,
  txFee: 0,
  creationTxFee: 0,
  createAllychainTx: ONEAXC,
  createChainTx: ONEAXC,
  minConsumption: 0.1,
  maxConsumption: 0.12,
  maxStakingDuration: new BN(31536000),
  maxSupply: new BN(720000000).mul(ONEAXC),
  minStake: ONEAXC.mul(new BN(2000)),
  minStakeDuration: 2 * 7 * 24 * 60 * 60, //two weeks
  maxStakeDuration: 365 * 24 * 60 * 60, // one year
  minDelegationStake: ONEAXC.mul(new BN(25)),
  minDelegationFee: new BN(2)
}

const n2C: AX = {
  blockchainID: "2mUYSXfLrDtigwbzj1LxKVsHwELghc5sisoXrzJwLqAAQHF4i",
  alias: AXChainAlias,
  vm: AXChainVMName,
  gasPrice: 0
}
// End Cascade

// Start Denali
const n3X: Swap = {
  blockchainID: "rrEWX7gc7D9mwcdrdBxBTdqh1a7WDVsMuadhTZgyXfFcRz45L",
  alias: SwapChainAlias,
  vm: SwapChainVMName,
  txFee: 0,
  creationTxFee: 0,
  mintTxFee: new BN(0)
}

const n3P: Core = {
  blockchainID: "",
  alias: CoreChainAlias,
  vm: CoreChainVMName,
  txFee: 0,
  creationTxFee: 0,
  createAllychainTx: ONEAXC,
  createChainTx: ONEAXC,
  minConsumption: 0.1,
  maxConsumption: 0.12,
  maxStakingDuration: new BN(31536000),
  maxSupply: new BN(720000000).mul(ONEAXC),
  minStake: ONEAXC.mul(new BN(2000)),
  minStakeDuration: 2 * 7 * 24 * 60 * 60, //two weeks
  maxStakeDuration: 365 * 24 * 60 * 60, // one year
  minDelegationStake: ONEAXC.mul(new BN(25)),
  minDelegationFee: new BN(2)
}

const n3C: AX = {
  blockchainID: "zJytnh96Pc8rM337bBrtMvJDbEdDNjcXG3WkTNCiLp18ergm9",
  alias: AXChainAlias,
  vm: AXChainVMName,
  gasPrice: 0
}
// End Denali

// Start Everest
const n4X: Swap = {
  blockchainID: "jnUjZSRt16TcRnZzmh5aMhavwVHz3zBrSN8GfFMTQkzUnoBxC",
  alias: SwapChainAlias,
  vm: SwapChainVMName,
  txFee: MILLIAXC,
  creationTxFee: CENTIAXC,
  mintTxFee: MILLIAXC
}

const n4P: Core = {
  blockchainID: PlatformChainID,
  alias: CoreChainAlias,
  vm: CoreChainVMName,
  txFee: MILLIAXC,
  creationTxFee: CENTIAXC,
  createAllychainTx: ONEAXC,
  createChainTx: ONEAXC,
  minConsumption: 0.1,
  maxConsumption: 0.12,
  maxStakingDuration: new BN(31536000),
  maxSupply: new BN(720000000).mul(ONEAXC),
  minStake: ONEAXC.mul(new BN(2000)),
  minStakeDuration: 2 * 7 * 24 * 60 * 60, //two weeks
  maxStakeDuration: 365 * 24 * 60 * 60, // one year
  minDelegationStake: ONEAXC.mul(new BN(25)),
  minDelegationFee: new BN(2)
}

const n4C: AX = {
  blockchainID: "saMG5YgNsFxzjz4NMkEkt3bAH6hVxWdZkWcEnGB3Z15pcAmsK",
  alias: AXChainAlias,
  vm: AXChainVMName,
  gasPrice: GWEI.mul(new BN(470)),
  chainID: 43110
}
// End Everest

// Start Fuji
axcAssetID = "U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK"
const n5X: Swap = {
  blockchainID: "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
  axcAssetID: axcAssetID,
  alias: SwapChainAlias,
  vm: SwapChainVMName,
  txFee: MILLIAXC,
  creationTxFee: CENTIAXC,
  mintTxFee: MILLIAXC
}

const n5P: Core = {
  blockchainID: PlatformChainID,
  axcAssetID: axcAssetID,
  alias: CoreChainAlias,
  vm: CoreChainVMName,
  txFee: MILLIAXC,
  creationTxFee: CENTIAXC,
  createAllychainTx: ONEAXC,
  createChainTx: ONEAXC,
  minConsumption: 0.1,
  maxConsumption: 0.12,
  maxStakingDuration: new BN(31536000),
  maxSupply: new BN(720000000).mul(ONEAXC),
  minStake: ONEAXC,
  minStakeDuration: 24 * 60 * 60, //one day
  maxStakeDuration: 365 * 24 * 60 * 60, // one year
  minDelegationStake: ONEAXC,
  minDelegationFee: new BN(2)
}

const n5C: AX = {
  blockchainID: "yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp",
  alias: AXChainAlias,
  vm: AXChainVMName,
  txBytesGas: 1,
  costPerSignature: 1000,
  // DEPRECATED - txFee
  // WILL BE REMOVED IN NEXT MAJOR VERSION BUMP
  txFee: MILLIAXC,
  // DEPRECATED - gasPrice
  // WILL BE REMOVED IN NEXT MAJOR VERSION BUMP
  gasPrice: GWEI.mul(new BN(225)),
  minGasPrice: GWEI.mul(new BN(25)),
  maxGasPrice: GWEI.mul(new BN(1000)),
  chainID: 43113
}
// End Fuji

// Start Testnet
axcAssetID = "U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK"
const n5678X: Swap = {
  blockchainID: "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
  axcAssetID: axcAssetID,
  alias: SwapChainAlias,
  vm: SwapChainVMName,
  txFee: MILLIAXC,
  creationTxFee: CENTIAXC,
  mintTxFee: MILLIAXC
}

const n5678P: Core = {
  blockchainID: PlatformChainID,
  axcAssetID: axcAssetID,
  alias: CoreChainAlias,
  vm: CoreChainVMName,
  txFee: MILLIAXC,
  creationTxFee: CENTIAXC,
  createAllychainTx: ONEAXC,
  createChainTx: ONEAXC,
  minConsumption: 0.1,
  maxConsumption: 0.12,
  maxStakingDuration: new BN(31536000),
  maxSupply: new BN(720000000).mul(ONEAXC),
  minStake: ONEAXC,
  minStakeDuration: 24 * 60 * 60, //one day
  maxStakeDuration: 365 * 24 * 60 * 60, // one year
  minDelegationStake: ONEAXC,
  minDelegationFee: new BN(2)
}

const n5678C: AX = {
  blockchainID: "yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp",
  alias: AXChainAlias,
  vm: AXChainVMName,
  txBytesGas: 1,
  costPerSignature: 1000,
  // DEPRECATED - txFee
  // WILL BE REMOVED IN NEXT MAJOR VERSION BUMP
  txFee: MILLIAXC,
  // DEPRECATED - gasPrice
  // WILL BE REMOVED IN NEXT MAJOR VERSION BUMP
  gasPrice: GWEI.mul(new BN(225)),
  minGasPrice: GWEI.mul(new BN(25)),
  maxGasPrice: GWEI.mul(new BN(1000)),
  chainID: 4000
}
// End Testnet

// Start custom network
axcAssetID = "BUuypiq2wyuLMvyhzFXcPyxPMCgSp7eeDohhQRqTChoBjKziC"
const n1337X: Swap = { ...n5X }
n1337X.blockchainID = "qzfF3A11KzpcHkkqznEyQgupQrCNS6WV6fTUTwZpEKqhj1QE7"
n1337X.axcAssetID = axcAssetID
const n1337P: Core = { ...n5P }
n1337P.blockchainID = PlatformChainID
const n1337C: AX = { ...n5C }
n1337C.blockchainID = "BR28ypgLATNS6PbtHMiJ7NQ61vfpT27Hj8tAcZ1AHsfU5cz88"
n1337C.axcAssetID = axcAssetID
n1337C.chainID = 43112
// End custom network

// Start local network
axcAssetID = "2fombhL7aGPwj3KH4bfrmJwW6PVnMobf9Y2fn9GwxiAAJyFDbe"
const n12345X: Swap = { ...n5X }
n12345X.blockchainID = "2eNy1mUFdmaxXNj1eQHUe7Np4gju9sJsEtWQ4MX3ToiNKuADed"
n12345X.axcAssetID = axcAssetID
const n12345P: Core = { ...n5P }
n12345P.blockchainID = PlatformChainID
const n12345C: AX = { ...n5C }
n12345C.blockchainID = "2CA6j5zYzasynPsFeNoqWkmTCt3VScMvXUZHbfDJ8k3oGzAPtU"
n12345C.axcAssetID = axcAssetID
n12345C.chainID = 43112
// End local network

export class Defaults {
  static network: Networks = {
    0: {
      hrp: NetworkIDToHRP[0],
      Swap: n0X,
      "2vrXWHgGxh5n3YsLHMV16YVVJTpT4z45Fmb4y3bL6si8kLCyg9": n0X,
      Core: n0P,
      "11111111111111111111111111111111LpoYY": n0P,
      AX: n0C,
      "2fFZQibQXcd6LTE4rpBPBAkLVXFE91Kit8pgxaBG1mRnh5xqbb": n0C
    },
    1: {
      hrp: NetworkIDToHRP[1],
      Swap: n1X,
      "2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM": n1X,
      Core: n1P,
      "11111111111111111111111111111111LpoYY": n1P,
      AX: n1C,
      "2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5": n1C
    },
    2: {
      hrp: NetworkIDToHRP[2],
      Swap: n2X,
      "4ktRjsAKxgMr2aEzv9SWmrU7Xk5FniHUrVCX4P1TZSfTLZWFM": n2X,
      Core: n2P,
      "11111111111111111111111111111111LpoYY": n2P,
      AX: n2C,
      "2mUYSXfLrDtigwbzj1LxKVsHwELghc5sisoXrzJwLqAAQHF4i": n2C
    },
    3: {
      hrp: NetworkIDToHRP[3],
      Swap: n3X,
      rrEWX7gc7D9mwcdrdBxBTdqh1a7WDVsMuadhTZgyXfFcRz45L: n3X,
      Core: n3P,
      "11111111111111111111111111111111LpoYY": n3P,
      AX: n3C,
      zJytnh96Pc8rM337bBrtMvJDbEdDNjcXG3WkTNCiLp18ergm9: n3C
    },
    4: {
      hrp: NetworkIDToHRP[4],
      Swap: n4X,
      jnUjZSRt16TcRnZzmh5aMhavwVHz3zBrSN8GfFMTQkzUnoBxC: n4X,
      Core: n4P,
      "11111111111111111111111111111111LpoYY": n4P,
      AX: n4C,
      saMG5YgNsFxzjz4NMkEkt3bAH6hVxWdZkWcEnGB3Z15pcAmsK: n4C
    },
    5: {
      hrp: NetworkIDToHRP[5],
      Swap: n5X,
      "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm": n5X,
      Core: n5P,
      "11111111111111111111111111111111LpoYY": n5P,
      AX: n5C,
      yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp: n5C
    },
    1337: {
      hrp: NetworkIDToHRP[1337],
      Swap: n1337X,
      qzfF3A11KzpcHkkqznEyQgupQrCNS6WV6fTUTwZpEKqhj1QE7: n1337X,
      Core: n1337P,
      "11111111111111111111111111111111LpoYY": n1337P,
      AX: n1337C,
      BR28ypgLATNS6PbtHMiJ7NQ61vfpT27Hj8tAcZ1AHsfU5cz88: n1337C
    },
    5678: {
      hrp: exports.NetworkIDToHRP[0],
      Swap: n5678X,
      "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm": n5678X,
      Core: n5678P,
      "11111111111111111111111111111111LpoYY": n5678P,
      AX: n5678C,
      yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp: n5678C
    },
    12345: {
      hrp: NetworkIDToHRP[12345],
      Swap: n12345X,
      "2eNy1mUFdmaxXNj1eQHUe7Np4gju9sJsEtWQ4MX3ToiNKuADed": n12345X,
      Core: n12345P,
      "11111111111111111111111111111111LpoYY": n12345P,
      AX: n12345C,
      "2CA6j5zYzasynPsFeNoqWkmTCt3VScMvXUZHbfDJ8k3oGzAPtU": n12345C
    }
  }
}

/**
 * Rules used when merging sets
 */
export type MergeRule =
  | "intersection" // Self INTERSECT New
  | "differenceSelf" // Self MINUS New
  | "differenceNew" // New MINUS Self
  | "symDifference" // differenceSelf UNION differenceNew
  | "union" // Self UNION New
  | "unionMinusNew" // union MINUS differenceNew
  | "unionMinusSelf" // union MINUS differenceSelf
  | "ERROR" // generate error for testing
