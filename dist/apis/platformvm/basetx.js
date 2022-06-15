"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTx = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-BaseTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const outputs_1 = require("./outputs");
const inputs_1 = require("./inputs");
const credentials_1 = require("./credentials");
const tx_1 = require("../../common/tx");
const credentials_2 = require("../../common/credentials");
const constants_2 = require("../../utils/constants");
const tx_2 = require("../platformvm/tx");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
/**
 * Class representing a base for all transactions.
 */
class BaseTx extends tx_1.StandardBaseTx {
    /**
     * Class representing a BaseTx which is the foundation for all transactions.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "BaseTx";
        this._typeID = constants_1.PlatformVMConstants.CREATEALLYCHAINTX;
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.outs = fields["outs"].map((o) => {
            let newOut = new outputs_1.TransferableOutput();
            newOut.deserialize(o, encoding);
            return newOut;
        });
        this.ins = fields["ins"].map((i) => {
            let newIn = new inputs_1.TransferableInput();
            newIn.deserialize(i, encoding);
            return newIn;
        });
        this.numouts = buffer_1.Buffer.alloc(4);
        this.numouts.writeUInt32BE(this.outs.length, 0);
        this.numins = buffer_1.Buffer.alloc(4);
        this.numins.writeUInt32BE(this.ins.length, 0);
    }
    getOuts() {
        return this.outs;
    }
    getIns() {
        return this.ins;
    }
    getTotalOuts() {
        return this.getOuts();
    }
    /**
     * Returns the id of the [[BaseTx]]
     */
    getTxType() {
        return constants_1.PlatformVMConstants.BASETX;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[BaseTx]], parses it, populates the class, and returns the length of the BaseTx in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[BaseTx]]
     *
     * @returns The length of the raw [[BaseTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        this.networkID = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.blockchainID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.numouts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const outcount = this.numouts.readUInt32BE(0);
        this.outs = [];
        for (let i = 0; i < outcount; i++) {
            const xferout = new outputs_1.TransferableOutput();
            offset = xferout.fromBuffer(bytes, offset);
            this.outs.push(xferout);
        }
        this.numins = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const incount = this.numins.readUInt32BE(0);
        this.ins = [];
        for (let i = 0; i < incount; i++) {
            const xferin = new inputs_1.TransferableInput();
            offset = xferin.fromBuffer(bytes, offset);
            this.ins.push(xferin);
        }
        let memolen = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.memo = bintools.copyFrom(bytes, offset, offset + memolen);
        offset += memolen;
        return offset;
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
        const creds = [];
        for (let i = 0; i < this.ins.length; i++) {
            const cred = (0, credentials_1.SelectCredentialClass)(this.ins[`${i}`].getInput().getCredentialID());
            const sigidxs = this.ins[`${i}`].getInput().getSigIdxs();
            for (let j = 0; j < sigidxs.length; j++) {
                const keypair = kc.getKey(sigidxs[`${j}`].getSource());
                const signval = keypair.sign(msg);
                const sig = new credentials_2.Signature();
                sig.fromBuffer(signval);
                cred.addSignature(sig);
            }
            creds.push(cred);
        }
        return creds;
    }
    clone() {
        let newbase = new BaseTx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new BaseTx(...args);
    }
    select(id, ...args) {
        let newbasetx = (0, tx_2.SelectTxClass)(id, ...args);
        return newbasetx;
    }
}
exports.BaseTx = BaseTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZXR4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvcGxhdGZvcm12bS9iYXNldHgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWdDO0FBQ2hDLG9FQUEyQztBQUMzQywyQ0FBaUQ7QUFDakQsdUNBQThDO0FBQzlDLHFDQUE0QztBQUM1QywrQ0FBcUQ7QUFFckQsd0NBQWdEO0FBQ2hELDBEQUF3RTtBQUN4RSxxREFBd0Q7QUFDeEQseUNBQWdEO0FBR2hEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVqRDs7R0FFRztBQUNILE1BQWEsTUFBTyxTQUFRLG1CQUFpQztJQTZIM0Q7Ozs7Ozs7O09BUUc7SUFDSCxZQUNFLFlBQW9CLDRCQUFnQixFQUNwQyxlQUF1QixlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFDM0MsT0FBNkIsU0FBUyxFQUN0QyxNQUEyQixTQUFTLEVBQ3BDLE9BQWUsU0FBUztRQUV4QixLQUFLLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBNUl2QyxjQUFTLEdBQUcsUUFBUSxDQUFBO1FBQ3BCLFlBQU8sR0FBRywrQkFBbUIsQ0FBQyxpQkFBaUIsQ0FBQTtJQTRJekQsQ0FBQztJQTFJRCxXQUFXLENBQUMsTUFBYyxFQUFFLFdBQStCLEtBQUs7UUFDOUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDbkMsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBcUIsRUFBRSxFQUFFO1lBQ3ZELElBQUksTUFBTSxHQUF1QixJQUFJLDRCQUFrQixFQUFFLENBQUE7WUFDekQsTUFBTSxDQUFDLFdBQVcs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LEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDL0MsTUFBTSxPQUFPLEdBQVksRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUE7Z0JBQy9ELE1BQU0sT0FBTyxHQUFXLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7Z0JBQ3pDLE1BQU0sR0FBRyxHQUFjLElBQUksdUJBQVMsRUFBRSxDQUFBO2dCQUN0QyxHQUFHLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFBO2dCQUN2QixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFBO2FBQ3ZCO1lBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtTQUNqQjtRQUNELE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUVELEtBQUs7UUFDSCxJQUFJLE9BQU8sR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFBO1FBQ2xDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7UUFDbkMsT0FBTyxPQUFlLENBQUE7SUFDeEIsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFHLElBQVc7UUFDbkIsT0FBTyxJQUFJLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBUyxDQUFBO0lBQ3BDLENBQUM7SUFFRCxNQUFNLENBQUMsRUFBVSxFQUFFLEdBQUcsSUFBVztRQUMvQixJQUFJLFNBQVMsR0FBVyxJQUFBLGtCQUFhLEVBQUMsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUE7UUFDbEQsT0FBTyxTQUFpQixDQUFBO0lBQzFCLENBQUM7Q0FvQkY7QUEvSUQsd0JBK0lDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLVBsYXRmb3JtVk0tQmFzZVR4XG4gKi9cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxuaW1wb3J0IHsgUGxhdGZvcm1WTUNvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiXG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVPdXRwdXQgfSBmcm9tIFwiLi9vdXRwdXRzXCJcbmltcG9ydCB7IFRyYW5zZmVyYWJsZUlucHV0IH0gZnJvbSBcIi4vaW5wdXRzXCJcbmltcG9ydCB7IFNlbGVjdENyZWRlbnRpYWxDbGFzcyB9IGZyb20gXCIuL2NyZWRlbnRpYWxzXCJcbmltcG9ydCB7IEtleUNoYWluLCBLZXlQYWlyIH0gZnJvbSBcIi4va2V5Y2hhaW5cIlxuaW1wb3J0IHsgU3RhbmRhcmRCYXNlVHggfSBmcm9tIFwiLi4vLi4vY29tbW9uL3R4XCJcbmltcG9ydCB7IFNpZ25hdHVyZSwgU2lnSWR4LCBDcmVkZW50aWFsIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9jcmVkZW50aWFsc1wiXG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lEIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2NvbnN0YW50c1wiXG5pbXBvcnQgeyBTZWxlY3RUeENsYXNzIH0gZnJvbSBcIi4uL3BsYXRmb3Jtdm0vdHhcIlxuaW1wb3J0IHsgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuXG4vKipcbiAqIENsYXNzIHJlcHJlc2VudGluZyBhIGJhc2UgZm9yIGFsbCB0cmFuc2FjdGlvbnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBCYXNlVHggZXh0ZW5kcyBTdGFuZGFyZEJhc2VUeDxLZXlQYWlyLCBLZXlDaGFpbj4ge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJCYXNlVHhcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IFBsYXRmb3JtVk1Db25zdGFudHMuQ1JFQVRFQUxMWUNIQUlOVFhcblxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMub3V0cyA9IGZpZWxkc1tcIm91dHNcIl0ubWFwKChvOiBUcmFuc2ZlcmFibGVPdXRwdXQpID0+IHtcbiAgICAgIGxldCBuZXdPdXQ6IFRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoKVxuICAgICAgbmV3T3V0LmRlc2VyaWFsaXplKG8sIGVuY29kaW5nKVxuICAgICAgcmV0dXJuIG5ld091dFxuICAgIH0pXG4gICAgdGhpcy5pbnMgPSBmaWVsZHNbXCJpbnNcIl0ubWFwKChpOiBUcmFuc2ZlcmFibGVJbnB1dCkgPT4ge1xuICAgICAgbGV0IG5ld0luOiBUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCgpXG4gICAgICBuZXdJbi5kZXNlcmlhbGl6ZShpLCBlbmNvZGluZylcbiAgICAgIHJldHVybiBuZXdJblxuICAgIH0pXG4gICAgdGhpcy5udW1vdXRzID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgdGhpcy5udW1vdXRzLndyaXRlVUludDMyQkUodGhpcy5vdXRzLmxlbmd0aCwgMClcbiAgICB0aGlzLm51bWlucyA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIHRoaXMubnVtaW5zLndyaXRlVUludDMyQkUodGhpcy5pbnMubGVuZ3RoLCAwKVxuICB9XG5cbiAgZ2V0T3V0cygpOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSB7XG4gICAgcmV0dXJuIHRoaXMub3V0cyBhcyBUcmFuc2ZlcmFibGVPdXRwdXRbXVxuICB9XG5cbiAgZ2V0SW5zKCk6IFRyYW5zZmVyYWJsZUlucHV0W10ge1xuICAgIHJldHVybiB0aGlzLmlucyBhcyBUcmFuc2ZlcmFibGVJbnB1dFtdXG4gIH1cblxuICBnZXRUb3RhbE91dHMoKTogVHJhbnNmZXJhYmxlT3V0cHV0W10ge1xuICAgIHJldHVybiB0aGlzLmdldE91dHMoKSBhcyBUcmFuc2ZlcmFibGVPdXRwdXRbXVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGlkIG9mIHRoZSBbW0Jhc2VUeF1dXG4gICAqL1xuICBnZXRUeFR5cGUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gUGxhdGZvcm1WTUNvbnN0YW50cy5CQVNFVFhcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYW4gW1tCYXNlVHhdXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBCYXNlVHggaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tCYXNlVHhdXVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tCYXNlVHhdXVxuICAgKlxuICAgKiBAcmVtYXJrcyBhc3N1bWUgbm90LWNoZWNrc3VtbWVkXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgdGhpcy5uZXR3b3JrSUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgIG9mZnNldCArPSA0XG4gICAgdGhpcy5ibG9ja2NoYWluSUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMilcbiAgICBvZmZzZXQgKz0gMzJcbiAgICB0aGlzLm51bW91dHMgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgIG9mZnNldCArPSA0XG4gICAgY29uc3Qgb3V0Y291bnQ6IG51bWJlciA9IHRoaXMubnVtb3V0cy5yZWFkVUludDMyQkUoMClcbiAgICB0aGlzLm91dHMgPSBbXVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBvdXRjb3VudDsgaSsrKSB7XG4gICAgICBjb25zdCB4ZmVyb3V0OiBUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KClcbiAgICAgIG9mZnNldCA9IHhmZXJvdXQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgICAgdGhpcy5vdXRzLnB1c2goeGZlcm91dClcbiAgICB9XG5cbiAgICB0aGlzLm51bWlucyA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgb2Zmc2V0ICs9IDRcbiAgICBjb25zdCBpbmNvdW50OiBudW1iZXIgPSB0aGlzLm51bWlucy5yZWFkVUludDMyQkUoMClcbiAgICB0aGlzLmlucyA9IFtdXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IGluY291bnQ7IGkrKykge1xuICAgICAgY29uc3QgeGZlcmluOiBUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCgpXG4gICAgICBvZmZzZXQgPSB4ZmVyaW4uZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgICAgdGhpcy5pbnMucHVzaCh4ZmVyaW4pXG4gICAgfVxuICAgIGxldCBtZW1vbGVuOiBudW1iZXIgPSBiaW50b29sc1xuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgICAucmVhZFVJbnQzMkJFKDApXG4gICAgb2Zmc2V0ICs9IDRcbiAgICB0aGlzLm1lbW8gPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyBtZW1vbGVuKVxuICAgIG9mZnNldCArPSBtZW1vbGVuXG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIHRoZSBieXRlcyBvZiBhbiBbW1Vuc2lnbmVkVHhdXSBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBbW0NyZWRlbnRpYWxdXXNcbiAgICpcbiAgICogQHBhcmFtIG1zZyBBIEJ1ZmZlciBmb3IgdGhlIFtbVW5zaWduZWRUeF1dXG4gICAqIEBwYXJhbSBrYyBBbiBbW0tleUNoYWluXV0gdXNlZCBpbiBzaWduaW5nXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIFtbQ3JlZGVudGlhbF1dc1xuICAgKi9cbiAgc2lnbihtc2c6IEJ1ZmZlciwga2M6IEtleUNoYWluKTogQ3JlZGVudGlhbFtdIHtcbiAgICBjb25zdCBjcmVkczogQ3JlZGVudGlhbFtdID0gW11cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy5pbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGNyZWQ6IENyZWRlbnRpYWwgPSBTZWxlY3RDcmVkZW50aWFsQ2xhc3MoXG4gICAgICAgIHRoaXMuaW5zW2Ake2l9YF0uZ2V0SW5wdXQoKS5nZXRDcmVkZW50aWFsSUQoKVxuICAgICAgKVxuICAgICAgY29uc3Qgc2lnaWR4czogU2lnSWR4W10gPSB0aGlzLmluc1tgJHtpfWBdLmdldElucHV0KCkuZ2V0U2lnSWR4cygpXG4gICAgICBmb3IgKGxldCBqOiBudW1iZXIgPSAwOyBqIDwgc2lnaWR4cy5sZW5ndGg7IGorKykge1xuICAgICAgICBjb25zdCBrZXlwYWlyOiBLZXlQYWlyID0ga2MuZ2V0S2V5KHNpZ2lkeHNbYCR7an1gXS5nZXRTb3VyY2UoKSlcbiAgICAgICAgY29uc3Qgc2lnbnZhbDogQnVmZmVyID0ga2V5cGFpci5zaWduKG1zZylcbiAgICAgICAgY29uc3Qgc2lnOiBTaWduYXR1cmUgPSBuZXcgU2lnbmF0dXJlKClcbiAgICAgICAgc2lnLmZyb21CdWZmZXIoc2lnbnZhbClcbiAgICAgICAgY3JlZC5hZGRTaWduYXR1cmUoc2lnKVxuICAgICAgfVxuICAgICAgY3JlZHMucHVzaChjcmVkKVxuICAgIH1cbiAgICByZXR1cm4gY3JlZHNcbiAgfVxuXG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGxldCBuZXdiYXNlOiBCYXNlVHggPSBuZXcgQmFzZVR4KClcbiAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxuICAgIHJldHVybiBuZXdiYXNlIGFzIHRoaXNcbiAgfVxuXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xuICAgIHJldHVybiBuZXcgQmFzZVR4KC4uLmFyZ3MpIGFzIHRoaXNcbiAgfVxuXG4gIHNlbGVjdChpZDogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xuICAgIGxldCBuZXdiYXNldHg6IEJhc2VUeCA9IFNlbGVjdFR4Q2xhc3MoaWQsIC4uLmFyZ3MpXG4gICAgcmV0dXJuIG5ld2Jhc2V0eCBhcyB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGEgQmFzZVR4IHdoaWNoIGlzIHRoZSBmb3VuZGF0aW9uIGZvciBhbGwgdHJhbnNhY3Rpb25zLlxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE9wdGlvbmFsIG5ldHdvcmtJRCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBPcHRpb25hbCBibG9ja2NoYWluSUQsIGRlZmF1bHQgQnVmZmVyLmFsbG9jKDMyLCAxNilcbiAgICogQHBhcmFtIG91dHMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zXG4gICAqIEBwYXJhbSBpbnMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXNcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBtZW1vIGZpZWxkXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIsIDE2KSxcbiAgICBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IHVuZGVmaW5lZCxcbiAgICBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkXG4gICkge1xuICAgIHN1cGVyKG5ldHdvcmtJRCwgYmxvY2tjaGFpbklELCBvdXRzLCBpbnMsIG1lbW8pXG4gIH1cbn1cbiJdfQ==