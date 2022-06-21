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
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const xBlockchainID: string = Defaults.network[networkID].Swap.blockchainID
const axcAssetID: string = Defaults.network[networkID].Swap.axcAssetID
const axia: Axia = new Axia(ip, port, protocol, networkID, xBlockchainID)
const swapchain: AVMAPI = axia.SwapChain()
const swapKeyChain: KeyChain = swapchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
swapKeyChain.importKey(privKey)
const xAddressStrings: string[] = swapchain.keyChain().getAddressStrings()
const asOf: BN = UnixNow()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from("AVM utility method buildBaseTx to send AXC")
const fee: BN = swapchain.getDefaultTxFee()

const main = async (): Promise<any> => {
  const getBalanceResponse: GetBalanceResponse = await swapchain.getBalance(
    xAddressStrings[0],
    axcAssetID
  )
  const balance: BN = new BN(getBalanceResponse.balance)
  const avmUTXOResponse: GetUTXOsResponse = await swapchain.getUTXOs(
    xAddressStrings
  )
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const amount: BN = balance.sub(fee)

  const unsignedTx: UnsignedTx = await swapchain.buildBaseTx(
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

  const tx: Tx = unsignedTx.sign(swapKeyChain)
  const txid: string = await swapchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
