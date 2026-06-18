import { Player, validatePlayerInits, type PlayerInit } from "./Player";
import { prngFlavor, type Flavor, Quark } from "./Quark";

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
   * The quark currently in superposition.
   */
  public activeQuark: Quark;

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
        const quark = this.nextQuark();
        quark.collapse();
        player.chamber.push(quark);
      });

      return player;
    });

    // Initialize the first new quark
    this.activeQuark = this.nextQuark();

    // Set turn counter to 1 and begin the game!
    this.turnCount = 1;
  }

  /**
   * Gets the next unused quark in this.quarks.
   */
  nextQuark() {
    this.usedQuarks++;
    return this.quarks[this.usedQuarks - 1];
  }
}

// const game = new Hadronize(87539319, [{ name: "ethan" }]);
// console.log(game.players[0].chamber[0].collapsedInfo);
