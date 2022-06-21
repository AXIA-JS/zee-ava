import { Axia } from "../../src"
import { AdminAPI } from "../../src/apis/admin"
import { Defaults } from "../../src/utils"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const admin: AdminAPI = axia.Admin()

const main = async (): Promise<any> => {
  const blockchain: string = Defaults.network[networkID].Swap.blockchainID
  const aliases: string[] = await admin.getChainAliases(blockchain)
  console.log(aliases)
}

main()
