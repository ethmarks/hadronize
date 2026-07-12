import { base } from "$app/paths";

/**
 * Master list of all sounds.
 */
export const SOUNDS = [
  // from https://www.joshwcomeau.com/sounds/menu-close.mp3
  "menu-close.mp3",

  // from https://www.joshwcomeau.com/sounds/switch-on.mp3
  "switch-on.mp3",

  // from https://kenney.nl/assets/interface-sounds
  "tick_002.mp3",

  // https://freesound.org/people/Mellau/sounds/506054/
  "button-click1.mp3",

  // https://freesound.org/people/Mellau/sounds/506053/
  "ding.mp3",

  // https://freesound.org/people/k00k135/sounds/857817/
  "impact.ogg",

  // https://freesound.org/people/mikiko850/sounds/857700/
  "finish.ogg",

  // https://freesound.org/people/javieralejp2/sounds/658594/
  "good.ogg",

  // https://freesound.org/people/DAN2008/sounds/860681/
  "goodnotification.ogg",

  // https://freesound.org/people/junggle/sounds/29180/
  "btn370.ogg",

  // https://freesound.org/people/DrMrSir/sounds/529560/
  "menu-beep.ogg",

  // https://freesound.org/people/Calzymp/sounds/575425/
  "bottle-click.ogg",

  // https://freesound.org/people/Soughtaftersounds/sounds/145460/
  "click-steel-drum.ogg",

  // https://freesound.org/people/unfa/sounds/244266/
  "hover.ogg",

  // https://freesound.org/people/broumbroum/sounds/50559/
  "menu-select-broumbroum.ogg",
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
