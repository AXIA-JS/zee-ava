import { Axia } from "../../src"
import { EVMAPI } from "../../src/apis/evm"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const axchain: EVMAPI = axia.AXChain()

const main = async (): Promise<any> => {
  const txID: string = "2GD5SRYJQr2kw5jE73trBFiAgVQyrCaeg223TaTyJFYXf2kPty"
  const status: string = await axchain.getAtomicTx(txID)
  console.log(status)
}

main()
