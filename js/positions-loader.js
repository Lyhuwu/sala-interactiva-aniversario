function toFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createEmergencyPosition(index, sceneConfig) {
  const width = 220;
  const columns = 3;
  const column = index % columns;
  const row = Math.floor(index / columns);

  return {
    x: 40 + column * 330,
    y: 180 + row * 380,
    width,
    zIndex: 20 + index
  };
}

function sanitizePosition(rawPosition, fallback, sceneConfig) {
  const width = clamp(
    Math.round(toFiniteNumber(rawPosition?.width, fallback.width)),
    20,
    sceneConfig.logicalWidth
  );

  return {
    x: clamp(
      Math.round(toFiniteNumber(rawPosition?.x, fallback.x)),
      0,
      Math.max(0, sceneConfig.logicalWidth - width)
    ),
    y: clamp(
      Math.round(toFiniteNumber(rawPosition?.y, fallback.y)),
      0,
      sceneConfig.logicalHeight
    ),
    width,
    zIndex: clamp(
      Math.round(toFiniteNumber(rawPosition?.zIndex, fallback.zIndex)),
      0,
      999
    )
  };
}

function extractPositions(payload) {
  if (!payload || typeof payload !== "object") return {};
  if (payload.positions && typeof payload.positions === "object") return payload.positions;
  return payload;
}

export async function loadAndApplyPositions({ path, objectConfigs, sceneConfig }) {
  let payload = null;
  let loadedFromFile = false;

  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    payload = await response.json();
    loadedFromFile = true;
  } catch (error) {
    console.error(
      `[Positions] No se pudo cargar ${path}. Se usarán posiciones de emergencia para que la página no se bloquee.`,
      error
    );
  }

  const source = extractPositions(payload);
  const applied = {};

  objectConfigs.forEach((object, index) => {
    const fallback = createEmergencyPosition(index, sceneConfig);
    const configured = source[object.id];

    if (!configured && loadedFromFile) {
      console.warn(`[Positions] Falta la posición de "${object.id}" en ${path}.`);
    }

    const position = sanitizePosition(configured, fallback, sceneConfig);
    object.position = position;
    applied[object.id] = { ...position };
  });

  if (loadedFromFile) {
    const knownIds = new Set(objectConfigs.map((object) => object.id));
    for (const objectId of Object.keys(source)) {
      if (!knownIds.has(objectId)) {
        console.warn(`[Positions] "${objectId}" existe en ${path}, pero no está registrado en objects-config.js.`);
      }
    }
  }

  return {
    loadedFromFile,
    path,
    payload,
    positions: applied
  };
}
