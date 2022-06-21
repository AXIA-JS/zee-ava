import { Axia, Buffer } from "../../dist"
import { AVMAPI } from "../../dist/apis/avm"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const swapchain: AVMAPI = axia.SwapChain()

const main = async (): Promise<any> => {
  const newAssetID: string = "11FtAxv"
  swapchain.setAXCAssetID(newAssetID)
  const assetID: Buffer = await swapchain.getAXCAssetID()
  console.log(assetID)
}

main()
