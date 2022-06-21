import { Axia } from "../../src"
import { AdminAPI } from "../../src/apis/admin"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const admin: AdminAPI = axia.Admin()

const main = async (): Promise<any> => {
  const endpoint: string = "/ext/bc/Swap"
  const alias: string = "swapchain"
  const successful: boolean = await admin.alias(endpoint, alias)
  console.log(successful)
}

main()
