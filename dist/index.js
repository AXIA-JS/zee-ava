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
     * @param XChainID Sets the blockchainID for the AVM. Will try to auto-detect,
     * otherwise default "2eNy1mUFdmaxXNj1eQHUe7Np4gju9sJsEtWQ4MX3ToiNKuADed"
     * @param AppChainID Sets the blockchainID for the EVM. Will try to auto-detect,
     * otherwise default "2CA6j5zYzasynPsFeNoqWkmTCt3VScMvXUZHbfDJ8k3oGzAPtU"
     * @param hrp The human-readable part of the bech32 addresses
     * @param skipinit Skips creating the APIs. Defaults to false
     */
    constructor(host, port, protocol = "http", networkID = constants_1.DefaultNetworkID, XChainID = undefined, AppChainID = undefined, hrp = undefined, skipinit = false) {
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
         * Returns a reference to the AVM RPC pointed at the X-Chain.
         */
        this.XChain = () => this.apis.xchain;
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
        let xchainid = XChainID;
        let appchainid = AppChainID;
        if (typeof XChainID === "undefined" ||
            !XChainID ||
            XChainID.toLowerCase() === "x") {
            if (networkID.toString() in constants_1.Defaults.network) {
                xchainid = constants_1.Defaults.network[`${networkID}`].X.blockchainID;
            }
            else {
                xchainid = constants_1.Defaults.network[12345].X.blockchainID;
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
            this.addAPI("xchain", api_3.AVMAPI, "/ext/bc/X", xchainid);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxrREFBNkI7QUFtS3BCLG1CQW5LRixjQUFRLENBbUtFO0FBbEtqQiwwQ0FBMkM7QUFDM0MseUNBQXlDO0FBQ3pDLHdDQUF1QztBQUN2Qyx3Q0FBdUM7QUFDdkMsMERBQXNEO0FBb0s3Qyw2RkFwS0EsMkJBQVksT0FvS0E7QUFuS3JCLHdEQUFvRDtBQW9LM0MsNEZBcEtBLHlCQUFXLE9Bb0tBO0FBbktwQiwyQ0FBNkM7QUFDN0MsMENBQTJDO0FBQzNDLHlDQUF5QztBQUN6Qyw2Q0FBaUQ7QUFDakQsNENBQStDO0FBQy9DLGdEQUFxRDtBQUNyRCxpREFBNkM7QUFnS3BDLHVGQWhLQSxlQUFNLE9BZ0tBO0FBL0pmLGlEQUE4RDtBQUM5RCw2REFBeUQ7QUFDekQsZ0VBQXVDO0FBb0o5QixtQkFwSkYsa0JBQVEsQ0FvSkU7QUFuSmpCLG9EQUEyQjtBQXNKbEIsYUF0SkYsWUFBRSxDQXNKRTtBQXJKWCxnRUFBdUM7QUF5SjlCLG1CQXpKRixrQkFBUSxDQXlKRTtBQXhKakIsNERBQW1DO0FBeUoxQixpQkF6SkYsZ0JBQU0sQ0F5SkU7QUF4SmYsNERBQW1DO0FBb0oxQixpQkFwSkYsZ0JBQU0sQ0FvSkU7QUFuSmYsa0RBQXNCO0FBZ0piLGFBaEpGLGVBQUUsQ0FnSkU7QUEvSVgsb0NBQWdDO0FBZ0p2Qix1RkFoSkEsZUFBTSxPQWdKQTtBQTlJZjs7Ozs7Ozs7R0FRRztBQUNILE1BQXFCLElBQUssU0FBUSxjQUFRO0lBb0R4Qzs7Ozs7Ozs7Ozs7Ozs7T0FjRztJQUNILFlBQ0UsSUFBYSxFQUNiLElBQWEsRUFDYixXQUFtQixNQUFNLEVBQ3pCLFlBQW9CLDRCQUFnQixFQUNwQyxXQUFtQixTQUFTLEVBQzVCLGFBQXFCLFNBQVMsRUFDOUIsTUFBYyxT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LENBQUMsU0FBUyxDQUFDLENBQUE7U0FDM0M7UUFFRCxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsY0FBUSxDQUFDLENBQUE7WUFDOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsYUFBTyxDQUFDLENBQUE7WUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsWUFBTSxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQTtZQUNwRCxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxZQUFNLEVBQUUsZUFBZSxFQUFFLFVBQVUsQ0FBQyxDQUFBO1lBQzVELElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLGVBQVMsQ0FBQyxDQUFBO1lBQ2hDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLGFBQU8sQ0FBQyxDQUFBO1lBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLGNBQVEsQ0FBQyxDQUFBO1lBQzlCLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLGlCQUFXLENBQUMsQ0FBQTtZQUNwQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxnQkFBVSxDQUFDLENBQUE7WUFDbEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsb0JBQWEsQ0FBQyxDQUFBO1NBQ3hDO0lBQ0gsQ0FBQztDQUNGO0FBL0hELHVCQStIQztBQUVRLG9CQUFJO0FBYWIsc0RBQXFDO0FBQ3JDLG9EQUFtQztBQUNuQyxrREFBaUM7QUFDakMsbURBQWtDO0FBQ2xDLGtEQUFpQztBQUNqQyx3REFBdUM7QUFDdkMsc0RBQXFDO0FBQ3JDLG9EQUFtQztBQUNuQyw0REFBMkM7QUFDM0MsMERBQXlDO0FBQ3pDLGdFQUErQztBQUMvQyxpREFBZ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBeGlhXG4gKi9cbmltcG9ydCBBeGlhQ29yZSBmcm9tIFwiLi9heGlhXCJcbmltcG9ydCB7IEFkbWluQVBJIH0gZnJvbSBcIi4vYXBpcy9hZG1pbi9hcGlcIlxuaW1wb3J0IHsgQXV0aEFQSSB9IGZyb20gXCIuL2FwaXMvYXV0aC9hcGlcIlxuaW1wb3J0IHsgQVZNQVBJIH0gZnJvbSBcIi4vYXBpcy9hdm0vYXBpXCJcbmltcG9ydCB7IEVWTUFQSSB9IGZyb20gXCIuL2FwaXMvZXZtL2FwaVwiXG5pbXBvcnQgeyBHZW5lc2lzQXNzZXQgfSBmcm9tIFwiLi9hcGlzL2F2bS9nZW5lc2lzYXNzZXRcIlxuaW1wb3J0IHsgR2VuZXNpc0RhdGEgfSBmcm9tIFwiLi9hcGlzL2F2bS9nZW5lc2lzZGF0YVwiXG5pbXBvcnQgeyBIZWFsdGhBUEkgfSBmcm9tIFwiLi9hcGlzL2hlYWx0aC9hcGlcIlxuaW1wb3J0IHsgSW5kZXhBUEkgfSBmcm9tIFwiLi9hcGlzL2luZGV4L2FwaVwiXG5pbXBvcnQgeyBJbmZvQVBJIH0gZnJvbSBcIi4vYXBpcy9pbmZvL2FwaVwiXG5pbXBvcnQgeyBLZXlzdG9yZUFQSSB9IGZyb20gXCIuL2FwaXMva2V5c3RvcmUvYXBpXCJcbmltcG9ydCB7IE1ldHJpY3NBUEkgfSBmcm9tIFwiLi9hcGlzL21ldHJpY3MvYXBpXCJcbmltcG9ydCB7IFBsYXRmb3JtVk1BUEkgfSBmcm9tIFwiLi9hcGlzL3BsYXRmb3Jtdm0vYXBpXCJcbmltcG9ydCB7IFNvY2tldCB9IGZyb20gXCIuL2FwaXMvc29ja2V0L3NvY2tldFwiXG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lELCBEZWZhdWx0cyB9IGZyb20gXCIuL3V0aWxzL2NvbnN0YW50c1wiXG5pbXBvcnQgeyBnZXRQcmVmZXJyZWRIUlAgfSBmcm9tIFwiLi91dGlscy9oZWxwZXJmdW5jdGlvbnNcIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCBEQiBmcm9tIFwiLi91dGlscy9kYlwiXG5pbXBvcnQgTW5lbW9uaWMgZnJvbSBcIi4vdXRpbHMvbW5lbW9uaWNcIlxuaW1wb3J0IFB1YlN1YiBmcm9tIFwiLi91dGlscy9wdWJzdWJcIlxuaW1wb3J0IEhETm9kZSBmcm9tIFwiLi91dGlscy9oZG5vZGVcIlxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5cbi8qKlxuICogQXhpYUpTIGlzIG1pZGRsZXdhcmUgZm9yIGludGVyYWN0aW5nIHdpdGggQXhpYSBub2RlIFJQQyBBUElzLlxuICpcbiAqIEV4YW1wbGUgdXNhZ2U6XG4gKiBgYGBqc1xuICogY29uc3QgYXhpYTogQXhpYSA9IG5ldyBBeGlhKFwiMTI3LjAuMC4xXCIsIDk2NTAsIFwiaHR0cHNcIilcbiAqIGBgYFxuICpcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXhpYSBleHRlbmRzIEF4aWFDb3JlIHtcbiAgLyoqXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIEFkbWluIFJQQy5cbiAgICovXG4gIEFkbWluID0gKCkgPT4gdGhpcy5hcGlzLmFkbWluIGFzIEFkbWluQVBJXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIEF1dGggUlBDLlxuICAgKi9cbiAgQXV0aCA9ICgpID0+IHRoaXMuYXBpcy5hdXRoIGFzIEF1dGhBUElcblxuICAvKipcbiAgICogUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgRVZNQVBJIFJQQyBwb2ludGVkIGF0IHRoZSBBcHBDaGFpbi5cbiAgICovXG4gIEFwcENoYWluID0gKCkgPT4gdGhpcy5hcGlzLmFwcGNoYWluIGFzIEVWTUFQSVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBBVk0gUlBDIHBvaW50ZWQgYXQgdGhlIFgtQ2hhaW4uXG4gICAqL1xuICBYQ2hhaW4gPSAoKSA9PiB0aGlzLmFwaXMueGNoYWluIGFzIEFWTUFQSVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBIZWFsdGggUlBDIGZvciBhIG5vZGUuXG4gICAqL1xuICBIZWFsdGggPSAoKSA9PiB0aGlzLmFwaXMuaGVhbHRoIGFzIEhlYWx0aEFQSVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBJbmRleCBSUEMgZm9yIGEgbm9kZS5cbiAgICovXG4gIEluZGV4ID0gKCkgPT4gdGhpcy5hcGlzLmluZGV4IGFzIEluZGV4QVBJXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIEluZm8gUlBDIGZvciBhIG5vZGUuXG4gICAqL1xuICBJbmZvID0gKCkgPT4gdGhpcy5hcGlzLmluZm8gYXMgSW5mb0FQSVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoZSBNZXRyaWNzIFJQQy5cbiAgICovXG4gIE1ldHJpY3MgPSAoKSA9PiB0aGlzLmFwaXMubWV0cmljcyBhcyBNZXRyaWNzQVBJXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIEtleXN0b3JlIFJQQyBmb3IgYSBub2RlLiBXZSBsYWJlbCBpdCBcIk5vZGVLZXlzXCIgdG8gcmVkdWNlXG4gICAqIGNvbmZ1c2lvbiBhYm91dCB3aGF0IGl0J3MgYWNjZXNzaW5nLlxuICAgKi9cbiAgTm9kZUtleXMgPSAoKSA9PiB0aGlzLmFwaXMua2V5c3RvcmUgYXMgS2V5c3RvcmVBUElcblxuICAvKipcbiAgICogUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgUGxhdGZvcm1WTSBSUEMgcG9pbnRlZCBhdCB0aGUgQ29yZUNoYWluLlxuICAgKi9cbiAgQ29yZUNoYWluID0gKCkgPT4gdGhpcy5hcGlzLmNvcmVjaGFpbiBhcyBQbGF0Zm9ybVZNQVBJXG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgQXhpYSBpbnN0YW5jZS4gU2V0cyB0aGUgYWRkcmVzcyBhbmQgcG9ydCBvZiB0aGUgbWFpbiBBeGlhIENsaWVudC5cbiAgICpcbiAgICogQHBhcmFtIGhvc3QgVGhlIGhvc3RuYW1lIHRvIHJlc29sdmUgdG8gcmVhY2ggdGhlIEF4aWEgQ2xpZW50IFJQQyBBUElzXG4gICAqIEBwYXJhbSBwb3J0IFRoZSBwb3J0IHRvIHJlc29sdmUgdG8gcmVhY2ggdGhlIEF4aWEgQ2xpZW50IFJQQyBBUElzXG4gICAqIEBwYXJhbSBwcm90b2NvbCBUaGUgcHJvdG9jb2wgc3RyaW5nIHRvIHVzZSBiZWZvcmUgYSBcIjovL1wiIGluIGEgcmVxdWVzdCxcbiAgICogZXg6IFwiaHR0cFwiLCBcImh0dHBzXCIsIFwiZ2l0XCIsIFwid3NcIiwgZXRjLiBEZWZhdWx0cyB0byBodHRwXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgU2V0cyB0aGUgTmV0d29ya0lEIG9mIHRoZSBjbGFzcy4gRGVmYXVsdCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAgKiBAcGFyYW0gWENoYWluSUQgU2V0cyB0aGUgYmxvY2tjaGFpbklEIGZvciB0aGUgQVZNLiBXaWxsIHRyeSB0byBhdXRvLWRldGVjdCxcbiAgICogb3RoZXJ3aXNlIGRlZmF1bHQgXCIyZU55MW1VRmRtYXhYTmoxZVFIVWU3TnA0Z2p1OXNKc0V0V1E0TVgzVG9pTkt1QURlZFwiXG4gICAqIEBwYXJhbSBBcHBDaGFpbklEIFNldHMgdGhlIGJsb2NrY2hhaW5JRCBmb3IgdGhlIEVWTS4gV2lsbCB0cnkgdG8gYXV0by1kZXRlY3QsXG4gICAqIG90aGVyd2lzZSBkZWZhdWx0IFwiMkNBNmo1ell6YXN5blBzRmVOb3FXa21UQ3QzVlNjTXZYVVpIYmZESjhrM29HekFQdFVcIlxuICAgKiBAcGFyYW0gaHJwIFRoZSBodW1hbi1yZWFkYWJsZSBwYXJ0IG9mIHRoZSBiZWNoMzIgYWRkcmVzc2VzXG4gICAqIEBwYXJhbSBza2lwaW5pdCBTa2lwcyBjcmVhdGluZyB0aGUgQVBJcy4gRGVmYXVsdHMgdG8gZmFsc2VcbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIGhvc3Q/OiBzdHJpbmcsXG4gICAgcG9ydD86IG51bWJlcixcbiAgICBwcm90b2NvbDogc3RyaW5nID0gXCJodHRwXCIsXG4gICAgbmV0d29ya0lEOiBudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELFxuICAgIFhDaGFpbklEOiBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgQXBwQ2hhaW5JRDogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIGhycDogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIHNraXBpbml0OiBib29sZWFuID0gZmFsc2VcbiAgKSB7XG4gICAgc3VwZXIoaG9zdCwgcG9ydCwgcHJvdG9jb2wpXG4gICAgbGV0IHhjaGFpbmlkOiBzdHJpbmcgPSBYQ2hhaW5JRFxuICAgIGxldCBhcHBjaGFpbmlkOiBzdHJpbmcgPSBBcHBDaGFpbklEXG5cbiAgICBpZiAoXG4gICAgICB0eXBlb2YgWENoYWluSUQgPT09IFwidW5kZWZpbmVkXCIgfHxcbiAgICAgICFYQ2hhaW5JRCB8fFxuICAgICAgWENoYWluSUQudG9Mb3dlckNhc2UoKSA9PT0gXCJ4XCJcbiAgICApIHtcbiAgICAgIGlmIChuZXR3b3JrSUQudG9TdHJpbmcoKSBpbiBEZWZhdWx0cy5uZXR3b3JrKSB7XG4gICAgICAgIHhjaGFpbmlkID0gRGVmYXVsdHMubmV0d29ya1tgJHtuZXR3b3JrSUR9YF0uWC5ibG9ja2NoYWluSURcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHhjaGFpbmlkID0gRGVmYXVsdHMubmV0d29ya1sxMjM0NV0uWC5ibG9ja2NoYWluSURcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKFxuICAgICAgdHlwZW9mIEFwcENoYWluSUQgPT09IFwidW5kZWZpbmVkXCIgfHxcbiAgICAgICFBcHBDaGFpbklEIHx8XG4gICAgICBBcHBDaGFpbklELnRvTG93ZXJDYXNlKCkgPT09IFwiY1wiXG4gICAgKSB7XG4gICAgICBpZiAobmV0d29ya0lELnRvU3RyaW5nKCkgaW4gRGVmYXVsdHMubmV0d29yaykge1xuICAgICAgICBhcHBjaGFpbmlkID0gRGVmYXVsdHMubmV0d29ya1tgJHtuZXR3b3JrSUR9YF0uQy5ibG9ja2NoYWluSURcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFwcGNoYWluaWQgPSBEZWZhdWx0cy5uZXR3b3JrWzEyMzQ1XS5DLmJsb2NrY2hhaW5JRFxuICAgICAgfVxuICAgIH1cbiAgICBpZiAodHlwZW9mIG5ldHdvcmtJRCA9PT0gXCJudW1iZXJcIiAmJiBuZXR3b3JrSUQgPj0gMCkge1xuICAgICAgdGhpcy5uZXR3b3JrSUQgPSBuZXR3b3JrSURcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBuZXR3b3JrSUQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIG5ldHdvcmtJRCA9IERlZmF1bHROZXR3b3JrSURcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBocnAgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMuaHJwID0gaHJwXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaHJwID0gZ2V0UHJlZmVycmVkSFJQKHRoaXMubmV0d29ya0lEKVxuICAgIH1cblxuICAgIGlmICghc2tpcGluaXQpIHtcbiAgICAgIHRoaXMuYWRkQVBJKFwiYWRtaW5cIiwgQWRtaW5BUEkpXG4gICAgICB0aGlzLmFkZEFQSShcImF1dGhcIiwgQXV0aEFQSSlcbiAgICAgIHRoaXMuYWRkQVBJKFwieGNoYWluXCIsIEFWTUFQSSwgXCIvZXh0L2JjL1hcIiwgeGNoYWluaWQpXG4gICAgICB0aGlzLmFkZEFQSShcImFwcGNoYWluXCIsIEVWTUFQSSwgXCIvZXh0L2JjL0MvYXhjXCIsIGFwcGNoYWluaWQpXG4gICAgICB0aGlzLmFkZEFQSShcImhlYWx0aFwiLCBIZWFsdGhBUEkpXG4gICAgICB0aGlzLmFkZEFQSShcImluZm9cIiwgSW5mb0FQSSlcbiAgICAgIHRoaXMuYWRkQVBJKFwiaW5kZXhcIiwgSW5kZXhBUEkpXG4gICAgICB0aGlzLmFkZEFQSShcImtleXN0b3JlXCIsIEtleXN0b3JlQVBJKVxuICAgICAgdGhpcy5hZGRBUEkoXCJtZXRyaWNzXCIsIE1ldHJpY3NBUEkpXG4gICAgICB0aGlzLmFkZEFQSShcImNvcmVjaGFpblwiLCBQbGF0Zm9ybVZNQVBJKVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgeyBBeGlhIH1cbmV4cG9ydCB7IEF4aWFDb3JlIH1cbmV4cG9ydCB7IEJpblRvb2xzIH1cbmV4cG9ydCB7IEJOIH1cbmV4cG9ydCB7IEJ1ZmZlciB9XG5leHBvcnQgeyBEQiB9XG5leHBvcnQgeyBIRE5vZGUgfVxuZXhwb3J0IHsgR2VuZXNpc0Fzc2V0IH1cbmV4cG9ydCB7IEdlbmVzaXNEYXRhIH1cbmV4cG9ydCB7IE1uZW1vbmljIH1cbmV4cG9ydCB7IFB1YlN1YiB9XG5leHBvcnQgeyBTb2NrZXQgfVxuXG5leHBvcnQgKiBhcyBhZG1pbiBmcm9tIFwiLi9hcGlzL2FkbWluXCJcbmV4cG9ydCAqIGFzIGF1dGggZnJvbSBcIi4vYXBpcy9hdXRoXCJcbmV4cG9ydCAqIGFzIGF2bSBmcm9tIFwiLi9hcGlzL2F2bVwiXG5leHBvcnQgKiBhcyBjb21tb24gZnJvbSBcIi4vY29tbW9uXCJcbmV4cG9ydCAqIGFzIGV2bSBmcm9tIFwiLi9hcGlzL2V2bVwiXG5leHBvcnQgKiBhcyBoZWFsdGggZnJvbSBcIi4vYXBpcy9oZWFsdGhcIlxuZXhwb3J0ICogYXMgaW5kZXggZnJvbSBcIi4vYXBpcy9pbmRleFwiXG5leHBvcnQgKiBhcyBpbmZvIGZyb20gXCIuL2FwaXMvaW5mb1wiXG5leHBvcnQgKiBhcyBrZXlzdG9yZSBmcm9tIFwiLi9hcGlzL2tleXN0b3JlXCJcbmV4cG9ydCAqIGFzIG1ldHJpY3MgZnJvbSBcIi4vYXBpcy9tZXRyaWNzXCJcbmV4cG9ydCAqIGFzIHBsYXRmb3Jtdm0gZnJvbSBcIi4vYXBpcy9wbGF0Zm9ybXZtXCJcbmV4cG9ydCAqIGFzIHV0aWxzIGZyb20gXCIuL3V0aWxzXCJcbiJdfQ==