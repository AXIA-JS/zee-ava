/**
 * @packageDocumentation
 * @module API-Health
 */
import AxiaCore from "../../axia";
import { JRPCAPI } from "../../common/jrpcapi";
import { HealthResponse } from "./interfaces";
/**
 * Class for interacting with a node API that is using the node's HealthApi.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Axia.addAPI]] function to register this interface with Axia.
 */
export declare class HealthAPI extends JRPCAPI {
    /**
     *
     * @returns Promise for a [[HealthResponse]]
     */
    health: () => Promise<HealthResponse>;
    /**
     * This class should not be instantiated directly. Instead use the [[Axia.addAPI]] method.
     *
     * @param core A reference to the Axia class
     * @param baseURL Defaults to the string "/ext/health" as the path to rpc's baseURL
     */
    constructor(core: AxiaCore, baseURL?: string);
}
//# sourceMappingURL=api.d.ts.map