import { formatQuery } from "../src";

describe("query formatting", () => {
  test("without params", () => {
    const log = formatQuery("SELECT COUNT(*) FROM Post", `[]`);
    expect(log).toEqual(`SELECT COUNT(*) FROM Post`);
  });

  test("with params", () => {
    const log = formatQuery("SELECT * FROM Post WHERE status = ? AND views >= ?", `["active",500]`);
    expect(log).toEqual(`SELECT * FROM Post WHERE status = "active" AND views >= 500`);
  });

  test("whitespace cleanup", () => {
    const log = formatQuery("SELECT\n  COUNT(*)\nFROM\n  Post\nWHERE\n  status = ?", `["active"]`);
    expect(log).toEqual(`SELECT COUNT(*) FROM Post WHERE status = "active"`);
  });

  test("trailing whitespace cleanup", () => {
    const log = formatQuery("\nSELECT COUNT(*) FROM Post\n", `[]`);
    expect(log).toEqual(`SELECT COUNT(*) FROM Post`);
  });

  test("without params escaping", () => {
    const log = formatQuery("SELECT * FROM Post WHERE content = ?", `[" \f\n\r\t\v"]`);
    expect(log).toEqual(`SELECT * FROM Post WHERE content = " \f\n\r\t\v"`);
  });

  test("with params escaping", () => {
    const log = formatQuery("SELECT * FROM Post WHERE content = ?", `[" \f\n\r\t\v"]`, { escapeParams: true });
    expect(log).toEqual(`SELECT * FROM Post WHERE content = " \\f\\n\\r\\t\\v"`);
  });
});
