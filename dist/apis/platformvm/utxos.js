"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTXOSet = exports.AssetAmountDestination = exports.UTXO = void 0;
/**
 * @packageDocumentation
 * @module API-PlatformVM-UTXOs
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
const exporttx_1 = require("../platformvm/exporttx");
const constants_2 = require("../../utils/constants");
const importtx_1 = require("../platformvm/importtx");
const basetx_1 = require("../platformvm/basetx");
const assetamount_1 = require("../../common/assetamount");
const validationtx_1 = require("./validationtx");
const createsubnettx_1 = require("./createsubnettx");
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
const _1 = require(".");
const addsubnetvalidatortx_1 = require("../platformvm/addsubnetvalidatortx");
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
    create(codecID = constants_1.PlatformVMConstants.LATESTCODEC, txid = undefined, outputidx = undefined, assetID = undefined, output = undefined) {
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
        this.getConsumableUXTO = (asOf = (0, helperfunctions_1.UnixNow)(), stakeable = false) => {
            return this.getAllUTXOs().filter((utxo) => {
                if (stakeable) {
                    // stakeable transactions can consume any UTXO.
                    return true;
                }
                const output = utxo.getOutput();
                if (!(output instanceof outputs_1.StakeableLockOut)) {
                    // non-stakeable transactions can consume any UTXO that isn't locked.
                    return true;
                }
                const stakeableOutput = output;
                if (stakeableOutput.getStakeableLocktime().lt(asOf)) {
                    // If the stakeable outputs locktime has ended, then this UTXO can still
                    // be consumed by a non-stakeable transaction.
                    return true;
                }
                // This output is locked and can't be consumed by a non-stakeable
                // transaction.
                return false;
            });
        };
        this.getMinimumSpendable = (aad, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1, stakeable = false) => {
            let utxoArray = this.getConsumableUXTO(asOf, stakeable);
            let tmpUTXOArray = [];
            if (stakeable) {
                // If this is a stakeable transaction then have StakeableLockOut come before SECPTransferOutput
                // so that users first stake locked tokens before staking unlocked tokens
                utxoArray.forEach((utxo) => {
                    // StakeableLockOuts
                    if (utxo.getOutput().getTypeID() === 22) {
                        tmpUTXOArray.push(utxo);
                    }
                });
                // Sort the StakeableLockOuts by StakeableLocktime so that the greatest StakeableLocktime are spent first
                tmpUTXOArray.sort((a, b) => {
                    let stakeableLockOut1 = a.getOutput();
                    let stakeableLockOut2 = b.getOutput();
                    return (stakeableLockOut2.getStakeableLocktime().toNumber() -
                        stakeableLockOut1.getStakeableLocktime().toNumber());
                });
                utxoArray.forEach((utxo) => {
                    // SECPTransferOutputs
                    if (utxo.getOutput().getTypeID() === 7) {
                        tmpUTXOArray.push(utxo);
                    }
                });
                utxoArray = tmpUTXOArray;
            }
            // outs is a map from assetID to a tuple of (lockedStakeable, unlocked)
            // which are arrays of outputs.
            const outs = {};
            // We only need to iterate over UTXOs until we have spent sufficient funds
            // to met the requested amounts.
            utxoArray.forEach((utxo, index) => {
                const assetID = utxo.getAssetID();
                const assetKey = assetID.toString("hex");
                const fromAddresses = aad.getSenders();
                const output = utxo.getOutput();
                if (!(output instanceof outputs_1.AmountOutput) ||
                    !aad.assetExists(assetKey) ||
                    !output.meetsThreshold(fromAddresses, asOf)) {
                    // We should only try to spend fungible assets.
                    // We should only spend {{ assetKey }}.
                    // We need to be able to spend the output.
                    return;
                }
                const assetAmount = aad.getAssetAmount(assetKey);
                if (assetAmount.isFinished()) {
                    // We've already spent the needed UTXOs for this assetID.
                    return;
                }
                if (!(assetKey in outs)) {
                    // If this is the first time spending this assetID, we need to
                    // initialize the outs object correctly.
                    outs[`${assetKey}`] = {
                        lockedStakeable: [],
                        unlocked: []
                    };
                }
                const amountOutput = output;
                // amount is the amount of funds available from this UTXO.
                const amount = amountOutput.getAmount();
                // Set up the SECP input with the same amount as the output.
                let input = new inputs_1.SECPTransferInput(amount);
                let locked = false;
                if (amountOutput instanceof outputs_1.StakeableLockOut) {
                    const stakeableOutput = amountOutput;
                    const stakeableLocktime = stakeableOutput.getStakeableLocktime();
                    if (stakeableLocktime.gt(asOf)) {
                        // Add a new input and mark it as being locked.
                        input = new inputs_1.StakeableLockIn(amount, stakeableLocktime, new inputs_1.ParseableInput(input));
                        // Mark this UTXO as having been re-locked.
                        locked = true;
                    }
                }
                assetAmount.spendAmount(amount, locked);
                if (locked) {
                    // Track the UTXO as locked.
                    outs[`${assetKey}`].lockedStakeable.push(amountOutput);
                }
                else {
                    // Track the UTXO as unlocked.
                    outs[`${assetKey}`].unlocked.push(amountOutput);
                }
                // Get the indices of the outputs that should be used to authorize the
                // spending of this input.
                // TODO: getSpenders should return an array of indices rather than an
                // array of addresses.
                const spenders = amountOutput.getSpenders(fromAddresses, asOf);
                spenders.forEach((spender) => {
                    const idx = amountOutput.getAddressIdx(spender);
                    if (idx === -1) {
                        // This should never happen, which is why the error is thrown rather
                        // than being returned. If this were to ever happen this would be an
                        // error in the internal logic rather having called this function with
                        // invalid arguments.
                        /* istanbul ignore next */
                        throw new errors_1.AddressError("Error - UTXOSet.getMinimumSpendable: no such " +
                            `address in output: ${spender}`);
                    }
                    input.addSignatureIdx(idx, spender);
                });
                const txID = utxo.getTxID();
                const outputIdx = utxo.getOutputIdx();
                const transferInput = new inputs_1.TransferableInput(txID, outputIdx, assetID, input);
                aad.addInput(transferInput);
            });
            if (!aad.canComplete()) {
                // After running through all the UTXOs, we still weren't able to get all
                // the necessary funds, so this transaction can't be made.
                return new errors_1.InsufficientFundsError("Error - UTXOSet.getMinimumSpendable: insufficient " +
                    "funds to create the transaction");
            }
            // TODO: We should separate the above functionality into a single function
            // that just selects the UTXOs to consume.
            const zero = new bn_js_1.default(0);
            // assetAmounts is an array of asset descriptions and how much is left to
            // spend for them.
            const assetAmounts = aad.getAmounts();
            assetAmounts.forEach((assetAmount) => {
                // change is the amount that should be returned back to the source of the
                // funds.
                const change = assetAmount.getChange();
                // isStakeableLockChange is if the change is locked or not.
                const isStakeableLockChange = assetAmount.getStakeableLockChange();
                // lockedChange is the amount of locked change that should be returned to
                // the sender
                const lockedChange = isStakeableLockChange ? change : zero.clone();
                const assetID = assetAmount.getAssetID();
                const assetKey = assetAmount.getAssetIDString();
                const lockedOutputs = outs[`${assetKey}`].lockedStakeable;
                lockedOutputs.forEach((lockedOutput, i) => {
                    const stakeableLocktime = lockedOutput.getStakeableLocktime();
                    const parseableOutput = lockedOutput.getTransferableOutput();
                    // We know that parseableOutput contains an AmountOutput because the
                    // first loop filters for fungible assets.
                    const output = parseableOutput.getOutput();
                    let outputAmountRemaining = output.getAmount();
                    // The only output that could generate change is the last output.
                    // Otherwise, any further UTXOs wouldn't have needed to be spent.
                    if (i == lockedOutputs.length - 1 && lockedChange.gt(zero)) {
                        // update outputAmountRemaining to no longer hold the change that we
                        // are returning.
                        outputAmountRemaining = outputAmountRemaining.sub(lockedChange);
                        // Create the inner output.
                        const newChangeOutput = (0, outputs_1.SelectOutputClass)(output.getOutputID(), lockedChange, output.getAddresses(), output.getLocktime(), output.getThreshold());
                        // Wrap the inner output in the StakeableLockOut wrapper.
                        let newLockedChangeOutput = (0, outputs_1.SelectOutputClass)(lockedOutput.getOutputID(), lockedChange, output.getAddresses(), output.getLocktime(), output.getThreshold(), stakeableLocktime, new outputs_1.ParseableOutput(newChangeOutput));
                        const transferOutput = new outputs_1.TransferableOutput(assetID, newLockedChangeOutput);
                        aad.addChange(transferOutput);
                    }
                    // We know that outputAmountRemaining > 0. Otherwise, we would never
                    // have consumed this UTXO, as it would be only change.
                    // Create the inner output.
                    const newOutput = (0, outputs_1.SelectOutputClass)(output.getOutputID(), outputAmountRemaining, output.getAddresses(), output.getLocktime(), output.getThreshold());
                    // Wrap the inner output in the StakeableLockOut wrapper.
                    const newLockedOutput = (0, outputs_1.SelectOutputClass)(lockedOutput.getOutputID(), outputAmountRemaining, output.getAddresses(), output.getLocktime(), output.getThreshold(), stakeableLocktime, new outputs_1.ParseableOutput(newOutput));
                    const transferOutput = new outputs_1.TransferableOutput(assetID, newLockedOutput);
                    aad.addOutput(transferOutput);
                });
                // unlockedChange is the amount of unlocked change that should be returned
                // to the sender
                const unlockedChange = isStakeableLockChange ? zero.clone() : change;
                if (unlockedChange.gt(zero)) {
                    const newChangeOutput = new outputs_1.SECPTransferOutput(unlockedChange, aad.getChangeAddresses(), zero.clone(), // make sure that we don't lock the change output.
                    1 // only require one of the changes addresses to spend this output.
                    );
                    const transferOutput = new outputs_1.TransferableOutput(assetID, newChangeOutput);
                    aad.addChange(transferOutput);
                }
                // totalAmountSpent is the total amount of tokens consumed.
                const totalAmountSpent = assetAmount.getSpent();
                // stakeableLockedAmount is the total amount of locked tokens consumed.
                const stakeableLockedAmount = assetAmount.getStakeableLockSpent();
                // totalUnlockedSpent is the total amount of unlocked tokens consumed.
                const totalUnlockedSpent = totalAmountSpent.sub(stakeableLockedAmount);
                // amountBurnt is the amount of unlocked tokens that must be burn.
                const amountBurnt = assetAmount.getBurn();
                // totalUnlockedAvailable is the total amount of unlocked tokens available
                // to be produced.
                const totalUnlockedAvailable = totalUnlockedSpent.sub(amountBurnt);
                // unlockedAmount is the amount of unlocked tokens that should be sent.
                const unlockedAmount = totalUnlockedAvailable.sub(unlockedChange);
                if (unlockedAmount.gt(zero)) {
                    const newOutput = new outputs_1.SECPTransferOutput(unlockedAmount, aad.getDestinations(), locktime, threshold);
                    const transferOutput = new outputs_1.TransferableOutput(assetID, newOutput);
                    aad.addOutput(transferOutput);
                }
            });
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
            const minSpendableErr = this.getMinimumSpendable(aad, asOf, locktime, threshold);
            if (typeof minSpendableErr === "undefined") {
                ins = aad.getInputs();
                outs = aad.getAllOutputs();
            }
            else {
                throw minSpendableErr;
            }
            const baseTx = new basetx_1.BaseTx(networkID, blockchainID, outs, ins, memo);
            return new tx_1.UnsignedTx(baseTx);
        };
        /**
         * Creates an unsigned ImportTx transaction.
         *
         * @param networkID The number representing NetworkID of the node
         * @param blockchainID The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
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
                const minSpendableErr = this.getMinimumSpendable(aad, asOf, locktime, threshold);
                if (typeof minSpendableErr === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw minSpendableErr;
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
        this.buildExportTx = (networkID, blockchainID, amount, axcAssetID, // TODO: rename this to amountAssetID
        toAddresses, fromAddresses, changeAddresses = undefined, destinationChain = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), locktime = new bn_js_1.default(0), threshold = 1) => {
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
                throw new errors_1.FeeAssetError("Error - UTXOSet.buildExportTx: " + `feeAssetID must match axcAssetID`);
            }
            if (typeof destinationChain === "undefined") {
                destinationChain = bintools.cb58Decode(constants_2.Defaults.network[`${networkID}`].X["blockchainID"]);
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
            const minSpendableErr = this.getMinimumSpendable(aad, asOf, locktime, threshold);
            if (typeof minSpendableErr === "undefined") {
                ins = aad.getInputs();
                outs = aad.getChangeOutputs();
                exportouts = aad.getOutputs();
            }
            else {
                throw minSpendableErr;
            }
            const exportTx = new exporttx_1.ExportTx(networkID, blockchainID, outs, ins, memo, destinationChain, exportouts);
            return new tx_1.UnsignedTx(exportTx);
        };
        /**
         * Class representing an unsigned [[AddSubnetValidatorTx]] transaction.
         *
         * @param networkID Networkid, [[DefaultNetworkID]]
         * @param blockchainID Blockchainid, default undefined
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees in AXC
         * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the fee payment
         * @param nodeID The node ID of the validator being added.
         * @param startTime The Unix time when the validator starts validating the Primary Network.
         * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AXC is returned).
         * @param weight The amount of weight for this subnet validator.
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param subnetAuthCredentials Optional. An array of index and address to sign for each SubnetAuth.
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildAddSubnetValidatorTx = (networkID = constants_2.DefaultNetworkID, blockchainID, fromAddresses, changeAddresses, nodeID, startTime, endTime, weight, subnetID, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), subnetAuthCredentials = []) => {
            let ins = [];
            let outs = [];
            const zero = new bn_js_1.default(0);
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new Error("UTXOSet.buildAddSubnetValidatorTx -- startTime must be in the future and endTime must come after startTime");
            }
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
            const addSubnetValidatorTx = new addsubnetvalidatortx_1.AddSubnetValidatorTx(networkID, blockchainID, outs, ins, memo, nodeID, startTime, endTime, weight, subnetID);
            subnetAuthCredentials.forEach((subnetAuthCredential) => {
                addSubnetValidatorTx.addSignatureIdx(subnetAuthCredential[0], subnetAuthCredential[1]);
            });
            return new tx_1.UnsignedTx(addSubnetValidatorTx);
        };
        /**
         * Class representing an unsigned [[AddNominatorTx]] transaction.
         *
         * @param networkID Networkid, [[DefaultNetworkID]]
         * @param blockchainID Blockchainid, default undefined
         * @param axcAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for AXC
         * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} recieves the stake at the end of the staking period
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees and the stake
         * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the staking payment
         * @param nodeID The node ID of the validator being added.
         * @param startTime The Unix time when the validator starts validating the Primary Network.
         * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AXC is returned).
         * @param stakeAmount A {@link https://github.com/indutny/bn.js/|BN} for the amount of stake to be delegated in nAXC.
         * @param rewardLocktime The locktime field created in the resulting reward outputs
         * @param rewardThreshold The number of signatures required to spend the funds in the resultant reward UTXO
         * @param rewardAddresses The addresses the validator reward goes.
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildAddNominatorTx = (networkID = constants_2.DefaultNetworkID, blockchainID, axcAssetID, toAddresses, fromAddresses, changeAddresses, nodeID, startTime, endTime, stakeAmount, rewardLocktime, rewardThreshold, rewardAddresses, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => {
            let ins = [];
            let outs = [];
            let stakeOuts = [];
            const zero = new bn_js_1.default(0);
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new errors_1.TimeError("UTXOSet.buildAddNominatorTx -- startTime must be in the future and endTime must come after startTime");
            }
            const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
            if (axcAssetID.toString("hex") === feeAssetID.toString("hex")) {
                aad.addAssetAmount(axcAssetID, stakeAmount, fee);
            }
            else {
                aad.addAssetAmount(axcAssetID, stakeAmount, zero);
                if (this._feeCheck(fee, feeAssetID)) {
                    aad.addAssetAmount(feeAssetID, zero, fee);
                }
            }
            const minSpendableErr = this.getMinimumSpendable(aad, asOf, undefined, undefined, true);
            if (typeof minSpendableErr === "undefined") {
                ins = aad.getInputs();
                outs = aad.getChangeOutputs();
                stakeOuts = aad.getOutputs();
            }
            else {
                throw minSpendableErr;
            }
            const rewardOutputOwners = new outputs_1.SECPOwnerOutput(rewardAddresses, rewardLocktime, rewardThreshold);
            const UTx = new validationtx_1.AddNominatorTx(networkID, blockchainID, outs, ins, memo, nodeID, startTime, endTime, stakeAmount, stakeOuts, new outputs_1.ParseableOutput(rewardOutputOwners));
            return new tx_1.UnsignedTx(UTx);
        };
        /**
         * Class representing an unsigned [[AddValidatorTx]] transaction.
         *
         * @param networkID NetworkID, [[DefaultNetworkID]]
         * @param blockchainID BlockchainID, default undefined
         * @param axcAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for AXC
         * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} recieves the stake at the end of the staking period
         * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who pays the fees and the stake
         * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover from the staking payment
         * @param nodeID The node ID of the validator being added.
         * @param startTime The Unix time when the validator starts validating the Primary Network.
         * @param endTime The Unix time when the validator stops validating the Primary Network (and staked AXC is returned).
         * @param stakeAmount A {@link https://github.com/indutny/bn.js/|BN} for the amount of stake to be delegated in nAXC.
         * @param rewardLocktime The locktime field created in the resulting reward outputs
         * @param rewardThreshold The number of signatures required to spend the funds in the resultant reward UTXO
         * @param rewardAddresses The addresses the validator reward goes.
         * @param delegationFee A number for the percentage of reward to be given to the validator when someone delegates to them. Must be between 0 and 100.
         * @param minStake A {@link https://github.com/indutny/bn.js/|BN} representing the minimum stake required to validate on this network.
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned.
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildAddValidatorTx = (networkID = constants_2.DefaultNetworkID, blockchainID, axcAssetID, toAddresses, fromAddresses, changeAddresses, nodeID, startTime, endTime, stakeAmount, rewardLocktime, rewardThreshold, rewardAddresses, delegationFee, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => {
            let ins = [];
            let outs = [];
            let stakeOuts = [];
            const zero = new bn_js_1.default(0);
            const now = (0, helperfunctions_1.UnixNow)();
            if (startTime.lt(now) || endTime.lte(startTime)) {
                throw new errors_1.TimeError("UTXOSet.buildAddValidatorTx -- startTime must be in the future and endTime must come after startTime");
            }
            if (delegationFee > 100 || delegationFee < 0) {
                throw new errors_1.TimeError("UTXOSet.buildAddValidatorTx -- startTime must be in the range of 0 to 100, inclusively");
            }
            const aad = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
            if (axcAssetID.toString("hex") === feeAssetID.toString("hex")) {
                aad.addAssetAmount(axcAssetID, stakeAmount, fee);
            }
            else {
                aad.addAssetAmount(axcAssetID, stakeAmount, zero);
                if (this._feeCheck(fee, feeAssetID)) {
                    aad.addAssetAmount(feeAssetID, zero, fee);
                }
            }
            const minSpendableErr = this.getMinimumSpendable(aad, asOf, undefined, undefined, true);
            if (typeof minSpendableErr === "undefined") {
                ins = aad.getInputs();
                outs = aad.getChangeOutputs();
                stakeOuts = aad.getOutputs();
            }
            else {
                throw minSpendableErr;
            }
            const rewardOutputOwners = new outputs_1.SECPOwnerOutput(rewardAddresses, rewardLocktime, rewardThreshold);
            const UTx = new validationtx_1.AddValidatorTx(networkID, blockchainID, outs, ins, memo, nodeID, startTime, endTime, stakeAmount, stakeOuts, new outputs_1.ParseableOutput(rewardOutputOwners), delegationFee);
            return new tx_1.UnsignedTx(UTx);
        };
        /**
         * Class representing an unsigned [[CreateSubnetTx]] transaction.
         *
         * @param networkID Networkid, [[DefaultNetworkID]]
         * @param blockchainID Blockchainid, default undefined
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
         * @param subnetOwnerAddresses An array of {@link https://github.com/feross/buffer|Buffer} for the addresses to add to a subnet
         * @param subnetOwnerThreshold The number of owners's signatures required to add a validator to the network
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         *
         * @returns An unsigned transaction created from the passed in parameters.
         */
        this.buildCreateSubnetTx = (networkID = constants_2.DefaultNetworkID, blockchainID, fromAddresses, changeAddresses, subnetOwnerAddresses, subnetOwnerThreshold, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)()) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const minSpendableErr = this.getMinimumSpendable(aad, asOf, undefined, undefined);
                if (typeof minSpendableErr === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw minSpendableErr;
                }
            }
            const locktime = new bn_js_1.default(0);
            const UTx = new createsubnettx_1.CreateSubnetTx(networkID, blockchainID, outs, ins, memo, new outputs_1.SECPOwnerOutput(subnetOwnerAddresses, locktime, subnetOwnerThreshold));
            return new tx_1.UnsignedTx(UTx);
        };
        /**
         * Build an unsigned [[CreateChainTx]].
         *
         * @param networkID Networkid, [[DefaultNetworkID]]
         * @param blockchainID Blockchainid, default undefined
         * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
         * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs.
         * @param subnetID Optional ID of the Subnet that validates this blockchain
         * @param chainName Optional A human readable name for the chain; need not be unique
         * @param vmID Optional ID of the VM running on the new chain
         * @param fxIDs Optional IDs of the feature extensions running on the new chain
         * @param genesisData Optional Byte representation of genesis state of the new chain
         * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
         * @param feeAssetID Optional. The assetID of the fees being burned
         * @param memo Optional contains arbitrary bytes, up to 256 bytes
         * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
         * @param subnetAuthCredentials Optional. An array of index and address to sign for each SubnetAuth.
         *
         * @returns An unsigned CreateChainTx created from the passed in parameters.
         */
        this.buildCreateChainTx = (networkID = constants_2.DefaultNetworkID, blockchainID, fromAddresses, changeAddresses, subnetID = undefined, chainName = undefined, vmID = undefined, fxIDs = undefined, genesisData = undefined, fee = undefined, feeAssetID = undefined, memo = undefined, asOf = (0, helperfunctions_1.UnixNow)(), subnetAuthCredentials = []) => {
            const zero = new bn_js_1.default(0);
            let ins = [];
            let outs = [];
            if (this._feeCheck(fee, feeAssetID)) {
                const aad = new AssetAmountDestination(fromAddresses, fromAddresses, changeAddresses);
                aad.addAssetAmount(feeAssetID, zero, fee);
                const minSpendableErr = this.getMinimumSpendable(aad, asOf, undefined, undefined);
                if (typeof minSpendableErr === "undefined") {
                    ins = aad.getInputs();
                    outs = aad.getAllOutputs();
                }
                else {
                    throw minSpendableErr;
                }
            }
            const createChainTx = new _1.CreateChainTx(networkID, blockchainID, outs, ins, memo, subnetID, chainName, vmID, fxIDs, genesisData);
            subnetAuthCredentials.forEach((subnetAuthCredential) => {
                createChainTx.addSignatureIdx(subnetAuthCredential[0], subnetAuthCredential[1]);
            });
            return new tx_1.UnsignedTx(createChainTx);
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
        else if (utxo instanceof utxos_1.StandardUTXO) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXR4b3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9wbGF0Zm9ybXZtL3V0eG9zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxvRUFBMkM7QUFDM0Msa0RBQXNCO0FBQ3RCLHVDQVFrQjtBQUNsQixxQ0FNaUI7QUFDakIsaUVBQXFEO0FBQ3JELDhDQUFrRTtBQUNsRSwyQ0FBaUQ7QUFDakQsNkJBQWlDO0FBQ2pDLHFEQUFpRDtBQUNqRCxxREFBa0U7QUFDbEUscURBQWlEO0FBQ2pELGlEQUE2QztBQUM3QywwREFHaUM7QUFFakMsaURBQStEO0FBQy9ELHFEQUFpRDtBQUNqRCw2REFBNkU7QUFDN0UsK0NBTzJCO0FBQzNCLHdCQUFpQztBQUVqQyw2RUFBeUU7QUFFekU7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWhFOztHQUVHO0FBQ0gsTUFBYSxJQUFLLFNBQVEsb0JBQVk7SUFBdEM7O1FBQ1ksY0FBUyxHQUFHLE1BQU0sQ0FBQTtRQUNsQixZQUFPLEdBQUcsU0FBUyxDQUFBO0lBb0UvQixDQUFDO0lBbEVDLHdCQUF3QjtJQUV4QixXQUFXLENBQUMsTUFBYyxFQUFFLFdBQStCLEtBQUs7UUFDOUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDbkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFBLDJCQUFpQixFQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFBO1FBQzVELElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUNyRCxDQUFDO0lBRUQsVUFB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QUssV0FBVztZQUMxQixPQUFPLFVBQVUsS0FBSyxXQUFXO1lBQ2pDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakIsVUFBVSxZQUFZLGVBQU0sQ0FDN0IsQ0FBQTtJQUNILENBQUM7Q0E4bENGO0FBbnJDRCwwQkFtckNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLVBsYXRmb3JtVk0tVVRYT3NcbiAqL1xuaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQgQk4gZnJvbSBcImJuLmpzXCJcbmltcG9ydCB7XG4gIEFtb3VudE91dHB1dCxcbiAgU2VsZWN0T3V0cHV0Q2xhc3MsXG4gIFRyYW5zZmVyYWJsZU91dHB1dCxcbiAgU0VDUE93bmVyT3V0cHV0LFxuICBQYXJzZWFibGVPdXRwdXQsXG4gIFN0YWtlYWJsZUxvY2tPdXQsXG4gIFNFQ1BUcmFuc2Zlck91dHB1dFxufSBmcm9tIFwiLi9vdXRwdXRzXCJcbmltcG9ydCB7XG4gIEFtb3VudElucHV0LFxuICBTRUNQVHJhbnNmZXJJbnB1dCxcbiAgU3Rha2VhYmxlTG9ja0luLFxuICBUcmFuc2ZlcmFibGVJbnB1dCxcbiAgUGFyc2VhYmxlSW5wdXRcbn0gZnJvbSBcIi4vaW5wdXRzXCJcbmltcG9ydCB7IFVuaXhOb3cgfSBmcm9tIFwiLi4vLi4vdXRpbHMvaGVscGVyZnVuY3Rpb25zXCJcbmltcG9ydCB7IFN0YW5kYXJkVVRYTywgU3RhbmRhcmRVVFhPU2V0IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi91dHhvc1wiXG5pbXBvcnQgeyBQbGF0Zm9ybVZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcbmltcG9ydCB7IFVuc2lnbmVkVHggfSBmcm9tIFwiLi90eFwiXG5pbXBvcnQgeyBFeHBvcnRUeCB9IGZyb20gXCIuLi9wbGF0Zm9ybXZtL2V4cG9ydHR4XCJcbmltcG9ydCB7IERlZmF1bHROZXR3b3JrSUQsIERlZmF1bHRzIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2NvbnN0YW50c1wiXG5pbXBvcnQgeyBJbXBvcnRUeCB9IGZyb20gXCIuLi9wbGF0Zm9ybXZtL2ltcG9ydHR4XCJcbmltcG9ydCB7IEJhc2VUeCB9IGZyb20gXCIuLi9wbGF0Zm9ybXZtL2Jhc2V0eFwiXG5pbXBvcnQge1xuICBTdGFuZGFyZEFzc2V0QW1vdW50RGVzdGluYXRpb24sXG4gIEFzc2V0QW1vdW50XG59IGZyb20gXCIuLi8uLi9jb21tb24vYXNzZXRhbW91bnRcIlxuaW1wb3J0IHsgT3V0cHV0IH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9vdXRwdXRcIlxuaW1wb3J0IHsgQWRkTm9taW5hdG9yVHgsIEFkZFZhbGlkYXRvclR4IH0gZnJvbSBcIi4vdmFsaWRhdGlvbnR4XCJcbmltcG9ydCB7IENyZWF0ZVN1Ym5ldFR4IH0gZnJvbSBcIi4vY3JlYXRlc3VibmV0dHhcIlxuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxuaW1wb3J0IHtcbiAgVVRYT0Vycm9yLFxuICBBZGRyZXNzRXJyb3IsXG4gIEluc3VmZmljaWVudEZ1bmRzRXJyb3IsXG4gIFRocmVzaG9sZEVycm9yLFxuICBGZWVBc3NldEVycm9yLFxuICBUaW1lRXJyb3Jcbn0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXG5pbXBvcnQgeyBDcmVhdGVDaGFpblR4IH0gZnJvbSBcIi5cIlxuaW1wb3J0IHsgR2VuZXNpc0RhdGEgfSBmcm9tIFwiLi4vYXh2bVwiXG5pbXBvcnQgeyBBZGRTdWJuZXRWYWxpZGF0b3JUeCB9IGZyb20gXCIuLi9wbGF0Zm9ybXZtL2FkZHN1Ym5ldHZhbGlkYXRvcnR4XCJcblxuLyoqXG4gKiBAaWdub3JlXG4gKi9cbmNvbnN0IGJpbnRvb2xzOiBCaW5Ub29scyA9IEJpblRvb2xzLmdldEluc3RhbmNlKClcbmNvbnN0IHNlcmlhbGl6YXRpb246IFNlcmlhbGl6YXRpb24gPSBTZXJpYWxpemF0aW9uLmdldEluc3RhbmNlKClcblxuLyoqXG4gKiBDbGFzcyBmb3IgcmVwcmVzZW50aW5nIGEgc2luZ2xlIFVUWE8uXG4gKi9cbmV4cG9ydCBjbGFzcyBVVFhPIGV4dGVuZHMgU3RhbmRhcmRVVFhPIHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiVVRYT1wiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gdW5kZWZpbmVkXG5cbiAgLy9zZXJpYWxpemUgaXMgaW5oZXJpdGVkXG5cbiAgZGVzZXJpYWxpemUoZmllbGRzOiBvYmplY3QsIGVuY29kaW5nOiBTZXJpYWxpemVkRW5jb2RpbmcgPSBcImhleFwiKSB7XG4gICAgc3VwZXIuZGVzZXJpYWxpemUoZmllbGRzLCBlbmNvZGluZylcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKGZpZWxkc1tcIm91dHB1dFwiXVtcIl90eXBlSURcIl0pXG4gICAgdGhpcy5vdXRwdXQuZGVzZXJpYWxpemUoZmllbGRzW1wib3V0cHV0XCJdLCBlbmNvZGluZylcbiAgfVxuXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICB0aGlzLmNvZGVjSUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyKVxuICAgIG9mZnNldCArPSAyXG4gICAgdGhpcy50eGlkID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXG4gICAgb2Zmc2V0ICs9IDMyXG4gICAgdGhpcy5vdXRwdXRpZHggPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA0KVxuICAgIG9mZnNldCArPSA0XG4gICAgdGhpcy5hc3NldElEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMzIpXG4gICAgb2Zmc2V0ICs9IDMyXG4gICAgY29uc3Qgb3V0cHV0aWQ6IG51bWJlciA9IGJpbnRvb2xzXG4gICAgICAuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICAgIC5yZWFkVUludDMyQkUoMClcbiAgICBvZmZzZXQgKz0gNFxuICAgIHRoaXMub3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3Mob3V0cHV0aWQpXG4gICAgcmV0dXJuIHRoaXMub3V0cHV0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBhIGJhc2UtNTggc3RyaW5nIGNvbnRhaW5pbmcgYSBbW1VUWE9dXSwgcGFyc2VzIGl0LCBwb3B1bGF0ZXMgdGhlIGNsYXNzLCBhbmQgcmV0dXJucyB0aGUgbGVuZ3RoIG9mIHRoZSBTdGFuZGFyZFVUWE8gaW4gYnl0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSBzZXJpYWxpemVkIEEgYmFzZS01OCBzdHJpbmcgY29udGFpbmluZyBhIHJhdyBbW1VUWE9dXVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGVuZ3RoIG9mIHRoZSByYXcgW1tVVFhPXV1cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogdW5saWtlIG1vc3QgZnJvbVN0cmluZ3MsIGl0IGV4cGVjdHMgdGhlIHN0cmluZyB0byBiZSBzZXJpYWxpemVkIGluIGNiNTggZm9ybWF0XG4gICAqL1xuICBmcm9tU3RyaW5nKHNlcmlhbGl6ZWQ6IHN0cmluZyk6IG51bWJlciB7XG4gICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICByZXR1cm4gdGhpcy5mcm9tQnVmZmVyKGJpbnRvb2xzLmNiNThEZWNvZGUoc2VyaWFsaXplZCkpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGJhc2UtNTggcmVwcmVzZW50YXRpb24gb2YgdGhlIFtbVVRYT11dLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiB1bmxpa2UgbW9zdCB0b1N0cmluZ3MsIHRoaXMgcmV0dXJucyBpbiBjYjU4IHNlcmlhbGl6YXRpb24gZm9ybWF0XG4gICAqL1xuICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgcmV0dXJuIGJpbnRvb2xzLmNiNThFbmNvZGUodGhpcy50b0J1ZmZlcigpKVxuICB9XG5cbiAgY2xvbmUoKTogdGhpcyB7XG4gICAgY29uc3QgdXR4bzogVVRYTyA9IG5ldyBVVFhPKClcbiAgICB1dHhvLmZyb21CdWZmZXIodGhpcy50b0J1ZmZlcigpKVxuICAgIHJldHVybiB1dHhvIGFzIHRoaXNcbiAgfVxuXG4gIGNyZWF0ZShcbiAgICBjb2RlY0lEOiBudW1iZXIgPSBQbGF0Zm9ybVZNQ29uc3RhbnRzLkxBVEVTVENPREVDLFxuICAgIHR4aWQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBvdXRwdXRpZHg6IEJ1ZmZlciB8IG51bWJlciA9IHVuZGVmaW5lZCxcbiAgICBhc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgb3V0cHV0OiBPdXRwdXQgPSB1bmRlZmluZWRcbiAgKTogdGhpcyB7XG4gICAgcmV0dXJuIG5ldyBVVFhPKGNvZGVjSUQsIHR4aWQsIG91dHB1dGlkeCwgYXNzZXRJRCwgb3V0cHV0KSBhcyB0aGlzXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFzc2V0QW1vdW50RGVzdGluYXRpb24gZXh0ZW5kcyBTdGFuZGFyZEFzc2V0QW1vdW50RGVzdGluYXRpb248XG4gIFRyYW5zZmVyYWJsZU91dHB1dCxcbiAgVHJhbnNmZXJhYmxlSW5wdXRcbj4ge31cblxuLyoqXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYSBzZXQgb2YgW1tVVFhPXV1zLlxuICovXG5leHBvcnQgY2xhc3MgVVRYT1NldCBleHRlbmRzIFN0YW5kYXJkVVRYT1NldDxVVFhPPiB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlVUWE9TZXRcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIC8vc2VyaWFsaXplIGlzIGluaGVyaXRlZFxuXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgbGV0IHV0eG9zID0ge31cbiAgICBmb3IgKGxldCB1dHhvaWQgaW4gZmllbGRzW1widXR4b3NcIl0pIHtcbiAgICAgIGxldCB1dHhvaWRDbGVhbmVkOiBzdHJpbmcgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICAgIHV0eG9pZCxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIFwiYmFzZTU4XCIsXG4gICAgICAgIFwiYmFzZTU4XCJcbiAgICAgIClcbiAgICAgIHV0eG9zW2Ake3V0eG9pZENsZWFuZWR9YF0gPSBuZXcgVVRYTygpXG4gICAgICB1dHhvc1tgJHt1dHhvaWRDbGVhbmVkfWBdLmRlc2VyaWFsaXplKFxuICAgICAgICBmaWVsZHNbXCJ1dHhvc1wiXVtgJHt1dHhvaWR9YF0sXG4gICAgICAgIGVuY29kaW5nXG4gICAgICApXG4gICAgfVxuICAgIGxldCBhZGRyZXNzVVRYT3MgPSB7fVxuICAgIGZvciAobGV0IGFkZHJlc3MgaW4gZmllbGRzW1wiYWRkcmVzc1VUWE9zXCJdKSB7XG4gICAgICBsZXQgYWRkcmVzc0NsZWFuZWQ6IHN0cmluZyA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcbiAgICAgICAgYWRkcmVzcyxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIFwiY2I1OFwiLFxuICAgICAgICBcImhleFwiXG4gICAgICApXG4gICAgICBsZXQgdXR4b2JhbGFuY2UgPSB7fVxuICAgICAgZm9yIChsZXQgdXR4b2lkIGluIGZpZWxkc1tcImFkZHJlc3NVVFhPc1wiXVtgJHthZGRyZXNzfWBdKSB7XG4gICAgICAgIGxldCB1dHhvaWRDbGVhbmVkOiBzdHJpbmcgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICAgICAgdXR4b2lkLFxuICAgICAgICAgIGVuY29kaW5nLFxuICAgICAgICAgIFwiYmFzZTU4XCIsXG4gICAgICAgICAgXCJiYXNlNThcIlxuICAgICAgICApXG4gICAgICAgIHV0eG9iYWxhbmNlW2Ake3V0eG9pZENsZWFuZWR9YF0gPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICAgICAgZmllbGRzW1wiYWRkcmVzc1VUWE9zXCJdW2Ake2FkZHJlc3N9YF1bYCR7dXR4b2lkfWBdLFxuICAgICAgICAgIGVuY29kaW5nLFxuICAgICAgICAgIFwiZGVjaW1hbFN0cmluZ1wiLFxuICAgICAgICAgIFwiQk5cIlxuICAgICAgICApXG4gICAgICB9XG4gICAgICBhZGRyZXNzVVRYT3NbYCR7YWRkcmVzc0NsZWFuZWR9YF0gPSB1dHhvYmFsYW5jZVxuICAgIH1cbiAgICB0aGlzLnV0eG9zID0gdXR4b3NcbiAgICB0aGlzLmFkZHJlc3NVVFhPcyA9IGFkZHJlc3NVVFhPc1xuICB9XG5cbiAgcGFyc2VVVFhPKHV0eG86IFVUWE8gfCBzdHJpbmcpOiBVVFhPIHtcbiAgICBjb25zdCB1dHhvdmFyOiBVVFhPID0gbmV3IFVUWE8oKVxuICAgIC8vIGZvcmNlIGEgY29weVxuICAgIGlmICh0eXBlb2YgdXR4byA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdXR4b3Zhci5mcm9tQnVmZmVyKGJpbnRvb2xzLmNiNThEZWNvZGUodXR4bykpXG4gICAgfSBlbHNlIGlmICh1dHhvIGluc3RhbmNlb2YgU3RhbmRhcmRVVFhPKSB7XG4gICAgICB1dHhvdmFyLmZyb21CdWZmZXIodXR4by50b0J1ZmZlcigpKSAvLyBmb3JjZXMgYSBjb3B5XG4gICAgfSBlbHNlIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgVVRYT0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gVVRYTy5wYXJzZVVUWE86IHV0eG8gcGFyYW1ldGVyIGlzIG5vdCBhIFVUWE8gb3Igc3RyaW5nXCJcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIHV0eG92YXJcbiAgfVxuXG4gIGNyZWF0ZSguLi5hcmdzOiBhbnlbXSk6IHRoaXMge1xuICAgIHJldHVybiBuZXcgVVRYT1NldCgpIGFzIHRoaXNcbiAgfVxuXG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGNvbnN0IG5ld3NldDogVVRYT1NldCA9IHRoaXMuY3JlYXRlKClcbiAgICBjb25zdCBhbGxVVFhPczogVVRYT1tdID0gdGhpcy5nZXRBbGxVVFhPcygpXG4gICAgbmV3c2V0LmFkZEFycmF5KGFsbFVUWE9zKVxuICAgIHJldHVybiBuZXdzZXQgYXMgdGhpc1xuICB9XG5cbiAgX2ZlZUNoZWNrKGZlZTogQk4sIGZlZUFzc2V0SUQ6IEJ1ZmZlcik6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICB0eXBlb2YgZmVlICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICB0eXBlb2YgZmVlQXNzZXRJRCAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgZmVlLmd0KG5ldyBCTigwKSkgJiZcbiAgICAgIGZlZUFzc2V0SUQgaW5zdGFuY2VvZiBCdWZmZXJcbiAgICApXG4gIH1cblxuICBnZXRDb25zdW1hYmxlVVhUTyA9IChcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcbiAgICBzdGFrZWFibGU6IGJvb2xlYW4gPSBmYWxzZVxuICApOiBVVFhPW10gPT4ge1xuICAgIHJldHVybiB0aGlzLmdldEFsbFVUWE9zKCkuZmlsdGVyKCh1dHhvOiBVVFhPKSA9PiB7XG4gICAgICBpZiAoc3Rha2VhYmxlKSB7XG4gICAgICAgIC8vIHN0YWtlYWJsZSB0cmFuc2FjdGlvbnMgY2FuIGNvbnN1bWUgYW55IFVUWE8uXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgICBjb25zdCBvdXRwdXQ6IE91dHB1dCA9IHV0eG8uZ2V0T3V0cHV0KClcbiAgICAgIGlmICghKG91dHB1dCBpbnN0YW5jZW9mIFN0YWtlYWJsZUxvY2tPdXQpKSB7XG4gICAgICAgIC8vIG5vbi1zdGFrZWFibGUgdHJhbnNhY3Rpb25zIGNhbiBjb25zdW1lIGFueSBVVFhPIHRoYXQgaXNuJ3QgbG9ja2VkLlxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgICAgY29uc3Qgc3Rha2VhYmxlT3V0cHV0OiBTdGFrZWFibGVMb2NrT3V0ID0gb3V0cHV0IGFzIFN0YWtlYWJsZUxvY2tPdXRcbiAgICAgIGlmIChzdGFrZWFibGVPdXRwdXQuZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS5sdChhc09mKSkge1xuICAgICAgICAvLyBJZiB0aGUgc3Rha2VhYmxlIG91dHB1dHMgbG9ja3RpbWUgaGFzIGVuZGVkLCB0aGVuIHRoaXMgVVRYTyBjYW4gc3RpbGxcbiAgICAgICAgLy8gYmUgY29uc3VtZWQgYnkgYSBub24tc3Rha2VhYmxlIHRyYW5zYWN0aW9uLlxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgICAgLy8gVGhpcyBvdXRwdXQgaXMgbG9ja2VkIGFuZCBjYW4ndCBiZSBjb25zdW1lZCBieSBhIG5vbi1zdGFrZWFibGVcbiAgICAgIC8vIHRyYW5zYWN0aW9uLlxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSlcbiAgfVxuXG4gIGdldE1pbmltdW1TcGVuZGFibGUgPSAoXG4gICAgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDEsXG4gICAgc3Rha2VhYmxlOiBib29sZWFuID0gZmFsc2VcbiAgKTogRXJyb3IgPT4ge1xuICAgIGxldCB1dHhvQXJyYXk6IFVUWE9bXSA9IHRoaXMuZ2V0Q29uc3VtYWJsZVVYVE8oYXNPZiwgc3Rha2VhYmxlKVxuICAgIGxldCB0bXBVVFhPQXJyYXk6IFVUWE9bXSA9IFtdXG4gICAgaWYgKHN0YWtlYWJsZSkge1xuICAgICAgLy8gSWYgdGhpcyBpcyBhIHN0YWtlYWJsZSB0cmFuc2FjdGlvbiB0aGVuIGhhdmUgU3Rha2VhYmxlTG9ja091dCBjb21lIGJlZm9yZSBTRUNQVHJhbnNmZXJPdXRwdXRcbiAgICAgIC8vIHNvIHRoYXQgdXNlcnMgZmlyc3Qgc3Rha2UgbG9ja2VkIHRva2VucyBiZWZvcmUgc3Rha2luZyB1bmxvY2tlZCB0b2tlbnNcbiAgICAgIHV0eG9BcnJheS5mb3JFYWNoKCh1dHhvOiBVVFhPKSA9PiB7XG4gICAgICAgIC8vIFN0YWtlYWJsZUxvY2tPdXRzXG4gICAgICAgIGlmICh1dHhvLmdldE91dHB1dCgpLmdldFR5cGVJRCgpID09PSAyMikge1xuICAgICAgICAgIHRtcFVUWE9BcnJheS5wdXNoKHV0eG8pXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIC8vIFNvcnQgdGhlIFN0YWtlYWJsZUxvY2tPdXRzIGJ5IFN0YWtlYWJsZUxvY2t0aW1lIHNvIHRoYXQgdGhlIGdyZWF0ZXN0IFN0YWtlYWJsZUxvY2t0aW1lIGFyZSBzcGVudCBmaXJzdFxuICAgICAgdG1wVVRYT0FycmF5LnNvcnQoKGE6IFVUWE8sIGI6IFVUWE8pID0+IHtcbiAgICAgICAgbGV0IHN0YWtlYWJsZUxvY2tPdXQxID0gYS5nZXRPdXRwdXQoKSBhcyBTdGFrZWFibGVMb2NrT3V0XG4gICAgICAgIGxldCBzdGFrZWFibGVMb2NrT3V0MiA9IGIuZ2V0T3V0cHV0KCkgYXMgU3Rha2VhYmxlTG9ja091dFxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIHN0YWtlYWJsZUxvY2tPdXQyLmdldFN0YWtlYWJsZUxvY2t0aW1lKCkudG9OdW1iZXIoKSAtXG4gICAgICAgICAgc3Rha2VhYmxlTG9ja091dDEuZ2V0U3Rha2VhYmxlTG9ja3RpbWUoKS50b051bWJlcigpXG4gICAgICAgIClcbiAgICAgIH0pXG5cbiAgICAgIHV0eG9BcnJheS5mb3JFYWNoKCh1dHhvOiBVVFhPKSA9PiB7XG4gICAgICAgIC8vIFNFQ1BUcmFuc2Zlck91dHB1dHNcbiAgICAgICAgaWYgKHV0eG8uZ2V0T3V0cHV0KCkuZ2V0VHlwZUlEKCkgPT09IDcpIHtcbiAgICAgICAgICB0bXBVVFhPQXJyYXkucHVzaCh1dHhvKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgdXR4b0FycmF5ID0gdG1wVVRYT0FycmF5XG4gICAgfVxuXG4gICAgLy8gb3V0cyBpcyBhIG1hcCBmcm9tIGFzc2V0SUQgdG8gYSB0dXBsZSBvZiAobG9ja2VkU3Rha2VhYmxlLCB1bmxvY2tlZClcbiAgICAvLyB3aGljaCBhcmUgYXJyYXlzIG9mIG91dHB1dHMuXG4gICAgY29uc3Qgb3V0czogb2JqZWN0ID0ge31cblxuICAgIC8vIFdlIG9ubHkgbmVlZCB0byBpdGVyYXRlIG92ZXIgVVRYT3MgdW50aWwgd2UgaGF2ZSBzcGVudCBzdWZmaWNpZW50IGZ1bmRzXG4gICAgLy8gdG8gbWV0IHRoZSByZXF1ZXN0ZWQgYW1vdW50cy5cbiAgICB1dHhvQXJyYXkuZm9yRWFjaCgodXR4bzogVVRYTywgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgY29uc3QgYXNzZXRJRDogQnVmZmVyID0gdXR4by5nZXRBc3NldElEKClcbiAgICAgIGNvbnN0IGFzc2V0S2V5OiBzdHJpbmcgPSBhc3NldElELnRvU3RyaW5nKFwiaGV4XCIpXG4gICAgICBjb25zdCBmcm9tQWRkcmVzc2VzOiBCdWZmZXJbXSA9IGFhZC5nZXRTZW5kZXJzKClcbiAgICAgIGNvbnN0IG91dHB1dDogT3V0cHV0ID0gdXR4by5nZXRPdXRwdXQoKVxuICAgICAgaWYgKFxuICAgICAgICAhKG91dHB1dCBpbnN0YW5jZW9mIEFtb3VudE91dHB1dCkgfHxcbiAgICAgICAgIWFhZC5hc3NldEV4aXN0cyhhc3NldEtleSkgfHxcbiAgICAgICAgIW91dHB1dC5tZWV0c1RocmVzaG9sZChmcm9tQWRkcmVzc2VzLCBhc09mKVxuICAgICAgKSB7XG4gICAgICAgIC8vIFdlIHNob3VsZCBvbmx5IHRyeSB0byBzcGVuZCBmdW5naWJsZSBhc3NldHMuXG4gICAgICAgIC8vIFdlIHNob3VsZCBvbmx5IHNwZW5kIHt7IGFzc2V0S2V5IH19LlxuICAgICAgICAvLyBXZSBuZWVkIHRvIGJlIGFibGUgdG8gc3BlbmQgdGhlIG91dHB1dC5cbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGFzc2V0QW1vdW50OiBBc3NldEFtb3VudCA9IGFhZC5nZXRBc3NldEFtb3VudChhc3NldEtleSlcbiAgICAgIGlmIChhc3NldEFtb3VudC5pc0ZpbmlzaGVkKCkpIHtcbiAgICAgICAgLy8gV2UndmUgYWxyZWFkeSBzcGVudCB0aGUgbmVlZGVkIFVUWE9zIGZvciB0aGlzIGFzc2V0SUQuXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBpZiAoIShhc3NldEtleSBpbiBvdXRzKSkge1xuICAgICAgICAvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHNwZW5kaW5nIHRoaXMgYXNzZXRJRCwgd2UgbmVlZCB0b1xuICAgICAgICAvLyBpbml0aWFsaXplIHRoZSBvdXRzIG9iamVjdCBjb3JyZWN0bHkuXG4gICAgICAgIG91dHNbYCR7YXNzZXRLZXl9YF0gPSB7XG4gICAgICAgICAgbG9ja2VkU3Rha2VhYmxlOiBbXSxcbiAgICAgICAgICB1bmxvY2tlZDogW11cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBhbW91bnRPdXRwdXQ6IEFtb3VudE91dHB1dCA9IG91dHB1dCBhcyBBbW91bnRPdXRwdXRcbiAgICAgIC8vIGFtb3VudCBpcyB0aGUgYW1vdW50IG9mIGZ1bmRzIGF2YWlsYWJsZSBmcm9tIHRoaXMgVVRYTy5cbiAgICAgIGNvbnN0IGFtb3VudCA9IGFtb3VudE91dHB1dC5nZXRBbW91bnQoKVxuXG4gICAgICAvLyBTZXQgdXAgdGhlIFNFQ1AgaW5wdXQgd2l0aCB0aGUgc2FtZSBhbW91bnQgYXMgdGhlIG91dHB1dC5cbiAgICAgIGxldCBpbnB1dDogQW1vdW50SW5wdXQgPSBuZXcgU0VDUFRyYW5zZmVySW5wdXQoYW1vdW50KVxuXG4gICAgICBsZXQgbG9ja2VkOiBib29sZWFuID0gZmFsc2VcbiAgICAgIGlmIChhbW91bnRPdXRwdXQgaW5zdGFuY2VvZiBTdGFrZWFibGVMb2NrT3V0KSB7XG4gICAgICAgIGNvbnN0IHN0YWtlYWJsZU91dHB1dDogU3Rha2VhYmxlTG9ja091dCA9XG4gICAgICAgICAgYW1vdW50T3V0cHV0IGFzIFN0YWtlYWJsZUxvY2tPdXRcbiAgICAgICAgY29uc3Qgc3Rha2VhYmxlTG9ja3RpbWU6IEJOID0gc3Rha2VhYmxlT3V0cHV0LmdldFN0YWtlYWJsZUxvY2t0aW1lKClcblxuICAgICAgICBpZiAoc3Rha2VhYmxlTG9ja3RpbWUuZ3QoYXNPZikpIHtcbiAgICAgICAgICAvLyBBZGQgYSBuZXcgaW5wdXQgYW5kIG1hcmsgaXQgYXMgYmVpbmcgbG9ja2VkLlxuICAgICAgICAgIGlucHV0ID0gbmV3IFN0YWtlYWJsZUxvY2tJbihcbiAgICAgICAgICAgIGFtb3VudCxcbiAgICAgICAgICAgIHN0YWtlYWJsZUxvY2t0aW1lLFxuICAgICAgICAgICAgbmV3IFBhcnNlYWJsZUlucHV0KGlucHV0KVxuICAgICAgICAgIClcblxuICAgICAgICAgIC8vIE1hcmsgdGhpcyBVVFhPIGFzIGhhdmluZyBiZWVuIHJlLWxvY2tlZC5cbiAgICAgICAgICBsb2NrZWQgPSB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYXNzZXRBbW91bnQuc3BlbmRBbW91bnQoYW1vdW50LCBsb2NrZWQpXG4gICAgICBpZiAobG9ja2VkKSB7XG4gICAgICAgIC8vIFRyYWNrIHRoZSBVVFhPIGFzIGxvY2tlZC5cbiAgICAgICAgb3V0c1tgJHthc3NldEtleX1gXS5sb2NrZWRTdGFrZWFibGUucHVzaChhbW91bnRPdXRwdXQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUcmFjayB0aGUgVVRYTyBhcyB1bmxvY2tlZC5cbiAgICAgICAgb3V0c1tgJHthc3NldEtleX1gXS51bmxvY2tlZC5wdXNoKGFtb3VudE91dHB1dClcbiAgICAgIH1cblxuICAgICAgLy8gR2V0IHRoZSBpbmRpY2VzIG9mIHRoZSBvdXRwdXRzIHRoYXQgc2hvdWxkIGJlIHVzZWQgdG8gYXV0aG9yaXplIHRoZVxuICAgICAgLy8gc3BlbmRpbmcgb2YgdGhpcyBpbnB1dC5cblxuICAgICAgLy8gVE9ETzogZ2V0U3BlbmRlcnMgc2hvdWxkIHJldHVybiBhbiBhcnJheSBvZiBpbmRpY2VzIHJhdGhlciB0aGFuIGFuXG4gICAgICAvLyBhcnJheSBvZiBhZGRyZXNzZXMuXG4gICAgICBjb25zdCBzcGVuZGVyczogQnVmZmVyW10gPSBhbW91bnRPdXRwdXQuZ2V0U3BlbmRlcnMoZnJvbUFkZHJlc3NlcywgYXNPZilcbiAgICAgIHNwZW5kZXJzLmZvckVhY2goKHNwZW5kZXI6IEJ1ZmZlcikgPT4ge1xuICAgICAgICBjb25zdCBpZHg6IG51bWJlciA9IGFtb3VudE91dHB1dC5nZXRBZGRyZXNzSWR4KHNwZW5kZXIpXG4gICAgICAgIGlmIChpZHggPT09IC0xKSB7XG4gICAgICAgICAgLy8gVGhpcyBzaG91bGQgbmV2ZXIgaGFwcGVuLCB3aGljaCBpcyB3aHkgdGhlIGVycm9yIGlzIHRocm93biByYXRoZXJcbiAgICAgICAgICAvLyB0aGFuIGJlaW5nIHJldHVybmVkLiBJZiB0aGlzIHdlcmUgdG8gZXZlciBoYXBwZW4gdGhpcyB3b3VsZCBiZSBhblxuICAgICAgICAgIC8vIGVycm9yIGluIHRoZSBpbnRlcm5hbCBsb2dpYyByYXRoZXIgaGF2aW5nIGNhbGxlZCB0aGlzIGZ1bmN0aW9uIHdpdGhcbiAgICAgICAgICAvLyBpbnZhbGlkIGFyZ3VtZW50cy5cblxuICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICAgICAgdGhyb3cgbmV3IEFkZHJlc3NFcnJvcihcbiAgICAgICAgICAgIFwiRXJyb3IgLSBVVFhPU2V0LmdldE1pbmltdW1TcGVuZGFibGU6IG5vIHN1Y2ggXCIgK1xuICAgICAgICAgICAgICBgYWRkcmVzcyBpbiBvdXRwdXQ6ICR7c3BlbmRlcn1gXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICAgIGlucHV0LmFkZFNpZ25hdHVyZUlkeChpZHgsIHNwZW5kZXIpXG4gICAgICB9KVxuXG4gICAgICBjb25zdCB0eElEOiBCdWZmZXIgPSB1dHhvLmdldFR4SUQoKVxuICAgICAgY29uc3Qgb3V0cHV0SWR4OiBCdWZmZXIgPSB1dHhvLmdldE91dHB1dElkeCgpXG4gICAgICBjb25zdCB0cmFuc2ZlcklucHV0OiBUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dChcbiAgICAgICAgdHhJRCxcbiAgICAgICAgb3V0cHV0SWR4LFxuICAgICAgICBhc3NldElELFxuICAgICAgICBpbnB1dFxuICAgICAgKVxuICAgICAgYWFkLmFkZElucHV0KHRyYW5zZmVySW5wdXQpXG4gICAgfSlcblxuICAgIGlmICghYWFkLmNhbkNvbXBsZXRlKCkpIHtcbiAgICAgIC8vIEFmdGVyIHJ1bm5pbmcgdGhyb3VnaCBhbGwgdGhlIFVUWE9zLCB3ZSBzdGlsbCB3ZXJlbid0IGFibGUgdG8gZ2V0IGFsbFxuICAgICAgLy8gdGhlIG5lY2Vzc2FyeSBmdW5kcywgc28gdGhpcyB0cmFuc2FjdGlvbiBjYW4ndCBiZSBtYWRlLlxuICAgICAgcmV0dXJuIG5ldyBJbnN1ZmZpY2llbnRGdW5kc0Vycm9yKFxuICAgICAgICBcIkVycm9yIC0gVVRYT1NldC5nZXRNaW5pbXVtU3BlbmRhYmxlOiBpbnN1ZmZpY2llbnQgXCIgK1xuICAgICAgICAgIFwiZnVuZHMgdG8gY3JlYXRlIHRoZSB0cmFuc2FjdGlvblwiXG4gICAgICApXG4gICAgfVxuXG4gICAgLy8gVE9ETzogV2Ugc2hvdWxkIHNlcGFyYXRlIHRoZSBhYm92ZSBmdW5jdGlvbmFsaXR5IGludG8gYSBzaW5nbGUgZnVuY3Rpb25cbiAgICAvLyB0aGF0IGp1c3Qgc2VsZWN0cyB0aGUgVVRYT3MgdG8gY29uc3VtZS5cblxuICAgIGNvbnN0IHplcm86IEJOID0gbmV3IEJOKDApXG5cbiAgICAvLyBhc3NldEFtb3VudHMgaXMgYW4gYXJyYXkgb2YgYXNzZXQgZGVzY3JpcHRpb25zIGFuZCBob3cgbXVjaCBpcyBsZWZ0IHRvXG4gICAgLy8gc3BlbmQgZm9yIHRoZW0uXG4gICAgY29uc3QgYXNzZXRBbW91bnRzOiBBc3NldEFtb3VudFtdID0gYWFkLmdldEFtb3VudHMoKVxuICAgIGFzc2V0QW1vdW50cy5mb3JFYWNoKChhc3NldEFtb3VudDogQXNzZXRBbW91bnQpID0+IHtcbiAgICAgIC8vIGNoYW5nZSBpcyB0aGUgYW1vdW50IHRoYXQgc2hvdWxkIGJlIHJldHVybmVkIGJhY2sgdG8gdGhlIHNvdXJjZSBvZiB0aGVcbiAgICAgIC8vIGZ1bmRzLlxuICAgICAgY29uc3QgY2hhbmdlOiBCTiA9IGFzc2V0QW1vdW50LmdldENoYW5nZSgpXG4gICAgICAvLyBpc1N0YWtlYWJsZUxvY2tDaGFuZ2UgaXMgaWYgdGhlIGNoYW5nZSBpcyBsb2NrZWQgb3Igbm90LlxuICAgICAgY29uc3QgaXNTdGFrZWFibGVMb2NrQ2hhbmdlOiBib29sZWFuID1cbiAgICAgICAgYXNzZXRBbW91bnQuZ2V0U3Rha2VhYmxlTG9ja0NoYW5nZSgpXG4gICAgICAvLyBsb2NrZWRDaGFuZ2UgaXMgdGhlIGFtb3VudCBvZiBsb2NrZWQgY2hhbmdlIHRoYXQgc2hvdWxkIGJlIHJldHVybmVkIHRvXG4gICAgICAvLyB0aGUgc2VuZGVyXG4gICAgICBjb25zdCBsb2NrZWRDaGFuZ2U6IEJOID0gaXNTdGFrZWFibGVMb2NrQ2hhbmdlID8gY2hhbmdlIDogemVyby5jbG9uZSgpXG5cbiAgICAgIGNvbnN0IGFzc2V0SUQ6IEJ1ZmZlciA9IGFzc2V0QW1vdW50LmdldEFzc2V0SUQoKVxuICAgICAgY29uc3QgYXNzZXRLZXk6IHN0cmluZyA9IGFzc2V0QW1vdW50LmdldEFzc2V0SURTdHJpbmcoKVxuICAgICAgY29uc3QgbG9ja2VkT3V0cHV0czogU3Rha2VhYmxlTG9ja091dFtdID1cbiAgICAgICAgb3V0c1tgJHthc3NldEtleX1gXS5sb2NrZWRTdGFrZWFibGVcbiAgICAgIGxvY2tlZE91dHB1dHMuZm9yRWFjaCgobG9ja2VkT3V0cHV0OiBTdGFrZWFibGVMb2NrT3V0LCBpOiBudW1iZXIpID0+IHtcbiAgICAgICAgY29uc3Qgc3Rha2VhYmxlTG9ja3RpbWU6IEJOID0gbG9ja2VkT3V0cHV0LmdldFN0YWtlYWJsZUxvY2t0aW1lKClcbiAgICAgICAgY29uc3QgcGFyc2VhYmxlT3V0cHV0OiBQYXJzZWFibGVPdXRwdXQgPVxuICAgICAgICAgIGxvY2tlZE91dHB1dC5nZXRUcmFuc2ZlcmFibGVPdXRwdXQoKVxuXG4gICAgICAgIC8vIFdlIGtub3cgdGhhdCBwYXJzZWFibGVPdXRwdXQgY29udGFpbnMgYW4gQW1vdW50T3V0cHV0IGJlY2F1c2UgdGhlXG4gICAgICAgIC8vIGZpcnN0IGxvb3AgZmlsdGVycyBmb3IgZnVuZ2libGUgYXNzZXRzLlxuICAgICAgICBjb25zdCBvdXRwdXQ6IEFtb3VudE91dHB1dCA9IHBhcnNlYWJsZU91dHB1dC5nZXRPdXRwdXQoKSBhcyBBbW91bnRPdXRwdXRcblxuICAgICAgICBsZXQgb3V0cHV0QW1vdW50UmVtYWluaW5nOiBCTiA9IG91dHB1dC5nZXRBbW91bnQoKVxuICAgICAgICAvLyBUaGUgb25seSBvdXRwdXQgdGhhdCBjb3VsZCBnZW5lcmF0ZSBjaGFuZ2UgaXMgdGhlIGxhc3Qgb3V0cHV0LlxuICAgICAgICAvLyBPdGhlcndpc2UsIGFueSBmdXJ0aGVyIFVUWE9zIHdvdWxkbid0IGhhdmUgbmVlZGVkIHRvIGJlIHNwZW50LlxuICAgICAgICBpZiAoaSA9PSBsb2NrZWRPdXRwdXRzLmxlbmd0aCAtIDEgJiYgbG9ja2VkQ2hhbmdlLmd0KHplcm8pKSB7XG4gICAgICAgICAgLy8gdXBkYXRlIG91dHB1dEFtb3VudFJlbWFpbmluZyB0byBubyBsb25nZXIgaG9sZCB0aGUgY2hhbmdlIHRoYXQgd2VcbiAgICAgICAgICAvLyBhcmUgcmV0dXJuaW5nLlxuICAgICAgICAgIG91dHB1dEFtb3VudFJlbWFpbmluZyA9IG91dHB1dEFtb3VudFJlbWFpbmluZy5zdWIobG9ja2VkQ2hhbmdlKVxuICAgICAgICAgIC8vIENyZWF0ZSB0aGUgaW5uZXIgb3V0cHV0LlxuICAgICAgICAgIGNvbnN0IG5ld0NoYW5nZU91dHB1dDogQW1vdW50T3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3MoXG4gICAgICAgICAgICBvdXRwdXQuZ2V0T3V0cHV0SUQoKSxcbiAgICAgICAgICAgIGxvY2tlZENoYW5nZSxcbiAgICAgICAgICAgIG91dHB1dC5nZXRBZGRyZXNzZXMoKSxcbiAgICAgICAgICAgIG91dHB1dC5nZXRMb2NrdGltZSgpLFxuICAgICAgICAgICAgb3V0cHV0LmdldFRocmVzaG9sZCgpXG4gICAgICAgICAgKSBhcyBBbW91bnRPdXRwdXRcbiAgICAgICAgICAvLyBXcmFwIHRoZSBpbm5lciBvdXRwdXQgaW4gdGhlIFN0YWtlYWJsZUxvY2tPdXQgd3JhcHBlci5cbiAgICAgICAgICBsZXQgbmV3TG9ja2VkQ2hhbmdlT3V0cHV0OiBTdGFrZWFibGVMb2NrT3V0ID0gU2VsZWN0T3V0cHV0Q2xhc3MoXG4gICAgICAgICAgICBsb2NrZWRPdXRwdXQuZ2V0T3V0cHV0SUQoKSxcbiAgICAgICAgICAgIGxvY2tlZENoYW5nZSxcbiAgICAgICAgICAgIG91dHB1dC5nZXRBZGRyZXNzZXMoKSxcbiAgICAgICAgICAgIG91dHB1dC5nZXRMb2NrdGltZSgpLFxuICAgICAgICAgICAgb3V0cHV0LmdldFRocmVzaG9sZCgpLFxuICAgICAgICAgICAgc3Rha2VhYmxlTG9ja3RpbWUsXG4gICAgICAgICAgICBuZXcgUGFyc2VhYmxlT3V0cHV0KG5ld0NoYW5nZU91dHB1dClcbiAgICAgICAgICApIGFzIFN0YWtlYWJsZUxvY2tPdXRcbiAgICAgICAgICBjb25zdCB0cmFuc2Zlck91dHB1dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChcbiAgICAgICAgICAgIGFzc2V0SUQsXG4gICAgICAgICAgICBuZXdMb2NrZWRDaGFuZ2VPdXRwdXRcbiAgICAgICAgICApXG4gICAgICAgICAgYWFkLmFkZENoYW5nZSh0cmFuc2Zlck91dHB1dClcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIGtub3cgdGhhdCBvdXRwdXRBbW91bnRSZW1haW5pbmcgPiAwLiBPdGhlcndpc2UsIHdlIHdvdWxkIG5ldmVyXG4gICAgICAgIC8vIGhhdmUgY29uc3VtZWQgdGhpcyBVVFhPLCBhcyBpdCB3b3VsZCBiZSBvbmx5IGNoYW5nZS5cblxuICAgICAgICAvLyBDcmVhdGUgdGhlIGlubmVyIG91dHB1dC5cbiAgICAgICAgY29uc3QgbmV3T3V0cHV0OiBBbW91bnRPdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhcbiAgICAgICAgICBvdXRwdXQuZ2V0T3V0cHV0SUQoKSxcbiAgICAgICAgICBvdXRwdXRBbW91bnRSZW1haW5pbmcsXG4gICAgICAgICAgb3V0cHV0LmdldEFkZHJlc3NlcygpLFxuICAgICAgICAgIG91dHB1dC5nZXRMb2NrdGltZSgpLFxuICAgICAgICAgIG91dHB1dC5nZXRUaHJlc2hvbGQoKVxuICAgICAgICApIGFzIEFtb3VudE91dHB1dFxuICAgICAgICAvLyBXcmFwIHRoZSBpbm5lciBvdXRwdXQgaW4gdGhlIFN0YWtlYWJsZUxvY2tPdXQgd3JhcHBlci5cbiAgICAgICAgY29uc3QgbmV3TG9ja2VkT3V0cHV0OiBTdGFrZWFibGVMb2NrT3V0ID0gU2VsZWN0T3V0cHV0Q2xhc3MoXG4gICAgICAgICAgbG9ja2VkT3V0cHV0LmdldE91dHB1dElEKCksXG4gICAgICAgICAgb3V0cHV0QW1vdW50UmVtYWluaW5nLFxuICAgICAgICAgIG91dHB1dC5nZXRBZGRyZXNzZXMoKSxcbiAgICAgICAgICBvdXRwdXQuZ2V0TG9ja3RpbWUoKSxcbiAgICAgICAgICBvdXRwdXQuZ2V0VGhyZXNob2xkKCksXG4gICAgICAgICAgc3Rha2VhYmxlTG9ja3RpbWUsXG4gICAgICAgICAgbmV3IFBhcnNlYWJsZU91dHB1dChuZXdPdXRwdXQpXG4gICAgICAgICkgYXMgU3Rha2VhYmxlTG9ja091dFxuICAgICAgICBjb25zdCB0cmFuc2Zlck91dHB1dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChcbiAgICAgICAgICBhc3NldElELFxuICAgICAgICAgIG5ld0xvY2tlZE91dHB1dFxuICAgICAgICApXG4gICAgICAgIGFhZC5hZGRPdXRwdXQodHJhbnNmZXJPdXRwdXQpXG4gICAgICB9KVxuXG4gICAgICAvLyB1bmxvY2tlZENoYW5nZSBpcyB0aGUgYW1vdW50IG9mIHVubG9ja2VkIGNoYW5nZSB0aGF0IHNob3VsZCBiZSByZXR1cm5lZFxuICAgICAgLy8gdG8gdGhlIHNlbmRlclxuICAgICAgY29uc3QgdW5sb2NrZWRDaGFuZ2U6IEJOID0gaXNTdGFrZWFibGVMb2NrQ2hhbmdlID8gemVyby5jbG9uZSgpIDogY2hhbmdlXG4gICAgICBpZiAodW5sb2NrZWRDaGFuZ2UuZ3QoemVybykpIHtcbiAgICAgICAgY29uc3QgbmV3Q2hhbmdlT3V0cHV0OiBBbW91bnRPdXRwdXQgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KFxuICAgICAgICAgIHVubG9ja2VkQ2hhbmdlLFxuICAgICAgICAgIGFhZC5nZXRDaGFuZ2VBZGRyZXNzZXMoKSxcbiAgICAgICAgICB6ZXJvLmNsb25lKCksIC8vIG1ha2Ugc3VyZSB0aGF0IHdlIGRvbid0IGxvY2sgdGhlIGNoYW5nZSBvdXRwdXQuXG4gICAgICAgICAgMSAvLyBvbmx5IHJlcXVpcmUgb25lIG9mIHRoZSBjaGFuZ2VzIGFkZHJlc3NlcyB0byBzcGVuZCB0aGlzIG91dHB1dC5cbiAgICAgICAgKSBhcyBBbW91bnRPdXRwdXRcbiAgICAgICAgY29uc3QgdHJhbnNmZXJPdXRwdXQ6IFRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoXG4gICAgICAgICAgYXNzZXRJRCxcbiAgICAgICAgICBuZXdDaGFuZ2VPdXRwdXRcbiAgICAgICAgKVxuICAgICAgICBhYWQuYWRkQ2hhbmdlKHRyYW5zZmVyT3V0cHV0KVxuICAgICAgfVxuXG4gICAgICAvLyB0b3RhbEFtb3VudFNwZW50IGlzIHRoZSB0b3RhbCBhbW91bnQgb2YgdG9rZW5zIGNvbnN1bWVkLlxuICAgICAgY29uc3QgdG90YWxBbW91bnRTcGVudDogQk4gPSBhc3NldEFtb3VudC5nZXRTcGVudCgpXG4gICAgICAvLyBzdGFrZWFibGVMb2NrZWRBbW91bnQgaXMgdGhlIHRvdGFsIGFtb3VudCBvZiBsb2NrZWQgdG9rZW5zIGNvbnN1bWVkLlxuICAgICAgY29uc3Qgc3Rha2VhYmxlTG9ja2VkQW1vdW50OiBCTiA9IGFzc2V0QW1vdW50LmdldFN0YWtlYWJsZUxvY2tTcGVudCgpXG4gICAgICAvLyB0b3RhbFVubG9ja2VkU3BlbnQgaXMgdGhlIHRvdGFsIGFtb3VudCBvZiB1bmxvY2tlZCB0b2tlbnMgY29uc3VtZWQuXG4gICAgICBjb25zdCB0b3RhbFVubG9ja2VkU3BlbnQ6IEJOID0gdG90YWxBbW91bnRTcGVudC5zdWIoc3Rha2VhYmxlTG9ja2VkQW1vdW50KVxuICAgICAgLy8gYW1vdW50QnVybnQgaXMgdGhlIGFtb3VudCBvZiB1bmxvY2tlZCB0b2tlbnMgdGhhdCBtdXN0IGJlIGJ1cm4uXG4gICAgICBjb25zdCBhbW91bnRCdXJudDogQk4gPSBhc3NldEFtb3VudC5nZXRCdXJuKClcbiAgICAgIC8vIHRvdGFsVW5sb2NrZWRBdmFpbGFibGUgaXMgdGhlIHRvdGFsIGFtb3VudCBvZiB1bmxvY2tlZCB0b2tlbnMgYXZhaWxhYmxlXG4gICAgICAvLyB0byBiZSBwcm9kdWNlZC5cbiAgICAgIGNvbnN0IHRvdGFsVW5sb2NrZWRBdmFpbGFibGU6IEJOID0gdG90YWxVbmxvY2tlZFNwZW50LnN1YihhbW91bnRCdXJudClcbiAgICAgIC8vIHVubG9ja2VkQW1vdW50IGlzIHRoZSBhbW91bnQgb2YgdW5sb2NrZWQgdG9rZW5zIHRoYXQgc2hvdWxkIGJlIHNlbnQuXG4gICAgICBjb25zdCB1bmxvY2tlZEFtb3VudDogQk4gPSB0b3RhbFVubG9ja2VkQXZhaWxhYmxlLnN1Yih1bmxvY2tlZENoYW5nZSlcbiAgICAgIGlmICh1bmxvY2tlZEFtb3VudC5ndCh6ZXJvKSkge1xuICAgICAgICBjb25zdCBuZXdPdXRwdXQ6IEFtb3VudE91dHB1dCA9IG5ldyBTRUNQVHJhbnNmZXJPdXRwdXQoXG4gICAgICAgICAgdW5sb2NrZWRBbW91bnQsXG4gICAgICAgICAgYWFkLmdldERlc3RpbmF0aW9ucygpLFxuICAgICAgICAgIGxvY2t0aW1lLFxuICAgICAgICAgIHRocmVzaG9sZFxuICAgICAgICApIGFzIEFtb3VudE91dHB1dFxuICAgICAgICBjb25zdCB0cmFuc2Zlck91dHB1dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChcbiAgICAgICAgICBhc3NldElELFxuICAgICAgICAgIG5ld091dHB1dFxuICAgICAgICApXG4gICAgICAgIGFhZC5hZGRPdXRwdXQodHJhbnNmZXJPdXRwdXQpXG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gdW5kZWZpbmVkXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBbW1Vuc2lnbmVkVHhdXSB3cmFwcGluZyBhIFtbQmFzZVR4XV0uIEZvciBtb3JlIGdyYW51bGFyIGNvbnRyb2wsIHlvdSBtYXkgY3JlYXRlIHlvdXIgb3duXG4gICAqIFtbVW5zaWduZWRUeF1dIHdyYXBwaW5nIGEgW1tCYXNlVHhdXSBtYW51YWxseSAod2l0aCB0aGVpciBjb3JyZXNwb25kaW5nIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMgYW5kIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zKS5cbiAgICpcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBUaGUgbnVtYmVyIHJlcHJlc2VudGluZyBOZXR3b3JrSUQgb2YgdGhlIG5vZGVcbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBCbG9ja2NoYWluSUQgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgb2YgdGhlIGFzc2V0IHRvIGJlIHNwZW50IGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59LlxuICAgKiBAcGFyYW0gYXNzZXRJRCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiB0aGUgYXNzZXQgSUQgZm9yIHRoZSBVVFhPXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIE9wdGlvbmFsLiBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zLiBEZWZhdWx0OiB0b0FkZHJlc3Nlc1xuICAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLiBEZWZhdWx0OiBhc3NldElEXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsLiBDb250YWlucyBhcmJpdHJhcnkgZGF0YSwgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBvdXRwdXRzXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAqXG4gICAqL1xuICBidWlsZEJhc2VUeCA9IChcbiAgICBuZXR3b3JrSUQ6IG51bWJlcixcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlcixcbiAgICBhbW91bnQ6IEJOLFxuICAgIGFzc2V0SUQ6IEJ1ZmZlcixcbiAgICB0b0FkZHJlc3NlczogQnVmZmVyW10sXG4gICAgZnJvbUFkZHJlc3NlczogQnVmZmVyW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBCdWZmZXJbXSA9IHVuZGVmaW5lZCxcbiAgICBmZWU6IEJOID0gdW5kZWZpbmVkLFxuICAgIGZlZUFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICAgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApLFxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBVbnNpZ25lZFR4ID0+IHtcbiAgICBpZiAodGhyZXNob2xkID4gdG9BZGRyZXNzZXMubGVuZ3RoKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IFRocmVzaG9sZEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gVVRYT1NldC5idWlsZEJhc2VUeDogdGhyZXNob2xkIGlzIGdyZWF0ZXIgdGhhbiBudW1iZXIgb2YgYWRkcmVzc2VzXCJcbiAgICAgIClcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNoYW5nZUFkZHJlc3NlcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgY2hhbmdlQWRkcmVzc2VzID0gdG9BZGRyZXNzZXNcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGZlZUFzc2V0SUQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGZlZUFzc2V0SUQgPSBhc3NldElEXG4gICAgfVxuXG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcblxuICAgIGlmIChhbW91bnQuZXEoemVybykpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG5cbiAgICBjb25zdCBhYWQ6IEFzc2V0QW1vdW50RGVzdGluYXRpb24gPSBuZXcgQXNzZXRBbW91bnREZXN0aW5hdGlvbihcbiAgICAgIHRvQWRkcmVzc2VzLFxuICAgICAgZnJvbUFkZHJlc3NlcyxcbiAgICAgIGNoYW5nZUFkZHJlc3Nlc1xuICAgIClcbiAgICBpZiAoYXNzZXRJRC50b1N0cmluZyhcImhleFwiKSA9PT0gZmVlQXNzZXRJRC50b1N0cmluZyhcImhleFwiKSkge1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGFzc2V0SUQsIGFtb3VudCwgZmVlKVxuICAgIH0gZWxzZSB7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoYXNzZXRJRCwgYW1vdW50LCB6ZXJvKVxuICAgICAgaWYgKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpIHtcbiAgICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGZlZUFzc2V0SUQsIHplcm8sIGZlZSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cbiAgICBsZXQgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxuXG4gICAgY29uc3QgbWluU3BlbmRhYmxlRXJyOiBFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShcbiAgICAgIGFhZCxcbiAgICAgIGFzT2YsXG4gICAgICBsb2NrdGltZSxcbiAgICAgIHRocmVzaG9sZFxuICAgIClcbiAgICBpZiAodHlwZW9mIG1pblNwZW5kYWJsZUVyciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaW5zID0gYWFkLmdldElucHV0cygpXG4gICAgICBvdXRzID0gYWFkLmdldEFsbE91dHB1dHMoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBtaW5TcGVuZGFibGVFcnJcbiAgICB9XG5cbiAgICBjb25zdCBiYXNlVHg6IEJhc2VUeCA9IG5ldyBCYXNlVHgobmV0d29ya0lELCBibG9ja2NoYWluSUQsIG91dHMsIGlucywgbWVtbylcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgoYmFzZVR4KVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gdW5zaWduZWQgSW1wb3J0VHggdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgVGhlIG51bWJlciByZXByZXNlbnRpbmcgTmV0d29ya0lEIG9mIHRoZSBub2RlXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgQmxvY2tjaGFpbklEIGZvciB0aGUgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdG8gc2VuZCB0aGUgZnVuZHNcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgT3B0aW9uYWwuIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3MuIERlZmF1bHQ6IHRvQWRkcmVzc2VzXG4gICAqIEBwYXJhbSBpbXBvcnRJbnMgQW4gYXJyYXkgb2YgW1tUcmFuc2ZlcmFibGVJbnB1dF1dcyBiZWluZyBpbXBvcnRlZFxuICAgKiBAcGFyYW0gc291cmNlQ2hhaW4gQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIGNoYWluaWQgd2hlcmUgdGhlIGltcG9ydHMgYXJlIGNvbWluZyBmcm9tLlxuICAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfS4gRmVlIHdpbGwgY29tZSBmcm9tIHRoZSBpbnB1dHMgZmlyc3QsIGlmIHRoZXkgY2FuLlxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLlxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKi9cbiAgYnVpbGRJbXBvcnRUeCA9IChcbiAgICBuZXR3b3JrSUQ6IG51bWJlcixcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlcixcbiAgICB0b0FkZHJlc3NlczogQnVmZmVyW10sXG4gICAgZnJvbUFkZHJlc3NlczogQnVmZmVyW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBCdWZmZXJbXSxcbiAgICBhdG9taWNzOiBVVFhPW10sXG4gICAgc291cmNlQ2hhaW46IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBmZWU6IEJOID0gdW5kZWZpbmVkLFxuICAgIGZlZUFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICAgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApLFxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBVbnNpZ25lZFR4ID0+IHtcbiAgICBjb25zdCB6ZXJvOiBCTiA9IG5ldyBCTigwKVxuICAgIGxldCBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSBbXVxuICAgIGxldCBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdXG4gICAgaWYgKHR5cGVvZiBmZWUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGZlZSA9IHplcm8uY2xvbmUoKVxuICAgIH1cblxuICAgIGNvbnN0IGltcG9ydEluczogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IFtdXG4gICAgbGV0IGZlZXBhaWQ6IEJOID0gbmV3IEJOKDApXG4gICAgbGV0IGZlZUFzc2V0U3RyOiBzdHJpbmcgPSBmZWVBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IGF0b21pY3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHV0eG86IFVUWE8gPSBhdG9taWNzW2Ake2l9YF1cbiAgICAgIGNvbnN0IGFzc2V0SUQ6IEJ1ZmZlciA9IHV0eG8uZ2V0QXNzZXRJRCgpXG4gICAgICBjb25zdCBvdXRwdXQ6IEFtb3VudE91dHB1dCA9IHV0eG8uZ2V0T3V0cHV0KCkgYXMgQW1vdW50T3V0cHV0XG4gICAgICBsZXQgYW10OiBCTiA9IG91dHB1dC5nZXRBbW91bnQoKS5jbG9uZSgpXG5cbiAgICAgIGxldCBpbmZlZWFtb3VudCA9IGFtdC5jbG9uZSgpXG4gICAgICBsZXQgYXNzZXRTdHI6IHN0cmluZyA9IGFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIilcbiAgICAgIGlmIChcbiAgICAgICAgdHlwZW9mIGZlZUFzc2V0SUQgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgZmVlLmd0KHplcm8pICYmXG4gICAgICAgIGZlZXBhaWQubHQoZmVlKSAmJlxuICAgICAgICBhc3NldFN0ciA9PT0gZmVlQXNzZXRTdHJcbiAgICAgICkge1xuICAgICAgICBmZWVwYWlkID0gZmVlcGFpZC5hZGQoaW5mZWVhbW91bnQpXG4gICAgICAgIGlmIChmZWVwYWlkLmd0ZShmZWUpKSB7XG4gICAgICAgICAgaW5mZWVhbW91bnQgPSBmZWVwYWlkLnN1YihmZWUpXG4gICAgICAgICAgZmVlcGFpZCA9IGZlZS5jbG9uZSgpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW5mZWVhbW91bnQgPSB6ZXJvLmNsb25lKClcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCB0eGlkOiBCdWZmZXIgPSB1dHhvLmdldFR4SUQoKVxuICAgICAgY29uc3Qgb3V0cHV0aWR4OiBCdWZmZXIgPSB1dHhvLmdldE91dHB1dElkeCgpXG4gICAgICBjb25zdCBpbnB1dDogU0VDUFRyYW5zZmVySW5wdXQgPSBuZXcgU0VDUFRyYW5zZmVySW5wdXQoYW10KVxuICAgICAgY29uc3QgeGZlcmluOiBUcmFuc2ZlcmFibGVJbnB1dCA9IG5ldyBUcmFuc2ZlcmFibGVJbnB1dChcbiAgICAgICAgdHhpZCxcbiAgICAgICAgb3V0cHV0aWR4LFxuICAgICAgICBhc3NldElELFxuICAgICAgICBpbnB1dFxuICAgICAgKVxuICAgICAgY29uc3QgZnJvbTogQnVmZmVyW10gPSBvdXRwdXQuZ2V0QWRkcmVzc2VzKClcbiAgICAgIGNvbnN0IHNwZW5kZXJzOiBCdWZmZXJbXSA9IG91dHB1dC5nZXRTcGVuZGVycyhmcm9tLCBhc09mKVxuICAgICAgZm9yIChsZXQgajogbnVtYmVyID0gMDsgaiA8IHNwZW5kZXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGlkeDogbnVtYmVyID0gb3V0cHV0LmdldEFkZHJlc3NJZHgoc3BlbmRlcnNbYCR7an1gXSlcbiAgICAgICAgaWYgKGlkeCA9PT0gLTEpIHtcbiAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXG4gICAgICAgICAgICBcIkVycm9yIC0gVVRYT1NldC5idWlsZEltcG9ydFR4OiBubyBzdWNoIFwiICtcbiAgICAgICAgICAgICAgYGFkZHJlc3MgaW4gb3V0cHV0OiAke3NwZW5kZXJzW2Ake2p9YF19YFxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgICB4ZmVyaW4uZ2V0SW5wdXQoKS5hZGRTaWduYXR1cmVJZHgoaWR4LCBzcGVuZGVyc1tgJHtqfWBdKVxuICAgICAgfVxuICAgICAgaW1wb3J0SW5zLnB1c2goeGZlcmluKVxuICAgICAgLy9hZGQgZXh0cmEgb3V0cHV0cyBmb3IgZWFjaCBhbW91bnQgKGNhbGN1bGF0ZWQgZnJvbSB0aGUgaW1wb3J0ZWQgaW5wdXRzKSwgbWludXMgZmVlc1xuICAgICAgaWYgKGluZmVlYW1vdW50Lmd0KHplcm8pKSB7XG4gICAgICAgIGNvbnN0IHNwZW5kb3V0OiBBbW91bnRPdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhcbiAgICAgICAgICBvdXRwdXQuZ2V0T3V0cHV0SUQoKSxcbiAgICAgICAgICBpbmZlZWFtb3VudCxcbiAgICAgICAgICB0b0FkZHJlc3NlcyxcbiAgICAgICAgICBsb2NrdGltZSxcbiAgICAgICAgICB0aHJlc2hvbGRcbiAgICAgICAgKSBhcyBBbW91bnRPdXRwdXRcbiAgICAgICAgY29uc3QgeGZlcm91dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dChcbiAgICAgICAgICBhc3NldElELFxuICAgICAgICAgIHNwZW5kb3V0XG4gICAgICAgIClcbiAgICAgICAgb3V0cy5wdXNoKHhmZXJvdXQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gZ2V0IHJlbWFpbmluZyBmZWVzIGZyb20gdGhlIHByb3ZpZGVkIGFkZHJlc3Nlc1xuICAgIGxldCBmZWVSZW1haW5pbmc6IEJOID0gZmVlLnN1YihmZWVwYWlkKVxuICAgIGlmIChmZWVSZW1haW5pbmcuZ3QoemVybykgJiYgdGhpcy5fZmVlQ2hlY2soZmVlUmVtYWluaW5nLCBmZWVBc3NldElEKSkge1xuICAgICAgY29uc3QgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24oXG4gICAgICAgIHRvQWRkcmVzc2VzLFxuICAgICAgICBmcm9tQWRkcmVzc2VzLFxuICAgICAgICBjaGFuZ2VBZGRyZXNzZXNcbiAgICAgIClcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWVSZW1haW5pbmcpXG4gICAgICBjb25zdCBtaW5TcGVuZGFibGVFcnI6IEVycm9yID0gdGhpcy5nZXRNaW5pbXVtU3BlbmRhYmxlKFxuICAgICAgICBhYWQsXG4gICAgICAgIGFzT2YsXG4gICAgICAgIGxvY2t0aW1lLFxuICAgICAgICB0aHJlc2hvbGRcbiAgICAgIClcbiAgICAgIGlmICh0eXBlb2YgbWluU3BlbmRhYmxlRXJyID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKVxuICAgICAgICBvdXRzID0gYWFkLmdldEFsbE91dHB1dHMoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbWluU3BlbmRhYmxlRXJyXG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgaW1wb3J0VHg6IEltcG9ydFR4ID0gbmV3IEltcG9ydFR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgb3V0cyxcbiAgICAgIGlucyxcbiAgICAgIG1lbW8sXG4gICAgICBzb3VyY2VDaGFpbixcbiAgICAgIGltcG9ydEluc1xuICAgIClcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgoaW1wb3J0VHgpXG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiB1bnNpZ25lZCBFeHBvcnRUeCB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBUaGUgbnVtYmVyIHJlcHJlc2VudGluZyBOZXR3b3JrSUQgb2YgdGhlIG5vZGVcbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBUaGUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVwcmVzZW50aW5nIHRoZSBCbG9ja2NoYWluSUQgZm9yIHRoZSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gYW1vdW50IFRoZSBhbW91bnQgYmVpbmcgZXhwb3J0ZWQgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gYXhjQXNzZXRJRCB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBvZiB0aGUgYXNzZXQgSUQgZm9yIEFYQ1xuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyByZWNpZXZlcyB0aGUgQVhDXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gb3ducyB0aGUgQVhDXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBnZXRzIHRoZSBjaGFuZ2UgbGVmdG92ZXIgb2YgdGhlIEFYQ1xuICAgKiBAcGFyYW0gZGVzdGluYXRpb25DaGFpbiBPcHRpb25hbC4gQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIGNoYWluaWQgd2hlcmUgdG8gc2VuZCB0aGUgYXNzZXQuXG4gICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBsb2NrdGltZSBPcHRpb25hbC4gVGhlIGxvY2t0aW1lIGZpZWxkIGNyZWF0ZWQgaW4gdGhlIHJlc3VsdGluZyBvdXRwdXRzXG4gICAqIEBwYXJhbSB0aHJlc2hvbGQgT3B0aW9uYWwuIFRoZSBudW1iZXIgb2Ygc2lnbmF0dXJlcyByZXF1aXJlZCB0byBzcGVuZCB0aGUgZnVuZHMgaW4gdGhlIHJlc3VsdGFudCBVVFhPXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAqXG4gICAqL1xuICBidWlsZEV4cG9ydFR4ID0gKFxuICAgIG5ldHdvcmtJRDogbnVtYmVyLFxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyLFxuICAgIGFtb3VudDogQk4sXG4gICAgYXhjQXNzZXRJRDogQnVmZmVyLCAvLyBUT0RPOiByZW5hbWUgdGhpcyB0byBhbW91bnRBc3NldElEXG4gICAgdG9BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGZyb21BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGNoYW5nZUFkZHJlc3NlczogQnVmZmVyW10gPSB1bmRlZmluZWQsXG4gICAgZGVzdGluYXRpb25DaGFpbjogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGZlZTogQk4gPSB1bmRlZmluZWQsXG4gICAgZmVlQXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcbiAgICBsb2NrdGltZTogQk4gPSBuZXcgQk4oMCksXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSAxXG4gICk6IFVuc2lnbmVkVHggPT4ge1xuICAgIGxldCBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSBbXVxuICAgIGxldCBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdXG4gICAgbGV0IGV4cG9ydG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gW11cblxuICAgIGlmICh0eXBlb2YgY2hhbmdlQWRkcmVzc2VzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBjaGFuZ2VBZGRyZXNzZXMgPSB0b0FkZHJlc3Nlc1xuICAgIH1cblxuICAgIGNvbnN0IHplcm86IEJOID0gbmV3IEJOKDApXG5cbiAgICBpZiAoYW1vdW50LmVxKHplcm8pKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBmZWVBc3NldElEID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBmZWVBc3NldElEID0gYXhjQXNzZXRJRFxuICAgIH0gZWxzZSBpZiAoZmVlQXNzZXRJRC50b1N0cmluZyhcImhleFwiKSAhPT0gYXhjQXNzZXRJRC50b1N0cmluZyhcImhleFwiKSkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBGZWVBc3NldEVycm9yKFxuICAgICAgICBcIkVycm9yIC0gVVRYT1NldC5idWlsZEV4cG9ydFR4OiBcIiArIGBmZWVBc3NldElEIG11c3QgbWF0Y2ggYXhjQXNzZXRJRGBcbiAgICAgIClcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGRlc3RpbmF0aW9uQ2hhaW4gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGRlc3RpbmF0aW9uQ2hhaW4gPSBiaW50b29scy5jYjU4RGVjb2RlKFxuICAgICAgICBEZWZhdWx0cy5uZXR3b3JrW2Ake25ldHdvcmtJRH1gXS5YW1wiYmxvY2tjaGFpbklEXCJdXG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24oXG4gICAgICB0b0FkZHJlc3NlcyxcbiAgICAgIGZyb21BZGRyZXNzZXMsXG4gICAgICBjaGFuZ2VBZGRyZXNzZXNcbiAgICApXG4gICAgaWYgKGF4Y0Fzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikgPT09IGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikpIHtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChheGNBc3NldElELCBhbW91bnQsIGZlZSlcbiAgICB9IGVsc2Uge1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGF4Y0Fzc2V0SUQsIGFtb3VudCwgemVybylcbiAgICAgIGlmICh0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKSB7XG4gICAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpXG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbWluU3BlbmRhYmxlRXJyOiBFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShcbiAgICAgIGFhZCxcbiAgICAgIGFzT2YsXG4gICAgICBsb2NrdGltZSxcbiAgICAgIHRocmVzaG9sZFxuICAgIClcbiAgICBpZiAodHlwZW9mIG1pblNwZW5kYWJsZUVyciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaW5zID0gYWFkLmdldElucHV0cygpXG4gICAgICBvdXRzID0gYWFkLmdldENoYW5nZU91dHB1dHMoKVxuICAgICAgZXhwb3J0b3V0cyA9IGFhZC5nZXRPdXRwdXRzKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbWluU3BlbmRhYmxlRXJyXG4gICAgfVxuXG4gICAgY29uc3QgZXhwb3J0VHg6IEV4cG9ydFR4ID0gbmV3IEV4cG9ydFR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgb3V0cyxcbiAgICAgIGlucyxcbiAgICAgIG1lbW8sXG4gICAgICBkZXN0aW5hdGlvbkNoYWluLFxuICAgICAgZXhwb3J0b3V0c1xuICAgIClcblxuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChleHBvcnRUeClcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgW1tBZGRTdWJuZXRWYWxpZGF0b3JUeF1dIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE5ldHdvcmtpZCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBCbG9ja2NoYWluaWQsIGRlZmF1bHQgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gcGF5cyB0aGUgZmVlcyBpbiBBWENcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIGdldHMgdGhlIGNoYW5nZSBsZWZ0b3ZlciBmcm9tIHRoZSBmZWUgcGF5bWVudFxuICAgKiBAcGFyYW0gbm9kZUlEIFRoZSBub2RlIElEIG9mIHRoZSB2YWxpZGF0b3IgYmVpbmcgYWRkZWQuXG4gICAqIEBwYXJhbSBzdGFydFRpbWUgVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RhcnRzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yay5cbiAgICogQHBhcmFtIGVuZFRpbWUgVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RvcHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrIChhbmQgc3Rha2VkIEFYQyBpcyByZXR1cm5lZCkuXG4gICAqIEBwYXJhbSB3ZWlnaHQgVGhlIGFtb3VudCBvZiB3ZWlnaHQgZm9yIHRoaXMgc3VibmV0IHZhbGlkYXRvci5cbiAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZC5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIHN1Ym5ldEF1dGhDcmVkZW50aWFscyBPcHRpb25hbC4gQW4gYXJyYXkgb2YgaW5kZXggYW5kIGFkZHJlc3MgdG8gc2lnbiBmb3IgZWFjaCBTdWJuZXRBdXRoLlxuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKi9cbiAgYnVpbGRBZGRTdWJuZXRWYWxpZGF0b3JUeCA9IChcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIsXG4gICAgZnJvbUFkZHJlc3NlczogQnVmZmVyW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBCdWZmZXJbXSxcbiAgICBub2RlSUQ6IEJ1ZmZlcixcbiAgICBzdGFydFRpbWU6IEJOLFxuICAgIGVuZFRpbWU6IEJOLFxuICAgIHdlaWdodDogQk4sXG4gICAgc3VibmV0SUQ6IHN0cmluZyxcbiAgICBmZWU6IEJOID0gdW5kZWZpbmVkLFxuICAgIGZlZUFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICAgc3VibmV0QXV0aENyZWRlbnRpYWxzOiBbbnVtYmVyLCBCdWZmZXJdW10gPSBbXVxuICApOiBVbnNpZ25lZFR4ID0+IHtcbiAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cbiAgICBsZXQgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxuXG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcbiAgICBjb25zdCBub3c6IEJOID0gVW5peE5vdygpXG4gICAgaWYgKHN0YXJ0VGltZS5sdChub3cpIHx8IGVuZFRpbWUubHRlKHN0YXJ0VGltZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJVVFhPU2V0LmJ1aWxkQWRkU3VibmV0VmFsaWRhdG9yVHggLS0gc3RhcnRUaW1lIG11c3QgYmUgaW4gdGhlIGZ1dHVyZSBhbmQgZW5kVGltZSBtdXN0IGNvbWUgYWZ0ZXIgc3RhcnRUaW1lXCJcbiAgICAgIClcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZmVlQ2hlY2soZmVlLCBmZWVBc3NldElEKSkge1xuICAgICAgY29uc3QgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24oXG4gICAgICAgIGZyb21BZGRyZXNzZXMsXG4gICAgICAgIGZyb21BZGRyZXNzZXMsXG4gICAgICAgIGNoYW5nZUFkZHJlc3Nlc1xuICAgICAgKVxuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGZlZUFzc2V0SUQsIHplcm8sIGZlZSlcbiAgICAgIGNvbnN0IHN1Y2Nlc3M6IEVycm9yID0gdGhpcy5nZXRNaW5pbXVtU3BlbmRhYmxlKGFhZCwgYXNPZilcbiAgICAgIGlmICh0eXBlb2Ygc3VjY2VzcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpbnMgPSBhYWQuZ2V0SW5wdXRzKClcbiAgICAgICAgb3V0cyA9IGFhZC5nZXRBbGxPdXRwdXRzKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHN1Y2Nlc3NcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBhZGRTdWJuZXRWYWxpZGF0b3JUeDogQWRkU3VibmV0VmFsaWRhdG9yVHggPVxuICAgICAgbmV3IEFkZFN1Ym5ldFZhbGlkYXRvclR4KFxuICAgICAgICBuZXR3b3JrSUQsXG4gICAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgICAgb3V0cyxcbiAgICAgICAgaW5zLFxuICAgICAgICBtZW1vLFxuICAgICAgICBub2RlSUQsXG4gICAgICAgIHN0YXJ0VGltZSxcbiAgICAgICAgZW5kVGltZSxcbiAgICAgICAgd2VpZ2h0LFxuICAgICAgICBzdWJuZXRJRFxuICAgICAgKVxuICAgIHN1Ym5ldEF1dGhDcmVkZW50aWFscy5mb3JFYWNoKFxuICAgICAgKHN1Ym5ldEF1dGhDcmVkZW50aWFsOiBbbnVtYmVyLCBCdWZmZXJdKSA9PiB7XG4gICAgICAgIGFkZFN1Ym5ldFZhbGlkYXRvclR4LmFkZFNpZ25hdHVyZUlkeChcbiAgICAgICAgICBzdWJuZXRBdXRoQ3JlZGVudGlhbFswXSxcbiAgICAgICAgICBzdWJuZXRBdXRoQ3JlZGVudGlhbFsxXVxuICAgICAgICApXG4gICAgICB9XG4gICAgKVxuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChhZGRTdWJuZXRWYWxpZGF0b3JUeClcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgW1tBZGROb21pbmF0b3JUeF1dIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE5ldHdvcmtpZCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBCbG9ja2NoYWluaWQsIGRlZmF1bHQgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBheGNBc3NldElEIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBhc3NldCBJRCBmb3IgQVhDXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVjaWV2ZXMgdGhlIHN0YWtlIGF0IHRoZSBlbmQgb2YgdGhlIHN0YWtpbmcgcGVyaW9kXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gcGF5cyB0aGUgZmVlcyBhbmQgdGhlIHN0YWtlXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBnZXRzIHRoZSBjaGFuZ2UgbGVmdG92ZXIgZnJvbSB0aGUgc3Rha2luZyBwYXltZW50XG4gICAqIEBwYXJhbSBub2RlSUQgVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvciBiZWluZyBhZGRlZC5cbiAgICogQHBhcmFtIHN0YXJ0VGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdGFydHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrLlxuICAgKiBAcGFyYW0gZW5kVGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgQVhDIGlzIHJldHVybmVkKS5cbiAgICogQHBhcmFtIHN0YWtlQW1vdW50IEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gZm9yIHRoZSBhbW91bnQgb2Ygc3Rha2UgdG8gYmUgZGVsZWdhdGVkIGluIG5BWEMuXG4gICAqIEBwYXJhbSByZXdhcmRMb2NrdGltZSBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIHJld2FyZCBvdXRwdXRzXG4gICAqIEBwYXJhbSByZXdhcmRUaHJlc2hvbGQgVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IHJld2FyZCBVVFhPXG4gICAqIEBwYXJhbSByZXdhcmRBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGUgdmFsaWRhdG9yIHJld2FyZCBnb2VzLlxuICAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLlxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKi9cbiAgYnVpbGRBZGROb21pbmF0b3JUeCA9IChcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIsXG4gICAgYXhjQXNzZXRJRDogQnVmZmVyLFxuICAgIHRvQWRkcmVzc2VzOiBCdWZmZXJbXSxcbiAgICBmcm9tQWRkcmVzc2VzOiBCdWZmZXJbXSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIG5vZGVJRDogQnVmZmVyLFxuICAgIHN0YXJ0VGltZTogQk4sXG4gICAgZW5kVGltZTogQk4sXG4gICAgc3Rha2VBbW91bnQ6IEJOLFxuICAgIHJld2FyZExvY2t0aW1lOiBCTixcbiAgICByZXdhcmRUaHJlc2hvbGQ6IG51bWJlcixcbiAgICByZXdhcmRBZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGZlZTogQk4gPSB1bmRlZmluZWQsXG4gICAgZmVlQXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKVxuICApOiBVbnNpZ25lZFR4ID0+IHtcbiAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cbiAgICBsZXQgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxuICAgIGxldCBzdGFrZU91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gW11cblxuICAgIGNvbnN0IHplcm86IEJOID0gbmV3IEJOKDApXG4gICAgY29uc3Qgbm93OiBCTiA9IFVuaXhOb3coKVxuICAgIGlmIChzdGFydFRpbWUubHQobm93KSB8fCBlbmRUaW1lLmx0ZShzdGFydFRpbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgVGltZUVycm9yKFxuICAgICAgICBcIlVUWE9TZXQuYnVpbGRBZGROb21pbmF0b3JUeCAtLSBzdGFydFRpbWUgbXVzdCBiZSBpbiB0aGUgZnV0dXJlIGFuZCBlbmRUaW1lIG11c3QgY29tZSBhZnRlciBzdGFydFRpbWVcIlxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IGFhZDogQXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKFxuICAgICAgdG9BZGRyZXNzZXMsXG4gICAgICBmcm9tQWRkcmVzc2VzLFxuICAgICAgY2hhbmdlQWRkcmVzc2VzXG4gICAgKVxuICAgIGlmIChheGNBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpID09PSBmZWVBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpKSB7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoYXhjQXNzZXRJRCwgc3Rha2VBbW91bnQsIGZlZSlcbiAgICB9IGVsc2Uge1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGF4Y0Fzc2V0SUQsIHN0YWtlQW1vdW50LCB6ZXJvKVxuICAgICAgaWYgKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpIHtcbiAgICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGZlZUFzc2V0SUQsIHplcm8sIGZlZSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBtaW5TcGVuZGFibGVFcnI6IEVycm9yID0gdGhpcy5nZXRNaW5pbXVtU3BlbmRhYmxlKFxuICAgICAgYWFkLFxuICAgICAgYXNPZixcbiAgICAgIHVuZGVmaW5lZCxcbiAgICAgIHVuZGVmaW5lZCxcbiAgICAgIHRydWVcbiAgICApXG4gICAgaWYgKHR5cGVvZiBtaW5TcGVuZGFibGVFcnIgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKVxuICAgICAgb3V0cyA9IGFhZC5nZXRDaGFuZ2VPdXRwdXRzKClcbiAgICAgIHN0YWtlT3V0cyA9IGFhZC5nZXRPdXRwdXRzKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbWluU3BlbmRhYmxlRXJyXG4gICAgfVxuXG4gICAgY29uc3QgcmV3YXJkT3V0cHV0T3duZXJzOiBTRUNQT3duZXJPdXRwdXQgPSBuZXcgU0VDUE93bmVyT3V0cHV0KFxuICAgICAgcmV3YXJkQWRkcmVzc2VzLFxuICAgICAgcmV3YXJkTG9ja3RpbWUsXG4gICAgICByZXdhcmRUaHJlc2hvbGRcbiAgICApXG5cbiAgICBjb25zdCBVVHg6IEFkZE5vbWluYXRvclR4ID0gbmV3IEFkZE5vbWluYXRvclR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgb3V0cyxcbiAgICAgIGlucyxcbiAgICAgIG1lbW8sXG4gICAgICBub2RlSUQsXG4gICAgICBzdGFydFRpbWUsXG4gICAgICBlbmRUaW1lLFxuICAgICAgc3Rha2VBbW91bnQsXG4gICAgICBzdGFrZU91dHMsXG4gICAgICBuZXcgUGFyc2VhYmxlT3V0cHV0KHJld2FyZE91dHB1dE93bmVycylcbiAgICApXG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KFVUeClcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgW1tBZGRWYWxpZGF0b3JUeF1dIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE5ldHdvcmtJRCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBCbG9ja2NoYWluSUQsIGRlZmF1bHQgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBheGNBc3NldElEIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IG9mIHRoZSBhc3NldCBJRCBmb3IgQVhDXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gcmVjaWV2ZXMgdGhlIHN0YWtlIGF0IHRoZSBlbmQgb2YgdGhlIHN0YWtpbmcgcGVyaW9kXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gcGF5cyB0aGUgZmVlcyBhbmQgdGhlIHN0YWtlXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBnZXRzIHRoZSBjaGFuZ2UgbGVmdG92ZXIgZnJvbSB0aGUgc3Rha2luZyBwYXltZW50XG4gICAqIEBwYXJhbSBub2RlSUQgVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvciBiZWluZyBhZGRlZC5cbiAgICogQHBhcmFtIHN0YXJ0VGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdGFydHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrLlxuICAgKiBAcGFyYW0gZW5kVGltZSBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdG9wcyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsgKGFuZCBzdGFrZWQgQVhDIGlzIHJldHVybmVkKS5cbiAgICogQHBhcmFtIHN0YWtlQW1vdW50IEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gZm9yIHRoZSBhbW91bnQgb2Ygc3Rha2UgdG8gYmUgZGVsZWdhdGVkIGluIG5BWEMuXG4gICAqIEBwYXJhbSByZXdhcmRMb2NrdGltZSBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIHJld2FyZCBvdXRwdXRzXG4gICAqIEBwYXJhbSByZXdhcmRUaHJlc2hvbGQgVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IHJld2FyZCBVVFhPXG4gICAqIEBwYXJhbSByZXdhcmRBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGUgdmFsaWRhdG9yIHJld2FyZCBnb2VzLlxuICAgKiBAcGFyYW0gZGVsZWdhdGlvbkZlZSBBIG51bWJlciBmb3IgdGhlIHBlcmNlbnRhZ2Ugb2YgcmV3YXJkIHRvIGJlIGdpdmVuIHRvIHRoZSB2YWxpZGF0b3Igd2hlbiBzb21lb25lIGRlbGVnYXRlcyB0byB0aGVtLiBNdXN0IGJlIGJldHdlZW4gMCBhbmQgMTAwLlxuICAgKiBAcGFyYW0gbWluU3Rha2UgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSByZXByZXNlbnRpbmcgdGhlIG1pbmltdW0gc3Rha2UgcmVxdWlyZWQgdG8gdmFsaWRhdGUgb24gdGhpcyBuZXR3b3JrLlxuICAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLlxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKi9cbiAgYnVpbGRBZGRWYWxpZGF0b3JUeCA9IChcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIsXG4gICAgYXhjQXNzZXRJRDogQnVmZmVyLFxuICAgIHRvQWRkcmVzc2VzOiBCdWZmZXJbXSxcbiAgICBmcm9tQWRkcmVzc2VzOiBCdWZmZXJbXSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIG5vZGVJRDogQnVmZmVyLFxuICAgIHN0YXJ0VGltZTogQk4sXG4gICAgZW5kVGltZTogQk4sXG4gICAgc3Rha2VBbW91bnQ6IEJOLFxuICAgIHJld2FyZExvY2t0aW1lOiBCTixcbiAgICByZXdhcmRUaHJlc2hvbGQ6IG51bWJlcixcbiAgICByZXdhcmRBZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGRlbGVnYXRpb25GZWU6IG51bWJlcixcbiAgICBmZWU6IEJOID0gdW5kZWZpbmVkLFxuICAgIGZlZUFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KClcbiAgKTogVW5zaWduZWRUeCA9PiB7XG4gICAgbGV0IGluczogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IFtdXG4gICAgbGV0IG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gW11cbiAgICBsZXQgc3Rha2VPdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdXG5cbiAgICBjb25zdCB6ZXJvOiBCTiA9IG5ldyBCTigwKVxuICAgIGNvbnN0IG5vdzogQk4gPSBVbml4Tm93KClcbiAgICBpZiAoc3RhcnRUaW1lLmx0KG5vdykgfHwgZW5kVGltZS5sdGUoc3RhcnRUaW1lKSkge1xuICAgICAgdGhyb3cgbmV3IFRpbWVFcnJvcihcbiAgICAgICAgXCJVVFhPU2V0LmJ1aWxkQWRkVmFsaWRhdG9yVHggLS0gc3RhcnRUaW1lIG11c3QgYmUgaW4gdGhlIGZ1dHVyZSBhbmQgZW5kVGltZSBtdXN0IGNvbWUgYWZ0ZXIgc3RhcnRUaW1lXCJcbiAgICAgIClcbiAgICB9XG5cbiAgICBpZiAoZGVsZWdhdGlvbkZlZSA+IDEwMCB8fCBkZWxlZ2F0aW9uRmVlIDwgMCkge1xuICAgICAgdGhyb3cgbmV3IFRpbWVFcnJvcihcbiAgICAgICAgXCJVVFhPU2V0LmJ1aWxkQWRkVmFsaWRhdG9yVHggLS0gc3RhcnRUaW1lIG11c3QgYmUgaW4gdGhlIHJhbmdlIG9mIDAgdG8gMTAwLCBpbmNsdXNpdmVseVwiXG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24oXG4gICAgICB0b0FkZHJlc3NlcyxcbiAgICAgIGZyb21BZGRyZXNzZXMsXG4gICAgICBjaGFuZ2VBZGRyZXNzZXNcbiAgICApXG4gICAgaWYgKGF4Y0Fzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikgPT09IGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikpIHtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChheGNBc3NldElELCBzdGFrZUFtb3VudCwgZmVlKVxuICAgIH0gZWxzZSB7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoYXhjQXNzZXRJRCwgc3Rha2VBbW91bnQsIHplcm8pXG4gICAgICBpZiAodGhpcy5fZmVlQ2hlY2soZmVlLCBmZWVBc3NldElEKSkge1xuICAgICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlKVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG1pblNwZW5kYWJsZUVycjogRXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoXG4gICAgICBhYWQsXG4gICAgICBhc09mLFxuICAgICAgdW5kZWZpbmVkLFxuICAgICAgdW5kZWZpbmVkLFxuICAgICAgdHJ1ZVxuICAgIClcbiAgICBpZiAodHlwZW9mIG1pblNwZW5kYWJsZUVyciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaW5zID0gYWFkLmdldElucHV0cygpXG4gICAgICBvdXRzID0gYWFkLmdldENoYW5nZU91dHB1dHMoKVxuICAgICAgc3Rha2VPdXRzID0gYWFkLmdldE91dHB1dHMoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBtaW5TcGVuZGFibGVFcnJcbiAgICB9XG5cbiAgICBjb25zdCByZXdhcmRPdXRwdXRPd25lcnM6IFNFQ1BPd25lck91dHB1dCA9IG5ldyBTRUNQT3duZXJPdXRwdXQoXG4gICAgICByZXdhcmRBZGRyZXNzZXMsXG4gICAgICByZXdhcmRMb2NrdGltZSxcbiAgICAgIHJld2FyZFRocmVzaG9sZFxuICAgIClcblxuICAgIGNvbnN0IFVUeDogQWRkVmFsaWRhdG9yVHggPSBuZXcgQWRkVmFsaWRhdG9yVHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBvdXRzLFxuICAgICAgaW5zLFxuICAgICAgbWVtbyxcbiAgICAgIG5vZGVJRCxcbiAgICAgIHN0YXJ0VGltZSxcbiAgICAgIGVuZFRpbWUsXG4gICAgICBzdGFrZUFtb3VudCxcbiAgICAgIHN0YWtlT3V0cyxcbiAgICAgIG5ldyBQYXJzZWFibGVPdXRwdXQocmV3YXJkT3V0cHV0T3duZXJzKSxcbiAgICAgIGRlbGVnYXRpb25GZWVcbiAgICApXG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KFVUeClcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgW1tDcmVhdGVTdWJuZXRUeF1dIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE5ldHdvcmtpZCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBCbG9ja2NoYWluaWQsIGRlZmF1bHQgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3MuXG4gICAqIEBwYXJhbSBzdWJuZXRPd25lckFkZHJlc3NlcyBBbiBhcnJheSBvZiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIGFkZHJlc3NlcyB0byBhZGQgdG8gYSBzdWJuZXRcbiAgICogQHBhcmFtIHN1Ym5ldE93bmVyVGhyZXNob2xkIFRoZSBudW1iZXIgb2Ygb3duZXJzJ3Mgc2lnbmF0dXJlcyByZXF1aXJlZCB0byBhZGQgYSB2YWxpZGF0b3IgdG8gdGhlIG5ldHdvcmtcbiAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZFxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKi9cbiAgYnVpbGRDcmVhdGVTdWJuZXRUeCA9IChcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIsXG4gICAgZnJvbUFkZHJlc3NlczogQnVmZmVyW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBCdWZmZXJbXSxcbiAgICBzdWJuZXRPd25lckFkZHJlc3NlczogQnVmZmVyW10sXG4gICAgc3VibmV0T3duZXJUaHJlc2hvbGQ6IG51bWJlcixcbiAgICBmZWU6IEJOID0gdW5kZWZpbmVkLFxuICAgIGZlZUFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KClcbiAgKTogVW5zaWduZWRUeCA9PiB7XG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcbiAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cbiAgICBsZXQgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxuXG4gICAgaWYgKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpIHtcbiAgICAgIGNvbnN0IGFhZDogQXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKFxuICAgICAgICBmcm9tQWRkcmVzc2VzLFxuICAgICAgICBmcm9tQWRkcmVzc2VzLFxuICAgICAgICBjaGFuZ2VBZGRyZXNzZXNcbiAgICAgIClcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpXG4gICAgICBjb25zdCBtaW5TcGVuZGFibGVFcnI6IEVycm9yID0gdGhpcy5nZXRNaW5pbXVtU3BlbmRhYmxlKFxuICAgICAgICBhYWQsXG4gICAgICAgIGFzT2YsXG4gICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgdW5kZWZpbmVkXG4gICAgICApXG4gICAgICBpZiAodHlwZW9mIG1pblNwZW5kYWJsZUVyciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpbnMgPSBhYWQuZ2V0SW5wdXRzKClcbiAgICAgICAgb3V0cyA9IGFhZC5nZXRBbGxPdXRwdXRzKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG1pblNwZW5kYWJsZUVyclxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKVxuICAgIGNvbnN0IFVUeDogQ3JlYXRlU3VibmV0VHggPSBuZXcgQ3JlYXRlU3VibmV0VHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBvdXRzLFxuICAgICAgaW5zLFxuICAgICAgbWVtbyxcbiAgICAgIG5ldyBTRUNQT3duZXJPdXRwdXQoXG4gICAgICAgIHN1Ym5ldE93bmVyQWRkcmVzc2VzLFxuICAgICAgICBsb2NrdGltZSxcbiAgICAgICAgc3VibmV0T3duZXJUaHJlc2hvbGRcbiAgICAgIClcbiAgICApXG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KFVUeClcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBhbiB1bnNpZ25lZCBbW0NyZWF0ZUNoYWluVHhdXS5cbiAgICpcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBOZXR3b3JraWQsIFtbRGVmYXVsdE5ldHdvcmtJRF1dXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgQmxvY2tjaGFpbmlkLCBkZWZhdWx0IHVuZGVmaW5lZFxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zLlxuICAgKiBAcGFyYW0gc3VibmV0SUQgT3B0aW9uYWwgSUQgb2YgdGhlIFN1Ym5ldCB0aGF0IHZhbGlkYXRlcyB0aGlzIGJsb2NrY2hhaW5cbiAgICogQHBhcmFtIGNoYWluTmFtZSBPcHRpb25hbCBBIGh1bWFuIHJlYWRhYmxlIG5hbWUgZm9yIHRoZSBjaGFpbjsgbmVlZCBub3QgYmUgdW5pcXVlXG4gICAqIEBwYXJhbSB2bUlEIE9wdGlvbmFsIElEIG9mIHRoZSBWTSBydW5uaW5nIG9uIHRoZSBuZXcgY2hhaW5cbiAgICogQHBhcmFtIGZ4SURzIE9wdGlvbmFsIElEcyBvZiB0aGUgZmVhdHVyZSBleHRlbnNpb25zIHJ1bm5pbmcgb24gdGhlIG5ldyBjaGFpblxuICAgKiBAcGFyYW0gZ2VuZXNpc0RhdGEgT3B0aW9uYWwgQnl0ZSByZXByZXNlbnRhdGlvbiBvZiBnZW5lc2lzIHN0YXRlIG9mIHRoZSBuZXcgY2hhaW5cbiAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZFxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gc3VibmV0QXV0aENyZWRlbnRpYWxzIE9wdGlvbmFsLiBBbiBhcnJheSBvZiBpbmRleCBhbmQgYWRkcmVzcyB0byBzaWduIGZvciBlYWNoIFN1Ym5ldEF1dGguXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIENyZWF0ZUNoYWluVHggY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG4gIGJ1aWxkQ3JlYXRlQ2hhaW5UeCA9IChcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIsXG4gICAgZnJvbUFkZHJlc3NlczogQnVmZmVyW10sXG4gICAgY2hhbmdlQWRkcmVzc2VzOiBCdWZmZXJbXSxcbiAgICBzdWJuZXRJRDogc3RyaW5nIHwgQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGNoYWluTmFtZTogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIHZtSUQ6IHN0cmluZyA9IHVuZGVmaW5lZCxcbiAgICBmeElEczogc3RyaW5nW10gPSB1bmRlZmluZWQsXG4gICAgZ2VuZXNpc0RhdGE6IHN0cmluZyB8IEdlbmVzaXNEYXRhID0gdW5kZWZpbmVkLFxuICAgIGZlZTogQk4gPSB1bmRlZmluZWQsXG4gICAgZmVlQXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcbiAgICBzdWJuZXRBdXRoQ3JlZGVudGlhbHM6IFtudW1iZXIsIEJ1ZmZlcl1bXSA9IFtdXG4gICk6IFVuc2lnbmVkVHggPT4ge1xuICAgIGNvbnN0IHplcm86IEJOID0gbmV3IEJOKDApXG4gICAgbGV0IGluczogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IFtdXG4gICAgbGV0IG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gW11cblxuICAgIGlmICh0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKSB7XG4gICAgICBjb25zdCBhYWQ6IEFzc2V0QW1vdW50RGVzdGluYXRpb24gPSBuZXcgQXNzZXRBbW91bnREZXN0aW5hdGlvbihcbiAgICAgICAgZnJvbUFkZHJlc3NlcyxcbiAgICAgICAgZnJvbUFkZHJlc3NlcyxcbiAgICAgICAgY2hhbmdlQWRkcmVzc2VzXG4gICAgICApXG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlKVxuICAgICAgY29uc3QgbWluU3BlbmRhYmxlRXJyOiBFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShcbiAgICAgICAgYWFkLFxuICAgICAgICBhc09mLFxuICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgIHVuZGVmaW5lZFxuICAgICAgKVxuICAgICAgaWYgKHR5cGVvZiBtaW5TcGVuZGFibGVFcnIgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgaW5zID0gYWFkLmdldElucHV0cygpXG4gICAgICAgIG91dHMgPSBhYWQuZ2V0QWxsT3V0cHV0cygpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBtaW5TcGVuZGFibGVFcnJcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBjcmVhdGVDaGFpblR4OiBDcmVhdGVDaGFpblR4ID0gbmV3IENyZWF0ZUNoYWluVHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBvdXRzLFxuICAgICAgaW5zLFxuICAgICAgbWVtbyxcbiAgICAgIHN1Ym5ldElELFxuICAgICAgY2hhaW5OYW1lLFxuICAgICAgdm1JRCxcbiAgICAgIGZ4SURzLFxuICAgICAgZ2VuZXNpc0RhdGFcbiAgICApXG4gICAgc3VibmV0QXV0aENyZWRlbnRpYWxzLmZvckVhY2goXG4gICAgICAoc3VibmV0QXV0aENyZWRlbnRpYWw6IFtudW1iZXIsIEJ1ZmZlcl0pID0+IHtcbiAgICAgICAgY3JlYXRlQ2hhaW5UeC5hZGRTaWduYXR1cmVJZHgoXG4gICAgICAgICAgc3VibmV0QXV0aENyZWRlbnRpYWxbMF0sXG4gICAgICAgICAgc3VibmV0QXV0aENyZWRlbnRpYWxbMV1cbiAgICAgICAgKVxuICAgICAgfVxuICAgIClcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgoY3JlYXRlQ2hhaW5UeClcbiAgfVxufVxuIl19