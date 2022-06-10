"use strict";
/**
 * @packageDocumentation
 * @module API-EVM
 */
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
exports.EVMAPI = void 0;
const buffer_1 = require("buffer/");
const bn_js_1 = __importDefault(require("bn.js"));
const jrpcapi_1 = require("../../common/jrpcapi");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const utxos_1 = require("./utxos");
const keychain_1 = require("./keychain");
const constants_1 = require("../../utils/constants");
const tx_1 = require("./tx");
const constants_2 = require("./constants");
const inputs_1 = require("./inputs");
const outputs_1 = require("./outputs");
const exporttx_1 = require("./exporttx");
const errors_1 = require("../../utils/errors");
const utils_1 = require("../../utils");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = utils_1.Serialization.getInstance();
/**
 * Class for interacting with a node's EVMAPI
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Axia.addAPI]] function to register this interface with Axia.
 */
class EVMAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly.
     * Instead use the [[Axia.addAPI]] method.
     *
     * @param core A reference to the Axia class
     * @param baseURL Defaults to the string "/ext/bc/C/axc" as the path to blockchain's baseURL
     * @param blockchainID The Blockchain's ID. Defaults to an empty string: ""
     */
    constructor(core, baseURL = "/ext/bc/C/axc", blockchainID = "") {
        super(core, baseURL);
        /**
         * @ignore
         */
        this.keychain = new keychain_1.KeyChain("", "");
        this.blockchainID = "";
        this.blockchainAlias = undefined;
        this.AXCAssetID = undefined;
        this.txFee = undefined;
        /**
         * Gets the alias for the blockchainID if it exists, otherwise returns `undefined`.
         *
         * @returns The alias for the blockchainID
         */
        this.getBlockchainAlias = () => {
            if (typeof this.blockchainAlias === "undefined") {
                const netID = this.core.getNetworkID();
                if (netID in constants_1.Defaults.network &&
                    this.blockchainID in constants_1.Defaults.network[`${netID}`]) {
                    this.blockchainAlias =
                        constants_1.Defaults.network[`${netID}`][this.blockchainID].alias;
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
         * @returns A boolean if the blockchainID was successfully refreshed.
         */
        this.refreshBlockchainID = (blockchainID = undefined) => {
            const netID = this.core.getNetworkID();
            if (typeof blockchainID === "undefined" &&
                typeof constants_1.Defaults.network[`${netID}`] !== "undefined") {
                this.blockchainID = constants_1.Defaults.network[`${netID}`].C.blockchainID; //default to C-Chain
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
            return bintools.parseAddress(addr, blockchainID, alias, constants_2.EVMConstants.ADDRESSLENGTH);
        };
        this.addressFromBuffer = (address) => {
            const chainID = this.getBlockchainAlias()
                ? this.getBlockchainAlias()
                : this.getBlockchainID();
            const type = "bech32";
            return serialization.bufferToType(address, type, this.core.getHRP(), chainID);
        };
        /**
         * Retrieves an assets name and symbol.
         *
         * @param assetID Either a {@link https://github.com/feross/buffer|Buffer} or an b58 serialized string for the AssetID or its alias.
         *
         * @returns Returns a Promise Asset with keys "name", "symbol", "assetID" and "denomination".
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
            const tmpBaseURL = this.getBaseURL();
            // set base url to get asset description
            this.setBaseURL("/ext/bc/X");
            const response = yield this.callMethod("avm.getAssetDescription", params);
            // set base url back what it originally was
            this.setBaseURL(tmpBaseURL);
            return {
                name: response.data.result.name,
                symbol: response.data.result.symbol,
                assetID: bintools.cb58Decode(response.data.result.assetID),
                denomination: parseInt(response.data.result.denomination, 10)
            };
        });
        /**
         * Fetches the AXC AssetID and returns it in a Promise.
         *
         * @param refresh This function caches the response. Refresh = true will bust the cache.
         *
         * @returns The the provided string representing the AXC AssetID
         */
        this.getAXCAssetID = (refresh = false) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.AXCAssetID === "undefined" || refresh) {
                const asset = yield this.getAssetDescription(constants_1.PrimaryAssetAlias);
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
            return this.core.getNetworkID() in constants_1.Defaults.network
                ? new bn_js_1.default(constants_1.Defaults.network[this.core.getNetworkID()]["C"]["txFee"])
                : new bn_js_1.default(0);
        };
        /**
         * returns the amount of [assetID] for the given address in the state of the given block number.
         * "latest", "pending", and "accepted" meta block numbers are also allowed.
         *
         * @param hexAddress The hex representation of the address
         * @param blockHeight The block height
         * @param assetID The asset ID
         *
         * @returns Returns a Promise object containing the balance
         */
        this.getAssetBalance = (hexAddress, blockHeight, assetID) => __awaiter(this, void 0, void 0, function* () {
            const params = [hexAddress, blockHeight, assetID];
            const method = "eth_getAssetBalance";
            const path = "ext/bc/C/rpc";
            const response = yield this.callMethod(method, params, path);
            return response.data;
        });
        /**
         * Returns the status of a provided atomic transaction ID by calling the node's `getAtomicTxStatus` method.
         *
         * @param txID The string representation of the transaction ID
         *
         * @returns Returns a Promise string containing the status retrieved from the node
         */
        this.getAtomicTxStatus = (txID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID
            };
            const response = yield this.callMethod("axc.getAtomicTxStatus", params);
            return response.data.result.status
                ? response.data.result.status
                : response.data.result;
        });
        /**
         * Returns the transaction data of a provided transaction ID by calling the node's `getAtomicTx` method.
         *
         * @param txID The string representation of the transaction ID
         *
         * @returns Returns a Promise string containing the bytes retrieved from the node
         */
        this.getAtomicTx = (txID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID
            };
            const response = yield this.callMethod("axc.getAtomicTx", params);
            return response.data.result.tx;
        });
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
         * Send ANT (Axia Native Token) assets including AXC from the C-Chain to an account on the X-Chain.
         *
         * After calling this method, you must call the X-Chain’s import method to complete the transfer.
         *
         * @param username The Keystore user that controls the X-Chain account specified in `to`
         * @param password The password of the Keystore user
         * @param to The account on the X-Chain to send the AXC to.
         * @param amount Amount of asset to export as a {@link https://github.com/indutny/bn.js/|BN}
         * @param assetID The asset id which is being sent
         *
         * @returns String representing the transaction id
         */
        this.export = (username, password, to, amount, assetID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                amount: amount.toString(10),
                username,
                password,
                assetID
            };
            const response = yield this.callMethod("axc.export", params);
            return response.data.result.txID
                ? response.data.result.txID
                : response.data.result;
        });
        /**
         * Send AXC from the C-Chain to an account on the X-Chain.
         *
         * After calling this method, you must call the X-Chain’s importAXC method to complete the transfer.
         *
         * @param username The Keystore user that controls the X-Chain account specified in `to`
         * @param password The password of the Keystore user
         * @param to The account on the X-Chain to send the AXC to.
         * @param amount Amount of AXC to export as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns String representing the transaction id
         */
        this.exportAXC = (username, password, to, amount) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                amount: amount.toString(10),
                username,
                password
            };
            const response = yield this.callMethod("axc.exportAXC", params);
            return response.data.result.txID
                ? response.data.result.txID
                : response.data.result;
        });
        /**
         * Retrieves the UTXOs related to the addresses provided from the node's `getUTXOs` method.
         *
         * @param addresses An array of addresses as cb58 strings or addresses as {@link https://github.com/feross/buffer|Buffer}s
         * @param sourceChain A string for the chain to look for the UTXO's. Default is to use this chain, but if exported UTXOs exist
         * from other chains, this can used to pull them instead.
         * @param limit Optional. Returns at most [limit] addresses. If [limit] == 0 or > [maxUTXOsToFetch], fetches up to [maxUTXOsToFetch].
         * @param startIndex Optional. [StartIndex] defines where to start fetching UTXOs (for pagination.)
         * UTXOs fetched are from addresses equal to or greater than [StartIndex.Address]
         * For address [StartIndex.Address], only UTXOs with IDs greater than [StartIndex.Utxo] will be returned.
         */
        this.getUTXOs = (addresses, sourceChain = undefined, limit = 0, startIndex = undefined) => __awaiter(this, void 0, void 0, function* () {
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
            const response = yield this.callMethod("axc.getUTXOs", params);
            const utxos = new utxos_1.UTXOSet();
            const data = response.data.result.utxos;
            utxos.addArray(data, false);
            response.data.result.utxos = utxos;
            return response.data.result;
        });
        /**
         * Send ANT (Axia Native Token) assets including AXC from an account on the X-Chain to an address on the C-Chain. This transaction
         * must be signed with the key of the account that the asset is sent from and which pays
         * the transaction fee.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The address of the account the asset is sent to.
         * @param sourceChain The chainID where the funds are coming from. Ex: "X"
         *
         * @returns Promise for a string for the transaction, which should be sent to the network
         * by calling issueTx.
         */
        this.import = (username, password, to, sourceChain) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                sourceChain,
                username,
                password
            };
            const response = yield this.callMethod("axc.import", params);
            return response.data.result.txID
                ? response.data.result.txID
                : response.data.result;
        });
        /**
         * Send AXC from an account on the X-Chain to an address on the C-Chain. This transaction
         * must be signed with the key of the account that the AXC is sent from and which pays
         * the transaction fee.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The address of the account the AXC is sent to. This must be the same as the to
         * argument in the corresponding call to the X-Chain’s exportAXC
         * @param sourceChain The chainID where the funds are coming from.
         *
         * @returns Promise for a string for the transaction, which should be sent to the network
         * by calling issueTx.
         */
        this.importAXC = (username, password, to, sourceChain) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                to,
                sourceChain,
                username,
                password
            };
            const response = yield this.callMethod("axc.importAXC", params);
            return response.data.result.txID
                ? response.data.result.txID
                : response.data.result;
        });
        /**
         * Give a user control over an address by providing the private key that controls the address.
         *
         * @param username The name of the user to store the private key
         * @param password The password that unlocks the user
         * @param privateKey A string representing the private key in the vm"s format
         *
         * @returns The address for the imported private key.
         */
        this.importKey = (username, password, privateKey) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                privateKey
            };
            const response = yield this.callMethod("axc.importKey", params);
            return response.data.result.address
                ? response.data.result.address
                : response.data.result;
        });
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
                throw new errors_1.TransactionError("Error - axc.issueTx: provided tx is not expected type of string, Buffer, or Tx");
            }
            const params = {
                tx: Transaction.toString()
            };
            const response = yield this.callMethod("axc.issueTx", params);
            return response.data.result.txID
                ? response.data.result.txID
                : response.data.result;
        });
        /**
         * Exports the private key for an address.
         *
         * @param username The name of the user with the private key
         * @param password The password used to decrypt the private key
         * @param address The address whose private key should be exported
         *
         * @returns Promise with the decrypted private key and private key hex as store in the database
         */
        this.exportKey = (username, password, address) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                address
            };
            const response = yield this.callMethod("axc.exportKey", params);
            return response.data.result;
        });
        /**
         * Helper function which creates an unsigned Import Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param toAddress The address to send the funds
         * @param ownerAddresses The addresses being used to import
         * @param sourceChain The chainid for where the import is coming from
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains a [[ImportTx]].
         *
         * @remarks
         * This helper exists because the endpoint API should be the primary point of entry for most functionality.
         */
        this.buildImportTx = (utxoset, toAddress, ownerAddresses, sourceChain, fromAddresses, fee = new bn_js_1.default(0)) => __awaiter(this, void 0, void 0, function* () {
            const from = this._cleanAddressArray(fromAddresses, "buildImportTx").map((a) => bintools.stringToAddress(a));
            let srcChain = undefined;
            if (typeof sourceChain === "string") {
                // if there is a sourceChain passed in and it's a string then save the string value and cast the original
                // variable from a string to a Buffer
                srcChain = sourceChain;
                sourceChain = bintools.cb58Decode(sourceChain);
            }
            else if (typeof sourceChain === "undefined" ||
                !(sourceChain instanceof buffer_1.Buffer)) {
                // if there is no sourceChain passed in or the sourceChain is any data type other than a Buffer then throw an error
                throw new errors_1.ChainIdError("Error - EVMAPI.buildImportTx: sourceChain is undefined or invalid sourceChain type.");
            }
            const utxoResponse = yield this.getUTXOs(ownerAddresses, srcChain, 0, undefined);
            const atomicUTXOs = utxoResponse.utxos;
            const networkID = this.core.getNetworkID();
            const axcAssetID = constants_1.Defaults.network[`${networkID}`].X.axcAssetID;
            const axcAssetIDBuf = bintools.cb58Decode(axcAssetID);
            const atomics = atomicUTXOs.getAllUTXOs();
            if (atomics.length === 0) {
                throw new errors_1.NoAtomicUTXOsError("Error - EVMAPI.buildImportTx: no atomic utxos to import");
            }
            const builtUnsignedTx = utxoset.buildImportTx(networkID, bintools.cb58Decode(this.blockchainID), toAddress, atomics, sourceChain, fee, axcAssetIDBuf);
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned Export Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
         *
         * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
         * @param assetID The asset id which is being sent
         * @param destinationChain The chainid for where the assets will be sent.
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[ExportTx]].
         */
        this.buildExportTx = (amount, assetID, destinationChain, fromAddressHex, fromAddressBech, toAddresses, nonce = 0, locktime = new bn_js_1.default(0), threshold = 1, fee = new bn_js_1.default(0)) => __awaiter(this, void 0, void 0, function* () {
            const prefixes = {};
            toAddresses.map((address) => {
                prefixes[address.split("-")[0]] = true;
            });
            if (Object.keys(prefixes).length !== 1) {
                throw new errors_1.AddressError("Error - EVMAPI.buildExportTx: To addresses must have the same chainID prefix.");
            }
            if (typeof destinationChain === "undefined") {
                throw new errors_1.ChainIdError("Error - EVMAPI.buildExportTx: Destination ChainID is undefined.");
            }
            else if (typeof destinationChain === "string") {
                destinationChain = bintools.cb58Decode(destinationChain);
            }
            else if (!(destinationChain instanceof buffer_1.Buffer)) {
                throw new errors_1.ChainIdError("Error - EVMAPI.buildExportTx: Invalid destinationChain type");
            }
            if (destinationChain.length !== 32) {
                throw new errors_1.ChainIdError("Error - EVMAPI.buildExportTx: Destination ChainID must be 32 bytes in length.");
            }
            const assetDescription = yield this.getAssetDescription("AXC");
            let evmInputs = [];
            if (bintools.cb58Encode(assetDescription.assetID) === assetID) {
                const evmInput = new inputs_1.EVMInput(fromAddressHex, amount.add(fee), assetID, nonce);
                evmInput.addSignatureIdx(0, bintools.stringToAddress(fromAddressBech));
                evmInputs.push(evmInput);
            }
            else {
                // if asset id isn't AXC asset id then create 2 inputs
                // first input will be AXC and will be for the amount of the fee
                // second input will be the ANT
                const evmAXCInput = new inputs_1.EVMInput(fromAddressHex, fee, assetDescription.assetID, nonce);
                evmAXCInput.addSignatureIdx(0, bintools.stringToAddress(fromAddressBech));
                evmInputs.push(evmAXCInput);
                const evmANTInput = new inputs_1.EVMInput(fromAddressHex, amount, assetID, nonce);
                evmANTInput.addSignatureIdx(0, bintools.stringToAddress(fromAddressBech));
                evmInputs.push(evmANTInput);
            }
            const to = [];
            toAddresses.map((address) => {
                to.push(bintools.stringToAddress(address));
            });
            let exportedOuts = [];
            const secpTransferOutput = new outputs_1.SECPTransferOutput(amount, to, locktime, threshold);
            const transferableOutput = new outputs_1.TransferableOutput(bintools.cb58Decode(assetID), secpTransferOutput);
            exportedOuts.push(transferableOutput);
            // lexicographically sort ins and outs
            evmInputs = evmInputs.sort(inputs_1.EVMInput.comparator());
            exportedOuts = exportedOuts.sort(outputs_1.TransferableOutput.comparator());
            const exportTx = new exporttx_1.ExportTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), destinationChain, evmInputs, exportedOuts);
            const unsignedTx = new tx_1.UnsignedTx(exportTx);
            return unsignedTx;
        });
        /**
         * Gets a reference to the keychain for this class.
         *
         * @returns The instance of [[KeyChain]] for this class
         */
        this.keyChain = () => this.keychain;
        /**
         *
         * @returns new instance of [[KeyChain]]
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
         * @returns a Promise string containing the base fee for the next block.
         */
        this.getBaseFee = () => __awaiter(this, void 0, void 0, function* () {
            const params = [];
            const method = "eth_baseFee";
            const path = "ext/bc/C/rpc";
            const response = yield this.callMethod(method, params, path);
            return response.data.result;
        });
        /**
         * returns the priority fee needed to be included in a block.
         *
         * @returns Returns a Promise string containing the priority fee needed to be included in a block.
         */
        this.getMaxPriorityFeePerGas = () => __awaiter(this, void 0, void 0, function* () {
            const params = [];
            const method = "eth_maxPriorityFeePerGas";
            const path = "ext/bc/C/rpc";
            const response = yield this.callMethod(method, params, path);
            return response.data.result;
        });
        this.blockchainID = blockchainID;
        const netID = core.getNetworkID();
        if (netID in constants_1.Defaults.network &&
            blockchainID in constants_1.Defaults.network[`${netID}`]) {
            const { alias } = constants_1.Defaults.network[`${netID}`][`${blockchainID}`];
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
        const chainid = this.getBlockchainAlias()
            ? this.getBlockchainAlias()
            : this.getBlockchainID();
        if (addresses && addresses.length > 0) {
            addresses.forEach((address) => {
                if (typeof address === "string") {
                    if (typeof this.parseAddress(address) === "undefined") {
                        /* istanbul ignore next */
                        throw new errors_1.AddressError("Error - Invalid address format");
                    }
                    addrs.push(address);
                }
                else {
                    const type = "bech32";
                    addrs.push(serialization.bufferToType(address, type, this.core.getHRP(), chainid));
                }
            });
        }
        return addrs;
    }
}
exports.EVMAPI = EVMAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvZXZtL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7Ozs7QUFFSCxvQ0FBZ0M7QUFDaEMsa0RBQXNCO0FBRXRCLGtEQUE4QztBQUU5QyxvRUFBMkM7QUFDM0MsbUNBQXVDO0FBQ3ZDLHlDQUFxQztBQUNyQyxxREFBbUU7QUFDbkUsNkJBQXFDO0FBQ3JDLDJDQUEwQztBQU8xQyxxQ0FBbUM7QUFDbkMsdUNBQWtFO0FBQ2xFLHlDQUFxQztBQUNyQywrQ0FLMkI7QUFDM0IsdUNBQTJEO0FBYzNEOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IscUJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRTs7Ozs7O0dBTUc7QUFDSCxNQUFhLE1BQU8sU0FBUSxpQkFBTztJQXV4QmpDOzs7Ozs7O09BT0c7SUFDSCxZQUNFLElBQWMsRUFDZCxVQUFrQixlQUFlLEVBQ2pDLGVBQXVCLEVBQUU7UUFFekIsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQTtRQW55QnRCOztXQUVHO1FBQ08sYUFBUSxHQUFhLElBQUksbUJBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDekMsaUJBQVksR0FBVyxFQUFFLENBQUE7UUFDekIsb0JBQWUsR0FBVyxTQUFTLENBQUE7UUFDbkMsZUFBVSxHQUFXLFNBQVMsQ0FBQTtRQUM5QixVQUFLLEdBQU8sU0FBUyxDQUFBO1FBRS9COzs7O1dBSUc7UUFDSCx1QkFBa0IsR0FBRyxHQUFXLEVBQUU7WUFDaEMsSUFBSSxPQUFPLElBQUksQ0FBQyxlQUFlLEtBQUssV0FBVyxFQUFFO2dCQUMvQyxNQUFNLEtBQUssR0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFBO2dC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QztJQTVERDs7T0FFRztJQUNPLGtCQUFrQixDQUMxQixTQUE4QixFQUM5QixNQUFjO1FBRWQsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFBO1FBQzFCLE1BQU0sT0FBTyxHQUFXLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtZQUMvQyxDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFO1lBQzNCLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUE7UUFDMUIsSUFBSSxTQUFTLElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDckMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQXdCLEVBQUUsRUFBRTtnQkFDN0MsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLEVBQUU7b0JBQy9CLElBQUksT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQWlCLENBQUMsS0FBSyxXQUFXLEVBQUU7d0JBQy9ELDBCQUEwQjt3QkFDMUIsTUFBTSxJQUFJLHFCQUFZLENBQUMsZ0NBQWdDLENBQUMsQ0FBQTtxQkFDekQ7b0JBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFpQixDQUFDLENBQUE7aUJBQzlCO3FCQUFNO29CQUNMLE1BQU0sSUFBSSxHQUFtQixRQUFRLENBQUE7b0JBQ3JDLEtBQUssQ0FBQyxJQUFJLENBQ1IsYUFBYSxDQUFDLFlBQVksQ0FDeEIsT0FBaUIsRUFDakIsSUFBSSxFQUNKLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQ2xCLE9BQU8sQ0FDUixDQUNGLENBQUE7aUJBQ0Y7WUFDSCxDQUFDLENBQUMsQ0FBQTtTQUNIO1FBQ0QsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0NBNkRGO0FBbDFCRCx3QkFrMUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUVWTVxuICovXG5cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIlxuaW1wb3J0IEF4aWFDb3JlIGZyb20gXCIuLi8uLi9heGlhXCJcbmltcG9ydCB7IEpSUENBUEkgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2pycGNhcGlcIlxuaW1wb3J0IHsgUmVxdWVzdFJlc3BvbnNlRGF0YSB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpYmFzZVwiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCB7IFVUWE9TZXQsIFVUWE8gfSBmcm9tIFwiLi91dHhvc1wiXG5pbXBvcnQgeyBLZXlDaGFpbiB9IGZyb20gXCIuL2tleWNoYWluXCJcbmltcG9ydCB7IERlZmF1bHRzLCBQcmltYXJ5QXNzZXRBbGlhcyB9IGZyb20gXCIuLi8uLi91dGlscy9jb25zdGFudHNcIlxuaW1wb3J0IHsgVHgsIFVuc2lnbmVkVHggfSBmcm9tIFwiLi90eFwiXG5pbXBvcnQgeyBFVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHtcbiAgQXNzZXQsXG4gIEluZGV4LFxuICBJc3N1ZVR4UGFyYW1zLFxuICBVVFhPUmVzcG9uc2Vcbn0gZnJvbSBcIi4vLi4vLi4vY29tbW9uL2ludGVyZmFjZXNcIlxuaW1wb3J0IHsgRVZNSW5wdXQgfSBmcm9tIFwiLi9pbnB1dHNcIlxuaW1wb3J0IHsgU0VDUFRyYW5zZmVyT3V0cHV0LCBUcmFuc2ZlcmFibGVPdXRwdXQgfSBmcm9tIFwiLi9vdXRwdXRzXCJcbmltcG9ydCB7IEV4cG9ydFR4IH0gZnJvbSBcIi4vZXhwb3J0dHhcIlxuaW1wb3J0IHtcbiAgVHJhbnNhY3Rpb25FcnJvcixcbiAgQ2hhaW5JZEVycm9yLFxuICBOb0F0b21pY1VUWE9zRXJyb3IsXG4gIEFkZHJlc3NFcnJvclxufSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRUeXBlIH0gZnJvbSBcIi4uLy4uL3V0aWxzXCJcbmltcG9ydCB7XG4gIEV4cG9ydEFYQ1BhcmFtcyxcbiAgRXhwb3J0S2V5UGFyYW1zLFxuICBFeHBvcnRQYXJhbXMsXG4gIEdldEF0b21pY1R4UGFyYW1zLFxuICBHZXRBc3NldERlc2NyaXB0aW9uUGFyYW1zLFxuICBHZXRBdG9taWNUeFN0YXR1c1BhcmFtcyxcbiAgR2V0VVRYT3NQYXJhbXMsXG4gIEltcG9ydEFYQ1BhcmFtcyxcbiAgSW1wb3J0S2V5UGFyYW1zLFxuICBJbXBvcnRQYXJhbXNcbn0gZnJvbSBcIi4vaW50ZXJmYWNlc1wiXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXG5cbi8qKlxuICogQ2xhc3MgZm9yIGludGVyYWN0aW5nIHdpdGggYSBub2RlJ3MgRVZNQVBJXG4gKlxuICogQGNhdGVnb3J5IFJQQ0FQSXNcbiAqXG4gKiBAcmVtYXJrcyBUaGlzIGV4dGVuZHMgdGhlIFtbSlJQQ0FQSV1dIGNsYXNzLiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgZGlyZWN0bHkgY2FsbGVkLiBJbnN0ZWFkLCB1c2UgdGhlIFtbQXhpYS5hZGRBUEldXSBmdW5jdGlvbiB0byByZWdpc3RlciB0aGlzIGludGVyZmFjZSB3aXRoIEF4aWEuXG4gKi9cbmV4cG9ydCBjbGFzcyBFVk1BUEkgZXh0ZW5kcyBKUlBDQVBJIHtcbiAgLyoqXG4gICAqIEBpZ25vcmVcbiAgICovXG4gIHByb3RlY3RlZCBrZXljaGFpbjogS2V5Q2hhaW4gPSBuZXcgS2V5Q2hhaW4oXCJcIiwgXCJcIilcbiAgcHJvdGVjdGVkIGJsb2NrY2hhaW5JRDogc3RyaW5nID0gXCJcIlxuICBwcm90ZWN0ZWQgYmxvY2tjaGFpbkFsaWFzOiBzdHJpbmcgPSB1bmRlZmluZWRcbiAgcHJvdGVjdGVkIEFYQ0Fzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZFxuICBwcm90ZWN0ZWQgdHhGZWU6IEJOID0gdW5kZWZpbmVkXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGFsaWFzIGZvciB0aGUgYmxvY2tjaGFpbklEIGlmIGl0IGV4aXN0cywgb3RoZXJ3aXNlIHJldHVybnMgYHVuZGVmaW5lZGAuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRFxuICAgKi9cbiAgZ2V0QmxvY2tjaGFpbkFsaWFzID0gKCk6IHN0cmluZyA9PiB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLmJsb2NrY2hhaW5BbGlhcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgY29uc3QgbmV0SUQ6IG51bWJlciA9IHRoaXMuY29yZS5nZXROZXR3b3JrSUQoKVxuICAgICAgaWYgKFxuICAgICAgICBuZXRJRCBpbiBEZWZhdWx0cy5uZXR3b3JrICYmXG4gICAgICAgIHRoaXMuYmxvY2tjaGFpbklEIGluIERlZmF1bHRzLm5ldHdvcmtbYCR7bmV0SUR9YF1cbiAgICAgICkge1xuICAgICAgICB0aGlzLmJsb2NrY2hhaW5BbGlhcyA9XG4gICAgICAgICAgRGVmYXVsdHMubmV0d29ya1tgJHtuZXRJRH1gXVt0aGlzLmJsb2NrY2hhaW5JRF0uYWxpYXNcbiAgICAgICAgcmV0dXJuIHRoaXMuYmxvY2tjaGFpbkFsaWFzXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmJsb2NrY2hhaW5BbGlhc1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGFsaWFzIGZvciB0aGUgYmxvY2tjaGFpbklELlxuICAgKlxuICAgKiBAcGFyYW0gYWxpYXMgVGhlIGFsaWFzIGZvciB0aGUgYmxvY2tjaGFpbklELlxuICAgKlxuICAgKi9cbiAgc2V0QmxvY2tjaGFpbkFsaWFzID0gKGFsaWFzOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAgIHRoaXMuYmxvY2tjaGFpbkFsaWFzID0gYWxpYXNcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIHJldHVybiB1bmRlZmluZWRcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBibG9ja2NoYWluSUQgYW5kIHJldHVybnMgaXQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBibG9ja2NoYWluSURcbiAgICovXG4gIGdldEJsb2NrY2hhaW5JRCA9ICgpOiBzdHJpbmcgPT4gdGhpcy5ibG9ja2NoYWluSURcblxuICAvKipcbiAgICogUmVmcmVzaCBibG9ja2NoYWluSUQsIGFuZCBpZiBhIGJsb2NrY2hhaW5JRCBpcyBwYXNzZWQgaW4sIHVzZSB0aGF0LlxuICAgKlxuICAgKiBAcGFyYW0gT3B0aW9uYWwuIEJsb2NrY2hhaW5JRCB0byBhc3NpZ24sIGlmIG5vbmUsIHVzZXMgdGhlIGRlZmF1bHQgYmFzZWQgb24gbmV0d29ya0lELlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGJvb2xlYW4gaWYgdGhlIGJsb2NrY2hhaW5JRCB3YXMgc3VjY2Vzc2Z1bGx5IHJlZnJlc2hlZC5cbiAgICovXG4gIHJlZnJlc2hCbG9ja2NoYWluSUQgPSAoYmxvY2tjaGFpbklEOiBzdHJpbmcgPSB1bmRlZmluZWQpOiBib29sZWFuID0+IHtcbiAgICBjb25zdCBuZXRJRDogbnVtYmVyID0gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXG4gICAgaWYgKFxuICAgICAgdHlwZW9mIGJsb2NrY2hhaW5JRCA9PT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgdHlwZW9mIERlZmF1bHRzLm5ldHdvcmtbYCR7bmV0SUR9YF0gIT09IFwidW5kZWZpbmVkXCJcbiAgICApIHtcbiAgICAgIHRoaXMuYmxvY2tjaGFpbklEID0gRGVmYXVsdHMubmV0d29ya1tgJHtuZXRJRH1gXS5DLmJsb2NrY2hhaW5JRCAvL2RlZmF1bHQgdG8gQy1DaGFpblxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGJsb2NrY2hhaW5JRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhpcy5ibG9ja2NoYWluSUQgPSBibG9ja2NoYWluSURcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYW4gYWRkcmVzcyBzdHJpbmcgYW5kIHJldHVybnMgaXRzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIGlmIHZhbGlkLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgYWRkcmVzcyBpZiB2YWxpZCwgdW5kZWZpbmVkIGlmIG5vdCB2YWxpZC5cbiAgICovXG4gIHBhcnNlQWRkcmVzcyA9IChhZGRyOiBzdHJpbmcpOiBCdWZmZXIgPT4ge1xuICAgIGNvbnN0IGFsaWFzOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXG4gICAgY29uc3QgYmxvY2tjaGFpbklEOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5JRCgpXG4gICAgcmV0dXJuIGJpbnRvb2xzLnBhcnNlQWRkcmVzcyhcbiAgICAgIGFkZHIsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBhbGlhcyxcbiAgICAgIEVWTUNvbnN0YW50cy5BRERSRVNTTEVOR1RIXG4gICAgKVxuICB9XG5cbiAgYWRkcmVzc0Zyb21CdWZmZXIgPSAoYWRkcmVzczogQnVmZmVyKTogc3RyaW5nID0+IHtcbiAgICBjb25zdCBjaGFpbklEOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXG4gICAgICA/IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcbiAgICAgIDogdGhpcy5nZXRCbG9ja2NoYWluSUQoKVxuICAgIGNvbnN0IHR5cGU6IFNlcmlhbGl6ZWRUeXBlID0gXCJiZWNoMzJcIlxuICAgIHJldHVybiBzZXJpYWxpemF0aW9uLmJ1ZmZlclRvVHlwZShcbiAgICAgIGFkZHJlc3MsXG4gICAgICB0eXBlLFxuICAgICAgdGhpcy5jb3JlLmdldEhSUCgpLFxuICAgICAgY2hhaW5JRFxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYW4gYXNzZXRzIG5hbWUgYW5kIHN5bWJvbC5cbiAgICpcbiAgICogQHBhcmFtIGFzc2V0SUQgRWl0aGVyIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYW4gYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgQXNzZXRJRCBvciBpdHMgYWxpYXMuXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIEFzc2V0IHdpdGgga2V5cyBcIm5hbWVcIiwgXCJzeW1ib2xcIiwgXCJhc3NldElEXCIgYW5kIFwiZGVub21pbmF0aW9uXCIuXG4gICAqL1xuICBnZXRBc3NldERlc2NyaXB0aW9uID0gYXN5bmMgKGFzc2V0SUQ6IEJ1ZmZlciB8IHN0cmluZyk6IFByb21pc2U8YW55PiA9PiB7XG4gICAgbGV0IGFzc2V0OiBzdHJpbmdcbiAgICBpZiAodHlwZW9mIGFzc2V0SUQgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGFzc2V0ID0gYmludG9vbHMuY2I1OEVuY29kZShhc3NldElEKVxuICAgIH0gZWxzZSB7XG4gICAgICBhc3NldCA9IGFzc2V0SURcbiAgICB9XG5cbiAgICBjb25zdCBwYXJhbXM6IEdldEFzc2V0RGVzY3JpcHRpb25QYXJhbXMgPSB7XG4gICAgICBhc3NldElEOiBhc3NldFxuICAgIH1cblxuICAgIGNvbnN0IHRtcEJhc2VVUkw6IHN0cmluZyA9IHRoaXMuZ2V0QmFzZVVSTCgpXG5cbiAgICAvLyBzZXQgYmFzZSB1cmwgdG8gZ2V0IGFzc2V0IGRlc2NyaXB0aW9uXG4gICAgdGhpcy5zZXRCYXNlVVJMKFwiL2V4dC9iYy9YXCIpXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF2bS5nZXRBc3NldERlc2NyaXB0aW9uXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG5cbiAgICAvLyBzZXQgYmFzZSB1cmwgYmFjayB3aGF0IGl0IG9yaWdpbmFsbHkgd2FzXG4gICAgdGhpcy5zZXRCYXNlVVJMKHRtcEJhc2VVUkwpXG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IHJlc3BvbnNlLmRhdGEucmVzdWx0Lm5hbWUsXG4gICAgICBzeW1ib2w6IHJlc3BvbnNlLmRhdGEucmVzdWx0LnN5bWJvbCxcbiAgICAgIGFzc2V0SUQ6IGJpbnRvb2xzLmNiNThEZWNvZGUocmVzcG9uc2UuZGF0YS5yZXN1bHQuYXNzZXRJRCksXG4gICAgICBkZW5vbWluYXRpb246IHBhcnNlSW50KHJlc3BvbnNlLmRhdGEucmVzdWx0LmRlbm9taW5hdGlvbiwgMTApXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIEFYQyBBc3NldElEIGFuZCByZXR1cm5zIGl0IGluIGEgUHJvbWlzZS5cbiAgICpcbiAgICogQHBhcmFtIHJlZnJlc2ggVGhpcyBmdW5jdGlvbiBjYWNoZXMgdGhlIHJlc3BvbnNlLiBSZWZyZXNoID0gdHJ1ZSB3aWxsIGJ1c3QgdGhlIGNhY2hlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdGhlIHByb3ZpZGVkIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIEFYQyBBc3NldElEXG4gICAqL1xuICBnZXRBWENBc3NldElEID0gYXN5bmMgKHJlZnJlc2g6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8QnVmZmVyPiA9PiB7XG4gICAgaWYgKHR5cGVvZiB0aGlzLkFYQ0Fzc2V0SUQgPT09IFwidW5kZWZpbmVkXCIgfHwgcmVmcmVzaCkge1xuICAgICAgY29uc3QgYXNzZXQ6IEFzc2V0ID0gYXdhaXQgdGhpcy5nZXRBc3NldERlc2NyaXB0aW9uKFByaW1hcnlBc3NldEFsaWFzKVxuICAgICAgdGhpcy5BWENBc3NldElEID0gYXNzZXQuYXNzZXRJRFxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5BWENBc3NldElEXG4gIH1cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSBkZWZhdWx0cyBhbmQgc2V0cyB0aGUgY2FjaGUgdG8gYSBzcGVjaWZpYyBBWEMgQXNzZXRJRFxuICAgKlxuICAgKiBAcGFyYW0gYXhjQXNzZXRJRCBBIGNiNTggc3RyaW5nIG9yIEJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIEFYQyBBc3NldElEXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0aGUgcHJvdmlkZWQgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgQVhDIEFzc2V0SURcbiAgICovXG4gIHNldEFYQ0Fzc2V0SUQgPSAoYXhjQXNzZXRJRDogc3RyaW5nIHwgQnVmZmVyKSA9PiB7XG4gICAgaWYgKHR5cGVvZiBheGNBc3NldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBheGNBc3NldElEID0gYmludG9vbHMuY2I1OERlY29kZShheGNBc3NldElEKVxuICAgIH1cbiAgICB0aGlzLkFYQ0Fzc2V0SUQgPSBheGNBc3NldElEXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGVmYXVsdCB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBkZWZhdWx0IHR4IGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXREZWZhdWx0VHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIHJldHVybiB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCkgaW4gRGVmYXVsdHMubmV0d29ya1xuICAgICAgPyBuZXcgQk4oRGVmYXVsdHMubmV0d29ya1t0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCldW1wiQ1wiXVtcInR4RmVlXCJdKVxuICAgICAgOiBuZXcgQk4oMClcbiAgfVxuXG4gIC8qKlxuICAgKiByZXR1cm5zIHRoZSBhbW91bnQgb2YgW2Fzc2V0SURdIGZvciB0aGUgZ2l2ZW4gYWRkcmVzcyBpbiB0aGUgc3RhdGUgb2YgdGhlIGdpdmVuIGJsb2NrIG51bWJlci5cbiAgICogXCJsYXRlc3RcIiwgXCJwZW5kaW5nXCIsIGFuZCBcImFjY2VwdGVkXCIgbWV0YSBibG9jayBudW1iZXJzIGFyZSBhbHNvIGFsbG93ZWQuXG4gICAqXG4gICAqIEBwYXJhbSBoZXhBZGRyZXNzIFRoZSBoZXggcmVwcmVzZW50YXRpb24gb2YgdGhlIGFkZHJlc3NcbiAgICogQHBhcmFtIGJsb2NrSGVpZ2h0IFRoZSBibG9jayBoZWlnaHRcbiAgICogQHBhcmFtIGFzc2V0SUQgVGhlIGFzc2V0IElEXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIG9iamVjdCBjb250YWluaW5nIHRoZSBiYWxhbmNlXG4gICAqL1xuICBnZXRBc3NldEJhbGFuY2UgPSBhc3luYyAoXG4gICAgaGV4QWRkcmVzczogc3RyaW5nLFxuICAgIGJsb2NrSGVpZ2h0OiBzdHJpbmcsXG4gICAgYXNzZXRJRDogc3RyaW5nXG4gICk6IFByb21pc2U8b2JqZWN0PiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBzdHJpbmdbXSA9IFtoZXhBZGRyZXNzLCBibG9ja0hlaWdodCwgYXNzZXRJRF1cblxuICAgIGNvbnN0IG1ldGhvZDogc3RyaW5nID0gXCJldGhfZ2V0QXNzZXRCYWxhbmNlXCJcbiAgICBjb25zdCBwYXRoOiBzdHJpbmcgPSBcImV4dC9iYy9DL3JwY1wiXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBtZXRob2QsXG4gICAgICBwYXJhbXMsXG4gICAgICBwYXRoXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgc3RhdHVzIG9mIGEgcHJvdmlkZWQgYXRvbWljIHRyYW5zYWN0aW9uIElEIGJ5IGNhbGxpbmcgdGhlIG5vZGUncyBgZ2V0QXRvbWljVHhTdGF0dXNgIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIHR4SUQgVGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJhbnNhY3Rpb24gSURcbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIGNvbnRhaW5pbmcgdGhlIHN0YXR1cyByZXRyaWV2ZWQgZnJvbSB0aGUgbm9kZVxuICAgKi9cbiAgZ2V0QXRvbWljVHhTdGF0dXMgPSBhc3luYyAodHhJRDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldEF0b21pY1R4U3RhdHVzUGFyYW1zID0ge1xuICAgICAgdHhJRFxuICAgIH1cblxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJheGMuZ2V0QXRvbWljVHhTdGF0dXNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3RhdHVzXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnN0YXR1c1xuICAgICAgOiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHRyYW5zYWN0aW9uIGRhdGEgb2YgYSBwcm92aWRlZCB0cmFuc2FjdGlvbiBJRCBieSBjYWxsaW5nIHRoZSBub2RlJ3MgYGdldEF0b21pY1R4YCBtZXRob2QuXG4gICAqXG4gICAqIEBwYXJhbSB0eElEIFRoZSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHRyYW5zYWN0aW9uIElEXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIHN0cmluZyBjb250YWluaW5nIHRoZSBieXRlcyByZXRyaWV2ZWQgZnJvbSB0aGUgbm9kZVxuICAgKi9cbiAgZ2V0QXRvbWljVHggPSBhc3luYyAodHhJRDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldEF0b21pY1R4UGFyYW1zID0ge1xuICAgICAgdHhJRFxuICAgIH1cblxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJheGMuZ2V0QXRvbWljVHhcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0eCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0VHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy50eEZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy50eEZlZSA9IHRoaXMuZ2V0RGVmYXVsdFR4RmVlKClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMudHhGZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIEFOVCAoQXhpYSBOYXRpdmUgVG9rZW4pIGFzc2V0cyBpbmNsdWRpbmcgQVhDIGZyb20gdGhlIEMtQ2hhaW4gdG8gYW4gYWNjb3VudCBvbiB0aGUgWC1DaGFpbi5cbiAgICpcbiAgICogQWZ0ZXIgY2FsbGluZyB0aGlzIG1ldGhvZCwgeW91IG11c3QgY2FsbCB0aGUgWC1DaGFpbuKAmXMgaW1wb3J0IG1ldGhvZCB0byBjb21wbGV0ZSB0aGUgdHJhbnNmZXIuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBYLUNoYWluIGFjY291bnQgc3BlY2lmaWVkIGluIGB0b2BcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gdG8gVGhlIGFjY291bnQgb24gdGhlIFgtQ2hhaW4gdG8gc2VuZCB0aGUgQVhDIHRvLlxuICAgKiBAcGFyYW0gYW1vdW50IEFtb3VudCBvZiBhc3NldCB0byBleHBvcnQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgYXNzZXQgaWQgd2hpY2ggaXMgYmVpbmcgc2VudFxuICAgKlxuICAgKiBAcmV0dXJucyBTdHJpbmcgcmVwcmVzZW50aW5nIHRoZSB0cmFuc2FjdGlvbiBpZFxuICAgKi9cbiAgZXhwb3J0ID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICB0bzogc3RyaW5nLFxuICAgIGFtb3VudDogQk4sXG4gICAgYXNzZXRJRDogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBFeHBvcnRQYXJhbXMgPSB7XG4gICAgICB0byxcbiAgICAgIGFtb3VudDogYW1vdW50LnRvU3RyaW5nKDEwKSxcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBhc3NldElEXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJheGMuZXhwb3J0XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICAgICAgOiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgQVhDIGZyb20gdGhlIEMtQ2hhaW4gdG8gYW4gYWNjb3VudCBvbiB0aGUgWC1DaGFpbi5cbiAgICpcbiAgICogQWZ0ZXIgY2FsbGluZyB0aGlzIG1ldGhvZCwgeW91IG11c3QgY2FsbCB0aGUgWC1DaGFpbuKAmXMgaW1wb3J0QVhDIG1ldGhvZCB0byBjb21wbGV0ZSB0aGUgdHJhbnNmZXIuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBYLUNoYWluIGFjY291bnQgc3BlY2lmaWVkIGluIGB0b2BcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gdG8gVGhlIGFjY291bnQgb24gdGhlIFgtQ2hhaW4gdG8gc2VuZCB0aGUgQVhDIHRvLlxuICAgKiBAcGFyYW0gYW1vdW50IEFtb3VudCBvZiBBWEMgdG8gZXhwb3J0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICpcbiAgICogQHJldHVybnMgU3RyaW5nIHJlcHJlc2VudGluZyB0aGUgdHJhbnNhY3Rpb24gaWRcbiAgICovXG4gIGV4cG9ydEFYQyA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgdG86IHN0cmluZyxcbiAgICBhbW91bnQ6IEJOXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBFeHBvcnRBWENQYXJhbXMgPSB7XG4gICAgICB0byxcbiAgICAgIGFtb3VudDogYW1vdW50LnRvU3RyaW5nKDEwKSxcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmRcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF4Yy5leHBvcnRBWENcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBVVFhPcyByZWxhdGVkIHRvIHRoZSBhZGRyZXNzZXMgcHJvdmlkZWQgZnJvbSB0aGUgbm9kZSdzIGBnZXRVVFhPc2AgbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyBjYjU4IHN0cmluZ3Mgb3IgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9c1xuICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gQSBzdHJpbmcgZm9yIHRoZSBjaGFpbiB0byBsb29rIGZvciB0aGUgVVRYTydzLiBEZWZhdWx0IGlzIHRvIHVzZSB0aGlzIGNoYWluLCBidXQgaWYgZXhwb3J0ZWQgVVRYT3MgZXhpc3RcbiAgICogZnJvbSBvdGhlciBjaGFpbnMsIHRoaXMgY2FuIHVzZWQgdG8gcHVsbCB0aGVtIGluc3RlYWQuXG4gICAqIEBwYXJhbSBsaW1pdCBPcHRpb25hbC4gUmV0dXJucyBhdCBtb3N0IFtsaW1pdF0gYWRkcmVzc2VzLiBJZiBbbGltaXRdID09IDAgb3IgPiBbbWF4VVRYT3NUb0ZldGNoXSwgZmV0Y2hlcyB1cCB0byBbbWF4VVRYT3NUb0ZldGNoXS5cbiAgICogQHBhcmFtIHN0YXJ0SW5kZXggT3B0aW9uYWwuIFtTdGFydEluZGV4XSBkZWZpbmVzIHdoZXJlIHRvIHN0YXJ0IGZldGNoaW5nIFVUWE9zIChmb3IgcGFnaW5hdGlvbi4pXG4gICAqIFVUWE9zIGZldGNoZWQgYXJlIGZyb20gYWRkcmVzc2VzIGVxdWFsIHRvIG9yIGdyZWF0ZXIgdGhhbiBbU3RhcnRJbmRleC5BZGRyZXNzXVxuICAgKiBGb3IgYWRkcmVzcyBbU3RhcnRJbmRleC5BZGRyZXNzXSwgb25seSBVVFhPcyB3aXRoIElEcyBncmVhdGVyIHRoYW4gW1N0YXJ0SW5kZXguVXR4b10gd2lsbCBiZSByZXR1cm5lZC5cbiAgICovXG4gIGdldFVUWE9zID0gYXN5bmMgKFxuICAgIGFkZHJlc3Nlczogc3RyaW5nW10gfCBzdHJpbmcsXG4gICAgc291cmNlQ2hhaW46IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBsaW1pdDogbnVtYmVyID0gMCxcbiAgICBzdGFydEluZGV4OiBJbmRleCA9IHVuZGVmaW5lZFxuICApOiBQcm9taXNlPHtcbiAgICBudW1GZXRjaGVkOiBudW1iZXJcbiAgICB1dHhvc1xuICAgIGVuZEluZGV4OiBJbmRleFxuICB9PiA9PiB7XG4gICAgaWYgKHR5cGVvZiBhZGRyZXNzZXMgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGFkZHJlc3NlcyA9IFthZGRyZXNzZXNdXG4gICAgfVxuXG4gICAgY29uc3QgcGFyYW1zOiBHZXRVVFhPc1BhcmFtcyA9IHtcbiAgICAgIGFkZHJlc3NlczogYWRkcmVzc2VzLFxuICAgICAgbGltaXRcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBzdGFydEluZGV4ICE9PSBcInVuZGVmaW5lZFwiICYmIHN0YXJ0SW5kZXgpIHtcbiAgICAgIHBhcmFtcy5zdGFydEluZGV4ID0gc3RhcnRJbmRleFxuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygc291cmNlQ2hhaW4gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtcy5zb3VyY2VDaGFpbiA9IHNvdXJjZUNoYWluXG4gICAgfVxuXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF4Yy5nZXRVVFhPc1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIGNvbnN0IHV0eG9zOiBVVFhPU2V0ID0gbmV3IFVUWE9TZXQoKVxuICAgIGNvbnN0IGRhdGE6IGFueSA9IHJlc3BvbnNlLmRhdGEucmVzdWx0LnV0eG9zXG4gICAgdXR4b3MuYWRkQXJyYXkoZGF0YSwgZmFsc2UpXG4gICAgcmVzcG9uc2UuZGF0YS5yZXN1bHQudXR4b3MgPSB1dHhvc1xuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgQU5UIChBeGlhIE5hdGl2ZSBUb2tlbikgYXNzZXRzIGluY2x1ZGluZyBBWEMgZnJvbSBhbiBhY2NvdW50IG9uIHRoZSBYLUNoYWluIHRvIGFuIGFkZHJlc3Mgb24gdGhlIEMtQ2hhaW4uIFRoaXMgdHJhbnNhY3Rpb25cbiAgICogbXVzdCBiZSBzaWduZWQgd2l0aCB0aGUga2V5IG9mIHRoZSBhY2NvdW50IHRoYXQgdGhlIGFzc2V0IGlzIHNlbnQgZnJvbSBhbmQgd2hpY2ggcGF5c1xuICAgKiB0aGUgdHJhbnNhY3Rpb24gZmVlLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgYWNjb3VudCBzcGVjaWZpZWQgaW4gYHRvYFxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSB0byBUaGUgYWRkcmVzcyBvZiB0aGUgYWNjb3VudCB0aGUgYXNzZXQgaXMgc2VudCB0by5cbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIFRoZSBjaGFpbklEIHdoZXJlIHRoZSBmdW5kcyBhcmUgY29taW5nIGZyb20uIEV4OiBcIlhcIlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIHN0cmluZyBmb3IgdGhlIHRyYW5zYWN0aW9uLCB3aGljaCBzaG91bGQgYmUgc2VudCB0byB0aGUgbmV0d29ya1xuICAgKiBieSBjYWxsaW5nIGlzc3VlVHguXG4gICAqL1xuICBpbXBvcnQgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIHRvOiBzdHJpbmcsXG4gICAgc291cmNlQ2hhaW46IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogSW1wb3J0UGFyYW1zID0ge1xuICAgICAgdG8sXG4gICAgICBzb3VyY2VDaGFpbixcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmRcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF4Yy5pbXBvcnRcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBBWEMgZnJvbSBhbiBhY2NvdW50IG9uIHRoZSBYLUNoYWluIHRvIGFuIGFkZHJlc3Mgb24gdGhlIEMtQ2hhaW4uIFRoaXMgdHJhbnNhY3Rpb25cbiAgICogbXVzdCBiZSBzaWduZWQgd2l0aCB0aGUga2V5IG9mIHRoZSBhY2NvdW50IHRoYXQgdGhlIEFYQyBpcyBzZW50IGZyb20gYW5kIHdoaWNoIHBheXNcbiAgICogdGhlIHRyYW5zYWN0aW9uIGZlZS5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIGFjY291bnQgc3BlY2lmaWVkIGluIGB0b2BcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gdG8gVGhlIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgdGhlIEFYQyBpcyBzZW50IHRvLiBUaGlzIG11c3QgYmUgdGhlIHNhbWUgYXMgdGhlIHRvXG4gICAqIGFyZ3VtZW50IGluIHRoZSBjb3JyZXNwb25kaW5nIGNhbGwgdG8gdGhlIFgtQ2hhaW7igJlzIGV4cG9ydEFYQ1xuICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gVGhlIGNoYWluSUQgd2hlcmUgdGhlIGZ1bmRzIGFyZSBjb21pbmcgZnJvbS5cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBzdHJpbmcgZm9yIHRoZSB0cmFuc2FjdGlvbiwgd2hpY2ggc2hvdWxkIGJlIHNlbnQgdG8gdGhlIG5ldHdvcmtcbiAgICogYnkgY2FsbGluZyBpc3N1ZVR4LlxuICAgKi9cbiAgaW1wb3J0QVhDID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICB0bzogc3RyaW5nLFxuICAgIHNvdXJjZUNoYWluOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEltcG9ydEFYQ1BhcmFtcyA9IHtcbiAgICAgIHRvLFxuICAgICAgc291cmNlQ2hhaW4sXG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJheGMuaW1wb3J0QVhDXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICAgICAgOiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIEdpdmUgYSB1c2VyIGNvbnRyb2wgb3ZlciBhbiBhZGRyZXNzIGJ5IHByb3ZpZGluZyB0aGUgcHJpdmF0ZSBrZXkgdGhhdCBjb250cm9scyB0aGUgYWRkcmVzcy5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBuYW1lIG9mIHRoZSB1c2VyIHRvIHN0b3JlIHRoZSBwcml2YXRlIGtleVxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIHRoYXQgdW5sb2NrcyB0aGUgdXNlclxuICAgKiBAcGFyYW0gcHJpdmF0ZUtleSBBIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHByaXZhdGUga2V5IGluIHRoZSB2bVwicyBmb3JtYXRcbiAgICpcbiAgICogQHJldHVybnMgVGhlIGFkZHJlc3MgZm9yIHRoZSBpbXBvcnRlZCBwcml2YXRlIGtleS5cbiAgICovXG4gIGltcG9ydEtleSA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgcHJpdmF0ZUtleTogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBJbXBvcnRLZXlQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgcHJpdmF0ZUtleVxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXhjLmltcG9ydEtleVwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5hZGRyZXNzXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LmFkZHJlc3NcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyB0aGUgbm9kZSdzIGlzc3VlVHggbWV0aG9kIGZyb20gdGhlIEFQSSBhbmQgcmV0dXJucyB0aGUgcmVzdWx0aW5nIHRyYW5zYWN0aW9uIElEIGFzIGEgc3RyaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gdHggQSBzdHJpbmcsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9LCBvciBbW1R4XV0gcmVwcmVzZW50aW5nIGEgdHJhbnNhY3Rpb25cbiAgICpcbiAgICogQHJldHVybnMgQSBQcm9taXNlIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHRyYW5zYWN0aW9uIElEIG9mIHRoZSBwb3N0ZWQgdHJhbnNhY3Rpb24uXG4gICAqL1xuICBpc3N1ZVR4ID0gYXN5bmMgKHR4OiBzdHJpbmcgfCBCdWZmZXIgfCBUeCk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgbGV0IFRyYW5zYWN0aW9uOiBzdHJpbmcgPSBcIlwiXG4gICAgaWYgKHR5cGVvZiB0eCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgVHJhbnNhY3Rpb24gPSB0eFxuICAgIH0gZWxzZSBpZiAodHggaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgIGNvbnN0IHR4b2JqOiBUeCA9IG5ldyBUeCgpXG4gICAgICB0eG9iai5mcm9tQnVmZmVyKHR4KVxuICAgICAgVHJhbnNhY3Rpb24gPSB0eG9iai50b1N0cmluZygpXG4gICAgfSBlbHNlIGlmICh0eCBpbnN0YW5jZW9mIFR4KSB7XG4gICAgICBUcmFuc2FjdGlvbiA9IHR4LnRvU3RyaW5nKClcbiAgICB9IGVsc2Uge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBUcmFuc2FjdGlvbkVycm9yKFxuICAgICAgICBcIkVycm9yIC0gYXhjLmlzc3VlVHg6IHByb3ZpZGVkIHR4IGlzIG5vdCBleHBlY3RlZCB0eXBlIG9mIHN0cmluZywgQnVmZmVyLCBvciBUeFwiXG4gICAgICApXG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczogSXNzdWVUeFBhcmFtcyA9IHtcbiAgICAgIHR4OiBUcmFuc2FjdGlvbi50b1N0cmluZygpXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJheGMuaXNzdWVUeFwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHBvcnRzIHRoZSBwcml2YXRlIGtleSBmb3IgYW4gYWRkcmVzcy5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBuYW1lIG9mIHRoZSB1c2VyIHdpdGggdGhlIHByaXZhdGUga2V5XG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgdXNlZCB0byBkZWNyeXB0IHRoZSBwcml2YXRlIGtleVxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUgYWRkcmVzcyB3aG9zZSBwcml2YXRlIGtleSBzaG91bGQgYmUgZXhwb3J0ZWRcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSB3aXRoIHRoZSBkZWNyeXB0ZWQgcHJpdmF0ZSBrZXkgYW5kIHByaXZhdGUga2V5IGhleCBhcyBzdG9yZSBpbiB0aGUgZGF0YWJhc2VcbiAgICovXG4gIGV4cG9ydEtleSA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgYWRkcmVzczogc3RyaW5nXG4gICk6IFByb21pc2U8b2JqZWN0PiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBFeHBvcnRLZXlQYXJhbXMgPSB7XG4gICAgICB1c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgYWRkcmVzc1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwiYXhjLmV4cG9ydEtleVwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIEltcG9ydCBUeC4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcykuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSB0b0FkZHJlc3MgVGhlIGFkZHJlc3MgdG8gc2VuZCB0aGUgZnVuZHNcbiAgICogQHBhcmFtIG93bmVyQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBpbXBvcnRcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIFRoZSBjaGFpbmlkIGZvciB3aGVyZSB0aGUgaW1wb3J0IGlzIGNvbWluZyBmcm9tXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyBwcm92aWRlZFxuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiAoW1tVbnNpZ25lZFR4XV0pIHdoaWNoIGNvbnRhaW5zIGEgW1tJbXBvcnRUeF1dLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBUaGlzIGhlbHBlciBleGlzdHMgYmVjYXVzZSB0aGUgZW5kcG9pbnQgQVBJIHNob3VsZCBiZSB0aGUgcHJpbWFyeSBwb2ludCBvZiBlbnRyeSBmb3IgbW9zdCBmdW5jdGlvbmFsaXR5LlxuICAgKi9cbiAgYnVpbGRJbXBvcnRUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIHRvQWRkcmVzczogc3RyaW5nLFxuICAgIG93bmVyQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBzb3VyY2VDaGFpbjogQnVmZmVyIHwgc3RyaW5nLFxuICAgIGZyb21BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGZlZTogQk4gPSBuZXcgQk4oMClcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgZnJvbTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcbiAgICAgIGZyb21BZGRyZXNzZXMsXG4gICAgICBcImJ1aWxkSW1wb3J0VHhcIlxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuICAgIGxldCBzcmNDaGFpbjogc3RyaW5nID0gdW5kZWZpbmVkXG5cbiAgICBpZiAodHlwZW9mIHNvdXJjZUNoYWluID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAvLyBpZiB0aGVyZSBpcyBhIHNvdXJjZUNoYWluIHBhc3NlZCBpbiBhbmQgaXQncyBhIHN0cmluZyB0aGVuIHNhdmUgdGhlIHN0cmluZyB2YWx1ZSBhbmQgY2FzdCB0aGUgb3JpZ2luYWxcbiAgICAgIC8vIHZhcmlhYmxlIGZyb20gYSBzdHJpbmcgdG8gYSBCdWZmZXJcbiAgICAgIHNyY0NoYWluID0gc291cmNlQ2hhaW5cbiAgICAgIHNvdXJjZUNoYWluID0gYmludG9vbHMuY2I1OERlY29kZShzb3VyY2VDaGFpbilcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgdHlwZW9mIHNvdXJjZUNoYWluID09PSBcInVuZGVmaW5lZFwiIHx8XG4gICAgICAhKHNvdXJjZUNoYWluIGluc3RhbmNlb2YgQnVmZmVyKVxuICAgICkge1xuICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gc291cmNlQ2hhaW4gcGFzc2VkIGluIG9yIHRoZSBzb3VyY2VDaGFpbiBpcyBhbnkgZGF0YSB0eXBlIG90aGVyIHRoYW4gYSBCdWZmZXIgdGhlbiB0aHJvdyBhbiBlcnJvclxuICAgICAgdGhyb3cgbmV3IENoYWluSWRFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEVWTUFQSS5idWlsZEltcG9ydFR4OiBzb3VyY2VDaGFpbiBpcyB1bmRlZmluZWQgb3IgaW52YWxpZCBzb3VyY2VDaGFpbiB0eXBlLlwiXG4gICAgICApXG4gICAgfVxuICAgIGNvbnN0IHV0eG9SZXNwb25zZTogVVRYT1Jlc3BvbnNlID0gYXdhaXQgdGhpcy5nZXRVVFhPcyhcbiAgICAgIG93bmVyQWRkcmVzc2VzLFxuICAgICAgc3JjQ2hhaW4sXG4gICAgICAwLFxuICAgICAgdW5kZWZpbmVkXG4gICAgKVxuICAgIGNvbnN0IGF0b21pY1VUWE9zOiBVVFhPU2V0ID0gdXR4b1Jlc3BvbnNlLnV0eG9zXG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBjb25zdCBheGNBc3NldElEOiBzdHJpbmcgPSBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldHdvcmtJRH1gXS5YLmF4Y0Fzc2V0SURcbiAgICBjb25zdCBheGNBc3NldElEQnVmOiBCdWZmZXIgPSBiaW50b29scy5jYjU4RGVjb2RlKGF4Y0Fzc2V0SUQpXG4gICAgY29uc3QgYXRvbWljczogVVRYT1tdID0gYXRvbWljVVRYT3MuZ2V0QWxsVVRYT3MoKVxuXG4gICAgaWYgKGF0b21pY3MubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgTm9BdG9taWNVVFhPc0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gRVZNQVBJLmJ1aWxkSW1wb3J0VHg6IG5vIGF0b21pYyB1dHhvcyB0byBpbXBvcnRcIlxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRJbXBvcnRUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpLFxuICAgICAgdG9BZGRyZXNzLFxuICAgICAgYXRvbWljcyxcbiAgICAgIHNvdXJjZUNoYWluLFxuICAgICAgZmVlLFxuICAgICAgYXhjQXNzZXRJREJ1ZlxuICAgIClcblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gd2hpY2ggY3JlYXRlcyBhbiB1bnNpZ25lZCBFeHBvcnQgVHguIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgYmVpbmcgZXhwb3J0ZWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gYXNzZXRJRCBUaGUgYXNzZXQgaWQgd2hpY2ggaXMgYmVpbmcgc2VudFxuICAgKiBAcGFyYW0gZGVzdGluYXRpb25DaGFpbiBUaGUgY2hhaW5pZCBmb3Igd2hlcmUgdGhlIGFzc2V0cyB3aWxsIGJlIHNlbnQuXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyBwcm92aWRlZFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhbiBbW0V4cG9ydFR4XV0uXG4gICAqL1xuICBidWlsZEV4cG9ydFR4ID0gYXN5bmMgKFxuICAgIGFtb3VudDogQk4sXG4gICAgYXNzZXRJRDogQnVmZmVyIHwgc3RyaW5nLFxuICAgIGRlc3RpbmF0aW9uQ2hhaW46IEJ1ZmZlciB8IHN0cmluZyxcbiAgICBmcm9tQWRkcmVzc0hleDogc3RyaW5nLFxuICAgIGZyb21BZGRyZXNzQmVjaDogc3RyaW5nLFxuICAgIHRvQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBub25jZTogbnVtYmVyID0gMCxcbiAgICBsb2NrdGltZTogQk4gPSBuZXcgQk4oMCksXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSAxLFxuICAgIGZlZTogQk4gPSBuZXcgQk4oMClcbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgcHJlZml4ZXM6IG9iamVjdCA9IHt9XG4gICAgdG9BZGRyZXNzZXMubWFwKChhZGRyZXNzOiBzdHJpbmcpID0+IHtcbiAgICAgIHByZWZpeGVzW2FkZHJlc3Muc3BsaXQoXCItXCIpWzBdXSA9IHRydWVcbiAgICB9KVxuICAgIGlmIChPYmplY3Qua2V5cyhwcmVmaXhlcykubGVuZ3RoICE9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gRVZNQVBJLmJ1aWxkRXhwb3J0VHg6IFRvIGFkZHJlc3NlcyBtdXN0IGhhdmUgdGhlIHNhbWUgY2hhaW5JRCBwcmVmaXguXCJcbiAgICAgIClcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGRlc3RpbmF0aW9uQ2hhaW4gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBFVk1BUEkuYnVpbGRFeHBvcnRUeDogRGVzdGluYXRpb24gQ2hhaW5JRCBpcyB1bmRlZmluZWQuXCJcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBkZXN0aW5hdGlvbkNoYWluID0gYmludG9vbHMuY2I1OERlY29kZShkZXN0aW5hdGlvbkNoYWluKVxuICAgIH0gZWxzZSBpZiAoIShkZXN0aW5hdGlvbkNoYWluIGluc3RhbmNlb2YgQnVmZmVyKSkge1xuICAgICAgdGhyb3cgbmV3IENoYWluSWRFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIEVWTUFQSS5idWlsZEV4cG9ydFR4OiBJbnZhbGlkIGRlc3RpbmF0aW9uQ2hhaW4gdHlwZVwiXG4gICAgICApXG4gICAgfVxuICAgIGlmIChkZXN0aW5hdGlvbkNoYWluLmxlbmd0aCAhPT0gMzIpIHtcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBFVk1BUEkuYnVpbGRFeHBvcnRUeDogRGVzdGluYXRpb24gQ2hhaW5JRCBtdXN0IGJlIDMyIGJ5dGVzIGluIGxlbmd0aC5cIlxuICAgICAgKVxuICAgIH1cbiAgICBjb25zdCBhc3NldERlc2NyaXB0aW9uOiBhbnkgPSBhd2FpdCB0aGlzLmdldEFzc2V0RGVzY3JpcHRpb24oXCJBWENcIilcbiAgICBsZXQgZXZtSW5wdXRzOiBFVk1JbnB1dFtdID0gW11cbiAgICBpZiAoYmludG9vbHMuY2I1OEVuY29kZShhc3NldERlc2NyaXB0aW9uLmFzc2V0SUQpID09PSBhc3NldElEKSB7XG4gICAgICBjb25zdCBldm1JbnB1dDogRVZNSW5wdXQgPSBuZXcgRVZNSW5wdXQoXG4gICAgICAgIGZyb21BZGRyZXNzSGV4LFxuICAgICAgICBhbW91bnQuYWRkKGZlZSksXG4gICAgICAgIGFzc2V0SUQsXG4gICAgICAgIG5vbmNlXG4gICAgICApXG4gICAgICBldm1JbnB1dC5hZGRTaWduYXR1cmVJZHgoMCwgYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGZyb21BZGRyZXNzQmVjaCkpXG4gICAgICBldm1JbnB1dHMucHVzaChldm1JbnB1dClcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaWYgYXNzZXQgaWQgaXNuJ3QgQVhDIGFzc2V0IGlkIHRoZW4gY3JlYXRlIDIgaW5wdXRzXG4gICAgICAvLyBmaXJzdCBpbnB1dCB3aWxsIGJlIEFYQyBhbmQgd2lsbCBiZSBmb3IgdGhlIGFtb3VudCBvZiB0aGUgZmVlXG4gICAgICAvLyBzZWNvbmQgaW5wdXQgd2lsbCBiZSB0aGUgQU5UXG4gICAgICBjb25zdCBldm1BWENJbnB1dDogRVZNSW5wdXQgPSBuZXcgRVZNSW5wdXQoXG4gICAgICAgIGZyb21BZGRyZXNzSGV4LFxuICAgICAgICBmZWUsXG4gICAgICAgIGFzc2V0RGVzY3JpcHRpb24uYXNzZXRJRCxcbiAgICAgICAgbm9uY2VcbiAgICAgIClcbiAgICAgIGV2bUFYQ0lucHV0LmFkZFNpZ25hdHVyZUlkeCgwLCBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoZnJvbUFkZHJlc3NCZWNoKSlcbiAgICAgIGV2bUlucHV0cy5wdXNoKGV2bUFYQ0lucHV0KVxuXG4gICAgICBjb25zdCBldm1BTlRJbnB1dDogRVZNSW5wdXQgPSBuZXcgRVZNSW5wdXQoXG4gICAgICAgIGZyb21BZGRyZXNzSGV4LFxuICAgICAgICBhbW91bnQsXG4gICAgICAgIGFzc2V0SUQsXG4gICAgICAgIG5vbmNlXG4gICAgICApXG4gICAgICBldm1BTlRJbnB1dC5hZGRTaWduYXR1cmVJZHgoMCwgYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGZyb21BZGRyZXNzQmVjaCkpXG4gICAgICBldm1JbnB1dHMucHVzaChldm1BTlRJbnB1dClcbiAgICB9XG5cbiAgICBjb25zdCB0bzogQnVmZmVyW10gPSBbXVxuICAgIHRvQWRkcmVzc2VzLm1hcCgoYWRkcmVzczogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgICB0by5wdXNoKGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhZGRyZXNzKSlcbiAgICB9KVxuXG4gICAgbGV0IGV4cG9ydGVkT3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxuICAgIGNvbnN0IHNlY3BUcmFuc2Zlck91dHB1dDogU0VDUFRyYW5zZmVyT3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChcbiAgICAgIGFtb3VudCxcbiAgICAgIHRvLFxuICAgICAgbG9ja3RpbWUsXG4gICAgICB0aHJlc2hvbGRcbiAgICApXG4gICAgY29uc3QgdHJhbnNmZXJhYmxlT3V0cHV0OiBUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZShhc3NldElEKSxcbiAgICAgIHNlY3BUcmFuc2Zlck91dHB1dFxuICAgIClcbiAgICBleHBvcnRlZE91dHMucHVzaCh0cmFuc2ZlcmFibGVPdXRwdXQpXG5cbiAgICAvLyBsZXhpY29ncmFwaGljYWxseSBzb3J0IGlucyBhbmQgb3V0c1xuICAgIGV2bUlucHV0cyA9IGV2bUlucHV0cy5zb3J0KEVWTUlucHV0LmNvbXBhcmF0b3IoKSlcbiAgICBleHBvcnRlZE91dHMgPSBleHBvcnRlZE91dHMuc29ydChUcmFuc2ZlcmFibGVPdXRwdXQuY29tcGFyYXRvcigpKVxuXG4gICAgY29uc3QgZXhwb3J0VHg6IEV4cG9ydFR4ID0gbmV3IEV4cG9ydFR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICBkZXN0aW5hdGlvbkNoYWluLFxuICAgICAgZXZtSW5wdXRzLFxuICAgICAgZXhwb3J0ZWRPdXRzXG4gICAgKVxuXG4gICAgY29uc3QgdW5zaWduZWRUeDogVW5zaWduZWRUeCA9IG5ldyBVbnNpZ25lZFR4KGV4cG9ydFR4KVxuICAgIHJldHVybiB1bnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIHJlZmVyZW5jZSB0byB0aGUga2V5Y2hhaW4gZm9yIHRoaXMgY2xhc3MuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBpbnN0YW5jZSBvZiBbW0tleUNoYWluXV0gZm9yIHRoaXMgY2xhc3NcbiAgICovXG4gIGtleUNoYWluID0gKCk6IEtleUNoYWluID0+IHRoaXMua2V5Y2hhaW5cblxuICAvKipcbiAgICpcbiAgICogQHJldHVybnMgbmV3IGluc3RhbmNlIG9mIFtbS2V5Q2hhaW5dXVxuICAgKi9cbiAgbmV3S2V5Q2hhaW4gPSAoKTogS2V5Q2hhaW4gPT4ge1xuICAgIC8vIHdhcm5pbmcsIG92ZXJ3cml0ZXMgdGhlIG9sZCBrZXljaGFpblxuICAgIGNvbnN0IGFsaWFzID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxuICAgIGlmIChhbGlhcykge1xuICAgICAgdGhpcy5rZXljaGFpbiA9IG5ldyBLZXlDaGFpbih0aGlzLmNvcmUuZ2V0SFJQKCksIGFsaWFzKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgdGhpcy5ibG9ja2NoYWluSUQpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmtleWNoYWluXG4gIH1cblxuICAvKipcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgcHJvdGVjdGVkIF9jbGVhbkFkZHJlc3NBcnJheShcbiAgICBhZGRyZXNzZXM6IHN0cmluZ1tdIHwgQnVmZmVyW10sXG4gICAgY2FsbGVyOiBzdHJpbmdcbiAgKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IGFkZHJzOiBzdHJpbmdbXSA9IFtdXG4gICAgY29uc3QgY2hhaW5pZDogc3RyaW5nID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxuICAgICAgPyB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXG4gICAgICA6IHRoaXMuZ2V0QmxvY2tjaGFpbklEKClcbiAgICBpZiAoYWRkcmVzc2VzICYmIGFkZHJlc3Nlcy5sZW5ndGggPiAwKSB7XG4gICAgICBhZGRyZXNzZXMuZm9yRWFjaCgoYWRkcmVzczogc3RyaW5nIHwgQnVmZmVyKSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgYWRkcmVzcyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5wYXJzZUFkZHJlc3MoYWRkcmVzcyBhcyBzdHJpbmcpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcIkVycm9yIC0gSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiKVxuICAgICAgICAgIH1cbiAgICAgICAgICBhZGRycy5wdXNoKGFkZHJlc3MgYXMgc3RyaW5nKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHR5cGU6IFNlcmlhbGl6ZWRUeXBlID0gXCJiZWNoMzJcIlxuICAgICAgICAgIGFkZHJzLnB1c2goXG4gICAgICAgICAgICBzZXJpYWxpemF0aW9uLmJ1ZmZlclRvVHlwZShcbiAgICAgICAgICAgICAgYWRkcmVzcyBhcyBCdWZmZXIsXG4gICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICAgIHRoaXMuY29yZS5nZXRIUlAoKSxcbiAgICAgICAgICAgICAgY2hhaW5pZFxuICAgICAgICAgICAgKVxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gICAgcmV0dXJuIGFkZHJzXG4gIH1cblxuICAvKipcbiAgICogVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGluc3RhbnRpYXRlZCBkaXJlY3RseS5cbiAgICogSW5zdGVhZCB1c2UgdGhlIFtbQXhpYS5hZGRBUEldXSBtZXRob2QuXG4gICAqXG4gICAqIEBwYXJhbSBjb3JlIEEgcmVmZXJlbmNlIHRvIHRoZSBBeGlhIGNsYXNzXG4gICAqIEBwYXJhbSBiYXNlVVJMIERlZmF1bHRzIHRvIHRoZSBzdHJpbmcgXCIvZXh0L2JjL0MvYXhjXCIgYXMgdGhlIHBhdGggdG8gYmxvY2tjaGFpbidzIGJhc2VVUkxcbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBUaGUgQmxvY2tjaGFpbidzIElELiBEZWZhdWx0cyB0byBhbiBlbXB0eSBzdHJpbmc6IFwiXCJcbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNvcmU6IEF4aWFDb3JlLFxuICAgIGJhc2VVUkw6IHN0cmluZyA9IFwiL2V4dC9iYy9DL2F4Y1wiLFxuICAgIGJsb2NrY2hhaW5JRDogc3RyaW5nID0gXCJcIlxuICApIHtcbiAgICBzdXBlcihjb3JlLCBiYXNlVVJMKVxuICAgIHRoaXMuYmxvY2tjaGFpbklEID0gYmxvY2tjaGFpbklEXG4gICAgY29uc3QgbmV0SUQ6IG51bWJlciA9IGNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBpZiAoXG4gICAgICBuZXRJRCBpbiBEZWZhdWx0cy5uZXR3b3JrICYmXG4gICAgICBibG9ja2NoYWluSUQgaW4gRGVmYXVsdHMubmV0d29ya1tgJHtuZXRJRH1gXVxuICAgICkge1xuICAgICAgY29uc3QgeyBhbGlhcyB9ID0gRGVmYXVsdHMubmV0d29ya1tgJHtuZXRJRH1gXVtgJHtibG9ja2NoYWluSUR9YF1cbiAgICAgIHRoaXMua2V5Y2hhaW4gPSBuZXcgS2V5Q2hhaW4odGhpcy5jb3JlLmdldEhSUCgpLCBhbGlhcylcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5rZXljaGFpbiA9IG5ldyBLZXlDaGFpbih0aGlzLmNvcmUuZ2V0SFJQKCksIGJsb2NrY2hhaW5JRClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgYSBQcm9taXNlIHN0cmluZyBjb250YWluaW5nIHRoZSBiYXNlIGZlZSBmb3IgdGhlIG5leHQgYmxvY2suXG4gICAqL1xuICBnZXRCYXNlRmVlID0gYXN5bmMgKCk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBzdHJpbmdbXSA9IFtdXG4gICAgY29uc3QgbWV0aG9kOiBzdHJpbmcgPSBcImV0aF9iYXNlRmVlXCJcbiAgICBjb25zdCBwYXRoOiBzdHJpbmcgPSBcImV4dC9iYy9DL3JwY1wiXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBtZXRob2QsXG4gICAgICBwYXJhbXMsXG4gICAgICBwYXRoXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIHJldHVybnMgdGhlIHByaW9yaXR5IGZlZSBuZWVkZWQgdG8gYmUgaW5jbHVkZWQgaW4gYSBibG9jay5cbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIGNvbnRhaW5pbmcgdGhlIHByaW9yaXR5IGZlZSBuZWVkZWQgdG8gYmUgaW5jbHVkZWQgaW4gYSBibG9jay5cbiAgICovXG4gIGdldE1heFByaW9yaXR5RmVlUGVyR2FzID0gYXN5bmMgKCk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBzdHJpbmdbXSA9IFtdXG5cbiAgICBjb25zdCBtZXRob2Q6IHN0cmluZyA9IFwiZXRoX21heFByaW9yaXR5RmVlUGVyR2FzXCJcbiAgICBjb25zdCBwYXRoOiBzdHJpbmcgPSBcImV4dC9iYy9DL3JwY1wiXG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBtZXRob2QsXG4gICAgICBwYXJhbXMsXG4gICAgICBwYXRoXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG59XG4iXX0=