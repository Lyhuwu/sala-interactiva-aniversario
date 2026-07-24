const DEBUG_STORAGE_KEY = "sala-interactiva-debug-positions-v1";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value) {
  return Math.round(Number(value) || 0);
}

export class DebugController {
  constructor({ sceneConfig, objectConfigs, elements, stage }) {
    this.sceneConfig = sceneConfig;
    this.objects = objectConfigs;
    this.objectMap = new Map(objectConfigs.map((object) => [object.id, object]));
    this.elements = elements;
    this.stage = stage;
    this.positions = new Map();
    this.originalPositions = new Map();
    this.selectedId = objectConfigs[0]?.id ?? null;
    this.drag = null;
    this.step = 5;

    this.panel = document.getElementById("debug-panel");
    this.select = document.getElementById("debug-object-select");
    this.inputX = document.getElementById("debug-x");
    this.inputY = document.getElementById("debug-y");
    this.inputWidth = document.getElementById("debug-width");
    this.inputZ = document.getElementById("debug-z");
    this.stepSelect = document.getElementById("debug-step");
    this.status = document.getElementById("debug-status");
    this.toggleButton = document.getElementById("debug-toggle");
    this.body = document.getElementById("debug-body");
  }

  initialize() {
    document.documentElement.classList.add("debug-mode");
    this.panel.hidden = false;

    this.loadInitialPositions();
    this.populateSelect();
    this.bindPanel();
    this.bindObjects();
    this.applyAllPositions();

    if (this.selectedId) this.selectObject(this.selectedId);
    this.setStatus("Arrastra un objeto o usa los controles. Al terminar, descarga positions.json y reemplaza assets/config/positions.json.");
  }

  loadInitialPositions() {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(DEBUG_STORAGE_KEY) || "{}") || {};
    } catch (error) {
      console.warn("[Debug] No se pudieron leer las posiciones guardadas.", error);
    }

    for (const object of this.objects) {
      const original = {
        x: round(object.position.x),
        y: round(object.position.y),
        width: round(object.position.width),
        zIndex: round(object.position.zIndex)
      };
      this.originalPositions.set(object.id, original);

      const candidate = saved[object.id];
      this.positions.set(object.id, this.sanitizePosition({
        ...original,
        ...(candidate && typeof candidate === "object" ? candidate : {})
      }, object.id));
    }
  }

  populateSelect() {
    this.select.replaceChildren();
    for (const object of this.objects) {
      const option = document.createElement("option");
      option.value = object.id;
      option.textContent = `${object.label} (${object.id})`;
      this.select.appendChild(option);
    }
  }

  bindPanel() {
    this.select.addEventListener("change", () => this.selectObject(this.select.value));

    const applyInputs = () => {
      if (!this.selectedId) return;
      this.updatePosition(this.selectedId, {
        x: this.inputX.value,
        y: this.inputY.value,
        width: this.inputWidth.value,
        zIndex: this.inputZ.value
      });
    };

    for (const input of [this.inputX, this.inputY, this.inputWidth, this.inputZ]) {
      input.addEventListener("change", applyInputs);
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          input.blur();
          applyInputs();
        }
      });
    }

    this.stepSelect.addEventListener("change", () => {
      this.step = Math.max(1, round(this.stepSelect.value));
    });

    this.panel.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-debug-action]");
      if (!button) return;
      this.handleAction(button.dataset.debugAction);
    });

    this.toggleButton.addEventListener("click", () => {
      const collapsed = this.panel.classList.toggle("is-collapsed");
      this.body.hidden = collapsed;
      this.toggleButton.textContent = collapsed ? "Mostrar" : "Ocultar";
      this.toggleButton.setAttribute("aria-expanded", String(!collapsed));
    });
  }

  bindObjects() {
    for (const object of this.objects) {
      const element = this.elements.get(object.id);
      if (!element) continue;

      element.dataset.debugObject = "true";
      element.addEventListener("pointerdown", (event) => this.startDrag(event, object.id));
      element.addEventListener("pointermove", (event) => this.moveDrag(event));
      element.addEventListener("pointerup", (event) => this.endDrag(event));
      element.addEventListener("pointercancel", (event) => this.endDrag(event));
      element.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
    }
  }

  startDrag(event, objectId) {
    if (event.button !== undefined && event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();
    this.selectObject(objectId);

    const element = this.elements.get(objectId);
    const position = this.positions.get(objectId);
    if (!element || !position) return;

    element.setPointerCapture?.(event.pointerId);
    element.classList.add("is-debug-dragging");

    const point = this.clientToScene(event.clientX, event.clientY);
    this.drag = {
      pointerId: event.pointerId,
      objectId,
      offsetX: point.x - position.x,
      offsetY: point.y - position.y
    };
  }

  moveDrag(event) {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    event.preventDefault();

    const point = this.clientToScene(event.clientX, event.clientY);
    this.updatePosition(this.drag.objectId, {
      x: point.x - this.drag.offsetX,
      y: point.y - this.drag.offsetY
    }, { announce: false });
  }

  endDrag(event) {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;

    const element = this.elements.get(this.drag.objectId);
    element?.classList.remove("is-debug-dragging");
    try {
      element?.releasePointerCapture?.(event.pointerId);
    } catch {
      // El navegador puede liberar la captura automáticamente.
    }

    this.drag = null;
    this.savePositions();
    this.setStatus("Posición guardada en el navegador. Al terminar, descarga positions.json.");
  }

  clientToScene(clientX, clientY) {
    const rect = this.stage.getBoundingClientRect();
    const scaleX = rect.width / this.sceneConfig.logicalWidth || 1;
    const scaleY = rect.height / this.sceneConfig.logicalHeight || 1;

    return {
      x: (clientX - rect.left) / scaleX,
      y: (clientY - rect.top) / scaleY
    };
  }

  selectObject(objectId) {
    if (!this.objectMap.has(objectId)) return;

    this.selectedId = objectId;
    this.select.value = objectId;

    for (const [id, element] of this.elements.entries()) {
      element.classList.toggle("is-debug-selected", id === objectId);
    }

    this.refreshInputs();
    const object = this.objectMap.get(objectId);
    this.setStatus(`${object.label}: arrástralo sobre la sala o ajusta sus números.`);
  }

  updatePosition(objectId, patch, { announce = true } = {}) {
    const current = this.positions.get(objectId);
    if (!current) return;

    const next = this.sanitizePosition({ ...current, ...patch }, objectId);
    this.positions.set(objectId, next);
    this.applyPosition(objectId);

    if (objectId === this.selectedId) this.refreshInputs();
    this.savePositions();

    if (announce) this.setStatus(this.formatSingle(objectId));
  }

  sanitizePosition(position, objectId = null) {
    const element = objectId ? this.elements.get(objectId) : null;
    const width = clamp(round(position.width), 20, this.sceneConfig.logicalWidth);
    const naturalRatio = element?.naturalWidth > 0
      ? element.naturalHeight / element.naturalWidth
      : 1;
    const estimatedHeight = Math.max(1, width * naturalRatio);

    return {
      x: clamp(round(position.x), 0, Math.max(0, this.sceneConfig.logicalWidth - width)),
      y: clamp(round(position.y), 0, Math.max(0, this.sceneConfig.logicalHeight - estimatedHeight)),
      width,
      zIndex: clamp(round(position.zIndex), 0, 999)
    };
  }

  applyAllPositions() {
    for (const object of this.objects) this.applyPosition(object.id);
  }

  applyPosition(objectId) {
    const element = this.elements.get(objectId);
    const position = this.positions.get(objectId);
    if (!element || !position) return;

    element.style.left = `${position.x}px`;
    element.style.top = `${position.y}px`;
    element.style.width = `${position.width}px`;
    element.style.zIndex = String(position.zIndex);
  }

  refreshInputs() {
    const position = this.positions.get(this.selectedId);
    if (!position) return;

    this.inputX.value = String(position.x);
    this.inputY.value = String(position.y);
    this.inputWidth.value = String(position.width);
    this.inputZ.value = String(position.zIndex);
  }

  handleAction(action) {
    if (!this.selectedId) return;
    const step = this.step;

    const actions = {
      left: () => this.nudge({ x: -step }),
      right: () => this.nudge({ x: step }),
      up: () => this.nudge({ y: -step }),
      down: () => this.nudge({ y: step }),
      smaller: () => this.nudge({ width: -step }),
      larger: () => this.nudge({ width: step }),
      "z-down": () => this.nudge({ zIndex: -1 }),
      "z-up": () => this.nudge({ zIndex: 1 }),
      "copy-selected": () => this.copyText(this.formatSingle(this.selectedId), "Valores del objeto copiados."),
      "copy-all": () => this.copyText(this.formatAll(), "Todas las posiciones fueron copiadas."),
      "download-json": () => this.downloadJson(),
      "reset-selected": () => this.resetSelected(),
      "reset-all": () => this.resetAll()
    };

    actions[action]?.();
  }

  nudge(delta) {
    const current = this.positions.get(this.selectedId);
    if (!current) return;

    this.updatePosition(this.selectedId, {
      x: current.x + (delta.x ?? 0),
      y: current.y + (delta.y ?? 0),
      width: current.width + (delta.width ?? 0),
      zIndex: current.zIndex + (delta.zIndex ?? 0)
    });
  }

  resetSelected() {
    const original = this.originalPositions.get(this.selectedId);
    if (!original) return;
    this.positions.set(this.selectedId, { ...original });
    this.applyPosition(this.selectedId);
    this.refreshInputs();
    this.savePositions();
    this.setStatus("El objeto seleccionado volvió a la posición guardada en assets/config/positions.json.");
  }

  resetAll() {
    for (const [objectId, original] of this.originalPositions.entries()) {
      this.positions.set(objectId, { ...original });
    }
    this.applyAllPositions();
    this.refreshInputs();
    localStorage.removeItem(DEBUG_STORAGE_KEY);
    this.setStatus("Todas las posiciones volvieron a los valores de assets/config/positions.json.");
  }

  savePositions() {
    const data = Object.fromEntries(this.positions.entries());
    try {
      localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("[Debug] No se pudieron guardar las posiciones.", error);
    }
  }

  buildPayload() {
    return {
      schemaVersion: 1,
      logicalScene: {
        width: this.sceneConfig.logicalWidth,
        height: this.sceneConfig.logicalHeight
      },
      positions: Object.fromEntries(this.positions.entries())
    };
  }

  formatSingle(objectId) {
    const object = this.objectMap.get(objectId);
    const position = this.positions.get(objectId);
    if (!object || !position) return "";

    return JSON.stringify({ [object.id]: position }, null, 2);
  }

  formatAll() {
    return JSON.stringify(this.buildPayload(), null, 2);
  }

  async copyText(text, successMessage) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      this.setStatus(successMessage);
    } catch (error) {
      console.error("[Debug] No se pudo copiar.", error);
      this.setStatus("No se pudo copiar automáticamente. Usa Descargar JSON.");
    }
  }

  downloadJson() {
    const payload = this.buildPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "positions.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    this.setStatus("Se descargó positions.json. Reemplázalo en assets/config/positions.json.");
  }

  setStatus(message) {
    this.status.textContent = message;
  }
}
