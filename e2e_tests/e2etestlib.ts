import { Axia } from "src"

export const getAxia = (): Axia => {
  if (typeof process.env.AXIAGO_IP === "undefined") {
    throw "Undefined environment variable: AXIAGO_IP"
  }
  if (typeof process.env.AXIAGO_PORT === "undefined") {
    throw "Undefined environment variable: AXIAGO_PORT"
  }
  const axia: Axia = new Axia(
    process.env.AXIAGO_IP,
    parseInt(process.env.AXIAGO_PORT)
  )
  return axia
}

export enum Matcher {
  toBe,
  toEqual,
  toContain,
  toMatch,
  toThrow,
  Get
}

export const createTests = (tests_spec: any[]): void => {
  for (const [testName, promise, preprocess, matcher, expected] of tests_spec) {
    test(testName, async (): Promise<void> => {
      if (matcher == Matcher.toBe) {
        expect(preprocess(await promise())).toBe(expected())
      }
      if (matcher == Matcher.toEqual) {
        expect(preprocess(await promise())).toEqual(expected())
      }
      if (matcher == Matcher.toContain) {
        expect(preprocess(await promise())).toEqual(expect.arrayContaining(expected()))
      }
      if (matcher == Matcher.toMatch) {
        expect(preprocess(await promise())).toMatch(expected())
      }
      if (matcher == Matcher.toThrow) {
        await expect(preprocess(promise())).rejects.toThrow(expected())
      }
      if (matcher == Matcher.Get) {
        expected().value = preprocess(await promise())
        expect(true).toBe(true)
      }
    })
  }
}

