import { prngDriver } from "./drivers/prng.ts";
import {
  Chamber,
  Player,
  validatePlayerInits,
  type PlayerInit,
} from "./Player.ts";
import {
  prngFlavor,
  type Flavor,
  Quark,
  Hadron,
  type Superposition,
  SUPERPOSITION_SIZE,
} from "./Quark.ts";

/**
 * The maximum number of turns before the game is declared a draw. Also used to determine how many quarks to pregenerate.
 *
 * Set this to such a big number that players are unlikely to hit it, but not
 * too large a number that pregenerating the quarks will take too long.
 */
export const TURN_LIMIT = 300;

/**
 * The number of quarks each player starts with. Traditionally, should be 4.
 */
export const STARTING_QUARK_COUNT = 4;

/**
 * The number of hadronized quarks required to win. Traditionally, should be 10.
 */
export const WINNING_HADRON_COUNT = 10;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

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
   * What flavor the superposedQuark collapsed into.
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
  superposedQuark: Superposition;

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

export interface HookContext {
  turn: number;
  state: CurrentGameState;
  observer: Player;
  observation: Observation;
}

/**
 * The main game class.
 */
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
  public superposedIndex: number | undefined;

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
      // This is the old superposition generator. It relied on a hardcoded
      // SUPERPOSITION_SIZE and sometimes generated non-unique values.
      //
      // const superposFlavors: Superposition = [
      //   prngFlavor(rng()),
      //   prngFlavor(rng()),
      //   prngFlavor(rng()),
      // ];

      // This is the new superposition generator. It leverages the fact that if
      // you try to add an element to a Set that it already has, it silently
      // rejects the new element.
      const flavorSet = new Set<Flavor>();
      while (flavorSet.size < SUPERPOSITION_SIZE) {
        flavorSet.add(prngFlavor(rng()));
      }
      const superposFlavors: Superposition = Array.from(
        flavorSet,
      ) as Superposition;

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
        // Produce a new quark.
        const quarkIndex = this.produceQuark();

        // Collapse the quark.
        this.quarks[quarkIndex].collapse();

        // Add the quark to the player's chamber.
        player.chamber.indices.push(quarkIndex);

        // Reset the quark now that we've moved it to a chamber.
        this.superposedIndex = undefined;
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
   * Produces a new superposed quark (a.k.a. superposedQuark).
   */
  produceQuark(): number {
    if (this.superposedIndex !== undefined) {
      throw new Error(
        "produceQuark() was called, but this.superposedQuark already exists!",
      );
    }

    const nextIndex = this.usedQuarks;

    // To avoid errors from trying to access an index out of bounds
    if (nextIndex > this.quarks.length) {
      throw new Error("Ran out of quarks!");
    }

    this.quarks[nextIndex].produce();

    this.superposedIndex = nextIndex;
    this.usedQuarks++;

    return nextIndex;
  }

  /**
   * Tunnels all non-hadronized quarks of a specified flavor from one
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

  setChamberFlavor(chamber: Chamber, flavor: Flavor): void {
    chamber.indices.forEach((index) => {
      const quark = this.quarks[index];
      quark.flavor = flavor;
    });
  }

  /**
   * Executes any reactions specified by an observation.
   *
   * @param observation The observation returned by executeObservation().
   * @param activePlayer The player whose turn it is.
   */
  executeReaction(observation: Observation, activePlayer: Player): void {
    if (observation.reaction === "hadronized") {
      this.hadronizeQuarks(observation.activeFlavor, activePlayer.chamber);
    } else if (observation.reaction === "tunneled") {
      this.tunnelQuarks(
        observation.activeFlavor,
        this.players[observation.observer].chamber,
        activePlayer.chamber,
      );
    }
  }

  /**
   * Collapses the superposed quark into the observing player's chamber.
   *
   * @param observingPlayer
   * @param activePlayer
   * @returns
   */
  executeObservation(
    observingPlayer: Player,
    activePlayer: Player,
  ): Observation {
    if (this.superposedIndex === undefined) {
      throw new Error("Cannot observe when there is no active quark!");
    }

    const activeFlavor = this.quarks[this.superposedIndex].flavor;

    // Determine whether or not the observer's chamber has a quark
    // with the same flavor as the superposed quark.
    //
    // This step must happen _before_ we move the quark to the observing
    // player's chamber.
    const willReact = observingPlayer.chamber.indices.some(
      (index) => this.quarks[index].flavor === activeFlavor,
    );

    // Move superposed quark to observing player's chamber.
    observingPlayer.chamber.indices.push(this.superposedIndex);

    // Collapse the superposed quark.
    this.quarks[this.superposedIndex].collapse();

    // Reset the superposed quark now that it's been moved.
    this.superposedIndex = undefined;

    let reaction: Reaction;

    // Determine which kind of reaction will occur.
    if (willReact) {
      if (observingPlayer.order === activePlayer.order) {
        reaction = "hadronized";
      } else {
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
   * incremented and the new superposedQuark has been set.
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
    if (this.superposedIndex === undefined) {
      throw new Error(
        "updateState() was called when superposedQuark was undefined.",
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
      superposedQuark: this.quarks[this.superposedIndex].superposition,
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

  /**
   * Executes one game turn from end-to-end.
   *
   * @returns
   */
  async executeTurn(
    hooks?: Partial<{
      pre: (
        ctx: Omit<HookContext, "state" | "observer" | "observation">,
      ) => Promise<void>;
      preDriver: (
        ctx: Omit<HookContext, "observer" | "observation">,
      ) => Promise<void>;
      preObservation: (ctx: Omit<HookContext, "observation">) => Promise<void>;
      preReaction: (ctx: HookContext) => Promise<void>;
      preChecks: (ctx: HookContext) => Promise<void>;
      preTurnIncrement: (ctx: HookContext) => Promise<void>;
      post: (ctx: HookContext) => Promise<void>;
    }>,
  ): Promise<Result> {
    await hooks?.pre?.({ turn: this.turn });

    this.produceQuark();

    const state = this.updateState();

    await hooks?.preDriver?.({ state, turn: this.turn });

    const observerOrder = await this.activePlayer.driver(
      state,
      this.activePlayer.scratchpad,
    );

    const observer = this.players[observerOrder];

    await hooks?.preObservation?.({ turn: this.turn, state, observer });

    const observation = this.executeObservation(observer, this.activePlayer);

    await hooks?.preReaction?.({
      turn: this.turn,
      state,
      observer,
      observation,
    });

    this.executeReaction(observation, this.activePlayer);

    await hooks?.preChecks?.({ turn: this.turn, state, observer, observation });

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

    await hooks?.preTurnIncrement?.({
      turn: this.turn,
      state,
      observer,
      observation,
    });

    this.turn++;

    await hooks?.post?.({ turn: this.turn, state, observer, observation });
  }
}

// const game = new Hadronize(83, [
//   { name: "alice", driver: prngDriver },
//   { name: "bob", driver: prngDriver },
// ]);

// let i = 0;
// while ((await game.executeTurn()) === undefined) {
//   i++;
// }

// console.log(JSON.stringify(game.state));
