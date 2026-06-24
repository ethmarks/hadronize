// @ts-nocheck

const { default: pc } =
  "Deno" in globalThis
    ? await import(/* @vite-ignore */ "npm:picocolors")
    : await import("picocolors");

export default pc;

// https://github.com/alexeyraspopov/picocolors/blob/main/types.d.ts#L1
export type Formatter = (input: string | number | null | undefined) => string;
