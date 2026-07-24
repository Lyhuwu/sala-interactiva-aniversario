import { OBJECT_CATEGORY } from "./objects-config.js";

export class InteractionController {
  constructor({
    objectConfigs,
    elements,
    assetLoader,
    storyController,
    ambientController
  }) {
    this.objects = [...objectConfigs].sort(
      (a, b) => (b.position?.zIndex ?? 0) - (a.position?.zIndex ?? 0)
    );
    this.elements = elements;
    this.assetLoader = assetLoader;
    this.storyController = storyController;
    this.ambientController = ambientController;
    this.objectsLayer = document.getElementById("objects-layer");
    this.lastPointerActivation = 0;
  }

  bind() {
    this.objectsLayer.addEventListener("click", (event) => this.onSceneClick(event));

    for (const object of this.objects) {
      const element = this.elements.get(object.id);
      if (!element) continue;

      element.addEventListener("dragstart", (event) => event.preventDefault());
      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.route(object);
        }
      });
    }
  }

  onSceneClick(event) {
    const now = performance.now();
    if (now - this.lastPointerActivation < 280) return;
    this.lastPointerActivation = now;

    // Recorre de mayor a menor z-index. Si el PNG superior es transparente
    // en ese punto, continúa buscando un objeto visible debajo.
    for (const object of this.objects) {
      if (this.isValidHit(event, object)) {
        this.route(object);
        return;
      }
    }
  }

  route(object) {
    if (object.category === OBJECT_CATEGORY.STORY) {
      this.storyController.handleClick(object.id);
    } else {
      this.ambientController.handleClick(object.id);
    }
  }

  isValidHit(event, object) {
    const element = this.elements.get(object.id);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      return false;
    }

    if (object.hitTest?.mode !== "alpha") return true;

    const mask = this.assetLoader.getAlphaMask(object.id);
    if (!mask || rect.width <= 0 || rect.height <= 0) return true;

    const normalizedX = (event.clientX - rect.left) / rect.width;
    const normalizedY = (event.clientY - rect.top) / rect.height;
    const x = Math.min(mask.width - 1, Math.max(0, Math.floor(normalizedX * mask.width)));
    const y = Math.min(mask.height - 1, Math.max(0, Math.floor(normalizedY * mask.height)));
    const alphaIndex = ((y * mask.width) + x) * 4 + 3;
    const alpha = mask.pixels[alphaIndex] ?? 0;

    return alpha >= (object.hitTest.alphaThreshold ?? 18);
  }
}
