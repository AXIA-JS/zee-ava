import { Axia } from "../../src"
import { PlatformVMAPI } from "../../src/apis/platformvm"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const corechain: PlatformVMAPI = axia.CoreChain()

const main = async (): Promise<any> => {
  const blockchainID: string =
    "2AymB4Mb6mErFNsDB8aWb77Ui8oyogXgDyRe9RVQBtqfXzKoUc"
  const blockchainStatus: string = await corechain.getBlockchainStatus(
    blockchainID
  )
  console.log(blockchainStatus)
}

main()
