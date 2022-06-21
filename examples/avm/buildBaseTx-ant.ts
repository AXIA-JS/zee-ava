import { GetUTXOsResponse } from "../../src/apis/avm/interfaces"
import { Axia, BN, Buffer } from "../../src"
import { AVMAPI, KeyChain, UTXOSet, UnsignedTx, Tx } from "../../src/apis/avm"
import { UnixNow } from "../../src/utils"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey
} from "../../src/utils"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const swapchain: AVMAPI = axia.SwapChain()
const swapKeyChain: KeyChain = swapchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
swapKeyChain.importKey(privKey)
const xAddressStrings: string[] = swapchain.keyChain().getAddressStrings()
const asOf: BN = UnixNow()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "AVM utility method buildBaseTx to send an ANT"
)

const main = async (): Promise<any> => {
  const amount: BN = new BN(5)
  const avmUTXOResponse: GetUTXOsResponse = await swapchain.getUTXOs(
    xAddressStrings
  )
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const assetID: string = "KD4byR998qmVivF2zmrhLb6gjwKGSB5xCerV2nYXb4XNXVGEP"
  const toAddresses: string[] = [xAddressStrings[0]]

  const unsignedTx: UnsignedTx = await swapchain.buildBaseTx(
    utxoSet,
    amount,
    assetID,
    toAddresses,
    xAddressStrings,
    xAddressStrings,
    memo,
    asOf,
    locktime,
    threshold
  )

  const tx: Tx = unsignedTx.sign(swapKeyChain)
  const txid: string = await swapchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
