import { Axia, Buffer } from "../../dist"
import { AXVMAPI } from "../../dist/apis/axvm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const assetchain: AXVMAPI = axia.AssetChain()

const main = async (): Promise<any> => {
  const addressString: string = "X-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u00z96u"
  const addressBuffer: Buffer = assetchain.parseAddress(addressString)
  console.log(addressBuffer)
}

main()
