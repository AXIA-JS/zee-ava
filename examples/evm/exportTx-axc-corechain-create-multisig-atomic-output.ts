import { Axia, BinTools, BN, Buffer } from "../../src"
import {
  PlatformVMAPI,
  KeyChain as PlatformVMKeyChain
} from "../../src/apis/platformvm"
import {
  EVMAPI,
  KeyChain as EVMKeyChain,
  UnsignedTx,
  Tx,
  EVMInput,
  ExportTx,
  SECPTransferOutput,
  TransferableOutput
} from "../../src/apis/evm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults,
  ONEAXC
} from "../../src/utils"
const Web3 = require("web3")

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const corechain: PlatformVMAPI = axia.CoreChain()
const axchain: EVMAPI = axia.AXChain()
const bintools: BinTools = BinTools.getInstance()
const coreKeyChain: PlatformVMKeyChain = corechain.keyChain()
let privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
// Swap-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p

// let privKey: string = "PrivateKey-2PvNEohp3sNL41g4XcCBym5hpeT1szSTZXxL7VGS28eoGvq3k7"
const axKeyChain: EVMKeyChain = axchain.keyChain()
axKeyChain.importKey(privKey)

privKey = "PrivateKey-24gdABgapjnsJfnYkfev6YPyQhTaCU72T9bavtDNTYivBLp2eW"
// Core-custom1u6eth2fg33ye63mnyu5jswtj326jaypvhyar45
coreKeyChain.importKey(privKey)

// privKey = "PrivateKey-R6e8f5QSa89DjpvL9asNdhdJ4u8VqzMJStPV8VVdDmLgPd8a4"
// Swap-custom15s7p7mkdev0uajrd0pzxh88kr8ryccztnlmzvj

privKey = "PrivateKey-rKsiN3X4NSJcPpWxMSh7WcuY653NGQ7tfADgQwDZ9yyUPPDG9"
// Core-custom1jwwk62ktygl0w29rsq2hq55amamhpvx82kfnte
coreKeyChain.importKey(privKey)
const pAddresses: Buffer[] = corechain.keyChain().getAddresses()
const cAddresses: Buffer[] = axchain.keyChain().getAddresses()
const coreChainId: string = Defaults.network[networkID].Core.blockchainID
const coreChainIdBuf: Buffer = bintools.cb58Decode(coreChainId)
const axChainId: string = Defaults.network[networkID].AX.blockchainID
const axChainIdBuf: Buffer = bintools.cb58Decode(axChainId)
const axcAssetID: string = Defaults.network[networkID].Swap.axcAssetID
const axcAssetIDBuf: Buffer = bintools.cb58Decode(axcAssetID)
const cHexAddress: string = "0xeA6B543A9E625C04745EcA3D7a74D74B733b8C15"
const evmInputs: EVMInput[] = []
const exportedOuts: TransferableOutput[] = []
const path: string = "/ext/bc/AX/rpc"
const web3 = new Web3(`${protocol}://${ip}:${port}${path}`)
const threshold: number = 2

const main = async (): Promise<any> => {
  let balance: BN = await web3.eth.getBalance(cHexAddress)
  balance = new BN(balance.toString().substring(0, 17))
  const fee: BN = axchain.getDefaultTxFee()
  const txcount = await web3.eth.getTransactionCount(cHexAddress)
  const nonce: number = txcount
  const locktime: BN = new BN(0)

  const evmInput: EVMInput = new EVMInput(
    cHexAddress,
    ONEAXC,
    axcAssetID,
    nonce
  )
  evmInput.addSignatureIdx(0, cAddresses[0])
  evmInputs.push(evmInput)

  const secpTransferOutput: SECPTransferOutput = new SECPTransferOutput(
    ONEAXC.sub(fee.mul(new BN(2))),
    pAddresses,
    locktime,
    threshold
  )
  const transferableOutput: TransferableOutput = new TransferableOutput(
    axcAssetIDBuf,
    secpTransferOutput
  )
  exportedOuts.push(transferableOutput)

  const exportTx: ExportTx = new ExportTx(
    networkID,
    axChainIdBuf,
    coreChainIdBuf,
    evmInputs,
    exportedOuts
  )

  const unsignedTx: UnsignedTx = new UnsignedTx(exportTx)
  const tx: Tx = unsignedTx.sign(axKeyChain)
  const txid: string = await axchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
