/**
 * @packageDocumentation
 * @module API-Info
 */
import AxiaCore from "../../axia";
import { JRPCAPI } from "../../common/jrpcapi";
import { iPublishBlockchainResponse } from "./interfaces";
/**
 * Class for interacting with a node's IPCSAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Axia.addAPI]] function to register this interface with Axia.
 */
export declare class IPCSAPI extends JRPCAPI {
    /**
     * Register a blockchain so it publishes accepted vertices to a Unix domain socket.
     *
     * @param blockchainID the blockchain that will publish accepted vertices.
     *
     * @returns Returns a Promise<iPublishBlockchainResponse> containing the consensusURL and decisionsURL.
     */
    publishBlockchain: (blockchainID: string) => Promise<iPublishBlockchainResponse>;
    /**
     * Deregister a blockchain so that it no longer publishes to a Unix domain socket.
     *
     * @param blockchainID the blockchain that will publish accepted vertices.
     *
     * @returns Returns a Promise<iPublishBlockchainResponse> containing the consensusURL and decisionsURL.
     */
    unpublishBlockchain: (blockchainID: string) => Promise<boolean>;
    constructor(core: AxiaCore, baseurl?: string);
}
//# sourceMappingURL=api.d.ts.map