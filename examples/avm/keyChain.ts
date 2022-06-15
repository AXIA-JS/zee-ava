import { Axia } from "../../src"
import { AVMAPI, KeyChain } from "../../src/apis/avm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const assetchain: AVMAPI = axia.AssetChain()

const main = async (): Promise<any> => {
  const keyChain: KeyChain = assetchain.keyChain()
  console.log(keyChain)
}

main()
