"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportTx = void 0;
/**
 * @packageDocumentation
 * @module API-AVM-ExportTx
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
        this._codecID = constants_1.AVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.AVMConstants.EXPORTTX
            : constants_1.AVMConstants.EXPORTTX_CODECONE;
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
                ? constants_1.AVMConstants.EXPORTTX
                : constants_1.AVMConstants.EXPORTTX_CODECONE;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwb3J0dHguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9hdm0vZXhwb3J0dHgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWdDO0FBQ2hDLG9FQUEyQztBQUMzQywyQ0FBMEM7QUFDMUMsdUNBQTREO0FBRTVELHFDQUFpQztBQUNqQyxxREFBd0Q7QUFDeEQsa0RBQXNCO0FBQ3RCLDZEQUlrQztBQUNsQywrQ0FJMkI7QUFFM0I7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2hFLE1BQU0sSUFBSSxHQUFtQixNQUFNLENBQUE7QUFDbkMsTUFBTSxNQUFNLEdBQW1CLFFBQVEsQ0FBQTtBQUV2Qzs7R0FFRztBQUNILE1BQWEsUUFBUyxTQUFRLGVBQU07SUE2SmxDOzs7Ozs7Ozs7O09BVUc7SUFDSCxZQUNFLFlBQW9CLDRCQUFnQixFQUNwQyxlQUF1QixlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFDM0MsT0FBNkIsU0FBUyxFQUN0QyxNQUEyQixTQUFTLEVBQ3BDLE9BQWUsU0FBUyxFQUN4QixtQkFBMkIsU0FBUyxFQUNwQyxhQUFtQyxTQUFTO1FBRTVDLEtBQUssQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFoTHZDLGNBQVMsR0FBRyxVQUFVLENBQUE7UUFDdEIsYUFBUSxHQUFHLHdCQUFZLENBQUMsV0FBVyxDQUFBO1FBQ25DLFlBQU8sR0FDZixJQUFJLENBQUMsUUFBUSxLQUFLLENBQUM7WUFDakIsQ0FBQyxDQUFDLHdCQUFZLENBQUMsUUFBUTtZQUN2QixDQUFDLENBQUMsd0JBQVksQ0FBQyxpQkFBaUIsQ0FBQTtRQW1DMUIs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LElBQUksQ0FBQyxDQUFBO0lBQzVCLENBQUM7SUFFRCxLQUFLO1FBQ0gsSUFBSSxPQUFPLEdBQWEsSUFBSSxRQUFRLEVBQUUsQ0FBQTtRQUN0QyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1FBQ25DLE9BQU8sT0FBZSxDQUFBO0lBQ3hCLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBRyxJQUFXO1FBQ25CLE9BQU8sSUFBSSxRQUFRLENBQUMsR0FBRyxJQUFJLENBQVMsQ0FBQTtJQUN0QyxDQUFDO0NBbUNGO0FBOUxELDRCQThMQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1BVk0tRXhwb3J0VHhcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQgeyBBVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0LCBBbW91bnRPdXRwdXQgfSBmcm9tIFwiLi9vdXRwdXRzXCJcbmltcG9ydCB7IFRyYW5zZmVyYWJsZUlucHV0IH0gZnJvbSBcIi4vaW5wdXRzXCJcbmltcG9ydCB7IEJhc2VUeCB9IGZyb20gXCIuL2Jhc2V0eFwiXG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lEIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2NvbnN0YW50c1wiXG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCJcbmltcG9ydCB7XG4gIFNlcmlhbGl6YXRpb24sXG4gIFNlcmlhbGl6ZWRFbmNvZGluZyxcbiAgU2VyaWFsaXplZFR5cGVcbn0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxuaW1wb3J0IHtcbiAgQ29kZWNJZEVycm9yLFxuICBDaGFpbklkRXJyb3IsXG4gIFRyYW5zZmVyYWJsZU91dHB1dEVycm9yXG59IGZyb20gXCIuLi8uLi91dGlscy9lcnJvcnNcIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuY29uc3QgY2I1ODogU2VyaWFsaXplZFR5cGUgPSBcImNiNThcIlxuY29uc3QgYnVmZmVyOiBTZXJpYWxpemVkVHlwZSA9IFwiQnVmZmVyXCJcblxuLyoqXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgRXhwb3J0IHRyYW5zYWN0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgRXhwb3J0VHggZXh0ZW5kcyBCYXNlVHgge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJFeHBvcnRUeFwiXG4gIHByb3RlY3RlZCBfY29kZWNJRCA9IEFWTUNvbnN0YW50cy5MQVRFU1RDT0RFQ1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9XG4gICAgdGhpcy5fY29kZWNJRCA9PT0gMFxuICAgICAgPyBBVk1Db25zdGFudHMuRVhQT1JUVFhcbiAgICAgIDogQVZNQ29uc3RhbnRzLkVYUE9SVFRYX0NPREVDT05FXG5cbiAgc2VyaWFsaXplKGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKTogb2JqZWN0IHtcbiAgICBjb25zdCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgZGVzdGluYXRpb25DaGFpbjogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uQ2hhaW4sXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBidWZmZXIsXG4gICAgICAgIGNiNThcbiAgICAgICksXG4gICAgICBleHBvcnRPdXRzOiB0aGlzLmV4cG9ydE91dHMubWFwKChlKSA9PiBlLnNlcmlhbGl6ZShlbmNvZGluZykpXG4gICAgfVxuICB9XG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy5kZXN0aW5hdGlvbkNoYWluID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wiZGVzdGluYXRpb25DaGFpblwiXSxcbiAgICAgIGVuY29kaW5nLFxuICAgICAgY2I1OCxcbiAgICAgIGJ1ZmZlcixcbiAgICAgIDMyXG4gICAgKVxuICAgIHRoaXMuZXhwb3J0T3V0cyA9IGZpZWxkc1tcImV4cG9ydE91dHNcIl0ubWFwKFxuICAgICAgKGU6IG9iamVjdCk6IFRyYW5zZmVyYWJsZU91dHB1dCA9PiB7XG4gICAgICAgIGxldCBlbzogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dCgpXG4gICAgICAgIGVvLmRlc2VyaWFsaXplKGUsIGVuY29kaW5nKVxuICAgICAgICByZXR1cm4gZW9cbiAgICAgIH1cbiAgICApXG4gICAgdGhpcy5udW1PdXRzID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgdGhpcy5udW1PdXRzLndyaXRlVUludDMyQkUodGhpcy5leHBvcnRPdXRzLmxlbmd0aCwgMClcbiAgfVxuXG4gIHByb3RlY3RlZCBkZXN0aW5hdGlvbkNoYWluOiBCdWZmZXIgPSB1bmRlZmluZWRcbiAgcHJvdGVjdGVkIG51bU91dHM6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICBwcm90ZWN0ZWQgZXhwb3J0T3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvZGVjSURcbiAgICpcbiAgICogQHBhcmFtIGNvZGVjSUQgVGhlIGNvZGVjSUQgdG8gc2V0XG4gICAqL1xuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChjb2RlY0lEICE9PSAwICYmIGNvZGVjSUQgIT09IDEpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgQ29kZWNJZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gRXhwb3J0VHguc2V0Q29kZWNJRDogaW52YWxpZCBjb2RlY0lELiBWYWxpZCBjb2RlY0lEcyBhcmUgMCBhbmQgMS5cIlxuICAgICAgKVxuICAgIH1cbiAgICB0aGlzLl9jb2RlY0lEID0gY29kZWNJRFxuICAgIHRoaXMuX3R5cGVJRCA9XG4gICAgICB0aGlzLl9jb2RlY0lEID09PSAwXG4gICAgICAgID8gQVZNQ29uc3RhbnRzLkVYUE9SVFRYXG4gICAgICAgIDogQVZNQ29uc3RhbnRzLkVYUE9SVFRYX0NPREVDT05FXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaWQgb2YgdGhlIFtbRXhwb3J0VHhdXVxuICAgKi9cbiAgZ2V0VHhUeXBlKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGVJRFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMgaW4gdGhpcyB0cmFuc2FjdGlvbi5cbiAgICovXG4gIGdldEV4cG9ydE91dHB1dHMoKTogVHJhbnNmZXJhYmxlT3V0cHV0W10ge1xuICAgIHJldHVybiB0aGlzLmV4cG9ydE91dHNcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB0b3RhbGwgZXhwb3J0ZWQgYW1vdW50IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uXG4gICAqL1xuICBnZXRFeHBvcnRUb3RhbCgpOiBCTiB7XG4gICAgbGV0IHZhbDogQk4gPSBuZXcgQk4oMClcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgdGhpcy5leHBvcnRPdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YWwgPSB2YWwuYWRkKFxuICAgICAgICAodGhpcy5leHBvcnRPdXRzW2Ake2l9YF0uZ2V0T3V0cHV0KCkgYXMgQW1vdW50T3V0cHV0KS5nZXRBbW91bnQoKVxuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gdmFsXG4gIH1cblxuICBnZXRUb3RhbE91dHMoKTogVHJhbnNmZXJhYmxlT3V0cHV0W10ge1xuICAgIHJldHVybiBbXG4gICAgICAuLi4odGhpcy5nZXRPdXRzKCkgYXMgVHJhbnNmZXJhYmxlT3V0cHV0W10pLFxuICAgICAgLi4udGhpcy5nZXRFeHBvcnRPdXRwdXRzKClcbiAgICBdXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgZGVzdGluYXRpb24gY2hhaW5pZC5cbiAgICovXG4gIGdldERlc3RpbmF0aW9uQ2hhaW4oKTogQnVmZmVyIHtcbiAgICByZXR1cm4gdGhpcy5kZXN0aW5hdGlvbkNoYWluXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGFuIFtbRXhwb3J0VHhdXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBbW0V4cG9ydFR4XV0gaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tFeHBvcnRUeF1dXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsZW5ndGggb2YgdGhlIHJhdyBbW0V4cG9ydFR4XV1cbiAgICpcbiAgICogQHJlbWFya3MgYXNzdW1lIG5vdC1jaGVja3N1bW1lZFxuICAgKi9cbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xuICAgIG9mZnNldCA9IHN1cGVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICB0aGlzLmRlc3RpbmF0aW9uQ2hhaW4gPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMilcbiAgICBvZmZzZXQgKz0gMzJcbiAgICB0aGlzLm51bU91dHMgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgIG9mZnNldCArPSA0XG4gICAgY29uc3QgbnVtT3V0czogbnVtYmVyID0gdGhpcy5udW1PdXRzLnJlYWRVSW50MzJCRSgwKVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBudW1PdXRzOyBpKyspIHtcbiAgICAgIGNvbnN0IGFuT3V0OiBUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KClcbiAgICAgIG9mZnNldCA9IGFuT3V0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICAgIHRoaXMuZXhwb3J0T3V0cy5wdXNoKGFuT3V0KVxuICAgIH1cbiAgICByZXR1cm4gb2Zmc2V0XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW0V4cG9ydFR4XV0uXG4gICAqL1xuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xuICAgIGlmICh0eXBlb2YgdGhpcy5kZXN0aW5hdGlvbkNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aHJvdyBuZXcgQ2hhaW5JZEVycm9yKFxuICAgICAgICBcIkV4cG9ydFR4LnRvQnVmZmVyIC0tIHRoaXMuZGVzdGluYXRpb25DaGFpbiBpcyB1bmRlZmluZWRcIlxuICAgICAgKVxuICAgIH1cbiAgICB0aGlzLm51bU91dHMud3JpdGVVSW50MzJCRSh0aGlzLmV4cG9ydE91dHMubGVuZ3RoLCAwKVxuICAgIGxldCBiYXJyOiBCdWZmZXJbXSA9IFtzdXBlci50b0J1ZmZlcigpLCB0aGlzLmRlc3RpbmF0aW9uQ2hhaW4sIHRoaXMubnVtT3V0c11cbiAgICB0aGlzLmV4cG9ydE91dHMgPSB0aGlzLmV4cG9ydE91dHMuc29ydChUcmFuc2ZlcmFibGVPdXRwdXQuY29tcGFyYXRvcigpKVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB0aGlzLmV4cG9ydE91dHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGJhcnIucHVzaCh0aGlzLmV4cG9ydE91dHNbYCR7aX1gXS50b0J1ZmZlcigpKVxuICAgIH1cbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyKVxuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgbGV0IG5ld2Jhc2U6IEV4cG9ydFR4ID0gbmV3IEV4cG9ydFR4KClcbiAgICBuZXdiYXNlLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxuICAgIHJldHVybiBuZXdiYXNlIGFzIHRoaXNcbiAgfVxuXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xuICAgIHJldHVybiBuZXcgRXhwb3J0VHgoLi4uYXJncykgYXMgdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBFeHBvcnQgdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwgbmV0d29ya0lELCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIE9wdGlvbmFsIGJsb2NrY2hhaW5JRCwgZGVmYXVsdCBCdWZmZXIuYWxsb2MoMzIsIDE2KVxuICAgKiBAcGFyYW0gb3V0cyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXNcbiAgICogQHBhcmFtIGlucyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIG1lbW8gZmllbGRcbiAgICogQHBhcmFtIGRlc3RpbmF0aW9uQ2hhaW4gT3B0aW9uYWwgY2hhaW5pZCB3aGljaCBpZGVudGlmaWVzIHdoZXJlIHRoZSBmdW5kcyB3aWxsIHNlbnQgdG9cbiAgICogQHBhcmFtIGV4cG9ydE91dHMgQXJyYXkgb2YgW1tUcmFuc2ZlcmFibGVPdXRwdXRzXV1zIHVzZWQgaW4gdGhlIHRyYW5zYWN0aW9uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIsIDE2KSxcbiAgICBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IHVuZGVmaW5lZCxcbiAgICBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGRlc3RpbmF0aW9uQ2hhaW46IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBleHBvcnRPdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcihuZXR3b3JrSUQsIGJsb2NrY2hhaW5JRCwgb3V0cywgaW5zLCBtZW1vKVxuICAgIHRoaXMuZGVzdGluYXRpb25DaGFpbiA9IGRlc3RpbmF0aW9uQ2hhaW4gLy8gbm8gY29ycmVjdGlvbiwgaWYgdGhleSBkb25cInQgcGFzcyBhIGNoYWluaWQgaGVyZSwgaXQgd2lsbCBCT01CIG9uIHRvQnVmZmVyXG4gICAgaWYgKHR5cGVvZiBleHBvcnRPdXRzICE9PSBcInVuZGVmaW5lZFwiICYmIEFycmF5LmlzQXJyYXkoZXhwb3J0T3V0cykpIHtcbiAgICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBleHBvcnRPdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICghKGV4cG9ydE91dHNbYCR7aX1gXSBpbnN0YW5jZW9mIFRyYW5zZmVyYWJsZU91dHB1dCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0RXJyb3IoXG4gICAgICAgICAgICBgRXJyb3IgLSBFeHBvcnRUeC5jb25zdHJ1Y3RvcjogaW52YWxpZCBUcmFuc2ZlcmFibGVPdXRwdXQgaW4gYXJyYXkgcGFyYW1ldGVyICR7ZXhwb3J0T3V0c31gXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmV4cG9ydE91dHMgPSBleHBvcnRPdXRzXG4gICAgfVxuICB9XG59XG4iXX0=