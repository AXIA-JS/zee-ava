/**
 * @packageDocumentation
 * @module API-AVM-CreateAssetTx
 */
import { Buffer } from 'buffer/';
import { TransferableOutput } from './outputs';
import { TransferableInput } from './inputs';
import { InitialStates } from './initialstates';
import { BaseTx } from './basetx';
import { SerializedEncoding } from '../../utils/serialization';
export declare class CreateAssetTx extends BaseTx {
    protected _typeName: string;
    protected _codecID: number;
    protected _typeID: number;
    serialize(encoding?: SerializedEncoding): object;
    deserialize(fields: object, encoding?: SerializedEncoding): void;
    protected name: string;
    protected symbol: string;
    protected denomination: Buffer;
    protected initialstate: InitialStates;
    setCodecID(codecID: number): void;
    /**
     * Returns the id of the [[CreateAssetTx]]
     */
    getTxType: () => number;
    /**
     * Returns the array of array of [[Output]]s for the initial state
     */
    getInitialStates: () => InitialStates;
    /**
     * Returns the string representation of the name
     */
    getName: () => string;
    /**
     * Returns the string representation of the symbol
     */
    getSymbol: () => string;
    /**
     * Returns the numeric representation of the denomination
     */
    getDenomination: () => number;
    /**
     * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the denomination
     */
    getDenominationBuffer: () => Buffer;
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[CreateAssetTx]], parses it, populates the class, and returns the length of the [[CreateAssetTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[CreateAssetTx]]
     *
     * @returns The length of the raw [[CreateAssetTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes: Buffer, offset?: number): number;
    /**
       * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateAssetTx]].
       */
    toBuffer(): Buffer;
    clone(): this;
    create(...args: any[]): this;
    /**
     * Class representing an unsigned Create Asset transaction.
     *
     * @param networkid Optional networkid, [[DefaultNetworkID]]
     * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param name String for the descriptive name of the asset
     * @param symbol String for the ticker symbol of the asset
     * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AXC = 10^9 $nAXC
     * @param initialstate Optional [[InitialStates]] that represent the intial state of a created asset
     */
    constructor(networkid?: number, blockchainid?: Buffer, outs?: Array<TransferableOutput>, ins?: Array<TransferableInput>, memo?: Buffer, name?: string, symbol?: string, denomination?: number, initialstate?: InitialStates);
}
//# sourceMappingURL=createassettx.d.ts.map