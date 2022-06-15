/**
 * @packageDocumentation
 * @module API-PlatformVM-CreateAllyChainTx
 */
import { Buffer } from "buffer/";
import { BaseTx } from "./basetx";
import { TransferableOutput, SECPOwnerOutput } from "./outputs";
import { TransferableInput } from "./inputs";
import { SerializedEncoding } from "../../utils/serialization";
export declare class CreateAllyChainTx extends BaseTx {
    protected _typeName: string;
    protected _typeID: number;
    serialize(encoding?: SerializedEncoding): object;
    deserialize(fields: object, encoding?: SerializedEncoding): void;
    protected allyChainOwners: SECPOwnerOutput;
    /**
     * Returns the id of the [[CreateAllyChainTx]]
     */
    getTxType(): number;
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the reward address.
     */
    getAllyChainOwners(): SECPOwnerOutput;
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[CreateAllyChainTx]], parses it, populates the class, and returns the length of the [[CreateAllyChainTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[CreateAllyChainTx]]
     * @param offset A number for the starting position in the bytes.
     *
     * @returns The length of the raw [[CreateAllyChainTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes: Buffer, offset?: number): number;
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateAllyChainTx]].
     */
    toBuffer(): Buffer;
    /**
     * Class representing an unsigned Create AllyChain transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param allyChainOwners Optional [[SECPOwnerOutput]] class for specifying who owns the allyChain.
     */
    constructor(networkID?: number, blockchainID?: Buffer, outs?: TransferableOutput[], ins?: TransferableInput[], memo?: Buffer, allyChainOwners?: SECPOwnerOutput);
}
//# sourceMappingURL=createallyChaintx.d.ts.map