import { Axia, BN, Buffer } from "../../src"
import {
  AXVMAPI,
  KeyChain as AXVMKeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "../../src/apis/axvm"
import { GetUTXOsResponse } from "../../src/apis/axvm/interfaces"
import { KeyChain as EVMKeyChain, EVMAPI } from "../../src/apis/evm"
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
const appchain: EVMAPI = axia.AppChain()
const xKeychain: AXVMKeyChain = assetchain.keyChain()
const cKeychain: EVMKeyChain = appchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
cKeychain.importKey(privKey)
const xAddressStrings: string[] = assetchain.keyChain().getAddressStrings()
const cAddressStrings: string[] = appchain.keyChain().getAddressStrings()
const appChainBlockchainID: string = Defaults.network[networkID].C.blockchainID
const locktime: BN = new BN(0)
const asOf: BN = UnixNow()
const memo: Buffer = Buffer.from(
  "AXVM utility method buildExportTx to export ANT to the AppChain from the AssetChain"
)

const main = async (): Promise<any> => {
  const axvmUTXOResponse: GetUTXOsResponse = await assetchain.getUTXOs(
    xAddressStrings
  )
  const utxoSet: UTXOSet = axvmUTXOResponse.utxos
  const amount: BN = new BN(350)
  const threshold: number = 1
  const assetID: string = "Ycg5QzddNwe3ebfFXhoGUDnWgC6GE88QRakRnn9dp3nGwqCwD"

  const unsignedTx: UnsignedTx = await assetchain.buildExportTx(
    utxoSet,
    amount,
    appChainBlockchainID,
    cAddressStrings,
    xAddressStrings,
    xAddressStrings,
    memo,
    asOf,
    locktime,
    threshold,
    assetID
  )

  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await assetchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
