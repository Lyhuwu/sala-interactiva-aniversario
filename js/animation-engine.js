export class AnimationEngine {
  constructor(objects, elements, assetLoader) {
    this.objects = new Map(objects.map((object) => [object.id, object]));
    this.elements = elements;
    this.assetLoader = assetLoader;
    this.active = new Map();
    this.rafId = null;
    this.paused = false;
    this.boundTick = (time) => this.tick(time);
  }

  getSequence(objectId, animationName) {
    return this.objects.get(objectId)?.animations?.[animationName] ?? null;
  }

  hasAnimation(objectId, animationName) {
    const sequence = this.getSequence(objectId, animationName);
    return Boolean(sequence?.frames?.length && this.assetLoader.getValidFrames(this.objects.get(objectId), animationName).length);
  }

  showIdle(objectId) {
    return this.startLoop(objectId, "idle");
  }

  startLoop(objectId, animationName) {
    const object = this.objects.get(objectId);
    const element = this.elements.get(objectId);
    if (!object || !element) return false;

    const sequence = this.getSequence(objectId, animationName);
    const frames = this.assetLoader.getValidFrames(object, animationName);
    if (!sequence || frames.length === 0) return false;

    this.stop(objectId);

    element.src = frames[0].image.src;
    element.dataset.animation = animationName;

    if (frames.length === 1) return true;

    this.active.set(objectId, {
      objectId,
      animationName,
      frames,
      durations: sequence.durations ?? [250],
      loop: true,
      holdLastFrame: true,
      frameIndex: 0,
      elapsed: 0,
      lastTime: performance.now(),
      resolve: null
    });
    this.ensureTicking();
    return true;
  }

  play(objectId, animationName) {
    const object = this.objects.get(objectId);
    const element = this.elements.get(objectId);
    if (!object || !element) return Promise.resolve({ skipped: true });

    const sequence = this.getSequence(objectId, animationName);
    const frames = this.assetLoader.getValidFrames(object, animationName);
    if (!sequence || !sequence.frames?.length || frames.length === 0) {
      return Promise.resolve({ skipped: true });
    }

    this.stop(objectId);
    element.src = frames[0].image.src;
    element.dataset.animation = animationName;

    return new Promise((resolve) => {
      this.active.set(objectId, {
        objectId,
        animationName,
        frames,
        durations: sequence.durations ?? [250],
        loop: Boolean(sequence.loop),
        holdLastFrame: sequence.holdLastFrame !== false,
        frameIndex: 0,
        elapsed: 0,
        lastTime: performance.now(),
        resolve
      });
      this.ensureTicking();
    });
  }

  stop(objectId) {
    const state = this.active.get(objectId);
    if (!state) return false;
    this.active.delete(objectId);
    state.resolve?.({ cancelled: true });
    return true;
  }

  stopAll() {
    for (const objectId of [...this.active.keys()]) this.stop(objectId);
  }

  isPlaying(objectId, animationName = null) {
    const state = this.active.get(objectId);
    return Boolean(state && (!animationName || state.animationName === animationName));
  }

  pauseAll() {
    this.paused = true;
  }

  resumeAll() {
    this.paused = false;
    const now = performance.now();
    for (const state of this.active.values()) state.lastTime = now;
    this.ensureTicking();
  }

  ensureTicking() {
    if (this.rafId === null) this.rafId = requestAnimationFrame(this.boundTick);
  }

  durationFor(state, frameEntry) {
    const durations = state.durations;
    if (!Array.isArray(durations) || durations.length === 0) return 250;
    if (durations.length === 1) return Math.max(16, Number(durations[0]) || 250);
    return Math.max(16, Number(durations[frameEntry.originalIndex] ?? durations[state.frameIndex] ?? 250));
  }

  tick(time) {
    this.rafId = null;
    if (this.paused) return;

    for (const [objectId, state] of [...this.active.entries()]) {
      const delta = Math.min(100, Math.max(0, time - state.lastTime));
      state.lastTime = time;
      state.elapsed += delta;

      let frameDuration = this.durationFor(state, state.frames[state.frameIndex]);
      while (state.elapsed >= frameDuration) {
        state.elapsed -= frameDuration;
        const nextIndex = state.frameIndex + 1;

        if (nextIndex >= state.frames.length) {
          if (state.loop) {
            state.frameIndex = 0;
          } else {
            this.active.delete(objectId);
            const element = this.elements.get(objectId);
            if (!state.holdLastFrame) this.showIdle(objectId);
            state.resolve?.({ completed: true });
            break;
          }
        } else {
          state.frameIndex = nextIndex;
        }

        const element = this.elements.get(objectId);
        const frame = state.frames[state.frameIndex];
        if (element && frame) element.src = frame.image.src;
        frameDuration = this.durationFor(state, frame);
      }
    }

    if (this.active.size > 0) this.ensureTicking();
  }
}
