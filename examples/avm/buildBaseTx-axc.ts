import { Axia, BN, Buffer } from "../../src"
import { AVMAPI, KeyChain, UTXOSet, UnsignedTx, Tx } from "../../src/apis/avm"
import {
  GetBalanceResponse,
  GetUTXOsResponse
} from "../../src/apis/avm/interfaces"
import { Defaults } from "../../src/utils"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  UnixNow
} from "../../src/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const xBlockchainID: string = Defaults.network[networkID].X.blockchainID
const axcAssetID: string = Defaults.network[networkID].X.axcAssetID
const axia: Axia = new Axia(ip, port, protocol, networkID, xBlockchainID)
const assetchain: AVMAPI = axia.AssetChain()
const xKeychain: KeyChain = assetchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
const xAddressStrings: string[] = assetchain.keyChain().getAddressStrings()
const asOf: BN = UnixNow()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from("AVM utility method buildBaseTx to send AXC")
const fee: BN = assetchain.getDefaultTxFee()

const main = async (): Promise<any> => {
  const getBalanceResponse: GetBalanceResponse = await assetchain.getBalance(
    xAddressStrings[0],
    axcAssetID
  )
  const balance: BN = new BN(getBalanceResponse.balance)
  const avmUTXOResponse: GetUTXOsResponse = await assetchain.getUTXOs(
    xAddressStrings
  )
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const amount: BN = balance.sub(fee)

  const unsignedTx: UnsignedTx = await assetchain.buildBaseTx(
    utxoSet,
    amount,
    axcAssetID,
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
