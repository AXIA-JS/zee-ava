import { Axia } from "../../src"
import { AVMAPI } from "../../src/apis/avm"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const swapchain: AVMAPI = axia.SwapChain()

const main = async (): Promise<any> => {
  const status: string = await swapchain.getTxStatus(
    "2WdpWdsqE26Qypmf66No8KeBYbNhdk3zSG7a5uNYZ3FLSvCu1D"
  )
  console.log(status)
}

main()
