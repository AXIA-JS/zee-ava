"use strict";
/**
 * @packageDocumentation
 * @module API-AVM-MinterSet
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWludGVyc2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYXZtL21pbnRlcnNldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7QUFFSCxvQ0FBZ0M7QUFDaEMsb0VBQTJDO0FBQzNDLDZEQUtrQztBQUVsQzs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxhQUFhLEdBQWtCLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDaEUsTUFBTSxhQUFhLEdBQW1CLGVBQWUsQ0FBQTtBQUNyRCxNQUFNLElBQUksR0FBbUIsTUFBTSxDQUFBO0FBQ25DLE1BQU0sR0FBRyxHQUFtQixRQUFRLENBQUE7QUFDcEMsTUFBTSxNQUFNLEdBQW1CLFFBQVEsQ0FBQTtBQUV2Qzs7OztHQUlHO0FBQ0gsTUFBYSxTQUFVLFNBQVEsNEJBQVk7SUErRHpDOzs7O09BSUc7SUFDSCxZQUFZLFlBQW9CLENBQUMsRUFBRSxVQUErQixFQUFFO1FBQ2xFLEtBQUssRUFBRSxDQUFBO1FBcEVDLGNBQVMsR0FBRyxXQUFXLENBQUE7UUFDdkIsWUFBTyxHQUFHLFNBQVMsQ0FBQTtRQWlDbkIsWUFBTyxHQUFhLEVBQUUsQ0FBQTtRQUVoQzs7V0FFRztRQUNILGlCQUFZLEdBQUcsR0FBVyxFQUFFO1lBQzFCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQTtRQUN2QixDQUFDLENBQUE7UUFFRDs7V0FFRztRQUNILGVBQVUsR0FBRyxHQUFhLEVBQUU7WUFDMUIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFBO1FBQ3JCLENBQUMsQ0FBQTtRQUVTLG9CQUFlLEdBQUcsQ0FBQyxTQUE4QixFQUFZLEVBQUU7WUFDdkUsSUFBSSxLQUFLLEdBQWEsRUFBRSxDQUFBO1lBQ3hCLEtBQUssSUFBSSxDQUFDLEdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUNqRCxJQUFJLE9BQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxRQUFRLEVBQUU7b0JBQ3pDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBVyxDQUFDLENBQUMsQ0FBQTtpQkFDbEU7cUJBQU0sSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxZQUFZLGVBQU0sRUFBRTtvQkFDOUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBVyxDQUFDLENBQUE7aUJBQ3hDO2FBQ0Y7WUFDRCxPQUFPLEtBQUssQ0FBQTtRQUNkLENBQUMsQ0FBQTtRQVNDLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFBO1FBQzFCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUM5QyxDQUFDO0lBcEVELFNBQVMsQ0FBQyxXQUErQixLQUFLO1FBQzVDLE1BQU0sTUFBTSxHQUFXLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDaEQsdUNBQ0ssTUFBTSxLQUNULFNBQVMsRUFBRSxhQUFhLENBQUMsT0FBTyxDQUM5QixJQUFJLENBQUMsU0FBUyxFQUNkLFFBQVEsRUFDUixHQUFHLEVBQ0gsYUFBYSxFQUNiLENBQUMsQ0FDRixFQUNELE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQzlCLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUNyRCxJQUNGO0lBQ0gsQ0FBQztJQUNELFdBQVcsQ0FBQyxNQUFjLEVBQUUsV0FBK0IsS0FBSztRQUM5RCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUNuQyxJQUFJLENBQUMsU0FBUyxHQUFHLGFBQWEsQ0FBQyxPQUFPLENBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFDbkIsUUFBUSxFQUNSLGFBQWEsRUFDYixHQUFHLEVBQ0gsQ0FBQyxDQUNGLENBQUE7UUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFTLEVBQUUsRUFBRSxDQUNqRCxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FDckQsQ0FBQTtJQUNILENBQUM7Q0F5Q0Y7QUF6RUQsOEJBeUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUFWTS1NaW50ZXJTZXRcbiAqL1xuXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7XG4gIFNlcmlhbGl6YWJsZSxcbiAgU2VyaWFsaXphdGlvbixcbiAgU2VyaWFsaXplZEVuY29kaW5nLFxuICBTZXJpYWxpemVkVHlwZVxufSBmcm9tIFwiLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXG5jb25zdCBkZWNpbWFsU3RyaW5nOiBTZXJpYWxpemVkVHlwZSA9IFwiZGVjaW1hbFN0cmluZ1wiXG5jb25zdCBjYjU4OiBTZXJpYWxpemVkVHlwZSA9IFwiY2I1OFwiXG5jb25zdCBudW06IFNlcmlhbGl6ZWRUeXBlID0gXCJudW1iZXJcIlxuY29uc3QgYnVmZmVyOiBTZXJpYWxpemVkVHlwZSA9IFwiQnVmZmVyXCJcblxuLyoqXG4gKiBDbGFzcyBmb3IgcmVwcmVzZW50aW5nIGEgdGhyZXNob2xkIGFuZCBzZXQgb2YgbWludGluZyBhZGRyZXNzZXMgaW4gQXhpYS5cbiAqXG4gKiBAdHlwZXBhcmFtIE1pbnRlclNldCBpbmNsdWRpbmcgYSB0aHJlc2hvbGQgYW5kIGFycmF5IG9mIGFkZHJlc3Nlc1xuICovXG5leHBvcnQgY2xhc3MgTWludGVyU2V0IGV4dGVuZHMgU2VyaWFsaXphYmxlIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiTWludGVyU2V0XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGNvbnN0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICB0aHJlc2hvbGQ6IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcbiAgICAgICAgdGhpcy50aHJlc2hvbGQsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBudW0sXG4gICAgICAgIGRlY2ltYWxTdHJpbmcsXG4gICAgICAgIDRcbiAgICAgICksXG4gICAgICBtaW50ZXJzOiB0aGlzLm1pbnRlcnMubWFwKChtKSA9PlxuICAgICAgICBzZXJpYWxpemF0aW9uLmVuY29kZXIobSwgZW5jb2RpbmcsIGJ1ZmZlciwgY2I1OCwgMjApXG4gICAgICApXG4gICAgfVxuICB9XG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy50aHJlc2hvbGQgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJ0aHJlc2hvbGRcIl0sXG4gICAgICBlbmNvZGluZyxcbiAgICAgIGRlY2ltYWxTdHJpbmcsXG4gICAgICBudW0sXG4gICAgICA0XG4gICAgKVxuICAgIHRoaXMubWludGVycyA9IGZpZWxkc1tcIm1pbnRlcnNcIl0ubWFwKChtOiBzdHJpbmcpID0+XG4gICAgICBzZXJpYWxpemF0aW9uLmRlY29kZXIobSwgZW5jb2RpbmcsIGNiNTgsIGJ1ZmZlciwgMjApXG4gICAgKVxuICB9XG5cbiAgcHJvdGVjdGVkIHRocmVzaG9sZDogbnVtYmVyXG4gIHByb3RlY3RlZCBtaW50ZXJzOiBCdWZmZXJbXSA9IFtdXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHRocmVzaG9sZC5cbiAgICovXG4gIGdldFRocmVzaG9sZCA9ICgpOiBudW1iZXIgPT4ge1xuICAgIHJldHVybiB0aGlzLnRocmVzaG9sZFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG1pbnRlcnMuXG4gICAqL1xuICBnZXRNaW50ZXJzID0gKCk6IEJ1ZmZlcltdID0+IHtcbiAgICByZXR1cm4gdGhpcy5taW50ZXJzXG4gIH1cblxuICBwcm90ZWN0ZWQgX2NsZWFuQWRkcmVzc2VzID0gKGFkZHJlc3Nlczogc3RyaW5nW10gfCBCdWZmZXJbXSk6IEJ1ZmZlcltdID0+IHtcbiAgICBsZXQgYWRkcnM6IEJ1ZmZlcltdID0gW11cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgYWRkcmVzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodHlwZW9mIGFkZHJlc3Nlc1tgJHtpfWBdID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGFkZHJzLnB1c2goYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGFkZHJlc3Nlc1tgJHtpfWBdIGFzIHN0cmluZykpXG4gICAgICB9IGVsc2UgaWYgKGFkZHJlc3Nlc1tgJHtpfWBdIGluc3RhbmNlb2YgQnVmZmVyKSB7XG4gICAgICAgIGFkZHJzLnB1c2goYWRkcmVzc2VzW2Ake2l9YF0gYXMgQnVmZmVyKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYWRkcnNcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gdGhyZXNob2xkIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBtaW50IG1vcmUgb2YgYW4gYXNzZXQgYnkgc2lnbmluZyBhIG1pbnRpbmcgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIG1pbnRlcnMgQXJyYXkgb2YgYWRkcmVzc3Mgd2hpY2ggYXJlIGF1dGhvcml6ZWQgdG8gc2lnbiBhIG1pbnRpbmcgdHJhbnNhY3Rpb25cbiAgICovXG4gIGNvbnN0cnVjdG9yKHRocmVzaG9sZDogbnVtYmVyID0gMSwgbWludGVyczogc3RyaW5nW10gfCBCdWZmZXJbXSA9IFtdKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMudGhyZXNob2xkID0gdGhyZXNob2xkXG4gICAgdGhpcy5taW50ZXJzID0gdGhpcy5fY2xlYW5BZGRyZXNzZXMobWludGVycylcbiAgfVxufVxuIl19