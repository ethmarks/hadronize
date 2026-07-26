// @ts-nocheck

/**
 * For Deno remote scripts
 */

const url = "https://cdn.jsdelivr.net/gh/ethmarks/hadronize/mod.ts";

const { demo } = await import(url);
await demo();
