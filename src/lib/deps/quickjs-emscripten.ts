export const { getQuickJS, shouldInterruptAfterDeadline } =
  "Deno" in globalThis
    ? await import(/* @vite-ignore */ `${"npm:"}quickjs-emscripten`)
    : await import("quickjs-emscripten");

export type QuickJSContext = any;
export type QuickJSHandle = any;
