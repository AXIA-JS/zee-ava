import { Axia } from "../../src"
import { PlatformVMAPI } from "../../src/apis/platformvm"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const corechain: PlatformVMAPI = axia.CoreChain()

const main = async (): Promise<any> => {
  const allychainID: string = "11111111111111111111111111111111LpoYY"
  const nodeIDs: string[] = []
  const currentValidators: object = await corechain.getCurrentValidators(
    allychainID
  )
  console.log(currentValidators)
}

main()
