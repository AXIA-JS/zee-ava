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
exports.utils = exports.platformvm = exports.metrics = exports.keystore = exports.info = exports.index = exports.health = exports.evm = exports.common = exports.axvm = exports.auth = exports.admin = exports.Socket = exports.PubSub = exports.Mnemonic = exports.GenesisData = exports.GenesisAsset = exports.HDNode = exports.DB = exports.Buffer = exports.BN = exports.BinTools = exports.AxiaCore = exports.Axia = void 0;
/**
 * @packageDocumentation
 * @module Axia
 */
const axia_1 = __importDefault(require("./axia"));
exports.AxiaCore = axia_1.default;
const api_1 = require("./apis/admin/api");
const api_2 = require("./apis/auth/api");
const api_3 = require("./apis/axvm/api");
const api_4 = require("./apis/evm/api");
const genesisasset_1 = require("./apis/axvm/genesisasset");
Object.defineProperty(exports, "GenesisAsset", { enumerable: true, get: function () { return genesisasset_1.GenesisAsset; } });
const genesisdata_1 = require("./apis/axvm/genesisdata");
Object.defineProperty(exports, "GenesisData", { enumerable: true, get: function () { return genesisdata_1.GenesisData; } });
const api_5 = require("./apis/health/api");
const api_6 = require("./apis/index/api");
const api_7 = require("./apis/info/api");
const api_8 = require("./apis/keystore/api");
const api_9 = require("./apis/metrics/api");
const api_10 = require("./apis/platformvm/api");
const socket_1 = require("./apis/socket/socket");
Object.defineProperty(exports, "Socket", { enumerable: true, get: function () { return socket_1.Socket; } });
const constants_1 = require("./utils/constants");
const helperfunctions_1 = require("./utils/helperfunctions");
const bintools_1 = __importDefault(require("./utils/bintools"));
exports.BinTools = bintools_1.default;
const db_1 = __importDefault(require("./utils/db"));
exports.DB = db_1.default;
const mnemonic_1 = __importDefault(require("./utils/mnemonic"));
exports.Mnemonic = mnemonic_1.default;
const pubsub_1 = __importDefault(require("./utils/pubsub"));
exports.PubSub = pubsub_1.default;
const hdnode_1 = __importDefault(require("./utils/hdnode"));
exports.HDNode = hdnode_1.default;
const bn_js_1 = __importDefault(require("bn.js"));
exports.BN = bn_js_1.default;
const buffer_1 = require("buffer/");
Object.defineProperty(exports, "Buffer", { enumerable: true, get: function () { return buffer_1.Buffer; } });
/**
 * AxiaJS is middleware for interacting with Axia node RPC APIs.
 *
 * Example usage:
 * ```js
 * const axia: Axia = new Axia("127.0.0.1", 9650, "https")
 * ```
 *
 */
class Axia extends axia_1.default {
    /**
     * Creates a new Axia instance. Sets the address and port of the main Axia Client.
     *
     * @param host The hostname to resolve to reach the Axia Client RPC APIs
     * @param port The port to resolve to reach the Axia Client RPC APIs
     * @param protocol The protocol string to use before a "://" in a request,
     * ex: "http", "https", "git", "ws", etc. Defaults to http
     * @param networkID Sets the NetworkID of the class. Default [[DefaultNetworkID]]
     * @param AssetChainID Sets the blockchainID for the AXVM. Will try to auto-detect,
     * otherwise default "2eNy1mUFdmaxXNj1eQHUe7Np4gju9sJsEtWQ4MX3ToiNKuADed"
     * @param AppChainID Sets the blockchainID for the EVM. Will try to auto-detect,
     * otherwise default "2CA6j5zYzasynPsFeNoqWkmTCt3VScMvXUZHbfDJ8k3oGzAPtU"
     * @param hrp The human-readable part of the bech32 addresses
     * @param skipinit Skips creating the APIs. Defaults to false
     */
    constructor(host, port, protocol = "http", networkID = constants_1.DefaultNetworkID, AssetChainID = undefined, AppChainID = undefined, hrp = undefined, skipinit = false) {
        super(host, port, protocol);
        /**
         * Returns a reference to the Admin RPC.
         */
        this.Admin = () => this.apis.admin;
        /**
         * Returns a reference to the Auth RPC.
         */
        this.Auth = () => this.apis.auth;
        /**
         * Returns a reference to the EVMAPI RPC pointed at the AppChain.
         */
        this.AppChain = () => this.apis.appchain;
        /**
         * Returns a reference to the AXVM RPC pointed at the AssetChain.
         */
        this.AssetChain = () => this.apis.assetchain;
        /**
         * Returns a reference to the Health RPC for a node.
         */
        this.Health = () => this.apis.health;
        /**
         * Returns a reference to the Index RPC for a node.
         */
        this.Index = () => this.apis.index;
        /**
         * Returns a reference to the Info RPC for a node.
         */
        this.Info = () => this.apis.info;
        /**
         * Returns a reference to the Metrics RPC.
         */
        this.Metrics = () => this.apis.metrics;
        /**
         * Returns a reference to the Keystore RPC for a node. We label it "NodeKeys" to reduce
         * confusion about what it's accessing.
         */
        this.NodeKeys = () => this.apis.keystore;
        /**
         * Returns a reference to the PlatformVM RPC pointed at the CoreChain.
         */
        this.CoreChain = () => this.apis.corechain;
        let assetchainid = AssetChainID;
        let appchainid = AppChainID;
        if (typeof AssetChainID === "undefined" ||
            !AssetChainID ||
            AssetChainID.toLowerCase() === "x") {
            if (networkID.toString() in constants_1.Defaults.network) {
                assetchainid = constants_1.Defaults.network[`${networkID}`].X.blockchainID;
            }
            else {
                assetchainid = constants_1.Defaults.network[12345].X.blockchainID;
            }
        }
        if (typeof AppChainID === "undefined" ||
            !AppChainID ||
            AppChainID.toLowerCase() === "c") {
            if (networkID.toString() in constants_1.Defaults.network) {
                appchainid = constants_1.Defaults.network[`${networkID}`].C.blockchainID;
            }
            else {
                appchainid = constants_1.Defaults.network[12345].C.blockchainID;
            }
        }
        if (typeof networkID === "number" && networkID >= 0) {
            this.networkID = networkID;
        }
        else if (typeof networkID === "undefined") {
            networkID = constants_1.DefaultNetworkID;
        }
        if (typeof hrp !== "undefined") {
            this.hrp = hrp;
        }
        else {
            this.hrp = (0, helperfunctions_1.getPreferredHRP)(this.networkID);
        }
        if (!skipinit) {
            this.addAPI("admin", api_1.AdminAPI);
            this.addAPI("auth", api_2.AuthAPI);
            this.addAPI("assetchain", api_3.AXVMAPI, "/ext/bc/X", assetchainid);
            this.addAPI("appchain", api_4.EVMAPI, "/ext/bc/C/axc", appchainid);
            this.addAPI("health", api_5.HealthAPI);
            this.addAPI("info", api_7.InfoAPI);
            this.addAPI("index", api_6.IndexAPI);
            this.addAPI("keystore", api_8.KeystoreAPI);
            this.addAPI("metrics", api_9.MetricsAPI);
            this.addAPI("corechain", api_10.PlatformVMAPI);
        }
    }
}
exports.default = Axia;
exports.Axia = Axia;
exports.admin = __importStar(require("./apis/admin"));
exports.auth = __importStar(require("./apis/auth"));
exports.axvm = __importStar(require("./apis/axvm"));
exports.common = __importStar(require("./common"));
exports.evm = __importStar(require("./apis/evm"));
exports.health = __importStar(require("./apis/health"));
exports.index = __importStar(require("./apis/index"));
exports.info = __importStar(require("./apis/info"));
exports.keystore = __importStar(require("./apis/keystore"));
exports.metrics = __importStar(require("./apis/metrics"));
exports.platformvm = __importStar(require("./apis/platformvm"));
exports.utils = __importStar(require("./utils"));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxrREFBNkI7QUFtS3BCLG1CQW5LRixjQUFRLENBbUtFO0FBbEtqQiwwQ0FBMkM7QUFDM0MseUNBQXlDO0FBQ3pDLHlDQUF5QztBQUN6Qyx3Q0FBdUM7QUFDdkMsMkRBQXVEO0FBb0s5Qyw2RkFwS0EsMkJBQVksT0FvS0E7QUFuS3JCLHlEQUFxRDtBQW9LNUMsNEZBcEtBLHlCQUFXLE9Bb0tBO0FBbktwQiwyQ0FBNkM7QUFDN0MsMENBQTJDO0FBQzNDLHlDQUF5QztBQUN6Qyw2Q0FBaUQ7QUFDakQsNENBQStDO0FBQy9DLGdEQUFxRDtBQUNyRCxpREFBNkM7QUFnS3BDLHVGQWhLQSxlQUFNLE9BZ0tBO0FBL0pmLGlEQUE4RDtBQUM5RCw2REFBeUQ7QUFDekQsZ0VBQXVDO0FBb0o5QixtQkFwSkYsa0JBQVEsQ0FvSkU7QUFuSmpCLG9EQUEyQjtBQXNKbEIsYUF0SkYsWUFBRSxDQXNKRTtBQXJKWCxnRUFBdUM7QUF5SjlCLG1CQXpKRixrQkFBUSxDQXlKRTtBQXhKakIsNERBQW1DO0FBeUoxQixpQkF6SkYsZ0JBQU0sQ0F5SkU7QUF4SmYsNERBQW1DO0FBb0oxQixpQkFwSkYsZ0JBQU0sQ0FvSkU7QUFuSmYsa0RBQXNCO0FBZ0piLGFBaEpGLGVBQUUsQ0FnSkU7QUEvSVgsb0NBQWdDO0FBZ0p2Qix1RkFoSkEsZUFBTSxPQWdKQTtBQTlJZjs7Ozs7Ozs7R0FRRztBQUNILE1BQXFCLElBQUssU0FBUSxjQUFRO0lBb0R4Qzs7Ozs7Ozs7Ozs7Ozs7T0FjRztJQUNILFlBQ0UsSUFBYSxFQUNiLElBQWEsRUFDYixXQUFtQixNQUFNLEVBQ3pCLFlBQW9CLDRCQUFnQixFQUNwQyxlQUF1QixTQUFTLEVBQ2hDLGFBQXFCLFNBQVMsRUFDOUIsTUFBYyxT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LENBQUMsU0FBUyxDQUFDLENBQUE7U0FDM0M7UUFFRCxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsY0FBUSxDQUFDLENBQUE7WUFDOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsYUFBTyxDQUFDLENBQUE7WUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsYUFBTyxFQUFFLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQTtZQUM3RCxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxZQUFNLEVBQUUsZUFBZSxFQUFFLFVBQVUsQ0FBQyxDQUFBO1lBQzVELElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLGVBQVMsQ0FBQyxDQUFBO1lBQ2hDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLGFBQU8sQ0FBQyxDQUFBO1lBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLGNBQVEsQ0FBQyxDQUFBO1lBQzlCLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLGlCQUFXLENBQUMsQ0FBQTtZQUNwQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxnQkFBVSxDQUFDLENBQUE7WUFDbEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsb0JBQWEsQ0FBQyxDQUFBO1NBQ3hDO0lBQ0gsQ0FBQztDQUNGO0FBL0hELHVCQStIQztBQUVRLG9CQUFJO0FBYWIsc0RBQXFDO0FBQ3JDLG9EQUFtQztBQUNuQyxvREFBbUM7QUFDbkMsbURBQWtDO0FBQ2xDLGtEQUFpQztBQUNqQyx3REFBdUM7QUFDdkMsc0RBQXFDO0FBQ3JDLG9EQUFtQztBQUNuQyw0REFBMkM7QUFDM0MsMERBQXlDO0FBQ3pDLGdFQUErQztBQUMvQyxpREFBZ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBeGlhXG4gKi9cbmltcG9ydCBBeGlhQ29yZSBmcm9tIFwiLi9heGlhXCJcbmltcG9ydCB7IEFkbWluQVBJIH0gZnJvbSBcIi4vYXBpcy9hZG1pbi9hcGlcIlxuaW1wb3J0IHsgQXV0aEFQSSB9IGZyb20gXCIuL2FwaXMvYXV0aC9hcGlcIlxuaW1wb3J0IHsgQVhWTUFQSSB9IGZyb20gXCIuL2FwaXMvYXh2bS9hcGlcIlxuaW1wb3J0IHsgRVZNQVBJIH0gZnJvbSBcIi4vYXBpcy9ldm0vYXBpXCJcbmltcG9ydCB7IEdlbmVzaXNBc3NldCB9IGZyb20gXCIuL2FwaXMvYXh2bS9nZW5lc2lzYXNzZXRcIlxuaW1wb3J0IHsgR2VuZXNpc0RhdGEgfSBmcm9tIFwiLi9hcGlzL2F4dm0vZ2VuZXNpc2RhdGFcIlxuaW1wb3J0IHsgSGVhbHRoQVBJIH0gZnJvbSBcIi4vYXBpcy9oZWFsdGgvYXBpXCJcbmltcG9ydCB7IEluZGV4QVBJIH0gZnJvbSBcIi4vYXBpcy9pbmRleC9hcGlcIlxuaW1wb3J0IHsgSW5mb0FQSSB9IGZyb20gXCIuL2FwaXMvaW5mby9hcGlcIlxuaW1wb3J0IHsgS2V5c3RvcmVBUEkgfSBmcm9tIFwiLi9hcGlzL2tleXN0b3JlL2FwaVwiXG5pbXBvcnQgeyBNZXRyaWNzQVBJIH0gZnJvbSBcIi4vYXBpcy9tZXRyaWNzL2FwaVwiXG5pbXBvcnQgeyBQbGF0Zm9ybVZNQVBJIH0gZnJvbSBcIi4vYXBpcy9wbGF0Zm9ybXZtL2FwaVwiXG5pbXBvcnQgeyBTb2NrZXQgfSBmcm9tIFwiLi9hcGlzL3NvY2tldC9zb2NrZXRcIlxuaW1wb3J0IHsgRGVmYXVsdE5ldHdvcmtJRCwgRGVmYXVsdHMgfSBmcm9tIFwiLi91dGlscy9jb25zdGFudHNcIlxuaW1wb3J0IHsgZ2V0UHJlZmVycmVkSFJQIH0gZnJvbSBcIi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zXCJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQgREIgZnJvbSBcIi4vdXRpbHMvZGJcIlxuaW1wb3J0IE1uZW1vbmljIGZyb20gXCIuL3V0aWxzL21uZW1vbmljXCJcbmltcG9ydCBQdWJTdWIgZnJvbSBcIi4vdXRpbHMvcHVic3ViXCJcbmltcG9ydCBIRE5vZGUgZnJvbSBcIi4vdXRpbHMvaGRub2RlXCJcbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIlxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuXG4vKipcbiAqIEF4aWFKUyBpcyBtaWRkbGV3YXJlIGZvciBpbnRlcmFjdGluZyB3aXRoIEF4aWEgbm9kZSBSUEMgQVBJcy5cbiAqXG4gKiBFeGFtcGxlIHVzYWdlOlxuICogYGBganNcbiAqIGNvbnN0IGF4aWE6IEF4aWEgPSBuZXcgQXhpYShcIjEyNy4wLjAuMVwiLCA5NjUwLCBcImh0dHBzXCIpXG4gKiBgYGBcbiAqXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEF4aWEgZXh0ZW5kcyBBeGlhQ29yZSB7XG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBBZG1pbiBSUEMuXG4gICAqL1xuICBBZG1pbiA9ICgpID0+IHRoaXMuYXBpcy5hZG1pbiBhcyBBZG1pbkFQSVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBBdXRoIFJQQy5cbiAgICovXG4gIEF1dGggPSAoKSA9PiB0aGlzLmFwaXMuYXV0aCBhcyBBdXRoQVBJXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIEVWTUFQSSBSUEMgcG9pbnRlZCBhdCB0aGUgQXBwQ2hhaW4uXG4gICAqL1xuICBBcHBDaGFpbiA9ICgpID0+IHRoaXMuYXBpcy5hcHBjaGFpbiBhcyBFVk1BUElcblxuICAvKipcbiAgICogUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgQVhWTSBSUEMgcG9pbnRlZCBhdCB0aGUgQXNzZXRDaGFpbi5cbiAgICovXG4gIEFzc2V0Q2hhaW4gPSAoKSA9PiB0aGlzLmFwaXMuYXNzZXRjaGFpbiBhcyBBWFZNQVBJXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIEhlYWx0aCBSUEMgZm9yIGEgbm9kZS5cbiAgICovXG4gIEhlYWx0aCA9ICgpID0+IHRoaXMuYXBpcy5oZWFsdGggYXMgSGVhbHRoQVBJXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIEluZGV4IFJQQyBmb3IgYSBub2RlLlxuICAgKi9cbiAgSW5kZXggPSAoKSA9PiB0aGlzLmFwaXMuaW5kZXggYXMgSW5kZXhBUElcblxuICAvKipcbiAgICogUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgSW5mbyBSUEMgZm9yIGEgbm9kZS5cbiAgICovXG4gIEluZm8gPSAoKSA9PiB0aGlzLmFwaXMuaW5mbyBhcyBJbmZvQVBJXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIE1ldHJpY3MgUlBDLlxuICAgKi9cbiAgTWV0cmljcyA9ICgpID0+IHRoaXMuYXBpcy5tZXRyaWNzIGFzIE1ldHJpY3NBUElcblxuICAvKipcbiAgICogUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgS2V5c3RvcmUgUlBDIGZvciBhIG5vZGUuIFdlIGxhYmVsIGl0IFwiTm9kZUtleXNcIiB0byByZWR1Y2VcbiAgICogY29uZnVzaW9uIGFib3V0IHdoYXQgaXQncyBhY2Nlc3NpbmcuXG4gICAqL1xuICBOb2RlS2V5cyA9ICgpID0+IHRoaXMuYXBpcy5rZXlzdG9yZSBhcyBLZXlzdG9yZUFQSVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBQbGF0Zm9ybVZNIFJQQyBwb2ludGVkIGF0IHRoZSBDb3JlQ2hhaW4uXG4gICAqL1xuICBDb3JlQ2hhaW4gPSAoKSA9PiB0aGlzLmFwaXMuY29yZWNoYWluIGFzIFBsYXRmb3JtVk1BUElcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBBeGlhIGluc3RhbmNlLiBTZXRzIHRoZSBhZGRyZXNzIGFuZCBwb3J0IG9mIHRoZSBtYWluIEF4aWEgQ2xpZW50LlxuICAgKlxuICAgKiBAcGFyYW0gaG9zdCBUaGUgaG9zdG5hbWUgdG8gcmVzb2x2ZSB0byByZWFjaCB0aGUgQXhpYSBDbGllbnQgUlBDIEFQSXNcbiAgICogQHBhcmFtIHBvcnQgVGhlIHBvcnQgdG8gcmVzb2x2ZSB0byByZWFjaCB0aGUgQXhpYSBDbGllbnQgUlBDIEFQSXNcbiAgICogQHBhcmFtIHByb3RvY29sIFRoZSBwcm90b2NvbCBzdHJpbmcgdG8gdXNlIGJlZm9yZSBhIFwiOi8vXCIgaW4gYSByZXF1ZXN0LFxuICAgKiBleDogXCJodHRwXCIsIFwiaHR0cHNcIiwgXCJnaXRcIiwgXCJ3c1wiLCBldGMuIERlZmF1bHRzIHRvIGh0dHBcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBTZXRzIHRoZSBOZXR3b3JrSUQgb2YgdGhlIGNsYXNzLiBEZWZhdWx0IFtbRGVmYXVsdE5ldHdvcmtJRF1dXG4gICAqIEBwYXJhbSBBc3NldENoYWluSUQgU2V0cyB0aGUgYmxvY2tjaGFpbklEIGZvciB0aGUgQVhWTS4gV2lsbCB0cnkgdG8gYXV0by1kZXRlY3QsXG4gICAqIG90aGVyd2lzZSBkZWZhdWx0IFwiMmVOeTFtVUZkbWF4WE5qMWVRSFVlN05wNGdqdTlzSnNFdFdRNE1YM1RvaU5LdUFEZWRcIlxuICAgKiBAcGFyYW0gQXBwQ2hhaW5JRCBTZXRzIHRoZSBibG9ja2NoYWluSUQgZm9yIHRoZSBFVk0uIFdpbGwgdHJ5IHRvIGF1dG8tZGV0ZWN0LFxuICAgKiBvdGhlcndpc2UgZGVmYXVsdCBcIjJDQTZqNXpZemFzeW5Qc0ZlTm9xV2ttVEN0M1ZTY012WFVaSGJmREo4azNvR3pBUHRVXCJcbiAgICogQHBhcmFtIGhycCBUaGUgaHVtYW4tcmVhZGFibGUgcGFydCBvZiB0aGUgYmVjaDMyIGFkZHJlc3Nlc1xuICAgKiBAcGFyYW0gc2tpcGluaXQgU2tpcHMgY3JlYXRpbmcgdGhlIEFQSXMuIERlZmF1bHRzIHRvIGZhbHNlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBob3N0Pzogc3RyaW5nLFxuICAgIHBvcnQ/OiBudW1iZXIsXG4gICAgcHJvdG9jb2w6IHN0cmluZyA9IFwiaHR0cFwiLFxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcbiAgICBBc3NldENoYWluSUQ6IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBBcHBDaGFpbklEOiBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgaHJwOiBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgc2tpcGluaXQ6IGJvb2xlYW4gPSBmYWxzZVxuICApIHtcbiAgICBzdXBlcihob3N0LCBwb3J0LCBwcm90b2NvbClcbiAgICBsZXQgYXNzZXRjaGFpbmlkOiBzdHJpbmcgPSBBc3NldENoYWluSURcbiAgICBsZXQgYXBwY2hhaW5pZDogc3RyaW5nID0gQXBwQ2hhaW5JRFxuXG4gICAgaWYgKFxuICAgICAgdHlwZW9mIEFzc2V0Q2hhaW5JRCA9PT0gXCJ1bmRlZmluZWRcIiB8fFxuICAgICAgIUFzc2V0Q2hhaW5JRCB8fFxuICAgICAgQXNzZXRDaGFpbklELnRvTG93ZXJDYXNlKCkgPT09IFwieFwiXG4gICAgKSB7XG4gICAgICBpZiAobmV0d29ya0lELnRvU3RyaW5nKCkgaW4gRGVmYXVsdHMubmV0d29yaykge1xuICAgICAgICBhc3NldGNoYWluaWQgPSBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldHdvcmtJRH1gXS5YLmJsb2NrY2hhaW5JRFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXNzZXRjaGFpbmlkID0gRGVmYXVsdHMubmV0d29ya1sxMjM0NV0uWC5ibG9ja2NoYWluSURcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKFxuICAgICAgdHlwZW9mIEFwcENoYWluSUQgPT09IFwidW5kZWZpbmVkXCIgfHxcbiAgICAgICFBcHBDaGFpbklEIHx8XG4gICAgICBBcHBDaGFpbklELnRvTG93ZXJDYXNlKCkgPT09IFwiY1wiXG4gICAgKSB7XG4gICAgICBpZiAobmV0d29ya0lELnRvU3RyaW5nKCkgaW4gRGVmYXVsdHMubmV0d29yaykge1xuICAgICAgICBhcHBjaGFpbmlkID0gRGVmYXVsdHMubmV0d29ya1tgJHtuZXR3b3JrSUR9YF0uQy5ibG9ja2NoYWluSURcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFwcGNoYWluaWQgPSBEZWZhdWx0cy5uZXR3b3JrWzEyMzQ1XS5DLmJsb2NrY2hhaW5JRFxuICAgICAgfVxuICAgIH1cbiAgICBpZiAodHlwZW9mIG5ldHdvcmtJRCA9PT0gXCJudW1iZXJcIiAmJiBuZXR3b3JrSUQgPj0gMCkge1xuICAgICAgdGhpcy5uZXR3b3JrSUQgPSBuZXR3b3JrSURcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBuZXR3b3JrSUQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIG5ldHdvcmtJRCA9IERlZmF1bHROZXR3b3JrSURcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBocnAgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMuaHJwID0gaHJwXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaHJwID0gZ2V0UHJlZmVycmVkSFJQKHRoaXMubmV0d29ya0lEKVxuICAgIH1cblxuICAgIGlmICghc2tpcGluaXQpIHtcbiAgICAgIHRoaXMuYWRkQVBJKFwiYWRtaW5cIiwgQWRtaW5BUEkpXG4gICAgICB0aGlzLmFkZEFQSShcImF1dGhcIiwgQXV0aEFQSSlcbiAgICAgIHRoaXMuYWRkQVBJKFwiYXNzZXRjaGFpblwiLCBBWFZNQVBJLCBcIi9leHQvYmMvWFwiLCBhc3NldGNoYWluaWQpXG4gICAgICB0aGlzLmFkZEFQSShcImFwcGNoYWluXCIsIEVWTUFQSSwgXCIvZXh0L2JjL0MvYXhjXCIsIGFwcGNoYWluaWQpXG4gICAgICB0aGlzLmFkZEFQSShcImhlYWx0aFwiLCBIZWFsdGhBUEkpXG4gICAgICB0aGlzLmFkZEFQSShcImluZm9cIiwgSW5mb0FQSSlcbiAgICAgIHRoaXMuYWRkQVBJKFwiaW5kZXhcIiwgSW5kZXhBUEkpXG4gICAgICB0aGlzLmFkZEFQSShcImtleXN0b3JlXCIsIEtleXN0b3JlQVBJKVxuICAgICAgdGhpcy5hZGRBUEkoXCJtZXRyaWNzXCIsIE1ldHJpY3NBUEkpXG4gICAgICB0aGlzLmFkZEFQSShcImNvcmVjaGFpblwiLCBQbGF0Zm9ybVZNQVBJKVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgeyBBeGlhIH1cbmV4cG9ydCB7IEF4aWFDb3JlIH1cbmV4cG9ydCB7IEJpblRvb2xzIH1cbmV4cG9ydCB7IEJOIH1cbmV4cG9ydCB7IEJ1ZmZlciB9XG5leHBvcnQgeyBEQiB9XG5leHBvcnQgeyBIRE5vZGUgfVxuZXhwb3J0IHsgR2VuZXNpc0Fzc2V0IH1cbmV4cG9ydCB7IEdlbmVzaXNEYXRhIH1cbmV4cG9ydCB7IE1uZW1vbmljIH1cbmV4cG9ydCB7IFB1YlN1YiB9XG5leHBvcnQgeyBTb2NrZXQgfVxuXG5leHBvcnQgKiBhcyBhZG1pbiBmcm9tIFwiLi9hcGlzL2FkbWluXCJcbmV4cG9ydCAqIGFzIGF1dGggZnJvbSBcIi4vYXBpcy9hdXRoXCJcbmV4cG9ydCAqIGFzIGF4dm0gZnJvbSBcIi4vYXBpcy9heHZtXCJcbmV4cG9ydCAqIGFzIGNvbW1vbiBmcm9tIFwiLi9jb21tb25cIlxuZXhwb3J0ICogYXMgZXZtIGZyb20gXCIuL2FwaXMvZXZtXCJcbmV4cG9ydCAqIGFzIGhlYWx0aCBmcm9tIFwiLi9hcGlzL2hlYWx0aFwiXG5leHBvcnQgKiBhcyBpbmRleCBmcm9tIFwiLi9hcGlzL2luZGV4XCJcbmV4cG9ydCAqIGFzIGluZm8gZnJvbSBcIi4vYXBpcy9pbmZvXCJcbmV4cG9ydCAqIGFzIGtleXN0b3JlIGZyb20gXCIuL2FwaXMva2V5c3RvcmVcIlxuZXhwb3J0ICogYXMgbWV0cmljcyBmcm9tIFwiLi9hcGlzL21ldHJpY3NcIlxuZXhwb3J0ICogYXMgcGxhdGZvcm12bSBmcm9tIFwiLi9hcGlzL3BsYXRmb3Jtdm1cIlxuZXhwb3J0ICogYXMgdXRpbHMgZnJvbSBcIi4vdXRpbHNcIlxuIl19