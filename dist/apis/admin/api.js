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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAPI = void 0;
const jrpcapi_1 = require("../../common/jrpcapi");
/**
 * Class for interacting with a node's AdminAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called.
 * Instead, use the [[Axia.addAPI]] function to register this interface with Axia.
 */
class AdminAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Axia.addAPI]]
     * method.
     *
     * @param core A reference to the Axia class
     * @param baseURL Defaults to the string "/ext/admin" as the path to rpc's baseURL
     */
    constructor(core, baseURL = "/ext/admin") {
        super(core, baseURL);
        /**
         * Assign an API an alias, a different endpoint for the API. The original endpoint will still
         * work. This change only affects this node other nodes will not know about this alias.
         *
         * @param endpoint The original endpoint of the API. endpoint should only include the part of
         * the endpoint after /ext/
         * @param alias The API being aliased can now be called at ext/alias
         *
         * @returns Returns a Promise boolean containing success, true for success, false for failure.
         */
        this.alias = (endpoint, alias) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                endpoint,
                alias
            };
            const response = yield this.callMethod("admin.alias", params);
            return response.data.result.success
                ? response.data.result.success
                : response.data.result;
        });
        /**
         * Give a blockchain an alias, a different name that can be used any place the blockchain’s
         * ID is used.
         *
         * @param chain The blockchain’s ID
         * @param alias Can now be used in place of the blockchain’s ID (in API endpoints, for example)
         *
         * @returns Returns a Promise boolean containing success, true for success, false for failure.
         */
        this.aliasChain = (chain, alias) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                chain,
                alias
            };
            const response = yield this.callMethod("admin.aliasChain", params);
            return response.data.result.success
                ? response.data.result.success
                : response.data.result;
        });
        /**
         * Get all aliases for given blockchain
         *
         * @param chain The blockchain’s ID
         *
         * @returns Returns a Promise string[] containing aliases of the blockchain.
         */
        this.getChainAliases = (chain) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                chain
            };
            const response = yield this.callMethod("admin.getChainAliases", params);
            return response.data.result.aliases
                ? response.data.result.aliases
                : response.data.result;
        });
        /**
         * Returns log and display levels of loggers
         *
         * @param loggerName the name of the logger to be returned. This is an optional argument. If not specified, it returns all possible loggers.
         *
         * @returns Returns a Promise containing logger levels
         */
        this.getLoggerLevel = (loggerName) => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            if (typeof loggerName !== "undefined") {
                params.loggerName = loggerName;
            }
            const response = yield this.callMethod("admin.getLoggerLevel", params);
            return response.data.result;
        });
        /**
         * Dynamically loads any virtual machines installed on the node as plugins
         *
         * @returns Returns a Promise containing new VMs and failed VMs
         */
        this.loadVMs = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("admin.loadVMs");
            return response.data.result.aliases
                ? response.data.result.aliases
                : response.data.result;
        });
        /**
         * Dump the mutex statistics of the node to the specified file.
         *
         * @returns Promise for a boolean that is true on success.
         */
        this.lockProfile = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("admin.lockProfile");
            return response.data.result.success
                ? response.data.result.success
                : response.data.result;
        });
        /**
         * Dump the current memory footprint of the node to the specified file.
         *
         * @returns Promise for a boolean that is true on success.
         */
        this.memoryProfile = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("admin.memoryProfile");
            return response.data.result.success
                ? response.data.result.success
                : response.data.result;
        });
        /**
         * Sets log and display levels of loggers.
         *
         * @param loggerName the name of the logger to be changed. This is an optional parameter.
         * @param logLevel the log level of written logs, can be omitted.
         * @param displayLevel the log level of displayed logs, can be omitted.
         *
         * @returns Returns a Promise containing logger levels
         */
        this.setLoggerLevel = (loggerName, logLevel, displayLevel) => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            if (typeof loggerName !== "undefined") {
                params.loggerName = loggerName;
            }
            if (typeof logLevel !== "undefined") {
                params.logLevel = logLevel;
            }
            if (typeof displayLevel !== "undefined") {
                params.displayLevel = displayLevel;
            }
            const response = yield this.callMethod("admin.setLoggerLevel", params);
            return response.data.result;
        });
        /**
         * Start profiling the cpu utilization of the node. Will dump the profile information into
         * the specified file on stop.
         *
         * @returns Promise for a boolean that is true on success.
         */
        this.startCPUProfiler = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("admin.startCPUProfiler");
            return response.data.result.success
                ? response.data.result.success
                : response.data.result;
        });
        /**
         * Stop the CPU profile that was previously started.
         *
         * @returns Promise for a boolean that is true on success.
         */
        this.stopCPUProfiler = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("admin.stopCPUProfiler");
            return response.data.result.success
                ? response.data.result.success
                : response.data.result;
        });
    }
}
exports.AdminAPI = AdminAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYWRtaW4vYXBpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUtBLGtEQUE4QztBQWE5Qzs7Ozs7OztHQU9HO0FBRUgsTUFBYSxRQUFTLFNBQVEsaUJBQU87SUE2TG5DOzs7Ozs7T0FNRztJQUNILFlBQVksSUFBYyxFQUFFLFVBQWtCLFlBQVk7UUFDeEQsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQTtRQXBNdEI7Ozs7Ozs7OztXQVNHO1FBQ0gsVUFBSyxHQUFHLENBQU8sUUFBZ0IsRUFBRSxLQUFhLEVBQW9CLEVBQUU7WUFDbEUsTUFBTSxNQUFNLEdBQWdCO2dCQUMxQixRQUFRO2dCQUNSLEtBQUs7YUFDTixDQUFBO1lBQ0QsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQsYUFBYSxFQUNiLE1BQU0sQ0FDUCxDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPO2dCQUNqQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTztnQkFDOUIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQzFCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7Ozs7O1dBUUc7UUFDSCxlQUFVLEdBQUcsQ0FBTyxLQUFhLEVBQUUsS0FBYSxFQUFvQixFQUFFO1lBQ3BFLE1BQU0sTUFBTSxHQUFxQjtnQkFDL0IsS0FBSztnQkFDTCxLQUFLO2FBQ04sQ0FBQTtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELGtCQUFrQixFQUNsQixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTztnQkFDakMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJ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WUFDRCxJQUFJLE9BQU8sWUFBWSxLQUFLLFdBQVcsRUFBRTtnQkFDdkMsTUFBTSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUE7YUFDbkM7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxzQkFBc0IsRUFDdEIsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQzdCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7O1dBS0c7UUFDSCxxQkFBZ0IsR0FBRyxHQUEyQixFQUFFO1lBQzlDLE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELHdCQUF3QixDQUN6QixDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPO2dCQUNqQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTztnQkFDOUIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQzFCLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7V0FJRztRQUNILG9CQUFlLEdBQUcsR0FBMkIsRUFBRTtZQUM3QyxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCx1QkFBdUIsQ0FDeEIsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTztnQkFDakMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU87Z0JBQzlCLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUMxQixDQUFDLENBQUEsQ0FBQTtJQVdELENBQUM7Q0FDRjtBQXZNRCw0QkF1TUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktQWRtaW5cbiAqL1xuaW1wb3J0IEF4aWFDb3JlIGZyb20gXCIuLi8uLi9heGlhXCJcbmltcG9ydCB7IEpSUENBUEkgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2pycGNhcGlcIlxuaW1wb3J0IHsgUmVxdWVzdFJlc3BvbnNlRGF0YSB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpYmFzZVwiXG5pbXBvcnQge1xuICBBbGlhc0NoYWluUGFyYW1zLFxuICBBbGlhc1BhcmFtcyxcbiAgR2V0Q2hhaW5BbGlhc2VzUGFyYW1zLFxuICBHZXRMb2dnZXJMZXZlbFBhcmFtcyxcbiAgR2V0TG9nZ2VyTGV2ZWxSZXNwb25zZSxcbiAgTG9hZFZNc1Jlc3BvbnNlLFxuICBTZXRMb2dnZXJMZXZlbFBhcmFtcyxcbiAgU2V0TG9nZ2VyTGV2ZWxSZXNwb25zZVxufSBmcm9tIFwiLi9pbnRlcmZhY2VzXCJcblxuLyoqXG4gKiBDbGFzcyBmb3IgaW50ZXJhY3Rpbmcgd2l0aCBhIG5vZGUncyBBZG1pbkFQSS5cbiAqXG4gKiBAY2F0ZWdvcnkgUlBDQVBJc1xuICpcbiAqIEByZW1hcmtzIFRoaXMgZXh0ZW5kcyB0aGUgW1tKUlBDQVBJXV0gY2xhc3MuIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBkaXJlY3RseSBjYWxsZWQuXG4gKiBJbnN0ZWFkLCB1c2UgdGhlIFtbQXhpYS5hZGRBUEldXSBmdW5jdGlvbiB0byByZWdpc3RlciB0aGlzIGludGVyZmFjZSB3aXRoIEF4aWEuXG4gKi9cblxuZXhwb3J0IGNsYXNzIEFkbWluQVBJIGV4dGVuZHMgSlJQQ0FQSSB7XG4gIC8qKlxuICAgKiBBc3NpZ24gYW4gQVBJIGFuIGFsaWFzLCBhIGRpZmZlcmVudCBlbmRwb2ludCBmb3IgdGhlIEFQSS4gVGhlIG9yaWdpbmFsIGVuZHBvaW50IHdpbGwgc3RpbGxcbiAgICogd29yay4gVGhpcyBjaGFuZ2Ugb25seSBhZmZlY3RzIHRoaXMgbm9kZSBvdGhlciBub2RlcyB3aWxsIG5vdCBrbm93IGFib3V0IHRoaXMgYWxpYXMuXG4gICAqXG4gICAqIEBwYXJhbSBlbmRwb2ludCBUaGUgb3JpZ2luYWwgZW5kcG9pbnQgb2YgdGhlIEFQSS4gZW5kcG9pbnQgc2hvdWxkIG9ubHkgaW5jbHVkZSB0aGUgcGFydCBvZlxuICAgKiB0aGUgZW5kcG9pbnQgYWZ0ZXIgL2V4dC9cbiAgICogQHBhcmFtIGFsaWFzIFRoZSBBUEkgYmVpbmcgYWxpYXNlZCBjYW4gbm93IGJlIGNhbGxlZCBhdCBleHQvYWxpYXNcbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2UgYm9vbGVhbiBjb250YWluaW5nIHN1Y2Nlc3MsIHRydWUgZm9yIHN1Y2Nlc3MsIGZhbHNlIGZvciBmYWlsdXJlLlxuICAgKi9cbiAgYWxpYXMgPSBhc3luYyAoZW5kcG9pbnQ6IHN0cmluZywgYWxpYXM6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQWxpYXNQYXJhbXMgPSB7XG4gICAgICBlbmRwb2ludCxcbiAgICAgIGFsaWFzXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhZG1pbi5hbGlhc1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWNjZXNzXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1Y2Nlc3NcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlIGEgYmxvY2tjaGFpbiBhbiBhbGlhcywgYSBkaWZmZXJlbnQgbmFtZSB0aGF0IGNhbiBiZSB1c2VkIGFueSBwbGFjZSB0aGUgYmxvY2tjaGFpbuKAmXNcbiAgICogSUQgaXMgdXNlZC5cbiAgICpcbiAgICogQHBhcmFtIGNoYWluIFRoZSBibG9ja2NoYWlu4oCZcyBJRFxuICAgKiBAcGFyYW0gYWxpYXMgQ2FuIG5vdyBiZSB1c2VkIGluIHBsYWNlIG9mIHRoZSBibG9ja2NoYWlu4oCZcyBJRCAoaW4gQVBJIGVuZHBvaW50cywgZm9yIGV4YW1wbGUpXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIGJvb2xlYW4gY29udGFpbmluZyBzdWNjZXNzLCB0cnVlIGZvciBzdWNjZXNzLCBmYWxzZSBmb3IgZmFpbHVyZS5cbiAgICovXG4gIGFsaWFzQ2hhaW4gPSBhc3luYyAoY2hhaW46IHN0cmluZywgYWxpYXM6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQWxpYXNDaGFpblBhcmFtcyA9IHtcbiAgICAgIGNoYWluLFxuICAgICAgYWxpYXNcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImFkbWluLmFsaWFzQ2hhaW5cIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VjY2Vzc1xuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWNjZXNzXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFsbCBhbGlhc2VzIGZvciBnaXZlbiBibG9ja2NoYWluXG4gICAqXG4gICAqIEBwYXJhbSBjaGFpbiBUaGUgYmxvY2tjaGFpbuKAmXMgSURcbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nW10gY29udGFpbmluZyBhbGlhc2VzIG9mIHRoZSBibG9ja2NoYWluLlxuICAgKi9cbiAgZ2V0Q2hhaW5BbGlhc2VzID0gYXN5bmMgKGNoYWluOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBHZXRDaGFpbkFsaWFzZXNQYXJhbXMgPSB7XG4gICAgICBjaGFpblxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYWRtaW4uZ2V0Q2hhaW5BbGlhc2VzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmFsaWFzZXNcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWxpYXNlc1xuICAgICAgOiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgbG9nIGFuZCBkaXNwbGF5IGxldmVscyBvZiBsb2dnZXJzXG4gICAqXG4gICAqIEBwYXJhbSBsb2dnZXJOYW1lIHRoZSBuYW1lIG9mIHRoZSBsb2dnZXIgdG8gYmUgcmV0dXJuZWQuIFRoaXMgaXMgYW4gb3B0aW9uYWwgYXJndW1lbnQuIElmIG5vdCBzcGVjaWZpZWQsIGl0IHJldHVybnMgYWxsIHBvc3NpYmxlIGxvZ2dlcnMuXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIGNvbnRhaW5pbmcgbG9nZ2VyIGxldmVsc1xuICAgKi9cbiAgZ2V0TG9nZ2VyTGV2ZWwgPSBhc3luYyAoXG4gICAgbG9nZ2VyTmFtZT86IHN0cmluZ1xuICApOiBQcm9taXNlPEdldExvZ2dlckxldmVsUmVzcG9uc2U+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldExvZ2dlckxldmVsUGFyYW1zID0ge31cbiAgICBpZiAodHlwZW9mIGxvZ2dlck5hbWUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtcy5sb2dnZXJOYW1lID0gbG9nZ2VyTmFtZVxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYWRtaW4uZ2V0TG9nZ2VyTGV2ZWxcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBEeW5hbWljYWxseSBsb2FkcyBhbnkgdmlydHVhbCBtYWNoaW5lcyBpbnN0YWxsZWQgb24gdGhlIG5vZGUgYXMgcGx1Z2luc1xuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBjb250YWluaW5nIG5ldyBWTXMgYW5kIGZhaWxlZCBWTXNcbiAgICovXG4gIGxvYWRWTXMgPSBhc3luYyAoKTogUHJvbWlzZTxMb2FkVk1zUmVzcG9uc2U+ID0+IHtcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcImFkbWluLmxvYWRWTXNcIilcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWxpYXNlc1xuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC5hbGlhc2VzXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogRHVtcCB0aGUgbXV0ZXggc3RhdGlzdGljcyBvZiB0aGUgbm9kZSB0byB0aGUgc3BlY2lmaWVkIGZpbGUuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgYm9vbGVhbiB0aGF0IGlzIHRydWUgb24gc3VjY2Vzcy5cbiAgICovXG4gIGxvY2tQcm9maWxlID0gYXN5bmMgKCk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhZG1pbi5sb2NrUHJvZmlsZVwiXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWNjZXNzXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1Y2Nlc3NcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBEdW1wIHRoZSBjdXJyZW50IG1lbW9yeSBmb290cHJpbnQgb2YgdGhlIG5vZGUgdG8gdGhlIHNwZWNpZmllZCBmaWxlLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIGJvb2xlYW4gdGhhdCBpcyB0cnVlIG9uIHN1Y2Nlc3MuXG4gICAqL1xuICBtZW1vcnlQcm9maWxlID0gYXN5bmMgKCk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhZG1pbi5tZW1vcnlQcm9maWxlXCJcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1Y2Nlc3NcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VjY2Vzc1xuICAgICAgOiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgbG9nIGFuZCBkaXNwbGF5IGxldmVscyBvZiBsb2dnZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gbG9nZ2VyTmFtZSB0aGUgbmFtZSBvZiB0aGUgbG9nZ2VyIHRvIGJlIGNoYW5nZWQuIFRoaXMgaXMgYW4gb3B0aW9uYWwgcGFyYW1ldGVyLlxuICAgKiBAcGFyYW0gbG9nTGV2ZWwgdGhlIGxvZyBsZXZlbCBvZiB3cml0dGVuIGxvZ3MsIGNhbiBiZSBvbWl0dGVkLlxuICAgKiBAcGFyYW0gZGlzcGxheUxldmVsIHRoZSBsb2cgbGV2ZWwgb2YgZGlzcGxheWVkIGxvZ3MsIGNhbiBiZSBvbWl0dGVkLlxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBjb250YWluaW5nIGxvZ2dlciBsZXZlbHNcbiAgICovXG4gIHNldExvZ2dlckxldmVsID0gYXN5bmMgKFxuICAgIGxvZ2dlck5hbWU/OiBzdHJpbmcsXG4gICAgbG9nTGV2ZWw/OiBzdHJpbmcsXG4gICAgZGlzcGxheUxldmVsPzogc3RyaW5nXG4gICk6IFByb21pc2U8U2V0TG9nZ2VyTGV2ZWxSZXNwb25zZT4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogU2V0TG9nZ2VyTGV2ZWxQYXJhbXMgPSB7fVxuICAgIGlmICh0eXBlb2YgbG9nZ2VyTmFtZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLmxvZ2dlck5hbWUgPSBsb2dnZXJOYW1lXG4gICAgfVxuICAgIGlmICh0eXBlb2YgbG9nTGV2ZWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtcy5sb2dMZXZlbCA9IGxvZ0xldmVsXG4gICAgfVxuICAgIGlmICh0eXBlb2YgZGlzcGxheUxldmVsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuZGlzcGxheUxldmVsID0gZGlzcGxheUxldmVsXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhZG1pbi5zZXRMb2dnZXJMZXZlbFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0IHByb2ZpbGluZyB0aGUgY3B1IHV0aWxpemF0aW9uIG9mIHRoZSBub2RlLiBXaWxsIGR1bXAgdGhlIHByb2ZpbGUgaW5mb3JtYXRpb24gaW50b1xuICAgKiB0aGUgc3BlY2lmaWVkIGZpbGUgb24gc3RvcC5cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBib29sZWFuIHRoYXQgaXMgdHJ1ZSBvbiBzdWNjZXNzLlxuICAgKi9cbiAgc3RhcnRDUFVQcm9maWxlciA9IGFzeW5jICgpOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYWRtaW4uc3RhcnRDUFVQcm9maWxlclwiXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWNjZXNzXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1Y2Nlc3NcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wIHRoZSBDUFUgcHJvZmlsZSB0aGF0IHdhcyBwcmV2aW91c2x5IHN0YXJ0ZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgYm9vbGVhbiB0aGF0IGlzIHRydWUgb24gc3VjY2Vzcy5cbiAgICovXG4gIHN0b3BDUFVQcm9maWxlciA9IGFzeW5jICgpOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYWRtaW4uc3RvcENQVVByb2ZpbGVyXCJcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1Y2Nlc3NcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VjY2Vzc1xuICAgICAgOiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBpbnN0YW50aWF0ZWQgZGlyZWN0bHkuIEluc3RlYWQgdXNlIHRoZSBbW0F4aWEuYWRkQVBJXV1cbiAgICogbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gY29yZSBBIHJlZmVyZW5jZSB0byB0aGUgQXhpYSBjbGFzc1xuICAgKiBAcGFyYW0gYmFzZVVSTCBEZWZhdWx0cyB0byB0aGUgc3RyaW5nIFwiL2V4dC9hZG1pblwiIGFzIHRoZSBwYXRoIHRvIHJwYydzIGJhc2VVUkxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvcmU6IEF4aWFDb3JlLCBiYXNlVVJMOiBzdHJpbmcgPSBcIi9leHQvYWRtaW5cIikge1xuICAgIHN1cGVyKGNvcmUsIGJhc2VVUkwpXG4gIH1cbn1cbiJdfQ==