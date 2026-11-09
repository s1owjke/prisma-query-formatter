type FormatOptions = {
  throwOnError?: boolean;
  paramTransformer?: (param: string) => string;
};

export const escapeWhitespace = (param: string) => {
  return param.replace(/[\f\n\r\t\v]/g, (match) => {
    if (match === "\f") return "\\f";
    if (match === "\n") return "\\n";
    if (match === "\r") return "\\r";
    if (match === "\t") return "\\t";
    if (match === "\v") return "\\v";
    return match;
  });
};

export const parseParams = (params: string) => {
  const input = params.replace(/^\[([^]*)]$/, "$1");
  const parsedParams: string[] = [];

  if (!input) return parsedParams;

  const stack: string[] = [];
  let currentBuffer = "";
  let inQuotes = false;
  let inXml = false;

  for (let i = 0; i < input.length; i++) {
    let currentChar = input[i];

    if (currentChar === '"' && input[i - 1] !== "\\") {
      inQuotes = !inQuotes;
    }

    if (inQuotes) {
      currentBuffer += currentChar;
      continue;
    } else if (currentChar === "<" && input.substring(i, i + 15) === "<{} bytes blob>") {
      parsedParams.push("<{} bytes blob>");
      i += 15;
      continue;
    }

    if (currentChar === "<") {
      inXml = true;
      if (input[i + 1] === "/" && stack[stack.length - 1] === "<") {
        stack.pop();
      } else if (input[i + 1] !== "?" && input[i + 1] !== "!") {
        stack.push("<");
      }
    } else if (currentChar === ">") {
      inXml = false;
    } else if (currentChar === "{") {
      stack.push("{");
    } else if (currentChar === "}" && stack[stack.length - 1] === "{") {
      stack.pop();
    } else if (currentChar === "[") {
      stack.push("[");
    } else if (currentChar === "]" && stack[stack.length - 1] === "[") {
      stack.pop();
    }

    if (currentChar === "," && !stack.length && !inXml) {
      parsedParams.push(currentBuffer);
      currentBuffer = "";
    } else {
      currentBuffer += currentChar;
    }
  }

  if (currentBuffer) {
    parsedParams.push(currentBuffer);
  }

  return parsedParams;
};

export const formatQuery = (query: string, params: string, options: FormatOptions = {}): string => {
  try {
    query = query.replace(/\s/g, " ").replace(/\s{2,}/g, " ");

    const parsedParams = parseParams(params);
    const transform = (param: string) => (options.paramTransformer ? options.paramTransformer(param) : param);
    const numbered = (query.match(/\$(\d+)/g) || []).map((placeholder) => Number(placeholder.slice(1)));

    if (numbered.length > 0) {
      // PostgreSQL-style placeholders are bound by number, not by position in the query
      if (Math.min(...numbered) < 1 || Math.max(...numbered) > parsedParams.length) {
        throw new Error("Number of placeholders and params doesn't match");
      }

      query = query.replace(/\$(\d+)/g, (_, index: string) => transform(parsedParams[Number(index) - 1]));
    } else {
      const placeholders = query.match(/\?/g) || [];

      if (placeholders.length !== parsedParams.length) {
        throw new Error("Number of placeholders and params doesn't match");
      }

      if (parsedParams.length > 0) {
        query = query.replace(/\?/g, () => transform(parsedParams.shift() || ""));
      }
    }

    return query.trim();
  } catch (error) {
    if (options.throwOnError) {
      throw error;
    }

    return `${query} ${params}`;
  }
};
