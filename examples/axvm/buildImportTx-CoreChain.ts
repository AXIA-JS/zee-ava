import { Axia, BN, Buffer } from "../../src"
import { AXVMAPI, KeyChain, UTXOSet, UnsignedTx, Tx } from "../../src/apis/axvm"
import { GetUTXOsResponse } from "../../src/apis/axvm/interfaces"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults,
  UnixNow
} from "../../src/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const assetchain: AXVMAPI = axia.AssetChain()
const xKeychain: KeyChain = assetchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
const xAddressStrings: string[] = assetchain.keyChain().getAddressStrings()
const coreChainBlockchainID: string = Defaults.network[networkID].P.blockchainID
const threshold: number = 1
const locktime: BN = new BN(0)
const asOf: BN = UnixNow()
const memo: Buffer = Buffer.from(
  "AXVM utility method buildImportTx to import AXC to the AssetChain from the CoreChain"
)

const main = async (): Promise<any> => {
  const axvmUTXOResponse: GetUTXOsResponse = await assetchain.getUTXOs(
    xAddressStrings,
    coreChainBlockchainID
  )
  const utxoSet: UTXOSet = axvmUTXOResponse.utxos

  const unsignedTx: UnsignedTx = await assetchain.buildImportTx(
    utxoSet,
    xAddressStrings,
    coreChainBlockchainID,
    xAddressStrings,
    xAddressStrings,
    xAddressStrings,
    memo,
    asOf,
    locktime,
    threshold
  )
  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await assetchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
