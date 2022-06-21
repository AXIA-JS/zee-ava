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
        this._typeID = constants_1.PlatformVMConstants.CREATESUBNETTX;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlYWxseWNoYWludHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9wbGF0Zm9ybXZtL2NyZWF0ZWFsbHljaGFpbnR4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxxQ0FBaUM7QUFDakMsMkNBQWlEO0FBQ2pELHFEQUF3RDtBQUN4RCx1Q0FBK0Q7QUFHL0QsK0NBQXdEO0FBRXhELE1BQWEsaUJBQWtCLFNBQVEsZUFBTTtJQXlFM0M7Ozs7Ozs7OztPQVNHO0lBQ0gsWUFDRSxZQUFvQiw0QkFBZ0IsRUFDcEMsZUFBdUIsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQzNDLE9BQTZCLFNBQVMsRUFDdEMsTUFBMkIsU0FBUyxFQUNwQyxPQUFlLFNBQVMsRUFDeEIsa0JBQW1DLFNBQVM7UUFFNUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQTFGdkMsY0FBUyxHQUFHLG1CQUFtQixDQUFBO1FBQy9CLFlBQU8sR0FBRywrQkFBbUIsQ0FBQyxjQUFjLENBQUE7UUFlNUMsb0JBQWUsR0FBb0IsU0FBUyxDQUFBO1FBMkVwRCxJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQTtJQUN4QyxDQUFDO0lBekZELFNBQVMsQ0FBQyxXQUErQixLQUFLO1FBQzVDLElBQUksTUFBTSxHQUFXLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDOUMsdUNBQ0ssTUFBTSxLQUNULGVBQWUsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFDMUQ7SUFDSCxDQUFDO0lBQ0QsV0FBVyxDQUFDLE1BQWMsRUFBRSxXQUErQixLQUFLO1FBQzlELEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ25DLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSx5QkFBZSxFQUFFLENBQUE7UUFDNUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDdkUsQ0FBQztJQUlEOztPQUVHO0lBQ0gsU0FBUztRQUNQLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQTtJQUNyQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxrQkFBa0I7UUFDaEIsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFBO0lBQzdCLENBQUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSCxVQUFVLENBQUMsS0FBYSxFQUFFLFNBQWlCLENBQUM7UUFDMUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ3hDLE1BQU0sSUFBSSxDQUFDLENBQUE7UUFDWCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUkseUJBQWUsRUFBRSxDQUFBO1FBQzVDLE1BQU0sR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDdkQsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDO0lBRUQ7O09BRUc7SUFDSCxRQUFRO1FBQ04sSUFDRSxPQUFPLElBQUksQ0FBQyxlQUFlLEtBQUssV0FBVztZQUMzQyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsWUFBWSx5QkFBZSxDQUFDLEVBQ2xEO1lBQ0EsTUFBTSxJQUFJLDRCQUFtQixDQUMzQiw2RUFBNkUsQ0FDOUUsQ0FBQTtTQUNGO1FBQ0QsSUFBSSxNQUFNLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNwQyxNQUFNLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDM0QsSUFBSSxJQUFJLEdBQWE7WUFDbkIsS0FBSyxDQUFDLFFBQVEsRUFBRTtZQUNoQixNQUFNO1lBQ04sSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUU7U0FDaEMsQ0FBQTtRQUNELE9BQU8sZUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUM1QixDQUFDO0NBdUJGO0FBOUZELDhDQThGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1QbGF0Zm9ybVZNLUNyZWF0ZUFsbHljaGFpblR4XG4gKi9cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcbmltcG9ydCB7IEJhc2VUeCB9IGZyb20gXCIuL2Jhc2V0eFwiXG5pbXBvcnQgeyBQbGF0Zm9ybVZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcbmltcG9ydCB7IERlZmF1bHROZXR3b3JrSUQgfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcbmltcG9ydCB7IFRyYW5zZmVyYWJsZU91dHB1dCwgU0VDUE93bmVyT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVJbnB1dCB9IGZyb20gXCIuL2lucHV0c1wiXG5pbXBvcnQgeyBTZXJpYWxpemVkRW5jb2RpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXG5pbXBvcnQgeyBBbGx5Y2hhaW5Pd25lckVycm9yIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXG5cbmV4cG9ydCBjbGFzcyBDcmVhdGVBbGx5Y2hhaW5UeCBleHRlbmRzIEJhc2VUeCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIkNyZWF0ZUFsbHljaGFpblR4XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSBQbGF0Zm9ybVZNQ29uc3RhbnRzLkNSRUFURVNVQk5FVFRYXG5cbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcbiAgICBsZXQgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIGFsbHljaGFpbk93bmVyczogdGhpcy5hbGx5Y2hhaW5Pd25lcnMuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMuYWxseWNoYWluT3duZXJzID0gbmV3IFNFQ1BPd25lck91dHB1dCgpXG4gICAgdGhpcy5hbGx5Y2hhaW5Pd25lcnMuZGVzZXJpYWxpemUoZmllbGRzW1wiYWxseWNoYWluT3duZXJzXCJdLCBlbmNvZGluZylcbiAgfVxuXG4gIHByb3RlY3RlZCBhbGx5Y2hhaW5Pd25lcnM6IFNFQ1BPd25lck91dHB1dCA9IHVuZGVmaW5lZFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpZCBvZiB0aGUgW1tDcmVhdGVBbGx5Y2hhaW5UeF1dXG4gICAqL1xuICBnZXRUeFR5cGUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgcmV3YXJkIGFkZHJlc3MuXG4gICAqL1xuICBnZXRBbGx5Y2hhaW5Pd25lcnMoKTogU0VDUE93bmVyT3V0cHV0IHtcbiAgICByZXR1cm4gdGhpcy5hbGx5Y2hhaW5Pd25lcnNcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYW4gW1tDcmVhdGVBbGx5Y2hhaW5UeF1dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFtbQ3JlYXRlQWxseWNoYWluVHhdXSBpbiBieXRlcy5cbiAgICpcbiAgICogQHBhcmFtIGJ5dGVzIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIHJhdyBbW0NyZWF0ZUFsbHljaGFpblR4XV1cbiAgICogQHBhcmFtIG9mZnNldCBBIG51bWJlciBmb3IgdGhlIHN0YXJ0aW5nIHBvc2l0aW9uIGluIHRoZSBieXRlcy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgcmF3IFtbQ3JlYXRlQWxseWNoYWluVHhdXVxuICAgKlxuICAgKiBAcmVtYXJrcyBhc3N1bWUgbm90LWNoZWNrc3VtbWVkXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgIG9mZnNldCArPSA0XG4gICAgdGhpcy5hbGx5Y2hhaW5Pd25lcnMgPSBuZXcgU0VDUE93bmVyT3V0cHV0KClcbiAgICBvZmZzZXQgPSB0aGlzLmFsbHljaGFpbk93bmVycy5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tDcmVhdGVBbGx5Y2hhaW5UeF1dLlxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBpZiAoXG4gICAgICB0eXBlb2YgdGhpcy5hbGx5Y2hhaW5Pd25lcnMgPT09IFwidW5kZWZpbmVkXCIgfHxcbiAgICAgICEodGhpcy5hbGx5Y2hhaW5Pd25lcnMgaW5zdGFuY2VvZiBTRUNQT3duZXJPdXRwdXQpXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgQWxseWNoYWluT3duZXJFcnJvcihcbiAgICAgICAgXCJDcmVhdGVBbGx5Y2hhaW5UeC50b0J1ZmZlciAtLSB0aGlzLmFsbHljaGFpbk93bmVycyBpcyBub3QgYSBTRUNQT3duZXJPdXRwdXRcIlxuICAgICAgKVxuICAgIH1cbiAgICBsZXQgdHlwZUlEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICB0eXBlSUQud3JpdGVVSW50MzJCRSh0aGlzLmFsbHljaGFpbk93bmVycy5nZXRPdXRwdXRJRCgpLCAwKVxuICAgIGxldCBiYXJyOiBCdWZmZXJbXSA9IFtcbiAgICAgIHN1cGVyLnRvQnVmZmVyKCksXG4gICAgICB0eXBlSUQsXG4gICAgICB0aGlzLmFsbHljaGFpbk93bmVycy50b0J1ZmZlcigpXG4gICAgXVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIpXG4gIH1cblxuICAvKipcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIENyZWF0ZSBBbGx5Y2hhaW4gdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwgbmV0d29ya0lELCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIE9wdGlvbmFsIGJsb2NrY2hhaW5JRCwgZGVmYXVsdCBCdWZmZXIuYWxsb2MoMzIsIDE2KVxuICAgKiBAcGFyYW0gb3V0cyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXNcbiAgICogQHBhcmFtIGlucyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIG1lbW8gZmllbGRcbiAgICogQHBhcmFtIGFsbHljaGFpbk93bmVycyBPcHRpb25hbCBbW1NFQ1BPd25lck91dHB1dF1dIGNsYXNzIGZvciBzcGVjaWZ5aW5nIHdobyBvd25zIHRoZSBhbGx5Y2hhaW4uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIsIDE2KSxcbiAgICBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IHVuZGVmaW5lZCxcbiAgICBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFsbHljaGFpbk93bmVyczogU0VDUE93bmVyT3V0cHV0ID0gdW5kZWZpbmVkXG4gICkge1xuICAgIHN1cGVyKG5ldHdvcmtJRCwgYmxvY2tjaGFpbklELCBvdXRzLCBpbnMsIG1lbW8pXG4gICAgdGhpcy5hbGx5Y2hhaW5Pd25lcnMgPSBhbGx5Y2hhaW5Pd25lcnNcbiAgfVxufVxuIl19