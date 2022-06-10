"use strict";
/**
 * @packageDocumentation
 * @module API-PlatformVM-ValidationTx
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddValidatorTx = exports.AddDelegatorTx = exports.WeightedValidatorTx = exports.ValidatorTx = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const bintools_1 = __importDefault(require("../../utils/bintools"));
const basetx_1 = require("./basetx");
const outputs_1 = require("../platformvm/outputs");
const buffer_1 = require("buffer/");
const constants_1 = require("./constants");
const constants_2 = require("../../utils/constants");
const helperfunctions_1 = require("../../utils/helperfunctions");
const outputs_2 = require("./outputs");
const serialization_1 = require("../../utils/serialization");
const errors_1 = require("../../utils/errors");
/**
 * @ignore
 */
const bintools = bintools_1.default.getInstance();
const serialization = serialization_1.Serialization.getInstance();
/**
 * Abstract class representing an transactions with validation information.
 */
class ValidatorTx extends basetx_1.BaseTx {
    constructor(networkID, blockchainID, outs, ins, memo, nodeID, startTime, endTime) {
        super(networkID, blockchainID, outs, ins, memo);
        this._typeName = "ValidatorTx";
        this._typeID = undefined;
        this.nodeID = buffer_1.Buffer.alloc(20);
        this.startTime = buffer_1.Buffer.alloc(8);
        this.endTime = buffer_1.Buffer.alloc(8);
        this.nodeID = nodeID;
        this.startTime = bintools.fromBNToBuffer(startTime, 8);
        this.endTime = bintools.fromBNToBuffer(endTime, 8);
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { nodeID: serialization.encoder(this.nodeID, encoding, "Buffer", "nodeID"), startTime: serialization.encoder(this.startTime, encoding, "Buffer", "decimalString"), endTime: serialization.encoder(this.endTime, encoding, "Buffer", "decimalString") });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.nodeID = serialization.decoder(fields["nodeID"], encoding, "nodeID", "Buffer", 20);
        this.startTime = serialization.decoder(fields["startTime"], encoding, "decimalString", "Buffer", 8);
        this.endTime = serialization.decoder(fields["endTime"], encoding, "decimalString", "Buffer", 8);
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the stake amount.
     */
    getNodeID() {
        return this.nodeID;
    }
    /**
     * Returns a string for the nodeID amount.
     */
    getNodeIDString() {
        return (0, helperfunctions_1.bufferToNodeIDString)(this.nodeID);
    }
    /**
     * Returns a {@link https://github.com/indutny/bn.js/|BN} for the stake amount.
     */
    getStartTime() {
        return bintools.fromBufferToBN(this.startTime);
    }
    /**
     * Returns a {@link https://github.com/indutny/bn.js/|BN} for the stake amount.
     */
    getEndTime() {
        return bintools.fromBufferToBN(this.endTime);
    }
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.nodeID = bintools.copyFrom(bytes, offset, offset + 20);
        offset += 20;
        this.startTime = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.endTime = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ValidatorTx]].
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        const bsize = superbuff.length +
            this.nodeID.length +
            this.startTime.length +
            this.endTime.length;
        return buffer_1.Buffer.concat([superbuff, this.nodeID, this.startTime, this.endTime], bsize);
    }
}
exports.ValidatorTx = ValidatorTx;
class WeightedValidatorTx extends ValidatorTx {
    /**
     * Class representing an unsigned AddSubnetValidatorTx transaction.
     *
     * @param networkID Optional. Networkid, [[DefaultNetworkID]]
     * @param blockchainID Optional. Blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional. Array of the [[TransferableOutput]]s
     * @param ins Optional. Array of the [[TransferableInput]]s
     * @param memo Optional. {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param nodeID Optional. The node ID of the validator being added.
     * @param startTime Optional. The Unix time when the validator starts validating the Primary Network.
     * @param endTime Optional. The Unix time when the validator stops validating the Primary Network (and staked AXC is returned).
     * @param weight Optional. The amount of nAXC the validator is staking.
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, nodeID = undefined, startTime = undefined, endTime = undefined, weight = undefined) {
        super(networkID, blockchainID, outs, ins, memo, nodeID, startTime, endTime);
        this._typeName = "WeightedValidatorTx";
        this._typeID = undefined;
        this.weight = buffer_1.Buffer.alloc(8);
        if (typeof weight !== undefined) {
            this.weight = bintools.fromBNToBuffer(weight, 8);
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { weight: serialization.encoder(this.weight, encoding, "Buffer", "decimalString") });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.weight = serialization.decoder(fields["weight"], encoding, "decimalString", "Buffer", 8);
    }
    /**
     * Returns a {@link https://github.com/indutny/bn.js/|BN} for the stake amount.
     */
    getWeight() {
        return bintools.fromBufferToBN(this.weight);
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the stake amount.
     */
    getWeightBuffer() {
        return this.weight;
    }
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        this.weight = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[AddSubnetValidatorTx]].
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        return buffer_1.Buffer.concat([superbuff, this.weight]);
    }
}
exports.WeightedValidatorTx = WeightedValidatorTx;
/**
 * Class representing an unsigned AddDelegatorTx transaction.
 */
class AddDelegatorTx extends WeightedValidatorTx {
    /**
     * Class representing an unsigned AddDelegatorTx transaction.
     *
     * @param networkID Optional. Networkid, [[DefaultNetworkID]]
     * @param blockchainID Optional. Blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional. Array of the [[TransferableOutput]]s
     * @param ins Optional. Array of the [[TransferableInput]]s
     * @param memo Optional. {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param nodeID Optional. The node ID of the validator being added.
     * @param startTime Optional. The Unix time when the validator starts validating the Primary Network.
     * @param endTime Optional. The Unix time when the validator stops validating the Primary Network (and staked AXC is returned).
     * @param stakeAmount Optional. The amount of nAXC the validator is staking.
     * @param stakeOuts Optional. The outputs used in paying the stake.
     * @param rewardOwners Optional. The [[ParseableOutput]] containing a [[SECPOwnerOutput]] for the rewards.
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, nodeID = undefined, startTime = undefined, endTime = undefined, stakeAmount = undefined, stakeOuts = undefined, rewardOwners = undefined) {
        super(networkID, blockchainID, outs, ins, memo, nodeID, startTime, endTime, stakeAmount);
        this._typeName = "AddDelegatorTx";
        this._typeID = constants_1.PlatformVMConstants.ADDDELEGATORTX;
        this.stakeOuts = [];
        this.rewardOwners = undefined;
        if (typeof stakeOuts !== undefined) {
            this.stakeOuts = stakeOuts;
        }
        this.rewardOwners = rewardOwners;
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { stakeOuts: this.stakeOuts.map((s) => s.serialize(encoding)), rewardOwners: this.rewardOwners.serialize(encoding) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        this.stakeOuts = fields["stakeOuts"].map((s) => {
            let xferout = new outputs_1.TransferableOutput();
            xferout.deserialize(s, encoding);
            return xferout;
        });
        this.rewardOwners = new outputs_2.ParseableOutput();
        this.rewardOwners.deserialize(fields["rewardOwners"], encoding);
    }
    /**
     * Returns the id of the [[AddDelegatorTx]]
     */
    getTxType() {
        return this._typeID;
    }
    /**
     * Returns a {@link https://github.com/indutny/bn.js/|BN} for the stake amount.
     */
    getStakeAmount() {
        return this.getWeight();
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the stake amount.
     */
    getStakeAmountBuffer() {
        return this.weight;
    }
    /**
     * Returns the array of outputs being staked.
     */
    getStakeOuts() {
        return this.stakeOuts;
    }
    /**
     * Should match stakeAmount. Used in sanity checking.
     */
    getStakeOutsTotal() {
        let val = new bn_js_1.default(0);
        for (let i = 0; i < this.stakeOuts.length; i++) {
            val = val.add(this.stakeOuts[`${i}`].getOutput().getAmount());
        }
        return val;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the reward address.
     */
    getRewardOwners() {
        return this.rewardOwners;
    }
    getTotalOuts() {
        return [...this.getOuts(), ...this.getStakeOuts()];
    }
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        const numstakeouts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const outcount = numstakeouts.readUInt32BE(0);
        this.stakeOuts = [];
        for (let i = 0; i < outcount; i++) {
            const xferout = new outputs_1.TransferableOutput();
            offset = xferout.fromBuffer(bytes, offset);
            this.stakeOuts.push(xferout);
        }
        this.rewardOwners = new outputs_2.ParseableOutput();
        offset = this.rewardOwners.fromBuffer(bytes, offset);
        return offset;
    }
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[AddDelegatorTx]].
     */
    toBuffer() {
        const superbuff = super.toBuffer();
        let bsize = superbuff.length;
        const numouts = buffer_1.Buffer.alloc(4);
        numouts.writeUInt32BE(this.stakeOuts.length, 0);
        let barr = [super.toBuffer(), numouts];
        bsize += numouts.length;
        this.stakeOuts = this.stakeOuts.sort(outputs_1.TransferableOutput.comparator());
        for (let i = 0; i < this.stakeOuts.length; i++) {
            let out = this.stakeOuts[`${i}`].toBuffer();
            barr.push(out);
            bsize += out.length;
        }
        let ro = this.rewardOwners.toBuffer();
        barr.push(ro);
        bsize += ro.length;
        return buffer_1.Buffer.concat(barr, bsize);
    }
    clone() {
        let newbase = new AddDelegatorTx();
        newbase.fromBuffer(this.toBuffer());
        return newbase;
    }
    create(...args) {
        return new AddDelegatorTx(...args);
    }
}
exports.AddDelegatorTx = AddDelegatorTx;
class AddValidatorTx extends AddDelegatorTx {
    /**
     * Class representing an unsigned AddValidatorTx transaction.
     *
     * @param networkID Optional. Networkid, [[DefaultNetworkID]]
     * @param blockchainID Optional. Blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional. Array of the [[TransferableOutput]]s
     * @param ins Optional. Array of the [[TransferableInput]]s
     * @param memo Optional. {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param nodeID Optional. The node ID of the validator being added.
     * @param startTime Optional. The Unix time when the validator starts validating the Primary Network.
     * @param endTime Optional. The Unix time when the validator stops validating the Primary Network (and staked AXC is returned).
     * @param stakeAmount Optional. The amount of nAXC the validator is staking.
     * @param stakeOuts Optional. The outputs used in paying the stake.
     * @param rewardOwners Optional. The [[ParseableOutput]] containing the [[SECPOwnerOutput]] for the rewards.
     * @param delegationFee Optional. The percent fee this validator charges when others delegate stake to them.
     * Up to 4 decimal places allowed; additional decimal places are ignored. Must be between 0 and 100, inclusive.
     * For example, if delegationFeeRate is 1.2345 and someone delegates to this validator, then when the delegation
     * period is over, 1.2345% of the reward goes to the validator and the rest goes to the delegator.
     */
    constructor(networkID = constants_2.DefaultNetworkID, blockchainID = buffer_1.Buffer.alloc(32, 16), outs = undefined, ins = undefined, memo = undefined, nodeID = undefined, startTime = undefined, endTime = undefined, stakeAmount = undefined, stakeOuts = undefined, rewardOwners = undefined, delegationFee = undefined) {
        super(networkID, blockchainID, outs, ins, memo, nodeID, startTime, endTime, stakeAmount, stakeOuts, rewardOwners);
        this._typeName = "AddValidatorTx";
        this._typeID = constants_1.PlatformVMConstants.ADDVALIDATORTX;
        this.delegationFee = 0;
        if (typeof delegationFee === "number") {
            if (delegationFee >= 0 && delegationFee <= 100) {
                this.delegationFee = parseFloat(delegationFee.toFixed(4));
            }
            else {
                throw new errors_1.DelegationFeeError("AddValidatorTx.constructor -- delegationFee must be in the range of 0 and 100, inclusively.");
            }
        }
    }
    serialize(encoding = "hex") {
        let fields = super.serialize(encoding);
        return Object.assign(Object.assign({}, fields), { delegationFee: serialization.encoder(this.getDelegationFeeBuffer(), encoding, "Buffer", "decimalString", 4) });
    }
    deserialize(fields, encoding = "hex") {
        super.deserialize(fields, encoding);
        let dbuff = serialization.decoder(fields["delegationFee"], encoding, "decimalString", "Buffer", 4);
        this.delegationFee =
            dbuff.readUInt32BE(0) / AddValidatorTx.delegatorMultiplier;
    }
    /**
     * Returns the id of the [[AddValidatorTx]]
     */
    getTxType() {
        return this._typeID;
    }
    /**
     * Returns the delegation fee (represents a percentage from 0 to 100);
     */
    getDelegationFee() {
        return this.delegationFee;
    }
    /**
     * Returns the binary representation of the delegation fee as a {@link https://github.com/feross/buffer|Buffer}.
     */
    getDelegationFeeBuffer() {
        let dBuff = buffer_1.Buffer.alloc(4);
        let buffnum = parseFloat(this.delegationFee.toFixed(4)) *
            AddValidatorTx.delegatorMultiplier;
        dBuff.writeUInt32BE(buffnum, 0);
        return dBuff;
    }
    fromBuffer(bytes, offset = 0) {
        offset = super.fromBuffer(bytes, offset);
        let dbuff = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.delegationFee =
            dbuff.readUInt32BE(0) / AddValidatorTx.delegatorMultiplier;
        return offset;
    }
    toBuffer() {
        let superBuff = super.toBuffer();
        let feeBuff = this.getDelegationFeeBuffer();
        return buffer_1.Buffer.concat([superBuff, feeBuff]);
    }
}
exports.AddValidatorTx = AddValidatorTx;
AddValidatorTx.delegatorMultiplier = 10000;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbnR4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvcGxhdGZvcm12bS92YWxpZGF0aW9udHgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7O0FBRUgsa0RBQXNCO0FBQ3RCLG9FQUEyQztBQUMzQyxxQ0FBaUM7QUFDakMsbURBQTBEO0FBRTFELG9DQUFnQztBQUNoQywyQ0FBaUQ7QUFDakQscURBQXdEO0FBQ3hELGlFQUFrRTtBQUNsRSx1Q0FBeUQ7QUFDekQsNkRBQTZFO0FBQzdFLCtDQUF1RDtBQUV2RDs7R0FFRztBQUNILE1BQU0sUUFBUSxHQUFhLGtCQUFRLENBQUMsV0FBVyxFQUFFLENBQUE7QUFDakQsTUFBTSxhQUFhLEdBQWtCLDZCQUFhLENBQUMsV0FBVyxFQUFFLENBQUE7QUFFaEU7O0dBRUc7QUFDSCxNQUFzQixXQUFZLFNBQVEsZUFBTTtJQTBHOUMsWUFDRSxTQUFpQixFQUNqQixZQUFvQixFQUNwQixJQUEwQixFQUMxQixHQUF3QixFQUN4QixJQUFhLEVBQ2IsTUFBZSxFQUNmLFNBQWMsRUFDZCxPQUFZO1FBRVosS0FBSyxDQUFDLFNBQVMsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQTtRQW5IdkMsY0FBUyxHQUFHLGFBQWEsQ0FBQTtRQUN6QixZQUFPLEdBQUcsU0FBUyxDQUFBO1FBOENuQixXQUFNLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNqQyxjQUFTLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNuQyxZQUFPLEdBQVcsZUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQW1FekMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7UUFDcEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFNB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Q0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNuQyxJQUFJLE9BQU8sR0FDVCxVQUFVLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekMsY0FBYyxDQUFDLG1CQUFtQixDQUFBO1FBQ3BDLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQy9CLE9BQU8sS0FBSyxDQUFBO0lBQ2QsQ0FBQztJQUVELFVBQVUsQ0FBQyxLQUFhLEVBQUUsU0FBaUIsQ0FBQztRQUMxQyxNQUFNLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFDeEMsSUFBSSxLQUFLLEdBQVcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQTtRQUNoRSxNQUFNLElBQUksQ0FBQyxDQUFBO1FBQ1gsSUFBSSxDQUFDLGFBQWE7WUFDaEIsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxjQUFjLENBQUMsbUJBQW1CLENBQUE7UUFDNUQsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDO0lBRUQsUUFBUTtRQUNOLElBQUksU0FBUyxHQUFXLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUN4QyxJQUFJLE9BQU8sR0FBVyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQTtRQUNuRCxPQUFPLGVBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQTtJQUM1QyxDQUFDOztBQXhFSCx3Q0FrSUM7QUFuR2dCLGtDQUFtQixHQUFXLEtBQUssQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQHBhY2thZ2VEb2N1bWVudGF0aW9uXG4gKiBAbW9kdWxlIEFQSS1QbGF0Zm9ybVZNLVZhbGlkYXRpb25UeFxuICovXG5cbmltcG9ydCBCTiBmcm9tIFwiYm4uanNcIlxuaW1wb3J0IEJpblRvb2xzIGZyb20gXCIuLi8uLi91dGlscy9iaW50b29sc1wiXG5pbXBvcnQgeyBCYXNlVHggfSBmcm9tIFwiLi9iYXNldHhcIlxuaW1wb3J0IHsgVHJhbnNmZXJhYmxlT3V0cHV0IH0gZnJvbSBcIi4uL3BsYXRmb3Jtdm0vb3V0cHV0c1wiXG5pbXBvcnQgeyBUcmFuc2ZlcmFibGVJbnB1dCB9IGZyb20gXCIuLi9wbGF0Zm9ybXZtL2lucHV0c1wiXG5pbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiYnVmZmVyL1wiXG5pbXBvcnQgeyBQbGF0Zm9ybVZNQ29uc3RhbnRzIH0gZnJvbSBcIi4vY29uc3RhbnRzXCJcbmltcG9ydCB7IERlZmF1bHROZXR3b3JrSUQgfSBmcm9tIFwiLi4vLi4vdXRpbHMvY29uc3RhbnRzXCJcbmltcG9ydCB7IGJ1ZmZlclRvTm9kZUlEU3RyaW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2hlbHBlcmZ1bmN0aW9uc1wiXG5pbXBvcnQgeyBBbW91bnRPdXRwdXQsIFBhcnNlYWJsZU91dHB1dCB9IGZyb20gXCIuL291dHB1dHNcIlxuaW1wb3J0IHsgU2VyaWFsaXphdGlvbiwgU2VyaWFsaXplZEVuY29kaW5nIH0gZnJvbSBcIi4uLy4uL3V0aWxzL3NlcmlhbGl6YXRpb25cIlxuaW1wb3J0IHsgRGVsZWdhdGlvbkZlZUVycm9yIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2Vycm9yc1wiXG5cbi8qKlxuICogQGlnbm9yZVxuICovXG5jb25zdCBiaW50b29sczogQmluVG9vbHMgPSBCaW5Ub29scy5nZXRJbnN0YW5jZSgpXG5jb25zdCBzZXJpYWxpemF0aW9uOiBTZXJpYWxpemF0aW9uID0gU2VyaWFsaXphdGlvbi5nZXRJbnN0YW5jZSgpXG5cbi8qKlxuICogQWJzdHJhY3QgY2xhc3MgcmVwcmVzZW50aW5nIGFuIHRyYW5zYWN0aW9ucyB3aXRoIHZhbGlkYXRpb24gaW5mb3JtYXRpb24uXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBWYWxpZGF0b3JUeCBleHRlbmRzIEJhc2VUeCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIlZhbGlkYXRvclR4XCJcbiAgcHJvdGVjdGVkIF90eXBlSUQgPSB1bmRlZmluZWRcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgbm9kZUlEOiBzZXJpYWxpemF0aW9uLmVuY29kZXIodGhpcy5ub2RlSUQsIGVuY29kaW5nLCBcIkJ1ZmZlclwiLCBcIm5vZGVJRFwiKSxcbiAgICAgIHN0YXJ0VGltZTogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxuICAgICAgICB0aGlzLnN0YXJ0VGltZSxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIFwiQnVmZmVyXCIsXG4gICAgICAgIFwiZGVjaW1hbFN0cmluZ1wiXG4gICAgICApLFxuICAgICAgZW5kVGltZTogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxuICAgICAgICB0aGlzLmVuZFRpbWUsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBcIkJ1ZmZlclwiLFxuICAgICAgICBcImRlY2ltYWxTdHJpbmdcIlxuICAgICAgKVxuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMubm9kZUlEID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wibm9kZUlEXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBcIm5vZGVJRFwiLFxuICAgICAgXCJCdWZmZXJcIixcbiAgICAgIDIwXG4gICAgKVxuICAgIHRoaXMuc3RhcnRUaW1lID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wic3RhcnRUaW1lXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBcImRlY2ltYWxTdHJpbmdcIixcbiAgICAgIFwiQnVmZmVyXCIsXG4gICAgICA4XG4gICAgKVxuICAgIHRoaXMuZW5kVGltZSA9IHNlcmlhbGl6YXRpb24uZGVjb2RlcihcbiAgICAgIGZpZWxkc1tcImVuZFRpbWVcIl0sXG4gICAgICBlbmNvZGluZyxcbiAgICAgIFwiZGVjaW1hbFN0cmluZ1wiLFxuICAgICAgXCJCdWZmZXJcIixcbiAgICAgIDhcbiAgICApXG4gIH1cblxuICBwcm90ZWN0ZWQgbm9kZUlEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMjApXG4gIHByb3RlY3RlZCBzdGFydFRpbWU6IEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyg4KVxuICBwcm90ZWN0ZWQgZW5kVGltZTogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDgpXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIHN0YWtlIGFtb3VudC5cbiAgICovXG4gIGdldE5vZGVJRCgpOiBCdWZmZXIge1xuICAgIHJldHVybiB0aGlzLm5vZGVJRFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBzdHJpbmcgZm9yIHRoZSBub2RlSUQgYW1vdW50LlxuICAgKi9cbiAgZ2V0Tm9kZUlEU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGJ1ZmZlclRvTm9kZUlEU3RyaW5nKHRoaXMubm9kZUlEKVxuICB9XG4gIC8qKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gZm9yIHRoZSBzdGFrZSBhbW91bnQuXG4gICAqL1xuICBnZXRTdGFydFRpbWUoKSB7XG4gICAgcmV0dXJuIGJpbnRvb2xzLmZyb21CdWZmZXJUb0JOKHRoaXMuc3RhcnRUaW1lKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBmb3IgdGhlIHN0YWtlIGFtb3VudC5cbiAgICovXG4gIGdldEVuZFRpbWUoKSB7XG4gICAgcmV0dXJuIGJpbnRvb2xzLmZyb21CdWZmZXJUb0JOKHRoaXMuZW5kVGltZSlcbiAgfVxuXG4gIGZyb21CdWZmZXIoYnl0ZXM6IEJ1ZmZlciwgb2Zmc2V0OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgICBvZmZzZXQgPSBzdXBlci5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgdGhpcy5ub2RlSUQgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyAyMClcbiAgICBvZmZzZXQgKz0gMjBcbiAgICB0aGlzLnN0YXJ0VGltZSA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDgpXG4gICAgb2Zmc2V0ICs9IDhcbiAgICB0aGlzLmVuZFRpbWUgPSBiaW50b29scy5jb3B5RnJvbShieXRlcywgb2Zmc2V0LCBvZmZzZXQgKyA4KVxuICAgIG9mZnNldCArPSA4XG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tWYWxpZGF0b3JUeF1dLlxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBjb25zdCBzdXBlcmJ1ZmY6IEJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKClcbiAgICBjb25zdCBic2l6ZTogbnVtYmVyID1cbiAgICAgIHN1cGVyYnVmZi5sZW5ndGggK1xuICAgICAgdGhpcy5ub2RlSUQubGVuZ3RoICtcbiAgICAgIHRoaXMuc3RhcnRUaW1lLmxlbmd0aCArXG4gICAgICB0aGlzLmVuZFRpbWUubGVuZ3RoXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoXG4gICAgICBbc3VwZXJidWZmLCB0aGlzLm5vZGVJRCwgdGhpcy5zdGFydFRpbWUsIHRoaXMuZW5kVGltZV0sXG4gICAgICBic2l6ZVxuICAgIClcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5ldHdvcmtJRDogbnVtYmVyLFxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyLFxuICAgIG91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdLFxuICAgIGluczogVHJhbnNmZXJhYmxlSW5wdXRbXSxcbiAgICBtZW1vPzogQnVmZmVyLFxuICAgIG5vZGVJRD86IEJ1ZmZlcixcbiAgICBzdGFydFRpbWU/OiBCTixcbiAgICBlbmRUaW1lPzogQk5cbiAgKSB7XG4gICAgc3VwZXIobmV0d29ya0lELCBibG9ja2NoYWluSUQsIG91dHMsIGlucywgbWVtbylcbiAgICB0aGlzLm5vZGVJRCA9IG5vZGVJRFxuICAgIHRoaXMuc3RhcnRUaW1lID0gYmludG9vbHMuZnJvbUJOVG9CdWZmZXIoc3RhcnRUaW1lLCA4KVxuICAgIHRoaXMuZW5kVGltZSA9IGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKGVuZFRpbWUsIDgpXG4gIH1cbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFdlaWdodGVkVmFsaWRhdG9yVHggZXh0ZW5kcyBWYWxpZGF0b3JUeCB7XG4gIHByb3RlY3RlZCBfdHlwZU5hbWUgPSBcIldlaWdodGVkVmFsaWRhdG9yVHhcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IHVuZGVmaW5lZFxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICB3ZWlnaHQ6IHNlcmlhbGl6YXRpb24uZW5jb2RlcihcbiAgICAgICAgdGhpcy53ZWlnaHQsXG4gICAgICAgIGVuY29kaW5nLFxuICAgICAgICBcIkJ1ZmZlclwiLFxuICAgICAgICBcImRlY2ltYWxTdHJpbmdcIlxuICAgICAgKVxuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMud2VpZ2h0ID0gc2VyaWFsaXphdGlvbi5kZWNvZGVyKFxuICAgICAgZmllbGRzW1wid2VpZ2h0XCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBcImRlY2ltYWxTdHJpbmdcIixcbiAgICAgIFwiQnVmZmVyXCIsXG4gICAgICA4XG4gICAgKVxuICB9XG5cbiAgcHJvdGVjdGVkIHdlaWdodDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDgpXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2luZHV0bnkvYm4uanMvfEJOfSBmb3IgdGhlIHN0YWtlIGFtb3VudC5cbiAgICovXG4gIGdldFdlaWdodCgpOiBCTiB7XG4gICAgcmV0dXJuIGJpbnRvb2xzLmZyb21CdWZmZXJUb0JOKHRoaXMud2VpZ2h0KVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIHN0YWtlIGFtb3VudC5cbiAgICovXG4gIGdldFdlaWdodEJ1ZmZlcigpOiBCdWZmZXIge1xuICAgIHJldHVybiB0aGlzLndlaWdodFxuICB9XG5cbiAgZnJvbUJ1ZmZlcihieXRlczogQnVmZmVyLCBvZmZzZXQ6IG51bWJlciA9IDApOiBudW1iZXIge1xuICAgIG9mZnNldCA9IHN1cGVyLmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICB0aGlzLndlaWdodCA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDgpXG4gICAgb2Zmc2V0ICs9IDhcbiAgICByZXR1cm4gb2Zmc2V0XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBbW0FkZFN1Ym5ldFZhbGlkYXRvclR4XV0uXG4gICAqL1xuICB0b0J1ZmZlcigpOiBCdWZmZXIge1xuICAgIGNvbnN0IHN1cGVyYnVmZjogQnVmZmVyID0gc3VwZXIudG9CdWZmZXIoKVxuICAgIHJldHVybiBCdWZmZXIuY29uY2F0KFtzdXBlcmJ1ZmYsIHRoaXMud2VpZ2h0XSlcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgQWRkU3VibmV0VmFsaWRhdG9yVHggdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwuIE5ldHdvcmtpZCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBPcHRpb25hbC4gQmxvY2tjaGFpbmlkLCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXG4gICAqIEBwYXJhbSBvdXRzIE9wdGlvbmFsLiBBcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXNcbiAgICogQHBhcmFtIGlucyBPcHRpb25hbC4gQXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXNcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwuIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgbWVtbyBmaWVsZFxuICAgKiBAcGFyYW0gbm9kZUlEIE9wdGlvbmFsLiBUaGUgbm9kZSBJRCBvZiB0aGUgdmFsaWRhdG9yIGJlaW5nIGFkZGVkLlxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIE9wdGlvbmFsLiBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdGFydHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrLlxuICAgKiBAcGFyYW0gZW5kVGltZSBPcHRpb25hbC4gVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RvcHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrIChhbmQgc3Rha2VkIEFYQyBpcyByZXR1cm5lZCkuXG4gICAqIEBwYXJhbSB3ZWlnaHQgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgbkFYQyB0aGUgdmFsaWRhdG9yIGlzIHN0YWtpbmcuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIsIDE2KSxcbiAgICBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IHVuZGVmaW5lZCxcbiAgICBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG5vZGVJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIHN0YXJ0VGltZTogQk4gPSB1bmRlZmluZWQsXG4gICAgZW5kVGltZTogQk4gPSB1bmRlZmluZWQsXG4gICAgd2VpZ2h0OiBCTiA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcihuZXR3b3JrSUQsIGJsb2NrY2hhaW5JRCwgb3V0cywgaW5zLCBtZW1vLCBub2RlSUQsIHN0YXJ0VGltZSwgZW5kVGltZSlcbiAgICBpZiAodHlwZW9mIHdlaWdodCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLndlaWdodCA9IGJpbnRvb2xzLmZyb21CTlRvQnVmZmVyKHdlaWdodCwgOClcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgQWRkRGVsZWdhdG9yVHggdHJhbnNhY3Rpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBBZGREZWxlZ2F0b3JUeCBleHRlbmRzIFdlaWdodGVkVmFsaWRhdG9yVHgge1xuICBwcm90ZWN0ZWQgX3R5cGVOYW1lID0gXCJBZGREZWxlZ2F0b3JUeFwiXG4gIHByb3RlY3RlZCBfdHlwZUlEID0gUGxhdGZvcm1WTUNvbnN0YW50cy5BRERERUxFR0FUT1JUWFxuXG4gIHNlcmlhbGl6ZShlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIik6IG9iamVjdCB7XG4gICAgbGV0IGZpZWxkczogb2JqZWN0ID0gc3VwZXIuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIHJldHVybiB7XG4gICAgICAuLi5maWVsZHMsXG4gICAgICBzdGFrZU91dHM6IHRoaXMuc3Rha2VPdXRzLm1hcCgocykgPT4gcy5zZXJpYWxpemUoZW5jb2RpbmcpKSxcbiAgICAgIHJld2FyZE93bmVyczogdGhpcy5yZXdhcmRPd25lcnMuc2VyaWFsaXplKGVuY29kaW5nKVxuICAgIH1cbiAgfVxuICBkZXNlcmlhbGl6ZShmaWVsZHM6IG9iamVjdCwgZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpIHtcbiAgICBzdXBlci5kZXNlcmlhbGl6ZShmaWVsZHMsIGVuY29kaW5nKVxuICAgIHRoaXMuc3Rha2VPdXRzID0gZmllbGRzW1wic3Rha2VPdXRzXCJdLm1hcCgoczogb2JqZWN0KSA9PiB7XG4gICAgICBsZXQgeGZlcm91dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dCgpXG4gICAgICB4ZmVyb3V0LmRlc2VyaWFsaXplKHMsIGVuY29kaW5nKVxuICAgICAgcmV0dXJuIHhmZXJvdXRcbiAgICB9KVxuICAgIHRoaXMucmV3YXJkT3duZXJzID0gbmV3IFBhcnNlYWJsZU91dHB1dCgpXG4gICAgdGhpcy5yZXdhcmRPd25lcnMuZGVzZXJpYWxpemUoZmllbGRzW1wicmV3YXJkT3duZXJzXCJdLCBlbmNvZGluZylcbiAgfVxuXG4gIHByb3RlY3RlZCBzdGFrZU91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gW11cbiAgcHJvdGVjdGVkIHJld2FyZE93bmVyczogUGFyc2VhYmxlT3V0cHV0ID0gdW5kZWZpbmVkXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGlkIG9mIHRoZSBbW0FkZERlbGVnYXRvclR4XV1cbiAgICovXG4gIGdldFR4VHlwZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90eXBlSURcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9pbmR1dG55L2JuLmpzL3xCTn0gZm9yIHRoZSBzdGFrZSBhbW91bnQuXG4gICAqL1xuICBnZXRTdGFrZUFtb3VudCgpOiBCTiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0V2VpZ2h0KClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSBzdGFrZSBhbW91bnQuXG4gICAqL1xuICBnZXRTdGFrZUFtb3VudEJ1ZmZlcigpOiBCdWZmZXIge1xuICAgIHJldHVybiB0aGlzLndlaWdodFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGFycmF5IG9mIG91dHB1dHMgYmVpbmcgc3Rha2VkLlxuICAgKi9cbiAgZ2V0U3Rha2VPdXRzKCk6IFRyYW5zZmVyYWJsZU91dHB1dFtdIHtcbiAgICByZXR1cm4gdGhpcy5zdGFrZU91dHNcbiAgfVxuXG4gIC8qKlxuICAgKiBTaG91bGQgbWF0Y2ggc3Rha2VBbW91bnQuIFVzZWQgaW4gc2FuaXR5IGNoZWNraW5nLlxuICAgKi9cbiAgZ2V0U3Rha2VPdXRzVG90YWwoKTogQk4ge1xuICAgIGxldCB2YWw6IEJOID0gbmV3IEJOKDApXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHRoaXMuc3Rha2VPdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YWwgPSB2YWwuYWRkKFxuICAgICAgICAodGhpcy5zdGFrZU91dHNbYCR7aX1gXS5nZXRPdXRwdXQoKSBhcyBBbW91bnRPdXRwdXQpLmdldEFtb3VudCgpXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiB2YWxcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0gZm9yIHRoZSByZXdhcmQgYWRkcmVzcy5cbiAgICovXG4gIGdldFJld2FyZE93bmVycygpOiBQYXJzZWFibGVPdXRwdXQge1xuICAgIHJldHVybiB0aGlzLnJld2FyZE93bmVyc1xuICB9XG5cbiAgZ2V0VG90YWxPdXRzKCk6IFRyYW5zZmVyYWJsZU91dHB1dFtdIHtcbiAgICByZXR1cm4gWy4uLih0aGlzLmdldE91dHMoKSBhcyBUcmFuc2ZlcmFibGVPdXRwdXRbXSksIC4uLnRoaXMuZ2V0U3Rha2VPdXRzKCldXG4gIH1cblxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgIGNvbnN0IG51bXN0YWtlb3V0cyA9IGJpbnRvb2xzLmNvcHlGcm9tKGJ5dGVzLCBvZmZzZXQsIG9mZnNldCArIDQpXG4gICAgb2Zmc2V0ICs9IDRcbiAgICBjb25zdCBvdXRjb3VudDogbnVtYmVyID0gbnVtc3Rha2VvdXRzLnJlYWRVSW50MzJCRSgwKVxuICAgIHRoaXMuc3Rha2VPdXRzID0gW11cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAwOyBpIDwgb3V0Y291bnQ7IGkrKykge1xuICAgICAgY29uc3QgeGZlcm91dDogVHJhbnNmZXJhYmxlT3V0cHV0ID0gbmV3IFRyYW5zZmVyYWJsZU91dHB1dCgpXG4gICAgICBvZmZzZXQgPSB4ZmVyb3V0LmZyb21CdWZmZXIoYnl0ZXMsIG9mZnNldClcbiAgICAgIHRoaXMuc3Rha2VPdXRzLnB1c2goeGZlcm91dClcbiAgICB9XG4gICAgdGhpcy5yZXdhcmRPd25lcnMgPSBuZXcgUGFyc2VhYmxlT3V0cHV0KClcbiAgICBvZmZzZXQgPSB0aGlzLnJld2FyZE93bmVycy5mcm9tQnVmZmVyKGJ5dGVzLCBvZmZzZXQpXG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSByZXByZXNlbnRhdGlvbiBvZiB0aGUgW1tBZGREZWxlZ2F0b3JUeF1dLlxuICAgKi9cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBjb25zdCBzdXBlcmJ1ZmY6IEJ1ZmZlciA9IHN1cGVyLnRvQnVmZmVyKClcbiAgICBsZXQgYnNpemU6IG51bWJlciA9IHN1cGVyYnVmZi5sZW5ndGhcbiAgICBjb25zdCBudW1vdXRzOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICBudW1vdXRzLndyaXRlVUludDMyQkUodGhpcy5zdGFrZU91dHMubGVuZ3RoLCAwKVxuICAgIGxldCBiYXJyOiBCdWZmZXJbXSA9IFtzdXBlci50b0J1ZmZlcigpLCBudW1vdXRzXVxuICAgIGJzaXplICs9IG51bW91dHMubGVuZ3RoXG4gICAgdGhpcy5zdGFrZU91dHMgPSB0aGlzLnN0YWtlT3V0cy5zb3J0KFRyYW5zZmVyYWJsZU91dHB1dC5jb21wYXJhdG9yKCkpXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gMDsgaSA8IHRoaXMuc3Rha2VPdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgb3V0OiBCdWZmZXIgPSB0aGlzLnN0YWtlT3V0c1tgJHtpfWBdLnRvQnVmZmVyKClcbiAgICAgIGJhcnIucHVzaChvdXQpXG4gICAgICBic2l6ZSArPSBvdXQubGVuZ3RoXG4gICAgfVxuICAgIGxldCBybzogQnVmZmVyID0gdGhpcy5yZXdhcmRPd25lcnMudG9CdWZmZXIoKVxuICAgIGJhcnIucHVzaChybylcbiAgICBic2l6ZSArPSByby5sZW5ndGhcbiAgICByZXR1cm4gQnVmZmVyLmNvbmNhdChiYXJyLCBic2l6ZSlcbiAgfVxuXG4gIGNsb25lKCk6IHRoaXMge1xuICAgIGxldCBuZXdiYXNlOiBBZGREZWxlZ2F0b3JUeCA9IG5ldyBBZGREZWxlZ2F0b3JUeCgpXG4gICAgbmV3YmFzZS5mcm9tQnVmZmVyKHRoaXMudG9CdWZmZXIoKSlcbiAgICByZXR1cm4gbmV3YmFzZSBhcyB0aGlzXG4gIH1cblxuICBjcmVhdGUoLi4uYXJnczogYW55W10pOiB0aGlzIHtcbiAgICByZXR1cm4gbmV3IEFkZERlbGVnYXRvclR4KC4uLmFyZ3MpIGFzIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGFzcyByZXByZXNlbnRpbmcgYW4gdW5zaWduZWQgQWRkRGVsZWdhdG9yVHggdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBuZXR3b3JrSUQgT3B0aW9uYWwuIE5ldHdvcmtpZCwgW1tEZWZhdWx0TmV0d29ya0lEXV1cbiAgICogQHBhcmFtIGJsb2NrY2hhaW5JRCBPcHRpb25hbC4gQmxvY2tjaGFpbmlkLCBkZWZhdWx0IEJ1ZmZlci5hbGxvYygzMiwgMTYpXG4gICAqIEBwYXJhbSBvdXRzIE9wdGlvbmFsLiBBcnJheSBvZiB0aGUgW1tUcmFuc2ZlcmFibGVPdXRwdXRdXXNcbiAgICogQHBhcmFtIGlucyBPcHRpb25hbC4gQXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlSW5wdXRdXXNcbiAgICogQHBhcmFtIG1lbW8gT3B0aW9uYWwuIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlcnxCdWZmZXJ9IGZvciB0aGUgbWVtbyBmaWVsZFxuICAgKiBAcGFyYW0gbm9kZUlEIE9wdGlvbmFsLiBUaGUgbm9kZSBJRCBvZiB0aGUgdmFsaWRhdG9yIGJlaW5nIGFkZGVkLlxuICAgKiBAcGFyYW0gc3RhcnRUaW1lIE9wdGlvbmFsLiBUaGUgVW5peCB0aW1lIHdoZW4gdGhlIHZhbGlkYXRvciBzdGFydHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrLlxuICAgKiBAcGFyYW0gZW5kVGltZSBPcHRpb25hbC4gVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RvcHMgdmFsaWRhdGluZyB0aGUgUHJpbWFyeSBOZXR3b3JrIChhbmQgc3Rha2VkIEFYQyBpcyByZXR1cm5lZCkuXG4gICAqIEBwYXJhbSBzdGFrZUFtb3VudCBPcHRpb25hbC4gVGhlIGFtb3VudCBvZiBuQVhDIHRoZSB2YWxpZGF0b3IgaXMgc3Rha2luZy5cbiAgICogQHBhcmFtIHN0YWtlT3V0cyBPcHRpb25hbC4gVGhlIG91dHB1dHMgdXNlZCBpbiBwYXlpbmcgdGhlIHN0YWtlLlxuICAgKiBAcGFyYW0gcmV3YXJkT3duZXJzIE9wdGlvbmFsLiBUaGUgW1tQYXJzZWFibGVPdXRwdXRdXSBjb250YWluaW5nIGEgW1tTRUNQT3duZXJPdXRwdXRdXSBmb3IgdGhlIHJld2FyZHMuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBuZXR3b3JrSUQ6IG51bWJlciA9IERlZmF1bHROZXR3b3JrSUQsXG4gICAgYmxvY2tjaGFpbklEOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoMzIsIDE2KSxcbiAgICBvdXRzOiBUcmFuc2ZlcmFibGVPdXRwdXRbXSA9IHVuZGVmaW5lZCxcbiAgICBpbnM6IFRyYW5zZmVyYWJsZUlucHV0W10gPSB1bmRlZmluZWQsXG4gICAgbWVtbzogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIG5vZGVJRDogQnVmZmVyID0gdW5kZWZpbmVkLFxuICAgIHN0YXJ0VGltZTogQk4gPSB1bmRlZmluZWQsXG4gICAgZW5kVGltZTogQk4gPSB1bmRlZmluZWQsXG4gICAgc3Rha2VBbW91bnQ6IEJOID0gdW5kZWZpbmVkLFxuICAgIHN0YWtlT3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSB1bmRlZmluZWQsXG4gICAgcmV3YXJkT3duZXJzOiBQYXJzZWFibGVPdXRwdXQgPSB1bmRlZmluZWRcbiAgKSB7XG4gICAgc3VwZXIoXG4gICAgICBuZXR3b3JrSUQsXG4gICAgICBibG9ja2NoYWluSUQsXG4gICAgICBvdXRzLFxuICAgICAgaW5zLFxuICAgICAgbWVtbyxcbiAgICAgIG5vZGVJRCxcbiAgICAgIHN0YXJ0VGltZSxcbiAgICAgIGVuZFRpbWUsXG4gICAgICBzdGFrZUFtb3VudFxuICAgIClcbiAgICBpZiAodHlwZW9mIHN0YWtlT3V0cyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnN0YWtlT3V0cyA9IHN0YWtlT3V0c1xuICAgIH1cbiAgICB0aGlzLnJld2FyZE93bmVycyA9IHJld2FyZE93bmVyc1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBZGRWYWxpZGF0b3JUeCBleHRlbmRzIEFkZERlbGVnYXRvclR4IHtcbiAgcHJvdGVjdGVkIF90eXBlTmFtZSA9IFwiQWRkVmFsaWRhdG9yVHhcIlxuICBwcm90ZWN0ZWQgX3R5cGVJRCA9IFBsYXRmb3JtVk1Db25zdGFudHMuQUREVkFMSURBVE9SVFhcblxuICBzZXJpYWxpemUoZW5jb2Rpbmc6IFNlcmlhbGl6ZWRFbmNvZGluZyA9IFwiaGV4XCIpOiBvYmplY3Qge1xuICAgIGxldCBmaWVsZHM6IG9iamVjdCA9IHN1cGVyLnNlcmlhbGl6ZShlbmNvZGluZylcbiAgICByZXR1cm4ge1xuICAgICAgLi4uZmllbGRzLFxuICAgICAgZGVsZWdhdGlvbkZlZTogc2VyaWFsaXphdGlvbi5lbmNvZGVyKFxuICAgICAgICB0aGlzLmdldERlbGVnYXRpb25GZWVCdWZmZXIoKSxcbiAgICAgICAgZW5jb2RpbmcsXG4gICAgICAgIFwiQnVmZmVyXCIsXG4gICAgICAgIFwiZGVjaW1hbFN0cmluZ1wiLFxuICAgICAgICA0XG4gICAgICApXG4gICAgfVxuICB9XG4gIGRlc2VyaWFsaXplKGZpZWxkczogb2JqZWN0LCBlbmNvZGluZzogU2VyaWFsaXplZEVuY29kaW5nID0gXCJoZXhcIikge1xuICAgIHN1cGVyLmRlc2VyaWFsaXplKGZpZWxkcywgZW5jb2RpbmcpXG4gICAgbGV0IGRidWZmOiBCdWZmZXIgPSBzZXJpYWxpemF0aW9uLmRlY29kZXIoXG4gICAgICBmaWVsZHNbXCJkZWxlZ2F0aW9uRmVlXCJdLFxuICAgICAgZW5jb2RpbmcsXG4gICAgICBcImRlY2ltYWxTdHJpbmdcIixcbiAgICAgIFwiQnVmZmVyXCIsXG4gICAgICA0XG4gICAgKVxuICAgIHRoaXMuZGVsZWdhdGlvbkZlZSA9XG4gICAgICBkYnVmZi5yZWFkVUludDMyQkUoMCkgLyBBZGRWYWxpZGF0b3JUeC5kZWxlZ2F0b3JNdWx0aXBsaWVyXG4gIH1cblxuICBwcm90ZWN0ZWQgZGVsZWdhdGlvbkZlZTogbnVtYmVyID0gMFxuICBwcml2YXRlIHN0YXRpYyBkZWxlZ2F0b3JNdWx0aXBsaWVyOiBudW1iZXIgPSAxMDAwMFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpZCBvZiB0aGUgW1tBZGRWYWxpZGF0b3JUeF1dXG4gICAqL1xuICBnZXRUeFR5cGUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUlEXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZGVsZWdhdGlvbiBmZWUgKHJlcHJlc2VudHMgYSBwZXJjZW50YWdlIGZyb20gMCB0byAxMDApO1xuICAgKi9cbiAgZ2V0RGVsZWdhdGlvbkZlZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmRlbGVnYXRpb25GZWVcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBiaW5hcnkgcmVwcmVzZW50YXRpb24gb2YgdGhlIGRlbGVnYXRpb24gZmVlIGFzIGEge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyfEJ1ZmZlcn0uXG4gICAqL1xuICBnZXREZWxlZ2F0aW9uRmVlQnVmZmVyKCk6IEJ1ZmZlciB7XG4gICAgbGV0IGRCdWZmOiBCdWZmZXIgPSBCdWZmZXIuYWxsb2MoNClcbiAgICBsZXQgYnVmZm51bTogbnVtYmVyID1cbiAgICAgIHBhcnNlRmxvYXQodGhpcy5kZWxlZ2F0aW9uRmVlLnRvRml4ZWQoNCkpICpcbiAgICAgIEFkZFZhbGlkYXRvclR4LmRlbGVnYXRvck11bHRpcGxpZXJcbiAgICBkQnVmZi53cml0ZVVJbnQzMkJFKGJ1ZmZudW0sIDApXG4gICAgcmV0dXJuIGRCdWZmXG4gIH1cblxuICBmcm9tQnVmZmVyKGJ5dGVzOiBCdWZmZXIsIG9mZnNldDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gICAgb2Zmc2V0ID0gc3VwZXIuZnJvbUJ1ZmZlcihieXRlcywgb2Zmc2V0KVxuICAgIGxldCBkYnVmZjogQnVmZmVyID0gYmludG9vbHMuY29weUZyb20oYnl0ZXMsIG9mZnNldCwgb2Zmc2V0ICsgNClcbiAgICBvZmZzZXQgKz0gNFxuICAgIHRoaXMuZGVsZWdhdGlvbkZlZSA9XG4gICAgICBkYnVmZi5yZWFkVUludDMyQkUoMCkgLyBBZGRWYWxpZGF0b3JUeC5kZWxlZ2F0b3JNdWx0aXBsaWVyXG4gICAgcmV0dXJuIG9mZnNldFxuICB9XG5cbiAgdG9CdWZmZXIoKTogQnVmZmVyIHtcbiAgICBsZXQgc3VwZXJCdWZmOiBCdWZmZXIgPSBzdXBlci50b0J1ZmZlcigpXG4gICAgbGV0IGZlZUJ1ZmY6IEJ1ZmZlciA9IHRoaXMuZ2V0RGVsZWdhdGlvbkZlZUJ1ZmZlcigpXG4gICAgcmV0dXJuIEJ1ZmZlci5jb25jYXQoW3N1cGVyQnVmZiwgZmVlQnVmZl0pXG4gIH1cblxuICAvKipcbiAgICogQ2xhc3MgcmVwcmVzZW50aW5nIGFuIHVuc2lnbmVkIEFkZFZhbGlkYXRvclR4IHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbmV0d29ya0lEIE9wdGlvbmFsLiBOZXR3b3JraWQsIFtbRGVmYXVsdE5ldHdvcmtJRF1dXG4gICAqIEBwYXJhbSBibG9ja2NoYWluSUQgT3B0aW9uYWwuIEJsb2NrY2hhaW5pZCwgZGVmYXVsdCBCdWZmZXIuYWxsb2MoMzIsIDE2KVxuICAgKiBAcGFyYW0gb3V0cyBPcHRpb25hbC4gQXJyYXkgb2YgdGhlIFtbVHJhbnNmZXJhYmxlT3V0cHV0XV1zXG4gICAqIEBwYXJhbSBpbnMgT3B0aW9uYWwuIEFycmF5IG9mIHRoZSBbW1RyYW5zZmVyYWJsZUlucHV0XV1zXG4gICAqIEBwYXJhbSBtZW1vIE9wdGlvbmFsLiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXJ8QnVmZmVyfSBmb3IgdGhlIG1lbW8gZmllbGRcbiAgICogQHBhcmFtIG5vZGVJRCBPcHRpb25hbC4gVGhlIG5vZGUgSUQgb2YgdGhlIHZhbGlkYXRvciBiZWluZyBhZGRlZC5cbiAgICogQHBhcmFtIHN0YXJ0VGltZSBPcHRpb25hbC4gVGhlIFVuaXggdGltZSB3aGVuIHRoZSB2YWxpZGF0b3Igc3RhcnRzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yay5cbiAgICogQHBhcmFtIGVuZFRpbWUgT3B0aW9uYWwuIFRoZSBVbml4IHRpbWUgd2hlbiB0aGUgdmFsaWRhdG9yIHN0b3BzIHZhbGlkYXRpbmcgdGhlIFByaW1hcnkgTmV0d29yayAoYW5kIHN0YWtlZCBBWEMgaXMgcmV0dXJuZWQpLlxuICAgKiBAcGFyYW0gc3Rha2VBbW91bnQgT3B0aW9uYWwuIFRoZSBhbW91bnQgb2YgbkFYQyB0aGUgdmFsaWRhdG9yIGlzIHN0YWtpbmcuXG4gICAqIEBwYXJhbSBzdGFrZU91dHMgT3B0aW9uYWwuIFRoZSBvdXRwdXRzIHVzZWQgaW4gcGF5aW5nIHRoZSBzdGFrZS5cbiAgICogQHBhcmFtIHJld2FyZE93bmVycyBPcHRpb25hbC4gVGhlIFtbUGFyc2VhYmxlT3V0cHV0XV0gY29udGFpbmluZyB0aGUgW1tTRUNQT3duZXJPdXRwdXRdXSBmb3IgdGhlIHJld2FyZHMuXG4gICAqIEBwYXJhbSBkZWxlZ2F0aW9uRmVlIE9wdGlvbmFsLiBUaGUgcGVyY2VudCBmZWUgdGhpcyB2YWxpZGF0b3IgY2hhcmdlcyB3aGVuIG90aGVycyBkZWxlZ2F0ZSBzdGFrZSB0byB0aGVtLlxuICAgKiBVcCB0byA0IGRlY2ltYWwgcGxhY2VzIGFsbG93ZWQ7IGFkZGl0aW9uYWwgZGVjaW1hbCBwbGFjZXMgYXJlIGlnbm9yZWQuIE11c3QgYmUgYmV0d2VlbiAwIGFuZCAxMDAsIGluY2x1c2l2ZS5cbiAgICogRm9yIGV4YW1wbGUsIGlmIGRlbGVnYXRpb25GZWVSYXRlIGlzIDEuMjM0NSBhbmQgc29tZW9uZSBkZWxlZ2F0ZXMgdG8gdGhpcyB2YWxpZGF0b3IsIHRoZW4gd2hlbiB0aGUgZGVsZWdhdGlvblxuICAgKiBwZXJpb2QgaXMgb3ZlciwgMS4yMzQ1JSBvZiB0aGUgcmV3YXJkIGdvZXMgdG8gdGhlIHZhbGlkYXRvciBhbmQgdGhlIHJlc3QgZ29lcyB0byB0aGUgZGVsZWdhdG9yLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgbmV0d29ya0lEOiBudW1iZXIgPSBEZWZhdWx0TmV0d29ya0lELFxuICAgIGJsb2NrY2hhaW5JRDogQnVmZmVyID0gQnVmZmVyLmFsbG9jKDMyLCAxNiksXG4gICAgb3V0czogVHJhbnNmZXJhYmxlT3V0cHV0W10gPSB1bmRlZmluZWQsXG4gICAgaW5zOiBUcmFuc2ZlcmFibGVJbnB1dFtdID0gdW5kZWZpbmVkLFxuICAgIG1lbW86IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBub2RlSUQ6IEJ1ZmZlciA9IHVuZGVmaW5lZCxcbiAgICBzdGFydFRpbWU6IEJOID0gdW5kZWZpbmVkLFxuICAgIGVuZFRpbWU6IEJOID0gdW5kZWZpbmVkLFxuICAgIHN0YWtlQW1vdW50OiBCTiA9IHVuZGVmaW5lZCxcbiAgICBzdGFrZU91dHM6IFRyYW5zZmVyYWJsZU91dHB1dFtdID0gdW5kZWZpbmVkLFxuICAgIHJld2FyZE93bmVyczogUGFyc2VhYmxlT3V0cHV0ID0gdW5kZWZpbmVkLFxuICAgIGRlbGVnYXRpb25GZWU6IG51bWJlciA9IHVuZGVmaW5lZFxuICApIHtcbiAgICBzdXBlcihcbiAgICAgIG5ldHdvcmtJRCxcbiAgICAgIGJsb2NrY2hhaW5JRCxcbiAgICAgIG91dHMsXG4gICAgICBpbnMsXG4gICAgICBtZW1vLFxuICAgICAgbm9kZUlELFxuICAgICAgc3RhcnRUaW1lLFxuICAgICAgZW5kVGltZSxcbiAgICAgIHN0YWtlQW1vdW50LFxuICAgICAgc3Rha2VPdXRzLFxuICAgICAgcmV3YXJkT3duZXJzXG4gICAgKVxuICAgIGlmICh0eXBlb2YgZGVsZWdhdGlvbkZlZSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgaWYgKGRlbGVnYXRpb25GZWUgPj0gMCAmJiBkZWxlZ2F0aW9uRmVlIDw9IDEwMCkge1xuICAgICAgICB0aGlzLmRlbGVnYXRpb25GZWUgPSBwYXJzZUZsb2F0KGRlbGVnYXRpb25GZWUudG9GaXhlZCg0KSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBEZWxlZ2F0aW9uRmVlRXJyb3IoXG4gICAgICAgICAgXCJBZGRWYWxpZGF0b3JUeC5jb25zdHJ1Y3RvciAtLSBkZWxlZ2F0aW9uRmVlIG11c3QgYmUgaW4gdGhlIHJhbmdlIG9mIDAgYW5kIDEwMCwgaW5jbHVzaXZlbHkuXCJcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIl19