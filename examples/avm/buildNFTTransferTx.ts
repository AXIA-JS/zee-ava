import { Axia, BinTools, BN, Buffer } from "../../src"
import {
  AVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx,
  AVMConstants,
  UTXO
} from "../../src/apis/avm"
import { GetUTXOsResponse } from "../../src/apis/avm/interfaces"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  UnixNow
} from "../../src/utils"

const getUTXOIDs = (
  utxoSet: UTXOSet,
  txid: string,
  outputType: number = AVMConstants.SECPXFEROUTPUTID_CODECONE,
  assetID = "2fombhL7aGPwj3KH4bfrmJwW6PVnMobf9Y2fn9GwxiAAJyFDbe"
): string[] => {
  const utxoids: string[] = utxoSet.getUTXOIDs()
  let result: string[] = []
  for (let index: number = 0; index < utxoids.length; ++index) {
    if (
      utxoids[index].indexOf(txid.slice(0, 10)) != -1 &&
      utxoSet.getUTXO(utxoids[index]).getOutput().getOutputID() == outputType &&
      assetID ==
        bintools.cb58Encode(utxoSet.getUTXO(utxoids[index]).getAssetID())
    ) {
      result.push(utxoids[index])
    }
  }
  return result
}

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const swapchain: AVMAPI = axia.SwapChain()
const bintools: BinTools = BinTools.getInstance()
const swapKeyChain: KeyChain = swapchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
swapKeyChain.importKey(privKey)
const xAddressStrings: string[] = swapchain.keyChain().getAddressStrings()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "AVM utility method buildNFTTransferTx to transfer an ANT"
)
const asOf: BN = UnixNow()

const main = async (): Promise<any> => {
  const avmUTXOResponse: GetUTXOsResponse = await swapchain.getUTXOs(
    xAddressStrings
  )
  const utxoSet: UTXOSet = avmUTXOResponse.utxos
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  let txid: Buffer = Buffer.from("")
  let assetID: Buffer = Buffer.from("")
  utxos.forEach((utxo: UTXO) => {
    if (utxo.getOutput().getTypeID() === 11) {
      txid = utxo.getTxID()
      assetID = utxo.getAssetID()
    }
  })
  const nftTransferOutputUTXOIDs: string[] = getUTXOIDs(
    utxoSet,
    bintools.cb58Encode(txid),
    AVMConstants.NFTXFEROUTPUTID,
    bintools.cb58Encode(assetID)
  )
  const nftTransferOutputUTXOID: string = nftTransferOutputUTXOIDs[0]

  const unsignedTx: UnsignedTx = await swapchain.buildNFTTransferTx(
    utxoSet,
    xAddressStrings,
    xAddressStrings,
    xAddressStrings,
    nftTransferOutputUTXOID,
    memo,
    asOf,
    locktime,
    threshold
  )

  const tx: Tx = unsignedTx.sign(swapKeyChain)
  const id: string = await swapchain.issueTx(tx)
  console.log(`Success! TXID: ${id}`)
}

main()
