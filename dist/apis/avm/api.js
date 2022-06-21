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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYXZtL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7O0dBR0c7QUFDSCxrREFBc0I7QUFDdEIsb0NBQWdDO0FBRWhDLG9FQUEyQztBQUMzQyxtQ0FBdUM7QUFDdkMsMkNBQTBDO0FBQzFDLHlDQUFxQztBQUNyQyw2QkFBcUM7QUFDckMsaURBQWlEO0FBR2pELGlFQUFxRDtBQUNyRCxrREFBOEM7QUFFOUMscURBQTJFO0FBRzNFLGdEQUFrRDtBQUVsRCwrQ0FRMkI7QUFDM0IsdUNBQTJEO0FBb0MzRDs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxhQUFhLEdBQWtCLHFCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFaEU7Ozs7OztHQU1HO0FBQ0gsTUFBYSxNQUFPLFNBQVEsaUJBQU87SUErN0RqQzs7Ozs7O09BTUc7SUFDSCxZQUNFLElBQWMsRUFDZCxVQUFrQixjQUFjLEVBQ2hDLGVBQXVCLEVBQUU7UUFFekIsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQTtRQTE4RHRCOztXQUVHO1FBQ08sYUFBUSxHQUFhLElBQUksbUJBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDekMsaUJBQVksR0FBVyxFQUFFLENBQUE7UUFDekIsb0JBQWUsR0FBVyxTQUFTLENBQUE7UUFDbkMsZUFBVSxHQUFXLFNBQVMsQ0FBQTtRQUM5QixVQUFLLEdBQU8sU0FBUyxDQUFBO1FBQ3JCLGtCQUFhLEdBQU8sU0FBUyxDQUFBO1FBQzdCLGNBQVMsR0FBTyxTQUFTLENBQUE7UUFFbkM7Ozs7V0FJRztRQUNILHVCQUFrQixHQUFHLEdBQVcsRUFBRTtZQUNoQyxJQUFJLE9BQU8sSUFBSSxDQUFDLGVBQWUsS0FBSyxXQUFXLEVBQUU7Z0JBQy9D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UUFBUSxFQUFFO29CQUN6QyxJQUNFLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBVyxDQUFDO3dCQUNyRCxXQUFXLEVBQ1g7d0JBQ0EsMEJBQTBCO3dCQUMxQixNQUFNLElBQUkscUJBQVksQ0FDcEIsa0RBQWtELENBQ25ELENBQUE7cUJBQ0Y7b0JBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBVyxDQUFDLENBQUE7aUJBQ3hDO3FCQUFNO29CQUNMLE1BQU0sSUFBSSxHQUFtQixRQUFRLENBQUE7b0JBQ3JDLEtBQUssQ0FBQyxJQUFJLENBQ1IsYUFBYSxDQUFDLFlBQVksQ0FDeEIsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQVcsRUFDM0IsSUFBSSxFQUNKLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQ2xCLE9BQU8sQ0FDUixDQUNGLENBQUE7aUJBQ0Y7YUFDRjtTQUNGO1FBQ0QsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0NBMkJGO0FBeDlERCx3QkF3OURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUFWTVxuICovXG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCJcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcbmltcG9ydCBBeGlhQ29yZSBmcm9tIFwiLi4vLi4vYXhpYVwiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IFVUWE8sIFVUWE9TZXQgfSBmcm9tIFwiLi91dHhvc1wiXG5pbXBvcnQgeyBBVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHsgS2V5Q2hhaW4gfSBmcm9tIFwiLi9rZXljaGFpblwiXG5pbXBvcnQgeyBUeCwgVW5zaWduZWRUeCB9IGZyb20gXCIuL3R4XCJcbmltcG9ydCB7IFBheWxvYWRCYXNlIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3BheWxvYWRcIlxuaW1wb3J0IHsgU0VDUE1pbnRPdXRwdXQgfSBmcm9tIFwiLi9vdXRwdXRzXCJcbmltcG9ydCB7IEluaXRpYWxTdGF0ZXMgfSBmcm9tIFwiLi9pbml0aWFsc3RhdGVzXCJcbmltcG9ydCB7IFVuaXhOb3cgfSBmcm9tIFwiLi4vLi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zXCJcbmltcG9ydCB7IEpSUENBUEkgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2pycGNhcGlcIlxuaW1wb3J0IHsgUmVxdWVzdFJlc3BvbnNlRGF0YSB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpYmFzZVwiXG5pbXBvcnQgeyBEZWZhdWx0cywgUHJpbWFyeUFzc2V0QWxpYXMsIE9ORUFYQyB9IGZyb20gXCIuLi8uLi91dGlscy9jb25zdGFudHNcIlxuaW1wb3J0IHsgTWludGVyU2V0IH0gZnJvbSBcIi4vbWludGVyc2V0XCJcbmltcG9ydCB7IFBlcnNpc3RhbmNlT3B0aW9ucyB9IGZyb20gXCIuLi8uLi91dGlscy9wZXJzaXN0ZW5jZW9wdGlvbnNcIlxuaW1wb3J0IHsgT3V0cHV0T3duZXJzIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9vdXRwdXRcIlxuaW1wb3J0IHsgU0VDUFRyYW5zZmVyT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXG5pbXBvcnQge1xuICBBZGRyZXNzRXJyb3IsXG4gIEdvb3NlRWdnQ2hlY2tFcnJvcixcbiAgQ2hhaW5JZEVycm9yLFxuICBOb0F0b21pY1VUWE9zRXJyb3IsXG4gIFN5bWJvbEVycm9yLFxuICBOYW1lRXJyb3IsXG4gIFRyYW5zYWN0aW9uRXJyb3Jcbn0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkVHlwZSB9IGZyb20gXCIuLi8uLi91dGlsc1wiXG5pbXBvcnQge1xuICBCdWlsZEdlbmVzaXNQYXJhbXMsXG4gIENyZWF0ZUFkZHJlc3NQYXJhbXMsXG4gIENyZWF0ZUZpeGVkQ2FwQXNzZXRQYXJhbXMsXG4gIENyZWF0ZVZhcmlhYmxlQ2FwQXNzZXRQYXJhbXMsXG4gIEV4cG9ydFBhcmFtcyxcbiAgRXhwb3J0S2V5UGFyYW1zLFxuICBHZXRBbGxCYWxhbmNlc1BhcmFtcyxcbiAgR2V0QXNzZXREZXNjcmlwdGlvblBhcmFtcyxcbiAgR2V0QVhDQXNzZXRJRFBhcmFtcyxcbiAgR2V0QmFsYW5jZVBhcmFtcyxcbiAgR2V0VHhQYXJhbXMsXG4gIEdldFR4U3RhdHVzUGFyYW1zLFxuICBHZXRVVFhPc1BhcmFtcyxcbiAgSW1wb3J0UGFyYW1zLFxuICBJbXBvcnRLZXlQYXJhbXMsXG4gIExpc3RBZGRyZXNzZXNQYXJhbXMsXG4gIE1pbnRQYXJhbXMsXG4gIFNlbmRNdWx0aXBsZVBhcmFtcyxcbiAgU091dHB1dHNQYXJhbXMsXG4gIEdldFVUWE9zUmVzcG9uc2UsXG4gIEdldEFzc2V0RGVzY3JpcHRpb25SZXNwb25zZSxcbiAgR2V0QmFsYW5jZVJlc3BvbnNlLFxuICBTZW5kUGFyYW1zLFxuICBTZW5kUmVzcG9uc2UsXG4gIFNlbmRNdWx0aXBsZVJlc3BvbnNlLFxuICBHZXRBZGRyZXNzVHhzUGFyYW1zLFxuICBHZXRBZGRyZXNzVHhzUmVzcG9uc2UsXG4gIENyZWF0ZU5GVEFzc2V0UGFyYW1zLFxuICBTZW5kTkZUUGFyYW1zLFxuICBNaW50TkZUUGFyYW1zLFxuICBJTWludGVyU2V0XG59IGZyb20gXCIuL2ludGVyZmFjZXNcIlxuaW1wb3J0IHsgSXNzdWVUeFBhcmFtcyB9IGZyb20gXCIuLi8uLi9jb21tb25cIlxuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHM6IEJpblRvb2xzID0gQmluVG9vbHMuZ2V0SW5zdGFuY2UoKVxuY29uc3Qgc2VyaWFsaXphdGlvbjogU2VyaWFsaXphdGlvbiA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKVxuXG4vKipcbiAqIENsYXNzIGZvciBpbnRlcmFjdGluZyB3aXRoIGEgbm9kZSBlbmRwb2ludCB0aGF0IGlzIHVzaW5nIHRoZSBBVk0uXG4gKlxuICogQGNhdGVnb3J5IFJQQ0FQSXNcbiAqXG4gKiBAcmVtYXJrcyBUaGlzIGV4dGVuZHMgdGhlIFtbSlJQQ0FQSV1dIGNsYXNzLiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgZGlyZWN0bHkgY2FsbGVkLiBJbnN0ZWFkLCB1c2UgdGhlIFtbQXhpYS5hZGRBUEldXSBmdW5jdGlvbiB0byByZWdpc3RlciB0aGlzIGludGVyZmFjZSB3aXRoIEF4aWEuXG4gKi9cbmV4cG9ydCBjbGFzcyBBVk1BUEkgZXh0ZW5kcyBKUlBDQVBJIHtcbiAgLyoqXG4gICAqIEBpZ25vcmVcbiAgICovXG4gIHByb3RlY3RlZCBrZXljaGFpbjogS2V5Q2hhaW4gPSBuZXcgS2V5Q2hhaW4oXCJcIiwgXCJcIilcbiAgcHJvdGVjdGVkIGJsb2NrY2hhaW5JRDogc3RyaW5nID0gXCJcIlxuICBwcm90ZWN0ZWQgYmxvY2tjaGFpbkFsaWFzOiBzdHJpbmcgPSB1bmRlZmluZWRcbiAgcHJvdGVjdGVkIEFYQ0Fzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZFxuICBwcm90ZWN0ZWQgdHhGZWU6IEJOID0gdW5kZWZpbmVkXG4gIHByb3RlY3RlZCBjcmVhdGlvblR4RmVlOiBCTiA9IHVuZGVmaW5lZFxuICBwcm90ZWN0ZWQgbWludFR4RmVlOiBCTiA9IHVuZGVmaW5lZFxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRCBpZiBpdCBleGlzdHMsIG90aGVyd2lzZSByZXR1cm5zIGB1bmRlZmluZWRgLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYWxpYXMgZm9yIHRoZSBibG9ja2NoYWluSURcbiAgICovXG4gIGdldEJsb2NrY2hhaW5BbGlhcyA9ICgpOiBzdHJpbmcgPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5ibG9ja2NoYWluQWxpYXMgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGNvbnN0IG5ldGlkOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICAgIGlmIChcbiAgICAgICAgbmV0aWQgaW4gRGVmYXVsdHMubmV0d29yayAmJlxuICAgICAgICB0aGlzLmJsb2NrY2hhaW5JRCBpbiBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldGlkfWBdXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5ibG9ja2NoYWluQWxpYXMgPVxuICAgICAgICAgIERlZmF1bHRzLm5ldHdvcmtbYCR7bmV0aWR9YF1bdGhpcy5ibG9ja2NoYWluSURdLmFsaWFzXG4gICAgICAgIHJldHVybiB0aGlzLmJsb2NrY2hhaW5BbGlhc1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5ibG9ja2NoYWluQWxpYXNcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRC5cbiAgICpcbiAgICogQHBhcmFtIGFsaWFzIFRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRC5cbiAgICpcbiAgICovXG4gIHNldEJsb2NrY2hhaW5BbGlhcyA9IChhbGlhczogc3RyaW5nKTogdW5kZWZpbmVkID0+IHtcbiAgICB0aGlzLmJsb2NrY2hhaW5BbGlhcyA9IGFsaWFzXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICByZXR1cm4gdW5kZWZpbmVkXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYmxvY2tjaGFpbklEIGFuZCByZXR1cm5zIGl0LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYmxvY2tjaGFpbklEXG4gICAqL1xuICBnZXRCbG9ja2NoYWluSUQgPSAoKTogc3RyaW5nID0+IHRoaXMuYmxvY2tjaGFpbklEXG5cbiAgLyoqXG4gICAqIFJlZnJlc2ggYmxvY2tjaGFpbklELCBhbmQgaWYgYSBibG9ja2NoYWluSUQgaXMgcGFzc2VkIGluLCB1c2UgdGhhdC5cbiAgICpcbiAgICogQHBhcmFtIE9wdGlvbmFsLiBCbG9ja2NoYWluSUQgdG8gYXNzaWduLCBpZiBub25lLCB1c2VzIHRoZSBkZWZhdWx0IGJhc2VkIG9uIG5ldHdvcmtJRC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGJsb2NrY2hhaW5JRFxuICAgKi9cbiAgcmVmcmVzaEJsb2NrY2hhaW5JRCA9IChibG9ja2NoYWluSUQ6IHN0cmluZyA9IHVuZGVmaW5lZCk6IGJvb2xlYW4gPT4ge1xuICAgIGNvbnN0IG5ldGlkOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBpZiAoXG4gICAgICB0eXBlb2YgYmxvY2tjaGFpbklEID09PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICB0eXBlb2YgRGVmYXVsdHMubmV0d29ya1tgJHtuZXRpZH1gXSAhPT0gXCJ1bmRlZmluZWRcIlxuICAgICkge1xuICAgICAgdGhpcy5ibG9ja2NoYWluSUQgPSBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldGlkfWBdLlN3YXAuYmxvY2tjaGFpbklEIC8vZGVmYXVsdCB0byBTd2FwQ2hhaW5cbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIGlmICh0eXBlb2YgYmxvY2tjaGFpbklEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLmJsb2NrY2hhaW5JRCA9IGJsb2NrY2hhaW5JRFxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYW4gYWRkcmVzcyBzdHJpbmcgYW5kIHJldHVybnMgaXRzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIGlmIHZhbGlkLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgYWRkcmVzcyBpZiB2YWxpZCwgdW5kZWZpbmVkIGlmIG5vdCB2YWxpZC5cbiAgICovXG4gIHBhcnNlQWRkcmVzcyA9IChhZGRyOiBzdHJpbmcpOiBCdWZmZXIgPT4ge1xuICAgIGNvbnN0IGFsaWFzOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5JRCgpXG4gICAgcmV0dXJuIGJpbnRvb2xzLnBhcnNlQWRkcmVzcyhcbiAgICAgIGFkZHIsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBhbGlhcyxcbiAgICAgIEFWTUNvbnN0YW50cy5BRERSRVNTTEVOR1RIXG4gICAgKVxuICB9XG5cbiAgYWRkcmVzc0Zyb21CdWZmZXIgPSAoYWRkcmVzczogQnVmZmVyKTogc3RyaW5nID0+IHtcbiAgICBjb25zdCBjaGFpbklEOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXG4gICAgICA/IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcbiAgICAgIDogdGhpcy5nZXRCbG9ja2NoYWluSUQoKVxuICAgIGNvbnN0IHR5cGU6IFNlcmlhbGl6ZWRUeXBlID0gXCJiZWNoMzJcIlxuICAgIGNvbnN0IGhycDogc3RyaW5nID0gdGhpcy5jb3JlLmdldEhSUCgpXG4gICAgcmV0dXJuIHNlcmlhbGl6YXRpb24uYnVmZmVyVG9UeXBlKGFkZHJlc3MsIHR5cGUsIGhycCwgY2hhaW5JRClcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSBBWEMgQXNzZXRJRCBhbmQgcmV0dXJucyBpdCBpbiBhIFByb21pc2UuXG4gICAqXG4gICAqIEBwYXJhbSByZWZyZXNoIFRoaXMgZnVuY3Rpb24gY2FjaGVzIHRoZSByZXNwb25zZS4gUmVmcmVzaCA9IHRydWUgd2lsbCBidXN0IHRoZSBjYWNoZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHRoZSBwcm92aWRlZCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBBWEMgQXNzZXRJRFxuICAgKi9cbiAgZ2V0QVhDQXNzZXRJRCA9IGFzeW5jIChyZWZyZXNoOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPEJ1ZmZlcj4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5BWENBc3NldElEID09PSBcInVuZGVmaW5lZFwiIHx8IHJlZnJlc2gpIHtcbiAgICAgIGNvbnN0IGFzc2V0OiBHZXRBWENBc3NldElEUGFyYW1zID0gYXdhaXQgdGhpcy5nZXRBc3NldERlc2NyaXB0aW9uKFxuICAgICAgICBQcmltYXJ5QXNzZXRBbGlhc1xuICAgICAgKVxuICAgICAgdGhpcy5BWENBc3NldElEID0gYXNzZXQuYXNzZXRJRFxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5BWENBc3NldElEXG4gIH1cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSBkZWZhdWx0cyBhbmQgc2V0cyB0aGUgY2FjaGUgdG8gYSBzcGVjaWZpYyBBWEMgQXNzZXRJRFxuICAgKlxuICAgKiBAcGFyYW0gYXhjQXNzZXRJRCBBIGNiNTggc3RyaW5nIG9yIEJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIEFYQyBBc3NldElEXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0aGUgcHJvdmlkZWQgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgQVhDIEFzc2V0SURcbiAgICovXG4gIHNldEFYQ0Fzc2V0SUQgPSAoYXhjQXNzZXRJRDogc3RyaW5nIHwgQnVmZmVyKSA9PiB7XG4gICAgaWYgKHR5cGVvZiBheGNBc3NldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBheGNBc3NldElEID0gYmludG9vbHMuY2I1OERlY29kZShheGNBc3NldElEKVxuICAgIH1cbiAgICB0aGlzLkFYQ0Fzc2V0SUQgPSBheGNBc3NldElEXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGVmYXVsdCB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBkZWZhdWx0IHR4IGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXREZWZhdWx0VHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIHJldHVybiB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCkgaW4gRGVmYXVsdHMubmV0d29ya1xuICAgICAgPyBuZXcgQk4oRGVmYXVsdHMubmV0d29ya1t0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCldW1wiU3dhcFwiXVtcInR4RmVlXCJdKVxuICAgICAgOiBuZXcgQk4oMClcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0eCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0VHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy50eEZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy50eEZlZSA9IHRoaXMuZ2V0RGVmYXVsdFR4RmVlKClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMudHhGZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEBwYXJhbSBmZWUgVGhlIHR4IGZlZSBhbW91bnQgdG8gc2V0IGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBzZXRUeEZlZSA9IChmZWU6IEJOKTogdm9pZCA9PiB7XG4gICAgdGhpcy50eEZlZSA9IGZlZVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRlZmF1bHQgY3JlYXRpb24gZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZGVmYXVsdCBjcmVhdGlvbiBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0RGVmYXVsdENyZWF0aW9uVHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIHJldHVybiB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCkgaW4gRGVmYXVsdHMubmV0d29ya1xuICAgICAgPyBuZXcgQk4oXG4gICAgICAgICAgRGVmYXVsdHMubmV0d29ya1t0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCldW1wiU3dhcFwiXVtcImNyZWF0aW9uVHhGZWVcIl1cbiAgICAgICAgKVxuICAgICAgOiBuZXcgQk4oMClcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkZWZhdWx0IG1pbnQgZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZGVmYXVsdCBtaW50IGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXREZWZhdWx0TWludFR4RmVlID0gKCk6IEJOID0+IHtcbiAgICByZXR1cm4gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpIGluIERlZmF1bHRzLm5ldHdvcmtcbiAgICAgID8gbmV3IEJOKERlZmF1bHRzLm5ldHdvcmtbdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXVtcIlN3YXBcIl1bXCJtaW50VHhGZWVcIl0pXG4gICAgICA6IG5ldyBCTigwKVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1pbnQgZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbWludCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0TWludFR4RmVlID0gKCk6IEJOID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMubWludFR4RmVlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLm1pbnRUeEZlZSA9IHRoaXMuZ2V0RGVmYXVsdE1pbnRUeEZlZSgpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLm1pbnRUeEZlZVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNyZWF0aW9uIGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGNyZWF0aW9uIGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXRDcmVhdGlvblR4RmVlID0gKCk6IEJOID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMuY3JlYXRpb25UeEZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5jcmVhdGlvblR4RmVlID0gdGhpcy5nZXREZWZhdWx0Q3JlYXRpb25UeEZlZSgpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNyZWF0aW9uVHhGZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBtaW50IGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHBhcmFtIGZlZSBUaGUgbWludCBmZWUgYW1vdW50IHRvIHNldCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgc2V0TWludFR4RmVlID0gKGZlZTogQk4pOiB2b2lkID0+IHtcbiAgICB0aGlzLm1pbnRUeEZlZSA9IGZlZVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNyZWF0aW9uIGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHBhcmFtIGZlZSBUaGUgY3JlYXRpb24gZmVlIGFtb3VudCB0byBzZXQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIHNldENyZWF0aW9uVHhGZWUgPSAoZmVlOiBCTik6IHZvaWQgPT4ge1xuICAgIHRoaXMuY3JlYXRpb25UeEZlZSA9IGZlZVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSByZWZlcmVuY2UgdG8gdGhlIGtleWNoYWluIGZvciB0aGlzIGNsYXNzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgaW5zdGFuY2Ugb2YgW1tLZXlDaGFpbl1dIGZvciB0aGlzIGNsYXNzXG4gICAqL1xuICBrZXlDaGFpbiA9ICgpOiBLZXlDaGFpbiA9PiB0aGlzLmtleWNoYWluXG5cbiAgLyoqXG4gICAqIEBpZ25vcmVcbiAgICovXG4gIG5ld0tleUNoYWluID0gKCk6IEtleUNoYWluID0+IHtcbiAgICAvLyB3YXJuaW5nLCBvdmVyd3JpdGVzIHRoZSBvbGQga2V5Y2hhaW5cbiAgICBjb25zdCBhbGlhczogc3RyaW5nID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxuICAgIGlmIChhbGlhcykge1xuICAgICAgdGhpcy5rZXljaGFpbiA9IG5ldyBLZXlDaGFpbih0aGlzLmNvcmUuZ2V0SFJQKCksIGFsaWFzKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgdGhpcy5ibG9ja2NoYWluSUQpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmtleWNoYWluXG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGRldGVybWluZXMgaWYgYSB0eCBpcyBhIGdvb3NlIGVnZyB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHV0eCBBbiBVbnNpZ25lZFR4XG4gICAqXG4gICAqIEByZXR1cm5zIGJvb2xlYW4gdHJ1ZSBpZiBwYXNzZXMgZ29vc2UgZWdnIHRlc3QgYW5kIGZhbHNlIGlmIGZhaWxzLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBBIFwiR29vc2UgRWdnIFRyYW5zYWN0aW9uXCIgaXMgd2hlbiB0aGUgZmVlIGZhciBleGNlZWRzIGEgcmVhc29uYWJsZSBhbW91bnRcbiAgICovXG4gIGNoZWNrR29vc2VFZ2cgPSBhc3luYyAoXG4gICAgdXR4OiBVbnNpZ25lZFR4LFxuICAgIG91dFRvdGFsOiBCTiA9IG5ldyBCTigwKVxuICApOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcbiAgICBjb25zdCBheGNBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFYQ0Fzc2V0SUQoKVxuICAgIGNvbnN0IG91dHB1dFRvdGFsOiBCTiA9IG91dFRvdGFsLmd0KG5ldyBCTigwKSlcbiAgICAgID8gb3V0VG90YWxcbiAgICAgIDogdXR4LmdldE91dHB1dFRvdGFsKGF4Y0Fzc2V0SUQpXG4gICAgY29uc3QgZmVlOiBCTiA9IHV0eC5nZXRCdXJuKGF4Y0Fzc2V0SUQpXG4gICAgaWYgKGZlZS5sdGUoT05FQVhDLm11bChuZXcgQk4oMTApKSkgfHwgZmVlLmx0ZShvdXRwdXRUb3RhbCkpIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBiYWxhbmNlIG9mIGEgcGFydGljdWxhciBhc3NldCBvbiBhIGJsb2NrY2hhaW4uXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIHRvIHB1bGwgdGhlIGFzc2V0IGJhbGFuY2UgZnJvbVxuICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgYXNzZXRJRCB0byBwdWxsIHRoZSBiYWxhbmNlIGZyb21cbiAgICogQHBhcmFtIGluY2x1ZGVQYXJ0aWFsIElmIGluY2x1ZGVQYXJ0aWFsPWZhbHNlLCByZXR1cm5zIG9ubHkgdGhlIGJhbGFuY2UgaGVsZCBzb2xlbHlcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSB3aXRoIHRoZSBiYWxhbmNlIG9mIHRoZSBhc3NldElEIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gb24gdGhlIHByb3ZpZGVkIGFkZHJlc3MgZm9yIHRoZSBibG9ja2NoYWluLlxuICAgKi9cbiAgZ2V0QmFsYW5jZSA9IGFzeW5jIChcbiAgICBhZGRyZXNzOiBzdHJpbmcsXG4gICAgYXNzZXRJRDogc3RyaW5nLFxuICAgIGluY2x1ZGVQYXJ0aWFsOiBib29sZWFuID0gZmFsc2VcbiAgKTogUHJvbWlzZTxHZXRCYWxhbmNlUmVzcG9uc2U+ID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGFkZHJlc3MpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFWTUFQSS5nZXRCYWxhbmNlOiBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0XCJcbiAgICAgIClcbiAgICB9XG4gICAgY29uc3QgcGFyYW1zOiBHZXRCYWxhbmNlUGFyYW1zID0ge1xuICAgICAgYWRkcmVzcyxcbiAgICAgIGFzc2V0SUQsXG4gICAgICBpbmNsdWRlUGFydGlhbFxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXZtLmdldEJhbGFuY2VcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGFkZHJlc3MgKGFuZCBhc3NvY2lhdGVkIHByaXZhdGUga2V5cykgb24gYSB1c2VyIG9uIGEgYmxvY2tjaGFpbi5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIE5hbWUgb2YgdGhlIHVzZXIgdG8gY3JlYXRlIHRoZSBhZGRyZXNzIHVuZGVyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBQYXNzd29yZCB0byB1bmxvY2sgdGhlIHVzZXIgYW5kIGVuY3J5cHQgdGhlIHByaXZhdGUga2V5XG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgYWRkcmVzcyBjcmVhdGVkIGJ5IHRoZSB2bS5cbiAgICovXG4gIGNyZWF0ZUFkZHJlc3MgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBDcmVhdGVBZGRyZXNzUGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZFxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXZtLmNyZWF0ZUFkZHJlc3NcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzc1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBmaXhlZC1jYXAsIGZ1bmdpYmxlIGFzc2V0LiBBIHF1YW50aXR5IG9mIGl0IGlzIGNyZWF0ZWQgYXQgaW5pdGlhbGl6YXRpb24gYW5kIHRoZXJlIG5vIG1vcmUgaXMgZXZlciBjcmVhdGVkLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXIgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUgKGluICRBWEMpIGZvciBhc3NldCBjcmVhdGlvblxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIGZvciB0aGUgdXNlciBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZSAoaW4gJEFYQykgZm9yIGFzc2V0IGNyZWF0aW9uXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBodW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgYXNzZXRcbiAgICogQHBhcmFtIHN5bWJvbCBPcHRpb25hbC4gVGhlIHNob3J0aGFuZCBzeW1ib2wgZm9yIHRoZSBhc3NldC4gQmV0d2VlbiAwIGFuZCA0IGNoYXJhY3RlcnNcbiAgICogQHBhcmFtIGRlbm9taW5hdGlvbiBPcHRpb25hbC4gRGV0ZXJtaW5lcyBob3cgYmFsYW5jZXMgb2YgdGhpcyBhc3NldCBhcmUgZGlzcGxheWVkIGJ5IHVzZXIgaW50ZXJmYWNlcy4gRGVmYXVsdCBpcyAwXG4gICAqIEBwYXJhbSBpbml0aWFsSG9sZGVycyBBbiBhcnJheSBvZiBvYmplY3RzIGNvbnRhaW5pbmcgdGhlIGZpZWxkIFwiYWRkcmVzc1wiIGFuZCBcImFtb3VudFwiIHRvIGVzdGFibGlzaCB0aGUgZ2VuZXNpcyB2YWx1ZXMgZm9yIHRoZSBuZXcgYXNzZXRcbiAgICpcbiAgICogYGBganNcbiAgICogRXhhbXBsZSBpbml0aWFsSG9sZGVyczpcbiAgICogW1xuICAgKiAgIHtcbiAgICogICAgIFwiYWRkcmVzc1wiOiBcIlN3YXAtYXhjMWtqMDZsaGd4ODRoMzlzbnNsamNleTN0cGMwNDZ6ZTY4bWVrM2c1XCIsXG4gICAqICAgICBcImFtb3VudFwiOiAxMDAwMFxuICAgKiAgIH0sXG4gICAqICAge1xuICAgKiAgICAgXCJhZGRyZXNzXCI6IFwiU3dhcC1heGMxYW00dzZoZnJ2bWgzYWtkdXpranRocnRndHFhZmFsY2U2YW44Y3JcIixcbiAgICogICAgIFwiYW1vdW50XCI6IDUwMDAwXG4gICAqICAgfVxuICAgKiBdXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgY29udGFpbmluZyB0aGUgYmFzZSA1OCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIElEIG9mIHRoZSBuZXdseSBjcmVhdGVkIGFzc2V0LlxuICAgKi9cbiAgY3JlYXRlRml4ZWRDYXBBc3NldCA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHN5bWJvbDogc3RyaW5nLFxuICAgIGRlbm9taW5hdGlvbjogbnVtYmVyLFxuICAgIGluaXRpYWxIb2xkZXJzOiBvYmplY3RbXVxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQ3JlYXRlRml4ZWRDYXBBc3NldFBhcmFtcyA9IHtcbiAgICAgIG5hbWUsXG4gICAgICBzeW1ib2wsXG4gICAgICBkZW5vbWluYXRpb24sXG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgaW5pdGlhbEhvbGRlcnNcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF2bS5jcmVhdGVGaXhlZENhcEFzc2V0XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmFzc2V0SURcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgdmFyaWFibGUtY2FwLCBmdW5naWJsZSBhc3NldC4gTm8gdW5pdHMgb2YgdGhlIGFzc2V0IGV4aXN0IGF0IGluaXRpYWxpemF0aW9uLiBNaW50ZXJzIGNhbiBtaW50IHVuaXRzIG9mIHRoaXMgYXNzZXQgdXNpbmcgY3JlYXRlTWludFR4LCBzaWduTWludFR4IGFuZCBzZW5kTWludFR4LlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXIgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUgKGluICRBWEMpIGZvciBhc3NldCBjcmVhdGlvblxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIGZvciB0aGUgdXNlciBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZSAoaW4gJEFYQykgZm9yIGFzc2V0IGNyZWF0aW9uXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBodW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgYXNzZXRcbiAgICogQHBhcmFtIHN5bWJvbCBPcHRpb25hbC4gVGhlIHNob3J0aGFuZCBzeW1ib2wgZm9yIHRoZSBhc3NldCAtLSBiZXR3ZWVuIDAgYW5kIDQgY2hhcmFjdGVyc1xuICAgKiBAcGFyYW0gZGVub21pbmF0aW9uIE9wdGlvbmFsLiBEZXRlcm1pbmVzIGhvdyBiYWxhbmNlcyBvZiB0aGlzIGFzc2V0IGFyZSBkaXNwbGF5ZWQgYnkgdXNlciBpbnRlcmZhY2VzLiBEZWZhdWx0IGlzIDBcbiAgICogQHBhcmFtIG1pbnRlclNldHMgaXMgYSBsaXN0IHdoZXJlIGVhY2ggZWxlbWVudCBzcGVjaWZpZXMgdGhhdCB0aHJlc2hvbGQgb2YgdGhlIGFkZHJlc3NlcyBpbiBtaW50ZXJzIG1heSB0b2dldGhlciBtaW50IG1vcmUgb2YgdGhlIGFzc2V0IGJ5IHNpZ25pbmcgYSBtaW50aW5nIHRyYW5zYWN0aW9uXG4gICAqXG4gICAqIGBgYGpzXG4gICAqIEV4YW1wbGUgbWludGVyU2V0czpcbiAgICogW1xuICAgKiAgICB7XG4gICAqICAgICAgXCJtaW50ZXJzXCI6W1xuICAgKiAgICAgICAgXCJTd2FwLWF4YzFhbTR3NmhmcnZtaDNha2R1emtqdGhydGd0cWFmYWxjZTZhbjhjclwiXG4gICAqICAgICAgXSxcbiAgICogICAgICBcInRocmVzaG9sZFwiOiAxXG4gICAqICAgICB9LFxuICAgKiAgICAge1xuICAgKiAgICAgIFwibWludGVyc1wiOiBbXG4gICAqICAgICAgICBcIlN3YXAtYXhjMWFtNHc2aGZydm1oM2FrZHV6a2p0aHJ0Z3RxYWZhbGNlNmFuOGNyXCIsXG4gICAqICAgICAgICBcIlN3YXAtYXhjMWtqMDZsaGd4ODRoMzlzbnNsamNleTN0cGMwNDZ6ZTY4bWVrM2c1XCIsXG4gICAqICAgICAgICBcIlN3YXAtYXhjMXllbGwzZTRubG4wbTM5Y2ZwZGhncXByc2Q4N2praDRxbmFra2x4XCJcbiAgICogICAgICBdLFxuICAgKiAgICAgIFwidGhyZXNob2xkXCI6IDJcbiAgICogICAgIH1cbiAgICogXVxuICAgKiBgYGBcbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIGNvbnRhaW5pbmcgdGhlIGJhc2UgNTggc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBJRCBvZiB0aGUgbmV3bHkgY3JlYXRlZCBhc3NldC5cbiAgICovXG4gIGNyZWF0ZVZhcmlhYmxlQ2FwQXNzZXQgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBzeW1ib2w6IHN0cmluZyxcbiAgICBkZW5vbWluYXRpb246IG51bWJlcixcbiAgICBtaW50ZXJTZXRzOiBvYmplY3RbXVxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQ3JlYXRlVmFyaWFibGVDYXBBc3NldFBhcmFtcyA9IHtcbiAgICAgIG5hbWUsXG4gICAgICBzeW1ib2wsXG4gICAgICBkZW5vbWluYXRpb24sXG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgbWludGVyU2V0c1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXZtLmNyZWF0ZVZhcmlhYmxlQ2FwQXNzZXRcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYXNzZXRJRFxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBmYW1pbHkgb2YgTkZUIEFzc2V0LiBObyB1bml0cyBvZiB0aGUgYXNzZXQgZXhpc3QgYXQgaW5pdGlhbGl6YXRpb24uIE1pbnRlcnMgY2FuIG1pbnQgdW5pdHMgb2YgdGhpcyBhc3NldCB1c2luZyBjcmVhdGVNaW50VHgsIHNpZ25NaW50VHggYW5kIHNlbmRNaW50VHguXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlciBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZSAoaW4gJEFYQykgZm9yIGFzc2V0IGNyZWF0aW9uXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgZm9yIHRoZSB1c2VyIHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIChpbiAkQVhDKSBmb3IgYXNzZXQgY3JlYXRpb25cbiAgICogQHBhcmFtIGZyb20gT3B0aW9uYWwuIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBtYW5hZ2VkIGJ5IHRoZSBub2RlJ3Mga2V5c3RvcmUgZm9yIHRoaXMgYmxvY2tjaGFpbiB3aGljaCB3aWxsIGZ1bmQgdGhpcyB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gY2hhbmdlQWRkciBPcHRpb25hbC4gQW4gYWRkcmVzcyB0byBzZW5kIHRoZSBjaGFuZ2VcbiAgICogQHBhcmFtIG5hbWUgVGhlIGh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSBhc3NldFxuICAgKiBAcGFyYW0gc3ltYm9sIE9wdGlvbmFsLiBUaGUgc2hvcnRoYW5kIHN5bWJvbCBmb3IgdGhlIGFzc2V0IC0tIGJldHdlZW4gMCBhbmQgNCBjaGFyYWN0ZXJzXG4gICAqIEBwYXJhbSBtaW50ZXJTZXRzIGlzIGEgbGlzdCB3aGVyZSBlYWNoIGVsZW1lbnQgc3BlY2lmaWVzIHRoYXQgdGhyZXNob2xkIG9mIHRoZSBhZGRyZXNzZXMgaW4gbWludGVycyBtYXkgdG9nZXRoZXIgbWludCBtb3JlIG9mIHRoZSBhc3NldCBieSBzaWduaW5nIGEgbWludGluZyB0cmFuc2FjdGlvblxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgY29udGFpbmluZyB0aGUgYmFzZSA1OCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIElEIG9mIHRoZSBuZXdseSBjcmVhdGVkIGFzc2V0LlxuICAgKi9cbiAgY3JlYXRlTkZUQXNzZXQgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIGZyb206IHN0cmluZ1tdIHwgQnVmZmVyW10gPSB1bmRlZmluZWQsXG4gICAgY2hhbmdlQWRkcjogc3RyaW5nLFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBzeW1ib2w6IHN0cmluZyxcbiAgICBtaW50ZXJTZXQ6IElNaW50ZXJTZXRcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IENyZWF0ZU5GVEFzc2V0UGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIG5hbWUsXG4gICAgICBzeW1ib2wsXG4gICAgICBtaW50ZXJTZXRcbiAgICB9XG5cbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwiY3JlYXRlTkZUQXNzZXRcIlxuICAgIGZyb20gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tLCBjYWxsZXIpXG4gICAgaWYgKHR5cGVvZiBmcm9tICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXNbXCJmcm9tXCJdID0gZnJvbVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgY2hhbmdlQWRkciAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhjaGFuZ2VBZGRyKSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxuICAgICAgICAgIFwiRXJyb3IgLSBBVk1BUEkuY3JlYXRlTkZUQXNzZXQ6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIlxuICAgICAgICApXG4gICAgICB9XG4gICAgICBwYXJhbXNbXCJjaGFuZ2VBZGRyXCJdID0gY2hhbmdlQWRkclxuICAgIH1cblxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhdm0uY3JlYXRlTkZUQXNzZXRcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYXNzZXRJRFxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiB0byBtaW50IG1vcmUgb2YgYW4gYXNzZXQuXG4gICAqXG4gICAqIEBwYXJhbSBhbW91bnQgVGhlIHVuaXRzIG9mIHRoZSBhc3NldCB0byBtaW50XG4gICAqIEBwYXJhbSBhc3NldElEIFRoZSBJRCBvZiB0aGUgYXNzZXQgdG8gbWludFxuICAgKiBAcGFyYW0gdG8gVGhlIGFkZHJlc3MgdG8gYXNzaWduIHRoZSB1bml0cyBvZiB0aGUgbWludGVkIGFzc2V0XG4gICAqIEBwYXJhbSBtaW50ZXJzIEFkZHJlc3NlcyBvZiB0aGUgbWludGVycyByZXNwb25zaWJsZSBmb3Igc2lnbmluZyB0aGUgdHJhbnNhY3Rpb25cbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIGNvbnRhaW5pbmcgdGhlIGJhc2UgNTggc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB1bnNpZ25lZCB0cmFuc2FjdGlvbi5cbiAgICovXG4gIG1pbnQgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIGFtb3VudDogbnVtYmVyIHwgQk4sXG4gICAgYXNzZXRJRDogQnVmZmVyIHwgc3RyaW5nLFxuICAgIHRvOiBzdHJpbmcsXG4gICAgbWludGVyczogc3RyaW5nW11cbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBsZXQgYXNzZXQ6IHN0cmluZ1xuICAgIGxldCBhbW50OiBCTlxuICAgIGlmICh0eXBlb2YgYXNzZXRJRCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgYXNzZXQgPSBiaW50b29scy5jYjU4RW5jb2RlKGFzc2V0SUQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2V0ID0gYXNzZXRJRFxuICAgIH1cbiAgICBpZiAodHlwZW9mIGFtb3VudCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgYW1udCA9IG5ldyBCTihhbW91bnQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFtbnQgPSBhbW91bnRcbiAgICB9XG4gICAgY29uc3QgcGFyYW1zOiBNaW50UGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxuICAgICAgYW1vdW50OiBhbW50LFxuICAgICAgYXNzZXRJRDogYXNzZXQsXG4gICAgICB0byxcbiAgICAgIG1pbnRlcnNcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF2bS5taW50XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgfVxuXG4gIC8qKlxuICAgKiBNaW50IG5vbi1mdW5naWJsZSB0b2tlbnMgd2hpY2ggd2VyZSBjcmVhdGVkIHdpdGggQVZNQVBJLmNyZWF0ZU5GVEFzc2V0XG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlciBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZSAoaW4gJEFYQykgZm9yIGFzc2V0IGNyZWF0aW9uXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgZm9yIHRoZSB1c2VyIHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIChpbiAkQVhDKSBmb3IgYXNzZXQgY3JlYXRpb25cbiAgICogQHBhcmFtIGZyb20gT3B0aW9uYWwuIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBtYW5hZ2VkIGJ5IHRoZSBub2RlJ3Mga2V5c3RvcmUgZm9yIHRoaXMgYmxvY2tjaGFpbiB3aGljaCB3aWxsIGZ1bmQgdGhpcyB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gY2hhbmdlQWRkciBPcHRpb25hbC4gQW4gYWRkcmVzcyB0byBzZW5kIHRoZSBjaGFuZ2VcbiAgICogQHBhcmFtIGFzc2V0SUQgVGhlIGFzc2V0IGlkIHdoaWNoIGlzIGJlaW5nIHNlbnRcbiAgICogQHBhcmFtIHRvIEFkZHJlc3Mgb24gU3dhcENoYWluIG9mIHRoZSBhY2NvdW50IHRvIHdoaWNoIHRoaXMgTkZUIGlzIGJlaW5nIHNlbnRcbiAgICogQHBhcmFtIGVuY29kaW5nIE9wdGlvbmFsLiAgaXMgdGhlIGVuY29kaW5nIGZvcm1hdCB0byB1c2UgZm9yIHRoZSBwYXlsb2FkIGFyZ3VtZW50LiBDYW4gYmUgZWl0aGVyIFwiY2I1OFwiIG9yIFwiaGV4XCIuIERlZmF1bHRzIHRvIFwiaGV4XCIuXG4gICAqXG4gICAqIEByZXR1cm5zIElEIG9mIHRoZSB0cmFuc2FjdGlvblxuICAgKi9cbiAgbWludE5GVCA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgZnJvbTogc3RyaW5nW10gfCBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcbiAgICBjaGFuZ2VBZGRyOiBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgcGF5bG9hZDogc3RyaW5nLFxuICAgIGFzc2V0SUQ6IHN0cmluZyB8IEJ1ZmZlcixcbiAgICB0bzogc3RyaW5nLFxuICAgIGVuY29kaW5nOiBzdHJpbmcgPSBcImhleFwiXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgbGV0IGFzc2V0OiBzdHJpbmdcblxuICAgIGlmICh0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3ModG8pID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcIkVycm9yIC0gQVZNQVBJLm1pbnRORlQ6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGFzc2V0SUQgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGFzc2V0ID0gYmludG9vbHMuY2I1OEVuY29kZShhc3NldElEKVxuICAgIH0gZWxzZSB7XG4gICAgICBhc3NldCA9IGFzc2V0SURcbiAgICB9XG5cbiAgICBjb25zdCBwYXJhbXM6IE1pbnRORlRQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgYXNzZXRJRDogYXNzZXQsXG4gICAgICBwYXlsb2FkLFxuICAgICAgdG8sXG4gICAgICBlbmNvZGluZ1xuICAgIH1cblxuICAgIGNvbnN0IGNhbGxlcjogc3RyaW5nID0gXCJtaW50TkZUXCJcbiAgICBmcm9tID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbSwgY2FsbGVyKVxuICAgIGlmICh0eXBlb2YgZnJvbSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zW1wiZnJvbVwiXSA9IGZyb21cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNoYW5nZUFkZHIgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3MoY2hhbmdlQWRkcikgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcIkVycm9yIC0gQVZNQVBJLm1pbnRORlQ6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIilcbiAgICAgIH1cbiAgICAgIHBhcmFtc1tcImNoYW5nZUFkZHJcIl0gPSBjaGFuZ2VBZGRyXG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF2bS5taW50TkZUXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIE5GVCBmcm9tIG9uZSBhY2NvdW50IHRvIGFub3RoZXIgb24gU3dhcENoYWluXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlciBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZSAoaW4gJEFYQykgZm9yIGFzc2V0IGNyZWF0aW9uXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgZm9yIHRoZSB1c2VyIHBheWluZyB0aGUgdHJhbnNhY3Rpb24gZmVlIChpbiAkQVhDKSBmb3IgYXNzZXQgY3JlYXRpb25cbiAgICogQHBhcmFtIGZyb20gT3B0aW9uYWwuIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBtYW5hZ2VkIGJ5IHRoZSBub2RlJ3Mga2V5c3RvcmUgZm9yIHRoaXMgYmxvY2tjaGFpbiB3aGljaCB3aWxsIGZ1bmQgdGhpcyB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gY2hhbmdlQWRkciBPcHRpb25hbC4gQW4gYWRkcmVzcyB0byBzZW5kIHRoZSBjaGFuZ2VcbiAgICogQHBhcmFtIGFzc2V0SUQgVGhlIGFzc2V0IGlkIHdoaWNoIGlzIGJlaW5nIHNlbnRcbiAgICogQHBhcmFtIGdyb3VwSUQgVGhlIGdyb3VwIHRoaXMgTkZUIGlzIGlzc3VlZCB0by5cbiAgICogQHBhcmFtIHRvIEFkZHJlc3Mgb24gU3dhcENoYWluIG9mIHRoZSBhY2NvdW50IHRvIHdoaWNoIHRoaXMgTkZUIGlzIGJlaW5nIHNlbnRcbiAgICpcbiAgICogQHJldHVybnMgSUQgb2YgdGhlIHRyYW5zYWN0aW9uXG4gICAqL1xuICBzZW5kTkZUID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBmcm9tOiBzdHJpbmdbXSB8IEJ1ZmZlcltdID0gdW5kZWZpbmVkLFxuICAgIGNoYW5nZUFkZHI6IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBhc3NldElEOiBzdHJpbmcgfCBCdWZmZXIsXG4gICAgZ3JvdXBJRDogbnVtYmVyLFxuICAgIHRvOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBsZXQgYXNzZXQ6IHN0cmluZ1xuXG4gICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyh0bykgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFwiRXJyb3IgLSBBVk1BUEkuc2VuZE5GVDogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgYXNzZXRJRCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgYXNzZXQgPSBiaW50b29scy5jYjU4RW5jb2RlKGFzc2V0SUQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2V0ID0gYXNzZXRJRFxuICAgIH1cblxuICAgIGNvbnN0IHBhcmFtczogU2VuZE5GVFBhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBhc3NldElEOiBhc3NldCxcbiAgICAgIGdyb3VwSUQsXG4gICAgICB0b1xuICAgIH1cblxuICAgIGNvbnN0IGNhbGxlcjogc3RyaW5nID0gXCJzZW5kTkZUXCJcbiAgICBmcm9tID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbSwgY2FsbGVyKVxuICAgIGlmICh0eXBlb2YgZnJvbSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zW1wiZnJvbVwiXSA9IGZyb21cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNoYW5nZUFkZHIgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3MoY2hhbmdlQWRkcikgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcIkVycm9yIC0gQVZNQVBJLnNlbmRORlQ6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIilcbiAgICAgIH1cbiAgICAgIHBhcmFtc1tcImNoYW5nZUFkZHJcIl0gPSBjaGFuZ2VBZGRyXG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF2bS5zZW5kTkZUXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHBvcnRzIHRoZSBwcml2YXRlIGtleSBmb3IgYW4gYWRkcmVzcy5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBuYW1lIG9mIHRoZSB1c2VyIHdpdGggdGhlIHByaXZhdGUga2V5XG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgdXNlZCB0byBkZWNyeXB0IHRoZSBwcml2YXRlIGtleVxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyB3aG9zZSBwcml2YXRlIGtleSBzaG91bGQgYmUgZXhwb3J0ZWRcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSB3aXRoIHRoZSBkZWNyeXB0ZWQgcHJpdmF0ZSBrZXkgYXMgc3RvcmUgaW4gdGhlIGRhdGFiYXNlXG4gICAqL1xuICBleHBvcnRLZXkgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIGFkZHJlc3M6IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3MoYWRkcmVzcykgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFwiRXJyb3IgLSBBVk1BUEkuZXhwb3J0S2V5OiBJbnZhbGlkIGFkZHJlc3MgZm9ybWF0XCIpXG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczogRXhwb3J0S2V5UGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIGFkZHJlc3NcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF2bS5leHBvcnRLZXlcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQucHJpdmF0ZUtleVxuICB9XG5cbiAgLyoqXG4gICAqIEltcG9ydHMgYSBwcml2YXRlIGtleSBpbnRvIHRoZSBub2RlJ3Mga2V5c3RvcmUgdW5kZXIgYW4gdXNlciBhbmQgZm9yIGEgYmxvY2tjaGFpbi5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBuYW1lIG9mIHRoZSB1c2VyIHRvIHN0b3JlIHRoZSBwcml2YXRlIGtleVxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIHRoYXQgdW5sb2NrcyB0aGUgdXNlclxuICAgKiBAcGFyYW0gcHJpdmF0ZUtleSBBIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHByaXZhdGUga2V5IGluIHRoZSB2bSdzIGZvcm1hdFxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYWRkcmVzcyBmb3IgdGhlIGltcG9ydGVkIHByaXZhdGUga2V5LlxuICAgKi9cbiAgaW1wb3J0S2V5ID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBwcml2YXRlS2V5OiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEltcG9ydEtleVBhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBwcml2YXRlS2V5XG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhdm0uaW1wb3J0S2V5XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmFkZHJlc3NcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIEFOVCAoQXhpYSBOYXRpdmUgVG9rZW4pIGFzc2V0cyBpbmNsdWRpbmcgQVhDIGZyb20gdGhlIFN3YXBDaGFpbiB0byBhbiBhY2NvdW50IG9uIHRoZSBDb3JlQ2hhaW4gb3IgQVhDaGFpbi5cbiAgICpcbiAgICogQWZ0ZXIgY2FsbGluZyB0aGlzIG1ldGhvZCwgeW91IG11c3QgY2FsbCB0aGUgQ29yZUNoYWluJ3MgYGltcG9ydGAgb3IgdGhlIEFYQ2hhaW7igJlzIGBpbXBvcnRgIG1ldGhvZCB0byBjb21wbGV0ZSB0aGUgdHJhbnNmZXIuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBDb3JlQ2hhaW4gb3IgQVhDaGFpbiBhY2NvdW50IHNwZWNpZmllZCBpbiBgdG9gXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICogQHBhcmFtIHRvIFRoZSBhY2NvdW50IG9uIHRoZSBDb3JlQ2hhaW4gb3IgQVhDaGFpbiB0byBzZW5kIHRoZSBhc3NldCB0by5cbiAgICogQHBhcmFtIGFtb3VudCBBbW91bnQgb2YgYXNzZXQgdG8gZXhwb3J0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGFzc2V0SUQgVGhlIGFzc2V0IGlkIHdoaWNoIGlzIGJlaW5nIHNlbnRcbiAgICpcbiAgICogQHJldHVybnMgU3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdHJhbnNhY3Rpb24gaWRcbiAgICovXG4gIGV4cG9ydCA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgdG86IHN0cmluZyxcbiAgICBhbW91bnQ6IEJOLFxuICAgIGFzc2V0SUQ6IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogRXhwb3J0UGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIHRvLFxuICAgICAgYW1vdW50OiBhbW91bnQsXG4gICAgICBhc3NldElEXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhdm0uZXhwb3J0XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIEFOVCAoQXhpYSBOYXRpdmUgVG9rZW4pIGFzc2V0cyBpbmNsdWRpbmcgQVhDIGZyb20gYW4gYWNjb3VudCBvbiB0aGUgQ29yZUNoYWluIG9yIEFYQ2hhaW4gdG8gYW4gYWRkcmVzcyBvbiB0aGUgU3dhcENoYWluLiBUaGlzIHRyYW5zYWN0aW9uXG4gICAqIG11c3QgYmUgc2lnbmVkIHdpdGggdGhlIGtleSBvZiB0aGUgYWNjb3VudCB0aGF0IHRoZSBhc3NldCBpcyBzZW50IGZyb20gYW5kIHdoaWNoIHBheXNcbiAgICogdGhlIHRyYW5zYWN0aW9uIGZlZS5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIGFjY291bnQgc3BlY2lmaWVkIGluIGB0b2BcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gdG8gVGhlIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgdGhlIGFzc2V0IGlzIHNlbnQgdG8uXG4gICAqIEBwYXJhbSBzb3VyY2VDaGFpbiBUaGUgY2hhaW5JRCB3aGVyZSB0aGUgZnVuZHMgYXJlIGNvbWluZyBmcm9tLiBFeDogXCJBWFwiXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIGZvciB0aGUgdHJhbnNhY3Rpb24sIHdoaWNoIHNob3VsZCBiZSBzZW50IHRvIHRoZSBuZXR3b3JrXG4gICAqIGJ5IGNhbGxpbmcgaXNzdWVUeC5cbiAgICovXG4gIGltcG9ydCA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgdG86IHN0cmluZyxcbiAgICBzb3VyY2VDaGFpbjogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBJbXBvcnRQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgdG8sXG4gICAgICBzb3VyY2VDaGFpblxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXZtLmltcG9ydFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gIH1cblxuICAvKipcbiAgICogTGlzdHMgYWxsIHRoZSBhZGRyZXNzZXMgdW5kZXIgYSB1c2VyLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXIgdG8gbGlzdCBhZGRyZXNzZXNcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgdXNlciB0byBsaXN0IHRoZSBhZGRyZXNzZXNcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBvZiBhbiBhcnJheSBvZiBhZGRyZXNzIHN0cmluZ3MgaW4gdGhlIGZvcm1hdCBzcGVjaWZpZWQgYnkgdGhlIGJsb2NrY2hhaW4uXG4gICAqL1xuICBsaXN0QWRkcmVzc2VzID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZ1tdPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBMaXN0QWRkcmVzc2VzUGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZFxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXZtLmxpc3RBZGRyZXNzZXNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzc2VzXG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGFsbCBhc3NldHMgZm9yIGFuIGFkZHJlc3Mgb24gYSBzZXJ2ZXIgYW5kIHRoZWlyIGFzc29jaWF0ZWQgYmFsYW5jZXMuXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIHRvIGdldCBhIGxpc3Qgb2YgYXNzZXRzXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2Ugb2YgYW4gb2JqZWN0IG1hcHBpbmcgYXNzZXRJRCBzdHJpbmdzIHdpdGgge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gYmFsYW5jZSBmb3IgdGhlIGFkZHJlc3Mgb24gdGhlIGJsb2NrY2hhaW4uXG4gICAqL1xuICBnZXRBbGxCYWxhbmNlcyA9IGFzeW5jIChhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPG9iamVjdFtdPiA9PiB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzKSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBVk1BUEkuZ2V0QWxsQmFsYW5jZXM6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIlxuICAgICAgKVxuICAgIH1cbiAgICBjb25zdCBwYXJhbXM6IEdldEFsbEJhbGFuY2VzUGFyYW1zID0ge1xuICAgICAgYWRkcmVzc1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXZtLmdldEFsbEJhbGFuY2VzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmJhbGFuY2VzXG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGFuIGFzc2V0cyBuYW1lIGFuZCBzeW1ib2wuXG4gICAqXG4gICAqIEBwYXJhbSBhc3NldElEIEVpdGhlciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGFuIGI1OCBzZXJpYWxpemVkIHN0cmluZyBmb3IgdGhlIEFzc2V0SUQgb3IgaXRzIGFsaWFzLlxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBvYmplY3Qgd2l0aCBrZXlzIFwibmFtZVwiIGFuZCBcInN5bWJvbFwiLlxuICAgKi9cbiAgZ2V0QXNzZXREZXNjcmlwdGlvbiA9IGFzeW5jIChcbiAgICBhc3NldElEOiBCdWZmZXIgfCBzdHJpbmdcbiAgKTogUHJvbWlzZTxHZXRBc3NldERlc2NyaXB0aW9uUmVzcG9uc2U+ID0+IHtcbiAgICBsZXQgYXNzZXQ6IHN0cmluZ1xuICAgIGlmICh0eXBlb2YgYXNzZXRJRCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgYXNzZXQgPSBiaW50b29scy5jYjU4RW5jb2RlKGFzc2V0SUQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2V0ID0gYXNzZXRJRFxuICAgIH1cbiAgICBjb25zdCBwYXJhbXM6IEdldEFzc2V0RGVzY3JpcHRpb25QYXJhbXMgPSB7XG4gICAgICBhc3NldElEOiBhc3NldFxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXZtLmdldEFzc2V0RGVzY3JpcHRpb25cIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogcmVzcG9uc2UuZGF0YS5yZXN1bHQubmFtZSxcbiAgICAgIHN5bWJvbDogcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3ltYm9sLFxuICAgICAgYXNzZXRJRDogYmludG9vbHMuY2I1OERlY29kZShyZXNwb25zZS5kYXRhLnJlc3VsdC5hc3NldElEKSxcbiAgICAgIGRlbm9taW5hdGlvbjogcGFyc2VJbnQocmVzcG9uc2UuZGF0YS5yZXN1bHQuZGVub21pbmF0aW9uLCAxMClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgdHJhbnNhY3Rpb24gZGF0YSBvZiBhIHByb3ZpZGVkIHRyYW5zYWN0aW9uIElEIGJ5IGNhbGxpbmcgdGhlIG5vZGUncyBgZ2V0VHhgIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIHR4SUQgVGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJhbnNhY3Rpb24gSURcbiAgICogQHBhcmFtIGVuY29kaW5nIHNldHMgdGhlIGZvcm1hdCBvZiB0aGUgcmV0dXJuZWQgdHJhbnNhY3Rpb24uIENhbiBiZSwgXCJjYjU4XCIsIFwiaGV4XCIgb3IgXCJqc29uXCIuIERlZmF1bHRzIHRvIFwiY2I1OFwiLlxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgb3Igb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGJ5dGVzIHJldHJpZXZlZCBmcm9tIHRoZSBub2RlXG4gICAqL1xuICBnZXRUeCA9IGFzeW5jIChcbiAgICB0eElEOiBzdHJpbmcsXG4gICAgZW5jb2Rpbmc6IHN0cmluZyA9IFwiY2I1OFwiXG4gICk6IFByb21pc2U8c3RyaW5nIHwgb2JqZWN0PiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBHZXRUeFBhcmFtcyA9IHtcbiAgICAgIHR4SUQsXG4gICAgICBlbmNvZGluZ1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXZtLmdldFR4XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgc3RhdHVzIG9mIGEgcHJvdmlkZWQgdHJhbnNhY3Rpb24gSUQgYnkgY2FsbGluZyB0aGUgbm9kZSdzIGBnZXRUeFN0YXR1c2AgbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gdHhJRCBUaGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB0cmFuc2FjdGlvbiBJRFxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgY29udGFpbmluZyB0aGUgc3RhdHVzIHJldHJpZXZlZCBmcm9tIHRoZSBub2RlXG4gICAqL1xuICBnZXRUeFN0YXR1cyA9IGFzeW5jICh0eElEOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogR2V0VHhTdGF0dXNQYXJhbXMgPSB7XG4gICAgICB0eElEXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhdm0uZ2V0VHhTdGF0dXNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3RhdHVzXG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBVVFhPcyByZWxhdGVkIHRvIHRoZSBhZGRyZXNzZXMgcHJvdmlkZWQgZnJvbSB0aGUgbm9kZSdzIGBnZXRVVFhPc2AgbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyBjYjU4IHN0cmluZ3Mgb3IgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9c1xuICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gQSBzdHJpbmcgZm9yIHRoZSBjaGFpbiB0byBsb29rIGZvciB0aGUgVVRYTydzLiBEZWZhdWx0IGlzIHRvIHVzZSB0aGlzIGNoYWluLCBidXQgaWYgZXhwb3J0ZWQgVVRYT3MgZXhpc3QgZnJvbSBvdGhlciBjaGFpbnMsIHRoaXMgY2FuIHVzZWQgdG8gcHVsbCB0aGVtIGluc3RlYWQuXG4gICAqIEBwYXJhbSBsaW1pdCBPcHRpb25hbC4gUmV0dXJucyBhdCBtb3N0IFtsaW1pdF0gYWRkcmVzc2VzLiBJZiBbbGltaXRdID09IDAgb3IgPiBbbWF4VVRYT3NUb0ZldGNoXSwgZmV0Y2hlcyB1cCB0byBbbWF4VVRYT3NUb0ZldGNoXS5cbiAgICogQHBhcmFtIHN0YXJ0SW5kZXggT3B0aW9uYWwuIFtTdGFydEluZGV4XSBkZWZpbmVzIHdoZXJlIHRvIHN0YXJ0IGZldGNoaW5nIFVUWE9zIChmb3IgcGFnaW5hdGlvbi4pXG4gICAqIFVUWE9zIGZldGNoZWQgYXJlIGZyb20gYWRkcmVzc2VzIGVxdWFsIHRvIG9yIGdyZWF0ZXIgdGhhbiBbU3RhcnRJbmRleC5BZGRyZXNzXVxuICAgKiBGb3IgYWRkcmVzcyBbU3RhcnRJbmRleC5BZGRyZXNzXSwgb25seSBVVFhPcyB3aXRoIElEcyBncmVhdGVyIHRoYW4gW1N0YXJ0SW5kZXguVXR4b10gd2lsbCBiZSByZXR1cm5lZC5cbiAgICogQHBhcmFtIHBlcnNpc3RPcHRzIE9wdGlvbnMgYXZhaWxhYmxlIHRvIHBlcnNpc3QgdGhlc2UgVVRYT3MgaW4gbG9jYWwgc3RvcmFnZVxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBwZXJzaXN0T3B0cyBpcyBvcHRpb25hbCBhbmQgbXVzdCBiZSBvZiB0eXBlIFtbUGVyc2lzdGFuY2VPcHRpb25zXV1cbiAgICpcbiAgICovXG4gIGdldFVUWE9zID0gYXN5bmMgKFxuICAgIGFkZHJlc3Nlczogc3RyaW5nW10gfCBzdHJpbmcsXG4gICAgc291cmNlQ2hhaW46IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBsaW1pdDogbnVtYmVyID0gMCxcbiAgICBzdGFydEluZGV4OiB7IGFkZHJlc3M6IHN0cmluZzsgdXR4bzogc3RyaW5nIH0gPSB1bmRlZmluZWQsXG4gICAgcGVyc2lzdE9wdHM6IFBlcnNpc3RhbmNlT3B0aW9ucyA9IHVuZGVmaW5lZFxuICApOiBQcm9taXNlPEdldFVUWE9zUmVzcG9uc2U+ID0+IHtcbiAgICBpZiAodHlwZW9mIGFkZHJlc3NlcyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgYWRkcmVzc2VzID0gW2FkZHJlc3Nlc11cbiAgICB9XG5cbiAgICBjb25zdCBwYXJhbXM6IEdldFVUWE9zUGFyYW1zID0ge1xuICAgICAgYWRkcmVzc2VzOiBhZGRyZXNzZXMsXG4gICAgICBsaW1pdFxuICAgIH1cbiAgICBpZiAodHlwZW9mIHN0YXJ0SW5kZXggIT09IFwidW5kZWZpbmVkXCIgJiYgc3RhcnRJbmRleCkge1xuICAgICAgcGFyYW1zLnN0YXJ0SW5kZXggPSBzdGFydEluZGV4XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBzb3VyY2VDaGFpbiAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLnNvdXJjZUNoYWluID0gc291cmNlQ2hhaW5cbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXZtLmdldFVUWE9zXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgY29uc3QgdXR4b3M6IFVUWE9TZXQgPSBuZXcgVVRYT1NldCgpXG4gICAgbGV0IGRhdGEgPSByZXNwb25zZS5kYXRhLnJlc3VsdC51dHhvc1xuICAgIGlmIChwZXJzaXN0T3B0cyAmJiB0eXBlb2YgcGVyc2lzdE9wdHMgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgIGlmICh0aGlzLmRiLmhhcyhwZXJzaXN0T3B0cy5nZXROYW1lKCkpKSB7XG4gICAgICAgIGNvbnN0IHNlbGZBcnJheTogc3RyaW5nW10gPSB0aGlzLmRiLmdldChwZXJzaXN0T3B0cy5nZXROYW1lKCkpXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNlbGZBcnJheSkpIHtcbiAgICAgICAgICB1dHhvcy5hZGRBcnJheShkYXRhKVxuICAgICAgICAgIGNvbnN0IHV0eG9TZXQ6IFVUWE9TZXQgPSBuZXcgVVRYT1NldCgpXG4gICAgICAgICAgdXR4b1NldC5hZGRBcnJheShzZWxmQXJyYXkpXG4gICAgICAgICAgdXR4b1NldC5tZXJnZUJ5UnVsZSh1dHhvcywgcGVyc2lzdE9wdHMuZ2V0TWVyZ2VSdWxlKCkpXG4gICAgICAgICAgZGF0YSA9IHV0eG9TZXQuZ2V0QWxsVVRYT1N0cmluZ3MoKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmRiLnNldChwZXJzaXN0T3B0cy5nZXROYW1lKCksIGRhdGEsIHBlcnNpc3RPcHRzLmdldE92ZXJ3cml0ZSgpKVxuICAgIH1cbiAgICB1dHhvcy5hZGRBcnJheShkYXRhLCBmYWxzZSlcbiAgICByZXNwb25zZS5kYXRhLnJlc3VsdC51dHhvcyA9IHV0eG9zXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgdHJhbnNhY3Rpb24uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIGFtb3VudCBUaGUgYW1vdW50IG9mIEFzc2V0SUQgdG8gYmUgc3BlbnQgaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uXG4gICAqIEBwYXJhbSBhc3NldElEIFRoZSBhc3NldElEIG9mIHRoZSB2YWx1ZSBiZWluZyBzZW50XG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyBwcm92aWRlZFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBvdXRwdXRzXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIChbW1Vuc2lnbmVkVHhdXSkgd2hpY2ggY29udGFpbnMgYSBbW0Jhc2VUeF1dLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIGhlbHBlciBleGlzdHMgYmVjYXVzZSB0aGUgZW5kcG9pbnQgQVBJIHNob3VsZCBiZSB0aGUgcHJpbWFyeSBwb2ludCBvZiBlbnRyeSBmb3IgbW9zdCBmdW5jdGlvbmFsaXR5LlxuICAgKi9cbiAgYnVpbGRCYXNlVHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBhbW91bnQ6IEJOLFxuICAgIGFzc2V0SUQ6IEJ1ZmZlciB8IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcbiAgICBsb2NrdGltZTogQk4gPSBuZXcgQk4oMCksXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlcjogc3RyaW5nID0gXCJidWlsZEJhc2VUeFwiXG4gICAgY29uc3QgdG86IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkodG9BZGRyZXNzZXMsIGNhbGxlcikubWFwKFxuICAgICAgKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSlcbiAgICApXG4gICAgY29uc3QgZnJvbTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tQWRkcmVzc2VzLCBjYWxsZXIpLm1hcChcbiAgICAgIChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpXG4gICAgKVxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuXG4gICAgaWYgKHR5cGVvZiBhc3NldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBhc3NldElEID0gYmludG9vbHMuY2I1OERlY29kZShhc3NldElEKVxuICAgIH1cblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEQnVmOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxuICAgIGNvbnN0IGZlZTogQk4gPSB0aGlzLmdldFR4RmVlKClcbiAgICBjb25zdCBmZWVBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFYQ0Fzc2V0SUQoKVxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRCYXNlVHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSURCdWYsXG4gICAgICBhbW91bnQsXG4gICAgICBhc3NldElELFxuICAgICAgdG8sXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgZmVlLFxuICAgICAgZmVlQXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mLFxuICAgICAgbG9ja3RpbWUsXG4gICAgICB0aHJlc2hvbGRcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVZNQVBJLmJ1aWxkQmFzZVR4OkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIlxuICAgICAgKVxuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCBORlQgVHJhbnNmZXIuIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgIEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIE5GVFxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgTkZUIGZyb20gdGhlIHV0eG9JRCBwcm92aWRlZFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIHV0eG9pZCBBIGJhc2U1OCB1dHhvSUQgb3IgYW4gYXJyYXkgb2YgYmFzZTU4IHV0eG9JRHMgZm9yIHRoZSBuZnRzIHRoaXMgdHJhbnNhY3Rpb24gaXMgc2VuZGluZ1xuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBDQjU4IEJ1ZmZlciBvciBTdHJpbmcgd2hpY2ggY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhIFtbTkZUVHJhbnNmZXJUeF1dLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIGhlbHBlciBleGlzdHMgYmVjYXVzZSB0aGUgZW5kcG9pbnQgQVBJIHNob3VsZCBiZSB0aGUgcHJpbWFyeSBwb2ludCBvZiBlbnRyeSBmb3IgbW9zdCBmdW5jdGlvbmFsaXR5LlxuICAgKi9cbiAgYnVpbGRORlRUcmFuc2ZlclR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgdG9BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGZyb21BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgdXR4b2lkOiBzdHJpbmcgfCBzdHJpbmdbXSxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcbiAgICBsb2NrdGltZTogQk4gPSBuZXcgQk4oMCksXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlcjogc3RyaW5nID0gXCJidWlsZE5GVFRyYW5zZmVyVHhcIlxuICAgIGNvbnN0IHRvOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KHRvQWRkcmVzc2VzLCBjYWxsZXIpLm1hcChcbiAgICAgIChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpXG4gICAgKVxuICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbUFkZHJlc3NlcywgY2FsbGVyKS5tYXAoXG4gICAgICAoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKVxuICAgIClcbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cbiAgICBjb25zdCBheGNBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFYQ0Fzc2V0SUQoKVxuXG4gICAgbGV0IHV0eG9pZEFycmF5OiBzdHJpbmdbXSA9IFtdXG4gICAgaWYgKHR5cGVvZiB1dHhvaWQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHV0eG9pZEFycmF5ID0gW3V0eG9pZF1cbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodXR4b2lkKSkge1xuICAgICAgdXR4b2lkQXJyYXkgPSB1dHhvaWRcbiAgICB9XG5cbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkTkZUVHJhbnNmZXJUeChcbiAgICAgIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSxcbiAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpLFxuICAgICAgdG8sXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgdXR4b2lkQXJyYXksXG4gICAgICB0aGlzLmdldFR4RmVlKCksXG4gICAgICBheGNBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBsb2NrdGltZSxcbiAgICAgIHRocmVzaG9sZFxuICAgIClcblxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBVk1BUEkuYnVpbGRORlRUcmFuc2ZlclR4OkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIlxuICAgICAgKVxuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCBJbXBvcnQgVHguIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgIEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBvd25lckFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gaW1wb3J0XG4gICAqIEBwYXJhbSBzb3VyY2VDaGFpbiBUaGUgY2hhaW5pZCBmb3Igd2hlcmUgdGhlIGltcG9ydCBpcyBjb21pbmcgZnJvbVxuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0byBzZW5kIHRoZSBmdW5kc1xuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3MgcHJvdmlkZWRcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGEgW1tJbXBvcnRUeF1dLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIGhlbHBlciBleGlzdHMgYmVjYXVzZSB0aGUgZW5kcG9pbnQgQVBJIHNob3VsZCBiZSB0aGUgcHJpbWFyeSBwb2ludCBvZiBlbnRyeSBmb3IgbW9zdCBmdW5jdGlvbmFsaXR5LlxuICAgKi9cbiAgYnVpbGRJbXBvcnRUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIG93bmVyQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBzb3VyY2VDaGFpbjogQnVmZmVyIHwgc3RyaW5nLFxuICAgIHRvQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBmcm9tQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyOiBzdHJpbmcgPSBcImJ1aWxkSW1wb3J0VHhcIlxuICAgIGNvbnN0IHRvOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KHRvQWRkcmVzc2VzLCBjYWxsZXIpLm1hcChcbiAgICAgIChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpXG4gICAgKVxuICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbUFkZHJlc3NlcywgY2FsbGVyKS5tYXAoXG4gICAgICAoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKVxuICAgIClcbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcblxuICAgIGxldCBzcmF4Q2hhaW46IHN0cmluZyA9IHVuZGVmaW5lZFxuXG4gICAgaWYgKHR5cGVvZiBzb3VyY2VDaGFpbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhyb3cgbmV3IENoYWluSWRFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFWTUFQSS5idWlsZEltcG9ydFR4OiBTb3VyY2UgQ2hhaW5JRCBpcyB1bmRlZmluZWQuXCJcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzb3VyY2VDaGFpbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgc3JheENoYWluID0gc291cmNlQ2hhaW5cbiAgICAgIHNvdXJjZUNoYWluID0gYmludG9vbHMuY2I1OERlY29kZShzb3VyY2VDaGFpbilcbiAgICB9IGVsc2UgaWYgKCEoc291cmNlQ2hhaW4gaW5zdGFuY2VvZiBCdWZmZXIpKSB7XG4gICAgICB0aHJvdyBuZXcgQ2hhaW5JZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVZNQVBJLmJ1aWxkSW1wb3J0VHg6IEludmFsaWQgZGVzdGluYXRpb25DaGFpbiB0eXBlOiBcIiArXG4gICAgICAgICAgdHlwZW9mIHNvdXJjZUNoYWluXG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgYXRvbWljVVRYT3M6IFVUWE9TZXQgPSAoXG4gICAgICBhd2FpdCB0aGlzLmdldFVUWE9zKG93bmVyQWRkcmVzc2VzLCBzcmF4Q2hhaW4sIDAsIHVuZGVmaW5lZClcbiAgICApLnV0eG9zXG4gICAgY29uc3QgYXhjQXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBWENBc3NldElEKClcbiAgICBjb25zdCBhdG9taWNzOiBVVFhPW10gPSBhdG9taWNVVFhPcy5nZXRBbGxVVFhPcygpXG5cbiAgICBpZiAoYXRvbWljcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBOb0F0b21pY1VUWE9zRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBVk1BUEkuYnVpbGRJbXBvcnRUeDogTm8gYXRvbWljIFVUWE9zIHRvIGltcG9ydCBmcm9tIFwiICtcbiAgICAgICAgICBzcmF4Q2hhaW4gK1xuICAgICAgICAgIFwiIHVzaW5nIGFkZHJlc3NlczogXCIgK1xuICAgICAgICAgIG93bmVyQWRkcmVzc2VzLmpvaW4oXCIsIFwiKVxuICAgICAgKVxuICAgIH1cblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRJbXBvcnRUeChcbiAgICAgIHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKSxcbiAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpLFxuICAgICAgdG8sXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgYXRvbWljcyxcbiAgICAgIHNvdXJjZUNoYWluLFxuICAgICAgdGhpcy5nZXRUeEZlZSgpLFxuICAgICAgYXhjQXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mLFxuICAgICAgbG9ja3RpbWUsXG4gICAgICB0aHJlc2hvbGRcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVZNQVBJLmJ1aWxkSW1wb3J0VHg6RmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiXG4gICAgICApXG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIEV4cG9ydCBUeC4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgYmVpbmcgZXhwb3J0ZWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gZGVzdGluYXRpb25DaGFpbiBUaGUgY2hhaW5pZCBmb3Igd2hlcmUgdGhlIGFzc2V0cyB3aWxsIGJlIHNlbnQuXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyBwcm92aWRlZFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBvdXRwdXRzXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqIEBwYXJhbSBhc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgYXNzZXQgdG8gc2VuZC4gRGVmYXVsdHMgdG8gQVhDIGFzc2V0SUQuXG4gICAqIFJlZ2FyZGxlc3Mgb2YgdGhlIGFzc2V0IHdoaWNoIHlvdVwicmUgZXhwb3J0aW5nLCBhbGwgZmVlcyBhcmUgcGFpZCBpbiBBWEMuXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIChbW1Vuc2lnbmVkVHhdXSkgd2hpY2ggY29udGFpbnMgYW4gW1tFeHBvcnRUeF1dLlxuICAgKi9cbiAgYnVpbGRFeHBvcnRUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIGFtb3VudDogQk4sXG4gICAgZGVzdGluYXRpb25DaGFpbjogQnVmZmVyIHwgc3RyaW5nLFxuICAgIHRvQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBmcm9tQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDEsXG4gICAgYXNzZXRJRDogc3RyaW5nID0gdW5kZWZpbmVkXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IHByZWZpeGVzOiBvYmplY3QgPSB7fVxuICAgIHRvQWRkcmVzc2VzLm1hcCgoYTogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgICBwcmVmaXhlc1thLnNwbGl0KFwiLVwiKVswXV0gPSB0cnVlXG4gICAgfSlcbiAgICBpZiAoT2JqZWN0LmtleXMocHJlZml4ZXMpLmxlbmd0aCAhPT0gMSkge1xuICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFWTUFQSS5idWlsZEV4cG9ydFR4OiBUbyBhZGRyZXNzZXMgbXVzdCBoYXZlIHRoZSBzYW1lIGNoYWluSUQgcHJlZml4LlwiXG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aHJvdyBuZXcgQ2hhaW5JZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVZNQVBJLmJ1aWxkRXhwb3J0VHg6IERlc3RpbmF0aW9uIENoYWluSUQgaXMgdW5kZWZpbmVkLlwiXG4gICAgICApXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVzdGluYXRpb25DaGFpbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgZGVzdGluYXRpb25DaGFpbiA9IGJpbnRvb2xzLmNiNThEZWNvZGUoZGVzdGluYXRpb25DaGFpbikgLy9cbiAgICB9IGVsc2UgaWYgKCEoZGVzdGluYXRpb25DaGFpbiBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBVk1BUEkuYnVpbGRFeHBvcnRUeDogSW52YWxpZCBkZXN0aW5hdGlvbkNoYWluIHR5cGU6IFwiICtcbiAgICAgICAgICB0eXBlb2YgZGVzdGluYXRpb25DaGFpblxuICAgICAgKVxuICAgIH1cbiAgICBpZiAoZGVzdGluYXRpb25DaGFpbi5sZW5ndGggIT09IDMyKSB7XG4gICAgICB0aHJvdyBuZXcgQ2hhaW5JZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVZNQVBJLmJ1aWxkRXhwb3J0VHg6IERlc3RpbmF0aW9uIENoYWluSUQgbXVzdCBiZSAzMiBieXRlcyBpbiBsZW5ndGguXCJcbiAgICAgIClcbiAgICB9XG5cbiAgICBjb25zdCB0bzogQnVmZmVyW10gPSBbXVxuICAgIHRvQWRkcmVzc2VzLm1hcCgoYTogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgICB0by5wdXNoKGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcbiAgICB9KVxuXG4gICAgY29uc3QgY2FsbGVyOiBzdHJpbmcgPSBcImJ1aWxkRXhwb3J0VHhcIlxuICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbUFkZHJlc3NlcywgY2FsbGVyKS5tYXAoXG4gICAgICAoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKVxuICAgIClcblxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgYXhjQXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBWENBc3NldElEKClcbiAgICBpZiAodHlwZW9mIGFzc2V0SUQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGFzc2V0SUQgPSBiaW50b29scy5jYjU4RW5jb2RlKGF4Y0Fzc2V0SUQpXG4gICAgfVxuXG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBjb25zdCBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpXG4gICAgY29uc3QgYXNzZXRJREJ1ZjogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZShhc3NldElEKVxuICAgIGNvbnN0IGZlZTogQk4gPSB0aGlzLmdldFR4RmVlKClcbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkRXhwb3J0VHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBhbW91bnQsXG4gICAgICBhc3NldElEQnVmLFxuICAgICAgdG8sXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgZGVzdGluYXRpb25DaGFpbixcbiAgICAgIGZlZSxcbiAgICAgIGF4Y0Fzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZixcbiAgICAgIGxvY2t0aW1lLFxuICAgICAgdGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFWTUFQSS5idWlsZEV4cG9ydFR4OkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIlxuICAgICAgKVxuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIGluaXRpYWxTdGF0ZSBUaGUgW1tJbml0aWFsU3RhdGVzXV0gdGhhdCByZXByZXNlbnQgdGhlIGludGlhbCBzdGF0ZSBvZiBhIGNyZWF0ZWQgYXNzZXRcbiAgICogQHBhcmFtIG5hbWUgU3RyaW5nIGZvciB0aGUgZGVzY3JpcHRpdmUgbmFtZSBvZiB0aGUgYXNzZXRcbiAgICogQHBhcmFtIHN5bWJvbCBTdHJpbmcgZm9yIHRoZSB0aWNrZXIgc3ltYm9sIG9mIHRoZSBhc3NldFxuICAgKiBAcGFyYW0gZGVub21pbmF0aW9uIE51bWJlciBmb3IgdGhlIGRlbm9taW5hdGlvbiB3aGljaCBpcyAxMF5ELiBEIG11c3QgYmUgPj0gMCBhbmQgPD0gMzIuIEV4OiAkMSBBWEMgPSAxMF45ICRuQVhDXG4gICAqIEBwYXJhbSBtaW50T3V0cHV0cyBPcHRpb25hbC4gQXJyYXkgb2YgW1tTRUNQTWludE91dHB1dF1dcyB0byBiZSBpbmNsdWRlZCBpbiB0aGUgdHJhbnNhY3Rpb24uIFRoZXNlIG91dHB1dHMgY2FuIGJlIHNwZW50IHRvIG1pbnQgbW9yZSB0b2tlbnMuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGEgW1tDcmVhdGVBc3NldFR4XV0uXG4gICAqXG4gICAqL1xuICBidWlsZENyZWF0ZUFzc2V0VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBmcm9tQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGluaXRpYWxTdGF0ZXM6IEluaXRpYWxTdGF0ZXMsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHN5bWJvbDogc3RyaW5nLFxuICAgIGRlbm9taW5hdGlvbjogbnVtYmVyLFxuICAgIG1pbnRPdXRwdXRzOiBTRUNQTWludE91dHB1dFtdID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGNhbGxlcjogc3RyaW5nID0gXCJidWlsZENyZWF0ZUFzc2V0VHhcIlxuICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoZnJvbUFkZHJlc3NlcywgY2FsbGVyKS5tYXAoXG4gICAgICAoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKVxuICAgIClcbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBjYWxsZXJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGlmIChzeW1ib2wubGVuZ3RoID4gQVZNQ29uc3RhbnRzLlNZTUJPTE1BWExFTikge1xuICAgICAgdGhyb3cgbmV3IFN5bWJvbEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVZNQVBJLmJ1aWxkQ3JlYXRlQXNzZXRUeDogU3ltYm9scyBtYXkgbm90IGV4Y2VlZCBsZW5ndGggb2YgXCIgK1xuICAgICAgICAgIEFWTUNvbnN0YW50cy5TWU1CT0xNQVhMRU5cbiAgICAgIClcbiAgICB9XG4gICAgaWYgKG5hbWUubGVuZ3RoID4gQVZNQ29uc3RhbnRzLkFTU0VUTkFNRUxFTikge1xuICAgICAgdGhyb3cgbmV3IE5hbWVFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFWTUFQSS5idWlsZENyZWF0ZUFzc2V0VHg6IE5hbWVzIG1heSBub3QgZXhjZWVkIGxlbmd0aCBvZiBcIiArXG4gICAgICAgICAgQVZNQ29uc3RhbnRzLkFTU0VUTkFNRUxFTlxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IG5ldHdvcmtJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKVxuICAgIGNvbnN0IGF4Y0Fzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVhDQXNzZXRJRCgpXG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0RGVmYXVsdENyZWF0aW9uVHhGZWUoKVxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRDcmVhdGVBc3NldFR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgZnJvbSxcbiAgICAgIGNoYW5nZSxcbiAgICAgIGluaXRpYWxTdGF0ZXMsXG4gICAgICBuYW1lLFxuICAgICAgc3ltYm9sLFxuICAgICAgZGVub21pbmF0aW9uLFxuICAgICAgbWludE91dHB1dHMsXG4gICAgICBmZWUsXG4gICAgICBheGNBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2ZcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4LCBmZWUpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBVk1BUEkuYnVpbGRDcmVhdGVBc3NldFR4OkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIlxuICAgICAgKVxuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIGJ1aWxkU0VDUE1pbnRUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIG1pbnRPd25lcjogU0VDUE1pbnRPdXRwdXQsXG4gICAgdHJhbnNmZXJPd25lcjogU0VDUFRyYW5zZmVyT3V0cHV0LFxuICAgIGZyb21BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgbWludFVUWE9JRDogc3RyaW5nLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpXG4gICk6IFByb21pc2U8YW55PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyOiBzdHJpbmcgPSBcImJ1aWxkU0VDUE1pbnRUeFwiXG4gICAgY29uc3QgZnJvbTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tQWRkcmVzc2VzLCBjYWxsZXIpLm1hcChcbiAgICAgIChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpXG4gICAgKVxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIGNhbGxlclxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBjb25zdCBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpXG4gICAgY29uc3QgYXhjQXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBWENBc3NldElEKClcbiAgICBjb25zdCBmZWU6IEJOID0gdGhpcy5nZXRNaW50VHhGZWUoKVxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRTRUNQTWludFR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgbWludE93bmVyLFxuICAgICAgdHJhbnNmZXJPd25lcixcbiAgICAgIGZyb20sXG4gICAgICBjaGFuZ2UsXG4gICAgICBtaW50VVRYT0lELFxuICAgICAgZmVlLFxuICAgICAgYXhjQXNzZXRJRCxcbiAgICAgIG1lbW8sXG4gICAgICBhc09mXG4gICAgKVxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBVk1BUEkuYnVpbGRTRUNQTWludFR4OkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIlxuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbi4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXG4gICAqIEBwYXJhbSBtaW50ZXJTZXRzIGlzIGEgbGlzdCB3aGVyZSBlYWNoIGVsZW1lbnQgc3BlY2lmaWVzIHRoYXQgdGhyZXNob2xkIG9mIHRoZSBhZGRyZXNzZXMgaW4gbWludGVycyBtYXkgdG9nZXRoZXIgbWludCBtb3JlIG9mIHRoZSBhc3NldCBieSBzaWduaW5nIGEgbWludGluZyB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gbmFtZSBTdHJpbmcgZm9yIHRoZSBkZXNjcmlwdGl2ZSBuYW1lIG9mIHRoZSBhc3NldFxuICAgKiBAcGFyYW0gc3ltYm9sIFN0cmluZyBmb3IgdGhlIHRpY2tlciBzeW1ib2wgb2YgdGhlIGFzc2V0XG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgbWludCBvdXRwdXRcbiAgICpcbiAgICogYGBganNcbiAgICogRXhhbXBsZSBtaW50ZXJTZXRzOlxuICAgKiBbXG4gICAqICAgICAge1xuICAgKiAgICAgICAgICBcIm1pbnRlcnNcIjpbXG4gICAqICAgICAgICAgICAgICBcIlN3YXAtYXhjMWdoc3RqdWtydHc4OTM1bHJ5cXRuaDY0M3hlOWE5NHUzdGM3NWM3XCJcbiAgICogICAgICAgICAgXSxcbiAgICogICAgICAgICAgXCJ0aHJlc2hvbGRcIjogMVxuICAgKiAgICAgIH0sXG4gICAqICAgICAge1xuICAgKiAgICAgICAgICBcIm1pbnRlcnNcIjogW1xuICAgKiAgICAgICAgICAgICAgXCJTd2FwLWF4YzF5ZWxsM2U0bmxuMG0zOWNmcGRoZ3FwcnNkODdqa2g0cW5ha2tseFwiLFxuICAgKiAgICAgICAgICAgICAgXCJTd2FwLWF4YzFrNG5yMjZjODBqYXF1em05MzY5ajVhNHNobXdjam4wdm1lbWNqelwiLFxuICAgKiAgICAgICAgICAgICAgXCJTd2FwLWF4YzF6dGt6c3JqbmtuMGNlazVyeXZocXN3ZHRjZzIzbmhnZTNubnI1ZVwiXG4gICAqICAgICAgICAgIF0sXG4gICAqICAgICAgICAgIFwidGhyZXNob2xkXCI6IDJcbiAgICogICAgICB9XG4gICAqIF1cbiAgICogYGBgXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIChbW1Vuc2lnbmVkVHhdXSkgd2hpY2ggY29udGFpbnMgYSBbW0NyZWF0ZUFzc2V0VHhdXS5cbiAgICpcbiAgICovXG4gIGJ1aWxkQ3JlYXRlTkZUQXNzZXRUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIGZyb21BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgbWludGVyU2V0czogTWludGVyU2V0W10sXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHN5bWJvbDogc3RyaW5nLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwiYnVpbGRDcmVhdGVORlRBc3NldFR4XCJcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsIGNhbGxlcikubWFwKFxuICAgICAgKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSlcbiAgICApXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXG5cbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBpZiAobmFtZS5sZW5ndGggPiBBVk1Db25zdGFudHMuQVNTRVROQU1FTEVOKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IE5hbWVFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFWTUFQSS5idWlsZENyZWF0ZU5GVEFzc2V0VHg6IE5hbWVzIG1heSBub3QgZXhjZWVkIGxlbmd0aCBvZiBcIiArXG4gICAgICAgICAgQVZNQ29uc3RhbnRzLkFTU0VUTkFNRUxFTlxuICAgICAgKVxuICAgIH1cbiAgICBpZiAoc3ltYm9sLmxlbmd0aCA+IEFWTUNvbnN0YW50cy5TWU1CT0xNQVhMRU4pIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgU3ltYm9sRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBBVk1BUEkuYnVpbGRDcmVhdGVORlRBc3NldFR4OiBTeW1ib2xzIG1heSBub3QgZXhjZWVkIGxlbmd0aCBvZiBcIiArXG4gICAgICAgICAgQVZNQ29uc3RhbnRzLlNZTUJPTE1BWExFTlxuICAgICAgKVxuICAgIH1cbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRClcbiAgICBjb25zdCBjcmVhdGlvblR4RmVlOiBCTiA9IHRoaXMuZ2V0Q3JlYXRpb25UeEZlZSgpXG4gICAgY29uc3QgYXhjQXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBWENBc3NldElEKClcbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkQ3JlYXRlTkZUQXNzZXRUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIGZyb20sXG4gICAgICBjaGFuZ2UsXG4gICAgICBtaW50ZXJTZXRzLFxuICAgICAgbmFtZSxcbiAgICAgIHN5bWJvbCxcbiAgICAgIGNyZWF0aW9uVHhGZWUsXG4gICAgICBheGNBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBsb2NrdGltZVxuICAgIClcbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4LCBjcmVhdGlvblR4RmVlKSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVZNQVBJLmJ1aWxkQ3JlYXRlTkZUQXNzZXRUeDpGYWlsZWQgR29vc2UgRWdnIENoZWNrXCJcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gdW5zaWduZWQgdHJhbnNhY3Rpb24uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgIEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSBvd25lcnMgRWl0aGVyIGEgc2luZ2xlIG9yIGFuIGFycmF5IG9mIFtbT3V0cHV0T3duZXJzXV0gdG8gc2VuZCB0aGUgbmZ0IG91dHB1dFxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgTkZUIGZyb20gdGhlIHV0eG9JRCBwcm92aWRlZFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIHV0eG9pZCBBIGJhc2U1OCB1dHhvSUQgb3IgYW4gYXJyYXkgb2YgYmFzZTU4IHV0eG9JRHMgZm9yIHRoZSBuZnQgbWludCBvdXRwdXQgdGhpcyB0cmFuc2FjdGlvbiBpcyBzZW5kaW5nXG4gICAqIEBwYXJhbSBncm91cElEIE9wdGlvbmFsLiBUaGUgZ3JvdXAgdGhpcyBORlQgaXMgaXNzdWVkIHRvLlxuICAgKiBAcGFyYW0gcGF5bG9hZCBPcHRpb25hbC4gRGF0YSBmb3IgTkZUIFBheWxvYWQgYXMgZWl0aGVyIGEgW1tQYXlsb2FkQmFzZV1dIG9yIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIChbW1Vuc2lnbmVkVHhdXSkgd2hpY2ggY29udGFpbnMgYW4gW1tPcGVyYXRpb25UeF1dLlxuICAgKlxuICAgKi9cbiAgYnVpbGRDcmVhdGVORlRNaW50VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBvd25lcnM6IE91dHB1dE93bmVyc1tdIHwgT3V0cHV0T3duZXJzLFxuICAgIGZyb21BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgdXR4b2lkOiBzdHJpbmcgfCBzdHJpbmdbXSxcbiAgICBncm91cElEOiBudW1iZXIgPSAwLFxuICAgIHBheWxvYWQ6IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpXG4gICk6IFByb21pc2U8YW55PiA9PiB7XG4gICAgY29uc3QgY2FsbGVyOiBzdHJpbmcgPSBcImJ1aWxkQ3JlYXRlTkZUTWludFR4XCJcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb21BZGRyZXNzZXMsIGNhbGxlcikubWFwKFxuICAgICAgKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSlcbiAgICApXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgY2FsbGVyXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXG5cbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBpZiAocGF5bG9hZCBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBwYXlsb2FkID0gcGF5bG9hZC5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHV0eG9pZCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdXR4b2lkID0gW3V0eG9pZF1cbiAgICB9XG5cbiAgICBjb25zdCBheGNBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFYQ0Fzc2V0SUQoKVxuXG4gICAgaWYgKG93bmVycyBpbnN0YW5jZW9mIE91dHB1dE93bmVycykge1xuICAgICAgb3duZXJzID0gW293bmVyc11cbiAgICB9XG5cbiAgICBjb25zdCBuZXR3b3JrSUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxuICAgIGNvbnN0IGJsb2NrY2hhaW5JRDogQnVmZmVyID0gYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRClcbiAgICBjb25zdCB0eEZlZTogQk4gPSB0aGlzLmdldFR4RmVlKClcbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkQ3JlYXRlTkZUTWludFR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgb3duZXJzLFxuICAgICAgZnJvbSxcbiAgICAgIGNoYW5nZSxcbiAgICAgIHV0eG9pZCxcbiAgICAgIGdyb3VwSUQsXG4gICAgICBwYXlsb2FkLFxuICAgICAgdHhGZWUsXG4gICAgICBheGNBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2ZcbiAgICApXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEFWTUFQSS5idWlsZENyZWF0ZU5GVE1pbnRUeDpGYWlsZWQgR29vc2UgRWdnIENoZWNrXCJcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCB0YWtlcyBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBhbmQgc2lnbnMgaXQsIHJldHVybmluZyB0aGUgcmVzdWx0aW5nIFtbVHhdXS5cbiAgICpcbiAgICogQHBhcmFtIHV0eCBUaGUgdW5zaWduZWQgdHJhbnNhY3Rpb24gb2YgdHlwZSBbW1Vuc2lnbmVkVHhdXVxuICAgKlxuICAgKiBAcmV0dXJucyBBIHNpZ25lZCB0cmFuc2FjdGlvbiBvZiB0eXBlIFtbVHhdXVxuICAgKi9cbiAgc2lnblR4ID0gKHV0eDogVW5zaWduZWRUeCk6IFR4ID0+IHV0eC5zaWduKHRoaXMua2V5Y2hhaW4pXG5cbiAgLyoqXG4gICAqIENhbGxzIHRoZSBub2RlJ3MgaXNzdWVUeCBtZXRob2QgZnJvbSB0aGUgQVBJIGFuZCByZXR1cm5zIHRoZSByZXN1bHRpbmcgdHJhbnNhY3Rpb24gSUQgYXMgYSBzdHJpbmcuXG4gICAqXG4gICAqIEBwYXJhbSB0eCBBIHN0cmluZywge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0sIG9yIFtbVHhdXSByZXByZXNlbnRpbmcgYSB0cmFuc2FjdGlvblxuICAgKlxuICAgKiBAcmV0dXJucyBBIFByb21pc2Ugc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdHJhbnNhY3Rpb24gSUQgb2YgdGhlIHBvc3RlZCB0cmFuc2FjdGlvbi5cbiAgICovXG4gIGlzc3VlVHggPSBhc3luYyAodHg6IHN0cmluZyB8IEJ1ZmZlciB8IFR4KTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBsZXQgVHJhbnNhY3Rpb24gPSBcIlwiXG4gICAgaWYgKHR5cGVvZiB0eCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgVHJhbnNhY3Rpb24gPSB0eFxuICAgIH0gZWxzZSBpZiAodHggaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgIGNvbnN0IHR4b2JqOiBUeCA9IG5ldyBUeCgpXG4gICAgICB0eG9iai5mcm9tQnVmZmVyKHR4KVxuICAgICAgVHJhbnNhY3Rpb24gPSB0eG9iai50b1N0cmluZygpXG4gICAgfSBlbHNlIGlmICh0eCBpbnN0YW5jZW9mIFR4KSB7XG4gICAgICBUcmFuc2FjdGlvbiA9IHR4LnRvU3RyaW5nKClcbiAgICB9IGVsc2Uge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBUcmFuc2FjdGlvbkVycm9yKFxuICAgICAgICBcIkVycm9yIC0gQVZNQVBJLmlzc3VlVHg6IHByb3ZpZGVkIHR4IGlzIG5vdCBleHBlY3RlZCB0eXBlIG9mIHN0cmluZywgQnVmZmVyLCBvciBUeFwiXG4gICAgICApXG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczogSXNzdWVUeFBhcmFtcyA9IHtcbiAgICAgIHR4OiBUcmFuc2FjdGlvbi50b1N0cmluZygpXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhdm0uaXNzdWVUeFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gIH1cblxuICAvKipcbiAgICogQ2FsbHMgdGhlIG5vZGUncyBnZXRBZGRyZXNzVHhzIG1ldGhvZCBmcm9tIHRoZSBBUEkgYW5kIHJldHVybnMgdHJhbnNhY3Rpb25zIGNvcnJlc3BvbmRpbmcgdG8gdGhlIHByb3ZpZGVkIGFkZHJlc3MgYW5kIGFzc2V0SURcbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGFkZHJlc3MgZm9yIHdoaWNoIHdlJ3JlIGZldGNoaW5nIHJlbGF0ZWQgdHJhbnNhY3Rpb25zLlxuICAgKiBAcGFyYW0gY3Vyc29yIFBhZ2UgbnVtYmVyIG9yIG9mZnNldC5cbiAgICogQHBhcmFtIHBhZ2VTaXplICBOdW1iZXIgb2YgaXRlbXMgdG8gcmV0dXJuIHBlciBwYWdlLiBPcHRpb25hbC4gRGVmYXVsdHMgdG8gMTAyNC4gSWYgW3BhZ2VTaXplXSA9PSAwIG9yIFtwYWdlU2l6ZV0gPiBbbWF4UGFnZVNpemVdLCB0aGVuIGl0IGZldGNoZXMgYXQgbWF4IFttYXhQYWdlU2l6ZV0gdHJhbnNhY3Rpb25zXG4gICAqIEBwYXJhbSBhc3NldElEIE9ubHkgcmV0dXJuIHRyYW5zYWN0aW9ucyB0aGF0IGNoYW5nZWQgdGhlIGJhbGFuY2Ugb2YgdGhpcyBhc3NldC4gTXVzdCBiZSBhbiBJRCBvciBhbiBhbGlhcyBmb3IgYW4gYXNzZXQuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSBvYmplY3QgcmVwcmVzZW50aW5nIHRoZSBhcnJheSBvZiB0cmFuc2FjdGlvbiBJRHMgYW5kIHBhZ2Ugb2Zmc2V0XG4gICAqL1xuICBnZXRBZGRyZXNzVHhzID0gYXN5bmMgKFxuICAgIGFkZHJlc3M6IHN0cmluZyxcbiAgICBjdXJzb3I6IG51bWJlcixcbiAgICBwYWdlU2l6ZTogbnVtYmVyIHwgdW5kZWZpbmVkLFxuICAgIGFzc2V0SUQ6IHN0cmluZyB8IEJ1ZmZlclxuICApOiBQcm9taXNlPEdldEFkZHJlc3NUeHNSZXNwb25zZT4gPT4ge1xuICAgIGxldCBhc3NldDogc3RyaW5nXG4gICAgbGV0IHBhZ2VTaXplTnVtOiBudW1iZXJcblxuICAgIGlmICh0eXBlb2YgYXNzZXRJRCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgYXNzZXQgPSBiaW50b29scy5jYjU4RW5jb2RlKGFzc2V0SUQpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFzc2V0ID0gYXNzZXRJRFxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgcGFnZVNpemUgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgIHBhZ2VTaXplTnVtID0gMFxuICAgIH0gZWxzZSB7XG4gICAgICBwYWdlU2l6ZU51bSA9IHBhZ2VTaXplXG4gICAgfVxuXG4gICAgY29uc3QgcGFyYW1zOiBHZXRBZGRyZXNzVHhzUGFyYW1zID0ge1xuICAgICAgYWRkcmVzcyxcbiAgICAgIGN1cnNvcixcbiAgICAgIHBhZ2VTaXplOiBwYWdlU2l6ZU51bSxcbiAgICAgIGFzc2V0SUQ6IGFzc2V0XG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF2bS5nZXRBZGRyZXNzVHhzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogU2VuZHMgYW4gYW1vdW50IG9mIGFzc2V0SUQgdG8gdGhlIHNwZWNpZmllZCBhZGRyZXNzIGZyb20gYSBsaXN0IG9mIG93bmVkIG9mIGFkZHJlc3Nlcy5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VyIHRoYXQgb3ducyB0aGUgcHJpdmF0ZSBrZXlzIGFzc29jaWF0ZWQgd2l0aCB0aGUgYGZyb21gIGFkZHJlc3Nlc1xuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIHVubG9ja2luZyB0aGUgdXNlclxuICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgYXNzZXRJRCBvZiB0aGUgYXNzZXQgdG8gc2VuZFxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgb2YgdGhlIGFzc2V0IHRvIGJlIHNlbnRcbiAgICogQHBhcmFtIHRvIFRoZSBhZGRyZXNzIG9mIHRoZSByZWNpcGllbnRcbiAgICogQHBhcmFtIGZyb20gT3B0aW9uYWwuIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBtYW5hZ2VkIGJ5IHRoZSBub2RlJ3Mga2V5c3RvcmUgZm9yIHRoaXMgYmxvY2tjaGFpbiB3aGljaCB3aWxsIGZ1bmQgdGhpcyB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gY2hhbmdlQWRkciBPcHRpb25hbC4gQW4gYWRkcmVzcyB0byBzZW5kIHRoZSBjaGFuZ2VcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwuIENCNTggQnVmZmVyIG9yIFN0cmluZyB3aGljaCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciB0aGUgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdHJhbnNhY3Rpb24ncyBJRC5cbiAgICovXG4gIHNlbmQgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIGFzc2V0SUQ6IHN0cmluZyB8IEJ1ZmZlcixcbiAgICBhbW91bnQ6IG51bWJlciB8IEJOLFxuICAgIHRvOiBzdHJpbmcsXG4gICAgZnJvbTogc3RyaW5nW10gfCBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcbiAgICBjaGFuZ2VBZGRyOiBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgbWVtbzogc3RyaW5nIHwgQnVmZmVyID0gdW5kZWZpbmVkXG4gICk6IFByb21pc2U8U2VuZFJlc3BvbnNlPiA9PiB7XG4gICAgbGV0IGFzc2V0OiBzdHJpbmdcbiAgICBsZXQgYW1udDogQk5cblxuICAgIGlmICh0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3ModG8pID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcIkVycm9yIC0gQVZNQVBJLnNlbmQ6IEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIilcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGFzc2V0SUQgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGFzc2V0ID0gYmludG9vbHMuY2I1OEVuY29kZShhc3NldElEKVxuICAgIH0gZWxzZSB7XG4gICAgICBhc3NldCA9IGFzc2V0SURcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhbW91bnQgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgIGFtbnQgPSBuZXcgQk4oYW1vdW50KVxuICAgIH0gZWxzZSB7XG4gICAgICBhbW50ID0gYW1vdW50XG4gICAgfVxuXG4gICAgY29uc3QgcGFyYW1zOiBTZW5kUGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxuICAgICAgYXNzZXRJRDogYXNzZXQsXG4gICAgICBhbW91bnQ6IGFtbnQudG9TdHJpbmcoMTApLFxuICAgICAgdG86IHRvXG4gICAgfVxuXG4gICAgY29uc3QgY2FsbGVyOiBzdHJpbmcgPSBcInNlbmRcIlxuICAgIGZyb20gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShmcm9tLCBjYWxsZXIpXG4gICAgaWYgKHR5cGVvZiBmcm9tICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXNbXCJmcm9tXCJdID0gZnJvbVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgY2hhbmdlQWRkciAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhjaGFuZ2VBZGRyKSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFwiRXJyb3IgLSBBVk1BUEkuc2VuZDogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKVxuICAgICAgfVxuICAgICAgcGFyYW1zW1wiY2hhbmdlQWRkclwiXSA9IGNoYW5nZUFkZHJcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG1lbW8gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlmICh0eXBlb2YgbWVtbyAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICBwYXJhbXNbXCJtZW1vXCJdID0gYmludG9vbHMuY2I1OEVuY29kZShtZW1vKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFyYW1zW1wibWVtb1wiXSA9IG1lbW9cbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF2bS5zZW5kXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogU2VuZHMgYW4gYW1vdW50IG9mIGFzc2V0SUQgdG8gYW4gYXJyYXkgb2Ygc3BlY2lmaWVkIGFkZHJlc3NlcyBmcm9tIGEgbGlzdCBvZiBvd25lZCBvZiBhZGRyZXNzZXMuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlciB0aGF0IG93bnMgdGhlIHByaXZhdGUga2V5cyBhc3NvY2lhdGVkIHdpdGggdGhlIGBmcm9tYCBhZGRyZXNzZXNcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCB1bmxvY2tpbmcgdGhlIHVzZXJcbiAgICogQHBhcmFtIHNlbmRPdXRwdXRzIFRoZSBhcnJheSBvZiBTZW5kT3V0cHV0cy4gQSBTZW5kT3V0cHV0IGlzIGFuIG9iamVjdCBsaXRlcmFsIHdoaWNoIGNvbnRhaW5zIGFuIGFzc2V0SUQsIGFtb3VudCwgYW5kIHRvLlxuICAgKiBAcGFyYW0gZnJvbSBPcHRpb25hbC4gQW4gYXJyYXkgb2YgYWRkcmVzc2VzIG1hbmFnZWQgYnkgdGhlIG5vZGUncyBrZXlzdG9yZSBmb3IgdGhpcyBibG9ja2NoYWluIHdoaWNoIHdpbGwgZnVuZCB0aGlzIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyIE9wdGlvbmFsLiBBbiBhZGRyZXNzIHRvIHNlbmQgdGhlIGNoYW5nZVxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbC4gQ0I1OCBCdWZmZXIgb3IgU3RyaW5nIHdoaWNoIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIHRoZSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB0cmFuc2FjdGlvblwicyBJRC5cbiAgICovXG4gIHNlbmRNdWx0aXBsZSA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgc2VuZE91dHB1dHM6IHtcbiAgICAgIGFzc2V0SUQ6IHN0cmluZyB8IEJ1ZmZlclxuICAgICAgYW1vdW50OiBudW1iZXIgfCBCTlxuICAgICAgdG86IHN0cmluZ1xuICAgIH1bXSxcbiAgICBmcm9tOiBzdHJpbmdbXSB8IEJ1ZmZlcltdID0gdW5kZWZpbmVkLFxuICAgIGNoYW5nZUFkZHI6IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBzdHJpbmcgfCBCdWZmZXIgPSB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxTZW5kTXVsdGlwbGVSZXNwb25zZT4gPT4ge1xuICAgIGxldCBhc3NldDogc3RyaW5nXG4gICAgbGV0IGFtbnQ6IEJOXG4gICAgY29uc3Qgc091dHB1dHM6IFNPdXRwdXRzUGFyYW1zW10gPSBbXVxuXG4gICAgc2VuZE91dHB1dHMuZm9yRWFjaChcbiAgICAgIChvdXRwdXQ6IHtcbiAgICAgICAgYXNzZXRJRDogc3RyaW5nIHwgQnVmZmVyXG4gICAgICAgIGFtb3VudDogbnVtYmVyIHwgQk5cbiAgICAgICAgdG86IHN0cmluZ1xuICAgICAgfSkgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKG91dHB1dC50bykgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXG4gICAgICAgICAgICBcIkVycm9yIC0gQVZNQVBJLnNlbmRNdWx0aXBsZTogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb3V0cHV0LmFzc2V0SUQgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBhc3NldCA9IGJpbnRvb2xzLmNiNThFbmNvZGUob3V0cHV0LmFzc2V0SUQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXNzZXQgPSBvdXRwdXQuYXNzZXRJRFxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygb3V0cHV0LmFtb3VudCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgIGFtbnQgPSBuZXcgQk4ob3V0cHV0LmFtb3VudClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhbW50ID0gb3V0cHV0LmFtb3VudFxuICAgICAgICB9XG4gICAgICAgIHNPdXRwdXRzLnB1c2goe1xuICAgICAgICAgIHRvOiBvdXRwdXQudG8sXG4gICAgICAgICAgYXNzZXRJRDogYXNzZXQsXG4gICAgICAgICAgYW1vdW50OiBhbW50LnRvU3RyaW5nKDEwKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIClcblxuICAgIGNvbnN0IHBhcmFtczogU2VuZE11bHRpcGxlUGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQ6IHBhc3N3b3JkLFxuICAgICAgb3V0cHV0czogc091dHB1dHNcbiAgICB9XG5cbiAgICBjb25zdCBjYWxsZXI6IHN0cmluZyA9IFwic2VuZFwiXG4gICAgZnJvbSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KGZyb20sIGNhbGxlcilcbiAgICBpZiAodHlwZW9mIGZyb20gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtcy5mcm9tID0gZnJvbVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgY2hhbmdlQWRkciAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhjaGFuZ2VBZGRyKSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFwiRXJyb3IgLSBBVk1BUEkuc2VuZDogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKVxuICAgICAgfVxuICAgICAgcGFyYW1zLmNoYW5nZUFkZHIgPSBjaGFuZ2VBZGRyXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBtZW1vICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpZiAodHlwZW9mIG1lbW8gIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcGFyYW1zLm1lbW8gPSBiaW50b29scy5jYjU4RW5jb2RlKG1lbW8pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJhbXMubWVtbyA9IG1lbW9cbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF2bS5zZW5kTXVsdGlwbGVcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiBhIEpTT04gcmVwcmVzZW50YXRpb24gb2YgdGhpcyBWaXJ0dWFsIE1hY2hpbmXigJlzIGdlbmVzaXMgc3RhdGUsIGNyZWF0ZSB0aGUgYnl0ZSByZXByZXNlbnRhdGlvbiBvZiB0aGF0IHN0YXRlLlxuICAgKlxuICAgKiBAcGFyYW0gZ2VuZXNpc0RhdGEgVGhlIGJsb2NrY2hhaW4ncyBnZW5lc2lzIGRhdGEgb2JqZWN0XG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2Ugb2YgYSBzdHJpbmcgb2YgYnl0ZXNcbiAgICovXG4gIGJ1aWxkR2VuZXNpcyA9IGFzeW5jIChnZW5lc2lzRGF0YTogb2JqZWN0KTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEJ1aWxkR2VuZXNpc1BhcmFtcyA9IHtcbiAgICAgIGdlbmVzaXNEYXRhXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhdm0uYnVpbGRHZW5lc2lzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmJ5dGVzXG4gIH1cblxuICAvKipcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgcHJvdGVjdGVkIF9jbGVhbkFkZHJlc3NBcnJheShcbiAgICBhZGRyZXNzZXM6IHN0cmluZ1tdIHwgQnVmZmVyW10sXG4gICAgY2FsbGVyOiBzdHJpbmdcbiAgKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGFkZHJzOiBzdHJpbmdbXSA9IFtdXG4gICAgY29uc3QgY2hhaW5JRDogc3RyaW5nID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxuICAgICAgPyB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXG4gICAgICA6IHRoaXMuZ2V0QmxvY2tjaGFpbklEKClcbiAgICBpZiAoYWRkcmVzc2VzICYmIGFkZHJlc3Nlcy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgYWRkcmVzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYWRkcmVzc2VzW2Ake2l9YF0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3MoYWRkcmVzc2VzW2Ake2l9YF0gYXMgc3RyaW5nKSA9PT1cbiAgICAgICAgICAgIFwidW5kZWZpbmVkXCJcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxuICAgICAgICAgICAgICBcIkVycm9yIC0gQVZNQVBJLiR7Y2FsbGVyfTogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiXG4gICAgICAgICAgICApXG4gICAgICAgICAgfVxuICAgICAgICAgIGFkZHJzLnB1c2goYWRkcmVzc2VzW2Ake2l9YF0gYXMgc3RyaW5nKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHR5cGU6IFNlcmlhbGl6ZWRUeXBlID0gXCJiZWNoMzJcIlxuICAgICAgICAgIGFkZHJzLnB1c2goXG4gICAgICAgICAgICBzZXJpYWxpemF0aW9uLmJ1ZmZlclRvVHlwZShcbiAgICAgICAgICAgICAgYWRkcmVzc2VzW2Ake2l9YF0gYXMgQnVmZmVyLFxuICAgICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgICB0aGlzLmNvcmUuZ2V0SFJQKCksXG4gICAgICAgICAgICAgIGNoYWluSURcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFkZHJzXG4gIH1cblxuICAvKipcbiAgICogVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGluc3RhbnRpYXRlZCBkaXJlY3RseS4gSW5zdGVhZCB1c2UgdGhlIFtbQXhpYS5hZGRBUGAke0l9YF1dIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIGNvcmUgQSByZWZlcmVuY2UgdG8gdGhlIEF4aWEgY2xhc3NcbiAgICogQHBhcmFtIGJhc2VVUkwgRGVmYXVsdHMgdG8gdGhlIHN0cmluZyBcIi9leHQvYmMvU3dhcFwiIGFzIHRoZSBwYXRoIHRvIGJsb2NrY2hhaW4ncyBiYXNlVVJMXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgVGhlIEJsb2NrY2hhaW5cInMgSUQuIERlZmF1bHRzIHRvIGFuIGVtcHR5IHN0cmluZzogXCJcIlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgY29yZTogQXhpYUNvcmUsXG4gICAgYmFzZVVSTDogc3RyaW5nID0gXCIvZXh0L2JjL1N3YXBcIixcbiAgICBibG9ja2NoYWluSUQ6IHN0cmluZyA9IFwiXCJcbiAgKSB7XG4gICAgc3VwZXIoY29yZSwgYmFzZVVSTClcbiAgICB0aGlzLmJsb2NrY2hhaW5JRCA9IGJsb2NrY2hhaW5JRFxuICAgIGNvbnN0IG5ldElEOiBudW1iZXIgPSBjb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgaWYgKFxuICAgICAgbmV0SUQgaW4gRGVmYXVsdHMubmV0d29yayAmJlxuICAgICAgYmxvY2tjaGFpbklEIGluIERlZmF1bHRzLm5ldHdvcmtbYCR7bmV0SUR9YF1cbiAgICApIHtcbiAgICAgIGNvbnN0IHsgYWxpYXMgfSA9IERlZmF1bHRzLm5ldHdvcmtbYCR7bmV0SUR9YF1bYCR7YmxvY2tjaGFpbklEfWBdXG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgYWxpYXMpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMua2V5Y2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5jb3JlLmdldEhSUCgpLCBibG9ja2NoYWluSUQpXG4gICAgfVxuICB9XG59XG4iXX0=