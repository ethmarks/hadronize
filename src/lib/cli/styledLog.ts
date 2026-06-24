/**
 * A utility to print styled text to the terminal that works across Node, Deno,
 * Bun, and browsers.
 */

import pc, { type Formatter } from "../deps/picocolors.ts";

const STYLE_MAPPING = {
  red: { ansi: pc.red, css: "color: #ef657a;" },
  yellow: { ansi: pc.yellow, css: "color: #e5c07b;" },
  green: { ansi: pc.green, css: "color: #98c379;" },
  cyan: { ansi: pc.cyan, css: "color: #4db6ac;" },
  blue: { ansi: pc.blue, css: "color: #5dafef;" },
  magenta: { ansi: pc.magenta, css: "color: #c678dd;" },
  gray: { ansi: pc.gray, css: "color: #abb2bf;" },
  white: { ansi: pc.white, css: "color: #abb2bf;" },

  bold: { ansi: pc.bold, css: "font-weight: bold;" },
  italic: { ansi: pc.italic, css: "font-style: italic;" },
  reset: { ansi: pc.reset, css: "" },
} as const satisfies Record<string, { ansi: Formatter; css: string }>;

export type Style = keyof typeof STYLE_MAPPING;

export type slChunk = [string, Style] | string;

const isBrowser =
  typeof window !== "undefined" && typeof window.document !== "undefined";

/**
 * **S**tyled **L**og.
 *
 * Logs text to the console with styles that work both in Node and in
 * browser consoles.
 *
 * @param chunks All chunks are concatenated together after the styles are
 * applied.
 * @param medium Controls how styles are rendered. Defaults to either "console"
 * or "terminal" depending on whether its running in a browser.
 * * "terminal": styles use ANSI escape codes that work in terminal emulators.
 * * "console": styles use %c substitions that work in browser consoles.
 * * "html": styles use inline style attributes that work when injected into a
 * webpage.
 * * "plain": ignores styles and only concatenates plain text.
 * @param output Whether to output the result using console.log(). Defaults to true.
 */
export function sl(
  chunks: slChunk[],
  medium: "terminal" | "console" | "html" | "plain" = isBrowser
    ? "console"
    : "terminal",
  output: boolean = true,
): string {
  let str: string = "";

  if (medium === "terminal") {
    // We make the styles using ANSI escape codes

    chunks.forEach((chunk) => {
      if (Array.isArray(chunk)) {
        const text = chunk[0];
        const style = chunk[1];

        str += STYLE_MAPPING[style].ansi(text);
      } else {
        str += chunk;
      }
    });

    if (output) console.log(str);
  } else if (medium === "console") {
    // We make the styles using %c placeholders and an array of styles

    const styles: string[] = [];

    chunks.forEach((chunk) => {
      if (Array.isArray(chunk)) {
        const text = chunk[0];
        const style = chunk[1];

        styles.push(STYLE_MAPPING[style].css);
        str += `%c${text}`;
      } else {
        // Reset
        styles.push("");
        str += `%c${chunk}`;
      }
    });

    if (output) console.log(str, ...styles);
  } else if (medium === "html") {
    // We make the styles using inline `style` attributes

    chunks.forEach((chunk) => {
      if (Array.isArray(chunk)) {
        const text = chunk[0].replaceAll("\n", "<br>");
        const style = chunk[1];

        str += `<span style="${STYLE_MAPPING[style].css}">${text}</span>`;
      } else {
        str += chunk;
      }
    });

    // There's really no reason to output the HTML and output should always be
    // false if html mode is selected, but for consistency we still make it an
    // option.
    if (output) console.log(str);
  } else if (medium === "plain") {
    // We disregard the styles

    chunks.forEach((chunk) => {
      str += Array.isArray(chunk) ? chunk[0] : chunk;
    });

    if (output) console.log(str);
  }

  return str;
}

export default sl;
