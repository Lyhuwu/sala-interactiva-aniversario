import { OBJECT_STATUS } from "./objects-config.js";

function randomBetween(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export class StoryController {
  constructor({
    sceneConfig,
    storyOrder,
    objectConfigs,
    elements,
    animationEngine,
    modalController,
    effectsController,
    runtimeLock
  }) {
    this.sceneConfig = sceneConfig;
    this.storyOrder = [...storyOrder];
    this.objects = new Map(
      objectConfigs.map((object) => [object.id, object])
    );
    this.elements = elements;
    this.animationEngine = animationEngine;
    this.modalController = modalController;
    this.effectsController = effectsController;
    this.runtimeLock = runtimeLock;

    this.currentStoryStep = 0;
    this.completedObjects = new Set();

    this.attentionTimer = null;
    this.attentionObjectId = null;

    this.ambientController = null;

    /*
      El recorrido inicia bloqueado.

      Pinwi puede seguir reproduciendo su animación idle,
      pero no puede mostrar aura, atención ni comenzar
      su evento hasta que se active el tocadiscos.
    */
    this.storyUnlocked = false;
  }

  setAmbientController(controller) {
    this.ambientController = controller;
  }

  /*
    Esta función solamente debe ejecutarse después de que
    el audio del tocadiscos haya comenzado correctamente.
  */
  unlockStory(delay = 900) {
    if (this.storyUnlocked) return;

    this.storyUnlocked = true;

    /*
      Esta clase permite que el CSS muestre el aura
      de los objetos narrativos.
    */
    document.documentElement.classList.add("story-unlocked");

    this.refreshStatuses();
    this.scheduleAttention(delay);
  }

  initialize() {
    /*
      Cada vez que se inicializa la página, el recorrido
      comienza esperando el clic en el tocadiscos.
    */
    this.storyUnlocked = false;
    document.documentElement.classList.remove("story-unlocked");

    this.restoreProgress();
    this.refreshStatuses();

    /*
      Todos los objetos conservan su idle.

      Por eso Pinwi puede parpadear aunque todavía esté
      bloqueado para comenzar la historia.
    */
    for (const objectId of this.storyOrder) {
      this.animationEngine.showIdle(objectId);
    }
  }

  get currentObjectId() {
    return this.storyOrder[this.currentStoryStep] ?? null;
  }

  get isComplete() {
    return this.currentStoryStep >= this.storyOrder.length;
  }

  get isAttentionPlaying() {
    return Boolean(this.attentionObjectId);
  }

  refreshStatuses() {
    const currentId = this.currentObjectId;

    for (const objectId of this.storyOrder) {
      const element = this.elements.get(objectId);
      if (!element) continue;

      if (this.completedObjects.has(objectId)) {
        element.dataset.status = OBJECT_STATUS.COMPLETED;
      } else if (
        objectId === currentId &&
        this.storyUnlocked
      ) {
        /*
          El objeto actual solamente queda listo
          después de tocar el tocadiscos.
        */
        element.dataset.status = OBJECT_STATUS.READY;
      } else {
        /*
          Antes del tocadiscos, incluso Pinwi permanece
          bloqueado, aunque su idle siga reproduciéndose.
        */
        element.dataset.status = OBJECT_STATUS.LOCKED;
      }
    }
  }

  restoreProgress() {
    try {
      const raw = localStorage.getItem(
        this.sceneConfig.storageKey
      );

      if (!raw) return;

      const saved = JSON.parse(raw);

      const validCompleted = Array.isArray(
        saved.completedObjects
      )
        ? saved.completedObjects.filter((id) =>
            this.storyOrder.includes(id)
          )
        : [];

      let step = Number.isInteger(saved.currentStoryStep)
        ? saved.currentStoryStep
        : 0;

      step = Math.max(
        0,
        Math.min(step, this.storyOrder.length)
      );

      /*
        La lista completada debe coincidir con los
        pasos anteriores al paso actual.
      */
      const expectedCompleted =
        this.storyOrder.slice(0, step);

      this.completedObjects = new Set(
        expectedCompleted.filter((id) =>
          validCompleted.includes(id)
        )
      );

      /*
        Si el guardado estaba incompleto o alterado,
        se reconstruye un progreso coherente.
      */
      while (this.completedObjects.size < step) {
        this.completedObjects.add(
          this.storyOrder[this.completedObjects.size]
        );
      }

      this.currentStoryStep = step;
    } catch (error) {
      console.warn(
        "[StoryController] No fue posible restaurar el progreso.",
        error
      );

      this.currentStoryStep = 0;
      this.completedObjects.clear();
    }
  }

  saveProgress() {
    const payload = {
      currentStoryStep: this.currentStoryStep,
      completedObjects: [...this.completedObjects]
    };

    localStorage.setItem(
      this.sceneConfig.storageKey,
      JSON.stringify(payload)
    );
  }

  pauseAttention({
    returnToIdle = true
  } = {}) {
    clearTimeout(this.attentionTimer);
    this.attentionTimer = null;

    if (this.attentionObjectId) {
      const objectId = this.attentionObjectId;

      this.attentionObjectId = null;
      this.animationEngine.stop(objectId);

      if (returnToIdle) {
        this.animationEngine.showIdle(objectId);
      }
    }
  }

  scheduleAttention(delay = null) {
    /*
      Se limpia cualquier atención anterior,
      pero no se detiene el idle innecesariamente.
    */
    this.pauseAttention({
      returnToIdle: false
    });

    /*
      Primera barrera:

      Antes de tocar el tocadiscos no se programa
      ninguna animación de atención.
    */
    if (
      !this.storyUnlocked ||
      this.isComplete ||
      document.hidden
    ) {
      return;
    }

    const wait =
      delay ??
      randomBetween(
        this.sceneConfig.attention.minDelay,
        this.sceneConfig.attention.maxDelay
      );

    this.attentionTimer = window.setTimeout(() => {
      this.playCurrentAttention();
    }, wait);
  }

  async playCurrentAttention() {
    /*
      Segunda barrera:

      Aunque otra parte del código llame directamente
      esta función, no podrá activar a Pinwi antes
      del tocadiscos.
    */
    if (
      !this.storyUnlocked ||
      this.isComplete
    ) {
      return;
    }

    const objectId = this.currentObjectId;

    if (
      !objectId ||
      this.runtimeLock.isLocked ||
      this.modalController.isOpen ||
      document.hidden
    ) {
      this.scheduleAttention(1000);
      return;
    }

    const object = this.objects.get(objectId);

    if (
      !object ||
      !this.animationEngine.hasAnimation(
        objectId,
        "atencion"
      )
    ) {
      this.scheduleAttention();
      return;
    }

    this.attentionObjectId = objectId;

    /*
      Si había una animación ambiental automática,
      la pista narrativa tiene prioridad.
    */
    this.ambientController?.interruptAuto();

    const element = this.elements.get(objectId);

    if (element) {
      element.dataset.status =
        OBJECT_STATUS.ATTENTION;
    }

    await this.animationEngine.play(
      objectId,
      "atencion"
    );

    /*
      Si hubo un clic, un cambio de paso o una
      cancelación, no se vuelve a iniciar la
      atención del objeto anterior.
    */
    if (
      this.attentionObjectId !== objectId ||
      !this.storyUnlocked ||
      objectId !== this.currentObjectId
    ) {
      return;
    }

    this.attentionObjectId = null;

    /*
      Después de terminar el llamado, vuelve al idle.
      En Pinwi esto significa que vuelve a parpadear.
    */
    this.animationEngine.showIdle(objectId);

    /*
      El estado permanece en ATTENTION para que
      el aura siga visible mientras espera el clic.
    */
    if (element) {
      element.dataset.status =
        OBJECT_STATUS.ATTENTION;
    }

    /*
      Repite el llamado después de una pausa corta
      hasta que la persona dé clic.
    */
    this.scheduleAttention(900);
  }

  async handleClick(objectId) {
    if (this.runtimeLock.isLocked) return;

    /*
      Antes de tocar el tocadiscos, ningún objeto
      narrativo puede comenzar su evento.

      Pinwi solamente continúa con su idle.
    */
    if (!this.storyUnlocked) {
      await this.modalController.showToast(
        "Aún no es mi turno… primero sigue la música 🎶",
        1700
      );

      return;
    }

    this.ambientController?.interruptAuto();

    if (this.completedObjects.has(objectId)) {
      await this.replayCompletedObject(objectId);
      return;
    }

    if (objectId === this.currentObjectId) {
      await this.completeCurrentObject(objectId);
      return;
    }

    await this.handleWrongPath();
  }

  async completeCurrentObject(objectId) {
    const owner = `story:${objectId}`;

    if (!this.runtimeLock.acquire(owner)) {
      return;
    }

    let completedSuccessfully = false;

    this.pauseAttention();
    this.ambientController?.pauseAuto();

    try {
      const object = this.objects.get(objectId);

      if (
        !object ||
        objectId !== this.currentObjectId
      ) {
        return;
      }

      this.setStatus(
        objectId,
        OBJECT_STATUS.EVENT
      );

      await this.animationEngine.play(
        objectId,
        "evento"
      );

      await this.runEffect(object);

      if (object.interaction?.content) {
        this.setStatus(
          objectId,
          OBJECT_STATUS.WAITING
        );

        await this.modalController.open(
          object.interaction.content
        );
      }

      if (
        this.animationEngine.hasAnimation(
          objectId,
          "guiando"
        )
      ) {
        this.setStatus(
          objectId,
          OBJECT_STATUS.GUIDING
        );

        const handoffObjectId =
          object.interaction?.handoffAttentionTo;

        const hasSynchronizedHandoff =
          handoffObjectId &&
          this.animationEngine.hasAnimation(
            handoffObjectId,
            "atencion"
          );

        if (hasSynchronizedHandoff) {
          this.setStatus(
            handoffObjectId,
            OBJECT_STATUS.ATTENTION
          );

          await Promise.all([
            this.animationEngine.play(
              objectId,
              "guiando"
            ),
            this.animationEngine.play(
              handoffObjectId,
              "atencion"
            )
          ]);

          this.animationEngine.showIdle(
            handoffObjectId
          );

          this.setStatus(
            handoffObjectId,
            OBJECT_STATUS.LOCKED
          );
        } else {
          await this.animationEngine.play(
            objectId,
            "guiando"
          );
        }
      }

      this.setStatus(
        objectId,
        OBJECT_STATUS.RETURNING
      );

      await this.animationEngine.play(
        objectId,
        "regresoIdle"
      );

      this.animationEngine.showIdle(objectId);

      this.completedObjects.add(objectId);

      this.currentStoryStep = Math.min(
        this.currentStoryStep + 1,
        this.storyOrder.length
      );

      this.saveProgress();
      completedSuccessfully = true;
    } catch (error) {
      console.error(
        `[StoryController] Error al completar ${objectId}.`,
        error
      );

      this.animationEngine.showIdle(objectId);
    } finally {
      this.runtimeLock.release(owner);
      this.refreshStatuses();
      this.ambientController?.resumeAuto();
    }

    if (completedSuccessfully) {
      if (this.isComplete) {
        await this.modalController.showToast(
          this.sceneConfig.finalMessage,
          3600
        );
      } else {
        this.scheduleAttention(
          objectId === "pajaritos"
            ? null
            : 1000
        );
      }
    } else {
      this.scheduleAttention(1000);
    }
  }

  async replayCompletedObject(objectId) {
    const object = this.objects.get(objectId);

    if (!object?.interaction?.replayable) {
      return;
    }

    const owner = `replay:${objectId}`;

    if (!this.runtimeLock.acquire(owner)) {
      return;
    }

    const savedStep = this.currentStoryStep;

    this.pauseAttention();
    this.ambientController?.pauseAuto();

    try {
      this.setStatus(
        objectId,
        OBJECT_STATUS.EVENT
      );

      await this.animationEngine.play(
        objectId,
        "evento"
      );

      await this.runEffect(object);

      if (object.interaction?.content) {
        this.setStatus(
          objectId,
          OBJECT_STATUS.WAITING
        );

        await this.modalController.open(
          object.interaction.content
        );
      }

      /*
        En repetición no se ejecuta la guía
        y no cambia el paso narrativo.
      */
      this.setStatus(
        objectId,
        OBJECT_STATUS.RETURNING
      );

      await this.animationEngine.play(
        objectId,
        "regresoIdle"
      );

      this.animationEngine.showIdle(objectId);
    } catch (error) {
      console.error(
        `[StoryController] Error al repetir ${objectId}.`,
        error
      );

      this.animationEngine.showIdle(objectId);
    } finally {
      this.currentStoryStep = savedStep;
      this.runtimeLock.release(owner);
      this.refreshStatuses();
      this.ambientController?.resumeAuto();

      if (!this.isComplete) {
        this.scheduleAttention(900);
      }
    }
  }

  async handleWrongPath() {
    const owner = "wrong-path";

    if (!this.runtimeLock.acquire(owner)) {
      return;
    }

    this.pauseAttention();
    this.ambientController?.pauseAuto();

    try {
      const messages =
        this.sceneConfig.wrongPathMessages;

      const message =
        messages[
          Math.floor(
            Math.random() * messages.length
          )
        ];

      await this.modalController.showToast(
        message
      );
    } finally {
      this.runtimeLock.release(owner);
      this.ambientController?.resumeAuto();
      this.refreshStatuses();
    }

    /*
      Ya no llama directamente a
      playCurrentAttention().

      Pasa por scheduleAttention(), que comprueba
      nuevamente que el tocadiscos haya desbloqueado
      la historia.
    */
    if (!this.isComplete) {
      this.scheduleAttention(
        this.sceneConfig.attention
          .retryAfterWrongPath
      );
    }
  }

  async runEffect(object) {
    const effect =
      object.interaction?.effect;

    if (!effect) return;

    const position = object.position;

    const origin = {
      x:
        position.x +
        position.width / 2,
      y:
        position.y +
        position.width / 2
    };

    await this.effectsController.trigger(
      effect,
      origin
    );
  }

  setStatus(objectId, status) {
    const element =
      this.elements.get(objectId);

    if (element) {
      element.dataset.status = status;
    }
  }

  async resetStoryProgress() {
    this.pauseAttention();

    localStorage.removeItem(
      this.sceneConfig.storageKey
    );

    this.currentStoryStep = 0;
    this.completedObjects.clear();

    for (const objectId of this.storyOrder) {
      this.animationEngine.stop(objectId);
      this.animationEngine.showIdle(objectId);
    }

    this.refreshStatuses();

    /*
      Solo programa atención si la música ya había
      desbloqueado el recorrido.
    */
    this.scheduleAttention(800);

    await this.modalController.showToast(
      "Recorrido reiniciado para pruebas.",
      1600
    );
  }
}
