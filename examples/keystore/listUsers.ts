import { Axia } from "../../dist"
import { KeystoreAPI } from "../../dist/apis/keystore"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const keystore: KeystoreAPI = axia.NodeKeys()

const main = async (): Promise<any> => {
  const users: string[] = await keystore.listUsers()
  console.log(users)
}

main()
