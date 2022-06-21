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
  AddNominatorTx,
  Tx,
  SECPOwnerOutput,
  ParseableOutput
} from "../../src/apis/platformvm"
import { Output } from "../../src/common"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults,
  NodeIDStringToBuffer,
  UnixNow
} from "../../src/utils"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const corechain: PlatformVMAPI = axia.CoreChain()
const bintools: BinTools = BinTools.getInstance()
const coreKeyChain: KeyChain = corechain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
coreKeyChain.importKey(privKey)
const pAddresses: Buffer[] = corechain.keyChain().getAddresses()
const pAddressStrings: string[] = corechain.keyChain().getAddressStrings()
const coreChainBlockchainID: string =
  Defaults.network[networkID].Core.blockchainID
const outputs: TransferableOutput[] = []
const inputs: TransferableInput[] = []
const stakeOuts: TransferableOutput[] = []
const fee: BN = corechain.getDefaultTxFee()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "Manually add a nominator to the primary allychain"
)
const nodeID: string = "NodeID-DueWyGi3B9jtKfa9mPoecd4YSDJ1ftF69"
const startTime: BN = UnixNow().add(new BN(60 * 1))
const endTime: BN = startTime.add(new BN(2630000))

const main = async (): Promise<any> => {
  const stakeAmount: any = await corechain.getMinStake()
  const axcAssetID: Buffer = await corechain.getAXCAssetID()
  const getBalanceResponse: any = await corechain.getBalance(pAddressStrings[0])
  const unlocked: BN = new BN(getBalanceResponse.unlocked)
  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    unlocked.sub(fee).sub(stakeAmount.minValidatorStake),
    pAddresses,
    locktime,
    threshold
  )
  const transferableOutput: TransferableOutput = new TransferableOutput(
    axcAssetID,
    secpTransferOutput
  )
  outputs.push(transferableOutput)

  const stakeSECPTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    stakeAmount.minValidatorStake,
    pAddresses,
    locktime,
    threshold
  )
  const stakeTransferableOutput: TransferableOutput = new TransferableOutput(
    axcAssetID,
    stakeSECPTransferOutput
  )
  stakeOuts.push(stakeTransferableOutput)

  const rewardOutputOwners: SECPOwnerOutput = new SECPOwnerOutput(
    pAddresses,
    locktime,
    threshold
  )
  const rewardOwners: ParseableOutput = new ParseableOutput(rewardOutputOwners)

  const platformVMUTXOResponse: any = await corechain.getUTXOs(pAddressStrings)
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  utxos.forEach((utxo: UTXO) => {
    const output: Output = utxo.getOutput()
    if (output.getOutputID() === 7) {
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
    }
  })

  const addNominatorTx: AddNominatorTx = new AddNominatorTx(
    networkID,
    bintools.cb58Decode(coreChainBlockchainID),
    outputs,
    inputs,
    memo,
    NodeIDStringToBuffer(nodeID),
    startTime,
    endTime,
    stakeAmount.minNominatorStake,
    stakeOuts,
    rewardOwners
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(addNominatorTx)
  const tx: Tx = unsignedTx.sign(coreKeyChain)
  const txid: string = await corechain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
