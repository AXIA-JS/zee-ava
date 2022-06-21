import { Axia } from "../../src"
import { PlatformVMAPI } from "../../src/apis/platformvm"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const corechain: PlatformVMAPI = axia.CoreChain()

const main = async (): Promise<any> => {
  const ids: string[] = []
  const allychains: object[] = await corechain.getAllychains(ids)
  console.log(allychains)
}

main()
