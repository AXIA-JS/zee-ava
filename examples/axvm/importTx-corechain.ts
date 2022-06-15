import { Axia, BinTools, BN, Buffer } from "../../src"
import {
  AXVMAPI,
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
} from "../../src/apis/axvm"
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
const assetchain: AXVMAPI = axia.AssetChain()
const bintools: BinTools = BinTools.getInstance()
const xKeychain: KeyChain = assetchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
const xAddresses: Buffer[] = assetchain.keyChain().getAddresses()
const xAddressStrings: string[] = assetchain.keyChain().getAddressStrings()
const blockchainID: string = Defaults.network[networkID].X.blockchainID
const axcAssetID: string = Defaults.network[networkID].X.axcAssetID
const axcAssetIDBuf: Buffer = bintools.cb58Decode(axcAssetID)
const appChainBlockchainID: string = Defaults.network[networkID].P.blockchainID
const importedInputs: TransferableInput[] = []
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = assetchain.getDefaultTxFee()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "Manually Import AXC to the AssetChain from the CoreChain"
)
// Uncomment for codecID 00 01
// const codecID: number = 1

const main = async (): Promise<any> => {
  const axvmUTXOResponse: any = await assetchain.getUTXOs(
    xAddressStrings,
    appChainBlockchainID
  )
  const utxoSet: UTXOSet = axvmUTXOResponse.utxos
  const utxo: UTXO = utxoSet.getAllUTXOs()[0]
  const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
  const amt: BN = amountOutput.getAmount().clone()
  const txid: Buffer = utxo.getTxID()
  const outputidx: Buffer = utxo.getOutputIdx()

  const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
  secpTransferInput.addSignatureIdx(0, xAddresses[0])
  // Uncomment for codecID 00 01
  // secpTransferInput.setCodecID(codecID)

  const input: TransferableInput = new TransferableInput(
    txid,
    outputidx,
    axcAssetIDBuf,
    secpTransferInput
  )
  importedInputs.push(input)

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
  const id: string = await assetchain.issueTx(tx)
  console.log(`Success! TXID: ${id}`)
}

main()
