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

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const debugMode = new URLSearchParams(window.location.search).get("debug") === "1";
const elements = new Map();

if (debugMode) document.documentElement.classList.add("debug-mode");

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
    image.setAttribute("aria-label", `Interactuar con ${object.label}`);
    objectsLayer.appendChild(image);
    elements.set(object.id, image);
  }
}

function resizeScene() {
  const availableWidth = window.innerWidth;
  const availableHeight = window.innerHeight;
  const scale = Math.min(
    availableWidth / SCENE_CONFIG.logicalWidth,
    availableHeight / SCENE_CONFIG.logicalHeight
  );

  stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

function updateLoading({ percentage, path }) {
  loadingBar.style.width = `${percentage}%`;
  loadingPercentage.textContent = `${percentage}%`;
  const name = path.split("/").pop();
  loadingMessage.textContent = percentage < 100
    ? `Preparando ${name}…`
    : debugMode
      ? "Modo acomodo listo"
      : "La sala está lista 💕";
}

function showIntro() {
  if (debugMode) {
    document.documentElement.classList.add("experience-started");
    return;
  }

  /*
    La sala ya está cargada detrás, pero queda bloqueada
    mientras la portada esté visible.
  */
  sceneViewport.inert = true;
  sceneViewport.setAttribute("aria-hidden", "true");

  introScreen.hidden = false;

  requestAnimationFrame(() => {
    introScreen.classList.add("is-visible");
    introEnter.focus();
  });
}

function enterExperience() {
  if (debugMode || introScreen.hidden) return;

  introEnter.disabled = true;

  /*
    Desde este momento puede mostrarse el aura
    inicial del tocadiscos.
  */
  document.documentElement.classList.add("experience-started");

  /*
    Vuelve a habilitar la habitación.
  */
  sceneViewport.inert = false;
  sceneViewport.removeAttribute("aria-hidden");

  introScreen.classList.remove("is-visible");

  window.setTimeout(() => {
    introScreen.hidden = true;
    introEnter.disabled = false;
  }, reducedMotion ? 10 : 620);
}

introEnter.addEventListener("click", enterExperience);
function revealScene() {
  stage.hidden = false;
  app.setAttribute("aria-busy", "false");

  /*
    La portada se prepara antes de ocultar la carga,
    para que nunca haya un instante donde aparezca
    la habitación sin protección.
  */
  showIntro();

  requestAnimationFrame(() => {
    loadingScreen.classList.add("is-hidden");

    window.setTimeout(() => {
      loadingScreen.hidden = true;
    }, 380);
  });
}

async function initialize() {
  const positionsState = await loadAndApplyPositions({
    path: SCENE_CONFIG.positionsPath,
    objectConfigs: OBJECTS_CONFIG,
    sceneConfig: SCENE_CONFIG
  });

  createObjectElements();
  resizeScene();
  window.addEventListener("resize", resizeScene, { passive: true });

  const assetLoader = new AssetLoader();
  const paths = assetLoader.collect(SCENE_CONFIG, OBJECTS_CONFIG);
  await assetLoader.loadAll(paths, updateLoading);

  const loadedBackground = assetLoader.get(SCENE_CONFIG.background);
  if (loadedBackground) {
    background.src = loadedBackground.src;
  } else {
    background.alt = "No se pudo cargar el fondo de la sala";
  }

  for (const object of OBJECTS_CONFIG) {
    const firstIdle = assetLoader.getFirstValidFrame(object, "idle");
    const element = elements.get(object.id);
    if (firstIdle && element) element.src = firstIdle.src;
  }

  assetLoader.createAllAlphaMasks(OBJECTS_CONFIG);

  const animationEngine = new AnimationEngine(OBJECTS_CONFIG, elements, assetLoader);

  if (debugMode) {
    const debugController = new DebugController({
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

  const runtimeLock = new RuntimeLock();
  const modalController = new ModalController();
  const effectsController = new EffectsController(effectsCanvas, reducedMotion);
  const audioController = new AudioController();

  const storyController = new StoryController({
    sceneConfig: SCENE_CONFIG,
    storyOrder: STORY_ORDER,
    objectConfigs: getStoryObjects(),
    elements,
    animationEngine,
    modalController,
    effectsController,
    runtimeLock
  });

  const ambientController = new AmbientController({
    objectConfigs: getAmbientObjects(),
    elements,
    animationEngine,
    modalController,
    effectsController,
    audioController,
    runtimeLock,
    storyController
  });

  storyController.setAmbientController(ambientController);

  const interactionController = new InteractionController({
    objectConfigs: OBJECTS_CONFIG,
    elements,
    assetLoader,
    storyController,
    ambientController
  });

  storyController.initialize();
  ambientController.initialize();
  interactionController.bind();

  revealScene();

  storyController.scheduleAttention(reducedMotion ? 2500 : 1800);
  ambientController.scheduleAuto();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      storyController.pauseAttention();
      ambientController.handleVisibilityChange();
      animationEngine.pauseAll();
      effectsController.clear();
    } else {
      animationEngine.resumeAll();
      ambientController.handleVisibilityChange();
      if (!storyController.isComplete) storyController.scheduleAttention(1200);
    }
  });

  window.resetStoryProgress = () => storyController.resetStoryProgress();
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

initialize().catch((error) => {
  console.error("[App] No fue posible iniciar la sala.", error);
  loadingMessage.textContent = "Ocurrió un error al preparar la sala.";
  loadingPercentage.textContent = "Revisa la consola del navegador.";
});
