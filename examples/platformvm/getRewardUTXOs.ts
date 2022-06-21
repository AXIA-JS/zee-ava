import { Axia } from "../../src"
import { GetRewardUTXOsResponse } from "../../src/apis/platformvm/interfaces"
import { PlatformVMAPI } from "../../src/apis/platformvm"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const corechain: PlatformVMAPI = axia.CoreChain()

const main = async (): Promise<any> => {
  const txID: string = "2nmH8LithVbdjaXsxVQCQfXtzN9hBbmebrsaEYnLM9T32Uy2Y4"
  const encoding: string = "hex"
  const rewardUTXOs: GetRewardUTXOsResponse = await corechain.getRewardUTXOs(
    txID,
    encoding
  )
  console.log(rewardUTXOs)
}

main()
