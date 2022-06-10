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
/**
 * @packageDocumentation
 * @module AxiaCore
 */
const axios_1 = __importDefault(require("axios"));
const apibase_1 = require("./common/apibase");
const errors_1 = require("./utils/errors");
const fetchadapter_1 = require("./utils/fetchadapter");
const helperfunctions_1 = require("./utils/helperfunctions");
/**
 * AxiaCore is middleware for interacting with Axia node RPC APIs.
 *
 * Example usage:
 * ```js
 * let axia = new AxiaCore("127.0.0.1", 9650, "https")
 * ```
 *
 *
 */
class AxiaCore {
    /**
     * Creates a new Axia instance. Sets the address and port of the main Axia Client.
     *
     * @param host The hostname to resolve to reach the Axia Client APIs
     * @param port The port to resolve to reach the Axia Client APIs
     * @param protocol The protocol string to use before a "://" in a request, ex: "http", "https", "git", "ws", etc ...
     */
    constructor(host, port, protocol = "http") {
        this.networkID = 0;
        this.hrp = "";
        this.auth = undefined;
        this.headers = {};
        this.requestConfig = {};
        this.apis = {};
        /**
         * Sets the address and port of the main Axia Client.
         *
         * @param host The hostname to resolve to reach the Axia Client RPC APIs.
         * @param port The port to resolve to reach the Axia Client RPC APIs.
         * @param protocol The protocol string to use before a "://" in a request,
         * ex: "http", "https", etc. Defaults to http
         * @param baseEndpoint the base endpoint to reach the Axia Client RPC APIs,
         * ex: "/rpc". Defaults to "/"
         * The following special characters are removed from host and protocol
         * &#,@+()$~%'":*?{} also less than and greater than signs
         */
        this.setAddress = (host, port, protocol = "http", baseEndpoint = "") => {
            host = host.replace(/[&#,@+()$~%'":*?<>{}]/g, "");
            protocol = protocol.replace(/[&#,@+()$~%'":*?<>{}]/g, "");
            const protocols = ["http", "https"];
            if (!protocols.includes(protocol)) {
                /* istanbul ignore next */
                throw new errors_1.ProtocolError("Error - AxiaCore.setAddress: Invalid protocol");
            }
            this.host = host;
            this.port = port;
            this.protocol = protocol;
            this.baseEndpoint = baseEndpoint;
            let url = `${protocol}://${host}`;
            if (port != undefined && typeof port === "number" && port >= 0) {
                url = `${url}:${port}`;
            }
            if (baseEndpoint != undefined &&
                typeof baseEndpoint == "string" &&
                baseEndpoint.length > 0) {
                if (baseEndpoint[0] != "/") {
                    baseEndpoint = `/${baseEndpoint}`;
                }
                url = `${url}${baseEndpoint}`;
            }
            this.url = url;
        };
        /**
         * Returns the protocol such as "http", "https", "git", "ws", etc.
         */
        this.getProtocol = () => this.protocol;
        /**
         * Returns the host for the Axia node.
         */
        this.getHost = () => this.host;
        /**
         * Returns the IP for the Axia node.
         */
        this.getIP = () => this.host;
        /**
         * Returns the port for the Axia node.
         */
        this.getPort = () => this.port;
        /**
         * Returns the base endpoint for the Axia node.
         */
        this.getBaseEndpoint = () => this.baseEndpoint;
        /**
         * Returns the URL of the Axia node (ip + port)
         */
        this.getURL = () => this.url;
        /**
         * Returns the custom headers
         */
        this.getHeaders = () => this.headers;
        /**
         * Returns the custom request config
         */
        this.getRequestConfig = () => this.requestConfig;
        /**
         * Returns the networkID
         */
        this.getNetworkID = () => this.networkID;
        /**
         * Sets the networkID
         */
        this.setNetworkID = (netID) => {
            this.networkID = netID;
            this.hrp = (0, helperfunctions_1.getPreferredHRP)(this.networkID);
        };
        /**
         * Returns the Human-Readable-Part of the network associated with this key.
         *
         * @returns The [[KeyPair]]'s Human-Readable-Part of the network's Bech32 addressing scheme
         */
        this.getHRP = () => this.hrp;
        /**
         * Sets the the Human-Readable-Part of the network associated with this key.
         *
         * @param hrp String for the Human-Readable-Part of Bech32 addresses
         */
        this.setHRP = (hrp) => {
            this.hrp = hrp;
        };
        /**
         * Adds a new custom header to be included with all requests.
         *
         * @param key Header name
         * @param value Header value
         */
        this.setHeader = (key, value) => {
            this.headers[`${key}`] = value;
        };
        /**
         * Removes a previously added custom header.
         *
         * @param key Header name
         */
        this.removeHeader = (key) => {
            delete this.headers[`${key}`];
        };
        /**
         * Removes all headers.
         */
        this.removeAllHeaders = () => {
            for (const prop in this.headers) {
                if (Object.prototype.hasOwnProperty.call(this.headers, prop)) {
                    delete this.headers[`${prop}`];
                }
            }
        };
        /**
         * Adds a new custom config value to be included with all requests.
         *
         * @param key Config name
         * @param value Config value
         */
        this.setRequestConfig = (key, value) => {
            this.requestConfig[`${key}`] = value;
        };
        /**
         * Removes a previously added request config.
         *
         * @param key Header name
         */
        this.removeRequestConfig = (key) => {
            delete this.requestConfig[`${key}`];
        };
        /**
         * Removes all request configs.
         */
        this.removeAllRequestConfigs = () => {
            for (const prop in this.requestConfig) {
                if (Object.prototype.hasOwnProperty.call(this.requestConfig, prop)) {
                    delete this.requestConfig[`${prop}`];
                }
            }
        };
        /**
         * Sets the temporary auth token used for communicating with the node.
         *
         * @param auth A temporary token provided by the node enabling access to the endpoints on the node.
         */
        this.setAuthToken = (auth) => {
            this.auth = auth;
        };
        this._setHeaders = (headers) => {
            if (typeof this.headers === "object") {
                for (const [key, value] of Object.entries(this.headers)) {
                    headers[`${key}`] = value;
                }
            }
            if (typeof this.auth === "string") {
                headers.Authorization = `Bearer ${this.auth}`;
            }
            return headers;
        };
        /**
         * Adds an API to the middleware. The API resolves to a registered blockchain's RPC.
         *
         * In TypeScript:
         * ```js
         * axia.addAPI<MyVMClass>("mychain", MyVMClass, "/ext/bc/mychain")
         * ```
         *
         * In Javascript:
         * ```js
         * axia.addAPI("mychain", MyVMClass, "/ext/bc/mychain")
         * ```
         *
         * @typeparam GA Class of the API being added
         * @param apiName A label for referencing the API in the future
         * @param ConstructorFN A reference to the class which instantiates the API
         * @param baseurl Path to resolve to reach the API
         *
         */
        this.addAPI = (apiName, ConstructorFN, baseurl = undefined, ...args) => {
            if (typeof baseurl === "undefined") {
                this.apis[`${apiName}`] = new ConstructorFN(this, undefined, ...args);
            }
            else {
                this.apis[`${apiName}`] = new ConstructorFN(this, baseurl, ...args);
            }
        };
        /**
         * Retrieves a reference to an API by its apiName label.
         *
         * @param apiName Name of the API to return
         */
        this.api = (apiName) => this.apis[`${apiName}`];
        /**
         * @ignore
         */
        this._request = (xhrmethod, baseurl, getdata, postdata, headers = {}, axiosConfig = undefined) => __awaiter(this, void 0, void 0, function* () {
            let config;
            if (axiosConfig) {
                config = Object.assign(Object.assign({}, axiosConfig), this.requestConfig);
            }
            else {
                config = Object.assign({ baseURL: this.url, responseType: "text" }, this.requestConfig);
            }
            config.url = baseurl;
            config.method = xhrmethod;
            config.headers = headers;
            config.data = postdata;
            config.params = getdata;
            // use the fetch adapter if fetch is available e.g. non Node<17 env
            if (typeof fetch !== "undefined") {
                config.adapter = fetchadapter_1.fetchAdapter;
            }
            const resp = yield axios_1.default.request(config);
            // purging all that is axios
            const xhrdata = new apibase_1.RequestResponseData(resp.data, resp.headers, resp.status, resp.statusText, resp.request);
            return xhrdata;
        });
        /**
         * Makes a GET call to an API.
         *
         * @param baseurl Path to the api
         * @param getdata Object containing the key value pairs sent in GET
         * @param headers An array HTTP Request Headers
         * @param axiosConfig Configuration for the axios javascript library that will be the
         * foundation for the rest of the parameters
         *
         * @returns A promise for [[RequestResponseData]]
         */
        this.get = (baseurl, getdata, headers = {}, axiosConfig = undefined) => this._request("GET", baseurl, getdata, {}, this._setHeaders(headers), axiosConfig);
        /**
         * Makes a DELETE call to an API.
         *
         * @param baseurl Path to the API
         * @param getdata Object containing the key value pairs sent in DELETE
         * @param headers An array HTTP Request Headers
         * @param axiosConfig Configuration for the axios javascript library that will be the
         * foundation for the rest of the parameters
         *
         * @returns A promise for [[RequestResponseData]]
         */
        this.delete = (baseurl, getdata, headers = {}, axiosConfig = undefined) => this._request("DELETE", baseurl, getdata, {}, this._setHeaders(headers), axiosConfig);
        /**
         * Makes a POST call to an API.
         *
         * @param baseurl Path to the API
         * @param getdata Object containing the key value pairs sent in POST
         * @param postdata Object containing the key value pairs sent in POST
         * @param headers An array HTTP Request Headers
         * @param axiosConfig Configuration for the axios javascript library that will be the
         * foundation for the rest of the parameters
         *
         * @returns A promise for [[RequestResponseData]]
         */
        this.post = (baseurl, getdata, postdata, headers = {}, axiosConfig = undefined) => this._request("POST", baseurl, getdata, postdata, this._setHeaders(headers), axiosConfig);
        /**
         * Makes a PUT call to an API.
         *
         * @param baseurl Path to the baseurl
         * @param getdata Object containing the key value pairs sent in PUT
         * @param postdata Object containing the key value pairs sent in PUT
         * @param headers An array HTTP Request Headers
         * @param axiosConfig Configuration for the axios javascript library that will be the
         * foundation for the rest of the parameters
         *
         * @returns A promise for [[RequestResponseData]]
         */
        this.put = (baseurl, getdata, postdata, headers = {}, axiosConfig = undefined) => this._request("PUT", baseurl, getdata, postdata, this._setHeaders(headers), axiosConfig);
        /**
         * Makes a PATCH call to an API.
         *
         * @param baseurl Path to the baseurl
         * @param getdata Object containing the key value pairs sent in PATCH
         * @param postdata Object containing the key value pairs sent in PATCH
         * @param parameters Object containing the parameters of the API call
         * @param headers An array HTTP Request Headers
         * @param axiosConfig Configuration for the axios javascript library that will be the
         * foundation for the rest of the parameters
         *
         * @returns A promise for [[RequestResponseData]]
         */
        this.patch = (baseurl, getdata, postdata, headers = {}, axiosConfig = undefined) => this._request("PATCH", baseurl, getdata, postdata, this._setHeaders(headers), axiosConfig);
        if (host != undefined) {
            this.setAddress(host, port, protocol);
        }
    }
}
exports.default = AxiaCore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXhpYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9heGlhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsa0RBSWM7QUFDZCw4Q0FBK0Q7QUFDL0QsMkNBQThDO0FBQzlDLHVEQUFtRDtBQUNuRCw2REFBeUQ7QUFFekQ7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBcUIsUUFBUTtJQXdiM0I7Ozs7OztPQU1HO0lBQ0gsWUFBWSxJQUFhLEVBQUUsSUFBYSxFQUFFLFdBQW1CLE1BQU07UUE5YnpELGNBQVMsR0FBVyxDQUFDLENBQUE7UUFDckIsUUFBRyxHQUFXLEVBQUUsQ0FBQTtRQU9oQixTQUFJLEdBQVcsU0FBUyxDQUFBO1FBQ3hCLFlBQU8sR0FBNEIsRUFBRSxDQUFBO1FBQ3JDLGtCQUFhLEdBQXVCLEVBQUUsQ0FBQTtRQUN0QyxTQUFJLEdBQTZCLEVBQUUsQ0FBQTtRQUU3Qzs7Ozs7Ozs7Ozs7V0FXRztRQUNILGVBQVUsR0FBRyxDQUNYLElBQVksRUFDWixJQUFZLEVBQ1osV0FBbUIsTUFBTSxFQUN6QixlQUF1QixFQUFFLEVBQ25CLEVBQUU7WUFDUixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUNqRCxRQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUN6RCxNQUFNLFNBQVMsR0FBYSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQTtZQUM3QyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDakMsMEJBQTBCO2dCQUMxQixNQUFNLElBQUksc0JBQWEsQ0FDckIsK0NBQStDLENBQ2hELENBQUE7YUFDRjtZQUVELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO1lBQ2hCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFB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LElBQUksSUFBSSxJQUFJLFNBQVMsRUFBRTtZQUNyQixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUE7U0FDdEM7SUFDSCxDQUFDO0NBQ0Y7QUFwY0QsMkJBb2NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQXhpYUNvcmVcbiAqL1xuaW1wb3J0IGF4aW9zLCB7XG4gIEF4aW9zUmVxdWVzdENvbmZpZyxcbiAgQXhpb3NSZXNwb25zZSxcbiAgTWV0aG9kXG59IGZyb20gXCJheGlvc1wiXG5pbXBvcnQgeyBBUElCYXNlLCBSZXF1ZXN0UmVzcG9uc2VEYXRhIH0gZnJvbSBcIi4vY29tbW9uL2FwaWJhc2VcIlxuaW1wb3J0IHsgUHJvdG9jb2xFcnJvciB9IGZyb20gXCIuL3V0aWxzL2Vycm9yc1wiXG5pbXBvcnQgeyBmZXRjaEFkYXB0ZXIgfSBmcm9tIFwiLi91dGlscy9mZXRjaGFkYXB0ZXJcIlxuaW1wb3J0IHsgZ2V0UHJlZmVycmVkSFJQIH0gZnJvbSBcIi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zXCJcblxuLyoqXG4gKiBBeGlhQ29yZSBpcyBtaWRkbGV3YXJlIGZvciBpbnRlcmFjdGluZyB3aXRoIEF4aWEgbm9kZSBSUEMgQVBJcy5cbiAqXG4gKiBFeGFtcGxlIHVzYWdlOlxuICogYGBganNcbiAqIGxldCBheGlhID0gbmV3IEF4aWFDb3JlKFwiMTI3LjAuMC4xXCIsIDk2NTAsIFwiaHR0cHNcIilcbiAqIGBgYFxuICpcbiAqXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEF4aWFDb3JlIHtcbiAgcHJvdGVjdGVkIG5ldHdvcmtJRDogbnVtYmVyID0gMFxuICBwcm90ZWN0ZWQgaHJwOiBzdHJpbmcgPSBcIlwiXG4gIHByb3RlY3RlZCBwcm90b2NvbDogc3RyaW5nXG4gIHByb3RlY3RlZCBpcDogc3RyaW5nXG4gIHByb3RlY3RlZCBob3N0OiBzdHJpbmdcbiAgcHJvdGVjdGVkIHBvcnQ6IG51bWJlclxuICBwcm90ZWN0ZWQgYmFzZUVuZHBvaW50OiBzdHJpbmdcbiAgcHJvdGVjdGVkIHVybDogc3RyaW5nXG4gIHByb3RlY3RlZCBhdXRoOiBzdHJpbmcgPSB1bmRlZmluZWRcbiAgcHJvdGVjdGVkIGhlYWRlcnM6IHsgW2s6IHN0cmluZ106IHN0cmluZyB9ID0ge31cbiAgcHJvdGVjdGVkIHJlcXVlc3RDb25maWc6IEF4aW9zUmVxdWVzdENvbmZpZyA9IHt9XG4gIHByb3RlY3RlZCBhcGlzOiB7IFtrOiBzdHJpbmddOiBBUElCYXNlIH0gPSB7fVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhZGRyZXNzIGFuZCBwb3J0IG9mIHRoZSBtYWluIEF4aWEgQ2xpZW50LlxuICAgKlxuICAgKiBAcGFyYW0gaG9zdCBUaGUgaG9zdG5hbWUgdG8gcmVzb2x2ZSB0byByZWFjaCB0aGUgQXhpYSBDbGllbnQgUlBDIEFQSXMuXG4gICAqIEBwYXJhbSBwb3J0IFRoZSBwb3J0IHRvIHJlc29sdmUgdG8gcmVhY2ggdGhlIEF4aWEgQ2xpZW50IFJQQyBBUElzLlxuICAgKiBAcGFyYW0gcHJvdG9jb2wgVGhlIHByb3RvY29sIHN0cmluZyB0byB1c2UgYmVmb3JlIGEgXCI6Ly9cIiBpbiBhIHJlcXVlc3QsXG4gICAqIGV4OiBcImh0dHBcIiwgXCJodHRwc1wiLCBldGMuIERlZmF1bHRzIHRvIGh0dHBcbiAgICogQHBhcmFtIGJhc2VFbmRwb2ludCB0aGUgYmFzZSBlbmRwb2ludCB0byByZWFjaCB0aGUgQXhpYSBDbGllbnQgUlBDIEFQSXMsXG4gICAqIGV4OiBcIi9ycGNcIi4gRGVmYXVsdHMgdG8gXCIvXCJcbiAgICogVGhlIGZvbGxvd2luZyBzcGVjaWFsIGNoYXJhY3RlcnMgYXJlIHJlbW92ZWQgZnJvbSBob3N0IGFuZCBwcm90b2NvbFxuICAgKiAmIyxAKygpJH4lJ1wiOio/e30gYWxzbyBsZXNzIHRoYW4gYW5kIGdyZWF0ZXIgdGhhbiBzaWduc1xuICAgKi9cbiAgc2V0QWRkcmVzcyA9IChcbiAgICBob3N0OiBzdHJpbmcsXG4gICAgcG9ydDogbnVtYmVyLFxuICAgIHByb3RvY29sOiBzdHJpbmcgPSBcImh0dHBcIixcbiAgICBiYXNlRW5kcG9pbnQ6IHN0cmluZyA9IFwiXCJcbiAgKTogdm9pZCA9PiB7XG4gICAgaG9zdCA9IGhvc3QucmVwbGFjZSgvWyYjLEArKCkkfiUnXCI6Kj88Pnt9XS9nLCBcIlwiKVxuICAgIHByb3RvY29sID0gcHJvdG9jb2wucmVwbGFjZSgvWyYjLEArKCkkfiUnXCI6Kj88Pnt9XS9nLCBcIlwiKVxuICAgIGNvbnN0IHByb3RvY29sczogc3RyaW5nW10gPSBbXCJodHRwXCIsIFwiaHR0cHNcIl1cbiAgICBpZiAoIXByb3RvY29scy5pbmNsdWRlcyhwcm90b2NvbCkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgUHJvdG9jb2xFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEF4aWFDb3JlLnNldEFkZHJlc3M6IEludmFsaWQgcHJvdG9jb2xcIlxuICAgICAgKVxuICAgIH1cblxuICAgIHRoaXMuaG9zdCA9IGhvc3RcbiAgICB0aGlzLnBvcnQgPSBwb3J0XG4gICAgdGhpcy5wcm90b2NvbCA9IHByb3RvY29sXG4gICAgdGhpcy5iYXNlRW5kcG9pbnQgPSBiYXNlRW5kcG9pbnRcbiAgICBsZXQgdXJsOiBzdHJpbmcgPSBgJHtwcm90b2NvbH06Ly8ke2hvc3R9YFxuICAgIGlmIChwb3J0ICE9IHVuZGVmaW5lZCAmJiB0eXBlb2YgcG9ydCA9PT0gXCJudW1iZXJcIiAmJiBwb3J0ID49IDApIHtcbiAgICAgIHVybCA9IGAke3VybH06JHtwb3J0fWBcbiAgICB9XG4gICAgaWYgKFxuICAgICAgYmFzZUVuZHBvaW50ICE9IHVuZGVmaW5lZCAmJlxuICAgICAgdHlwZW9mIGJhc2VFbmRwb2ludCA9PSBcInN0cmluZ1wiICYmXG4gICAgICBiYXNlRW5kcG9pbnQubGVuZ3RoID4gMFxuICAgICkge1xuICAgICAgaWYgKGJhc2VFbmRwb2ludFswXSAhPSBcIi9cIikge1xuICAgICAgICBiYXNlRW5kcG9pbnQgPSBgLyR7YmFzZUVuZHBvaW50fWBcbiAgICAgIH1cbiAgICAgIHVybCA9IGAke3VybH0ke2Jhc2VFbmRwb2ludH1gXG4gICAgfVxuICAgIHRoaXMudXJsID0gdXJsXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcHJvdG9jb2wgc3VjaCBhcyBcImh0dHBcIiwgXCJodHRwc1wiLCBcImdpdFwiLCBcIndzXCIsIGV0Yy5cbiAgICovXG4gIGdldFByb3RvY29sID0gKCk6IHN0cmluZyA9PiB0aGlzLnByb3RvY29sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGhvc3QgZm9yIHRoZSBBeGlhIG5vZGUuXG4gICAqL1xuICBnZXRIb3N0ID0gKCk6IHN0cmluZyA9PiB0aGlzLmhvc3RcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgSVAgZm9yIHRoZSBBeGlhIG5vZGUuXG4gICAqL1xuICBnZXRJUCA9ICgpOiBzdHJpbmcgPT4gdGhpcy5ob3N0XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBvcnQgZm9yIHRoZSBBeGlhIG5vZGUuXG4gICAqL1xuICBnZXRQb3J0ID0gKCk6IG51bWJlciA9PiB0aGlzLnBvcnRcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYmFzZSBlbmRwb2ludCBmb3IgdGhlIEF4aWEgbm9kZS5cbiAgICovXG4gIGdldEJhc2VFbmRwb2ludCA9ICgpOiBzdHJpbmcgPT4gdGhpcy5iYXNlRW5kcG9pbnRcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgVVJMIG9mIHRoZSBBeGlhIG5vZGUgKGlwICsgcG9ydClcbiAgICovXG4gIGdldFVSTCA9ICgpOiBzdHJpbmcgPT4gdGhpcy51cmxcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY3VzdG9tIGhlYWRlcnNcbiAgICovXG4gIGdldEhlYWRlcnMgPSAoKTogb2JqZWN0ID0+IHRoaXMuaGVhZGVyc1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjdXN0b20gcmVxdWVzdCBjb25maWdcbiAgICovXG4gIGdldFJlcXVlc3RDb25maWcgPSAoKTogQXhpb3NSZXF1ZXN0Q29uZmlnID0+IHRoaXMucmVxdWVzdENvbmZpZ1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBuZXR3b3JrSURcbiAgICovXG4gIGdldE5ldHdvcmtJRCA9ICgpOiBudW1iZXIgPT4gdGhpcy5uZXR3b3JrSURcblxuICAvKipcbiAgICogU2V0cyB0aGUgbmV0d29ya0lEXG4gICAqL1xuICBzZXROZXR3b3JrSUQgPSAobmV0SUQ6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgIHRoaXMubmV0d29ya0lEID0gbmV0SURcbiAgICB0aGlzLmhycCA9IGdldFByZWZlcnJlZEhSUCh0aGlzLm5ldHdvcmtJRClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBIdW1hbi1SZWFkYWJsZS1QYXJ0IG9mIHRoZSBuZXR3b3JrIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGtleS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIFtbS2V5UGFpcl1dJ3MgSHVtYW4tUmVhZGFibGUtUGFydCBvZiB0aGUgbmV0d29yaydzIEJlY2gzMiBhZGRyZXNzaW5nIHNjaGVtZVxuICAgKi9cbiAgZ2V0SFJQID0gKCk6IHN0cmluZyA9PiB0aGlzLmhycFxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB0aGUgSHVtYW4tUmVhZGFibGUtUGFydCBvZiB0aGUgbmV0d29yayBhc3NvY2lhdGVkIHdpdGggdGhpcyBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSBocnAgU3RyaW5nIGZvciB0aGUgSHVtYW4tUmVhZGFibGUtUGFydCBvZiBCZWNoMzIgYWRkcmVzc2VzXG4gICAqL1xuICBzZXRIUlAgPSAoaHJwOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICB0aGlzLmhycCA9IGhycFxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBuZXcgY3VzdG9tIGhlYWRlciB0byBiZSBpbmNsdWRlZCB3aXRoIGFsbCByZXF1ZXN0cy5cbiAgICpcbiAgICogQHBhcmFtIGtleSBIZWFkZXIgbmFtZVxuICAgKiBAcGFyYW0gdmFsdWUgSGVhZGVyIHZhbHVlXG4gICAqL1xuICBzZXRIZWFkZXIgPSAoa2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICB0aGlzLmhlYWRlcnNbYCR7a2V5fWBdID0gdmFsdWVcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgcHJldmlvdXNseSBhZGRlZCBjdXN0b20gaGVhZGVyLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IEhlYWRlciBuYW1lXG4gICAqL1xuICByZW1vdmVIZWFkZXIgPSAoa2V5OiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICBkZWxldGUgdGhpcy5oZWFkZXJzW2Ake2tleX1gXVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIGhlYWRlcnMuXG4gICAqL1xuICByZW1vdmVBbGxIZWFkZXJzID0gKCk6IHZvaWQgPT4ge1xuICAgIGZvciAoY29uc3QgcHJvcCBpbiB0aGlzLmhlYWRlcnMpIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodGhpcy5oZWFkZXJzLCBwcm9wKSkge1xuICAgICAgICBkZWxldGUgdGhpcy5oZWFkZXJzW2Ake3Byb3B9YF1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIG5ldyBjdXN0b20gY29uZmlnIHZhbHVlIHRvIGJlIGluY2x1ZGVkIHdpdGggYWxsIHJlcXVlc3RzLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IENvbmZpZyBuYW1lXG4gICAqIEBwYXJhbSB2YWx1ZSBDb25maWcgdmFsdWVcbiAgICovXG4gIHNldFJlcXVlc3RDb25maWcgPSAoa2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuKTogdm9pZCA9PiB7XG4gICAgdGhpcy5yZXF1ZXN0Q29uZmlnW2Ake2tleX1gXSA9IHZhbHVlXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIHByZXZpb3VzbHkgYWRkZWQgcmVxdWVzdCBjb25maWcuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgSGVhZGVyIG5hbWVcbiAgICovXG4gIHJlbW92ZVJlcXVlc3RDb25maWcgPSAoa2V5OiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICBkZWxldGUgdGhpcy5yZXF1ZXN0Q29uZmlnW2Ake2tleX1gXVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIHJlcXVlc3QgY29uZmlncy5cbiAgICovXG4gIHJlbW92ZUFsbFJlcXVlc3RDb25maWdzID0gKCk6IHZvaWQgPT4ge1xuICAgIGZvciAoY29uc3QgcHJvcCBpbiB0aGlzLnJlcXVlc3RDb25maWcpIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodGhpcy5yZXF1ZXN0Q29uZmlnLCBwcm9wKSkge1xuICAgICAgICBkZWxldGUgdGhpcy5yZXF1ZXN0Q29uZmlnW2Ake3Byb3B9YF1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdGVtcG9yYXJ5IGF1dGggdG9rZW4gdXNlZCBmb3IgY29tbXVuaWNhdGluZyB3aXRoIHRoZSBub2RlLlxuICAgKlxuICAgKiBAcGFyYW0gYXV0aCBBIHRlbXBvcmFyeSB0b2tlbiBwcm92aWRlZCBieSB0aGUgbm9kZSBlbmFibGluZyBhY2Nlc3MgdG8gdGhlIGVuZHBvaW50cyBvbiB0aGUgbm9kZS5cbiAgICovXG4gIHNldEF1dGhUb2tlbiA9IChhdXRoOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICB0aGlzLmF1dGggPSBhdXRoXG4gIH1cblxuICBwcm90ZWN0ZWQgX3NldEhlYWRlcnMgPSAoaGVhZGVyczogYW55KTogYW55ID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMuaGVhZGVycyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModGhpcy5oZWFkZXJzKSkge1xuICAgICAgICBoZWFkZXJzW2Ake2tleX1gXSA9IHZhbHVlXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB0aGlzLmF1dGggPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGhlYWRlcnMuQXV0aG9yaXphdGlvbiA9IGBCZWFyZXIgJHt0aGlzLmF1dGh9YFxuICAgIH1cbiAgICByZXR1cm4gaGVhZGVyc1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYW4gQVBJIHRvIHRoZSBtaWRkbGV3YXJlLiBUaGUgQVBJIHJlc29sdmVzIHRvIGEgcmVnaXN0ZXJlZCBibG9ja2NoYWluJ3MgUlBDLlxuICAgKlxuICAgKiBJbiBUeXBlU2NyaXB0OlxuICAgKiBgYGBqc1xuICAgKiBheGlhLmFkZEFQSTxNeVZNQ2xhc3M+KFwibXljaGFpblwiLCBNeVZNQ2xhc3MsIFwiL2V4dC9iYy9teWNoYWluXCIpXG4gICAqIGBgYFxuICAgKlxuICAgKiBJbiBKYXZhc2NyaXB0OlxuICAgKiBgYGBqc1xuICAgKiBheGlhLmFkZEFQSShcIm15Y2hhaW5cIiwgTXlWTUNsYXNzLCBcIi9leHQvYmMvbXljaGFpblwiKVxuICAgKiBgYGBcbiAgICpcbiAgICogQHR5cGVwYXJhbSBHQSBDbGFzcyBvZiB0aGUgQVBJIGJlaW5nIGFkZGVkXG4gICAqIEBwYXJhbSBhcGlOYW1lIEEgbGFiZWwgZm9yIHJlZmVyZW5jaW5nIHRoZSBBUEkgaW4gdGhlIGZ1dHVyZVxuICAgKiBAcGFyYW0gQ29uc3RydWN0b3JGTiBBIHJlZmVyZW5jZSB0byB0aGUgY2xhc3Mgd2hpY2ggaW5zdGFudGlhdGVzIHRoZSBBUElcbiAgICogQHBhcmFtIGJhc2V1cmwgUGF0aCB0byByZXNvbHZlIHRvIHJlYWNoIHRoZSBBUElcbiAgICpcbiAgICovXG4gIGFkZEFQSSA9IDxHQSBleHRlbmRzIEFQSUJhc2U+KFxuICAgIGFwaU5hbWU6IHN0cmluZyxcbiAgICBDb25zdHJ1Y3RvckZOOiBuZXcgKFxuICAgICAgYXhjOiBBeGlhQ29yZSxcbiAgICAgIGJhc2V1cmw/OiBzdHJpbmcsXG4gICAgICAuLi5hcmdzOiBhbnlbXVxuICAgICkgPT4gR0EsXG4gICAgYmFzZXVybDogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIC4uLmFyZ3M6IGFueVtdXG4gICkgPT4ge1xuICAgIGlmICh0eXBlb2YgYmFzZXVybCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5hcGlzW2Ake2FwaU5hbWV9YF0gPSBuZXcgQ29uc3RydWN0b3JGTih0aGlzLCB1bmRlZmluZWQsIC4uLmFyZ3MpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYXBpc1tgJHthcGlOYW1lfWBdID0gbmV3IENvbnN0cnVjdG9yRk4odGhpcywgYmFzZXVybCwgLi4uYXJncylcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGEgcmVmZXJlbmNlIHRvIGFuIEFQSSBieSBpdHMgYXBpTmFtZSBsYWJlbC5cbiAgICpcbiAgICogQHBhcmFtIGFwaU5hbWUgTmFtZSBvZiB0aGUgQVBJIHRvIHJldHVyblxuICAgKi9cbiAgYXBpID0gPEdBIGV4dGVuZHMgQVBJQmFzZT4oYXBpTmFtZTogc3RyaW5nKTogR0EgPT5cbiAgICB0aGlzLmFwaXNbYCR7YXBpTmFtZX1gXSBhcyBHQVxuXG4gIC8qKlxuICAgKiBAaWdub3JlXG4gICAqL1xuICBwcm90ZWN0ZWQgX3JlcXVlc3QgPSBhc3luYyAoXG4gICAgeGhybWV0aG9kOiBNZXRob2QsXG4gICAgYmFzZXVybDogc3RyaW5nLFxuICAgIGdldGRhdGE6IG9iamVjdCxcbiAgICBwb3N0ZGF0YTogc3RyaW5nIHwgb2JqZWN0IHwgQXJyYXlCdWZmZXIgfCBBcnJheUJ1ZmZlclZpZXcsXG4gICAgaGVhZGVyczogYW55ID0ge30sXG4gICAgYXhpb3NDb25maWc6IEF4aW9zUmVxdWVzdENvbmZpZyA9IHVuZGVmaW5lZFxuICApOiBQcm9taXNlPFJlcXVlc3RSZXNwb25zZURhdGE+ID0+IHtcbiAgICBsZXQgY29uZmlnOiBBeGlvc1JlcXVlc3RDb25maWdcbiAgICBpZiAoYXhpb3NDb25maWcpIHtcbiAgICAgIGNvbmZpZyA9IHtcbiAgICAgICAgLi4uYXhpb3NDb25maWcsXG4gICAgICAgIC4uLnRoaXMucmVxdWVzdENvbmZpZ1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25maWcgPSB7XG4gICAgICAgIGJhc2VVUkw6IHRoaXMudXJsLFxuICAgICAgICByZXNwb25zZVR5cGU6IFwidGV4dFwiLFxuICAgICAgICAuLi50aGlzLnJlcXVlc3RDb25maWdcbiAgICAgIH1cbiAgICB9XG4gICAgY29uZmlnLnVybCA9IGJhc2V1cmxcbiAgICBjb25maWcubWV0aG9kID0geGhybWV0aG9kXG4gICAgY29uZmlnLmhlYWRlcnMgPSBoZWFkZXJzXG4gICAgY29uZmlnLmRhdGEgPSBwb3N0ZGF0YVxuICAgIGNvbmZpZy5wYXJhbXMgPSBnZXRkYXRhXG4gICAgLy8gdXNlIHRoZSBmZXRjaCBhZGFwdGVyIGlmIGZldGNoIGlzIGF2YWlsYWJsZSBlLmcuIG5vbiBOb2RlPDE3IGVudlxuICAgIGlmICh0eXBlb2YgZmV0Y2ggIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGNvbmZpZy5hZGFwdGVyID0gZmV0Y2hBZGFwdGVyXG4gICAgfVxuICAgIGNvbnN0IHJlc3A6IEF4aW9zUmVzcG9uc2U8YW55PiA9IGF3YWl0IGF4aW9zLnJlcXVlc3QoY29uZmlnKVxuICAgIC8vIHB1cmdpbmcgYWxsIHRoYXQgaXMgYXhpb3NcbiAgICBjb25zdCB4aHJkYXRhOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gbmV3IFJlcXVlc3RSZXNwb25zZURhdGEoXG4gICAgICByZXNwLmRhdGEsXG4gICAgICByZXNwLmhlYWRlcnMsXG4gICAgICByZXNwLnN0YXR1cyxcbiAgICAgIHJlc3Auc3RhdHVzVGV4dCxcbiAgICAgIHJlc3AucmVxdWVzdFxuICAgIClcbiAgICByZXR1cm4geGhyZGF0YVxuICB9XG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgR0VUIGNhbGwgdG8gYW4gQVBJLlxuICAgKlxuICAgKiBAcGFyYW0gYmFzZXVybCBQYXRoIHRvIHRoZSBhcGlcbiAgICogQHBhcmFtIGdldGRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGtleSB2YWx1ZSBwYWlycyBzZW50IGluIEdFVFxuICAgKiBAcGFyYW0gaGVhZGVycyBBbiBhcnJheSBIVFRQIFJlcXVlc3QgSGVhZGVyc1xuICAgKiBAcGFyYW0gYXhpb3NDb25maWcgQ29uZmlndXJhdGlvbiBmb3IgdGhlIGF4aW9zIGphdmFzY3JpcHQgbGlicmFyeSB0aGF0IHdpbGwgYmUgdGhlXG4gICAqIGZvdW5kYXRpb24gZm9yIHRoZSByZXN0IG9mIHRoZSBwYXJhbWV0ZXJzXG4gICAqXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSBmb3IgW1tSZXF1ZXN0UmVzcG9uc2VEYXRhXV1cbiAgICovXG4gIGdldCA9IChcbiAgICBiYXNldXJsOiBzdHJpbmcsXG4gICAgZ2V0ZGF0YTogb2JqZWN0LFxuICAgIGhlYWRlcnM6IG9iamVjdCA9IHt9LFxuICAgIGF4aW9zQ29uZmlnOiBBeGlvc1JlcXVlc3RDb25maWcgPSB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PlxuICAgIHRoaXMuX3JlcXVlc3QoXG4gICAgICBcIkdFVFwiLFxuICAgICAgYmFzZXVybCxcbiAgICAgIGdldGRhdGEsXG4gICAgICB7fSxcbiAgICAgIHRoaXMuX3NldEhlYWRlcnMoaGVhZGVycyksXG4gICAgICBheGlvc0NvbmZpZ1xuICAgIClcblxuICAvKipcbiAgICogTWFrZXMgYSBERUxFVEUgY2FsbCB0byBhbiBBUEkuXG4gICAqXG4gICAqIEBwYXJhbSBiYXNldXJsIFBhdGggdG8gdGhlIEFQSVxuICAgKiBAcGFyYW0gZ2V0ZGF0YSBPYmplY3QgY29udGFpbmluZyB0aGUga2V5IHZhbHVlIHBhaXJzIHNlbnQgaW4gREVMRVRFXG4gICAqIEBwYXJhbSBoZWFkZXJzIEFuIGFycmF5IEhUVFAgUmVxdWVzdCBIZWFkZXJzXG4gICAqIEBwYXJhbSBheGlvc0NvbmZpZyBDb25maWd1cmF0aW9uIGZvciB0aGUgYXhpb3MgamF2YXNjcmlwdCBsaWJyYXJ5IHRoYXQgd2lsbCBiZSB0aGVcbiAgICogZm91bmRhdGlvbiBmb3IgdGhlIHJlc3Qgb2YgdGhlIHBhcmFtZXRlcnNcbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIGZvciBbW1JlcXVlc3RSZXNwb25zZURhdGFdXVxuICAgKi9cbiAgZGVsZXRlID0gKFxuICAgIGJhc2V1cmw6IHN0cmluZyxcbiAgICBnZXRkYXRhOiBvYmplY3QsXG4gICAgaGVhZGVyczogb2JqZWN0ID0ge30sXG4gICAgYXhpb3NDb25maWc6IEF4aW9zUmVxdWVzdENvbmZpZyA9IHVuZGVmaW5lZFxuICApOiBQcm9taXNlPFJlcXVlc3RSZXNwb25zZURhdGE+ID0+XG4gICAgdGhpcy5fcmVxdWVzdChcbiAgICAgIFwiREVMRVRFXCIsXG4gICAgICBiYXNldXJsLFxuICAgICAgZ2V0ZGF0YSxcbiAgICAgIHt9LFxuICAgICAgdGhpcy5fc2V0SGVhZGVycyhoZWFkZXJzKSxcbiAgICAgIGF4aW9zQ29uZmlnXG4gICAgKVxuXG4gIC8qKlxuICAgKiBNYWtlcyBhIFBPU1QgY2FsbCB0byBhbiBBUEkuXG4gICAqXG4gICAqIEBwYXJhbSBiYXNldXJsIFBhdGggdG8gdGhlIEFQSVxuICAgKiBAcGFyYW0gZ2V0ZGF0YSBPYmplY3QgY29udGFpbmluZyB0aGUga2V5IHZhbHVlIHBhaXJzIHNlbnQgaW4gUE9TVFxuICAgKiBAcGFyYW0gcG9zdGRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGtleSB2YWx1ZSBwYWlycyBzZW50IGluIFBPU1RcbiAgICogQHBhcmFtIGhlYWRlcnMgQW4gYXJyYXkgSFRUUCBSZXF1ZXN0IEhlYWRlcnNcbiAgICogQHBhcmFtIGF4aW9zQ29uZmlnIENvbmZpZ3VyYXRpb24gZm9yIHRoZSBheGlvcyBqYXZhc2NyaXB0IGxpYnJhcnkgdGhhdCB3aWxsIGJlIHRoZVxuICAgKiBmb3VuZGF0aW9uIGZvciB0aGUgcmVzdCBvZiB0aGUgcGFyYW1ldGVyc1xuICAgKlxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgZm9yIFtbUmVxdWVzdFJlc3BvbnNlRGF0YV1dXG4gICAqL1xuICBwb3N0ID0gKFxuICAgIGJhc2V1cmw6IHN0cmluZyxcbiAgICBnZXRkYXRhOiBvYmplY3QsXG4gICAgcG9zdGRhdGE6IHN0cmluZyB8IG9iamVjdCB8IEFycmF5QnVmZmVyIHwgQXJyYXlCdWZmZXJWaWV3LFxuICAgIGhlYWRlcnM6IG9iamVjdCA9IHt9LFxuICAgIGF4aW9zQ29uZmlnOiBBeGlvc1JlcXVlc3RDb25maWcgPSB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PlxuICAgIHRoaXMuX3JlcXVlc3QoXG4gICAgICBcIlBPU1RcIixcbiAgICAgIGJhc2V1cmwsXG4gICAgICBnZXRkYXRhLFxuICAgICAgcG9zdGRhdGEsXG4gICAgICB0aGlzLl9zZXRIZWFkZXJzKGhlYWRlcnMpLFxuICAgICAgYXhpb3NDb25maWdcbiAgICApXG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgUFVUIGNhbGwgdG8gYW4gQVBJLlxuICAgKlxuICAgKiBAcGFyYW0gYmFzZXVybCBQYXRoIHRvIHRoZSBiYXNldXJsXG4gICAqIEBwYXJhbSBnZXRkYXRhIE9iamVjdCBjb250YWluaW5nIHRoZSBrZXkgdmFsdWUgcGFpcnMgc2VudCBpbiBQVVRcbiAgICogQHBhcmFtIHBvc3RkYXRhIE9iamVjdCBjb250YWluaW5nIHRoZSBrZXkgdmFsdWUgcGFpcnMgc2VudCBpbiBQVVRcbiAgICogQHBhcmFtIGhlYWRlcnMgQW4gYXJyYXkgSFRUUCBSZXF1ZXN0IEhlYWRlcnNcbiAgICogQHBhcmFtIGF4aW9zQ29uZmlnIENvbmZpZ3VyYXRpb24gZm9yIHRoZSBheGlvcyBqYXZhc2NyaXB0IGxpYnJhcnkgdGhhdCB3aWxsIGJlIHRoZVxuICAgKiBmb3VuZGF0aW9uIGZvciB0aGUgcmVzdCBvZiB0aGUgcGFyYW1ldGVyc1xuICAgKlxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgZm9yIFtbUmVxdWVzdFJlc3BvbnNlRGF0YV1dXG4gICAqL1xuICBwdXQgPSAoXG4gICAgYmFzZXVybDogc3RyaW5nLFxuICAgIGdldGRhdGE6IG9iamVjdCxcbiAgICBwb3N0ZGF0YTogc3RyaW5nIHwgb2JqZWN0IHwgQXJyYXlCdWZmZXIgfCBBcnJheUJ1ZmZlclZpZXcsXG4gICAgaGVhZGVyczogb2JqZWN0ID0ge30sXG4gICAgYXhpb3NDb25maWc6IEF4aW9zUmVxdWVzdENvbmZpZyA9IHVuZGVmaW5lZFxuICApOiBQcm9taXNlPFJlcXVlc3RSZXNwb25zZURhdGE+ID0+XG4gICAgdGhpcy5fcmVxdWVzdChcbiAgICAgIFwiUFVUXCIsXG4gICAgICBiYXNldXJsLFxuICAgICAgZ2V0ZGF0YSxcbiAgICAgIHBvc3RkYXRhLFxuICAgICAgdGhpcy5fc2V0SGVhZGVycyhoZWFkZXJzKSxcbiAgICAgIGF4aW9zQ29uZmlnXG4gICAgKVxuXG4gIC8qKlxuICAgKiBNYWtlcyBhIFBBVENIIGNhbGwgdG8gYW4gQVBJLlxuICAgKlxuICAgKiBAcGFyYW0gYmFzZXVybCBQYXRoIHRvIHRoZSBiYXNldXJsXG4gICAqIEBwYXJhbSBnZXRkYXRhIE9iamVjdCBjb250YWluaW5nIHRoZSBrZXkgdmFsdWUgcGFpcnMgc2VudCBpbiBQQVRDSFxuICAgKiBAcGFyYW0gcG9zdGRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGtleSB2YWx1ZSBwYWlycyBzZW50IGluIFBBVENIXG4gICAqIEBwYXJhbSBwYXJhbWV0ZXJzIE9iamVjdCBjb250YWluaW5nIHRoZSBwYXJhbWV0ZXJzIG9mIHRoZSBBUEkgY2FsbFxuICAgKiBAcGFyYW0gaGVhZGVycyBBbiBhcnJheSBIVFRQIFJlcXVlc3QgSGVhZGVyc1xuICAgKiBAcGFyYW0gYXhpb3NDb25maWcgQ29uZmlndXJhdGlvbiBmb3IgdGhlIGF4aW9zIGphdmFzY3JpcHQgbGlicmFyeSB0aGF0IHdpbGwgYmUgdGhlXG4gICAqIGZvdW5kYXRpb24gZm9yIHRoZSByZXN0IG9mIHRoZSBwYXJhbWV0ZXJzXG4gICAqXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSBmb3IgW1tSZXF1ZXN0UmVzcG9uc2VEYXRhXV1cbiAgICovXG4gIHBhdGNoID0gKFxuICAgIGJhc2V1cmw6IHN0cmluZyxcbiAgICBnZXRkYXRhOiBvYmplY3QsXG4gICAgcG9zdGRhdGE6IHN0cmluZyB8IG9iamVjdCB8IEFycmF5QnVmZmVyIHwgQXJyYXlCdWZmZXJWaWV3LFxuICAgIGhlYWRlcnM6IG9iamVjdCA9IHt9LFxuICAgIGF4aW9zQ29uZmlnOiBBeGlvc1JlcXVlc3RDb25maWcgPSB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PlxuICAgIHRoaXMuX3JlcXVlc3QoXG4gICAgICBcIlBBVENIXCIsXG4gICAgICBiYXNldXJsLFxuICAgICAgZ2V0ZGF0YSxcbiAgICAgIHBvc3RkYXRhLFxuICAgICAgdGhpcy5fc2V0SGVhZGVycyhoZWFkZXJzKSxcbiAgICAgIGF4aW9zQ29uZmlnXG4gICAgKVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IEF4aWEgaW5zdGFuY2UuIFNldHMgdGhlIGFkZHJlc3MgYW5kIHBvcnQgb2YgdGhlIG1haW4gQXhpYSBDbGllbnQuXG4gICAqXG4gICAqIEBwYXJhbSBob3N0IFRoZSBob3N0bmFtZSB0byByZXNvbHZlIHRvIHJlYWNoIHRoZSBBeGlhIENsaWVudCBBUElzXG4gICAqIEBwYXJhbSBwb3J0IFRoZSBwb3J0IHRvIHJlc29sdmUgdG8gcmVhY2ggdGhlIEF4aWEgQ2xpZW50IEFQSXNcbiAgICogQHBhcmFtIHByb3RvY29sIFRoZSBwcm90b2NvbCBzdHJpbmcgdG8gdXNlIGJlZm9yZSBhIFwiOi8vXCIgaW4gYSByZXF1ZXN0LCBleDogXCJodHRwXCIsIFwiaHR0cHNcIiwgXCJnaXRcIiwgXCJ3c1wiLCBldGMgLi4uXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihob3N0Pzogc3RyaW5nLCBwb3J0PzogbnVtYmVyLCBwcm90b2NvbDogc3RyaW5nID0gXCJodHRwXCIpIHtcbiAgICBpZiAoaG9zdCAhPSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuc2V0QWRkcmVzcyhob3N0LCBwb3J0LCBwcm90b2NvbClcbiAgICB9XG4gIH1cbn1cbiJdfQ==