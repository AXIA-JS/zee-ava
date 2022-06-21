import { Axia } from "../../dist"
import { PlatformVMAPI } from "../../dist/apis/platformvm"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const corechain: PlatformVMAPI = axia.CoreChain()

const main = async (): Promise<any> => {
  const address: string = "Core-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u00z96u"
  const balance: object = await corechain.getBalance(address)
  console.log(balance)
}

main()
