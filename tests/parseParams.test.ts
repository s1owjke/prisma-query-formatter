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
    expect(parseParams(`[1,<{} bytes blob>,"string"]`)).toEqual([`1`, `<{} bytes blob>`, `"string"`]);
  });

  test("json object", () => {
    expect(parseParams(`[{"one":1,"two":["one","two"]}]`)).toEqual([`{"one":1,"two":["one","two"]}`]);
  });

  test("json object with nested array", () => {
    expect(parseParams(`[{"one":1,"two":["one","two"]}]`)).toEqual([`{"one":1,"two":["one","two"]}`]);
  });

  test("json array", () => {
    expect(parseParams(`[["one","two"],"string"]`)).toEqual([`["one","two"]`, `"string"`]);
  });

  test("xml", () => {
    expect(parseParams(`[<value>"one","two"</value>,2]`)).toEqual([`<value>"one","two"</value>`, `2`]);
  });

  test("xml with pragma", () => {
    expect(parseParams(`[<?xml version="1.0"?><one>1</one>,2]`)).toEqual([`<?xml version="1.0"?><one>1</one>`, `2`]);
  });
});
