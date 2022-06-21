import { Axia, BN, Buffer } from "../../src"
import { AVMAPI, KeyChain as AVMKeyChain } from "../../src/apis/avm"
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
const swapchain: AVMAPI = axia.SwapChain()
const corechain: PlatformVMAPI = axia.CoreChain()
const swapKeyChain: AVMKeyChain = swapchain.keyChain()
const coreKeyChain: KeyChain = corechain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
swapKeyChain.importKey(privKey)
coreKeyChain.importKey(privKey)
const xAddressStrings: string[] = swapchain.keyChain().getAddressStrings()
const pAddressStrings: string[] = corechain.keyChain().getAddressStrings()
const axChainBlockchainID: string = Defaults.network[networkID].AX.blockchainID
const fee: BN = corechain.getDefaultTxFee()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "PlatformVM utility method buildExportTx to export AXC from the CoreChain to the AXChain"
)
const asOf: BN = UnixNow()

const main = async (): Promise<any> => {
  const getBalanceResponse: any = await corechain.getBalance(pAddressStrings[0])
  const unlocked: BN = new BN(getBalanceResponse.unlocked)
  const platformVMUTXOResponse: any = await corechain.getUTXOs(pAddressStrings)
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
  const unsignedTx: UnsignedTx = await corechain.buildExportTx(
    utxoSet,
    unlocked.sub(fee),
    axChainBlockchainID,
    xAddressStrings,
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
