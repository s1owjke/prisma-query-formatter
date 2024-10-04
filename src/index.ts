type FormatOptions = {
  escapeParams?: boolean;
  throwOnError?: boolean;
};

const escapeWhitespace = (param: string) => {
  return param.replace(/[\f\n\r\t\v]/g, (match) => {
    if (match === "\f") return "\\f";
    if (match === "\n") return "\\n";
    if (match === "\r") return "\\r";
    if (match === "\t") return "\\t";
    if (match === "\v") return "\\v";
    return match;
  });
};

export const parseParams = (rawParams: string) => {
  const input = rawParams.replace(/^\[([^]*)]$/, "$1");
  const params: string[] = [];

  if (!input) return params;

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
      params.push("<{} bytes blob>");
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
      params.push(currentBuffer);
      currentBuffer = "";
    } else {
      currentBuffer += currentChar;
    }
  }

  if (currentBuffer) {
    params.push(currentBuffer);
  }

  return params;
};

export const formatQuery = (query: string, rawParams: string, options: FormatOptions = {}): string => {
  query = query.replace(/\s/g, " ").replace(/\s{2,}/g, " ");

  const placeholders = query.match(/\?/g) || [];
  const params = parseParams(rawParams);

  if (placeholders.length !== params.length) {
    if (options.throwOnError) {
      throw new Error("Number of placeholders and params doesn't match");
    } else {
      return `${query} ${rawParams}`;
    }
  }

  if (params.length > 0) {
    query = query.replace(/(\?|\$\d+)/g, () => {
      const param = params.shift() || "";
      return options.escapeParams ? escapeWhitespace(param) : param;
    });
  }

  return query.trim();
};
