import { getAxia, createTests, Matcher } from "./e2etestlib"
import { KeystoreAPI } from "src/apis/keystore/api"
import BN from "bn.js"
import Axia from "src"
import { EVMAPI } from "src/apis/evm"

describe("AXChain", (): void => {
  const axia: Axia = getAxia()
  const axchain: EVMAPI = axia.AXChain()
  const keystore: KeystoreAPI = axia.NodeKeys()

  let exportTxHash = { value: "" }

  const user: string = "axiaJsAXChainUser"
  const passwd: string = "axiaJsP@ssw4rd"
  const key: string =
    "PrivateKey-ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
  const privateKeyHex: string =
    "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
  const whaleAddr: string = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
  const swapChainAddr: string = "Swap-custom18jma8ppw3nhx5r4ap8clazz0dps7rv5u9xde7p"

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
      "importKey",
      () => axchain.importKey(user, passwd, key),
      (x) => x,
      Matcher.toBe,
      () => whaleAddr
    ],
    [
      "exportAXC",
      () => axchain.exportAXC(user, passwd, swapChainAddr, new BN(10)),
      (x) => x,
      Matcher.Get,
      () => exportTxHash
    ],
    [
      "getBaseFee",
      () => axchain.getBaseFee(),
      (x) => x,
      Matcher.toBe,
      () => "0x34630b8a00"
    ],
    [
      "getMaxPriorityFeePerGas",
      () => axchain.getMaxPriorityFeePerGas(),
      (x) => x,
      Matcher.toBe,
      () => "0x0"
    ],
    [
      "exportKey",
      () => axchain.exportKey(user, passwd, whaleAddr),
      (x) => x,
      Matcher.toEqual,
      () => ({
        privateKey: key,
        privateKeyHex: privateKeyHex
      })
    ]
  ]

  createTests(tests_spec)
})