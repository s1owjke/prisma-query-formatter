# Prisma Query Formatter

[![Published on npm](https://img.shields.io/npm/v/prisma-query-formatter?color=brightgreen)](https://www.npmjs.com/package/prisma-query-formatter) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

This small zero-dependency utility correctly formats Prisma queries by substituting placeholders with their corresponding values, support all databases including PostgreSQL.

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

## Error handling

The library now performs a validation to ensure that the number of placeholders in a query matches the number of params, as a mismatch may indicate an error.

- If there is a mismatch and the option `throwOnError` is set to true, it will throw an error
- If `throwOnError` is set to false (default value), it will return the concatenated query and parameters as is

Here is an example with error handler:

```typescript
prisma.$on("query", (e) => {
  try {
    console.log(formatQuery(e.query, e.params, { throwOnError: true }));
  } catch {
    console.log(`${e.query} ${e.params}`);
  }
});
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

To escape whitespace symbols such as `\f\n\r\t\v` in params, use the `escapeWhitespace` function as `paramTransformer`, this will allow you to output multiline strings more concisely (all your logs will be on one line).

```typescript
import { formatQuery, escapeWhitespace } from "prisma-query-formatter";

prisma.$on("query", (e) => {
  console.log(formatQuery(e.query, e.params, { paramTransformer: escapeWhitespace }));
});
```

And then, they will be displayed like this:

```text
SELECT `Post`.`id` FROM `Post` WHERE `Post`.`title` = "first\nsecond"
```

## Custom transformers

You can provide a custom `paramTransformer` function to customize how parameters are displayed.

For example, to limit param length to the first 255 characters:

```typescript
import { formatQuery } from "prisma-query-formatter";

const MAX_PARAM_LENGTH = 255;

const limitLength = (param: string) => {
  if (param.length <= MAX_PARAM_LENGTH) {
    return param;
  }

  return `${param.substring(0, MAX_PARAM_LENGTH)}...`;
};

prisma.$on("query", (e) => {
  console.log(formatQuery(e.query, e.params, { paramTransformer: limitLength() }));
});
```

## Migrations

How to upgrade from older versions.

### 1.0.0

The `escapeParams` option has been removed. The library now supports a custom `paramTransformer` that allows you to control param rendering and exports the `escapeWhitespace` function instead.

Before (version 0.2.2 and earlier):

```typescript
import { formatQuery } from "prisma-query-formatter";

formatQuery(query, params, { escapeParams: true });
````

After:

```typescript
import { formatQuery, escapeWhitespace } from "prisma-query-formatter";

formatQuery(query, params, { paramTransformer: escapeWhitespace });
```
