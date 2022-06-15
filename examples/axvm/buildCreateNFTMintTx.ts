import { Axia, BinTools, BN, Buffer } from "../../src"
import {
  AXVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx,
  AXVMConstants,
  UTXO
} from "../../src/apis/axvm"
import { GetUTXOsResponse } from "../../src/apis/axvm/interfaces"
import { OutputOwners } from "../../src/common"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey,
  UnixNow
} from "../../src/utils"

// run ts-node examples/axvm/buildCreateNFTMintTx.ts
// before you run this example buildCreateNFTAssetTx.ts

const getUTXOIDs = (
  utxoSet: UTXOSet,
  txid: string,
  outputType: number = AXVMConstants.SECPXFEROUTPUTID_CODECONE,
  assetID = "2fSX8P4vhGNZsD3WELwwTxx4XzCNwicyFiYbp3Q965BMgJ8g9"
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
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const assetchain: AXVMAPI = axia.AssetChain()
const bintools: BinTools = BinTools.getInstance()
const xKeychain: KeyChain = assetchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
const xAddresses: Buffer[] = assetchain.keyChain().getAddresses()
const xAddressStrings: string[] = assetchain.keyChain().getAddressStrings()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "AXVM utility method buildCreateNFTMintTx to mint an ANT"
)
const payload: Buffer = Buffer.from("NFT Payload")
const asOf: BN = UnixNow()

const main = async (): Promise<any> => {
  const axvmUTXOResponse: GetUTXOsResponse = await assetchain.getUTXOs(
    xAddressStrings
  )
  const utxoSet: UTXOSet = axvmUTXOResponse.utxos
  const outputOwners: OutputOwners = new OutputOwners(
    xAddresses,
    locktime,
    threshold
  )
  const utxos: UTXO[] = utxoSet.getAllUTXOs()
  let txid: Buffer = Buffer.from(
    "2fSX8P4vhGNZsD3WELwwTxx4XzCNwicyFiYbp3Q965BMgJ8g9"
  )
  let assetID: Buffer = Buffer.from(
    "2fSX8P4vhGNZsD3WELwwTxx4XzCNwicyFiYbp3Q965BMgJ8g9"
  )
  utxos.forEach((utxo: UTXO): void => {
    if (utxo.getOutput().getTypeID() === 10) {
      txid = utxo.getTxID()
      assetID = utxo.getAssetID()
    }
  })
  const nftMintOutputUTXOIDs: string[] = getUTXOIDs(
    utxoSet,
    bintools.cb58Encode(txid),
    AXVMConstants.NFTMINTOUTPUTID,
    bintools.cb58Encode(assetID)
  )
  const nftMintOutputUTXOID: string = nftMintOutputUTXOIDs[0]
  const groupID: number = 0

  const unsignedTx: UnsignedTx = await assetchain.buildCreateNFTMintTx(
    utxoSet,
    outputOwners,
    xAddressStrings,
    xAddressStrings,
    nftMintOutputUTXOID,
    groupID,
    payload,
    memo,
    asOf
  )

  const tx: Tx = unsignedTx.sign(xKeychain)
  const id: string = await assetchain.issueTx(tx)
  console.log(`Success! TXID: ${id}`)
}

main()
