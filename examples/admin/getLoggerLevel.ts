import { Axia } from "../../src"
import { AdminAPI } from "../../src/apis/admin"
import { GetLoggerLevelResponse } from "../../src/apis/admin/interfaces"

const ip: string = "localhost"
const port: number = 80
const protocol: string = "http"
const networkID: number = 1337
const axia: Axia = new Axia(ip, port, protocol, networkID)
const admin: AdminAPI = axia.Admin()

const main = async (): Promise<any> => {
  const loggerName: string = "AX"
  const loggerLevel: GetLoggerLevelResponse = await admin.getLoggerLevel(
    loggerName
  )
  console.log(loggerLevel)
}

main()
