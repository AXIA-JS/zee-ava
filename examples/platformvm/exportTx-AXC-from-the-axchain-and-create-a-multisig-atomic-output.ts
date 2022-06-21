import { Axia, BinTools, BN, Buffer } from "../../src"
import { EVMAPI, KeyChain as EVMKeyChain } from "../../src/apis/evm"
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
const axchain: EVMAPI = axia.AXChain()
const corechain: PlatformVMAPI = axia.CoreChain()
const bintools: BinTools = BinTools.getInstance()
const axKeyChain: EVMKeyChain = axchain.keyChain()
const coreKeyChain: KeyChain = corechain.keyChain()
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// Swap-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
axKeyChain.importKey(privKey)
coreKeyChain.importKey(privKey)

// let privKey: string = "PrivateKey-24gdABgapjnsJfnYkfev6YPyQhTaCU72T9bavtDNTYivBLp2eW"
// Core-custom1u6eth2fg33ye63mnyu5jswtj326jaypvhyar45

// privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
// Core-custom15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj

privKey = "PrivateKey-rKsiN3X4NSJcPpWxMSh7WcuY653NGQ7tfADgQwDZ9yyUPPDG9"
// Core-custom1jwwk62ktygl0w29rsq2hq55amamhpvx82kfnte
axKeyChain.importKey(privKey)
coreKeyChain.importKey(privKey)
const cAddresses: Buffer[] = axchain.keyChain().getAddresses()
const pAddresses: Buffer[] = corechain.keyChain().getAddresses()
const pAddressStrings: string[] = corechain.keyChain().getAddressStrings()
const axChainID: string = Defaults.network[networkID].AX.blockchainID
const axChainIDBuf: Buffer = bintools.cb58Decode(axChainID)
const coreChainID: string = Defaults.network[networkID].Core.blockchainID
const coreChainIDBuf: Buffer = bintools.cb58Decode(coreChainID)
const exportedOuts: TransferableOutput[] = []
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = MILLIAXC
const threshold: number = 2
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "Export AXC from CoreChain to AXChain and consume a multisig output and create a multisig atomic output"
)

const main = async (): Promise<any> => {
  const axcAssetID: Buffer = await corechain.getAXCAssetID()
  const getBalanceResponse: any = await corechain.getBalance(pAddressStrings[0])
  const unlocked: BN = new BN(getBalanceResponse.unlocked)
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    unlocked.sub(fee),
    cAddresses,
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
  utxos.forEach((utxo: UTXO): void => {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()

    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    secpTransferInput.addSignatureIdx(0, pAddresses[1])
    if (utxo.getOutput().getThreshold() === 2) {
      secpTransferInput.addSignatureIdx(1, pAddresses[0])
    }

    const input: TransferableInput = new TransferableInput(
      txid,
      outputidx,
      axcAssetID,
      secpTransferInput
    )
    inputs.push(input)
  })

  const exportTx: ExportTx = new ExportTx(
    networkID,
    coreChainIDBuf,
    outputs,
    inputs,
    memo,
    axChainIDBuf,
    exportedOuts
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(exportTx)
  const tx: Tx = unsignedTx.sign(coreKeyChain)
  const txid: string = await corechain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
