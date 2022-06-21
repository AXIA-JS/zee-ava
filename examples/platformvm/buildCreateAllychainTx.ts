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
const threshold: number = 2
const memo: Buffer = Buffer.from(
  "PlatformVM utility method buildCreateAllychainTx to create a CreateAllychainTx which creates a 1-of-2 AXC utxo and a 2-of-3 AllychainAuth"
)
const asOf: BN = UnixNow()
const allychainAuthKeychain: string[] = [
  pAddressStrings[1],
  pAddressStrings[2],
  pAddressStrings[3]
]

const main = async (): Promise<any> => {
  const platformVMUTXOResponse: GetUTXOsResponse = await corechain.getUTXOs(
    pAddressStrings
  )
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos

  const unsignedTx: UnsignedTx = await corechain.buildCreateAllychainTx(
    utxoSet,
    pAddressStrings,
    pAddressStrings,
    allychainAuthKeychain,
    threshold,
    memo,
    asOf
  )

  const tx: Tx = unsignedTx.sign(coreKeyChain)
  const txid: string = await corechain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
