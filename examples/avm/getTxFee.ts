import { 
  Axia,
  BN
} from "../../dist";
import { AVMAPI } from "../../dist/apis/avm";
  
const ip: string = 'localhost';
const port: number = 9650;
const protocol: string = 'http';
const networkID: number = 12345;
const axia: Axia = new Axia(ip, port, protocol, networkID);
const xchain: AVMAPI = axia.XChain();
  
const main = async (): Promise<any> => {
  const txFee: BN = await xchain.getTxFee();
  console.log(txFee);
}
    
main()
  