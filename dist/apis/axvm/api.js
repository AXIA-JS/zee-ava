"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AXVMAPI = void 0;
/**
 * @packageDocumentation
 * @module API-AXVM
 */
const bn_js_1 = __importDefault(require("bn.js"));
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const utxos_1 = require("./utxos");
const constants_1 = require("./constants");
const keychain_1 = require("./keychain");
const tx_1 = require("./tx");
const payload_1 = require("../../utils/payload");
const helperfunctions_1 = require("../../utils/helperfunctions");
const jrpcapi_1 = require("../../common/jrpcapi");
const constants_2 = require("../../utils/constants");
const output_1 = require("../../common/output");
const errors_1 = require("../../utils/errors");
const utils_1 = require("../../utils");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = utils_1.Serialization.getInstance();
/**
 * Class for interacting with a node endpoint that is using the AXVM.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Axia.addAPI]] function to register this interface with Axia.
 */
class AXVMAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Axia.addAP`${I}`]] method.
     *
     * @param core A reference to the Axia class
     * @param baseURL Defaults to the string "/ext/bc/X" as the path to blockchain's baseURL
     * @param blockchainID The Blockchain"s ID. Defaults to an empty string: ""
     */
    constructor(core, baseURL = "/ext/bc/X", blockchainID = "") {
        super(core, baseURL);
        /**
         * @ignore
         */
        this.keychain = new keychain_1.KeyChain("", "");
        this.blockchainID = "";
        this.blockchainAlias = undefined;
        this.AXCAssetID = undefined;
        this.txFee = undefined;
        this.creationTxFee = undefined;
        this.mintTxFee = undefined;
        /**
         * Gets the alias for the blockchainID if it exists, otherwise returns `undefined`.
         *
         * @returns The alias for the blockchainID
         */
        this.getBlockchainAlias = () => {
            if (typeof this.blockchainAlias === "undefined") {
                const netid = this.core.getNetworkID();
                if (netid in constants_2.Defaults.network &&
                    this.blockchainID in constants_2.Defaults.network[`${netid}`]) {
                    this.blockchainAlias =
                        constants_2.Defaults.network[`${netid}`][this.blockchainID].alias;
                    return this.blockchainAlias;
                }
                else {
                    /* istanbul ignore next */
                    return undefined;
                }
            }
            return this.blockchainAlias;
        };
        /**
         * Sets the alias for the blockchainID.
         *
         * @param alias The alias for the blockchainID.
         *
         */
        this.setBlockchainAlias = (alias) => {
            this.blockchainAlias = alias;
            /* istanbul ignore next */
            return undefined;
        };
        /**
         * Gets the blockchainID and returns it.
         *
         * @returns The blockchainID
         */
        this.getBlockchainID = () => this.blockchainID;
        /**
         * Refresh blockchainID, and if a blockchainID is passed in, use that.
         *
         * @param Optional. BlockchainID to assign, if none, uses the default based on networkID.
         *
         * @returns The blockchainID
         */
        this.refreshBlockchainID = (blockchainID = undefined) => {
            const netid = this.core.getNetworkID();
            if (typeof blockchainID === "undefined" &&
                typeof constants_2.Defaults.network[`${netid}`] !== "undefined") {
                this.blockchainID = constants_2.Defaults.network[`${netid}`].X.blockchainID; //default to AssetChain
                return true;
            }
            if (typeof blockchainID === "string") {
                this.blockchainID = blockchainID;
                return true;
            }
            return false;
        };
        /**
         * Takes an address string and returns its {@link https://github.com/feross/buffer|Buffer} representation if valid.
         *
         * @returns A {@link https://github.com/feross/buffer|Buffer} for the address if valid, undefined if not valid.
         */
        this.parseAddress = (addr) => {
            const alias = this.getBlockchainAlias();
            const blockchainID = this.getBlockchainID();
            return bintools.parseAddress(addr, blockchainID, alias, constants_1.AXVMConstants.ADDRESSLENGTH);
        };
        this.addressFromBuffer = (address) => {
            const chainID = this.getBlockchainAlias()
                ? this.getBlockchainAlias()
                : this.getBlockchainID();
            const type = "bech32";
            const hrp = this.core.getHRP();
            return serialization.bufferToType(address, type, hrp, chainID);
        };
        /**
         * Fetches the AXC AssetID and returns it in a Promise.
         *
         * @param refresh This function caches the response. Refresh = true will bust the cache.
         *
         * @returns The the provided string representing the AXC AssetID
         */
        this.getAXCAssetID = (refresh = false) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.AXCAssetID === "undefined" || refresh) {
                const asset = yield this.getAssetDescription(constants_2.PrimaryAssetAlias);
                this.AXCAssetID = asset.assetID;
            }
            return this.AXCAssetID;
        });
        /**
         * Overrides the defaults and sets the cache to a specific AXC AssetID
         *
         * @param axcAssetID A cb58 string or Buffer representing the AXC AssetID
         *
         * @returns The the provided string representing the AXC AssetID
         */
        this.setAXCAssetID = (axcAssetID) => {
            if (typeof axcAssetID === "string") {
                axcAssetID = bintools.cb58Decode(axcAssetID);
            }
            this.AXCAssetID = axcAssetID;
        };
        /**
         * Gets the default tx fee for this chain.
         *
         * @returns The default tx fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getDefaultTxFee = () => {
            return this.core.getNetworkID() in constants_2.Defaults.network
                ? new bn_js_1.default(constants_2.Defaults.network[this.core.getNetworkID()]["X"]["txFee"])
                : new bn_js_1.default(0);
        };
        /**
         * Gets the tx fee for this chain.
         *
         * @returns The tx fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getTxFee = () => {
            if (typeof this.txFee === "undefined") {
                this.txFee = this.getDefaultTxFee();
            }
            return this.txFee;
        };
        /**
         * Sets the tx fee for this chain.
         *
         * @param fee The tx fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
         */
        this.setTxFee = (fee) => {
            this.txFee = fee;
        };
        /**
         * Gets the default creation fee for this chain.
         *
         * @returns The default creation fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getDefaultCreationTxFee = () => {
            return this.core.getNetworkID() in constants_2.Defaults.network
                ? new bn_js_1.default(constants_2.Defaults.network[this.core.getNetworkID()]["X"]["creationTxFee"])
                : new bn_js_1.default(0);
        };
        /**
         * Gets the default mint fee for this chain.
         *
         * @returns The default mint fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getDefaultMintTxFee = () => {
            return this.core.getNetworkID() in constants_2.Defaults.network
                ? new bn_js_1.default(constants_2.Defaults.network[this.core.getNetworkID()]["X"]["mintTxFee"])
                : new bn_js_1.default(0);
        };
        /**
         * Gets the mint fee for this chain.
         *
         * @returns The mint fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getMintTxFee = () => {
            if (typeof this.mintTxFee === "undefined") {
                this.mintTxFee = this.getDefaultMintTxFee();
            }
            return this.mintTxFee;
        };
        /**
         * Gets the creation fee for this chain.
         *
         * @returns The creation fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getCreationTxFee = () => {
            if (typeof this.creationTxFee === "undefined") {
                this.creationTxFee = this.getDefaultCreationTxFee();
            }
            return this.creationTxFee;
        };
        /**
         * Sets the mint fee for this chain.
         *
         * @param fee The mint fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
         */
        this.setMintTxFee = (fee) => {
            this.mintTxFee = fee;
        };
        /**
         * Sets the creation fee for this chain.
         *
         * @param fee The creation fee amount to set as {@link https://github.com/indutny/bn.js/|BN}
         */
        this.setCreationTxFee = (fee) => {
            this.creationTxFee = fee;
        };
        /**
         * Gets a reference to the keychain for this class.
         *
         * @returns The instance of [[KeyChain]] for this class
         */
        this.keyChain = () => this.keychain;
        /**
         * @ignore
         */
        this.newKeyChain = () => {
            // warning, overwrites the old keychain
            const alias = this.getBlockchainAlias();
            if (alias) {
                this.keychain = new keychain_1.KeyChain(this.core.getHRP(), alias);
            }
            else {
                this.keychain = new keychain_1.KeyChain(this.core.getHRP(), this.blockchainID);
            }
            return this.keychain;
        };
        /**
         * Helper function which determines if a tx is a goose egg transaction.
         *
         * @param utx An UnsignedTx
         *
         * @returns boolean true if passes goose egg test and false if fails.
         *
         * @remarks
         * A "Goose Egg Transaction" is when the fee far exceeds a reasonable amount
         */
        this.checkGooseEgg = (utx, outTotal = new bn_js_1.default(0)) => __awaiter(this, void 0, void 0, function* () {
            const axcAssetID = yield this.getAXCAssetID();
            const outputTotal = outTotal.gt(new bn_js_1.default(0))
                ? outTotal
                : utx.getOutputTotal(axcAssetID);
            const fee = utx.getBurn(axcAssetID);
            if (fee.lte(constants_2.ONEAXC.mul(new bn_js_1.default(10))) || fee.lte(outputTotal)) {
                return true;
            }
            else {
                return false;
            }
        });
        /**
         * Gets the balance of a particular asset on a blockchain.
         *
         * @param address The address to pull the asset balance from
         * @param assetID The assetID to pull the balance from
         * @param includePartial If includePartial=false, returns only the balance held solely
         *
         * @returns Promise with the balance of the assetID as a {@link https://github.com/indutny/bn.js/|BN} on the provided address for the blockchain.
         */
        this.getBalance = (address, assetID, includePartial = false) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.parseAddress(address) === "undefined") {
                /* istanbul ignore next */
                throw new errors_1.AddressError("Error - AXVMAPI.getBalance: Invalid address format");
            }
            const params = {
                address,
                assetID,
                includePartial
            };
            const response = yield this.callMethod("axvm.getBalance", params);
            return response.data.result;
        });
        /**
         * Creates an address (and associated private keys) on a user on a blockchain.
         *
         * @param username Name of the user to create the address under
         * @param password Password to unlock the user and encrypt the private key
         *
         * @returns Promise for a string representing the address created by the vm.
         */
        this.createAddress = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password
            };
            const response = yield this.callMethod("axvm.createAddress", params);
            return response.data.result.address;
        });
        /**
         * Create a new fixed-cap, fungible asset. A quantity of it is created at initialization and there no more is ever created.
         *
         * @param username The user paying the transaction fee (in $AXC) for asset creation
         * @param password The password for the user paying the transaction fee (in $AXC) for asset creation
         * @param name The human-readable name for the asset
         * @param symbol Optional. The shorthand symbol for the asset. Between 0 and 4 characters
         * @param denomination Optional. Determines how balances of this asset are displayed by user interfaces. Default is 0
         * @param initialHolders An array of objects containing the field "address" and "amount" to establish the genesis values for the new asset
         *
         * ```js
         * Example initialHolders:
         * [
         *   {
         *     "address": "X-axc1kj06lhgx84h39snsljcey3tpc046ze68mek3g5",
         *     "amount": 10000
         *   },
         *   {
         *     "address": "X-axc1am4w6hfrvmh3akduzkjthrtgtqafalce6an8cr",
         *     "amount": 50000
         *   }
         * ]
         * ```
         *
         * @returns Returns a Promise string containing the base 58 string representation of the ID of the newly created asset.
         */
        this.createFixedCapAsset = (username, password, name, symbol, denomination, initialHolders) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                name,
                symbol,
                denomination,
                username,
                password,
                initialHolders
            };
            const response = yield this.callMethod("axvm.createFixedCapAsset", params);
            return response.data.result.assetID;
        });
        /**
         * Create a new variable-cap, fungible asset. No units of the asset exist at initialization. Minters can mint units of this asset using createMintTx, signMintTx and sendMintTx.
         *
         * @param username The user paying the transaction fee (in $AXC) for asset creation
         * @param password The password for the user paying the transaction fee (in $AXC) for asset creation
         * @param name The human-readable name for the asset
         * @param symbol Optional. The shorthand symbol for the asset -- between 0 and 4 characters
         * @param denomination Optional. Determines how balances of this asset are displayed by user interfaces. Default is 0
         * @param minterSets is a list where each element specifies that threshold of the addresses in minters may together mint more of the asset by signing a minting transaction
         *
         * ```js
         * Example minterSets:
         * [
         *    {
         *      "minters":[
         *        "X-axc1am4w6hfrvmh3akduzkjthrtgtqafalce6an8cr"
         *      ],
         *      "threshold": 1
         *     },
         *     {
         *      "minters": [
         *        "X-axc1am4w6hfrvmh3akduzkjthrtgtqafalce6an8cr",
         *        "X-axc1kj06lhgx84h39snsljcey3tpc046ze68mek3g5",
         *        "X-axc1yell3e4nln0m39cfpdhgqprsd87jkh4qnakklx"
         *      ],
         *      "threshold": 2
         *     }
         * ]
         * ```
         *
         * @returns Returns a Promise string containing the base 58 string representation of the ID of the newly created asset.
         */
        this.createVariableCapAsset = (username, password, name, symbol, denomination, minterSets) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                name,
                symbol,
                denomination,
                username,
                password,
                minterSets
            };
            const response = yield this.callMethod("axvm.createVariableCapAsset", params);
            return response.data.result.assetID;
        });
        /**
         * Creates a family of NFT Asset. No units of the asset exist at initialization. Minters can mint units of this asset using createMintTx, signMintTx and sendMintTx.
         *
         * @param username The user paying the transaction fee (in $AXC) for asset creation
         * @param password The password for the user paying the transaction fee (in $AXC) for asset creation
         * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
         * @param changeAddr Optional. An address to send the change
         * @param name The human-readable name for the asset
         * @param symbol Optional. The shorthand symbol for the asset -- between 0 and 4 characters
         * @param minterSets is a list where each element specifies that threshold of the addresses in minters may together mint more of the asset by signing a minting transaction
         *
         * @returns Returns a Promise string containing the base 58 string representation of the ID of the newly created asset.
         */
        this.createNFTAsset = (username, password, from = undefined, changeAddr, name, symbol, minterSet) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                name,
                symbol,
                minterSet
            };
            const caller = "createNFTAsset";
            from = this._cleanAddressArray(from, caller);
            if (typeof from !== "undefined") {
                params["from"] = from;
            }
            if (typeof changeAddr !== "undefined") {
                if (typeof this.parseAddress(changeAddr) === "undefined") {
                    /* istanbul ignore next */
                    throw new errors_1.AddressError("Error - AXVMAPI.createNFTAsset: Invalid address format");
                }
                params["changeAddr"] = changeAddr;
            }
            const response = yield this.callMethod("axvm.createNFTAsset", params);
            return response.data.result.assetID;
        });
        /**
         * Create an unsigned transaction to mint more of an asset.
         *
         * @param amount The units of the asset to mint
         * @param assetID The ID of the asset to mint
         * @param to The address to assign the units of the minted asset
         * @param minters Addresses of the minters responsible for signing the transaction
         *
         * @returns Returns a Promise string containing the base 58 string representation of the unsigned transaction.
         */
        this.mint = (username, password, amount, assetID, to, minters) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            let amnt;
            if (typeof assetID !== "string") {
                asset = bintools.cb58Encode(assetID);
            }
            else {
                asset = assetID;
            }
            if (typeof amount === "number") {
                amnt = new bn_js_1.default(amount);
            }
            else {
                amnt = amount;
            }
            const params = {
                username: username,
                password: password,
                amount: amnt,
                assetID: asset,
                to,
                minters
            };
            const response = yield this.callMethod("axvm.mint", params);
            return response.data.result.txID;
        });
        /**
         * Mint non-fungible tokens which were created with AXVMAPI.createNFTAsset
         *
         * @param username The user paying the transaction fee (in $AXC) for asset creation
         * @param password The password for the user paying the transaction fee (in $AXC) for asset creation
         * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
         * @param changeAddr Optional. An address to send the change
         * @param assetID The asset id which is being sent
         * @param to Address on AssetChain of the account to which this NFT is being sent
         * @param encoding Optional.  is the encoding format to use for the payload argument. Can be either "cb58" or "hex". Defaults to "hex".
         *
         * @returns ID of the transaction
         */
        this.mintNFT = (username, password, from = undefined, changeAddr = undefined, payload, assetID, to, encoding = "hex") => __awaiter(this, void 0, void 0, function* () {
            let asset;
            if (typeof this.parseAddress(to) === "undefined") {
                /* istanbul ignore next */
                throw new errors_1.AddressError("Error - AXVMAPI.mintNFT: Invalid address format");
            }
            if (typeof assetID !== "string") {
                asset = bintools.cb58Encode(assetID);
            }
            else {
                asset = assetID;
            }
            const params = {
                username,
                password,
                assetID: asset,
                payload,
                to,
                encoding
            };
            const caller = "mintNFT";
            from = this._cleanAddressArray(from, caller);
            if (typeof from !== "undefined") {
                params["from"] = from;
            }
            if (typeof changeAddr !== "undefined") {
                if (typeof this.parseAddress(changeAddr) === "undefined") {
                    /* istanbul ignore next */
                    throw new errors_1.AddressError("Error - AXVMAPI.mintNFT: Invalid address format");
                }
                params["changeAddr"] = changeAddr;
            }
            const response = yield this.callMethod("axvm.mintNFT", params);
            return response.data.result.txID;
        });
        /**
         * Send NFT from one account to another on AssetChain
         *
         * @param username The user paying the transaction fee (in $AXC) for asset creation
         * @param password The password for the user paying the transaction fee (in $AXC) for asset creation
         * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
         * @param changeAddr Optional. An address to send the change
         * @param assetID The asset id which is being sent
         * @param groupID The group this NFT is issued to.
         * @param to Address on AssetChain of the account to which this NFT is being sent
         *
         * @returns ID of the transaction
         */
        this.sendNFT = (username, password, from = undefined, changeAddr = undefined, assetID, groupID, to) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            if (typeof this.parseAddress(to) === "undefined") {
                /* istanbul ignore next */
                throw new errors_1.AddressError("Error - AXVMAPI.sendNFT: Invalid address format");
            }
            if (typeof assetID !== "string") {
                asset = bintools.cb58Encode(assetID);
            }
            else {
                asset = assetID;
            }
            const params = {
                username,
                password,
                assetID: asset,
                groupID,
                to
            };
            const caller = "sendNFT";
            from = this._cleanAddressArray(from, caller);
            if (typeof from !== "undefined") {
                params["from"] = from;
            }
            if (typeof changeAddr !== "undefined") {
                if (typeof this.parseAddress(changeAddr) === "undefined") {
                    /* istanbul ignore next */
                    throw new errors_1.AddressError("Error - AXVMAPI.sendNFT: Invalid address format");
                }
                params["changeAddr"] = changeAddr;
            }
            const response = yield this.callMethod("axvm.sendNFT", params);
            return response.data.result.txID;
        });
        /**
         * Exports the private key for an address.
         *
         * @param username The name of the user with the private key
         * @param password The password used to decrypt the private key
         * @param address The address whose private key should be exported
         *
         * @returns Promise with the decrypted private key as store in the database
         */
        this.exportKey = (username, password, address) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.parseAddress(address) === "undefined") {
                /* istanbul ignore next */
                throw new errors_1.AddressError("Error - AXVMAPI.exportKey: Invalid address format");
            }
            const params = {
                username,
                password,
                address
            };
            const response = yield this.callMethod("axvm.exportKey", params);
            return response.data.result.privateKey;
        });
        /**
         * Imports a private key into the node's keystore under an user and for a blockchain.
         *
         * @param username The name of the user to store the private key
         * @param password The password that unlocks the user
         * @param privateKey A string representing the private key in the vm's format
         *
         * @returns The address for the imported private key.
         */
        this.importKey = (username, password, privateKey) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                privateKey
            };
            const response = yield this.callMethod("axvm.importKey", params);
            return response.data.result.address;
        });
        /**
         * Send ANT (Axia Native Token) assets including AXC from the AssetChain to an account on the CoreChain or AppChain.
         *
         * After calling this method, you must call the CoreChain's `import` or the AppChain’s `import` method to complete the transfer.
         *
         * @param username The Keystore user that controls the CoreChain or AppChain account specified in `to`
         * @param password The password of the Keystore user
         * @param to The account on the CoreChain or AppChain to send the asset to.
         * @param amount Amount of asset to export as a {@link https://github.com/indutny/bn.js/|BN}
         * @param assetID The asset id which is being sent
         *
         * @returns String representing the transaction id
         */
        this.export = (username, password, to, amount, assetID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                to,
                amount: amount,
                assetID
            };
            const response = yield this.callMethod("axvm.export", params);
            return response.data.result.txID;
        });
        /**
         * Send ANT (Axia Native Token) assets including AXC from an account on the CoreChain or AppChain to an address on the AssetChain. This transaction
         * must be signed with the key of the account that the asset is sent from and which pays
         * the transaction fee.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The address of the account the asset is sent to.
         * @param sourceChain The chainID where the funds are coming from. Ex: "C"
         *
         * @returns Promise for a string for the transaction, which should be sent to the network
         * by calling issueTx.
         */
        this.import = (username, password, to, sourceChain) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                to,
                sourceChain
            };
            const response = yield this.callMethod("axvm.import", params);
            return response.data.result.txID;
        });
        /**
         * Lists all the addresses under a user.
         *
         * @param username The user to list addresses
         * @param password The password of the user to list the addresses
         *
         * @returns Promise of an array of address strings in the format specified by the blockchain.
         */
        this.listAddresses = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password
            };
            const response = yield this.callMethod("axvm.listAddresses", params);
            return response.data.result.addresses;
        });
        /**
         * Retrieves all assets for an address on a server and their associated balances.
         *
         * @param address The address to get a list of assets
         *
         * @returns Promise of an object mapping assetID strings with {@link https://github.com/indutny/bn.js/|BN} balance for the address on the blockchain.
         */
        this.getAllBalances = (address) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.parseAddress(address) === "undefined") {
                /* istanbul ignore next */
                throw new errors_1.AddressError("Error - AXVMAPI.getAllBalances: Invalid address format");
            }
            const params = {
                address
            };
            const response = yield this.callMethod("axvm.getAllBalances", params);
            return response.data.result.balances;
        });
        /**
         * Retrieves an assets name and symbol.
         *
         * @param assetID Either a {@link https://github.com/feross/buffer|Buffer} or an b58 serialized string for the AssetID or its alias.
         *
         * @returns Returns a Promise object with keys "name" and "symbol".
         */
        this.getAssetDescription = (assetID) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            if (typeof assetID !== "string") {
                asset = bintools.cb58Encode(assetID);
            }
            else {
                asset = assetID;
            }
            const params = {
                assetID: asset
            };
            const response = yield this.callMethod("axvm.getAssetDescription", params);
            return {
                name: response.data.result.name,
                symbol: response.data.result.symbol,
                assetID: bintools.cb58Decode(response.data.result.assetID),
                denomination: parseInt(response.data.result.denomination, 10)
            };
        });
        /**
         * Returns the transaction data of a provided transaction ID by calling the node's `getTx` method.
         *
         * @param txID The string representation of the transaction ID
         * @param encoding sets the format of the returned transaction. Can be, "cb58", "hex" or "json". Defaults to "cb58".
         *
         * @returns Returns a Promise string or object containing the bytes retrieved from the node
         */
        this.getTx = (txID, encoding = "cb58") => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID,
                encoding
            };
            const response = yield this.callMethod("axvm.getTx", params);
            return response.data.result.tx;
        });
        /**
         * Returns the status of a provided transaction ID by calling the node's `getTxStatus` method.
         *
         * @param txID The string representation of the transaction ID
         *
         * @returns Returns a Promise string containing the status retrieved from the node
         */
        this.getTxStatus = (txID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID
            };
            const response = yield this.callMethod("axvm.getTxStatus", params);
            return response.data.result.status;
        });
        /**
         * Retrieves the UTXOs related to the addresses provided from the node's `getUTXOs` method.
         *
         * @param addresses An array of addresses as cb58 strings or addresses as {@link https://github.com/feross/buffer|Buffer}s
         * @param sourceChain A string for the chain to look for the UTXO's. Default is to use this chain, but if exported UTXOs exist from other chains, this can used to pull them instead.
         * @param limit Optional. Returns at most [limit] addresses. If [limit] == 0 or > [maxUTXOsToFetch], fetches up to [maxUTXOsToFetch].
         * @param startIndex Optional. [StartIndex] defines where to start fetching UTXOs (for pagination.)
         * UTXOs fetched are from addresses equal to or greater than [StartIndex.Address]
         * For address [StartIndex.Address], only UTXOs with IDs greater than [StartIndex.Utxo] will be returned.
         * @param persistOpts Options available to persist these UTXOs in local storage
         *
         * @remarks
         * persistOpts is optional and must be of type [[PersistanceOptions]]
         *
         */
        this.getUTXOs = (addresses, sourceChain = undefined, limit = 0, startIndex = undefined, persistOpts = undefined) => __awaiter(this, void 0, void 0, function* () {
            if (typeof addresses === "string") {
                addresses = [addresses];
            }
            const params = {
                addresses: addresses,
                limit
            };
            if (typeof startIndex !== "undefined" && startIndex) {
                params.startIndex = startIndex;
            }
            if (typeof sourceChain !== "undefined") {
                params.sourceChain = sourceChain;
            }
            const response = yield this.callMethod("axvm.getUTXOs", params);
            const utxos = new utxos_1.UTXOSet();
            let data = response.data.result.utxos;
            if (persistOpts && typeof persistOpts === "object") {
                if (this.db.has(persistOpts.getName())) {
                    const selfArray = this.db.get(persistOpts.getName());
                    if (Array.isArray(selfArray)) {
                        utxos.addArray(data);
                        const utxoSet = new utxos_1.UTXOSet();
                        utxoSet.addArray(selfArray);
                        utxoSet.mergeByRule(utxos, persistOpts.getMergeRule());
                        data = utxoSet.getAllUTXOStrings();
                    }
                }
                this.db.set(persistOpts.getName(), data, persistOpts.getOverwrite());
            }
            utxos.addArray(data, false);
            response.data.result.utxos = utxos;
            return response.data.result;
        });
        /**
         * Helper function which creates an unsigned transaction. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param amount The amount of AssetID to be spent in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}.
         * @param assetID The assetID of the value being sent
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[BaseTx]].
         *
         * @remarks
         * This helper exists because the endpoint API should be the primary point of entry for most functionality.
         */
        this.buildBaseTx = (utxoset, amount, assetID = undefined, toAddresses, fromAddresses, changeAddresses, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildBaseTx";
            const to = this._cleanAddressArray(toAddresses, caller).map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, caller).map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, caller).map((a) => bintools.stringToAddress(a));
            if (typeof assetID === "string") {
                assetID = bintools.cb58Decode(assetID);
            }
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const networkID = this.core.getNetworkID();
            const blockchainIDBuf = bintools.cb58Decode(this.blockchainID);
            const fee = this.getTxFee();
            const feeAssetID = yield this.getAXCAssetID();
            const builtUnsignedTx = utxoset.buildBaseTx(networkID, blockchainIDBuf, amount, assetID, to, from, change, fee, feeAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - AXVMAPI.buildBaseTx:Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned NFT Transfer. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset  A set of UTXOs that the transaction is built on
         * @param toAddresses The addresses to send the NFT
         * @param fromAddresses The addresses being used to send the NFT from the utxoID provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param utxoid A base58 utxoID or an array of base58 utxoIDs for the nfts this transaction is sending
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[NFTTransferTx]].
         *
         * @remarks
         * This helper exists because the endpoint API should be the primary point of entry for most functionality.
         */
        this.buildNFTTransferTx = (utxoset, toAddresses, fromAddresses, changeAddresses, utxoid, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildNFTTransferTx";
            const to = this._cleanAddressArray(toAddresses, caller).map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, caller).map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, caller).map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const axcAssetID = yield this.getAXCAssetID();
            let utxoidArray = [];
            if (typeof utxoid === "string") {
                utxoidArray = [utxoid];
            }
            else if (Array.isArray(utxoid)) {
                utxoidArray = utxoid;
            }
            const builtUnsignedTx = utxoset.buildNFTTransferTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), to, from, change, utxoidArray, this.getTxFee(), axcAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - AXVMAPI.buildNFTTransferTx:Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned Import Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset  A set of UTXOs that the transaction is built on
         * @param ownerAddresses The addresses being used to import
         * @param sourceChain The chainid for where the import is coming from
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[ImportTx]].
         *
         * @remarks
         * This helper exists because the endpoint API should be the primary point of entry for most functionality.
         */
        this.buildImportTx = (utxoset, ownerAddresses, sourceChain, toAddresses, fromAddresses, changeAddresses = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildImportTx";
            const to = this._cleanAddressArray(toAddresses, caller).map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, caller).map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, caller).map((a) => bintools.stringToAddress(a));
            let srappChain = undefined;
            if (typeof sourceChain === "undefined") {
                throw new errors_1.ChainIdError("Error - AXVMAPI.buildImportTx: Source ChainID is undefined.");
            }
            else if (typeof sourceChain === "string") {
                srappChain = sourceChain;
                sourceChain = bintools.cb58Decode(sourceChain);
            }
            else if (!(sourceChain instanceof buffer_1.Buffer)) {
                throw new errors_1.ChainIdError("Error - AXVMAPI.buildImportTx: Invalid destinationChain type: " +
                    typeof sourceChain);
            }
            const atomicUTXOs = (yield this.getUTXOs(ownerAddresses, srappChain, 0, undefined)).utxos;
            const axcAssetID = yield this.getAXCAssetID();
            const atomics = atomicUTXOs.getAllUTXOs();
            if (atomics.length === 0) {
                throw new errors_1.NoAtomicUTXOsError("Error - AXVMAPI.buildImportTx: No atomic UTXOs to import from " +
                    srappChain +
                    " using addresses: " +
                    ownerAddresses.join(", "));
            }
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const builtUnsignedTx = utxoset.buildImportTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), to, from, change, atomics, sourceChain, this.getTxFee(), axcAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - AXVMAPI.buildImportTx:Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned Export Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
         * @param destinationChain The chainid for where the assets will be sent.
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         * @param assetID Optional. The assetID of the asset to send. Defaults to AXC assetID.
         * Regardless of the asset which you"re exporting, all fees are paid in AXC.
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[ExportTx]].
         */
        this.buildExportTx = (utxoset, amount, destinationChain, toAddresses, fromAddresses, changeAddresses = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1, assetID = undefined) => __awaiter(this, void 0, void 0, function* () {
            const prefixes = {};
            toAddresses.map((a) => {
                prefixes[a.split("-")[0]] = true;
            });
            if (Object.keys(prefixes).length !== 1) {
                throw new errors_1.AddressError("Error - AXVMAPI.buildExportTx: To addresses must have the same chainID prefix.");
            }
            if (typeof destinationChain === "undefined") {
                throw new errors_1.ChainIdError("Error - AXVMAPI.buildExportTx: Destination ChainID is undefined.");
            }
            else if (typeof destinationChain === "string") {
                destinationChain = bintools.cb58Decode(destinationChain); //
            }
            else if (!(destinationChain instanceof buffer_1.Buffer)) {
                throw new errors_1.ChainIdError("Error - AXVMAPI.buildExportTx: Invalid destinationChain type: " +
                    typeof destinationChain);
            }
            if (destinationChain.length !== 32) {
                throw new errors_1.ChainIdError("Error - AXVMAPI.buildExportTx: Destination ChainID must be 32 bytes in length.");
            }
            const to = [];
            toAddresses.map((a) => {
                to.push(bintools.stringToAddress(a));
            });
            const caller = "buildExportTx";
            const from = this._cleanAddressArray(fromAddresses, caller).map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, caller).map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const axcAssetID = yield this.getAXCAssetID();
            if (typeof assetID === "undefined") {
                assetID = bintools.cb58Encode(axcAssetID);
            }
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const assetIDBuf = bintools.cb58Decode(assetID);
            const fee = this.getTxFee();
            const builtUnsignedTx = utxoset.buildExportTx(networkID, blockchainID, amount, assetIDBuf, to, from, change, destinationChain, fee, axcAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - AXVMAPI.buildExportTx:Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Creates an unsigned transaction. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param initialState The [[InitialStates]] that represent the intial state of a created asset
         * @param name String for the descriptive name of the asset
         * @param symbol String for the ticker symbol of the asset
         * @param denomination Number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AXC = 10^9 $nAXC
         * @param mintOutputs Optional. Array of [[SECPMintOutput]]s to be included in the transaction. These outputs can be spent to mint more tokens.
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[CreateAssetTx]].
         *
         */
        this.buildCreateAssetTx = (utxoset, fromAddresses, changeAddresses, initialStates, name, symbol, denomination, mintOutputs = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildCreateAssetTx";
            const from = this._cleanAddressArray(fromAddresses, caller).map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, caller).map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            if (symbol.length > constants_1.AXVMConstants.SYMBOLMAXLEN) {
                throw new errors_1.SymbolError("Error - AXVMAPI.buildCreateAssetTx: Symbols may not exceed length of " +
                    constants_1.AXVMConstants.SYMBOLMAXLEN);
            }
            if (name.length > constants_1.AXVMConstants.ASSETNAMELEN) {
                throw new errors_1.NameError("Error - AXVMAPI.buildCreateAssetTx: Names may not exceed length of " +
                    constants_1.AXVMConstants.ASSETNAMELEN);
            }
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const axcAssetID = yield this.getAXCAssetID();
            const fee = this.getDefaultCreationTxFee();
            const builtUnsignedTx = utxoset.buildCreateAssetTx(networkID, blockchainID, from, change, initialStates, name, symbol, denomination, mintOutputs, fee, axcAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, fee))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - AXVMAPI.buildCreateAssetTx:Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        this.buildSECPMintTx = (utxoset, mintOwner, transferOwner, fromAddresses, changeAddresses, mintUTXOID, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildSECPMintTx";
            const from = this._cleanAddressArray(fromAddresses, caller).map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, caller).map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const axcAssetID = yield this.getAXCAssetID();
            const fee = this.getMintTxFee();
            const builtUnsignedTx = utxoset.buildSECPMintTx(networkID, blockchainID, mintOwner, transferOwner, from, change, mintUTXOID, fee, axcAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - AXVMAPI.buildSECPMintTx:Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Creates an unsigned transaction. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param minterSets is a list where each element specifies that threshold of the addresses in minters may together mint more of the asset by signing a minting transaction
         * @param name String for the descriptive name of the asset
         * @param symbol String for the ticker symbol of the asset
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting mint output
         *
         * ```js
         * Example minterSets:
         * [
         *      {
         *          "minters":[
         *              "X-axc1ghstjukrtw8935lryqtnh643xe9a94u3tc75c7"
         *          ],
         *          "threshold": 1
         *      },
         *      {
         *          "minters": [
         *              "X-axc1yell3e4nln0m39cfpdhgqprsd87jkh4qnakklx",
         *              "X-axc1k4nr26c80jaquzm9369j5a4shmwcjn0vmemcjz",
         *              "X-axc1ztkzsrjnkn0cek5ryvhqswdtcg23nhge3nnr5e"
         *          ],
         *          "threshold": 2
         *      }
         * ]
         * ```
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[CreateAssetTx]].
         *
         */
        this.buildCreateNFTAssetTx = (utxoset, fromAddresses, changeAddresses, minterSets, name, symbol, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0)) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildCreateNFTAssetTx";
            const from = this._cleanAddressArray(fromAddresses, caller).map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, caller).map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            if (name.length > constants_1.AXVMConstants.ASSETNAMELEN) {
                /* istanbul ignore next */
                throw new errors_1.NameError("Error - AXVMAPI.buildCreateNFTAssetTx: Names may not exceed length of " +
                    constants_1.AXVMConstants.ASSETNAMELEN);
            }
            if (symbol.length > constants_1.AXVMConstants.SYMBOLMAXLEN) {
                /* istanbul ignore next */
                throw new errors_1.SymbolError("Error - AXVMAPI.buildCreateNFTAssetTx: Symbols may not exceed length of " +
                    constants_1.AXVMConstants.SYMBOLMAXLEN);
            }
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const creationTxFee = this.getCreationTxFee();
            const axcAssetID = yield this.getAXCAssetID();
            const builtUnsignedTx = utxoset.buildCreateNFTAssetTx(networkID, blockchainID, from, change, minterSets, name, symbol, creationTxFee, axcAssetID, memo, asOf, locktime);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, creationTxFee))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - AXVMAPI.buildCreateNFTAssetTx:Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Creates an unsigned transaction. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset  A set of UTXOs that the transaction is built on
         * @param owners Either a single or an array of [[OutputOwners]] to send the nft output
         * @param fromAddresses The addresses being used to send the NFT from the utxoID provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param utxoid A base58 utxoID or an array of base58 utxoIDs for the nft mint output this transaction is sending
         * @param groupID Optional. The group this NFT is issued to.
         * @param payload Optional. Data for NFT Payload as either a [[PayloadBase]] or a {@link https://github.com/feross/buffer|Buffer}
         * @param memo Optional CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[OperationTx]].
         *
         */
        this.buildCreateNFTMintTx = (utxoset, owners, fromAddresses, changeAddresses, utxoid, groupID = 0, payload = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => __awaiter(this, void 0, void 0, function* () {
            const caller = "buildCreateNFTMintTx";
            const from = this._cleanAddressArray(fromAddresses, caller).map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, caller).map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            if (payload instanceof payload_1.PayloadBase) {
                payload = payload.getPayload();
            }
            if (typeof utxoid === "string") {
                utxoid = [utxoid];
            }
            const axcAssetID = yield this.getAXCAssetID();
            if (owners instanceof output_1.OutputOwners) {
                owners = [owners];
            }
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const txFee = this.getTxFee();
            const builtUnsignedTx = utxoset.buildCreateNFTMintTx(networkID, blockchainID, owners, from, change, utxoid, groupID, payload, txFee, axcAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - AXVMAPI.buildCreateNFTMintTx:Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which takes an unsigned transaction and signs it, returning the resulting [[Tx]].
         *
         * @param utx The unsigned transaction of type [[UnsignedTx]]
         *
         * @returns A signed transaction of type [[Tx]]
         */
        this.signTx = (utx) => utx.sign(this.keychain);
        /**
         * Calls the node's issueTx method from the API and returns the resulting transaction ID as a string.
         *
         * @param tx A string, {@link https://github.com/feross/buffer|Buffer}, or [[Tx]] representing a transaction
         *
         * @returns A Promise string representing the transaction ID of the posted transaction.
         */
        this.issueTx = (tx) => __awaiter(this, void 0, void 0, function* () {
            let Transaction = "";
            if (typeof tx === "string") {
                Transaction = tx;
            }
            else if (tx instanceof buffer_1.Buffer) {
                const txobj = new tx_1.Tx();
                txobj.fromBuffer(tx);
                Transaction = txobj.toString();
            }
            else if (tx instanceof tx_1.Tx) {
                Transaction = tx.toString();
            }
            else {
                /* istanbul ignore next */
                throw new errors_1.TransactionError("Error - AXVMAPI.issueTx: provided tx is not expected type of string, Buffer, or Tx");
            }
            const params = {
                tx: Transaction.toString()
            };
            const response = yield this.callMethod("axvm.issueTx", params);
            return response.data.result.txID;
        });
        /**
         * Calls the node's getAddressTxs method from the API and returns transactions corresponding to the provided address and assetID
         *
         * @param address The address for which we're fetching related transactions.
         * @param cursor Page number or offset.
         * @param pageSize  Number of items to return per page. Optional. Defaults to 1024. If [pageSize] == 0 or [pageSize] > [maxPageSize], then it fetches at max [maxPageSize] transactions
         * @param assetID Only return transactions that changed the balance of this asset. Must be an ID or an alias for an asset.
         *
         * @returns A promise object representing the array of transaction IDs and page offset
         */
        this.getAddressTxs = (address, cursor, pageSize, assetID) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            let pageSizeNum;
            if (typeof assetID !== "string") {
                asset = bintools.cb58Encode(assetID);
            }
            else {
                asset = assetID;
            }
            if (typeof pageSize !== "number") {
                pageSizeNum = 0;
            }
            else {
                pageSizeNum = pageSize;
            }
            const params = {
                address,
                cursor,
                pageSize: pageSizeNum,
                assetID: asset
            };
            const response = yield this.callMethod("axvm.getAddressTxs", params);
            return response.data.result;
        });
        /**
         * Sends an amount of assetID to the specified address from a list of owned of addresses.
         *
         * @param username The user that owns the private keys associated with the `from` addresses
         * @param password The password unlocking the user
         * @param assetID The assetID of the asset to send
         * @param amount The amount of the asset to be sent
         * @param to The address of the recipient
         * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
         * @param changeAddr Optional. An address to send the change
         * @param memo Optional. CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         *
         * @returns Promise for the string representing the transaction's ID.
         */
        this.send = (username, password, assetID, amount, to, from = undefined, changeAddr = undefined, memo = undefined) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            let amnt;
            if (typeof this.parseAddress(to) === "undefined") {
                /* istanbul ignore next */
                throw new errors_1.AddressError("Error - AXVMAPI.send: Invalid address format");
            }
            if (typeof assetID !== "string") {
                asset = bintools.cb58Encode(assetID);
            }
            else {
                asset = assetID;
            }
            if (typeof amount === "number") {
                amnt = new bn_js_1.default(amount);
            }
            else {
                amnt = amount;
            }
            const params = {
                username: username,
                password: password,
                assetID: asset,
                amount: amnt.toString(10),
                to: to
            };
            const caller = "send";
            from = this._cleanAddressArray(from, caller);
            if (typeof from !== "undefined") {
                params["from"] = from;
            }
            if (typeof changeAddr !== "undefined") {
                if (typeof this.parseAddress(changeAddr) === "undefined") {
                    /* istanbul ignore next */
                    throw new errors_1.AddressError("Error - AXVMAPI.send: Invalid address format");
                }
                params["changeAddr"] = changeAddr;
            }
            if (typeof memo !== "undefined") {
                if (typeof memo !== "string") {
                    params["memo"] = bintools.cb58Encode(memo);
                }
                else {
                    params["memo"] = memo;
                }
            }
            const response = yield this.callMethod("axvm.send", params);
            return response.data.result;
        });
        /**
         * Sends an amount of assetID to an array of specified addresses from a list of owned of addresses.
         *
         * @param username The user that owns the private keys associated with the `from` addresses
         * @param password The password unlocking the user
         * @param sendOutputs The array of SendOutputs. A SendOutput is an object literal which contains an assetID, amount, and to.
         * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
         * @param changeAddr Optional. An address to send the change
         * @param memo Optional. CB58 Buffer or String which contains arbitrary bytes, up to 256 bytes
         *
         * @returns Promise for the string representing the transaction"s ID.
         */
        this.sendMultiple = (username, password, sendOutputs, from = undefined, changeAddr = undefined, memo = undefined) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            let amnt;
            const sOutputs = [];
            sendOutputs.forEach((output) => {
                if (typeof this.parseAddress(output.to) === "undefined") {
                    /* istanbul ignore next */
                    throw new errors_1.AddressError("Error - AXVMAPI.sendMultiple: Invalid address format");
                }
                if (typeof output.assetID !== "string") {
                    asset = bintools.cb58Encode(output.assetID);
                }
                else {
                    asset = output.assetID;
                }
                if (typeof output.amount === "number") {
                    amnt = new bn_js_1.default(output.amount);
                }
                else {
                    amnt = output.amount;
                }
                sOutputs.push({
                    to: output.to,
                    assetID: asset,
                    amount: amnt.toString(10)
                });
            });
            const params = {
                username: username,
                password: password,
                outputs: sOutputs
            };
            const caller = "send";
            from = this._cleanAddressArray(from, caller);
            if (typeof from !== "undefined") {
                params.from = from;
            }
            if (typeof changeAddr !== "undefined") {
                if (typeof this.parseAddress(changeAddr) === "undefined") {
                    /* istanbul ignore next */
                    throw new errors_1.AddressError("Error - AXVMAPI.send: Invalid address format");
                }
                params.changeAddr = changeAddr;
            }
            if (typeof memo !== "undefined") {
                if (typeof memo !== "string") {
                    params.memo = bintools.cb58Encode(memo);
                }
                else {
                    params.memo = memo;
                }
            }
            const response = yield this.callMethod("axvm.sendMultiple", params);
            return response.data.result;
        });
        /**
         * Given a JSON representation of this Virtual Machine’s genesis state, create the byte representation of that state.
         *
         * @param genesisData The blockchain's genesis data object
         *
         * @returns Promise of a string of bytes
         */
        this.buildGenesis = (genesisData) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                genesisData
            };
            const response = yield this.callMethod("axvm.buildGenesis", params);
            return response.data.result.bytes;
        });
        this.blockchainID = blockchainID;
        const netID = core.getNetworkID();
        if (netID in constants_2.Defaults.network &&
            blockchainID in constants_2.Defaults.network[`${netID}`]) {
            const { alias } = constants_2.Defaults.network[`${netID}`][`${blockchainID}`];
            this.keychain = new keychain_1.KeyChain(this.core.getHRP(), alias);
        }
        else {
            this.keychain = new keychain_1.KeyChain(this.core.getHRP(), blockchainID);
        }
    }
    /**
     * @ignore
     */
    _cleanAddressArray(addresses, caller) {
        const addrs = [];
        const chainID = this.getBlockchainAlias()
            ? this.getBlockchainAlias()
            : this.getBlockchainID();
        if (addresses && addresses.length > 0) {
            for (let i = 0; i < addresses.length; i++) {
                if (typeof addresses[`${i}`] === "string") {
                    if (typeof this.parseAddress(addresses[`${i}`]) ===
                        "undefined") {
                        /* istanbul ignore next */
                        throw new errors_1.AddressError("Error - AXVMAPI.${caller}: Invalid address format");
                    }
                    addrs.push(addresses[`${i}`]);
                }
                else {
                    const type = "bech32";
                    addrs.push(serialization.bufferToType(addresses[`${i}`], type, this.core.getHRP(), chainID));
                }
            }
        }
        return addrs;
    }
}
exports.AXVMAPI = AXVMAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYXh2bS9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsa0RBQXNCO0FBQ3RCLG9DQUFnQztBQUVoQyxvRUFBMkM7QUFDM0MsbUNBQXVDO0FBQ3ZDLDJDQUEyQztBQUMzQyx5Q0FBcUM7QUFDckMsNkJBQXFDO0FBQ3JDLGlEQUFpRDtBQUdqRCxpRUFBcUQ7QUFDckQsa0RBQThDO0FBRTlDLHFEQUEyRTtBQUczRSxnREFBa0Q7QUFFbEQsK0NBUTJCO0FBQzNCLHVDQUEyRDtBQW9DM0Q7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQixxQkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWhFOzs7Ozs7R0FNRztBQUNILE1BQWEsT0FBUSxTQUFRLGlCQUFPO0lBNjdEbEM7Ozs7OztPQU1HO0lBQ0gsWUFDRSxJQUFjLEVBQ2QsVUFBa0IsV0FBVyxFQUM3QixlQUF1QixFQUFFO1FBRXpCLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7UUF4OER0Qjs7V0FFRztRQUNPLGFBQVEsR0FBYSxJQUFJLG1CQUFRLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQ3pDLGlCQUFZLEdBQVcsRUFBRSxDQUFBO1FBQ3pCLG9CQUFlLEdBQVcsU0FBUyxDQUFBO1FBQ25DLGVBQVUsR0FBVyxTQUFTLENBQUE7UUFDOUIsVUFBSyxHQUFPLFNBQVMsQ0FBQTtRQUNyQixrQkFBYSxHQUFPLFNBQVMsQ0FBQTtRQUM3QixjQUFTLEdBQU8sU0FBUyxDQUFBO1FBRW5DOzs7O1dBSUc7UUFDSCx1QkFBa0IsR0FBRyxHQUFXLEVBQUU7WUFDaEMsSUFBSSxPQUFPLElBQUksQ0FBQyxlQUFlLEtBQUssV0FBVyxFQUFFO2dCQUMv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QyxLQUFLLFFBQVEsRUFBRTtvQkFDekMsSUFDRSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQVcsQ0FBQzt3QkFDckQsV0FBVyxFQUNYO3dCQUNBLDBCQUEwQjt3QkFDMUIsTUFBTSxJQUFJLHFCQUFZLENBQ3BCLG1EQUFtRCxDQUNwRCxDQUFBO3FCQUNGO29CQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQVcsQ0FBQyxDQUFBO2lCQUN4QztxQkFBTTtvQkFDTCxNQUFNLElBQUksR0FBbUIsUUFBUSxDQUFBO29CQUNyQyxLQUFLLENBQUMsSUFBSSxDQUNSLGFBQWEsQ0FBQyxZQUFZLENBQ3hCLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFXLEVBQzNCLElBQUksRUFDSixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUNsQixPQUFPLENBQ1IsQ0FDRixDQUFBO2lCQUNGO2FBQ0Y7U0FDRjtRQUNELE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztDQTJCRjtBQXQ5REQsMEJBczlEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1BWFZNXG4gKi9cbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIlxuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEF4aWFDb3JlIGZyb20gXCIuLi8uLi9heGlhXCJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxuaW1wb3J0IHsgVVRYTywgVVRYT1NldCB9IGZyb20gXCIuL3V0eG9zXCJcbmltcG9ydCB7IEFYVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHsgS2V5Q2hhaW4gfSBmcm9tIFwiLi9rZXljaGFpblwiXG5pbXBvcnQgeyBUeCwgVW5zaWduZWRUeCB9IGZyb20gXCIuL3R4XCJcbmltcG9ydCB7IFBheWxvYWRCYXNlIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3BheWxvYWRcIlxuaW1wb3J0IHsgU0VDUE1pbnRPdXRwdXQgfSBmcm9tIFwiLi9vdXRwdXRzXCJcbmltcG9ydCB7IEluaXRpYWxTdGF0ZXMgfSBmcm9tIFwiLi9pbml0aWFsc3RhdGVzXCJcbmltcG9ydCB7IFVuaXhOb3cgfSBmcm9tIFwiLi4vLi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zXCJcbmltcG9ydCB7IEpSUENBUEkgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2pycGNhcGlcIlxuaW1wb3J0IHsgUmVxdWVzdFJlc3BvbnNlRGF0YSB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpYmFzZVwiXG5pbXBvcnQgeyBEZWZhdWx0cywgUHJpbWFyeUFzc2V0QWxpYXMsIE9ORUFYQyB9IGZyb20gXCIuLi8uLi91dGlscy9jb25zdGFudHNcIlxuaW1wb3J0IHsgTWludGVyU2V0IH0gZnJvbSBcIi4vbWludGVyc2V0XCJcbmltcG9ydCB7IFBlcnNpc3RhbmNlT3B0aW9ucyB9IGZyb20gXCIuLi8uLi91dGlscy9wZXJzaXN0ZW5jZW9wdGlvbnNcIlxuaW1wb3J0IHsgT3V0cHV0T3duZXJzIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9vdXRwdXRcIlxuaW1wb3J0IHsgU0VDUFRyYW5zZmVyT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXG5pbXBvcnQge1xuICBBZGRyZXNzRXJyb3IsXG4gIEdvb3NlRWdnQ2hlY2tFcnJvcixcbiAgQ2hhaW5JZEVycm9yLFxuICBOb0F0b21pY1VUWE9zRXJyb3IsXG4gIFN5bWJvbEVycm9yLFxuICBOYW1lRXJyb3IsXG4gIFRyYW5zYWN0aW9uRXJyb3Jcbn0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkVHlwZSB9IGZyb20gXCIuLi8uLi91dGlsc1wiXG5pbXBvcnQge1xuICBCdWlsZEdlbmVzaXNQYXJhbXMsXG4gIENyZWF0ZUFkZHJlc3NQYXJhbXMsXG4gIENyZWF0ZUZpeGVkQ2FwQXNzZXRQYXJhbXMsXG4gIENyZWF0ZVZhcmlhYmxlQ2FwQXNzZXRQYXJhbXMsXG4gIEV4cG9ydFBhcmFtcyxcbiAgRXhwb3J0S2V5UGFyYW1zLFxuICBHZXRBbGxCYWxhbmNlc1BhcmFtcyxcbiAgR2V0QXNzZXREZXNjcmlwdGlvblBhcmFtcyxcbiAgR2V0QVhDQXNzZXRJRFBhcmFtcyxcbiAgR2V0QmFsYW5jZVBhcmFtcyxcbiAgR2V0VHhQYXJhbXMsXG4gIEdldFR4U3RhdHVzUGFyYW1zLFxuICBHZXRVVFhPc1BhcmFtcyxcbiAgSW1wb3J0UGFyYW1zLFxuICBJbXBvcnRLZXlQYXJhbXMsXG4gIExpc3RBZGRyZXNzZXNQYXJhbXMsXG4gIE1pbnRQYXJhbXMsXG4gIFNlbmRNdWx0aXBsZVBhcmFtcyxcbiAgU091dHB1dHNQYXJhbXMsXG4gIEdldFVUWE9zUmVzcG9uc2UsXG4gIEdldEFzc2V0RGVzY3JpcHRpb25SZXNwb25zZSxcbiAgR2V0QmFsYW5jZVJlc3BvbnNlLFxuICBTZW5kUGFyYW1zLFxuICBTZW5kUmVzcG9uc2UsXG4gIFNlbmRNdWx0aXBsZVJlc3BvbnNlLFxuICBHZXRBZGRyZXNzVHhzUGFyYW1zLFxuICBHZXRBZGRyZXNzVHhzUmVzcG9uc2UsXG4gIENyZWF0ZU5GVEFzc2V0UGFyYW1zLFxuICBTZW5kTkZUUGFyYW1zLFxuICBNaW50TkZUUGFyYW1zLFxuICBJTWludGVyU2V0XG59IGZyb20gXCIuL2ludGVyZmFjZXNcIlxuaW1wb3J0IHsgSXNzdWVUeFBhcmFtcyB9IGZyb20gXCIuLi8uLi9jb21tb25cIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuXG4vKipcbiAqIENsYXNzIGZvciBpbnRlcmFjdGluZyB3aXRoIGEgbm9kZSBlbmRwb2ludCB0aGF0IGlzIHVzaW5nIHRoZSBBWFZNLlxuICpcbiAqIEBjYXRlZ29yeSBSUENBUElzXG4gKlxuICogQHJlbWFya3MgVGhpcyBleHRlbmRzIHRoZSBbW0pSUENBUEldXSBjbGFzcy4gVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGRpcmVjdGx5IGNhbGxlZC4gSW5zdGVhZCwgdXNlIHRoZSBbW0F4aWEuYWRkQVBJXV0gZnVuY3Rpb24gdG8gcmVnaXN0ZXIgdGhpcyBpbnRlcmZhY2Ugd2l0aCBBeGlhLlxuICovXG5leHBvcnQgY2xhc3MgQVhWTUFQSSBleHRlbmRzIEpSUENBUEkge1xuICAvKipcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgcHJvdGVjdGVkIGtleWNoYWluOiBLZXlDaGFpbiA9IG5ldyBLZXlDaGFpbihcIlwiLCBcIlwiKVxuICBwcm90ZWN0ZWQgYmxvY2tjaGFpbklEOiBzdHJpbmcgPSBcIlwiXG4gIHByb3RlY3RlZCBibG9ja2NoYWluQWxpYXM6IHN0cmluZyA9IHVuZGVmaW5lZFxuICBwcm90ZWN0ZWQgQVhDQXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkXG4gIHByb3RlY3RlZCB0eEZlZTogQk4gPSB1bmRlZmluZWRcbiAgcHJvdGVjdGVkIGNyZWF0aW9uVHhGZWU6IEJOID0gdW5kZWZpbmVkXG4gIHByb3RlY3RlZCBtaW50VHhGZWU6IEJOID0gdW5kZWZpbmVkXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGFsaWFzIGZvciB0aGUgYmxvY2tjaGFpbklEIGlmIGl0IGV4aXN0cywgb3RoZXJ3aXNlIHJldHVybnMgYHVuZGVmaW5lZGAuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRFxuICAgKi9cbiAgZ2V0QmxvY2tjaGFpbkFsaWFzID0gKCk6IHN0cmluZyA9PiB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLmJsb2NrY2hhaW5BbGlhcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgY29uc3QgbmV0aWQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxuICAgICAgaWYgKFxuICAgICAgICBuZXRpZCBpbiBEZWZhdWx0cy5uZXR3b3JrICYmXG4gICAgICAgIHRoaXMuYmxvY2tjaGFpbklEIGluIERlZmF1bHRzLm5ldHdvcmtbYCR7bmV0aWR9YF1cbiAgICAgICkge1xuICAgICAgICB0aGlzLmJsb2NrY2hhaW5BbGlhcyA9XG4gICAgICAgICAgRGVmYXVsdHMubmV0d29ya1tgJHtuZXRpZH1gXVt0aGlzLmJsb2NrY2hhaW5JRF0uYWxpYXNcbiAgICAgICAgcmV0dXJuIHRoaXMuYmxvY2tjaGFpbkFsaWFzXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmJsb2NrY2hhaW5BbGlhc1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFsaWFzIGZvciB0aGUgYmxvY2tjaGFpbklELlxuICAgKlxuICAgKiBAcGFyYW0gYWxpYXMgVGhlIGFsaWFzIGZvciB0aGUgYmxvY2tjaGFpbklELlxuICAgKlxuICAgKi9cbiAgc2V0QmxvY2tjaGFpbkFsaWFzID0gKGFsaWFzOiBzdHJpbmcpOiB1bmRlZmluZWQgPT4ge1xuICAgIHRoaXMuYmxvY2tjaGFpbkFsaWFzID0gYWxpYXNcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIHJldHVybiB1bmRlZmluZWRcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBibG9ja2NoYWluSUQgYW5kIHJldHVybnMgaXQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBibG9ja2NoYWluSURcbiAgICovXG4gIGdldEJsb2NrY2hhaW5JRCA9ICgpOiBzdHJpbmcgPT4gdGhpcy5ibG9ja2NoYWluSURcblxuICAvKipcbiAgICogUmVmcmVzaCBibG9ja2NoYWluSUQsIGFuZCBpZiBhIGJsb2NrY2hhaW5JRCBpcyBwYXNzZWQgaW4sIHVzZSB0aGF0LlxuICAgKlxuICAgKiBAcGFyYW0gT3B0aW9uYWwuIEJsb2NrY2hhaW5JRCB0byBhc3NpZ24sIGlmIG5vbmUsIHVzZXMgdGhlIGRlZmF1bHQgYmFzZWQgb24gbmV0d29ya0lELlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYmxvY2tjaGFpbklEXG4gICAqL1xuICByZWZyZXNoQmxvY2tjaGFpbklEID0gKGJsb2NrY2hhaW5JRDogc3RyaW5nID0gdW5kZWZpbmVkKTogYm9vbGVhbiA9PiB7XG4gICAgY29uc3QgbmV0aWQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxuICAgIGlmIChcbiAgICAgIHR5cGVvZiBibG9ja2NoYWluSUQgPT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgIHR5cGVvZiBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldGlkfWBdICE9PSBcInVuZGVmaW5lZFwiXG4gICAgKSB7XG4gICAgICB0aGlzLmJsb2NrY2hhaW5JRCA9IERlZmF1bHRzLm5ldHdvcmtbYCR7bmV0aWR9YF0uWC5ibG9ja2NoYWluSUQgLy9kZWZhdWx0IHRvIEFzc2V0Q2hhaW5cbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIGlmICh0eXBlb2YgYmxvY2tjaGFpbklEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLmJsb2NrY2hhaW5JRCA9IGJsb2NrY2hhaW5JRFxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYW4gYWRkcmVzcyBzdHJpbmcgYW5kIHJldHVybnMgaXRzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIGlmIHZhbGlkLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgYWRkcmVzcyBpZiB2YWxpZCwgdW5kZWZpbmVkIGlmIG5vdCB2YWxpZC5cbiAgICovXG4gIHBhcnNlQWRkcmVzcyA9IChhZGRyOiBzdHJpbmcpOiBCdWZmZXIgPT4ge1xuICAgIGNvbnN0IGFsaWFzOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5JRCgpXG4gICAgcmV0dXJuIGJpbnRvb2xzLnBhcnNlQWRkcmVzcyhcbiAgICAgIGFkZHIsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBhbGlhcyxcbiAgICAgIEFYVk1Db25zdGFudHMuQUREUkVTU0xFTkdUSFxuICAgIClcbiAgfVxuXG4gIGFkZHJlc3NGcm9tQnVmZmVyID0gKGFkZHJlc3M6IEJ1ZmZlcik6IHN0cmluZyA9PiB7XG4gICAgY29uc3QgY2hhaW5JRDogc3RyaW5nID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxuICAgICAgPyB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXG4gICAgICA6IHRoaXMuZ2V0QmxvY2tjaGFpbklEKClcbiAgICBjb25zdCB0eXBlOiBTZXJpYWxpemVkVHlwZSA9IFwiYmVjaDMyXCJcbiAgICBjb25zdCBocnA6IHN0cmluZyA9IHRoaXMuY29yZS5nZXRIUlAoKVxuICAgIHJldHVybiBzZXJpYWxpemF0aW9uLmJ1ZmZlclRvVHlwZShhZGRyZXNzLCB0eXBlLCBocnAsIGNoYWluSUQpXG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyB0aGUgQVhDIEFzc2V0SUQgYW5kIHJldHVybnMgaXQgaW4gYSBQcm9taXNlLlxuICAgKlxuICAgKiBAcGFyYW0gcmVmcmVzaCBUaGlzIGZ1bmN0aW9uIGNhY2hlcyB0aGUgcmVzcG9uc2UuIFJlZnJlc2ggPSB0cnVlIHdpbGwgYnVzdCB0aGUgY2FjaGUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0aGUgcHJvdmlkZWQgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgQVhDIEFzc2V0SURcbiAgICovXG4gIGdldEFYQ0Fzc2V0SUQgPSBhc3luYyAocmVmcmVzaDogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxCdWZmZXI+ID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMuQVhDQXNzZXRJRCA9PT0gXCJ1bmRlZmluZWRcIiB8fCByZWZyZXNoKSB7XG4gICAgICBjb25zdCBhc3NldDogR2V0QVhDQXNzZXRJRFBhcmFtcyA9IGF3YWl0IHRoaXMuZ2V0QXNzZXREZXNjcmlwdGlvbihcbiAgICAgICAgUHJpbWFyeUFzc2V0QWxpYXNcbiAgICAgIClcbiAgICAgIHRoaXMuQVhDQXNzZXRJRCA9IGFzc2V0LmFzc2V0SURcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuQVhDQXNzZXRJRFxuICB9XG5cbiAgLyoqXG4gICAqIE92ZXJyaWRlcyB0aGUgZGVmYXVsdHMgYW5kIHNldHMgdGhlIGNhY2hlIHRvIGEgc3BlY2lmaWMgQVhDIEFzc2V0SURcbiAgICpcbiAgICogQHBhcmFtIGF4Y0Fzc2V0SUQgQSBjYjU4IHN0cmluZyBvciBCdWZmZXIgcmVwcmVzZW50aW5nIHRoZSBBWEMgQXNzZXRJRFxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdGhlIHByb3ZpZGVkIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIEFYQyBBc3NldElEXG4gICAqL1xuICBzZXRBWENBc3NldElEID0gKGF4Y0Fzc2V0SUQ6IHN0cmluZyB8IEJ1ZmZlcikgPT4ge1xuICAgIGlmICh0eXBlb2YgYXhjQXNzZXRJRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgYXhjQXNzZXRJRCA9IGJpbnRvb2xzLmNiNThEZWNvZGUoYXhjQXNzZXRJRClcbiAgICB9XG4gICAgdGhpcy5BWENBc3NldElEID0gYXhjQXNzZXRJRFxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRlZmF1bHQgdHggZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZGVmYXVsdCB0eCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0RGVmYXVsdFR4RmVlID0gKCk6IEJOID0+IHtcbiAgICByZXR1cm4gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpIGluIERlZmF1bHRzLm5ldHdvcmtcbiAgICAgID8gbmV3IEJOKERlZmF1bHRzLm5ldHdvcmtbdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXVtcIlhcIl1bXCJ0eEZlZVwiXSlcbiAgICAgIDogbmV3IEJOKDApXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdHggZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdHggZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIGdldFR4RmVlID0gKCk6IEJOID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMudHhGZWUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMudHhGZWUgPSB0aGlzLmdldERlZmF1bHRUeEZlZSgpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLnR4RmVlXG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdHggZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcGFyYW0gZmVlIFRoZSB0eCBmZWUgYW1vdW50IHRvIHNldCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgc2V0VHhGZWUgPSAoZmVlOiBCTik6IHZvaWQgPT4ge1xuICAgIHRoaXMudHhGZWUgPSBmZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkZWZhdWx0IGNyZWF0aW9uIGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGRlZmF1bHQgY3JlYXRpb24gZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIGdldERlZmF1bHRDcmVhdGlvblR4RmVlID0gKCk6IEJOID0+IHtcbiAgICByZXR1cm4gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpIGluIERlZmF1bHRzLm5ldHdvcmtcbiAgICAgID8gbmV3IEJOKERlZmF1bHRzLm5ldHdvcmtbdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXVtcIlhcIl1bXCJjcmVhdGlvblR4RmVlXCJdKVxuICAgICAgOiBuZXcgQk4oMClcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkZWZhdWx0IG1pbnQgZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZGVmYXVsdCBtaW50IGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXREZWZhdWx0TWludFR4RmVlID0gKCk6IEJOID0+IHtcbiAgICByZXR1cm4gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpIGluIERlZmF1bHRzLm5ldHdvcmtcbiAgICAgID8gbmV3IEJOKERlZmF1bHRzLm5ldHdvcmtbdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXVtcIlhcIl1bXCJtaW50VHhGZWVcIl0pXG4gICAgICA6IG5ldyBCTigwKVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1pbnQgZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbWludCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0TWludFR4RmVlID0gKCk6IEJOID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMubWludFR4RmVlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLm1pbnRUeEZlZSA9IHRoaXMuZ2V0RGVmYXVsdE1pbnRUeEZlZSgpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLm1pbnRUeEZlZVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNyZWF0aW9uIGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGNyZWF0aW9uIGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXRDcmVhdGlvblR4RmVlID0gKCk6IEJOID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMuY3JlYXRpb25UeEZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5jcmVhdGlvblR4RmVlID0gdGhpcy5nZXREZWZhdWx0Q3JlYXRpb25UeEZlZSgpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNyZWF0aW9uVHhGZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBtaW50IGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHBhcmFtIGZlZSBUaGUgbWludCBmZWUgYW1vdW50IHRvIHNldCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgc2V0TWludFR4RmVlID0gKGZlZTogQk4pOiB2b2lkID0+IHtcbiAgICB0aGlzLm1pbnRUeEZlZSA9IGZlZVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNyZWF0aW9uIGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHBhcmFtIGZlZSBUaGUgY3JlYXRpb24gZmVlIGFtb3VudCB0byBzZXQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIHNldENyZWF0aW9uVHhGZWUgPSAoZmVlOiBCTik6IHZvaWQgPT4ge1xuICAgIHRoaXMuY3JlYXRpb25UeEZlZSA9IGZlZVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSByZWZlcmVuY2UgdG8gdGhlIGtleWNoYWluIGZvciB0aGlzIGNsYXNzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaW5zdGFuY2Ugb2YgW1tLZXlDaGFpbl1dIGZvciB0aGlzIGNsYXNzXG4gICAqL1xuICBrZXlDaGFpbiA9ICgpOiBLZXlDaGFpbiA9PiB0aGlzLmtleWNoYWluXG5cbiAgLyoqXG4gICAqIEBpZ25vcmVcbiAgICovXG4gIG5ld0tleUNoYWluID0gKCk6IEtleUNoYWluID0+IHtcbiAgICAvLyB3YXJuaW5nLCBvdmVyd3JpdGVzIHRoZSBvbGQga2V5Y2hhaW5cbiAgICBjb25zdCBhbGlhczogc3RyaW5nID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxuICAgIGlmIChhbGlhcykge1xuICAgICAgdGhpcy5rZXljaGFpbiA9IG5ldyBLZXlDaGFpbih0aGlzLmNvcmUuZ2V0SFJQKCksIGFsaWFzKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgdGhpcy5ibG9ja2NoYWluSUQpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmtleWNoYWluXG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGRldGVybWluZXMgaWYgYSB0eCBpcyBhIGdvb3NlIGVnZyB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHV0eCBBbiBVbnNpZ25lZFR4XG4gICAqXG4gICAqIEByZXR1cm5zIGJvb2xlYW4gdHJ1ZSBpZiBwYXNzZXMgZ29vc2UgZWdnIHRlc3QgYW5kIGZhbHNlIGlmIGZhaWxzLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBBIFwiR29vc2UgRWdnIFRyYW5zYWN0aW9uXCIgaXMgd2hlbiB0aGUgZmVlIGZhciBleGNlZWRzIGEgcmVhc29uYWJsZSBhbW91bnRcbiAgICovXG4gIGNoZWNrR29vc2VFZ2cgPSBhc3luYyAoXG4gICAgdXR4OiBVbnNpZ25lZFR4LFxuICAgIG91dFRvdGFsOiBCTiA9IG5ldyBCTigwKVxuICApOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcbiAgICBjb25zdCBheGNBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFYQ0Fzc2V0SUQoKVxuICAgIGNvbnN0IG91dHB1dFRvdGFsOiBCTiA9IG91dFRvdGFsLmd0KG5ldyBCTigwKSlcbiAgICAgID8gb3V0VG90YWxcbiAgICAgIDogdXR4LmdldE91dHB1dFRvdGFsKGF4Y0Fzc2V0SUQpXG4gICAgY29uc3QgZmVlOiBCTiA9IHV0eC5nZXRCdXJuKGF4Y0Fzc2V0SUQpXG4gICAgaWYgKGZlZS5sdGUoT05FQVhDLm11bChuZXcgQk4oMTApKSkgfHwgZmVlLmx0ZShvdXRwdXRUb3RhbCkpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBiYWxhbmNlIG9mIGEgcGFydGljdWxhciBhc3NldCBvbiBhIGJsb2NrY2hhaW4uXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIHRvIHB1bGwgdGhlIGFzc2V0IGJhbGFuY2UgZnJvbVxuICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgYXNzZXRJRCB0byBwdWxsIHRoZSBiYWxhbmNlIGZyb21cbiAgICogQHBhcmFtIGluY2x1ZGVQYXJ0aWFsIElmIGluY2x1ZGVQYXJ0aWFsPWZhbHNlLCByZXR1cm5zIG9ubHkgdGhlIGJhbGFuY2UgaGVsZCBzb2xlbHlcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSB3aXRoIHRoZSBiYWxhbmNlIG9mIHRoZSBhc3NldElEIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gb24gdGhlIHByb3ZpZGVkIGFkZHJlc3MgZm9yIHRoZSBibG9ja2NoYWluLlxuICAgKi9cbiAgZ2V0QmFsYW5jZSA9IGFzeW5jIChcbiAgICBhZGRyZXNzOiBzdHJpbmcsXG4gICAgYXNzZXRJRDogc3RyaW5nLFxuICAgIGluY2x1ZGVQYXJ0aWFsOiBib29sZWFuID0gZmFsc2VcbiAgKTogUHJvbWlzZTxHZXRCYWxhbmNlUmVzcG9uc2U+ID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGFkZHJlc3MpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFYVk1BUEkuZ2V0QmFsYW5jZTogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiXG4gICAgICApXG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczogR2V0QmFsYW5jZVBhcmFtcyA9IHtcbiAgICAgIGFkZHJlc3MsXG4gICAgICBhc3NldElELFxuICAgICAgaW5jbHVkZVBhcnRpYWxcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF4dm0uZ2V0QmFsYW5jZVwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gYWRkcmVzcyAoYW5kIGFzc29jaWF0ZWQgcHJpdmF0ZSBrZXlzKSBvbiBhIHVzZXIgb24gYSBibG9ja2NoYWluLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgTmFtZSBvZiB0aGUgdXNlciB0byBjcmVhdGUgdGhlIGFkZHJlc3MgdW5kZXJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFBhc3N3b3JkIHRvIHVubG9jayB0aGUgdXNlciBhbmQgZW5jcnlwdCB0aGUgcHJpdmF0ZSBrZXlcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBhZGRyZXNzIGNyZWF0ZWQgYnkgdGhlIHZtLlxuICAgKi9cbiAgY3JlYXRlQWRkcmVzcyA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IENyZWF0ZUFkZHJlc3NQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJheHZtLmNyZWF0ZUFkZHJlc3NcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzc1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBmaXhlZC1jYXAsIGZ1bmdpYmxlIGFzc2V0LiBBIHF1YW50aXR5IG9mIGl0IGlzIGNyZWF0ZWQgYXQgaW5pdGlhbGl6YXRpb24gYW5kIHRoZXJlIG5vIG1vcmUgaXMgZXZlciBjcmVhdGVkLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXIgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUgKGluICRBWEMpIGZvciBhc3NldCBjcmVhdGlvblxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIGZvciB0aGUgdXNlciBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZSAoaW4gJEFYQykgZm9yIGFzc2V0IGNyZWF0aW9uXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBodW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgYXNzZXRcbiAgICogQHBhcmFtIHN5bWJvbCBPcHRpb25hbC4gVGhlIHNob3J0aGFuZCBzeW1ib2wgZm9yIHRoZSBhc3NldC4gQmV0d2VlbiAwIGFuZCA0IGNoYXJhY3RlcnNcbiAgICogQHBhcmFtIGRlbm9taW5hdGlvbiBPcHRpb25hbC4gRGV0ZXJtaW5lcyBob3cgYmFsYW5jZXMgb2YgdGhpcyBhc3NldCBhcmUgZGlzcGxheWVkIGJ5IHVzZXIgaW50ZXJmYWNlcy4gRGVmYXVsdCBpcyAwXG4gICAqIEBwYXJhbSBpbml0aWFsSG9sZGVycyBBbiBhcnJheSBvZiBvYmplY3RzIGNvbnRhaW5pbmcgdGhlIGZpZWxkIFwiYWRkcmVzc1wiIGFuZCBcImFtb3VudFwiIHRvIGVzdGFibGlzaCB0aGUgZ2VuZXNpcyB2YWx1ZXMgZm9yIHRoZSBuZXcgYXNzZXRcbiAgICpcbiAgICogYGBganNcbiAgICogRXhhbXBsZSBpbml0aWFsSG9sZGVyczpcbiAgICogW1xuICAgKiAgIHtcbiAgICogICAgIFwiYWRkcmVzc1wiOiBcIlgtYXhjMWtqMDZsaGd4ODRoMzlzbnNsamNleTN0cGMwNDZ6ZTY4bWVrM2c1XCIsXG4gICAqICAgICBcImFtb3VudFwiOiAxMDAwMFxuICAgKiAgIH0sXG4gICAqICAge1xuICAgKiAgICAgXCJhZGRyZXNzXCI6IFwiWC1heGMxYW00dzZoZnJ2bWgzYWtkdXpranRocnRndHFhZmFsY2U2YW44Y3JcIixcbiAgICogICAgIFwiYW1vdW50XCI6IDUwMDAwXG4gICAqICAgfVxuICAgKiBdXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgY29udGFpbmluZyB0aGUgYmFzZSA1OCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIElEIG9mIHRoZSBuZXdseSBjcmVhdGVkIGFzc2V0LlxuICAgKi9cbiAgY3JlYXRlRml4ZWRDYXBBc3NldCA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHN5bWJvbDogc3RyaW5nLFxuICAgIGRlbm9taW5hdGlvbjogbnVtYmVyLFxuICAgIGluaXRpYWxIb2xkZXJzOiBvYmplY3RbXVxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQ3JlYXRlRml4ZWRDYXBBc3NldFBhcmFtcyA9IHtcbiAgICAgIG5hbWUsXG4gICAgICBzeW1ib2wsXG4gICAgICBkZW5vbWluYXRpb24sXG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgaW5pdGlhbEhvbGRlcnNcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF4dm0uY3JlYXRlRml4ZWRDYXBBc3NldFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5hc3NldElEXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHZhcmlhYmxlLWNhcCwgZnVuZ2libGUgYXNzZXQuIE5vIHVuaXRzIG9mIHRoZSBhc3NldCBleGlzdCBhdCBpbml0aWFsaXphdGlvbi4gTWludGVycyBjYW4gbWludCB1bml0cyBvZiB0aGlzIGFzc2V0IHVzaW5nIGNyZWF0ZU1pbnRUeCwgc2lnbk1pbnRUeCBhbmQgc2VuZE1pbnRUeC5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VyIHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIChpbiAkQVhDKSBmb3IgYXNzZXQgY3JlYXRpb25cbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBmb3IgdGhlIHVzZXIgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUgKGluICRBWEMpIGZvciBhc3NldCBjcmVhdGlvblxuICAgKiBAcGFyYW0gbmFtZSBUaGUgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIGFzc2V0XG4gICAqIEBwYXJhbSBzeW1ib2wgT3B0aW9uYWwuIFRoZSBzaG9ydGhhbmQgc3ltYm9sIGZvciB0aGUgYXNzZXQgLS0gYmV0d2VlbiAwIGFuZCA0IGNoYXJhY3RlcnNcbiAgICogQHBhcmFtIGRlbm9taW5hdGlvbiBPcHRpb25hbC4gRGV0ZXJtaW5lcyBob3cgYmFsYW5jZXMgb2YgdGhpcyBhc3NldCBhcmUgZGlzcGxheWVkIGJ5IHVzZXIgaW50ZXJmYWNlcy4gRGVmYXVsdCBpcyAwXG4gICAqIEBwYXJhbSBtaW50ZXJTZXRzIGlzIGEgbGlzdCB3aGVyZSBlYWNoIGVsZW1lbnQgc3BlY2lmaWVzIHRoYXQgdGhyZXNob2xkIG9mIHRoZSBhZGRyZXNzZXMgaW4gbWludGVycyBtYXkgdG9nZXRoZXIgbWludCBtb3JlIG9mIHRoZSBhc3NldCBieSBzaWduaW5nIGEgbWludGluZyB0cmFuc2FjdGlvblxuICAgKlxuICAgKiBgYGBqc1xuICAgKiBFeGFtcGxlIG1pbnRlclNldHM6XG4gICAqIFtcbiAgICogICAge1xuICAgKiAgICAgIFwibWludGVyc1wiOltcbiAgICogICAgICAgIFwiWC1heGMxYW00dzZoZnJ2bWgzYWtkdXpranRocnRndHFhZmFsY2U2YW44Y3JcIlxuICAgKiAgICAgIF0sXG4gICAqICAgICAgXCJ0aHJlc2hvbGRcIjogMVxuICAgKiAgICAgfSxcbiAgICogICAgIHtcbiAgICogICAgICBcIm1pbnRlcnNcIjogW1xuICAgKiAgICAgICAgXCJYLWF4YzFhbTR3NmhmcnZtaDNha2R1emtqdGhydGd0cWFmYWxjZTZhbjhjclwiLFxuICAgKiAgICAgICAgXCJYLWF4YzFrajA2bGhneDg0aDM5c25zbGpjZXkzdHBjMDQ2emU2OG1lazNnNVwiLFxuICAgKiAgICAgICAgXCJYLWF4YzF5ZWxsM2U0bmxuMG0zOWNmcGRoZ3FwcnNkODdqa2g0cW5ha2tseFwiXG4gICAqICAgICAgXSxcbiAgICogICAgICBcInRocmVzaG9sZFwiOiAyXG4gICAqICAgICB9XG4gICAqIF1cbiAgICogYGBgXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIHN0cmluZyBjb250YWluaW5nIHRoZSBiYXNlIDU4IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgSUQgb2YgdGhlIG5ld2x5IGNyZWF0ZWQgYXNzZXQuXG4gICAqL1xuICBjcmVhdGVWYXJpYWJsZUNhcEFzc2V0ID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc3ltYm9sOiBzdHJpbmcsXG4gICAgZGVub21pbmF0aW9uOiBudW1iZXIsXG4gICAgbWludGVyU2V0czogb2JqZWN0W11cbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IENyZWF0ZVZhcmlhYmxlQ2FwQXNzZXRQYXJhbXMgPSB7XG4gICAgICBuYW1lLFxuICAgICAgc3ltYm9sLFxuICAgICAgZGVub21pbmF0aW9uLFxuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIG1pbnRlclNldHNcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF4dm0uY3JlYXRlVmFyaWFibGVDYXBBc3NldFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5hc3NldElEXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGZhbWlseSBvZiBORlQgQXNzZXQuIE5vIHVuaXRzIG9mIHRoZSBhc3NldCBleGlzdCBhdCBpbml0aWFsaXphdGlvbi4gTWludGVycyBjYW4gbWludCB1bml0cyBvZiB0aGlzIGFzc2V0IHVzaW5nIGNyZWF0ZU1pbnRUeCwgc2lnbk1pbnRUeCBhbmQgc2VuZE1pbnRUeC5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VyIHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIChpbiAkQVhDKSBmb3IgYXNzZXQgY3JlYXRpb25cbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBmb3IgdGhlIHVzZXIgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUgKGluICRBWEMpIGZvciBhc3NldCBjcmVhdGlvblxuICAgKiBAcGFyYW0gZnJvbSBPcHRpb25hbC4gQW4gYXJyYXkgb2YgYWRkcmVzc2VzIG1hbmFnZWQgYnkgdGhlIG5vZGUncyBrZXlzdG9yZSBmb3IgdGhpcyBibG9ja2NoYWluIHdoaWNoIHdpbGwgZnVuZCB0aGlzIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyIE9wdGlvbmFsLiBBbiBhZGRyZXNzIHRvIHNlbmQgdGhlIGNoYW5nZVxuICAgKiBAcGFyYW0gbmFtZSBUaGUgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIGFzc2V0XG4gICAqIEBwYXJhbSBzeW1ib2wgT3B0aW9uYWwuIFRoZSBzaG9ydGhhbmQgc3ltYm9sIGZvciB0aGUgYXNzZXQgLS0gYmV0d2VlbiAwIGFuZCA0IGNoYXJhY3RlcnNcbiAgICogQHBhcmFtIG1pbnRlclNldHMgaXMgYSBsaXN0IHdoZXJlIGVhY2ggZWxlbWVudCBzcGVjaWZpZXMgdGhhdCB0aHJlc2hvbGQgb2YgdGhlIGFkZHJlc3NlcyBpbiBtaW50ZXJzIG1heSB0b2dldGhlciBtaW50IG1vcmUgb2YgdGhlIGFzc2V0IGJ5IHNpZ25pbmcgYSBtaW50aW5nIHRyYW5zYWN0aW9uXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIHN0cmluZyBjb250YWluaW5nIHRoZSBiYXNlIDU4IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgSUQgb2YgdGhlIG5ld2x5IGNyZWF0ZWQgYXNzZXQuXG4gICAqL1xuICBjcmVhdGVORlRBc3NldCA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgZnJvbTogc3RyaW5nW10gfCBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcbiAgICBjaGFuZ2VBZGRyOiBzdHJpbmcsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHN5bWJvbDogc3RyaW5nLFxuICAgIG1pbnRlclNldDogSU1pbnRlclNldFxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQ3JlYXRlTkZUQXNzZXRQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgbmFtZSxcbiAgICAgIHN5bWJvbCxcbiAgICAgIG1pbnRlclNldFxuICAgIH1cblxuICAgIGNvbnN0IGNhbGxlcjogc3RyaW5nID0gXCJjcmVhdGVORlRBc3NldFwiXG4gICAgZnJvbSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb20sIGNhbGxlcilcbiAgICBpZiAodHlwZW9mIGZyb20gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtc1tcImZyb21cIl0gPSBmcm9tXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjaGFuZ2VBZGRyICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGNoYW5nZUFkZHIpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXG4gICAgICAgICAgXCJFcnJvciAtIEFYVk1BUEkuY3JlYXRlTkZUQXNzZXQ6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIlxuICAgICAgICApXG4gICAgICB9XG4gICAgICBwYXJhbXNbXCJjaGFuZ2VBZGRyXCJdID0gY2hhbmdlQWRkclxuICAgIH1cblxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJheHZtLmNyZWF0ZU5GVEFzc2V0XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmFzc2V0SURcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gdG8gbWludCBtb3JlIG9mIGFuIGFzc2V0LlxuICAgKlxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSB1bml0cyBvZiB0aGUgYXNzZXQgdG8gbWludFxuICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgSUQgb2YgdGhlIGFzc2V0IHRvIG1pbnRcbiAgICogQHBhcmFtIHRvIFRoZSBhZGRyZXNzIHRvIGFzc2lnbiB0aGUgdW5pdHMgb2YgdGhlIG1pbnRlZCBhc3NldFxuICAgKiBAcGFyYW0gbWludGVycyBBZGRyZXNzZXMgb2YgdGhlIG1pbnRlcnMgcmVzcG9uc2libGUgZm9yIHNpZ25pbmcgdGhlIHRyYW5zYWN0aW9uXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIHN0cmluZyBjb250YWluaW5nIHRoZSBiYXNlIDU4IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdW5zaWduZWQgdHJhbnNhY3Rpb24uXG4gICAqL1xuICBtaW50ID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBhbW91bnQ6IG51bWJlciB8IEJOLFxuICAgIGFzc2V0SUQ6IEJ1ZmZlciB8IHN0cmluZyxcbiAgICB0bzogc3RyaW5nLFxuICAgIG1pbnRlcnM6IHN0cmluZ1tdXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgbGV0IGFzc2V0OiBzdHJpbmdcbiAgICBsZXQgYW1udDogQk5cbiAgICBpZiAodHlwZW9mIGFzc2V0SUQgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGFzc2V0ID0gYmludG9vbHMuY2I1OEVuY29kZShhc3NldElEKVxuICAgIH0gZWxzZSB7XG4gICAgICBhc3NldCA9IGFzc2V0SURcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhbW91bnQgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgIGFtbnQgPSBuZXcgQk4oYW1vdW50KVxuICAgIH0gZWxzZSB7XG4gICAgICBhbW50ID0gYW1vdW50XG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczogTWludFBhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lOiB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcbiAgICAgIGFtb3VudDogYW1udCxcbiAgICAgIGFzc2V0SUQ6IGFzc2V0LFxuICAgICAgdG8sXG4gICAgICBtaW50ZXJzXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJheHZtLm1pbnRcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICB9XG5cbiAgLyoqXG4gICAqIE1pbnQgbm9uLWZ1bmdpYmxlIHRva2VucyB3aGljaCB3ZXJlIGNyZWF0ZWQgd2l0aCBBWFZNQVBJLmNyZWF0ZU5GVEFzc2V0XG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlciBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZSAoaW4gJEFYQykgZm9yIGFzc2V0IGNyZWF0aW9uXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgZm9yIHRoZSB1c2VyIHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIChpbiAkQVhDKSBmb3IgYXNzZXQgY3JlYXRpb25cbiAgICogQHBhcmFtIGZyb20gT3B0aW9uYWwuIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBtYW5hZ2VkIGJ5IHRoZSBub2RlJ3Mga2V5c3RvcmUgZm9yIHRoaXMgYmxvY2tjaGFpbiB3aGljaCB3aWxsIGZ1bmQgdGhpcyB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gY2hhbmdlQWRkciBPcHRpb25hbC4gQW4gYWRkcmVzcyB0byBzZW5kIHRoZSBjaGFuZ2VcbiAgICogQHBhcmFtIGFzc2V0SUQgVGhlIGFzc2V0IGlkIHdoaWNoIGlzIGJlaW5nIHNlbnRcbiAgICogQHBhcmFtIHRvIEFkZHJlc3Mgb24gQXNzZXRDaGFpbiBvZiB0aGUgYWNjb3VudCB0byB3aGljaCB0aGlzIE5GVCBpcyBiZWluZyBzZW50XG4gICAqIEBwYXJhbSBlbmNvZGluZyBPcHRpb25hbC4gIGlzIHRoZSBlbmNvZGluZyBmb3JtYXQgdG8gdXNlIGZvciB0aGUgcGF5bG9hZCBhcmd1bWVudC4gQ2FuIGJlIGVpdGhlciBcImNiNThcIiBvciBcImhleFwiLiBEZWZhdWx0cyB0byBcImhleFwiLlxuICAgKlxuICAgKiBAcmV0dXJucyBJRCBvZiB0aGUgdHJhbnNhY3Rpb25cbiAgICovXG4gIG1pbnRORlQgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIGZyb206IHN0cmluZ1tdIHwgQnVmZmVyW10gPSB1bmRlZmluZWQsXG4gICAgY2hhbmdlQWRkcjogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIHBheWxvYWQ6IHN0cmluZyxcbiAgICBhc3NldElEOiBzdHJpbmcgfCBCdWZmZXIsXG4gICAgdG86IHN0cmluZyxcbiAgICBlbmNvZGluZzogc3RyaW5nID0gXCJoZXhcIlxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGxldCBhc3NldDogc3RyaW5nXG5cbiAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKHRvKSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXCJFcnJvciAtIEFYVk1BUEkubWludE5GVDogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgYXNzZXRJRCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgYXNzZXQgPSBiaW50b29scy5jYjU4RW5jb2RlKGFzc2V0SUQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2V0ID0gYXNzZXRJRFxuICAgIH1cblxuICAgIGNvbnN0IHBhcmFtczogTWludE5GVFBhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBhc3NldElEOiBhc3NldCxcbiAgICAgIHBheWxvYWQsXG4gICAgICB0byxcbiAgICAgIGVuY29kaW5nXG4gICAgfVxuXG4gICAgY29uc3QgY2FsbGVyOiBzdHJpbmcgPSBcIm1pbnRORlRcIlxuICAgIGZyb20gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tLCBjYWxsZXIpXG4gICAgaWYgKHR5cGVvZiBmcm9tICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXNbXCJmcm9tXCJdID0gZnJvbVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgY2hhbmdlQWRkciAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhjaGFuZ2VBZGRyKSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFwiRXJyb3IgLSBBWFZNQVBJLm1pbnRORlQ6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIilcbiAgICAgIH1cbiAgICAgIHBhcmFtc1tcImNoYW5nZUFkZHJcIl0gPSBjaGFuZ2VBZGRyXG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF4dm0ubWludE5GVFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gIH1cblxuICAvKipcbiAgICogU2VuZCBORlQgZnJvbSBvbmUgYWNjb3VudCB0byBhbm90aGVyIG9uIEFzc2V0Q2hhaW5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VyIHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIChpbiAkQVhDKSBmb3IgYXNzZXQgY3JlYXRpb25cbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBmb3IgdGhlIHVzZXIgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUgKGluICRBWEMpIGZvciBhc3NldCBjcmVhdGlvblxuICAgKiBAcGFyYW0gZnJvbSBPcHRpb25hbC4gQW4gYXJyYXkgb2YgYWRkcmVzc2VzIG1hbmFnZWQgYnkgdGhlIG5vZGUncyBrZXlzdG9yZSBmb3IgdGhpcyBibG9ja2NoYWluIHdoaWNoIHdpbGwgZnVuZCB0aGlzIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyIE9wdGlvbmFsLiBBbiBhZGRyZXNzIHRvIHNlbmQgdGhlIGNoYW5nZVxuICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgYXNzZXQgaWQgd2hpY2ggaXMgYmVpbmcgc2VudFxuICAgKiBAcGFyYW0gZ3JvdXBJRCBUaGUgZ3JvdXAgdGhpcyBORlQgaXMgaXNzdWVkIHRvLlxuICAgKiBAcGFyYW0gdG8gQWRkcmVzcyBvbiBBc3NldENoYWluIG9mIHRoZSBhY2NvdW50IHRvIHdoaWNoIHRoaXMgTkZUIGlzIGJlaW5nIHNlbnRcbiAgICpcbiAgICogQHJldHVybnMgSUQgb2YgdGhlIHRyYW5zYWN0aW9uXG4gICAqL1xuICBzZW5kTkZUID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBmcm9tOiBzdHJpbmdbXSB8IEJ1ZmZlcltdID0gdW5kZWZpbmVkLFxuICAgIGNoYW5nZUFkZHI6IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBhc3NldElEOiBzdHJpbmcgfCBCdWZmZXIsXG4gICAgZ3JvdXBJRDogbnVtYmVyLFxuICAgIHRvOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBsZXQgYXNzZXQ6IHN0cmluZ1xuXG4gICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyh0bykgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFwiRXJyb3IgLSBBWFZNQVBJLnNlbmRORlQ6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGFzc2V0SUQgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGFzc2V0ID0gYmludG9vbHMuY2I1OEVuY29kZShhc3NldElEKVxuICAgIH0gZWxzZSB7XG4gICAgICBhc3NldCA9IGFzc2V0SURcbiAgICB9XG5cbiAgICBjb25zdCBwYXJhbXM6IFNlbmRORlRQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgYXNzZXRJRDogYXNzZXQsXG4gICAgICBncm91cElELFxuICAgICAgdG9cbiAgICB9XG5cbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwic2VuZE5GVFwiXG4gICAgZnJvbSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb20sIGNhbGxlcilcbiAgICBpZiAodHlwZW9mIGZyb20gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtc1tcImZyb21cIl0gPSBmcm9tXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjaGFuZ2VBZGRyICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGNoYW5nZUFkZHIpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXCJFcnJvciAtIEFYVk1BUEkuc2VuZE5GVDogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKVxuICAgICAgfVxuICAgICAgcGFyYW1zW1wiY2hhbmdlQWRkclwiXSA9IGNoYW5nZUFkZHJcbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXh2bS5zZW5kTkZUXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHBvcnRzIHRoZSBwcml2YXRlIGtleSBmb3IgYW4gYWRkcmVzcy5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBuYW1lIG9mIHRoZSB1c2VyIHdpdGggdGhlIHByaXZhdGUga2V5XG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgdXNlZCB0byBkZWNyeXB0IHRoZSBwcml2YXRlIGtleVxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyB3aG9zZSBwcml2YXRlIGtleSBzaG91bGQgYmUgZXhwb3J0ZWRcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSB3aXRoIHRoZSBkZWNyeXB0ZWQgcHJpdmF0ZSBrZXkgYXMgc3RvcmUgaW4gdGhlIGRhdGFiYXNlXG4gICAqL1xuICBleHBvcnRLZXkgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIGFkZHJlc3M6IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3MoYWRkcmVzcykgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFwiRXJyb3IgLSBBWFZNQVBJLmV4cG9ydEtleTogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKVxuICAgIH1cbiAgICBjb25zdCBwYXJhbXM6IEV4cG9ydEtleVBhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBhZGRyZXNzXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJheHZtLmV4cG9ydEtleVwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5wcml2YXRlS2V5XG4gIH1cblxuICAvKipcbiAgICogSW1wb3J0cyBhIHByaXZhdGUga2V5IGludG8gdGhlIG5vZGUncyBrZXlzdG9yZSB1bmRlciBhbiB1c2VyIGFuZCBmb3IgYSBibG9ja2NoYWluLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIG5hbWUgb2YgdGhlIHVzZXIgdG8gc3RvcmUgdGhlIHByaXZhdGUga2V5XG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgdGhhdCB1bmxvY2tzIHRoZSB1c2VyXG4gICAqIEBwYXJhbSBwcml2YXRlS2V5IEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgcHJpdmF0ZSBrZXkgaW4gdGhlIHZtJ3MgZm9ybWF0XG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBhZGRyZXNzIGZvciB0aGUgaW1wb3J0ZWQgcHJpdmF0ZSBrZXkuXG4gICAqL1xuICBpbXBvcnRLZXkgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIHByaXZhdGVLZXk6IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogSW1wb3J0S2V5UGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIHByaXZhdGVLZXlcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF4dm0uaW1wb3J0S2V5XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmFkZHJlc3NcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIEFOVCAoQXhpYSBOYXRpdmUgVG9rZW4pIGFzc2V0cyBpbmNsdWRpbmcgQVhDIGZyb20gdGhlIEFzc2V0Q2hhaW4gdG8gYW4gYWNjb3VudCBvbiB0aGUgQ29yZUNoYWluIG9yIEFwcENoYWluLlxuICAgKlxuICAgKiBBZnRlciBjYWxsaW5nIHRoaXMgbWV0aG9kLCB5b3UgbXVzdCBjYWxsIHRoZSBDb3JlQ2hhaW4ncyBgaW1wb3J0YCBvciB0aGUgQXBwQ2hhaW7igJlzIGBpbXBvcnRgIG1ldGhvZCB0byBjb21wbGV0ZSB0aGUgdHJhbnNmZXIuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBDb3JlQ2hhaW4gb3IgQXBwQ2hhaW4gYWNjb3VudCBzcGVjaWZpZWQgaW4gYHRvYFxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSB0byBUaGUgYWNjb3VudCBvbiB0aGUgQ29yZUNoYWluIG9yIEFwcENoYWluIHRvIHNlbmQgdGhlIGFzc2V0IHRvLlxuICAgKiBAcGFyYW0gYW1vdW50IEFtb3VudCBvZiBhc3NldCB0byBleHBvcnQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgYXNzZXQgaWQgd2hpY2ggaXMgYmVpbmcgc2VudFxuICAgKlxuICAgKiBAcmV0dXJucyBTdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB0cmFuc2FjdGlvbiBpZFxuICAgKi9cbiAgZXhwb3J0ID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICB0bzogc3RyaW5nLFxuICAgIGFtb3VudDogQk4sXG4gICAgYXNzZXRJRDogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBFeHBvcnRQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgdG8sXG4gICAgICBhbW91bnQ6IGFtb3VudCxcbiAgICAgIGFzc2V0SURcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF4dm0uZXhwb3J0XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIEFOVCAoQXhpYSBOYXRpdmUgVG9rZW4pIGFzc2V0cyBpbmNsdWRpbmcgQVhDIGZyb20gYW4gYWNjb3VudCBvbiB0aGUgQ29yZUNoYWluIG9yIEFwcENoYWluIHRvIGFuIGFkZHJlc3Mgb24gdGhlIEFzc2V0Q2hhaW4uIFRoaXMgdHJhbnNhY3Rpb25cbiAgICogbXVzdCBiZSBzaWduZWQgd2l0aCB0aGUga2V5IG9mIHRoZSBhY2NvdW50IHRoYXQgdGhlIGFzc2V0IGlzIHNlbnQgZnJvbSBhbmQgd2hpY2ggcGF5c1xuICAgKiB0aGUgdHJhbnNhY3Rpb24gZmVlLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgYWNjb3VudCBzcGVjaWZpZWQgaW4gYHRvYFxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSB0byBUaGUgYWRkcmVzcyBvZiB0aGUgYWNjb3VudCB0aGUgYXNzZXQgaXMgc2VudCB0by5cbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIFRoZSBjaGFpbklEIHdoZXJlIHRoZSBmdW5kcyBhcmUgY29taW5nIGZyb20uIEV4OiBcIkNcIlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIHN0cmluZyBmb3IgdGhlIHRyYW5zYWN0aW9uLCB3aGljaCBzaG91bGQgYmUgc2VudCB0byB0aGUgbmV0d29ya1xuICAgKiBieSBjYWxsaW5nIGlzc3VlVHguXG4gICAqL1xuICBpbXBvcnQgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIHRvOiBzdHJpbmcsXG4gICAgc291cmNlQ2hhaW46IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogSW1wb3J0UGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIHRvLFxuICAgICAgc291cmNlQ2hhaW5cbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF4dm0uaW1wb3J0XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0cyBhbGwgdGhlIGFkZHJlc3NlcyB1bmRlciBhIHVzZXIuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlciB0byBsaXN0IGFkZHJlc3Nlc1xuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSB1c2VyIHRvIGxpc3QgdGhlIGFkZHJlc3Nlc1xuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIG9mIGFuIGFycmF5IG9mIGFkZHJlc3Mgc3RyaW5ncyBpbiB0aGUgZm9ybWF0IHNwZWNpZmllZCBieSB0aGUgYmxvY2tjaGFpbi5cbiAgICovXG4gIGxpc3RBZGRyZXNzZXMgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nW10+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IExpc3RBZGRyZXNzZXNQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJheHZtLmxpc3RBZGRyZXNzZXNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzc2VzXG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGFsbCBhc3NldHMgZm9yIGFuIGFkZHJlc3Mgb24gYSBzZXJ2ZXIgYW5kIHRoZWlyIGFzc29jaWF0ZWQgYmFsYW5jZXMuXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIHRvIGdldCBhIGxpc3Qgb2YgYXNzZXRzXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2Ugb2YgYW4gb2JqZWN0IG1hcHBpbmcgYXNzZXRJRCBzdHJpbmdzIHdpdGgge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gYmFsYW5jZSBmb3IgdGhlIGFkZHJlc3Mgb24gdGhlIGJsb2NrY2hhaW4uXG4gICAqL1xuICBnZXRBbGxCYWxhbmNlcyA9IGFzeW5jIChhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPG9iamVjdFtdPiA9PiB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzKSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBWFZNQVBJLmdldEFsbEJhbGFuY2VzOiBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0XCJcbiAgICAgIClcbiAgICB9XG4gICAgY29uc3QgcGFyYW1zOiBHZXRBbGxCYWxhbmNlc1BhcmFtcyA9IHtcbiAgICAgIGFkZHJlc3NcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF4dm0uZ2V0QWxsQmFsYW5jZXNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYmFsYW5jZXNcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYW4gYXNzZXRzIG5hbWUgYW5kIHN5bWJvbC5cbiAgICpcbiAgICogQHBhcmFtIGFzc2V0SUQgRWl0aGVyIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYW4gYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgQXNzZXRJRCBvciBpdHMgYWxpYXMuXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIG9iamVjdCB3aXRoIGtleXMgXCJuYW1lXCIgYW5kIFwic3ltYm9sXCIuXG4gICAqL1xuICBnZXRBc3NldERlc2NyaXB0aW9uID0gYXN5bmMgKFxuICAgIGFzc2V0SUQ6IEJ1ZmZlciB8IHN0cmluZ1xuICApOiBQcm9taXNlPEdldEFzc2V0RGVzY3JpcHRpb25SZXNwb25zZT4gPT4ge1xuICAgIGxldCBhc3NldDogc3RyaW5nXG4gICAgaWYgKHR5cGVvZiBhc3NldElEICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICBhc3NldCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoYXNzZXRJRClcbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXQgPSBhc3NldElEXG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczogR2V0QXNzZXREZXNjcmlwdGlvblBhcmFtcyA9IHtcbiAgICAgIGFzc2V0SUQ6IGFzc2V0XG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJheHZtLmdldEFzc2V0RGVzY3JpcHRpb25cIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogcmVzcG9uc2UuZGF0YS5yZXN1bHQubmFtZSxcbiAgICAgIHN5bWJvbDogcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3ltYm9sLFxuICAgICAgYXNzZXRJRDogYmludG9vbHMuY2I1OERlY29kZShyZXNwb25zZS5kYXRhLnJlc3VsdC5hc3NldElEKSxcbiAgICAgIGRlbm9taW5hdGlvbjogcGFyc2VJbnQocmVzcG9uc2UuZGF0YS5yZXN1bHQuZGVub21pbmF0aW9uLCAxMClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdHJhbnNhY3Rpb24gZGF0YSBvZiBhIHByb3ZpZGVkIHRyYW5zYWN0aW9uIElEIGJ5IGNhbGxpbmcgdGhlIG5vZGUncyBgZ2V0VHhgIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIHR4SUQgVGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJhbnNhY3Rpb24gSURcbiAgICogQHBhcmFtIGVuY29kaW5nIHNldHMgdGhlIGZvcm1hdCBvZiB0aGUgcmV0dXJuZWQgdHJhbnNhY3Rpb24uIENhbiBiZSwgXCJjYjU4XCIsIFwiaGV4XCIgb3IgXCJqc29uXCIuIERlZmF1bHRzIHRvIFwiY2I1OFwiLlxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgb3Igb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGJ5dGVzIHJldHJpZXZlZCBmcm9tIHRoZSBub2RlXG4gICAqL1xuICBnZXRUeCA9IGFzeW5jIChcbiAgICB0eElEOiBzdHJpbmcsXG4gICAgZW5jb2Rpbmc6IHN0cmluZyA9IFwiY2I1OFwiXG4gICk6IFByb21pc2U8c3RyaW5nIHwgb2JqZWN0PiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBHZXRUeFBhcmFtcyA9IHtcbiAgICAgIHR4SUQsXG4gICAgICBlbmNvZGluZ1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXh2bS5nZXRUeFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHN0YXR1cyBvZiBhIHByb3ZpZGVkIHRyYW5zYWN0aW9uIElEIGJ5IGNhbGxpbmcgdGhlIG5vZGUncyBgZ2V0VHhTdGF0dXNgIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIHR4SUQgVGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJhbnNhY3Rpb24gSURcbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIGNvbnRhaW5pbmcgdGhlIHN0YXR1cyByZXRyaWV2ZWQgZnJvbSB0aGUgbm9kZVxuICAgKi9cbiAgZ2V0VHhTdGF0dXMgPSBhc3luYyAodHhJRDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldFR4U3RhdHVzUGFyYW1zID0ge1xuICAgICAgdHhJRFxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXh2bS5nZXRUeFN0YXR1c1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdGF0dXNcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIFVUWE9zIHJlbGF0ZWQgdG8gdGhlIGFkZHJlc3NlcyBwcm92aWRlZCBmcm9tIHRoZSBub2RlJ3MgYGdldFVUWE9zYCBtZXRob2QuXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIGNiNTggc3RyaW5ncyBvciBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1zXG4gICAqIEBwYXJhbSBzb3VyY2VDaGFpbiBBIHN0cmluZyBmb3IgdGhlIGNoYWluIHRvIGxvb2sgZm9yIHRoZSBVVFhPJ3MuIERlZmF1bHQgaXMgdG8gdXNlIHRoaXMgY2hhaW4sIGJ1dCBpZiBleHBvcnRlZCBVVFhPcyBleGlzdCBmcm9tIG90aGVyIGNoYWlucywgdGhpcyBjYW4gdXNlZCB0byBwdWxsIHRoZW0gaW5zdGVhZC5cbiAgICogQHBhcmFtIGxpbWl0IE9wdGlvbmFsLiBSZXR1cm5zIGF0IG1vc3QgW2xpbWl0XSBhZGRyZXNzZXMuIElmIFtsaW1pdF0gPT0gMCBvciA+IFttYXhVVFhPc1RvRmV0Y2hdLCBmZXRjaGVzIHVwIHRvIFttYXhVVFhPc1RvRmV0Y2hdLlxuICAgKiBAcGFyYW0gc3RhcnRJbmRleCBPcHRpb25hbC4gW1N0YXJ0SW5kZXhdIGRlZmluZXMgd2hlcmUgdG8gc3RhcnQgZmV0Y2hpbmcgVVRYT3MgKGZvciBwYWdpbmF0aW9uLilcbiAgICogVVRYT3MgZmV0Y2hlZCBhcmUgZnJvbSBhZGRyZXNzZXMgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuIFtTdGFydEluZGV4LkFkZHJlc3NdXG4gICAqIEZvciBhZGRyZXNzIFtTdGFydEluZGV4LkFkZHJlc3NdLCBvbmx5IFVUWE9zIHdpdGggSURzIGdyZWF0ZXIgdGhhbiBbU3RhcnRJbmRleC5VdHhvXSB3aWxsIGJlIHJldHVybmVkLlxuICAgKiBAcGFyYW0gcGVyc2lzdE9wdHMgT3B0aW9ucyBhdmFpbGFibGUgdG8gcGVyc2lzdCB0aGVzZSBVVFhPcyBpbiBsb2NhbCBzdG9yYWdlXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIHBlcnNpc3RPcHRzIGlzIG9wdGlvbmFsIGFuZCBtdXN0IGJlIG9mIHR5cGUgW1tQZXJzaXN0YW5jZU9wdGlvbnNdXVxuICAgKlxuICAgKi9cbiAgZ2V0VVRYT3MgPSBhc3luYyAoXG4gICAgYWRkcmVzc2VzOiBzdHJpbmdbXSB8IHN0cmluZyxcbiAgICBzb3VyY2VDaGFpbjogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIGxpbWl0OiBudW1iZXIgPSAwLFxuICAgIHN0YXJ0SW5kZXg6IHsgYWRkcmVzczogc3RyaW5nOyB1dHhvOiBzdHJpbmcgfSA9IHVuZGVmaW5lZCxcbiAgICBwZXJzaXN0T3B0czogUGVyc2lzdGFuY2VPcHRpb25zID0gdW5kZWZpbmVkXG4gICk6IFByb21pc2U8R2V0VVRYT3NSZXNwb25zZT4gPT4ge1xuICAgIGlmICh0eXBlb2YgYWRkcmVzc2VzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBhZGRyZXNzZXMgPSBbYWRkcmVzc2VzXVxuICAgIH1cblxuICAgIGNvbnN0IHBhcmFtczogR2V0VVRYT3NQYXJhbXMgPSB7XG4gICAgICBhZGRyZXNzZXM6IGFkZHJlc3NlcyxcbiAgICAgIGxpbWl0XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygc3RhcnRJbmRleCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBzdGFydEluZGV4KSB7XG4gICAgICBwYXJhbXMuc3RhcnRJbmRleCA9IHN0YXJ0SW5kZXhcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHNvdXJjZUNoYWluICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuc291cmNlQ2hhaW4gPSBzb3VyY2VDaGFpblxuICAgIH1cblxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJheHZtLmdldFVUWE9zXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgY29uc3QgdXR4b3M6IFVUWE9TZXQgPSBuZXcgVVRYT1NldCgpXG4gICAgbGV0IGRhdGEgPSByZXNwb25zZS5kYXRhLnJlc3VsdC51dHhvc1xuICAgIGlmIChwZXJzaXN0T3B0cyAmJiB0eXBlb2YgcGVyc2lzdE9wdHMgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgIGlmICh0aGlzLmRiLmhhcyhwZXJzaXN0T3B0cy5nZXROYW1lKCkpKSB7XG4gICAgICAgIGNvbnN0IHNlbGZBcnJheTogc3RyaW5nW10gPSB0aGlzLmRiLmdldChwZXJzaXN0T3B0cy5nZXROYW1lKCkpXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNlbGZBcnJheSkpIHtcbiAgICAgICAgICB1dHhvcy5hZGRBcnJheShkYXRhKVxuICAgICAgICAgIGNvbnN0IHV0eG9TZXQ6IFVUWE9TZXQgPSBuZXcgVVRYT1NldCgpXG4gICAgICAgICAgdXR4b1NldC5hZGRBcnJheShzZWxmQXJyYXkpXG4gICAgICAgICAgdXR4b1NldC5tZXJnZUJ5UnVsZSh1dHhvcywgcGVyc2lzdE9wdHMuZ2V0TWVyZ2VSdWxlKCkpXG4gICAgICAgICAgZGF0YSA9IHV0eG9TZXQuZ2V0QWxsVVRYT1N0cmluZ3MoKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmRiLnNldChwZXJzaXN0T3B0cy5nZXROYW1lKCksIGRhdGEsIHBlcnNpc3RPcHRzLmdldE92ZXJ3cml0ZSgpKVxuICAgIH1cbiAgICB1dHhvcy5hZGRBcnJheShkYXRhLCBmYWxzZSlcbiAgICByZXNwb25zZS5kYXRhLnJlc3VsdC51dHhvcyA9IHV0eG9zXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgdHJhbnNhY3Rpb24uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIGFtb3VudCBUaGUgYW1vdW50IG9mIEFzc2V0SUQgdG8gYmUgc3BlbnQgaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uXG4gICAqIEBwYXJhbSBhc3NldElEIFRoZSBhc3NldElEIG9mIHRoZSB2YWx1ZSBiZWluZyBzZW50XG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyBwcm92aWRlZFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBvdXRwdXRzXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIChbW1Vuc2lnbmVkVHhdXSkgd2hpY2ggY29udGFpbnMgYSBbW0Jhc2VUeF1dLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIGhlbHBlciBleGlzdHMgYmVjYXVzZSB0aGUgZW5kcG9pbnQgQVBJIHNob3VsZCBiZSB0aGUgcHJpbWFyeSBwb2ludCBvZiBlbnRyeSBmb3IgbW9zdCBmdW5jdGlvbmFsaXR5LlxuICAgKi9cbiAgYnVpbGRCYXNlVHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBhbW91bnQ6IEJOLFxuICAgIGFzc2V0SUQ6IEJ1ZmZlciB8IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcbiAgICBsb2NrdGltZTogQk4gPSBuZXcgQk4oMCksXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlcjogc3RyaW5nID0gXCJidWlsZEJhc2VUeFwiXG4gICAgY29uc3QgdG86IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkodG9BZGRyZXNzZXMsIGNhbGxlcikubWFwKFxuICAgICAgKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSlcbiAgICApXG4gICAgY29uc3QgZnJvbTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tQWRkcmVzc2VzLCBjYWxsZXIpLm1hcChcbiAgICAgIChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpXG4gICAgKVxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuXG4gICAgaWYgKHR5cGVvZiBhc3NldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBhc3NldElEID0gYmludG9vbHMuY2I1OERlY29kZShhc3NldElEKVxuICAgIH1cblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEQnVmOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxuICAgIGNvbnN0IGZlZTogQk4gPSB0aGlzLmdldFR4RmVlKClcbiAgICBjb25zdCBmZWVBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFYQ0Fzc2V0SUQoKVxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRCYXNlVHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSURCdWYsXG4gICAgICBhbW91bnQsXG4gICAgICBhc3NldElELFxuICAgICAgdG8sXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgZmVlLFxuICAgICAgZmVlQXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mLFxuICAgICAgbG9ja3RpbWUsXG4gICAgICB0aHJlc2hvbGRcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVhWTUFQSS5idWlsZEJhc2VUeDpGYWlsZWQgR29vc2UgRWdnIENoZWNrXCJcbiAgICAgIClcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgTkZUIFRyYW5zZmVyLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0ICBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0byBzZW5kIHRoZSBORlRcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIE5GVCBmcm9tIHRoZSB1dHhvSUQgcHJvdmlkZWRcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXG4gICAqIEBwYXJhbSB1dHhvaWQgQSBiYXNlNTggdXR4b0lEIG9yIGFuIGFycmF5IG9mIGJhc2U1OCB1dHhvSURzIGZvciB0aGUgbmZ0cyB0aGlzIHRyYW5zYWN0aW9uIGlzIHNlbmRpbmdcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBvdXRwdXRzXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIChbW1Vuc2lnbmVkVHhdXSkgd2hpY2ggY29udGFpbnMgYSBbW05GVFRyYW5zZmVyVHhdXS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBoZWxwZXIgZXhpc3RzIGJlY2F1c2UgdGhlIGVuZHBvaW50IEFQSSBzaG91bGQgYmUgdGhlIHByaW1hcnkgcG9pbnQgb2YgZW50cnkgZm9yIG1vc3QgZnVuY3Rpb25hbGl0eS5cbiAgICovXG4gIGJ1aWxkTkZUVHJhbnNmZXJUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIHRvQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBmcm9tQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIHV0eG9pZDogc3RyaW5nIHwgc3RyaW5nW10sXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICAgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApLFxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwiYnVpbGRORlRUcmFuc2ZlclR4XCJcbiAgICBjb25zdCB0bzogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheSh0b0FkZHJlc3NlcywgY2FsbGVyKS5tYXAoXG4gICAgICAoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKVxuICAgIClcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsIGNhbGxlcikubWFwKFxuICAgICAgKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSlcbiAgICApXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXG5cbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG4gICAgY29uc3QgYXhjQXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBWENBc3NldElEKClcblxuICAgIGxldCB1dHhvaWRBcnJheTogc3RyaW5nW10gPSBbXVxuICAgIGlmICh0eXBlb2YgdXR4b2lkID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB1dHhvaWRBcnJheSA9IFt1dHhvaWRdXG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHV0eG9pZCkpIHtcbiAgICAgIHV0eG9pZEFycmF5ID0gdXR4b2lkXG4gICAgfVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZE5GVFRyYW5zZmVyVHgoXG4gICAgICB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCksXG4gICAgICBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKSxcbiAgICAgIHRvLFxuICAgICAgZnJvbSxcbiAgICAgIGNoYW5nZSxcbiAgICAgIHV0eG9pZEFycmF5LFxuICAgICAgdGhpcy5nZXRUeEZlZSgpLFxuICAgICAgYXhjQXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mLFxuICAgICAgbG9ja3RpbWUsXG4gICAgICB0aHJlc2hvbGRcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVhWTUFQSS5idWlsZE5GVFRyYW5zZmVyVHg6RmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiXG4gICAgICApXG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIEltcG9ydCBUeC4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCAgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIG93bmVyQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBpbXBvcnRcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIFRoZSBjaGFpbmlkIGZvciB3aGVyZSB0aGUgaW1wb3J0IGlzIGNvbWluZyBmcm9tXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyBwcm92aWRlZFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBvdXRwdXRzXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIChbW1Vuc2lnbmVkVHhdXSkgd2hpY2ggY29udGFpbnMgYSBbW0ltcG9ydFR4XV0uXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgaGVscGVyIGV4aXN0cyBiZWNhdXNlIHRoZSBlbmRwb2ludCBBUEkgc2hvdWxkIGJlIHRoZSBwcmltYXJ5IHBvaW50IG9mIGVudHJ5IGZvciBtb3N0IGZ1bmN0aW9uYWxpdHkuXG4gICAqL1xuICBidWlsZEltcG9ydFR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgb3duZXJBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIHNvdXJjZUNoYWluOiBCdWZmZXIgfCBzdHJpbmcsXG4gICAgdG9BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGZyb21BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10gPSB1bmRlZmluZWQsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICAgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApLFxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwiYnVpbGRJbXBvcnRUeFwiXG4gICAgY29uc3QgdG86IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkodG9BZGRyZXNzZXMsIGNhbGxlcikubWFwKFxuICAgICAgKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSlcbiAgICApXG4gICAgY29uc3QgZnJvbTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tQWRkcmVzc2VzLCBjYWxsZXIpLm1hcChcbiAgICAgIChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpXG4gICAgKVxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuXG4gICAgbGV0IHNyYXBwQ2hhaW46IHN0cmluZyA9IHVuZGVmaW5lZFxuXG4gICAgaWYgKHR5cGVvZiBzb3VyY2VDaGFpbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhyb3cgbmV3IENoYWluSWRFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFYVk1BUEkuYnVpbGRJbXBvcnRUeDogU291cmNlIENoYWluSUQgaXMgdW5kZWZpbmVkLlwiXG4gICAgICApXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc291cmNlQ2hhaW4gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHNyYXBwQ2hhaW4gPSBzb3VyY2VDaGFpblxuICAgICAgc291cmNlQ2hhaW4gPSBiaW50b29scy5jYjU4RGVjb2RlKHNvdXJjZUNoYWluKVxuICAgIH0gZWxzZSBpZiAoIShzb3VyY2VDaGFpbiBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBWFZNQVBJLmJ1aWxkSW1wb3J0VHg6IEludmFsaWQgZGVzdGluYXRpb25DaGFpbiB0eXBlOiBcIiArXG4gICAgICAgICAgdHlwZW9mIHNvdXJjZUNoYWluXG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgYXRvbWljVVRYT3M6IFVUWE9TZXQgPSAoXG4gICAgICBhd2FpdCB0aGlzLmdldFVUWE9zKG93bmVyQWRkcmVzc2VzLCBzcmFwcENoYWluLCAwLCB1bmRlZmluZWQpXG4gICAgKS51dHhvc1xuICAgIGNvbnN0IGF4Y0Fzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVhDQXNzZXRJRCgpXG4gICAgY29uc3QgYXRvbWljczogVVRYT1tdID0gYXRvbWljVVRYT3MuZ2V0QWxsVVRYT3MoKVxuXG4gICAgaWYgKGF0b21pY3MubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgTm9BdG9taWNVVFhPc0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVhWTUFQSS5idWlsZEltcG9ydFR4OiBObyBhdG9taWMgVVRYT3MgdG8gaW1wb3J0IGZyb20gXCIgK1xuICAgICAgICAgIHNyYXBwQ2hhaW4gK1xuICAgICAgICAgIFwiIHVzaW5nIGFkZHJlc3NlczogXCIgK1xuICAgICAgICAgIG93bmVyQWRkcmVzc2VzLmpvaW4oXCIsIFwiKVxuICAgICAgKVxuICAgIH1cblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRJbXBvcnRUeChcbiAgICAgIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSxcbiAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpLFxuICAgICAgdG8sXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgYXRvbWljcyxcbiAgICAgIHNvdXJjZUNoYWluLFxuICAgICAgdGhpcy5nZXRUeEZlZSgpLFxuICAgICAgYXhjQXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mLFxuICAgICAgbG9ja3RpbWUsXG4gICAgICB0aHJlc2hvbGRcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVhWTUFQSS5idWlsZEltcG9ydFR4OkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIlxuICAgICAgKVxuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCBFeHBvcnQgVHguIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIGFtb3VudCBUaGUgYW1vdW50IGJlaW5nIGV4cG9ydGVkIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGRlc3RpbmF0aW9uQ2hhaW4gVGhlIGNoYWluaWQgZm9yIHdoZXJlIHRoZSBhc3NldHMgd2lsbCBiZSBzZW50LlxuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0byBzZW5kIHRoZSBmdW5kc1xuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3MgcHJvdmlkZWRcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKiBAcGFyYW0gYXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGFzc2V0IHRvIHNlbmQuIERlZmF1bHRzIHRvIEFYQyBhc3NldElELlxuICAgKiBSZWdhcmRsZXNzIG9mIHRoZSBhc3NldCB3aGljaCB5b3VcInJlIGV4cG9ydGluZywgYWxsIGZlZXMgYXJlIHBhaWQgaW4gQVhDLlxuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGFuIFtbRXhwb3J0VHhdXS5cbiAgICovXG4gIGJ1aWxkRXhwb3J0VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBhbW91bnQ6IEJOLFxuICAgIGRlc3RpbmF0aW9uQ2hhaW46IEJ1ZmZlciB8IHN0cmluZyxcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcbiAgICBsb2NrdGltZTogQk4gPSBuZXcgQk4oMCksXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSAxLFxuICAgIGFzc2V0SUQ6IHN0cmluZyA9IHVuZGVmaW5lZFxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCBwcmVmaXhlczogb2JqZWN0ID0ge31cbiAgICB0b0FkZHJlc3Nlcy5tYXAoKGE6IHN0cmluZyk6IHZvaWQgPT4ge1xuICAgICAgcHJlZml4ZXNbYS5zcGxpdChcIi1cIilbMF1dID0gdHJ1ZVxuICAgIH0pXG4gICAgaWYgKE9iamVjdC5rZXlzKHByZWZpeGVzKS5sZW5ndGggIT09IDEpIHtcbiAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBWFZNQVBJLmJ1aWxkRXhwb3J0VHg6IFRvIGFkZHJlc3NlcyBtdXN0IGhhdmUgdGhlIHNhbWUgY2hhaW5JRCBwcmVmaXguXCJcbiAgICAgIClcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGRlc3RpbmF0aW9uQ2hhaW4gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBWFZNQVBJLmJ1aWxkRXhwb3J0VHg6IERlc3RpbmF0aW9uIENoYWluSUQgaXMgdW5kZWZpbmVkLlwiXG4gICAgICApXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVzdGluYXRpb25DaGFpbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgZGVzdGluYXRpb25DaGFpbiA9IGJpbnRvb2xzLmNiNThEZWNvZGUoZGVzdGluYXRpb25DaGFpbikgLy9cbiAgICB9IGVsc2UgaWYgKCEoZGVzdGluYXRpb25DaGFpbiBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBWFZNQVBJLmJ1aWxkRXhwb3J0VHg6IEludmFsaWQgZGVzdGluYXRpb25DaGFpbiB0eXBlOiBcIiArXG4gICAgICAgICAgdHlwZW9mIGRlc3RpbmF0aW9uQ2hhaW5cbiAgICAgIClcbiAgICB9XG4gICAgaWYgKGRlc3RpbmF0aW9uQ2hhaW4ubGVuZ3RoICE9PSAzMikge1xuICAgICAgdGhyb3cgbmV3IENoYWluSWRFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFYVk1BUEkuYnVpbGRFeHBvcnRUeDogRGVzdGluYXRpb24gQ2hhaW5JRCBtdXN0IGJlIDMyIGJ5dGVzIGluIGxlbmd0aC5cIlxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IHRvOiBCdWZmZXJbXSA9IFtdXG4gICAgdG9BZGRyZXNzZXMubWFwKChhOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICAgIHRvLnB1c2goYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuICAgIH0pXG5cbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwiYnVpbGRFeHBvcnRUeFwiXG4gICAgY29uc3QgZnJvbTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tQWRkcmVzc2VzLCBjYWxsZXIpLm1hcChcbiAgICAgIChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpXG4gICAgKVxuXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXG5cbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBjb25zdCBheGNBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFYQ0Fzc2V0SUQoKVxuICAgIGlmICh0eXBlb2YgYXNzZXRJRCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgYXNzZXRJRCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoYXhjQXNzZXRJRClcbiAgICB9XG5cbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRClcbiAgICBjb25zdCBhc3NldElEQnVmOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKGFzc2V0SUQpXG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0VHhGZWUoKVxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRFeHBvcnRUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIGFtb3VudCxcbiAgICAgIGFzc2V0SURCdWYsXG4gICAgICB0byxcbiAgICAgIGZyb20sXG4gICAgICBjaGFuZ2UsXG4gICAgICBkZXN0aW5hdGlvbkNoYWluLFxuICAgICAgZmVlLFxuICAgICAgYXhjQXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mLFxuICAgICAgbG9ja3RpbWUsXG4gICAgICB0aHJlc2hvbGRcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVhWTUFQSS5idWlsZEV4cG9ydFR4OkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIlxuICAgICAgKVxuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIGluaXRpYWxTdGF0ZSBUaGUgW1tJbml0aWFsU3RhdGVzXV0gdGhhdCByZXByZXNlbnQgdGhlIGludGlhbCBzdGF0ZSBvZiBhIGNyZWF0ZWQgYXNzZXRcbiAgICogQHBhcmFtIG5hbWUgU3RyaW5nIGZvciB0aGUgZGVzY3JpcHRpdmUgbmFtZSBvZiB0aGUgYXNzZXRcbiAgICogQHBhcmFtIHN5bWJvbCBTdHJpbmcgZm9yIHRoZSB0aWNrZXIgc3ltYm9sIG9mIHRoZSBhc3NldFxuICAgKiBAcGFyYW0gZGVub21pbmF0aW9uIE51bWJlciBmb3IgdGhlIGRlbm9taW5hdGlvbiB3aGljaCBpcyAxMF5ELiBEIG11c3QgYmUgPj0gMCBhbmQgPD0gMzIuIEV4OiAkMSBBWEMgPSAxMF45ICRuQVhDXG4gICAqIEBwYXJhbSBtaW50T3V0cHV0cyBPcHRpb25hbC4gQXJyYXkgb2YgW1tTRUNQTWludE91dHB1dF1dcyB0byBiZSBpbmNsdWRlZCBpbiB0aGUgdHJhbnNhY3Rpb24uIFRoZXNlIG91dHB1dHMgY2FuIGJlIHNwZW50IHRvIG1pbnQgbW9yZSB0b2tlbnMuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGEgW1tDcmVhdGVBc3NldFR4XV0uXG4gICAqXG4gICAqL1xuICBidWlsZENyZWF0ZUFzc2V0VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBmcm9tQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGluaXRpYWxTdGF0ZXM6IEluaXRpYWxTdGF0ZXMsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHN5bWJvbDogc3RyaW5nLFxuICAgIGRlbm9taW5hdGlvbjogbnVtYmVyLFxuICAgIG1pbnRPdXRwdXRzOiBTRUNQTWludE91dHB1dFtdID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlcjogc3RyaW5nID0gXCJidWlsZENyZWF0ZUFzc2V0VHhcIlxuICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbUFkZHJlc3NlcywgY2FsbGVyKS5tYXAoXG4gICAgICAoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKVxuICAgIClcbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGlmIChzeW1ib2wubGVuZ3RoID4gQVhWTUNvbnN0YW50cy5TWU1CT0xNQVhMRU4pIHtcbiAgICAgIHRocm93IG5ldyBTeW1ib2xFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFYVk1BUEkuYnVpbGRDcmVhdGVBc3NldFR4OiBTeW1ib2xzIG1heSBub3QgZXhjZWVkIGxlbmd0aCBvZiBcIiArXG4gICAgICAgICAgQVhWTUNvbnN0YW50cy5TWU1CT0xNQVhMRU5cbiAgICAgIClcbiAgICB9XG4gICAgaWYgKG5hbWUubGVuZ3RoID4gQVhWTUNvbnN0YW50cy5BU1NFVE5BTUVMRU4pIHtcbiAgICAgIHRocm93IG5ldyBOYW1lRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBWFZNQVBJLmJ1aWxkQ3JlYXRlQXNzZXRUeDogTmFtZXMgbWF5IG5vdCBleGNlZWQgbGVuZ3RoIG9mIFwiICtcbiAgICAgICAgICBBWFZNQ29uc3RhbnRzLkFTU0VUTkFNRUxFTlxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxuICAgIGNvbnN0IGF4Y0Fzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVhDQXNzZXRJRCgpXG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0RGVmYXVsdENyZWF0aW9uVHhGZWUoKVxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRDcmVhdGVBc3NldFR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgZnJvbSxcbiAgICAgIGNoYW5nZSxcbiAgICAgIGluaXRpYWxTdGF0ZXMsXG4gICAgICBuYW1lLFxuICAgICAgc3ltYm9sLFxuICAgICAgZGVub21pbmF0aW9uLFxuICAgICAgbWludE91dHB1dHMsXG4gICAgICBmZWUsXG4gICAgICBheGNBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2ZcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4LCBmZWUpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBWFZNQVBJLmJ1aWxkQ3JlYXRlQXNzZXRUeDpGYWlsZWQgR29vc2UgRWdnIENoZWNrXCJcbiAgICAgIClcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICBidWlsZFNFQ1BNaW50VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBtaW50T3duZXI6IFNFQ1BNaW50T3V0cHV0LFxuICAgIHRyYW5zZmVyT3duZXI6IFNFQ1BUcmFuc2Zlck91dHB1dCxcbiAgICBmcm9tQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIG1pbnRVVFhPSUQ6IHN0cmluZyxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKVxuICApOiBQcm9taXNlPGFueT4gPT4ge1xuICAgIGNvbnN0IGNhbGxlcjogc3RyaW5nID0gXCJidWlsZFNFQ1BNaW50VHhcIlxuICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbUFkZHJlc3NlcywgY2FsbGVyKS5tYXAoXG4gICAgICAoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKVxuICAgIClcbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxuICAgIGNvbnN0IGF4Y0Fzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVhDQXNzZXRJRCgpXG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0TWludFR4RmVlKClcbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkU0VDUE1pbnRUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIG1pbnRPd25lcixcbiAgICAgIHRyYW5zZmVyT3duZXIsXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgbWludFVUWE9JRCxcbiAgICAgIGZlZSxcbiAgICAgIGF4Y0Fzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZlxuICAgIClcbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVhWTUFQSS5idWlsZFNFQ1BNaW50VHg6RmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIG1pbnRlclNldHMgaXMgYSBsaXN0IHdoZXJlIGVhY2ggZWxlbWVudCBzcGVjaWZpZXMgdGhhdCB0aHJlc2hvbGQgb2YgdGhlIGFkZHJlc3NlcyBpbiBtaW50ZXJzIG1heSB0b2dldGhlciBtaW50IG1vcmUgb2YgdGhlIGFzc2V0IGJ5IHNpZ25pbmcgYSBtaW50aW5nIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBuYW1lIFN0cmluZyBmb3IgdGhlIGRlc2NyaXB0aXZlIG5hbWUgb2YgdGhlIGFzc2V0XG4gICAqIEBwYXJhbSBzeW1ib2wgU3RyaW5nIGZvciB0aGUgdGlja2VyIHN5bWJvbCBvZiB0aGUgYXNzZXRcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBtaW50IG91dHB1dFxuICAgKlxuICAgKiBgYGBqc1xuICAgKiBFeGFtcGxlIG1pbnRlclNldHM6XG4gICAqIFtcbiAgICogICAgICB7XG4gICAqICAgICAgICAgIFwibWludGVyc1wiOltcbiAgICogICAgICAgICAgICAgIFwiWC1heGMxZ2hzdGp1a3J0dzg5MzVscnlxdG5oNjQzeGU5YTk0dTN0Yzc1YzdcIlxuICAgKiAgICAgICAgICBdLFxuICAgKiAgICAgICAgICBcInRocmVzaG9sZFwiOiAxXG4gICAqICAgICAgfSxcbiAgICogICAgICB7XG4gICAqICAgICAgICAgIFwibWludGVyc1wiOiBbXG4gICAqICAgICAgICAgICAgICBcIlgtYXhjMXllbGwzZTRubG4wbTM5Y2ZwZGhncXByc2Q4N2praDRxbmFra2x4XCIsXG4gICAqICAgICAgICAgICAgICBcIlgtYXhjMWs0bnIyNmM4MGphcXV6bTkzNjlqNWE0c2htd2NqbjB2bWVtY2p6XCIsXG4gICAqICAgICAgICAgICAgICBcIlgtYXhjMXp0a3pzcmpua24wY2VrNXJ5dmhxc3dkdGNnMjNuaGdlM25ucjVlXCJcbiAgICogICAgICAgICAgXSxcbiAgICogICAgICAgICAgXCJ0aHJlc2hvbGRcIjogMlxuICAgKiAgICAgIH1cbiAgICogXVxuICAgKiBgYGBcbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhIFtbQ3JlYXRlQXNzZXRUeF1dLlxuICAgKlxuICAgKi9cbiAgYnVpbGRDcmVhdGVORlRBc3NldFR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBtaW50ZXJTZXRzOiBNaW50ZXJTZXRbXSxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc3ltYm9sOiBzdHJpbmcsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICAgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlcjogc3RyaW5nID0gXCJidWlsZENyZWF0ZU5GVEFzc2V0VHhcIlxuICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbUFkZHJlc3NlcywgY2FsbGVyKS5tYXAoXG4gICAgICAoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKVxuICAgIClcbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGlmIChuYW1lLmxlbmd0aCA+IEFYVk1Db25zdGFudHMuQVNTRVROQU1FTEVOKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IE5hbWVFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFYVk1BUEkuYnVpbGRDcmVhdGVORlRBc3NldFR4OiBOYW1lcyBtYXkgbm90IGV4Y2VlZCBsZW5ndGggb2YgXCIgK1xuICAgICAgICAgIEFYVk1Db25zdGFudHMuQVNTRVROQU1FTEVOXG4gICAgICApXG4gICAgfVxuICAgIGlmIChzeW1ib2wubGVuZ3RoID4gQVhWTUNvbnN0YW50cy5TWU1CT0xNQVhMRU4pIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgU3ltYm9sRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBWFZNQVBJLmJ1aWxkQ3JlYXRlTkZUQXNzZXRUeDogU3ltYm9scyBtYXkgbm90IGV4Y2VlZCBsZW5ndGggb2YgXCIgK1xuICAgICAgICAgIEFYVk1Db25zdGFudHMuU1lNQk9MTUFYTEVOXG4gICAgICApXG4gICAgfVxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxuICAgIGNvbnN0IGNyZWF0aW9uVHhGZWU6IEJOID0gdGhpcy5nZXRDcmVhdGlvblR4RmVlKClcbiAgICBjb25zdCBheGNBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFYQ0Fzc2V0SUQoKVxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRDcmVhdGVORlRBc3NldFR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgZnJvbSxcbiAgICAgIGNoYW5nZSxcbiAgICAgIG1pbnRlclNldHMsXG4gICAgICBuYW1lLFxuICAgICAgc3ltYm9sLFxuICAgICAgY3JlYXRpb25UeEZlZSxcbiAgICAgIGF4Y0Fzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZixcbiAgICAgIGxvY2t0aW1lXG4gICAgKVxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgsIGNyZWF0aW9uVHhGZWUpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBWFZNQVBJLmJ1aWxkQ3JlYXRlTkZUQXNzZXRUeDpGYWlsZWQgR29vc2UgRWdnIENoZWNrXCJcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gdW5zaWduZWQgdHJhbnNhY3Rpb24uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgIEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBvd25lcnMgRWl0aGVyIGEgc2luZ2xlIG9yIGFuIGFycmF5IG9mIFtbT3V0cHV0T3duZXJzXV0gdG8gc2VuZCB0aGUgbmZ0IG91dHB1dFxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgTkZUIGZyb20gdGhlIHV0eG9JRCBwcm92aWRlZFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIHV0eG9pZCBBIGJhc2U1OCB1dHhvSUQgb3IgYW4gYXJyYXkgb2YgYmFzZTU4IHV0eG9JRHMgZm9yIHRoZSBuZnQgbWludCBvdXRwdXQgdGhpcyB0cmFuc2FjdGlvbiBpcyBzZW5kaW5nXG4gICAqIEBwYXJhbSBncm91cElEIE9wdGlvbmFsLiBUaGUgZ3JvdXAgdGhpcyBORlQgaXMgaXNzdWVkIHRvLlxuICAgKiBAcGFyYW0gcGF5bG9hZCBPcHRpb25hbC4gRGF0YSBmb3IgTkZUIFBheWxvYWQgYXMgZWl0aGVyIGEgW1tQYXlsb2FkQmFzZV1dIG9yIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIChbW1Vuc2lnbmVkVHhdXSkgd2hpY2ggY29udGFpbnMgYW4gW1tPcGVyYXRpb25UeF1dLlxuICAgKlxuICAgKi9cbiAgYnVpbGRDcmVhdGVORlRNaW50VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBvd25lcnM6IE91dHB1dE93bmVyc1tdIHwgT3V0cHV0T3duZXJzLFxuICAgIGZyb21BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgdXR4b2lkOiBzdHJpbmcgfCBzdHJpbmdbXSxcbiAgICBncm91cElEOiBudW1iZXIgPSAwLFxuICAgIHBheWxvYWQ6IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpXG4gICk6IFByb21pc2U8YW55PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyOiBzdHJpbmcgPSBcImJ1aWxkQ3JlYXRlTkZUTWludFR4XCJcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsIGNhbGxlcikubWFwKFxuICAgICAgKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSlcbiAgICApXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXG5cbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBpZiAocGF5bG9hZCBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBwYXlsb2FkID0gcGF5bG9hZC5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHV0eG9pZCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdXR4b2lkID0gW3V0eG9pZF1cbiAgICB9XG5cbiAgICBjb25zdCBheGNBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFYQ0Fzc2V0SUQoKVxuXG4gICAgaWYgKG93bmVycyBpbnN0YW5jZW9mIE91dHB1dE93bmVycykge1xuICAgICAgb3duZXJzID0gW293bmVyc11cbiAgICB9XG5cbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRClcbiAgICBjb25zdCB0eEZlZTogQk4gPSB0aGlzLmdldFR4RmVlKClcbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkQ3JlYXRlTkZUTWludFR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgb3duZXJzLFxuICAgICAgZnJvbSxcbiAgICAgIGNoYW5nZSxcbiAgICAgIHV0eG9pZCxcbiAgICAgIGdyb3VwSUQsXG4gICAgICBwYXlsb2FkLFxuICAgICAgdHhGZWUsXG4gICAgICBheGNBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2ZcbiAgICApXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFYVk1BUEkuYnVpbGRDcmVhdGVORlRNaW50VHg6RmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggdGFrZXMgYW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gYW5kIHNpZ25zIGl0LCByZXR1cm5pbmcgdGhlIHJlc3VsdGluZyBbW1R4XV0uXG4gICAqXG4gICAqIEBwYXJhbSB1dHggVGhlIHVuc2lnbmVkIHRyYW5zYWN0aW9uIG9mIHR5cGUgW1tVbnNpZ25lZFR4XV1cbiAgICpcbiAgICogQHJldHVybnMgQSBzaWduZWQgdHJhbnNhY3Rpb24gb2YgdHlwZSBbW1R4XV1cbiAgICovXG4gIHNpZ25UeCA9ICh1dHg6IFVuc2lnbmVkVHgpOiBUeCA9PiB1dHguc2lnbih0aGlzLmtleWNoYWluKVxuXG4gIC8qKlxuICAgKiBDYWxscyB0aGUgbm9kZSdzIGlzc3VlVHggbWV0aG9kIGZyb20gdGhlIEFQSSBhbmQgcmV0dXJucyB0aGUgcmVzdWx0aW5nIHRyYW5zYWN0aW9uIElEIGFzIGEgc3RyaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gdHggQSBzdHJpbmcsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9LCBvciBbW1R4XV0gcmVwcmVzZW50aW5nIGEgdHJhbnNhY3Rpb25cbiAgICpcbiAgICogQHJldHVybnMgQSBQcm9taXNlIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHRyYW5zYWN0aW9uIElEIG9mIHRoZSBwb3N0ZWQgdHJhbnNhY3Rpb24uXG4gICAqL1xuICBpc3N1ZVR4ID0gYXN5bmMgKHR4OiBzdHJpbmcgfCBCdWZmZXIgfCBUeCk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgbGV0IFRyYW5zYWN0aW9uID0gXCJcIlxuICAgIGlmICh0eXBlb2YgdHggPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIFRyYW5zYWN0aW9uID0gdHhcbiAgICB9IGVsc2UgaWYgKHR4IGluc3RhbmNlb2YgQnVmZmVyKSB7XG4gICAgICBjb25zdCB0eG9iajogVHggPSBuZXcgVHgoKVxuICAgICAgdHhvYmouZnJvbUJ1ZmZlcih0eClcbiAgICAgIFRyYW5zYWN0aW9uID0gdHhvYmoudG9TdHJpbmcoKVxuICAgIH0gZWxzZSBpZiAodHggaW5zdGFuY2VvZiBUeCkge1xuICAgICAgVHJhbnNhY3Rpb24gPSB0eC50b1N0cmluZygpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgVHJhbnNhY3Rpb25FcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFYVk1BUEkuaXNzdWVUeDogcHJvdmlkZWQgdHggaXMgbm90IGV4cGVjdGVkIHR5cGUgb2Ygc3RyaW5nLCBCdWZmZXIsIG9yIFR4XCJcbiAgICAgIClcbiAgICB9XG4gICAgY29uc3QgcGFyYW1zOiBJc3N1ZVR4UGFyYW1zID0ge1xuICAgICAgdHg6IFRyYW5zYWN0aW9uLnRvU3RyaW5nKClcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF4dm0uaXNzdWVUeFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gIH1cblxuICAvKipcbiAgICogQ2FsbHMgdGhlIG5vZGUncyBnZXRBZGRyZXNzVHhzIG1ldGhvZCBmcm9tIHRoZSBBUEkgYW5kIHJldHVybnMgdHJhbnNhY3Rpb25zIGNvcnJlc3BvbmRpbmcgdG8gdGhlIHByb3ZpZGVkIGFkZHJlc3MgYW5kIGFzc2V0SURcbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGFkZHJlc3MgZm9yIHdoaWNoIHdlJ3JlIGZldGNoaW5nIHJlbGF0ZWQgdHJhbnNhY3Rpb25zLlxuICAgKiBAcGFyYW0gY3Vyc29yIFBhZ2UgbnVtYmVyIG9yIG9mZnNldC5cbiAgICogQHBhcmFtIHBhZ2VTaXplICBOdW1iZXIgb2YgaXRlbXMgdG8gcmV0dXJuIHBlciBwYWdlLiBPcHRpb25hbC4gRGVmYXVsdHMgdG8gMTAyNC4gSWYgW3BhZ2VTaXplXSA9PSAwIG9yIFtwYWdlU2l6ZV0gPiBbbWF4UGFnZVNpemVdLCB0aGVuIGl0IGZldGNoZXMgYXQgbWF4IFttYXhQYWdlU2l6ZV0gdHJhbnNhY3Rpb25zXG4gICAqIEBwYXJhbSBhc3NldElEIE9ubHkgcmV0dXJuIHRyYW5zYWN0aW9ucyB0aGF0IGNoYW5nZWQgdGhlIGJhbGFuY2Ugb2YgdGhpcyBhc3NldC4gTXVzdCBiZSBhbiBJRCBvciBhbiBhbGlhcyBmb3IgYW4gYXNzZXQuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBhcnJheSBvZiB0cmFuc2FjdGlvbiBJRHMgYW5kIHBhZ2Ugb2Zmc2V0XG4gICAqL1xuICBnZXRBZGRyZXNzVHhzID0gYXN5bmMgKFxuICAgIGFkZHJlc3M6IHN0cmluZyxcbiAgICBjdXJzb3I6IG51bWJlcixcbiAgICBwYWdlU2l6ZTogbnVtYmVyIHwgdW5kZWZpbmVkLFxuICAgIGFzc2V0SUQ6IHN0cmluZyB8IEJ1ZmZlclxuICApOiBQcm9taXNlPEdldEFkZHJlc3NUeHNSZXNwb25zZT4gPT4ge1xuICAgIGxldCBhc3NldDogc3RyaW5nXG4gICAgbGV0IHBhZ2VTaXplTnVtOiBudW1iZXJcblxuICAgIGlmICh0eXBlb2YgYXNzZXRJRCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgYXNzZXQgPSBiaW50b29scy5jYjU4RW5jb2RlKGFzc2V0SUQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2V0ID0gYXNzZXRJRFxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgcGFnZVNpemUgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgIHBhZ2VTaXplTnVtID0gMFxuICAgIH0gZWxzZSB7XG4gICAgICBwYWdlU2l6ZU51bSA9IHBhZ2VTaXplXG4gICAgfVxuXG4gICAgY29uc3QgcGFyYW1zOiBHZXRBZGRyZXNzVHhzUGFyYW1zID0ge1xuICAgICAgYWRkcmVzcyxcbiAgICAgIGN1cnNvcixcbiAgICAgIHBhZ2VTaXplOiBwYWdlU2l6ZU51bSxcbiAgICAgIGFzc2V0SUQ6IGFzc2V0XG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF4dm0uZ2V0QWRkcmVzc1R4c1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmRzIGFuIGFtb3VudCBvZiBhc3NldElEIHRvIHRoZSBzcGVjaWZpZWQgYWRkcmVzcyBmcm9tIGEgbGlzdCBvZiBvd25lZCBvZiBhZGRyZXNzZXMuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlciB0aGF0IG93bnMgdGhlIHByaXZhdGUga2V5cyBhc3NvY2lhdGVkIHdpdGggdGhlIGBmcm9tYCBhZGRyZXNzZXNcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCB1bmxvY2tpbmcgdGhlIHVzZXJcbiAgICogQHBhcmFtIGFzc2V0SUQgVGhlIGFzc2V0SUQgb2YgdGhlIGFzc2V0IHRvIHNlbmRcbiAgICogQHBhcmFtIGFtb3VudCBUaGUgYW1vdW50IG9mIHRoZSBhc3NldCB0byBiZSBzZW50XG4gICAqIEBwYXJhbSB0byBUaGUgYWRkcmVzcyBvZiB0aGUgcmVjaXBpZW50XG4gICAqIEBwYXJhbSBmcm9tIE9wdGlvbmFsLiBBbiBhcnJheSBvZiBhZGRyZXNzZXMgbWFuYWdlZCBieSB0aGUgbm9kZSdzIGtleXN0b3JlIGZvciB0aGlzIGJsb2NrY2hhaW4gd2hpY2ggd2lsbCBmdW5kIHRoaXMgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIGNoYW5nZUFkZHIgT3B0aW9uYWwuIEFuIGFkZHJlc3MgdG8gc2VuZCB0aGUgY2hhbmdlXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsLiBDQjU4IEJ1ZmZlciBvciBTdHJpbmcgd2hpY2ggY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgdGhlIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHRyYW5zYWN0aW9uJ3MgSUQuXG4gICAqL1xuICBzZW5kID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBhc3NldElEOiBzdHJpbmcgfCBCdWZmZXIsXG4gICAgYW1vdW50OiBudW1iZXIgfCBCTixcbiAgICB0bzogc3RyaW5nLFxuICAgIGZyb206IHN0cmluZ1tdIHwgQnVmZmVyW10gPSB1bmRlZmluZWQsXG4gICAgY2hhbmdlQWRkcjogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IHN0cmluZyB8IEJ1ZmZlciA9IHVuZGVmaW5lZFxuICApOiBQcm9taXNlPFNlbmRSZXNwb25zZT4gPT4ge1xuICAgIGxldCBhc3NldDogc3RyaW5nXG4gICAgbGV0IGFtbnQ6IEJOXG5cbiAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKHRvKSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXCJFcnJvciAtIEFYVk1BUEkuc2VuZDogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgYXNzZXRJRCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgYXNzZXQgPSBiaW50b29scy5jYjU4RW5jb2RlKGFzc2V0SUQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2V0ID0gYXNzZXRJRFxuICAgIH1cbiAgICBpZiAodHlwZW9mIGFtb3VudCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgYW1udCA9IG5ldyBCTihhbW91bnQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFtbnQgPSBhbW91bnRcbiAgICB9XG5cbiAgICBjb25zdCBwYXJhbXM6IFNlbmRQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZTogdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZDogcGFzc3dvcmQsXG4gICAgICBhc3NldElEOiBhc3NldCxcbiAgICAgIGFtb3VudDogYW1udC50b1N0cmluZygxMCksXG4gICAgICB0bzogdG9cbiAgICB9XG5cbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwic2VuZFwiXG4gICAgZnJvbSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb20sIGNhbGxlcilcbiAgICBpZiAodHlwZW9mIGZyb20gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtc1tcImZyb21cIl0gPSBmcm9tXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjaGFuZ2VBZGRyICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGNoYW5nZUFkZHIpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXCJFcnJvciAtIEFYVk1BUEkuc2VuZDogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKVxuICAgICAgfVxuICAgICAgcGFyYW1zW1wiY2hhbmdlQWRkclwiXSA9IGNoYW5nZUFkZHJcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG1lbW8gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlmICh0eXBlb2YgbWVtbyAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICBwYXJhbXNbXCJtZW1vXCJdID0gYmludG9vbHMuY2I1OEVuY29kZShtZW1vKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFyYW1zW1wibWVtb1wiXSA9IG1lbW9cbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF4dm0uc2VuZFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmRzIGFuIGFtb3VudCBvZiBhc3NldElEIHRvIGFuIGFycmF5IG9mIHNwZWNpZmllZCBhZGRyZXNzZXMgZnJvbSBhIGxpc3Qgb2Ygb3duZWQgb2YgYWRkcmVzc2VzLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXIgdGhhdCBvd25zIHRoZSBwcml2YXRlIGtleXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBgZnJvbWAgYWRkcmVzc2VzXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgdW5sb2NraW5nIHRoZSB1c2VyXG4gICAqIEBwYXJhbSBzZW5kT3V0cHV0cyBUaGUgYXJyYXkgb2YgU2VuZE91dHB1dHMuIEEgU2VuZE91dHB1dCBpcyBhbiBvYmplY3QgbGl0ZXJhbCB3aGljaCBjb250YWlucyBhbiBhc3NldElELCBhbW91bnQsIGFuZCB0by5cbiAgICogQHBhcmFtIGZyb20gT3B0aW9uYWwuIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBtYW5hZ2VkIGJ5IHRoZSBub2RlJ3Mga2V5c3RvcmUgZm9yIHRoaXMgYmxvY2tjaGFpbiB3aGljaCB3aWxsIGZ1bmQgdGhpcyB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gY2hhbmdlQWRkciBPcHRpb25hbC4gQW4gYWRkcmVzcyB0byBzZW5kIHRoZSBjaGFuZ2VcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwuIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciB0aGUgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdHJhbnNhY3Rpb25cInMgSUQuXG4gICAqL1xuICBzZW5kTXVsdGlwbGUgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIHNlbmRPdXRwdXRzOiB7XG4gICAgICBhc3NldElEOiBzdHJpbmcgfCBCdWZmZXJcbiAgICAgIGFtb3VudDogbnVtYmVyIHwgQk5cbiAgICAgIHRvOiBzdHJpbmdcbiAgICB9W10sXG4gICAgZnJvbTogc3RyaW5nW10gfCBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcbiAgICBjaGFuZ2VBZGRyOiBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgbWVtbzogc3RyaW5nIHwgQnVmZmVyID0gdW5kZWZpbmVkXG4gICk6IFByb21pc2U8U2VuZE11bHRpcGxlUmVzcG9uc2U+ID0+IHtcbiAgICBsZXQgYXNzZXQ6IHN0cmluZ1xuICAgIGxldCBhbW50OiBCTlxuICAgIGNvbnN0IHNPdXRwdXRzOiBTT3V0cHV0c1BhcmFtc1tdID0gW11cblxuICAgIHNlbmRPdXRwdXRzLmZvckVhY2goXG4gICAgICAob3V0cHV0OiB7XG4gICAgICAgIGFzc2V0SUQ6IHN0cmluZyB8IEJ1ZmZlclxuICAgICAgICBhbW91bnQ6IG51bWJlciB8IEJOXG4gICAgICAgIHRvOiBzdHJpbmdcbiAgICAgIH0pID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhvdXRwdXQudG8pID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxuICAgICAgICAgICAgXCJFcnJvciAtIEFYVk1BUEkuc2VuZE11bHRpcGxlOiBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0XCJcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvdXRwdXQuYXNzZXRJRCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIGFzc2V0ID0gYmludG9vbHMuY2I1OEVuY29kZShvdXRwdXQuYXNzZXRJRClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhc3NldCA9IG91dHB1dC5hc3NldElEXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvdXRwdXQuYW1vdW50ID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgYW1udCA9IG5ldyBCTihvdXRwdXQuYW1vdW50KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFtbnQgPSBvdXRwdXQuYW1vdW50XG4gICAgICAgIH1cbiAgICAgICAgc091dHB1dHMucHVzaCh7XG4gICAgICAgICAgdG86IG91dHB1dC50byxcbiAgICAgICAgICBhc3NldElEOiBhc3NldCxcbiAgICAgICAgICBhbW91bnQ6IGFtbnQudG9TdHJpbmcoMTApXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgKVxuXG4gICAgY29uc3QgcGFyYW1zOiBTZW5kTXVsdGlwbGVQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZTogdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZDogcGFzc3dvcmQsXG4gICAgICBvdXRwdXRzOiBzT3V0cHV0c1xuICAgIH1cblxuICAgIGNvbnN0IGNhbGxlcjogc3RyaW5nID0gXCJzZW5kXCJcbiAgICBmcm9tID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbSwgY2FsbGVyKVxuICAgIGlmICh0eXBlb2YgZnJvbSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLmZyb20gPSBmcm9tXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjaGFuZ2VBZGRyICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGNoYW5nZUFkZHIpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXCJFcnJvciAtIEFYVk1BUEkuc2VuZDogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKVxuICAgICAgfVxuICAgICAgcGFyYW1zLmNoYW5nZUFkZHIgPSBjaGFuZ2VBZGRyXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBtZW1vICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpZiAodHlwZW9mIG1lbW8gIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcGFyYW1zLm1lbW8gPSBiaW50b29scy5jYjU4RW5jb2RlKG1lbW8pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJhbXMubWVtbyA9IG1lbW9cbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF4dm0uc2VuZE11bHRpcGxlXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogR2l2ZW4gYSBKU09OIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgVmlydHVhbCBNYWNoaW5l4oCZcyBnZW5lc2lzIHN0YXRlLCBjcmVhdGUgdGhlIGJ5dGUgcmVwcmVzZW50YXRpb24gb2YgdGhhdCBzdGF0ZS5cbiAgICpcbiAgICogQHBhcmFtIGdlbmVzaXNEYXRhIFRoZSBibG9ja2NoYWluJ3MgZ2VuZXNpcyBkYXRhIG9iamVjdFxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIG9mIGEgc3RyaW5nIG9mIGJ5dGVzXG4gICAqL1xuICBidWlsZEdlbmVzaXMgPSBhc3luYyAoZ2VuZXNpc0RhdGE6IG9iamVjdCk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBCdWlsZEdlbmVzaXNQYXJhbXMgPSB7XG4gICAgICBnZW5lc2lzRGF0YVxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXh2bS5idWlsZEdlbmVzaXNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYnl0ZXNcbiAgfVxuXG4gIC8qKlxuICAgKiBAaWdub3JlXG4gICAqL1xuICBwcm90ZWN0ZWQgX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgIGFkZHJlc3Nlczogc3RyaW5nW10gfCBCdWZmZXJbXSxcbiAgICBjYWxsZXI6IHN0cmluZ1xuICApOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgYWRkcnM6IHN0cmluZ1tdID0gW11cbiAgICBjb25zdCBjaGFpbklEOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXG4gICAgICA/IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcbiAgICAgIDogdGhpcy5nZXRCbG9ja2NoYWluSUQoKVxuICAgIGlmIChhZGRyZXNzZXMgJiYgYWRkcmVzc2VzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBhZGRyZXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhZGRyZXNzZXNbYCR7aX1gXSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzZXNbYCR7aX1gXSBhcyBzdHJpbmcpID09PVxuICAgICAgICAgICAgXCJ1bmRlZmluZWRcIlxuICAgICAgICAgICkge1xuICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXG4gICAgICAgICAgICAgIFwiRXJyb3IgLSBBWFZNQVBJLiR7Y2FsbGVyfTogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiXG4gICAgICAgICAgICApXG4gICAgICAgICAgfVxuICAgICAgICAgIGFkZHJzLnB1c2goYWRkcmVzc2VzW2Ake2l9YF0gYXMgc3RyaW5nKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHR5cGU6IFNlcmlhbGl6ZWRUeXBlID0gXCJiZWNoMzJcIlxuICAgICAgICAgIGFkZHJzLnB1c2goXG4gICAgICAgICAgICBzZXJpYWxpemF0aW9uLmJ1ZmZlclRvVHlwZShcbiAgICAgICAgICAgICAgYWRkcmVzc2VzW2Ake2l9YF0gYXMgQnVmZmVyLFxuICAgICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgICB0aGlzLmNvcmUuZ2V0SFJQKCksXG4gICAgICAgICAgICAgIGNoYWluSURcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFkZHJzXG4gIH1cblxuICAvKipcbiAgICogVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGluc3RhbnRpYXRlZCBkaXJlY3RseS4gSW5zdGVhZCB1c2UgdGhlIFtbQXhpYS5hZGRBUGAke0l9YF1dIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIGNvcmUgQSByZWZlcmVuY2UgdG8gdGhlIEF4aWEgY2xhc3NcbiAgICogQHBhcmFtIGJhc2VVUkwgRGVmYXVsdHMgdG8gdGhlIHN0cmluZyBcIi9leHQvYmMvWFwiIGFzIHRoZSBwYXRoIHRvIGJsb2NrY2hhaW4ncyBiYXNlVVJMXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgVGhlIEJsb2NrY2hhaW5cInMgSUQuIERlZmF1bHRzIHRvIGFuIGVtcHR5IHN0cmluZzogXCJcIlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgY29yZTogQXhpYUNvcmUsXG4gICAgYmFzZVVSTDogc3RyaW5nID0gXCIvZXh0L2JjL1hcIixcbiAgICBibG9ja2NoYWluSUQ6IHN0cmluZyA9IFwiXCJcbiAgKSB7XG4gICAgc3VwZXIoY29yZSwgYmFzZVVSTClcbiAgICB0aGlzLmJsb2NrY2hhaW5JRCA9IGJsb2NrY2hhaW5JRFxuICAgIGNvbnN0IG5ldElEOiBudW1iZXIgPSBjb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgaWYgKFxuICAgICAgbmV0SUQgaW4gRGVmYXVsdHMubmV0d29yayAmJlxuICAgICAgYmxvY2tjaGFpbklEIGluIERlZmF1bHRzLm5ldHdvcmtbYCR7bmV0SUR9YF1cbiAgICApIHtcbiAgICAgIGNvbnN0IHsgYWxpYXMgfSA9IERlZmF1bHRzLm5ldHdvcmtbYCR7bmV0SUR9YF1bYCR7YmxvY2tjaGFpbklEfWBdXG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgYWxpYXMpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMua2V5Y2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5jb3JlLmdldEhSUCgpLCBibG9ja2NoYWluSUQpXG4gICAgfVxuICB9XG59XG4iXX0=