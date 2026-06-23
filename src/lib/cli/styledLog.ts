/**
 * A utility to print styled text to the terminal that works across Node, Deno,
 * Bun, and browsers.
 */

import pc from "../deps/picocolors.ts";

// https://github.com/alexeyraspopov/picocolors/blob/main/types.d.ts#L1
type Formatter = (input: string | number | null | undefined) => string;

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

const outputType: "ansi" | "css" | "none" = isBrowser ? "css" : "ansi";

/**
 * **S**tyled **L**og.
 *
 * Logs text to the console with styles that work both in Node and in
 * browser consoles.
 *
 * @param chunks All chunks are concatenated together after the styles are
 * applied.
 * @param outputType "ansi" for ANSI escape codes that work in Node and
 * "css" for %c substitions that work in the browser.
 */
export function sl(
  chunks: slChunk[],
  outputFunc: (...data: any[]) => void = console.log,
) {
  if (outputType === "ansi") {
    // We make the styles using ANSII escape codes

    const string = chunks.reduce((acc, chunk) => {
      if (Array.isArray(chunk)) {
        const text = chunk[0];
        const style = chunk[1];

        return (acc += STYLE_MAPPING[style].ansi(text));
      } else {
        return (acc += chunk);
      }
    }, "");

    outputFunc(string);
  } else if (outputType === "css") {
    // We make the styles using %c placeholders and an array of styles

    const styles: string[] = [];

    const string = chunks.reduce((acc, chunk) => {
      if (Array.isArray(chunk)) {
        const text = chunk[0];
        const style = chunk[1];

        styles.push(STYLE_MAPPING[style].css);
        return (acc += `%c${text}`);
      } else {
        // Reset
        styles.push("");
        return (acc += `%c${chunk}`);
      }
    }, "");

    outputFunc(string, ...styles);
  } else {
    outputFunc(
      chunks.reduce(
        (acc, chunk) => (acc += Array.isArray(chunk) ? chunk[0] : chunk),
        "",
      ),
    );
  }
}

export default sl;
