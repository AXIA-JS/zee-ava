import { Axia, BN, Buffer } from "../../src"
import { AVMAPI, KeyChain, UTXOSet, UnsignedTx, Tx } from "../../src/apis/avm"
import { GetUTXOsResponse } from "../../src/apis/avm/interfaces"
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
const swapKeyChain: KeyChain = swapchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
swapKeyChain.importKey(privKey)
const xAddressStrings: string[] = swapchain.keyChain().getAddressStrings()
const axChainBlockchainID: string = Defaults.network[networkID].AX.blockchainID
const threshold: number = 1
const locktime: BN = new BN(0)
const asOf: BN = UnixNow()
const memo: Buffer = Buffer.from(
  "AVM utility method buildImportTx to import AXC to the SwapChain from the AXChain"
)

const main = async (): Promise<any> => {
  const avmUTXOResponse: GetUTXOsResponse = await swapchain.getUTXOs(
    xAddressStrings,
    axChainBlockchainID
  )
  const utxoSet: UTXOSet = avmUTXOResponse.utxos

  const unsignedTx: UnsignedTx = await swapchain.buildImportTx(
    utxoSet,
    xAddressStrings,
    axChainBlockchainID,
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
