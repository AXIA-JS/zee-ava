"use strict";
/**
 * @packageDocumentation
 * @module API-AXVM-InitialStates
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialStates = void 0;
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const output_1 = require("../../common/output");
const outputs_1 = require("./outputs");
const constants_1 = require("./constants");
const serialization_1 = require("../../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
/**
 * Class for creating initial output states used in asset creation
 */
class InitialStates extends serialization_1.Serializable {
    constructor() {
        super(...arguments);
        this._typeName = "InitialStates";
        this._typeID = undefined;
        this.fxs = {};
    }
    serialize(encoding = "hex") {
        const fields = super.serialize(encoding);
        const flatfxs = {};
        for (let fxid in this.fxs) {
            flatfxs[`${fxid}`] = this.fxs[`${fxid}`].map((o) => o.serialize(encoding));
        }
        return Object.assign(Object.assign({}, fields), { fxs: flatfxs });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        const unflat = {};
        for (let fxid in fields["fxs"]) {
            unflat[`${fxid}`] = fields["fxs"][`${fxid}`].map((o) => {
                const out = (0, outputs_1.SelectOutputClass)(o["_typeID"]);
                out.deserialize(o, encoding);
                return out;
            });
        }
        this.fxs = unflat;
    }
    /**
     *
     * @param out The output state to add to the collection
     * @param fxid The FxID that will be used for this output, default AXVMConstants.SECPFXID
     */
    addOutput(out, fxid = constants_1.AXVMConstants.SECPFXID) {
        if (!(fxid in this.fxs)) {
            this.fxs[`${fxid}`] = [];
        }
        this.fxs[`${fxid}`].push(out);
    }
    fromBuffer(bytes, offset = 0) {
        const result = [];
        const klen = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const klennum = klen.readUInt32BE(0);
        for (let i = 0; i < klennum; i++) {
            const fxidbuff = bintools.copyFrom(bytes, offset, offset + 4);
            offset += 4;
            const fxid = fxidbuff.readUInt32BE(0);
            result[`${fxid}`] = [];
            const statelenbuff = bintools.copyFrom(bytes, offset, offset + 4);
            offset += 4;
            const statelen = statelenbuff.readUInt32BE(0);
            for (let j = 0; j < statelen; j++) {
                const outputid = bintools
                    .copyFrom(bytes, offset, offset + 4)
                    .readUInt32BE(0);
                offset += 4;
                const out = (0, outputs_1.SelectOutputClass)(outputid);
                offset = out.fromBuffer(bytes, offset);
                result[`${fxid}`].push(out);
            }
        }
        this.fxs = result;
        return offset;
    }
    toBuffer() {
        const buff = [];
        const keys = Object.keys(this.fxs)
            .map((k) => parseInt(k, 10))
            .sort();
        const klen = buffer_1.Buffer.alloc(4);
        klen.writeUInt32BE(keys.length, 0);
        buff.push(klen);
        for (let i = 0; i < keys.length; i++) {
            const fxid = keys[`${i}`];
            const fxidbuff = buffer_1.Buffer.alloc(4);
            fxidbuff.writeUInt32BE(fxid, 0);
            buff.push(fxidbuff);
            const initialState = this.fxs[`${fxid}`].sort(output_1.Output.comparator());
            const statelen = buffer_1.Buffer.alloc(4);
            statelen.writeUInt32BE(initialState.length, 0);
            buff.push(statelen);
            for (let j = 0; j < initialState.length; j++) {
                const outputid = buffer_1.Buffer.alloc(4);
                outputid.writeInt32BE(initialState[`${j}`].getOutputID(), 0);
                buff.push(outputid);
                buff.push(initialState[`${j}`].toBuffer());
            }
        }
        return buffer_1.Buffer.concat(buff);
    }
}
exports.InitialStates = InitialStates;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5pdGlhbHN0YXRlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL2F4dm0vaW5pdGlhbHN0YXRlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7QUFFSCxvQ0FBZ0M7QUFDaEMsb0VBQTJDO0FBQzNDLGdEQUE0QztBQUM1Qyx1Q0FBNkM7QUFDN0MsMkNBQTJDO0FBQzNDLDZEQUE0RTtBQUM1RTs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFakQ7O0dBRUc7QUFDSCxNQUFhLGFBQWMsU0FBUSw0QkFBWTtJQUEvQzs7UUFDWSxjQUFTLEdBQUcsZUFBZSxDQUFBO1FBQzNCLFlBQU8sR0FBRyxTQUFTLENBQUE7UUE0Qm5CLFFBQUcsR0FBaUMsRUFBRSxDQUFBO0lBbUVsRCxDQUFDO0lBN0ZDLFNBQVMsQ0FBQyxXQUErQixLQUFLO1FBQzVDLE1BQU0sTUFBTSxHQUFXLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDaEQsTUFBTSxPQUFPLEdBQVcsRUFBRSxDQUFBO1FBQzFCLEtBQUssSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUN6QixPQUFPLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQVMsRUFBVSxFQUFFLENBQ2pFLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQ3RCLENBQUE7U0FDRjtRQUNELHVDQUNLLE1BQU0sS0FDVCxHQUFHLEVBQUUsT0FBTyxJQUNiO0lBQ0gsQ0FBQztJQUNELFdBQVcsQ0FBQyxNQUFjLEVBQUUsV0FBK0IsS0FBSztRQUM5RCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUNuQyxNQUFN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QTtZQUM5QyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1lBQ25CLEtBQUssSUFBSSxDQUFDLEdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUNwRCxNQUFNLFFBQVEsR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUN4QyxRQUFRLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBQzVELElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7Z0JBQ25CLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO2FBQzNDO1NBQ0Y7UUFDRCxPQUFPLGVBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDNUIsQ0FBQztDQUNGO0FBakdELHNDQWlHQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1BWFZNLUluaXRpYWxTdGF0ZXNcbiAqL1xuXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IE91dHB1dCB9IGZyb20gXCIuLi8uLi9jb21tb24vb3V0cHV0XCJcbmltcG9ydCB7IFNlbGVjdE91dHB1dENsYXNzIH0gZnJvbSBcIi4vb3V0cHV0c1wiXG5pbXBvcnQgeyBBWFZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcbmltcG9ydCB7IFNlcmlhbGl6YWJsZSwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcblxuLyoqXG4gKiBDbGFzcyBmb3IgY3JlYXRpbmcgaW5pdGlhbCBvdXRwdXQgc3RhdGVzIHVzZWQgaW4gYXNzZXQgY3JlYXRpb25cbiAqL1xuZXhwb3J0IGNsYXNzIEluaXRpYWxTdGF0ZXMgZXh0ZW5kcyBTZXJpYWxpemFibGUge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJJbml0aWFsU3RhdGVzXCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGNvbnN0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIGNvbnN0IGZsYXRmeHM6IG9iamVjdCA9IHt9XG4gICAgZm9yIChsZXQgZnhpZCBpbiB0aGlzLmZ4cykge1xuICAgICAgZmxhdGZ4c1tgJHtmeGlkfWBdID0gdGhpcy5meHNbYCR7ZnhpZH1gXS5tYXAoKG86IE91dHB1dCk6IG9iamVjdCA9PlxuICAgICAgICBvLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIGZ4czogZmxhdGZ4c1xuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIGNvbnN0IHVuZmxhdDogeyBbZnhpZDogbnVtYmVyXTogT3V0cHV0W10gfSA9IHt9XG4gICAgZm9yIChsZXQgZnhpZCBpbiBmaWVsZHNbXCJmeHNcIl0pIHtcbiAgICAgIHVuZmxhdFtgJHtmeGlkfWBdID0gZmllbGRzW1wiZnhzXCJdW2Ake2Z4aWR9YF0ubWFwKChvOiBvYmplY3QpID0+IHtcbiAgICAgICAgY29uc3Qgb3V0OiBPdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhvW1wiX3R5cGVJRFwiXSlcbiAgICAgICAgb3V0LmRlc2VyaWFsaXplKG8sIGVuY29kaW5nKVxuICAgICAgICByZXR1cm4gb3V0XG4gICAgICB9KVxuICAgIH1cbiAgICB0aGlzLmZ4cyA9IHVuZmxhdFxuICB9XG5cbiAgcHJvdGVjdGVkIGZ4czogeyBbZnhpZDogbnVtYmVyXTogT3V0cHV0W10gfSA9IHt9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBvdXQgVGhlIG91dHB1dCBzdGF0ZSB0byBhZGQgdG8gdGhlIGNvbGxlY3Rpb25cbiAgICogQHBhcmFtIGZ4aWQgVGhlIEZ4SUQgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIHRoaXMgb3V0cHV0LCBkZWZhdWx0IEFYVk1Db25zdGFudHMuU0VDUEZYSURcbiAgICovXG4gIGFkZE91dHB1dChvdXQ6IE91dHB1dCwgZnhpZDogbnVtYmVyID0gQVhWTUNvbnN0YW50cy5TRUNQRlhJRCk6IHZvaWQge1xuICAgIGlmICghKGZ4aWQgaW4gdGhpcy5meHMpKSB7XG4gICAgICB0aGlzLmZ4c1tgJHtmeGlkfWBdID0gW11cbiAgICB9XG4gICAgdGhpcy5meHNbYCR7ZnhpZH1gXS5wdXNoKG91dClcbiAgfVxuXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICBjb25zdCByZXN1bHQ6IHsgW2Z4aWQ6IG51bWJlcl06IE91dHB1dFtdIH0gPSBbXVxuICAgIGNvbnN0IGtsZW46IEJ1ZmZlciA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgb2Zmc2V0ICs9IDRcbiAgICBjb25zdCBrbGVubnVtOiBudW1iZXIgPSBrbGVuLnJlYWRVSW50MzJCRSgwKVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBrbGVubnVtOyBpKyspIHtcbiAgICAgIGNvbnN0IGZ4aWRidWZmOiBCdWZmZXIgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgICAgb2Zmc2V0ICs9IDRcbiAgICAgIGNvbnN0IGZ4aWQ6IG51bWJlciA9IGZ4aWRidWZmLnJlYWRVSW50MzJCRSgwKVxuICAgICAgcmVzdWx0W2Ake2Z4aWR9YF0gPSBbXVxuICAgICAgY29uc3Qgc3RhdGVsZW5idWZmOiBCdWZmZXIgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgICAgb2Zmc2V0ICs9IDRcbiAgICAgIGNvbnN0IHN0YXRlbGVuOiBudW1iZXIgPSBzdGF0ZWxlbmJ1ZmYucmVhZFVJbnQzMkJFKDApXG4gICAgICBmb3IgKGxldCBqOiBudW1iZXIgPSAwOyBqIDwgc3RhdGVsZW47IGorKykge1xuICAgICAgICBjb25zdCBvdXRwdXRpZDogbnVtYmVyID0gYmludG9vbHNcbiAgICAgICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICAgICAgICAucmVhZFVJbnQzMkJFKDApXG4gICAgICAgIG9mZnNldCArPSA0XG4gICAgICAgIGNvbnN0IG91dDogT3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3Mob3V0cHV0aWQpXG4gICAgICAgIG9mZnNldCA9IG91dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgICAgIHJlc3VsdFtgJHtmeGlkfWBdLnB1c2gob3V0KVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmZ4cyA9IHJlc3VsdFxuICAgIHJldHVybiBvZmZzZXRcbiAgfVxuXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgY29uc3QgYnVmZjogQnVmZmVyW10gPSBbXVxuICAgIGNvbnN0IGtleXM6IG51bWJlcltdID0gT2JqZWN0LmtleXModGhpcy5meHMpXG4gICAgICAubWFwKChrOiBzdHJpbmcpOiBudW1iZXIgPT4gcGFyc2VJbnQoaywgMTApKVxuICAgICAgLnNvcnQoKVxuICAgIGNvbnN0IGtsZW46IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgIGtsZW4ud3JpdGVVSW50MzJCRShrZXlzLmxlbmd0aCwgMClcbiAgICBidWZmLnB1c2goa2xlbilcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZnhpZDogbnVtYmVyID0ga2V5c1tgJHtpfWBdXG4gICAgICBjb25zdCBmeGlkYnVmZjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgICBmeGlkYnVmZi53cml0ZVVJbnQzMkJFKGZ4aWQsIDApXG4gICAgICBidWZmLnB1c2goZnhpZGJ1ZmYpXG4gICAgICBjb25zdCBpbml0aWFsU3RhdGUgPSB0aGlzLmZ4c1tgJHtmeGlkfWBdLnNvcnQoT3V0cHV0LmNvbXBhcmF0b3IoKSlcbiAgICAgIGNvbnN0IHN0YXRlbGVuOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICAgIHN0YXRlbGVuLndyaXRlVUludDMyQkUoaW5pdGlhbFN0YXRlLmxlbmd0aCwgMClcbiAgICAgIGJ1ZmYucHVzaChzdGF0ZWxlbilcbiAgICAgIGZvciAobGV0IGo6IG51bWJlciA9IDA7IGogPCBpbml0aWFsU3RhdGUubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgY29uc3Qgb3V0cHV0aWQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg0KVxuICAgICAgICBvdXRwdXRpZC53cml0ZUludDMyQkUoaW5pdGlhbFN0YXRlW2Ake2p9YF0uZ2V0T3V0cHV0SUQoKSwgMClcbiAgICAgICAgYnVmZi5wdXNoKG91dHB1dGlkKVxuICAgICAgICBidWZmLnB1c2goaW5pdGlhbFN0YXRlW2Ake2p9YF0udG9CdWZmZXIoKSlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYnVmZilcbiAgfVxufVxuIl19