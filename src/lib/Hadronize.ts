import {
  Chamber,
  Player,
  validatePlayerInits,
  type PlayerInit,
} from "./Player";
import { prngFlavor, type Flavor, Quark, Hadron } from "./Quark";

/**
 * The maximum number of turns before the game is declared a draw. Also used to determine how many quarks to pregenerate.
 *
 * Set this to such a big number that players are unlikely to hit it, but not
 * too large a number that pregenerating the quarks will take too long.
 */
const TURN_LIMIT = 300;

/**
 * The number of quarks each player starts with. Traditionally, should be 4.
 */
const STARTING_QUARK_COUNT = 4;

export type ObservationResult = {
  type: "no reaction" | "hadronized" | "tunneled";
  activeFlavor: Flavor;
};

export class Hadronize {
  /**
   * All extant quarks.
   *
   * Shallowly immutable, so you can modify the quarks inside, but you can't
   * add or remove them.
   */
  public quarks: readonly Quark[];

  /**
   * All players.
   *
   * Shallowly immutable, so you can modify the players, but you can't
   * add or remove them.
   */
  public players: readonly Player[];

  /**
   * The number of quarks from this.quarks that have been used. Increments each time this.nextQuark is called.
   */
  public usedQuarks: number = 0;

  /**
   * The index of the quark currently in superposition, if any.
   */
  public activeQuark: number | undefined;

  /**
   * * 0 while the game is being initialized.
   * * 1 on the first turn
   * * 2 on the second turn
   * * etc
   */
  public turnCount: number = 0;

  constructor(seed: number, playerInits: PlayerInit[]) {
    // https://github.com/cprosche/mulberry32
    function mulberry32(seed: number) {
      return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    // rng is intentionally scoped to the constructor. If something involves
    // randomness, it MUST be set in the constructor. This enforces determinism.
    const rng = mulberry32(seed);

    // Initialize quarks
    const quarkCount =
      TURN_LIMIT + playerInits.length * STARTING_QUARK_COUNT + 10;
    this.quarks = Array.from({ length: quarkCount }, (_, index) => {
      const superposFlavors: [Flavor, Flavor, Flavor] = [
        prngFlavor(rng()),
        prngFlavor(rng()),
        prngFlavor(rng()),
      ];

      const flavor =
        superposFlavors[Math.floor(rng() * superposFlavors.length)];

      return new Quark(index, flavor, superposFlavors);
    });

    // Initialize players
    validatePlayerInits(playerInits);
    this.players = playerInits.map((playerInit, index) => {
      const player = new Player(index, playerInit.name);

      // Add starting quarks to chamber
      Array.from({ length: STARTING_QUARK_COUNT }).forEach(() => {
        const quark = this.nextQuarkIndex();
        this.quarks[quark].collapse();
        player.chamber.indices.push(quark);
      });

      return player;
    });

    // Initialize the first active quark
    this.activeQuark = this.nextQuarkIndex();

    // Set turn counter to 1 and begin the game!
    this.turnCount = 1;
  }

  /**
   * Gets the next unused quark in this.quarks.
   */
  nextQuarkIndex(): number {
    this.usedQuarks++;
    return this.usedQuarks - 1;
  }

  /**
   * Tunnels quarks all non-hadronized quarks of a specified flavor from one
   * chamber to another.
   *
   * @param flavor The flavor of quarks to tunnel.
   * @param from The chamber the quarks tunnel from.
   * @param to The chamber the quarks tunnel to.
   */
  tunnelQuarks(flavor: Flavor, from: Chamber, to: Chamber) {
    const quarksToTunnel = from.indices.filter((index) => {
      const quark = this.quarks[index];
      return quark.flavor === flavor;
    });
    to.indices.push(...quarksToTunnel);

    // Remove the quarks that tunneled from the `from` chamber
    from.indices = from.indices.filter((index) => {
      const quark = this.quarks[index];
      return quark.flavor !== flavor;
    });
  }

  /**
   * Hadronizes all quarks of a specified flavor in a chamber.
   *
   * @param flavor The flavor of quarks to hadronized.
   * @param player The chamber that quarks the quarks hadronize in.
   */
  hadronizeQuarks(flavor: Flavor, chamber: Chamber) {
    const hadronizedQuarks: number[] = [];
    chamber.indices.forEach((index) => {
      const quark = this.quarks[index];
      if (quark.flavor === flavor) {
        quark.hadronize();
        hadronizedQuarks.push(index);
      }
    });

    // Remove the quarks that hadronized from the chamber
    chamber.indices = chamber.indices.filter(
      (index) => this.quarks[index].flavor !== flavor,
    );
    chamber.hadrons.push(new Hadron(hadronizedQuarks));
  }

  /**
   * Collapses the current active quark into the observing player's chamber and
   * simulates subsequent reactions, if any.
   *
   * @param observingPlayer
   * @param activePlayer
   * @returns
   */
  observeQuark(
    observingPlayer: Player,
    activePlayer: Player,
  ): ObservationResult {
    if (this.activeQuark === undefined) {
      throw new Error("Cannot observe when there is no active quark!");
    }

    const activeFlavor = this.quarks[this.activeQuark].flavor;

    // Determine whether or not the observer's chamber has a quark
    // with the same flavor as the active quark.
    //
    // This step must happen _before_ we move the quark to the observing
    // player's chamber.
    const willReact = observingPlayer.chamber.indices.some(
      (index) => this.quarks[index].flavor === activeFlavor,
    );

    // Move active quark to observing player's chamber.
    observingPlayer.chamber.indices.push(this.activeQuark);

    // Collapse the active quark.
    this.quarks[this.activeQuark].collapse();

    // Reset the active quark now that it's been moved.
    this.activeQuark = undefined;

    // If no reaction, return early.
    if (!willReact) {
      return { activeFlavor, type: "no reaction" };
    }

    // Determine which kind of reaction will occur.
    if (observingPlayer.id === activePlayer.id) {
      this.hadronizeQuarks(activeFlavor, activePlayer.chamber);
      return { activeFlavor, type: "hadronized" };
    } else {
      this.tunnelQuarks(
        activeFlavor,
        observingPlayer.chamber,
        activePlayer.chamber,
      );
      return { activeFlavor, type: "tunneled" };
    }
  }
}

// const game = new Hadronize(1, [{ name: "alice" }]);
// const alice = game.players.find((p) => p.name === "alice")!;
// console.log(alice.chamber.indices.map((i) => game.quarks[i].flavor));
// console.log(game.observeQuark(alice, alice));
// console.log(alice.chamber);
