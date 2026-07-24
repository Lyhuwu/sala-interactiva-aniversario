export const OBJECT_CATEGORY = Object.freeze({
  STORY: "story",
  AMBIENT: "ambient"
});

export const OBJECT_STATUS = Object.freeze({
  LOCKED: "locked",
  READY: "ready",
  ATTENTION: "attention",
  EVENT: "event",
  WAITING: "waiting",
  GUIDING: "guiding",
  RETURNING: "returning",
  COMPLETED: "completed",
  AMBIENT: "ambient"
});

export const SCENE_CONFIG = Object.freeze({
  logicalWidth: 1080,
  logicalHeight: 1920,
  background: "./assets/fondo/fondoestatico.png",
  storageKey: "sala-interactiva-progress-v1",
  attention: {
    minDelay: 6000,
    maxDelay: 10000,
    retryAfterWrongPath: 450
  },
  wrongPathMessages: [
    "¡Altooo! Este todavía no es el camino. Sigue las pistas 💌",
    "Casi, amor, pero esa sorpresa viene después 👀",
    "Este guarda algo especial, pero primero sigue la pista que te está llamando 💕"
  ],
  finalMessage: "Llegaste al final de este recorrido, amor 💗 Puedes volver a abrir todas las sorpresas cuando quieras."
});

export const STORY_ORDER = Object.freeze([
  "pinwis",
  "pajaritos",
  "calendario",
  "tele",
  "marco",
  "pollitos",
  "sobre"
]);

function numberedFrames(objectId, folder, fileToken, count) {
  return Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(3, "0");
    return `./assets/objetos/${objectId}/${folder}/${objectId}_${fileToken}_frame_${number}.png`;
  });
}

function sequence(frames, durations, options = {}) {
  return {
    frames,
    durations,
    loop: options.loop ?? false,
    holdLastFrame: options.holdLastFrame ?? true
  };
}

function contentImage(objectId, title, text = "") {
  return {
    type: "letter",
    title,
    image: `./assets/interfaz/cartas/carta_${objectId}.png`,
    text,
    closeOnBackdrop: false
  };
}

/*
  IMPORTANTE:
  - Las posiciones actuales sirven para probar la base con los recursos de muestra.
  - Cuando tengas tu fondo y tus dibujos finales, cambia x, y y width aquí.
  - Todos los frames de un mismo objeto deben conservar el mismo lienzo interno.
  - Si una secuencia no tiene frames, usa frames: [] y el motor la omitirá.
*/
export const OBJECTS_CONFIG = [
  {
    id: "pinwis",
    label: "Pingüinos",
    category: OBJECT_CATEGORY.STORY,
    elementId: "object-pinwis",
    position: { x: 100, y: 1390, width: 300, zIndex: 40 },
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    animations: {
      idle: sequence(numberedFrames("pinwis", "idle", "idle", 2), [700, 700], { loop: true }),
      atencion: sequence(numberedFrames("pinwis", "atencion", "atencion", 3), [130, 130, 190]),
      evento: sequence(numberedFrames("pinwis", "evento", "evento", 3), [180, 180, 420]),
      guiando: sequence(numberedFrames("pinwis", "guiando", "guiando", 2), [240, 420]),
      regresoIdle: sequence(numberedFrames("pinwis", "regreso_idle", "regreso_idle", 2), [180, 240])
    },
    interaction: {
      replayable: true,
      effect: "hearts",
      content: contentImage("pinwis", "Para ti, mi amor")
    }
  },
  {
    id: "pajaritos",
    label: "Pajaritos",
    category: OBJECT_CATEGORY.STORY,
    elementId: "object-pajaritos",
    position: { x: 625, y: 270, width: 300, zIndex: 35 },
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    animations: {
      idle: sequence(numberedFrames("pajaritos", "idle", "idle", 2), [650, 650], { loop: true }),
      atencion: sequence(numberedFrames("pajaritos", "atencion", "atencion", 3), [130, 130, 200]),
      evento: sequence(numberedFrames("pajaritos", "evento", "evento", 3), [170, 170, 430]),
      guiando: sequence(numberedFrames("pajaritos", "guiando", "guiando", 2), [230, 430]),
      regresoIdle: sequence(numberedFrames("pajaritos", "regreso_idle", "regreso_idle", 2), [170, 250])
    },
    interaction: {
      replayable: true,
      effect: "hearts",
      content: contentImage("pajaritos", "Una pequeña carta")
    }
  },
  {
    id: "calendario",
    label: "Calendario",
    category: OBJECT_CATEGORY.STORY,
    elementId: "object-calendario",
    position: { x: 80, y: 280, width: 220, zIndex: 30 },
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    animations: {
      idle: sequence(numberedFrames("calendario", "idle", "idle", 1), [1000], { loop: true }),
      atencion: sequence(numberedFrames("calendario", "atencion", "atencion", 3), [150, 150, 220]),
      evento: sequence(numberedFrames("calendario", "evento", "evento", 3), [160, 180, 480]),
      guiando: sequence(numberedFrames("calendario", "guiando", "guiando", 2), [250, 430]),
      regresoIdle: sequence(numberedFrames("calendario", "regreso_idle", "regreso_idle", 2), [180, 260])
    },
    interaction: {
      replayable: true,
      effect: "confetti",
      content: contentImage("calendario", "Nuestra fecha especial")
    }
  },
  {
    id: "tele",
    label: "Televisión",
    category: OBJECT_CATEGORY.STORY,
    elementId: "object-tele",
    position: { x: 575, y: 720, width: 380, zIndex: 32 },
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    animations: {
      idle: sequence(numberedFrames("tele", "idle", "idle", 1), [1000], { loop: true }),
      atencion: sequence(numberedFrames("tele", "atencion", "atencion", 3), [100, 100, 220]),
      evento: sequence(numberedFrames("tele", "evento", "evento", 4), [170, 150, 230, 650]),
      guiando: sequence(numberedFrames("tele", "guiando", "guiando", 3), [180, 180, 500]),
      regresoIdle: sequence(numberedFrames("tele", "regreso_idle", "regreso_idle", 2), [200, 300])
    },
    interaction: {
      replayable: true,
      effect: null,
      content: contentImage("tele", "Reír y jugar contigo")
    }
  },
  {
    id: "marco",
    label: "Marco",
    category: OBJECT_CATEGORY.STORY,
    elementId: "object-marco",
    position: { x: 110, y: 675, width: 285, zIndex: 31 },
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    animations: {
      idle: sequence(numberedFrames("marco", "idle", "idle", 1), [1000], { loop: true }),
      atencion: sequence(numberedFrames("marco", "atencion", "atencion", 3), [140, 140, 220]),
      evento: sequence(numberedFrames("marco", "evento", "evento", 3), [180, 180, 470]),
      guiando: sequence(numberedFrames("marco", "guiando", "guiando", 2), [220, 430]),
      regresoIdle: sequence(numberedFrames("marco", "regreso_idle", "regreso_idle", 2), [180, 260])
    },
    interaction: {
      replayable: true,
      effect: "hearts",
      content: {
        type: "photo",
        title: "Un recuerdo nuestro",
        image: "./assets/interfaz/fotos/foto_marco.png",
        text: "Sustituye esta imagen por la fotografía que quieras mostrar.",
        closeOnBackdrop: false
      }
    }
  },
  {
    id: "pollitos",
    label: "Pollitos",
    category: OBJECT_CATEGORY.STORY,
    elementId: "object-pollitos",
    position: { x: 310, y: 1510, width: 455, zIndex: 42 },
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    animations: {
      idle: sequence(numberedFrames("pollitos", "idle", "idle", 2), [650, 650], { loop: true }),
      atencion: sequence(numberedFrames("pollitos", "atencion", "atencion", 3), [140, 140, 220]),
      evento: sequence(numberedFrames("pollitos", "evento", "evento", 4), [170, 170, 190, 520]),
      guiando: sequence(numberedFrames("pollitos", "guiando", "guiando", 2), [230, 460]),
      regresoIdle: sequence(numberedFrames("pollitos", "regreso_idle", "regreso_idle", 3), [170, 170, 260])
    },
    interaction: {
      replayable: true,
      effect: "hearts",
      content: contentImage("pollitos", "POYOOO 💛")
    }
  },
  {
    id: "sobre",
    label: "Sobre",
    category: OBJECT_CATEGORY.STORY,
    elementId: "object-sobre",
    position: { x: 780, y: 1680, width: 220, zIndex: 45 },
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    animations: {
      idle: sequence(numberedFrames("sobre", "idle", "idle", 1), [1000], { loop: true }),
      atencion: sequence(numberedFrames("sobre", "atencion", "atencion", 4), [90, 90, 90, 150]),
      evento: sequence(numberedFrames("sobre", "evento", "evento", 4), [150, 170, 190, 550]),
      guiando: sequence([], [], { holdLastFrame: true }),
      regresoIdle: sequence(numberedFrames("sobre", "regreso_idle", "regreso_idle", 3), [170, 170, 280])
    },
    interaction: {
      replayable: true,
      effect: "hearts",
      content: contentImage("sobre", "Mi carta para ti")
    }
  },

  // OBJETOS AMBIENTALES: no pertenecen a STORY_ORDER.
  {
    id: "planta",
    label: "Planta",
    category: OBJECT_CATEGORY.AMBIENT,
    elementId: "object-planta",
    position: { x: 35, y: 1050, width: 245, zIndex: 25 },
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    ambient: {
      mode: "interactive",
      autoEnabled: true,
      minDelay: 17000,
      maxDelay: 30000
    },
    animations: {
      idle: sequence(numberedFrames("planta", "idle", "idle", 1), [1000], { loop: true }),
      ambiente: sequence(numberedFrames("planta", "ambiente", "ambiente", 3), [220, 220, 340]),
      evento: sequence(numberedFrames("planta", "evento", "evento", 3), [180, 220, 450]),
      regresoIdle: sequence(numberedFrames("planta", "regreso_idle", "regreso_idle", 2), [190, 260])
    },
    interaction: {
      replayable: true,
      effect: "hearts",
      content: null
    }
  },
  {
    id: "perrito",
    label: "Perrito",
    category: OBJECT_CATEGORY.AMBIENT,
    elementId: "object-perrito",
    position: { x: 660, y: 1335, width: 300, zIndex: 41 },
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    ambient: {
      mode: "interactive",
      autoEnabled: true,
      minDelay: 15000,
      maxDelay: 28000
    },
    animations: {
      idle: sequence(numberedFrames("perrito", "idle", "idle", 2), [750, 750], { loop: true }),
      ambiente: sequence(numberedFrames("perrito", "ambiente", "ambiente", 3), [180, 180, 350]),
      evento: sequence(numberedFrames("perrito", "evento", "evento", 4), [150, 150, 180, 450]),
      regresoIdle: sequence(numberedFrames("perrito", "regreso_idle", "regreso_idle", 2), [180, 280])
    },
    interaction: {
      replayable: true,
      effect: "hearts",
      content: {
        type: "dialogue",
        title: "Guau 💕",
        image: null,
        text: "Este objeto es libre: puede tocarse sin cambiar el recorrido principal.",
        closeOnBackdrop: true
      }
    }
  },
  {
    id: "tocadiscos",
    label: "Tocadiscos",
    category: OBJECT_CATEGORY.AMBIENT,
    elementId: "object-tocadiscos",
    position: { x: 655, y: 1035, width: 315, zIndex: 36 },
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    ambient: {
      mode: "persistentAudio",
      autoEnabled: false
    },
    audio: {
      src: "./assets/sonidos/tocadiscos_demo.wav",
      loop: true,
      volume: 0.28
    },
    animations: {
      idle: sequence(numberedFrames("tocadiscos", "idle", "idle", 1), [1000], { loop: true }),
      evento: sequence(numberedFrames("tocadiscos", "evento", "evento", 3), [180, 200, 360]),
      activo: sequence(numberedFrames("tocadiscos", "activo", "activo", 2), [260, 260], { loop: true }),
      regresoIdle: sequence(numberedFrames("tocadiscos", "regreso_idle", "regreso_idle", 3), [180, 180, 300])
    },
    interaction: {
      replayable: true,
      effect: null,
      content: null
    }
  }
];

export function getObjectConfig(objectId) {
  return OBJECTS_CONFIG.find((object) => object.id === objectId) ?? null;
}

export function getStoryObjects() {
  return OBJECTS_CONFIG.filter((object) => object.category === OBJECT_CATEGORY.STORY);
}

export function getAmbientObjects() {
  return OBJECTS_CONFIG.filter((object) => object.category === OBJECT_CATEGORY.AMBIENT);
}
