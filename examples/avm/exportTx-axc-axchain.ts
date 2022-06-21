import { Axia, BinTools, BN, Buffer } from "../../src"
import {
  AVMAPI,
  KeyChain,
  SECPTransferOutput,
  SECPTransferInput,
  TransferableOutput,
  TransferableInput,
  UTXOSet,
  UTXO,
  AmountOutput,
  UnsignedTx,
  Tx,
  ExportTx
} from "../../src/apis/avm"
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
const bintools: BinTools = BinTools.getInstance()
const swapKeyChain: KeyChain = swapchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
swapKeyChain.importKey(privKey)
const xAddresses: Buffer[] = swapchain.keyChain().getAddresses()
const xAddressStrings: string[] = swapchain.keyChain().getAddressStrings()
const blockchainID: string = Defaults.network[networkID].Swap.blockchainID
const axcAssetID: string = Defaults.network[networkID].Swap.axcAssetID
const axcAssetIDBuf: Buffer = bintools.cb58Decode(axcAssetID)
const axChainBlockchainID: string = Defaults.network[networkID].AX.blockchainID
const exportedOuts: TransferableOutput[] = []
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = swapchain.getDefaultTxFee()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "Manually Export AXC from SwapChain to AXChain"
)
// Uncomment for codecID 00 01
// const codecID: number = 1

const main = async (): Promise<any> => {
  const getBalanceResponse: any = await swapchain.getBalance(
    xAddressStrings[0],
    axcAssetID
  )
  const balance: BN = new BN(getBalanceResponse.balance)
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    balance.sub(fee),
    xAddresses,
    locktime,
    threshold
  )
  // Uncomment for codecID 00 01
  // secpTransferOutput.setCodecID(codecID)
  const transferableOutput: TransferableOutput = new TransferableOutput(
    axcAssetIDBuf,
    secpTransferOutput
  )
  exportedOuts.push(transferableOutput)

  const avmUTXOResponse: any = await swapchain.getUTXOs(xAddressStrings)
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO) => {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount().clone()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()

    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    secpTransferInput.addSignatureIdx(0, xAddresses[0])
    // Uncomment for codecID 00 01
    // secpTransferOutput.setCodecID(codecID)

    const input: TransferableInput = new TransferableInput(
      txid,
      outputidx,
      axcAssetIDBuf,
      secpTransferInput
    )
    inputs.push(input)
  })

  const exportTx: ExportTx = new ExportTx(
    networkID,
    bintools.cb58Decode(blockchainID),
    outputs,
    inputs,
    memo,
    bintools.cb58Decode(axChainBlockchainID),
    exportedOuts
  )
  // Uncomment for codecID 00 01
  // exportTx.setCodecID(codecID)
  const unsignedTx: UnsignedTx = new UnsignedTx(exportTx)
  const tx: Tx = unsignedTx.sign(swapKeyChain)
  const txid: string = await swapchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
