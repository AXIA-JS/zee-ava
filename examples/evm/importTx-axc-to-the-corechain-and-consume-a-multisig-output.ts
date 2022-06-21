import { Axia, BinTools, BN, Buffer } from "../../src"
import {
  EVMAPI,
  EVMOutput,
  ImportTx,
  TransferableInput,
  KeyChain,
  UTXO,
  UTXOSet,
  SECPTransferInput,
  AmountOutput,
  UnsignedTx,
  Tx
} from "../../src/apis/evm"
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
const axchain: EVMAPI = axia.AXChain()
const bintools: BinTools = BinTools.getInstance()
const axKeyChain: KeyChain = axchain.keyChain()
const cHexAddress: string = "0xeA6B543A9E625C04745EcA3D7a74D74B733b8C15"
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// Swap-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
axKeyChain.importKey(privKey)

// let privKey: string = "PrivateKey-24gdABgapjnsJfnYkfev6YPyQhTaCU72T9bavtDNTYivBLp2eW"
// Core-custom1u6eth2fg33ye63mnyu5jswtj326jaypvhyar45

// privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
// Swap-custom15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj

privKey = "PrivateKey-rKsiN3X4NSJcPpWxMSh7WcuY653NGQ7tfADgQwDZ9yyUPPDG9"
// Core-custom1jwwk62ktygl0w29rsq2hq55amamhpvx82kfnte
axKeyChain.importKey(privKey)
const cAddresses: Buffer[] = axchain.keyChain().getAddresses()
const cAddressStrings: string[] = axchain.keyChain().getAddressStrings()
const axChainId: string = Defaults.network[networkID].AX.blockchainID
const axChainIdBuf: Buffer = bintools.cb58Decode(axChainId)
const coreChainId: string = Defaults.network[networkID].Core.blockchainID
const coreChainIdBuf: Buffer = bintools.cb58Decode(coreChainId)
const importedIns: TransferableInput[] = []
const evmOutputs: EVMOutput[] = []
const fee: BN = axchain.getDefaultTxFee()

const main = async (): Promise<any> => {
  const u: any = await axchain.getUTXOs(cAddressStrings, "Core")
  const utxoSet: UTXOSet = u.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO): void => {
    const assetID: Buffer = utxo.getAssetID()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()
    const output: AmountOutput = utxo.getOutput() as AmountOutput
    const amount: BN = output.getAmount()
    const input: SECPTransferInput = new SECPTransferInput(amount)
    input.addSignatureIdx(0, cAddresses[1])
    input.addSignatureIdx(1, cAddresses[0])
    const xferin: TransferableInput = new TransferableInput(
      txid,
      outputidx,
      assetID,
      input
    )
    importedIns.push(xferin)

    const evmOutput: EVMOutput = new EVMOutput(
      cHexAddress,
      amount.sub(fee.mul(new BN(3))),
      assetID
    )
    evmOutputs.push(evmOutput)
  })

  const importTx: ImportTx = new ImportTx(
    networkID,
    axChainIdBuf,
    coreChainIdBuf,
    importedIns,
    evmOutputs
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(importTx)
  const tx: Tx = unsignedTx.sign(axKeyChain)
  const txid: string = await axchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
