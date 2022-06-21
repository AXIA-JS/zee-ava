import { Axia } from "../../src"
import { AVMAPI } from "../../src/apis/avm"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const swapchain: AVMAPI = axia.SwapChain()

const main = async (): Promise<any> => {
  const username: string = "username"
  const password: string = "Vz48jjHLTCcAepH95nT4B"
  const address: string = await swapchain.createAddress(username, password)
  console.log(address)
}

main()
