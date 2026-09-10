
let element: HTMLAudioElement | null = null;

const create = () => {
  const audio = new Audio('/audio/void-intro.mp3');
  audio.preload = 'auto';
  return audio;
};


export function preloadIntroAudio() {
  element ??= create();
  element.load();
}

export function playIntroAudio() {
  element ??= create();
  element.volume = 0.55;

  return element.play().catch(() => {});
}

export function stopIntroAudio() {
  if (!element) return;
  element.pause();
  element.currentTime = 0;
}
