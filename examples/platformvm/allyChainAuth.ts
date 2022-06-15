import { Buffer } from "../../src"
import { AllyChainAuth } from "../../src/apis/platformvm"

const address1: Buffer = Buffer.alloc(4)
const address2: Buffer = Buffer.alloc(4)
address2.writeUIntBE(0x01, 0, 4)
const addresses: Buffer[] = [address1, address2]
const allyChainAuth: AllyChainAuth = new AllyChainAuth(addresses)

const main = async (): Promise<any> => {
  console.log(allyChainAuth)
  const typeName: string = allyChainAuth.getTypeName()
  const typeID: number = allyChainAuth.getTypeID()
  const numAddressIndices: number = allyChainAuth.getNumAddressIndices()
  console.log("TypeName: ", typeName)
  console.log("TypeID: ", typeID)
  console.log("NumAddressIndices: ", numAddressIndices)
}

main()
