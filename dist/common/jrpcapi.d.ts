/**
 * @packageDocumentation
 * @module Common-JRPCAPI
 */
import AxiaCore from "../axia";
import { APIBase, RequestResponseData } from "./apibase";
export declare class JRPCAPI extends APIBase {
    protected jrpcVersion: string;
    protected rpcID: number;
    callMethod: (method: string, params?: object[] | object, baseURL?: string, headers?: object) => Promise<RequestResponseData>;
    /**
     * Returns the rpcid, a strictly-increasing number, starting from 1, indicating the next
     * request ID that will be sent.
     */
    getRPCID: () => number;
    /**
     *
     * @param core Reference to the Axia instance using this endpoint
     * @param baseURL Path of the APIs baseURL - ex: "/ext/bc/axvm"
     * @param jrpcVersion The jrpc version to use, default "2.0".
     */
    constructor(core: AxiaCore, baseURL: string, jrpcVersion?: string);
}
//# sourceMappingURL=jrpcapi.d.ts.map