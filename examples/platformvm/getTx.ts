import { Axia } from "../../dist"
import { PlatformVMAPI } from "../../dist/apis/platformvm"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const corechain: PlatformVMAPI = axia.CoreChain()

const main = async (): Promise<any> => {
  const txID: string = "2T7F1AzTLPzZrUcw22JLcC8yZ8o2muhjrM5zoQ3TBuENbAUvZd"
  const encoding: string = "json"
  const tx: string | object = await corechain.getTx(txID, encoding)
  console.log(tx)
}

main()
