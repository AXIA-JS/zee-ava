/**
 * @packageDocumentation
 * @module API-PlatformVM-CreateAllychainTx
 */
import { Buffer } from "buffer/"
import { BaseTx } from "./basetx"
import { PlatformVMConstants } from "./constants"
import { DefaultNetworkID } from "../../utils/constants"
import { TransferableOutput, SECPOwnerOutput } from "./outputs"
import { TransferableInput } from "./inputs"
import { SerializedEncoding } from "../../utils/serialization"
import { AllychainOwnerError } from "../../utils/errors"

export class CreateAllychainTx extends BaseTx {
  protected _typeName = "CreateAllychainTx"
  protected _typeID = PlatformVMConstants.CREATEALLYCHAINTX

  serialize(encoding: SerializedEncoding = "hex"): object {
    let fields: object = super.serialize(encoding)
    return {
      ...fields,
      allychainOwners: this.allychainOwners.serialize(encoding)
    }
  }
  deserialize(fields: object, encoding: SerializedEncoding = "hex") {
    super.deserialize(fields, encoding)
    this.allychainOwners = new SECPOwnerOutput()
    this.allychainOwners.deserialize(fields["allychainOwners"], encoding)
  }

  protected allychainOwners: SECPOwnerOutput = undefined

  /**
   * Returns the id of the [[CreateAllychainTx]]
   */
  getTxType(): number {
    return this._typeID
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} for the reward address.
   */
  getAllychainOwners(): SECPOwnerOutput {
    return this.allychainOwners
  }

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
  fromBuffer(bytes: Buffer, offset: number = 0): number {
    offset = super.fromBuffer(bytes, offset)
    offset += 4
    this.allychainOwners = new SECPOwnerOutput()
    offset = this.allychainOwners.fromBuffer(bytes, offset)
    return offset
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateAllychainTx]].
   */
  toBuffer(): Buffer {
    if (
      typeof this.allychainOwners === "undefined" ||
      !(this.allychainOwners instanceof SECPOwnerOutput)
    ) {
      throw new AllychainOwnerError(
        "CreateAllychainTx.toBuffer -- this.allychainOwners is not a SECPOwnerOutput"
      )
    }
    let typeID: Buffer = Buffer.alloc(4)
    typeID.writeUInt32BE(this.allychainOwners.getOutputID(), 0)
    let barr: Buffer[] = [
      super.toBuffer(),
      typeID,
      this.allychainOwners.toBuffer()
    ]
    return Buffer.concat(barr)
  }

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
  constructor(
    networkID: number = DefaultNetworkID,
    blockchainID: Buffer = Buffer.alloc(32, 16),
    outs: TransferableOutput[] = undefined,
    ins: TransferableInput[] = undefined,
    memo: Buffer = undefined,
    allychainOwners: SECPOwnerOutput = undefined
  ) {
    super(networkID, blockchainID, outs, ins, memo)
    this.allychainOwners = allychainOwners
  }
}
