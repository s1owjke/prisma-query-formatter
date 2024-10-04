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
  const values = rawParams.replace(/^\[([^]*)]$/, "$1");
  return values ? values.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/) : [];
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
