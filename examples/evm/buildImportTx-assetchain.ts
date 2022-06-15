import { Axia, BN } from "../../src"
import { AXVMAPI, KeyChain as AXVMKeyChain } from "../../src/apis/axvm"
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
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const assetchain: AXVMAPI = axia.AssetChain()
const appchain: EVMAPI = axia.AppChain()
const xKeychain: AXVMKeyChain = assetchain.keyChain()
const cHexAddress: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
const cKeychain: EVMKeyChain = appchain.keyChain()
xKeychain.importKey(privKey)
cKeychain.importKey(privKey)
const cAddressStrings: string[] = appchain.keyChain().getAddressStrings()
const assetChainBlockchainId: string =
  Defaults.network[networkID].X.blockchainID

const main = async (): Promise<any> => {
  const baseFeeResponse: string = await appchain.getBaseFee()
  const baseFee = new BN(parseInt(baseFeeResponse, 16) / 1e9)
  let fee: BN = baseFee
  const evmUTXOResponse: any = await appchain.getUTXOs(
    cAddressStrings,
    assetChainBlockchainId
  )
  const utxoSet: UTXOSet = evmUTXOResponse.utxos
  let unsignedTx: UnsignedTx = await appchain.buildImportTx(
    utxoSet,
    cHexAddress,
    cAddressStrings,
    assetChainBlockchainId,
    cAddressStrings,
    fee
  )
  const importCost: number = costImportTx(unsignedTx)
  fee = baseFee.mul(new BN(importCost))

  unsignedTx = await appchain.buildImportTx(
    utxoSet,
    cHexAddress,
    cAddressStrings,
    assetChainBlockchainId,
    cAddressStrings,
    fee
  )

  const tx: Tx = unsignedTx.sign(cKeychain)
  const txid: string = await appchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
