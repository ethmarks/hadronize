import {
  STOCK_DRIVER_PROGRAMS,
  type DriverProgram,
} from "../drivers/stockDrivers.ts";

function isDriverProgram(value: unknown): value is DriverProgram {
  const val = value as DriverProgram;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof val.id === "string" &&
    typeof val.name === "string" &&
    typeof val.description === "string" &&
    typeof val.code === "string"
  );
}

function isDriverProgramArray(value: unknown): value is DriverProgram[] {
  return (
    Array.isArray(value) && (value as DriverProgram[]).every(isDriverProgram)
  );
}

const lsKey = "hadronizePlayerTypes";

const lsAvailable = (): boolean =>
  typeof window !== "undefined" &&
  "localStorage" in window &&
  window["localStorage"] !== null;

export function fetchPlayerTypes(): DriverProgram[] {
  if (!lsAvailable()) {
    // we're running in Node in SvelteKit prerendering
    return STOCK_DRIVER_PROGRAMS;
  }

  const ls = localStorage.getItem(lsKey);

  if (ls === null) {
    resetPlayerTypes();
    return STOCK_DRIVER_PROGRAMS;
  }

  const json = JSON.parse(ls);

  if (!isDriverProgramArray(json)) {
    console.warn("player types in local storage are malformed");
    return STOCK_DRIVER_PROGRAMS;
  }

  return json;
}

export function setPlayerTypes(programs: DriverProgram[]): void {
  localStorage.setItem(lsKey, JSON.stringify(programs));
}

export function resetPlayerTypes(): void {
  setPlayerTypes(STOCK_DRIVER_PROGRAMS);
}
