"use strict";
/**
 * @packageDocumentation
 * @module API-AXVM-MinterSet
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinterSet = void 0;
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const serialization_1 = require("../../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
const decimalString = "decimalString";
const cb58 = "cb58";
const num = "number";
const buffer = "Buffer";
/**
 * Class for representing a threshold and set of minting addresses in Axia.
 *
 * @typeparam MinterSet including a threshold and array of addresses
 */
class MinterSet extends serialization_1.Serializable {
    /**
     *
     * @param threshold The number of signatures required to mint more of an asset by signing a minting transaction
     * @param minters Array of addresss which are authorized to sign a minting transaction
     */
    constructor(threshold = 1, minters = []) {
        super();
        this._typeName = "MinterSet";
        this._typeID = undefined;
        this.minters = [];
        /**
         * Returns the threshold.
         */
        this.getThreshold = () => {
            return this.threshold;
        };
        /**
         * Returns the minters.
         */
        this.getMinters = () => {
            return this.minters;
        };
        this._cleanAddresses = (addresses) => {
            let addrs = [];
            for (let i = 0; i < addresses.length; i++) {
                if (typeof addresses[`${i}`] === "string") {
                    addrs.push(bintools.stringToAddress(addresses[`${i}`]));
                }
                else if (addresses[`${i}`] instanceof buffer_1.Buffer) {
                    addrs.push(addresses[`${i}`]);
                }
            }
            return addrs;
        };
        this.threshold = threshold;
        this.minters = this._cleanAddresses(minters);
    }
    serialize(encoding = "hex") {
        const fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { threshold: serialization.encoder(this.threshold, encoding, num, decimalString, 4), minters: this.minters.map((m) => serialization.encoder(m, encoding, buffer, cb58, 20)) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.threshold = serialization.decoder(fields["threshold"], encoding, decimalString, num, 4);
        this.minters = fields["minters"].map((m) => serialization.decoder(m, encoding, cb58, buffer, 20));
    }
}
exports.MinterSet = MinterSet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWludGVyc2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYXh2bS9taW50ZXJzZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7O0FBRUgsb0NBQWdDO0FBQ2hDLG9FQUEyQztBQUMzQyw2REFLa0M7QUFFbEM7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2hFLE1BQU0sYUFBYSxHQUFtQixlQUFlLENBQUE7QUFDckQsTUFBTSxJQUFJLEdBQW1CLE1BQU0sQ0FBQTtBQUNuQyxNQUFNLEdBQUcsR0FBbUIsUUFBUSxDQUFBO0FBQ3BDLE1BQU0sTUFBTSxHQUFtQixRQUFRLENBQUE7QUFFdkM7Ozs7R0FJRztBQUNILE1BQWEsU0FBVSxTQUFRLDRCQUFZO0lBK0R6Qzs7OztPQUlHO0lBQ0gsWUFBWSxZQUFvQixDQUFDLEVBQUUsVUFBK0IsRUFBRTtRQUNsRSxLQUFLLEVBQUUsQ0FBQTtRQXBFQyxjQUFTLEdBQUcsV0FBVyxDQUFBO1FBQ3ZCLFlBQU8sR0FBRyxTQUFTLENBQUE7UUFpQ25CLFlBQU8sR0FBYSxFQUFFLENBQUE7UUFFaEM7O1dBRUc7UUFDSCxpQkFBWSxHQUFHLEdBQVcsRUFBRTtZQUMxQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUE7UUFDdkIsQ0FBQyxDQUFBO1FBRUQ7O1dBRUc7UUFDSCxlQUFVLEdBQUcsR0FBYSxFQUFFO1lBQzFCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQTtRQUNyQixDQUFDLENBQUE7UUFFUyxvQkFBZSxHQUFHLENBQUMsU0FBOEIsRUFBWSxFQUFFO1lBQ3ZFLElBQUksS0FBSyxHQUFhLEVBQUUsQ0FBQTtZQUN4QixLQUFLLElBQUksQ0FBQyxHQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDakQsSUFBSSxPQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssUUFBUSxFQUFFO29CQUN6QyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQVcsQ0FBQyxDQUFDLENBQUE7aUJBQ2xFO3FCQUFNLElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsWUFBWSxlQUFNLEVBQUU7b0JBQzlDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQVcsQ0FBQyxDQUFBO2lCQUN4QzthQUNGO1lBQ0QsT0FBTyxLQUFLLENBQUE7UUFDZCxDQUFDLENBQUE7UUFTQyxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQTtRQUMxQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDOUMsQ0FBQztJQXBFRCxTQUFTLENBQUMsV0FBK0IsS0FBSztRQUM1QyxNQUFNLE1BQU0sR0FBVyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ2hELHVDQUNLLE1BQU0sS0FDVCxTQUFTLEVBQUUsYUFBYSxDQUFDLE9BQU8sQ0FDOUIsSUFBSSxDQUFDLFNBQVMsRUFDZCxRQUFRLEVBQ1IsR0FBRyxFQUNILGFBQWEsRUFDYixDQUFDLENBQ0YsRUFDRCxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUM5QixhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FDckQsSUFDRjtJQUNILENBQUM7SUFDRCxXQUFXLENBQUMsTUFBYyxFQUFFLFdBQStCLEtBQUs7UUFDOUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDbkMsSUFBSSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUMsT0FBTyxDQUNwQyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQ25CLFFBQVEsRUFDUixhQUFhLEVBQ2IsR0FBRyxFQUNILENBQUMsQ0FDRixDQUFBO1FBQ0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBUyxFQUFFLEVBQUUsQ0FDakQsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQ3JELENBQUE7SUFDSCxDQUFDO0NBeUNGO0FBekVELDhCQXlFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1BWFZNLU1pbnRlclNldFxuICovXG5cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxuaW1wb3J0IHtcbiAgU2VyaWFsaXphYmxlLFxuICBTZXJpYWxpemF0aW9uLFxuICBTZXJpYWxpemVkRW5jb2RpbmcsXG4gIFNlcmlhbGl6ZWRUeXBlXG59IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcbmNvbnN0IHNlcmlhbGl6YXRpb246IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcbmNvbnN0IGRlY2ltYWxTdHJpbmc6IFNlcmlhbGl6ZWRUeXBlID0gXCJkZWNpbWFsU3RyaW5nXCJcbmNvbnN0IGNiNTg6IFNlcmlhbGl6ZWRUeXBlID0gXCJjYjU4XCJcbmNvbnN0IG51bTogU2VyaWFsaXplZFR5cGUgPSBcIm51bWJlclwiXG5jb25zdCBidWZmZXI6IFNlcmlhbGl6ZWRUeXBlID0gXCJCdWZmZXJcIlxuXG4vKipcbiAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSB0aHJlc2hvbGQgYW5kIHNldCBvZiBtaW50aW5nIGFkZHJlc3NlcyBpbiBBeGlhLlxuICpcbiAqIEB0eXBlcGFyYW0gTWludGVyU2V0IGluY2x1ZGluZyBhIHRocmVzaG9sZCBhbmQgYXJyYXkgb2YgYWRkcmVzc2VzXG4gKi9cbmV4cG9ydCBjbGFzcyBNaW50ZXJTZXQgZXh0ZW5kcyBTZXJpYWxpemFibGUge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJNaW50ZXJTZXRcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgY29uc3QgZmllbGRzOiBvYmplY3QgPSBzdXBlci5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLmZpZWxkcyxcbiAgICAgIHRocmVzaG9sZDogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxuICAgICAgICB0aGlzLnRocmVzaG9sZCxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIG51bSxcbiAgICAgICAgZGVjaW1hbFN0cmluZyxcbiAgICAgICAgNFxuICAgICAgKSxcbiAgICAgIG1pbnRlcnM6IHRoaXMubWludGVycy5tYXAoKG0pID0+XG4gICAgICAgIHNlcmlhbGl6YXRpb24uZW5jb2RlcihtLCBlbmNvZGluZywgYnVmZmVyLCBjYjU4LCAyMClcbiAgICAgIClcbiAgICB9XG4gIH1cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLnRocmVzaG9sZCA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcbiAgICAgIGZpZWxkc1tcInRocmVzaG9sZFwiXSxcbiAgICAgIGVuY29kaW5nLFxuICAgICAgZGVjaW1hbFN0cmluZyxcbiAgICAgIG51bSxcbiAgICAgIDRcbiAgICApXG4gICAgdGhpcy5taW50ZXJzID0gZmllbGRzW1wibWludGVyc1wiXS5tYXAoKG06IHN0cmluZykgPT5cbiAgICAgIHNlcmlhbGl6YXRpb24uZGVjb2RlcihtLCBlbmNvZGluZywgY2I1OCwgYnVmZmVyLCAyMClcbiAgICApXG4gIH1cblxuICBwcm90ZWN0ZWQgdGhyZXNob2xkOiBudW1iZXJcbiAgcHJvdGVjdGVkIG1pbnRlcnM6IEJ1ZmZlcltdID0gW11cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdGhyZXNob2xkLlxuICAgKi9cbiAgZ2V0VGhyZXNob2xkID0gKCk6IG51bWJlciA9PiB7XG4gICAgcmV0dXJuIHRoaXMudGhyZXNob2xkXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbWludGVycy5cbiAgICovXG4gIGdldE1pbnRlcnMgPSAoKTogQnVmZmVyW10gPT4ge1xuICAgIHJldHVybiB0aGlzLm1pbnRlcnNcbiAgfVxuXG4gIHByb3RlY3RlZCBfY2xlYW5BZGRyZXNzZXMgPSAoYWRkcmVzc2VzOiBzdHJpbmdbXSB8IEJ1ZmZlcltdKTogQnVmZmVyW10gPT4ge1xuICAgIGxldCBhZGRyczogQnVmZmVyW10gPSBbXVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBhZGRyZXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0eXBlb2YgYWRkcmVzc2VzW2Ake2l9YF0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgYWRkcnMucHVzaChiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYWRkcmVzc2VzW2Ake2l9YF0gYXMgc3RyaW5nKSlcbiAgICAgIH0gZWxzZSBpZiAoYWRkcmVzc2VzW2Ake2l9YF0gaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgICAgYWRkcnMucHVzaChhZGRyZXNzZXNbYCR7aX1gXSBhcyBCdWZmZXIpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhZGRyc1xuICB9XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIG1pbnQgbW9yZSBvZiBhbiBhc3NldCBieSBzaWduaW5nIGEgbWludGluZyB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gbWludGVycyBBcnJheSBvZiBhZGRyZXNzcyB3aGljaCBhcmUgYXV0aG9yaXplZCB0byBzaWduIGEgbWludGluZyB0cmFuc2FjdGlvblxuICAgKi9cbiAgY29uc3RydWN0b3IodGhyZXNob2xkOiBudW1iZXIgPSAxLCBtaW50ZXJzOiBzdHJpbmdbXSB8IEJ1ZmZlcltdID0gW10pIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy50aHJlc2hvbGQgPSB0aHJlc2hvbGRcbiAgICB0aGlzLm1pbnRlcnMgPSB0aGlzLl9jbGVhbkFkZHJlc3NlcyhtaW50ZXJzKVxuICB9XG59XG4iXX0=