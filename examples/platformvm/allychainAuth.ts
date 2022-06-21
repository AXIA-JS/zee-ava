import { Buffer } from "../../src"
import { AllychainAuth } from "../../src/apis/platformvm"

const address1: Buffer = Buffer.alloc(4)
const address2: Buffer = Buffer.alloc(4)
address2.writeUIntBE(0x01, 0, 4)
const addresses: Buffer[] = [address1, address2]
const allychainAuth: AllychainAuth = new AllychainAuth(addresses)

const main = async (): Promise<any> => {
  console.log(allychainAuth)
  const typeName: string = allychainAuth.getTypeName()
  const typeID: number = allychainAuth.getTypeID()
  const numAddressIndices: number = allychainAuth.getNumAddressIndices()
  console.log("TypeName: ", typeName)
  console.log("TypeID: ", typeID)
  console.log("NumAddressIndices: ", numAddressIndices)
}

main()
