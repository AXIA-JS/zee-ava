"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyChain = exports.KeyPair = void 0;
const bintools_1 = __importDefault(require("../../utils/bintools"));
const secp256k1_1 = require("../../common/secp256k1");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
/**
 * Class for representing a private and public keypair on the Contract Chain.
 */
class KeyPair extends secp256k1_1.SECP256k1KeyPair {
    constructor(hrp, chainid) {
        super();
        this.chainid = '';
        this.hrp = '';
        /**
         * Returns the address's string representation.
         *
         * @returns A string representation of the address
         */
        this.getAddressString = () => {
            const addr = this.addressFromPublicKey(this.pubk);
            return bintools.addressToString(this.hrp, this.chainid, addr);
        };
        /**
           * Returns the chainID associated with this key.
           *
           * @returns The [[KeyPair]]'s chainID
           */
        this.getChainID = () => this.chainid;
        /**
         * Sets the the chainID associated with this key.
         *
         * @param chainid String for the chainID
         */
        this.setChainID = (chainid) => {
            this.chainid = chainid;
        };
        /**
         * Returns the Human-Readable-Part of the network associated with this key.
         *
         * @returns The [[KeyPair]]'s Human-Readable-Part of the network's Bech32 addressing scheme
         */
        this.getHRP = () => this.hrp;
        /**
         * Sets the the Human-Readable-Part of the network associated with this key.
         *
         * @param hrp String for the Human-Readable-Part of Bech32 addresses
         */
        this.setHRP = (hrp) => {
            this.hrp = hrp;
        };
        this.chainid = chainid;
        this.hrp = hrp;
        this.generateKey();
    }
    clone() {
        let newkp = new KeyPair(this.hrp, this.chainid);
        newkp.importKey(bintools.copyFrom(this.getPrivateKey()));
        return newkp;
    }
    create(...args) {
        if (args.length == 2) {
            return new KeyPair(args[0], args[1]);
        }
        return new KeyPair(this.hrp, this.chainid);
    }
}
exports.KeyPair = KeyPair;
/**
 * Class for representing a key chain in Axia.
 *
 * @typeparam KeyPair Class extending [[KeyPair]] which is used as the key in [[KeyChain]]
 */
class KeyChain extends secp256k1_1.SECP256k1KeyChain {
    /**
     * Returns instance of KeyChain.
     */
    constructor(hrp, chainid) {
        super();
        this.hrp = '';
        this.chainid = '';
        /**
         * Makes a new key pair, returns the address.
         *
         * @returns The new key pair
         */
        this.makeKey = () => {
            let keypair = new KeyPair(this.hrp, this.chainid);
            this.addKey(keypair);
            return keypair;
        };
        this.addKey = (newKey) => {
            newKey.setChainID(this.chainid);
            super.addKey(newKey);
        };
        /**
         * Given a private key, makes a new key pair, returns the address.
         *
         * @param privk A {@link https://github.com/feross/buffer|Buffer} or cb58 serialized string representing the private key
         *
         * @returns The new key pair
         */
        this.importKey = (privk) => {
            let keypair = new KeyPair(this.hrp, this.chainid);
            let pk;
            if (typeof privk === 'string') {
                pk = bintools.cb58Decode(privk.split('-')[1]);
            }
            else {
                pk = bintools.copyFrom(privk);
            }
            keypair.importKey(pk);
            if (!(keypair.getAddress().toString("hex") in this.keys)) {
                this.addKey(keypair);
            }
            return keypair;
        };
        this.hrp = hrp;
        this.chainid = chainid;
    }
    create(...args) {
        if (args.length == 2) {
            return new KeyChain(args[0], args[1]);
        }
        return new KeyChain(this.hrp, this.chainid);
    }
    ;
    clone() {
        const newkc = new KeyChain(this.hrp, this.chainid);
        for (let k in this.keys) {
            newkc.addKey(this.keys[k].clone());
        }
        return newkc;
    }
    ;
    union(kc) {
        let newkc = kc.clone();
        for (let k in this.keys) {
            newkc.addKey(this.keys[k].clone());
        }
        return newkc;
    }
}
exports.KeyChain = KeyChain;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Y2hhaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9jb250cmFjdHZtL2tleWNoYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUtBLG9FQUE0QztBQUM1QyxzREFBNkU7QUFFN0U7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBR2xEOztHQUVHO0FBQ0gsTUFBYSxPQUFRLFNBQVEsNEJBQWdCO0lBNkR6QyxZQUFZLEdBQVUsRUFBRSxPQUFjO1FBQ2xDLEtBQUssRUFBRSxDQUFDO1FBNURGLFlBQU8sR0FBVSxFQUFFLENBQUM7UUFDcEIsUUFBRyxHQUFVLEVBQUUsQ0FBQztRQUUxQjs7OztXQUlHO1FBQ0gscUJBQWdCLEdBQUcsR0FBVSxFQUFFO1lBQzNCLE1BQU0sSUFBSSxHQUFVLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekQsT0FBTyxRQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNsRSxDQUFDLENBQUE7UUFFRDs7OzthQUlLO1FBQ0wsZUFBVSxHQUFHLEdBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7UUFFdkM7Ozs7V0FJRztRQUNILGVBQVUsR0FBRyxDQUFDLE9BQWMsRUFBTyxFQUFFO1lBQ2pDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQzNCLENBQUMsQ0FBQztRQUdGOzs7O1dBSUc7UUFDSCxXQUFNLEdBQUcsR0FBVSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUUvQjs7OztXQUlHO1FBQ0gsV0FBTSxHQUFHLENBQUMsR0FBVSxFQUFPLEVBQUU7WUFDM0IsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDakIsQ0FBQyxDQUFDO1FB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QUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBUyxDQUFDO1NBQ2pEO1FBQ0QsT0FBTyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQVMsQ0FBQztJQUN4RCxDQUFDO0lBQUEsQ0FBQztJQUVGLEtBQUs7UUFDRCxNQUFNLEtBQUssR0FBWSxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1RCxLQUFJLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUM7WUFDbkIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7U0FDdEM7UUFDRCxPQUFPLEtBQWEsQ0FBQztJQUN6QixDQUFDO0lBQUEsQ0FBQztJQUVGLEtBQUssQ0FBQyxFQUFPO1FBQ1QsSUFBSSxLQUFLLEdBQVksRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLEtBQUksSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksRUFBQztZQUNuQixLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztTQUN0QztRQUNELE9BQU8sS0FBYSxDQUFDO0lBQ3pCLENBQUM7Q0FVSjtBQTFFRCw0QkEwRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktQ29udHJhY3RWTS1LZXlDaGFpblxuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiO1xuaW1wb3J0IEJpblRvb2xzIGZyb20gJy4uLy4uL3V0aWxzL2JpbnRvb2xzJztcbmltcG9ydCB7IFNFQ1AyNTZrMUtleUNoYWluLCBTRUNQMjU2azFLZXlQYWlyIH0gZnJvbSAnLi4vLi4vY29tbW9uL3NlY3AyNTZrMSc7XG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpO1xuXG5cbi8qKlxuICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIHByaXZhdGUgYW5kIHB1YmxpYyBrZXlwYWlyIG9uIHRoZSBDb250cmFjdCBDaGFpbi4gXG4gKi9cbmV4cG9ydCBjbGFzcyBLZXlQYWlyIGV4dGVuZHMgU0VDUDI1NmsxS2V5UGFpciB7XG5cbiAgICBwcm90ZWN0ZWQgY2hhaW5pZDpzdHJpbmcgPSAnJztcbiAgICBwcm90ZWN0ZWQgaHJwOnN0cmluZyA9ICcnO1xuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgYWRkcmVzcydzIHN0cmluZyByZXByZXNlbnRhdGlvbi5cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyBBIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgYWRkcmVzc1xuICAgICAqL1xuICAgIGdldEFkZHJlc3NTdHJpbmcgPSAoKTpzdHJpbmcgPT4ge1xuICAgICAgICBjb25zdCBhZGRyOkJ1ZmZlciA9IHRoaXMuYWRkcmVzc0Zyb21QdWJsaWNLZXkodGhpcy5wdWJrKTtcbiAgICAgICAgcmV0dXJuIGJpbnRvb2xzLmFkZHJlc3NUb1N0cmluZyh0aGlzLmhycCwgdGhpcy5jaGFpbmlkLCBhZGRyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgICAqIFJldHVybnMgdGhlIGNoYWluSUQgYXNzb2NpYXRlZCB3aXRoIHRoaXMga2V5LlxuICAgICAgICpcbiAgICAgICAqIEByZXR1cm5zIFRoZSBbW0tleVBhaXJdXSdzIGNoYWluSURcbiAgICAgICAqL1xuICAgIGdldENoYWluSUQgPSAoKTpzdHJpbmcgPT4gdGhpcy5jaGFpbmlkO1xuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgdGhlIGNoYWluSUQgYXNzb2NpYXRlZCB3aXRoIHRoaXMga2V5LlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYWluaWQgU3RyaW5nIGZvciB0aGUgY2hhaW5JRFxuICAgICAqL1xuICAgIHNldENoYWluSUQgPSAoY2hhaW5pZDpzdHJpbmcpOnZvaWQgPT4ge1xuICAgICAgICB0aGlzLmNoYWluaWQgPSBjaGFpbmlkO1xuICAgIH07XG4gICAgXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBIdW1hbi1SZWFkYWJsZS1QYXJ0IG9mIHRoZSBuZXR3b3JrIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGtleS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIFRoZSBbW0tleVBhaXJdXSdzIEh1bWFuLVJlYWRhYmxlLVBhcnQgb2YgdGhlIG5ldHdvcmsncyBCZWNoMzIgYWRkcmVzc2luZyBzY2hlbWVcbiAgICAgKi9cbiAgICBnZXRIUlAgPSAoKTpzdHJpbmcgPT4gdGhpcy5ocnA7XG4gIFxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIHRoZSBIdW1hbi1SZWFkYWJsZS1QYXJ0IG9mIHRoZSBuZXR3b3JrIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGtleS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBocnAgU3RyaW5nIGZvciB0aGUgSHVtYW4tUmVhZGFibGUtUGFydCBvZiBCZWNoMzIgYWRkcmVzc2VzXG4gICAgICovXG4gICAgc2V0SFJQID0gKGhycDpzdHJpbmcpOnZvaWQgPT4ge1xuICAgICAgdGhpcy5ocnAgPSBocnA7XG4gICAgfTtcblxuICAgIGNsb25lKCk6dGhpcyB7XG4gICAgICAgIGxldCBuZXdrcDpLZXlQYWlyID0gbmV3IEtleVBhaXIodGhpcy5ocnAsIHRoaXMuY2hhaW5pZCk7XG4gICAgICAgIG5ld2twLmltcG9ydEtleShiaW50b29scy5jb3B5RnJvbSh0aGlzLmdldFByaXZhdGVLZXkoKSkpO1xuICAgICAgICByZXR1cm4gbmV3a3AgYXMgdGhpcztcbiAgICB9XG5cbiAgICBjcmVhdGUoLi4uYXJnczphbnlbXSk6dGhpcyB7XG4gICAgICAgIGlmKGFyZ3MubGVuZ3RoID09IDIpe1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBLZXlQYWlyKGFyZ3NbMF0sIGFyZ3NbMV0pIGFzIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBLZXlQYWlyKHRoaXMuaHJwLCB0aGlzLmNoYWluaWQpIGFzIHRoaXM7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoaHJwOnN0cmluZywgY2hhaW5pZDpzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5jaGFpbmlkID0gY2hhaW5pZDtcbiAgICAgICAgdGhpcy5ocnAgPSBocnA7XG4gICAgICAgIHRoaXMuZ2VuZXJhdGVLZXkoKTtcbiAgICB9XG4gICAgXG59XG5cbi8qKlxuICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIGtleSBjaGFpbiBpbiBBdmFsYW5jaGUuIFxuICogXG4gKiBAdHlwZXBhcmFtIEtleVBhaXIgQ2xhc3MgZXh0ZW5kaW5nIFtbS2V5UGFpcl1dIHdoaWNoIGlzIHVzZWQgYXMgdGhlIGtleSBpbiBbW0tleUNoYWluXV1cbiAqL1xuZXhwb3J0IGNsYXNzIEtleUNoYWluIGV4dGVuZHMgU0VDUDI1NmsxS2V5Q2hhaW48S2V5UGFpcj4ge1xuXG4gICAgaHJwOnN0cmluZyA9ICcnO1xuICAgIGNoYWluaWQ6c3RyaW5nID0gJyc7XG5cbiAgICAvKipcbiAgICAgKiBNYWtlcyBhIG5ldyBrZXkgcGFpciwgcmV0dXJucyB0aGUgYWRkcmVzcy5cbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleSBwYWlyXG4gICAgICovXG4gICAgbWFrZUtleSA9ICgpOktleVBhaXIgPT4ge1xuICAgICAgICBsZXQga2V5cGFpcjpLZXlQYWlyID0gbmV3IEtleVBhaXIodGhpcy5ocnAsIHRoaXMuY2hhaW5pZCk7XG4gICAgICAgIHRoaXMuYWRkS2V5KGtleXBhaXIpO1xuICAgICAgICByZXR1cm4ga2V5cGFpcjtcbiAgICB9XG5cbiAgICBhZGRLZXkgPSAobmV3S2V5OktleVBhaXIpID0+IHtcbiAgICAgICAgbmV3S2V5LnNldENoYWluSUQodGhpcy5jaGFpbmlkKTtcbiAgICAgICAgc3VwZXIuYWRkS2V5KG5ld0tleSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2l2ZW4gYSBwcml2YXRlIGtleSwgbWFrZXMgYSBuZXcga2V5IHBhaXIsIHJldHVybnMgdGhlIGFkZHJlc3MuXG4gICAgICogXG4gICAgICogQHBhcmFtIHByaXZrIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgY2I1OCBzZXJpYWxpemVkIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHByaXZhdGUga2V5IFxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIFRoZSBuZXcga2V5IHBhaXJcbiAgICAgKi9cbiAgICBpbXBvcnRLZXkgPSAocHJpdms6QnVmZmVyIHwgc3RyaW5nKTpLZXlQYWlyID0+IHtcbiAgICAgICAgbGV0IGtleXBhaXI6S2V5UGFpciA9IG5ldyBLZXlQYWlyKHRoaXMuaHJwLCB0aGlzLmNoYWluaWQpO1xuICAgICAgICBsZXQgcGs6QnVmZmVyO1xuICAgICAgICBpZih0eXBlb2YgcHJpdmsgPT09ICdzdHJpbmcnKXtcbiAgICAgICAgICAgIHBrID0gYmludG9vbHMuY2I1OERlY29kZShwcml2ay5zcGxpdCgnLScpWzFdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBrID0gYmludG9vbHMuY29weUZyb20ocHJpdmspO1xuICAgICAgICB9XG4gICAgICAgIGtleXBhaXIuaW1wb3J0S2V5KHBrKTtcbiAgICAgICAgaWYoIShrZXlwYWlyLmdldEFkZHJlc3MoKS50b1N0cmluZyhcImhleFwiKSBpbiB0aGlzLmtleXMpKXtcbiAgICAgICAgICAgIHRoaXMuYWRkS2V5KGtleXBhaXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBrZXlwYWlyO1xuICAgIH1cblxuICAgIGNyZWF0ZSguLi5hcmdzOmFueVtdKTp0aGlzIHtcbiAgICAgICAgaWYoYXJncy5sZW5ndGggPT0gMil7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEtleUNoYWluKGFyZ3NbMF0sIGFyZ3NbMV0pIGFzIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBLZXlDaGFpbih0aGlzLmhycCwgdGhpcy5jaGFpbmlkKSBhcyB0aGlzO1xuICAgIH07XG5cbiAgICBjbG9uZSgpOnRoaXMge1xuICAgICAgICBjb25zdCBuZXdrYzpLZXlDaGFpbiA9IG5ldyBLZXlDaGFpbih0aGlzLmhycCwgdGhpcy5jaGFpbmlkKTtcbiAgICAgICAgZm9yKGxldCBrIGluIHRoaXMua2V5cyl7XG4gICAgICAgICAgICBuZXdrYy5hZGRLZXkodGhpcy5rZXlzW2tdLmNsb25lKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdrYyBhcyB0aGlzO1xuICAgIH07XG5cbiAgICB1bmlvbihrYzp0aGlzKTp0aGlzIHtcbiAgICAgICAgbGV0IG5ld2tjOktleUNoYWluID0ga2MuY2xvbmUoKTtcbiAgICAgICAgZm9yKGxldCBrIGluIHRoaXMua2V5cyl7XG4gICAgICAgICAgICBuZXdrYy5hZGRLZXkodGhpcy5rZXlzW2tdLmNsb25lKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdrYyBhcyB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgaW5zdGFuY2Ugb2YgS2V5Q2hhaW4uXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoaHJwOnN0cmluZywgY2hhaW5pZDpzdHJpbmcpe1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmhycCA9IGhycDtcbiAgICAgICAgdGhpcy5jaGFpbmlkID0gY2hhaW5pZDtcbiAgICB9XG59Il19