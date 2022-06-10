/**
 * @packageDocumentation
 * @module API-Health
 */
import AxiaCore from '../../axia';
import { JRPCAPI } from '../../common/jrpcapi';
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
       * @returns Promise for an object containing the health check response
       */
    getLiveness: () => Promise<object>;
    /**
       * This class should not be instantiated directly. Instead use the [[Axia.addAPI]] method.
       *
       * @param core A reference to the Axia class
       * @param baseurl Defaults to the string "/ext/health" as the path to blockchain's baseurl
       */
    constructor(core: AxiaCore, baseurl?: string);
}
//# sourceMappingURL=api.d.ts.map