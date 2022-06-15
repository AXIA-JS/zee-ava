import { Axia, BN, Buffer } from "../../src"
import {
  AXVMAPI,
  KeyChain as AXVMKeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "../../src/apis/axvm"
import {
  GetBalanceResponse,
  GetUTXOsResponse
} from "../../src/apis/axvm/interfaces"
import {
  KeyChain as PlatformVMKeyChain,
  PlatformVMAPI
} from "../../src/apis/platformvm"
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
const corechain: PlatformVMAPI = axia.CoreChain()
const xKeychain: AXVMKeyChain = assetchain.keyChain()
const pKeychain: PlatformVMKeyChain = corechain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
pKeychain.importKey(privKey)
const xAddressStrings: string[] = assetchain.keyChain().getAddressStrings()
const pAddressStrings: string[] = corechain.keyChain().getAddressStrings()
const coreChainBlockchainID: string = Defaults.network[networkID].P.blockchainID
const axcAssetID: string = Defaults.network[networkID].X.axcAssetID
const locktime: BN = new BN(0)
const asOf: BN = UnixNow()
const memo: Buffer = Buffer.from(
  "AXVM utility method buildExportTx to export AXC to the CoreChain from the AssetChain"
)
const fee: BN = assetchain.getDefaultTxFee()

const main = async (): Promise<any> => {
  const axvmUTXOResponse: GetUTXOsResponse = await assetchain.getUTXOs(
    xAddressStrings
  )
  const utxoSet: UTXOSet = axvmUTXOResponse.utxos
  const getBalanceResponse: GetBalanceResponse = await assetchain.getBalance(
    xAddressStrings[0],
    axcAssetID
  )
  const balance: BN = new BN(getBalanceResponse.balance)
  const amount: BN = balance.sub(fee)

  const unsignedTx: UnsignedTx = await assetchain.buildExportTx(
    utxoSet,
    amount,
    coreChainBlockchainID,
    pAddressStrings,
    xAddressStrings,
    xAddressStrings,
    memo,
    asOf,
    locktime
  )

  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await assetchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
