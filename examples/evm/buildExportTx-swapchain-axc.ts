import { Axia, BN } from "../../src"
import { AVMAPI, KeyChain as AVMKeyChain } from "../../src/apis/avm"
import {
  EVMAPI,
  KeyChain as EVMKeyChain,
  UnsignedTx,
  Tx
} from "../../src/apis/evm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults,
  costExportTx
} from "../../src/utils"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const swapchain: AVMAPI = axia.SwapChain()
const axchain: EVMAPI = axia.AXChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const swapKeyChain: AVMKeyChain = swapchain.keyChain()
const axKeyChain: EVMKeyChain = axchain.keyChain()
swapKeyChain.importKey(privKey)
axKeyChain.importKey(privKey)
const xAddressStrings: string[] = swapchain.keyChain().getAddressStrings()
const cAddressStrings: string[] = axchain.keyChain().getAddressStrings()
const swapChainBlockchainIdStr: string =
  Defaults.network[networkID].Swap.blockchainID
const axcAssetID: string = Defaults.network[networkID].Swap.axcAssetID
const cHexAddress: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
const Web3 = require("web3")
const path: string = "/ext/bc/AX/rpc"
const web3 = new Web3(`${protocol}://${ip}:${port}${path}`)
const threshold: number = 1

const main = async (): Promise<any> => {
  let balance: BN = await web3.eth.getBalance(cHexAddress)
  balance = new BN(balance.toString().substring(0, 17))
  const baseFeeResponse: string = await axchain.getBaseFee()
  const baseFee = new BN(parseInt(baseFeeResponse, 16))
  const txcount = await web3.eth.getTransactionCount(cHexAddress)
  const nonce: number = txcount
  const locktime: BN = new BN(0)
  let axcAmount: BN = new BN(1e7)
  let fee: BN = baseFee.div(new BN(1e9))
  fee = fee.add(new BN(1e6))

  let unsignedTx: UnsignedTx = await axchain.buildExportTx(
    axcAmount,
    axcAssetID,
    swapChainBlockchainIdStr,
    cHexAddress,
    cAddressStrings[0],
    xAddressStrings,
    nonce,
    locktime,
    threshold,
    fee
  )

  const tx: Tx = unsignedTx.sign(axKeyChain)
  const txid: string = await axchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
