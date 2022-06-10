import { 
  Axia
} from "../../dist";
import { InfoAPI } from "../../dist/apis/info";
  
const ip: string = 'localhost';
const port: number = 9650;
const protocol: string = 'http';
const networkID: number = 12345;
const axia: Axia = new Axia(ip, port, protocol, networkID);
const info: InfoAPI = axia.Info();
  
const main = async (): Promise<any> => {
  const networkID : number = await info.getNetworkID();
  console.log(networkID);
}
    
main()
  