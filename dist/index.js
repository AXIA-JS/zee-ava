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
exports.utils = exports.platformvm = exports.metrics = exports.keystore = exports.info = exports.index = exports.health = exports.evm = exports.common = exports.avm = exports.auth = exports.admin = exports.Socket = exports.PubSub = exports.Mnemonic = exports.GenesisData = exports.GenesisAsset = exports.HDNode = exports.DB = exports.Buffer = exports.BN = exports.BinTools = exports.AxiaCore = exports.Axia = void 0;
/**
 * @packageDocumentation
 * @module Axia
 */
const axia_1 = __importDefault(require("./axia"));
exports.AxiaCore = axia_1.default;
const api_1 = require("./apis/admin/api");
const api_2 = require("./apis/auth/api");
const api_3 = require("./apis/avm/api");
const api_4 = require("./apis/evm/api");
const genesisasset_1 = require("./apis/avm/genesisasset");
Object.defineProperty(exports, "GenesisAsset", { enumerable: true, get: function () { return genesisasset_1.GenesisAsset; } });
const genesisdata_1 = require("./apis/avm/genesisdata");
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
     * @param AssetChainID Sets the blockchainID for the AVM. Will try to auto-detect,
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
         * Returns a reference to the AVM RPC pointed at the AssetChain.
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
            this.addAPI("assetchain", api_3.AVMAPI, "/ext/bc/X", assetchainid);
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
exports.avm = __importStar(require("./apis/avm"));
exports.common = __importStar(require("./common"));
exports.evm = __importStar(require("./apis/evm"));
exports.health = __importStar(require("./apis/health"));
exports.index = __importStar(require("./apis/index"));
exports.info = __importStar(require("./apis/info"));
exports.keystore = __importStar(require("./apis/keystore"));
exports.metrics = __importStar(require("./apis/metrics"));
exports.platformvm = __importStar(require("./apis/platformvm"));
exports.utils = __importStar(require("./utils"));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxrREFBNkI7QUFtS3BCLG1CQW5LRixjQUFRLENBbUtFO0FBbEtqQiwwQ0FBMkM7QUFDM0MseUNBQXlDO0FBQ3pDLHdDQUF1QztBQUN2Qyx3Q0FBdUM7QUFDdkMsMERBQXNEO0FBb0s3Qyw2RkFwS0EsMkJBQVksT0FvS0E7QUFuS3JCLHdEQUFvRDtBQW9LM0MsNEZBcEtBLHlCQUFXLE9Bb0tBO0FBbktwQiwyQ0FBNkM7QUFDN0MsMENBQTJDO0FBQzNDLHlDQUF5QztBQUN6Qyw2Q0FBaUQ7QUFDakQsNENBQStDO0FBQy9DLGdEQUFxRDtBQUNyRCxpREFBNkM7QUFnS3BDLHVGQWhLQSxlQUFNLE9BZ0tBO0FBL0pmLGlEQUE4RDtBQUM5RCw2REFBeUQ7QUFDekQsZ0VBQXVDO0FBb0o5QixtQkFwSkYsa0JBQVEsQ0FvSkU7QUFuSmpCLG9EQUEyQjtBQXNKbEIsYUF0SkYsWUFBRSxDQXNKRTtBQXJKWCxnRUFBdUM7QUF5SjlCLG1CQXpKRixrQkFBUSxDQXlKRTtBQXhKakIsNERBQW1DO0FBeUoxQixpQkF6SkYsZ0JBQU0sQ0F5SkU7QUF4SmYsNERBQW1DO0FBb0oxQixpQkFwSkYsZ0JBQU0sQ0FvSkU7QUFuSmYsa0RBQXNCO0FBZ0piLGFBaEpGLGVBQUUsQ0FnSkU7QUEvSVgsb0NBQWdDO0FBZ0p2Qix1RkFoSkEsZUFBTSxPQWdKQTtBQTlJZjs7Ozs7Ozs7R0FRRztBQUNILE1BQXFCLElBQUssU0FBUSxjQUFRO0lBb0R4Qzs7Ozs7Ozs7Ozs7Ozs7T0FjRztJQUNILFlBQ0UsSUFBYSxFQUNiLElBQWEsRUFDYixXQUFtQixNQUFNLEVBQ3pCLFlBQW9CLDRCQUFnQixFQUNwQyxlQUF1QixTQUFTLEVBQ2hDLGFBQXFCLFNBQVMsRUFDOUIsTUFBYyxT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LENBQUMsU0FBUyxDQUFDLENBQUE7U0FDM0M7UUFFRCxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsY0FBUSxDQUFDLENBQUE7WUFDOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsYUFBTyxDQUFDLENBQUE7WUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsWUFBTSxFQUFFLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQTtZQUM1RCxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxZQUFNLEVBQUUsZUFBZSxFQUFFLFVBQVUsQ0FBQyxDQUFBO1lBQzVELElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLGVBQVMsQ0FBQyxDQUFBO1lBQ2hDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLGFBQU8sQ0FBQyxDQUFBO1lBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLGNBQVEsQ0FBQyxDQUFBO1lBQzlCLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLGlCQUFXLENBQUMsQ0FBQTtZQUNwQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxnQkFBVSxDQUFDLENBQUE7WUFDbEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsb0JBQWEsQ0FBQyxDQUFBO1NBQ3hDO0lBQ0gsQ0FBQztDQUNGO0FBL0hELHVCQStIQztBQUVRLG9CQUFJO0FBYWIsc0RBQXFDO0FBQ3JDLG9EQUFtQztBQUNuQyxrREFBaUM7QUFDakMsbURBQWtDO0FBQ2xDLGtEQUFpQztBQUNqQyx3REFBdUM7QUFDdkMsc0RBQXFDO0FBQ3JDLG9EQUFtQztBQUNuQyw0REFBMkM7QUFDM0MsMERBQXlDO0FBQ3pDLGdFQUErQztBQUMvQyxpREFBZ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBeGlhXG4gKi9cbmltcG9ydCBBeGlhQ29yZSBmcm9tIFwiLi9heGlhXCJcbmltcG9ydCB7IEFkbWluQVBJIH0gZnJvbSBcIi4vYXBpcy9hZG1pbi9hcGlcIlxuaW1wb3J0IHsgQXV0aEFQSSB9IGZyb20gXCIuL2FwaXMvYXV0aC9hcGlcIlxuaW1wb3J0IHsgQVZNQVBJIH0gZnJvbSBcIi4vYXBpcy9hdm0vYXBpXCJcbmltcG9ydCB7IEVWTUFQSSB9IGZyb20gXCIuL2FwaXMvZXZtL2FwaVwiXG5pbXBvcnQgeyBHZW5lc2lzQXNzZXQgfSBmcm9tIFwiLi9hcGlzL2F2bS9nZW5lc2lzYXNzZXRcIlxuaW1wb3J0IHsgR2VuZXNpc0RhdGEgfSBmcm9tIFwiLi9hcGlzL2F2bS9nZW5lc2lzZGF0YVwiXG5pbXBvcnQgeyBIZWFsdGhBUEkgfSBmcm9tIFwiLi9hcGlzL2hlYWx0aC9hcGlcIlxuaW1wb3J0IHsgSW5kZXhBUEkgfSBmcm9tIFwiLi9hcGlzL2luZGV4L2FwaVwiXG5pbXBvcnQgeyBJbmZvQVBJIH0gZnJvbSBcIi4vYXBpcy9pbmZvL2FwaVwiXG5pbXBvcnQgeyBLZXlzdG9yZUFQSSB9IGZyb20gXCIuL2FwaXMva2V5c3RvcmUvYXBpXCJcbmltcG9ydCB7IE1ldHJpY3NBUEkgfSBmcm9tIFwiLi9hcGlzL21ldHJpY3MvYXBpXCJcbmltcG9ydCB7IFBsYXRmb3JtVk1BUEkgfSBmcm9tIFwiLi9hcGlzL3BsYXRmb3Jtdm0vYXBpXCJcbmltcG9ydCB7IFNvY2tldCB9IGZyb20gXCIuL2FwaXMvc29ja2V0L3NvY2tldFwiXG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lELCBEZWZhdWx0cyB9IGZyb20gXCIuL3V0aWxzL2NvbnN0YW50c1wiXG5pbXBvcnQgeyBnZXRQcmVmZXJyZWRIUlAgfSBmcm9tIFwiLi91dGlscy9oZWxwZXJmdW5jdGlvbnNcIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCBEQiBmcm9tIFwiLi91dGlscy9kYlwiXG5pbXBvcnQgTW5lbW9uaWMgZnJvbSBcIi4vdXRpbHMvbW5lbW9uaWNcIlxuaW1wb3J0IFB1YlN1YiBmcm9tIFwiLi91dGlscy9wdWJzdWJcIlxuaW1wb3J0IEhETm9kZSBmcm9tIFwiLi91dGlscy9oZG5vZGVcIlxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5cbi8qKlxuICogQXhpYUpTIGlzIG1pZGRsZXdhcmUgZm9yIGludGVyYWN0aW5nIHdpdGggQXhpYSBub2RlIFJQQyBBUElzLlxuICpcbiAqIEV4YW1wbGUgdXNhZ2U6XG4gKiBgYGBqc1xuICogY29uc3QgYXhpYTogQXhpYSA9IG5ldyBBeGlhKFwiMTI3LjAuMC4xXCIsIDk2NTAsIFwiaHR0cHNcIilcbiAqIGBgYFxuICpcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXhpYSBleHRlbmRzIEF4aWFDb3JlIHtcbiAgLyoqXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIEFkbWluIFJQQy5cbiAgICovXG4gIEFkbWluID0gKCkgPT4gdGhpcy5hcGlzLmFkbWluIGFzIEFkbWluQVBJXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIEF1dGggUlBDLlxuICAgKi9cbiAgQXV0aCA9ICgpID0+IHRoaXMuYXBpcy5hdXRoIGFzIEF1dGhBUElcblxuICAvKipcbiAgICogUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgRVZNQVBJIFJQQyBwb2ludGVkIGF0IHRoZSBBcHBDaGFpbi5cbiAgICovXG4gIEFwcENoYWluID0gKCkgPT4gdGhpcy5hcGlzLmFwcGNoYWluIGFzIEVWTUFQSVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBBVk0gUlBDIHBvaW50ZWQgYXQgdGhlIEFzc2V0Q2hhaW4uXG4gICAqL1xuICBBc3NldENoYWluID0gKCkgPT4gdGhpcy5hcGlzLmFzc2V0Y2hhaW4gYXMgQVZNQVBJXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIEhlYWx0aCBSUEMgZm9yIGEgbm9kZS5cbiAgICovXG4gIEhlYWx0aCA9ICgpID0+IHRoaXMuYXBpcy5oZWFsdGggYXMgSGVhbHRoQVBJXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIEluZGV4IFJQQyBmb3IgYSBub2RlLlxuICAgKi9cbiAgSW5kZXggPSAoKSA9PiB0aGlzLmFwaXMuaW5kZXggYXMgSW5kZXhBUElcblxuICAvKipcbiAgICogUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgSW5mbyBSUEMgZm9yIGEgbm9kZS5cbiAgICovXG4gIEluZm8gPSAoKSA9PiB0aGlzLmFwaXMuaW5mbyBhcyBJbmZvQVBJXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIE1ldHJpY3MgUlBDLlxuICAgKi9cbiAgTWV0cmljcyA9ICgpID0+IHRoaXMuYXBpcy5tZXRyaWNzIGFzIE1ldHJpY3NBUElcblxuICAvKipcbiAgICogUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgS2V5c3RvcmUgUlBDIGZvciBhIG5vZGUuIFdlIGxhYmVsIGl0IFwiTm9kZUtleXNcIiB0byByZWR1Y2VcbiAgICogY29uZnVzaW9uIGFib3V0IHdoYXQgaXQncyBhY2Nlc3NpbmcuXG4gICAqL1xuICBOb2RlS2V5cyA9ICgpID0+IHRoaXMuYXBpcy5rZXlzdG9yZSBhcyBLZXlzdG9yZUFQSVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBQbGF0Zm9ybVZNIFJQQyBwb2ludGVkIGF0IHRoZSBDb3JlQ2hhaW4uXG4gICAqL1xuICBDb3JlQ2hhaW4gPSAoKSA9PiB0aGlzLmFwaXMuY29yZWNoYWluIGFzIFBsYXRmb3JtVk1BUElcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBBeGlhIGluc3RhbmNlLiBTZXRzIHRoZSBhZGRyZXNzIGFuZCBwb3J0IG9mIHRoZSBtYWluIEF4aWEgQ2xpZW50LlxuICAgKlxuICAgKiBAcGFyYW0gaG9zdCBUaGUgaG9zdG5hbWUgdG8gcmVzb2x2ZSB0byByZWFjaCB0aGUgQXhpYSBDbGllbnQgUlBDIEFQSXNcbiAgICogQHBhcmFtIHBvcnQgVGhlIHBvcnQgdG8gcmVzb2x2ZSB0byByZWFjaCB0aGUgQXhpYSBDbGllbnQgUlBDIEFQSXNcbiAgICogQHBhcmFtIHByb3RvY29sIFRoZSBwcm90b2NvbCBzdHJpbmcgdG8gdXNlIGJlZm9yZSBhIFwiOi8vXCIgaW4gYSByZXF1ZXN0LFxuICAgKiBleDogXCJodHRwXCIsIFwiaHR0cHNcIiwgXCJnaXRcIiwgXCJ3c1wiLCBldGMuIERlZmF1bHRzIHRvIGh0dHBcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBTZXRzIHRoZSBOZXR3b3JrSUQgb2YgdGhlIGNsYXNzLiBEZWZhdWx0IFtbRGVmYXVsdE5ldHdvcmtJRF1dXG4gICAqIEBwYXJhbSBBc3NldENoYWluSUQgU2V0cyB0aGUgYmxvY2tjaGFpbklEIGZvciB0aGUgQVZNLiBXaWxsIHRyeSB0byBhdXRvLWRldGVjdCxcbiAgICogb3RoZXJ3aXNlIGRlZmF1bHQgXCIyZU55MW1VRmRtYXhYTmoxZVFIVWU3TnA0Z2p1OXNKc0V0V1E0TVgzVG9pTkt1QURlZFwiXG4gICAqIEBwYXJhbSBBcHBDaGFpbklEIFNldHMgdGhlIGJsb2NrY2hhaW5JRCBmb3IgdGhlIEVWTS4gV2lsbCB0cnkgdG8gYXV0by1kZXRlY3QsXG4gICAqIG90aGVyd2lzZSBkZWZhdWx0IFwiMkNBNmo1ell6YXN5blBzRmVOb3FXa21UQ3QzVlNjTXZYVVpIYmZESjhrM29HekFQdFVcIlxuICAgKiBAcGFyYW0gaHJwIFRoZSBodW1hbi1yZWFkYWJsZSBwYXJ0IG9mIHRoZSBiZWNoMzIgYWRkcmVzc2VzXG4gICAqIEBwYXJhbSBza2lwaW5pdCBTa2lwcyBjcmVhdGluZyB0aGUgQVBJcy4gRGVmYXVsdHMgdG8gZmFsc2VcbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIGhvc3Q/OiBzdHJpbmcsXG4gICAgcG9ydD86IG51bWJlcixcbiAgICBwcm90b2NvbDogc3RyaW5nID0gXCJodHRwXCIsXG4gICAgbmV0d29ya0lEOiBudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELFxuICAgIEFzc2V0Q2hhaW5JRDogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIEFwcENoYWluSUQ6IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBocnA6IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBza2lwaW5pdDogYm9vbGVhbiA9IGZhbHNlXG4gICkge1xuICAgIHN1cGVyKGhvc3QsIHBvcnQsIHByb3RvY29sKVxuICAgIGxldCBhc3NldGNoYWluaWQ6IHN0cmluZyA9IEFzc2V0Q2hhaW5JRFxuICAgIGxldCBhcHBjaGFpbmlkOiBzdHJpbmcgPSBBcHBDaGFpbklEXG5cbiAgICBpZiAoXG4gICAgICB0eXBlb2YgQXNzZXRDaGFpbklEID09PSBcInVuZGVmaW5lZFwiIHx8XG4gICAgICAhQXNzZXRDaGFpbklEIHx8XG4gICAgICBBc3NldENoYWluSUQudG9Mb3dlckNhc2UoKSA9PT0gXCJ4XCJcbiAgICApIHtcbiAgICAgIGlmIChuZXR3b3JrSUQudG9TdHJpbmcoKSBpbiBEZWZhdWx0cy5uZXR3b3JrKSB7XG4gICAgICAgIGFzc2V0Y2hhaW5pZCA9IERlZmF1bHRzLm5ldHdvcmtbYCR7bmV0d29ya0lEfWBdLlguYmxvY2tjaGFpbklEXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhc3NldGNoYWluaWQgPSBEZWZhdWx0cy5uZXR3b3JrWzEyMzQ1XS5YLmJsb2NrY2hhaW5JRFxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoXG4gICAgICB0eXBlb2YgQXBwQ2hhaW5JRCA9PT0gXCJ1bmRlZmluZWRcIiB8fFxuICAgICAgIUFwcENoYWluSUQgfHxcbiAgICAgIEFwcENoYWluSUQudG9Mb3dlckNhc2UoKSA9PT0gXCJjXCJcbiAgICApIHtcbiAgICAgIGlmIChuZXR3b3JrSUQudG9TdHJpbmcoKSBpbiBEZWZhdWx0cy5uZXR3b3JrKSB7XG4gICAgICAgIGFwcGNoYWluaWQgPSBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldHdvcmtJRH1gXS5DLmJsb2NrY2hhaW5JRFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXBwY2hhaW5pZCA9IERlZmF1bHRzLm5ldHdvcmtbMTIzNDVdLkMuYmxvY2tjaGFpbklEXG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0eXBlb2YgbmV0d29ya0lEID09PSBcIm51bWJlclwiICYmIG5ldHdvcmtJRCA+PSAwKSB7XG4gICAgICB0aGlzLm5ldHdvcmtJRCA9IG5ldHdvcmtJRFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIG5ldHdvcmtJRCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgbmV0d29ya0lEID0gRGVmYXVsdE5ldHdvcmtJRFxuICAgIH1cbiAgICBpZiAodHlwZW9mIGhycCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5ocnAgPSBocnBcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5ocnAgPSBnZXRQcmVmZXJyZWRIUlAodGhpcy5uZXR3b3JrSUQpXG4gICAgfVxuXG4gICAgaWYgKCFza2lwaW5pdCkge1xuICAgICAgdGhpcy5hZGRBUEkoXCJhZG1pblwiLCBBZG1pbkFQSSlcbiAgICAgIHRoaXMuYWRkQVBJKFwiYXV0aFwiLCBBdXRoQVBJKVxuICAgICAgdGhpcy5hZGRBUEkoXCJhc3NldGNoYWluXCIsIEFWTUFQSSwgXCIvZXh0L2JjL1hcIiwgYXNzZXRjaGFpbmlkKVxuICAgICAgdGhpcy5hZGRBUEkoXCJhcHBjaGFpblwiLCBFVk1BUEksIFwiL2V4dC9iYy9DL2F4Y1wiLCBhcHBjaGFpbmlkKVxuICAgICAgdGhpcy5hZGRBUEkoXCJoZWFsdGhcIiwgSGVhbHRoQVBJKVxuICAgICAgdGhpcy5hZGRBUEkoXCJpbmZvXCIsIEluZm9BUEkpXG4gICAgICB0aGlzLmFkZEFQSShcImluZGV4XCIsIEluZGV4QVBJKVxuICAgICAgdGhpcy5hZGRBUEkoXCJrZXlzdG9yZVwiLCBLZXlzdG9yZUFQSSlcbiAgICAgIHRoaXMuYWRkQVBJKFwibWV0cmljc1wiLCBNZXRyaWNzQVBJKVxuICAgICAgdGhpcy5hZGRBUEkoXCJjb3JlY2hhaW5cIiwgUGxhdGZvcm1WTUFQSSlcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IHsgQXhpYSB9XG5leHBvcnQgeyBBeGlhQ29yZSB9XG5leHBvcnQgeyBCaW5Ub29scyB9XG5leHBvcnQgeyBCTiB9XG5leHBvcnQgeyBCdWZmZXIgfVxuZXhwb3J0IHsgREIgfVxuZXhwb3J0IHsgSEROb2RlIH1cbmV4cG9ydCB7IEdlbmVzaXNBc3NldCB9XG5leHBvcnQgeyBHZW5lc2lzRGF0YSB9XG5leHBvcnQgeyBNbmVtb25pYyB9XG5leHBvcnQgeyBQdWJTdWIgfVxuZXhwb3J0IHsgU29ja2V0IH1cblxuZXhwb3J0ICogYXMgYWRtaW4gZnJvbSBcIi4vYXBpcy9hZG1pblwiXG5leHBvcnQgKiBhcyBhdXRoIGZyb20gXCIuL2FwaXMvYXV0aFwiXG5leHBvcnQgKiBhcyBhdm0gZnJvbSBcIi4vYXBpcy9hdm1cIlxuZXhwb3J0ICogYXMgY29tbW9uIGZyb20gXCIuL2NvbW1vblwiXG5leHBvcnQgKiBhcyBldm0gZnJvbSBcIi4vYXBpcy9ldm1cIlxuZXhwb3J0ICogYXMgaGVhbHRoIGZyb20gXCIuL2FwaXMvaGVhbHRoXCJcbmV4cG9ydCAqIGFzIGluZGV4IGZyb20gXCIuL2FwaXMvaW5kZXhcIlxuZXhwb3J0ICogYXMgaW5mbyBmcm9tIFwiLi9hcGlzL2luZm9cIlxuZXhwb3J0ICogYXMga2V5c3RvcmUgZnJvbSBcIi4vYXBpcy9rZXlzdG9yZVwiXG5leHBvcnQgKiBhcyBtZXRyaWNzIGZyb20gXCIuL2FwaXMvbWV0cmljc1wiXG5leHBvcnQgKiBhcyBwbGF0Zm9ybXZtIGZyb20gXCIuL2FwaXMvcGxhdGZvcm12bVwiXG5leHBvcnQgKiBhcyB1dGlscyBmcm9tIFwiLi91dGlsc1wiXG4iXX0=