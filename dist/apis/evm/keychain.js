"use strict";
/**
 * @packageDocumentation
 * @module API-EVM-KeyChain
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyChain = exports.KeyPair = void 0;
const bintools_1 = __importDefault(require("../../utils/bintools"));
const secp256k1_1 = require("../../common/secp256k1");
const utils_1 = require("../../utils");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = utils_1.Serialization.getInstance();
/**
 * Class for representing a private and public keypair on an AXVM Chain.
 */
class KeyPair extends secp256k1_1.SECP256k1KeyPair {
    clone() {
        const newkp = new KeyPair(this.hrp, this.chainID);
        newkp.importKey(bintools.copyFrom(this.getPrivateKey()));
        return newkp;
    }
    create(...args) {
        if (args.length == 2) {
            return new KeyPair(args[0], args[1]);
        }
        return new KeyPair(this.hrp, this.chainID);
    }
}
exports.KeyPair = KeyPair;
/**
 * Class for representing a key chain in Axia.
 *
 * @typeparam KeyPair Class extending [[SECP256k1KeyChain]] which is used as the key in [[KeyChain]]
 */
class KeyChain extends secp256k1_1.SECP256k1KeyChain {
    /**
     * Returns instance of KeyChain.
     */
    constructor(hrp, chainID) {
        super();
        this.hrp = "";
        this.chainID = "";
        /**
         * Makes a new key pair, returns the address.
         *
         * @returns The new key pair
         */
        this.makeKey = () => {
            const keypair = new KeyPair(this.hrp, this.chainID);
            this.addKey(keypair);
            return keypair;
        };
        this.addKey = (newKey) => {
            newKey.setChainID(this.chainID);
            super.addKey(newKey);
        };
        /**
         * Given a private key, makes a new key pair, returns the address.
         *
         * @param privk A {@link https://github.com/feross/buffer|Buffer}
         * or cb58 serialized string representing the private key
         *
         * @returns The new key pair
         */
        this.importKey = (privk) => {
            const keypair = new KeyPair(this.hrp, this.chainID);
            let pk;
            if (typeof privk === "string") {
                pk = bintools.cb58Decode(privk.split("-")[1]);
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
        this.chainID = chainID;
    }
    create(...args) {
        if (args.length == 2) {
            return new KeyChain(args[0], args[1]);
        }
        return new KeyChain(this.hrp, this.chainID);
    }
    clone() {
        const newkc = new KeyChain(this.hrp, this.chainID);
        for (let k in this.keys) {
            newkc.addKey(this.keys[`${k}`].clone());
        }
        return newkc;
    }
    union(kc) {
        const newkc = kc.clone();
        for (let k in this.keys) {
            newkc.addKey(this.keys[`${k}`].clone());
        }
        return newkc;
    }
}
exports.KeyChain = KeyChain;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Y2hhaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9ldm0va2V5Y2hhaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7O0FBR0gsb0VBQTJDO0FBQzNDLHNEQUE0RTtBQUM1RSx1Q0FBMkQ7QUFFM0Q7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQixxQkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWhFOztHQUVHO0FBQ0gsTUFBYSxPQUFRLFNBQVEsNEJBQWdCO0lBQzNDLEtBQUs7UUFDSCxNQUFNLEtBQUssR0FBWSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUMxRCxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUN4RCxPQUFPLEtBQWEsQ0FBQTtJQUN0QixDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBVztRQUNuQixJQUFJLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO1lBQ3BCLE9BQU8sSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBUyxDQUFBO1NBQzdDO1FBQ0QsT0FBTyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQVMsQ0FBQTtJQUNwRCxDQUFDO0NBQ0Y7QUFiRCwwQkFhQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFhLFFBQVMsU0FBUSw2QkFBMEI7SUFrRXREOztPQUVHO0lBQ0gsWUFBWSxHQUFXLEVBQUUsT0FBZTtRQUN0QyxLQUFLLEVBQUUsQ0FBQTtRQXJFVCxRQUFHLEdBQVcsRUFBRSxD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KipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktRVZNLUtleUNoYWluXG4gKi9cblxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQgeyBTRUNQMjU2azFLZXlDaGFpbiwgU0VDUDI1NmsxS2V5UGFpciB9IGZyb20gXCIuLi8uLi9jb21tb24vc2VjcDI1NmsxXCJcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRUeXBlIH0gZnJvbSBcIi4uLy4uL3V0aWxzXCJcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcbmNvbnN0IHNlcmlhbGl6YXRpb246IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcblxuLyoqXG4gKiBDbGFzcyBmb3IgcmVwcmVzZW50aW5nIGEgcHJpdmF0ZSBhbmQgcHVibGljIGtleXBhaXIgb24gYW4gQVhWTSBDaGFpbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEtleVBhaXIgZXh0ZW5kcyBTRUNQMjU2azFLZXlQYWlyIHtcbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgY29uc3QgbmV3a3A6IEtleVBhaXIgPSBuZXcgS2V5UGFpcih0aGlzLmhycCwgdGhpcy5jaGFpbklEKVxuICAgIG5ld2twLmltcG9ydEtleShiaW50b29scy5jb3B5RnJvbSh0aGlzLmdldFByaXZhdGVLZXkoKSkpXG4gICAgcmV0dXJuIG5ld2twIGFzIHRoaXNcbiAgfVxuXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PSAyKSB7XG4gICAgICByZXR1cm4gbmV3IEtleVBhaXIoYXJnc1swXSwgYXJnc1sxXSkgYXMgdGhpc1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEtleVBhaXIodGhpcy5ocnAsIHRoaXMuY2hhaW5JRCkgYXMgdGhpc1xuICB9XG59XG5cbi8qKlxuICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIGtleSBjaGFpbiBpbiBBeGlhLlxuICpcbiAqIEB0eXBlcGFyYW0gS2V5UGFpciBDbGFzcyBleHRlbmRpbmcgW1tTRUNQMjU2azFLZXlDaGFpbl1dIHdoaWNoIGlzIHVzZWQgYXMgdGhlIGtleSBpbiBbW0tleUNoYWluXV1cbiAqL1xuZXhwb3J0IGNsYXNzIEtleUNoYWluIGV4dGVuZHMgU0VDUDI1NmsxS2V5Q2hhaW48S2V5UGFpcj4ge1xuICBocnA6IHN0cmluZyA9IFwiXCJcbiAgY2hhaW5JRDogc3RyaW5nID0gXCJcIlxuXG4gIC8qKlxuICAgKiBNYWtlcyBhIG5ldyBrZXkgcGFpciwgcmV0dXJucyB0aGUgYWRkcmVzcy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5ldyBrZXkgcGFpclxuICAgKi9cbiAgbWFrZUtleSA9ICgpOiBLZXlQYWlyID0+IHtcbiAgICBjb25zdCBrZXlwYWlyOiBLZXlQYWlyID0gbmV3IEtleVBhaXIodGhpcy5ocnAsIHRoaXMuY2hhaW5JRClcbiAgICB0aGlzLmFkZEtleShrZXlwYWlyKVxuICAgIHJldHVybiBrZXlwYWlyXG4gIH1cblxuICBhZGRLZXkgPSAobmV3S2V5OiBLZXlQYWlyKSA9PiB7XG4gICAgbmV3S2V5LnNldENoYWluSUQodGhpcy5jaGFpbklEKVxuICAgIHN1cGVyLmFkZEtleShuZXdLZXkpXG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gYSBwcml2YXRlIGtleSwgbWFrZXMgYSBuZXcga2V5IHBhaXIsIHJldHVybnMgdGhlIGFkZHJlc3MuXG4gICAqXG4gICAqIEBwYXJhbSBwcml2ayBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIG9yIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBwcml2YXRlIGtleVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleSBwYWlyXG4gICAqL1xuICBpbXBvcnRLZXkgPSAocHJpdms6IEJ1ZmZlciB8IHN0cmluZyk6IEtleVBhaXIgPT4ge1xuICAgIGNvbnN0IGtleXBhaXI6IEtleVBhaXIgPSBuZXcgS2V5UGFpcih0aGlzLmhycCwgdGhpcy5jaGFpbklEKVxuICAgIGxldCBwazogQnVmZmVyXG4gICAgaWYgKHR5cGVvZiBwcml2ayA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgcGsgPSBiaW50b29scy5jYjU4RGVjb2RlKHByaXZrLnNwbGl0KFwiLVwiKVsxXSlcbiAgICB9IGVsc2Uge1xuICAgICAgcGsgPSBiaW50b29scy5jb3B5RnJvbShwcml2aylcbiAgICB9XG4gICAga2V5cGFpci5pbXBvcnRLZXkocGspXG4gICAgaWYgKCEoa2V5cGFpci5nZXRBZGRyZXNzKCkudG9TdHJpbmcoXCJoZXhcIikgaW4gdGhpcy5rZXlzKSkge1xuICAgICAgdGhpcy5hZGRLZXkoa2V5cGFpcilcbiAgICB9XG4gICAgcmV0dXJuIGtleXBhaXJcbiAgfVxuXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PSAyKSB7XG4gICAgICByZXR1cm4gbmV3IEtleUNoYWluKGFyZ3NbMF0sIGFyZ3NbMV0pIGFzIHRoaXNcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBLZXlDaGFpbih0aGlzLmhycCwgdGhpcy5jaGFpbklEKSBhcyB0aGlzXG4gIH1cblxuICBjbG9uZSgpOiB0aGlzIHtcbiAgICBjb25zdCBuZXdrYzogS2V5Q2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5ocnAsIHRoaXMuY2hhaW5JRClcbiAgICBmb3IgKGxldCBrIGluIHRoaXMua2V5cykge1xuICAgICAgbmV3a2MuYWRkS2V5KHRoaXMua2V5c1tgJHtrfWBdLmNsb25lKCkpXG4gICAgfVxuICAgIHJldHVybiBuZXdrYyBhcyB0aGlzXG4gIH1cblxuICB1bmlvbihrYzogdGhpcyk6IHRoaXMge1xuICAgIGNvbnN0IG5ld2tjOiBLZXlDaGFpbiA9IGtjLmNsb25lKClcbiAgICBmb3IgKGxldCBrIGluIHRoaXMua2V5cykge1xuICAgICAgbmV3a2MuYWRkS2V5KHRoaXMua2V5c1tgJHtrfWBdLmNsb25lKCkpXG4gICAgfVxuICAgIHJldHVybiBuZXdrYyBhcyB0aGlzXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBpbnN0YW5jZSBvZiBLZXlDaGFpbi5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGhycDogc3RyaW5nLCBjaGFpbklEOiBzdHJpbmcpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5ocnAgPSBocnBcbiAgICB0aGlzLmNoYWluSUQgPSBjaGFpbklEXG4gIH1cbn1cbiJdfQ==