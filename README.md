# Hadronize

[![Demo](https://img.shields.io/badge/demo-live-green)](https://ethmarks.github.io/hadronize/)
[![GitHub](https://img.shields.io/badge/github-repo-blue?logo=github)](https://github.com/ethmarks/hadronize)

Quark-themed set collection game you can play in your browser.

![Hadronize banner](./src/lib/assets/banner2.png)

## Quickstart

> [!TIP]
> **The recommended starting point is <https://ethmarks.github.io/hadronize/how>.**

If you'd like to jump right in without reading the rules or instructions, you can either visit <https://ethmarks.github.io/hadronize/play> to play in your browser, or you can run the following command to play in your terminal:

```sh
npx deno run -A http://ethmarks.github.io/hadronize/cli.ts
```

## Features

- **Layout optimization engine**: The [Hadronize web UI](https://ethmarks.github.io/hadronize/play) uses a custom layout algorithm to ensure that all elements remain visible and readable on *all* screen sizes, using a virtual layout plan and an escalating series of compromises for small screens and high element counts. This lets the web UI work seamlessly on desktop, mobile, and *any* browser environment without using hardcoded breakpoints.
- **User-created bots**: Players can be controlled by bots whose source code can be altered on-the-fly at runtime in the [bot editor](https://ethmarks.github.io/hadronize/bots).
- **CLI that also works in the browser console**: The [Hadronize CLI](https://ethmarks.github.io/hadronize/cli) can run in Node, Deno, Bun, and the browser console. The first three required making the entire codebase a polyglot that only uses the subset of TypeScript that both Node and Deno support without a compatibility layer. To make the browser console accept user input, I used a trick involving dynamically created named window properties.
- **Comprehensive test suite**: 120 total unit tests that verify that the game logic is implemented correctly and detect regressions.
- **Easy onboarding**: [How to play page](https://ethmarks.github.io/hadronize/how) that explains how the rules and how to use the UI in 3-4 minutes assuming zero knowledge.

## Acknowledgements

- Thanks to Exploding Kittens for making [Mantis](https://www.explodingkittens.com/products/mantis), which Hadronize is _heavily_ inspired by.
- Thanks to [Evgeny Orekhov](https://github.com/EvgenyOrekhov) for making [holiday.css](https://holidaycss.js.org/), which is used as a base for the website styles (though the actual game UI was made entirely by me).
- Thanks to [Fabrice Bellard](https://github.com/bellard) for making [QuickJS](https://github.com/bellard/quickjs) and to [Jake Teton-Landis](https://github.com/justjake) for [porting it to WASM](https://github.com/justjake/quickjs-emscripten), which is used for running the drivers.
- Thanks to [Jonas Pytte](https://github.com/jonpyt) for making [Prism code editor](https://github.com/jonpyt/prism-code-editor), which is used for the IDE in the bot editor.
- Thanks to [Oleksii](https://github.com/alexeyraspopov) for making [picocolors](https://github.com/alexeyraspopov/picocolors), which is used for the ANSI colors in the CLI.

## License

This project is under an MIT License. See [LICENSE](LICENSE) for more
information.
