"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateChainTx = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-CreateChainTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const credentials_1 = require("../../common/credentials");
const basetx_1 = require("./basetx");
const constants_2 = require("../../utils/constants");
const serialization_1 = require("../../utils/serialization");
const _1 = require(".");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Class representing an unsigned CreateChainTx transaction.
 */
class CreateChainTx extends basetx_1.BaseTx {
    /**
     * Class representing an unsigned CreateChain transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param subnetID Optional ID of the Subnet that validates this blockchain.
     * @param chainName Optional A human readable name for the chain; need not be unique
     * @param vmID Optional ID of the VM running on the new chain
     * @param fxIDs Optional IDs of the feature extensions running on the new chain
     * @param genesisData Optional Byte representation of genesis state of the new chain
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, subnetID = undefined, chainName = undefined, vmID = undefined, fxIDs = undefined, genesisData = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "CreateChainTx";
        this._typeID = constants_1.PlatformVMConstants.CREATECHAINTX;
        this.subnetID = buffer_1.Buffer.alloc(32);
        this.chainName = "";
        this.vmID = buffer_1.Buffer.alloc(32);
        this.numFXIDs = buffer_1.Buffer.alloc(4);
        this.fxIDs = [];
        this.genesisData = buffer_1.Buffer.alloc(32);
        this.sigCount = buffer_1.Buffer.alloc(4);
        this.sigIdxs = []; // idxs of subnet auth signers
        if (typeof subnetID != "undefined") {
            if (typeof subnetID === "string") {
                this.subnetID = bintools.cb58Decode(subnetID);
            }
            else {
                this.subnetID = subnetID;
            }
        }
        if (typeof chainName != "undefined") {
            this.chainName = chainName;
        }
        if (typeof vmID != "undefined") {
            const buf = buffer_1.Buffer.alloc(32);
            buf.write(vmID, 0, vmID.length);
            this.vmID = buf;
        }
        if (typeof fxIDs != "undefined") {
            this.numFXIDs.writeUInt32BE(fxIDs.length, 0);
            const fxIDBufs = [];
            fxIDs.forEach((fxID) => {
                const buf = buffer_1.Buffer.alloc(32);
                buf.write(fxID, 0, fxID.length, "utf8");
                fxIDBufs.push(buf);
            });
            this.fxIDs = fxIDBufs;
        }
        if (typeof genesisData != "undefined" && typeof genesisData != "string") {
            this.genesisData = genesisData.toBuffer();
        }
        else if (typeof genesisData == "string") {
            this.genesisData = buffer_1.Buffer.from(genesisData);
        }
        const subnetAuth = new _1.SubnetAuth();
        this.subnetAuth = subnetAuth;
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { subnetID: serialization.encoder(this.subnetID, encoding, "Buffer", "cb58") });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.subnetID = serialization.decoder(fields["subnetID"], encoding, "cb58", "Buffer", 32);
        // this.exportOuts = fields["exportOuts"].map((e: object) => {
        //   let eo: TransferableOutput = new TransferableOutput()
        //   eo.deserialize(e, encoding)
        //   return eo
        // })
    }
    /**
     * Returns the id of the [[CreateChainTx]]
     */
    getTxType() {
        return constants_1.PlatformVMConstants.CREATECHAINTX;
    }
    /**
     * Returns the subnetAuth
     */
    getSubnetAuth() {
        return this.subnetAuth;
    }
    /**
     * Returns the subnetID as a string
     */
    getSubnetID() {
        return bintools.cb58Encode(this.subnetID);
    }
    /**
     * Returns a string of the chainName
     */
    getChainName() {
        return this.chainName;
    }
    /**
     * Returns a Buffer of the vmID
     */
    getVMID() {
        return this.vmID;
    }
    /**
     * Returns an array of fxIDs as Buffers
     */
    getFXIDs() {
        return this.fxIDs;
    }
    /**
     * Returns a string of the genesisData
     */
    getGenesisData() {
        return bintools.cb58Encode(this.genesisData);
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[CreateChainTx]], parses it, populates the class, and returns the length of the [[CreateChainTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[CreateChainTx]]
     *
     * @returns The length of the raw [[CreateChainTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.subnetID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        const chainNameSize = bintools
            .copyFrom(bytes, offset, offset + 2)
            .readUInt16BE(0);
        offset += 2;
        this.chainName = bintools
            .copyFrom(bytes, offset, offset + chainNameSize)
            .toString("utf8");
        offset += chainNameSize;
        this.vmID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.numFXIDs = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const nfxids = parseInt(this.numFXIDs.toString("hex"), 10);
        for (let i = 0; i < nfxids; i++) {
            this.fxIDs.push(bintools.copyFrom(bytes, offset, offset + 32));
            offset += 32;
        }
        const genesisDataSize = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.genesisData = bintools.copyFrom(bytes, offset, offset + genesisDataSize);
        offset += genesisDataSize;
        const sa = new _1.SubnetAuth();
        offset += sa.fromBuffer(bintools.copyFrom(bytes, offset));
        this.subnetAuth = sa;
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateChainTx]].
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const chainNameBuff = buffer_1.Buffer.alloc(this.chainName.length);
        chainNameBuff.write(this.chainName, 0, this.chainName.length, "utf8");
        const chainNameSize = buffer_1.Buffer.alloc(2);
        chainNameSize.writeUIntBE(this.chainName.length, 0, 2);
        let bsize = superbuff.length +
            this.subnetID.length +
            chainNameSize.length +
            chainNameBuff.length +
            this.vmID.length +
            this.numFXIDs.length;
        const barr = [
            superbuff,
            this.subnetID,
            chainNameSize,
            chainNameBuff,
            this.vmID,
            this.numFXIDs
        ];
        this.fxIDs.forEach((fxID) => {
            bsize += fxID.length;
            barr.push(fxID);
        });
        bsize += 4;
        bsize += this.genesisData.length;
        const gdLength = buffer_1.Buffer.alloc(4);
        gdLength.writeUIntBE(this.genesisData.length, 0, 4);
        barr.push(gdLength);
        barr.push(this.genesisData);
        bsize += this.subnetAuth.toBuffer().length;
        barr.push(this.subnetAuth.toBuffer());
        return buffer_1.Buffer.concat(barr, bsize);
    }
    clone() {
        const newCreateChainTx = new CreateChainTx();
        newCreateChainTx.fromBuffer(this.toBuffer());
        return newCreateChainTx;
    }
    create(...args) {
        return new CreateChainTx(...args);
    }
    /**
     * Creates and adds a [[SigIdx]] to the [[AddSubnetValidatorTx]].
     *
     * @param addressIdx The index of the address to reference in the signatures
     * @param address The address of the source of the signature
     */
    addSignatureIdx(addressIdx, address) {
        const addressIndex = buffer_1.Buffer.alloc(4);
        addressIndex.writeUIntBE(addressIdx, 0, 4);
        this.subnetAuth.addAddressIndex(addressIndex);
        const sigidx = new credentials_1.SigIdx();
        const b = buffer_1.Buffer.alloc(4);
        b.writeUInt32BE(addressIdx, 0);
        sigidx.fromBuffer(b);
        sigidx.setSource(address);
        this.sigIdxs.push(sigidx);
        this.sigCount.writeUInt32BE(this.sigIdxs.length, 0);
    }
    /**
     * Returns the array of [[SigIdx]] for this [[Input]]
     */
    getSigIdxs() {
        return this.sigIdxs;
    }
    getCredentialID() {
        return constants_1.PlatformVMConstants.SECPCREDENTIAL;
    }
    /**
     * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
     *
     * @param msg A Buffer for the [[UnsignedTx]]
     * @param kc An [[KeyChain]] used in signing
     *
     * @returns An array of [[Credential]]s
     */
    sign(msg, kc) {
        const creds = super.sign(msg, kc);
        const sigidxs = this.getSigIdxs();
        const cred = (0, _1.SelectCredentialClass)(this.getCredentialID());
        for (let i = 0; i < sigidxs.length; i++) {
            const keypair = kc.getKey(sigidxs[`${i}`].getSource());
            const signval = keypair.sign(msg);
            const sig = new credentials_1.Signature();
            sig.fromBuffer(signval);
            cred.addSignature(sig);
        }
        creds.push(cred);
        return creds;
    }
}
exports.CreateChainTx = CreateChainTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlY2hhaW50eC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL3BsYXRmb3Jtdm0vY3JlYXRlY2hhaW50eC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBZ0M7QUFDaEMsb0VBQTJDO0FBQzNDLDJDQUFpRDtBQUdqRCwwREFBd0U7QUFDeEUscUNBQWlDO0FBQ2pDLHFEQUF3RDtBQUN4RCw2REFBNkU7QUFFN0Usd0JBQXFEO0FBR3JEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRTs7R0FFRztBQUNILE1BQWEsYUFBYyxTQUFRLGVBQU07SUFtUXZDOzs7Ozs7Ozs7Ozs7O09BYUc7SUFDSCxZQUNFLFlBQW9CLDRCQUFnQixFQUNwQyxlQUF1QixlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFDM0MsT0FBNkIsU0FBUyxFQUN0QyxNQUEyQixTQUFTLEVBQ3BDLE9BQWUsU0FBUyxFQUN4QixXQUE0QixTQUFTLEVBQ3JDLFlBQW9CLFNBQVMsRUFDN0IsT0FBZSxTQUFTLEVBQ3hCLFFBQWtCLFNBQVMsRUFDM0IsY0FBb0MsU0FBUztRQUU3QyxLQUFLLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBNVJ2QyxjQUFTLEdBQUcsZUFBZSxDQUFBO1FBQzNCLFlBQU8sR0FBRywrQkFBbUIsQ0FBQyxhQUFhLENBQUE7UUErQjNDLGFBQVEsR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ25DLGNBQVMsR0FBVyxFQUFFLENBQUE7UUFDdEIsU0FBSSxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENB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QUFNLElBQUksR0FBZSxJQUFBLHdCQUFxQixFQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFBO1FBQ3RFLEtBQUssSUFBSSxDQUFDLEdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQy9DLE1BQU0sT0FBTyxHQUFZLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFBO1lBQy9ELE1BQU0sT0FBTyxHQUFXLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDekMsTUFBTSxHQUFHLEdBQWMsSUFBSSx1QkFBUyxFQUFFLENBQUE7WUFDdEMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUN2QixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQ3ZCO1FBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNoQixPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7Q0ErREY7QUFoVUQsc0NBZ1VDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLVBsYXRmb3JtVk0tQ3JlYXRlQ2hhaW5UeFxuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IFBsYXRmb3JtVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVJbnB1dCB9IGZyb20gXCIuL2lucHV0c1wiXG5pbXBvcnQgeyBDcmVkZW50aWFsLCBTaWdJZHgsIFNpZ25hdHVyZSB9IGZyb20gXCIuLi8uLi9jb21tb24vY3JlZGVudGlhbHNcIlxuaW1wb3J0IHsgQmFzZVR4IH0gZnJvbSBcIi4vYmFzZXR4XCJcbmltcG9ydCB7IERlZmF1bHROZXR3b3JrSUQgfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcbmltcG9ydCB7IEdlbmVzaXNEYXRhIH0gZnJvbSBcIi4uL2F4dm1cIlxuaW1wb3J0IHsgU2VsZWN0Q3JlZGVudGlhbENsYXNzLCBTdWJuZXRBdXRoIH0gZnJvbSBcIi5cIlxuaW1wb3J0IHsgS2V5Q2hhaW4sIEtleVBhaXIgfSBmcm9tIFwiLi9rZXljaGFpblwiXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXG5cbi8qKlxuICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIENyZWF0ZUNoYWluVHggdHJhbnNhY3Rpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBDcmVhdGVDaGFpblR4IGV4dGVuZHMgQmFzZVR4IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiQ3JlYXRlQ2hhaW5UeFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gUGxhdGZvcm1WTUNvbnN0YW50cy5DUkVBVEVDSEFJTlRYXG5cbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIHN1Ym5ldElEOiBzZXJpYWxpemF0aW9uLmVuY29kZXIoXG4gICAgICAgIHRoaXMuc3VibmV0SUQsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBcIkJ1ZmZlclwiLFxuICAgICAgICBcImNiNThcIlxuICAgICAgKVxuICAgICAgLy8gZXhwb3J0T3V0czogdGhpcy5leHBvcnRPdXRzLm1hcCgoZSkgPT4gZS5zZXJpYWxpemUoZW5jb2RpbmcpKVxuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMuc3VibmV0SUQgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJzdWJuZXRJRFwiXSxcbiAgICAgIGVuY29kaW5nLFxuICAgICAgXCJjYjU4XCIsXG4gICAgICBcIkJ1ZmZlclwiLFxuICAgICAgMzJcbiAgICApXG4gICAgLy8gdGhpcy5leHBvcnRPdXRzID0gZmllbGRzW1wiZXhwb3J0T3V0c1wiXS5tYXAoKGU6IG9iamVjdCkgPT4ge1xuICAgIC8vICAgbGV0IGVvOiBUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KClcbiAgICAvLyAgIGVvLmRlc2VyaWFsaXplKGUsIGVuY29kaW5nKVxuICAgIC8vICAgcmV0dXJuIGVvXG4gICAgLy8gfSlcbiAgfVxuXG4gIHByb3RlY3RlZCBzdWJuZXRJRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyKVxuICBwcm90ZWN0ZWQgY2hhaW5OYW1lOiBzdHJpbmcgPSBcIlwiXG4gIHByb3RlY3RlZCB2bUlEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIpXG4gIHByb3RlY3RlZCBudW1GWElEczogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gIHByb3RlY3RlZCBmeElEczogQnVmZmVyW10gPSBbXVxuICBwcm90ZWN0ZWQgZ2VuZXNpc0RhdGE6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMilcbiAgcHJvdGVjdGVkIHN1Ym5ldEF1dGg6IFN1Ym5ldEF1dGhcbiAgcHJvdGVjdGVkIHNpZ0NvdW50OiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgcHJvdGVjdGVkIHNpZ0lkeHM6IFNpZ0lkeFtdID0gW10gLy8gaWR4cyBvZiBzdWJuZXQgYXV0aCBzaWduZXJzXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGlkIG9mIHRoZSBbW0NyZWF0ZUNoYWluVHhdXVxuICAgKi9cbiAgZ2V0VHhUeXBlKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIFBsYXRmb3JtVk1Db25zdGFudHMuQ1JFQVRFQ0hBSU5UWFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHN1Ym5ldEF1dGhcbiAgICovXG4gIGdldFN1Ym5ldEF1dGgoKTogU3VibmV0QXV0aCB7XG4gICAgcmV0dXJuIHRoaXMuc3VibmV0QXV0aFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHN1Ym5ldElEIGFzIGEgc3RyaW5nXG4gICAqL1xuICBnZXRTdWJuZXRJRCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBiaW50b29scy5jYjU4RW5jb2RlKHRoaXMuc3VibmV0SUQpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHN0cmluZyBvZiB0aGUgY2hhaW5OYW1lXG4gICAqL1xuICBnZXRDaGFpbk5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5jaGFpbk5hbWVcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgQnVmZmVyIG9mIHRoZSB2bUlEXG4gICAqL1xuICBnZXRWTUlEKCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMudm1JRFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgZnhJRHMgYXMgQnVmZmVyc1xuICAgKi9cbiAgZ2V0RlhJRHMoKTogQnVmZmVyW10ge1xuICAgIHJldHVybiB0aGlzLmZ4SURzXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHN0cmluZyBvZiB0aGUgZ2VuZXNpc0RhdGFcbiAgICovXG4gIGdldEdlbmVzaXNEYXRhKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGJpbnRvb2xzLmNiNThFbmNvZGUodGhpcy5nZW5lc2lzRGF0YSlcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYW4gW1tDcmVhdGVDaGFpblR4XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgW1tDcmVhdGVDaGFpblR4XV0gaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tDcmVhdGVDaGFpblR4XV1cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgcmF3IFtbQ3JlYXRlQ2hhaW5UeF1dXG4gICAqXG4gICAqIEByZW1hcmtzIGFzc3VtZSBub3QtY2hlY2tzdW1tZWRcbiAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgdGhpcy5zdWJuZXRJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKVxuICAgIG9mZnNldCArPSAzMlxuXG4gICAgY29uc3QgY2hhaW5OYW1lU2l6ZTogbnVtYmVyID0gYmludG9vbHNcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyKVxuICAgICAgLnJlYWRVSW50MTZCRSgwKVxuICAgIG9mZnNldCArPSAyXG5cbiAgICB0aGlzLmNoYWluTmFtZSA9IGJpbnRvb2xzXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgY2hhaW5OYW1lU2l6ZSlcbiAgICAgIC50b1N0cmluZyhcInV0ZjhcIilcbiAgICBvZmZzZXQgKz0gY2hhaW5OYW1lU2l6ZVxuXG4gICAgdGhpcy52bUlEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXG4gICAgb2Zmc2V0ICs9IDMyXG5cbiAgICB0aGlzLm51bUZYSURzID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICBvZmZzZXQgKz0gNFxuXG4gICAgY29uc3QgbmZ4aWRzOiBudW1iZXIgPSBwYXJzZUludCh0aGlzLm51bUZYSURzLnRvU3RyaW5nKFwiaGV4XCIpLCAxMClcblxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBuZnhpZHM7IGkrKykge1xuICAgICAgdGhpcy5meElEcy5wdXNoKGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKSlcbiAgICAgIG9mZnNldCArPSAzMlxuICAgIH1cblxuICAgIGNvbnN0IGdlbmVzaXNEYXRhU2l6ZTogbnVtYmVyID0gYmludG9vbHNcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgICAgLnJlYWRVSW50MzJCRSgwKVxuICAgIG9mZnNldCArPSA0XG5cbiAgICB0aGlzLmdlbmVzaXNEYXRhID0gYmludG9vbHMuY29weUZyb20oXG4gICAgICBieXRlcyxcbiAgICAgIG9mZnNldCxcbiAgICAgIG9mZnNldCArIGdlbmVzaXNEYXRhU2l6ZVxuICAgIClcbiAgICBvZmZzZXQgKz0gZ2VuZXNpc0RhdGFTaXplXG5cbiAgICBjb25zdCBzYTogU3VibmV0QXV0aCA9IG5ldyBTdWJuZXRBdXRoKClcbiAgICBvZmZzZXQgKz0gc2EuZnJvbUJ1ZmZlcihiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0KSlcblxuICAgIHRoaXMuc3VibmV0QXV0aCA9IHNhXG5cbiAgICByZXR1cm4gb2Zmc2V0XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW0NyZWF0ZUNoYWluVHhdXS5cbiAgICovXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgY29uc3Qgc3VwZXJidWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXG5cbiAgICBjb25zdCBjaGFpbk5hbWVCdWZmOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2ModGhpcy5jaGFpbk5hbWUubGVuZ3RoKVxuICAgIGNoYWluTmFtZUJ1ZmYud3JpdGUodGhpcy5jaGFpbk5hbWUsIDAsIHRoaXMuY2hhaW5OYW1lLmxlbmd0aCwgXCJ1dGY4XCIpXG4gICAgY29uc3QgY2hhaW5OYW1lU2l6ZTogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDIpXG4gICAgY2hhaW5OYW1lU2l6ZS53cml0ZVVJbnRCRSh0aGlzLmNoYWluTmFtZS5sZW5ndGgsIDAsIDIpXG5cbiAgICBsZXQgYnNpemU6IG51bWJlciA9XG4gICAgICBzdXBlcmJ1ZmYubGVuZ3RoICtcbiAgICAgIHRoaXMuc3VibmV0SUQubGVuZ3RoICtcbiAgICAgIGNoYWluTmFtZVNpemUubGVuZ3RoICtcbiAgICAgIGNoYWluTmFtZUJ1ZmYubGVuZ3RoICtcbiAgICAgIHRoaXMudm1JRC5sZW5ndGggK1xuICAgICAgdGhpcy5udW1GWElEcy5sZW5ndGhcblxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW1xuICAgICAgc3VwZXJidWZmLFxuICAgICAgdGhpcy5zdWJuZXRJRCxcbiAgICAgIGNoYWluTmFtZVNpemUsXG4gICAgICBjaGFpbk5hbWVCdWZmLFxuICAgICAgdGhpcy52bUlELFxuICAgICAgdGhpcy5udW1GWElEc1xuICAgIF1cblxuICAgIHRoaXMuZnhJRHMuZm9yRWFjaCgoZnhJRDogQnVmZmVyKTogdm9pZCA9PiB7XG4gICAgICBic2l6ZSArPSBmeElELmxlbmd0aFxuICAgICAgYmFyci5wdXNoKGZ4SUQpXG4gICAgfSlcblxuICAgIGJzaXplICs9IDRcbiAgICBic2l6ZSArPSB0aGlzLmdlbmVzaXNEYXRhLmxlbmd0aFxuICAgIGNvbnN0IGdkTGVuZ3RoOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICBnZExlbmd0aC53cml0ZVVJbnRCRSh0aGlzLmdlbmVzaXNEYXRhLmxlbmd0aCwgMCwgNClcbiAgICBiYXJyLnB1c2goZ2RMZW5ndGgpXG4gICAgYmFyci5wdXNoKHRoaXMuZ2VuZXNpc0RhdGEpXG5cbiAgICBic2l6ZSArPSB0aGlzLnN1Ym5ldEF1dGgudG9CdWZmZXIoKS5sZW5ndGhcbiAgICBiYXJyLnB1c2godGhpcy5zdWJuZXRBdXRoLnRvQnVmZmVyKCkpXG5cbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcbiAgfVxuXG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGNvbnN0IG5ld0NyZWF0ZUNoYWluVHg6IENyZWF0ZUNoYWluVHggPSBuZXcgQ3JlYXRlQ2hhaW5UeCgpXG4gICAgbmV3Q3JlYXRlQ2hhaW5UeC5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcbiAgICByZXR1cm4gbmV3Q3JlYXRlQ2hhaW5UeCBhcyB0aGlzXG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IENyZWF0ZUNoYWluVHgoLi4uYXJncykgYXMgdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW5kIGFkZHMgYSBbW1NpZ0lkeF1dIHRvIHRoZSBbW0FkZFN1Ym5ldFZhbGlkYXRvclR4XV0uXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzSWR4IFRoZSBpbmRleCBvZiB0aGUgYWRkcmVzcyB0byByZWZlcmVuY2UgaW4gdGhlIHNpZ25hdHVyZXNcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGFkZHJlc3Mgb2YgdGhlIHNvdXJjZSBvZiB0aGUgc2lnbmF0dXJlXG4gICAqL1xuICBhZGRTaWduYXR1cmVJZHgoYWRkcmVzc0lkeDogbnVtYmVyLCBhZGRyZXNzOiBCdWZmZXIpOiB2b2lkIHtcbiAgICBjb25zdCBhZGRyZXNzSW5kZXg6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIGFkZHJlc3NJbmRleC53cml0ZVVJbnRCRShhZGRyZXNzSWR4LCAwLCA0KVxuICAgIHRoaXMuc3VibmV0QXV0aC5hZGRBZGRyZXNzSW5kZXgoYWRkcmVzc0luZGV4KVxuXG4gICAgY29uc3Qgc2lnaWR4OiBTaWdJZHggPSBuZXcgU2lnSWR4KClcbiAgICBjb25zdCBiOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICBiLndyaXRlVUludDMyQkUoYWRkcmVzc0lkeCwgMClcbiAgICBzaWdpZHguZnJvbUJ1ZmZlcihiKVxuICAgIHNpZ2lkeC5zZXRTb3VyY2UoYWRkcmVzcylcbiAgICB0aGlzLnNpZ0lkeHMucHVzaChzaWdpZHgpXG4gICAgdGhpcy5zaWdDb3VudC53cml0ZVVJbnQzMkJFKHRoaXMuc2lnSWR4cy5sZW5ndGgsIDApXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYXJyYXkgb2YgW1tTaWdJZHhdXSBmb3IgdGhpcyBbW0lucHV0XV1cbiAgICovXG4gIGdldFNpZ0lkeHMoKTogU2lnSWR4W10ge1xuICAgIHJldHVybiB0aGlzLnNpZ0lkeHNcbiAgfVxuXG4gIGdldENyZWRlbnRpYWxJRCgpOiBudW1iZXIge1xuICAgIHJldHVybiBQbGF0Zm9ybVZNQ29uc3RhbnRzLlNFQ1BDUkVERU5USUFMXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgdGhlIGJ5dGVzIG9mIGFuIFtbVW5zaWduZWRUeF1dIGFuZCByZXR1cm5zIGFuIGFycmF5IG9mIFtbQ3JlZGVudGlhbF1dc1xuICAgKlxuICAgKiBAcGFyYW0gbXNnIEEgQnVmZmVyIGZvciB0aGUgW1tVbnNpZ25lZFR4XV1cbiAgICogQHBhcmFtIGtjIEFuIFtbS2V5Q2hhaW5dXSB1c2VkIGluIHNpZ25pbmdcbiAgICpcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgW1tDcmVkZW50aWFsXV1zXG4gICAqL1xuICBzaWduKG1zZzogQnVmZmVyLCBrYzogS2V5Q2hhaW4pOiBDcmVkZW50aWFsW10ge1xuICAgIGNvbnN0IGNyZWRzOiBDcmVkZW50aWFsW10gPSBzdXBlci5zaWduKG1zZywga2MpXG4gICAgY29uc3Qgc2lnaWR4czogU2lnSWR4W10gPSB0aGlzLmdldFNpZ0lkeHMoKVxuICAgIGNvbnN0IGNyZWQ6IENyZWRlbnRpYWwgPSBTZWxlY3RDcmVkZW50aWFsQ2xhc3ModGhpcy5nZXRDcmVkZW50aWFsSUQoKSlcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgc2lnaWR4cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qga2V5cGFpcjogS2V5UGFpciA9IGtjLmdldEtleShzaWdpZHhzW2Ake2l9YF0uZ2V0U291cmNlKCkpXG4gICAgICBjb25zdCBzaWdudmFsOiBCdWZmZXIgPSBrZXlwYWlyLnNpZ24obXNnKVxuICAgICAgY29uc3Qgc2lnOiBTaWduYXR1cmUgPSBuZXcgU2lnbmF0dXJlKClcbiAgICAgIHNpZy5mcm9tQnVmZmVyKHNpZ252YWwpXG4gICAgICBjcmVkLmFkZFNpZ25hdHVyZShzaWcpXG4gICAgfVxuICAgIGNyZWRzLnB1c2goY3JlZClcbiAgICByZXR1cm4gY3JlZHNcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgQ3JlYXRlQ2hhaW4gdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwgbmV0d29ya0lELCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIE9wdGlvbmFsIGJsb2NrY2hhaW5JRCwgZGVmYXVsdCBCdWZmZXIuYWxsb2MoMzIsIDE2KVxuICAgKiBAcGFyYW0gb3V0cyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXNcbiAgICogQHBhcmFtIGlucyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIG1lbW8gZmllbGRcbiAgICogQHBhcmFtIHN1Ym5ldElEIE9wdGlvbmFsIElEIG9mIHRoZSBTdWJuZXQgdGhhdCB2YWxpZGF0ZXMgdGhpcyBibG9ja2NoYWluLlxuICAgKiBAcGFyYW0gY2hhaW5OYW1lIE9wdGlvbmFsIEEgaHVtYW4gcmVhZGFibGUgbmFtZSBmb3IgdGhlIGNoYWluOyBuZWVkIG5vdCBiZSB1bmlxdWVcbiAgICogQHBhcmFtIHZtSUQgT3B0aW9uYWwgSUQgb2YgdGhlIFZNIHJ1bm5pbmcgb24gdGhlIG5ldyBjaGFpblxuICAgKiBAcGFyYW0gZnhJRHMgT3B0aW9uYWwgSURzIG9mIHRoZSBmZWF0dXJlIGV4dGVuc2lvbnMgcnVubmluZyBvbiB0aGUgbmV3IGNoYWluXG4gICAqIEBwYXJhbSBnZW5lc2lzRGF0YSBPcHRpb25hbCBCeXRlIHJlcHJlc2VudGF0aW9uIG9mIGdlbmVzaXMgc3RhdGUgb2YgdGhlIG5ldyBjaGFpblxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgbmV0d29ya0lEOiBudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELFxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNiksXG4gICAgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSB1bmRlZmluZWQsXG4gICAgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBzdWJuZXRJRDogc3RyaW5nIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGNoYWluTmFtZTogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIHZtSUQ6IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBmeElEczogc3RyaW5nW10gPSB1bmRlZmluZWQsXG4gICAgZ2VuZXNpc0RhdGE6IHN0cmluZyB8IEdlbmVzaXNEYXRhID0gdW5kZWZpbmVkXG4gICkge1xuICAgIHN1cGVyKG5ldHdvcmtJRCwgYmxvY2tjaGFpbklELCBvdXRzLCBpbnMsIG1lbW8pXG4gICAgaWYgKHR5cGVvZiBzdWJuZXRJRCAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpZiAodHlwZW9mIHN1Ym5ldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHRoaXMuc3VibmV0SUQgPSBiaW50b29scy5jYjU4RGVjb2RlKHN1Ym5ldElEKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zdWJuZXRJRCA9IHN1Ym5ldElEXG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0eXBlb2YgY2hhaW5OYW1lICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMuY2hhaW5OYW1lID0gY2hhaW5OYW1lXG4gICAgfVxuICAgIGlmICh0eXBlb2Ygdm1JRCAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBjb25zdCBidWY6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMilcbiAgICAgIGJ1Zi53cml0ZSh2bUlELCAwLCB2bUlELmxlbmd0aClcbiAgICAgIHRoaXMudm1JRCA9IGJ1ZlxuICAgIH1cbiAgICBpZiAodHlwZW9mIGZ4SURzICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMubnVtRlhJRHMud3JpdGVVSW50MzJCRShmeElEcy5sZW5ndGgsIDApXG4gICAgICBjb25zdCBmeElEQnVmczogQnVmZmVyW10gPSBbXVxuICAgICAgZnhJRHMuZm9yRWFjaCgoZnhJRDogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgICAgIGNvbnN0IGJ1ZjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyKVxuICAgICAgICBidWYud3JpdGUoZnhJRCwgMCwgZnhJRC5sZW5ndGgsIFwidXRmOFwiKVxuICAgICAgICBmeElEQnVmcy5wdXNoKGJ1ZilcbiAgICAgIH0pXG4gICAgICB0aGlzLmZ4SURzID0gZnhJREJ1ZnNcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBnZW5lc2lzRGF0YSAhPSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiBnZW5lc2lzRGF0YSAhPSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLmdlbmVzaXNEYXRhID0gZ2VuZXNpc0RhdGEudG9CdWZmZXIoKVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGdlbmVzaXNEYXRhID09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuZ2VuZXNpc0RhdGEgPSBCdWZmZXIuZnJvbShnZW5lc2lzRGF0YSlcbiAgICB9XG5cbiAgICBjb25zdCBzdWJuZXRBdXRoOiBTdWJuZXRBdXRoID0gbmV3IFN1Ym5ldEF1dGgoKVxuICAgIHRoaXMuc3VibmV0QXV0aCA9IHN1Ym5ldEF1dGhcbiAgfVxufVxuIl19