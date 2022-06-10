import { 
  Axia
} from "../../dist";
import { AVMAPI } from "../../dist/apis/avm";
  
const ip: string = 'localhost';
const port: number = 9650;
const protocol: string = 'http';
const networkID: number = 12345;
const axia: Axia = new Axia(ip, port, protocol, networkID);
const xchain: AVMAPI = axia.XChain();
  
const main = async (): Promise<any> => {
  const address: string = "X-local18jma8ppw3nhx5r4ap8clazz0dps7rv5u00z96u";
  const balance: object = await xchain.getBalance(address, "AXC");
  console.log(balance);
}
    
main()
  