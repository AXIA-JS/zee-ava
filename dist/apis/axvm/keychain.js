"use strict";
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
    constructor(hrp, chainid) {
        super();
        this.hrp = "";
        this.chainid = "";
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
        this.chainid = chainid;
    }
    create(...args) {
        if (args.length == 2) {
            return new KeyChain(args[0], args[1]);
        }
        return new KeyChain(this.hrp, this.chainid);
    }
    clone() {
        const newkc = new KeyChain(this.hrp, this.chainid);
        for (let k in this.keys) {
            newkc.addKey(this.keys[`${k}`].clone());
        }
        return newkc;
    }
    union(kc) {
        let newkc = kc.clone();
        for (let k in this.keys) {
            newkc.addKey(this.keys[`${k}`].clone());
        }
        return newkc;
    }
}
exports.KeyChain = KeyChain;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Y2hhaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9heHZtL2tleWNoYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUtBLG9FQUEyQztBQUMzQyxzREFBNEU7QUFDNUUsdUNBQTJEO0FBRTNEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IscUJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRTs7R0FFRztBQUNILE1BQWEsT0FBUSxTQUFRLDRCQUFnQjtJQUMzQyxLQUFLO1FBQ0gsTUFBTSxLQUFLLEdBQVksSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDMUQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDeEQsT0FBTyxLQUFhLENBQUE7SUFDdEIsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFHLElBQVc7UUFDbkIsSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtZQUNwQixPQUFPLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQVMsQ0FBQTtTQUM3QztRQUNELE9BQU8sSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFTLENBQUE7SUFDcEQsQ0FBQztDQUNGO0FBYkQsMEJBYUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBYSxRQUFTLFNBQVEsNkJBQTBCO0lBaUV0RDs7T0FFRztJQUNILFlBQVksR0FBVyxFQUFFLE9BQWU7UUFDdEMsS0FBSyxFQUFFLENBQUE7UUFwRVQsUUFBRyxHQUFXLEVBQUUsQ0FBQTtRQUNoQixZ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YWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktQVhWTS1LZXlDaGFpblxuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IFNFQ1AyNTZrMUtleUNoYWluLCBTRUNQMjU2azFLZXlQYWlyIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9zZWNwMjU2azFcIlxuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZFR5cGUgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuXG4vKipcbiAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSBwcml2YXRlIGFuZCBwdWJsaWMga2V5cGFpciBvbiBhbiBBWFZNIENoYWluLlxuICovXG5leHBvcnQgY2xhc3MgS2V5UGFpciBleHRlbmRzIFNFQ1AyNTZrMUtleVBhaXIge1xuICBjbG9uZSgpOiB0aGlzIHtcbiAgICBjb25zdCBuZXdrcDogS2V5UGFpciA9IG5ldyBLZXlQYWlyKHRoaXMuaHJwLCB0aGlzLmNoYWluSUQpXG4gICAgbmV3a3AuaW1wb3J0S2V5KGJpbnRvb2xzLmNvcHlGcm9tKHRoaXMuZ2V0UHJpdmF0ZUtleSgpKSlcbiAgICByZXR1cm4gbmV3a3AgYXMgdGhpc1xuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XG4gICAgaWYgKGFyZ3MubGVuZ3RoID09IDIpIHtcbiAgICAgIHJldHVybiBuZXcgS2V5UGFpcihhcmdzWzBdLCBhcmdzWzFdKSBhcyB0aGlzXG4gICAgfVxuICAgIHJldHVybiBuZXcgS2V5UGFpcih0aGlzLmhycCwgdGhpcy5jaGFpbklEKSBhcyB0aGlzXG4gIH1cbn1cblxuLyoqXG4gKiBDbGFzcyBmb3IgcmVwcmVzZW50aW5nIGEga2V5IGNoYWluIGluIEF4aWEuXG4gKlxuICogQHR5cGVwYXJhbSBLZXlQYWlyIENsYXNzIGV4dGVuZGluZyBbW1NFQ1AyNTZrMUtleUNoYWluXV0gd2hpY2ggaXMgdXNlZCBhcyB0aGUga2V5IGluIFtbS2V5Q2hhaW5dXVxuICovXG5leHBvcnQgY2xhc3MgS2V5Q2hhaW4gZXh0ZW5kcyBTRUNQMjU2azFLZXlDaGFpbjxLZXlQYWlyPiB7XG4gIGhycDogc3RyaW5nID0gXCJcIlxuICBjaGFpbmlkOiBzdHJpbmcgPSBcIlwiXG5cbiAgLyoqXG4gICAqIE1ha2VzIGEgbmV3IGtleSBwYWlyLCByZXR1cm5zIHRoZSBhZGRyZXNzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleSBwYWlyXG4gICAqL1xuICBtYWtlS2V5ID0gKCk6IEtleVBhaXIgPT4ge1xuICAgIGxldCBrZXlwYWlyOiBLZXlQYWlyID0gbmV3IEtleVBhaXIodGhpcy5ocnAsIHRoaXMuY2hhaW5pZClcbiAgICB0aGlzLmFkZEtleShrZXlwYWlyKVxuICAgIHJldHVybiBrZXlwYWlyXG4gIH1cblxuICBhZGRLZXkgPSAobmV3S2V5OiBLZXlQYWlyKSA9PiB7XG4gICAgbmV3S2V5LnNldENoYWluSUQodGhpcy5jaGFpbmlkKVxuICAgIHN1cGVyLmFkZEtleShuZXdLZXkpXG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gYSBwcml2YXRlIGtleSwgbWFrZXMgYSBuZXcga2V5IHBhaXIsIHJldHVybnMgdGhlIGFkZHJlc3MuXG4gICAqXG4gICAqIEBwYXJhbSBwcml2ayBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGNiNTggc2VyaWFsaXplZCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBwcml2YXRlIGtleVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleSBwYWlyXG4gICAqL1xuICBpbXBvcnRLZXkgPSAocHJpdms6IEJ1ZmZlciB8IHN0cmluZyk6IEtleVBhaXIgPT4ge1xuICAgIGxldCBrZXlwYWlyOiBLZXlQYWlyID0gbmV3IEtleVBhaXIodGhpcy5ocnAsIHRoaXMuY2hhaW5pZClcbiAgICBsZXQgcGs6IEJ1ZmZlclxuICAgIGlmICh0eXBlb2YgcHJpdmsgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHBrID0gYmludG9vbHMuY2I1OERlY29kZShwcml2ay5zcGxpdChcIi1cIilbMV0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHBrID0gYmludG9vbHMuY29weUZyb20ocHJpdmspXG4gICAgfVxuICAgIGtleXBhaXIuaW1wb3J0S2V5KHBrKVxuICAgIGlmICghKGtleXBhaXIuZ2V0QWRkcmVzcygpLnRvU3RyaW5nKFwiaGV4XCIpIGluIHRoaXMua2V5cykpIHtcbiAgICAgIHRoaXMuYWRkS2V5KGtleXBhaXIpXG4gICAgfVxuICAgIHJldHVybiBrZXlwYWlyXG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICBpZiAoYXJncy5sZW5ndGggPT0gMikge1xuICAgICAgcmV0dXJuIG5ldyBLZXlDaGFpbihhcmdzWzBdLCBhcmdzWzFdKSBhcyB0aGlzXG4gICAgfVxuICAgIHJldHVybiBuZXcgS2V5Q2hhaW4odGhpcy5ocnAsIHRoaXMuY2hhaW5pZCkgYXMgdGhpc1xuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgY29uc3QgbmV3a2M6IEtleUNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuaHJwLCB0aGlzLmNoYWluaWQpXG4gICAgZm9yIChsZXQgayBpbiB0aGlzLmtleXMpIHtcbiAgICAgIG5ld2tjLmFkZEtleSh0aGlzLmtleXNbYCR7a31gXS5jbG9uZSgpKVxuICAgIH1cbiAgICByZXR1cm4gbmV3a2MgYXMgdGhpc1xuICB9XG5cbiAgdW5pb24oa2M6IHRoaXMpOiB0aGlzIHtcbiAgICBsZXQgbmV3a2M6IEtleUNoYWluID0ga2MuY2xvbmUoKVxuICAgIGZvciAobGV0IGsgaW4gdGhpcy5rZXlzKSB7XG4gICAgICBuZXdrYy5hZGRLZXkodGhpcy5rZXlzW2Ake2t9YF0uY2xvbmUoKSlcbiAgICB9XG4gICAgcmV0dXJuIG5ld2tjIGFzIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGluc3RhbmNlIG9mIEtleUNoYWluLlxuICAgKi9cbiAgY29uc3RydWN0b3IoaHJwOiBzdHJpbmcsIGNoYWluaWQ6IHN0cmluZykge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLmhycCA9IGhycFxuICAgIHRoaXMuY2hhaW5pZCA9IGNoYWluaWRcbiAgfVxufVxuIl19