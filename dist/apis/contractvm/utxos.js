"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTXOSet = exports.AssetAmountDestination = exports.UTXO = void 0;
/**
 * @packageDocumentation
 * @module API-ContractVM-UTXOs
 */
const buffer_1 = require("buffer/");
const bintools_1 = __importDefault(require("../../utils/bintools"));
const bn_js_1 = __importDefault(require("bn.js"));
const outputs_1 = require("./outputs");
const inputs_1 = require("./inputs");
const helperfunctions_1 = require("../../utils/helperfunctions");
const utxos_1 = require("../../common/utxos");
const constants_1 = require("./constants");
const tx_1 = require("./tx");
const exporttx_1 = require("../contractvm/exporttx");
const constants_2 = require("../../utils/constants");
const importtx_1 = require("../contractvm/importtx");
const basetx_1 = require("../contractvm/basetx");
const assetamount_1 = require("../../common/assetamount");
const serialization_1 = require("../../utils/serialization");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serializer = serialization_1.Serialization.getInstance();
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
        this.output = outputs_1.SelectOutputClass(fields["output"]["_typeID"]);
        this.output.deserialize(fields["output"], encoding);
    }
    fromBuffer(bytes, offset = 0) {
        this.codecid = bintools.copyFrom(bytes, offset, offset + 2);
        offset += 2;
        this.txid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.outputidx = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.assetid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        const outputid = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.output = outputs_1.SelectOutputClass(outputid);
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
    create(codecID = constants_1.ContractVMConstants.LATESTCODEC, txid = undefined, outputidx = undefined, assetid = undefined, output = undefined) {
        return new UTXO(codecID, txid, outputidx, assetid, output);
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
        this.getMinimumSpendable = (aad, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1, stakeable = false) => {
            const utxoArray = this.getAllUTXOs().filter((u) => {
                if (!stakeable && u.getOutput() instanceof outputs_1.StakeableLockOut && u.getOutput().getStakeableLocktime().gt(asOf)) {
                    return false;
                }
                ;
                return true;
            });
            const outs = {};
            for (let i = 0; i < utxoArray.length && !aad.canComplete(); i++) {
                const u = utxoArray[i];
                const assetKey = u.getAssetID().toString("hex");
                const fromAddresses = aad.getSenders();
                if (u.getOutput() instanceof outputs_1.AmountOutput && aad.assetExists(assetKey) && u.getOutput().meetsThreshold(fromAddresses, asOf)) {
                    const am = aad.getAssetAmount(assetKey);
                    if (!am.isFinished()) {
                        const uout = u.getOutput();
                        if (!(assetKey in outs)) {
                            outs[assetKey] = {
                                lockedStakeable: [],
                                unlocked: []
                            };
                        }
                        const amount = uout.getAmount();
                        const txid = u.getTxID();
                        const outputidx = u.getOutputIdx();
                        let input;
                        if (uout instanceof outputs_1.StakeableLockOut) {
                            let stakeout = uout;
                            let pinput = new inputs_1.ParseableInput(new inputs_1.SECPTransferInput(amount));
                            input = new inputs_1.StakeableLockIn(amount, stakeout.getStakeableLocktime(), pinput);
                            am.spendAmount(amount, true);
                            outs[assetKey].lockedStakeable.push(uout);
                        }
                        else {
                            input = new inputs_1.SECPTransferInput(amount);
                            am.spendAmount(amount, false);
                            outs[assetKey].unlocked.push(uout);
                        }
                        const xferin = new inputs_1.TransferableInput(txid, outputidx, u.getAssetID(), input);
                        const spenders = uout.getSpenders(fromAddresses, asOf);
                        for (let j = 0; j < spenders.length; j++) {
                            const idx = uout.getAddressIdx(spenders[j]);
                            if (idx === -1) {
                                /* istanbul ignore next */
                                throw new Error('Error - UTXOSet.getMinimumSpendable: no such '
                                    + `address in output: ${spenders[j]}`);
                            }
                            xferin.getInput().addSignatureIdx(idx, spenders[j]);
                        }
                        aad.addInput(xferin);
                    }
                    else if (aad.assetExists(assetKey) && !(u.getOutput() instanceof outputs_1.AmountOutput)) {
                        /**
                         * Leaving the below lines, not simply for posterity, but for clarification.
                         * AssetIDs may have mixed OutputTypes.
                         * Some of those OutputTypes may implement AmountOutput.
                         * Others may not.
                         * Simply continue in this condition.
                         */
                        /*return new Error('Error - UTXOSet.getMinimumSpendable: outputID does not '
                          + `implement AmountOutput: ${u.getOutput().getOutputID}`);*/
                        continue;
                    }
                }
            }
            if (!aad.canComplete()) {
                return new Error('Error - UTXOSet.getMinimumSpendable: insufficient '
                    + 'funds to create the transaction');
            }
            const amounts = aad.getAmounts();
            const zero = new bn_js_1.default(0);
            for (let i = 0; i < amounts.length; i++) {
                const assetKey = amounts[i].getAssetIDString();
                const change = amounts[i].getChange();
                const stakeableLockedAmount = amounts[i].getStakeableLockSpent();
                const isStakeableLockChange = amounts[i].getStakeableLockChange();
                const unlockedAmount = amounts[i].getSpent().sub(isStakeableLockChange ? stakeableLockedAmount : stakeableLockedAmount.add(change));
                if (unlockedAmount.gt(zero) || stakeableLockedAmount.gt(zero) || change.gt(zero)) {
                    if (stakeableLockedAmount.gt(zero) || (isStakeableLockChange && change.gt(zero))) {
                        let ls = outs[assetKey].lockedStakeable;
                        let schange = isStakeableLockChange ? change : zero.clone();
                        for (let j = 0; j < ls.length; j++) {
                            let stakeableLocktime = ls[j].getStakeableLocktime();
                            let pout = ls[j].getTransferableOutput();
                            let o = pout.getOutput();
                            let spendme = o.getAmount();
                            // FYI - You can always guarantee that the last element of the ls array is the one who gives change (if any)
                            if (j == ls.length - 1 && schange.gt(zero)) {
                                spendme = spendme.sub(change);
                                let schangeNewOut = outputs_1.SelectOutputClass(o.getOutputID(), schange, o.getAddresses(), o.getLocktime(), o.getThreshold());
                                let schangeOut = outputs_1.SelectOutputClass(ls[j].getOutputID(), schange, o.getAddresses(), o.getLocktime(), o.getThreshold(), stakeableLocktime, new outputs_1.ParseableOutput(schangeNewOut));
                                const xferout = new outputs_1.TransferableOutput(amounts[i].getAssetID(), schangeOut);
                                aad.addChange(xferout);
                            }
                            let newout = outputs_1.SelectOutputClass(o.getOutputID(), spendme, o.getAddresses(), o.getLocktime(), o.getThreshold());
                            let spendout = outputs_1.SelectOutputClass(ls[j].getOutputID(), spendme, o.getAddresses(), o.getLocktime(), o.getThreshold(), stakeableLocktime, new outputs_1.ParseableOutput(newout));
                            const xferout = new outputs_1.TransferableOutput(amounts[i].getAssetID(), spendout);
                            aad.addOutput(xferout);
                        }
                    }
                    if (unlockedAmount.gt(zero)) {
                        let uchange = isStakeableLockChange ? zero.clone() : change;
                        if (uchange.gt(zero)) {
                            let schangeOut = new outputs_1.SECPTransferOutput(uchange, aad.getChangeAddresses(), locktime, threshold);
                            const xferout = new outputs_1.TransferableOutput(amounts[i].getAssetID(), schangeOut);
                            aad.addChange(xferout);
                        }
                        let spendout;
                        spendout = new outputs_1.SECPTransferOutput(unlockedAmount, aad.getDestinations(), locktime, threshold);
                        const xferout = new outputs_1.TransferableOutput(amounts[i].getAssetID(), spendout);
                        aad.addOutput(xferout);
                    }
                }
            }
            return undefined;
        };
        /**
         * Creates an [[UnsignedTx]] wrapping a [[BaseTx]]. For more granular control, you may create your own
         * [[UnsignedTx]] wrapping a [[BaseTx]] manually (with their corresponding [[TransferableInput]]s and [[TransferableOutput]]s).
         *
         * @param networkid The number representing NetworkID of the node
         * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
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
        this.buildBaseTx = (networkid, blockchainid, amount, assetID, toAddresses, fromAddresses, changeAddresses = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => {
            if (threshold > toAddresses.length) {
                /* istanbul ignore next */
                throw new Error(`Error - UTXOSet.buildBaseTx: threshold is greater than number of addresses`);
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
            const baseTx = new basetx_1.BaseTx(networkid, blockchainid, outs, ins, memo);
            return new tx_1.UnsignedTx(baseTx);
        };
        /**
          * Creates an unsigned ImportTx transaction.
          *
          * @param networkid The number representing NetworkID of the node
          * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
          * @param toAddresses The addresses to send the funds
          * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
          * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs. Default: toAddresses
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
        this.buildImportTx = (networkid, blockchainid, toAddresses, fromAddresses, changeAddresses, atomics, sourceChain = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => {
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
                const utxo = atomics[i];
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
                    if (feepaid.gte(fee)) {
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
                    const idx = output.getAddressIdx(spenders[j]);
                    if (idx === -1) {
                        /* istanbul ignore next */
                        throw new Error('Error - UTXOSet.buildImportTx: no such '
                            + `address in output: ${spenders[j]}`);
                    }
                    xferin.getInput().addSignatureIdx(idx, spenders[j]);
                }
                importIns.push(xferin);
                //add extra outputs for each amount (calculated from the imported inputs), minus fees
                if (infeeamount.gt(zero)) {
                    const spendout = outputs_1.SelectOutputClass(output.getOutputID(), infeeamount, toAddresses, locktime, threshold);
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
            const importTx = new importtx_1.ImportTx(networkid, blockchainid, outs, ins, memo, sourceChain, importIns);
            return new tx_1.UnsignedTx(importTx);
        };
        /**
          * Creates an unsigned ExportTx transaction.
          *
          * @param networkid The number representing NetworkID of the node
          * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
          * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
          * @param axcAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for AXC
          * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who recieves the AXC
          * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who owns the AXC
          * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover of the AXC
          * @param destinationChain Optional. A {@link https://github.com/feross/buffer|Buffer} for the chainid where to send the asset.
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
        this.buildExportTx = (networkid, blockchainid, amount, axcAssetID, toAddresses, fromAddresses, changeAddresses = undefined, destinationChain = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = helperfunctions_1.UnixNow(), locktime = new bn_js_1.default(0), threshold = 1) => {
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
                feeAssetID = axcAssetID;
            }
            else if (feeAssetID.toString("hex") !== axcAssetID.toString("hex")) {
                /* istanbul ignore next */
                throw new Error('Error - UTXOSet.buildExportTx: '
                    + `feeAssetID must match axcAssetID`);
            }
            if (typeof destinationChain === "undefined") {
                destinationChain = bintools.cb58Decode(constants_2.Defaults.network[networkid].X["blockchainID"]);
            }
            const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
            if (axcAssetID.toString("hex") === feeAssetID.toString("hex")) {
                aad.addAssetAmount(axcAssetID, amount, fee);
            }
            else {
                aad.addAssetAmount(axcAssetID, amount, zero);
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
            const exportTx = new exporttx_1.ExportTx(networkid, blockchainid, outs, ins, memo, destinationChain, exportouts);
            return new tx_1.UnsignedTx(exportTx);
        };
    }
    //serialize is inherited
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        let utxos = {};
        for (let utxoid in fields["utxos"]) {
            let utxoidCleaned = serializer.decoder(utxoid, encoding, "base58", "base58");
            utxos[utxoidCleaned] = new UTXO();
            utxos[utxoidCleaned].deserialize(fields["utxos"][utxoid], encoding);
        }
        let addressUTXOs = {};
        for (let address in fields["addressUTXOs"]) {
            let addressCleaned = serializer.decoder(address, encoding, "cb58", "hex");
            let utxobalance = {};
            for (let utxoid in fields["addressUTXOs"][address]) {
                let utxoidCleaned = serializer.decoder(utxoid, encoding, "base58", "base58");
                utxobalance[utxoidCleaned] = serializer.decoder(fields["addressUTXOs"][address][utxoid], encoding, "decimalString", "BN");
            }
            addressUTXOs[addressCleaned] = utxobalance;
        }
        this.utxos = utxos;
        this.addressUTXOs = addressUTXOs;
    }
    parseUTXO(utxo) {
        const utxovar = new UTXO();
        // force a copy
        if (typeof utxo === 'string') {
            utxovar.fromBuffer(bintools.cb58Decode(utxo));
        }
        else if (utxo instanceof utxos_1.StandardUTXO) {
            utxovar.fromBuffer(utxo.toBuffer()); // forces a copy
        }
        else {
            /* istanbul ignore next */
            throw new Error(`Error - UTXO.parseUTXO: utxo parameter is not a UTXO or string: ${utxo}`);
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
            fee.gt(new bn_js_1.default(0)) && feeAssetID instanceof buffer_1.Buffer);
    }
}
exports.UTXOSet = UTXOSet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXR4b3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9jb250cmFjdHZtL3V0eG9zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFpQztBQUNqQyxvRUFBNEM7QUFDNUMsa0RBQXVCO0FBQ3ZCLHVDQUF3SjtBQUN4SixxQ0FBOEc7QUFDOUcsaUVBQXNEO0FBQ3RELDhDQUFtRTtBQUNuRSwyQ0FBa0Q7QUFDbEQsNkJBQWtDO0FBQ2xDLHFEQUFrRDtBQUNsRCxxREFBbUU7QUFDbkUscURBQWtEO0FBQ2xELGlEQUE4QztBQUM5QywwREFBdUY7QUFFdkYsNkRBQThFO0FBRTlFOztHQUVHO0FBQ0gsTUFBTSxRQUFRLEdBQUcsa0JBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN4QyxNQUFNLFVBQVUsR0FBRyw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBRS9DOztHQUVHO0FBQ0gsTUFBYSxJQUFLLFNBQVEsb0JBQVk7SUFBdEM7O1FBQ1ksY0FBUyxHQUFHLE1BQU0sQ0FBQztRQUNuQixZQUFPLEdBQUcsU0FBUyxDQUFDO0lBbUVoQyxDQUFDO0lBakVDLHdCQUF3QjtJQUV4QixXQUFXLENBQUMsTUFBYSxFQUFFLFdBQThCLEtBQUs7UUFDNUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLE1BQU0sR0FBRywyQkFBaUIsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUM3RCxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVELFVBQVUsQ0FBQyxLQUFZLEVBQUUsU0FBZ0IsQ0FBQztRQUN4QyxJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDNUQsTUFBTSxJQUFJLENBQUMsQ0FBQztRQUNaLElBQUksQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQztRQUMxRCxNQUFNLElBQUksRUFBRSxDQUFDO1FBQ2IsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzlELE1BQU0sSUFBSSxDQUFDLENBQUM7UUFDWixJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDN0QsTUFBTSxJQUFJLEVBQUUsQ0FBQztRQUNiLE1BQU0sUUFBUSxHQUFVLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JGLE1BQU0sSUFBSSxDQUFDLENBQUM7UUFDWixJQUFJLENBQUMsTUFBTSxHQUFHLDJCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzFDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSCxVQUFVLENBQUMsVUFBaUI7UUFDeEIsMEJBQTBCO1FBQzFCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsUUFBUTtRQUNOLDBCQUEwQjtRQUMxQixPQUFPLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVELEtBQUs7UUFDSCxNQUFNLElBQUksR0FBUSxJQUFJLElBQUksRUFBRSxDQUFDO1FBQzdCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDakMsT0FBTyxJQUFZLENBQUM7SUFDdEIsQ0FBQztJQUVELE1BQU0sQ0FDSixVQUFpQiwrQkFBbUIsQ0FBQyxXQUFXLEVBQ2hELE9BQWMsU0FBUyxFQUN2QixZQUE0QixTQUFTLEVBQ3JDLFVBQWlCLFNBQVMsRUFDMUIsU0FBZ0IsU0FBUztRQUV6QixPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQVMsQ0FBQztJQUNyRSxDQUFDO0NBRUY7QUFyRUQsb0JBcUVDO0FBRUQsTUFBYSxzQkFBdUIsU0FBUSw0Q0FBcUU7Q0FBRztBQUFwSCx3REFBb0g7QUFFcEg7O0dBRUc7QUFDSCxNQUFhLE9BQVEsU0FBUSx1QkFBcUI7SUFBbEQ7O1FBQ1ksY0FBUyxHQUFHLFNBQVMsQ0FBQztRQUN0QixZQUFPLEdBQUcsU0FBUyxDQUFDO1FBMEQ5Qix3QkFBbUIsR0FBRyxDQUFDLEdBQTBCLEVBQUUsT0FBVSx5QkFBTyxFQUFFLEVBQUUsV0FBYyxJQUFJLGVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxZQUFtQixDQUFDLEVBQUUsWUFBb0IsS0FBSyxFQUFRLEVBQUU7WUFDeEosTUFBTSxTQUFTLEdBQWUsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUM1RCxJQUFHLENBQUMsU0FBUyxJQUFJLENBQUMsQ0FBQyxTQUFTLEVBQUUsWUFBWSwwQkFBZ0IsSUFBSyxDQUFDLENBQUMsU0FBUyxFQUF1QixDQUFDLG9CQUFvQixFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFDO29CQUNoSSxPQUFPLEtBQUssQ0FBQztpQkFDZDtnQkFBQSxDQUFDO2dCQUNGLE9BQU8sSUFBSSxDQUFDO1lBQ2QsQ0FBQyxDQUFDLENBQUM7WUFDSCxNQUFNLElBQUksR0FBVSxFQUFFLENBQUM7WUFDdkIsS0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzlELE1BQU0sQ0FBQyxHQUFRLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUIsTUFBTSxRQUFRLEdBQVUsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdkQsTUFBTSxhQUFhLEdBQWlCLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDckQsSUFBRyxDQUFDLENBQUMsU0FBUyxFQUFFLFlBQVksc0JBQVksSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxjQUFjLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxFQUFFO29CQUMxSCxNQUFNLEVBQUUsR0FBZSxHQUFHLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUNwRCxJQUFHLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFO3dCQUNuQixNQUFNLElBQUksR0FBZ0IsQ0FBQyxDQUFDLFNBQVMsRUFBa0IsQ0FBQzt3QkFDeEQsSUFBRyxDQUFDLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxFQUFFOzRCQUN0QixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUc7Z0NBQ2YsZUFBZSxFQUFDLEVBQUU7Z0NBQ2xCLFFBQVEsRUFBQyxFQUFFOzZCQUNaLENBQUM7eUJBQ0g7d0JBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO3dCQUNoQyxNQUFNLElBQUksR0FBVSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ2hDLE1BQU0sU0FBUyxHQUFVLENBQUMsQ0FBQyxZQUFZLEVBQUUsQ0FBQzt3QkFDMUMsSUFBSSxLQUFpQixDQUFDO3dCQUN0QixJQUFHLElBQUksWUFBWSwwQkFBZ0IsRUFBRTs0QkFDbkMsSUFBSSxRQUFRLEdBQW9CLElBQXdCLENBQUM7NEJBQ3pELElBQUksTUFBTSxHQUFrQixJQUFJLHVCQUFjLENBQUMsSUFBSSwwQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDOzRCQUM5RSxLQUFLLEdBQUcsSUFBSSx3QkFBZSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQzs0QkFDN0UsRUFBRSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7NEJBQzdCLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO3lCQUMzQzs2QkFBTTs0QkFDTCxLQUFLLEdBQUcsSUFBSSwwQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQzs0QkFDdEMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7NEJBQzlCLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO3lCQUNwQzt3QkFFRCxNQUFNLE1BQU0sR0FBcUIsSUFBSSwwQkFBaUIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQzt3QkFDL0YsTUFBTSxRQUFRLEdBQWlCLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO3dCQUNyRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs0QkFDeEMsTUFBTSxHQUFHLEdBQVUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDbkQsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0NBQ2QsMEJBQTBCO2dDQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLCtDQUErQztzQ0FDN0Qsc0JBQXNCLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7NkJBQ3hDOzRCQUNELE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO3lCQUNyRDt3QkFDRCxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3FCQUN0Qjt5QkFBTSxJQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsWUFBWSxzQkFBWSxDQUFDLEVBQUU7d0JBQy9FOzs7Ozs7MkJBTUc7d0JBQ0g7c0ZBQzhEO3dCQUM1RCxTQUFTO3FCQUNaO2lCQUNGO2FBQ0Y7WUFDRCxJQUFHLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxFQUFFO2dCQUNyQixPQUFPLElBQUksS0FBSyxDQUFDLG9EQUFvRDtzQkFDbkUsaUNBQWlDLENBQUMsQ0FBQzthQUN0QztZQUNELE1BQU0sT0FBTyxHQUFzQixHQUFHLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDcEQsTUFBTSxJQUFJLEdBQU0sSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUIsS0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3RDLE1BQU0sUUFBUSxHQUFVLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN0RCxNQUFNLE1BQU0sR0FBTSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0scUJBQXFCLEdBQU0sT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQ3BFLE1BQU0scUJBQXFCLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQ2xFLE1BQU0sY0FBYyxHQUFNLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFFdkksSUFBSSxjQUFjLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUNoRixJQUFHLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTt3QkFDL0UsSUFBSSxFQUFFLEdBQTJCLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxlQUFlLENBQUM7d0JBQ2hFLElBQUksT0FBTyxHQUFNLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDL0QsS0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7NEJBQ2pDLElBQUksaUJBQWlCLEdBQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixFQUFFLENBQUM7NEJBQ3hELElBQUksSUFBSSxHQUFtQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMscUJBQXFCLEVBQUUsQ0FBQzs0QkFDekQsSUFBSSxDQUFDLEdBQWdCLElBQUksQ0FBQyxTQUFTLEVBQWtCLENBQUM7NEJBQ3RELElBQUksT0FBTyxHQUFNLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQzs0QkFDL0IsNEdBQTRHOzRCQUM1RyxJQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO2dDQUN6QyxPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQ0FDOUIsSUFBSSxhQUFhLEdBQWdCLDJCQUFpQixDQUM5QyxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQ2YsT0FBTyxFQUNQLENBQUMsQ0FBQyxZQUFZLEVBQUUsRUFDaEIsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUNmLENBQUMsQ0FBQyxZQUFZLEVBQUUsQ0FDSCxDQUFDO2dDQUNsQixJQUFJLFVBQVUsR0FBb0IsMkJBQWlCLENBQy9DLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFDbkIsT0FBTyxFQUNQLENBQUMsQ0FBQyxZQUFZLEVBQUUsRUFDaEIsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUNmLENBQUMsQ0FBQyxZQUFZLEVBQUUsRUFDaEIsaUJBQWlCLEVBQ2pCLElBQUkseUJBQWUsQ0FBQyxhQUFhLENBQUMsQ0FDakIsQ0FBQztnQ0FDdEIsTUFBTSxPQUFPLEdBQXNCLElBQUksNEJBQWtCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dDQUMvRixHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDOzZCQUN4Qjs0QkFDRCxJQUFJLE1BQU0sR0FBZ0IsMkJBQWlCLENBQ3pDLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFDZixPQUFPLEVBQ1AsQ0FBQyxDQUFDLFlBQVksRUFBRSxFQUNoQixDQUFDLENBQUMsV0FBVyxFQUFFLEVBQ2YsQ0FBQyxDQUFDLFlBQVksRUFBRSxDQUNELENBQUM7NEJBQ2xCLElBQUksUUFBUSxHQUFvQiwyQkFBaUIsQ0FDL0MsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUNuQixPQUFPLEVBQ1AsQ0FBQyxDQUFDLFlBQVksRUFBRSxFQUNoQixDQUFDLENBQUMsV0FBVyxFQUFFLEVBQ2YsQ0FBQyxDQUFDLFlBQVksRUFBRSxFQUNoQixpQkFBaUIsRUFDakIsSUFBSSx5QkFBZSxDQUFDLE1BQU0sQ0FBQyxDQUNSLENBQUM7NEJBQ3RCLE1BQU0sT0FBTyxHQUFzQixJQUFJLDRCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQzs0QkFDN0YsR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQzt5QkFDeEI7cUJBQ0Y7b0JBRUQsSUFBRyxjQUFjLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO3dCQUMxQixJQUFJLE9BQU8sR0FBTSxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7d0JBQy9ELElBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTs0QkFDbkIsSUFBSSxVQUFVLEdBQWdCLElBQUksNEJBQWtCLENBQ2xELE9BQU8sRUFDUCxHQUFHLENBQUMsa0JBQWtCLEVBQUUsRUFDeEIsUUFBUSxFQUNSLFNBQVMsQ0FDTSxDQUFDOzRCQUNsQixNQUFNLE9BQU8sR0FBc0IsSUFBSSw0QkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7NEJBQy9GLEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7eUJBQ3hCO3dCQUNELElBQUksUUFBcUIsQ0FBQzt3QkFDMUIsUUFBUSxHQUFHLElBQUksNEJBQWtCLENBQy9CLGNBQWMsRUFDZCxHQUFHLENBQUMsZUFBZSxFQUFFLEVBQ3JCLFFBQVEsRUFDUixTQUFTLENBQ00sQ0FBQzt3QkFDbEIsTUFBTSxPQUFPLEdBQXNCLElBQUksNEJBQWtCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO3dCQUM3RixHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO3FCQUN4QjtpQkFDRjthQUNGO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbkIsQ0FBQyxDQUFBO1FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1dBb0JHO1FBQ0gsZ0JBQVcsR0FBRyxDQUNaLFNBQWdCLEVBQ2hCLFlBQW1CLEVBQ25CLE1BQVMsRUFDVCxPQUFjLEVBQ2QsV0FBeUIsRUFDekIsYUFBMkIsRUFDM0Isa0JBQWdDLFNBQVMsRUFDekMsTUFBUyxTQUFTLEVBQ2xCLGFBQW9CLFNBQVMsRUFDN0IsT0FBYyxTQUFTLEVBQ3ZCLE9BQVUseUJBQU8sRUFBRSxFQUNuQixXQUFjLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxFQUN2QixZQUFtQixDQUFDLEVBQ1QsRUFBRTtZQUViLElBQUcsU0FBUyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUU7Z0JBQ2pDLDBCQUEwQjtnQkFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyw0RUFBNEUsQ0FBQyxDQUFDO2FBQy9GO1lBRUQsSUFBRyxPQUFPLGVBQWUsS0FBSyxXQUFXLEVBQUU7Z0JBQ3pDLGVBQWUsR0FBRyxXQUFXLENBQUM7YUFDL0I7WUFFRCxJQUFHLE9BQU8sVUFBVSxLQUFLLFdBQVcsRUFBRTtnQkFDcEMsVUFBVSxHQUFHLE9BQU8sQ0FBQzthQUN0QjtZQUVELE1BQU0sSUFBSSxHQUFNLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTFCLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDbkIsT0FBTyxTQUFTLENBQUM7YUFDbEI7WUFFRCxNQUFNLEdBQUcsR0FBMEIsSUFBSSxzQkFBc0IsQ0FBQyxXQUFXLEVBQUUsYUFBYSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQzNHLElBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFDO2dCQUN4RCxHQUFHLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7YUFDMUM7aUJBQU07Z0JBQ0wsR0FBRyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMxQyxJQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxFQUFFO29CQUNsQyxHQUFHLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7aUJBQzNDO2FBQ0Y7WUFFRCxJQUFJLEdBQUcsR0FBNEIsRUFBRSxDQUFDO1lBQ3RDLElBQUksSUFBSSxHQUE2QixFQUFFLENBQUM7WUFFeEMsTUFBTSxPQUFPLEdBQVMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQy9FLElBQUcsT0FBTyxPQUFPLEtBQUssV0FBVyxFQUFFO2dCQUNqQyxHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN0QixJQUFJLEdBQUcsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO2FBQzVCO2lCQUFNO2dCQUNMLE1BQU0sT0FBTyxDQUFDO2FBQ2Y7WUFFRCxNQUFNLE1BQU0sR0FBVSxJQUFJLGVBQU0sQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDM0UsT0FBTyxJQUFJLGVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVoQyxDQUFDLENBQUM7UUFFRjs7Ozs7Ozs7Ozs7Ozs7Ozs7O1lBa0JJO1FBQ0gsa0JBQWEsR0FBRyxDQUNmLFNBQWdCLEVBQ2hCLFlBQW1CLEVBQ25CLFdBQXlCLEVBQ3pCLGFBQTJCLEVBQzNCLGVBQTZCLEVBQzdCLE9BQW1CLEVBQ25CLGNBQXFCLFNBQVMsRUFDOUIsTUFBUyxTQUFTLEVBQ2xCLGFBQW9CLFNBQVMsRUFDN0IsT0FBYyxTQUFTLEVBQ3ZCLE9BQVUseUJBQU8sRUFBRSxFQUNuQixXQUFjLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxFQUN2QixZQUFtQixDQUFDLEVBQ1QsRUFBRTtZQUNiLE1BQU0sSUFBSSxHQUFNLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFCLElBQUksR0FBRyxHQUE0QixFQUFFLENBQUM7WUFDdEMsSUFBSSxJQUFJLEdBQTZCLEVBQUUsQ0FBQztZQUN4QyxJQUFHLE9BQU8sR0FBRyxLQUFLLFdBQVcsRUFBRTtnQkFDN0IsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzthQUNwQjtZQUVELE1BQU0sU0FBUyxHQUE0QixFQUFFLENBQUM7WUFDOUMsSUFBSSxPQUFPLEdBQU0sSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0IsSUFBSSxXQUFXLEdBQVUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwRCxLQUFJLElBQUksQ0FBQyxHQUFVLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDN0MsTUFBTSxJQUFJLEdBQVEsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3QixNQUFNLE9BQU8sR0FBVSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sTUFBTSxHQUFnQixJQUFJLENBQUMsU0FBUyxFQUFrQixDQUFDO2dCQUM3RCxJQUFJLEdBQUcsR0FBTSxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBRXhDLElBQUksV0FBVyxHQUFHLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxRQUFRLEdBQVUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDOUMsSUFDRSxPQUFPLFVBQVUsS0FBSyxXQUFXO29CQUNqQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQztvQkFDWixPQUFPLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQztvQkFDZixRQUFRLEtBQUssV0FBVyxFQUUxQjtvQkFDRSxPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDbkMsSUFBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO3dCQUNuQixXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDL0IsT0FBTyxHQUFHLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztxQkFDdkI7eUJBQU07d0JBQ0wsV0FBVyxHQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztxQkFDN0I7aUJBQ0Y7Z0JBRUQsTUFBTSxJQUFJLEdBQVUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNuQyxNQUFNLFNBQVMsR0FBVSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQzdDLE1BQU0sS0FBSyxHQUFxQixJQUFJLDBCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMzRCxNQUFNLE1BQU0sR0FBcUIsSUFBSSwwQkFBaUIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDeEYsTUFBTSxJQUFJLEdBQWlCLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDakQsTUFBTSxRQUFRLEdBQWlCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM5RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDeEMsTUFBTSxHQUFHLEdBQVUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDckQsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUU7d0JBQ2QsMEJBQTBCO3dCQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLHlDQUF5Qzs4QkFDdkQsc0JBQXNCLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7cUJBQ3hDO29CQUNELE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNyRDtnQkFDRCxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN2QixxRkFBcUY7Z0JBQ3JGLElBQUcsV0FBVyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDdkIsTUFBTSxRQUFRLEdBQWdCLDJCQUFpQixDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsRUFDbEUsV0FBVyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFpQixDQUFDO29CQUNqRSxNQUFNLE9BQU8sR0FBc0IsSUFBSSw0QkFBa0IsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQzdFLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7aUJBQ3BCO2FBQ0Y7WUFFRCxpREFBaUQ7WUFDakQsSUFBSSxZQUFZLEdBQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN2QyxJQUFHLFlBQVksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLEVBQUU7Z0JBQ3BFLE1BQU0sR0FBRyxHQUEwQixJQUFJLHNCQUFzQixDQUFDLFdBQVcsRUFBRSxhQUFhLEVBQUUsZUFBZSxDQUFDLENBQUM7Z0JBQzNHLEdBQUcsQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxPQUFPLEdBQVMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUMvRSxJQUFHLE9BQU8sT0FBTyxLQUFLLFdBQVcsRUFBRTtvQkFDakMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDdEIsSUFBSSxHQUFHLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztpQkFDNUI7cUJBQU07b0JBQ0wsTUFBTSxPQUFPLENBQUM7aUJBQ2Y7YUFDRjtZQUVELE1BQU0sUUFBUSxHQUFZLElBQUksbUJBQVEsQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN6RyxPQUFPLElBQUksZUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2xDLENBQUMsQ0FBQztRQUVGOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztZQW9CSTtRQUNILGtCQUFhLEdBQUcsQ0FDZixTQUFnQixFQUNoQixZQUFtQixFQUNuQixNQUFTLEVBQ1QsV0FBa0IsRUFDbEIsV0FBeUIsRUFDekIsYUFBMkIsRUFDM0Isa0JBQWdDLFNBQVMsRUFDekMsbUJBQTBCLFNBQVMsRUFDbkMsTUFBUyxTQUFTLEVBQ2xCLGFBQW9CLFNBQVMsRUFDN0IsT0FBYyxTQUFTLEVBQ3ZCLE9BQVUseUJBQU8sRUFBRSxFQUNuQixXQUFjLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxFQUN2QixZQUFtQixDQUFDLEVBQ1QsRUFBRTtZQUNiLElBQUksR0FBRyxHQUE0QixFQUFFLENBQUM7WUFDdEMsSUFBSSxJQUFJLEdBQTZCLEVBQUUsQ0FBQztZQUN4QyxJQUFJLFVBQVUsR0FBNkIsRUFBRSxDQUFDO1lBRTlDLElBQUcsT0FBTyxlQUFlLEtBQUssV0FBVyxFQUFFO2dCQUN6QyxlQUFlLEdBQUcsV0FBVyxDQUFDO2FBQy9CO1lBRUQsTUFBTSxJQUFJLEdBQU0sSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFMUIsSUFBSSxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNuQixPQUFPLFNBQVMsQ0FBQzthQUNsQjtZQUVELElBQUcsT0FBTyxVQUFVLEtBQUssV0FBVyxFQUFFO2dCQUNwQyxVQUFVLEdBQUcsV0FBVyxDQUFDO2FBQzFCO2lCQUFNLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNyRSwwQkFBMEI7Z0JBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDO3NCQUMvQyxtQ0FBbUMsQ0FBQyxDQUFDO2FBQ3hDO1lBRUQsSUFBRyxPQUFPLGdCQUFnQixLQUFLLFdBQVcsRUFBRTtnQkFDMUMsZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxvQkFBUSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQzthQUN2RjtZQUVELE1BQU0sR0FBRyxHQUEwQixJQUFJLHNCQUFzQixDQUFDLFdBQVcsRUFBRSxhQUFhLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDM0csSUFBRyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLFVBQVUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUM7Z0JBQzVELEdBQUcsQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQzthQUM5QztpQkFBTTtnQkFDTCxHQUFHLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzlDLElBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLEVBQUM7b0JBQ2pDLEdBQUcsQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztpQkFDM0M7YUFDRjtZQUVELE1BQU0sT0FBTyxHQUFTLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMvRSxJQUFHLE9BQU8sT0FBTyxLQUFLLFdBQVcsRUFBRTtnQkFDakMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxHQUFHLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUM5QixVQUFVLEdBQUcsR0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFDO2FBQy9CO2lCQUFNO2dCQUNMLE1BQU0sT0FBTyxDQUFDO2FBQ2Y7WUFFRCxNQUFNLFFBQVEsR0FBWSxJQUFJLG1CQUFRLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUUvRyxPQUFPLElBQUksZUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2xDLENBQUMsQ0FBQztJQUNKLENBQUM7SUEzZUMsd0JBQXdCO0lBRXhCLFdBQVcsQ0FBQyxNQUFhLEVBQUUsV0FBOEIsS0FBSztRQUM1RCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwQyxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDZixLQUFJLElBQUksTUFBTSxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBQztZQUNoQyxJQUFJLGFBQWEsR0FBVSxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3BGLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1lBQ2xDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3JFO1FBQ0QsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO1FBQ3RCLEtBQUksSUFBSSxPQUFPLElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFDO1lBQ3hDLElBQUksY0FBYyxHQUFVLFVBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDakYsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDO1lBQ3JCLEtBQUksSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFDO2dCQUNoRCxJQUFJLGFBQWEsR0FBVSxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNwRixXQUFXLENBQUMsYUFBYSxDQUFDLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQzthQUMzSDtZQUNELFlBQVksQ0FBQyxjQUFjLENBQUMsR0FBRyxXQUFXLENBQUM7U0FDNUM7UUFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztJQUNuQyxDQUFDO0lBRUQsU0FBUyxDQUFDLElBQWtCO1FBQzFCLE1BQU0sT0FBTyxHQUFRLElBQUksSUFBSSxFQUFFLENBQUM7UUFDaEMsZUFBZTtRQUNmLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO1lBQzVCLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQy9DO2FBQU0sSUFBSSxJQUFJLFlBQVksb0JBQVksRUFBRTtZQUN2QyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCO1NBQ3REO2FBQU07WUFDTCwwQkFBMEI7WUFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxtRUFBbUUsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUM1RjtRQUNELE9BQU8sT0FBTyxDQUFBO0lBQ2hCLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBRyxJQUFVO1FBQ2xCLE9BQU8sSUFBSSxPQUFPLEVBQVUsQ0FBQztJQUMvQixDQUFDO0lBRUQsS0FBSztRQUNILE1BQU0sTUFBTSxHQUFXLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNyQyxNQUFNLFFBQVEsR0FBZSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDaEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUN6QixPQUFPLE1BQWMsQ0FBQztJQUN4QixDQUFDO0lBRUQsU0FBUyxDQUFDLEdBQU0sRUFBRSxVQUFpQjtRQUNqQyxPQUFPLENBQUMsT0FBTyxHQUFHLEtBQUssV0FBVztZQUNoQyxPQUFPLFVBQVUsS0FBSyxXQUFXO1lBQ2pDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxVQUFVLFlBQVksZUFBTSxDQUNsRCxDQUFDO0lBQ0osQ0FBQztDQXFiRjtBQS9lRCwwQkErZUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktQ29udHJhY3RWTS1VVFhPc1xuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tICdidWZmZXIvJztcbmltcG9ydCBCaW5Ub29scyBmcm9tICcuLi8uLi91dGlscy9iaW50b29scyc7XG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCI7XG5pbXBvcnQgeyBBbW91bnRPdXRwdXQsIFNlbGVjdE91dHB1dENsYXNzLCBUcmFuc2ZlcmFibGVPdXRwdXQsIFNFQ1BPd25lck91dHB1dCwgUGFyc2VhYmxlT3V0cHV0LCBTdGFrZWFibGVMb2NrT3V0LCBTRUNQVHJhbnNmZXJPdXRwdXQgfSBmcm9tICcuL291dHB1dHMnO1xuaW1wb3J0IHsgQW1vdW50SW5wdXQsIFNFQ1BUcmFuc2ZlcklucHV0LCBTdGFrZWFibGVMb2NrSW4sIFRyYW5zZmVyYWJsZUlucHV0LCBQYXJzZWFibGVJbnB1dCB9IGZyb20gJy4vaW5wdXRzJztcbmltcG9ydCB7IFVuaXhOb3cgfSBmcm9tICcuLi8uLi91dGlscy9oZWxwZXJmdW5jdGlvbnMnO1xuaW1wb3J0IHsgU3RhbmRhcmRVVFhPLCBTdGFuZGFyZFVUWE9TZXQgfSBmcm9tICcuLi8uLi9jb21tb24vdXR4b3MnO1xuaW1wb3J0IHsgQ29udHJhY3RWTUNvbnN0YW50cyB9IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7IFVuc2lnbmVkVHggfSBmcm9tICcuL3R4JztcbmltcG9ydCB7IEV4cG9ydFR4IH0gZnJvbSAnLi4vY29udHJhY3R2bS9leHBvcnR0eCc7XG5pbXBvcnQgeyBEZWZhdWx0TmV0d29ya0lELCBEZWZhdWx0cyB9IGZyb20gJy4uLy4uL3V0aWxzL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBJbXBvcnRUeCB9IGZyb20gJy4uL2NvbnRyYWN0dm0vaW1wb3J0dHgnO1xuaW1wb3J0IHsgQmFzZVR4IH0gZnJvbSAnLi4vY29udHJhY3R2bS9iYXNldHgnO1xuaW1wb3J0IHsgU3RhbmRhcmRBc3NldEFtb3VudERlc3RpbmF0aW9uLCBBc3NldEFtb3VudCB9IGZyb20gJy4uLy4uL2NvbW1vbi9hc3NldGFtb3VudCc7XG5pbXBvcnQgeyBPdXRwdXQgfSBmcm9tICcuLi8uLi9jb21tb24vb3V0cHV0JztcbmltcG9ydCB7IFNlcmlhbGl6YXRpb24sIFNlcmlhbGl6ZWRFbmNvZGluZyB9IGZyb20gJy4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb24nO1xuXG4vKipcbiAqIEBpZ25vcmVcbiAqL1xuY29uc3QgYmludG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpO1xuY29uc3Qgc2VyaWFsaXplciA9IFNlcmlhbGl6YXRpb24uZ2V0SW5zdGFuY2UoKTtcblxuLyoqXG4gKiBDbGFzcyBmb3IgcmVwcmVzZW50aW5nIGEgc2luZ2xlIFVUWE8uXG4gKi9cbmV4cG9ydCBjbGFzcyBVVFhPIGV4dGVuZHMgU3RhbmRhcmRVVFhPIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVVRYT1wiO1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZDtcblxuICAvL3NlcmlhbGl6ZSBpcyBpbmhlcml0ZWRcblxuICBkZXNlcmlhbGl6ZShmaWVsZHM6b2JqZWN0LCBlbmNvZGluZzpTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZyk7XG4gICAgdGhpcy5vdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhmaWVsZHNbXCJvdXRwdXRcIl1bXCJfdHlwZUlEXCJdKTtcbiAgICB0aGlzLm91dHB1dC5kZXNlcmlhbGl6ZShmaWVsZHNbXCJvdXRwdXRcIl0sIGVuY29kaW5nKTtcbiAgfVxuXG4gIGZyb21CdWZmZXIoYnl0ZXM6QnVmZmVyLCBvZmZzZXQ6bnVtYmVyID0gMCk6bnVtYmVyIHtcbiAgICB0aGlzLmNvZGVjaWQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyKTtcbiAgICBvZmZzZXQgKz0gMjtcbiAgICB0aGlzLnR4aWQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAzMik7XG4gICAgb2Zmc2V0ICs9IDMyO1xuICAgIHRoaXMub3V0cHV0aWR4ID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNCk7XG4gICAgb2Zmc2V0ICs9IDQ7XG4gICAgdGhpcy5hc3NldGlkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpO1xuICAgIG9mZnNldCArPSAzMjtcbiAgICBjb25zdCBvdXRwdXRpZDpudW1iZXIgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KS5yZWFkVUludDMyQkUoMCk7XG4gICAgb2Zmc2V0ICs9IDQ7XG4gICAgdGhpcy5vdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhvdXRwdXRpZCk7XG4gICAgcmV0dXJuIHRoaXMub3V0cHV0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldCk7XG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYSBiYXNlLTU4IHN0cmluZyBjb250YWluaW5nIGEgW1tVVFhPXV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgU3RhbmRhcmRVVFhPIGluIGJ5dGVzLlxuICAgKlxuICAgKiBAcGFyYW0gc2VyaWFsaXplZCBBIGJhc2UtNTggc3RyaW5nIGNvbnRhaW5pbmcgYSByYXcgW1tVVFhPXV1cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgcmF3IFtbVVRYT11dXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIHVubGlrZSBtb3N0IGZyb21TdHJpbmdzLCBpdCBleHBlY3RzIHRoZSBzdHJpbmcgdG8gYmUgc2VyaWFsaXplZCBpbiBjYjU4IGZvcm1hdFxuICAgKi9cbiAgZnJvbVN0cmluZyhzZXJpYWxpemVkOnN0cmluZyk6bnVtYmVyIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICByZXR1cm4gdGhpcy5mcm9tQnVmZmVyKGJpbnRvb2xzLmNiNThEZWNvZGUoc2VyaWFsaXplZCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBiYXNlLTU4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW1VUWE9dXS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogdW5saWtlIG1vc3QgdG9TdHJpbmdzLCB0aGlzIHJldHVybnMgaW4gY2I1OCBzZXJpYWxpemF0aW9uIGZvcm1hdFxuICAgKi9cbiAgdG9TdHJpbmcoKTpzdHJpbmcge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgcmV0dXJuIGJpbnRvb2xzLmNiNThFbmNvZGUodGhpcy50b0J1ZmZlcigpKTtcbiAgfVxuXG4gIGNsb25lKCk6dGhpcyB7XG4gICAgY29uc3QgdXR4bzpVVFhPID0gbmV3IFVUWE8oKTtcbiAgICB1dHhvLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKTtcbiAgICByZXR1cm4gdXR4byBhcyB0aGlzO1xuICB9XG5cbiAgY3JlYXRlKFxuICAgIGNvZGVjSUQ6bnVtYmVyID0gQ29udHJhY3RWTUNvbnN0YW50cy5MQVRFU1RDT0RFQywgXG4gICAgdHhpZDpCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgb3V0cHV0aWR4OkJ1ZmZlciB8IG51bWJlciA9IHVuZGVmaW5lZCxcbiAgICBhc3NldGlkOkJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBvdXRwdXQ6T3V0cHV0ID0gdW5kZWZpbmVkKTp0aGlzIFxuICB7XG4gICAgcmV0dXJuIG5ldyBVVFhPKGNvZGVjSUQsIHR4aWQsIG91dHB1dGlkeCwgYXNzZXRpZCwgb3V0cHV0KSBhcyB0aGlzO1xuICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIEFzc2V0QW1vdW50RGVzdGluYXRpb24gZXh0ZW5kcyBTdGFuZGFyZEFzc2V0QW1vdW50RGVzdGluYXRpb248VHJhbnNmZXJhYmxlT3V0cHV0LCBUcmFuc2ZlcmFibGVJbnB1dD4ge31cblxuLyoqXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYSBzZXQgb2YgW1tVVFhPXV1zLlxuICovXG5leHBvcnQgY2xhc3MgVVRYT1NldCBleHRlbmRzIFN0YW5kYXJkVVRYT1NldDxVVFhPPntcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVVRYT1NldFwiO1xuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZDtcblxuICAvL3NlcmlhbGl6ZSBpcyBpbmhlcml0ZWRcblxuICBkZXNlcmlhbGl6ZShmaWVsZHM6b2JqZWN0LCBlbmNvZGluZzpTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZyk7XG4gICAgbGV0IHV0eG9zID0ge307XG4gICAgZm9yKGxldCB1dHhvaWQgaW4gZmllbGRzW1widXR4b3NcIl0pe1xuICAgICAgbGV0IHV0eG9pZENsZWFuZWQ6c3RyaW5nID0gc2VyaWFsaXplci5kZWNvZGVyKHV0eG9pZCwgZW5jb2RpbmcsIFwiYmFzZTU4XCIsIFwiYmFzZTU4XCIpO1xuICAgICAgdXR4b3NbdXR4b2lkQ2xlYW5lZF0gPSBuZXcgVVRYTygpO1xuICAgICAgdXR4b3NbdXR4b2lkQ2xlYW5lZF0uZGVzZXJpYWxpemUoZmllbGRzW1widXR4b3NcIl1bdXR4b2lkXSwgZW5jb2RpbmcpO1xuICAgIH1cbiAgICBsZXQgYWRkcmVzc1VUWE9zID0ge307XG4gICAgZm9yKGxldCBhZGRyZXNzIGluIGZpZWxkc1tcImFkZHJlc3NVVFhPc1wiXSl7XG4gICAgICBsZXQgYWRkcmVzc0NsZWFuZWQ6c3RyaW5nID0gc2VyaWFsaXplci5kZWNvZGVyKGFkZHJlc3MsIGVuY29kaW5nLCBcImNiNThcIiwgXCJoZXhcIik7XG4gICAgICBsZXQgdXR4b2JhbGFuY2UgPSB7fTtcbiAgICAgIGZvcihsZXQgdXR4b2lkIGluIGZpZWxkc1tcImFkZHJlc3NVVFhPc1wiXVthZGRyZXNzXSl7XG4gICAgICAgIGxldCB1dHhvaWRDbGVhbmVkOnN0cmluZyA9IHNlcmlhbGl6ZXIuZGVjb2Rlcih1dHhvaWQsIGVuY29kaW5nLCBcImJhc2U1OFwiLCBcImJhc2U1OFwiKTtcbiAgICAgICAgdXR4b2JhbGFuY2VbdXR4b2lkQ2xlYW5lZF0gPSBzZXJpYWxpemVyLmRlY29kZXIoZmllbGRzW1wiYWRkcmVzc1VUWE9zXCJdW2FkZHJlc3NdW3V0eG9pZF0sIGVuY29kaW5nLCBcImRlY2ltYWxTdHJpbmdcIiwgXCJCTlwiKTtcbiAgICAgIH1cbiAgICAgIGFkZHJlc3NVVFhPc1thZGRyZXNzQ2xlYW5lZF0gPSB1dHhvYmFsYW5jZTtcbiAgICB9XG4gICAgdGhpcy51dHhvcyA9IHV0eG9zO1xuICAgIHRoaXMuYWRkcmVzc1VUWE9zID0gYWRkcmVzc1VUWE9zO1xuICB9XG5cbiAgcGFyc2VVVFhPKHV0eG86VVRYTyB8IHN0cmluZyk6VVRYTyB7XG4gICAgY29uc3QgdXR4b3ZhcjpVVFhPID0gbmV3IFVUWE8oKTtcbiAgICAvLyBmb3JjZSBhIGNvcHlcbiAgICBpZiAodHlwZW9mIHV0eG8gPT09ICdzdHJpbmcnKSB7XG4gICAgICB1dHhvdmFyLmZyb21CdWZmZXIoYmludG9vbHMuY2I1OERlY29kZSh1dHhvKSk7XG4gICAgfSBlbHNlIGlmICh1dHhvIGluc3RhbmNlb2YgU3RhbmRhcmRVVFhPKSB7XG4gICAgICB1dHhvdmFyLmZyb21CdWZmZXIodXR4by50b0J1ZmZlcigpKTsgLy8gZm9yY2VzIGEgY29weVxuICAgIH0gZWxzZSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciAtIFVUWE8ucGFyc2VVVFhPOiB1dHhvIHBhcmFtZXRlciBpcyBub3QgYSBVVFhPIG9yIHN0cmluZzogJHt1dHhvfWApO1xuICAgIH1cbiAgICByZXR1cm4gdXR4b3ZhclxuICB9XG5cbiAgY3JlYXRlKC4uLmFyZ3M6YW55W10pOnRoaXN7XG4gICAgcmV0dXJuIG5ldyBVVFhPU2V0KCkgYXMgdGhpcztcbiAgfVxuXG4gIGNsb25lKCk6dGhpcyB7XG4gICAgY29uc3QgbmV3c2V0OlVUWE9TZXQgPSB0aGlzLmNyZWF0ZSgpO1xuICAgIGNvbnN0IGFsbFVUWE9zOkFycmF5PFVUWE8+ID0gdGhpcy5nZXRBbGxVVFhPcygpO1xuICAgIG5ld3NldC5hZGRBcnJheShhbGxVVFhPcylcbiAgICByZXR1cm4gbmV3c2V0IGFzIHRoaXM7XG4gIH1cblxuICBfZmVlQ2hlY2soZmVlOkJOLCBmZWVBc3NldElEOkJ1ZmZlcik6Ym9vbGVhbiB7XG4gICAgcmV0dXJuICh0eXBlb2YgZmVlICE9PSBcInVuZGVmaW5lZFwiICYmIFxuICAgICAgdHlwZW9mIGZlZUFzc2V0SUQgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgIGZlZS5ndChuZXcgQk4oMCkpICYmIGZlZUFzc2V0SUQgaW5zdGFuY2VvZiBCdWZmZXJcbiAgICApO1xuICB9XG5cbiAgZ2V0TWluaW11bVNwZW5kYWJsZSA9IChhYWQ6QXNzZXRBbW91bnREZXN0aW5hdGlvbiwgYXNPZjpCTiA9IFVuaXhOb3coKSwgbG9ja3RpbWU6Qk4gPSBuZXcgQk4oMCksIHRocmVzaG9sZDpudW1iZXIgPSAxLCBzdGFrZWFibGU6Ym9vbGVhbiA9IGZhbHNlKTpFcnJvciA9PiB7XG4gICAgY29uc3QgdXR4b0FycmF5OkFycmF5PFVUWE8+ID0gdGhpcy5nZXRBbGxVVFhPcygpLmZpbHRlcigodSkgPT4ge1xuICAgICAgaWYoIXN0YWtlYWJsZSAmJiB1LmdldE91dHB1dCgpIGluc3RhbmNlb2YgU3Rha2VhYmxlTG9ja091dCAmJiAodS5nZXRPdXRwdXQoKSBhcyBTdGFrZWFibGVMb2NrT3V0KS5nZXRTdGFrZWFibGVMb2NrdGltZSgpLmd0KGFzT2YpKXtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIGNvbnN0IG91dHM6b2JqZWN0ID0ge307XG4gICAgZm9yKGxldCBpID0gMDsgaSA8IHV0eG9BcnJheS5sZW5ndGggJiYgIWFhZC5jYW5Db21wbGV0ZSgpOyBpKyspIHtcbiAgICAgIGNvbnN0IHU6VVRYTyA9IHV0eG9BcnJheVtpXTtcbiAgICAgIGNvbnN0IGFzc2V0S2V5OnN0cmluZyA9IHUuZ2V0QXNzZXRJRCgpLnRvU3RyaW5nKFwiaGV4XCIpO1xuICAgICAgY29uc3QgZnJvbUFkZHJlc3NlczpBcnJheTxCdWZmZXI+ID0gYWFkLmdldFNlbmRlcnMoKTtcbiAgICAgIGlmKHUuZ2V0T3V0cHV0KCkgaW5zdGFuY2VvZiBBbW91bnRPdXRwdXQgJiYgYWFkLmFzc2V0RXhpc3RzKGFzc2V0S2V5KSAmJiB1LmdldE91dHB1dCgpLm1lZXRzVGhyZXNob2xkKGZyb21BZGRyZXNzZXMsIGFzT2YpKSB7XG4gICAgICAgIGNvbnN0IGFtOkFzc2V0QW1vdW50ID0gYWFkLmdldEFzc2V0QW1vdW50KGFzc2V0S2V5KTtcbiAgICAgICAgaWYoIWFtLmlzRmluaXNoZWQoKSkge1xuICAgICAgICAgIGNvbnN0IHVvdXQ6QW1vdW50T3V0cHV0ID0gdS5nZXRPdXRwdXQoKSBhcyBBbW91bnRPdXRwdXQ7XG4gICAgICAgICAgaWYoIShhc3NldEtleSBpbiBvdXRzKSkge1xuICAgICAgICAgICAgb3V0c1thc3NldEtleV0gPSB7XG4gICAgICAgICAgICAgIGxvY2tlZFN0YWtlYWJsZTpbXSxcbiAgICAgICAgICAgICAgdW5sb2NrZWQ6W11cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGFtb3VudCA9IHVvdXQuZ2V0QW1vdW50KCk7XG4gICAgICAgICAgY29uc3QgdHhpZDpCdWZmZXIgPSB1LmdldFR4SUQoKTtcbiAgICAgICAgICBjb25zdCBvdXRwdXRpZHg6QnVmZmVyID0gdS5nZXRPdXRwdXRJZHgoKTtcbiAgICAgICAgICBsZXQgaW5wdXQ6QW1vdW50SW5wdXQ7XG4gICAgICAgICAgaWYodW91dCBpbnN0YW5jZW9mIFN0YWtlYWJsZUxvY2tPdXQpIHtcbiAgICAgICAgICAgIGxldCBzdGFrZW91dDpTdGFrZWFibGVMb2NrT3V0ID0gdW91dCBhcyBTdGFrZWFibGVMb2NrT3V0O1xuICAgICAgICAgICAgbGV0IHBpbnB1dDpQYXJzZWFibGVJbnB1dCA9IG5ldyBQYXJzZWFibGVJbnB1dChuZXcgU0VDUFRyYW5zZmVySW5wdXQoYW1vdW50KSk7XG4gICAgICAgICAgICBpbnB1dCA9IG5ldyBTdGFrZWFibGVMb2NrSW4oYW1vdW50LCBzdGFrZW91dC5nZXRTdGFrZWFibGVMb2NrdGltZSgpLCBwaW5wdXQpO1xuICAgICAgICAgICAgYW0uc3BlbmRBbW91bnQoYW1vdW50LCB0cnVlKTtcbiAgICAgICAgICAgIG91dHNbYXNzZXRLZXldLmxvY2tlZFN0YWtlYWJsZS5wdXNoKHVvdXQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbnB1dCA9IG5ldyBTRUNQVHJhbnNmZXJJbnB1dChhbW91bnQpO1xuICAgICAgICAgICAgYW0uc3BlbmRBbW91bnQoYW1vdW50LCBmYWxzZSk7XG4gICAgICAgICAgICBvdXRzW2Fzc2V0S2V5XS51bmxvY2tlZC5wdXNoKHVvdXQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHhmZXJpbjpUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCh0eGlkLCBvdXRwdXRpZHgsIHUuZ2V0QXNzZXRJRCgpLCBpbnB1dCk7XG4gICAgICAgICAgY29uc3Qgc3BlbmRlcnM6QXJyYXk8QnVmZmVyPiA9IHVvdXQuZ2V0U3BlbmRlcnMoZnJvbUFkZHJlc3NlcywgYXNPZik7XG4gICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBzcGVuZGVycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgY29uc3QgaWR4Om51bWJlciA9IHVvdXQuZ2V0QWRkcmVzc0lkeChzcGVuZGVyc1tqXSk7XG4gICAgICAgICAgICBpZiAoaWR4ID09PSAtMSkge1xuICAgICAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Vycm9yIC0gVVRYT1NldC5nZXRNaW5pbXVtU3BlbmRhYmxlOiBubyBzdWNoICdcbiAgICAgICAgICAgICAgKyBgYWRkcmVzcyBpbiBvdXRwdXQ6ICR7c3BlbmRlcnNbal19YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB4ZmVyaW4uZ2V0SW5wdXQoKS5hZGRTaWduYXR1cmVJZHgoaWR4LCBzcGVuZGVyc1tqXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGFhZC5hZGRJbnB1dCh4ZmVyaW4pO1xuICAgICAgICB9IGVsc2UgaWYoYWFkLmFzc2V0RXhpc3RzKGFzc2V0S2V5KSAmJiAhKHUuZ2V0T3V0cHV0KCkgaW5zdGFuY2VvZiBBbW91bnRPdXRwdXQpKSB7XG4gICAgICAgICAgLyoqXG4gICAgICAgICAgICogTGVhdmluZyB0aGUgYmVsb3cgbGluZXMsIG5vdCBzaW1wbHkgZm9yIHBvc3Rlcml0eSwgYnV0IGZvciBjbGFyaWZpY2F0aW9uLlxuICAgICAgICAgICAqIEFzc2V0SURzIG1heSBoYXZlIG1peGVkIE91dHB1dFR5cGVzLiBcbiAgICAgICAgICAgKiBTb21lIG9mIHRob3NlIE91dHB1dFR5cGVzIG1heSBpbXBsZW1lbnQgQW1vdW50T3V0cHV0LlxuICAgICAgICAgICAqIE90aGVycyBtYXkgbm90LlxuICAgICAgICAgICAqIFNpbXBseSBjb250aW51ZSBpbiB0aGlzIGNvbmRpdGlvbi5cbiAgICAgICAgICAgKi9cbiAgICAgICAgICAvKnJldHVybiBuZXcgRXJyb3IoJ0Vycm9yIC0gVVRYT1NldC5nZXRNaW5pbXVtU3BlbmRhYmxlOiBvdXRwdXRJRCBkb2VzIG5vdCAnXG4gICAgICAgICAgICArIGBpbXBsZW1lbnQgQW1vdW50T3V0cHV0OiAke3UuZ2V0T3V0cHV0KCkuZ2V0T3V0cHV0SUR9YCk7Ki9cbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmKCFhYWQuY2FuQ29tcGxldGUoKSkge1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcignRXJyb3IgLSBVVFhPU2V0LmdldE1pbmltdW1TcGVuZGFibGU6IGluc3VmZmljaWVudCAnXG4gICAgICArICdmdW5kcyB0byBjcmVhdGUgdGhlIHRyYW5zYWN0aW9uJyk7XG4gICAgfVxuICAgIGNvbnN0IGFtb3VudHM6QXJyYXk8QXNzZXRBbW91bnQ+ID0gYWFkLmdldEFtb3VudHMoKTtcbiAgICBjb25zdCB6ZXJvOkJOID0gbmV3IEJOKDApO1xuICAgIGZvcihsZXQgaSA9IDA7IGkgPCBhbW91bnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBhc3NldEtleTpzdHJpbmcgPSBhbW91bnRzW2ldLmdldEFzc2V0SURTdHJpbmcoKTtcbiAgICAgIGNvbnN0IGNoYW5nZTpCTiA9IGFtb3VudHNbaV0uZ2V0Q2hhbmdlKCk7XG4gICAgICBjb25zdCBzdGFrZWFibGVMb2NrZWRBbW91bnQ6Qk4gPSBhbW91bnRzW2ldLmdldFN0YWtlYWJsZUxvY2tTcGVudCgpO1xuICAgICAgY29uc3QgaXNTdGFrZWFibGVMb2NrQ2hhbmdlID0gYW1vdW50c1tpXS5nZXRTdGFrZWFibGVMb2NrQ2hhbmdlKCk7XG4gICAgICBjb25zdCB1bmxvY2tlZEFtb3VudDpCTiA9IGFtb3VudHNbaV0uZ2V0U3BlbnQoKS5zdWIoaXNTdGFrZWFibGVMb2NrQ2hhbmdlID8gc3Rha2VhYmxlTG9ja2VkQW1vdW50IDogc3Rha2VhYmxlTG9ja2VkQW1vdW50LmFkZChjaGFuZ2UpKTtcbiAgICAgIFxuICAgICAgaWYgKHVubG9ja2VkQW1vdW50Lmd0KHplcm8pIHx8IHN0YWtlYWJsZUxvY2tlZEFtb3VudC5ndCh6ZXJvKSB8fCBjaGFuZ2UuZ3QoemVybykpIHtcbiAgICAgICAgaWYoc3Rha2VhYmxlTG9ja2VkQW1vdW50Lmd0KHplcm8pIHx8IChpc1N0YWtlYWJsZUxvY2tDaGFuZ2UgJiYgY2hhbmdlLmd0KHplcm8pKSkge1xuICAgICAgICAgIGxldCBsczpBcnJheTxTdGFrZWFibGVMb2NrT3V0PiA9IG91dHNbYXNzZXRLZXldLmxvY2tlZFN0YWtlYWJsZTtcbiAgICAgICAgICBsZXQgc2NoYW5nZTpCTiA9IGlzU3Rha2VhYmxlTG9ja0NoYW5nZSA/IGNoYW5nZSA6IHplcm8uY2xvbmUoKTtcbiAgICAgICAgICBmb3IobGV0IGogPSAwOyBqIDwgbHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGxldCBzdGFrZWFibGVMb2NrdGltZTpCTiA9IGxzW2pdLmdldFN0YWtlYWJsZUxvY2t0aW1lKCk7XG4gICAgICAgICAgICBsZXQgcG91dDpQYXJzZWFibGVPdXRwdXQgPSBsc1tqXS5nZXRUcmFuc2ZlcmFibGVPdXRwdXQoKTtcbiAgICAgICAgICAgIGxldCBvOkFtb3VudE91dHB1dCA9IHBvdXQuZ2V0T3V0cHV0KCkgYXMgQW1vdW50T3V0cHV0O1xuICAgICAgICAgICAgbGV0IHNwZW5kbWU6Qk4gPSBvLmdldEFtb3VudCgpO1xuICAgICAgICAgICAgLy8gRllJIC0gWW91IGNhbiBhbHdheXMgZ3VhcmFudGVlIHRoYXQgdGhlIGxhc3QgZWxlbWVudCBvZiB0aGUgbHMgYXJyYXkgaXMgdGhlIG9uZSB3aG8gZ2l2ZXMgY2hhbmdlIChpZiBhbnkpXG4gICAgICAgICAgICBpZihqID09IGxzLmxlbmd0aCAtIDEgJiYgc2NoYW5nZS5ndCh6ZXJvKSkgeyBcbiAgICAgICAgICAgICAgc3BlbmRtZSA9IHNwZW5kbWUuc3ViKGNoYW5nZSk7XG4gICAgICAgICAgICAgIGxldCBzY2hhbmdlTmV3T3V0OkFtb3VudE91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKFxuICAgICAgICAgICAgICAgICAgby5nZXRPdXRwdXRJRCgpLCBcbiAgICAgICAgICAgICAgICAgIHNjaGFuZ2UsIFxuICAgICAgICAgICAgICAgICAgby5nZXRBZGRyZXNzZXMoKSwgXG4gICAgICAgICAgICAgICAgICBvLmdldExvY2t0aW1lKCksIFxuICAgICAgICAgICAgICAgICAgby5nZXRUaHJlc2hvbGQoKVxuICAgICAgICAgICAgICApIGFzIEFtb3VudE91dHB1dDtcbiAgICAgICAgICAgICAgbGV0IHNjaGFuZ2VPdXQ6U3Rha2VhYmxlTG9ja091dCA9IFNlbGVjdE91dHB1dENsYXNzKFxuICAgICAgICAgICAgICAgICAgbHNbal0uZ2V0T3V0cHV0SUQoKSxcbiAgICAgICAgICAgICAgICAgIHNjaGFuZ2UsICBcbiAgICAgICAgICAgICAgICAgIG8uZ2V0QWRkcmVzc2VzKCksIFxuICAgICAgICAgICAgICAgICAgby5nZXRMb2NrdGltZSgpLCBcbiAgICAgICAgICAgICAgICAgIG8uZ2V0VGhyZXNob2xkKCksIFxuICAgICAgICAgICAgICAgICAgc3Rha2VhYmxlTG9ja3RpbWUsIFxuICAgICAgICAgICAgICAgICAgbmV3IFBhcnNlYWJsZU91dHB1dChzY2hhbmdlTmV3T3V0KVxuICAgICAgICAgICAgICApIGFzIFN0YWtlYWJsZUxvY2tPdXQ7XG4gICAgICAgICAgICAgIGNvbnN0IHhmZXJvdXQ6VHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChhbW91bnRzW2ldLmdldEFzc2V0SUQoKSwgc2NoYW5nZU91dCk7XG4gICAgICAgICAgICAgIGFhZC5hZGRDaGFuZ2UoeGZlcm91dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgbmV3b3V0OkFtb3VudE91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKFxuICAgICAgICAgICAgICBvLmdldE91dHB1dElEKCksIFxuICAgICAgICAgICAgICBzcGVuZG1lLCBcbiAgICAgICAgICAgICAgby5nZXRBZGRyZXNzZXMoKSwgXG4gICAgICAgICAgICAgIG8uZ2V0TG9ja3RpbWUoKSwgXG4gICAgICAgICAgICAgIG8uZ2V0VGhyZXNob2xkKClcbiAgICAgICAgICAgICkgYXMgQW1vdW50T3V0cHV0O1xuICAgICAgICAgICAgbGV0IHNwZW5kb3V0OlN0YWtlYWJsZUxvY2tPdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhcbiAgICAgICAgICAgICAgbHNbal0uZ2V0T3V0cHV0SUQoKSxcbiAgICAgICAgICAgICAgc3BlbmRtZSwgIFxuICAgICAgICAgICAgICBvLmdldEFkZHJlc3NlcygpLCBcbiAgICAgICAgICAgICAgby5nZXRMb2NrdGltZSgpLCBcbiAgICAgICAgICAgICAgby5nZXRUaHJlc2hvbGQoKSwgXG4gICAgICAgICAgICAgIHN0YWtlYWJsZUxvY2t0aW1lLCBcbiAgICAgICAgICAgICAgbmV3IFBhcnNlYWJsZU91dHB1dChuZXdvdXQpXG4gICAgICAgICAgICApIGFzIFN0YWtlYWJsZUxvY2tPdXQ7XG4gICAgICAgICAgICBjb25zdCB4ZmVyb3V0OlRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYW1vdW50c1tpXS5nZXRBc3NldElEKCksIHNwZW5kb3V0KTtcbiAgICAgICAgICAgIGFhZC5hZGRPdXRwdXQoeGZlcm91dCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYodW5sb2NrZWRBbW91bnQuZ3QoemVybykpIHtcbiAgICAgICAgICBsZXQgdWNoYW5nZTpCTiA9IGlzU3Rha2VhYmxlTG9ja0NoYW5nZSA/IHplcm8uY2xvbmUoKSA6IGNoYW5nZTtcbiAgICAgICAgICBpZih1Y2hhbmdlLmd0KHplcm8pKSB7XG4gICAgICAgICAgICBsZXQgc2NoYW5nZU91dDpBbW91bnRPdXRwdXQgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KFxuICAgICAgICAgICAgICB1Y2hhbmdlLCBcbiAgICAgICAgICAgICAgYWFkLmdldENoYW5nZUFkZHJlc3NlcygpLFxuICAgICAgICAgICAgICBsb2NrdGltZSwgXG4gICAgICAgICAgICAgIHRocmVzaG9sZFxuICAgICAgICAgICAgKSBhcyBBbW91bnRPdXRwdXQ7XG4gICAgICAgICAgICBjb25zdCB4ZmVyb3V0OlRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYW1vdW50c1tpXS5nZXRBc3NldElEKCksIHNjaGFuZ2VPdXQpO1xuICAgICAgICAgICAgYWFkLmFkZENoYW5nZSh4ZmVyb3V0KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbGV0IHNwZW5kb3V0OkFtb3VudE91dHB1dDtcbiAgICAgICAgICBzcGVuZG91dCA9IG5ldyBTRUNQVHJhbnNmZXJPdXRwdXQoXG4gICAgICAgICAgICB1bmxvY2tlZEFtb3VudCwgXG4gICAgICAgICAgICBhYWQuZ2V0RGVzdGluYXRpb25zKCksXG4gICAgICAgICAgICBsb2NrdGltZSwgXG4gICAgICAgICAgICB0aHJlc2hvbGRcbiAgICAgICAgICApIGFzIEFtb3VudE91dHB1dDtcbiAgICAgICAgICBjb25zdCB4ZmVyb3V0OlRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYW1vdW50c1tpXS5nZXRBc3NldElEKCksIHNwZW5kb3V0KTtcbiAgICAgICAgICBhYWQuYWRkT3V0cHV0KHhmZXJvdXQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBbW1Vuc2lnbmVkVHhdXSB3cmFwcGluZyBhIFtbQmFzZVR4XV0uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIHdyYXBwaW5nIGEgW1tCYXNlVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMgYW5kIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zKS5cbiAgICpcbiAgICogQHBhcmFtIG5ldHdvcmtpZCBUaGUgbnVtYmVyIHJlcHJlc2VudGluZyBOZXR3b3JrSUQgb2YgdGhlIG5vZGVcbiAgICogQHBhcmFtIGJsb2NrY2hhaW5pZCBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBCbG9ja2NoYWluSUQgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgb2YgdGhlIGFzc2V0IHRvIGJlIHNwZW50IGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59LlxuICAgKiBAcGFyYW0gYXNzZXRJRCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiB0aGUgYXNzZXQgSUQgZm9yIHRoZSBVVFhPXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIE9wdGlvbmFsLiBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zLiBEZWZhdWx0OiB0b0FkZHJlc3Nlc1xuICAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLiBEZWZhdWx0OiBhc3NldElEXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsLiBDb250YWlucyBhcmJpdHJhcnkgZGF0YSwgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBvdXRwdXRzXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqIFxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKi9cbiAgYnVpbGRCYXNlVHggPSAoXG4gICAgbmV0d29ya2lkOm51bWJlcixcbiAgICBibG9ja2NoYWluaWQ6QnVmZmVyLFxuICAgIGFtb3VudDpCTixcbiAgICBhc3NldElEOkJ1ZmZlcixcbiAgICB0b0FkZHJlc3NlczpBcnJheTxCdWZmZXI+LFxuICAgIGZyb21BZGRyZXNzZXM6QXJyYXk8QnVmZmVyPixcbiAgICBjaGFuZ2VBZGRyZXNzZXM6QXJyYXk8QnVmZmVyPiA9IHVuZGVmaW5lZCxcbiAgICBmZWU6Qk4gPSB1bmRlZmluZWQsXG4gICAgZmVlQXNzZXRJRDpCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgbWVtbzpCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjpCTiA9IFVuaXhOb3coKSxcbiAgICBsb2NrdGltZTpCTiA9IG5ldyBCTigwKSxcbiAgICB0aHJlc2hvbGQ6bnVtYmVyID0gMVxuICApOlVuc2lnbmVkVHggPT4ge1xuXG4gICAgaWYodGhyZXNob2xkID4gdG9BZGRyZXNzZXMubGVuZ3RoKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciAtIFVUWE9TZXQuYnVpbGRCYXNlVHg6IHRocmVzaG9sZCBpcyBncmVhdGVyIHRoYW4gbnVtYmVyIG9mIGFkZHJlc3Nlc2ApO1xuICAgIH1cblxuICAgIGlmKHR5cGVvZiBjaGFuZ2VBZGRyZXNzZXMgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyA9IHRvQWRkcmVzc2VzO1xuICAgIH1cblxuICAgIGlmKHR5cGVvZiBmZWVBc3NldElEID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBmZWVBc3NldElEID0gYXNzZXRJRDtcbiAgICB9XG5cbiAgICBjb25zdCB6ZXJvOkJOID0gbmV3IEJOKDApO1xuICAgIFxuICAgIGlmIChhbW91bnQuZXEoemVybykpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgYWFkOkFzc2V0QW1vdW50RGVzdGluYXRpb24gPSBuZXcgQXNzZXRBbW91bnREZXN0aW5hdGlvbih0b0FkZHJlc3NlcywgZnJvbUFkZHJlc3NlcywgY2hhbmdlQWRkcmVzc2VzKTtcbiAgICBpZihhc3NldElELnRvU3RyaW5nKFwiaGV4XCIpID09PSBmZWVBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpKXtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChhc3NldElELCBhbW91bnQsIGZlZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChhc3NldElELCBhbW91bnQsIHplcm8pO1xuICAgICAgaWYodGhpcy5fZmVlQ2hlY2soZmVlLCBmZWVBc3NldElEKSkge1xuICAgICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgaW5zOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IFtdO1xuICAgIGxldCBvdXRzOkFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD4gPSBbXTtcbiAgICBcbiAgICBjb25zdCBzdWNjZXNzOkVycm9yID0gdGhpcy5nZXRNaW5pbXVtU3BlbmRhYmxlKGFhZCwgYXNPZiwgbG9ja3RpbWUsIHRocmVzaG9sZCk7XG4gICAgaWYodHlwZW9mIHN1Y2Nlc3MgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKTtcbiAgICAgIG91dHMgPSBhYWQuZ2V0QWxsT3V0cHV0cygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBzdWNjZXNzO1xuICAgIH1cblxuICAgIGNvbnN0IGJhc2VUeDpCYXNlVHggPSBuZXcgQmFzZVR4KG5ldHdvcmtpZCwgYmxvY2tjaGFpbmlkLCBvdXRzLCBpbnMsIG1lbW8pO1xuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChiYXNlVHgpO1xuXG4gIH07XG5cbiAgLyoqXG4gICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIEltcG9ydFR4IHRyYW5zYWN0aW9uLlxuICAgICpcbiAgICAqIEBwYXJhbSBuZXR3b3JraWQgVGhlIG51bWJlciByZXByZXNlbnRpbmcgTmV0d29ya0lEIG9mIHRoZSBub2RlXG4gICAgKiBAcGFyYW0gYmxvY2tjaGFpbmlkIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEJsb2NrY2hhaW5JRCBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0byBzZW5kIHRoZSBmdW5kc1xuICAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIE9wdGlvbmFsLiBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zLiBEZWZhdWx0OiB0b0FkZHJlc3Nlc1xuICAgICogQHBhcmFtIGltcG9ydElucyBBbiBhcnJheSBvZiBbW1RyYW5zZmVyYWJsZUlucHV0XV1zIGJlaW5nIGltcG9ydGVkXG4gICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIGNoYWluaWQgd2hlcmUgdGhlIGltcG9ydHMgYXJlIGNvbWluZyBmcm9tLlxuICAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uIEZlZSB3aWxsIGNvbWUgZnJvbSB0aGUgaW5wdXRzIGZpcnN0LCBpZiB0aGV5IGNhbi5cbiAgICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuIFxuICAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAgKlxuICAgICovXG4gICBidWlsZEltcG9ydFR4ID0gKFxuICAgIG5ldHdvcmtpZDpudW1iZXIsIFxuICAgIGJsb2NrY2hhaW5pZDpCdWZmZXIsXG4gICAgdG9BZGRyZXNzZXM6QXJyYXk8QnVmZmVyPixcbiAgICBmcm9tQWRkcmVzc2VzOkFycmF5PEJ1ZmZlcj4sXG4gICAgY2hhbmdlQWRkcmVzc2VzOkFycmF5PEJ1ZmZlcj4sXG4gICAgYXRvbWljczpBcnJheTxVVFhPPixcbiAgICBzb3VyY2VDaGFpbjpCdWZmZXIgPSB1bmRlZmluZWQsIFxuICAgIGZlZTpCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOkJ1ZmZlciA9IHVuZGVmaW5lZCwgXG4gICAgbWVtbzpCdWZmZXIgPSB1bmRlZmluZWQsIFxuICAgIGFzT2Y6Qk4gPSBVbml4Tm93KCksXG4gICAgbG9ja3RpbWU6Qk4gPSBuZXcgQk4oMCksIFxuICAgIHRocmVzaG9sZDpudW1iZXIgPSAxXG4gICk6VW5zaWduZWRUeCA9PiB7XG4gICAgY29uc3QgemVybzpCTiA9IG5ldyBCTigwKTtcbiAgICBsZXQgaW5zOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IFtdO1xuICAgIGxldCBvdXRzOkFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD4gPSBbXTtcbiAgICBpZih0eXBlb2YgZmVlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBmZWUgPSB6ZXJvLmNsb25lKCk7XG4gICAgfVxuXG4gICAgY29uc3QgaW1wb3J0SW5zOkFycmF5PFRyYW5zZmVyYWJsZUlucHV0PiA9IFtdO1xuICAgIGxldCBmZWVwYWlkOkJOID0gbmV3IEJOKDApO1xuICAgIGxldCBmZWVBc3NldFN0cjpzdHJpbmcgPSBmZWVBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpO1xuICAgIGZvcihsZXQgaTpudW1iZXIgPSAwOyBpIDwgYXRvbWljcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgdXR4bzpVVFhPID0gYXRvbWljc1tpXTtcbiAgICAgIGNvbnN0IGFzc2V0SUQ6QnVmZmVyID0gdXR4by5nZXRBc3NldElEKCk7IFxuICAgICAgY29uc3Qgb3V0cHV0OkFtb3VudE91dHB1dCA9IHV0eG8uZ2V0T3V0cHV0KCkgYXMgQW1vdW50T3V0cHV0O1xuICAgICAgbGV0IGFtdDpCTiA9IG91dHB1dC5nZXRBbW91bnQoKS5jbG9uZSgpO1xuICAgICAgXG4gICAgICBsZXQgaW5mZWVhbW91bnQgPSBhbXQuY2xvbmUoKTtcbiAgICAgIGxldCBhc3NldFN0cjpzdHJpbmcgPSBhc3NldElELnRvU3RyaW5nKFwiaGV4XCIpO1xuICAgICAgaWYoXG4gICAgICAgIHR5cGVvZiBmZWVBc3NldElEICE9PSBcInVuZGVmaW5lZFwiICYmIFxuICAgICAgICBmZWUuZ3QoemVybykgJiYgXG4gICAgICAgIGZlZXBhaWQubHQoZmVlKSAmJiBcbiAgICAgICAgYXNzZXRTdHIgPT09IGZlZUFzc2V0U3RyXG4gICAgICApIFxuICAgICAge1xuICAgICAgICBmZWVwYWlkID0gZmVlcGFpZC5hZGQoaW5mZWVhbW91bnQpO1xuICAgICAgICBpZihmZWVwYWlkLmd0ZShmZWUpKSB7XG4gICAgICAgICAgaW5mZWVhbW91bnQgPSBmZWVwYWlkLnN1YihmZWUpO1xuICAgICAgICAgIGZlZXBhaWQgPSBmZWUuY2xvbmUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbmZlZWFtb3VudCA9ICB6ZXJvLmNsb25lKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdHhpZDpCdWZmZXIgPSB1dHhvLmdldFR4SUQoKTtcbiAgICAgIGNvbnN0IG91dHB1dGlkeDpCdWZmZXIgPSB1dHhvLmdldE91dHB1dElkeCgpO1xuICAgICAgY29uc3QgaW5wdXQ6U0VDUFRyYW5zZmVySW5wdXQgPSBuZXcgU0VDUFRyYW5zZmVySW5wdXQoYW10KTtcbiAgICAgIGNvbnN0IHhmZXJpbjpUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dCh0eGlkLCBvdXRwdXRpZHgsIGFzc2V0SUQsIGlucHV0KTtcbiAgICAgIGNvbnN0IGZyb206QXJyYXk8QnVmZmVyPiA9IG91dHB1dC5nZXRBZGRyZXNzZXMoKTsgXG4gICAgICBjb25zdCBzcGVuZGVyczpBcnJheTxCdWZmZXI+ID0gb3V0cHV0LmdldFNwZW5kZXJzKGZyb20sIGFzT2YpO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBzcGVuZGVycy5sZW5ndGg7IGorKykge1xuICAgICAgICBjb25zdCBpZHg6bnVtYmVyID0gb3V0cHV0LmdldEFkZHJlc3NJZHgoc3BlbmRlcnNbal0pO1xuICAgICAgICBpZiAoaWR4ID09PSAtMSkge1xuICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciAtIFVUWE9TZXQuYnVpbGRJbXBvcnRUeDogbm8gc3VjaCAnXG4gICAgICAgICAgKyBgYWRkcmVzcyBpbiBvdXRwdXQ6ICR7c3BlbmRlcnNbal19YCk7XG4gICAgICAgIH1cbiAgICAgICAgeGZlcmluLmdldElucHV0KCkuYWRkU2lnbmF0dXJlSWR4KGlkeCwgc3BlbmRlcnNbal0pO1xuICAgICAgfVxuICAgICAgaW1wb3J0SW5zLnB1c2goeGZlcmluKTtcbiAgICAgIC8vYWRkIGV4dHJhIG91dHB1dHMgZm9yIGVhY2ggYW1vdW50IChjYWxjdWxhdGVkIGZyb20gdGhlIGltcG9ydGVkIGlucHV0cyksIG1pbnVzIGZlZXNcbiAgICAgIGlmKGluZmVlYW1vdW50Lmd0KHplcm8pKSB7XG4gICAgICAgIGNvbnN0IHNwZW5kb3V0OkFtb3VudE91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKG91dHB1dC5nZXRPdXRwdXRJRCgpLFxuICAgICAgICAgIGluZmVlYW1vdW50LCB0b0FkZHJlc3NlcywgbG9ja3RpbWUsIHRocmVzaG9sZCkgYXMgQW1vdW50T3V0cHV0O1xuICAgICAgICBjb25zdCB4ZmVyb3V0OlRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoYXNzZXRJRCwgc3BlbmRvdXQpO1xuICAgICAgICBvdXRzLnB1c2goeGZlcm91dCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGdldCByZW1haW5pbmcgZmVlcyBmcm9tIHRoZSBwcm92aWRlZCBhZGRyZXNzZXNcbiAgICBsZXQgZmVlUmVtYWluaW5nOkJOID0gZmVlLnN1YihmZWVwYWlkKTtcbiAgICBpZihmZWVSZW1haW5pbmcuZ3QoemVybykgJiYgdGhpcy5fZmVlQ2hlY2soZmVlUmVtYWluaW5nLCBmZWVBc3NldElEKSkge1xuICAgICAgY29uc3QgYWFkOkFzc2V0QW1vdW50RGVzdGluYXRpb24gPSBuZXcgQXNzZXRBbW91bnREZXN0aW5hdGlvbih0b0FkZHJlc3NlcywgZnJvbUFkZHJlc3NlcywgY2hhbmdlQWRkcmVzc2VzKTtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWVSZW1haW5pbmcpO1xuICAgICAgY29uc3Qgc3VjY2VzczpFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShhYWQsIGFzT2YsIGxvY2t0aW1lLCB0aHJlc2hvbGQpO1xuICAgICAgaWYodHlwZW9mIHN1Y2Nlc3MgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgaW5zID0gYWFkLmdldElucHV0cygpO1xuICAgICAgICBvdXRzID0gYWFkLmdldEFsbE91dHB1dHMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHN1Y2Nlc3M7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgaW1wb3J0VHg6SW1wb3J0VHggPSBuZXcgSW1wb3J0VHgobmV0d29ya2lkLCBibG9ja2NoYWluaWQsIG91dHMsIGlucywgbWVtbywgc291cmNlQ2hhaW4sIGltcG9ydElucyk7XG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KGltcG9ydFR4KTtcbiAgfTtcblxuICAvKipcbiAgICAqIENyZWF0ZXMgYW4gdW5zaWduZWQgRXhwb3J0VHggdHJhbnNhY3Rpb24uIFxuICAgICpcbiAgICAqIEBwYXJhbSBuZXR3b3JraWQgVGhlIG51bWJlciByZXByZXNlbnRpbmcgTmV0d29ya0lEIG9mIHRoZSBub2RlXG4gICAgKiBAcGFyYW0gYmxvY2tjaGFpbmlkIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEJsb2NrY2hhaW5JRCBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgYmVpbmcgZXhwb3J0ZWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgICogQHBhcmFtIGF2YXhBc3NldElEIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBhc3NldCBJRCBmb3IgQVZBWFxuICAgICogQHBhcmFtIHRvQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gcmVjaWV2ZXMgdGhlIEFWQVhcbiAgICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gb3ducyB0aGUgQVZBWFxuICAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIGdldHMgdGhlIGNoYW5nZSBsZWZ0b3ZlciBvZiB0aGUgQVZBWFxuICAgICogQHBhcmFtIGRlc3RpbmF0aW9uQ2hhaW4gT3B0aW9uYWwuIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBjaGFpbmlkIHdoZXJlIHRvIHNlbmQgdGhlIGFzc2V0LlxuICAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuIFxuICAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgICAqIFxuICAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICAqXG4gICAgKi9cbiAgIGJ1aWxkRXhwb3J0VHggPSAoXG4gICAgbmV0d29ya2lkOm51bWJlciwgXG4gICAgYmxvY2tjaGFpbmlkOkJ1ZmZlcixcbiAgICBhbW91bnQ6Qk4sXG4gICAgYXZheEFzc2V0SUQ6QnVmZmVyLFxuICAgIHRvQWRkcmVzc2VzOkFycmF5PEJ1ZmZlcj4sXG4gICAgZnJvbUFkZHJlc3NlczpBcnJheTxCdWZmZXI+LFxuICAgIGNoYW5nZUFkZHJlc3NlczpBcnJheTxCdWZmZXI+ID0gdW5kZWZpbmVkLFxuICAgIGRlc3RpbmF0aW9uQ2hhaW46QnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGZlZTpCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOkJ1ZmZlciA9IHVuZGVmaW5lZCwgXG4gICAgbWVtbzpCdWZmZXIgPSB1bmRlZmluZWQsIFxuICAgIGFzT2Y6Qk4gPSBVbml4Tm93KCksXG4gICAgbG9ja3RpbWU6Qk4gPSBuZXcgQk4oMCksIFxuICAgIHRocmVzaG9sZDpudW1iZXIgPSAxLFxuICApOlVuc2lnbmVkVHggPT4ge1xuICAgIGxldCBpbnM6QXJyYXk8VHJhbnNmZXJhYmxlSW5wdXQ+ID0gW107XG4gICAgbGV0IG91dHM6QXJyYXk8VHJhbnNmZXJhYmxlT3V0cHV0PiA9IFtdO1xuICAgIGxldCBleHBvcnRvdXRzOkFycmF5PFRyYW5zZmVyYWJsZU91dHB1dD4gPSBbXTtcbiAgICBcbiAgICBpZih0eXBlb2YgY2hhbmdlQWRkcmVzc2VzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBjaGFuZ2VBZGRyZXNzZXMgPSB0b0FkZHJlc3NlcztcbiAgICB9XG5cbiAgICBjb25zdCB6ZXJvOkJOID0gbmV3IEJOKDApO1xuICAgIFxuICAgIGlmIChhbW91bnQuZXEoemVybykpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYodHlwZW9mIGZlZUFzc2V0SUQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGZlZUFzc2V0SUQgPSBhdmF4QXNzZXRJRDtcbiAgICB9IGVsc2UgaWYgKGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikgIT09IGF2YXhBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciAtIFVUWE9TZXQuYnVpbGRFeHBvcnRUeDogJ1xuICAgICAgKyBgZmVlQXNzZXRJRCBtdXN0IG1hdGNoIGF2YXhBc3NldElEYCk7XG4gICAgfVxuXG4gICAgaWYodHlwZW9mIGRlc3RpbmF0aW9uQ2hhaW4gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGRlc3RpbmF0aW9uQ2hhaW4gPSBiaW50b29scy5jYjU4RGVjb2RlKERlZmF1bHRzLm5ldHdvcmtbbmV0d29ya2lkXS5YW1wiYmxvY2tjaGFpbklEXCJdKTtcbiAgICB9XG5cbiAgICBjb25zdCBhYWQ6QXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKHRvQWRkcmVzc2VzLCBmcm9tQWRkcmVzc2VzLCBjaGFuZ2VBZGRyZXNzZXMpO1xuICAgIGlmKGF2YXhBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpID09PSBmZWVBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpKXtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChhdmF4QXNzZXRJRCwgYW1vdW50LCBmZWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoYXZheEFzc2V0SUQsIGFtb3VudCwgemVybyk7XG4gICAgICBpZih0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKXtcbiAgICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGZlZUFzc2V0SUQsIHplcm8sIGZlZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3Qgc3VjY2VzczpFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShhYWQsIGFzT2YsIGxvY2t0aW1lLCB0aHJlc2hvbGQpO1xuICAgIGlmKHR5cGVvZiBzdWNjZXNzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpbnMgPSBhYWQuZ2V0SW5wdXRzKCk7XG4gICAgICBvdXRzID0gYWFkLmdldENoYW5nZU91dHB1dHMoKTtcbiAgICAgIGV4cG9ydG91dHMgPSBhYWQuZ2V0T3V0cHV0cygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBzdWNjZXNzO1xuICAgIH1cblxuICAgIGNvbnN0IGV4cG9ydFR4OkV4cG9ydFR4ID0gbmV3IEV4cG9ydFR4KG5ldHdvcmtpZCwgYmxvY2tjaGFpbmlkLCBvdXRzLCBpbnMsIG1lbW8sIGRlc3RpbmF0aW9uQ2hhaW4sIGV4cG9ydG91dHMpO1xuICAgIFxuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChleHBvcnRUeCk7XG4gIH07XG59XG4iXX0=