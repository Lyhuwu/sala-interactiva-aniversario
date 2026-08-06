export class AssetLoader {
  constructor() {
    this.images = new Map();
    this.failed = new Set();
    this.alphaMasks = new Map();
  }

  resolve(path) {
    return new URL(path, document.baseURI).href;
  }

  collect(config, objects) {
  collect(config, objects) {
  const paths = new Set([config.background]);

  for (const object of objects) {
    for (const animation of Object.values(object.animations ?? {})) {
      for (const frame of animation.frames ?? []) {
        paths.add(frame);
      }
    }

    const content = object.interaction?.content;

    if (content?.image) {
      paths.add(content.image);
    }

    for (const page of content?.pages ?? []) {
      if (page) {
        paths.add(page);
      }
    }
  }

  return [...paths];
}

  async loadAll(paths, onProgress = () => {}) {
    let finished = 0;
    const total = Math.max(paths.length, 1);

    await Promise.all(paths.map(async (path) => {
      await this.loadImage(path);
      finished += 1;
      onProgress({ finished, total, percentage: Math.round((finished / total) * 100), path });
    }));
  }

  async loadImage(path) {
    const url = this.resolve(path);
    if (this.images.has(url)) return this.images.get(url);
    if (this.failed.has(url)) return null;

    const image = new Image();
    image.decoding = "async";

    const loaded = new Promise((resolve) => {
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
    });

    image.src = url;
    const success = await loaded;

    if (!success) {
      console.warn(`[AssetLoader] No se pudo cargar: ${path}`);
      this.failed.add(url);
      return null;
    }

    if (typeof image.decode === "function") {
      try {
        await image.decode();
      } catch (error) {
        console.warn(`[AssetLoader] La imagen cargó, pero decode() falló: ${path}`, error);
      }
    }

    this.images.set(url, image);
    return image;
  }

  get(path) {
    if (!path) return null;
    return this.images.get(this.resolve(path)) ?? null;
  }

  getFirstValidFrame(objectConfig, animationName = "idle") {
    const frames = objectConfig.animations?.[animationName]?.frames ?? [];
    for (const frame of frames) {
      const image = this.get(frame);
      if (image) return image;
    }

    const idleFrames = objectConfig.animations?.idle?.frames ?? [];
    for (const frame of idleFrames) {
      const image = this.get(frame);
      if (image) return image;
    }

    return null;
  }

  getValidFrames(objectConfig, animationName) {
    const configured = objectConfig.animations?.[animationName]?.frames ?? [];
    const valid = configured
      .map((path, originalIndex) => ({ image: this.get(path), originalIndex, path }))
      .filter((entry) => Boolean(entry.image));

    if (valid.length > 0) return valid;

    const fallback = this.getFirstValidFrame(objectConfig, "idle");
    return fallback ? [{ image: fallback, originalIndex: 0, path: "idle-fallback" }] : [];
  }

  createAlphaMask(objectConfig) {
    if (objectConfig.hitTest?.mode !== "alpha") return null;

    const image = this.getFirstValidFrame(objectConfig, "idle");
    if (!image || !image.naturalWidth || !image.naturalHeight) return null;

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    try {
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const mask = { width: canvas.width, height: canvas.height, pixels };
      this.alphaMasks.set(objectConfig.id, mask);
      return mask;
    } catch (error) {
      console.warn(`[AssetLoader] No fue posible crear máscara alfa para ${objectConfig.id}; se usará el rectángulo.`, error);
      return null;
    }
  }

  createAllAlphaMasks(objects) {
    for (const object of objects) this.createAlphaMask(object);
  }

  getAlphaMask(objectId) {
    return this.alphaMasks.get(objectId) ?? null;
  }
}
