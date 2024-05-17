# Prisma Query Formatter

This small zero-dependency utility correctly formats Prisma queries by substituting placeholders with their corresponding values.

Internally, Prisma uses its [own](https://github.com/prisma/prisma-engines/blob/5.13.0/quaint/src/ast/values.rs#L547) Rust implementation for stringifying params, so you couldn't just use `JSON.parse` to convert them back to an array (sometimes it's not valid json, like double quotes are not escaped in strings).

Note that this utility is designed for logging purposes only, because Prisma irreversibly converts some types of parameters, such as  [blobs](https://github.com/prisma/prisma-engines/blob/5.13.0/quaint/src/ast/values.rs#L571).

## How to use it

Just register a query event handler and use the `formatQuery` util to substitute the query params (don't forget to enable [event-based](https://www.prisma.io/docs/orm/reference/prisma-client-reference#log) logging in your Prisma client configuration).

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
SELECT `User`.`id` FROM `User` WHERE `User`.`email` = "john@example.com"
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

To escape whitespace symbols such as `\f\n\r\t\v` in params, use the `escapeParams` option, this will allow you to output multiline strings more concisely (all your logs will be on one line).

```typescript
prisma.$on("query", (e) => {
  console.log(formatQuery(e.query, e.params, { escapeParams: true }));
});
```
