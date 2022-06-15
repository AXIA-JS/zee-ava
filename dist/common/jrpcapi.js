"use strict";
/**
 * @packageDocumentation
 * @module Common-JRPCAPI
 */
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
exports.JRPCAPI = void 0;
const utils_1 = require("../utils");
const apibase_1 = require("./apibase");
class JRPCAPI extends apibase_1.APIBase {
    /**
     *
     * @param core Reference to the Axia instance using this endpoint
     * @param baseURL Path of the APIs baseURL - ex: "/ext/bc/avm"
     * @param jrpcVersion The jrpc version to use, default "2.0".
     */
    constructor(core, baseURL, jrpcVersion = "2.0") {
        super(core, baseURL);
        this.jrpcVersion = "2.0";
        this.rpcID = 1;
        this.callMethod = (method, params, baseURL, headers) => __awaiter(this, void 0, void 0, function* () {
            const ep = baseURL || this.baseURL;
            const rpc = {};
            rpc.id = this.rpcID;
            rpc.method = method;
            // Set parameters if exists
            if (params) {
                rpc.params = params;
            }
            else if (this.jrpcVersion === "1.0") {
                rpc.params = [];
            }
            if (this.jrpcVersion !== "1.0") {
                rpc.jsonrpc = this.jrpcVersion;
            }
            let headrs = { "Content-Type": "application/json;charset=UTF-8" };
            if (headers) {
                headrs = Object.assign(Object.assign({}, headrs), headers);
            }
            baseURL = this.core.getURL();
            const axConf = {
                baseURL: baseURL,
                responseType: "json",
                // use the fetch adapter if fetch is available e.g. non Node<17 env
                adapter: typeof fetch !== "undefined" ? utils_1.fetchAdapter : undefined
            };
            const resp = yield this.core.post(ep, {}, JSON.stringify(rpc), headrs, axConf);
            if (resp.status >= 200 && resp.status < 300) {
                this.rpcID += 1;
                if (typeof resp.data === "string") {
                    resp.data = JSON.parse(resp.data);
                }
                if (typeof resp.data === "object" &&
                    (resp.data === null || "error" in resp.data)) {
                    throw new Error(resp.data.error.message);
                }
            }
            return resp;
        });
        /**
         * Returns the rpcid, a strictly-increasing number, starting from 1, indicating the next
         * request ID that will be sent.
         */
        this.getRPCID = () => this.rpcID;
        this.jrpcVersion = jrpcVersion;
        this.rpcID = 1;
    }
}
exports.JRPCAPI = JRPCAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianJwY2FwaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tb24vanJwY2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7QUFHSCxvQ0FBdUM7QUFFdkMsdUNBQXdEO0FBRXhELE1BQWEsT0FBUSxTQUFRLGlCQUFPO0lBb0VsQzs7Ozs7T0FLRztJQUNILFlBQVksSUFBYyxFQUFFLE9BQWUsRUFBRSxjQUFzQixLQUFLO1FBQ3RFLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7UUExRVosZ0JBQVcsR0FBVyxLQUFLLENBQUE7UUFDM0IsVUFBSyxHQUFHLENBQUMsQ0FBQTtRQUVuQixlQUFVLEdBQUcsQ0FDWCxNQUFjLEVBQ2QsTUFBMEIsRUFDMUIsT0FBZ0IsRUFDaEIsT0FBZ0IsRUFDYyxFQUFFO1lBQ2hDLE1BQU0sRUFBRSxHQUFXLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFBO1lBQzFDLE1BQU0sR0FBRyxHQUFRLEVBQUUsQ0FBQTtZQUNuQixHQUFHLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUE7WUFDbkIsR0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7WUFFbkIsMkJBQTJCO1lBQzNCLElBQUksTUFBTSxFQUFFO2dCQUNWLEdBQUcsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO2FBQ3BCO2lCQUFNLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxLQUFLLEVBQUU7Z0JBQ3JDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFBO2FBQ2hCO1lBRUQsSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLEtBQUssRUFBRTtnQkFDOUIsR0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFBO2FBQy9CO1lBRUQsSUFBSSxNQUFNLEdBQVcsRUFBRSxjQUFjLEVBQUUsZ0NBQWdDLEVBQUUsQ0FBQTtZQUN6RSxJQUFJLE9BQU8sRUFBRTtnQkFDWCxNQUFNLG1DQUFRLE1BQU0sR0FBSyxPQUFPLENBQUUsQ0FBQTthQUNuQztZQUVELE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFBO1lBRTVCLE1BQU0sTUFBTSxHQUF1QjtnQkFDakMsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLFlBQVksRUFBRSxNQUFNO2dCQUNwQixtRUFBbUU7Z0JBQ25FLE9BQU8sRUFBRSxPQUFPLEtBQUssS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLG9CQUFZLENBQUMsQ0FBQyxDQUFDLFNBQVM7YUFDakUsQ0FBQTtZQUVELE1BQU0sSUFBSSxHQUF3QixNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUNwRCxFQUFFLEVBQ0YsRUFBRSxFQUNGLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQ25CLE1BQU0sRUFDTixNQUFNLENBQ1AsQ0FBQTtZQUNELElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLEVBQUU7Z0JBQzNDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFBO2dCQUNmLElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtvQkFDakMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtpQkFDbEM7Z0JBQ0QsSUFDRSxPQUFPLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUTtvQkFDN0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxPQUFPLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxFQUM1QztvQkFDQSxNQUFNLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO2lCQUN6QzthQUNGO1lBQ0QsT0FBTyxJQUFJLENBQUE7UUFDYixDQUFDLENBQUEsQ0FBQTtRQUVEOzs7V0FHRztRQUNILGFBQVEsR0FBRyxHQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFBO1FBVWpDLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFBO1FBQzlCLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFBO0lBQ2hCLENBQUM7Q0FDRjtBQS9FRCwwQkErRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBDb21tb24tSlJQQ0FQSVxuICovXG5cbmltcG9ydCB7IEF4aW9zUmVxdWVzdENvbmZpZyB9IGZyb20gXCJheGlvc1wiXG5pbXBvcnQgeyBmZXRjaEFkYXB0ZXIgfSBmcm9tIFwiLi4vdXRpbHNcIlxuaW1wb3J0IEF4aWFDb3JlIGZyb20gXCIuLi9heGlhXCJcbmltcG9ydCB7IEFQSUJhc2UsIFJlcXVlc3RSZXNwb25zZURhdGEgfSBmcm9tIFwiLi9hcGliYXNlXCJcblxuZXhwb3J0IGNsYXNzIEpSUENBUEkgZXh0ZW5kcyBBUElCYXNlIHtcbiAgcHJvdGVjdGVkIGpycGNWZXJzaW9uOiBzdHJpbmcgPSBcIjIuMFwiXG4gIHByb3RlY3RlZCBycGNJRCA9IDFcblxuICBjYWxsTWV0aG9kID0gYXN5bmMgKFxuICAgIG1ldGhvZDogc3RyaW5nLFxuICAgIHBhcmFtcz86IG9iamVjdFtdIHwgb2JqZWN0LFxuICAgIGJhc2VVUkw/OiBzdHJpbmcsXG4gICAgaGVhZGVycz86IG9iamVjdFxuICApOiBQcm9taXNlPFJlcXVlc3RSZXNwb25zZURhdGE+ID0+IHtcbiAgICBjb25zdCBlcDogc3RyaW5nID0gYmFzZVVSTCB8fCB0aGlzLmJhc2VVUkxcbiAgICBjb25zdCBycGM6IGFueSA9IHt9XG4gICAgcnBjLmlkID0gdGhpcy5ycGNJRFxuICAgIHJwYy5tZXRob2QgPSBtZXRob2RcblxuICAgIC8vIFNldCBwYXJhbWV0ZXJzIGlmIGV4aXN0c1xuICAgIGlmIChwYXJhbXMpIHtcbiAgICAgIHJwYy5wYXJhbXMgPSBwYXJhbXNcbiAgICB9IGVsc2UgaWYgKHRoaXMuanJwY1ZlcnNpb24gPT09IFwiMS4wXCIpIHtcbiAgICAgIHJwYy5wYXJhbXMgPSBbXVxuICAgIH1cblxuICAgIGlmICh0aGlzLmpycGNWZXJzaW9uICE9PSBcIjEuMFwiKSB7XG4gICAgICBycGMuanNvbnJwYyA9IHRoaXMuanJwY1ZlcnNpb25cbiAgICB9XG5cbiAgICBsZXQgaGVhZHJzOiBvYmplY3QgPSB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvbjtjaGFyc2V0PVVURi04XCIgfVxuICAgIGlmIChoZWFkZXJzKSB7XG4gICAgICBoZWFkcnMgPSB7IC4uLmhlYWRycywgLi4uaGVhZGVycyB9XG4gICAgfVxuXG4gICAgYmFzZVVSTCA9IHRoaXMuY29yZS5nZXRVUkwoKVxuXG4gICAgY29uc3QgYXhDb25mOiBBeGlvc1JlcXVlc3RDb25maWcgPSB7XG4gICAgICBiYXNlVVJMOiBiYXNlVVJMLFxuICAgICAgcmVzcG9uc2VUeXBlOiBcImpzb25cIixcbiAgICAgIC8vIHVzZSB0aGUgZmV0Y2ggYWRhcHRlciBpZiBmZXRjaCBpcyBhdmFpbGFibGUgZS5nLiBub24gTm9kZTwxNyBlbnZcbiAgICAgIGFkYXB0ZXI6IHR5cGVvZiBmZXRjaCAhPT0gXCJ1bmRlZmluZWRcIiA/IGZldGNoQWRhcHRlciA6IHVuZGVmaW5lZFxuICAgIH1cblxuICAgIGNvbnN0IHJlc3A6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNvcmUucG9zdChcbiAgICAgIGVwLFxuICAgICAge30sXG4gICAgICBKU09OLnN0cmluZ2lmeShycGMpLFxuICAgICAgaGVhZHJzLFxuICAgICAgYXhDb25mXG4gICAgKVxuICAgIGlmIChyZXNwLnN0YXR1cyA+PSAyMDAgJiYgcmVzcC5zdGF0dXMgPCAzMDApIHtcbiAgICAgIHRoaXMucnBjSUQgKz0gMVxuICAgICAgaWYgKHR5cGVvZiByZXNwLmRhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmVzcC5kYXRhID0gSlNPTi5wYXJzZShyZXNwLmRhdGEpXG4gICAgICB9XG4gICAgICBpZiAoXG4gICAgICAgIHR5cGVvZiByZXNwLmRhdGEgPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgKHJlc3AuZGF0YSA9PT0gbnVsbCB8fCBcImVycm9yXCIgaW4gcmVzcC5kYXRhKVxuICAgICAgKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihyZXNwLmRhdGEuZXJyb3IubWVzc2FnZSlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3BcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBycGNpZCwgYSBzdHJpY3RseS1pbmNyZWFzaW5nIG51bWJlciwgc3RhcnRpbmcgZnJvbSAxLCBpbmRpY2F0aW5nIHRoZSBuZXh0XG4gICAqIHJlcXVlc3QgSUQgdGhhdCB3aWxsIGJlIHNlbnQuXG4gICAqL1xuICBnZXRSUENJRCA9ICgpOiBudW1iZXIgPT4gdGhpcy5ycGNJRFxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gY29yZSBSZWZlcmVuY2UgdG8gdGhlIEF4aWEgaW5zdGFuY2UgdXNpbmcgdGhpcyBlbmRwb2ludFxuICAgKiBAcGFyYW0gYmFzZVVSTCBQYXRoIG9mIHRoZSBBUElzIGJhc2VVUkwgLSBleDogXCIvZXh0L2JjL2F2bVwiXG4gICAqIEBwYXJhbSBqcnBjVmVyc2lvbiBUaGUganJwYyB2ZXJzaW9uIHRvIHVzZSwgZGVmYXVsdCBcIjIuMFwiLlxuICAgKi9cbiAgY29uc3RydWN0b3IoY29yZTogQXhpYUNvcmUsIGJhc2VVUkw6IHN0cmluZywganJwY1ZlcnNpb246IHN0cmluZyA9IFwiMi4wXCIpIHtcbiAgICBzdXBlcihjb3JlLCBiYXNlVVJMKVxuICAgIHRoaXMuanJwY1ZlcnNpb24gPSBqcnBjVmVyc2lvblxuICAgIHRoaXMucnBjSUQgPSAxXG4gIH1cbn1cbiJdfQ==