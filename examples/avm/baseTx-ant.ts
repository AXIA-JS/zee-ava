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
  BaseTx
} from "../../src/apis/avm"
import {
  Defaults,
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey
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
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = swapchain.getDefaultTxFee()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from("AVM manual BaseTx to send AXC and ANT")
// Uncomment for codecID 00 01
// const codecID: number = 1

const main = async (): Promise<any> => {
  const avmUTXOResponse: any = await swapchain.getUTXOs(xAddressStrings)
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO): void => {
    const typeID: number = utxo.getOutput().getTypeID()
    if (typeID != 6) {
      const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
      const amt: BN = amountOutput.getAmount().clone()
      const txID: Buffer = utxo.getTxID()
      const outputIDX: Buffer = utxo.getOutputIdx()
      const assetID: Buffer = utxo.getAssetID()

      if (assetID.toString("hex") === axcAssetIDBuf.toString("hex")) {
        const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
          amt.sub(fee),
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
        outputs.push(transferableOutput)

        const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
        // Uncomment for codecID 00 01
        // secpTransferInput.setCodecID(codecID)
        secpTransferInput.addSignatureIdx(0, xAddresses[0])
        const input: TransferableInput = new TransferableInput(
          txID,
          outputIDX,
          axcAssetIDBuf,
          secpTransferInput
        )
        inputs.push(input)
      } else {
        const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
          amt,
          xAddresses,
          locktime,
          threshold
        )
        // Uncomment for codecID 00 01
        // secpTransferOutput.setCodecID(codecID)
        const transferableOutput: TransferableOutput = new TransferableOutput(
          assetID,
          secpTransferOutput
        )
        outputs.push(transferableOutput)

        const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
        // Uncomment for codecID 00 01
        // secpTransferInput.setCodecID(codecID)
        secpTransferInput.addSignatureIdx(0, xAddresses[0])
        const input: TransferableInput = new TransferableInput(
          txID,
          outputIDX,
          assetID,
          secpTransferInput
        )
        inputs.push(input)
      }
    }
  })

  const baseTx: BaseTx = new BaseTx(
    networkID,
    bintools.cb58Decode(blockchainID),
    outputs,
    inputs,
    memo
  )
  // Uncomment for codecID 00 01
  // baseTx.setCodecID(codecID)
  const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)
  const tx: Tx = unsignedTx.sign(swapKeyChain)
  const txid: string = await swapchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
