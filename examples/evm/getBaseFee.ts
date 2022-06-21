import { Axia, BN } from "../../src"
import { EVMAPI } from "../../src/apis/evm"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const axchain: EVMAPI = axia.AXChain()

const main = async (): Promise<any> => {
  const baseFeeResponse: string = await axchain.getBaseFee()
  const baseFee: BN = new BN(parseInt(baseFeeResponse))
  console.log(`BaseFee: ${baseFee.toString()}`)
}

main()
