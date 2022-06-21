import { Axia } from "../../dist"
import { HealthAPI } from "../../dist/apis/health"
import { HealthResponse } from "../../dist/apis/health/interfaces"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const health: HealthAPI = axia.Health()

const main = async (): Promise<any> => {
  const healthResponse: HealthResponse = await health.health()
  console.log(healthResponse)
}

main()
