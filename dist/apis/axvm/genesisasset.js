"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenesisAsset = void 0;
/**
 * @packageDocumentation
 * @module API-AXVM-GenesisAsset
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const initialstates_1 = require("./initialstates");
const constants_1 = require("../../utils/constants");
const serialization_1 = require("../../utils/serialization");
const createassettx_1 = require("./createassettx");
const bn_js_1 = __importDefault(require("bn.js"));
/**
 * @ignore
 */
const serialization = serialization_1.Serialization.getInstance();
const bintools = bintools_1.default.getInstance();
const utf8 = "utf8";
const buffer = "Buffer";
const decimalString = "decimalString";
class GenesisAsset extends createassettx_1.CreateAssetTx {
    /**
     * Class representing a GenesisAsset
     *
     * @param assetAlias Optional String for the asset alias
     * @param name Optional String for the descriptive name of the asset
     * @param symbol Optional String for the ticker symbol of the asset
     * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AXC = 10^9 $nAXC
     * @param initialState Optional [[InitialStates]] that represent the intial state of a created asset
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     */
    constructor(assetAlias = undefined, name = undefined, symbol = undefined, denomination = undefined, initialState = undefined, memo = undefined) {
        super(constants_1.DefaultNetworkID, buffer_1.Buffer.alloc(32), [], [], memo);
        this._typeName = "GenesisAsset";
        this._codecID = undefined;
        this._typeID = undefined;
        this.assetAlias = "";
        /**
         * Returns the string representation of the assetAlias
         */
        this.getAssetAlias = () => this.assetAlias;
        if (typeof assetAlias === "string" &&
            typeof name === "string" &&
            typeof symbol === "string" &&
            typeof denomination === "number" &&
            denomination >= 0 &&
            denomination <= 32 &&
            typeof initialState !== "undefined") {
            this.assetAlias = assetAlias;
            this.name = name;
            this.symbol = symbol;
            this.denomination.writeUInt8(denomination, 0);
            this.initialState = initialState;
        }
    }
    serialize(encoding = "hex") {
        const fields = super.serialize(encoding);
        delete fields["blockchainID"];
        delete fields["outs"];
        delete fields["ins"];
        return Object.assign(Object.assign({}, fields), { assetAlias: serialization.encoder(this.assetAlias, encoding, utf8, utf8), name: serialization.encoder(this.name, encoding, utf8, utf8), symbol: serialization.encoder(this.symbol, encoding, utf8, utf8), denomination: serialization.encoder(this.denomination, encoding, buffer, decimalString, 1), initialState: this.initialState.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        fields["blockchainID"] = buffer_1.Buffer.alloc(32, 16).toString("hex");
        fields["outs"] = [];
        fields["ins"] = [];
        super.deserialize(fields, encoding);
        this.assetAlias = serialization.decoder(fields["assetAlias"], encoding, utf8, utf8);
        this.name = serialization.decoder(fields["name"], encoding, utf8, utf8);
        this.symbol = serialization.decoder(fields["symbol"], encoding, utf8, utf8);
        this.denomination = serialization.decoder(fields["denomination"], encoding, decimalString, buffer, 1);
        this.initialState = new initialstates_1.InitialStates();
        this.initialState.deserialize(fields["initialState"], encoding);
    }
    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[GenesisAsset]], parses it, populates the class, and returns the length of the [[GenesisAsset]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[GenesisAsset]]
     *
     * @returns The length of the raw [[GenesisAsset]]
     *
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes, offset = 0) {
        const assetAliasSize = bintools
            .copyFrom(bytes, offset, offset + 2)
            .readUInt16BE(0);
        offset += 2;
        this.assetAlias = bintools
            .copyFrom(bytes, offset, offset + assetAliasSize)
            .toString("utf8");
        offset += assetAliasSize;
        offset += super.fromBuffer(bytes, offset);
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[GenesisAsset]].
     */
    toBuffer(networkID = constants_1.DefaultNetworkID) {
        // asset alias
        const assetAlias = this.getAssetAlias();
        const assetAliasbuffSize = buffer_1.Buffer.alloc(2);
        assetAliasbuffSize.writeUInt16BE(assetAlias.length, 0);
        let bsize = assetAliasbuffSize.length;
        let barr = [assetAliasbuffSize];
        const assetAliasbuff = buffer_1.Buffer.alloc(assetAlias.length);
        assetAliasbuff.write(assetAlias, 0, assetAlias.length, utf8);
        bsize += assetAliasbuff.length;
        barr.push(assetAliasbuff);
        const networkIDBuff = buffer_1.Buffer.alloc(4);
        networkIDBuff.writeUInt32BE(new bn_js_1.default(networkID).toNumber(), 0);
        bsize += networkIDBuff.length;
        barr.push(networkIDBuff);
        // Blockchain ID
        bsize += 32;
        barr.push(buffer_1.Buffer.alloc(32));
        // num Outputs
        bsize += 4;
        barr.push(buffer_1.Buffer.alloc(4));
        // num Inputs
        bsize += 4;
        barr.push(buffer_1.Buffer.alloc(4));
        // memo
        const memo = this.getMemo();
        const memobuffSize = buffer_1.Buffer.alloc(4);
        memobuffSize.writeUInt32BE(memo.length, 0);
        bsize += memobuffSize.length;
        barr.push(memobuffSize);
        bsize += memo.length;
        barr.push(memo);
        // asset name
        const name = this.getName();
        const namebuffSize = buffer_1.Buffer.alloc(2);
        namebuffSize.writeUInt16BE(name.length, 0);
        bsize += namebuffSize.length;
        barr.push(namebuffSize);
        const namebuff = buffer_1.Buffer.alloc(name.length);
        namebuff.write(name, 0, name.length, utf8);
        bsize += namebuff.length;
        barr.push(namebuff);
        // symbol
        const symbol = this.getSymbol();
        const symbolbuffSize = buffer_1.Buffer.alloc(2);
        symbolbuffSize.writeUInt16BE(symbol.length, 0);
        bsize += symbolbuffSize.length;
        barr.push(symbolbuffSize);
        const symbolbuff = buffer_1.Buffer.alloc(symbol.length);
        symbolbuff.write(symbol, 0, symbol.length, utf8);
        bsize += symbolbuff.length;
        barr.push(symbolbuff);
        // denomination
        const denomination = this.getDenomination();
        const denominationbuffSize = buffer_1.Buffer.alloc(1);
        denominationbuffSize.writeUInt8(denomination, 0);
        bsize += denominationbuffSize.length;
        barr.push(denominationbuffSize);
        bsize += this.initialState.toBuffer().length;
        barr.push(this.initialState.toBuffer());
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.GenesisAsset = GenesisAsset;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXNpc2Fzc2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYXh2bS9nZW5lc2lzYXNzZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWdDO0FBQ2hDLG9FQUEyQztBQUMzQyxtREFBK0M7QUFDL0MscURBQXdEO0FBQ3hELDZEQUlrQztBQUNsQyxtREFBK0M7QUFDL0Msa0RBQXNCO0FBRXRCOztHQUVHO0FBQ0gsTUFBTSxhQUFhLEdBQWtCLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDaEUsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLElBQUksR0FBbUIsTUFBTSxDQUFBO0FBQ25DLE1BQU0sTUFBTSxHQUFtQixRQUFRLENBQUE7QUFDdkMsTUFBTSxhQUFhLEdBQW1CLGVBQWUsQ0FBQTtBQUVyRCxNQUFhLFlBQWEsU0FBUSw2QkFBYTtJQTRKN0M7Ozs7Ozs7OztPQVNHO0lBQ0gsWUFDRSxhQUFxQixTQUFTLEVBQzlCLE9BQWUsU0FBUyxFQUN4QixTQUFpQixTQUFTLEVBQzFCLGVBQXVCLFNBQVMsRUFDaEMsZUFBOEIsU0FBUyxFQUN2QyxPQUFlLFNBQVM7UUFFeEIsS0FBSyxDQUFDLDRCQUFnQixFQUFFLGVBQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQTdLL0MsY0FBUyxHQUFHLGNBQWMsQ0FBQTtRQUMxQixhQUFRLEdBQUcsU0FBUyxDQUFBO1FBQ3BCLFlBQU8sR0FBRyxTQUFTLENBQUE7UUErQ25CLGVBQVUsR0FBVyxFQUFFLENBQUE7UUFFakM7O1dBRUc7UUFDSCxrQkFBYSxHQUFHLEdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUE7UUF3SDNDLElBQ0UsT0FBTyxVQUFVLEtBQUssUUFBUTtZQUM5QixP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QUFJLENBQUMsQ0FBQTtRQUNoRCxLQUFLLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQTtRQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBRXJCLGVBQWU7UUFDZixNQUFNLFlBQVksR0FBVyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUE7UUFDbkQsTUFBTSxvQkFBb0IsR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3BELG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDaEQsS0FBSyxJQUFJLG9CQUFvQixDQUFDLE1BQU0sQ0FBQTtRQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUE7UUFFL0IsS0FBSyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxDQUFBO1FBQzVDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO1FBQ3ZDLE9BQU8sZUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUE7SUFDbkMsQ0FBQztDQXFDRjtBQS9MRCxvQ0ErTEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktQVhWTS1HZW5lc2lzQXNzZXRcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQgeyBJbml0aWFsU3RhdGVzIH0gZnJvbSBcIi4vaW5pdGlhbHN0YXRlc1wiXG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lEIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2NvbnN0YW50c1wiXG5pbXBvcnQge1xuICBTZXJpYWxpemF0aW9uLFxuICBTZXJpYWxpemVkRW5jb2RpbmcsXG4gIFNlcmlhbGl6ZWRUeXBlXG59IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcbmltcG9ydCB7IENyZWF0ZUFzc2V0VHggfSBmcm9tIFwiLi9jcmVhdGVhc3NldHR4XCJcbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3QgdXRmODogU2VyaWFsaXplZFR5cGUgPSBcInV0ZjhcIlxuY29uc3QgYnVmZmVyOiBTZXJpYWxpemVkVHlwZSA9IFwiQnVmZmVyXCJcbmNvbnN0IGRlY2ltYWxTdHJpbmc6IFNlcmlhbGl6ZWRUeXBlID0gXCJkZWNpbWFsU3RyaW5nXCJcblxuZXhwb3J0IGNsYXNzIEdlbmVzaXNBc3NldCBleHRlbmRzIENyZWF0ZUFzc2V0VHgge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJHZW5lc2lzQXNzZXRcIlxuICBwcm90ZWN0ZWQgX2NvZGVjSUQgPSB1bmRlZmluZWRcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGNvbnN0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIGRlbGV0ZSBmaWVsZHNbXCJibG9ja2NoYWluSURcIl1cbiAgICBkZWxldGUgZmllbGRzW1wib3V0c1wiXVxuICAgIGRlbGV0ZSBmaWVsZHNbXCJpbnNcIl1cbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgYXNzZXRBbGlhczogc2VyaWFsaXphdGlvbi5lbmNvZGVyKHRoaXMuYXNzZXRBbGlhcywgZW5jb2RpbmcsIHV0ZjgsIHV0ZjgpLFxuICAgICAgbmFtZTogc2VyaWFsaXphdGlvbi5lbmNvZGVyKHRoaXMubmFtZSwgZW5jb2RpbmcsIHV0ZjgsIHV0ZjgpLFxuICAgICAgc3ltYm9sOiBzZXJpYWxpemF0aW9uLmVuY29kZXIodGhpcy5zeW1ib2wsIGVuY29kaW5nLCB1dGY4LCB1dGY4KSxcbiAgICAgIGRlbm9taW5hdGlvbjogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxuICAgICAgICB0aGlzLmRlbm9taW5hdGlvbixcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIGJ1ZmZlcixcbiAgICAgICAgZGVjaW1hbFN0cmluZyxcbiAgICAgICAgMVxuICAgICAgKSxcbiAgICAgIGluaXRpYWxTdGF0ZTogdGhpcy5pbml0aWFsU3RhdGUuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIH1cbiAgfVxuXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIGZpZWxkc1tcImJsb2NrY2hhaW5JRFwiXSA9IEJ1ZmZlci5hbGxvYygzMiwgMTYpLnRvU3RyaW5nKFwiaGV4XCIpXG4gICAgZmllbGRzW1wib3V0c1wiXSA9IFtdXG4gICAgZmllbGRzW1wiaW5zXCJdID0gW11cbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMuYXNzZXRBbGlhcyA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcbiAgICAgIGZpZWxkc1tcImFzc2V0QWxpYXNcIl0sXG4gICAgICBlbmNvZGluZyxcbiAgICAgIHV0ZjgsXG4gICAgICB1dGY4XG4gICAgKVxuICAgIHRoaXMubmFtZSA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihmaWVsZHNbXCJuYW1lXCJdLCBlbmNvZGluZywgdXRmOCwgdXRmOClcbiAgICB0aGlzLnN5bWJvbCA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihmaWVsZHNbXCJzeW1ib2xcIl0sIGVuY29kaW5nLCB1dGY4LCB1dGY4KVxuICAgIHRoaXMuZGVub21pbmF0aW9uID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wiZGVub21pbmF0aW9uXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBkZWNpbWFsU3RyaW5nLFxuICAgICAgYnVmZmVyLFxuICAgICAgMVxuICAgIClcbiAgICB0aGlzLmluaXRpYWxTdGF0ZSA9IG5ldyBJbml0aWFsU3RhdGVzKClcbiAgICB0aGlzLmluaXRpYWxTdGF0ZS5kZXNlcmlhbGl6ZShmaWVsZHNbXCJpbml0aWFsU3RhdGVcIl0sIGVuY29kaW5nKVxuICB9XG5cbiAgcHJvdGVjdGVkIGFzc2V0QWxpYXM6IHN0cmluZyA9IFwiXCJcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBhc3NldEFsaWFzXG4gICAqL1xuICBnZXRBc3NldEFsaWFzID0gKCk6IHN0cmluZyA9PiB0aGlzLmFzc2V0QWxpYXNcblxuICAvKipcbiAgICogVGFrZXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBjb250YWluaW5nIGFuIFtbR2VuZXNpc0Fzc2V0XV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgW1tHZW5lc2lzQXNzZXRdXSBpbiBieXRlcy5cbiAgICpcbiAgICogQHBhcmFtIGJ5dGVzIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhIHJhdyBbW0dlbmVzaXNBc3NldF1dXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsZW5ndGggb2YgdGhlIHJhdyBbW0dlbmVzaXNBc3NldF1dXG4gICAqXG4gICAqIEByZW1hcmtzIGFzc3VtZSBub3QtY2hlY2tzdW1tZWRcbiAgICovXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICBjb25zdCBhc3NldEFsaWFzU2l6ZTogbnVtYmVyID0gYmludG9vbHNcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyKVxuICAgICAgLnJlYWRVSW50MTZCRSgwKVxuICAgIG9mZnNldCArPSAyXG4gICAgdGhpcy5hc3NldEFsaWFzID0gYmludG9vbHNcbiAgICAgIC5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyBhc3NldEFsaWFzU2l6ZSlcbiAgICAgIC50b1N0cmluZyhcInV0ZjhcIilcbiAgICBvZmZzZXQgKz0gYXNzZXRBbGlhc1NpemVcbiAgICBvZmZzZXQgKz0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgIHJldHVybiBvZmZzZXRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbR2VuZXNpc0Fzc2V0XV0uXG4gICAqL1xuICB0b0J1ZmZlcihuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQpOiBCdWZmZXIge1xuICAgIC8vIGFzc2V0IGFsaWFzXG4gICAgY29uc3QgYXNzZXRBbGlhczogc3RyaW5nID0gdGhpcy5nZXRBc3NldEFsaWFzKClcbiAgICBjb25zdCBhc3NldEFsaWFzYnVmZlNpemU6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygyKVxuICAgIGFzc2V0QWxpYXNidWZmU2l6ZS53cml0ZVVJbnQxNkJFKGFzc2V0QWxpYXMubGVuZ3RoLCAwKVxuICAgIGxldCBic2l6ZTogbnVtYmVyID0gYXNzZXRBbGlhc2J1ZmZTaXplLmxlbmd0aFxuICAgIGxldCBiYXJyOiBCdWZmZXJbXSA9IFthc3NldEFsaWFzYnVmZlNpemVdXG4gICAgY29uc3QgYXNzZXRBbGlhc2J1ZmY6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyhhc3NldEFsaWFzLmxlbmd0aClcbiAgICBhc3NldEFsaWFzYnVmZi53cml0ZShhc3NldEFsaWFzLCAwLCBhc3NldEFsaWFzLmxlbmd0aCwgdXRmOClcbiAgICBic2l6ZSArPSBhc3NldEFsaWFzYnVmZi5sZW5ndGhcbiAgICBiYXJyLnB1c2goYXNzZXRBbGlhc2J1ZmYpXG5cbiAgICBjb25zdCBuZXR3b3JrSURCdWZmOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICBuZXR3b3JrSURCdWZmLndyaXRlVUludDMyQkUobmV3IEJOKG5ldHdvcmtJRCkudG9OdW1iZXIoKSwgMClcbiAgICBic2l6ZSArPSBuZXR3b3JrSURCdWZmLmxlbmd0aFxuICAgIGJhcnIucHVzaChuZXR3b3JrSURCdWZmKVxuXG4gICAgLy8gQmxvY2tjaGFpbiBJRFxuICAgIGJzaXplICs9IDMyXG4gICAgYmFyci5wdXNoKEJ1ZmZlci5hbGxvYygzMikpXG5cbiAgICAvLyBudW0gT3V0cHV0c1xuICAgIGJzaXplICs9IDRcbiAgICBiYXJyLnB1c2goQnVmZmVyLmFsbG9jKDQpKVxuXG4gICAgLy8gbnVtIElucHV0c1xuICAgIGJzaXplICs9IDRcbiAgICBiYXJyLnB1c2goQnVmZmVyLmFsbG9jKDQpKVxuXG4gICAgLy8gbWVtb1xuICAgIGNvbnN0IG1lbW86IEJ1ZmZlciA9IHRoaXMuZ2V0TWVtbygpXG4gICAgY29uc3QgbWVtb2J1ZmZTaXplOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICBtZW1vYnVmZlNpemUud3JpdGVVSW50MzJCRShtZW1vLmxlbmd0aCwgMClcbiAgICBic2l6ZSArPSBtZW1vYnVmZlNpemUubGVuZ3RoXG4gICAgYmFyci5wdXNoKG1lbW9idWZmU2l6ZSlcblxuICAgIGJzaXplICs9IG1lbW8ubGVuZ3RoXG4gICAgYmFyci5wdXNoKG1lbW8pXG5cbiAgICAvLyBhc3NldCBuYW1lXG4gICAgY29uc3QgbmFtZTogc3RyaW5nID0gdGhpcy5nZXROYW1lKClcbiAgICBjb25zdCBuYW1lYnVmZlNpemU6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygyKVxuICAgIG5hbWVidWZmU2l6ZS53cml0ZVVJbnQxNkJFKG5hbWUubGVuZ3RoLCAwKVxuICAgIGJzaXplICs9IG5hbWVidWZmU2l6ZS5sZW5ndGhcbiAgICBiYXJyLnB1c2gobmFtZWJ1ZmZTaXplKVxuICAgIGNvbnN0IG5hbWVidWZmOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MobmFtZS5sZW5ndGgpXG4gICAgbmFtZWJ1ZmYud3JpdGUobmFtZSwgMCwgbmFtZS5sZW5ndGgsIHV0ZjgpXG4gICAgYnNpemUgKz0gbmFtZWJ1ZmYubGVuZ3RoXG4gICAgYmFyci5wdXNoKG5hbWVidWZmKVxuXG4gICAgLy8gc3ltYm9sXG4gICAgY29uc3Qgc3ltYm9sOiBzdHJpbmcgPSB0aGlzLmdldFN5bWJvbCgpXG4gICAgY29uc3Qgc3ltYm9sYnVmZlNpemU6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygyKVxuICAgIHN5bWJvbGJ1ZmZTaXplLndyaXRlVUludDE2QkUoc3ltYm9sLmxlbmd0aCwgMClcbiAgICBic2l6ZSArPSBzeW1ib2xidWZmU2l6ZS5sZW5ndGhcbiAgICBiYXJyLnB1c2goc3ltYm9sYnVmZlNpemUpXG5cbiAgICBjb25zdCBzeW1ib2xidWZmOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2Moc3ltYm9sLmxlbmd0aClcbiAgICBzeW1ib2xidWZmLndyaXRlKHN5bWJvbCwgMCwgc3ltYm9sLmxlbmd0aCwgdXRmOClcbiAgICBic2l6ZSArPSBzeW1ib2xidWZmLmxlbmd0aFxuICAgIGJhcnIucHVzaChzeW1ib2xidWZmKVxuXG4gICAgLy8gZGVub21pbmF0aW9uXG4gICAgY29uc3QgZGVub21pbmF0aW9uOiBudW1iZXIgPSB0aGlzLmdldERlbm9taW5hdGlvbigpXG4gICAgY29uc3QgZGVub21pbmF0aW9uYnVmZlNpemU6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygxKVxuICAgIGRlbm9taW5hdGlvbmJ1ZmZTaXplLndyaXRlVUludDgoZGVub21pbmF0aW9uLCAwKVxuICAgIGJzaXplICs9IGRlbm9taW5hdGlvbmJ1ZmZTaXplLmxlbmd0aFxuICAgIGJhcnIucHVzaChkZW5vbWluYXRpb25idWZmU2l6ZSlcblxuICAgIGJzaXplICs9IHRoaXMuaW5pdGlhbFN0YXRlLnRvQnVmZmVyKCkubGVuZ3RoXG4gICAgYmFyci5wdXNoKHRoaXMuaW5pdGlhbFN0YXRlLnRvQnVmZmVyKCkpXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoYmFyciwgYnNpemUpXG4gIH1cblxuICAvKipcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGEgR2VuZXNpc0Fzc2V0XG4gICAqXG4gICAqIEBwYXJhbSBhc3NldEFsaWFzIE9wdGlvbmFsIFN0cmluZyBmb3IgdGhlIGFzc2V0IGFsaWFzXG4gICAqIEBwYXJhbSBuYW1lIE9wdGlvbmFsIFN0cmluZyBmb3IgdGhlIGRlc2NyaXB0aXZlIG5hbWUgb2YgdGhlIGFzc2V0XG4gICAqIEBwYXJhbSBzeW1ib2wgT3B0aW9uYWwgU3RyaW5nIGZvciB0aGUgdGlja2VyIHN5bWJvbCBvZiB0aGUgYXNzZXRcbiAgICogQHBhcmFtIGRlbm9taW5hdGlvbiBPcHRpb25hbCBudW1iZXIgZm9yIHRoZSBkZW5vbWluYXRpb24gd2hpY2ggaXMgMTBeRC4gRCBtdXN0IGJlID49IDAgYW5kIDw9IDMyLiBFeDogJDEgQVhDID0gMTBeOSAkbkFYQ1xuICAgKiBAcGFyYW0gaW5pdGlhbFN0YXRlIE9wdGlvbmFsIFtbSW5pdGlhbFN0YXRlc11dIHRoYXQgcmVwcmVzZW50IHRoZSBpbnRpYWwgc3RhdGUgb2YgYSBjcmVhdGVkIGFzc2V0XG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgbWVtbyBmaWVsZFxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgYXNzZXRBbGlhczogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIG5hbWU6IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBzeW1ib2w6IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBkZW5vbWluYXRpb246IG51bWJlciA9IHVuZGVmaW5lZCxcbiAgICBpbml0aWFsU3RhdGU6IEluaXRpYWxTdGF0ZXMgPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkXG4gICkge1xuICAgIHN1cGVyKERlZmF1bHROZXR3b3JrSUQsIEJ1ZmZlci5hbGxvYygzMiksIFtdLCBbXSwgbWVtbylcbiAgICBpZiAoXG4gICAgICB0eXBlb2YgYXNzZXRBbGlhcyA9PT0gXCJzdHJpbmdcIiAmJlxuICAgICAgdHlwZW9mIG5hbWUgPT09IFwic3RyaW5nXCIgJiZcbiAgICAgIHR5cGVvZiBzeW1ib2wgPT09IFwic3RyaW5nXCIgJiZcbiAgICAgIHR5cGVvZiBkZW5vbWluYXRpb24gPT09IFwibnVtYmVyXCIgJiZcbiAgICAgIGRlbm9taW5hdGlvbiA+PSAwICYmXG4gICAgICBkZW5vbWluYXRpb24gPD0gMzIgJiZcbiAgICAgIHR5cGVvZiBpbml0aWFsU3RhdGUgIT09IFwidW5kZWZpbmVkXCJcbiAgICApIHtcbiAgICAgIHRoaXMuYXNzZXRBbGlhcyA9IGFzc2V0QWxpYXNcbiAgICAgIHRoaXMubmFtZSA9IG5hbWVcbiAgICAgIHRoaXMuc3ltYm9sID0gc3ltYm9sXG4gICAgICB0aGlzLmRlbm9taW5hdGlvbi53cml0ZVVJbnQ4KGRlbm9taW5hdGlvbiwgMClcbiAgICAgIHRoaXMuaW5pdGlhbFN0YXRlID0gaW5pdGlhbFN0YXRlXG4gICAgfVxuICB9XG59XG4iXX0=