"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenesisData = void 0;
/**
 * @packageDocumentation
 * @module API-AXVM-GenesisData
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const serialization_1 = require("../../utils/serialization");
const constants_1 = require("./constants");
const _1 = require(".");
const utils_1 = require("../../utils");
/**
 * @ignore
 */
const serialization = serialization_1.Serialization.getInstance();
const bintools = bintools_1.default.getInstance();
const decimalString = "decimalString";
const buffer = "Buffer";
class GenesisData extends serialization_1.Serializable {
    /**
     * Class representing AXVM GenesisData
     *
     * @param genesisAssets Optional GenesisAsset[]
     * @param networkID Optional DefaultNetworkID
     */
    constructor(genesisAssets = [], networkID = utils_1.DefaultNetworkID) {
        super();
        this._typeName = "GenesisData";
        this._codecID = constants_1.AXVMConstants.LATESTCODEC;
        this.networkID = buffer_1.Buffer.alloc(4);
        /**
         * Returns the GenesisAssets[]
         */
        this.getGenesisAssets = () => this.genesisAssets;
        /**
         * Returns the NetworkID as a number
         */
        this.getNetworkID = () => this.networkID.readUInt32BE(0);
        this.genesisAssets = genesisAssets;
        this.networkID.writeUInt32BE(networkID, 0);
    }
    // TODO - setCodecID?
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { genesisAssets: this.genesisAssets.map((genesisAsset) => genesisAsset.serialize(encoding)), networkID: serialization.encoder(this.networkID, encoding, buffer, decimalString) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.genesisAssets = fields["genesisAssets"].map((genesisAsset) => {
            let g = new _1.GenesisAsset();
            g.deserialize(genesisAsset, encoding);
            return g;
        });
        this.networkID = serialization.decoder(fields["networkID"], encoding, decimalString, buffer, 4);
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
        this._codecID = bintools.copyFrom(bytes, offset, offset + 2).readUInt16BE(0);
        offset += 2;
        const numGenesisAssets = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const assetCount = numGenesisAssets.readUInt32BE(0);
        this.genesisAssets = [];
        for (let i = 0; i < assetCount; i++) {
            const genesisAsset = new _1.GenesisAsset();
            offset = genesisAsset.fromBuffer(bytes, offset);
            this.genesisAssets.push(genesisAsset);
            if (i === 0) {
                this.networkID.writeUInt32BE(genesisAsset.getNetworkID(), 0);
            }
        }
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[GenesisData]].
     */
    toBuffer() {
        // codec id
        const codecbuffSize = buffer_1.Buffer.alloc(2);
        codecbuffSize.writeUInt16BE(this._codecID, 0);
        // num assets
        const numAssetsbuffSize = buffer_1.Buffer.alloc(4);
        numAssetsbuffSize.writeUInt32BE(this.genesisAssets.length, 0);
        let bsize = codecbuffSize.length + numAssetsbuffSize.length;
        let barr = [codecbuffSize, numAssetsbuffSize];
        this.genesisAssets.forEach((genesisAsset) => {
            const b = genesisAsset.toBuffer(this.getNetworkID());
            bsize += b.length;
            barr.push(b);
        });
        return buffer_1.Buffer.concat(barr, bsize);
    }
}
exports.GenesisData = GenesisData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXNpc2RhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9heHZtL2dlbmVzaXNkYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxvRUFBMkM7QUFDM0MsNkRBSWtDO0FBQ2xDLDJDQUEyQztBQUMzQyx3QkFBZ0M7QUFDaEMsdUNBQThEO0FBRTlEOztHQUVHO0FBQ0gsTUFBTSxhQUFhLEdBQWtCLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDaEUsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBbUIsZUFBZSxDQUFBO0FBQ3JELE1BQU0sTUFBTSxHQUFtQixRQUFRLENBQUE7QUFFdkMsTUFBYSxXQUFZLFNBQVEsNEJBQVk7SUFzRzNDOzs7OztPQUtHO0lBQ0gsWUFDRSxnQkFBZ0MsRUFBRSxFQUNsQyxZQUFvQix3QkFBZ0I7UUFFcEMsS0FBSyxFQUFFLENBQUE7UUEvR0MsY0FBUyxHQUFHLGFBQWEsQ0FBQTtRQUN6QixhQUFRLEdBQUcseUJBQWEsQ0FBQyxXQUFXLENBQUE7UUFzQ3BDLGNBQVMsR0FBVyxlQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBRTdDOztXQUVHO1FBQ0gscUJBQWdCLEdBQUcsR0FBbUIsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUE7UUFFM0Q7O1dBRUc7UUFDSCxpQkFBWSxHQUFHLEdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBK0R6RCxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQTtRQUNsQyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDNUMsQ0FBQztJQS9HRCxxQkFBcUI7SUFDckIsU0FB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SUFBSSxLQUFLLEdBQVcsYUFBYSxDQUFDLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLENBQUE7UUFDbkUsSUFBSSxJQUFJLEdBQWEsQ0FBQyxhQUFhLEVBQUUsaUJBQWlCLENBQUMsQ0FBQTtRQUV2RCxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFlBQTBCLEVBQVEsRUFBRTtZQUM5RCxNQUFNLENBQUMsR0FBVyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFBO1lBQzVELEtBQUssSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFBO1lBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDZCxDQUFDLENBQUMsQ0FBQTtRQUNGLE9BQU8sZUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUE7SUFDbkMsQ0FBQztDQWdCRjtBQXBIRCxrQ0FvSEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktQVhWTS1HZW5lc2lzRGF0YVxuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7XG4gIFNlcmlhbGl6YWJsZSxcbiAgU2VyaWFsaXphdGlvbixcbiAgU2VyaWFsaXplZEVuY29kaW5nXG59IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcbmltcG9ydCB7IEFYVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHsgR2VuZXNpc0Fzc2V0IH0gZnJvbSBcIi5cIlxuaW1wb3J0IHsgRGVmYXVsdE5ldHdvcmtJRCwgU2VyaWFsaXplZFR5cGUgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3QgZGVjaW1hbFN0cmluZzogU2VyaWFsaXplZFR5cGUgPSBcImRlY2ltYWxTdHJpbmdcIlxuY29uc3QgYnVmZmVyOiBTZXJpYWxpemVkVHlwZSA9IFwiQnVmZmVyXCJcblxuZXhwb3J0IGNsYXNzIEdlbmVzaXNEYXRhIGV4dGVuZHMgU2VyaWFsaXphYmxlIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiR2VuZXNpc0RhdGFcIlxuICBwcm90ZWN0ZWQgX2NvZGVjSUQgPSBBWFZNQ29uc3RhbnRzLkxBVEVTVENPREVDXG5cbiAgLy8gVE9ETyAtIHNldENvZGVjSUQ/XG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBnZW5lc2lzQXNzZXRzOiB0aGlzLmdlbmVzaXNBc3NldHMubWFwKChnZW5lc2lzQXNzZXQ6IEdlbmVzaXNBc3NldCkgPT5cbiAgICAgICAgZ2VuZXNpc0Fzc2V0LnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICAgICksXG4gICAgICBuZXR3b3JrSUQ6IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcbiAgICAgICAgdGhpcy5uZXR3b3JrSUQsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBidWZmZXIsXG4gICAgICAgIGRlY2ltYWxTdHJpbmdcbiAgICAgIClcbiAgICB9XG4gIH1cblxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMuZ2VuZXNpc0Fzc2V0cyA9IGZpZWxkc1tcImdlbmVzaXNBc3NldHNcIl0ubWFwKFxuICAgICAgKGdlbmVzaXNBc3NldDogR2VuZXNpc0Fzc2V0KTogR2VuZXNpc0Fzc2V0ID0+IHtcbiAgICAgICAgbGV0IGc6IEdlbmVzaXNBc3NldCA9IG5ldyBHZW5lc2lzQXNzZXQoKVxuICAgICAgICBnLmRlc2VyaWFsaXplKGdlbmVzaXNBc3NldCwgZW5jb2RpbmcpXG4gICAgICAgIHJldHVybiBnXG4gICAgICB9XG4gICAgKVxuICAgIHRoaXMubmV0d29ya0lEID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wibmV0d29ya0lEXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBkZWNpbWFsU3RyaW5nLFxuICAgICAgYnVmZmVyLFxuICAgICAgNFxuICAgIClcbiAgfVxuXG4gIHByb3RlY3RlZCBnZW5lc2lzQXNzZXRzOiBHZW5lc2lzQXNzZXRbXVxuICBwcm90ZWN0ZWQgbmV0d29ya0lEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgR2VuZXNpc0Fzc2V0c1tdXG4gICAqL1xuICBnZXRHZW5lc2lzQXNzZXRzID0gKCk6IEdlbmVzaXNBc3NldFtdID0+IHRoaXMuZ2VuZXNpc0Fzc2V0c1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBOZXR3b3JrSUQgYXMgYSBudW1iZXJcbiAgICovXG4gIGdldE5ldHdvcmtJRCA9ICgpOiBudW1iZXIgPT4gdGhpcy5uZXR3b3JrSUQucmVhZFVJbnQzMkJFKDApXG5cbiAgLyoqXG4gICAqIFRha2VzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyBhbiBbW0dlbmVzaXNBc3NldF1dLCBwYXJzZXMgaXQsIHBvcHVsYXRlcyB0aGUgY2xhc3MsIGFuZCByZXR1cm5zIHRoZSBsZW5ndGggb2YgdGhlIFtbR2VuZXNpc0Fzc2V0XV0gaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBieXRlcyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgYSByYXcgW1tHZW5lc2lzQXNzZXRdXVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tHZW5lc2lzQXNzZXRdXVxuICAgKlxuICAgKiBAcmVtYXJrcyBhc3N1bWUgbm90LWNoZWNrc3VtbWVkXG4gICAqL1xuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgdGhpcy5fY29kZWNJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDIpLnJlYWRVSW50MTZCRSgwKVxuICAgIG9mZnNldCArPSAyXG4gICAgY29uc3QgbnVtR2VuZXNpc0Fzc2V0cyA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgb2Zmc2V0ICs9IDRcbiAgICBjb25zdCBhc3NldENvdW50OiBudW1iZXIgPSBudW1HZW5lc2lzQXNzZXRzLnJlYWRVSW50MzJCRSgwKVxuICAgIHRoaXMuZ2VuZXNpc0Fzc2V0cyA9IFtdXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IGFzc2V0Q291bnQ7IGkrKykge1xuICAgICAgY29uc3QgZ2VuZXNpc0Fzc2V0OiBHZW5lc2lzQXNzZXQgPSBuZXcgR2VuZXNpc0Fzc2V0KClcbiAgICAgIG9mZnNldCA9IGdlbmVzaXNBc3NldC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgICB0aGlzLmdlbmVzaXNBc3NldHMucHVzaChnZW5lc2lzQXNzZXQpXG4gICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICB0aGlzLm5ldHdvcmtJRC53cml0ZVVJbnQzMkJFKGdlbmVzaXNBc3NldC5nZXROZXR3b3JrSUQoKSwgMClcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tHZW5lc2lzRGF0YV1dLlxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICAvLyBjb2RlYyBpZFxuICAgIGNvbnN0IGNvZGVjYnVmZlNpemU6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygyKVxuICAgIGNvZGVjYnVmZlNpemUud3JpdGVVSW50MTZCRSh0aGlzLl9jb2RlY0lELCAwKVxuXG4gICAgLy8gbnVtIGFzc2V0c1xuICAgIGNvbnN0IG51bUFzc2V0c2J1ZmZTaXplOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICBudW1Bc3NldHNidWZmU2l6ZS53cml0ZVVJbnQzMkJFKHRoaXMuZ2VuZXNpc0Fzc2V0cy5sZW5ndGgsIDApXG5cbiAgICBsZXQgYnNpemU6IG51bWJlciA9IGNvZGVjYnVmZlNpemUubGVuZ3RoICsgbnVtQXNzZXRzYnVmZlNpemUubGVuZ3RoXG4gICAgbGV0IGJhcnI6IEJ1ZmZlcltdID0gW2NvZGVjYnVmZlNpemUsIG51bUFzc2V0c2J1ZmZTaXplXVxuXG4gICAgdGhpcy5nZW5lc2lzQXNzZXRzLmZvckVhY2goKGdlbmVzaXNBc3NldDogR2VuZXNpc0Fzc2V0KTogdm9pZCA9PiB7XG4gICAgICBjb25zdCBiOiBCdWZmZXIgPSBnZW5lc2lzQXNzZXQudG9CdWZmZXIodGhpcy5nZXROZXR3b3JrSUQoKSlcbiAgICAgIGJzaXplICs9IGIubGVuZ3RoXG4gICAgICBiYXJyLnB1c2goYilcbiAgICB9KVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KGJhcnIsIGJzaXplKVxuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBBWFZNIEdlbmVzaXNEYXRhXG4gICAqXG4gICAqIEBwYXJhbSBnZW5lc2lzQXNzZXRzIE9wdGlvbmFsIEdlbmVzaXNBc3NldFtdXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwgRGVmYXVsdE5ldHdvcmtJRFxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgZ2VuZXNpc0Fzc2V0czogR2VuZXNpc0Fzc2V0W10gPSBbXSxcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSURcbiAgKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMuZ2VuZXNpc0Fzc2V0cyA9IGdlbmVzaXNBc3NldHNcbiAgICB0aGlzLm5ldHdvcmtJRC53cml0ZVVJbnQzMkJFKG5ldHdvcmtJRCwgMClcbiAgfVxufVxuIl19