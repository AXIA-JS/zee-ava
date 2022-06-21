import { Axia } from "../../src"
import { HealthAPI } from "../../src/apis/health"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 12345
const axia: Axia = new Axia(ip, port, protocol, networkID)
const health: HealthAPI = axia.Health()

const main = async (): Promise<any> => {
  const getLivenessResponse: object = await health.getLiveness()
  console.log(getLivenessResponse)
}

main()
