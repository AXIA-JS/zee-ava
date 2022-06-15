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
  BaseTx
} from "../../src/apis/axvm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults
} from "../../src/utils"

const bintools: BinTools = BinTools.getInstance()
const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const xBlockchainID: string = Defaults.network[networkID].X.blockchainID
const xBlockchainIDBuf: Buffer = bintools.cb58Decode(xBlockchainID)
const axcAssetID: string = Defaults.network[networkID].X.axcAssetID
const axcAssetIDBuf: Buffer = bintools.cb58Decode(axcAssetID)
const axia: Axia = new Axia(ip, port, protocol, networkID, xBlockchainID)
const assetchain: AXVMAPI = axia.AssetChain()
const xKeychain: KeyChain = assetchain.keyChain()
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// X-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
xKeychain.importKey(privKey)
privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
// X-custom15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj
xKeychain.importKey(privKey)
privKey = "PrivateKey-24b2s6EqkBp9bFG5S3Xxi4bjdxFqeRk56ck7QdQArVbwKkAvxz"
// X-custom1aekly2mwnsz6lswd6u0jqvd9u6yddt5884pyuc
xKeychain.importKey(privKey)
const xAddresses: Buffer[] = assetchain.keyChain().getAddresses()
const xAddressStrings: string[] = assetchain.keyChain().getAddressStrings()
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = assetchain.getDefaultTxFee()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "AXVM manual spend multisig BaseTx to send AXC"
)
// Uncomment for codecID 00 01
// const codecID: number = 1

const main = async (): Promise<any> => {
  const getBalanceResponse: any = await assetchain.getBalance(
    xAddressStrings[0],
    axcAssetID
  )
  const balance: BN = new BN(getBalanceResponse.balance)
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    balance.sub(fee),
    [xAddresses[0]],
    locktime,
    threshold
  )
  // Uncomment for codecID 00 01
  //   secpTransferOutput.setCodecID(codecID)
  const transferableOutput: TransferableOutput = new TransferableOutput(
    axcAssetIDBuf,
    secpTransferOutput
  )
  outputs.push(transferableOutput)

  const axvmUTXOResponse: any = await assetchain.getUTXOs(xAddressStrings)
  const utxoSet: UTXOSet = axvmUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO): void => {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount().clone()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()

    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    // Uncomment for codecID 00 01
    // secpTransferInput.setCodecID(codecID)
    xAddresses.forEach((xAddress: Buffer, index: number): void => {
      if (index < 3) {
        secpTransferInput.addSignatureIdx(index, xAddress)
      }
    })

    const input: TransferableInput = new TransferableInput(
      txid,
      outputidx,
      axcAssetIDBuf,
      secpTransferInput
    )
    inputs.push(input)
  })

  const baseTx: BaseTx = new BaseTx(
    networkID,
    xBlockchainIDBuf,
    outputs,
    inputs,
    memo
  )
  // Uncomment for codecID 00 01
  //   baseTx.setCodecID(codecID)
  const unsignedTx: UnsignedTx = new UnsignedTx(baseTx)
  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await assetchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
