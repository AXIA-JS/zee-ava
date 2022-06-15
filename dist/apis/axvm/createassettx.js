"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAssetTx = void 0;
/**
 * @packageDocumentation
 * @module API-AXVM-CreateAssetTx
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const constants_1 = require("./constants");
const initialstates_1 = require("./initialstates");
const basetx_1 = require("./basetx");
const constants_2 = require("../../utils/constants");
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
const utf8 = "utf8";
const decimalString = "decimalString";
const buffer = "Buffer";
class CreateAssetTx extends basetx_1.BaseTx {
    /**
     * Class representing an unsigned Create Asset transaction.
     *
     * @param networkID Optional networkID, [[DefaultNetworkID]]
     * @param blockchainID Optional blockchainID, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param name String for the descriptive name of the asset
     * @param symbol String for the ticker symbol of the asset
     * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AXC = 10^9 $nAXC
     * @param initialState Optional [[InitialStates]] that represent the intial state of a created asset
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, name = undefined, symbol = undefined, denomination = undefined, initialState = undefined) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "CreateAssetTx";
        this._codecID = constants_1.AXVMConstants.LATESTCODEC;
        this._typeID = this._codecID === 0
            ? constants_1.AXVMConstants.CREATEASSETTX
            : constants_1.AXVMConstants.CREATEASSETTX_CODECONE;
        this.name = "";
        this.symbol = "";
        this.denomination = buffer_1.Buffer.alloc(1);
        this.initialState = new initialstates_1.InitialStates();
        if (typeof name === "string" &&
            typeof symbol === "string" &&
            typeof denomination === "number" &&
            denomination >= 0 &&
            denomination <= 32 &&
            typeof initialState !== "undefined") {
            this.initialState = initialState;
            this.name = name;
            this.symbol = symbol;
            this.denomination.writeUInt8(denomination, 0);
        }
    }
    serialize(encoding = "hex") {
        const fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { name: serialization.encoder(this.name, encoding, utf8, utf8), symbol: serialization.encoder(this.symbol, encoding, utf8, utf8), denomination: serialization.encoder(this.denomination, encoding, buffer, decimalString, 1), initialState: this.initialState.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.name = serialization.decoder(fields["name"], encoding, utf8, utf8);
        this.symbol = serialization.decoder(fields["symbol"], encoding, utf8, utf8);
        this.denomination = serialization.decoder(fields["denomination"], encoding, decimalString, buffer, 1);
        this.initialState = new initialstates_1.InitialStates();
        this.initialState.deserialize(fields["initialState"], encoding);
    }
    /**
     * Set the codecID
     *
     * @param codecID The codecID to set
     */
    setCodecID(codecID) {
        if (codecID !== 0 && codecID !== 1) {
            /* istanbul ignore next */
            throw new errors_1.CodecIdError("Error - CreateAssetTx.setCodecID: invalid codecID. Valid codecIDs are 0 and 1.");
        }
        this._codecID = codecID;
        this._typeID =
            this._codecID === 0
                ? constants_1.AXVMConstants.CREATEASSETTX
                : constants_1.AXVMConstants.CREATEASSETTX_CODECONE;
    }
    /**
     * Returns the id of the [[CreateAssetTx]]
     */
    getTxType() {
        return this._typeID;
    }
    /**
     * Returns the array of array of [[Output]]s for the initial state
     */
    getInitialStates() {
        return this.initialState;
    }
    /**
     * Returns the string representation of the name
     */
    getName() {
        return this.name;
    }
    /**
     * Returns the string representation of the symbol
     */
    getSymbol() {
        return this.symbol;
    }
    /**
     * Returns the numeric representation of the denomination
     */
    getDenomination() {
        return this.denomination.readUInt8(0);
    }
    /**
     * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the denomination
     */
    getDenominationBuffer() {
        return this.denomination;
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[CreateAssetTx]], parses it, populates the class, and returns the length of the [[CreateAssetTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[CreateAssetTx]]
     *
     * @returns The length of the raw [[CreateAssetTx]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        const namesize = bintools
            .copyFrom(bytes, offset, offset + 2)
            .readUInt16BE(0);
        offset += 2;
        this.name = bintools
            .copyFrom(bytes, offset, offset + namesize)
            .toString("utf8");
        offset += namesize;
        const symsize = bintools
            .copyFrom(bytes, offset, offset + 2)
            .readUInt16BE(0);
        offset += 2;
        this.symbol = bintools
            .copyFrom(bytes, offset, offset + symsize)
            .toString("utf8");
        offset += symsize;
        this.denomination = bintools.copyFrom(bytes, offset, offset + 1);
        offset += 1;
        const inits = new initialstates_1.InitialStates();
        offset = inits.fromBuffer(bytes, offset);
        this.initialState = inits;
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateAssetTx]].
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const initstatebuff = this.initialState.toBuffer();
        const namebuff = buffer_1.Buffer.alloc(this.name.length);
        namebuff.write(this.name, 0, this.name.length, utf8);
        const namesize = buffer_1.Buffer.alloc(2);
        namesize.writeUInt16BE(this.name.length, 0);
        const symbuff = buffer_1.Buffer.alloc(this.symbol.length);
        symbuff.write(this.symbol, 0, this.symbol.length, utf8);
        const symsize = buffer_1.Buffer.alloc(2);
        symsize.writeUInt16BE(this.symbol.length, 0);
        const bsize = superbuff.length +
            namesize.length +
            namebuff.length +
            symsize.length +
            symbuff.length +
            this.denomination.length +
            initstatebuff.length;
        const barr = [
            superbuff,
            namesize,
            namebuff,
            symsize,
            symbuff,
            this.denomination,
            initstatebuff
        ];
        return buffer_1.Buffer.concat(barr, bsize);
    }
    clone() {
        let newbase = new CreateAssetTx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new CreateAssetTx(...args);
    }
}
exports.CreateAssetTx = CreateAssetTx;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlYXNzZXR0eC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGlzL2F4dm0vY3JlYXRlYXNzZXR0eC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxvQ0FBZ0M7QUFDaEMsb0VBQTJDO0FBQzNDLDJDQUEyQztBQUczQyxtREFBK0M7QUFDL0MscUNBQWlDO0FBQ2pDLHFEQUF3RDtBQUN4RCw2REFJa0M7QUFDbEMsK0NBQWlEO0FBRWpEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNoRSxNQUFNLElBQUksR0FBbUIsTUFBTSxDQUFBO0FBQ25DLE1BQU0sYUFBYSxHQUFtQixlQUFlLENBQUE7QUFDckQsTUFBTSxNQUFNLEdBQW1CLFFBQVEsQ0FBQTtBQUV2QyxNQUFhLGFBQWMsU0FBUSxlQUFNO0lBZ012Qzs7Ozs7Ozs7Ozs7O09BWUc7SUFDSCxZQUNFLFlBQW9CLDRCQUFnQixFQUNwQyxlQUF1QixlQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFDM0MsT0FBNkIsU0FBUyxFQUN0QyxNQUEyQixTQUFTLEVBQ3BDLE9BQWUsU0FBUyxFQUN4QixPQUFlLFNBQVMsRUFDeEIsU0FBaUIsU0FBUyxFQUMxQixlQUF1QixTQUFTLEVBQ2hDLGVBQThCLFNBQVM7UUFFdkMsS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQXZOdkMsY0FBUyxHQUFHLGVBQWUsQ0FBQTtRQUMzQixhQUFRLEdBQUcseUJBQWEsQ0FBQyxXQUFXLENBQUE7UUFDcEMsWUFBTyxHQUNmLElBQUksQ0FBQyxRQUFRLEtBQUssQ0FBQztZQUNqQixDQUFDLENBQUMseUJBQWEsQ0FB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QUMzQyxDQUFDO0NBeUNGO0FBdk9ELHNDQXVPQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1BWFZNLUNyZWF0ZUFzc2V0VHhcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQgeyBBWFZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcbmltcG9ydCB7IFRyYW5zZmVyYWJsZU91dHB1dCB9IGZyb20gXCIuL291dHB1dHNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlSW5wdXQgfSBmcm9tIFwiLi9pbnB1dHNcIlxuaW1wb3J0IHsgSW5pdGlhbFN0YXRlcyB9IGZyb20gXCIuL2luaXRpYWxzdGF0ZXNcIlxuaW1wb3J0IHsgQmFzZVR4IH0gZnJvbSBcIi4vYmFzZXR4XCJcbmltcG9ydCB7IERlZmF1bHROZXR3b3JrSUQgfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcbmltcG9ydCB7XG4gIFNlcmlhbGl6YXRpb24sXG4gIFNlcmlhbGl6ZWRFbmNvZGluZyxcbiAgU2VyaWFsaXplZFR5cGVcbn0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxuaW1wb3J0IHsgQ29kZWNJZEVycm9yIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXG5jb25zdCB1dGY4OiBTZXJpYWxpemVkVHlwZSA9IFwidXRmOFwiXG5jb25zdCBkZWNpbWFsU3RyaW5nOiBTZXJpYWxpemVkVHlwZSA9IFwiZGVjaW1hbFN0cmluZ1wiXG5jb25zdCBidWZmZXI6IFNlcmlhbGl6ZWRUeXBlID0gXCJCdWZmZXJcIlxuXG5leHBvcnQgY2xhc3MgQ3JlYXRlQXNzZXRUeCBleHRlbmRzIEJhc2VUeCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIkNyZWF0ZUFzc2V0VHhcIlxuICBwcm90ZWN0ZWQgX2NvZGVjSUQgPSBBWFZNQ29uc3RhbnRzLkxBVEVTVENPREVDXG4gIHByb3RlY3RlZCBfdHlwZUlEID1cbiAgICB0aGlzLl9jb2RlY0lEID09PSAwXG4gICAgICA/IEFYVk1Db25zdGFudHMuQ1JFQVRFQVNTRVRUWFxuICAgICAgOiBBWFZNQ29uc3RhbnRzLkNSRUFURUFTU0VUVFhfQ09ERUNPTkVcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGNvbnN0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBuYW1lOiBzZXJpYWxpemF0aW9uLmVuY29kZXIodGhpcy5uYW1lLCBlbmNvZGluZywgdXRmOCwgdXRmOCksXG4gICAgICBzeW1ib2w6IHNlcmlhbGl6YXRpb24uZW5jb2Rlcih0aGlzLnN5bWJvbCwgZW5jb2RpbmcsIHV0ZjgsIHV0ZjgpLFxuICAgICAgZGVub21pbmF0aW9uOiBzZXJpYWxpemF0aW9uLmVuY29kZXIoXG4gICAgICAgIHRoaXMuZGVub21pbmF0aW9uLFxuICAgICAgICBlbmNvZGluZyxcbiAgICAgICAgYnVmZmVyLFxuICAgICAgICBkZWNpbWFsU3RyaW5nLFxuICAgICAgICAxXG4gICAgICApLFxuICAgICAgaW5pdGlhbFN0YXRlOiB0aGlzLmluaXRpYWxTdGF0ZS5zZXJpYWxpemUoZW5jb2RpbmcpXG4gICAgfVxuICB9XG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy5uYW1lID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKGZpZWxkc1tcIm5hbWVcIl0sIGVuY29kaW5nLCB1dGY4LCB1dGY4KVxuICAgIHRoaXMuc3ltYm9sID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKGZpZWxkc1tcInN5bWJvbFwiXSwgZW5jb2RpbmcsIHV0ZjgsIHV0ZjgpXG4gICAgdGhpcy5kZW5vbWluYXRpb24gPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJkZW5vbWluYXRpb25cIl0sXG4gICAgICBlbmNvZGluZyxcbiAgICAgIGRlY2ltYWxTdHJpbmcsXG4gICAgICBidWZmZXIsXG4gICAgICAxXG4gICAgKVxuICAgIHRoaXMuaW5pdGlhbFN0YXRlID0gbmV3IEluaXRpYWxTdGF0ZXMoKVxuICAgIHRoaXMuaW5pdGlhbFN0YXRlLmRlc2VyaWFsaXplKGZpZWxkc1tcImluaXRpYWxTdGF0ZVwiXSwgZW5jb2RpbmcpXG4gIH1cblxuICBwcm90ZWN0ZWQgbmFtZTogc3RyaW5nID0gXCJcIlxuICBwcm90ZWN0ZWQgc3ltYm9sOiBzdHJpbmcgPSBcIlwiXG4gIHByb3RlY3RlZCBkZW5vbWluYXRpb246IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygxKVxuICBwcm90ZWN0ZWQgaW5pdGlhbFN0YXRlOiBJbml0aWFsU3RhdGVzID0gbmV3IEluaXRpYWxTdGF0ZXMoKVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvZGVjSURcbiAgICpcbiAgICogQHBhcmFtIGNvZGVjSUQgVGhlIGNvZGVjSUQgdG8gc2V0XG4gICAqL1xuICBzZXRDb2RlY0lEKGNvZGVjSUQ6IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChjb2RlY0lEICE9PSAwICYmIGNvZGVjSUQgIT09IDEpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgQ29kZWNJZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gQ3JlYXRlQXNzZXRUeC5zZXRDb2RlY0lEOiBpbnZhbGlkIGNvZGVjSUQuIFZhbGlkIGNvZGVjSURzIGFyZSAwIGFuZCAxLlwiXG4gICAgICApXG4gICAgfVxuICAgIHRoaXMuX2NvZGVjSUQgPSBjb2RlY0lEXG4gICAgdGhpcy5fdHlwZUlEID1cbiAgICAgIHRoaXMuX2NvZGVjSUQgPT09IDBcbiAgICAgICAgPyBBWFZNQ29uc3RhbnRzLkNSRUFURUFTU0VUVFhcbiAgICAgICAgOiBBWFZNQ29uc3RhbnRzLkNSRUFURUFTU0VUVFhfQ09ERUNPTkVcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpZCBvZiB0aGUgW1tDcmVhdGVBc3NldFR4XV1cbiAgICovXG4gIGdldFR4VHlwZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90eXBlSURcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhcnJheSBvZiBhcnJheSBvZiBbW091dHB1dF1dcyBmb3IgdGhlIGluaXRpYWwgc3RhdGVcbiAgICovXG4gIGdldEluaXRpYWxTdGF0ZXMoKTogSW5pdGlhbFN0YXRlcyB7XG4gICAgcmV0dXJuIHRoaXMuaW5pdGlhbFN0YXRlXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBuYW1lXG4gICAqL1xuICBnZXROYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMubmFtZVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgc3ltYm9sXG4gICAqL1xuICBnZXRTeW1ib2woKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5zeW1ib2xcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBudW1lcmljIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBkZW5vbWluYXRpb25cbiAgICovXG4gIGdldERlbm9taW5hdGlvbigpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmRlbm9taW5hdGlvbi5yZWFkVUludDgoMClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZGVub21pbmF0aW9uXG4gICAqL1xuICBnZXREZW5vbWluYXRpb25CdWZmZXIoKTogQnVmZmVyIHtcbiAgICByZXR1cm4gdGhpcy5kZW5vbWluYXRpb25cbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYW4gW1tDcmVhdGVBc3NldFR4XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgW1tDcmVhdGVBc3NldFR4XV0gaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tDcmVhdGVBc3NldFR4XV1cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgcmF3IFtbQ3JlYXRlQXNzZXRUeF1dXG4gICAqXG4gICAqIEByZW1hcmtzIGFzc3VtZSBub3QtY2hlY2tzdW1tZWRcbiAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG5cbiAgICBjb25zdCBuYW1lc2l6ZTogbnVtYmVyID0gYmludG9vbHNcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyKVxuICAgICAgLnJlYWRVSW50MTZCRSgwKVxuICAgIG9mZnNldCArPSAyXG4gICAgdGhpcy5uYW1lID0gYmludG9vbHNcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyBuYW1lc2l6ZSlcbiAgICAgIC50b1N0cmluZyhcInV0ZjhcIilcbiAgICBvZmZzZXQgKz0gbmFtZXNpemVcblxuICAgIGNvbnN0IHN5bXNpemU6IG51bWJlciA9IGJpbnRvb2xzXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMilcbiAgICAgIC5yZWFkVUludDE2QkUoMClcbiAgICBvZmZzZXQgKz0gMlxuICAgIHRoaXMuc3ltYm9sID0gYmludG9vbHNcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyBzeW1zaXplKVxuICAgICAgLnRvU3RyaW5nKFwidXRmOFwiKVxuICAgIG9mZnNldCArPSBzeW1zaXplXG5cbiAgICB0aGlzLmRlbm9taW5hdGlvbiA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDEpXG4gICAgb2Zmc2V0ICs9IDFcblxuICAgIGNvbnN0IGluaXRzOiBJbml0aWFsU3RhdGVzID0gbmV3IEluaXRpYWxTdGF0ZXMoKVxuICAgIG9mZnNldCA9IGluaXRzLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICB0aGlzLmluaXRpYWxTdGF0ZSA9IGluaXRzXG5cbiAgICByZXR1cm4gb2Zmc2V0XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW0NyZWF0ZUFzc2V0VHhdXS5cbiAgICovXG4gIHRvQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgY29uc3Qgc3VwZXJidWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXG4gICAgY29uc3QgaW5pdHN0YXRlYnVmZjogQnVmZmVyID0gdGhpcy5pbml0aWFsU3RhdGUudG9CdWZmZXIoKVxuXG4gICAgY29uc3QgbmFtZWJ1ZmY6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyh0aGlzLm5hbWUubGVuZ3RoKVxuICAgIG5hbWVidWZmLndyaXRlKHRoaXMubmFtZSwgMCwgdGhpcy5uYW1lLmxlbmd0aCwgdXRmOClcbiAgICBjb25zdCBuYW1lc2l6ZTogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDIpXG4gICAgbmFtZXNpemUud3JpdGVVSW50MTZCRSh0aGlzLm5hbWUubGVuZ3RoLCAwKVxuXG4gICAgY29uc3Qgc3ltYnVmZjogQnVmZmVyID0gQnVmZmVyLmFsbG9jKHRoaXMuc3ltYm9sLmxlbmd0aClcbiAgICBzeW1idWZmLndyaXRlKHRoaXMuc3ltYm9sLCAwLCB0aGlzLnN5bWJvbC5sZW5ndGgsIHV0ZjgpXG4gICAgY29uc3Qgc3ltc2l6ZTogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDIpXG4gICAgc3ltc2l6ZS53cml0ZVVJbnQxNkJFKHRoaXMuc3ltYm9sLmxlbmd0aCwgMClcblxuICAgIGNvbnN0IGJzaXplOiBudW1iZXIgPVxuICAgICAgc3VwZXJidWZmLmxlbmd0aCArXG4gICAgICBuYW1lc2l6ZS5sZW5ndGggK1xuICAgICAgbmFtZWJ1ZmYubGVuZ3RoICtcbiAgICAgIHN5bXNpemUubGVuZ3RoICtcbiAgICAgIHN5bWJ1ZmYubGVuZ3RoICtcbiAgICAgIHRoaXMuZGVub21pbmF0aW9uLmxlbmd0aCArXG4gICAgICBpbml0c3RhdGVidWZmLmxlbmd0aFxuICAgIGNvbnN0IGJhcnI6IEJ1ZmZlcltdID0gW1xuICAgICAgc3VwZXJidWZmLFxuICAgICAgbmFtZXNpemUsXG4gICAgICBuYW1lYnVmZixcbiAgICAgIHN5bXNpemUsXG4gICAgICBzeW1idWZmLFxuICAgICAgdGhpcy5kZW5vbWluYXRpb24sXG4gICAgICBpbml0c3RhdGVidWZmXG4gICAgXVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgbGV0IG5ld2Jhc2U6IENyZWF0ZUFzc2V0VHggPSBuZXcgQ3JlYXRlQXNzZXRUeCgpXG4gICAgbmV3YmFzZS5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcbiAgICByZXR1cm4gbmV3YmFzZSBhcyB0aGlzXG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IENyZWF0ZUFzc2V0VHgoLi4uYXJncykgYXMgdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBDcmVhdGUgQXNzZXQgdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwgbmV0d29ya0lELCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIE9wdGlvbmFsIGJsb2NrY2hhaW5JRCwgZGVmYXVsdCBCdWZmZXIuYWxsb2MoMzIsIDE2KVxuICAgKiBAcGFyYW0gb3V0cyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXNcbiAgICogQHBhcmFtIGlucyBPcHRpb25hbCBhcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVJbnB1dF1dc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIG1lbW8gZmllbGRcbiAgICogQHBhcmFtIG5hbWUgU3RyaW5nIGZvciB0aGUgZGVzY3JpcHRpdmUgbmFtZSBvZiB0aGUgYXNzZXRcbiAgICogQHBhcmFtIHN5bWJvbCBTdHJpbmcgZm9yIHRoZSB0aWNrZXIgc3ltYm9sIG9mIHRoZSBhc3NldFxuICAgKiBAcGFyYW0gZGVub21pbmF0aW9uIE9wdGlvbmFsIG51bWJlciBmb3IgdGhlIGRlbm9taW5hdGlvbiB3aGljaCBpcyAxMF5ELiBEIG11c3QgYmUgPj0gMCBhbmQgPD0gMzIuIEV4OiAkMSBBWEMgPSAxMF45ICRuQVhDXG4gICAqIEBwYXJhbSBpbml0aWFsU3RhdGUgT3B0aW9uYWwgW1tJbml0aWFsU3RhdGVzXV0gdGhhdCByZXByZXNlbnQgdGhlIGludGlhbCBzdGF0ZSBvZiBhIGNyZWF0ZWQgYXNzZXRcbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygzMiwgMTYpLFxuICAgIG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gdW5kZWZpbmVkLFxuICAgIGluczogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgbmFtZTogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIHN5bWJvbDogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIGRlbm9taW5hdGlvbjogbnVtYmVyID0gdW5kZWZpbmVkLFxuICAgIGluaXRpYWxTdGF0ZTogSW5pdGlhbFN0YXRlcyA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcihuZXR3b3JrSUQsIGJsb2NrY2hhaW5JRCwgb3V0cywgaW5zLCBtZW1vKVxuICAgIGlmIChcbiAgICAgIHR5cGVvZiBuYW1lID09PSBcInN0cmluZ1wiICYmXG4gICAgICB0eXBlb2Ygc3ltYm9sID09PSBcInN0cmluZ1wiICYmXG4gICAgICB0eXBlb2YgZGVub21pbmF0aW9uID09PSBcIm51bWJlclwiICYmXG4gICAgICBkZW5vbWluYXRpb24gPj0gMCAmJlxuICAgICAgZGVub21pbmF0aW9uIDw9IDMyICYmXG4gICAgICB0eXBlb2YgaW5pdGlhbFN0YXRlICE9PSBcInVuZGVmaW5lZFwiXG4gICAgKSB7XG4gICAgICB0aGlzLmluaXRpYWxTdGF0ZSA9IGluaXRpYWxTdGF0ZVxuICAgICAgdGhpcy5uYW1lID0gbmFtZVxuICAgICAgdGhpcy5zeW1ib2wgPSBzeW1ib2xcbiAgICAgIHRoaXMuZGVub21pbmF0aW9uLndyaXRlVUludDgoZGVub21pbmF0aW9uLCAwKVxuICAgIH1cbiAgfVxufVxuIl19