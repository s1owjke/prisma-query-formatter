import { parseParams } from "../src";

describe("params parsing", () => {
  test("empty array", () => {
    expect(parseParams("[]")).toEqual([]);
  });

  test("numbers", () => {
    expect(parseParams("[1,2,3]")).toEqual(["1", "2", "3"]);
  });

  test("single-line strings", () => {
    expect(parseParams(`["one","two","three"]`)).toEqual([`"one"`, `"two"`, `"three"`]);
  });

  test("multi-line strings", () => {
    expect(parseParams(`["first line\r\nsecond line"]`)).toEqual([`"first line\r\nsecond line"`]);
  });

  test("string with nested quotes", () => {
    expect(parseParams(`["value with "nested" quotes"]`)).toEqual([`"value with "nested" quotes"`]);
  });

  test("mixed values", () => {
    expect(parseParams(`[1,"string",<{} bytes blob>]`)).toEqual([`1`, `"string"`, `<{} bytes blob>`]);
  });
});
