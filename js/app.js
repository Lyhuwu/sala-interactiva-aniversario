import {
  SCENE_CONFIG,
  STORY_ORDER,
  OBJECTS_CONFIG,
  getStoryObjects,
  getAmbientObjects
} from "./objects-config.js";

import { AssetLoader } from "./asset-loader.js";
import { AnimationEngine } from "./animation-engine.js";
import { RuntimeLock } from "./runtime-lock.js";
import { ModalController } from "./modal-controller.js";
import { EffectsController } from "./effects.js";
import { AudioController } from "./audio-controller.js";
import { StoryController } from "./story-controller.js";
import { AmbientController } from "./ambient-controller.js";
import { InteractionController } from "./interactions.js";
import { DebugController } from "./debug-controller.js";
import { loadAndApplyPositions } from "./positions-loader.js";

const app = document.getElementById("app");
const stage = document.getElementById("scene-stage");
const background = document.getElementById("room-background");
const objectsLayer = document.getElementById("objects-layer");

const loadingScreen = document.getElementById("loading-screen");
const loadingBar = document.getElementById("loading-bar");
const loadingMessage = document.getElementById("loading-message");
const loadingPercentage = document.getElementById("loading-percentage");

const effectsCanvas = document.getElementById("effects-layer");

const sceneViewport = document.getElementById("scene-viewport");
const introScreen = document.getElementById("intro-screen");
const introEnter = document.getElementById("intro-enter");

const reducedMotion = window
  .matchMedia("(prefers-reduced-motion: reduce)")
  .matches;

const debugMode =
  new URLSearchParams(window.location.search).get("debug") === "1";

const elements = new Map();

if (debugMode) {
  document.documentElement.classList.add("debug-mode");
}

/*
  Crea una sola imagen para cada objeto interactivo.
*/
function createObjectElements() {
  for (const object of OBJECTS_CONFIG) {
    const image = document.createElement("img");

    image.id = object.elementId;
    image.className = "interactive-object";
    image.alt = object.label;
    image.role = "button";
    image.tabIndex = 0;
    image.draggable = false;

    image.dataset.objectId = object.id;

    image.style.left = `${object.position.x}px`;
    image.style.top = `${object.position.y}px`;
    image.style.width = `${object.position.width}px`;
    image.style.zIndex = String(object.position.zIndex);

    image.setAttribute(
      "aria-label",
      `Interactuar con ${object.label}`
    );

    objectsLayer.appendChild(image);
    elements.set(object.id, image);
  }
}

/*
  Ajusta la sala completa al tamaño de la pantalla.
*/
function resizeScene() {
  const availableWidth = window.innerWidth;
  const availableHeight = window.innerHeight;

  const scale = Math.min(
    availableWidth / SCENE_CONFIG.logicalWidth,
    availableHeight / SCENE_CONFIG.logicalHeight
  );

  stage.style.transform =
    `translate(-50%, -50%) scale(${scale})`;
}

/*
  Actualiza el porcentaje y el texto de carga.
*/
function updateLoading({ percentage }) {
  if (percentage === 100) {
    loadingMessage.textContent =
      debugMode
        ? "Modo acomodo listo"
        : "Listo ♡";
  }
}

/*
  Muestra la portada después de cargar la sala.

  La habitación queda detrás, pero no puede recibir
  clics ni foco mientras la portada siga abierta.
*/
function showIntro() {
  /*
    El modo debug debe entrar directamente a la sala.
  */
  if (debugMode) {
    document.documentElement.classList.add(
      "experience-started"
    );

    return;
  }

  /*
    Si todavía no se agregó correctamente la portada
    al index.html, permite entrar a la sala sin romper
    toda la página.
  */
  if (!introScreen || !introEnter || !sceneViewport) {
    console.warn(
      "[App] No se encontró la portada. La sala iniciará directamente."
    );

    document.documentElement.classList.add(
      "experience-started"
    );

    return;
  }

  sceneViewport.inert = true;
  sceneViewport.setAttribute("aria-hidden", "true");

  introScreen.hidden = false;

  requestAnimationFrame(() => {
    introScreen.classList.add("is-visible");
    introEnter.focus();
  });
}

/*
  Cierra la portada cuando la persona toca el botón.
*/
function enterExperience() {
  if (
    debugMode ||
    !introScreen ||
    !introEnter ||
    introScreen.hidden
  ) {
    return;
  }

  introEnter.disabled = true;

  /*
    Desde este momento el CSS puede mostrar
    el aura inicial del tocadiscos.
  */
  document.documentElement.classList.add(
    "experience-started"
  );

  /*
    Habilita otra vez la habitación.
  */
  if (sceneViewport) {
    sceneViewport.inert = false;
    sceneViewport.removeAttribute("aria-hidden");
  }

  introScreen.classList.remove("is-visible");

  window.setTimeout(
    () => {
      introScreen.hidden = true;
      introEnter.disabled = false;
    },
    reducedMotion ? 10 : 620
  );
}

/*
  Conecta el botón de la portada.
*/
if (introEnter) {
  introEnter.addEventListener(
    "click",
    enterExperience
  );
}

/*
  Revela la escena cuando termina la precarga.

  Primero prepara la portada y después oculta
  la pantalla de carga, para que la habitación
  no aparezca sola durante un instante.
*/
function revealScene() {
  stage.hidden = false;
  app.setAttribute("aria-busy", "false");

  showIntro();

  requestAnimationFrame(() => {
    loadingScreen.classList.add("is-hidden");

    window.setTimeout(() => {
      loadingScreen.hidden = true;
    }, 380);
  });
}

async function initialize() {
  /*
    Carga y aplica las posiciones guardadas.
  */
  const positionsState =
    await loadAndApplyPositions({
      path: SCENE_CONFIG.positionsPath,
      objectConfigs: OBJECTS_CONFIG,
      sceneConfig: SCENE_CONFIG
    });

  createObjectElements();
  resizeScene();

  window.addEventListener(
    "resize",
    resizeScene,
    { passive: true }
  );

  /*
    Precarga todos los fondos y frames.
  */
  const assetLoader = new AssetLoader();

  const paths = assetLoader.collect(
    SCENE_CONFIG,
    OBJECTS_CONFIG
  );

  await assetLoader.loadAll(
    paths,
    updateLoading
  );

  /*
    Coloca el fondo de la habitación.
  */
  const loadedBackground =
    assetLoader.get(SCENE_CONFIG.background);

  if (loadedBackground) {
    background.src = loadedBackground.src;
  } else {
    background.alt =
      "No se pudo cargar el fondo de la sala";
  }

  /*
    Coloca el primer frame idle de cada objeto.
  */
  for (const object of OBJECTS_CONFIG) {
    const firstIdle =
      assetLoader.getFirstValidFrame(
        object,
        "idle"
      );

    const element = elements.get(object.id);

    if (firstIdle && element) {
      element.src = firstIdle.src;
    }
  }

  /*
    Prepara las máscaras para los clics
    sobre las partes visibles de los PNG.
  */
  assetLoader.createAllAlphaMasks(
    OBJECTS_CONFIG
  );

  const animationEngine =
    new AnimationEngine(
      OBJECTS_CONFIG,
      elements,
      assetLoader
    );

  /*
    Modo de acomodo de objetos.
  */
  if (debugMode) {
    const debugController =
      new DebugController({
        sceneConfig: SCENE_CONFIG,
        objectConfigs: OBJECTS_CONFIG,
        elements,
        stage
      });

    debugController.initialize();
    revealScene();

    window.salaDebug = {
      debugMode: true,
      debugController,
      animationEngine,
      assetLoader,
      objects: OBJECTS_CONFIG,
      positionsState
    };

    return;
  }

  /*
    Controladores normales de la experiencia.
  */
  const runtimeLock =
    new RuntimeLock();

  const modalController =
    new ModalController();

  const effectsController =
    new EffectsController(
      effectsCanvas,
      reducedMotion
    );

  const audioController =
    new AudioController();

  const storyController =
    new StoryController({
      sceneConfig: SCENE_CONFIG,
      storyOrder: STORY_ORDER,
      objectConfigs: getStoryObjects(),
      elements,
      animationEngine,
      modalController,
      effectsController,
      runtimeLock
    });

  const ambientController =
    new AmbientController({
      objectConfigs: getAmbientObjects(),
      elements,
      animationEngine,
      modalController,
      effectsController,
      audioController,
      runtimeLock,
      storyController
    });

  storyController.setAmbientController(
    ambientController
  );

  const interactionController =
    new InteractionController({
      objectConfigs: OBJECTS_CONFIG,
      elements,
      assetLoader,
      storyController,
      ambientController
    });

  /*
    Inicia los objetos en idle y conecta los clics.
  */
  storyController.initialize();
  ambientController.initialize();
  interactionController.bind();

  /*
    Oculta la carga y muestra la portada.
  */
  revealScene();

  /*
    Las animaciones ambientales pueden prepararse,
    pero Pinwi NO recibe atención todavía.

    Su atención empezará cuando el tocadiscos
    ejecute storyController.unlockStory().
  */
  ambientController.scheduleAuto();

  /*
    Pausa las animaciones cuando la persona
    cambia de pestaña o minimiza el navegador.
  */
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        storyController.pauseAttention();
        ambientController.handleVisibilityChange();
        animationEngine.pauseAll();
        effectsController.clear();

        return;
      }

      animationEngine.resumeAll();
      ambientController.handleVisibilityChange();

      /*
        Al regresar a la pestaña, solamente se
        reactiva la atención si la música ya
        desbloqueó el recorrido.
      */
      if (
        storyController.storyUnlocked &&
        !storyController.isComplete
      ) {
        storyController.scheduleAttention(
          1200
        );
      }
    }
  );

  /*
    Herramientas temporales para revisar y reiniciar.
  */
  window.resetStoryProgress = () =>
    storyController.resetStoryProgress();

  window.salaDebug = {
    storyController,
    ambientController,
    animationEngine,
    assetLoader,
    runtimeLock,
    objects: OBJECTS_CONFIG,
    positionsState
  };
}

/*
  Inicia toda la aplicación.
*/
initialize().catch((error) => {
  console.error(
    "[App] No fue posible iniciar la sala.",
    error
  );

  loadingMessage.textContent =
    "Ocurrió un error al preparar la sala.";

  loadingPercentage.textContent =
    "Revisa la consola del navegador.";
});
