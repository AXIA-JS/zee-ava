import { Axia, BN, Buffer } from "../../src"
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
  Defaults,
  UnixNow
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
const swapChainBlockchainID: string = Defaults.network[networkID].Swap.blockchainID
const coreChainBlockchainID: string = Defaults.network[networkID].Core.blockchainID
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "PlatformVM utility method buildImportTx to import AXC to the CoreChain from the SwapChain"
)
const asOf: BN = UnixNow()

const main = async (): Promise<any> => {
  const platformVMUTXOResponse: any = await corechain.getUTXOs(
    pAddressStrings,
    coreChainBlockchainID
  )
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
  const unsignedTx: UnsignedTx = await corechain.buildImportTx(
    utxoSet,
    pAddressStrings,
    swapChainBlockchainID,
    pAddressStrings,
    pAddressStrings,
    pAddressStrings,
    memo,
    asOf,
    locktime,
    threshold
  )
  const tx: Tx = unsignedTx.sign(coreKeyChain)
  const txid: string = await corechain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
