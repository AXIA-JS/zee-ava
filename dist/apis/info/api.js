"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfoAPI = void 0;
const jrpcapi_1 = require("../../common/jrpcapi");
const bn_js_1 = __importDefault(require("bn.js"));
/**
 * Class for interacting with a node's InfoAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Axia.addAPI]] function to register this interface with Axia.
 */
class InfoAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Axia.addAPI]] method.
     *
     * @param core A reference to the Axia class
     * @param baseURL Defaults to the string "/ext/info" as the path to rpc's baseURL
     */
    constructor(core, baseURL = "/ext/info") {
        super(core, baseURL);
        /**
         * Fetches the blockchainID from the node for a given alias.
         *
         * @param alias The blockchain alias to get the blockchainID
         *
         * @returns Returns a Promise string containing the base 58 string representation of the blockchainID.
         */
        this.getBlockchainID = (alias) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                alias
            };
            const response = yield this.callMethod("info.getBlockchainID", params);
            return response.data.result.blockchainID;
        });
        /**
         * Fetches the IP address from the node.
         *
         * @returns Returns a Promise string of the node IP address.
         */
        this.getNodeIP = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("info.getBlockchainID");
            return response.data.result.ip;
        });
        /**
         * Fetches the networkID from the node.
         *
         * @returns Returns a Promise number of the networkID.
         */
        this.getNetworkID = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("info.getNetworkID");
            return response.data.result.networkID;
        });
        /**
         * Fetches the network name this node is running on
         *
         * @returns Returns a Promise string containing the network name.
         */
        this.getNetworkName = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("info.getNetworkName");
            return response.data.result.networkName;
        });
        /**
         * Fetches the nodeID from the node.
         *
         * @returns Returns a Promise string of the nodeID.
         */
        this.getNodeID = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("info.getNodeID");
            return response.data.result.nodeID;
        });
        /**
         * Fetches the version of Gecko this node is running
         *
         * @returns Returns a Promise string containing the version of Gecko.
         */
        this.getNodeVersion = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("info.getNodeVersion");
            return response.data.result.version;
        });
        /**
         * Fetches the transaction fee from the node.
         *
         * @returns Returns a Promise object of the transaction fee in nAXC.
         */
        this.getTxFee = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("info.getTxFee");
            return {
                txFee: new bn_js_1.default(response.data.result.txFee, 10),
                creationTxFee: new bn_js_1.default(response.data.result.creationTxFee, 10)
            };
        });
        /**
         * Check whether a given chain is done bootstrapping
         * @param chain The ID or alias of a chain.
         *
         * @returns Returns a Promise boolean of whether the chain has completed bootstrapping.
         */
        this.isBootstrapped = (chain) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                chain
            };
            const response = yield this.callMethod("info.isBootstrapped", params);
            return response.data.result.isBootstrapped;
        });
        /**
         * Returns the peers connected to the node.
         * @param nodeIDs an optional parameter to specify what nodeID's descriptions should be returned.
         * If this parameter is left empty, descriptions for all active connections will be returned.
         * If the node is not connected to a specified nodeID, it will be omitted from the response.
         *
         * @returns Promise for the list of connected peers in PeersResponse format.
         */
        this.peers = (nodeIDs = []) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                nodeIDs
            };
            const response = yield this.callMethod("info.peers", params);
            return response.data.result.peers;
        });
        /**
         * Returns the network's observed uptime of this node.
         *
         * @returns Returns a Promise UptimeResponse which contains rewardingStakePercentage and weightedAveragePercentage.
         */
        this.uptime = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("info.uptime");
            return response.data.result;
        });
    }
}
exports.InfoAPI = InfoAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvaW5mby9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBS0Esa0RBQThDO0FBRTlDLGtEQUFzQjtBQVV0Qjs7Ozs7O0dBTUc7QUFDSCxNQUFhLE9BQVEsU0FBUSxpQkFBTztJQTJJbEM7Ozs7O09BS0c7SUFDSCxZQUFZLElBQWMsRUFBRSxVQUFrQixXQUFXO1FBQ3ZELEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFqSnRCOzs7Ozs7V0FNRztRQUNILG9CQUFlLEdBQUcsQ0FBTyxLQUFhLEVBQW1CLEVBQUU7WUFDekQsTUFBTSxNQUFNLEdBQTBCO2dCQUNwQyxLQUFLO2FBQ04sQ0FBQTtZQUVELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELHNCQUFzQixFQUN0QixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFBO1FBQzFDLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7V0FJRztRQUNILGNBQVMsR0FBRyxHQUEwQixFQUFFO1lBQ3RDLE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELHNCQUFzQixDQUN2QixDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUE7UUFDaEMsQ0FBQyxDQUFBLENBQUE7UUFFRDs7OztXQUlHO1FBQ0gsaUJBQVksR0FBRyxHQUEwQixFQUFFO1lBQ3pDLE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELG1CQUFtQixDQUNwQixDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUE7UUFDdkMsQ0FBQyxDQUFBLENBQUE7UUFFRDs7OztXQUlHO1FBQ0gsbUJBQWMsR0FBRyxHQUEwQixFQUFFO1lBQzNDLE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELHFCQUFxQixDQUN0QixDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUE7UUFDekMsQ0FBQyxDQUFBLENBQUE7UUFFRDs7OztXQUlHO1FBQ0gsY0FBUyxHQUFHLEdBQTBCLEVBQUU7WUFDdEMsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQsZ0JBQWdCLENBQ2pCLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQTtRQUNwQyxDQUFDLENBQUEsQ0FBQTtRQUVEOzs7O1dBSUc7UUFDSCxtQkFBYyxHQUFHLEdBQTBCLEVBQUU7WUFDM0MsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQscUJBQXFCLENBQ3RCLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQTtRQUNyQyxDQUFDLENBQUEsQ0FBQTtRQUVEOzs7O1dBSUc7UUFDSCxhQUFRLEdBQUcsR0FBb0MsRUFBRTtZQUMvQyxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFBO1lBQzVFLE9BQU87Z0JBQ0wsS0FBSyxFQUFFLElBQUksZUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUM7Z0JBQzdDLGFBQWEsRUFBRSxJQUFJLGVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDO2FBQzlELENBQUE7UUFDSCxDQUFDLENBQUEsQ0FBQTtRQUVEOzs7OztXQUtHO1FBQ0gsbUJBQWMsR0FBRyxDQUFPLEtBQWEsRUFBb0IsRUFBRTtZQUN6RCxNQUFNLE1BQU0sR0FBeUI7Z0JBQ25DLEtBQUs7YUFDTixDQUFBO1lBQ0QsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQscUJBQXFCLEVBQ3JCLE1BQU0sQ0FDUCxDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUE7UUFDNUMsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7OztXQU9HO1FBQ0gsVUFBSyxHQUFHLENBQU8sVUFBb0IsRUFBRSxFQUE0QixFQUFFO1lBQ2pFLE1BQU0sTUFBTSxHQUFnQjtnQkFDMUIsT0FBTzthQUNSLENBQUE7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxZQUFZLEVBQ1osTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQTtRQUNuQyxDQUFDLENBQUEsQ0FBQTtRQUVEOzs7O1dBSUc7UUFDSCxXQUFNLEdBQUcsR0FBa0MsRUFBRTtZQUMzQyxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFBO1lBQzFFLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUE7UUFDN0IsQ0FBQyxDQUFBLENBQUE7SUFVRCxDQUFDO0NBQ0Y7QUFwSkQsMEJBb0pDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUluZm9cbiAqL1xuaW1wb3J0IEF4aWFDb3JlIGZyb20gXCIuLi8uLi9heGlhXCJcbmltcG9ydCB7IEpSUENBUEkgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2pycGNhcGlcIlxuaW1wb3J0IHsgUmVxdWVzdFJlc3BvbnNlRGF0YSB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpYmFzZVwiXG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCJcbmltcG9ydCB7XG4gIEdldEJsb2NrY2hhaW5JRFBhcmFtcyxcbiAgR2V0VHhGZWVSZXNwb25zZSxcbiAgSXNCb290c3RyYXBwZWRQYXJhbXMsXG4gIFBlZXJzUGFyYW1zLFxuICBQZWVyc1Jlc3BvbnNlLFxuICBVcHRpbWVSZXNwb25zZVxufSBmcm9tIFwiLi9pbnRlcmZhY2VzXCJcblxuLyoqXG4gKiBDbGFzcyBmb3IgaW50ZXJhY3Rpbmcgd2l0aCBhIG5vZGUncyBJbmZvQVBJLlxuICpcbiAqIEBjYXRlZ29yeSBSUENBUElzXG4gKlxuICogQHJlbWFya3MgVGhpcyBleHRlbmRzIHRoZSBbW0pSUENBUEldXSBjbGFzcy4gVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGRpcmVjdGx5IGNhbGxlZC4gSW5zdGVhZCwgdXNlIHRoZSBbW0F4aWEuYWRkQVBJXV0gZnVuY3Rpb24gdG8gcmVnaXN0ZXIgdGhpcyBpbnRlcmZhY2Ugd2l0aCBBeGlhLlxuICovXG5leHBvcnQgY2xhc3MgSW5mb0FQSSBleHRlbmRzIEpSUENBUEkge1xuICAvKipcbiAgICogRmV0Y2hlcyB0aGUgYmxvY2tjaGFpbklEIGZyb20gdGhlIG5vZGUgZm9yIGEgZ2l2ZW4gYWxpYXMuXG4gICAqXG4gICAqIEBwYXJhbSBhbGlhcyBUaGUgYmxvY2tjaGFpbiBhbGlhcyB0byBnZXQgdGhlIGJsb2NrY2hhaW5JRFxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgY29udGFpbmluZyB0aGUgYmFzZSA1OCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIGJsb2NrY2hhaW5JRC5cbiAgICovXG4gIGdldEJsb2NrY2hhaW5JRCA9IGFzeW5jIChhbGlhczogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldEJsb2NrY2hhaW5JRFBhcmFtcyA9IHtcbiAgICAgIGFsaWFzXG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImluZm8uZ2V0QmxvY2tjaGFpbklEXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmJsb2NrY2hhaW5JRFxuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIElQIGFkZHJlc3MgZnJvbSB0aGUgbm9kZS5cbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIG9mIHRoZSBub2RlIElQIGFkZHJlc3MuXG4gICAqL1xuICBnZXROb2RlSVAgPSBhc3luYyAoKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiaW5mby5nZXRCbG9ja2NoYWluSURcIlxuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuaXBcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSBuZXR3b3JrSUQgZnJvbSB0aGUgbm9kZS5cbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2UgbnVtYmVyIG9mIHRoZSBuZXR3b3JrSUQuXG4gICAqL1xuICBnZXROZXR3b3JrSUQgPSBhc3luYyAoKTogUHJvbWlzZTxudW1iZXI+ID0+IHtcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiaW5mby5nZXROZXR3b3JrSURcIlxuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQubmV0d29ya0lEXG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyB0aGUgbmV0d29yayBuYW1lIHRoaXMgbm9kZSBpcyBydW5uaW5nIG9uXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIHN0cmluZyBjb250YWluaW5nIHRoZSBuZXR3b3JrIG5hbWUuXG4gICAqL1xuICBnZXROZXR3b3JrTmFtZSA9IGFzeW5jICgpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJpbmZvLmdldE5ldHdvcmtOYW1lXCJcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0Lm5ldHdvcmtOYW1lXG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyB0aGUgbm9kZUlEIGZyb20gdGhlIG5vZGUuXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIHN0cmluZyBvZiB0aGUgbm9kZUlELlxuICAgKi9cbiAgZ2V0Tm9kZUlEID0gYXN5bmMgKCk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImluZm8uZ2V0Tm9kZUlEXCJcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0Lm5vZGVJRFxuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIHZlcnNpb24gb2YgR2Vja28gdGhpcyBub2RlIGlzIHJ1bm5pbmdcbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIGNvbnRhaW5pbmcgdGhlIHZlcnNpb24gb2YgR2Vja28uXG4gICAqL1xuICBnZXROb2RlVmVyc2lvbiA9IGFzeW5jICgpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJpbmZvLmdldE5vZGVWZXJzaW9uXCJcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnZlcnNpb25cbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSB0cmFuc2FjdGlvbiBmZWUgZnJvbSB0aGUgbm9kZS5cbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugb2JqZWN0IG9mIHRoZSB0cmFuc2FjdGlvbiBmZWUgaW4gbkFYQy5cbiAgICovXG4gIGdldFR4RmVlID0gYXN5bmMgKCk6IFByb21pc2U8R2V0VHhGZWVSZXNwb25zZT4gPT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFwiaW5mby5nZXRUeEZlZVwiKVxuICAgIHJldHVybiB7XG4gICAgICB0eEZlZTogbmV3IEJOKHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4RmVlLCAxMCksXG4gICAgICBjcmVhdGlvblR4RmVlOiBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQuY3JlYXRpb25UeEZlZSwgMTApXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHdoZXRoZXIgYSBnaXZlbiBjaGFpbiBpcyBkb25lIGJvb3RzdHJhcHBpbmdcbiAgICogQHBhcmFtIGNoYWluIFRoZSBJRCBvciBhbGlhcyBvZiBhIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBib29sZWFuIG9mIHdoZXRoZXIgdGhlIGNoYWluIGhhcyBjb21wbGV0ZWQgYm9vdHN0cmFwcGluZy5cbiAgICovXG4gIGlzQm9vdHN0cmFwcGVkID0gYXN5bmMgKGNoYWluOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IElzQm9vdHN0cmFwcGVkUGFyYW1zID0ge1xuICAgICAgY2hhaW5cbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImluZm8uaXNCb290c3RyYXBwZWRcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuaXNCb290c3RyYXBwZWRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwZWVycyBjb25uZWN0ZWQgdG8gdGhlIG5vZGUuXG4gICAqIEBwYXJhbSBub2RlSURzIGFuIG9wdGlvbmFsIHBhcmFtZXRlciB0byBzcGVjaWZ5IHdoYXQgbm9kZUlEJ3MgZGVzY3JpcHRpb25zIHNob3VsZCBiZSByZXR1cm5lZC5cbiAgICogSWYgdGhpcyBwYXJhbWV0ZXIgaXMgbGVmdCBlbXB0eSwgZGVzY3JpcHRpb25zIGZvciBhbGwgYWN0aXZlIGNvbm5lY3Rpb25zIHdpbGwgYmUgcmV0dXJuZWQuXG4gICAqIElmIHRoZSBub2RlIGlzIG5vdCBjb25uZWN0ZWQgdG8gYSBzcGVjaWZpZWQgbm9kZUlELCBpdCB3aWxsIGJlIG9taXR0ZWQgZnJvbSB0aGUgcmVzcG9uc2UuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIHRoZSBsaXN0IG9mIGNvbm5lY3RlZCBwZWVycyBpbiBQZWVyc1Jlc3BvbnNlIGZvcm1hdC5cbiAgICovXG4gIHBlZXJzID0gYXN5bmMgKG5vZGVJRHM6IHN0cmluZ1tdID0gW10pOiBQcm9taXNlPFBlZXJzUmVzcG9uc2VbXT4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogUGVlcnNQYXJhbXMgPSB7XG4gICAgICBub2RlSURzXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJpbmZvLnBlZXJzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnBlZXJzXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbmV0d29yaydzIG9ic2VydmVkIHVwdGltZSBvZiB0aGlzIG5vZGUuXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIFVwdGltZVJlc3BvbnNlIHdoaWNoIGNvbnRhaW5zIHJld2FyZGluZ1N0YWtlUGVyY2VudGFnZSBhbmQgd2VpZ2h0ZWRBdmVyYWdlUGVyY2VudGFnZS5cbiAgICovXG4gIHVwdGltZSA9IGFzeW5jICgpOiBQcm9taXNlPFVwdGltZVJlc3BvbnNlPiA9PiB7XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXCJpbmZvLnVwdGltZVwiKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBpbnN0YW50aWF0ZWQgZGlyZWN0bHkuIEluc3RlYWQgdXNlIHRoZSBbW0F4aWEuYWRkQVBJXV0gbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gY29yZSBBIHJlZmVyZW5jZSB0byB0aGUgQXhpYSBjbGFzc1xuICAgKiBAcGFyYW0gYmFzZVVSTCBEZWZhdWx0cyB0byB0aGUgc3RyaW5nIFwiL2V4dC9pbmZvXCIgYXMgdGhlIHBhdGggdG8gcnBjJ3MgYmFzZVVSTFxuICAgKi9cbiAgY29uc3RydWN0b3IoY29yZTogQXhpYUNvcmUsIGJhc2VVUkw6IHN0cmluZyA9IFwiL2V4dC9pbmZvXCIpIHtcbiAgICBzdXBlcihjb3JlLCBiYXNlVVJMKVxuICB9XG59XG4iXX0=