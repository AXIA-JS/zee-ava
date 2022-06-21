import { Axia } from "../../src"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const baseEndpoint: string = "rpc"
const axia: Axia = new Axia(ip, port, protocol, networkID)
axia.setAddress(ip, port, protocol, baseEndpoint)

const main = async (): Promise<any> => {
  const baseEndpoint: string = axia.getBaseEndpoint()
  console.log(baseEndpoint)
}

main()
