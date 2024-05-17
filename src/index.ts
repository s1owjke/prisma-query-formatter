type FormatOptions = {
  escapeParams?: boolean;
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
  const params = parseParams(rawParams);

  query = query.replace(/\s/g, " ").replace(/\s{2,}/g, " ");

  if (params.length > 0) {
    query = query.replace(/(\?|\$\d+)/g, () => {
      const param = params.shift() || "";
      return options.escapeParams ? escapeWhitespace(param) : param;
    });
  }

  return query.trim();
};
