const PALETTES = Object.freeze({
  hearts: ["#ff8fb8", "#ffc6dc", "#ffe49a", "#fff8ef", "#cdb7ff"],
  confetti: ["#ff9fc4", "#ffd67d", "#aee7d8", "#b9c9ff", "#f7b7ff"]
});

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export class EffectsController {
  constructor(canvas, reducedMotion = false) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.reducedMotion = reducedMotion;
    this.particles = [];
    this.rafId = null;
    this.lastTime = 0;
  }

  trigger(type, origin = { x: 540, y: 960 }) {
    if (!type) return Promise.resolve({ skipped: true });

    const isConfetti = type === "confetti";
    const count = this.reducedMotion ? 10 : isConfetti ? 36 : 28;
    const palette = isConfetti
      ? PALETTES.confetti
      : PALETTES.hearts;

    const shapes = isConfetti
      ? ["ribbon", "ribbon", "circle", "sparkle", "heart"]
      : ["heart", "heart", "heart", "sparkle", "circle"];

    for (let index = 0; index < count; index += 1) {
      this.particles.push({
        x: origin.x + randomBetween(-55, 55),
        y: origin.y + randomBetween(-25, 25),
        vx: randomBetween(-210, 210),
        vy: randomBetween(-390, -190),
        gravity: randomBetween(300, 470),
        drag: randomBetween(0.982, 0.994),
        rotation: randomBetween(0, Math.PI * 2),
        spin: randomBetween(-5.5, 5.5),
        size: randomBetween(
          isConfetti ? 8 : 10,
          isConfetti ? 17 : 20
        ),
        life: 0,
        maxLife: randomBetween(1.35, 2.05),
        shape: shapes[
          Math.floor(Math.random() * shapes.length)
        ],
        color: palette[index % palette.length],
        wobble: randomBetween(0, Math.PI * 2),
        wobbleSpeed: randomBetween(5, 9)
      });
    }

    if (this.rafId === null) {
      this.lastTime = performance.now();

      this.rafId = requestAnimationFrame((time) =>
        this.tick(time)
      );
    }

    return new Promise((resolve) =>
      window.setTimeout(
        resolve,
        this.reducedMotion ? 550 : 1200
      )
    );
  }

  tick(time) {
    const delta = Math.min(
      0.05,
      (time - this.lastTime) / 1000
    );

    this.lastTime = time;

    this.context.clearRect(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    this.particles = this.particles.filter((particle) => {
      particle.life += delta;

      if (particle.life >= particle.maxLife) {
        return false;
      }

      particle.vx *= Math.pow(
        particle.drag,
        delta * 60
      );

      particle.vy += particle.gravity * delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.rotation += particle.spin * delta;
      particle.wobble += particle.wobbleSpeed * delta;

      const progress =
        particle.life / particle.maxLife;

      const fadeIn = Math.min(
        1,
        progress * 7
      );

      const fadeOut = Math.max(
        0,
        1 - progress
      );

      const alpha = fadeIn * fadeOut;

      const pulse =
        1 + Math.sin(particle.wobble) * 0.08;

      this.context.save();

      this.context.translate(
        particle.x +
          Math.sin(particle.wobble) * 3,
        particle.y
      );

      this.context.rotate(particle.rotation);
      this.context.scale(pulse, pulse);
      this.context.globalAlpha = alpha;
      this.context.fillStyle = particle.color;
      this.context.shadowColor = particle.color;

      this.context.shadowBlur =
        particle.shape === "sparkle"
          ? 12
          : 5;

      this.drawParticle(
        particle.shape,
        particle.size
      );

      this.context.restore();

      return true;
    });

    if (this.particles.length > 0) {
      this.rafId = requestAnimationFrame(
        (nextTime) => this.tick(nextTime)
      );
    } else {
      this.context.clearRect(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );

      this.rafId = null;
    }
  }

  drawParticle(shape, size) {
    if (shape === "heart") {
      this.context.beginPath();

      this.context.moveTo(
        0,
        size * 0.34
      );

      this.context.bezierCurveTo(
        -size,
        -size * 0.28,
        -size * 0.56,
        -size,
        0,
        -size * 0.46
      );

      this.context.bezierCurveTo(
        size * 0.56,
        -size,
        size,
        -size * 0.28,
        0,
        size * 0.34
      );

      this.context.fill();
      return;
    }

    if (shape === "sparkle") {
      this.context.beginPath();

      this.context.moveTo(
        0,
        -size
      );

      this.context.lineTo(
        size * 0.22,
        -size * 0.22
      );

      this.context.lineTo(
        size,
        0
      );

      this.context.lineTo(
        size * 0.22,
        size * 0.22
      );

      this.context.lineTo(
        0,
        size
      );

      this.context.lineTo(
        -size * 0.22,
        size * 0.22
      );

      this.context.lineTo(
        -size,
        0
      );

      this.context.lineTo(
        -size * 0.22,
        -size * 0.22
      );

      this.context.closePath();
      this.context.fill();
      return;
    }

    if (shape === "circle") {
      this.context.beginPath();

      this.context.arc(
        0,
        0,
        size * 0.42,
        0,
        Math.PI * 2
      );

      this.context.fill();
      return;
    }

    this.context.fillRect(
      -size * 0.52,
      -size * 0.18,
      size,
      size * 0.36
    );
  }

  clear() {
    this.particles = [];

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = null;

    this.context.clearRect(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
  }
}
