import BN from "bn.js"
import { Buffer } from "buffer/"
import {
  AddAllyChainValidatorTx,
  PlatformVMConstants,
  AllyChainAuth
} from "src/apis/platformvm"
import { bufferToNodeIDString } from "src/utils"

describe("AddAllyChainValidatorTx", (): void => {
  const addAllyChainValidatorTxHex: string =
    "0000053900000000000000000000000000000000000000000000000000000000000000000000000117cc8b1578ba383544d163958822d8abd3849bb9dfabe39fcbc3e7ee8811fe2f00000007006a94d71389b180000000000000000000000001000000023cb7d3842e8cee6a0ebd09f1fe884f6861e1b29ca43c1f6ecdcb1fcec86d78446b9cf619c64c604b00000001f7fc296b05e7a960e9d2739c1cabdb58f22e5c582e1a7b0877fb10e78cf4e7ec0000000017cc8b1578ba383544d163958822d8abd3849bb9dfabe39fcbc3e7ee8811fe2f00000005006a94d71398f3c00000000100000000000000934d616e75616c6c79206372656174652061204164645375626e657456616c696461746f7254782077686963682063726561746573206120312d6f662d322041564158207574786f20616e64206164647320612076616c696461746f7220746f2061207375626e657420627920636f72726563746c79207369676e696e672074686520322d6f662d33205375626e657441757468de31b4d8b22991d51aa6aa1fc733f23a851a8c94000000006279e79c00000000628d873a00000000000000017fe044f9e97347c0a5ffe5a0f5773b42398c0e2b85948616da681585d460e1a80000000a000000020000000000000001"
  const addAllyChainValidatorTxBuf: Buffer = Buffer.from(
    addAllyChainValidatorTxHex,
    "hex"
  )
  const addAllyChainValidatorTx: AddAllyChainValidatorTx =
    new AddAllyChainValidatorTx()
  addAllyChainValidatorTx.fromBuffer(addAllyChainValidatorTxBuf)

  test("getTypeName", async (): Promise<void> => {
    const addAllyChainValidatorTxTypeName: string =
      addAllyChainValidatorTx.getTypeName()
    expect(addAllyChainValidatorTxTypeName).toBe("AddAllyChainValidatorTx")
  })

  test("getTypeID", async (): Promise<void> => {
    const addAllyChainValidatorTxTypeID: number =
      addAllyChainValidatorTx.getTypeID()
    expect(addAllyChainValidatorTxTypeID).toBe(
      PlatformVMConstants.ADDALLYCHAINVALIDATORTX
    )
  })

  test("toBuffer and fromBuffer", async (): Promise<void> => {
    const buf: Buffer = addAllyChainValidatorTx.toBuffer()
    const asvTx: AddAllyChainValidatorTx = new AddAllyChainValidatorTx()
    asvTx.fromBuffer(buf)
    const buf2: Buffer = asvTx.toBuffer()
    expect(buf.toString("hex")).toBe(buf2.toString("hex"))
  })

  test("getNodeID", async (): Promise<void> => {
    const nodeID: string = "NodeID-MFrZFVCXPv5iCn6M9K6XduxGTYp891xXZ"
    const nodeIDBuf: Buffer = addAllyChainValidatorTx.getNodeID()
    const nID: string = bufferToNodeIDString(nodeIDBuf)
    expect(nID).toBe(nodeID)
  })

  test("getStartTime", async (): Promise<void> => {
    const startTime: BN = new BN(1652156316)
    const st: BN = addAllyChainValidatorTx.getStartTime()
    expect(startTime.toString()).toBe(st.toString())
  })

  test("getEndTime", async (): Promise<void> => {
    const endTime: BN = new BN(1653442362)
    const et: BN = addAllyChainValidatorTx.getEndTime()
    expect(endTime.toString()).toBe(et.toString())
  })

  test("getWeight", async (): Promise<void> => {
    const weight: BN = new BN(1)
    const w: BN = addAllyChainValidatorTx.getWeight()
    expect(weight.toString()).toBe(w.toString())
  })

  test("getAllyChainID", async (): Promise<void> => {
    const allyChainID: string =
      "yKRV4EvGYWj7HHXUxSYzaAQVazEvaFPKPhJie4paqbrML5dub"
    const sID: string = addAllyChainValidatorTx.getAllyChainID()
    expect(allyChainID).toBe(sID)
  })

  describe("AllyChainAuth", (): void => {
    const sa: AllyChainAuth = addAllyChainValidatorTx.getAllyChainAuth()

    test("getTypeName", async (): Promise<void> => {
      const allyChainAuthTypeName: string = sa.getTypeName()
      expect(allyChainAuthTypeName).toBe("AllyChainAuth")
    })

    test("getTypeID", async (): Promise<void> => {
      const allyChainAuthTypeID: number = sa.getTypeID()
      expect(allyChainAuthTypeID).toBe(PlatformVMConstants.ALLYCHAINAUTH)
    })

    test("getNumAddressIndices", async (): Promise<void> => {
      const numAddressIndices: number = sa.getNumAddressIndices()
      const nAI: number = 2
      expect(numAddressIndices).toBe(nAI)
    })

    test("addressIndices", async (): Promise<void> => {
      const ai: number[] = [0, 1]
      const addressIndices: Buffer[] = sa.getAddressIndices()
      addressIndices.forEach((addressIndex: Buffer, index: number) => {
        expect(addressIndex.readInt32BE(0)).toBe(ai[index])
      })
    })
  })
})
