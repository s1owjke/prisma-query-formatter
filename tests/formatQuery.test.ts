import { formatQuery, escapeWhitespace as paramTransformer } from "../src";

describe("query formatting", () => {
  test("without params", () => {
    const log = formatQuery("SELECT COUNT(*) FROM Post", `[]`);
    expect(log).toEqual(`SELECT COUNT(*) FROM Post`);
  });

  test("with params", () => {
    const log = formatQuery("SELECT * FROM Post WHERE status = ? AND views >= ?", `["active",500]`);
    expect(log).toEqual(`SELECT * FROM Post WHERE status = "active" AND views >= 500`);
  });

  test("with parameters and placeholders in the postgres format", () => {
    const log = formatQuery("SELECT id FROM Client OFFSET $1", `[500]`);
    expect(log).toEqual(`SELECT id FROM Client OFFSET 500`);
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

  test("with escaping using param transformer", () => {
    const log = formatQuery("SELECT * FROM Post WHERE content = ?", `[" \f\n\r\t\v"]`, { paramTransformer });
    expect(log).toEqual(`SELECT * FROM Post WHERE content = " \\f\\n\\r\\t\\v"`);
  });

  test("should throw when placeholders and params don't match", () => {
    const log = () => formatQuery("SELECT * FROM Post WHERE status = ?", `[]`, { throwOnError: true });
    expect(log).toThrow("Number of placeholders and params doesn't match");
  });
});
