"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAllychainTx = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-CreateAllychainTx
 */
const buffer_1 = require("buffer/");
const basetx_1 = require("./basetx");
const constants_1 = require("./constants");
const constants_2 = require("../../utils/constants");
const outputs_1 = require("./outputs");
const errors_1 = require("../../utils/errors");
class CreateAllychainTx extends basetx_1.BaseTx {
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
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, allychainOwners = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "CreateAllychainTx";
        this._typeID = constants_1.PlatformVMConstants.CREATEALLYCHAINTX;
        this.allychainOwners = undefined;
        this.allychainOwners = allychainOwners;
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { allychainOwners: this.allychainOwners.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.allychainOwners = new outputs_1.SECPOwnerOutput();
        this.allychainOwners.deserialize(fields["allychainOwners"], encoding);
    }
    /**
     * Returns the id of the [[CreateAllychainTx]]
     */
    getTxType() {
        return this._typeID;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the reward address.
     */
    getAllychainOwners() {
        return this.allychainOwners;
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
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        offset += 4;
        this.allychainOwners = new outputs_1.SECPOwnerOutput();
        offset = this.allychainOwners.fromBuffer(bytes, offset);
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateAllychainTx]].
     */
    toBuffer() {
        if (typeof this.allychainOwners === "undefined" ||
            !(this.allychainOwners instanceof outputs_1.SECPOwnerOutput)) {
            throw new errors_1.AllychainOwnerError("CreateAllychainTx.toBuffer -- this.allychainOwners is not a SECPOwnerOutput");
        }
        let typeID = buffer_1.Buffer.alloc(4);
        typeID.writeUInt32BE(this.allychainOwners.getOutputID(), 0);
        let barr = [
            super.toBuffer(),
            typeID,
            this.allychainOwners.toBuffer()
        ];
        return buffer_1.Buffer.concat(barr);
    }
}
exports.CreateAllychainTx = CreateAllychainTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlYWxseWNoYWludHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9wbGF0Zm9ybXZtL2NyZWF0ZWFsbHljaGFpbnR4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxxQ0FBaUM7QUFDakMsMkNBQWlEO0FBQ2pELHFEQUF3RDtBQUN4RCx1Q0FBK0Q7QUFHL0QsK0NBQXdEO0FBRXhELE1BQWEsaUJBQWtCLFNBQVEsZUFBTTtJQXlFM0M7Ozs7Ozs7OztPQVNHO0lBQ0gsWUFDRSxZQUFvQiw0QkFBZ0IsRUFDcEMsZUFBdUIsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQzNDLE9BQTZCLFNBQVMsRUFDdEMsTUFBMkIsU0FBUyxFQUNwQyxPQUFlLFNBQVMsRUFDeEIsa0JBQW1DLFNBQVM7UUFFNUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQTFGdkMsY0FBUyxHQUFHLG1CQUFtQixDQUFBO1FBQy9CLFlBQU8sR0FBRywrQkFBbUIsQ0FBQyxpQkFBaUIsQ0FBQTtRQWUvQyxvQkFBZSxHQUFvQixTQUFTLENBQUE7UUEyRXBELElBQUksQ0FBQyxlQUFlLEdBQUcsZUFBZSxDQUFBO0lBQ3hDLENBQUM7SUF6RkQsU0FBUyxDQUFDLFdBQStCLEtBQUs7UUFDNUMsSUFBSSxNQUFNLEdBQVcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUM5Qyx1Q0FDSyxNQUFNLEtBQ1QsZUFBZSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUMxRDtJQUNILENBQUM7SUFDRCxXQUFXLENBQUMsTUFBYyxFQUFFLFdBQStCLEtBQUs7UUFDOUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDbkMsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLHlCQUFlLEVBQUUsQ0FBQTtRQUM1QyxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUN2RSxDQUFDO0lBSUQ7O09BRUc7SUFDSCxTQUFTO1FBQ1AsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFBO0lBQ3JCLENBQUM7SUFFRDs7T0FFRztJQUNILGtCQUFrQjtRQUNoQixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUE7SUFDN0IsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNILFVBQVUsQ0FBQyxLQUFhLEVBQUUsU0FBaUIsQ0FBQztRQUMxQyxNQUFNLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDeEMsTUFBTSxJQUFJLENBQUMsQ0FBQTtRQUNYLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSx5QkFBZSxFQUFFLENBQUE7UUFDNUMsTUFBTSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUN2RCxPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUM7SUFFRDs7T0FFRztJQUNILFFBQVE7UUFDTixJQUNFLE9BQU8sSUFBSSxDQUFDLGVBQWUsS0FBSyxXQUFXO1lBQzNDLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxZQUFZLHlCQUFlLENBQUMsRUFDbEQ7WUFDQSxNQUFNLElBQUksNEJBQW1CLENBQzNCLDZFQUE2RSxDQUM5RSxDQUFBO1NBQ0Y7UUFDRCxJQUFJLE1BQU0sR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3BDLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUMzRCxJQUFJLElBQUksR0FBYTtZQUNuQixLQUFLLENBQUMsUUFBUSxFQUFFO1lBQ2hCLE1BQU07WUFDTixJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRTtTQUNoQyxDQUFBO1FBQ0QsT0FBTyxlQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQzVCLENBQUM7Q0F1QkY7QUE5RkQsOENBOEZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLVBsYXRmb3JtVk0tQ3JlYXRlQWxseWNoYWluVHhcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IHsgQmFzZVR4IH0gZnJvbSBcIi4vYmFzZXR4XCJcbmltcG9ydCB7IFBsYXRmb3JtVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHsgRGVmYXVsdE5ldHdvcmtJRCB9IGZyb20gXCIuLi8uLi91dGlscy9jb25zdGFudHNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0LCBTRUNQT3duZXJPdXRwdXQgfSBmcm9tIFwiLi9vdXRwdXRzXCJcbmltcG9ydCB7IFRyYW5zZmVyYWJsZUlucHV0IH0gZnJvbSBcIi4vaW5wdXRzXCJcbmltcG9ydCB7IFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcbmltcG9ydCB7IEFsbHljaGFpbk93bmVyRXJyb3IgfSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcblxuZXhwb3J0IGNsYXNzIENyZWF0ZUFsbHljaGFpblR4IGV4dGVuZHMgQmFzZVR4IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiQ3JlYXRlQWxseWNoYWluVHhcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IFBsYXRmb3JtVk1Db25zdGFudHMuQ1JFQVRFQUxMWUNIQUlOVFhcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgYWxseWNoYWluT3duZXJzOiB0aGlzLmFsbHljaGFpbk93bmVycy5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgfVxuICB9XG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy5hbGx5Y2hhaW5Pd25lcnMgPSBuZXcgU0VDUE93bmVyT3V0cHV0KClcbiAgICB0aGlzLmFsbHljaGFpbk93bmVycy5kZXNlcmlhbGl6ZShmaWVsZHNbXCJhbGx5Y2hhaW5Pd25lcnNcIl0sIGVuY29kaW5nKVxuICB9XG5cbiAgcHJvdGVjdGVkIGFsbHljaGFpbk93bmVyczogU0VDUE93bmVyT3V0cHV0ID0gdW5kZWZpbmVkXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGlkIG9mIHRoZSBbW0NyZWF0ZUFsbHljaGFpblR4XV1cbiAgICovXG4gIGdldFR4VHlwZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90eXBlSURcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSByZXdhcmQgYWRkcmVzcy5cbiAgICovXG4gIGdldEFsbHljaGFpbk93bmVycygpOiBTRUNQT3duZXJPdXRwdXQge1xuICAgIHJldHVybiB0aGlzLmFsbHljaGFpbk93bmVyc1xuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhbiBbW0NyZWF0ZUFsbHljaGFpblR4XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgW1tDcmVhdGVBbGx5Y2hhaW5UeF1dIGluIGJ5dGVzLlxuICAgKlxuICAgKiBAcGFyYW0gYnl0ZXMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGEgcmF3IFtbQ3JlYXRlQWxseWNoYWluVHhdXVxuICAgKiBAcGFyYW0gb2Zmc2V0IEEgbnVtYmVyIGZvciB0aGUgc3RhcnRpbmcgcG9zaXRpb24gaW4gdGhlIGJ5dGVzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tDcmVhdGVBbGx5Y2hhaW5UeF1dXG4gICAqXG4gICAqIEByZW1hcmtzIGFzc3VtZSBub3QtY2hlY2tzdW1tZWRcbiAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgb2Zmc2V0ICs9IDRcbiAgICB0aGlzLmFsbHljaGFpbk93bmVycyA9IG5ldyBTRUNQT3duZXJPdXRwdXQoKVxuICAgIG9mZnNldCA9IHRoaXMuYWxseWNoYWluT3duZXJzLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICByZXR1cm4gb2Zmc2V0XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW0NyZWF0ZUFsbHljaGFpblR4XV0uXG4gICAqL1xuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xuICAgIGlmIChcbiAgICAgIHR5cGVvZiB0aGlzLmFsbHljaGFpbk93bmVycyA9PT0gXCJ1bmRlZmluZWRcIiB8fFxuICAgICAgISh0aGlzLmFsbHljaGFpbk93bmVycyBpbnN0YW5jZW9mIFNFQ1BPd25lck91dHB1dClcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBBbGx5Y2hhaW5Pd25lckVycm9yKFxuICAgICAgICBcIkNyZWF0ZUFsbHljaGFpblR4LnRvQnVmZmVyIC0tIHRoaXMuYWxseWNoYWluT3duZXJzIGlzIG5vdCBhIFNFQ1BPd25lck91dHB1dFwiXG4gICAgICApXG4gICAgfVxuICAgIGxldCB0eXBlSUQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIHR5cGVJRC53cml0ZVVJbnQzMkJFKHRoaXMuYWxseWNoYWluT3duZXJzLmdldE91dHB1dElEKCksIDApXG4gICAgbGV0IGJhcnI6IEJ1ZmZlcltdID0gW1xuICAgICAgc3VwZXIudG9CdWZmZXIoKSxcbiAgICAgIHR5cGVJRCxcbiAgICAgIHRoaXMuYWxseWNoYWluT3duZXJzLnRvQnVmZmVyKClcbiAgICBdXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFycilcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgQ3JlYXRlIEFsbHljaGFpbiB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBPcHRpb25hbCBuZXR3b3JrSUQsIFtbRGVmYXVsdE5ldHdvcmtJRF1dXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgT3B0aW9uYWwgYmxvY2tjaGFpbklELCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXG4gICAqIEBwYXJhbSBvdXRzIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZU91dHB1dF1dc1xuICAgKiBAcGFyYW0gaW5zIE9wdGlvbmFsIGFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZUlucHV0XV1zXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgbWVtbyBmaWVsZFxuICAgKiBAcGFyYW0gYWxseWNoYWluT3duZXJzIE9wdGlvbmFsIFtbU0VDUE93bmVyT3V0cHV0XV0gY2xhc3MgZm9yIHNwZWNpZnlpbmcgd2hvIG93bnMgdGhlIGFsbHljaGFpbi5cbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMiwgMTYpLFxuICAgIG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gdW5kZWZpbmVkLFxuICAgIGluczogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYWxseWNoYWluT3duZXJzOiBTRUNQT3duZXJPdXRwdXQgPSB1bmRlZmluZWRcbiAgKSB7XG4gICAgc3VwZXIobmV0d29ya0lELCBibG9ja2NoYWluSUQsIG91dHMsIGlucywgbWVtbylcbiAgICB0aGlzLmFsbHljaGFpbk93bmVycyA9IGFsbHljaGFpbk93bmVyc1xuICB9XG59XG4iXX0=