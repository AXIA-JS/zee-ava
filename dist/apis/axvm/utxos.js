"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTXOSet = exports.AssetAmountDestination = exports.UTXO = void 0;
/**
 * @packageDocumentation
 * @module API-AXVM-UTXOs
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const outputs_1 = require("./outputs");
const constants_1 = require("./constants");
const tx_1 = require("./tx");
const inputs_1 = require("./inputs");
const ops_1 = require("./ops");
const helperfunctions_1 = require("../../utils/helperfunctions");
const initialstates_1 = require("./initialstates");
const utxos_1 = require("../../common/utxos");
const createassettx_1 = require("./createassettx");
const operationtx_1 = require("./operationtx");
const basetx_1 = require("./basetx");
const exporttx_1 = require("./exporttx");
const importtx_1 = require("./importtx");
const constants_2 = require("../../utils/constants");
const assetamount_1 = require("../../common/assetamount");
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Class for representing a single UTXO.
 */
class UTXO extends utxos_1.StandardUTXO {
    constructor() {
        super(...arguments);
        this._typeName = "UTXO";
        this._typeID = undefined;
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.output = (0, outputs_1.SelectOutputClass)(fields["output"]["_typeID"]);
        this.output.deserialize(fields["output"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        this.codecID = bintools.copyFrom(bytes, offset, offset + 2);
        offset += 2;
        this.txid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.outputidx = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.assetID = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        const outputid = bintools
            .copyFrom(bytes, offset, offset + 4)
            .readUInt32BE(0);
        offset += 4;
        this.output = (0, outputs_1.SelectOutputClass)(outputid);
        return this.output.fromBuffer(bytes, offset);
    }
    /**
     * Takes a base-58 string containing a [[UTXO]], parses it, populates the class, and returns the length of the StandardUTXO in bytes.
     *
     * @param serialized A base-58 string containing a raw [[UTXO]]
     *
     * @returns The length of the raw [[UTXO]]
     *
     * @remarks
     * unlike most fromStrings, it expects the string to be serialized in cb58 format
     */
    fromString(serialized) {
        /* istanbul ignore next */
        return this.fromBuffer(bintools.cb58Decode(serialized));
    }
    /**
     * Returns a base-58 representation of the [[UTXO]].
     *
     * @remarks
     * unlike most toStrings, this returns in cb58 serialization format
     */
    toString() {
        /* istanbul ignore next */
        return bintools.cb58Encode(this.toBuffer());
    }
    clone() {
        const utxo = new UTXO();
        utxo.fromBuffer(this.toBuffer());
        return utxo;
    }
    create(codecID = constants_1.AXVMConstants.LATESTCODEC, txid = undefined, outputidx = undefined, assetID = undefined, output = undefined) {
        return new UTXO(codecID, txid, outputidx, assetID, output);
    }
}
exports.UTXO = UTXO;
class AssetAmountDestination extends assetamount_1.StandardAssetAmountDestination {
}
exports.AssetAmountDestination = AssetAmountDestination;
/**
 * Class representing a set of [[UTXO]]s.
 */
class UTXOSet extends utxos_1.StandardUTXOSet {
    constructor() {
        super(...arguments);
        this._typeName = "UTXOSet";
        this._typeID = undefined;
        this.getMinimumSpendable = (aad, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => {
            const utxoArray = this.getAllUTXOs();
            const outids = {};
            for (let i = 0; i < utxoArray.length && !aad.canComplete(); i++) {
                const u = utxoArray[`${i}`];
                const assetKey = u.getAssetID().toString("hex");
                const fromAddresses = aad.getSenders();
                if (u.getOutput() instanceof outputs_1.AmountOutput &&
                    aad.assetExists(assetKey) &&
                    u.getOutput().meetsThreshold(fromAddresses, asOf)) {
                    const am = aad.getAssetAmount(assetKey);
                    if (!am.isFinished()) {
                        const uout = u.getOutput();
                        outids[`${assetKey}`] = uout.getOutputID();
                        const amount = uout.getAmount();
                        am.spendAmount(amount);
                        const txid = u.getTxID();
                        const outputidx = u.getOutputIdx();
                        const input = new inputs_1.SECPTransferInput(amount);
                        const xferin = new inputs_1.TransferableInput(txid, outputidx, u.getAssetID(), input);
                        const spenders = uout.getSpenders(fromAddresses, asOf);
                        for (let j = 0; j < spenders.length; j++) {
                            const idx = uout.getAddressIdx(spenders[`${j}`]);
                            if (idx === -1) {
                                /* istanbul ignore next */
                                throw new errors_1.AddressError("Error - UTXOSet.getMinimumSpendable: no such " +
                                    `address in output: ${spenders[`${j}`]}`);
                            }
                            xferin.getInput().addSignatureIdx(idx, spenders[`${j}`]);
                        }
                        aad.addInput(xferin);
                    }
                    else if (aad.assetExists(assetKey) &&
                        !(u.getOutput() instanceof outputs_1.AmountOutput)) {
                        /**
                         * Leaving the below lines, not simply for posterity, but for clarification.
                         * AssetIDs may have mixed OutputTypes.
                         * Some of those OutputTypes may implement AmountOutput.
                         * Others may not.
                         * Simply continue in this condition.
                         */
                        /*return new Error('Error - UTXOSet.getMinimumSpendable: outputID does not '
                          + `implement AmountOutput: ${u.getOutput().getOutputID}`)*/
                        continue;
                    }
                }
            }
            if (!aad.canComplete()) {
                return new errors_1.InsufficientFundsError("Error - UTXOSet.getMinimumSpendable: insufficient " +
                    "funds to create the transaction");
            }
            const amounts = aad.getAmounts();
            const zero = new bn_js_1.default(0);
            for (let i = 0; i < amounts.length; i++) {
                const assetKey = amounts[`${i}`].getAssetIDString();
                const amount = amounts[`${i}`].getAmount();
                if (amount.gt(zero)) {
                    const spendout = (0, outputs_1.SelectOutputClass)(outids[`${assetKey}`], amount, aad.getDestinations(), locktime, threshold);
                    const xferout = new outputs_1.TransferableOutput(amounts[`${i}`].getAssetID(), spendout);
                    aad.addOutput(xferout);
                }
                const change = amounts[`${i}`].getChange();
                if (change.gt(zero)) {
                    const changeout = (0, outputs_1.SelectOutputClass)(outids[`${assetKey}`], change, aad.getChangeAddresses());
                    const chgxferout = new outputs_1.TransferableOutput(amounts[`${i}`].getAssetID(), changeout);
                    aad.addChange(chgxferout);
                }
            }
            return undefined;
        };
        /**
         * Creates an [[UnsignedTx]] wrapping a [[BaseTx]]. For more granular control, you may create your own
         * [[UnsignedTx]] wrapping a [[BaseTx]] manually (with their corresponding [[TransferableInput]]s and [[TransferableOutput]]s).
         *
         * @param networkID The number representing NetworkID of the node
         * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param amount The amount of the asset to be spent in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}.
         * @param assetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for the UTXO
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs. Default: toAddresses
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned. Default: assetID
         * @param memo Optional. Contains arbitrary data, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction created from the passed in parameters.
         *
         */
        this.buildBaseTx = (networkID, blockchainID, amount, assetID, toAddresses, fromAddresses, changeAddresses = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => {
            if (threshold > toAddresses.length) {
                /* istanbul ignore next */
                throw new errors_1.ThresholdError("Error - UTXOSet.buildBaseTx: threshold is greater than number of addresses");
            }
            if (typeof changeAddresses === "undefined") {
                changeAddresses = toAddresses;
            }
            if (typeof feeAssetID === "undefined") {
                feeAssetID = assetID;
            }
            const zero = new bn_js_1.default(0);
            if (amount.eq(zero)) {
                return undefined;
            }
            const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
            if (assetID.toString("hex") === feeAssetID.toString("hex")) {
                aad.addAssetAmount(assetID, amount, fee);
            }
            else {
                aad.addAssetAmount(assetID, amount, zero);
                if (this._feeCheck(fee, feeAssetID)) {
                    aad.addAssetAmount(feeAssetID, zero, fee);
                }
            }
            let ins = [];
            let outs = [];
            const success = this.getMinimumSpendable(aad, asOf, locktime, threshold);
            if (typeof success === "undefined") {
                ins = aad.getInputs();
                outs = aad.getAllOutputs();
            }
            else {
                throw success;
            }
            const baseTx = new basetx_1.BaseTx(networkID, blockchainID, outs, ins, memo);
            return new tx_1.UnsignedTx(baseTx);
        };
        /**
         * Creates an unsigned Create Asset transaction. For more granular control, you may create your own
         * [[CreateAssetTX]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
         *
         * @param networkID The number representing NetworkID of the node
         * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs
         * @param initialState The [[InitialStates]] that represent the intial state of a created asset
         * @param name String for the descriptive name of the asset
         * @param symbol String for the ticker symbol of the asset
         * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AXC = 10^9 $nAXC
         * @param mintOutputs Optional. Array of [[SECPMintOutput]]s to be included in the transaction. These outputs can be spent to mint more tokens.
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction created from the passed in parameters.
         *
         */
        this.buildCreateAssetTx = (networkID, blockchainID, fromAddresses, changeAddresses, initialState, name, symbol, denomination, mintOutputs = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const success = this.getMinimumSpendable(aad, asOf);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            if (typeof mintOutputs !== "undefined") {
                for (let i = 0; i < mintOutputs.length; i++) {
                    if (mintOutputs[`${i}`] instanceof outputs_1.SECPMintOutput) {
                        initialState.addOutput(mintOutputs[`${i}`]);
                    }
                    else {
                        throw new errors_1.SECPMintOutputError("Error - UTXOSet.buildCreateAssetTx: A submitted mintOutput was not of type SECPMintOutput");
                    }
                }
            }
            let CAtx = new createassettx_1.CreateAssetTx(networkID, blockchainID, outs, ins, memo, name, symbol, denomination, initialState);
            return new tx_1.UnsignedTx(CAtx);
        };
        /**
         * Creates an unsigned Secp mint transaction. For more granular control, you may create your own
         * [[OperationTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param networkID The number representing NetworkID of the node
         * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param mintOwner A [[SECPMintOutput]] which specifies the new set of minters
         * @param transferOwner A [[SECPTransferOutput]] which specifies where the minted tokens will go
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
         * @param mintUTXOID The UTXOID for the [[SCPMintOutput]] being spent to produce more tokens
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         */
        this.buildSECPMintTx = (networkID, blockchainID, mintOwner, transferOwner, fromAddresses, changeAddresses, mintUTXOID, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const success = this.getMinimumSpendable(aad, asOf);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            let ops = [];
            let mintOp = new ops_1.SECPMintOperation(mintOwner, transferOwner);
            let utxo = this.getUTXO(mintUTXOID);
            if (typeof utxo === "undefined") {
                throw new errors_1.UTXOError("Error - UTXOSet.buildSECPMintTx: UTXOID not found");
            }
            if (utxo.getOutput().getOutputID() !== constants_1.AXVMConstants.SECPMINTOUTPUTID) {
                throw new errors_1.SECPMintOutputError("Error - UTXOSet.buildSECPMintTx: UTXO is not a SECPMINTOUTPUTID");
            }
            let out = utxo.getOutput();
            let spenders = out.getSpenders(fromAddresses, asOf);
            for (let j = 0; j < spenders.length; j++) {
                let idx = out.getAddressIdx(spenders[`${j}`]);
                if (idx == -1) {
                    /* istanbul ignore next */
                    throw new Error("Error - UTXOSet.buildSECPMintTx: no such address in output");
                }
                mintOp.addSignatureIdx(idx, spenders[`${j}`]);
            }
            let transferableOperation = new ops_1.TransferableOperation(utxo.getAssetID(), [`${mintUTXOID}`], mintOp);
            ops.push(transferableOperation);
            let operationTx = new operationtx_1.OperationTx(networkID, blockchainID, outs, ins, memo, ops);
            return new tx_1.UnsignedTx(operationTx);
        };
        /**
         * Creates an unsigned Create Asset transaction. For more granular control, you may create your own
         * [[CreateAssetTX]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
         *
         * @param networkID The number representing NetworkID of the node
         * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
         * @param minterSets The minters and thresholds required to mint this nft asset
         * @param name String for the descriptive name of the nft asset
         * @param symbol String for the ticker symbol of the nft asset
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting mint output
         *
         * @returns An unsigned transaction created from the passed in parameters.
         *
         */
        this.buildCreateNFTAssetTx = (networkID, blockchainID, fromAddresses, changeAddresses, minterSets, name, symbol, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = undefined) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const success = this.getMinimumSpendable(aad, asOf);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            let initialState = new initialstates_1.InitialStates();
            for (let i = 0; i < minterSets.length; i++) {
                let nftMintOutput = new outputs_1.NFTMintOutput(i, minterSets[`${i}`].getMinters(), locktime, minterSets[`${i}`].getThreshold());
                initialState.addOutput(nftMintOutput, constants_1.AXVMConstants.NFTFXID);
            }
            let denomination = 0; // NFTs are non-fungible
            let CAtx = new createassettx_1.CreateAssetTx(networkID, blockchainID, outs, ins, memo, name, symbol, denomination, initialState);
            return new tx_1.UnsignedTx(CAtx);
        };
        /**
         * Creates an unsigned NFT mint transaction. For more granular control, you may create your own
         * [[OperationTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param networkID The number representing NetworkID of the node
         * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param owners An array of [[OutputOwners]] who will be given the NFTs.
         * @param fromAddresses The addresses being used to send the funds from the UTXOs
         * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
         * @param utxoids An array of strings for the NFTs being transferred
         * @param groupID Optional. The group this NFT is issued to.
         * @param payload Optional. Data for NFT Payload.
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction created from the passed in parameters.
         *
         */
        this.buildCreateNFTMintTx = (networkID, blockchainID, owners, fromAddresses, changeAddresses, utxoids, groupID = 0, payload = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const success = this.getMinimumSpendable(aad, asOf);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            let ops = [];
            let nftMintOperation = new ops_1.NFTMintOperation(groupID, payload, owners);
            for (let i = 0; i < utxoids.length; i++) {
                let utxo = this.getUTXO(utxoids[`${i}`]);
                let out = utxo.getOutput();
                let spenders = out.getSpenders(fromAddresses, asOf);
                for (let j = 0; j < spenders.length; j++) {
                    let idx;
                    idx = out.getAddressIdx(spenders[`${j}`]);
                    if (idx == -1) {
                        /* istanbul ignore next */
                        throw new errors_1.AddressError("Error - UTXOSet.buildCreateNFTMintTx: no such address in output");
                    }
                    nftMintOperation.addSignatureIdx(idx, spenders[`${j}`]);
                }
                let transferableOperation = new ops_1.TransferableOperation(utxo.getAssetID(), utxoids, nftMintOperation);
                ops.push(transferableOperation);
            }
            let operationTx = new operationtx_1.OperationTx(networkID, blockchainID, outs, ins, memo, ops);
            return new tx_1.UnsignedTx(operationTx);
        };
        /**
         * Creates an unsigned NFT transfer transaction. For more granular control, you may create your own
         * [[OperationTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
         *
         * @param networkID The number representing NetworkID of the node
         * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param toAddresses An array of {@link https://github.com/feross/buffer|Buffer}s which indicate who recieves the NFT
         * @param fromAddresses An array for {@link https://github.com/feross/buffer|Buffer} who owns the NFT
         * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
         * @param utxoids An array of strings for the NFTs being transferred
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         *
         * @returns An unsigned transaction created from the passed in parameters.
         *
         */
        this.buildNFTTransferTx = (networkID, blockchainID, toAddresses, fromAddresses, changeAddresses, utxoids, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const success = this.getMinimumSpendable(aad, asOf);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            const ops = [];
            for (let i = 0; i < utxoids.length; i++) {
                const utxo = this.getUTXO(utxoids[`${i}`]);
                const out = utxo.getOutput();
                const spenders = out.getSpenders(fromAddresses, asOf);
                const outbound = new outputs_1.NFTTransferOutput(out.getGroupID(), out.getPayload(), toAddresses, locktime, threshold);
                const op = new ops_1.NFTTransferOperation(outbound);
                for (let j = 0; j < spenders.length; j++) {
                    const idx = out.getAddressIdx(spenders[`${j}`]);
                    if (idx === -1) {
                        /* istanbul ignore next */
                        throw new errors_1.AddressError("Error - UTXOSet.buildNFTTransferTx: " +
                            `no such address in output: ${spenders[`${j}`]}`);
                    }
                    op.addSignatureIdx(idx, spenders[`${j}`]);
                }
                const xferop = new ops_1.TransferableOperation(utxo.getAssetID(), [utxoids[`${i}`]], op);
                ops.push(xferop);
            }
            const OpTx = new operationtx_1.OperationTx(networkID, blockchainID, outs, ins, memo, ops);
            return new tx_1.UnsignedTx(OpTx);
        };
        /**
         * Creates an unsigned ImportTx transaction.
         *
         * @param networkID The number representing NetworkID of the node
         * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param toAddresses The addresses to send the funds
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
         * @param importIns An array of [[TransferableInput]]s being imported
         * @param sourceChain A {@link https://github.com/feross/buffer|Buffer} for the chainid where the imports are coming from.
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}. Fee will come from the inputs first, if they can.
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         * @returns An unsigned transaction created from the passed in parameters.
         *
         */
        this.buildImportTx = (networkID, blockchainID, toAddresses, fromAddresses, changeAddresses, atomics, sourceChain = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (typeof fee === "undefined") {
                fee = zero.clone();
            }
            const importIns = [];
            let feepaid = new bn_js_1.default(0);
            let feeAssetStr = feeAssetID.toString("hex");
            for (let i = 0; i < atomics.length; i++) {
                const utxo = atomics[`${i}`];
                const assetID = utxo.getAssetID();
                const output = utxo.getOutput();
                let amt = output.getAmount().clone();
                let infeeamount = amt.clone();
                let assetStr = assetID.toString("hex");
                if (typeof feeAssetID !== "undefined" &&
                    fee.gt(zero) &&
                    feepaid.lt(fee) &&
                    assetStr === feeAssetStr) {
                    feepaid = feepaid.add(infeeamount);
                    if (feepaid.gt(fee)) {
                        infeeamount = feepaid.sub(fee);
                        feepaid = fee.clone();
                    }
                    else {
                        infeeamount = zero.clone();
                    }
                }
                const txid = utxo.getTxID();
                const outputidx = utxo.getOutputIdx();
                const input = new inputs_1.SECPTransferInput(amt);
                const xferin = new inputs_1.TransferableInput(txid, outputidx, assetID, input);
                const from = output.getAddresses();
                const spenders = output.getSpenders(from, asOf);
                for (let j = 0; j < spenders.length; j++) {
                    const idx = output.getAddressIdx(spenders[`${j}`]);
                    if (idx === -1) {
                        /* istanbul ignore next */
                        throw new errors_1.AddressError("Error - UTXOSet.buildImportTx: no such " +
                            `address in output: ${spenders[`${j}`]}`);
                    }
                    xferin.getInput().addSignatureIdx(idx, spenders[`${j}`]);
                }
                importIns.push(xferin);
                //add extra outputs for each amount (calculated from the imported inputs), minus fees
                if (infeeamount.gt(zero)) {
                    const spendout = (0, outputs_1.SelectOutputClass)(output.getOutputID(), infeeamount, toAddresses, locktime, threshold);
                    const xferout = new outputs_1.TransferableOutput(assetID, spendout);
                    outs.push(xferout);
                }
            }
            // get remaining fees from the provided addresses
            let feeRemaining = fee.sub(feepaid);
            if (feeRemaining.gt(zero) && this._feeCheck(feeRemaining, feeAssetID)) {
                const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, feeRemaining);
                const success = this.getMinimumSpendable(aad, asOf, locktime, threshold);
                if (typeof success === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw success;
                }
            }
            const importTx = new importtx_1.ImportTx(networkID, blockchainID, outs, ins, memo, sourceChain, importIns);
            return new tx_1.UnsignedTx(importTx);
        };
        /**
         * Creates an unsigned ExportTx transaction.
         *
         * @param networkID The number representing NetworkID of the node
         * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
         * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
         * @param axcAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for AXC
         * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who recieves the AXC
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who owns the AXC
         * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs.
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param destinationChain Optional. A {@link https://github.com/feross/buffer|Buffer} for the chainid where to send the asset.
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param locktime Optional. The locktime field created in the resulting outputs
         * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
         * @returns An unsigned transaction created from the passed in parameters.
         *
         */
        this.buildExportTx = (networkID, blockchainID, amount, assetID, toAddresses, fromAddresses, changeAddresses = undefined, destinationChain = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => {
            let ins = [];
            let outs = [];
            let exportouts = [];
            if (typeof changeAddresses === "undefined") {
                changeAddresses = toAddresses;
            }
            const zero = new bn_js_1.default(0);
            if (amount.eq(zero)) {
                return undefined;
            }
            if (typeof feeAssetID === "undefined") {
                feeAssetID = assetID;
            }
            if (typeof destinationChain === "undefined") {
                destinationChain = bintools.cb58Decode(constants_2.PlatformChainID);
            }
            const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
            if (assetID.toString("hex") === feeAssetID.toString("hex")) {
                aad.addAssetAmount(assetID, amount, fee);
            }
            else {
                aad.addAssetAmount(assetID, amount, zero);
                if (this._feeCheck(fee, feeAssetID)) {
                    aad.addAssetAmount(feeAssetID, zero, fee);
                }
            }
            const success = this.getMinimumSpendable(aad, asOf, locktime, threshold);
            if (typeof success === "undefined") {
                ins = aad.getInputs();
                outs = aad.getChangeOutputs();
                exportouts = aad.getOutputs();
            }
            else {
                throw success;
            }
            const exportTx = new exporttx_1.ExportTx(networkID, blockchainID, outs, ins, memo, destinationChain, exportouts);
            return new tx_1.UnsignedTx(exportTx);
        };
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        let utxos = {};
        for (let utxoid in fields["utxos"]) {
            let utxoidCleaned = serialization.decoder(utxoid, encoding, "base58", "base58");
            utxos[`${utxoidCleaned}`] = new UTXO();
            utxos[`${utxoidCleaned}`].deserialize(fields["utxos"][`${utxoid}`], encoding);
        }
        let addressUTXOs = {};
        for (let address in fields["addressUTXOs"]) {
            let addressCleaned = serialization.decoder(address, encoding, "cb58", "hex");
            let utxobalance = {};
            for (let utxoid in fields["addressUTXOs"][`${address}`]) {
                let utxoidCleaned = serialization.decoder(utxoid, encoding, "base58", "base58");
                utxobalance[`${utxoidCleaned}`] = serialization.decoder(fields["addressUTXOs"][`${address}`][`${utxoid}`], encoding, "decimalString", "BN");
            }
            addressUTXOs[`${addressCleaned}`] = utxobalance;
        }
        this.utxos = utxos;
        this.addressUTXOs = addressUTXOs;
    }
    parseUTXO(utxo) {
        const utxovar = new UTXO();
        // force a copy
        if (typeof utxo === "string") {
            utxovar.fromBuffer(bintools.cb58Decode(utxo));
        }
        else if (utxo instanceof UTXO) {
            utxovar.fromBuffer(utxo.toBuffer()); // forces a copy
        }
        else {
            /* istanbul ignore next */
            throw new errors_1.UTXOError("Error - UTXO.parseUTXO: utxo parameter is not a UTXO or string");
        }
        return utxovar;
    }
    create(...args) {
        return new UTXOSet();
    }
    clone() {
        const newset = this.create();
        const allUTXOs = this.getAllUTXOs();
        newset.addArray(allUTXOs);
        return newset;
    }
    _feeCheck(fee, feeAssetID) {
        return (typeof fee !== "undefined" &&
            typeof feeAssetID !== "undefined" &&
            fee.gt(new bn_js_1.default(0)) &&
            feeAssetID instanceof buffer_1.Buffer);
    }
}
exports.UTXOSet = UTXOSet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXR4b3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9heHZtL3V0eG9zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxvRUFBMkM7QUFDM0Msa0RBQXNCO0FBQ3RCLHVDQVFrQjtBQUNsQiwyQ0FBMkM7QUFDM0MsNkJBQWlDO0FBQ2pDLHFDQUErRDtBQUMvRCwrQkFLYztBQUVkLGlFQUFxRDtBQUNyRCxtREFBK0M7QUFFL0MsOENBQWtFO0FBQ2xFLG1EQUErQztBQUMvQywrQ0FBMkM7QUFDM0MscUNBQWlDO0FBQ2pDLHlDQUFxQztBQUNyQyx5Q0FBcUM7QUFDckMscURBQXVEO0FBQ3ZELDBEQUdpQztBQUNqQyw2REFBNkU7QUFDN0UsK0NBTTJCO0FBRTNCOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQWEsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUNqRCxNQUFNLGFBQWEsR0FBa0IsNkJBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVoRTs7R0FFRztBQUNILE1BQWEsSUFBSyxTQUFRLG9CQUFZO0lBQXRDOztRQUNZLGNBQVMsR0FBRyxNQUFNLENBQUE7UUFDbEIsWUFBTyxHQUFHLFNBQVMsQ0FBQTtJQW9FL0IsQ0FBQztJQWxFQyx3QkFBd0I7SUFFeEIsV0FBVyxDQUFDLE1BQWMsRUFBRSxXQUErQixLQUFLO1FBQzlELEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBQ25DLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBQSwyQkFBaUIsRUFBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQTtRQUM1RCxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDckQsQ0FBQztJQUVELFVBQVUsQ0FBQyxL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Q0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBLENBQUMsZ0JBQWdCO1NBQ3JEO2FBQU07WUFDTCwwQkFBMEI7WUFDMUIsTUFBTSxJQUFJLGtCQUFTLENBQ2pCLGdFQUFnRSxDQUNqRSxDQUFBO1NBQ0Y7UUFDRCxPQUFPLE9BQU8sQ0FBQTtJQUNoQixDQUFDO0lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBVztRQUNuQixPQUFPLElBQUksT0FBTyxFQUFVLENBQUE7SUFDOUIsQ0FBQztJQUVELEtBQUs7UUFDSCxNQUFNLE1BQU0sR0FBWSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUE7UUFDckMsTUFBTSxRQUFRLEdBQVcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO1FBQzNDLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDekIsT0FBTyxNQUFjLENBQUE7SUFDdkIsQ0FBQztJQUVELFNBQVMsQ0FBQyxHQUFPLEVBQUUsVUFBa0I7UUFDbkMsT0FBTyxDQUNMLE9BQU8sR0FBRyxLQUFLLFdBQVc7WUFDMUIsT0FBTyxVQUFVLEtBQUssV0FBVztZQUNqQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLFVBQVUsWUFBWSxlQUFNLENBQzdCLENBQUE7SUFDSCxDQUFDO0NBaTNCRjtBQXQ4QkQsMEJBczhCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1BWFZNLVVUWE9zXG4gKi9cbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJidWZmZXIvXCJcbmltcG9ydCBCaW5Ub29scyBmcm9tIFwiLi4vLi4vdXRpbHMvYmludG9vbHNcIlxuaW1wb3J0IEJOIGZyb20gXCJibi5qc1wiXG5pbXBvcnQge1xuICBBbW91bnRPdXRwdXQsXG4gIFNlbGVjdE91dHB1dENsYXNzLFxuICBUcmFuc2ZlcmFibGVPdXRwdXQsXG4gIE5GVFRyYW5zZmVyT3V0cHV0LFxuICBORlRNaW50T3V0cHV0LFxuICBTRUNQTWludE91dHB1dCxcbiAgU0VDUFRyYW5zZmVyT3V0cHV0XG59IGZyb20gXCIuL291dHB1dHNcIlxuaW1wb3J0IHsgQVhWTUNvbnN0YW50cyB9IGZyb20gXCIuL2NvbnN0YW50c1wiXG5pbXBvcnQgeyBVbnNpZ25lZFR4IH0gZnJvbSBcIi4vdHhcIlxuaW1wb3J0IHsgU0VDUFRyYW5zZmVySW5wdXQsIFRyYW5zZmVyYWJsZUlucHV0IH0gZnJvbSBcIi4vaW5wdXRzXCJcbmltcG9ydCB7XG4gIE5GVFRyYW5zZmVyT3BlcmF0aW9uLFxuICBUcmFuc2ZlcmFibGVPcGVyYXRpb24sXG4gIE5GVE1pbnRPcGVyYXRpb24sXG4gIFNFQ1BNaW50T3BlcmF0aW9uXG59IGZyb20gXCIuL29wc1wiXG5pbXBvcnQgeyBPdXRwdXQsIE91dHB1dE93bmVycyB9IGZyb20gXCIuLi8uLi9jb21tb24vb3V0cHV0XCJcbmltcG9ydCB7IFVuaXhOb3cgfSBmcm9tIFwiLi4vLi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zXCJcbmltcG9ydCB7IEluaXRpYWxTdGF0ZXMgfSBmcm9tIFwiLi9pbml0aWFsc3RhdGVzXCJcbmltcG9ydCB7IE1pbnRlclNldCB9IGZyb20gXCIuL21pbnRlcnNldFwiXG5pbXBvcnQgeyBTdGFuZGFyZFVUWE8sIFN0YW5kYXJkVVRYT1NldCB9IGZyb20gXCIuLi8uLi9jb21tb24vdXR4b3NcIlxuaW1wb3J0IHsgQ3JlYXRlQXNzZXRUeCB9IGZyb20gXCIuL2NyZWF0ZWFzc2V0dHhcIlxuaW1wb3J0IHsgT3BlcmF0aW9uVHggfSBmcm9tIFwiLi9vcGVyYXRpb250eFwiXG5pbXBvcnQgeyBCYXNlVHggfSBmcm9tIFwiLi9iYXNldHhcIlxuaW1wb3J0IHsgRXhwb3J0VHggfSBmcm9tIFwiLi9leHBvcnR0eFwiXG5pbXBvcnQgeyBJbXBvcnRUeCB9IGZyb20gXCIuL2ltcG9ydHR4XCJcbmltcG9ydCB7IFBsYXRmb3JtQ2hhaW5JRCB9IGZyb20gXCIuLi8uLi91dGlscy9jb25zdGFudHNcIlxuaW1wb3J0IHtcbiAgU3RhbmRhcmRBc3NldEFtb3VudERlc3RpbmF0aW9uLFxuICBBc3NldEFtb3VudFxufSBmcm9tIFwiLi4vLi4vY29tbW9uL2Fzc2V0YW1vdW50XCJcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gXCIuLi8uLi91dGlscy9zZXJpYWxpemF0aW9uXCJcbmltcG9ydCB7XG4gIFVUWE9FcnJvcixcbiAgQWRkcmVzc0Vycm9yLFxuICBJbnN1ZmZpY2llbnRGdW5kc0Vycm9yLFxuICBUaHJlc2hvbGRFcnJvcixcbiAgU0VDUE1pbnRPdXRwdXRFcnJvclxufSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcbmNvbnN0IHNlcmlhbGl6YXRpb246IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcblxuLyoqXG4gKiBDbGFzcyBmb3IgcmVwcmVzZW50aW5nIGEgc2luZ2xlIFVUWE8uXG4gKi9cbmV4cG9ydCBjbGFzcyBVVFhPIGV4dGVuZHMgU3RhbmRhcmRVVFhPIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVVRYT1wiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXG5cbiAgLy9zZXJpYWxpemUgaXMgaW5oZXJpdGVkXG5cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKGZpZWxkc1tcIm91dHB1dFwiXVtcIl90eXBlSURcIl0pXG4gICAgdGhpcy5vdXRwdXQuZGVzZXJpYWxpemUoZmllbGRzW1wib3V0cHV0XCJdLCBlbmNvZGluZylcbiAgfVxuXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICB0aGlzLmNvZGVjSUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyKVxuICAgIG9mZnNldCArPSAyXG4gICAgdGhpcy50eGlkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXG4gICAgb2Zmc2V0ICs9IDMyXG4gICAgdGhpcy5vdXRwdXRpZHggPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgIG9mZnNldCArPSA0XG4gICAgdGhpcy5hc3NldElEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXG4gICAgb2Zmc2V0ICs9IDMyXG4gICAgY29uc3Qgb3V0cHV0aWQ6IG51bWJlciA9IGJpbnRvb2xzXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICAgIC5yZWFkVUludDMyQkUoMClcbiAgICBvZmZzZXQgKz0gNFxuICAgIHRoaXMub3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3Mob3V0cHV0aWQpXG4gICAgcmV0dXJuIHRoaXMub3V0cHV0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIGJhc2UtNTggc3RyaW5nIGNvbnRhaW5pbmcgYSBbW1VUWE9dXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBTdGFuZGFyZFVUWE8gaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBzZXJpYWxpemVkIEEgYmFzZS01OCBzdHJpbmcgY29udGFpbmluZyBhIHJhdyBbW1VUWE9dXVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tVVFhPXV1cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogdW5saWtlIG1vc3QgZnJvbVN0cmluZ3MsIGl0IGV4cGVjdHMgdGhlIHN0cmluZyB0byBiZSBzZXJpYWxpemVkIGluIGNiNTggZm9ybWF0XG4gICAqL1xuICBmcm9tU3RyaW5nKHNlcmlhbGl6ZWQ6IHN0cmluZyk6IG51bWJlciB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICByZXR1cm4gdGhpcy5mcm9tQnVmZmVyKGJpbnRvb2xzLmNiNThEZWNvZGUoc2VyaWFsaXplZCkpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGJhc2UtNTggcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbVVRYT11dLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiB1bmxpa2UgbW9zdCB0b1N0cmluZ3MsIHRoaXMgcmV0dXJucyBpbiBjYjU4IHNlcmlhbGl6YXRpb24gZm9ybWF0XG4gICAqL1xuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgcmV0dXJuIGJpbnRvb2xzLmNiNThFbmNvZGUodGhpcy50b0J1ZmZlcigpKVxuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgY29uc3QgdXR4bzogVVRYTyA9IG5ldyBVVFhPKClcbiAgICB1dHhvLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxuICAgIHJldHVybiB1dHhvIGFzIHRoaXNcbiAgfVxuXG4gIGNyZWF0ZShcbiAgICBjb2RlY0lEOiBudW1iZXIgPSBBWFZNQ29uc3RhbnRzLkxBVEVTVENPREVDLFxuICAgIHR4aWQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBvdXRwdXRpZHg6IEJ1ZmZlciB8IG51bWJlciA9IHVuZGVmaW5lZCxcbiAgICBhc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgb3V0cHV0OiBPdXRwdXQgPSB1bmRlZmluZWRcbiAgKTogdGhpcyB7XG4gICAgcmV0dXJuIG5ldyBVVFhPKGNvZGVjSUQsIHR4aWQsIG91dHB1dGlkeCwgYXNzZXRJRCwgb3V0cHV0KSBhcyB0aGlzXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFzc2V0QW1vdW50RGVzdGluYXRpb24gZXh0ZW5kcyBTdGFuZGFyZEFzc2V0QW1vdW50RGVzdGluYXRpb248XG4gIFRyYW5zZmVyYWJsZU91dHB1dCxcbiAgVHJhbnNmZXJhYmxlSW5wdXRcbj4ge31cblxuLyoqXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYSBzZXQgb2YgW1tVVFhPXV1zLlxuICovXG5leHBvcnQgY2xhc3MgVVRYT1NldCBleHRlbmRzIFN0YW5kYXJkVVRYT1NldDxVVFhPPiB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlVUWE9TZXRcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIC8vc2VyaWFsaXplIGlzIGluaGVyaXRlZFxuXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgbGV0IHV0eG9zID0ge31cbiAgICBmb3IgKGxldCB1dHhvaWQgaW4gZmllbGRzW1widXR4b3NcIl0pIHtcbiAgICAgIGxldCB1dHhvaWRDbGVhbmVkOiBzdHJpbmcgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICAgIHV0eG9pZCxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIFwiYmFzZTU4XCIsXG4gICAgICAgIFwiYmFzZTU4XCJcbiAgICAgIClcbiAgICAgIHV0eG9zW2Ake3V0eG9pZENsZWFuZWR9YF0gPSBuZXcgVVRYTygpXG4gICAgICB1dHhvc1tgJHt1dHhvaWRDbGVhbmVkfWBdLmRlc2VyaWFsaXplKFxuICAgICAgICBmaWVsZHNbXCJ1dHhvc1wiXVtgJHt1dHhvaWR9YF0sXG4gICAgICAgIGVuY29kaW5nXG4gICAgICApXG4gICAgfVxuICAgIGxldCBhZGRyZXNzVVRYT3MgPSB7fVxuICAgIGZvciAobGV0IGFkZHJlc3MgaW4gZmllbGRzW1wiYWRkcmVzc1VUWE9zXCJdKSB7XG4gICAgICBsZXQgYWRkcmVzc0NsZWFuZWQ6IHN0cmluZyA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcbiAgICAgICAgYWRkcmVzcyxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIFwiY2I1OFwiLFxuICAgICAgICBcImhleFwiXG4gICAgICApXG4gICAgICBsZXQgdXR4b2JhbGFuY2U6IHt9ID0ge31cbiAgICAgIGZvciAobGV0IHV0eG9pZCBpbiBmaWVsZHNbXCJhZGRyZXNzVVRYT3NcIl1bYCR7YWRkcmVzc31gXSkge1xuICAgICAgICBsZXQgdXR4b2lkQ2xlYW5lZDogc3RyaW5nID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgICAgIHV0eG9pZCxcbiAgICAgICAgICBlbmNvZGluZyxcbiAgICAgICAgICBcImJhc2U1OFwiLFxuICAgICAgICAgIFwiYmFzZTU4XCJcbiAgICAgICAgKVxuICAgICAgICB1dHhvYmFsYW5jZVtgJHt1dHhvaWRDbGVhbmVkfWBdID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgICAgIGZpZWxkc1tcImFkZHJlc3NVVFhPc1wiXVtgJHthZGRyZXNzfWBdW2Ake3V0eG9pZH1gXSxcbiAgICAgICAgICBlbmNvZGluZyxcbiAgICAgICAgICBcImRlY2ltYWxTdHJpbmdcIixcbiAgICAgICAgICBcIkJOXCJcbiAgICAgICAgKVxuICAgICAgfVxuICAgICAgYWRkcmVzc1VUWE9zW2Ake2FkZHJlc3NDbGVhbmVkfWBdID0gdXR4b2JhbGFuY2VcbiAgICB9XG4gICAgdGhpcy51dHhvcyA9IHV0eG9zXG4gICAgdGhpcy5hZGRyZXNzVVRYT3MgPSBhZGRyZXNzVVRYT3NcbiAgfVxuXG4gIHBhcnNlVVRYTyh1dHhvOiBVVFhPIHwgc3RyaW5nKTogVVRYTyB7XG4gICAgY29uc3QgdXR4b3ZhcjogVVRYTyA9IG5ldyBVVFhPKClcbiAgICAvLyBmb3JjZSBhIGNvcHlcbiAgICBpZiAodHlwZW9mIHV0eG8gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHV0eG92YXIuZnJvbUJ1ZmZlcihiaW50b29scy5jYjU4RGVjb2RlKHV0eG8pKVxuICAgIH0gZWxzZSBpZiAodXR4byBpbnN0YW5jZW9mIFVUWE8pIHtcbiAgICAgIHV0eG92YXIuZnJvbUJ1ZmZlcih1dHhvLnRvQnVmZmVyKCkpIC8vIGZvcmNlcyBhIGNvcHlcbiAgICB9IGVsc2Uge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBVVFhPRXJyb3IoXG4gICAgICAgIFwiRXJyb3IgLSBVVFhPLnBhcnNlVVRYTzogdXR4byBwYXJhbWV0ZXIgaXMgbm90IGEgVVRYTyBvciBzdHJpbmdcIlxuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gdXR4b3ZhclxuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6IGFueVtdKTogdGhpcyB7XG4gICAgcmV0dXJuIG5ldyBVVFhPU2V0KCkgYXMgdGhpc1xuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgY29uc3QgbmV3c2V0OiBVVFhPU2V0ID0gdGhpcy5jcmVhdGUoKVxuICAgIGNvbnN0IGFsbFVUWE9zOiBVVFhPW10gPSB0aGlzLmdldEFsbFVUWE9zKClcbiAgICBuZXdzZXQuYWRkQXJyYXkoYWxsVVRYT3MpXG4gICAgcmV0dXJuIG5ld3NldCBhcyB0aGlzXG4gIH1cblxuICBfZmVlQ2hlY2soZmVlOiBCTiwgZmVlQXNzZXRJRDogQnVmZmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgIHR5cGVvZiBmZWUgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgIHR5cGVvZiBmZWVBc3NldElEICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICBmZWUuZ3QobmV3IEJOKDApKSAmJlxuICAgICAgZmVlQXNzZXRJRCBpbnN0YW5jZW9mIEJ1ZmZlclxuICAgIClcbiAgfVxuXG4gIGdldE1pbmltdW1TcGVuZGFibGUgPSAoXG4gICAgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogRXJyb3IgPT4ge1xuICAgIGNvbnN0IHV0eG9BcnJheTogVVRYT1tdID0gdGhpcy5nZXRBbGxVVFhPcygpXG4gICAgY29uc3Qgb3V0aWRzOiBvYmplY3QgPSB7fVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB1dHhvQXJyYXkubGVuZ3RoICYmICFhYWQuY2FuQ29tcGxldGUoKTsgaSsrKSB7XG4gICAgICBjb25zdCB1OiBVVFhPID0gdXR4b0FycmF5W2Ake2l9YF1cbiAgICAgIGNvbnN0IGFzc2V0S2V5OiBzdHJpbmcgPSB1LmdldEFzc2V0SUQoKS50b1N0cmluZyhcImhleFwiKVxuICAgICAgY29uc3QgZnJvbUFkZHJlc3NlczogQnVmZmVyW10gPSBhYWQuZ2V0U2VuZGVycygpXG4gICAgICBpZiAoXG4gICAgICAgIHUuZ2V0T3V0cHV0KCkgaW5zdGFuY2VvZiBBbW91bnRPdXRwdXQgJiZcbiAgICAgICAgYWFkLmFzc2V0RXhpc3RzKGFzc2V0S2V5KSAmJlxuICAgICAgICB1LmdldE91dHB1dCgpLm1lZXRzVGhyZXNob2xkKGZyb21BZGRyZXNzZXMsIGFzT2YpXG4gICAgICApIHtcbiAgICAgICAgY29uc3QgYW06IEFzc2V0QW1vdW50ID0gYWFkLmdldEFzc2V0QW1vdW50KGFzc2V0S2V5KVxuICAgICAgICBpZiAoIWFtLmlzRmluaXNoZWQoKSkge1xuICAgICAgICAgIGNvbnN0IHVvdXQ6IEFtb3VudE91dHB1dCA9IHUuZ2V0T3V0cHV0KCkgYXMgQW1vdW50T3V0cHV0XG4gICAgICAgICAgb3V0aWRzW2Ake2Fzc2V0S2V5fWBdID0gdW91dC5nZXRPdXRwdXRJRCgpXG4gICAgICAgICAgY29uc3QgYW1vdW50ID0gdW91dC5nZXRBbW91bnQoKVxuICAgICAgICAgIGFtLnNwZW5kQW1vdW50KGFtb3VudClcbiAgICAgICAgICBjb25zdCB0eGlkOiBCdWZmZXIgPSB1LmdldFR4SUQoKVxuICAgICAgICAgIGNvbnN0IG91dHB1dGlkeDogQnVmZmVyID0gdS5nZXRPdXRwdXRJZHgoKVxuICAgICAgICAgIGNvbnN0IGlucHV0OiBTRUNQVHJhbnNmZXJJbnB1dCA9IG5ldyBTRUNQVHJhbnNmZXJJbnB1dChhbW91bnQpXG4gICAgICAgICAgY29uc3QgeGZlcmluOiBUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dChcbiAgICAgICAgICAgIHR4aWQsXG4gICAgICAgICAgICBvdXRwdXRpZHgsXG4gICAgICAgICAgICB1LmdldEFzc2V0SUQoKSxcbiAgICAgICAgICAgIGlucHV0XG4gICAgICAgICAgKVxuICAgICAgICAgIGNvbnN0IHNwZW5kZXJzOiBCdWZmZXJbXSA9IHVvdXQuZ2V0U3BlbmRlcnMoZnJvbUFkZHJlc3NlcywgYXNPZilcbiAgICAgICAgICBmb3IgKGxldCBqOiBudW1iZXIgPSAwOyBqIDwgc3BlbmRlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGlkeDogbnVtYmVyID0gdW91dC5nZXRBZGRyZXNzSWR4KHNwZW5kZXJzW2Ake2p9YF0pXG4gICAgICAgICAgICBpZiAoaWR4ID09PSAtMSkge1xuICAgICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxuICAgICAgICAgICAgICAgIFwiRXJyb3IgLSBVVFhPU2V0LmdldE1pbmltdW1TcGVuZGFibGU6IG5vIHN1Y2ggXCIgK1xuICAgICAgICAgICAgICAgICAgYGFkZHJlc3MgaW4gb3V0cHV0OiAke3NwZW5kZXJzW2Ake2p9YF19YFxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB4ZmVyaW4uZ2V0SW5wdXQoKS5hZGRTaWduYXR1cmVJZHgoaWR4LCBzcGVuZGVyc1tgJHtqfWBdKVxuICAgICAgICAgIH1cbiAgICAgICAgICBhYWQuYWRkSW5wdXQoeGZlcmluKVxuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIGFhZC5hc3NldEV4aXN0cyhhc3NldEtleSkgJiZcbiAgICAgICAgICAhKHUuZ2V0T3V0cHV0KCkgaW5zdGFuY2VvZiBBbW91bnRPdXRwdXQpXG4gICAgICAgICkge1xuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIExlYXZpbmcgdGhlIGJlbG93IGxpbmVzLCBub3Qgc2ltcGx5IGZvciBwb3N0ZXJpdHksIGJ1dCBmb3IgY2xhcmlmaWNhdGlvbi5cbiAgICAgICAgICAgKiBBc3NldElEcyBtYXkgaGF2ZSBtaXhlZCBPdXRwdXRUeXBlcy5cbiAgICAgICAgICAgKiBTb21lIG9mIHRob3NlIE91dHB1dFR5cGVzIG1heSBpbXBsZW1lbnQgQW1vdW50T3V0cHV0LlxuICAgICAgICAgICAqIE90aGVycyBtYXkgbm90LlxuICAgICAgICAgICAqIFNpbXBseSBjb250aW51ZSBpbiB0aGlzIGNvbmRpdGlvbi5cbiAgICAgICAgICAgKi9cbiAgICAgICAgICAvKnJldHVybiBuZXcgRXJyb3IoJ0Vycm9yIC0gVVRYT1NldC5nZXRNaW5pbXVtU3BlbmRhYmxlOiBvdXRwdXRJRCBkb2VzIG5vdCAnXG4gICAgICAgICAgICArIGBpbXBsZW1lbnQgQW1vdW50T3V0cHV0OiAke3UuZ2V0T3V0cHV0KCkuZ2V0T3V0cHV0SUR9YCkqL1xuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFhYWQuY2FuQ29tcGxldGUoKSkge1xuICAgICAgcmV0dXJuIG5ldyBJbnN1ZmZpY2llbnRGdW5kc0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gVVRYT1NldC5nZXRNaW5pbXVtU3BlbmRhYmxlOiBpbnN1ZmZpY2llbnQgXCIgK1xuICAgICAgICAgIFwiZnVuZHMgdG8gY3JlYXRlIHRoZSB0cmFuc2FjdGlvblwiXG4gICAgICApXG4gICAgfVxuICAgIGNvbnN0IGFtb3VudHM6IEFzc2V0QW1vdW50W10gPSBhYWQuZ2V0QW1vdW50cygpXG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgYW1vdW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYXNzZXRLZXk6IHN0cmluZyA9IGFtb3VudHNbYCR7aX1gXS5nZXRBc3NldElEU3RyaW5nKClcbiAgICAgIGNvbnN0IGFtb3VudDogQk4gPSBhbW91bnRzW2Ake2l9YF0uZ2V0QW1vdW50KClcbiAgICAgIGlmIChhbW91bnQuZ3QoemVybykpIHtcbiAgICAgICAgY29uc3Qgc3BlbmRvdXQ6IEFtb3VudE91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKFxuICAgICAgICAgIG91dGlkc1tgJHthc3NldEtleX1gXSxcbiAgICAgICAgICBhbW91bnQsXG4gICAgICAgICAgYWFkLmdldERlc3RpbmF0aW9ucygpLFxuICAgICAgICAgIGxvY2t0aW1lLFxuICAgICAgICAgIHRocmVzaG9sZFxuICAgICAgICApIGFzIEFtb3VudE91dHB1dFxuICAgICAgICBjb25zdCB4ZmVyb3V0OiBUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KFxuICAgICAgICAgIGFtb3VudHNbYCR7aX1gXS5nZXRBc3NldElEKCksXG4gICAgICAgICAgc3BlbmRvdXRcbiAgICAgICAgKVxuICAgICAgICBhYWQuYWRkT3V0cHV0KHhmZXJvdXQpXG4gICAgICB9XG4gICAgICBjb25zdCBjaGFuZ2U6IEJOID0gYW1vdW50c1tgJHtpfWBdLmdldENoYW5nZSgpXG4gICAgICBpZiAoY2hhbmdlLmd0KHplcm8pKSB7XG4gICAgICAgIGNvbnN0IGNoYW5nZW91dDogQW1vdW50T3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3MoXG4gICAgICAgICAgb3V0aWRzW2Ake2Fzc2V0S2V5fWBdLFxuICAgICAgICAgIGNoYW5nZSxcbiAgICAgICAgICBhYWQuZ2V0Q2hhbmdlQWRkcmVzc2VzKClcbiAgICAgICAgKSBhcyBBbW91bnRPdXRwdXRcbiAgICAgICAgY29uc3QgY2hneGZlcm91dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChcbiAgICAgICAgICBhbW91bnRzW2Ake2l9YF0uZ2V0QXNzZXRJRCgpLFxuICAgICAgICAgIGNoYW5nZW91dFxuICAgICAgICApXG4gICAgICAgIGFhZC5hZGRDaGFuZ2UoY2hneGZlcm91dClcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gW1tVbnNpZ25lZFR4XV0gd3JhcHBpbmcgYSBbW0Jhc2VUeF1dLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSB3cmFwcGluZyBhIFtbQmFzZVR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zIGFuZCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcykuXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgVGhlIG51bWJlciByZXByZXNlbnRpbmcgTmV0d29ya0lEIG9mIHRoZSBub2RlXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgQmxvY2tjaGFpbklEIGZvciB0aGUgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIGFtb3VudCBUaGUgYW1vdW50IG9mIHRoZSBhc3NldCB0byBiZSBzcGVudCBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfS5cbiAgICogQHBhcmFtIGFzc2V0SUQge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb2YgdGhlIGFzc2V0IElEIGZvciB0aGUgVVRYT1xuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0byBzZW5kIHRoZSBmdW5kc1xuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBPcHRpb25hbC4gVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy4gRGVmYXVsdDogdG9BZGRyZXNzZXNcbiAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZC4gRGVmYXVsdDogYXNzZXRJRFxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbC4gQ29udGFpbnMgYXJiaXRyYXJ5IGRhdGEsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKi9cbiAgYnVpbGRCYXNlVHggPSAoXG4gICAgbmV0d29ya0lEOiBudW1iZXIsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIsXG4gICAgYW1vdW50OiBCTixcbiAgICBhc3NldElEOiBCdWZmZXIsXG4gICAgdG9BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGZyb21BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGNoYW5nZUFkZHJlc3NlczogQnVmZmVyW10gPSB1bmRlZmluZWQsXG4gICAgZmVlOiBCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogVW5zaWduZWRUeCA9PiB7XG4gICAgaWYgKHRocmVzaG9sZCA+IHRvQWRkcmVzc2VzLmxlbmd0aCkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBUaHJlc2hvbGRFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIFVUWE9TZXQuYnVpbGRCYXNlVHg6IHRocmVzaG9sZCBpcyBncmVhdGVyIHRoYW4gbnVtYmVyIG9mIGFkZHJlc3Nlc1wiXG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjaGFuZ2VBZGRyZXNzZXMgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyA9IHRvQWRkcmVzc2VzXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBmZWVBc3NldElEID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBmZWVBc3NldElEID0gYXNzZXRJRFxuICAgIH1cblxuICAgIGNvbnN0IHplcm86IEJOID0gbmV3IEJOKDApXG5cbiAgICBpZiAoYW1vdW50LmVxKHplcm8pKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgY29uc3QgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24oXG4gICAgICB0b0FkZHJlc3NlcyxcbiAgICAgIGZyb21BZGRyZXNzZXMsXG4gICAgICBjaGFuZ2VBZGRyZXNzZXNcbiAgICApXG4gICAgaWYgKGFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikgPT09IGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikpIHtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChhc3NldElELCBhbW91bnQsIGZlZSlcbiAgICB9IGVsc2Uge1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGFzc2V0SUQsIGFtb3VudCwgemVybylcbiAgICAgIGlmICh0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKSB7XG4gICAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpXG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGluczogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IFtdXG4gICAgbGV0IG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gW11cblxuICAgIGNvbnN0IHN1Y2Nlc3M6IEVycm9yID0gdGhpcy5nZXRNaW5pbXVtU3BlbmRhYmxlKFxuICAgICAgYWFkLFxuICAgICAgYXNPZixcbiAgICAgIGxvY2t0aW1lLFxuICAgICAgdGhyZXNob2xkXG4gICAgKVxuICAgIGlmICh0eXBlb2Ygc3VjY2VzcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaW5zID0gYWFkLmdldElucHV0cygpXG4gICAgICBvdXRzID0gYWFkLmdldEFsbE91dHB1dHMoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBzdWNjZXNzXG4gICAgfVxuXG4gICAgY29uc3QgYmFzZVR4OiBCYXNlVHggPSBuZXcgQmFzZVR4KG5ldHdvcmtJRCwgYmxvY2tjaGFpbklELCBvdXRzLCBpbnMsIG1lbW8pXG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KGJhc2VUeClcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIENyZWF0ZSBBc3NldCB0cmFuc2FjdGlvbi4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tDcmVhdGVBc3NldFRYXV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcykuXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgVGhlIG51bWJlciByZXByZXNlbnRpbmcgTmV0d29ya0lEIG9mIHRoZSBub2RlXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgQmxvY2tjaGFpbklEIGZvciB0aGUgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgT3B0aW9uYWwuIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIGluaXRpYWxTdGF0ZSBUaGUgW1tJbml0aWFsU3RhdGVzXV0gdGhhdCByZXByZXNlbnQgdGhlIGludGlhbCBzdGF0ZSBvZiBhIGNyZWF0ZWQgYXNzZXRcbiAgICogQHBhcmFtIG5hbWUgU3RyaW5nIGZvciB0aGUgZGVzY3JpcHRpdmUgbmFtZSBvZiB0aGUgYXNzZXRcbiAgICogQHBhcmFtIHN5bWJvbCBTdHJpbmcgZm9yIHRoZSB0aWNrZXIgc3ltYm9sIG9mIHRoZSBhc3NldFxuICAgKiBAcGFyYW0gZGVub21pbmF0aW9uIE9wdGlvbmFsIG51bWJlciBmb3IgdGhlIGRlbm9taW5hdGlvbiB3aGljaCBpcyAxMF5ELiBEIG11c3QgYmUgPj0gMCBhbmQgPD0gMzIuIEV4OiAkMSBBWEMgPSAxMF45ICRuQVhDXG4gICAqIEBwYXJhbSBtaW50T3V0cHV0cyBPcHRpb25hbC4gQXJyYXkgb2YgW1tTRUNQTWludE91dHB1dF1dcyB0byBiZSBpbmNsdWRlZCBpbiB0aGUgdHJhbnNhY3Rpb24uIFRoZXNlIG91dHB1dHMgY2FuIGJlIHNwZW50IHRvIG1pbnQgbW9yZSB0b2tlbnMuXG4gICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAqXG4gICAqL1xuICBidWlsZENyZWF0ZUFzc2V0VHggPSAoXG4gICAgbmV0d29ya0lEOiBudW1iZXIsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIsXG4gICAgZnJvbUFkZHJlc3NlczogQnVmZmVyW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBCdWZmZXJbXSxcbiAgICBpbml0aWFsU3RhdGU6IEluaXRpYWxTdGF0ZXMsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHN5bWJvbDogc3RyaW5nLFxuICAgIGRlbm9taW5hdGlvbjogbnVtYmVyLFxuICAgIG1pbnRPdXRwdXRzOiBTRUNQTWludE91dHB1dFtdID0gdW5kZWZpbmVkLFxuICAgIGZlZTogQk4gPSB1bmRlZmluZWQsXG4gICAgZmVlQXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKVxuICApOiBVbnNpZ25lZFR4ID0+IHtcbiAgICBjb25zdCB6ZXJvOiBCTiA9IG5ldyBCTigwKVxuICAgIGxldCBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSBbXVxuICAgIGxldCBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdXG5cbiAgICBpZiAodGhpcy5fZmVlQ2hlY2soZmVlLCBmZWVBc3NldElEKSkge1xuICAgICAgY29uc3QgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24oXG4gICAgICAgIGZyb21BZGRyZXNzZXMsXG4gICAgICAgIGZyb21BZGRyZXNzZXMsXG4gICAgICAgIGNoYW5nZUFkZHJlc3Nlc1xuICAgICAgKVxuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGZlZUFzc2V0SUQsIHplcm8sIGZlZSlcbiAgICAgIGNvbnN0IHN1Y2Nlc3M6IEVycm9yID0gdGhpcy5nZXRNaW5pbXVtU3BlbmRhYmxlKGFhZCwgYXNPZilcbiAgICAgIGlmICh0eXBlb2Ygc3VjY2VzcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpbnMgPSBhYWQuZ2V0SW5wdXRzKClcbiAgICAgICAgb3V0cyA9IGFhZC5nZXRBbGxPdXRwdXRzKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHN1Y2Nlc3NcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHR5cGVvZiBtaW50T3V0cHV0cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IG1pbnRPdXRwdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChtaW50T3V0cHV0c1tgJHtpfWBdIGluc3RhbmNlb2YgU0VDUE1pbnRPdXRwdXQpIHtcbiAgICAgICAgICBpbml0aWFsU3RhdGUuYWRkT3V0cHV0KG1pbnRPdXRwdXRzW2Ake2l9YF0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFNFQ1BNaW50T3V0cHV0RXJyb3IoXG4gICAgICAgICAgICBcIkVycm9yIC0gVVRYT1NldC5idWlsZENyZWF0ZUFzc2V0VHg6IEEgc3VibWl0dGVkIG1pbnRPdXRwdXQgd2FzIG5vdCBvZiB0eXBlIFNFQ1BNaW50T3V0cHV0XCJcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgQ0F0eDogQ3JlYXRlQXNzZXRUeCA9IG5ldyBDcmVhdGVBc3NldFR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgb3V0cyxcbiAgICAgIGlucyxcbiAgICAgIG1lbW8sXG4gICAgICBuYW1lLFxuICAgICAgc3ltYm9sLFxuICAgICAgZGVub21pbmF0aW9uLFxuICAgICAgaW5pdGlhbFN0YXRlXG4gICAgKVxuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChDQXR4KVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gdW5zaWduZWQgU2VjcCBtaW50IHRyYW5zYWN0aW9uLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW09wZXJhdGlvblR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zLCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcywgYW5kIFtbVHJhbnNmZXJPcGVyYXRpb25dXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya0lEIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIE5ldHdvcmtJRCBvZiB0aGUgbm9kZVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEJsb2NrY2hhaW5JRCBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBtaW50T3duZXIgQSBbW1NFQ1BNaW50T3V0cHV0XV0gd2hpY2ggc3BlY2lmaWVzIHRoZSBuZXcgc2V0IG9mIG1pbnRlcnNcbiAgICogQHBhcmFtIHRyYW5zZmVyT3duZXIgQSBbW1NFQ1BUcmFuc2Zlck91dHB1dF1dIHdoaWNoIHNwZWNpZmllcyB3aGVyZSB0aGUgbWludGVkIHRva2VucyB3aWxsIGdvXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3NcbiAgICogQHBhcmFtIG1pbnRVVFhPSUQgVGhlIFVUWE9JRCBmb3IgdGhlIFtbU0NQTWludE91dHB1dF1dIGJlaW5nIHNwZW50IHRvIHByb2R1Y2UgbW9yZSB0b2tlbnNcbiAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZC5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICovXG4gIGJ1aWxkU0VDUE1pbnRUeCA9IChcbiAgICBuZXR3b3JrSUQ6IG51bWJlcixcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlcixcbiAgICBtaW50T3duZXI6IFNFQ1BNaW50T3V0cHV0LFxuICAgIHRyYW5zZmVyT3duZXI6IFNFQ1BUcmFuc2Zlck91dHB1dCxcbiAgICBmcm9tQWRkcmVzc2VzOiBCdWZmZXJbXSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIG1pbnRVVFhPSUQ6IHN0cmluZyxcbiAgICBmZWU6IEJOID0gdW5kZWZpbmVkLFxuICAgIGZlZUFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KClcbiAgKTogVW5zaWduZWRUeCA9PiB7XG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcbiAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cbiAgICBsZXQgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxuXG4gICAgaWYgKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpIHtcbiAgICAgIGNvbnN0IGFhZDogQXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKFxuICAgICAgICBmcm9tQWRkcmVzc2VzLFxuICAgICAgICBmcm9tQWRkcmVzc2VzLFxuICAgICAgICBjaGFuZ2VBZGRyZXNzZXNcbiAgICAgIClcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpXG4gICAgICBjb25zdCBzdWNjZXNzOiBFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShhYWQsIGFzT2YpXG4gICAgICBpZiAodHlwZW9mIHN1Y2Nlc3MgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgaW5zID0gYWFkLmdldElucHV0cygpXG4gICAgICAgIG91dHMgPSBhYWQuZ2V0QWxsT3V0cHV0cygpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBzdWNjZXNzXG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IG9wczogVHJhbnNmZXJhYmxlT3BlcmF0aW9uW10gPSBbXVxuICAgIGxldCBtaW50T3A6IFNFQ1BNaW50T3BlcmF0aW9uID0gbmV3IFNFQ1BNaW50T3BlcmF0aW9uKFxuICAgICAgbWludE93bmVyLFxuICAgICAgdHJhbnNmZXJPd25lclxuICAgIClcblxuICAgIGxldCB1dHhvOiBVVFhPID0gdGhpcy5nZXRVVFhPKG1pbnRVVFhPSUQpXG4gICAgaWYgKHR5cGVvZiB1dHhvID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB0aHJvdyBuZXcgVVRYT0Vycm9yKFwiRXJyb3IgLSBVVFhPU2V0LmJ1aWxkU0VDUE1pbnRUeDogVVRYT0lEIG5vdCBmb3VuZFwiKVxuICAgIH1cbiAgICBpZiAodXR4by5nZXRPdXRwdXQoKS5nZXRPdXRwdXRJRCgpICE9PSBBWFZNQ29uc3RhbnRzLlNFQ1BNSU5UT1VUUFVUSUQpIHtcbiAgICAgIHRocm93IG5ldyBTRUNQTWludE91dHB1dEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gVVRYT1NldC5idWlsZFNFQ1BNaW50VHg6IFVUWE8gaXMgbm90IGEgU0VDUE1JTlRPVVRQVVRJRFwiXG4gICAgICApXG4gICAgfVxuICAgIGxldCBvdXQ6IFNFQ1BNaW50T3V0cHV0ID0gdXR4by5nZXRPdXRwdXQoKSBhcyBTRUNQTWludE91dHB1dFxuICAgIGxldCBzcGVuZGVyczogQnVmZmVyW10gPSBvdXQuZ2V0U3BlbmRlcnMoZnJvbUFkZHJlc3NlcywgYXNPZilcblxuICAgIGZvciAobGV0IGo6IG51bWJlciA9IDA7IGogPCBzcGVuZGVycy5sZW5ndGg7IGorKykge1xuICAgICAgbGV0IGlkeDogbnVtYmVyID0gb3V0LmdldEFkZHJlc3NJZHgoc3BlbmRlcnNbYCR7an1gXSlcbiAgICAgIGlmIChpZHggPT0gLTEpIHtcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIFwiRXJyb3IgLSBVVFhPU2V0LmJ1aWxkU0VDUE1pbnRUeDogbm8gc3VjaCBhZGRyZXNzIGluIG91dHB1dFwiXG4gICAgICAgIClcbiAgICAgIH1cbiAgICAgIG1pbnRPcC5hZGRTaWduYXR1cmVJZHgoaWR4LCBzcGVuZGVyc1tgJHtqfWBdKVxuICAgIH1cblxuICAgIGxldCB0cmFuc2ZlcmFibGVPcGVyYXRpb246IFRyYW5zZmVyYWJsZU9wZXJhdGlvbiA9XG4gICAgICBuZXcgVHJhbnNmZXJhYmxlT3BlcmF0aW9uKHV0eG8uZ2V0QXNzZXRJRCgpLCBbYCR7bWludFVUWE9JRH1gXSwgbWludE9wKVxuICAgIG9wcy5wdXNoKHRyYW5zZmVyYWJsZU9wZXJhdGlvbilcblxuICAgIGxldCBvcGVyYXRpb25UeDogT3BlcmF0aW9uVHggPSBuZXcgT3BlcmF0aW9uVHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBvdXRzLFxuICAgICAgaW5zLFxuICAgICAgbWVtbyxcbiAgICAgIG9wc1xuICAgIClcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgob3BlcmF0aW9uVHgpXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiB1bnNpZ25lZCBDcmVhdGUgQXNzZXQgdHJhbnNhY3Rpb24uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbQ3JlYXRlQXNzZXRUWF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMpLlxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya0lEIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIE5ldHdvcmtJRCBvZiB0aGUgbm9kZVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEJsb2NrY2hhaW5JRCBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIE9wdGlvbmFsLiBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zLlxuICAgKiBAcGFyYW0gbWludGVyU2V0cyBUaGUgbWludGVycyBhbmQgdGhyZXNob2xkcyByZXF1aXJlZCB0byBtaW50IHRoaXMgbmZ0IGFzc2V0XG4gICAqIEBwYXJhbSBuYW1lIFN0cmluZyBmb3IgdGhlIGRlc2NyaXB0aXZlIG5hbWUgb2YgdGhlIG5mdCBhc3NldFxuICAgKiBAcGFyYW0gc3ltYm9sIFN0cmluZyBmb3IgdGhlIHRpY2tlciBzeW1ib2wgb2YgdGhlIG5mdCBhc3NldFxuICAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLlxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgbWludCBvdXRwdXRcbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICpcbiAgICovXG4gIGJ1aWxkQ3JlYXRlTkZUQXNzZXRUeCA9IChcbiAgICBuZXR3b3JrSUQ6IG51bWJlcixcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlcixcbiAgICBmcm9tQWRkcmVzc2VzOiBCdWZmZXJbXSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIG1pbnRlclNldHM6IE1pbnRlclNldFtdLFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBzeW1ib2w6IHN0cmluZyxcbiAgICBmZWU6IEJOID0gdW5kZWZpbmVkLFxuICAgIGZlZUFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICAgbG9ja3RpbWU6IEJOID0gdW5kZWZpbmVkXG4gICk6IFVuc2lnbmVkVHggPT4ge1xuICAgIGNvbnN0IHplcm86IEJOID0gbmV3IEJOKDApXG4gICAgbGV0IGluczogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IFtdXG4gICAgbGV0IG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gW11cblxuICAgIGlmICh0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKSB7XG4gICAgICBjb25zdCBhYWQ6IEFzc2V0QW1vdW50RGVzdGluYXRpb24gPSBuZXcgQXNzZXRBbW91bnREZXN0aW5hdGlvbihcbiAgICAgICAgZnJvbUFkZHJlc3NlcyxcbiAgICAgICAgZnJvbUFkZHJlc3NlcyxcbiAgICAgICAgY2hhbmdlQWRkcmVzc2VzXG4gICAgICApXG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlKVxuICAgICAgY29uc3Qgc3VjY2VzczogRXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoYWFkLCBhc09mKVxuICAgICAgaWYgKHR5cGVvZiBzdWNjZXNzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKVxuICAgICAgICBvdXRzID0gYWFkLmdldEFsbE91dHB1dHMoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgc3VjY2Vzc1xuICAgICAgfVxuICAgIH1cbiAgICBsZXQgaW5pdGlhbFN0YXRlOiBJbml0aWFsU3RhdGVzID0gbmV3IEluaXRpYWxTdGF0ZXMoKVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBtaW50ZXJTZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgbmZ0TWludE91dHB1dDogTkZUTWludE91dHB1dCA9IG5ldyBORlRNaW50T3V0cHV0KFxuICAgICAgICBpLFxuICAgICAgICBtaW50ZXJTZXRzW2Ake2l9YF0uZ2V0TWludGVycygpLFxuICAgICAgICBsb2NrdGltZSxcbiAgICAgICAgbWludGVyU2V0c1tgJHtpfWBdLmdldFRocmVzaG9sZCgpXG4gICAgICApXG4gICAgICBpbml0aWFsU3RhdGUuYWRkT3V0cHV0KG5mdE1pbnRPdXRwdXQsIEFYVk1Db25zdGFudHMuTkZURlhJRClcbiAgICB9XG4gICAgbGV0IGRlbm9taW5hdGlvbjogbnVtYmVyID0gMCAvLyBORlRzIGFyZSBub24tZnVuZ2libGVcbiAgICBsZXQgQ0F0eDogQ3JlYXRlQXNzZXRUeCA9IG5ldyBDcmVhdGVBc3NldFR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgb3V0cyxcbiAgICAgIGlucyxcbiAgICAgIG1lbW8sXG4gICAgICBuYW1lLFxuICAgICAgc3ltYm9sLFxuICAgICAgZGVub21pbmF0aW9uLFxuICAgICAgaW5pdGlhbFN0YXRlXG4gICAgKVxuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChDQXR4KVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gdW5zaWduZWQgTkZUIG1pbnQgdHJhbnNhY3Rpb24uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbT3BlcmF0aW9uVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMsIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zLCBhbmQgW1tUcmFuc2Zlck9wZXJhdGlvbl1dcykuXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgVGhlIG51bWJlciByZXByZXNlbnRpbmcgTmV0d29ya0lEIG9mIHRoZSBub2RlXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgQmxvY2tjaGFpbklEIGZvciB0aGUgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIG93bmVycyBBbiBhcnJheSBvZiBbW091dHB1dE93bmVyc11dIHdobyB3aWxsIGJlIGdpdmVuIHRoZSBORlRzLlxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3NcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBPcHRpb25hbC4gVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy5cbiAgICogQHBhcmFtIHV0eG9pZHMgQW4gYXJyYXkgb2Ygc3RyaW5ncyBmb3IgdGhlIE5GVHMgYmVpbmcgdHJhbnNmZXJyZWRcbiAgICogQHBhcmFtIGdyb3VwSUQgT3B0aW9uYWwuIFRoZSBncm91cCB0aGlzIE5GVCBpcyBpc3N1ZWQgdG8uXG4gICAqIEBwYXJhbSBwYXlsb2FkIE9wdGlvbmFsLiBEYXRhIGZvciBORlQgUGF5bG9hZC5cbiAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZC5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICpcbiAgICovXG4gIGJ1aWxkQ3JlYXRlTkZUTWludFR4ID0gKFxuICAgIG5ldHdvcmtJRDogbnVtYmVyLFxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyLFxuICAgIG93bmVyczogT3V0cHV0T3duZXJzW10sXG4gICAgZnJvbUFkZHJlc3NlczogQnVmZmVyW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBCdWZmZXJbXSxcbiAgICB1dHhvaWRzOiBzdHJpbmdbXSxcbiAgICBncm91cElEOiBudW1iZXIgPSAwLFxuICAgIHBheWxvYWQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBmZWU6IEJOID0gdW5kZWZpbmVkLFxuICAgIGZlZUFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KClcbiAgKTogVW5zaWduZWRUeCA9PiB7XG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcbiAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cbiAgICBsZXQgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxuXG4gICAgaWYgKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpIHtcbiAgICAgIGNvbnN0IGFhZDogQXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKFxuICAgICAgICBmcm9tQWRkcmVzc2VzLFxuICAgICAgICBmcm9tQWRkcmVzc2VzLFxuICAgICAgICBjaGFuZ2VBZGRyZXNzZXNcbiAgICAgIClcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpXG4gICAgICBjb25zdCBzdWNjZXNzOiBFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShhYWQsIGFzT2YpXG4gICAgICBpZiAodHlwZW9mIHN1Y2Nlc3MgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgaW5zID0gYWFkLmdldElucHV0cygpXG4gICAgICAgIG91dHMgPSBhYWQuZ2V0QWxsT3V0cHV0cygpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBzdWNjZXNzXG4gICAgICB9XG4gICAgfVxuICAgIGxldCBvcHM6IFRyYW5zZmVyYWJsZU9wZXJhdGlvbltdID0gW11cblxuICAgIGxldCBuZnRNaW50T3BlcmF0aW9uOiBORlRNaW50T3BlcmF0aW9uID0gbmV3IE5GVE1pbnRPcGVyYXRpb24oXG4gICAgICBncm91cElELFxuICAgICAgcGF5bG9hZCxcbiAgICAgIG93bmVyc1xuICAgIClcblxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB1dHhvaWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgdXR4bzogVVRYTyA9IHRoaXMuZ2V0VVRYTyh1dHhvaWRzW2Ake2l9YF0pXG4gICAgICBsZXQgb3V0OiBORlRUcmFuc2Zlck91dHB1dCA9IHV0eG8uZ2V0T3V0cHV0KCkgYXMgTkZUVHJhbnNmZXJPdXRwdXRcbiAgICAgIGxldCBzcGVuZGVyczogQnVmZmVyW10gPSBvdXQuZ2V0U3BlbmRlcnMoZnJvbUFkZHJlc3NlcywgYXNPZilcblxuICAgICAgZm9yIChsZXQgajogbnVtYmVyID0gMDsgaiA8IHNwZW5kZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGxldCBpZHg6IG51bWJlclxuICAgICAgICBpZHggPSBvdXQuZ2V0QWRkcmVzc0lkeChzcGVuZGVyc1tgJHtqfWBdKVxuICAgICAgICBpZiAoaWR4ID09IC0xKSB7XG4gICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxuICAgICAgICAgICAgXCJFcnJvciAtIFVUWE9TZXQuYnVpbGRDcmVhdGVORlRNaW50VHg6IG5vIHN1Y2ggYWRkcmVzcyBpbiBvdXRwdXRcIlxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgICBuZnRNaW50T3BlcmF0aW9uLmFkZFNpZ25hdHVyZUlkeChpZHgsIHNwZW5kZXJzW2Ake2p9YF0pXG4gICAgICB9XG5cbiAgICAgIGxldCB0cmFuc2ZlcmFibGVPcGVyYXRpb246IFRyYW5zZmVyYWJsZU9wZXJhdGlvbiA9XG4gICAgICAgIG5ldyBUcmFuc2ZlcmFibGVPcGVyYXRpb24odXR4by5nZXRBc3NldElEKCksIHV0eG9pZHMsIG5mdE1pbnRPcGVyYXRpb24pXG4gICAgICBvcHMucHVzaCh0cmFuc2ZlcmFibGVPcGVyYXRpb24pXG4gICAgfVxuXG4gICAgbGV0IG9wZXJhdGlvblR4OiBPcGVyYXRpb25UeCA9IG5ldyBPcGVyYXRpb25UeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIG91dHMsXG4gICAgICBpbnMsXG4gICAgICBtZW1vLFxuICAgICAgb3BzXG4gICAgKVxuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChvcGVyYXRpb25UeClcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIE5GVCB0cmFuc2ZlciB0cmFuc2FjdGlvbi4gRm9yIG1vcmUgZ3JhbnVsYXIgY29udHJvbCwgeW91IG1heSBjcmVhdGUgeW91ciBvd25cbiAgICogW1tPcGVyYXRpb25UeF1dIG1hbnVhbGx5ICh3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcywgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXMsIGFuZCBbW1RyYW5zZmVyT3BlcmF0aW9uXV1zKS5cbiAgICpcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBUaGUgbnVtYmVyIHJlcHJlc2VudGluZyBOZXR3b3JrSUQgb2YgdGhlIG5vZGVcbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBCbG9ja2NoYWluSUQgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgQW4gYXJyYXkgb2Yge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1zIHdoaWNoIGluZGljYXRlIHdobyByZWNpZXZlcyB0aGUgTkZUXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIEFuIGFycmF5IGZvciB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gb3ducyB0aGUgTkZUXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgT3B0aW9uYWwuIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3MuXG4gICAqIEBwYXJhbSB1dHhvaWRzIEFuIGFycmF5IG9mIHN0cmluZ3MgZm9yIHRoZSBORlRzIGJlaW5nIHRyYW5zZmVycmVkXG4gICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBvdXRwdXRzXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAqXG4gICAqL1xuICBidWlsZE5GVFRyYW5zZmVyVHggPSAoXG4gICAgbmV0d29ya0lEOiBudW1iZXIsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIsXG4gICAgdG9BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGZyb21BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGNoYW5nZUFkZHJlc3NlczogQnVmZmVyW10sXG4gICAgdXR4b2lkczogc3RyaW5nW10sXG4gICAgZmVlOiBCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogVW5zaWduZWRUeCA9PiB7XG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcbiAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cbiAgICBsZXQgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxuXG4gICAgaWYgKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpIHtcbiAgICAgIGNvbnN0IGFhZDogQXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKFxuICAgICAgICBmcm9tQWRkcmVzc2VzLFxuICAgICAgICBmcm9tQWRkcmVzc2VzLFxuICAgICAgICBjaGFuZ2VBZGRyZXNzZXNcbiAgICAgIClcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpXG4gICAgICBjb25zdCBzdWNjZXNzOiBFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShhYWQsIGFzT2YpXG4gICAgICBpZiAodHlwZW9mIHN1Y2Nlc3MgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgaW5zID0gYWFkLmdldElucHV0cygpXG4gICAgICAgIG91dHMgPSBhYWQuZ2V0QWxsT3V0cHV0cygpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBzdWNjZXNzXG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IG9wczogVHJhbnNmZXJhYmxlT3BlcmF0aW9uW10gPSBbXVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCB1dHhvaWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCB1dHhvOiBVVFhPID0gdGhpcy5nZXRVVFhPKHV0eG9pZHNbYCR7aX1gXSlcblxuICAgICAgY29uc3Qgb3V0OiBORlRUcmFuc2Zlck91dHB1dCA9IHV0eG8uZ2V0T3V0cHV0KCkgYXMgTkZUVHJhbnNmZXJPdXRwdXRcbiAgICAgIGNvbnN0IHNwZW5kZXJzOiBCdWZmZXJbXSA9IG91dC5nZXRTcGVuZGVycyhmcm9tQWRkcmVzc2VzLCBhc09mKVxuXG4gICAgICBjb25zdCBvdXRib3VuZDogTkZUVHJhbnNmZXJPdXRwdXQgPSBuZXcgTkZUVHJhbnNmZXJPdXRwdXQoXG4gICAgICAgIG91dC5nZXRHcm91cElEKCksXG4gICAgICAgIG91dC5nZXRQYXlsb2FkKCksXG4gICAgICAgIHRvQWRkcmVzc2VzLFxuICAgICAgICBsb2NrdGltZSxcbiAgICAgICAgdGhyZXNob2xkXG4gICAgICApXG4gICAgICBjb25zdCBvcDogTkZUVHJhbnNmZXJPcGVyYXRpb24gPSBuZXcgTkZUVHJhbnNmZXJPcGVyYXRpb24ob3V0Ym91bmQpXG5cbiAgICAgIGZvciAobGV0IGo6IG51bWJlciA9IDA7IGogPCBzcGVuZGVycy5sZW5ndGg7IGorKykge1xuICAgICAgICBjb25zdCBpZHg6IG51bWJlciA9IG91dC5nZXRBZGRyZXNzSWR4KHNwZW5kZXJzW2Ake2p9YF0pXG4gICAgICAgIGlmIChpZHggPT09IC0xKSB7XG4gICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxuICAgICAgICAgICAgXCJFcnJvciAtIFVUWE9TZXQuYnVpbGRORlRUcmFuc2ZlclR4OiBcIiArXG4gICAgICAgICAgICAgIGBubyBzdWNoIGFkZHJlc3MgaW4gb3V0cHV0OiAke3NwZW5kZXJzW2Ake2p9YF19YFxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgICBvcC5hZGRTaWduYXR1cmVJZHgoaWR4LCBzcGVuZGVyc1tgJHtqfWBdKVxuICAgICAgfVxuXG4gICAgICBjb25zdCB4ZmVyb3A6IFRyYW5zZmVyYWJsZU9wZXJhdGlvbiA9IG5ldyBUcmFuc2ZlcmFibGVPcGVyYXRpb24oXG4gICAgICAgIHV0eG8uZ2V0QXNzZXRJRCgpLFxuICAgICAgICBbdXR4b2lkc1tgJHtpfWBdXSxcbiAgICAgICAgb3BcbiAgICAgIClcbiAgICAgIG9wcy5wdXNoKHhmZXJvcClcbiAgICB9XG4gICAgY29uc3QgT3BUeDogT3BlcmF0aW9uVHggPSBuZXcgT3BlcmF0aW9uVHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBvdXRzLFxuICAgICAgaW5zLFxuICAgICAgbWVtbyxcbiAgICAgIG9wc1xuICAgIClcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgoT3BUeClcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIEltcG9ydFR4IHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya0lEIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIE5ldHdvcmtJRCBvZiB0aGUgbm9kZVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEJsb2NrY2hhaW5JRCBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIE9wdGlvbmFsLiBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zLlxuICAgKiBAcGFyYW0gaW1wb3J0SW5zIEFuIGFycmF5IG9mIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMgYmVpbmcgaW1wb3J0ZWRcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBjaGFpbmlkIHdoZXJlIHRoZSBpbXBvcnRzIGFyZSBjb21pbmcgZnJvbS5cbiAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uIEZlZSB3aWxsIGNvbWUgZnJvbSB0aGUgaW5wdXRzIGZpcnN0LCBpZiB0aGV5IGNhbi5cbiAgICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZC5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICpcbiAgICovXG4gIGJ1aWxkSW1wb3J0VHggPSAoXG4gICAgbmV0d29ya0lEOiBudW1iZXIsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIsXG4gICAgdG9BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGZyb21BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGNoYW5nZUFkZHJlc3NlczogQnVmZmVyW10sXG4gICAgYXRvbWljczogVVRYT1tdLFxuICAgIHNvdXJjZUNoYWluOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgZmVlOiBCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogVW5zaWduZWRUeCA9PiB7XG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcbiAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cbiAgICBsZXQgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxuICAgIGlmICh0eXBlb2YgZmVlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBmZWUgPSB6ZXJvLmNsb25lKClcbiAgICB9XG5cbiAgICBjb25zdCBpbXBvcnRJbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSBbXVxuICAgIGxldCBmZWVwYWlkOiBCTiA9IG5ldyBCTigwKVxuICAgIGxldCBmZWVBc3NldFN0cjogc3RyaW5nID0gZmVlQXNzZXRJRC50b1N0cmluZyhcImhleFwiKVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBhdG9taWNzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCB1dHhvOiBVVFhPID0gYXRvbWljc1tgJHtpfWBdXG4gICAgICBjb25zdCBhc3NldElEOiBCdWZmZXIgPSB1dHhvLmdldEFzc2V0SUQoKVxuICAgICAgY29uc3Qgb3V0cHV0OiBBbW91bnRPdXRwdXQgPSB1dHhvLmdldE91dHB1dCgpIGFzIEFtb3VudE91dHB1dFxuICAgICAgbGV0IGFtdDogQk4gPSBvdXRwdXQuZ2V0QW1vdW50KCkuY2xvbmUoKVxuXG4gICAgICBsZXQgaW5mZWVhbW91bnQgPSBhbXQuY2xvbmUoKVxuICAgICAgbGV0IGFzc2V0U3RyOiBzdHJpbmcgPSBhc3NldElELnRvU3RyaW5nKFwiaGV4XCIpXG4gICAgICBpZiAoXG4gICAgICAgIHR5cGVvZiBmZWVBc3NldElEICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgIGZlZS5ndCh6ZXJvKSAmJlxuICAgICAgICBmZWVwYWlkLmx0KGZlZSkgJiZcbiAgICAgICAgYXNzZXRTdHIgPT09IGZlZUFzc2V0U3RyXG4gICAgICApIHtcbiAgICAgICAgZmVlcGFpZCA9IGZlZXBhaWQuYWRkKGluZmVlYW1vdW50KVxuICAgICAgICBpZiAoZmVlcGFpZC5ndChmZWUpKSB7XG4gICAgICAgICAgaW5mZWVhbW91bnQgPSBmZWVwYWlkLnN1YihmZWUpXG4gICAgICAgICAgZmVlcGFpZCA9IGZlZS5jbG9uZSgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW5mZWVhbW91bnQgPSB6ZXJvLmNsb25lKClcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCB0eGlkOiBCdWZmZXIgPSB1dHhvLmdldFR4SUQoKVxuICAgICAgY29uc3Qgb3V0cHV0aWR4OiBCdWZmZXIgPSB1dHhvLmdldE91dHB1dElkeCgpXG4gICAgICBjb25zdCBpbnB1dDogU0VDUFRyYW5zZmVySW5wdXQgPSBuZXcgU0VDUFRyYW5zZmVySW5wdXQoYW10KVxuICAgICAgY29uc3QgeGZlcmluOiBUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dChcbiAgICAgICAgdHhpZCxcbiAgICAgICAgb3V0cHV0aWR4LFxuICAgICAgICBhc3NldElELFxuICAgICAgICBpbnB1dFxuICAgICAgKVxuICAgICAgY29uc3QgZnJvbTogQnVmZmVyW10gPSBvdXRwdXQuZ2V0QWRkcmVzc2VzKClcbiAgICAgIGNvbnN0IHNwZW5kZXJzOiBCdWZmZXJbXSA9IG91dHB1dC5nZXRTcGVuZGVycyhmcm9tLCBhc09mKVxuICAgICAgZm9yIChsZXQgajogbnVtYmVyID0gMDsgaiA8IHNwZW5kZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGlkeDogbnVtYmVyID0gb3V0cHV0LmdldEFkZHJlc3NJZHgoc3BlbmRlcnNbYCR7an1gXSlcbiAgICAgICAgaWYgKGlkeCA9PT0gLTEpIHtcbiAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXG4gICAgICAgICAgICBcIkVycm9yIC0gVVRYT1NldC5idWlsZEltcG9ydFR4OiBubyBzdWNoIFwiICtcbiAgICAgICAgICAgICAgYGFkZHJlc3MgaW4gb3V0cHV0OiAke3NwZW5kZXJzW2Ake2p9YF19YFxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgICB4ZmVyaW4uZ2V0SW5wdXQoKS5hZGRTaWduYXR1cmVJZHgoaWR4LCBzcGVuZGVyc1tgJHtqfWBdKVxuICAgICAgfVxuICAgICAgaW1wb3J0SW5zLnB1c2goeGZlcmluKVxuXG4gICAgICAvL2FkZCBleHRyYSBvdXRwdXRzIGZvciBlYWNoIGFtb3VudCAoY2FsY3VsYXRlZCBmcm9tIHRoZSBpbXBvcnRlZCBpbnB1dHMpLCBtaW51cyBmZWVzXG4gICAgICBpZiAoaW5mZWVhbW91bnQuZ3QoemVybykpIHtcbiAgICAgICAgY29uc3Qgc3BlbmRvdXQ6IEFtb3VudE91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKFxuICAgICAgICAgIG91dHB1dC5nZXRPdXRwdXRJRCgpLFxuICAgICAgICAgIGluZmVlYW1vdW50LFxuICAgICAgICAgIHRvQWRkcmVzc2VzLFxuICAgICAgICAgIGxvY2t0aW1lLFxuICAgICAgICAgIHRocmVzaG9sZFxuICAgICAgICApIGFzIEFtb3VudE91dHB1dFxuICAgICAgICBjb25zdCB4ZmVyb3V0OiBUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KFxuICAgICAgICAgIGFzc2V0SUQsXG4gICAgICAgICAgc3BlbmRvdXRcbiAgICAgICAgKVxuICAgICAgICBvdXRzLnB1c2goeGZlcm91dClcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBnZXQgcmVtYWluaW5nIGZlZXMgZnJvbSB0aGUgcHJvdmlkZWQgYWRkcmVzc2VzXG4gICAgbGV0IGZlZVJlbWFpbmluZzogQk4gPSBmZWUuc3ViKGZlZXBhaWQpXG4gICAgaWYgKGZlZVJlbWFpbmluZy5ndCh6ZXJvKSAmJiB0aGlzLl9mZWVDaGVjayhmZWVSZW1haW5pbmcsIGZlZUFzc2V0SUQpKSB7XG4gICAgICBjb25zdCBhYWQ6IEFzc2V0QW1vdW50RGVzdGluYXRpb24gPSBuZXcgQXNzZXRBbW91bnREZXN0aW5hdGlvbihcbiAgICAgICAgdG9BZGRyZXNzZXMsXG4gICAgICAgIGZyb21BZGRyZXNzZXMsXG4gICAgICAgIGNoYW5nZUFkZHJlc3Nlc1xuICAgICAgKVxuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGZlZUFzc2V0SUQsIHplcm8sIGZlZVJlbWFpbmluZylcbiAgICAgIGNvbnN0IHN1Y2Nlc3M6IEVycm9yID0gdGhpcy5nZXRNaW5pbXVtU3BlbmRhYmxlKFxuICAgICAgICBhYWQsXG4gICAgICAgIGFzT2YsXG4gICAgICAgIGxvY2t0aW1lLFxuICAgICAgICB0aHJlc2hvbGRcbiAgICAgIClcbiAgICAgIGlmICh0eXBlb2Ygc3VjY2VzcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpbnMgPSBhYWQuZ2V0SW5wdXRzKClcbiAgICAgICAgb3V0cyA9IGFhZC5nZXRBbGxPdXRwdXRzKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHN1Y2Nlc3NcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBpbXBvcnRUeDogSW1wb3J0VHggPSBuZXcgSW1wb3J0VHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBvdXRzLFxuICAgICAgaW5zLFxuICAgICAgbWVtbyxcbiAgICAgIHNvdXJjZUNoYWluLFxuICAgICAgaW1wb3J0SW5zXG4gICAgKVxuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChpbXBvcnRUeClcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIEV4cG9ydFR4IHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya0lEIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIE5ldHdvcmtJRCBvZiB0aGUgbm9kZVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEJsb2NrY2hhaW5JRCBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBhbW91bnQgVGhlIGFtb3VudCBiZWluZyBleHBvcnRlZCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBheGNBc3NldElEIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBhc3NldCBJRCBmb3IgQVhDXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIHJlY2lldmVzIHRoZSBBWENcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBvd25zIHRoZSBBWENcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBPcHRpb25hbC4gVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy5cbiAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGRlc3RpbmF0aW9uQ2hhaW4gT3B0aW9uYWwuIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBjaGFpbmlkIHdoZXJlIHRvIHNlbmQgdGhlIGFzc2V0LlxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLlxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKi9cbiAgYnVpbGRFeHBvcnRUeCA9IChcbiAgICBuZXR3b3JrSUQ6IG51bWJlcixcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlcixcbiAgICBhbW91bnQ6IEJOLFxuICAgIGFzc2V0SUQ6IEJ1ZmZlcixcbiAgICB0b0FkZHJlc3NlczogQnVmZmVyW10sXG4gICAgZnJvbUFkZHJlc3NlczogQnVmZmVyW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcbiAgICBkZXN0aW5hdGlvbkNoYWluOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgZmVlOiBCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogVW5zaWduZWRUeCA9PiB7XG4gICAgbGV0IGluczogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IFtdXG4gICAgbGV0IG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gW11cbiAgICBsZXQgZXhwb3J0b3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxuXG4gICAgaWYgKHR5cGVvZiBjaGFuZ2VBZGRyZXNzZXMgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyA9IHRvQWRkcmVzc2VzXG4gICAgfVxuXG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcblxuICAgIGlmIChhbW91bnQuZXEoemVybykpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGZlZUFzc2V0SUQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGZlZUFzc2V0SUQgPSBhc3NldElEXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBkZXN0aW5hdGlvbkNoYWluID0gYmludG9vbHMuY2I1OERlY29kZShQbGF0Zm9ybUNoYWluSUQpXG4gICAgfVxuXG4gICAgY29uc3QgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24oXG4gICAgICB0b0FkZHJlc3NlcyxcbiAgICAgIGZyb21BZGRyZXNzZXMsXG4gICAgICBjaGFuZ2VBZGRyZXNzZXNcbiAgICApXG4gICAgaWYgKGFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikgPT09IGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikpIHtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChhc3NldElELCBhbW91bnQsIGZlZSlcbiAgICB9IGVsc2Uge1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGFzc2V0SUQsIGFtb3VudCwgemVybylcbiAgICAgIGlmICh0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKSB7XG4gICAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpXG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHN1Y2Nlc3M6IEVycm9yID0gdGhpcy5nZXRNaW5pbXVtU3BlbmRhYmxlKFxuICAgICAgYWFkLFxuICAgICAgYXNPZixcbiAgICAgIGxvY2t0aW1lLFxuICAgICAgdGhyZXNob2xkXG4gICAgKVxuICAgIGlmICh0eXBlb2Ygc3VjY2VzcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaW5zID0gYWFkLmdldElucHV0cygpXG4gICAgICBvdXRzID0gYWFkLmdldENoYW5nZU91dHB1dHMoKVxuICAgICAgZXhwb3J0b3V0cyA9IGFhZC5nZXRPdXRwdXRzKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgc3VjY2Vzc1xuICAgIH1cblxuICAgIGNvbnN0IGV4cG9ydFR4OiBFeHBvcnRUeCA9IG5ldyBFeHBvcnRUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIG91dHMsXG4gICAgICBpbnMsXG4gICAgICBtZW1vLFxuICAgICAgZGVzdGluYXRpb25DaGFpbixcbiAgICAgIGV4cG9ydG91dHNcbiAgICApXG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KGV4cG9ydFR4KVxuICB9XG59XG4iXX0=