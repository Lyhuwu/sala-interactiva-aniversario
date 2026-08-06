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
  positionsPath: "./assets/config/positions.json",
  storageKey: "sala-interactiva-progress-v2",
  attention: {
    minDelay: 4200,
    maxDelay: 6800,
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
  "tele",
  "marco",
  "calendario",
  "pollitos",
  "sobre"
]);

function numberedFrames(objectId, folder, fileToken, count) {
  return Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(3, "0");
    return `./assets/objetos/${objectId}/${folder}/${objectId}_${fileToken}_frame_${number}.png`;
  });
}

function finalFrame(objectFolder, fileName) {
  return `./assets/objetos/${objectFolder}/finales/${fileName}`;
}

function sequence(frames, durations, options = {}) {
  if (frames.length !== durations.length) {
    throw new Error(`Secuencia inválida: ${frames.length} frames y ${durations.length} duraciones.`);
  }

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

const emptySequence = () => sequence([], []);

export const OBJECTS_CONFIG = [
  {
    id: "pinwis",
    label: "Pinwi",
    category: OBJECT_CATEGORY.STORY,
    elementId: "object-pinwis",
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    animations: {
      idle: sequence([
        finalFrame("pinwis", "pinwi_base_01.png"),
        finalFrame("pinwis", "pinwi_idle_02.png"),
        finalFrame("pinwis", "pinwi_idle_03.png"),
        finalFrame("pinwis", "pinwi_base_01.png")
      ], [7000, 180, 240, 1400], { loop: true }),

      atencion: sequence([
        finalFrame("pinwis", "pinwi_base_01.png"),
        finalFrame("pinwis", "pinwi_atencion_02.png"),
        finalFrame("pinwis", "pinwi_atencion_03.png"),
        finalFrame("pinwis", "pinwi_base_01.png")
      ], [180, 220, 420, 650]),

      evento: sequence([
        finalFrame("pinwis", "pinwi_base_01.png"),
        finalFrame("pinwis", "pinwi_evento_02.png"),
        finalFrame("pinwis", "pinwi_evento_03.png"),
        finalFrame("pinwis", "pinwi_evento_04.png"),
        finalFrame("pinwis", "pinwi_evento_05.png"),
        finalFrame("pinwis", "pinwi_evento_06.png"),
        finalFrame("pinwis", "pinwi_evento_07.png")
      ], [200, 220, 220, 240, 300, 520, 900]),

      guiando: sequence([
        finalFrame("pinwis", "pinwi_evento_07.png"),
        finalFrame("pinwis", "pinwi_final_02.png"),
        finalFrame("pinwis", "pinwi_final_03.png"),
        finalFrame("pinwis", "pinwi_final_04.png"),
        finalFrame("pinwis", "pinwi_final_05.png"),
        finalFrame("pinwis", "pinwi_base_01.png")
      ], [300, 260, 260, 420, 900, 550]),

      regresoIdle: sequence([
        finalFrame("pinwis", "pinwi_base_01.png")
      ], [350])
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
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    animations: {
      idle: sequence([
        finalFrame("pajaritos", "pajaritos_base_01.png"),
        finalFrame("pajaritos", "pajaritos_idle_02.png"),
        finalFrame("pajaritos", "pajaritos_idle_03.png"),
        finalFrame("pajaritos", "pajaritos_idle_02.png"),
        finalFrame("pajaritos", "pajaritos_base_01.png")
      ], [9400, 180, 300, 180, 1600], { loop: true }),

      atencion: sequence([
        finalFrame("pajaritos", "pajaritos_base_01.png"),
        finalFrame("pajaritos", "pajaritos_idle_02.png"),
        finalFrame("pajaritos", "pajaritos_idle_03.png"),
        finalFrame("pajaritos", "pajaritos_atencion_02.png"),
        finalFrame("pajaritos", "pajaritos_atencion_03.png"),
        finalFrame("pajaritos", "pajaritos_atencion_02.png"),
        finalFrame("pajaritos", "pajaritos_idle_03.png"),
        finalFrame("pajaritos", "pajaritos_idle_02.png"),
        finalFrame("pajaritos", "pajaritos_base_01.png")
      ], [160, 180, 260, 220, 650, 220, 250, 180, 650]),

      evento: sequence([
        finalFrame("pajaritos", "pajaritos_base_01.png"),
        finalFrame("pajaritos", "pajaritos_idle_02.png"),
        finalFrame("pajaritos", "pajaritos_idle_03.png"),
        finalFrame("pajaritos", "pajaritos_atencion_02.png"),
        finalFrame("pajaritos", "pajaritos_atencion_03.png"),
        finalFrame("pajaritos", "pajaritos_evento_06.png")
      ], [180, 180, 260, 220, 450, 1100]),

      guiando: sequence([
  finalFrame("pajaritos", "pajaritos_evento_06.png"),
  finalFrame("pajaritos", "pajaritos_idle_03.png")
], [480, 1130]),

      regresoIdle: sequence([
        finalFrame("pajaritos", "pajaritos_base_01.png")
      ], [450])
    },
    interaction: {
  replayable: true,
  effect: "hearts",
  handoffAttentionTo: "tele",
  content: contentImage("pajaritos", "Una pequeña carta")
    }
  },

  {
    id: "tele",
    label: "Televisión",
    category: OBJECT_CATEGORY.STORY,
    elementId: "object-tele",
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    animations: {
      idle: sequence([
        finalFrame("tele", "tele_base_01.png"),
        finalFrame("tele", "tele_idle_02.png"),
        finalFrame("tele", "tele_idle_03.png"),
        finalFrame("tele", "tele_idle_02.png"),
        finalFrame("tele", "tele_base_01.png")
      ], [13200, 140, 190, 140, 1800], { loop: true }),

      atencion: sequence([
        finalFrame("tele", "tele_base_01.png"),
        finalFrame("tele", "tele_idle_02.png"),
        finalFrame("tele", "tele_idle_03.png"),
        finalFrame("tele", "tele_atencion_04.png"),
        finalFrame("tele", "tele_idle_03.png"),
        finalFrame("tele", "tele_idle_02.png"),
        finalFrame("tele", "tele_base_01.png")
      ], [140, 150, 190, 90, 190, 150, 700]),

      evento: sequence([
  finalFrame("tele", "tele_base_01.png"),
  finalFrame("tele", "tele_idle_02.png"),
  finalFrame("tele", "tele_idle_03.png"),
  finalFrame("tele", "tele_atencion_04.png"),
  finalFrame("tele", "tele_evento_02.png"),
  finalFrame("tele", "tele_evento_03.png"),
  finalFrame("tele", "tele_evento_04.png"),
  finalFrame("tele", "tele_evento_05.png")
], [140, 150, 190, 90, 500, 4200, 220, 320]),

      guiando: emptySequence(),

      regresoIdle: sequence([
  finalFrame("tele", "tele_evento_03.png"),
  finalFrame("tele", "tele_evento_04.png"),
  finalFrame("tele", "tele_evento_05.png"),
  finalFrame("tele", "tele_evento_02.png"),
  finalFrame("tele", "tele_atencion_04.png"),
  finalFrame("tele", "tele_idle_03.png"),
  finalFrame("tele", "tele_idle_02.png"),
  finalFrame("tele", "tele_base_01.png")
], [2600, 220, 260, 260, 110, 170, 150, 650])
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
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    animations: {
      idle: sequence([
        finalFrame("marco", "marco_base_01.png")
      ], [1000], { loop: true }),

      atencion: sequence([
        finalFrame("marco", "marco_base_01.png"),
        finalFrame("marco", "marco_idle_02.png"),
        finalFrame("marco", "marco_base_01.png"),
        finalFrame("marco", "marco_idle_02.png"),
        finalFrame("marco", "marco_base_01.png")
      ], [220, 140, 240, 140, 750]),

      evento: sequence([
        finalFrame("marco", "marco_base_01.png"),
        finalFrame("marco", "marco_evento_02.png"),
        finalFrame("marco", "marco_evento_03.png"),
        finalFrame("marco", "marco_evento_04.png"),
        finalFrame("marco", "marco_evento_05.png"),
        finalFrame("marco", "marco_base_01.png")
      ], [220, 1250, 1250, 1250, 1450, 550]),

      guiando: emptySequence(),

      regresoIdle: sequence([
        finalFrame("marco", "marco_base_01.png")
      ], [350])
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
    id: "calendario",
    label: "Calendario",
    category: OBJECT_CATEGORY.STORY,
    elementId: "object-calendario",
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    animations: {
      idle: sequence([
        finalFrame("calendario", "calendario_base_01.png"),
        finalFrame("calendario", "calendario_idle_02.png"),
        finalFrame("calendario", "calendario_base_01.png")
      ], [15100, 230, 1700], { loop: true }),

      atencion: sequence([
        finalFrame("calendario", "calendario_base_01.png"),
        finalFrame("calendario", "calendario_idle_02.png"),
        finalFrame("calendario", "calendario_atencion_02.png"),
        finalFrame("calendario", "calendario_atencion_03.png"),
        finalFrame("calendario", "calendario_atencion_02.png"),
        finalFrame("calendario", "calendario_idle_02.png"),
        finalFrame("calendario", "calendario_base_01.png")
      ], [180, 200, 230, 550, 230, 200, 750]),

      evento: sequence([
        finalFrame("calendario", "calendario_base_01.png"),
        finalFrame("calendario", "calendario_idle_02.png"),
        finalFrame("calendario", "calendario_atencion_02.png"),
        finalFrame("calendario", "calendario_atencion_03.png"),
        finalFrame("calendario", "calendario_atencion_02.png"),
        finalFrame("calendario", "calendario_idle_02.png"),
        finalFrame("calendario", "calendario_base_01.png")
      ], [200, 220, 280, 900, 280, 220, 550]),

      guiando: emptySequence(),

      regresoIdle: sequence([
        finalFrame("calendario", "calendario_base_01.png")
      ], [350])
    },
    interaction: {
      replayable: true,
      effect: "confetti",
      content: contentImage("calendario", "Nuestra fecha especial")
    }
  },

  {
    id: "pollitos",
    label: "Pollitos",
    category: OBJECT_CATEGORY.STORY,
    elementId: "object-pollitos",
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    animations: {
      idle: sequence([
        finalFrame("pollitos", "pollito_base_01.png"),
        finalFrame("pollitos", "pollito_idle_02.png"),
        finalFrame("pollitos", "pollito_base_01.png")
      ], [10600, 250, 1700], { loop: true }),

      atencion: sequence([
        finalFrame("pollitos", "pollito_base_01.png"),
        finalFrame("pollitos", "pollito_atencion_02.png"),
        finalFrame("pollitos", "pollito_atencion_03.png"),
        finalFrame("pollitos", "pollito_atencion_04.png"),
        finalFrame("pollitos", "pollito_atencion_03.png"),
        finalFrame("pollitos", "pollito_atencion_02.png"),
        finalFrame("pollitos", "pollito_base_01.png")
      ], [180, 220, 280, 850, 280, 220, 750]),

      evento: sequence([
        finalFrame("pollitos", "pollito_base_01.png"),
        finalFrame("pollitos", "pollito_evento_02.png"),
        finalFrame("pollitos", "pollito_evento_03.png"),
        finalFrame("pollitos", "pollito_evento_04.png"),
        finalFrame("pollitos", "pollito_evento_05.png"),
        finalFrame("pollitos", "pollito_evento_06.png"),
        finalFrame("pollitos", "pollito_evento_07.png"),
        finalFrame("pollitos", "pollito_evento_08.png")
      ], [180, 220, 220, 240, 260, 300, 420, 950]),

      guiando: sequence([
        finalFrame("pollitos", "pollito_evento_08.png"),
        finalFrame("pollitos", "pollito_final_02.png"),
        finalFrame("pollitos", "pollito_base_01.png")
      ], [350, 950, 550]),

      regresoIdle: sequence([
        finalFrame("pollitos", "pollito_base_01.png")
      ], [350])
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
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    animations: {
      idle: sequence([
        finalFrame("sobre", "sobre_base_01.png"),
        finalFrame("sobre", "sobre_idle_02.png"),
        finalFrame("sobre", "sobre_base_01.png")
      ], [12600, 230, 1800], { loop: true }),

      atencion: sequence([
        finalFrame("sobre", "sobre_base_01.png"),
        finalFrame("sobre", "sobre_idle_02.png"),
        finalFrame("sobre", "sobre_atencion_02.png"),
        finalFrame("sobre", "sobre_atencion_03.png"),
        finalFrame("sobre", "sobre_atencion_04.png"),
        finalFrame("sobre", "sobre_atencion_05.png"),
        finalFrame("sobre", "sobre_atencion_04.png"),
        finalFrame("sobre", "sobre_atencion_03.png"),
        finalFrame("sobre", "sobre_atencion_02.png"),
        finalFrame("sobre", "sobre_idle_02.png"),
        finalFrame("sobre", "sobre_base_01.png")
      ], [170, 170, 190, 210, 230, 340, 230, 210, 190, 170, 750]),

      evento: sequence([
        finalFrame("sobre", "sobre_base_01.png"),
        finalFrame("sobre", "sobre_evento_02.png"),
        finalFrame("sobre", "sobre_evento_03.png"),
        finalFrame("sobre", "sobre_evento_04.png"),
        finalFrame("sobre", "sobre_evento_05.png"),
        finalFrame("sobre", "sobre_evento_06.png")
      ], [250, 320, 460, 620, 850, 1300]),

      guiando: emptySequence(),

      regresoIdle: sequence([
        finalFrame("sobre", "sobre_base_01.png")
      ], [500])
    },
    interaction: {
      replayable: true,
      effect: "hearts",
      content: contentImage("sobre", "Mi carta para ti")
    }
  },

  // OBJETOS AMBIENTALES. Perrito y planta conservan por ahora
  // los frames de muestra; después se cambian por tus dibujos finales.
  {
    id: "planta",
    label: "Planta",
    category: OBJECT_CATEGORY.AMBIENT,
    elementId: "object-planta",
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    ambient: {
      mode: "interactive",
      autoEnabled: true,
      minDelay: 17000,
      maxDelay: 30000
    },
    animations: {
  idle: sequence([
    finalFrame("planta", "planta_base_01.png")
  ], [1000], { loop: true }),

  ambiente: sequence([
    finalFrame("planta", "planta_base_01.png"),
    finalFrame("planta", "planta_ambiente_02.png"),
    finalFrame("planta", "planta_ambiente_03.png"),
    finalFrame("planta", "planta_ambiente_04.png"),
    finalFrame("planta", "planta_ambiente_05.png"),
    finalFrame("planta", "planta_ambiente_04.png"),
    finalFrame("planta", "planta_ambiente_03.png"),
    finalFrame("planta", "planta_ambiente_02.png"),
    finalFrame("planta", "planta_base_01.png")
  ], [140, 190, 190, 210, 340, 210, 190, 190, 600]),

  evento: sequence([
    finalFrame("planta", "planta_base_01.png"),
    finalFrame("planta", "planta_evento_02.png"),
    finalFrame("planta", "planta_evento_03.png"),
    finalFrame("planta", "planta_evento_04.png")
  ], [160, 240, 280, 700]),

  regresoIdle: sequence([
    finalFrame("planta", "planta_evento_03.png"),
    finalFrame("planta", "planta_evento_02.png"),
    finalFrame("planta", "planta_base_01.png")
  ], [240, 240, 500])
},
interaction: {
  replayable: true,
  effect: null,
  content: {
    type: "dialogue",
    title: "Nuestro amor también crece 🌱",
    image: null,
    text: "Como esta plantita, quiero seguir creciendo contigo, cuidándonos y floreciendo juntas.",
        closeOnBackdrop: false
  }
}
},

{
  id: "perrito",
    label: "Perrito",
    category: OBJECT_CATEGORY.AMBIENT,
    elementId: "object-perrito",
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    ambient: {
      mode: "interactive",
      autoEnabled: true,
      minDelay: 15000,
      maxDelay: 28000
    },
    animations: {
  /* Ojos abiertos normalmente y parpadeo rápido */
  idle: sequence([
    finalFrame("perrito", "perrito_ambiente_03.png"),
    finalFrame("perrito", "perrito_idle_02.png"),
    finalFrame("perrito", "perrito_ambiente_03.png")
  ], [7200, 150, 1500], { loop: true }),

  /* Parpadeo doble ocasional */
  ambiente: sequence([
    finalFrame("perrito", "perrito_ambiente_03.png"),
    finalFrame("perrito", "perrito_idle_02.png"),
    finalFrame("perrito", "perrito_base_01.png"),
    finalFrame("perrito", "perrito_ambiente_03.png")
  ], [180, 110, 110, 700]),

  /* Reacción cuando le dan clic */
  evento: sequence([
    finalFrame("perrito", "perrito_ambiente_03.png"),
    finalFrame("perrito", "perrito_ambiente_02.png"),
    finalFrame("perrito", "perrito_ambiente_03.png"),
    finalFrame("perrito", "perrito_ambiente_04.png")
  ], [180, 260, 280, 900]),

  /* Regresa a la mirada normal */
  regresoIdle: sequence([
    finalFrame("perrito", "perrito_ambiente_03.png"),
    finalFrame("perrito", "perrito_ambiente_02.png"),
    finalFrame("perrito", "perrito_ambiente_03.png")
  ], [220, 220, 500])
},

interaction: {
  replayable: true,
  effect: null,
  content: {
    type: "dialogue",
    title: "Una serie que me hace sonreír 🐶",
    image: null,
    text: "Aquí puedes escribir el mensaje que quieras mostrar cuando toque el perrito.",
    closeOnBackdrop: false
  }
}
  },

  {
    id: "tocadiscos",
    label: "Tocadiscos",
    category: OBJECT_CATEGORY.AMBIENT,
    elementId: "object-tocadiscos",
    hitTest: { mode: "alpha", alphaThreshold: 18 },
    ambient: {
      mode: "persistentAudio",
      autoEnabled: false,
      oneWay: true
    },
    audio: {
  tracks: [
    "./assets/sonidos/cancion_01.mp3",
    "./assets/sonidos/cancion_02.mp3",
    "./assets/sonidos/cancion_03.mp3",
    "./assets/sonidos/cancion_04.mp3"
  ],
  shuffle: true,
  loopPlaylist: true,
  volume: 0.28
},
    animations: {
      // Antes del primer clic: permanece quieto y cada pocos segundos
      // reproduce el destello de atención.
      idle: sequence([
        finalFrame("tocadiscos", "disco_base_01.png"),
        finalFrame("tocadiscos", "disco_atencion_02.png"),
        finalFrame("tocadiscos", "disco_atencion_03.png"),
        finalFrame("tocadiscos", "disco_atencion_04.png"),
        finalFrame("tocadiscos", "disco_base_01.png")
      ], [4800, 180, 180, 330, 4200], { loop: true }),

      evento: sequence([
        finalFrame("tocadiscos", "disco_base_01.png"),
        finalFrame("tocadiscos", "disco_evento_02.png"),
        finalFrame("tocadiscos", "disco_evento_03.png"),
        finalFrame("tocadiscos", "disco_evento_04.png"),
        finalFrame("tocadiscos", "disco_evento_05.png"),
        finalFrame("tocadiscos", "disco_evento_06.png")
      ], [220, 190, 190, 190, 190, 300]),

      // Después del primer clic, el disco queda girando siempre.
      activo: sequence([
        finalFrame("tocadiscos", "disco_evento_02.png"),
        finalFrame("tocadiscos", "disco_evento_03.png"),
        finalFrame("tocadiscos", "disco_evento_04.png"),
        finalFrame("tocadiscos", "disco_evento_05.png"),
        finalFrame("tocadiscos", "disco_evento_06.png")
      ], [190, 190, 190, 190, 190], { loop: true }),

      regresoIdle: sequence([
        finalFrame("tocadiscos", "disco_base_01.png")
      ], [350])
    },
    interaction: {
      replayable: false,
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
