import {
  Axia
} from "../../dist";
import { AdminAPI } from "../../dist/apis/admin";

const ip: string = 'localhost';
const port: number = 9650;
const protocol: string = 'http';
const networkID: number = 12345;
const axia: Axia = new Axia(ip, port, protocol, networkID);
const admin: AdminAPI = axia.Admin();

const main = async (): Promise<any> => {
  const blockchain: string = "2eNy1mUFdmaxXNj1eQHUe7Np4gju9sJsEtWQ4MX3ToiNKuADed";
  const aliases: string[] = await admin.getChainAliases(blockchain);
  console.log(aliases);
}

main()
