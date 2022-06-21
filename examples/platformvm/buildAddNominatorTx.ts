import { Axia, BN, Buffer } from "../../src"
import {
  PlatformVMAPI,
  KeyChain,
  UTXOSet,
  UnsignedTx,
  Tx
} from "../../src/apis/platformvm"
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
const corechain: PlatformVMAPI = axia.CoreChain()
const coreKeyChain: KeyChain = corechain.keyChain()
const privKey: string = `${PrivateKeyPrefix}${DefaultLocalGenesisPrivateKey}`
coreKeyChain.importKey(privKey)
const pAddressStrings: string[] = corechain.keyChain().getAddressStrings()
const threshold: number = 1
const locktime: BN = new BN(0)
const memo: Buffer = Buffer.from(
  "PlatformVM utility method buildAddNominatorTx to add a nominator to the primary allychain"
)
const asOf: BN = UnixNow()
const nodeID: string = "NodeID-DueWyGi3B9jtKfa9mPoecd4YSDJ1ftF69"
const startTime: BN = UnixNow().add(new BN(60 * 1))
const endTime: BN = startTime.add(new BN(2630000))

const main = async (): Promise<any> => {
  const stakeAmount: any = await corechain.getMinStake()
  const platformVMUTXOResponse: any = await corechain.getUTXOs(pAddressStrings)
  const utxoSet: UTXOSet = platformVMUTXOResponse.utxos

  const unsignedTx: UnsignedTx = await corechain.buildAddNominatorTx(
    utxoSet,
    pAddressStrings,
    pAddressStrings,
    pAddressStrings,
    nodeID,
    startTime,
    endTime,
    stakeAmount.minNominatorStake,
    pAddressStrings,
    locktime,
    threshold,
    memo,
    asOf
  )

  const tx: Tx = unsignedTx.sign(coreKeyChain)
  const txid: string = await corechain.issueTx(tx)
  console.log(`Success! TXID: ${txid}`)
}

main()
