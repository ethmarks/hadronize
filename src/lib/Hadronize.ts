import {
  Chamber,
  Player,
  validatePlayerInits,
  type Driver,
  type PlayerInit,
  type Scratchpad,
} from "./Player";
import {
  prngFlavor,
  type Flavor,
  Quark,
  Hadron,
  type Superposition,
} from "./Quark";

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

/**
 * The number of hadronized quarks required to win. Traditionally, should be 10.
 */
const WINNING_HADRON_COUNT = 10;

export type Reaction = "no reaction" | "hadronized" | "tunneled";

/**
 * Possible return values for executeTurn().
 *
 * * If a number is returned, it represents the order number of the winning
 * player.
 * * If the string "too many turns" is returned, the turn limit has been
 * exceeded.
 * * If undefined is returned, the game is still in progress.
 */
export type Result = number | "too many turns" | undefined;

export interface Observation {
  /**
   * The order number of the observer player.
   */
  observer: number;

  /**
   * What kind of reaction the observation resulted in.
   */
  reaction: Reaction;

  /**
   * What flavor the activeQuark collapsed into.
   */
  activeFlavor: Flavor;
}

export interface PlayerState {
  /**
   * The player's order.
   *
   * Order number is how drivers refer to players and select them as
   * observers.
   */
  order: number;

  /**
   * The name of the player.
   */
  name: string;

  /**
   * Only the flavors of the quarks in the player chamber are public
   * information.
   */
  chamber: Flavor[];

  /**
   * The number of hadronized quarks.
   */
  score: number;
}

interface BaseGameState {
  /**
   * The turn count.
   */
  turn: number;

  /**
   * The order number of the active player.
   */
  activePlayer: number;

  /**
   * Only the flavors of the superposition are public information.
   */
  activeQuark: Superposition;

  players: PlayerState[];
}

export interface PastGameState extends BaseGameState {
  /**
   * The observation on this turn.
   */
  observation: Observation;
}

export interface CurrentGameState extends BaseGameState {
  /**
   * An array of all previous game states.
   */
  timeline: PastGameState[];
}

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
  public turn: number = 0;

  /**
   * The current game state.
   */
  public state: CurrentGameState | undefined = undefined;

  public mostRecentObservation: Observation | undefined = undefined;

  public result: Result = undefined;

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
      const superposFlavors: Superposition = [
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
      const player = new Player(index, playerInit.name, playerInit.driver);

      // Add starting quarks to chamber
      Array.from({ length: STARTING_QUARK_COUNT }).forEach(() => {
        const quark = this.nextQuarkIndex();
        this.quarks[quark].collapse();
        player.chamber.indices.push(quark);
      });

      return player;
    });

    // Set turn counter to 1 and begin the game!
    this.turn = 1;
  }

  /**
   * Gets the next unused quark in this.quarks.
   */
  nextQuarkIndex(): number {
    this.usedQuarks++;
    return this.usedQuarks - 1;
  }

  /**
   * Produces a new superposed quark (a.k.a. activeQuark).
   */
  produceQuark(): void {
    if (this.activeQuark !== undefined) {
      throw new Error(
        "produceQuark() was called, but this.activeQuark already exists!",
      );
    }

    const nextIndex = this.nextQuarkIndex();

    if (nextIndex > this.quarks.length) {
      throw new Error("Ran out of quarks!");
    }
    this.activeQuark = nextIndex;
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
  observeQuark(observingPlayer: Player, activePlayer: Player): Observation {
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

    let reaction: Reaction;

    // If no reaction, return early.
    if (willReact) {
      // Determine which kind of reaction will occur.
      if (observingPlayer.order === activePlayer.order) {
        this.hadronizeQuarks(activeFlavor, activePlayer.chamber);
        reaction = "hadronized";
      } else {
        this.tunnelQuarks(
          activeFlavor,
          observingPlayer.chamber,
          activePlayer.chamber,
        );
        reaction = "tunneled";
      }
    } else {
      reaction = "no reaction";
    }

    const observation: Observation = {
      activeFlavor,
      reaction,
      observer: observingPlayer.order,
    };

    this.mostRecentObservation = observation;
    return observation;
  }

  get activePlayer(): Player {
    return this.players[(this.turn - 1) % this.players.length];
  }

  /**
   *
   * This should only be run at the beginning of a turn, after the turn has been
   * incremented and the new activeQuark has been set.
   *
   * @returns
   */
  updateState(): CurrentGameState {
    const currentState = this.state;

    // Validate
    if (this.turn === 0) {
      throw new Error(
        "updateState() should not be called when the game is being set up.",
      );
    }
    if (this.activeQuark === undefined) {
      throw new Error(
        "updateState() was called when activeQuark was undefined.",
      );
    }
    if (currentState?.timeline?.some((state) => state.turn === this.turn)) {
      throw new Error(
        `updateState() should only be called once per turn, but a timeline entry with the current turn (${this.turn}) was found.`,
      );
    }

    const newState: CurrentGameState = {
      turn: this.turn,
      activePlayer: this.activePlayer.order,
      activeQuark: this.quarks[this.activeQuark].superposition,
      players: this.players.map((player) => {
        return {
          order: player.order,
          name: player.name,
          chamber: player.chamber.indices.map(
            (index) => this.quarks[index].flavor,
          ),
          score: player.score,
        };
      }),
      timeline: [],
    };

    // This runs if there are any past states to add to the timeline
    if (currentState !== undefined) {
      // This runs on all subsequent turns.

      const { timeline, ...previousState } = currentState;

      const previousObservation = this.mostRecentObservation;
      if (previousObservation === undefined) {
        throw new Error("previousObservation should not be undefined");
      }

      newState.timeline = [
        ...timeline,
        { ...previousState, observation: previousObservation },
      ];
    }

    this.state = newState;
    return newState;
  }

  printState() {
    console.log(`It is turn #${this.turn}`);

    this.players.forEach((player) => {
      console.log(
        `${player.name} has ${player.chamber.indices.map((index) => this.quarks[index].flavor[0].toLowerCase())} in their chamber and ${player.score} hadronized quarks.`,
      );
    });

    if (this.activeQuark === undefined) {
      console.log("The next quark hasn't been produced yet.");
    } else {
      console.log(
        `The next quark is '${this.quarks[this.activeQuark].flavor}'`,
      );
    }
  }

  /**
   * Executes one game turn from end-to-end.
   *
   * @returns
   */
  executeTurn(): Result {
    this.produceQuark();

    const state = this.updateState();

    const observerOrder = this.activePlayer.driver(
      state,
      this.activePlayer.scratchpad,
    );

    const observer = this.players[observerOrder];

    this.observeQuark(observer, this.activePlayer);

    this.turn++;

    // Check for winners _before_ we check if the turn limit has been exceeded.
    for (const player of this.players) {
      if (player.score >= WINNING_HADRON_COUNT) {
        this.result = player.order;
        return this.result;
      }
    }

    // Check if the turn limit has been exceeded.
    if (this.turn >= TURN_LIMIT || this.usedQuarks >= this.quarks.length) {
      this.result = "too many turns";
      return this.result;
    }
  }
}

// const hadronizeDriver: Driver = (s: CurrentGameState, p: Scratchpad): number =>
//   s.activePlayer;

// const game = new Hadronize(1, [
//   { name: "alice", driver: hadronizeDriver },
//   { name: "bob", driver: hadronizeDriver },
// ]);

// let i = 0;
// while (game.executeTurn() === undefined) {
//   i++;
// }

// console.log(JSON.stringify(game.state));
