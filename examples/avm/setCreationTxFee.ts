import { Axia, BN } from "../../dist"
import { AVMAPI } from "../../dist/apis/avm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const assetchain: AVMAPI = axia.AssetChain()

const main = async (): Promise<any> => {
  const fee: BN = new BN(507)
  assetchain.setCreationTxFee(fee)
  const txFee: BN = assetchain.getCreationTxFee()
  console.log(txFee)
}

main()