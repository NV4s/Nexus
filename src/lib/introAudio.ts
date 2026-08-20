/**
 * The intro track outlives the intro overlay. Keeping the element in a module
 * singleton rather than in the component means unmounting the visuals does not
 * cut the audio off mid-phrase — it plays to its natural end.
 */
let element: HTMLAudioElement | null = null;

const create = () => {
  const audio = new Audio('/audio/void-intro.mp3');
  audio.preload = 'auto';
  return audio;
};

/** Buffer the track while the viewer is still looking at the Enter button. */
export function preloadIntroAudio() {
  element ??= create();
  element.load();
}

export function playIntroAudio() {
  element ??= create();
  element.volume = 0.55;
  // Ignore a rejection: autoplay policy can refuse, and the visuals still run.
  return element.play().catch(() => {});
}

export function stopIntroAudio() {
  if (!element) return;
  element.pause();
  element.currentTime = 0;
}
