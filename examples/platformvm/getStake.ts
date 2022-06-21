import { Axia } from "../../src"
import { PlatformVMAPI, KeyChain } from "../../src/apis/platformvm"
import { GetStakeResponse } from "../../src/apis/platformvm/interfaces"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey
} from "../../src/utils"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const corechain: PlatformVMAPI = axia.CoreChain()
const coreKeyChain: KeyChain = corechain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
coreKeyChain.importKey(privKey)
const pAddressStrings: string[] = corechain.keyChain().getAddressStrings()
const encoding: string = "hex"

const main = async (): Promise<any> => {
  const getStakeResponse: GetStakeResponse = await corechain.getStake(
    pAddressStrings,
    encoding
  )
  console.log(getStakeResponse)
}

main()
