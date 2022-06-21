"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tx = exports.UnsignedTx = exports.SelectTxClass = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-Transactions
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const credentials_1 = require("./credentials");
const tx_1 = require("../../common/tx");
const create_hash_1 = __importDefault(require("create-hash"));
const basetx_1 = require("./basetx");
const importtx_1 = require("./importtx");
const exporttx_1 = require("./exporttx");
const validationtx_1 = require("./validationtx");
const createallychaintx_1 = require("./createallychaintx");
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
    if (txtype === constants_1.PlatformVMConstants.BASETX) {
        return new basetx_1.BaseTx(...args);
    }
    else if (txtype === constants_1.PlatformVMConstants.IMPORTTX) {
        return new importtx_1.ImportTx(...args);
    }
    else if (txtype === constants_1.PlatformVMConstants.EXPORTTX) {
        return new exporttx_1.ExportTx(...args);
    }
    else if (txtype === constants_1.PlatformVMConstants.ADDNOMINATORTX) {
        return new validationtx_1.AddNominatorTx(...args);
    }
    else if (txtype === constants_1.PlatformVMConstants.ADDVALIDATORTX) {
        return new validationtx_1.AddValidatorTx(...args);
    }
    else if (txtype === constants_1.PlatformVMConstants.CREATESUBNETTX) {
        return new createallychaintx_1.CreateAllychainTx(...args);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9wbGF0Zm9ybXZtL3R4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxvRUFBMkM7QUFDM0MsMkNBQWlEO0FBQ2pELCtDQUFxRDtBQUVyRCx3Q0FBZ0U7QUFFaEUsOERBQW9DO0FBQ3BDLHFDQUFpQztBQUNqQyx5Q0FBcUM7QUFDckMseUNBQXFDO0FBRXJDLGlEQUErRDtBQUMvRCwyREFBdUQ7QUFDdkQsK0NBQXFEO0FBRXJEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVqRDs7Ozs7O0dBTUc7QUFDSSxNQUFNLGFBQWEsR0FBRyxDQUFDLE1BQWMsRUFBRSxHQUFHLElBQVcsRUFBVSxFQUFFO0lBQ3RFLElBQUksTUFBTSxLQUFLLCtCQUFtQixDQUFDLE1BQU0sRUFBRTtRQUN6QyxPQUFPLElBQUksZUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FDM0I7U0FBTSxJQUFJLE1BQU0sS0FBSywrQkFBbUIsQ0FBQyxRQUFRLEVBQUU7UUFDbEQsT0FBTyxJQUFJLG1CQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtLQUM3QjtTQUFNLElBQUksTUFBTSxLQUFLLCtCQUFtQixDQUFDLFFBQVEsRUFBRTtRQUNsRCxPQUFPLElBQUksbUJBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFBO0tBQzdCO1NBQU0sSUFBSSxNQUFNLEtBQUssK0JBQW1CLENBQUMsY0FBYyxFQUFFO1FBQ3hELE9BQU8sSUFBSSw2QkFBYyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7S0FDbkM7U0FBTSxJQUFJLE1BQU0sS0FBSywrQkFBbUIsQ0FBQyxjQUFjLEVBQUU7UUFDeEQsT0FBTyxJQUFJLDZCQUFjLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQTtLQUNuQztTQUFN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SUFBSSxHQUFlLElBQUEsbUNBQXFCLEVBQUMsTUFBTSxDQUFDLENBQUE7WUFDdEQsTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1lBQ3ZDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1NBQzVCO1FBQ0QsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDO0NBQ0Y7QUEvQ0QsZ0JBK0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLVBsYXRmb3JtVk0tVHJhbnNhY3Rpb25zXG4gKi9cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxuaW1wb3J0IHsgUGxhdGZvcm1WTUNvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiXG5pbXBvcnQgeyBTZWxlY3RDcmVkZW50aWFsQ2xhc3MgfSBmcm9tIFwiLi9jcmVkZW50aWFsc1wiXG5pbXBvcnQgeyBLZXlDaGFpbiwgS2V5UGFpciB9IGZyb20gXCIuL2tleWNoYWluXCJcbmltcG9ydCB7IFN0YW5kYXJkVHgsIFN0YW5kYXJkVW5zaWduZWRUeCB9IGZyb20gXCIuLi8uLi9jb21tb24vdHhcIlxuaW1wb3J0IHsgQ3JlZGVudGlhbCB9IGZyb20gXCIuLi8uLi9jb21tb24vY3JlZGVudGlhbHNcIlxuaW1wb3J0IGNyZWF0ZUhhc2ggZnJvbSBcImNyZWF0ZS1oYXNoXCJcbmltcG9ydCB7IEJhc2VUeCB9IGZyb20gXCIuL2Jhc2V0eFwiXG5pbXBvcnQgeyBJbXBvcnRUeCB9IGZyb20gXCIuL2ltcG9ydHR4XCJcbmltcG9ydCB7IEV4cG9ydFR4IH0gZnJvbSBcIi4vZXhwb3J0dHhcIlxuaW1wb3J0IHsgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxuaW1wb3J0IHsgQWRkTm9taW5hdG9yVHgsIEFkZFZhbGlkYXRvclR4IH0gZnJvbSBcIi4vdmFsaWRhdGlvbnR4XCJcbmltcG9ydCB7IENyZWF0ZUFsbHljaGFpblR4IH0gZnJvbSBcIi4vY3JlYXRlYWxseWNoYWludHhcIlxuaW1wb3J0IHsgVHJhbnNhY3Rpb25FcnJvciB9IGZyb20gXCIuLi8uLi91dGlscy9lcnJvcnNcIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuXG4vKipcbiAqIFRha2VzIGEgYnVmZmVyIHJlcHJlc2VudGluZyB0aGUgb3V0cHV0IGFuZCByZXR1cm5zIHRoZSBwcm9wZXIgW1tCYXNlVHhdXSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0gdHh0eXBlIFRoZSBpZCBvZiB0aGUgdHJhbnNhY3Rpb24gdHlwZVxuICpcbiAqIEByZXR1cm5zIEFuIGluc3RhbmNlIG9mIGFuIFtbQmFzZVR4XV0tZXh0ZW5kZWQgY2xhc3MuXG4gKi9cbmV4cG9ydCBjb25zdCBTZWxlY3RUeENsYXNzID0gKHR4dHlwZTogbnVtYmVyLCAuLi5hcmdzOiBhbnlbXSk6IEJhc2VUeCA9PiB7XG4gIGlmICh0eHR5cGUgPT09IFBsYXRmb3JtVk1Db25zdGFudHMuQkFTRVRYKSB7XG4gICAgcmV0dXJuIG5ldyBCYXNlVHgoLi4uYXJncylcbiAgfSBlbHNlIGlmICh0eHR5cGUgPT09IFBsYXRmb3JtVk1Db25zdGFudHMuSU1QT1JUVFgpIHtcbiAgICByZXR1cm4gbmV3IEltcG9ydFR4KC4uLmFyZ3MpXG4gIH0gZWxzZSBpZiAodHh0eXBlID09PSBQbGF0Zm9ybVZNQ29uc3RhbnRzLkVYUE9SVFRYKSB7XG4gICAgcmV0dXJuIG5ldyBFeHBvcnRUeCguLi5hcmdzKVxuICB9IGVsc2UgaWYgKHR4dHlwZSA9PT0gUGxhdGZvcm1WTUNvbnN0YW50cy5BREROT01JTkFUT1JUWCkge1xuICAgIHJldHVybiBuZXcgQWRkTm9taW5hdG9yVHgoLi4uYXJncylcbiAgfSBlbHNlIGlmICh0eHR5cGUgPT09IFBsYXRmb3JtVk1Db25zdGFudHMuQUREVkFMSURBVE9SVFgpIHtcbiAgICByZXR1cm4gbmV3IEFkZFZhbGlkYXRvclR4KC4uLmFyZ3MpXG4gIH0gZWxzZSBpZiAodHh0eXBlID09PSBQbGF0Zm9ybVZNQ29uc3RhbnRzLkNSRUFURVNVQk5FVFRYKSB7XG4gICAgcmV0dXJuIG5ldyBDcmVhdGVBbGx5Y2hhaW5UeCguLi5hcmdzKVxuICB9XG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIHRocm93IG5ldyBUcmFuc2FjdGlvbkVycm9yKFwiRXJyb3IgLSBTZWxlY3RUeENsYXNzOiB1bmtub3duIHR4dHlwZVwiKVxufVxuXG5leHBvcnQgY2xhc3MgVW5zaWduZWRUeCBleHRlbmRzIFN0YW5kYXJkVW5zaWduZWRUeDxLZXlQYWlyLCBLZXlDaGFpbiwgQmFzZVR4PiB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlVuc2lnbmVkVHhcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIC8vc2VyaWFsaXplIGlzIGluaGVyaXRlZFxuXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy50cmFuc2FjdGlvbiA9IFNlbGVjdFR4Q2xhc3MoZmllbGRzW1widHJhbnNhY3Rpb25cIl1bXCJfdHlwZUlEXCJdKVxuICAgIHRoaXMudHJhbnNhY3Rpb24uZGVzZXJpYWxpemUoZmllbGRzW1widHJhbnNhY3Rpb25cIl0sIGVuY29kaW5nKVxuICB9XG5cbiAgZ2V0VHJhbnNhY3Rpb24oKTogQmFzZVR4IHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2FjdGlvbiBhcyBCYXNlVHhcbiAgfVxuXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICB0aGlzLmNvZGVjSUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyKS5yZWFkVUludDE2QkUoMClcbiAgICBvZmZzZXQgKz0gMlxuICAgIGNvbnN0IHR4dHlwZTogbnVtYmVyID0gYmludG9vbHNcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgICAgLnJlYWRVSW50MzJCRSgwKVxuICAgIG9mZnNldCArPSA0XG4gICAgdGhpcy50cmFuc2FjdGlvbiA9IFNlbGVjdFR4Q2xhc3ModHh0eXBlKVxuICAgIHJldHVybiB0aGlzLnRyYW5zYWN0aW9uLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyB0aGlzIFtbVW5zaWduZWRUeF1dIGFuZCByZXR1cm5zIHNpZ25lZCBbW1N0YW5kYXJkVHhdXVxuICAgKlxuICAgKiBAcGFyYW0ga2MgQW4gW1tLZXlDaGFpbl1dIHVzZWQgaW4gc2lnbmluZ1xuICAgKlxuICAgKiBAcmV0dXJucyBBIHNpZ25lZCBbW1N0YW5kYXJkVHhdXVxuICAgKi9cbiAgc2lnbihrYzogS2V5Q2hhaW4pOiBUeCB7XG4gICAgY29uc3QgdHhidWZmID0gdGhpcy50b0J1ZmZlcigpXG4gICAgY29uc3QgbXNnOiBCdWZmZXIgPSBCdWZmZXIuZnJvbShcbiAgICAgIGNyZWF0ZUhhc2goXCJzaGEyNTZcIikudXBkYXRlKHR4YnVmZikuZGlnZXN0KClcbiAgICApXG4gICAgY29uc3QgY3JlZHM6IENyZWRlbnRpYWxbXSA9IHRoaXMudHJhbnNhY3Rpb24uc2lnbihtc2csIGtjKVxuICAgIHJldHVybiBuZXcgVHgodGhpcywgY3JlZHMpXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFR4IGV4dGVuZHMgU3RhbmRhcmRUeDxLZXlQYWlyLCBLZXlDaGFpbiwgVW5zaWduZWRUeD4ge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJUeFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXG5cbiAgLy9zZXJpYWxpemUgaXMgaW5oZXJpdGVkXG5cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLnVuc2lnbmVkVHggPSBuZXcgVW5zaWduZWRUeCgpXG4gICAgdGhpcy51bnNpZ25lZFR4LmRlc2VyaWFsaXplKGZpZWxkc1tcInVuc2lnbmVkVHhcIl0sIGVuY29kaW5nKVxuICAgIHRoaXMuY3JlZGVudGlhbHMgPSBbXVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBmaWVsZHNbXCJjcmVkZW50aWFsc1wiXS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgY3JlZDogQ3JlZGVudGlhbCA9IFNlbGVjdENyZWRlbnRpYWxDbGFzcyhcbiAgICAgICAgZmllbGRzW1wiY3JlZGVudGlhbHNcIl1bYCR7aX1gXVtcIl90eXBlSURcIl1cbiAgICAgIClcbiAgICAgIGNyZWQuZGVzZXJpYWxpemUoZmllbGRzW1wiY3JlZGVudGlhbHNcIl1bYCR7aX1gXSwgZW5jb2RpbmcpXG4gICAgICB0aGlzLmNyZWRlbnRpYWxzLnB1c2goY3JlZClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGFuIFtbVHhdXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBUeCBpbiBieXRlcy5cbiAgICpcbiAgICogQHBhcmFtIGJ5dGVzIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIHJhdyBbW1R4XV1cbiAgICogQHBhcmFtIG9mZnNldCBBIG51bWJlciByZXByZXNlbnRpbmcgdGhlIHN0YXJ0aW5nIHBvaW50IG9mIHRoZSBieXRlcyB0byBiZWdpbiBwYXJzaW5nXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsZW5ndGggb2YgdGhlIHJhdyBbW1R4XV1cbiAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICB0aGlzLnVuc2lnbmVkVHggPSBuZXcgVW5zaWduZWRUeCgpXG4gICAgb2Zmc2V0ID0gdGhpcy51bnNpZ25lZFR4LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICBjb25zdCBudW1jcmVkczogbnVtYmVyID0gYmludG9vbHNcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgICAgLnJlYWRVSW50MzJCRSgwKVxuICAgIG9mZnNldCArPSA0XG4gICAgdGhpcy5jcmVkZW50aWFscyA9IFtdXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IG51bWNyZWRzOyBpKyspIHtcbiAgICAgIGNvbnN0IGNyZWRpZDogbnVtYmVyID0gYmludG9vbHNcbiAgICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgICAgIC5yZWFkVUludDMyQkUoMClcbiAgICAgIG9mZnNldCArPSA0XG4gICAgICBjb25zdCBjcmVkOiBDcmVkZW50aWFsID0gU2VsZWN0Q3JlZGVudGlhbENsYXNzKGNyZWRpZClcbiAgICAgIG9mZnNldCA9IGNyZWQuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgICAgdGhpcy5jcmVkZW50aWFscy5wdXNoKGNyZWQpXG4gICAgfVxuICAgIHJldHVybiBvZmZzZXRcbiAgfVxufVxuIl19