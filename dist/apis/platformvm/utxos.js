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
                destinationChain = bintools.cb58Decode(constants_2.Defaults.network[`${networkID}`].Swap["blockchainID"]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXR4b3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBpcy9wbGF0Zm9ybXZtL3V0eG9zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7R0FHRztBQUNILG9DQUFnQztBQUNoQyxvRUFBMkM7QUFDM0Msa0RBQXNCO0FBQ3RCLHVDQVFrQjtBQUNsQixxQ0FNaUI7QUFDakIsaUVBQXFEO0FBQ3JELDhDQUFrRTtBQUNsRSwyQ0FBaUQ7QUFDakQsNkJBQWlDO0FBQ2pDLHFEQUFpRDtBQUNqRCxxREFBa0U7QUFDbEUscURBQWlEO0FBQ2pELGlEQUE2QztBQUM3QywwREFHaUM7QUFFakMsaURBQStEO0FBQy9ELHFEQUFpRDtBQUNqRCw2REFBNkU7QUFDN0UsK0NBTzJCO0FBQzNCLHdCQUFpQztBQUVqQyw2RUFBeUU7QUFFekU7O0dBRUc7QUFDSCxNQUFNLFFBQVEsR0FBYSxrQkFBUSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBQ2pELE1BQU0sYUFBYSxHQUFrQiw2QkFBYSxDQUFDLFdBQVcsRUFBRSxDQUFBO0FBRWhFOztHQUVHO0FBQ0gsTUFBYSxJQUFLLFNBQVEsb0JBQVk7SUFBdEM7O1FBQ1ksY0FBUyxHQUFHLE1BQU0sQ0FBQTtRQUNsQixZQUFPLEdBQUcsU0FBUyxDQUFBO0lBb0UvQixDQUFDO0lBbEVDLHdCQUF3QjtJQUV4QixXQUFXLENBQUMsTUFBYyxFQUFFLFdBQStCLEtBQUs7UUFDOUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFDbkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFBLDJCQUFpQixFQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFBO1FBQzVELElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUNyRCxDQUFDO0lBRUQsVUFBVSxDQUFDLEtBQWEsRUFBRSxTQUFpQixDQUFDO1FBQzFDLElBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUMzRCxNQUFNLElBQUksQ0FBQyxDQUFBO1FBQ1gsSUFBSSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFBO1FBQ3pELE1BQU0sSUFBSSxFQUFFLENBQUE7UUFDWixJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFDN0QsTUFBTSxJQUFJLENBQUMsQ0FBQTtRQUNYLElBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQTtRQUM1RCxNQUFNLElBQUksRUFBRSxDQUFBO1FBQ1osTUFBTSxRQUFRLEdBQVcsUUFBUTthQUM5QixRQUFRLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDO2FBQ25DLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNsQixNQUFNLElBQUksQ0FBQyxDQUFBO1FBQ1gsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFBLDJCQUFpQixFQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ3pDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFBO0lBQzlDLENBQUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSCxVQUFVLENBQUMsVUFBa0I7UUFDM0IsMEJBQTBCO1FBQzFCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUE7SUFDekQsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsUUFBUTtRQUNOLDBCQUEwQjtRQUMxQixPQUFPLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7SUFDN0MsQ0FBQztJQUVELEtBQUs7UUFDSCxNQUFNLElBQUksR0FBUyxJQUFJLElBQUksRUFBRSxDQUFBO1FBQzdCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7UUFDaEMsT0FBTyxJQUFZLENBQUE7SUFDckIsQ0FBQztJQUVELE1BQU0sQ0FDSixVQUFrQiwrQkFBbUIsQ0FBQyxXQUFXLEVBQ2pELE9BQWUsU0FBUyxFQUN4QixZQUE2QixTQUFTLEVBQ3RDLFVBQWtCLFNBQVMsRUFDM0IsU0FBaUIsU0FBUztRQUUxQixPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQVMsQ0FBQTtJQUNwRSxDQUFDO0NBQ0Y7QUF0RUQsb0JBc0VDO0FBRUQsTUFBYSxzQkFBdUIsU0FBUSw0Q0FHM0M7Q0FBRztBQUhKLHdEQUdJO0FBRUo7O0dBRUc7QUFDSCxNQUFhLE9BQVEsU0FBUSx1QkFBcUI7SUFBbEQ7O1FBQ1ksY0FBUyxHQUFHLFNBQVMsQ0FBQTtRQUNyQixZQUFPLEdBQUcsU0FBUyxDQUFBO1FBcUY3QixzQkFBaUIsR0FBRyxDQUNsQixPQUFXLElBQUEseUJBQU8sR0FBRSxFQUNwQixZQUFxQixLQUFLLEVBQ2xCLEVBQUU7WUFDVixPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFVLEVBQUUsRUFBRTtnQkFDOUMsSUFBSSxTQUFTLEVBQUU7b0JBQ2IsK0NBQStDO29CQUMvQyxPQUFPLElBQUksQ0FBQTtpQkFDWjtnQkFDRCxNQUFNLE1BQU0sR0FBVyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUE7Z0JBQ3ZDLElBQUksQ0FBQyxDQUFDLE1BQU0sWUFBWSwwQkFBZ0IsQ0FBQyxFQUFFO29CQUN6QyxxRUFBcUU7b0JBQ3JFLE9BQU8sSUFBSSxDQUFBO2lCQUNaO2dCQUNELE1BQU0sZUFBZSxHQUFxQixNQUEwQixDQUFBO2dCQUNwRSxJQUFJLGVBQWUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDbkQsd0VBQXdFO29CQUN4RSw4Q0FBOEM7b0JBQzlDLE9BQU8sSUFBSSxDQUFBO2lCQUNaO2dCQUNELGlFQUFpRTtnQkFDakUsZUFBZTtnQkFDZixPQUFPLEtBQUssQ0FBQTtZQUNkLENBQUMsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFBO1FBRUQsd0JBQW1CLEdBQUcsQ0FDcEIsR0FBMkIsRUFDM0IsT0FBVyxJQUFBLHlCQUFPLEdBQUUsRUFDcEIsV0FBZSxJQUFJLGVBQUUsQ0FBQyxDQUFDLENBQUMsRUFDeEIsWUFBb0IsQ0FBQyxFQUNyQixZQUFxQixLQUFLLEVBQ25CLEVBQUU7WUFDVCxJQUFJLFNBQVMsR0FBVyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1lBQy9ELElBQUksWUFBWSxHQUFXLEVBQUUsQ0FBQTtZQUM3QixJQUFJLFNBQVMsRUFBRTtnQkFDYiwrRkFBK0Y7Z0JBQy9GLHlFQUF5RTtnQkFDekUsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQVUsRUFBRSxFQUFFO29CQUMvQixvQkFBb0I7b0JBQ3BCLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsRUFBRTt3QkFDdkMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtxQkFDeEI7Z0JBQ0gsQ0FBQyxDQUFDLENBQUE7Z0JBRUYseUdBQXlHO2dCQUN6RyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBTyxFQUFFLENBQU8sRUFBRSxFQUFFO29CQUNyQyxJQUFJLGlCQUFpQixHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQXNCLENBQUE7b0JBQ3pELElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLFNBQVMsRUFBc0IsQ0FBQTtvQkFDekQsT0FBTyxDQUNMLGlCQUFpQixDQUFDLG9CQUFvQixFQUFFLENBQUMsUUFBUSxFQUFFO3dCQUNuRCxpQkFBaUIsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUNwRCxDQUFBO2dCQUNILENBQUMsQ0FBQyxDQUFBO2dCQUVGLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFVLEVBQUUsRUFBRTtvQkFDL0Isc0JBQXNCO29CQUN0QixJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEVBQUU7d0JBQ3RDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7cUJBQ3hCO2dCQUNILENBQUMsQ0FBQyxDQUFBO2dCQUNGLFNBQVMsR0FBRyxZQUFZLENBQUE7YUFDekI7WUFFRCx1RUFBdUU7WUFDdkUsK0JBQStCO1lBQy9CLE1BQU0sSUFBSSxHQUFXLEVBQUUsQ0FBQTtZQUV2QiwwRUFBMEU7WUFDMUUsZ0NBQWdDO1lBQ2hDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFVLEVBQUUsS0FBYSxFQUFFLEVBQUU7Z0JBQzlDLE1BQU0sT0FBTyxHQUFXLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTtnQkFDekMsTUFBTSxRQUFRLEdBQVcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtnQkFDaEQsTUFBTSxhQUFhLEdBQWEsR0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFBO2dCQUNoRCxNQUFNLE1BQU0sR0FBVyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUE7Z0JBQ3ZDLElBQ0UsQ0FBQyxDQUFDLE1BQU0sWUFBWSxzQkFBWSxDQUFDO29CQUNqQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDO29CQUMxQixDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxFQUMzQztvQkFDQSwrQ0FBK0M7b0JBQy9DLHVDQUF1QztvQkFDdkMsMENBQTBDO29CQUMxQyxPQUFNO2lCQUNQO2dCQUVELE1BQU0sV0FBVyxHQUFnQixHQUFHLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFBO2dCQUM3RCxJQUFJLFdBQVcsQ0FBQyxVQUFVLEVBQUUsRUFBRTtvQkFDNUIseURBQXlEO29CQUN6RCxPQUFNO2lCQUNQO2dCQUVELElBQUksQ0FBQyxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsRUFBRTtvQkFDdkIsOERBQThEO29CQUM5RCx3Q0FBd0M7b0JBQ3hDLElBQUksQ0FBQyxHQUFHLFFBQVEsRUFBRSxDQUFDLEdBQUc7d0JBQ3BCLGVBQWUsRUFBRSxFQUFFO3dCQUNuQixRQUFRLEVBQUUsRUFBRTtxQkFDYixDQUFBO2lCQUNGO2dCQUVELE1BQU0sWUFBWSxHQUFpQixNQUFzQixDQUFBO2dCQUN6RCwwREFBMEQ7Z0JBQzFELE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtnQkFFdkMsNERBQTREO2dCQUM1RCxJQUFJLEtBQUssR0FBZ0IsSUFBSSwwQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQTtnQkFFdEQsSUFBSSxNQUFNLEdBQVksS0FBSyxDQUFBO2dCQUMzQixJQUFJLFlBQVksWUFBWSwwQkFBZ0IsRUFBRTtvQkFDNUMsTUFBTSxlQUFlLEdBQ25CLFlBQWdDLENBQUE7b0JBQ2xDLE1BQU0saUJBQWlCLEdBQU8sZUFBZSxDQUFDLG9CQUFvQixFQUFFLENBQUE7b0JBRXBFLElBQUksaUJBQWlCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO3dCQUM5QiwrQ0FBK0M7d0JBQy9DLEtBQUssR0FBRyxJQUFJLHdCQUFlLENBQ3pCLE1BQU0sRUFDTixpQkFBaUIsRUFDakIsSUFBSSx1QkFBYyxDQUFDLEtBQUssQ0FBQyxDQUMxQixDQUFBO3dCQUVELDJDQUEyQzt3QkFDM0MsTUFBTSxHQUFHLElBQUksQ0FBQTtxQkFDZDtpQkFDRjtnQkFFRCxXQUFXLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtnQkFDdkMsSUFBSSxNQUFNLEVBQUU7b0JBQ1YsNEJBQTRCO29CQUM1QixJQUFJLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7aUJBQ3ZEO3FCQUFNO29CQUNMLDhCQUE4QjtvQkFDOUIsSUFBSSxDQUFDLEdBQUcsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBO2lCQUNoRDtnQkFFRCxzRUFBc0U7Z0JBQ3RFLDBCQUEwQjtnQkFFMUIscUVBQXFFO2dCQUNyRSxzQkFBc0I7Z0JBQ3RCLE1BQU0sUUFBUSxHQUFhLFlBQVksQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFBO2dCQUN4RSxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBZSxFQUFFLEVBQUU7b0JBQ25DLE1BQU0sR0FBRyxHQUFXLFlBQVksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUE7b0JBQ3ZELElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFO3dCQUNkLG9FQUFvRTt3QkFDcEUsb0VBQW9FO3dCQUNwRSxzRUFBc0U7d0JBQ3RFLHFCQUFxQjt3QkFFckIsMEJBQTBCO3dCQUMxQixNQUFNLElBQUkscUJBQVksQ0FDcEIsK0NBQStDOzRCQUM3QyxzQkFBc0IsT0FBTyxFQUFFLENBQ2xDLENBQUE7cUJBQ0Y7b0JBQ0QsS0FBSyxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7Z0JBQ3JDLENBQUMsQ0FBQyxDQUFBO2dCQUVGLE1BQU0sSUFBSSxHQUFXLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQTtnQkFDbkMsTUFBTSxTQUFTLEdBQVcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFBO2dCQUM3QyxNQUFNLGFBQWEsR0FBc0IsSUFBSSwwQkFBaUIsQ0FDNUQsSUFBSSxFQUNKLFNBQVMsRUFDVCxPQUFPLEVBQ1AsS0FBSyxDQUNOLENBQUE7Z0JBQ0QsR0FBRyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQTtZQUM3QixDQUFDLENBQUMsQ0FBQTtZQUVGLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEVBQUU7Z0JBQ3RCLHdFQUF3RTtnQkFDeEUsMERBQTBEO2dCQUMxRCxPQUFPLElBQUksK0JBQXNCLENBQy9CLG9EQUFvRDtvQkFDbEQsaUNBQWlDLENBQ3BDLENBQUE7YUFDRjtZQUVELDBFQUEwRTtZQUMxRSwwQ0FBMEM7WUFFMUMsTUFBTSxJQUFJLEdBQU8sSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFFMUIseUVBQXlFO1lBQ3pFLGtCQUFrQjtZQUNsQixNQUFNLFlBQVksR0FBa0IsR0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFBO1lBQ3BELFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUF3QixFQUFFLEVBQUU7Z0JBQ2hELHlFQUF5RTtnQkFDekUsU0FBUztnQkFDVCxNQUFNLE1BQU0sR0FBTyxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUE7Z0JBQzFDLDJEQUEyRDtnQkFDM0QsTUFBTSxxQkFBcUIsR0FDekIsV0FBVyxDQUFDLHNCQUFzQixFQUFFLENBQUE7Z0JBQ3RDLHlFQUF5RTtnQkFDekUsYUFBYTtnQkFDYixNQUFNLFlBQVksR0FBTyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUE7Z0JBRXRFLE1BQU0sT0FBTyxHQUFXLFdBQVcsQ0FBQyxVQUFVLEVBQUUsQ0FBQTtnQkFDaEQsTUFBTSxRQUFRLEdBQVcsV0FBVyxDQUFDLGdCQUFnQixFQUFFLENBQUE7Z0JBQ3ZELE1BQU0sYUFBYSxHQUNqQixJQUFJLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQTtnQkFDckMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFlBQThCLEVBQUUsQ0FBUyxFQUFFLEVBQUU7b0JBQ2xFLE1BQU0saUJBQWlCLEdBQU8sWUFBWSxDQUFDLG9CQUFvQixFQUFFLENBQUE7b0JBQ2pFLE1BQU0sZUFBZSxHQUNuQixZQUFZLENBQUMscUJBQXFCLEVBQUUsQ0FBQTtvQkFFdEMsb0VBQW9FO29CQUNwRSwwQ0FBMEM7b0JBQzFDLE1BQU0sTUFBTSxHQUFpQixlQUFlLENBQUMsU0FBUyxFQUFrQixDQUFBO29CQUV4RSxJQUFJLHFCQUFxQixHQUFPLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQTtvQkFDbEQsaUVBQWlFO29CQUNqRSxpRUFBaUU7b0JBQ2pFLElBQUksQ0FBQyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLFlBQVksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7d0JBQzFELG9FQUFvRTt3QkFDcEUsaUJBQWlCO3dCQUNqQixxQkFBcUIsR0FBRyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUE7d0JBQy9ELDJCQUEyQjt3QkFDM0IsTUFBTSxlQUFlLEdBQWlCLElBQUEsMkJBQWlCLEVBQ3JELE1BQU0sQ0FBQyxXQUFXLEVBQUUsRUFDcEIsWUFBWSxFQUNaLE1BQU0sQ0FBQyxZQUFZLEVBQUUsRUFDckIsTUFBTSxDQUFDLFdBQVcsRUFBRSxFQUNwQixNQUFNLENBQUMsWUFBWSxFQUFFLENBQ04sQ0FBQTt3QkFDakIseURBQXlEO3dCQUN6RCxJQUFJLHFCQUFxQixHQUFxQixJQUFBLDJCQUFpQixFQUM3RCxZQUFZLENBQUMsV0FBVyxFQUFFLEVBQzFCLFlBQVksRUFDWixNQUFNLENBQUMsWUFBWSxFQUFFLEVBQ3JCLE1BQU0sQ0FBQyxXQUFXLEVBQUUsRUFDcEIsTUFBTSxDQUFDLFlBQVksRUFBRSxFQUNyQixpQkFBaUIsRUFDakIsSUFBSSx5QkFBZSxDQUFDLGVBQWUsQ0FBQyxDQUNqQixDQUFBO3dCQUNyQixNQUFNLGNBQWMsR0FBdUIsSUFBSSw0QkFBa0IsQ0FDL0QsT0FBTyxFQUNQLHFCQUFxQixDQUN0QixDQUFBO3dCQUNELEdBQUcsQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLENBQUE7cUJBQzlCO29CQUVELG9FQUFvRTtvQkFDcEUsdURBQXVEO29CQUV2RCwyQkFBMkI7b0JBQzNCLE1BQU0sU0FBUyxHQUFpQixJQUFBLDJCQUFpQixFQUMvQyxNQUFNLENBQUMsV0FBVyxFQUFFLEVBQ3BCLHFCQUFxQixFQUNyQixNQUFNLENBQUMsWUFBWSxFQUFFLEVBQ3JCLE1BQU0sQ0FBQyxXQUFXLEVBQUUsRUFDcEIsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUNOLENBQUE7b0JBQ2pCLHlEQUF5RDtvQkFDekQsTUFBTSxlQUFlLEdBQXFCLElBQUEsMkJBQWlCLEVBQ3pELFlBQVksQ0FBQyxXQUFXLEVBQUUsRUFDMUIscUJBQXFCLEVBQ3JCLE1BQU0sQ0FBQyxZQUFZLEVBQUUsRUFDckIsTUFBTSxDQUFDLFdBQVcsRUFBRSxFQUNwQixNQUFNLENBQUMsWUFBWSxFQUFFLEVBQ3JCLGlCQUFpQixFQUNqQixJQUFJLHlCQUFlLENBQUMsU0FBUyxDQUFDLENBQ1gsQ0FBQTtvQkFDckIsTUFBTSxjQUFjLEdBQXVCLElBQUksNEJBQWtCLENBQy9ELE9BQU8sRUFDUCxlQUFlLENBQ2hCLENBQUE7b0JBQ0QsR0FBRyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQTtnQkFDL0IsQ0FBQyxDQUFDLENBQUE7Z0JBRUYsMEVBQTBFO2dCQUMxRSxnQkFBZ0I7Z0JBQ2hCLE1BQU0sY0FBYyxHQUFPLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQTtnQkFDeEUsSUFBSSxjQUFjLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUMzQixNQUFNLGVBQWUsR0FBaUIsSUFBSSw0QkFBa0IsQ0FDMUQsY0FBYyxFQUNkLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxFQUN4QixJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsa0RBQWtEO29CQUNoRSxDQUFDLENBQUMsa0VBQWtFO3FCQUNyRCxDQUFBO29CQUNqQixNQUFNLGNBQWMsR0FBdUIsSUFBSSw0QkFBa0IsQ0FDL0QsT0FBTyxFQUNQLGVBQWUsQ0FDaEIsQ0FBQTtvQkFDRCxHQUFHLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFBO2lCQUM5QjtnQkFFRCwyREFBMkQ7Z0JBQzNELE1BQU0sZ0JBQWdCLEdBQU8sV0FBVyxDQUFDLFFBQVEsRUFBRSxDQUFBO2dCQUNuRCx1RUFBdUU7Z0JBQ3ZFLE1BQU0scUJBQXFCLEdBQU8sV0FBVyxDQUFDLHFCQUFxQixFQUFFLENBQUE7Z0JBQ3JFLHNFQUFzRTtnQkFDdEUsTUFBTSxrQkFBa0IsR0FBTyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQTtnQkFDMUUsa0VBQWtFO2dCQUNsRSxNQUFNLFdBQVcsR0FBTyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUE7Z0JBQzdDLDBFQUEwRTtnQkFDMUUsa0JBQWtCO2dCQUNsQixNQUFNLHNCQUFzQixHQUFPLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQTtnQkFDdEUsdUVBQXVFO2dCQUN2RSxNQUFNLGNBQWMsR0FBTyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUE7Z0JBQ3JFLElBQUksY0FBYyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDM0IsTUFBTSxTQUFTLEdBQWlCLElBQUksNEJBQWtCLENBQ3BELGNBQWMsRUFDZCxHQUFHLENBQUMsZUFBZSxFQUFFLEVBQ3JCLFFBQVEsRUFDUixTQUFTLENBQ00sQ0FBQTtvQkFDakIsTUFBTSxjQUFjLEdBQXVCLElBQUksNEJBQWtCLENBQy9ELE9BQU8sRUFDUCxTQUFTLENBQ1YsQ0FBQTtvQkFDRCxHQUFHLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFBO2lCQUM5QjtZQUNILENBQUMsQ0FBQyxDQUFBO1lBQ0YsT0FBTyxTQUFTLENBQUE7UUFDbEIsQ0FBQyxDQUFBO1FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1dBb0JHO1FBQ0gsZ0JBQVcsR0FBRyxDQUNaLFNBQWlCLEVBQ2pCLFlBQW9CLEVBQ3BCLE1BQVUsRUFDVixPQUFlLEVBQ2YsV0FBcUIsRUFDckIsYUFBdUIsRUFDdkIsa0JBQTRCLFNBQVMsRUFDckMsTUFBVSxTQUFTLEVBQ25CLGFBQXFCLFNBQVMsRUFDOUIsT0FBZSxTQUFTLEVBQ3hCLE9BQVcsSUFBQSx5QkFBTyxHQUFFLEVBQ3BCLFdBQWUsSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLEVBQ3hCLFlBQW9CLENBQUMsRUFDVCxFQUFFO1lBQ2QsSUFBSSxTQUFTLEdBQUcsV0FBVyxDQUFDLE1BQU0sRUFBRTtnQkFDbEMsMEJBQTBCO2dCQUMxQixNQUFNLElBQUksdUJBQWMsQ0FDdEIsNEVBQTRFLENBQzdFLENBQUE7YUFDRjtZQUVELElBQUksT0FBTyxlQUFlLEtBQUssV0FBVyxFQUFFO2dCQUMxQyxlQUFlLEdBQUcsV0FBVyxDQUFBO2FBQzlCO1lBRUQsSUFBSSxPQUFPLFVBQVUsS0FBSyxXQUFXLEVBQUU7Z0JBQ3JDLFVBQVUsR0FBRyxPQUFPLENBQUE7YUFDckI7WUFFRCxNQUFNLElBQUksR0FBTyxJQUFJLGVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUUxQixJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ25CLE9BQU8sU0FBUyxDQUFBO2FBQ2pCO1lBRUQsTUFBTSxHQUFHLEdBQTJCLElBQUksc0JBQXNCLENBQzVELFdBQVcsRUFDWCxhQUFhLEVBQ2IsZUFBZSxDQUNoQixDQUFBO1lBQ0QsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLFVBQVUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzFELEdBQUcsQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQTthQUN6QztpQkFBTTtnQkFDTCxHQUFHLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUE7Z0JBQ3pDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLEVBQUU7b0JBQ25DLEdBQUcsQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQTtpQkFDMUM7YUFDRjtZQUVELElBQUksR0FBRyxHQUF3QixFQUFFLENBQUE7WUFDakMsSUFBSSxJQUFJLEdBQXlCLEVBQUUsQ0FBQTtZQUVuQyxNQUFNLGVBQWUsR0FBVSxJQUFJLENBQUMsbUJBQW1CLENBQ3JELEdBQUcsRUFDSCxJQUFJLEVBQ0osUUFBUSxFQUNSLFNBQVMsQ0FDVixDQUFBO1lBQ0QsSUFBSSxPQUFPLGVBQWUsS0FBSyxXQUFXLEVBQUU7Z0JBQzFDLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUE7Z0JBQ3JCLElBQUksR0FBRyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUE7YUFDM0I7aUJBQU07Z0JBQ0wsTUFBTSxlQUFlLENBQUE7YUFDdEI7WUFFRCxNQUFNLE1BQU0sR0FBVyxJQUFJLGVBQU0sQ0FBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUE7WUFDM0UsT0FBTyxJQUFJLGVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUMvQixDQUFDLENBQUE7UUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O1dBa0JHO1FBQ0gsa0JBQWEsR0FBRyxDQUNkLFNBQWlCLEVBQ2pCLFlBQW9CLEVBQ3BCLFdBQXFCLEVBQ3JCLGFBQXVCLEVBQ3ZCLGVBQXlCLEVBQ3pCLE9BQWUsRUFDZixjQUFzQixTQUFTLEVBQy9CLE1BQVUsU0FBUyxFQUNuQixhQUFxQixTQUFTLEVBQzlCLE9BQWUsU0FBUyxFQUN4QixPQUFXLElBQUEseUJBQU8sR0FBRSxFQUNwQixXQUFlLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxFQUN4QixZQUFvQixDQUFDLEVBQ1QsRUFBRTtZQUNkLE1BQU0sSUFBSSxHQUFPLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQzFCLElBQUksR0FBRyxHQUF3QixFQUFFLENBQUE7WUFDakMsSUFBSSxJQUFJLEdBQXlCLEVBQUUsQ0FBQTtZQUNuQyxJQUFJLE9BQU8sR0FBRyxLQUFLLFdBQVcsRUFBRTtnQkFDOUIsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQTthQUNuQjtZQUVELE1BQU0sU0FBUyxHQUF3QixFQUFFLENBQUE7WUFDekMsSUFBSSxPQUFPLEdBQU8sSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDM0IsSUFBSSxXQUFXLEdBQVcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUNwRCxLQUFLLElBQUksQ0FBQyxHQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDL0MsTUFBTSxJQUFJLEdBQVMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQTtnQkFDbEMsTUFBTSxPQUFPLEdBQVcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO2dCQUN6QyxNQUFNLE1BQU0sR0FBaUIsSUFBSSxDQUFDLFNBQVMsRUFBa0IsQ0FBQTtnQkFDN0QsSUFBSSxHQUFHLEdBQU8sTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFBO2dCQUV4QyxJQUFJLFdBQVcsR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUE7Z0JBQzdCLElBQUksUUFBUSxHQUFXLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUE7Z0JBQzlDLElBQ0UsT0FBTyxVQUFVLEtBQUssV0FBVztvQkFDakMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUM7b0JBQ1osT0FBTyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUM7b0JBQ2YsUUFBUSxLQUFLLFdBQVcsRUFDeEI7b0JBQ0EsT0FBTyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUE7b0JBQ2xDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTt3QkFDcEIsV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUE7d0JBQzlCLE9BQU8sR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUE7cUJBQ3RCO3lCQUFNO3dCQUNMLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUE7cUJBQzNCO2lCQUNGO2dCQUVELE1BQU0sSUFBSSxHQUFXLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQTtnQkFDbkMsTUFBTSxTQUFTLEdBQVcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFBO2dCQUM3QyxNQUFNLEtBQUssR0FBc0IsSUFBSSwwQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQTtnQkFDM0QsTUFBTSxNQUFNLEdBQXNCLElBQUksMEJBQWlCLENBQ3JELElBQUksRUFDSixTQUFTLEVBQ1QsT0FBTyxFQUNQLEtBQUssQ0FDTixDQUFBO2dCQUNELE1BQU0sSUFBSSxHQUFhLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQTtnQkFDNUMsTUFBTSxRQUFRLEdBQWEsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7Z0JBQ3pELEtBQUssSUFBSSxDQUFDLEdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUNoRCxNQUFNLEdBQUcsR0FBVyxNQUFNLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtvQkFDMUQsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUU7d0JBQ2QsMEJBQTBCO3dCQUMxQixNQUFNLElBQUkscUJBQVksQ0FDcEIseUNBQXlDOzRCQUN2QyxzQkFBc0IsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUMzQyxDQUFBO3FCQUNGO29CQUNELE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtpQkFDekQ7Z0JBQ0QsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtnQkFDdEIscUZBQXFGO2dCQUNyRixJQUFJLFdBQVcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQ3hCLE1BQU0sUUFBUSxHQUFpQixJQUFBLDJCQUFpQixFQUM5QyxNQUFNLENBQUMsV0FBVyxFQUFFLEVBQ3BCLFdBQVcsRUFDWCxXQUFXLEVBQ1gsUUFBUSxFQUNSLFNBQVMsQ0FDTSxDQUFBO29CQUNqQixNQUFNLE9BQU8sR0FBdUIsSUFBSSw0QkFBa0IsQ0FDeEQsT0FBTyxFQUNQLFFBQVEsQ0FDVCxDQUFBO29CQUNELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7aUJBQ25CO2FBQ0Y7WUFFRCxpREFBaUQ7WUFDakQsSUFBSSxZQUFZLEdBQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUN2QyxJQUFJLFlBQVksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLEVBQUU7Z0JBQ3JFLE1BQU0sR0FBRyxHQUEyQixJQUFJLHNCQUFzQixDQUM1RCxXQUFXLEVBQ1gsYUFBYSxFQUNiLGVBQWUsQ0FDaEIsQ0FBQTtnQkFDRCxHQUFHLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUE7Z0JBQ2xELE1BQU0sZUFBZSxHQUFVLElBQUksQ0FBQyxtQkFBbUIsQ0FDckQsR0FBRyxFQUNILElBQUksRUFDSixRQUFRLEVBQ1IsU0FBUyxDQUNWLENBQUE7Z0JBQ0QsSUFBSSxPQUFPLGVBQWUsS0FBSyxXQUFXLEVBQUU7b0JBQzFDLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUE7b0JBQ3JCLElBQUksR0FBRyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUE7aUJBQzNCO3FCQUFNO29CQUNMLE1BQU0sZUFBZSxDQUFBO2lCQUN0QjthQUNGO1lBRUQsTUFBTSxRQUFRLEdBQWEsSUFBSSxtQkFBUSxDQUNyQyxTQUFTLEVBQ1QsWUFBWSxFQUNaLElBQUksRUFDSixHQUFHLEVBQ0gsSUFBSSxFQUNKLFdBQVcsRUFDWCxTQUFTLENBQ1YsQ0FBQTtZQUNELE9BQU8sSUFBSSxlQUFVLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDakMsQ0FBQyxDQUFBO1FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1dBb0JHO1FBQ0gsa0JBQWEsR0FBRyxDQUNkLFNBQWlCLEVBQ2pCLFlBQW9CLEVBQ3BCLE1BQVUsRUFDVixVQUFrQixFQUFFLHFDQUFxQztRQUN6RCxXQUFxQixFQUNyQixhQUF1QixFQUN2QixrQkFBNEIsU0FBUyxFQUNyQyxtQkFBMkIsU0FBUyxFQUNwQyxNQUFVLFNBQVMsRUFDbkIsYUFBcUIsU0FBUyxFQUM5QixPQUFlLFNBQVMsRUFDeEIsT0FBVyxJQUFBLHlCQUFPLEdBQUUsRUFDcEIsV0FBZSxJQUFJLGVBQUUsQ0FBQyxDQUFDLENBQUMsRUFDeEIsWUFBb0IsQ0FBQyxFQUNULEVBQUU7WUFDZCxJQUFJLEdBQUcsR0FBd0IsRUFBRSxDQUFBO1lBQ2pDLElBQUksSUFBSSxHQUF5QixFQUFFLENBQUE7WUFDbkMsSUFBSSxVQUFVLEdBQXlCLEVBQUUsQ0FBQTtZQUV6QyxJQUFJLE9BQU8sZUFBZSxLQUFLLFdBQVcsRUFBRTtnQkFDMUMsZUFBZSxHQUFHLFdBQVcsQ0FBQTthQUM5QjtZQUVELE1BQU0sSUFBSSxHQUFPLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBRTFCLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDbkIsT0FBTyxTQUFTLENBQUE7YUFDakI7WUFFRCxJQUFJLE9BQU8sVUFBVSxLQUFLLFdBQVcsRUFBRTtnQkFDckMsVUFBVSxHQUFHLFVBQVUsQ0FBQTthQUN4QjtpQkFBTSxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDcEUsMEJBQTBCO2dCQUMxQixNQUFNLElBQUksc0JBQWEsQ0FDckIsaUNBQWlDLEdBQUcsa0NBQWtDLENBQ3ZFLENBQUE7YUFDRjtZQUVELElBQUksT0FBTyxnQkFBZ0IsS0FBSyxXQUFXLEVBQUU7Z0JBQzNDLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQ3BDLG9CQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsU0FBUyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQ3RELENBQUE7YUFDRjtZQUVELE1BQU0sR0FBRyxHQUEyQixJQUFJLHNCQUFzQixDQUM1RCxXQUFXLEVBQ1gsYUFBYSxFQUNiLGVBQWUsQ0FDaEIsQ0FBQTtZQUNELElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUM3RCxHQUFHLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUE7YUFDNUM7aUJBQU07Z0JBQ0wsR0FBRyxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFBO2dCQUM1QyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxFQUFFO29CQUNuQyxHQUFHLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUE7aUJBQzFDO2FBQ0Y7WUFFRCxNQUFNLGVBQWUsR0FBVSxJQUFJLENBQUMsbUJBQW1CLENBQ3JELEdBQUcsRUFDSCxJQUFJLEVBQ0osUUFBUSxFQUNSLFNBQVMsQ0FDVixDQUFBO1lBQ0QsSUFBSSxPQUFPLGVBQWUsS0FBSyxXQUFXLEVBQUU7Z0JBQzFDLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUE7Z0JBQ3JCLElBQUksR0FBRyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtnQkFDN0IsVUFBVSxHQUFHLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQTthQUM5QjtpQkFBTTtnQkFDTCxNQUFNLGVBQWUsQ0FBQTthQUN0QjtZQUVELE1BQU0sUUFBUSxHQUFhLElBQUksbUJBQVEsQ0FDckMsU0FBUyxFQUNULFlBQVksRUFDWixJQUFJLEVBQ0osR0FBRyxFQUNILElBQUksRUFDSixnQkFBZ0IsRUFDaEIsVUFBVSxDQUNYLENBQUE7WUFFRCxPQUFPLElBQUksZUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ2pDLENBQUMsQ0FBQTtRQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7V0FrQkc7UUFDSCw4QkFBeUIsR0FBRyxDQUMxQixZQUFvQiw0QkFBZ0IsRUFDcEMsWUFBb0IsRUFDcEIsYUFBdUIsRUFDdkIsZUFBeUIsRUFDekIsTUFBYyxFQUNkLFNBQWEsRUFDYixPQUFXLEVBQ1gsTUFBVSxFQUNWLFFBQWdCLEVBQ2hCLE1BQVUsU0FBUyxFQUNuQixhQUFxQixTQUFTLEVBQzlCLE9BQWUsU0FBUyxFQUN4QixPQUFXLElBQUEseUJBQU8sR0FBRSxFQUNwQix3QkFBNEMsRUFBRSxFQUNsQyxFQUFFO1lBQ2QsSUFBSSxHQUFHLEdBQXdCLEVBQUUsQ0FBQTtZQUNqQyxJQUFJLElBQUksR0FBeUIsRUFBRSxDQUFBO1lBRW5DLE1BQU0sSUFBSSxHQUFPLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQzFCLE1BQU0sR0FBRyxHQUFPLElBQUEseUJBQU8sR0FBRSxDQUFBO1lBQ3pCLElBQUksU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUMvQyxNQUFNLElBQUksS0FBSyxDQUNiLDRHQUE0RyxDQUM3RyxDQUFBO2FBQ0Y7WUFFRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxFQUFFO2dCQUNuQyxNQUFNLEdBQUcsR0FBMkIsSUFBSSxzQkFBc0IsQ0FDNUQsYUFBYSxFQUNiLGFBQWEsRUFDYixlQUFlLENBQ2hCLENBQUE7Z0JBQ0QsR0FBRyxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFBO2dCQUN6QyxNQUFNLE9BQU8sR0FBVSxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO2dCQUMxRCxJQUFJLE9BQU8sT0FBTyxLQUFLLFdBQVcsRUFBRTtvQkFDbEMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtvQkFDckIsSUFBSSxHQUFHLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQTtpQkFDM0I7cUJBQU07b0JBQ0wsTUFBTSxPQUFPLENBQUE7aUJBQ2Q7YUFDRjtZQUVELE1BQU0sb0JBQW9CLEdBQXlCLElBQUksMkNBQW9CLENBQ3pFLFNBQVMsRUFDVCxZQUFZLEVBQ1osSUFBSSxFQUNKLEdBQUcsRUFDSCxJQUFJLEVBQ0osTUFBTSxFQUNOLFNBQVMsRUFDVCxPQUFPLEVBQ1AsTUFBTSxFQUNOLFFBQVEsQ0FDVCxDQUFBO1lBQ0QscUJBQXFCLENBQUMsT0FBTyxDQUFDLENBQUMsb0JBQXNDLEVBQUUsRUFBRTtnQkFDdkUsb0JBQW9CLENBQUMsZUFBZSxDQUNsQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsRUFDdkIsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQ3hCLENBQUE7WUFDSCxDQUFDLENBQUMsQ0FBQTtZQUNGLE9BQU8sSUFBSSxlQUFVLENBQUMsb0JBQW9CLENBQUMsQ0FBQTtRQUM3QyxDQUFDLENBQUE7UUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztXQXNCRztRQUNILHdCQUFtQixHQUFHLENBQ3BCLFlBQW9CLDRCQUFnQixFQUNwQyxZQUFvQixFQUNwQixVQUFrQixFQUNsQixXQUFxQixFQUNyQixhQUF1QixFQUN2QixlQUF5QixFQUN6QixNQUFjLEVBQ2QsU0FBYSxFQUNiLE9BQVcsRUFDWCxXQUFlLEVBQ2YsY0FBa0IsRUFDbEIsZUFBdUIsRUFDdkIsZUFBeUIsRUFDekIsTUFBVSxTQUFTLEVBQ25CLGFBQXFCLFNBQVMsRUFDOUIsT0FBZSxTQUFTLEVBQ3hCLE9BQVcsSUFBQSx5QkFBTyxHQUFFLEVBQ1IsRUFBRTtZQUNkLElBQUksR0FBRyxHQUF3QixFQUFFLENBQUE7WUFDakMsSUFBSSxJQUFJLEdBQXlCLEVBQUUsQ0FBQTtZQUNuQyxJQUFJLFNBQVMsR0FBeUIsRUFBRSxDQUFBO1lBRXhDLE1BQU0sSUFBSSxHQUFPLElBQUksZUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQzFCLE1BQU0sR0FBRyxHQUFPLElBQUEseUJBQU8sR0FBRSxDQUFBO1lBQ3pCLElBQUksU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUMvQyxNQUFNLElBQUksa0JBQVMsQ0FDakIsc0dBQXNHLENBQ3ZHLENBQUE7YUFDRjtZQUVELE1BQU0sR0FBRyxHQUEyQixJQUFJLHNCQUFzQixDQUM1RCxXQUFXLEVBQ1gsYUFBYSxFQUNiLGVBQWUsQ0FDaEIsQ0FBQTtZQUNELElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUM3RCxHQUFHLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsR0FBRyxDQUFDLENBQUE7YUFDakQ7aUJBQU07Z0JBQ0wsR0FBRyxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFBO2dCQUNqRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxFQUFFO29CQUNuQyxHQUFHLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUE7aUJBQzFDO2FBQ0Y7WUFFRCxNQUFNLGVBQWUsR0FBVSxJQUFJLENBQUMsbUJBQW1CLENBQ3JELEdBQUcsRUFDSCxJQUFJLEVBQ0osU0FBUyxFQUNULFNBQVMsRUFDVCxJQUFJLENBQ0wsQ0FBQTtZQUNELElBQUksT0FBTyxlQUFlLEtBQUssV0FBVyxFQUFFO2dCQUMxQyxHQUFHLEdBQUcsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFBO2dCQUNyQixJQUFJLEdBQUcsR0FBRyxDQUFDLGdCQUFnQixFQUFFLENBQUE7Z0JBQzdCLFNBQVMsR0FBRyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUE7YUFDN0I7aUJBQU07Z0JBQ0wsTUFBTSxlQUFlLENBQUE7YUFDdEI7WUFFRCxNQUFNLGtCQUFrQixHQUFvQixJQUFJLHlCQUFlLENBQzdELGVBQWUsRUFDZixjQUFjLEVBQ2QsZUFBZSxDQUNoQixDQUFBO1lBRUQsTUFBTSxHQUFHLEdBQW1CLElBQUksNkJBQWMsQ0FDNUMsU0FBUyxFQUNULFlBQVksRUFDWixJQUFJLEVBQ0osR0FBRyxFQUNILElBQUksRUFDSixNQUFNLEVBQ04sU0FBUyxFQUNULE9BQU8sRUFDUCxXQUFXLEVBQ1gsU0FBUyxFQUNULElBQUkseUJBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUN4QyxDQUFBO1lBQ0QsT0FBTyxJQUFJLGVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUM1QixDQUFDLENBQUE7UUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1dBd0JHO1FBQ0gsd0JBQW1CLEdBQUcsQ0FDcEIsWUFBb0IsNEJBQWdCLEVBQ3BDLFlBQW9CLEVBQ3BCLFVBQWtCLEVBQ2xCLFdBQXFCLEVBQ3JCLGFBQXVCLEVBQ3ZCLGVBQXlCLEVBQ3pCLE1BQWMsRUFDZCxTQUFhLEVBQ2IsT0FBVyxFQUNYLFdBQWUsRUFDZixjQUFrQixFQUNsQixlQUF1QixFQUN2QixlQUF5QixFQUN6QixhQUFxQixFQUNyQixNQUFVLFNBQVMsRUFDbkIsYUFBcUIsU0FBUyxFQUM5QixPQUFlLFNBQVMsRUFDeEIsT0FBVyxJQUFBLHlCQUFPLEdBQUUsRUFDUixFQUFFO1lBQ2QsSUFBSSxHQUFHLEdBQXdCLEVBQUUsQ0FBQTtZQUNqQyxJQUFJLElBQUksR0FBeUIsRUFBRSxDQUFBO1lBQ25DLElBQUksU0FBUyxHQUF5QixFQUFFLENBQUE7WUFFeEMsTUFBTSxJQUFJLEdBQU8sSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDMUIsTUFBTSxHQUFHLEdBQU8sSUFBQSx5QkFBTyxHQUFFLENBQUE7WUFDekIsSUFBSSxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQy9DLE1BQU0sSUFBSSxrQkFBUyxDQUNqQixzR0FBc0csQ0FDdkcsQ0FBQTthQUNGO1lBRUQsSUFBSSxhQUFhLEdBQUcsR0FBRyxJQUFJLGFBQWEsR0FBRyxDQUFDLEVBQUU7Z0JBQzVDLE1BQU0sSUFBSSxrQkFBUyxDQUNqQix3RkFBd0YsQ0FDekYsQ0FBQTthQUNGO1lBRUQsTUFBTSxHQUFHLEdBQTJCLElBQUksc0JBQXNCLENBQzVELFdBQVcsRUFDWCxhQUFhLEVBQ2IsZUFBZSxDQUNoQixDQUFBO1lBQ0QsSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLFVBQVUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzdELEdBQUcsQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQTthQUNqRDtpQkFBTTtnQkFDTCxHQUFHLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUE7Z0JBQ2pELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLEVBQUU7b0JBQ25DLEdBQUcsQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQTtpQkFDMUM7YUFDRjtZQUVELE1BQU0sZUFBZSxHQUFVLElBQUksQ0FBQyxtQkFBbUIsQ0FDckQsR0FBRyxFQUNILElBQUksRUFDSixTQUFTLEVBQ1QsU0FBUyxFQUNULElBQUksQ0FDTCxDQUFBO1lBQ0QsSUFBSSxPQUFPLGVBQWUsS0FBSyxXQUFXLEVBQUU7Z0JBQzFDLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUE7Z0JBQ3JCLElBQUksR0FBRyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtnQkFDN0IsU0FBUyxHQUFHLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQTthQUM3QjtpQkFBTTtnQkFDTCxNQUFNLGVBQWUsQ0FBQTthQUN0QjtZQUVELE1BQU0sa0JBQWtCLEdBQW9CLElBQUkseUJBQWUsQ0FDN0QsZUFBZSxFQUNmLGNBQWMsRUFDZCxlQUFlLENBQ2hCLENBQUE7WUFFRCxNQUFNLEdBQUcsR0FBbUIsSUFBSSw2QkFBYyxDQUM1QyxTQUFTLEVBQ1QsWUFBWSxFQUNaLElBQUksRUFDSixHQUFHLEVBQ0gsSUFBSSxFQUNKLE1BQU0sRUFDTixTQUFTLEVBQ1QsT0FBTyxFQUNQLFdBQVcsRUFDWCxTQUFTLEVBQ1QsSUFBSSx5QkFBZSxDQUFDLGtCQUFrQixDQUFDLEVBQ3ZDLGFBQWEsQ0FDZCxDQUFBO1lBQ0QsT0FBTyxJQUFJLGVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUM1QixDQUFDLENBQUE7UUFFRDs7Ozs7Ozs7Ozs7Ozs7O1dBZUc7UUFDSCx3QkFBbUIsR0FBRyxDQUNwQixZQUFvQiw0QkFBZ0IsRUFDcEMsWUFBb0IsRUFDcEIsYUFBdUIsRUFDdkIsZUFBeUIsRUFDekIsb0JBQThCLEVBQzlCLG9CQUE0QixFQUM1QixNQUFVLFNBQVMsRUFDbkIsYUFBcUIsU0FBUyxFQUM5QixPQUFlLFNBQVMsRUFDeEIsT0FBVyxJQUFBLHlCQUFPLEdBQUUsRUFDUixFQUFFO1lBQ2QsTUFBTSxJQUFJLEdBQU8sSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDMUIsSUFBSSxHQUFHLEdBQXdCLEVBQUUsQ0FBQTtZQUNqQyxJQUFJLElBQUksR0FBeUIsRUFBRSxDQUFBO1lBRW5DLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLEVBQUU7Z0JBQ25DLE1BQU0sR0FBRyxHQUEyQixJQUFJLHNCQUFzQixDQUM1RCxhQUFhLEVBQ2IsYUFBYSxFQUNiLGVBQWUsQ0FDaEIsQ0FBQTtnQkFDRCxHQUFHLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUE7Z0JBQ3pDLE1BQU0sZUFBZSxHQUFVLElBQUksQ0FBQyxtQkFBbUIsQ0FDckQsR0FBRyxFQUNILElBQUksRUFDSixTQUFTLEVBQ1QsU0FBUyxDQUNWLENBQUE7Z0JBQ0QsSUFBSSxPQUFPLGVBQWUsS0FBSyxXQUFXLEVBQUU7b0JBQzFDLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUE7b0JBQ3JCLElBQUksR0FBRyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUE7aUJBQzNCO3FCQUFNO29CQUNMLE1BQU0sZUFBZSxDQUFBO2lCQUN0QjthQUNGO1lBRUQsTUFBTSxRQUFRLEdBQU8sSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDOUIsTUFBTSxHQUFHLEdBQW1CLElBQUksK0JBQWMsQ0FDNUMsU0FBUyxFQUNULFlBQVksRUFDWixJQUFJLEVBQ0osR0FBRyxFQUNILElBQUksRUFDSixJQUFJLHlCQUFlLENBQUMsb0JBQW9CLEVBQUUsUUFBUSxFQUFFLG9CQUFvQixDQUFDLENBQzFFLENBQUE7WUFDRCxPQUFPLElBQUksZUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQzVCLENBQUMsQ0FBQTtRQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O1dBbUJHO1FBQ0gsdUJBQWtCLEdBQUcsQ0FDbkIsWUFBb0IsNEJBQWdCLEVBQ3BDLFlBQW9CLEVBQ3BCLGFBQXVCLEVBQ3ZCLGVBQXlCLEVBQ3pCLFdBQTRCLFNBQVMsRUFDckMsWUFBb0IsU0FBUyxFQUM3QixPQUFlLFNBQVMsRUFDeEIsUUFBa0IsU0FBUyxFQUMzQixjQUFvQyxTQUFTLEVBQzdDLE1BQVUsU0FBUyxFQUNuQixhQUFxQixTQUFTLEVBQzlCLE9BQWUsU0FBUyxFQUN4QixPQUFXLElBQUEseUJBQU8sR0FBRSxFQUNwQix3QkFBNEMsRUFBRSxFQUNsQyxFQUFFO1lBQ2QsTUFBTSxJQUFJLEdBQU8sSUFBSSxlQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDMUIsSUFBSSxHQUFHLEdBQXdCLEVBQUUsQ0FBQTtZQUNqQyxJQUFJLElBQUksR0FBeUIsRUFBRSxDQUFBO1lBRW5DLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLEVBQUU7Z0JBQ25DLE1BQU0sR0FBRyxHQUEyQixJQUFJLHNCQUFzQixDQUM1RCxhQUFhLEVBQ2IsYUFBYSxFQUNiLGVBQWUsQ0FDaEIsQ0FBQTtnQkFDRCxHQUFHLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUE7Z0JBQ3pDLE1BQU0sZUFBZSxHQUFVLElBQUksQ0FBQyxtQkFBbUIsQ0FDckQsR0FBRyxFQUNILElBQUksRUFDSixTQUFTLEVBQ1QsU0FBUyxDQUNWLENBQUE7Z0JBQ0QsSUFBSSxPQUFPLGVBQWUsS0FBSyxXQUFXLEVBQUU7b0JBQzFDLEdBQUcsR0FBRyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUE7b0JBQ3JCLElBQUksR0FBRyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUE7aUJBQzNCO3FCQUFNO29CQUNMLE1BQU0sZUFBZSxDQUFBO2lCQUN0QjthQUNGO1lBRUQsTUFBTSxhQUFhLEdBQWtCLElBQUksZ0JBQWEsQ0FDcEQsU0FBUyxFQUNULFlBQVksRUFDWixJQUFJLEVBQ0osR0FBRyxFQUNILElBQUksRUFDSixRQUFRLEVBQ1IsU0FBUyxFQUNULElBQUksRUFDSixLQUFLLEVBQ0wsV0FBVyxDQUNaLENBQUE7WUFDRCxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxvQkFBc0MsRUFBRSxFQUFFO2dCQUN2RSxhQUFhLENBQUMsZUFBZSxDQUMzQixvQkFBb0IsQ0FBQyxDQUFDLENBQUMsRUFDdkIsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQ3hCLENBQUE7WUFDSCxDQUFDLENBQUMsQ0FBQTtZQUNGLE9BQU8sSUFBSSxlQUFVLENBQUMsYUFBYSxDQUFDLENBQUE7UUFDdEMsQ0FBQyxDQUFBO0lBQ0gsQ0FBQztJQXRxQ0Msd0JBQXdCO0lBRXhCLFdBQVcsQ0FBQyxNQUFjLEVBQUUsV0FBK0IsS0FBSztRQUM5RCxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQTtRQUNuQyxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUE7UUFDZCxLQUFLLElBQUksTUFBTSxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUNsQyxJQUFJLGFBQWEsR0FBVyxhQUFhLENBQUMsT0FBTyxDQUMvQyxNQUFNLEVBQ04sUUFBUSxFQUNSLFFBQVEsRUFDUixRQUFRLENBQ1QsQ0FBQTtZQUNELEtBQUssQ0FBQyxHQUFHLGFBQWEsRUFBRSxDQUFDLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQTtZQUN0QyxLQUFLLENBQUMsR0FBRyxhQUFhLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FDbkMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFDNUIsUUFBUSxDQUNULENBQUE7U0FDRjtRQUNELElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQTtRQUNyQixLQUFLLElBQUksT0FBTyxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsRUFBRTtZQUMxQyxJQUFJLGNBQWMsR0FBVyxhQUFhLENBQUMsT0FBTyxDQUNoRCxPQUFPLEVBQ1AsUUFBUSxFQUNSLE1BQU0sRUFDTixLQUFLLENBQ04sQ0FBQTtZQUNELElBQUksV0FBVyxHQUFHLEVBQUUsQ0FBQTtZQUNwQixLQUFLLElBQUksTUFBTSxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLE9BQU8sRUFBRSxDQUFDLEVBQUU7Z0JBQ3ZELElBQUksYUFBYSxHQUFXLGFBQWEsQ0FBQyxPQUFPLENBQy9DLE1BQU0sRUFDTixRQUFRLEVBQ1IsUUFBUSxFQUNSLFFBQVEsQ0FDVCxDQUFBO2dCQUNELFdBQVcsQ0FBQyxHQUFHLGFBQWEsRUFBRSxDQUFDLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FDckQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxFQUFFLENBQUMsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQ2pELFFBQVEsRUFDUixlQUFlLEVBQ2YsSUFBSSxDQUNMLENBQUE7YUFDRjtZQUNELFlBQVksQ0FBQyxHQUFHLGNBQWMsRUFBRSxDQUFDLEdBQUcsV0FBVyxDQUFBO1NBQ2hEO1FBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7UUFDbEIsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUE7SUFDbEMsQ0FBQztJQUVELFNBQVMsQ0FBQyxJQUFtQjtRQUMzQixNQUFNLE9BQU8sR0FBUyxJQUFJLElBQUksRUFBRSxDQUFBO1FBQ2hDLGVBQWU7UUFDZixJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtZQUM1QixPQUFPLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtTQUM5QzthQUFNLElBQUksSUFBSSxZQUFZLG9CQUFZLEVBQUU7WUFDdkMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQSxDQUFDLGdCQUFnQjtTQUNyRDthQUFNO1lBQ0wsMEJBQTBCO1lBQzFCLE1BQU0sSUFBSSxrQkFBUyxDQUNqQixnRUFBZ0UsQ0FDakUsQ0FBQTtTQUNGO1FBQ0QsT0FBTyxPQUFPLENBQUE7SUFDaEIsQ0FBQztJQUVELE1BQU0sQ0FBQyxHQUFHLElBQVc7UUFDbkIsT0FBTyxJQUFJLE9BQU8sRUFBVSxDQUFBO0lBQzlCLENBQUM7SUFFRCxLQUFLO1FBQ0gsTUFBTSxNQUFNLEdBQVksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFBO1FBQ3JDLE1BQU0sUUFBUSxHQUFXLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQTtRQUMzQyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ3pCLE9BQU8sTUFBYyxDQUFBO0lBQ3ZCLENBQUM7SUFFRCxTQUFTLENBQUMsR0FBTyxFQUFFLFVBQWtCO1FBQ25DLE9BQU8sQ0FDTCxPQUFPLEdBQUcsS0FBSyxXQUFXO1lBQzFCLE9BQU8sVUFBVSxLQUFLLFdBQVc7WUFDakMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLGVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQixVQUFVLFlBQVksZUFBTSxDQUM3QixDQUFBO0lBQ0gsQ0FBQztDQXFsQ0Y7QUExcUNELDBCQTBxQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktUGxhdGZvcm1WTS1VVFhPc1xuICovXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgQmluVG9vbHMgZnJvbSBcIi4uLy4uL3V0aWxzL2JpbnRvb2xzXCJcbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIlxuaW1wb3J0IHtcbiAgQW1vdW50T3V0cHV0LFxuICBTZWxlY3RPdXRwdXRDbGFzcyxcbiAgVHJhbnNmZXJhYmxlT3V0cHV0LFxuICBTRUNQT3duZXJPdXRwdXQsXG4gIFBhcnNlYWJsZU91dHB1dCxcbiAgU3Rha2VhYmxlTG9ja091dCxcbiAgU0VDUFRyYW5zZmVyT3V0cHV0XG59IGZyb20gXCIuL291dHB1dHNcIlxuaW1wb3J0IHtcbiAgQW1vdW50SW5wdXQsXG4gIFNFQ1BUcmFuc2ZlcklucHV0LFxuICBTdGFrZWFibGVMb2NrSW4sXG4gIFRyYW5zZmVyYWJsZUlucHV0LFxuICBQYXJzZWFibGVJbnB1dFxufSBmcm9tIFwiLi9pbnB1dHNcIlxuaW1wb3J0IHsgVW5peE5vdyB9IGZyb20gXCIuLi8uLi91dGlscy9oZWxwZXJmdW5jdGlvbnNcIlxuaW1wb3J0IHsgU3RhbmRhcmRVVFhPLCBTdGFuZGFyZFVUWE9TZXQgfSBmcm9tIFwiLi4vLi4vY29tbW9uL3V0eG9zXCJcbmltcG9ydCB7IFBsYXRmb3JtVk1Db25zdGFudHMgfSBmcm9tIFwiLi9jb25zdGFudHNcIlxuaW1wb3J0IHsgVW5zaWduZWRUeCB9IGZyb20gXCIuL3R4XCJcbmltcG9ydCB7IEV4cG9ydFR4IH0gZnJvbSBcIi4uL3BsYXRmb3Jtdm0vZXhwb3J0dHhcIlxuaW1wb3J0IHsgRGVmYXVsdE5ldHdvcmtJRCwgRGVmYXVsdHMgfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcbmltcG9ydCB7IEltcG9ydFR4IH0gZnJvbSBcIi4uL3BsYXRmb3Jtdm0vaW1wb3J0dHhcIlxuaW1wb3J0IHsgQmFzZVR4IH0gZnJvbSBcIi4uL3BsYXRmb3Jtdm0vYmFzZXR4XCJcbmltcG9ydCB7XG4gIFN0YW5kYXJkQXNzZXRBbW91bnREZXN0aW5hdGlvbixcbiAgQXNzZXRBbW91bnRcbn0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hc3NldGFtb3VudFwiXG5pbXBvcnQgeyBPdXRwdXQgfSBmcm9tIFwiLi4vLi4vY29tbW9uL291dHB1dFwiXG5pbXBvcnQgeyBBZGROb21pbmF0b3JUeCwgQWRkVmFsaWRhdG9yVHggfSBmcm9tIFwiLi92YWxpZGF0aW9udHhcIlxuaW1wb3J0IHsgQ3JlYXRlU3VibmV0VHggfSBmcm9tIFwiLi9jcmVhdGVzdWJuZXR0eFwiXG5pbXBvcnQgeyBTZXJpYWxpemF0aW9uLCBTZXJpYWxpemVkRW5jb2RpbmcgfSBmcm9tIFwiLi4vLi4vdXRpbHMvc2VyaWFsaXphdGlvblwiXG5pbXBvcnQge1xuICBVVFhPRXJyb3IsXG4gIEFkZHJlc3NFcnJvcixcbiAgSW5zdWZmaWNpZW50RnVuZHNFcnJvcixcbiAgVGhyZXNob2xkRXJyb3IsXG4gIEZlZUFzc2V0RXJyb3IsXG4gIFRpbWVFcnJvclxufSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcbmltcG9ydCB7IENyZWF0ZUNoYWluVHggfSBmcm9tIFwiLlwiXG5pbXBvcnQgeyBHZW5lc2lzRGF0YSB9IGZyb20gXCIuLi9hdm1cIlxuaW1wb3J0IHsgQWRkU3VibmV0VmFsaWRhdG9yVHggfSBmcm9tIFwiLi4vcGxhdGZvcm12bS9hZGRzdWJuZXR2YWxpZGF0b3J0eFwiXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXG5cbi8qKlxuICogQ2xhc3MgZm9yIHJlcHJlc2VudGluZyBhIHNpbmdsZSBVVFhPLlxuICovXG5leHBvcnQgY2xhc3MgVVRYTyBleHRlbmRzIFN0YW5kYXJkVVRYTyB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlVUWE9cIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIC8vc2VyaWFsaXplIGlzIGluaGVyaXRlZFxuXG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgdGhpcy5vdXRwdXQgPSBTZWxlY3RPdXRwdXRDbGFzcyhmaWVsZHNbXCJvdXRwdXRcIl1bXCJfdHlwZUlEXCJdKVxuICAgIHRoaXMub3V0cHV0LmRlc2VyaWFsaXplKGZpZWxkc1tcIm91dHB1dFwiXSwgZW5jb2RpbmcpXG4gIH1cblxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgdGhpcy5jb2RlY0lEID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgMilcbiAgICBvZmZzZXQgKz0gMlxuICAgIHRoaXMudHhpZCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKVxuICAgIG9mZnNldCArPSAzMlxuICAgIHRoaXMub3V0cHV0aWR4ID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICBvZmZzZXQgKz0gNFxuICAgIHRoaXMuYXNzZXRJRCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDMyKVxuICAgIG9mZnNldCArPSAzMlxuICAgIGNvbnN0IG91dHB1dGlkOiBudW1iZXIgPSBiaW50b29sc1xuICAgICAgLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgICAucmVhZFVJbnQzMkJFKDApXG4gICAgb2Zmc2V0ICs9IDRcbiAgICB0aGlzLm91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKG91dHB1dGlkKVxuICAgIHJldHVybiB0aGlzLm91dHB1dC5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gIH1cblxuICAvKipcbiAgICogVGFrZXMgYSBiYXNlLTU4IHN0cmluZyBjb250YWluaW5nIGEgW1tVVFhPXV0sIHBhcnNlcyBpdCwgcG9wdWxhdGVzIHRoZSBjbGFzcywgYW5kIHJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgU3RhbmRhcmRVVFhPIGluIGJ5dGVzLlxuICAgKlxuICAgKiBAcGFyYW0gc2VyaWFsaXplZCBBIGJhc2UtNTggc3RyaW5nIGNvbnRhaW5pbmcgYSByYXcgW1tVVFhPXV1cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgcmF3IFtbVVRYT11dXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIHVubGlrZSBtb3N0IGZyb21TdHJpbmdzLCBpdCBleHBlY3RzIHRoZSBzdHJpbmcgdG8gYmUgc2VyaWFsaXplZCBpbiBjYjU4IGZvcm1hdFxuICAgKi9cbiAgZnJvbVN0cmluZyhzZXJpYWxpemVkOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgcmV0dXJuIHRoaXMuZnJvbUJ1ZmZlcihiaW50b29scy5jYjU4RGVjb2RlKHNlcmlhbGl6ZWQpKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBiYXNlLTU4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW1VUWE9dXS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogdW5saWtlIG1vc3QgdG9TdHJpbmdzLCB0aGlzIHJldHVybnMgaW4gY2I1OCBzZXJpYWxpemF0aW9uIGZvcm1hdFxuICAgKi9cbiAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIHJldHVybiBiaW50b29scy5jYjU4RW5jb2RlKHRoaXMudG9CdWZmZXIoKSlcbiAgfVxuXG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGNvbnN0IHV0eG86IFVUWE8gPSBuZXcgVVRYTygpXG4gICAgdXR4by5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcbiAgICByZXR1cm4gdXR4byBhcyB0aGlzXG4gIH1cblxuICBjcmVhdGUoXG4gICAgY29kZWNJRDogbnVtYmVyID0gUGxhdGZvcm1WTUNvbnN0YW50cy5MQVRFU1RDT0RFQyxcbiAgICB0eGlkOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgb3V0cHV0aWR4OiBCdWZmZXIgfCBudW1iZXIgPSB1bmRlZmluZWQsXG4gICAgYXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG91dHB1dDogT3V0cHV0ID0gdW5kZWZpbmVkXG4gICk6IHRoaXMge1xuICAgIHJldHVybiBuZXcgVVRYTyhjb2RlY0lELCB0eGlkLCBvdXRwdXRpZHgsIGFzc2V0SUQsIG91dHB1dCkgYXMgdGhpc1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBc3NldEFtb3VudERlc3RpbmF0aW9uIGV4dGVuZHMgU3RhbmRhcmRBc3NldEFtb3VudERlc3RpbmF0aW9uPFxuICBUcmFuc2ZlcmFibGVPdXRwdXQsXG4gIFRyYW5zZmVyYWJsZUlucHV0XG4+IHt9XG5cbi8qKlxuICogQ2xhc3MgcmVwcmVzZW50aW5nIGEgc2V0IG9mIFtbVVRYT11dcy5cbiAqL1xuZXhwb3J0IGNsYXNzIFVUWE9TZXQgZXh0ZW5kcyBTdGFuZGFyZFVUWE9TZXQ8VVRYTz4ge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJVVFhPU2V0XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICAvL3NlcmlhbGl6ZSBpcyBpbmhlcml0ZWRcblxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIGxldCB1dHhvcyA9IHt9XG4gICAgZm9yIChsZXQgdXR4b2lkIGluIGZpZWxkc1tcInV0eG9zXCJdKSB7XG4gICAgICBsZXQgdXR4b2lkQ2xlYW5lZDogc3RyaW5nID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgICB1dHhvaWQsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBcImJhc2U1OFwiLFxuICAgICAgICBcImJhc2U1OFwiXG4gICAgICApXG4gICAgICB1dHhvc1tgJHt1dHhvaWRDbGVhbmVkfWBdID0gbmV3IFVUWE8oKVxuICAgICAgdXR4b3NbYCR7dXR4b2lkQ2xlYW5lZH1gXS5kZXNlcmlhbGl6ZShcbiAgICAgICAgZmllbGRzW1widXR4b3NcIl1bYCR7dXR4b2lkfWBdLFxuICAgICAgICBlbmNvZGluZ1xuICAgICAgKVxuICAgIH1cbiAgICBsZXQgYWRkcmVzc1VUWE9zID0ge31cbiAgICBmb3IgKGxldCBhZGRyZXNzIGluIGZpZWxkc1tcImFkZHJlc3NVVFhPc1wiXSkge1xuICAgICAgbGV0IGFkZHJlc3NDbGVhbmVkOiBzdHJpbmcgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICAgIGFkZHJlc3MsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBcImNiNThcIixcbiAgICAgICAgXCJoZXhcIlxuICAgICAgKVxuICAgICAgbGV0IHV0eG9iYWxhbmNlID0ge31cbiAgICAgIGZvciAobGV0IHV0eG9pZCBpbiBmaWVsZHNbXCJhZGRyZXNzVVRYT3NcIl1bYCR7YWRkcmVzc31gXSkge1xuICAgICAgICBsZXQgdXR4b2lkQ2xlYW5lZDogc3RyaW5nID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgICAgIHV0eG9pZCxcbiAgICAgICAgICBlbmNvZGluZyxcbiAgICAgICAgICBcImJhc2U1OFwiLFxuICAgICAgICAgIFwiYmFzZTU4XCJcbiAgICAgICAgKVxuICAgICAgICB1dHhvYmFsYW5jZVtgJHt1dHhvaWRDbGVhbmVkfWBdID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgICAgIGZpZWxkc1tcImFkZHJlc3NVVFhPc1wiXVtgJHthZGRyZXNzfWBdW2Ake3V0eG9pZH1gXSxcbiAgICAgICAgICBlbmNvZGluZyxcbiAgICAgICAgICBcImRlY2ltYWxTdHJpbmdcIixcbiAgICAgICAgICBcIkJOXCJcbiAgICAgICAgKVxuICAgICAgfVxuICAgICAgYWRkcmVzc1VUWE9zW2Ake2FkZHJlc3NDbGVhbmVkfWBdID0gdXR4b2JhbGFuY2VcbiAgICB9XG4gICAgdGhpcy51dHhvcyA9IHV0eG9zXG4gICAgdGhpcy5hZGRyZXNzVVRYT3MgPSBhZGRyZXNzVVRYT3NcbiAgfVxuXG4gIHBhcnNlVVRYTyh1dHhvOiBVVFhPIHwgc3RyaW5nKTogVVRYTyB7XG4gICAgY29uc3QgdXR4b3ZhcjogVVRYTyA9IG5ldyBVVFhPKClcbiAgICAvLyBmb3JjZSBhIGNvcHlcbiAgICBpZiAodHlwZW9mIHV0eG8gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHV0eG92YXIuZnJvbUJ1ZmZlcihiaW50b29scy5jYjU4RGVjb2RlKHV0eG8pKVxuICAgIH0gZWxzZSBpZiAodXR4byBpbnN0YW5jZW9mIFN0YW5kYXJkVVRYTykge1xuICAgICAgdXR4b3Zhci5mcm9tQnVmZmVyKHV0eG8udG9CdWZmZXIoKSkgLy8gZm9yY2VzIGEgY29weVxuICAgIH0gZWxzZSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgdGhyb3cgbmV3IFVUWE9FcnJvcihcbiAgICAgICAgXCJFcnJvciAtIFVUWE8ucGFyc2VVVFhPOiB1dHhvIHBhcmFtZXRlciBpcyBub3QgYSBVVFhPIG9yIHN0cmluZ1wiXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiB1dHhvdmFyXG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IFVUWE9TZXQoKSBhcyB0aGlzXG4gIH1cblxuICBjbG9uZSgpOiB0aGlzIHtcbiAgICBjb25zdCBuZXdzZXQ6IFVUWE9TZXQgPSB0aGlzLmNyZWF0ZSgpXG4gICAgY29uc3QgYWxsVVRYT3M6IFVUWE9bXSA9IHRoaXMuZ2V0QWxsVVRYT3MoKVxuICAgIG5ld3NldC5hZGRBcnJheShhbGxVVFhPcylcbiAgICByZXR1cm4gbmV3c2V0IGFzIHRoaXNcbiAgfVxuXG4gIF9mZWVDaGVjayhmZWU6IEJOLCBmZWVBc3NldElEOiBCdWZmZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gKFxuICAgICAgdHlwZW9mIGZlZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgdHlwZW9mIGZlZUFzc2V0SUQgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgIGZlZS5ndChuZXcgQk4oMCkpICYmXG4gICAgICBmZWVBc3NldElEIGluc3RhbmNlb2YgQnVmZmVyXG4gICAgKVxuICB9XG5cbiAgZ2V0Q29uc3VtYWJsZVVYVE8gPSAoXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICAgc3Rha2VhYmxlOiBib29sZWFuID0gZmFsc2VcbiAgKTogVVRYT1tdID0+IHtcbiAgICByZXR1cm4gdGhpcy5nZXRBbGxVVFhPcygpLmZpbHRlcigodXR4bzogVVRYTykgPT4ge1xuICAgICAgaWYgKHN0YWtlYWJsZSkge1xuICAgICAgICAvLyBzdGFrZWFibGUgdHJhbnNhY3Rpb25zIGNhbiBjb25zdW1lIGFueSBVVFhPLlxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgICAgY29uc3Qgb3V0cHV0OiBPdXRwdXQgPSB1dHhvLmdldE91dHB1dCgpXG4gICAgICBpZiAoIShvdXRwdXQgaW5zdGFuY2VvZiBTdGFrZWFibGVMb2NrT3V0KSkge1xuICAgICAgICAvLyBub24tc3Rha2VhYmxlIHRyYW5zYWN0aW9ucyBjYW4gY29uc3VtZSBhbnkgVVRYTyB0aGF0IGlzbid0IGxvY2tlZC5cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICAgIGNvbnN0IHN0YWtlYWJsZU91dHB1dDogU3Rha2VhYmxlTG9ja091dCA9IG91dHB1dCBhcyBTdGFrZWFibGVMb2NrT3V0XG4gICAgICBpZiAoc3Rha2VhYmxlT3V0cHV0LmdldFN0YWtlYWJsZUxvY2t0aW1lKCkubHQoYXNPZikpIHtcbiAgICAgICAgLy8gSWYgdGhlIHN0YWtlYWJsZSBvdXRwdXRzIGxvY2t0aW1lIGhhcyBlbmRlZCwgdGhlbiB0aGlzIFVUWE8gY2FuIHN0aWxsXG4gICAgICAgIC8vIGJlIGNvbnN1bWVkIGJ5IGEgbm9uLXN0YWtlYWJsZSB0cmFuc2FjdGlvbi5cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICAgIC8vIFRoaXMgb3V0cHV0IGlzIGxvY2tlZCBhbmQgY2FuJ3QgYmUgY29uc3VtZWQgYnkgYSBub24tc3Rha2VhYmxlXG4gICAgICAvLyB0cmFuc2FjdGlvbi5cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH0pXG4gIH1cblxuICBnZXRNaW5pbXVtU3BlbmRhYmxlID0gKFxuICAgIGFhZDogQXNzZXRBbW91bnREZXN0aW5hdGlvbixcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKSxcbiAgICBsb2NrdGltZTogQk4gPSBuZXcgQk4oMCksXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSAxLFxuICAgIHN0YWtlYWJsZTogYm9vbGVhbiA9IGZhbHNlXG4gICk6IEVycm9yID0+IHtcbiAgICBsZXQgdXR4b0FycmF5OiBVVFhPW10gPSB0aGlzLmdldENvbnN1bWFibGVVWFRPKGFzT2YsIHN0YWtlYWJsZSlcbiAgICBsZXQgdG1wVVRYT0FycmF5OiBVVFhPW10gPSBbXVxuICAgIGlmIChzdGFrZWFibGUpIHtcbiAgICAgIC8vIElmIHRoaXMgaXMgYSBzdGFrZWFibGUgdHJhbnNhY3Rpb24gdGhlbiBoYXZlIFN0YWtlYWJsZUxvY2tPdXQgY29tZSBiZWZvcmUgU0VDUFRyYW5zZmVyT3V0cHV0XG4gICAgICAvLyBzbyB0aGF0IHVzZXJzIGZpcnN0IHN0YWtlIGxvY2tlZCB0b2tlbnMgYmVmb3JlIHN0YWtpbmcgdW5sb2NrZWQgdG9rZW5zXG4gICAgICB1dHhvQXJyYXkuZm9yRWFjaCgodXR4bzogVVRYTykgPT4ge1xuICAgICAgICAvLyBTdGFrZWFibGVMb2NrT3V0c1xuICAgICAgICBpZiAodXR4by5nZXRPdXRwdXQoKS5nZXRUeXBlSUQoKSA9PT0gMjIpIHtcbiAgICAgICAgICB0bXBVVFhPQXJyYXkucHVzaCh1dHhvKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICAvLyBTb3J0IHRoZSBTdGFrZWFibGVMb2NrT3V0cyBieSBTdGFrZWFibGVMb2NrdGltZSBzbyB0aGF0IHRoZSBncmVhdGVzdCBTdGFrZWFibGVMb2NrdGltZSBhcmUgc3BlbnQgZmlyc3RcbiAgICAgIHRtcFVUWE9BcnJheS5zb3J0KChhOiBVVFhPLCBiOiBVVFhPKSA9PiB7XG4gICAgICAgIGxldCBzdGFrZWFibGVMb2NrT3V0MSA9IGEuZ2V0T3V0cHV0KCkgYXMgU3Rha2VhYmxlTG9ja091dFxuICAgICAgICBsZXQgc3Rha2VhYmxlTG9ja091dDIgPSBiLmdldE91dHB1dCgpIGFzIFN0YWtlYWJsZUxvY2tPdXRcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICBzdGFrZWFibGVMb2NrT3V0Mi5nZXRTdGFrZWFibGVMb2NrdGltZSgpLnRvTnVtYmVyKCkgLVxuICAgICAgICAgIHN0YWtlYWJsZUxvY2tPdXQxLmdldFN0YWtlYWJsZUxvY2t0aW1lKCkudG9OdW1iZXIoKVxuICAgICAgICApXG4gICAgICB9KVxuXG4gICAgICB1dHhvQXJyYXkuZm9yRWFjaCgodXR4bzogVVRYTykgPT4ge1xuICAgICAgICAvLyBTRUNQVHJhbnNmZXJPdXRwdXRzXG4gICAgICAgIGlmICh1dHhvLmdldE91dHB1dCgpLmdldFR5cGVJRCgpID09PSA3KSB7XG4gICAgICAgICAgdG1wVVRYT0FycmF5LnB1c2godXR4bylcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIHV0eG9BcnJheSA9IHRtcFVUWE9BcnJheVxuICAgIH1cblxuICAgIC8vIG91dHMgaXMgYSBtYXAgZnJvbSBhc3NldElEIHRvIGEgdHVwbGUgb2YgKGxvY2tlZFN0YWtlYWJsZSwgdW5sb2NrZWQpXG4gICAgLy8gd2hpY2ggYXJlIGFycmF5cyBvZiBvdXRwdXRzLlxuICAgIGNvbnN0IG91dHM6IG9iamVjdCA9IHt9XG5cbiAgICAvLyBXZSBvbmx5IG5lZWQgdG8gaXRlcmF0ZSBvdmVyIFVUWE9zIHVudGlsIHdlIGhhdmUgc3BlbnQgc3VmZmljaWVudCBmdW5kc1xuICAgIC8vIHRvIG1ldCB0aGUgcmVxdWVzdGVkIGFtb3VudHMuXG4gICAgdXR4b0FycmF5LmZvckVhY2goKHV0eG86IFVUWE8sIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgIGNvbnN0IGFzc2V0SUQ6IEJ1ZmZlciA9IHV0eG8uZ2V0QXNzZXRJRCgpXG4gICAgICBjb25zdCBhc3NldEtleTogc3RyaW5nID0gYXNzZXRJRC50b1N0cmluZyhcImhleFwiKVxuICAgICAgY29uc3QgZnJvbUFkZHJlc3NlczogQnVmZmVyW10gPSBhYWQuZ2V0U2VuZGVycygpXG4gICAgICBjb25zdCBvdXRwdXQ6IE91dHB1dCA9IHV0eG8uZ2V0T3V0cHV0KClcbiAgICAgIGlmIChcbiAgICAgICAgIShvdXRwdXQgaW5zdGFuY2VvZiBBbW91bnRPdXRwdXQpIHx8XG4gICAgICAgICFhYWQuYXNzZXRFeGlzdHMoYXNzZXRLZXkpIHx8XG4gICAgICAgICFvdXRwdXQubWVldHNUaHJlc2hvbGQoZnJvbUFkZHJlc3NlcywgYXNPZilcbiAgICAgICkge1xuICAgICAgICAvLyBXZSBzaG91bGQgb25seSB0cnkgdG8gc3BlbmQgZnVuZ2libGUgYXNzZXRzLlxuICAgICAgICAvLyBXZSBzaG91bGQgb25seSBzcGVuZCB7eyBhc3NldEtleSB9fS5cbiAgICAgICAgLy8gV2UgbmVlZCB0byBiZSBhYmxlIHRvIHNwZW5kIHRoZSBvdXRwdXQuXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBjb25zdCBhc3NldEFtb3VudDogQXNzZXRBbW91bnQgPSBhYWQuZ2V0QXNzZXRBbW91bnQoYXNzZXRLZXkpXG4gICAgICBpZiAoYXNzZXRBbW91bnQuaXNGaW5pc2hlZCgpKSB7XG4gICAgICAgIC8vIFdlJ3ZlIGFscmVhZHkgc3BlbnQgdGhlIG5lZWRlZCBVVFhPcyBmb3IgdGhpcyBhc3NldElELlxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgaWYgKCEoYXNzZXRLZXkgaW4gb3V0cykpIHtcbiAgICAgICAgLy8gSWYgdGhpcyBpcyB0aGUgZmlyc3QgdGltZSBzcGVuZGluZyB0aGlzIGFzc2V0SUQsIHdlIG5lZWQgdG9cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSB0aGUgb3V0cyBvYmplY3QgY29ycmVjdGx5LlxuICAgICAgICBvdXRzW2Ake2Fzc2V0S2V5fWBdID0ge1xuICAgICAgICAgIGxvY2tlZFN0YWtlYWJsZTogW10sXG4gICAgICAgICAgdW5sb2NrZWQ6IFtdXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgYW1vdW50T3V0cHV0OiBBbW91bnRPdXRwdXQgPSBvdXRwdXQgYXMgQW1vdW50T3V0cHV0XG4gICAgICAvLyBhbW91bnQgaXMgdGhlIGFtb3VudCBvZiBmdW5kcyBhdmFpbGFibGUgZnJvbSB0aGlzIFVUWE8uXG4gICAgICBjb25zdCBhbW91bnQgPSBhbW91bnRPdXRwdXQuZ2V0QW1vdW50KClcblxuICAgICAgLy8gU2V0IHVwIHRoZSBTRUNQIGlucHV0IHdpdGggdGhlIHNhbWUgYW1vdW50IGFzIHRoZSBvdXRwdXQuXG4gICAgICBsZXQgaW5wdXQ6IEFtb3VudElucHV0ID0gbmV3IFNFQ1BUcmFuc2ZlcklucHV0KGFtb3VudClcblxuICAgICAgbGV0IGxvY2tlZDogYm9vbGVhbiA9IGZhbHNlXG4gICAgICBpZiAoYW1vdW50T3V0cHV0IGluc3RhbmNlb2YgU3Rha2VhYmxlTG9ja091dCkge1xuICAgICAgICBjb25zdCBzdGFrZWFibGVPdXRwdXQ6IFN0YWtlYWJsZUxvY2tPdXQgPVxuICAgICAgICAgIGFtb3VudE91dHB1dCBhcyBTdGFrZWFibGVMb2NrT3V0XG4gICAgICAgIGNvbnN0IHN0YWtlYWJsZUxvY2t0aW1lOiBCTiA9IHN0YWtlYWJsZU91dHB1dC5nZXRTdGFrZWFibGVMb2NrdGltZSgpXG5cbiAgICAgICAgaWYgKHN0YWtlYWJsZUxvY2t0aW1lLmd0KGFzT2YpKSB7XG4gICAgICAgICAgLy8gQWRkIGEgbmV3IGlucHV0IGFuZCBtYXJrIGl0IGFzIGJlaW5nIGxvY2tlZC5cbiAgICAgICAgICBpbnB1dCA9IG5ldyBTdGFrZWFibGVMb2NrSW4oXG4gICAgICAgICAgICBhbW91bnQsXG4gICAgICAgICAgICBzdGFrZWFibGVMb2NrdGltZSxcbiAgICAgICAgICAgIG5ldyBQYXJzZWFibGVJbnB1dChpbnB1dClcbiAgICAgICAgICApXG5cbiAgICAgICAgICAvLyBNYXJrIHRoaXMgVVRYTyBhcyBoYXZpbmcgYmVlbiByZS1sb2NrZWQuXG4gICAgICAgICAgbG9ja2VkID0gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGFzc2V0QW1vdW50LnNwZW5kQW1vdW50KGFtb3VudCwgbG9ja2VkKVxuICAgICAgaWYgKGxvY2tlZCkge1xuICAgICAgICAvLyBUcmFjayB0aGUgVVRYTyBhcyBsb2NrZWQuXG4gICAgICAgIG91dHNbYCR7YXNzZXRLZXl9YF0ubG9ja2VkU3Rha2VhYmxlLnB1c2goYW1vdW50T3V0cHV0KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVHJhY2sgdGhlIFVUWE8gYXMgdW5sb2NrZWQuXG4gICAgICAgIG91dHNbYCR7YXNzZXRLZXl9YF0udW5sb2NrZWQucHVzaChhbW91bnRPdXRwdXQpXG4gICAgICB9XG5cbiAgICAgIC8vIEdldCB0aGUgaW5kaWNlcyBvZiB0aGUgb3V0cHV0cyB0aGF0IHNob3VsZCBiZSB1c2VkIHRvIGF1dGhvcml6ZSB0aGVcbiAgICAgIC8vIHNwZW5kaW5nIG9mIHRoaXMgaW5wdXQuXG5cbiAgICAgIC8vIFRPRE86IGdldFNwZW5kZXJzIHNob3VsZCByZXR1cm4gYW4gYXJyYXkgb2YgaW5kaWNlcyByYXRoZXIgdGhhbiBhblxuICAgICAgLy8gYXJyYXkgb2YgYWRkcmVzc2VzLlxuICAgICAgY29uc3Qgc3BlbmRlcnM6IEJ1ZmZlcltdID0gYW1vdW50T3V0cHV0LmdldFNwZW5kZXJzKGZyb21BZGRyZXNzZXMsIGFzT2YpXG4gICAgICBzcGVuZGVycy5mb3JFYWNoKChzcGVuZGVyOiBCdWZmZXIpID0+IHtcbiAgICAgICAgY29uc3QgaWR4OiBudW1iZXIgPSBhbW91bnRPdXRwdXQuZ2V0QWRkcmVzc0lkeChzcGVuZGVyKVxuICAgICAgICBpZiAoaWR4ID09PSAtMSkge1xuICAgICAgICAgIC8vIFRoaXMgc2hvdWxkIG5ldmVyIGhhcHBlbiwgd2hpY2ggaXMgd2h5IHRoZSBlcnJvciBpcyB0aHJvd24gcmF0aGVyXG4gICAgICAgICAgLy8gdGhhbiBiZWluZyByZXR1cm5lZC4gSWYgdGhpcyB3ZXJlIHRvIGV2ZXIgaGFwcGVuIHRoaXMgd291bGQgYmUgYW5cbiAgICAgICAgICAvLyBlcnJvciBpbiB0aGUgaW50ZXJuYWwgbG9naWMgcmF0aGVyIGhhdmluZyBjYWxsZWQgdGhpcyBmdW5jdGlvbiB3aXRoXG4gICAgICAgICAgLy8gaW52YWxpZCBhcmd1bWVudHMuXG5cbiAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgICAgICAgIHRocm93IG5ldyBBZGRyZXNzRXJyb3IoXG4gICAgICAgICAgICBcIkVycm9yIC0gVVRYT1NldC5nZXRNaW5pbXVtU3BlbmRhYmxlOiBubyBzdWNoIFwiICtcbiAgICAgICAgICAgICAgYGFkZHJlc3MgaW4gb3V0cHV0OiAke3NwZW5kZXJ9YFxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgICBpbnB1dC5hZGRTaWduYXR1cmVJZHgoaWR4LCBzcGVuZGVyKVxuICAgICAgfSlcblxuICAgICAgY29uc3QgdHhJRDogQnVmZmVyID0gdXR4by5nZXRUeElEKClcbiAgICAgIGNvbnN0IG91dHB1dElkeDogQnVmZmVyID0gdXR4by5nZXRPdXRwdXRJZHgoKVxuICAgICAgY29uc3QgdHJhbnNmZXJJbnB1dDogVHJhbnNmZXJhYmxlSW5wdXQgPSBuZXcgVHJhbnNmZXJhYmxlSW5wdXQoXG4gICAgICAgIHR4SUQsXG4gICAgICAgIG91dHB1dElkeCxcbiAgICAgICAgYXNzZXRJRCxcbiAgICAgICAgaW5wdXRcbiAgICAgIClcbiAgICAgIGFhZC5hZGRJbnB1dCh0cmFuc2ZlcklucHV0KVxuICAgIH0pXG5cbiAgICBpZiAoIWFhZC5jYW5Db21wbGV0ZSgpKSB7XG4gICAgICAvLyBBZnRlciBydW5uaW5nIHRocm91Z2ggYWxsIHRoZSBVVFhPcywgd2Ugc3RpbGwgd2VyZW4ndCBhYmxlIHRvIGdldCBhbGxcbiAgICAgIC8vIHRoZSBuZWNlc3NhcnkgZnVuZHMsIHNvIHRoaXMgdHJhbnNhY3Rpb24gY2FuJ3QgYmUgbWFkZS5cbiAgICAgIHJldHVybiBuZXcgSW5zdWZmaWNpZW50RnVuZHNFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIFVUWE9TZXQuZ2V0TWluaW11bVNwZW5kYWJsZTogaW5zdWZmaWNpZW50IFwiICtcbiAgICAgICAgICBcImZ1bmRzIHRvIGNyZWF0ZSB0aGUgdHJhbnNhY3Rpb25cIlxuICAgICAgKVxuICAgIH1cblxuICAgIC8vIFRPRE86IFdlIHNob3VsZCBzZXBhcmF0ZSB0aGUgYWJvdmUgZnVuY3Rpb25hbGl0eSBpbnRvIGEgc2luZ2xlIGZ1bmN0aW9uXG4gICAgLy8gdGhhdCBqdXN0IHNlbGVjdHMgdGhlIFVUWE9zIHRvIGNvbnN1bWUuXG5cbiAgICBjb25zdCB6ZXJvOiBCTiA9IG5ldyBCTigwKVxuXG4gICAgLy8gYXNzZXRBbW91bnRzIGlzIGFuIGFycmF5IG9mIGFzc2V0IGRlc2NyaXB0aW9ucyBhbmQgaG93IG11Y2ggaXMgbGVmdCB0b1xuICAgIC8vIHNwZW5kIGZvciB0aGVtLlxuICAgIGNvbnN0IGFzc2V0QW1vdW50czogQXNzZXRBbW91bnRbXSA9IGFhZC5nZXRBbW91bnRzKClcbiAgICBhc3NldEFtb3VudHMuZm9yRWFjaCgoYXNzZXRBbW91bnQ6IEFzc2V0QW1vdW50KSA9PiB7XG4gICAgICAvLyBjaGFuZ2UgaXMgdGhlIGFtb3VudCB0aGF0IHNob3VsZCBiZSByZXR1cm5lZCBiYWNrIHRvIHRoZSBzb3VyY2Ugb2YgdGhlXG4gICAgICAvLyBmdW5kcy5cbiAgICAgIGNvbnN0IGNoYW5nZTogQk4gPSBhc3NldEFtb3VudC5nZXRDaGFuZ2UoKVxuICAgICAgLy8gaXNTdGFrZWFibGVMb2NrQ2hhbmdlIGlzIGlmIHRoZSBjaGFuZ2UgaXMgbG9ja2VkIG9yIG5vdC5cbiAgICAgIGNvbnN0IGlzU3Rha2VhYmxlTG9ja0NoYW5nZTogYm9vbGVhbiA9XG4gICAgICAgIGFzc2V0QW1vdW50LmdldFN0YWtlYWJsZUxvY2tDaGFuZ2UoKVxuICAgICAgLy8gbG9ja2VkQ2hhbmdlIGlzIHRoZSBhbW91bnQgb2YgbG9ja2VkIGNoYW5nZSB0aGF0IHNob3VsZCBiZSByZXR1cm5lZCB0b1xuICAgICAgLy8gdGhlIHNlbmRlclxuICAgICAgY29uc3QgbG9ja2VkQ2hhbmdlOiBCTiA9IGlzU3Rha2VhYmxlTG9ja0NoYW5nZSA/IGNoYW5nZSA6IHplcm8uY2xvbmUoKVxuXG4gICAgICBjb25zdCBhc3NldElEOiBCdWZmZXIgPSBhc3NldEFtb3VudC5nZXRBc3NldElEKClcbiAgICAgIGNvbnN0IGFzc2V0S2V5OiBzdHJpbmcgPSBhc3NldEFtb3VudC5nZXRBc3NldElEU3RyaW5nKClcbiAgICAgIGNvbnN0IGxvY2tlZE91dHB1dHM6IFN0YWtlYWJsZUxvY2tPdXRbXSA9XG4gICAgICAgIG91dHNbYCR7YXNzZXRLZXl9YF0ubG9ja2VkU3Rha2VhYmxlXG4gICAgICBsb2NrZWRPdXRwdXRzLmZvckVhY2goKGxvY2tlZE91dHB1dDogU3Rha2VhYmxlTG9ja091dCwgaTogbnVtYmVyKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YWtlYWJsZUxvY2t0aW1lOiBCTiA9IGxvY2tlZE91dHB1dC5nZXRTdGFrZWFibGVMb2NrdGltZSgpXG4gICAgICAgIGNvbnN0IHBhcnNlYWJsZU91dHB1dDogUGFyc2VhYmxlT3V0cHV0ID1cbiAgICAgICAgICBsb2NrZWRPdXRwdXQuZ2V0VHJhbnNmZXJhYmxlT3V0cHV0KClcblxuICAgICAgICAvLyBXZSBrbm93IHRoYXQgcGFyc2VhYmxlT3V0cHV0IGNvbnRhaW5zIGFuIEFtb3VudE91dHB1dCBiZWNhdXNlIHRoZVxuICAgICAgICAvLyBmaXJzdCBsb29wIGZpbHRlcnMgZm9yIGZ1bmdpYmxlIGFzc2V0cy5cbiAgICAgICAgY29uc3Qgb3V0cHV0OiBBbW91bnRPdXRwdXQgPSBwYXJzZWFibGVPdXRwdXQuZ2V0T3V0cHV0KCkgYXMgQW1vdW50T3V0cHV0XG5cbiAgICAgICAgbGV0IG91dHB1dEFtb3VudFJlbWFpbmluZzogQk4gPSBvdXRwdXQuZ2V0QW1vdW50KClcbiAgICAgICAgLy8gVGhlIG9ubHkgb3V0cHV0IHRoYXQgY291bGQgZ2VuZXJhdGUgY2hhbmdlIGlzIHRoZSBsYXN0IG91dHB1dC5cbiAgICAgICAgLy8gT3RoZXJ3aXNlLCBhbnkgZnVydGhlciBVVFhPcyB3b3VsZG4ndCBoYXZlIG5lZWRlZCB0byBiZSBzcGVudC5cbiAgICAgICAgaWYgKGkgPT0gbG9ja2VkT3V0cHV0cy5sZW5ndGggLSAxICYmIGxvY2tlZENoYW5nZS5ndCh6ZXJvKSkge1xuICAgICAgICAgIC8vIHVwZGF0ZSBvdXRwdXRBbW91bnRSZW1haW5pbmcgdG8gbm8gbG9uZ2VyIGhvbGQgdGhlIGNoYW5nZSB0aGF0IHdlXG4gICAgICAgICAgLy8gYXJlIHJldHVybmluZy5cbiAgICAgICAgICBvdXRwdXRBbW91bnRSZW1haW5pbmcgPSBvdXRwdXRBbW91bnRSZW1haW5pbmcuc3ViKGxvY2tlZENoYW5nZSlcbiAgICAgICAgICAvLyBDcmVhdGUgdGhlIGlubmVyIG91dHB1dC5cbiAgICAgICAgICBjb25zdCBuZXdDaGFuZ2VPdXRwdXQ6IEFtb3VudE91dHB1dCA9IFNlbGVjdE91dHB1dENsYXNzKFxuICAgICAgICAgICAgb3V0cHV0LmdldE91dHB1dElEKCksXG4gICAgICAgICAgICBsb2NrZWRDaGFuZ2UsXG4gICAgICAgICAgICBvdXRwdXQuZ2V0QWRkcmVzc2VzKCksXG4gICAgICAgICAgICBvdXRwdXQuZ2V0TG9ja3RpbWUoKSxcbiAgICAgICAgICAgIG91dHB1dC5nZXRUaHJlc2hvbGQoKVxuICAgICAgICAgICkgYXMgQW1vdW50T3V0cHV0XG4gICAgICAgICAgLy8gV3JhcCB0aGUgaW5uZXIgb3V0cHV0IGluIHRoZSBTdGFrZWFibGVMb2NrT3V0IHdyYXBwZXIuXG4gICAgICAgICAgbGV0IG5ld0xvY2tlZENoYW5nZU91dHB1dDogU3Rha2VhYmxlTG9ja091dCA9IFNlbGVjdE91dHB1dENsYXNzKFxuICAgICAgICAgICAgbG9ja2VkT3V0cHV0LmdldE91dHB1dElEKCksXG4gICAgICAgICAgICBsb2NrZWRDaGFuZ2UsXG4gICAgICAgICAgICBvdXRwdXQuZ2V0QWRkcmVzc2VzKCksXG4gICAgICAgICAgICBvdXRwdXQuZ2V0TG9ja3RpbWUoKSxcbiAgICAgICAgICAgIG91dHB1dC5nZXRUaHJlc2hvbGQoKSxcbiAgICAgICAgICAgIHN0YWtlYWJsZUxvY2t0aW1lLFxuICAgICAgICAgICAgbmV3IFBhcnNlYWJsZU91dHB1dChuZXdDaGFuZ2VPdXRwdXQpXG4gICAgICAgICAgKSBhcyBTdGFrZWFibGVMb2NrT3V0XG4gICAgICAgICAgY29uc3QgdHJhbnNmZXJPdXRwdXQ6IFRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoXG4gICAgICAgICAgICBhc3NldElELFxuICAgICAgICAgICAgbmV3TG9ja2VkQ2hhbmdlT3V0cHV0XG4gICAgICAgICAgKVxuICAgICAgICAgIGFhZC5hZGRDaGFuZ2UodHJhbnNmZXJPdXRwdXQpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBXZSBrbm93IHRoYXQgb3V0cHV0QW1vdW50UmVtYWluaW5nID4gMC4gT3RoZXJ3aXNlLCB3ZSB3b3VsZCBuZXZlclxuICAgICAgICAvLyBoYXZlIGNvbnN1bWVkIHRoaXMgVVRYTywgYXMgaXQgd291bGQgYmUgb25seSBjaGFuZ2UuXG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBpbm5lciBvdXRwdXQuXG4gICAgICAgIGNvbnN0IG5ld091dHB1dDogQW1vdW50T3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3MoXG4gICAgICAgICAgb3V0cHV0LmdldE91dHB1dElEKCksXG4gICAgICAgICAgb3V0cHV0QW1vdW50UmVtYWluaW5nLFxuICAgICAgICAgIG91dHB1dC5nZXRBZGRyZXNzZXMoKSxcbiAgICAgICAgICBvdXRwdXQuZ2V0TG9ja3RpbWUoKSxcbiAgICAgICAgICBvdXRwdXQuZ2V0VGhyZXNob2xkKClcbiAgICAgICAgKSBhcyBBbW91bnRPdXRwdXRcbiAgICAgICAgLy8gV3JhcCB0aGUgaW5uZXIgb3V0cHV0IGluIHRoZSBTdGFrZWFibGVMb2NrT3V0IHdyYXBwZXIuXG4gICAgICAgIGNvbnN0IG5ld0xvY2tlZE91dHB1dDogU3Rha2VhYmxlTG9ja091dCA9IFNlbGVjdE91dHB1dENsYXNzKFxuICAgICAgICAgIGxvY2tlZE91dHB1dC5nZXRPdXRwdXRJRCgpLFxuICAgICAgICAgIG91dHB1dEFtb3VudFJlbWFpbmluZyxcbiAgICAgICAgICBvdXRwdXQuZ2V0QWRkcmVzc2VzKCksXG4gICAgICAgICAgb3V0cHV0LmdldExvY2t0aW1lKCksXG4gICAgICAgICAgb3V0cHV0LmdldFRocmVzaG9sZCgpLFxuICAgICAgICAgIHN0YWtlYWJsZUxvY2t0aW1lLFxuICAgICAgICAgIG5ldyBQYXJzZWFibGVPdXRwdXQobmV3T3V0cHV0KVxuICAgICAgICApIGFzIFN0YWtlYWJsZUxvY2tPdXRcbiAgICAgICAgY29uc3QgdHJhbnNmZXJPdXRwdXQ6IFRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoXG4gICAgICAgICAgYXNzZXRJRCxcbiAgICAgICAgICBuZXdMb2NrZWRPdXRwdXRcbiAgICAgICAgKVxuICAgICAgICBhYWQuYWRkT3V0cHV0KHRyYW5zZmVyT3V0cHV0KVxuICAgICAgfSlcblxuICAgICAgLy8gdW5sb2NrZWRDaGFuZ2UgaXMgdGhlIGFtb3VudCBvZiB1bmxvY2tlZCBjaGFuZ2UgdGhhdCBzaG91bGQgYmUgcmV0dXJuZWRcbiAgICAgIC8vIHRvIHRoZSBzZW5kZXJcbiAgICAgIGNvbnN0IHVubG9ja2VkQ2hhbmdlOiBCTiA9IGlzU3Rha2VhYmxlTG9ja0NoYW5nZSA/IHplcm8uY2xvbmUoKSA6IGNoYW5nZVxuICAgICAgaWYgKHVubG9ja2VkQ2hhbmdlLmd0KHplcm8pKSB7XG4gICAgICAgIGNvbnN0IG5ld0NoYW5nZU91dHB1dDogQW1vdW50T3V0cHV0ID0gbmV3IFNFQ1BUcmFuc2Zlck91dHB1dChcbiAgICAgICAgICB1bmxvY2tlZENoYW5nZSxcbiAgICAgICAgICBhYWQuZ2V0Q2hhbmdlQWRkcmVzc2VzKCksXG4gICAgICAgICAgemVyby5jbG9uZSgpLCAvLyBtYWtlIHN1cmUgdGhhdCB3ZSBkb24ndCBsb2NrIHRoZSBjaGFuZ2Ugb3V0cHV0LlxuICAgICAgICAgIDEgLy8gb25seSByZXF1aXJlIG9uZSBvZiB0aGUgY2hhbmdlcyBhZGRyZXNzZXMgdG8gc3BlbmQgdGhpcyBvdXRwdXQuXG4gICAgICAgICkgYXMgQW1vdW50T3V0cHV0XG4gICAgICAgIGNvbnN0IHRyYW5zZmVyT3V0cHV0OiBUcmFuc2ZlcmFibGVPdXRwdXQgPSBuZXcgVHJhbnNmZXJhYmxlT3V0cHV0KFxuICAgICAgICAgIGFzc2V0SUQsXG4gICAgICAgICAgbmV3Q2hhbmdlT3V0cHV0XG4gICAgICAgIClcbiAgICAgICAgYWFkLmFkZENoYW5nZSh0cmFuc2Zlck91dHB1dClcbiAgICAgIH1cblxuICAgICAgLy8gdG90YWxBbW91bnRTcGVudCBpcyB0aGUgdG90YWwgYW1vdW50IG9mIHRva2VucyBjb25zdW1lZC5cbiAgICAgIGNvbnN0IHRvdGFsQW1vdW50U3BlbnQ6IEJOID0gYXNzZXRBbW91bnQuZ2V0U3BlbnQoKVxuICAgICAgLy8gc3Rha2VhYmxlTG9ja2VkQW1vdW50IGlzIHRoZSB0b3RhbCBhbW91bnQgb2YgbG9ja2VkIHRva2VucyBjb25zdW1lZC5cbiAgICAgIGNvbnN0IHN0YWtlYWJsZUxvY2tlZEFtb3VudDogQk4gPSBhc3NldEFtb3VudC5nZXRTdGFrZWFibGVMb2NrU3BlbnQoKVxuICAgICAgLy8gdG90YWxVbmxvY2tlZFNwZW50IGlzIHRoZSB0b3RhbCBhbW91bnQgb2YgdW5sb2NrZWQgdG9rZW5zIGNvbnN1bWVkLlxuICAgICAgY29uc3QgdG90YWxVbmxvY2tlZFNwZW50OiBCTiA9IHRvdGFsQW1vdW50U3BlbnQuc3ViKHN0YWtlYWJsZUxvY2tlZEFtb3VudClcbiAgICAgIC8vIGFtb3VudEJ1cm50IGlzIHRoZSBhbW91bnQgb2YgdW5sb2NrZWQgdG9rZW5zIHRoYXQgbXVzdCBiZSBidXJuLlxuICAgICAgY29uc3QgYW1vdW50QnVybnQ6IEJOID0gYXNzZXRBbW91bnQuZ2V0QnVybigpXG4gICAgICAvLyB0b3RhbFVubG9ja2VkQXZhaWxhYmxlIGlzIHRoZSB0b3RhbCBhbW91bnQgb2YgdW5sb2NrZWQgdG9rZW5zIGF2YWlsYWJsZVxuICAgICAgLy8gdG8gYmUgcHJvZHVjZWQuXG4gICAgICBjb25zdCB0b3RhbFVubG9ja2VkQXZhaWxhYmxlOiBCTiA9IHRvdGFsVW5sb2NrZWRTcGVudC5zdWIoYW1vdW50QnVybnQpXG4gICAgICAvLyB1bmxvY2tlZEFtb3VudCBpcyB0aGUgYW1vdW50IG9mIHVubG9ja2VkIHRva2VucyB0aGF0IHNob3VsZCBiZSBzZW50LlxuICAgICAgY29uc3QgdW5sb2NrZWRBbW91bnQ6IEJOID0gdG90YWxVbmxvY2tlZEF2YWlsYWJsZS5zdWIodW5sb2NrZWRDaGFuZ2UpXG4gICAgICBpZiAodW5sb2NrZWRBbW91bnQuZ3QoemVybykpIHtcbiAgICAgICAgY29uc3QgbmV3T3V0cHV0OiBBbW91bnRPdXRwdXQgPSBuZXcgU0VDUFRyYW5zZmVyT3V0cHV0KFxuICAgICAgICAgIHVubG9ja2VkQW1vdW50LFxuICAgICAgICAgIGFhZC5nZXREZXN0aW5hdGlvbnMoKSxcbiAgICAgICAgICBsb2NrdGltZSxcbiAgICAgICAgICB0aHJlc2hvbGRcbiAgICAgICAgKSBhcyBBbW91bnRPdXRwdXRcbiAgICAgICAgY29uc3QgdHJhbnNmZXJPdXRwdXQ6IFRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoXG4gICAgICAgICAgYXNzZXRJRCxcbiAgICAgICAgICBuZXdPdXRwdXRcbiAgICAgICAgKVxuICAgICAgICBhYWQuYWRkT3V0cHV0KHRyYW5zZmVyT3V0cHV0KVxuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gW1tVbnNpZ25lZFR4XV0gd3JhcHBpbmcgYSBbW0Jhc2VUeF1dLiBGb3IgbW9yZSBncmFudWxhciBjb250cm9sLCB5b3UgbWF5IGNyZWF0ZSB5b3VyIG93blxuICAgKiBbW1Vuc2lnbmVkVHhdXSB3cmFwcGluZyBhIFtbQmFzZVR4XV0gbWFudWFsbHkgKHdpdGggdGhlaXIgY29ycmVzcG9uZGluZyBbW1RyYW5zZmVyYWJsZUlucHV0XV1zIGFuZCBbW1RyYW5zZmVyYWJsZU91dHB1dF1dcykuXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgVGhlIG51bWJlciByZXByZXNlbnRpbmcgTmV0d29ya0lEIG9mIHRoZSBub2RlXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgQmxvY2tjaGFpbklEIGZvciB0aGUgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIGFtb3VudCBUaGUgYW1vdW50IG9mIHRoZSBhc3NldCB0byBiZSBzcGVudCBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfS5cbiAgICogQHBhcmFtIGFzc2V0SUQge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb2YgdGhlIGFzc2V0IElEIGZvciB0aGUgVVRYT1xuICAgKiBAcGFyYW0gdG9BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0byBzZW5kIHRoZSBmdW5kc1xuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIGJlaW5nIHVzZWQgdG8gc2VuZCB0aGUgZnVuZHMgZnJvbSB0aGUgVVRYT3Mge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn1cbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBPcHRpb25hbC4gVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy4gRGVmYXVsdDogdG9BZGRyZXNzZXNcbiAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZC4gRGVmYXVsdDogYXNzZXRJRFxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbC4gQ29udGFpbnMgYXJiaXRyYXJ5IGRhdGEsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKi9cbiAgYnVpbGRCYXNlVHggPSAoXG4gICAgbmV0d29ya0lEOiBudW1iZXIsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIsXG4gICAgYW1vdW50OiBCTixcbiAgICBhc3NldElEOiBCdWZmZXIsXG4gICAgdG9BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGZyb21BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGNoYW5nZUFkZHJlc3NlczogQnVmZmVyW10gPSB1bmRlZmluZWQsXG4gICAgZmVlOiBCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogVW5zaWduZWRUeCA9PiB7XG4gICAgaWYgKHRocmVzaG9sZCA+IHRvQWRkcmVzc2VzLmxlbmd0aCkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgIHRocm93IG5ldyBUaHJlc2hvbGRFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIFVUWE9TZXQuYnVpbGRCYXNlVHg6IHRocmVzaG9sZCBpcyBncmVhdGVyIHRoYW4gbnVtYmVyIG9mIGFkZHJlc3Nlc1wiXG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjaGFuZ2VBZGRyZXNzZXMgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGNoYW5nZUFkZHJlc3NlcyA9IHRvQWRkcmVzc2VzXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBmZWVBc3NldElEID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBmZWVBc3NldElEID0gYXNzZXRJRFxuICAgIH1cblxuICAgIGNvbnN0IHplcm86IEJOID0gbmV3IEJOKDApXG5cbiAgICBpZiAoYW1vdW50LmVxKHplcm8pKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgY29uc3QgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24oXG4gICAgICB0b0FkZHJlc3NlcyxcbiAgICAgIGZyb21BZGRyZXNzZXMsXG4gICAgICBjaGFuZ2VBZGRyZXNzZXNcbiAgICApXG4gICAgaWYgKGFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikgPT09IGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikpIHtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChhc3NldElELCBhbW91bnQsIGZlZSlcbiAgICB9IGVsc2Uge1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGFzc2V0SUQsIGFtb3VudCwgemVybylcbiAgICAgIGlmICh0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKSB7XG4gICAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpXG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGluczogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IFtdXG4gICAgbGV0IG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gW11cblxuICAgIGNvbnN0IG1pblNwZW5kYWJsZUVycjogRXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoXG4gICAgICBhYWQsXG4gICAgICBhc09mLFxuICAgICAgbG9ja3RpbWUsXG4gICAgICB0aHJlc2hvbGRcbiAgICApXG4gICAgaWYgKHR5cGVvZiBtaW5TcGVuZGFibGVFcnIgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKVxuICAgICAgb3V0cyA9IGFhZC5nZXRBbGxPdXRwdXRzKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbWluU3BlbmRhYmxlRXJyXG4gICAgfVxuXG4gICAgY29uc3QgYmFzZVR4OiBCYXNlVHggPSBuZXcgQmFzZVR4KG5ldHdvcmtJRCwgYmxvY2tjaGFpbklELCBvdXRzLCBpbnMsIG1lbW8pXG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KGJhc2VUeClcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIHVuc2lnbmVkIEltcG9ydFR4IHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya0lEIFRoZSBudW1iZXIgcmVwcmVzZW50aW5nIE5ldHdvcmtJRCBvZiB0aGUgbm9kZVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIFRoZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRpbmcgdGhlIEJsb2NrY2hhaW5JRCBmb3IgdGhlIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB0b0FkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRvIHNlbmQgdGhlIGZ1bmRzXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIE9wdGlvbmFsLiBUaGUgYWRkcmVzc2VzIHRoYXQgY2FuIHNwZW5kIHRoZSBjaGFuZ2UgcmVtYWluaW5nIGZyb20gdGhlIHNwZW50IFVUWE9zLiBEZWZhdWx0OiB0b0FkZHJlc3Nlc1xuICAgKiBAcGFyYW0gaW1wb3J0SW5zIEFuIGFycmF5IG9mIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXMgYmVpbmcgaW1wb3J0ZWRcbiAgICogQHBhcmFtIHNvdXJjZUNoYWluIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBjaGFpbmlkIHdoZXJlIHRoZSBpbXBvcnRzIGFyZSBjb21pbmcgZnJvbS5cbiAgICogQHBhcmFtIGZlZSBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBmZWVzIHRvIGJ1cm4gaW4gaXRzIHNtYWxsZXN0IGRlbm9taW5hdGlvbiwgcmVwcmVzZW50ZWQgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0uIEZlZSB3aWxsIGNvbWUgZnJvbSB0aGUgaW5wdXRzIGZpcnN0LCBpZiB0aGV5IGNhbi5cbiAgICogQHBhcmFtIGZlZUFzc2V0SUQgT3B0aW9uYWwuIFRoZSBhc3NldElEIG9mIHRoZSBmZWVzIGJlaW5nIGJ1cm5lZC5cbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwgY29udGFpbnMgYXJiaXRyYXJ5IGJ5dGVzLCB1cCB0byAyNTYgYnl0ZXNcbiAgICogQHBhcmFtIGFzT2YgT3B0aW9uYWwuIFRoZSB0aW1lc3RhbXAgdG8gdmVyaWZ5IHRoZSB0cmFuc2FjdGlvbiBhZ2FpbnN0IGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGxvY2t0aW1lIE9wdGlvbmFsLiBUaGUgbG9ja3RpbWUgZmllbGQgY3JlYXRlZCBpbiB0aGUgcmVzdWx0aW5nIG91dHB1dHNcbiAgICogQHBhcmFtIHRocmVzaG9sZCBPcHRpb25hbC4gVGhlIG51bWJlciBvZiBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIHNwZW5kIHRoZSBmdW5kcyBpbiB0aGUgcmVzdWx0YW50IFVUWE9cbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICpcbiAgICovXG4gIGJ1aWxkSW1wb3J0VHggPSAoXG4gICAgbmV0d29ya0lEOiBudW1iZXIsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIsXG4gICAgdG9BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGZyb21BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGNoYW5nZUFkZHJlc3NlczogQnVmZmVyW10sXG4gICAgYXRvbWljczogVVRYT1tdLFxuICAgIHNvdXJjZUNoYWluOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgZmVlOiBCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICAgIGxvY2t0aW1lOiBCTiA9IG5ldyBCTigwKSxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDFcbiAgKTogVW5zaWduZWRUeCA9PiB7XG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcbiAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cbiAgICBsZXQgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxuICAgIGlmICh0eXBlb2YgZmVlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBmZWUgPSB6ZXJvLmNsb25lKClcbiAgICB9XG5cbiAgICBjb25zdCBpbXBvcnRJbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSBbXVxuICAgIGxldCBmZWVwYWlkOiBCTiA9IG5ldyBCTigwKVxuICAgIGxldCBmZWVBc3NldFN0cjogc3RyaW5nID0gZmVlQXNzZXRJRC50b1N0cmluZyhcImhleFwiKVxuICAgIGZvciAobGV0IGk6IG51bWJlciA9IDA7IGkgPCBhdG9taWNzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCB1dHhvOiBVVFhPID0gYXRvbWljc1tgJHtpfWBdXG4gICAgICBjb25zdCBhc3NldElEOiBCdWZmZXIgPSB1dHhvLmdldEFzc2V0SUQoKVxuICAgICAgY29uc3Qgb3V0cHV0OiBBbW91bnRPdXRwdXQgPSB1dHhvLmdldE91dHB1dCgpIGFzIEFtb3VudE91dHB1dFxuICAgICAgbGV0IGFtdDogQk4gPSBvdXRwdXQuZ2V0QW1vdW50KCkuY2xvbmUoKVxuXG4gICAgICBsZXQgaW5mZWVhbW91bnQgPSBhbXQuY2xvbmUoKVxuICAgICAgbGV0IGFzc2V0U3RyOiBzdHJpbmcgPSBhc3NldElELnRvU3RyaW5nKFwiaGV4XCIpXG4gICAgICBpZiAoXG4gICAgICAgIHR5cGVvZiBmZWVBc3NldElEICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgIGZlZS5ndCh6ZXJvKSAmJlxuICAgICAgICBmZWVwYWlkLmx0KGZlZSkgJiZcbiAgICAgICAgYXNzZXRTdHIgPT09IGZlZUFzc2V0U3RyXG4gICAgICApIHtcbiAgICAgICAgZmVlcGFpZCA9IGZlZXBhaWQuYWRkKGluZmVlYW1vdW50KVxuICAgICAgICBpZiAoZmVlcGFpZC5ndGUoZmVlKSkge1xuICAgICAgICAgIGluZmVlYW1vdW50ID0gZmVlcGFpZC5zdWIoZmVlKVxuICAgICAgICAgIGZlZXBhaWQgPSBmZWUuY2xvbmUoKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluZmVlYW1vdW50ID0gemVyby5jbG9uZSgpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdHhpZDogQnVmZmVyID0gdXR4by5nZXRUeElEKClcbiAgICAgIGNvbnN0IG91dHB1dGlkeDogQnVmZmVyID0gdXR4by5nZXRPdXRwdXRJZHgoKVxuICAgICAgY29uc3QgaW5wdXQ6IFNFQ1BUcmFuc2ZlcklucHV0ID0gbmV3IFNFQ1BUcmFuc2ZlcklucHV0KGFtdClcbiAgICAgIGNvbnN0IHhmZXJpbjogVHJhbnNmZXJhYmxlSW5wdXQgPSBuZXcgVHJhbnNmZXJhYmxlSW5wdXQoXG4gICAgICAgIHR4aWQsXG4gICAgICAgIG91dHB1dGlkeCxcbiAgICAgICAgYXNzZXRJRCxcbiAgICAgICAgaW5wdXRcbiAgICAgIClcbiAgICAgIGNvbnN0IGZyb206IEJ1ZmZlcltdID0gb3V0cHV0LmdldEFkZHJlc3NlcygpXG4gICAgICBjb25zdCBzcGVuZGVyczogQnVmZmVyW10gPSBvdXRwdXQuZ2V0U3BlbmRlcnMoZnJvbSwgYXNPZilcbiAgICAgIGZvciAobGV0IGo6IG51bWJlciA9IDA7IGogPCBzcGVuZGVycy5sZW5ndGg7IGorKykge1xuICAgICAgICBjb25zdCBpZHg6IG51bWJlciA9IG91dHB1dC5nZXRBZGRyZXNzSWR4KHNwZW5kZXJzW2Ake2p9YF0pXG4gICAgICAgIGlmIChpZHggPT09IC0xKSB7XG4gICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICB0aHJvdyBuZXcgQWRkcmVzc0Vycm9yKFxuICAgICAgICAgICAgXCJFcnJvciAtIFVUWE9TZXQuYnVpbGRJbXBvcnRUeDogbm8gc3VjaCBcIiArXG4gICAgICAgICAgICAgIGBhZGRyZXNzIGluIG91dHB1dDogJHtzcGVuZGVyc1tgJHtqfWBdfWBcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgICAgeGZlcmluLmdldElucHV0KCkuYWRkU2lnbmF0dXJlSWR4KGlkeCwgc3BlbmRlcnNbYCR7an1gXSlcbiAgICAgIH1cbiAgICAgIGltcG9ydElucy5wdXNoKHhmZXJpbilcbiAgICAgIC8vYWRkIGV4dHJhIG91dHB1dHMgZm9yIGVhY2ggYW1vdW50IChjYWxjdWxhdGVkIGZyb20gdGhlIGltcG9ydGVkIGlucHV0cyksIG1pbnVzIGZlZXNcbiAgICAgIGlmIChpbmZlZWFtb3VudC5ndCh6ZXJvKSkge1xuICAgICAgICBjb25zdCBzcGVuZG91dDogQW1vdW50T3V0cHV0ID0gU2VsZWN0T3V0cHV0Q2xhc3MoXG4gICAgICAgICAgb3V0cHV0LmdldE91dHB1dElEKCksXG4gICAgICAgICAgaW5mZWVhbW91bnQsXG4gICAgICAgICAgdG9BZGRyZXNzZXMsXG4gICAgICAgICAgbG9ja3RpbWUsXG4gICAgICAgICAgdGhyZXNob2xkXG4gICAgICAgICkgYXMgQW1vdW50T3V0cHV0XG4gICAgICAgIGNvbnN0IHhmZXJvdXQ6IFRyYW5zZmVyYWJsZU91dHB1dCA9IG5ldyBUcmFuc2ZlcmFibGVPdXRwdXQoXG4gICAgICAgICAgYXNzZXRJRCxcbiAgICAgICAgICBzcGVuZG91dFxuICAgICAgICApXG4gICAgICAgIG91dHMucHVzaCh4ZmVyb3V0KVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGdldCByZW1haW5pbmcgZmVlcyBmcm9tIHRoZSBwcm92aWRlZCBhZGRyZXNzZXNcbiAgICBsZXQgZmVlUmVtYWluaW5nOiBCTiA9IGZlZS5zdWIoZmVlcGFpZClcbiAgICBpZiAoZmVlUmVtYWluaW5nLmd0KHplcm8pICYmIHRoaXMuX2ZlZUNoZWNrKGZlZVJlbWFpbmluZywgZmVlQXNzZXRJRCkpIHtcbiAgICAgIGNvbnN0IGFhZDogQXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKFxuICAgICAgICB0b0FkZHJlc3NlcyxcbiAgICAgICAgZnJvbUFkZHJlc3NlcyxcbiAgICAgICAgY2hhbmdlQWRkcmVzc2VzXG4gICAgICApXG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlUmVtYWluaW5nKVxuICAgICAgY29uc3QgbWluU3BlbmRhYmxlRXJyOiBFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShcbiAgICAgICAgYWFkLFxuICAgICAgICBhc09mLFxuICAgICAgICBsb2NrdGltZSxcbiAgICAgICAgdGhyZXNob2xkXG4gICAgICApXG4gICAgICBpZiAodHlwZW9mIG1pblNwZW5kYWJsZUVyciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpbnMgPSBhYWQuZ2V0SW5wdXRzKClcbiAgICAgICAgb3V0cyA9IGFhZC5nZXRBbGxPdXRwdXRzKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG1pblNwZW5kYWJsZUVyclxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGltcG9ydFR4OiBJbXBvcnRUeCA9IG5ldyBJbXBvcnRUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIG91dHMsXG4gICAgICBpbnMsXG4gICAgICBtZW1vLFxuICAgICAgc291cmNlQ2hhaW4sXG4gICAgICBpbXBvcnRJbnNcbiAgICApXG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KGltcG9ydFR4KVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gdW5zaWduZWQgRXhwb3J0VHggdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgVGhlIG51bWJlciByZXByZXNlbnRpbmcgTmV0d29ya0lEIG9mIHRoZSBub2RlXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgVGhlIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGluZyB0aGUgQmxvY2tjaGFpbklEIGZvciB0aGUgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIGFtb3VudCBUaGUgYW1vdW50IGJlaW5nIGV4cG9ydGVkIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn1cbiAgICogQHBhcmFtIGF4Y0Fzc2V0SUQge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb2YgdGhlIGFzc2V0IElEIGZvciBBWENcbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gcmVjaWV2ZXMgdGhlIEFYQ1xuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIG93bnMgdGhlIEFYQ1xuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSB3aG8gZ2V0cyB0aGUgY2hhbmdlIGxlZnRvdmVyIG9mIHRoZSBBWENcbiAgICogQHBhcmFtIGRlc3RpbmF0aW9uQ2hhaW4gT3B0aW9uYWwuIEEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBjaGFpbmlkIHdoZXJlIHRvIHNlbmQgdGhlIGFzc2V0LlxuICAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkLlxuICAgKiBAcGFyYW0gbWVtbyBPcHRpb25hbCBjb250YWlucyBhcmJpdHJhcnkgYnl0ZXMsIHVwIHRvIDI1NiBieXRlc1xuICAgKiBAcGFyYW0gYXNPZiBPcHRpb25hbC4gVGhlIHRpbWVzdGFtcCB0byB2ZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFnYWluc3QgYXMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gbG9ja3RpbWUgT3B0aW9uYWwuIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgb3V0cHV0c1xuICAgKiBAcGFyYW0gdGhyZXNob2xkIE9wdGlvbmFsLiBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgVVRYT1xuICAgKlxuICAgKiBAcmV0dXJucyBBbiB1bnNpZ25lZCB0cmFuc2FjdGlvbiBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKlxuICAgKi9cbiAgYnVpbGRFeHBvcnRUeCA9IChcbiAgICBuZXR3b3JrSUQ6IG51bWJlcixcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlcixcbiAgICBhbW91bnQ6IEJOLFxuICAgIGF4Y0Fzc2V0SUQ6IEJ1ZmZlciwgLy8gVE9ETzogcmVuYW1lIHRoaXMgdG8gYW1vdW50QXNzZXRJRFxuICAgIHRvQWRkcmVzc2VzOiBCdWZmZXJbXSxcbiAgICBmcm9tQWRkcmVzc2VzOiBCdWZmZXJbXSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IEJ1ZmZlcltdID0gdW5kZWZpbmVkLFxuICAgIGRlc3RpbmF0aW9uQ2hhaW46IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBmZWU6IEJOID0gdW5kZWZpbmVkLFxuICAgIGZlZUFzc2V0SUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBtZW1vOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgYXNPZjogQk4gPSBVbml4Tm93KCksXG4gICAgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApLFxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMVxuICApOiBVbnNpZ25lZFR4ID0+IHtcbiAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cbiAgICBsZXQgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxuICAgIGxldCBleHBvcnRvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdXG5cbiAgICBpZiAodHlwZW9mIGNoYW5nZUFkZHJlc3NlcyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgY2hhbmdlQWRkcmVzc2VzID0gdG9BZGRyZXNzZXNcbiAgICB9XG5cbiAgICBjb25zdCB6ZXJvOiBCTiA9IG5ldyBCTigwKVxuXG4gICAgaWYgKGFtb3VudC5lcSh6ZXJvKSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZmVlQXNzZXRJRCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgZmVlQXNzZXRJRCA9IGF4Y0Fzc2V0SURcbiAgICB9IGVsc2UgaWYgKGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikgIT09IGF4Y0Fzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gICAgICB0aHJvdyBuZXcgRmVlQXNzZXRFcnJvcihcbiAgICAgICAgXCJFcnJvciAtIFVUWE9TZXQuYnVpbGRFeHBvcnRUeDogXCIgKyBgZmVlQXNzZXRJRCBtdXN0IG1hdGNoIGF4Y0Fzc2V0SURgXG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbkNoYWluID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBkZXN0aW5hdGlvbkNoYWluID0gYmludG9vbHMuY2I1OERlY29kZShcbiAgICAgICAgRGVmYXVsdHMubmV0d29ya1tgJHtuZXR3b3JrSUR9YF0uU3dhcFtcImJsb2NrY2hhaW5JRFwiXVxuICAgICAgKVxuICAgIH1cblxuICAgIGNvbnN0IGFhZDogQXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKFxuICAgICAgdG9BZGRyZXNzZXMsXG4gICAgICBmcm9tQWRkcmVzc2VzLFxuICAgICAgY2hhbmdlQWRkcmVzc2VzXG4gICAgKVxuICAgIGlmIChheGNBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpID09PSBmZWVBc3NldElELnRvU3RyaW5nKFwiaGV4XCIpKSB7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoYXhjQXNzZXRJRCwgYW1vdW50LCBmZWUpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChheGNBc3NldElELCBhbW91bnQsIHplcm8pXG4gICAgICBpZiAodGhpcy5fZmVlQ2hlY2soZmVlLCBmZWVBc3NldElEKSkge1xuICAgICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlKVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG1pblNwZW5kYWJsZUVycjogRXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoXG4gICAgICBhYWQsXG4gICAgICBhc09mLFxuICAgICAgbG9ja3RpbWUsXG4gICAgICB0aHJlc2hvbGRcbiAgICApXG4gICAgaWYgKHR5cGVvZiBtaW5TcGVuZGFibGVFcnIgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKVxuICAgICAgb3V0cyA9IGFhZC5nZXRDaGFuZ2VPdXRwdXRzKClcbiAgICAgIGV4cG9ydG91dHMgPSBhYWQuZ2V0T3V0cHV0cygpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG1pblNwZW5kYWJsZUVyclxuICAgIH1cblxuICAgIGNvbnN0IGV4cG9ydFR4OiBFeHBvcnRUeCA9IG5ldyBFeHBvcnRUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIG91dHMsXG4gICAgICBpbnMsXG4gICAgICBtZW1vLFxuICAgICAgZGVzdGluYXRpb25DaGFpbixcbiAgICAgIGV4cG9ydG91dHNcbiAgICApXG5cbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgoZXhwb3J0VHgpXG4gIH1cblxuICAvKipcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIFtbQWRkU3VibmV0VmFsaWRhdG9yVHhdXSB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIG5ldHdvcmtJRCBOZXR3b3JraWQsIFtbRGVmYXVsdE5ldHdvcmtJRF1dXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgQmxvY2tjaGFpbmlkLCBkZWZhdWx0IHVuZGVmaW5lZFxuICAgKiBAcGFyYW0gZnJvbUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIHBheXMgdGhlIGZlZXMgaW4gQVhDXG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBnZXRzIHRoZSBjaGFuZ2UgbGVmdG92ZXIgZnJvbSB0aGUgZmVlIHBheW1lbnRcbiAgICogQHBhcmFtIG5vZGVJRCBUaGUgbm9kZSBJRCBvZiB0aGUgdmFsaWRhdG9yIGJlaW5nIGFkZGVkLlxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIFRoZSBVbml4IHRpbWUgd2hlbiB0aGUgdmFsaWRhdG9yIHN0YXJ0cyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsuXG4gICAqIEBwYXJhbSBlbmRUaW1lIFRoZSBVbml4IHRpbWUgd2hlbiB0aGUgdmFsaWRhdG9yIHN0b3BzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yayAoYW5kIHN0YWtlZCBBWEMgaXMgcmV0dXJuZWQpLlxuICAgKiBAcGFyYW0gd2VpZ2h0IFRoZSBhbW91bnQgb2Ygd2VpZ2h0IGZvciB0aGlzIHN1Ym5ldCB2YWxpZGF0b3IuXG4gICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBzdWJuZXRBdXRoQ3JlZGVudGlhbHMgT3B0aW9uYWwuIEFuIGFycmF5IG9mIGluZGV4IGFuZCBhZGRyZXNzIHRvIHNpZ24gZm9yIGVhY2ggU3VibmV0QXV0aC5cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgdHJhbnNhY3Rpb24gY3JlYXRlZCBmcm9tIHRoZSBwYXNzZWQgaW4gcGFyYW1ldGVycy5cbiAgICovXG4gIGJ1aWxkQWRkU3VibmV0VmFsaWRhdG9yVHggPSAoXG4gICAgbmV0d29ya0lEOiBudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELFxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyLFxuICAgIGZyb21BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGNoYW5nZUFkZHJlc3NlczogQnVmZmVyW10sXG4gICAgbm9kZUlEOiBCdWZmZXIsXG4gICAgc3RhcnRUaW1lOiBCTixcbiAgICBlbmRUaW1lOiBCTixcbiAgICB3ZWlnaHQ6IEJOLFxuICAgIHN1Ym5ldElEOiBzdHJpbmcsXG4gICAgZmVlOiBCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICAgIHN1Ym5ldEF1dGhDcmVkZW50aWFsczogW251bWJlciwgQnVmZmVyXVtdID0gW11cbiAgKTogVW5zaWduZWRUeCA9PiB7XG4gICAgbGV0IGluczogVHJhbnNmZXJhYmxlSW5wdXRbXSA9IFtdXG4gICAgbGV0IG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gW11cblxuICAgIGNvbnN0IHplcm86IEJOID0gbmV3IEJOKDApXG4gICAgY29uc3Qgbm93OiBCTiA9IFVuaXhOb3coKVxuICAgIGlmIChzdGFydFRpbWUubHQobm93KSB8fCBlbmRUaW1lLmx0ZShzdGFydFRpbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiVVRYT1NldC5idWlsZEFkZFN1Ym5ldFZhbGlkYXRvclR4IC0tIHN0YXJ0VGltZSBtdXN0IGJlIGluIHRoZSBmdXR1cmUgYW5kIGVuZFRpbWUgbXVzdCBjb21lIGFmdGVyIHN0YXJ0VGltZVwiXG4gICAgICApXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpIHtcbiAgICAgIGNvbnN0IGFhZDogQXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKFxuICAgICAgICBmcm9tQWRkcmVzc2VzLFxuICAgICAgICBmcm9tQWRkcmVzc2VzLFxuICAgICAgICBjaGFuZ2VBZGRyZXNzZXNcbiAgICAgIClcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpXG4gICAgICBjb25zdCBzdWNjZXNzOiBFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShhYWQsIGFzT2YpXG4gICAgICBpZiAodHlwZW9mIHN1Y2Nlc3MgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgaW5zID0gYWFkLmdldElucHV0cygpXG4gICAgICAgIG91dHMgPSBhYWQuZ2V0QWxsT3V0cHV0cygpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBzdWNjZXNzXG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYWRkU3VibmV0VmFsaWRhdG9yVHg6IEFkZFN1Ym5ldFZhbGlkYXRvclR4ID0gbmV3IEFkZFN1Ym5ldFZhbGlkYXRvclR4KFxuICAgICAgbmV0d29ya0lELFxuICAgICAgYmxvY2tjaGFpbklELFxuICAgICAgb3V0cyxcbiAgICAgIGlucyxcbiAgICAgIG1lbW8sXG4gICAgICBub2RlSUQsXG4gICAgICBzdGFydFRpbWUsXG4gICAgICBlbmRUaW1lLFxuICAgICAgd2VpZ2h0LFxuICAgICAgc3VibmV0SURcbiAgICApXG4gICAgc3VibmV0QXV0aENyZWRlbnRpYWxzLmZvckVhY2goKHN1Ym5ldEF1dGhDcmVkZW50aWFsOiBbbnVtYmVyLCBCdWZmZXJdKSA9PiB7XG4gICAgICBhZGRTdWJuZXRWYWxpZGF0b3JUeC5hZGRTaWduYXR1cmVJZHgoXG4gICAgICAgIHN1Ym5ldEF1dGhDcmVkZW50aWFsWzBdLFxuICAgICAgICBzdWJuZXRBdXRoQ3JlZGVudGlhbFsxXVxuICAgICAgKVxuICAgIH0pXG4gICAgcmV0dXJuIG5ldyBVbnNpZ25lZFR4KGFkZFN1Ym5ldFZhbGlkYXRvclR4KVxuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBbW0FkZE5vbWluYXRvclR4XV0gdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgTmV0d29ya2lkLCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIEJsb2NrY2hhaW5pZCwgZGVmYXVsdCB1bmRlZmluZWRcbiAgICogQHBhcmFtIGF4Y0Fzc2V0SUQge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb2YgdGhlIGFzc2V0IElEIGZvciBBWENcbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZWNpZXZlcyB0aGUgc3Rha2UgYXQgdGhlIGVuZCBvZiB0aGUgc3Rha2luZyBwZXJpb2RcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBwYXlzIHRoZSBmZWVzIGFuZCB0aGUgc3Rha2VcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIGdldHMgdGhlIGNoYW5nZSBsZWZ0b3ZlciBmcm9tIHRoZSBzdGFraW5nIHBheW1lbnRcbiAgICogQHBhcmFtIG5vZGVJRCBUaGUgbm9kZSBJRCBvZiB0aGUgdmFsaWRhdG9yIGJlaW5nIGFkZGVkLlxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIFRoZSBVbml4IHRpbWUgd2hlbiB0aGUgdmFsaWRhdG9yIHN0YXJ0cyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsuXG4gICAqIEBwYXJhbSBlbmRUaW1lIFRoZSBVbml4IHRpbWUgd2hlbiB0aGUgdmFsaWRhdG9yIHN0b3BzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yayAoYW5kIHN0YWtlZCBBWEMgaXMgcmV0dXJuZWQpLlxuICAgKiBAcGFyYW0gc3Rha2VBbW91bnQgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBmb3IgdGhlIGFtb3VudCBvZiBzdGFrZSB0byBiZSBkZWxlZ2F0ZWQgaW4gbkFYQy5cbiAgICogQHBhcmFtIHJld2FyZExvY2t0aW1lIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgcmV3YXJkIG91dHB1dHNcbiAgICogQHBhcmFtIHJld2FyZFRocmVzaG9sZCBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgcmV3YXJkIFVUWE9cbiAgICogQHBhcmFtIHJld2FyZEFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoZSB2YWxpZGF0b3IgcmV3YXJkIGdvZXMuXG4gICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAqL1xuICBidWlsZEFkZE5vbWluYXRvclR4ID0gKFxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlcixcbiAgICBheGNBc3NldElEOiBCdWZmZXIsXG4gICAgdG9BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGZyb21BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGNoYW5nZUFkZHJlc3NlczogQnVmZmVyW10sXG4gICAgbm9kZUlEOiBCdWZmZXIsXG4gICAgc3RhcnRUaW1lOiBCTixcbiAgICBlbmRUaW1lOiBCTixcbiAgICBzdGFrZUFtb3VudDogQk4sXG4gICAgcmV3YXJkTG9ja3RpbWU6IEJOLFxuICAgIHJld2FyZFRocmVzaG9sZDogbnVtYmVyLFxuICAgIHJld2FyZEFkZHJlc3NlczogQnVmZmVyW10sXG4gICAgZmVlOiBCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpXG4gICk6IFVuc2lnbmVkVHggPT4ge1xuICAgIGxldCBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSBbXVxuICAgIGxldCBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdXG4gICAgbGV0IHN0YWtlT3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxuXG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcbiAgICBjb25zdCBub3c6IEJOID0gVW5peE5vdygpXG4gICAgaWYgKHN0YXJ0VGltZS5sdChub3cpIHx8IGVuZFRpbWUubHRlKHN0YXJ0VGltZSkpIHtcbiAgICAgIHRocm93IG5ldyBUaW1lRXJyb3IoXG4gICAgICAgIFwiVVRYT1NldC5idWlsZEFkZE5vbWluYXRvclR4IC0tIHN0YXJ0VGltZSBtdXN0IGJlIGluIHRoZSBmdXR1cmUgYW5kIGVuZFRpbWUgbXVzdCBjb21lIGFmdGVyIHN0YXJ0VGltZVwiXG4gICAgICApXG4gICAgfVxuXG4gICAgY29uc3QgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24oXG4gICAgICB0b0FkZHJlc3NlcyxcbiAgICAgIGZyb21BZGRyZXNzZXMsXG4gICAgICBjaGFuZ2VBZGRyZXNzZXNcbiAgICApXG4gICAgaWYgKGF4Y0Fzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikgPT09IGZlZUFzc2V0SUQudG9TdHJpbmcoXCJoZXhcIikpIHtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChheGNBc3NldElELCBzdGFrZUFtb3VudCwgZmVlKVxuICAgIH0gZWxzZSB7XG4gICAgICBhYWQuYWRkQXNzZXRBbW91bnQoYXhjQXNzZXRJRCwgc3Rha2VBbW91bnQsIHplcm8pXG4gICAgICBpZiAodGhpcy5fZmVlQ2hlY2soZmVlLCBmZWVBc3NldElEKSkge1xuICAgICAgICBhYWQuYWRkQXNzZXRBbW91bnQoZmVlQXNzZXRJRCwgemVybywgZmVlKVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG1pblNwZW5kYWJsZUVycjogRXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoXG4gICAgICBhYWQsXG4gICAgICBhc09mLFxuICAgICAgdW5kZWZpbmVkLFxuICAgICAgdW5kZWZpbmVkLFxuICAgICAgdHJ1ZVxuICAgIClcbiAgICBpZiAodHlwZW9mIG1pblNwZW5kYWJsZUVyciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaW5zID0gYWFkLmdldElucHV0cygpXG4gICAgICBvdXRzID0gYWFkLmdldENoYW5nZU91dHB1dHMoKVxuICAgICAgc3Rha2VPdXRzID0gYWFkLmdldE91dHB1dHMoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBtaW5TcGVuZGFibGVFcnJcbiAgICB9XG5cbiAgICBjb25zdCByZXdhcmRPdXRwdXRPd25lcnM6IFNFQ1BPd25lck91dHB1dCA9IG5ldyBTRUNQT3duZXJPdXRwdXQoXG4gICAgICByZXdhcmRBZGRyZXNzZXMsXG4gICAgICByZXdhcmRMb2NrdGltZSxcbiAgICAgIHJld2FyZFRocmVzaG9sZFxuICAgIClcblxuICAgIGNvbnN0IFVUeDogQWRkTm9taW5hdG9yVHggPSBuZXcgQWRkTm9taW5hdG9yVHgoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBvdXRzLFxuICAgICAgaW5zLFxuICAgICAgbWVtbyxcbiAgICAgIG5vZGVJRCxcbiAgICAgIHN0YXJ0VGltZSxcbiAgICAgIGVuZFRpbWUsXG4gICAgICBzdGFrZUFtb3VudCxcbiAgICAgIHN0YWtlT3V0cyxcbiAgICAgIG5ldyBQYXJzZWFibGVPdXRwdXQocmV3YXJkT3V0cHV0T3duZXJzKVxuICAgIClcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgoVVR4KVxuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBbW0FkZFZhbGlkYXRvclR4XV0gdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgTmV0d29ya0lELCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIEJsb2NrY2hhaW5JRCwgZGVmYXVsdCB1bmRlZmluZWRcbiAgICogQHBhcmFtIGF4Y0Fzc2V0SUQge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gb2YgdGhlIGFzc2V0IElEIGZvciBBWENcbiAgICogQHBhcmFtIHRvQWRkcmVzc2VzIEFuIGFycmF5IG9mIGFkZHJlc3NlcyBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZWNpZXZlcyB0aGUgc3Rha2UgYXQgdGhlIGVuZCBvZiB0aGUgc3Rha2luZyBwZXJpb2RcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgQW4gYXJyYXkgb2YgYWRkcmVzc2VzIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHdobyBwYXlzIHRoZSBmZWVzIGFuZCB0aGUgc3Rha2VcbiAgICogQHBhcmFtIGNoYW5nZUFkZHJlc3NlcyBBbiBhcnJheSBvZiBhZGRyZXNzZXMgYXMge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gd2hvIGdldHMgdGhlIGNoYW5nZSBsZWZ0b3ZlciBmcm9tIHRoZSBzdGFraW5nIHBheW1lbnRcbiAgICogQHBhcmFtIG5vZGVJRCBUaGUgbm9kZSBJRCBvZiB0aGUgdmFsaWRhdG9yIGJlaW5nIGFkZGVkLlxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIFRoZSBVbml4IHRpbWUgd2hlbiB0aGUgdmFsaWRhdG9yIHN0YXJ0cyB2YWxpZGF0aW5nIHRoZSBQcmltYXJ5IE5ldHdvcmsuXG4gICAqIEBwYXJhbSBlbmRUaW1lIFRoZSBVbml4IHRpbWUgd2hlbiB0aGUgdmFsaWRhdG9yIHN0b3BzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yayAoYW5kIHN0YWtlZCBBWEMgaXMgcmV0dXJuZWQpLlxuICAgKiBAcGFyYW0gc3Rha2VBbW91bnQgQSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBmb3IgdGhlIGFtb3VudCBvZiBzdGFrZSB0byBiZSBkZWxlZ2F0ZWQgaW4gbkFYQy5cbiAgICogQHBhcmFtIHJld2FyZExvY2t0aW1lIFRoZSBsb2NrdGltZSBmaWVsZCBjcmVhdGVkIGluIHRoZSByZXN1bHRpbmcgcmV3YXJkIG91dHB1dHNcbiAgICogQHBhcmFtIHJld2FyZFRocmVzaG9sZCBUaGUgbnVtYmVyIG9mIHNpZ25hdHVyZXMgcmVxdWlyZWQgdG8gc3BlbmQgdGhlIGZ1bmRzIGluIHRoZSByZXN1bHRhbnQgcmV3YXJkIFVUWE9cbiAgICogQHBhcmFtIHJld2FyZEFkZHJlc3NlcyBUaGUgYWRkcmVzc2VzIHRoZSB2YWxpZGF0b3IgcmV3YXJkIGdvZXMuXG4gICAqIEBwYXJhbSBkZWxlZ2F0aW9uRmVlIEEgbnVtYmVyIGZvciB0aGUgcGVyY2VudGFnZSBvZiByZXdhcmQgdG8gYmUgZ2l2ZW4gdG8gdGhlIHZhbGlkYXRvciB3aGVuIHNvbWVvbmUgZGVsZWdhdGVzIHRvIHRoZW0uIE11c3QgYmUgYmV0d2VlbiAwIGFuZCAxMDAuXG4gICAqIEBwYXJhbSBtaW5TdGFrZSBBIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59IHJlcHJlc2VudGluZyB0aGUgbWluaW11bSBzdGFrZSByZXF1aXJlZCB0byB2YWxpZGF0ZSBvbiB0aGlzIG5ldHdvcmsuXG4gICAqIEBwYXJhbSBmZWUgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgZmVlcyB0byBidXJuIGluIGl0cyBzbWFsbGVzdCBkZW5vbWluYXRpb24sIHJlcHJlc2VudGVkIGFzIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBmZWVBc3NldElEIE9wdGlvbmFsLiBUaGUgYXNzZXRJRCBvZiB0aGUgZmVlcyBiZWluZyBidXJuZWQuXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAqL1xuICBidWlsZEFkZFZhbGlkYXRvclR4ID0gKFxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlcixcbiAgICBheGNBc3NldElEOiBCdWZmZXIsXG4gICAgdG9BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGZyb21BZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIGNoYW5nZUFkZHJlc3NlczogQnVmZmVyW10sXG4gICAgbm9kZUlEOiBCdWZmZXIsXG4gICAgc3RhcnRUaW1lOiBCTixcbiAgICBlbmRUaW1lOiBCTixcbiAgICBzdGFrZUFtb3VudDogQk4sXG4gICAgcmV3YXJkTG9ja3RpbWU6IEJOLFxuICAgIHJld2FyZFRocmVzaG9sZDogbnVtYmVyLFxuICAgIHJld2FyZEFkZHJlc3NlczogQnVmZmVyW10sXG4gICAgZGVsZWdhdGlvbkZlZTogbnVtYmVyLFxuICAgIGZlZTogQk4gPSB1bmRlZmluZWQsXG4gICAgZmVlQXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKVxuICApOiBVbnNpZ25lZFR4ID0+IHtcbiAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cbiAgICBsZXQgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxuICAgIGxldCBzdGFrZU91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gW11cblxuICAgIGNvbnN0IHplcm86IEJOID0gbmV3IEJOKDApXG4gICAgY29uc3Qgbm93OiBCTiA9IFVuaXhOb3coKVxuICAgIGlmIChzdGFydFRpbWUubHQobm93KSB8fCBlbmRUaW1lLmx0ZShzdGFydFRpbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgVGltZUVycm9yKFxuICAgICAgICBcIlVUWE9TZXQuYnVpbGRBZGRWYWxpZGF0b3JUeCAtLSBzdGFydFRpbWUgbXVzdCBiZSBpbiB0aGUgZnV0dXJlIGFuZCBlbmRUaW1lIG11c3QgY29tZSBhZnRlciBzdGFydFRpbWVcIlxuICAgICAgKVxuICAgIH1cblxuICAgIGlmIChkZWxlZ2F0aW9uRmVlID4gMTAwIHx8IGRlbGVnYXRpb25GZWUgPCAwKSB7XG4gICAgICB0aHJvdyBuZXcgVGltZUVycm9yKFxuICAgICAgICBcIlVUWE9TZXQuYnVpbGRBZGRWYWxpZGF0b3JUeCAtLSBzdGFydFRpbWUgbXVzdCBiZSBpbiB0aGUgcmFuZ2Ugb2YgMCB0byAxMDAsIGluY2x1c2l2ZWx5XCJcbiAgICAgIClcbiAgICB9XG5cbiAgICBjb25zdCBhYWQ6IEFzc2V0QW1vdW50RGVzdGluYXRpb24gPSBuZXcgQXNzZXRBbW91bnREZXN0aW5hdGlvbihcbiAgICAgIHRvQWRkcmVzc2VzLFxuICAgICAgZnJvbUFkZHJlc3NlcyxcbiAgICAgIGNoYW5nZUFkZHJlc3Nlc1xuICAgIClcbiAgICBpZiAoYXhjQXNzZXRJRC50b1N0cmluZyhcImhleFwiKSA9PT0gZmVlQXNzZXRJRC50b1N0cmluZyhcImhleFwiKSkge1xuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGF4Y0Fzc2V0SUQsIHN0YWtlQW1vdW50LCBmZWUpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChheGNBc3NldElELCBzdGFrZUFtb3VudCwgemVybylcbiAgICAgIGlmICh0aGlzLl9mZWVDaGVjayhmZWUsIGZlZUFzc2V0SUQpKSB7XG4gICAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpXG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbWluU3BlbmRhYmxlRXJyOiBFcnJvciA9IHRoaXMuZ2V0TWluaW11bVNwZW5kYWJsZShcbiAgICAgIGFhZCxcbiAgICAgIGFzT2YsXG4gICAgICB1bmRlZmluZWQsXG4gICAgICB1bmRlZmluZWQsXG4gICAgICB0cnVlXG4gICAgKVxuICAgIGlmICh0eXBlb2YgbWluU3BlbmRhYmxlRXJyID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBpbnMgPSBhYWQuZ2V0SW5wdXRzKClcbiAgICAgIG91dHMgPSBhYWQuZ2V0Q2hhbmdlT3V0cHV0cygpXG4gICAgICBzdGFrZU91dHMgPSBhYWQuZ2V0T3V0cHV0cygpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG1pblNwZW5kYWJsZUVyclxuICAgIH1cblxuICAgIGNvbnN0IHJld2FyZE91dHB1dE93bmVyczogU0VDUE93bmVyT3V0cHV0ID0gbmV3IFNFQ1BPd25lck91dHB1dChcbiAgICAgIHJld2FyZEFkZHJlc3NlcyxcbiAgICAgIHJld2FyZExvY2t0aW1lLFxuICAgICAgcmV3YXJkVGhyZXNob2xkXG4gICAgKVxuXG4gICAgY29uc3QgVVR4OiBBZGRWYWxpZGF0b3JUeCA9IG5ldyBBZGRWYWxpZGF0b3JUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIG91dHMsXG4gICAgICBpbnMsXG4gICAgICBtZW1vLFxuICAgICAgbm9kZUlELFxuICAgICAgc3RhcnRUaW1lLFxuICAgICAgZW5kVGltZSxcbiAgICAgIHN0YWtlQW1vdW50LFxuICAgICAgc3Rha2VPdXRzLFxuICAgICAgbmV3IFBhcnNlYWJsZU91dHB1dChyZXdhcmRPdXRwdXRPd25lcnMpLFxuICAgICAgZGVsZWdhdGlvbkZlZVxuICAgIClcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgoVVR4KVxuICB9XG5cbiAgLyoqXG4gICAqIENsYXNzIHJlcHJlc2VudGluZyBhbiB1bnNpZ25lZCBbW0NyZWF0ZVN1Ym5ldFR4XV0gdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgTmV0d29ya2lkLCBbW0RlZmF1bHROZXR3b3JrSURdXVxuICAgKiBAcGFyYW0gYmxvY2tjaGFpbklEIEJsb2NrY2hhaW5pZCwgZGVmYXVsdCB1bmRlZmluZWRcbiAgICogQHBhcmFtIGZyb21BZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBiZWluZyB1c2VkIHRvIHNlbmQgdGhlIGZ1bmRzIGZyb20gdGhlIFVUWE9zIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9XG4gICAqIEBwYXJhbSBjaGFuZ2VBZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyB0aGF0IGNhbiBzcGVuZCB0aGUgY2hhbmdlIHJlbWFpbmluZyBmcm9tIHRoZSBzcGVudCBVVFhPcy5cbiAgICogQHBhcmFtIHN1Ym5ldE93bmVyQWRkcmVzc2VzIEFuIGFycmF5IG9mIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgYWRkcmVzc2VzIHRvIGFkZCB0byBhIHN1Ym5ldFxuICAgKiBAcGFyYW0gc3VibmV0T3duZXJUaHJlc2hvbGQgVGhlIG51bWJlciBvZiBvd25lcnMncyBzaWduYXR1cmVzIHJlcXVpcmVkIHRvIGFkZCBhIHZhbGlkYXRvciB0byB0aGUgbmV0d29ya1xuICAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqXG4gICAqIEByZXR1cm5zIEFuIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGNyZWF0ZWQgZnJvbSB0aGUgcGFzc2VkIGluIHBhcmFtZXRlcnMuXG4gICAqL1xuICBidWlsZENyZWF0ZVN1Ym5ldFR4ID0gKFxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlcixcbiAgICBmcm9tQWRkcmVzc2VzOiBCdWZmZXJbXSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIHN1Ym5ldE93bmVyQWRkcmVzc2VzOiBCdWZmZXJbXSxcbiAgICBzdWJuZXRPd25lclRocmVzaG9sZDogbnVtYmVyLFxuICAgIGZlZTogQk4gPSB1bmRlZmluZWQsXG4gICAgZmVlQXNzZXRJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBhc09mOiBCTiA9IFVuaXhOb3coKVxuICApOiBVbnNpZ25lZFR4ID0+IHtcbiAgICBjb25zdCB6ZXJvOiBCTiA9IG5ldyBCTigwKVxuICAgIGxldCBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSBbXVxuICAgIGxldCBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IFtdXG5cbiAgICBpZiAodGhpcy5fZmVlQ2hlY2soZmVlLCBmZWVBc3NldElEKSkge1xuICAgICAgY29uc3QgYWFkOiBBc3NldEFtb3VudERlc3RpbmF0aW9uID0gbmV3IEFzc2V0QW1vdW50RGVzdGluYXRpb24oXG4gICAgICAgIGZyb21BZGRyZXNzZXMsXG4gICAgICAgIGZyb21BZGRyZXNzZXMsXG4gICAgICAgIGNoYW5nZUFkZHJlc3Nlc1xuICAgICAgKVxuICAgICAgYWFkLmFkZEFzc2V0QW1vdW50KGZlZUFzc2V0SUQsIHplcm8sIGZlZSlcbiAgICAgIGNvbnN0IG1pblNwZW5kYWJsZUVycjogRXJyb3IgPSB0aGlzLmdldE1pbmltdW1TcGVuZGFibGUoXG4gICAgICAgIGFhZCxcbiAgICAgICAgYXNPZixcbiAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICB1bmRlZmluZWRcbiAgICAgIClcbiAgICAgIGlmICh0eXBlb2YgbWluU3BlbmRhYmxlRXJyID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGlucyA9IGFhZC5nZXRJbnB1dHMoKVxuICAgICAgICBvdXRzID0gYWFkLmdldEFsbE91dHB1dHMoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbWluU3BlbmRhYmxlRXJyXG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgbG9ja3RpbWU6IEJOID0gbmV3IEJOKDApXG4gICAgY29uc3QgVVR4OiBDcmVhdGVTdWJuZXRUeCA9IG5ldyBDcmVhdGVTdWJuZXRUeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIG91dHMsXG4gICAgICBpbnMsXG4gICAgICBtZW1vLFxuICAgICAgbmV3IFNFQ1BPd25lck91dHB1dChzdWJuZXRPd25lckFkZHJlc3NlcywgbG9ja3RpbWUsIHN1Ym5ldE93bmVyVGhyZXNob2xkKVxuICAgIClcbiAgICByZXR1cm4gbmV3IFVuc2lnbmVkVHgoVVR4KVxuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGFuIHVuc2lnbmVkIFtbQ3JlYXRlQ2hhaW5UeF1dLlxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE5ldHdvcmtpZCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBCbG9ja2NoYWluaWQsIGRlZmF1bHQgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBmcm9tQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYmVpbmcgdXNlZCB0byBzZW5kIHRoZSBmdW5kcyBmcm9tIHRoZSBVVFhPcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfVxuICAgKiBAcGFyYW0gY2hhbmdlQWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgdGhhdCBjYW4gc3BlbmQgdGhlIGNoYW5nZSByZW1haW5pbmcgZnJvbSB0aGUgc3BlbnQgVVRYT3MuXG4gICAqIEBwYXJhbSBzdWJuZXRJRCBPcHRpb25hbCBJRCBvZiB0aGUgU3VibmV0IHRoYXQgdmFsaWRhdGVzIHRoaXMgYmxvY2tjaGFpblxuICAgKiBAcGFyYW0gY2hhaW5OYW1lIE9wdGlvbmFsIEEgaHVtYW4gcmVhZGFibGUgbmFtZSBmb3IgdGhlIGNoYWluOyBuZWVkIG5vdCBiZSB1bmlxdWVcbiAgICogQHBhcmFtIHZtSUQgT3B0aW9uYWwgSUQgb2YgdGhlIFZNIHJ1bm5pbmcgb24gdGhlIG5ldyBjaGFpblxuICAgKiBAcGFyYW0gZnhJRHMgT3B0aW9uYWwgSURzIG9mIHRoZSBmZWF0dXJlIGV4dGVuc2lvbnMgcnVubmluZyBvbiB0aGUgbmV3IGNoYWluXG4gICAqIEBwYXJhbSBnZW5lc2lzRGF0YSBPcHRpb25hbCBCeXRlIHJlcHJlc2VudGF0aW9uIG9mIGdlbmVzaXMgc3RhdGUgb2YgdGhlIG5ldyBjaGFpblxuICAgKiBAcGFyYW0gZmVlIE9wdGlvbmFsLiBUaGUgYW1vdW50IG9mIGZlZXMgdG8gYnVybiBpbiBpdHMgc21hbGxlc3QgZGVub21pbmF0aW9uLCByZXByZXNlbnRlZCBhcyB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfVxuICAgKiBAcGFyYW0gZmVlQXNzZXRJRCBPcHRpb25hbC4gVGhlIGFzc2V0SUQgb2YgdGhlIGZlZXMgYmVpbmcgYnVybmVkXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsIGNvbnRhaW5zIGFyYml0cmFyeSBieXRlcywgdXAgdG8gMjU2IGJ5dGVzXG4gICAqIEBwYXJhbSBhc09mIE9wdGlvbmFsLiBUaGUgdGltZXN0YW1wIHRvIHZlcmlmeSB0aGUgdHJhbnNhY3Rpb24gYWdhaW5zdCBhcyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vaW5kdXRueS9ibi5qcy98Qk59XG4gICAqIEBwYXJhbSBzdWJuZXRBdXRoQ3JlZGVudGlhbHMgT3B0aW9uYWwuIEFuIGFycmF5IG9mIGluZGV4IGFuZCBhZGRyZXNzIHRvIHNpZ24gZm9yIGVhY2ggU3VibmV0QXV0aC5cbiAgICpcbiAgICogQHJldHVybnMgQW4gdW5zaWduZWQgQ3JlYXRlQ2hhaW5UeCBjcmVhdGVkIGZyb20gdGhlIHBhc3NlZCBpbiBwYXJhbWV0ZXJzLlxuICAgKi9cbiAgYnVpbGRDcmVhdGVDaGFpblR4ID0gKFxuICAgIG5ldHdvcmtJRDogbnVtYmVyID0gRGVmYXVsdE5ldHdvcmtJRCxcbiAgICBibG9ja2NoYWluSUQ6IEJ1ZmZlcixcbiAgICBmcm9tQWRkcmVzc2VzOiBCdWZmZXJbXSxcbiAgICBjaGFuZ2VBZGRyZXNzZXM6IEJ1ZmZlcltdLFxuICAgIHN1Ym5ldElEOiBzdHJpbmcgfCBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgY2hhaW5OYW1lOiBzdHJpbmcgPSB1bmRlZmluZWQsXG4gICAgdm1JRDogc3RyaW5nID0gdW5kZWZpbmVkLFxuICAgIGZ4SURzOiBzdHJpbmdbXSA9IHVuZGVmaW5lZCxcbiAgICBnZW5lc2lzRGF0YTogc3RyaW5nIHwgR2VuZXNpc0RhdGEgPSB1bmRlZmluZWQsXG4gICAgZmVlOiBCTiA9IHVuZGVmaW5lZCxcbiAgICBmZWVBc3NldElEOiBCdWZmZXIgPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIGFzT2Y6IEJOID0gVW5peE5vdygpLFxuICAgIHN1Ym5ldEF1dGhDcmVkZW50aWFsczogW251bWJlciwgQnVmZmVyXVtdID0gW11cbiAgKTogVW5zaWduZWRUeCA9PiB7XG4gICAgY29uc3QgemVybzogQk4gPSBuZXcgQk4oMClcbiAgICBsZXQgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gW11cbiAgICBsZXQgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSBbXVxuXG4gICAgaWYgKHRoaXMuX2ZlZUNoZWNrKGZlZSwgZmVlQXNzZXRJRCkpIHtcbiAgICAgIGNvbnN0IGFhZDogQXNzZXRBbW91bnREZXN0aW5hdGlvbiA9IG5ldyBBc3NldEFtb3VudERlc3RpbmF0aW9uKFxuICAgICAgICBmcm9tQWRkcmVzc2VzLFxuICAgICAgICBmcm9tQWRkcmVzc2VzLFxuICAgICAgICBjaGFuZ2VBZGRyZXNzZXNcbiAgICAgIClcbiAgICAgIGFhZC5hZGRBc3NldEFtb3VudChmZWVBc3NldElELCB6ZXJvLCBmZWUpXG4gICAgICBjb25zdCBtaW5TcGVuZGFibGVFcnI6IEVycm9yID0gdGhpcy5nZXRNaW5pbXVtU3BlbmRhYmxlKFxuICAgICAgICBhYWQsXG4gICAgICAgIGFzT2YsXG4gICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgdW5kZWZpbmVkXG4gICAgICApXG4gICAgICBpZiAodHlwZW9mIG1pblNwZW5kYWJsZUVyciA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpbnMgPSBhYWQuZ2V0SW5wdXRzKClcbiAgICAgICAgb3V0cyA9IGFhZC5nZXRBbGxPdXRwdXRzKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG1pblNwZW5kYWJsZUVyclxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGNyZWF0ZUNoYWluVHg6IENyZWF0ZUNoYWluVHggPSBuZXcgQ3JlYXRlQ2hhaW5UeChcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIG91dHMsXG4gICAgICBpbnMsXG4gICAgICBtZW1vLFxuICAgICAgc3VibmV0SUQsXG4gICAgICBjaGFpbk5hbWUsXG4gICAgICB2bUlELFxuICAgICAgZnhJRHMsXG4gICAgICBnZW5lc2lzRGF0YVxuICAgIClcbiAgICBzdWJuZXRBdXRoQ3JlZGVudGlhbHMuZm9yRWFjaCgoc3VibmV0QXV0aENyZWRlbnRpYWw6IFtudW1iZXIsIEJ1ZmZlcl0pID0+IHtcbiAgICAgIGNyZWF0ZUNoYWluVHguYWRkU2lnbmF0dXJlSWR4KFxuICAgICAgICBzdWJuZXRBdXRoQ3JlZGVudGlhbFswXSxcbiAgICAgICAgc3VibmV0QXV0aENyZWRlbnRpYWxbMV1cbiAgICAgIClcbiAgICB9KVxuICAgIHJldHVybiBuZXcgVW5zaWduZWRUeChjcmVhdGVDaGFpblR4KVxuICB9XG59XG4iXX0=