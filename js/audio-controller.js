function shuffledIndexes(length) {
  const indexes = Array.from({ length }, (_, index) => index);

  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [indexes[index], indexes[randomIndex]] = [
      indexes[randomIndex],
      indexes[index]
    ];
  }

  return indexes;
}

export class AudioController {
  constructor() {
    this.audio = new Map();
  }

  register(objectId, config) {
    const configuredTracks = Array.isArray(config?.tracks)
      ? config.tracks
      : config?.src
        ? [config.src]
        : [];

    const tracks = configuredTracks
      .filter(Boolean)
      .map((src) => new URL(src, document.baseURI).href);

    if (tracks.length === 0) return;

    const element = new Audio();

    element.loop = false;
    element.volume = Math.max(
      0,
      Math.min(1, Number(config.volume ?? 1))
    );
    element.preload = "metadata";

    const state = {
      element,
      tracks,
      shuffle: Boolean(config.shuffle),
      loopPlaylist:
        config.loopPlaylist ?? Boolean(config.loop),
      order: [],
      cursor: 0,
      lastTrackIndex: null
    };

    const createOrder = () => {
      state.order = state.shuffle
        ? shuffledIndexes(state.tracks.length)
        : state.tracks.map((_, index) => index);

      /*
       * Evita repetir inmediatamente la misma canción
       * entre el final de una ronda y el inicio de otra.
       */
      if (
        state.order.length > 1 &&
        state.lastTrackIndex !== null &&
        state.order[0] === state.lastTrackIndex
      ) {
        [state.order[0], state.order[1]] = [
          state.order[1],
          state.order[0]
        ];
      }

      state.cursor = 0;
    };

    const loadCurrentTrack = () => {
      const trackIndex = state.order[state.cursor];

      state.lastTrackIndex = trackIndex;
      state.element.src = state.tracks[trackIndex];
      state.element.load();
    };

    const advance = async () => {
      state.cursor += 1;

      if (state.cursor >= state.order.length) {
        if (!state.loopPlaylist) return;

        createOrder();
      }

      loadCurrentTrack();

      try {
        await state.element.play();
      } catch (error) {
        console.warn(
          `[AudioController] No se pudo continuar la playlist de ${objectId}.`,
          error
        );
      }
    };

    createOrder();
    loadCurrentTrack();

    element.addEventListener("ended", advance);

    this.audio.set(objectId, state);
  }

  async play(objectId) {
    const state = this.audio.get(objectId);

    if (!state) return false;

    try {
      await state.element.play();
      return true;
    } catch (error) {
      console.warn(
        `[AudioController] No se pudo reproducir audio de ${objectId}.`,
        error
      );

      return false;
    }
  }

  pause(objectId, reset = false) {
    const state = this.audio.get(objectId);

    if (!state) return;

    state.element.pause();

    if (reset) {
      state.cursor = 0;
      state.lastTrackIndex = null;

      state.order = state.shuffle
        ? shuffledIndexes(state.tracks.length)
        : state.tracks.map((_, index) => index);

      state.element.src =
        state.tracks[state.order[0]];

      state.element.currentTime = 0;
      state.element.load();
    }
  }

  pauseAll() {
    for (const state of this.audio.values()) {
      state.element.pause();
    }
  }
}
