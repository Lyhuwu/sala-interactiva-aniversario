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
    const count = this.reducedMotion ? 8 : 24;
    const shapes = type === "confetti" ? ["rect"] : ["heart"];

    for (let index = 0; index < count; index += 1) {
      this.particles.push({
        x: origin.x + (Math.random() - 0.5) * 110,
        y: origin.y + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 240,
        vy: -140 - Math.random() * 240,
        gravity: 360 + Math.random() * 160,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 5,
        size: 12 + Math.random() * 18,
        life: 0,
        maxLife: 1.2 + Math.random() * 0.8,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        color: ["#f4a9c2", "#ffd7a8", "#fff0b8", "#d8b9ef"][index % 4]
      });
    }

    if (this.rafId === null) {
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame((time) => this.tick(time));
    }

    return new Promise((resolve) => window.setTimeout(resolve, this.reducedMotion ? 500 : 1100));
  }

  tick(time) {
    const delta = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles = this.particles.filter((particle) => {
      particle.life += delta;
      if (particle.life >= particle.maxLife) return false;
      particle.vy += particle.gravity * delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.rotation += particle.spin * delta;

      const alpha = 1 - (particle.life / particle.maxLife);
      this.context.save();
      this.context.translate(particle.x, particle.y);
      this.context.rotate(particle.rotation);
      this.context.globalAlpha = alpha;
      this.context.fillStyle = particle.color;

      if (particle.shape === "heart") {
        const size = particle.size;
        this.context.beginPath();
        this.context.moveTo(0, size * 0.3);
        this.context.bezierCurveTo(-size, -size * 0.35, -size * 0.55, -size, 0, -size * 0.45);
        this.context.bezierCurveTo(size * 0.55, -size, size, -size * 0.35, 0, size * 0.3);
        this.context.fill();
      } else {
        this.context.fillRect(-particle.size / 2, -particle.size / 3, particle.size, particle.size * 0.65);
      }

      this.context.restore();
      return true;
    });

    if (this.particles.length > 0) {
      this.rafId = requestAnimationFrame((nextTime) => this.tick(nextTime));
    } else {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.rafId = null;
    }
  }

  clear() {
    this.particles = [];
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
