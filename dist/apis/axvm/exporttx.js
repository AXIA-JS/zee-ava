"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportTx = void 0;
/**
 * @packageDocumentation
 * @module API-AXVM-ExportTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const outputs_1 = require("./outputs");
const basetx_1 = require("./basetx");
const constants_2 = require("../../utils/constants");
const bn_js_1 = __importDefault(require("bn.js"));
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
const cb58 = "cb58";
const buffer = "Buffer";
/**
 * Class representing an unsigned Export transaction.
 */
class ExportTx extends basetx_1.BaseTx {
    /**
     * Class representing an unsigned Export transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param destinationChain Optional chainid which identifies where the funds will sent to
     * @param exportOuts Array of [[TransferableOutputs]]s used in the transaction
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, destinationChain = undefined, exportOuts = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "ExportTx";
        this._codecID = constants_1.AXVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0 ? constants_1.AXVMConstants.EXPORTTX : constants_1.AXVMConstants.EXPORTTX_CODECONE;
        this.destinationChain = undefined;
        this.numOuts = buffer_1.Buffer.alloc(4);
        this.exportOuts = [];
        this.destinationChain = destinationChain; // no correction, if they don"t pass a chainid here, it will BOMB on toBuffer
        if (typeof exportOuts !== "undefined" && Array.isArray(exportOuts)) {
            for (let i = 0; i < exportOuts.length; i++) {
                if (!(exportOuts[`${i}`] instanceof outputs_1.TransferableOutput)) {
                    throw new errors_1.TransferableOutputError(`Error - ExportTx.constructor: invalid TransferableOutput in array parameter ${exportOuts}`);
                }
            }
            this.exportOuts = exportOuts;
        }
    }
    serialize(encoding = "hex") {
        const fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { destinationChain: serialization.encoder(this.destinationChain, encoding, buffer, cb58), exportOuts: this.exportOuts.map((e) => e.serialize(encoding)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.destinationChain = serialization.decoder(fields["destinationChain"], encoding, cb58, buffer, 32);
        this.exportOuts = fields["exportOuts"].map((e) => {
            let eo = new outputs_1.TransferableOutput();
            eo.deserialize(e, encoding);
            return eo;
        });
        this.numOuts = buffer_1.Buffer.alloc(4);
        this.numOuts.writeUInt32BE(this.exportOuts.length, 0);
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - ExportTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.AXVMConstants.EXPORTTX
                : constants_1.AXVMConstants.EXPORTTX_CODECONE;
    }
    /**
     * Returns the id of the [[ExportTx]]
     */
    getTxType() {
        return this._typeID;
    }
    /**
     * Returns an array of [[TransferableOutput]]s in this transaction.
     */
    getExportOutputs() {
        return this.exportOuts;
    }
    /**
     * Returns the totall exported amount as a {@link https://github.com/indutny/bn.js/|BN}.
     */
    getExportTotal() {
        let val = new bn_js_1.default(0);
        for (let i = 0; i < this.exportOuts.length; i++) {
            val = val.add(this.exportOuts[`${i}`].getOutput().getAmount());
        }
        return val;
    }
    getTotalOuts() {
        return [
            ...this.getOuts(),
            ...this.getExportOutputs()
        ];
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the destination chainid.
     */
    getDestinationChain() {
        return this.destinationChain;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[ExportTx]], parses it, populates the class, and returns the length of the [[ExportTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[ExportTx]]
     *
     * @returns The length of the raw [[ExportTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.destinationChain = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.numOuts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const numOuts = this.numOuts.readUInt32BE(0);
        for (let i = 0; i < numOuts; i++) {
            const anOut = new outputs_1.TransferableOutput();
            offset = anOut.fromBuffer(bytes, offset);
            this.exportOuts.push(anOut);
        }
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ExportTx]].
     */
    toBuffer() {
        if (typeof this.destinationChain === "undefined") {
            throw new errors_1.ChainIdError("ExportTx.toBuffer -- this.destinationChain is undefined");
        }
        this.numOuts.writeUInt32BE(this.exportOuts.length, 0);
        let barr = [super.toBuffer(), this.destinationChain, this.numOuts];
        this.exportOuts = this.exportOuts.sort(outputs_1.TransferableOutput.comparator());
        for (let i = 0; i < this.exportOuts.length; i++) {
            barr.push(this.exportOuts[`${i}`].toBuffer());
        }
        return buffer_1.Buffer.concat(barr);
    }
    clone() {
        let newbase = new ExportTx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new ExportTx(...args);
    }
}
exports.ExportTx = ExportTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0dHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9heHZtL2V4cG9ydHR4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxvRUFBMkM7QUFDM0MsMkNBQTJDO0FBQzNDLHVDQUE0RDtBQUU1RCxxQ0FBaUM7QUFDakMscURBQXdEO0FBQ3hELGtEQUFzQjtBQUN0Qiw2REFJa0M7QUFDbEMsK0NBSTJCO0FBRTNCOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNoRSxNQUFNLElBQUksR0FBbUIsTUFBTSxDQUFBO0FBQ25DLE1BQU0sTUFBTSxHQUFtQixRQUFRLENBQUE7QUFFdkM7O0dBRUc7QUFDSCxNQUFhLFFBQVMsU0FBUSxlQUFNO0lBMkpsQzs7Ozs7Ozs7OztPQVVHO0lBQ0gsWUFDRSxZQUFvQiw0QkFBZ0IsRUFDcEMsZUFBdUIsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQzNDLE9BQTZCLFNBQVMsRUFDdEMsTUFBMkIsU0FBUyxFQUNwQyxPQUFlLFNBQVMsRUFDeEIsbUJBQTJCLFNBQVMsRUFDcEMsYUFBbUMsU0FBUztRQUU1QyxLQUFLLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBOUt2QyxjQUFTLEdBQUcsVUFBVSxDQUFBO1FBQ3RCLGFBQVEsR0FBRyx5QkFBYSxDQUFDLFdBQVcsQ0FBQTtRQUNwQyxZQUFPLEdBQ2YsSUFBSSxDQUFDLFFBQVEsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLHlCQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyx5QkFBYSxDQUFDLGlCQUFpQixDQUFBO1FBbUN0RSxx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SUFBSSxDQUFDLENBQUE7SUFDNUIsQ0FBQztJQUVELEtBQUs7UUFDSCxJQUFJLE9BQU8sR0FBYSxJQUFJLFFBQVEsRUFBRSxDQUFBO1FBQ3RDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7UUFDbkMsT0FBTyxPQUFlLENBQUE7SUFDeEIsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFHLElBQVc7UUFDbkIsT0FBTyxJQUFJLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBUyxDQUFBO0lBQ3RDLENBQUM7Q0FtQ0Y7QUE1TEQsNEJBNExDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUFYVk0tRXhwb3J0VHhcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQgeyBBWFZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcbmltcG9ydCB7IFRyYW5zZmVyYWJsZU91dHB1dCwgQW1vdW50T3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVJbnB1dCB9IGZyb20gXCIuL2lucHV0c1wiXG5pbXBvcnQgeyBCYXNlVHggfSBmcm9tIFwiLi9iYXNldHhcIlxuaW1wb3J0IHsgRGVmYXVsdE5ldHdvcmtJRCB9IGZyb20gXCIuLi8uLi91dGlscy9jb25zdGFudHNcIlxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQge1xuICBTZXJpYWxpemF0aW9uLFxuICBTZXJpYWxpemVkRW5jb2RpbmcsXG4gIFNlcmlhbGl6ZWRUeXBlXG59IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcbmltcG9ydCB7XG4gIENvZGVjSWRFcnJvcixcbiAgQ2hhaW5JZEVycm9yLFxuICBUcmFuc2ZlcmFibGVPdXRwdXRFcnJvclxufSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcbmNvbnN0IHNlcmlhbGl6YXRpb246IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcbmNvbnN0IGNiNTg6IFNlcmlhbGl6ZWRUeXBlID0gXCJjYjU4XCJcbmNvbnN0IGJ1ZmZlcjogU2VyaWFsaXplZFR5cGUgPSBcIkJ1ZmZlclwiXG5cbi8qKlxuICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIEV4cG9ydCB0cmFuc2FjdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEV4cG9ydFR4IGV4dGVuZHMgQmFzZVR4IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiRXhwb3J0VHhcIlxuICBwcm90ZWN0ZWQgX2NvZGVjSUQgPSBBWFZNQ29uc3RhbnRzLkxBVEVTVENPREVDXG4gIHByb3RlY3RlZCBfdHlwZUlEID1cbiAgICB0aGlzLl9jb2RlY0lEID09PSAwID8gQVhWTUNvbnN0YW50cy5FWFBPUlRUWCA6IEFYVk1Db25zdGFudHMuRVhQT1JUVFhfQ09ERUNPTkVcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGNvbnN0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBkZXN0aW5hdGlvbkNoYWluOiBzZXJpYWxpemF0aW9uLmVuY29kZXIoXG4gICAgICAgIHRoaXMuZGVzdGluYXRpb25DaGFpbixcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIGJ1ZmZlcixcbiAgICAgICAgY2I1OFxuICAgICAgKSxcbiAgICAgIGV4cG9ydE91dHM6IHRoaXMuZXhwb3J0T3V0cy5tYXAoKGUpID0+IGUuc2VyaWFsaXplKGVuY29kaW5nKSlcbiAgICB9XG4gIH1cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLmRlc3RpbmF0aW9uQ2hhaW4gPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJkZXN0aW5hdGlvbkNoYWluXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBjYjU4LFxuICAgICAgYnVmZmVyLFxuICAgICAgMzJcbiAgICApXG4gICAgdGhpcy5leHBvcnRPdXRzID0gZmllbGRzW1wiZXhwb3J0T3V0c1wiXS5tYXAoXG4gICAgICAoZTogb2JqZWN0KTogVHJhbnNmZXJhYmxlT3V0cHV0ID0+IHtcbiAgICAgICAgbGV0IGVvOiBUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KClcbiAgICAgICAgZW8uZGVzZXJpYWxpemUoZSwgZW5jb2RpbmcpXG4gICAgICAgIHJldHVybiBlb1xuICAgICAgfVxuICAgIClcbiAgICB0aGlzLm51bU91dHMgPSBCdWZmZXIuYWxsb2MoNClcbiAgICB0aGlzLm51bU91dHMud3JpdGVVSW50MzJCRSh0aGlzLmV4cG9ydE91dHMubGVuZ3RoLCAwKVxuICB9XG5cbiAgcHJvdGVjdGVkIGRlc3RpbmF0aW9uQ2hhaW46IEJ1ZmZlciA9IHVuZGVmaW5lZFxuICBwcm90ZWN0ZWQgbnVtT3V0czogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gIHByb3RlY3RlZCBleHBvcnRPdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdXG5cbiAgLyoqXG4gICAqIFNldCB0aGUgY29kZWNJRFxuICAgKlxuICAgKiBAcGFyYW0gY29kZWNJRCBUaGUgY29kZWNJRCB0byBzZXRcbiAgICovXG4gIHNldENvZGVjSUQoY29kZWNJRDogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKGNvZGVjSUQgIT09IDAgJiYgY29kZWNJRCAhPT0gMSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBDb2RlY0lkRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBFeHBvcnRUeC5zZXRDb2RlY0lEOiBpbnZhbGlkIGNvZGVjSUQuIFZhbGlkIGNvZGVjSURzIGFyZSAwIGFuZCAxLlwiXG4gICAgICApXG4gICAgfVxuICAgIHRoaXMuX2NvZGVjSUQgPSBjb2RlY0lEXG4gICAgdGhpcy5fdHlwZUlEID1cbiAgICAgIHRoaXMuX2NvZGVjSUQgPT09IDBcbiAgICAgICAgPyBBWFZNQ29uc3RhbnRzLkVYUE9SVFRYXG4gICAgICAgIDogQVhWTUNvbnN0YW50cy5FWFBPUlRUWF9DT0RFQ09ORVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGlkIG9mIHRoZSBbW0V4cG9ydFR4XV1cbiAgICovXG4gIGdldFR4VHlwZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90eXBlSURcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zIGluIHRoaXMgdHJhbnNhY3Rpb24uXG4gICAqL1xuICBnZXRFeHBvcnRPdXRwdXRzKCk6IFRyYW5zZmVyYWJsZU91dHB1dFtdIHtcbiAgICByZXR1cm4gdGhpcy5leHBvcnRPdXRzXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdG90YWxsIGV4cG9ydGVkIGFtb3VudCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59LlxuICAgKi9cbiAgZ2V0RXhwb3J0VG90YWwoKTogQk4ge1xuICAgIGxldCB2YWw6IEJOID0gbmV3IEJOKDApXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHRoaXMuZXhwb3J0T3V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFsID0gdmFsLmFkZChcbiAgICAgICAgKHRoaXMuZXhwb3J0T3V0c1tgJHtpfWBdLmdldE91dHB1dCgpIGFzIEFtb3VudE91dHB1dCkuZ2V0QW1vdW50KClcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIHZhbFxuICB9XG5cbiAgZ2V0VG90YWxPdXRzKCk6IFRyYW5zZmVyYWJsZU91dHB1dFtdIHtcbiAgICByZXR1cm4gW1xuICAgICAgLi4uKHRoaXMuZ2V0T3V0cygpIGFzIFRyYW5zZmVyYWJsZU91dHB1dFtdKSxcbiAgICAgIC4uLnRoaXMuZ2V0RXhwb3J0T3V0cHV0cygpXG4gICAgXVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIGRlc3RpbmF0aW9uIGNoYWluaWQuXG4gICAqL1xuICBnZXREZXN0aW5hdGlvbkNoYWluKCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMuZGVzdGluYXRpb25DaGFpblxuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhbiBbW0V4cG9ydFR4XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgW1tFeHBvcnRUeF1dIGluIGJ5dGVzLlxuICAgKlxuICAgKiBAcGFyYW0gYnl0ZXMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGEgcmF3IFtbRXhwb3J0VHhdXVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tFeHBvcnRUeF1dXG4gICAqXG4gICAqIEByZW1hcmtzIGFzc3VtZSBub3QtY2hlY2tzdW1tZWRcbiAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgdGhpcy5kZXN0aW5hdGlvbkNoYWluID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXG4gICAgb2Zmc2V0ICs9IDMyXG4gICAgdGhpcy5udW1PdXRzID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICBvZmZzZXQgKz0gNFxuICAgIGNvbnN0IG51bU91dHM6IG51bWJlciA9IHRoaXMubnVtT3V0cy5yZWFkVUludDMyQkUoMClcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgbnVtT3V0czsgaSsrKSB7XG4gICAgICBjb25zdCBhbk91dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dCgpXG4gICAgICBvZmZzZXQgPSBhbk91dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgICB0aGlzLmV4cG9ydE91dHMucHVzaChhbk91dClcbiAgICB9XG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tFeHBvcnRUeF1dLlxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBpZiAodHlwZW9mIHRoaXMuZGVzdGluYXRpb25DaGFpbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhyb3cgbmV3IENoYWluSWRFcnJvcihcbiAgICAgICAgXCJFeHBvcnRUeC50b0J1ZmZlciAtLSB0aGlzLmRlc3RpbmF0aW9uQ2hhaW4gaXMgdW5kZWZpbmVkXCJcbiAgICAgIClcbiAgICB9XG4gICAgdGhpcy5udW1PdXRzLndyaXRlVUludDMyQkUodGhpcy5leHBvcnRPdXRzLmxlbmd0aCwgMClcbiAgICBsZXQgYmFycjogQnVmZmVyW10gPSBbc3VwZXIudG9CdWZmZXIoKSwgdGhpcy5kZXN0aW5hdGlvbkNoYWluLCB0aGlzLm51bU91dHNdXG4gICAgdGhpcy5leHBvcnRPdXRzID0gdGhpcy5leHBvcnRPdXRzLnNvcnQoVHJhbnNmZXJhYmxlT3V0cHV0LmNvbXBhcmF0b3IoKSlcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy5leHBvcnRPdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBiYXJyLnB1c2godGhpcy5leHBvcnRPdXRzW2Ake2l9YF0udG9CdWZmZXIoKSlcbiAgICB9XG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFycilcbiAgfVxuXG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGxldCBuZXdiYXNlOiBFeHBvcnRUeCA9IG5ldyBFeHBvcnRUeCgpXG4gICAgbmV3YmFzZS5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcbiAgICByZXR1cm4gbmV3YmFzZSBhcyB0aGlzXG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IEV4cG9ydFR4KC4uLmFyZ3MpIGFzIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgRXhwb3J0IHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE9wdGlvbmFsIG5ldHdvcmtJRCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBPcHRpb25hbCBibG9ja2NoYWluSUQsIGRlZmF1bHQgQnVmZmVyLmFsbG9jKDMyLCAxNilcbiAgICogQHBhcmFtIG91dHMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zXG4gICAqIEBwYXJhbSBpbnMgT3B0aW9uYWwgYXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXNcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBtZW1vIGZpZWxkXG4gICAqIEBwYXJhbSBkZXN0aW5hdGlvbkNoYWluIE9wdGlvbmFsIGNoYWluaWQgd2hpY2ggaWRlbnRpZmllcyB3aGVyZSB0aGUgZnVuZHMgd2lsbCBzZW50IHRvXG4gICAqIEBwYXJhbSBleHBvcnRPdXRzIEFycmF5IG9mIFtbVHJhbnNmZXJhYmxlT3V0cHV0c11dcyB1c2VkIGluIHRoZSB0cmFuc2FjdGlvblxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgbmV0d29ya0lEOiBudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELFxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNiksXG4gICAgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSB1bmRlZmluZWQsXG4gICAgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBkZXN0aW5hdGlvbkNoYWluOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgZXhwb3J0T3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSB1bmRlZmluZWRcbiAgKSB7XG4gICAgc3VwZXIobmV0d29ya0lELCBibG9ja2NoYWluSUQsIG91dHMsIGlucywgbWVtbylcbiAgICB0aGlzLmRlc3RpbmF0aW9uQ2hhaW4gPSBkZXN0aW5hdGlvbkNoYWluIC8vIG5vIGNvcnJlY3Rpb24sIGlmIHRoZXkgZG9uXCJ0IHBhc3MgYSBjaGFpbmlkIGhlcmUsIGl0IHdpbGwgQk9NQiBvbiB0b0J1ZmZlclxuICAgIGlmICh0eXBlb2YgZXhwb3J0T3V0cyAhPT0gXCJ1bmRlZmluZWRcIiAmJiBBcnJheS5pc0FycmF5KGV4cG9ydE91dHMpKSB7XG4gICAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgZXhwb3J0T3V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoIShleHBvcnRPdXRzW2Ake2l9YF0gaW5zdGFuY2VvZiBUcmFuc2ZlcmFibGVPdXRwdXQpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFRyYW5zZmVyYWJsZU91dHB1dEVycm9yKFxuICAgICAgICAgICAgYEVycm9yIC0gRXhwb3J0VHguY29uc3RydWN0b3I6IGludmFsaWQgVHJhbnNmZXJhYmxlT3V0cHV0IGluIGFycmF5IHBhcmFtZXRlciAke2V4cG9ydE91dHN9YFxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5leHBvcnRPdXRzID0gZXhwb3J0T3V0c1xuICAgIH1cbiAgfVxufVxuIl19