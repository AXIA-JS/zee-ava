import { Axia, BinTools, BN, Buffer } from "../../src"
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
  AddSubnetValidatorTx
} from "../../src/apis/platformvm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  NodeIDStringToBuffer,
  Defaults
} from "../../src/utils"

const bintools: BinTools = BinTools.getInstance()
const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const corechain: PlatformVMAPI = axia.CoreChain()
// Keychain with 4 keys-A, B, C, and D
const pKeychain: KeyChain = corechain.keyChain()
// Keypair A
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// P-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p
pKeychain.importKey(privKey)

// Keypair B
privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
// P-custom15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj
pKeychain.importKey(privKey)

// Keypair C
privKey = "PrivateKey-24gdABgapjnsJfnYkfev6YPyQhTaCU72T9bavtDNTYivBLp2eW"
// P-custom1u6eth2fg33ye63mnyu5jswtj326jaypvhyar45
pKeychain.importKey(privKey)

// Keypair D
privKey = "PrivateKey-2uWuEQbY5t7NPzgqzDrXSgGPhi3uyKj2FeAvPUHYo6CmENHJfn"
// P-custom1t3qjau2pf3ys83yallqt4y5xc3l6ya5f7wr6aq
pKeychain.importKey(privKey)
const pAddresses: Buffer[] = corechain.keyChain().getAddresses()
const pAddressStrings: string[] = corechain.keyChain().getAddressStrings()
const coreChainBlockchainID: string = Defaults.network[networkID].P.blockchainID
const coreChainBlockchainIDBuf: Buffer = bintools.cb58Decode(
  coreChainBlockchainID
)
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const fee: BN = corechain.getDefaultTxFee()
const threshold: number = 1
const locktime: BN = new BN(0)
const nodeID: string = "NodeID-NFBbbJ4qCmNaCzeW7sxErhvWqvEQMnYcN"
const startTime: BN = new BN(1652146558)
const endTime: BN = new BN(1653442362)
const memo: Buffer = Buffer.from(
  "Manually create a AddSubnetValidatorTx which creates a 1-of-2 AXC utxo and adds a validator to a subnet by correctly signing the 2-of-3 SubnetAuth"
)
const axcUTXOKeychain: Buffer[] = [pAddresses[0], pAddresses[1]]

const main = async (): Promise<any> => {
  const axcAssetID: Buffer = await corechain.getAXCAssetID()
  const getBalanceResponse: any = await corechain.getBalance(pAddressStrings[0])
  const unlocked: BN = new BN(getBalanceResponse.unlocked)
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    unlocked.sub(fee),
    axcUTXOKeychain,
    locktime,
    threshold
  )
  const transferableOutput: TransferableOutput = new TransferableOutput(
    axcAssetID,
    secpTransferOutput
  )
  outputs.push(transferableOutput)

  const platformVMUTXOResponse: any = await corechain.getUTXOs(pAddressStrings)
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO): void => {
    const amountOutput: AmountOutput = utxo.getOutput() as AmountOutput
    const amt: BN = amountOutput.getAmount().clone()
    const txid: Buffer = utxo.getTxID()
    const outputidx: Buffer = utxo.getOutputIdx()

    const secpTransferInput: SECPTransferInput = new SECPTransferInput(amt)
    secpTransferInput.addSignatureIdx(0, pAddresses[0])

    const input: TransferableInput = new TransferableInput(
      txid,
      outputidx,
      axcAssetID,
      secpTransferInput
    )
    inputs.push(input)
  })

  const weight: BN = new BN(1)
  const subnetID: Buffer = bintools.cb58Decode(
    "yKRV4EvGYWj7HHXUxSYzaAQVazEvaFPKPhJie4paqbrML5dub"
  )
  const nodeIDBuf: Buffer = NodeIDStringToBuffer(nodeID)
  const addSubnetValidatorTx: AddSubnetValidatorTx =
    new AddSubnetValidatorTx(
      networkID,
      coreChainBlockchainIDBuf,
      outputs,
      inputs,
      memo,
      nodeIDBuf,
      startTime,
      endTime,
      weight,
      subnetID
    )
  addSubnetValidatorTx.addSignatureIdx(0, pAddresses[3])
  addSubnetValidatorTx.addSignatureIdx(1, pAddresses[1])
  const unsignedTx: UnsignedTx = new UnsignedTx(addSubnetValidatorTx)
  const tx: Tx = unsignedTx.sign(pKeychain)
  const txid: string = await corechain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
