import { Axia, Buffer } from "../../src"
import { AVMAPI } from "../../src/apis/avm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const assetchain: AVMAPI = axia.AssetChain()

const main = async (): Promise<any> => {
  const addressBuffer: Buffer = Buffer.from(
    "3cb7d3842e8cee6a0ebd09f1fe884f6861e1b29c",
    "hex"
  )
  const addressString: string = assetchain.addressFromBuffer(addressBuffer)
  console.log(addressString)
}

main()
