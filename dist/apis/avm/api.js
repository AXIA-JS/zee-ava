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
exports.AVMAPI = void 0;
/**
 * @packageDocumentation
 * @module API-AVM
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
 * Class for interacting with a node endpoint that is using the AVM.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Axia.addAPI]] function to register this interface with Axia.
 */
class AVMAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Axia.addAP`${I}`]] method.
     *
     * @param core A reference to the Axia class
     * @param baseURL Defaults to the string "/ext/bc/Swap" as the path to blockchain's baseURL
     * @param blockchainID The Blockchain"s ID. Defaults to an empty string: ""
     */
    constructor(core, baseURL = "/ext/bc/Swap", blockchainID = "") {
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
                this.blockchainID = constants_2.Defaults.network[`${netid}`].Swap.blockchainID; //default to SwapChain
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
            return bintools.parseAddress(addr, blockchainID, alias, constants_1.AVMConstants.ADDRESSLENGTH);
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
                ? new bn_js_1.default(constants_2.Defaults.network[this.core.getNetworkID()]["Swap"]["txFee"])
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
                ? new bn_js_1.default(constants_2.Defaults.network[this.core.getNetworkID()]["Swap"]["creationTxFee"])
                : new bn_js_1.default(0);
        };
        /**
         * Gets the default mint fee for this chain.
         *
         * @returns The default mint fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getDefaultMintTxFee = () => {
            return this.core.getNetworkID() in constants_2.Defaults.network
                ? new bn_js_1.default(constants_2.Defaults.network[this.core.getNetworkID()]["Swap"]["mintTxFee"])
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
                throw new errors_1.AddressError("Error - AVMAPI.getBalance: Invalid address format");
            }
            const params = {
                address,
                assetID,
                includePartial
            };
            const response = yield this.callMethod("avm.getBalance", params);
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
            const response = yield this.callMethod("avm.createAddress", params);
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
         *     "address": "Swap-axc1kj06lhgx84h39snsljcey3tpc046ze68mek3g5",
         *     "amount": 10000
         *   },
         *   {
         *     "address": "Swap-axc1am4w6hfrvmh3akduzkjthrtgtqafalce6an8cr",
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
            const response = yield this.callMethod("avm.createFixedCapAsset", params);
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
         *        "Swap-axc1am4w6hfrvmh3akduzkjthrtgtqafalce6an8cr"
         *      ],
         *      "threshold": 1
         *     },
         *     {
         *      "minters": [
         *        "Swap-axc1am4w6hfrvmh3akduzkjthrtgtqafalce6an8cr",
         *        "Swap-axc1kj06lhgx84h39snsljcey3tpc046ze68mek3g5",
         *        "Swap-axc1yell3e4nln0m39cfpdhgqprsd87jkh4qnakklx"
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
            const response = yield this.callMethod("avm.createVariableCapAsset", params);
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
                    throw new errors_1.AddressError("Error - AVMAPI.createNFTAsset: Invalid address format");
                }
                params["changeAddr"] = changeAddr;
            }
            const response = yield this.callMethod("avm.createNFTAsset", params);
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
            const response = yield this.callMethod("avm.mint", params);
            return response.data.result.txID;
        });
        /**
         * Mint non-fungible tokens which were created with AVMAPI.createNFTAsset
         *
         * @param username The user paying the transaction fee (in $AXC) for asset creation
         * @param password The password for the user paying the transaction fee (in $AXC) for asset creation
         * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
         * @param changeAddr Optional. An address to send the change
         * @param assetID The asset id which is being sent
         * @param to Address on SwapChain of the account to which this NFT is being sent
         * @param encoding Optional.  is the encoding format to use for the payload argument. Can be either "cb58" or "hex". Defaults to "hex".
         *
         * @returns ID of the transaction
         */
        this.mintNFT = (username, password, from = undefined, changeAddr = undefined, payload, assetID, to, encoding = "hex") => __awaiter(this, void 0, void 0, function* () {
            let asset;
            if (typeof this.parseAddress(to) === "undefined") {
                /* istanbul ignore next */
                throw new errors_1.AddressError("Error - AVMAPI.mintNFT: Invalid address format");
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
                    throw new errors_1.AddressError("Error - AVMAPI.mintNFT: Invalid address format");
                }
                params["changeAddr"] = changeAddr;
            }
            const response = yield this.callMethod("avm.mintNFT", params);
            return response.data.result.txID;
        });
        /**
         * Send NFT from one account to another on SwapChain
         *
         * @param username The user paying the transaction fee (in $AXC) for asset creation
         * @param password The password for the user paying the transaction fee (in $AXC) for asset creation
         * @param from Optional. An array of addresses managed by the node's keystore for this blockchain which will fund this transaction
         * @param changeAddr Optional. An address to send the change
         * @param assetID The asset id which is being sent
         * @param groupID The group this NFT is issued to.
         * @param to Address on SwapChain of the account to which this NFT is being sent
         *
         * @returns ID of the transaction
         */
        this.sendNFT = (username, password, from = undefined, changeAddr = undefined, assetID, groupID, to) => __awaiter(this, void 0, void 0, function* () {
            let asset;
            if (typeof this.parseAddress(to) === "undefined") {
                /* istanbul ignore next */
                throw new errors_1.AddressError("Error - AVMAPI.sendNFT: Invalid address format");
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
                    throw new errors_1.AddressError("Error - AVMAPI.sendNFT: Invalid address format");
                }
                params["changeAddr"] = changeAddr;
            }
            const response = yield this.callMethod("avm.sendNFT", params);
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
                throw new errors_1.AddressError("Error - AVMAPI.exportKey: Invalid address format");
            }
            const params = {
                username,
                password,
                address
            };
            const response = yield this.callMethod("avm.exportKey", params);
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
            const response = yield this.callMethod("avm.importKey", params);
            return response.data.result.address;
        });
        /**
         * Send ANT (Axia Native Token) assets including AXC from the SwapChain to an account on the CoreChain or AXChain.
         *
         * After calling this method, you must call the CoreChain's `import` or the AXChain’s `import` method to complete the transfer.
         *
         * @param username The Keystore user that controls the CoreChain or AXChain account specified in `to`
         * @param password The password of the Keystore user
         * @param to The account on the CoreChain or AXChain to send the asset to.
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
            const response = yield this.callMethod("avm.export", params);
            return response.data.result.txID;
        });
        /**
         * Send ANT (Axia Native Token) assets including AXC from an account on the CoreChain or AXChain to an address on the SwapChain. This transaction
         * must be signed with the key of the account that the asset is sent from and which pays
         * the transaction fee.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The address of the account the asset is sent to.
         * @param sourceChain The chainID where the funds are coming from. Ex: "AX"
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
            const response = yield this.callMethod("avm.import", params);
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
            const response = yield this.callMethod("avm.listAddresses", params);
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
                throw new errors_1.AddressError("Error - AVMAPI.getAllBalances: Invalid address format");
            }
            const params = {
                address
            };
            const response = yield this.callMethod("avm.getAllBalances", params);
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
            const response = yield this.callMethod("avm.getAssetDescription", params);
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
            const response = yield this.callMethod("avm.getTx", params);
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
            const response = yield this.callMethod("avm.getTxStatus", params);
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
            const response = yield this.callMethod("avm.getUTXOs", params);
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
                throw new errors_1.GooseEggCheckError("Error - AVMAPI.buildBaseTx:Failed Goose Egg Check");
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
                throw new errors_1.GooseEggCheckError("Error - AVMAPI.buildNFTTransferTx:Failed Goose Egg Check");
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
            let sraxChain = undefined;
            if (typeof sourceChain === "undefined") {
                throw new errors_1.ChainIdError("Error - AVMAPI.buildImportTx: Source ChainID is undefined.");
            }
            else if (typeof sourceChain === "string") {
                sraxChain = sourceChain;
                sourceChain = bintools.cb58Decode(sourceChain);
            }
            else if (!(sourceChain instanceof buffer_1.Buffer)) {
                throw new errors_1.ChainIdError("Error - AVMAPI.buildImportTx: Invalid destinationChain type: " +
                    typeof sourceChain);
            }
            const atomicUTXOs = (yield this.getUTXOs(ownerAddresses, sraxChain, 0, undefined)).utxos;
            const axcAssetID = yield this.getAXCAssetID();
            const atomics = atomicUTXOs.getAllUTXOs();
            if (atomics.length === 0) {
                throw new errors_1.NoAtomicUTXOsError("Error - AVMAPI.buildImportTx: No atomic UTXOs to import from " +
                    sraxChain +
                    " using addresses: " +
                    ownerAddresses.join(", "));
            }
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const builtUnsignedTx = utxoset.buildImportTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), to, from, change, atomics, sourceChain, this.getTxFee(), axcAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - AVMAPI.buildImportTx:Failed Goose Egg Check");
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
                throw new errors_1.AddressError("Error - AVMAPI.buildExportTx: To addresses must have the same chainID prefix.");
            }
            if (typeof destinationChain === "undefined") {
                throw new errors_1.ChainIdError("Error - AVMAPI.buildExportTx: Destination ChainID is undefined.");
            }
            else if (typeof destinationChain === "string") {
                destinationChain = bintools.cb58Decode(destinationChain); //
            }
            else if (!(destinationChain instanceof buffer_1.Buffer)) {
                throw new errors_1.ChainIdError("Error - AVMAPI.buildExportTx: Invalid destinationChain type: " +
                    typeof destinationChain);
            }
            if (destinationChain.length !== 32) {
                throw new errors_1.ChainIdError("Error - AVMAPI.buildExportTx: Destination ChainID must be 32 bytes in length.");
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
                throw new errors_1.GooseEggCheckError("Error - AVMAPI.buildExportTx:Failed Goose Egg Check");
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
            if (symbol.length > constants_1.AVMConstants.SYMBOLMAXLEN) {
                throw new errors_1.SymbolError("Error - AVMAPI.buildCreateAssetTx: Symbols may not exceed length of " +
                    constants_1.AVMConstants.SYMBOLMAXLEN);
            }
            if (name.length > constants_1.AVMConstants.ASSETNAMELEN) {
                throw new errors_1.NameError("Error - AVMAPI.buildCreateAssetTx: Names may not exceed length of " +
                    constants_1.AVMConstants.ASSETNAMELEN);
            }
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const axcAssetID = yield this.getAXCAssetID();
            const fee = this.getDefaultCreationTxFee();
            const builtUnsignedTx = utxoset.buildCreateAssetTx(networkID, blockchainID, from, change, initialStates, name, symbol, denomination, mintOutputs, fee, axcAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, fee))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - AVMAPI.buildCreateAssetTx:Failed Goose Egg Check");
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
                throw new errors_1.GooseEggCheckError("Error - AVMAPI.buildSECPMintTx:Failed Goose Egg Check");
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
         *              "Swap-axc1ghstjukrtw8935lryqtnh643xe9a94u3tc75c7"
         *          ],
         *          "threshold": 1
         *      },
         *      {
         *          "minters": [
         *              "Swap-axc1yell3e4nln0m39cfpdhgqprsd87jkh4qnakklx",
         *              "Swap-axc1k4nr26c80jaquzm9369j5a4shmwcjn0vmemcjz",
         *              "Swap-axc1ztkzsrjnkn0cek5ryvhqswdtcg23nhge3nnr5e"
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
            if (name.length > constants_1.AVMConstants.ASSETNAMELEN) {
                /* istanbul ignore next */
                throw new errors_1.NameError("Error - AVMAPI.buildCreateNFTAssetTx: Names may not exceed length of " +
                    constants_1.AVMConstants.ASSETNAMELEN);
            }
            if (symbol.length > constants_1.AVMConstants.SYMBOLMAXLEN) {
                /* istanbul ignore next */
                throw new errors_1.SymbolError("Error - AVMAPI.buildCreateNFTAssetTx: Symbols may not exceed length of " +
                    constants_1.AVMConstants.SYMBOLMAXLEN);
            }
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const creationTxFee = this.getCreationTxFee();
            const axcAssetID = yield this.getAXCAssetID();
            const builtUnsignedTx = utxoset.buildCreateNFTAssetTx(networkID, blockchainID, from, change, minterSets, name, symbol, creationTxFee, axcAssetID, memo, asOf, locktime);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, creationTxFee))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Error - AVMAPI.buildCreateNFTAssetTx:Failed Goose Egg Check");
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
                throw new errors_1.GooseEggCheckError("Error - AVMAPI.buildCreateNFTMintTx:Failed Goose Egg Check");
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
                throw new errors_1.TransactionError("Error - AVMAPI.issueTx: provided tx is not expected type of string, Buffer, or Tx");
            }
            const params = {
                tx: Transaction.toString()
            };
            const response = yield this.callMethod("avm.issueTx", params);
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
            const response = yield this.callMethod("avm.getAddressTxs", params);
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
                throw new errors_1.AddressError("Error - AVMAPI.send: Invalid address format");
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
                    throw new errors_1.AddressError("Error - AVMAPI.send: Invalid address format");
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
            const response = yield this.callMethod("avm.send", params);
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
                    throw new errors_1.AddressError("Error - AVMAPI.sendMultiple: Invalid address format");
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
                    throw new errors_1.AddressError("Error - AVMAPI.send: Invalid address format");
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
            const response = yield this.callMethod("avm.sendMultiple", params);
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
            const response = yield this.callMethod("avm.buildGenesis", params);
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
                        throw new errors_1.AddressError("Error - AVMAPI.${caller}: Invalid address format");
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
exports.AVMAPI = AVMAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYXZtL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxrREFBc0I7QUFDdEIsb0NBQWdDO0FBRWhDLG9FQUEyQztBQUMzQyxtQ0FBdUM7QUFDdkMsMkNBQTBDO0FBQzFDLHlDQUFxQztBQUNyQyw2QkFBcUM7QUFDckMsaURBQWlEO0FBR2pELGlFQUFxRDtBQUNyRCxrREFBOEM7QUFFOUMscURBQTJFO0FBRzNFLGdEQUFrRDtBQUVsRCwrQ0FRMkI7QUFDM0IsdUNBQTJEO0FBb0MzRDs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxhQUFhLEdBQWtCLHFCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFaEU7Ozs7OztHQU1HO0FBQ0gsTUFBYSxNQUFPLFNBQVEsaUJBQU87SUE2N0RqQzs7Ozs7O09BTUc7SUFDSCxZQUNFLElBQWMsRUFDZCxVQUFrQixjQUFjLEVBQ2hDLGVBQXVCLEVBQUU7UUFFekIsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQTtRQXg4RHRCOztXQUVHO1FBQ08sYUFBUSxHQUFhLElBQUksbUJBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDekMsaUJBQVksR0FBVyxFQUFFLENBQUE7UUFDekIsb0JBQWUsR0FBVyxTQUFTLENBQUE7UUFDbkMsZUFBVSxHQUFXLFNBQVMsQ0FBQTtRQUM5QixVQUFLLEdBQU8sU0FBUyxDQUFBO1FBQ3JCLGtCQUFhLEdBQU8sU0FBUyxDQUFBO1FBQzdCLGNBQVMsR0FBTyxTQUFTLENBQUE7UUFFbkM7Ozs7V0FJRztRQUNILHVCQUFrQixHQUFHLEdBQVcsRUFBRTtZQUNoQyxJQUFJLE9BQU8sSUFBSSxDQUFDLGVBQWUsS0FBSyxXQUFXLEVBQUU7Z0JBQy9D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UUFBUSxFQUFFO29CQUN6QyxJQUNFLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBVyxDQUFDO3dCQUNyRCxXQUFXLEVBQ1g7d0JBQ0EsMEJBQTBCO3dCQUMxQixNQUFNLElBQUkscUJBQVksQ0FDcEIsa0RBQWtELENBQ25ELENBQUE7cUJBQ0Y7b0JBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBVyxDQUFDLENBQUE7aUJBQ3hDO3FCQUFNO29CQUNMLE1BQU0sSUFBSSxHQUFtQixRQUFRLENBQUE7b0JBQ3JDLEtBQUssQ0FBQyxJQUFJLENBQ1IsYUFBYSxDQUFDLFlBQVksQ0FDeEIsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQVcsRUFDM0IsSUFBSSxFQUNKLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQ2xCLE9BQU8sQ0FDUixDQUNGLENBQUE7aUJBQ0Y7YUFDRjtTQUNGO1FBQ0QsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0NBMkJGO0FBdDlERCx3QkFzOURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUFWTVxuICovXG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCJcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcbmltcG9ydCBBeGlhQ29yZSBmcm9tIFwiLi4vLi4vYXhpYVwiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IFVUWE8sIFVUWE9TZXQgfSBmcm9tIFwiLi91dHhvc1wiXG5pbXBvcnQgeyBBVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHsgS2V5Q2hhaW4gfSBmcm9tIFwiLi9rZXljaGFpblwiXG5pbXBvcnQgeyBUeCwgVW5zaWduZWRUeCB9IGZyb20gXCIuL3R4XCJcbmltcG9ydCB7IFBheWxvYWRCYXNlIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3BheWxvYWRcIlxuaW1wb3J0IHsgU0VDUE1pbnRPdXRwdXQgfSBmcm9tIFwiLi9vdXRwdXRzXCJcbmltcG9ydCB7IEluaXRpYWxTdGF0ZXMgfSBmcm9tIFwiLi9pbml0aWFsc3RhdGVzXCJcbmltcG9ydCB7IFVuaXhOb3cgfSBmcm9tIFwiLi4vLi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zXCJcbmltcG9ydCB7IEpSUENBUEkgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2pycGNhcGlcIlxuaW1wb3J0IHsgUmVxdWVzdFJlc3BvbnNlRGF0YSB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpYmFzZVwiXG5pbXBvcnQgeyBEZWZhdWx0cywgUHJpbWFyeUFzc2V0QWxpYXMsIE9ORUFYQyB9IGZyb20gXCIuLi8uLi91dGlscy9jb25zdGFudHNcIlxuaW1wb3J0IHsgTWludGVyU2V0IH0gZnJvbSBcIi4vbWludGVyc2V0XCJcbmltcG9ydCB7IFBlcnNpc3RhbmNlT3B0aW9ucyB9IGZyb20gXCIuLi8uLi91dGlscy9wZXJzaXN0ZW5jZW9wdGlvbnNcIlxuaW1wb3J0IHsgT3V0cHV0T3duZXJzIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9vdXRwdXRcIlxuaW1wb3J0IHsgU0VDUFRyYW5zZmVyT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXG5pbXBvcnQge1xuICBBZGRyZXNzRXJyb3IsXG4gIEdvb3NlRWdnQ2hlY2tFcnJvcixcbiAgQ2hhaW5JZEVycm9yLFxuICBOb0F0b21pY1VUWE9zRXJyb3IsXG4gIFN5bWJvbEVycm9yLFxuICBOYW1lRXJyb3IsXG4gIFRyYW5zYWN0aW9uRXJyb3Jcbn0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkVHlwZSB9IGZyb20gXCIuLi8uLi91dGlsc1wiXG5pbXBvcnQge1xuICBCdWlsZEdlbmVzaXNQYXJhbXMsXG4gIENyZWF0ZUFkZHJlc3NQYXJhbXMsXG4gIENyZWF0ZUZpeGVkQ2FwQXNzZXRQYXJhbXMsXG4gIENyZWF0ZVZhcmlhYmxlQ2FwQXNzZXRQYXJhbXMsXG4gIEV4cG9ydFBhcmFtcyxcbiAgRXhwb3J0S2V5UGFyYW1zLFxuICBHZXRBbGxCYWxhbmNlc1BhcmFtcyxcbiAgR2V0QXNzZXREZXNjcmlwdGlvblBhcmFtcyxcbiAgR2V0QVhDQXNzZXRJRFBhcmFtcyxcbiAgR2V0QmFsYW5jZVBhcmFtcyxcbiAgR2V0VHhQYXJhbXMsXG4gIEdldFR4U3RhdHVzUGFyYW1zLFxuICBHZXRVVFhPc1BhcmFtcyxcbiAgSW1wb3J0UGFyYW1zLFxuICBJbXBvcnRLZXlQYXJhbXMsXG4gIExpc3RBZGRyZXNzZXNQYXJhbXMsXG4gIE1pbnRQYXJhbXMsXG4gIFNlbmRNdWx0aXBsZVBhcmFtcyxcbiAgU091dHB1dHNQYXJhbXMsXG4gIEdldFVUWE9zUmVzcG9uc2UsXG4gIEdldEFzc2V0RGVzY3JpcHRpb25SZXNwb25zZSxcbiAgR2V0QmFsYW5jZVJlc3BvbnNlLFxuICBTZW5kUGFyYW1zLFxuICBTZW5kUmVzcG9uc2UsXG4gIFNlbmRNdWx0aXBsZVJlc3BvbnNlLFxuICBHZXRBZGRyZXNzVHhzUGFyYW1zLFxuICBHZXRBZGRyZXNzVHhzUmVzcG9uc2UsXG4gIENyZWF0ZU5GVEFzc2V0UGFyYW1zLFxuICBTZW5kTkZUUGFyYW1zLFxuICBNaW50TkZUUGFyYW1zLFxuICBJTWludGVyU2V0XG59IGZyb20gXCIuL2ludGVyZmFjZXNcIlxuaW1wb3J0IHsgSXNzdWVUeFBhcmFtcyB9IGZyb20gXCIuLi8uLi9jb21tb25cIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuXG4vKipcbiAqIENsYXNzIGZvciBpbnRlcmFjdGluZyB3aXRoIGEgbm9kZSBlbmRwb2ludCB0aGF0IGlzIHVzaW5nIHRoZSBBVk0uXG4gKlxuICogQGNhdGVnb3J5IFJQQ0FQSXNcbiAqXG4gKiBAcmVtYXJrcyBUaGlzIGV4dGVuZHMgdGhlIFtbSlJQQ0FQSV1dIGNsYXNzLiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgZGlyZWN0bHkgY2FsbGVkLiBJbnN0ZWFkLCB1c2UgdGhlIFtbQXhpYS5hZGRBUEldXSBmdW5jdGlvbiB0byByZWdpc3RlciB0aGlzIGludGVyZmFjZSB3aXRoIEF4aWEuXG4gKi9cbmV4cG9ydCBjbGFzcyBBVk1BUEkgZXh0ZW5kcyBKUlBDQVBJIHtcbiAgLyoqXG4gICAqIEBpZ25vcmVcbiAgICovXG4gIHByb3RlY3RlZCBrZXljaGFpbjogS2V5Q2hhaW4gPSBuZXcgS2V5Q2hhaW4oXCJcIiwgXCJcIilcbiAgcHJvdGVjdGVkIGJsb2NrY2hhaW5JRDogc3RyaW5nID0gXCJcIlxuICBwcm90ZWN0ZWQgYmxvY2tjaGFpbkFsaWFzOiBzdHJpbmcgPSB1bmRlZmluZWRcbiAgcHJvdGVjdGVkIEFYQ0Fzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZFxuICBwcm90ZWN0ZWQgdHhGZWU6IEJOID0gdW5kZWZpbmVkXG4gIHByb3RlY3RlZCBjcmVhdGlvblR4RmVlOiBCTiA9IHVuZGVmaW5lZFxuICBwcm90ZWN0ZWQgbWludFR4RmVlOiBCTiA9IHVuZGVmaW5lZFxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRCBpZiBpdCBleGlzdHMsIG90aGVyd2lzZSByZXR1cm5zIGB1bmRlZmluZWRgLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYWxpYXMgZm9yIHRoZSBibG9ja2NoYWluSURcbiAgICovXG4gIGdldEJsb2NrY2hhaW5BbGlhcyA9ICgpOiBzdHJpbmcgPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5ibG9ja2NoYWluQWxpYXMgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGNvbnN0IG5ldGlkOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICAgIGlmIChcbiAgICAgICAgbmV0aWQgaW4gRGVmYXVsdHMubmV0d29yayAmJlxuICAgICAgICB0aGlzLmJsb2NrY2hhaW5JRCBpbiBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldGlkfWBdXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5ibG9ja2NoYWluQWxpYXMgPVxuICAgICAgICAgIERlZmF1bHRzLm5ldHdvcmtbYCR7bmV0aWR9YF1bdGhpcy5ibG9ja2NoYWluSURdLmFsaWFzXG4gICAgICAgIHJldHVybiB0aGlzLmJsb2NrY2hhaW5BbGlhc1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5ibG9ja2NoYWluQWxpYXNcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRC5cbiAgICpcbiAgICogQHBhcmFtIGFsaWFzIFRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRC5cbiAgICpcbiAgICovXG4gIHNldEJsb2NrY2hhaW5BbGlhcyA9IChhbGlhczogc3RyaW5nKTogdW5kZWZpbmVkID0+IHtcbiAgICB0aGlzLmJsb2NrY2hhaW5BbGlhcyA9IGFsaWFzXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICByZXR1cm4gdW5kZWZpbmVkXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYmxvY2tjaGFpbklEIGFuZCByZXR1cm5zIGl0LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYmxvY2tjaGFpbklEXG4gICAqL1xuICBnZXRCbG9ja2NoYWluSUQgPSAoKTogc3RyaW5nID0+IHRoaXMuYmxvY2tjaGFpbklEXG5cbiAgLyoqXG4gICAqIFJlZnJlc2ggYmxvY2tjaGFpbklELCBhbmQgaWYgYSBibG9ja2NoYWluSUQgaXMgcGFzc2VkIGluLCB1c2UgdGhhdC5cbiAgICpcbiAgICogQHBhcmFtIE9wdGlvbmFsLiBCbG9ja2NoYWluSUQgdG8gYXNzaWduLCBpZiBub25lLCB1c2VzIHRoZSBkZWZhdWx0IGJhc2VkIG9uIG5ldHdvcmtJRC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGJsb2NrY2hhaW5JRFxuICAgKi9cbiAgcmVmcmVzaEJsb2NrY2hhaW5JRCA9IChibG9ja2NoYWluSUQ6IHN0cmluZyA9IHVuZGVmaW5lZCk6IGJvb2xlYW4gPT4ge1xuICAgIGNvbnN0IG5ldGlkOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBpZiAoXG4gICAgICB0eXBlb2YgYmxvY2tjaGFpbklEID09PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICB0eXBlb2YgRGVmYXVsdHMubmV0d29ya1tgJHtuZXRpZH1gXSAhPT0gXCJ1bmRlZmluZWRcIlxuICAgICkge1xuICAgICAgdGhpcy5ibG9ja2NoYWluSUQgPSBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldGlkfWBdLlN3YXAuYmxvY2tjaGFpbklEIC8vZGVmYXVsdCB0byBTd2FwQ2hhaW5cbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIGlmICh0eXBlb2YgYmxvY2tjaGFpbklEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLmJsb2NrY2hhaW5JRCA9IGJsb2NrY2hhaW5JRFxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYW4gYWRkcmVzcyBzdHJpbmcgYW5kIHJldHVybnMgaXRzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIGlmIHZhbGlkLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgYWRkcmVzcyBpZiB2YWxpZCwgdW5kZWZpbmVkIGlmIG5vdCB2YWxpZC5cbiAgICovXG4gIHBhcnNlQWRkcmVzcyA9IChhZGRyOiBzdHJpbmcpOiBCdWZmZXIgPT4ge1xuICAgIGNvbnN0IGFsaWFzOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5JRCgpXG4gICAgcmV0dXJuIGJpbnRvb2xzLnBhcnNlQWRkcmVzcyhcbiAgICAgIGFkZHIsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBhbGlhcyxcbiAgICAgIEFWTUNvbnN0YW50cy5BRERSRVNTTEVOR1RIXG4gICAgKVxuICB9XG5cbiAgYWRkcmVzc0Zyb21CdWZmZXIgPSAoYWRkcmVzczogQnVmZmVyKTogc3RyaW5nID0+IHtcbiAgICBjb25zdCBjaGFpbklEOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXG4gICAgICA/IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcbiAgICAgIDogdGhpcy5nZXRCbG9ja2NoYWluSUQoKVxuICAgIGNvbnN0IHR5cGU6IFNlcmlhbGl6ZWRUeXBlID0gXCJiZWNoMzJcIlxuICAgIGNvbnN0IGhycDogc3RyaW5nID0gdGhpcy5jb3JlLmdldEhSUCgpXG4gICAgcmV0dXJuIHNlcmlhbGl6YXRpb24uYnVmZmVyVG9UeXBlKGFkZHJlc3MsIHR5cGUsIGhycCwgY2hhaW5JRClcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSBBWEMgQXNzZXRJRCBhbmQgcmV0dXJucyBpdCBpbiBhIFByb21pc2UuXG4gICAqXG4gICAqIEBwYXJhbSByZWZyZXNoIFRoaXMgZnVuY3Rpb24gY2FjaGVzIHRoZSByZXNwb25zZS4gUmVmcmVzaCA9IHRydWUgd2lsbCBidXN0IHRoZSBjYWNoZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHRoZSBwcm92aWRlZCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBBWEMgQXNzZXRJRFxuICAgKi9cbiAgZ2V0QVhDQXNzZXRJRCA9IGFzeW5jIChyZWZyZXNoOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPEJ1ZmZlcj4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5BWENBc3NldElEID09PSBcInVuZGVmaW5lZFwiIHx8IHJlZnJlc2gpIHtcbiAgICAgIGNvbnN0IGFzc2V0OiBHZXRBWENBc3NldElEUGFyYW1zID0gYXdhaXQgdGhpcy5nZXRBc3NldERlc2NyaXB0aW9uKFxuICAgICAgICBQcmltYXJ5QXNzZXRBbGlhc1xuICAgICAgKVxuICAgICAgdGhpcy5BWENBc3NldElEID0gYXNzZXQuYXNzZXRJRFxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5BWENBc3NldElEXG4gIH1cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSBkZWZhdWx0cyBhbmQgc2V0cyB0aGUgY2FjaGUgdG8gYSBzcGVjaWZpYyBBWEMgQXNzZXRJRFxuICAgKlxuICAgKiBAcGFyYW0gYXhjQXNzZXRJRCBBIGNiNTggc3RyaW5nIG9yIEJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIEFYQyBBc3NldElEXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0aGUgcHJvdmlkZWQgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgQVhDIEFzc2V0SURcbiAgICovXG4gIHNldEFYQ0Fzc2V0SUQgPSAoYXhjQXNzZXRJRDogc3RyaW5nIHwgQnVmZmVyKSA9PiB7XG4gICAgaWYgKHR5cGVvZiBheGNBc3NldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBheGNBc3NldElEID0gYmludG9vbHMuY2I1OERlY29kZShheGNBc3NldElEKVxuICAgIH1cbiAgICB0aGlzLkFYQ0Fzc2V0SUQgPSBheGNBc3NldElEXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGVmYXVsdCB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBkZWZhdWx0IHR4IGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXREZWZhdWx0VHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIHJldHVybiB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCkgaW4gRGVmYXVsdHMubmV0d29ya1xuICAgICAgPyBuZXcgQk4oRGVmYXVsdHMubmV0d29ya1t0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCldW1wiU3dhcFwiXVtcInR4RmVlXCJdKVxuICAgICAgOiBuZXcgQk4oMClcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0eCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0VHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy50eEZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy50eEZlZSA9IHRoaXMuZ2V0RGVmYXVsdFR4RmVlKClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMudHhGZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEBwYXJhbSBmZWUgVGhlIHR4IGZlZSBhbW91bnQgdG8gc2V0IGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBzZXRUeEZlZSA9IChmZWU6IEJOKTogdm9pZCA9PiB7XG4gICAgdGhpcy50eEZlZSA9IGZlZVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRlZmF1bHQgY3JlYXRpb24gZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZGVmYXVsdCBjcmVhdGlvbiBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0RGVmYXVsdENyZWF0aW9uVHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIHJldHVybiB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCkgaW4gRGVmYXVsdHMubmV0d29ya1xuICAgICAgPyBuZXcgQk4oRGVmYXVsdHMubmV0d29ya1t0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCldW1wiU3dhcFwiXVtcImNyZWF0aW9uVHhGZWVcIl0pXG4gICAgICA6IG5ldyBCTigwKVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRlZmF1bHQgbWludCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBkZWZhdWx0IG1pbnQgZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIGdldERlZmF1bHRNaW50VHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIHJldHVybiB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCkgaW4gRGVmYXVsdHMubmV0d29ya1xuICAgICAgPyBuZXcgQk4oRGVmYXVsdHMubmV0d29ya1t0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCldW1wiU3dhcFwiXVtcIm1pbnRUeEZlZVwiXSlcbiAgICAgIDogbmV3IEJOKDApXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWludCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBtaW50IGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXRNaW50VHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5taW50VHhGZWUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRoaXMubWludFR4RmVlID0gdGhpcy5nZXREZWZhdWx0TWludFR4RmVlKClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWludFR4RmVlXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY3JlYXRpb24gZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY3JlYXRpb24gZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIGdldENyZWF0aW9uVHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5jcmVhdGlvblR4RmVlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLmNyZWF0aW9uVHhGZWUgPSB0aGlzLmdldERlZmF1bHRDcmVhdGlvblR4RmVlKClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRpb25UeEZlZVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG1pbnQgZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcGFyYW0gZmVlIFRoZSBtaW50IGZlZSBhbW91bnQgdG8gc2V0IGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBzZXRNaW50VHhGZWUgPSAoZmVlOiBCTik6IHZvaWQgPT4ge1xuICAgIHRoaXMubWludFR4RmVlID0gZmVlXG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY3JlYXRpb24gZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcGFyYW0gZmVlIFRoZSBjcmVhdGlvbiBmZWUgYW1vdW50IHRvIHNldCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgc2V0Q3JlYXRpb25UeEZlZSA9IChmZWU6IEJOKTogdm9pZCA9PiB7XG4gICAgdGhpcy5jcmVhdGlvblR4RmVlID0gZmVlXG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIHJlZmVyZW5jZSB0byB0aGUga2V5Y2hhaW4gZm9yIHRoaXMgY2xhc3MuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBpbnN0YW5jZSBvZiBbW0tleUNoYWluXV0gZm9yIHRoaXMgY2xhc3NcbiAgICovXG4gIGtleUNoYWluID0gKCk6IEtleUNoYWluID0+IHRoaXMua2V5Y2hhaW5cblxuICAvKipcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgbmV3S2V5Q2hhaW4gPSAoKTogS2V5Q2hhaW4gPT4ge1xuICAgIC8vIHdhcm5pbmcsIG92ZXJ3cml0ZXMgdGhlIG9sZCBrZXljaGFpblxuICAgIGNvbnN0IGFsaWFzOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXG4gICAgaWYgKGFsaWFzKSB7XG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgYWxpYXMpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMua2V5Y2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5jb3JlLmdldEhSUCgpLCB0aGlzLmJsb2NrY2hhaW5JRClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMua2V5Y2hhaW5cbiAgfVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggZGV0ZXJtaW5lcyBpZiBhIHR4IGlzIGEgZ29vc2UgZWdnIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4IEFuIFVuc2lnbmVkVHhcbiAgICpcbiAgICogQHJldHVybnMgYm9vbGVhbiB0cnVlIGlmIHBhc3NlcyBnb29zZSBlZ2cgdGVzdCBhbmQgZmFsc2UgaWYgZmFpbHMuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIEEgXCJHb29zZSBFZ2cgVHJhbnNhY3Rpb25cIiBpcyB3aGVuIHRoZSBmZWUgZmFyIGV4Y2VlZHMgYSByZWFzb25hYmxlIGFtb3VudFxuICAgKi9cbiAgY2hlY2tHb29zZUVnZyA9IGFzeW5jIChcbiAgICB1dHg6IFVuc2lnbmVkVHgsXG4gICAgb3V0VG90YWw6IEJOID0gbmV3IEJOKDApXG4gICk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xuICAgIGNvbnN0IGF4Y0Fzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVhDQXNzZXRJRCgpXG4gICAgY29uc3Qgb3V0cHV0VG90YWw6IEJOID0gb3V0VG90YWwuZ3QobmV3IEJOKDApKVxuICAgICAgPyBvdXRUb3RhbFxuICAgICAgOiB1dHguZ2V0T3V0cHV0VG90YWwoYXhjQXNzZXRJRClcbiAgICBjb25zdCBmZWU6IEJOID0gdXR4LmdldEJ1cm4oYXhjQXNzZXRJRClcbiAgICBpZiAoZmVlLmx0ZShPTkVBWEMubXVsKG5ldyBCTigxMCkpKSB8fCBmZWUubHRlKG91dHB1dFRvdGFsKSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGJhbGFuY2Ugb2YgYSBwYXJ0aWN1bGFyIGFzc2V0IG9uIGEgYmxvY2tjaGFpbi5cbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGFkZHJlc3MgdG8gcHVsbCB0aGUgYXNzZXQgYmFsYW5jZSBmcm9tXG4gICAqIEBwYXJhbSBhc3NldElEIFRoZSBhc3NldElEIHRvIHB1bGwgdGhlIGJhbGFuY2UgZnJvbVxuICAgKiBAcGFyYW0gaW5jbHVkZVBhcnRpYWwgSWYgaW5jbHVkZVBhcnRpYWw9ZmFsc2UsIHJldHVybnMgb25seSB0aGUgYmFsYW5jZSBoZWxkIHNvbGVseVxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIHdpdGggdGhlIGJhbGFuY2Ugb2YgdGhlIGFzc2V0SUQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBvbiB0aGUgcHJvdmlkZWQgYWRkcmVzcyBmb3IgdGhlIGJsb2NrY2hhaW4uXG4gICAqL1xuICBnZXRCYWxhbmNlID0gYXN5bmMgKFxuICAgIGFkZHJlc3M6IHN0cmluZyxcbiAgICBhc3NldElEOiBzdHJpbmcsXG4gICAgaW5jbHVkZVBhcnRpYWw6IGJvb2xlYW4gPSBmYWxzZVxuICApOiBQcm9taXNlPEdldEJhbGFuY2VSZXNwb25zZT4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3MoYWRkcmVzcykgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVZNQVBJLmdldEJhbGFuY2U6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIlxuICAgICAgKVxuICAgIH1cbiAgICBjb25zdCBwYXJhbXM6IEdldEJhbGFuY2VQYXJhbXMgPSB7XG4gICAgICBhZGRyZXNzLFxuICAgICAgYXNzZXRJRCxcbiAgICAgIGluY2x1ZGVQYXJ0aWFsXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhdm0uZ2V0QmFsYW5jZVwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gYWRkcmVzcyAoYW5kIGFzc29jaWF0ZWQgcHJpdmF0ZSBrZXlzKSBvbiBhIHVzZXIgb24gYSBibG9ja2NoYWluLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgTmFtZSBvZiB0aGUgdXNlciB0byBjcmVhdGUgdGhlIGFkZHJlc3MgdW5kZXJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFBhc3N3b3JkIHRvIHVubG9jayB0aGUgdXNlciBhbmQgZW5jcnlwdCB0aGUgcHJpdmF0ZSBrZXlcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBhZGRyZXNzIGNyZWF0ZWQgYnkgdGhlIHZtLlxuICAgKi9cbiAgY3JlYXRlQWRkcmVzcyA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IENyZWF0ZUFkZHJlc3NQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhdm0uY3JlYXRlQWRkcmVzc1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5hZGRyZXNzXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IGZpeGVkLWNhcCwgZnVuZ2libGUgYXNzZXQuIEEgcXVhbnRpdHkgb2YgaXQgaXMgY3JlYXRlZCBhdCBpbml0aWFsaXphdGlvbiBhbmQgdGhlcmUgbm8gbW9yZSBpcyBldmVyIGNyZWF0ZWQuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlciBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZSAoaW4gJEFYQykgZm9yIGFzc2V0IGNyZWF0aW9uXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgZm9yIHRoZSB1c2VyIHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIChpbiAkQVhDKSBmb3IgYXNzZXQgY3JlYXRpb25cbiAgICogQHBhcmFtIG5hbWUgVGhlIGh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSBhc3NldFxuICAgKiBAcGFyYW0gc3ltYm9sIE9wdGlvbmFsLiBUaGUgc2hvcnRoYW5kIHN5bWJvbCBmb3IgdGhlIGFzc2V0LiBCZXR3ZWVuIDAgYW5kIDQgY2hhcmFjdGVyc1xuICAgKiBAcGFyYW0gZGVub21pbmF0aW9uIE9wdGlvbmFsLiBEZXRlcm1pbmVzIGhvdyBiYWxhbmNlcyBvZiB0aGlzIGFzc2V0IGFyZSBkaXNwbGF5ZWQgYnkgdXNlciBpbnRlcmZhY2VzLiBEZWZhdWx0IGlzIDBcbiAgICogQHBhcmFtIGluaXRpYWxIb2xkZXJzIEFuIGFycmF5IG9mIG9iamVjdHMgY29udGFpbmluZyB0aGUgZmllbGQgXCJhZGRyZXNzXCIgYW5kIFwiYW1vdW50XCIgdG8gZXN0YWJsaXNoIHRoZSBnZW5lc2lzIHZhbHVlcyBmb3IgdGhlIG5ldyBhc3NldFxuICAgKlxuICAgKiBgYGBqc1xuICAgKiBFeGFtcGxlIGluaXRpYWxIb2xkZXJzOlxuICAgKiBbXG4gICAqICAge1xuICAgKiAgICAgXCJhZGRyZXNzXCI6IFwiU3dhcC1heGMxa2owNmxoZ3g4NGgzOXNuc2xqY2V5M3RwYzA0NnplNjhtZWszZzVcIixcbiAgICogICAgIFwiYW1vdW50XCI6IDEwMDAwXG4gICAqICAgfSxcbiAgICogICB7XG4gICAqICAgICBcImFkZHJlc3NcIjogXCJTd2FwLWF4YzFhbTR3NmhmcnZtaDNha2R1emtqdGhydGd0cWFmYWxjZTZhbjhjclwiLFxuICAgKiAgICAgXCJhbW91bnRcIjogNTAwMDBcbiAgICogICB9XG4gICAqIF1cbiAgICogYGBgXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIHN0cmluZyBjb250YWluaW5nIHRoZSBiYXNlIDU4IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgSUQgb2YgdGhlIG5ld2x5IGNyZWF0ZWQgYXNzZXQuXG4gICAqL1xuICBjcmVhdGVGaXhlZENhcEFzc2V0ID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc3ltYm9sOiBzdHJpbmcsXG4gICAgZGVub21pbmF0aW9uOiBudW1iZXIsXG4gICAgaW5pdGlhbEhvbGRlcnM6IG9iamVjdFtdXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBDcmVhdGVGaXhlZENhcEFzc2V0UGFyYW1zID0ge1xuICAgICAgbmFtZSxcbiAgICAgIHN5bWJvbCxcbiAgICAgIGRlbm9taW5hdGlvbixcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBpbml0aWFsSG9sZGVyc1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXZtLmNyZWF0ZUZpeGVkQ2FwQXNzZXRcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYXNzZXRJRFxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyB2YXJpYWJsZS1jYXAsIGZ1bmdpYmxlIGFzc2V0LiBObyB1bml0cyBvZiB0aGUgYXNzZXQgZXhpc3QgYXQgaW5pdGlhbGl6YXRpb24uIE1pbnRlcnMgY2FuIG1pbnQgdW5pdHMgb2YgdGhpcyBhc3NldCB1c2luZyBjcmVhdGVNaW50VHgsIHNpZ25NaW50VHggYW5kIHNlbmRNaW50VHguXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlciBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZSAoaW4gJEFYQykgZm9yIGFzc2V0IGNyZWF0aW9uXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgZm9yIHRoZSB1c2VyIHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIChpbiAkQVhDKSBmb3IgYXNzZXQgY3JlYXRpb25cbiAgICogQHBhcmFtIG5hbWUgVGhlIGh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSBhc3NldFxuICAgKiBAcGFyYW0gc3ltYm9sIE9wdGlvbmFsLiBUaGUgc2hvcnRoYW5kIHN5bWJvbCBmb3IgdGhlIGFzc2V0IC0tIGJldHdlZW4gMCBhbmQgNCBjaGFyYWN0ZXJzXG4gICAqIEBwYXJhbSBkZW5vbWluYXRpb24gT3B0aW9uYWwuIERldGVybWluZXMgaG93IGJhbGFuY2VzIG9mIHRoaXMgYXNzZXQgYXJlIGRpc3BsYXllZCBieSB1c2VyIGludGVyZmFjZXMuIERlZmF1bHQgaXMgMFxuICAgKiBAcGFyYW0gbWludGVyU2V0cyBpcyBhIGxpc3Qgd2hlcmUgZWFjaCBlbGVtZW50IHNwZWNpZmllcyB0aGF0IHRocmVzaG9sZCBvZiB0aGUgYWRkcmVzc2VzIGluIG1pbnRlcnMgbWF5IHRvZ2V0aGVyIG1pbnQgbW9yZSBvZiB0aGUgYXNzZXQgYnkgc2lnbmluZyBhIG1pbnRpbmcgdHJhbnNhY3Rpb25cbiAgICpcbiAgICogYGBganNcbiAgICogRXhhbXBsZSBtaW50ZXJTZXRzOlxuICAgKiBbXG4gICAqICAgIHtcbiAgICogICAgICBcIm1pbnRlcnNcIjpbXG4gICAqICAgICAgICBcIlN3YXAtYXhjMWFtNHc2aGZydm1oM2FrZHV6a2p0aHJ0Z3RxYWZhbGNlNmFuOGNyXCJcbiAgICogICAgICBdLFxuICAgKiAgICAgIFwidGhyZXNob2xkXCI6IDFcbiAgICogICAgIH0sXG4gICAqICAgICB7XG4gICAqICAgICAgXCJtaW50ZXJzXCI6IFtcbiAgICogICAgICAgIFwiU3dhcC1heGMxYW00dzZoZnJ2bWgzYWtkdXpranRocnRndHFhZmFsY2U2YW44Y3JcIixcbiAgICogICAgICAgIFwiU3dhcC1heGMxa2owNmxoZ3g4NGgzOXNuc2xqY2V5M3RwYzA0NnplNjhtZWszZzVcIixcbiAgICogICAgICAgIFwiU3dhcC1heGMxeWVsbDNlNG5sbjBtMzljZnBkaGdxcHJzZDg3amtoNHFuYWtrbHhcIlxuICAgKiAgICAgIF0sXG4gICAqICAgICAgXCJ0aHJlc2hvbGRcIjogMlxuICAgKiAgICAgfVxuICAgKiBdXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgY29udGFpbmluZyB0aGUgYmFzZSA1OCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIElEIG9mIHRoZSBuZXdseSBjcmVhdGVkIGFzc2V0LlxuICAgKi9cbiAgY3JlYXRlVmFyaWFibGVDYXBBc3NldCA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHN5bWJvbDogc3RyaW5nLFxuICAgIGRlbm9taW5hdGlvbjogbnVtYmVyLFxuICAgIG1pbnRlclNldHM6IG9iamVjdFtdXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBDcmVhdGVWYXJpYWJsZUNhcEFzc2V0UGFyYW1zID0ge1xuICAgICAgbmFtZSxcbiAgICAgIHN5bWJvbCxcbiAgICAgIGRlbm9taW5hdGlvbixcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBtaW50ZXJTZXRzXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhdm0uY3JlYXRlVmFyaWFibGVDYXBBc3NldFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5hc3NldElEXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGZhbWlseSBvZiBORlQgQXNzZXQuIE5vIHVuaXRzIG9mIHRoZSBhc3NldCBleGlzdCBhdCBpbml0aWFsaXphdGlvbi4gTWludGVycyBjYW4gbWludCB1bml0cyBvZiB0aGlzIGFzc2V0IHVzaW5nIGNyZWF0ZU1pbnRUeCwgc2lnbk1pbnRUeCBhbmQgc2VuZE1pbnRUeC5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VyIHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIChpbiAkQVhDKSBmb3IgYXNzZXQgY3JlYXRpb25cbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBmb3IgdGhlIHVzZXIgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUgKGluICRBWEMpIGZvciBhc3NldCBjcmVhdGlvblxuICAgKiBAcGFyYW0gZnJvbSBPcHRpb25hbC4gQW4gYXJyYXkgb2YgYWRkcmVzc2VzIG1hbmFnZWQgYnkgdGhlIG5vZGUncyBrZXlzdG9yZSBmb3IgdGhpcyBibG9ja2NoYWluIHdoaWNoIHdpbGwgZnVuZCB0aGlzIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyIE9wdGlvbmFsLiBBbiBhZGRyZXNzIHRvIHNlbmQgdGhlIGNoYW5nZVxuICAgKiBAcGFyYW0gbmFtZSBUaGUgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIGFzc2V0XG4gICAqIEBwYXJhbSBzeW1ib2wgT3B0aW9uYWwuIFRoZSBzaG9ydGhhbmQgc3ltYm9sIGZvciB0aGUgYXNzZXQgLS0gYmV0d2VlbiAwIGFuZCA0IGNoYXJhY3RlcnNcbiAgICogQHBhcmFtIG1pbnRlclNldHMgaXMgYSBsaXN0IHdoZXJlIGVhY2ggZWxlbWVudCBzcGVjaWZpZXMgdGhhdCB0aHJlc2hvbGQgb2YgdGhlIGFkZHJlc3NlcyBpbiBtaW50ZXJzIG1heSB0b2dldGhlciBtaW50IG1vcmUgb2YgdGhlIGFzc2V0IGJ5IHNpZ25pbmcgYSBtaW50aW5nIHRyYW5zYWN0aW9uXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIHN0cmluZyBjb250YWluaW5nIHRoZSBiYXNlIDU4IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgSUQgb2YgdGhlIG5ld2x5IGNyZWF0ZWQgYXNzZXQuXG4gICAqL1xuICBjcmVhdGVORlRBc3NldCA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgZnJvbTogc3RyaW5nW10gfCBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcbiAgICBjaGFuZ2VBZGRyOiBzdHJpbmcsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHN5bWJvbDogc3RyaW5nLFxuICAgIG1pbnRlclNldDogSU1pbnRlclNldFxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQ3JlYXRlTkZUQXNzZXRQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgbmFtZSxcbiAgICAgIHN5bWJvbCxcbiAgICAgIG1pbnRlclNldFxuICAgIH1cblxuICAgIGNvbnN0IGNhbGxlcjogc3RyaW5nID0gXCJjcmVhdGVORlRBc3NldFwiXG4gICAgZnJvbSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb20sIGNhbGxlcilcbiAgICBpZiAodHlwZW9mIGZyb20gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtc1tcImZyb21cIl0gPSBmcm9tXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjaGFuZ2VBZGRyICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGNoYW5nZUFkZHIpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXG4gICAgICAgICAgXCJFcnJvciAtIEFWTUFQSS5jcmVhdGVORlRBc3NldDogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiXG4gICAgICAgIClcbiAgICAgIH1cbiAgICAgIHBhcmFtc1tcImNoYW5nZUFkZHJcIl0gPSBjaGFuZ2VBZGRyXG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF2bS5jcmVhdGVORlRBc3NldFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5hc3NldElEXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIHRvIG1pbnQgbW9yZSBvZiBhbiBhc3NldC5cbiAgICpcbiAgICogQHBhcmFtIGFtb3VudCBUaGUgdW5pdHMgb2YgdGhlIGFzc2V0IHRvIG1pbnRcbiAgICogQHBhcmFtIGFzc2V0SUQgVGhlIElEIG9mIHRoZSBhc3NldCB0byBtaW50XG4gICAqIEBwYXJhbSB0byBUaGUgYWRkcmVzcyB0byBhc3NpZ24gdGhlIHVuaXRzIG9mIHRoZSBtaW50ZWQgYXNzZXRcbiAgICogQHBhcmFtIG1pbnRlcnMgQWRkcmVzc2VzIG9mIHRoZSBtaW50ZXJzIHJlc3BvbnNpYmxlIGZvciBzaWduaW5nIHRoZSB0cmFuc2FjdGlvblxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgY29udGFpbmluZyB0aGUgYmFzZSA1OCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHVuc2lnbmVkIHRyYW5zYWN0aW9uLlxuICAgKi9cbiAgbWludCA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgYW1vdW50OiBudW1iZXIgfCBCTixcbiAgICBhc3NldElEOiBCdWZmZXIgfCBzdHJpbmcsXG4gICAgdG86IHN0cmluZyxcbiAgICBtaW50ZXJzOiBzdHJpbmdbXVxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGxldCBhc3NldDogc3RyaW5nXG4gICAgbGV0IGFtbnQ6IEJOXG4gICAgaWYgKHR5cGVvZiBhc3NldElEICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICBhc3NldCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoYXNzZXRJRClcbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXQgPSBhc3NldElEXG4gICAgfVxuICAgIGlmICh0eXBlb2YgYW1vdW50ID09PSBcIm51bWJlclwiKSB7XG4gICAgICBhbW50ID0gbmV3IEJOKGFtb3VudClcbiAgICB9IGVsc2Uge1xuICAgICAgYW1udCA9IGFtb3VudFxuICAgIH1cbiAgICBjb25zdCBwYXJhbXM6IE1pbnRQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZTogdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZDogcGFzc3dvcmQsXG4gICAgICBhbW91bnQ6IGFtbnQsXG4gICAgICBhc3NldElEOiBhc3NldCxcbiAgICAgIHRvLFxuICAgICAgbWludGVyc1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXZtLm1pbnRcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICB9XG5cbiAgLyoqXG4gICAqIE1pbnQgbm9uLWZ1bmdpYmxlIHRva2VucyB3aGljaCB3ZXJlIGNyZWF0ZWQgd2l0aCBBVk1BUEkuY3JlYXRlTkZUQXNzZXRcbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VyIHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIChpbiAkQVhDKSBmb3IgYXNzZXQgY3JlYXRpb25cbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBmb3IgdGhlIHVzZXIgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUgKGluICRBWEMpIGZvciBhc3NldCBjcmVhdGlvblxuICAgKiBAcGFyYW0gZnJvbSBPcHRpb25hbC4gQW4gYXJyYXkgb2YgYWRkcmVzc2VzIG1hbmFnZWQgYnkgdGhlIG5vZGUncyBrZXlzdG9yZSBmb3IgdGhpcyBibG9ja2NoYWluIHdoaWNoIHdpbGwgZnVuZCB0aGlzIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyIE9wdGlvbmFsLiBBbiBhZGRyZXNzIHRvIHNlbmQgdGhlIGNoYW5nZVxuICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgYXNzZXQgaWQgd2hpY2ggaXMgYmVpbmcgc2VudFxuICAgKiBAcGFyYW0gdG8gQWRkcmVzcyBvbiBTd2FwQ2hhaW4gb2YgdGhlIGFjY291bnQgdG8gd2hpY2ggdGhpcyBORlQgaXMgYmVpbmcgc2VudFxuICAgKiBAcGFyYW0gZW5jb2RpbmcgT3B0aW9uYWwuICBpcyB0aGUgZW5jb2RpbmcgZm9ybWF0IHRvIHVzZSBmb3IgdGhlIHBheWxvYWQgYXJndW1lbnQuIENhbiBiZSBlaXRoZXIgXCJjYjU4XCIgb3IgXCJoZXhcIi4gRGVmYXVsdHMgdG8gXCJoZXhcIi5cbiAgICpcbiAgICogQHJldHVybnMgSUQgb2YgdGhlIHRyYW5zYWN0aW9uXG4gICAqL1xuICBtaW50TkZUID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBmcm9tOiBzdHJpbmdbXSB8IEJ1ZmZlcltdID0gdW5kZWZpbmVkLFxuICAgIGNoYW5nZUFkZHI6IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBwYXlsb2FkOiBzdHJpbmcsXG4gICAgYXNzZXRJRDogc3RyaW5nIHwgQnVmZmVyLFxuICAgIHRvOiBzdHJpbmcsXG4gICAgZW5jb2Rpbmc6IHN0cmluZyA9IFwiaGV4XCJcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBsZXQgYXNzZXQ6IHN0cmluZ1xuXG4gICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyh0bykgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFwiRXJyb3IgLSBBVk1BUEkubWludE5GVDogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgYXNzZXRJRCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgYXNzZXQgPSBiaW50b29scy5jYjU4RW5jb2RlKGFzc2V0SUQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2V0ID0gYXNzZXRJRFxuICAgIH1cblxuICAgIGNvbnN0IHBhcmFtczogTWludE5GVFBhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBhc3NldElEOiBhc3NldCxcbiAgICAgIHBheWxvYWQsXG4gICAgICB0byxcbiAgICAgIGVuY29kaW5nXG4gICAgfVxuXG4gICAgY29uc3QgY2FsbGVyOiBzdHJpbmcgPSBcIm1pbnRORlRcIlxuICAgIGZyb20gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tLCBjYWxsZXIpXG4gICAgaWYgKHR5cGVvZiBmcm9tICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXNbXCJmcm9tXCJdID0gZnJvbVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgY2hhbmdlQWRkciAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhjaGFuZ2VBZGRyKSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFwiRXJyb3IgLSBBVk1BUEkubWludE5GVDogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKVxuICAgICAgfVxuICAgICAgcGFyYW1zW1wiY2hhbmdlQWRkclwiXSA9IGNoYW5nZUFkZHJcbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXZtLm1pbnRORlRcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgTkZUIGZyb20gb25lIGFjY291bnQgdG8gYW5vdGhlciBvbiBTd2FwQ2hhaW5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VyIHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIChpbiAkQVhDKSBmb3IgYXNzZXQgY3JlYXRpb25cbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBmb3IgdGhlIHVzZXIgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUgKGluICRBWEMpIGZvciBhc3NldCBjcmVhdGlvblxuICAgKiBAcGFyYW0gZnJvbSBPcHRpb25hbC4gQW4gYXJyYXkgb2YgYWRkcmVzc2VzIG1hbmFnZWQgYnkgdGhlIG5vZGUncyBrZXlzdG9yZSBmb3IgdGhpcyBibG9ja2NoYWluIHdoaWNoIHdpbGwgZnVuZCB0aGlzIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyIE9wdGlvbmFsLiBBbiBhZGRyZXNzIHRvIHNlbmQgdGhlIGNoYW5nZVxuICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgYXNzZXQgaWQgd2hpY2ggaXMgYmVpbmcgc2VudFxuICAgKiBAcGFyYW0gZ3JvdXBJRCBUaGUgZ3JvdXAgdGhpcyBORlQgaXMgaXNzdWVkIHRvLlxuICAgKiBAcGFyYW0gdG8gQWRkcmVzcyBvbiBTd2FwQ2hhaW4gb2YgdGhlIGFjY291bnQgdG8gd2hpY2ggdGhpcyBORlQgaXMgYmVpbmcgc2VudFxuICAgKlxuICAgKiBAcmV0dXJucyBJRCBvZiB0aGUgdHJhbnNhY3Rpb25cbiAgICovXG4gIHNlbmRORlQgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIGZyb206IHN0cmluZ1tdIHwgQnVmZmVyW10gPSB1bmRlZmluZWQsXG4gICAgY2hhbmdlQWRkcjogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIGFzc2V0SUQ6IHN0cmluZyB8IEJ1ZmZlcixcbiAgICBncm91cElEOiBudW1iZXIsXG4gICAgdG86IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGxldCBhc3NldDogc3RyaW5nXG5cbiAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKHRvKSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5zZW5kTkZUOiBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0XCIpXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBhc3NldElEICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICBhc3NldCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoYXNzZXRJRClcbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXQgPSBhc3NldElEXG4gICAgfVxuXG4gICAgY29uc3QgcGFyYW1zOiBTZW5kTkZUUGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIGFzc2V0SUQ6IGFzc2V0LFxuICAgICAgZ3JvdXBJRCxcbiAgICAgIHRvXG4gICAgfVxuXG4gICAgY29uc3QgY2FsbGVyOiBzdHJpbmcgPSBcInNlbmRORlRcIlxuICAgIGZyb20gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tLCBjYWxsZXIpXG4gICAgaWYgKHR5cGVvZiBmcm9tICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXNbXCJmcm9tXCJdID0gZnJvbVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgY2hhbmdlQWRkciAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhjaGFuZ2VBZGRyKSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFwiRXJyb3IgLSBBVk1BUEkuc2VuZE5GVDogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKVxuICAgICAgfVxuICAgICAgcGFyYW1zW1wiY2hhbmdlQWRkclwiXSA9IGNoYW5nZUFkZHJcbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXZtLnNlbmRORlRcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICB9XG5cbiAgLyoqXG4gICAqIEV4cG9ydHMgdGhlIHByaXZhdGUga2V5IGZvciBhbiBhZGRyZXNzLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIG5hbWUgb2YgdGhlIHVzZXIgd2l0aCB0aGUgcHJpdmF0ZSBrZXlcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCB1c2VkIHRvIGRlY3J5cHQgdGhlIHByaXZhdGUga2V5XG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIHdob3NlIHByaXZhdGUga2V5IHNob3VsZCBiZSBleHBvcnRlZFxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIHdpdGggdGhlIGRlY3J5cHRlZCBwcml2YXRlIGtleSBhcyBzdG9yZSBpbiB0aGUgZGF0YWJhc2VcbiAgICovXG4gIGV4cG9ydEtleSA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgYWRkcmVzczogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzKSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5leHBvcnRLZXk6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIilcbiAgICB9XG4gICAgY29uc3QgcGFyYW1zOiBFeHBvcnRLZXlQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgYWRkcmVzc1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXZtLmV4cG9ydEtleVwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5wcml2YXRlS2V5XG4gIH1cblxuICAvKipcbiAgICogSW1wb3J0cyBhIHByaXZhdGUga2V5IGludG8gdGhlIG5vZGUncyBrZXlzdG9yZSB1bmRlciBhbiB1c2VyIGFuZCBmb3IgYSBibG9ja2NoYWluLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIG5hbWUgb2YgdGhlIHVzZXIgdG8gc3RvcmUgdGhlIHByaXZhdGUga2V5XG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgdGhhdCB1bmxvY2tzIHRoZSB1c2VyXG4gICAqIEBwYXJhbSBwcml2YXRlS2V5IEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgcHJpdmF0ZSBrZXkgaW4gdGhlIHZtJ3MgZm9ybWF0XG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBhZGRyZXNzIGZvciB0aGUgaW1wb3J0ZWQgcHJpdmF0ZSBrZXkuXG4gICAqL1xuICBpbXBvcnRLZXkgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIHByaXZhdGVLZXk6IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogSW1wb3J0S2V5UGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIHByaXZhdGVLZXlcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF2bS5pbXBvcnRLZXlcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzc1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgQU5UIChBeGlhIE5hdGl2ZSBUb2tlbikgYXNzZXRzIGluY2x1ZGluZyBBWEMgZnJvbSB0aGUgU3dhcENoYWluIHRvIGFuIGFjY291bnQgb24gdGhlIENvcmVDaGFpbiBvciBBWENoYWluLlxuICAgKlxuICAgKiBBZnRlciBjYWxsaW5nIHRoaXMgbWV0aG9kLCB5b3UgbXVzdCBjYWxsIHRoZSBDb3JlQ2hhaW4ncyBgaW1wb3J0YCBvciB0aGUgQVhDaGFpbuKAmXMgYGltcG9ydGAgbWV0aG9kIHRvIGNvbXBsZXRlIHRoZSB0cmFuc2Zlci5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIENvcmVDaGFpbiBvciBBWENoYWluIGFjY291bnQgc3BlY2lmaWVkIGluIGB0b2BcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gdG8gVGhlIGFjY291bnQgb24gdGhlIENvcmVDaGFpbiBvciBBWENoYWluIHRvIHNlbmQgdGhlIGFzc2V0IHRvLlxuICAgKiBAcGFyYW0gYW1vdW50IEFtb3VudCBvZiBhc3NldCB0byBleHBvcnQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgYXNzZXQgaWQgd2hpY2ggaXMgYmVpbmcgc2VudFxuICAgKlxuICAgKiBAcmV0dXJucyBTdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB0cmFuc2FjdGlvbiBpZFxuICAgKi9cbiAgZXhwb3J0ID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICB0bzogc3RyaW5nLFxuICAgIGFtb3VudDogQk4sXG4gICAgYXNzZXRJRDogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBFeHBvcnRQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgdG8sXG4gICAgICBhbW91bnQ6IGFtb3VudCxcbiAgICAgIGFzc2V0SURcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF2bS5leHBvcnRcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgQU5UIChBeGlhIE5hdGl2ZSBUb2tlbikgYXNzZXRzIGluY2x1ZGluZyBBWEMgZnJvbSBhbiBhY2NvdW50IG9uIHRoZSBDb3JlQ2hhaW4gb3IgQVhDaGFpbiB0byBhbiBhZGRyZXNzIG9uIHRoZSBTd2FwQ2hhaW4uIFRoaXMgdHJhbnNhY3Rpb25cbiAgICogbXVzdCBiZSBzaWduZWQgd2l0aCB0aGUga2V5IG9mIHRoZSBhY2NvdW50IHRoYXQgdGhlIGFzc2V0IGlzIHNlbnQgZnJvbSBhbmQgd2hpY2ggcGF5c1xuICAgKiB0aGUgdHJhbnNhY3Rpb24gZmVlLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgYWNjb3VudCBzcGVjaWZpZWQgaW4gYHRvYFxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSB0byBUaGUgYWRkcmVzcyBvZiB0aGUgYWNjb3VudCB0aGUgYXNzZXQgaXMgc2VudCB0by5cbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIFRoZSBjaGFpbklEIHdoZXJlIHRoZSBmdW5kcyBhcmUgY29taW5nIGZyb20uIEV4OiBcIkFYXCJcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBzdHJpbmcgZm9yIHRoZSB0cmFuc2FjdGlvbiwgd2hpY2ggc2hvdWxkIGJlIHNlbnQgdG8gdGhlIG5ldHdvcmtcbiAgICogYnkgY2FsbGluZyBpc3N1ZVR4LlxuICAgKi9cbiAgaW1wb3J0ID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICB0bzogc3RyaW5nLFxuICAgIHNvdXJjZUNoYWluOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEltcG9ydFBhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICB0byxcbiAgICAgIHNvdXJjZUNoYWluXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhdm0uaW1wb3J0XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0cyBhbGwgdGhlIGFkZHJlc3NlcyB1bmRlciBhIHVzZXIuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlciB0byBsaXN0IGFkZHJlc3Nlc1xuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSB1c2VyIHRvIGxpc3QgdGhlIGFkZHJlc3Nlc1xuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIG9mIGFuIGFycmF5IG9mIGFkZHJlc3Mgc3RyaW5ncyBpbiB0aGUgZm9ybWF0IHNwZWNpZmllZCBieSB0aGUgYmxvY2tjaGFpbi5cbiAgICovXG4gIGxpc3RBZGRyZXNzZXMgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nW10+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IExpc3RBZGRyZXNzZXNQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhdm0ubGlzdEFkZHJlc3Nlc1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5hZGRyZXNzZXNcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYWxsIGFzc2V0cyBmb3IgYW4gYWRkcmVzcyBvbiBhIHNlcnZlciBhbmQgdGhlaXIgYXNzb2NpYXRlZCBiYWxhbmNlcy5cbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGFkZHJlc3MgdG8gZ2V0IGEgbGlzdCBvZiBhc3NldHNcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBvZiBhbiBvYmplY3QgbWFwcGluZyBhc3NldElEIHN0cmluZ3Mgd2l0aCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBiYWxhbmNlIGZvciB0aGUgYWRkcmVzcyBvbiB0aGUgYmxvY2tjaGFpbi5cbiAgICovXG4gIGdldEFsbEJhbGFuY2VzID0gYXN5bmMgKGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8b2JqZWN0W10+ID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGFkZHJlc3MpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFWTUFQSS5nZXRBbGxCYWxhbmNlczogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiXG4gICAgICApXG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczogR2V0QWxsQmFsYW5jZXNQYXJhbXMgPSB7XG4gICAgICBhZGRyZXNzXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhdm0uZ2V0QWxsQmFsYW5jZXNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYmFsYW5jZXNcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYW4gYXNzZXRzIG5hbWUgYW5kIHN5bWJvbC5cbiAgICpcbiAgICogQHBhcmFtIGFzc2V0SUQgRWl0aGVyIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYW4gYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgQXNzZXRJRCBvciBpdHMgYWxpYXMuXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIG9iamVjdCB3aXRoIGtleXMgXCJuYW1lXCIgYW5kIFwic3ltYm9sXCIuXG4gICAqL1xuICBnZXRBc3NldERlc2NyaXB0aW9uID0gYXN5bmMgKFxuICAgIGFzc2V0SUQ6IEJ1ZmZlciB8IHN0cmluZ1xuICApOiBQcm9taXNlPEdldEFzc2V0RGVzY3JpcHRpb25SZXNwb25zZT4gPT4ge1xuICAgIGxldCBhc3NldDogc3RyaW5nXG4gICAgaWYgKHR5cGVvZiBhc3NldElEICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICBhc3NldCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoYXNzZXRJRClcbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXQgPSBhc3NldElEXG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczogR2V0QXNzZXREZXNjcmlwdGlvblBhcmFtcyA9IHtcbiAgICAgIGFzc2V0SUQ6IGFzc2V0XG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhdm0uZ2V0QXNzZXREZXNjcmlwdGlvblwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiByZXNwb25zZS5kYXRhLnJlc3VsdC5uYW1lLFxuICAgICAgc3ltYm9sOiByZXNwb25zZS5kYXRhLnJlc3VsdC5zeW1ib2wsXG4gICAgICBhc3NldElEOiBiaW50b29scy5jYjU4RGVjb2RlKHJlc3BvbnNlLmRhdGEucmVzdWx0LmFzc2V0SUQpLFxuICAgICAgZGVub21pbmF0aW9uOiBwYXJzZUludChyZXNwb25zZS5kYXRhLnJlc3VsdC5kZW5vbWluYXRpb24sIDEwKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB0cmFuc2FjdGlvbiBkYXRhIG9mIGEgcHJvdmlkZWQgdHJhbnNhY3Rpb24gSUQgYnkgY2FsbGluZyB0aGUgbm9kZSdzIGBnZXRUeGAgbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gdHhJRCBUaGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB0cmFuc2FjdGlvbiBJRFxuICAgKiBAcGFyYW0gZW5jb2Rpbmcgc2V0cyB0aGUgZm9ybWF0IG9mIHRoZSByZXR1cm5lZCB0cmFuc2FjdGlvbi4gQ2FuIGJlLCBcImNiNThcIiwgXCJoZXhcIiBvciBcImpzb25cIi4gRGVmYXVsdHMgdG8gXCJjYjU4XCIuXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIHN0cmluZyBvciBvYmplY3QgY29udGFpbmluZyB0aGUgYnl0ZXMgcmV0cmlldmVkIGZyb20gdGhlIG5vZGVcbiAgICovXG4gIGdldFR4ID0gYXN5bmMgKFxuICAgIHR4SUQ6IHN0cmluZyxcbiAgICBlbmNvZGluZzogc3RyaW5nID0gXCJjYjU4XCJcbiAgKTogUHJvbWlzZTxzdHJpbmcgfCBvYmplY3Q+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldFR4UGFyYW1zID0ge1xuICAgICAgdHhJRCxcbiAgICAgIGVuY29kaW5nXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhdm0uZ2V0VHhcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBzdGF0dXMgb2YgYSBwcm92aWRlZCB0cmFuc2FjdGlvbiBJRCBieSBjYWxsaW5nIHRoZSBub2RlJ3MgYGdldFR4U3RhdHVzYCBtZXRob2QuXG4gICAqXG4gICAqIEBwYXJhbSB0eElEIFRoZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHRyYW5zYWN0aW9uIElEXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIHN0cmluZyBjb250YWluaW5nIHRoZSBzdGF0dXMgcmV0cmlldmVkIGZyb20gdGhlIG5vZGVcbiAgICovXG4gIGdldFR4U3RhdHVzID0gYXN5bmMgKHR4SUQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBHZXRUeFN0YXR1c1BhcmFtcyA9IHtcbiAgICAgIHR4SURcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF2bS5nZXRUeFN0YXR1c1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdGF0dXNcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIFVUWE9zIHJlbGF0ZWQgdG8gdGhlIGFkZHJlc3NlcyBwcm92aWRlZCBmcm9tIHRoZSBub2RlJ3MgYGdldFVUWE9zYCBtZXRob2QuXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIGNiNTggc3RyaW5ncyBvciBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1zXG4gICAqIEBwYXJhbSBzb3VyY2VDaGFpbiBBIHN0cmluZyBmb3IgdGhlIGNoYWluIHRvIGxvb2sgZm9yIHRoZSBVVFhPJ3MuIERlZmF1bHQgaXMgdG8gdXNlIHRoaXMgY2hhaW4sIGJ1dCBpZiBleHBvcnRlZCBVVFhPcyBleGlzdCBmcm9tIG90aGVyIGNoYWlucywgdGhpcyBjYW4gdXNlZCB0byBwdWxsIHRoZW0gaW5zdGVhZC5cbiAgICogQHBhcmFtIGxpbWl0IE9wdGlvbmFsLiBSZXR1cm5zIGF0IG1vc3QgW2xpbWl0XSBhZGRyZXNzZXMuIElmIFtsaW1pdF0gPT0gMCBvciA+IFttYXhVVFhPc1RvRmV0Y2hdLCBmZXRjaGVzIHVwIHRvIFttYXhVVFhPc1RvRmV0Y2hdLlxuICAgKiBAcGFyYW0gc3RhcnRJbmRleCBPcHRpb25hbC4gW1N0YXJ0SW5kZXhdIGRlZmluZXMgd2hlcmUgdG8gc3RhcnQgZmV0Y2hpbmcgVVRYT3MgKGZvciBwYWdpbmF0aW9uLilcbiAgICogVVRYT3MgZmV0Y2hlZCBhcmUgZnJvbSBhZGRyZXNzZXMgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuIFtTdGFydEluZGV4LkFkZHJlc3NdXG4gICAqIEZvciBhZGRyZXNzIFtTdGFydEluZGV4LkFkZHJlc3NdLCBvbmx5IFVUWE9zIHdpdGggSURzIGdyZWF0ZXIgdGhhbiBbU3RhcnRJbmRleC5VdHhvXSB3aWxsIGJlIHJldHVybmVkLlxuICAgKiBAcGFyYW0gcGVyc2lzdE9wdHMgT3B0aW9ucyBhdmFpbGFibGUgdG8gcGVyc2lzdCB0aGVzZSBVVFhPcyBpbiBsb2NhbCBzdG9yYWdlXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIHBlcnNpc3RPcHRzIGlzIG9wdGlvbmFsIGFuZCBtdXN0IGJlIG9mIHR5cGUgW1tQZXJzaXN0YW5jZU9wdGlvbnNdXVxuICAgKlxuICAgKi9cbiAgZ2V0VVRYT3MgPSBhc3luYyAoXG4gICAgYWRkcmVzc2VzOiBzdHJpbmdbXSB8IHN0cmluZyxcbiAgICBzb3VyY2VDaGFpbjogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIGxpbWl0OiBudW1iZXIgPSAwLFxuICAgIHN0YXJ0SW5kZXg6IHsgYWRkcmVzczogc3RyaW5nOyB1dHhvOiBzdHJpbmcgfSA9IHVuZGVmaW5lZCxcbiAgICBwZXJzaXN0T3B0czogUGVyc2lzdGFuY2VPcHRpb25zID0gdW5kZWZpbmVkXG4gICk6IFByb21pc2U8R2V0VVRYT3NSZXNwb25zZT4gPT4ge1xuICAgIGlmICh0eXBlb2YgYWRkcmVzc2VzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBhZGRyZXNzZXMgPSBbYWRkcmVzc2VzXVxuICAgIH1cblxuICAgIGNvbnN0IHBhcmFtczogR2V0VVRYT3NQYXJhbXMgPSB7XG4gICAgICBhZGRyZXNzZXM6IGFkZHJlc3NlcyxcbiAgICAgIGxpbWl0XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygc3RhcnRJbmRleCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBzdGFydEluZGV4KSB7XG4gICAgICBwYXJhbXMuc3RhcnRJbmRleCA9IHN0YXJ0SW5kZXhcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHNvdXJjZUNoYWluICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuc291cmNlQ2hhaW4gPSBzb3VyY2VDaGFpblxuICAgIH1cblxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhdm0uZ2V0VVRYT3NcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICBjb25zdCB1dHhvczogVVRYT1NldCA9IG5ldyBVVFhPU2V0KClcbiAgICBsZXQgZGF0YSA9IHJlc3BvbnNlLmRhdGEucmVzdWx0LnV0eG9zXG4gICAgaWYgKHBlcnNpc3RPcHRzICYmIHR5cGVvZiBwZXJzaXN0T3B0cyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgaWYgKHRoaXMuZGIuaGFzKHBlcnNpc3RPcHRzLmdldE5hbWUoKSkpIHtcbiAgICAgICAgY29uc3Qgc2VsZkFycmF5OiBzdHJpbmdbXSA9IHRoaXMuZGIuZ2V0KHBlcnNpc3RPcHRzLmdldE5hbWUoKSlcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc2VsZkFycmF5KSkge1xuICAgICAgICAgIHV0eG9zLmFkZEFycmF5KGRhdGEpXG4gICAgICAgICAgY29uc3QgdXR4b1NldDogVVRYT1NldCA9IG5ldyBVVFhPU2V0KClcbiAgICAgICAgICB1dHhvU2V0LmFkZEFycmF5KHNlbGZBcnJheSlcbiAgICAgICAgICB1dHhvU2V0Lm1lcmdlQnlSdWxlKHV0eG9zLCBwZXJzaXN0T3B0cy5nZXRNZXJnZVJ1bGUoKSlcbiAgICAgICAgICBkYXRhID0gdXR4b1NldC5nZXRBbGxVVFhPU3RyaW5ncygpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuZGIuc2V0KHBlcnNpc3RPcHRzLmdldE5hbWUoKSwgZGF0YSwgcGVyc2lzdE9wdHMuZ2V0T3ZlcndyaXRlKCkpXG4gICAgfVxuICAgIHV0eG9zLmFkZEFycmF5KGRhdGEsIGZhbHNlKVxuICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0LnV0eG9zID0gdXR4b3NcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbi4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgb2YgQXNzZXRJRCB0byBiZSBzcGVudCBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfS5cbiAgICogQHBhcmFtIGFzc2V0SUQgVGhlIGFzc2V0SUQgb2YgdGhlIHZhbHVlIGJlaW5nIHNlbnRcbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdG8gc2VuZCB0aGUgZnVuZHNcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHByb3ZpZGVkXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBDQjU4IEJ1ZmZlciBvciBTdHJpbmcgd2hpY2ggY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhIFtbQmFzZVR4XV0uXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgaGVscGVyIGV4aXN0cyBiZWNhdXNlIHRoZSBlbmRwb2ludCBBUEkgc2hvdWxkIGJlIHRoZSBwcmltYXJ5IHBvaW50IG9mIGVudHJ5IGZvciBtb3N0IGZ1bmN0aW9uYWxpdHkuXG4gICAqL1xuICBidWlsZEJhc2VUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIGFtb3VudDogQk4sXG4gICAgYXNzZXRJRDogQnVmZmVyIHwgc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIHRvQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBmcm9tQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyOiBzdHJpbmcgPSBcImJ1aWxkQmFzZVR4XCJcbiAgICBjb25zdCB0bzogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheSh0b0FkZHJlc3NlcywgY2FsbGVyKS5tYXAoXG4gICAgICAoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKVxuICAgIClcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsIGNhbGxlcikubWFwKFxuICAgICAgKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSlcbiAgICApXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXG5cbiAgICBpZiAodHlwZW9mIGFzc2V0SUQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGFzc2V0SUQgPSBiaW50b29scy5jYjU4RGVjb2RlKGFzc2V0SUQpXG4gICAgfVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBjb25zdCBibG9ja2NoYWluSURCdWY6IEJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpXG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0VHhGZWUoKVxuICAgIGNvbnN0IGZlZUFzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVhDQXNzZXRJRCgpXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZEJhc2VUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JREJ1ZixcbiAgICAgIGFtb3VudCxcbiAgICAgIGFzc2V0SUQsXG4gICAgICB0byxcbiAgICAgIGZyb20sXG4gICAgICBjaGFuZ2UsXG4gICAgICBmZWUsXG4gICAgICBmZWVBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBsb2NrdGltZSxcbiAgICAgIHRocmVzaG9sZFxuICAgIClcblxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBVk1BUEkuYnVpbGRCYXNlVHg6RmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiXG4gICAgICApXG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIE5GVCBUcmFuc2Zlci4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCAgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdG8gc2VuZCB0aGUgTkZUXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBORlQgZnJvbSB0aGUgdXR4b0lEIHByb3ZpZGVkXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gdXR4b2lkIEEgYmFzZTU4IHV0eG9JRCBvciBhbiBhcnJheSBvZiBiYXNlNTggdXR4b0lEcyBmb3IgdGhlIG5mdHMgdGhpcyB0cmFuc2FjdGlvbiBpcyBzZW5kaW5nXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGEgW1tORlRUcmFuc2ZlclR4XV0uXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgaGVscGVyIGV4aXN0cyBiZWNhdXNlIHRoZSBlbmRwb2ludCBBUEkgc2hvdWxkIGJlIHRoZSBwcmltYXJ5IHBvaW50IG9mIGVudHJ5IGZvciBtb3N0IGZ1bmN0aW9uYWxpdHkuXG4gICAqL1xuICBidWlsZE5GVFRyYW5zZmVyVHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICB1dHhvaWQ6IHN0cmluZyB8IHN0cmluZ1tdLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyOiBzdHJpbmcgPSBcImJ1aWxkTkZUVHJhbnNmZXJUeFwiXG4gICAgY29uc3QgdG86IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkodG9BZGRyZXNzZXMsIGNhbGxlcikubWFwKFxuICAgICAgKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSlcbiAgICApXG4gICAgY29uc3QgZnJvbTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tQWRkcmVzc2VzLCBjYWxsZXIpLm1hcChcbiAgICAgIChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpXG4gICAgKVxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuICAgIGNvbnN0IGF4Y0Fzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVhDQXNzZXRJRCgpXG5cbiAgICBsZXQgdXR4b2lkQXJyYXk6IHN0cmluZ1tdID0gW11cbiAgICBpZiAodHlwZW9mIHV0eG9pZCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdXR4b2lkQXJyYXkgPSBbdXR4b2lkXVxuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh1dHhvaWQpKSB7XG4gICAgICB1dHhvaWRBcnJheSA9IHV0eG9pZFxuICAgIH1cblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRORlRUcmFuc2ZlclR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICB0byxcbiAgICAgIGZyb20sXG4gICAgICBjaGFuZ2UsXG4gICAgICB1dHhvaWRBcnJheSxcbiAgICAgIHRoaXMuZ2V0VHhGZWUoKSxcbiAgICAgIGF4Y0Fzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZixcbiAgICAgIGxvY2t0aW1lLFxuICAgICAgdGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFWTUFQSS5idWlsZE5GVFRyYW5zZmVyVHg6RmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiXG4gICAgICApXG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIEltcG9ydCBUeC4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCAgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIG93bmVyQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBpbXBvcnRcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIFRoZSBjaGFpbmlkIGZvciB3aGVyZSB0aGUgaW1wb3J0IGlzIGNvbWluZyBmcm9tXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyBwcm92aWRlZFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBvdXRwdXRzXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIChbW1Vuc2lnbmVkVHhdXSkgd2hpY2ggY29udGFpbnMgYSBbW0ltcG9ydFR4XV0uXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoaXMgaGVscGVyIGV4aXN0cyBiZWNhdXNlIHRoZSBlbmRwb2ludCBBUEkgc2hvdWxkIGJlIHRoZSBwcmltYXJ5IHBvaW50IG9mIGVudHJ5IGZvciBtb3N0IGZ1bmN0aW9uYWxpdHkuXG4gICAqL1xuICBidWlsZEltcG9ydFR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgb3duZXJBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIHNvdXJjZUNoYWluOiBCdWZmZXIgfCBzdHJpbmcsXG4gICAgdG9BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGZyb21BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10gPSB1bmRlZmluZWQsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICAgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApLFxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwiYnVpbGRJbXBvcnRUeFwiXG4gICAgY29uc3QgdG86IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkodG9BZGRyZXNzZXMsIGNhbGxlcikubWFwKFxuICAgICAgKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSlcbiAgICApXG4gICAgY29uc3QgZnJvbTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tQWRkcmVzc2VzLCBjYWxsZXIpLm1hcChcbiAgICAgIChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpXG4gICAgKVxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuXG4gICAgbGV0IHNyYXhDaGFpbjogc3RyaW5nID0gdW5kZWZpbmVkXG5cbiAgICBpZiAodHlwZW9mIHNvdXJjZUNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aHJvdyBuZXcgQ2hhaW5JZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVZNQVBJLmJ1aWxkSW1wb3J0VHg6IFNvdXJjZSBDaGFpbklEIGlzIHVuZGVmaW5lZC5cIlxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNvdXJjZUNoYWluID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBzcmF4Q2hhaW4gPSBzb3VyY2VDaGFpblxuICAgICAgc291cmNlQ2hhaW4gPSBiaW50b29scy5jYjU4RGVjb2RlKHNvdXJjZUNoYWluKVxuICAgIH0gZWxzZSBpZiAoIShzb3VyY2VDaGFpbiBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBVk1BUEkuYnVpbGRJbXBvcnRUeDogSW52YWxpZCBkZXN0aW5hdGlvbkNoYWluIHR5cGU6IFwiICtcbiAgICAgICAgICB0eXBlb2Ygc291cmNlQ2hhaW5cbiAgICAgIClcbiAgICB9XG5cbiAgICBjb25zdCBhdG9taWNVVFhPczogVVRYT1NldCA9IChcbiAgICAgIGF3YWl0IHRoaXMuZ2V0VVRYT3Mob3duZXJBZGRyZXNzZXMsIHNyYXhDaGFpbiwgMCwgdW5kZWZpbmVkKVxuICAgICkudXR4b3NcbiAgICBjb25zdCBheGNBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFYQ0Fzc2V0SUQoKVxuICAgIGNvbnN0IGF0b21pY3M6IFVUWE9bXSA9IGF0b21pY1VUWE9zLmdldEFsbFVUWE9zKClcblxuICAgIGlmIChhdG9taWNzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IE5vQXRvbWljVVRYT3NFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFWTUFQSS5idWlsZEltcG9ydFR4OiBObyBhdG9taWMgVVRYT3MgdG8gaW1wb3J0IGZyb20gXCIgK1xuICAgICAgICAgIHNyYXhDaGFpbiArXG4gICAgICAgICAgXCIgdXNpbmcgYWRkcmVzc2VzOiBcIiArXG4gICAgICAgICAgb3duZXJBZGRyZXNzZXMuam9pbihcIiwgXCIpXG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZEltcG9ydFR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICB0byxcbiAgICAgIGZyb20sXG4gICAgICBjaGFuZ2UsXG4gICAgICBhdG9taWNzLFxuICAgICAgc291cmNlQ2hhaW4sXG4gICAgICB0aGlzLmdldFR4RmVlKCksXG4gICAgICBheGNBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBsb2NrdGltZSxcbiAgICAgIHRocmVzaG9sZFxuICAgIClcblxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBVk1BUEkuYnVpbGRJbXBvcnRUeDpGYWlsZWQgR29vc2UgRWdnIENoZWNrXCJcbiAgICAgIClcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgRXhwb3J0IFR4LiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBhbW91bnQgVGhlIGFtb3VudCBiZWluZyBleHBvcnRlZCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBkZXN0aW5hdGlvbkNoYWluIFRoZSBjaGFpbmlkIGZvciB3aGVyZSB0aGUgYXNzZXRzIHdpbGwgYmUgc2VudC5cbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdG8gc2VuZCB0aGUgZnVuZHNcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHByb3ZpZGVkXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBDQjU4IEJ1ZmZlciBvciBTdHJpbmcgd2hpY2ggY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgICogQHBhcmFtIGFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBhc3NldCB0byBzZW5kLiBEZWZhdWx0cyB0byBBWEMgYXNzZXRJRC5cbiAgICogUmVnYXJkbGVzcyBvZiB0aGUgYXNzZXQgd2hpY2ggeW91XCJyZSBleHBvcnRpbmcsIGFsbCBmZWVzIGFyZSBwYWlkIGluIEFYQy5cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhbiBbW0V4cG9ydFR4XV0uXG4gICAqL1xuICBidWlsZEV4cG9ydFR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgYW1vdW50OiBCTixcbiAgICBkZXN0aW5hdGlvbkNoYWluOiBCdWZmZXIgfCBzdHJpbmcsXG4gICAgdG9BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGZyb21BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10gPSB1bmRlZmluZWQsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICAgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApLFxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMSxcbiAgICBhc3NldElEOiBzdHJpbmcgPSB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgcHJlZml4ZXM6IG9iamVjdCA9IHt9XG4gICAgdG9BZGRyZXNzZXMubWFwKChhOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICAgIHByZWZpeGVzW2Euc3BsaXQoXCItXCIpWzBdXSA9IHRydWVcbiAgICB9KVxuICAgIGlmIChPYmplY3Qua2V5cyhwcmVmaXhlcykubGVuZ3RoICE9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVZNQVBJLmJ1aWxkRXhwb3J0VHg6IFRvIGFkZHJlc3NlcyBtdXN0IGhhdmUgdGhlIHNhbWUgY2hhaW5JRCBwcmVmaXguXCJcbiAgICAgIClcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGRlc3RpbmF0aW9uQ2hhaW4gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBVk1BUEkuYnVpbGRFeHBvcnRUeDogRGVzdGluYXRpb24gQ2hhaW5JRCBpcyB1bmRlZmluZWQuXCJcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBkZXN0aW5hdGlvbkNoYWluID0gYmludG9vbHMuY2I1OERlY29kZShkZXN0aW5hdGlvbkNoYWluKSAvL1xuICAgIH0gZWxzZSBpZiAoIShkZXN0aW5hdGlvbkNoYWluIGluc3RhbmNlb2YgQnVmZmVyKSkge1xuICAgICAgdGhyb3cgbmV3IENoYWluSWRFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFWTUFQSS5idWlsZEV4cG9ydFR4OiBJbnZhbGlkIGRlc3RpbmF0aW9uQ2hhaW4gdHlwZTogXCIgK1xuICAgICAgICAgIHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluXG4gICAgICApXG4gICAgfVxuICAgIGlmIChkZXN0aW5hdGlvbkNoYWluLmxlbmd0aCAhPT0gMzIpIHtcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBVk1BUEkuYnVpbGRFeHBvcnRUeDogRGVzdGluYXRpb24gQ2hhaW5JRCBtdXN0IGJlIDMyIGJ5dGVzIGluIGxlbmd0aC5cIlxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IHRvOiBCdWZmZXJbXSA9IFtdXG4gICAgdG9BZGRyZXNzZXMubWFwKChhOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICAgIHRvLnB1c2goYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuICAgIH0pXG5cbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwiYnVpbGRFeHBvcnRUeFwiXG4gICAgY29uc3QgZnJvbTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tQWRkcmVzc2VzLCBjYWxsZXIpLm1hcChcbiAgICAgIChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpXG4gICAgKVxuXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXG5cbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBjb25zdCBheGNBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFYQ0Fzc2V0SUQoKVxuICAgIGlmICh0eXBlb2YgYXNzZXRJRCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgYXNzZXRJRCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoYXhjQXNzZXRJRClcbiAgICB9XG5cbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRClcbiAgICBjb25zdCBhc3NldElEQnVmOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKGFzc2V0SUQpXG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0VHhGZWUoKVxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRFeHBvcnRUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIGFtb3VudCxcbiAgICAgIGFzc2V0SURCdWYsXG4gICAgICB0byxcbiAgICAgIGZyb20sXG4gICAgICBjaGFuZ2UsXG4gICAgICBkZXN0aW5hdGlvbkNoYWluLFxuICAgICAgZmVlLFxuICAgICAgYXhjQXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mLFxuICAgICAgbG9ja3RpbWUsXG4gICAgICB0aHJlc2hvbGRcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVZNQVBJLmJ1aWxkRXhwb3J0VHg6RmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiXG4gICAgICApXG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gdW5zaWduZWQgdHJhbnNhY3Rpb24uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gaW5pdGlhbFN0YXRlIFRoZSBbW0luaXRpYWxTdGF0ZXNdXSB0aGF0IHJlcHJlc2VudCB0aGUgaW50aWFsIHN0YXRlIG9mIGEgY3JlYXRlZCBhc3NldFxuICAgKiBAcGFyYW0gbmFtZSBTdHJpbmcgZm9yIHRoZSBkZXNjcmlwdGl2ZSBuYW1lIG9mIHRoZSBhc3NldFxuICAgKiBAcGFyYW0gc3ltYm9sIFN0cmluZyBmb3IgdGhlIHRpY2tlciBzeW1ib2wgb2YgdGhlIGFzc2V0XG4gICAqIEBwYXJhbSBkZW5vbWluYXRpb24gTnVtYmVyIGZvciB0aGUgZGVub21pbmF0aW9uIHdoaWNoIGlzIDEwXkQuIEQgbXVzdCBiZSA+PSAwIGFuZCA8PSAzMi4gRXg6ICQxIEFYQyA9IDEwXjkgJG5BWENcbiAgICogQHBhcmFtIG1pbnRPdXRwdXRzIE9wdGlvbmFsLiBBcnJheSBvZiBbW1NFQ1BNaW50T3V0cHV0XV1zIHRvIGJlIGluY2x1ZGVkIGluIHRoZSB0cmFuc2FjdGlvbi4gVGhlc2Ugb3V0cHV0cyBjYW4gYmUgc3BlbnQgdG8gbWludCBtb3JlIHRva2Vucy5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIChbW1Vuc2lnbmVkVHhdXSkgd2hpY2ggY29udGFpbnMgYSBbW0NyZWF0ZUFzc2V0VHhdXS5cbiAgICpcbiAgICovXG4gIGJ1aWxkQ3JlYXRlQXNzZXRUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIGZyb21BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgaW5pdGlhbFN0YXRlczogSW5pdGlhbFN0YXRlcyxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc3ltYm9sOiBzdHJpbmcsXG4gICAgZGVub21pbmF0aW9uOiBudW1iZXIsXG4gICAgbWludE91dHB1dHM6IFNFQ1BNaW50T3V0cHV0W10gPSB1bmRlZmluZWQsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KClcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyOiBzdHJpbmcgPSBcImJ1aWxkQ3JlYXRlQXNzZXRUeFwiXG4gICAgY29uc3QgZnJvbTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tQWRkcmVzc2VzLCBjYWxsZXIpLm1hcChcbiAgICAgIChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpXG4gICAgKVxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgaWYgKHN5bWJvbC5sZW5ndGggPiBBVk1Db25zdGFudHMuU1lNQk9MTUFYTEVOKSB7XG4gICAgICB0aHJvdyBuZXcgU3ltYm9sRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBVk1BUEkuYnVpbGRDcmVhdGVBc3NldFR4OiBTeW1ib2xzIG1heSBub3QgZXhjZWVkIGxlbmd0aCBvZiBcIiArXG4gICAgICAgICAgQVZNQ29uc3RhbnRzLlNZTUJPTE1BWExFTlxuICAgICAgKVxuICAgIH1cbiAgICBpZiAobmFtZS5sZW5ndGggPiBBVk1Db25zdGFudHMuQVNTRVROQU1FTEVOKSB7XG4gICAgICB0aHJvdyBuZXcgTmFtZUVycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVZNQVBJLmJ1aWxkQ3JlYXRlQXNzZXRUeDogTmFtZXMgbWF5IG5vdCBleGNlZWQgbGVuZ3RoIG9mIFwiICtcbiAgICAgICAgICBBVk1Db25zdGFudHMuQVNTRVROQU1FTEVOXG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBjb25zdCBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpXG4gICAgY29uc3QgYXhjQXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBWENBc3NldElEKClcbiAgICBjb25zdCBmZWU6IEJOID0gdGhpcy5nZXREZWZhdWx0Q3JlYXRpb25UeEZlZSgpXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZENyZWF0ZUFzc2V0VHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgaW5pdGlhbFN0YXRlcyxcbiAgICAgIG5hbWUsXG4gICAgICBzeW1ib2wsXG4gICAgICBkZW5vbWluYXRpb24sXG4gICAgICBtaW50T3V0cHV0cyxcbiAgICAgIGZlZSxcbiAgICAgIGF4Y0Fzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZlxuICAgIClcblxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgsIGZlZSkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFWTUFQSS5idWlsZENyZWF0ZUFzc2V0VHg6RmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiXG4gICAgICApXG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgYnVpbGRTRUNQTWludFR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgbWludE93bmVyOiBTRUNQTWludE91dHB1dCxcbiAgICB0cmFuc2Zlck93bmVyOiBTRUNQVHJhbnNmZXJPdXRwdXQsXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBtaW50VVRYT0lEOiBzdHJpbmcsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KClcbiAgKTogUHJvbWlzZTxhbnk+ID0+IHtcbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwiYnVpbGRTRUNQTWludFR4XCJcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsIGNhbGxlcikubWFwKFxuICAgICAgKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSlcbiAgICApXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXG5cbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRClcbiAgICBjb25zdCBheGNBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFYQ0Fzc2V0SUQoKVxuICAgIGNvbnN0IGZlZTogQk4gPSB0aGlzLmdldE1pbnRUeEZlZSgpXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZFNFQ1BNaW50VHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBtaW50T3duZXIsXG4gICAgICB0cmFuc2Zlck93bmVyLFxuICAgICAgZnJvbSxcbiAgICAgIGNoYW5nZSxcbiAgICAgIG1pbnRVVFhPSUQsXG4gICAgICBmZWUsXG4gICAgICBheGNBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2ZcbiAgICApXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFWTUFQSS5idWlsZFNFQ1BNaW50VHg6RmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIG1pbnRlclNldHMgaXMgYSBsaXN0IHdoZXJlIGVhY2ggZWxlbWVudCBzcGVjaWZpZXMgdGhhdCB0aHJlc2hvbGQgb2YgdGhlIGFkZHJlc3NlcyBpbiBtaW50ZXJzIG1heSB0b2dldGhlciBtaW50IG1vcmUgb2YgdGhlIGFzc2V0IGJ5IHNpZ25pbmcgYSBtaW50aW5nIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBuYW1lIFN0cmluZyBmb3IgdGhlIGRlc2NyaXB0aXZlIG5hbWUgb2YgdGhlIGFzc2V0XG4gICAqIEBwYXJhbSBzeW1ib2wgU3RyaW5nIGZvciB0aGUgdGlja2VyIHN5bWJvbCBvZiB0aGUgYXNzZXRcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBtaW50IG91dHB1dFxuICAgKlxuICAgKiBgYGBqc1xuICAgKiBFeGFtcGxlIG1pbnRlclNldHM6XG4gICAqIFtcbiAgICogICAgICB7XG4gICAqICAgICAgICAgIFwibWludGVyc1wiOltcbiAgICogICAgICAgICAgICAgIFwiU3dhcC1heGMxZ2hzdGp1a3J0dzg5MzVscnlxdG5oNjQzeGU5YTk0dTN0Yzc1YzdcIlxuICAgKiAgICAgICAgICBdLFxuICAgKiAgICAgICAgICBcInRocmVzaG9sZFwiOiAxXG4gICAqICAgICAgfSxcbiAgICogICAgICB7XG4gICAqICAgICAgICAgIFwibWludGVyc1wiOiBbXG4gICAqICAgICAgICAgICAgICBcIlN3YXAtYXhjMXllbGwzZTRubG4wbTM5Y2ZwZGhncXByc2Q4N2praDRxbmFra2x4XCIsXG4gICAqICAgICAgICAgICAgICBcIlN3YXAtYXhjMWs0bnIyNmM4MGphcXV6bTkzNjlqNWE0c2htd2NqbjB2bWVtY2p6XCIsXG4gICAqICAgICAgICAgICAgICBcIlN3YXAtYXhjMXp0a3pzcmpua24wY2VrNXJ5dmhxc3dkdGNnMjNuaGdlM25ucjVlXCJcbiAgICogICAgICAgICAgXSxcbiAgICogICAgICAgICAgXCJ0aHJlc2hvbGRcIjogMlxuICAgKiAgICAgIH1cbiAgICogXVxuICAgKiBgYGBcbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhIFtbQ3JlYXRlQXNzZXRUeF1dLlxuICAgKlxuICAgKi9cbiAgYnVpbGRDcmVhdGVORlRBc3NldFR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBtaW50ZXJTZXRzOiBNaW50ZXJTZXRbXSxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc3ltYm9sOiBzdHJpbmcsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICAgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlcjogc3RyaW5nID0gXCJidWlsZENyZWF0ZU5GVEFzc2V0VHhcIlxuICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbUFkZHJlc3NlcywgY2FsbGVyKS5tYXAoXG4gICAgICAoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKVxuICAgIClcbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGlmIChuYW1lLmxlbmd0aCA+IEFWTUNvbnN0YW50cy5BU1NFVE5BTUVMRU4pIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgTmFtZUVycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVZNQVBJLmJ1aWxkQ3JlYXRlTkZUQXNzZXRUeDogTmFtZXMgbWF5IG5vdCBleGNlZWQgbGVuZ3RoIG9mIFwiICtcbiAgICAgICAgICBBVk1Db25zdGFudHMuQVNTRVROQU1FTEVOXG4gICAgICApXG4gICAgfVxuICAgIGlmIChzeW1ib2wubGVuZ3RoID4gQVZNQ29uc3RhbnRzLlNZTUJPTE1BWExFTikge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBTeW1ib2xFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFWTUFQSS5idWlsZENyZWF0ZU5GVEFzc2V0VHg6IFN5bWJvbHMgbWF5IG5vdCBleGNlZWQgbGVuZ3RoIG9mIFwiICtcbiAgICAgICAgICBBVk1Db25zdGFudHMuU1lNQk9MTUFYTEVOXG4gICAgICApXG4gICAgfVxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxuICAgIGNvbnN0IGNyZWF0aW9uVHhGZWU6IEJOID0gdGhpcy5nZXRDcmVhdGlvblR4RmVlKClcbiAgICBjb25zdCBheGNBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFYQ0Fzc2V0SUQoKVxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRDcmVhdGVORlRBc3NldFR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgZnJvbSxcbiAgICAgIGNoYW5nZSxcbiAgICAgIG1pbnRlclNldHMsXG4gICAgICBuYW1lLFxuICAgICAgc3ltYm9sLFxuICAgICAgY3JlYXRpb25UeEZlZSxcbiAgICAgIGF4Y0Fzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZixcbiAgICAgIGxvY2t0aW1lXG4gICAgKVxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgsIGNyZWF0aW9uVHhGZWUpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBVk1BUEkuYnVpbGRDcmVhdGVORlRBc3NldFR4OkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIlxuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbi4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCAgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIG93bmVycyBFaXRoZXIgYSBzaW5nbGUgb3IgYW4gYXJyYXkgb2YgW1tPdXRwdXRPd25lcnNdXSB0byBzZW5kIHRoZSBuZnQgb3V0cHV0XG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBORlQgZnJvbSB0aGUgdXR4b0lEIHByb3ZpZGVkXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gdXR4b2lkIEEgYmFzZTU4IHV0eG9JRCBvciBhbiBhcnJheSBvZiBiYXNlNTggdXR4b0lEcyBmb3IgdGhlIG5mdCBtaW50IG91dHB1dCB0aGlzIHRyYW5zYWN0aW9uIGlzIHNlbmRpbmdcbiAgICogQHBhcmFtIGdyb3VwSUQgT3B0aW9uYWwuIFRoZSBncm91cCB0aGlzIE5GVCBpcyBpc3N1ZWQgdG8uXG4gICAqIEBwYXJhbSBwYXlsb2FkIE9wdGlvbmFsLiBEYXRhIGZvciBORlQgUGF5bG9hZCBhcyBlaXRoZXIgYSBbW1BheWxvYWRCYXNlXV0gb3IgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBDQjU4IEJ1ZmZlciBvciBTdHJpbmcgd2hpY2ggY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhbiBbW09wZXJhdGlvblR4XV0uXG4gICAqXG4gICAqL1xuICBidWlsZENyZWF0ZU5GVE1pbnRUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIG93bmVyczogT3V0cHV0T3duZXJzW10gfCBPdXRwdXRPd25lcnMsXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICB1dHhvaWQ6IHN0cmluZyB8IHN0cmluZ1tdLFxuICAgIGdyb3VwSUQ6IG51bWJlciA9IDAsXG4gICAgcGF5bG9hZDogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KClcbiAgKTogUHJvbWlzZTxhbnk+ID0+IHtcbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwiYnVpbGRDcmVhdGVORlRNaW50VHhcIlxuICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbUFkZHJlc3NlcywgY2FsbGVyKS5tYXAoXG4gICAgICAoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKVxuICAgIClcbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGlmIChwYXlsb2FkIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIHBheWxvYWQgPSBwYXlsb2FkLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdXR4b2lkID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB1dHhvaWQgPSBbdXR4b2lkXVxuICAgIH1cblxuICAgIGNvbnN0IGF4Y0Fzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVhDQXNzZXRJRCgpXG5cbiAgICBpZiAob3duZXJzIGluc3RhbmNlb2YgT3V0cHV0T3duZXJzKSB7XG4gICAgICBvd25lcnMgPSBbb3duZXJzXVxuICAgIH1cblxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxuICAgIGNvbnN0IHR4RmVlOiBCTiA9IHRoaXMuZ2V0VHhGZWUoKVxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRDcmVhdGVORlRNaW50VHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBvd25lcnMsXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgdXR4b2lkLFxuICAgICAgZ3JvdXBJRCxcbiAgICAgIHBheWxvYWQsXG4gICAgICB0eEZlZSxcbiAgICAgIGF4Y0Fzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZlxuICAgIClcbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVZNQVBJLmJ1aWxkQ3JlYXRlTkZUTWludFR4OkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIlxuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIHRha2VzIGFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGFuZCBzaWducyBpdCwgcmV0dXJuaW5nIHRoZSByZXN1bHRpbmcgW1tUeF1dLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4IFRoZSB1bnNpZ25lZCB0cmFuc2FjdGlvbiBvZiB0eXBlIFtbVW5zaWduZWRUeF1dXG4gICAqXG4gICAqIEByZXR1cm5zIEEgc2lnbmVkIHRyYW5zYWN0aW9uIG9mIHR5cGUgW1tUeF1dXG4gICAqL1xuICBzaWduVHggPSAodXR4OiBVbnNpZ25lZFR4KTogVHggPT4gdXR4LnNpZ24odGhpcy5rZXljaGFpbilcblxuICAvKipcbiAgICogQ2FsbHMgdGhlIG5vZGUncyBpc3N1ZVR4IG1ldGhvZCBmcm9tIHRoZSBBUEkgYW5kIHJldHVybnMgdGhlIHJlc3VsdGluZyB0cmFuc2FjdGlvbiBJRCBhcyBhIHN0cmluZy5cbiAgICpcbiAgICogQHBhcmFtIHR4IEEgc3RyaW5nLCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSwgb3IgW1tUeF1dIHJlcHJlc2VudGluZyBhIHRyYW5zYWN0aW9uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgUHJvbWlzZSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB0cmFuc2FjdGlvbiBJRCBvZiB0aGUgcG9zdGVkIHRyYW5zYWN0aW9uLlxuICAgKi9cbiAgaXNzdWVUeCA9IGFzeW5jICh0eDogc3RyaW5nIHwgQnVmZmVyIHwgVHgpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGxldCBUcmFuc2FjdGlvbiA9IFwiXCJcbiAgICBpZiAodHlwZW9mIHR4ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBUcmFuc2FjdGlvbiA9IHR4XG4gICAgfSBlbHNlIGlmICh0eCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgY29uc3QgdHhvYmo6IFR4ID0gbmV3IFR4KClcbiAgICAgIHR4b2JqLmZyb21CdWZmZXIodHgpXG4gICAgICBUcmFuc2FjdGlvbiA9IHR4b2JqLnRvU3RyaW5nKClcbiAgICB9IGVsc2UgaWYgKHR4IGluc3RhbmNlb2YgVHgpIHtcbiAgICAgIFRyYW5zYWN0aW9uID0gdHgudG9TdHJpbmcoKVxuICAgIH0gZWxzZSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IFRyYW5zYWN0aW9uRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBVk1BUEkuaXNzdWVUeDogcHJvdmlkZWQgdHggaXMgbm90IGV4cGVjdGVkIHR5cGUgb2Ygc3RyaW5nLCBCdWZmZXIsIG9yIFR4XCJcbiAgICAgIClcbiAgICB9XG4gICAgY29uc3QgcGFyYW1zOiBJc3N1ZVR4UGFyYW1zID0ge1xuICAgICAgdHg6IFRyYW5zYWN0aW9uLnRvU3RyaW5nKClcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF2bS5pc3N1ZVR4XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyB0aGUgbm9kZSdzIGdldEFkZHJlc3NUeHMgbWV0aG9kIGZyb20gdGhlIEFQSSBhbmQgcmV0dXJucyB0cmFuc2FjdGlvbnMgY29ycmVzcG9uZGluZyB0byB0aGUgcHJvdmlkZWQgYWRkcmVzcyBhbmQgYXNzZXRJRFxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyBmb3Igd2hpY2ggd2UncmUgZmV0Y2hpbmcgcmVsYXRlZCB0cmFuc2FjdGlvbnMuXG4gICAqIEBwYXJhbSBjdXJzb3IgUGFnZSBudW1iZXIgb3Igb2Zmc2V0LlxuICAgKiBAcGFyYW0gcGFnZVNpemUgIE51bWJlciBvZiBpdGVtcyB0byByZXR1cm4gcGVyIHBhZ2UuIE9wdGlvbmFsLiBEZWZhdWx0cyB0byAxMDI0LiBJZiBbcGFnZVNpemVdID09IDAgb3IgW3BhZ2VTaXplXSA+IFttYXhQYWdlU2l6ZV0sIHRoZW4gaXQgZmV0Y2hlcyBhdCBtYXggW21heFBhZ2VTaXplXSB0cmFuc2FjdGlvbnNcbiAgICogQHBhcmFtIGFzc2V0SUQgT25seSByZXR1cm4gdHJhbnNhY3Rpb25zIHRoYXQgY2hhbmdlZCB0aGUgYmFsYW5jZSBvZiB0aGlzIGFzc2V0LiBNdXN0IGJlIGFuIElEIG9yIGFuIGFsaWFzIGZvciBhbiBhc3NldC5cbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIG9iamVjdCByZXByZXNlbnRpbmcgdGhlIGFycmF5IG9mIHRyYW5zYWN0aW9uIElEcyBhbmQgcGFnZSBvZmZzZXRcbiAgICovXG4gIGdldEFkZHJlc3NUeHMgPSBhc3luYyAoXG4gICAgYWRkcmVzczogc3RyaW5nLFxuICAgIGN1cnNvcjogbnVtYmVyLFxuICAgIHBhZ2VTaXplOiBudW1iZXIgfCB1bmRlZmluZWQsXG4gICAgYXNzZXRJRDogc3RyaW5nIHwgQnVmZmVyXG4gICk6IFByb21pc2U8R2V0QWRkcmVzc1R4c1Jlc3BvbnNlPiA9PiB7XG4gICAgbGV0IGFzc2V0OiBzdHJpbmdcbiAgICBsZXQgcGFnZVNpemVOdW06IG51bWJlclxuXG4gICAgaWYgKHR5cGVvZiBhc3NldElEICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICBhc3NldCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoYXNzZXRJRClcbiAgICB9IGVsc2Uge1xuICAgICAgYXNzZXQgPSBhc3NldElEXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBwYWdlU2l6ZSAhPT0gXCJudW1iZXJcIikge1xuICAgICAgcGFnZVNpemVOdW0gPSAwXG4gICAgfSBlbHNlIHtcbiAgICAgIHBhZ2VTaXplTnVtID0gcGFnZVNpemVcbiAgICB9XG5cbiAgICBjb25zdCBwYXJhbXM6IEdldEFkZHJlc3NUeHNQYXJhbXMgPSB7XG4gICAgICBhZGRyZXNzLFxuICAgICAgY3Vyc29yLFxuICAgICAgcGFnZVNpemU6IHBhZ2VTaXplTnVtLFxuICAgICAgYXNzZXRJRDogYXNzZXRcbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXZtLmdldEFkZHJlc3NUeHNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kcyBhbiBhbW91bnQgb2YgYXNzZXRJRCB0byB0aGUgc3BlY2lmaWVkIGFkZHJlc3MgZnJvbSBhIGxpc3Qgb2Ygb3duZWQgb2YgYWRkcmVzc2VzLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXIgdGhhdCBvd25zIHRoZSBwcml2YXRlIGtleXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBgZnJvbWAgYWRkcmVzc2VzXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgdW5sb2NraW5nIHRoZSB1c2VyXG4gICAqIEBwYXJhbSBhc3NldElEIFRoZSBhc3NldElEIG9mIHRoZSBhc3NldCB0byBzZW5kXG4gICAqIEBwYXJhbSBhbW91bnQgVGhlIGFtb3VudCBvZiB0aGUgYXNzZXQgdG8gYmUgc2VudFxuICAgKiBAcGFyYW0gdG8gVGhlIGFkZHJlc3Mgb2YgdGhlIHJlY2lwaWVudFxuICAgKiBAcGFyYW0gZnJvbSBPcHRpb25hbC4gQW4gYXJyYXkgb2YgYWRkcmVzc2VzIG1hbmFnZWQgYnkgdGhlIG5vZGUncyBrZXlzdG9yZSBmb3IgdGhpcyBibG9ja2NoYWluIHdoaWNoIHdpbGwgZnVuZCB0aGlzIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyIE9wdGlvbmFsLiBBbiBhZGRyZXNzIHRvIHNlbmQgdGhlIGNoYW5nZVxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbC4gQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIHRoZSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB0cmFuc2FjdGlvbidzIElELlxuICAgKi9cbiAgc2VuZCA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgYXNzZXRJRDogc3RyaW5nIHwgQnVmZmVyLFxuICAgIGFtb3VudDogbnVtYmVyIHwgQk4sXG4gICAgdG86IHN0cmluZyxcbiAgICBmcm9tOiBzdHJpbmdbXSB8IEJ1ZmZlcltdID0gdW5kZWZpbmVkLFxuICAgIGNoYW5nZUFkZHI6IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBzdHJpbmcgfCBCdWZmZXIgPSB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxTZW5kUmVzcG9uc2U+ID0+IHtcbiAgICBsZXQgYXNzZXQ6IHN0cmluZ1xuICAgIGxldCBhbW50OiBCTlxuXG4gICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyh0bykgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFwiRXJyb3IgLSBBVk1BUEkuc2VuZDogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgYXNzZXRJRCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgYXNzZXQgPSBiaW50b29scy5jYjU4RW5jb2RlKGFzc2V0SUQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2V0ID0gYXNzZXRJRFxuICAgIH1cbiAgICBpZiAodHlwZW9mIGFtb3VudCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgYW1udCA9IG5ldyBCTihhbW91bnQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFtbnQgPSBhbW91bnRcbiAgICB9XG5cbiAgICBjb25zdCBwYXJhbXM6IFNlbmRQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZTogdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZDogcGFzc3dvcmQsXG4gICAgICBhc3NldElEOiBhc3NldCxcbiAgICAgIGFtb3VudDogYW1udC50b1N0cmluZygxMCksXG4gICAgICB0bzogdG9cbiAgICB9XG5cbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwic2VuZFwiXG4gICAgZnJvbSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb20sIGNhbGxlcilcbiAgICBpZiAodHlwZW9mIGZyb20gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtc1tcImZyb21cIl0gPSBmcm9tXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjaGFuZ2VBZGRyICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGNoYW5nZUFkZHIpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5zZW5kOiBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0XCIpXG4gICAgICB9XG4gICAgICBwYXJhbXNbXCJjaGFuZ2VBZGRyXCJdID0gY2hhbmdlQWRkclxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbWVtbyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaWYgKHR5cGVvZiBtZW1vICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHBhcmFtc1tcIm1lbW9cIl0gPSBiaW50b29scy5jYjU4RW5jb2RlKG1lbW8pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJhbXNbXCJtZW1vXCJdID0gbWVtb1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXZtLnNlbmRcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kcyBhbiBhbW91bnQgb2YgYXNzZXRJRCB0byBhbiBhcnJheSBvZiBzcGVjaWZpZWQgYWRkcmVzc2VzIGZyb20gYSBsaXN0IG9mIG93bmVkIG9mIGFkZHJlc3Nlcy5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VyIHRoYXQgb3ducyB0aGUgcHJpdmF0ZSBrZXlzIGFzc29jaWF0ZWQgd2l0aCB0aGUgYGZyb21gIGFkZHJlc3Nlc1xuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIHVubG9ja2luZyB0aGUgdXNlclxuICAgKiBAcGFyYW0gc2VuZE91dHB1dHMgVGhlIGFycmF5IG9mIFNlbmRPdXRwdXRzLiBBIFNlbmRPdXRwdXQgaXMgYW4gb2JqZWN0IGxpdGVyYWwgd2hpY2ggY29udGFpbnMgYW4gYXNzZXRJRCwgYW1vdW50LCBhbmQgdG8uXG4gICAqIEBwYXJhbSBmcm9tIE9wdGlvbmFsLiBBbiBhcnJheSBvZiBhZGRyZXNzZXMgbWFuYWdlZCBieSB0aGUgbm9kZSdzIGtleXN0b3JlIGZvciB0aGlzIGJsb2NrY2hhaW4gd2hpY2ggd2lsbCBmdW5kIHRoaXMgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIGNoYW5nZUFkZHIgT3B0aW9uYWwuIEFuIGFkZHJlc3MgdG8gc2VuZCB0aGUgY2hhbmdlXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsLiBDQjU4IEJ1ZmZlciBvciBTdHJpbmcgd2hpY2ggY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgdGhlIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHRyYW5zYWN0aW9uXCJzIElELlxuICAgKi9cbiAgc2VuZE11bHRpcGxlID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBzZW5kT3V0cHV0czoge1xuICAgICAgYXNzZXRJRDogc3RyaW5nIHwgQnVmZmVyXG4gICAgICBhbW91bnQ6IG51bWJlciB8IEJOXG4gICAgICB0bzogc3RyaW5nXG4gICAgfVtdLFxuICAgIGZyb206IHN0cmluZ1tdIHwgQnVmZmVyW10gPSB1bmRlZmluZWQsXG4gICAgY2hhbmdlQWRkcjogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IHN0cmluZyB8IEJ1ZmZlciA9IHVuZGVmaW5lZFxuICApOiBQcm9taXNlPFNlbmRNdWx0aXBsZVJlc3BvbnNlPiA9PiB7XG4gICAgbGV0IGFzc2V0OiBzdHJpbmdcbiAgICBsZXQgYW1udDogQk5cbiAgICBjb25zdCBzT3V0cHV0czogU091dHB1dHNQYXJhbXNbXSA9IFtdXG5cbiAgICBzZW5kT3V0cHV0cy5mb3JFYWNoKFxuICAgICAgKG91dHB1dDoge1xuICAgICAgICBhc3NldElEOiBzdHJpbmcgfCBCdWZmZXJcbiAgICAgICAgYW1vdW50OiBudW1iZXIgfCBCTlxuICAgICAgICB0bzogc3RyaW5nXG4gICAgICB9KSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3Mob3V0cHV0LnRvKSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcbiAgICAgICAgICAgIFwiRXJyb3IgLSBBVk1BUEkuc2VuZE11bHRpcGxlOiBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0XCJcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvdXRwdXQuYXNzZXRJRCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIGFzc2V0ID0gYmludG9vbHMuY2I1OEVuY29kZShvdXRwdXQuYXNzZXRJRClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhc3NldCA9IG91dHB1dC5hc3NldElEXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvdXRwdXQuYW1vdW50ID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgYW1udCA9IG5ldyBCTihvdXRwdXQuYW1vdW50KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFtbnQgPSBvdXRwdXQuYW1vdW50XG4gICAgICAgIH1cbiAgICAgICAgc091dHB1dHMucHVzaCh7XG4gICAgICAgICAgdG86IG91dHB1dC50byxcbiAgICAgICAgICBhc3NldElEOiBhc3NldCxcbiAgICAgICAgICBhbW91bnQ6IGFtbnQudG9TdHJpbmcoMTApXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgKVxuXG4gICAgY29uc3QgcGFyYW1zOiBTZW5kTXVsdGlwbGVQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZTogdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZDogcGFzc3dvcmQsXG4gICAgICBvdXRwdXRzOiBzT3V0cHV0c1xuICAgIH1cblxuICAgIGNvbnN0IGNhbGxlcjogc3RyaW5nID0gXCJzZW5kXCJcbiAgICBmcm9tID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbSwgY2FsbGVyKVxuICAgIGlmICh0eXBlb2YgZnJvbSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLmZyb20gPSBmcm9tXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjaGFuZ2VBZGRyICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGNoYW5nZUFkZHIpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXCJFcnJvciAtIEFWTUFQSS5zZW5kOiBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0XCIpXG4gICAgICB9XG4gICAgICBwYXJhbXMuY2hhbmdlQWRkciA9IGNoYW5nZUFkZHJcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG1lbW8gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlmICh0eXBlb2YgbWVtbyAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICBwYXJhbXMubWVtbyA9IGJpbnRvb2xzLmNiNThFbmNvZGUobWVtbylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhcmFtcy5tZW1vID0gbWVtb1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXZtLnNlbmRNdWx0aXBsZVwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIEdpdmVuIGEgSlNPTiByZXByZXNlbnRhdGlvbiBvZiB0aGlzIFZpcnR1YWwgTWFjaGluZeKAmXMgZ2VuZXNpcyBzdGF0ZSwgY3JlYXRlIHRoZSBieXRlIHJlcHJlc2VudGF0aW9uIG9mIHRoYXQgc3RhdGUuXG4gICAqXG4gICAqIEBwYXJhbSBnZW5lc2lzRGF0YSBUaGUgYmxvY2tjaGFpbidzIGdlbmVzaXMgZGF0YSBvYmplY3RcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBvZiBhIHN0cmluZyBvZiBieXRlc1xuICAgKi9cbiAgYnVpbGRHZW5lc2lzID0gYXN5bmMgKGdlbmVzaXNEYXRhOiBvYmplY3QpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQnVpbGRHZW5lc2lzUGFyYW1zID0ge1xuICAgICAgZ2VuZXNpc0RhdGFcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF2bS5idWlsZEdlbmVzaXNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYnl0ZXNcbiAgfVxuXG4gIC8qKlxuICAgKiBAaWdub3JlXG4gICAqL1xuICBwcm90ZWN0ZWQgX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgIGFkZHJlc3Nlczogc3RyaW5nW10gfCBCdWZmZXJbXSxcbiAgICBjYWxsZXI6IHN0cmluZ1xuICApOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgYWRkcnM6IHN0cmluZ1tdID0gW11cbiAgICBjb25zdCBjaGFpbklEOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXG4gICAgICA/IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcbiAgICAgIDogdGhpcy5nZXRCbG9ja2NoYWluSUQoKVxuICAgIGlmIChhZGRyZXNzZXMgJiYgYWRkcmVzc2VzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBhZGRyZXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhZGRyZXNzZXNbYCR7aX1gXSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzZXNbYCR7aX1gXSBhcyBzdHJpbmcpID09PVxuICAgICAgICAgICAgXCJ1bmRlZmluZWRcIlxuICAgICAgICAgICkge1xuICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXG4gICAgICAgICAgICAgIFwiRXJyb3IgLSBBVk1BUEkuJHtjYWxsZXJ9OiBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0XCJcbiAgICAgICAgICAgIClcbiAgICAgICAgICB9XG4gICAgICAgICAgYWRkcnMucHVzaChhZGRyZXNzZXNbYCR7aX1gXSBhcyBzdHJpbmcpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgdHlwZTogU2VyaWFsaXplZFR5cGUgPSBcImJlY2gzMlwiXG4gICAgICAgICAgYWRkcnMucHVzaChcbiAgICAgICAgICAgIHNlcmlhbGl6YXRpb24uYnVmZmVyVG9UeXBlKFxuICAgICAgICAgICAgICBhZGRyZXNzZXNbYCR7aX1gXSBhcyBCdWZmZXIsXG4gICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICAgIHRoaXMuY29yZS5nZXRIUlAoKSxcbiAgICAgICAgICAgICAgY2hhaW5JRFxuICAgICAgICAgICAgKVxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYWRkcnNcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgaW5zdGFudGlhdGVkIGRpcmVjdGx5LiBJbnN0ZWFkIHVzZSB0aGUgW1tBeGlhLmFkZEFQYCR7SX1gXV0gbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gY29yZSBBIHJlZmVyZW5jZSB0byB0aGUgQXhpYSBjbGFzc1xuICAgKiBAcGFyYW0gYmFzZVVSTCBEZWZhdWx0cyB0byB0aGUgc3RyaW5nIFwiL2V4dC9iYy9Td2FwXCIgYXMgdGhlIHBhdGggdG8gYmxvY2tjaGFpbidzIGJhc2VVUkxcbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBUaGUgQmxvY2tjaGFpblwicyBJRC4gRGVmYXVsdHMgdG8gYW4gZW1wdHkgc3RyaW5nOiBcIlwiXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBjb3JlOiBBeGlhQ29yZSxcbiAgICBiYXNlVVJMOiBzdHJpbmcgPSBcIi9leHQvYmMvU3dhcFwiLFxuICAgIGJsb2NrY2hhaW5JRDogc3RyaW5nID0gXCJcIlxuICApIHtcbiAgICBzdXBlcihjb3JlLCBiYXNlVVJMKVxuICAgIHRoaXMuYmxvY2tjaGFpbklEID0gYmxvY2tjaGFpbklEXG4gICAgY29uc3QgbmV0SUQ6IG51bWJlciA9IGNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBpZiAoXG4gICAgICBuZXRJRCBpbiBEZWZhdWx0cy5uZXR3b3JrICYmXG4gICAgICBibG9ja2NoYWluSUQgaW4gRGVmYXVsdHMubmV0d29ya1tgJHtuZXRJRH1gXVxuICAgICkge1xuICAgICAgY29uc3QgeyBhbGlhcyB9ID0gRGVmYXVsdHMubmV0d29ya1tgJHtuZXRJRH1gXVtgJHtibG9ja2NoYWluSUR9YF1cbiAgICAgIHRoaXMua2V5Y2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5jb3JlLmdldEhSUCgpLCBhbGlhcylcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5rZXljaGFpbiA9IG5ldyBLZXlDaGFpbih0aGlzLmNvcmUuZ2V0SFJQKCksIGJsb2NrY2hhaW5JRClcbiAgICB9XG4gIH1cbn1cbiJdfQ==