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
    this.isClosing = false;

    this.pages = [];
    this.currentPage = 0;
    this.currentTitle = "";

    this.createPageNavigation();

    this.closeButton.addEventListener("click", () => {
      this.close();
    });

    this.backdrop.addEventListener("click", () => {
      if (this.closeOnBackdrop) {
        this.close();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (!this.isOpen) return;

      if (event.key === "Escape") {
        this.close();
        return;
      }

      if (this.pages.length <= 1) return;

      if (event.key === "ArrowLeft") {
        this.showPage(this.currentPage - 1);
      }

      if (event.key === "ArrowRight") {
        if (this.currentPage === this.pages.length - 1) {
          this.close();
        } else {
          this.showPage(this.currentPage + 1);
        }
      }
    });
  }

  createPageNavigation() {
    this.pageNavigation = document.createElement("div");
    this.pageNavigation.className = "modal-pages-nav";
    this.pageNavigation.hidden = true;

    this.previousButton = document.createElement("button");
    this.previousButton.type = "button";
    this.previousButton.className =
      "modal-page-button modal-page-previous";
    this.previousButton.textContent = "← Anterior";

    this.pageCounter = document.createElement("span");
    this.pageCounter.className = "modal-page-counter";
    this.pageCounter.setAttribute("aria-live", "polite");

    this.nextButton = document.createElement("button");
    this.nextButton.type = "button";
    this.nextButton.className =
      "modal-page-button modal-page-next";
    this.nextButton.textContent = "Siguiente →";

    this.pageNavigation.append(
      this.previousButton,
      this.pageCounter,
      this.nextButton
    );

    this.text.insertAdjacentElement(
      "afterend",
      this.pageNavigation
    );

    this.previousButton.addEventListener("click", () => {
      this.showPage(this.currentPage - 1);
    });

    this.nextButton.addEventListener("click", () => {
      const isLastPage =
        this.currentPage === this.pages.length - 1;

      if (isLastPage) {
        this.close();
        return;
      }

      this.showPage(this.currentPage + 1);
    });
  }

  get isOpen() {
    return !this.layer.hidden;
  }

  async open(content) {
    if (!content || this.isOpen || this.isClosing) {
      return { skipped: true };
    }

    this.currentTitle = content.title ?? "";
    this.title.textContent = this.currentTitle;
    this.text.textContent = content.text ?? "";
    this.closeOnBackdrop = Boolean(
      content.closeOnBackdrop
    );

    this.pages = Array.isArray(content.pages)
      ? content.pages.filter(
          (page) =>
            typeof page === "string" &&
            page.trim().length > 0
        )
      : [];

    this.currentPage = 0;

    if (this.pages.length > 0) {
      this.pageNavigation.hidden = false;

      this.showPage(0, {
        resetScroll: false
      });
    } else {
      this.pageNavigation.hidden = true;

      if (content.image) {
        this.image.src = new URL(
          content.image,
          document.baseURI
        ).href;

        this.image.alt =
          this.currentTitle || "Contenido";

        this.image.hidden = false;
      } else {
        this.clearImage();
      }
    }

    this.layer.hidden = false;

    requestAnimationFrame(() => {
      this.layer.classList.add("is-open");
    });

    this.closeButton.focus();

    this.announce(
      this.currentTitle || "Contenido abierto"
    );

    return new Promise((resolve) => {
      this.pendingResolve = resolve;
    });
  }

  showPage(
    index,
    {
      resetScroll = true
    } = {}
  ) {
    if (this.pages.length === 0) return;

    const safeIndex = Math.max(
      0,
      Math.min(index, this.pages.length - 1)
    );

    this.currentPage = safeIndex;

    const pagePath =
      this.pages[this.currentPage];

    this.image.src = new URL(
      pagePath,
      document.baseURI
    ).href;

    this.image.alt =
      `${this.currentTitle || "Carta"}, ` +
      `página ${this.currentPage + 1} ` +
      `de ${this.pages.length}`;

    this.image.hidden = false;

    this.updatePageNavigation();

    if (resetScroll) {
      this.modal.scrollTop = 0;
    }

    this.announce(
      `Página ${this.currentPage + 1} ` +
      `de ${this.pages.length}`
    );
  }

  updatePageNavigation() {
    const isFirst =
      this.currentPage === 0;

    const isLast =
      this.currentPage ===
      this.pages.length - 1;

    this.previousButton.disabled = isFirst;

    this.pageCounter.textContent =
      `${this.currentPage + 1} / ` +
      `${this.pages.length}`;

    this.nextButton.textContent = isLast
      ? "Terminé de leer ♡"
      : "Siguiente →";

    this.nextButton.setAttribute(
      "aria-label",
      isLast
        ? "Terminé de leer y cerrar"
        : "Ver página siguiente"
    );
  }

  clearImage() {
    this.image.removeAttribute("src");
    this.image.alt = "";
    this.image.hidden = true;
  }

  close() {
    if (!this.isOpen || this.isClosing) {
      return;
    }

    this.isClosing = true;

    this.layer.classList.remove("is-open");

    window.setTimeout(() => {
      this.layer.hidden = true;

      this.clearImage();

      this.pageNavigation.hidden = true;
      this.pages = [];
      this.currentPage = 0;
      this.currentTitle = "";

      this.title.textContent = "";
      this.text.textContent = "";
      this.modal.scrollTop = 0;

      this.isClosing = false;

      const resolve = this.pendingResolve;
      this.pendingResolve = null;

      resolve?.({
        closed: true
      });

      this.announce("Contenido cerrado");
    }, 210);
  }

  showToast(message, duration = 2300) {
    clearTimeout(this.toastTimer);

    this.pendingToastResolve?.({
      replaced: true
    });

    this.pendingToastResolve = null;

    this.toast.textContent = message;
    this.toast.hidden = false;

    requestAnimationFrame(() => {
      this.toast.classList.add(
        "is-visible"
      );
    });

    this.announce(message);

    return new Promise((resolve) => {
      this.pendingToastResolve = resolve;

      this.toastTimer = window.setTimeout(
        () => {
          this.toast.classList.remove(
            "is-visible"
          );

          window.setTimeout(() => {
            this.toast.hidden = true;

            const pending =
              this.pendingToastResolve;

            this.pendingToastResolve = null;

            pending?.({
              closed: true
            });
          }, 210);
        },
        duration
      );
    });
  }

  announce(message) {
    this.liveRegion.textContent = "";

    requestAnimationFrame(() => {
      this.liveRegion.textContent =
        message;
    });
  }
      }
