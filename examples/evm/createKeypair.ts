import { Axia } from "../../src"
import { EVMAPI, KeyChain, KeyPair } from "../../src/apis/evm"
import { CreateKeyPairResponse } from "../../src/apis/evm/interfaces"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const appchain: EVMAPI = axia.AppChain()

const main = async (): Promise<any> => {
  const keychain: KeyChain = appchain.keyChain()
  const keypair: KeyPair = keychain.makeKey()
  const address: string = keypair.getAddressString()
  const publicKey: string = keypair.getPublicKeyString()
  const privateKey: string = keypair.getPrivateKeyString()
  const createKeypairResponse: CreateKeyPairResponse = {
    address: address,
    publicKey: publicKey,
    privateKey: privateKey
  }
  console.log(createKeypairResponse)
}

main()
