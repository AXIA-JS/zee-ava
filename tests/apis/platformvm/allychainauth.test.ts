import { Buffer } from "buffer/"
import { AllychainAuth } from "src/apis/platformvm"
import BinTools from "src/utils/bintools"

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance()

describe("AllychainAuth", (): void => {
  const allychainAuth1: AllychainAuth = new AllychainAuth()
  const allychainAuth2: AllychainAuth = new AllychainAuth()

  test("getters", (): void => {
    const typeName: string = allychainAuth1.getTypeName()
    expect(typeName).toBe("AllychainAuth")

    const typeID: number = allychainAuth1.getTypeID()
    expect(typeID).toBe(10)

    let addressIndex: Buffer = Buffer.alloc(4)
    addressIndex.writeUIntBE(0, 0, 4)
    allychainAuth1.addAddressIndex(addressIndex)
    addressIndex = Buffer.alloc(4)
    addressIndex.writeUIntBE(1, 0, 4)
    allychainAuth1.addAddressIndex(addressIndex)

    const numAddressIndices: number = allychainAuth1.getNumAddressIndices()
    expect(numAddressIndices).toBe(2)

    const addressIndices: Buffer[] = allychainAuth1.getAddressIndices()
    expect(Buffer.isBuffer(addressIndices[0])).toBeTruthy()
    expect(bintools.fromBufferToBN(addressIndices[0]).toNumber()).toBe(0)
    expect(bintools.fromBufferToBN(addressIndices[1]).toNumber()).toBe(1)
  })

  test("toBuffer", (): void => {
    const allychainAuth1Buf: Buffer = allychainAuth1.toBuffer()
    allychainAuth2.fromBuffer(allychainAuth1Buf)
    const allychainAuth1Hex: string = allychainAuth1.toBuffer().toString("hex")
    const allychainAuth2Hex: string = allychainAuth2.toBuffer().toString("hex")
    expect(allychainAuth1Hex).toBe(allychainAuth2Hex)
  })
})
