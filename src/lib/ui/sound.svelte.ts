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

  // https://freesound.org/people/unfa/sounds/244266/
  "close.ogg",
] as const;
export type Sound = (typeof SOUNDS)[number];

const getSoundPath: (sound: Sound) => string = (sound: Sound) =>
  `${base}/sounds/${sound}`;

let audioCtx: AudioContext | undefined = undefined;

// This is for storing the raw audio data
const rawAudioCache = new Map<Sound, ArrayBuffer>();

// This is for storing the audio buffers decoded with the audio context, which
// requires the audio context to exist, so we can't use it immediately on page load.
const decodedAudioCache = new Map<Sound, AudioBuffer>();

let isPreloadingStarted = false;

/**
 * Fetches and preloads the raw audio data. This is safe to run immediately on
 * page load.
 */
export async function preloadSounds(): Promise<void> {
  if (typeof window === "undefined" || isPreloadingStarted) return;
  isPreloadingStarted = true;

  const preloads = SOUNDS.map(async (sound) => {
    try {
      const response = await fetch(getSoundPath(sound));
      const arrayBuffer = await response.arrayBuffer();
      rawAudioCache.set(sound, arrayBuffer);
    } catch {
      console.error(`Failed to preload sound ${sound}`);
    }
  });

  await Promise.all(preloads);
}

/**
 * Decodes the raw audio data. This creates an audio context, so if we run it
 * on page load we'll get an annoying warning in the console. Instead, we gotta
 * run it after a user interaction.
 */
export async function decodeSounds(): Promise<void> {
  if (typeof window === "undefined" || typeof audioCtx !== "undefined") return;

  audioCtx = new window.AudioContext();

  // In case we didn't preload the sounds before trying to decode them
  if (rawAudioCache.size === 0) await preloadSounds();

  const rawCacheEntries = Array.from(rawAudioCache.entries());

  const decodes: Promise<void>[] = rawCacheEntries.map(
    async ([sound, arrayBuffer]) => {
      try {
        if (audioCtx) {
          const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
          decodedAudioCache.set(sound, decoded);
        }
      } catch {
        console.error(`Failed to preload sound ${sound}`);
      }
    },
  );

  await Promise.all(decodes);
}

export function playSound(sound: Sound, volume: number = 1): void {
  // If we aren't running in the browser, do an early return.
  if (typeof window === "undefined") return;

  if (audioCtx === undefined) {
    decodeSounds();
    // early return because we're fire-and-forgetting an async and we don't
    // want race conditions.
    return;
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  const buffer = decodedAudioCache.get(sound);
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
