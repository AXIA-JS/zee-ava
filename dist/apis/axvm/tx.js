"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tx = exports.UnsignedTx = exports.SelectTxClass = void 0;
/**
 * @packageDocumentation
 * @module API-AXVM-Transactions
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const credentials_1 = require("./credentials");
const tx_1 = require("../../common/tx");
const create_hash_1 = __importDefault(require("create-hash"));
const basetx_1 = require("./basetx");
const createassettx_1 = require("./createassettx");
const operationtx_1 = require("./operationtx");
const importtx_1 = require("./importtx");
const exporttx_1 = require("./exporttx");
const errors_1 = require("../../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
/**
 * Takes a buffer representing the output and returns the proper [[BaseTx]] instance.
 *
 * @param txtype The id of the transaction type
 *
 * @returns An instance of an [[BaseTx]]-extended class.
 */
const SelectTxClass = (txtype, ...args) => {
    if (txtype === constants_1.AXVMConstants.BASETX) {
        return new basetx_1.BaseTx(...args);
    }
    else if (txtype === constants_1.AXVMConstants.CREATEASSETTX) {
        return new createassettx_1.CreateAssetTx(...args);
    }
    else if (txtype === constants_1.AXVMConstants.OPERATIONTX) {
        return new operationtx_1.OperationTx(...args);
    }
    else if (txtype === constants_1.AXVMConstants.IMPORTTX) {
        return new importtx_1.ImportTx(...args);
    }
    else if (txtype === constants_1.AXVMConstants.EXPORTTX) {
        return new exporttx_1.ExportTx(...args);
    }
    /* istanbul ignore next */
    throw new errors_1.TransactionError("Error - SelectTxClass: unknown txtype");
};
exports.SelectTxClass = SelectTxClass;
class UnsignedTx extends tx_1.StandardUnsignedTx {
    constructor() {
        super(...arguments);
        this._typeName = "UnsignedTx";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.transaction = (0, exports.SelectTxClass)(fields["transaction"]["_typeID"]);
        this.transaction.deserialize(fields["transaction"], encoding);
    }
    getTransaction() {
        return this.transaction;
    }
    fromBuffer(bytes, offset = 0) {
        this.codecID = bintools.copyFrom(bytes, offset, offset + 2).readUInt16BE(0);
        offset += 2;
        const txtype = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.transaction = (0, exports.SelectTxClass)(txtype);
        return this.transaction.fromBuffer(bytes, offset);
    }
    /**
     * Signs this [[UnsignedTx]] and returns signed [[StandardTx]]
     *
     * @param kc An [[KeyChain]] used in signing
     *
     * @returns A signed [[StandardTx]]
     */
    sign(kc) {
        const txbuff = this.toBuffer();
        const msg = buffer_1.Buffer.from((0, create_hash_1.default)("sha256").update(txbuff).digest());
        const creds = this.transaction.sign(msg, kc);
        return new Tx(this, creds);
    }
}
exports.UnsignedTx = UnsignedTx;
class Tx extends tx_1.StandardTx {
    constructor() {
        super(...arguments);
        this._typeName = "Tx";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.unsignedTx = new UnsignedTx();
        this.unsignedTx.deserialize(fields["unsignedTx"], encoding);
        this.credentials = [];
        for (let i = 0; i < fields["credentials"].length; i++) {
            const cred = (0, credentials_1.SelectCredentialClass)(fields["credentials"][`${i}`]["_typeID"]);
            cred.deserialize(fields["credentials"][`${i}`], encoding);
            this.credentials.push(cred);
        }
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[Tx]], parses it, populates the class, and returns the length of the Tx in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[Tx]]
     * @param offset A number representing the starting point of the bytes to begin parsing
     *
     * @returns The length of the raw [[Tx]]
     */
    fromBuffer(bytes, offset = 0) {
        this.unsignedTx = new UnsignedTx();
        offset = this.unsignedTx.fromBuffer(bytes, offset);
        const numcreds = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.credentials = [];
        for (let i = 0; i < numcreds; i++) {
            const credid = bintools
                .copyFrom(bytes, offset, offset + 4)
                .readUInt32BE(0);
            offset += 4;
            const cred = (0, credentials_1.SelectCredentialClass)(credid);
            offset = cred.fromBuffer(bytes, offset);
            this.credentials.push(cred);
        }
        return offset;
    }
}
exports.Tx = Tx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9heHZtL3R4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxvRUFBMkM7QUFDM0MsMkNBQTJDO0FBQzNDLCtDQUFxRDtBQUdyRCx3Q0FBZ0U7QUFDaEUsOERBQW9DO0FBQ3BDLHFDQUFpQztBQUNqQyxtREFBK0M7QUFDL0MsK0NBQTJDO0FBQzNDLHlDQUFxQztBQUNyQyx5Q0FBcUM7QUFFckMsK0NBQXFEO0FBRXJEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVqRDs7Ozs7O0dBTUc7QUFDSSxNQUFNLGFBQWEsR0FBRyxDQUFDLE1BQWMsRUFBRSxHQUFHLElBQVcsRUFBVSxFQUFFO0lBQ3RFLElBQUksTUFBTSxLQUFLLHlCQUFhLENBQUMsTUFBTSxFQUFFO1FBQ25DLE9BQU8sSUFBSSxlQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtLQUMzQjtTQUFNLElBQUksTUFBTSxLQUFLLHlCQUFhLENBQUMsYUFBYSxFQUFFO1FBQ2pELE9BQU8sSUFBSSw2QkFBYSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FDbEM7U0FBTSxJQUFJLE1BQU0sS0FBSyx5QkFBYSxDQUFDLFdBQVcsRUFBRTtRQUMvQyxPQUFPLElBQUkseUJBQVcsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFBO0tBQ2hDO1NBQU0sSUFBSSxNQUFNLEtBQUsseUJBQWEsQ0FBQyxRQUFRLEVBQUU7UUFDNUMsT0FBTyxJQUFJLG1CQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtLQUM3QjtTQUFNLElBQUksTUFBTSxLQUFLLHlCQUFhLENBQUMsUUFBUSxFQUFFO1FBQzVDLE9BQU8sSUFBSSxtQkFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FDN0I7SUFDRCwwQkFBMEI7SUFD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SUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7U0FDNUI7UUFDRCxPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUM7Q0FDRjtBQS9DRCxnQkErQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktQVhWTS1UcmFuc2FjdGlvbnNcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQgeyBBWFZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcbmltcG9ydCB7IFNlbGVjdENyZWRlbnRpYWxDbGFzcyB9IGZyb20gXCIuL2NyZWRlbnRpYWxzXCJcbmltcG9ydCB7IEtleUNoYWluLCBLZXlQYWlyIH0gZnJvbSBcIi4va2V5Y2hhaW5cIlxuaW1wb3J0IHsgQ3JlZGVudGlhbCB9IGZyb20gXCIuLi8uLi9jb21tb24vY3JlZGVudGlhbHNcIlxuaW1wb3J0IHsgU3RhbmRhcmRUeCwgU3RhbmRhcmRVbnNpZ25lZFR4IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi90eFwiXG5pbXBvcnQgY3JlYXRlSGFzaCBmcm9tIFwiY3JlYXRlLWhhc2hcIlxuaW1wb3J0IHsgQmFzZVR4IH0gZnJvbSBcIi4vYmFzZXR4XCJcbmltcG9ydCB7IENyZWF0ZUFzc2V0VHggfSBmcm9tIFwiLi9jcmVhdGVhc3NldHR4XCJcbmltcG9ydCB7IE9wZXJhdGlvblR4IH0gZnJvbSBcIi4vb3BlcmF0aW9udHhcIlxuaW1wb3J0IHsgSW1wb3J0VHggfSBmcm9tIFwiLi9pbXBvcnR0eFwiXG5pbXBvcnQgeyBFeHBvcnRUeCB9IGZyb20gXCIuL2V4cG9ydHR4XCJcbmltcG9ydCB7IFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcbmltcG9ydCB7IFRyYW5zYWN0aW9uRXJyb3IgfSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcblxuLyoqXG4gKiBUYWtlcyBhIGJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIG91dHB1dCBhbmQgcmV0dXJucyB0aGUgcHJvcGVyIFtbQmFzZVR4XV0gaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHR4dHlwZSBUaGUgaWQgb2YgdGhlIHRyYW5zYWN0aW9uIHR5cGVcbiAqXG4gKiBAcmV0dXJucyBBbiBpbnN0YW5jZSBvZiBhbiBbW0Jhc2VUeF1dLWV4dGVuZGVkIGNsYXNzLlxuICovXG5leHBvcnQgY29uc3QgU2VsZWN0VHhDbGFzcyA9ICh0eHR5cGU6IG51bWJlciwgLi4uYXJnczogYW55W10pOiBCYXNlVHggPT4ge1xuICBpZiAodHh0eXBlID09PSBBWFZNQ29uc3RhbnRzLkJBU0VUWCkge1xuICAgIHJldHVybiBuZXcgQmFzZVR4KC4uLmFyZ3MpXG4gIH0gZWxzZSBpZiAodHh0eXBlID09PSBBWFZNQ29uc3RhbnRzLkNSRUFURUFTU0VUVFgpIHtcbiAgICByZXR1cm4gbmV3IENyZWF0ZUFzc2V0VHgoLi4uYXJncylcbiAgfSBlbHNlIGlmICh0eHR5cGUgPT09IEFYVk1Db25zdGFudHMuT1BFUkFUSU9OVFgpIHtcbiAgICByZXR1cm4gbmV3IE9wZXJhdGlvblR4KC4uLmFyZ3MpXG4gIH0gZWxzZSBpZiAodHh0eXBlID09PSBBWFZNQ29uc3RhbnRzLklNUE9SVFRYKSB7XG4gICAgcmV0dXJuIG5ldyBJbXBvcnRUeCguLi5hcmdzKVxuICB9IGVsc2UgaWYgKHR4dHlwZSA9PT0gQVhWTUNvbnN0YW50cy5FWFBPUlRUWCkge1xuICAgIHJldHVybiBuZXcgRXhwb3J0VHgoLi4uYXJncylcbiAgfVxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICB0aHJvdyBuZXcgVHJhbnNhY3Rpb25FcnJvcihcIkVycm9yIC0gU2VsZWN0VHhDbGFzczogdW5rbm93biB0eHR5cGVcIilcbn1cblxuZXhwb3J0IGNsYXNzIFVuc2lnbmVkVHggZXh0ZW5kcyBTdGFuZGFyZFVuc2lnbmVkVHg8S2V5UGFpciwgS2V5Q2hhaW4sIEJhc2VUeD4ge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJVbnNpZ25lZFR4XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICAvL3NlcmlhbGl6ZSBpcyBpbmhlcml0ZWRcblxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMudHJhbnNhY3Rpb24gPSBTZWxlY3RUeENsYXNzKGZpZWxkc1tcInRyYW5zYWN0aW9uXCJdW1wiX3R5cGVJRFwiXSlcbiAgICB0aGlzLnRyYW5zYWN0aW9uLmRlc2VyaWFsaXplKGZpZWxkc1tcInRyYW5zYWN0aW9uXCJdLCBlbmNvZGluZylcbiAgfVxuXG4gIGdldFRyYW5zYWN0aW9uKCk6IEJhc2VUeCB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNhY3Rpb24gYXMgQmFzZVR4XG4gIH1cblxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgdGhpcy5jb2RlY0lEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMikucmVhZFVJbnQxNkJFKDApXG4gICAgb2Zmc2V0ICs9IDJcbiAgICBjb25zdCB0eHR5cGU6IG51bWJlciA9IGJpbnRvb2xzXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICAgIC5yZWFkVUludDMyQkUoMClcbiAgICBvZmZzZXQgKz0gNFxuICAgIHRoaXMudHJhbnNhY3Rpb24gPSBTZWxlY3RUeENsYXNzKHR4dHlwZSlcbiAgICByZXR1cm4gdGhpcy50cmFuc2FjdGlvbi5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gIH1cblxuICAvKipcbiAgICogU2lnbnMgdGhpcyBbW1Vuc2lnbmVkVHhdXSBhbmQgcmV0dXJucyBzaWduZWQgW1tTdGFuZGFyZFR4XV1cbiAgICpcbiAgICogQHBhcmFtIGtjIEFuIFtbS2V5Q2hhaW5dXSB1c2VkIGluIHNpZ25pbmdcbiAgICpcbiAgICogQHJldHVybnMgQSBzaWduZWQgW1tTdGFuZGFyZFR4XV1cbiAgICovXG4gIHNpZ24oa2M6IEtleUNoYWluKTogVHgge1xuICAgIGNvbnN0IHR4YnVmZiA9IHRoaXMudG9CdWZmZXIoKVxuICAgIGNvbnN0IG1zZzogQnVmZmVyID0gQnVmZmVyLmZyb20oXG4gICAgICBjcmVhdGVIYXNoKFwic2hhMjU2XCIpLnVwZGF0ZSh0eGJ1ZmYpLmRpZ2VzdCgpXG4gICAgKVxuICAgIGNvbnN0IGNyZWRzOiBDcmVkZW50aWFsW10gPSB0aGlzLnRyYW5zYWN0aW9uLnNpZ24obXNnLCBrYylcbiAgICByZXR1cm4gbmV3IFR4KHRoaXMsIGNyZWRzKVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUeCBleHRlbmRzIFN0YW5kYXJkVHg8S2V5UGFpciwgS2V5Q2hhaW4sIFVuc2lnbmVkVHg+IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVHhcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIC8vc2VyaWFsaXplIGlzIGluaGVyaXRlZFxuXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy51bnNpZ25lZFR4ID0gbmV3IFVuc2lnbmVkVHgoKVxuICAgIHRoaXMudW5zaWduZWRUeC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJ1bnNpZ25lZFR4XCJdLCBlbmNvZGluZylcbiAgICB0aGlzLmNyZWRlbnRpYWxzID0gW11cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgZmllbGRzW1wiY3JlZGVudGlhbHNcIl0ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGNyZWQ6IENyZWRlbnRpYWwgPSBTZWxlY3RDcmVkZW50aWFsQ2xhc3MoXG4gICAgICAgIGZpZWxkc1tcImNyZWRlbnRpYWxzXCJdW2Ake2l9YF1bXCJfdHlwZUlEXCJdXG4gICAgICApXG4gICAgICBjcmVkLmRlc2VyaWFsaXplKGZpZWxkc1tcImNyZWRlbnRpYWxzXCJdW2Ake2l9YF0sIGVuY29kaW5nKVxuICAgICAgdGhpcy5jcmVkZW50aWFscy5wdXNoKGNyZWQpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhbiBbW1R4XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgVHggaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tUeF1dXG4gICAqIEBwYXJhbSBvZmZzZXQgQSBudW1iZXIgcmVwcmVzZW50aW5nIHRoZSBzdGFydGluZyBwb2ludCBvZiB0aGUgYnl0ZXMgdG8gYmVnaW4gcGFyc2luZ1xuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tUeF1dXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgdGhpcy51bnNpZ25lZFR4ID0gbmV3IFVuc2lnbmVkVHgoKVxuICAgIG9mZnNldCA9IHRoaXMudW5zaWduZWRUeC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgY29uc3QgbnVtY3JlZHM6IG51bWJlciA9IGJpbnRvb2xzXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICAgIC5yZWFkVUludDMyQkUoMClcbiAgICBvZmZzZXQgKz0gNFxuICAgIHRoaXMuY3JlZGVudGlhbHMgPSBbXVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBudW1jcmVkczsgaSsrKSB7XG4gICAgICBjb25zdCBjcmVkaWQ6IG51bWJlciA9IGJpbnRvb2xzXG4gICAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgICAgICAucmVhZFVJbnQzMkJFKDApXG4gICAgICBvZmZzZXQgKz0gNFxuICAgICAgY29uc3QgY3JlZDogQ3JlZGVudGlhbCA9IFNlbGVjdENyZWRlbnRpYWxDbGFzcyhjcmVkaWQpXG4gICAgICBvZmZzZXQgPSBjcmVkLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICAgIHRoaXMuY3JlZGVudGlhbHMucHVzaChjcmVkKVxuICAgIH1cbiAgICByZXR1cm4gb2Zmc2V0XG4gIH1cbn1cbiJdfQ==