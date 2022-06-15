"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTXOID = exports.NFTTransferOperation = exports.NFTMintOperation = exports.SECPMintOperation = exports.TransferableOperation = exports.Operation = exports.SelectOperationClass = void 0;
/**
 * @packageDocumentation
 * @module API-AXVM-Operations
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const outputs_1 = require("./outputs");
const nbytes_1 = require("../../common/nbytes");
const credentials_1 = require("../../common/credentials");
const output_1 = require("../../common/output");
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
const cb58 = "cb58";
const buffer = "Buffer";
const hex = "hex";
const decimalString = "decimalString";
/**
 * Takes a buffer representing the output and returns the proper [[Operation]] instance.
 *
 * @param opid A number representing the operation ID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Operation]]-extended class.
 */
const SelectOperationClass = (opid, ...args) => {
    if (opid === constants_1.AXVMConstants.SECPMINTOPID ||
        opid === constants_1.AXVMConstants.SECPMINTOPID_CODECONE) {
        return new SECPMintOperation(...args);
    }
    else if (opid === constants_1.AXVMConstants.NFTMINTOPID ||
        opid === constants_1.AXVMConstants.NFTMINTOPID_CODECONE) {
        return new NFTMintOperation(...args);
    }
    else if (opid === constants_1.AXVMConstants.NFTXFEROPID ||
        opid === constants_1.AXVMConstants.NFTXFEROPID_CODECONE) {
        return new NFTTransferOperation(...args);
    }
    /* istanbul ignore next */
    throw new errors_1.InvalidOperationIdError(`Error - SelectOperationClass: unknown opid ${opid}`);
};
exports.SelectOperationClass = SelectOperationClass;
/**
 * A class representing an operation. All operation types must extend on this class.
 */
class Operation extends serialization_1.Serializable {
    constructor() {
        super(...arguments);
        this._typeName = "Operation";
        this._typeID = undefined;
        this.sigCount = buffer_1.Buffer.alloc(4);
        this.sigIdxs = []; // idxs of signers from utxo
        /**
         * Returns the array of [[SigIdx]] for this [[Operation]]
         */
        this.getSigIdxs = () => this.sigIdxs;
        /**
         * Creates and adds a [[SigIdx]] to the [[Operation]].
         *
         * @param addressIdx The index of the address to reference in the signatures
         * @param address The address of the source of the signature
         */
        this.addSignatureIdx = (addressIdx, address) => {
            const sigidx = new credentials_1.SigIdx();
            const b = buffer_1.Buffer.alloc(4);
            b.writeUInt32BE(addressIdx, 0);
            sigidx.fromBuffer(b);
            sigidx.setSource(address);
            this.sigIdxs.push(sigidx);
            this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        };
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { sigIdxs: this.sigIdxs.map((s) => s.serialize(encoding)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.sigIdxs = fields["sigIdxs"].map((s) => {
            let sidx = new credentials_1.SigIdx();
            sidx.deserialize(s, encoding);
            return sidx;
        });
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
    }
    fromBuffer(bytes, offset = 0) {
        this.sigCount = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const sigCount = this.sigCount.readUInt32BE(0);
        this.sigIdxs = [];
        for (let i = 0; i < sigCount; i++) {
            const sigidx = new credentials_1.SigIdx();
            const sigbuff = bintools.copyFrom(bytes, offset, offset + 4);
            sigidx.fromBuffer(sigbuff);
            offset += 4;
            this.sigIdxs.push(sigidx);
        }
        return offset;
    }
    toBuffer() {
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
        let bsize = this.sigCount.length;
        const barr = [this.sigCount];
        for (let i = 0; i < this.sigIdxs.length; i++) {
            const b = this.sigIdxs[`${i}`].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns a base-58 string representing the [[NFTMintOperation]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.Operation = Operation;
Operation.comparator = () => (a, b) => {
    const aoutid = buffer_1.Buffer.alloc(4);
    aoutid.writeUInt32BE(a.getOperationID(), 0);
    const abuff = a.toBuffer();
    const boutid = buffer_1.Buffer.alloc(4);
    boutid.writeUInt32BE(b.getOperationID(), 0);
    const bbuff = b.toBuffer();
    const asort = buffer_1.Buffer.concat([aoutid, abuff], aoutid.length + abuff.length);
    const bsort = buffer_1.Buffer.concat([boutid, bbuff], boutid.length + bbuff.length);
    return buffer_1.Buffer.compare(asort, bsort);
};
/**
 * A class which contains an [[Operation]] for transfers.
 *
 */
class TransferableOperation extends serialization_1.Serializable {
    constructor(assetID = undefined, utxoids = undefined, operation = undefined) {
        super();
        this._typeName = "TransferableOperation";
        this._typeID = undefined;
        this.assetID = buffer_1.Buffer.alloc(32);
        this.utxoIDs = [];
        /**
         * Returns the assetID as a {@link https://github.com/feross/buffer|Buffer}.
         */
        this.getAssetID = () => this.assetID;
        /**
         * Returns an array of UTXOIDs in this operation.
         */
        this.getUTXOIDs = () => this.utxoIDs;
        /**
         * Returns the operation
         */
        this.getOperation = () => this.operation;
        if (typeof assetID !== "undefined" &&
            assetID.length === constants_1.AXVMConstants.ASSETIDLEN &&
            operation instanceof Operation &&
            typeof utxoids !== "undefined" &&
            Array.isArray(utxoids)) {
            this.assetID = assetID;
            this.operation = operation;
            for (let i = 0; i < utxoids.length; i++) {
                const utxoid = new UTXOID();
                if (typeof utxoids[`${i}`] === "string") {
                    utxoid.fromString(utxoids[`${i}`]);
                }
                else if (utxoids[`${i}`] instanceof buffer_1.Buffer) {
                    utxoid.fromBuffer(utxoids[`${i}`]);
                }
                else if (utxoids[`${i}`] instanceof UTXOID) {
                    utxoid.fromString(utxoids[`${i}`].toString()); // clone
                }
                this.utxoIDs.push(utxoid);
            }
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { assetID: serialization.encoder(this.assetID, encoding, buffer, cb58, 32), utxoIDs: this.utxoIDs.map((u) => u.serialize(encoding)), operation: this.operation.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.assetID = serialization.decoder(fields["assetID"], encoding, cb58, buffer, 32);
        this.utxoIDs = fields["utxoIDs"].map((u) => {
            let utxoid = new UTXOID();
            utxoid.deserialize(u, encoding);
            return utxoid;
        });
        this.operation = (0, exports.SelectOperationClass)(fields["operation"]["_typeID"]);
        this.operation.deserialize(fields["operation"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        this.assetID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        const numutxoIDs = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.utxoIDs = [];
        for (let i = 0; i < numutxoIDs; i++) {
            const utxoid = new UTXOID();
            offset = utxoid.fromBuffer(bytes, offset);
            this.utxoIDs.push(utxoid);
        }
        const opid = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.operation = (0, exports.SelectOperationClass)(opid);
        return this.operation.fromBuffer(bytes, offset);
    }
    toBuffer() {
        const numutxoIDs = buffer_1.Buffer.alloc(4);
        numutxoIDs.writeUInt32BE(this.utxoIDs.length, 0);
        let bsize = this.assetID.length + numutxoIDs.length;
        const barr = [this.assetID, numutxoIDs];
        this.utxoIDs = this.utxoIDs.sort(UTXOID.comparator());
        for (let i = 0; i < this.utxoIDs.length; i++) {
            const b = this.utxoIDs[`${i}`].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        const opid = buffer_1.Buffer.alloc(4);
        opid.writeUInt32BE(this.operation.getOperationID(), 0);
        barr.push(opid);
        bsize += opid.length;
        const b = this.operation.toBuffer();
        bsize += b.length;
        barr.push(b);
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.TransferableOperation = TransferableOperation;
/**
 * Returns a function used to sort an array of [[TransferableOperation]]s
 */
TransferableOperation.comparator = () => {
    return function (a, b) {
        return buffer_1.Buffer.compare(a.toBuffer(), b.toBuffer());
    };
};
/**
 * An [[Operation]] class which specifies a SECP256k1 Mint Op.
 */
class SECPMintOperation extends Operation {
    /**
     * An [[Operation]] class which mints new tokens on an assetID.
     *
     * @param mintOutput The [[SECPMintOutput]] that will be produced by this transaction.
     * @param transferOutput A [[SECPTransferOutput]] that will be produced from this minting operation.
     */
    constructor(mintOutput = undefined, transferOutput = undefined) {
        super();
        this._typeName = "SECPMintOperation";
        this._codecID = constants_1.AXVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.AXVMConstants.SECPMINTOPID
            : constants_1.AXVMConstants.SECPMINTOPID_CODECONE;
        this.mintOutput = undefined;
        this.transferOutput = undefined;
        if (typeof mintOutput !== "undefined") {
            this.mintOutput = mintOutput;
        }
        if (typeof transferOutput !== "undefined") {
            this.transferOutput = transferOutput;
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { mintOutput: this.mintOutput.serialize(encoding), transferOutputs: this.transferOutput.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.mintOutput = new outputs_1.SECPMintOutput();
        this.mintOutput.deserialize(fields["mintOutput"], encoding);
        this.transferOutput = new outputs_1.SECPTransferOutput();
        this.transferOutput.deserialize(fields["transferOutputs"], encoding);
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - SECPMintOperation.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.AXVMConstants.SECPMINTOPID
                : constants_1.AXVMConstants.SECPMINTOPID_CODECONE;
    }
    /**
     * Returns the operation ID.
     */
    getOperationID() {
        return this._typeID;
    }
    /**
     * Returns the credential ID.
     */
    getCredentialID() {
        if (this._codecID === 0) {
            return constants_1.AXVMConstants.SECPCREDENTIAL;
        }
        else if (this._codecID === 1) {
            return constants_1.AXVMConstants.SECPCREDENTIAL_CODECONE;
        }
    }
    /**
     * Returns the [[SECPMintOutput]] to be produced by this operation.
     */
    getMintOutput() {
        return this.mintOutput;
    }
    /**
     * Returns [[SECPTransferOutput]] to be produced by this operation.
     */
    getTransferOutput() {
        return this.transferOutput;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[SECPMintOperation]] and returns the updated offset.
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.mintOutput = new outputs_1.SECPMintOutput();
        offset = this.mintOutput.fromBuffer(bytes, offset);
        this.transferOutput = new outputs_1.SECPTransferOutput();
        offset = this.transferOutput.fromBuffer(bytes, offset);
        return offset;
    }
    /**
     * Returns the buffer representing the [[SECPMintOperation]] instance.
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const mintoutBuff = this.mintOutput.toBuffer();
        const transferOutBuff = this.transferOutput.toBuffer();
        const bsize = superbuff.length + mintoutBuff.length + transferOutBuff.length;
        const barr = [superbuff, mintoutBuff, transferOutBuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.SECPMintOperation = SECPMintOperation;
/**
 * An [[Operation]] class which specifies a NFT Mint Op.
 */
class NFTMintOperation extends Operation {
    /**
     * An [[Operation]] class which contains an NFT on an assetID.
     *
     * @param groupID The group to which to issue the NFT Output
     * @param payload A {@link https://github.com/feross/buffer|Buffer} of the NFT payload
     * @param outputOwners An array of outputOwners
     */
    constructor(groupID = undefined, payload = undefined, outputOwners = undefined) {
        super();
        this._typeName = "NFTMintOperation";
        this._codecID = constants_1.AXVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.AXVMConstants.NFTMINTOPID
            : constants_1.AXVMConstants.NFTMINTOPID_CODECONE;
        this.groupID = buffer_1.Buffer.alloc(4);
        this.outputOwners = [];
        /**
         * Returns the credential ID.
         */
        this.getCredentialID = () => {
            if (this._codecID === 0) {
                return constants_1.AXVMConstants.NFTCREDENTIAL;
            }
            else if (this._codecID === 1) {
                return constants_1.AXVMConstants.NFTCREDENTIAL_CODECONE;
            }
        };
        /**
         * Returns the payload.
         */
        this.getGroupID = () => {
            return bintools.copyFrom(this.groupID, 0);
        };
        /**
         * Returns the payload.
         */
        this.getPayload = () => {
            return bintools.copyFrom(this.payload, 0);
        };
        /**
         * Returns the payload's raw {@link https://github.com/feross/buffer|Buffer} with length prepended, for use with [[PayloadBase]]'s fromBuffer
         */
        this.getPayloadBuffer = () => {
            let payloadlen = buffer_1.Buffer.alloc(4);
            payloadlen.writeUInt32BE(this.payload.length, 0);
            return buffer_1.Buffer.concat([payloadlen, bintools.copyFrom(this.payload, 0)]);
        };
        /**
         * Returns the outputOwners.
         */
        this.getOutputOwners = () => {
            return this.outputOwners;
        };
        if (typeof groupID !== "undefined" &&
            typeof payload !== "undefined" &&
            outputOwners.length) {
            this.groupID.writeUInt32BE(groupID ? groupID : 0, 0);
            this.payload = payload;
            this.outputOwners = outputOwners;
        }
    }
    serialize(encoding = "hex") {
        const fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { groupID: serialization.encoder(this.groupID, encoding, buffer, decimalString, 4), payload: serialization.encoder(this.payload, encoding, buffer, hex), outputOwners: this.outputOwners.map((o) => o.serialize(encoding)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.groupID = serialization.decoder(fields["groupID"], encoding, decimalString, buffer, 4);
        this.payload = serialization.decoder(fields["payload"], encoding, hex, buffer);
        // this.outputOwners = fields["outputOwners"].map((o: NFTMintOutput) => {
        //   let oo: NFTMintOutput = new NFTMintOutput()
        //   oo.deserialize(o, encoding)
        //   return oo
        // })
        this.outputOwners = fields["outputOwners"].map((o) => {
            let oo = new output_1.OutputOwners();
            oo.deserialize(o, encoding);
            return oo;
        });
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - NFTMintOperation.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.AXVMConstants.NFTMINTOPID
                : constants_1.AXVMConstants.NFTMINTOPID_CODECONE;
    }
    /**
     * Returns the operation ID.
     */
    getOperationID() {
        return this._typeID;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTMintOperation]] and returns the updated offset.
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.groupID = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let payloadLen = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.payload = bintools.copyFrom(bytes, offset, offset + payloadLen);
        offset += payloadLen;
        let numoutputs = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.outputOwners = [];
        for (let i = 0; i < numoutputs; i++) {
            let outputOwner = new output_1.OutputOwners();
            offset = outputOwner.fromBuffer(bytes, offset);
            this.outputOwners.push(outputOwner);
        }
        return offset;
    }
    /**
     * Returns the buffer representing the [[NFTMintOperation]] instance.
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const payloadlen = buffer_1.Buffer.alloc(4);
        payloadlen.writeUInt32BE(this.payload.length, 0);
        const outputownerslen = buffer_1.Buffer.alloc(4);
        outputownerslen.writeUInt32BE(this.outputOwners.length, 0);
        let bsize = superbuff.length +
            this.groupID.length +
            payloadlen.length +
            this.payload.length +
            outputownerslen.length;
        const barr = [
            superbuff,
            this.groupID,
            payloadlen,
            this.payload,
            outputownerslen
        ];
        for (let i = 0; i < this.outputOwners.length; i++) {
            let b = this.outputOwners[`${i}`].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns a base-58 string representing the [[NFTMintOperation]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.NFTMintOperation = NFTMintOperation;
/**
 * A [[Operation]] class which specifies a NFT Transfer Op.
 */
class NFTTransferOperation extends Operation {
    /**
     * An [[Operation]] class which contains an NFT on an assetID.
     *
     * @param output An [[NFTTransferOutput]]
     */
    constructor(output = undefined) {
        super();
        this._typeName = "NFTTransferOperation";
        this._codecID = constants_1.AXVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.AXVMConstants.NFTXFEROPID
            : constants_1.AXVMConstants.NFTXFEROPID_CODECONE;
        this.getOutput = () => this.output;
        if (typeof output !== "undefined") {
            this.output = output;
        }
    }
    serialize(encoding = "hex") {
        const fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { output: this.output.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.output = new outputs_1.NFTTransferOutput();
        this.output.deserialize(fields["output"], encoding);
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - NFTTransferOperation.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.AXVMConstants.NFTXFEROPID
                : constants_1.AXVMConstants.NFTXFEROPID_CODECONE;
    }
    /**
     * Returns the operation ID.
     */
    getOperationID() {
        return this._typeID;
    }
    /**
     * Returns the credential ID.
     */
    getCredentialID() {
        if (this._codecID === 0) {
            return constants_1.AXVMConstants.NFTCREDENTIAL;
        }
        else if (this._codecID === 1) {
            return constants_1.AXVMConstants.NFTCREDENTIAL_CODECONE;
        }
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTTransferOperation]] and returns the updated offset.
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.output = new outputs_1.NFTTransferOutput();
        return this.output.fromBuffer(bytes, offset);
    }
    /**
     * Returns the buffer representing the [[NFTTransferOperation]] instance.
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const outbuff = this.output.toBuffer();
        const bsize = superbuff.length + outbuff.length;
        const barr = [superbuff, outbuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    /**
     * Returns a base-58 string representing the [[NFTTransferOperation]].
     */
    toString() {
        return bintools.bufferToB58(this.toBuffer());
    }
}
exports.NFTTransferOperation = NFTTransferOperation;
/**
 * Class for representing a UTXOID used in [[TransferableOp]] types
 */
class UTXOID extends nbytes_1.NBytes {
    /**
     * Class for representing a UTXOID used in [[TransferableOp]] types
     */
    constructor() {
        super();
        this._typeName = "UTXOID";
        this._typeID = undefined;
        //serialize and deserialize both are inherited
        this.bytes = buffer_1.Buffer.alloc(36);
        this.bsize = 36;
    }
    /**
     * Returns a base-58 representation of the [[UTXOID]].
     */
    toString() {
        return bintools.cb58Encode(this.toBuffer());
    }
    /**
     * Takes a base-58 string containing an [[UTXOID]], parses it, populates the class, and returns the length of the UTXOID in bytes.
     *
     * @param bytes A base-58 string containing a raw [[UTXOID]]
     *
     * @returns The length of the raw [[UTXOID]]
     */
    fromString(utxoid) {
        const utxoidbuff = bintools.b58ToBuffer(utxoid);
        if (utxoidbuff.length === 40 && bintools.validateChecksum(utxoidbuff)) {
            const newbuff = bintools.copyFrom(utxoidbuff, 0, utxoidbuff.length - 4);
            if (newbuff.length === 36) {
                this.bytes = newbuff;
            }
        }
        else if (utxoidbuff.length === 40) {
            throw new errors_1.ChecksumError("Error - UTXOID.fromString: invalid checksum on address");
        }
        else if (utxoidbuff.length === 36) {
            this.bytes = utxoidbuff;
        }
        else {
            /* istanbul ignore next */
            throw new errors_1.AddressError("Error - UTXOID.fromString: invalid address");
        }
        return this.getSize();
    }
    clone() {
        const newbase = new UTXOID();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new UTXOID();
    }
}
exports.UTXOID = UTXOID;
/**
 * Returns a function used to sort an array of [[UTXOID]]s
 */
UTXOID.comparator = () => (a, b) => buffer_1.Buffer.compare(a.toBuffer(), b.toBuffer());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYXh2bS9vcHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWdDO0FBQ2hDLG9FQUEyQztBQUMzQywyQ0FBMkM7QUFDM0MsdUNBSWtCO0FBQ2xCLGdEQUE0QztBQUM1QywwREFBaUQ7QUFDakQsZ0RBQWtEO0FBQ2xELDZEQUtrQztBQUNsQywrQ0FLMkI7QUFFM0IsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNoRSxNQUFNLElBQUksR0FBbUIsTUFBTSxDQUFBO0FBQ25DLE1BQU0sTUFBTSxHQUFtQixRQUFRLENBQUE7QUFDdkMsTUFBTSxHQUFHLEdBQW1CLEtBQUssQ0FBQTtBQUNqQyxNQUFNLGFBQWEsR0FBbUIsZUFBZSxDQUFBO0FBRXJEOzs7Ozs7R0FNRztBQUNJLE1BQU0sb0JBQW9CLEdBQUcsQ0FDbEMsSUFBWSxFQUNaLEdBQUcsSUFBVyxFQUNILEVBQUU7SUFDYixJQUNFLElBQUksS0FBSyx5QkFBYSxDQUFDLFlBQVk7UUFDbkMsSUFBSSxLQUFLLHlCQUFhLENBQUMscUJBQXFCLEVBQzVDO1FBQ0EsT0FBTyxJQUFJLGlCQUFpQixDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FDdEM7U0FBTSxJQUNMLElBQUksS0FBSyx5QkFBYSxDQUFDLFdBQVc7UUFDbEMsSUFBSSxLQUFLLHlCQUFhLENBQUMsb0JBQW9CLEVBQzNDO1FBQ0EsT0FBTyxJQUFJLGdCQUFnQixDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FDckM7U0FBTSxJQUNMLElBQUksS0FBSyx5QkFBYSxDQUFDLFdBQVc7UUFDbEMsSUFBSSxLQUFLLHlCQUFhLENBQUMsb0JBQW9CLEVBQzNDO1FBQ0EsT0FBTyxJQUFJLG9CQUFv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QUFFLENBQUE7SUFDdkIsQ0FBQztJQUVELEtBQUs7UUFDSCxNQUFNLE9BQU8sR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFBO1FBQ3BDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7UUFDbkMsT0FBTyxPQUFlLENBQUE7SUFDeEIsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFHLElBQVc7UUFDbkIsT0FBTyxJQUFJLE1BQU0sRUFBVSxDQUFBO0lBQzdCLENBQUM7O0FBL0RILHdCQXVFQztBQTlEQzs7R0FFRztBQUNJLGlCQUFVLEdBQ2YsR0FBMkMsRUFBRSxDQUM3QyxDQUFDLENBQVMsRUFBRSxDQUFTLEVBQWMsRUFBRSxDQUNuQyxlQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQWUsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1BWFZNLU9wZXJhdGlvbnNcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQgeyBBWFZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcbmltcG9ydCB7XG4gIE5GVFRyYW5zZmVyT3V0cHV0LFxuICBTRUNQTWludE91dHB1dCxcbiAgU0VDUFRyYW5zZmVyT3V0cHV0XG59IGZyb20gXCIuL291dHB1dHNcIlxuaW1wb3J0IHsgTkJ5dGVzIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9uYnl0ZXNcIlxuaW1wb3J0IHsgU2lnSWR4IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9jcmVkZW50aWFsc1wiXG5pbXBvcnQgeyBPdXRwdXRPd25lcnMgfSBmcm9tIFwiLi4vLi4vY29tbW9uL291dHB1dFwiXG5pbXBvcnQge1xuICBTZXJpYWxpemFibGUsXG4gIFNlcmlhbGl6YXRpb24sXG4gIFNlcmlhbGl6ZWRFbmNvZGluZyxcbiAgU2VyaWFsaXplZFR5cGVcbn0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxuaW1wb3J0IHtcbiAgSW52YWxpZE9wZXJhdGlvbklkRXJyb3IsXG4gIENvZGVjSWRFcnJvcixcbiAgQ2hlY2tzdW1FcnJvcixcbiAgQWRkcmVzc0Vycm9yXG59IGZyb20gXCIuLi8uLi91dGlscy9lcnJvcnNcIlxuXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXG5jb25zdCBjYjU4OiBTZXJpYWxpemVkVHlwZSA9IFwiY2I1OFwiXG5jb25zdCBidWZmZXI6IFNlcmlhbGl6ZWRUeXBlID0gXCJCdWZmZXJcIlxuY29uc3QgaGV4OiBTZXJpYWxpemVkVHlwZSA9IFwiaGV4XCJcbmNvbnN0IGRlY2ltYWxTdHJpbmc6IFNlcmlhbGl6ZWRUeXBlID0gXCJkZWNpbWFsU3RyaW5nXCJcblxuLyoqXG4gKiBUYWtlcyBhIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIG91dHB1dCBhbmQgcmV0dXJucyB0aGUgcHJvcGVyIFtbT3BlcmF0aW9uXV0gaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIG9waWQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBvcGVyYXRpb24gSUQgcGFyc2VkIHByaW9yIHRvIHRoZSBieXRlcyBwYXNzZWQgaW5cbiAqXG4gKiBAcmV0dXJucyBBbiBpbnN0YW5jZSBvZiBhbiBbW09wZXJhdGlvbl1dLWV4dGVuZGVkIGNsYXNzLlxuICovXG5leHBvcnQgY29uc3QgU2VsZWN0T3BlcmF0aW9uQ2xhc3MgPSAoXG4gIG9waWQ6IG51bWJlcixcbiAgLi4uYXJnczogYW55W11cbik6IE9wZXJhdGlvbiA9PiB7XG4gIGlmIChcbiAgICBvcGlkID09PSBBWFZNQ29uc3RhbnRzLlNFQ1BNSU5UT1BJRCB8fFxuICAgIG9waWQgPT09IEFYVk1Db25zdGFudHMuU0VDUE1JTlRPUElEX0NPREVDT05FXG4gICkge1xuICAgIHJldHVybiBuZXcgU0VDUE1pbnRPcGVyYXRpb24oLi4uYXJncylcbiAgfSBlbHNlIGlmIChcbiAgICBvcGlkID09PSBBWFZNQ29uc3RhbnRzLk5GVE1JTlRPUElEIHx8XG4gICAgb3BpZCA9PT0gQVhWTUNvbnN0YW50cy5ORlRNSU5UT1BJRF9DT0RFQ09ORVxuICApIHtcbiAgICByZXR1cm4gbmV3IE5GVE1pbnRPcGVyYXRpb24oLi4uYXJncylcbiAgfSBlbHNlIGlmIChcbiAgICBvcGlkID09PSBBWFZNQ29uc3RhbnRzLk5GVFhGRVJPUElEIHx8XG4gICAgb3BpZCA9PT0gQVhWTUNvbnN0YW50cy5ORlRYRkVST1BJRF9DT0RFQ09ORVxuICApIHtcbiAgICByZXR1cm4gbmV3IE5GVFRyYW5zZmVyT3BlcmF0aW9uKC4uLmFyZ3MpXG4gIH1cbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgdGhyb3cgbmV3IEludmFsaWRPcGVyYXRpb25JZEVycm9yKFxuICAgIGBFcnJvciAtIFNlbGVjdE9wZXJhdGlvbkNsYXNzOiB1bmtub3duIG9waWQgJHtvcGlkfWBcbiAgKVxufVxuXG4vKipcbiAqIEEgY2xhc3MgcmVwcmVzZW50aW5nIGFuIG9wZXJhdGlvbi4gQWxsIG9wZXJhdGlvbiB0eXBlcyBtdXN0IGV4dGVuZCBvbiB0aGlzIGNsYXNzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgT3BlcmF0aW9uIGV4dGVuZHMgU2VyaWFsaXphYmxlIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiT3BlcmF0aW9uXCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgc2lnSWR4czogdGhpcy5zaWdJZHhzLm1hcCgoczogU2lnSWR4KTogb2JqZWN0ID0+IHMuc2VyaWFsaXplKGVuY29kaW5nKSlcbiAgICB9XG4gIH1cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLnNpZ0lkeHMgPSBmaWVsZHNbXCJzaWdJZHhzXCJdLm1hcCgoczogb2JqZWN0KTogU2lnSWR4ID0+IHtcbiAgICAgIGxldCBzaWR4OiBTaWdJZHggPSBuZXcgU2lnSWR4KClcbiAgICAgIHNpZHguZGVzZXJpYWxpemUocywgZW5jb2RpbmcpXG4gICAgICByZXR1cm4gc2lkeFxuICAgIH0pXG4gICAgdGhpcy5zaWdDb3VudC53cml0ZVVJbnQzMkJFKHRoaXMuc2lnSWR4cy5sZW5ndGgsIDApXG4gIH1cblxuICBwcm90ZWN0ZWQgc2lnQ291bnQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICBwcm90ZWN0ZWQgc2lnSWR4czogU2lnSWR4W10gPSBbXSAvLyBpZHhzIG9mIHNpZ25lcnMgZnJvbSB1dHhvXG5cbiAgc3RhdGljIGNvbXBhcmF0b3IgPVxuICAgICgpOiAoKGE6IE9wZXJhdGlvbiwgYjogT3BlcmF0aW9uKSA9PiAxIHwgLTEgfCAwKSA9PlxuICAgIChhOiBPcGVyYXRpb24sIGI6IE9wZXJhdGlvbik6IDEgfCAtMSB8IDAgPT4ge1xuICAgICAgY29uc3QgYW91dGlkOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICAgIGFvdXRpZC53cml0ZVVJbnQzMkJFKGEuZ2V0T3BlcmF0aW9uSUQoKSwgMClcbiAgICAgIGNvbnN0IGFidWZmOiBCdWZmZXIgPSBhLnRvQnVmZmVyKClcblxuICAgICAgY29uc3QgYm91dGlkOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICAgIGJvdXRpZC53cml0ZVVJbnQzMkJFKGIuZ2V0T3BlcmF0aW9uSUQoKSwgMClcbiAgICAgIGNvbnN0IGJidWZmOiBCdWZmZXIgPSBiLnRvQnVmZmVyKClcblxuICAgICAgY29uc3QgYXNvcnQ6IEJ1ZmZlciA9IEJ1ZmZlci5jb25jYXQoXG4gICAgICAgIFthb3V0aWQsIGFidWZmXSxcbiAgICAgICAgYW91dGlkLmxlbmd0aCArIGFidWZmLmxlbmd0aFxuICAgICAgKVxuICAgICAgY29uc3QgYnNvcnQ6IEJ1ZmZlciA9IEJ1ZmZlci5jb25jYXQoXG4gICAgICAgIFtib3V0aWQsIGJidWZmXSxcbiAgICAgICAgYm91dGlkLmxlbmd0aCArIGJidWZmLmxlbmd0aFxuICAgICAgKVxuICAgICAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKGFzb3J0LCBic29ydCkgYXMgMSB8IC0xIHwgMFxuICAgIH1cblxuICBhYnN0cmFjdCBnZXRPcGVyYXRpb25JRCgpOiBudW1iZXJcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYXJyYXkgb2YgW1tTaWdJZHhdXSBmb3IgdGhpcyBbW09wZXJhdGlvbl1dXG4gICAqL1xuICBnZXRTaWdJZHhzID0gKCk6IFNpZ0lkeFtdID0+IHRoaXMuc2lnSWR4c1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjcmVkZW50aWFsIElELlxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0Q3JlZGVudGlhbElEKCk6IG51bWJlclxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuZCBhZGRzIGEgW1tTaWdJZHhdXSB0byB0aGUgW1tPcGVyYXRpb25dXS5cbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3NJZHggVGhlIGluZGV4IG9mIHRoZSBhZGRyZXNzIHRvIHJlZmVyZW5jZSBpbiB0aGUgc2lnbmF0dXJlc1xuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyBvZiB0aGUgc291cmNlIG9mIHRoZSBzaWduYXR1cmVcbiAgICovXG4gIGFkZFNpZ25hdHVyZUlkeCA9IChhZGRyZXNzSWR4OiBudW1iZXIsIGFkZHJlc3M6IEJ1ZmZlcikgPT4ge1xuICAgIGNvbnN0IHNpZ2lkeDogU2lnSWR4ID0gbmV3IFNpZ0lkeCgpXG4gICAgY29uc3QgYjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgYi53cml0ZVVJbnQzMkJFKGFkZHJlc3NJZHgsIDApXG4gICAgc2lnaWR4LmZyb21CdWZmZXIoYilcbiAgICBzaWdpZHguc2V0U291cmNlKGFkZHJlc3MpXG4gICAgdGhpcy5zaWdJZHhzLnB1c2goc2lnaWR4KVxuICAgIHRoaXMuc2lnQ291bnQud3JpdGVVSW50MzJCRSh0aGlzLnNpZ0lkeHMubGVuZ3RoLCAwKVxuICB9XG5cbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xuICAgIHRoaXMuc2lnQ291bnQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgIG9mZnNldCArPSA0XG4gICAgY29uc3Qgc2lnQ291bnQ6IG51bWJlciA9IHRoaXMuc2lnQ291bnQucmVhZFVJbnQzMkJFKDApXG4gICAgdGhpcy5zaWdJZHhzID0gW11cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgc2lnQ291bnQ7IGkrKykge1xuICAgICAgY29uc3Qgc2lnaWR4OiBTaWdJZHggPSBuZXcgU2lnSWR4KClcbiAgICAgIGNvbnN0IHNpZ2J1ZmY6IEJ1ZmZlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgICBzaWdpZHguZnJvbUJ1ZmZlcihzaWdidWZmKVxuICAgICAgb2Zmc2V0ICs9IDRcbiAgICAgIHRoaXMuc2lnSWR4cy5wdXNoKHNpZ2lkeClcbiAgICB9XG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICB0aGlzLnNpZ0NvdW50LndyaXRlVUludDMyQkUodGhpcy5zaWdJZHhzLmxlbmd0aCwgMClcbiAgICBsZXQgYnNpemU6IG51bWJlciA9IHRoaXMuc2lnQ291bnQubGVuZ3RoXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbdGhpcy5zaWdDb3VudF1cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy5zaWdJZHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBiOiBCdWZmZXIgPSB0aGlzLnNpZ0lkeHNbYCR7aX1gXS50b0J1ZmZlcigpXG4gICAgICBiYXJyLnB1c2goYilcbiAgICAgIGJzaXplICs9IGIubGVuZ3RoXG4gICAgfVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBiYXNlLTU4IHN0cmluZyByZXByZXNlbnRpbmcgdGhlIFtbTkZUTWludE9wZXJhdGlvbl1dLlxuICAgKi9cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYmludG9vbHMuYnVmZmVyVG9CNTgodGhpcy50b0J1ZmZlcigpKVxuICB9XG59XG5cbi8qKlxuICogQSBjbGFzcyB3aGljaCBjb250YWlucyBhbiBbW09wZXJhdGlvbl1dIGZvciB0cmFuc2ZlcnMuXG4gKlxuICovXG5leHBvcnQgY2xhc3MgVHJhbnNmZXJhYmxlT3BlcmF0aW9uIGV4dGVuZHMgU2VyaWFsaXphYmxlIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVHJhbnNmZXJhYmxlT3BlcmF0aW9uXCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgYXNzZXRJRDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKHRoaXMuYXNzZXRJRCwgZW5jb2RpbmcsIGJ1ZmZlciwgY2I1OCwgMzIpLFxuICAgICAgdXR4b0lEczogdGhpcy51dHhvSURzLm1hcCgodSkgPT4gdS5zZXJpYWxpemUoZW5jb2RpbmcpKSxcbiAgICAgIG9wZXJhdGlvbjogdGhpcy5vcGVyYXRpb24uc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMuYXNzZXRJRCA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcbiAgICAgIGZpZWxkc1tcImFzc2V0SURcIl0sXG4gICAgICBlbmNvZGluZyxcbiAgICAgIGNiNTgsXG4gICAgICBidWZmZXIsXG4gICAgICAzMlxuICAgIClcbiAgICB0aGlzLnV0eG9JRHMgPSBmaWVsZHNbXCJ1dHhvSURzXCJdLm1hcCgodTogb2JqZWN0KSA9PiB7XG4gICAgICBsZXQgdXR4b2lkOiBVVFhPSUQgPSBuZXcgVVRYT0lEKClcbiAgICAgIHV0eG9pZC5kZXNlcmlhbGl6ZSh1LCBlbmNvZGluZylcbiAgICAgIHJldHVybiB1dHhvaWRcbiAgICB9KVxuICAgIHRoaXMub3BlcmF0aW9uID0gU2VsZWN0T3BlcmF0aW9uQ2xhc3MoZmllbGRzW1wib3BlcmF0aW9uXCJdW1wiX3R5cGVJRFwiXSlcbiAgICB0aGlzLm9wZXJhdGlvbi5kZXNlcmlhbGl6ZShmaWVsZHNbXCJvcGVyYXRpb25cIl0sIGVuY29kaW5nKVxuICB9XG5cbiAgcHJvdGVjdGVkIGFzc2V0SUQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMilcbiAgcHJvdGVjdGVkIHV0eG9JRHM6IFVUWE9JRFtdID0gW11cbiAgcHJvdGVjdGVkIG9wZXJhdGlvbjogT3BlcmF0aW9uXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBmdW5jdGlvbiB1c2VkIHRvIHNvcnQgYW4gYXJyYXkgb2YgW1tUcmFuc2ZlcmFibGVPcGVyYXRpb25dXXNcbiAgICovXG4gIHN0YXRpYyBjb21wYXJhdG9yID0gKCk6ICgoXG4gICAgYTogVHJhbnNmZXJhYmxlT3BlcmF0aW9uLFxuICAgIGI6IFRyYW5zZmVyYWJsZU9wZXJhdGlvblxuICApID0+IDEgfCAtMSB8IDApID0+IHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKFxuICAgICAgYTogVHJhbnNmZXJhYmxlT3BlcmF0aW9uLFxuICAgICAgYjogVHJhbnNmZXJhYmxlT3BlcmF0aW9uXG4gICAgKTogMSB8IC0xIHwgMCB7XG4gICAgICByZXR1cm4gQnVmZmVyLmNvbXBhcmUoYS50b0J1ZmZlcigpLCBiLnRvQnVmZmVyKCkpIGFzIDEgfCAtMSB8IDBcbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGFzc2V0SUQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfS5cbiAgICovXG4gIGdldEFzc2V0SUQgPSAoKTogQnVmZmVyID0+IHRoaXMuYXNzZXRJRFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIFVUWE9JRHMgaW4gdGhpcyBvcGVyYXRpb24uXG4gICAqL1xuICBnZXRVVFhPSURzID0gKCk6IFVUWE9JRFtdID0+IHRoaXMudXR4b0lEc1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBvcGVyYXRpb25cbiAgICovXG4gIGdldE9wZXJhdGlvbiA9ICgpOiBPcGVyYXRpb24gPT4gdGhpcy5vcGVyYXRpb25cblxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgdGhpcy5hc3NldElEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXG4gICAgb2Zmc2V0ICs9IDMyXG4gICAgY29uc3QgbnVtdXR4b0lEczogbnVtYmVyID0gYmludG9vbHNcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgICAgLnJlYWRVSW50MzJCRSgwKVxuICAgIG9mZnNldCArPSA0XG4gICAgdGhpcy51dHhvSURzID0gW11cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgbnVtdXR4b0lEczsgaSsrKSB7XG4gICAgICBjb25zdCB1dHhvaWQ6IFVUWE9JRCA9IG5ldyBVVFhPSUQoKVxuICAgICAgb2Zmc2V0ID0gdXR4b2lkLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICAgIHRoaXMudXR4b0lEcy5wdXNoKHV0eG9pZClcbiAgICB9XG4gICAgY29uc3Qgb3BpZDogbnVtYmVyID0gYmludG9vbHNcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgICAgLnJlYWRVSW50MzJCRSgwKVxuICAgIG9mZnNldCArPSA0XG4gICAgdGhpcy5vcGVyYXRpb24gPSBTZWxlY3RPcGVyYXRpb25DbGFzcyhvcGlkKVxuICAgIHJldHVybiB0aGlzLm9wZXJhdGlvbi5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gIH1cblxuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xuICAgIGNvbnN0IG51bXV0eG9JRHMgPSBCdWZmZXIuYWxsb2MoNClcbiAgICBudW11dHhvSURzLndyaXRlVUludDMyQkUodGhpcy51dHhvSURzLmxlbmd0aCwgMClcbiAgICBsZXQgYnNpemU6IG51bWJlciA9IHRoaXMuYXNzZXRJRC5sZW5ndGggKyBudW11dHhvSURzLmxlbmd0aFxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW3RoaXMuYXNzZXRJRCwgbnVtdXR4b0lEc11cbiAgICB0aGlzLnV0eG9JRHMgPSB0aGlzLnV0eG9JRHMuc29ydChVVFhPSUQuY29tcGFyYXRvcigpKVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB0aGlzLnV0eG9JRHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGI6IEJ1ZmZlciA9IHRoaXMudXR4b0lEc1tgJHtpfWBdLnRvQnVmZmVyKClcbiAgICAgIGJhcnIucHVzaChiKVxuICAgICAgYnNpemUgKz0gYi5sZW5ndGhcbiAgICB9XG4gICAgY29uc3Qgb3BpZDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgb3BpZC53cml0ZVVJbnQzMkJFKHRoaXMub3BlcmF0aW9uLmdldE9wZXJhdGlvbklEKCksIDApXG4gICAgYmFyci5wdXNoKG9waWQpXG4gICAgYnNpemUgKz0gb3BpZC5sZW5ndGhcbiAgICBjb25zdCBiOiBCdWZmZXIgPSB0aGlzLm9wZXJhdGlvbi50b0J1ZmZlcigpXG4gICAgYnNpemUgKz0gYi5sZW5ndGhcbiAgICBiYXJyLnB1c2goYilcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICB1dHhvaWRzOiBVVFhPSURbXSB8IHN0cmluZ1tdIHwgQnVmZmVyW10gPSB1bmRlZmluZWQsXG4gICAgb3BlcmF0aW9uOiBPcGVyYXRpb24gPSB1bmRlZmluZWRcbiAgKSB7XG4gICAgc3VwZXIoKVxuICAgIGlmIChcbiAgICAgIHR5cGVvZiBhc3NldElEICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICBhc3NldElELmxlbmd0aCA9PT0gQVhWTUNvbnN0YW50cy5BU1NFVElETEVOICYmXG4gICAgICBvcGVyYXRpb24gaW5zdGFuY2VvZiBPcGVyYXRpb24gJiZcbiAgICAgIHR5cGVvZiB1dHhvaWRzICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICBBcnJheS5pc0FycmF5KHV0eG9pZHMpXG4gICAgKSB7XG4gICAgICB0aGlzLmFzc2V0SUQgPSBhc3NldElEXG4gICAgICB0aGlzLm9wZXJhdGlvbiA9IG9wZXJhdGlvblxuICAgICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHV0eG9pZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgdXR4b2lkOiBVVFhPSUQgPSBuZXcgVVRYT0lEKClcbiAgICAgICAgaWYgKHR5cGVvZiB1dHhvaWRzW2Ake2l9YF0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICB1dHhvaWQuZnJvbVN0cmluZyh1dHhvaWRzW2Ake2l9YF0gYXMgc3RyaW5nKVxuICAgICAgICB9IGVsc2UgaWYgKHV0eG9pZHNbYCR7aX1gXSBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgICAgIHV0eG9pZC5mcm9tQnVmZmVyKHV0eG9pZHNbYCR7aX1gXSBhcyBCdWZmZXIpXG4gICAgICAgIH0gZWxzZSBpZiAodXR4b2lkc1tgJHtpfWBdIGluc3RhbmNlb2YgVVRYT0lEKSB7XG4gICAgICAgICAgdXR4b2lkLmZyb21TdHJpbmcodXR4b2lkc1tgJHtpfWBdLnRvU3RyaW5nKCkpIC8vIGNsb25lXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51dHhvSURzLnB1c2godXR4b2lkKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFuIFtbT3BlcmF0aW9uXV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGEgU0VDUDI1NmsxIE1pbnQgT3AuXG4gKi9cbmV4cG9ydCBjbGFzcyBTRUNQTWludE9wZXJhdGlvbiBleHRlbmRzIE9wZXJhdGlvbiB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlNFQ1BNaW50T3BlcmF0aW9uXCJcbiAgcHJvdGVjdGVkIF9jb2RlY0lEID0gQVhWTUNvbnN0YW50cy5MQVRFU1RDT0RFQ1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9XG4gICAgdGhpcy5fY29kZWNJRCA9PT0gMFxuICAgICAgPyBBWFZNQ29uc3RhbnRzLlNFQ1BNSU5UT1BJRFxuICAgICAgOiBBWFZNQ29uc3RhbnRzLlNFQ1BNSU5UT1BJRF9DT0RFQ09ORVxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBtaW50T3V0cHV0OiB0aGlzLm1pbnRPdXRwdXQuc2VyaWFsaXplKGVuY29kaW5nKSxcbiAgICAgIHRyYW5zZmVyT3V0cHV0czogdGhpcy50cmFuc2Zlck91dHB1dC5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgfVxuICB9XG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy5taW50T3V0cHV0ID0gbmV3IFNFQ1BNaW50T3V0cHV0KClcbiAgICB0aGlzLm1pbnRPdXRwdXQuZGVzZXJpYWxpemUoZmllbGRzW1wibWludE91dHB1dFwiXSwgZW5jb2RpbmcpXG4gICAgdGhpcy50cmFuc2Zlck91dHB1dCA9IG5ldyBTRUNQVHJhbnNmZXJPdXRwdXQoKVxuICAgIHRoaXMudHJhbnNmZXJPdXRwdXQuZGVzZXJpYWxpemUoZmllbGRzW1widHJhbnNmZXJPdXRwdXRzXCJdLCBlbmNvZGluZylcbiAgfVxuXG4gIHByb3RlY3RlZCBtaW50T3V0cHV0OiBTRUNQTWludE91dHB1dCA9IHVuZGVmaW5lZFxuICBwcm90ZWN0ZWQgdHJhbnNmZXJPdXRwdXQ6IFNFQ1BUcmFuc2Zlck91dHB1dCA9IHVuZGVmaW5lZFxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvZGVjSURcbiAgICpcbiAgICogQHBhcmFtIGNvZGVjSUQgVGhlIGNvZGVjSUQgdG8gc2V0XG4gICAqL1xuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChjb2RlY0lEICE9PSAwICYmIGNvZGVjSUQgIT09IDEpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgQ29kZWNJZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gU0VDUE1pbnRPcGVyYXRpb24uc2V0Q29kZWNJRDogaW52YWxpZCBjb2RlY0lELiBWYWxpZCBjb2RlY0lEcyBhcmUgMCBhbmQgMS5cIlxuICAgICAgKVxuICAgIH1cbiAgICB0aGlzLl9jb2RlY0lEID0gY29kZWNJRFxuICAgIHRoaXMuX3R5cGVJRCA9XG4gICAgICB0aGlzLl9jb2RlY0lEID09PSAwXG4gICAgICAgID8gQVhWTUNvbnN0YW50cy5TRUNQTUlOVE9QSURcbiAgICAgICAgOiBBWFZNQ29uc3RhbnRzLlNFQ1BNSU5UT1BJRF9DT0RFQ09ORVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG9wZXJhdGlvbiBJRC5cbiAgICovXG4gIGdldE9wZXJhdGlvbklEKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNyZWRlbnRpYWwgSUQuXG4gICAqL1xuICBnZXRDcmVkZW50aWFsSUQoKTogbnVtYmVyIHtcbiAgICBpZiAodGhpcy5fY29kZWNJRCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEFYVk1Db25zdGFudHMuU0VDUENSRURFTlRJQUxcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2NvZGVjSUQgPT09IDEpIHtcbiAgICAgIHJldHVybiBBWFZNQ29uc3RhbnRzLlNFQ1BDUkVERU5USUFMX0NPREVDT05FXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIFtbU0VDUE1pbnRPdXRwdXRdXSB0byBiZSBwcm9kdWNlZCBieSB0aGlzIG9wZXJhdGlvbi5cbiAgICovXG4gIGdldE1pbnRPdXRwdXQoKTogU0VDUE1pbnRPdXRwdXQge1xuICAgIHJldHVybiB0aGlzLm1pbnRPdXRwdXRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIFtbU0VDUFRyYW5zZmVyT3V0cHV0XV0gdG8gYmUgcHJvZHVjZWQgYnkgdGhpcyBvcGVyYXRpb24uXG4gICAqL1xuICBnZXRUcmFuc2Zlck91dHB1dCgpOiBTRUNQVHJhbnNmZXJPdXRwdXQge1xuICAgIHJldHVybiB0aGlzLnRyYW5zZmVyT3V0cHV0XG4gIH1cblxuICAvKipcbiAgICogUG9wdWF0ZXMgdGhlIGluc3RhbmNlIGZyb20gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIFtbU0VDUE1pbnRPcGVyYXRpb25dXSBhbmQgcmV0dXJucyB0aGUgdXBkYXRlZCBvZmZzZXQuXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgIHRoaXMubWludE91dHB1dCA9IG5ldyBTRUNQTWludE91dHB1dCgpXG4gICAgb2Zmc2V0ID0gdGhpcy5taW50T3V0cHV0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICB0aGlzLnRyYW5zZmVyT3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dCgpXG4gICAgb2Zmc2V0ID0gdGhpcy50cmFuc2Zlck91dHB1dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIFtbU0VDUE1pbnRPcGVyYXRpb25dXSBpbnN0YW5jZS5cbiAgICovXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgY29uc3Qgc3VwZXJidWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXG4gICAgY29uc3QgbWludG91dEJ1ZmY6IEJ1ZmZlciA9IHRoaXMubWludE91dHB1dC50b0J1ZmZlcigpXG4gICAgY29uc3QgdHJhbnNmZXJPdXRCdWZmOiBCdWZmZXIgPSB0aGlzLnRyYW5zZmVyT3V0cHV0LnRvQnVmZmVyKClcbiAgICBjb25zdCBic2l6ZTogbnVtYmVyID1cbiAgICAgIHN1cGVyYnVmZi5sZW5ndGggKyBtaW50b3V0QnVmZi5sZW5ndGggKyB0cmFuc2Zlck91dEJ1ZmYubGVuZ3RoXG5cbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFtzdXBlcmJ1ZmYsIG1pbnRvdXRCdWZmLCB0cmFuc2Zlck91dEJ1ZmZdXG5cbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBbW09wZXJhdGlvbl1dIGNsYXNzIHdoaWNoIG1pbnRzIG5ldyB0b2tlbnMgb24gYW4gYXNzZXRJRC5cbiAgICpcbiAgICogQHBhcmFtIG1pbnRPdXRwdXQgVGhlIFtbU0VDUE1pbnRPdXRwdXRdXSB0aGF0IHdpbGwgYmUgcHJvZHVjZWQgYnkgdGhpcyB0cmFuc2FjdGlvbi5cbiAgICogQHBhcmFtIHRyYW5zZmVyT3V0cHV0IEEgW1tTRUNQVHJhbnNmZXJPdXRwdXRdXSB0aGF0IHdpbGwgYmUgcHJvZHVjZWQgZnJvbSB0aGlzIG1pbnRpbmcgb3BlcmF0aW9uLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgbWludE91dHB1dDogU0VDUE1pbnRPdXRwdXQgPSB1bmRlZmluZWQsXG4gICAgdHJhbnNmZXJPdXRwdXQ6IFNFQ1BUcmFuc2Zlck91dHB1dCA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcigpXG4gICAgaWYgKHR5cGVvZiBtaW50T3V0cHV0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLm1pbnRPdXRwdXQgPSBtaW50T3V0cHV0XG4gICAgfVxuICAgIGlmICh0eXBlb2YgdHJhbnNmZXJPdXRwdXQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMudHJhbnNmZXJPdXRwdXQgPSB0cmFuc2Zlck91dHB1dFxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFuIFtbT3BlcmF0aW9uXV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGEgTkZUIE1pbnQgT3AuXG4gKi9cbmV4cG9ydCBjbGFzcyBORlRNaW50T3BlcmF0aW9uIGV4dGVuZHMgT3BlcmF0aW9uIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiTkZUTWludE9wZXJhdGlvblwiXG4gIHByb3RlY3RlZCBfY29kZWNJRCA9IEFYVk1Db25zdGFudHMuTEFURVNUQ09ERUNcbiAgcHJvdGVjdGVkIF90eXBlSUQgPVxuICAgIHRoaXMuX2NvZGVjSUQgPT09IDBcbiAgICAgID8gQVhWTUNvbnN0YW50cy5ORlRNSU5UT1BJRFxuICAgICAgOiBBWFZNQ29uc3RhbnRzLk5GVE1JTlRPUElEX0NPREVDT05FXG5cbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcbiAgICBjb25zdCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgZ3JvdXBJRDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxuICAgICAgICB0aGlzLmdyb3VwSUQsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBidWZmZXIsXG4gICAgICAgIGRlY2ltYWxTdHJpbmcsXG4gICAgICAgIDRcbiAgICAgICksXG4gICAgICBwYXlsb2FkOiBzZXJpYWxpemF0aW9uLmVuY29kZXIodGhpcy5wYXlsb2FkLCBlbmNvZGluZywgYnVmZmVyLCBoZXgpLFxuICAgICAgb3V0cHV0T3duZXJzOiB0aGlzLm91dHB1dE93bmVycy5tYXAoKG8pID0+IG8uc2VyaWFsaXplKGVuY29kaW5nKSlcbiAgICB9XG4gIH1cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLmdyb3VwSUQgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJncm91cElEXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBkZWNpbWFsU3RyaW5nLFxuICAgICAgYnVmZmVyLFxuICAgICAgNFxuICAgIClcbiAgICB0aGlzLnBheWxvYWQgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJwYXlsb2FkXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBoZXgsXG4gICAgICBidWZmZXJcbiAgICApXG4gICAgLy8gdGhpcy5vdXRwdXRPd25lcnMgPSBmaWVsZHNbXCJvdXRwdXRPd25lcnNcIl0ubWFwKChvOiBORlRNaW50T3V0cHV0KSA9PiB7XG4gICAgLy8gICBsZXQgb286IE5GVE1pbnRPdXRwdXQgPSBuZXcgTkZUTWludE91dHB1dCgpXG4gICAgLy8gICBvby5kZXNlcmlhbGl6ZShvLCBlbmNvZGluZylcbiAgICAvLyAgIHJldHVybiBvb1xuICAgIC8vIH0pXG4gICAgdGhpcy5vdXRwdXRPd25lcnMgPSBmaWVsZHNbXCJvdXRwdXRPd25lcnNcIl0ubWFwKFxuICAgICAgKG86IG9iamVjdCk6IE91dHB1dE93bmVycyA9PiB7XG4gICAgICAgIGxldCBvbzogT3V0cHV0T3duZXJzID0gbmV3IE91dHB1dE93bmVycygpXG4gICAgICAgIG9vLmRlc2VyaWFsaXplKG8sIGVuY29kaW5nKVxuICAgICAgICByZXR1cm4gb29cbiAgICAgIH1cbiAgICApXG4gIH1cblxuICBwcm90ZWN0ZWQgZ3JvdXBJRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gIHByb3RlY3RlZCBwYXlsb2FkOiBCdWZmZXJcbiAgcHJvdGVjdGVkIG91dHB1dE93bmVyczogT3V0cHV0T3duZXJzW10gPSBbXVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvZGVjSURcbiAgICpcbiAgICogQHBhcmFtIGNvZGVjSUQgVGhlIGNvZGVjSUQgdG8gc2V0XG4gICAqL1xuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChjb2RlY0lEICE9PSAwICYmIGNvZGVjSUQgIT09IDEpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgQ29kZWNJZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gTkZUTWludE9wZXJhdGlvbi5zZXRDb2RlY0lEOiBpbnZhbGlkIGNvZGVjSUQuIFZhbGlkIGNvZGVjSURzIGFyZSAwIGFuZCAxLlwiXG4gICAgICApXG4gICAgfVxuICAgIHRoaXMuX2NvZGVjSUQgPSBjb2RlY0lEXG4gICAgdGhpcy5fdHlwZUlEID1cbiAgICAgIHRoaXMuX2NvZGVjSUQgPT09IDBcbiAgICAgICAgPyBBWFZNQ29uc3RhbnRzLk5GVE1JTlRPUElEXG4gICAgICAgIDogQVhWTUNvbnN0YW50cy5ORlRNSU5UT1BJRF9DT0RFQ09ORVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG9wZXJhdGlvbiBJRC5cbiAgICovXG4gIGdldE9wZXJhdGlvbklEKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNyZWRlbnRpYWwgSUQuXG4gICAqL1xuICBnZXRDcmVkZW50aWFsSUQgPSAoKTogbnVtYmVyID0+IHtcbiAgICBpZiAodGhpcy5fY29kZWNJRCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEFYVk1Db25zdGFudHMuTkZUQ1JFREVOVElBTFxuICAgIH0gZWxzZSBpZiAodGhpcy5fY29kZWNJRCA9PT0gMSkge1xuICAgICAgcmV0dXJuIEFYVk1Db25zdGFudHMuTkZUQ1JFREVOVElBTF9DT0RFQ09ORVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwYXlsb2FkLlxuICAgKi9cbiAgZ2V0R3JvdXBJRCA9ICgpOiBCdWZmZXIgPT4ge1xuICAgIHJldHVybiBiaW50b29scy5jb3B5RnJvbSh0aGlzLmdyb3VwSUQsIDApXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcGF5bG9hZC5cbiAgICovXG4gIGdldFBheWxvYWQgPSAoKTogQnVmZmVyID0+IHtcbiAgICByZXR1cm4gYmludG9vbHMuY29weUZyb20odGhpcy5wYXlsb2FkLCAwKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBheWxvYWQncyByYXcge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2l0aCBsZW5ndGggcHJlcGVuZGVkLCBmb3IgdXNlIHdpdGggW1tQYXlsb2FkQmFzZV1dJ3MgZnJvbUJ1ZmZlclxuICAgKi9cbiAgZ2V0UGF5bG9hZEJ1ZmZlciA9ICgpOiBCdWZmZXIgPT4ge1xuICAgIGxldCBwYXlsb2FkbGVuOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICBwYXlsb2FkbGVuLndyaXRlVUludDMyQkUodGhpcy5wYXlsb2FkLmxlbmd0aCwgMClcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChbcGF5bG9hZGxlbiwgYmludG9vbHMuY29weUZyb20odGhpcy5wYXlsb2FkLCAwKV0pXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgb3V0cHV0T3duZXJzLlxuICAgKi9cbiAgZ2V0T3V0cHV0T3duZXJzID0gKCk6IE91dHB1dE93bmVyc1tdID0+IHtcbiAgICByZXR1cm4gdGhpcy5vdXRwdXRPd25lcnNcbiAgfVxuXG4gIC8qKlxuICAgKiBQb3B1YXRlcyB0aGUgaW5zdGFuY2UgZnJvbSBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgW1tORlRNaW50T3BlcmF0aW9uXV0gYW5kIHJldHVybnMgdGhlIHVwZGF0ZWQgb2Zmc2V0LlxuICAgKi9cbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xuICAgIG9mZnNldCA9IHN1cGVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICB0aGlzLmdyb3VwSUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgIG9mZnNldCArPSA0XG4gICAgbGV0IHBheWxvYWRMZW46IG51bWJlciA9IGJpbnRvb2xzXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICAgIC5yZWFkVUludDMyQkUoMClcbiAgICBvZmZzZXQgKz0gNFxuICAgIHRoaXMucGF5bG9hZCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIHBheWxvYWRMZW4pXG4gICAgb2Zmc2V0ICs9IHBheWxvYWRMZW5cbiAgICBsZXQgbnVtb3V0cHV0czogbnVtYmVyID0gYmludG9vbHNcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgICAgLnJlYWRVSW50MzJCRSgwKVxuICAgIG9mZnNldCArPSA0XG4gICAgdGhpcy5vdXRwdXRPd25lcnMgPSBbXVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBudW1vdXRwdXRzOyBpKyspIHtcbiAgICAgIGxldCBvdXRwdXRPd25lcjogT3V0cHV0T3duZXJzID0gbmV3IE91dHB1dE93bmVycygpXG4gICAgICBvZmZzZXQgPSBvdXRwdXRPd25lci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgICB0aGlzLm91dHB1dE93bmVycy5wdXNoKG91dHB1dE93bmVyKVxuICAgIH1cbiAgICByZXR1cm4gb2Zmc2V0XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYnVmZmVyIHJlcHJlc2VudGluZyB0aGUgW1tORlRNaW50T3BlcmF0aW9uXV0gaW5zdGFuY2UuXG4gICAqL1xuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xuICAgIGNvbnN0IHN1cGVyYnVmZjogQnVmZmVyID0gc3VwZXIudG9CdWZmZXIoKVxuICAgIGNvbnN0IHBheWxvYWRsZW46IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIHBheWxvYWRsZW4ud3JpdGVVSW50MzJCRSh0aGlzLnBheWxvYWQubGVuZ3RoLCAwKVxuXG4gICAgY29uc3Qgb3V0cHV0b3duZXJzbGVuOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICBvdXRwdXRvd25lcnNsZW4ud3JpdGVVSW50MzJCRSh0aGlzLm91dHB1dE93bmVycy5sZW5ndGgsIDApXG5cbiAgICBsZXQgYnNpemU6IG51bWJlciA9XG4gICAgICBzdXBlcmJ1ZmYubGVuZ3RoICtcbiAgICAgIHRoaXMuZ3JvdXBJRC5sZW5ndGggK1xuICAgICAgcGF5bG9hZGxlbi5sZW5ndGggK1xuICAgICAgdGhpcy5wYXlsb2FkLmxlbmd0aCArXG4gICAgICBvdXRwdXRvd25lcnNsZW4ubGVuZ3RoXG5cbiAgICBjb25zdCBiYXJyOiBCdWZmZXJbXSA9IFtcbiAgICAgIHN1cGVyYnVmZixcbiAgICAgIHRoaXMuZ3JvdXBJRCxcbiAgICAgIHBheWxvYWRsZW4sXG4gICAgICB0aGlzLnBheWxvYWQsXG4gICAgICBvdXRwdXRvd25lcnNsZW5cbiAgICBdXG5cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy5vdXRwdXRPd25lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBiOiBCdWZmZXIgPSB0aGlzLm91dHB1dE93bmVyc1tgJHtpfWBdLnRvQnVmZmVyKClcbiAgICAgIGJhcnIucHVzaChiKVxuICAgICAgYnNpemUgKz0gYi5sZW5ndGhcbiAgICB9XG5cbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgYmFzZS01OCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBbW05GVE1pbnRPcGVyYXRpb25dXS5cbiAgICovXG4gIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGJpbnRvb2xzLmJ1ZmZlclRvQjU4KHRoaXMudG9CdWZmZXIoKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBbW09wZXJhdGlvbl1dIGNsYXNzIHdoaWNoIGNvbnRhaW5zIGFuIE5GVCBvbiBhbiBhc3NldElELlxuICAgKlxuICAgKiBAcGFyYW0gZ3JvdXBJRCBUaGUgZ3JvdXAgdG8gd2hpY2ggdG8gaXNzdWUgdGhlIE5GVCBPdXRwdXRcbiAgICogQHBhcmFtIHBheWxvYWQgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiB0aGUgTkZUIHBheWxvYWRcbiAgICogQHBhcmFtIG91dHB1dE93bmVycyBBbiBhcnJheSBvZiBvdXRwdXRPd25lcnNcbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIGdyb3VwSUQ6IG51bWJlciA9IHVuZGVmaW5lZCxcbiAgICBwYXlsb2FkOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgb3V0cHV0T3duZXJzOiBPdXRwdXRPd25lcnNbXSA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcigpXG4gICAgaWYgKFxuICAgICAgdHlwZW9mIGdyb3VwSUQgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgIHR5cGVvZiBwYXlsb2FkICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICBvdXRwdXRPd25lcnMubGVuZ3RoXG4gICAgKSB7XG4gICAgICB0aGlzLmdyb3VwSUQud3JpdGVVSW50MzJCRShncm91cElEID8gZ3JvdXBJRCA6IDAsIDApXG4gICAgICB0aGlzLnBheWxvYWQgPSBwYXlsb2FkXG4gICAgICB0aGlzLm91dHB1dE93bmVycyA9IG91dHB1dE93bmVyc1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEEgW1tPcGVyYXRpb25dXSBjbGFzcyB3aGljaCBzcGVjaWZpZXMgYSBORlQgVHJhbnNmZXIgT3AuXG4gKi9cbmV4cG9ydCBjbGFzcyBORlRUcmFuc2Zlck9wZXJhdGlvbiBleHRlbmRzIE9wZXJhdGlvbiB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIk5GVFRyYW5zZmVyT3BlcmF0aW9uXCJcbiAgcHJvdGVjdGVkIF9jb2RlY0lEID0gQVhWTUNvbnN0YW50cy5MQVRFU1RDT0RFQ1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9XG4gICAgdGhpcy5fY29kZWNJRCA9PT0gMFxuICAgICAgPyBBWFZNQ29uc3RhbnRzLk5GVFhGRVJPUElEXG4gICAgICA6IEFYVk1Db25zdGFudHMuTkZUWEZFUk9QSURfQ09ERUNPTkVcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGNvbnN0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBvdXRwdXQ6IHRoaXMub3V0cHV0LnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICB9XG4gIH1cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLm91dHB1dCA9IG5ldyBORlRUcmFuc2Zlck91dHB1dCgpXG4gICAgdGhpcy5vdXRwdXQuZGVzZXJpYWxpemUoZmllbGRzW1wib3V0cHV0XCJdLCBlbmNvZGluZylcbiAgfVxuXG4gIHByb3RlY3RlZCBvdXRwdXQ6IE5GVFRyYW5zZmVyT3V0cHV0XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgY29kZWNJRFxuICAgKlxuICAgKiBAcGFyYW0gY29kZWNJRCBUaGUgY29kZWNJRCB0byBzZXRcbiAgICovXG4gIHNldENvZGVjSUQoY29kZWNJRDogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKGNvZGVjSUQgIT09IDAgJiYgY29kZWNJRCAhPT0gMSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBDb2RlY0lkRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBORlRUcmFuc2Zlck9wZXJhdGlvbi5zZXRDb2RlY0lEOiBpbnZhbGlkIGNvZGVjSUQuIFZhbGlkIGNvZGVjSURzIGFyZSAwIGFuZCAxLlwiXG4gICAgICApXG4gICAgfVxuICAgIHRoaXMuX2NvZGVjSUQgPSBjb2RlY0lEXG4gICAgdGhpcy5fdHlwZUlEID1cbiAgICAgIHRoaXMuX2NvZGVjSUQgPT09IDBcbiAgICAgICAgPyBBWFZNQ29uc3RhbnRzLk5GVFhGRVJPUElEXG4gICAgICAgIDogQVhWTUNvbnN0YW50cy5ORlRYRkVST1BJRF9DT0RFQ09ORVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG9wZXJhdGlvbiBJRC5cbiAgICovXG4gIGdldE9wZXJhdGlvbklEKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNyZWRlbnRpYWwgSUQuXG4gICAqL1xuICBnZXRDcmVkZW50aWFsSUQoKTogbnVtYmVyIHtcbiAgICBpZiAodGhpcy5fY29kZWNJRCA9PT0gMCkge1xuICAgICAgcmV0dXJuIEFYVk1Db25zdGFudHMuTkZUQ1JFREVOVElBTFxuICAgIH0gZWxzZSBpZiAodGhpcy5fY29kZWNJRCA9PT0gMSkge1xuICAgICAgcmV0dXJuIEFYVk1Db25zdGFudHMuTkZUQ1JFREVOVElBTF9DT0RFQ09ORVxuICAgIH1cbiAgfVxuXG4gIGdldE91dHB1dCA9ICgpOiBORlRUcmFuc2Zlck91dHB1dCA9PiB0aGlzLm91dHB1dFxuXG4gIC8qKlxuICAgKiBQb3B1YXRlcyB0aGUgaW5zdGFuY2UgZnJvbSBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgW1tORlRUcmFuc2Zlck9wZXJhdGlvbl1dIGFuZCByZXR1cm5zIHRoZSB1cGRhdGVkIG9mZnNldC5cbiAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgdGhpcy5vdXRwdXQgPSBuZXcgTkZUVHJhbnNmZXJPdXRwdXQoKVxuICAgIHJldHVybiB0aGlzLm91dHB1dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYnVmZmVyIHJlcHJlc2VudGluZyB0aGUgW1tORlRUcmFuc2Zlck9wZXJhdGlvbl1dIGluc3RhbmNlLlxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBjb25zdCBzdXBlcmJ1ZmY6IEJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKClcbiAgICBjb25zdCBvdXRidWZmOiBCdWZmZXIgPSB0aGlzLm91dHB1dC50b0J1ZmZlcigpXG4gICAgY29uc3QgYnNpemU6IG51bWJlciA9IHN1cGVyYnVmZi5sZW5ndGggKyBvdXRidWZmLmxlbmd0aFxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW3N1cGVyYnVmZiwgb3V0YnVmZl1cbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgYmFzZS01OCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBbW05GVFRyYW5zZmVyT3BlcmF0aW9uXV0uXG4gICAqL1xuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiBiaW50b29scy5idWZmZXJUb0I1OCh0aGlzLnRvQnVmZmVyKCkpXG4gIH1cblxuICAvKipcbiAgICogQW4gW1tPcGVyYXRpb25dXSBjbGFzcyB3aGljaCBjb250YWlucyBhbiBORlQgb24gYW4gYXNzZXRJRC5cbiAgICpcbiAgICogQHBhcmFtIG91dHB1dCBBbiBbW05GVFRyYW5zZmVyT3V0cHV0XV1cbiAgICovXG4gIGNvbnN0cnVjdG9yKG91dHB1dDogTkZUVHJhbnNmZXJPdXRwdXQgPSB1bmRlZmluZWQpIHtcbiAgICBzdXBlcigpXG4gICAgaWYgKHR5cGVvZiBvdXRwdXQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMub3V0cHV0ID0gb3V0cHV0XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIFVUWE9JRCB1c2VkIGluIFtbVHJhbnNmZXJhYmxlT3BdXSB0eXBlc1xuICovXG5leHBvcnQgY2xhc3MgVVRYT0lEIGV4dGVuZHMgTkJ5dGVzIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVVRYT0lEXCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXG5cbiAgcHJvdGVjdGVkIGJ5dGVzID0gQnVmZmVyLmFsbG9jKDM2KVxuICBwcm90ZWN0ZWQgYnNpemUgPSAzNlxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdXNlZCB0byBzb3J0IGFuIGFycmF5IG9mIFtbVVRYT0lEXV1zXG4gICAqL1xuICBzdGF0aWMgY29tcGFyYXRvciA9XG4gICAgKCk6ICgoYTogVVRYT0lELCBiOiBVVFhPSUQpID0+IDEgfCAtMSB8IDApID0+XG4gICAgKGE6IFVUWE9JRCwgYjogVVRYT0lEKTogMSB8IC0xIHwgMCA9PlxuICAgICAgQnVmZmVyLmNvbXBhcmUoYS50b0J1ZmZlcigpLCBiLnRvQnVmZmVyKCkpIGFzIDEgfCAtMSB8IDBcblxuICAvKipcbiAgICogUmV0dXJucyBhIGJhc2UtNTggcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbVVRYT0lEXV0uXG4gICAqL1xuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIHJldHVybiBiaW50b29scy5jYjU4RW5jb2RlKHRoaXMudG9CdWZmZXIoKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIGJhc2UtNTggc3RyaW5nIGNvbnRhaW5pbmcgYW4gW1tVVFhPSURdXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBVVFhPSUQgaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBieXRlcyBBIGJhc2UtNTggc3RyaW5nIGNvbnRhaW5pbmcgYSByYXcgW1tVVFhPSURdXVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tVVFhPSURdXVxuICAgKi9cbiAgZnJvbVN0cmluZyh1dHhvaWQ6IHN0cmluZyk6IG51bWJlciB7XG4gICAgY29uc3QgdXR4b2lkYnVmZjogQnVmZmVyID0gYmludG9vbHMuYjU4VG9CdWZmZXIodXR4b2lkKVxuICAgIGlmICh1dHhvaWRidWZmLmxlbmd0aCA9PT0gNDAgJiYgYmludG9vbHMudmFsaWRhdGVDaGVja3N1bSh1dHhvaWRidWZmKSkge1xuICAgICAgY29uc3QgbmV3YnVmZjogQnVmZmVyID0gYmludG9vbHMuY29weUZyb20oXG4gICAgICAgIHV0eG9pZGJ1ZmYsXG4gICAgICAgIDAsXG4gICAgICAgIHV0eG9pZGJ1ZmYubGVuZ3RoIC0gNFxuICAgICAgKVxuICAgICAgaWYgKG5ld2J1ZmYubGVuZ3RoID09PSAzNikge1xuICAgICAgICB0aGlzLmJ5dGVzID0gbmV3YnVmZlxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodXR4b2lkYnVmZi5sZW5ndGggPT09IDQwKSB7XG4gICAgICB0aHJvdyBuZXcgQ2hlY2tzdW1FcnJvcihcbiAgICAgICAgXCJFcnJvciAtIFVUWE9JRC5mcm9tU3RyaW5nOiBpbnZhbGlkIGNoZWNrc3VtIG9uIGFkZHJlc3NcIlxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAodXR4b2lkYnVmZi5sZW5ndGggPT09IDM2KSB7XG4gICAgICB0aGlzLmJ5dGVzID0gdXR4b2lkYnVmZlxuICAgIH0gZWxzZSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcIkVycm9yIC0gVVRYT0lELmZyb21TdHJpbmc6IGludmFsaWQgYWRkcmVzc1wiKVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5nZXRTaXplKClcbiAgfVxuXG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGNvbnN0IG5ld2Jhc2U6IFVUWE9JRCA9IG5ldyBVVFhPSUQoKVxuICAgIG5ld2Jhc2UuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpXG4gICAgcmV0dXJuIG5ld2Jhc2UgYXMgdGhpc1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XG4gICAgcmV0dXJuIG5ldyBVVFhPSUQoKSBhcyB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIFVUWE9JRCB1c2VkIGluIFtbVHJhbnNmZXJhYmxlT3BdXSB0eXBlc1xuICAgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKVxuICB9XG59XG4iXX0=