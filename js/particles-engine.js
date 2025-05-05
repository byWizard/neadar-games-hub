// particles-engine.js
import { width, height, particles } from './particles-state.js';
import { Particle } from './particle-class.js';

export function resizeCanvas() {
  const canvas = document.getElementById("particles");
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

export function initParticles(count = 150) {
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }
}

export function animate() {
  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, width, height);

  for (let particle of particles) {
    particle.update();
    particle.draw(ctx);

    // Линии между близкими частицами
    for (let other of particles) {
      const dx = particle.x - other.x;
      const dy = particle.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 100) {
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(other.x, other.y);
        ctx.strokeStyle = `rgba(255, 255, 255, 0.05)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(animate);
}
