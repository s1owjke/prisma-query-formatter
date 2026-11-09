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

  test("postgres placeholders are substituted by number, not by order of appearance", () => {
    const log = formatQuery(
      'SELECT * FROM UNNEST($3::text[], $4::text[]) AS c(a, b) WHERE "createdAt" BETWEEN $1 AND $2',
      `["2026-05-01T00:00:00.000Z","2026-11-30T23:59:59.999Z",["e1","e2"],["k1","k2"]]`,
    );
    expect(log).toEqual(
      'SELECT * FROM UNNEST(["e1","e2"]::text[], ["k1","k2"]::text[]) AS c(a, b) WHERE "createdAt" BETWEEN "2026-05-01T00:00:00.000Z" AND "2026-11-30T23:59:59.999Z"',
    );
  });

  test("repeated postgres placeholder is substituted with the same value", () => {
    const log = formatQuery("SELECT * FROM Post WHERE authorId = $1 OR editorId = $1", `[42]`, {
      throwOnError: true,
    });
    expect(log).toEqual(`SELECT * FROM Post WHERE authorId = 42 OR editorId = 42`);
  });

  test("$1 does not match the start of $10", () => {
    const log = formatQuery(
      "SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $1",
      `[1,2,3,4,5,6,7,8,9,"ten","eleven"]`,
    );
    expect(log).toEqual(`SELECT 1, 2, 3, 4, 5, 6, 7, 8, 9, "ten", "eleven", 1`);
  });

  test("param transformer applies to postgres placeholders", () => {
    const log = formatQuery("SELECT * FROM Post WHERE content = $1 OR title = $1", `["a\nb"]`, { paramTransformer });
    expect(log).toEqual(`SELECT * FROM Post WHERE content = "a\\nb" OR title = "a\\nb"`);
  });

  test("question mark placeholders are substituted in order", () => {
    const log = formatQuery("SELECT * FROM Post WHERE a = ? AND b = ? AND c = ?", `[3,1,2]`);
    expect(log).toEqual(`SELECT * FROM Post WHERE a = 3 AND b = 1 AND c = 2`);
  });

  test("postgres placeholder higher than param count falls back", () => {
    const query = "SELECT * FROM Post WHERE a = $1 AND b = $3";
    expect(formatQuery(query, `[1,2]`)).toEqual(`${query} [1,2]`);
    expect(() => formatQuery(query, `[1,2]`, { throwOnError: true })).toThrow(
      "Number of placeholders and params doesn't match",
    );
  });

  test("should throw when placeholders and params don't match", () => {
    const log = () => formatQuery("SELECT * FROM Post WHERE status = ?", `[]`, { throwOnError: true });
    expect(log).toThrow("Number of placeholders and params doesn't match");
  });
});
