import { 
  Axia
} from "../../dist";
import { AuthAPI } from "../../dist/apis/auth";
  
const ip: string = 'localhost';
const port: number = 9650;
const protocol: string = 'http';
const networkID: number = 12345;
const axia: Axia = new Axia(ip, port, protocol, networkID);
const auth: AuthAPI = axia.Auth();
  
const main = async (): Promise<any> => {
  const password: string = "R1oJgqud0GGqe9nhip49N";
  const endpoints: string[] = ["*"];
  const token: string = await auth.newToken(password, endpoints);
  console.log(token);
}
    
main()
  