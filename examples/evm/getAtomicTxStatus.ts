import { Axia } from "../../src"
import { EVMAPI } from "../../src/apis/evm"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const cchain: EVMAPI = axia.CChain()

const main = async (): Promise<any> => {
  const txID: string = "FCry2Z1Su9KZqK1XRMhxQS6XuPorxDm3C3RBT7hw32ojiqyvP"
  const status: string = await cchain.getAtomicTxStatus(txID)
  console.log(status)
}

main()