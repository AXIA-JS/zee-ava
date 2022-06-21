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
     * @param allychainID Optional ID of the Allychain that validates this blockchain.
     * @param chainName Optional A human readable name for the chain; need not be unique
     * @param vmID Optional ID of the VM running on the new chain
     * @param fxIDs Optional IDs of the feature extensions running on the new chain
     * @param genesisData Optional Byte representation of genesis state of the new chain
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, allychainID = undefined, chainName = undefined, vmID = undefined, fxIDs = undefined, genesisData = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "CreateChainTx";
        this._typeID = constants_1.PlatformVMConstants.CREATECHAINTX;
        this.allychainID = buffer_1.Buffer.alloc(32);
        this.chainName = "";
        this.vmID = buffer_1.Buffer.alloc(32);
        this.numFXIDs = buffer_1.Buffer.alloc(4);
        this.fxIDs = [];
        this.genesisData = buffer_1.Buffer.alloc(32);
        this.sigCount = buffer_1.Buffer.alloc(4);
        this.sigIdxs = []; // idxs of allychain auth signers
        if (typeof allychainID != "undefined") {
            if (typeof allychainID === "string") {
                this.allychainID = bintools.cb58Decode(allychainID);
            }
            else {
                this.allychainID = allychainID;
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
        const allychainAuth = new _1.AllychainAuth();
        this.allychainAuth = allychainAuth;
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { allychainID: serialization.encoder(this.allychainID, encoding, "Buffer", "cb58") });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.allychainID = serialization.decoder(fields["allychainID"], encoding, "cb58", "Buffer", 32);
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
     * Returns the allychainAuth
     */
    getAllychainAuth() {
        return this.allychainAuth;
    }
    /**
     * Returns the allychainID as a string
     */
    getAllychainID() {
        return bintools.cb58Encode(this.allychainID);
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
        this.allychainID = bintools.copyFrom(bytes, offset, offset + 32);
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
        const sa = new _1.AllychainAuth();
        offset += sa.fromBuffer(bintools.copyFrom(bytes, offset));
        this.allychainAuth = sa;
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
            this.allychainID.length +
            chainNameSize.length +
            chainNameBuff.length +
            this.vmID.length +
            this.numFXIDs.length;
        const barr = [
            superbuff,
            this.allychainID,
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
        bsize += this.allychainAuth.toBuffer().length;
        barr.push(this.allychainAuth.toBuffer());
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
     * Creates and adds a [[SigIdx]] to the [[AddAllychainValidatorTx]].
     *
     * @param addressIdx The index of the address to reference in the signatures
     * @param address The address of the source of the signature
     */
    addSignatureIdx(addressIdx, address) {
        const addressIndex = buffer_1.Buffer.alloc(4);
        addressIndex.writeUIntBE(addressIdx, 0, 4);
        this.allychainAuth.addAddressIndex(addressIndex);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlY2hhaW50eC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL3BsYXRmb3Jtdm0vY3JlYXRlY2hhaW50eC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBZ0M7QUFDaEMsb0VBQTJDO0FBQzNDLDJDQUFpRDtBQUdqRCwwREFBd0U7QUFDeEUscUNBQWlDO0FBQ2pDLHFEQUF3RDtBQUN4RCw2REFBNkU7QUFFN0Usd0JBQXdEO0FBR3hEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRTs7R0FFRztBQUNILE1BQWEsYUFBYyxTQUFRLGVBQU07SUFtUXZDOzs7Ozs7Ozs7Ozs7O09BYUc7SUFDSCxZQUNFLFlBQW9CLDRCQUFnQixFQUNwQyxlQUF1QixlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFDM0MsT0FBNkIsU0FBUyxFQUN0QyxNQUEyQixTQUFTLEVBQ3BDLE9BQWUsU0FBUyxFQUN4QixjQUErQixTQUFTLEVBQ3hDLFlBQW9CLFNBQVMsRUFDN0IsT0FBZSxTQUFTLEVBQ3hCLFFBQWtCLFNBQVMsRUFDM0IsY0FBb0MsU0FBUztRQUU3QyxLQUFLLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBNVJ2QyxjQUFTLEdBQUcsZUFBZSxDQUFBO1FBQzNCLFlBQU8sR0FBRywrQkFBbUIsQ0FBQyxhQUFhLENBQUE7UUErQjNDLGdCQUFXLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUN0QyxjQUFTLEdBQVcsRUFBRSxDQUFBO1FBQ3RCLFNBQUksR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxD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QTtRQUMzQyxNQUFNLElBQUksR0FBZSxJQUFBLHdCQUFxQixFQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFBO1FBQ3RFLEtBQUssSUFBSSxDQUFDLEdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQy9DLE1BQU0sT0FBTyxHQUFZLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFBO1lBQy9ELE1BQU0sT0FBTyxHQUFXLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDekMsTUFBTSxHQUFHLEdBQWMsSUFBSSx1QkFBUyxFQUFFLENBQUE7WUFDdEMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUN2QixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1NBQ3ZCO1FBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNoQixPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7Q0ErREY7QUFoVUQsc0NBZ1VDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLVBsYXRmb3JtVk0tQ3JlYXRlQ2hhaW5UeFxuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IFBsYXRmb3JtVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVJbnB1dCB9IGZyb20gXCIuL2lucHV0c1wiXG5pbXBvcnQgeyBDcmVkZW50aWFsLCBTaWdJZHgsIFNpZ25hdHVyZSB9IGZyb20gXCIuLi8uLi9jb21tb24vY3JlZGVudGlhbHNcIlxuaW1wb3J0IHsgQmFzZVR4IH0gZnJvbSBcIi4vYmFzZXR4XCJcbmltcG9ydCB7IERlZmF1bHROZXR3b3JrSUQgfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcbmltcG9ydCB7IEdlbmVzaXNEYXRhIH0gZnJvbSBcIi4uL2F2bVwiXG5pbXBvcnQgeyBTZWxlY3RDcmVkZW50aWFsQ2xhc3MsIEFsbHljaGFpbkF1dGggfSBmcm9tIFwiLlwiXG5pbXBvcnQgeyBLZXlDaGFpbiwgS2V5UGFpciB9IGZyb20gXCIuL2tleWNoYWluXCJcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcbmNvbnN0IHNlcmlhbGl6YXRpb246IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcblxuLyoqXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgQ3JlYXRlQ2hhaW5UeCB0cmFuc2FjdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIENyZWF0ZUNoYWluVHggZXh0ZW5kcyBCYXNlVHgge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJDcmVhdGVDaGFpblR4XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBQbGF0Zm9ybVZNQ29uc3RhbnRzLkNSRUFURUNIQUlOVFhcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgYWxseWNoYWluSUQ6IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcbiAgICAgICAgdGhpcy5hbGx5Y2hhaW5JRCxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIFwiQnVmZmVyXCIsXG4gICAgICAgIFwiY2I1OFwiXG4gICAgICApXG4gICAgICAvLyBleHBvcnRPdXRzOiB0aGlzLmV4cG9ydE91dHMubWFwKChlKSA9PiBlLnNlcmlhbGl6ZShlbmNvZGluZykpXG4gICAgfVxuICB9XG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy5hbGx5Y2hhaW5JRCA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcbiAgICAgIGZpZWxkc1tcImFsbHljaGFpbklEXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBcImNiNThcIixcbiAgICAgIFwiQnVmZmVyXCIsXG4gICAgICAzMlxuICAgIClcbiAgICAvLyB0aGlzLmV4cG9ydE91dHMgPSBmaWVsZHNbXCJleHBvcnRPdXRzXCJdLm1hcCgoZTogb2JqZWN0KSA9PiB7XG4gICAgLy8gICBsZXQgZW86IFRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoKVxuICAgIC8vICAgZW8uZGVzZXJpYWxpemUoZSwgZW5jb2RpbmcpXG4gICAgLy8gICByZXR1cm4gZW9cbiAgICAvLyB9KVxuICB9XG5cbiAgcHJvdGVjdGVkIGFsbHljaGFpbklEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIpXG4gIHByb3RlY3RlZCBjaGFpbk5hbWU6IHN0cmluZyA9IFwiXCJcbiAgcHJvdGVjdGVkIHZtSUQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMilcbiAgcHJvdGVjdGVkIG51bUZYSURzOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgcHJvdGVjdGVkIGZ4SURzOiBCdWZmZXJbXSA9IFtdXG4gIHByb3RlY3RlZCBnZW5lc2lzRGF0YTogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyKVxuICBwcm90ZWN0ZWQgYWxseWNoYWluQXV0aDogQWxseWNoYWluQXV0aFxuICBwcm90ZWN0ZWQgc2lnQ291bnQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICBwcm90ZWN0ZWQgc2lnSWR4czogU2lnSWR4W10gPSBbXSAvLyBpZHhzIG9mIGFsbHljaGFpbiBhdXRoIHNpZ25lcnNcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaWQgb2YgdGhlIFtbQ3JlYXRlQ2hhaW5UeF1dXG4gICAqL1xuICBnZXRUeFR5cGUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gUGxhdGZvcm1WTUNvbnN0YW50cy5DUkVBVEVDSEFJTlRYXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYWxseWNoYWluQXV0aFxuICAgKi9cbiAgZ2V0QWxseWNoYWluQXV0aCgpOiBBbGx5Y2hhaW5BdXRoIHtcbiAgICByZXR1cm4gdGhpcy5hbGx5Y2hhaW5BdXRoXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYWxseWNoYWluSUQgYXMgYSBzdHJpbmdcbiAgICovXG4gIGdldEFsbHljaGFpbklEKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGJpbnRvb2xzLmNiNThFbmNvZGUodGhpcy5hbGx5Y2hhaW5JRClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIG9mIHRoZSBjaGFpbk5hbWVcbiAgICovXG4gIGdldENoYWluTmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmNoYWluTmFtZVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBCdWZmZXIgb2YgdGhlIHZtSURcbiAgICovXG4gIGdldFZNSUQoKTogQnVmZmVyIHtcbiAgICByZXR1cm4gdGhpcy52bUlEXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBmeElEcyBhcyBCdWZmZXJzXG4gICAqL1xuICBnZXRGWElEcygpOiBCdWZmZXJbXSB7XG4gICAgcmV0dXJuIHRoaXMuZnhJRHNcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIG9mIHRoZSBnZW5lc2lzRGF0YVxuICAgKi9cbiAgZ2V0R2VuZXNpc0RhdGEoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYmludG9vbHMuY2I1OEVuY29kZSh0aGlzLmdlbmVzaXNEYXRhKVxuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhbiBbW0NyZWF0ZUNoYWluVHhdXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBbW0NyZWF0ZUNoYWluVHhdXSBpbiBieXRlcy5cbiAgICpcbiAgICogQHBhcmFtIGJ5dGVzIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIHJhdyBbW0NyZWF0ZUNoYWluVHhdXVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tDcmVhdGVDaGFpblR4XV1cbiAgICpcbiAgICogQHJlbWFya3MgYXNzdW1lIG5vdC1jaGVja3N1bW1lZFxuICAgKi9cbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xuICAgIG9mZnNldCA9IHN1cGVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICB0aGlzLmFsbHljaGFpbklEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXG4gICAgb2Zmc2V0ICs9IDMyXG5cbiAgICBjb25zdCBjaGFpbk5hbWVTaXplOiBudW1iZXIgPSBiaW50b29sc1xuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDIpXG4gICAgICAucmVhZFVJbnQxNkJFKDApXG4gICAgb2Zmc2V0ICs9IDJcblxuICAgIHRoaXMuY2hhaW5OYW1lID0gYmludG9vbHNcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyBjaGFpbk5hbWVTaXplKVxuICAgICAgLnRvU3RyaW5nKFwidXRmOFwiKVxuICAgIG9mZnNldCArPSBjaGFpbk5hbWVTaXplXG5cbiAgICB0aGlzLnZtSUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMilcbiAgICBvZmZzZXQgKz0gMzJcblxuICAgIHRoaXMubnVtRlhJRHMgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgIG9mZnNldCArPSA0XG5cbiAgICBjb25zdCBuZnhpZHM6IG51bWJlciA9IHBhcnNlSW50KHRoaXMubnVtRlhJRHMudG9TdHJpbmcoXCJoZXhcIiksIDEwKVxuXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IG5meGlkczsgaSsrKSB7XG4gICAgICB0aGlzLmZ4SURzLnB1c2goYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpKVxuICAgICAgb2Zmc2V0ICs9IDMyXG4gICAgfVxuXG4gICAgY29uc3QgZ2VuZXNpc0RhdGFTaXplOiBudW1iZXIgPSBiaW50b29sc1xuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgICAucmVhZFVJbnQzMkJFKDApXG4gICAgb2Zmc2V0ICs9IDRcblxuICAgIHRoaXMuZ2VuZXNpc0RhdGEgPSBiaW50b29scy5jb3B5RnJvbShcbiAgICAgIGJ5dGVzLFxuICAgICAgb2Zmc2V0LFxuICAgICAgb2Zmc2V0ICsgZ2VuZXNpc0RhdGFTaXplXG4gICAgKVxuICAgIG9mZnNldCArPSBnZW5lc2lzRGF0YVNpemVcblxuICAgIGNvbnN0IHNhOiBBbGx5Y2hhaW5BdXRoID0gbmV3IEFsbHljaGFpbkF1dGgoKVxuICAgIG9mZnNldCArPSBzYS5mcm9tQnVmZmVyKGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQpKVxuXG4gICAgdGhpcy5hbGx5Y2hhaW5BdXRoID0gc2FcblxuICAgIHJldHVybiBvZmZzZXRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbQ3JlYXRlQ2hhaW5UeF1dLlxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBjb25zdCBzdXBlcmJ1ZmY6IEJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKClcblxuICAgIGNvbnN0IGNoYWluTmFtZUJ1ZmY6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyh0aGlzLmNoYWluTmFtZS5sZW5ndGgpXG4gICAgY2hhaW5OYW1lQnVmZi53cml0ZSh0aGlzLmNoYWluTmFtZSwgMCwgdGhpcy5jaGFpbk5hbWUubGVuZ3RoLCBcInV0ZjhcIilcbiAgICBjb25zdCBjaGFpbk5hbWVTaXplOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMilcbiAgICBjaGFpbk5hbWVTaXplLndyaXRlVUludEJFKHRoaXMuY2hhaW5OYW1lLmxlbmd0aCwgMCwgMilcblxuICAgIGxldCBic2l6ZTogbnVtYmVyID1cbiAgICAgIHN1cGVyYnVmZi5sZW5ndGggK1xuICAgICAgdGhpcy5hbGx5Y2hhaW5JRC5sZW5ndGggK1xuICAgICAgY2hhaW5OYW1lU2l6ZS5sZW5ndGggK1xuICAgICAgY2hhaW5OYW1lQnVmZi5sZW5ndGggK1xuICAgICAgdGhpcy52bUlELmxlbmd0aCArXG4gICAgICB0aGlzLm51bUZYSURzLmxlbmd0aFxuXG4gICAgY29uc3QgYmFycjogQnVmZmVyW10gPSBbXG4gICAgICBzdXBlcmJ1ZmYsXG4gICAgICB0aGlzLmFsbHljaGFpbklELFxuICAgICAgY2hhaW5OYW1lU2l6ZSxcbiAgICAgIGNoYWluTmFtZUJ1ZmYsXG4gICAgICB0aGlzLnZtSUQsXG4gICAgICB0aGlzLm51bUZYSURzXG4gICAgXVxuXG4gICAgdGhpcy5meElEcy5mb3JFYWNoKChmeElEOiBCdWZmZXIpOiB2b2lkID0+IHtcbiAgICAgIGJzaXplICs9IGZ4SUQubGVuZ3RoXG4gICAgICBiYXJyLnB1c2goZnhJRClcbiAgICB9KVxuXG4gICAgYnNpemUgKz0gNFxuICAgIGJzaXplICs9IHRoaXMuZ2VuZXNpc0RhdGEubGVuZ3RoXG4gICAgY29uc3QgZ2RMZW5ndGg6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIGdkTGVuZ3RoLndyaXRlVUludEJFKHRoaXMuZ2VuZXNpc0RhdGEubGVuZ3RoLCAwLCA0KVxuICAgIGJhcnIucHVzaChnZExlbmd0aClcbiAgICBiYXJyLnB1c2godGhpcy5nZW5lc2lzRGF0YSlcblxuICAgIGJzaXplICs9IHRoaXMuYWxseWNoYWluQXV0aC50b0J1ZmZlcigpLmxlbmd0aFxuICAgIGJhcnIucHVzaCh0aGlzLmFsbHljaGFpbkF1dGgudG9CdWZmZXIoKSlcblxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgY29uc3QgbmV3Q3JlYXRlQ2hhaW5UeDogQ3JlYXRlQ2hhaW5UeCA9IG5ldyBDcmVhdGVDaGFpblR4KClcbiAgICBuZXdDcmVhdGVDaGFpblR4LmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxuICAgIHJldHVybiBuZXdDcmVhdGVDaGFpblR4IGFzIHRoaXNcbiAgfVxuXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xuICAgIHJldHVybiBuZXcgQ3JlYXRlQ2hhaW5UeCguLi5hcmdzKSBhcyB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbmQgYWRkcyBhIFtbU2lnSWR4XV0gdG8gdGhlIFtbQWRkQWxseWNoYWluVmFsaWRhdG9yVHhdXS5cbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3NJZHggVGhlIGluZGV4IG9mIHRoZSBhZGRyZXNzIHRvIHJlZmVyZW5jZSBpbiB0aGUgc2lnbmF0dXJlc1xuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyBvZiB0aGUgc291cmNlIG9mIHRoZSBzaWduYXR1cmVcbiAgICovXG4gIGFkZFNpZ25hdHVyZUlkeChhZGRyZXNzSWR4OiBudW1iZXIsIGFkZHJlc3M6IEJ1ZmZlcik6IHZvaWQge1xuICAgIGNvbnN0IGFkZHJlc3NJbmRleDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgYWRkcmVzc0luZGV4LndyaXRlVUludEJFKGFkZHJlc3NJZHgsIDAsIDQpXG4gICAgdGhpcy5hbGx5Y2hhaW5BdXRoLmFkZEFkZHJlc3NJbmRleChhZGRyZXNzSW5kZXgpXG5cbiAgICBjb25zdCBzaWdpZHg6IFNpZ0lkeCA9IG5ldyBTaWdJZHgoKVxuICAgIGNvbnN0IGI6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIGIud3JpdGVVSW50MzJCRShhZGRyZXNzSWR4LCAwKVxuICAgIHNpZ2lkeC5mcm9tQnVmZmVyKGIpXG4gICAgc2lnaWR4LnNldFNvdXJjZShhZGRyZXNzKVxuICAgIHRoaXMuc2lnSWR4cy5wdXNoKHNpZ2lkeClcbiAgICB0aGlzLnNpZ0NvdW50LndyaXRlVUludDMyQkUodGhpcy5zaWdJZHhzLmxlbmd0aCwgMClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhcnJheSBvZiBbW1NpZ0lkeF1dIGZvciB0aGlzIFtbSW5wdXRdXVxuICAgKi9cbiAgZ2V0U2lnSWR4cygpOiBTaWdJZHhbXSB7XG4gICAgcmV0dXJuIHRoaXMuc2lnSWR4c1xuICB9XG5cbiAgZ2V0Q3JlZGVudGlhbElEKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIFBsYXRmb3JtVk1Db25zdGFudHMuU0VDUENSRURFTlRJQUxcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyB0aGUgYnl0ZXMgb2YgYW4gW1tVbnNpZ25lZFR4XV0gYW5kIHJldHVybnMgYW4gYXJyYXkgb2YgW1tDcmVkZW50aWFsXV1zXG4gICAqXG4gICAqIEBwYXJhbSBtc2cgQSBCdWZmZXIgZm9yIHRoZSBbW1Vuc2lnbmVkVHhdXVxuICAgKiBAcGFyYW0ga2MgQW4gW1tLZXlDaGFpbl1dIHVzZWQgaW4gc2lnbmluZ1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBbW0NyZWRlbnRpYWxdXXNcbiAgICovXG4gIHNpZ24obXNnOiBCdWZmZXIsIGtjOiBLZXlDaGFpbik6IENyZWRlbnRpYWxbXSB7XG4gICAgY29uc3QgY3JlZHM6IENyZWRlbnRpYWxbXSA9IHN1cGVyLnNpZ24obXNnLCBrYylcbiAgICBjb25zdCBzaWdpZHhzOiBTaWdJZHhbXSA9IHRoaXMuZ2V0U2lnSWR4cygpXG4gICAgY29uc3QgY3JlZDogQ3JlZGVudGlhbCA9IFNlbGVjdENyZWRlbnRpYWxDbGFzcyh0aGlzLmdldENyZWRlbnRpYWxJRCgpKVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBzaWdpZHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBrZXlwYWlyOiBLZXlQYWlyID0ga2MuZ2V0S2V5KHNpZ2lkeHNbYCR7aX1gXS5nZXRTb3VyY2UoKSlcbiAgICAgIGNvbnN0IHNpZ252YWw6IEJ1ZmZlciA9IGtleXBhaXIuc2lnbihtc2cpXG4gICAgICBjb25zdCBzaWc6IFNpZ25hdHVyZSA9IG5ldyBTaWduYXR1cmUoKVxuICAgICAgc2lnLmZyb21CdWZmZXIoc2lnbnZhbClcbiAgICAgIGNyZWQuYWRkU2lnbmF0dXJlKHNpZylcbiAgICB9XG4gICAgY3JlZHMucHVzaChjcmVkKVxuICAgIHJldHVybiBjcmVkc1xuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBDcmVhdGVDaGFpbiB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBPcHRpb25hbCBuZXR3b3JrSUQsIFtbRGVmYXVsdE5ldHdvcmtJRF1dXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgT3B0aW9uYWwgYmxvY2tjaGFpbklELCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXG4gICAqIEBwYXJhbSBvdXRzIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZU91dHB1dF1dc1xuICAgKiBAcGFyYW0gaW5zIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZUlucHV0XV1zXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgbWVtbyBmaWVsZFxuICAgKiBAcGFyYW0gYWxseWNoYWluSUQgT3B0aW9uYWwgSUQgb2YgdGhlIEFsbHljaGFpbiB0aGF0IHZhbGlkYXRlcyB0aGlzIGJsb2NrY2hhaW4uXG4gICAqIEBwYXJhbSBjaGFpbk5hbWUgT3B0aW9uYWwgQSBodW1hbiByZWFkYWJsZSBuYW1lIGZvciB0aGUgY2hhaW47IG5lZWQgbm90IGJlIHVuaXF1ZVxuICAgKiBAcGFyYW0gdm1JRCBPcHRpb25hbCBJRCBvZiB0aGUgVk0gcnVubmluZyBvbiB0aGUgbmV3IGNoYWluXG4gICAqIEBwYXJhbSBmeElEcyBPcHRpb25hbCBJRHMgb2YgdGhlIGZlYXR1cmUgZXh0ZW5zaW9ucyBydW5uaW5nIG9uIHRoZSBuZXcgY2hhaW5cbiAgICogQHBhcmFtIGdlbmVzaXNEYXRhIE9wdGlvbmFsIEJ5dGUgcmVwcmVzZW50YXRpb24gb2YgZ2VuZXNpcyBzdGF0ZSBvZiB0aGUgbmV3IGNoYWluXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIsIDE2KSxcbiAgICBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IHVuZGVmaW5lZCxcbiAgICBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFsbHljaGFpbklEOiBzdHJpbmcgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgY2hhaW5OYW1lOiBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgdm1JRDogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIGZ4SURzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZCxcbiAgICBnZW5lc2lzRGF0YTogc3RyaW5nIHwgR2VuZXNpc0RhdGEgPSB1bmRlZmluZWRcbiAgKSB7XG4gICAgc3VwZXIobmV0d29ya0lELCBibG9ja2NoYWluSUQsIG91dHMsIGlucywgbWVtbylcbiAgICBpZiAodHlwZW9mIGFsbHljaGFpbklEICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlmICh0eXBlb2YgYWxseWNoYWluSUQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdGhpcy5hbGx5Y2hhaW5JRCA9IGJpbnRvb2xzLmNiNThEZWNvZGUoYWxseWNoYWluSUQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmFsbHljaGFpbklEID0gYWxseWNoYWluSURcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjaGFpbk5hbWUgIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5jaGFpbk5hbWUgPSBjaGFpbk5hbWVcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB2bUlEICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGNvbnN0IGJ1ZjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyKVxuICAgICAgYnVmLndyaXRlKHZtSUQsIDAsIHZtSUQubGVuZ3RoKVxuICAgICAgdGhpcy52bUlEID0gYnVmXG4gICAgfVxuICAgIGlmICh0eXBlb2YgZnhJRHMgIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5udW1GWElEcy53cml0ZVVJbnQzMkJFKGZ4SURzLmxlbmd0aCwgMClcbiAgICAgIGNvbnN0IGZ4SURCdWZzOiBCdWZmZXJbXSA9IFtdXG4gICAgICBmeElEcy5mb3JFYWNoKChmeElEOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICAgICAgY29uc3QgYnVmOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIpXG4gICAgICAgIGJ1Zi53cml0ZShmeElELCAwLCBmeElELmxlbmd0aCwgXCJ1dGY4XCIpXG4gICAgICAgIGZ4SURCdWZzLnB1c2goYnVmKVxuICAgICAgfSlcbiAgICAgIHRoaXMuZnhJRHMgPSBmeElEQnVmc1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGdlbmVzaXNEYXRhICE9IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIGdlbmVzaXNEYXRhICE9IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuZ2VuZXNpc0RhdGEgPSBnZW5lc2lzRGF0YS50b0J1ZmZlcigpXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZ2VuZXNpc0RhdGEgPT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhpcy5nZW5lc2lzRGF0YSA9IEJ1ZmZlci5mcm9tKGdlbmVzaXNEYXRhKVxuICAgIH1cblxuICAgIGNvbnN0IGFsbHljaGFpbkF1dGg6IEFsbHljaGFpbkF1dGggPSBuZXcgQWxseWNoYWluQXV0aCgpXG4gICAgdGhpcy5hbGx5Y2hhaW5BdXRoID0gYWxseWNoYWluQXV0aFxuICB9XG59XG4iXX0=