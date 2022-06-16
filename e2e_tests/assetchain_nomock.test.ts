import { getAxia, createTests, Matcher } from "./e2etestlib"
import { KeystoreAPI } from "src/apis/keystore/api"
import BN from "bn.js"

describe("AssetChain", (): void => {
  let tx = { value: "" }
  let asset = { value: "" }
  let addrB = { value: "" }
  let addrC = { value: "" }

  const axia = getAxia()
  const assetchain = axia.AssetChain()
  const keystore = new KeystoreAPI(axia)

  const user: string = "axiaJsAssetChainUser"
  const passwd: string = "axiaJsP1ssw4rd"
  const badUser: string = "asdfasdfsa"
  const badPass: string = "pass"
  const memo: string = "hello world"
  const whaleAddr: string = "X-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p"
  const key: string =
    "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"

  // test_name        response_promise                            resp_fn          matcher           expected_value/obtained_value
  const tests_spec: any = [
    [
      "createUser",
      () => keystore.createUser(user, passwd),
      (x) => x,
      Matcher.toBe,
      () => true
    ],
    [
      "createaddrB",
      () => assetchain.createAddress(user, passwd),
      (x) => x,
      Matcher.Get,
      () => addrB
    ],
    [
      "createaddrB",
      () => assetchain.createAddress(user, passwd),
      (x) => x,
      Matcher.Get,
      () => addrC
    ],
    [
      "incorrectUser",
      () =>
        assetchain.send(
          badUser,
          passwd,
          "AXC",
          10,
          addrB.value,
          [addrC.value],
          addrB.value,
          memo
        ),
      (x) => x,
      Matcher.toThrow,
      () => `problem retrieving user "${badUser}": incorrect password for user "${badUser}"`
    ],
    [
      "incorrectPass",
      () =>
        assetchain.send(
          user,
          badPass,
          "AXC",
          10,
          addrB.value,
          [addrC.value],
          addrB.value,
          memo
        ),
      (x) => x,
      Matcher.toThrow,
      () => `problem retrieving user "${user}": incorrect password for user "${user}"`
    ],
    [
      "getBalance",
      () => assetchain.getBalance(whaleAddr, "AXC"),
      (x) => x.balance,
      Matcher.toBe,
      () => "300000000000000000"
    ],
    [
      "getBalance2",
      () => assetchain.getBalance(whaleAddr, "AXC"),
      (x) => x.utxoIDs[0].txID,
      Matcher.toBe,
      () => "BUuypiq2wyuLMvyhzFXcPyxPMCgSp7eeDohhQRqTChoBjKziC"
    ],
    [
      "importKey",
      () => assetchain.importKey(user, passwd, key),
      (x) => x,
      Matcher.toBe,
      () => whaleAddr
    ],
    [
      "send",
      () =>
        assetchain.send(
          user,
          passwd,
          "AXC",
          10,
          addrB.value,
          [whaleAddr],
          whaleAddr,
          memo
        ),
      (x) => x.txID,
      Matcher.Get,
      () => tx
    ],
    [
      "sendMultiple",
      () =>
        assetchain.sendMultiple(
          user,
          passwd,
          [
            { assetID: "AXC", amount: 10, to: addrB.value },
            { assetID: "AXC", amount: 20, to: addrC.value }
          ],
          [whaleAddr],
          whaleAddr,
          memo
        ),
      (x) => x.txID,
      Matcher.Get,
      () => tx
    ],
    [
      "listAddrs",
      () => assetchain.listAddresses(user, passwd),
      (x) => x.sort(),
      Matcher.toEqual,
      () => [whaleAddr, addrB.value, addrC.value].sort()
    ],
    [
      "exportKey",
      () => assetchain.exportKey(user, passwd, addrB.value),
      (x) => x,
      Matcher.toMatch,
      () => /PrivateKey-\w*/
    ],
    [
      "export",
      () =>
        assetchain.export(
          user,
          passwd,
          "C" + addrB.value.substring(1),
          new BN(10),
          "AXC"
        ),
      (x) => x,
      Matcher.toThrow,
      () => "couldn't unmarshal an argument"
    ],
    [
      "import",
      () => assetchain.import(user, passwd, addrB.value, "P"),
      (x) => x,
      Matcher.toThrow,
      () => "problem issuing transaction: no import inputs"
    ],
    [
      "createFixed",
      () =>
        assetchain.createFixedCapAsset(user, passwd, "Some Coin", "SCC", 0, [
          { address: whaleAddr, amount: "10000" }
        ]),
      (x) => x,
      Matcher.Get,
      () => asset
    ],
    [
      "createVar",
      () =>
        assetchain.createVariableCapAsset(user, passwd, "Some Coin", "SCC", 0, [
          { minters: [whaleAddr], threshold: 1 }
        ]),
      (x) => x,
      Matcher.Get,
      () => asset
    ],
    [
      "mint",
      () =>
        assetchain.mint(user, passwd, 1500, asset.value, addrB.value, [whaleAddr]),
      (x) => x,
      Matcher.toThrow,
      () => "couldn't unmarshal an argument"
    ],
    [
      "getTx",
      () => assetchain.getTx(tx.value),
      (x) => x,
      Matcher.toMatch,
      () => /\w+/
    ],
    [
      "getTxStatus",
      () => assetchain.getTxStatus(tx.value),
      (x) => x,
      Matcher.toBe,
      () => "Processing"
    ],
    [
      "getAssetDesc",
      () => assetchain.getAssetDescription(asset.value),
      (x) => [x.name, x.symbol],
      Matcher.toEqual,
      () => ["Some Coin", "SCC"]
    ]
  ]

  createTests(tests_spec)
})