/**
 * @packageDocumentation
 * @module API-Metrics
 */
import AxiaCore from '../../axia';
import { RESTAPI } from '../../common/restapi';
import { RequestResponseData } from '../../common/apibase';
import { AxiosRequestConfig } from 'axios';


/**
 * Class for interacting with a node API that is using the node's MetricsApi.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[RESTAPI]] class. This class should not be directly called. Instead, use the [[Axia.addAPI]] function to register this interface with Axia.
 */
export class MetricsAPI extends RESTAPI {
  protected axConf = ():AxiosRequestConfig => {
    return  {
      baseURL: `${this.core.getProtocol()}://${this.core.getIP()}:${this.core.getPort()}`,
      responseType: 'text',
    };

  }

  /**
     *
     * @returns Promise for an object containing the metrics response
     */
  getMetrics = async ():Promise<string> => this.post('')
    .then((response:RequestResponseData) => response.data as string);

  /**
     * This class should not be instantiated directly. Instead use the [[Axia.addAPI]] method.
     *
     * @param core A reference to the Axia class
     * @param baseurl Defaults to the string "/ext/metrics" as the path to blockchain's baseurl
     */
  constructor(core:AxiaCore, baseurl:string = '/ext/metrics') { super(core, baseurl); }
}

