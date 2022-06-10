import { getAxia, createTests, Matcher } from "./e2etestlib"
import { HealthAPI } from "../src/apis/health/api"
import Axia from "src"

describe("Info", (): void => {
  const axia: Axia = getAxia()
  const health: HealthAPI = axia.Health()

  // test_name          response_promise               resp_fn                 matcher           expected_value/obtained_value
  const tests_spec: any = [
    [
      "healthResponse",
      () => health.health(),
      (x) => {
        return x.healthy
      },
      Matcher.toBe,
      () => true
    ]
  ]

  createTests(tests_spec)
})