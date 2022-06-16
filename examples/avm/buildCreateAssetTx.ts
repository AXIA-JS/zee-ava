import { Axia, BN, Buffer } from "../../src"
import {
  AVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx,
  InitialStates,
  SECPMintOutput,
  SECPTransferOutput
} from "../../src/apis/avm"
import { GetUTXOsResponse } from "../../src/apis/avm/interfaces"
import {
  PrivateKeyPrefix,
  DefaultLocalGenesisPrivateKey
} from "../../src/utils"

const ip: string = "localhost"
const port: number = 9650
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const assetchain: AVMAPI = axia.AssetChain()
const xKeychain: KeyChain = assetchain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
xKeychain.importKey(privKey)
const xAddresses: Buffer[] = assetchain.keyChain().getAddresses()
const xAddressStrings: string[] = assetchain.keyChain().getAddressStrings()
const outputs: SECPMintOutput[] = []
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "AVM utility method buildCreateAssetTx to create an ANT"
)
const name: string = "TestToken"
const symbol: string = "TEST"
const denomination: number = 3

const main = async (): Promise<any> => {
  const avmUTXOResponse: GetUTXOsResponse = await assetchain.getUTXOs(
    xAddressStrings
  )
  const utxoSet: UTXOSet = avmUTXOResponse.utxos

  const amount: BN = new BN(507)
  const vcapSecpOutput = new SECPTransferOutput(
    amount,
    xAddresses,
    locktime,
    threshold
  )
  const initialStates: InitialStates = new InitialStates()
  initialStates.addOutput(vcapSecpOutput)

  const secpMintOutput: SECPMintOutput = new SECPMintOutput(
    xAddresses,
    locktime,
    threshold
  )
  outputs.push(secpMintOutput)

  const unsignedTx: UnsignedTx = await assetchain.buildCreateAssetTx(
    utxoSet,
    xAddressStrings,
    xAddressStrings,
    initialStates,
    name,
    symbol,
    denomination,
    outputs,
    memo
  )
  const tx: Tx = unsignedTx.sign(xKeychain)
  const txid: string = await assetchain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()