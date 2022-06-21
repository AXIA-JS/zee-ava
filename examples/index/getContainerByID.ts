import { Axia } from "../../src"
import { IndexAPI } from "../../src/apis/index"
import { GetContainerByIDResponse } from "../../src/apis/index/interfaces"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const index: IndexAPI = axia.Index()

const main = async (): Promise<any> => {
  const containerID: string =
    "eLXEKFFMgGmK7ZLokCFjppdBfGy5hDuRqh5uJVyXXPaRErpAX"
  const encoding: string = "hex"
  const baseurl: string = "/ext/index/Swap/tx"
  const containerByIndex: GetContainerByIDResponse =
    await index.getContainerByID(containerID, encoding, baseurl)
  console.log(containerByIndex)
}

main()
