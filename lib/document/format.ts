/**
 * Number formatting utilities for document generation.
 */

/**
 * Format a number using the Indian numbering system (2,2,3 grouping).
 * e.g. 1234567.89 → "12,34,567.89"
 */
export function formatIndianNumber(num: number, decimalPlaces?: number): string {
  const fixed = decimalPlaces !== undefined ? num.toFixed(decimalPlaces) : String(num);
  const [intPart, decPart] = fixed.split(".");

  // Indian grouping: last 3 digits, then groups of 2
  const intStr = intPart.replace(/^-/, "");
  const sign = intPart.startsWith("-") ? "-" : "";
  let result = "";
  if (intStr.length <= 3) {
    result = intStr;
  } else {
    const last3 = intStr.slice(-3);
    const rest = intStr.slice(0, -3);
    const groups: string[] = [];
    let remaining = rest;
    while (remaining.length > 2) {
      groups.unshift(remaining.slice(-2));
      remaining = remaining.slice(0, -2);
    }
    if (remaining) groups.unshift(remaining);
    result = groups.join(",") + "," + last3;
  }

  return sign + result + (decPart !== undefined ? "." + decPart : "");
}

/**
 * Format a currency value.
 */
export function formatCurrency(
  num: number,
  symbol: string,
  format: "international" | "indian",
  decimalPlaces = 2
): string {
  const formatted =
    format === "indian"
      ? formatIndianNumber(num, decimalPlaces)
      : num.toLocaleString("en-US", { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces });
  return `${symbol}${formatted}`;
}

/**
 * Format a number for display (no currency symbol).
 */
export function formatNumber(
  num: number,
  format: "international" | "indian",
  decimalPlaces?: number
): string {
  return format === "indian"
    ? formatIndianNumber(num, decimalPlaces)
    : decimalPlaces !== undefined
    ? num.toLocaleString("en-US", { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces })
    : String(num);
}
