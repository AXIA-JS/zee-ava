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
  ImportTx
} from "../../src/apis/avm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults
} from "../../src/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const assetchain: AVMAPI = axia.AssetChain()
const bintools: BinTools = BinTools.getInstance()
const xKeychain: KeyChain = assetchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
const xAddresses: Buffer[] = assetchain.keyChain().getAddresses()
const xAddressStrings: string[] = assetchain.keyChain().getAddressStrings()
const blockchainID: string = Defaults.network[networkID].X.blockchainID
const axcAssetID: string = Defaults.network[networkID].X.axcAssetID
const axcAssetIDBuf: Buffer = bintools.cb58Decode(axcAssetID)
const appChainBlockchainID: string = Defaults.network[networkID].C.blockchainID
const importedInputs: TransferableInput[] = []
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = assetchain.getDefaultTxFee()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "Manually Import AXC and ANT to the AssetChain from the AppChain"
)
// Uncomment for codecID 00 01
// const codecID: number = 1

const main = async (): Promise<any> => {
  const avmUTXOResponse: any = await assetchain.getUTXOs(
    xAddressStrings,
    appChainBlockchainID
  )
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO) => {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount().clone()
    const txid: Buffer = utxo.getTxID()
    let assetID: Buffer = utxo.getAssetID()
    const outputidx: Buffer = utxo.getOutputIdx()
    let secpTransferOutput: SECPTransferOutput = new SECPTransferOutput()
    if (axcAssetIDBuf.toString("hex") === assetID.toString("hex")) {
      secpTransferOutput = new SECPTransferOutput(
        amt.sub(fee),
        xAddresses,
        locktime,
        threshold
      )
    } else {
      secpTransferOutput = new SECPTransferOutput(
        amt,
        xAddresses,
        locktime,
        threshold
      )
    }
    // Uncomment for codecID 00 01
    // secpTransferOutput.setCodecID(codecID)

    const transferableOutput: TransferableOutput = new TransferableOutput(
      assetID,
      secpTransferOutput
    )
    outputs.push(transferableOutput)

    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    secpTransferInput.addSignatureIdx(0, xAddresses[0])
    // Uncomment for codecID 00 01
    // secpTransferInput.setCodecID(codecID)

    const input: TransferableInput = new TransferableInput(
      txid,
      outputidx,
      assetID,
      secpTransferInput
    )
    importedInputs.push(input)
  })

  const importTx: ImportTx = new ImportTx(
    networkID,
    bintools.cb58Decode(blockchainID),
    outputs,
    inputs,
    memo,
    bintools.cb58Decode(appChainBlockchainID),
    importedInputs
  )
  // Uncomment for codecID 00 01
  // importTx.setCodecID(codecID)

  const unsignedTx: UnsignedTx = new UnsignedTx(importTx)
  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await assetchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()