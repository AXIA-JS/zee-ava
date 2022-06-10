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
exports.HealthAPI = void 0;
const jrpcapi_1 = require("../../common/jrpcapi");
/**
 * Class for interacting with a node API that is using the node's HealthApi.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Axia.addAPI]] function to register this interface with Axia.
 */
class HealthAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Axia.addAPI]] method.
     *
     * @param core A reference to the Axia class
     * @param baseURL Defaults to the string "/ext/health" as the path to rpc's baseURL
     */
    constructor(core, baseURL = "/ext/health") {
        super(core, baseURL);
        /**
         *
         * @returns Promise for a [[HealthResponse]]
         */
        this.health = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("health.health");
            return response.data.result;
        });
    }
}
exports.HealthAPI = HealthAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvaGVhbHRoL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFLQSxrREFBOEM7QUFJOUM7Ozs7OztHQU1HO0FBQ0gsTUFBYSxTQUFVLFNBQVEsaUJBQU87SUFVcEM7Ozs7O09BS0c7SUFDSCxZQUFZLElBQWMsRUFBRSxVQUFrQixhQUFhO1FBQ3pELEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFoQnRCOzs7V0FHRztRQUNILFdBQU0sR0FBRyxHQUFrQyxFQUFFO1lBQzNDLE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLENBQUE7WUFDNUUsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUM3QixDQUFDLENBQUEsQ0FBQTtJQVVELENBQUM7Q0FDRjtBQW5CRCw4QkFtQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktSGVhbHRoXG4gKi9cbmltcG9ydCBBeGlhQ29yZSBmcm9tIFwiLi4vLi4vYXhpYVwiXG5pbXBvcnQgeyBKUlBDQVBJIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9qcnBjYXBpXCJcbmltcG9ydCB7IFJlcXVlc3RSZXNwb25zZURhdGEgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaWJhc2VcIlxuaW1wb3J0IHsgSGVhbHRoUmVzcG9uc2UgfSBmcm9tIFwiLi9pbnRlcmZhY2VzXCJcblxuLyoqXG4gKiBDbGFzcyBmb3IgaW50ZXJhY3Rpbmcgd2l0aCBhIG5vZGUgQVBJIHRoYXQgaXMgdXNpbmcgdGhlIG5vZGUncyBIZWFsdGhBcGkuXG4gKlxuICogQGNhdGVnb3J5IFJQQ0FQSXNcbiAqXG4gKiBAcmVtYXJrcyBUaGlzIGV4dGVuZHMgdGhlIFtbSlJQQ0FQSV1dIGNsYXNzLiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgZGlyZWN0bHkgY2FsbGVkLiBJbnN0ZWFkLCB1c2UgdGhlIFtbQXhpYS5hZGRBUEldXSBmdW5jdGlvbiB0byByZWdpc3RlciB0aGlzIGludGVyZmFjZSB3aXRoIEF4aWEuXG4gKi9cbmV4cG9ydCBjbGFzcyBIZWFsdGhBUEkgZXh0ZW5kcyBKUlBDQVBJIHtcbiAgLyoqXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgW1tIZWFsdGhSZXNwb25zZV1dXG4gICAqL1xuICBoZWFsdGggPSBhc3luYyAoKTogUHJvbWlzZTxIZWFsdGhSZXNwb25zZT4gPT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFwiaGVhbHRoLmhlYWx0aFwiKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBpbnN0YW50aWF0ZWQgZGlyZWN0bHkuIEluc3RlYWQgdXNlIHRoZSBbW0F4aWEuYWRkQVBJXV0gbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gY29yZSBBIHJlZmVyZW5jZSB0byB0aGUgQXhpYSBjbGFzc1xuICAgKiBAcGFyYW0gYmFzZVVSTCBEZWZhdWx0cyB0byB0aGUgc3RyaW5nIFwiL2V4dC9oZWFsdGhcIiBhcyB0aGUgcGF0aCB0byBycGMncyBiYXNlVVJMXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb3JlOiBBeGlhQ29yZSwgYmFzZVVSTDogc3RyaW5nID0gXCIvZXh0L2hlYWx0aFwiKSB7XG4gICAgc3VwZXIoY29yZSwgYmFzZVVSTClcbiAgfVxufVxuIl19