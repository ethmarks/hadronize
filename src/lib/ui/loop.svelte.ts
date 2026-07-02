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
import type { StoreManager } from "./store.svelte.ts";

export class LoopManager {
  constructor(
    public speed: number,
    public game: Hadronize,
    public store: StoreManager,
    public layout: LayoutManager,
    public mouse: MouseManager,
    public opt: CliOptions,
  ) {}

  private async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms / this.speed));
  }

  private async turn(): Promise<Result> {
    const hooks: TurnHooks = {
      pre: async (ctx: { game: Hadronize }) => {
        this.store.superposed = this.store.quarks[ctx.game.superposedIndex!];
        this.store.superposed.x = this.layout.center.x - 25;
        this.store.superposed.y = this.layout.center.y - 25;

        this.layout.update();

        await this.sleep(500);
      },

      preDriver: async (ctx: { game: Hadronize }) => {
        sl(getStateChunks(ctx.game.state!, this.opt));
      },

      preReaction: async (ctx: { observation: Observation }) => {
        this.store.superposed.owner = ctx.observation.observer;

        this.store.syncChambers();
        this.layout.update();
        await this.sleep(250);
      },

      preChecks: async () => {
        this.store.syncChambers();
        this.layout.update();
        await this.sleep(150);
      },

      post: async () => {
        this.store.chambers.forEach((c) => this.layout.updateChamberLabel(c));
      },
    };

    return await this.game.executeTurn(hooks);
  }

  private endGame() {
    if (this.store.result === undefined) {
      throw new Error("endgame() was triggered while game was still running!");
    }

    logFinalObservation(this.game, this.store.result, this.opt);

    this.mouse.dropIndicator.active = false;

    const chambersToExplode = this.store.chambers.filter(
      (c) => c.order !== this.store.result,
    );
    chambersToExplode.forEach((c) => this.layout.explodeChamber(c));

    if (typeof this.store.result === "number") {
      const winningChamber = this.store.chambers[this.store.result];
      winningChamber.x = this.layout.center.x;
      winningChamber.y = this.layout.center.y;
      winningChamber.showCount = false;
      winningChamber.tooLarge = false;
      this.layout.updateChamberContent(winningChamber);
      this.layout.updateChamberLabel(winningChamber);
      winningChamber.label.color = "#98c379";
      winningChamber.label.text += " Wins!";
    }
  }

  public async start(): Promise<void> {
    while (this.store.result === undefined) {
      this.store.result = await this.turn();
    }

    this.endGame();
  }
}
