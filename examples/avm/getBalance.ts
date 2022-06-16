import { Axia } from "../../src"
import { AVMAPI } from "../../src/apis/avm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const assetchain: AVMAPI = axia.AssetChain()

const main = async (): Promise<any> => {
  const address: string = "X-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p"
  const balance: object = await assetchain.getBalance(address, "AXC")
  console.log(balance)
}

main()
