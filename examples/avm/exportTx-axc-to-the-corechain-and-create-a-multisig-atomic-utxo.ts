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
  PlatformVMAPI,
  KeyChain as PlatformVMKeyChain
} from "../../src/apis/platformvm"
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
const corechain: PlatformVMAPI = axia.CoreChain()
const bintools: BinTools = BinTools.getInstance()
const swapKeyChain: KeyChain = swapchain.keyChain()
const coreKeyChain: PlatformVMKeyChain = corechain.keyChain()
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// Core-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
swapKeyChain.importKey(privKey)
coreKeyChain.importKey(privKey)

privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
// Swap-custom15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj
swapKeyChain.importKey(privKey)
coreKeyChain.importKey(privKey)

privKey = "PrivateKey-rKsiN3X4NSJcPpWxMSh7WcuY653NGQ7tfADgQwDZ9yyUPPDG9"
// Core-custom1jwwk62ktygl0w29rsq2hq55amamhpvx82kfnte
swapKeyChain.importKey(privKey)
coreKeyChain.importKey(privKey)
const xAddresses: Buffer[] = swapchain.keyChain().getAddresses()
const xAddressStrings: string[] = swapchain.keyChain().getAddressStrings()
const pAddresses: Buffer[] = corechain.keyChain().getAddresses()
const swapChainID: string = Defaults.network[networkID].Swap.blockchainID
const swapChainIDBuf: Buffer = bintools.cb58Decode(swapChainID)
const axcAssetID: string = Defaults.network[networkID].Swap.axcAssetID
const axcAssetIDBuf: Buffer = bintools.cb58Decode(axcAssetID)
const coreChainID: string = Defaults.network[networkID].Core.blockchainID
const coreChainIDBuf: Buffer = bintools.cb58Decode(coreChainID)
const exportedOuts: TransferableOutput[] = []
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = swapchain.getDefaultTxFee()
const threshold: number = 2
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "Export AXC from the SwapChain to the CoreChain and create a multisig atomic utxo"
)

const main = async (): Promise<any> => {
  const getBalanceResponse: any = await swapchain.getBalance(
    xAddressStrings[0],
    axcAssetID
  )
  const balance: BN = new BN(getBalanceResponse.balance)
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    balance.sub(fee),
    pAddresses,
    locktime,
    threshold
  )
  const transferableOutput: TransferableOutput = new TransferableOutput(
    axcAssetIDBuf,
    secpTransferOutput
  )
  exportedOuts.push(transferableOutput)

  const avmUTXOResponse: any = await swapchain.getUTXOs(xAddressStrings)
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO): void => {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amount: BN = amountOutput.getAmount().clone()
    const txID: Buffer = utxo.getTxID()
    const outputIdx: Buffer = utxo.getOutputIdx()

    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amount)
    secpTransferInput.addSignatureIdx(0, xAddresses[0])

    const input: TransferableInput = new TransferableInput(
      txID,
      outputIdx,
      axcAssetIDBuf,
      secpTransferInput
    )
    inputs.push(input)
  })

  const exportTx: ExportTx = new ExportTx(
    networkID,
    swapChainIDBuf,
    outputs,
    inputs,
    memo,
    coreChainIDBuf,
    exportedOuts
  )
  const unsignedTx: UnsignedTx = new UnsignedTx(exportTx)
  const tx: Tx = unsignedTx.sign(swapKeyChain)
  const txid: string = await swapchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
