import { Axia, Buffer } from "../../dist"
import { AXVMAPI } from "../../dist/apis/axvm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const assetchain: AXVMAPI = axia.AssetChain()

const main = async (): Promise<any> => {
  const newAssetID: string = "11FtAxv"
  assetchain.setAXCAssetID(newAssetID)
  const assetID: Buffer = await assetchain.getAXCAssetID()
  console.log(assetID)
}

main()
