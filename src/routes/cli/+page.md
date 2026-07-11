## CLI

You can play Hadronize in a terminal or even a browser console if you want!

![Screenshot of Hadronize CLI in terminal](./terminal_screenshot.png)

### Quickstart

To play Hadronize CLI in your terminal, you can just use the command below. No installation or repo cloning needed!

```sh
deno run -A http://ethmarks.github.io/hadronize/cli.ts
```

If you don't have [Deno](https://deno.com/) installed, you can also run it using any of the other JS package managers via the [Deno binary on npm](https://www.npmjs.com/package/deno).

- npm
  ```sh
  npx deno run -A http://ethmarks.github.io/hadronize/cli.ts
  ```
- pnpm
  ```sh
  pnpm dlx deno run -A http://ethmarks.github.io/hadronize/cli.ts
  ```
- bun
  ```sh
  bunx deno run -A http://ethmarks.github.io/hadronize/cli.ts
  ```

### Native

If you want to run it natively (i.e. not proxied through Deno if you're using Node or Bun), you can clone the repo and run the `cli` script:

  ```sh
  git clone https://github.com/ethmarks/hadronize.git
  cd hadronize
  ```

- npm
  ```sh
  npm install
  npm run cli
  ```
- pnpm
  ```sh
  pnpm install
  pnpm run cli
  ```
- deno
  ```sh
  deno task cli
  ```
- bun
  ```sh
  bun install
  bun run cli
  ```

### Browser

You can also play Hadronize in the browser console. Just [start a browser game](./play), open your browser console with <kbd>F12</kbd>, and type the name of the player you want to target on your turn into the console.

![Screenshot of Hadronize CLI in browser console](./console_screenshot.png)
