"use strict";
/**
 * @packageDocumentation
 * @module Utils-Payload
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAGNETPayload = exports.ONIONPayload = exports.IPFSPayload = exports.URLPayload = exports.EMAILPayload = exports.YAMLPayload = exports.JSONPayload = exports.CSVPayload = exports.SVGPayload = exports.ICOPayload = exports.BMPPayload = exports.PNGPayload = exports.JPEGPayload = exports.SECPENCPayload = exports.SECPSIGPayload = exports.NODEIDPayload = exports.CHAINIDPayload = exports.ALLYCHAINIDPayload = exports.NFTIDPayload = exports.UTXOIDPayload = exports.ASSETIDPayload = exports.TXIDPayload = exports.cb58EncodedPayload = exports.APPCHAINADDRPayload = exports.CORECHAINADDRPayload = exports.XCHAINADDRPayload = exports.ChainAddressPayload = exports.BIGNUMPayload = exports.B64STRPayload = exports.B58STRPayload = exports.HEXSTRPayload = exports.UTF8Payload = exports.BINPayload = exports.PayloadBase = exports.PayloadTypes = void 0;
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("./bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const errors_1 = require("../utils/errors");
const serialization_1 = require("../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Class for determining payload types and managing the lookup table.
 */
class PayloadTypes {
    constructor() {
        this.types = [];
        this.types = [
            "BIN",
            "UTF8",
            "HEXSTR",
            "B58STR",
            "B64STR",
            "BIGNUM",
            "XCHAINADDR",
            "CORECHAINADDR",
            "APPCHAINADDR",
            "TXID",
            "ASSETID",
            "UTXOID",
            "NFTID",
            "ALLYCHAINID",
            "CHAINID",
            "NODEID",
            "SECPSIG",
            "SECPENC",
            "JPEG",
            "PNG",
            "BMP",
            "ICO",
            "SVG",
            "CSV",
            "JSON",
            "YAML",
            "EMAIL",
            "URL",
            "IPFS",
            "ONION",
            "MAGNET"
        ];
    }
    /**
     * Given an encoded payload buffer returns the payload content (minus typeID).
     */
    getContent(payload) {
        const pl = bintools.copyFrom(payload, 5);
        return pl;
    }
    /**
     * Given an encoded payload buffer returns the payload (with typeID).
     */
    getPayload(payload) {
        const pl = bintools.copyFrom(payload, 4);
        return pl;
    }
    /**
     * Given a payload buffer returns the proper TypeID.
     */
    getTypeID(payload) {
        const offset = 4;
        const typeID = bintools
            .copyFrom(payload, offset, offset + 1)
            .readUInt8(0);
        return typeID;
    }
    /**
     * Given a type string returns the proper TypeID.
     */
    lookupID(typestr) {
        return this.types.indexOf(typestr);
    }
    /**
     * Given a TypeID returns a string describing the payload type.
     */
    lookupType(value) {
        return this.types[`${value}`];
    }
    /**
     * Given a TypeID returns the proper [[PayloadBase]].
     */
    select(typeID, ...args) {
        switch (typeID) {
            case 0:
                return new BINPayload(...args);
            case 1:
                return new UTF8Payload(...args);
            case 2:
                return new HEXSTRPayload(...args);
            case 3:
                return new B58STRPayload(...args);
            case 4:
                return new B64STRPayload(...args);
            case 5:
                return new BIGNUMPayload(...args);
            case 6:
                return new XCHAINADDRPayload(...args);
            case 7:
                return new CORECHAINADDRPayload(...args);
            case 8:
                return new APPCHAINADDRPayload(...args);
            case 9:
                return new TXIDPayload(...args);
            case 10:
                return new ASSETIDPayload(...args);
            case 11:
                return new UTXOIDPayload(...args);
            case 12:
                return new NFTIDPayload(...args);
            case 13:
                return new ALLYCHAINIDPayload(...args);
            case 14:
                return new CHAINIDPayload(...args);
            case 15:
                return new NODEIDPayload(...args);
            case 16:
                return new SECPSIGPayload(...args);
            case 17:
                return new SECPENCPayload(...args);
            case 18:
                return new JPEGPayload(...args);
            case 19:
                return new PNGPayload(...args);
            case 20:
                return new BMPPayload(...args);
            case 21:
                return new ICOPayload(...args);
            case 22:
                return new SVGPayload(...args);
            case 23:
                return new CSVPayload(...args);
            case 24:
                return new JSONPayload(...args);
            case 25:
                return new YAMLPayload(...args);
            case 26:
                return new EMAILPayload(...args);
            case 27:
                return new URLPayload(...args);
            case 28:
                return new IPFSPayload(...args);
            case 29:
                return new ONIONPayload(...args);
            case 30:
                return new MAGNETPayload(...args);
        }
        throw new errors_1.TypeIdError(`Error - PayloadTypes.select: unknown typeid ${typeID}`);
    }
    /**
     * Given a [[PayloadBase]] which may not be cast properly, returns a properly cast [[PayloadBase]].
     */
    recast(unknowPayload) {
        return this.select(unknowPayload.typeID(), unknowPayload.returnType());
    }
    /**
     * Returns the [[PayloadTypes]] singleton.
     */
    static getInstance() {
        if (!PayloadTypes.instance) {
            PayloadTypes.instance = new PayloadTypes();
        }
        return PayloadTypes.instance;
    }
}
exports.PayloadTypes = PayloadTypes;
/**
 * Base class for payloads.
 */
class PayloadBase {
    constructor() {
        this.payload = buffer_1.Buffer.alloc(0);
        this.typeid = undefined;
    }
    /**
     * Returns the TypeID for the payload.
     */
    typeID() {
        return this.typeid;
    }
    /**
     * Returns the string name for the payload's type.
     */
    typeName() {
        return PayloadTypes.getInstance().lookupType(this.typeid);
    }
    /**
     * Returns the payload content (minus typeID).
     */
    getContent() {
        const pl = bintools.copyFrom(this.payload);
        return pl;
    }
    /**
     * Returns the payload (with typeID).
     */
    getPayload() {
        const typeID = buffer_1.Buffer.alloc(1);
        typeID.writeUInt8(this.typeid, 0);
        const pl = buffer_1.Buffer.concat([typeID, bintools.copyFrom(this.payload)]);
        return pl;
    }
    /**
     * Decodes the payload as a {@link https://github.com/feross/buffer|Buffer} including 4 bytes for the length and TypeID.
     */
    fromBuffer(bytes, offset = 0) {
        const size = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.typeid = bintools.copyFrom(bytes, offset, offset + 1).readUInt8(0);
        offset += 1;
        this.payload = bintools.copyFrom(bytes, offset, offset + size - 1);
        offset += size - 1;
        return offset;
    }
    /**
     * Encodes the payload as a {@link https://github.com/feross/buffer|Buffer} including 4 bytes for the length and TypeID.
     */
    toBuffer() {
        const sizebuff = buffer_1.Buffer.alloc(4);
        sizebuff.writeUInt32BE(this.payload.length + 1, 0);
        const typebuff = buffer_1.Buffer.alloc(1);
        typebuff.writeUInt8(this.typeid, 0);
        return buffer_1.Buffer.concat([sizebuff, typebuff, this.payload]);
    }
}
exports.PayloadBase = PayloadBase;
/**
 * Class for payloads representing simple binary blobs.
 */
class BINPayload extends PayloadBase {
    /**
     * @param payload Buffer only
     */
    constructor(payload = undefined) {
        super();
        this.typeid = 0;
        if (payload instanceof buffer_1.Buffer) {
            this.payload = payload;
        }
        else if (typeof payload === "string") {
            this.payload = bintools.b58ToBuffer(payload);
        }
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the payload.
     */
    returnType() {
        return this.payload;
    }
}
exports.BINPayload = BINPayload;
/**
 * Class for payloads representing UTF8 encoding.
 */
class UTF8Payload extends PayloadBase {
    /**
     * @param payload Buffer utf8 string
     */
    constructor(payload = undefined) {
        super();
        this.typeid = 1;
        if (payload instanceof buffer_1.Buffer) {
            this.payload = payload;
        }
        else if (typeof payload === "string") {
            this.payload = buffer_1.Buffer.from(payload, "utf8");
        }
    }
    /**
     * Returns a string for the payload.
     */
    returnType() {
        return this.payload.toString("utf8");
    }
}
exports.UTF8Payload = UTF8Payload;
/**
 * Class for payloads representing Hexadecimal encoding.
 */
class HEXSTRPayload extends PayloadBase {
    /**
     * @param payload Buffer or hex string
     */
    constructor(payload = undefined) {
        super();
        this.typeid = 2;
        if (payload instanceof buffer_1.Buffer) {
            this.payload = payload;
        }
        else if (typeof payload === "string") {
            if (payload.startsWith("0x") || !payload.match(/^[0-9A-Fa-f]+$/)) {
                throw new errors_1.HexError("HEXSTRPayload.constructor -- hex string may not start with 0x and must be in /^[0-9A-Fa-f]+$/: " +
                    payload);
            }
            this.payload = buffer_1.Buffer.from(payload, "hex");
        }
    }
    /**
     * Returns a hex string for the payload.
     */
    returnType() {
        return this.payload.toString("hex");
    }
}
exports.HEXSTRPayload = HEXSTRPayload;
/**
 * Class for payloads representing Base58 encoding.
 */
class B58STRPayload extends PayloadBase {
    /**
     * @param payload Buffer or cb58 encoded string
     */
    constructor(payload = undefined) {
        super();
        this.typeid = 3;
        if (payload instanceof buffer_1.Buffer) {
            this.payload = payload;
        }
        else if (typeof payload === "string") {
            this.payload = bintools.b58ToBuffer(payload);
        }
    }
    /**
     * Returns a base58 string for the payload.
     */
    returnType() {
        return bintools.bufferToB58(this.payload);
    }
}
exports.B58STRPayload = B58STRPayload;
/**
 * Class for payloads representing Base64 encoding.
 */
class B64STRPayload extends PayloadBase {
    /**
     * @param payload Buffer of base64 string
     */
    constructor(payload = undefined) {
        super();
        this.typeid = 4;
        if (payload instanceof buffer_1.Buffer) {
            this.payload = payload;
        }
        else if (typeof payload === "string") {
            this.payload = buffer_1.Buffer.from(payload, "base64");
        }
    }
    /**
     * Returns a base64 string for the payload.
     */
    returnType() {
        return this.payload.toString("base64");
    }
}
exports.B64STRPayload = B64STRPayload;
/**
 * Class for payloads representing Big Numbers.
 *
 * @param payload Accepts a Buffer, BN, or base64 string
 */
class BIGNUMPayload extends PayloadBase {
    /**
     * @param payload Buffer, BN, or base64 string
     */
    constructor(payload = undefined) {
        super();
        this.typeid = 5;
        if (payload instanceof buffer_1.Buffer) {
            this.payload = payload;
        }
        else if (payload instanceof bn_js_1.default) {
            this.payload = bintools.fromBNToBuffer(payload);
        }
        else if (typeof payload === "string") {
            this.payload = buffer_1.Buffer.from(payload, "hex");
        }
    }
    /**
     * Returns a {@link https://github.com/indutny/bn.js/|BN} for the payload.
     */
    returnType() {
        return bintools.fromBufferToBN(this.payload);
    }
}
exports.BIGNUMPayload = BIGNUMPayload;
/**
 * Class for payloads representing chain addresses.
 *
 */
class ChainAddressPayload extends PayloadBase {
    /**
     * @param payload Buffer or address string
     */
    constructor(payload = undefined, hrp) {
        super();
        this.typeid = 6;
        this.chainid = "";
        if (payload instanceof buffer_1.Buffer) {
            this.payload = payload;
        }
        else if (typeof payload === "string") {
            if (hrp != undefined) {
                this.payload = bintools.stringToAddress(payload, hrp);
            }
            else {
                this.payload = bintools.stringToAddress(payload);
            }
        }
    }
    /**
     * Returns the chainid.
     */
    returnChainID() {
        return this.chainid;
    }
    /**
     * Returns an address string for the payload.
     */
    returnType(hrp) {
        const type = "bech32";
        return serialization.bufferToType(this.payload, type, hrp, this.chainid);
    }
}
exports.ChainAddressPayload = ChainAddressPayload;
/**
 * Class for payloads representing X-Chin addresses.
 */
class XCHAINADDRPayload extends ChainAddressPayload {
    constructor() {
        super(...arguments);
        this.typeid = 6;
        this.chainid = "X";
    }
}
exports.XCHAINADDRPayload = XCHAINADDRPayload;
/**
 * Class for payloads representing CoreChain addresses.
 */
class CORECHAINADDRPayload extends ChainAddressPayload {
    constructor() {
        super(...arguments);
        this.typeid = 7;
        this.chainid = "P";
    }
}
exports.CORECHAINADDRPayload = CORECHAINADDRPayload;
/**
 * Class for payloads representing AppChain addresses.
 */
class APPCHAINADDRPayload extends ChainAddressPayload {
    constructor() {
        super(...arguments);
        this.typeid = 8;
        this.chainid = "C";
    }
}
exports.APPCHAINADDRPayload = APPCHAINADDRPayload;
/**
 * Class for payloads representing data serialized by bintools.cb58Encode().
 */
class cb58EncodedPayload extends PayloadBase {
    /**
     * Returns a bintools.cb58Encoded string for the payload.
     */
    returnType() {
        return bintools.cb58Encode(this.payload);
    }
    /**
     * @param payload Buffer or cb58 encoded string
     */
    constructor(payload = undefined) {
        super();
        if (payload instanceof buffer_1.Buffer) {
            this.payload = payload;
        }
        else if (typeof payload === "string") {
            this.payload = bintools.cb58Decode(payload);
        }
    }
}
exports.cb58EncodedPayload = cb58EncodedPayload;
/**
 * Class for payloads representing TxIDs.
 */
class TXIDPayload extends cb58EncodedPayload {
    constructor() {
        super(...arguments);
        this.typeid = 9;
    }
}
exports.TXIDPayload = TXIDPayload;
/**
 * Class for payloads representing AssetIDs.
 */
class ASSETIDPayload extends cb58EncodedPayload {
    constructor() {
        super(...arguments);
        this.typeid = 10;
    }
}
exports.ASSETIDPayload = ASSETIDPayload;
/**
 * Class for payloads representing NODEIDs.
 */
class UTXOIDPayload extends cb58EncodedPayload {
    constructor() {
        super(...arguments);
        this.typeid = 11;
    }
}
exports.UTXOIDPayload = UTXOIDPayload;
/**
 * Class for payloads representing NFTIDs (UTXOIDs in an NFT context).
 */
class NFTIDPayload extends UTXOIDPayload {
    constructor() {
        super(...arguments);
        this.typeid = 12;
    }
}
exports.NFTIDPayload = NFTIDPayload;
/**
 * Class for payloads representing AllyChainIDs.
 */
class ALLYCHAINIDPayload extends cb58EncodedPayload {
    constructor() {
        super(...arguments);
        this.typeid = 13;
    }
}
exports.ALLYCHAINIDPayload = ALLYCHAINIDPayload;
/**
 * Class for payloads representing ChainIDs.
 */
class CHAINIDPayload extends cb58EncodedPayload {
    constructor() {
        super(...arguments);
        this.typeid = 14;
    }
}
exports.CHAINIDPayload = CHAINIDPayload;
/**
 * Class for payloads representing NodeIDs.
 */
class NODEIDPayload extends cb58EncodedPayload {
    constructor() {
        super(...arguments);
        this.typeid = 15;
    }
}
exports.NODEIDPayload = NODEIDPayload;
/**
 * Class for payloads representing secp256k1 signatures.
 * convention: secp256k1 signature (130 bytes)
 */
class SECPSIGPayload extends B58STRPayload {
    constructor() {
        super(...arguments);
        this.typeid = 16;
    }
}
exports.SECPSIGPayload = SECPSIGPayload;
/**
 * Class for payloads representing secp256k1 encrypted messages.
 * convention: public key (65 bytes) + secp256k1 encrypted message for that public key
 */
class SECPENCPayload extends B58STRPayload {
    constructor() {
        super(...arguments);
        this.typeid = 17;
    }
}
exports.SECPENCPayload = SECPENCPayload;
/**
 * Class for payloads representing JPEG images.
 */
class JPEGPayload extends BINPayload {
    constructor() {
        super(...arguments);
        this.typeid = 18;
    }
}
exports.JPEGPayload = JPEGPayload;
class PNGPayload extends BINPayload {
    constructor() {
        super(...arguments);
        this.typeid = 19;
    }
}
exports.PNGPayload = PNGPayload;
/**
 * Class for payloads representing BMP images.
 */
class BMPPayload extends BINPayload {
    constructor() {
        super(...arguments);
        this.typeid = 20;
    }
}
exports.BMPPayload = BMPPayload;
/**
 * Class for payloads representing ICO images.
 */
class ICOPayload extends BINPayload {
    constructor() {
        super(...arguments);
        this.typeid = 21;
    }
}
exports.ICOPayload = ICOPayload;
/**
 * Class for payloads representing SVG images.
 */
class SVGPayload extends UTF8Payload {
    constructor() {
        super(...arguments);
        this.typeid = 22;
    }
}
exports.SVGPayload = SVGPayload;
/**
 * Class for payloads representing CSV files.
 */
class CSVPayload extends UTF8Payload {
    constructor() {
        super(...arguments);
        this.typeid = 23;
    }
}
exports.CSVPayload = CSVPayload;
/**
 * Class for payloads representing JSON strings.
 */
class JSONPayload extends PayloadBase {
    constructor(payload = undefined) {
        super();
        this.typeid = 24;
        if (payload instanceof buffer_1.Buffer) {
            this.payload = payload;
        }
        else if (typeof payload === "string") {
            this.payload = buffer_1.Buffer.from(payload, "utf8");
        }
        else if (payload) {
            let jsonstr = JSON.stringify(payload);
            this.payload = buffer_1.Buffer.from(jsonstr, "utf8");
        }
    }
    /**
     * Returns a JSON-decoded object for the payload.
     */
    returnType() {
        return JSON.parse(this.payload.toString("utf8"));
    }
}
exports.JSONPayload = JSONPayload;
/**
 * Class for payloads representing YAML definitions.
 */
class YAMLPayload extends UTF8Payload {
    constructor() {
        super(...arguments);
        this.typeid = 25;
    }
}
exports.YAMLPayload = YAMLPayload;
/**
 * Class for payloads representing email addresses.
 */
class EMAILPayload extends UTF8Payload {
    constructor() {
        super(...arguments);
        this.typeid = 26;
    }
}
exports.EMAILPayload = EMAILPayload;
/**
 * Class for payloads representing URL strings.
 */
class URLPayload extends UTF8Payload {
    constructor() {
        super(...arguments);
        this.typeid = 27;
    }
}
exports.URLPayload = URLPayload;
/**
 * Class for payloads representing IPFS addresses.
 */
class IPFSPayload extends B58STRPayload {
    constructor() {
        super(...arguments);
        this.typeid = 28;
    }
}
exports.IPFSPayload = IPFSPayload;
/**
 * Class for payloads representing onion URLs.
 */
class ONIONPayload extends UTF8Payload {
    constructor() {
        super(...arguments);
        this.typeid = 29;
    }
}
exports.ONIONPayload = ONIONPayload;
/**
 * Class for payloads representing torrent magnet links.
 */
class MAGNETPayload extends UTF8Payload {
    constructor() {
        super(...arguments);
        this.typeid = 30;
    }
}
exports.MAGNETPayload = MAGNETPayload;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF5bG9hZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy91dGlscy9wYXlsb2FkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7Ozs7OztBQUVILG9DQUFnQztBQUNoQywwREFBaUM7QUFDakMsa0RBQXNCO0FBQ3RCLDRDQUF1RDtBQUN2RCwwREFBc0U7QUFFdEU7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWhFOztHQUVHO0FBQ0gsTUFBYSxZQUFZO0lBd0l2QjtRQXRJVSxVQUFLLEdBQWEsRUFBRSxDQUFBO1FBdUk1QixJQUFJLENBQUMsS0FBSyxHQUFHO1lBQ1gsS0FBSztZQUNMLE1BQU07WUFDTixRQUFRO1lBQ1IsUUFBUTtZQUNSLFFBQVE7WUFDUixRQUFRO1lBQ1IsWUFBWTtZQUNaLGVBQWU7WUFDZixjQUFjO1lBQ2QsTUFBTTtZQUNOLFNBQVM7WUFDVCxRQUFRO1lBQ1IsT0FBTztZQUNQLGFBQWE7WUFDYixTQUFTO1lBQ1QsUUFBUTtZQUNSLFNBQVM7WUFDVCxTQUFTO1lBQ1QsTUFBTTtZQUNOLEtBQUs7WUFDTCxLQUFLO1lBQ0wsS0FBSztZQUNMLEtBQUs7WUFDTCxLQUFLO1lBQ0wsTUFBTTtZQUNOLE1BQU07WUFDTixPQUFPO1lBQ1AsS0FBSztZQUNMLE1BQU07WUFDTixPQUFPO1lBQ1AsUUFBUTtTQUNULENBQUE7SUFDSCxDQUFDO0lBdEtEOztPQUVHO0lBQ0gsVUFBVSxDQUFDLE9BQWU7UUFDeEIsTUFBTSxFQUFFLEdBQVcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDaEQsT0FBTyxFQUFFLENBQUE7SUFDWCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxVQUFVLENBQUMsT0FBZTtRQUN4QixNQUFNLEVBQUUsR0FB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LE1BQWEsVUFBVyxTQUFRLFdBQVc7SUFBM0M7O1FBQ1ksV0FBTSxHQUFHLEVBQUUsQ0FBQTtJQUN2QixDQUFDO0NBQUE7QUFGRCxnQ0FFQztBQUVEOztHQUVHO0FBQ0gsTUFBYSxXQUFZLFNBQVEsYUFBYTtJQUE5Qzs7UUFDWSxXQUFNLEdBQUcsRUFBRSxDQUFBO0lBQ3ZCLENBQUM7Q0FBQTtBQUZELGtDQUVDO0FBRUQ7O0dBRUc7QUFDSCxNQUFhLFlBQWEsU0FBUSxXQUFXO0lBQTdDOztRQUNZLFdBQU0sR0FBRyxFQUFFLENBQUE7SUFDdkIsQ0FBQztDQUFBO0FBRkQsb0NBRUM7QUFFRDs7R0FFRztBQUNILE1BQWEsYUFBYyxTQUFRLFdBQVc7SUFBOUM7O1FBQ1ksV0FBTSxHQUFHLEVBQUUsQ0FBQTtJQUN2QixDQUFDO0NBQUE7QUFGRCxzQ0FFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIFV0aWxzLVBheWxvYWRcbiAqL1xuXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4vYmludG9vbHNcIlxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQgeyBUeXBlSWRFcnJvciwgSGV4RXJyb3IgfSBmcm9tIFwiLi4vdXRpbHMvZXJyb3JzXCJcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRUeXBlIH0gZnJvbSBcIi4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuXG4vKipcbiAqIENsYXNzIGZvciBkZXRlcm1pbmluZyBwYXlsb2FkIHR5cGVzIGFuZCBtYW5hZ2luZyB0aGUgbG9va3VwIHRhYmxlLlxuICovXG5leHBvcnQgY2xhc3MgUGF5bG9hZFR5cGVzIHtcbiAgcHJpdmF0ZSBzdGF0aWMgaW5zdGFuY2U6IFBheWxvYWRUeXBlc1xuICBwcm90ZWN0ZWQgdHlwZXM6IHN0cmluZ1tdID0gW11cblxuICAvKipcbiAgICogR2l2ZW4gYW4gZW5jb2RlZCBwYXlsb2FkIGJ1ZmZlciByZXR1cm5zIHRoZSBwYXlsb2FkIGNvbnRlbnQgKG1pbnVzIHR5cGVJRCkuXG4gICAqL1xuICBnZXRDb250ZW50KHBheWxvYWQ6IEJ1ZmZlcik6IEJ1ZmZlciB7XG4gICAgY29uc3QgcGw6IEJ1ZmZlciA9IGJpbnRvb2xzLmNvcHlGcm9tKHBheWxvYWQsIDUpXG4gICAgcmV0dXJuIHBsXG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gYW4gZW5jb2RlZCBwYXlsb2FkIGJ1ZmZlciByZXR1cm5zIHRoZSBwYXlsb2FkICh3aXRoIHR5cGVJRCkuXG4gICAqL1xuICBnZXRQYXlsb2FkKHBheWxvYWQ6IEJ1ZmZlcik6IEJ1ZmZlciB7XG4gICAgY29uc3QgcGw6IEJ1ZmZlciA9IGJpbnRvb2xzLmNvcHlGcm9tKHBheWxvYWQsIDQpXG4gICAgcmV0dXJuIHBsXG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gYSBwYXlsb2FkIGJ1ZmZlciByZXR1cm5zIHRoZSBwcm9wZXIgVHlwZUlELlxuICAgKi9cbiAgZ2V0VHlwZUlEKHBheWxvYWQ6IEJ1ZmZlcik6IG51bWJlciB7XG4gICAgY29uc3Qgb2Zmc2V0OiBudW1iZXIgPSA0XG4gICAgY29uc3QgdHlwZUlEOiBudW1iZXIgPSBiaW50b29sc1xuICAgICAgLmNvcHlGcm9tKHBheWxvYWQsIG9mZnNldCwgb2Zmc2V0ICsgMSlcbiAgICAgIC5yZWFkVUludDgoMClcbiAgICByZXR1cm4gdHlwZUlEXG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gYSB0eXBlIHN0cmluZyByZXR1cm5zIHRoZSBwcm9wZXIgVHlwZUlELlxuICAgKi9cbiAgbG9va3VwSUQodHlwZXN0cjogc3RyaW5nKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy50eXBlcy5pbmRleE9mKHR5cGVzdHIpXG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gYSBUeXBlSUQgcmV0dXJucyBhIHN0cmluZyBkZXNjcmliaW5nIHRoZSBwYXlsb2FkIHR5cGUuXG4gICAqL1xuICBsb29rdXBUeXBlKHZhbHVlOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnR5cGVzW2Ake3ZhbHVlfWBdXG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gYSBUeXBlSUQgcmV0dXJucyB0aGUgcHJvcGVyIFtbUGF5bG9hZEJhc2VdXS5cbiAgICovXG4gIHNlbGVjdCh0eXBlSUQ6IG51bWJlciwgLi4uYXJnczogYW55W10pOiBQYXlsb2FkQmFzZSB7XG4gICAgc3dpdGNoICh0eXBlSUQpIHtcbiAgICAgIGNhc2UgMDpcbiAgICAgICAgcmV0dXJuIG5ldyBCSU5QYXlsb2FkKC4uLmFyZ3MpXG4gICAgICBjYXNlIDE6XG4gICAgICAgIHJldHVybiBuZXcgVVRGOFBheWxvYWQoLi4uYXJncylcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgcmV0dXJuIG5ldyBIRVhTVFJQYXlsb2FkKC4uLmFyZ3MpXG4gICAgICBjYXNlIDM6XG4gICAgICAgIHJldHVybiBuZXcgQjU4U1RSUGF5bG9hZCguLi5hcmdzKVxuICAgICAgY2FzZSA0OlxuICAgICAgICByZXR1cm4gbmV3IEI2NFNUUlBheWxvYWQoLi4uYXJncylcbiAgICAgIGNhc2UgNTpcbiAgICAgICAgcmV0dXJuIG5ldyBCSUdOVU1QYXlsb2FkKC4uLmFyZ3MpXG4gICAgICBjYXNlIDY6XG4gICAgICAgIHJldHVybiBuZXcgWENIQUlOQUREUlBheWxvYWQoLi4uYXJncylcbiAgICAgIGNhc2UgNzpcbiAgICAgICAgcmV0dXJuIG5ldyBDT1JFQ0hBSU5BRERSUGF5bG9hZCguLi5hcmdzKVxuICAgICAgY2FzZSA4OlxuICAgICAgICByZXR1cm4gbmV3IEFQUENIQUlOQUREUlBheWxvYWQoLi4uYXJncylcbiAgICAgIGNhc2UgOTpcbiAgICAgICAgcmV0dXJuIG5ldyBUWElEUGF5bG9hZCguLi5hcmdzKVxuICAgICAgY2FzZSAxMDpcbiAgICAgICAgcmV0dXJuIG5ldyBBU1NFVElEUGF5bG9hZCguLi5hcmdzKVxuICAgICAgY2FzZSAxMTpcbiAgICAgICAgcmV0dXJuIG5ldyBVVFhPSURQYXlsb2FkKC4uLmFyZ3MpXG4gICAgICBjYXNlIDEyOlxuICAgICAgICByZXR1cm4gbmV3IE5GVElEUGF5bG9hZCguLi5hcmdzKVxuICAgICAgY2FzZSAxMzpcbiAgICAgICAgcmV0dXJuIG5ldyBBTExZQ0hBSU5JRFBheWxvYWQoLi4uYXJncylcbiAgICAgIGNhc2UgMTQ6XG4gICAgICAgIHJldHVybiBuZXcgQ0hBSU5JRFBheWxvYWQoLi4uYXJncylcbiAgICAgIGNhc2UgMTU6XG4gICAgICAgIHJldHVybiBuZXcgTk9ERUlEUGF5bG9hZCguLi5hcmdzKVxuICAgICAgY2FzZSAxNjpcbiAgICAgICAgcmV0dXJuIG5ldyBTRUNQU0lHUGF5bG9hZCguLi5hcmdzKVxuICAgICAgY2FzZSAxNzpcbiAgICAgICAgcmV0dXJuIG5ldyBTRUNQRU5DUGF5bG9hZCguLi5hcmdzKVxuICAgICAgY2FzZSAxODpcbiAgICAgICAgcmV0dXJuIG5ldyBKUEVHUGF5bG9hZCguLi5hcmdzKVxuICAgICAgY2FzZSAxOTpcbiAgICAgICAgcmV0dXJuIG5ldyBQTkdQYXlsb2FkKC4uLmFyZ3MpXG4gICAgICBjYXNlIDIwOlxuICAgICAgICByZXR1cm4gbmV3IEJNUFBheWxvYWQoLi4uYXJncylcbiAgICAgIGNhc2UgMjE6XG4gICAgICAgIHJldHVybiBuZXcgSUNPUGF5bG9hZCguLi5hcmdzKVxuICAgICAgY2FzZSAyMjpcbiAgICAgICAgcmV0dXJuIG5ldyBTVkdQYXlsb2FkKC4uLmFyZ3MpXG4gICAgICBjYXNlIDIzOlxuICAgICAgICByZXR1cm4gbmV3IENTVlBheWxvYWQoLi4uYXJncylcbiAgICAgIGNhc2UgMjQ6XG4gICAgICAgIHJldHVybiBuZXcgSlNPTlBheWxvYWQoLi4uYXJncylcbiAgICAgIGNhc2UgMjU6XG4gICAgICAgIHJldHVybiBuZXcgWUFNTFBheWxvYWQoLi4uYXJncylcbiAgICAgIGNhc2UgMjY6XG4gICAgICAgIHJldHVybiBuZXcgRU1BSUxQYXlsb2FkKC4uLmFyZ3MpXG4gICAgICBjYXNlIDI3OlxuICAgICAgICByZXR1cm4gbmV3IFVSTFBheWxvYWQoLi4uYXJncylcbiAgICAgIGNhc2UgMjg6XG4gICAgICAgIHJldHVybiBuZXcgSVBGU1BheWxvYWQoLi4uYXJncylcbiAgICAgIGNhc2UgMjk6XG4gICAgICAgIHJldHVybiBuZXcgT05JT05QYXlsb2FkKC4uLmFyZ3MpXG4gICAgICBjYXNlIDMwOlxuICAgICAgICByZXR1cm4gbmV3IE1BR05FVFBheWxvYWQoLi4uYXJncylcbiAgICB9XG4gICAgdGhyb3cgbmV3IFR5cGVJZEVycm9yKFxuICAgICAgYEVycm9yIC0gUGF5bG9hZFR5cGVzLnNlbGVjdDogdW5rbm93biB0eXBlaWQgJHt0eXBlSUR9YFxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiBhIFtbUGF5bG9hZEJhc2VdXSB3aGljaCBtYXkgbm90IGJlIGNhc3QgcHJvcGVybHksIHJldHVybnMgYSBwcm9wZXJseSBjYXN0IFtbUGF5bG9hZEJhc2VdXS5cbiAgICovXG4gIHJlY2FzdCh1bmtub3dQYXlsb2FkOiBQYXlsb2FkQmFzZSk6IFBheWxvYWRCYXNlIHtcbiAgICByZXR1cm4gdGhpcy5zZWxlY3QodW5rbm93UGF5bG9hZC50eXBlSUQoKSwgdW5rbm93UGF5bG9hZC5yZXR1cm5UeXBlKCkpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgW1tQYXlsb2FkVHlwZXNdXSBzaW5nbGV0b24uXG4gICAqL1xuICBzdGF0aWMgZ2V0SW5zdGFuY2UoKTogUGF5bG9hZFR5cGVzIHtcbiAgICBpZiAoIVBheWxvYWRUeXBlcy5pbnN0YW5jZSkge1xuICAgICAgUGF5bG9hZFR5cGVzLmluc3RhbmNlID0gbmV3IFBheWxvYWRUeXBlcygpXG4gICAgfVxuXG4gICAgcmV0dXJuIFBheWxvYWRUeXBlcy5pbnN0YW5jZVxuICB9XG5cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnR5cGVzID0gW1xuICAgICAgXCJCSU5cIixcbiAgICAgIFwiVVRGOFwiLFxuICAgICAgXCJIRVhTVFJcIixcbiAgICAgIFwiQjU4U1RSXCIsXG4gICAgICBcIkI2NFNUUlwiLFxuICAgICAgXCJCSUdOVU1cIixcbiAgICAgIFwiWENIQUlOQUREUlwiLFxuICAgICAgXCJDT1JFQ0hBSU5BRERSXCIsXG4gICAgICBcIkFQUENIQUlOQUREUlwiLFxuICAgICAgXCJUWElEXCIsXG4gICAgICBcIkFTU0VUSURcIixcbiAgICAgIFwiVVRYT0lEXCIsXG4gICAgICBcIk5GVElEXCIsXG4gICAgICBcIkFMTFlDSEFJTklEXCIsXG4gICAgICBcIkNIQUlOSURcIixcbiAgICAgIFwiTk9ERUlEXCIsXG4gICAgICBcIlNFQ1BTSUdcIixcbiAgICAgIFwiU0VDUEVOQ1wiLFxuICAgICAgXCJKUEVHXCIsXG4gICAgICBcIlBOR1wiLFxuICAgICAgXCJCTVBcIixcbiAgICAgIFwiSUNPXCIsXG4gICAgICBcIlNWR1wiLFxuICAgICAgXCJDU1ZcIixcbiAgICAgIFwiSlNPTlwiLFxuICAgICAgXCJZQU1MXCIsXG4gICAgICBcIkVNQUlMXCIsXG4gICAgICBcIlVSTFwiLFxuICAgICAgXCJJUEZTXCIsXG4gICAgICBcIk9OSU9OXCIsXG4gICAgICBcIk1BR05FVFwiXG4gICAgXVxuICB9XG59XG5cbi8qKlxuICogQmFzZSBjbGFzcyBmb3IgcGF5bG9hZHMuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBQYXlsb2FkQmFzZSB7XG4gIHByb3RlY3RlZCBwYXlsb2FkOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMClcbiAgcHJvdGVjdGVkIHR5cGVpZDogbnVtYmVyID0gdW5kZWZpbmVkXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIFR5cGVJRCBmb3IgdGhlIHBheWxvYWQuXG4gICAqL1xuICB0eXBlSUQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy50eXBlaWRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBzdHJpbmcgbmFtZSBmb3IgdGhlIHBheWxvYWQncyB0eXBlLlxuICAgKi9cbiAgdHlwZU5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gUGF5bG9hZFR5cGVzLmdldEluc3RhbmNlKCkubG9va3VwVHlwZSh0aGlzLnR5cGVpZClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwYXlsb2FkIGNvbnRlbnQgKG1pbnVzIHR5cGVJRCkuXG4gICAqL1xuICBnZXRDb250ZW50KCk6IEJ1ZmZlciB7XG4gICAgY29uc3QgcGw6IEJ1ZmZlciA9IGJpbnRvb2xzLmNvcHlGcm9tKHRoaXMucGF5bG9hZClcbiAgICByZXR1cm4gcGxcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwYXlsb2FkICh3aXRoIHR5cGVJRCkuXG4gICAqL1xuICBnZXRQYXlsb2FkKCk6IEJ1ZmZlciB7XG4gICAgY29uc3QgdHlwZUlEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMSlcbiAgICB0eXBlSUQud3JpdGVVSW50OCh0aGlzLnR5cGVpZCwgMClcbiAgICBjb25zdCBwbDogQnVmZmVyID0gQnVmZmVyLmNvbmNhdChbdHlwZUlELCBiaW50b29scy5jb3B5RnJvbSh0aGlzLnBheWxvYWQpXSlcbiAgICByZXR1cm4gcGxcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWNvZGVzIHRoZSBwYXlsb2FkIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gaW5jbHVkaW5nIDQgYnl0ZXMgZm9yIHRoZSBsZW5ndGggYW5kIFR5cGVJRC5cbiAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICBjb25zdCBzaXplOiBudW1iZXIgPSBiaW50b29sc1xuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgICAucmVhZFVJbnQzMkJFKDApXG4gICAgb2Zmc2V0ICs9IDRcbiAgICB0aGlzLnR5cGVpZCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDEpLnJlYWRVSW50OCgwKVxuICAgIG9mZnNldCArPSAxXG4gICAgdGhpcy5wYXlsb2FkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgc2l6ZSAtIDEpXG4gICAgb2Zmc2V0ICs9IHNpemUgLSAxXG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgLyoqXG4gICAqIEVuY29kZXMgdGhlIHBheWxvYWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBpbmNsdWRpbmcgNCBieXRlcyBmb3IgdGhlIGxlbmd0aCBhbmQgVHlwZUlELlxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBjb25zdCBzaXplYnVmZjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDQpXG4gICAgc2l6ZWJ1ZmYud3JpdGVVSW50MzJCRSh0aGlzLnBheWxvYWQubGVuZ3RoICsgMSwgMClcbiAgICBjb25zdCB0eXBlYnVmZjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDEpXG4gICAgdHlwZWJ1ZmYud3JpdGVVSW50OCh0aGlzLnR5cGVpZCwgMClcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChbc2l6ZWJ1ZmYsIHR5cGVidWZmLCB0aGlzLnBheWxvYWRdKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGV4cGVjdGVkIHR5cGUgZm9yIHRoZSBwYXlsb2FkLlxuICAgKi9cbiAgYWJzdHJhY3QgcmV0dXJuVHlwZSguLi5hcmdzOiBhbnkpOiBhbnlcblxuICBjb25zdHJ1Y3RvcigpIHt9XG59XG5cbi8qKlxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBzaW1wbGUgYmluYXJ5IGJsb2JzLlxuICovXG5leHBvcnQgY2xhc3MgQklOUGF5bG9hZCBleHRlbmRzIFBheWxvYWRCYXNlIHtcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDBcblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgcGF5bG9hZC5cbiAgICovXG4gIHJldHVyblR5cGUoKTogQnVmZmVyIHtcbiAgICByZXR1cm4gdGhpcy5wYXlsb2FkXG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSBwYXlsb2FkIEJ1ZmZlciBvbmx5XG4gICAqL1xuICBjb25zdHJ1Y3RvcihwYXlsb2FkOiBhbnkgPSB1bmRlZmluZWQpIHtcbiAgICBzdXBlcigpXG4gICAgaWYgKHBheWxvYWQgaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgIHRoaXMucGF5bG9hZCA9IHBheWxvYWRcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwYXlsb2FkID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLnBheWxvYWQgPSBiaW50b29scy5iNThUb0J1ZmZlcihwYXlsb2FkKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgVVRGOCBlbmNvZGluZy5cbiAqL1xuZXhwb3J0IGNsYXNzIFVURjhQYXlsb2FkIGV4dGVuZHMgUGF5bG9hZEJhc2Uge1xuICBwcm90ZWN0ZWQgdHlwZWlkID0gMVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIGZvciB0aGUgcGF5bG9hZC5cbiAgICovXG4gIHJldHVyblR5cGUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5wYXlsb2FkLnRvU3RyaW5nKFwidXRmOFwiKVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gcGF5bG9hZCBCdWZmZXIgdXRmOCBzdHJpbmdcbiAgICovXG4gIGNvbnN0cnVjdG9yKHBheWxvYWQ6IGFueSA9IHVuZGVmaW5lZCkge1xuICAgIHN1cGVyKClcbiAgICBpZiAocGF5bG9hZCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgdGhpcy5wYXlsb2FkID0gcGF5bG9hZFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHBheWxvYWQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMucGF5bG9hZCA9IEJ1ZmZlci5mcm9tKHBheWxvYWQsIFwidXRmOFwiKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgSGV4YWRlY2ltYWwgZW5jb2RpbmcuXG4gKi9cbmV4cG9ydCBjbGFzcyBIRVhTVFJQYXlsb2FkIGV4dGVuZHMgUGF5bG9hZEJhc2Uge1xuICBwcm90ZWN0ZWQgdHlwZWlkID0gMlxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgaGV4IHN0cmluZyBmb3IgdGhlIHBheWxvYWQuXG4gICAqL1xuICByZXR1cm5UeXBlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMucGF5bG9hZC50b1N0cmluZyhcImhleFwiKVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gcGF5bG9hZCBCdWZmZXIgb3IgaGV4IHN0cmluZ1xuICAgKi9cbiAgY29uc3RydWN0b3IocGF5bG9hZDogYW55ID0gdW5kZWZpbmVkKSB7XG4gICAgc3VwZXIoKVxuICAgIGlmIChwYXlsb2FkIGluc3RhbmNlb2YgQnVmZmVyKSB7XG4gICAgICB0aGlzLnBheWxvYWQgPSBwYXlsb2FkXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcGF5bG9hZCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgaWYgKHBheWxvYWQuc3RhcnRzV2l0aChcIjB4XCIpIHx8ICFwYXlsb2FkLm1hdGNoKC9eWzAtOUEtRmEtZl0rJC8pKSB7XG4gICAgICAgIHRocm93IG5ldyBIZXhFcnJvcihcbiAgICAgICAgICBcIkhFWFNUUlBheWxvYWQuY29uc3RydWN0b3IgLS0gaGV4IHN0cmluZyBtYXkgbm90IHN0YXJ0IHdpdGggMHggYW5kIG11c3QgYmUgaW4gL15bMC05QS1GYS1mXSskLzogXCIgK1xuICAgICAgICAgICAgcGF5bG9hZFxuICAgICAgICApXG4gICAgICB9XG4gICAgICB0aGlzLnBheWxvYWQgPSBCdWZmZXIuZnJvbShwYXlsb2FkLCBcImhleFwiKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgQmFzZTU4IGVuY29kaW5nLlxuICovXG5leHBvcnQgY2xhc3MgQjU4U1RSUGF5bG9hZCBleHRlbmRzIFBheWxvYWRCYXNlIHtcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDNcblxuICAvKipcbiAgICogUmV0dXJucyBhIGJhc2U1OCBzdHJpbmcgZm9yIHRoZSBwYXlsb2FkLlxuICAgKi9cbiAgcmV0dXJuVHlwZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBiaW50b29scy5idWZmZXJUb0I1OCh0aGlzLnBheWxvYWQpXG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSBwYXlsb2FkIEJ1ZmZlciBvciBjYjU4IGVuY29kZWQgc3RyaW5nXG4gICAqL1xuICBjb25zdHJ1Y3RvcihwYXlsb2FkOiBhbnkgPSB1bmRlZmluZWQpIHtcbiAgICBzdXBlcigpXG4gICAgaWYgKHBheWxvYWQgaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgIHRoaXMucGF5bG9hZCA9IHBheWxvYWRcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBwYXlsb2FkID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLnBheWxvYWQgPSBiaW50b29scy5iNThUb0J1ZmZlcihwYXlsb2FkKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgQmFzZTY0IGVuY29kaW5nLlxuICovXG5leHBvcnQgY2xhc3MgQjY0U1RSUGF5bG9hZCBleHRlbmRzIFBheWxvYWRCYXNlIHtcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDRcblxuICAvKipcbiAgICogUmV0dXJucyBhIGJhc2U2NCBzdHJpbmcgZm9yIHRoZSBwYXlsb2FkLlxuICAgKi9cbiAgcmV0dXJuVHlwZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnBheWxvYWQudG9TdHJpbmcoXCJiYXNlNjRcIilcbiAgfVxuICAvKipcbiAgICogQHBhcmFtIHBheWxvYWQgQnVmZmVyIG9mIGJhc2U2NCBzdHJpbmdcbiAgICovXG4gIGNvbnN0cnVjdG9yKHBheWxvYWQ6IGFueSA9IHVuZGVmaW5lZCkge1xuICAgIHN1cGVyKClcbiAgICBpZiAocGF5bG9hZCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgdGhpcy5wYXlsb2FkID0gcGF5bG9hZFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHBheWxvYWQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMucGF5bG9hZCA9IEJ1ZmZlci5mcm9tKHBheWxvYWQsIFwiYmFzZTY0XCIpXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBCaWcgTnVtYmVycy5cbiAqXG4gKiBAcGFyYW0gcGF5bG9hZCBBY2NlcHRzIGEgQnVmZmVyLCBCTiwgb3IgYmFzZTY0IHN0cmluZ1xuICovXG5leHBvcnQgY2xhc3MgQklHTlVNUGF5bG9hZCBleHRlbmRzIFBheWxvYWRCYXNlIHtcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDVcblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IGZvciB0aGUgcGF5bG9hZC5cbiAgICovXG4gIHJldHVyblR5cGUoKTogQk4ge1xuICAgIHJldHVybiBiaW50b29scy5mcm9tQnVmZmVyVG9CTih0aGlzLnBheWxvYWQpXG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSBwYXlsb2FkIEJ1ZmZlciwgQk4sIG9yIGJhc2U2NCBzdHJpbmdcbiAgICovXG4gIGNvbnN0cnVjdG9yKHBheWxvYWQ6IGFueSA9IHVuZGVmaW5lZCkge1xuICAgIHN1cGVyKClcbiAgICBpZiAocGF5bG9hZCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgdGhpcy5wYXlsb2FkID0gcGF5bG9hZFxuICAgIH0gZWxzZSBpZiAocGF5bG9hZCBpbnN0YW5jZW9mIEJOKSB7XG4gICAgICB0aGlzLnBheWxvYWQgPSBiaW50b29scy5mcm9tQk5Ub0J1ZmZlcihwYXlsb2FkKVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHBheWxvYWQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMucGF5bG9hZCA9IEJ1ZmZlci5mcm9tKHBheWxvYWQsIFwiaGV4XCIpXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBjaGFpbiBhZGRyZXNzZXMuXG4gKlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ2hhaW5BZGRyZXNzUGF5bG9hZCBleHRlbmRzIFBheWxvYWRCYXNlIHtcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDZcbiAgcHJvdGVjdGVkIGNoYWluaWQ6IHN0cmluZyA9IFwiXCJcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY2hhaW5pZC5cbiAgICovXG4gIHJldHVybkNoYWluSUQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5jaGFpbmlkXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBhZGRyZXNzIHN0cmluZyBmb3IgdGhlIHBheWxvYWQuXG4gICAqL1xuICByZXR1cm5UeXBlKGhycDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCB0eXBlOiBTZXJpYWxpemVkVHlwZSA9IFwiYmVjaDMyXCJcbiAgICByZXR1cm4gc2VyaWFsaXphdGlvbi5idWZmZXJUb1R5cGUodGhpcy5wYXlsb2FkLCB0eXBlLCBocnAsIHRoaXMuY2hhaW5pZClcbiAgfVxuICAvKipcbiAgICogQHBhcmFtIHBheWxvYWQgQnVmZmVyIG9yIGFkZHJlc3Mgc3RyaW5nXG4gICAqL1xuICBjb25zdHJ1Y3RvcihwYXlsb2FkOiBhbnkgPSB1bmRlZmluZWQsIGhycD86IHN0cmluZykge1xuICAgIHN1cGVyKClcbiAgICBpZiAocGF5bG9hZCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgdGhpcy5wYXlsb2FkID0gcGF5bG9hZFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHBheWxvYWQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGlmIChocnAgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMucGF5bG9hZCA9IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhwYXlsb2FkLCBocnApXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnBheWxvYWQgPSBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MocGF5bG9hZClcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDbGFzcyBmb3IgcGF5bG9hZHMgcmVwcmVzZW50aW5nIFgtQ2hpbiBhZGRyZXNzZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBYQ0hBSU5BRERSUGF5bG9hZCBleHRlbmRzIENoYWluQWRkcmVzc1BheWxvYWQge1xuICBwcm90ZWN0ZWQgdHlwZWlkID0gNlxuICBwcm90ZWN0ZWQgY2hhaW5pZCA9IFwiWFwiXG59XG5cbi8qKlxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBDb3JlQ2hhaW4gYWRkcmVzc2VzLlxuICovXG5leHBvcnQgY2xhc3MgQ09SRUNIQUlOQUREUlBheWxvYWQgZXh0ZW5kcyBDaGFpbkFkZHJlc3NQYXlsb2FkIHtcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDdcbiAgcHJvdGVjdGVkIGNoYWluaWQgPSBcIlBcIlxufVxuXG4vKipcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgQXBwQ2hhaW4gYWRkcmVzc2VzLlxuICovXG5leHBvcnQgY2xhc3MgQVBQQ0hBSU5BRERSUGF5bG9hZCBleHRlbmRzIENoYWluQWRkcmVzc1BheWxvYWQge1xuICBwcm90ZWN0ZWQgdHlwZWlkID0gOFxuICBwcm90ZWN0ZWQgY2hhaW5pZCA9IFwiQ1wiXG59XG5cbi8qKlxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBkYXRhIHNlcmlhbGl6ZWQgYnkgYmludG9vbHMuY2I1OEVuY29kZSgpLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgY2I1OEVuY29kZWRQYXlsb2FkIGV4dGVuZHMgUGF5bG9hZEJhc2Uge1xuICAvKipcbiAgICogUmV0dXJucyBhIGJpbnRvb2xzLmNiNThFbmNvZGVkIHN0cmluZyBmb3IgdGhlIHBheWxvYWQuXG4gICAqL1xuICByZXR1cm5UeXBlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGJpbnRvb2xzLmNiNThFbmNvZGUodGhpcy5wYXlsb2FkKVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gcGF5bG9hZCBCdWZmZXIgb3IgY2I1OCBlbmNvZGVkIHN0cmluZ1xuICAgKi9cbiAgY29uc3RydWN0b3IocGF5bG9hZDogYW55ID0gdW5kZWZpbmVkKSB7XG4gICAgc3VwZXIoKVxuICAgIGlmIChwYXlsb2FkIGluc3RhbmNlb2YgQnVmZmVyKSB7XG4gICAgICB0aGlzLnBheWxvYWQgPSBwYXlsb2FkXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcGF5bG9hZCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhpcy5wYXlsb2FkID0gYmludG9vbHMuY2I1OERlY29kZShwYXlsb2FkKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgVHhJRHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBUWElEUGF5bG9hZCBleHRlbmRzIGNiNThFbmNvZGVkUGF5bG9hZCB7XG4gIHByb3RlY3RlZCB0eXBlaWQgPSA5XG59XG5cbi8qKlxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBBc3NldElEcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEFTU0VUSURQYXlsb2FkIGV4dGVuZHMgY2I1OEVuY29kZWRQYXlsb2FkIHtcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDEwXG59XG5cbi8qKlxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBOT0RFSURzLlxuICovXG5leHBvcnQgY2xhc3MgVVRYT0lEUGF5bG9hZCBleHRlbmRzIGNiNThFbmNvZGVkUGF5bG9hZCB7XG4gIHByb3RlY3RlZCB0eXBlaWQgPSAxMVxufVxuXG4vKipcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgTkZUSURzIChVVFhPSURzIGluIGFuIE5GVCBjb250ZXh0KS5cbiAqL1xuZXhwb3J0IGNsYXNzIE5GVElEUGF5bG9hZCBleHRlbmRzIFVUWE9JRFBheWxvYWQge1xuICBwcm90ZWN0ZWQgdHlwZWlkID0gMTJcbn1cblxuLyoqXG4gKiBDbGFzcyBmb3IgcGF5bG9hZHMgcmVwcmVzZW50aW5nIEFsbHlDaGFpbklEcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEFMTFlDSEFJTklEUGF5bG9hZCBleHRlbmRzIGNiNThFbmNvZGVkUGF5bG9hZCB7XG4gIHByb3RlY3RlZCB0eXBlaWQgPSAxM1xufVxuXG4vKipcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgQ2hhaW5JRHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBDSEFJTklEUGF5bG9hZCBleHRlbmRzIGNiNThFbmNvZGVkUGF5bG9hZCB7XG4gIHByb3RlY3RlZCB0eXBlaWQgPSAxNFxufVxuXG4vKipcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgTm9kZUlEcy5cbiAqL1xuZXhwb3J0IGNsYXNzIE5PREVJRFBheWxvYWQgZXh0ZW5kcyBjYjU4RW5jb2RlZFBheWxvYWQge1xuICBwcm90ZWN0ZWQgdHlwZWlkID0gMTVcbn1cblxuLyoqXG4gKiBDbGFzcyBmb3IgcGF5bG9hZHMgcmVwcmVzZW50aW5nIHNlY3AyNTZrMSBzaWduYXR1cmVzLlxuICogY29udmVudGlvbjogc2VjcDI1NmsxIHNpZ25hdHVyZSAoMTMwIGJ5dGVzKVxuICovXG5leHBvcnQgY2xhc3MgU0VDUFNJR1BheWxvYWQgZXh0ZW5kcyBCNThTVFJQYXlsb2FkIHtcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDE2XG59XG5cbi8qKlxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBzZWNwMjU2azEgZW5jcnlwdGVkIG1lc3NhZ2VzLlxuICogY29udmVudGlvbjogcHVibGljIGtleSAoNjUgYnl0ZXMpICsgc2VjcDI1NmsxIGVuY3J5cHRlZCBtZXNzYWdlIGZvciB0aGF0IHB1YmxpYyBrZXlcbiAqL1xuZXhwb3J0IGNsYXNzIFNFQ1BFTkNQYXlsb2FkIGV4dGVuZHMgQjU4U1RSUGF5bG9hZCB7XG4gIHByb3RlY3RlZCB0eXBlaWQgPSAxN1xufVxuXG4vKipcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgSlBFRyBpbWFnZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBKUEVHUGF5bG9hZCBleHRlbmRzIEJJTlBheWxvYWQge1xuICBwcm90ZWN0ZWQgdHlwZWlkID0gMThcbn1cblxuZXhwb3J0IGNsYXNzIFBOR1BheWxvYWQgZXh0ZW5kcyBCSU5QYXlsb2FkIHtcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDE5XG59XG5cbi8qKlxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBCTVAgaW1hZ2VzLlxuICovXG5leHBvcnQgY2xhc3MgQk1QUGF5bG9hZCBleHRlbmRzIEJJTlBheWxvYWQge1xuICBwcm90ZWN0ZWQgdHlwZWlkID0gMjBcbn1cblxuLyoqXG4gKiBDbGFzcyBmb3IgcGF5bG9hZHMgcmVwcmVzZW50aW5nIElDTyBpbWFnZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBJQ09QYXlsb2FkIGV4dGVuZHMgQklOUGF5bG9hZCB7XG4gIHByb3RlY3RlZCB0eXBlaWQgPSAyMVxufVxuXG4vKipcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgU1ZHIGltYWdlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIFNWR1BheWxvYWQgZXh0ZW5kcyBVVEY4UGF5bG9hZCB7XG4gIHByb3RlY3RlZCB0eXBlaWQgPSAyMlxufVxuXG4vKipcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgQ1NWIGZpbGVzLlxuICovXG5leHBvcnQgY2xhc3MgQ1NWUGF5bG9hZCBleHRlbmRzIFVURjhQYXlsb2FkIHtcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDIzXG59XG5cbi8qKlxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBKU09OIHN0cmluZ3MuXG4gKi9cbmV4cG9ydCBjbGFzcyBKU09OUGF5bG9hZCBleHRlbmRzIFBheWxvYWRCYXNlIHtcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDI0XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBKU09OLWRlY29kZWQgb2JqZWN0IGZvciB0aGUgcGF5bG9hZC5cbiAgICovXG4gIHJldHVyblR5cGUoKTogYW55IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZSh0aGlzLnBheWxvYWQudG9TdHJpbmcoXCJ1dGY4XCIpKVxuICB9XG5cbiAgY29uc3RydWN0b3IocGF5bG9hZDogYW55ID0gdW5kZWZpbmVkKSB7XG4gICAgc3VwZXIoKVxuICAgIGlmIChwYXlsb2FkIGluc3RhbmNlb2YgQnVmZmVyKSB7XG4gICAgICB0aGlzLnBheWxvYWQgPSBwYXlsb2FkXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcGF5bG9hZCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhpcy5wYXlsb2FkID0gQnVmZmVyLmZyb20ocGF5bG9hZCwgXCJ1dGY4XCIpXG4gICAgfSBlbHNlIGlmIChwYXlsb2FkKSB7XG4gICAgICBsZXQganNvbnN0cjogc3RyaW5nID0gSlNPTi5zdHJpbmdpZnkocGF5bG9hZClcbiAgICAgIHRoaXMucGF5bG9hZCA9IEJ1ZmZlci5mcm9tKGpzb25zdHIsIFwidXRmOFwiKVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgWUFNTCBkZWZpbml0aW9ucy5cbiAqL1xuZXhwb3J0IGNsYXNzIFlBTUxQYXlsb2FkIGV4dGVuZHMgVVRGOFBheWxvYWQge1xuICBwcm90ZWN0ZWQgdHlwZWlkID0gMjVcbn1cblxuLyoqXG4gKiBDbGFzcyBmb3IgcGF5bG9hZHMgcmVwcmVzZW50aW5nIGVtYWlsIGFkZHJlc3Nlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIEVNQUlMUGF5bG9hZCBleHRlbmRzIFVURjhQYXlsb2FkIHtcbiAgcHJvdGVjdGVkIHR5cGVpZCA9IDI2XG59XG5cbi8qKlxuICogQ2xhc3MgZm9yIHBheWxvYWRzIHJlcHJlc2VudGluZyBVUkwgc3RyaW5ncy5cbiAqL1xuZXhwb3J0IGNsYXNzIFVSTFBheWxvYWQgZXh0ZW5kcyBVVEY4UGF5bG9hZCB7XG4gIHByb3RlY3RlZCB0eXBlaWQgPSAyN1xufVxuXG4vKipcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgSVBGUyBhZGRyZXNzZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBJUEZTUGF5bG9hZCBleHRlbmRzIEI1OFNUUlBheWxvYWQge1xuICBwcm90ZWN0ZWQgdHlwZWlkID0gMjhcbn1cblxuLyoqXG4gKiBDbGFzcyBmb3IgcGF5bG9hZHMgcmVwcmVzZW50aW5nIG9uaW9uIFVSTHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBPTklPTlBheWxvYWQgZXh0ZW5kcyBVVEY4UGF5bG9hZCB7XG4gIHByb3RlY3RlZCB0eXBlaWQgPSAyOVxufVxuXG4vKipcbiAqIENsYXNzIGZvciBwYXlsb2FkcyByZXByZXNlbnRpbmcgdG9ycmVudCBtYWduZXQgbGlua3MuXG4gKi9cbmV4cG9ydCBjbGFzcyBNQUdORVRQYXlsb2FkIGV4dGVuZHMgVVRGOFBheWxvYWQge1xuICBwcm90ZWN0ZWQgdHlwZWlkID0gMzBcbn1cbiJdfQ==