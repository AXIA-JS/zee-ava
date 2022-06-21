import { Axia, BN, Buffer } from "../../src"
import {
  AVMAPI,
  KeyChain as AVMKeyChain,
  UTXOSet,
  UnsignedTx,
  Tx,
  MinterSet
} from "../../src/apis/avm"
import { GetUTXOsResponse } from "../../src/apis/avm/interfaces"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  UnixNow
} from "../../src/utils"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const swapchain: AVMAPI = axia.SwapChain()
const swapKeyChain: AVMKeyChain = swapchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
swapKeyChain.importKey(privKey)
const xAddresses: Buffer[] = swapchain.keyChain().getAddresses()
const xAddressStrings: string[] = swapchain.keyChain().getAddressStrings()
const threshold: number = 1
const locktime: BN = new BN(0)
const asOf: BN = UnixNow()
const memo: Buffer = Buffer.from(
  "AVM utility method buildCreateNFTAssetTx to create an NFT"
)
const name: string = "non fungible token"
const symbol: string = "NFT"

const main = async (): Promise<any> => {
  const avmUTXOResponse: GetUTXOsResponse = await swapchain.getUTXOs(
    xAddressStrings
  )
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const minterSets: MinterSet[] = [new MinterSet(threshold, xAddresses)]
  const unsignedTx: UnsignedTx = await swapchain.buildCreateNFTAssetTx(
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

  const tx: Tx = unsignedTx.sign(swapKeyChain)
  const txid: string = await swapchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
