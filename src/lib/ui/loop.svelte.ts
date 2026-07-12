import {
  getStateChunks,
  logFinalObservation,
  type CliOptions,
} from "../cli/print.ts";
import sl from "../cli/styledLog.ts";
import type {
  Hadronize,
  Observation,
  Result,
  TurnHooks,
} from "../Hadronize.ts";
import type { LayoutManager } from "./layout.svelte.ts";
import type { MouseManager } from "./mouse.svelte.ts";
import { playSound } from "./sound.svelte.ts";
import type { StoreManager } from "./store.svelte.ts";

export class LoopManager {
  constructor(
    public game: Hadronize,
    public store: StoreManager,
    public layout: LayoutManager,
    public mouse: MouseManager,
    public getSpeed: () => number,
    public opt: CliOptions,
    public abortSignal?: AbortSignal,
  ) {}

  private async sleep(ms: number) {
    const speed = this.getSpeed();

    if (speed === 0) return;

    await new Promise((resolve) => setTimeout(resolve, ms / speed));
  }

  private async turn(): Promise<Result> {
    const hooks: TurnHooks = {
      pre: async (ctx: { game: Hadronize }) => {
        this.store.superposed = this.store.quarks[ctx.game.superposedIndex!];
        this.store.superposed.x =
          this.layout.container.x - this.layout.quarkSize / 2;
        this.store.superposed.y =
          this.layout.container.y - this.layout.quarkSize / 2;

        this.layout.update();

        await this.sleep(500);
      },

      preDriver: async (ctx: { game: Hadronize }) => {
        sl(getStateChunks(ctx.game.state!, this.opt));
      },

      preReaction: async (ctx: { observation: Observation }) => {
        // The driver is an awaited async that we can't really control, so the
        // next best thing is to check if we've aborted immediately *after* the
        // driver runs.
        if (this.abortSignal?.aborted) {
          // This should bubble up to the while loop in start()
          throw new DOMException("aborted", "AbortError");
        }

        this.store.superposed.owner = ctx.observation.observer;

        playSound("collapse.ogg", 0.7);

        this.store.syncChambers();
        this.layout.update();
        await this.sleep(250);
      },

      preChecks: async (ctx: { observation: Observation }) => {
        const reaction = ctx.observation.reaction;

        if (reaction === "hadronized") {
          playSound("hadronize.ogg", 0.5);
        } else if (reaction === "tunneled") {
          playSound("tunnel.ogg");
        }

        this.store.syncChambers();
        this.layout.update();
        await this.sleep(150);
      },

      post: async () => {
        this.store.chambers.forEach((c) => this.layout.placeChamberLabel(c));
      },
    };

    return await this.game.executeTurn(hooks);
  }

  private endGame() {
    if (this.store.result === undefined) {
      throw new Error("endgame() was triggered while game was still running!");
    }

    playSound("endgame.ogg");

    logFinalObservation(this.game, this.store.result, this.opt);

    this.mouse.dropIndicator.active = false;

    const chambersToExplode = this.store.chambers.filter(
      (c) => c.order !== this.store.result,
    );
    chambersToExplode.forEach((c) => this.layout.explodeChamber(c));

    if (typeof this.store.result === "number") {
      const winningChamber = this.store.chambers[this.store.result];
      winningChamber.x = this.layout.container.x;
      winningChamber.y = this.layout.container.y;
      winningChamber.showCount = false;
      winningChamber.tooLarge = false;
      this.layout.placeQuarks(winningChamber);
      this.layout.placeChamberLabel(winningChamber);
      winningChamber.label.color = "#98c379";
      winningChamber.label.text += " Wins!";
    }
  }

  public async start(): Promise<void> {
    while (this.store.result === undefined) {
      try {
        this.store.result = await this.turn();
      } catch (err) {
        if (!(err instanceof Error)) throw new Error("unknown error");

        // Return silently if we aborted, otherwise loudly throw the original
        // error.
        if (err.name === "AbortError") {
          return;
        } else {
          throw err;
        }
      }

      if (this.abortSignal?.aborted) return;
    }

    this.endGame();
  }
}
