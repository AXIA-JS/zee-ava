import { Axia } from "../../src"
import { AXVMAPI } from "../../src/apis/axvm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const assetchain: AXVMAPI = axia.AssetChain()

const main = async (): Promise<any> => {
  const username: string = "username"
  const password: string = "Vz48jjHLTCcAepH95nT4B"
  const addresses: string[] = await assetchain.listAddresses(username, password)
  console.log(addresses)
}

main()
