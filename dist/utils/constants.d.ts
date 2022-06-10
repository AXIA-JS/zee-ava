/**
 * @packageDocumentation
 * @module Utils-Constants
 */
import BN from "bn.js";
export declare const PrivateKeyPrefix: string;
export declare const NodeIDPrefix: string;
export declare const PrimaryAssetAlias: string;
export declare const MainnetAPI: string;
export declare const FujiAPI: string;
export interface C {
    blockchainID: string;
    alias: string;
    vm: string;
    fee?: BN;
    gasPrice: BN | number;
    chainID?: number;
    minGasPrice?: BN;
    maxGasPrice?: BN;
    txBytesGas?: number;
    costPerSignature?: number;
    txFee?: BN;
    axcAssetID?: string;
}
export interface X {
    blockchainID: string;
    alias: string;
    vm: string;
    creationTxFee: BN | number;
    mintTxFee: BN;
    axcAssetID?: string;
    txFee?: BN | number;
    fee?: BN;
}
export interface P {
    blockchainID: string;
    alias: string;
    vm: string;
    creationTxFee: BN | number;
    createSubnetTx: BN | number;
    createChainTx: BN | number;
    minConsumption: number;
    maxConsumption: number;
    maxStakingDuration: BN;
    maxSupply: BN;
    minStake: BN;
    minStakeDuration: number;
    maxStakeDuration: number;
    minDelegationStake: BN;
    minDelegationFee: BN;
    axcAssetID?: string;
    txFee?: BN | number;
    fee?: BN;
}
export interface Network {
    C: C;
    hrp: string;
    X: X;
    P: P;
    [key: string]: C | X | P | string;
}
export interface Networks {
    [key: number]: Network;
}
export declare const NetworkIDToHRP: object;
export declare const HRPToNetworkID: object;
export declare const NetworkIDToNetworkNames: object;
export declare const NetworkNameToNetworkID: object;
export declare const FallbackHRP: string;
export declare const FallbackNetworkName: string;
export declare const FallbackEVMChainID: number;
export declare const DefaultNetworkID: number;
export declare const PlatformChainID: string;
export declare const PrimaryNetworkID: string;
export declare const XChainAlias: string;
export declare const CChainAlias: string;
export declare const PChainAlias: string;
export declare const XChainVMName: string;
export declare const CChainVMName: string;
export declare const PChainVMName: string;
export declare const DefaultLocalGenesisPrivateKey: string;
export declare const DefaultEVMLocalGenesisPrivateKey: string;
export declare const DefaultEVMLocalGenesisAddress: string;
export declare const mnemonic: string;
export declare const ONEAXC: BN;
export declare const DECIAXC: BN;
export declare const CENTIAXC: BN;
export declare const MILLIAXC: BN;
export declare const MICROAXC: BN;
export declare const NANOAXC: BN;
export declare const WEI: BN;
export declare const GWEI: BN;
export declare const AXCGWEI: BN;
export declare const AXCSTAKECAP: BN;
export declare class Defaults {
    static network: Networks;
}
/**
 * Rules used when merging sets
 */
export declare type MergeRule = "intersection" | "differenceSelf" | "differenceNew" | "symDifference" | "union" | "unionMinusNew" | "unionMinusSelf" | "ERROR";
//# sourceMappingURL=constants.d.ts.map