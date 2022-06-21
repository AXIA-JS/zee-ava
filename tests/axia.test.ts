import mockAxios from "jest-mock-axios"
import { Axia, AxiaCore } from "../src"
import { AVMAPI } from "../src/apis/avm/api"
import { AdminAPI } from "../src/apis/admin/api"
import { HealthAPI } from "../src/apis/health/api"
import { InfoAPI } from "../src/apis/info/api"
import { KeystoreAPI } from "../src/apis/keystore/api"
import { MetricsAPI } from "../src/apis/metrics/api"
import { PlatformVMAPI } from "../src/apis/platformvm/api"
import { TestAPI } from "./testlib"
import { AxiosRequestConfig } from "axios"
import { HttpResponse } from "jest-mock-axios/dist/lib/mock-axios-types"

describe("Axia", (): void => {
  const blockchainID: string =
    "6h2s5de1VC65meajE1L2PjvZ1MXvHc3F6eqPCGKuDt4MxiweF"
  let host: string = "127.0.0.1"
  const port: number = 80
  const networkID: number = 1337
  let protocol: string = "https"
  let axia: Axia
  let axiaCore: AxiaCore
  const api: string = "api.axc.network"
  const url: string = "https://api.axc.network:80"
  const encrypted: string = "https"
  const skipinit: boolean = true
  beforeAll((): void => {
    axia = new Axia(
      host,
      port,
      protocol,
      networkID,
      undefined,
      undefined,
      undefined,
      skipinit
    )
    axia.addAPI("admin", AdminAPI)
    axia.addAPI("swapchain", AVMAPI, "/ext/allychain/avm", blockchainID)
    axia.addAPI("health", HealthAPI)
    axia.addAPI("info", InfoAPI)
    axia.addAPI("keystore", KeystoreAPI)
    axia.addAPI("metrics", MetricsAPI)
    axia.addAPI("corechain", PlatformVMAPI)
  })
  test("Remove special characters", (): void => {
    host = "a&&&&p#i,.@a+v(a)x$.~n%e't:w*o?r<k>"
    protocol = "h@t&@&@t#p+s()$"
    axia = new Axia(host, port, protocol, networkID)
    expect(axia.getHost()).toBe(api)
    expect(axia.getProtocol()).toBe(encrypted)
    expect(axia.getURL()).toBe(url)
    axiaCore = new AxiaCore(host, port, protocol)
    expect(axiaCore.getHost()).toBe(api)
    expect(axiaCore.getProtocol()).toBe(encrypted)
    expect(axiaCore.getURL()).toBe(url)
  })
  test("Can specify base endpoint", (): void => {
    axia = new Axia()
    axia.setAddress(api, port, encrypted, "rpc")
    axia.setNetworkID(networkID)
    expect(axia.getHost()).toBe(api)
    expect(axia.getProtocol()).toBe(encrypted)
    expect(axia.getPort()).toBe(port)
    expect(axia.getBaseEndpoint()).toBe("rpc")
    expect(axia.getURL()).toBe(`${url}/rpc`)
    expect(axia.getNetworkID()).toBe(networkID)
  })
  test("Can initialize without port", (): void => {
    protocol = encrypted
    host = api
    axia = new Axia(host, undefined, protocol, networkID)
    expect(axia.getPort()).toBe(undefined)
    expect(axia.getURL()).toBe(`${protocol}://${api}`)
    axiaCore = new AxiaCore(host, undefined, protocol)
    expect(axiaCore.getPort()).toBe(undefined)
    expect(axiaCore.getURL()).toBe(`${protocol}://${api}`)
  })
  test("Can initialize with port", (): void => {
    protocol = encrypted
    axia = new Axia(host, port, protocol, networkID)
    expect(axia.getIP()).toBe(host)
    expect(axia.getHost()).toBe(host)
    expect(axia.getPort()).toBe(port)
    expect(axia.getProtocol()).toBe(protocol)
    expect(axia.getURL()).toBe(`${protocol}://${host}:${port}`)
    expect(axia.getNetworkID()).toBe(1337)
    expect(axia.getHeaders()).toStrictEqual({})
    axia.setNetworkID(50)
    expect(axia.getNetworkID()).toBe(50)
    axia.setNetworkID(12345)
    expect(axia.getNetworkID()).toBe(12345)
  })

  test("Endpoints correct", (): void => {
    expect(axia.Admin()).not.toBeInstanceOf(AVMAPI)
    expect(axia.Admin()).toBeInstanceOf(AdminAPI)

    expect(axia.SwapChain()).not.toBeInstanceOf(AdminAPI)
    expect(axia.SwapChain()).toBeInstanceOf(AVMAPI)

    expect(axia.Health()).not.toBeInstanceOf(KeystoreAPI)
    expect(axia.Health()).toBeInstanceOf(HealthAPI)

    expect(axia.Info()).not.toBeInstanceOf(KeystoreAPI)
    expect(axia.Info()).toBeInstanceOf(InfoAPI)

    expect(axia.CoreChain()).not.toBeInstanceOf(KeystoreAPI)
    expect(axia.CoreChain()).toBeInstanceOf(PlatformVMAPI)

    expect(axia.NodeKeys()).not.toBeInstanceOf(PlatformVMAPI)
    expect(axia.NodeKeys()).toBeInstanceOf(KeystoreAPI)

    expect(axia.Metrics()).not.toBeInstanceOf(KeystoreAPI)
    expect(axia.Metrics()).toBeInstanceOf(MetricsAPI)

    expect(axia.Admin().getRPCID()).toBe(1)
    expect(axia.SwapChain().getRPCID()).toBe(1)
    expect(axia.CoreChain().getRPCID()).toBe(1)
    expect(axia.NodeKeys().getRPCID()).toBe(1)
  })

  test("Create new API", (): void => {
    axia.addAPI("avm2", AVMAPI)
    expect(axia.api("avm2")).toBeInstanceOf(AVMAPI)

    axia.addAPI("keystore2", KeystoreAPI, "/ext/keystore2")
    expect(axia.api("keystore2")).toBeInstanceOf(KeystoreAPI)

    axia.api("keystore2").setBaseURL("/ext/keystore3")
    expect(axia.api("keystore2").getBaseURL()).toBe("/ext/keystore3")

    expect(axia.api("keystore2").getDB()).toHaveProperty("namespace")
  })

  test("Customize headers", (): void => {
    axia.setHeader("Swap-Custom-Header", "example")
    axia.setHeader("Swap-Foo", "Foo")
    axia.setHeader("Swap-Bar", "Bar")
    expect(axia.getHeaders()).toStrictEqual({
      "Swap-Custom-Header": "example",
      "Swap-Foo": "Foo",
      "Swap-Bar": "Bar"
    })
    axia.removeHeader("Swap-Foo")
    expect(axia.getHeaders()).toStrictEqual({
      "Swap-Custom-Header": "example",
      "Swap-Bar": "Bar"
    })
    axia.removeAllHeaders()
    expect(axia.getHeaders()).toStrictEqual({})
  })

  test("Customize request config", (): void => {
    expect(axia.getRequestConfig()).toStrictEqual({})
    axia.setRequestConfig("withCredentials", true)
    axia.setRequestConfig("withFoo", "Foo")
    axia.setRequestConfig("withBar", "Bar")
    expect(axia.getRequestConfig()).toStrictEqual({
      withCredentials: true,
      withFoo: "Foo",
      withBar: "Bar"
    })
    axia.removeRequestConfig("withFoo")
    expect(axia.getRequestConfig()).toStrictEqual({
      withCredentials: true,
      withBar: "Bar"
    })
    axia.removeAllRequestConfigs()
    expect(axia.getRequestConfig()).toStrictEqual({})
  })
})

describe("HTTP Operations", (): void => {
  const host: string = "127.0.0.1"
  const port: number = 8080
  const protocol: string = "http"
  const path: string = "/ext/testingrequests"
  let axia: Axia
  beforeAll((): void => {
    axia = new Axia(
      host,
      port,
      protocol,
      12345,
      undefined,
      undefined,
      undefined,
      true
    )
    axia.addAPI("testingrequests", TestAPI, path)
  })

  afterEach((): void => {
    mockAxios.reset()
  })

  test("GET works", async (): Promise<void> => {
    const input: string = "TestGET"
    const api: TestAPI = axia.api("testingrequests")
    const result: Promise<object> = api.TestGET(input, `/${input}`)
    const payload: object = {
      result: {
        output: input
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }
    mockAxios.mockResponse(responseObj)
    const response: any = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response.output).toBe(input)
  })

  test("DELETE works", async (): Promise<void> => {
    const input: string = "TestDELETE"
    const api: TestAPI = axia.api("testingrequests")
    const axiosConfig: AxiosRequestConfig = {
      baseURL: `${protocol}://${host}:${port}`,
      responseType: "text"
    }
    const result: Promise<object> = api.TestDELETE(
      input,
      `/${input}`,
      axiosConfig
    )
    const payload: object = {
      result: {
        output: input
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }
    mockAxios.mockResponse(responseObj)
    const response: any = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response.output).toBe(input)
  })

  test("POST works", async (): Promise<void> => {
    const input: string = "TestPOST"
    const api: TestAPI = axia.api("testingrequests")
    const result: Promise<object> = api.TestPOST(input, `/${input}`)
    const payload: object = {
      result: {
        output: input
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }
    mockAxios.mockResponse(responseObj)
    const response: any = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response.output).toBe(input)
  })

  test("PUT works", async (): Promise<void> => {
    const input: string = "TestPUT"
    const api: TestAPI = axia.api("testingrequests")
    const result: Promise<object> = api.TestPUT(input, `/${input}`)
    const payload: object = {
      result: {
        output: input
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }
    mockAxios.mockResponse(responseObj)
    const response: any = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response.output).toBe(input)
  })

  test("PATCH works", async (): Promise<void> => {
    const input: string = "TestPATCH"
    const api: TestAPI = axia.api("testingrequests")
    const result: Promise<object> = api.TestPATCH(input, `/${input}`)
    const payload: object = {
      result: {
        output: input
      }
    }
    const responseObj: HttpResponse = {
      data: payload
    }
    mockAxios.mockResponse(responseObj)
    const response: any = await result
    expect(mockAxios.request).toHaveBeenCalledTimes(1)
    expect(response.output).toBe(input)
  })
})
