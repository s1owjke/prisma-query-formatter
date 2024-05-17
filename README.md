# Prisma Query Formatter

This is small, zero-dependency utility correctly stringifies Prisma queries by substituting placeholders with their corresponding values (internally, Prisma uses its own Rust implementation for stringifying params).

Keep in mind that this utility is designed solely for logging purposes, and Prisma irreversibly transforms certain parameter types, such as [blobs](https://github.com/prisma/prisma-engines/blob/5.13.0/quaint/src/ast/values.rs#L571).

## How to use it

Just register a query event handler and use the `formatPrismaQuery` util to substitute the query params (don't forget to enable [event-based](https://www.prisma.io/docs/orm/reference/prisma-client-reference#log) logging in your Prisma client configuration).

```typescript
import { PrismaClient } from "@prisma/client";
import { formatQuery } from "prisma-query-formatter";

const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
  ],
});

prisma.$on("query", (e) => {
  console.log(formatQuery(e.query, e.params));
});
```

For example, this query:

```typescript
await db.user.findUnique({
  select: { id: true },
  where: { email: "john@example.com" },
});
```

Will be logged to the console as:

```text
SELECT `example`.`User`.`id` FROM `example`.`User` WHERE (`example`.`User`.`email` = "john@example.com" AND 1=1) LIMIT 1 OFFSET 0
```

## Query formatting

All whitespace symbols in multiline queries (usually raw queries written manually) will be replaced with single space, for example:

```typescript
await db.$queryRaw`
  SELECT 
    DISTINCT role
  FROM User
  WHERE
    status = ${Status.Active}
`;
```

Will be logged with params as:

```text
SELECT DISTINCT role FROM User WHERE status = "Active"
```

To escape whitespace symbols like `\f\n\r\t\v` in the params, use the `escapeParams` option, this will allow you to make your logs more concise.

```typescript
prisma.$on("query", (e) => {
  console.log(formatQuery(e.query, e.params, { escapeParams: true }));
});
```
