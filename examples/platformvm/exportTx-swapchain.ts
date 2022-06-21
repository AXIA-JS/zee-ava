import { Axia, BinTools, BN, Buffer } from "../../src"
import { AVMAPI, KeyChain as AVMKeyChain } from "../../src/apis/avm"
import {
  PlatformVMAPI,
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
} from "../../src/apis/platformvm"
import { Output } from "../../src/common"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults,
  MILLIAXC
} from "../../src/utils"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const swapchain: AVMAPI = axia.SwapChain()
const corechain: PlatformVMAPI = axia.CoreChain()
const bintools: BinTools = BinTools.getInstance()
const swapKeyChain: AVMKeyChain = swapchain.keyChain()
const coreKeyChain: KeyChain = corechain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
swapKeyChain.importKey(privKey)
coreKeyChain.importKey(privKey)
const xAddresses: Buffer[] = swapchain.keyChain().getAddresses()
const pAddressStrings: string[] = corechain.keyChain().getAddressStrings()
const swapChainBlockchainID: string = Defaults.network[networkID].Swap.blockchainID
const coreChainBlockchainID: string = Defaults.network[networkID].Core.blockchainID
const exportedOuts: TransferableOutput[] = []
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = MILLIAXC
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "Manually Export AXC from CoreChain to SwapChain"
)

const main = async (): Promise<any> => {
  const axcAssetID: Buffer = await corechain.getAXCAssetID()
  const getBalanceResponse: any = await corechain.getBalance(pAddressStrings[0])
  const unlocked: BN = new BN(getBalanceResponse.unlocked)
  console.log(unlocked.sub(fee).toString())
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    unlocked.sub(fee),
    xAddresses,
    locktime,
    threshold
  )
  const transferableOutput: TransferableOutput = new TransferableOutput(
    axcAssetID,
    secpTransferOutput
  )
  exportedOuts.push(transferableOutput)

  const platformVMUTXOResponse: any = await corechain.getUTXOs(pAddressStrings)
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO) => {
    const output: Output = utxo.getOutput()
    // if (output.getOutputID() === 7) {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount().clone()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()

    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    secpTransferInput.addSignatureIdx(0, xAddresses[0])

    const input: TransferableInput = new TransferableInput(
      txid,
      outputidx,
      axcAssetID,
      secpTransferInput
    )
    inputs.push(input)
    // }
  })

  const exportTx: ExportTx = new ExportTx(
    networkID,
    bintools.cb58Decode(coreChainBlockchainID),
    outputs,
    inputs,
    memo,
    bintools.cb58Decode(swapChainBlockchainID),
    exportedOuts
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(exportTx)
  const tx: Tx = unsignedTx.sign(coreKeyChain)
  const txid: string = await corechain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
