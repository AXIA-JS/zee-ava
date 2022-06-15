import { Axia, BN, Buffer } from "../../src"
import {
  AXVMAPI,
  KeyChain as AXVMKeyChain,
  UTXOSet,
  UnsignedTx,
  Tx,
  MinterSet
} from "../../src/apis/axvm"
import { GetUTXOsResponse } from "../../src/apis/axvm/interfaces"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  UnixNow
} from "../../src/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const assetchain: AXVMAPI = axia.AssetChain()
const xKeychain: AXVMKeyChain = assetchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
const xAddresses: Buffer[] = assetchain.keyChain().getAddresses()
const xAddressStrings: string[] = assetchain.keyChain().getAddressStrings()
const threshold: number = 1
const locktime: BN = new BN(0)
const asOf: BN = UnixNow()
const memo: Buffer = Buffer.from(
  "AXVM utility method buildCreateNFTAssetTx to create an NFT"
)
const name: string = "non fungible token"
const symbol: string = "NFT"

const main = async (): Promise<any> => {
  const axvmUTXOResponse: GetUTXOsResponse = await assetchain.getUTXOs(
    xAddressStrings
  )
  const utxoSet: UTXOSet = axvmUTXOResponse.utxos
  const minterSets: MinterSet[] = [new MinterSet(threshold, xAddresses)]
  const unsignedTx: UnsignedTx = await assetchain.buildCreateNFTAssetTx(
    utxoSet,
    xAddressStrings,
    xAddressStrings,
    minterSets,
    name,
    symbol,
    memo,
    asOf,
    locktime
  )

  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await assetchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
