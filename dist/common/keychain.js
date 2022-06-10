"use strict";
/**
 * @packageDocumentation
 * @module Common-KeyChain
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardKeyChain = exports.StandardKeyPair = void 0;
const buffer_1 = require("buffer/");
/**
 * Class for representing a private and public keypair in Axia.
 * All APIs that need key pairs should extend on this class.
 */
class StandardKeyPair {
    /**
     * Returns a reference to the private key.
     *
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the private key
     */
    getPrivateKey() {
        return this.privk;
    }
    /**
     * Returns a reference to the public key.
     *
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the public key
     */
    getPublicKey() {
        return this.pubk;
    }
}
exports.StandardKeyPair = StandardKeyPair;
/**
 * Class for representing a key chain in Axia.
 * All endpoints that need key chains should extend on this class.
 *
 * @typeparam KPClass extending [[StandardKeyPair]] which is used as the key in [[StandardKeyChain]]
 */
class StandardKeyChain {
    constructor() {
        this.keys = {};
        /**
         * Gets an array of addresses stored in the [[StandardKeyChain]].
         *
         * @returns An array of {@link https://github.com/feross/buffer|Buffer}  representations
         * of the addresses
         */
        this.getAddresses = () => Object.values(this.keys).map((kp) => kp.getAddress());
        /**
         * Gets an array of addresses stored in the [[StandardKeyChain]].
         *
         * @returns An array of string representations of the addresses
         */
        this.getAddressStrings = () => Object.values(this.keys).map((kp) => kp.getAddressString());
        /**
         * Removes the key pair from the list of they keys managed in the [[StandardKeyChain]].
         *
         * @param key A {@link https://github.com/feross/buffer|Buffer} for the address or
         * KPClass to remove
         *
         * @returns The boolean true if a key was removed.
         */
        this.removeKey = (key) => {
            let kaddr;
            if (key instanceof buffer_1.Buffer) {
                kaddr = key.toString("hex");
            }
            else {
                kaddr = key.getAddress().toString("hex");
            }
            if (kaddr in this.keys) {
                delete this.keys[`${kaddr}`];
                return true;
            }
            return false;
        };
        /**
         * Checks if there is a key associated with the provided address.
         *
         * @param address The address to check for existence in the keys database
         *
         * @returns True on success, false if not found
         */
        this.hasKey = (address) => address.toString("hex") in this.keys;
        /**
         * Returns the [[StandardKeyPair]] listed under the provided address
         *
         * @param address The {@link https://github.com/feross/buffer|Buffer} of the address to
         * retrieve from the keys database
         *
         * @returns A reference to the [[StandardKeyPair]] in the keys database
         */
        this.getKey = (address) => this.keys[address.toString("hex")];
    }
    /**
     * Adds the key pair to the list of the keys managed in the [[StandardKeyChain]].
     *
     * @param newKey A key pair of the appropriate class to be added to the [[StandardKeyChain]]
     */
    addKey(newKey) {
        this.keys[newKey.getAddress().toString("hex")] = newKey;
    }
}
exports.StandardKeyChain = StandardKeyChain;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5Y2hhaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbW9uL2tleWNoYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7OztBQUVILG9DQUFnQztBQUVoQzs7O0dBR0c7QUFDSCxNQUFzQixlQUFlO0lBb0RuQzs7OztPQUlHO0lBQ0gsYUFBYTtRQUNYLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQTtJQUNuQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFlBQVk7UUFDVixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUE7SUFDbEIsQ0FBQztDQWlDRjtBQXJHRCwwQ0FxR0M7QUFFRDs7Ozs7R0FLRztBQUNILE1BQXNCLGdCQUFnQjtJQUF0QztRQUNZLFNBQUksR0FBbUMsRUFBRSxDQUFBO1FBa0JuRDs7Ozs7V0FLRztRQUNILGlCQUFZLEdBQUcsR0FBYSxFQUFFLENBQzVCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUE7UUFFdkQ7Ozs7V0FJRztRQUNILHNCQUFpQixHQUFHLEdBQWEsRUFBRSxDQUNqQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUE7UUFXN0Q7Ozs7Ozs7V0FPRztRQUNILGNBQVMsR0FBRyxDQUFDLEdBQXFCLEVBQUUsRUFBRTtZQUNwQyxJQUFJLEtBQWEsQ0FBQTtZQUNqQixJQUFJLEdBQUcsWUFBWSxlQUFNLEVBQUU7Z0JBQ3pCLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFBO2FBQzVCO2lCQUFNO2dCQUNMLEtBQUssR0FBRyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFBO2FBQ3pDO1lBQ0QsSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtnQkFDdEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQTtnQkFDNUIsT0FBTyxJQUFJLENBQUE7YUFDWjtZQUNELE9BQU8sS0FBSyxDQUFBO1FBQ2QsQ0FBQyxDQUFBO1FBRUQ7Ozs7OztXQU1HO1FBQ0gsV0FBTSxHQUFHLENBQUMsT0FBZSxFQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUE7UUFFM0U7Ozs7Ozs7V0FPRztRQUNILFdBQU0sR0FBRyxDQUFDLE9BQWUsRUFBVyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7SUFPM0UsQ0FBQztJQXZEQzs7OztPQUlHO0lBQ0gsTUFBTSxDQUFDLE1BQWU7UUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFBO0lBQ3pELENBQUM7Q0FnREY7QUEzRkQsNENBMkZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQ29tbW9uLUtleUNoYWluXG4gKi9cblxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuXG4vKipcbiAqIENsYXNzIGZvciByZXByZXNlbnRpbmcgYSBwcml2YXRlIGFuZCBwdWJsaWMga2V5cGFpciBpbiBBeGlhLlxuICogQWxsIEFQSXMgdGhhdCBuZWVkIGtleSBwYWlycyBzaG91bGQgZXh0ZW5kIG9uIHRoaXMgY2xhc3MuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTdGFuZGFyZEtleVBhaXIge1xuICBwcm90ZWN0ZWQgcHViazogQnVmZmVyXG4gIHByb3RlY3RlZCBwcml2azogQnVmZmVyXG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIG5ldyBrZXlwYWlyLlxuICAgKlxuICAgKiBAcGFyYW0gZW50cm9weSBPcHRpb25hbCBwYXJhbWV0ZXIgdGhhdCBtYXkgYmUgbmVjZXNzYXJ5IHRvIHByb2R1Y2Ugc2VjdXJlIGtleXNcbiAgICovXG4gIGFic3RyYWN0IGdlbmVyYXRlS2V5KGVudHJvcHk/OiBCdWZmZXIpOiB2b2lkXG5cbiAgLyoqXG4gICAqIEltcG9ydHMgYSBwcml2YXRlIGtleSBhbmQgZ2VuZXJhdGVzIHRoZSBhcHByb3ByaWF0ZSBwdWJsaWMga2V5LlxuICAgKlxuICAgKiBAcGFyYW0gcHJpdmsgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIHByaXZhdGUga2V5XG4gICAqXG4gICAqIEByZXR1cm5zIHRydWUgb24gc3VjY2VzcywgZmFsc2Ugb24gZmFpbHVyZVxuICAgKi9cbiAgYWJzdHJhY3QgaW1wb3J0S2V5KHByaXZrOiBCdWZmZXIpOiBib29sZWFuXG5cbiAgLyoqXG4gICAqIFRha2VzIGEgbWVzc2FnZSwgc2lnbnMgaXQsIGFuZCByZXR1cm5zIHRoZSBzaWduYXR1cmUuXG4gICAqXG4gICAqIEBwYXJhbSBtc2cgVGhlIG1lc3NhZ2UgdG8gc2lnblxuICAgKlxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgdGhlIHNpZ25hdHVyZVxuICAgKi9cbiAgYWJzdHJhY3Qgc2lnbihtc2c6IEJ1ZmZlcik6IEJ1ZmZlclxuXG4gIC8qKlxuICAgKiBSZWNvdmVycyB0aGUgcHVibGljIGtleSBvZiBhIG1lc3NhZ2Ugc2lnbmVyIGZyb20gYSBtZXNzYWdlIGFuZCBpdHMgYXNzb2NpYXRlZCBzaWduYXR1cmUuXG4gICAqXG4gICAqIEBwYXJhbSBtc2cgVGhlIG1lc3NhZ2UgdGhhdCdzIHNpZ25lZFxuICAgKiBAcGFyYW0gc2lnIFRoZSBzaWduYXR1cmUgdGhhdCdzIHNpZ25lZCBvbiB0aGUgbWVzc2FnZVxuICAgKlxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGNvbnRhaW5pbmcgdGhlIHB1YmxpY1xuICAgKiBrZXkgb2YgdGhlIHNpZ25lclxuICAgKi9cbiAgYWJzdHJhY3QgcmVjb3Zlcihtc2c6IEJ1ZmZlciwgc2lnOiBCdWZmZXIpOiBCdWZmZXJcblxuICAvKipcbiAgICogVmVyaWZpZXMgdGhhdCB0aGUgcHJpdmF0ZSBrZXkgYXNzb2NpYXRlZCB3aXRoIHRoZSBwcm92aWRlZCBwdWJsaWMga2V5IHByb2R1Y2VzIHRoZVxuICAgKiBzaWduYXR1cmUgYXNzb2NpYXRlZCB3aXRoIHRoZSBnaXZlbiBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0gbXNnIFRoZSBtZXNzYWdlIGFzc29jaWF0ZWQgd2l0aCB0aGUgc2lnbmF0dXJlXG4gICAqIEBwYXJhbSBzaWcgVGhlIHNpZ25hdHVyZSBvZiB0aGUgc2lnbmVkIG1lc3NhZ2VcbiAgICogQHBhcmFtIHB1YmsgVGhlIHB1YmxpYyBrZXkgYXNzb2NpYXRlZCB3aXRoIHRoZSBtZXNzYWdlIHNpZ25hdHVyZVxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MsIGZhbHNlIG9uIGZhaWx1cmVcbiAgICovXG4gIGFic3RyYWN0IHZlcmlmeShtc2c6IEJ1ZmZlciwgc2lnOiBCdWZmZXIsIHB1Yms6IEJ1ZmZlcik6IGJvb2xlYW5cblxuICAvKipcbiAgICogUmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGUgcHJpdmF0ZSBrZXkuXG4gICAqXG4gICAqIEByZXR1cm5zIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyB0aGUgcHJpdmF0ZSBrZXlcbiAgICovXG4gIGdldFByaXZhdGVLZXkoKTogQnVmZmVyIHtcbiAgICByZXR1cm4gdGhpcy5wcml2a1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhlIHB1YmxpYyBrZXkuXG4gICAqXG4gICAqIEByZXR1cm5zIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gY29udGFpbmluZyB0aGUgcHVibGljIGtleVxuICAgKi9cbiAgZ2V0UHVibGljS2V5KCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMucHVia1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHByaXZhdGUga2V5LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgcHVibGljIGtleVxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0UHJpdmF0ZUtleVN0cmluZygpOiBzdHJpbmdcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcHVibGljIGtleS5cbiAgICpcbiAgICogQHJldHVybnMgQSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHB1YmxpYyBrZXlcbiAgICovXG4gIGFic3RyYWN0IGdldFB1YmxpY0tleVN0cmluZygpOiBzdHJpbmdcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYWRkcmVzcy5cbiAgICpcbiAgICogQHJldHVybnMgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSAgcmVwcmVzZW50YXRpb24gb2YgdGhlIGFkZHJlc3NcbiAgICovXG4gIGFic3RyYWN0IGdldEFkZHJlc3MoKTogQnVmZmVyXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGFkZHJlc3MncyBzdHJpbmcgcmVwcmVzZW50YXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBhZGRyZXNzXG4gICAqL1xuICBhYnN0cmFjdCBnZXRBZGRyZXNzU3RyaW5nKCk6IHN0cmluZ1xuXG4gIGFic3RyYWN0IGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXNcblxuICBhYnN0cmFjdCBjbG9uZSgpOiB0aGlzXG59XG5cbi8qKlxuICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIGtleSBjaGFpbiBpbiBBeGlhLlxuICogQWxsIGVuZHBvaW50cyB0aGF0IG5lZWQga2V5IGNoYWlucyBzaG91bGQgZXh0ZW5kIG9uIHRoaXMgY2xhc3MuXG4gKlxuICogQHR5cGVwYXJhbSBLUENsYXNzIGV4dGVuZGluZyBbW1N0YW5kYXJkS2V5UGFpcl1dIHdoaWNoIGlzIHVzZWQgYXMgdGhlIGtleSBpbiBbW1N0YW5kYXJkS2V5Q2hhaW5dXVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU3RhbmRhcmRLZXlDaGFpbjxLUENsYXNzIGV4dGVuZHMgU3RhbmRhcmRLZXlQYWlyPiB7XG4gIHByb3RlY3RlZCBrZXlzOiB7IFthZGRyZXNzOiBzdHJpbmddOiBLUENsYXNzIH0gPSB7fVxuXG4gIC8qKlxuICAgKiBNYWtlcyBhIG5ldyBbW1N0YW5kYXJkS2V5UGFpcl1dLCByZXR1cm5zIHRoZSBhZGRyZXNzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBZGRyZXNzIG9mIHRoZSBuZXcgW1tTdGFuZGFyZEtleVBhaXJdXVxuICAgKi9cbiAgbWFrZUtleTogKCkgPT4gS1BDbGFzc1xuXG4gIC8qKlxuICAgKiBHaXZlbiBhIHByaXZhdGUga2V5LCBtYWtlcyBhIG5ldyBbW1N0YW5kYXJkS2V5UGFpcl1dLCByZXR1cm5zIHRoZSBhZGRyZXNzLlxuICAgKlxuICAgKiBAcGFyYW0gcHJpdmsgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIHByaXZhdGUga2V5XG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IFtbU3RhbmRhcmRLZXlQYWlyXV1cbiAgICovXG4gIGltcG9ydEtleTogKHByaXZrOiBCdWZmZXIpID0+IEtQQ2xhc3NcblxuICAvKipcbiAgICogR2V0cyBhbiBhcnJheSBvZiBhZGRyZXNzZXMgc3RvcmVkIGluIHRoZSBbW1N0YW5kYXJkS2V5Q2hhaW5dXS5cbiAgICpcbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2Yge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gIHJlcHJlc2VudGF0aW9uc1xuICAgKiBvZiB0aGUgYWRkcmVzc2VzXG4gICAqL1xuICBnZXRBZGRyZXNzZXMgPSAoKTogQnVmZmVyW10gPT5cbiAgICBPYmplY3QudmFsdWVzKHRoaXMua2V5cykubWFwKChrcCkgPT4ga3AuZ2V0QWRkcmVzcygpKVxuXG4gIC8qKlxuICAgKiBHZXRzIGFuIGFycmF5IG9mIGFkZHJlc3NlcyBzdG9yZWQgaW4gdGhlIFtbU3RhbmRhcmRLZXlDaGFpbl1dLlxuICAgKlxuICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBzdHJpbmcgcmVwcmVzZW50YXRpb25zIG9mIHRoZSBhZGRyZXNzZXNcbiAgICovXG4gIGdldEFkZHJlc3NTdHJpbmdzID0gKCk6IHN0cmluZ1tdID0+XG4gICAgT2JqZWN0LnZhbHVlcyh0aGlzLmtleXMpLm1hcCgoa3ApID0+IGtwLmdldEFkZHJlc3NTdHJpbmcoKSlcblxuICAvKipcbiAgICogQWRkcyB0aGUga2V5IHBhaXIgdG8gdGhlIGxpc3Qgb2YgdGhlIGtleXMgbWFuYWdlZCBpbiB0aGUgW1tTdGFuZGFyZEtleUNoYWluXV0uXG4gICAqXG4gICAqIEBwYXJhbSBuZXdLZXkgQSBrZXkgcGFpciBvZiB0aGUgYXBwcm9wcmlhdGUgY2xhc3MgdG8gYmUgYWRkZWQgdG8gdGhlIFtbU3RhbmRhcmRLZXlDaGFpbl1dXG4gICAqL1xuICBhZGRLZXkobmV3S2V5OiBLUENsYXNzKSB7XG4gICAgdGhpcy5rZXlzW25ld0tleS5nZXRBZGRyZXNzKCkudG9TdHJpbmcoXCJoZXhcIildID0gbmV3S2V5XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyB0aGUga2V5IHBhaXIgZnJvbSB0aGUgbGlzdCBvZiB0aGV5IGtleXMgbWFuYWdlZCBpbiB0aGUgW1tTdGFuZGFyZEtleUNoYWluXV0uXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIGFkZHJlc3Mgb3JcbiAgICogS1BDbGFzcyB0byByZW1vdmVcbiAgICpcbiAgICogQHJldHVybnMgVGhlIGJvb2xlYW4gdHJ1ZSBpZiBhIGtleSB3YXMgcmVtb3ZlZC5cbiAgICovXG4gIHJlbW92ZUtleSA9IChrZXk6IEtQQ2xhc3MgfCBCdWZmZXIpID0+IHtcbiAgICBsZXQga2FkZHI6IHN0cmluZ1xuICAgIGlmIChrZXkgaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgIGthZGRyID0ga2V5LnRvU3RyaW5nKFwiaGV4XCIpXG4gICAgfSBlbHNlIHtcbiAgICAgIGthZGRyID0ga2V5LmdldEFkZHJlc3MoKS50b1N0cmluZyhcImhleFwiKVxuICAgIH1cbiAgICBpZiAoa2FkZHIgaW4gdGhpcy5rZXlzKSB7XG4gICAgICBkZWxldGUgdGhpcy5rZXlzW2Ake2thZGRyfWBdXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhlcmUgaXMgYSBrZXkgYXNzb2NpYXRlZCB3aXRoIHRoZSBwcm92aWRlZCBhZGRyZXNzLlxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyB0byBjaGVjayBmb3IgZXhpc3RlbmNlIGluIHRoZSBrZXlzIGRhdGFiYXNlXG4gICAqXG4gICAqIEByZXR1cm5zIFRydWUgb24gc3VjY2VzcywgZmFsc2UgaWYgbm90IGZvdW5kXG4gICAqL1xuICBoYXNLZXkgPSAoYWRkcmVzczogQnVmZmVyKTogYm9vbGVhbiA9PiBhZGRyZXNzLnRvU3RyaW5nKFwiaGV4XCIpIGluIHRoaXMua2V5c1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBbW1N0YW5kYXJkS2V5UGFpcl1dIGxpc3RlZCB1bmRlciB0aGUgcHJvdmlkZWQgYWRkcmVzc1xuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb2YgdGhlIGFkZHJlc3MgdG9cbiAgICogcmV0cmlldmUgZnJvbSB0aGUga2V5cyBkYXRhYmFzZVxuICAgKlxuICAgKiBAcmV0dXJucyBBIHJlZmVyZW5jZSB0byB0aGUgW1tTdGFuZGFyZEtleVBhaXJdXSBpbiB0aGUga2V5cyBkYXRhYmFzZVxuICAgKi9cbiAgZ2V0S2V5ID0gKGFkZHJlc3M6IEJ1ZmZlcik6IEtQQ2xhc3MgPT4gdGhpcy5rZXlzW2FkZHJlc3MudG9TdHJpbmcoXCJoZXhcIildXG5cbiAgYWJzdHJhY3QgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpc1xuXG4gIGFic3RyYWN0IGNsb25lKCk6IHRoaXNcblxuICBhYnN0cmFjdCB1bmlvbihrYzogdGhpcyk6IHRoaXNcbn1cbiJdfQ==