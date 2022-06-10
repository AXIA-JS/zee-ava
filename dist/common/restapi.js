"use strict";
/**
 * @packageDocumentation
 * @module Common-RESTAPI
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
exports.RESTAPI = void 0;
const apibase_1 = require("./apibase");
class RESTAPI extends apibase_1.APIBase {
    /**
     *
     * @param core Reference to the Axia instance using this endpoint
     * @param baseURL Path of the APIs baseURL - ex: "/ext/bc/avm"
     * @param contentType Optional Determines the type of the entity attached to the
     * incoming request
     * @param acceptType Optional Determines the type of representation which is
     * desired on the client side
     */
    constructor(core, baseURL, contentType = "application/json;charset=UTF-8", acceptType = undefined) {
        super(core, baseURL);
        this.prepHeaders = (contentType, acceptType) => {
            const headers = {};
            if (contentType !== undefined) {
                headers["Content-Type"] = contentType;
            }
            else {
                headers["Content-Type"] = this.contentType;
            }
            if (acceptType !== undefined) {
                headers["Accept"] = acceptType;
            }
            else if (this.acceptType !== undefined) {
                headers["Accept"] = this.acceptType;
            }
            return headers;
        };
        this.axConf = () => {
            return {
                baseURL: this.core.getURL(),
                responseType: "json"
            };
        };
        this.get = (baseURL, contentType, acceptType) => __awaiter(this, void 0, void 0, function* () {
            const ep = baseURL || this.baseURL;
            const headers = this.prepHeaders(contentType, acceptType);
            const resp = yield this.core.get(ep, {}, headers, this.axConf());
            return resp;
        });
        this.post = (method, params, baseURL, contentType, acceptType) => __awaiter(this, void 0, void 0, function* () {
            const ep = baseURL || this.baseURL;
            const rpc = {};
            rpc.method = method;
            // Set parameters if exists
            if (params) {
                rpc.params = params;
            }
            const headers = this.prepHeaders(contentType, acceptType);
            const resp = yield this.core.post(ep, {}, JSON.stringify(rpc), headers, this.axConf());
            return resp;
        });
        this.put = (method, params, baseURL, contentType, acceptType) => __awaiter(this, void 0, void 0, function* () {
            const ep = baseURL || this.baseURL;
            const rpc = {};
            rpc.method = method;
            // Set parameters if exists
            if (params) {
                rpc.params = params;
            }
            const headers = this.prepHeaders(contentType, acceptType);
            const resp = yield this.core.put(ep, {}, JSON.stringify(rpc), headers, this.axConf());
            return resp;
        });
        this.delete = (method, params, baseURL, contentType, acceptType) => __awaiter(this, void 0, void 0, function* () {
            const ep = baseURL || this.baseURL;
            const rpc = {};
            rpc.method = method;
            // Set parameters if exists
            if (params) {
                rpc.params = params;
            }
            const headers = this.prepHeaders(contentType, acceptType);
            const resp = yield this.core.delete(ep, {}, headers, this.axConf());
            return resp;
        });
        this.patch = (method, params, baseURL, contentType, acceptType) => __awaiter(this, void 0, void 0, function* () {
            const ep = baseURL || this.baseURL;
            const rpc = {};
            rpc.method = method;
            // Set parameters if exists
            if (params) {
                rpc.params = params;
            }
            const headers = this.prepHeaders(contentType, acceptType);
            const resp = yield this.core.patch(ep, {}, JSON.stringify(rpc), headers, this.axConf());
            return resp;
        });
        /**
         * Returns the type of the entity attached to the incoming request
         */
        this.getContentType = () => this.contentType;
        /**
         * Returns what type of representation is desired at the client side
         */
        this.getAcceptType = () => this.acceptType;
        this.contentType = contentType;
        this.acceptType = acceptType;
    }
}
exports.RESTAPI = RESTAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdGFwaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tb24vcmVzdGFwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7QUFJSCx1Q0FBd0Q7QUFFeEQsTUFBYSxPQUFRLFNBQVEsaUJBQU87SUFtS2xDOzs7Ozs7OztPQVFHO0lBQ0gsWUFDRSxJQUFjLEVBQ2QsT0FBZSxFQUNmLGNBQXNCLGdDQUFnQyxFQUN0RCxhQUFxQixTQUFTO1FBRTlCLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7UUE5S1osZ0JBQVcsR0FBRyxDQUN0QixXQUFvQixFQUNwQixVQUFtQixFQUNYLEVBQUU7WUFDVixNQUFNLE9BQU8sR0FBVyxFQUFFLENBQUE7WUFDMUIsSUFBSSxXQUFXLEtBQUssU0FBUyxFQUFFO2dCQUM3QixPQUFPLENBQUMsY0FBYyxDQUFDLEdBQUcsV0FBVyxDQUFBO2FBQ3RDO2lCQUFNO2dCQUNMLE9BQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFBO2FBQzNDO1lBRUQsSUFBSSxVQUFVLEtBQUssU0FBUyxFQUFFO2dCQUM1QixPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsVUFBVSxDQUFBO2FBQy9CO2lCQUFNLElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUU7Z0JBQ3hDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFBO2FBQ3BDO1lBQ0QsT0FBTyxPQUFPLENBQUE7UUFDaEIsQ0FBQyxDQUFBO1FBRVMsV0FBTSxHQUFHLEdBQXVCLEVBQUU7WUFDMUMsT0FBTztnQkFDTCxPQUFPLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQzNCLFlBQVksRUFBRSxNQUFNO2FBQ3JCLENBQUE7UUFDSCxDQUFDLENBQUE7UUFFRCxRQUFHLEdBQUcsQ0FDSixPQUFnQixFQUNoQixX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bi1SRVNUQVBJXG4gKi9cblxuaW1wb3J0IHsgQXhpb3NSZXF1ZXN0Q29uZmlnIH0gZnJvbSBcImF4aW9zXCJcbmltcG9ydCBBeGlhQ29yZSBmcm9tIFwiLi4vYXhpYVwiXG5pbXBvcnQgeyBBUElCYXNlLCBSZXF1ZXN0UmVzcG9uc2VEYXRhIH0gZnJvbSBcIi4vYXBpYmFzZVwiXG5cbmV4cG9ydCBjbGFzcyBSRVNUQVBJIGV4dGVuZHMgQVBJQmFzZSB7XG4gIHByb3RlY3RlZCBjb250ZW50VHlwZTogc3RyaW5nXG4gIHByb3RlY3RlZCBhY2NlcHRUeXBlOiBzdHJpbmdcblxuICBwcm90ZWN0ZWQgcHJlcEhlYWRlcnMgPSAoXG4gICAgY29udGVudFR5cGU/OiBzdHJpbmcsXG4gICAgYWNjZXB0VHlwZT86IHN0cmluZ1xuICApOiBvYmplY3QgPT4ge1xuICAgIGNvbnN0IGhlYWRlcnM6IG9iamVjdCA9IHt9XG4gICAgaWYgKGNvbnRlbnRUeXBlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGhlYWRlcnNbXCJDb250ZW50LVR5cGVcIl0gPSBjb250ZW50VHlwZVxuICAgIH0gZWxzZSB7XG4gICAgICBoZWFkZXJzW1wiQ29udGVudC1UeXBlXCJdID0gdGhpcy5jb250ZW50VHlwZVxuICAgIH1cblxuICAgIGlmIChhY2NlcHRUeXBlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGhlYWRlcnNbXCJBY2NlcHRcIl0gPSBhY2NlcHRUeXBlXG4gICAgfSBlbHNlIGlmICh0aGlzLmFjY2VwdFR5cGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaGVhZGVyc1tcIkFjY2VwdFwiXSA9IHRoaXMuYWNjZXB0VHlwZVxuICAgIH1cbiAgICByZXR1cm4gaGVhZGVyc1xuICB9XG5cbiAgcHJvdGVjdGVkIGF4Q29uZiA9ICgpOiBBeGlvc1JlcXVlc3RDb25maWcgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBiYXNlVVJMOiB0aGlzLmNvcmUuZ2V0VVJMKCksXG4gICAgICByZXNwb25zZVR5cGU6IFwianNvblwiXG4gICAgfVxuICB9XG5cbiAgZ2V0ID0gYXN5bmMgKFxuICAgIGJhc2VVUkw/OiBzdHJpbmcsXG4gICAgY29udGVudFR5cGU/OiBzdHJpbmcsXG4gICAgYWNjZXB0VHlwZT86IHN0cmluZ1xuICApOiBQcm9taXNlPFJlcXVlc3RSZXNwb25zZURhdGE+ID0+IHtcbiAgICBjb25zdCBlcDogc3RyaW5nID0gYmFzZVVSTCB8fCB0aGlzLmJhc2VVUkxcbiAgICBjb25zdCBoZWFkZXJzOiBvYmplY3QgPSB0aGlzLnByZXBIZWFkZXJzKGNvbnRlbnRUeXBlLCBhY2NlcHRUeXBlKVxuICAgIGNvbnN0IHJlc3A6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNvcmUuZ2V0KFxuICAgICAgZXAsXG4gICAgICB7fSxcbiAgICAgIGhlYWRlcnMsXG4gICAgICB0aGlzLmF4Q29uZigpXG4gICAgKVxuICAgIHJldHVybiByZXNwXG4gIH1cblxuICBwb3N0ID0gYXN5bmMgKFxuICAgIG1ldGhvZDogc3RyaW5nLFxuICAgIHBhcmFtcz86IG9iamVjdFtdIHwgb2JqZWN0LFxuICAgIGJhc2VVUkw/OiBzdHJpbmcsXG4gICAgY29udGVudFR5cGU/OiBzdHJpbmcsXG4gICAgYWNjZXB0VHlwZT86IHN0cmluZ1xuICApOiBQcm9taXNlPFJlcXVlc3RSZXNwb25zZURhdGE+ID0+IHtcbiAgICBjb25zdCBlcDogc3RyaW5nID0gYmFzZVVSTCB8fCB0aGlzLmJhc2VVUkxcbiAgICBjb25zdCBycGM6IGFueSA9IHt9XG4gICAgcnBjLm1ldGhvZCA9IG1ldGhvZFxuXG4gICAgLy8gU2V0IHBhcmFtZXRlcnMgaWYgZXhpc3RzXG4gICAgaWYgKHBhcmFtcykge1xuICAgICAgcnBjLnBhcmFtcyA9IHBhcmFtc1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRlcnM6IG9iamVjdCA9IHRoaXMucHJlcEhlYWRlcnMoY29udGVudFR5cGUsIGFjY2VwdFR5cGUpXG4gICAgY29uc3QgcmVzcDogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY29yZS5wb3N0KFxuICAgICAgZXAsXG4gICAgICB7fSxcbiAgICAgIEpTT04uc3RyaW5naWZ5KHJwYyksXG4gICAgICBoZWFkZXJzLFxuICAgICAgdGhpcy5heENvbmYoKVxuICAgIClcbiAgICByZXR1cm4gcmVzcFxuICB9XG5cbiAgcHV0ID0gYXN5bmMgKFxuICAgIG1ldGhvZDogc3RyaW5nLFxuICAgIHBhcmFtcz86IG9iamVjdFtdIHwgb2JqZWN0LFxuICAgIGJhc2VVUkw/OiBzdHJpbmcsXG4gICAgY29udGVudFR5cGU/OiBzdHJpbmcsXG4gICAgYWNjZXB0VHlwZT86IHN0cmluZ1xuICApOiBQcm9taXNlPFJlcXVlc3RSZXNwb25zZURhdGE+ID0+IHtcbiAgICBjb25zdCBlcDogc3RyaW5nID0gYmFzZVVSTCB8fCB0aGlzLmJhc2VVUkxcbiAgICBjb25zdCBycGM6IGFueSA9IHt9XG4gICAgcnBjLm1ldGhvZCA9IG1ldGhvZFxuXG4gICAgLy8gU2V0IHBhcmFtZXRlcnMgaWYgZXhpc3RzXG4gICAgaWYgKHBhcmFtcykge1xuICAgICAgcnBjLnBhcmFtcyA9IHBhcmFtc1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRlcnM6IG9iamVjdCA9IHRoaXMucHJlcEhlYWRlcnMoY29udGVudFR5cGUsIGFjY2VwdFR5cGUpXG4gICAgY29uc3QgcmVzcDogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY29yZS5wdXQoXG4gICAgICBlcCxcbiAgICAgIHt9LFxuICAgICAgSlNPTi5zdHJpbmdpZnkocnBjKSxcbiAgICAgIGhlYWRlcnMsXG4gICAgICB0aGlzLmF4Q29uZigpXG4gICAgKVxuICAgIHJldHVybiByZXNwXG4gIH1cblxuICBkZWxldGUgPSBhc3luYyAoXG4gICAgbWV0aG9kOiBzdHJpbmcsXG4gICAgcGFyYW1zPzogb2JqZWN0W10gfCBvYmplY3QsXG4gICAgYmFzZVVSTD86IHN0cmluZyxcbiAgICBjb250ZW50VHlwZT86IHN0cmluZyxcbiAgICBhY2NlcHRUeXBlPzogc3RyaW5nXG4gICk6IFByb21pc2U8UmVxdWVzdFJlc3BvbnNlRGF0YT4gPT4ge1xuICAgIGNvbnN0IGVwOiBzdHJpbmcgPSBiYXNlVVJMIHx8IHRoaXMuYmFzZVVSTFxuICAgIGNvbnN0IHJwYzogYW55ID0ge31cbiAgICBycGMubWV0aG9kID0gbWV0aG9kXG5cbiAgICAvLyBTZXQgcGFyYW1ldGVycyBpZiBleGlzdHNcbiAgICBpZiAocGFyYW1zKSB7XG4gICAgICBycGMucGFyYW1zID0gcGFyYW1zXG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGVyczogb2JqZWN0ID0gdGhpcy5wcmVwSGVhZGVycyhjb250ZW50VHlwZSwgYWNjZXB0VHlwZSlcbiAgICBjb25zdCByZXNwOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jb3JlLmRlbGV0ZShcbiAgICAgIGVwLFxuICAgICAge30sXG4gICAgICBoZWFkZXJzLFxuICAgICAgdGhpcy5heENvbmYoKVxuICAgIClcbiAgICByZXR1cm4gcmVzcFxuICB9XG5cbiAgcGF0Y2ggPSBhc3luYyAoXG4gICAgbWV0aG9kOiBzdHJpbmcsXG4gICAgcGFyYW1zPzogb2JqZWN0W10gfCBvYmplY3QsXG4gICAgYmFzZVVSTD86IHN0cmluZyxcbiAgICBjb250ZW50VHlwZT86IHN0cmluZyxcbiAgICBhY2NlcHRUeXBlPzogc3RyaW5nXG4gICk6IFByb21pc2U8UmVxdWVzdFJlc3BvbnNlRGF0YT4gPT4ge1xuICAgIGNvbnN0IGVwOiBzdHJpbmcgPSBiYXNlVVJMIHx8IHRoaXMuYmFzZVVSTFxuICAgIGNvbnN0IHJwYzogYW55ID0ge31cbiAgICBycGMubWV0aG9kID0gbWV0aG9kXG5cbiAgICAvLyBTZXQgcGFyYW1ldGVycyBpZiBleGlzdHNcbiAgICBpZiAocGFyYW1zKSB7XG4gICAgICBycGMucGFyYW1zID0gcGFyYW1zXG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGVyczogb2JqZWN0ID0gdGhpcy5wcmVwSGVhZGVycyhjb250ZW50VHlwZSwgYWNjZXB0VHlwZSlcbiAgICBjb25zdCByZXNwOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jb3JlLnBhdGNoKFxuICAgICAgZXAsXG4gICAgICB7fSxcbiAgICAgIEpTT04uc3RyaW5naWZ5KHJwYyksXG4gICAgICBoZWFkZXJzLFxuICAgICAgdGhpcy5heENvbmYoKVxuICAgIClcbiAgICByZXR1cm4gcmVzcFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHR5cGUgb2YgdGhlIGVudGl0eSBhdHRhY2hlZCB0byB0aGUgaW5jb21pbmcgcmVxdWVzdFxuICAgKi9cbiAgZ2V0Q29udGVudFR5cGUgPSAoKTogc3RyaW5nID0+IHRoaXMuY29udGVudFR5cGVcblxuICAvKipcbiAgICogUmV0dXJucyB3aGF0IHR5cGUgb2YgcmVwcmVzZW50YXRpb24gaXMgZGVzaXJlZCBhdCB0aGUgY2xpZW50IHNpZGVcbiAgICovXG4gIGdldEFjY2VwdFR5cGUgPSAoKTogc3RyaW5nID0+IHRoaXMuYWNjZXB0VHlwZVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gY29yZSBSZWZlcmVuY2UgdG8gdGhlIEF4aWEgaW5zdGFuY2UgdXNpbmcgdGhpcyBlbmRwb2ludFxuICAgKiBAcGFyYW0gYmFzZVVSTCBQYXRoIG9mIHRoZSBBUElzIGJhc2VVUkwgLSBleDogXCIvZXh0L2JjL2F2bVwiXG4gICAqIEBwYXJhbSBjb250ZW50VHlwZSBPcHRpb25hbCBEZXRlcm1pbmVzIHRoZSB0eXBlIG9mIHRoZSBlbnRpdHkgYXR0YWNoZWQgdG8gdGhlXG4gICAqIGluY29taW5nIHJlcXVlc3RcbiAgICogQHBhcmFtIGFjY2VwdFR5cGUgT3B0aW9uYWwgRGV0ZXJtaW5lcyB0aGUgdHlwZSBvZiByZXByZXNlbnRhdGlvbiB3aGljaCBpc1xuICAgKiBkZXNpcmVkIG9uIHRoZSBjbGllbnQgc2lkZVxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgY29yZTogQXhpYUNvcmUsXG4gICAgYmFzZVVSTDogc3RyaW5nLFxuICAgIGNvbnRlbnRUeXBlOiBzdHJpbmcgPSBcImFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD1VVEYtOFwiLFxuICAgIGFjY2VwdFR5cGU6IHN0cmluZyA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcihjb3JlLCBiYXNlVVJMKVxuICAgIHRoaXMuY29udGVudFR5cGUgPSBjb250ZW50VHlwZVxuICAgIHRoaXMuYWNjZXB0VHlwZSA9IGFjY2VwdFR5cGVcbiAgfVxufVxuIl19