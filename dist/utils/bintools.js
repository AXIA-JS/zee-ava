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
         * Returns true if meets requirements to parse as an address as Bech32 on AssetChain or CoreChain, otherwise false
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmludG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvdXRpbHMvYmludG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7R0FHRztBQUNILGtEQUFzQjtBQUN0QixvQ0FBZ0M7QUFDaEMsOERBQW9DO0FBQ3BDLCtDQUFnQztBQUNoQyxxQ0FBaUM7QUFDakMsNENBQXNFO0FBQ3RFLG1DQUE4QjtBQUU5Qjs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCxNQUFxQixRQUFRO0lBRzNCO1FBd0ZBOzs7V0FHRztRQUNILHlCQUFvQixHQUFHLENBQUMsT0FBZSxFQUFXLEVBQUU7WUFDbEQsTUFBTSxLQUFLLEdBQWEsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUNqRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUN0QixPQUFPLEtBQUssQ0FBQTthQUNiO1lBQ0QsSUFBSTtnQkFDRixNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQTthQUM5RDtZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUNaLE9BQU8sS0FBSyxDQUFBO2FBQ2I7WUFDRCxPQUFPLElBQUksQ0FBQTtRQUNiLENBQUMsQ0FBQTtRQUVEOzs7OztXQUtHO1FBQ0gsbUJBQWMsR0FBRyxDQUFDLElBQVksRUFBVSxFQUFFLENBQ3hDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUV6Qzs7OztXQUlHO1FBQ0gsbUJBQWMsR0FBRyxDQUFDLEdBQVcsRUFBVSxFQUFFO1lBQ3ZDLE1BQU0sSUFBSSxHQUFXLGVBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUNqRCxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDakMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUE7WUFDdEMsT0FBTyxJQUFJLENBQUE7UUFDYixDQUFDLENBQUE7UUFFRDs7Ozs7OztXQU9HO1FBQ0gsYUFBUSxHQUFHLENBQ1QsSUFBWSxFQUNaLFFBQWdCLENBQUMsRUFDakIsTUFBYyxTQUFTLEVBQ2YsRUFBRTtZQUNWLElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRTtnQkFDckIsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUE7YUFDbEI7WUFDRCxPQUFPLGVBQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUM3RSxDQUFDLENBQUE7UUFFRDs7Ozs7V0FLRztRQUNILGdCQUFXLEdBQUcsQ0FBQyxJQUFZLEVBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBRTdEOzs7OztXQUtHO1FBQ0gsZ0JBQVcsR0FBRyxDQUFDLE1BQWMsRUFBVSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7UUFFakU7Ozs7O1dBS0c7UUFDSCw0QkFBdUIsR0FBRyxDQUFDLElBQVksRUFBZSxFQUFFO1lBQ3RELE1BQU0sRUFBRSxHQUFHLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUN2QyxNQUFNLElBQUksR0FBRyxJQUFJLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUMvQixLQUFLLElBQUksQ0FBQyxHQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtnQkFDNUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO2FBQzVCO1lBQ0QsT0FBTyxJQUFJLENBQUE7UUFDYixDQUFDLENBQUE7UUFFRDs7OztXQUlHO1FBQ0gsNEJBQXVCLEdBQUcsQ0FBQyxFQUFlLEVBQVUsRUFBRTtZQUNwRCxNQUFNLEdBQUcsR0FBRyxlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUN2QyxLQUFLLElBQUksQ0FBQyxHQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsRUFBRTtnQkFDOUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFBO2FBQ3pCO1lBQ0QsT0FBTyxHQUFHLENBQUE7UUFDWixDQUFDLENBQUE7UUFFRDs7Ozs7O1dBTUc7UUFDSCxtQkFBYyxHQUFHLENBQUMsSUFBWSxFQUFNLEVBQUU7WUFDcEMsSUFBSSxPQUFPLElBQUksS0FBSyxXQUFXLEVBQUU7Z0JBQy9CLE9BQU8sU0FBUyxDQUFBO2FBQ2pCO1lBQ0QsT0FBTyxJQUFJLGVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQUMvQyxDQUFDLENBQUE7UUFDRDs7Ozs7OztXQU9HO1FBQ0gsbUJBQWMsR0FBRyxDQUFDLEVBQU0sRUFBRSxNQUFlLEVBQVUsRUFBRTtZQUNuRCxJQUFJLE9BQU8sRUFBRSxLQUFLLFdBQVcsRUFBRTtnQkFDN0IsT0FBTyxTQUFTLENBQUE7YUFDakI7WUFDRCxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQy9COztlQUVHO1lBQ0gsSUFBSSxNQUFNLEVBQUU7Z0JBQ1YsMEVBQTBFO2dCQUMxRSxNQUFNLENBQUMsR0FBRyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQTtnQkFDaEMsS0FBSyxJQUFJLENBQUMsR0FBVyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDbEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQTtpQkFDbEI7YUFDRjtZQUNELE9BQU8sZUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUM1QixDQUFDLENBQUE7UUFFRDs7Ozs7V0FLRztRQUNILGdCQUFXLEdBQUcsQ0FBQyxJQUFZLEVBQVUsRUFBRTtZQUNyQyxNQUFNLFNBQVMsR0FBVyxlQUFNLENBQUMsSUFBSSxDQUNuQyxJQUFBLHFCQUFVLEVBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FDckQsQ0FBQTtZQUNELE9BQU8sZUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFBO1FBQ3pDLENBQUMsQ0FBQTtRQUVEOzs7OztXQUtHO1FBQ0gscUJBQWdCLEdBQUcsQ0FBQyxJQUFZLEVBQVcsRUFBRTtZQUMzQyxNQUFNLFVBQVUsR0FBVyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUE7WUFDdEQsTUFBTSxTQUFTLEdBQVcsZUFBTSxDQUFDLElBQUksQ0FDbkMsSUFBQSxxQkFBVSxFQUFDLFFBQVEsQ0FBQztpQkFDakIsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7aUJBQ3RDLE1BQU0sRUFBRTtpQkFDUixLQUFLLENBQUMsRUFBRSxDQUFDLENBQ2IsQ0FBQTtZQUNELE9BQU8sVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ2pFLENBQUMsQ0FBQTtRQUVEOzs7Ozs7O1dBT0c7UUFDSCxlQUFVLEdBQUcsQ0FBQyxLQUFhLEVBQVUsRUFBRTtZQUNyQyxNQUFNLENBQUMsR0FBVyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQ3pDLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUM1QixDQUFDLENBQUE7UUFFRDs7Ozs7V0FLRztRQUNILGVBQVUsR0FBRyxDQUFDLEtBQXNCLEVBQVUsRUFBRTtZQUM5QyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtnQkFDN0IsS0FBSyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUE7YUFDaEM7WUFDRCxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDaEMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQTthQUNqRDtZQUNELE1BQU0sSUFBSSxzQkFBYSxDQUFDLCtDQUErQyxDQUFDLENBQUE7UUFDMUUsQ0FBQyxDQUFBO1FBRUQsb0JBQWUsR0FBRyxDQUFDLEdBQVcsRUFBRSxPQUFlLEVBQUUsS0FBYSxFQUFVLEVBQUUsQ0FDeEUsR0FBRyxPQUFPLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQTtRQUV6RSxvQkFBZSxHQUFHLENBQUMsT0FBZSxFQUFFLEdBQVksRUFBVSxFQUFFO1lBQzFELElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUNwQyxvQkFBb0I7Z0JBQ3BCLElBQUksY0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRTtvQkFDNUIsT0FBTyxlQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUE7aUJBQ2hEO3FCQUFNO29CQUNMLE1BQU0sSUFBSSxpQkFBUSxDQUFDLHlCQUF5QixDQUFDLENBQUE7aUJBQzlDO2FBQ0Y7WUFDRCxtQkFBbUI7WUFDbkIsTUFBTSxLQUFLLEdBQWEsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUVqRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUNwQixNQUFNLElBQUksb0JBQVcsQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFBO2FBQ2hFO1lBRUQsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDdkIsTUFBTSxJQUFJLG9CQUFXLENBQUMsaURBQWlELENBQUMsQ0FBQTthQUN6RTtZQUVELE1BQU0sS0FBSyxHQUFXLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDL0MsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFO2dCQUNiLE1BQU0sSUFBSSxvQkFBVyxDQUFDLGtEQUFrRCxDQUFDLENBQUE7YUFDMUU7WUFFRCxNQUFNLGlCQUFpQixHQUFXLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1lBQzFELElBQUksaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDaEMsTUFBTSxJQUFJLG9CQUFXLENBQUMsNENBQTRDLENBQUMsQ0FBQTthQUNwRTtZQUVELElBQ0UsaUJBQWlCLEtBQUssS0FBSztnQkFDM0IsaUJBQWlCLEtBQUssTUFBTTtnQkFDNUIsaUJBQWlCLElBQUksT0FBTztnQkFDNUIsaUJBQWlCLElBQUksUUFBUTtnQkFDN0IsaUJBQWlCLElBQUksR0FBRyxFQUN4QjtnQkFDQSxNQUFNLElBQUksb0JBQVcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFBO2FBQzdDO1lBRUQsT0FBTyxlQUFNLENBQUMsSUFBSSxDQUNoQixNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FDOUQsQ0FBQTtRQUNILENBQUMsQ0FBQTtRQUVEOzs7Ozs7Ozs7OztXQVdHO1FBQ0gsaUJBQVksR0FBRyxDQUNiLElBQVksRUFDWixZQUFvQixFQUNwQixRQUFnQixTQUFTLEVBQ3pCLFVBQWtCLEVBQUUsRUFDWixFQUFFO1lBQ1YsTUFBTSxHQUFHLEdBQWEsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUNyQyxJQUNFLEdBQUcsQ0FBQyxNQUFNLEtBQUssQ0FBQztnQkFDaEIsQ0FBQyxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLFlBQVksQ0FBQyxDQUFDLEVBQzFFO2dCQUNBLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUE7Z0JBQzNDLElBQUksQ0FBQyxPQUFPLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtvQkFDeEQsT0FBTyxRQUFRLENBQUE7aUJBQ2hCO2FBQ0Y7WUFDRCxPQUFPLFNBQVMsQ0FBQTtRQUNsQixDQUFDLENBQUE7UUEzV0MsSUFBSSxDQUFDLEdBQUcsR0FBRyxlQUFNLENBQUMsV0FBVyxFQUFFLENBQUE7SUFDakMsQ0FBQztJQUlEOztPQUVHO0lBQ0gsTUFBTSxDQUFDLFdBQVc7UUFDaEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUU7WUFDdEIsUUFBUSxDQUFDLFFBQVEsR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFBO1NBQ25DO1FBQ0QsT0FBTyxRQUFRLENBQUMsUUFBUSxDQUFBO0lBQzFCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxRQUFRLENBQUMsR0FBVztRQUNsQixJQUFJLEdBQUcsS0FBSyxFQUFFLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNuQyxPQUFPLEtBQUssQ0FBQTtTQUNiO1FBQ0QsSUFBSTtZQUNGLElBQUksR0FBRyxHQUFXLGVBQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFBO1lBQzVDLE9BQU8sR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxHQUFHLENBQUE7U0FDdEM7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sS0FBSyxDQUFBO1NBQ2I7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsTUFBTSxDQUFDLElBQVk7UUFDakIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQzVCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxRQUFRLENBQUMsTUFBYztRQUNyQixJQUFJLE1BQU0sS0FBSyxFQUFFLElBQUksTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUN6QyxPQUFPLEtBQUssQ0FBQTtTQUNiO1FBQ0QsSUFBSTtZQUNGLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxNQUFNLENBQUE7U0FDM0Q7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sS0FBSyxDQUFBO1NBQ2I7SUFDSCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLEdBQVc7UUFDZixJQUFJLEdBQUcsS0FBSyxFQUFFLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNuQyxPQUFPLEtBQUssQ0FBQTtTQUNiO1FBQ0QsSUFDRSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDN0QsR0FBRyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsRUFDMUI7WUFDQSxPQUFPLElBQUksQ0FBQTtTQUNaO2FBQU07WUFDTCxPQUFPLEtBQUssQ0FBQTtTQUNiO0lBQ0gsQ0FBQztJQUVEOzs7T0FHRztJQUNILFNBQVMsQ0FBQyxHQUFXO1FBQ25CLElBQUksR0FBRyxLQUFLLEVBQUUsSUFBSSxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQ25DLE9BQU8sS0FBSyxDQUFBO1NBQ2I7UUFDRCxJQUFJO1lBQ0YsT0FBTyxJQUFJLGVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtTQUNuRDtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxLQUFLLENBQUE7U0FDYjtJQUNILENBQUM7Q0F1UkY7QUFoWEQsMkJBZ1hDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgVXRpbHMtQmluVG9vbHNcbiAqL1xuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgY3JlYXRlSGFzaCBmcm9tIFwiY3JlYXRlLWhhc2hcIlxuaW1wb3J0ICogYXMgYmVjaDMyIGZyb20gXCJiZWNoMzJcIlxuaW1wb3J0IHsgQmFzZTU4IH0gZnJvbSBcIi4vYmFzZTU4XCJcbmltcG9ydCB7IEJlY2gzMkVycm9yLCBDaGVja3N1bUVycm9yLCBIZXhFcnJvciB9IGZyb20gXCIuLi91dGlscy9lcnJvcnNcIlxuaW1wb3J0IHsgdXRpbHMgfSBmcm9tIFwiZXRoZXJzXCJcblxuLyoqXG4gKiBBIGNsYXNzIGNvbnRhaW5pbmcgdG9vbHMgdXNlZnVsIGluIGludGVyYWN0aW5nIHdpdGggYmluYXJ5IGRhdGEgY3Jvc3MtcGxhdGZvcm0gdXNpbmdcbiAqIG5vZGVqcyAmIGphdmFzY3JpcHQuXG4gKlxuICogVGhpcyBjbGFzcyBzaG91bGQgbmV2ZXIgYmUgaW5zdGFudGlhdGVkIGRpcmVjdGx5LiBJbnN0ZWFkLFxuICogaW52b2tlIHRoZSBcIkJpblRvb2xzLmdldEluc3RhbmNlKClcIiBzdGF0aWMgKiBmdW5jdGlvbiB0byBncmFiIHRoZSBzaW5nbGV0b25cbiAqIGluc3RhbmNlIG9mIHRoZSB0b29scy5cbiAqXG4gKiBFdmVyeXRoaW5nIGluIHRoaXMgbGlicmFyeSB1c2VzXG4gKiB0aGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfGZlcm9zcydzIEJ1ZmZlciBjbGFzc30uXG4gKlxuICogYGBganNcbiAqIGNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKCk7XG4gKiBjb25zdCBiNThzdHI6ICA9IGJpbnRvb2xzLmJ1ZmZlclRvQjU4KEJ1ZmZlci5mcm9tKFwiV3ViYWx1YmFkdWJkdWIhXCIpKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCaW5Ub29scyB7XG4gIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBCaW5Ub29sc1xuXG4gIHByaXZhdGUgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5iNTggPSBCYXNlNTguZ2V0SW5zdGFuY2UoKVxuICB9XG5cbiAgcHJpdmF0ZSBiNTg6IEJhc2U1OFxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIEJpblRvb2xzIHNpbmdsZXRvbi5cbiAgICovXG4gIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBCaW5Ub29scyB7XG4gICAgaWYgKCFCaW5Ub29scy5pbnN0YW5jZSkge1xuICAgICAgQmluVG9vbHMuaW5zdGFuY2UgPSBuZXcgQmluVG9vbHMoKVxuICAgIH1cbiAgICByZXR1cm4gQmluVG9vbHMuaW5zdGFuY2VcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRydWUgaWYgYmFzZTY0LCBvdGhlcndpc2UgZmFsc2VcbiAgICogQHBhcmFtIHN0ciB0aGUgc3RyaW5nIHRvIHZlcmlmeSBpcyBCYXNlNjRcbiAgICovXG4gIGlzQmFzZTY0KHN0cjogc3RyaW5nKSB7XG4gICAgaWYgKHN0ciA9PT0gXCJcIiB8fCBzdHIudHJpbSgpID09PSBcIlwiKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGxldCBiNjQ6IEJ1ZmZlciA9IEJ1ZmZlci5mcm9tKHN0ciwgXCJiYXNlNjRcIilcbiAgICAgIHJldHVybiBiNjQudG9TdHJpbmcoXCJiYXNlNjRcIikgPT09IHN0clxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiBjYjU4LCBvdGhlcndpc2UgZmFsc2VcbiAgICogQHBhcmFtIGNiNTggdGhlIHN0cmluZyB0byB2ZXJpZnkgaXMgY2I1OFxuICAgKi9cbiAgaXNDQjU4KGNiNTg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlzQmFzZTU4KGNiNTgpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0cnVlIGlmIGJhc2U1OCwgb3RoZXJ3aXNlIGZhbHNlXG4gICAqIEBwYXJhbSBiYXNlNTggdGhlIHN0cmluZyB0byB2ZXJpZnkgaXMgYmFzZTU4XG4gICAqL1xuICBpc0Jhc2U1OChiYXNlNTg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmIChiYXNlNTggPT09IFwiXCIgfHwgYmFzZTU4LnRyaW0oKSA9PT0gXCJcIikge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gdGhpcy5iNTguZW5jb2RlKHRoaXMuYjU4LmRlY29kZShiYXNlNTgpKSA9PT0gYmFzZTU4XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0cnVlIGlmIGhleGlkZWNpbWFsLCBvdGhlcndpc2UgZmFsc2VcbiAgICogQHBhcmFtIGhleCB0aGUgc3RyaW5nIHRvIHZlcmlmeSBpcyBoZXhpZGVjaW1hbFxuICAgKi9cbiAgaXNIZXgoaGV4OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoaGV4ID09PSBcIlwiIHx8IGhleC50cmltKCkgPT09IFwiXCIpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICBpZiAoXG4gICAgICAoaGV4LnN0YXJ0c1dpdGgoXCIweFwiKSAmJiBoZXguc2xpY2UoMikubWF0Y2goL15bMC05QS1GYS1mXS9nKSkgfHxcbiAgICAgIGhleC5tYXRjaCgvXlswLTlBLUZhLWZdL2cpXG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0cnVlIGlmIGRlY2ltYWwsIG90aGVyd2lzZSBmYWxzZVxuICAgKiBAcGFyYW0gc3RyIHRoZSBzdHJpbmcgdG8gdmVyaWZ5IGlzIGhleGlkZWNpbWFsXG4gICAqL1xuICBpc0RlY2ltYWwoc3RyOiBzdHJpbmcpIHtcbiAgICBpZiAoc3RyID09PSBcIlwiIHx8IHN0ci50cmltKCkgPT09IFwiXCIpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIG5ldyBCTihzdHIsIDEwKS50b1N0cmluZygxMCkgPT09IHN0ci50cmltKClcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRydWUgaWYgbWVldHMgcmVxdWlyZW1lbnRzIHRvIHBhcnNlIGFzIGFuIGFkZHJlc3MgYXMgQmVjaDMyIG9uIEFzc2V0Q2hhaW4gb3IgQ29yZUNoYWluLCBvdGhlcndpc2UgZmFsc2VcbiAgICogQHBhcmFtIGFkZHJlc3MgdGhlIHN0cmluZyB0byB2ZXJpZnkgaXMgYWRkcmVzc1xuICAgKi9cbiAgaXNQcmltYXJ5QmVjaEFkZHJlc3MgPSAoYWRkcmVzczogc3RyaW5nKTogYm9vbGVhbiA9PiB7XG4gICAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gYWRkcmVzcy50cmltKCkuc3BsaXQoXCItXCIpXG4gICAgaWYgKHBhcnRzLmxlbmd0aCAhPT0gMikge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBiZWNoMzIuYmVjaDMyLmZyb21Xb3JkcyhiZWNoMzIuYmVjaDMyLmRlY29kZShwYXJ0c1sxXSkud29yZHMpXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9kdWNlcyBhIHN0cmluZyBmcm9tIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogcmVwcmVzZW50aW5nIGEgc3RyaW5nLiBPTkxZIFVTRUQgSU4gVFJBTlNBQ1RJT04gRk9STUFUVElORywgQVNTVU1FRCBMRU5HVEggSVMgUFJFUEVOREVELlxuICAgKlxuICAgKiBAcGFyYW0gYnVmZiBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gdG8gY29udmVydCB0byBhIHN0cmluZ1xuICAgKi9cbiAgYnVmZmVyVG9TdHJpbmcgPSAoYnVmZjogQnVmZmVyKTogc3RyaW5nID0+XG4gICAgdGhpcy5jb3B5RnJvbShidWZmLCAyKS50b1N0cmluZyhcInV0ZjhcIilcblxuICAvKipcbiAgICogUHJvZHVjZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmcm9tIGEgc3RyaW5nLiBPTkxZIFVTRUQgSU4gVFJBTlNBQ1RJT04gRk9STUFUVElORywgTEVOR1RIIElTIFBSRVBFTkRFRC5cbiAgICpcbiAgICogQHBhcmFtIHN0ciBUaGUgc3RyaW5nIHRvIGNvbnZlcnQgdG8gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKi9cbiAgc3RyaW5nVG9CdWZmZXIgPSAoc3RyOiBzdHJpbmcpOiBCdWZmZXIgPT4ge1xuICAgIGNvbnN0IGJ1ZmY6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygyICsgc3RyLmxlbmd0aClcbiAgICBidWZmLndyaXRlVUludDE2QkUoc3RyLmxlbmd0aCwgMClcbiAgICBidWZmLndyaXRlKHN0ciwgMiwgc3RyLmxlbmd0aCwgXCJ1dGY4XCIpXG4gICAgcmV0dXJuIGJ1ZmZcbiAgfVxuXG4gIC8qKlxuICAgKiBNYWtlcyBhIGNvcHkgKG5vIHJlZmVyZW5jZSkgb2YgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBvdmVyIHByb3ZpZGVkIGluZGVjaWVzLlxuICAgKlxuICAgKiBAcGFyYW0gYnVmZiBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gdG8gY29weVxuICAgKiBAcGFyYW0gc3RhcnQgVGhlIGluZGV4IHRvIHN0YXJ0IHRoZSBjb3B5XG4gICAqIEBwYXJhbSBlbmQgVGhlIGluZGV4IHRvIGVuZCB0aGUgY29weVxuICAgKi9cbiAgY29weUZyb20gPSAoXG4gICAgYnVmZjogQnVmZmVyLFxuICAgIHN0YXJ0OiBudW1iZXIgPSAwLFxuICAgIGVuZDogbnVtYmVyID0gdW5kZWZpbmVkXG4gICk6IEJ1ZmZlciA9PiB7XG4gICAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBlbmQgPSBidWZmLmxlbmd0aFxuICAgIH1cbiAgICByZXR1cm4gQnVmZmVyLmZyb20oVWludDhBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChidWZmLnNsaWNlKHN0YXJ0LCBlbmQpKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGFuZCByZXR1cm5zIGEgYmFzZS01OCBzdHJpbmcgb2ZcbiAgICogdGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9LlxuICAgKlxuICAgKiBAcGFyYW0gYnVmZiBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gdG8gY29udmVydCB0byBiYXNlLTU4XG4gICAqL1xuICBidWZmZXJUb0I1OCA9IChidWZmOiBCdWZmZXIpOiBzdHJpbmcgPT4gdGhpcy5iNTguZW5jb2RlKGJ1ZmYpXG5cbiAgLyoqXG4gICAqIFRha2VzIGEgYmFzZS01OCBzdHJpbmcgYW5kIHJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfS5cbiAgICpcbiAgICogQHBhcmFtIGI1OHN0ciBUaGUgYmFzZS01OCBzdHJpbmcgdG8gY29udmVydFxuICAgKiB0byBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqL1xuICBiNThUb0J1ZmZlciA9IChiNThzdHI6IHN0cmluZyk6IEJ1ZmZlciA9PiB0aGlzLmI1OC5kZWNvZGUoYjU4c3RyKVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGFuZCByZXR1cm5zIGFuIEFycmF5QnVmZmVyLlxuICAgKlxuICAgKiBAcGFyYW0gYnVmZiBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gdG9cbiAgICogY29udmVydCB0byBhbiBBcnJheUJ1ZmZlclxuICAgKi9cbiAgZnJvbUJ1ZmZlclRvQXJyYXlCdWZmZXIgPSAoYnVmZjogQnVmZmVyKTogQXJyYXlCdWZmZXIgPT4ge1xuICAgIGNvbnN0IGFiID0gbmV3IEFycmF5QnVmZmVyKGJ1ZmYubGVuZ3RoKVxuICAgIGNvbnN0IHZpZXcgPSBuZXcgVWludDhBcnJheShhYilcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgYnVmZi5sZW5ndGg7ICsraSkge1xuICAgICAgdmlld1tgJHtpfWBdID0gYnVmZltgJHtpfWBdXG4gICAgfVxuICAgIHJldHVybiB2aWV3XG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYW4gQXJyYXlCdWZmZXIgYW5kIGNvbnZlcnRzIGl0IHRvIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0uXG4gICAqXG4gICAqIEBwYXJhbSBhYiBUaGUgQXJyYXlCdWZmZXIgdG8gY29udmVydCB0byBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqL1xuICBmcm9tQXJyYXlCdWZmZXJUb0J1ZmZlciA9IChhYjogQXJyYXlCdWZmZXIpOiBCdWZmZXIgPT4ge1xuICAgIGNvbnN0IGJ1ZiA9IEJ1ZmZlci5hbGxvYyhhYi5ieXRlTGVuZ3RoKVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBhYi5ieXRlTGVuZ3RoOyArK2kpIHtcbiAgICAgIGJ1ZltgJHtpfWBdID0gYWJbYCR7aX1gXVxuICAgIH1cbiAgICByZXR1cm4gYnVmXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBhbmQgY29udmVydHMgaXRcbiAgICogdG8gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfS5cbiAgICpcbiAgICogQHBhcmFtIGJ1ZmYgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHRvIGNvbnZlcnRcbiAgICogdG8gYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZnJvbUJ1ZmZlclRvQk4gPSAoYnVmZjogQnVmZmVyKTogQk4gPT4ge1xuICAgIGlmICh0eXBlb2YgYnVmZiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cbiAgICByZXR1cm4gbmV3IEJOKGJ1ZmYudG9TdHJpbmcoXCJoZXhcIiksIDE2LCBcImJlXCIpXG4gIH1cbiAgLyoqXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gYW5kIGNvbnZlcnRzIGl0XG4gICAqIHRvIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0uXG4gICAqXG4gICAqIEBwYXJhbSBibiBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gdG8gY29udmVydFxuICAgKiB0byBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIEBwYXJhbSBsZW5ndGggVGhlIHplcm8tcGFkZGVkIGxlbmd0aCBvZiB0aGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICovXG4gIGZyb21CTlRvQnVmZmVyID0gKGJuOiBCTiwgbGVuZ3RoPzogbnVtYmVyKTogQnVmZmVyID0+IHtcbiAgICBpZiAodHlwZW9mIGJuID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuICAgIGNvbnN0IG5ld2FyciA9IGJuLnRvQXJyYXkoXCJiZVwiKVxuICAgIC8qKlxuICAgICAqIENLQzogU3RpbGwgdW5zdXJlIHdoeSBibi50b0FycmF5IHdpdGggYSBcImJlXCIgYW5kIGEgbGVuZ3RoIGRvIG5vdCB3b3JrIHJpZ2h0LiBCdWc/XG4gICAgICovXG4gICAgaWYgKGxlbmd0aCkge1xuICAgICAgLy8gYm4gdG9BcnJheSB3aXRoIHRoZSBsZW5ndGggcGFyYW1ldGVyIGRvZXNuJ3Qgd29yayBjb3JyZWN0bHksIG5lZWQgdGhpcy5cbiAgICAgIGNvbnN0IHggPSBsZW5ndGggLSBuZXdhcnIubGVuZ3RoXG4gICAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgeDsgaSsrKSB7XG4gICAgICAgIG5ld2Fyci51bnNoaWZ0KDApXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBCdWZmZXIuZnJvbShuZXdhcnIpXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBhbmQgYWRkcyBhIGNoZWNrc3VtLCByZXR1cm5pbmdcbiAgICogYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aXRoIHRoZSA0LWJ5dGUgY2hlY2tzdW0gYXBwZW5kZWQuXG4gICAqXG4gICAqIEBwYXJhbSBidWZmIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB0byBhcHBlbmQgYSBjaGVja3N1bVxuICAgKi9cbiAgYWRkQ2hlY2tzdW0gPSAoYnVmZjogQnVmZmVyKTogQnVmZmVyID0+IHtcbiAgICBjb25zdCBoYXNoc2xpY2U6IEJ1ZmZlciA9IEJ1ZmZlci5mcm9tKFxuICAgICAgY3JlYXRlSGFzaChcInNoYTI1NlwiKS51cGRhdGUoYnVmZikuZGlnZXN0KCkuc2xpY2UoMjgpXG4gICAgKVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KFtidWZmLCBoYXNoc2xpY2VdKVxuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2l0aCBhbiBhcHBlbmRlZCA0LWJ5dGUgY2hlY2tzdW1cbiAgICogYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgY2hlY2tzdW0gaXMgdmFsaWQsIG90aGVyd2lzZSBmYWxzZS5cbiAgICpcbiAgICogQHBhcmFtIGIgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHRvIHZhbGlkYXRlIHRoZSBjaGVja3N1bVxuICAgKi9cbiAgdmFsaWRhdGVDaGVja3N1bSA9IChidWZmOiBCdWZmZXIpOiBib29sZWFuID0+IHtcbiAgICBjb25zdCBjaGVja3NsaWNlOiBCdWZmZXIgPSBidWZmLnNsaWNlKGJ1ZmYubGVuZ3RoIC0gNClcbiAgICBjb25zdCBoYXNoc2xpY2U6IEJ1ZmZlciA9IEJ1ZmZlci5mcm9tKFxuICAgICAgY3JlYXRlSGFzaChcInNoYTI1NlwiKVxuICAgICAgICAudXBkYXRlKGJ1ZmYuc2xpY2UoMCwgYnVmZi5sZW5ndGggLSA0KSlcbiAgICAgICAgLmRpZ2VzdCgpXG4gICAgICAgIC5zbGljZSgyOClcbiAgICApXG4gICAgcmV0dXJuIGNoZWNrc2xpY2UudG9TdHJpbmcoXCJoZXhcIikgPT09IGhhc2hzbGljZS50b1N0cmluZyhcImhleFwiKVxuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gYW5kIHJldHVybnMgYSBiYXNlLTU4IHN0cmluZyB3aXRoXG4gICAqIGNoZWNrc3VtIGFzIHBlciB0aGUgY2I1OCBzdGFuZGFyZC5cbiAgICpcbiAgICogQHBhcmFtIGJ5dGVzIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gdG8gc2VyaWFsaXplXG4gICAqXG4gICAqIEByZXR1cm5zIEEgc2VyaWFsaXplZCBiYXNlLTU4IHN0cmluZyBvZiB0aGUgQnVmZmVyLlxuICAgKi9cbiAgY2I1OEVuY29kZSA9IChieXRlczogQnVmZmVyKTogc3RyaW5nID0+IHtcbiAgICBjb25zdCB4OiBCdWZmZXIgPSB0aGlzLmFkZENoZWNrc3VtKGJ5dGVzKVxuICAgIHJldHVybiB0aGlzLmJ1ZmZlclRvQjU4KHgpXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYSBjYjU4IHNlcmlhbGl6ZWQge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYmFzZS01OCBzdHJpbmdcbiAgICogYW5kIHJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiB0aGUgb3JpZ2luYWwgZGF0YS4gVGhyb3dzIG9uIGVycm9yLlxuICAgKlxuICAgKiBAcGFyYW0gYnl0ZXMgQSBjYjU4IHNlcmlhbGl6ZWQge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYmFzZS01OCBzdHJpbmdcbiAgICovXG4gIGNiNThEZWNvZGUgPSAoYnl0ZXM6IEJ1ZmZlciB8IHN0cmluZyk6IEJ1ZmZlciA9PiB7XG4gICAgaWYgKHR5cGVvZiBieXRlcyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgYnl0ZXMgPSB0aGlzLmI1OFRvQnVmZmVyKGJ5dGVzKVxuICAgIH1cbiAgICBpZiAodGhpcy52YWxpZGF0ZUNoZWNrc3VtKGJ5dGVzKSkge1xuICAgICAgcmV0dXJuIHRoaXMuY29weUZyb20oYnl0ZXMsIDAsIGJ5dGVzLmxlbmd0aCAtIDQpXG4gICAgfVxuICAgIHRocm93IG5ldyBDaGVja3N1bUVycm9yKFwiRXJyb3IgLSBCaW5Ub29scy5jYjU4RGVjb2RlOiBpbnZhbGlkIGNoZWNrc3VtXCIpXG4gIH1cblxuICBhZGRyZXNzVG9TdHJpbmcgPSAoaHJwOiBzdHJpbmcsIGNoYWluaWQ6IHN0cmluZywgYnl0ZXM6IEJ1ZmZlcik6IHN0cmluZyA9PlxuICAgIGAke2NoYWluaWR9LSR7YmVjaDMyLmJlY2gzMi5lbmNvZGUoaHJwLCBiZWNoMzIuYmVjaDMyLnRvV29yZHMoYnl0ZXMpKX1gXG5cbiAgc3RyaW5nVG9BZGRyZXNzID0gKGFkZHJlc3M6IHN0cmluZywgaHJwPzogc3RyaW5nKTogQnVmZmVyID0+IHtcbiAgICBpZiAoYWRkcmVzcy5zdWJzdHJpbmcoMCwgMikgPT09IFwiMHhcIikge1xuICAgICAgLy8gRVRILXN0eWxlIGFkZHJlc3NcbiAgICAgIGlmICh1dGlscy5pc0FkZHJlc3MoYWRkcmVzcykpIHtcbiAgICAgICAgcmV0dXJuIEJ1ZmZlci5mcm9tKGFkZHJlc3Muc3Vic3RyaW5nKDIpLCBcImhleFwiKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEhleEVycm9yKFwiRXJyb3IgLSBJbnZhbGlkIGFkZHJlc3NcIilcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gQmVjaDMyIGFkZHJlc3Nlc1xuICAgIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IGFkZHJlc3MudHJpbSgpLnNwbGl0KFwiLVwiKVxuXG4gICAgaWYgKHBhcnRzLmxlbmd0aCA8IDIpIHtcbiAgICAgIHRocm93IG5ldyBCZWNoMzJFcnJvcihcIkVycm9yIC0gVmFsaWQgYWRkcmVzcyBzaG91bGQgaW5jbHVkZSAtXCIpXG4gICAgfVxuXG4gICAgaWYgKHBhcnRzWzBdLmxlbmd0aCA8IDEpIHtcbiAgICAgIHRocm93IG5ldyBCZWNoMzJFcnJvcihcIkVycm9yIC0gVmFsaWQgYWRkcmVzcyBtdXN0IGhhdmUgcHJlZml4IGJlZm9yZSAtXCIpXG4gICAgfVxuXG4gICAgY29uc3Qgc3BsaXQ6IG51bWJlciA9IHBhcnRzWzFdLmxhc3RJbmRleE9mKFwiMVwiKVxuICAgIGlmIChzcGxpdCA8IDApIHtcbiAgICAgIHRocm93IG5ldyBCZWNoMzJFcnJvcihcIkVycm9yIC0gVmFsaWQgYWRkcmVzcyBtdXN0IGluY2x1ZGUgc2VwYXJhdG9yICgxKVwiKVxuICAgIH1cblxuICAgIGNvbnN0IGh1bWFuUmVhZGFibGVQYXJ0OiBzdHJpbmcgPSBwYXJ0c1sxXS5zbGljZSgwLCBzcGxpdClcbiAgICBpZiAoaHVtYW5SZWFkYWJsZVBhcnQubGVuZ3RoIDwgMSkge1xuICAgICAgdGhyb3cgbmV3IEJlY2gzMkVycm9yKFwiRXJyb3IgLSBIUlAgc2hvdWxkIGJlIGF0IGxlYXN0IDEgY2hhcmFjdGVyXCIpXG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgaHVtYW5SZWFkYWJsZVBhcnQgIT09IFwiYXhjXCIgJiZcbiAgICAgIGh1bWFuUmVhZGFibGVQYXJ0ICE9PSBcImZ1amlcIiAmJlxuICAgICAgaHVtYW5SZWFkYWJsZVBhcnQgIT0gXCJsb2NhbFwiICYmXG4gICAgICBodW1hblJlYWRhYmxlUGFydCAhPSBcImN1c3RvbVwiICYmXG4gICAgICBodW1hblJlYWRhYmxlUGFydCAhPSBocnBcbiAgICApIHtcbiAgICAgIHRocm93IG5ldyBCZWNoMzJFcnJvcihcIkVycm9yIC0gSW52YWxpZCBIUlBcIilcbiAgICB9XG5cbiAgICByZXR1cm4gQnVmZmVyLmZyb20oXG4gICAgICBiZWNoMzIuYmVjaDMyLmZyb21Xb3JkcyhiZWNoMzIuYmVjaDMyLmRlY29kZShwYXJ0c1sxXSkud29yZHMpXG4gICAgKVxuICB9XG5cbiAgLyoqXG4gICAqIFRha2VzIGFuIGFkZHJlc3MgYW5kIHJldHVybnMgaXRzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIHJlcHJlc2VudGF0aW9uIGlmIHZhbGlkLiBBIG1vcmUgc3RyaWN0IHZlcnNpb24gb2Ygc3RyaW5nVG9BZGRyZXNzLlxuICAgKlxuICAgKiBAcGFyYW0gYWRkciBBIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgYWRkcmVzc1xuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIEEgY2I1OCBlbmNvZGVkIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgYmxvY2tjaGFpbklEXG4gICAqIEBwYXJhbSBhbGlhcyBBIGNoYWluSUQgYWxpYXMsIGlmIGFueSwgdGhhdCB0aGUgYWRkcmVzcyBjYW4gYWxzbyBwYXJzZSBmcm9tLlxuICAgKiBAcGFyYW0gYWRkcmxlbiBWTXMgY2FuIHVzZSBhbnkgYWRkcmVzc2luZyBzY2hlbWUgdGhhdCB0aGV5IGxpa2UsIHNvIHRoaXMgaXMgdGhlIGFwcHJvcHJpYXRlIG51bWJlciBvZiBhZGRyZXNzIGJ5dGVzLiBEZWZhdWx0IDIwLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgYWRkcmVzcyBpZiB2YWxpZCxcbiAgICogdW5kZWZpbmVkIGlmIG5vdCB2YWxpZC5cbiAgICovXG4gIHBhcnNlQWRkcmVzcyA9IChcbiAgICBhZGRyOiBzdHJpbmcsXG4gICAgYmxvY2tjaGFpbklEOiBzdHJpbmcsXG4gICAgYWxpYXM6IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBhZGRybGVuOiBudW1iZXIgPSAyMFxuICApOiBCdWZmZXIgPT4ge1xuICAgIGNvbnN0IGFiYzogc3RyaW5nW10gPSBhZGRyLnNwbGl0KFwiLVwiKVxuICAgIGlmIChcbiAgICAgIGFiYy5sZW5ndGggPT09IDIgJiZcbiAgICAgICgoYWxpYXMgJiYgYWJjWzBdID09PSBhbGlhcykgfHwgKGJsb2NrY2hhaW5JRCAmJiBhYmNbMF0gPT09IGJsb2NrY2hhaW5JRCkpXG4gICAgKSB7XG4gICAgICBjb25zdCBhZGRyYnVmZiA9IHRoaXMuc3RyaW5nVG9BZGRyZXNzKGFkZHIpXG4gICAgICBpZiAoKGFkZHJsZW4gJiYgYWRkcmJ1ZmYubGVuZ3RoID09PSBhZGRybGVuKSB8fCAhYWRkcmxlbikge1xuICAgICAgICByZXR1cm4gYWRkcmJ1ZmZcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuICB9XG59XG4iXX0=