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

let audioCtx: AudioContext | undefined = undefined;
const soundCache = new Map<Sound, AudioBuffer>();

export async function initAudio(): Promise<void> {
  // If we aren't running in the browser or if we've already inited, do an
  // early return.
  if (typeof window === "undefined" || typeof audioCtx !== "undefined") return;

  audioCtx = new window.AudioContext();

  const preloads: Promise<void>[] = SOUNDS.map(async (sound) => {
    try {
      const response = await fetch(getSoundPath(sound));
      const arrayBuffer = await response.arrayBuffer();
      if (audioCtx) {
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        soundCache.set(sound, audioBuffer);
      }
    } catch {
      console.error(`Failed to preload sound ${sound}`);
    }
  });

  await Promise.all(preloads);
}

export function playSound(sound: Sound, volume: number = 1): void {
  // If we aren't running in the browser, do an early return.
  if (typeof window === "undefined") return;

  if (audioCtx === undefined) {
    initAudio();
    // early return because we're fire-and-forgetting an async and we don't
    // want race conditions.
    return;
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  const buffer = soundCache.get(sound);
  if (buffer === undefined) {
    console.warn(`Sound ${sound} is not loaded in cache`);
    return;
  }

  const source = audioCtx.createBufferSource();
  const gainNode = audioCtx.createGain();

  source.buffer = buffer;
  gainNode.gain.value = volume;

  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  source.start(0);
}
