import { Axia, BinTools, BN, Buffer } from "../../src"
import {
  PlatformVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "../../src/apis/platformvm"
import { Defaults, UnixNow } from "../../src/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 12345
const axia: Axia = new Axia(ip, port, protocol, networkID)
const corechain: PlatformVMAPI = axia.CoreChain()
const bintools: BinTools = BinTools.getInstance()
const pKeychain: KeyChain = corechain.keyChain()
const privKey: string =
  "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
pKeychain.importKey(privKey)
const pAddressStrings: string[] = corechain.keyChain().getAddressStrings()
const xChainBlockchainID: string = Defaults.network["12345"].X.blockchainID
const coreChainBlockchainID: string = Defaults.network["12345"].P.blockchainID
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "PlatformVM utility method buildImportTx to import AXC to the CoreChain from the X-Chain"
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
    xChainBlockchainID,
    pAddressStrings,
    pAddressStrings,
    pAddressStrings,
    memo,
    asOf,
    locktime,
    threshold
  )
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await corechain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
