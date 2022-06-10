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
exports.MetricsAPI = void 0;
const restapi_1 = require("../../common/restapi");
/**
 * Class for interacting with a node API that is using the node's MetricsApi.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[RESTAPI]] class. This class should not be directly called. Instead, use the [[Axia.addAPI]] function to register this interface with Axia.
 */
class MetricsAPI extends restapi_1.RESTAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Axia.addAPI]] method.
     *
     * @param core A reference to the Axia class
     * @param baseURL Defaults to the string "/ext/metrics" as the path to rpc's baseurl
     */
    constructor(core, baseURL = "/ext/metrics") {
        super(core, baseURL);
        this.axConf = () => {
            return {
                baseURL: `${this.core.getProtocol()}://${this.core.getHost()}:${this.core.getPort()}`,
                responseType: "text"
            };
        };
        /**
         *
         * @returns Promise for an object containing the metrics response
         */
        this.getMetrics = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.post("");
            return response.data;
        });
    }
}
exports.MetricsAPI = MetricsAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvbWV0cmljcy9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBS0Esa0RBQThDO0FBSTlDOzs7Ozs7R0FNRztBQUNILE1BQWEsVUFBVyxTQUFRLGlCQUFPO0lBaUJyQzs7Ozs7T0FLRztJQUNILFlBQVksSUFBYyxFQUFFLFVBQWtCLGNBQWM7UUFDMUQsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQTtRQXZCWixXQUFNLEdBQUcsR0FBdUIsRUFBRTtZQUMxQyxPQUFPO2dCQUNMLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFO2dCQUNyRixZQUFZLEVBQUUsTUFBTTthQUNyQixDQUFBO1FBQ0gsQ0FBQyxDQUFBO1FBRUQ7OztXQUdHO1FBQ0gsZUFBVSxHQUFHLEdBQTBCLEVBQUU7WUFDdkMsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUN6RCxPQUFPLFFBQVEsQ0FBQyxJQUFjLENBQUE7UUFDaEMsQ0FBQyxDQUFBLENBQUE7SUFVRCxDQUFDO0NBQ0Y7QUExQkQsZ0NBMEJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLU1ldHJpY3NcbiAqL1xuaW1wb3J0IEF4aWFDb3JlIGZyb20gXCIuLi8uLi9heGlhXCJcbmltcG9ydCB7IFJFU1RBUEkgfSBmcm9tIFwiLi4vLi4vY29tbW9uL3Jlc3RhcGlcIlxuaW1wb3J0IHsgUmVxdWVzdFJlc3BvbnNlRGF0YSB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpYmFzZVwiXG5pbXBvcnQgeyBBeGlvc1JlcXVlc3RDb25maWcgfSBmcm9tIFwiYXhpb3NcIlxuXG4vKipcbiAqIENsYXNzIGZvciBpbnRlcmFjdGluZyB3aXRoIGEgbm9kZSBBUEkgdGhhdCBpcyB1c2luZyB0aGUgbm9kZSdzIE1ldHJpY3NBcGkuXG4gKlxuICogQGNhdGVnb3J5IFJQQ0FQSXNcbiAqXG4gKiBAcmVtYXJrcyBUaGlzIGV4dGVuZHMgdGhlIFtbUkVTVEFQSV1dIGNsYXNzLiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgZGlyZWN0bHkgY2FsbGVkLiBJbnN0ZWFkLCB1c2UgdGhlIFtbQXhpYS5hZGRBUEldXSBmdW5jdGlvbiB0byByZWdpc3RlciB0aGlzIGludGVyZmFjZSB3aXRoIEF4aWEuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZXRyaWNzQVBJIGV4dGVuZHMgUkVTVEFQSSB7XG4gIHByb3RlY3RlZCBheENvbmYgPSAoKTogQXhpb3NSZXF1ZXN0Q29uZmlnID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgYmFzZVVSTDogYCR7dGhpcy5jb3JlLmdldFByb3RvY29sKCl9Oi8vJHt0aGlzLmNvcmUuZ2V0SG9zdCgpfToke3RoaXMuY29yZS5nZXRQb3J0KCl9YCxcbiAgICAgIHJlc3BvbnNlVHlwZTogXCJ0ZXh0XCJcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIG1ldHJpY3MgcmVzcG9uc2VcbiAgICovXG4gIGdldE1ldHJpY3MgPSBhc3luYyAoKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMucG9zdChcIlwiKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhIGFzIHN0cmluZ1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBpbnN0YW50aWF0ZWQgZGlyZWN0bHkuIEluc3RlYWQgdXNlIHRoZSBbW0F4aWEuYWRkQVBJXV0gbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gY29yZSBBIHJlZmVyZW5jZSB0byB0aGUgQXhpYSBjbGFzc1xuICAgKiBAcGFyYW0gYmFzZVVSTCBEZWZhdWx0cyB0byB0aGUgc3RyaW5nIFwiL2V4dC9tZXRyaWNzXCIgYXMgdGhlIHBhdGggdG8gcnBjJ3MgYmFzZXVybFxuICAgKi9cbiAgY29uc3RydWN0b3IoY29yZTogQXhpYUNvcmUsIGJhc2VVUkw6IHN0cmluZyA9IFwiL2V4dC9tZXRyaWNzXCIpIHtcbiAgICBzdXBlcihjb3JlLCBiYXNlVVJMKVxuICB9XG59XG4iXX0=