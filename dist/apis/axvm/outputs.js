"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NFTTransferOutput = exports.NFTMintOutput = exports.SECPMintOutput = exports.SECPTransferOutput = exports.NFTOutput = exports.AmountOutput = exports.TransferableOutput = exports.SelectOutputClass = void 0;
/**
 * @packageDocumentation
 * @module API-AXVM-Outputs
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const output_1 = require("../../common/output");
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Takes a buffer representing the output and returns the proper Output instance.
 *
 * @param outputid A number representing the inputID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Output]]-extended class.
 */
const SelectOutputClass = (outputid, ...args) => {
    if (outputid === constants_1.AXVMConstants.SECPXFEROUTPUTID ||
        outputid === constants_1.AXVMConstants.SECPXFEROUTPUTID_CODECONE) {
        return new SECPTransferOutput(...args);
    }
    else if (outputid === constants_1.AXVMConstants.SECPMINTOUTPUTID ||
        outputid === constants_1.AXVMConstants.SECPMINTOUTPUTID_CODECONE) {
        return new SECPMintOutput(...args);
    }
    else if (outputid === constants_1.AXVMConstants.NFTMINTOUTPUTID ||
        outputid === constants_1.AXVMConstants.NFTMINTOUTPUTID_CODECONE) {
        return new NFTMintOutput(...args);
    }
    else if (outputid === constants_1.AXVMConstants.NFTXFEROUTPUTID ||
        outputid === constants_1.AXVMConstants.NFTXFEROUTPUTID_CODECONE) {
        return new NFTTransferOutput(...args);
    }
    throw new errors_1.OutputIdError("Error - SelectOutputClass: unknown outputid " + outputid);
};
exports.SelectOutputClass = SelectOutputClass;
class TransferableOutput extends output_1.StandardTransferableOutput {
    constructor() {
        super(...arguments);
        this._typeName = "TransferableOutput";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.output = (0, exports.SelectOutputClass)(fields["output"]["_typeID"]);
        this.output.deserialize(fields["output"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        this.assetID = bintools.copyFrom(bytes, offset, offset + constants_1.AXVMConstants.ASSETIDLEN);
        offset += constants_1.AXVMConstants.ASSETIDLEN;
        const outputid = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.output = (0, exports.SelectOutputClass)(outputid);
        return this.output.fromBuffer(bytes, offset);
    }
}
exports.TransferableOutput = TransferableOutput;
class AmountOutput extends output_1.StandardAmountOutput {
    constructor() {
        super(...arguments);
        this._typeName = "AmountOutput";
        this._typeID = undefined;
    }
    //serialize and deserialize both are inherited
    /**
     *
     * @param assetID An assetID which is wrapped around the Buffer of the Output
     */
    makeTransferable(assetID) {
        return new TransferableOutput(assetID, this);
    }
    select(id, ...args) {
        return (0, exports.SelectOutputClass)(id, ...args);
    }
}
exports.AmountOutput = AmountOutput;
class NFTOutput extends output_1.BaseNFTOutput {
    constructor() {
        super(...arguments);
        this._typeName = "NFTOutput";
        this._typeID = undefined;
    }
    //serialize and deserialize both are inherited
    /**
     *
     * @param assetID An assetID which is wrapped around the Buffer of the Output
     */
    makeTransferable(assetID) {
        return new TransferableOutput(assetID, this);
    }
    select(id, ...args) {
        return (0, exports.SelectOutputClass)(id, ...args);
    }
}
exports.NFTOutput = NFTOutput;
/**
 * An [[Output]] class which specifies an Output that carries an ammount for an assetID and uses secp256k1 signature scheme.
 */
class SECPTransferOutput extends AmountOutput {
    constructor() {
        super(...arguments);
        this._typeName = "SECPTransferOutput";
        this._codecID = constants_1.AXVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.AXVMConstants.SECPXFEROUTPUTID
            : constants_1.AXVMConstants.SECPXFEROUTPUTID_CODECONE;
    }
    //serialize and deserialize both are inherited
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - SECPTransferOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.AXVMConstants.SECPXFEROUTPUTID
                : constants_1.AXVMConstants.SECPXFEROUTPUTID_CODECONE;
    }
    /**
     * Returns the outputID for this output
     */
    getOutputID() {
        return this._typeID;
    }
    create(...args) {
        return new SECPTransferOutput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
}
exports.SECPTransferOutput = SECPTransferOutput;
/**
 * An [[Output]] class which specifies an Output that carries an ammount for an assetID and uses secp256k1 signature scheme.
 */
class SECPMintOutput extends output_1.Output {
    constructor() {
        super(...arguments);
        this._typeName = "SECPMintOutput";
        this._codecID = constants_1.AXVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.AXVMConstants.SECPMINTOUTPUTID
            : constants_1.AXVMConstants.SECPMINTOUTPUTID_CODECONE;
    }
    //serialize and deserialize both are inherited
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - SECPMintOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.AXVMConstants.SECPMINTOUTPUTID
                : constants_1.AXVMConstants.SECPMINTOUTPUTID_CODECONE;
    }
    /**
     * Returns the outputID for this output
     */
    getOutputID() {
        return this._typeID;
    }
    /**
     *
     * @param assetID An assetID which is wrapped around the Buffer of the Output
     */
    makeTransferable(assetID) {
        return new TransferableOutput(assetID, this);
    }
    create(...args) {
        return new SECPMintOutput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
    select(id, ...args) {
        return (0, exports.SelectOutputClass)(id, ...args);
    }
}
exports.SECPMintOutput = SECPMintOutput;
/**
 * An [[Output]] class which specifies an Output that carries an NFT Mint and uses secp256k1 signature scheme.
 */
class NFTMintOutput extends NFTOutput {
    /**
     * An [[Output]] class which contains an NFT mint for an assetID.
     *
     * @param groupID A number specifies the group this NFT is issued to
     * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing  addresses
     * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
     * @param threshold A number representing the the threshold number of signers required to sign the transaction
  
     */
    constructor(groupID = undefined, addresses = undefined, locktime = undefined, threshold = undefined) {
        super(addresses, locktime, threshold);
        this._typeName = "NFTMintOutput";
        this._codecID = constants_1.AXVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.AXVMConstants.NFTMINTOUTPUTID
            : constants_1.AXVMConstants.NFTMINTOUTPUTID_CODECONE;
        if (typeof groupID !== "undefined") {
            this.groupID.writeUInt32BE(groupID, 0);
        }
    }
    //serialize and deserialize both are inherited
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - NFTMintOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.AXVMConstants.NFTMINTOUTPUTID
                : constants_1.AXVMConstants.NFTMINTOUTPUTID_CODECONE;
    }
    /**
     * Returns the outputID for this output
     */
    getOutputID() {
        return this._typeID;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTMintOutput]] and returns the size of the output.
     */
    fromBuffer(utxobuff, offset = 0) {
        this.groupID = bintools.copyFrom(utxobuff, offset, offset + 4);
        offset += 4;
        return super.fromBuffer(utxobuff, offset);
    }
    /**
     * Returns the buffer representing the [[NFTMintOutput]] instance.
     */
    toBuffer() {
        let superbuff = super.toBuffer();
        let bsize = this.groupID.length + superbuff.length;
        let barr = [this.groupID, superbuff];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    create(...args) {
        return new NFTMintOutput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
}
exports.NFTMintOutput = NFTMintOutput;
/**
 * An [[Output]] class which specifies an Output that carries an NFT and uses secp256k1 signature scheme.
 */
class NFTTransferOutput extends NFTOutput {
    /**
       * An [[Output]] class which contains an NFT on an assetID.
       *
       * @param groupID A number representing the amount in the output
       * @param payload A {@link https://github.com/feross/buffer|Buffer} of max length 1024
       * @param addresses An array of {@link https://github.com/feross/buffer|Buffer}s representing addresses
       * @param locktime A {@link https://github.com/indutny/bn.js/|BN} representing the locktime
       * @param threshold A number representing the the threshold number of signers required to sign the transaction
  
       */
    constructor(groupID = undefined, payload = undefined, addresses = undefined, locktime = undefined, threshold = undefined) {
        super(addresses, locktime, threshold);
        this._typeName = "NFTTransferOutput";
        this._codecID = constants_1.AXVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.AXVMConstants.NFTXFEROUTPUTID
            : constants_1.AXVMConstants.NFTXFEROUTPUTID_CODECONE;
        this.sizePayload = buffer_1.Buffer.alloc(4);
        /**
         * Returns the payload as a {@link https://github.com/feross/buffer|Buffer} with content only.
         */
        this.getPayload = () => bintools.copyFrom(this.payload);
        /**
         * Returns the payload as a {@link https://github.com/feross/buffer|Buffer} with length of payload prepended.
         */
        this.getPayloadBuffer = () => buffer_1.Buffer.concat([
            bintools.copyFrom(this.sizePayload),
            bintools.copyFrom(this.payload)
        ]);
        if (typeof groupID !== "undefined" && typeof payload !== "undefined") {
            this.groupID.writeUInt32BE(groupID, 0);
            this.sizePayload.writeUInt32BE(payload.length, 0);
            this.payload = bintools.copyFrom(payload, 0, payload.length);
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { payload: serialization.encoder(this.payload, encoding, "Buffer", "hex", this.payload.length) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.payload = serialization.decoder(fields["payload"], encoding, "hex", "Buffer");
        this.sizePayload = buffer_1.Buffer.alloc(4);
        this.sizePayload.writeUInt32BE(this.payload.length, 0);
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - NFTTransferOutput.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.AXVMConstants.NFTXFEROUTPUTID
                : constants_1.AXVMConstants.NFTXFEROUTPUTID_CODECONE;
    }
    /**
     * Returns the outputID for this output
     */
    getOutputID() {
        return this._typeID;
    }
    /**
     * Popuates the instance from a {@link https://github.com/feross/buffer|Buffer} representing the [[NFTTransferOutput]] and returns the size of the output.
     */
    fromBuffer(utxobuff, offset = 0) {
        this.groupID = bintools.copyFrom(utxobuff, offset, offset + 4);
        offset += 4;
        this.sizePayload = bintools.copyFrom(utxobuff, offset, offset + 4);
        let psize = this.sizePayload.readUInt32BE(0);
        offset += 4;
        this.payload = bintools.copyFrom(utxobuff, offset, offset + psize);
        offset = offset + psize;
        return super.fromBuffer(utxobuff, offset);
    }
    /**
     * Returns the buffer representing the [[NFTTransferOutput]] instance.
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const bsize = this.groupID.length +
            this.sizePayload.length +
            this.payload.length +
            superbuff.length;
        this.sizePayload.writeUInt32BE(this.payload.length, 0);
        const barr = [
            this.groupID,
            this.sizePayload,
            this.payload,
            superbuff
        ];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    create(...args) {
        return new NFTTransferOutput(...args);
    }
    clone() {
        const newout = this.create();
        newout.fromBuffer(this.toBuffer());
        return newout;
    }
}
exports.NFTTransferOutput = NFTTransferOutput;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL2F4dm0vb3V0cHV0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBZ0M7QUFFaEMsb0VBQTJDO0FBQzNDLDJDQUEyQztBQUMzQyxnREFLNEI7QUFDNUIsNkRBQTZFO0FBQzdFLCtDQUFnRTtBQUVoRSxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWhFOzs7Ozs7R0FNRztBQUNJLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxRQUFnQixFQUFFLEdBQUcsSUFBVyxFQUFVLEVBQUU7SUFDNUUsSUFDRSxRQUFRLEtBQUsseUJBQWEsQ0FBQyxnQkFBZ0I7UUFDM0MsUUFBUSxLQUFLLHlCQUFhLENBQUMseUJBQXlCLEVBQ3BEO1FBQ0EsT0FBTyxJQUFJLGtCQUFrQixDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FDdkM7U0FBTSxJQUNMLFFBQVEsS0FBSyx5QkFBYSxDQUFDLGdCQUFnQjtRQUMzQyxRQUFRLEtBQUsseUJBQWEsQ0FBQyx5QkFBeUIsRUFDcEQ7UUFDQSxPQUFPLElBQUksY0FBYyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FDbkM7U0FBTSxJQUNMLFFBQVEsS0FBSyx5QkFBYSxDQUFDLGVBQWU7UUFDMUMsUUFBUSxLQUFLLHlCQUFhLENBQUMsd0JBQXdCLEVBQ25EO1FBQ0EsT0FBTyxJQUFJLGFBQWEsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFBO0tBQ2xDO1NBQU0sSUFDTCxRQUFRLEtBQUsseUJBQWEsQ0FBQyxlQUFlO1FBQzFDLFFBQVEsS0FBSyx5QkFBYSxDQUFDLHdCQUF3QixFQUNuRDtRQUNBLE9BQU8sSUFBSSxpQkFBaUIsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFBO0tBQ3RDO0lBQ0QsTUFBTSxJQUFJLHNCQUFhLENBQ3JCLDhDQUE4QyxHQUFHLFFBQVEsQ0FDMUQsQ0FBQTtBQUNILENBQUMsQ0FBQTtBQXpCWSxRQUFBLGlCQUFpQixxQkF5QjdCO0FBRUQsTUFBYSxrQkFBbUIsU0FBUSxtQ0FBMEI7SUFBbEU7O1FBQ1ksY0FBUyxHQUFHLG9CQUFvQixDQUFBO1FBQ2hDLFlBQU8sR0FBRyxTQUFTLENBQUE7SUF3Qi9CLENBQUM7SUF0QkMsd0JBQXdCO0lBRXhCLFdBQVcsQ0FBQyxNQUFjLEVBQUUsV0FBK0IsS0FBSztRQUM5RCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUNuQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUEseUJBQWlCLEVBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUE7UUFDNUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQ3JELENBQUM7SUFFRCxVQUFVLENBQUMsS0FBYSxFQUFFLFNBQWlCLENBQUM7UUFDMUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsUUFBUSxDQUM5QixLQUFLLEVBQ0wsTUFBTSxFQUNOLE1BQU0sR0FBRyx5QkFBYSxDQUFDLFVBQVUsQ0FDbEMsQ0FBQTtRQUNELE1BQU0sSUFBSSx5QkFBYSxDQUFDLFVBQVUsQ0FBQTtRQUNsQyxNQUFNLFFBQVEsR0FBVyxRQUFRO2FBQzlCLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUM7YUFDbkMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ2xCLE1BQU0sSUFBSSxDQUFDLENBQUE7UUFDWCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUEseUJBQWlCLEVBQUMsUUFBUSxDQUFDLENBQUE7UUFDekMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7SUFDOUMsQ0FBQztDQUNGO0FBMUJELGdEQTBCQztBQUVELE1BQXNCLFlBQWEsU0FBUSw2QkFBb0I7SUFBL0Q7O1FBQ1ksY0FBUyxHQUFHLGNBQWMsQ0FBQTtRQUMxQixZQUFPLEdBQUcsU0FBUyxDQUFBO0lBZS9CLENBQUM7SUFiQyw4Q0FBOEM7SUFFOUM7OztPQUdHO0lBQ0gsZ0JBQWdCLENBQUMsT0FBZTtRQUM5QixPQUFPLElBQUksa0JBQWtCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQzlDLENBQUM7SUFFRCxNQUFNLENBQUMsRUFBVSxFQUFFLEdBQUcsSUFBVztRQUMvQixPQUFPLElBQUEseUJBQWlCLEVBQUMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUE7SUFDdkMsQ0FBQztDQUNGO0FBakJELG9DQWlCQztBQUVELE1BQXNCLFNBQVUsU0FBUSxzQkFBYTtJQUFyRDs7UUFDWSxjQUFTLEdBQUcsV0FBVyxDQUFBO1FBQ3ZCLFlBQU8sR0FBRyxTQUFTLENBQUE7SUFlL0IsQ0FBQztJQWJDLDhDQUE4QztJQUU5Qzs7O09BR0c7SUFDSCxnQkFBZ0IsQ0FBQyxPQUFlO1FBQzlCLE9BQU8sSUFBSSxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDOUMsQ0FBQztJQUVELE1BQU0sQ0FBQyxFQUFVLEVBQUUsR0FBRyxJQUFXO1FBQy9CLE9BQU8sSUFBQSx5QkFBaUIsRUFBQyxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQTtJQUN2QyxDQUFDO0NBQ0Y7QUFqQkQsOEJBaUJDO0FBRUQ7O0dBRUc7QUFDSCxNQUFhLGtCQUFtQixTQUFRLFlBQVk7SUFBcEQ7O1FBQ1ksY0FBUyxHQUFHLG9CQUFvQixDQUFBO1FBQ2hDLGFBQVEsR0FBRyx5QkFBYSxDQUFDLFdBQVcsQ0FBQTtRQUNwQyxZQUFPLEdBQ2YsSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDO1lBQ2pCLENBQUMsQ0FBQyx5QkFBYSxDQUFDLGdCQUFnQjtZQUNoQyxDQUFDLENBQUMseUJBQWEsQ0FBQyx5QkFBeUIsQ0FBQTtJQXVDL0MsQ0FBQztJQXJDQyw4Q0FBOEM7SUFFOUM7Ozs7T0FJRztJQUNILFVBQVUsQ0FBQyxPQUFlO1FBQ3hCLElBQUksT0FBTyxLQUFLLENBQUMsSUFBSSxPQUFPLEtBQUssQ0FBQyxFQUFFO1lBQ2xDLDBCQUEwQjtZQUMxQixNQUFNLElBQUkscUJBQVksQ0FDcEIscUZBQXFGLENBQ3RGLENBQUE7U0FDRjtRQUNELElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxPQUFPO1lBQ1YsSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDO2dCQUNqQixDQUFDLENBQUMseUJBQWEsQ0FBQyxnQkFBZ0I7Z0JBQ2hDLENBQUMsQ0FBQyx5QkFBYSxDQUFDLHlCQUF5QixDQUFBO0lBQy9DLENBQUM7SUFFRDs7T0FFRztJQUNILFdBQVc7UUFDVCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUE7SUFDckIsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFHLElBQVc7UUFDbkIsT0FBTyxJQUFJLGtCQUFrQixDQUFDLEdBQUcsSUFBSSxDQUFTLENBQUE7SUFDaEQsQ0FBQztJQUVELEtBQUs7UUFDSCxNQUFNLE1BQU0sR0FBdUIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFBO1FBQ2hELE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7UUFDbEMsT0FBTyxNQUFjLENBQUE7SUFDdkIsQ0FBQztDQUNGO0FBN0NELGdEQTZDQztBQUVEOztHQUVHO0FBQ0gsTUFBYSxjQUFlLFNBQVEsZUFBTTtJQUExQzs7UUFDWSxjQUFTLEdBQUcsZ0JBQWdCLENBQUE7UUFDNUIsYUFBUSxHQUFHLHlCQUFhLENBQUMsV0FBVyxDQUFBO1FBQ3BDLFlBQU8sR0FDZixJQUFJLENBQUMsUUFBUSxLQUFLLENBQUM7WUFDakIsQ0FBQyxDQUFDLHlCQUFhLENBQUMsZ0JBQWdCO1lBQ2hDLENBQUMsQ0FBQyx5QkFBYSxDQUFDLHlCQUF5QixDQUFBO0lBbUQvQyxDQUFDO0lBakRDLDhDQUE4QztJQUU5Qzs7OztPQUlHO0lBQ0gsVUFBVSxDQUFDLE9BQWU7UUFDeEIsSUFBSSxPQUFPLEtBQUssQ0FBQyxJQUFJLE9BQU8sS0FBSyxDQUFDLEVBQUU7WUFDbEMsMEJBQTBCO1lBQzFCLE1BQU0sSUFBSSxxQkFBWSxDQUNwQixpRkFBaUYsQ0FDbEYsQ0FBQTtTQUNGO1FBQ0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUE7UUFDdkIsSUFBSSxDQUFDLE9BQU87WUFDVixJQUFJLENBQUMsUUFBUSxLQUFLLENBQUM7Z0JBQ2pCLENBQUMsQ0FBQyx5QkFBYSxDQUFDLGdCQUFnQjtnQkFDaEMsQ0FBQyxDQUFDLHlCQUFhLENBQUMseUJBQXlCLENBQUE7SUFDL0MsQ0FBQztJQUVEOztPQUVHO0lBQ0gsV0FBVztRQUNULE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQTtJQUNyQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsZ0JBQWdCLENBQUMsT0FBZTtRQUM5QixPQUFPLElBQUksa0JBQWtCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQzlDLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBRyxJQUFXO1FBQ25CLE9BQU8sSUFBSSxjQUFjLENBQUMsR0FBRyxJQUFJLENBQVMsQ0FBQTtJQUM1QyxDQUFDO0lBRUQsS0FBSztRQUNILE1BQU0sTUFBTSxHQUFtQixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7UUFDNUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtRQUNsQyxPQUFPLE1BQWMsQ0FBQTtJQUN2QixDQUFDO0lBRUQsTUFBTSxDQUFDLEVBQVUsRUFBRSxHQUFHLElBQVc7UUFDL0IsT0FBTyxJQUFBLHlCQUFpQixFQUFDLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFBO0lBQ3ZDLENBQUM7Q0FDRjtBQXpERCx3Q0F5REM7QUFFRDs7R0FFRztBQUNILE1BQWEsYUFBYyxTQUFRLFNBQVM7SUFpRTFDOzs7Ozs7OztPQVFHO0lBQ0gsWUFDRSxVQUFrQixTQUFTLEVBQzNCLFlBQXNCLFNBQVMsRUFDL0IsV0FBZSxTQUFTLEVBQ3hCLFlBQW9CLFNBQVM7UUFFN0IsS0FBSyxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUE7UUEvRTdCLGNBQVMsR0FBRyxlQUFlLENBQUE7UUFDM0IsYUFBUSxHQUFHLHlCQUFhLENBQUMsV0FBVyxDQUFBO1FBQ3BDLFlBQU8sR0FDZixJQUFJLENBQUMsUUFBUSxLQUFLLENBQUM7WUFDakIsQ0FBQyxDQUFDLHlCQUFhLENBQUMsZUFBZTtZQUMvQixDQUFDLENBQUMseUJBQWEsQ0FBQyx3QkFBd0IsQ0FBQTtRQTJFMUMsSUFBSSxPQUFPLE9BQU8sS0FBSyxXQUFXLEVBQUU7WUFDbEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFBO1NBQ3ZDO0lBQ0gsQ0FBQztJQTVFRCw4Q0FBOEM7SUFFOUM7Ozs7T0FJRztJQUNILFVBQVUsQ0FBQyxPQUFlO1FBQ3hCLElBQUksT0FBTyxLQUFLLENBQUMsSUFBSSxPQUFPLEtBQUssQ0FBQyxFQUFFO1lBQ2xDLDBCQUEwQjtZQUMxQixNQUFNLElBQUkscUJBQVksQ0FDcEIsZ0ZBQWdGLENBQ2pGLENBQUE7U0FDRjtRQUNELElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxPQUFPO1lBQ1YsSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDO2dCQUNqQixDQUFDLENBQUMseUJBQWEsQ0FBQyxlQUFlO2dCQUMvQixDQUFDLENBQUMseUJBQWEsQ0FBQyx3QkFBd0IsQ0FBQTtJQUM5QyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxXQUFXO1FBQ1QsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFBO0lBQ3JCLENBQUM7SUFFRDs7T0FFRztJQUNILFVBQVUsQ0FBQyxRQUFnQixFQUFFLFNBQWlCLENBQUM7UUFDN0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBQzlELE1BQU0sSUFBSSxDQUFDLENBQUE7UUFDWCxPQUFPLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFBO0lBQzNDLENBQUM7SUFFRDs7T0FFRztJQUNILFFBQVE7UUFDTixJQUFJLFNBQVMsR0FBVyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDeEMsSUFBSSxLQUFLLEdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQTtRQUMxRCxJQUFJLElBQUksR0FBYSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUE7UUFDOUMsT0FBTyxlQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUNuQyxDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBVztRQUNuQixPQUFPLElBQUksYUFBYSxDQUFDLEdBQUcsSUFBSSxDQUFTLENBQUE7SUFDM0MsQ0FBQztJQUVELEtBQUs7UUFDSCxNQUFNLE1BQU0sR0FBa0IsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFBO1FBQzNDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7UUFDbEMsT0FBTyxNQUFjLENBQUE7SUFDdkIsQ0FBQztDQXNCRjtBQXJGRCxzQ0FxRkM7QUFFRDs7R0FFRztBQUNILE1BQWEsaUJBQWtCLFNBQVEsU0FBUztJQXdIOUM7Ozs7Ozs7OztTQVNLO0lBQ0wsWUFDRSxVQUFrQixTQUFTLEVBQzNCLFVBQWtCLFNBQVMsRUFDM0IsWUFBc0IsU0FBUyxFQUMvQixXQUFlLFNBQVMsRUFDeEIsWUFBb0IsU0FBUztRQUU3QixLQUFLLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQXhJN0IsY0FBUyxHQUFHLG1CQUFtQixDQUFBO1FBQy9CLGFBQVEsR0FBRyx5QkFBYSxDQUFDLFdBQVcsQ0FBQTtRQUNwQyxZQUFPLEdBQ2YsSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDO1lBQ2pCLENBQUMsQ0FBQyx5QkFBYSxDQUFDLGVBQWU7WUFDL0IsQ0FBQyxDQUFDLHlCQUFhLENBQUMsd0JBQXdCLENBQUE7UUEyQmxDLGdCQUFXLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQTZCL0M7O1dBRUc7UUFDSCxlQUFVLEdBQUcsR0FBVyxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7UUFFMUQ7O1dBRUc7UUFDSCxxQkFBZ0IsR0FBRyxHQUFXLEVBQUUsQ0FDOUIsZUFBTSxDQUFDLE1BQU0sQ0FBQztZQUNaLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUNuQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7U0FDaEMsQ0FBQyxDQUFBO1FBZ0VGLElBQUksT0FBTyxPQUFPLEtBQUssV0FBVyxJQUFJLE9BQU8sT0FBTyxLQUFLLFdBQVcsRUFBRTtZQUNwRSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDdEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUNqRCxJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7U0FDN0Q7SUFDSCxDQUFDO0lBdklELFNBQVMsQ0FBQyxXQUErQixLQUFLO1FBQzVDLElBQUksTUFBTSxHQUFXLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDOUMsdUNBQ0ssTUFBTSxLQUNULE9BQU8sRUFBRSxhQUFhLENBQUMsT0FBTyxDQUM1QixJQUFJLENBQUMsT0FBTyxFQUNaLFFBQVEsRUFDUixRQUFRLEVBQ1IsS0FBSyxFQUNMLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUNwQixJQUNGO0lBQ0gsQ0FBQztJQUNELFdBQVcsQ0FBQyxNQUFjLEVBQUUsV0FBK0IsS0FBSztRQUM5RCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUNuQyxJQUFJLENBQUMsT0FBTyxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQ2xDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFDakIsUUFBUSxFQUNSLEtBQUssRUFDTCxRQUFRLENBQ1QsQ0FBQTtRQUNELElBQUksQ0FBQyxXQUFXLEdBQUcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNsQyxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUN4RCxDQUFDO0lBS0Q7Ozs7T0FJRztJQUNILFVBQVUsQ0FBQyxPQUFlO1FBQ3hCLElBQUksT0FBTyxLQUFLLENBQUMsSUFBSSxPQUFPLEtBQUssQ0FBQyxFQUFFO1lBQ2xDLDBCQUEwQjtZQUMxQixNQUFNLElBQUkscUJBQVksQ0FDcEIsb0ZBQW9GLENBQ3JGLENBQUE7U0FDRjtRQUNELElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxPQUFPO1lBQ1YsSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDO2dCQUNqQixDQUFDLENBQUMseUJBQWEsQ0FBQyxlQUFlO2dCQUMvQixDQUFDLENBQUMseUJBQWEsQ0FBQyx3QkFBd0IsQ0FBQTtJQUM5QyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxXQUFXO1FBQ1QsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFBO0lBQ3JCLENBQUM7SUFnQkQ7O09BRUc7SUFDSCxVQUFVLENBQUMsUUFBZ0IsRUFBRSxTQUFpQixDQUFDO1FBQzdDLElBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUM5RCxNQUFNLElBQUksQ0FBQyxDQUFBO1FBQ1gsSUFBSSxDQUFDLFdBQVcsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBQ2xFLElBQUksS0FBSyxHQUFXLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3BELE1BQU0sSUFBSSxDQUFDLENBQUE7UUFDWCxJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxNQUFNLEdBQUcsS0FBSyxDQUFDLENBQUE7UUFDbEUsTUFBTSxHQUFHLE1BQU0sR0FBRyxLQUFLLENBQUE7UUFDdkIsT0FBTyxLQUFLLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQTtJQUMzQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxRQUFRO1FBQ04sTUFBTSxTQUFTLEdBQVcsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFBO1FBQzFDLE1BQU0sS0FBSyxHQUNULElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTTtZQUNuQixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU07WUFDdkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNO1lBQ25CLFNBQVMsQ0FBQyxNQUFNLENBQUE7UUFDbEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDdEQsTUFBTSxJQUFJLEdBQWE7WUFDckIsSUFBSSxDQUFDLE9BQU87WUFDWixJQUFJLENBQUMsV0FBVztZQUNoQixJQUFJLENBQUMsT0FBTztZQUNaLFNBQVM7U0FDVixDQUFBO1FBQ0QsT0FBTyxlQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUNuQyxDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBVztRQUNuQixPQUFPLElBQUksaUJBQWlCLENBQUMsR0FBRyxJQUFJLENBQVMsQ0FBQTtJQUMvQyxDQUFDO0lBRUQsS0FBSztRQUNILE1BQU0sTUFBTSxHQUFzQixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7UUFDL0MsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQTtRQUNsQyxPQUFPLE1BQWMsQ0FBQTtJQUN2QixDQUFDO0NBMEJGO0FBaEpELDhDQWdKQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1BWFZNLU91dHB1dHNcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IEFYVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHtcbiAgT3V0cHV0LFxuICBTdGFuZGFyZEFtb3VudE91dHB1dCxcbiAgU3RhbmRhcmRUcmFuc2ZlcmFibGVPdXRwdXQsXG4gIEJhc2VORlRPdXRwdXRcbn0gZnJvbSBcIi4uLy4uL2NvbW1vbi9vdXRwdXRcIlxuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxuaW1wb3J0IHsgT3V0cHV0SWRFcnJvciwgQ29kZWNJZEVycm9yIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXG5cbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcbmNvbnN0IHNlcmlhbGl6YXRpb246IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcblxuLyoqXG4gKiBUYWtlcyBhIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIG91dHB1dCBhbmQgcmV0dXJucyB0aGUgcHJvcGVyIE91dHB1dCBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0gb3V0cHV0aWQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBpbnB1dElEIHBhcnNlZCBwcmlvciB0byB0aGUgYnl0ZXMgcGFzc2VkIGluXG4gKlxuICogQHJldHVybnMgQW4gaW5zdGFuY2Ugb2YgYW4gW1tPdXRwdXRdXS1leHRlbmRlZCBjbGFzcy5cbiAqL1xuZXhwb3J0IGNvbnN0IFNlbGVjdE91dHB1dENsYXNzID0gKG91dHB1dGlkOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKTogT3V0cHV0ID0+IHtcbiAgaWYgKFxuICAgIG91dHB1dGlkID09PSBBWFZNQ29uc3RhbnRzLlNFQ1BYRkVST1VUUFVUSUQgfHxcbiAgICBvdXRwdXRpZCA9PT0gQVhWTUNvbnN0YW50cy5TRUNQWEZFUk9VVFBVVElEX0NPREVDT05FXG4gICkge1xuICAgIHJldHVybiBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KC4uLmFyZ3MpXG4gIH0gZWxzZSBpZiAoXG4gICAgb3V0cHV0aWQgPT09IEFYVk1Db25zdGFudHMuU0VDUE1JTlRPVVRQVVRJRCB8fFxuICAgIG91dHB1dGlkID09PSBBWFZNQ29uc3RhbnRzLlNFQ1BNSU5UT1VUUFVUSURfQ09ERUNPTkVcbiAgKSB7XG4gICAgcmV0dXJuIG5ldyBTRUNQTWludE91dHB1dCguLi5hcmdzKVxuICB9IGVsc2UgaWYgKFxuICAgIG91dHB1dGlkID09PSBBWFZNQ29uc3RhbnRzLk5GVE1JTlRPVVRQVVRJRCB8fFxuICAgIG91dHB1dGlkID09PSBBWFZNQ29uc3RhbnRzLk5GVE1JTlRPVVRQVVRJRF9DT0RFQ09ORVxuICApIHtcbiAgICByZXR1cm4gbmV3IE5GVE1pbnRPdXRwdXQoLi4uYXJncylcbiAgfSBlbHNlIGlmIChcbiAgICBvdXRwdXRpZCA9PT0gQVhWTUNvbnN0YW50cy5ORlRYRkVST1VUUFVUSUQgfHxcbiAgICBvdXRwdXRpZCA9PT0gQVhWTUNvbnN0YW50cy5ORlRYRkVST1VUUFVUSURfQ09ERUNPTkVcbiAgKSB7XG4gICAgcmV0dXJuIG5ldyBORlRUcmFuc2Zlck91dHB1dCguLi5hcmdzKVxuICB9XG4gIHRocm93IG5ldyBPdXRwdXRJZEVycm9yKFxuICAgIFwiRXJyb3IgLSBTZWxlY3RPdXRwdXRDbGFzczogdW5rbm93biBvdXRwdXRpZCBcIiArIG91dHB1dGlkXG4gIClcbn1cblxuZXhwb3J0IGNsYXNzIFRyYW5zZmVyYWJsZU91dHB1dCBleHRlbmRzIFN0YW5kYXJkVHJhbnNmZXJhYmxlT3V0cHV0IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVHJhbnNmZXJhYmxlT3V0cHV0XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICAvL3NlcmlhbGl6ZSBpcyBpbmhlcml0ZWRcblxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMub3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3MoZmllbGRzW1wib3V0cHV0XCJdW1wiX3R5cGVJRFwiXSlcbiAgICB0aGlzLm91dHB1dC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJvdXRwdXRcIl0sIGVuY29kaW5nKVxuICB9XG5cbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xuICAgIHRoaXMuYXNzZXRJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKFxuICAgICAgYnl0ZXMsXG4gICAgICBvZmZzZXQsXG4gICAgICBvZmZzZXQgKyBBWFZNQ29uc3RhbnRzLkFTU0VUSURMRU5cbiAgICApXG4gICAgb2Zmc2V0ICs9IEFYVk1Db25zdGFudHMuQVNTRVRJRExFTlxuICAgIGNvbnN0IG91dHB1dGlkOiBudW1iZXIgPSBiaW50b29sc1xuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgICAucmVhZFVJbnQzMkJFKDApXG4gICAgb2Zmc2V0ICs9IDRcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKG91dHB1dGlkKVxuICAgIHJldHVybiB0aGlzLm91dHB1dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gIH1cbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEFtb3VudE91dHB1dCBleHRlbmRzIFN0YW5kYXJkQW1vdW50T3V0cHV0IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiQW1vdW50T3V0cHV0XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBhc3NldElEIEFuIGFzc2V0SUQgd2hpY2ggaXMgd3JhcHBlZCBhcm91bmQgdGhlIEJ1ZmZlciBvZiB0aGUgT3V0cHV0XG4gICAqL1xuICBtYWtlVHJhbnNmZXJhYmxlKGFzc2V0SUQ6IEJ1ZmZlcik6IFRyYW5zZmVyYWJsZU91dHB1dCB7XG4gICAgcmV0dXJuIG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXNzZXRJRCwgdGhpcylcbiAgfVxuXG4gIHNlbGVjdChpZDogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IE91dHB1dCB7XG4gICAgcmV0dXJuIFNlbGVjdE91dHB1dENsYXNzKGlkLCAuLi5hcmdzKVxuICB9XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBORlRPdXRwdXQgZXh0ZW5kcyBCYXNlTkZUT3V0cHV0IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiTkZUT3V0cHV0XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICAvL3NlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgYm90aCBhcmUgaW5oZXJpdGVkXG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBhc3NldElEIEFuIGFzc2V0SUQgd2hpY2ggaXMgd3JhcHBlZCBhcm91bmQgdGhlIEJ1ZmZlciBvZiB0aGUgT3V0cHV0XG4gICAqL1xuICBtYWtlVHJhbnNmZXJhYmxlKGFzc2V0SUQ6IEJ1ZmZlcik6IFRyYW5zZmVyYWJsZU91dHB1dCB7XG4gICAgcmV0dXJuIG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXNzZXRJRCwgdGhpcylcbiAgfVxuXG4gIHNlbGVjdChpZDogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IE91dHB1dCB7XG4gICAgcmV0dXJuIFNlbGVjdE91dHB1dENsYXNzKGlkLCAuLi5hcmdzKVxuICB9XG59XG5cbi8qKlxuICogQW4gW1tPdXRwdXRdXSBjbGFzcyB3aGljaCBzcGVjaWZpZXMgYW4gT3V0cHV0IHRoYXQgY2FycmllcyBhbiBhbW1vdW50IGZvciBhbiBhc3NldElEIGFuZCB1c2VzIHNlY3AyNTZrMSBzaWduYXR1cmUgc2NoZW1lLlxuICovXG5leHBvcnQgY2xhc3MgU0VDUFRyYW5zZmVyT3V0cHV0IGV4dGVuZHMgQW1vdW50T3V0cHV0IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiU0VDUFRyYW5zZmVyT3V0cHV0XCJcbiAgcHJvdGVjdGVkIF9jb2RlY0lEID0gQVhWTUNvbnN0YW50cy5MQVRFU1RDT0RFQ1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9XG4gICAgdGhpcy5fY29kZWNJRCA9PT0gMFxuICAgICAgPyBBWFZNQ29uc3RhbnRzLlNFQ1BYRkVST1VUUFVUSURcbiAgICAgIDogQVhWTUNvbnN0YW50cy5TRUNQWEZFUk9VVFBVVElEX0NPREVDT05FXG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvZGVjSURcbiAgICpcbiAgICogQHBhcmFtIGNvZGVjSUQgVGhlIGNvZGVjSUQgdG8gc2V0XG4gICAqL1xuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChjb2RlY0lEICE9PSAwICYmIGNvZGVjSUQgIT09IDEpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgQ29kZWNJZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gU0VDUFRyYW5zZmVyT3V0cHV0LnNldENvZGVjSUQ6IGludmFsaWQgY29kZWNJRC4gVmFsaWQgY29kZWNJRHMgYXJlIDAgYW5kIDEuXCJcbiAgICAgIClcbiAgICB9XG4gICAgdGhpcy5fY29kZWNJRCA9IGNvZGVjSURcbiAgICB0aGlzLl90eXBlSUQgPVxuICAgICAgdGhpcy5fY29kZWNJRCA9PT0gMFxuICAgICAgICA/IEFYVk1Db25zdGFudHMuU0VDUFhGRVJPVVRQVVRJRFxuICAgICAgICA6IEFYVk1Db25zdGFudHMuU0VDUFhGRVJPVVRQVVRJRF9DT0RFQ09ORVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG91dHB1dElEIGZvciB0aGlzIG91dHB1dFxuICAgKi9cbiAgZ2V0T3V0cHV0SUQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dCguLi5hcmdzKSBhcyB0aGlzXG4gIH1cblxuICBjbG9uZSgpOiB0aGlzIHtcbiAgICBjb25zdCBuZXdvdXQ6IFNFQ1BUcmFuc2Zlck91dHB1dCA9IHRoaXMuY3JlYXRlKClcbiAgICBuZXdvdXQuZnJvbUJ1ZmZlcih0aGlzLnRvQnVmZmVyKCkpXG4gICAgcmV0dXJuIG5ld291dCBhcyB0aGlzXG4gIH1cbn1cblxuLyoqXG4gKiBBbiBbW091dHB1dF1dIGNsYXNzIHdoaWNoIHNwZWNpZmllcyBhbiBPdXRwdXQgdGhhdCBjYXJyaWVzIGFuIGFtbW91bnQgZm9yIGFuIGFzc2V0SUQgYW5kIHVzZXMgc2VjcDI1NmsxIHNpZ25hdHVyZSBzY2hlbWUuXG4gKi9cbmV4cG9ydCBjbGFzcyBTRUNQTWludE91dHB1dCBleHRlbmRzIE91dHB1dCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlNFQ1BNaW50T3V0cHV0XCJcbiAgcHJvdGVjdGVkIF9jb2RlY0lEID0gQVhWTUNvbnN0YW50cy5MQVRFU1RDT0RFQ1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9XG4gICAgdGhpcy5fY29kZWNJRCA9PT0gMFxuICAgICAgPyBBWFZNQ29uc3RhbnRzLlNFQ1BNSU5UT1VUUFVUSURcbiAgICAgIDogQVhWTUNvbnN0YW50cy5TRUNQTUlOVE9VVFBVVElEX0NPREVDT05FXG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvZGVjSURcbiAgICpcbiAgICogQHBhcmFtIGNvZGVjSUQgVGhlIGNvZGVjSUQgdG8gc2V0XG4gICAqL1xuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChjb2RlY0lEICE9PSAwICYmIGNvZGVjSUQgIT09IDEpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgQ29kZWNJZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gU0VDUE1pbnRPdXRwdXQuc2V0Q29kZWNJRDogaW52YWxpZCBjb2RlY0lELiBWYWxpZCBjb2RlY0lEcyBhcmUgMCBhbmQgMS5cIlxuICAgICAgKVxuICAgIH1cbiAgICB0aGlzLl9jb2RlY0lEID0gY29kZWNJRFxuICAgIHRoaXMuX3R5cGVJRCA9XG4gICAgICB0aGlzLl9jb2RlY0lEID09PSAwXG4gICAgICAgID8gQVhWTUNvbnN0YW50cy5TRUNQTUlOVE9VVFBVVElEXG4gICAgICAgIDogQVhWTUNvbnN0YW50cy5TRUNQTUlOVE9VVFBVVElEX0NPREVDT05FXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgb3V0cHV0SUQgZm9yIHRoaXMgb3V0cHV0XG4gICAqL1xuICBnZXRPdXRwdXRJRCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90eXBlSURcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gYXNzZXRJRCBBbiBhc3NldElEIHdoaWNoIGlzIHdyYXBwZWQgYXJvdW5kIHRoZSBCdWZmZXIgb2YgdGhlIE91dHB1dFxuICAgKi9cbiAgbWFrZVRyYW5zZmVyYWJsZShhc3NldElEOiBCdWZmZXIpOiBUcmFuc2ZlcmFibGVPdXRwdXQge1xuICAgIHJldHVybiBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KGFzc2V0SUQsIHRoaXMpXG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IFNFQ1BNaW50T3V0cHV0KC4uLmFyZ3MpIGFzIHRoaXNcbiAgfVxuXG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGNvbnN0IG5ld291dDogU0VDUE1pbnRPdXRwdXQgPSB0aGlzLmNyZWF0ZSgpXG4gICAgbmV3b3V0LmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxuICAgIHJldHVybiBuZXdvdXQgYXMgdGhpc1xuICB9XG5cbiAgc2VsZWN0KGlkOiBudW1iZXIsIC4uLmFyZ3M6IGFueVtdKTogT3V0cHV0IHtcbiAgICByZXR1cm4gU2VsZWN0T3V0cHV0Q2xhc3MoaWQsIC4uLmFyZ3MpXG4gIH1cbn1cblxuLyoqXG4gKiBBbiBbW091dHB1dF1dIGNsYXNzIHdoaWNoIHNwZWNpZmllcyBhbiBPdXRwdXQgdGhhdCBjYXJyaWVzIGFuIE5GVCBNaW50IGFuZCB1c2VzIHNlY3AyNTZrMSBzaWduYXR1cmUgc2NoZW1lLlxuICovXG5leHBvcnQgY2xhc3MgTkZUTWludE91dHB1dCBleHRlbmRzIE5GVE91dHB1dCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIk5GVE1pbnRPdXRwdXRcIlxuICBwcm90ZWN0ZWQgX2NvZGVjSUQgPSBBWFZNQ29uc3RhbnRzLkxBVEVTVENPREVDXG4gIHByb3RlY3RlZCBfdHlwZUlEID1cbiAgICB0aGlzLl9jb2RlY0lEID09PSAwXG4gICAgICA/IEFYVk1Db25zdGFudHMuTkZUTUlOVE9VVFBVVElEXG4gICAgICA6IEFYVk1Db25zdGFudHMuTkZUTUlOVE9VVFBVVElEX0NPREVDT05FXG5cbiAgLy9zZXJpYWxpemUgYW5kIGRlc2VyaWFsaXplIGJvdGggYXJlIGluaGVyaXRlZFxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvZGVjSURcbiAgICpcbiAgICogQHBhcmFtIGNvZGVjSUQgVGhlIGNvZGVjSUQgdG8gc2V0XG4gICAqL1xuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChjb2RlY0lEICE9PSAwICYmIGNvZGVjSUQgIT09IDEpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgQ29kZWNJZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gTkZUTWludE91dHB1dC5zZXRDb2RlY0lEOiBpbnZhbGlkIGNvZGVjSUQuIFZhbGlkIGNvZGVjSURzIGFyZSAwIGFuZCAxLlwiXG4gICAgICApXG4gICAgfVxuICAgIHRoaXMuX2NvZGVjSUQgPSBjb2RlY0lEXG4gICAgdGhpcy5fdHlwZUlEID1cbiAgICAgIHRoaXMuX2NvZGVjSUQgPT09IDBcbiAgICAgICAgPyBBWFZNQ29uc3RhbnRzLk5GVE1JTlRPVVRQVVRJRFxuICAgICAgICA6IEFYVk1Db25zdGFudHMuTkZUTUlOVE9VVFBVVElEX0NPREVDT05FXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgb3V0cHV0SUQgZm9yIHRoaXMgb3V0cHV0XG4gICAqL1xuICBnZXRPdXRwdXRJRCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90eXBlSURcbiAgfVxuXG4gIC8qKlxuICAgKiBQb3B1YXRlcyB0aGUgaW5zdGFuY2UgZnJvbSBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgW1tORlRNaW50T3V0cHV0XV0gYW5kIHJldHVybnMgdGhlIHNpemUgb2YgdGhlIG91dHB1dC5cbiAgICovXG4gIGZyb21CdWZmZXIodXR4b2J1ZmY6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICB0aGlzLmdyb3VwSUQgPSBiaW50b29scy5jb3B5RnJvbSh1dHhvYnVmZiwgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgIG9mZnNldCArPSA0XG4gICAgcmV0dXJuIHN1cGVyLmZyb21CdWZmZXIodXR4b2J1ZmYsIG9mZnNldClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBidWZmZXIgcmVwcmVzZW50aW5nIHRoZSBbW05GVE1pbnRPdXRwdXRdXSBpbnN0YW5jZS5cbiAgICovXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgbGV0IHN1cGVyYnVmZjogQnVmZmVyID0gc3VwZXIudG9CdWZmZXIoKVxuICAgIGxldCBic2l6ZTogbnVtYmVyID0gdGhpcy5ncm91cElELmxlbmd0aCArIHN1cGVyYnVmZi5sZW5ndGhcbiAgICBsZXQgYmFycjogQnVmZmVyW10gPSBbdGhpcy5ncm91cElELCBzdXBlcmJ1ZmZdXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IE5GVE1pbnRPdXRwdXQoLi4uYXJncykgYXMgdGhpc1xuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgY29uc3QgbmV3b3V0OiBORlRNaW50T3V0cHV0ID0gdGhpcy5jcmVhdGUoKVxuICAgIG5ld291dC5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcbiAgICByZXR1cm4gbmV3b3V0IGFzIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBbW091dHB1dF1dIGNsYXNzIHdoaWNoIGNvbnRhaW5zIGFuIE5GVCBtaW50IGZvciBhbiBhc3NldElELlxuICAgKlxuICAgKiBAcGFyYW0gZ3JvdXBJRCBBIG51bWJlciBzcGVjaWZpZXMgdGhlIGdyb3VwIHRoaXMgTkZUIGlzIGlzc3VlZCB0b1xuICAgKiBAcGFyYW0gYWRkcmVzc2VzIEFuIGFycmF5IG9mIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9cyByZXByZXNlbnRpbmcgIGFkZHJlc3Nlc1xuICAgKiBAcGFyYW0gbG9ja3RpbWUgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSByZXByZXNlbnRpbmcgdGhlIGxvY2t0aW1lXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSB0aGUgdGhyZXNob2xkIG51bWJlciBvZiBzaWduZXJzIHJlcXVpcmVkIHRvIHNpZ24gdGhlIHRyYW5zYWN0aW9uXG5cbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIGdyb3VwSUQ6IG51bWJlciA9IHVuZGVmaW5lZCxcbiAgICBhZGRyZXNzZXM6IEJ1ZmZlcltdID0gdW5kZWZpbmVkLFxuICAgIGxvY2t0aW1lOiBCTiA9IHVuZGVmaW5lZCxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcihhZGRyZXNzZXMsIGxvY2t0aW1lLCB0aHJlc2hvbGQpXG4gICAgaWYgKHR5cGVvZiBncm91cElEICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLmdyb3VwSUQud3JpdGVVSW50MzJCRShncm91cElELCAwKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFuIFtbT3V0cHV0XV0gY2xhc3Mgd2hpY2ggc3BlY2lmaWVzIGFuIE91dHB1dCB0aGF0IGNhcnJpZXMgYW4gTkZUIGFuZCB1c2VzIHNlY3AyNTZrMSBzaWduYXR1cmUgc2NoZW1lLlxuICovXG5leHBvcnQgY2xhc3MgTkZUVHJhbnNmZXJPdXRwdXQgZXh0ZW5kcyBORlRPdXRwdXQge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJORlRUcmFuc2Zlck91dHB1dFwiXG4gIHByb3RlY3RlZCBfY29kZWNJRCA9IEFYVk1Db25zdGFudHMuTEFURVNUQ09ERUNcbiAgcHJvdGVjdGVkIF90eXBlSUQgPVxuICAgIHRoaXMuX2NvZGVjSUQgPT09IDBcbiAgICAgID8gQVhWTUNvbnN0YW50cy5ORlRYRkVST1VUUFVUSURcbiAgICAgIDogQVhWTUNvbnN0YW50cy5ORlRYRkVST1VUUFVUSURfQ09ERUNPTkVcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgcGF5bG9hZDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxuICAgICAgICB0aGlzLnBheWxvYWQsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBcIkJ1ZmZlclwiLFxuICAgICAgICBcImhleFwiLFxuICAgICAgICB0aGlzLnBheWxvYWQubGVuZ3RoXG4gICAgICApXG4gICAgfVxuICB9XG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy5wYXlsb2FkID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wicGF5bG9hZFwiXSxcbiAgICAgIGVuY29kaW5nLFxuICAgICAgXCJoZXhcIixcbiAgICAgIFwiQnVmZmVyXCJcbiAgICApXG4gICAgdGhpcy5zaXplUGF5bG9hZCA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIHRoaXMuc2l6ZVBheWxvYWQud3JpdGVVSW50MzJCRSh0aGlzLnBheWxvYWQubGVuZ3RoLCAwKVxuICB9XG5cbiAgcHJvdGVjdGVkIHNpemVQYXlsb2FkOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgcHJvdGVjdGVkIHBheWxvYWQ6IEJ1ZmZlclxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvZGVjSURcbiAgICpcbiAgICogQHBhcmFtIGNvZGVjSUQgVGhlIGNvZGVjSUQgdG8gc2V0XG4gICAqL1xuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChjb2RlY0lEICE9PSAwICYmIGNvZGVjSUQgIT09IDEpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgQ29kZWNJZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gTkZUVHJhbnNmZXJPdXRwdXQuc2V0Q29kZWNJRDogaW52YWxpZCBjb2RlY0lELiBWYWxpZCBjb2RlY0lEcyBhcmUgMCBhbmQgMS5cIlxuICAgICAgKVxuICAgIH1cbiAgICB0aGlzLl9jb2RlY0lEID0gY29kZWNJRFxuICAgIHRoaXMuX3R5cGVJRCA9XG4gICAgICB0aGlzLl9jb2RlY0lEID09PSAwXG4gICAgICAgID8gQVhWTUNvbnN0YW50cy5ORlRYRkVST1VUUFVUSURcbiAgICAgICAgOiBBWFZNQ29uc3RhbnRzLk5GVFhGRVJPVVRQVVRJRF9DT0RFQ09ORVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG91dHB1dElEIGZvciB0aGlzIG91dHB1dFxuICAgKi9cbiAgZ2V0T3V0cHV0SUQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcGF5bG9hZCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdpdGggY29udGVudCBvbmx5LlxuICAgKi9cbiAgZ2V0UGF5bG9hZCA9ICgpOiBCdWZmZXIgPT4gYmludG9vbHMuY29weUZyb20odGhpcy5wYXlsb2FkKVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwYXlsb2FkIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2l0aCBsZW5ndGggb2YgcGF5bG9hZCBwcmVwZW5kZWQuXG4gICAqL1xuICBnZXRQYXlsb2FkQnVmZmVyID0gKCk6IEJ1ZmZlciA9PlxuICAgIEJ1ZmZlci5jb25jYXQoW1xuICAgICAgYmludG9vbHMuY29weUZyb20odGhpcy5zaXplUGF5bG9hZCksXG4gICAgICBiaW50b29scy5jb3B5RnJvbSh0aGlzLnBheWxvYWQpXG4gICAgXSlcblxuICAvKipcbiAgICogUG9wdWF0ZXMgdGhlIGluc3RhbmNlIGZyb20gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIFtbTkZUVHJhbnNmZXJPdXRwdXRdXSBhbmQgcmV0dXJucyB0aGUgc2l6ZSBvZiB0aGUgb3V0cHV0LlxuICAgKi9cbiAgZnJvbUJ1ZmZlcih1dHhvYnVmZjogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xuICAgIHRoaXMuZ3JvdXBJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKHV0eG9idWZmLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgb2Zmc2V0ICs9IDRcbiAgICB0aGlzLnNpemVQYXlsb2FkID0gYmludG9vbHMuY29weUZyb20odXR4b2J1ZmYsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICBsZXQgcHNpemU6IG51bWJlciA9IHRoaXMuc2l6ZVBheWxvYWQucmVhZFVJbnQzMkJFKDApXG4gICAgb2Zmc2V0ICs9IDRcbiAgICB0aGlzLnBheWxvYWQgPSBiaW50b29scy5jb3B5RnJvbSh1dHhvYnVmZiwgb2Zmc2V0LCBvZmZzZXQgKyBwc2l6ZSlcbiAgICBvZmZzZXQgPSBvZmZzZXQgKyBwc2l6ZVxuICAgIHJldHVybiBzdXBlci5mcm9tQnVmZmVyKHV0eG9idWZmLCBvZmZzZXQpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYnVmZmVyIHJlcHJlc2VudGluZyB0aGUgW1tORlRUcmFuc2Zlck91dHB1dF1dIGluc3RhbmNlLlxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBjb25zdCBzdXBlcmJ1ZmY6IEJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKClcbiAgICBjb25zdCBic2l6ZTogbnVtYmVyID1cbiAgICAgIHRoaXMuZ3JvdXBJRC5sZW5ndGggK1xuICAgICAgdGhpcy5zaXplUGF5bG9hZC5sZW5ndGggK1xuICAgICAgdGhpcy5wYXlsb2FkLmxlbmd0aCArXG4gICAgICBzdXBlcmJ1ZmYubGVuZ3RoXG4gICAgdGhpcy5zaXplUGF5bG9hZC53cml0ZVVJbnQzMkJFKHRoaXMucGF5bG9hZC5sZW5ndGgsIDApXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbXG4gICAgICB0aGlzLmdyb3VwSUQsXG4gICAgICB0aGlzLnNpemVQYXlsb2FkLFxuICAgICAgdGhpcy5wYXlsb2FkLFxuICAgICAgc3VwZXJidWZmXG4gICAgXVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XG4gICAgcmV0dXJuIG5ldyBORlRUcmFuc2Zlck91dHB1dCguLi5hcmdzKSBhcyB0aGlzXG4gIH1cblxuICBjbG9uZSgpOiB0aGlzIHtcbiAgICBjb25zdCBuZXdvdXQ6IE5GVFRyYW5zZmVyT3V0cHV0ID0gdGhpcy5jcmVhdGUoKVxuICAgIG5ld291dC5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcbiAgICByZXR1cm4gbmV3b3V0IGFzIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgICAqIEFuIFtbT3V0cHV0XV0gY2xhc3Mgd2hpY2ggY29udGFpbnMgYW4gTkZUIG9uIGFuIGFzc2V0SUQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZ3JvdXBJRCBBIG51bWJlciByZXByZXNlbnRpbmcgdGhlIGFtb3VudCBpbiB0aGUgb3V0cHV0XG4gICAgICogQHBhcmFtIHBheWxvYWQgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiBtYXggbGVuZ3RoIDEwMjRcbiAgICAgKiBAcGFyYW0gYWRkcmVzc2VzIEFuIGFycmF5IG9mIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9cyByZXByZXNlbnRpbmcgYWRkcmVzc2VzXG4gICAgICogQHBhcmFtIGxvY2t0aW1lIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gcmVwcmVzZW50aW5nIHRoZSBsb2NrdGltZVxuICAgICAqIEBwYXJhbSB0aHJlc2hvbGQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSB0aGUgdGhyZXNob2xkIG51bWJlciBvZiBzaWduZXJzIHJlcXVpcmVkIHRvIHNpZ24gdGhlIHRyYW5zYWN0aW9uXG5cbiAgICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgZ3JvdXBJRDogbnVtYmVyID0gdW5kZWZpbmVkLFxuICAgIHBheWxvYWQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhZGRyZXNzZXM6IEJ1ZmZlcltdID0gdW5kZWZpbmVkLFxuICAgIGxvY2t0aW1lOiBCTiA9IHVuZGVmaW5lZCxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcihhZGRyZXNzZXMsIGxvY2t0aW1lLCB0aHJlc2hvbGQpXG4gICAgaWYgKHR5cGVvZiBncm91cElEICE9PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiBwYXlsb2FkICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLmdyb3VwSUQud3JpdGVVSW50MzJCRShncm91cElELCAwKVxuICAgICAgdGhpcy5zaXplUGF5bG9hZC53cml0ZVVJbnQzMkJFKHBheWxvYWQubGVuZ3RoLCAwKVxuICAgICAgdGhpcy5wYXlsb2FkID0gYmludG9vbHMuY29weUZyb20ocGF5bG9hZCwgMCwgcGF5bG9hZC5sZW5ndGgpXG4gICAgfVxuICB9XG59XG4iXX0=