import { Axia } from "../../dist"
import { AXVMAPI, KeyChain } from "../../dist/apis/axvm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const assetchain: AXVMAPI = axia.AssetChain()

const main = async (): Promise<any> => {
  const keyChain: KeyChain = assetchain.newKeyChain()
  console.log(keyChain)
}

main()