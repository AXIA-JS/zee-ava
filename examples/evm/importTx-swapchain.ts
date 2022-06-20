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
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const axchain: EVMAPI = axia.AXChain()
const bintools: BinTools = BinTools.getInstance()
const cKeychain: KeyChain = axchain.keyChain()
const cHexAddress: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
cKeychain.importKey(privKey)
const cAddresses: Buffer[] = axchain.keyChain().getAddresses()
const cAddressStrings: string[] = axchain.keyChain().getAddressStrings()
const axChainBlockchainIdStr: string =
  Defaults.network[networkID].C.blockchainID
const axChainBlockchainIdBuf: Buffer = bintools.cb58Decode(
  axChainBlockchainIdStr
)
const swapChainBlockchainIdStr: string =
  Defaults.network[networkID].X.blockchainID
const swapChainBlockchainIdBuf: Buffer = bintools.cb58Decode(
  swapChainBlockchainIdStr
)
const importedIns: TransferableInput[] = []
const evmOutputs: EVMOutput[] = []
const fee: BN = axchain.getDefaultTxFee()

const main = async (): Promise<any> => {
  const u: any = await axchain.getUTXOs(cAddressStrings[0], "X")
  const utxoSet: UTXOSet = u.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO) => {
    const assetID: Buffer = utxo.getAssetID()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()
    const output: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = output.getAmount().clone()
    const input: SECPTransferInput = new SECPTransferInput(amt)
    input.addSignatureIdx(0, cAddresses[0])
    const xferin: TransferableInput = new TransferableInput(
      txid,
      outputidx,
      assetID,
      input
    )
    importedIns.push(xferin)

    const evmOutput: EVMOutput = new EVMOutput(
      cHexAddress,
      amt.sub(fee),
      assetID
    )
    evmOutputs.push(evmOutput)
  })

  const importTx: ImportTx = new ImportTx(
    networkID,
    axChainBlockchainIdBuf,
    swapChainBlockchainIdBuf,
    importedIns,
    evmOutputs
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(importTx)
  const tx: Tx = unsignedTx.sign(cKeychain)
  const txid: string = await axchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
