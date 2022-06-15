import { Buffer } from "buffer/"
import { AllyChainAuth } from "src/apis/platformvm"
import BinTools from "src/utils/bintools"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()

describe("AllyChainAuth", (): void => {
  const allyChainAuth1: AllyChainAuth = new AllyChainAuth()
  const allyChainAuth2: AllyChainAuth = new AllyChainAuth()

  test("getters", (): void => {
    const typeName: string = allyChainAuth1.getTypeName()
    expect(typeName).toBe("AllyChainAuth")

    const typeID: number = allyChainAuth1.getTypeID()
    expect(typeID).toBe(10)

    let addressIndex: Buffer = Buffer.alloc(4)
    addressIndex.writeUIntBE(0, 0, 4)
    allyChainAuth1.addAddressIndex(addressIndex)
    addressIndex = Buffer.alloc(4)
    addressIndex.writeUIntBE(1, 0, 4)
    allyChainAuth1.addAddressIndex(addressIndex)

    const numAddressIndices: number = allyChainAuth1.getNumAddressIndices()
    expect(numAddressIndices).toBe(2)

    const addressIndices: Buffer[] = allyChainAuth1.getAddressIndices()
    expect(Buffer.isBuffer(addressIndices[0])).toBeTruthy()
    expect(bintools.fromBufferToBN(addressIndices[0]).toNumber()).toBe(0)
    expect(bintools.fromBufferToBN(addressIndices[1]).toNumber()).toBe(1)
  })

  test("toBuffer", (): void => {
    const allyChainAuth1Buf: Buffer = allyChainAuth1.toBuffer()
    allyChainAuth2.fromBuffer(allyChainAuth1Buf)
    const allyChainAuth1Hex: string = allyChainAuth1.toBuffer().toString("hex")
    const allyChainAuth2Hex: string = allyChainAuth2.toBuffer().toString("hex")
    expect(allyChainAuth1Hex).toBe(allyChainAuth2Hex)
  })
})
