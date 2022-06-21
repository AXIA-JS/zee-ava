import { Axia, BN, Buffer } from "../../src"
import {
  AVMAPI,
  KeyChain as AVMKeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "../../src/apis/avm"
import {
  GetBalanceResponse,
  GetUTXOsResponse
} from "../../src/apis/avm/interfaces"
import { KeyChain as EVMKeyChain, EVMAPI } from "../../src/apis/evm"
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
const swapchain: AVMAPI = axia.SwapChain()
const axchain: EVMAPI = axia.AXChain()
const swapKeyChain: AVMKeyChain = swapchain.keyChain()
const axKeyChain: EVMKeyChain = axchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
swapKeyChain.importKey(privKey)
axKeyChain.importKey(privKey)
const xAddressStrings: string[] = swapchain.keyChain().getAddressStrings()
const cAddressStrings: string[] = axchain.keyChain().getAddressStrings()
const axChainBlockchainID: string = Defaults.network[networkID].AX.blockchainID
const axcAssetID: string = Defaults.network[networkID].Swap.axcAssetID
const locktime: BN = new BN(0)
const asOf: BN = UnixNow()
const memo: Buffer = Buffer.from(
  "AVM utility method buildExportTx to export AXC to the AXChain from the SwapChain"
)
const fee: BN = swapchain.getDefaultTxFee()

const main = async (): Promise<any> => {
  const avmUTXOResponse: GetUTXOsResponse = await swapchain.getUTXOs(
    xAddressStrings
  )
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const getBalanceResponse: GetBalanceResponse = await swapchain.getBalance(
    xAddressStrings[0],
    axcAssetID
  )
  const balance: BN = new BN(getBalanceResponse.balance)
  const amount: BN = balance.sub(fee)

  const unsignedTx: UnsignedTx = await swapchain.buildExportTx(
    utxoSet,
    amount,
    axChainBlockchainID,
    cAddressStrings,
    xAddressStrings,
    xAddressStrings,
    memo,
    asOf,
    locktime
  )

  const tx: Tx = unsignedTx.sign(swapKeyChain)
  const txid: string = await swapchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
