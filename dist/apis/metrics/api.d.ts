/**
 * @packageDocumentation
 * @module API-Metrics
 */
import AxiaCore from "../../axia";
import { RESTAPI } from "../../common/restapi";
import { AxiosRequestConfig } from "axios";
/**
 * Class for interacting with a node API that is using the node's MetricsApi.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[RESTAPI]] class. This class should not be directly called. Instead, use the [[Axia.addAPI]] function to register this interface with Axia.
 */
export declare class MetricsAPI extends RESTAPI {
    protected axConf: () => AxiosRequestConfig;
    /**
     *
     * @returns Promise for an object containing the metrics response
     */
    getMetrics: () => Promise<string>;
    /**
     * This class should not be instantiated directly. Instead use the [[Axia.addAPI]] method.
     *
     * @param core A reference to the Axia class
     * @param baseURL Defaults to the string "/ext/metrics" as the path to rpc's baseurl
     */
    constructor(core: AxiaCore, baseURL?: string);
}
//# sourceMappingURL=api.d.ts.map