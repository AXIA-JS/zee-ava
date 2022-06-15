/**
 * @packageDocumentation
 * @module API-PlatformVM-CreateAllyChainTx
 */
import { Buffer } from "buffer/"
import { BaseTx } from "./basetx"
import { PlatformVMConstants } from "./constants"
import { DefaultNetworkID } from "../../utils/constants"
import { TransferableOutput, SECPOwnerOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { SerializedEncoding } from "../../utils/serialization"
import { AllyChainOwnerError } from "../../utils/errors"

export class CreateAllyChainTx extends BaseTx {
  protected _typeName = "CreateAllyChainTx"
  protected _typeID = PlatformVMConstants.CREATEALLYCHAINTX

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      allyChainOwners: this.allyChainOwners.serialize(encoding)
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.allyChainOwners = new SECPOwnerOutput()
    this.allyChainOwners.deserialize(fields["allyChainOwners"], encoding)
  }

  protected allyChainOwners: SECPOwnerOutput = undefined

  /**
   * Returns the id of the [[CreateAllyChainTx]]
   */
  getTxType(): number {
    return this._typeID
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} for the reward address.
   */
  getAllyChainOwners(): SECPOwnerOutput {
    return this.allyChainOwners
  }

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
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)
    offset += 4
    this.allyChainOwners = new SECPOwnerOutput()
    offset = this.allyChainOwners.fromBuffer(bytes, offset)
    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateAllyChainTx]].
   */
  toBuffer(): Buffer {
    if (
      typeof this.allyChainOwners === "undefined" ||
      !(this.allyChainOwners instanceof SECPOwnerOutput)
    ) {
      throw new AllyChainOwnerError(
        "CreateAllyChainTx.toBuffer -- this.allyChainOwners is not a SECPOwnerOutput"
      )
    }
    let typeID: Buffer = Buffer.alloc(4)
    typeID.writeUInt32BE(this.allyChainOwners.getOutputID(), 0)
    let barr: Buffer[] = [
      super.toBuffer(),
      typeID,
      this.allyChainOwners.toBuffer()
    ]
    return Buffer.concat(barr)
  }

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
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    allyChainOwners: SECPOwnerOutput = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)
    this.allyChainOwners = allyChainOwners
  }
}
