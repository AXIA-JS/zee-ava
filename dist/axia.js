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
 * let axia = new AxiaCore("127.0.0.1", 80, "https")
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXhpYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9heGlhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsa0RBQXdFO0FBQ3hFLDhDQUErRDtBQUMvRCwyQ0FBOEM7QUFDOUMsdURBQW1EO0FBQ25ELDZEQUF5RDtBQUV6RDs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFxQixRQUFRO0lBa2IzQjs7Ozs7O09BTUc7SUFDSCxZQUFZLElBQWEsRUFBRSxJQUFhLEVBQUUsV0FBbUIsTUFBTTtRQXhiekQsY0FBUyxHQUFXLENBQUMsQ0FBQTtRQUNyQixRQUFHLEdBQVcsRUFBRSxDQUFBO1FBT2hCLFNBQUksR0FBVyxTQUFTLENBQUE7UUFDeEIsWUFBTyxHQUE0QixFQUFFLENBQUE7UUFDckMsa0JBQWEsR0FBdUIsRUFBRSxDQUFBO1FBQ3RDLFNBQUksR0FBNkIsRUFBRSxDQUFBO1FBRTdDOzs7Ozs7Ozs7OztXQVdHO1FBQ0gsZUFBVSxHQUFHLENBQ1gsSUFBWSxFQUNaLElBQVksRUFDWixXQUFtQixNQUFNLEVBQ3pCLGVBQXVCLEVBQUUsRUFDbkIsRUFBRTtZQUNSLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHdCQUF3QixFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ2pELFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLHdCQUF3QixFQUFFLEVBQUUsQ0FBQyxDQUFBO1lBQ3pELE1BQU0sU0FBUyxHQUFhLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1lBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUNqQywwQkFBMEI7Z0JBQzFCLE1BQU0sSUFBSSxzQkFBYSxDQUFDLCtDQUErQyxDQUFDLENBQUE7YUFDekU7WUFFRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtZQUNoQixJQUFJLENBQUMsSUFBSSxHQUFHLElB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QVVELElBQUksSUFBSSxJQUFJLFNBQVMsRUFBRTtZQUNyQixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUE7U0FDdEM7SUFDSCxDQUFDO0NBQ0Y7QUE5YkQsMkJBOGJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQXhpYUNvcmVcbiAqL1xuaW1wb3J0IGF4aW9zLCB7IEF4aW9zUmVxdWVzdENvbmZpZywgQXhpb3NSZXNwb25zZSwgTWV0aG9kIH0gZnJvbSBcImF4aW9zXCJcbmltcG9ydCB7IEFQSUJhc2UsIFJlcXVlc3RSZXNwb25zZURhdGEgfSBmcm9tIFwiLi9jb21tb24vYXBpYmFzZVwiXG5pbXBvcnQgeyBQcm90b2NvbEVycm9yIH0gZnJvbSBcIi4vdXRpbHMvZXJyb3JzXCJcbmltcG9ydCB7IGZldGNoQWRhcHRlciB9IGZyb20gXCIuL3V0aWxzL2ZldGNoYWRhcHRlclwiXG5pbXBvcnQgeyBnZXRQcmVmZXJyZWRIUlAgfSBmcm9tIFwiLi91dGlscy9oZWxwZXJmdW5jdGlvbnNcIlxuXG4vKipcbiAqIEF4aWFDb3JlIGlzIG1pZGRsZXdhcmUgZm9yIGludGVyYWN0aW5nIHdpdGggQXhpYSBub2RlIFJQQyBBUElzLlxuICpcbiAqIEV4YW1wbGUgdXNhZ2U6XG4gKiBgYGBqc1xuICogbGV0IGF4aWEgPSBuZXcgQXhpYUNvcmUoXCIxMjcuMC4wLjFcIiwgODAsIFwiaHR0cHNcIilcbiAqIGBgYFxuICpcbiAqXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEF4aWFDb3JlIHtcbiAgcHJvdGVjdGVkIG5ldHdvcmtJRDogbnVtYmVyID0gMFxuICBwcm90ZWN0ZWQgaHJwOiBzdHJpbmcgPSBcIlwiXG4gIHByb3RlY3RlZCBwcm90b2NvbDogc3RyaW5nXG4gIHByb3RlY3RlZCBpcDogc3RyaW5nXG4gIHByb3RlY3RlZCBob3N0OiBzdHJpbmdcbiAgcHJvdGVjdGVkIHBvcnQ6IG51bWJlclxuICBwcm90ZWN0ZWQgYmFzZUVuZHBvaW50OiBzdHJpbmdcbiAgcHJvdGVjdGVkIHVybDogc3RyaW5nXG4gIHByb3RlY3RlZCBhdXRoOiBzdHJpbmcgPSB1bmRlZmluZWRcbiAgcHJvdGVjdGVkIGhlYWRlcnM6IHsgW2s6IHN0cmluZ106IHN0cmluZyB9ID0ge31cbiAgcHJvdGVjdGVkIHJlcXVlc3RDb25maWc6IEF4aW9zUmVxdWVzdENvbmZpZyA9IHt9XG4gIHByb3RlY3RlZCBhcGlzOiB7IFtrOiBzdHJpbmddOiBBUElCYXNlIH0gPSB7fVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhZGRyZXNzIGFuZCBwb3J0IG9mIHRoZSBtYWluIEF4aWEgQ2xpZW50LlxuICAgKlxuICAgKiBAcGFyYW0gaG9zdCBUaGUgaG9zdG5hbWUgdG8gcmVzb2x2ZSB0byByZWFjaCB0aGUgQXhpYSBDbGllbnQgUlBDIEFQSXMuXG4gICAqIEBwYXJhbSBwb3J0IFRoZSBwb3J0IHRvIHJlc29sdmUgdG8gcmVhY2ggdGhlIEF4aWEgQ2xpZW50IFJQQyBBUElzLlxuICAgKiBAcGFyYW0gcHJvdG9jb2wgVGhlIHByb3RvY29sIHN0cmluZyB0byB1c2UgYmVmb3JlIGEgXCI6Ly9cIiBpbiBhIHJlcXVlc3QsXG4gICAqIGV4OiBcImh0dHBcIiwgXCJodHRwc1wiLCBldGMuIERlZmF1bHRzIHRvIGh0dHBcbiAgICogQHBhcmFtIGJhc2VFbmRwb2ludCB0aGUgYmFzZSBlbmRwb2ludCB0byByZWFjaCB0aGUgQXhpYSBDbGllbnQgUlBDIEFQSXMsXG4gICAqIGV4OiBcIi9ycGNcIi4gRGVmYXVsdHMgdG8gXCIvXCJcbiAgICogVGhlIGZvbGxvd2luZyBzcGVjaWFsIGNoYXJhY3RlcnMgYXJlIHJlbW92ZWQgZnJvbSBob3N0IGFuZCBwcm90b2NvbFxuICAgKiAmIyxAKygpJH4lJ1wiOio/e30gYWxzbyBsZXNzIHRoYW4gYW5kIGdyZWF0ZXIgdGhhbiBzaWduc1xuICAgKi9cbiAgc2V0QWRkcmVzcyA9IChcbiAgICBob3N0OiBzdHJpbmcsXG4gICAgcG9ydDogbnVtYmVyLFxuICAgIHByb3RvY29sOiBzdHJpbmcgPSBcImh0dHBcIixcbiAgICBiYXNlRW5kcG9pbnQ6IHN0cmluZyA9IFwiXCJcbiAgKTogdm9pZCA9PiB7XG4gICAgaG9zdCA9IGhvc3QucmVwbGFjZSgvWyYjLEArKCkkfiUnXCI6Kj88Pnt9XS9nLCBcIlwiKVxuICAgIHByb3RvY29sID0gcHJvdG9jb2wucmVwbGFjZSgvWyYjLEArKCkkfiUnXCI6Kj88Pnt9XS9nLCBcIlwiKVxuICAgIGNvbnN0IHByb3RvY29sczogc3RyaW5nW10gPSBbXCJodHRwXCIsIFwiaHR0cHNcIl1cbiAgICBpZiAoIXByb3RvY29scy5pbmNsdWRlcyhwcm90b2NvbCkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgUHJvdG9jb2xFcnJvcihcIkVycm9yIC0gQXhpYUNvcmUuc2V0QWRkcmVzczogSW52YWxpZCBwcm90b2NvbFwiKVxuICAgIH1cblxuICAgIHRoaXMuaG9zdCA9IGhvc3RcbiAgICB0aGlzLnBvcnQgPSBwb3J0XG4gICAgdGhpcy5wcm90b2NvbCA9IHByb3RvY29sXG4gICAgdGhpcy5iYXNlRW5kcG9pbnQgPSBiYXNlRW5kcG9pbnRcbiAgICBsZXQgdXJsOiBzdHJpbmcgPSBgJHtwcm90b2NvbH06Ly8ke2hvc3R9YFxuICAgIGlmIChwb3J0ICE9IHVuZGVmaW5lZCAmJiB0eXBlb2YgcG9ydCA9PT0gXCJudW1iZXJcIiAmJiBwb3J0ID49IDApIHtcbiAgICAgIHVybCA9IGAke3VybH06JHtwb3J0fWBcbiAgICB9XG4gICAgaWYgKFxuICAgICAgYmFzZUVuZHBvaW50ICE9IHVuZGVmaW5lZCAmJlxuICAgICAgdHlwZW9mIGJhc2VFbmRwb2ludCA9PSBcInN0cmluZ1wiICYmXG4gICAgICBiYXNlRW5kcG9pbnQubGVuZ3RoID4gMFxuICAgICkge1xuICAgICAgaWYgKGJhc2VFbmRwb2ludFswXSAhPSBcIi9cIikge1xuICAgICAgICBiYXNlRW5kcG9pbnQgPSBgLyR7YmFzZUVuZHBvaW50fWBcbiAgICAgIH1cbiAgICAgIHVybCA9IGAke3VybH0ke2Jhc2VFbmRwb2ludH1gXG4gICAgfVxuICAgIHRoaXMudXJsID0gdXJsXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcHJvdG9jb2wgc3VjaCBhcyBcImh0dHBcIiwgXCJodHRwc1wiLCBcImdpdFwiLCBcIndzXCIsIGV0Yy5cbiAgICovXG4gIGdldFByb3RvY29sID0gKCk6IHN0cmluZyA9PiB0aGlzLnByb3RvY29sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGhvc3QgZm9yIHRoZSBBeGlhIG5vZGUuXG4gICAqL1xuICBnZXRIb3N0ID0gKCk6IHN0cmluZyA9PiB0aGlzLmhvc3RcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgSVAgZm9yIHRoZSBBeGlhIG5vZGUuXG4gICAqL1xuICBnZXRJUCA9ICgpOiBzdHJpbmcgPT4gdGhpcy5ob3N0XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBvcnQgZm9yIHRoZSBBeGlhIG5vZGUuXG4gICAqL1xuICBnZXRQb3J0ID0gKCk6IG51bWJlciA9PiB0aGlzLnBvcnRcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYmFzZSBlbmRwb2ludCBmb3IgdGhlIEF4aWEgbm9kZS5cbiAgICovXG4gIGdldEJhc2VFbmRwb2ludCA9ICgpOiBzdHJpbmcgPT4gdGhpcy5iYXNlRW5kcG9pbnRcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgVVJMIG9mIHRoZSBBeGlhIG5vZGUgKGlwICsgcG9ydClcbiAgICovXG4gIGdldFVSTCA9ICgpOiBzdHJpbmcgPT4gdGhpcy51cmxcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY3VzdG9tIGhlYWRlcnNcbiAgICovXG4gIGdldEhlYWRlcnMgPSAoKTogb2JqZWN0ID0+IHRoaXMuaGVhZGVyc1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBjdXN0b20gcmVxdWVzdCBjb25maWdcbiAgICovXG4gIGdldFJlcXVlc3RDb25maWcgPSAoKTogQXhpb3NSZXF1ZXN0Q29uZmlnID0+IHRoaXMucmVxdWVzdENvbmZpZ1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBuZXR3b3JrSURcbiAgICovXG4gIGdldE5ldHdvcmtJRCA9ICgpOiBudW1iZXIgPT4gdGhpcy5uZXR3b3JrSURcblxuICAvKipcbiAgICogU2V0cyB0aGUgbmV0d29ya0lEXG4gICAqL1xuICBzZXROZXR3b3JrSUQgPSAobmV0SUQ6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgIHRoaXMubmV0d29ya0lEID0gbmV0SURcbiAgICB0aGlzLmhycCA9IGdldFByZWZlcnJlZEhSUCh0aGlzLm5ldHdvcmtJRClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBIdW1hbi1SZWFkYWJsZS1QYXJ0IG9mIHRoZSBuZXR3b3JrIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGtleS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIFtbS2V5UGFpcl1dJ3MgSHVtYW4tUmVhZGFibGUtUGFydCBvZiB0aGUgbmV0d29yaydzIEJlY2gzMiBhZGRyZXNzaW5nIHNjaGVtZVxuICAgKi9cbiAgZ2V0SFJQID0gKCk6IHN0cmluZyA9PiB0aGlzLmhycFxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB0aGUgSHVtYW4tUmVhZGFibGUtUGFydCBvZiB0aGUgbmV0d29yayBhc3NvY2lhdGVkIHdpdGggdGhpcyBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSBocnAgU3RyaW5nIGZvciB0aGUgSHVtYW4tUmVhZGFibGUtUGFydCBvZiBCZWNoMzIgYWRkcmVzc2VzXG4gICAqL1xuICBzZXRIUlAgPSAoaHJwOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICB0aGlzLmhycCA9IGhycFxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBuZXcgY3VzdG9tIGhlYWRlciB0byBiZSBpbmNsdWRlZCB3aXRoIGFsbCByZXF1ZXN0cy5cbiAgICpcbiAgICogQHBhcmFtIGtleSBIZWFkZXIgbmFtZVxuICAgKiBAcGFyYW0gdmFsdWUgSGVhZGVyIHZhbHVlXG4gICAqL1xuICBzZXRIZWFkZXIgPSAoa2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICB0aGlzLmhlYWRlcnNbYCR7a2V5fWBdID0gdmFsdWVcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgcHJldmlvdXNseSBhZGRlZCBjdXN0b20gaGVhZGVyLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IEhlYWRlciBuYW1lXG4gICAqL1xuICByZW1vdmVIZWFkZXIgPSAoa2V5OiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICBkZWxldGUgdGhpcy5oZWFkZXJzW2Ake2tleX1gXVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIGhlYWRlcnMuXG4gICAqL1xuICByZW1vdmVBbGxIZWFkZXJzID0gKCk6IHZvaWQgPT4ge1xuICAgIGZvciAoY29uc3QgcHJvcCBpbiB0aGlzLmhlYWRlcnMpIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodGhpcy5oZWFkZXJzLCBwcm9wKSkge1xuICAgICAgICBkZWxldGUgdGhpcy5oZWFkZXJzW2Ake3Byb3B9YF1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIG5ldyBjdXN0b20gY29uZmlnIHZhbHVlIHRvIGJlIGluY2x1ZGVkIHdpdGggYWxsIHJlcXVlc3RzLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IENvbmZpZyBuYW1lXG4gICAqIEBwYXJhbSB2YWx1ZSBDb25maWcgdmFsdWVcbiAgICovXG4gIHNldFJlcXVlc3RDb25maWcgPSAoa2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuKTogdm9pZCA9PiB7XG4gICAgdGhpcy5yZXF1ZXN0Q29uZmlnW2Ake2tleX1gXSA9IHZhbHVlXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIHByZXZpb3VzbHkgYWRkZWQgcmVxdWVzdCBjb25maWcuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgSGVhZGVyIG5hbWVcbiAgICovXG4gIHJlbW92ZVJlcXVlc3RDb25maWcgPSAoa2V5OiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICBkZWxldGUgdGhpcy5yZXF1ZXN0Q29uZmlnW2Ake2tleX1gXVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIHJlcXVlc3QgY29uZmlncy5cbiAgICovXG4gIHJlbW92ZUFsbFJlcXVlc3RDb25maWdzID0gKCk6IHZvaWQgPT4ge1xuICAgIGZvciAoY29uc3QgcHJvcCBpbiB0aGlzLnJlcXVlc3RDb25maWcpIHtcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodGhpcy5yZXF1ZXN0Q29uZmlnLCBwcm9wKSkge1xuICAgICAgICBkZWxldGUgdGhpcy5yZXF1ZXN0Q29uZmlnW2Ake3Byb3B9YF1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdGVtcG9yYXJ5IGF1dGggdG9rZW4gdXNlZCBmb3IgY29tbXVuaWNhdGluZyB3aXRoIHRoZSBub2RlLlxuICAgKlxuICAgKiBAcGFyYW0gYXV0aCBBIHRlbXBvcmFyeSB0b2tlbiBwcm92aWRlZCBieSB0aGUgbm9kZSBlbmFibGluZyBhY2Nlc3MgdG8gdGhlIGVuZHBvaW50cyBvbiB0aGUgbm9kZS5cbiAgICovXG4gIHNldEF1dGhUb2tlbiA9IChhdXRoOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICB0aGlzLmF1dGggPSBhdXRoXG4gIH1cblxuICBwcm90ZWN0ZWQgX3NldEhlYWRlcnMgPSAoaGVhZGVyczogYW55KTogYW55ID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMuaGVhZGVycyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModGhpcy5oZWFkZXJzKSkge1xuICAgICAgICBoZWFkZXJzW2Ake2tleX1gXSA9IHZhbHVlXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB0aGlzLmF1dGggPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGhlYWRlcnMuQXV0aG9yaXphdGlvbiA9IGBCZWFyZXIgJHt0aGlzLmF1dGh9YFxuICAgIH1cbiAgICByZXR1cm4gaGVhZGVyc1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYW4gQVBJIHRvIHRoZSBtaWRkbGV3YXJlLiBUaGUgQVBJIHJlc29sdmVzIHRvIGEgcmVnaXN0ZXJlZCBibG9ja2NoYWluJ3MgUlBDLlxuICAgKlxuICAgKiBJbiBUeXBlU2NyaXB0OlxuICAgKiBgYGBqc1xuICAgKiBheGlhLmFkZEFQSTxNeVZNQ2xhc3M+KFwibXljaGFpblwiLCBNeVZNQ2xhc3MsIFwiL2V4dC9iYy9teWNoYWluXCIpXG4gICAqIGBgYFxuICAgKlxuICAgKiBJbiBKYXZhc2NyaXB0OlxuICAgKiBgYGBqc1xuICAgKiBheGlhLmFkZEFQSShcIm15Y2hhaW5cIiwgTXlWTUNsYXNzLCBcIi9leHQvYmMvbXljaGFpblwiKVxuICAgKiBgYGBcbiAgICpcbiAgICogQHR5cGVwYXJhbSBHQSBDbGFzcyBvZiB0aGUgQVBJIGJlaW5nIGFkZGVkXG4gICAqIEBwYXJhbSBhcGlOYW1lIEEgbGFiZWwgZm9yIHJlZmVyZW5jaW5nIHRoZSBBUEkgaW4gdGhlIGZ1dHVyZVxuICAgKiBAcGFyYW0gQ29uc3RydWN0b3JGTiBBIHJlZmVyZW5jZSB0byB0aGUgY2xhc3Mgd2hpY2ggaW5zdGFudGlhdGVzIHRoZSBBUElcbiAgICogQHBhcmFtIGJhc2V1cmwgUGF0aCB0byByZXNvbHZlIHRvIHJlYWNoIHRoZSBBUElcbiAgICpcbiAgICovXG4gIGFkZEFQSSA9IDxHQSBleHRlbmRzIEFQSUJhc2U+KFxuICAgIGFwaU5hbWU6IHN0cmluZyxcbiAgICBDb25zdHJ1Y3RvckZOOiBuZXcgKGF4YzogQXhpYUNvcmUsIGJhc2V1cmw/OiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKSA9PiBHQSxcbiAgICBiYXNldXJsOiBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgLi4uYXJnczogYW55W11cbiAgKSA9PiB7XG4gICAgaWYgKHR5cGVvZiBiYXNldXJsID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLmFwaXNbYCR7YXBpTmFtZX1gXSA9IG5ldyBDb25zdHJ1Y3RvckZOKHRoaXMsIHVuZGVmaW5lZCwgLi4uYXJncylcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5hcGlzW2Ake2FwaU5hbWV9YF0gPSBuZXcgQ29uc3RydWN0b3JGTih0aGlzLCBiYXNldXJsLCAuLi5hcmdzKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYSByZWZlcmVuY2UgdG8gYW4gQVBJIGJ5IGl0cyBhcGlOYW1lIGxhYmVsLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpTmFtZSBOYW1lIG9mIHRoZSBBUEkgdG8gcmV0dXJuXG4gICAqL1xuICBhcGkgPSA8R0EgZXh0ZW5kcyBBUElCYXNlPihhcGlOYW1lOiBzdHJpbmcpOiBHQSA9PlxuICAgIHRoaXMuYXBpc1tgJHthcGlOYW1lfWBdIGFzIEdBXG5cbiAgLyoqXG4gICAqIEBpZ25vcmVcbiAgICovXG4gIHByb3RlY3RlZCBfcmVxdWVzdCA9IGFzeW5jIChcbiAgICB4aHJtZXRob2Q6IE1ldGhvZCxcbiAgICBiYXNldXJsOiBzdHJpbmcsXG4gICAgZ2V0ZGF0YTogb2JqZWN0LFxuICAgIHBvc3RkYXRhOiBzdHJpbmcgfCBvYmplY3QgfCBBcnJheUJ1ZmZlciB8IEFycmF5QnVmZmVyVmlldyxcbiAgICBoZWFkZXJzOiBhbnkgPSB7fSxcbiAgICBheGlvc0NvbmZpZzogQXhpb3NSZXF1ZXN0Q29uZmlnID0gdW5kZWZpbmVkXG4gICk6IFByb21pc2U8UmVxdWVzdFJlc3BvbnNlRGF0YT4gPT4ge1xuICAgIGxldCBjb25maWc6IEF4aW9zUmVxdWVzdENvbmZpZ1xuICAgIGlmIChheGlvc0NvbmZpZykge1xuICAgICAgY29uZmlnID0ge1xuICAgICAgICAuLi5heGlvc0NvbmZpZyxcbiAgICAgICAgLi4udGhpcy5yZXF1ZXN0Q29uZmlnXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbmZpZyA9IHtcbiAgICAgICAgYmFzZVVSTDogdGhpcy51cmwsXG4gICAgICAgIHJlc3BvbnNlVHlwZTogXCJ0ZXh0XCIsXG4gICAgICAgIC4uLnRoaXMucmVxdWVzdENvbmZpZ1xuICAgICAgfVxuICAgIH1cbiAgICBjb25maWcudXJsID0gYmFzZXVybFxuICAgIGNvbmZpZy5tZXRob2QgPSB4aHJtZXRob2RcbiAgICBjb25maWcuaGVhZGVycyA9IGhlYWRlcnNcbiAgICBjb25maWcuZGF0YSA9IHBvc3RkYXRhXG4gICAgY29uZmlnLnBhcmFtcyA9IGdldGRhdGFcbiAgICAvLyB1c2UgdGhlIGZldGNoIGFkYXB0ZXIgaWYgZmV0Y2ggaXMgYXZhaWxhYmxlIGUuZy4gbm9uIE5vZGU8MTcgZW52XG4gICAgaWYgKHR5cGVvZiBmZXRjaCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgY29uZmlnLmFkYXB0ZXIgPSBmZXRjaEFkYXB0ZXJcbiAgICB9XG4gICAgY29uc3QgcmVzcDogQXhpb3NSZXNwb25zZTxhbnk+ID0gYXdhaXQgYXhpb3MucmVxdWVzdChjb25maWcpXG4gICAgLy8gcHVyZ2luZyBhbGwgdGhhdCBpcyBheGlvc1xuICAgIGNvbnN0IHhocmRhdGE6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBuZXcgUmVxdWVzdFJlc3BvbnNlRGF0YShcbiAgICAgIHJlc3AuZGF0YSxcbiAgICAgIHJlc3AuaGVhZGVycyxcbiAgICAgIHJlc3Auc3RhdHVzLFxuICAgICAgcmVzcC5zdGF0dXNUZXh0LFxuICAgICAgcmVzcC5yZXF1ZXN0XG4gICAgKVxuICAgIHJldHVybiB4aHJkYXRhXG4gIH1cblxuICAvKipcbiAgICogTWFrZXMgYSBHRVQgY2FsbCB0byBhbiBBUEkuXG4gICAqXG4gICAqIEBwYXJhbSBiYXNldXJsIFBhdGggdG8gdGhlIGFwaVxuICAgKiBAcGFyYW0gZ2V0ZGF0YSBPYmplY3QgY29udGFpbmluZyB0aGUga2V5IHZhbHVlIHBhaXJzIHNlbnQgaW4gR0VUXG4gICAqIEBwYXJhbSBoZWFkZXJzIEFuIGFycmF5IEhUVFAgUmVxdWVzdCBIZWFkZXJzXG4gICAqIEBwYXJhbSBheGlvc0NvbmZpZyBDb25maWd1cmF0aW9uIGZvciB0aGUgYXhpb3MgamF2YXNjcmlwdCBsaWJyYXJ5IHRoYXQgd2lsbCBiZSB0aGVcbiAgICogZm91bmRhdGlvbiBmb3IgdGhlIHJlc3Qgb2YgdGhlIHBhcmFtZXRlcnNcbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIGZvciBbW1JlcXVlc3RSZXNwb25zZURhdGFdXVxuICAgKi9cbiAgZ2V0ID0gKFxuICAgIGJhc2V1cmw6IHN0cmluZyxcbiAgICBnZXRkYXRhOiBvYmplY3QsXG4gICAgaGVhZGVyczogb2JqZWN0ID0ge30sXG4gICAgYXhpb3NDb25maWc6IEF4aW9zUmVxdWVzdENvbmZpZyA9IHVuZGVmaW5lZFxuICApOiBQcm9taXNlPFJlcXVlc3RSZXNwb25zZURhdGE+ID0+XG4gICAgdGhpcy5fcmVxdWVzdChcbiAgICAgIFwiR0VUXCIsXG4gICAgICBiYXNldXJsLFxuICAgICAgZ2V0ZGF0YSxcbiAgICAgIHt9LFxuICAgICAgdGhpcy5fc2V0SGVhZGVycyhoZWFkZXJzKSxcbiAgICAgIGF4aW9zQ29uZmlnXG4gICAgKVxuXG4gIC8qKlxuICAgKiBNYWtlcyBhIERFTEVURSBjYWxsIHRvIGFuIEFQSS5cbiAgICpcbiAgICogQHBhcmFtIGJhc2V1cmwgUGF0aCB0byB0aGUgQVBJXG4gICAqIEBwYXJhbSBnZXRkYXRhIE9iamVjdCBjb250YWluaW5nIHRoZSBrZXkgdmFsdWUgcGFpcnMgc2VudCBpbiBERUxFVEVcbiAgICogQHBhcmFtIGhlYWRlcnMgQW4gYXJyYXkgSFRUUCBSZXF1ZXN0IEhlYWRlcnNcbiAgICogQHBhcmFtIGF4aW9zQ29uZmlnIENvbmZpZ3VyYXRpb24gZm9yIHRoZSBheGlvcyBqYXZhc2NyaXB0IGxpYnJhcnkgdGhhdCB3aWxsIGJlIHRoZVxuICAgKiBmb3VuZGF0aW9uIGZvciB0aGUgcmVzdCBvZiB0aGUgcGFyYW1ldGVyc1xuICAgKlxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgZm9yIFtbUmVxdWVzdFJlc3BvbnNlRGF0YV1dXG4gICAqL1xuICBkZWxldGUgPSAoXG4gICAgYmFzZXVybDogc3RyaW5nLFxuICAgIGdldGRhdGE6IG9iamVjdCxcbiAgICBoZWFkZXJzOiBvYmplY3QgPSB7fSxcbiAgICBheGlvc0NvbmZpZzogQXhpb3NSZXF1ZXN0Q29uZmlnID0gdW5kZWZpbmVkXG4gICk6IFByb21pc2U8UmVxdWVzdFJlc3BvbnNlRGF0YT4gPT5cbiAgICB0aGlzLl9yZXF1ZXN0KFxuICAgICAgXCJERUxFVEVcIixcbiAgICAgIGJhc2V1cmwsXG4gICAgICBnZXRkYXRhLFxuICAgICAge30sXG4gICAgICB0aGlzLl9zZXRIZWFkZXJzKGhlYWRlcnMpLFxuICAgICAgYXhpb3NDb25maWdcbiAgICApXG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgUE9TVCBjYWxsIHRvIGFuIEFQSS5cbiAgICpcbiAgICogQHBhcmFtIGJhc2V1cmwgUGF0aCB0byB0aGUgQVBJXG4gICAqIEBwYXJhbSBnZXRkYXRhIE9iamVjdCBjb250YWluaW5nIHRoZSBrZXkgdmFsdWUgcGFpcnMgc2VudCBpbiBQT1NUXG4gICAqIEBwYXJhbSBwb3N0ZGF0YSBPYmplY3QgY29udGFpbmluZyB0aGUga2V5IHZhbHVlIHBhaXJzIHNlbnQgaW4gUE9TVFxuICAgKiBAcGFyYW0gaGVhZGVycyBBbiBhcnJheSBIVFRQIFJlcXVlc3QgSGVhZGVyc1xuICAgKiBAcGFyYW0gYXhpb3NDb25maWcgQ29uZmlndXJhdGlvbiBmb3IgdGhlIGF4aW9zIGphdmFzY3JpcHQgbGlicmFyeSB0aGF0IHdpbGwgYmUgdGhlXG4gICAqIGZvdW5kYXRpb24gZm9yIHRoZSByZXN0IG9mIHRoZSBwYXJhbWV0ZXJzXG4gICAqXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSBmb3IgW1tSZXF1ZXN0UmVzcG9uc2VEYXRhXV1cbiAgICovXG4gIHBvc3QgPSAoXG4gICAgYmFzZXVybDogc3RyaW5nLFxuICAgIGdldGRhdGE6IG9iamVjdCxcbiAgICBwb3N0ZGF0YTogc3RyaW5nIHwgb2JqZWN0IHwgQXJyYXlCdWZmZXIgfCBBcnJheUJ1ZmZlclZpZXcsXG4gICAgaGVhZGVyczogb2JqZWN0ID0ge30sXG4gICAgYXhpb3NDb25maWc6IEF4aW9zUmVxdWVzdENvbmZpZyA9IHVuZGVmaW5lZFxuICApOiBQcm9taXNlPFJlcXVlc3RSZXNwb25zZURhdGE+ID0+XG4gICAgdGhpcy5fcmVxdWVzdChcbiAgICAgIFwiUE9TVFwiLFxuICAgICAgYmFzZXVybCxcbiAgICAgIGdldGRhdGEsXG4gICAgICBwb3N0ZGF0YSxcbiAgICAgIHRoaXMuX3NldEhlYWRlcnMoaGVhZGVycyksXG4gICAgICBheGlvc0NvbmZpZ1xuICAgIClcblxuICAvKipcbiAgICogTWFrZXMgYSBQVVQgY2FsbCB0byBhbiBBUEkuXG4gICAqXG4gICAqIEBwYXJhbSBiYXNldXJsIFBhdGggdG8gdGhlIGJhc2V1cmxcbiAgICogQHBhcmFtIGdldGRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGtleSB2YWx1ZSBwYWlycyBzZW50IGluIFBVVFxuICAgKiBAcGFyYW0gcG9zdGRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGtleSB2YWx1ZSBwYWlycyBzZW50IGluIFBVVFxuICAgKiBAcGFyYW0gaGVhZGVycyBBbiBhcnJheSBIVFRQIFJlcXVlc3QgSGVhZGVyc1xuICAgKiBAcGFyYW0gYXhpb3NDb25maWcgQ29uZmlndXJhdGlvbiBmb3IgdGhlIGF4aW9zIGphdmFzY3JpcHQgbGlicmFyeSB0aGF0IHdpbGwgYmUgdGhlXG4gICAqIGZvdW5kYXRpb24gZm9yIHRoZSByZXN0IG9mIHRoZSBwYXJhbWV0ZXJzXG4gICAqXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSBmb3IgW1tSZXF1ZXN0UmVzcG9uc2VEYXRhXV1cbiAgICovXG4gIHB1dCA9IChcbiAgICBiYXNldXJsOiBzdHJpbmcsXG4gICAgZ2V0ZGF0YTogb2JqZWN0LFxuICAgIHBvc3RkYXRhOiBzdHJpbmcgfCBvYmplY3QgfCBBcnJheUJ1ZmZlciB8IEFycmF5QnVmZmVyVmlldyxcbiAgICBoZWFkZXJzOiBvYmplY3QgPSB7fSxcbiAgICBheGlvc0NvbmZpZzogQXhpb3NSZXF1ZXN0Q29uZmlnID0gdW5kZWZpbmVkXG4gICk6IFByb21pc2U8UmVxdWVzdFJlc3BvbnNlRGF0YT4gPT5cbiAgICB0aGlzLl9yZXF1ZXN0KFxuICAgICAgXCJQVVRcIixcbiAgICAgIGJhc2V1cmwsXG4gICAgICBnZXRkYXRhLFxuICAgICAgcG9zdGRhdGEsXG4gICAgICB0aGlzLl9zZXRIZWFkZXJzKGhlYWRlcnMpLFxuICAgICAgYXhpb3NDb25maWdcbiAgICApXG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgUEFUQ0ggY2FsbCB0byBhbiBBUEkuXG4gICAqXG4gICAqIEBwYXJhbSBiYXNldXJsIFBhdGggdG8gdGhlIGJhc2V1cmxcbiAgICogQHBhcmFtIGdldGRhdGEgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIGtleSB2YWx1ZSBwYWlycyBzZW50IGluIFBBVENIXG4gICAqIEBwYXJhbSBwb3N0ZGF0YSBPYmplY3QgY29udGFpbmluZyB0aGUga2V5IHZhbHVlIHBhaXJzIHNlbnQgaW4gUEFUQ0hcbiAgICogQHBhcmFtIHBhcmFtZXRlcnMgT2JqZWN0IGNvbnRhaW5pbmcgdGhlIHBhcmFtZXRlcnMgb2YgdGhlIEFQSSBjYWxsXG4gICAqIEBwYXJhbSBoZWFkZXJzIEFuIGFycmF5IEhUVFAgUmVxdWVzdCBIZWFkZXJzXG4gICAqIEBwYXJhbSBheGlvc0NvbmZpZyBDb25maWd1cmF0aW9uIGZvciB0aGUgYXhpb3MgamF2YXNjcmlwdCBsaWJyYXJ5IHRoYXQgd2lsbCBiZSB0aGVcbiAgICogZm91bmRhdGlvbiBmb3IgdGhlIHJlc3Qgb2YgdGhlIHBhcmFtZXRlcnNcbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIGZvciBbW1JlcXVlc3RSZXNwb25zZURhdGFdXVxuICAgKi9cbiAgcGF0Y2ggPSAoXG4gICAgYmFzZXVybDogc3RyaW5nLFxuICAgIGdldGRhdGE6IG9iamVjdCxcbiAgICBwb3N0ZGF0YTogc3RyaW5nIHwgb2JqZWN0IHwgQXJyYXlCdWZmZXIgfCBBcnJheUJ1ZmZlclZpZXcsXG4gICAgaGVhZGVyczogb2JqZWN0ID0ge30sXG4gICAgYXhpb3NDb25maWc6IEF4aW9zUmVxdWVzdENvbmZpZyA9IHVuZGVmaW5lZFxuICApOiBQcm9taXNlPFJlcXVlc3RSZXNwb25zZURhdGE+ID0+XG4gICAgdGhpcy5fcmVxdWVzdChcbiAgICAgIFwiUEFUQ0hcIixcbiAgICAgIGJhc2V1cmwsXG4gICAgICBnZXRkYXRhLFxuICAgICAgcG9zdGRhdGEsXG4gICAgICB0aGlzLl9zZXRIZWFkZXJzKGhlYWRlcnMpLFxuICAgICAgYXhpb3NDb25maWdcbiAgICApXG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgQXhpYSBpbnN0YW5jZS4gU2V0cyB0aGUgYWRkcmVzcyBhbmQgcG9ydCBvZiB0aGUgbWFpbiBBeGlhIENsaWVudC5cbiAgICpcbiAgICogQHBhcmFtIGhvc3QgVGhlIGhvc3RuYW1lIHRvIHJlc29sdmUgdG8gcmVhY2ggdGhlIEF4aWEgQ2xpZW50IEFQSXNcbiAgICogQHBhcmFtIHBvcnQgVGhlIHBvcnQgdG8gcmVzb2x2ZSB0byByZWFjaCB0aGUgQXhpYSBDbGllbnQgQVBJc1xuICAgKiBAcGFyYW0gcHJvdG9jb2wgVGhlIHByb3RvY29sIHN0cmluZyB0byB1c2UgYmVmb3JlIGEgXCI6Ly9cIiBpbiBhIHJlcXVlc3QsIGV4OiBcImh0dHBcIiwgXCJodHRwc1wiLCBcImdpdFwiLCBcIndzXCIsIGV0YyAuLi5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGhvc3Q/OiBzdHJpbmcsIHBvcnQ/OiBudW1iZXIsIHByb3RvY29sOiBzdHJpbmcgPSBcImh0dHBcIikge1xuICAgIGlmIChob3N0ICE9IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5zZXRBZGRyZXNzKGhvc3QsIHBvcnQsIHByb3RvY29sKVxuICAgIH1cbiAgfVxufVxuIl19