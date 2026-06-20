import pc from "picocolors";

// https://github.com/alexeyraspopov/picocolors/blob/main/types.d.ts#L1
type Formatter = (input: string | number | null | undefined) => string;

const STYLE_MAPPING = {
  red: { ansi: pc.red, css: "color: #ff0000;" },
  yellow: { ansi: pc.yellow, css: "color: #ffff00;" },
  green: { ansi: pc.green, css: "color: #00ff00;" },
  cyan: { ansi: pc.cyan, css: "color: #077362;" },
  blue: { ansi: pc.blue, css: "color: #5dafef;" },
  magenta: { ansi: pc.magenta, css: "color: #800080;" },
  gray: { ansi: pc.gray, css: "color: #808080;" },
  white: { ansi: pc.white, css: "color: #ffffff;" },

  bold: { ansi: pc.bold, css: "font-weight: bold;" },
  italic: { ansi: pc.italic, css: "font-style: italic;" },
} as const satisfies Record<string, { ansi: Formatter; css: string }>;

export type Style = keyof typeof STYLE_MAPPING;

export type slChunk = { text: string; style?: Style };

const isBrowser =
  typeof window !== "undefined" && typeof window.document !== "undefined";

// const outputType: "ansi" | "css" | "none" = isBrowser ? "css" : "ansi";
const outputType: "ansi" | "css" | "none" = "ansi";

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

    const string = chunks.reduce((acc, { text, style }) => {
      if (style === undefined) {
        return (acc += text);
      } else {
        return (acc += STYLE_MAPPING[style].ansi(text));
      }
    }, "");

    outputFunc(string);
  } else if (outputType === "css") {
    // We make the styles using %c placeholders and an array of styles

    const styles: string[] = [];

    const string = chunks.reduce((acc, { text, style }) => {
      if (style === undefined) {
        // Reset
        styles.push("");
        return (acc += `%c${text}`);
      } else {
        styles.push(STYLE_MAPPING[style].css);
        return (acc += `%c${text}`);
      }
    }, "");

    outputFunc(string, ...styles);
  } else {
    outputFunc(chunks.reduce((acc, { text, style }) => (acc += text), ""));
  }
}

export default sl;
