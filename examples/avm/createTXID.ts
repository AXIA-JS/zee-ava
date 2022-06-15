import createHash from "create-hash"
import { Axia, BN, Buffer } from "../../src"
import {
  AVMAPI,
  KeyChain as AVMKeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "../../src/apis/avm"
import {
  KeyChain as PlatformVMKeyChain,
  PlatformVMAPI
} from "../../src/apis/platformvm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults,
  UnixNow,
  SerializedType
} from "../../src/utils"
import { Serialization } from "../../src/utils"

const serialization: Serialization = Serialization.getInstance()
const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const assetchain: AVMAPI = axia.AssetChain()
const corechain: PlatformVMAPI = axia.CoreChain()
const xKeychain: AVMKeyChain = assetchain.keyChain()
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
  "AVM utility method buildExportTx to export AXC to the CoreChain from the AssetChain"
)
const fee: BN = assetchain.getDefaultTxFee()
const cb58: SerializedType = "cb58"

const main = async (): Promise<any> => {
  const avmUTXOResponse: any = await assetchain.getUTXOs(xAddressStrings)
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const getBalanceResponse: any = await assetchain.getBalance(
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
  const buffer: Buffer = Buffer.from(
    createHash("sha256").update(tx.toBuffer()).digest().buffer
  )
  const txid: string = serialization.bufferToType(buffer, cb58)
  console.log(txid)
  // APfkX9NduHkZtghRpQASNZJjLut4ZAkVhkTGeazQerLSRa36t
}

main()
