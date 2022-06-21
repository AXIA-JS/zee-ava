"use strict";
/**
 * @packageDocumentation
 * @module Common-APIBase
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIBase = exports.RequestResponseData = void 0;
const db_1 = __importDefault(require("../utils/db"));
/**
 * Response data for HTTP requests.
 */
class RequestResponseData {
    constructor(data, headers, status, statusText, request) {
        this.data = data;
        this.headers = headers;
        this.status = status;
        this.statusText = statusText;
        this.request = request;
    }
}
exports.RequestResponseData = RequestResponseData;
/**
 * Abstract class defining a generic endpoint that all endpoints must implement (extend).
 */
class APIBase {
    /**
     *
     * @param core Reference to the Axia instance using this baseURL
     * @param baseURL Path to the baseURL
     */
    constructor(core, baseURL) {
        /**
         * Sets the path of the APIs baseURL.
         *
         * @param baseURL Path of the APIs baseURL - ex: "/ext/bc/Swap"
         */
        this.setBaseURL = (baseURL) => {
            if (this.db && this.baseURL !== baseURL) {
                const backup = this.db.getAll();
                this.db.clearAll();
                this.baseURL = baseURL;
                this.db = db_1.default.getNamespace(baseURL);
                this.db.setAll(backup, true);
            }
            else {
                this.baseURL = baseURL;
                this.db = db_1.default.getNamespace(baseURL);
            }
        };
        /**
         * Returns the baseURL's path.
         */
        this.getBaseURL = () => this.baseURL;
        /**
         * Returns the baseURL's database.
         */
        this.getDB = () => this.db;
        this.core = core;
        this.setBaseURL(baseURL);
    }
}
exports.APIBase = APIBase;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tb24vYXBpYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7QUFJSCxxREFBNEI7QUFHNUI7O0dBRUc7QUFDSCxNQUFhLG1CQUFtQjtJQUM5QixZQUNTLElBQVMsRUFDVCxPQUFZLEVBQ1osTUFBYyxFQUNkLFVBQWtCLEVBQ2xCLE9BQXVDO1FBSnZDLFNBQUksR0FBSixJQUFJLENBQUs7UUFDVCxZQUFPLEdBQVAsT0FBTyxDQUFLO1FBQ1osV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQUNkLGVBQVUsR0FBVixVQUFVLENBQVE7UUFDbEIsWUFBTyxHQUFQLE9BQU8sQ0FBZ0M7SUFDN0MsQ0FBQztDQUNMO0FBUkQsa0RBUUM7QUFFRDs7R0FFRztBQUNILE1BQXNCLE9BQU87SUFpQzNCOzs7O09BSUc7SUFDSCxZQUFZLElBQWMsRUFBRSxPQUFlO1FBakMzQzs7OztXQUlHO1FBQ0gsZUFBVSxHQUFHLENBQUMsT0FBZSxFQUFFLEVBQUU7WUFDL0IsSUFBSSxJQUFJLENBQUMsRUFBRSxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssT0FBTyxFQUFFO2dCQUN2QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFBO2dCQUMvQixJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFBO2dCQUNsQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtnQkFDdEIsSUFBSSxDQUFDLEVBQUUsR0FBRyxZQUFFLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFBO2dCQUNsQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUE7YUFDN0I7aUJBQU07Z0JBQ0wsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7Z0JBQ3RCLElBQUksQ0FBQyxFQUFFLEdBQUcsWUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQTthQUNuQztRQUNILENBQUMsQ0FBQTtRQUVEOztXQUVHO1FBQ0gsZUFBVSxHQUFHLEdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUE7UUFFdkM7O1dBRUc7UUFDSCxVQUFLLEdBQUcsR0FBYSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQTtRQVE3QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtRQUNoQixJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQzFCLENBQUM7Q0FDRjtBQTFDRCwwQkEwQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBDb21tb24tQVBJQmFzZVxuICovXG5cbmltcG9ydCB7IFN0b3JlQVBJIH0gZnJvbSBcInN0b3JlMlwiXG5pbXBvcnQgeyBDbGllbnRSZXF1ZXN0IH0gZnJvbSBcImh0dHBcIlxuaW1wb3J0IERCIGZyb20gXCIuLi91dGlscy9kYlwiXG5pbXBvcnQgQXhpYUNvcmUgZnJvbSBcIi4uL2F4aWFcIlxuXG4vKipcbiAqIFJlc3BvbnNlIGRhdGEgZm9yIEhUVFAgcmVxdWVzdHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBSZXF1ZXN0UmVzcG9uc2VEYXRhIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIGRhdGE6IGFueSxcbiAgICBwdWJsaWMgaGVhZGVyczogYW55LFxuICAgIHB1YmxpYyBzdGF0dXM6IG51bWJlcixcbiAgICBwdWJsaWMgc3RhdHVzVGV4dDogc3RyaW5nLFxuICAgIHB1YmxpYyByZXF1ZXN0OiBDbGllbnRSZXF1ZXN0IHwgWE1MSHR0cFJlcXVlc3RcbiAgKSB7fVxufVxuXG4vKipcbiAqIEFic3RyYWN0IGNsYXNzIGRlZmluaW5nIGEgZ2VuZXJpYyBlbmRwb2ludCB0aGF0IGFsbCBlbmRwb2ludHMgbXVzdCBpbXBsZW1lbnQgKGV4dGVuZCkuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBBUElCYXNlIHtcbiAgcHJvdGVjdGVkIGNvcmU6IEF4aWFDb3JlXG4gIHByb3RlY3RlZCBiYXNlVVJMOiBzdHJpbmdcbiAgcHJvdGVjdGVkIGRiOiBTdG9yZUFQSVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBwYXRoIG9mIHRoZSBBUElzIGJhc2VVUkwuXG4gICAqXG4gICAqIEBwYXJhbSBiYXNlVVJMIFBhdGggb2YgdGhlIEFQSXMgYmFzZVVSTCAtIGV4OiBcIi9leHQvYmMvU3dhcFwiXG4gICAqL1xuICBzZXRCYXNlVVJMID0gKGJhc2VVUkw6IHN0cmluZykgPT4ge1xuICAgIGlmICh0aGlzLmRiICYmIHRoaXMuYmFzZVVSTCAhPT0gYmFzZVVSTCkge1xuICAgICAgY29uc3QgYmFja3VwID0gdGhpcy5kYi5nZXRBbGwoKVxuICAgICAgdGhpcy5kYi5jbGVhckFsbCgpXG4gICAgICB0aGlzLmJhc2VVUkwgPSBiYXNlVVJMXG4gICAgICB0aGlzLmRiID0gREIuZ2V0TmFtZXNwYWNlKGJhc2VVUkwpXG4gICAgICB0aGlzLmRiLnNldEFsbChiYWNrdXAsIHRydWUpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYmFzZVVSTCA9IGJhc2VVUkxcbiAgICAgIHRoaXMuZGIgPSBEQi5nZXROYW1lc3BhY2UoYmFzZVVSTClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYmFzZVVSTCdzIHBhdGguXG4gICAqL1xuICBnZXRCYXNlVVJMID0gKCk6IHN0cmluZyA9PiB0aGlzLmJhc2VVUkxcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYmFzZVVSTCdzIGRhdGFiYXNlLlxuICAgKi9cbiAgZ2V0REIgPSAoKTogU3RvcmVBUEkgPT4gdGhpcy5kYlxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0gY29yZSBSZWZlcmVuY2UgdG8gdGhlIEF4aWEgaW5zdGFuY2UgdXNpbmcgdGhpcyBiYXNlVVJMXG4gICAqIEBwYXJhbSBiYXNlVVJMIFBhdGggdG8gdGhlIGJhc2VVUkxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvcmU6IEF4aWFDb3JlLCBiYXNlVVJMOiBzdHJpbmcpIHtcbiAgICB0aGlzLmNvcmUgPSBjb3JlXG4gICAgdGhpcy5zZXRCYXNlVVJMKGJhc2VVUkwpXG4gIH1cbn1cbiJdfQ==