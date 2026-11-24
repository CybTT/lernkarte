/** Fills `{name}` placeholders: fmt("{n} words", { n: 3 }) -> "3 words". */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  );
}

/**
 * Like `fmt`, but placeholders may be filled with React nodes (e.g. a styled
 * number), returning the pieces in order.
 */
export function fmtParts<T>(template: string, vars: Record<string, T>): (string | T)[] {
  return template
    .split(/(\{\w+\})/g)
    .filter((part) => part !== "")
    .map((part) => {
      const key = part.match(/^\{(\w+)\}$/)?.[1];
      return key && key in vars ? vars[key] : part;
    });
}
