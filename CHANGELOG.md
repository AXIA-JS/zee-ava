# CHANGELOG

## v1.7.0

### Notes

* Added Denali testnet network values
* NFTs are partially implemented in anticipation of their complete release in a future build

### Method Signature Changes

* `axvm.makeUnsignedTx`
  * Renamed to `axvm.makeBaseTx`
  * Now returns `UnsignedTx` instead of `TxUnsigned`
* `axvm.makeCreateAssetTx`
  * 4th parameter has been renamed `initialStates` from `initialState`
  * Now returns `UnsignedTx` instead of `TxCreateAsset`
* `axvm.signTx` 
  * Now accepts `UnsignedTx` instead of `TxUnsigned`
* `SelectInputClass`
  * Now accepts a `number` instead of a `Buffer`
* `axvm.getInputID`
  * Has been renamed to `axvm.getInput` and now returns an `Input` instead of a `number`

### New Methods

* `axvm.makeNFTTransferTx`

### New Classes

* axvm credentials
  * Credential
  * SecpCredential is a superset of Credential
  * NFTCredential is a superset of Credential
* axvm inputs
  * TransferableInput
  * AmountInput
* axvm ops
  * Operation
  * TransferableOperation
  * NFTTransferOperation
* axvm outputs
  * TransferableOutput
  * AmountOutput
  * SecpOutput
  * NFTOutBase
* axvm tx
  * BaseTx
  * CreateAssetTx
  * OperationTx
  * UnsignedTx
* axvm types
  * UTXOID

### New Types

* MergeRule

### Updated Classes

* Input is now `abstract`

### Deleted Classes

* axvm utxos
  * SecpUTXO
* axvm outputs
  * SecpOutBase
* axvm tx
  * TxUnsigned
  * TxCreateAsset

### New consts

* axvm credentials
  * SelectCredentialClass

### Deleted consts

* axvm utxos
  * SelectUTXOClass

### New RPC Calls

* `platform.getSubnets`
* `axvm.buildGenesis`
* `keystore.deleteUser`
