export class ModalController {
  constructor() {
    this.layer = document.getElementById("modal-layer");
    this.backdrop = document.getElementById("modal-backdrop");
    this.modal = document.getElementById("content-modal");
    this.closeButton = document.getElementById("modal-close");
    this.title = document.getElementById("modal-title");
    this.image = document.getElementById("modal-image");
    this.text = document.getElementById("modal-text");
    this.toast = document.getElementById("toast");
    this.liveRegion = document.getElementById("live-region");
    this.pendingResolve = null;
    this.toastTimer = null;
    this.pendingToastResolve = null;
    this.closeOnBackdrop = false;

    this.closeButton.addEventListener("click", () => this.close());
    this.backdrop.addEventListener("click", () => {
      if (this.closeOnBackdrop) this.close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.isOpen) this.close();
    });
  }

  get isOpen() {
    return !this.layer.hidden;
  }

  async open(content) {
    if (!content || this.isOpen) return { skipped: true };

    this.title.textContent = content.title ?? "";
    this.text.textContent = content.text ?? "";
    this.closeOnBackdrop = Boolean(content.closeOnBackdrop);

    if (content.image) {
      this.image.src = new URL(content.image, document.baseURI).href;
      this.image.alt = content.title ?? "Contenido";
      this.image.hidden = false;
    } else {
      this.image.removeAttribute("src");
      this.image.alt = "";
      this.image.hidden = true;
    }

    this.layer.hidden = false;
    requestAnimationFrame(() => this.layer.classList.add("is-open"));
    this.closeButton.focus();
    this.announce(content.title ?? "Contenido abierto");

    return new Promise((resolve) => {
      this.pendingResolve = resolve;
    });
  }

  close() {
    if (!this.isOpen) return;
    this.layer.classList.remove("is-open");

    window.setTimeout(() => {
      this.layer.hidden = true;
      this.image.removeAttribute("src");
      this.text.textContent = "";
      const resolve = this.pendingResolve;
      this.pendingResolve = null;
      resolve?.({ closed: true });
      this.announce("Contenido cerrado");
    }, 210);
  }

  showToast(message, duration = 2300) {
    clearTimeout(this.toastTimer);
    this.pendingToastResolve?.({ replaced: true });
    this.pendingToastResolve = null;

    this.toast.textContent = message;
    this.toast.hidden = false;
    requestAnimationFrame(() => this.toast.classList.add("is-visible"));
    this.announce(message);

    return new Promise((resolve) => {
      this.pendingToastResolve = resolve;
      this.toastTimer = window.setTimeout(() => {
        this.toast.classList.remove("is-visible");
        window.setTimeout(() => {
          this.toast.hidden = true;
          const pending = this.pendingToastResolve;
          this.pendingToastResolve = null;
          pending?.({ closed: true });
        }, 210);
      }, duration);
    });
  }

  announce(message) {
    this.liveRegion.textContent = "";
    requestAnimationFrame(() => {
      this.liveRegion.textContent = message;
    });
  }
}
