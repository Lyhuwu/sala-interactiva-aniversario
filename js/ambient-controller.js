export class AmbientController {
  constructor({
    objectConfigs,
    elements,
    animationEngine,
    modalController,
    effectsController,
    audioController,
    runtimeLock,
    storyController
  }) {
    this.objects = new Map(objectConfigs.map((object) => [object.id, object]));
    this.elements = elements;
    this.animationEngine = animationEngine;
    this.modalController = modalController;
    this.effectsController = effectsController;
    this.audioController = audioController;
    this.runtimeLock = runtimeLock;
    this.storyController = storyController;
    this.autoTimer = null;
    this.autoObjectId = null;
    this.autoPaused = false;
    this.persistentStates = new Map();
  }

  initialize() {
    for (const object of this.objects.values()) {
      this.animationEngine.showIdle(object.id);
      const element = this.elements.get(object.id);
      if (element) element.dataset.status = "ambient";
      if (object.audio) this.audioController.register(object.id, object.audio);
      if (object.ambient?.mode === "persistentAudio") {
        this.persistentStates.set(object.id, "stopped");
      }
    }
  }

  pauseAuto() {
    this.autoPaused = true;
    clearTimeout(this.autoTimer);
    this.autoTimer = null;
  }

  resumeAuto() {
    this.autoPaused = false;
    this.scheduleAuto();
  }

  interruptAuto() {
    if (!this.autoObjectId) return;
    const objectId = this.autoObjectId;
    this.autoObjectId = null;
    this.animationEngine.stop(objectId);
    this.animationEngine.showIdle(objectId);
  }

  scheduleAuto() {
    clearTimeout(this.autoTimer);
    this.autoTimer = null;
    if (this.autoPaused || document.hidden) return;

    const candidates = [...this.objects.values()].filter(
      (object) => object.ambient?.autoEnabled && this.animationEngine.hasAnimation(object.id, "ambiente")
    );
    if (candidates.length === 0) return;

    const object = candidates[Math.floor(Math.random() * candidates.length)];
    const min = object.ambient.minDelay ?? 15000;
    const max = object.ambient.maxDelay ?? 30000;
    const delay = Math.floor(min + Math.random() * (max - min + 1));

    this.autoTimer = window.setTimeout(() => this.playAuto(object.id), delay);
  }

  async playAuto(objectId) {
    if (
      this.autoPaused ||
      document.hidden ||
      this.runtimeLock.isLocked ||
      this.modalController.isOpen ||
      this.storyController.isAttentionPlaying
    ) {
      this.scheduleAuto();
      return;
    }

    this.autoObjectId = objectId;
    try {
      await this.animationEngine.play(objectId, "ambiente");
    } finally {
      if (this.autoObjectId === objectId) {
        this.autoObjectId = null;
        this.animationEngine.showIdle(objectId);
      }
      this.scheduleAuto();
    }
  }

  async handleClick(objectId) {
    const object = this.objects.get(objectId);
    if (!object || this.runtimeLock.isLocked) return;

    this.interruptAuto();

    if (object.ambient?.mode === "persistentAudio") {
      await this.togglePersistentObject(object);
      return;
    }

    await this.playManualInteraction(object);
  }

  async playManualInteraction(object) {
    const owner = `ambient:${object.id}`;
    if (!this.runtimeLock.acquire(owner)) return;

    this.storyController.pauseAttention();
    this.pauseAuto();

    try {
      await this.animationEngine.play(object.id, "evento");

      if (object.interaction?.effect) {
        const origin = {
          x: object.position.x + object.position.width / 2,
          y: object.position.y + object.position.width / 2
        };
        await this.effectsController.trigger(object.interaction.effect, origin);
      }

      if (object.interaction?.content) {
        await this.modalController.open(object.interaction.content);
      }

      await this.animationEngine.play(object.id, "regresoIdle");
      this.animationEngine.showIdle(object.id);
    } catch (error) {
      console.error(`[AmbientController] Error en ${object.id}.`, error);
      this.animationEngine.showIdle(object.id);
    } finally {
      this.runtimeLock.release(owner);
      this.resumeAuto();
      if (!this.storyController.isComplete) this.storyController.scheduleAttention(900);
    }
  }

  async togglePersistentObject(object) {
    const currentState = this.persistentStates.get(object.id) ?? "stopped";
    const element = this.elements.get(object.id);

    // El tocadiscos final es de una sola activación:
    // una vez encendido, no vuelve a la animación de atención.
    if (currentState === "playing" && object.ambient?.oneWay) return;

    const owner = `persistent:${object.id}`;
    if (!this.runtimeLock.acquire(owner)) return;

    this.storyController.pauseAttention();
    this.pauseAuto();

    try {
      if (currentState === "stopped") {
        this.persistentStates.set(object.id, "starting");
        await this.animationEngine.play(object.id, "evento");
        await this.audioController.play(object.id);
        this.animationEngine.startLoop(object.id, "activo");
        this.persistentStates.set(object.id, "playing");
      } else {
        this.persistentStates.set(object.id, "stopping");
        this.animationEngine.stop(object.id);
        this.audioController.pause(object.id, true);
        await this.animationEngine.play(object.id, "regresoIdle");
        this.animationEngine.showIdle(object.id);
        this.persistentStates.set(object.id, "stopped");
      }
    } catch (error) {
      console.error(`[AmbientController] Error al cambiar ${object.id}.`, error);
      this.audioController.pause(object.id, true);
      this.animationEngine.showIdle(object.id);
      this.persistentStates.set(object.id, "stopped");
    } finally {
      this.runtimeLock.release(owner);
      this.resumeAuto();
      if (!this.storyController.isComplete) this.storyController.scheduleAttention(900);
    }
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.pauseAuto();
    } else {
      this.resumeAuto();
    }
  }
}
