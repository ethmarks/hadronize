import { base } from "$app/paths";

/**
 * Master list of all sounds.
 */
export const SOUNDS = [
  // https://freesound.org/people/mikiko850/sounds/857700/
  "start.ogg",

  // https://freesound.org/people/javieralejp2/sounds/658594/
  "hadronize.ogg",

  // https://freesound.org/people/DAN2008/sounds/860681/
  "endgame.ogg",

  // https://freesound.org/people/DrMrSir/sounds/529560/
  "collapse.ogg",

  // https://freesound.org/people/Soughtaftersounds/sounds/145460/
  "tunnel.ogg",

  // https://freesound.org/people/broumbroum/sounds/50559/
  "dragover.ogg",
] as const;
export type Sound = (typeof SOUNDS)[number];

const getSoundPath: (sound: Sound) => string = (sound: Sound) =>
  `${base}/sounds/${sound}`;

export function playSound(sound: Sound, volume: number = 1): void {
  if (typeof window !== "undefined") {
    const audio = new Audio(getSoundPath(sound));
    audio.volume = volume;
    audio.play();
  }
}
