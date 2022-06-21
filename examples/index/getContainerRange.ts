import { Axia } from "../../src"
import { IndexAPI } from "../../src/apis/index"
import { GetContainerRangeResponse } from "../../src/apis/index/interfaces"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const index: IndexAPI = axia.Index()

const main = async (): Promise<any> => {
  const startIndex: number = 0
  const numToFetch: number = 100
  const encoding: string = "hex"
  const baseurl: string = "/ext/index/Swap/tx"
  const containerRange: GetContainerRangeResponse[] =
    await index.getContainerRange(startIndex, numToFetch, encoding, baseurl)
  console.log(containerRange)
}

main()
