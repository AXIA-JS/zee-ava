"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @packageDocumentation
 * @module Utils-BinTools
 */
const bn_js_1 = __importDefault(require("bn.js"));
const buffer_1 = require("buffer/");
const create_hash_1 = __importDefault(require("create-hash"));
const bech32 = __importStar(require("bech32"));
const base58_1 = require("./base58");
const errors_1 = require("../utils/errors");
const ethers_1 = require("ethers");
/**
 * A class containing tools useful in interacting with binary data cross-platform using
 * nodejs & javascript.
 *
 * This class should never be instantiated directly. Instead,
 * invoke the "BinTools.getInstance()" static * function to grab the singleton
 * instance of the tools.
 *
 * Everything in this library uses
 * the {@link https://github.com/feross/buffer|feross's Buffer class}.
 *
 * ```js
 * const bintools: BinTools = BinTools.getInstance();
 * const b58str:  = bintools.bufferToB58(Buffer.from("Wubalubadubdub!"));
 * ```
 */
class BinTools {
    constructor() {
        /**
         * Returns true if meets requirements to parse as an address as Bech32 on SwapChain or CoreChain, otherwise false
         * @param address the string to verify is address
         */
        this.isPrimaryBechAddress = (address) => {
            const parts = address.trim().split("-");
            if (parts.length !== 2) {
                return false;
            }
            try {
                bech32.bech32.fromWords(bech32.bech32.decode(parts[1]).words);
            }
            catch (err) {
                return false;
            }
            return true;
        };
        /**
         * Produces a string from a {@link https://github.com/feross/buffer|Buffer}
         * representing a string. ONLY USED IN TRANSACTION FORMATTING, ASSUMED LENGTH IS PREPENDED.
         *
         * @param buff The {@link https://github.com/feross/buffer|Buffer} to convert to a string
         */
        this.bufferToString = (buff) => this.copyFrom(buff, 2).toString("utf8");
        /**
         * Produces a {@link https://github.com/feross/buffer|Buffer} from a string. ONLY USED IN TRANSACTION FORMATTING, LENGTH IS PREPENDED.
         *
         * @param str The string to convert to a {@link https://github.com/feross/buffer|Buffer}
         */
        this.stringToBuffer = (str) => {
            const buff = buffer_1.Buffer.alloc(2 + str.length);
            buff.writeUInt16BE(str.length, 0);
            buff.write(str, 2, str.length, "utf8");
            return buff;
        };
        /**
         * Makes a copy (no reference) of a {@link https://github.com/feross/buffer|Buffer}
         * over provided indecies.
         *
         * @param buff The {@link https://github.com/feross/buffer|Buffer} to copy
         * @param start The index to start the copy
         * @param end The index to end the copy
         */
        this.copyFrom = (buff, start = 0, end = undefined) => {
            if (end === undefined) {
                end = buff.length;
            }
            return buffer_1.Buffer.from(Uint8Array.prototype.slice.call(buff.slice(start, end)));
        };
        /**
         * Takes a {@link https://github.com/feross/buffer|Buffer} and returns a base-58 string of
         * the {@link https://github.com/feross/buffer|Buffer}.
         *
         * @param buff The {@link https://github.com/feross/buffer|Buffer} to convert to base-58
         */
        this.bufferToB58 = (buff) => this.b58.encode(buff);
        /**
         * Takes a base-58 string and returns a {@link https://github.com/feross/buffer|Buffer}.
         *
         * @param b58str The base-58 string to convert
         * to a {@link https://github.com/feross/buffer|Buffer}
         */
        this.b58ToBuffer = (b58str) => this.b58.decode(b58str);
        /**
         * Takes a {@link https://github.com/feross/buffer|Buffer} and returns an ArrayBuffer.
         *
         * @param buff The {@link https://github.com/feross/buffer|Buffer} to
         * convert to an ArrayBuffer
         */
        this.fromBufferToArrayBuffer = (buff) => {
            const ab = new ArrayBuffer(buff.length);
            const view = new Uint8Array(ab);
            for (let i = 0; i < buff.length; ++i) {
                view[`${i}`] = buff[`${i}`];
            }
            return view;
        };
        /**
         * Takes an ArrayBuffer and converts it to a {@link https://github.com/feross/buffer|Buffer}.
         *
         * @param ab The ArrayBuffer to convert to a {@link https://github.com/feross/buffer|Buffer}
         */
        this.fromArrayBufferToBuffer = (ab) => {
            const buf = buffer_1.Buffer.alloc(ab.byteLength);
            for (let i = 0; i < ab.byteLength; ++i) {
                buf[`${i}`] = ab[`${i}`];
            }
            return buf;
        };
        /**
         * Takes a {@link https://github.com/feross/buffer|Buffer} and converts it
         * to a {@link https://github.com/indutny/bn.js/|BN}.
         *
         * @param buff The {@link https://github.com/feross/buffer|Buffer} to convert
         * to a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.fromBufferToBN = (buff) => {
            if (typeof buff === "undefined") {
                return undefined;
            }
            return new bn_js_1.default(buff.toString("hex"), 16, "be");
        };
        /**
         * Takes a {@link https://github.com/indutny/bn.js/|BN} and converts it
         * to a {@link https://github.com/feross/buffer|Buffer}.
         *
         * @param bn The {@link https://github.com/indutny/bn.js/|BN} to convert
         * to a {@link https://github.com/feross/buffer|Buffer}
         * @param length The zero-padded length of the {@link https://github.com/feross/buffer|Buffer}
         */
        this.fromBNToBuffer = (bn, length) => {
            if (typeof bn === "undefined") {
                return undefined;
            }
            const newarr = bn.toArray("be");
            /**
             * CKC: Still unsure why bn.toArray with a "be" and a length do not work right. Bug?
             */
            if (length) {
                // bn toArray with the length parameter doesn't work correctly, need this.
                const x = length - newarr.length;
                for (let i = 0; i < x; i++) {
                    newarr.unshift(0);
                }
            }
            return buffer_1.Buffer.from(newarr);
        };
        /**
         * Takes a {@link https://github.com/feross/buffer|Buffer} and adds a checksum, returning
         * a {@link https://github.com/feross/buffer|Buffer} with the 4-byte checksum appended.
         *
         * @param buff The {@link https://github.com/feross/buffer|Buffer} to append a checksum
         */
        this.addChecksum = (buff) => {
            const hashslice = buffer_1.Buffer.from((0, create_hash_1.default)("sha256").update(buff).digest().slice(28));
            return buffer_1.Buffer.concat([buff, hashslice]);
        };
        /**
         * Takes a {@link https://github.com/feross/buffer|Buffer} with an appended 4-byte checksum
         * and returns true if the checksum is valid, otherwise false.
         *
         * @param b The {@link https://github.com/feross/buffer|Buffer} to validate the checksum
         */
        this.validateChecksum = (buff) => {
            const checkslice = buff.slice(buff.length - 4);
            const hashslice = buffer_1.Buffer.from((0, create_hash_1.default)("sha256")
                .update(buff.slice(0, buff.length - 4))
                .digest()
                .slice(28));
            return checkslice.toString("hex") === hashslice.toString("hex");
        };
        /**
         * Takes a {@link https://github.com/feross/buffer|Buffer} and returns a base-58 string with
         * checksum as per the cb58 standard.
         *
         * @param bytes A {@link https://github.com/feross/buffer|Buffer} to serialize
         *
         * @returns A serialized base-58 string of the Buffer.
         */
        this.cb58Encode = (bytes) => {
            const x = this.addChecksum(bytes);
            return this.bufferToB58(x);
        };
        /**
         * Takes a cb58 serialized {@link https://github.com/feross/buffer|Buffer} or base-58 string
         * and returns a {@link https://github.com/feross/buffer|Buffer} of the original data. Throws on error.
         *
         * @param bytes A cb58 serialized {@link https://github.com/feross/buffer|Buffer} or base-58 string
         */
        this.cb58Decode = (bytes) => {
            if (typeof bytes === "string") {
                bytes = this.b58ToBuffer(bytes);
            }
            if (this.validateChecksum(bytes)) {
                return this.copyFrom(bytes, 0, bytes.length - 4);
            }
            throw new errors_1.ChecksumError("Error - BinTools.cb58Decode: invalid checksum");
        };
        this.addressToString = (hrp, chainid, bytes) => `${chainid}-${bech32.bech32.encode(hrp, bech32.bech32.toWords(bytes))}`;
        this.stringToAddress = (address, hrp) => {
            if (address.substring(0, 2) === "0x") {
                // ETH-style address
                if (ethers_1.utils.isAddress(address)) {
                    return buffer_1.Buffer.from(address.substring(2), "hex");
                }
                else {
                    throw new errors_1.HexError("Error - Invalid address");
                }
            }
            // Bech32 addresses
            const parts = address.trim().split("-");
            if (parts.length < 2) {
                throw new errors_1.Bech32Error("Error - Valid address should include -");
            }
            if (parts[0].length < 1) {
                throw new errors_1.Bech32Error("Error - Valid address must have prefix before -");
            }
            const split = parts[1].lastIndexOf("1");
            if (split < 0) {
                throw new errors_1.Bech32Error("Error - Valid address must include separator (1)");
            }
            const humanReadablePart = parts[1].slice(0, split);
            if (humanReadablePart.length < 1) {
                throw new errors_1.Bech32Error("Error - HRP should be at least 1 character");
            }
            if (humanReadablePart !== "axc" &&
                humanReadablePart !== "fuji" &&
                humanReadablePart != "local" &&
                humanReadablePart != "custom" &&
                humanReadablePart != hrp) {
                throw new errors_1.Bech32Error("Error - Invalid HRP");
            }
            return buffer_1.Buffer.from(bech32.bech32.fromWords(bech32.bech32.decode(parts[1]).words));
        };
        /**
         * Takes an address and returns its {@link https://github.com/feross/buffer|Buffer}
         * representation if valid. A more strict version of stringToAddress.
         *
         * @param addr A string representation of the address
         * @param blockchainID A cb58 encoded string representation of the blockchainID
         * @param alias A chainID alias, if any, that the address can also parse from.
         * @param addrlen VMs can use any addressing scheme that they like, so this is the appropriate number of address bytes. Default 20.
         *
         * @returns A {@link https://github.com/feross/buffer|Buffer} for the address if valid,
         * undefined if not valid.
         */
        this.parseAddress = (addr, blockchainID, alias = undefined, addrlen = 20) => {
            const abc = addr.split("-");
            if (abc.length === 2 &&
                ((alias && abc[0] === alias) || (blockchainID && abc[0] === blockchainID))) {
                const addrbuff = this.stringToAddress(addr);
                if ((addrlen && addrbuff.length === addrlen) || !addrlen) {
                    return addrbuff;
                }
            }
            return undefined;
        };
        this.b58 = base58_1.Base58.getInstance();
    }
    /**
     * Retrieves the BinTools singleton.
     */
    static getInstance() {
        if (!BinTools.instance) {
            BinTools.instance = new BinTools();
        }
        return BinTools.instance;
    }
    /**
     * Returns true if base64, otherwise false
     * @param str the string to verify is Base64
     */
    isBase64(str) {
        if (str === "" || str.trim() === "") {
            return false;
        }
        try {
            let b64 = buffer_1.Buffer.from(str, "base64");
            return b64.toString("base64") === str;
        }
        catch (err) {
            return false;
        }
    }
    /**
     * Returns true if cb58, otherwise false
     * @param cb58 the string to verify is cb58
     */
    isCB58(cb58) {
        return this.isBase58(cb58);
    }
    /**
     * Returns true if base58, otherwise false
     * @param base58 the string to verify is base58
     */
    isBase58(base58) {
        if (base58 === "" || base58.trim() === "") {
            return false;
        }
        try {
            return this.b58.encode(this.b58.decode(base58)) === base58;
        }
        catch (err) {
            return false;
        }
    }
    /**
     * Returns true if hexidecimal, otherwise false
     * @param hex the string to verify is hexidecimal
     */
    isHex(hex) {
        if (hex === "" || hex.trim() === "") {
            return false;
        }
        if ((hex.startsWith("0x") && hex.slice(2).match(/^[0-9A-Fa-f]/g)) ||
            hex.match(/^[0-9A-Fa-f]/g)) {
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * Returns true if decimal, otherwise false
     * @param str the string to verify is hexidecimal
     */
    isDecimal(str) {
        if (str === "" || str.trim() === "") {
            return false;
        }
        try {
            return new bn_js_1.default(str, 10).toString(10) === str.trim();
        }
        catch (err) {
            return false;
        }
    }
}
exports.default = BinTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmludG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdXRpbHMvYmludG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7R0FHRztBQUNILGtEQUFzQjtBQUN0QixvQ0FBZ0M7QUFDaEMsOERBQW9DO0FBQ3BDLCtDQUFnQztBQUNoQyxxQ0FBaUM7QUFDakMsNENBQXNFO0FBQ3RFLG1DQUE4QjtBQUU5Qjs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCxNQUFxQixRQUFRO0lBRzNCO1FBd0ZBOzs7V0FHRztRQUNILHlCQUFvQixHQUFHLENBQUMsT0FBZSxFQUFXLEVBQUU7WUFDbEQsTUFBTSxLQUFLLEdBQWEsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUNqRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUN0QixPQUFPLEtBQUssQ0FBQTthQUNiO1lBQ0QsSUFBSTtnQkFDRixNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQTthQUM5RDtZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUNaLE9BQU8sS0FBSyxDQUFBO2FBQ2I7WUFDRCxPQUFPLElBQUksQ0FBQTtRQUNiLENBQUMsQ0FBQTtRQUVEOzs7OztXQUtHO1FBQ0gsbUJBQWMsR0FBRyxDQUFDLElBQVksRUFBVSxFQUFFLENBQ3hDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUV6Qzs7OztXQUlHO1FBQ0gsbUJBQWMsR0FBRyxDQUFDLEdBQVcsRUFBVSxFQUFFO1lBQ3ZDLE1BQU0sSUFBSSxHQUFXLGVBQU0sQ0FBQyxL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O1FBQ0QsSUFDRSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDN0QsR0FBRyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsRUFDMUI7WUFDQSxPQUFPLElBQUksQ0FBQTtTQUNaO2FBQU07WUFDTCxPQUFPLEtBQUssQ0FBQTtTQUNiO0lBQ0gsQ0FBQztJQUVEOzs7T0FHRztJQUNILFNBQVMsQ0FBQyxHQUFXO1FBQ25CLElBQUksR0FBRyxLQUFLLEVBQUUsSUFBSSxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQ25DLE9BQU8sS0FBSyxDQUFBO1NBQ2I7UUFDRCxJQUFJO1lBQ0YsT0FBTyxJQUFJLGVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtTQUNuRDtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxLQUFLLENBQUE7U0FDYjtJQUNILENBQUM7Q0F1UkY7QUFoWEQsMkJBZ1hDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgVXRpbHMtQmluVG9vbHNcbiAqL1xuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgY3JlYXRlSGFzaCBmcm9tIFwiY3JlYXRlLWhhc2hcIlxuaW1wb3J0ICogYXMgYmVjaDMyIGZyb20gXCJiZWNoMzJcIlxuaW1wb3J0IHsgQmFzZTU4IH0gZnJvbSBcIi4vYmFzZTU4XCJcbmltcG9ydCB7IEJlY2gzMkVycm9yLCBDaGVja3N1bUVycm9yLCBIZXhFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvcnNcIlxuaW1wb3J0IHsgdXRpbHMgfSBmcm9tIFwiZXRoZXJzXCJcblxuLyoqXG4gKiBBIGNsYXNzIGNvbnRhaW5pbmcgdG9vbHMgdXNlZnVsIGluIGludGVyYWN0aW5nIHdpdGggYmluYXJ5IGRhdGEgY3Jvc3MtcGxhdGZvcm0gdXNpbmdcbiAqIG5vZGVqcyAmIGphdmFzY3JpcHQuXG4gKlxuICogVGhpcyBjbGFzcyBzaG91bGQgbmV2ZXIgYmUgaW5zdGFudGlhdGVkIGRpcmVjdGx5LiBJbnN0ZWFkLFxuICogaW52b2tlIHRoZSBcIkJpblRvb2xzLmdldEluc3RhbmNlKClcIiBzdGF0aWMgKiBmdW5jdGlvbiB0byBncmFiIHRoZSBzaW5nbGV0b25cbiAqIGluc3RhbmNlIG9mIHRoZSB0b29scy5cbiAqXG4gKiBFdmVyeXRoaW5nIGluIHRoaXMgbGlicmFyeSB1c2VzXG4gKiB0aGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfGZlcm9zcydzIEJ1ZmZlciBjbGFzc30uXG4gKlxuICogYGBganNcbiAqIGNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG4gKiBjb25zdCBiNThzdHI6ICA9IGJpbnRvb2xzLmJ1ZmZlclRvQjU4KEJ1ZmZlci5mcm9tKFwiV3ViYWx1YmFkdWJkdWIhXCIpKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCaW5Ub29scyB7XG4gIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBCaW5Ub29sc1xuXG4gIHByaXZhdGUgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5iNTggPSBCYXNlNTguZ2V0SW5zdGFuY2UoKVxuICB9XG5cbiAgcHJpdmF0ZSBiNTg6IEJhc2U1OFxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIEJpblRvb2xzIHNpbmdsZXRvbi5cbiAgICovXG4gIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBCaW5Ub29scyB7XG4gICAgaWYgKCFCaW5Ub29scy5pbnN0YW5jZSkge1xuICAgICAgQmluVG9vbHMuaW5zdGFuY2UgPSBuZXcgQmluVG9vbHMoKVxuICAgIH1cbiAgICByZXR1cm4gQmluVG9vbHMuaW5zdGFuY2VcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRydWUgaWYgYmFzZTY0LCBvdGhlcndpc2UgZmFsc2VcbiAgICogQHBhcmFtIHN0ciB0aGUgc3RyaW5nIHRvIHZlcmlmeSBpcyBCYXNlNjRcbiAgICovXG4gIGlzQmFzZTY0KHN0cjogc3RyaW5nKSB7XG4gICAgaWYgKHN0ciA9PT0gXCJcIiB8fCBzdHIudHJpbSgpID09PSBcIlwiKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGxldCBiNjQ6IEJ1ZmZlciA9IEJ1ZmZlci5mcm9tKHN0ciwgXCJiYXNlNjRcIilcbiAgICAgIHJldHVybiBiNjQudG9TdHJpbmcoXCJiYXNlNjRcIikgPT09IHN0clxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiBjYjU4LCBvdGhlcndpc2UgZmFsc2VcbiAgICogQHBhcmFtIGNiNTggdGhlIHN0cmluZyB0byB2ZXJpZnkgaXMgY2I1OFxuICAgKi9cbiAgaXNDQjU4KGNiNTg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlzQmFzZTU4KGNiNTgpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0cnVlIGlmIGJhc2U1OCwgb3RoZXJ3aXNlIGZhbHNlXG4gICAqIEBwYXJhbSBiYXNlNTggdGhlIHN0cmluZyB0byB2ZXJpZnkgaXMgYmFzZTU4XG4gICAqL1xuICBpc0Jhc2U1OChiYXNlNTg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmIChiYXNlNTggPT09IFwiXCIgfHwgYmFzZTU4LnRyaW0oKSA9PT0gXCJcIikge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gdGhpcy5iNTguZW5jb2RlKHRoaXMuYjU4LmRlY29kZShiYXNlNTgpKSA9PT0gYmFzZTU4XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0cnVlIGlmIGhleGlkZWNpbWFsLCBvdGhlcndpc2UgZmFsc2VcbiAgICogQHBhcmFtIGhleCB0aGUgc3RyaW5nIHRvIHZlcmlmeSBpcyBoZXhpZGVjaW1hbFxuICAgKi9cbiAgaXNIZXgoaGV4OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoaGV4ID09PSBcIlwiIHx8IGhleC50cmltKCkgPT09IFwiXCIpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBpZiAoXG4gICAgICAoaGV4LnN0YXJ0c1dpdGgoXCIweFwiKSAmJiBoZXguc2xpY2UoMikubWF0Y2goL15bMC05QS1GYS1mXS9nKSkgfHxcbiAgICAgIGhleC5tYXRjaCgvXlswLTlBLUZhLWZdL2cpXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0cnVlIGlmIGRlY2ltYWwsIG90aGVyd2lzZSBmYWxzZVxuICAgKiBAcGFyYW0gc3RyIHRoZSBzdHJpbmcgdG8gdmVyaWZ5IGlzIGhleGlkZWNpbWFsXG4gICAqL1xuICBpc0RlY2ltYWwoc3RyOiBzdHJpbmcpIHtcbiAgICBpZiAoc3RyID09PSBcIlwiIHx8IHN0ci50cmltKCkgPT09IFwiXCIpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIG5ldyBCTihzdHIsIDEwKS50b1N0cmluZygxMCkgPT09IHN0ci50cmltKClcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRydWUgaWYgbWVldHMgcmVxdWlyZW1lbnRzIHRvIHBhcnNlIGFzIGFuIGFkZHJlc3MgYXMgQmVjaDMyIG9uIFN3YXBDaGFpbiBvciBDb3JlQ2hhaW4sIG90aGVyd2lzZSBmYWxzZVxuICAgKiBAcGFyYW0gYWRkcmVzcyB0aGUgc3RyaW5nIHRvIHZlcmlmeSBpcyBhZGRyZXNzXG4gICAqL1xuICBpc1ByaW1hcnlCZWNoQWRkcmVzcyA9IChhZGRyZXNzOiBzdHJpbmcpOiBib29sZWFuID0+IHtcbiAgICBjb25zdCBwYXJ0czogc3RyaW5nW10gPSBhZGRyZXNzLnRyaW0oKS5zcGxpdChcIi1cIilcbiAgICBpZiAocGFydHMubGVuZ3RoICE9PSAyKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGJlY2gzMi5iZWNoMzIuZnJvbVdvcmRzKGJlY2gzMi5iZWNoMzIuZGVjb2RlKHBhcnRzWzFdKS53b3JkcylcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgLyoqXG4gICAqIFByb2R1Y2VzIGEgc3RyaW5nIGZyb20gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiByZXByZXNlbnRpbmcgYSBzdHJpbmcuIE9OTFkgVVNFRCBJTiBUUkFOU0FDVElPTiBGT1JNQVRUSU5HLCBBU1NVTUVEIExFTkdUSCBJUyBQUkVQRU5ERUQuXG4gICAqXG4gICAqIEBwYXJhbSBidWZmIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB0byBjb252ZXJ0IHRvIGEgc3RyaW5nXG4gICAqL1xuICBidWZmZXJUb1N0cmluZyA9IChidWZmOiBCdWZmZXIpOiBzdHJpbmcgPT5cbiAgICB0aGlzLmNvcHlGcm9tKGJ1ZmYsIDIpLnRvU3RyaW5nKFwidXRmOFwiKVxuXG4gIC8qKlxuICAgKiBQcm9kdWNlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZyb20gYSBzdHJpbmcuIE9OTFkgVVNFRCBJTiBUUkFOU0FDVElPTiBGT1JNQVRUSU5HLCBMRU5HVEggSVMgUFJFUEVOREVELlxuICAgKlxuICAgKiBAcGFyYW0gc3RyIFRoZSBzdHJpbmcgdG8gY29udmVydCB0byBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqL1xuICBzdHJpbmdUb0J1ZmZlciA9IChzdHI6IHN0cmluZyk6IEJ1ZmZlciA9PiB7XG4gICAgY29uc3QgYnVmZjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDIgKyBzdHIubGVuZ3RoKVxuICAgIGJ1ZmYud3JpdGVVSW50MTZCRShzdHIubGVuZ3RoLCAwKVxuICAgIGJ1ZmYud3JpdGUoc3RyLCAyLCBzdHIubGVuZ3RoLCBcInV0ZjhcIilcbiAgICByZXR1cm4gYnVmZlxuICB9XG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgY29weSAobm8gcmVmZXJlbmNlKSBvZiBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIG92ZXIgcHJvdmlkZWQgaW5kZWNpZXMuXG4gICAqXG4gICAqIEBwYXJhbSBidWZmIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB0byBjb3B5XG4gICAqIEBwYXJhbSBzdGFydCBUaGUgaW5kZXggdG8gc3RhcnQgdGhlIGNvcHlcbiAgICogQHBhcmFtIGVuZCBUaGUgaW5kZXggdG8gZW5kIHRoZSBjb3B5XG4gICAqL1xuICBjb3B5RnJvbSA9IChcbiAgICBidWZmOiBCdWZmZXIsXG4gICAgc3RhcnQ6IG51bWJlciA9IDAsXG4gICAgZW5kOiBudW1iZXIgPSB1bmRlZmluZWRcbiAgKTogQnVmZmVyID0+IHtcbiAgICBpZiAoZW5kID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGVuZCA9IGJ1ZmYubGVuZ3RoXG4gICAgfVxuICAgIHJldHVybiBCdWZmZXIuZnJvbShVaW50OEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGJ1ZmYuc2xpY2Uoc3RhcnQsIGVuZCkpKVxuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gYW5kIHJldHVybnMgYSBiYXNlLTU4IHN0cmluZyBvZlxuICAgKiB0aGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0uXG4gICAqXG4gICAqIEBwYXJhbSBidWZmIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB0byBjb252ZXJ0IHRvIGJhc2UtNThcbiAgICovXG4gIGJ1ZmZlclRvQjU4ID0gKGJ1ZmY6IEJ1ZmZlcik6IHN0cmluZyA9PiB0aGlzLmI1OC5lbmNvZGUoYnVmZilcblxuICAvKipcbiAgICogVGFrZXMgYSBiYXNlLTU4IHN0cmluZyBhbmQgcmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9LlxuICAgKlxuICAgKiBAcGFyYW0gYjU4c3RyIFRoZSBiYXNlLTU4IHN0cmluZyB0byBjb252ZXJ0XG4gICAqIHRvIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICovXG4gIGI1OFRvQnVmZmVyID0gKGI1OHN0cjogc3RyaW5nKTogQnVmZmVyID0+IHRoaXMuYjU4LmRlY29kZShiNThzdHIpXG5cbiAgLyoqXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gYW5kIHJldHVybnMgYW4gQXJyYXlCdWZmZXIuXG4gICAqXG4gICAqIEBwYXJhbSBidWZmIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB0b1xuICAgKiBjb252ZXJ0IHRvIGFuIEFycmF5QnVmZmVyXG4gICAqL1xuICBmcm9tQnVmZmVyVG9BcnJheUJ1ZmZlciA9IChidWZmOiBCdWZmZXIpOiBBcnJheUJ1ZmZlciA9PiB7XG4gICAgY29uc3QgYWIgPSBuZXcgQXJyYXlCdWZmZXIoYnVmZi5sZW5ndGgpXG4gICAgY29uc3QgdmlldyA9IG5ldyBVaW50OEFycmF5KGFiKVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBidWZmLmxlbmd0aDsgKytpKSB7XG4gICAgICB2aWV3W2Ake2l9YF0gPSBidWZmW2Ake2l9YF1cbiAgICB9XG4gICAgcmV0dXJuIHZpZXdcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhbiBBcnJheUJ1ZmZlciBhbmQgY29udmVydHMgaXQgdG8gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfS5cbiAgICpcbiAgICogQHBhcmFtIGFiIFRoZSBBcnJheUJ1ZmZlciB0byBjb252ZXJ0IHRvIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICovXG4gIGZyb21BcnJheUJ1ZmZlclRvQnVmZmVyID0gKGFiOiBBcnJheUJ1ZmZlcik6IEJ1ZmZlciA9PiB7XG4gICAgY29uc3QgYnVmID0gQnVmZmVyLmFsbG9jKGFiLmJ5dGVMZW5ndGgpXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IGFiLmJ5dGVMZW5ndGg7ICsraSkge1xuICAgICAgYnVmW2Ake2l9YF0gPSBhYltgJHtpfWBdXG4gICAgfVxuICAgIHJldHVybiBidWZcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGFuZCBjb252ZXJ0cyBpdFxuICAgKiB0byBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59LlxuICAgKlxuICAgKiBAcGFyYW0gYnVmZiBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gdG8gY29udmVydFxuICAgKiB0byBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBmcm9tQnVmZmVyVG9CTiA9IChidWZmOiBCdWZmZXIpOiBCTiA9PiB7XG4gICAgaWYgKHR5cGVvZiBidWZmID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuICAgIHJldHVybiBuZXcgQk4oYnVmZi50b1N0cmluZyhcImhleFwiKSwgMTYsIFwiYmVcIilcbiAgfVxuICAvKipcbiAgICogVGFrZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBhbmQgY29udmVydHMgaXRcbiAgICogdG8gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfS5cbiAgICpcbiAgICogQHBhcmFtIGJuIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSB0byBjb252ZXJ0XG4gICAqIHRvIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIGxlbmd0aCBUaGUgemVyby1wYWRkZWQgbGVuZ3RoIG9mIHRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKi9cbiAgZnJvbUJOVG9CdWZmZXIgPSAoYm46IEJOLCBsZW5ndGg/OiBudW1iZXIpOiBCdWZmZXIgPT4ge1xuICAgIGlmICh0eXBlb2YgYm4gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG4gICAgY29uc3QgbmV3YXJyID0gYm4udG9BcnJheShcImJlXCIpXG4gICAgLyoqXG4gICAgICogQ0tDOiBTdGlsbCB1bnN1cmUgd2h5IGJuLnRvQXJyYXkgd2l0aCBhIFwiYmVcIiBhbmQgYSBsZW5ndGggZG8gbm90IHdvcmsgcmlnaHQuIEJ1Zz9cbiAgICAgKi9cbiAgICBpZiAobGVuZ3RoKSB7XG4gICAgICAvLyBibiB0b0FycmF5IHdpdGggdGhlIGxlbmd0aCBwYXJhbWV0ZXIgZG9lc24ndCB3b3JrIGNvcnJlY3RseSwgbmVlZCB0aGlzLlxuICAgICAgY29uc3QgeCA9IGxlbmd0aCAtIG5ld2Fyci5sZW5ndGhcbiAgICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB4OyBpKyspIHtcbiAgICAgICAgbmV3YXJyLnVuc2hpZnQoMClcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKG5ld2FycilcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGFuZCBhZGRzIGEgY2hlY2tzdW0sIHJldHVybmluZ1xuICAgKiBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdpdGggdGhlIDQtYnl0ZSBjaGVja3N1bSBhcHBlbmRlZC5cbiAgICpcbiAgICogQHBhcmFtIGJ1ZmYgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHRvIGFwcGVuZCBhIGNoZWNrc3VtXG4gICAqL1xuICBhZGRDaGVja3N1bSA9IChidWZmOiBCdWZmZXIpOiBCdWZmZXIgPT4ge1xuICAgIGNvbnN0IGhhc2hzbGljZTogQnVmZmVyID0gQnVmZmVyLmZyb20oXG4gICAgICBjcmVhdGVIYXNoKFwic2hhMjU2XCIpLnVwZGF0ZShidWZmKS5kaWdlc3QoKS5zbGljZSgyOClcbiAgICApXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoW2J1ZmYsIGhhc2hzbGljZV0pXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aXRoIGFuIGFwcGVuZGVkIDQtYnl0ZSBjaGVja3N1bVxuICAgKiBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSBjaGVja3N1bSBpcyB2YWxpZCwgb3RoZXJ3aXNlIGZhbHNlLlxuICAgKlxuICAgKiBAcGFyYW0gYiBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gdG8gdmFsaWRhdGUgdGhlIGNoZWNrc3VtXG4gICAqL1xuICB2YWxpZGF0ZUNoZWNrc3VtID0gKGJ1ZmY6IEJ1ZmZlcik6IGJvb2xlYW4gPT4ge1xuICAgIGNvbnN0IGNoZWNrc2xpY2U6IEJ1ZmZlciA9IGJ1ZmYuc2xpY2UoYnVmZi5sZW5ndGggLSA0KVxuICAgIGNvbnN0IGhhc2hzbGljZTogQnVmZmVyID0gQnVmZmVyLmZyb20oXG4gICAgICBjcmVhdGVIYXNoKFwic2hhMjU2XCIpXG4gICAgICAgIC51cGRhdGUoYnVmZi5zbGljZSgwLCBidWZmLmxlbmd0aCAtIDQpKVxuICAgICAgICAuZGlnZXN0KClcbiAgICAgICAgLnNsaWNlKDI4KVxuICAgIClcbiAgICByZXR1cm4gY2hlY2tzbGljZS50b1N0cmluZyhcImhleFwiKSA9PT0gaGFzaHNsaWNlLnRvU3RyaW5nKFwiaGV4XCIpXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBhbmQgcmV0dXJucyBhIGJhc2UtNTggc3RyaW5nIHdpdGhcbiAgICogY2hlY2tzdW0gYXMgcGVyIHRoZSBjYjU4IHN0YW5kYXJkLlxuICAgKlxuICAgKiBAcGFyYW0gYnl0ZXMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB0byBzZXJpYWxpemVcbiAgICpcbiAgICogQHJldHVybnMgQSBzZXJpYWxpemVkIGJhc2UtNTggc3RyaW5nIG9mIHRoZSBCdWZmZXIuXG4gICAqL1xuICBjYjU4RW5jb2RlID0gKGJ5dGVzOiBCdWZmZXIpOiBzdHJpbmcgPT4ge1xuICAgIGNvbnN0IHg6IEJ1ZmZlciA9IHRoaXMuYWRkQ2hlY2tzdW0oYnl0ZXMpXG4gICAgcmV0dXJuIHRoaXMuYnVmZmVyVG9CNTgoeClcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIGNiNTggc2VyaWFsaXplZCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBiYXNlLTU4IHN0cmluZ1xuICAgKiBhbmQgcmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBvcmlnaW5hbCBkYXRhLiBUaHJvd3Mgb24gZXJyb3IuXG4gICAqXG4gICAqIEBwYXJhbSBieXRlcyBBIGNiNTggc2VyaWFsaXplZCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBiYXNlLTU4IHN0cmluZ1xuICAgKi9cbiAgY2I1OERlY29kZSA9IChieXRlczogQnVmZmVyIHwgc3RyaW5nKTogQnVmZmVyID0+IHtcbiAgICBpZiAodHlwZW9mIGJ5dGVzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBieXRlcyA9IHRoaXMuYjU4VG9CdWZmZXIoYnl0ZXMpXG4gICAgfVxuICAgIGlmICh0aGlzLnZhbGlkYXRlQ2hlY2tzdW0oYnl0ZXMpKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb3B5RnJvbShieXRlcywgMCwgYnl0ZXMubGVuZ3RoIC0gNClcbiAgICB9XG4gICAgdGhyb3cgbmV3IENoZWNrc3VtRXJyb3IoXCJFcnJvciAtIEJpblRvb2xzLmNiNThEZWNvZGU6IGludmFsaWQgY2hlY2tzdW1cIilcbiAgfVxuXG4gIGFkZHJlc3NUb1N0cmluZyA9IChocnA6IHN0cmluZywgY2hhaW5pZDogc3RyaW5nLCBieXRlczogQnVmZmVyKTogc3RyaW5nID0+XG4gICAgYCR7Y2hhaW5pZH0tJHtiZWNoMzIuYmVjaDMyLmVuY29kZShocnAsIGJlY2gzMi5iZWNoMzIudG9Xb3JkcyhieXRlcykpfWBcblxuICBzdHJpbmdUb0FkZHJlc3MgPSAoYWRkcmVzczogc3RyaW5nLCBocnA/OiBzdHJpbmcpOiBCdWZmZXIgPT4ge1xuICAgIGlmIChhZGRyZXNzLnN1YnN0cmluZygwLCAyKSA9PT0gXCIweFwiKSB7XG4gICAgICAvLyBFVEgtc3R5bGUgYWRkcmVzc1xuICAgICAgaWYgKHV0aWxzLmlzQWRkcmVzcyhhZGRyZXNzKSkge1xuICAgICAgICByZXR1cm4gQnVmZmVyLmZyb20oYWRkcmVzcy5zdWJzdHJpbmcoMiksIFwiaGV4XCIpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgSGV4RXJyb3IoXCJFcnJvciAtIEludmFsaWQgYWRkcmVzc1wiKVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBCZWNoMzIgYWRkcmVzc2VzXG4gICAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gYWRkcmVzcy50cmltKCkuc3BsaXQoXCItXCIpXG5cbiAgICBpZiAocGFydHMubGVuZ3RoIDwgMikge1xuICAgICAgdGhyb3cgbmV3IEJlY2gzMkVycm9yKFwiRXJyb3IgLSBWYWxpZCBhZGRyZXNzIHNob3VsZCBpbmNsdWRlIC1cIilcbiAgICB9XG5cbiAgICBpZiAocGFydHNbMF0ubGVuZ3RoIDwgMSkge1xuICAgICAgdGhyb3cgbmV3IEJlY2gzMkVycm9yKFwiRXJyb3IgLSBWYWxpZCBhZGRyZXNzIG11c3QgaGF2ZSBwcmVmaXggYmVmb3JlIC1cIilcbiAgICB9XG5cbiAgICBjb25zdCBzcGxpdDogbnVtYmVyID0gcGFydHNbMV0ubGFzdEluZGV4T2YoXCIxXCIpXG4gICAgaWYgKHNwbGl0IDwgMCkge1xuICAgICAgdGhyb3cgbmV3IEJlY2gzMkVycm9yKFwiRXJyb3IgLSBWYWxpZCBhZGRyZXNzIG11c3QgaW5jbHVkZSBzZXBhcmF0b3IgKDEpXCIpXG4gICAgfVxuXG4gICAgY29uc3QgaHVtYW5SZWFkYWJsZVBhcnQ6IHN0cmluZyA9IHBhcnRzWzFdLnNsaWNlKDAsIHNwbGl0KVxuICAgIGlmIChodW1hblJlYWRhYmxlUGFydC5sZW5ndGggPCAxKSB7XG4gICAgICB0aHJvdyBuZXcgQmVjaDMyRXJyb3IoXCJFcnJvciAtIEhSUCBzaG91bGQgYmUgYXQgbGVhc3QgMSBjaGFyYWN0ZXJcIilcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBodW1hblJlYWRhYmxlUGFydCAhPT0gXCJheGNcIiAmJlxuICAgICAgaHVtYW5SZWFkYWJsZVBhcnQgIT09IFwiZnVqaVwiICYmXG4gICAgICBodW1hblJlYWRhYmxlUGFydCAhPSBcImxvY2FsXCIgJiZcbiAgICAgIGh1bWFuUmVhZGFibGVQYXJ0ICE9IFwiY3VzdG9tXCIgJiZcbiAgICAgIGh1bWFuUmVhZGFibGVQYXJ0ICE9IGhycFxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEJlY2gzMkVycm9yKFwiRXJyb3IgLSBJbnZhbGlkIEhSUFwiKVxuICAgIH1cblxuICAgIHJldHVybiBCdWZmZXIuZnJvbShcbiAgICAgIGJlY2gzMi5iZWNoMzIuZnJvbVdvcmRzKGJlY2gzMi5iZWNoMzIuZGVjb2RlKHBhcnRzWzFdKS53b3JkcylcbiAgICApXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYW4gYWRkcmVzcyBhbmQgcmV0dXJucyBpdHMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogcmVwcmVzZW50YXRpb24gaWYgdmFsaWQuIEEgbW9yZSBzdHJpY3QgdmVyc2lvbiBvZiBzdHJpbmdUb0FkZHJlc3MuXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyIEEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBhZGRyZXNzXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgQSBjYjU4IGVuY29kZWQgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBibG9ja2NoYWluSURcbiAgICogQHBhcmFtIGFsaWFzIEEgY2hhaW5JRCBhbGlhcywgaWYgYW55LCB0aGF0IHRoZSBhZGRyZXNzIGNhbiBhbHNvIHBhcnNlIGZyb20uXG4gICAqIEBwYXJhbSBhZGRybGVuIFZNcyBjYW4gdXNlIGFueSBhZGRyZXNzaW5nIHNjaGVtZSB0aGF0IHRoZXkgbGlrZSwgc28gdGhpcyBpcyB0aGUgYXBwcm9wcmlhdGUgbnVtYmVyIG9mIGFkZHJlc3MgYnl0ZXMuIERlZmF1bHQgMjAuXG4gICAqXG4gICAqIEByZXR1cm5zIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBhZGRyZXNzIGlmIHZhbGlkLFxuICAgKiB1bmRlZmluZWQgaWYgbm90IHZhbGlkLlxuICAgKi9cbiAgcGFyc2VBZGRyZXNzID0gKFxuICAgIGFkZHI6IHN0cmluZyxcbiAgICBibG9ja2NoYWluSUQ6IHN0cmluZyxcbiAgICBhbGlhczogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIGFkZHJsZW46IG51bWJlciA9IDIwXG4gICk6IEJ1ZmZlciA9PiB7XG4gICAgY29uc3QgYWJjOiBzdHJpbmdbXSA9IGFkZHIuc3BsaXQoXCItXCIpXG4gICAgaWYgKFxuICAgICAgYWJjLmxlbmd0aCA9PT0gMiAmJlxuICAgICAgKChhbGlhcyAmJiBhYmNbMF0gPT09IGFsaWFzKSB8fCAoYmxvY2tjaGFpbklEICYmIGFiY1swXSA9PT0gYmxvY2tjaGFpbklEKSlcbiAgICApIHtcbiAgICAgIGNvbnN0IGFkZHJidWZmID0gdGhpcy5zdHJpbmdUb0FkZHJlc3MoYWRkcilcbiAgICAgIGlmICgoYWRkcmxlbiAmJiBhZGRyYnVmZi5sZW5ndGggPT09IGFkZHJsZW4pIHx8ICFhZGRybGVuKSB7XG4gICAgICAgIHJldHVybiBhZGRyYnVmZlxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkXG4gIH1cbn1cbiJdfQ==