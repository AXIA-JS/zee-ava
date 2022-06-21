import { Axia } from "../../src"
import { InfoAPI } from "../../src/apis/info"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const info: InfoAPI = axia.Info()

const main = async (): Promise<any> => {
  const nodeVersion: string = await info.getNodeVersion()
  console.log(nodeVersion)
}

main()
