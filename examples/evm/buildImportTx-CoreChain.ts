import { Axia, BN } from "../../src"
import {
  PlatformVMAPI,
  KeyChain as PlatformVMKeyChain
} from "../../src/apis/platformvm"
import {
  EVMAPI,
  KeyChain as EVMKeyChain,
  UnsignedTx,
  Tx,
  UTXOSet
} from "../../src/apis/evm"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  Defaults,
  costImportTx
} from "../../src/utils"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const corechain: PlatformVMAPI = axia.CoreChain()
const axchain: EVMAPI = axia.AXChain()
const coreKeyChain: PlatformVMKeyChain = corechain.keyChain()
const cHexAddress: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const axKeyChain: EVMKeyChain = axchain.keyChain()
coreKeyChain.importKey(privKey)
axKeyChain.importKey(privKey)
const cAddressStrings: string[] = axchain.keyChain().getAddressStrings()
const coreChainBlockchainId: string =
  Defaults.network[networkID].Core.blockchainID

const main = async (): Promise<any> => {
  const baseFeeResponse: string = await axchain.getBaseFee()
  const baseFee = new BN(parseInt(baseFeeResponse, 16) / 1e9)
  let fee: BN = baseFee
  const evmUTXOResponse: any = await axchain.getUTXOs(
    cAddressStrings,
    coreChainBlockchainId
  )
  const utxoSet: UTXOSet = evmUTXOResponse.utxos
  let unsignedTx: UnsignedTx = await axchain.buildImportTx(
    utxoSet,
    cHexAddress,
    cAddressStrings,
    coreChainBlockchainId,
    cAddressStrings,
    fee
  )
  const importCost: number = costImportTx(unsignedTx)
  fee = baseFee.mul(new BN(importCost))

  unsignedTx = await axchain.buildImportTx(
    utxoSet,
    cHexAddress,
    cAddressStrings,
    coreChainBlockchainId,
    cAddressStrings,
    fee
  )

  const tx: Tx = unsignedTx.sign(axKeyChain)
  const txid: string = await axchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
