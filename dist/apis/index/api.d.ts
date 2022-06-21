/**
 * @packageDocumentation
 * @module API-Index
 */
import AxiaCore from "../../axia";
import { JRPCAPI } from "../../common/jrpcapi";
import { GetLastAcceptedResponse, GetContainerByIndexResponse, GetContainerByIDResponse, GetContainerRangeResponse, IsAcceptedResponse } from "./interfaces";
/**
 * Class for interacting with a node's IndexAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Axia.addAPI]] function to register this interface with Axia.
 */
export declare class IndexAPI extends JRPCAPI {
    /**
     * Get last accepted tx, vtx or block
     *
     * @param encoding
     * @param baseURL
     *
     * @returns Returns a Promise GetLastAcceptedResponse.
     */
    getLastAccepted: (encoding?: string, baseURL?: string) => Promise<GetLastAcceptedResponse>;
    /**
     * Get container by index
     *
     * @param index
     * @param encoding
     * @param baseURL
     *
     * @returns Returns a Promise GetContainerByIndexResponse.
     */
    getContainerByIndex: (index?: string, encoding?: string, baseURL?: string) => Promise<GetContainerByIndexResponse>;
    /**
     * Get contrainer by ID
     *
     * @param containerID
     * @param encoding
     * @param baseURL
     *
     * @returns Returns a Promise GetContainerByIDResponse.
     */
    getContainerByID: (containerID?: string, encoding?: string, baseURL?: string) => Promise<GetContainerByIDResponse>;
    /**
     * Get container range
     *
     * @param startIndex
     * @param numToFetch
     * @param encoding
     * @param baseURL
     *
     * @returns Returns a Promise GetContainerRangeResponse.
     */
    getContainerRange: (startIndex?: number, numToFetch?: number, encoding?: string, baseURL?: string) => Promise<GetContainerRangeResponse[]>;
    /**
     * Get index by containerID
     *
     * @param containerID
     * @param encoding
     * @param baseURL
     *
     * @returns Returns a Promise GetIndexResponse.
     */
    getIndex: (containerID?: string, encoding?: string, baseURL?: string) => Promise<string>;
    /**
     * Check if container is accepted
     *
     * @param containerID
     * @param encoding
     * @param baseURL
     *
     * @returns Returns a Promise GetIsAcceptedResponse.
     */
    isAccepted: (containerID?: string, encoding?: string, baseURL?: string) => Promise<IsAcceptedResponse>;
    /**
     * This class should not be instantiated directly. Instead use the [[Axia.addAPI]] method.
     *
     * @param core A reference to the Axia class
     * @param baseURL Defaults to the string "/ext/index/Swap/tx" as the path to rpc's baseURL
     */
    constructor(core: AxiaCore, baseURL?: string);
}
//# sourceMappingURL=api.d.ts.map