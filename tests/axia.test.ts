import mockAxios from 'jest-mock-axios';
import { Axia } from "src";
import { AVMAPI } from "src/apis/avm/api";
import { AdminAPI } from "src/apis/admin/api";
import { HealthAPI } from 'src/apis/health/api';
import { InfoAPI } from "src/apis/info/api";
import { KeystoreAPI } from "src/apis/keystore/api";
import { MetricsAPI } from "src/apis/metrics/api";
import { PlatformVMAPI }  from "src/apis/platformvm/api";
import { TestAPI } from './testlib';
import { AxiosRequestConfig } from 'axios';

describe('Axia', () => {
    const blockchainid:string = "6h2s5de1VC65meajE1L2PjvZ1MXvHc3F6eqPCGKuDt4MxiweF";
    const ip = '127.0.0.1';
    const port = 9650;
    const protocol = "https";
    let axia:Axia;
    beforeAll(() => {
        axia = new Axia(ip, port, protocol, 12345, undefined, undefined, undefined, true);
        axia.addAPI("admin", AdminAPI);
        axia.addAPI("xchain", AVMAPI, "/ext/subnet/avm", blockchainid)
        axia.addAPI("health", HealthAPI);
        axia.addAPI("info", InfoAPI);
        axia.addAPI("keystore", KeystoreAPI);
        axia.addAPI("metrics", MetricsAPI);
        axia.addAPI("pchain", PlatformVMAPI);
    });
    test('Can initialize without port', () => {
        const a = new Axia(ip, undefined, protocol, 12345);
        expect(a.getPort()).toBe(undefined);
        expect(a.getURL()).toBe(`${protocol}://${ip}`);
    });
    test('Can initialize with port', () => {
        expect(axia.getIP()).toBe(ip);
        expect(axia.getPort()).toBe(port);
        expect(axia.getProtocol()).toBe(protocol);
        expect(axia.getURL()).toBe(`${protocol}://${ip}:${port}`);
        expect(axia.getNetworkID()).toBe(12345);
        expect(axia.getHeaders()).toStrictEqual({});
        axia.setNetworkID(50);
        expect(axia.getNetworkID()).toBe(50);
        axia.setNetworkID(12345);
        expect(axia.getNetworkID()).toBe(12345);
    });

    test('Endpoints correct', () => {
        expect(axia.Admin()).not.toBeInstanceOf(AVMAPI);
        expect(axia.Admin()).toBeInstanceOf(AdminAPI);
        
        expect(axia.XChain()).not.toBeInstanceOf(AdminAPI);
        expect(axia.XChain()).toBeInstanceOf(AVMAPI);

        expect(axia.Health()).not.toBeInstanceOf(KeystoreAPI);
        expect(axia.Health()).toBeInstanceOf(HealthAPI);

        expect(axia.Info()).not.toBeInstanceOf(KeystoreAPI);
        expect(axia.Info()).toBeInstanceOf(InfoAPI);
        
        expect(axia.PChain()).not.toBeInstanceOf(KeystoreAPI);
        expect(axia.PChain()).toBeInstanceOf(PlatformVMAPI);

        expect(axia.NodeKeys()).not.toBeInstanceOf(PlatformVMAPI);
        expect(axia.NodeKeys()).toBeInstanceOf(KeystoreAPI);

        expect(axia.Metrics()).not.toBeInstanceOf(KeystoreAPI);
        expect(axia.Metrics()).toBeInstanceOf(MetricsAPI);

        expect(axia.Admin().getRPCID()).toBe(1);
        expect(axia.XChain().getRPCID()).toBe(1);
        expect(axia.PChain().getRPCID()).toBe(1);
        expect(axia.NodeKeys().getRPCID()).toBe(1);
    });

    test('Create new API', () => {
        axia.addAPI("avm2", AVMAPI);
        expect(axia.api("avm2")).toBeInstanceOf(AVMAPI);

        axia.addAPI("keystore2", KeystoreAPI, "/ext/keystore2");
        expect(axia.api("keystore2")).toBeInstanceOf(KeystoreAPI);

        axia.api("keystore2").setBaseURL("/ext/keystore3");
        expect(axia.api("keystore2").getBaseURL()).toBe("/ext/keystore3");

        expect(axia.api("keystore2").getDB()).toHaveProperty("namespace");
    });

    test("Customize headers", () => {
      axia.setHeader("X-Custom-Header", "example");
      axia.setHeader("X-Foo", "Foo");
      axia.setHeader("X-Bar", "Bar");
      expect(axia.getHeaders()).toStrictEqual({
        "X-Custom-Header": "example",
        "X-Foo": "Foo",
        "X-Bar": "Bar",
      });
      axia.removeHeader("X-Foo");
      expect(axia.getHeaders()).toStrictEqual({
        "X-Custom-Header": "example",
        "X-Bar": "Bar",
      });
      axia.removeAllHeaders();
      expect(axia.getHeaders()).toStrictEqual({});
    });

    test("Customize request config", () => {
      expect(axia.getRequestConfig()).toStrictEqual({});
      axia.setRequestConfig("withCredentials", true)
      axia.setRequestConfig("withFoo", "Foo")
      axia.setRequestConfig("withBar", "Bar")
      expect(axia.getRequestConfig()).toStrictEqual({
        withCredentials: true,
        withFoo: "Foo",
        withBar: "Bar"
      });
      axia.removeRequestConfig("withFoo");
      expect(axia.getRequestConfig()).toStrictEqual({
        withCredentials: true,
        withBar: "Bar"
      });
      axia.removeAllRequestConfigs();
      expect(axia.getRequestConfig()).toStrictEqual({});
    });
});

describe('HTTP Operations', () => {
  const ip = '127.0.0.1';
  const port = 8080;
  const protocol = 'http';
  const path = '/ext/testingrequests';
  let axia:Axia;
  beforeAll(() => {
    axia = new Axia(ip, port, protocol, 12345, undefined, undefined, undefined, true);
    axia.addAPI('testingrequests', TestAPI, path);
  });

  afterEach(() => {
    mockAxios.reset();
  });

  test('GET works', async () => {
    const input:string = 'TestGET';
    const api:TestAPI = axia.api('testingrequests');
    const result:Promise<object> = api.TestGET(input, `/${input}`);
    const payload:object = {
      result: {
        output: input,
      },
    };
    const responseObj = {
      data: payload,
    };
    mockAxios.mockResponse(responseObj);
    const response:any = await result;
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.output).toBe(input);
  });

  test('DELETE works', async () => {
    const input:string = 'TestDELETE';
    const api:TestAPI = axia.api('testingrequests');
    const axiosConfig:AxiosRequestConfig = {
      baseURL: `${protocol}://${ip}:${port}`,
      responseType: 'text',
    };
    const result:Promise<object> = api.TestDELETE(input, `/${input}`, axiosConfig);
    const payload:object = {
      result: {
        output: input,
      },
    };
    const responseObj = {
      data: payload,
    };
    mockAxios.mockResponse(responseObj);
    const response:any = await result;
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.output).toBe(input);
  });

  test('POST works', async () => {
    const input:string = 'TestPOST';
    const api:TestAPI = axia.api('testingrequests');
    const result:Promise<object> = api.TestPOST(input, `/${input}`);
    const payload:object = {
      result: {
        output: input,
      },
    };
    const responseObj = {
      data: payload,
    };
    mockAxios.mockResponse(responseObj);
    const response:any = await result;
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.output).toBe(input);
  });

  test('PUT works', async () => {
    const input:string = 'TestPUT';
    const api:TestAPI = axia.api('testingrequests');
    const result:Promise<object> = api.TestPUT(input, `/${input}`);
    const payload:object = {
      result: {
        output: input,
      },
    };
    const responseObj = {
      data: payload,
    };
    mockAxios.mockResponse(responseObj);
    const response:any = await result;
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.output).toBe(input);
  });

  test('PATCH works', async () => {
    const input:string = 'TestPATCH';
    const api:TestAPI = axia.api('testingrequests');
    const result:Promise<object> = api.TestPATCH(input, `/${input}`);
    const payload:object = {
      result: {
        output: input,
      },
    };
    const responseObj = {
      data: payload,
    };
    mockAxios.mockResponse(responseObj);
    const response:any = await result;
    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(response.output).toBe(input);
  });
});
