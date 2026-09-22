// Used with z.preprocess() so an empty string from a form field (e.g. an
// untouched optional input) is treated as "not provided" rather than
// failing string-shape validators like .url() or .date().
export const emptyToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;
