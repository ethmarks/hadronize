// @ts-nocheck

/**
 * For Deno
 */

// jsdelivr has a 7-day cache if you don't add a version specifier, so this
// won't fetch the absolute latest version, even though it's the simplest and
// most performant.
// const url = "https://cdn.jsdelivr.net/gh/ethmarks/hadronize/mod.ts";

const res = await fetch(
  "https://api.github.com/repos/ethmarks/hadronize/commits",
);
const commits = await res.json();
const version = commits[0].sha.substring(0, 7);

const demo = await import(
  `https://cdn.jsdelivr.net/gh/ethmarks/hadronize@${version}/mod.ts`
);
await demo();
