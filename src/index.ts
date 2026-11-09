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

    const placeholder = /\$\d/.test(query) ? /\$\d+/g : /\?/g;
    const parsedParams = parseParams(params);

    const usedIndexes = new Set<number>();
    let nextIndex = 0;

    const formatted = query.replace(placeholder, (match) => {
      const index = match === "?" ? nextIndex++ : Number(match.slice(1)) - 1;
      usedIndexes.add(index);

      if (index < 0 || index >= parsedParams.length) {
        throw new Error("Number of placeholders and params doesn't match");
      }

      const param = parsedParams[index];
      return options.paramTransformer ? options.paramTransformer(param) : param;
    });

    if (usedIndexes.size !== parsedParams.length) {
      throw new Error("Number of placeholders and params doesn't match");
    }

    return formatted.trim();
  } catch (error) {
    if (options.throwOnError) {
      throw error;
    }

    return `${query} ${params}`;
  }
};
