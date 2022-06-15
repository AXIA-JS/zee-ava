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
exports.PlatformVMAPI = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM
 */
const buffer_1 = require("buffer/");
const bn_js_1 = __importDefault(require("bn.js"));
const jrpcapi_1 = require("../../common/jrpcapi");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const keychain_1 = require("./keychain");
const constants_1 = require("../../utils/constants");
const constants_2 = require("./constants");
const tx_1 = require("./tx");
const payload_1 = require("../../utils/payload");
const helperfunctions_1 = require("../../utils/helperfunctions");
const utxos_1 = require("../platformvm/utxos");
const errors_1 = require("../../utils/errors");
const outputs_1 = require("./outputs");
const utils_1 = require("../../utils");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = utils_1.Serialization.getInstance();
/**
 * Class for interacting with a node's PlatformVMAPI
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Axia.addAPI]] function to register this interface with Axia.
 */
class PlatformVMAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly.
     * Instead use the [[Axia.addAPI]] method.
     *
     * @param core A reference to the Axia class
     * @param baseURL Defaults to the string "/ext/P" as the path to blockchain's baseURL
     */
    constructor(core, baseURL = "/ext/bc/P") {
        super(core, baseURL);
        /**
         * @ignore
         */
        this.keychain = new keychain_1.KeyChain("", "");
        this.blockchainID = constants_1.PlatformChainID;
        this.blockchainAlias = undefined;
        this.AXCAssetID = undefined;
        this.txFee = undefined;
        this.creationTxFee = undefined;
        this.minValidatorStake = undefined;
        this.minNominatorStake = undefined;
        /**
         * Gets the alias for the blockchainID if it exists, otherwise returns `undefined`.
         *
         * @returns The alias for the blockchainID
         */
        this.getBlockchainAlias = () => {
            if (typeof this.blockchainAlias === "undefined") {
                const netid = this.core.getNetworkID();
                if (netid in constants_1.Defaults.network &&
                    this.blockchainID in constants_1.Defaults.network[`${netid}`]) {
                    this.blockchainAlias =
                        constants_1.Defaults.network[`${netid}`][this.blockchainID].alias;
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
                typeof constants_1.Defaults.network[`${netid}`] !== "undefined") {
                this.blockchainID = constants_1.PlatformChainID; //default to CoreChain
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
            return bintools.parseAddress(addr, blockchainID, alias, constants_2.PlatformVMConstants.ADDRESSLENGTH);
        };
        this.addressFromBuffer = (address) => {
            const chainid = this.getBlockchainAlias()
                ? this.getBlockchainAlias()
                : this.getBlockchainID();
            const type = "bech32";
            return serialization.bufferToType(address, type, this.core.getHRP(), chainid);
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
                const assetID = yield this.getStakingAssetID();
                this.AXCAssetID = bintools.cb58Decode(assetID);
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
                ? new bn_js_1.default(constants_1.Defaults.network[this.core.getNetworkID()]["P"]["txFee"])
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
         * Gets the CreateAllyChainTx fee.
         *
         * @returns The CreateAllyChainTx fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getCreateAllyChainTxFee = () => {
            return this.core.getNetworkID() in constants_1.Defaults.network
                ? new bn_js_1.default(constants_1.Defaults.network[this.core.getNetworkID()]["P"]["createAllyChainTx"])
                : new bn_js_1.default(0);
        };
        /**
         * Gets the CreateChainTx fee.
         *
         * @returns The CreateChainTx fee as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.getCreateChainTxFee = () => {
            return this.core.getNetworkID() in constants_1.Defaults.network
                ? new bn_js_1.default(constants_1.Defaults.network[this.core.getNetworkID()]["P"]["createChainTx"])
                : new bn_js_1.default(0);
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
            return this.core.getNetworkID() in constants_1.Defaults.network
                ? new bn_js_1.default(constants_1.Defaults.network[this.core.getNetworkID()]["P"]["creationTxFee"])
                : new bn_js_1.default(0);
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
         * @returns The instance of [[]] for this class
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
            let outputTotal = outTotal.gt(new bn_js_1.default(0))
                ? outTotal
                : utx.getOutputTotal(axcAssetID);
            const fee = utx.getBurn(axcAssetID);
            if (fee.lte(constants_1.ONEAXC.mul(new bn_js_1.default(10))) || fee.lte(outputTotal)) {
                return true;
            }
            else {
                return false;
            }
        });
        /**
         * Retrieves an assetID for a allyChain"s staking assset.
         *
         * @returns Returns a Promise string with cb58 encoded value of the assetID.
         */
        this.getStakingAssetID = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("platform.getStakingAssetID");
            return response.data.result.assetID;
        });
        /**
         * Creates a new blockchain.
         *
         * @param username The username of the Keystore user that controls the new account
         * @param password The password of the Keystore user that controls the new account
         * @param allyChainID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an cb58 serialized string for the AllyChainID or its alias.
         * @param vmID The ID of the Virtual Machine the blockchain runs. Can also be an alias of the Virtual Machine.
         * @param fxIDs The ids of the FXs the VM is running.
         * @param name A human-readable name for the new blockchain
         * @param genesis The base 58 (with checksum) representation of the genesis state of the new blockchain. Virtual Machines should have a static API method named buildGenesis that can be used to generate genesisData.
         *
         * @returns Promise for the unsigned transaction to create this blockchain. Must be signed by a sufficient number of the AllyChain’s control keys and by the account paying the transaction fee.
         */
        this.createBlockchain = (username, password, allyChainID = undefined, vmID, fxIDs, name, genesis) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                fxIDs,
                vmID,
                name,
                genesisData: genesis
            };
            if (typeof allyChainID === "string") {
                params.allyChainID = allyChainID;
            }
            else if (typeof allyChainID !== "undefined") {
                params.allyChainID = bintools.cb58Encode(allyChainID);
            }
            const response = yield this.callMethod("platform.createBlockchain", params);
            return response.data.result.txID;
        });
        /**
         * Gets the status of a blockchain.
         *
         * @param blockchainID The blockchainID requesting a status update
         *
         * @returns Promise for a string of one of: "Validating", "Created", "Preferred", "Unknown".
         */
        this.getBlockchainStatus = (blockchainID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                blockchainID
            };
            const response = yield this.callMethod("platform.getBlockchainStatus", params);
            return response.data.result.status;
        });
        /**
         * Get the validators and their weights of a allyChain or the Primary Network at a given CoreChain height.
         *
         * @param height The CoreChain height to get the validator set at.
         * @param allyChainID Optional. A cb58 serialized string for the AllyChainID or its alias.
         *
         * @returns Promise GetValidatorsAtResponse
         */
        this.getValidatorsAt = (height, allyChainID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                height
            };
            if (typeof allyChainID !== "undefined") {
                params.allyChainID = allyChainID;
            }
            const response = yield this.callMethod("platform.getValidatorsAt", params);
            return response.data.result;
        });
        /**
         * Create an address in the node's keystore.
         *
         * @param username The username of the Keystore user that controls the new account
         * @param password The password of the Keystore user that controls the new account
         *
         * @returns Promise for a string of the newly created account address.
         */
        this.createAddress = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password
            };
            const response = yield this.callMethod("platform.createAddress", params);
            return response.data.result.address;
        });
        /**
         * Gets the balance of a particular asset.
         *
         * @param address The address to pull the asset balance from
         *
         * @returns Promise with the balance as a {@link https://github.com/indutny/bn.js/|BN} on the provided address.
         */
        this.getBalance = (address) => __awaiter(this, void 0, void 0, function* () {
            if (typeof this.parseAddress(address) === "undefined") {
                /* istanbul ignore next */
                throw new errors_1.AddressError("Error - PlatformVMAPI.getBalance: Invalid address format");
            }
            const params = {
                address
            };
            const response = yield this.callMethod("platform.getBalance", params);
            return response.data.result;
        });
        /**
         * List the addresses controlled by the user.
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         *
         * @returns Promise for an array of addresses.
         */
        this.listAddresses = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password
            };
            const response = yield this.callMethod("platform.listAddresses", params);
            return response.data.result.addresses;
        });
        /**
         * Lists the set of current validators.
         *
         * @param allyChainID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an
         * cb58 serialized string for the AllyChainID or its alias.
         * @param nodeIDs Optional. An array of strings
         *
         * @returns Promise for an array of validators that are currently staking, see: {@link https://docs.axc.network/v1.0/en/api/platform/#platformgetcurrentvalidators|platform.getCurrentValidators documentation}.
         *
         */
        this.getCurrentValidators = (allyChainID = undefined, nodeIDs = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            if (typeof allyChainID === "string") {
                params.allyChainID = allyChainID;
            }
            else if (typeof allyChainID !== "undefined") {
                params.allyChainID = bintools.cb58Encode(allyChainID);
            }
            if (typeof nodeIDs != "undefined" && nodeIDs.length > 0) {
                params.nodeIDs = nodeIDs;
            }
            const response = yield this.callMethod("platform.getCurrentValidators", params);
            return response.data.result;
        });
        /**
         * Lists the set of pending validators.
         *
         * @param allyChainID Optional. Either a {@link https://github.com/feross/buffer|Buffer}
         * or a cb58 serialized string for the AllyChainID or its alias.
         * @param nodeIDs Optional. An array of strings
         *
         * @returns Promise for an array of validators that are pending staking, see: {@link https://docs.axc.network/v1.0/en/api/platform/#platformgetpendingvalidators|platform.getPendingValidators documentation}.
         *
         */
        this.getPendingValidators = (allyChainID = undefined, nodeIDs = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            if (typeof allyChainID === "string") {
                params.allyChainID = allyChainID;
            }
            else if (typeof allyChainID !== "undefined") {
                params.allyChainID = bintools.cb58Encode(allyChainID);
            }
            if (typeof nodeIDs != "undefined" && nodeIDs.length > 0) {
                params.nodeIDs = nodeIDs;
            }
            const response = yield this.callMethod("platform.getPendingValidators", params);
            return response.data.result;
        });
        /**
         * Samples `Size` validators from the current validator set.
         *
         * @param sampleSize Of the total universe of validators, select this many at random
         * @param allyChainID Optional. Either a {@link https://github.com/feross/buffer|Buffer} or an
         * cb58 serialized string for the AllyChainID or its alias.
         *
         * @returns Promise for an array of validator"s stakingIDs.
         */
        this.sampleValidators = (sampleSize, allyChainID = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                size: sampleSize.toString()
            };
            if (typeof allyChainID === "string") {
                params.allyChainID = allyChainID;
            }
            else if (typeof allyChainID !== "undefined") {
                params.allyChainID = bintools.cb58Encode(allyChainID);
            }
            const response = yield this.callMethod("platform.sampleValidators", params);
            return response.data.result.validators;
        });
        /**
         * Add a validator to the Primary Network.
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         * @param nodeID The node ID of the validator
         * @param startTime Javascript Date object for the start time to validate
         * @param endTime Javascript Date object for the end time to validate
         * @param stakeAmount The amount of nAXC the validator is staking as
         * a {@link https://github.com/indutny/bn.js/|BN}
         * @param rewardAddress The address the validator reward will go to, if there is one.
         * @param delegationFeeRate Optional. A {@link https://github.com/indutny/bn.js/|BN} for the percent fee this validator
         * charges when others delegate stake to them. Up to 4 decimal places allowed additional decimal places are ignored.
         * Must be between 0 and 100, inclusive. For example, if delegationFeeRate is 1.2345 and someone delegates to this
         * validator, then when the delegation period is over, 1.2345% of the reward goes to the validator and the rest goes
         * to the nominator.
         *
         * @returns Promise for a base58 string of the unsigned transaction.
         */
        this.addValidator = (username, password, nodeID, startTime, endTime, stakeAmount, rewardAddress, delegationFeeRate = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                nodeID,
                startTime: startTime.getTime() / 1000,
                endTime: endTime.getTime() / 1000,
                stakeAmount: stakeAmount.toString(10),
                rewardAddress
            };
            if (typeof delegationFeeRate !== "undefined") {
                params.delegationFeeRate = delegationFeeRate.toString(10);
            }
            const response = yield this.callMethod("platform.addValidator", params);
            return response.data.result.txID;
        });
        /**
         * Add a validator to a AllyChain other than the Primary Network. The validator must validate the Primary Network for the entire duration they validate this AllyChain.
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         * @param nodeID The node ID of the validator
         * @param allyChainID Either a {@link https://github.com/feross/buffer|Buffer} or a cb58 serialized string for the AllyChainID or its alias.
         * @param startTime Javascript Date object for the start time to validate
         * @param endTime Javascript Date object for the end time to validate
         * @param weight The validator’s weight used for sampling
         *
         * @returns Promise for the unsigned transaction. It must be signed (using sign) by the proper number of the AllyChain’s control keys and by the key of the account paying the transaction fee before it can be issued.
         */
        this.addAllyChainValidator = (username, password, nodeID, allyChainID, startTime, endTime, weight) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                nodeID,
                startTime: startTime.getTime() / 1000,
                endTime: endTime.getTime() / 1000,
                weight
            };
            if (typeof allyChainID === "string") {
                params.allyChainID = allyChainID;
            }
            else if (typeof allyChainID !== "undefined") {
                params.allyChainID = bintools.cb58Encode(allyChainID);
            }
            const response = yield this.callMethod("platform.addAllyChainValidator", params);
            return response.data.result.txID;
        });
        /**
         * Add a nominator to the Primary Network.
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         * @param nodeID The node ID of the delegatee
         * @param startTime Javascript Date object for when the nominator starts delegating
         * @param endTime Javascript Date object for when the nominator starts delegating
         * @param stakeAmount The amount of nAXC the nominator is staking as
         * a {@link https://github.com/indutny/bn.js/|BN}
         * @param rewardAddress The address of the account the staked AXC and validation reward
         * (if applicable) are sent to at endTime
         *
         * @returns Promise for an array of validator"s stakingIDs.
         */
        this.addNominator = (username, password, nodeID, startTime, endTime, stakeAmount, rewardAddress) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                nodeID,
                startTime: startTime.getTime() / 1000,
                endTime: endTime.getTime() / 1000,
                stakeAmount: stakeAmount.toString(10),
                rewardAddress
            };
            const response = yield this.callMethod("platform.addNominator", params);
            return response.data.result.txID;
        });
        /**
         * Create an unsigned transaction to create a new AllyChain. The unsigned transaction must be
         * signed with the key of the account paying the transaction fee. The AllyChain’s ID is the ID of the transaction that creates it (ie the response from issueTx when issuing the signed transaction).
         *
         * @param username The username of the Keystore user
         * @param password The password of the Keystore user
         * @param controlKeys Array of platform addresses as strings
         * @param threshold To add a validator to this AllyChain, a transaction must have threshold
         * signatures, where each signature is from a key whose address is an element of `controlKeys`
         *
         * @returns Promise for a string with the unsigned transaction encoded as base58.
         */
        this.createAllyChain = (username, password, controlKeys, threshold) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                controlKeys,
                threshold
            };
            const response = yield this.callMethod("platform.createAllyChain", params);
            return response.data.result.txID
                ? response.data.result.txID
                : response.data.result;
        });
        /**
         * Get the AllyChain that validates a given blockchain.
         *
         * @param blockchainID Either a {@link https://github.com/feross/buffer|Buffer} or a cb58
         * encoded string for the blockchainID or its alias.
         *
         * @returns Promise for a string of the allyChainID that validates the blockchain.
         */
        this.validatedBy = (blockchainID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                blockchainID
            };
            const response = yield this.callMethod("platform.validatedBy", params);
            return response.data.result.allyChainID;
        });
        /**
         * Get the IDs of the blockchains a AllyChain validates.
         *
         * @param allyChainID Either a {@link https://github.com/feross/buffer|Buffer} or an AXC
         * serialized string for the AllyChainID or its alias.
         *
         * @returns Promise for an array of blockchainIDs the allyChain validates.
         */
        this.validates = (allyChainID) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                allyChainID
            };
            if (typeof allyChainID === "string") {
                params.allyChainID = allyChainID;
            }
            else if (typeof allyChainID !== "undefined") {
                params.allyChainID = bintools.cb58Encode(allyChainID);
            }
            const response = yield this.callMethod("platform.validates", params);
            return response.data.result.blockchainIDs;
        });
        /**
         * Get all the blockchains that exist (excluding the CoreChain).
         *
         * @returns Promise for an array of objects containing fields "id", "allyChainID", and "vmID".
         */
        this.getBlockchains = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("platform.getBlockchains");
            return response.data.result.blockchains;
        });
        /**
         * Send AXC from an account on the CoreChain to an address on the X-Chain. This transaction
         * must be signed with the key of the account that the AXC is sent from and which pays the
         * transaction fee. After issuing this transaction, you must call the X-Chain’s importAXC
         * method to complete the transfer.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The address on the X-Chain to send the AXC to. Do not include X- in the address
         * @param amount Amount of AXC to export as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns Promise for an unsigned transaction to be signed by the account the the AXC is
         * sent from and pays the transaction fee.
         */
        this.exportAXC = (username, password, amount, to) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password,
                to,
                amount: amount.toString(10)
            };
            const response = yield this.callMethod("platform.exportAXC", params);
            return response.data.result.txID
                ? response.data.result.txID
                : response.data.result;
        });
        /**
         * Send AXC from an account on the CoreChain to an address on the X-Chain. This transaction
         * must be signed with the key of the account that the AXC is sent from and which pays
         * the transaction fee. After issuing this transaction, you must call the X-Chain’s
         * importAXC method to complete the transfer.
         *
         * @param username The Keystore user that controls the account specified in `to`
         * @param password The password of the Keystore user
         * @param to The ID of the account the AXC is sent to. This must be the same as the to
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
            const response = yield this.callMethod("platform.importAXC", params);
            return response.data.result.txID
                ? response.data.result.txID
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
                throw new errors_1.TransactionError("Error - platform.issueTx: provided tx is not expected type of string, Buffer, or Tx");
            }
            const params = {
                tx: Transaction.toString()
            };
            const response = yield this.callMethod("platform.issueTx", params);
            return response.data.result.txID;
        });
        /**
         * Returns an upper bound on the amount of tokens that exist. Not monotonically increasing because this number can go down if a staker"s reward is denied.
         */
        this.getCurrentSupply = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("platform.getCurrentSupply");
            return new bn_js_1.default(response.data.result.supply, 10);
        });
        /**
         * Returns the height of the platform chain.
         */
        this.getHeight = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("platform.getHeight");
            return new bn_js_1.default(response.data.result.height, 10);
        });
        /**
         * Gets the minimum staking amount.
         *
         * @param refresh A boolean to bypass the local cached value of Minimum Stake Amount, polling the node instead.
         */
        this.getMinStake = (refresh = false) => __awaiter(this, void 0, void 0, function* () {
            if (refresh !== true &&
                typeof this.minValidatorStake !== "undefined" &&
                typeof this.minNominatorStake !== "undefined") {
                return {
                    minValidatorStake: this.minValidatorStake,
                    minNominatorStake: this.minNominatorStake
                };
            }
            const response = yield this.callMethod("platform.getMinStake");
            this.minValidatorStake = new bn_js_1.default(response.data.result.minValidatorStake, 10);
            this.minNominatorStake = new bn_js_1.default(response.data.result.minNominatorStake, 10);
            return {
                minValidatorStake: this.minValidatorStake,
                minNominatorStake: this.minNominatorStake
            };
        });
        /**
         * getTotalStake() returns the total amount staked on the Primary Network
         *
         * @returns A big number representing total staked by validators on the primary network
         */
        this.getTotalStake = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("platform.getTotalStake");
            return new bn_js_1.default(response.data.result.stake, 10);
        });
        /**
         * getMaxStakeAmount() returns the maximum amount of nAXC staking to the named node during the time period.
         *
         * @param allyChainID A Buffer or cb58 string representing allyChain
         * @param nodeID A string representing ID of the node whose stake amount is required during the given duration
         * @param startTime A big number denoting start time of the duration during which stake amount of the node is required.
         * @param endTime A big number denoting end time of the duration during which stake amount of the node is required.
         * @returns A big number representing total staked by validators on the primary network
         */
        this.getMaxStakeAmount = (allyChainID, nodeID, startTime, endTime) => __awaiter(this, void 0, void 0, function* () {
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.gt(now) || endTime.lte(startTime)) {
                throw new errors_1.TimeError("PlatformVMAPI.getMaxStakeAmount -- startTime must be in the past and endTime must come after startTime");
            }
            const params = {
                nodeID,
                startTime,
                endTime
            };
            if (typeof allyChainID === "string") {
                params.allyChainID = allyChainID;
            }
            else if (typeof allyChainID !== "undefined") {
                params.allyChainID = bintools.cb58Encode(allyChainID);
            }
            const response = yield this.callMethod("platform.getMaxStakeAmount", params);
            return new bn_js_1.default(response.data.result.amount, 10);
        });
        /**
         * Sets the minimum stake cached in this class.
         * @param minValidatorStake A {@link https://github.com/indutny/bn.js/|BN} to set the minimum stake amount cached in this class.
         * @param minNominatorStake A {@link https://github.com/indutny/bn.js/|BN} to set the minimum delegation amount cached in this class.
         */
        this.setMinStake = (minValidatorStake = undefined, minNominatorStake = undefined) => {
            if (typeof minValidatorStake !== "undefined") {
                this.minValidatorStake = minValidatorStake;
            }
            if (typeof minNominatorStake !== "undefined") {
                this.minNominatorStake = minNominatorStake;
            }
        };
        /**
         * Gets the total amount staked for an array of addresses.
         */
        this.getStake = (addresses, encoding = "cb58") => __awaiter(this, void 0, void 0, function* () {
            const params = {
                addresses,
                encoding
            };
            const response = yield this.callMethod("platform.getStake", params);
            return {
                staked: new bn_js_1.default(response.data.result.staked, 10),
                stakedOutputs: response.data.result.stakedOutputs.map((stakedOutput) => {
                    const transferableOutput = new outputs_1.TransferableOutput();
                    let buf;
                    if (encoding === "cb58") {
                        buf = bintools.cb58Decode(stakedOutput);
                    }
                    else {
                        buf = buffer_1.Buffer.from(stakedOutput.replace(/0x/g, ""), "hex");
                    }
                    transferableOutput.fromBuffer(buf, 2);
                    return transferableOutput;
                })
            };
        });
        /**
         * Get all the allyChains that exist.
         *
         * @param ids IDs of the allyChains to retrieve information about. If omitted, gets all allyChains
         *
         * @returns Promise for an array of objects containing fields "id",
         * "controlKeys", and "threshold".
         */
        this.getAllyChains = (ids = undefined) => __awaiter(this, void 0, void 0, function* () {
            const params = {};
            if (typeof ids !== undefined) {
                params.ids = ids;
            }
            const response = yield this.callMethod("platform.getAllyChains", params);
            return response.data.result.allyChains;
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
            const params = {
                username,
                password,
                address
            };
            const response = yield this.callMethod("platform.exportKey", params);
            return response.data.result.privateKey
                ? response.data.result.privateKey
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
            const response = yield this.callMethod("platform.importKey", params);
            return response.data.result.address
                ? response.data.result.address
                : response.data.result;
        });
        /**
         * Returns the treansaction data of a provided transaction ID by calling the node's `getTx` method.
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
            const response = yield this.callMethod("platform.getTx", params);
            return response.data.result.tx
                ? response.data.result.tx
                : response.data.result;
        });
        /**
         * Returns the status of a provided transaction ID by calling the node's `getTxStatus` method.
         *
         * @param txid The string representation of the transaction ID
         * @param includeReason Return the reason tx was dropped, if applicable. Defaults to true
         *
         * @returns Returns a Promise string containing the status retrieved from the node and the reason a tx was dropped, if applicable.
         */
        this.getTxStatus = (txid, includeReason = true) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID: txid,
                includeReason: includeReason
            };
            const response = yield this.callMethod("platform.getTxStatus", params);
            return response.data.result;
        });
        /**
         * Retrieves the UTXOs related to the addresses provided from the node's `getUTXOs` method.
         *
         * @param addresses An array of addresses as cb58 strings or addresses as {@link https://github.com/feross/buffer|Buffer}s
         * @param sourceChain A string for the chain to look for the UTXO"s. Default is to use this chain, but if exported UTXOs exist from other chains, this can used to pull them instead.
         * @param limit Optional. Returns at most [limit] addresses. If [limit] == 0 or > [maxUTXOsToFetch], fetches up to [maxUTXOsToFetch].
         * @param startIndex Optional. [StartIndex] defines where to start fetching UTXOs (for pagination.)
         * UTXOs fetched are from addresses equal to or greater than [StartIndex.Address]
         * For address [StartIndex.Address], only UTXOs with IDs greater than [StartIndex.Utxo] will be returned.
         * @param persistOpts Options available to persist these UTXOs in local storage
         * @param encoding Optional.  is the encoding format to use for the payload argument. Can be either "cb58" or "hex". Defaults to "hex".
         *
         * @remarks
         * persistOpts is optional and must be of type [[PersistanceOptions]]
         *
         */
        this.getUTXOs = (addresses, sourceChain = undefined, limit = 0, startIndex = undefined, persistOpts = undefined, encoding = "cb58") => __awaiter(this, void 0, void 0, function* () {
            if (typeof addresses === "string") {
                addresses = [addresses];
            }
            const params = {
                addresses: addresses,
                limit,
                encoding
            };
            if (typeof startIndex !== "undefined" && startIndex) {
                params.startIndex = startIndex;
            }
            if (typeof sourceChain !== "undefined") {
                params.sourceChain = sourceChain;
            }
            const response = yield this.callMethod("platform.getUTXOs", params);
            const utxos = new utxos_1.UTXOSet();
            let data = response.data.result.utxos;
            if (persistOpts && typeof persistOpts === "object") {
                if (this.db.has(persistOpts.getName())) {
                    const selfArray = this.db.get(persistOpts.getName());
                    if (Array.isArray(selfArray)) {
                        utxos.addArray(data);
                        const self = new utxos_1.UTXOSet();
                        self.addArray(selfArray);
                        self.mergeByRule(utxos, persistOpts.getMergeRule());
                        data = self.getAllUTXOStrings();
                    }
                }
                this.db.set(persistOpts.getName(), data, persistOpts.getOverwrite());
            }
            utxos.addArray(data, false);
            response.data.result.utxos = utxos;
            response.data.result.numFetched = parseInt(response.data.result.numFetched);
            return response.data.result;
        });
        /**
         * Helper function which creates an unsigned Import Tx. For more granular control, you may create your own
         * [[UnsignedTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param ownerAddresses The addresses being used to import
         * @param sourceChain The chainid for where the import is coming from.
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs provided
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
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
            const to = this._cleanAddressArray(toAddresses, "buildBaseTx").map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, "buildBaseTx").map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, "buildBaseTx").map((a) => bintools.stringToAddress(a));
            let srappChain = undefined;
            if (typeof sourceChain === "undefined") {
                throw new errors_1.ChainIdError("Error - PlatformVMAPI.buildImportTx: Source ChainID is undefined.");
            }
            else if (typeof sourceChain === "string") {
                srappChain = sourceChain;
                sourceChain = bintools.cb58Decode(sourceChain);
            }
            else if (!(sourceChain instanceof buffer_1.Buffer)) {
                throw new errors_1.ChainIdError("Error - PlatformVMAPI.buildImportTx: Invalid destinationChain type: " +
                    typeof sourceChain);
            }
            const atomicUTXOs = yield (yield this.getUTXOs(ownerAddresses, srappChain, 0, undefined)).utxos;
            const axcAssetID = yield this.getAXCAssetID();
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const atomics = atomicUTXOs.getAllUTXOs();
            const builtUnsignedTx = utxoset.buildImportTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), to, from, change, atomics, sourceChain, this.getTxFee(), axcAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Failed Goose Egg Check");
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
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction ([[UnsignedTx]]) which contains an [[ExportTx]].
         */
        this.buildExportTx = (utxoset, amount, destinationChain, toAddresses, fromAddresses, changeAddresses = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => __awaiter(this, void 0, void 0, function* () {
            let prefixes = {};
            toAddresses.map((a) => {
                prefixes[a.split("-")[0]] = true;
            });
            if (Object.keys(prefixes).length !== 1) {
                throw new errors_1.AddressError("Error - PlatformVMAPI.buildExportTx: To addresses must have the same chainID prefix.");
            }
            if (typeof destinationChain === "undefined") {
                throw new errors_1.ChainIdError("Error - PlatformVMAPI.buildExportTx: Destination ChainID is undefined.");
            }
            else if (typeof destinationChain === "string") {
                destinationChain = bintools.cb58Decode(destinationChain); //
            }
            else if (!(destinationChain instanceof buffer_1.Buffer)) {
                throw new errors_1.ChainIdError("Error - PlatformVMAPI.buildExportTx: Invalid destinationChain type: " +
                    typeof destinationChain);
            }
            if (destinationChain.length !== 32) {
                throw new errors_1.ChainIdError("Error - PlatformVMAPI.buildExportTx: Destination ChainID must be 32 bytes in length.");
            }
            /*
            if(bintools.cb58Encode(destinationChain) !== Defaults.network[this.core.getNetworkID()].X["blockchainID"]) {
              throw new Error("Error - PlatformVMAPI.buildExportTx: Destination ChainID must The X-Chain ID in the current version of AxiaJS.")
            }*/
            let to = [];
            toAddresses.map((a) => {
                to.push(bintools.stringToAddress(a));
            });
            const from = this._cleanAddressArray(fromAddresses, "buildExportTx").map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, "buildExportTx").map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const axcAssetID = yield this.getAXCAssetID();
            const builtUnsignedTx = utxoset.buildExportTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), amount, axcAssetID, to, from, change, destinationChain, this.getTxFee(), axcAssetID, memo, asOf, locktime, threshold);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned [[AddAllyChainValidatorTx]]. For more granular control, you may create your own
         * [[UnsignedTx]] manually and import the [[AddAllyChainValidatorTx]] class directly.
         *
         * @param utxoset A set of UTXOs that the transaction is built on.
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees in AXC
         * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
         * @param nodeID The node ID of the validator being added.
         * @param startTime The Unix time when the validator starts validating the Primary Network.
         * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AXC is returned).
         * @param weight The amount of weight for this allyChain validator.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param allyChainAuthCredentials Optional. An array of index and address to sign for each AllyChainAuth.
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildAddAllyChainValidatorTx = (utxoset, fromAddresses, changeAddresses, nodeID, startTime, endTime, weight, allyChainID, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), allyChainAuthCredentials = []) => __awaiter(this, void 0, void 0, function* () {
            const from = this._cleanAddressArray(fromAddresses, "buildAddAllyChainValidatorTx").map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, "buildAddAllyChainValidatorTx").map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const axcAssetID = yield this.getAXCAssetID();
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new Error("PlatformVMAPI.buildAddAllyChainValidatorTx -- startTime must be in the future and endTime must come after startTime");
            }
            const builtUnsignedTx = utxoset.buildAddAllyChainValidatorTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), from, change, (0, helperfunctions_1.NodeIDStringToBuffer)(nodeID), startTime, endTime, weight, allyChainID, this.getDefaultTxFee(), axcAssetID, memo, asOf, allyChainAuthCredentials);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new Error("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned [[AddNominatorTx]]. For more granular control, you may create your own
         * [[UnsignedTx]] manually and import the [[AddNominatorTx]] class directly.
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who received the staked tokens at the end of the staking period
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who own the staking UTXOs the fees in AXC
         * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
         * @param nodeID The node ID of the validator being added.
         * @param startTime The Unix time when the validator starts validating the Primary Network.
         * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AXC is returned).
         * @param stakeAmount The amount being delegated as a {@link https://github.com/indutny/bn.js/|BN}
         * @param rewardAddresses The addresses which will recieve the rewards from the delegated stake.
         * @param rewardLocktime Optional. The locktime field created in the resulting reward outputs
         * @param rewardThreshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildAddNominatorTx = (utxoset, toAddresses, fromAddresses, changeAddresses, nodeID, startTime, endTime, stakeAmount, rewardAddresses, rewardLocktime = new bn_js_1.default(0), rewardThreshold = 1, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => __awaiter(this, void 0, void 0, function* () {
            const to = this._cleanAddressArray(toAddresses, "buildAddNominatorTx").map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, "buildAddNominatorTx").map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, "buildAddNominatorTx").map((a) => bintools.stringToAddress(a));
            const rewards = this._cleanAddressArray(rewardAddresses, "buildAddValidatorTx").map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const minStake = (yield this.getMinStake())["minNominatorStake"];
            if (stakeAmount.lt(minStake)) {
                throw new errors_1.StakeError("PlatformVMAPI.buildAddNominatorTx -- stake amount must be at least " +
                    minStake.toString(10));
            }
            const axcAssetID = yield this.getAXCAssetID();
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new errors_1.TimeError("PlatformVMAPI.buildAddNominatorTx -- startTime must be in the future and endTime must come after startTime");
            }
            const builtUnsignedTx = utxoset.buildAddNominatorTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), axcAssetID, to, from, change, (0, helperfunctions_1.NodeIDStringToBuffer)(nodeID), startTime, endTime, stakeAmount, rewardLocktime, rewardThreshold, rewards, new bn_js_1.default(0), axcAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Helper function which creates an unsigned [[AddValidatorTx]]. For more granular control, you may create your own
         * [[UnsignedTx]] manually and import the [[AddValidatorTx]] class directly.
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who received the staked tokens at the end of the staking period
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who own the staking UTXOs the fees in AXC
         * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
         * @param nodeID The node ID of the validator being added.
         * @param startTime The Unix time when the validator starts validating the Primary Network.
         * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AXC is returned).
         * @param stakeAmount The amount being delegated as a {@link https://github.com/indutny/bn.js/|BN}
         * @param rewardAddresses The addresses which will recieve the rewards from the delegated stake.
         * @param delegationFee A number for the percentage of reward to be given to the validator when someone delegates to them. Must be between 0 and 100.
         * @param rewardLocktime Optional. The locktime field created in the resulting reward outputs
         * @param rewardThreshold Opional. The number of signatures required to spend the funds in the resultant reward UTXO. Default 1.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildAddValidatorTx = (utxoset, toAddresses, fromAddresses, changeAddresses, nodeID, startTime, endTime, stakeAmount, rewardAddresses, delegationFee, rewardLocktime = new bn_js_1.default(0), rewardThreshold = 1, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => __awaiter(this, void 0, void 0, function* () {
            const to = this._cleanAddressArray(toAddresses, "buildAddValidatorTx").map((a) => bintools.stringToAddress(a));
            const from = this._cleanAddressArray(fromAddresses, "buildAddValidatorTx").map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, "buildAddValidatorTx").map((a) => bintools.stringToAddress(a));
            const rewards = this._cleanAddressArray(rewardAddresses, "buildAddValidatorTx").map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const minStake = (yield this.getMinStake())["minValidatorStake"];
            if (stakeAmount.lt(minStake)) {
                throw new errors_1.StakeError("PlatformVMAPI.buildAddValidatorTx -- stake amount must be at least " +
                    minStake.toString(10));
            }
            if (typeof delegationFee !== "number" ||
                delegationFee > 100 ||
                delegationFee < 0) {
                throw new errors_1.DelegationFeeError("PlatformVMAPI.buildAddValidatorTx -- delegationFee must be a number between 0 and 100");
            }
            const axcAssetID = yield this.getAXCAssetID();
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new errors_1.TimeError("PlatformVMAPI.buildAddValidatorTx -- startTime must be in the future and endTime must come after startTime");
            }
            const builtUnsignedTx = utxoset.buildAddValidatorTx(this.core.getNetworkID(), bintools.cb58Decode(this.blockchainID), axcAssetID, to, from, change, (0, helperfunctions_1.NodeIDStringToBuffer)(nodeID), startTime, endTime, stakeAmount, rewardLocktime, rewardThreshold, rewards, delegationFee, new bn_js_1.default(0), axcAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Class representing an unsigned [[CreateAllyChainTx]] transaction.
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param allyChainOwnerAddresses An array of addresses for owners of the new allyChain
         * @param allyChainOwnerThreshold A number indicating the amount of signatures required to add validators to a allyChain
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildCreateAllyChainTx = (utxoset, fromAddresses, changeAddresses, allyChainOwnerAddresses, allyChainOwnerThreshold, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => __awaiter(this, void 0, void 0, function* () {
            const from = this._cleanAddressArray(fromAddresses, "buildCreateAllyChainTx").map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, "buildCreateAllyChainTx").map((a) => bintools.stringToAddress(a));
            const owners = this._cleanAddressArray(allyChainOwnerAddresses, "buildCreateAllyChainTx").map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const axcAssetID = yield this.getAXCAssetID();
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const fee = this.getCreateAllyChainTxFee();
            const builtUnsignedTx = utxoset.buildCreateAllyChainTx(networkID, blockchainID, from, change, owners, allyChainOwnerThreshold, fee, axcAssetID, memo, asOf);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * Build an unsigned [[CreateChainTx]].
         *
         * @param utxoset A set of UTXOs that the transaction is built on
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param allyChainID Optional ID of the AllyChain that validates this blockchain
         * @param chainName Optional A human readable name for the chain; need not be unique
         * @param vmID Optional ID of the VM running on the new chain
         * @param fxIDs Optional IDs of the feature extensions running on the new chain
         * @param genesisData Optional Byte representation of genesis state of the new chain
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param allyChainAuthCredentials Optional. An array of index and address to sign for each AllyChainAuth.
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildCreateChainTx = (utxoset, fromAddresses, changeAddresses, allyChainID = undefined, chainName = undefined, vmID = undefined, fxIDs = undefined, genesisData = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), allyChainAuthCredentials = []) => __awaiter(this, void 0, void 0, function* () {
            const from = this._cleanAddressArray(fromAddresses, "buildCreateChainTx").map((a) => bintools.stringToAddress(a));
            const change = this._cleanAddressArray(changeAddresses, "buildCreateChainTx").map((a) => bintools.stringToAddress(a));
            if (memo instanceof payload_1.PayloadBase) {
                memo = memo.getPayload();
            }
            const axcAssetID = yield this.getAXCAssetID();
            fxIDs = fxIDs.sort();
            const networkID = this.core.getNetworkID();
            const blockchainID = bintools.cb58Decode(this.blockchainID);
            const fee = this.getCreateChainTxFee();
            const builtUnsignedTx = utxoset.buildCreateChainTx(networkID, blockchainID, from, change, allyChainID, chainName, vmID, fxIDs, genesisData, fee, axcAssetID, memo, asOf, allyChainAuthCredentials);
            if (!(yield this.checkGooseEgg(builtUnsignedTx, this.getCreationTxFee()))) {
                /* istanbul ignore next */
                throw new errors_1.GooseEggCheckError("Failed Goose Egg Check");
            }
            return builtUnsignedTx;
        });
        /**
         * @returns the current timestamp on chain.
         */
        this.getTimestamp = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("platform.getTimestamp");
            return response.data.result.timestamp;
        });
        /**
         * @returns the UTXOs that were rewarded after the provided transaction"s staking or delegation period ended.
         */
        this.getRewardUTXOs = (txID, encoding) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                txID,
                encoding
            };
            const response = yield this.callMethod("platform.getRewardUTXOs", params);
            return response.data.result;
        });
        this.blockchainID = constants_1.PlatformChainID;
        const netID = core.getNetworkID();
        if (netID in constants_1.Defaults.network &&
            this.blockchainID in constants_1.Defaults.network[`${netID}`]) {
            const { alias } = constants_1.Defaults.network[`${netID}`][this.blockchainID];
            this.keychain = new keychain_1.KeyChain(this.core.getHRP(), alias);
        }
        else {
            this.keychain = new keychain_1.KeyChain(this.core.getHRP(), this.blockchainID);
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
            for (let i = 0; i < addresses.length; i++) {
                if (typeof addresses[`${i}`] === "string") {
                    if (typeof this.parseAddress(addresses[`${i}`]) ===
                        "undefined") {
                        /* istanbul ignore next */
                        throw new errors_1.AddressError("Error - Invalid address format");
                    }
                    addrs.push(addresses[`${i}`]);
                }
                else {
                    const bech32 = "bech32";
                    addrs.push(serialization.bufferToType(addresses[`${i}`], bech32, this.core.getHRP(), chainid));
                }
            }
        }
        return addrs;
    }
}
exports.PlatformVMAPI = PlatformVMAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvcGxhdGZvcm12bS9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7OztHQUdHO0FBQ0gsb0NBQWdDO0FBQ2hDLGtEQUFzQjtBQUV0QixrREFBOEM7QUFPOUMsb0VBQTJDO0FBQzNDLHlDQUFxQztBQUNyQyxxREFBeUU7QUFDekUsMkNBQWlEO0FBQ2pELDZCQUFxQztBQUNyQyxpREFBaUQ7QUFDakQsaUVBQTJFO0FBQzNFLCtDQUFtRDtBQUVuRCwrQ0FRMkI7QUErQjNCLHVDQUE4QztBQUM5Qyx1Q0FBMkQ7QUFJM0Q7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQixxQkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWhFOzs7Ozs7R0FNRztBQUNILE1BQWEsYUFBYyxTQUFRLGlCQUFPO0lBODBEeEM7Ozs7OztPQU1HO0lBQ0gsWUFBWSxJQUFjLEVBQUUsVUFBa0IsV0FBVztRQUN2RCxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBcjFEdEI7O1dBRUc7UUFDTyxhQUFRLEdBQWEsSUFBSSxtQkFBUSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUV6QyxpQkFBWSxHQUFXLDJCQUFlLENBQUE7UUFFdEMsb0JBQWUsR0FBVyxTQUFTLENBQUE7UUFFbkMsZUFBVSxHQUFXLFNBQVMsQ0FBQTtRQUU5QixVQUFLLEdBQU8sU0FBUyxDQUFBO1FBRXJCLGtCQUFhLEdBQU8sU0FBUyxDQUFBO1FBRTdCLHNCQUFpQixHQUFPLFNBQVMsQ0FBQTtRQUVqQyxzQkFBaUIsR0FBTyxTQUFTLENBQUE7UUFFM0M7Ozs7V0FJRztRQUNILHVCQUFrQixHQUFHLEdBQVcsRUFBRTtZQUNoQyxJQUFJLE9BQU8sSUFBSSxDQUFDLGVBQWUs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RjtRQUNELE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztDQW1ERjtBQS8zREQsc0NBKzNEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1QbGF0Zm9ybVZNXG4gKi9cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIlxuaW1wb3J0IEF4aWFDb3JlIGZyb20gXCIuLi8uLi9heGlhXCJcbmltcG9ydCB7IEpSUENBUEkgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2pycGNhcGlcIlxuaW1wb3J0IHsgUmVxdWVzdFJlc3BvbnNlRGF0YSB9IGZyb20gXCIuLi8uLi9jb21tb24vYXBpYmFzZVwiXG5pbXBvcnQge1xuICBFcnJvclJlc3BvbnNlT2JqZWN0LFxuICBBbGx5Q2hhaW5Pd25lckVycm9yLFxuICBBbGx5Q2hhaW5UaHJlc2hvbGRFcnJvclxufSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxuaW1wb3J0IHsgS2V5Q2hhaW4gfSBmcm9tIFwiLi9rZXljaGFpblwiXG5pbXBvcnQgeyBEZWZhdWx0cywgUGxhdGZvcm1DaGFpbklELCBPTkVBWEMgfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcbmltcG9ydCB7IFBsYXRmb3JtVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHsgVW5zaWduZWRUeCwgVHggfSBmcm9tIFwiLi90eFwiXG5pbXBvcnQgeyBQYXlsb2FkQmFzZSB9IGZyb20gXCIuLi8uLi91dGlscy9wYXlsb2FkXCJcbmltcG9ydCB7IFVuaXhOb3csIE5vZGVJRFN0cmluZ1RvQnVmZmVyIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2hlbHBlcmZ1bmN0aW9uc1wiXG5pbXBvcnQgeyBVVFhPLCBVVFhPU2V0IH0gZnJvbSBcIi4uL3BsYXRmb3Jtdm0vdXR4b3NcIlxuaW1wb3J0IHsgUGVyc2lzdGFuY2VPcHRpb25zIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3BlcnNpc3RlbmNlb3B0aW9uc1wiXG5pbXBvcnQge1xuICBBZGRyZXNzRXJyb3IsXG4gIFRyYW5zYWN0aW9uRXJyb3IsXG4gIENoYWluSWRFcnJvcixcbiAgR29vc2VFZ2dDaGVja0Vycm9yLFxuICBUaW1lRXJyb3IsXG4gIFN0YWtlRXJyb3IsXG4gIERlbGVnYXRpb25GZWVFcnJvclxufSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcbmltcG9ydCB7XG4gIEdldEN1cnJlbnRWYWxpZGF0b3JzUGFyYW1zLFxuICBHZXRQZW5kaW5nVmFsaWRhdG9yc1BhcmFtcyxcbiAgR2V0UmV3YXJkVVRYT3NQYXJhbXMsXG4gIEdldFJld2FyZFVUWE9zUmVzcG9uc2UsXG4gIEdldFN0YWtlUGFyYW1zLFxuICBHZXRTdGFrZVJlc3BvbnNlLFxuICBBbGx5Q2hhaW4sXG4gIEdldFZhbGlkYXRvcnNBdFBhcmFtcyxcbiAgR2V0VmFsaWRhdG9yc0F0UmVzcG9uc2UsXG4gIENyZWF0ZUFkZHJlc3NQYXJhbXMsXG4gIEdldFVUWE9zUGFyYW1zLFxuICBHZXRCYWxhbmNlUmVzcG9uc2UsXG4gIEdldFVUWE9zUmVzcG9uc2UsXG4gIExpc3RBZGRyZXNzZXNQYXJhbXMsXG4gIFNhbXBsZVZhbGlkYXRvcnNQYXJhbXMsXG4gIEFkZFZhbGlkYXRvclBhcmFtcyxcbiAgQWRkTm9taW5hdG9yUGFyYW1zLFxuICBDcmVhdGVBbGx5Q2hhaW5QYXJhbXMsXG4gIEV4cG9ydEFYQ1BhcmFtcyxcbiAgRXhwb3J0S2V5UGFyYW1zLFxuICBJbXBvcnRLZXlQYXJhbXMsXG4gIEltcG9ydEFYQ1BhcmFtcyxcbiAgQ3JlYXRlQmxvY2tjaGFpblBhcmFtcyxcbiAgQmxvY2tjaGFpbixcbiAgR2V0VHhTdGF0dXNQYXJhbXMsXG4gIEdldFR4U3RhdHVzUmVzcG9uc2UsXG4gIEdldE1pblN0YWtlUmVzcG9uc2UsXG4gIEdldE1heFN0YWtlQW1vdW50UGFyYW1zXG59IGZyb20gXCIuL2ludGVyZmFjZXNcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0IH0gZnJvbSBcIi4vb3V0cHV0c1wiXG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkVHlwZSB9IGZyb20gXCIuLi8uLi91dGlsc1wiXG5pbXBvcnQgeyBBbGx5Q2hhaW5BdXRoIH0gZnJvbSBcIi5cIlxuaW1wb3J0IHsgR2VuZXNpc0RhdGEgfSBmcm9tIFwiLi4vYXZtXCJcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcbmNvbnN0IHNlcmlhbGl6YXRpb246IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcblxuLyoqXG4gKiBDbGFzcyBmb3IgaW50ZXJhY3Rpbmcgd2l0aCBhIG5vZGUncyBQbGF0Zm9ybVZNQVBJXG4gKlxuICogQGNhdGVnb3J5IFJQQ0FQSXNcbiAqXG4gKiBAcmVtYXJrcyBUaGlzIGV4dGVuZHMgdGhlIFtbSlJQQ0FQSV1dIGNsYXNzLiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgZGlyZWN0bHkgY2FsbGVkLiBJbnN0ZWFkLCB1c2UgdGhlIFtbQXhpYS5hZGRBUEldXSBmdW5jdGlvbiB0byByZWdpc3RlciB0aGlzIGludGVyZmFjZSB3aXRoIEF4aWEuXG4gKi9cbmV4cG9ydCBjbGFzcyBQbGF0Zm9ybVZNQVBJIGV4dGVuZHMgSlJQQ0FQSSB7XG4gIC8qKlxuICAgKiBAaWdub3JlXG4gICAqL1xuICBwcm90ZWN0ZWQga2V5Y2hhaW46IEtleUNoYWluID0gbmV3IEtleUNoYWluKFwiXCIsIFwiXCIpXG5cbiAgcHJvdGVjdGVkIGJsb2NrY2hhaW5JRDogc3RyaW5nID0gUGxhdGZvcm1DaGFpbklEXG5cbiAgcHJvdGVjdGVkIGJsb2NrY2hhaW5BbGlhczogc3RyaW5nID0gdW5kZWZpbmVkXG5cbiAgcHJvdGVjdGVkIEFYQ0Fzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZFxuXG4gIHByb3RlY3RlZCB0eEZlZTogQk4gPSB1bmRlZmluZWRcblxuICBwcm90ZWN0ZWQgY3JlYXRpb25UeEZlZTogQk4gPSB1bmRlZmluZWRcblxuICBwcm90ZWN0ZWQgbWluVmFsaWRhdG9yU3Rha2U6IEJOID0gdW5kZWZpbmVkXG5cbiAgcHJvdGVjdGVkIG1pbk5vbWluYXRvclN0YWtlOiBCTiA9IHVuZGVmaW5lZFxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRCBpZiBpdCBleGlzdHMsIG90aGVyd2lzZSByZXR1cm5zIGB1bmRlZmluZWRgLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYWxpYXMgZm9yIHRoZSBibG9ja2NoYWluSURcbiAgICovXG4gIGdldEJsb2NrY2hhaW5BbGlhcyA9ICgpOiBzdHJpbmcgPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5ibG9ja2NoYWluQWxpYXMgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGNvbnN0IG5ldGlkOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICAgIGlmIChcbiAgICAgICAgbmV0aWQgaW4gRGVmYXVsdHMubmV0d29yayAmJlxuICAgICAgICB0aGlzLmJsb2NrY2hhaW5JRCBpbiBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldGlkfWBdXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5ibG9ja2NoYWluQWxpYXMgPVxuICAgICAgICAgIERlZmF1bHRzLm5ldHdvcmtbYCR7bmV0aWR9YF1bdGhpcy5ibG9ja2NoYWluSURdLmFsaWFzXG4gICAgICAgIHJldHVybiB0aGlzLmJsb2NrY2hhaW5BbGlhc1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5ibG9ja2NoYWluQWxpYXNcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRC5cbiAgICpcbiAgICogQHBhcmFtIGFsaWFzIFRoZSBhbGlhcyBmb3IgdGhlIGJsb2NrY2hhaW5JRC5cbiAgICpcbiAgICovXG4gIHNldEJsb2NrY2hhaW5BbGlhcyA9IChhbGlhczogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgICB0aGlzLmJsb2NrY2hhaW5BbGlhcyA9IGFsaWFzXG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICByZXR1cm4gdW5kZWZpbmVkXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYmxvY2tjaGFpbklEIGFuZCByZXR1cm5zIGl0LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYmxvY2tjaGFpbklEXG4gICAqL1xuICBnZXRCbG9ja2NoYWluSUQgPSAoKTogc3RyaW5nID0+IHRoaXMuYmxvY2tjaGFpbklEXG5cbiAgLyoqXG4gICAqIFJlZnJlc2ggYmxvY2tjaGFpbklELCBhbmQgaWYgYSBibG9ja2NoYWluSUQgaXMgcGFzc2VkIGluLCB1c2UgdGhhdC5cbiAgICpcbiAgICogQHBhcmFtIE9wdGlvbmFsLiBCbG9ja2NoYWluSUQgdG8gYXNzaWduLCBpZiBub25lLCB1c2VzIHRoZSBkZWZhdWx0IGJhc2VkIG9uIG5ldHdvcmtJRC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGJsb2NrY2hhaW5JRFxuICAgKi9cbiAgcmVmcmVzaEJsb2NrY2hhaW5JRCA9IChibG9ja2NoYWluSUQ6IHN0cmluZyA9IHVuZGVmaW5lZCk6IGJvb2xlYW4gPT4ge1xuICAgIGNvbnN0IG5ldGlkOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBpZiAoXG4gICAgICB0eXBlb2YgYmxvY2tjaGFpbklEID09PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICB0eXBlb2YgRGVmYXVsdHMubmV0d29ya1tgJHtuZXRpZH1gXSAhPT0gXCJ1bmRlZmluZWRcIlxuICAgICkge1xuICAgICAgdGhpcy5ibG9ja2NoYWluSUQgPSBQbGF0Zm9ybUNoYWluSUQgLy9kZWZhdWx0IHRvIENvcmVDaGFpblxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBibG9ja2NoYWluSUQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuYmxvY2tjaGFpbklEID0gYmxvY2tjaGFpbklEXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhbiBhZGRyZXNzIHN0cmluZyBhbmQgcmV0dXJucyBpdHMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50YXRpb24gaWYgdmFsaWQuXG4gICAqXG4gICAqIEByZXR1cm5zIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBhZGRyZXNzIGlmIHZhbGlkLCB1bmRlZmluZWQgaWYgbm90IHZhbGlkLlxuICAgKi9cbiAgcGFyc2VBZGRyZXNzID0gKGFkZHI6IHN0cmluZyk6IEJ1ZmZlciA9PiB7XG4gICAgY29uc3QgYWxpYXM6IHN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcbiAgICBjb25zdCBibG9ja2NoYWluSUQ6IHN0cmluZyA9IHRoaXMuZ2V0QmxvY2tjaGFpbklEKClcbiAgICByZXR1cm4gYmludG9vbHMucGFyc2VBZGRyZXNzKFxuICAgICAgYWRkcixcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIGFsaWFzLFxuICAgICAgUGxhdGZvcm1WTUNvbnN0YW50cy5BRERSRVNTTEVOR1RIXG4gICAgKVxuICB9XG5cbiAgYWRkcmVzc0Zyb21CdWZmZXIgPSAoYWRkcmVzczogQnVmZmVyKTogc3RyaW5nID0+IHtcbiAgICBjb25zdCBjaGFpbmlkOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXG4gICAgICA/IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcbiAgICAgIDogdGhpcy5nZXRCbG9ja2NoYWluSUQoKVxuICAgIGNvbnN0IHR5cGU6IFNlcmlhbGl6ZWRUeXBlID0gXCJiZWNoMzJcIlxuICAgIHJldHVybiBzZXJpYWxpemF0aW9uLmJ1ZmZlclRvVHlwZShcbiAgICAgIGFkZHJlc3MsXG4gICAgICB0eXBlLFxuICAgICAgdGhpcy5jb3JlLmdldEhSUCgpLFxuICAgICAgY2hhaW5pZFxuICAgIClcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSBBWEMgQXNzZXRJRCBhbmQgcmV0dXJucyBpdCBpbiBhIFByb21pc2UuXG4gICAqXG4gICAqIEBwYXJhbSByZWZyZXNoIFRoaXMgZnVuY3Rpb24gY2FjaGVzIHRoZSByZXNwb25zZS4gUmVmcmVzaCA9IHRydWUgd2lsbCBidXN0IHRoZSBjYWNoZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHRoZSBwcm92aWRlZCBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBBWEMgQXNzZXRJRFxuICAgKi9cbiAgZ2V0QVhDQXNzZXRJRCA9IGFzeW5jIChyZWZyZXNoOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPEJ1ZmZlcj4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy5BWENBc3NldElEID09PSBcInVuZGVmaW5lZFwiIHx8IHJlZnJlc2gpIHtcbiAgICAgIGNvbnN0IGFzc2V0SUQ6IHN0cmluZyA9IGF3YWl0IHRoaXMuZ2V0U3Rha2luZ0Fzc2V0SUQoKVxuICAgICAgdGhpcy5BWENBc3NldElEID0gYmludG9vbHMuY2I1OERlY29kZShhc3NldElEKVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5BWENBc3NldElEXG4gIH1cblxuICAvKipcbiAgICogT3ZlcnJpZGVzIHRoZSBkZWZhdWx0cyBhbmQgc2V0cyB0aGUgY2FjaGUgdG8gYSBzcGVjaWZpYyBBWEMgQXNzZXRJRFxuICAgKlxuICAgKiBAcGFyYW0gYXhjQXNzZXRJRCBBIGNiNTggc3RyaW5nIG9yIEJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIEFYQyBBc3NldElEXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0aGUgcHJvdmlkZWQgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgQVhDIEFzc2V0SURcbiAgICovXG4gIHNldEFYQ0Fzc2V0SUQgPSAoYXhjQXNzZXRJRDogc3RyaW5nIHwgQnVmZmVyKSA9PiB7XG4gICAgaWYgKHR5cGVvZiBheGNBc3NldElEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBheGNBc3NldElEID0gYmludG9vbHMuY2I1OERlY29kZShheGNBc3NldElEKVxuICAgIH1cbiAgICB0aGlzLkFYQ0Fzc2V0SUQgPSBheGNBc3NldElEXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZGVmYXVsdCB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBkZWZhdWx0IHR4IGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXREZWZhdWx0VHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIHJldHVybiB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCkgaW4gRGVmYXVsdHMubmV0d29ya1xuICAgICAgPyBuZXcgQk4oRGVmYXVsdHMubmV0d29ya1t0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCldW1wiUFwiXVtcInR4RmVlXCJdKVxuICAgICAgOiBuZXcgQk4oMClcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB0eCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0VHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIGlmICh0eXBlb2YgdGhpcy50eEZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy50eEZlZSA9IHRoaXMuZ2V0RGVmYXVsdFR4RmVlKClcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMudHhGZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBDcmVhdGVBbGx5Q2hhaW5UeCBmZWUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBDcmVhdGVBbGx5Q2hhaW5UeCBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0Q3JlYXRlQWxseUNoYWluVHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIHJldHVybiB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCkgaW4gRGVmYXVsdHMubmV0d29ya1xuICAgICAgPyBuZXcgQk4oXG4gICAgICAgICAgRGVmYXVsdHMubmV0d29ya1t0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCldW1wiUFwiXVtcImNyZWF0ZUFsbHlDaGFpblR4XCJdXG4gICAgICAgIClcbiAgICAgIDogbmV3IEJOKDApXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgQ3JlYXRlQ2hhaW5UeCBmZWUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBDcmVhdGVDaGFpblR4IGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXRDcmVhdGVDaGFpblR4RmVlID0gKCk6IEJOID0+IHtcbiAgICByZXR1cm4gdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpIGluIERlZmF1bHRzLm5ldHdvcmtcbiAgICAgID8gbmV3IEJOKERlZmF1bHRzLm5ldHdvcmtbdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpXVtcIlBcIl1bXCJjcmVhdGVDaGFpblR4XCJdKVxuICAgICAgOiBuZXcgQk4oMClcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB0eCBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEBwYXJhbSBmZWUgVGhlIHR4IGZlZSBhbW91bnQgdG8gc2V0IGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBzZXRUeEZlZSA9IChmZWU6IEJOKSA9PiB7XG4gICAgdGhpcy50eEZlZSA9IGZlZVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGRlZmF1bHQgY3JlYXRpb24gZmVlIGZvciB0aGlzIGNoYWluLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZGVmYXVsdCBjcmVhdGlvbiBmZWUgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKi9cbiAgZ2V0RGVmYXVsdENyZWF0aW9uVHhGZWUgPSAoKTogQk4gPT4ge1xuICAgIHJldHVybiB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCkgaW4gRGVmYXVsdHMubmV0d29ya1xuICAgICAgPyBuZXcgQk4oRGVmYXVsdHMubmV0d29ya1t0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCldW1wiUFwiXVtcImNyZWF0aW9uVHhGZWVcIl0pXG4gICAgICA6IG5ldyBCTigwKVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNyZWF0aW9uIGZlZSBmb3IgdGhpcyBjaGFpbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGNyZWF0aW9uIGZlZSBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBnZXRDcmVhdGlvblR4RmVlID0gKCk6IEJOID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMuY3JlYXRpb25UeEZlZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5jcmVhdGlvblR4RmVlID0gdGhpcy5nZXREZWZhdWx0Q3JlYXRpb25UeEZlZSgpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNyZWF0aW9uVHhGZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjcmVhdGlvbiBmZWUgZm9yIHRoaXMgY2hhaW4uXG4gICAqXG4gICAqIEBwYXJhbSBmZWUgVGhlIGNyZWF0aW9uIGZlZSBhbW91bnQgdG8gc2V0IGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqL1xuICBzZXRDcmVhdGlvblR4RmVlID0gKGZlZTogQk4pID0+IHtcbiAgICB0aGlzLmNyZWF0aW9uVHhGZWUgPSBmZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgcmVmZXJlbmNlIHRvIHRoZSBrZXljaGFpbiBmb3IgdGhpcyBjbGFzcy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGluc3RhbmNlIG9mIFtbXV0gZm9yIHRoaXMgY2xhc3NcbiAgICovXG4gIGtleUNoYWluID0gKCk6IEtleUNoYWluID0+IHRoaXMua2V5Y2hhaW5cblxuICAvKipcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgbmV3S2V5Q2hhaW4gPSAoKTogS2V5Q2hhaW4gPT4ge1xuICAgIC8vIHdhcm5pbmcsIG92ZXJ3cml0ZXMgdGhlIG9sZCBrZXljaGFpblxuICAgIGNvbnN0IGFsaWFzID0gdGhpcy5nZXRCbG9ja2NoYWluQWxpYXMoKVxuICAgIGlmIChhbGlhcykge1xuICAgICAgdGhpcy5rZXljaGFpbiA9IG5ldyBLZXlDaGFpbih0aGlzLmNvcmUuZ2V0SFJQKCksIGFsaWFzKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgdGhpcy5ibG9ja2NoYWluSUQpXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmtleWNoYWluXG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGRldGVybWluZXMgaWYgYSB0eCBpcyBhIGdvb3NlIGVnZyB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHV0eCBBbiBVbnNpZ25lZFR4XG4gICAqXG4gICAqIEByZXR1cm5zIGJvb2xlYW4gdHJ1ZSBpZiBwYXNzZXMgZ29vc2UgZWdnIHRlc3QgYW5kIGZhbHNlIGlmIGZhaWxzLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBBIFwiR29vc2UgRWdnIFRyYW5zYWN0aW9uXCIgaXMgd2hlbiB0aGUgZmVlIGZhciBleGNlZWRzIGEgcmVhc29uYWJsZSBhbW91bnRcbiAgICovXG4gIGNoZWNrR29vc2VFZ2cgPSBhc3luYyAoXG4gICAgdXR4OiBVbnNpZ25lZFR4LFxuICAgIG91dFRvdGFsOiBCTiA9IG5ldyBCTigwKVxuICApOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcbiAgICBjb25zdCBheGNBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFYQ0Fzc2V0SUQoKVxuICAgIGxldCBvdXRwdXRUb3RhbDogQk4gPSBvdXRUb3RhbC5ndChuZXcgQk4oMCkpXG4gICAgICA/IG91dFRvdGFsXG4gICAgICA6IHV0eC5nZXRPdXRwdXRUb3RhbChheGNBc3NldElEKVxuICAgIGNvbnN0IGZlZTogQk4gPSB1dHguZ2V0QnVybihheGNBc3NldElEKVxuICAgIGlmIChmZWUubHRlKE9ORUFYQy5tdWwobmV3IEJOKDEwKSkpIHx8IGZlZS5sdGUob3V0cHV0VG90YWwpKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmVzIGFuIGFzc2V0SUQgZm9yIGEgYWxseUNoYWluXCJzIHN0YWtpbmcgYXNzc2V0LlxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgd2l0aCBjYjU4IGVuY29kZWQgdmFsdWUgb2YgdGhlIGFzc2V0SUQuXG4gICAqL1xuICBnZXRTdGFraW5nQXNzZXRJRCA9IGFzeW5jICgpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRTdGFraW5nQXNzZXRJRFwiXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5hc3NldElEXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBibG9ja2NoYWluLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIG5ldyBhY2NvdW50XG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgbmV3IGFjY291bnRcbiAgICogQHBhcmFtIGFsbHlDaGFpbklEIE9wdGlvbmFsLiBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhbiBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgQWxseUNoYWluSUQgb3IgaXRzIGFsaWFzLlxuICAgKiBAcGFyYW0gdm1JRCBUaGUgSUQgb2YgdGhlIFZpcnR1YWwgTWFjaGluZSB0aGUgYmxvY2tjaGFpbiBydW5zLiBDYW4gYWxzbyBiZSBhbiBhbGlhcyBvZiB0aGUgVmlydHVhbCBNYWNoaW5lLlxuICAgKiBAcGFyYW0gZnhJRHMgVGhlIGlkcyBvZiB0aGUgRlhzIHRoZSBWTSBpcyBydW5uaW5nLlxuICAgKiBAcGFyYW0gbmFtZSBBIGh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSBuZXcgYmxvY2tjaGFpblxuICAgKiBAcGFyYW0gZ2VuZXNpcyBUaGUgYmFzZSA1OCAod2l0aCBjaGVja3N1bSkgcmVwcmVzZW50YXRpb24gb2YgdGhlIGdlbmVzaXMgc3RhdGUgb2YgdGhlIG5ldyBibG9ja2NoYWluLiBWaXJ0dWFsIE1hY2hpbmVzIHNob3VsZCBoYXZlIGEgc3RhdGljIEFQSSBtZXRob2QgbmFtZWQgYnVpbGRHZW5lc2lzIHRoYXQgY2FuIGJlIHVzZWQgdG8gZ2VuZXJhdGUgZ2VuZXNpc0RhdGEuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIHRoZSB1bnNpZ25lZCB0cmFuc2FjdGlvbiB0byBjcmVhdGUgdGhpcyBibG9ja2NoYWluLiBNdXN0IGJlIHNpZ25lZCBieSBhIHN1ZmZpY2llbnQgbnVtYmVyIG9mIHRoZSBBbGx5Q2hhaW7igJlzIGNvbnRyb2wga2V5cyBhbmQgYnkgdGhlIGFjY291bnQgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUuXG4gICAqL1xuICBjcmVhdGVCbG9ja2NoYWluID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBhbGx5Q2hhaW5JRDogQnVmZmVyIHwgc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIHZtSUQ6IHN0cmluZyxcbiAgICBmeElEczogbnVtYmVyW10sXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGdlbmVzaXM6IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQ3JlYXRlQmxvY2tjaGFpblBhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBmeElEcyxcbiAgICAgIHZtSUQsXG4gICAgICBuYW1lLFxuICAgICAgZ2VuZXNpc0RhdGE6IGdlbmVzaXNcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhbGx5Q2hhaW5JRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgcGFyYW1zLmFsbHlDaGFpbklEID0gYWxseUNoYWluSURcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBhbGx5Q2hhaW5JRCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLmFsbHlDaGFpbklEID0gYmludG9vbHMuY2I1OEVuY29kZShhbGx5Q2hhaW5JRClcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmNyZWF0ZUJsb2NrY2hhaW5cIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHN0YXR1cyBvZiBhIGJsb2NrY2hhaW4uXG4gICAqXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgVGhlIGJsb2NrY2hhaW5JRCByZXF1ZXN0aW5nIGEgc3RhdHVzIHVwZGF0ZVxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIHN0cmluZyBvZiBvbmUgb2Y6IFwiVmFsaWRhdGluZ1wiLCBcIkNyZWF0ZWRcIiwgXCJQcmVmZXJyZWRcIiwgXCJVbmtub3duXCIuXG4gICAqL1xuICBnZXRCbG9ja2NoYWluU3RhdHVzID0gYXN5bmMgKGJsb2NrY2hhaW5JRDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IGFueSA9IHtcbiAgICAgIGJsb2NrY2hhaW5JRFxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0QmxvY2tjaGFpblN0YXR1c1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdGF0dXNcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHZhbGlkYXRvcnMgYW5kIHRoZWlyIHdlaWdodHMgb2YgYSBhbGx5Q2hhaW4gb3IgdGhlIFByaW1hcnkgTmV0d29yayBhdCBhIGdpdmVuIENvcmVDaGFpbiBoZWlnaHQuXG4gICAqXG4gICAqIEBwYXJhbSBoZWlnaHQgVGhlIENvcmVDaGFpbiBoZWlnaHQgdG8gZ2V0IHRoZSB2YWxpZGF0b3Igc2V0IGF0LlxuICAgKiBAcGFyYW0gYWxseUNoYWluSUQgT3B0aW9uYWwuIEEgY2I1OCBzZXJpYWxpemVkIHN0cmluZyBmb3IgdGhlIEFsbHlDaGFpbklEIG9yIGl0cyBhbGlhcy5cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBHZXRWYWxpZGF0b3JzQXRSZXNwb25zZVxuICAgKi9cbiAgZ2V0VmFsaWRhdG9yc0F0ID0gYXN5bmMgKFxuICAgIGhlaWdodDogbnVtYmVyLFxuICAgIGFsbHlDaGFpbklEPzogc3RyaW5nXG4gICk6IFByb21pc2U8R2V0VmFsaWRhdG9yc0F0UmVzcG9uc2U+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldFZhbGlkYXRvcnNBdFBhcmFtcyA9IHtcbiAgICAgIGhlaWdodFxuICAgIH1cbiAgICBpZiAodHlwZW9mIGFsbHlDaGFpbklEICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuYWxseUNoYWluSUQgPSBhbGx5Q2hhaW5JRFxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0VmFsaWRhdG9yc0F0XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGFuIGFkZHJlc3MgaW4gdGhlIG5vZGUncyBrZXlzdG9yZS5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VybmFtZSBvZiB0aGUgS2V5c3RvcmUgdXNlciB0aGF0IGNvbnRyb2xzIHRoZSBuZXcgYWNjb3VudFxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIG5ldyBhY2NvdW50XG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIG9mIHRoZSBuZXdseSBjcmVhdGVkIGFjY291bnQgYWRkcmVzcy5cbiAgICovXG4gIGNyZWF0ZUFkZHJlc3MgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBDcmVhdGVBZGRyZXNzUGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZFxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uY3JlYXRlQWRkcmVzc1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5hZGRyZXNzXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYmFsYW5jZSBvZiBhIHBhcnRpY3VsYXIgYXNzZXQuXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIHRvIHB1bGwgdGhlIGFzc2V0IGJhbGFuY2UgZnJvbVxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIHdpdGggdGhlIGJhbGFuY2UgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBvbiB0aGUgcHJvdmlkZWQgYWRkcmVzcy5cbiAgICovXG4gIGdldEJhbGFuY2UgPSBhc3luYyAoYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxHZXRCYWxhbmNlUmVzcG9uc2U+ID0+IHtcbiAgICBpZiAodHlwZW9mIHRoaXMucGFyc2VBZGRyZXNzKGFkZHJlc3MpID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIFBsYXRmb3JtVk1BUEkuZ2V0QmFsYW5jZTogSW52YWxpZCBhZGRyZXNzIGZvcm1hdFwiXG4gICAgICApXG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczogYW55ID0ge1xuICAgICAgYWRkcmVzc1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0QmFsYW5jZVwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgdGhlIGFkZHJlc3NlcyBjb250cm9sbGVkIGJ5IHRoZSB1c2VyLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgYWRkcmVzc2VzLlxuICAgKi9cbiAgbGlzdEFkZHJlc3NlcyA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmdbXT4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogTGlzdEFkZHJlc3Nlc1BhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmRcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmxpc3RBZGRyZXNzZXNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWRkcmVzc2VzXG4gIH1cblxuICAvKipcbiAgICogTGlzdHMgdGhlIHNldCBvZiBjdXJyZW50IHZhbGlkYXRvcnMuXG4gICAqXG4gICAqIEBwYXJhbSBhbGx5Q2hhaW5JRCBPcHRpb25hbC4gRWl0aGVyIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYW5cbiAgICogY2I1OCBzZXJpYWxpemVkIHN0cmluZyBmb3IgdGhlIEFsbHlDaGFpbklEIG9yIGl0cyBhbGlhcy5cbiAgICogQHBhcmFtIG5vZGVJRHMgT3B0aW9uYWwuIEFuIGFycmF5IG9mIHN0cmluZ3NcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdmFsaWRhdG9ycyB0aGF0IGFyZSBjdXJyZW50bHkgc3Rha2luZywgc2VlOiB7QGxpbmsgaHR0cHM6Ly9kb2NzLmF4Yy5uZXR3b3JrL3YxLjAvZW4vYXBpL3BsYXRmb3JtLyNwbGF0Zm9ybWdldGN1cnJlbnR2YWxpZGF0b3JzfHBsYXRmb3JtLmdldEN1cnJlbnRWYWxpZGF0b3JzIGRvY3VtZW50YXRpb259LlxuICAgKlxuICAgKi9cbiAgZ2V0Q3VycmVudFZhbGlkYXRvcnMgPSBhc3luYyAoXG4gICAgYWxseUNoYWluSUQ6IEJ1ZmZlciB8IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBub2RlSURzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZFxuICApOiBQcm9taXNlPG9iamVjdD4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogR2V0Q3VycmVudFZhbGlkYXRvcnNQYXJhbXMgPSB7fVxuICAgIGlmICh0eXBlb2YgYWxseUNoYWluSUQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHBhcmFtcy5hbGx5Q2hhaW5JRCA9IGFsbHlDaGFpbklEXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYWxseUNoYWluSUQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtcy5hbGx5Q2hhaW5JRCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoYWxseUNoYWluSUQpXG4gICAgfVxuICAgIGlmICh0eXBlb2Ygbm9kZUlEcyAhPSBcInVuZGVmaW5lZFwiICYmIG5vZGVJRHMubGVuZ3RoID4gMCkge1xuICAgICAgcGFyYW1zLm5vZGVJRHMgPSBub2RlSURzXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRDdXJyZW50VmFsaWRhdG9yc1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIExpc3RzIHRoZSBzZXQgb2YgcGVuZGluZyB2YWxpZGF0b3JzLlxuICAgKlxuICAgKiBAcGFyYW0gYWxseUNoYWluSUQgT3B0aW9uYWwuIEVpdGhlciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIG9yIGEgY2I1OCBzZXJpYWxpemVkIHN0cmluZyBmb3IgdGhlIEFsbHlDaGFpbklEIG9yIGl0cyBhbGlhcy5cbiAgICogQHBhcmFtIG5vZGVJRHMgT3B0aW9uYWwuIEFuIGFycmF5IG9mIHN0cmluZ3NcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdmFsaWRhdG9ycyB0aGF0IGFyZSBwZW5kaW5nIHN0YWtpbmcsIHNlZToge0BsaW5rIGh0dHBzOi8vZG9jcy5heGMubmV0d29yay92MS4wL2VuL2FwaS9wbGF0Zm9ybS8jcGxhdGZvcm1nZXRwZW5kaW5ndmFsaWRhdG9yc3xwbGF0Zm9ybS5nZXRQZW5kaW5nVmFsaWRhdG9ycyBkb2N1bWVudGF0aW9ufS5cbiAgICpcbiAgICovXG4gIGdldFBlbmRpbmdWYWxpZGF0b3JzID0gYXN5bmMgKFxuICAgIGFsbHlDaGFpbklEOiBCdWZmZXIgfCBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgbm9kZUlEczogc3RyaW5nW10gPSB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxvYmplY3Q+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldFBlbmRpbmdWYWxpZGF0b3JzUGFyYW1zID0ge31cbiAgICBpZiAodHlwZW9mIGFsbHlDaGFpbklEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBwYXJhbXMuYWxseUNoYWluSUQgPSBhbGx5Q2hhaW5JRFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGFsbHlDaGFpbklEICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuYWxseUNoYWluSUQgPSBiaW50b29scy5jYjU4RW5jb2RlKGFsbHlDaGFpbklEKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIG5vZGVJRHMgIT0gXCJ1bmRlZmluZWRcIiAmJiBub2RlSURzLmxlbmd0aCA+IDApIHtcbiAgICAgIHBhcmFtcy5ub2RlSURzID0gbm9kZUlEc1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRQZW5kaW5nVmFsaWRhdG9yc1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFNhbXBsZXMgYFNpemVgIHZhbGlkYXRvcnMgZnJvbSB0aGUgY3VycmVudCB2YWxpZGF0b3Igc2V0LlxuICAgKlxuICAgKiBAcGFyYW0gc2FtcGxlU2l6ZSBPZiB0aGUgdG90YWwgdW5pdmVyc2Ugb2YgdmFsaWRhdG9ycywgc2VsZWN0IHRoaXMgbWFueSBhdCByYW5kb21cbiAgICogQHBhcmFtIGFsbHlDaGFpbklEIE9wdGlvbmFsLiBFaXRoZXIgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvciBhblxuICAgKiBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgQWxseUNoYWluSUQgb3IgaXRzIGFsaWFzLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBhcnJheSBvZiB2YWxpZGF0b3JcInMgc3Rha2luZ0lEcy5cbiAgICovXG4gIHNhbXBsZVZhbGlkYXRvcnMgPSBhc3luYyAoXG4gICAgc2FtcGxlU2l6ZTogbnVtYmVyLFxuICAgIGFsbHlDaGFpbklEOiBCdWZmZXIgfCBzdHJpbmcgPSB1bmRlZmluZWRcbiAgKTogUHJvbWlzZTxzdHJpbmdbXT4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogU2FtcGxlVmFsaWRhdG9yc1BhcmFtcyA9IHtcbiAgICAgIHNpemU6IHNhbXBsZVNpemUudG9TdHJpbmcoKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGFsbHlDaGFpbklEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBwYXJhbXMuYWxseUNoYWluSUQgPSBhbGx5Q2hhaW5JRFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGFsbHlDaGFpbklEICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuYWxseUNoYWluSUQgPSBiaW50b29scy5jYjU4RW5jb2RlKGFsbHlDaGFpbklEKVxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uc2FtcGxlVmFsaWRhdG9yc1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC52YWxpZGF0b3JzXG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgdmFsaWRhdG9yIHRvIHRoZSBQcmltYXJ5IE5ldHdvcmsuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgdXNlcm5hbWUgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gbm9kZUlEIFRoZSBub2RlIElEIG9mIHRoZSB2YWxpZGF0b3JcbiAgICogQHBhcmFtIHN0YXJ0VGltZSBKYXZhc2NyaXB0IERhdGUgb2JqZWN0IGZvciB0aGUgc3RhcnQgdGltZSB0byB2YWxpZGF0ZVxuICAgKiBAcGFyYW0gZW5kVGltZSBKYXZhc2NyaXB0IERhdGUgb2JqZWN0IGZvciB0aGUgZW5kIHRpbWUgdG8gdmFsaWRhdGVcbiAgICogQHBhcmFtIHN0YWtlQW1vdW50IFRoZSBhbW91bnQgb2YgbkFYQyB0aGUgdmFsaWRhdG9yIGlzIHN0YWtpbmcgYXNcbiAgICogYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gcmV3YXJkQWRkcmVzcyBUaGUgYWRkcmVzcyB0aGUgdmFsaWRhdG9yIHJld2FyZCB3aWxsIGdvIHRvLCBpZiB0aGVyZSBpcyBvbmUuXG4gICAqIEBwYXJhbSBkZWxlZ2F0aW9uRmVlUmF0ZSBPcHRpb25hbC4gQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBmb3IgdGhlIHBlcmNlbnQgZmVlIHRoaXMgdmFsaWRhdG9yXG4gICAqIGNoYXJnZXMgd2hlbiBvdGhlcnMgZGVsZWdhdGUgc3Rha2UgdG8gdGhlbS4gVXAgdG8gNCBkZWNpbWFsIHBsYWNlcyBhbGxvd2VkIGFkZGl0aW9uYWwgZGVjaW1hbCBwbGFjZXMgYXJlIGlnbm9yZWQuXG4gICAqIE11c3QgYmUgYmV0d2VlbiAwIGFuZCAxMDAsIGluY2x1c2l2ZS4gRm9yIGV4YW1wbGUsIGlmIGRlbGVnYXRpb25GZWVSYXRlIGlzIDEuMjM0NSBhbmQgc29tZW9uZSBkZWxlZ2F0ZXMgdG8gdGhpc1xuICAgKiB2YWxpZGF0b3IsIHRoZW4gd2hlbiB0aGUgZGVsZWdhdGlvbiBwZXJpb2QgaXMgb3ZlciwgMS4yMzQ1JSBvZiB0aGUgcmV3YXJkIGdvZXMgdG8gdGhlIHZhbGlkYXRvciBhbmQgdGhlIHJlc3QgZ29lc1xuICAgKiB0byB0aGUgbm9taW5hdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIGJhc2U1OCBzdHJpbmcgb2YgdGhlIHVuc2lnbmVkIHRyYW5zYWN0aW9uLlxuICAgKi9cbiAgYWRkVmFsaWRhdG9yID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgcGFzc3dvcmQ6IHN0cmluZyxcbiAgICBub2RlSUQ6IHN0cmluZyxcbiAgICBzdGFydFRpbWU6IERhdGUsXG4gICAgZW5kVGltZTogRGF0ZSxcbiAgICBzdGFrZUFtb3VudDogQk4sXG4gICAgcmV3YXJkQWRkcmVzczogc3RyaW5nLFxuICAgIGRlbGVnYXRpb25GZWVSYXRlOiBCTiA9IHVuZGVmaW5lZFxuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQWRkVmFsaWRhdG9yUGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIG5vZGVJRCxcbiAgICAgIHN0YXJ0VGltZTogc3RhcnRUaW1lLmdldFRpbWUoKSAvIDEwMDAsXG4gICAgICBlbmRUaW1lOiBlbmRUaW1lLmdldFRpbWUoKSAvIDEwMDAsXG4gICAgICBzdGFrZUFtb3VudDogc3Rha2VBbW91bnQudG9TdHJpbmcoMTApLFxuICAgICAgcmV3YXJkQWRkcmVzc1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGRlbGVnYXRpb25GZWVSYXRlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuZGVsZWdhdGlvbkZlZVJhdGUgPSBkZWxlZ2F0aW9uRmVlUmF0ZS50b1N0cmluZygxMClcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmFkZFZhbGlkYXRvclwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgdmFsaWRhdG9yIHRvIGEgQWxseUNoYWluIG90aGVyIHRoYW4gdGhlIFByaW1hcnkgTmV0d29yay4gVGhlIHZhbGlkYXRvciBtdXN0IHZhbGlkYXRlIHRoZSBQcmltYXJ5IE5ldHdvcmsgZm9yIHRoZSBlbnRpcmUgZHVyYXRpb24gdGhleSB2YWxpZGF0ZSB0aGlzIEFsbHlDaGFpbi5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSB1c2VybmFtZSBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBub2RlSUQgVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvclxuICAgKiBAcGFyYW0gYWxseUNoYWluSUQgRWl0aGVyIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYSBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgQWxseUNoYWluSUQgb3IgaXRzIGFsaWFzLlxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIEphdmFzY3JpcHQgRGF0ZSBvYmplY3QgZm9yIHRoZSBzdGFydCB0aW1lIHRvIHZhbGlkYXRlXG4gICAqIEBwYXJhbSBlbmRUaW1lIEphdmFzY3JpcHQgRGF0ZSBvYmplY3QgZm9yIHRoZSBlbmQgdGltZSB0byB2YWxpZGF0ZVxuICAgKiBAcGFyYW0gd2VpZ2h0IFRoZSB2YWxpZGF0b3LigJlzIHdlaWdodCB1c2VkIGZvciBzYW1wbGluZ1xuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciB0aGUgdW5zaWduZWQgdHJhbnNhY3Rpb24uIEl0IG11c3QgYmUgc2lnbmVkICh1c2luZyBzaWduKSBieSB0aGUgcHJvcGVyIG51bWJlciBvZiB0aGUgQWxseUNoYWlu4oCZcyBjb250cm9sIGtleXMgYW5kIGJ5IHRoZSBrZXkgb2YgdGhlIGFjY291bnQgcGF5aW5nIHRoZSB0cmFuc2FjdGlvbiBmZWUgYmVmb3JlIGl0IGNhbiBiZSBpc3N1ZWQuXG4gICAqL1xuICBhZGRBbGx5Q2hhaW5WYWxpZGF0b3IgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIG5vZGVJRDogc3RyaW5nLFxuICAgIGFsbHlDaGFpbklEOiBCdWZmZXIgfCBzdHJpbmcsXG4gICAgc3RhcnRUaW1lOiBEYXRlLFxuICAgIGVuZFRpbWU6IERhdGUsXG4gICAgd2VpZ2h0OiBudW1iZXJcbiAgKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IGFueSA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBub2RlSUQsXG4gICAgICBzdGFydFRpbWU6IHN0YXJ0VGltZS5nZXRUaW1lKCkgLyAxMDAwLFxuICAgICAgZW5kVGltZTogZW5kVGltZS5nZXRUaW1lKCkgLyAxMDAwLFxuICAgICAgd2VpZ2h0XG4gICAgfVxuICAgIGlmICh0eXBlb2YgYWxseUNoYWluSUQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHBhcmFtcy5hbGx5Q2hhaW5JRCA9IGFsbHlDaGFpbklEXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYWxseUNoYWluSUQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHBhcmFtcy5hbGx5Q2hhaW5JRCA9IGJpbnRvb2xzLmNiNThFbmNvZGUoYWxseUNoYWluSUQpXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5hZGRBbGx5Q2hhaW5WYWxpZGF0b3JcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIG5vbWluYXRvciB0byB0aGUgUHJpbWFyeSBOZXR3b3JrLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICogQHBhcmFtIG5vZGVJRCBUaGUgbm9kZSBJRCBvZiB0aGUgZGVsZWdhdGVlXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgSmF2YXNjcmlwdCBEYXRlIG9iamVjdCBmb3Igd2hlbiB0aGUgbm9taW5hdG9yIHN0YXJ0cyBkZWxlZ2F0aW5nXG4gICAqIEBwYXJhbSBlbmRUaW1lIEphdmFzY3JpcHQgRGF0ZSBvYmplY3QgZm9yIHdoZW4gdGhlIG5vbWluYXRvciBzdGFydHMgZGVsZWdhdGluZ1xuICAgKiBAcGFyYW0gc3Rha2VBbW91bnQgVGhlIGFtb3VudCBvZiBuQVhDIHRoZSBub21pbmF0b3IgaXMgc3Rha2luZyBhc1xuICAgKiBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSByZXdhcmRBZGRyZXNzIFRoZSBhZGRyZXNzIG9mIHRoZSBhY2NvdW50IHRoZSBzdGFrZWQgQVhDIGFuZCB2YWxpZGF0aW9uIHJld2FyZFxuICAgKiAoaWYgYXBwbGljYWJsZSkgYXJlIHNlbnQgdG8gYXQgZW5kVGltZVxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBhcnJheSBvZiB2YWxpZGF0b3JcInMgc3Rha2luZ0lEcy5cbiAgICovXG4gIGFkZE5vbWluYXRvciA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgbm9kZUlEOiBzdHJpbmcsXG4gICAgc3RhcnRUaW1lOiBEYXRlLFxuICAgIGVuZFRpbWU6IERhdGUsXG4gICAgc3Rha2VBbW91bnQ6IEJOLFxuICAgIHJld2FyZEFkZHJlc3M6IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQWRkTm9taW5hdG9yUGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIG5vZGVJRCxcbiAgICAgIHN0YXJ0VGltZTogc3RhcnRUaW1lLmdldFRpbWUoKSAvIDEwMDAsXG4gICAgICBlbmRUaW1lOiBlbmRUaW1lLmdldFRpbWUoKSAvIDEwMDAsXG4gICAgICBzdGFrZUFtb3VudDogc3Rha2VBbW91bnQudG9TdHJpbmcoMTApLFxuICAgICAgcmV3YXJkQWRkcmVzc1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uYWRkTm9taW5hdG9yXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gdG8gY3JlYXRlIGEgbmV3IEFsbHlDaGFpbi4gVGhlIHVuc2lnbmVkIHRyYW5zYWN0aW9uIG11c3QgYmVcbiAgICogc2lnbmVkIHdpdGggdGhlIGtleSBvZiB0aGUgYWNjb3VudCBwYXlpbmcgdGhlIHRyYW5zYWN0aW9uIGZlZS4gVGhlIEFsbHlDaGFpbuKAmXMgSUQgaXMgdGhlIElEIG9mIHRoZSB0cmFuc2FjdGlvbiB0aGF0IGNyZWF0ZXMgaXQgKGllIHRoZSByZXNwb25zZSBmcm9tIGlzc3VlVHggd2hlbiBpc3N1aW5nIHRoZSBzaWduZWQgdHJhbnNhY3Rpb24pLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIEtleXN0b3JlIHVzZXJcbiAgICogQHBhcmFtIGNvbnRyb2xLZXlzIEFycmF5IG9mIHBsYXRmb3JtIGFkZHJlc3NlcyBhcyBzdHJpbmdzXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgVG8gYWRkIGEgdmFsaWRhdG9yIHRvIHRoaXMgQWxseUNoYWluLCBhIHRyYW5zYWN0aW9uIG11c3QgaGF2ZSB0aHJlc2hvbGRcbiAgICogc2lnbmF0dXJlcywgd2hlcmUgZWFjaCBzaWduYXR1cmUgaXMgZnJvbSBhIGtleSB3aG9zZSBhZGRyZXNzIGlzIGFuIGVsZW1lbnQgb2YgYGNvbnRyb2xLZXlzYFxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhIHN0cmluZyB3aXRoIHRoZSB1bnNpZ25lZCB0cmFuc2FjdGlvbiBlbmNvZGVkIGFzIGJhc2U1OC5cbiAgICovXG4gIGNyZWF0ZUFsbHlDaGFpbiA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgY29udHJvbEtleXM6IHN0cmluZ1tdLFxuICAgIHRocmVzaG9sZDogbnVtYmVyXG4gICk6IFByb21pc2U8c3RyaW5nIHwgRXJyb3JSZXNwb25zZU9iamVjdD4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQ3JlYXRlQWxseUNoYWluUGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIGNvbnRyb2xLZXlzLFxuICAgICAgdGhyZXNob2xkXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5jcmVhdGVBbGx5Q2hhaW5cIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBBbGx5Q2hhaW4gdGhhdCB2YWxpZGF0ZXMgYSBnaXZlbiBibG9ja2NoYWluLlxuICAgKlxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIEVpdGhlciBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9yIGEgY2I1OFxuICAgKiBlbmNvZGVkIHN0cmluZyBmb3IgdGhlIGJsb2NrY2hhaW5JRCBvciBpdHMgYWxpYXMuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIG9mIHRoZSBhbGx5Q2hhaW5JRCB0aGF0IHZhbGlkYXRlcyB0aGUgYmxvY2tjaGFpbi5cbiAgICovXG4gIHZhbGlkYXRlZEJ5ID0gYXN5bmMgKGJsb2NrY2hhaW5JRDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IGFueSA9IHtcbiAgICAgIGJsb2NrY2hhaW5JRFxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0udmFsaWRhdGVkQnlcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWxseUNoYWluSURcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIElEcyBvZiB0aGUgYmxvY2tjaGFpbnMgYSBBbGx5Q2hhaW4gdmFsaWRhdGVzLlxuICAgKlxuICAgKiBAcGFyYW0gYWxseUNoYWluSUQgRWl0aGVyIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb3IgYW4gQVhDXG4gICAqIHNlcmlhbGl6ZWQgc3RyaW5nIGZvciB0aGUgQWxseUNoYWluSUQgb3IgaXRzIGFsaWFzLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiBhcnJheSBvZiBibG9ja2NoYWluSURzIHRoZSBhbGx5Q2hhaW4gdmFsaWRhdGVzLlxuICAgKi9cbiAgdmFsaWRhdGVzID0gYXN5bmMgKGFsbHlDaGFpbklEOiBCdWZmZXIgfCBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBhbnkgPSB7XG4gICAgICBhbGx5Q2hhaW5JRFxuICAgIH1cbiAgICBpZiAodHlwZW9mIGFsbHlDaGFpbklEID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBwYXJhbXMuYWxseUNoYWluSUQgPSBhbGx5Q2hhaW5JRFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGFsbHlDaGFpbklEICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBwYXJhbXMuYWxseUNoYWluSUQgPSBiaW50b29scy5jYjU4RW5jb2RlKGFsbHlDaGFpbklEKVxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0udmFsaWRhdGVzXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmJsb2NrY2hhaW5JRHNcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIHRoZSBibG9ja2NoYWlucyB0aGF0IGV4aXN0IChleGNsdWRpbmcgdGhlIENvcmVDaGFpbikuXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGFuIGFycmF5IG9mIG9iamVjdHMgY29udGFpbmluZyBmaWVsZHMgXCJpZFwiLCBcImFsbHlDaGFpbklEXCIsIGFuZCBcInZtSURcIi5cbiAgICovXG4gIGdldEJsb2NrY2hhaW5zID0gYXN5bmMgKCk6IFByb21pc2U8QmxvY2tjaGFpbltdPiA9PiB7XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldEJsb2NrY2hhaW5zXCJcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LmJsb2NrY2hhaW5zXG4gIH1cblxuICAvKipcbiAgICogU2VuZCBBWEMgZnJvbSBhbiBhY2NvdW50IG9uIHRoZSBDb3JlQ2hhaW4gdG8gYW4gYWRkcmVzcyBvbiB0aGUgWC1DaGFpbi4gVGhpcyB0cmFuc2FjdGlvblxuICAgKiBtdXN0IGJlIHNpZ25lZCB3aXRoIHRoZSBrZXkgb2YgdGhlIGFjY291bnQgdGhhdCB0aGUgQVhDIGlzIHNlbnQgZnJvbSBhbmQgd2hpY2ggcGF5cyB0aGVcbiAgICogdHJhbnNhY3Rpb24gZmVlLiBBZnRlciBpc3N1aW5nIHRoaXMgdHJhbnNhY3Rpb24sIHlvdSBtdXN0IGNhbGwgdGhlIFgtQ2hhaW7igJlzIGltcG9ydEFYQ1xuICAgKiBtZXRob2QgdG8gY29tcGxldGUgdGhlIHRyYW5zZmVyLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIEtleXN0b3JlIHVzZXIgdGhhdCBjb250cm9scyB0aGUgYWNjb3VudCBzcGVjaWZpZWQgaW4gYHRvYFxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHBhc3N3b3JkIG9mIHRoZSBLZXlzdG9yZSB1c2VyXG4gICAqIEBwYXJhbSB0byBUaGUgYWRkcmVzcyBvbiB0aGUgWC1DaGFpbiB0byBzZW5kIHRoZSBBWEMgdG8uIERvIG5vdCBpbmNsdWRlIFgtIGluIHRoZSBhZGRyZXNzXG4gICAqIEBwYXJhbSBhbW91bnQgQW1vdW50IG9mIEFYQyB0byBleHBvcnQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIGZvciBhbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiB0byBiZSBzaWduZWQgYnkgdGhlIGFjY291bnQgdGhlIHRoZSBBWEMgaXNcbiAgICogc2VudCBmcm9tIGFuZCBwYXlzIHRoZSB0cmFuc2FjdGlvbiBmZWUuXG4gICAqL1xuICBleHBvcnRBWEMgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIGFtb3VudDogQk4sXG4gICAgdG86IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZyB8IEVycm9yUmVzcG9uc2VPYmplY3Q+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEV4cG9ydEFYQ1BhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICB0byxcbiAgICAgIGFtb3VudDogYW1vdW50LnRvU3RyaW5nKDEwKVxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZXhwb3J0QVhDXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgICAgID8gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICAgICAgOiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgQVhDIGZyb20gYW4gYWNjb3VudCBvbiB0aGUgQ29yZUNoYWluIHRvIGFuIGFkZHJlc3Mgb24gdGhlIFgtQ2hhaW4uIFRoaXMgdHJhbnNhY3Rpb25cbiAgICogbXVzdCBiZSBzaWduZWQgd2l0aCB0aGUga2V5IG9mIHRoZSBhY2NvdW50IHRoYXQgdGhlIEFYQyBpcyBzZW50IGZyb20gYW5kIHdoaWNoIHBheXNcbiAgICogdGhlIHRyYW5zYWN0aW9uIGZlZS4gQWZ0ZXIgaXNzdWluZyB0aGlzIHRyYW5zYWN0aW9uLCB5b3UgbXVzdCBjYWxsIHRoZSBYLUNoYWlu4oCZc1xuICAgKiBpbXBvcnRBWEMgbWV0aG9kIHRvIGNvbXBsZXRlIHRoZSB0cmFuc2Zlci5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIFRoZSBLZXlzdG9yZSB1c2VyIHRoYXQgY29udHJvbHMgdGhlIGFjY291bnQgc3BlY2lmaWVkIGluIGB0b2BcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCBvZiB0aGUgS2V5c3RvcmUgdXNlclxuICAgKiBAcGFyYW0gdG8gVGhlIElEIG9mIHRoZSBhY2NvdW50IHRoZSBBWEMgaXMgc2VudCB0by4gVGhpcyBtdXN0IGJlIHRoZSBzYW1lIGFzIHRoZSB0b1xuICAgKiBhcmd1bWVudCBpbiB0aGUgY29ycmVzcG9uZGluZyBjYWxsIHRvIHRoZSBYLUNoYWlu4oCZcyBleHBvcnRBWENcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIFRoZSBjaGFpbklEIHdoZXJlIHRoZSBmdW5kcyBhcmUgY29taW5nIGZyb20uXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgZm9yIGEgc3RyaW5nIGZvciB0aGUgdHJhbnNhY3Rpb24sIHdoaWNoIHNob3VsZCBiZSBzZW50IHRvIHRoZSBuZXR3b3JrXG4gICAqIGJ5IGNhbGxpbmcgaXNzdWVUeC5cbiAgICovXG4gIGltcG9ydEFYQyA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgdG86IHN0cmluZyxcbiAgICBzb3VyY2VDaGFpbjogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nIHwgRXJyb3JSZXNwb25zZU9iamVjdD4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogSW1wb3J0QVhDUGFyYW1zID0ge1xuICAgICAgdG8sXG4gICAgICBzb3VyY2VDaGFpbixcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmRcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmltcG9ydEFYQ1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC50eElEXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4SURcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyB0aGUgbm9kZSdzIGlzc3VlVHggbWV0aG9kIGZyb20gdGhlIEFQSSBhbmQgcmV0dXJucyB0aGUgcmVzdWx0aW5nIHRyYW5zYWN0aW9uIElEIGFzIGEgc3RyaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gdHggQSBzdHJpbmcsIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9LCBvciBbW1R4XV0gcmVwcmVzZW50aW5nIGEgdHJhbnNhY3Rpb25cbiAgICpcbiAgICogQHJldHVybnMgQSBQcm9taXNlIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIHRyYW5zYWN0aW9uIElEIG9mIHRoZSBwb3N0ZWQgdHJhbnNhY3Rpb24uXG4gICAqL1xuICBpc3N1ZVR4ID0gYXN5bmMgKHR4OiBzdHJpbmcgfCBCdWZmZXIgfCBUeCk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgbGV0IFRyYW5zYWN0aW9uID0gXCJcIlxuICAgIGlmICh0eXBlb2YgdHggPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIFRyYW5zYWN0aW9uID0gdHhcbiAgICB9IGVsc2UgaWYgKHR4IGluc3RhbmNlb2YgQnVmZmVyKSB7XG4gICAgICBjb25zdCB0eG9iajogVHggPSBuZXcgVHgoKVxuICAgICAgdHhvYmouZnJvbUJ1ZmZlcih0eClcbiAgICAgIFRyYW5zYWN0aW9uID0gdHhvYmoudG9TdHJpbmcoKVxuICAgIH0gZWxzZSBpZiAodHggaW5zdGFuY2VvZiBUeCkge1xuICAgICAgVHJhbnNhY3Rpb24gPSB0eC50b1N0cmluZygpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgVHJhbnNhY3Rpb25FcnJvcihcbiAgICAgICAgXCJFcnJvciAtIHBsYXRmb3JtLmlzc3VlVHg6IHByb3ZpZGVkIHR4IGlzIG5vdCBleHBlY3RlZCB0eXBlIG9mIHN0cmluZywgQnVmZmVyLCBvciBUeFwiXG4gICAgICApXG4gICAgfVxuICAgIGNvbnN0IHBhcmFtczogYW55ID0ge1xuICAgICAgdHg6IFRyYW5zYWN0aW9uLnRvU3RyaW5nKClcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmlzc3VlVHhcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudHhJRFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gdXBwZXIgYm91bmQgb24gdGhlIGFtb3VudCBvZiB0b2tlbnMgdGhhdCBleGlzdC4gTm90IG1vbm90b25pY2FsbHkgaW5jcmVhc2luZyBiZWNhdXNlIHRoaXMgbnVtYmVyIGNhbiBnbyBkb3duIGlmIGEgc3Rha2VyXCJzIHJld2FyZCBpcyBkZW5pZWQuXG4gICAqL1xuICBnZXRDdXJyZW50U3VwcGx5ID0gYXN5bmMgKCk6IFByb21pc2U8Qk4+ID0+IHtcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0Q3VycmVudFN1cHBseVwiXG4gICAgKVxuICAgIHJldHVybiBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VwcGx5LCAxMClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBoZWlnaHQgb2YgdGhlIHBsYXRmb3JtIGNoYWluLlxuICAgKi9cbiAgZ2V0SGVpZ2h0ID0gYXN5bmMgKCk6IFByb21pc2U8Qk4+ID0+IHtcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0SGVpZ2h0XCJcbiAgICApXG4gICAgcmV0dXJuIG5ldyBCTihyZXNwb25zZS5kYXRhLnJlc3VsdC5oZWlnaHQsIDEwKVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1pbmltdW0gc3Rha2luZyBhbW91bnQuXG4gICAqXG4gICAqIEBwYXJhbSByZWZyZXNoIEEgYm9vbGVhbiB0byBieXBhc3MgdGhlIGxvY2FsIGNhY2hlZCB2YWx1ZSBvZiBNaW5pbXVtIFN0YWtlIEFtb3VudCwgcG9sbGluZyB0aGUgbm9kZSBpbnN0ZWFkLlxuICAgKi9cbiAgZ2V0TWluU3Rha2UgPSBhc3luYyAoXG4gICAgcmVmcmVzaDogYm9vbGVhbiA9IGZhbHNlXG4gICk6IFByb21pc2U8R2V0TWluU3Rha2VSZXNwb25zZT4gPT4ge1xuICAgIGlmIChcbiAgICAgIHJlZnJlc2ggIT09IHRydWUgJiZcbiAgICAgIHR5cGVvZiB0aGlzLm1pblZhbGlkYXRvclN0YWtlICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICB0eXBlb2YgdGhpcy5taW5Ob21pbmF0b3JTdGFrZSAhPT0gXCJ1bmRlZmluZWRcIlxuICAgICkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbWluVmFsaWRhdG9yU3Rha2U6IHRoaXMubWluVmFsaWRhdG9yU3Rha2UsXG4gICAgICAgIG1pbk5vbWluYXRvclN0YWtlOiB0aGlzLm1pbk5vbWluYXRvclN0YWtlXG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRNaW5TdGFrZVwiXG4gICAgKVxuICAgIHRoaXMubWluVmFsaWRhdG9yU3Rha2UgPSBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQubWluVmFsaWRhdG9yU3Rha2UsIDEwKVxuICAgIHRoaXMubWluTm9taW5hdG9yU3Rha2UgPSBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQubWluTm9taW5hdG9yU3Rha2UsIDEwKVxuICAgIHJldHVybiB7XG4gICAgICBtaW5WYWxpZGF0b3JTdGFrZTogdGhpcy5taW5WYWxpZGF0b3JTdGFrZSxcbiAgICAgIG1pbk5vbWluYXRvclN0YWtlOiB0aGlzLm1pbk5vbWluYXRvclN0YWtlXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIGdldFRvdGFsU3Rha2UoKSByZXR1cm5zIHRoZSB0b3RhbCBhbW91bnQgc3Rha2VkIG9uIHRoZSBQcmltYXJ5IE5ldHdvcmtcbiAgICpcbiAgICogQHJldHVybnMgQSBiaWcgbnVtYmVyIHJlcHJlc2VudGluZyB0b3RhbCBzdGFrZWQgYnkgdmFsaWRhdG9ycyBvbiB0aGUgcHJpbWFyeSBuZXR3b3JrXG4gICAqL1xuICBnZXRUb3RhbFN0YWtlID0gYXN5bmMgKCk6IFByb21pc2U8Qk4+ID0+IHtcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0VG90YWxTdGFrZVwiXG4gICAgKVxuICAgIHJldHVybiBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQuc3Rha2UsIDEwKVxuICB9XG5cbiAgLyoqXG4gICAqIGdldE1heFN0YWtlQW1vdW50KCkgcmV0dXJucyB0aGUgbWF4aW11bSBhbW91bnQgb2YgbkFYQyBzdGFraW5nIHRvIHRoZSBuYW1lZCBub2RlIGR1cmluZyB0aGUgdGltZSBwZXJpb2QuXG4gICAqXG4gICAqIEBwYXJhbSBhbGx5Q2hhaW5JRCBBIEJ1ZmZlciBvciBjYjU4IHN0cmluZyByZXByZXNlbnRpbmcgYWxseUNoYWluXG4gICAqIEBwYXJhbSBub2RlSUQgQSBzdHJpbmcgcmVwcmVzZW50aW5nIElEIG9mIHRoZSBub2RlIHdob3NlIHN0YWtlIGFtb3VudCBpcyByZXF1aXJlZCBkdXJpbmcgdGhlIGdpdmVuIGR1cmF0aW9uXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgQSBiaWcgbnVtYmVyIGRlbm90aW5nIHN0YXJ0IHRpbWUgb2YgdGhlIGR1cmF0aW9uIGR1cmluZyB3aGljaCBzdGFrZSBhbW91bnQgb2YgdGhlIG5vZGUgaXMgcmVxdWlyZWQuXG4gICAqIEBwYXJhbSBlbmRUaW1lIEEgYmlnIG51bWJlciBkZW5vdGluZyBlbmQgdGltZSBvZiB0aGUgZHVyYXRpb24gZHVyaW5nIHdoaWNoIHN0YWtlIGFtb3VudCBvZiB0aGUgbm9kZSBpcyByZXF1aXJlZC5cbiAgICogQHJldHVybnMgQSBiaWcgbnVtYmVyIHJlcHJlc2VudGluZyB0b3RhbCBzdGFrZWQgYnkgdmFsaWRhdG9ycyBvbiB0aGUgcHJpbWFyeSBuZXR3b3JrXG4gICAqL1xuICBnZXRNYXhTdGFrZUFtb3VudCA9IGFzeW5jIChcbiAgICBhbGx5Q2hhaW5JRDogc3RyaW5nIHwgQnVmZmVyLFxuICAgIG5vZGVJRDogc3RyaW5nLFxuICAgIHN0YXJ0VGltZTogQk4sXG4gICAgZW5kVGltZTogQk5cbiAgKTogUHJvbWlzZTxCTj4gPT4ge1xuICAgIGNvbnN0IG5vdzogQk4gPSBVbml4Tm93KClcbiAgICBpZiAoc3RhcnRUaW1lLmd0KG5vdykgfHwgZW5kVGltZS5sdGUoc3RhcnRUaW1lKSkge1xuICAgICAgdGhyb3cgbmV3IFRpbWVFcnJvcihcbiAgICAgICAgXCJQbGF0Zm9ybVZNQVBJLmdldE1heFN0YWtlQW1vdW50IC0tIHN0YXJ0VGltZSBtdXN0IGJlIGluIHRoZSBwYXN0IGFuZCBlbmRUaW1lIG11c3QgY29tZSBhZnRlciBzdGFydFRpbWVcIlxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IHBhcmFtczogR2V0TWF4U3Rha2VBbW91bnRQYXJhbXMgPSB7XG4gICAgICBub2RlSUQsXG4gICAgICBzdGFydFRpbWUsXG4gICAgICBlbmRUaW1lXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBhbGx5Q2hhaW5JRCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgcGFyYW1zLmFsbHlDaGFpbklEID0gYWxseUNoYWluSURcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBhbGx5Q2hhaW5JRCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLmFsbHlDaGFpbklEID0gYmludG9vbHMuY2I1OEVuY29kZShhbGx5Q2hhaW5JRClcbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0TWF4U3Rha2VBbW91bnRcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gbmV3IEJOKHJlc3BvbnNlLmRhdGEucmVzdWx0LmFtb3VudCwgMTApXG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgbWluaW11bSBzdGFrZSBjYWNoZWQgaW4gdGhpcyBjbGFzcy5cbiAgICogQHBhcmFtIG1pblZhbGlkYXRvclN0YWtlIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gdG8gc2V0IHRoZSBtaW5pbXVtIHN0YWtlIGFtb3VudCBjYWNoZWQgaW4gdGhpcyBjbGFzcy5cbiAgICogQHBhcmFtIG1pbk5vbWluYXRvclN0YWtlIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gdG8gc2V0IHRoZSBtaW5pbXVtIGRlbGVnYXRpb24gYW1vdW50IGNhY2hlZCBpbiB0aGlzIGNsYXNzLlxuICAgKi9cbiAgc2V0TWluU3Rha2UgPSAoXG4gICAgbWluVmFsaWRhdG9yU3Rha2U6IEJOID0gdW5kZWZpbmVkLFxuICAgIG1pbk5vbWluYXRvclN0YWtlOiBCTiA9IHVuZGVmaW5lZFxuICApOiB2b2lkID0+IHtcbiAgICBpZiAodHlwZW9mIG1pblZhbGlkYXRvclN0YWtlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aGlzLm1pblZhbGlkYXRvclN0YWtlID0gbWluVmFsaWRhdG9yU3Rha2VcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBtaW5Ob21pbmF0b3JTdGFrZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhpcy5taW5Ob21pbmF0b3JTdGFrZSA9IG1pbk5vbWluYXRvclN0YWtlXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHRvdGFsIGFtb3VudCBzdGFrZWQgZm9yIGFuIGFycmF5IG9mIGFkZHJlc3Nlcy5cbiAgICovXG4gIGdldFN0YWtlID0gYXN5bmMgKFxuICAgIGFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgZW5jb2Rpbmc6IHN0cmluZyA9IFwiY2I1OFwiXG4gICk6IFByb21pc2U8R2V0U3Rha2VSZXNwb25zZT4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogR2V0U3Rha2VQYXJhbXMgPSB7XG4gICAgICBhZGRyZXNzZXMsXG4gICAgICBlbmNvZGluZ1xuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0U3Rha2VcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4ge1xuICAgICAgc3Rha2VkOiBuZXcgQk4ocmVzcG9uc2UuZGF0YS5yZXN1bHQuc3Rha2VkLCAxMCksXG4gICAgICBzdGFrZWRPdXRwdXRzOiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdGFrZWRPdXRwdXRzLm1hcChcbiAgICAgICAgKHN0YWtlZE91dHB1dDogc3RyaW5nKTogVHJhbnNmZXJhYmxlT3V0cHV0ID0+IHtcbiAgICAgICAgICBjb25zdCB0cmFuc2ZlcmFibGVPdXRwdXQ6IFRyYW5zZmVyYWJsZU91dHB1dCA9XG4gICAgICAgICAgICBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KClcbiAgICAgICAgICBsZXQgYnVmOiBCdWZmZXJcbiAgICAgICAgICBpZiAoZW5jb2RpbmcgPT09IFwiY2I1OFwiKSB7XG4gICAgICAgICAgICBidWYgPSBiaW50b29scy5jYjU4RGVjb2RlKHN0YWtlZE91dHB1dClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYnVmID0gQnVmZmVyLmZyb20oc3Rha2VkT3V0cHV0LnJlcGxhY2UoLzB4L2csIFwiXCIpLCBcImhleFwiKVxuICAgICAgICAgIH1cbiAgICAgICAgICB0cmFuc2ZlcmFibGVPdXRwdXQuZnJvbUJ1ZmZlcihidWYsIDIpXG4gICAgICAgICAgcmV0dXJuIHRyYW5zZmVyYWJsZU91dHB1dFxuICAgICAgICB9XG4gICAgICApXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgdGhlIGFsbHlDaGFpbnMgdGhhdCBleGlzdC5cbiAgICpcbiAgICogQHBhcmFtIGlkcyBJRHMgb2YgdGhlIGFsbHlDaGFpbnMgdG8gcmV0cmlldmUgaW5mb3JtYXRpb24gYWJvdXQuIElmIG9taXR0ZWQsIGdldHMgYWxsIGFsbHlDaGFpbnNcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYW4gYXJyYXkgb2Ygb2JqZWN0cyBjb250YWluaW5nIGZpZWxkcyBcImlkXCIsXG4gICAqIFwiY29udHJvbEtleXNcIiwgYW5kIFwidGhyZXNob2xkXCIuXG4gICAqL1xuICBnZXRBbGx5Q2hhaW5zID0gYXN5bmMgKGlkczogc3RyaW5nW10gPSB1bmRlZmluZWQpOiBQcm9taXNlPEFsbHlDaGFpbltdPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBhbnkgPSB7fVxuICAgIGlmICh0eXBlb2YgaWRzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHBhcmFtcy5pZHMgPSBpZHNcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldEFsbHlDaGFpbnNcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuYWxseUNoYWluc1xuICB9XG5cbiAgLyoqXG4gICAqIEV4cG9ydHMgdGhlIHByaXZhdGUga2V5IGZvciBhbiBhZGRyZXNzLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIG5hbWUgb2YgdGhlIHVzZXIgd2l0aCB0aGUgcHJpdmF0ZSBrZXlcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCB1c2VkIHRvIGRlY3J5cHQgdGhlIHByaXZhdGUga2V5XG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBhZGRyZXNzIHdob3NlIHByaXZhdGUga2V5IHNob3VsZCBiZSBleHBvcnRlZFxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9taXNlIHdpdGggdGhlIGRlY3J5cHRlZCBwcml2YXRlIGtleSBhcyBzdG9yZSBpbiB0aGUgZGF0YWJhc2VcbiAgICovXG4gIGV4cG9ydEtleSA9IGFzeW5jIChcbiAgICB1c2VybmFtZTogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmcsXG4gICAgYWRkcmVzczogc3RyaW5nXG4gICk6IFByb21pc2U8c3RyaW5nIHwgRXJyb3JSZXNwb25zZU9iamVjdD4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogRXhwb3J0S2V5UGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZCxcbiAgICAgIGFkZHJlc3NcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmV4cG9ydEtleVwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5wcml2YXRlS2V5XG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnByaXZhdGVLZXlcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlIGEgdXNlciBjb250cm9sIG92ZXIgYW4gYWRkcmVzcyBieSBwcm92aWRpbmcgdGhlIHByaXZhdGUga2V5IHRoYXQgY29udHJvbHMgdGhlIGFkZHJlc3MuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VybmFtZSBUaGUgbmFtZSBvZiB0aGUgdXNlciB0byBzdG9yZSB0aGUgcHJpdmF0ZSBrZXlcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoZSBwYXNzd29yZCB0aGF0IHVubG9ja3MgdGhlIHVzZXJcbiAgICogQHBhcmFtIHByaXZhdGVLZXkgQSBzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBwcml2YXRlIGtleSBpbiB0aGUgdm1cInMgZm9ybWF0XG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBhZGRyZXNzIGZvciB0aGUgaW1wb3J0ZWQgcHJpdmF0ZSBrZXkuXG4gICAqL1xuICBpbXBvcnRLZXkgPSBhc3luYyAoXG4gICAgdXNlcm5hbWU6IHN0cmluZyxcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIHByaXZhdGVLZXk6IHN0cmluZ1xuICApOiBQcm9taXNlPHN0cmluZyB8IEVycm9yUmVzcG9uc2VPYmplY3Q+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEltcG9ydEtleVBhcmFtcyA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmQsXG4gICAgICBwcml2YXRlS2V5XG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5pbXBvcnRLZXlcIixcbiAgICAgIHBhcmFtc1xuICAgIClcblxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5hZGRyZXNzXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LmFkZHJlc3NcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB0cmVhbnNhY3Rpb24gZGF0YSBvZiBhIHByb3ZpZGVkIHRyYW5zYWN0aW9uIElEIGJ5IGNhbGxpbmcgdGhlIG5vZGUncyBgZ2V0VHhgIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIHR4SUQgVGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJhbnNhY3Rpb24gSURcbiAgICogQHBhcmFtIGVuY29kaW5nIHNldHMgdGhlIGZvcm1hdCBvZiB0aGUgcmV0dXJuZWQgdHJhbnNhY3Rpb24uIENhbiBiZSwgXCJjYjU4XCIsIFwiaGV4XCIgb3IgXCJqc29uXCIuIERlZmF1bHRzIHRvIFwiY2I1OFwiLlxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgb3Igb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGJ5dGVzIHJldHJpZXZlZCBmcm9tIHRoZSBub2RlXG4gICAqL1xuICBnZXRUeCA9IGFzeW5jIChcbiAgICB0eElEOiBzdHJpbmcsXG4gICAgZW5jb2Rpbmc6IHN0cmluZyA9IFwiY2I1OFwiXG4gICk6IFByb21pc2U8c3RyaW5nIHwgb2JqZWN0PiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBhbnkgPSB7XG4gICAgICB0eElELFxuICAgICAgZW5jb2RpbmdcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcInBsYXRmb3JtLmdldFR4XCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4XG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnR4XG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgc3RhdHVzIG9mIGEgcHJvdmlkZWQgdHJhbnNhY3Rpb24gSUQgYnkgY2FsbGluZyB0aGUgbm9kZSdzIGBnZXRUeFN0YXR1c2AgbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gdHhpZCBUaGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB0cmFuc2FjdGlvbiBJRFxuICAgKiBAcGFyYW0gaW5jbHVkZVJlYXNvbiBSZXR1cm4gdGhlIHJlYXNvbiB0eCB3YXMgZHJvcHBlZCwgaWYgYXBwbGljYWJsZS4gRGVmYXVsdHMgdG8gdHJ1ZVxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBzdHJpbmcgY29udGFpbmluZyB0aGUgc3RhdHVzIHJldHJpZXZlZCBmcm9tIHRoZSBub2RlIGFuZCB0aGUgcmVhc29uIGEgdHggd2FzIGRyb3BwZWQsIGlmIGFwcGxpY2FibGUuXG4gICAqL1xuICBnZXRUeFN0YXR1cyA9IGFzeW5jIChcbiAgICB0eGlkOiBzdHJpbmcsXG4gICAgaW5jbHVkZVJlYXNvbjogYm9vbGVhbiA9IHRydWVcbiAgKTogUHJvbWlzZTxzdHJpbmcgfCBHZXRUeFN0YXR1c1Jlc3BvbnNlPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBHZXRUeFN0YXR1c1BhcmFtcyA9IHtcbiAgICAgIHR4SUQ6IHR4aWQsXG4gICAgICBpbmNsdWRlUmVhc29uOiBpbmNsdWRlUmVhc29uXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRUeFN0YXR1c1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgVVRYT3MgcmVsYXRlZCB0byB0aGUgYWRkcmVzc2VzIHByb3ZpZGVkIGZyb20gdGhlIG5vZGUncyBgZ2V0VVRYT3NgIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMgY2I1OCBzdHJpbmdzIG9yIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfXNcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIEEgc3RyaW5nIGZvciB0aGUgY2hhaW4gdG8gbG9vayBmb3IgdGhlIFVUWE9cInMuIERlZmF1bHQgaXMgdG8gdXNlIHRoaXMgY2hhaW4sIGJ1dCBpZiBleHBvcnRlZCBVVFhPcyBleGlzdCBmcm9tIG90aGVyIGNoYWlucywgdGhpcyBjYW4gdXNlZCB0byBwdWxsIHRoZW0gaW5zdGVhZC5cbiAgICogQHBhcmFtIGxpbWl0IE9wdGlvbmFsLiBSZXR1cm5zIGF0IG1vc3QgW2xpbWl0XSBhZGRyZXNzZXMuIElmIFtsaW1pdF0gPT0gMCBvciA+IFttYXhVVFhPc1RvRmV0Y2hdLCBmZXRjaGVzIHVwIHRvIFttYXhVVFhPc1RvRmV0Y2hdLlxuICAgKiBAcGFyYW0gc3RhcnRJbmRleCBPcHRpb25hbC4gW1N0YXJ0SW5kZXhdIGRlZmluZXMgd2hlcmUgdG8gc3RhcnQgZmV0Y2hpbmcgVVRYT3MgKGZvciBwYWdpbmF0aW9uLilcbiAgICogVVRYT3MgZmV0Y2hlZCBhcmUgZnJvbSBhZGRyZXNzZXMgZXF1YWwgdG8gb3IgZ3JlYXRlciB0aGFuIFtTdGFydEluZGV4LkFkZHJlc3NdXG4gICAqIEZvciBhZGRyZXNzIFtTdGFydEluZGV4LkFkZHJlc3NdLCBvbmx5IFVUWE9zIHdpdGggSURzIGdyZWF0ZXIgdGhhbiBbU3RhcnRJbmRleC5VdHhvXSB3aWxsIGJlIHJldHVybmVkLlxuICAgKiBAcGFyYW0gcGVyc2lzdE9wdHMgT3B0aW9ucyBhdmFpbGFibGUgdG8gcGVyc2lzdCB0aGVzZSBVVFhPcyBpbiBsb2NhbCBzdG9yYWdlXG4gICAqIEBwYXJhbSBlbmNvZGluZyBPcHRpb25hbC4gIGlzIHRoZSBlbmNvZGluZyBmb3JtYXQgdG8gdXNlIGZvciB0aGUgcGF5bG9hZCBhcmd1bWVudC4gQ2FuIGJlIGVpdGhlciBcImNiNThcIiBvciBcImhleFwiLiBEZWZhdWx0cyB0byBcImhleFwiLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBwZXJzaXN0T3B0cyBpcyBvcHRpb25hbCBhbmQgbXVzdCBiZSBvZiB0eXBlIFtbUGVyc2lzdGFuY2VPcHRpb25zXV1cbiAgICpcbiAgICovXG4gIGdldFVUWE9zID0gYXN5bmMgKFxuICAgIGFkZHJlc3Nlczogc3RyaW5nW10gfCBzdHJpbmcsXG4gICAgc291cmNlQ2hhaW46IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBsaW1pdDogbnVtYmVyID0gMCxcbiAgICBzdGFydEluZGV4OiB7IGFkZHJlc3M6IHN0cmluZzsgdXR4bzogc3RyaW5nIH0gPSB1bmRlZmluZWQsXG4gICAgcGVyc2lzdE9wdHM6IFBlcnNpc3RhbmNlT3B0aW9ucyA9IHVuZGVmaW5lZCxcbiAgICBlbmNvZGluZzogc3RyaW5nID0gXCJjYjU4XCJcbiAgKTogUHJvbWlzZTxHZXRVVFhPc1Jlc3BvbnNlPiA9PiB7XG4gICAgaWYgKHR5cGVvZiBhZGRyZXNzZXMgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGFkZHJlc3NlcyA9IFthZGRyZXNzZXNdXG4gICAgfVxuXG4gICAgY29uc3QgcGFyYW1zOiBHZXRVVFhPc1BhcmFtcyA9IHtcbiAgICAgIGFkZHJlc3NlczogYWRkcmVzc2VzLFxuICAgICAgbGltaXQsXG4gICAgICBlbmNvZGluZ1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHN0YXJ0SW5kZXggIT09IFwidW5kZWZpbmVkXCIgJiYgc3RhcnRJbmRleCkge1xuICAgICAgcGFyYW1zLnN0YXJ0SW5kZXggPSBzdGFydEluZGV4XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBzb3VyY2VDaGFpbiAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcGFyYW1zLnNvdXJjZUNoYWluID0gc291cmNlQ2hhaW5cbiAgICB9XG5cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwicGxhdGZvcm0uZ2V0VVRYT3NcIixcbiAgICAgIHBhcmFtc1xuICAgIClcblxuICAgIGNvbnN0IHV0eG9zOiBVVFhPU2V0ID0gbmV3IFVUWE9TZXQoKVxuICAgIGxldCBkYXRhID0gcmVzcG9uc2UuZGF0YS5yZXN1bHQudXR4b3NcbiAgICBpZiAocGVyc2lzdE9wdHMgJiYgdHlwZW9mIHBlcnNpc3RPcHRzID09PSBcIm9iamVjdFwiKSB7XG4gICAgICBpZiAodGhpcy5kYi5oYXMocGVyc2lzdE9wdHMuZ2V0TmFtZSgpKSkge1xuICAgICAgICBjb25zdCBzZWxmQXJyYXk6IHN0cmluZ1tdID0gdGhpcy5kYi5nZXQocGVyc2lzdE9wdHMuZ2V0TmFtZSgpKVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzZWxmQXJyYXkpKSB7XG4gICAgICAgICAgdXR4b3MuYWRkQXJyYXkoZGF0YSlcbiAgICAgICAgICBjb25zdCBzZWxmOiBVVFhPU2V0ID0gbmV3IFVUWE9TZXQoKVxuICAgICAgICAgIHNlbGYuYWRkQXJyYXkoc2VsZkFycmF5KVxuICAgICAgICAgIHNlbGYubWVyZ2VCeVJ1bGUodXR4b3MsIHBlcnNpc3RPcHRzLmdldE1lcmdlUnVsZSgpKVxuICAgICAgICAgIGRhdGEgPSBzZWxmLmdldEFsbFVUWE9TdHJpbmdzKClcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5kYi5zZXQocGVyc2lzdE9wdHMuZ2V0TmFtZSgpLCBkYXRhLCBwZXJzaXN0T3B0cy5nZXRPdmVyd3JpdGUoKSlcbiAgICB9XG4gICAgdXR4b3MuYWRkQXJyYXkoZGF0YSwgZmFsc2UpXG4gICAgcmVzcG9uc2UuZGF0YS5yZXN1bHQudXR4b3MgPSB1dHhvc1xuICAgIHJlc3BvbnNlLmRhdGEucmVzdWx0Lm51bUZldGNoZWQgPSBwYXJzZUludChyZXNwb25zZS5kYXRhLnJlc3VsdC5udW1GZXRjaGVkKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIEltcG9ydCBUeC4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gb3duZXJBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIGltcG9ydFxuICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gVGhlIGNoYWluaWQgZm9yIHdoZXJlIHRoZSBpbXBvcnQgaXMgY29taW5nIGZyb20uXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyBwcm92aWRlZFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhIFtbSW1wb3J0VHhdXS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogVGhpcyBoZWxwZXIgZXhpc3RzIGJlY2F1c2UgdGhlIGVuZHBvaW50IEFQSSBzaG91bGQgYmUgdGhlIHByaW1hcnkgcG9pbnQgb2YgZW50cnkgZm9yIG1vc3QgZnVuY3Rpb25hbGl0eS5cbiAgICovXG4gIGJ1aWxkSW1wb3J0VHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBvd25lckFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgc291cmNlQ2hhaW46IEJ1ZmZlciB8IHN0cmluZyxcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcbiAgICBsb2NrdGltZTogQk4gPSBuZXcgQk4oMCksXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IHRvOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgICAgdG9BZGRyZXNzZXMsXG4gICAgICBcImJ1aWxkQmFzZVR4XCJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgICAgZnJvbUFkZHJlc3NlcyxcbiAgICAgIFwiYnVpbGRCYXNlVHhcIlxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuICAgIGNvbnN0IGNoYW5nZTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyxcbiAgICAgIFwiYnVpbGRCYXNlVHhcIlxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuXG4gICAgbGV0IHNyYXBwQ2hhaW46IHN0cmluZyA9IHVuZGVmaW5lZFxuXG4gICAgaWYgKHR5cGVvZiBzb3VyY2VDaGFpbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgdGhyb3cgbmV3IENoYWluSWRFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIFBsYXRmb3JtVk1BUEkuYnVpbGRJbXBvcnRUeDogU291cmNlIENoYWluSUQgaXMgdW5kZWZpbmVkLlwiXG4gICAgICApXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc291cmNlQ2hhaW4gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHNyYXBwQ2hhaW4gPSBzb3VyY2VDaGFpblxuICAgICAgc291cmNlQ2hhaW4gPSBiaW50b29scy5jYjU4RGVjb2RlKHNvdXJjZUNoYWluKVxuICAgIH0gZWxzZSBpZiAoIShzb3VyY2VDaGFpbiBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBQbGF0Zm9ybVZNQVBJLmJ1aWxkSW1wb3J0VHg6IEludmFsaWQgZGVzdGluYXRpb25DaGFpbiB0eXBlOiBcIiArXG4gICAgICAgICAgdHlwZW9mIHNvdXJjZUNoYWluXG4gICAgICApXG4gICAgfVxuICAgIGNvbnN0IGF0b21pY1VUWE9zOiBVVFhPU2V0ID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy5nZXRVVFhPcyhvd25lckFkZHJlc3Nlcywgc3JhcHBDaGFpbiwgMCwgdW5kZWZpbmVkKVxuICAgICkudXR4b3NcbiAgICBjb25zdCBheGNBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFYQ0Fzc2V0SUQoKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgYXRvbWljczogVVRYT1tdID0gYXRvbWljVVRYT3MuZ2V0QWxsVVRYT3MoKVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZEltcG9ydFR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICB0byxcbiAgICAgIGZyb20sXG4gICAgICBjaGFuZ2UsXG4gICAgICBhdG9taWNzLFxuICAgICAgc291cmNlQ2hhaW4sXG4gICAgICB0aGlzLmdldFR4RmVlKCksXG4gICAgICBheGNBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2YsXG4gICAgICBsb2NrdGltZSxcbiAgICAgIHRocmVzaG9sZFxuICAgIClcblxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIEV4cG9ydCBUeC4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgYmVpbmcgZXhwb3J0ZWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gZGVzdGluYXRpb25DaGFpbiBUaGUgY2hhaW5pZCBmb3Igd2hlcmUgdGhlIGFzc2V0cyB3aWxsIGJlIHNlbnQuXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyBwcm92aWRlZFxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gKFtbVW5zaWduZWRUeF1dKSB3aGljaCBjb250YWlucyBhbiBbW0V4cG9ydFR4XV0uXG4gICAqL1xuICBidWlsZEV4cG9ydFR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgYW1vdW50OiBCTixcbiAgICBkZXN0aW5hdGlvbkNoYWluOiBCdWZmZXIgfCBzdHJpbmcsXG4gICAgdG9BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGZyb21BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10gPSB1bmRlZmluZWQsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICAgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApLFxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBsZXQgcHJlZml4ZXM6IG9iamVjdCA9IHt9XG4gICAgdG9BZGRyZXNzZXMubWFwKChhOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgICAgIHByZWZpeGVzW2Euc3BsaXQoXCItXCIpWzBdXSA9IHRydWVcbiAgICB9KVxuICAgIGlmIChPYmplY3Qua2V5cyhwcmVmaXhlcykubGVuZ3RoICE9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEV4cG9ydFR4OiBUbyBhZGRyZXNzZXMgbXVzdCBoYXZlIHRoZSBzYW1lIGNoYWluSUQgcHJlZml4LlwiXG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aHJvdyBuZXcgQ2hhaW5JZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEV4cG9ydFR4OiBEZXN0aW5hdGlvbiBDaGFpbklEIGlzIHVuZGVmaW5lZC5cIlxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlc3RpbmF0aW9uQ2hhaW4gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGRlc3RpbmF0aW9uQ2hhaW4gPSBiaW50b29scy5jYjU4RGVjb2RlKGRlc3RpbmF0aW9uQ2hhaW4pIC8vXG4gICAgfSBlbHNlIGlmICghKGRlc3RpbmF0aW9uQ2hhaW4gaW5zdGFuY2VvZiBCdWZmZXIpKSB7XG4gICAgICB0aHJvdyBuZXcgQ2hhaW5JZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gUGxhdGZvcm1WTUFQSS5idWlsZEV4cG9ydFR4OiBJbnZhbGlkIGRlc3RpbmF0aW9uQ2hhaW4gdHlwZTogXCIgK1xuICAgICAgICAgIHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluXG4gICAgICApXG4gICAgfVxuICAgIGlmIChkZXN0aW5hdGlvbkNoYWluLmxlbmd0aCAhPT0gMzIpIHtcbiAgICAgIHRocm93IG5ldyBDaGFpbklkRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBQbGF0Zm9ybVZNQVBJLmJ1aWxkRXhwb3J0VHg6IERlc3RpbmF0aW9uIENoYWluSUQgbXVzdCBiZSAzMiBieXRlcyBpbiBsZW5ndGguXCJcbiAgICAgIClcbiAgICB9XG4gICAgLypcbiAgICBpZihiaW50b29scy5jYjU4RW5jb2RlKGRlc3RpbmF0aW9uQ2hhaW4pICE9PSBEZWZhdWx0cy5uZXR3b3JrW3RoaXMuY29yZS5nZXROZXR3b3JrSUQoKV0uWFtcImJsb2NrY2hhaW5JRFwiXSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgLSBQbGF0Zm9ybVZNQVBJLmJ1aWxkRXhwb3J0VHg6IERlc3RpbmF0aW9uIENoYWluSUQgbXVzdCBUaGUgWC1DaGFpbiBJRCBpbiB0aGUgY3VycmVudCB2ZXJzaW9uIG9mIEF4aWFKUy5cIilcbiAgICB9Ki9cblxuICAgIGxldCB0bzogQnVmZmVyW10gPSBbXVxuICAgIHRvQWRkcmVzc2VzLm1hcCgoYTogc3RyaW5nKTogdm9pZCA9PiB7XG4gICAgICB0by5wdXNoKGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcbiAgICB9KVxuICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXG4gICAgICBmcm9tQWRkcmVzc2VzLFxuICAgICAgXCJidWlsZEV4cG9ydFR4XCJcbiAgICApLm1hcCgoYSk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgXCJidWlsZEV4cG9ydFR4XCJcbiAgICApLm1hcCgoYSk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXG5cbiAgICBpZiAobWVtbyBpbnN0YW5jZW9mIFBheWxvYWRCYXNlKSB7XG4gICAgICBtZW1vID0gbWVtby5nZXRQYXlsb2FkKClcbiAgICB9XG5cbiAgICBjb25zdCBheGNBc3NldElEOiBCdWZmZXIgPSBhd2FpdCB0aGlzLmdldEFYQ0Fzc2V0SUQoKVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZEV4cG9ydFR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICBhbW91bnQsXG4gICAgICBheGNBc3NldElELFxuICAgICAgdG8sXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgZGVzdGluYXRpb25DaGFpbixcbiAgICAgIHRoaXMuZ2V0VHhGZWUoKSxcbiAgICAgIGF4Y0Fzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZixcbiAgICAgIGxvY2t0aW1lLFxuICAgICAgdGhyZXNob2xkXG4gICAgKVxuXG4gICAgaWYgKCEoYXdhaXQgdGhpcy5jaGVja0dvb3NlRWdnKGJ1aWx0VW5zaWduZWRUeCkpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEdvb3NlRWdnQ2hlY2tFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgW1tBZGRBbGx5Q2hhaW5WYWxpZGF0b3JUeF1dLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSBhbmQgaW1wb3J0IHRoZSBbW0FkZEFsbHlDaGFpblZhbGlkYXRvclR4XV0gY2xhc3MgZGlyZWN0bHkuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uLlxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIHBheXMgdGhlIGZlZXMgaW4gQVhDXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBnZXRzIHRoZSBjaGFuZ2UgbGVmdG92ZXIgZnJvbSB0aGUgZmVlIHBheW1lbnRcbiAgICogQHBhcmFtIG5vZGVJRCBUaGUgbm9kZSBJRCBvZiB0aGUgdmFsaWRhdG9yIGJlaW5nIGFkZGVkLlxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIFRoZSBVbml4IHRpbWUgd2hlbiB0aGUgdmFsaWRhdG9yIHN0YXJ0cyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsuXG4gICAqIEBwYXJhbSBlbmRUaW1lIFRoZSBVbml4IHRpbWUgd2hlbiB0aGUgdmFsaWRhdG9yIHN0b3BzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yayAoYW5kIHN0YWtlZCBBWEMgaXMgcmV0dXJuZWQpLlxuICAgKiBAcGFyYW0gd2VpZ2h0IFRoZSBhbW91bnQgb2Ygd2VpZ2h0IGZvciB0aGlzIGFsbHlDaGFpbiB2YWxpZGF0b3IuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBhbGx5Q2hhaW5BdXRoQ3JlZGVudGlhbHMgT3B0aW9uYWwuIEFuIGFycmF5IG9mIGluZGV4IGFuZCBhZGRyZXNzIHRvIHNpZ24gZm9yIGVhY2ggQWxseUNoYWluQXV0aC5cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG5cbiAgYnVpbGRBZGRBbGx5Q2hhaW5WYWxpZGF0b3JUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIGZyb21BZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGNoYW5nZUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgbm9kZUlEOiBzdHJpbmcsXG4gICAgc3RhcnRUaW1lOiBCTixcbiAgICBlbmRUaW1lOiBCTixcbiAgICB3ZWlnaHQ6IEJOLFxuICAgIGFsbHlDaGFpbklEOiBzdHJpbmcsXG4gICAgbWVtbzogUGF5bG9hZEJhc2UgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICAgYWxseUNoYWluQXV0aENyZWRlbnRpYWxzOiBbbnVtYmVyLCBCdWZmZXJdW10gPSBbXVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgICAgZnJvbUFkZHJlc3NlcyxcbiAgICAgIFwiYnVpbGRBZGRBbGx5Q2hhaW5WYWxpZGF0b3JUeFwiXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgXCJidWlsZEFkZEFsbHlDaGFpblZhbGlkYXRvclR4XCJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGNvbnN0IGF4Y0Fzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVhDQXNzZXRJRCgpXG5cbiAgICBjb25zdCBub3c6IEJOID0gVW5peE5vdygpXG4gICAgaWYgKHN0YXJ0VGltZS5sdChub3cpIHx8IGVuZFRpbWUubHRlKHN0YXJ0VGltZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJQbGF0Zm9ybVZNQVBJLmJ1aWxkQWRkQWxseUNoYWluVmFsaWRhdG9yVHggLS0gc3RhcnRUaW1lIG11c3QgYmUgaW4gdGhlIGZ1dHVyZSBhbmQgZW5kVGltZSBtdXN0IGNvbWUgYWZ0ZXIgc3RhcnRUaW1lXCJcbiAgICAgIClcbiAgICB9XG5cbiAgICBjb25zdCBidWlsdFVuc2lnbmVkVHg6IFVuc2lnbmVkVHggPSB1dHhvc2V0LmJ1aWxkQWRkQWxseUNoYWluVmFsaWRhdG9yVHgoXG4gICAgICB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKCksXG4gICAgICBiaW50b29scy5jYjU4RGVjb2RlKHRoaXMuYmxvY2tjaGFpbklEKSxcbiAgICAgIGZyb20sXG4gICAgICBjaGFuZ2UsXG4gICAgICBOb2RlSURTdHJpbmdUb0J1ZmZlcihub2RlSUQpLFxuICAgICAgc3RhcnRUaW1lLFxuICAgICAgZW5kVGltZSxcbiAgICAgIHdlaWdodCxcbiAgICAgIGFsbHlDaGFpbklELFxuICAgICAgdGhpcy5nZXREZWZhdWx0VHhGZWUoKSxcbiAgICAgIGF4Y0Fzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZixcbiAgICAgIGFsbHlDaGFpbkF1dGhDcmVkZW50aWFsc1xuICAgIClcblxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCBHb29zZSBFZ2cgQ2hlY2tcIilcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbHRVbnNpZ25lZFR4XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHdoaWNoIGNyZWF0ZXMgYW4gdW5zaWduZWQgW1tBZGROb21pbmF0b3JUeF1dLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSBtYW51YWxseSBhbmQgaW1wb3J0IHRoZSBbW0FkZE5vbWluYXRvclR4XV0gY2xhc3MgZGlyZWN0bHkuXG4gICAqXG4gICAqIEBwYXJhbSB1dHhvc2V0IEEgc2V0IG9mIFVUWE9zIHRoYXQgdGhlIHRyYW5zYWN0aW9uIGlzIGJ1aWx0IG9uXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIHJlY2VpdmVkIHRoZSBzdGFrZWQgdG9rZW5zIGF0IHRoZSBlbmQgb2YgdGhlIHN0YWtpbmcgcGVyaW9kXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gb3duIHRoZSBzdGFraW5nIFVUWE9zIHRoZSBmZWVzIGluIEFYQ1xuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gZ2V0cyB0aGUgY2hhbmdlIGxlZnRvdmVyIGZyb20gdGhlIGZlZSBwYXltZW50XG4gICAqIEBwYXJhbSBub2RlSUQgVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvciBiZWluZyBhZGRlZC5cbiAgICogQHBhcmFtIHN0YXJ0VGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdGFydHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrLlxuICAgKiBAcGFyYW0gZW5kVGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgQVhDIGlzIHJldHVybmVkKS5cbiAgICogQHBhcmFtIHN0YWtlQW1vdW50IFRoZSBhbW91bnQgYmVpbmcgZGVsZWdhdGVkIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIHJld2FyZEFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHdoaWNoIHdpbGwgcmVjaWV2ZSB0aGUgcmV3YXJkcyBmcm9tIHRoZSBkZWxlZ2F0ZWQgc3Rha2UuXG4gICAqIEBwYXJhbSByZXdhcmRMb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyByZXdhcmQgb3V0cHV0c1xuICAgKiBAcGFyYW0gcmV3YXJkVGhyZXNob2xkIE9waW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCByZXdhcmQgVVRYTy4gRGVmYXVsdCAxLlxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKi9cbiAgYnVpbGRBZGROb21pbmF0b3JUeCA9IGFzeW5jIChcbiAgICB1dHhvc2V0OiBVVFhPU2V0LFxuICAgIHRvQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBmcm9tQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIG5vZGVJRDogc3RyaW5nLFxuICAgIHN0YXJ0VGltZTogQk4sXG4gICAgZW5kVGltZTogQk4sXG4gICAgc3Rha2VBbW91bnQ6IEJOLFxuICAgIHJld2FyZEFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgcmV3YXJkTG9ja3RpbWU6IEJOID0gbmV3IEJOKDApLFxuICAgIHJld2FyZFRocmVzaG9sZDogbnVtYmVyID0gMSxcbiAgICBtZW1vOiBQYXlsb2FkQmFzZSB8IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKVxuICApOiBQcm9taXNlPFVuc2lnbmVkVHg+ID0+IHtcbiAgICBjb25zdCB0bzogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcbiAgICAgIHRvQWRkcmVzc2VzLFxuICAgICAgXCJidWlsZEFkZE5vbWluYXRvclR4XCJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcbiAgICBjb25zdCBmcm9tOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgICAgZnJvbUFkZHJlc3NlcyxcbiAgICAgIFwiYnVpbGRBZGROb21pbmF0b3JUeFwiXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgXCJidWlsZEFkZE5vbWluYXRvclR4XCJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcbiAgICBjb25zdCByZXdhcmRzOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgICAgcmV3YXJkQWRkcmVzc2VzLFxuICAgICAgXCJidWlsZEFkZFZhbGlkYXRvclR4XCJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGNvbnN0IG1pblN0YWtlOiBCTiA9IChhd2FpdCB0aGlzLmdldE1pblN0YWtlKCkpW1wibWluTm9taW5hdG9yU3Rha2VcIl1cbiAgICBpZiAoc3Rha2VBbW91bnQubHQobWluU3Rha2UpKSB7XG4gICAgICB0aHJvdyBuZXcgU3Rha2VFcnJvcihcbiAgICAgICAgXCJQbGF0Zm9ybVZNQVBJLmJ1aWxkQWRkTm9taW5hdG9yVHggLS0gc3Rha2UgYW1vdW50IG11c3QgYmUgYXQgbGVhc3QgXCIgK1xuICAgICAgICAgIG1pblN0YWtlLnRvU3RyaW5nKDEwKVxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IGF4Y0Fzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVhDQXNzZXRJRCgpXG5cbiAgICBjb25zdCBub3c6IEJOID0gVW5peE5vdygpXG4gICAgaWYgKHN0YXJ0VGltZS5sdChub3cpIHx8IGVuZFRpbWUubHRlKHN0YXJ0VGltZSkpIHtcbiAgICAgIHRocm93IG5ldyBUaW1lRXJyb3IoXG4gICAgICAgIFwiUGxhdGZvcm1WTUFQSS5idWlsZEFkZE5vbWluYXRvclR4IC0tIHN0YXJ0VGltZSBtdXN0IGJlIGluIHRoZSBmdXR1cmUgYW5kIGVuZFRpbWUgbXVzdCBjb21lIGFmdGVyIHN0YXJ0VGltZVwiXG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZEFkZE5vbWluYXRvclR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICBheGNBc3NldElELFxuICAgICAgdG8sXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgTm9kZUlEU3RyaW5nVG9CdWZmZXIobm9kZUlEKSxcbiAgICAgIHN0YXJ0VGltZSxcbiAgICAgIGVuZFRpbWUsXG4gICAgICBzdGFrZUFtb3VudCxcbiAgICAgIHJld2FyZExvY2t0aW1lLFxuICAgICAgcmV3YXJkVGhyZXNob2xkLFxuICAgICAgcmV3YXJkcyxcbiAgICAgIG5ldyBCTigwKSxcbiAgICAgIGF4Y0Fzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZlxuICAgIClcblxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgpKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBHb29zZUVnZ0NoZWNrRXJyb3IoXCJGYWlsZWQgR29vc2UgRWdnIENoZWNrXCIpXG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWx0VW5zaWduZWRUeFxuICB9XG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB3aGljaCBjcmVhdGVzIGFuIHVuc2lnbmVkIFtbQWRkVmFsaWRhdG9yVHhdXS4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tVbnNpZ25lZFR4XV0gbWFudWFsbHkgYW5kIGltcG9ydCB0aGUgW1tBZGRWYWxpZGF0b3JUeF1dIGNsYXNzIGRpcmVjdGx5LlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyByZWNlaXZlZCB0aGUgc3Rha2VkIHRva2VucyBhdCB0aGUgZW5kIG9mIHRoZSBzdGFraW5nIHBlcmlvZFxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIG93biB0aGUgc3Rha2luZyBVVFhPcyB0aGUgZmVlcyBpbiBBWENcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIGdldHMgdGhlIGNoYW5nZSBsZWZ0b3ZlciBmcm9tIHRoZSBmZWUgcGF5bWVudFxuICAgKiBAcGFyYW0gbm9kZUlEIFRoZSBub2RlIElEIG9mIHRoZSB2YWxpZGF0b3IgYmVpbmcgYWRkZWQuXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RhcnRzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yay5cbiAgICogQHBhcmFtIGVuZFRpbWUgVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RvcHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrIChhbmQgc3Rha2VkIEFYQyBpcyByZXR1cm5lZCkuXG4gICAqIEBwYXJhbSBzdGFrZUFtb3VudCBUaGUgYW1vdW50IGJlaW5nIGRlbGVnYXRlZCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSByZXdhcmRBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB3aGljaCB3aWxsIHJlY2lldmUgdGhlIHJld2FyZHMgZnJvbSB0aGUgZGVsZWdhdGVkIHN0YWtlLlxuICAgKiBAcGFyYW0gZGVsZWdhdGlvbkZlZSBBIG51bWJlciBmb3IgdGhlIHBlcmNlbnRhZ2Ugb2YgcmV3YXJkIHRvIGJlIGdpdmVuIHRvIHRoZSB2YWxpZGF0b3Igd2hlbiBzb21lb25lIGRlbGVnYXRlcyB0byB0aGVtLiBNdXN0IGJlIGJldHdlZW4gMCBhbmQgMTAwLlxuICAgKiBAcGFyYW0gcmV3YXJkTG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgcmV3YXJkIG91dHB1dHNcbiAgICogQHBhcmFtIHJld2FyZFRocmVzaG9sZCBPcGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgcmV3YXJkIFVUWE8uIERlZmF1bHQgMS5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG4gIGJ1aWxkQWRkVmFsaWRhdG9yVHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICB0b0FkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBub2RlSUQ6IHN0cmluZyxcbiAgICBzdGFydFRpbWU6IEJOLFxuICAgIGVuZFRpbWU6IEJOLFxuICAgIHN0YWtlQW1vdW50OiBCTixcbiAgICByZXdhcmRBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGRlbGVnYXRpb25GZWU6IG51bWJlcixcbiAgICByZXdhcmRMb2NrdGltZTogQk4gPSBuZXcgQk4oMCksXG4gICAgcmV3YXJkVGhyZXNob2xkOiBudW1iZXIgPSAxLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IHRvOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgICAgdG9BZGRyZXNzZXMsXG4gICAgICBcImJ1aWxkQWRkVmFsaWRhdG9yVHhcIlxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXG4gICAgICBmcm9tQWRkcmVzc2VzLFxuICAgICAgXCJidWlsZEFkZFZhbGlkYXRvclR4XCJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBcImJ1aWxkQWRkVmFsaWRhdG9yVHhcIlxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuICAgIGNvbnN0IHJld2FyZHM6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXG4gICAgICByZXdhcmRBZGRyZXNzZXMsXG4gICAgICBcImJ1aWxkQWRkVmFsaWRhdG9yVHhcIlxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgbWluU3Rha2U6IEJOID0gKGF3YWl0IHRoaXMuZ2V0TWluU3Rha2UoKSlbXCJtaW5WYWxpZGF0b3JTdGFrZVwiXVxuICAgIGlmIChzdGFrZUFtb3VudC5sdChtaW5TdGFrZSkpIHtcbiAgICAgIHRocm93IG5ldyBTdGFrZUVycm9yKFxuICAgICAgICBcIlBsYXRmb3JtVk1BUEkuYnVpbGRBZGRWYWxpZGF0b3JUeCAtLSBzdGFrZSBhbW91bnQgbXVzdCBiZSBhdCBsZWFzdCBcIiArXG4gICAgICAgICAgbWluU3Rha2UudG9TdHJpbmcoMTApXG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdHlwZW9mIGRlbGVnYXRpb25GZWUgIT09IFwibnVtYmVyXCIgfHxcbiAgICAgIGRlbGVnYXRpb25GZWUgPiAxMDAgfHxcbiAgICAgIGRlbGVnYXRpb25GZWUgPCAwXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRGVsZWdhdGlvbkZlZUVycm9yKFxuICAgICAgICBcIlBsYXRmb3JtVk1BUEkuYnVpbGRBZGRWYWxpZGF0b3JUeCAtLSBkZWxlZ2F0aW9uRmVlIG11c3QgYmUgYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxMDBcIlxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IGF4Y0Fzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVhDQXNzZXRJRCgpXG5cbiAgICBjb25zdCBub3c6IEJOID0gVW5peE5vdygpXG4gICAgaWYgKHN0YXJ0VGltZS5sdChub3cpIHx8IGVuZFRpbWUubHRlKHN0YXJ0VGltZSkpIHtcbiAgICAgIHRocm93IG5ldyBUaW1lRXJyb3IoXG4gICAgICAgIFwiUGxhdGZvcm1WTUFQSS5idWlsZEFkZFZhbGlkYXRvclR4IC0tIHN0YXJ0VGltZSBtdXN0IGJlIGluIHRoZSBmdXR1cmUgYW5kIGVuZFRpbWUgbXVzdCBjb21lIGFmdGVyIHN0YXJ0VGltZVwiXG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZEFkZFZhbGlkYXRvclR4KFxuICAgICAgdGhpcy5jb3JlLmdldE5ldHdvcmtJRCgpLFxuICAgICAgYmludG9vbHMuY2I1OERlY29kZSh0aGlzLmJsb2NrY2hhaW5JRCksXG4gICAgICBheGNBc3NldElELFxuICAgICAgdG8sXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgTm9kZUlEU3RyaW5nVG9CdWZmZXIobm9kZUlEKSxcbiAgICAgIHN0YXJ0VGltZSxcbiAgICAgIGVuZFRpbWUsXG4gICAgICBzdGFrZUFtb3VudCxcbiAgICAgIHJld2FyZExvY2t0aW1lLFxuICAgICAgcmV3YXJkVGhyZXNob2xkLFxuICAgICAgcmV3YXJkcyxcbiAgICAgIGRlbGVnYXRpb25GZWUsXG4gICAgICBuZXcgQk4oMCksXG4gICAgICBheGNBc3NldElELFxuICAgICAgbWVtbyxcbiAgICAgIGFzT2ZcbiAgICApXG5cbiAgICBpZiAoIShhd2FpdCB0aGlzLmNoZWNrR29vc2VFZ2coYnVpbHRVbnNpZ25lZFR4KSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKVxuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgW1tDcmVhdGVBbGx5Q2hhaW5UeF1dIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdXR4b3NldCBBIHNldCBvZiBVVFhPcyB0aGF0IHRoZSB0cmFuc2FjdGlvbiBpcyBidWlsdCBvblxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zXG4gICAqIEBwYXJhbSBhbGx5Q2hhaW5Pd25lckFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgZm9yIG93bmVycyBvZiB0aGUgbmV3IGFsbHlDaGFpblxuICAgKiBAcGFyYW0gYWxseUNoYWluT3duZXJUaHJlc2hvbGQgQSBudW1iZXIgaW5kaWNhdGluZyB0aGUgYW1vdW50IG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gYWRkIHZhbGlkYXRvcnMgdG8gYSBhbGx5Q2hhaW5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG4gIGJ1aWxkQ3JlYXRlQWxseUNoYWluVHggPSBhc3luYyAoXG4gICAgdXR4b3NldDogVVRYT1NldCxcbiAgICBmcm9tQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IHN0cmluZ1tdLFxuICAgIGFsbHlDaGFpbk93bmVyQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBhbGx5Q2hhaW5Pd25lclRocmVzaG9sZDogbnVtYmVyLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpXG4gICk6IFByb21pc2U8VW5zaWduZWRUeD4gPT4ge1xuICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXG4gICAgICBmcm9tQWRkcmVzc2VzLFxuICAgICAgXCJidWlsZENyZWF0ZUFsbHlDaGFpblR4XCJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcbiAgICBjb25zdCBjaGFuZ2U6IEJ1ZmZlcltdID0gdGhpcy5fY2xlYW5BZGRyZXNzQXJyYXkoXG4gICAgICBjaGFuZ2VBZGRyZXNzZXMsXG4gICAgICBcImJ1aWxkQ3JlYXRlQWxseUNoYWluVHhcIlxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuICAgIGNvbnN0IG93bmVyczogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcbiAgICAgIGFsbHlDaGFpbk93bmVyQWRkcmVzc2VzLFxuICAgICAgXCJidWlsZENyZWF0ZUFsbHlDaGFpblR4XCJcbiAgICApLm1hcCgoYTogc3RyaW5nKTogQnVmZmVyID0+IGJpbnRvb2xzLnN0cmluZ1RvQWRkcmVzcyhhKSlcblxuICAgIGlmIChtZW1vIGluc3RhbmNlb2YgUGF5bG9hZEJhc2UpIHtcbiAgICAgIG1lbW8gPSBtZW1vLmdldFBheWxvYWQoKVxuICAgIH1cblxuICAgIGNvbnN0IGF4Y0Fzc2V0SUQ6IEJ1ZmZlciA9IGF3YWl0IHRoaXMuZ2V0QVhDQXNzZXRJRCgpXG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBjb25zdCBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpXG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0Q3JlYXRlQWxseUNoYWluVHhGZWUoKVxuICAgIGNvbnN0IGJ1aWx0VW5zaWduZWRUeDogVW5zaWduZWRUeCA9IHV0eG9zZXQuYnVpbGRDcmVhdGVBbGx5Q2hhaW5UeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIGZyb20sXG4gICAgICBjaGFuZ2UsXG4gICAgICBvd25lcnMsXG4gICAgICBhbGx5Q2hhaW5Pd25lclRocmVzaG9sZCxcbiAgICAgIGZlZSxcbiAgICAgIGF4Y0Fzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZlxuICAgIClcblxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgsIHRoaXMuZ2V0Q3JlYXRpb25UeEZlZSgpKSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKVxuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbiB1bnNpZ25lZCBbW0NyZWF0ZUNoYWluVHhdXS5cbiAgICpcbiAgICogQHBhcmFtIHV0eG9zZXQgQSBzZXQgb2YgVVRYT3MgdGhhdCB0aGUgdHJhbnNhY3Rpb24gaXMgYnVpbHQgb25cbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPc1xuICAgKiBAcGFyYW0gYWxseUNoYWluSUQgT3B0aW9uYWwgSUQgb2YgdGhlIEFsbHlDaGFpbiB0aGF0IHZhbGlkYXRlcyB0aGlzIGJsb2NrY2hhaW5cbiAgICogQHBhcmFtIGNoYWluTmFtZSBPcHRpb25hbCBBIGh1bWFuIHJlYWRhYmxlIG5hbWUgZm9yIHRoZSBjaGFpbjsgbmVlZCBub3QgYmUgdW5pcXVlXG4gICAqIEBwYXJhbSB2bUlEIE9wdGlvbmFsIElEIG9mIHRoZSBWTSBydW5uaW5nIG9uIHRoZSBuZXcgY2hhaW5cbiAgICogQHBhcmFtIGZ4SURzIE9wdGlvbmFsIElEcyBvZiB0aGUgZmVhdHVyZSBleHRlbnNpb25zIHJ1bm5pbmcgb24gdGhlIG5ldyBjaGFpblxuICAgKiBAcGFyYW0gZ2VuZXNpc0RhdGEgT3B0aW9uYWwgQnl0ZSByZXByZXNlbnRhdGlvbiBvZiBnZW5lc2lzIHN0YXRlIG9mIHRoZSBuZXcgY2hhaW5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGFsbHlDaGFpbkF1dGhDcmVkZW50aWFscyBPcHRpb25hbC4gQW4gYXJyYXkgb2YgaW5kZXggYW5kIGFkZHJlc3MgdG8gc2lnbiBmb3IgZWFjaCBBbGx5Q2hhaW5BdXRoLlxuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKi9cbiAgYnVpbGRDcmVhdGVDaGFpblR4ID0gYXN5bmMgKFxuICAgIHV0eG9zZXQ6IFVUWE9TZXQsXG4gICAgZnJvbUFkZHJlc3Nlczogc3RyaW5nW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBzdHJpbmdbXSxcbiAgICBhbGx5Q2hhaW5JRDogc3RyaW5nIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGNoYWluTmFtZTogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIHZtSUQ6IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBmeElEczogc3RyaW5nW10gPSB1bmRlZmluZWQsXG4gICAgZ2VuZXNpc0RhdGE6IHN0cmluZyB8IEdlbmVzaXNEYXRhID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IFBheWxvYWRCYXNlIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICAgIGFsbHlDaGFpbkF1dGhDcmVkZW50aWFsczogW251bWJlciwgQnVmZmVyXVtdID0gW11cbiAgKTogUHJvbWlzZTxVbnNpZ25lZFR4PiA9PiB7XG4gICAgY29uc3QgZnJvbTogQnVmZmVyW10gPSB0aGlzLl9jbGVhbkFkZHJlc3NBcnJheShcbiAgICAgIGZyb21BZGRyZXNzZXMsXG4gICAgICBcImJ1aWxkQ3JlYXRlQ2hhaW5UeFwiXG4gICAgKS5tYXAoKGE6IHN0cmluZyk6IEJ1ZmZlciA9PiBiaW50b29scy5zdHJpbmdUb0FkZHJlc3MoYSkpXG4gICAgY29uc3QgY2hhbmdlOiBCdWZmZXJbXSA9IHRoaXMuX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgICAgY2hhbmdlQWRkcmVzc2VzLFxuICAgICAgXCJidWlsZENyZWF0ZUNoYWluVHhcIlxuICAgICkubWFwKChhOiBzdHJpbmcpOiBCdWZmZXIgPT4gYmludG9vbHMuc3RyaW5nVG9BZGRyZXNzKGEpKVxuXG4gICAgaWYgKG1lbW8gaW5zdGFuY2VvZiBQYXlsb2FkQmFzZSkge1xuICAgICAgbWVtbyA9IG1lbW8uZ2V0UGF5bG9hZCgpXG4gICAgfVxuXG4gICAgY29uc3QgYXhjQXNzZXRJRDogQnVmZmVyID0gYXdhaXQgdGhpcy5nZXRBWENBc3NldElEKClcbiAgICBmeElEcyA9IGZ4SURzLnNvcnQoKVxuXG4gICAgY29uc3QgbmV0d29ya0lEOiBudW1iZXIgPSB0aGlzLmNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBjb25zdCBibG9ja2NoYWluSUQ6IEJ1ZmZlciA9IGJpbnRvb2xzLmNiNThEZWNvZGUodGhpcy5ibG9ja2NoYWluSUQpXG4gICAgY29uc3QgZmVlOiBCTiA9IHRoaXMuZ2V0Q3JlYXRlQ2hhaW5UeEZlZSgpXG4gICAgY29uc3QgYnVpbHRVbnNpZ25lZFR4OiBVbnNpZ25lZFR4ID0gdXR4b3NldC5idWlsZENyZWF0ZUNoYWluVHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBmcm9tLFxuICAgICAgY2hhbmdlLFxuICAgICAgYWxseUNoYWluSUQsXG4gICAgICBjaGFpbk5hbWUsXG4gICAgICB2bUlELFxuICAgICAgZnhJRHMsXG4gICAgICBnZW5lc2lzRGF0YSxcbiAgICAgIGZlZSxcbiAgICAgIGF4Y0Fzc2V0SUQsXG4gICAgICBtZW1vLFxuICAgICAgYXNPZixcbiAgICAgIGFsbHlDaGFpbkF1dGhDcmVkZW50aWFsc1xuICAgIClcblxuICAgIGlmICghKGF3YWl0IHRoaXMuY2hlY2tHb29zZUVnZyhidWlsdFVuc2lnbmVkVHgsIHRoaXMuZ2V0Q3JlYXRpb25UeEZlZSgpKSkpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgR29vc2VFZ2dDaGVja0Vycm9yKFwiRmFpbGVkIEdvb3NlIEVnZyBDaGVja1wiKVxuICAgIH1cblxuICAgIHJldHVybiBidWlsdFVuc2lnbmVkVHhcbiAgfVxuXG4gIC8qKlxuICAgKiBAaWdub3JlXG4gICAqL1xuICBwcm90ZWN0ZWQgX2NsZWFuQWRkcmVzc0FycmF5KFxuICAgIGFkZHJlc3Nlczogc3RyaW5nW10gfCBCdWZmZXJbXSxcbiAgICBjYWxsZXI6IHN0cmluZ1xuICApOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgYWRkcnM6IHN0cmluZ1tdID0gW11cbiAgICBjb25zdCBjaGFpbmlkOiBzdHJpbmcgPSB0aGlzLmdldEJsb2NrY2hhaW5BbGlhcygpXG4gICAgICA/IHRoaXMuZ2V0QmxvY2tjaGFpbkFsaWFzKClcbiAgICAgIDogdGhpcy5nZXRCbG9ja2NoYWluSUQoKVxuICAgIGlmIChhZGRyZXNzZXMgJiYgYWRkcmVzc2VzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBhZGRyZXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhZGRyZXNzZXNbYCR7aX1gXSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiB0aGlzLnBhcnNlQWRkcmVzcyhhZGRyZXNzZXNbYCR7aX1gXSBhcyBzdHJpbmcpID09PVxuICAgICAgICAgICAgXCJ1bmRlZmluZWRcIlxuICAgICAgICAgICkge1xuICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXCJFcnJvciAtIEludmFsaWQgYWRkcmVzcyBmb3JtYXRcIilcbiAgICAgICAgICB9XG4gICAgICAgICAgYWRkcnMucHVzaChhZGRyZXNzZXNbYCR7aX1gXSBhcyBzdHJpbmcpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgYmVjaDMyOiBTZXJpYWxpemVkVHlwZSA9IFwiYmVjaDMyXCJcbiAgICAgICAgICBhZGRycy5wdXNoKFxuICAgICAgICAgICAgc2VyaWFsaXphdGlvbi5idWZmZXJUb1R5cGUoXG4gICAgICAgICAgICAgIGFkZHJlc3Nlc1tgJHtpfWBdIGFzIEJ1ZmZlcixcbiAgICAgICAgICAgICAgYmVjaDMyLFxuICAgICAgICAgICAgICB0aGlzLmNvcmUuZ2V0SFJQKCksXG4gICAgICAgICAgICAgIGNoYWluaWRcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFkZHJzXG4gIH1cblxuICAvKipcbiAgICogVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGluc3RhbnRpYXRlZCBkaXJlY3RseS5cbiAgICogSW5zdGVhZCB1c2UgdGhlIFtbQXhpYS5hZGRBUEldXSBtZXRob2QuXG4gICAqXG4gICAqIEBwYXJhbSBjb3JlIEEgcmVmZXJlbmNlIHRvIHRoZSBBeGlhIGNsYXNzXG4gICAqIEBwYXJhbSBiYXNlVVJMIERlZmF1bHRzIHRvIHRoZSBzdHJpbmcgXCIvZXh0L1BcIiBhcyB0aGUgcGF0aCB0byBibG9ja2NoYWluJ3MgYmFzZVVSTFxuICAgKi9cbiAgY29uc3RydWN0b3IoY29yZTogQXhpYUNvcmUsIGJhc2VVUkw6IHN0cmluZyA9IFwiL2V4dC9iYy9QXCIpIHtcbiAgICBzdXBlcihjb3JlLCBiYXNlVVJMKVxuICAgIHRoaXMuYmxvY2tjaGFpbklEID0gUGxhdGZvcm1DaGFpbklEXG4gICAgY29uc3QgbmV0SUQ6IG51bWJlciA9IGNvcmUuZ2V0TmV0d29ya0lEKClcbiAgICBpZiAoXG4gICAgICBuZXRJRCBpbiBEZWZhdWx0cy5uZXR3b3JrICYmXG4gICAgICB0aGlzLmJsb2NrY2hhaW5JRCBpbiBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldElEfWBdXG4gICAgKSB7XG4gICAgICBjb25zdCB7IGFsaWFzIH0gPSBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldElEfWBdW3RoaXMuYmxvY2tjaGFpbklEXVxuICAgICAgdGhpcy5rZXljaGFpbiA9IG5ldyBLZXlDaGFpbih0aGlzLmNvcmUuZ2V0SFJQKCksIGFsaWFzKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmtleWNoYWluID0gbmV3IEtleUNoYWluKHRoaXMuY29yZS5nZXRIUlAoKSwgdGhpcy5ibG9ja2NoYWluSUQpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIHRoZSBjdXJyZW50IHRpbWVzdGFtcCBvbiBjaGFpbi5cbiAgICovXG4gIGdldFRpbWVzdGFtcCA9IGFzeW5jICgpOiBQcm9taXNlPG51bWJlcj4gPT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRUaW1lc3RhbXBcIlxuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudGltZXN0YW1wXG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgdGhlIFVUWE9zIHRoYXQgd2VyZSByZXdhcmRlZCBhZnRlciB0aGUgcHJvdmlkZWQgdHJhbnNhY3Rpb25cInMgc3Rha2luZyBvciBkZWxlZ2F0aW9uIHBlcmlvZCBlbmRlZC5cbiAgICovXG4gIGdldFJld2FyZFVUWE9zID0gYXN5bmMgKFxuICAgIHR4SUQ6IHN0cmluZyxcbiAgICBlbmNvZGluZz86IHN0cmluZ1xuICApOiBQcm9taXNlPEdldFJld2FyZFVUWE9zUmVzcG9uc2U+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IEdldFJld2FyZFVUWE9zUGFyYW1zID0ge1xuICAgICAgdHhJRCxcbiAgICAgIGVuY29kaW5nXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJwbGF0Zm9ybS5nZXRSZXdhcmRVVFhPc1wiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICB9XG59XG4iXX0=