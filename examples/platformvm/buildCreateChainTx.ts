import { Axia, BinTools, BN, Buffer, GenesisData } from "../../src"
import {
  PlatformVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "../../src/apis/platformvm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  UnixNow
} from "../../src/utils"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()
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
const pAddresses: Buffer[] = corechain.keyChain().getAddresses()
const asOf: BN = UnixNow()

const main = async (): Promise<any> => {
  const platformVMUTXOResponse: any = await corechain.getUTXOs(pAddressStrings)
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos

  const genesisDataStr: string =
    "11111DdZMhYXUZiFV9FNpfpTSQroysjHyMuT5zapYkPYrmap7t7S3sDNNwFzngxR9x1XmoRj5JK1XomX8RHvXYY5h3qYeEsMQRF8Ypia7p1CFHDo6KGSjMdiQkrmpvL8AvoezSxVWKXt2ubmBCnSkpPjnQbBSF7gNg4sPu1PXdh1eKgthaSFREqqG5FKMrWNiS6U87kxCmbKjkmBvwnAd6TpNx75YEiS9YKMyHaBZjkRDNf6Nj1"
  const allychainIDStr: string =
    "2cXEvbdDaP6q6srB6x1T14raebpJaM4s2t9NE5kiXzLqLXQDWm"
  const memo: Buffer = Buffer.from(
    "Utility function to create a CreateChainTx transaction"
  )
  const allychainID: Buffer = bintools.cb58Decode(allychainIDStr)
  const chainName: string = "EPIC AVM"
  const vmID: string = "avm"
  const fxIDs: string[] = ["secp256k1fx", "nftfx", "propertyfx"]

  // Only for AVM serialization. For other VMs comment these 2 lines
  const genesisData: GenesisData = new GenesisData()
  genesisData.fromBuffer(bintools.cb58Decode(genesisDataStr))

  // For VMs other than AVM. For AVM comment this line
  // const genesisData = genesisDataStr
  const allychainAuthCredentials: [number, Buffer][] = [
    [0, pAddresses[3]],
    [1, pAddresses[1]]
  ]

  const unsignedTx: UnsignedTx = await corechain.buildCreateChainTx(
    utxoSet,
    pAddressStrings,
    pAddressStrings,
    allychainID,
    chainName,
    vmID,
    fxIDs,
    genesisData,
    memo,
    asOf,
    allychainAuthCredentials
  )

  const tx: Tx = unsignedTx.sign(coreKeyChain)
  const txid: string = await corechain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
