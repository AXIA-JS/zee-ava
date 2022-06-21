import { Axia } from "../../dist"
import { InfoAPI } from "../../dist/apis/info"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const info: InfoAPI = axia.Info()

const main = async (): Promise<any> => {
  const alias: string = "Swap"
  const blockchainID: string = await info.getBlockchainID(alias)
  console.log(blockchainID)
}

main()
