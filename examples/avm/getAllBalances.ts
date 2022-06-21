import { Axia } from "../../src"
import { AVMAPI } from "../../src/apis/avm"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const swapchain: AVMAPI = axia.SwapChain()

const main = async (): Promise<any> => {
  const address: string = "Swap-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p"
  const balances: object[] = await swapchain.getAllBalances(address)
  console.log(balances)
}

main()
