import { Axia, BinTools, BN, Buffer } from "../../src"
import { AVMAPI, KeyChain as AVMKeyChain } from "../../src/apis/avm"
import {
  EVMAPI,
  KeyChain as EVMKeyChain,
  UnsignedTx,
  Tx,
  EVMInput,
  ExportTx,
  SECPTransferOutput,
  TransferableOutput
} from "../../src/apis/evm"
import { RequestResponseData } from "../../src/common"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults
} from "../../src/utils"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const swapchain: AVMAPI = axia.SwapChain()
const axchain: EVMAPI = axia.AXChain()
const bintools: BinTools = BinTools.getInstance()
const swapKeyChain: AVMKeyChain = swapchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const axKeyChain: EVMKeyChain = axchain.keyChain()
swapKeyChain.importKey(privKey)
axKeyChain.importKey(privKey)
const xAddresses: Buffer[] = swapchain.keyChain().getAddresses()
const cAddresses: Buffer[] = axchain.keyChain().getAddresses()
const swapChainBlockchainIdStr: string =
  Defaults.network[networkID].Swap.blockchainID
const swapChainBlockchainIdBuf: Buffer = bintools.cb58Decode(
  swapChainBlockchainIdStr
)
const axChainBlockchainIdStr: string =
  Defaults.network[networkID].AX.blockchainID
const axChainBlockchainIdBuf: Buffer = bintools.cb58Decode(
  axChainBlockchainIdStr
)
const cHexAddress: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
const axcAssetID: string = Defaults.network[networkID].Swap.axcAssetID
const axcAssetIDBuf: Buffer = bintools.cb58Decode(axcAssetID)
const evmInputs: EVMInput[] = []
let exportedOuts: TransferableOutput[] = []
const Web3 = require("web3")
const path: string = "/ext/bc/AX/rpc"
const web3 = new Web3(`${protocol}://${ip}:${port}${path}`)
const threshold: number = 1

const main = async (): Promise<any> => {
  const antAssetIDStr: string =
    "verma4Pa9biWKbjDGNsTXU47cYCyDSNGSU1iBkxucfVSFVXdv"
  const antAssetIDBuf: Buffer = bintools.cb58Decode(antAssetIDStr)
  const antAssetBalanceResponse: RequestResponseData = await axchain.callMethod(
    "eth_getAssetBalance",
    [cHexAddress, "latest", antAssetIDStr],
    "ext/bc/AX/rpc"
  )
  const antAssetBalance: number = parseInt(
    antAssetBalanceResponse.data.result,
    16
  )
  let axcBalance: BN = await web3.eth.getBalance(cHexAddress)
  axcBalance = new BN(axcBalance.toString().substring(0, 17))
  const fee: BN = axchain.getDefaultTxFee()
  const txcount = await web3.eth.getTransactionCount(cHexAddress)
  const nonce: number = txcount
  const locktime: BN = new BN(0)

  let evmInput: EVMInput = new EVMInput(
    cHexAddress,
    axcBalance,
    axcAssetID,
    nonce
  )
  evmInput.addSignatureIdx(0, cAddresses[0])
  evmInputs.push(evmInput)

  evmInput = new EVMInput(cHexAddress, antAssetBalance, antAssetIDStr, nonce)
  evmInput.addSignatureIdx(0, cAddresses[0])
  evmInputs.push(evmInput)

  let secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    axcBalance.sub(fee),
    xAddresses,
    locktime,
    threshold
  )
  let transferableOutput: TransferableOutput = new TransferableOutput(
    axcAssetIDBuf,
    secpTransferOutput
  )
  exportedOuts.push(transferableOutput)

  secpTransferOutput = new SECPTransferOutput(
    new BN(antAssetBalance),
    xAddresses,
    locktime,
    threshold
  )
  transferableOutput = new TransferableOutput(antAssetIDBuf, secpTransferOutput)
  exportedOuts.push(transferableOutput)
  exportedOuts = exportedOuts.sort(TransferableOutput.comparator())

  const exportTx: ExportTx = new ExportTx(
    networkID,
    axChainBlockchainIdBuf,
    swapChainBlockchainIdBuf,
    evmInputs,
    exportedOuts
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(exportTx)
  const tx: Tx = unsignedTx.sign(axKeyChain)
  const txid: string = await axchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
