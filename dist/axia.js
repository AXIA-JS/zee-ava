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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXhpYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9heGlhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsa0RBQXdFO0FBQ3hFLDhDQUErRDtBQUMvRCwyQ0FBOEM7QUFDOUMsdURBQW1EO0FBQ25ELDZEQUF5RDtBQUV6RDs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFxQixRQUFRO0lBa2IzQjs7Ozs7O09BTUc7SUFDSCxZQUFZLElBQWEsRUFBRSxJQUFhLEVBQUUsV0FBbUIsTUFBTTtRQXhiekQsY0FBUyxHQUFXLENBQUMsQ0FBQTtRQUNyQixRQUFHLEdBQVcsRUFBRSxDQUFBO1FBT2hCLFNBQUksR0FBVyxTQUFTLENBQUE7UUFDeEIsWUFBTyxHQUE0QixFQUFFLENBQUE7UUFDckMsa0JBQWEsR0FBdUIsRUFBRSxDQUFBO1FBQ3RDLFNBQUksR0FBNkIsRUFBRSxDQUFBO1FBRTdDOzs7Ozs7Ozs7OztXQVdHO1FBQ0gsZUFBVSxHQUFHLENBQ1gsSUFBWSxFQUNaLElBQVksRUFDWixXQUFtQixNQUFNLEVBQ3pCLGVBQXVCLEVBQUUsRUFDbkIsRUFBRTtZQUNSLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHdCQUF3QixFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2pELFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLHdCQUF3QixFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ3pELE1BQU0sU0FBUyxHQUFhLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUNqQywwQkFBMEI7Z0JBQzFCLE1BQU0sSUFBSSxzQkFBYSxDQUFDLCtDQUErQyxDQUFDLENBQUE7YUFDekU7WUFFRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtZQUNoQixJQUFJLENBQUMsSUFBSSxHQUFHLElB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QVVELElBQUksSUFBSSxJQUFJLFNBQVMsRUFBRTtZQUNyQixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUE7U0FDdEM7SUFDSCxDQUFDO0NBQ0Y7QUE5YkQsMkJBOGJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQXhpYUNvcmVcbiAqL1xuaW1wb3J0IGF4aW9zLCB7IEF4aW9zUmVxdWVzdENvbmZpZywgQXhpb3NSZXNwb25zZSwgTWV0aG9kIH0gZnJvbSBcImF4aW9zXCJcbmltcG9ydCB7IEFQSUJhc2UsIFJlcXVlc3RSZXNwb25zZURhdGEgfSBmcm9tIFwiLi9jb21tb24vYXBpYmFzZVwiXG5pbXBvcnQgeyBQcm90b2NvbEVycm9yIH0gZnJvbSBcIi4vdXRpbHMvZXJyb3JzXCJcbmltcG9ydCB7IGZldGNoQWRhcHRlciB9IGZyb20gXCIuL3V0aWxzL2ZldGNoYWRhcHRlclwiXG5pbXBvcnQgeyBnZXRQcmVmZXJyZWRIUlAgfSBmcm9tIFwiLi91dGlscy9oZWxwZXJmdW5jdGlvbnNcIlxuXG4vKipcbiAqIEF4aWFDb3JlIGlzIG1pZGRsZXdhcmUgZm9yIGludGVyYWN0aW5nIHdpdGggQXhpYSBub2RlIFJQQyBBUElzLlxuICpcbiAqIEV4YW1wbGUgdXNhZ2U6XG4gKiBgYGBqc1xuICogbGV0IGF4aWEgPSBuZXcgQXhpYUNvcmUoXCIxMjcuMC4wLjFcIiwgOTY1MCwgXCJodHRwc1wiKVxuICogYGBgXG4gKlxuICpcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXhpYUNvcmUge1xuICBwcm90ZWN0ZWQgbmV0d29ya0lEOiBudW1iZXIgPSAwXG4gIHByb3RlY3RlZCBocnA6IHN0cmluZyA9IFwiXCJcbiAgcHJvdGVjdGVkIHByb3RvY29sOiBzdHJpbmdcbiAgcHJvdGVjdGVkIGlwOiBzdHJpbmdcbiAgcHJvdGVjdGVkIGhvc3Q6IHN0cmluZ1xuICBwcm90ZWN0ZWQgcG9ydDogbnVtYmVyXG4gIHByb3RlY3RlZCBiYXNlRW5kcG9pbnQ6IHN0cmluZ1xuICBwcm90ZWN0ZWQgdXJsOiBzdHJpbmdcbiAgcHJvdGVjdGVkIGF1dGg6IHN0cmluZyA9IHVuZGVmaW5lZFxuICBwcm90ZWN0ZWQgaGVhZGVyczogeyBbazogc3RyaW5nXTogc3RyaW5nIH0gPSB7fVxuICBwcm90ZWN0ZWQgcmVxdWVzdENvbmZpZzogQXhpb3NSZXF1ZXN0Q29uZmlnID0ge31cbiAgcHJvdGVjdGVkIGFwaXM6IHsgW2s6IHN0cmluZ106IEFQSUJhc2UgfSA9IHt9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFkZHJlc3MgYW5kIHBvcnQgb2YgdGhlIG1haW4gQXhpYSBDbGllbnQuXG4gICAqXG4gICAqIEBwYXJhbSBob3N0IFRoZSBob3N0bmFtZSB0byByZXNvbHZlIHRvIHJlYWNoIHRoZSBBeGlhIENsaWVudCBSUEMgQVBJcy5cbiAgICogQHBhcmFtIHBvcnQgVGhlIHBvcnQgdG8gcmVzb2x2ZSB0byByZWFjaCB0aGUgQXhpYSBDbGllbnQgUlBDIEFQSXMuXG4gICAqIEBwYXJhbSBwcm90b2NvbCBUaGUgcHJvdG9jb2wgc3RyaW5nIHRvIHVzZSBiZWZvcmUgYSBcIjovL1wiIGluIGEgcmVxdWVzdCxcbiAgICogZXg6IFwiaHR0cFwiLCBcImh0dHBzXCIsIGV0Yy4gRGVmYXVsdHMgdG8gaHR0cFxuICAgKiBAcGFyYW0gYmFzZUVuZHBvaW50IHRoZSBiYXNlIGVuZHBvaW50IHRvIHJlYWNoIHRoZSBBeGlhIENsaWVudCBSUEMgQVBJcyxcbiAgICogZXg6IFwiL3JwY1wiLiBEZWZhdWx0cyB0byBcIi9cIlxuICAgKiBUaGUgZm9sbG93aW5nIHNwZWNpYWwgY2hhcmFjdGVycyBhcmUgcmVtb3ZlZCBmcm9tIGhvc3QgYW5kIHByb3RvY29sXG4gICAqICYjLEArKCkkfiUnXCI6Kj97fSBhbHNvIGxlc3MgdGhhbiBhbmQgZ3JlYXRlciB0aGFuIHNpZ25zXG4gICAqL1xuICBzZXRBZGRyZXNzID0gKFxuICAgIGhvc3Q6IHN0cmluZyxcbiAgICBwb3J0OiBudW1iZXIsXG4gICAgcHJvdG9jb2w6IHN0cmluZyA9IFwiaHR0cFwiLFxuICAgIGJhc2VFbmRwb2ludDogc3RyaW5nID0gXCJcIlxuICApOiB2b2lkID0+IHtcbiAgICBob3N0ID0gaG9zdC5yZXBsYWNlKC9bJiMsQCsoKSR+JSdcIjoqPzw+e31dL2csIFwiXCIpXG4gICAgcHJvdG9jb2wgPSBwcm90b2NvbC5yZXBsYWNlKC9bJiMsQCsoKSR+JSdcIjoqPzw+e31dL2csIFwiXCIpXG4gICAgY29uc3QgcHJvdG9jb2xzOiBzdHJpbmdbXSA9IFtcImh0dHBcIiwgXCJodHRwc1wiXVxuICAgIGlmICghcHJvdG9jb2xzLmluY2x1ZGVzKHByb3RvY29sKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBQcm90b2NvbEVycm9yKFwiRXJyb3IgLSBBeGlhQ29yZS5zZXRBZGRyZXNzOiBJbnZhbGlkIHByb3RvY29sXCIpXG4gICAgfVxuXG4gICAgdGhpcy5ob3N0ID0gaG9zdFxuICAgIHRoaXMucG9ydCA9IHBvcnRcbiAgICB0aGlzLnByb3RvY29sID0gcHJvdG9jb2xcbiAgICB0aGlzLmJhc2VFbmRwb2ludCA9IGJhc2VFbmRwb2ludFxuICAgIGxldCB1cmw6IHN0cmluZyA9IGAke3Byb3RvY29sfTovLyR7aG9zdH1gXG4gICAgaWYgKHBvcnQgIT0gdW5kZWZpbmVkICYmIHR5cGVvZiBwb3J0ID09PSBcIm51bWJlclwiICYmIHBvcnQgPj0gMCkge1xuICAgICAgdXJsID0gYCR7dXJsfToke3BvcnR9YFxuICAgIH1cbiAgICBpZiAoXG4gICAgICBiYXNlRW5kcG9pbnQgIT0gdW5kZWZpbmVkICYmXG4gICAgICB0eXBlb2YgYmFzZUVuZHBvaW50ID09IFwic3RyaW5nXCIgJiZcbiAgICAgIGJhc2VFbmRwb2ludC5sZW5ndGggPiAwXG4gICAgKSB7XG4gICAgICBpZiAoYmFzZUVuZHBvaW50WzBdICE9IFwiL1wiKSB7XG4gICAgICAgIGJhc2VFbmRwb2ludCA9IGAvJHtiYXNlRW5kcG9pbnR9YFxuICAgICAgfVxuICAgICAgdXJsID0gYCR7dXJsfSR7YmFzZUVuZHBvaW50fWBcbiAgICB9XG4gICAgdGhpcy51cmwgPSB1cmxcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwcm90b2NvbCBzdWNoIGFzIFwiaHR0cFwiLCBcImh0dHBzXCIsIFwiZ2l0XCIsIFwid3NcIiwgZXRjLlxuICAgKi9cbiAgZ2V0UHJvdG9jb2wgPSAoKTogc3RyaW5nID0+IHRoaXMucHJvdG9jb2xcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgaG9zdCBmb3IgdGhlIEF4aWEgbm9kZS5cbiAgICovXG4gIGdldEhvc3QgPSAoKTogc3RyaW5nID0+IHRoaXMuaG9zdFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBJUCBmb3IgdGhlIEF4aWEgbm9kZS5cbiAgICovXG4gIGdldElQID0gKCk6IHN0cmluZyA9PiB0aGlzLmhvc3RcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcG9ydCBmb3IgdGhlIEF4aWEgbm9kZS5cbiAgICovXG4gIGdldFBvcnQgPSAoKTogbnVtYmVyID0+IHRoaXMucG9ydFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBiYXNlIGVuZHBvaW50IGZvciB0aGUgQXhpYSBub2RlLlxuICAgKi9cbiAgZ2V0QmFzZUVuZHBvaW50ID0gKCk6IHN0cmluZyA9PiB0aGlzLmJhc2VFbmRwb2ludFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBVUkwgb2YgdGhlIEF4aWEgbm9kZSAoaXAgKyBwb3J0KVxuICAgKi9cbiAgZ2V0VVJMID0gKCk6IHN0cmluZyA9PiB0aGlzLnVybFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjdXN0b20gaGVhZGVyc1xuICAgKi9cbiAgZ2V0SGVhZGVycyA9ICgpOiBvYmplY3QgPT4gdGhpcy5oZWFkZXJzXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGN1c3RvbSByZXF1ZXN0IGNvbmZpZ1xuICAgKi9cbiAgZ2V0UmVxdWVzdENvbmZpZyA9ICgpOiBBeGlvc1JlcXVlc3RDb25maWcgPT4gdGhpcy5yZXF1ZXN0Q29uZmlnXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG5ldHdvcmtJRFxuICAgKi9cbiAgZ2V0TmV0d29ya0lEID0gKCk6IG51bWJlciA9PiB0aGlzLm5ldHdvcmtJRFxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBuZXR3b3JrSURcbiAgICovXG4gIHNldE5ldHdvcmtJRCA9IChuZXRJRDogbnVtYmVyKTogdm9pZCA9PiB7XG4gICAgdGhpcy5uZXR3b3JrSUQgPSBuZXRJRFxuICAgIHRoaXMuaHJwID0gZ2V0UHJlZmVycmVkSFJQKHRoaXMubmV0d29ya0lEKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIEh1bWFuLVJlYWRhYmxlLVBhcnQgb2YgdGhlIG5ldHdvcmsgYXNzb2NpYXRlZCB3aXRoIHRoaXMga2V5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgW1tLZXlQYWlyXV0ncyBIdW1hbi1SZWFkYWJsZS1QYXJ0IG9mIHRoZSBuZXR3b3JrJ3MgQmVjaDMyIGFkZHJlc3Npbmcgc2NoZW1lXG4gICAqL1xuICBnZXRIUlAgPSAoKTogc3RyaW5nID0+IHRoaXMuaHJwXG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHRoZSBIdW1hbi1SZWFkYWJsZS1QYXJ0IG9mIHRoZSBuZXR3b3JrIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGtleS5cbiAgICpcbiAgICogQHBhcmFtIGhycCBTdHJpbmcgZm9yIHRoZSBIdW1hbi1SZWFkYWJsZS1QYXJ0IG9mIEJlY2gzMiBhZGRyZXNzZXNcbiAgICovXG4gIHNldEhSUCA9IChocnA6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgIHRoaXMuaHJwID0gaHJwXG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIG5ldyBjdXN0b20gaGVhZGVyIHRvIGJlIGluY2x1ZGVkIHdpdGggYWxsIHJlcXVlc3RzLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IEhlYWRlciBuYW1lXG4gICAqIEBwYXJhbSB2YWx1ZSBIZWFkZXIgdmFsdWVcbiAgICovXG4gIHNldEhlYWRlciA9IChrZXk6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgIHRoaXMuaGVhZGVyc1tgJHtrZXl9YF0gPSB2YWx1ZVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBwcmV2aW91c2x5IGFkZGVkIGN1c3RvbSBoZWFkZXIuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgSGVhZGVyIG5hbWVcbiAgICovXG4gIHJlbW92ZUhlYWRlciA9IChrZXk6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgIGRlbGV0ZSB0aGlzLmhlYWRlcnNbYCR7a2V5fWBdXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbGwgaGVhZGVycy5cbiAgICovXG4gIHJlbW92ZUFsbEhlYWRlcnMgPSAoKTogdm9pZCA9PiB7XG4gICAgZm9yIChjb25zdCBwcm9wIGluIHRoaXMuaGVhZGVycykge1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmhlYWRlcnMsIHByb3ApKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmhlYWRlcnNbYCR7cHJvcH1gXVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgbmV3IGN1c3RvbSBjb25maWcgdmFsdWUgdG8gYmUgaW5jbHVkZWQgd2l0aCBhbGwgcmVxdWVzdHMuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgQ29uZmlnIG5hbWVcbiAgICogQHBhcmFtIHZhbHVlIENvbmZpZyB2YWx1ZVxuICAgKi9cbiAgc2V0UmVxdWVzdENvbmZpZyA9IChrZXk6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IGJvb2xlYW4pOiB2b2lkID0+IHtcbiAgICB0aGlzLnJlcXVlc3RDb25maWdbYCR7a2V5fWBdID0gdmFsdWVcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgcHJldmlvdXNseSBhZGRlZCByZXF1ZXN0IGNvbmZpZy5cbiAgICpcbiAgICogQHBhcmFtIGtleSBIZWFkZXIgbmFtZVxuICAgKi9cbiAgcmVtb3ZlUmVxdWVzdENvbmZpZyA9IChrZXk6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgIGRlbGV0ZSB0aGlzLnJlcXVlc3RDb25maWdbYCR7a2V5fWBdXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbGwgcmVxdWVzdCBjb25maWdzLlxuICAgKi9cbiAgcmVtb3ZlQWxsUmVxdWVzdENvbmZpZ3MgPSAoKTogdm9pZCA9PiB7XG4gICAgZm9yIChjb25zdCBwcm9wIGluIHRoaXMucmVxdWVzdENvbmZpZykge1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLnJlcXVlc3RDb25maWcsIHByb3ApKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnJlcXVlc3RDb25maWdbYCR7cHJvcH1gXVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB0ZW1wb3JhcnkgYXV0aCB0b2tlbiB1c2VkIGZvciBjb21tdW5pY2F0aW5nIHdpdGggdGhlIG5vZGUuXG4gICAqXG4gICAqIEBwYXJhbSBhdXRoIEEgdGVtcG9yYXJ5IHRva2VuIHByb3ZpZGVkIGJ5IHRoZSBub2RlIGVuYWJsaW5nIGFjY2VzcyB0byB0aGUgZW5kcG9pbnRzIG9uIHRoZSBub2RlLlxuICAgKi9cbiAgc2V0QXV0aFRva2VuID0gKGF1dGg6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgIHRoaXMuYXV0aCA9IGF1dGhcbiAgfVxuXG4gIHByb3RlY3RlZCBfc2V0SGVhZGVycyA9IChoZWFkZXJzOiBhbnkpOiBhbnkgPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5oZWFkZXJzID09PSBcIm9iamVjdFwiKSB7XG4gICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh0aGlzLmhlYWRlcnMpKSB7XG4gICAgICAgIGhlYWRlcnNbYCR7a2V5fWBdID0gdmFsdWVcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuYXV0aCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgaGVhZGVycy5BdXRob3JpemF0aW9uID0gYEJlYXJlciAke3RoaXMuYXV0aH1gXG4gICAgfVxuICAgIHJldHVybiBoZWFkZXJzXG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhbiBBUEkgdG8gdGhlIG1pZGRsZXdhcmUuIFRoZSBBUEkgcmVzb2x2ZXMgdG8gYSByZWdpc3RlcmVkIGJsb2NrY2hhaW4ncyBSUEMuXG4gICAqXG4gICAqIEluIFR5cGVTY3JpcHQ6XG4gICAqIGBgYGpzXG4gICAqIGF4aWEuYWRkQVBJPE15Vk1DbGFzcz4oXCJteWNoYWluXCIsIE15Vk1DbGFzcywgXCIvZXh0L2JjL215Y2hhaW5cIilcbiAgICogYGBgXG4gICAqXG4gICAqIEluIEphdmFzY3JpcHQ6XG4gICAqIGBgYGpzXG4gICAqIGF4aWEuYWRkQVBJKFwibXljaGFpblwiLCBNeVZNQ2xhc3MsIFwiL2V4dC9iYy9teWNoYWluXCIpXG4gICAqIGBgYFxuICAgKlxuICAgKiBAdHlwZXBhcmFtIEdBIENsYXNzIG9mIHRoZSBBUEkgYmVpbmcgYWRkZWRcbiAgICogQHBhcmFtIGFwaU5hbWUgQSBsYWJlbCBmb3IgcmVmZXJlbmNpbmcgdGhlIEFQSSBpbiB0aGUgZnV0dXJlXG4gICAqIEBwYXJhbSBDb25zdHJ1Y3RvckZOIEEgcmVmZXJlbmNlIHRvIHRoZSBjbGFzcyB3aGljaCBpbnN0YW50aWF0ZXMgdGhlIEFQSVxuICAgKiBAcGFyYW0gYmFzZXVybCBQYXRoIHRvIHJlc29sdmUgdG8gcmVhY2ggdGhlIEFQSVxuICAgKlxuICAgKi9cbiAgYWRkQVBJID0gPEdBIGV4dGVuZHMgQVBJQmFzZT4oXG4gICAgYXBpTmFtZTogc3RyaW5nLFxuICAgIENvbnN0cnVjdG9yRk46IG5ldyAoYXhjOiBBeGlhQ29yZSwgYmFzZXVybD86IHN0cmluZywgLi4uYXJnczogYW55W10pID0+IEdBLFxuICAgIGJhc2V1cmw6IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICAuLi5hcmdzOiBhbnlbXVxuICApID0+IHtcbiAgICBpZiAodHlwZW9mIGJhc2V1cmwgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMuYXBpc1tgJHthcGlOYW1lfWBdID0gbmV3IENvbnN0cnVjdG9yRk4odGhpcywgdW5kZWZpbmVkLCAuLi5hcmdzKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmFwaXNbYCR7YXBpTmFtZX1gXSA9IG5ldyBDb25zdHJ1Y3RvckZOKHRoaXMsIGJhc2V1cmwsIC4uLmFyZ3MpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIHJlZmVyZW5jZSB0byBhbiBBUEkgYnkgaXRzIGFwaU5hbWUgbGFiZWwuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlOYW1lIE5hbWUgb2YgdGhlIEFQSSB0byByZXR1cm5cbiAgICovXG4gIGFwaSA9IDxHQSBleHRlbmRzIEFQSUJhc2U+KGFwaU5hbWU6IHN0cmluZyk6IEdBID0+XG4gICAgdGhpcy5hcGlzW2Ake2FwaU5hbWV9YF0gYXMgR0FcblxuICAvKipcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgcHJvdGVjdGVkIF9yZXF1ZXN0ID0gYXN5bmMgKFxuICAgIHhocm1ldGhvZDogTWV0aG9kLFxuICAgIGJhc2V1cmw6IHN0cmluZyxcbiAgICBnZXRkYXRhOiBvYmplY3QsXG4gICAgcG9zdGRhdGE6IHN0cmluZyB8IG9iamVjdCB8IEFycmF5QnVmZmVyIHwgQXJyYXlCdWZmZXJWaWV3LFxuICAgIGhlYWRlcnM6IGFueSA9IHt9LFxuICAgIGF4aW9zQ29uZmlnOiBBeGlvc1JlcXVlc3RDb25maWcgPSB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PiB7XG4gICAgbGV0IGNvbmZpZzogQXhpb3NSZXF1ZXN0Q29uZmlnXG4gICAgaWYgKGF4aW9zQ29uZmlnKSB7XG4gICAgICBjb25maWcgPSB7XG4gICAgICAgIC4uLmF4aW9zQ29uZmlnLFxuICAgICAgICAuLi50aGlzLnJlcXVlc3RDb25maWdcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uZmlnID0ge1xuICAgICAgICBiYXNlVVJMOiB0aGlzLnVybCxcbiAgICAgICAgcmVzcG9uc2VUeXBlOiBcInRleHRcIixcbiAgICAgICAgLi4udGhpcy5yZXF1ZXN0Q29uZmlnXG4gICAgICB9XG4gICAgfVxuICAgIGNvbmZpZy51cmwgPSBiYXNldXJsXG4gICAgY29uZmlnLm1ldGhvZCA9IHhocm1ldGhvZFxuICAgIGNvbmZpZy5oZWFkZXJzID0gaGVhZGVyc1xuICAgIGNvbmZpZy5kYXRhID0gcG9zdGRhdGFcbiAgICBjb25maWcucGFyYW1zID0gZ2V0ZGF0YVxuICAgIC8vIHVzZSB0aGUgZmV0Y2ggYWRhcHRlciBpZiBmZXRjaCBpcyBhdmFpbGFibGUgZS5nLiBub24gTm9kZTwxNyBlbnZcbiAgICBpZiAodHlwZW9mIGZldGNoICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBjb25maWcuYWRhcHRlciA9IGZldGNoQWRhcHRlclxuICAgIH1cbiAgICBjb25zdCByZXNwOiBBeGlvc1Jlc3BvbnNlPGFueT4gPSBhd2FpdCBheGlvcy5yZXF1ZXN0KGNvbmZpZylcbiAgICAvLyBwdXJnaW5nIGFsbCB0aGF0IGlzIGF4aW9zXG4gICAgY29uc3QgeGhyZGF0YTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IG5ldyBSZXF1ZXN0UmVzcG9uc2VEYXRhKFxuICAgICAgcmVzcC5kYXRhLFxuICAgICAgcmVzcC5oZWFkZXJzLFxuICAgICAgcmVzcC5zdGF0dXMsXG4gICAgICByZXNwLnN0YXR1c1RleHQsXG4gICAgICByZXNwLnJlcXVlc3RcbiAgICApXG4gICAgcmV0dXJuIHhocmRhdGFcbiAgfVxuXG4gIC8qKlxuICAgKiBNYWtlcyBhIEdFVCBjYWxsIHRvIGFuIEFQSS5cbiAgICpcbiAgICogQHBhcmFtIGJhc2V1cmwgUGF0aCB0byB0aGUgYXBpXG4gICAqIEBwYXJhbSBnZXRkYXRhIE9iamVjdCBjb250YWluaW5nIHRoZSBrZXkgdmFsdWUgcGFpcnMgc2VudCBpbiBHRVRcbiAgICogQHBhcmFtIGhlYWRlcnMgQW4gYXJyYXkgSFRUUCBSZXF1ZXN0IEhlYWRlcnNcbiAgICogQHBhcmFtIGF4aW9zQ29uZmlnIENvbmZpZ3VyYXRpb24gZm9yIHRoZSBheGlvcyBqYXZhc2NyaXB0IGxpYnJhcnkgdGhhdCB3aWxsIGJlIHRoZVxuICAgKiBmb3VuZGF0aW9uIGZvciB0aGUgcmVzdCBvZiB0aGUgcGFyYW1ldGVyc1xuICAgKlxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgZm9yIFtbUmVxdWVzdFJlc3BvbnNlRGF0YV1dXG4gICAqL1xuICBnZXQgPSAoXG4gICAgYmFzZXVybDogc3RyaW5nLFxuICAgIGdldGRhdGE6IG9iamVjdCxcbiAgICBoZWFkZXJzOiBvYmplY3QgPSB7fSxcbiAgICBheGlvc0NvbmZpZzogQXhpb3NSZXF1ZXN0Q29uZmlnID0gdW5kZWZpbmVkXG4gICk6IFByb21pc2U8UmVxdWVzdFJlc3BvbnNlRGF0YT4gPT5cbiAgICB0aGlzLl9yZXF1ZXN0KFxuICAgICAgXCJHRVRcIixcbiAgICAgIGJhc2V1cmwsXG4gICAgICBnZXRkYXRhLFxuICAgICAge30sXG4gICAgICB0aGlzLl9zZXRIZWFkZXJzKGhlYWRlcnMpLFxuICAgICAgYXhpb3NDb25maWdcbiAgICApXG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgREVMRVRFIGNhbGwgdG8gYW4gQVBJLlxuICAgKlxuICAgKiBAcGFyYW0gYmFzZXVybCBQYXRoIHRvIHRoZSBBUElcbiAgICogQHBhcmFtIGdldGRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGtleSB2YWx1ZSBwYWlycyBzZW50IGluIERFTEVURVxuICAgKiBAcGFyYW0gaGVhZGVycyBBbiBhcnJheSBIVFRQIFJlcXVlc3QgSGVhZGVyc1xuICAgKiBAcGFyYW0gYXhpb3NDb25maWcgQ29uZmlndXJhdGlvbiBmb3IgdGhlIGF4aW9zIGphdmFzY3JpcHQgbGlicmFyeSB0aGF0IHdpbGwgYmUgdGhlXG4gICAqIGZvdW5kYXRpb24gZm9yIHRoZSByZXN0IG9mIHRoZSBwYXJhbWV0ZXJzXG4gICAqXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSBmb3IgW1tSZXF1ZXN0UmVzcG9uc2VEYXRhXV1cbiAgICovXG4gIGRlbGV0ZSA9IChcbiAgICBiYXNldXJsOiBzdHJpbmcsXG4gICAgZ2V0ZGF0YTogb2JqZWN0LFxuICAgIGhlYWRlcnM6IG9iamVjdCA9IHt9LFxuICAgIGF4aW9zQ29uZmlnOiBBeGlvc1JlcXVlc3RDb25maWcgPSB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PlxuICAgIHRoaXMuX3JlcXVlc3QoXG4gICAgICBcIkRFTEVURVwiLFxuICAgICAgYmFzZXVybCxcbiAgICAgIGdldGRhdGEsXG4gICAgICB7fSxcbiAgICAgIHRoaXMuX3NldEhlYWRlcnMoaGVhZGVycyksXG4gICAgICBheGlvc0NvbmZpZ1xuICAgIClcblxuICAvKipcbiAgICogTWFrZXMgYSBQT1NUIGNhbGwgdG8gYW4gQVBJLlxuICAgKlxuICAgKiBAcGFyYW0gYmFzZXVybCBQYXRoIHRvIHRoZSBBUElcbiAgICogQHBhcmFtIGdldGRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGtleSB2YWx1ZSBwYWlycyBzZW50IGluIFBPU1RcbiAgICogQHBhcmFtIHBvc3RkYXRhIE9iamVjdCBjb250YWluaW5nIHRoZSBrZXkgdmFsdWUgcGFpcnMgc2VudCBpbiBQT1NUXG4gICAqIEBwYXJhbSBoZWFkZXJzIEFuIGFycmF5IEhUVFAgUmVxdWVzdCBIZWFkZXJzXG4gICAqIEBwYXJhbSBheGlvc0NvbmZpZyBDb25maWd1cmF0aW9uIGZvciB0aGUgYXhpb3MgamF2YXNjcmlwdCBsaWJyYXJ5IHRoYXQgd2lsbCBiZSB0aGVcbiAgICogZm91bmRhdGlvbiBmb3IgdGhlIHJlc3Qgb2YgdGhlIHBhcmFtZXRlcnNcbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIGZvciBbW1JlcXVlc3RSZXNwb25zZURhdGFdXVxuICAgKi9cbiAgcG9zdCA9IChcbiAgICBiYXNldXJsOiBzdHJpbmcsXG4gICAgZ2V0ZGF0YTogb2JqZWN0LFxuICAgIHBvc3RkYXRhOiBzdHJpbmcgfCBvYmplY3QgfCBBcnJheUJ1ZmZlciB8IEFycmF5QnVmZmVyVmlldyxcbiAgICBoZWFkZXJzOiBvYmplY3QgPSB7fSxcbiAgICBheGlvc0NvbmZpZzogQXhpb3NSZXF1ZXN0Q29uZmlnID0gdW5kZWZpbmVkXG4gICk6IFByb21pc2U8UmVxdWVzdFJlc3BvbnNlRGF0YT4gPT5cbiAgICB0aGlzLl9yZXF1ZXN0KFxuICAgICAgXCJQT1NUXCIsXG4gICAgICBiYXNldXJsLFxuICAgICAgZ2V0ZGF0YSxcbiAgICAgIHBvc3RkYXRhLFxuICAgICAgdGhpcy5fc2V0SGVhZGVycyhoZWFkZXJzKSxcbiAgICAgIGF4aW9zQ29uZmlnXG4gICAgKVxuXG4gIC8qKlxuICAgKiBNYWtlcyBhIFBVVCBjYWxsIHRvIGFuIEFQSS5cbiAgICpcbiAgICogQHBhcmFtIGJhc2V1cmwgUGF0aCB0byB0aGUgYmFzZXVybFxuICAgKiBAcGFyYW0gZ2V0ZGF0YSBPYmplY3QgY29udGFpbmluZyB0aGUga2V5IHZhbHVlIHBhaXJzIHNlbnQgaW4gUFVUXG4gICAqIEBwYXJhbSBwb3N0ZGF0YSBPYmplY3QgY29udGFpbmluZyB0aGUga2V5IHZhbHVlIHBhaXJzIHNlbnQgaW4gUFVUXG4gICAqIEBwYXJhbSBoZWFkZXJzIEFuIGFycmF5IEhUVFAgUmVxdWVzdCBIZWFkZXJzXG4gICAqIEBwYXJhbSBheGlvc0NvbmZpZyBDb25maWd1cmF0aW9uIGZvciB0aGUgYXhpb3MgamF2YXNjcmlwdCBsaWJyYXJ5IHRoYXQgd2lsbCBiZSB0aGVcbiAgICogZm91bmRhdGlvbiBmb3IgdGhlIHJlc3Qgb2YgdGhlIHBhcmFtZXRlcnNcbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIGZvciBbW1JlcXVlc3RSZXNwb25zZURhdGFdXVxuICAgKi9cbiAgcHV0ID0gKFxuICAgIGJhc2V1cmw6IHN0cmluZyxcbiAgICBnZXRkYXRhOiBvYmplY3QsXG4gICAgcG9zdGRhdGE6IHN0cmluZyB8IG9iamVjdCB8IEFycmF5QnVmZmVyIHwgQXJyYXlCdWZmZXJWaWV3LFxuICAgIGhlYWRlcnM6IG9iamVjdCA9IHt9LFxuICAgIGF4aW9zQ29uZmlnOiBBeGlvc1JlcXVlc3RDb25maWcgPSB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxSZXF1ZXN0UmVzcG9uc2VEYXRhPiA9PlxuICAgIHRoaXMuX3JlcXVlc3QoXG4gICAgICBcIlBVVFwiLFxuICAgICAgYmFzZXVybCxcbiAgICAgIGdldGRhdGEsXG4gICAgICBwb3N0ZGF0YSxcbiAgICAgIHRoaXMuX3NldEhlYWRlcnMoaGVhZGVycyksXG4gICAgICBheGlvc0NvbmZpZ1xuICAgIClcblxuICAvKipcbiAgICogTWFrZXMgYSBQQVRDSCBjYWxsIHRvIGFuIEFQSS5cbiAgICpcbiAgICogQHBhcmFtIGJhc2V1cmwgUGF0aCB0byB0aGUgYmFzZXVybFxuICAgKiBAcGFyYW0gZ2V0ZGF0YSBPYmplY3QgY29udGFpbmluZyB0aGUga2V5IHZhbHVlIHBhaXJzIHNlbnQgaW4gUEFUQ0hcbiAgICogQHBhcmFtIHBvc3RkYXRhIE9iamVjdCBjb250YWluaW5nIHRoZSBrZXkgdmFsdWUgcGFpcnMgc2VudCBpbiBQQVRDSFxuICAgKiBAcGFyYW0gcGFyYW1ldGVycyBPYmplY3QgY29udGFpbmluZyB0aGUgcGFyYW1ldGVycyBvZiB0aGUgQVBJIGNhbGxcbiAgICogQHBhcmFtIGhlYWRlcnMgQW4gYXJyYXkgSFRUUCBSZXF1ZXN0IEhlYWRlcnNcbiAgICogQHBhcmFtIGF4aW9zQ29uZmlnIENvbmZpZ3VyYXRpb24gZm9yIHRoZSBheGlvcyBqYXZhc2NyaXB0IGxpYnJhcnkgdGhhdCB3aWxsIGJlIHRoZVxuICAgKiBmb3VuZGF0aW9uIGZvciB0aGUgcmVzdCBvZiB0aGUgcGFyYW1ldGVyc1xuICAgKlxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgZm9yIFtbUmVxdWVzdFJlc3BvbnNlRGF0YV1dXG4gICAqL1xuICBwYXRjaCA9IChcbiAgICBiYXNldXJsOiBzdHJpbmcsXG4gICAgZ2V0ZGF0YTogb2JqZWN0LFxuICAgIHBvc3RkYXRhOiBzdHJpbmcgfCBvYmplY3QgfCBBcnJheUJ1ZmZlciB8IEFycmF5QnVmZmVyVmlldyxcbiAgICBoZWFkZXJzOiBvYmplY3QgPSB7fSxcbiAgICBheGlvc0NvbmZpZzogQXhpb3NSZXF1ZXN0Q29uZmlnID0gdW5kZWZpbmVkXG4gICk6IFByb21pc2U8UmVxdWVzdFJlc3BvbnNlRGF0YT4gPT5cbiAgICB0aGlzLl9yZXF1ZXN0KFxuICAgICAgXCJQQVRDSFwiLFxuICAgICAgYmFzZXVybCxcbiAgICAgIGdldGRhdGEsXG4gICAgICBwb3N0ZGF0YSxcbiAgICAgIHRoaXMuX3NldEhlYWRlcnMoaGVhZGVycyksXG4gICAgICBheGlvc0NvbmZpZ1xuICAgIClcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBBeGlhIGluc3RhbmNlLiBTZXRzIHRoZSBhZGRyZXNzIGFuZCBwb3J0IG9mIHRoZSBtYWluIEF4aWEgQ2xpZW50LlxuICAgKlxuICAgKiBAcGFyYW0gaG9zdCBUaGUgaG9zdG5hbWUgdG8gcmVzb2x2ZSB0byByZWFjaCB0aGUgQXhpYSBDbGllbnQgQVBJc1xuICAgKiBAcGFyYW0gcG9ydCBUaGUgcG9ydCB0byByZXNvbHZlIHRvIHJlYWNoIHRoZSBBeGlhIENsaWVudCBBUElzXG4gICAqIEBwYXJhbSBwcm90b2NvbCBUaGUgcHJvdG9jb2wgc3RyaW5nIHRvIHVzZSBiZWZvcmUgYSBcIjovL1wiIGluIGEgcmVxdWVzdCwgZXg6IFwiaHR0cFwiLCBcImh0dHBzXCIsIFwiZ2l0XCIsIFwid3NcIiwgZXRjIC4uLlxuICAgKi9cbiAgY29uc3RydWN0b3IoaG9zdD86IHN0cmluZywgcG9ydD86IG51bWJlciwgcHJvdG9jb2w6IHN0cmluZyA9IFwiaHR0cFwiKSB7XG4gICAgaWYgKGhvc3QgIT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnNldEFkZHJlc3MoaG9zdCwgcG9ydCwgcHJvdG9jb2wpXG4gICAgfVxuICB9XG59XG4iXX0=