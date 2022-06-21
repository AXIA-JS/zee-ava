/**
 * @packageDocumentation
 * @module API-PlatformVM-CreateAllychainTx
 */
import { Buffer } from "buffer/";
import { BaseTx } from "./basetx";
import { TransferableOutput, SECPOwnerOutput } from "./outputs";
import { TransferableInput } from "./inputs";
import { SerializedEncoding } from "../../utils/serialization";
export declare class CreateAllychainTx extends BaseTx {
    protected _typeName: string;
    protected _typeID: number;
    serialize(encoding?: SerializedEncoding): object;
    deserialize(fields: object, encoding?: SerializedEncoding): void;
    protected allychainOwners: SECPOwnerOutput;
    /**
     * Returns the id of the [[CreateAllychainTx]]
     */
    getTxType(): number;
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the reward address.
     */
    getAllychainOwners(): SECPOwnerOutput;
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[CreateAllychainTx]], parses it, populates the class, and returns the length of the [[CreateAllychainTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[CreateAllychainTx]]
     * @param offset A number for the starting position in the bytes.
     *
     * @returns The length of the raw [[CreateAllychainTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes: Buffer, offset?: number): number;
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateAllychainTx]].
     */
    toBuffer(): Buffer;
    /**
     * Class representing an unsigned Create Allychain transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param allychainOwners Optional [[SECPOwnerOutput]] class for specifying who owns the allychain.
     */
    constructor(networkID?: number, blockchainID?: Buffer, outs?: TransferableOutput[], ins?: TransferableInput[], memo?: Buffer, allychainOwners?: SECPOwnerOutput);
}
//# sourceMappingURL=createallychaintx.d.ts.map