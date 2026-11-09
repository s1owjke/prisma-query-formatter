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

  test("with reordered placeholders in the postgres format", () => {
    const log = formatQuery(
      `SELECT * FROM Post WHERE (authorId = $2 AND status = $1) ORDER BY createdAt DESC LIMIT $3 OFFSET $4`,
      `["published",42,10,0]`,
    );
    expect(log).toEqual(
      `SELECT * FROM Post WHERE (authorId = 42 AND status = "published") ORDER BY createdAt DESC LIMIT 10 OFFSET 0`,
    );
  });

  test("with repeated placeholders in the postgres format", () => {
    const log = formatQuery(`SELECT * FROM Post WHERE (authorId = $1 OR reviewerId = $1) LIMIT $2`, `[42,10]`);
    expect(log).toEqual(`SELECT * FROM Post WHERE (authorId = 42 OR reviewerId = 42) LIMIT 10`);
  });

  test("with jsonb exists operator in the postgres format", () => {
    const log = formatQuery(`SELECT id FROM Post WHERE meta ? $1 LIMIT $2`, `["tag",10]`);
    expect(log).toEqual(`SELECT id FROM Post WHERE meta ? "tag" LIMIT 10`);
  });

  test("with two-digit placeholders in the postgres format", () => {
    const log = formatQuery("SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10", `[1,2,3,4,5,6,7,8,9,"ten"]`);
    expect(log).toEqual(`SELECT 1, 2, 3, 4, 5, 6, 7, 8, 9, "ten"`);
  });

  test("should throw when some params aren't used", () => {
    const log = () => formatQuery("SELECT * FROM Post WHERE id = $1", `[1,2]`, { throwOnError: true });
    expect(log).toThrow("Number of placeholders and params doesn't match");
  });
});
