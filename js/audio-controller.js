export class AudioController {
  constructor() {
    this.audio = new Map();
  }

  register(objectId, config) {
    if (!config?.src) return;
    const element = new Audio(new URL(config.src, document.baseURI).href);
    element.loop = Boolean(config.loop);
    element.volume = Math.max(0, Math.min(1, Number(config.volume ?? 1)));
    element.preload = "auto";
    this.audio.set(objectId, element);
  }

  async play(objectId) {
    const element = this.audio.get(objectId);
    if (!element) return false;

    try {
      await element.play();
      return true;
    } catch (error) {
      console.warn(`[AudioController] No se pudo reproducir audio de ${objectId}.`, error);
      return false;
    }
  }

  pause(objectId, reset = false) {
    const element = this.audio.get(objectId);
    if (!element) return;
    element.pause();
    if (reset) element.currentTime = 0;
  }

  pauseAll() {
    for (const element of this.audio.values()) element.pause();
  }
}
