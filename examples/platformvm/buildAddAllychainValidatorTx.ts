import { Axia, BN, Buffer } from "../../src"
import {
  PlatformVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "../../src/apis/platformvm"
import { GetUTXOsResponse } from "../../src/apis/platformvm/interfaces"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  UnixNow
} from "../../src/utils"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const corechain: PlatformVMAPI = axia.CoreChain()
// Keychain with 4 keys-A, B, C, and D
const coreKeyChain: KeyChain = corechain.keyChain()
// Keypair A
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// Core-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
coreKeyChain.importKey(privKey)

// Keypair B
privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
// Core-custom15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj
coreKeyChain.importKey(privKey)

// Keypair C
privKey = "PrivateKey-24gdABgapjnsJfnYkfev6YPyQhTaCU72T9bavtDNTYivBLp2eW"
// Core-custom1u6eth2fg33ye63mnyu5jswtj326jaypvhyar45
coreKeyChain.importKey(privKey)

// Keypair D
privKey = "PrivateKey-2uWuEQbY5t7NPzgqzDrXSgGPhi3uyKj2FeAvPUHYo6CmENHJfn"
// Core-custom1t3qjau2pf3ys83yallqt4y5xc3l6ya5f7wr6aq
coreKeyChain.importKey(privKey)
const pAddressStrings: string[] = corechain.keyChain().getAddressStrings()
const nodeID: string = "NodeID-NFBbbJ4qCmNaCzeW7sxErhvWqvEQMnYcN"
const startTime: BN = new BN(1652217329)
const endTime: BN = new BN(1653511017)
const asOf: BN = UnixNow()

const main = async (): Promise<any> => {
  const platformVMUTXOResponse: GetUTXOsResponse = await corechain.getUTXOs(
    pAddressStrings
  )
  const pAddresses: Buffer[] = corechain.keyChain().getAddresses()
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos

  const weight: BN = new BN(1)
  const allychainID: string =
    "2tFRAeosSsgd1XV9Bn2y9VEHKPkeuk41RdnAZh9PuZJDWWkR5"
  const memo: Buffer = Buffer.from(
    "Utility function to create a AddAllychainValidatorTx transaction"
  )
  const allychainAuthCredentials: [number, Buffer][] = [
    [0, pAddresses[3]],
    [1, pAddresses[1]]
  ]
  const unsignedTx: UnsignedTx = await corechain.buildAddAllychainValidatorTx(
    utxoSet,
    pAddressStrings,
    pAddressStrings,
    nodeID,
    startTime,
    endTime,
    weight,
    allychainID,
    memo,
    asOf,
    allychainAuthCredentials
  )
  const tx: Tx = unsignedTx.sign(coreKeyChain)
  const txid: string = await corechain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
