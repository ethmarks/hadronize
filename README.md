# Hadronize

Quark-themed set collection game you can play in your browser

## How to use

Hadronize is still under very heavy development, and right now the only usable part of Hadronize is the CLI. However, the CLI is (mostly) fully-functional, and you can use in a few different ways.

### Browser

The easiest way to play Hadronize CLI is to visit <https://ethmarks.github.io/hadronize/cli>, where you can play it entirely in your browser console (yes, really!).

### Deno

To play Hadronize CLI in [Deno](https://deno.com/), you can just use the command below. No repo cloning needed!

```sh
deno run -A http://ethmarks.github.io/hadronize/cli.ts
```

### Node/Bun

To play Hadronize CLI in [Node](https://nodejs.org/) or [Bun](https://bun.sh/), you'll need to clone the repo and run the `cli` script.

```sh
# Clone the repo
git clone https://github.com/ethmarks/hadronize.git
cd hadronize

# Run with Node (via npm or pnpm)
npm install
npm run cli

# Run with Bun
bun install
bun run cli
```

## Rules

- 2-6 players
- ~10 minutes per game

### Goal

Be the first player to hadronize 10 or more quarks.

### Quarks

**Quarks** are the fundamental game mechanic in Hadronize. There are
[6 different flavors](https://en.wikipedia.org/wiki/Quark#Classification) of
quark: up, down, strange, charm, bottom, and top.

**Superposed Quarks** are quarks in a state of superposition between three
different flavors. The flavors of the superposition are public information and
can be seen by all players. Upon being observed, the superposition collapses
into one of the flavors, and the superposed quark becomes a normal quark. It is
impossible to tell which flavor the quark will ahead into ahead of time.

### Setup

At the start of the game, each player starts with 4 collapsed quarks with
randomly-chosen flavors. Each player's collection of quarks is called a
[**Cloud Chamber**](https://en.wikipedia.org/wiki/Cloud_chamber). Cloud chambers
can hold an unlimited number of quarks.

### Gameplay

Starting from a randomly-chosen starting player, play proceeds clockwise.

On each turn, a new superposed quark is produced out of vacuum fluctuations. The
active player must select any player (**including themselves**), who will then
observe the new quark. Upon observation, the superposed quark collapses into one
of its three possible flavors and is added to the observing player's cloud
chamber.

If the observing player did _not_ already have any quarks of the same flavor as
the new quark in their cloud chamber, the turn ends and play proceeds to the
next player.

If the observing player already had at least one quark of the same flavor as the
new quark, the new quark reacts with the existing quarks in a way that depends
on which player observed the quark.

**If the observing player is the same as the active player**: the new quark
reacts with all existing quarks of the same flavor, and they all **hadronize**
together. Hadronized quarks can _NOT_ react with new quarks, but they count
towards the active player's score.

**If the observing player is different from the active player**: the new quark
reacts with all existing quarks of the same flavor, and they all **quantum
tunnel** from the observing player's chamber into the active player's cloud
chamber. Quarks can _NOT_ hadronize immediately after quantum tunneling, but on
all subsequent turns they can react, hadronize, and quantum tunnel just like
normal.

Once the new quark is added and the reaction completes, the turn ends and play
proceeds to the next player.

### Examples

Alice has three charm quarks but zero strange quarks in her cloud chamber, and
Bob has three strange quarks but zero charm quarks in his cloud chamber. It is
Alice's turn. A new superposed quark appears, and Alice sees that its
superposition is between charm, strange, and up. Alice...

- ...makes herself observe the new quark. It collapses in her cloud chamber,
  into a...
  - ...charm quark. It reacts with Alice's existing charm quarks, and the four
    (3 existing + 1 new) quarks hadronize. Alice is now four hadronized quarks
    closer to winning.
  - ...strange quark. It does nothing because Alice doesn't have any existing
    strange quarks for it to react with. Alice now has a strange quark in her
    cloud chamber.
- ...makes Bob observe the new quark. It collapses in his cloud chamber, into
  a...
  - ...charm quark. It does nothing because Bob doesn't have any charm quarks
    for it to react with. Bob now has a charm quark in his cloud chamber and
    Alice's cloud chamber is unchanged.
  - ...strange quark. It reacts with Bob's existing strange quarks, and the four
    (3 existing + 1 new) quarks quantum tunnel into Alice's cloud chamber. Alice
    now has four strange quarks in her cloud chamber and Bob has zero strange
    quarks in his cloud chamber.

## Acknowledgements

The rules/mechanics of Hadronize are _heavily_ inspired by the card game
[Mantis](https://www.explodingkittens.com/products/mantis) by Exploding Kittens.
My original intention was to just create a digital version of Mantis, but I was
concerned about copyright, so instead I created a separate game with _very_
similar rules to Mantis (though there are some differences) with a quantum
physics theme of my own design.

## License

This project is under an MIT License. See [LICENSE](LICENSE) for more
information.
