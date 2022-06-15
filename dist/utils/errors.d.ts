export declare class AxiaError extends Error {
    errorCode: string;
    constructor(m: string, code: string);
    getCode(): string;
}
export declare class AddressError extends AxiaError {
    constructor(m: string);
}
export declare class GooseEggCheckError extends AxiaError {
    constructor(m: string);
}
export declare class ChainIdError extends AxiaError {
    constructor(m: string);
}
export declare class NoAtomicUTXOsError extends AxiaError {
    constructor(m: string);
}
export declare class SymbolError extends AxiaError {
    constructor(m: string);
}
export declare class NameError extends AxiaError {
    constructor(m: string);
}
export declare class TransactionError extends AxiaError {
    constructor(m: string);
}
export declare class CodecIdError extends AxiaError {
    constructor(m: string);
}
export declare class CredIdError extends AxiaError {
    constructor(m: string);
}
export declare class TransferableOutputError extends AxiaError {
    constructor(m: string);
}
export declare class TransferableInputError extends AxiaError {
    constructor(m: string);
}
export declare class InputIdError extends AxiaError {
    constructor(m: string);
}
export declare class OperationError extends AxiaError {
    constructor(m: string);
}
export declare class InvalidOperationIdError extends AxiaError {
    constructor(m: string);
}
export declare class ChecksumError extends AxiaError {
    constructor(m: string);
}
export declare class OutputIdError extends AxiaError {
    constructor(m: string);
}
export declare class UTXOError extends AxiaError {
    constructor(m: string);
}
export declare class InsufficientFundsError extends AxiaError {
    constructor(m: string);
}
export declare class ThresholdError extends AxiaError {
    constructor(m: string);
}
export declare class SECPMintOutputError extends AxiaError {
    constructor(m: string);
}
export declare class EVMInputError extends AxiaError {
    constructor(m: string);
}
export declare class EVMOutputError extends AxiaError {
    constructor(m: string);
}
export declare class FeeAssetError extends AxiaError {
    constructor(m: string);
}
export declare class StakeError extends AxiaError {
    constructor(m: string);
}
export declare class TimeError extends AxiaError {
    constructor(m: string);
}
export declare class DelegationFeeError extends AxiaError {
    constructor(m: string);
}
export declare class SubnetOwnerError extends AxiaError {
    constructor(m: string);
}
export declare class BufferSizeError extends AxiaError {
    constructor(m: string);
}
export declare class AddressIndexError extends AxiaError {
    constructor(m: string);
}
export declare class PublicKeyError extends AxiaError {
    constructor(m: string);
}
export declare class MergeRuleError extends AxiaError {
    constructor(m: string);
}
export declare class Base58Error extends AxiaError {
    constructor(m: string);
}
export declare class PrivateKeyError extends AxiaError {
    constructor(m: string);
}
export declare class NodeIdError extends AxiaError {
    constructor(m: string);
}
export declare class HexError extends AxiaError {
    constructor(m: string);
}
export declare class TypeIdError extends AxiaError {
    constructor(m: string);
}
export declare class TypeNameError extends AxiaError {
    constructor(m: string);
}
export declare class UnknownTypeError extends AxiaError {
    constructor(m: string);
}
export declare class Bech32Error extends AxiaError {
    constructor(m: string);
}
export declare class EVMFeeError extends AxiaError {
    constructor(m: string);
}
export declare class InvalidEntropy extends AxiaError {
    constructor(m: string);
}
export declare class ProtocolError extends AxiaError {
    constructor(m: string);
}
export declare class SubnetIdError extends AxiaError {
    constructor(m: string);
}
export declare class SubnetThresholdError extends AxiaError {
    constructor(m: string);
}
export declare class SubnetAddressError extends AxiaError {
    constructor(m: string);
}
export interface ErrorResponseObject {
    code: number;
    message: string;
    data?: null;
}
//# sourceMappingURL=errors.d.ts.map